type DailyReportLabourValues = {
  employee_id: string;
  work_assignment_id: string;
  replaces_work_assignment_id: string;
  worker_source: string;
  attendance_status: string;
  activity_type_id: string;
  clock_in: string;
  clock_out: string;
  break_minutes: string;
  ot_start: string;
  ot_finish: string;
  regular_hours: string;
  overtime_hours: string;
  completed_quantity: string;
  ot_completed_quantity: string;
  worker_role: string;
  notes: string;
};

function optionalText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed || null;
}

export function optionalUuid(value: string | null | undefined) {
  return optionalText(value);
}

export function optionalTime(value: string | null | undefined) {
  const trimmed = optionalText(value);
  if (!trimmed) return null;

  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed);
  if (!match) throw new Error("Time must use HH:MM or HH:MM:SS format.");

  const [, hour, minute, second = "00"] = match;
  if (Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59) {
    throw new Error("Time is outside the valid range.");
  }

  return `${hour}:${minute}:${second}`;
}

export function reportDateTimeToTimestamp(
  reportDate: string | null | undefined,
  time: string | null | undefined,
) {
  const normalizedTime = optionalTime(time);
  if (!normalizedTime) return null;

  const date = optionalText(reportDate);
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("A valid report date is required for a time log.");
  }

  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute, second] = normalizedTime.split(":").map(Number);
  const localDate = new Date(year, month - 1, day, hour, minute, second, 0);
  if (
    localDate.getFullYear() !== year ||
    localDate.getMonth() !== month - 1 ||
    localDate.getDate() !== day
  ) {
    throw new Error("Report date is invalid.");
  }

  return localDate.toISOString();
}

function numberOrZero(value: string) {
  const numberValue = Number(value || 0);
  if (!Number.isFinite(numberValue)) {
    throw new Error("Hours and quantities must be valid numbers.");
  }
  return numberValue;
}

export function dailyReportWorkerChanges(record: DailyReportLabourValues) {
  return {
    employee_id: optionalUuid(record.employee_id),
    work_assignment_id: optionalUuid(record.work_assignment_id),
    replaces_work_assignment_id: optionalUuid(record.replaces_work_assignment_id),
    worker_source: optionalText(record.worker_source),
    attendance_status: optionalText(record.attendance_status),
    activity_type_id: optionalUuid(record.activity_type_id),
    regular_hours: numberOrZero(record.regular_hours),
    overtime_hours: numberOrZero(record.overtime_hours),
    completed_quantity: numberOrZero(record.completed_quantity),
    ot_start: optionalTime(record.ot_start),
    ot_finish: optionalTime(record.ot_finish),
    ot_completed_quantity: numberOrZero(record.ot_completed_quantity),
    worker_role: optionalText(record.worker_role),
    notes: optionalText(record.notes),
  };
}

export function workTimeLogChanges(
  reportDate: string,
  record: DailyReportLabourValues,
) {
  return {
    employee_id: optionalUuid(record.employee_id),
    work_assignment_id: optionalUuid(record.work_assignment_id),
    replaces_work_assignment_id: optionalUuid(record.replaces_work_assignment_id),
    worker_source: optionalText(record.worker_source),
    attendance_status: optionalText(record.attendance_status),
    activity_type_id: optionalUuid(record.activity_type_id),
    clock_in: reportDateTimeToTimestamp(reportDate, record.clock_in),
    clock_out: reportDateTimeToTimestamp(reportDate, record.clock_out),
    break_minutes: numberOrZero(record.break_minutes),
    regular_hours: numberOrZero(record.regular_hours),
    overtime_hours: numberOrZero(record.overtime_hours),
    ot_start: optionalTime(record.ot_start),
    ot_finish: optionalTime(record.ot_finish),
    ot_completed_quantity: numberOrZero(record.ot_completed_quantity),
    notes: optionalText(record.notes) || optionalText(record.worker_role),
  };
}
