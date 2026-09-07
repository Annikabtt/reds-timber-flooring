import { describe, expect, it } from "vitest";

import {
  dailyReportWorkerChanges,
  optionalTime,
  reportDateTimeToTimestamp,
  workTimeLogChanges,
} from "./dailyReportPayload";

const record = {
  employee_id: "employee-1",
  work_assignment_id: "",
  replaces_work_assignment_id: "",
  worker_source: "Assigned",
  attendance_status: "Present",
  activity_type_id: "activity-1",
  clock_in: "08:00",
  clock_out: "17:00",
  break_minutes: "60",
  ot_start: "17:30",
  ot_finish: "19:00",
  regular_hours: "8",
  overtime_hours: "1.5",
  completed_quantity: "10",
  ot_completed_quantity: "2",
  worker_role: "Installer",
  notes: "",
};

describe("Daily Report payload normalization", () => {
  it("keeps OT fields as time without a date", () => {
    expect(dailyReportWorkerChanges(record)).toMatchObject({
      work_assignment_id: null,
      replaces_work_assignment_id: null,
      ot_start: "17:30:00",
      ot_finish: "19:00:00",
    });
  });

  it("uses timestamps only for work-time clock fields", () => {
    const payload = workTimeLogChanges("2026-09-07", record);
    expect(payload.clock_in).toMatch(/T/);
    expect(payload.clock_out).toMatch(/T/);
    expect(payload.ot_start).toBe("17:30:00");
    expect(payload.ot_finish).toBe("19:00:00");
  });

  it("normalizes empty times to null and rejects malformed values", () => {
    expect(optionalTime("")).toBeNull();
    expect(reportDateTimeToTimestamp("2026-09-07", "")).toBeNull();
    expect(() => optionalTime("25:00")).toThrow("valid range");
  });
});
