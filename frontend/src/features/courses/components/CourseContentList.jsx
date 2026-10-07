import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  PlayCircle,
  CheckCircle2,
  MonitorPlay,
  ChevronUp,
  ChevronDown,
  SquareCheckBig,
  ChevronRight,
  Lock,
  ClipboardCheck,
  Hourglass,
  XCircle,
  RotateCcw,
  MessageSquare,
} from "lucide-react";


// "attempt 2 of 2"; past the limit (an approved re-attempt) the limit is left out: "extra attempt 3".
function attemptLabel(quiz) {
  if (quiz.max_attempt && quiz.attempts > quiz.max_attempt) return `extra attempt ${quiz.attempts}`;
  return quiz.max_attempt ? `attempt ${quiz.attempts} of ${quiz.max_attempt}` : `attempt ${quiz.attempts}`;
}

function ModuleCircle({ moduleNumber, moduleStatus, isSelected }) {
  if (isSelected) {
    return (
      <span className="inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold shrink-0 bg-primary/20 text-primary">
        {moduleNumber}
      </span>
    );
  }

  if (moduleStatus === "completed") {
    return (
      <span className="inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold shrink-0 bg-success">
        <CheckCircle2 className="w-5 h-5 text-white" />
      </span>
    );
  }

  if (moduleStatus === "locked") {
    return (
      <span className="inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold shrink-0 bg-gray-200">
        <Lock className="w-5 h-5 text-gray-500" />
      </span>
    );
  }

  return (
    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold shrink-0 bg-white border-2 border-primary text-primary">
      {moduleNumber}
    </span>
  );
}

/**
 * quizActions: what used to be the separate "Module Quiz" card, now shown on the module card itself.
 *   { moduleId, needsRequest, pending, rejected, loading, error, onSendRequest } — re-attempt for that module's quiz
 *   { needsFeedback, onOpenFeedback, courseCompleted } — on the last module's card
 */
