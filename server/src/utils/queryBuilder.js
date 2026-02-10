/**
 * Dynamic SQL query builder for the entries list endpoint.
 *
 * Translates query string parameters (status, filters, sort, pagination)
 * into SQL WHERE/ORDER BY clauses and LIMIT/OFFSET values.
 * Uses parameterized queries (?) to prevent SQL injection.
 */

/**
 * Builds SQL fragments from the given query options.
 *
 * @param {string}  status   - Filter by entry status ("draft" or "published")
 * @param {Object}  filters  - Key-value pairs to filter by JSON data fields
 *                              (uses SQLite's json_extract to query inside the data blob)
 * @param {string}  sort     - Column to sort by. Prefix with "-" for descending.
 *                              Allowed columns: created_at, updated_at, id, status.
 * @param {number}  page     - Page number (defaults to 1)
 * @param {number}  perPage  - Results per page (defaults to 20, clamped to 1–100)
 *
 * @returns {{ whereClause, orderClause, limit, offset, params, currentPage }}
 *   - whereClause: SQL WHERE string (or empty string if no filters)
 *   - orderClause: SQL ORDER BY string
 *   - limit/offset: pagination values for LIMIT/OFFSET
 *   - params: array of bound parameter values matching the ? placeholders
 *   - currentPage: the validated page number
 */
function buildQuery({ status, filters, sort, page, perPage }) {
  const conditions = [];
  const params = [];

  // Filter by status (draft/published)
  if (status) {
    conditions.push('e.status = ?');
    params.push(status);
  }

  // Filter by JSON data fields using SQLite's json_extract function.
  // e.g. filter.category=tech becomes: json_extract(e.data, '$.category') = 'tech'
  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      conditions.push(`json_extract(e.data, '$.${key}') = ?`);
      params.push(value);
    }
  }

  const whereClause = conditions.length > 0
    ? 'WHERE ' + conditions.join(' AND ')
    : '';

  // Sorting — defaults to newest first. Only allows whitelisted column names
  // to prevent SQL injection through the sort parameter.
  let orderClause = 'ORDER BY e.created_at DESC';
  if (sort) {
    const desc = sort.startsWith('-');
    const field = desc ? sort.slice(1) : sort;
    if (['created_at', 'updated_at', 'id', 'status'].includes(field)) {
      orderClause = `ORDER BY e.${field} ${desc ? 'DESC' : 'ASC'}`;
    }
  }

  // Pagination — clamp values to safe ranges
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
