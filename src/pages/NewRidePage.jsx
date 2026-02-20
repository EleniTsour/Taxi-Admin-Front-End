// src/pages/NewRidePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
  Popper,
  Tooltip,
  FormControl,
  FormLabel,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import LocalTaxiIcon from "@mui/icons-material/LocalTaxi";
import SaveIcon from "@mui/icons-material/Save";
import ClearIcon from "@mui/icons-material/Clear";
import CalculateIcon from "@mui/icons-material/Calculate";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

const TYPE_OPTIONS = ["ARRIVAL", "DEPARTURE", "TRANSFER", "TOUR", "TOUR + BETWEEN"]; // your real 4
const EMPTY_FORM = {
  THE_DATE: "",
  TIME: "",
  TYPE: "",
  FROM: "",
  TO: "",
  "HOTEL NAME": "",
  AREA: "",
  FLY_CODE: "",
  FLY_COMPANY: "",
  EMAIL: "",
  THE_NAME: "",
  PAX: "",
  ADULT: "",
  "CH/INF": "",
  INFO: "",
  TOUR_OPER: "",
  VCode: "",
  PRICE: "",
};

// Wider dropdown list so long options are readable
function WidePopper(props) {
  const { anchorEl, style } = props;
  const minWidth = anchorEl?.clientWidth ?? 280;
  const maxWidth = typeof window !== "undefined" ? window.innerWidth - 24 : 960;
  return (
    <Popper
      {...props}
      placement="bottom-start"
      style={{ ...style }}
      sx={{
        "& .MuiAutocomplete-paper": {
          minWidth,
          width: "max-content",
          maxWidth,
        },
        "& .MuiAutocomplete-listbox": {
          maxWidth,
        },
      }}
    />
  );
}

// Flat section wrapper (less rounded)
function Section({ title, subtitle, children }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 1.25, sm: 1.75 },
        borderRadius: 1,
        borderColor: (t) =>
          t.palette.mode === "dark" ? "rgba(163, 181, 204, 0.18)" : "rgba(172, 156, 136, 0.24)",
        backgroundColor: (t) =>
          t.palette.mode === "dark" ? t.palette.background.default : "#ffffff",
      }}
    >
      <Stack spacing={0.25} sx={{ mb: 1 }}>
        <Typography variant="subtitle2" fontWeight={800}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        ) : null}
      </Stack>
      <Divider sx={{ mb: 1.25 }} />
      {children}
    </Paper>
  );
}

// Label always ABOVE input (like your screenshot)
function LabeledTextField({ label, helperText, InputProps, ...props }) {
  return (
    <FormControl fullWidth>
      <FormLabel sx={{ fontSize: 12, mb: 0.5, color: "text.primary" }}>
        {label}
      </FormLabel>
      <TextField
        size="small"
        margin="dense"
        placeholder={label}
        helperText={helperText ?? " "}
        FormHelperTextProps={{ sx: { m: 0, mt: 0.5, whiteSpace: "normal" } }}
        InputProps={{
          sx: { borderRadius: 1 },
          ...InputProps,
        }}
        {...props}
      />
    </FormControl>
  );
}

// Label always ABOVE + dropdown that shows FULL selected value under field + tooltip
function LabeledAutocomplete({ label, options, value, onChange, required = false }) {
  const full = value || "";

  return (
    <FormControl fullWidth>
      <FormLabel sx={{ fontSize: 12, mb: 0.5, color: "text.primary" }}>
        {label}
      </FormLabel>

      <Autocomplete
        fullWidth
        freeSolo
        PopperComponent={WidePopper}
        options={options}
        value={value || null}
        onChange={(_, v) => onChange(typeof v === "string" ? v : (v ?? ""))}
        onInputChange={(_, inputValue, reason) => {
          if (reason === "input" || reason === "clear") {
            onChange(inputValue ?? "");
          }
        }}
        slotProps={{
          paper: { sx: { mt: 0.5 } },
        }}
        renderOption={(props, option) => (
          <li {...props} style={{ whiteSpace: "normal", alignItems: "flex-start" }}>
            <span style={{ display: "block", lineHeight: 1.25 }}>{option}</span>
          </li>
        )}
        renderInput={(params) => (
          <Tooltip title={full ? full : ""} placement="top" arrow disableHoverListener={!full}>
            <TextField
              {...params}
              required={required}
              size="small"
              margin="dense"
              placeholder={label}
              // prevents "..." and allows scroll for long selected values
              inputProps={{
                ...params.inputProps,
                style: {
                  overflowX: "auto",
                  textOverflow: "clip",
                  whiteSpace: "nowrap",
                },
              }}
              InputProps={{
                ...params.InputProps,
                sx: { borderRadius: 1 },
              }}
              helperText={full ? full : " "}
              FormHelperTextProps={{ sx: { m: 0, mt: 0.5, whiteSpace: "normal" } }}
            />
          </Tooltip>
        )}
      />
    </FormControl>
  );
}

