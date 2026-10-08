import React, { useState, useEffect, useRef } from "react";
import MarkdownIt from "markdown-it";
import { useRouter, useParams, usePathname, useSearchParams } from "next/navigation";
import { FolderOpen, Clock, Maximize2, Languages, User, ListOrdered, CheckCircle2, ClipboardCheck, Hourglass } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import PageSection from "@/components/common/PageSection";
import CourseStats from "./CourseStats";
import CourseContentList from "./CourseContentList";
import CourseTextOrPdf from "./CourseTextOrPdf";
import FeedbackForm from "./FeedbackForm";
import LayoutShell from "@/components/layout/LayoutShell";
import PageContainer from "@/components/layout/PageContainer";
import { useAppDispatch } from "@/store/hooks";
import { markModuleAsRead, initializeModuleReadState, loadCourseById } from "@/features/courses/coursesSlice";
import { markModuleProgress, markModuleVideoProgress, fetchUserCourseProgress, startCourse } from "@/features/courses/coursesAPI";
import { getLatestSubmission, checkPendingReattemptRequest, sendReattemptRequest } from "../quizSubmissionAPI";
import { getCurrentUserId } from "@/lib/auth";
import telemetryService from '@/services/telemetry';
import { getSocket } from '@/services/socket';

const md = new MarkdownIt({ html: true, breaks: true });

const getReattemptMarkerKey = (userId, courseId) => `quiz-reattempt:${Number(userId)}:${Number(courseId)}`;

/**
 * Module whose quiz the learner is dealing with: the current module when its content is read but its
 * quiz is not passed yet, otherwise the last module with a quiz (for showing the latest score).
 */
const pickQuizModuleId = (moduleStates) => {
  const states = Array.isArray(moduleStates) ? moduleStates : [];
  const pending = states.find((s) => s.has_quiz && s.content_completed && !s.completed);
  if (pending) return pending.module_id;
  const withQuiz = states.filter((s) => s.has_quiz);
  return withQuiz.length ? withQuiz[withQuiz.length - 1].module_id : null;
};

const allModulesDone = (moduleStates) =>
  Array.isArray(moduleStates) && moduleStates.length > 0 && moduleStates.every((s) => s.completed);

const normalizeReattemptMarker = (value) => {
  if (!value) return null;
  if (typeof value === 'string') {
    // Backward compatibility with previous marker format: "pending" | "approved".
    if (value === 'pending' || value === 'approved') return { status: value, forAttempt: null };
    return null;
  }
  const status = value?.status;
  if (status !== 'pending' && status !== 'approved') return null;
  const parsedForAttempt = Number(value?.forAttempt);
  const forAttempt = Number.isFinite(parsedForAttempt) && parsedForAttempt > 0 ? parsedForAttempt : null;
  return { status, forAttempt };
};

const readReattemptMarker = (userId, courseId) => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(getReattemptMarkerKey(userId, courseId));
    if (!raw) return null;
    try {
      return normalizeReattemptMarker(JSON.parse(raw));
    } catch {
      return normalizeReattemptMarker(raw);
    }
  } catch {
    return null;
  }
};

const writeReattemptMarker = (userId, courseId, value) => {
  if (typeof window === 'undefined') return;
  try {
    if (value == null) localStorage.removeItem(getReattemptMarkerKey(userId, courseId));
    else localStorage.setItem(getReattemptMarkerKey(userId, courseId), JSON.stringify(normalizeReattemptMarker(value)));
  } catch {
    // Ignore storage errors and continue with API-driven state.
  }
};

