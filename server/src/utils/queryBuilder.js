
function buildQuery({ status, filters, sort, page, perPage }) {
  const conditions = [];
  const params = [];

  if (status) {
    conditions.push('e.status = ?');
    params.push(status);
  }

  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      conditions.push(`json_extract(e.data, '$.${key}') = ?`);
      params.push(value);
    }
  }

  const whereClause = conditions.length > 0
    ? 'WHERE ' + conditions.join(' AND ')
    : '';

  let orderClause = 'ORDER BY e.created_at DESC';
  if (sort) {
    const desc = sort.startsWith('-');
    const field = desc ? sort.slice(1) : sort;
    if (['created_at', 'updated_at', 'id', 'status'].includes(field)) {
      orderClause = `ORDER BY e.${field} ${desc ? 'DESC' : 'ASC'}`;
    }
  }

  const currentPage = Math.max(1, parseInt(page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(perPage) || 20));
  const offset = (currentPage - 1) * limit;

  return {
    whereClause,
    orderClause,
    limit,
    offset,
    params,
    currentPage,
  };
}

module.exports = { buildQuery };
