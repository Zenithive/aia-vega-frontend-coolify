export const getFeedbackForLanguage = (feedbacks, language) => {
  if (!Array.isArray(feedbacks) || feedbacks.length === 0) return null;

  const normalizedLanguage = String(language || '').trim().toLowerCase();
  if (!normalizedLanguage) return feedbacks[0] || null;

  return feedbacks.find(
    (feedback) => String(feedback?.language || '').trim().toLowerCase() === normalizedLanguage
  ) || null;
};

export const hasFeedbackQuestions = (feedback) =>
  Array.isArray(feedback?.questions) && feedback.questions.length > 0;
