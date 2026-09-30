// import api from '@/services/api';

// export const submitQuiz = async (payload) => {
//   return api.post('/quiz-submissions/submit', payload);
// };

// export const getLatestSubmission = async (userId, courseId) => {
//   return api.get('/quiz-submissions/latest', { params: { userId, courseId } });
// };

// // Get a quiz submission by documentId
// export const getQuizSubmission = async (documentId) => {
//   return api.get(`/quiz-submissions/${documentId}`);
// };

// // Send re-attempt request when max attempts reached (custom endpoint - bypasses REST validation)
// export const sendReattemptRequest = async (userId, courseId, requestedForAttempt) => {
//   const uid = Number(userId);
//   const cid = Number(courseId);
//   if (!Number.isFinite(uid) || !Number.isFinite(cid)) {
//     throw new Error('Valid userId and courseId are required to send reattempt request.');
//   }
//   const normalizedRequestedAttempt = Number(requestedForAttempt);
//   const payload = {
//     userId: uid,
//     courseId: cid,
//     ...(Number.isFinite(normalizedRequestedAttempt) && normalizedRequestedAttempt > 0
//       ? {
//           // Send both naming styles for backend compatibility.
//           requested_for_attempt: normalizedRequestedAttempt,
//           requestedForAttempt: normalizedRequestedAttempt,
//         }
//       : {}),
//   };
//   return api.post('/quiz-reattempt-request/send', payload, {
//     headers: { 'Content-Type': 'application/json' },
//     timeout: 60000,
//   });
// };

// // Check if user has pending or rejected reattempt request.
// // Returns { hasPending, hasRejected, hasApproved, canRequestAgainAt }.
// // hasRejected is true only when rejection was within last 24h; after 24h the assessment button is enabled again.
// export const checkPendingReattemptRequest = async (userId, courseId) => {
//   const res = await api.get('/quiz-reattempt-request/pending', {
//     params: { userId: Number(userId), courseId: Number(courseId) },
//   });
//   const normalizedStatus = String(res?.status ?? res?.requestStatus ?? res?.currentStatus ?? '').trim().toLowerCase();
//   return {
//     hasPending: res?.hasPending ?? false,
//     hasRejected: res?.hasRejected ?? false,
//     hasApproved:
//       res?.hasApproved ??
//       res?.approved ??
//       normalizedStatus === 'approved',
//     canRequestAgainAt: res?.canRequestAgainAt ?? null,
//   };
// };



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
// The backend calculates the attempt number from the DB — we only send userId + courseId.
export const sendReattemptRequest = async (userId, courseId) => {
  const uid = Number(userId);
  const cid = Number(courseId);
  if (!Number.isFinite(uid) || !Number.isFinite(cid)) {
    throw new Error('Valid userId and courseId are required to send reattempt request.');
  }
  return api.post(
    '/quiz-reattempt-request/send',
    { userId: uid, courseId: cid },
    { headers: { 'Content-Type': 'application/json' }, timeout: 60000 }
  );
};

// Check if user has a pending, approved, or recently rejected reattempt request.
// Returns:
//   hasPending        — user has a Pending request awaiting admin review
//   hasApproved       — an Approved slot exists (admin pre-approved or normal approval)
//   approvedForAttempt — which attempt number the approved slot covers
//   hasRejected       — rejected within last 24h (blocks new request)
//   canRequestAgainAt — ISO timestamp when user can request again after rejection
export const checkPendingReattemptRequest = async (userId, courseId) => {
  const res = await api.get('/quiz-reattempt-request/pending', {
    params: { userId: Number(userId), courseId: Number(courseId) },
  });

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