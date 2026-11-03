import { fetchPolicies } from './policiesAPI';
import { fetchFormTemplates } from './formTemplatesAPI';

export async function fetchResources(page = 1, limit = 10, type = 'policies') {
  if (type === 'forms') {
    const result = await fetchFormTemplates({ page, limit });
    const pagination = result.meta?.pagination || {};
    return {
      resources: result.templates,
      totalPages: pagination.pageCount || 1,
      totalItems: pagination.total || result.templates.length,
      currentPage: pagination.page || page,
    };
  }

  const result = await fetchPolicies({ page, limit });
  return {
    resources: result.policies,
    totalPages: result.totalPages,
    totalItems: result.totalItems,
    currentPage: result.currentPage,
  };
}

export default { fetchResources };
