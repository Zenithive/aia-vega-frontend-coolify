import api from '@/services/api';

export const submitQuiz = async (payload) => {
  return api.post('/quiz-submissions/submit', payload);
};

export const getLatestSubmission = async (userId, courseId) => {
  return api.get('/quiz-submissions/latest', { params: { userId, courseId } });
};

export const getQuizSubmission = async (documentId) => {
  return api.get(`/quiz-submissions/${documentId}`);
};

// Send re-attempt request when max attempts reached.
export const sendReattemptRequest = async (userId, courseId, courseVersion) => {
  const uid = Number(userId);
  const cid = Number(courseId);
  if (!Number.isFinite(uid) || !Number.isFinite(cid)) {
    throw new Error('Valid userId and courseId are required to send reattempt request.');
  }

  const payload = {
    data: {
      userId: uid,
      courseId: cid,
      course_version: courseVersion ? String(courseVersion) : null,
    },
    userId: uid,
    courseId: cid,
    course_version: courseVersion ? String(courseVersion) : null,
  };

  return api.post(
    '/quiz-reattempt-request/send',
    payload,
    { headers: { 'Content-Type': 'application/json' }, timeout: 60000 }
  );
};

// Check if user has a pending, approved, or recently rejected reattempt request.
export const checkPendingReattemptRequest = async (userId, courseId, courseVersion) => {
  const params = {
    userId: Number(userId),
    courseId: Number(courseId),
  };

  if (courseVersion) {
    params.course_version = String(courseVersion);
  }

  const res = await api.get('/quiz-reattempt-request/pending', { params });

  // Handle both unwrapped (interceptor strips .data) and wrapped (raw axios) responses
  const data = res?.data ?? res;

  return {
    hasPending: data?.hasPending ?? false,
    hasApproved: data?.hasApproved ?? false,
    approvedForAttempt: data?.approvedForAttempt ?? null,
    hasRejected: data?.hasRejected ?? false,
    canRequestAgainAt: data?.canRequestAgainAt ?? null,
  };
};