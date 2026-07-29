import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Ban,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  ShieldEllipsis,
  ShieldPlus,
  UserCog,
  UserRoundCheck,
  UserX,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";

type AppUserRow =
  Database["public"]["Functions"]["admin_list_app_users"]["Returns"][number];
type RoleRow = Database["public"]["Tables"]["app_roles"]["Row"];
type RoleMatrixRow =
  Database["public"]["Functions"]["get_role_permission_matrix"]["Returns"][number];
type UserMatrixRow =
  Database["public"]["Functions"]["get_user_permission_matrix"]["Returns"][number];
type AuditRow =
  Database["public"]["Functions"]["list_access_control_audit"]["Returns"][number];

type AccountStatus = "All" | "Pending" | "Active" | "Suspended" | "Rejected";
type ActionType = "approve" | "suspend" | "reject" | "reactivate";
type PageTab = "users" | "roles" | "overrides" | "audit";
type OverrideMode = "Default" | "Allow" | "Deny";

type ActionDialogState = {
  type: ActionType;
  user: AppUserRow;
} | null;

type RoleDraft = Record<string, boolean>;
type OverrideDraft = Record<string, OverrideMode>;

type CapabilityState = {
  usersView: boolean;
  manageAccounts: boolean;
  assignRoles: boolean;
  permissionsView: boolean;
  permissionsManage: boolean;
  manageOverrides: boolean;
};

const PAGE_SIZE = 20;
const AUDIT_PAGE_SIZE = 50;

const EMPTY_CAPABILITIES: CapabilityState = {
  usersView: false,
  manageAccounts: false,
  assignRoles: false,
  permissionsView: false,
  permissionsManage: false,
  manageOverrides: false,
};

const statusOptions: AccountStatus[] = [
  "All",
  "Pending",
  "Active",
  "Suspended",
  "Rejected",
];

const statusClasses: Record<string, string> = {
  Pending: "border-amber-200 bg-amber-50 text-amber-800",
  Active: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Suspended: "border-slate-300 bg-slate-100 text-slate-700",
  Rejected: "border-red-200 bg-red-50 text-red-800",
};

const permissionSourceClasses: Record<string, string> = {
  "User Allow": "border-emerald-200 bg-emerald-50 text-emerald-800",
  "User Deny": "border-red-200 bg-red-50 text-red-800",
  "Role Allow": "border-blue-200 bg-blue-50 text-blue-800",
  "Role Deny": "border-slate-300 bg-slate-100 text-slate-700",
  "Account Inactive": "border-amber-200 bg-amber-50 text-amber-800",
};

const inputClass =
  "h-11 rounded-xl border border-[#E5E7EB] bg-[#F7F9FB] px-3 text-sm transition hover:border-[#9E4B4B] focus:outline-none focus:ring-2 focus:ring-[#9E4B4B]/20";

const textareaClass =
  "w-full resize-y rounded-xl border border-[#E5E7EB] bg-[#F7F9FB] px-3 py-2.5 text-sm transition hover:border-[#9E4B4B] focus:outline-none focus:ring-2 focus:ring-[#9E4B4B]/20";

