"use client";
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  ListChecks,
  CircleDot,
  PenLine,
} from "lucide-react";
import {
  MOCK_ASSESSMENT_QUESTIONS,
  MOCK_ASSESSMENT_RESULTS,
  getCourseFeedbackConfig,
} from "@/services/mockData";
import { submitQuiz, getLatestSubmission, sendReattemptRequest, checkPendingReattemptRequest } from "../quizSubmissionAPI";
import FeedbackForm from "./FeedbackForm";
import LayoutShell from "@/components/layout/LayoutShell";
import PageContainer from "@/components/layout/PageContainer";
import telemetryService from '@/services/telemetry';

const getReattemptMarkerKey = (userId, courseId) => `quiz-reattempt:${Number(userId)}:${Number(courseId)}`;

const writeReattemptMarker = (userId, courseId, value) => {
  if (typeof window === 'undefined') return;
  try {
    if (value == null) {
      window.localStorage.removeItem(getReattemptMarkerKey(userId, courseId));
      return;
    }
    window.localStorage.setItem(getReattemptMarkerKey(userId, courseId), JSON.stringify(value));
  } catch {
    // Ignore storage errors and continue with API-driven flow.
  }
};

function ResultScreen({
  passed,
  score,
  resultData,
  onBackToCourses,
  onTryAgain,
  onSendReattemptRequest,
  feedbackMandatory,
  feedbackSubmitted,
  onOpenFeedback,
  attemptNumber,
  maxAttempt,
  reattemptRequired,
  reattemptSent,
  reattemptLoading,
  reattemptError,
  showFeedback = true,
  continueLabel = null,
}) {
  const canGoBack = passed
    ? !feedbackMandatory || feedbackSubmitted || reattemptSent
    : (reattemptRequired ? reattemptSent : true);
  const normalizedAttemptNumber = Number.isFinite(Number(attemptNumber)) ? Number(attemptNumber) : undefined;
  const normalizedMaxAttempt = Number.isFinite(Number(maxAttempt)) ? Number(maxAttempt) : undefined;
  const backButtonClass = canGoBack
    ? "w-full py-3 rounded-xl bg-success text-white hover:bg-success/90 transition cursor-pointer"
    : "w-full py-3 rounded-xl bg-gray-300 text-gray-500 cursor-not-allowed";

  if (passed) {
    const passHeading = score != null ? `Passed ${score}%` : "Passed";
    return (
      <div className="fixed inset-0 z-50 bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-147.75 p-4 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-12 h-12 text-success" />
          </div>
          <h2 className="text-2xl font-semibold text-success mb-4">
            {passHeading}
          </h2>
          <p className="font-semibold text-foreground/60 leading-relaxed mb-4">
            {resultData.pass.message}
          </p>
          {normalizedAttemptNumber !== undefined && normalizedMaxAttempt !== undefined && (
            <p className="text-sm font-semibold text-foreground/60 mb-2">
              Current Attempt {normalizedAttemptNumber} / Max Attempt {normalizedMaxAttempt}
            </p>
          )}
          <p className="text-xs font-semibold text-foreground/60 leading-relaxed mb-8">
            {resultData.pass.subMessage}
          </p>
          <div className="flex flex-col gap-3">
            {showFeedback && (
            <button
              type="button"
              onClick={reattemptSent ? undefined : onOpenFeedback}
              disabled={reattemptSent}
              className={`w-full py-3 rounded-xl border-2 border-primary font-semibold transition ${
                reattemptSent
                  ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                  : "bg-white text-primary hover:bg-primary/5 cursor-pointer"
              }`}
            >
              Submit Feedback
            </button>
            )}
            <button
              type="button"
              onClick={canGoBack ? onBackToCourses : undefined}
              disabled={!canGoBack}
              className={backButtonClass}
            >
              {continueLabel || resultData.pass.buttonText}
            </button>
          </div>
          {showFeedback && feedbackMandatory && !feedbackSubmitted && (
            <p className="text-xs text-muted-foreground mt-2">
              Please submit feedback to continue to courses.
            </p>
          )}
        </div>
      </div>
    );
  }

  const failBackClass = canGoBack
    ? "flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition cursor-pointer"
    : "flex-1 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed";

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-147.75 p-10 text-center">
        <div className="flex justify-center mb-4">
          <XCircle className="w-12 h-12 text-error" />
        </div>
        <h2 className="text-xl font-bold text-error mb-4">
          {reattemptRequired
            ? `Maximum attempts reached — Your Score ${score}%`
            : `Your Score ${score}%`}
        </h2>
        <p className="text-sm font-medium text-error leading-relaxed mb-4">
          {reattemptRequired
            ? `You have used all ${normalizedMaxAttempt ?? maxAttempt} attempt(s). Please request a reattempt from your administrator.`
            : resultData.fail.message}
        </p>
        {normalizedAttemptNumber !== undefined && normalizedMaxAttempt !== undefined ? (
          <p className="text-gray-600 mb-3 font-semibold">
            Current Attempt {normalizedAttemptNumber} / Max Attempt {normalizedMaxAttempt}
          </p>
        ) : (
          <p className="text-gray-600 mb-3 font-semibold">
            {resultData.fail.attemptsInfo}
          </p>
        )}
        <p className="text-gray-600 mb-3 font-semibold">
          {resultData.fail.contactInfo}
        </p>
        <p className="text-xs text-gray-400 leading-relaxed mb-8 font-semibold">
          {resultData.fail.subMessage}
        </p>
        <div className="flex flex-col gap-3">
          {reattemptError && (
            <p className="text-sm text-destructive font-medium">{reattemptError}</p>
          )}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={canGoBack ? onBackToCourses : undefined}
              disabled={!canGoBack}
              className={failBackClass}
            >
              {resultData.fail.secondaryButtonText}
            </button>
            {reattemptRequired && normalizedAttemptNumber != null && normalizedMaxAttempt != null && normalizedAttemptNumber >= normalizedMaxAttempt ? (
              <button
                type="button"
                onClick={onSendReattemptRequest}
                disabled={reattemptLoading || reattemptSent}
                className="flex-1 py-3 rounded-xl bg-error/10 border border-error text-error font-semibold hover:bg-error/20 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {reattemptSent
                  ? "Request sent"
                  : reattemptLoading
                    ? "Sending..."
                    : "Send Re-attempt Request"}
              </button>
            ) : (
              <button
                onClick={onTryAgain}
                className="flex-1 py-3 rounded-xl bg-error/10 border border-error text-error font-semibold hover:bg-error/20 transition cursor-pointer"
              >
                {resultData.fail.primaryButtonText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getQuestionOptions(question) {
  if (!question) return [];
  const q = question?.attributes ?? question;
  const raw =
    q.options ??
    q.choices ??
    q.question_options ??
    question?.options ??
    question?.choices ??
    question?.question_options ??
    [];
  const arr = Array.isArray(raw)
    ? raw
    : raw?.data && Array.isArray(raw.data)
      ? raw.data
      : [];
  return arr.map((opt) => {
    if (opt == null) return { option_key: "", option_label: "" };
    const attrs = opt.attributes ?? opt;
    return {
      option_key: attrs.option_key ?? opt.option_key ?? "",
      option_label: attrs.option_label ?? opt.option_label ?? opt.text ?? opt.label ?? String(opt.id ?? ""),
    };
  });
}

export default function AssessmentQuiz({ onExit, courseId, category, courseNumericId, userId, quizQuestions, resultData: resultDataProp, feedbackQuestions,courseVersion,feedbackCompulsory, quizDuration, moduleId = null, isFinalModule = true }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const questions = useMemo(() => {
    const src = Array.isArray(quizQuestions) && quizQuestions.length > 0 ? quizQuestions : MOCK_ASSESSMENT_QUESTIONS;
    const shuffled = [...src];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const resultData = resultDataProp || MOCK_ASSESSMENT_RESULTS;
  const totalQuestions = questions.length;
  // Course feedback is only asked after the quiz that completes the course (last module quiz).
  const feedbackMandatory = isFinalModule ? (feedbackCompulsory ?? getCourseFeedbackConfig(courseId).mandatory) : false;
  const quizDurationSeconds = (quizDuration != null && quizDuration > 0 ? quizDuration : 30) * 60;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(quizDurationSeconds);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [score, setScore] = useState(0);
  const [isPassed, setIsPassed] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [showFeedbackSuccess, setShowFeedbackSuccess] = useState(false);
  const [attemptNumber, setAttemptNumber] = useState(undefined);
  const [maxAttempt, setMaxAttempt] = useState(undefined);
  const [reattemptRequired, setReattemptRequired] = useState(false);
  const [reattemptSent, setReattemptSent] = useState(false);
  const [reattemptLoading, setReattemptLoading] = useState(false);
  const [reattemptError, setReattemptError] = useState(null);
  const [showReattemptSuccessModal, setShowReattemptSuccessModal] = useState(false);
  const [violationWarning, setViolationWarning] = useState(false);
  const [timeLimitExceeded, setTimeLimitExceeded] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [showAutoSubmitModal, setShowAutoSubmitModal] = useState(false);

  const isSubmittingRef = useRef(false);
  const submittedRef = useRef(false);
  const answersRef = useRef({});
  const timeLeftRef = useRef(quizDurationSeconds);
  const quizStartedRef = useRef(false);

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    if (!reattemptSent || !category || !courseId) return;
    setShowReattemptSuccessModal(true);
    const timer = setTimeout(() => {
      router.push(`/courses/${category}/${courseId}`);
    }, 5500);
    return () => clearTimeout(timer);
  }, [reattemptSent, category, courseId, router]);

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);

  useEffect(() => {
    if (!quizStarted || timeLeft <= 0 || submitted || isSubmitting) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [quizStarted, timeLeft, submitted, isSubmitting]);

  useEffect(() => {
    if (!quizStarted) return;
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [quizStarted]);

  useEffect(() => {
    if (submitted && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, [submitted]);

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const progressPercent = ((currentIndex + 1) / totalQuestions) * 100;

  const handleSelectOption = (optionIndex) => {
    const isMulti = currentQuestion.question_type === 'Multiple_select';
    
    setAnswers((prev) => {
      if (isMulti) {
        const currentAns = prev[currentQuestion.id] || [];
        const ansArray = Array.isArray(currentAns) ? currentAns : [currentAns];
        
        if (ansArray.includes(optionIndex)) {
            const newAns = ansArray.filter(idx => idx !== optionIndex);
            if (newAns.length === 0) {
              const { [currentQuestion.id]: _, ...rest } = prev;
              return rest;
            }
            return { ...prev, [currentQuestion.id]: newAns };
        } else {
            return { ...prev, [currentQuestion.id]: [...ansArray, optionIndex] };
        }
      } else {
         return { ...prev, [currentQuestion.id]: optionIndex };
      }
    });
  };

  const handlePrevious = () => {
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  };

  const handleTextChange = (e) => {
  const val = e.target.value;
  setAnswers((prev) => ({
    ...prev,
    [currentQuestion.id]: val,
  }));
};

  const currentAns = answers[currentQuestion?.id];
  const isDescriptive = ['Descriptive', 'Text', 'Short_answer'].includes(currentQuestion?.question_type);

  const hasAnswered = isDescriptive
    ? typeof currentAns === 'string' && currentAns.trim().length > 0
    : currentAns !== undefined && (!Array.isArray(currentAns) || currentAns.length > 0);

  const handleNext = () => {
    if (!hasAnswered) return;
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const performSubmit = useCallback(async (currentAnswers, currentTimeLeft, submissionType = 'Manual Submit') => {
    if (isSubmittingRef.current || submittedRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    // Inside performSubmit in AssessmentQuiz.jsx
    const answersArr = questions.map((q) => {
      const selectedVal = currentAnswers[q.id];
      const qType = q.question_type || 'Multiple_choice';
      const opts = getQuestionOptions(q);

      let answerPayload = {
        question_id: String(q.question_id || q.id),
        question: q.question_text || q.question || q.question_id || String(q.id),
        question_type: qType,
        point: q.point || 0,
      };

      if (qType === 'Descriptive' || qType === 'Text' || qType === 'Short_answer') {
        answerPayload.user_answer_for_descriptive_question = typeof selectedVal === 'string' ? selectedVal : '';
      } else if (qType === 'Multiple_select') {
        const ansArray = Array.isArray(selectedVal) ? selectedVal : (selectedVal !== undefined ? [selectedVal] : []);
        answerPayload.selected_answer_for_multiSelect = ansArray.map(idx => {
          const opt = opts[idx];
          return { option_key: opt?.option_key ?? String(idx ?? "") };
        });
      } else {
        // Multiple Choice
        const selectedOption = selectedVal !== undefined && !Array.isArray(selectedVal) ? opts[selectedVal] : null;
        answerPayload.selected_answer_for_multiChoice = selectedOption?.option_key ?? String(selectedVal ?? "");
      }

      return answerPayload;
    });

    const payload = {
      userId: Number(userId),
      courseId: Number(courseNumericId),
      moduleId,
      answers: answersArr,
      course_version: courseVersion,
      time_taken_minutes: Math.max(1, Math.round((quizDurationSeconds - currentTimeLeft) / 60)),
      submitted_at: new Date().toISOString(),
      submission_type: submissionType,
    };

    try {
      const submitRes = await submitQuiz(payload);

      let submission = submitRes?.submission;
      let maxAttemptVal = submitRes?.maxAttempt;

      // Backward-compatible fallback for older backend responses.
      if (!submission || maxAttemptVal == null) {
        const resultRes = await getLatestSubmission(Number(userId), Number(courseNumericId), moduleId);
        submission = submission || resultRes?.submission;
        maxAttemptVal = maxAttemptVal ?? resultRes?.maxAttempt;
      }

      maxAttemptVal = maxAttemptVal ?? 1;
      if (maxAttemptVal !== undefined) setMaxAttempt(maxAttemptVal);

      const attemptNum = submission?.attempt_number;
      const currentEqualsMax = attemptNum != null && maxAttemptVal != null && attemptNum >= maxAttemptVal;
      const userPassed = submission?.passed === true;

      setScore(submission?.score ?? 0);
      setIsPassed(userPassed);
      if (attemptNum != null) setAttemptNumber(attemptNum);

      if (!userPassed && (submitRes?.reattempt_required || currentEqualsMax)) {
        setReattemptRequired(true);
        setIsPassed(false);
        setScore(submission?.score ?? 0);
        if (attemptNum != null) setAttemptNumber(attemptNum);
        if (typeof submitRes?.has_pending_reattempt === 'boolean') {
          setReattemptSent(submitRes.has_pending_reattempt);
        } else {
          const reattemptStatus = await checkPendingReattemptRequest(Number(userId), Number(courseNumericId), null, moduleId);
          if (reattemptStatus?.hasPending) setReattemptSent(true);
        }
      } else {
        setScore(submission?.score ?? 0);
        setIsPassed(submission?.passed ?? false);
        if (attemptNum != null) setAttemptNumber(attemptNum);
        if (!submission?.passed && currentEqualsMax) {
          setReattemptRequired(true);
          if (typeof submitRes?.has_pending_reattempt === 'boolean') {
            setReattemptSent(submitRes.has_pending_reattempt);
          } else {
            const reattemptStatus = await checkPendingReattemptRequest(Number(userId), Number(courseNumericId), null, moduleId);
            if (reattemptStatus?.hasPending) setReattemptSent(true);
          }
        }
      }

      telemetryService.trackLearningQuizSubmitted({
        courseId: Number(courseNumericId),
        routePath: typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/courses',
        quizId: String(moduleId || courseNumericId),
        score: submission?.score ?? 0,
        maxScore: 100,
        durationSeconds: Math.max(1, Math.round(quizDurationSeconds - currentTimeLeft)),
        metadata: {
          course_id: Number(courseNumericId),
          user_id: Number(userId),
          passed: userPassed,
          score: submission?.score ?? 0,
          attempt_number: attemptNum ?? null,
          max_attempt: maxAttemptVal ?? null,
          auto_submitted: Boolean(violationWarning),
        },
      });
    } catch (e) {
      console.error('Quiz submission failed', e);

      try {
        const latestRes = await getLatestSubmission(Number(userId), Number(courseNumericId), moduleId);
        const latestSubmission = latestRes?.submission;
        const latestMaxAttempt = latestRes?.maxAttempt ?? 1;

        if (latestMaxAttempt !== undefined) setMaxAttempt(latestMaxAttempt);

        if (latestSubmission) {
          const latestAttempt = latestSubmission?.attempt_number;
          const latestPassed = latestSubmission?.passed === true;

          setScore(latestSubmission?.score ?? 0);
          setIsPassed(latestPassed);
          if (latestAttempt != null) setAttemptNumber(latestAttempt);

          const reachedMaxWithFail =
            !latestPassed &&
            latestAttempt != null &&
            latestMaxAttempt != null &&
            latestAttempt >= latestMaxAttempt;

          if (reachedMaxWithFail) {
            setReattemptRequired(true);
            const reattemptStatus = await checkPendingReattemptRequest(Number(userId), Number(courseNumericId), null, moduleId);
            setReattemptSent(Boolean(reattemptStatus?.hasPending));
          }
        }
      } catch (fallbackErr) {
        console.error('Failed to load latest submission after submit error', fallbackErr);
      }

      telemetryService.trackLearningQuizSubmitted({
        courseId: Number(courseNumericId),
        routePath: typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/courses',
        quizId: String(courseNumericId),
        score: null,
        maxScore: null,
        durationSeconds: Math.max(1, Math.round(quizDurationSeconds - currentTimeLeft)),
        metadata: {
          course_id: Number(courseNumericId),
          user_id: Number(userId),
          failed: true,
          error: e?.message || 'Quiz submission failed',
        },
      });
    } finally {
      isSubmittingRef.current = false;
      submittedRef.current = true;
      setIsSubmitting(false);
      setSubmitted(true);
      setShowAutoSubmitModal(false);
    }
  }, [questions, userId, courseNumericId, courseVersion, quizDurationSeconds, moduleId]);

  const handleSubmit = async () => {
    if (!hasAnswered || isSubmitting) return;
    await performSubmit(answers, timeLeft, 'Manual Submit');
  };

  const handleAutoSubmit = useCallback(() => {
    if (!quizStartedRef.current || submittedRef.current || isSubmittingRef.current) return;
    setViolationWarning(true);
    setShowAutoSubmitModal(true);
    performSubmit(answersRef.current, timeLeftRef.current, 'Auto Submit or Leave');
  }, [performSubmit]);

  // Auto-submit with "Time Limit Exceed" when the countdown reaches zero
  useEffect(() => {
    if (timeLeft === 0 && !submittedRef.current && !isSubmittingRef.current) {
      setTimeLimitExceeded(true);
      setShowAutoSubmitModal(true);
      performSubmit(answersRef.current, 0, 'Time Limit Exceed');
    }
  }, [timeLeft, performSubmit]);

  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement && !submittedRef.current) {
        handleAutoSubmit();
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, [handleAutoSubmit]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && !submittedRef.current) {
        handleAutoSubmit();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [handleAutoSubmit]);

  useEffect(() => {
    if (!quizStartedRef.current || submittedRef.current || submitted || showFeedbackForm) return;

    let submissionInProgress = false;

    const ALLOWED_KEYS = new Set([
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Enter',
      ' ',
    ]);

    const handleKeyDown = (e) => {
      if (submittedRef.current || !quizStartedRef.current) return;

      // 1. Allow typing inside input fields and textareas
      const targetTag = e.target.tagName;
      const isEditable = targetTag === 'INPUT' || targetTag === 'TEXTAREA' || e.target.isContentEditable;
      if (isEditable) {
        return; // Don't block keypresses when the user is typing an answer
      }

      // 2. Prevent page reload (F5 / Ctrl+R / Cmd+R)
      const isReload = e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r');
      if (isReload) {
        e.preventDefault();
        e.stopPropagation();
        if (!submissionInProgress) {
          submissionInProgress = true;
          handleAutoSubmit();
        }
        return;
      }

      // 3. Block shortcut keys outside editable inputs
      if (!ALLOWED_KEYS.has(e.key)) {
        const isSystemKey = ['Control', 'Shift', 'Alt', 'Meta', 'Tab'].includes(e.key);
        if (!isSystemKey) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    const handleBeforeUnload = (e) => {
      if (submittedRef.current || !quizStartedRef.current) return;
      if (!submissionInProgress) {
        submissionInProgress = true;
        handleAutoSubmit();
      }
      e.preventDefault();
      e.returnValue = '';
    };

    const handleContextMenu = (e) => {
      if (quizStartedRef.current && !submittedRef.current) {
        e.preventDefault();
      }
    };

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('contextmenu', handleContextMenu, true);

    const handlePopState = () => {
      if (quizStartedRef.current && !submittedRef.current && !submissionInProgress) {
        submissionInProgress = true;
        handleAutoSubmit();
        window.history.pushState(null, '', window.location.href);
      }
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('contextmenu', handleContextMenu, true);
      window.removeEventListener('popstate', handlePopState);

      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [quizStartedRef.current, handleAutoSubmit, submitted, showFeedbackForm]);

  const handleStartAssessment = () => {
    quizStartedRef.current = true;
    setQuizStarted(true);
  };

  const handleTryAgain = () => {
    setCurrentIndex(0);
    setAnswers({});
    setTimeLeft(quizDurationSeconds);
    setSubmitted(false);
    setIsSubmitting(false);
    setScore(0);
    setIsPassed(false);
    setAttemptNumber(undefined);
    setReattemptRequired(false);
    setViolationWarning(false);
    setTimeLimitExceeded(false);
    setShowAutoSubmitModal(false);
    submittedRef.current = false;
    isSubmittingRef.current = false;
    quizStartedRef.current = true;
    setQuizStarted(true);
  };

  const handleSendReattemptRequest = async () => {
    if (reattemptLoading || reattemptSent) return;
    setReattemptLoading(true);
    setReattemptError(null);
    try {
      const numericAttempt = Number(attemptNumber);
      const numericMaxAttempt = Number(maxAttempt);
      const requestedForAttempt = Number.isFinite(numericAttempt) && numericAttempt > 0
        ? numericAttempt + 1
        : Number.isFinite(numericMaxAttempt) && numericMaxAttempt > 0
          ? numericMaxAttempt + 1
          : undefined;
      await sendReattemptRequest(Number(userId), Number(courseNumericId), courseVersion, moduleId);
      writeReattemptMarker(userId, courseNumericId, {
        status: 'pending',
        forAttempt: Number.isFinite(Number(requestedForAttempt)) && Number(requestedForAttempt) > 0
          ? Number(requestedForAttempt)
          : null,
      });
      setReattemptSent(true);
      telemetryService.trackLearningEvent('quiz_reattempt_requested', {
        routePath: typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/courses',
        entityType: 'quiz',
        entityId: String(courseNumericId),
        pageType: 'CourseAssessment',
        metadata: {
          course_id: Number(courseNumericId),
          user_id: Number(userId),
          requested_for_attempt: requestedForAttempt ?? null,
        },
      });
    } catch (err) {
      const msg = err?.error?.message || err?.message || "Failed to send re-attempt request.";
      setReattemptError(msg);
    } finally {
      setReattemptLoading(false);
    }
  };

  const handleBackToCourses = () => {
    const lang = searchParams?.get('lang');
    const langQuery = lang ? `?lang=${encodeURIComponent(lang)}` : '';
    if (category && courseId) {
      router.push(`/courses/${category}/${courseId}${langQuery}`);
      return;
    }
    if (category) {
      router.push(`/courses/${category}`);
      return;
    }
    if (onExit) onExit();
    else router.push('/courses');
  };

  const openFeedbackForm = () => {
    setShowFeedbackForm(true);
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set('feedback', '1');
    const query = params.toString();
    const target = query ? `${pathname}?${query}` : pathname;
    router.replace(target, { scroll: false });
  };

  const closeFeedbackForm = () => {
    setShowFeedbackForm(false);
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.delete('feedback');
    const query = params.toString();
    const target = query ? `${pathname}?${query}` : pathname;
    router.replace(target, { scroll: false });
  };

  const handleFeedbackSubmit = (formData) => {
    const lang = searchParams?.get('lang');
    const langQuery = lang ? `?lang=${encodeURIComponent(lang)}` : '';
    setFeedbackSubmitted(true);
    setShowFeedbackForm(false);
    setShowFeedbackSuccess(true);
    setTimeout(() => {
      if (category && courseId) {
        router.push(`/courses/${category}/${courseId}${langQuery}`);
        return;
      }
      if (category) {
        router.push(`/courses/${category}`);
        return;
      }
      router.push('/courses');
    }, 5000);
  };

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

  if (submitted && showFeedbackForm) {
    return (
      <LayoutShell hideSidebar>
        <PageContainer className="py-8">
          <FeedbackForm
            questions={feedbackQuestions}
            onCancel={closeFeedbackForm}
            onSubmit={handleFeedbackSubmit}
            userId={userId}
            courseId={courseNumericId}
            courseVersion={courseVersion}
          />
        </PageContainer>
      </LayoutShell>
    );
  }

  if (submitted && showReattemptSuccessModal) {
    return (
      <div className="fixed inset-0 z-60 bg-black/40 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-14 h-14 text-success" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Request sent successfully</h2>
          <p className="text-gray-600 mb-4">
            Your re-attempt request has been sent to the administrator. You will be notified once it is approved.
          </p>
          <p className="text-sm text-muted-foreground">
            Redirecting you to the course page in 5 seconds...
          </p>
        </div>
      </div>
    );
  }

  if (showAutoSubmitModal) {
    return (
      <div className="fixed inset-0 z-110 bg-black/70 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-8 text-center">
          {timeLimitExceeded ? (
            <Clock className="w-14 h-14 text-destructive mx-auto mb-4" />
          ) : (
            <XCircle className="w-14 h-14 text-destructive mx-auto mb-4" />
          )}
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {timeLimitExceeded ? "Time&apos;s Up!" : 'Quiz Auto-Submitted'}
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            {timeLimitExceeded
              ? 'Your quiz has been automatically submitted.'
              : 'You switched tabs or exited fullscreen mode. Your quiz has been automatically submitted and scored based on your current answers.'}
          </p>
          {isSubmitting && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Submitting...
            </div>
          )}
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <ResultScreen
        passed={isPassed}
        score={score}
        resultData={resultData}
        onBackToCourses={handleBackToCourses}
        onTryAgain={handleTryAgain}
        onSendReattemptRequest={handleSendReattemptRequest}
        feedbackMandatory={feedbackMandatory}
        feedbackSubmitted={feedbackSubmitted}
        onOpenFeedback={openFeedbackForm}
        showFeedback={isFinalModule}
        continueLabel={isFinalModule ? null : 'Continue to next module'}
        attemptNumber={attemptNumber}
        maxAttempt={maxAttempt}
        reattemptRequired={reattemptRequired}
        reattemptSent={reattemptSent}
        reattemptLoading={reattemptLoading}
        reattemptError={reattemptError}
      />
    );
  }

  if (!quizStarted) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Before You Begin</h2>
          </div>
          <ul className="space-y-3 mb-8">
            {[
              "The quiz will run in fullscreen mode.",
              "Switching tabs or exiting fullscreen will automatically submit your quiz.",
              "Reloading or closing the page will also trigger auto-submission.",
              "Once the timer runs out, your quiz will be submitted automatically.",
              "You cannot pause the timer once you start.",
            ].map((rule, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                  {i + 1}
                </span>
                {rule}
              </li>
            ))}
          </ul>
          <button
            onClick={handleStartAssessment}
            className="w-full bg-primary text-white py-3 rounded-full font-semibold hover:bg-primary/90 transition cursor-pointer"
          >
            Start Assessment
          </button>
        </div>
      </div>
    );
  }

  const isLastQuestion = currentIndex === totalQuestions - 1;

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 flex flex-col">
      {/* Top Bar — floating card */}
      <div className="px-6 pt-6">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-primary">
              <Clock className="w-4 h-4" />
              <span className="font-semibold text-sm">
                {formatTime(timeLeft)}
              </span>
            </div>
            <span className="text-gray-400 text-sm">
              Question {currentIndex + 1} of {totalQuestions}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-2 bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question Area */}
      <div className="overflow-y-auto flex-1 flex items-start justify-center pt-8 pb-6 px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-3xl p-4">
          <div className="text-center mb-4">
            <span className="text-primary">
              Question {currentIndex + 1}
            </span>
          </div>

          <div className="">
            <h2 className="text-base font-medium text-gray-900 mb-3">
              {currentQuestion.question_text || currentQuestion.question}
            </h2>

            {/* How to answer: single vs multiple choice look alike, so say it explicitly. */}
            {(() => {
              const isText = ['Descriptive', 'Text', 'Short_answer'].includes(currentQuestion.question_type);
              const isMulti = currentQuestion.question_type === 'Multiple_select';
              const selectedCount = Array.isArray(answers[currentQuestion.id]) ? answers[currentQuestion.id].length : 0;
              const hint = isText
                ? { Icon: PenLine, title: "Written answer", text: "Type your answer in the box below." }
                : isMulti
                  ? { Icon: ListChecks, title: "Select all that apply", text: "More than one answer may be correct. Tick every correct option." }
                  : { Icon: CircleDot, title: "Select one answer", text: "Only one option is correct." };
              return (
                <div
                  className={`flex items-start gap-3 rounded-xl border px-4 py-3 mb-6 ${
                    isMulti ? "border-amber-200 bg-amber-50" : "border-primary/20 bg-primary-light/60"
                  }`}
                >
                  <hint.Icon className={`w-5 h-5 shrink-0 mt-0.5 ${isMulti ? "text-amber-600" : "text-primary"}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${isMulti ? "text-amber-800" : "text-primary-dark"}`}>{hint.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{hint.text}</p>
                  </div>
                  {isMulti && (
                    <span className="shrink-0 self-center text-xs font-medium text-amber-800 bg-white border border-amber-200 rounded-full px-2.5 py-1">
                      {selectedCount} selected
                    </span>
                  )}
                </div>
              );
            })()}

            {['Descriptive', 'Text', 'Short_answer'].includes(currentQuestion.question_type) ? (
              <div className="flex flex-col gap-2">
                <textarea
                  rows={5}
                  value={answers[currentQuestion.id] || ''}
                  onChange={handleTextChange}
                  placeholder="Type your answer here..."
                  className="w-full p-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary text-sm text-gray-800 resize-y"
                />
              </div>
             ) : (<div className="flex flex-col">
              {getQuestionOptions(currentQuestion).map((option, idx) => {
                const isMulti = currentQuestion.question_type === 'Multiple_select';
                const currentAns = answers[currentQuestion.id];
                const isSelected = isMulti 
                  ? (Array.isArray(currentAns) && currentAns.includes(idx))
                  : currentAns === idx;
                const label = option?.option_label ?? option?.option_key ?? "";
                
                return (
                  <label
                    key={option?.option_key ?? idx}
                    onClick={() => handleSelectOption(idx)}
                    className={`flex items-center gap-3 p-4 cursor-pointer rounded-xl border mb-4 shadow-sm transition-colors ${
                      isSelected ? "border-primary bg-primary-light/50" : "border-gray-100 hover:bg-gray-50"
                    }`}
                  >
                    <span
                      className={`shrink-0 flex items-center justify-center ${
                        isMulti
                          ? `w-5 h-5 rounded-md border-2 ${isSelected ? "border-primary bg-primary" : "border-gray-300 bg-white"}`
                          : `w-5 h-5 rounded-full border-2 ${isSelected ? "border-primary" : "border-gray-300 bg-white"}`
                      }`}
                    >
                      {isSelected && !isMulti && (
                        <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                      )}
                      {isSelected && isMulti && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                );
              })}
            </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="px-6 pb-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={`flex items-center gap-1.5 px-7 py-2.5 rounded-full text-sm font-semibold transition cursor-pointer ${
              currentIndex === 0
                ? "bg-gray-300 text-white cursor-not-allowed"
                : "bg-primary text-white hover:bg-primary/90"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <button
            onClick={isLastQuestion ? handleSubmit : handleNext}
            disabled={!hasAnswered || isSubmitting}
            className={`flex items-center gap-1.5 px-7 py-2.5 rounded-full text-sm font-semibold transition ${
              hasAnswered && !isSubmitting
                ? "bg-primary text-white hover:bg-primary/90 cursor-pointer"
                : "bg-gray-300 text-white cursor-not-allowed"
            }`}
          >
            {isLastQuestion ? (isSubmitting ? "Submitting..." : "Submit") : "Next"}
            {!isSubmitting && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
