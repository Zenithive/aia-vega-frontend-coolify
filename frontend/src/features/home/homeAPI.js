import api from '@/services/api';
import API_ENDPOINTS from '@/services/endpoints';
import { USE_MOCK_DATA, mockDelay, MOCK_HOME_DATA } from '@/services/mockData';
import { getAvatarPropsForEmployee } from '@/lib/avatar';
import { fetchAllAnalyticsEmployees } from '@/services/analyticsEmployeesPagination';
import { NEW_JOINEE_DAYS, isNewJoinee } from '@/lib/newJoinee';

export const fetchDashboardData = async () => {
  const rest = USE_MOCK_DATA
    ? await mockDelay().then(() => MOCK_HOME_DATA.dashboard)
    : await Promise.resolve(MOCK_HOME_DATA.dashboard);
  if (!USE_MOCK_DATA) {
    const results = await Promise.allSettled([
      fetchUpcomingEvents(),
      fetchNewJoinees(),
      fetchMyCourses(),
      fetchQuickLinks(),
      fetchBirthdaysToday(),
      fetchWorkAnniversaries(),
    ]);
    const [eventsRes, newJoineesRes, coursesRes, quickLinksRes, birthdaysRes, anniversariesRes] = results;

    const pickOrEmpty = (res, label) => {
      if (res.status === 'fulfilled') return Array.isArray(res.value) ? res.value : [];
      console.warn(`[home] ${label} fetch failed:`, res.reason?.message || res.reason);
      return [];
    };

    const events = pickOrEmpty(eventsRes, 'events');
    const newJoinees = pickOrEmpty(newJoineesRes, 'new joinees');
    const courses = pickOrEmpty(coursesRes, 'courses');
    const quickLinks = pickOrEmpty(quickLinksRes, 'quick links');
    const birthdays = pickOrEmpty(birthdaysRes, 'birthdays');
    const anniversaries = pickOrEmpty(anniversariesRes, 'anniversaries');

    return { ...rest, events, newJoinees, courses, quickLinks, birthdays, anniversaries };
  }
  return { ...rest };
};

export const fetchQuickLinks = async () => {
  if (USE_MOCK_DATA) {
    await mockDelay(300);
    return [...MOCK_HOME_DATA.quickLinks];
  }

  let response;
  try {
    response = await api.get('/important-links', {
      params: {
        'populate[link_icon]': true,
        sort: 'updatedAt:desc',
      },
    });
  } catch {
    // Some custom endpoints may not accept sort - retry without it.
    response = await api.get('/important-links', {
      params: {
        'populate[link_icon]': true,
      },
    });
  }
  // The API returns { data: [...] }
  const links = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);

  const resolveIcon = (link) => {
    const icon = link?.link_icon ?? link?.icon ?? null;
    if (!icon) return null;

    if (typeof icon === 'string') {
      return { iconText: icon };
    }

    if (icon.iconData) {
      return {
        iconData: icon.iconData,
        width: icon.width,
        height: icon.height,
        iconName: icon.iconName,
      };
    }

    // Strapi media can be flattened or nested under data/attributes depending on API settings.
    const media = icon?.data?.attributes ?? icon?.data ?? icon;
    const mediaUrl = media?.formats?.large?.url || media?.formats?.medium?.url || media?.formats?.small?.url || media?.formats?.thumbnail?.url || media?.url;
    if (mediaUrl) {
      const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337/api').replace(/\/api\/?$/, '');
      return { iconUrl: mediaUrl.startsWith('http') ? mediaUrl : `${base}${mediaUrl.startsWith('/') ? mediaUrl : `/${mediaUrl}`}` };
    }

    return null;
  };

  // Map to expected frontend format if needed
  return links
    .filter((link) => link?.active !== 'unpublished')
    .sort((a, b) => {
      const aTime = new Date(a?.updatedAt || a?.updated_at || a?.publishedAt || a?.createdAt || 0).getTime();
      const bTime = new Date(b?.updatedAt || b?.updated_at || b?.publishedAt || b?.createdAt || 0).getTime();
      return bTime - aTime;
    })
    .map(link => ({
      id: link.id,
      documentId: link.documentId,
      title: link.title,
      url: link.url,
      icon: resolveIcon(link),
      active: link.active,
    }));
};

