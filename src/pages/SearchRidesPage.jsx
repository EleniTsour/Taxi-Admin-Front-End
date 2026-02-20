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
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import SearchIcon from "@mui/icons-material/Search";
import PrintIcon from "@mui/icons-material/Print";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import EmailIcon from "@mui/icons-material/Email";
import ClearIcon from "@mui/icons-material/Clear";
import DownloadIcon from "@mui/icons-material/Download";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

const EXCEL_COLUMNS = [
  { key: "A/A", label: "A/A" },
  { key: "THE_DATE", label: "Date" },
  { key: "TIME", label: "Time" },
  { key: "TYPE", label: "Type" },
  { key: "FROM", label: "From" },
  { key: "TO", label: "To" },
  { key: "HOTEL NAME", label: "Hotel Name" },
  { key: "AREA", label: "Area" },
  { key: "FLY_CODE", label: "Fly Code" },
  { key: "FLY_COMPANY", label: "Fly Company" },
  { key: "THE_NAME", label: "Customer Name" },
  { key: "EMAIL", label: "Email" },
  { key: "PAX", label: "Pax" },
  { key: "ADULT", label: "Adult" },
  { key: "CH/INF", label: "Ch/Inf" },
  { key: "INFO", label: "Info" },
  { key: "VCode", label: "V Code" },
  { key: "TOUR_OPER", label: "Tour Operator" },
  { key: "PRICE", label: "Price" },
  { key: "DRIVER", label: "Driver" },
];

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
        renderOption={(props, option) => (
          <li {...props} style={{ whiteSpace: "normal", alignItems: "flex-start" }}>
            <span style={{ display: "block", lineHeight: 1.25 }}>{option}</span>
          </li>
        )}
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
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    TOUR_OPER: "",
  });

  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [totalRows, setTotalRows] = useState(0);
  const [editingAA, setEditingAA] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [isSavingRow, setIsSavingRow] = useState(false);
  const [infoMsg, setInfoMsg] = useState("");
  const [optionsError, setOptionsError] = useState("");
  const [tourOperOptions, setTourOperOptions] = useState([]);
  const [destinationOptions, setDestinationOptions] = useState([]);
  const [sort, setSort] = useState({ by: "THE_DATE", dir: "desc" });
  const [activeFilters, setActiveFilters] = useState({
    fromDate: "",
    toDate: "",
    TOUR_OPER: "",
  });
  const [activeSort, setActiveSort] = useState({ by: "THE_DATE", dir: "desc" });
  const [selectedAA, setSelectedAA] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadTourOperatorOptions() {
      try {
        setOptionsError("");
        const res = await fetch(`${API_BASE}/prices`, { credentials: "include" });
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
        setOptionsError(`Could not load Tour Operator options: ${err.message}`);
      }
    }

    loadTourOperatorOptions();
    return () => {
      isMounted = false;
    };
  }, []);

  const totals = useMemo(() => {
    const count = totalRows;
    const sum = rows.reduce((acc, r) => acc + Number(r.PRICE ?? 0), 0);
    return { count, sum };
  }, [rows, totalRows]);

  const selectedRide = useMemo(() => {
    if (rows.length === 0) return null;
    if (selectedAA == null) return rows[0];
    return rows.find((r) => r["A/A"] === selectedAA) ?? rows[0];
  }, [rows, selectedAA]);

  async function fetchRides(nextPage, nextPageSize, filtersForQuery, sortForQuery) {
    const params = new URLSearchParams();
    if (filtersForQuery.fromDate) params.set("from", filtersForQuery.fromDate);
    if (filtersForQuery.toDate) params.set("to", filtersForQuery.toDate);
    if (filtersForQuery.TOUR_OPER) params.set("tour_oper", filtersForQuery.TOUR_OPER);
    params.set("sortBy", sortForQuery.by);
    params.set("sortDir", sortForQuery.dir);
    params.set("page", String(nextPage + 1));
    params.set("pageSize", String(nextPageSize));

    const url = `${API_BASE}/rides/search?${params.toString()}`;

    setIsLoading(true);
    try {
      const res = await fetch(url, { credentials: "include" });
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
    const clearedFilters = { fromDate: "", toDate: "", TOUR_OPER: "" };
    const defaultSort = { by: "THE_DATE", dir: "desc" };
    setActiveFilters(clearedFilters);
    setFilters(clearedFilters);
    setSort(defaultSort);
    setActiveSort(defaultSort);
  }

  function startEdit(row) {
    setEditingAA(row["A/A"]);
    setEditDraft({ ...row });
  }

  function cancelEdit() {
    setEditingAA(null);
    setEditDraft(null);
  }

  function updateDraftField(key, value) {
    if ((key === "ADULT" || key === "PRICE")) {
      const normalized = String(value ?? "").replace(/\s/g, "");
      if (!/^\d*(?:[.,]\d*)?$/.test(normalized)) return;
      setEditDraft((prev) => ({ ...(prev ?? {}), [key]: normalized }));
      return;
    }

    setEditDraft((prev) => ({ ...(prev ?? {}), [key]: value }));
  }

  function toDateInputValue(value) {
    const raw = String(value ?? "");
    if (!raw) return "";
    const m = raw.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? raw : d.toISOString().slice(0, 10);
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

      const res = await fetch(`${API_BASE}/rides/${encodeURIComponent(rowId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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
          {row[key]}
        </TableCell>
      );
    }

    if (key === "THE_DATE") {
      return (
        <TableCell align={align} sx={extraSx}>
          <TextField
            size="small"
            type="date"
            value={toDateInputValue(editDraft?.[key])}
            onChange={(e) => updateDraftField(key, e.target.value)}
            sx={{ minWidth: 140 }}
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
          inputMode={key === "ADULT" || key === "PRICE" ? "decimal" : undefined}
          sx={{ minWidth: 96 }}
        />
      </TableCell>
    );
  }

  function handlePrint() {
    window.print();
  }

  async function openPdfResponse(res) {
    if (!res.ok) {
      throw new Error(`Voucher request failed (${res.status})`);
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
      const res = await fetch(`${API_BASE}/pdf/voucher`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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
    if (rows.length === 0) {
      setInfoMsg("Run a search first and make sure there are rows to print.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/pdf/vouchers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rides: rows }),
      });
      await openPdfResponse(res);
      setInfoMsg(`Combined PDF generated for ${rows.length} ride(s) on this page.`);
    } catch (err) {
      setInfoMsg(`Could not generate combined PDF: ${err.message}`);
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

    try {
      const res = await fetch(`${API_BASE}/pdf/voucher-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ride,
          to: recipient,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = body?.detail || body?.error || `Email request failed (${res.status})`;
        throw new Error(detail);
      }

      setInfoMsg(`Voucher emailed to ${recipient}.`);
    } catch (err) {
      setInfoMsg(`Could not send voucher email: ${err.message}`);
    }
  }

  function csvCell(value) {
    const safe = String(value ?? "")
      .replace(/"/g, '""')
      .replace(/\r?\n/g, " ");
    return `"${safe}"`;
  }

  function buildCsv(rowsToExport) {
    const header = EXCEL_COLUMNS.map((c) => csvCell(c.label)).join(",");
    const lines = rowsToExport.map((row) =>
      EXCEL_COLUMNS.map((c) => csvCell(row[c.key])).join(","),
    );
    return [header, ...lines].join("\r\n");
  }

  function downloadCsv(filename, csvText) {
    const blob = new Blob(["\uFEFF", csvText], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  function handleExportExcel() {
    setInfoMsg("");
    if (rows.length === 0) {
      setInfoMsg("Run a search first and make sure there are rows to export.");
      return;
    }

    const datePart = new Date().toISOString().slice(0, 10);
    const csv = buildCsv(rows);
    downloadCsv(`rides_report_${datePart}_page_${page + 1}.csv`, csv);
    setInfoMsg(`Excel export generated for ${rows.length} ride(s) on this page.`);
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
              Filter by date range and operator.
            </Typography>
          </Stack>
          <Chip label="Reporting Mode" size="small" color="secondary" />
        </Stack>
      </Paper>

      {infoMsg ? <Alert severity="info" sx={{ mb: 1.25 }}>{infoMsg}</Alert> : null}
      {optionsError ? <Alert severity="warning" sx={{ mb: 1.25 }}>{optionsError}</Alert> : null}

      <Section title="Filters">
        <Grid container spacing={1.25}>
          <Grid size={{  xs: 6, sm: 4, md: 4, lg: 2 }}>
            <LabeledTextField
              label="From Date"
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilters((f) => ({ ...f, fromDate: e.target.value }))}
            />
          </Grid>

          <Grid size={{  xs: 6, sm: 4, md: 4, lg: 2 }}>
            <LabeledTextField
              label="To Date"
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilters((f) => ({ ...f, toDate: e.target.value }))}
            />
          </Grid>

          <Grid size={{  xs: 6, sm: 4, md: 4, lg: 2 }}>
            <LabeledAutocomplete
              label="Tour Operator"
              options={tourOperOptions}
              value={filters.TOUR_OPER}
              onChange={(v) => setFilters((f) => ({ ...f, TOUR_OPER: v }))}
            />
          </Grid>

          <Grid size={{  xs: 12, sm: 12, md: 12, lg: 12 }}>
            <Divider sx={{ my: 0.75 }} />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="flex-end" flexWrap="wrap">
              <Button variant="outlined" startIcon={<ClearIcon />} onClick={handleClear} sx={{ width: { xs: "100%", sm: "auto" } }}>
                Clear
              </Button>
              <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint} sx={{ width: { xs: "100%", sm: "auto" } }}>
                Print
              </Button>
              <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={() => handlePdfSingle()} sx={{ width: { xs: "100%", sm: "auto" } }}>
                Print Selected PDF
              </Button>
              <Button variant="outlined" startIcon={<EmailIcon />} onClick={() => handleEmailPdf()} sx={{ width: { xs: "100%", sm: "auto" } }}>
                Email Selected PDF
              </Button>
              <Button variant="outlined" startIcon={<PictureAsPdfIcon />} onClick={handlePdfAll} sx={{ width: { xs: "100%", sm: "auto" } }}>
                Print All PDFs
              </Button>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportExcel} sx={{ width: { xs: "100%", sm: "auto" } }}>
                Export Excel
              </Button>
              <Button variant="contained" startIcon={<SearchIcon />} onClick={handleSearch} sx={{ width: { xs: "100%", sm: "auto" } }}>
                Search
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Section>

      <Box sx={{ height: 12 }} />

      <Section title={`Results (Total Rows: ${totals.count} | This Page Total Price: €${totals.sum})`}>
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
                <TableCell align="center">PDF</TableCell>
                <TableCell align="center">Edit</TableCell>
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
                </TableRow>
              ))}

              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={22} sx={{ color: "text.secondary" }}>
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
    </Box>
  );
}
