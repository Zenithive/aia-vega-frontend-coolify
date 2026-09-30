"use client";
import React, { useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import AssessmentInstructions from '@/features/courses/components/AssessmentInstructions';
import Loader from '@/components/common/Loader';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadCourseById, clearCurrentCourse } from '@/features/courses/coursesSlice';
import {
  selectCurrentCourse,
  selectCourseDetailLoading,
} from '@/features/courses/coursesSelectors';

export default function AssessmentInstructionsRoutePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { category, id } = params;
  const selectedLanguage = searchParams.get('lang') || searchParams.get('language') || '';

  const dispatch = useAppDispatch();
  const course = useAppSelector(selectCurrentCourse);
  const isLoading = useAppSelector(selectCourseDetailLoading);

  useEffect(() => {
    if (id) {
      if (selectedLanguage) {
        dispatch(loadCourseById({ documentId: id, language: selectedLanguage }));
      } else {
        dispatch(loadCourseById(id));
      }
    }
    return () => {
      dispatch(clearCurrentCourse());
    };
  }, [dispatch, id, selectedLanguage]);

  if (isLoading && !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  const allQuizzes = Array.isArray(course?.quiz) ? course.quiz : [];
  const quizForLang = allQuizzes.find(
    (q) => selectedLanguage &&
      (q.language || '').trim().toLowerCase() === selectedLanguage.trim().toLowerCase()
  );
  const quiz = quizForLang ?? allQuizzes[0] ?? null;
  const quizLanguageMismatch =
    quiz != null &&
    (quiz.language || '').trim().toLowerCase() !== (selectedLanguage || '').trim().toLowerCase();

  const allFeedback = Array.isArray(course?.feedback) ? course.feedback : [];
  const feedback =
    allFeedback.filter(
      (fb) => (fb.language || '').trim().toLowerCase() === (selectedLanguage || '').trim().toLowerCase()
    ).length > 0
      ? allFeedback.filter(
          (fb) => (fb.language || '').trim().toLowerCase() === (selectedLanguage || '').trim().toLowerCase()
        )
      : allFeedback;

  const handleBeforeStartAssessment = async () => {
    await dispatch(loadCourseById({ documentId: id, language: selectedLanguage }));
  };

  if (!quiz) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 bg-[#fafafa]">
        <h1 className="text-xl font-semibold text-gray-800">No assessment available</h1>
        <p className="text-sm text-gray-600 text-center max-w-3xl">
          This course has no quiz in <strong>{selectedLanguage}</strong>. Go back to the course and try another
          language, or contact support if you expect an assessment here.
        </p>
        <a
          href={`/courses/${category}/${id}?lang=${encodeURIComponent(selectedLanguage)}`}
          className="text-primary font-medium hover:underline"
        >
          Back to course
        </a>
      </div>
    );
  }

  return (
    <AssessmentInstructions
      category={category}
      courseId={id}
      courseNumericId={course?.id}
      courseName={course?.title}
      courseVersion={course?.courseVersion}
      quiz={quiz}
      feedback={feedback}
      onBeforeStartAssessment={handleBeforeStartAssessment}
      selectedLanguage={selectedLanguage}
      quizLanguageMismatch={quizLanguageMismatch}
    />
  );
}
