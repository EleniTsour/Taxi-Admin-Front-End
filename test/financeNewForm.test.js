import assert from "node:assert/strict";
import test from "node:test";
import {
  EMPTY_FINANCE_FORM,
  createFinanceEntry,
  getTourOperatorOptions,
  normalizeMoneyInput,
  toFinancePayload,
  validateFinanceForm,
} from "../src/pages/financeNewForm.js";

const validForm = { tourOperator: "Alpha Tours", date: "2026-09-18", charge: "100.50", payment: "0", notes: "Invoice" };

test("requires Tour Operator and Date, while allowing blank money fields", () => {
  assert.equal(validateFinanceForm(EMPTY_FINANCE_FORM), "Missing required fields: Tour Operator, Date.");
});

test("loads and orders Tour Operator options from the shared prices data", () => {
  assert.deepEqual(getTourOperatorOptions([
    { tour: "Bravo Tours" }, { tour: "Alpha Tours" }, { tour: "Alpha Tours" }, { tour: "" },
  ]), ["Alpha Tours", "Bravo Tours"]);
});

test("accepts numeric euro input and rejects invalid or negative input", () => {
  assert.equal(normalizeMoneyInput("100,50"), "100,50");
  assert.equal(normalizeMoneyInput("-1"), null);
  assert.equal(normalizeMoneyInput("abc"), null);
  assert.match(validateFinanceForm({ ...validForm, charge: "12.345" }), /Charge must be a non-negative euro amount/);
});

test("accepts zero amounts and normalizes decimal commas for the API", () => {
  assert.deepEqual(toFinancePayload({ ...validForm, charge: "0", payment: "0,00" }), {
    tourOperator: "Alpha Tours", date: "2026-09-18", charge: "0", payment: "0.00", notes: "Invoice",
  });
});

test("defaults omitted Charge and Payment to 0.00 for the API", () => {
  assert.deepEqual(toFinancePayload({ ...validForm, charge: "", payment: "" }), {
    tourOperator: "Alpha Tours", date: "2026-09-18", charge: "0.00", payment: "0.00", notes: "Invoice",
  });
});

test("creates a Finance entry with the expected payload", async () => {
  let request;
  const result = await createFinanceEntry({
    apiBase: "http://api.test",
    form: validForm,
    authFetchFn: async (url, options) => {
      request = { url, options };
      return new Response(JSON.stringify({ ok: true, id: 42 }), { status: 201 });
    },
  });
  assert.equal(request.url, "http://api.test/finance");
  assert.equal(request.options.method, "POST");
  assert.deepEqual(JSON.parse(request.options.body), toFinancePayload(validForm));
  assert.equal(result.id, 42);
});

test("surfaces a failed Finance create response", async () => {
  await assert.rejects(
    createFinanceEntry({
      apiBase: "http://api.test",
      form: validForm,
      authFetchFn: async () => new Response(JSON.stringify({ error: "Tour Operator does not exist." }), { status: 400 }),
    }),
    /Tour Operator does not exist/,
  );
});
