import type { EmployeeLite } from "./goodsReceiving.types";

export const toNumber = (value: unknown) => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
};

export const formatQty = (value: unknown) => {
  const n = toNumber(value);
  return new Intl.NumberFormat("en-AU", { maximumFractionDigits: 3 }).format(n);
};

export const formatDate = (value: string | null | undefined) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-AU", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
};

export const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
};

export const employeeName = (employee: EmployeeLite | null | undefined) => {
  if (!employee) return "-";
  return employee.display_name?.trim() || [employee.first_name, employee.last_name].filter(Boolean).join(" ") || employee.employee_code || "-";
};

export const statusClass = (status: string) => {
  switch (status) {
    case "Received": return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Partial": return "border-amber-200 bg-amber-50 text-amber-700";
    case "Rejected": return "border-red-200 bg-red-50 text-red-700";
    case "Cancelled": return "border-slate-300 bg-slate-100 text-slate-600";
    default: return "border-blue-200 bg-blue-50 text-blue-700";
  }
};

export const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : String(error ?? "Unknown error");

export const csvEscape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

export const safeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, "-");
