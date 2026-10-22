'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import PageSection from '@/components/common/PageSection';
import PageHeader from '@/components/common/PageHeader';
import SurfaceCard from '@/components/common/SurfaceCard';
import Loader from '@/components/common/Loader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, MoreVertical, ChevronRight, Clock, BookOpen, GitBranch, Award, CalendarDays, Tag, Search, Layers, X } from 'lucide-react';
import Link from 'next/link';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { fetchUserCourseProgress, fetchCourseGroupLabelsByCategory, fetchCoursesByGroupLabel } from '@/features/courses/coursesAPI';
import { getLatestSubmission } from '../quizSubmissionAPI';
import { getCurrentUserId } from '@/lib/auth';

const CATEGORY_LABELS = {
  mandatory: 'Mandatory Training',
  orientation: 'Orientation',
  other: 'Other',
  all: 'Courses',
};

const COURSE_CARD_TITLE_CLASS = 'font-medium text-gray-900 text-lg leading-7 h-7 truncate';
const COURSE_CARD_ACTION_CLASS = 'mt-auto pt-2 min-h-[52px]';
const COURSE_CARD_ACTION_BUTTON_BASE = 'rounded-md font-normal px-6 py-2 flex items-center gap-2 w-full justify-center';
const COURSE_PAGE_SIZE = 6;
const COURSE_HARD_SCROLL_DISTANCE = 240;
const GROUP_LABEL_QUERY = 'group';
const ALL_GROUP_LABEL = { id: 'all', documentId: 'all', name: 'All' };

function groupLabelStorageKey(category) {
  return `course-group-label:${String(category || '').toLowerCase()}`;
}

function readPreferredGroupLabelId(category) {
  if (typeof window === 'undefined') return '';
  const fromUrl = new URLSearchParams(window.location.search).get(GROUP_LABEL_QUERY);
  if (fromUrl) return fromUrl;
  try {
    return sessionStorage.getItem(groupLabelStorageKey(category)) || '';
  } catch {
    return '';
  }
}

function rememberGroupLabel(category, documentId) {
  if (!documentId || typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(groupLabelStorageKey(category), documentId);
  } catch {
    // The address bar still records the label when storage is unavailable.
  }
  const params = new URLSearchParams(window.location.search);
  if (params.get(GROUP_LABEL_QUERY) === documentId) return;
  params.set(GROUP_LABEL_QUERY, documentId);
  const query = params.toString();
  window.history.replaceState(window.history.state, '', query ? `${window.location.pathname}?${query}` : window.location.pathname);
}

function formatDueDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ''));
  const date = match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CoursesCategoryPage({ category }) {
  const router = useRouter();
  const pathname = usePathname();
  const normalized = (category || '').toLowerCase();
  const title = CATEGORY_LABELS[normalized] || 'Courses';

  // State for group labels
  const [groupLabels, setGroupLabels] = useState([]);
  const [selectedGroupLabel, setSelectedGroupLabel] = useState(null);
  const [loadingLabels, setLoadingLabels] = useState(true);

  // Search state. The query is applied on the API so Hindi/Gujarati module text is included.
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  // State for courses per group label
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [listVersion, setListVersion] = useState(0);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
  });
  const paginationRef = useRef(pagination);
  const loadingRef = useRef(false);
  const requestIdRef = useRef(0);
  const scrollContainerRef = useRef(null);
  const isAllLabels = selectedGroupLabel?.documentId === ALL_GROUP_LABEL.documentId;
  paginationRef.current = pagination;

  // UI state
  const [openMenuId, setOpenMenuId] = useState(null);
  const [feedbackEligibility, setFeedbackEligibility] = useState({});
  const [startBlockModal, setStartBlockModal] = useState({
    open: false,
    title: '',
    message: '',
  });

  // Scroll visibility states for arrows
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const courseBgStyle = {
    backgroundImage: 'url(/course-page-bg.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };

  const scrollGroupLabels = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const checkScrollPosition = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setShowLeftArrow(scrollLeft > 5);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    checkScrollPosition();
    el.addEventListener('scroll', checkScrollPosition);
    window.addEventListener('resize', checkScrollPosition);

    return () => {
      el.removeEventListener('scroll', checkScrollPosition);
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, [groupLabels, checkScrollPosition]);

  // Load group labels for this category on mount
  useEffect(() => {
    let cancelled = false;
    setLoadingLabels(true);
    setSelectedGroupLabel(null);
    setGroupLabels([]);
    setCourses([]);
    
    fetchCourseGroupLabelsByCategory(category)
      .then((labels) => {
        if (cancelled) return;
        setGroupLabels(labels);

        const preferredId = readPreferredGroupLabelId(category);
        const preferredLabel = preferredId && preferredId !== ALL_GROUP_LABEL.documentId
          ? labels.find((label) => label.documentId === preferredId)
          : null;
        const nextLabel = preferredLabel || ALL_GROUP_LABEL;
        rememberGroupLabel(category, nextLabel.documentId);
        setSelectedGroupLabel(nextLabel);
        setLoadingLabels(false);
        setTimeout(checkScrollPosition, 50);
      })
      .catch((error) => {
        if (!cancelled) {
          console.error('Error loading group labels:', error);
          setLoadingLabels(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [category, checkScrollPosition]);

  const appendCourses = (currentCourses, incomingCourses) => {
    const seen = new Set(currentCourses.map((course) => String(course.id || course.documentId)));
    const nextCourses = incomingCourses.filter((course) => {
      const key = String(course?.id || course?.documentId);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return [...currentCourses, ...nextCourses];
  };

  useEffect(() => {
    const handle = setTimeout(() => setAppliedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  const loadCourses = useCallback(async (page) => {
    if (!selectedGroupLabel) return;

    const requestId = ++requestIdRef.current;
    loadingRef.current = true;
    setLoadingCourses(true);

    try {
      const result = await fetchCoursesByGroupLabel({
        category,
        groupLabelId: selectedGroupLabel.documentId,
        page,
        pageSize: COURSE_PAGE_SIZE,
        search: appliedSearch,
      });
      if (requestId !== requestIdRef.current) return;

      const items = result.items || [];
      if (page === 1) {
        setCourses(items);
      } else {
        setCourses((currentCourses) => appendCourses(currentCourses, items));
      }

      setPagination({
        currentPage: result.currentPage || page,
        totalPages: result.totalPages || 1,
        totalCount: result.totalCount || items.length,
      });
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      if (requestId === requestIdRef.current) {
        loadingRef.current = false;
        setLoadingCourses(false);
      }
    }
  }, [selectedGroupLabel, category, appliedSearch]);

  useEffect(() => {
    if (!selectedGroupLabel) {
      requestIdRef.current += 1;
      setCourses([]);
      return;
    }

    setCourses([]);
    setPagination({ currentPage: 1, totalPages: 1, totalCount: 0 });
    setListVersion((version) => version + 1);
    loadCourses(1);
  }, [selectedGroupLabel, category, loadCourses]);

  useEffect(() => {
    if (pathname !== `/courses/${category}`) return;

    setCourses((currentCourses) => currentCourses.slice(0, COURSE_PAGE_SIZE));
    setPagination((currentPagination) => ({
      ...currentPagination,
      currentPage: 1,
      totalPages: Math.max(1, Math.ceil(currentPagination.totalCount / COURSE_PAGE_SIZE)),
    }));
    setListVersion((version) => version + 1);
  }, [pathname, category]);

  const handleLoadMore = useCallback(() => {
    if (!selectedGroupLabel || loadingRef.current) return;
    const current = paginationRef.current;
    if (current.currentPage >= current.totalPages) return;

    loadCourses(current.currentPage + 1);
  }, [selectedGroupLabel, loadCourses]);

  const sentinelRef = useInfiniteScroll({
    isLoading: loadingCourses,
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
    onLoadMore: handleLoadMore,
    enabled: !!selectedGroupLabel && courses.length < pagination.totalCount,
    requireUserScroll: true,
    minScrollDistance: COURSE_HARD_SCROLL_DISTANCE,
    rootMargin: '0px 0px',
    resetKey: `${selectedGroupLabel?.documentId || ''}:${listVersion}`,
  });

  const handleGroupLabelSelect = (label) => {
    if (!label) return;
    rememberGroupLabel(category, label.documentId);
    setSelectedGroupLabel(label);
    setSearchQuery('');
    setAppliedSearch('');
  };

  const resetCourseListForNavigation = () => {
    setCourses((currentCourses) => currentCourses.slice(0, COURSE_PAGE_SIZE));
    setPagination((currentPagination) => ({
      ...currentPagination,
      currentPage: 1,
      totalPages: Math.max(1, Math.ceil(currentPagination.totalCount / COURSE_PAGE_SIZE)),
    }));
    setListVersion((version) => version + 1);
  };

  const handleFeedbackClick = async (event, course) => {
    event.preventDefault();
    event.stopPropagation();

    if (course?.isDueDatePassed) return;

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

  const handleStartCourse = (event, course, courseUrl) => {
    event.preventDefault();
    event.stopPropagation();

    if (course?.isDeadlineLocked) {
      setStartBlockModal({
        open: true,
        title: 'Course Disabled',
        message: 'This course is disabled because the due date has passed. Please contact admin to update the due date.',
      });
      return;
    }

    router.push(courseUrl);
  };

  const closeStartModal = () => {
    setStartBlockModal({ open: false, title: '', message: '' });
  };

  const handleStartModalOk = () => {
    closeStartModal();
  };

  const renderCourseCard = (course) => {
    const progressStatus = String(course.progressStatus || '').trim().toLowerCase();
    const isNotStarted = !course.completed && (!progressStatus || progressStatus === 'not_started');
    const isInProgress = !course.completed && (progressStatus === 'in_progress' || progressStatus === 'failed');
    const isCompleted = !!course.completed || progressStatus === 'completed';
    const isLockedByDeadline = !!course.isDeadlineLocked;
    const canShowCardMenu = !isCompleted || !course.feedbackSubmitted;
    const feedbackKey = String(course.id ?? course.documentId ?? '');
    const feedbackState = course.isDueDatePassed
      ? { checked: true, loading: false, canSubmit: false, reason: 'Feedback is closed because the due date has passed.' }
      : feedbackEligibility[feedbackKey] || {
          checked: false,
          loading: false,
          canSubmit: false,
          reason: '',
        };
    const courseUrl = `/courses/${category}/${course.documentId}`;

    return (
      <Link
        key={course.id}
        href={courseUrl}
        className="min-w-0"
        style={{ textDecoration: 'none' }}
        onClick={(event) => {
          if (
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
          ) {
            return;
          }

          if (isNotStarted || isInProgress) {
            if (isLockedByDeadline) {
              handleStartCourse(event, course, courseUrl);
              return;
            }

            resetCourseListForNavigation();
            handleStartCourse(event, course, courseUrl);
            return;
          }

          resetCourseListForNavigation();
        }}
      >
        <SurfaceCard className="flex flex-col h-full rounded-2xl p-0 overflow-hidden cursor-pointer">
          <div className="relative w-full overflow-hidden pt-4 px-4" style={{ height: 200 }}>
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
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <PlayCircle className="w-12 h-12 text-white/80" />
              </div>
            )}
          </div>

          <div
            className="flex flex-col flex-1 px-4 pb-4 gap-2"
            style={{ paddingLeft: 16, paddingRight: 16, paddingBottom: 16 }}
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground w-full gap-2">
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap min-w-0">
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <Clock className="w-4 h-4 shrink-0 text-muted-foreground" />
                  {(() => {
                    const minutes = Number(course.durationMinutes);
                    const fallbackHours = Number(course.duration);
                    const totalMinutes =
                      Number.isFinite(minutes) && minutes > 0
                        ? Math.round(minutes)
                        : Number.isFinite(fallbackHours) && fallbackHours > 0
                        ? Math.round(fallbackHours * 60)
                        : 0;
                    return totalMinutes > 0 ? `${totalMinutes} mins` : '—';
                  })()}
                </span>

                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <BookOpen className="w-4 h-4 shrink-0 text-muted-foreground" />
                  {course.modules} modules
                </span>

                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <GitBranch className="w-4 h-4 shrink-0 text-muted-foreground" />
                  v{course.courseVersion}
                </span>
              </div>

              <div className="relative shrink-0 h-7 w-7 flex items-center justify-center ml-auto">
                {canShowCardMenu ? (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenMenuId((prev) => {
                          const next = prev === course.id ? null : course.id;
                          if (next === course.id && !course.isDueDatePassed) {
                            ensureFeedbackEligibility(course);
                          }
                          return next;
                        });
                      }}
                      className="p-1 rounded-full hover:bg-gray-100 text-muted-foreground transition-colors"
                      title="More options"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {openMenuId === course.id && (
                      <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-20">
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

            <div className={COURSE_CARD_TITLE_CLASS} title={course.title}>
              {course.title}
            </div>

            <div className="flex items-center justify-between gap-2 min-h-[24px] mt-1">
              {course.courseGroupLabel && course.courseGroupLabel.name ? (
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    {course.courseGroupLabel.name}
                  </span>
                </div>
              ) : (
                <div></div>
              )}

              {course.deadline && formatDueDate(course.deadline) && (
                <span
                  className={`flex items-center gap-1.5 whitespace-nowrap text-xs ${
                    isLockedByDeadline ? 'text-red-600 font-medium' : 'text-muted-foreground'
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                  {`Due ${formatDueDate(course.deadline)}`}
                </span>
              )}
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
                  {isLockedByDeadline ? 'Course Disabled' : 'Continue Course'}{' '}
                  <ChevronRight className={`w-5 h-5 ${isLockedByDeadline ? 'opacity-60' : ''}`} />
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
                  {isLockedByDeadline ? 'Course Disabled' : 'Start Course'}{' '}
                  <ChevronRight className={`w-5 h-5 ${isLockedByDeadline ? 'opacity-60' : ''}`} />
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
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#fafafa]" style={courseBgStyle}>
      <PageHeader
        title={
          <div className="flex flex-col">
            <span className="text-3xl font-bold text-gray-900">{title}</span>
            <span className="text-sm font-medium text-gray-500 mt-1">
              Explore and complete courses to grow your skills
            </span>
          </div>
        }
        titleRight={
          <div className="relative w-full sm:w-[260px] shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses..."
              className="w-full h-10 pl-9 pr-9 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        }
        breadcrumbs={[
          { label: 'Courses', href: '/courses' },
          { label: title },
        ]}
        showBreadcrumbSeparator
        containerClassName="pt-xl pb-5 px-xl bg-transparent"
      />

      <main>
        <PageSection className="px-xl pt-2">
            {/* Group Tab Pills Row with Prominent Circular Arrows & Fades */}
            {!loadingLabels && groupLabels.length > 0 && (
  <div className="mb-6 relative flex items-center">
    {/* Left Fade Overlay & Circular Arrow Button */}
    {showLeftArrow && (
      <div className="absolute left-0 z-30 h-full flex items-center pl-2 bg-gradient-to-r from-[#fafafa] via-[#fafafa]/80 to-transparent pointer-events-none">
        <button
          type="button"
          onClick={() => scrollGroupLabels('left')}
          className="pointer-events-auto flex items-center justify-center w-9 h-9 bg-white/80 backdrop-blur-md hover:bg-gray-900 border border-gray-300 rounded-full shadow-lg text-gray-800 hover:text-white transition-all hover:scale-105 active:scale-95 group"
          title="Scroll left"
        >
          <ChevronRight className="w-5 h-5 rotate-180 stroke-[2.5]" />
        </button>
      </div>
    )}

    {/* Scrollable Container with Hidden Scrollbars */}
    <div
      ref={scrollContainerRef}
      onScroll={checkScrollPosition}
      className="w-full overflow-x-auto px-1 py-1 flex items-center gap-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      <div className="flex items-center gap-2 min-w-max">
        <button
          type="button"
          onClick={() => handleGroupLabelSelect(ALL_GROUP_LABEL)}
          className={`whitespace-nowrap px-4 py-2 text-sm font-medium rounded-xl transition-all shadow-sm ${
            selectedGroupLabel?.documentId === ALL_GROUP_LABEL.documentId
              ? 'bg-primary text-white shadow-primary/25'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          {ALL_GROUP_LABEL.name}
        </button>

        {groupLabels.map((label) => {
          const isSelected = selectedGroupLabel?.documentId === label.documentId;
          return (
            <button
              key={label.documentId}
              type="button"
              onClick={() => handleGroupLabelSelect(label)}
              className={`whitespace-nowrap px-4 py-2 text-sm font-medium rounded-xl transition-all shadow-sm ${
                isSelected
                  ? 'bg-primary text-white shadow-primary/25'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {label.name}
            </button>
          );
        })}
      </div>
    </div>

    {/* Right Fade Overlay & Circular Arrow Button */}
    {showRightArrow && (
      <div className="absolute right-0 z-30 h-full flex items-center pr-2 bg-gradient-to-l from-[#fafafa] via-[#fafafa]/80 to-transparent pointer-events-none">
        <button
          type="button"
          onClick={() => scrollGroupLabels('right')}
          className="pointer-events-auto flex items-center justify-center w-9 h-9 bg-white/80 backdrop-blur-md hover:bg-gray-900 border border-gray-300 rounded-full shadow-lg text-gray-800 hover:text-white transition-all hover:scale-105 active:scale-95 group"
          title="Scroll right"
        >
          <ChevronRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>
    )}
  </div>
)}

            {loadingLabels ? (
              <div className="min-h-[50vh] flex items-center justify-center">
                <Loader size="lg" />
              </div>
            ) : (
              <>
                {selectedGroupLabel && (
                  <>
                    {loadingCourses && courses.length === 0 ? (
                      <div className="min-h-[30vh] flex items-center justify-center">
                        <Loader size="lg" />
                      </div>
                    ) : courses.length === 0 ? (
                      <div className="text-center py-20">
                        <p className="text-body text-gray-medium">
                          {searchQuery ? 'No courses match your search query.' : (isAllLabels ? 'No courses found in this category' : 'No courses found in this group')}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {courses.map(renderCourseCard)}
                        </div>

                        {pagination.currentPage < pagination.totalPages && (
                          <div ref={sentinelRef} className="py-4 flex justify-center mt-6">
                            {loadingCourses ? (
                              <Loader size="sm" />
                            ) : (
                              <span className="text-small text-muted-foreground">
                                Scroll to load more
                              </span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
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