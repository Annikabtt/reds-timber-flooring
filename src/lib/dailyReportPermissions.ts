import { supabase } from "@/integrations/supabase/client";

export const dailyReportActions = [
  "create", "update", "delete", "upload_photos", "update_photos", "delete_photos",
] as const;

export type DailyReportAction = typeof dailyReportActions[number];
export type DailyReportPermissions = {
  canRead: boolean;
  actions: Record<DailyReportAction, boolean>;
};

export async function loadDailyReportPermissions(
  expectedUserId: string,
): Promise<DailyReportPermissions> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user || user.id !== expectedUserId) {
    throw new Error("Your session has changed. Please reload before continuing.");
  }

  const [membership, ...permissions] = await Promise.all([
    supabase.rpc("has_active_app_access"),
    ...dailyReportActions.map((action) => supabase.rpc("has_permission", {
      p_permission_code: `daily_reports.${action}`,
    })),
  ]);
  if ([membership, ...permissions].some((result) => result.error)) {
    throw new Error("Unable to check Daily Report permissions. Please retry.");
  }
  const canRead = membership.data === true;
  const actions = Object.fromEntries(dailyReportActions.map((action, index) => [
    action, canRead && permissions[index].data === true,
  ])) as DailyReportPermissions["actions"];
  return { canRead, actions };
}

export async function requireDailyReportActions(
  userId: string,
  actions: readonly DailyReportAction[],
) {
  // Always recheck with the server before the first write, not a cached UI flag.
  const permissions = await loadDailyReportPermissions(userId);
  if (!permissions.canRead || actions.some((action) => !permissions.actions[action])) {
    throw new Error("Your account does not have permission for this action. Please contact an administrator.");
  }
  return permissions;
}
