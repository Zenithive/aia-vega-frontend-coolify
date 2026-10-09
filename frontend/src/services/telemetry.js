import api from '@/services/api';
import API_ENDPOINTS from '@/services/endpoints';

const TELEMETRY_STORAGE_KEY = 'telemetryQueueV1';
const TELEMETRY_SESSION_KEY = 'telemetrySessionId';
const TELEMETRY_MAX_BATCH_SIZE = 25;
const TELEMETRY_FLUSH_INTERVAL_MS = 10000;
const TELEMETRY_MAX_RETRIES = 5;
const TELEMETRY_BASE_RETRY_DELAY_MS = 2000;
const TELEMETRY_MAX_RETRY_DELAY_MS = 60000;

const DEFAULT_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337/api';
const INGEST_ENDPOINT = API_ENDPOINTS.ANALYTICS.EVENTS_INGEST;

let queue = [];
let isLoaded = false;
let isFlushing = false;
let flushTimer = null;
let onlineListenerAttached = false;
let lifecycleRefCount = 0;
let lastStartedRoute = null;
let lastStartedAtMs = 0;
let lastEndedFingerprint = null;
let lastEndedAtMs = 0;

function hasWindow() {
  return typeof window !== 'undefined';
}

function nowIso() {
  return new Date().toISOString();
}

