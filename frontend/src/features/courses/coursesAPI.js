import api from '@/services/api';
import API_ENDPOINTS from '@/services/endpoints';
import { getCurrentUserId } from '@/lib/auth';
import { USE_MOCK_DATA, mockDelay, MOCK_COURSE_CATEGORIES } from '@/services/mockData';
import { getFeedbackForLanguage, hasFeedbackQuestions } from './feedbackUtils';

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337/api').replace(/\/api\/?$/, '');

function withImageUrl(imageObj) {
  if (!imageObj) return null;
  const url =
    imageObj.formats?.large?.url ||
    imageObj.formats?.medium?.url ||
    imageObj.formats?.small?.url ||
    imageObj.formats?.thumbnail?.url ||
    imageObj.url;
  if (!url) return null;
  return url.startsWith('http') ? url : BASE_URL + (url.startsWith('/') ? url : `/${url}`);
}

function extractRichText(blocks) {
  if (!Array.isArray(blocks)) return '';
  return blocks
    .flatMap(block => block.children || [])
    .map(child => child.text || '')
    .join(' ');
}

function extractTextContent(blocks) {
  if (!Array.isArray(blocks)) return '';
  return blocks
    .flatMap(block => block.children || [])
    .map(child => child.text || '')
    .join('\n\n');
}

/** Module quiz with arrays always present (questions / instructions). */
function normalizeModuleQuiz(quiz, module) {
  if (!quiz || typeof quiz !== 'object') return null;
  return {
    ...quiz,
    language: quiz.language || module?.language || '',
    moduleId: module?.module_id || '',
    moduleTitle: module?.title || '',
    quiz_questions: Array.isArray(quiz.quiz_questions) ? quiz.quiz_questions : [],
    quiz_instruction: Array.isArray(quiz.quiz_instruction) ? quiz.quiz_instruction : [],
  };
}

