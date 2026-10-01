"use client";
import React, { useState } from "react";
import { Star, MessageSquareText, ThumbsUp, ThumbsDown, AlertCircle } from "lucide-react";
import api from '@/services/api';
import Loader from '@/components/common/Loader';
import telemetryService from '@/services/telemetry';

// Fallback questions used when no API feedback questions are available
const FALLBACK_QUESTIONS = [
  {
    question_id: "objectives",
    question: "Did you clearly understand the learning objectives of this course?",
    answer_type: "YesNo",
    mandatory: true,
  },
  {
    question_id: "relevant",
    question: "Was the course content relevant to your role?",
    answer_type: "YesNo",
    mandatory: true,
  },
  {
    question_id: "quality",
    question: "How would you rate the quality of the course content?",
    answer_type: "AgreeOrDisagree",
    mandatory: true,
  },
];

const ANSWER_TYPE_OPTIONS = {
  YesNo: ["Yes", "No"],
  AgreeOrDisagree: ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"],
};

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];
const TEXT_LIMIT = 255;

const isAnswered = (value) => value !== undefined && value !== null && String(value).trim() !== "";
const isRequired = (q) => q.mandatory !== false;

function YesNoButtons({ questionId, value, onChange }) {
  return (
    <div role="radiogroup" aria-labelledby={`${questionId}-label`} className="grid grid-cols-2 gap-3 max-w-sm">
      {ANSWER_TYPE_OPTIONS.YesNo.map((opt) => {
        const isSelected = value === opt;
        const Icon = opt === "Yes" ? ThumbsUp : ThumbsDown;
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(opt)}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
              isSelected
                ? "border-primary bg-primary text-white shadow-sm"
                : "border-gray-200 bg-white text-gray-700 hover:border-primary/50 hover:bg-primary-light/40"
            }`}
          >
            <Icon className="w-4 h-4" />
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function AgreementScale({ questionId, value, onChange }) {
  const options = ANSWER_TYPE_OPTIONS.AgreeOrDisagree;
  return (
    <div role="radiogroup" aria-labelledby={`${questionId}-label`}>
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        {options.map((opt) => {
          const isSelected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(opt)}
              className={`flex sm:flex-col items-center sm:justify-center gap-3 sm:gap-2 px-3 py-3 rounded-xl border-2 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                isSelected
                  ? "border-primary bg-primary-light/60 text-primary-dark font-semibold"
                  : "border-gray-200 bg-white text-gray-700 hover:border-primary/50 hover:bg-primary-light/30"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  isSelected ? "border-primary" : "border-gray-300"
                }`}
              >
                {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </span>
              <span className="sm:text-center leading-tight">{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StarRating({ questionId, value, onChange }) {
  const [hovered, setHovered] = useState(0);
  const shown = hovered || value;
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div
        role="radiogroup"
        aria-labelledby={`${questionId}-label`}
        className="flex gap-1"
        onMouseLeave={() => setHovered(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            className="p-1 rounded-lg transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label={`${star} star${star > 1 ? "s" : ""} – ${RATING_LABELS[star]}`}
          >
            <Star
              className="w-9 h-9 transition-colors"
              fill={shown >= star ? "#EAB308" : "transparent"}
              stroke={shown >= star ? "#EAB308" : "#D1D5DB"}
              strokeWidth={1.5}
            />
          </button>
        ))}
      </div>
      <span className={`text-sm font-medium min-w-20 ${shown ? "text-gray-800" : "text-gray-400"}`}>
        {shown ? RATING_LABELS[shown] : "Tap a star to rate"}
      </span>
    </div>
  );
}

export default function FeedbackForm({ questions, onCancel, onSubmit, userId, courseId, courseVersion }) {
  const activeQuestions =
    Array.isArray(questions) && questions.length > 0 ? questions : FALLBACK_QUESTIONS;

  const [answers, setAnswers] = useState({});
  const [showMissing, setShowMissing] = useState(false);

  const setAnswer = (questionId, value) =>
    setAnswers((prev) => ({ ...prev, [questionId]: value }));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const answeredCount = activeQuestions.filter((q) => isAnswered(answers[q.question_id])).length;
  const missingRequired = activeQuestions.filter((q) => isRequired(q) && !isAnswered(answers[q.question_id]));
  const progressPercent = activeQuestions.length ? Math.round((answeredCount / activeQuestions.length) * 100) : 0;

  React.useEffect(() => {
    const numericCourseId = Number(courseId);
    if (!Number.isFinite(numericCourseId) || numericCourseId <= 0) return;
    telemetryService.trackLearningFeedbackOpened({
      courseId: numericCourseId,
      routePath: typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/courses',
      feedbackId: String(courseId),
      metadata: {
        user_id: Number(userId),
        question_count: activeQuestions.length,
      },
    });
  }, [courseId, userId, activeQuestions.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Required questions must be answered; point the learner to the first one that is missing.
    if (missingRequired.length > 0) {
      setShowMissing(true);
      const first = document.getElementById(`feedback-q-${missingRequired[0].question_id}`);
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // Build answers array: one entry per active feedback question
    const answersArray = activeQuestions.map((q) => ({
      question_id: q.question_id,
      question: q.question || q.question_id,
      answer_type: q.answer_type === 'Rating' ? 'Rating'
        : q.answer_type === 'Text' ? 'Text'
        : 'Text',
      answer: String(answers[q.question_id] ?? ''),
    }));

    const payload = {
      data: {
        answers: answersArray,
        course: Number(courseId),
        users_permissions_user: Number(userId),
        course_version: courseVersion ? String(courseVersion) : null,
      },
      // Keep flat fields too for custom backend controllers that read ctx.request.body directly.
      courseId: Number(courseId),
      userId: Number(userId),
      course: Number(courseId),
      course_version: courseVersion ? String(courseVersion) : null,
      users_permissions_user: Number(userId),
      submitted_at: new Date().toISOString(),
    };

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const response = await api.post('/feedback-submission/submit', payload);
      telemetryService.trackLearningFeedbackSubmitted({
        courseId: Number(courseId),
        routePath: typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/courses',
        feedbackId: String(courseId || ''),
        rating: null,
        metadata: {
          course_id: Number(courseId),
          user_id: Number(userId),
          question_count: activeQuestions.length,
          success: true,
        },
      });
      onSubmit?.(response);
    } catch (error) {
      setSubmitError(error?.error?.message || error?.message || 'Failed to submit feedback. Please try again.');
      telemetryService.trackLearningFeedbackSubmitted({
        courseId: Number(courseId),
        routePath: typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/courses',
        feedbackId: String(courseId || ''),
        rating: null,
        metadata: {
          course_id: Number(courseId),
          user_id: Number(userId),
          success: false,
          error: error?.message || 'Feedback submission failed',
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderAnswer = (q) => {
    const qid = q.question_id;
    if (q.answer_type === "Rating") {
      return <StarRating questionId={qid} value={answers[qid] || 0} onChange={(v) => setAnswer(qid, v)} />;
    }
    if (q.answer_type === "Text") {
      const charCount = (answers[qid] || "").length;
      const isNearLimit = charCount >= TEXT_LIMIT - 25;
      const isAtLimit = charCount >= TEXT_LIMIT;
      return (
        <>
          <textarea
            aria-labelledby={`${qid}-label`}
            value={answers[qid] || ""}
            onChange={(e) => setAnswer(qid, e.target.value)}
            placeholder="Share your thoughts…"
            rows={4}
            maxLength={TEXT_LIMIT}
            className={`w-full px-4 py-3 rounded-xl border bg-gray-50/60 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 resize-none transition ${
              isAtLimit
                ? "border-red-400 focus:ring-red-200 focus:border-red-400"
                : "border-gray-200 focus:ring-primary/20 focus:border-primary"
            }`}
          />
          <p className={`text-xs mt-1.5 text-right ${isAtLimit ? "text-red-500 font-medium" : isNearLimit ? "text-orange-500" : "text-gray-400"}`}>
            {charCount}/{TEXT_LIMIT}{isAtLimit && " — character limit reached"}
          </p>
        </>
      );
    }
    if (q.answer_type === "AgreeOrDisagree") {
      return <AgreementScale questionId={qid} value={answers[qid]} onChange={(v) => setAnswer(qid, v)} />;
    }
    return <YesNoButtons questionId={qid} value={answers[qid]} onChange={(v) => setAnswer(qid, v)} />;
  };

  return (
    <>
      <div
        className="fixed inset-0 -z-10 bg-[#fafafa]"
        style={{
          backgroundImage: "url(/feedback-form-bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "right center",
          backgroundRepeat: "no-repeat",
        }}
      />

      <div className="w-full min-h-screen py-6 px-4 relative">
        <div className="relative w-full max-w-236.75 mx-auto bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 overflow-hidden">
          <form onSubmit={handleSubmit} noValidate>
            {/* Header */}
            <div className="px-6 sm:px-10 pt-8 pb-6 border-b border-gray-100 bg-linear-to-r from-primary-light/70 to-white">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm">
                  <MessageSquareText className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-semibold text-gray-900">Course Feedback</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Tell us about your learning experience. Your answers help us improve this course.
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <div className="flex items-center justify-between text-xs font-medium text-gray-600 mb-2">
                  <span>{answeredCount} of {activeQuestions.length} answered</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                  <div className="h-2 rounded-full bg-primary transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            </div>

            {/* Questions */}
            <div className="px-6 sm:px-10 py-4 divide-y divide-gray-100">
              {activeQuestions.map((q, index) => {
                const qid = q.question_id;
                const missing = showMissing && isRequired(q) && !isAnswered(answers[qid]);
                return (
                  <section
                    key={qid}
                    id={`feedback-q-${qid}`}
                    className={`py-6 ${missing ? "-mx-3 px-3 rounded-xl bg-red-50/60" : ""}`}
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <span
                        className={`w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center shrink-0 ${
                          isAnswered(answers[qid]) ? "bg-primary text-white" : "bg-primary-light text-primary-dark"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <p id={`${qid}-label`} className="pt-0.5 text-[15px] font-medium text-gray-900 leading-snug">
                        {q.question || ""}
                        {isRequired(q) ? (
                          <span className="text-red-500 ml-1" aria-hidden="true">*</span>
                        ) : (
                          <span className="ml-2 text-xs font-normal text-gray-400">(optional)</span>
                        )}
                      </p>
                    </div>
                    <div className="sm:pl-10">
                      {renderAnswer(q)}
                      {missing && (
                        <p className="flex items-center gap-1.5 text-xs text-red-600 mt-2">
                          <AlertCircle className="w-3.5 h-3.5" /> This question is required.
                        </p>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-6 sm:px-10 py-5 border-t border-gray-100 bg-gray-50/70">
              {submitError && (
                <p className="flex items-center gap-2 text-sm text-red-600 mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {submitError}
                </p>
              )}
              {showMissing && missingRequired.length > 0 && (
                <p className="flex items-center gap-2 text-sm text-red-600 mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Please answer {missingRequired.length} required question{missingRequired.length > 1 ? "s" : ""}.
                </p>
              )}
              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-xs text-gray-500">
                  <span className="text-red-500">*</span> Required
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-semibold text-sm hover:border-gray-300 hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm shadow-sm hover:bg-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-40"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader size="sm" className="shrink-0" spinnerClassName="border-white border-t-white/30" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Feedback'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
