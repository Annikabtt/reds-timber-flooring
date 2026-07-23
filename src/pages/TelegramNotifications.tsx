import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  BellRing,
  Check,
  CircleOff,
  Link2,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Unlink,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type ConnectionFilter =
  | "All"
  | "Connected"
  | "NotConnected"
  | "Enabled"
  | "Disabled";

type NotificationUser = {
  auth_user_id: string;
  email: string;
  display_name: string;
  employee_id: string | null;
  employee_code: string | null;
  role_codes: string[] | null;
  account_status: string;
  telegram_connected: boolean;
  telegram_enabled: boolean;
  telegram_chat_id_masked: string | null;
  notification_destination_id: string | null;
  connected_at: string | null;
  daily_report_enabled: boolean;
  daily_report_source: string;
  goods_receiving_enabled: boolean;
  goods_receiving_source: string;
};

type NotificationEventSetting = {
  event_code: string;
  event_name: string;
  category: "Daily Report" | "Goods Receiving";
  role_default_enabled: boolean;
  override_value: "Allow" | "Deny" | null;
  effective_enabled: boolean;
  permission_source: string;
};

type TelegramChannel = {
  notification_user_channel_id: string;
  notification_destination_id: string;
  destination_name: string;
  telegram_chat_id: string;
  connection_status: "Pending" | "Connected" | "Disconnected" | "Disabled";
  is_enabled: boolean;
  connected_at: string | null;
  connection_notes: string | null;
};

type UserSettings = {
  auth_user_id: string;
  email: string;
  display_name: string;
  account_status: string;
  employee_id: string | null;
  employee_code: string | null;
  roles: Array<{
    role_id: string;
    role_code: string;
    role_name: string;
  }>;
  channel: TelegramChannel | null;
  events: NotificationEventSetting[];
};

type RoleRow = {
  role_id: string;
  role_code: string;
  role_name: string;
  sort_order: number;
};

type RoleDefaultRow = {
  role_id: string;
  event_code: string;
  is_enabled: boolean;
};

type OverrideChoice = "Default" | "Allow" | "Deny";
type PageMode = "users" | "roles";

const PHASE_ONE_EVENTS = [
  {
    event_code: "daily_report_submitted",
    short_name: "Daily Report",
    full_name: "Daily Report Submitted",
    group: "Daily Report",
  },
  {
    event_code: "site_goods_receiving_completed",
    short_name: "Completed",
    full_name: "Goods Receiving Completed",
    group: "Goods Receiving",
  },
  {
    event_code: "site_goods_receiving_partial",
    short_name: "Partial",
    full_name: "Goods Receiving Partial",
    group: "Goods Receiving",
  },
  {
    event_code: "site_goods_receiving_issue",
    short_name: "Issue",
    full_name: "Goods Receiving Issue",
    group: "Goods Receiving",
  },
] as const;

const connectionFilters: Array<{
  value: ConnectionFilter;
  label: string;
}> = [
  { value: "All", label: "All users" },
  { value: "Connected", label: "Connected" },
  { value: "NotConnected", label: "Not connected" },
  { value: "Enabled", label: "Notifications enabled" },
  { value: "Disabled", label: "Notifications disabled" },
];

