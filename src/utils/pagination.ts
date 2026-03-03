export function parsePagination(query: { page?: string; limit?: string }) {
  const page = Math.max(1, parseInt(query.page || '1') || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '50') || 50));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function paginatedResponse<T>(data: T[], total: number, page: number, limit: number) {
  return {
    success: true as const,
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
