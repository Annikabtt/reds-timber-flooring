import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadDailyReportPermissions, requireDailyReportActions } from "./dailyReportPermissions";

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), getUser: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: mocks.rpc, auth: { getUser: mocks.getUser } },
}));

describe("Daily Report permission checks", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "member-a" } }, error: null });
    mocks.rpc.mockImplementation(async (name: string) => ({
      data: name === "has_active_app_access", error: null,
    }));
  });

  it("lets an active member read without assignment or write permissions", async () => {
    const result = await loadDailyReportPermissions("member-a");
    expect(result.canRead).toBe(true);
    expect(Object.values(result.actions).every((value) => !value)).toBe(true);
    expect(mocks.rpc).toHaveBeenCalledTimes(7);
  });

  it("uses the backend permission decision, not a role name", async () => {
    mocks.rpc.mockImplementation(async (name: string, args?: { p_permission_code: string }) => ({
      data: name === "has_active_app_access" || args?.p_permission_code === "daily_reports.create", error: null,
    }));
    const result = await requireDailyReportActions("member-a", ["create"]);
    expect(result.actions.create).toBe(true);
    expect(result.actions.delete).toBe(false);
  });

  it("refuses writing when a required permission is denied", async () => {
    await expect(requireDailyReportActions("member-a", ["create"])).rejects.toThrow("does not have permission");
  });

  it("refuses access for an inactive member even if a permission returns true", async () => {
    mocks.rpc.mockImplementation(async (name: string) => ({ data: name !== "has_active_app_access", error: null }));
    const result = await loadDailyReportPermissions("member-a");
    expect(result.canRead).toBe(false);
    expect(Object.values(result.actions).every((value) => !value)).toBe(true);
  });

  it("does not convert RPC failures into permission grants", async () => {
    mocks.rpc.mockResolvedValue({ data: true, error: { message: "network failure" } });
    await expect(loadDailyReportPermissions("member-a")).rejects.toThrow("Please retry");
  });

  it("does not reuse another account's permission checks", async () => {
    await expect(loadDailyReportPermissions("member-b")).rejects.toThrow("session has changed");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("checks the server again after permissions are revoked", async () => {
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    await requireDailyReportActions("member-a", ["create"]);
    mocks.rpc.mockImplementation(async (name: string) => ({ data: name === "has_active_app_access", error: null }));
    await expect(requireDailyReportActions("member-a", ["create"])).rejects.toThrow("does not have permission");
    expect(mocks.getUser).toHaveBeenCalledTimes(2);
  });
});