const formatDateTime = (value: string | null) => {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unknown database error.";

const groupByModule = <T extends { module_code: string }>(rows: T[]) => {
  const groups = new Map<string, T[]>();

  rows.forEach((row) => {
    const current = groups.get(row.module_code) ?? [];
    current.push(row);
    groups.set(row.module_code, current);
  });

  return Array.from(groups.entries());
};

export default function AdminUserManagement() {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<PageTab>("users");
  const [capabilities, setCapabilities] =
    useState<CapabilityState>(EMPTY_CAPABILITIES);

  const [users, setUsers] = useState<AppUserRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AccountStatus>("All");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [dialog, setDialog] = useState<ActionDialogState>(null);
  const [selectedRoleCode, setSelectedRoleCode] = useState("");
  const [reason, setReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [roleMatrix, setRoleMatrix] = useState<RoleMatrixRow[]>([]);
  const [roleDraft, setRoleDraft] = useState<RoleDraft>({});
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleSaving, setRoleSaving] = useState(false);
  const [roleReason, setRoleReason] = useState("");
  const [roleSearch, setRoleSearch] = useState("");

  const [selectedUserId, setSelectedUserId] = useState("");
  const [userMatrix, setUserMatrix] = useState<UserMatrixRow[]>([]);
  const [overrideDraft, setOverrideDraft] = useState<OverrideDraft>({});
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [overrideSaving, setOverrideSaving] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideSearch, setOverrideSearch] = useState("");
  const [roleAssignmentId, setRoleAssignmentId] = useState("");
  const [roleAssignmentReason, setRoleAssignmentReason] = useState("");
  const [roleAssignmentSaving, setRoleAssignmentSaving] = useState(false);

  const [auditRows, setAuditRows] = useState<AuditRow[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPage, setAuditPage] = useState(0);
  const [auditUserId, setAuditUserId] = useState("");
  const [auditRoleId, setAuditRoleId] = useState("");
  const [auditPermissionCode, setAuditPermissionCode] = useState("");
  const [auditChangeType, setAuditChangeType] = useState("");
  const [auditDateFrom, setAuditDateFrom] = useState("");
  const [auditDateTo, setAuditDateTo] = useState("");

  const totalCount = Number(users[0]?.total_count ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const auditTotalCount = Number(auditRows[0]?.total_row_count ?? 0);
  const auditTotalPages = Math.max(
    1,
    Math.ceil(auditTotalCount / AUDIT_PAGE_SIZE),
  );

  const selectedUser = useMemo(
    () => users.find((user) => user.auth_user_id === selectedUserId) ?? null,
    [selectedUserId, users],
  );

  const loadCapabilities = useCallback(async () => {
    const permissionCodes = [
      "users.view",
      "users.manage_accounts",
      "users.assign_roles",
      "permissions.view",
      "permissions.manage",
      "users.manage_permission_overrides",
    ] as const;

    const results = await Promise.all(
      permissionCodes.map((permissionCode) =>
        supabase.rpc("has_permission", {
          p_permission_code: permissionCode,
        }),
      ),
    );

    const firstError = results.find((result) => result.error)?.error;
    if (firstError) throw firstError;

    setCapabilities({
      usersView: Boolean(results[0].data),
      manageAccounts: Boolean(results[1].data),
      assignRoles: Boolean(results[2].data),
      permissionsView: Boolean(results[3].data),
      permissionsManage: Boolean(results[4].data),
      manageOverrides: Boolean(results[5].data),
    });
  }, []);

  const loadRoles = useCallback(async () => {
    const { data, error } = await supabase
      .from("app_roles")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("role_name", { ascending: true });

    if (error) throw error;

    const rows = data ?? [];
    setRoles(rows);
    setSelectedRoleId((current) => current || rows[0]?.role_id || "");
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc("admin_list_app_users", {
        p_limit: PAGE_SIZE,
        p_offset: page * PAGE_SIZE,
        p_search: search || undefined,
        p_status: status === "All" ? undefined : status,
      });

      if (error) throw error;

      const rows = data ?? [];
      setUsers(rows);
      setSelectedUserId((current) => {
        if (current && rows.some((row) => row.auth_user_id === current)) {
          return current;
        }
        return rows.find((row) => row.account_status === "Active")?.auth_user_id ??
          rows[0]?.auth_user_id ??
          "";
      });
    } catch (error) {
      toast({
        title: "Unable to load users",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, status, toast]);

  const loadRoleMatrix = useCallback(async () => {
    if (!selectedRoleId || !capabilities.permissionsView) {
      setRoleMatrix([]);
      setRoleDraft({});
      return;
    }

    setRoleLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_role_permission_matrix", {
        p_role_id: selectedRoleId,
      });

      if (error) throw error;

      const rows = data ?? [];
      setRoleMatrix(rows);
      setRoleDraft(
        Object.fromEntries(
          rows.map((row) => [row.permission_id, Boolean(row.is_allowed)]),
        ),
      );
    } catch (error) {
      toast({
        title: "Unable to load role permissions",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setRoleLoading(false);
    }
  }, [capabilities.permissionsView, selectedRoleId, toast]);

  const loadUserMatrix = useCallback(async () => {
    if (!selectedUserId || !capabilities.permissionsView) {
      setUserMatrix([]);
      setOverrideDraft({});
      return;
    }

    setOverrideLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_user_permission_matrix", {
        p_auth_user_id: selectedUserId,
      });

      if (error) throw error;

      const rows = data ?? [];
      setUserMatrix(rows);
      setOverrideDraft(
        Object.fromEntries(
          rows.map((row) => [
            row.permission_id,
            row.override_is_active
              ? row.override_is_allowed
                ? "Allow"
                : "Deny"
              : "Default",
          ]),
        ),
      );
      setRoleAssignmentId(rows[0]?.role_id ?? "");
    } catch (error) {
      toast({
        title: "Unable to load user permissions",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setOverrideLoading(false);
    }
  }, [capabilities.permissionsView, selectedUserId, toast]);

  const loadAudit = useCallback(async () => {
    if (!capabilities.permissionsView) {
      setAuditRows([]);
      return;
    }

    setAuditLoading(true);
    try {
      const { data, error } = await supabase.rpc("list_access_control_audit", {
        p_change_type: auditChangeType || undefined,
        p_date_from: auditDateFrom || undefined,
        p_date_to: auditDateTo || undefined,
        p_limit: AUDIT_PAGE_SIZE,
        p_offset: auditPage * AUDIT_PAGE_SIZE,
        p_permission_code: auditPermissionCode.trim() || undefined,
        p_target_auth_user_id: auditUserId || undefined,
        p_target_role_id: auditRoleId || undefined,
      });

      if (error) throw error;
      setAuditRows(data ?? []);
    } catch (error) {
      toast({
        title: "Unable to load access history",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setAuditLoading(false);
    }
  }, [
    auditChangeType,
    auditDateFrom,
    auditDateTo,
    auditPage,
    auditPermissionCode,
    auditRoleId,
    auditUserId,
    capabilities.permissionsView,
    toast,
  ]);

  useEffect(() => {
    void Promise.all([loadCapabilities(), loadRoles()]).catch((error) => {
      toast({
        title: "Unable to initialise access management",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    });
  }, [loadCapabilities, loadRoles, toast]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (activeTab === "roles") void loadRoleMatrix();
  }, [activeTab, loadRoleMatrix]);

  useEffect(() => {
    if (activeTab === "overrides") void loadUserMatrix();
  }, [activeTab, loadUserMatrix]);

  useEffect(() => {
    if (activeTab === "audit") void loadAudit();
  }, [activeTab, loadAudit]);

  const summary = useMemo(() => {
    const initial = { Pending: 0, Active: 0, Suspended: 0, Rejected: 0 };

    return users.reduce((result, user) => {
      const key = user.account_status as keyof typeof initial;
      if (key in result) result[key] += 1;
      return result;
    }, initial);
  }, [users]);

  const filteredRoleMatrix = useMemo(() => {
    const normalized = roleSearch.trim().toLowerCase();
    if (!normalized) return roleMatrix;

    return roleMatrix.filter((row) =>
      [
        row.permission_code,
        row.permission_name,
        row.description,
        row.module_code,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalized)),
    );
  }, [roleMatrix, roleSearch]);

  const filteredUserMatrix = useMemo(() => {
    const normalized = overrideSearch.trim().toLowerCase();
    if (!normalized) return userMatrix;

    return userMatrix.filter((row) =>
      [
        row.permission_code,
        row.permission_name,
        row.description,
        row.module_code,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalized)),
    );
  }, [overrideSearch, userMatrix]);

  const roleChanges = useMemo(
    () =>
      roleMatrix.filter(
        (row) => roleDraft[row.permission_id] !== Boolean(row.is_allowed),
      ),
    [roleDraft, roleMatrix],
  );

  const overrideChanges = useMemo(
    () =>
      userMatrix.filter((row) => {
        const originalMode: OverrideMode = row.override_is_active
          ? row.override_is_allowed
            ? "Allow"
            : "Deny"
          : "Default";
        return overrideDraft[row.permission_id] !== originalMode;
      }),
    [overrideDraft, userMatrix],
  );

  const tabs = useMemo(
    () => [
      { id: "users" as const, label: "Users", visible: capabilities.usersView },
      {
        id: "roles" as const,
        label: "Role Permissions",
        visible: capabilities.permissionsView,
      },
      {
        id: "overrides" as const,
        label: "User Overrides",
        visible: capabilities.permissionsView || capabilities.manageOverrides,
      },
      {
        id: "audit" as const,
        label: "Audit History",
        visible: capabilities.permissionsView,
      },
    ],
    [capabilities],
  );

  const openDialog = (type: ActionType, user: AppUserRow) => {
    setDialog({ type, user });
    setSelectedRoleCode(user.role_code || roles[0]?.role_code || "");
    setReason("");
    setAdminNotes(user.admin_notes || "");
  };

  const closeDialog = () => {
    if (actionLoading) return;
    setDialog(null);
    setSelectedRoleCode("");
    setReason("");
    setAdminNotes("");
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(0);
    setSearch(searchInput.trim());
  };

  const runAction = async () => {
    if (!dialog) return;

    if (
      (dialog.type === "approve" || dialog.type === "reactivate") &&
      !selectedRoleCode
    ) {
      toast({
        title: "Role required",
        description: "Select a role before continuing.",
        variant: "destructive",
      });
      return;
    }

    if (
      (dialog.type === "suspend" || dialog.type === "reject") &&
      reason.trim().length < 3
    ) {
      toast({
        title: "Reason required",
        description: "Enter a clear reason before continuing.",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);
    try {
      if (dialog.type === "approve") {
        const { error } = await supabase.rpc("approve_app_user_atomic", {
          p_auth_user_id: dialog.user.auth_user_id,
          p_role_code: selectedRoleCode,
          p_admin_notes: adminNotes.trim() || undefined,
        });
        if (error) throw error;
      }

      if (dialog.type === "reactivate") {
        const { error } = await supabase.rpc("reactivate_app_user_atomic", {
          p_auth_user_id: dialog.user.auth_user_id,
          p_role_code: selectedRoleCode,
          p_admin_notes: adminNotes.trim() || undefined,
        });
        if (error) throw error;
      }

      if (dialog.type === "suspend") {
        const { error } = await supabase.rpc("suspend_app_user_atomic", {
          p_auth_user_id: dialog.user.auth_user_id,
          p_reason: reason.trim(),
        });
        if (error) throw error;
      }

      if (dialog.type === "reject") {
        const { error } = await supabase.rpc("reject_app_user_atomic", {
          p_auth_user_id: dialog.user.auth_user_id,
          p_reason: reason.trim(),
        });
        if (error) throw error;
      }

      toast({
        title: "Account updated",
        description: `${dialog.user.email} was updated successfully.`,
      });

      closeDialog();
      await loadUsers();
    } catch (error) {
      toast({
        title: "Account update failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const saveRolePermissions = async () => {
    if (!selectedRoleId || roleChanges.length === 0) return;

    setRoleSaving(true);
    try {
      const changes: Json = roleChanges.map((row) => ({
        permission_id: row.permission_id,
        is_allowed: roleDraft[row.permission_id],
      }));

      const { error } = await supabase.rpc("update_role_permissions_atomic", {
        p_changes: changes,
        p_reason: roleReason.trim() || undefined,
        p_role_id: selectedRoleId,
      });

      if (error) throw error;

      toast({
        title: "Role permissions saved",
        description: `${roleChanges.length} permission change(s) were applied.`,
      });
      setRoleReason("");
      await loadRoleMatrix();
    } catch (error) {
      toast({
        title: "Unable to save role permissions",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setRoleSaving(false);
    }
  };

  const saveOverrides = async () => {
    if (!selectedUserId || overrideChanges.length === 0) return;

    setOverrideSaving(true);
    try {
      const changes: Json = overrideChanges.map((row) => ({
        permission_id: row.permission_id,
        mode: overrideDraft[row.permission_id],
      }));

      const { error } = await supabase.rpc(
        "update_user_permission_overrides_atomic",
        {
          p_auth_user_id: selectedUserId,
          p_changes: changes,
          p_reason: overrideReason.trim() || undefined,
        },
      );

      if (error) throw error;

      toast({
        title: "User overrides saved",
        description: `${overrideChanges.length} override change(s) were applied.`,
      });
      setOverrideReason("");
      await loadUserMatrix();
    } catch (error) {
      toast({
        title: "Unable to save user overrides",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setOverrideSaving(false);
    }
  };

  const resetAllOverrides = async () => {
    if (!selectedUserId) return;

    setOverrideSaving(true);
    try {
      const { error } = await supabase.rpc(
        "reset_user_permission_overrides_atomic",
        {
          p_auth_user_id: selectedUserId,
          p_reason: overrideReason.trim() || "Reset all user overrides",
        },
      );

      if (error) throw error;

      toast({
        title: "Overrides reset",
        description: "The user now follows role defaults for every permission.",
      });
      setOverrideReason("");
      await loadUserMatrix();
    } catch (error) {
      toast({
        title: "Unable to reset overrides",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setOverrideSaving(false);
    }
  };

  const assignSelectedUserRole = async () => {
    if (!selectedUserId || !roleAssignmentId) return;

    setRoleAssignmentSaving(true);
    try {
      const { error } = await supabase.rpc("assign_user_role_atomic", {
        p_auth_user_id: selectedUserId,
        p_reason: roleAssignmentReason.trim() || undefined,
        p_role_id: roleAssignmentId,
      });

      if (error) throw error;

      toast({
        title: "Role assigned",
        description: "The active role was updated successfully.",
      });
      setRoleAssignmentReason("");
      await Promise.all([loadUsers(), loadUserMatrix()]);
    } catch (error) {
      toast({
        title: "Unable to assign role",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setRoleAssignmentSaving(false);
    }
  };

  const actionTitle =
    dialog?.type === "approve"
      ? "Approve account"
      : dialog?.type === "reactivate"
        ? "Reactivate account"
        : dialog?.type === "suspend"
          ? "Suspend account"
          : "Reject registration";

  const renderLoadingRow = (colSpan: number) => (
    <tr>
      <td colSpan={colSpan} className="px-4 py-14 text-center">
        <div className="mx-auto h-7 w-7 animate-spin rounded-full border-4 border-[#9E4B4B] border-t-transparent" />
      </td>
    </tr>
  );

  return (
    <div className="w-full space-y-5 bg-[#F8FAFC] px-4 py-4 sm:px-5 lg:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <UserCog className="h-6 w-6 text-[#9E4B4B]" />
            <h1 className="text-2xl font-semibold tracking-tight">
              Users & Permissions
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage accounts, role defaults, individual overrides, and access history.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void loadUsers();
            if (activeTab === "roles") void loadRoleMatrix();
            if (activeTab === "overrides") void loadUserMatrix();
            if (activeTab === "audit") void loadAudit();
          }}
          disabled={loading || roleLoading || overrideLoading || auditLoading}
          className="h-11 rounded-xl"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${
              loading || roleLoading || overrideLoading || auditLoading
                ? "animate-spin"
                : ""
            }`}
          />
          Refresh
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#E5E7EB] bg-white p-2 shadow-sm">
        <div className="flex min-w-max gap-2">
          {tabs
            .filter((tab) => tab.visible)
            .map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`h-10 rounded-xl px-4 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? "bg-[#8B3F3F] text-white shadow-sm"
                    : "text-muted-foreground hover:bg-[#FBF1F1] hover:text-[#7F3030]"
                }`}
              >
                {tab.label}
              </button>
            ))}
        </div>
      </div>

      {activeTab === "users" && (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {(["Pending", "Active", "Suspended", "Rejected"] as const).map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setStatus(item);
                    setPage(0);
                  }}
                  className="rounded-2xl border border-[#E5E7EB] bg-white p-4 text-left shadow-sm transition hover:border-[#9E4B4B]"
                >
                  <div className="text-sm text-muted-foreground">{item}</div>
                  <div className="mt-1 text-2xl font-semibold">{summary[item]}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    On this result page
                  </div>
                </button>
              ),
            )}
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row">
              <form onSubmit={handleSearch} className="flex min-w-0 flex-1 gap-2">
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search name, email, or phone"
                    className="h-11 rounded-xl bg-[#F7F9FB] pl-9 hover:border-[#9E4B4B]"
                  />
                </div>
                <Button type="submit" className="h-11 rounded-xl">
                  Search
                </Button>
              </form>

              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as AccountStatus);
                  setPage(0);
                }}
                className={inputClass}
              >
                {statusOptions.map((item) => (
                  <option key={item} value={item}>
                    {item === "All" ? "All statuses" : item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-sm">
                <thead className="border-b bg-slate-50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Registered</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    renderLoadingRow(6)
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-14 text-center text-muted-foreground">
                        No users match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.auth_user_id} className="align-top hover:bg-slate-50/60">
                        <td className="px-4 py-4">
                          <div className="font-medium">{user.display_name || "Unnamed user"}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{user.email}</div>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">{user.phone || "—"}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusClasses[user.account_status] || "border-border bg-muted text-muted-foreground"}`}>
                            {user.account_status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div>{user.role_name || "No role assigned"}</div>
                          {user.role_code && (
                            <div className="mt-1 text-xs text-muted-foreground">{user.role_code}</div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">{formatDateTime(user.created_at)}</td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            {user.account_status === "Pending" && capabilities.manageAccounts && (
                              <>
                                <Button type="button" size="sm" onClick={() => openDialog("approve", user)}>
                                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                                  Approve
                                </Button>
                                <Button type="button" size="sm" variant="outline" onClick={() => openDialog("reject", user)}>
                                  <UserX className="mr-1.5 h-4 w-4" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {user.account_status === "Active" && capabilities.manageAccounts && (
                              <Button type="button" size="sm" variant="outline" onClick={() => openDialog("suspend", user)}>
                                <Ban className="mr-1.5 h-4 w-4" />
                                Suspend
                              </Button>
                            )}
                            {(user.account_status === "Suspended" || user.account_status === "Rejected") && capabilities.manageAccounts && (
                              <Button type="button" size="sm" onClick={() => openDialog("reactivate", user)}>
                                <ShieldCheck className="mr-1.5 h-4 w-4" />
                                Reactivate
                              </Button>
                            )}
                            {(capabilities.permissionsView || capabilities.manageOverrides) && user.account_status === "Active" && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedUserId(user.auth_user_id);
                                  setActiveTab("overrides");
                                }}
                              >
                                <ShieldEllipsis className="mr-1.5 h-4 w-4" />
                                Access
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                {totalCount === 0
                  ? "0 users"
                  : `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, totalCount)} of ${totalCount}`}
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" disabled={page === 0 || loading} onClick={() => setPage((current) => Math.max(0, current - 1))}>
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
                <Button type="button" variant="outline" size="sm" disabled={page + 1 >= totalPages || loading} onClick={() => setPage((current) => current + 1)}>
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "roles" && capabilities.permissionsView && (
        <div className="space-y-4">
          <div className="grid gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm lg:grid-cols-[280px_1fr_auto]">
            <div className="space-y-2">
              <Label htmlFor="role-matrix-role">Role</Label>
              <select id="role-matrix-role" value={selectedRoleId} onChange={(event) => setSelectedRoleId(event.target.value)} className={`${inputClass} w-full`}>
                {roles.map((role) => (
                  <option key={role.role_id} value={role.role_id}>{role.role_name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-search">Search permissions</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="role-search" value={roleSearch} onChange={(event) => setRoleSearch(event.target.value)} placeholder="Permission code, name, or module" className="h-11 rounded-xl bg-[#F7F9FB] pl-9 hover:border-[#9E4B4B]" />
              </div>
            </div>
            <div className="flex items-end">
              <Button type="button" variant="outline" onClick={() => void loadRoleMatrix()} disabled={roleLoading} className="h-11 rounded-xl">
                <RefreshCw className={`mr-2 h-4 w-4 ${roleLoading ? "animate-spin" : ""}`} />
                Reload
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
            <div className="max-h-[62vh] overflow-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="sticky top-0 z-20 border-b bg-slate-50 text-left shadow-sm">
                  <tr>
                    <th className="sticky left-0 z-30 min-w-[360px] bg-slate-50 px-4 py-3 font-medium">Permission</th>
                    <th className="px-4 py-3 font-medium">Module</th>
                    <th className="px-4 py-3 text-center font-medium">Role Default</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {roleLoading ? renderLoadingRow(3) : groupByModule(filteredRoleMatrix).map(([moduleCode, rows]) => (
                    <FragmentRoleGroup
                      key={moduleCode}
                      moduleCode={moduleCode}
                      rows={rows}
                      draft={roleDraft}
                      editable={capabilities.permissionsManage}
                      onChange={(permissionId, allowed) => setRoleDraft((current) => ({ ...current, [permissionId]: allowed }))}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 border-t p-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="space-y-2">
                <Label htmlFor="role-reason">Change reason</Label>
                <Input id="role-reason" value={roleReason} onChange={(event) => setRoleReason(event.target.value)} placeholder="Recommended for audit clarity" className="h-11 rounded-xl bg-[#F7F9FB] hover:border-[#9E4B4B]" disabled={!capabilities.permissionsManage} />
              </div>
              <Button type="button" onClick={() => void saveRolePermissions()} disabled={!capabilities.permissionsManage || roleSaving || roleChanges.length === 0} className="h-11 rounded-xl bg-[#8B3F3F] hover:bg-[#753434]">
                <Save className="mr-2 h-4 w-4" />
                {roleSaving ? "Saving..." : `Save ${roleChanges.length || ""} Change${roleChanges.length === 1 ? "" : "s"}`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "overrides" && (capabilities.permissionsView || capabilities.manageOverrides) && (
        <div className="space-y-4">
          <div className="grid gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm xl:grid-cols-[minmax(260px,1fr)_minmax(220px,0.7fr)_auto]">
            <div className="space-y-2">
              <Label htmlFor="override-user">User</Label>
              <select id="override-user" value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} className={`${inputClass} w-full`}>
                <option value="">Select user</option>
                {users.map((user) => (
                  <option key={user.auth_user_id} value={user.auth_user_id}>{user.display_name || user.email} — {user.account_status}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="override-search">Search permissions</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="override-search" value={overrideSearch} onChange={(event) => setOverrideSearch(event.target.value)} placeholder="Permission code, name, or module" className="h-11 rounded-xl bg-[#F7F9FB] pl-9 hover:border-[#9E4B4B]" />
              </div>
            </div>
            <div className="flex items-end">
              <Button type="button" variant="outline" onClick={() => void loadUserMatrix()} disabled={!selectedUserId || overrideLoading} className="h-11 rounded-xl">
                <RefreshCw className={`mr-2 h-4 w-4 ${overrideLoading ? "animate-spin" : ""}`} />
                Reload
              </Button>
            </div>
          </div>

          {selectedUser && capabilities.assignRoles && (
            <div className="grid gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm lg:grid-cols-[280px_1fr_auto] lg:items-end">
              <div className="space-y-2">
                <Label htmlFor="assigned-role">Assigned role</Label>
                <select id="assigned-role" value={roleAssignmentId} onChange={(event) => setRoleAssignmentId(event.target.value)} className={`${inputClass} w-full`}>
                  <option value="">Select role</option>
                  {roles.map((role) => (
                    <option key={role.role_id} value={role.role_id}>{role.role_name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role-assignment-reason">Role change reason</Label>
                <Input id="role-assignment-reason" value={roleAssignmentReason} onChange={(event) => setRoleAssignmentReason(event.target.value)} placeholder="Reason recorded in access audit" className="h-11 rounded-xl bg-[#F7F9FB] hover:border-[#9E4B4B]" />
              </div>
              <Button type="button" onClick={() => void assignSelectedUserRole()} disabled={!roleAssignmentId || roleAssignmentSaving} className="h-11 rounded-xl">
                <UserRoundCheck className="mr-2 h-4 w-4" />
                {roleAssignmentSaving ? "Assigning..." : "Assign Role"}
              </Button>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
            <div className="max-h-[62vh] overflow-auto">
              <table className="w-full min-w-[1180px] text-sm">
                <thead className="sticky top-0 z-20 border-b bg-slate-50 text-left shadow-sm">
                  <tr>
                    <th className="sticky left-0 z-30 min-w-[350px] bg-slate-50 px-4 py-3 font-medium">Permission</th>
                    <th className="px-4 py-3 font-medium">Role Default</th>
                    <th className="px-4 py-3 font-medium">User Override</th>
                    <th className="px-4 py-3 font-medium">Effective Access</th>
                    <th className="px-4 py-3 font-medium">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {overrideLoading ? renderLoadingRow(5) : selectedUserId ? groupByModule(filteredUserMatrix).map(([moduleCode, rows]) => (
                    <FragmentUserGroup
                      key={moduleCode}
                      moduleCode={moduleCode}
                      rows={rows}
                      draft={overrideDraft}
                      editable={capabilities.manageOverrides}
                      onChange={(permissionId, mode) => setOverrideDraft((current) => ({ ...current, [permissionId]: mode }))}
                    />
                  )) : (
                    <tr><td colSpan={5} className="px-4 py-14 text-center text-muted-foreground">Select a user to review effective permissions.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 border-t p-4 xl:grid-cols-[1fr_auto_auto] xl:items-end">
              <div className="space-y-2">
                <Label htmlFor="override-reason">Override reason</Label>
                <Input id="override-reason" value={overrideReason} onChange={(event) => setOverrideReason(event.target.value)} placeholder="Reason recorded for Allow, Deny, or Reset" className="h-11 rounded-xl bg-[#F7F9FB] hover:border-[#9E4B4B]" disabled={!capabilities.manageOverrides} />
              </div>
              <Button type="button" variant="outline" onClick={() => void resetAllOverrides()} disabled={!capabilities.manageOverrides || !selectedUserId || overrideSaving} className="h-11 rounded-xl">
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset All
              </Button>
              <Button type="button" onClick={() => void saveOverrides()} disabled={!capabilities.manageOverrides || overrideSaving || overrideChanges.length === 0} className="h-11 rounded-xl bg-[#8B3F3F] hover:bg-[#753434]">
                <Save className="mr-2 h-4 w-4" />
                {overrideSaving ? "Saving..." : `Save ${overrideChanges.length || ""} Change${overrideChanges.length === 1 ? "" : "s"}`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "audit" && capabilities.permissionsView && (
        <div className="space-y-4">
          <div className="grid gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-6">
            <select value={auditUserId} onChange={(event) => { setAuditUserId(event.target.value); setAuditPage(0); }} className={inputClass}>
              <option value="">All users</option>
              {users.map((user) => <option key={user.auth_user_id} value={user.auth_user_id}>{user.display_name || user.email}</option>)}
            </select>
            <select value={auditRoleId} onChange={(event) => { setAuditRoleId(event.target.value); setAuditPage(0); }} className={inputClass}>
              <option value="">All roles</option>
              {roles.map((role) => <option key={role.role_id} value={role.role_id}>{role.role_name}</option>)}
            </select>
            <Input value={auditPermissionCode} onChange={(event) => setAuditPermissionCode(event.target.value)} placeholder="Permission code" className="h-11 rounded-xl bg-[#F7F9FB] hover:border-[#9E4B4B]" />
            <Input type="date" value={auditDateFrom} onChange={(event) => { setAuditDateFrom(event.target.value); setAuditPage(0); }} className="h-11 rounded-xl bg-[#F7F9FB] hover:border-[#9E4B4B]" />
            <Input type="date" value={auditDateTo} onChange={(event) => { setAuditDateTo(event.target.value); setAuditPage(0); }} className="h-11 rounded-xl bg-[#F7F9FB] hover:border-[#9E4B4B]" />
            <Button type="button" onClick={() => void loadAudit()} disabled={auditLoading} className="h-11 rounded-xl">
              <Search className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1250px] text-sm">
                <thead className="border-b bg-slate-50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Changed</th>
                    <th className="px-4 py-3 font-medium">Change</th>
                    <th className="px-4 py-3 font-medium">Target</th>
                    <th className="px-4 py-3 font-medium">Permission</th>
                    <th className="px-4 py-3 font-medium">Reason</th>
                    <th className="px-4 py-3 font-medium">Changed by</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {auditLoading ? renderLoadingRow(6) : auditRows.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-14 text-center text-muted-foreground">No access-control history matches the filters.</td></tr>
                  ) : auditRows.map((row) => (
                    <tr key={row.access_control_audit_id} className="align-top hover:bg-slate-50/60">
                      <td className="px-4 py-4 text-muted-foreground"><Clock3 className="mr-1.5 inline h-4 w-4" />{formatDateTime(row.changed_at)}</td>
                      <td className="px-4 py-4 font-medium">{row.change_type}</td>
                      <td className="px-4 py-4">
                        <div>{row.target_user_name || row.target_role_name || "System"}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{row.target_user_email || row.target_role_code || "—"}</div>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs">{row.permission_code || "—"}</td>
                      <td className="max-w-[320px] px-4 py-4 text-muted-foreground">{row.reason || "—"}</td>
                      <td className="px-4 py-4">
                        <div>{row.changed_by_name || row.changed_by_email || "System"}</div>
                        {row.changed_by_name && <div className="mt-1 text-xs text-muted-foreground">{row.changed_by_email}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">{auditTotalCount} audit record{auditTotalCount === 1 ? "" : "s"}</div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" disabled={auditPage === 0 || auditLoading} onClick={() => setAuditPage((current) => Math.max(0, current - 1))}><ChevronLeft className="mr-1 h-4 w-4" />Previous</Button>
                <span className="text-sm text-muted-foreground">Page {auditPage + 1} of {auditTotalPages}</span>
                <Button type="button" variant="outline" size="sm" disabled={auditPage + 1 >= auditTotalPages || auditLoading} onClick={() => setAuditPage((current) => current + 1)}>Next<ChevronRight className="ml-1 h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-8" role="dialog" aria-modal="true" aria-labelledby="account-action-title">
          <div className="w-full max-w-lg rounded-2xl border border-[#E5E7EB] bg-background shadow-2xl">
            <div className="flex items-start justify-between border-b p-5">
              <div>
                <h2 id="account-action-title" className="text-lg font-semibold">{actionTitle}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{dialog.user.display_name || dialog.user.email}</p>
              </div>
              <button type="button" onClick={closeDialog} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 p-5">
              {(dialog.type === "approve" || dialog.type === "reactivate") && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="account-role">Role</Label>
                    <select id="account-role" value={selectedRoleCode} onChange={(event) => setSelectedRoleCode(event.target.value)} className={`${inputClass} w-full`}>
                      <option value="">Select role</option>
                      {roles.map((role) => <option key={role.role_id} value={role.role_code}>{role.role_name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-notes">Admin notes</Label>
                    <textarea id="admin-notes" value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} rows={4} placeholder="Optional internal notes" className={textareaClass} />
                  </div>
                </>
              )}
              {(dialog.type === "suspend" || dialog.type === "reject") && (
                <div className="space-y-2">
                  <Label htmlFor="account-reason">{dialog.type === "suspend" ? "Suspension reason" : "Rejection reason"}</Label>
                  <textarea id="account-reason" value={reason} onChange={(event) => setReason(event.target.value)} rows={4} placeholder="Enter the reason for this action" className={textareaClass} />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t p-5">
              <Button type="button" variant="outline" onClick={closeDialog} disabled={actionLoading}>Cancel</Button>
              <Button type="button" onClick={() => void runAction()} disabled={actionLoading} className={dialog.type === "suspend" || dialog.type === "reject" ? "bg-[#9E4B4B] text-white hover:bg-[#873f3f]" : ""}>{actionLoading ? "Saving..." : "Confirm"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type RoleGroupProps = {
  moduleCode: string;
  rows: RoleMatrixRow[];
  draft: RoleDraft;
  editable: boolean;
  onChange: (permissionId: string, allowed: boolean) => void;
};

function FragmentRoleGroup({ moduleCode, rows, draft, editable, onChange }: RoleGroupProps) {
  return (
    <>
      <tr className="bg-[#FBF1F1]">
        <td colSpan={3} className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#7F3030]">{moduleCode.replace(/_/g, " ")}</td>
      </tr>
      {rows.map((row) => (
        <tr key={row.permission_id} className="hover:bg-slate-50/60">
          <td className="sticky left-0 z-10 bg-white px-4 py-3">
            <div className="font-medium">{row.permission_name}</div>
            <div className="mt-1 font-mono text-xs text-muted-foreground">{row.permission_code}</div>
            {row.description && <div className="mt-1 text-xs text-muted-foreground">{row.description}</div>}
          </td>
          <td className="px-4 py-3 text-muted-foreground">{row.module_code}</td>
          <td className="px-4 py-3 text-center">
            <button
              type="button"
              disabled={!editable}
              onClick={() => onChange(row.permission_id, !draft[row.permission_id])}
              className={`inline-flex h-8 min-w-[88px] items-center justify-center rounded-full border px-3 text-xs font-semibold transition ${draft[row.permission_id] ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-300 bg-slate-100 text-slate-700"} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {draft[row.permission_id] ? "Allow" : "Deny"}
            </button>
          </td>
        </tr>
      ))}
    </>
  );
}

type UserGroupProps = {
  moduleCode: string;
  rows: UserMatrixRow[];
  draft: OverrideDraft;
  editable: boolean;
  onChange: (permissionId: string, mode: OverrideMode) => void;
};

function FragmentUserGroup({ moduleCode, rows, draft, editable, onChange }: UserGroupProps) {
  return (
    <>
      <tr className="bg-[#FBF1F1]">
        <td colSpan={5} className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#7F3030]">{moduleCode.replace(/_/g, " ")}</td>
      </tr>
      {rows.map((row) => (
        <tr key={row.permission_id} className="hover:bg-slate-50/60">
          <td className="sticky left-0 z-10 bg-white px-4 py-3">
            <div className="font-medium">{row.permission_name}</div>
            <div className="mt-1 font-mono text-xs text-muted-foreground">{row.permission_code}</div>
            {row.description && <div className="mt-1 text-xs text-muted-foreground">{row.description}</div>}
          </td>
          <td className="px-4 py-3"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${row.role_is_allowed ? "border-blue-200 bg-blue-50 text-blue-800" : "border-slate-300 bg-slate-100 text-slate-700"}`}>{row.role_is_allowed ? "Allow" : "Deny"}</span></td>
          <td className="px-4 py-3">
            <div className="relative inline-flex">
              <select
                value={draft[row.permission_id] ?? "Default"}
                onChange={(event) => onChange(row.permission_id, event.target.value as OverrideMode)}
                disabled={!editable}
                className="h-9 appearance-none rounded-xl border border-[#E5E7EB] bg-[#F7F9FB] pl-3 pr-9 text-sm hover:border-[#9E4B4B] focus:outline-none focus:ring-2 focus:ring-[#9E4B4B]/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="Default">Default</option>
                <option value="Allow">Allow</option>
                <option value="Deny">Deny</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </td>
          <td className="px-4 py-3"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${row.effective_is_allowed ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>{row.effective_is_allowed ? "Allowed" : "Denied"}</span></td>
          <td className="px-4 py-3"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${permissionSourceClasses[row.permission_source] || "border-border bg-muted text-muted-foreground"}`}>{row.permission_source}</span></td>
        </tr>
      ))}
    </>
  );
}