export default function CourseContentList({ contents, current, onSelect, courseId, category, course, selectedLanguage, onMarkAsRead, moduleStates, onTakeQuiz, quizActions = {} }) {
  // Use language-filtered contents when provided so sidebar shows only selected language; else full list
  const modules =
    Array.isArray(contents)
      ? contents
      : Array.isArray(course?.modulesList)
        ? course.modulesList
        : Array.isArray(course?.modules)
          ? course.modules
          : [];
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const currentModuleId = params.moduleId ?? searchParams.get('moduleId');

  const defaultModuleId = modules?.[0]?.moduleId || modules?.[0]?.id;
  const activeModuleId = currentModuleId ?? current ?? defaultModuleId;
  const [openModuleId, setOpenModuleId] = useState(activeModuleId || defaultModuleId);

  useEffect(() => {
    if (activeModuleId) {
      setOpenModuleId(activeModuleId);
    } else if (defaultModuleId && !currentModuleId && course?.documentId) {
      const url = `/courses/${category}/${course.documentId}`;
      router.replace(url);
    }
    // router is stable and doesn't need to be in dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModuleId, defaultModuleId, category, courseId, params.id, currentModuleId, course]);

  // Keep the open module in view when the list scrolls inside the right column (no-op when it does not scroll).
  const listRef = useRef(null);
  useEffect(() => {
    const list = listRef.current;
    if (!list || list.scrollHeight <= list.clientHeight) return;
    const card = list.querySelector(`[data-module-id="${CSS.escape(String(openModuleId))}"]`);
    if (!card) return;
    const top = card.offsetTop;
    if (top < list.scrollTop || top + card.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTo({ top: Math.max(0, top - 8), behavior: "smooth" });
    }
  }, [openModuleId]);

  if (!modules.length) return <div className="text-gray-500 italic">No modules found for this course.</div>;

  const langQuery = selectedLanguage ? `?lang=${encodeURIComponent(selectedLanguage)}` : "";

  const handleModuleClick = (module) => {
    if (!course?.documentId) return;
    const modId = module.moduleId || module.id;
    router.push(`/courses/${category}/${course.documentId}/${modId}${langQuery}`);
  };

  const handleNextLecture = (nextModule) => {
    if (!nextModule || !course?.documentId) return;
    const modId = nextModule.moduleId || nextModule.id;
    router.push(`/courses/${category}/${course.documentId}/${modId}${langQuery}`);
  };

  // Server-side module state (sequence, quiz result, offline assessment). Falls back to read state for older backends.
  const stateById = new Map(
    (Array.isArray(moduleStates) ? moduleStates : []).map((s) => [String(s.module_id), s])
  );
  const hasServerState = stateById.size > 0;
  const allCompleted = modules.length > 0 && modules.every(m => m.mark_as_read);
  const firstUnreadIdx = modules.findIndex(m => !m.mark_as_read);

  return (
    // On large screens this fills the rest of the right column and only the module list scrolls.
    <div className="flex flex-col lg:flex-1 lg:min-h-0">
      <h3 className="mt-6 mb-4 text-2xl font-bold text-gray-900 shrink-0">
        Course Modules
      </h3>
      <div
        ref={listRef}
        className="relative flex flex-col gap-3 lg:min-h-[120px] lg:overflow-y-auto lg:-mx-2 lg:px-2 lg:pt-1 lg:pb-4"
      >
        {modules.map((module, idx) => {
          const modId = module.moduleId || module.id;
          const isOpen = String(openModuleId) === String(modId);
          const isSelected = String(activeModuleId) === String(modId);
          const state = hasServerState ? stateById.get(String(module.moduleId)) : null;
          const isOffline = module.moduleKind === 'Offline';
          // Content read (Mark as Read) vs module completed (content + quiz passed / offline assessed)
          const isRead = state ? state.content_completed : module.mark_as_read;
          const isCompleted = state ? state.completed : module.mark_as_read;
          const nextModule = modules[idx + 1] || null;
          const isLocked = state ? !state.unlocked : !allCompleted && firstUnreadIdx >= 0 && idx > firstUnreadIdx;
          const quizPending = !!state?.has_quiz && isRead && !isCompleted;
          let displayStatus = isCompleted ? "completed" : isLocked ? "locked" : "active";
          // "Mark as Read" enabled for any expanded, unread, unlocked online module
          const markEnabled = isOpen && !isRead && !isLocked && !isOffline;
          // "Next Lecture" is enabled only after this module is completed
          const nextEnabled = isCompleted && !!nextModule;
          const quiz = state?.quiz;
          // Re-attempt state applies to the module whose quiz is due (max attempts used).
          const reattempt = quizPending && String(quizActions.moduleId) === String(modId) ? quizActions : null;
          const reattemptNote = reattempt?.rejected
            ? 'Your re-attempt request was rejected. You can send a new request after 24 hours.'
            : reattempt?.pending
              ? 'Re-attempt request sent. Wait for admin approval to take the quiz again.'
              : reattempt?.needsRequest
                ? 'You have used all attempts. Send a re-attempt request to take the quiz again.'
                : null;
          const handleClick = () => { if (isLocked) return; handleModuleClick(module); };
          return (
            <div
              key={modId}
              data-module-id={modId}
              className="bg-white rounded-2xl shadow overflow-hidden shrink-0"
            >
              {/* Module Header */}
              <button
                onClick={handleClick}
                className={`flex items-center gap-3 w-full text-left p-4 ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <ModuleCircle
                  moduleNumber={idx + 1}
                  moduleStatus={displayStatus}
                  isSelected={isSelected}
                />
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-gray-900 truncate font-semibold">
                    {module.moduleTitle || 'Untitled Module'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {isOffline ? 'Offline · practical assessment' : module.moduleType || 'Unknown'}
                    {typeof module.moduleDuration === 'number' && module.moduleDuration > 0
                      ? ` • ${module.moduleDuration} min`
                      : ''}
                    {module.hasQuiz ? ' • Quiz' : ''}
                  </span>
                  {quiz && quiz.attempts > 0 && !quiz.passed && quiz.pending_review ? (
                    <span className="text-xs text-amber-700">
                      Quiz submitted — result under review • {attemptLabel(quiz)}
                    </span>
                  ) : quiz && quiz.attempts > 0 && (
                    <span className={`text-xs ${quiz.passed ? 'text-success' : 'text-error'}`}>
                      {quiz.passed
                        ? `Quiz passed${quiz.last_score != null ? ` (${quiz.last_score}%)` : ''}`
                        : `Quiz: ${quiz.last_score ?? 0}% — pass mark ${quiz.pass_mark}% • ${attemptLabel(quiz)}`}
                    </span>
                  )}
                </div>
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                )}
              </button>

              {/* Expanded Content */}
              {isOpen && (
                <>
                  {/* Action Buttons */}
                  <div className="flex items-center gap-4 rounded-b-2xl px-4 pb-4">
                    {isOffline ? (
                      /* Offline: completed when the assessor uploads proof — no Mark as Read */
                      <div
                        className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl h-10 text-sm font-semibold border
                          ${isCompleted ? 'bg-success/10 border-success/30 text-success' : 'bg-amber-50 border-amber-200 text-amber-700'}`}
                      >
                        {isCompleted ? <ClipboardCheck className="w-4 h-4" /> : <Hourglass className="w-4 h-4" />}
                        {isCompleted ? 'Assessed' : isLocked ? 'Locked' : 'Awaiting assessment'}
                      </div>
                    ) : (
                    /* Mark as Read */
                    <button
                      onClick={() => markEnabled && onMarkAsRead(modId)}
                      disabled={!markEnabled}
                      className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl h-10 text-sm font-semibold transition
                        ${isRead
                          ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                          : markEnabled
                            ? 'bg-white border border-primary text-primary hover:bg-gray-50 cursor-pointer'
                            : 'bg-gray-50 border border-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                      {isRead ? 'Marked as Read' : 'Mark as Read'}
                      <SquareCheckBig className="w-4 h-4" />
                    </button>
                    )}

                    {/* Module quiz after the content is read; otherwise Next Lecture (enabled once completed) */}
                    {quizPending && quiz?.pending_review ? (
                      <div className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl h-10 text-sm font-semibold border bg-amber-50 border-amber-200 text-amber-700">
                        <Hourglass className="w-4 h-4" />
                        Result under review
                      </div>
                    ) : reattempt?.rejected ? (
                      <div className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl h-10 text-sm font-semibold border bg-red-50 border-red-200 text-red-700">
                        <XCircle className="w-4 h-4" />
                        Request rejected
                      </div>
                    ) : reattempt?.pending ? (
                      <div className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl h-10 text-sm font-semibold border bg-amber-50 border-amber-200 text-amber-700">
                        <Hourglass className="w-4 h-4" />
                        Request sent
                      </div>
                    ) : reattempt?.needsRequest ? (
                      <button
                        onClick={reattempt.onSendRequest}
                        disabled={reattempt.loading}
                        className="flex-1 flex items-center justify-center h-10 gap-2 p-3 rounded-xl text-sm font-semibold transition border border-error text-error bg-error/10 hover:bg-error/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <RotateCcw className="w-4 h-4" />
                        {reattempt.loading ? 'Sending...' : 'Request Re-attempt'}
                      </button>
                    ) : quizPending ? (
                      <button
                        onClick={() => onTakeQuiz && onTakeQuiz(module)}
                        className="flex-1 flex items-center justify-center h-10 gap-2 p-3 rounded-xl text-sm font-semibold transition bg-primary text-white hover:bg-primary/90 cursor-pointer"
                      >
                        {quiz?.attempts > 0 ? 'Retake Quiz' : 'Take Quiz'}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : !nextModule && quizActions.needsFeedback && quizActions.onOpenFeedback ? (
                      /* All modules done: the course completes once feedback is submitted */
                      <button
                        onClick={quizActions.onOpenFeedback}
                        className="flex-1 flex items-center justify-center h-10 gap-2 p-3 rounded-xl text-sm font-semibold transition bg-primary text-white hover:bg-primary/90 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Submit Feedback
                      </button>
                    ) : !nextModule && quizActions.courseCompleted ? (
                      <div className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl h-10 text-sm font-semibold border bg-success/10 border-success/30 text-success">
                        <CheckCircle2 className="w-4 h-4" />
                        Course Completed
                      </div>
                    ) : (
                    <button
                      onClick={() => nextEnabled && handleNextLecture(nextModule)}
                      disabled={!nextEnabled}
                      className={`flex-1 flex items-center justify-center h-10 gap-2 p-3 rounded-xl text-sm font-semibold transition
                        ${nextEnabled
                          ? 'bg-primary text-white hover:bg-primary/90 cursor-pointer'
                          : 'bg-primary/40 text-white cursor-not-allowed'
                        }`}
                    >
                      {nextModule ? 'Next Lecture' : 'Last Module'}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    )}
                  </div>
                  {(reattemptNote || (reattempt && reattempt.error)) && (
                    <div className="px-4 pb-4 -mt-1">
                      {reattemptNote && <p className="text-xs text-gray-500">{reattemptNote}</p>}
                      {reattempt?.error && <p className="text-xs text-destructive mt-1">{reattempt.error}</p>}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