function formatTimeString(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return '';
  const period = h < 12 ? 'AM' : 'PM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

function normalizeEvent(item) {
  const start = item.start_date;
  const hasTime = item.time_required === true && !!item.start_time;
  const timeDisplay = hasTime
    ? `${formatTimeString(item.start_time)}${item.end_time ? ` – ${formatTimeString(item.end_time)}` : ''}`
    : '';
  return {
    id: item.documentId ?? item.id,
    documentId: item.documentId,
    title: item.title,
    description: item.description?.replace(/<[^>]+>/g, '') || '',
    date: start ? start.slice(0, 10) : '',
    time: timeDisplay,
    location: item.event_location || '',
    event_type: item.event_type,
    start_date: item.start_date,
    end_date: item.end_date,
  };
}

export const fetchUpcomingEvents = async () => {
  if (USE_MOCK_DATA) {
    await mockDelay(400);
    return MOCK_HOME_DATA.events;
  }

  let res;
  try {
    res = await api.get('/events', {
      params: { sort: 'start_date:desc' },
    });
  } catch {
    // Fallback for endpoints that don't support sort param.
    res = await api.get('/events');
  }
  const raw = Array.isArray(res?.data) ? res.data : [];
  const active = raw.filter((e) => e.active !== 'unpublished');
  const forHome = active.filter((e) => [true, 1, '1', 'true'].includes(e.visible_on_homepage));
  const picked = (forHome.length > 0 ? forHome : active).sort((a, b) => {
    const aTime = new Date(a.start_date || 0).getTime();
    const bTime = new Date(b.start_date || 0).getTime();
    return bTime - aTime;
  });
  return picked.map(normalizeEvent);
};

function getCurrentUserCompany() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.company ?? null;
  } catch {
    return null;
  }
}

function normalizeCompanyForFilter(company) {
  const c = String(company ?? '').trim();
  if (!c) return null;
  const upper = c.toUpperCase();
  if (upper === 'AIA') return 'AIA';
  if (upper === 'VEGA') return 'Vega';
  return null;
}

function normalizeUserForJoinee(user) {
  const name = user.employee_name || user.username || 'Unknown';
  const avatar = getAvatarPropsForEmployee(user);
  const company = user.company || '';
  return {
    id: user.id,
    documentId: user.documentId,
    name,
    email: user.email || '',
    phone: user.contact_no || '',
    position: user.designation || '',
    department: user.department || '',
    joinDate: user.joining_date || null,
    dateOfBirth: user.date_of_birth || null,
    exitDate: user.exit_date || null,
    company,
    branch: user.branch || '',
    workingLocation: user.working_location || '',
    businessVertical: user.business_vertical || '',
    location: company === 'AIA' ? (user.branch || '') : (user.working_location || ''),
    empCode: user.emp_code || '',
    empId: user.emp_id || '',
    welcomeNote: user.welcome_note || '',
    avatar: avatar.src,
    avatarInitial: avatar.initials,
  };
}

function unwrapUserResponse(response) {
  const data = response?.data ?? response;
  if (data?.attributes) {
    return { id: data.id, documentId: data.documentId, ...data.attributes };
  }
  return data;
}

export const fetchNewJoineeById = async (id) => {
  if (!id) return null;

  if (USE_MOCK_DATA) {
    await mockDelay(300);
    const joinee = MOCK_HOME_DATA.newJoinees.find(
      (j) => String(j.id) === String(id) || String(j.documentId) === String(id)
    );
    if (!joinee) return null;
    return joinee;
  }

  const response = await api.get(API_ENDPOINTS.USERS.GET(id), {
    params: {
      'populate[photograph]': true,
    },
  });

  const user = unwrapUserResponse(response);
  if (!user) return null;

  const joinDate = user.joining_date || null;
  const isActiveNewJoinee =
    user.blocked !== true &&
    user.active !== false &&
    user.exit_date == null &&
    joinDate &&
    isNewJoinee(joinDate, NEW_JOINEE_DAYS);

  if (!isActiveNewJoinee) return null;

  return normalizeUserForJoinee(user);
};

function toUtcDateStringDaysAgo(daysAgo) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

export const fetchNewJoinees = async () => {
  if (USE_MOCK_DATA) {
    await mockDelay(400);
    const today = new Date();
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - NEW_JOINEE_DAYS);
    return MOCK_HOME_DATA.newJoinees
      .filter((j) => j.joinDate && new Date(j.joinDate) >= cutoff)
      .sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate))
      .slice(0, 6);
  }

  const company = normalizeCompanyForFilter(getCurrentUserCompany());
  const cutoffDate = toUtcDateStringDaysAgo(NEW_JOINEE_DAYS);
  const baseParams = {
    sortBy: 'join-newest',
    dateFrom: cutoffDate,
    ...(company && { company }),
  };
  const allItems = await fetchAllAnalyticsEmployees(api, API_ENDPOINTS.ANALYTICS.EMPLOYEES, baseParams);

  const newJoinees = allItems
    .filter((emp) => emp?.exit_date == null)
    .filter((emp) => emp.joining_date && emp.blocked !== true && isNewJoinee(emp.joining_date, NEW_JOINEE_DAYS))
    .sort((a, b) => new Date(b.joining_date) - new Date(a.joining_date))
    .map(normalizeUserForJoinee);

  return newJoinees;
};

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

