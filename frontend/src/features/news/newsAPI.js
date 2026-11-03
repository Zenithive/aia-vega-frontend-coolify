/**
 * News API – only API calls (Axios). No Redux.
 * Slice (newsSlice) uses these and updates the store.
 */
import api from '@/services/api';
import { STORAGE_KEYS } from '@/lib/constants';

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337').replace(/\/api\/?$/, '');

function getCurrentUserCompany() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_DATA);
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

// Helpers: normalize Strapi v4/v5 response (v5 = flat, no attributes; resolve image URL)
function unwrapMedia(attrs) {
  if (!attrs) return attrs;
  const cov = attrs.cover_image;
  if (!cov) return attrs;
  const data = cov?.data;
  if (data == null) return { ...attrs, cover_image: cov };
  const first = Array.isArray(data) ? data[0] : data;
  const mediaAttrs = first?.attributes || first;
  return mediaAttrs ? { ...attrs, cover_image: mediaAttrs } : { ...attrs, cover_image: cov };
}

function withImageUrl(item, preferSize = 'medium') {
  if (!item) return item;
  const cov = item.cover_image ?? item.image;
  const formats = cov?.formats ?? cov?.data?.formats ?? cov?.attributes?.formats;
  const rawUrl =
    formats?.[preferSize]?.url ||
    formats?.small?.url ||
    formats?.thumbnail?.url ||
    cov?.url ||
    cov?.data?.url ||
    cov?.attributes?.url ||
    item?.imageUrl ||
    item?.image;
  const url = typeof rawUrl === 'string' ? rawUrl : null;
  const imageUrl = url
    ? url.startsWith('http')
      ? url
      : BASE_URL + (url.startsWith('/') ? url : `/${url}`)
    : null;
  return { ...item, imageUrl };
}

// Accept both Strapi v4 { id, attributes } and v5 flat { id, documentId, title, ... }
function toFlat(item) {
  if (!item) return item;
  if (item.attributes) return { id: item.id, ...unwrapMedia(item.attributes) };
  return unwrapMedia(item);
}

function normalizeItem(item) {
  const flat = toFlat(item);
  return withImageUrl(flat, 'small');
}

function normalizeDetail(item) {
  const flat = toFlat(item);
  return withImageUrl(flat, 'medium');
}

function isActiveNews(item) {
  return (item?.active ?? true) !== false;
}

function getCompanyFilterParams() {
  const company = normalizeCompanyForFilter(getCurrentUserCompany());
  if (!company) return {};
  return { 'filters[company][name][$eq]': company };
}

// Backend api::news.news has pluralName "news-items" → /api/news-items
async function fetchNewsInternal(params = {}) {
  const res = await api.get('/news-items', {
    params: { populate: '*', sort: 'createdAt:desc', ...getCompanyFilterParams(), ...params },
  });
  const raw = Array.isArray(res?.data) ? res.data : [];
  return { news: raw.map(normalizeItem).filter(isActiveNews) };
}

/** Fetch ALL news (no filter). Used for the "View all news" listing page. Filters by user company (AIA/Vega) when applicable. */
export async function fetchAllNews({ page = 1, pageSize = 9 } = {}) {
  const res = await api.get('/news-items', {
    params: { 
      populate: '*', 
      sort: 'publishedAt:desc',
      page,
      pageSize,
      ...getCompanyFilterParams() 
    },
  });
  const raw = Array.isArray(res?.data) ? res.data : [];
  const items = raw.map(normalizeItem).filter(isActiveNews);
  const meta = res?.meta?.pagination || {};
  
  return {
    items,
    totalCount: meta.total || items.length,
    totalPages: meta.pageCount || 1,
    currentPage: meta.page || page,
  };
}


/** Fetch news categories for the filter dropdown. Filters by user company (AIA/Vega) when applicable. */
export async function fetchNewsCategories() {
  const company = normalizeCompanyForFilter(getCurrentUserCompany());
  const params = { 'filters[active][$eq]': true, sort: 'name:asc' };
  if (company) {
    params['filters[company][name][$eq]'] = company;
  }
  const res = await api.get('/news-categories', { params });
  const raw = Array.isArray(res?.data) ? res.data : [];
  return raw.map((c) => ({ id: c.id, documentId: c.documentId, name: c.name }));
}

export async function fetchNewsByCategory(categoryIdOrName, { page = 1, pageSize = 9 } = {}) {
  // Strapi: filter by news_category relation (by name or documentId)
  let params = { page, pageSize };
  if (categoryIdOrName && categoryIdOrName !== 'all') {
    const isNumeric = /^\d+$/.test(String(categoryIdOrName));
    if (isNumeric) {
      params['filters[news_category][id][$eq]'] = Number(categoryIdOrName);
    } else {
      params['filters[news_category][name][$eq]'] = categoryIdOrName;
    }
  }
  return fetchNewsInternalPaginated(params);
}

async function fetchNewsInternalPaginated(params = {}) {
  const res = await api.get('/news-items', {
    params: { populate: '*', sort: 'publishedAt:desc', ...getCompanyFilterParams(), ...params },
  });
  const raw = Array.isArray(res?.data) ? res.data : [];
  const items = raw.map(normalizeItem).filter(isActiveNews);
  const meta = res?.meta?.pagination || {};
  
  return {
    items,
    totalCount: meta.total || items.length,
    totalPages: meta.pageCount || 1,
    currentPage: meta.page || params.page || 1,
  };
}

/** Fetch a single news by id (numeric) or documentId (Strapi v5). Used for detail page. */
export async function fetchNewsById(id) {
  const res = await api.get(`/news-items/${id}`, {
    // Strapi v5: populate: '*' populates all relations, including likes
    params: { populate: '*' },
  });
  const data = res?.data;
  if (!data) return null;
  const detail = normalizeDetail(data);
  return isActiveNews(detail) ? detail : null;
}

// Like a news item by documentId (backend resolves documentId → document)
export async function likeNews(documentId) {
  return api.post(`/news-items/${documentId}/like`);
}

// Unlike a news item by documentId
export async function unlikeNews(documentId) {
  return api.post(`/news-items/${documentId}/unlike`);
}

// Fetch likes count and whether current user liked this news
export async function fetchNewsLikesState(id) {
  return api.get(`/news-items/${id}/likes-state`);
}

// Fetch like counts for multiple news items (for listing cards). Returns { [documentId]: number }
export async function fetchNewsLikesCounts(documentIds) {
  if (!Array.isArray(documentIds) || documentIds.length === 0) return {};
  const ids = documentIds.filter(Boolean).map(String);
  if (ids.length === 0) return {};
  const res = await api.get('/news-items/likes-counts', {
    params: { documentIds: ids.join(',') },
  });
  return typeof res === 'object' && res !== null ? res : {};
}

export default {
  fetchAllNews,
  fetchNewsCategories,
  fetchNewsByCategory,
  fetchNewsById,
  likeNews,
  unlikeNews,
  fetchNewsLikesState,
  fetchNewsLikesCounts,
};