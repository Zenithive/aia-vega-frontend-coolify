import api from '@/services/api';
import { API_ENDPOINTS } from '@/services/endpoints';
import { getAvatarPropsForEmployee } from '@/lib/avatar';
import { fetchAllAnalyticsEmployees } from '@/services/analyticsEmployeesPagination';
import { isNewJoinee } from '@/lib/newJoinee';
import {
  scalarFilterValue,
  hasMultipleFilterValues,
  buildSingleFilterCombos,
} from '@/lib/filterParams';

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

function normalizeUser(user) {
  const name = user.employee_name || user.username || 'Unknown';
  const joinDate = user.joining_date || null;
  const dateOfBirth = user.date_of_birth || null;
  const now = new Date();
  const isNew = joinDate ? isNewJoinee(joinDate) : false;
  const company = user.company || '';
  const yearsAtCompany = joinDate ? now.getFullYear() - new Date(joinDate).getFullYear() : null;
  const avatar = getAvatarPropsForEmployee(user);
  return {
    id: user.id,
    documentId: user.documentId,
    name,
    email: user.email || '',
    phone: user.contact_no || '',
    position: user.designation || '',
    title: user.designation || '',
    department: user.department || '',
    // For AIA, treat branch as location; for Vega, use working_location
    location: company === 'AIA' ? (user.branch || '') : (user.working_location || ''),
    branch: user.branch || '',
    joinDate,
    exitDate: user.exit_date || null,
    dateOfBirth,
    business_vertical: user.business_vertical || '',
    company,
    emp_code: user.emp_code || '',
    emp_id: user.emp_id || '',
    description: user.description || '',
    avatar: avatar.src,
    avatarInitial: avatar.initials,
    isNew,
    yearsAtCompany,
  };
}

function sortRawEmployees(items, sort) {
  if (!sort) return items;
  const copy = [...items];
  const getName = (user) => String(user.employee_name || user.username || '');
  const getJoinTime = (user) => (user.joining_date ? new Date(user.joining_date).getTime() : 0);

  switch (sort) {
    case 'name-asc':
      return copy.sort((a, b) => getName(a).localeCompare(getName(b)));
    case 'name-desc':
      return copy.sort((a, b) => getName(b).localeCompare(getName(a)));
    case 'join-newest':
      return copy.sort((a, b) => getJoinTime(b) - getJoinTime(a));
    case 'join-oldest':
      return copy.sort((a, b) => getJoinTime(a) - getJoinTime(b));
    default:
      return copy;
  }
}

function filterActiveEmployees(items, company) {
  const isVega = company?.toLowerCase() === 'vega';
  return items.filter((user) => (isVega ? user?.active === true : user?.exit_date == null));
}

function buildPeopleQueryParams({
  company = '',
  department = '',
  designation = '',
  location = '',
  search = '',
  sort = '',
  page = 1,
  pageSize = 9,
} = {}) {
  const params = { page, pageSize };
  if (company) params.company = company;

  const departmentValue = scalarFilterValue(department);
  const designationValue = scalarFilterValue(designation);
  const locationValue = scalarFilterValue(location);
  if (departmentValue) params.department = departmentValue;
  if (designationValue) params.designation = designationValue;
  if (locationValue) params.location = locationValue;
  if (search) params.search = search;
  if (sort) params.sortBy = sort;

  return params;
}

async function fetchPeoplePage({
  company = '',
  department = '',
  designation = '',
  location = '',
  search = '',
  sort = '',
  page = 1,
  pageSize = 9,
} = {}) {
  const params = buildPeopleQueryParams({
    company,
    department,
    designation,
    location,
    search,
    sort,
    page,
    pageSize,
  });

  const response = await api.get(API_ENDPOINTS.ANALYTICS.EMPLOYEES, { params });
  const items = filterActiveEmployees(response?.items || [], company).map(normalizeUser);

  return {
    items,
    totalPages: response?.totalPages || 1,
    totalCount: response?.total || items.length,
    currentPage: response?.page || page,
  };
}

async function fetchPeopleWithMergedFilters({
  company = '',
  department = '',
  designation = '',
  location = '',
  search = '',
  sort = '',
  page = 1,
  pageSize = 9,
} = {}) {
  const combos = buildSingleFilterCombos({ department, designation, location });
  const baseParams = {};
  if (company) baseParams.company = company;
  if (search) baseParams.search = search;

  const batches = await Promise.all(
    combos.map((combo) => {
      const params = { ...baseParams, ...combo };
      return fetchAllAnalyticsEmployees(api, API_ENDPOINTS.ANALYTICS.EMPLOYEES, params);
    })
  );

  const seen = new Set();
  let mergedRaw = [];
  for (const batch of batches) {
    for (const user of batch) {
      const key = user?.id;
      if (key == null) continue;
      const keyStr = String(key);
      if (seen.has(keyStr)) continue;
      seen.add(keyStr);
      mergedRaw.push(user);
    }
  }

  mergedRaw = filterActiveEmployees(mergedRaw, company);
  mergedRaw = sortRawEmployees(mergedRaw, sort);

  const normalized = mergedRaw.map(normalizeUser);
  const totalCount = normalized.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const items = normalized.slice(start, start + pageSize);

  return {
    items,
    totalPages,
    totalCount,
    currentPage: safePage,
  };
}

