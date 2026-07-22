'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PageSection from '@/components/common/PageSection';
import PageHeader from '@/components/common/PageHeader';
import SurfaceCard from '@/components/common/SurfaceCard';
import Loader from '@/components/common/Loader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, MoreVertical, ChevronRight, Clock, BookOpen, Users, Award } from 'lucide-react';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadAllCourses } from '@/features/courses/coursesSlice';
import { selectCoursesList, selectCoursesLoading, selectCurrentPage, selectTotalPages } from '@/features/courses/coursesSelectors';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { fetchCourseWorkflows, fetchUserCourseProgress } from '@/features/courses/coursesAPI';
import { getLatestSubmission } from '../quizSubmissionAPI';
import { getCurrentUserId } from '@/lib/auth';

const CATEGORY_LABELS = {
  mandatory: 'Mandatory Training',
  orientation: 'Orientation',
  other: 'Other',
  all: 'Courses',
};

const COURSE_CARD_META_ROW_CLASS = 'flex items-center gap-6 text-small text-muted-foreground h-8';
const COURSE_CARD_TITLE_CLASS = 'font-medium text-gray-900 text-lg leading-7 h-7 truncate';
const COURSE_CARD_ACTION_CLASS = 'mt-auto pt-2 min-h-[52px]';
const COURSE_CARD_ACTION_BUTTON_BASE = 'rounded-md font-normal px-6 py-2 flex items-center gap-2 w-full justify-center';
const PAGE_SIZE = 24;

