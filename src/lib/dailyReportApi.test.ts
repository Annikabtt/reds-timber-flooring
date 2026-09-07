import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createDailyReportBundleAtomic,
  dailyReportPhotoPath,
  uploadDailyReportPhoto,
} from "./dailyReportApi";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  upload: vi.fn(),
  remove: vi.fn(),
  insert: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: mocks.rpc,
    from: vi.fn(() => ({ insert: mocks.insert })),
    storage: {
      from: vi.fn(() => ({ upload: mocks.upload, remove: mocks.remove })),
    },
  },
}));

describe("Daily Report atomic and private-photo helpers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.rpc.mockResolvedValue({ data: "report-1", error: null });
    mocks.upload.mockResolvedValue({ error: null });
    mocks.insert.mockResolvedValue({ error: null });
    mocks.remove.mockResolvedValue({ error: null });
    vi.stubGlobal("crypto", { randomUUID: () => "photo-1" });
  });

  it("normalizes legacy public URLs to private object paths", () => {
    expect(dailyReportPhotoPath(
      "https://example.supabase.co/storage/v1/object/public/daily-report-photos/report/photo.jpg",
    )).toBe("report/photo.jpg");
    expect(dailyReportPhotoPath("report/photo.jpg")).toBe("report/photo.jpg");
  });

  it("calls the atomic create contract with all child collections", async () => {
    await createDailyReportBundleAtomic({
      report: { project_id: "project-1" },
      activities: [],
      workers: [{ employee_id: "employee-1" }],
      timeLogs: [],
    });
    expect(mocks.rpc).toHaveBeenCalledWith("create_daily_report_bundle_atomic", {
      p_report: { project_id: "project-1" },
      p_activities: [],
      p_workers: [{ employee_id: "employee-1" }],
      p_time_logs: [],
    });
  });

  it("removes an uploaded object when metadata insertion fails", async () => {
    mocks.insert.mockResolvedValue({ error: { message: "metadata denied" } });
    const file = new File(["photo"], "site.jpg", { type: "image/jpeg" });
    await expect(uploadDailyReportPhoto({ reportId: "report-1", file }))
      .rejects.toThrow("metadata denied");
    expect(mocks.remove).toHaveBeenCalledWith(["report-1/photo-1.jpg"]);
  });
});
