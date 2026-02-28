import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import StorageIcon from "@mui/icons-material/Storage";
import PriceCheckIcon from "@mui/icons-material/PriceCheck";
import { API_BASE, authFetch } from "../lib/authApi.js";

function parseFilenameFromContentDisposition(value, fallback) {
  const header = String(value ?? "");
  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1].trim());

  const basicMatch = header.match(/filename="?([^";]+)"?/i);
  if (basicMatch?.[1]) return basicMatch[1].trim();

  return fallback;
}

function BackupCard({
  icon,
  title,
  description,
  buttonLabel,
  onClick,
  isLoading,
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 1.5, sm: 2 },
        borderRadius: 1,
        borderColor: (t) =>
          t.palette.mode === "dark" ? "rgba(163, 181, 204, 0.18)" : "rgba(172, 156, 136, 0.3)",
        bgcolor: (t) => (t.palette.mode === "dark" ? t.palette.background.default : "#ffffff"),
        height: "100%",
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 0.75 }}>
        {icon}
        <Typography variant="subtitle1" fontWeight={800}>
          {title}
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {description}
      </Typography>
      <Button
        variant="contained"
        startIcon={<CloudDownloadIcon />}
        onClick={onClick}
        disabled={isLoading}
        sx={{ minHeight: 42 }}
      >
        {isLoading ? "Preparing..." : buttonLabel}
      </Button>
    </Paper>
  );
}

export default function BackupsPage() {
  const [isDownloadingData, setIsDownloadingData] = useState(false);
  const [isDownloadingPrices, setIsDownloadingPrices] = useState(false);
  const [infoMsg, setInfoMsg] = useState("");

  async function downloadBackupCsv(path, fallbackFilename, successLabel, setLoading) {
    setInfoMsg("");
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE}${path}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const detail = body?.detail || body?.error || `Backup request failed (${res.status})`;
        throw new Error(detail);
      }

      const blob = await res.blob();
      const filename = parseFilenameFromContentDisposition(
        res.headers.get("content-disposition"),
        fallbackFilename,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);

      setInfoMsg(`${successLabel} backup downloaded successfully.`);
    } catch (err) {
      setInfoMsg(`Could not download ${successLabel.toLowerCase()} backup: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleBackupData() {
    const datePart = new Date().toISOString().slice(0, 10);
    await downloadBackupCsv(
      "/rides/backup.csv",
      `data_backup_${datePart}.csv`,
      "Data",
      setIsDownloadingData,
    );
  }

  async function handleBackupPrices() {
    const datePart = new Date().toISOString().slice(0, 10);
    await downloadBackupCsv(
      "/prices/backup.csv",
      `prices_backup_${datePart}.csv`,
      "Prices",
      setIsDownloadingPrices,
    );
  }

  return (
    <Box sx={{ maxWidth: 1080, mx: "auto", px: { xs: 0, sm: 1 }, py: 1 }}>
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 1.5, sm: 2 },
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
          <Stack spacing={0.25}>
            <Typography variant="h6" fontWeight={900}>
              Backups
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Download full CSV backups for operational and pricing tables.
            </Typography>
          </Stack>
          <Chip size="small" label="Data Safety" color="secondary" />
        </Stack>
      </Paper>

      {infoMsg ? <Alert severity="info" sx={{ mb: 1.25 }}>{infoMsg}</Alert> : null}

      <Grid container spacing={1.25}>
        <Grid size={{ xs: 12, md: 6 }}>
          <BackupCard
            icon={<StorageIcon color="primary" />}
            title="Backup Data CSV"
            description="Exports all records from the rides data table. Use this for operational backup and recovery."
            buttonLabel="Download Data Backup"
            onClick={handleBackupData}
            isLoading={isDownloadingData}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <BackupCard
            icon={<PriceCheckIcon color="primary" />}
            title="Backup Prices CSV"
            description="Exports all rows from the prices table, including destinations, operators, and mapped prices."
            buttonLabel="Download Prices Backup"
            onClick={handleBackupPrices}
            isLoading={isDownloadingPrices}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
