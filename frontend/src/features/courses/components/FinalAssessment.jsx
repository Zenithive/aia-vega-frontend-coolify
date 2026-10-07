import React from "react";
import { CheckCircle2, Hourglass } from "lucide-react";

export default function FinalAssessment({
  unlocked,
  isCompleted,
  hasPendingReattempt,
  hasRejectedReattempt,
  needsReattemptRequest,
  reattemptRequestLoading,
  reattemptRequestError,
  onSendReattemptRequest,
  needsFeedbackSubmission,
  onOpenFeedback,
  selectedLanguage,
  hasQuizInSelectedLanguage,
  // Quizzes belong to online modules: the module whose quiz is due now, if any.
  allModulesCompleted = false,
  quizModuleTitle = null,
  pendingOfflineTitle = null,
  // The module quiz attempt has descriptive answers waiting for admin review.
  quizPendingReview = false,
}) {
  const heading = allModulesCompleted
    ? "Course Completion"
    : quizModuleTitle
      ? `Module Quiz — ${quizModuleTitle}`
      : "Module Quiz";
  // This card is shown only for what the module cards cannot show: waiting for an offline assessment,
  // re-attempt request / pending / rejected, feedback, course completed, no quiz in this language.
  // "Locked", "result under review" and "Take quiz" are already on the module card, so the card is left out.
  if (!unlocked) {
    if (!pendingOfflineTitle) return null;
    return (
      <div className="bg-white rounded-xl shadow p-6 mt-6">
        <div className="font-semibold text-gray-800 text-lg mb-4">{heading}</div>
        <div className="flex justify-center">
          <div className="w-full border border-gray-200 rounded-xl flex flex-col items-center p-4 shadow-sm bg-gray-50">
            <Hourglass className="w-6 h-6 text-amber-600 mb-2" />
            <span className="text-base text-gray-600 font-medium text-center">
              Waiting for your practical assessment in &ldquo;{pendingOfflineTitle}&rdquo;
            </span>
            <span className="text-xs text-gray-500 text-center mt-1">
              The next module unlocks once your assessor records your result.
            </span>
          </div>
        </div>
      </div>
    );
  }
  if (isCompleted) {
    return (
      <div className="bg-white rounded-xl shadow p-6 mt-6">
        <div className="font-semibold text-gray-800 text-lg mb-4">{heading}</div>
        <div className="w-full border border-success/30 rounded-xl flex flex-col items-center p-6 shadow-sm bg-success/5">
          <CheckCircle2 className="w-10 h-10 text-success mb-3" />
          <span className="text-base font-semibold text-gray-800 mb-1">Course Completed</span>
          {/* {quizScore != null && (
            <span className="text-2xl font-bold text-primary">
              Your Score: {quizScore}%
            </span>
          )} */}
        </div>
      </div>
    );
  }
  if (quizPendingReview) return null;
  if (hasRejectedReattempt) {
    return (
      <div className="bg-white rounded-xl shadow p-6 mt-6">
        <div className="font-semibold text-gray-800 text-lg mb-4">{heading}</div>
        <div className="flex justify-center">
          <button
            type="button"
            disabled
            className="bg-gray-200 text-gray-500 font-semibold py-2 px-6 rounded-lg shadow-md cursor-not-allowed text-lg"
          >
            Your request is rejected
          </button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          You will not be able to attend the quiz right now. Wait for 24hrs to re-apply.
        </p>
      </div>
    );
  }
  if (hasPendingReattempt) {
    return (
      <div className="bg-white rounded-xl shadow p-6 mt-6">
        <div className="font-semibold text-gray-800 text-lg mb-4">{heading}</div>
        <div className="flex justify-center">
          <button
            type="button"
            disabled
            className="bg-gray-200 text-gray-500 font-semibold py-2 px-6 rounded-lg shadow-md cursor-not-allowed text-lg"
          >
            Re-request sent
          </button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Please wait for admin approval to take the assessment again.
        </p>
      </div>
    );
  }
  if (needsReattemptRequest) {
    return (
      <div className="bg-white rounded-xl shadow p-6 mt-6">
        <div className="font-semibold text-gray-800 text-lg mb-4">{heading}</div>
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onSendReattemptRequest}
            disabled={reattemptRequestLoading}
            className="bg-error/10 border border-error text-error font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-error/20 transition-all duration-150 text-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {reattemptRequestLoading ? "Sending..." : "Send Re-attempt Request"}
          </button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          You have reached the maximum number of attempts. Send a re-attempt request to continue.
        </p>
        {reattemptRequestError ? (
          <p className="text-xs text-destructive text-center mt-1">{reattemptRequestError}</p>
        ) : null}
      </div>
    );
  }
  if (needsFeedbackSubmission && onOpenFeedback) {
    return (
      <div className="bg-white rounded-xl shadow p-6 mt-6">
        <div className="font-semibold text-gray-800 text-lg mb-4">{heading}</div>
        <p className="text-sm text-gray-600 text-center mb-4">
          You have completed all modules. Please submit feedback to complete the course.
        </p>
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onOpenFeedback}
            className="bg-primary hover:bg-primary/90 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all duration-150 text-lg"
          >
            Submit Feedback
          </button>
        </div>
      </div>
    );
  }
  if (allModulesCompleted) {
    return (
      <div className="bg-white rounded-xl shadow p-6 mt-6">
        <div className="font-semibold text-gray-800 text-lg mb-4">{heading}</div>
        <div className="w-full border border-success/30 rounded-xl flex flex-col items-center p-6 shadow-sm bg-success/5">
          <CheckCircle2 className="w-10 h-10 text-success mb-3" />
          <span className="text-base font-semibold text-gray-800 mb-1">All modules completed</span>
        </div>
      </div>
    );
  }
  if (!hasQuizInSelectedLanguage) {
    return (
      <div className="bg-white rounded-xl shadow p-6 mt-6">
        <div className="font-semibold text-gray-800 text-lg mb-4">{heading}</div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-600">
            No assessment is available in <strong>{selectedLanguage || "this language"}</strong>.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Switch to another language from the dropdown above if the course offers an assessment in that language.
          </p>
        </div>
      </div>
    );
  }
  return null;
}
