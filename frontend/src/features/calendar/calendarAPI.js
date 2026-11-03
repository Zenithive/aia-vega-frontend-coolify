/**
 * Calendar events API – only API calls. No Redux.
 */
import api from '@/services/api';
import { fetchEmployeeBirthdays, fetchEmployeeAnniversaries } from '@/features/people/peopleAPI';

const DEFAULT_EVENT_COLOR = '#2563EB';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337').replace(/\/api\/?$/, '');

function getEventImageUrl(eventImage) {
  if (!eventImage) return '';
  const raw = eventImage?.url ?? eventImage?.data?.attributes?.url ?? eventImage?.formats?.thumbnail?.url ?? eventImage?.formats?.small?.url;
  if (!raw) return '';
  return raw.startsWith('http') ? raw : `${API_BASE}${raw.startsWith('/') ? '' : '/'}${raw}`;
}


function formatTimeString(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return '';
  const period = h < 12 ? 'AM' : 'PM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

function normalizeEvent(item) {
  const startDateRaw = item.start_date; 
  const endDateRaw = item.end_date;

  const hasTime = item.time_required === true && !!item.start_time;

  const startDatetime = hasTime ? `${startDateRaw}T${item.start_time}` : null;
  const endDatetime = (hasTime && item.end_time) ? `${endDateRaw || startDateRaw}T${item.end_time}` : null;

  const timeDisplay = hasTime
    ? `${formatTimeString(item.start_time)}${item.end_time ? ` – ${formatTimeString(item.end_time)}` : ''}`
    : '';

  const typeRel = item.type_of_event;
  const eventTypeName = typeRel?.name || typeRel?.data?.attributes?.name || typeRel?.attributes?.name || item.event_type || '';
  const color = typeRel?.color_for_event || typeRel?.data?.attributes?.color_for_event || typeRel?.attributes?.color_for_event || DEFAULT_EVENT_COLOR;
  const eventImageUrl = getEventImageUrl(item.event_image);

  const locationsRaw = Array.isArray(item.work_locations)
    ? item.work_locations
    : Array.isArray(item.work_locations?.data)
      ? item.work_locations.data.map((d) => d?.attributes ?? d)
      : [];
  const location_names = locationsRaw
    .map((loc) => loc?.name || loc?.attributes?.name || null)
    .filter(Boolean);
  return {
    id: item.documentId ?? item.id,
    documentId: item.documentId,
    title: item.title,
    description: item.description?.replace(/<[^>]+>/g, '') || '',
    date: startDateRaw ? startDateRaw.slice(0, 10) : '',
    start_date: startDatetime ?? startDateRaw ?? null,
    end_date: endDatetime ?? endDateRaw ?? null,
    time: timeDisplay,
    location: item.event_location || '',
    event_type: eventTypeName,
    color,
    fullTitle: item.title,
    icon: 'calendar',
    event_image: eventImageUrl,
    event_created_for: item.event_created_for || 'All',
    location_names,
  };
}

/** GET /event-types – all event types with their colors for the legend */
export async function fetchEventTypes() {
  try {
    const res = await api.get('/event-types', {
      params: { sort: 'name:asc' },
    });
    const raw = Array.isArray(res?.data) ? res.data : [];
    return raw.map((et) => ({
      key: (et.name || '').toLowerCase().replace(/\s+/g, '_'),
      label: et.name || '',
      color: et.color_for_event || DEFAULT_EVENT_COLOR,
      documentId: et.documentId,
      id: et.id,
    }));
  } catch {
    return [];
  }
}

/** GET /events – all events for the calendar (no homepage filter) */
export async function fetchEvents() {
  const res = await api.get('/events', {
    params: { sort: 'start_date:asc', 'populate[work_locations]': true },
  });
  const raw = Array.isArray(res?.data) ? res.data : [];
  const active = raw.filter((e) => e.active !== false);
  return active.map(normalizeEvent);
}

/** GET /events/{documentId} – single event for detail view */
export async function fetchEventById(documentId) {
  const res = await api.get(`/events/${documentId}`);
  const data = res?.data;
  if (!data) return null;
  return normalizeEvent(data);
}

function normalizeHoliday(item) {
  const locationsRaw = Array.isArray(item.work_locations)
    ? item.work_locations
    : Array.isArray(item.work_locations?.data)
      ? item.work_locations.data.map((d) => d?.attributes ?? d)
      : [];
  const location_names = locationsRaw
    .map((loc) => loc?.name || loc?.attributes?.name || null)
    .filter(Boolean);
  return {
    id: item.documentId ?? item.id,
    documentId: item.documentId,
    title: item.title,
    date: item.date ? new Date(item.date).toISOString().slice(0, 10) : '',
    holiday_for: item.holiday_for,
    location_names,
  };
}

/** GET /holidays – all holidays for the calendar */
export async function fetchHolidays() {
  const res = await api.get('/holidays', {
    params: { sort: 'date:asc', 'populate[work_locations]': true },
  });
  const raw = Array.isArray(res?.data) ? res.data : [];
  const active = raw.filter((h) => h.active !== false);
  return active.map(normalizeHoliday);
}

/** GET employee birthdays for the calendar */
export { fetchEmployeeBirthdays };

/** GET employee work anniversaries for the calendar */
export { fetchEmployeeAnniversaries };
