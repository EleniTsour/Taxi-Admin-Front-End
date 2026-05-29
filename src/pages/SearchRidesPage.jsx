// src/pages/SearchRidesPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  TableSortLabel,
  Stack,
  Popper,
  Alert,
  Tooltip,
  FormControl,
  FormLabel,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useOutletContext } from "react-router-dom";
import dayjs from "dayjs";
import SearchIcon from "@mui/icons-material/Search";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import EmailIcon from "@mui/icons-material/Email";
import ClearIcon from "@mui/icons-material/Clear";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { API_BASE, authFetch } from "../lib/authApi.js";

function toDisplayDate(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const european = raw.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
  if (european) return `${european[1]}-${european[2]}-${european[3]}`;

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}-${iso[2]}-${iso[1]}`;

  return raw;
}

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

function toDateInputValue(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const european = raw.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
  if (european) return `${european[3]}-${european[2]}-${european[1]}`;

  return "";
}

// Wider dropdown list so long values are readable
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
function Section({ title, children }) {
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
      <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Divider sx={{ mb: 1.25 }} />
      {children}
    </Paper>
  );
}

// Label always ABOVE input
function LabeledTextField({ label, helperText, ...props }) {
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
        InputProps={{ sx: { borderRadius: 1 } }}
        {...props}
      />
    </FormControl>
  );
}

function LabeledDatePicker({ label, value, onChange }) {
  const isoValue = toDateInputValue(value);
  return (
    <FormControl fullWidth>
      <FormLabel sx={{ fontSize: 12, mb: 0.5, color: "text.primary" }}>
        {label}
      </FormLabel>
      <DatePicker
        format="DD-MM-YYYY"
        value={isoValue ? dayjs(isoValue) : null}
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

// Label always ABOVE + dropdown showing full selected value under field + tooltip
function LabeledAutocomplete({ label, options, value, onChange }) {
  const full = value || "";

  return (
    <FormControl fullWidth>
      <FormLabel sx={{ fontSize: 12, mb: 0.5, color: "text.primary" }}>
        {label}
      </FormLabel>

      <Autocomplete
        fullWidth
        PopperComponent={WidePopper}
        options={options}
        value={value || null}
        onChange={(_, v) => onChange(v ?? "")}
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
              size="small"
              margin="dense"
              placeholder={label}
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

export default function SearchRidesPage() {
  const { priceOptionsVersion = 0 } = useOutletContext() ?? {};
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    TOUR_OPER: "",
    DRIVER: "",
  });

  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [pdfExportJob, setPdfExportJob] = useState(null);
  const [excelExportJob, setExcelExportJob] = useState(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [totalRows, setTotalRows] = useState(0);
  const [editingAA, setEditingAA] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [isSavingRow, setIsSavingRow] = useState(false);
  const [isDeletingRow, setIsDeletingRow] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [infoMsg, setInfoMsg] = useState("");
  const [optionsError, setOptionsError] = useState("");
  const [tourOperOptions, setTourOperOptions] = useState([]);
  const [driverOptions, setDriverOptions] = useState([]);
  const [destinationOptions, setDestinationOptions] = useState([]);
  const [sort, setSort] = useState({ by: "THE_DATE", dir: "desc" });
  const [activeFilters, setActiveFilters] = useState({
    fromDate: "",
    toDate: "",
    TOUR_OPER: "",
    DRIVER: "",
  });
  const [activeSort, setActiveSort] = useState({ by: "THE_DATE", dir: "desc" });
  const [selectedAA, setSelectedAA] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadFilterOptions() {
      const errors = [];
      setOptionsError("");

      try {
        const res = await authFetch(`${API_BASE}/prices`);
        const body = await res.json().catch(() => []);
        if (!res.ok) {
          const detail = body?.detail || body?.error || `Could not load prices (${res.status})`;
          throw new Error(detail);
        }

        const rowsFromApi = Array.isArray(body) ? body : [];
        const uniqueTours = [...new Set(
          rowsFromApi
            .map((r) => String(r?.tour ?? "").trim())
            .filter(Boolean),
        )].sort((a, b) => a.localeCompare(b));
        const uniqueDestinations = [...new Set(
          rowsFromApi
            .map((r) => String(r?.destination ?? "").trim())
            .filter(Boolean),
        )].sort((a, b) => a.localeCompare(b));

        if (!isMounted) return;
        setTourOperOptions(uniqueTours);
        setDestinationOptions(uniqueDestinations);
      } catch (err) {
        if (!isMounted) return;
        setTourOperOptions([]);
        setDestinationOptions([]);
        errors.push(`Tour Operator options: ${err.message}`);
      }

      try {
        const res = await authFetch(`${API_BASE}/rides/options`);
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          const detail = body?.detail || body?.error || `Could not load drivers (${res.status})`;
          throw new Error(detail);
        }

        const nextDrivers = Array.isArray(body?.drivers)
          ? body.drivers.map((d) => String(d ?? "").trim()).filter(Boolean)
          : [];
        if (!isMounted) return;
        setDriverOptions([...new Set(nextDrivers)].sort((a, b) => a.localeCompare(b)));
      } catch (err) {
        if (!isMounted) return;
        setDriverOptions([]);
        errors.push(`Driver options: ${err.message}`);
      }

      if (!isMounted) return;
      setOptionsError(errors.join(" | "));
    }

    loadFilterOptions();
    return () => {
      isMounted = false;
    };
  }, [priceOptionsVersion]);

  const totals = useMemo(() => {
    const count = totalRows;
    const sum = rows.reduce((acc, r) => acc + Number(r.PRICE ?? 0), 0);
    const sumFormatted = sum.toFixed(2);
    return { count, sum, sumFormatted };
  }, [rows, totalRows]);

  const selectedRide = useMemo(() => {
    if (rows.length === 0) return null;
    if (selectedAA == null) return rows[0];
    return rows.find((r) => r["A/A"] === selectedAA) ?? rows[0];
  }, [rows, selectedAA]);

  async function fetchRides(nextPage, nextPageSize, filtersForQuery, sortForQuery) {
    const params = buildRideSearchParams(filtersForQuery, sortForQuery);
    if (!params) return;
    params.set("page", String(nextPage + 1));
    params.set("pageSize", String(nextPageSize));

    const url = `${API_BASE}/rides/search?${params.toString()}`;

    setIsLoading(true);
    try {
      const res = await authFetch(url);
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        const detail = body?.detail || body?.error || `Search request failed (${res.status})`;
        throw new Error(detail);
      }

      const nextRows = Array.isArray(body) ? body : (Array.isArray(body?.rows) ? body.rows : []);
      const nextTotal = Array.isArray(body) ? nextRows.length : Number(body?.total ?? nextRows.length);

      setRows(nextRows);
      setTotalRows(nextTotal);
      setEditingAA(null);
      setEditDraft(null);
      setInfoMsg(`Loaded ${nextRows.length} ride(s) on this page. Total matches: ${nextTotal}.`);
    } catch (err) {
      setInfoMsg(`Could not load rides: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSearch() {
    setInfoMsg("");
    if (!buildRideSearchParams(filters, sort)) return;

    setSelectedAA(null);
    setPage(0);
    setActiveFilters(filters);
    setActiveSort(sort);
    await fetchRides(0, pageSize, filters, sort);
  }

  async function handleChangePage(_, nextPage) {
    setPage(nextPage);
    setSelectedAA(null);
    await fetchRides(nextPage, pageSize, activeFilters, activeSort);
  }

  async function handleChangeRowsPerPage(event) {
    const nextPageSize = Number(event.target.value || 50);
    setPageSize(nextPageSize);
    setPage(0);
    setSelectedAA(null);
    await fetchRides(0, nextPageSize, activeFilters, activeSort);
  }

  async function handleSort(field) {
    const nextSort = (
      activeSort.by === field && activeSort.dir === "asc"
        ? { by: field, dir: "desc" }
        : { by: field, dir: "asc" }
    );
    setSort(nextSort);
    setActiveSort(nextSort);
    setPage(0);
    setSelectedAA(null);
    await fetchRides(0, pageSize, activeFilters, nextSort);
  }

  function handleClear() {
    setInfoMsg("");
    setRows([]);
    setTotalRows(0);
    setPage(0);
    setSelectedAA(null);
    setEditingAA(null);
    setEditDraft(null);
    const clearedFilters = { fromDate: "", toDate: "", TOUR_OPER: "", DRIVER: "" };
    const defaultSort = { by: "THE_DATE", dir: "desc" };
    setActiveFilters(clearedFilters);
    setFilters(clearedFilters);
    setSort(defaultSort);
    setActiveSort(defaultSort);
  }

  function startEdit(row) {
    setEditingAA(row["A/A"]);
    setEditDraft({ ...row, THE_DATE: toDateInputValue(row.THE_DATE) });
  }

  function cancelEdit() {
    setEditingAA(null);
    setEditDraft(null);
  }

  function updateDraftField(key, value) {
    if ((key === "ADULT" || key === "PRICE" || key === "DRIVER_PRICE")) {
      const normalized = String(value ?? "").replace(/\s/g, "");
      if (!/^\d*(?:[.,]\d*)?$/.test(normalized)) return;
      setEditDraft((prev) => ({ ...(prev ?? {}), [key]: normalized }));
      return;
    }

    setEditDraft((prev) => ({ ...(prev ?? {}), [key]: value }));
  }

  function toTimeInputValue(value) {
    const raw = String(value ?? "");
    if (!raw) return "";
    const m = raw.match(/^(\d{2}:\d{2})/);
    return m ? m[1] : raw;
  }

  async function saveRow(rowId) {
    if (!editDraft) return;

    setInfoMsg("");
    setIsSavingRow(true);
    try {
      const payload = { ...editDraft };
      delete payload["A/A"];
      if (payload.THE_DATE) {
        const apiDate = toApiDate(payload.THE_DATE);
        if (!apiDate) {
          throw new Error("Date is invalid.");
        }
        payload.THE_DATE = apiDate;
      }

      const res = await authFetch(`${API_BASE}/rides/${encodeURIComponent(rowId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = body?.detail || body?.error || `Update failed (${res.status})`;
        throw new Error(detail);
      }

      setRows((prev) => prev.map((r) => (
        r["A/A"] === rowId
          ? { ...r, ...payload, "A/A": rowId }
          : r
      )));
      setInfoMsg(`Ride A/A ${rowId} updated.`);
      setEditingAA(null);
      setEditDraft(null);
    } catch (err) {
      setInfoMsg(`Could not update ride: ${err.message}`);
    } finally {
      setIsSavingRow(false);
    }
  }

  function renderCell(row, key, align = "left", extraSx = {}) {
    const isEditing = editingAA === row["A/A"];
    if (!isEditing) {
      return (
        <TableCell align={align} sx={extraSx}>
          {key === "THE_DATE" ? toDisplayDate(row[key]) : row[key]}
        </TableCell>
      );
    }

    if (key === "THE_DATE") {
      return (
        <TableCell align={align} sx={extraSx}>
          <DatePicker
            format="DD-MM-YYYY"
            value={toDateInputValue(editDraft?.[key]) ? dayjs(toDateInputValue(editDraft?.[key])) : null}
            onChange={(newValue) => updateDraftField(key, newValue && newValue.isValid() ? newValue.format("YYYY-MM-DD") : "")}
            slotProps={{
              textField: {
                size: "small",
                sx: { minWidth: 140 },
              },
            }}
          />
        </TableCell>
      );
    }

    if (key === "TIME") {
      return (
        <TableCell align={align} sx={extraSx}>
          <TextField
            size="small"
            type="time"
            value={toTimeInputValue(editDraft?.[key])}
            onChange={(e) => updateDraftField(key, e.target.value)}
            sx={{ minWidth: 110 }}
          />
        </TableCell>
      );
    }

    if (key === "FROM" || key === "TO" || key === "AREA") {
      const currentValue = String(editDraft?.[key] ?? "").trim();
      const options = currentValue && !destinationOptions.includes(currentValue)
        ? [currentValue, ...destinationOptions]
        : destinationOptions;

      return (
        <TableCell align={align} sx={extraSx}>
          <TextField
            select
            size="small"
            value={editDraft?.[key] ?? ""}
            onChange={(e) => updateDraftField(key, e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">-</MenuItem>
            {options.map((opt) => (
              <MenuItem key={`${key}-${opt}`} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </TextField>
        </TableCell>
      );
    }

    return (
      <TableCell align={align} sx={extraSx}>
        <TextField
          size="small"
          value={editDraft?.[key] ?? ""}
          onChange={(e) => updateDraftField(key, e.target.value)}
          inputMode={key === "ADULT" || key === "PRICE" || key === "DRIVER_PRICE" ? "decimal" : undefined}
          sx={{ minWidth: 96 }}
        />
      </TableCell>
    );
  }

  function requestDeleteRow(row) {
    setDeleteTarget(row);
  }

  function closeDeleteDialog() {
    if (isDeletingRow) return;
    setDeleteTarget(null);
  }

  async function confirmDeleteRow() {
    if (!deleteTarget) return;

    const rowId = deleteTarget["A/A"];
    setInfoMsg("");
    setIsDeletingRow(true);
    try {
      const res = await authFetch(`${API_BASE}/rides/${encodeURIComponent(rowId)}`, {
        method: "DELETE",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = body?.detail || body?.error || `Delete failed (${res.status})`;
        throw new Error(detail);
      }

      setDeleteTarget(null);
      const wasEditingDeleted = editingAA === rowId;
      setEditingAA((prev) => (prev === rowId ? null : prev));
      if (wasEditingDeleted) {
        setEditDraft(null);
      }
      setSelectedAA((prev) => (prev === rowId ? null : prev));

      const nextTotal = Math.max(0, totalRows - 1);
      if (rows.length === 1 && page > 0 && nextTotal > 0) {
        const nextPage = page - 1;
        setPage(nextPage);
        await fetchRides(nextPage, pageSize, activeFilters, activeSort);
      } else {
        setRows((prev) => prev.filter((r) => r["A/A"] !== rowId));
        setTotalRows(nextTotal);
      }

      setInfoMsg(`Ride A/A ${rowId} deleted.`);
    } catch (err) {
      setInfoMsg(`Could not delete ride: ${err.message}`);
    } finally {
      setIsDeletingRow(false);
    }
  }

  async function openPdfResponse(res) {
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const detail = body?.detail || body?.error || `Voucher request failed (${res.status})`;
      throw new Error(detail);
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function handlePdfSingle(ride = selectedRide) {
    setInfoMsg("");

    if (!ride) {
      setInfoMsg("Run a search first and select a row.");
      return;
    }

    try {
      const res = await authFetch(`${API_BASE}/pdf/voucher`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ride),
      });
      await openPdfResponse(res);
      setInfoMsg(`Voucher generated for A/A ${ride["A/A"] ?? "-"}.`);
    } catch (err) {
      setInfoMsg(`Could not generate voucher PDF: ${err.message}`);
    }
  }

  async function handlePdfAll() {
    setInfoMsg("");
    if (totalRows === 0) {
      setInfoMsg("Run a search first and make sure there are rows to print.");
      return;
    }

    setIsExportingPdf(true);
    try {
      const createdJob = await createExportJob("pdf");
      if (!createdJob) return;
      setPdfExportJob(createdJob);
      setInfoMsg(`Your PDF export is being prepared${createdJob.resultCount ? ` (${createdJob.resultCount} rides)` : ""}.`);

      const finalJob = await pollExportJob(createdJob.id, "pdf", setPdfExportJob);
      if (finalJob.status === "failed") {
        throw new Error(finalJob.errorMessage || "PDF export failed.");
      }

      const res = await authFetch(`${API_BASE}/exports/${encodeURIComponent(finalJob.id)}/download`);
      await openPdfResponse(res);
      setInfoMsg("Combined PDF generated for the current filtered result set.");
    } catch (err) {
      setInfoMsg(`Could not generate combined PDF: ${err.message}`);
    } finally {
      setIsExportingPdf(false);
    }
  }

  async function handleEmailPdf(ride = selectedRide) {
    setInfoMsg("");
    if (!ride) {
      setInfoMsg("Run a search first and select a row.");
      return;
    }

    const defaultEmail = String(ride.EMAIL ?? "").trim();
    const to = window.prompt("Recipient email", defaultEmail);
    if (to == null) return;
    const recipient = to.trim();
    if (!recipient) {
      setInfoMsg("Recipient email is required.");
      return;
    }
    const includeCalendar = window.confirm("Attach a calendar invite (.ics) to this email?");

    try {
      const res = await authFetch(`${API_BASE}/pdf/voucher-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ride,
          to: recipient,
          includeCalendar,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = body?.detail || body?.error || `Email request failed (${res.status})`;
        throw new Error(detail);
      }

      setInfoMsg(includeCalendar
        ? `Voucher and calendar invite emailed to ${recipient}.`
        : `Voucher emailed to ${recipient}.`);
    } catch (err) {
      setInfoMsg(`Could not send voucher email: ${err.message}`);
    }
  }

  async function handleExportExcel() {
    setInfoMsg("");
    if (totalRows === 0) {
      setInfoMsg("Run a search first and make sure there are rows to export.");
      return;
    }

    setIsExportingExcel(true);
    try {
      const createdJob = await createExportJob("excel");
      if (!createdJob) return;
      setExcelExportJob(createdJob);
      setInfoMsg(`Your Excel export is being prepared${createdJob.resultCount ? ` (${createdJob.resultCount} rides)` : ""}.`);

      const finalJob = await pollExportJob(createdJob.id, "excel", setExcelExportJob);
      if (finalJob.status === "failed") {
        throw new Error(finalJob.errorMessage || "Excel export failed.");
      }

      const res = await authFetch(`${API_BASE}/exports/${encodeURIComponent(finalJob.id)}/download`);
      await downloadFileResponse(res, `rides_report_${new Date().toISOString().slice(0, 10)}.xls`);
      setInfoMsg("Excel export generated for the current filtered result set.");
    } catch (err) {
      setInfoMsg(`Could not export Excel: ${err.message}`);
    } finally {
      setIsExportingExcel(false);
    }
  }

  function buildRideSearchQuery(filtersForQuery, sortForQuery) {
    const fromApi = filtersForQuery.fromDate ? toApiDate(filtersForQuery.fromDate) : "";
    const toApi = filtersForQuery.toDate ? toApiDate(filtersForQuery.toDate) : "";
    if (filtersForQuery.fromDate && !fromApi) {
      setInfoMsg("From Date is invalid.");
      return null;
    }
    if (filtersForQuery.toDate && !toApi) {
      setInfoMsg("To Date is invalid.");
      return null;
    }

    const query = {};
    if (fromApi) query.from = fromApi;
    if (toApi) query.to = toApi;
    if (filtersForQuery.TOUR_OPER) query.tour_oper = filtersForQuery.TOUR_OPER;
    if (filtersForQuery.DRIVER) query.driver = filtersForQuery.DRIVER;
    query.sortBy = sortForQuery.by;
    query.sortDir = sortForQuery.dir;
    return query;
  }

  function buildRideSearchParams(filtersForQuery, sortForQuery) {
    const query = buildRideSearchQuery(filtersForQuery, sortForQuery);
    if (!query) return null;
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      params.set(key, String(value));
    });
    return params;
  }

  async function createExportJob(type) {
    const query = buildRideSearchQuery(activeFilters, activeSort);
    if (!query) return null;

    const res = await authFetch(`${API_BASE}/exports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, query }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail = body?.detail || body?.error || `Export request failed (${res.status})`;
      throw new Error(detail);
    }
    return body;
  }

  async function pollExportJob(jobId, type, setJobState) {
    for (;;) {
      const res = await authFetch(`${API_BASE}/exports/${encodeURIComponent(jobId)}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = body?.detail || body?.error || `Could not check export status (${res.status})`;
        throw new Error(detail);
      }

      setJobState(body);
      if (body.status === "completed" || body.status === "failed") {
        return body;
      }

      setInfoMsg(
        body.status === "processing"
          ? `Your ${type === "pdf" ? "PDF" : "Excel"} export is being prepared.`
          : `Your ${type === "pdf" ? "PDF" : "Excel"} export is queued.`
      );
      await new Promise((resolve) => window.setTimeout(resolve, 2000));
    }
  }

  async function downloadFileResponse(res, fallbackFilename) {
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const detail = body?.detail || body?.error || `Export request failed (${res.status})`;
      throw new Error(detail);
    }

    const blob = await res.blob();
    const header = String(res.headers.get("Content-Disposition") ?? "");
    const utf8Name = header.match(/filename\*=UTF-8''([^;]+)/i);
    const asciiName = header.match(/filename=\"?([^\";]+)\"?/i);
    const filename = utf8Name
      ? decodeURIComponent(utf8Name[1])
      : (asciiName?.[1] || fallbackFilename);

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  function renderSortableHeader(label, field, align = "left") {
    const sortable = ["A/A", "THE_DATE", "TIME"].includes(field);
    if (!sortable) {
      return <TableCell align={align}>{label}</TableCell>;
    }

    const isActive = activeSort.by === field;
    return (
      <TableCell align={align} sortDirection={isActive ? activeSort.dir : false}>
        <TableSortLabel
          active={isActive}
          direction={isActive ? activeSort.dir : "asc"}
          onClick={() => handleSort(field)}
        >
          {label}
        </TableSortLabel>
      </TableCell>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ maxWidth: 1250, mx: "auto", px: { xs: 0, sm: 1 }, py: 1 }}>
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 1, sm: 1.5 },
          borderRadius: 1,
          mb: 1.25,
          borderColor: (t) =>
            t.palette.mode === "dark" ? "rgba(163, 181, 204, 0.18)" : "rgba(172,156,136,0.45)",
          background: (t) =>
            t.palette.mode === "dark"
              ? t.palette.background.default
              : "linear-gradient(135deg, rgba(252,204,116,0.18) 0%, rgba(197,170,146,0.2) 38%, rgba(242,244,247,0.95) 75%)",
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.25, sm: 1 }} alignItems={{ xs: "flex-start", sm: "baseline" }}>
            <Typography variant="h6" fontWeight={900}>
              Search Rides
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Filter by date range, operator and driver.
            </Typography>
          </Stack>
          <Chip label="Reporting Mode" size="small" color="secondary" />
        </Stack>
      </Paper>

      {infoMsg ? <Alert severity="info" sx={{ mb: 1.25 }}>{infoMsg}</Alert> : null}
      {optionsError ? <Alert severity="warning" sx={{ mb: 1.25 }}>{optionsError}</Alert> : null}

      <Section title="Filters">
        <Grid container spacing={1.25}>
          <Grid size={{ xs: 12, sm: 4, md: 4, lg: 2 }} sx={{ display: "flex" }}>
            <Box sx={{ width: { xs: "min(100%, 320px)", sm: "100%" } }}>
              <LabeledDatePicker
                label="From Date"
                value={filters.fromDate}
                onChange={(v) => setFilters((f) => ({ ...f, fromDate: v }))}
              />
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 4, md: 4, lg: 2 }} sx={{ display: "flex" }}>
            <Box sx={{ width: { xs: "min(100%, 320px)", sm: "100%" } }}>
              <LabeledDatePicker
                label="To Date"
                value={filters.toDate}
                onChange={(v) => setFilters((f) => ({ ...f, toDate: v }))}
              />
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 4, md: 4, lg: 2 }} sx={{ display: "flex" }}>
            <Box sx={{ width: { xs: "min(100%, 320px)", sm: "100%" } }}>
              <LabeledAutocomplete
                label="Tour Operator"
                options={tourOperOptions}
                value={filters.TOUR_OPER}
                onChange={(v) => setFilters((f) => ({ ...f, TOUR_OPER: v }))}
              />
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 4, md: 4, lg: 2 }} sx={{ display: "flex" }}>
            <Box sx={{ width: { xs: "min(100%, 320px)", sm: "100%" } }}>
              <LabeledAutocomplete
                label="Driver"
                options={driverOptions}
                value={filters.DRIVER}
                onChange={(v) => setFilters((f) => ({ ...f, DRIVER: v }))}
              />
            </Box>
          </Grid>

        </Grid>
      </Section>

      <Paper
        variant="outlined"
        sx={{
          position: "sticky",
          top: { xs: 64, sm: 72 },
          zIndex: (t) => t.zIndex.appBar - 1,
          mt: 1,
          mb: 1.25,
          p: 0.75,
          borderRadius: 1,
          borderColor: (t) =>
            t.palette.mode === "dark" ? "rgba(163, 181, 204, 0.18)" : "rgba(172, 156, 136, 0.24)",
          bgcolor: (t) => (t.palette.mode === "dark" ? t.palette.background.default : "#ffffff"),
        }}
      >
        <Box
          sx={{
            maxWidth: "100%",
            overflowX: { xs: "auto", sm: "visible" },
            overflowY: "hidden",
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-x pan-y",
            pb: { xs: 0.25, sm: 0 },
          }}
        >
          <Box
            sx={{
              display: "flex",
              gap: 1,
              justifyContent: { xs: "flex-start", sm: "flex-end" },
              alignItems: "center",
              flexWrap: { xs: "nowrap", sm: "wrap" },
              width: { xs: "max-content", sm: "100%" },
              "& .MuiButton-root": {
                width: "auto",
                minWidth: 0,
                whiteSpace: "nowrap",
                px: { xs: 1.25, sm: 1.75 },
                flex: "0 0 auto",
              },
            }}
          >
            <Button size="small" variant="outlined" startIcon={<ClearIcon />} onClick={handleClear}>
              Clear
            </Button>
            <Button size="small" variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={() => handlePdfSingle()}>
              Print Selected PDF
            </Button>
            <Button size="small" variant="outlined" startIcon={<EmailIcon />} onClick={() => handleEmailPdf()}>
              Email Selected PDF
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<PictureAsPdfIcon />}
              onClick={handlePdfAll}
              disabled={isExportingPdf}
            >
              {isExportingPdf
                ? (pdfExportJob?.status === "pending" ? "Queueing PDF..." : "Preparing PDFs...")
                : "Print All PDFs"}
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportExcel}
              disabled={isExportingExcel}
            >
              {isExportingExcel
                ? (excelExportJob?.status === "pending" ? "Queueing Excel..." : "Preparing Excel...")
                : "Export Excel"}
            </Button>
            <Button
              size="medium"
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              sx={{ width: { xs: "auto", sm: 142 }, minHeight: 28, px: 2.25, fontSize: "0.95rem", fontWeight: 700 }}
            >
              Search
            </Button>
          </Box>
        </Box>
      </Paper>

      <Section title={`Results (Total Rows: ${totals.count} | This Page Total Price: €${totals.sumFormatted})`}>
        <Box sx={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <Table size="small" sx={{ minWidth: 980 }}>
            <TableHead>
              <TableRow>
                {renderSortableHeader("A/A", "A/A")}
                {renderSortableHeader("Date", "THE_DATE")}
                {renderSortableHeader("Time", "TIME")}
                {renderSortableHeader("Type", "TYPE")}
                {renderSortableHeader("From", "FROM")}
                {renderSortableHeader("To", "TO")}
                {renderSortableHeader("Hotel Name", "HOTEL NAME")}
                {renderSortableHeader("Area", "AREA")}
                {renderSortableHeader("Fly Code", "FLY_CODE")}
                {renderSortableHeader("Fly Company", "FLY_COMPANY")}
                {renderSortableHeader("Customer Name", "THE_NAME")}
                {renderSortableHeader("Email", "EMAIL")}
                {renderSortableHeader("Pax", "PAX", "right")}
                {renderSortableHeader("Adult", "ADULT", "right")}
                {renderSortableHeader("Ch/Inf", "CH/INF", "right")}
                {renderSortableHeader("Info", "INFO")}
                {renderSortableHeader("V Code", "VCode")}
                {renderSortableHeader("Tour Operator", "TOUR_OPER")}
                {renderSortableHeader("Price", "PRICE", "right")}
                {renderSortableHeader("Driver", "DRIVER")}
                {renderSortableHeader("Driver Price", "DRIVER_PRICE", "right")}
                <TableCell align="center">PDF</TableCell>
                <TableCell align="center">Edit</TableCell>
                <TableCell align="center">Delete</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.map((r) => (
                <TableRow
                  key={r["A/A"]}
                  hover
                  onClick={() => setSelectedAA(r["A/A"])}
                  sx={{
                    cursor: "pointer",
                    bgcolor: selectedRide?.["A/A"] === r["A/A"] ? "rgba(15,76,129,0.08)" : "inherit",
                  }}
                  >
                  <TableCell>{r["A/A"]}</TableCell>
                  {renderCell(r, "THE_DATE", "left", { minWidth: 120 })}
                  {renderCell(r, "TIME")}
                  {renderCell(r, "TYPE")}
                  {renderCell(r, "FROM")}
                  {renderCell(r, "TO")}
                  {renderCell(r, "HOTEL NAME")}
                  {renderCell(r, "AREA")}
                  {renderCell(r, "FLY_CODE")}
                  {renderCell(r, "FLY_COMPANY")}
                  {renderCell(r, "THE_NAME")}
                  {renderCell(r, "EMAIL")}
                  {renderCell(r, "PAX", "right")}
                  {renderCell(r, "ADULT", "right")}
                  {renderCell(r, "CH/INF", "right")}
                  {renderCell(r, "INFO")}
                  {renderCell(r, "VCode")}
                  {renderCell(r, "TOUR_OPER")}
                  {renderCell(r, "PRICE", "right")}
                  {renderCell(r, "DRIVER")}
                  {renderCell(r, "DRIVER_PRICE", "right")}
                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PictureAsPdfIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePdfSingle(r);
                      }}
                    >
                      PDF
                    </Button>
                  </TableCell>
                  <TableCell align="center">
                    {editingAA === r["A/A"] ? (
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Button
                          size="small"
                          variant="contained"
                          disabled={isSavingRow}
                          onClick={(e) => {
                            e.stopPropagation();
                            saveRow(r["A/A"]);
                          }}
                        >
                          Save
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={isSavingRow}
                          onClick={(e) => {
                            e.stopPropagation();
                            cancelEdit();
                          }}
                        >
                          Cancel
                        </Button>
                      </Stack>
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(r);
                        }}
                      >
                        Edit
                      </Button>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      startIcon={<DeleteOutlineIcon />}
                      disabled={isDeletingRow}
                      onClick={(e) => {
                        e.stopPropagation();
                        requestDeleteRow(r);
                      }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={24} sx={{ color: "text.secondary" }}>
                    {isLoading ? "Loading..." : "No results."}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </Box>
        <TablePagination
          component="div"
          count={totalRows}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={pageSize}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[25, 50, 100, 200]}
          labelRowsPerPage="Rows per page"
          sx={{ mt: 0.5 }}
        />
      </Section>

      <Dialog open={Boolean(deleteTarget)} onClose={closeDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Ride</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete ride A/A {deleteTarget?.["A/A"] ?? "-"}?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} disabled={isDeletingRow}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={confirmDeleteRow} disabled={isDeletingRow}>
            {isDeletingRow ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </LocalizationProvider>
  );
}