function normalizeModule(module, index) {
  // Strapi returns video_file as an array for media fields — take the first item
  const videoFile = Array.isArray(module.video_file) ? module.video_file[0] : module.video_file;
  const rawUrl = videoFile?.url;
  const videoUrl = rawUrl
    ? (rawUrl.startsWith('http') ? rawUrl : BASE_URL + (rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`))
    : null;
  const pdfFile = Array.isArray(module.pdf_file) ? module.pdf_file[0] : module.pdf_file;
  const rawPdfUrl = pdfFile?.url;
  const pdfUrl = rawPdfUrl
    ? (rawPdfUrl.startsWith('http') ? rawPdfUrl : BASE_URL + (rawPdfUrl.startsWith('/') ? rawPdfUrl : `/${rawPdfUrl}`))
    : null;

  const moduleKind = module.module_type === 'Offline' ? 'Offline' : 'Online';
  const quiz = moduleKind === 'Online' ? normalizeModuleQuiz(module.quiz, module) : null;

  return {
    id: module.id,
    moduleId: module.module_id || '',
    moduleNumber: index + 1,
    moduleTitle: module.title || '',
    // Online modules have content (+ optional quiz); Offline modules are practical sessions assessed in person.
    moduleKind,
    quiz,
    hasQuiz: !!quiz && quiz.quiz_questions.length > 0,
    moduleType: moduleKind === 'Offline' ? 'Offline' : module.module_content_type || 'Text',
    moduleDuration: typeof module.module_duration_min === 'number' ? module.module_duration_min : '',
    moduleStatus: 'active',
    content: extractTextContent(module.text_content),
    text_content: module.text_content || null,
    video_file: videoFile && videoUrl ? { ...videoFile, url: videoUrl } : null,
    pdf_file: pdfFile && pdfUrl ? { ...pdfFile, url: pdfUrl } : null,
    mark_as_read: module.mark_as_read || false,
    language: module.language || '',
    description: typeof module.video_description === 'string' && module.video_description
      ? module.video_description
      : Array.isArray(module.description) && module.description.length > 0
        ? extractTextContent(module.description)
        : null,
  };
}

function normalizeCourse(course) {
  const courseAttributes = course?.attributes || course || {};
  const rawModules = Array.isArray(courseAttributes.modules) ? courseAttributes.modules : [];
  const courseLanguages = Array.isArray(courseAttributes.course_language) ? courseAttributes.course_language : [];

  // Card stats should represent one language track, not all language variants together.
  const primaryLanguage = (courseLanguages[0] || '').trim().toLowerCase();
  const modulesForStats = primaryLanguage
    ? rawModules.filter((module) => String(module?.language || '').trim().toLowerCase() === primaryLanguage)
    : rawModules;
  const effectiveModulesForStats = modulesForStats.length > 0 ? modulesForStats : rawModules;
  const totalModuleDuration = effectiveModulesForStats.reduce((total, module) => {
    const moduleTimeRaw = module?.module_duration_min;
    const moduleTime = Number(moduleTimeRaw);
    return total + (Number.isFinite(moduleTime) && moduleTime > 0 ? moduleTime : 0);
  }, 0);
  const durationMinutes = Number.isFinite(totalModuleDuration) && totalModuleDuration > 0
    ? totalModuleDuration
    : 0;
  // Quizzes belong to online modules; this flat list (each tagged with its module) keeps older consumers working.
  const quiz = rawModules
    .filter((m) => m?.module_type !== 'Offline' && m?.quiz)
    .map((m) => normalizeModuleQuiz(m.quiz, m));
  
  // Extract course group label
  const rawGroupLabel = courseAttributes.course_group_label;
  const groupLabel = rawGroupLabel?.data ?? rawGroupLabel;
  const normalizedGroupLabel = groupLabel?.attributes || groupLabel;
  const courseGroupLabel = groupLabel
    ? {
        id: normalizedGroupLabel.id || null,
        documentId: normalizedGroupLabel.documentId || null,
        name: normalizedGroupLabel.name || '',
      }
    : null;
  const feedbackRelation = courseAttributes.feedback?.data ?? courseAttributes.feedback;
  const rawFeedback = Array.isArray(feedbackRelation) ? feedbackRelation : [];
  const feedback = rawFeedback.map((rawEntry) => {
    const entry = rawEntry?.attributes || rawEntry || {};
    const templateRelation = entry.feedback_template?.data ?? entry.feedback_template;
    const template = templateRelation?.attributes || templateRelation || {};
    const questionsRelation = template.questions?.data ?? template.questions;
    const rawQuestions = Array.isArray(questionsRelation) ? questionsRelation : [];
    const questions = rawQuestions.map((rawQuestion) => {
      const question = rawQuestion?.attributes || rawQuestion || {};
      return {
        ...question,
        id: question.id ?? rawQuestion?.id,
        question_id: question.question_id || '',
        question: question.question || '',
        answer_type: question.answer_type || 'Text',
        mandatory: question.mandatory !== false,
      };
    });

    return {
      ...entry,
      language: entry.language || '',
      compulsory: entry.compulsory === true || entry.compulsory === 'true',
      questions,
    };
  });

  return {
    id: course.id ?? courseAttributes.id,
    documentId: course.documentId ?? courseAttributes.documentId,
    title: courseAttributes.title || '',
    category: courseAttributes.course_category || 'Other',
    courseGroupLabel,
    // UI fields expected by CoursesCategoryPage (original card design)
    image: withImageUrl(courseAttributes.thumbnail),
    moduleDuration: durationMinutes || '',
    duration: durationMinutes > 0 ? Math.round((durationMinutes / 60) * 10) / 10 : 0,
    durationMinutes,
    modules: effectiveModulesForStats.length || 0,
    rawModules,                              // raw Strapi format — needed for PUT updates
    modulesList: rawModules.map(normalizeModule),
    quiz,
    feedback,
    learners: 0,
    progress: 0,
    completed: false,
    certificationGenerated: false,
    contentType: null,
    time: null,
    // Additional metadata
    minPassingScore: courseAttributes.min_passing_score || 0,
    languages: courseLanguages,
    deadline: courseAttributes.deadline || null,
    // Course lineage: all versions of the same course share group_id; version is entered manually in admin.
    courseVersion: courseAttributes.course_version || '',
    groupId: courseAttributes.group_id || null,
    active: courseAttributes.active !== 'unpublished',
  };
}

function getCurrentUserInfo() {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
}

async function fetchCourseDueDateMap() {
  const user = getCurrentUserInfo();
  const userId = user?.id ?? null;
  const userDept = String(user?.department ?? '').trim().toLowerCase();
  const userWorkLocation = String(user?.work_location ?? user?.work_location_id ?? '').trim().toLowerCase();

  let assignments = [];
  try {
    const res = await api.get('/course-assignments', {
      params: {
        'populate[courses][fields][0]': 'id',
        'populate[departments]': true,
        'populate[individual_user]': true,
        'populate[work_locations]': true,
        'pagination[pageSize]': 1000,
        'pagination[page]': 1,
      },
    });
    assignments = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
  } catch {
    return {};
  }

  const dueDateMap = {};
  for (const assignment of assignments) {
    const dueDate = assignment.due_date;
    if (!dueDate) continue;

    const targetType = assignment.assignment_target_type;
    let applicable = false;

    if (targetType === 'Department') {
      const names = (Array.isArray(assignment.departments) ? assignment.departments : [])
        .map(d => String(d?.name ?? d?.title ?? '').trim().toLowerCase());
      applicable = userDept && names.some(n => n === userDept || n.includes(userDept) || userDept.includes(n));
    } else if (targetType === 'Individual') {
      const users = Array.isArray(assignment.individual_user) ? assignment.individual_user : [];
      applicable = userId != null && users.some(u => String(u?.id) === String(userId) || String(u?.documentId) === String(userId));
    } else if (targetType === 'Location') {
      const names = (Array.isArray(assignment.work_locations) ? assignment.work_locations : [])
        .map(l => String(l?.name ?? l?.title ?? l?.id ?? '').trim().toLowerCase());
      applicable = userWorkLocation && names.some(n => n === userWorkLocation || n.includes(userWorkLocation) || userWorkLocation.includes(n));
    }

    if (!applicable) continue;

    const courses = Array.isArray(assignment.courses) ? assignment.courses : [];
    for (const course of courses) {
      const cid = course?.id;
      if (!cid) continue;
      if (!dueDateMap[cid] || new Date(dueDate) < new Date(dueDateMap[cid])) {
        dueDateMap[cid] = dueDate;
      }
    }
  }

  return dueDateMap;
}

const COURSES_LIST_POPULATE = {
  'populate[thumbnail]': true,
  'populate[course_group_label]': true,
  'populate[feedback][populate][feedback_template][populate][questions]': true,
  'populate[modules][populate][quiz][populate][quiz_questions][populate][options]': true,
  sort: 'createdAt:desc',
};

const COURSES_LIST_PARAMS = {
  ...COURSES_LIST_POPULATE,
  'pagination[pageSize]': 50,
};

export const fetchAllCourses = async ({ page = 1, pageSize = 9 } = {}) => {
  if (USE_MOCK_DATA) {
    await mockDelay(300);
    const items = MOCK_COURSE_CATEGORIES;
    return {
      items,
      totalCount: items.length,
      totalPages: 1,
      currentPage: 1,
    };
  }
  const response = await api.get(API_ENDPOINTS.COURSES.LIST, {
    params: {
      ...COURSES_LIST_PARAMS,
      'pagination[page]': page,
      'pagination[pageSize]': pageSize,
    },
  });
  const data = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
  const dueDateMap = await fetchCourseDueDateMap();
  const items = data
    .filter(c => c.active !== 'unpublished')
    .map((course) => {
      const normalizedCourse = normalizeCourse(course);
      const assignedDueDate = dueDateMap[course?.id] || null;
      return {
        ...normalizedCourse,
        deadline: assignedDueDate || normalizedCourse.deadline || null,
      };
    });
  const meta = response?.meta?.pagination || {};
  return {
    items,
    totalCount: meta.total || items.length,
    totalPages: meta.pageCount || 1,
    currentPage: meta.page || page,
  };
};

/**
 * Fetch a single course by documentId.
 * @param {string} documentId - Course documentId
 * @param {{ language?: string }} opts - Optional. If language is set, backend should return only modules/quiz/feedback in that language.
 * Backend must populate quiz_questions.options so the quiz UI can show answer choices; see docs/BACKEND_QUIZ_OPTIONS_SPEC.md.
 */
export const fetchCourseById = async (documentId, opts = {}) => {
  // Quizzes live inside online modules (course → modules[] → quiz).
  const params = {
    'populate[modules][populate][video_file]': true,
    'populate[modules][populate][pdf_file]': true,
    'populate[modules][populate][quiz][populate][quiz_questions][populate][options]': true,
    'populate[modules][populate][quiz][populate][quiz_instruction][populate][checklist]': true,
    'populate[thumbnail]': true,
    'populate[course_group_label]': true,
    'populate[feedback][populate][feedback_template][populate][questions]': true,
  };
  if (opts.language) params.language = opts.language;

  const response = await api.get(API_ENDPOINTS.COURSES.GET(documentId), { params });
  const raw = response?.data?.data ?? response?.data ?? response;
  return normalizeCourse(raw);
};

export const updateModuleMarkAsRead = async (courseDocumentId, moduleId, rawModules) => {
  const updatedModules = rawModules.map((module) => {
    let videoFile = null;
    if (Array.isArray(module.video_file) && module.video_file.length > 0) {
      videoFile = module.video_file.map((f) => f.id);
    } else if (module.video_file?.id) {
      videoFile = module.video_file.id;
    }
    return {
      module_id: module.module_id,
      language: module.language,
      title: module.title,
      module_content_type: module.module_content_type,
      text_content: module.text_content ?? null,
      mark_as_read: module.id === moduleId ? true : module.mark_as_read,
      module_duration_min: module.module_duration_min ?? null,
      video_file: videoFile,
    };
  });

  console.log('[updateModuleMarkAsRead] PUT payload:', JSON.stringify({ data: { modules: updatedModules } }, null, 2));

  await api.put(API_ENDPOINTS.COURSES.GET(courseDocumentId), {
    data: { modules: updatedModules },
  }, { timeout: 30000 });
};

export const markModuleProgress = async ({ userId, courseId, moduleId, timeSpentMinutes = 0, selectedLanguage = null, startedAt = null, courseVersion = null }) => {
  return api.post('/user-progress/mark-module', {
    userId,
    courseId,
    moduleId,
    course_version: courseVersion ? String(courseVersion) : null,
    last_accessed_at: new Date().toISOString(),
    time_spent_minutes: Number(timeSpentMinutes) || 0,
    selected_language: selectedLanguage || null,
    // Only sent on the very first module mark (course not yet started)
    ...(startedAt ? { started_at: startedAt } : {}),
  });
};

/**
 * Transition a course to In_progress without marking any module complete.
 * Called when the user first engages with content (video play, View Full Content).
 */
export const startCourse = async ({ userId, courseId, language, courseVersion = null }) => {
  return api.post('/user-progress/start-course', {
    userId: Number(userId),
    courseId,
    language,
    course_version: courseVersion ? String(courseVersion) : null,
  });
};

/**
 * Create or update module-video-progress when user marks a module as read.
 * Backend expects: userId, courseId (numeric), moduleIndex, moduleTitle?, videoDurationMin?, timeWatchedMin?
 */
export const markModuleVideoProgress = async ({
  userId,
  courseId,
  moduleIndex,
  moduleTitle = null,
  videoDurationMin = 0,
  timeWatchedMin = 0,
  videoCompletionType = 'full_watch',
  courseVersion = null,
}) => {
  const normalizedUserId = Number(userId);
  const normalizedCourseId = Number(courseId);

  if (!Number.isFinite(normalizedUserId) || !Number.isFinite(normalizedCourseId)) {
    throw new Error('markModuleVideoProgress requires numeric userId and courseId');
  }

  return api.post(API_ENDPOINTS.MODULE_VIDEO_PROGRESS.MARK_AS_READ, {
    userId: normalizedUserId,
    courseId: normalizedCourseId,
    course_id: normalizedCourseId,
    course: normalizedCourseId,
    moduleIndex: Number(moduleIndex),
    moduleTitle: moduleTitle ?? null,
    videoDurationMin: Number(videoDurationMin) || 0,
    timeWatchedMin: Number(timeWatchedMin) || 0,
    video_completion_type: videoCompletionType,
    course_version: courseVersion ? String(courseVersion) : null,
    last_updated: new Date().toISOString(),
  });
};

const EMPTY_PROGRESS = {
  completedModules: [],
  progressStatus: null,
  feedbackSubmitted: false,
  progressPercentage: 0,
  selectedLanguage: null,
  moduleStates: [],
  nextStep: null,
  currentModuleId: null,
};

// Returns progress for this user+course, including per-module state from the backend
// (type, unlocked, completed, quiz attempts, offline completion proof).
// Falls back to empty on any error so the UI stays functional.
// Pass { fresh: true } to bypass GET deduplication cache (use after mutations like mark-as-read).
export const fetchUserCourseProgress = async (userId, courseNumericId, opts = {}) => {
  if (!userId || !courseNumericId) {
    return { ...EMPTY_PROGRESS };
  }
  try {
    const params = { userId, courseId: courseNumericId };
    if (opts.language) params.language = opts.language;
    if (opts.fresh) params._t = Date.now(); // bypass dedupe cache
    const response = await api.get('/user-progress/progress', { params });
    const data = response?.data || response;
    const completedModules = Array.isArray(data?.completed_modules) ? data.completed_modules.map(String) : [];
    const feedbackSubmitted = !!data?.feedback_submission;
    const progressPercentage = data?.progress_percentage ?? 0;
    const selectedLanguage = data?.selected_language ?? null;
    return {
      completedModules,
      progressStatus: data?.progress_status ?? null,
      feedbackSubmitted,
      progressPercentage,
      selectedLanguage,
      moduleStates: Array.isArray(data?.module_states) ? data.module_states : [],
      nextStep: data?.next_step ?? null,
      currentModuleId: data?.current_module_id ?? null,
    };
  } catch {
    return { ...EMPTY_PROGRESS };
  }
};

// Returns all user progress keyed by course id (for course list completion badges).
export const fetchAllUserProgress = async (userId) => {
  if (!userId) return {};
  try {
    const res = await api.get('/user-progress/all', { params: { userId } });
    const data = res?.data && !Array.isArray(res.data) && typeof res.data === 'object' && res.data.progress_status == null
      ? res.data
      : res;
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
};

function isPastDeadline(deadline) {
  if (!deadline) return false;
  const dueEndOfDay = new Date(`${String(deadline).slice(0, 10)}T23:59:59`);
  return Number.isFinite(dueEndOfDay.getTime()) && Date.now() > dueEndOfDay.getTime();
}

function withLearnerProgress(course, progress) {
  const progressStatus = progress?.progress_status ?? course.progressStatus ?? null;
  const completedFromStatus = String(progressStatus || '').trim().toLowerCase() === 'completed';
  const isCompleted = (progress?.completed ?? completedFromStatus) || course.completed === true;
  const feedbackSubmitted = progress?.feedback_submitted ?? course.feedbackSubmitted ?? false;
  const selectedLanguage = String(progress?.selected_language || '').trim().toLowerCase();
  const feedbackForLanguage = getFeedbackForLanguage(course.feedback, selectedLanguage);
  const feedbackPending =
    isCompleted &&
    feedbackForLanguage?.compulsory === true &&
    hasFeedbackQuestions(feedbackForLanguage) &&
    !feedbackSubmitted;
  const completed = isCompleted && !feedbackPending;
  const effectiveProgressStatus = feedbackPending ? 'In_progress' : progressStatus;
  const deadline = progress?.due_date || course.deadline || null;
  const isDueDatePassed = isPastDeadline(deadline);
  return {
    ...course,
    completed,
    selectedLanguage: progress?.selected_language ?? null,
    feedbackPending,
    feedbackSubmitted,
    certificationGenerated: progress?.certificate_issued ?? course.certificationGenerated,
    progressStatus: effectiveProgressStatus,
    deadline,
    isDeadlineLocked: !completed && isDueDatePassed,
    isDueDatePassed,
  };
}

async function attachLearnerProgress(items) {
  const courses = Array.isArray(items) ? items : [];
  const userId = getCurrentUserId();
  if (!userId) return courses.map((course) => withLearnerProgress(course, null));

  const progressByCourse = await fetchAllUserProgress(userId);
  return courses.map((course) => {
    const progress = progressByCourse?.[course.id] || progressByCourse?.[String(course.id)] || null;
    return withLearnerProgress(course, progress);
  });
}

export const fetchCourseCategories = fetchAllCourses;

/**
 * Fetch all published course group labels.
 * Returns all available group labels regardless of course assignment.
 */
export const fetchAllCourseGroupLabels = async () => {
  if (USE_MOCK_DATA) {
    await mockDelay(200);
    return [];
  }

  try {
    // Fetch all published group labels directly from the course-group-labels endpoint
    const response = await api.get('/course-group-labels', {
      params: {
        'pagination[pageSize]': 100,
        'sort': 'name:asc',
      },
    });

    const data = Array.isArray(response?.data) ? response.data : [];
    
    // Filter out labels without names and return
    return data
      .filter(label => label && label.documentId && label.name)
      .map(label => ({
        id: label.id,
        documentId: label.documentId,
        name: label.name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error fetching course group labels:', error);
    return [];
  }
};

/**
 * Fetch course group labels that have a course in this category assigned to the current user.
 * The API drops labels whose courses are not assigned to this learner.
 * @param {string} category - Course category (e.g., 'mandatory', 'orientation', 'other')
 */
export const fetchCourseGroupLabelsByCategory = async (category) => {
  if (USE_MOCK_DATA) {
    await mockDelay(200);
    return [];
  }

  try {
    const normalizedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
    
    const response = await api.get('/course-group-labels', {
      params: {
        'filters[courses][course_category][$eq]': normalizedCategory,
        'filters[courses][active][$ne]': 'unpublished',
        'pagination[pageSize]': 100,
        sort: 'name:asc',
      },
    });

    const data = Array.isArray(response?.data) ? response.data : [];
    return data
      .filter(label => label?.documentId && label?.name)
      .map(label => ({
        id: label.id,
        documentId: label.documentId,
        name: label.name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error fetching course group labels:', error);
    return [];
  }
};

/**
 * Fetch courses filtered by category and group label with pagination.
 * @param {Object} params
 * @param {string} params.category - Course category
 * @param {string} [params.groupLabelId] - Group label documentId. Omit or pass "all" to skip the label filter.
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.pageSize - Items per page (default: 3)
 */
export const fetchCoursesByGroupLabel = async ({ category, groupLabelId, page = 1, pageSize = 3, search = '' }) => {
  if (USE_MOCK_DATA) {
    await mockDelay(300);
    return { items: [], totalCount: 0, totalPages: 0, currentPage: 1 };
  }

  try {
    const normalizedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
    
    const safePage = Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1;
    const safePageSize = Number.isFinite(Number(pageSize)) && Number(pageSize) > 0 ? Number(pageSize) : 3;
    const filterByLabel = groupLabelId && groupLabelId !== 'all';
    const searchTerm = String(search || '').trim();

    const response = await api.get(API_ENDPOINTS.COURSES.LIST, {
      params: {
        ...COURSES_LIST_POPULATE,
        sortBy: 'due_date',
        ...(searchTerm ? { search: searchTerm } : {}),
        'filters[course_category][$eq]': normalizedCategory,
        ...(filterByLabel ? { 'filters[course_group_label][documentId][$eq]': groupLabelId } : {}),
        'filters[active][$ne]': 'unpublished',
        'pagination[page]': safePage,
        'pagination[pageSize]': safePageSize,
      },
      skipRecentCache: true,
    });

    const data = Array.isArray(response?.data) ? response.data : [];
    const dueDateMap = await fetchCourseDueDateMap();
    
    const items = data.map((course) => {
      const normalizedCourse = normalizeCourse(course);
      const assignedDueDate = dueDateMap[course?.id] || null;
      return {
        ...normalizedCourse,
        deadline: assignedDueDate || normalizedCourse.deadline || null,
      };
    });

    const meta = response?.meta?.pagination || {};
    return {
      items: await attachLearnerProgress(items),
      totalCount: meta.total || items.length,
      totalPages: meta.pageCount || 1,
      currentPage: meta.page || page,
    };
  } catch (error) {
    console.error('Error fetching courses by group label:', error);
    return { items: [], totalCount: 0, totalPages: 0, currentPage: 1 };
  }
};

export default {
  fetchAllCourses,
  fetchCourseCategories,
  fetchCourseById,
  fetchAllCourseGroupLabels,
  fetchCourseGroupLabelsByCategory,
  fetchCoursesByGroupLabel,
};