function getCurrentUserId() {
  if (typeof window === 'undefined') return null;
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.id ?? null;
  } catch {
    return null;
  }
}

function getCurrentUserInfo() {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
}

/**
 * Fetch all active course-assignments and build a map of courseId → earliest due_date.
 * Filters only assignments that apply to the current user (by company, department,
 * work_location, or individual user id).
 */
async function fetchCourseDueDateMap() {
  const user = getCurrentUserInfo();
  const userId = user?.id ?? null;
  const userDept = String(user?.department ?? '').trim().toLowerCase();
  const userWorkLocation = String(user?.work_location ?? user?.work_location_id ?? '').trim().toLowerCase();

  let assignments = [];
  try {
    const res = await api.get('/course-assignments', {
      params: {
        'populate[courses]': true,
        'populate[departments]': true,
        'populate[individual_user]': true,
        'populate[work_locations]': true,
        'filters[active][$eq]': 'published',
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
      // Keep the earliest due_date per course
      if (!dueDateMap[cid] || new Date(dueDate) < new Date(dueDateMap[cid])) {
        dueDateMap[cid] = dueDate;
      }
    }
  }

  return dueDateMap;
}

export const fetchMyCourses = async () => {
  if (USE_MOCK_DATA) {
    await mockDelay(500);
    return MOCK_HOME_DATA.courses;
  }
  const userId = getCurrentUserId();

  // Three parallel calls: courses list + all user progress + assignment due dates
  const [response, allProgressRes, dueDateRes] = await Promise.allSettled([
    api.get(API_ENDPOINTS.COURSES.LIST, {
      params: {
        'populate[thumbnail]': true,
        'populate[modules]': true,
        sort: 'createdAt:desc',
      },
    }),
    userId
      ? api.get('/user-progress/all', { params: { userId } })
      : Promise.resolve(null),
    fetchCourseDueDateMap(),
  ]);

  const raw = response.status === 'fulfilled'
    ? (Array.isArray(response.value?.data) ? response.value.data : (Array.isArray(response.value) ? response.value : []))
    : [];
  const courses = raw.filter(c => c.active !== 'unpublished').slice(0, 4);

  // Build a map of courseId -> progress payload from the batch progress response.
  // Supports both shapes returned by backend:
  // 1) array of entries [{ course, completed_modules, progress_status, progress_percentage }]
  // 2) object map { [courseId]: { ...progressFields } }
  const progressMap = {};
  const setProgressEntry = (courseId, entry) => {
    if (courseId == null || !entry || typeof entry !== 'object') return;
    progressMap[String(courseId)] = {
      completedModules: Array.isArray(entry.completed_modules)
        ? entry.completed_modules.map(String)
        : [],
      progressStatus: entry.progress_status ?? null,
      progressPercentage: Number(entry.progress_percentage ?? 0) || 0,
    };
  };

  if (allProgressRes.status === 'fulfilled' && allProgressRes.value) {
    const progressData = allProgressRes.value?.data ?? allProgressRes.value;
    if (Array.isArray(progressData)) {
      for (const entry of progressData) {
        const cId = entry?.course?.id ?? entry?.courseId ?? entry?.course_id;
        setProgressEntry(cId, entry);
      }
    } else if (progressData && typeof progressData === 'object') {
      Object.entries(progressData).forEach(([key, entry]) => {
        const cId = entry?.course?.id ?? entry?.courseId ?? entry?.course_id ?? key;
        setProgressEntry(cId, entry);
      });
    }
  }

  const dueDateMap =
    dueDateRes.status === 'fulfilled' && dueDateRes.value && typeof dueDateRes.value === 'object'
      ? dueDateRes.value
      : {};

  return courses.map((c) => {
    const courseModules = Array.isArray(c.modules)
      ? c.modules
      : Array.isArray(c.modulesList)
        ? c.modulesList
        : [];
    const totalLessons = courseModules.length;
    const courseId = c.id ?? c.documentId;
    const progressEntry = progressMap[String(courseId)] || null;
    const completedModules = progressEntry?.completedModules || [];
    const completedLessonsById = courseModules.filter((m) =>
      completedModules.includes(String(m.id)) ||
      (m.module_id && completedModules.includes(String(m.module_id))) ||
      (m.moduleId && completedModules.includes(String(m.moduleId)))
    ).length;

    const statusNorm = String(progressEntry?.progressStatus || '').trim().toLowerCase();
    const progressFromApi = Math.min(100, Math.max(0, Math.round(Number(progressEntry?.progressPercentage || 0))));

    let progress = 0;
    let completedLessons = completedLessonsById;

    if (statusNorm === 'completed') {
      progress = 100;
      completedLessons = totalLessons;
    } else if (progressFromApi > 0) {
      progress = progressFromApi;
      completedLessons = totalLessons > 0
        ? Math.min(totalLessons, Math.round((progressFromApi / 100) * totalLessons))
        : completedLessonsById;
    } else {
      progress = totalLessons > 0 ? Math.min(100, Math.round((completedLessonsById / totalLessons) * 100)) : 0;
      completedLessons = completedLessonsById;
    }

    const assignmentDueDate = dueDateMap[String(courseId)] ?? dueDateMap[courseId];

    return {
      id: c.id,
      documentId: c.documentId,
      title: c.title || '',
      category: c.course_category || 'courses',
      thumbnail: withImageUrl(c.thumbnail),
      progress,
      completedLessons,
      totalLessons,
      progressStatus: progressEntry?.progressStatus ?? null,
      deadline: assignmentDueDate || c.deadline || null,
    };
  });
};


export const fetchBirthdaysToday = async () => {
  const userCompany = normalizeCompanyForFilter(getCurrentUserCompany());
  const params = {
    'populate[photograph]': true,
    sort: 'username:asc',
    'filters[exit_date][$null]': true,
    'filters[active][$ne]': false,
    'filters[blocked][$ne]': true,
    ...(userCompany && { 'filters[company][$eq]': userCompany }),
  };
  const response = await api.get(API_ENDPOINTS.USERS.LIST, { params });
  const users = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
  const today = new Date();
  const todayMonth = today.getMonth() + 1;
  const todayDate = today.getDate();
  // Filter users whose date_of_birth matches today (ignore year)
  return users
    .filter(u => {
      if (u.exit_date != null) return false;
      if (!u.date_of_birth) return false;
      const [year, month, day] = u.date_of_birth.split('-').map(Number);
      return month === todayMonth && day === todayDate;
    })
    .map(u => {
      const avatar = getAvatarPropsForEmployee(u);
      return {
        id: u.id,
        name: u.employee_name || u.username || 'Unknown',
        position: u.designation || '',
        department: u.department || '',
        avatar: avatar.src,
        avatarInitial: avatar.initials,
        date: u.date_of_birth,
        company: u.company || '',
      };
    });
};


export const fetchWorkAnniversaries = async () => {
  const userCompany = normalizeCompanyForFilter(getCurrentUserCompany());
  const params = {
    'populate[photograph]': true,
    sort: 'username:asc',
    'filters[exit_date][$null]': true,
    'filters[active][$ne]': false,
    'filters[blocked][$ne]': true,
    ...(userCompany && { 'filters[company][$eq]': userCompany }),
  };
  const response = await api.get(API_ENDPOINTS.USERS.LIST, { params });
  const users = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
  const today = new Date();
  const todayMonth = today.getMonth() + 1;
  const todayDate = today.getDate();
  // Filter users whose joining_date matches today (ignore year)
  return users
    .filter(u => {
      if (u.exit_date != null) return false;
      if (!u.joining_date) return false;
      const [year, month, day] = u.joining_date.split('-').map(Number);
      return month === todayMonth && day === todayDate;
    })
    .map(u => {
      const [year, month, day] = u.joining_date.split('-').map(Number);
      const yearsCompleted = today.getFullYear() - year;
      const avatar = getAvatarPropsForEmployee(u);
      return {
        id: u.id,
        name: u.username || 'Unknown',
        position: u.designation || '',
        department: u.department || '',
        avatar: avatar.src,
        avatarInitial: avatar.initials,
        yearsCompleted,
        joinDate: u.joining_date,
        company: u.company || '',
      };
    });
};

export default {
  fetchDashboardData,
  fetchQuickLinks,
  fetchUpcomingEvents,
  fetchNewJoinees,
  fetchNewJoineeById,
  fetchMyCourses,
  fetchBirthdaysToday,
  fetchWorkAnniversaries,
};