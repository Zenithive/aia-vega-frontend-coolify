"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";

import {
  Info,
  Timer,
  HelpCircle,
  CheckCircle2,
  Ban,
  ShieldCheck,
  Wifi,
  ArrowRight,
  ArrowLeft,
  Hourglass,
  FileSearch,
  XCircle,
  Circle,
} from "lucide-react";
import {
  MOCK_COURSES_CATEGORY_LIST,
  MOCK_ASSESSMENT_DATA,
} from "@/services/mockData";
import AssessmentQuiz from "./AssessmentQuiz";
import { getLatestSubmission, checkPendingReattemptRequest } from "../quizSubmissionAPI";
import { getCurrentUserId } from "@/lib/auth";
import telemetryService from '@/services/telemetry';

const ICON_MAP = {
  Timer,
  HelpCircle,
  CheckCircle2,
  Ban,
  ShieldCheck,
  Wifi,
};

// Why the quiz cannot be started right now. steps: done | current | failed | todo.
// (Fixed pixel widths below: max-w-xl etc. resolve to the --spacing-* tokens in globals.css.)
const BLOCKED_STATES = {
  review: {
    icon: FileSearch,
    tone: "warning",
    badge: "Under review",
    title: "Your answers are being reviewed",
    description:
      "Your last attempt has descriptive answers that an admin is checking. You can't take the quiz again until the review is finished.",
    steps: () => [
      { label: "Quiz submitted", status: "done" },
      { label: "Admin reviews your descriptive answers", status: "current" },
      { label: "You get a notification with your final score", status: "todo" },
    ],
  },
  pending: {
    icon: Hourglass,
    tone: "warning",
    badge: "Awaiting approval",
    title: "Re-attempt request pending",
    description:
      "You have used all your attempts, so your request for another attempt has been sent to the admin. You can take the quiz again once it is approved.",
    steps: () => [
      { label: "Re-attempt request sent", status: "done" },
      { label: "Admin approves your request", status: "current" },
      { label: "Take the quiz again", status: "todo" },
    ],
  },
  rejected: {
    icon: XCircle,
    tone: "danger",
    badge: "Request declined",
    title: "Your re-attempt request was rejected",
    description:
      "The admin did not approve another attempt. You can send a new request after 24 hours. If you think this is a mistake, contact your Learning & Development team.",
    steps: (canRequestAgainAt) => [
      { label: "Re-attempt request sent", status: "done" },
      { label: "Request rejected by the admin", status: "failed" },
      {
        label: canRequestAgainAt
          ? `You can request again after ${new Date(canRequestAgainAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`
          : "You can request again after 24 hours",
        status: "todo",
      },
    ],
  },
};

const TONES = {
  warning: { bar: "bg-warning", iconBg: "bg-warning-light-bg", icon: "text-warning", badge: "bg-warning-light-bg text-warning border-warning/30" },
  danger: { bar: "bg-red-500", iconBg: "bg-red-50", icon: "text-red-600", badge: "bg-red-50 text-red-700 border-red-200" },
};

