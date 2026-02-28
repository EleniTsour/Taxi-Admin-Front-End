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
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import LocalTaxiIcon from "@mui/icons-material/LocalTaxi";
import SaveIcon from "@mui/icons-material/Save";
import ClearIcon from "@mui/icons-material/Clear";
import CalculateIcon from "@mui/icons-material/Calculate";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import dayjs from "dayjs";
import { API_BASE, authFetch } from "../lib/authApi.js";

function toApiDate(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return raw;

  const european = raw.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
  if (!european) return null;

  const dd = Number(european[1]);
  const mm = Number(european[2]);
  const yyyy = Number(european[3]);
  const date = new Date(Date.UTC(yyyy, mm - 1, dd));
  const isValid = (
    date.getUTCFullYear() === yyyy &&
    date.getUTCMonth() === mm - 1 &&
    date.getUTCDate() === dd
  );
  if (!isValid) return null;

  return `${String(yyyy).padStart(4, "0")}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

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
  DRIVER: "",
  DRIVER_PRICE: "",
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

function LabeledDatePicker({ label, value, onChange }) {
  return (
    <FormControl fullWidth>
      <FormLabel sx={{ fontSize: 12, mb: 0.5, color: "text.primary" }}>
        {label}
      </FormLabel>
      <DatePicker
        format="DD-MM-YYYY"
        value={value ? dayjs(value) : null}
        onChange={(newValue) => onChange(newValue && newValue.isValid() ? newValue.format("YYYY-MM-DD") : "")}
        slotProps={{
          textField: {
            size: "small",
            margin: "dense",
            placeholder: label,
            helperText: " ",
            FormHelperTextProps: { sx: { m: 0, mt: 0.5, whiteSpace: "normal" } },
            InputProps: { sx: { borderRadius: 1 } },
          },
        }}
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
        renderOption={(props, option) => {
          const { key, ...optionProps } = props;
          return (
            <li key={key} {...optionProps} style={{ whiteSpace: "normal", alignItems: "flex-start" }}>
              <span style={{ display: "block", lineHeight: 1.25 }}>{option}</span>
            </li>
          );
        }}
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
  const [driverOptionsError, setDriverOptionsError] = useState("");
  const [priceRows, setPriceRows] = useState([]);
  const [driverOptions, setDriverOptions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);

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

    async function loadOptions() {
      try {
        setPricesError("");
        setDriverOptionsError("");

        const res = await authFetch(`${API_BASE}/prices`);
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

      try {
        const res = await authFetch(`${API_BASE}/rides/options`);
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          const detail = body?.detail || body?.error || `Could not load drivers (${res.status})`;
          throw new Error(detail);
        }

        const rowsFromApi = Array.isArray(body?.drivers) ? body.drivers : [];
        if (!isMounted) return;
        setDriverOptions(
          [...new Set(
            rowsFromApi.map((d) => String(d ?? "").trim()).filter(Boolean),
          )].sort((a, b) => a.localeCompare(b)),
        );
      } catch (err) {
        if (!isMounted) return;
        setDriverOptions([]);
        setDriverOptionsError(`Could not load driver options: ${err.message}`);
      }
    }

    loadOptions();
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

    const required = ["THE_DATE", "FROM", "TO"];
    const missing = required.filter((k) => !String(form[k] ?? "").trim());

    if (missing.length) {
      setError("Missing required fields: THE_DATE, FROM, TO.");
      return;
    }

    const apiDate = toApiDate(form.THE_DATE);
    if (!apiDate) {
      setError("Date is invalid.");
      return;
    }

    try {
      setIsSaving(true);

      const res = await authFetch(`${API_BASE}/rides`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          THE_DATE: apiDate,
          ADULT: normalizeDecimalForApi(form.ADULT),
          PRICE: normalizeDecimalForApi(form.PRICE),
          DRIVER_PRICE: normalizeDecimalForApi(form.DRIVER_PRICE),
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
          const pdfRes = await authFetch(`${API_BASE}/pdf/voucher`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(savedRide),
          });
          await openPdfResponse(pdfRes);
        } catch (pdfErr) {
          setError(`Ride saved, but PDF failed: ${pdfErr.message}`);
        }
      }

      setForm(EMPTY_FORM);
      setFormResetKey((k) => k + 1);
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
    setFormResetKey((k) => k + 1);
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
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
      {driverOptionsError ? <Alert severity="warning" sx={{ mb: 1.25 }}>{driverOptionsError}</Alert> : null}

      <Box key={formResetKey} component="form" onSubmit={handleSubmit}>
        <Stack spacing={1.25}>
          <Section title="Schedule">
            <Grid container spacing={1.25}>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <LabeledDatePicker
                  label="Date"
                  value={form.THE_DATE}
                  onChange={(v) => setField("THE_DATE", v)}
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

          <Section title="Driver">
            <Grid container spacing={1.25}>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <LabeledAutocomplete
                  label="Driver"
                  options={driverOptions}
                  value={form.DRIVER}
                  onChange={(v) => setField("DRIVER", v)}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <LabeledTextField
                  label="Driver Price"
                  value={form.DRIVER_PRICE}
                  onChange={(e) => setDecimalField("DRIVER_PRICE", e.target.value)}
                  inputMode="decimal"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">€</InputAdornment>,
                  }}
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
            <Stack
              direction={{ xs: "column", sm: "row" }}
              gap={1}
              justifyContent="flex-end"
              alignItems={{ xs: "stretch", sm: "center" }}
              flexWrap="wrap"
            >
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
                sx={{
                  width: { xs: "100%", sm: 140 },
                  minHeight: 30,
                  px: 2.5,
                  fontSize: "0.98rem",
                  fontWeight: 700,
                }}
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
    </LocalizationProvider>
  );
}

