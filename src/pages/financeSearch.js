export const EMPTY_FINANCE_FILTERS = { tourOperator: "", from: "", to: "" };

export function validateFinanceFilters(filters) {
  if (!String(filters?.tourOperator ?? "").trim()) return "Tour Operator is required.";
  if (filters?.from && filters?.to && filters.from > filters.to) return "Date From cannot be later than Date To.";
  return null;
}

export function buildFinanceParams(filters, sort, page, pageSize) {
  const error = validateFinanceFilters(filters);
  if (error) throw new Error(error);
  const params = new URLSearchParams({ tourOperator: filters.tourOperator, page: String(page + 1), pageSize: String(pageSize), sortBy: sort.by, sortDir: sort.dir });
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  return params;
}

export function buildFinanceExportQuery(filters, sort) {
  const error = validateFinanceFilters(filters);
  if (error) throw new Error(error);
  const query = { tourOperator: filters.tourOperator, sortBy: sort.by, sortDir: sort.dir };
  if (filters.from) query.from = filters.from;
  if (filters.to) query.to = filters.to;
  return query;
}

export function formatFinanceEuro(value) {
  const numeric = Number(value);
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number.isFinite(numeric) ? numeric : 0);
}

export function displayFinanceDate(value) {
  const match = String(value ?? "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : String(value ?? "");
}