function QuizStatusCard({ state, canRequestAgainAt, onBackToCourse, onBackToCourses }) {
  const config = BLOCKED_STATES[state];
  const tone = TONES[config.tone];
  const Icon = config.icon;
  const steps = config.steps(canRequestAgainAt);

  return (
    <div className="flex justify-center pt-2">
      <div className="w-full max-w-[640px] bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className={`h-1.5 ${tone.bar}`} />

        <div className="px-6 sm:px-10 pt-10 pb-8 flex flex-col items-center text-center">
          <span className={`w-16 h-16 rounded-full flex items-center justify-center ${tone.iconBg}`}>
            <Icon className={`w-8 h-8 ${tone.icon}`} />
          </span>
          <span className={`mt-5 px-3 py-1 rounded-full border text-sm font-semibold ${tone.badge}`}>
            {config.badge}
          </span>
          <h2 className="mt-3 text-2xl font-bold text-gray-900">{config.title}</h2>
          <p className="mt-2 text-base text-gray leading-relaxed max-w-[480px]">{config.description}</p>

          <div className="mt-8 w-full text-left rounded-xl border border-gray-200 bg-gray-50 p-5">
            <p className="text-sm font-semibold text-gray-900 mb-4">What happens next</p>
            <ol className="flex flex-col">
              {steps.map((step, idx) => {
                const last = idx === steps.length - 1;
                return (
                  <li key={step.label} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      {step.status === "done" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                      ) : step.status === "failed" ? (
                        <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                      ) : step.status === "current" ? (
                        <span className="w-5 h-5 rounded-full border-2 border-warning flex items-center justify-center shrink-0">
                          <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                        </span>
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300 shrink-0" />
                      )}
                      {!last && <span className="w-px flex-1 min-h-4 bg-gray-300 my-1" />}
                    </div>
                    <span
                      className={`text-sm pb-4 ${
                        step.status === "todo"
                          ? "text-gray-500"
                          : step.status === "failed"
                            ? "text-red-700 font-medium"
                            : step.status === "current"
                              ? "text-gray-900 font-semibold"
                              : "text-gray-700"
                      }`}
                    >
                      {step.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 sm:px-10 py-5 flex flex-col-reverse sm:flex-row gap-3 sm:justify-center">
          <button
            onClick={onBackToCourse}
            className="inline-flex items-center justify-center gap-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 px-6 rounded-xl transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to course
          </button>
          <button
            onClick={onBackToCourses}
            className="bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-8 rounded-xl shadow transition cursor-pointer"
          >
            Browse all courses
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AssessmentInstructions(props) {
  const router = useRouter();
  // Debug: log the received quiz prop
  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.log("AssessmentInstructions quiz prop:", props.quiz);
  }
  const [category, setCategory] = useState(props.category || "");
  const [courseId, setCourseId] = useState(props.courseId || "");
  const [courseName, setCourseName] = useState(props.courseName || "");
  const [quizStarted, setQuizStarted] = useState(false);
  const [blockStartPendingReattempt, setBlockStartPendingReattempt] = useState(false);
  const [blockRejectedReattempt, setBlockRejectedReattempt] = useState(false);
  const [blockReviewPending, setBlockReviewPending] = useState(false);
  const [canRequestAgainAt, setCanRequestAgainAt] = useState(null);
  const [blockCheckLoading, setBlockCheckLoading] = useState(true);
  const [startingAssessment, setStartingAssessment] = useState(false);

const { subtitle, notice, instructionCards: mockInstructionCards, checklist: mockChecklist, buttonText } =
  MOCK_ASSESSMENT_DATA;

  // Build instruction cards: prefer API quiz_instruction, fall back to mock
  const apiInstructions = props.quiz?.quiz_instruction;
  const instructionCards =
    Array.isArray(apiInstructions) && apiInstructions.length > 0
      ? apiInstructions.map((instr, idx) => ({
          title: instr.name,
          description: instr.description,
          icon: instr.icon,
        }))
      : mockInstructionCards && mockInstructionCards.length > 0
        ? mockInstructionCards
        : [
            {
              title: "No instructions available",
              description: "No assessment instructions found for this course.",
              icon: "HelpCircle",
            },
          ];

  const apiChecklist = Array.isArray(props.quiz?.quiz_instruction)
    ? props.quiz.quiz_instruction.flatMap((instr) =>
        Array.isArray(instr.checklist) ? instr.checklist : []
      )
    : [];
  const checklist =
    apiChecklist.length > 0
      ? {
          subtitle: mockChecklist?.subtitle || "",
          items: apiChecklist.map((item) => item.description),
        }
      : mockChecklist;

  useEffect(() => {
    let _category = props.category;
    let _courseId = props.courseId;
    if (!props.category || !props.courseId) {
      if (typeof window !== "undefined") {
        const pathParts = window.location.pathname.split("/");
        if (pathParts.length >= 5) {
          _category = pathParts[2];
          _courseId = pathParts[3];
          setCategory(_category);
          setCourseId(_courseId);
        }
      }
    }
    if (props.courseName) {
      setCourseName(props.courseName);
    } else if (_category && _courseId) {
      const courses = MOCK_COURSES_CATEGORY_LIST[_category] || [];
      const courseObj = courses.find((c) => String(c.id) === String(_courseId));
      setCourseName(courseObj ? courseObj.title : _courseId);
    }
  }, [props.category, props.courseId, props.courseName]);

  // Check if user has pending or rejected reattempt request → block starting assessment when pending (at max attempts) or when rejected
  useEffect(() => {
    const userId = props.userId ?? getCurrentUserId();
    const courseNumericId = props.courseNumericId;
    if (!courseNumericId || !userId) {
      setBlockCheckLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [latestRes, reattemptStatus] = await Promise.all([
          getLatestSubmission(Number(userId), Number(courseNumericId), props.moduleId || null),
          checkPendingReattemptRequest(Number(userId), Number(courseNumericId), null, props.moduleId || null),
        ]);
        if (cancelled) return;
        const maxAttempt = latestRes?.maxAttempt ?? 1;
        const attemptNumber = latestRes?.submission?.attempt_number ?? 0;
        const atMaxAttempts = attemptNumber >= maxAttempt;
        const hasPending = reattemptStatus?.hasPending ?? false;
        const hasRejected = reattemptStatus?.hasRejected ?? false;
        setBlockStartPendingReattempt(atMaxAttempts && hasPending);
        setBlockRejectedReattempt(hasRejected);
        setBlockReviewPending(latestRes?.submission?.review_status === 'Pending_review');
        setCanRequestAgainAt(reattemptStatus?.canRequestAgainAt ?? null);
      } catch {
        if (!cancelled) {
          setBlockStartPendingReattempt(false);
          setBlockRejectedReattempt(false);
          setBlockReviewPending(false);
          setCanRequestAgainAt(null);
        }
      } finally {
        if (!cancelled) setBlockCheckLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [props.userId, props.courseNumericId, props.moduleId]);

  // Prepare quiz questions and result data for AssessmentQuiz
  // Support both quiz_questions (from API) and questions (legacy/mock)
  let quizQuestions = undefined;
  if (
    Array.isArray(props.quiz?.quiz_questions) &&
    props.quiz.quiz_questions.length > 0
  ) {
    quizQuestions = props.quiz.quiz_questions;
  } else if (
    Array.isArray(props.quiz?.questions) &&
    props.quiz.questions.length > 0
  ) {
    quizQuestions = props.quiz.questions;
  }
  const resultData = props.quiz?.resultData; // optional, fallback to mock in AssessmentQuiz

  // Pick feedback questions matching the quiz language, fall back to first entry
  const feedbackForLang =
    (props.feedback || []).find(fb => fb.language === props.quiz?.language) ||
    (props.feedback || [])[0];
  const feedbackQuestions = feedbackForLang?.questions || [];
  // compulsory is a yes-no-toggle custom field: true = mandatory, false/null = optional
  const feedbackCompulsory = feedbackForLang?.compulsory === true;
  // Course feedback belongs after the quiz that completes the course, not after every module quiz.
  const isFinalModule = props.isFinalModule !== false;

  if (quizStarted) {
    return (
      <AssessmentQuiz
        onExit={() => setQuizStarted(false)}
        courseId={courseId}
        category={category}
        courseNumericId={props.courseNumericId}
        courseVersion={props.courseVersion || null}
        userId={props.userId ?? getCurrentUserId()}
        quizQuestions={quizQuestions}
        resultData={resultData}
        feedbackQuestions={isFinalModule ? feedbackQuestions : []}
        feedbackCompulsory={isFinalModule ? feedbackCompulsory : false}
        quizDuration={props.quiz?.completion_time}
        moduleId={props.moduleId || null}
        isFinalModule={isFinalModule}
      />
    );
  }

  const blockedState = blockReviewPending
    ? "review"
    : blockRejectedReattempt
      ? "rejected"
      : blockStartPendingReattempt
        ? "pending"
        : null;

  const courseBgStyle = {
    backgroundImage: "url(/course-page-bg.png)",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  };

  return (
    <div className="min-h-screen bg-[#fafafa]" style={courseBgStyle}>
      <div className="w-full">
        <PageHeader
          title={props.moduleTitle ? `Module Quiz — ${props.moduleTitle}` : "Assessment Instructions"}
          breadcrumbs={[
            { label: "Courses", href: "/courses" },
            {
              label: category
                ? category
                    .replace(/-/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())
                : "",
              href: `/courses/${category || ""}`,
            },
            {
              label: courseName
                ? courseName.length > 20
                  ? courseName.slice(0, 20) + "..."
                  : courseName
                : "",
              href: `/courses/${category || ""}/${courseId || ""}`,
            },
            { label: "Assessment" },
          ]}
          showBreadcrumbSeparator
          containerClassName="pt-xl pb-0 px-xl bg-transparent"
        />

        <div className="px-xl pb-xl">
          {blockedState ? (
            <QuizStatusCard
              state={blockedState}
              canRequestAgainAt={canRequestAgainAt}
              onBackToCourse={() => router.push(`/courses/${category || ""}/${courseId || ""}`)}
              onBackToCourses={() => router.push("/courses")}
            />
          ) : (
          <>
          <p className="text-muted-foreground mb-6">{subtitle}</p>

          {/* Quiz language differs from selected course language */}
          {props.quizLanguageMismatch && props.quiz?.language && (
            <div className="rounded-xl p-4 mb-6 flex items-start gap-3 border border-blue-200 bg-blue-50 text-gray-800">
              <Info className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" />
              <div>
                <span className="font-semibold">Assessment language</span>
                <p className="text-sm mt-1">
                  No assessment is available in <strong>{props.selectedLanguage || "your selected language"}</strong>.
                  This quiz is in <strong>{props.quiz.language}</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Important Notice */}
          <div className="rounded-xl p-5 mb-8 flex items-start gap-3 border border-warning bg-orange-light">
            <div className="p-1.5 rounded-lg shrink-0 mt-0.5 bg-warning-light-bg">
              <Info className="w-4 h-4 text-warning" />
            </div>
            <div>
              <span className="font-semibold text-xl text-warning">
                {notice.title}
              </span>
              <p className="text-gray mt-1">{notice.description}</p>
            </div>
          </div>

          {/* Instructions Grid — 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
            {instructionCards.map((card, idx) => {
              let iconElement = null;
              if (
                card.icon &&
                typeof card.icon === "object" &&
                card.icon.iconData
              ) {
                // Render SVG from API
                iconElement = (
                  <svg
                    width={card.icon.width}
                    height={card.icon.height}
                    viewBox={`0 0 ${card.icon.width} ${card.icon.height}`}
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-label={card.icon.iconName}
                    dangerouslySetInnerHTML={{ __html: card.icon.iconData }}
                  />
                );
              } else if (
                card.icon &&
                typeof card.icon === "string" &&
                ICON_MAP[card.icon]
              ) {
                // Render default icon from ICON_MAP
                const IconComp = ICON_MAP[card.icon];
                iconElement = (
                  <IconComp className="w-4 h-4 text-primary-purple" />
                );
              } else {
                // Fallback to HelpCircle if no icon is provided
                const IconComp = ICON_MAP["HelpCircle"];
                iconElement = <IconComp className="w-4 h-4 text-primary-purple" />;
              }
              return (
                <div
                  key={idx}
                  className="bg-gray-50 border border-gray-200 rounded-xl p-5 flex items-start gap-2.5"
                >
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full shrink-0 mt-0.5 bg-primary-light">
                    {iconElement}
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-gray-dark text-xl">
                      {card.title}
                    </span>
                    <p className="text-base text-gray leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pre-Assessment Checklist */}
          {checklist && checklist.subtitle && (
            <div className="mb-10">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Pre-Assessment Checklist
              </h2>
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <p className="mb-4">{checklist.subtitle}</p>
                  <ul className="flex flex-col gap-3">
                    {Array.isArray(checklist.items) && checklist.items.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2.5">
                        <ArrowRight className="w-4 h-4 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
              </div>
            </div>
          )}

          {/* Start Assessment Button */}
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={async () => {
                if (blockCheckLoading || startingAssessment) return;
                setStartingAssessment(true);
                try {
                  await props.onBeforeStartAssessment?.();
                  telemetryService.trackLearningQuizStarted({
                    courseId: props.courseNumericId,
                    routePath: typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/courses',
                    quizId: String(props.quiz?.id || props.quiz?.question_set_id || ''),
                    metadata: {
                      course_document_id: props.courseId,
                      course_id: props.courseNumericId,
                      language: props.selectedLanguage || props.quiz?.language || null,
                      question_count: Array.isArray(props.quiz?.quiz_questions) ? props.quiz.quiz_questions.length : undefined,
                    },
                  });
                } finally {
                  setStartingAssessment(false);
                  setQuizStarted(true);
                }
              }}
              disabled={blockCheckLoading || startingAssessment}
              className="bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-10 rounded-xl shadow transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {blockCheckLoading ? "Checking..." : startingAssessment ? "Loading quiz..." : buttonText}
            </button>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
