import assert from "node:assert/strict";
import test from "node:test";
import { EMPTY_FINANCE_FILTERS, buildFinanceExportQuery, buildFinanceParams, displayFinanceDate, formatFinanceEuro, validateFinanceFilters } from "../src/pages/financeSearch.js";

test("Finance search requires a Tour Operator and accepts a Tour Operator only", () => {
  assert.equal(validateFinanceFilters(EMPTY_FINANCE_FILTERS), "Tour Operator is required.");
  assert.equal(validateFinanceFilters({ ...EMPTY_FINANCE_FILTERS, tourOperator: "Alpha Tours" }), null);
});

test("Finance search supports From only, To only, and a full inclusive range", () => {
  const sort = { by: "THE_DATE", dir: "desc" };
  assert.match(buildFinanceParams({ tourOperator: "Alpha", from: "2026-09-01", to: "" }, sort, 0, 25).toString(), /from=2026-09-01/);
  assert.match(buildFinanceParams({ tourOperator: "Alpha", from: "", to: "2026-09-30" }, sort, 0, 25).toString(), /to=2026-09-30/);
  const params = buildFinanceParams({ tourOperator: "Alpha", from: "2026-09-01", to: "2026-09-30" }, sort, 1, 50);
  assert.equal(params.get("page"), "2");
  assert.equal(params.get("pageSize"), "50");
});

test("Finance search rejects an invalid date range", () => {
  assert.equal(validateFinanceFilters({ tourOperator: "Alpha", from: "2026-09-30", to: "2026-09-01" }), "Date From cannot be later than Date To.");
});

test("clearing Finance search restores every filter to its empty state", () => {
  assert.deepEqual(EMPTY_FINANCE_FILTERS, { tourOperator: "", from: "", to: "" });
});

test("PDF and Excel exports use the active filters, never a visible-page subset", () => {
  const query = buildFinanceExportQuery({ tourOperator: "Alpha", from: "2026-09-01", to: "2026-09-30" }, { by: "PAYMENT", dir: "asc" });
  assert.deepEqual(query, { tourOperator: "Alpha", from: "2026-09-01", to: "2026-09-30", sortBy: "PAYMENT", sortDir: "asc" });
  assert.equal(Object.hasOwn(query, "page"), false);
  assert.equal(Object.hasOwn(query, "pageSize"), false);
});

test("Finance result helpers format dates and euro amounts", () => {
  assert.equal(displayFinanceDate("2026-09-18"), "18-09-2026");
  assert.match(formatFinanceEuro("100.50"), /100\.50/);
  assert.match(formatFinanceEuro("0"), /0\.00/);
});
