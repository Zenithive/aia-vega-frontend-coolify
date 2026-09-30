"use client";
import React, { useState } from "react";
import { Star } from "lucide-react";
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

function RadioGroup({ questionId, options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-4">
      {options.map((opt) => {
        const isSelected = value === opt;
        return (
          <label key={opt} className="flex items-center gap-2 cursor-pointer">
            <span
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                isSelected ? "border-primary bg-primary" : "border-gray-300 bg-white"
              }`}
            >
              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            </span>
            <input
              type="radio"
              name={questionId}
              value={opt}
              checked={isSelected}
              onChange={() => onChange(opt)}
              className="sr-only"
            />
            <span className="text-sm text-gray-900">{opt}</span>
          </label>
        );
      })}
    </div>
  );
}

function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="p-0.5 focus:outline-none focus:ring-0"
          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
        >
          <Star
            className="w-8 h-8 transition-colors"
            fill={value >= star ? "#EAB308" : "transparent"}
            stroke={value >= star ? "#EAB308" : "#D1D5DB"}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}

export default function FeedbackForm({ questions, onCancel, onSubmit, userId, courseId, courseVersion }) {
  const activeQuestions =
    Array.isArray(questions) && questions.length > 0 ? questions : FALLBACK_QUESTIONS;

  const [answers, setAnswers] = useState({});

  const setAnswer = (questionId, value) =>
    setAnswers((prev) => ({ ...prev, [questionId]: value }));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

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
        <div className="relative w-full max-w-236.75 mx-auto bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80">
          <form onSubmit={handleSubmit}>
            <div className="p-6 sm:p-10">

            {activeQuestions.map((q) => {
              const qid = q.question_id;
              const label = q.question || "";

              if (q.answer_type === "Rating") {
                return (
                  <div key={qid} className="mb-6">
                    <p className="text-[15px] font-medium text-[#2d2a6e] mb-3">{label}</p>
                    <StarRating
                      value={answers[qid] || 0}
                      onChange={(v) => setAnswer(qid, v)}
                    />
                  </div>
                );
              }

              if (q.answer_type === "Text") {
                const charCount = (answers[qid] || "").length;
                const isNearLimit = charCount >= 230;
                const isAtLimit = charCount >= 255;
                return (
                  <div key={qid} className="mb-6">
                    <p className="text-[15px] font-medium text-[#2d2a6e] mb-3">{label}</p>
                    <textarea
                      value={answers[qid] || ""}
                      onChange={(e) => setAnswer(qid, e.target.value)}
                      placeholder="Type your answer here..."
                      rows={3}
                      maxLength={255}
                      className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 resize-none ${
                        isAtLimit
                          ? "border-red-400 focus:ring-red-200 focus:border-red-400"
                          : "border-gray-200 focus:ring-primary/20 focus:border-primary"
                      }`}
                    />
                    <p className={`text-xs mt-1 text-right ${isAtLimit ? "text-red-500 font-medium" : isNearLimit ? "text-orange-500" : "text-gray-400"}`}>
                      {charCount}/255{isAtLimit && " — character limit reached"}
                    </p>
                  </div>
                );
              }

              // YesNo or AgreeOrDisagree
              const options = ANSWER_TYPE_OPTIONS[q.answer_type] || ["Yes", "No"];
              return (
                <div key={qid} className="mb-6">
                  <p className="text-[15px] font-medium text-[#2d2a6e] mb-3">{label}</p>
                  <RadioGroup
                    questionId={qid}
                    options={options}
                    value={answers[qid]}
                    onChange={(v) => setAnswer(qid, v)}
                  />
                </div>
              );
            })}

            {submitError && (
              <p className="text-sm text-red-600 mb-4">{submitError}</p>
            )}
            </div>
            <div className="px-6 sm:px-10 py-6">
              <div className="flex justify-start gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl border-2 border-primary bg-white text-primary font-semibold text-sm hover:bg-primary/5 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-35"
                >
                  {isSubmitting ? (
                    <>
                      <Loader size="sm" className="shrink-0" spinnerClassName="border-white border-t-white/30" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Form'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}