export default function CoursesCategoryPage({ category }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const allCourses = useAppSelector(selectCoursesList);
  const isLoading = useAppSelector(selectCoursesLoading);
  const currentPage = useAppSelector(selectCurrentPage);
  const totalPages = useAppSelector(selectTotalPages);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [feedbackEligibility, setFeedbackEligibility] = useState({});
  const [courseWorkflows, setCourseWorkflows] = useState([]);
  const [workflowLoaded, setWorkflowLoaded] = useState(false);
  const [startBlockModal, setStartBlockModal] = useState({
    open: false,
    title: '',
    message: '',
    kind: 'block',
    prerequisite: null,
    managerName: '',
  });

  const logWorkflowDebug = (label, payload) => {
    if (process.env.NODE_ENV === 'production') return;
    console.log(`[workflow-debug] ${label}`, payload);
  };

  useEffect(() => {
    dispatch(loadAllCourses({ page: 1, pageSize: PAGE_SIZE }));
  }, [dispatch]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const workflows = await fetchCourseWorkflows();
        if (!alive) return;
        setCourseWorkflows(Array.isArray(workflows) ? workflows : []);
      } catch (error) {
        console.error('Failed to load course workflows:', error);
        if (!alive) return;
        setCourseWorkflows([]);
      } finally {
        if (!alive) return;
        setWorkflowLoaded(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // Handle loading next page
  const handleLoadMore = useCallback(() => {
    dispatch(loadAllCourses({ page: currentPage + 1, pageSize: PAGE_SIZE }));
  }, [dispatch, currentPage]);

  // Set up infinite scroll with custom hook
  const sentinelRef = useInfiniteScroll({
    isLoading,
    currentPage,
    totalPages,
    onLoadMore: handleLoadMore,
  });

  const normalized = (category || '').toLowerCase();
  const title = CATEGORY_LABELS[normalized] || 'Courses';

  const courses = useMemo(() => {
    if (!normalized || normalized === 'all') return allCourses;
    return allCourses.filter(
      c => (c.category || '').toLowerCase() === normalized
    );
  }, [allCourses, normalized]);

  const courseBgStyle = {
    backgroundImage: 'url(/course-page-bg.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };

  const handleFeedbackClick = async (event, course) => {
    event.preventDefault();
    event.stopPropagation();

    const userId = getCurrentUserId();
    if (!userId) {
      window.alert('Please log in to submit feedback.');
      return;
    }

    const courseNumericId = course.id ?? course.documentId;
    if (!courseNumericId) {
      window.alert('Unable to determine course. Please open the course detail page.');
      return;
    }

    try {
      const [progressInfo, latest] = await Promise.all([
        fetchUserCourseProgress(userId, courseNumericId, { fresh: true }),
        getLatestSubmission(userId, courseNumericId),
      ]);

      const passedQuiz = latest?.submission?.passed === true;
      const feedbackSubmitted = progressInfo?.feedbackSubmitted === true;

      if (passedQuiz && !feedbackSubmitted) {
        setOpenMenuId(null);
        const feedbackUrl = `/courses/${category}/${course.documentId}?feedback=1`;
        window.location.href = feedbackUrl;
      } else {
        window.alert(
          feedbackSubmitted
            ? 'Feedback has already been submitted for this course.'
            : 'Feedback will be enabled only after you pass the assessment.'
        );
      }
    } catch (err) {
      console.error('Failed to check feedback eligibility:', err);
      window.alert('Could not verify feedback eligibility. Please open the course to continue.');
    }
  };

  const ensureFeedbackEligibility = async (course) => {
    const key = String(course.id ?? course.documentId ?? '');
    if (!key) return;

    const existing = feedbackEligibility[key];
    if (existing && (existing.loading || existing.checked)) return;

    const userId = getCurrentUserId();
    const courseNumericId = course.id ?? course.documentId;

    if (!userId) {
      setFeedbackEligibility((prev) => ({
        ...prev,
        [key]: {
          checked: true,
          loading: false,
          canSubmit: false,
          reason: 'Please log in to submit feedback.',
        },
      }));
      return;
    }

    if (!courseNumericId) {
      setFeedbackEligibility((prev) => ({
        ...prev,
        [key]: {
          checked: true,
          loading: false,
          canSubmit: false,
          reason: 'Course information is incomplete.',
        },
      }));
      return;
    }

    setFeedbackEligibility((prev) => ({
      ...prev,
      [key]: {
        checked: false,
        loading: true,
        canSubmit: false,
        reason: '',
      },
    }));

    try {
      const [progressInfo, latest] = await Promise.all([
        fetchUserCourseProgress(userId, courseNumericId, { fresh: true }),
        getLatestSubmission(userId, courseNumericId),
      ]);
      const passedQuiz = latest?.submission?.passed === true;
      const feedbackSubmitted = progressInfo?.feedbackSubmitted === true;
      const canSubmit = passedQuiz && !feedbackSubmitted;

      let reason = '';
      if (!passedQuiz) {
        reason = 'Enable after passing this course assessment.';
      } else if (feedbackSubmitted) {
        reason = 'Feedback already submitted.';
      }

      setFeedbackEligibility((prev) => ({
        ...prev,
        [key]: {
          checked: true,
          loading: false,
          canSubmit,
          reason,
        },
      }));
    } catch {
      setFeedbackEligibility((prev) => ({
        ...prev,
        [key]: {
          checked: true,
          loading: false,
          canSubmit: false,
          reason: 'Could not verify eligibility right now.',
        },
      }));
    }
  };

  const asComparableId = (value) => (value == null ? '' : String(value));

  const matchesCourseRef = (courseRef, course) => {
    if (!courseRef || !course) return false;
    const currentId = asComparableId(course.id);
    const currentDocumentId = asComparableId(course.documentId);
    const refId = asComparableId(courseRef.id);
    const refDocumentId = asComparableId(courseRef.documentId);
    const currentTitle = String(course.title || '').trim().toLowerCase();
    const refTitle = String(courseRef.title || '').trim().toLowerCase();

    if (refId && currentId && refId === currentId) return true;
    if (refDocumentId && currentDocumentId && refDocumentId === currentDocumentId) return true;
    if (refTitle && currentTitle && refTitle === currentTitle) return true;
    return false;
  };

  const preferredCourseReference = (value, fallback = null) => {
    if (Array.isArray(value)) {
      return value.length > 0 ? value : fallback;
    }
    return value || fallback;
  };

  const matchesAnyCourseRef = (courseRefs, course) => {
    if (Array.isArray(courseRefs)) {
      return courseRefs.some((ref) => matchesCourseRef(ref, course));
    }
    return matchesCourseRef(courseRefs, course);
  };

  const findCourseFromReference = (courseRef) => {
    const refs = Array.isArray(courseRef) ? courseRef : [courseRef];
    return allCourses.find((item) => refs.some((ref) => matchesCourseRef(ref, item))) || null;
  };

  const isPrerequisiteCourseCompleted = (course) => {
    if (!course) return false;
    if (course.progressStatus != null) {
      return String(course.progressStatus).trim().toLowerCase() === 'completed';
    }
    return course.completed === true;
  };

  const isWorkflowAssignedToCurrentUser = (workflow, userId) => {
    if (!workflow || !userId) return false;
    const target = asComparableId(userId);
    const users = Array.isArray(workflow.users) ? workflow.users : [];
    if (users.length === 0 && Number.isFinite(workflow?.usersCount) && workflow.usersCount > 0) {
      return true;
    }
    return users.some((user) => {
      const id = asComparableId(user?.id);
      const documentId = asComparableId(user?.documentId);
      return (id && id === target) || (documentId && documentId === target);
    });
  };

  const resolvePrerequisiteModule = (workflow, module) => {
    if (!workflow || !module) return null;
    let prerequisite = module.prerequisiteModule;
    if (prerequisite == null) return null;

    if (Array.isArray(prerequisite)) {
      prerequisite = prerequisite[0] ?? null;
    }
    if (prerequisite == null) return null;

    if (prerequisite?.data) {
      prerequisite = prerequisite.data;
    }

    const rawPrerequisite = typeof prerequisite === 'object'
      ? (prerequisite.id ?? prerequisite.moduleId ?? prerequisite.module_id ?? prerequisite.value)
      : prerequisite;

    const prerequisiteId = asComparableId(rawPrerequisite);
    const prerequisiteNumeric = Number(rawPrerequisite);

    if (prerequisiteId) {
      const matched = workflow.modules.find((workflowModule) => {
        const workflowModuleId = asComparableId(workflowModule?.id);
        const workflowModuleDocumentId = asComparableId(workflowModule?.documentId);
        return (workflowModuleId && workflowModuleId === prerequisiteId)
          || (workflowModuleDocumentId && workflowModuleDocumentId === prerequisiteId);
      });
      if (matched) return matched;
    }

    if (Number.isInteger(prerequisiteNumeric) && prerequisiteNumeric >= 0) {
      const byModuleIndex = workflow.modules.find((workflowModule) => workflowModule?.moduleIndex === prerequisiteNumeric);
      if (byModuleIndex) return byModuleIndex;
    }

    if (typeof prerequisite === 'object') {
      return {
        id: prerequisite.id ?? null,
        documentId: prerequisite.documentId ?? null,
        moduleType: prerequisite.moduleType || prerequisite.module_type || '',
        course: prerequisite.course || null,
        offlineModules: Array.isArray(prerequisite.offlineModules)
          ? prerequisite.offlineModules
          : Array.isArray(prerequisite.offline_module)
            ? prerequisite.offline_module
            : [],
      };
    }

    return null;
  };

  const hasOfflineValuesWithoutUsername = (offlineModules) => {
    const entries = Array.isArray(offlineModules) ? offlineModules : [];
    return entries.some((entry) => {
      if (!entry || typeof entry !== 'object') return false;
      const scoreFilled = entry.score != null;
      const attemptFilled = entry.attempt != null;
      const descriptionText = typeof entry.description === 'string'
        ? entry.description.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
        : '';
      const descriptionFilled = descriptionText.length > 0;
      const attachmentFilled = Array.isArray(entry.attachment)
        ? entry.attachment.length > 0
        : !!entry.attachment;

      return scoreFilled || attemptFilled || descriptionFilled || attachmentFilled;
    });
  };

  const findApplicableWorkflowModule = (course, workflowsInput = courseWorkflows) => {
    const userId = getCurrentUserId();
    if (!userId) return null;

    const availableWorkflows = Array.isArray(workflowsInput) ? workflowsInput : [];

    for (const workflow of availableWorkflows) {
      if (!isWorkflowAssignedToCurrentUser(workflow, userId)) continue;

      const workflowModules = Array.isArray(workflow.modules) ? workflow.modules : [];
      const currentModule = workflowModules.find(
        (item) => String(item?.moduleType || '').toLowerCase() === 'online' && matchesAnyCourseRef(preferredCourseReference(item?.courseRefs, item?.course), course)
      );
      if (currentModule) {
        return { workflow, currentModule };
      }
    }

    return null;
  };

  const handleStartCourse = async (event, course, courseUrl) => {
    event.preventDefault();
    event.stopPropagation();

    if (course?.isDeadlineLocked) {
      setStartBlockModal({
        open: true,
        title: 'Course Disabled',
        message: 'This course is disabled because the due date has passed. Please contact admin to update the due date.',
        kind: 'deadline',
        prerequisite: null,
        managerName: '',
      });
      return;
    }

    const currentUserId = getCurrentUserId();
    logWorkflowDebug('start-click', {
      currentUserId,
      clickedCourse: {
        id: course?.id,
        documentId: course?.documentId,
        title: course?.title,
        progressStatus: course?.progressStatus,
        completed: course?.completed,
      },
      workflowsLoaded: workflowLoaded,
      cachedWorkflowCount: Array.isArray(courseWorkflows) ? courseWorkflows.length : 0,
    });

    let workflowsForCheck = Array.isArray(courseWorkflows) ? courseWorkflows : [];
    try {
      const freshWorkflows = await fetchCourseWorkflows({ fresh: true });
      workflowsForCheck = Array.isArray(freshWorkflows) ? freshWorkflows : [];
      setCourseWorkflows(workflowsForCheck);
      logWorkflowDebug('start-click-fresh-workflow-fetch', {
        fetchedWorkflowCount: workflowsForCheck.length,
        workflows: workflowsForCheck,
      });
    } catch (error) {
      console.error('Failed to fetch workflows before start:', error);
    } finally {
      setWorkflowLoaded(true);
    }

    const applicable = findApplicableWorkflowModule(course, workflowsForCheck);
    logWorkflowDebug('applicable-workflow', applicable || null);
    if (applicable) {
      const prerequisiteModule = resolvePrerequisiteModule(applicable.workflow, applicable.currentModule);
      const prerequisiteType = String(prerequisiteModule?.moduleType || '').trim().toLowerCase();
      const prerequisiteCourseRef = preferredCourseReference(prerequisiteModule?.courseRefs, prerequisiteModule?.course);
      const offlineModules = Array.isArray(prerequisiteModule?.offlineModules)
        ? prerequisiteModule.offlineModules
        : [];
      logWorkflowDebug('resolved-prerequisite', {
        prerequisiteModule,
        prerequisiteType,
        offlineModules,
      });

      if (prerequisiteType === 'offline') {
        const hasOfflineValues = hasOfflineValuesWithoutUsername(offlineModules);
        logWorkflowDebug('offline-prerequisite-block', {
          workflow: applicable.workflow,
          prerequisiteModule,
          offlineModules,
          hasOfflineValues,
        });
        if (hasOfflineValues) {
          logWorkflowDebug('offline-prerequisite-filled-allow-navigation', {
            courseUrl,
            offlineModules,
          });
          router.push(courseUrl);
          return;
        }
        const managerName = applicable.workflow?.managerName || 'your manager';
        setStartBlockModal({
          open: true,
          title: 'Offline Prerequisite Required',
          message: 'You have one offline module that must be completed before starting this course. Please contact your manager to complete it.',
          kind: 'block-offline',
          prerequisite: null,
          managerName,
        });
        return;
      }

      if (prerequisiteType === 'online') {
        const prerequisiteCourse = prerequisiteCourseRef;
        const matchedCourse = findCourseFromReference(prerequisiteCourse);
        const completed = isPrerequisiteCourseCompleted(matchedCourse);
        logWorkflowDebug('online-prerequisite-course', {
          prerequisiteCourse,
          matchedCourse,
          completed,
        });

        if (!completed) {
          const linkedCourse = matchedCourse || prerequisiteCourse;
          const courseName = linkedCourse?.title || 'Prerequisite course';
          const courseCategory = String(linkedCourse?.category || 'all').toLowerCase();
          const courseDocumentId = linkedCourse?.documentId || '';
          const link = courseDocumentId ? `/courses/${courseCategory}/${courseDocumentId}` : '';

          setStartBlockModal({
            open: true,
            title: 'Prerequisite Required',
            message: 'You must complete prerequisite course first:',
            kind: 'block-online',
            prerequisite: { name: courseName, link },
            managerName: '',
          });
          return;
        }
      }
    }

    logWorkflowDebug('navigation-allowed', {
      courseUrl,
    });

    router.push(courseUrl);
  };

  const closeStartModal = () => {
    setStartBlockModal({
      open: false,
      title: '',
      message: '',
      kind: 'block',
      prerequisite: null,
      managerName: '',
    });
  };

  const handleStartModalOk = () => {
    closeStartModal();
  };

  return (
    <div className="min-h-screen bg-[#fafafa]" style={courseBgStyle}>
      <PageHeader
        title={title}
        breadcrumbs={[
          { label: 'Courses', href: '/courses' },
          { label: title },
        ]}
        showBreadcrumbSeparator
        containerClassName="pt-xl pb-0 px-xl bg-transparent"
      >
        <p className="text-body text-muted-foreground">
          Explore and complete courses to grow your skills
        </p>
      </PageHeader>
      <main>
        <PageSection className="pt-md">
          {isLoading && currentPage === 1 ? (
            <div className="min-h-[50vh] flex items-center justify-center">
              <Loader size="lg" />
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-body text-gray-medium">No courses found</p>
            </div>
          ) : (
            <>
              <div className="grid w-full gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(350px,1fr))]">
                {courses.map((course) => {
                const isNotStarted = !course.completed && (!course.progressStatus || course.progressStatus === 'Not_started');
                const isInProgress = !course.completed && (course.progressStatus === 'In_progress' || course.progressStatus === 'Failed');
                const isCompleted = !!course.completed || course.progressStatus === 'Completed';
                const isLockedByDeadline = !!course.isDeadlineLocked;
                const canShowCardMenu = !isCompleted || !course.feedbackSubmitted;
                const feedbackKey = String(course.id ?? course.documentId ?? '');
                const feedbackState = feedbackEligibility[feedbackKey] || {
                  checked: false,
                  loading: false,
                  canSubmit: false,
                  reason: '',
                };
                const courseUrl = `/courses/${category}/${course.documentId}`;
                const cardContent = (
                  <SurfaceCard key={course.id} className="flex flex-col h-full rounded-2xl p-0 overflow-hidden cursor-pointer">
                    <div className="relative w-full overflow-hidden pt-4 px-4" style={{ height: 220 }}>
                      <img
                        src={course.image}
                        alt={course.title}
                        className="w-full h-full object-cover rounded-3xl"
                        style={{ borderRadius: '18px' }}
                      />
                      <div className="absolute top-6 left-6 flex items-center gap-2 w-full pr-4">
                        {course.completed && (
                          <Badge
                            className="inline-flex items-center justify-center rounded-md px-3 py-1 border border-transparent text-white"
                            style={{ background: 'rgba(156, 46, 219, 0.7)' }}
                          >
                            Completed
                          </Badge>
                        )}
                        {course.completed && course.certificationGenerated && (
                          <span className="absolute top-0 right-0 mr-12 bg-yellow rounded-md p-1 shadow-md flex items-center">
                            <Award className="w-6 h-6 text-white" />
                          </span>
                        )}
                      </div>
                      {course.contentType === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <PlayCircle className="w-12 h-12 text-white/80" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col flex-1 px-4 pb-4 gap-2" style={{ paddingLeft: 16, paddingRight: 16, paddingBottom: 16 }}>
                      <div className={COURSE_CARD_META_ROW_CLASS}>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {(() => {
                            const minutes = Number(course.durationMinutes);
                            const fallbackHours = Number(course.duration);
                            const totalMinutes = Number.isFinite(minutes) && minutes > 0
                              ? Math.round(minutes)
                              : Number.isFinite(fallbackHours) && fallbackHours > 0
                                ? Math.round(fallbackHours * 60)
                                : 0;
                            return totalMinutes > 0 ? `${totalMinutes} mins` : '—';
                          })()}
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {course.modules} modules
                        </span>
                        <span className="flex-1" />
                        <div className="relative ml-auto h-7 w-7 flex items-center justify-center">
                          {canShowCardMenu ? (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setOpenMenuId((prev) => {
                                    const next = prev === course.id ? null : course.id;
                                    if (next === course.id) {
                                      ensureFeedbackEligibility(course);
                                    }
                                    return next;
                                  });
                                }}
                                className="p-1 rounded-full hover:bg-gray-100 text-muted-foreground"
                                title="More options"
                              >
                                <MoreVertical className="w-5 h-5" />
                              </button>
                              {openMenuId === course.id && (
                                <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-20">
                                  <button
                                    type="button"
                                    onClick={(e) => handleFeedbackClick(e, course)}
                                    disabled={feedbackState.loading || !feedbackState.canSubmit}
                                    title={feedbackState.reason || undefined}
                                    className={`w-full text-left px-3 py-2 text-sm ${
                                      feedbackState.loading || !feedbackState.canSubmit
                                        ? 'text-gray-400 cursor-not-allowed bg-gray-50'
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                  >
                                    {feedbackState.loading ? 'Checking...' : 'Feedback'}
                                  </button>
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="inline-block h-7 w-7" aria-hidden="true" />
                          )}
                        </div>
                      </div>
                      <div
                        className={COURSE_CARD_TITLE_CLASS}
                        title={course.title}
                      >
                        {course.title}
                      </div>
                      <div className={COURSE_CARD_ACTION_CLASS}>
                        {isInProgress && (
                          <Button
                            onClick={(event) => handleStartCourse(event, course, courseUrl)}
                            className={`${COURSE_CARD_ACTION_BUTTON_BASE} ${
                              isLockedByDeadline
                                ? 'bg-gray-300 text-gray-700 hover:bg-gray-300 cursor-pointer'
                                : 'bg-primary text-white'
                            }`}
                          >
                            {isLockedByDeadline ? 'Course Disabled' : 'Continue Course'} <ChevronRight className={`w-5 h-5 ${isLockedByDeadline ? 'opacity-60' : ''}`} />
                          </Button>
                        )}
                        {isNotStarted && (
                          <Button
                            onClick={(event) => handleStartCourse(event, course, courseUrl)}
                            className={`${COURSE_CARD_ACTION_BUTTON_BASE} ${
                              isLockedByDeadline
                                ? 'bg-gray-300 text-gray-700 hover:bg-gray-300 cursor-pointer'
                                : 'bg-primary text-white'
                            }`}
                          >
                            {isLockedByDeadline ? 'Course Disabled' : 'Start Course'} <ChevronRight className={`w-5 h-5 ${isLockedByDeadline ? 'opacity-60' : ''}`} />
                          </Button>
                        )}
                        {isCompleted && (
                          <Button className={`${COURSE_CARD_ACTION_BUTTON_BASE} bg-primary text-white`}>
                            Review <ChevronRight className="w-5 h-5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </SurfaceCard>
                );

                return (
                  <Link
                    key={course.id}
                    href={courseUrl}
                    style={{ textDecoration: 'none' }}
                    onClick={(event) => {
                      if (isNotStarted || isInProgress) {
                        handleStartCourse(event, course, courseUrl);
                      }
                    }}
                  >
                    {cardContent}
                  </Link>
                );
              })}
              </div>

              {/* Sentinel — triggers next page load when scrolled into view */}
              <div ref={sentinelRef} className="py-4 flex justify-center">
                {isLoading && <Loader size="sm" />}
              </div>
            </>
          )}
        </PageSection>
      </main>

      {startBlockModal.open && (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-black/45 px-4">
          <div className="w-[min(92vw,520px)] rounded-2xl bg-white border border-gray-200 shadow-2xl p-6">
            <h3 className="text-xl font-semibold text-gray-900 leading-7 break-words">{startBlockModal.title}</h3>
            <p className="mt-3 text-sm text-gray-600 leading-6 whitespace-normal break-words">
              {startBlockModal.message}
            </p>
            {startBlockModal.kind === 'block-online' && startBlockModal.prerequisite && (
              <div className="mt-3">
                <div className="rounded-md bg-gray-50 border border-gray-200 p-3 text-sm text-gray-700">
                  <div className="leading-6 break-words"><span className="font-semibold">Course Name:</span> {startBlockModal.prerequisite.name}</div>
                  <div className="leading-6 break-all">
                    <span className="font-semibold">Course Redirection Link:</span>{' '}
                    {startBlockModal.prerequisite.link ? (
                      <Link
                        href={startBlockModal.prerequisite.link}
                        className="text-primary underline"
                        onClick={closeStartModal}
                      >
                        {startBlockModal.prerequisite.link}
                      </Link>
                    ) : (
                      <span className="text-gray-500">Not available</span>
                    )}
                  </div>
                </div>
              </div>
            )}
            {startBlockModal.kind === 'block-offline' && (
              <div className="mt-3 rounded-md bg-gray-50 border border-gray-200 p-3 text-sm text-gray-700 leading-6 break-words">
                <span className="font-semibold">Manager:</span> {startBlockModal.managerName || 'your manager'}
              </div>
            )}
            <div className="mt-5 flex justify-end">
              <Button
                onClick={handleStartModalOk}
                className="bg-primary text-white"
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