/**
 * Fetch paginated + filtered people from /analytics/employees.
 * All filtering is done server-side.
 */
export const fetchPeople = async ({
  company = '',
  department = '',
  designation = '',
  location = '',
  search = '',
  sort = '',
  page = 1,
  pageSize = 9,
} = {}) => {
  console.log('[fetchPeople] called with:', { company, department, designation, location, search, sort, page, pageSize });

  if (hasMultipleFilterValues(department, designation, location)) {
    return fetchPeopleWithMergedFilters({
      company,
      department,
      designation,
      location,
      search,
      sort,
      page,
      pageSize,
    });
  }

  return fetchPeoplePage({
    company,
    department,
    designation,
    location,
    search,
    sort,
    page,
    pageSize,
  });
};

/**
 * Fetch employees' birthdays and anniversaries for calendar display
 */
export const fetchEmployeeBirthdays = async () => {
  try {
    const company = normalizeCompanyForFilter(getCurrentUserCompany());
    const employees = await fetchAllAnalyticsEmployees(
      api,
      API_ENDPOINTS.ANALYTICS.EMPLOYEES,
      { ...(company && { company }) }
    );
    const today = new Date();
    const currentYear = today.getFullYear();
    
    return employees
      .filter(emp => emp.date_of_birth && emp.blocked !== true && emp.active !== false && emp.exit_date == null)
      .map(emp => {
        const birthday = new Date(emp.date_of_birth);
        // Use UTC to avoid timezone shift (e.g. "1990-03-06" is midnight UTC; getMonth/getDate would give March 5 in US timezones)
        const month = birthday.getUTCMonth();
        const day = birthday.getUTCDate();
        const dateKey = `${currentYear}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        return {
          id: `birthday-${emp.id}`,
          title: `🎂 ${emp.employee_name || emp.username}'s Birthday`,
          date: dateKey,
          employee: normalizeUser(emp),
          type: 'birthday',
          color: '#FD8C02',
          allDay: true
        };
      });
  } catch (error) {
    console.warn('Failed to fetch birthdays:', error);
    return [];
  }
};

export const fetchEmployeeAnniversaries = async () => {
  try {
    const company = normalizeCompanyForFilter(getCurrentUserCompany());
    const employees = await fetchAllAnalyticsEmployees(
      api,
      API_ENDPOINTS.ANALYTICS.EMPLOYEES,
      { ...(company && { company }) }
    );
    const today = new Date();
    const currentYear = today.getFullYear();
    
    return employees
      .filter(emp => emp.joining_date && emp.active !== false && emp.exit_date == null)
      .map(emp => {
        const joinDate = new Date(emp.joining_date);
        // Use UTC to avoid timezone shift (e.g. "2020-03-06" is midnight UTC; getMonth/getDate would give March 5 in US timezones)
        const month = joinDate.getUTCMonth();
        const day = joinDate.getUTCDate();
        const yearsOfService = currentYear - joinDate.getUTCFullYear();
        
        // Only show if it's been at least 1 year
        if (yearsOfService < 1) return null;
        
        const dateKey = `${currentYear}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return {
          id: `anniversary-${emp.id}`,
          title: `🏢 ${emp.employee_name || emp.username} - ${yearsOfService} Year${yearsOfService > 1 ? 's' : ''} work anniversary`,
          date: dateKey,
          employee: normalizeUser(emp),
          type: 'anniversary',
          color: '#9C2EDB',
          allDay: true,
          yearsOfService
        };
      })
      .filter(Boolean);
  } catch (error) {
    console.warn('Failed to fetch anniversaries:', error);
    return [];
  }
};

/**
 * Fetch unique department and location options for the given company.
 * Uses dedicated analytics endpoints for efficiency.
 */
export const fetchPeopleOptions = async (company = '') => {
  const params = company ? { company } : {};

  const [deptRes, locRes, allEmployees] = await Promise.all([
    api.get(API_ENDPOINTS.ANALYTICS.DEPARTMENTS, { params }),
    api.get(API_ENDPOINTS.ANALYTICS.UNIT_LOCATIONS, { params }),
    fetchAllAnalyticsEmployees(api, API_ENDPOINTS.ANALYTICS.EMPLOYEES, params),
  ]);

  const departments = (Array.isArray(deptRes) ? deptRes : [])
    .map((d) => d.name)
    .filter(Boolean)
    .sort();

  const designations = Array.from(
    new Set(
      (Array.isArray(allEmployees) ? allEmployees : [])
        .map((u) => (u?.designation || '').trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  const locations = (Array.isArray(locRes) ? locRes : [])
    .map((l) => l.name)
    .filter(Boolean)
    .sort();

  return { departments, designations, locations };
};

export default { fetchPeople, fetchPeopleOptions };