function generateId(prefix = 'evt') {
  if (hasWindow() && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function buildRoutePath(pathname, search) {
  if (!pathname) return '/';
  if (!search) return pathname;
  return `${pathname}${search.startsWith('?') ? search : `?${search}`}`;
}

function inferPageType(routePath) {
  const path = String(routePath || '/').toLowerCase();
  if (path.startsWith('/courses')) return 'Courses';
  if (path.startsWith('/calendar')) return 'Calendar';
  if (path.startsWith('/profile')) return 'Profile';
  if (path.startsWith('/home')) return 'Home';
  if (path.startsWith('/news')) return 'News';
  if (path.startsWith('/resources')) return 'Resources';
  if (path.startsWith('/notifications')) return 'Notifications';
  if (path.startsWith('/people')) return 'People';
  if (path.startsWith('/gallery')) return 'Gallery';
  if (path.startsWith('/locations')) return 'Locations';
  if (path.startsWith('/routes')) return 'Routes';
  if (path.startsWith('/login')) return 'Login';
  return 'App';
}

function getAuthToken() {
  if (!hasWindow()) return null;
  return localStorage.getItem('authToken');
}

function getSessionId() {
  if (!hasWindow()) return 'sess_server';
  let sessionId = sessionStorage.getItem(TELEMETRY_SESSION_KEY);
  if (!sessionId) {
    sessionId = `sess_${generateId('sess')}`;
    sessionStorage.setItem(TELEMETRY_SESSION_KEY, sessionId);
  }
  return sessionId;
}

function loadQueue() {
  if (!hasWindow() || isLoaded) return;
  try {
    const raw = localStorage.getItem(TELEMETRY_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    queue = Array.isArray(parsed) ? parsed : [];
  } catch {
    queue = [];
  }
  isLoaded = true;
}

function persistQueue() {
  if (!hasWindow()) return;
  try {
    localStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // Swallow storage errors so telemetry never breaks UX.
  }
}

function getRetryDelayMs(attempt) {
  const delay = TELEMETRY_BASE_RETRY_DELAY_MS * Math.pow(2, Math.max(0, attempt - 1));
  return Math.min(delay, TELEMETRY_MAX_RETRY_DELAY_MS);
}

function enqueueEvent(event) {
  loadQueue();
  queue.push({
    event,
    retryCount: 0,
    nextRetryAt: Date.now(),
  });
  persistQueue();
}

function createEvent(eventName, payload = {}) {
  const occurredAt = payload.occurred_at || nowIso();
  const routePath = payload.route_path || (hasWindow() ? window.location.pathname : '/');

  return {
    event_id: payload.event_id || generateId('evt'),
    event_name: eventName,
    occurred_at: occurredAt,
    session_id: payload.session_id || getSessionId(),
    route_path: routePath,
    page_type: payload.page_type || inferPageType(routePath),
    entity_type: payload.entity_type || null,
    entity_id: payload.entity_id != null ? String(payload.entity_id) : null,
    duration_seconds: Number.isFinite(payload.duration_seconds) ? payload.duration_seconds : 0,
    click_count: Number.isFinite(payload.click_count) ? payload.click_count : 0,
    metadata_json: payload.metadata_json || {},
    client_ts: nowIso(),
    tz_offset: new Date().getTimezoneOffset(),
    source: payload.source || 'web',
  };
}

async function postBatch(events) {
  return api.post(INGEST_ENDPOINT, { events }, { timeout: 20000 });
}

function getReadyBatch() {
  const now = Date.now();
  const ready = queue.filter((item) => item.nextRetryAt <= now);
  return ready.slice(0, TELEMETRY_MAX_BATCH_SIZE);
}

function removeBatchFromQueue(batchIds) {
  const idSet = new Set(batchIds);
  queue = queue.filter((item) => !idSet.has(item.event.event_id));
}

function updateBatchRetries(batchIds) {
  const idSet = new Set(batchIds);
  const now = Date.now();
  queue = queue.flatMap((item) => {
    if (!idSet.has(item.event.event_id)) return [item];

    const nextRetryCount = (item.retryCount || 0) + 1;
    if (nextRetryCount > TELEMETRY_MAX_RETRIES) {
      return [];
    }

    return [{
      ...item,
      retryCount: nextRetryCount,
      nextRetryAt: now + getRetryDelayMs(nextRetryCount),
    }];
  });
}

async function flushQueue() {
  if (!hasWindow()) return;
  loadQueue();
  if (isFlushing || queue.length === 0) return;

  const token = getAuthToken();
  if (!token) return;

  const batchItems = getReadyBatch();
  if (batchItems.length === 0) return;

  isFlushing = true;
  const batchIds = batchItems.map((item) => item.event.event_id);
  const batchEvents = batchItems.map((item) => item.event);

  try {
    await postBatch(batchEvents);
    removeBatchFromQueue(batchIds);
  } catch {
    updateBatchRetries(batchIds);
  } finally {
    persistQueue();
    isFlushing = false;
  }
}

async function flushWithKeepalive() {
  if (!hasWindow()) return;
  loadQueue();
  if (isFlushing) return;
  const ready = getReadyBatch();
  if (ready.length === 0) return;

  const token = getAuthToken();
  if (!token) return;

  const events = ready.map((item) => item.event);
  const ids = ready.map((item) => item.event.event_id);
  const url = `${DEFAULT_API_BASE_URL.replace(/\/$/, '')}${INGEST_ENDPOINT}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ events }),
    });

    if (response.ok) {
      removeBatchFromQueue(ids);
    } else {
      updateBatchRetries(ids);
    }
  } catch {
    updateBatchRetries(ids);
  } finally {
    persistQueue();
  }
}

function startLifecycle() {
  if (!hasWindow()) return;
  lifecycleRefCount += 1;
  if (lifecycleRefCount > 1) return;

  loadQueue();

  if (!flushTimer) {
    flushTimer = window.setInterval(() => {
      flushQueue();
    }, TELEMETRY_FLUSH_INTERVAL_MS);
  }

  if (!onlineListenerAttached) {
    window.addEventListener('online', flushQueue);
    onlineListenerAttached = true;
  }

  flushQueue();
}

function stopLifecycle() {
  if (!hasWindow()) return;
  lifecycleRefCount = Math.max(0, lifecycleRefCount - 1);
  if (lifecycleRefCount > 0) return;

  if (flushTimer) {
    window.clearInterval(flushTimer);
    flushTimer = null;
  }

  if (onlineListenerAttached) {
    window.removeEventListener('online', flushQueue);
    onlineListenerAttached = false;
  }
}

function trackEvent(eventName, payload = {}) {
  const event = createEvent(eventName, payload);
  enqueueEvent(event);
  flushQueue();
  return event;
}

function trackPageViewStarted(routePath, metadata = {}) {
  const route = String(routePath || '');
  const now = Date.now();

  // Guard against duplicate starts from fast remounts/lifecycle overlaps in dev.
  if (lastStartedRoute === route && now - lastStartedAtMs <= 1500) {
    return null;
  }
  lastStartedRoute = route;
  lastStartedAtMs = now;

  return trackEvent('page_view_started', {
    route_path: route,
    metadata_json: metadata,
    duration_seconds: 0,
    click_count: 0,
  });
}

function trackPageViewEnded(routePath, durationSeconds, clickCount, metadata = {}) {
  const normalizedDuration = Math.max(0, Math.round(durationSeconds || 0));
  const normalizedClicks = Math.max(0, Number(clickCount) || 0);
  const fingerprint = `${routePath}|${normalizedDuration}|${normalizedClicks}`;
  const now = Date.now();

  // Avoid duplicate ended events caused by overlapping lifecycle signals.
  if (lastEndedFingerprint === fingerprint && now - lastEndedAtMs <= 1500) {
    return null;
  }

  lastEndedFingerprint = fingerprint;
  lastEndedAtMs = now;

  return trackEvent('page_view_ended', {
    route_path: routePath,
    duration_seconds: normalizedDuration,
    click_count: normalizedClicks,
    metadata_json: metadata,
  });
}

function trackLearningEvent(eventName, {
  routePath,
  entityType,
  entityId,
  pageType = 'CourseModule',
  durationSeconds = 0,
  clickCount = 0,
  metadata = {},
} = {}) {
  return trackEvent(eventName, {
    route_path: routePath,
    page_type: pageType,
    entity_type: entityType,
    entity_id: entityId,
    duration_seconds: durationSeconds,
    click_count: clickCount,
    metadata_json: metadata,
  });
}

const learningModuleSessions = new Map();
const learningQuizSessions = new Map();
const learningFeedbackSessions = new Map();

function normalizeCourseEntity(courseId) {
  if (courseId == null || courseId === '') return null;
  return String(courseId);
}

function makeLearningRoute(routePath) {
  if (routePath) return String(routePath);
  if (hasWindow()) return buildRoutePath(window.location.pathname, window.location.search);
  return '/courses';
}

function baseLearningPayload({
  courseId,
  routePath,
  moduleIndex = null,
  moduleTitle = null,
  pageType = 'Courses',
  metadata = {},
}) {
  const entityId = normalizeCourseEntity(courseId);
  if (!entityId) return null;

  return {
    routePath: makeLearningRoute(routePath),
    entityType: 'course',
    entityId,
    pageType,
    metadata: {
      courseId: entityId,
      moduleIndex,
      moduleTitle,
      ...metadata,
    },
  };
}

// 1) Module enter
function trackLearningModuleEnter({ courseId, moduleIndex = null, moduleTitle = null, routePath, metadata = {} }) {
  const base = baseLearningPayload({ courseId, routePath, moduleIndex, moduleTitle, metadata });
  if (!base) return null;

  const key = `${base.entityId}::${moduleIndex ?? 'na'}`;
  learningModuleSessions.set(key, Date.now());

  return trackLearningEvent('learning_module_enter', {
    ...base,
    durationSeconds: 0,
  });
}

// 2) Module exit (duration calculated automatically; hiddenMs = time the tab was in the background)
function trackLearningModuleExit({ courseId, moduleIndex = null, moduleTitle = null, routePath, hiddenMs = 0, metadata = {} }) {
  const base = baseLearningPayload({ courseId, routePath, moduleIndex, moduleTitle, metadata });
  if (!base) return null;

  const key = `${base.entityId}::${moduleIndex ?? 'na'}`;
  const startedAt = learningModuleSessions.get(key);
  // No start recorded (duplicate exit from a remount) → 0, so remounts do not add time.
  const durationSeconds = startedAt
    ? Math.max(0, Math.round((Date.now() - startedAt - Math.max(0, Number(hiddenMs) || 0)) / 1000))
    : 0;
  learningModuleSessions.delete(key);

  return trackLearningEvent('learning_module_exit', {
    ...base,
    durationSeconds,
  });
}

// 3) Video progress
function trackLearningVideoProgress({
  courseId,
  moduleIndex = null,
  moduleTitle = null,
  routePath,
  durationSeconds = 0,
  watchedSeconds = null,
  metadata = {},
}) {
  const base = baseLearningPayload({ courseId, routePath, moduleIndex, moduleTitle, metadata });
  if (!base) return null;
  const normalizedDuration = Math.max(0, Math.round(durationSeconds || 0));
  if (normalizedDuration <= 0) return null;

  return trackLearningEvent('learning_video_progress', {
    ...base,
    durationSeconds: normalizedDuration,
    metadata: {
      ...base.metadata,
      watchedSeconds,
    },
  });
}

// 4) Video completed
function trackLearningVideoCompleted({
  courseId,
  moduleIndex = null,
  moduleTitle = null,
  routePath,
  durationSeconds = 0,
  watchedSeconds = null,
  metadata = {},
}) {
  const base = baseLearningPayload({ courseId, routePath, moduleIndex, moduleTitle, metadata });
  if (!base) return null;
  const normalizedDuration = Math.max(1, Math.round(durationSeconds || 0));

  return trackLearningEvent('learning_video_completed', {
    ...base,
    durationSeconds: normalizedDuration,
    metadata: {
      ...base.metadata,
      watchedSeconds,
    },
  });
}

// 5) Quiz started/submitted
function trackLearningQuizStarted({ courseId, routePath, quizId = null, metadata = {} }) {
  const base = baseLearningPayload({ courseId, routePath, metadata });
  if (!base) return null;

  learningQuizSessions.set(base.entityId, Date.now());

  return trackLearningEvent('learning_quiz_started', {
    ...base,
    durationSeconds: 0,
    metadata: {
      ...base.metadata,
      quizId,
    },
  });
}

function trackLearningQuizSubmitted({ courseId, routePath, quizId = null, score = null, maxScore = null, durationSeconds = null, metadata = {} }) {
  const base = baseLearningPayload({ courseId, routePath, metadata });
  if (!base) return null;

  const startedAt = learningQuizSessions.get(base.entityId);
  const computedDuration = startedAt ? Math.max(1, Math.round((Date.now() - startedAt) / 1000)) : 1;
  const normalizedDuration = Number.isFinite(durationSeconds)
    ? Math.max(1, Math.round(durationSeconds))
    : computedDuration;
  learningQuizSessions.delete(base.entityId);

  return trackLearningEvent('learning_quiz_submitted', {
    ...base,
    durationSeconds: normalizedDuration,
    metadata: {
      ...base.metadata,
      quizId,
      score,
      maxScore,
    },
  });
}

// 6) Feedback opened/submitted
function trackLearningFeedbackOpened({ courseId, routePath, feedbackId = null, metadata = {} }) {
  const base = baseLearningPayload({ courseId, routePath, metadata });
  if (!base) return null;

  learningFeedbackSessions.set(base.entityId, Date.now());

  return trackLearningEvent('learning_feedback_opened', {
    ...base,
    durationSeconds: 0,
    metadata: {
      ...base.metadata,
      feedbackId,
    },
  });
}

function trackLearningFeedbackSubmitted({ courseId, routePath, feedbackId = null, rating = null, durationSeconds = null, metadata = {} }) {
  const base = baseLearningPayload({ courseId, routePath, metadata });
  if (!base) return null;

  const startedAt = learningFeedbackSessions.get(base.entityId);
  const computedDuration = startedAt ? Math.max(1, Math.round((Date.now() - startedAt) / 1000)) : 1;
  const normalizedDuration = Number.isFinite(durationSeconds)
    ? Math.max(1, Math.round(durationSeconds))
    : computedDuration;
  learningFeedbackSessions.delete(base.entityId);

  return trackLearningEvent('learning_feedback_submitted', {
    ...base,
    durationSeconds: normalizedDuration,
    metadata: {
      ...base.metadata,
      feedbackId,
      rating,
    },
  });
}

const telemetryService = {
  buildRoutePath,
  flushQueue,
  flushWithKeepalive,
  startLifecycle,
  stopLifecycle,
  trackEvent,
  trackPageViewStarted,
  trackPageViewEnded,
  trackLearningEvent,

  trackLearningModuleEnter,
  trackLearningModuleExit,
  trackLearningVideoProgress,
  trackLearningVideoCompleted,
  trackLearningQuizStarted,
  trackLearningQuizSubmitted,
  trackLearningFeedbackOpened,
  trackLearningFeedbackSubmitted,
};

export default telemetryService;