export default function NewRidePage() {
  const [form, setForm] = useState(EMPTY_FORM);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [pricesError, setPricesError] = useState("");
  const [priceRows, setPriceRows] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setDecimalField(key, rawValue) {
    const value = String(rawValue ?? "").replace(/\s/g, "");
    if (/^\d*(?:[.,]\d*)?$/.test(value)) {
      setField(key, value);
    }
  }

  function normalizeDecimalForApi(value) {
    const v = String(value ?? "").trim();
    if (!v) return "";
    return v.replace(",", ".");
  }

  useEffect(() => {
    let isMounted = true;

    async function loadPricesTable() {
      try {
        setPricesError("");
        const res = await fetch(`${API_BASE}/prices`, { credentials: "include" });
        const body = await res.json().catch(() => []);
        if (!res.ok) {
          const detail = body?.detail || body?.error || `Could not load prices (${res.status})`;
          throw new Error(detail);
        }

        if (!isMounted) return;
        setPriceRows(Array.isArray(body) ? body : []);
      } catch (err) {
        if (!isMounted) return;
        setPriceRows([]);
        setPricesError(`Could not load pricing options: ${err.message}`);
      }
    }

    loadPricesTable();
    return () => {
      isMounted = false;
    };
  }, []);

  const destinationOptions = useMemo(
    () =>
      [...new Set(
        priceRows
          .map((r) => String(r?.destination ?? "").trim())
          .filter(Boolean),
      )].sort((a, b) => a.localeCompare(b)),
    [priceRows],
  );

  const tourOperOptions = useMemo(
    () =>
      [...new Set(
        priceRows
          .map((r) => String(r?.tour ?? "").trim())
          .filter(Boolean),
      )].sort((a, b) => a.localeCompare(b)),
    [priceRows],
  );

  // Price lookup by (Destination == TO) and (Tour == TOUR_OPER)
  const autoPrice = useMemo(() => {
    if (!form.TO || !form.TOUR_OPER) return "";
    const match = priceRows.find(
      (p) =>
        String(p.destination).trim().toUpperCase() === String(form.TO).trim().toUpperCase() &&
        String(p.tour).trim().toUpperCase() === String(form.TOUR_OPER).trim().toUpperCase()
    );
    return match ? String(match.price) : "";
  }, [form.TO, form.TOUR_OPER, priceRows]);

  // Auto-fill PRICE when TO / TOUR_OPER changes (still allow manual override)
  useEffect(() => {
    setForm((f) => ({ ...f, PRICE: autoPrice }));
  }, [autoPrice]);

  async function openPdfResponse(res) {
    if (!res.ok) {
      throw new Error(`Voucher request failed (${res.status})`);
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function saveRide({ printPdf }) {
    setSuccess("");
    setError("");

    const required = ["THE_DATE", "TIME", "FROM", "TO"];
    const missing = required.filter((k) => !String(form[k] ?? "").trim());

    if (missing.length) {
      setError("Missing required fields: THE_DATE, TIME, FROM, TO.");
      return;
    }

    try {
      setIsSaving(true);

      const res = await fetch(`${API_BASE}/rides`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          ADULT: normalizeDecimalForApi(form.ADULT),
          PRICE: normalizeDecimalForApi(form.PRICE),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = body?.detail || body?.error || `Save failed (${res.status})`;
        throw new Error(detail);
      }

      const newId = body?.id ?? null;
      const savedRide = { ...form, "A/A": newId };
      setSuccess(`Ride saved${newId ? ` (A/A ${newId})` : ""}.`);

      if (printPdf) {
        try {
          const pdfRes = await fetch(`${API_BASE}/pdf/voucher`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(savedRide),
          });
          await openPdfResponse(pdfRes);
        } catch (pdfErr) {
          setError(`Ride saved, but PDF failed: ${pdfErr.message}`);
        }
      }

      setForm(EMPTY_FORM);
    } catch (err) {
      setError(`Could not save ride: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await saveRide({ printPdf: false });
  }

  async function handleSaveAndPrint() {
    await saveRide({ printPdf: true });
  }

  function handleClear() {
    setSuccess("");
    setError("");
    setForm(EMPTY_FORM);
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 0, sm: 1 }, py: 1 }}>
      <Box sx={{ mb: 1.25 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <LocalTaxiIcon />
            <Typography variant="h6" fontWeight={900}>
              Add Ride
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip label="Smart price lookup" size="small" color="secondary" />
          </Stack>
        </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Price auto-calculates from To + Tour Operator, with manual override available.
      </Typography>
      </Box>

      {success ? <Alert severity="success" sx={{ mb: 1.25 }}>{success}</Alert> : null}
      {error ? <Alert severity="error" sx={{ mb: 1.25 }}>{error}</Alert> : null}
      {pricesError ? <Alert severity="warning" sx={{ mb: 1.25 }}>{pricesError}</Alert> : null}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={1.25}>
          <Section title="Schedule">
            <Grid container spacing={1.25}>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <LabeledTextField
                  label="Date"
                  type="date"
                  value={form.THE_DATE}
                  onChange={(e) => setField("THE_DATE", e.target.value)}
                />
              </Grid>

              <Grid size={{  xs: 12, sm: 6, md: 4, lg: 3 }}>
                <LabeledTextField
                  label="Time"
                  type="time"
                  value={form.TIME}
                  onChange={(e) => setField("TIME", e.target.value)}
                />
              </Grid>

              <Grid size={{  xs: 12, sm: 6, md: 4, lg: 3 }}>
                <LabeledAutocomplete
                  label="Type"
                  options={TYPE_OPTIONS}
                  value={form.TYPE}
                  
                  onChange={(v) => setField("TYPE", v)}
                />
              </Grid>
            </Grid>
          </Section>

          <Section title="Route">
            <Grid container spacing={1.25}>
              <Grid size={{  xs: 12, sm: 6, md: 4, lg: 3 }}>
                <LabeledAutocomplete
                  label="From"
                  options={destinationOptions}
                  value={form.FROM}
                  onChange={(v) => setField("FROM", v)}
                  required
                />
              </Grid>

              <Grid size={{  xs: 12, sm: 6, md: 4, lg: 3 }}>
                <LabeledAutocomplete
                  label="To"
                  options={destinationOptions}
                  value={form.TO}
                  onChange={(v) => setField("TO", v)}
                  required
                />
              </Grid>

              <Grid size={{  xs: 12, sm: 6, md: 4, lg: 3 }}>
                <LabeledAutocomplete
                  label="Tour Operator"
                  options={tourOperOptions}
                  value={form.TOUR_OPER}
                  onChange={(v) => setField("TOUR_OPER", v)}
                 
                />
              </Grid>

              <Grid size={{  xs: 12, sm: 6, md: 4, lg: 3 }}>
                <LabeledAutocomplete
                  label="Area"
                  options={destinationOptions}
                  value={form.AREA}
                  onChange={(v) => setField("AREA", v)}
                />
              </Grid>

              <Grid size={{  xs: 12, sm: 6, md: 4, lg: 3 }}>
                <LabeledTextField
                  label="Hotel Name"
                  value={form["HOTEL NAME"]}
                  onChange={(e) => setField("HOTEL NAME", e.target.value)}
                />
              </Grid>
            </Grid>
          </Section>

          <Section title="Flight">
            <Grid container spacing={1.25}>
              <Grid size={{  xs: 12, sm: 6, md: 4, lg: 3 }}>
                <LabeledTextField
                  label="Fly Code"
                  value={form.FLY_CODE}
                  onChange={(e) => setField("FLY_CODE", e.target.value)}
                />
              </Grid>

              <Grid size={{  xs: 12, sm: 6, md: 4, lg: 3 }}>
                <LabeledTextField
                  label="Fly Company"
                  value={form.FLY_COMPANY}
                  onChange={(e) => setField("FLY_COMPANY", e.target.value)}
                />
              </Grid>

              <Grid size={{  xs: 12, sm: 6, md: 4, lg: 3 }}>
                <LabeledTextField
                  label="V Code"
                  value={form.VCode}
                  onChange={(e) => setField("VCode", e.target.value)}
                />
              </Grid>

              <Grid size={{  xs: 12, sm: 6, md: 4, lg: 3 }}>
                <LabeledTextField
                  label="Email"
                  value={form.EMAIL}
                  onChange={(e) => setField("EMAIL", e.target.value)}
                />
              </Grid>
            </Grid>
          </Section>

          <Section title="Passenger & Price">
            <Grid container spacing={1.25}>
              <Grid size={{  xs: 12, sm: 6, md: 4, lg: 3 }}>
                <LabeledTextField
                  label="Customer Name"
                  value={form.THE_NAME}
                  onChange={(e) => setField("THE_NAME", e.target.value)}
                />
              </Grid>

              <Grid size={{  xs: 12, sm: 6, md: 4, lg: 3 }}>
                <LabeledTextField
                  label="Pax"
                  value={form.PAX}
                  onChange={(e) => setField("PAX", e.target.value)}
                />
              </Grid>

              <Grid size={{  xs: 12, sm: 6, md: 4, lg: 3 }}>
                <LabeledTextField
                  label="Adult"
                  value={form.ADULT}
                  onChange={(e) => setDecimalField("ADULT", e.target.value)}
                  inputMode="decimal"
                />
              </Grid>

              <Grid size={{  xs: 12, sm: 6, md: 4, lg: 3 }}>
                <LabeledTextField
                  label="Ch/Inf"
                  value={form["CH/INF"]}
                  onChange={(e) => setField("CH/INF", e.target.value)}
                />
              </Grid>

              <Grid size={{  xs: 12, sm: 6, md: 4, lg: 3 }}>
                <LabeledTextField
                  label="Price"
                  value={form.PRICE}
                  onChange={(e) => setDecimalField("PRICE", e.target.value)} // allow override
                  helperText={
                    form.TO && form.TOUR_OPER
                      ? (autoPrice ? "Auto price found from To + Tour Operator." : "No match in prices table for To + Tour Operator.")
                      : "Select To + Tour Operator to calculate Price."
                  }
                  inputMode="decimal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalculateIcon fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: <InputAdornment position="end">€</InputAdornment>,
                  }}
                />
              </Grid>

              <Grid size={{  xs: 12, sm: 6, md: 4, lg: 3 }}>
                <LabeledTextField
                  label="Info"
                  value={form.INFO}
                  onChange={(e) => setField("INFO", e.target.value)}
                  multiline
                  minRows={3}
                />
              </Grid>
            </Grid>
          </Section>

          {/* Flat action bar */}
          <Paper
            variant="outlined"
            sx={{
              p: 1,
              borderRadius: 1,
              position: { xs: "static", sm: "sticky" },
              bottom: { sm: 12 },
              bgcolor: (t) => (t.palette.mode === "dark" ? t.palette.background.default : "#ffffff"),
              borderColor: (t) =>
                t.palette.mode === "dark" ? "rgba(163, 181, 204, 0.18)" : "rgba(172, 156, 136, 0.24)",
            }}
          >
            <Stack direction={{ xs: "column", sm: "row" }} gap={1} justifyContent="flex-end" flexWrap="wrap">
              <Button variant="outlined" startIcon={<ClearIcon />} onClick={handleClear} sx={{ width: { xs: "100%", sm: "auto" } }}>
                Clear
              </Button>
              <Button
                type="button"
                variant="outlined"
                startIcon={<PictureAsPdfIcon />}
                onClick={handleSaveAndPrint}
                disabled={isSaving}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                Save & Print PDF
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={isSaving}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
              A/A is auto-increment in DB (not shown here).
            </Typography>
          </Paper>
        </Stack>
      </Box>
    </Box>
  );
}

