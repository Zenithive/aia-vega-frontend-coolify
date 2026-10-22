import api from '@/services/api';
import { API_ENDPOINTS } from '@/services/endpoints';

const SEARCH_PEOPLE_LIMIT = 10;
const SEARCH_COURSES_LIMIT = 10;

function slugifyCategory(category) {
  if (!category || typeof category !== 'string') return 'other';
  return category.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Search people (employees) via analytics/employees. Returns items shaped for global search.
 */
export async function searchPeople(query) {
  const q = String(query || '').trim();
  if (!q) return [];
  try {
    const response = await api.get(API_ENDPOINTS.ANALYTICS.EMPLOYEES, {
      params: { search: q, company: 'all companies', page: 1, pageSize: SEARCH_PEOPLE_LIMIT },
      timeout: 8000,
    });
    const items = response?.items ?? [];
    return items.map((user) => ({
      id: user.id,
      type: 'person',
      name: user.employee_name || user.username || 'Unknown',
      subtitle: [user.designation, user.department].filter(Boolean).join(' · ') || user.email || '',
      href: '/people',
      searchQuery: q,
      company: user.company || 'AIA',
    }));
  } catch (e) {
    console.warn('[globalSearch] searchPeople failed:', e?.message);
    return [];
  }
}

/**
 * Search courses by title via Strapi courses API. Returns minimal items for global search.
 */
export async function searchCourses(query) {
  const q = String(query || '').trim();
  if (!q) return [];
  try {
    const response = await api.get(API_ENDPOINTS.COURSES.LIST, {
      params: {
        search: q,
        'pagination[pageSize]': SEARCH_COURSES_LIMIT,
        'pagination[page]': 1,
        'populate[thumbnail]': 'url',
        sort: 'createdAt:desc',
      },
      timeout: 8000,
    });
    const raw = response?.data ?? response ?? [];
    const list = Array.isArray(raw) ? raw : [];
    return list
      .filter((c) => c.active !== false)
      .map((course) => {
        const category = slugifyCategory(course.course_category || 'other');
        const docId = course.documentId ?? course.id;
        return {
          id: course.id ?? docId,
          documentId: docId,
          type: 'course',
          name: course.title || 'Untitled course',
          subtitle: course.course_category || 'Course',
          href: `/courses/${category}/${docId}`,
        };
      });
  } catch (e) {
    console.warn('[globalSearch] searchCourses failed:', e?.message);
    return [];
  }
}

/**
 * Run people and courses search in parallel. Optimized: single debounced call from UI.
 */
export async function globalSearch(query) {
  const q = String(query || '').trim();
  if (!q || q.length < 2) {
    return { people: [], courses: [] };
  }
  const [people, courses] = await Promise.all([
    searchPeople(q),
    searchCourses(q),
  ]);
  return { people, courses };
}
