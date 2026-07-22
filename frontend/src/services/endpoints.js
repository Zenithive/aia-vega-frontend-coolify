// Centralized API Endpoints
// Update these endpoints when backend is ready

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    RESET_FORGOT_PASSWORD: '/auth/reset-forgot-password',
    VERIFY_EMAIL: '/auth/verify-email',
    ME: '/users/me',
    CHECK_ADMIN_ACCESS: '/auth/check-admin-access',
    ADMIN_TOKEN: '/auth/admin-token',
    CHECK_USER: '/auth/check-user', 
  },


  // User endpoints
  USERS: {
    LIST: '/users',
    GET: (id) => `/users/${id}`,
    CREATE: '/users',
    UPDATE: (id) => `/users/${id}`,
    DELETE: (id) => `/users/${id}`,
    PROFILE: '/users/profile',
  },

  // Profile Edit Request endpoints
  PROFILE_EDIT_REQUESTS: {
    CREATE: '/profile-edit-requests',
    LIST: '/profile-edit-requests',
    GET: (id) => `/profile-edit-requests/${id}`,
  },

  // Add more endpoint groups as needed
  // PRODUCTS: {
  //   LIST: '/products',
  //   GET: (id) => `/products/${id}`,
  //   CREATE: '/products',
  //   UPDATE: (id) => `/products/${id}`,
  //   DELETE: (id) => `/products/${id}`,
  // },
  // Home/Dashboard endpoints
  HOME: {
    DASHBOARD: '/dashboard',
    NEWS: '/dashboard/news',
    QUICK_LINKS: '/dashboard/quick-links',
    EVENTS: '/dashboard/events',
    NEW_JOINEES: '/dashboard/new-joinees',
    MY_COURSES: '/dashboard/my-courses',
    BIRTHDAYS_TODAY: '/dashboard/birthdays-today',
    WORK_ANNIVERSARIES: '/dashboard/work-anniversaries',
  },

  // News endpoints
  NEWS: {
    LIST: '/news',
    GET: (id) => `/news/${id}`,
  },

  // People endpoints
  PEOPLE: {
    LIST: '/people',
    GET: (id) => `/people/${id}`,
  },

  // Analytics endpoints
  ANALYTICS: {
    EMPLOYEES: '/analytics/employees',
    DEPARTMENTS: '/analytics/departments',
    UNIT_LOCATIONS: '/analytics/unit-locations',
    EVENTS_INGEST: '/analytics/events/ingest',
  },

  // Location endpoints – Strapi unit_locations content-type
  LOCATION: {
    UNIT_LOCATIONS: '/unit-locations',
    UNIT_LOCATIONS_WITH_UNITS: '/unit-locations?populate[Units][populate][routes][populate][bus_stops][populate][bus_shifts]=true&populate[company]=true',
    UNIT_LOCATIONS_BY_LOCATION: '/unit-locations/by-location',
    UNIT_LOCATION_BY_ID: (id) => `/unit-locations/${id}?populate[company]=true&populate[Units][populate][unit_img]=true&populate[Units][populate][routes][populate][route_img]=true&populate[Units][populate][routes][populate][bus_stops][populate][bus_shifts]=true`,
  },

  // Calendar endpoints
  CALENDAR: {
    EVENTS: '/calendar/events',
  },

  // Courses endpoints
  COURSES: {
    LIST: '/courses',
    GET: (id) => `/courses/${id}`,
    MY_COURSES: '/courses/my-courses',
  },

  // Module video progress (mark-as-read creates/updates module_video_progress)
  MODULE_VIDEO_PROGRESS: {
    MARK_AS_READ: '/module-video-progresses/mark-as-read',
  },

  // Gallery endpoints (baseURL already includes /api)
  GALLERY: {
    LIST: '/gallery-items',
    BY_FILTERS: '/gallery-items/by-filters', // Primary; alternate: '/gallery-filtered' if above returns 404
  },

  // Notifications (portal user – toUser = current user)
  NOTIFICATIONS: {
    ME: '/notifications/me',          // unread only (bell)
    ALL: '/notifications/me/all',     // all history
    MARK_READ: '/notifications/mark-read',
  },

};

export default API_ENDPOINTS;
