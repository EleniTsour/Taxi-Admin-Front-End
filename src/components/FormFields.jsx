import React from "react";
import { FormControl, FormLabel, Popper, TextField, Tooltip } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

function WidePopper(props) {
  const { anchorEl, style } = props;
  const minWidth = anchorEl?.clientWidth ?? 280;
  const maxWidth = typeof window !== "undefined" ? window.innerWidth - 24 : 960;
  return <Popper {...props} placement="bottom-start" style={{ ...style }} sx={{ "& .MuiAutocomplete-paper": { minWidth, width: "max-content", maxWidth }, "& .MuiAutocomplete-listbox": { maxWidth } }} />;
}

export function LabeledTextField({ label, helperText, InputProps, ...props }) {
  return <FormControl fullWidth><FormLabel sx={{ fontSize: 12, mb: 0.5, color: "text.primary" }}>{label}</FormLabel><TextField size="small" margin="dense" placeholder={label} helperText={helperText ?? " "} FormHelperTextProps={{ sx: { m: 0, mt: 0.5, whiteSpace: "normal" } }} InputProps={{ sx: { borderRadius: 1 }, ...InputProps }} {...props} /></FormControl>;
}

export function LabeledDatePicker({ label, value, onChange, required = false }) {
  return <FormControl fullWidth><FormLabel sx={{ fontSize: 12, mb: 0.5, color: "text.primary" }}>{label}</FormLabel><DatePicker format="DD-MM-YYYY" value={value ? dayjs(value) : null} onChange={(newValue) => onChange(newValue && newValue.isValid() ? newValue.format("YYYY-MM-DD") : "")} slotProps={{ textField: { required, size: "small", margin: "dense", placeholder: label, helperText: " ", FormHelperTextProps: { sx: { m: 0, mt: 0.5, whiteSpace: "normal" } }, InputProps: { sx: { borderRadius: 1 } } } }} /></FormControl>;
}

export function LabeledAutocomplete({ label, options, value, onChange, required = false, freeSolo = true }) {
  const full = value || "";
  return <FormControl fullWidth><FormLabel sx={{ fontSize: 12, mb: 0.5, color: "text.primary" }}>{label}</FormLabel><Autocomplete fullWidth freeSolo={freeSolo} PopperComponent={WidePopper} options={options} value={value || null} onChange={(_, v) => onChange(typeof v === "string" ? v : (v ?? ""))} onInputChange={(_, inputValue, reason) => { if (freeSolo && (reason === "input" || reason === "clear")) onChange(inputValue ?? ""); }} slotProps={{ paper: { sx: { mt: 0.5 } } }} renderOption={(props, option) => { const { key, ...optionProps } = props; return <li key={key} {...optionProps} style={{ whiteSpace: "normal", alignItems: "flex-start" }}><span style={{ display: "block", lineHeight: 1.25 }}>{option}</span></li>; }} renderInput={(params) => <Tooltip title={full ? full : ""} placement="top" arrow disableHoverListener={!full}><TextField {...params} required={required} size="small" margin="dense" placeholder={label} inputProps={{ ...params.inputProps, style: { overflowX: "auto", textOverflow: "clip", whiteSpace: "nowrap" } }} InputProps={{ ...params.InputProps, sx: { borderRadius: 1 } }} helperText={full ? full : " "} FormHelperTextProps={{ sx: { m: 0, mt: 0.5, whiteSpace: "normal" } }} /></Tooltip>} /></FormControl>;
}
