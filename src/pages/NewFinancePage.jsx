import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, Button, Divider, Grid, InputAdornment, Paper, Stack, Typography } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import SaveIcon from "@mui/icons-material/Save";
import ClearIcon from "@mui/icons-material/Clear";
import { useOutletContext } from "react-router-dom";
import { API_BASE, authFetch } from "../lib/authApi.js";
import { LabeledAutocomplete, LabeledDatePicker, LabeledTextField } from "../components/FormFields.jsx";
import {
  EMPTY_FINANCE_FORM,
  createFinanceEntry,
  getTourOperatorOptions,
  normalizeMoneyInput,
  validateFinanceForm,
} from "./financeNewForm.js";

function Section({ children }) {
  return <Paper variant="outlined" sx={{ p: { xs: 1.25, sm: 1.75 }, borderRadius: 1, borderColor: (t) => t.palette.mode === "dark" ? "rgba(163, 181, 204, 0.18)" : "rgba(172, 156, 136, 0.24)", backgroundColor: (t) => t.palette.mode === "dark" ? t.palette.background.default : "#ffffff" }}>{children}</Paper>;
}

export default function NewFinancePage() {
  const { isAuthenticated = false, priceOptionsVersion = 0 } = useOutletContext() ?? {};
  const [form, setForm] = useState(EMPTY_FINANCE_FORM);
  const [priceRows, setPriceRows] = useState([]);
  const [optionsError, setOptionsError] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let isMounted = true;
    async function loadTourOperators() {
      try {
        setOptionsError("");
        const response = await authFetch(`${API_BASE}/prices`);
        const body = await response.json().catch(() => []);
        if (!response.ok) throw new Error(body?.detail || body?.error || `Could not load prices (${response.status})`);
        if (isMounted) setPriceRows(Array.isArray(body) ? body : []);
      } catch (loadError) {
        if (isMounted) {
          setPriceRows([]);
          setOptionsError(`Could not load Tour Operators: ${loadError.message}`);
        }
      }
    }
    loadTourOperators();
    return () => { isMounted = false; };
  }, [isAuthenticated, priceOptionsVersion]);

  const tourOperatorOptions = useMemo(() => getTourOperatorOptions(priceRows), [priceRows]);
  function setField(key, value) { setForm((current) => ({ ...current, [key]: value })); }
  function setMoneyField(key, value) {
    const normalized = normalizeMoneyInput(value);
    if (normalized !== null) setField(key, normalized);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSaving || savingRef.current) return;
    setSuccess("");
    const validationError = validateFinanceForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      setError("");
      savingRef.current = true;
      setIsSaving(true);
      const result = await createFinanceEntry({ authFetchFn: authFetch, apiBase: API_BASE, form });
      setSuccess(`Finance entry saved${result?.id ? ` (A/A ${result.id})` : ""}.`);
      setForm(EMPTY_FINANCE_FORM);
    } catch (saveError) {
      setError(`Could not save Finance entry: ${saveError.message}`);
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  }

  return <LocalizationProvider dateAdapter={AdapterDayjs}><Box sx={{ maxWidth: 900, mx: "auto", px: { xs: 0, sm: 1 }, py: 1 }}>
    <Box sx={{ mb: 1.25 }}><Stack direction="row" spacing={1} alignItems="center"><AccountBalanceWalletIcon /><Typography variant="h6" fontWeight={900}>Add Finance Entry</Typography></Stack><Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Record a charge, payment, or both for a Tour Operator.</Typography></Box>
    {success ? <Alert severity="success" sx={{ mb: 1.25 }}>{success}</Alert> : null}
    {error ? <Alert severity="error" sx={{ mb: 1.25 }}>{error}</Alert> : null}
    {optionsError ? <Alert severity="warning" sx={{ mb: 1.25 }}>{optionsError}</Alert> : null}
    <Box component="form" onSubmit={handleSubmit} noValidate><Stack spacing={1.25}><Section><Stack spacing={0.25} sx={{ mb: 1 }}><Typography variant="subtitle2" fontWeight={800}>Finance details</Typography><Typography variant="caption" color="text.secondary">Fields marked required must be completed before saving.</Typography></Stack><Divider sx={{ mb: 1.25 }} /><Grid container spacing={1.25}>
      <Grid size={{ xs: 12, sm: 6 }}><LabeledAutocomplete label="Tour Operator" options={tourOperatorOptions} value={form.tourOperator} onChange={(value) => setField("tourOperator", value)} required freeSolo={false} /></Grid>
      <Grid size={{ xs: 12, sm: 6 }}><LabeledDatePicker label="Date" value={form.date} onChange={(value) => setField("date", value)} required /></Grid>
      <Grid size={{ xs: 12, sm: 6 }}><LabeledTextField label="Charge (€)" value={form.charge} onChange={(event) => setMoneyField("charge", event.target.value)} inputMode="decimal" helperText="Optional; defaults to 0.00. Use a non-negative amount, for example 100.50." InputProps={{ endAdornment: <InputAdornment position="end">€</InputAdornment> }} /></Grid>
      <Grid size={{ xs: 12, sm: 6 }}><LabeledTextField label="Payment (€)" value={form.payment} onChange={(event) => setMoneyField("payment", event.target.value)} inputMode="decimal" helperText="Optional; defaults to 0.00." InputProps={{ endAdornment: <InputAdornment position="end">€</InputAdornment> }} /></Grid>
      <Grid size={{ xs: 12 }}><LabeledTextField label="Notes" value={form.notes} onChange={(event) => setField("notes", event.target.value)} multiline minRows={3} helperText="Optional." /></Grid>
    </Grid></Section><Paper variant="outlined" sx={{ p: 1, borderRadius: 1, position: { xs: "static", sm: "sticky" }, bottom: { sm: 12 }, bgcolor: (t) => t.palette.mode === "dark" ? t.palette.background.default : "#ffffff", borderColor: (t) => t.palette.mode === "dark" ? "rgba(163, 181, 204, 0.18)" : "rgba(172, 156, 136, 0.24)" }}><Stack direction={{ xs: "column", sm: "row" }} gap={1} justifyContent="flex-end"><Button variant="outlined" startIcon={<ClearIcon />} onClick={() => { setForm(EMPTY_FINANCE_FORM); setError(""); setSuccess(""); }} disabled={isSaving}>Clear</Button><Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</Button></Stack></Paper></Stack></Box>
  </Box></LocalizationProvider>;
}
