export const EMPTY_FINANCE_FORM = {
  tourOperator: "",
  date: "",
  charge: "",
  payment: "",
  notes: "",
};

const MONEY_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;

export function normalizeMoneyInput(value) {
  const normalized = String(value ?? "").replace(/\s/g, "");
  return /^\d*(?:[.,]\d*)?$/.test(normalized) ? normalized : null;
}

export function getTourOperatorOptions(priceRows) {
  return [...new Set(
    (Array.isArray(priceRows) ? priceRows : [])
      .map((row) => String(row?.tour ?? "").trim())
      .filter(Boolean),
  )].sort((left, right) => left.localeCompare(right));
}

export function validateFinanceForm(form) {
  const required = [
    ["tourOperator", "Tour Operator"],
    ["date", "Date"],
  ];
  const missing = required.filter(([key]) => !String(form?.[key] ?? "").trim()).map(([, label]) => label);
  if (missing.length) return `Missing required fields: ${missing.join(", ")}.`;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(form.date))) return "Date is invalid.";
  for (const [key, label] of [["charge", "Charge"], ["payment", "Payment"]]) {
    const amount = String(form[key] ?? "").trim().replace(",", ".");
    if (!amount) continue;
    if (!MONEY_PATTERN.test(amount)) return `${label} must be a non-negative euro amount with up to two decimal places.`;
  }
  return null;
}

export function toFinancePayload(form) {
  const error = validateFinanceForm(form);
  if (error) throw new Error(error);
  return {
    tourOperator: String(form.tourOperator).trim(),
    date: String(form.date),
    charge: String(form.charge ?? "").trim().replace(",", ".") || "0.00",
    payment: String(form.payment ?? "").trim().replace(",", ".") || "0.00",
    notes: String(form.notes ?? "").trim(),
  };
}

export async function createFinanceEntry({ authFetchFn, apiBase, form }) {
  const response = await authFetchFn(`${apiBase}/finance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toFinancePayload(form)),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.detail || body?.error || `Save failed (${response.status})`);
  return body;
}