const formatDateTime = (value: string | null) => {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const roleLabel = (roleCodes: string[] | null) => {
  if (!roleCodes || roleCodes.length === 0) return "No role";
  return roleCodes.join(", ");
};

const permissionBadgeClass = (enabled: boolean) =>
  enabled
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-slate-200 bg-slate-100 text-slate-600";

const connectionBadgeClass = (user: NotificationUser) => {
  if (!user.telegram_connected) {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }

  if (!user.telegram_enabled) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-800";
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unknown database error.";

const rpc = async <T,>(
  functionName: string,
  parameters: Record<string, unknown> = {}
): Promise<T> => {
  const { data, error } = await (supabase as any).rpc(
    functionName,
    parameters
  );

  if (error) throw error;
  return data as T;
};

export default function TelegramNotifications() {
  const { toast } = useToast();

  const [mode, setMode] = useState<PageMode>("users");
  const [users, setUsers] = useState<NotificationUser[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [roleDefaults, setRoleDefaults] = useState<RoleDefaultRow[]>([]);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [connectionFilter, setConnectionFilter] =
    useState<ConnectionFilter>("All");

  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  const [telegramChatId, setTelegramChatId] = useState("");
  const [destinationName, setDestinationName] = useState("");
  const [connectionNotes, setConnectionNotes] = useState("");
  const [channelEnabled, setChannelEnabled] = useState(true);
  const [eventOverrides, setEventOverrides] = useState<
    Record<string, OverrideChoice>
  >({});

  const summary = useMemo(() => {
    return users.reduce(
      (result, user) => {
        result.total += 1;

        if (user.telegram_connected) {
          result.connected += 1;
        } else {
          result.notConnected += 1;
        }

        if (user.telegram_connected && user.telegram_enabled) {
          result.enabled += 1;
        }

        return result;
      },
      {
        total: 0,
        connected: 0,
        notConnected: 0,
        enabled: 0,
      }
    );
  }, [users]);

  const loadUsers = useCallback(async () => {
    setLoading(true);

    try {
      const data = await rpc<NotificationUser[]>(
        "list_telegram_notification_users",
        {
          p_search: search || null,
          p_connection_status:
            connectionFilter === "All" ? null : connectionFilter,
        }
      );

      setUsers(data ?? []);
    } catch (error) {
      toast({
        title: "Unable to load Telegram users",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [connectionFilter, search, toast]);

  const loadRoleDefaults = useCallback(async () => {
    setRoleLoading(true);

    try {
      const [{ data: roleData, error: roleError }, { data, error }] =
        await Promise.all([
          supabase
            .from("app_roles")
            .select("role_id, role_code, role_name, sort_order")
            .eq("is_active", true)
            .order("sort_order", { ascending: true })
            .order("role_name", { ascending: true }),
          (supabase as any)
            .from("notification_role_event_defaults")
            .select("role_id, event_code, is_enabled")
            .in(
              "event_code",
              PHASE_ONE_EVENTS.map((event) => event.event_code)
            ),
        ]);

      if (roleError) throw roleError;
      if (error) throw error;

      setRoles((roleData ?? []) as RoleRow[]);
      setRoleDefaults((data ?? []) as RoleDefaultRow[]);
    } catch (error) {
      toast({
        title: "Unable to load role defaults",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setRoleLoading(false);
    }
  }, [toast]);

  const loadUserSettings = useCallback(
    async (authUserId: string) => {
      setSaving(true);

      try {
        const data = await rpc<UserSettings>(
          "get_user_telegram_notification_settings",
          {
            p_auth_user_id: authUserId,
          }
        );

        const nextOverrides = Object.fromEntries(
          (data.events ?? []).map((event) => [
            event.event_code,
            (event.override_value ?? "Default") as OverrideChoice,
          ])
        );

        setSettings(data);
        setSelectedUserId(authUserId);
        setTelegramChatId(data.channel?.telegram_chat_id ?? "");
        setDestinationName(
          data.channel?.destination_name ?? `${data.display_name} Telegram`
        );
        setConnectionNotes(data.channel?.connection_notes ?? "");
        setChannelEnabled(data.channel?.is_enabled ?? true);
        setEventOverrides(nextOverrides);
      } catch (error) {
        toast({
          title: "Unable to load user settings",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      } finally {
        setSaving(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (mode === "roles") {
      void loadRoleDefaults();
    }
  }, [loadRoleDefaults, mode]);

  const closeSettings = () => {
    if (saving) return;

    setSelectedUserId(null);
    setSettings(null);
    setTelegramChatId("");
    setDestinationName("");
    setConnectionNotes("");
    setChannelEnabled(true);
    setEventOverrides({});
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearch(searchInput.trim());
  };

  const saveTelegramChannel = async () => {
    if (!settings) return;

    if (telegramChatId.trim().length === 0) {
      toast({
        title: "Telegram Chat ID required",
        description: "Enter the Telegram Chat ID before saving.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      await rpc<string>("update_user_telegram_channel", {
        p_auth_user_id: settings.auth_user_id,
        p_telegram_chat_id: telegramChatId.trim(),
        p_destination_name: destinationName.trim() || null,
        p_is_enabled: channelEnabled,
        p_connection_notes: connectionNotes.trim() || null,
      });

      toast({
        title: "Telegram channel saved",
        description: `${settings.display_name} is now linked to Telegram.`,
      });

      await Promise.all([
        loadUsers(),
        loadUserSettings(settings.auth_user_id),
      ]);
    } catch (error) {
      toast({
        title: "Unable to save Telegram channel",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const setChannelStatus = async (isEnabled: boolean) => {
    if (!settings?.channel) return;

    setSaving(true);

    try {
      await rpc<void>("set_user_telegram_channel_enabled", {
        p_auth_user_id: settings.auth_user_id,
        p_is_enabled: isEnabled,
      });

      toast({
        title: isEnabled
          ? "Telegram notifications enabled"
          : "Telegram notifications disabled",
      });

      await Promise.all([
        loadUsers(),
        loadUserSettings(settings.auth_user_id),
      ]);
    } catch (error) {
      toast({
        title: "Unable to update Telegram status",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const disconnectChannel = async () => {
    if (!settings?.channel) return;

    const confirmed = window.confirm(
      `Disconnect Telegram for ${settings.display_name}?`
    );

    if (!confirmed) return;

    setSaving(true);

    try {
      await rpc<void>("disconnect_user_telegram_channel", {
        p_auth_user_id: settings.auth_user_id,
        p_reason: "Disconnected from Telegram Notifications UI.",
      });

      toast({
        title: "Telegram disconnected",
      });

      await Promise.all([
        loadUsers(),
        loadUserSettings(settings.auth_user_id),
      ]);
    } catch (error) {
      toast({
        title: "Unable to disconnect Telegram",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveEventOverride = async (
    eventCode: string,
    choice: OverrideChoice
  ) => {
    if (!settings) return;

    setSaving(true);

    try {
      await rpc<void>("set_user_notification_override", {
        p_auth_user_id: settings.auth_user_id,
        p_event_code: eventCode,
        p_override_value: choice,
        p_reason:
          choice === "Default"
            ? null
            : "Configured from Telegram Notifications UI.",
      });

      setEventOverrides((current) => ({
        ...current,
        [eventCode]: choice,
      }));

      await Promise.all([
        loadUsers(),
        loadUserSettings(settings.auth_user_id),
      ]);

      toast({
        title: "Notification setting updated",
      });
    } catch (error) {
      toast({
        title: "Unable to update notification setting",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetOverrides = async () => {
    if (!settings) return;

    const confirmed = window.confirm(
      `Return all Telegram events for ${settings.display_name} to role defaults?`
    );

    if (!confirmed) return;

    setSaving(true);

    try {
      await rpc<number>("reset_user_notification_overrides", {
        p_auth_user_id: settings.auth_user_id,
      });

      toast({
        title: "User overrides reset",
      });

      await Promise.all([
        loadUsers(),
        loadUserSettings(settings.auth_user_id),
      ]);
    } catch (error) {
      toast({
        title: "Unable to reset overrides",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateRoleDefault = async (
    roleId: string,
    eventCode: string,
    isEnabled: boolean
  ) => {
    setRoleLoading(true);

    try {
      await rpc<void>("update_notification_role_default", {
        p_role_id: roleId,
        p_event_code: eventCode,
        p_is_enabled: isEnabled,
      });

      setRoleDefaults((current) => {
        const withoutCurrent = current.filter(
          (row) =>
            !(
              row.role_id === roleId &&
              row.event_code === eventCode
            )
        );

        return [
          ...withoutCurrent,
          {
            role_id: roleId,
            event_code: eventCode,
            is_enabled: isEnabled,
          },
        ];
      });

      toast({
        title: "Role default updated",
      });
    } catch (error) {
      toast({
        title: "Unable to update role default",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setRoleLoading(false);
    }
  };

  const getRoleDefault = (roleId: string, eventCode: string) =>
    roleDefaults.find(
      (row) =>
        row.role_id === roleId &&
        row.event_code === eventCode
    )?.is_enabled ?? false;

  const selectedUser =
    users.find((user) => user.auth_user_id === selectedUserId) ?? null;

  return (
    <div className="w-full space-y-5 px-4 py-4 sm:px-5 lg:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BellRing className="h-6 w-6 text-[#9E4B4B]" />
            <h1 className="text-2xl font-semibold tracking-tight">
              Telegram Notifications
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect REDS users to Telegram and control Phase 1 notification events.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() =>
            mode === "users"
              ? void loadUsers()
              : void loadRoleDefaults()
          }
          disabled={loading || roleLoading}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${
              loading || roleLoading ? "animate-spin" : ""
            }`}
          />
          Refresh
        </Button>
      </div>

      <div className="inline-flex rounded-xl border bg-card p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setMode("users")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            mode === "users"
              ? "bg-[#9E4B4B] text-white"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          User Settings
        </button>
        <button
          type="button"
          onClick={() => setMode("roles")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            mode === "roles"
              ? "bg-[#9E4B4B] text-white"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          Role Defaults
        </button>
      </div>

      {mode === "users" ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Users shown", value: summary.total },
              { label: "Connected", value: summary.connected },
              { label: "Not connected", value: summary.notConnected },
              { label: "Notifications enabled", value: summary.enabled },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border bg-card p-4 shadow-sm"
              >
                <div className="text-sm text-muted-foreground">
                  {item.label}
                </div>
                <div className="mt-1 text-2xl font-semibold">
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row">
              <form
                onSubmit={handleSearch}
                className="flex min-w-0 flex-1 gap-2"
              >
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search name, email, employee code, or role"
                    className="bg-[#F7F9FB] pl-9 hover:border-[#9E4B4B]"
                  />
                </div>
                <Button type="submit">Search</Button>
              </form>

              <select
                value={connectionFilter}
                onChange={(event) =>
                  setConnectionFilter(
                    event.target.value as ConnectionFilter
                  )
                }
                className="h-10 rounded-md border border-input bg-[#F7F9FB] px-3 text-sm hover:border-[#9E4B4B] focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {connectionFilters.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] text-sm">
                <thead className="border-b bg-muted/40 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Telegram</th>
                    <th className="px-4 py-3 font-medium">Daily Report</th>
                    <th className="px-4 py-3 font-medium">Goods Receiving</th>
                    <th className="px-4 py-3 font-medium">Connected</th>
                    <th className="px-4 py-3 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-14 text-center">
                        <div className="mx-auto h-7 w-7 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-14 text-center text-muted-foreground"
                      >
                        No users match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr
                        key={user.auth_user_id}
                        className="align-top hover:bg-muted/20"
                      >
                        <td className="px-4 py-4">
                          <div className="font-medium">
                            {user.display_name || user.email}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {user.email}
                          </div>
                          {user.employee_code && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              {user.employee_code}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <div className="capitalize">
                            {roleLabel(user.role_codes)}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {user.account_status}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${connectionBadgeClass(
                              user
                            )}`}
                          >
                            {!user.telegram_connected
                              ? "Not connected"
                              : user.telegram_enabled
                                ? "Connected"
                                : "Disabled"}
                          </span>
                          {user.telegram_chat_id_masked && (
                            <div className="mt-2 font-mono text-xs text-muted-foreground">
                              {user.telegram_chat_id_masked}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${permissionBadgeClass(
                              user.daily_report_enabled
                            )}`}
                          >
                            {user.daily_report_enabled ? "Allowed" : "Denied"}
                          </span>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {user.daily_report_source}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${permissionBadgeClass(
                              user.goods_receiving_enabled
                            )}`}
                          >
                            {user.goods_receiving_enabled
                              ? "Allowed"
                              : "Denied"}
                          </span>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {user.goods_receiving_source}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-muted-foreground">
                          {formatDateTime(user.connected_at)}
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                void loadUserSettings(user.auth_user_id)
                              }
                            >
                              <Settings2 className="mr-1.5 h-4 w-4" />
                              Manage
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="border-b px-4 py-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#9E4B4B]" />
              <h2 className="font-semibold">Role notification defaults</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              A user override takes priority over these defaults. A user with
              several active roles is allowed when any active role allows the event.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="sticky left-0 z-10 min-w-[220px] bg-muted/95 px-4 py-3 text-left font-medium">
                    Role
                  </th>
                  {PHASE_ONE_EVENTS.map((event) => (
                    <th
                      key={event.event_code}
                      className="min-w-[165px] px-4 py-3 text-center font-medium"
                    >
                      <div>{event.short_name}</div>
                      <div className="mt-1 text-xs font-normal text-muted-foreground">
                        {event.group}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y">
                {roleLoading ? (
                  <tr>
                    <td
                      colSpan={PHASE_ONE_EVENTS.length + 1}
                      className="px-4 py-14 text-center"
                    >
                      <div className="mx-auto h-7 w-7 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </td>
                  </tr>
                ) : (
                  roles.map((role) => (
                    <tr key={role.role_id}>
                      <td className="sticky left-0 z-10 bg-card px-4 py-4">
                        <div className="font-medium">{role.role_name}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {role.role_code}
                        </div>
                      </td>

                      {PHASE_ONE_EVENTS.map((event) => {
                        const enabled = getRoleDefault(
                          role.role_id,
                          event.event_code
                        );

                        return (
                          <td
                            key={event.event_code}
                            className="px-4 py-4 text-center"
                          >
                            <button
                              type="button"
                              disabled={roleLoading}
                              onClick={() =>
                                void updateRoleDefault(
                                  role.role_id,
                                  event.event_code,
                                  !enabled
                                )
                              }
                              className={`inline-flex h-9 min-w-24 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition ${
                                enabled
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                                  : "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                              aria-label={`${role.role_name} ${event.full_name}`}
                            >
                              {enabled ? (
                                <>
                                  <Check className="mr-1.5 h-4 w-4" />
                                  Allow
                                </>
                              ) : (
                                <>
                                  <CircleOff className="mr-1.5 h-4 w-4" />
                                  Deny
                                </>
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedUserId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-3 py-4 sm:px-4 sm:py-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="telegram-settings-title"
        >
          <div className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border bg-background shadow-2xl">
            <div className="flex items-start justify-between border-b p-4 sm:p-5">
              <div>
                <h2
                  id="telegram-settings-title"
                  className="text-lg font-semibold"
                >
                  Telegram notification settings
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {settings?.display_name ||
                    selectedUser?.display_name ||
                    selectedUser?.email}
                </p>
              </div>

              <button
                type="button"
                onClick={closeSettings}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              {!settings ? (
                <div className="py-16 text-center">
                  <div className="mx-auto h-7 w-7 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : (
                <div className="space-y-5">
                  <section className="rounded-xl border bg-card p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Link2 className="h-5 w-5 text-[#9E4B4B]" />
                          <h3 className="font-semibold">
                            Telegram connection
                          </h3>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Chat ID is managed by an authorised REDS administrator.
                        </p>
                      </div>

                      <span
                        className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-medium ${
                          settings.channel?.connection_status === "Connected" &&
                          settings.channel.is_enabled
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-slate-200 bg-slate-100 text-slate-600"
                        }`}
                      >
                        {settings.channel?.connection_status ?? "Not connected"}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="telegram-destination-name">
                          Destination name
                        </Label>
                        <Input
                          id="telegram-destination-name"
                          value={destinationName}
                          onChange={(event) =>
                            setDestinationName(event.target.value)
                          }
                          placeholder="Example: Jason Telegram"
                          className="bg-[#F7F9FB] hover:border-[#9E4B4B]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="telegram-chat-id">
                          Telegram Chat ID
                        </Label>
                        <Input
                          id="telegram-chat-id"
                          value={telegramChatId}
                          onChange={(event) =>
                            setTelegramChatId(event.target.value)
                          }
                          placeholder="Telegram numeric chat ID"
                          className="bg-[#F7F9FB] font-mono hover:border-[#9E4B4B]"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="telegram-notes">
                          Connection notes
                        </Label>
                        <textarea
                          id="telegram-notes"
                          value={connectionNotes}
                          onChange={(event) =>
                            setConnectionNotes(event.target.value)
                          }
                          rows={3}
                          placeholder="Optional internal notes"
                          className="w-full resize-y rounded-md border border-input bg-[#F7F9FB] px-3 py-2 text-sm hover:border-[#9E4B4B] focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </div>

                    <label className="mt-4 flex items-start gap-3 rounded-lg border bg-muted/20 p-3">
                      <input
                        type="checkbox"
                        checked={channelEnabled}
                        onChange={(event) =>
                          setChannelEnabled(event.target.checked)
                        }
                        className="mt-0.5 h-4 w-4"
                      />
                      <span>
                        <span className="block text-sm font-medium">
                          Enable Telegram delivery
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          Event permissions are checked separately below.
                        </span>
                      </span>
                    </label>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={() => void saveTelegramChannel()}
                        disabled={saving}
                      >
                        <Link2 className="mr-2 h-4 w-4" />
                        Save connection
                      </Button>

                      {settings.channel && (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              void setChannelStatus(
                                !settings.channel!.is_enabled
                              )
                            }
                            disabled={saving}
                          >
                            {settings.channel.is_enabled ? (
                              <CircleOff className="mr-2 h-4 w-4" />
                            ) : (
                              <Check className="mr-2 h-4 w-4" />
                            )}
                            {settings.channel.is_enabled
                              ? "Disable delivery"
                              : "Enable delivery"}
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => void disconnectChannel()}
                            disabled={saving}
                          >
                            <Unlink className="mr-2 h-4 w-4" />
                            Disconnect
                          </Button>
                        </>
                      )}

                      <Button
                        type="button"
                        variant="outline"
                        disabled
                        title="The test-message RPC will be added after the settings UI is verified."
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Test message
                      </Button>
                    </div>
                  </section>

                  <section className="overflow-hidden rounded-xl border bg-card">
                    <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="font-semibold">
                          Phase 1 notification matrix
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Default uses the active role configuration. Allow or
                          Deny overrides the role for this user.
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void resetOverrides()}
                        disabled={saving}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset to role defaults
                      </Button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[760px] text-sm">
                        <thead className="border-b bg-muted/40 text-left">
                          <tr>
                            <th className="px-4 py-3 font-medium">Event</th>
                            <th className="px-4 py-3 font-medium">
                              Role default
                            </th>
                            <th className="px-4 py-3 font-medium">
                              User override
                            </th>
                            <th className="px-4 py-3 font-medium">
                              Effective result
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y">
                          {settings.events.map((event) => (
                            <tr key={event.event_code}>
                              <td className="px-4 py-4">
                                <div className="font-medium">
                                  {event.event_name}
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                  {event.category}
                                </div>
                              </td>

                              <td className="px-4 py-4">
                                <span
                                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${permissionBadgeClass(
                                    event.role_default_enabled
                                  )}`}
                                >
                                  {event.role_default_enabled
                                    ? "Allow"
                                    : "Deny"}
                                </span>
                              </td>

                              <td className="px-4 py-4">
                                <select
                                  value={
                                    eventOverrides[event.event_code] ??
                                    "Default"
                                  }
                                  onChange={(changeEvent) =>
                                    void saveEventOverride(
                                      event.event_code,
                                      changeEvent.target
                                        .value as OverrideChoice
                                    )
                                  }
                                  disabled={saving}
                                  className="h-9 rounded-md border border-input bg-[#F7F9FB] px-3 text-sm hover:border-[#9E4B4B] focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                  <option value="Default">Default</option>
                                  <option value="Allow">Allow</option>
                                  <option value="Deny">Deny</option>
                                </select>
                              </td>

                              <td className="px-4 py-4">
                                <span
                                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${permissionBadgeClass(
                                    event.effective_enabled
                                  )}`}
                                >
                                  {event.effective_enabled
                                    ? "Allowed"
                                    : "Denied"}
                                </span>
                                <div className="mt-1 text-xs text-muted-foreground">
                                  {event.permission_source}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t p-4 sm:p-5">
              <Button
                type="button"
                variant="outline"
                onClick={closeSettings}
                disabled={saving}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}