export default function CoursesDetailPage({ category, course, selectedModule, initialLanguage }) {
  const courseLanguages = course?.languages ?? course?.course_language ?? [];
  const [selectedLanguage, setSelectedLanguage] = useState(
    () => initialLanguage || courseLanguages[0] || "English"
  );
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();
  const moduleIdFromPath = params?.moduleId;
  const [showFullReadingView, setShowFullReadingView] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showFeedbackSuccess, setShowFeedbackSuccess] = useState(false);
  const [courseProgress, setCourseProgress] = useState({ progressStatus: null, quizScore: null, hasPendingReattempt: false, hasRejectedReattempt: false, hasApprovedReattempt: false, needsFeedbackSubmission: false, needsReattemptRequest: false, latestAttemptNumber: null, maxAttempt: null, progressPercentage: 0, moduleStates: [] });
  const [reattemptRequestLoading, setReattemptRequestLoading] = useState(false);
  const [reattemptRequestError, setReattemptRequestError] = useState(null);
  const skipNextProgressUpdate = useRef(false);
  const [pdfPreviewBlobUrl, setPdfPreviewBlobUrl] = useState('');
  const [pdfPreviewLoading, setPdfPreviewLoading] = useState(false);
  const videoRef = useRef(null);
  const lastVideoHeartbeatSecRef = useRef(0);
  const moduleEnterTimeRef = useRef(null); // tracks when user entered current module
  const modulePausedAtRef = useRef(null);  
  const modulePausedMsRef = useRef(0);    
  const pdfNewTabRef = useRef(false); // when true, keep timer running while tab is hidden (PDF opened in new tab)
  const hasStartedRef = useRef(false); // prevents duplicate In_progress calls per session

  // If initialLanguage (e.g. English) is not actually available for this course
  // but the backend reports a single language (e.g. Gujarati), automatically
  // switch the selection to the first available course language.
  useEffect(() => {
    if (!Array.isArray(courseLanguages) || courseLanguages.length === 0) return;
    const selectedNorm = (selectedLanguage || "").trim().toLowerCase();
    const hasSelected = courseLanguages.some(
      (l) => (l || "").trim().toLowerCase() === selectedNorm
    );
    if (!hasSelected) {
      setSelectedLanguage(courseLanguages[0]);
    }
  }, [courseLanguages, selectedLanguage]);

  // If user comes from course card with ?feedback=1, open feedback form directly
  const feedbackFromQuery = searchParams.get('feedback');
  useEffect(() => {
    if (feedbackFromQuery === '1') {
      setShowFeedbackForm(true);
    }
  }, [feedbackFromQuery]);

  if (!course) return <div className="p-8">Course not found.</div>;

  // Show only modules, quiz, and feedback for the selected language
  const allModulesList = Array.isArray(course.modulesList) ? course.modulesList : [];
  const selectedLangNorm = (selectedLanguage || "").trim().toLowerCase();
  const filteredModules = allModulesList.filter(
    (m) => (m.language || "").trim().toLowerCase() === selectedLangNorm
  );
  const contents =
    filteredModules.length > 0
      ? filteredModules
      : allModulesList.length > 0 && courseLanguages.some((l) => (l || "").trim().toLowerCase() === selectedLangNorm)
        ? allModulesList
        : [];
  const allQuizzes = Array.isArray(course.quiz) ? course.quiz : [];
  const filteredQuizzes = allQuizzes.filter(
    (q) => (q.language || "").trim().toLowerCase() === selectedLangNorm
  );
  const quizzes =
    filteredQuizzes.length > 0
      ? filteredQuizzes
      : allQuizzes.length > 0 && courseLanguages.some((l) => (l || "").trim().toLowerCase() === selectedLangNorm)
        ? allQuizzes
        : [];
  const allFeedbacks = Array.isArray(course.feedback) ? course.feedback : [];
  const feedbacks = allFeedbacks.filter(
    (fb) => (fb.language || "").trim().toLowerCase() === selectedLangNorm
  );
  const totalModuleTimeMin = contents.reduce((sum, m) => {
    const d = Number(m.moduleDuration);
    return sum + (Number.isFinite(d) && d > 0 ? d : 0);
  }, 0);
  // Per-module state from the backend: sequence lock, quiz result, offline assessment.
  const moduleStateById = new Map((courseProgress.moduleStates || []).map((s) => [String(s.module_id), s]));
  const hasServerModuleState = moduleStateById.size > 0;
  const stateOf = (m) => (m ? moduleStateById.get(String(m.moduleId)) || null : null);
  const allModulesCompleted = hasServerModuleState
    ? contents.length > 0 && contents.every((m) => stateOf(m)?.completed)
    : contents.length > 0 && contents.every((m) => m.mark_as_read);
  const isLanguageSelectionLocked = allModulesCompleted;
  // Module quiz to take now: content read, quiz not passed yet.
  const quizModule = contents.find((m) => {
    const s = stateOf(m);
    return s && s.has_quiz && s.content_completed && !s.completed;
  }) || null;
  // Offline module the learner is waiting on (assessor must upload proof).


  const moduleIdFromQuery = searchParams.get('moduleId');
  const requestedModuleId = moduleIdFromPath || moduleIdFromQuery;
  const currentModule =
    (requestedModuleId
      ? contents.find((m) => String(m.moduleId || m.id) === String(requestedModuleId))
      : null) || contents[0] || null;
  const currentModuleIdx = currentModule
    ? contents.findIndex((m) => String(m.moduleId || m.id) === String(currentModule.moduleId || currentModule.id))
    : -1;
  const nextModule = currentModuleIdx >= 0 ? contents[currentModuleIdx + 1] || null : null;
  const currentModuleState = stateOf(currentModule);
  // Time for the module on screen: its content duration plus its quiz (the quiz timer defaults to 30 min).
  const currentModuleTime = (() => {
    const content = Number(currentModule?.moduleDuration) > 0 ? Number(currentModule.moduleDuration) : 0;
    const quizTime = Number(currentModule?.quiz?.completion_time);
    const quiz = currentModule?.hasQuiz ? (quizTime > 0 ? quizTime : 30) : 0;
    const type = String(currentModule?.moduleType || '').toLowerCase();
    const contentLabel = type === 'video' ? 'video' : type === 'offline' ? 'practical' : 'reading';
    return { content, quiz, total: content + quiz, contentLabel };
  })();

  const goToModuleQuiz = (module) => {
    if (!module || !course?.documentId) return;
    const query = new URLSearchParams();
    if (selectedLanguage) query.set('lang', selectedLanguage);
    query.set('moduleId', module.moduleId || module.id);
    router.push(`/courses/${category}/${course.documentId}/assessment?${query.toString()}`);
  };

  useEffect(() => {
    const courseId = course?.id;
    const moduleId = currentModule?.moduleId ?? currentModule?.id;
    if (courseId == null || moduleId == null) return;

    const routePath = typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : pathname;
    const moduleTitle = currentModule?.moduleTitle || currentModule?.title || null;

    // Reset timer state when module changes — timer starts only on user engagement
    moduleEnterTimeRef.current = null;
    modulePausedAtRef.current = null;
    modulePausedMsRef.current = 0;

    // Pause the timer when the tab goes to background, resume when it returns
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // If user opened PDF in new tab, keep timer running
        if (pdfNewTabRef.current) return;
        // Tab hidden — record when we paused
        modulePausedAtRef.current = Date.now();
      } else {
        // Clear the PDF-new-tab flag when user comes back
        pdfNewTabRef.current = false;
        // Tab visible again — accumulate the hidden duration
        if (modulePausedAtRef.current != null) {
          modulePausedMsRef.current += Date.now() - modulePausedAtRef.current;
          modulePausedAtRef.current = null;
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    telemetryService.trackLearningModuleEnter({
      courseId,
      moduleIndex: currentModuleIdx,
      moduleTitle,
      routePath,
      metadata: {
        module_id: String(moduleId),
        language: selectedLanguage,
      },
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      telemetryService.trackLearningModuleExit({
        courseId,
        moduleIndex: currentModuleIdx,
        moduleTitle,
        routePath,
        metadata: {
          module_id: String(moduleId),
          language: selectedLanguage,
        },
      });
      telemetryService.flushWithKeepalive();
    };
  }, [course?.id, currentModule?.moduleId, currentModule?.id, currentModuleIdx, currentModule?.moduleTitle, currentModule?.title, pathname, searchParams, selectedLanguage]);

  useEffect(() => {
    const sourceUrl = currentModule?.pdf_file?.url;
    const isPdf = String(currentModule?.moduleType || '').toLowerCase() === 'pdf';

    if (!isPdf || !sourceUrl) {
      setPdfPreviewBlobUrl('');
      setPdfPreviewLoading(false);
      return;
    }

    let active = true;
    let nextBlobUrl = '';
    const controller = new AbortController();

    const loadPdfPreview = async () => {
      setPdfPreviewLoading(true);
      try {
        const headers = {};
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('authToken');
          if (token) headers.Authorization = `Bearer ${token}`;
        }
        const response = await fetch(sourceUrl, { headers, signal: controller.signal });
        if (!response.ok) throw new Error(`PDF request failed: ${response.status}`);
        const blob = await response.blob();
        nextBlobUrl = URL.createObjectURL(blob);
        if (active) setPdfPreviewBlobUrl(nextBlobUrl);
      } catch {
        if (active) setPdfPreviewBlobUrl('');
      } finally {
        if (active) setPdfPreviewLoading(false);
      }
    };

    loadPdfPreview();

    return () => {
      active = false;
      controller.abort();
      if (nextBlobUrl) URL.revokeObjectURL(nextBlobUrl);
    };
  }, [currentModule?.pdf_file?.url, currentModule?.moduleType]);

  // Fetch per-user read state from user-progress whenever the course loads.
  // This replaces the shared mark_as_read from the course schema.
  useEffect(() => {
    const userId = getCurrentUserId();
    const courseIdForApi = course?.id ?? course?.documentId;
    if (!courseIdForApi || !userId) return;
    fetchUserCourseProgress(userId, courseIdForApi, { fresh: true })
      .then(async (progressRes) => {
        // Quizzes are per module: reattempt / latest-attempt lookups use the module the learner is on.
        const quizModuleId = pickQuizModuleId(progressRes.moduleStates);
        const reattemptStatus = await checkPendingReattemptRequest(userId, courseIdForApi, null, quizModuleId).catch(() => null);
        return [progressRes, reattemptStatus, quizModuleId];
      })
      .then(([{ completedModules, progressStatus, feedbackSubmitted, progressPercentage, selectedLanguage: savedLang, moduleStates }, reattemptStatus, quizModuleId]) => {
      const hasPending = reattemptStatus?.hasPending ?? false;
      const hasRejected = reattemptStatus?.hasRejected ?? false;
      const hasApprovedFromApi = reattemptStatus?.hasApproved ?? false;
      const existingMarker = readReattemptMarker(userId, courseIdForApi);

      if (hasPending) writeReattemptMarker(userId, courseIdForApi, { status: 'pending', forAttempt: existingMarker?.forAttempt ?? null });
      else if (hasRejected) writeReattemptMarker(userId, courseIdForApi, null);
      else if (hasApprovedFromApi) writeReattemptMarker(userId, courseIdForApi, { status: 'approved', forAttempt: existingMarker?.forAttempt ?? null });
    
      const urlHasLang = !!(searchParams.get('lang') || searchParams.get('language'));
      if (!urlHasLang && savedLang && courseLanguages.some((l) => (l || '').trim().toLowerCase() === savedLang.trim().toLowerCase())) {
        setSelectedLanguage(savedLang);
      }
      if (skipNextProgressUpdate.current) {
        skipNextProgressUpdate.current = false;
        setCourseProgress((p) => ({ ...p, progressStatus, progressPercentage, moduleStates, hasPendingReattempt: hasPending, hasRejectedReattempt: hasRejected, hasApprovedReattempt: hasApprovedFromApi }));
      } else {
        dispatch(initializeModuleReadState(completedModules));
        setCourseProgress((p) => ({ ...p, progressStatus, progressPercentage, moduleStates, hasPendingReattempt: hasPending, hasRejectedReattempt: hasRejected, hasApprovedReattempt: hasApprovedFromApi }));
      }
      // Feedback comes after every module is completed (not after a single quiz).
      const needsFeedback = allModulesDone(moduleStates) && !feedbackSubmitted && progressStatus !== "Completed";
      setCourseProgress((p) => ({ ...p, needsFeedbackSubmission: needsFeedback }));

      if (!quizModuleId) return;
      getLatestSubmission(userId, courseIdForApi, quizModuleId).then((res) => {
        const submission = res?.submission;
        const latestAttemptNumber = submission?.attempt_number ?? null;
        const latestMaxAttempt = res?.maxAttempt ?? 1;
        const marker = readReattemptMarker(userId, courseIdForApi);
        const markerForAttempt = Number(marker?.forAttempt);
        const hasMarkerForAttempt = Number.isFinite(markerForAttempt) && markerForAttempt > 0;
        const markerConsumed = hasMarkerForAttempt && latestAttemptNumber != null && Number(latestAttemptNumber) >= markerForAttempt;
        if (markerConsumed) {
          writeReattemptMarker(userId, courseIdForApi, null);
        }
        const inferredApprovedFromMarker =
          !markerConsumed &&
          hasMarkerForAttempt &&
          latestAttemptNumber != null &&
          Number(latestAttemptNumber) < markerForAttempt &&
          (marker?.status === 'approved' || (marker?.status === 'pending' && !hasPending && !hasRejected));
        const hasApproved = hasApprovedFromApi || inferredApprovedFromMarker;
        const underReview = submission?.review_status === 'Pending_review';
        const failedAtMaxAttempts = Boolean(
          submission &&
          !underReview &&
          submission.passed !== true &&
          latestAttemptNumber != null &&
          latestAttemptNumber >= latestMaxAttempt
        );
        if (submission) {
          const score = underReview ? null : submission.score;
          setCourseProgress((p) => ({
            ...p,
            quizScore: score,
            quizAlreadyTaken: true,
            hasApprovedReattempt: hasApproved,
            latestAttemptNumber,
            maxAttempt: latestMaxAttempt,
            needsReattemptRequest: failedAtMaxAttempts && !hasPending && !hasRejected && !hasApproved,
          }));
        } else {
          setCourseProgress((p) => ({
            ...p,
            quizAlreadyTaken: false,
            hasApprovedReattempt: false,
            latestAttemptNumber: null,
            maxAttempt: null,
            needsReattemptRequest: false,
          }));
        }
      });
    });
  }, [course?.id, course?.documentId, dispatch]);

  // Auto-reload progress when admin approves/rejects quiz reattempt (via socket notification)
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNotification = (payload) => {
      const type = payload?.type || '';
      if (type === 'quiz_reattempt_approved' || type === 'quiz_reattempt_rejected' || type === 'quiz_reviewed') {
        const isApprovedEvent = type === 'quiz_reattempt_approved';
        const userId = getCurrentUserId();
        const courseIdForApi = course?.id ?? course?.documentId;
        if (!userId || !courseIdForApi) return;

        fetchUserCourseProgress(userId, courseIdForApi, { fresh: true })
          .then(async (progressRes) => {
            const quizModuleId = pickQuizModuleId(progressRes.moduleStates);
            const reattemptStatus = await checkPendingReattemptRequest(userId, courseIdForApi, null, quizModuleId).catch(() => null);
            return [progressRes, reattemptStatus, quizModuleId];
          })
          .then(([{ completedModules, progressStatus, feedbackSubmitted, progressPercentage, moduleStates }, reattemptStatus, quizModuleId]) => {
          dispatch(initializeModuleReadState(completedModules));
          const hasPendingFromApi = reattemptStatus?.hasPending ?? false;
          const hasRejectedFromApi = reattemptStatus?.hasRejected ?? false;
          const hasApprovedFromApi = reattemptStatus?.hasApproved ?? false;

          const hasPendingResolved = isApprovedEvent ? false : hasPendingFromApi;
          const hasRejectedResolved = isApprovedEvent ? false : hasRejectedFromApi;
          const hasApprovedResolved = isApprovedEvent ? true : hasApprovedFromApi;

          setCourseProgress((p) => ({
            ...p,
            progressStatus,
            progressPercentage,
            moduleStates,
            needsFeedbackSubmission: allModulesDone(moduleStates) && !feedbackSubmitted && progressStatus !== 'Completed',
            hasPendingReattempt: hasPendingResolved,
            hasRejectedReattempt: hasRejectedResolved,
            hasApprovedReattempt: hasApprovedResolved,
          }));

          if (!quizModuleId) return;
          getLatestSubmission(userId, courseIdForApi, quizModuleId).then((res) => {
            const submission = res?.submission;
            const latestAttemptNumber = submission?.attempt_number ?? null;
            const latestMaxAttempt = res?.maxAttempt ?? 1;
            const marker = readReattemptMarker(userId, courseIdForApi);
            const markerForAttempt = Number(marker?.forAttempt);
            const resolvedForAttempt = Number.isFinite(markerForAttempt) && markerForAttempt > 0
              ? markerForAttempt
              : (latestAttemptNumber != null ? Number(latestAttemptNumber) + 1 : null);

            if (isApprovedEvent) {
              writeReattemptMarker(userId, courseIdForApi, { status: 'approved', forAttempt: resolvedForAttempt });
            } else {
              writeReattemptMarker(userId, courseIdForApi, null);
            }

            const hasMarkerForAttempt = Number.isFinite(Number(resolvedForAttempt)) && Number(resolvedForAttempt) > 0;
            const markerConsumed = hasMarkerForAttempt && latestAttemptNumber != null && Number(latestAttemptNumber) >= Number(resolvedForAttempt);
            if (markerConsumed) {
              writeReattemptMarker(userId, courseIdForApi, null);
            }
            const inferredApprovedFromMarker =
              !markerConsumed &&
              hasMarkerForAttempt &&
              latestAttemptNumber != null &&
              Number(latestAttemptNumber) < Number(resolvedForAttempt) &&
              (isApprovedEvent || (marker?.status === 'pending' && !hasPendingResolved && !hasRejectedResolved));
            const hasApprovedEffective = Boolean(hasApprovedResolved || inferredApprovedFromMarker);
            const underReview = submission?.review_status === 'Pending_review';
            const failedAtMaxAttempts = Boolean(
              submission &&
              !underReview &&
              submission.passed !== true &&
              latestAttemptNumber != null &&
              latestAttemptNumber >= latestMaxAttempt
            );
            if (submission) {
              setCourseProgress((prev) => ({
                ...prev,
                quizScore: underReview ? null : submission.score,
                quizAlreadyTaken: true,
                hasApprovedReattempt: hasApprovedEffective,
                latestAttemptNumber,
                maxAttempt: latestMaxAttempt,
                needsReattemptRequest: failedAtMaxAttempts && !hasPendingResolved && !hasRejectedResolved && !hasApprovedEffective,
              }));
            } else {
              setCourseProgress((prev) => ({
                ...prev,
                quizAlreadyTaken: false,
                hasApprovedReattempt: false,
                latestAttemptNumber: null,
                maxAttempt: null,
                needsReattemptRequest: false,
              }));
            }
          });
        });
      }
    };

    socket.on('new-notification', handleNotification);
    return () => socket.off('new-notification', handleNotification);
  }, [course?.id, course?.documentId, dispatch]);

  const handleSendReattemptFromCourse = async () => {
    if (reattemptRequestLoading || courseProgress.hasPendingReattempt || courseProgress.hasRejectedReattempt) return;
    const userId = getCurrentUserId();
    const courseIdForApi = course?.id ?? course?.documentId;
    if (!userId || !courseIdForApi) return;

    setReattemptRequestLoading(true);
    setReattemptRequestError(null);
    try {
      const numericAttempt = Number(courseProgress.latestAttemptNumber);
      const numericMaxAttempt = Number(courseProgress.maxAttempt);
      const requestedForAttempt = Number.isFinite(numericAttempt) && numericAttempt > 0
        ? numericAttempt + 1
        : Number.isFinite(numericMaxAttempt) && numericMaxAttempt > 0
          ? numericMaxAttempt + 1
          : undefined;

      await sendReattemptRequest(Number(userId), Number(courseIdForApi), course?.courseVersion, pickQuizModuleId(courseProgress.moduleStates));
      writeReattemptMarker(userId, courseIdForApi, {
        status: 'pending',
        forAttempt: Number.isFinite(Number(requestedForAttempt)) && Number(requestedForAttempt) > 0
          ? Number(requestedForAttempt)
          : null,
      });
      setCourseProgress((p) => ({
        ...p,
        hasPendingReattempt: true,
        hasApprovedReattempt: false,
        needsReattemptRequest: false,
      }));
    } catch (err) {
      const msg = err?.error?.message || err?.message || "Failed to send re-attempt request.";
      setReattemptRequestError(msg);
    } finally {
      setReattemptRequestLoading(false);
    }
  };


  // Called when user first engages with content (video play or View Full Content).
  // Transitions the course from Not_started → In_progress without marking any module complete.
  const handleContentEngaged = async () => {
    // Start the module timer on first engagement (video play or View Full Content)
    if (moduleEnterTimeRef.current == null) {
      moduleEnterTimeRef.current = Date.now();
      modulePausedAtRef.current = null;
      modulePausedMsRef.current = 0;
    }

    if (hasStartedRef.current) return;
    if (courseProgress.progressStatus && courseProgress.progressStatus !== 'Not_started') return;
    const userId = getCurrentUserId();
    if (!userId) return;
    const courseIdForApi = course.id ?? course.documentId;
    if (!courseIdForApi) return;
    hasStartedRef.current = true;
    try {
      await startCourse({ userId, courseId: courseIdForApi, language: selectedLanguage, courseVersion: course?.courseVersion });
      setCourseProgress((p) => ({ ...p, progressStatus: 'In_progress' }));
    } catch (err) {
      hasStartedRef.current = false; // allow retry on next engagement
      console.error('Failed to mark course as started:', err?.message ?? err);
    }
  };

  const handleMarkAsRead = async (modId) => {
    const userId = getCurrentUserId();
    if (!userId) return;
    dispatch(markModuleAsRead({ moduleId: modId }));

    const parsedCourseId = course.id != null ? Number(course.id) : NaN;
    const courseIdNumeric = Number.isFinite(parsedCourseId) ? parsedCourseId : null;
    const courseIdForApi = course.id ?? course.documentId;
    const module_ = contents.find((m) => String(m.moduleId || m.id) === String(modId));
    // Use the index in the FULL module list (all languages) so it aligns with
    // the analytics dashboard's getCourseModules which also uses all modules.
    const allModulesList = Array.isArray(course.modulesList) ? course.modulesList : [];
    const moduleIndex = module_ != null
      ? allModulesList.findIndex((m) => String(m.moduleId || m.id) === String(modId))
      : -1;
    const routePath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : pathname;

    // Calculate actual time spent before both POST calls below need it
    const durationMin = Number(module_?.moduleDuration) || 0;
    // Subtract any time the tab was hidden (paused) from the elapsed wall-clock time
    const hiddenMs = modulePausedMsRef.current +
      (modulePausedAtRef.current != null ? Date.now() - modulePausedAtRef.current : 0);
    // If timer never started (user never engaged with content), record 0
    const elapsedMin = moduleEnterTimeRef.current
      ? Math.max(1, Math.round((Date.now() - moduleEnterTimeRef.current - hiddenMs) / 60000))
      : 0;
    const timeWatchedMin = durationMin > 0 ? Math.min(elapsedMin, durationMin) : elapsedMin;

    try {
      await markModuleProgress({
        userId,
        courseId: courseIdForApi,
        moduleId: String(modId),
        timeSpentMinutes: timeWatchedMin,
        selectedLanguage,
        courseVersion: course?.courseVersion,
        // Send started_at only when course hasn't been started yet (first module marked)
        startedAt: (!courseProgress.progressStatus || courseProgress.progressStatus === 'Not_started')
          ? new Date().toISOString()
          : null,
      });
    } catch (err) {
      console.error('Failed to mark module (user-progress):', err?.message ?? err?.status ?? err);
    }

    if (moduleIndex >= 0 && courseIdNumeric != null) {
      try {
        // full_watch if user watched ≥ 90% of the duration, otherwise in_progress
        const completionType =
          durationMin > 0 && timeWatchedMin >= durationMin * 0.9 ? 'full_watch' : 'in_progress';
        await markModuleVideoProgress({
          userId,
          courseId: courseIdNumeric,
          moduleIndex,
          moduleTitle: module_?.moduleTitle || module_?.title || null,
          videoDurationMin: durationMin,
          timeWatchedMin,
          videoCompletionType: completionType,
          courseVersion: course?.courseVersion,
        });
      } catch (err) {
        console.error('Failed to mark module (module-video-progress):', err?.message ?? err?.status ?? err);
      }
    }

    try {
      if (courseIdForApi) {
        const { completedModules, progressPercentage, progressStatus, moduleStates, feedbackSubmitted } = await fetchUserCourseProgress(userId, courseIdForApi, { fresh: true });
        skipNextProgressUpdate.current = true;
        dispatch(initializeModuleReadState(completedModules));
        setCourseProgress((p) => ({
          ...p,
          progressPercentage,
          progressStatus,
          moduleStates,
          needsFeedbackSubmission: allModulesDone(moduleStates) && !feedbackSubmitted && progressStatus !== 'Completed',
        }));
      }
    } catch (err) {
      if (courseIdForApi) {
        fetchUserCourseProgress(userId, courseIdForApi, { fresh: true }).then(({ completedModules, progressPercentage, moduleStates }) => {
          dispatch(initializeModuleReadState(completedModules));
          setCourseProgress((p) => ({ ...p, progressPercentage, moduleStates }));
        });
      }
    }
  };

  // Handle language change with context-aware confirmation when user has progress
  const handleLanguageChange = (lang) => {
    if (!lang || lang === selectedLanguage) return;
    const hasProgress =
      courseProgress.progressStatus === "In_progress" ||
      courseProgress.progressStatus === "Completed";

    if (hasProgress) {
      let message;
      // Case 1: user is leaving the original language where they already progressed
      if (initialLanguage && selectedLanguage === initialLanguage && lang !== initialLanguage) {
        message = `If you switch to "${lang}", this course will start again from the beginning in that language. Your existing progress in "${initialLanguage}" will be kept. Do you want to continue?`;
      }
      // Case 2: user is switching back to the original language (e.g. Hindi -> English)
      else if (initialLanguage && lang === initialLanguage) {
        message = `You already have progress in "${initialLanguage}". Switching back will continue from where you left off in that language. Do you want to continue?`;
      }
      // Fallback generic message
      else {
        message = 'If you switch the language, this course will start again from the beginning in the new language. Do you want to continue?';
      }

      const confirmed = window.confirm(message);
      if (!confirmed) return;
    }

    setSelectedLanguage(lang);

    const paramsCopy = new URLSearchParams(searchParams?.toString() || "");
    paramsCopy.set("lang", lang);
    paramsCopy.delete("moduleId"); // force restart from first module in new language

    const basePath = `/courses/${category}/${course.documentId}`;
    const queryString = paramsCopy.toString();
    const target = queryString ? `${basePath}?${queryString}` : basePath;
    router.replace(target);

    dispatch(loadCourseById({ documentId: course.documentId, language: lang }));
  };

  const handleNextLecture = () => {
    if (!nextModule || !course?.documentId) return;
    const base = `/courses/${category}/${course.documentId}/${nextModule.moduleId || nextModule.id}`;
    const lang = selectedLanguage ? `?lang=${encodeURIComponent(selectedLanguage)}` : "";
    router.push(`${base}${lang}`);
  };

  const handleVideoLoadedMetadata = () => {
    const v = videoRef.current;
    lastVideoHeartbeatSecRef.current = v ? Number(v.currentTime || 0) : 0;
  };

  const handleVideoTimeUpdate = () => {
    const courseId = course?.id;
    if (courseId == null || currentModule?.moduleType !== 'Video') return;

    const v = videoRef.current;
    if (!v) return;

    const current = Number(v.currentTime || 0);
    const last = Number(lastVideoHeartbeatSecRef.current || 0);
    const delta = current - last;
    if (delta < 10) return;

    lastVideoHeartbeatSecRef.current = current;
    telemetryService.trackLearningVideoProgress({
      courseId,
      moduleIndex: currentModuleIdx,
      moduleTitle: currentModule?.moduleTitle || currentModule?.title || null,
      routePath: typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : pathname,
      durationSeconds: Math.max(1, Math.round(delta)),
      watchedSeconds: Math.round(current),
      metadata: {
        module_id: String(currentModule?.moduleId ?? currentModule?.id ?? ''),
        language: selectedLanguage,
      },
    });
  };

  const handleVideoEnded = () => {
    const courseId = course?.id;
    if (courseId == null || currentModule?.moduleType !== 'Video') return;

    const v = videoRef.current;
    const duration = Number(v?.duration || v?.currentTime || 0);
    const last = Number(lastVideoHeartbeatSecRef.current || 0);
    const tailDelta = duration - last;

    if (tailDelta >= 1) {
      telemetryService.trackLearningVideoProgress({
        courseId,
        moduleIndex: currentModuleIdx,
        moduleTitle: currentModule?.moduleTitle || currentModule?.title || null,
        routePath: typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : pathname,
        durationSeconds: Math.max(1, Math.round(tailDelta)),
        watchedSeconds: Math.round(duration),
        metadata: {
          module_id: String(currentModule?.moduleId ?? currentModule?.id ?? ''),
          language: selectedLanguage,
        },
      });
    }

    lastVideoHeartbeatSecRef.current = duration;
    telemetryService.trackLearningVideoCompleted({
      courseId,
      moduleIndex: currentModuleIdx,
      moduleTitle: currentModule?.moduleTitle || currentModule?.title || null,
      routePath: typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : pathname,
      durationSeconds: Math.max(1, Math.round(duration)),
      watchedSeconds: Math.round(duration),
      metadata: {
        module_id: String(currentModule?.moduleId ?? currentModule?.id ?? ''),
        language: selectedLanguage,
      },
    });
  };

  // Feedback success: show "Thank you" screen briefly after feedback submission
  if (showFeedbackSuccess) {
    return (
      <LayoutShell hideSidebar>
        <PageContainer className="py-8 flex items-center justify-center min-h-[60vh]">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-2xl w-full text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="w-14 h-14 text-success" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Thank you!
            </h2>
            <p className="text-gray-600 mb-4">
              Your feedback has been submitted successfully.
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecting you to the course page...
            </p>
          </div>
        </PageContainer>
      </LayoutShell>
    );
  }

  // Feedback form: when user passed quiz but hasn't submitted feedback
  if (showFeedbackForm) {
    const feedbackForLang = feedbacks[0];
    const feedbackQuestions = feedbackForLang?.questions || [];
    const userId = getCurrentUserId();
    const courseNumericId = course.id ?? course.documentId;

    return (
      <LayoutShell hideSidebar>
        <PageContainer className="py-8">
          <FeedbackForm
            questions={feedbackQuestions}
                onCancel={() => {
                  setShowFeedbackForm(false);
                  // Remove feedback query param so we don't auto-open again
                  const paramsCopy = new URLSearchParams(searchParams?.toString() || "");
                  paramsCopy.delete("feedback");
                  const queryString = paramsCopy.toString();
                  const target = queryString ? `${pathname}?${queryString}` : pathname;
                  router.replace(target);
                }}
            onSubmit={(response) => {
              setShowFeedbackForm(false);
              setShowFeedbackSuccess(true);
              // Refetch progress - backend finalizeCourse sets Completed
              if (userId && courseNumericId) {
                fetchUserCourseProgress(userId, courseNumericId, { fresh: true }).then(({ completedModules, progressStatus, progressPercentage, moduleStates }) => {
                  dispatch(initializeModuleReadState(completedModules));
                  setCourseProgress((p) => ({ ...p, progressStatus, progressPercentage, moduleStates, needsFeedbackSubmission: false }));
                  const quizModuleId = pickQuizModuleId(moduleStates);
                  if (progressStatus === "Completed" && quizModuleId) {
                    getLatestSubmission(userId, courseNumericId, quizModuleId).then((res) => {
                      setCourseProgress((p) => ({
                      ...p,
                      quizScore: res?.submission?.review_status === 'Pending_review' ? null : res?.submission?.score,
                    }));
                    });
                  }
                });
              }
              // Auto-hide success screen after 3 seconds
              setTimeout(() => setShowFeedbackSuccess(false), 3000);
            }}
            userId={userId}
            courseId={courseNumericId}
            courseVersion={course.courseVersion}
          />
        </PageContainer>
      </LayoutShell>
    );
  }

  if (showFullReadingView) {
    // The full view's quiz button is shown while this module's quiz is still to be passed.
    const isLastModule = !!currentModuleState?.has_quiz && !currentModuleState?.completed;
    return (
      <CourseTextOrPdf
        course={course}
        category={category}
        selectedModule={currentModule}
        filteredModules={contents}
        onBack={() => setShowFullReadingView(false)}
        onMarkAsRead={() => handleMarkAsRead(currentModule?.moduleId || currentModule?.id)}
        onPdfOpenNewTab={() => { pdfNewTabRef.current = true; }}
        onNextLecture={() => {
          setShowFullReadingView(false);
          handleNextLecture();
        }}
        isRead={currentModule?.mark_as_read || false}
        isLastModule={isLastModule}
        onGoToAssessment={() => {
          setShowFullReadingView(false);
          goToModuleQuiz(currentModule);
        }}
      />
    );
  }

  const courseBgStyle = {
    backgroundImage: 'url(/course-page-bg.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };

  const languageOptions =
    Array.isArray(courseLanguages) && courseLanguages.length > 0 ? courseLanguages : ["English"];

  return (
    <div className="min-h-screen bg-[#fafafa]" style={courseBgStyle}>
      <PageHeader
        title={course.title}
        version ={course.courseVersion} 
        titleRight={
          languageOptions.length > 0 ? (
            <div className="flex items-center gap-2 bg-white/90 border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
              <Languages className="w-4 h-4 text-gray-500" aria-hidden />
              <label htmlFor="course-language-select" className="text-sm font-medium text-gray-700">
                Language
              </label>
              <select
                id="course-language-select"
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                disabled={isLanguageSelectionLocked}
                title={isLanguageSelectionLocked ? "Language cannot be changed after completing all modules in this language" : undefined}
                className={`w-[170px] max-w-[170px] border border-gray-300 rounded-md px-3 py-1.5 text-sm font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${isLanguageSelectionLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                {languageOptions.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
          ) : null
        }
        breadcrumbs={[
          { label: "Courses", href: "/courses" },
          {
            label: category
              ? category
                  .replace(/-/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())
              : "",
            href: `/courses/${category}`,
          },
          { label: course.title && course.title.length > 50 ? course.title.slice(0, 50) + "…" : course.title },
        ]}
        showBreadcrumbSeparator={false}
        containerClassName="pt-xl !pb-0 bg-transparent [&>div:nth-child(2)]:flex-nowrap [&>div:nth-child(2)]:items-start [&>div:nth-child(2)>h1]:min-w-0 [&>div:nth-child(2)>h1]:flex-1 [&>div:nth-child(2)>h1]:break-words"
      />
      <main>
        <PageSection>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-10">
            {/* Left Column: Video + Content */}
            <div className="lg:col-span-2 lg:flex lg:flex-col">
              {currentModule && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-8">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {currentModule.moduleTitle || currentModule.title}
                  </h2>
                  {currentModuleTime.total > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-light text-primary px-3 py-1 text-sm font-semibold">
                      <Clock className="w-4 h-4" />
                      {currentModuleTime.total} min
                      {currentModuleTime.content > 0 && currentModuleTime.quiz > 0 && (
                        <span className="font-normal text-gray-600">
                          {`· ${currentModuleTime.content} min ${currentModuleTime.contentLabel} + ${currentModuleTime.quiz} min quiz`}
                        </span>
                      )}
                    </span>
                  )}
                </div>
              )}

              {/* Show content based on module kind / moduleType */}
              {currentModule?.moduleKind === 'Offline' ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 mt-4 space-y-4">
                  <div className="flex items-center gap-3">
                    {currentModuleState?.completed
                      ? <ClipboardCheck className="w-8 h-8 text-success" />
                      : <Hourglass className="w-8 h-8 text-amber-600" />}
                    <div>
                      <p className="font-semibold text-gray-900">Offline module — practical assessment</p>
                      <p className="text-sm text-gray-600">
                        This module takes place in person at your workplace. There is no online quiz.
                      </p>
                    </div>
                  </div>
                  {currentModuleState?.completed ? (
                    <div className="rounded-lg bg-success/10 border border-success/30 p-4 text-sm text-gray-700">
                      Completed{currentModuleState?.offline_completion?.completed_at
                        ? ` on ${new Date(currentModuleState.offline_completion.completed_at).toLocaleDateString()}`
                        : ''}
                      {currentModuleState?.offline_completion?.assessed_by
                        ? ` — assessed by ${currentModuleState.offline_completion.assessed_by}`
                        : ''}. You can continue with the next module.
                    </div>
                  ) : currentModuleState && !currentModuleState.unlocked ? (
                    <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-sm text-gray-600">
                      Complete the previous modules first.
                    </div>
                  ) : (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-gray-700">
                      Attend the practical session with your assessor. Once they record your result, this module is marked
                      complete and the next module unlocks.
                    </div>
                  )}
                </div>
              ) : currentModule?.moduleType === 'Video' ? (
                <>
                  <div className="relative w-full rounded-xl mt-2 bg-black" style={{ aspectRatio: '16/9' }}>
                    <video
                      ref={videoRef}
                      controls
                      controlsList="nodownload noplaybackrate"
                      disablePictureInPicture
                      onPlay={handleContentEngaged}
                      onLoadedMetadata={handleVideoLoadedMetadata}
                      onTimeUpdate={handleVideoTimeUpdate}
                      onEnded={handleVideoEnded}
                      className="w-full h-full object-contain rounded-xl"
                    >
                      <source
                        src={currentModule.video_file?.url || "https://www.w3schools.com/html/mov_bbb.mp4"}
                        type="video/mp4"
                      />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                  {currentModule?.description && (
                    <div className="mt-4 bg-white rounded-xl border border-gray-200 p-5">
                      <div
                        className="rich-content"
                        dangerouslySetInnerHTML={{ __html: md.render(currentModule.description) }}
                      />
                    </div>
                  )}
                </>
              ) : String(currentModule?.moduleType || '').toLowerCase() === 'pdf' ? (
                <div className="bg-white rounded-xl border border-gray-200 mt-4 overflow-hidden lg:flex lg:flex-col lg:flex-1 lg:min-h-0">
                  {currentModule?.pdf_file?.url ? (
                    <>
                      <div className="relative w-full h-[467px] lg:h-auto lg:flex-1 lg:min-h-[240px] overflow-hidden pointer-events-none">
                        {pdfPreviewLoading ? (
                          <div className="w-full h-full flex items-center justify-center text-gray-500">
                            Loading PDF preview...
                          </div>
                        ) : pdfPreviewBlobUrl ? (
                          <>
                            <iframe
                              src={`${pdfPreviewBlobUrl}#page=1&toolbar=0&scrollbar=0&view=FitH`}
                              title={currentModule.moduleTitle || 'PDF preview'}
                              className="border-0 absolute top-0 left-0"
                              style={{ width: 'calc(100% + 20px)', height: '200%' }}
                              scrolling="no"
                            />
                            {/* Gradient fade to indicate more content below */}
                            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent z-10" />
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 px-4 text-center">
                            Inline PDF preview is not available. Use full view or open it in a new tab.
                          </div>
                        )}
                      </div>
                      <div className="p-4 shrink-0">
                        <button
                          onClick={() => { handleContentEngaged(); setShowFullReadingView(true); }}
                          className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition cursor-pointer"
                        >
                          <Maximize2 className="w-4 h-4" />
                          View Full PDF
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-8 text-gray-500 italic">No PDF file available.</div>
                  )}
                </div>
              ) : currentModule?.moduleType === 'Text' ? (
                <div className="bg-white rounded-xl border border-gray-200 mt-4 overflow-hidden lg:flex lg:flex-col lg:flex-1 lg:min-h-0">
                  {/* Reading Content Preview Container */}
                  <div className="p-4 space-y-5 max-h-[467px] lg:max-h-none lg:flex-1 lg:min-h-[240px] overflow-hidden">
                    {currentModule.text_content ? (
                      <div
                        className="rich-content text-sm text-gray-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: currentModule.text_content }}
                      />
                    ) : (
                      <div className="text-gray-500 italic">No content available.</div>
                    )}
                  </div>
                  {/* View Full Content Button */}
                  <div className="p-4 shrink-0">
                    <button
                      onClick={() => { handleContentEngaged(); setShowFullReadingView(true); }}
                      className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition cursor-pointer"
                    >
                      <Maximize2 className="w-4 h-4" />
                      View Full Content
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-8 mt-10 space-y-5">
                  {currentModule && currentModule.content ? (
                    <>
                      <div className="relative">
                        <div className="text-gray-700 text-base leading-relaxed whitespace-pre-line max-h-80 overflow-hidden pr-2" style={{ WebkitMaskImage: 'linear-gradient(180deg, #000 80%, transparent 100%)' }}>
                          {currentModule.content}
                        </div>
                        <div className="p-4">
                          <button
                            onClick={() => { handleContentEngaged(); setShowFullReadingView(true); }}
                            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition cursor-pointer"
                          >
                            <Maximize2 className="w-4 h-4" />
                            View Full Content
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-500 italic">No preview available for this module type.</div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Stats + Course Contents. On large screens it stays below the top bar and is never taller
                than the screen: only the module list scrolls, so more modules do not stretch the page. */}
            <div className="lg:col-span-1 mt-18">
              <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-7rem)] flex flex-col">
                <div className="shrink-0">
                  <CourseStats course={course} progressPercentage={courseProgress.progressPercentage} quizScore={courseProgress.quizScore} totalModuleTimeMin={totalModuleTimeMin} moduleStates={courseProgress.moduleStates} />
                </div>
                <CourseContentList
                  contents={contents}
                  current={currentModule?.moduleId || currentModule?.id || 0}
                  courseId={course.documentId}
                  category={category}
                  course={course}
                  selectedLanguage={selectedLanguage}
                  onMarkAsRead={handleMarkAsRead}
                  moduleStates={courseProgress.moduleStates}
                  onTakeQuiz={goToModuleQuiz}
                  // What used to be the separate "Module Quiz" card: re-attempt and feedback actions on the module cards.
                  quizActions={{
                    moduleId: quizModule ? quizModule.moduleId || quizModule.id : null,
                    needsRequest: courseProgress.needsReattemptRequest,
                    pending: courseProgress.hasPendingReattempt,
                    rejected: courseProgress.hasRejectedReattempt,
                    loading: reattemptRequestLoading,
                    error: reattemptRequestError,
                    onSendRequest: handleSendReattemptFromCourse,
                    needsFeedback: courseProgress.needsFeedbackSubmission,
                    onOpenFeedback: () => setShowFeedbackForm(true),
                    courseCompleted: courseProgress.progressStatus === "Completed",
                  }}
                />
              </div>
            </div>
          </div>
        </PageSection>
      </main>
    </div>
  );
}
