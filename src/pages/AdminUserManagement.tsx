import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCog,
  UserX,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type AppUserRow =
  Database["public"]["Functions"]["admin_list_app_users"]["Returns"][number];

type RoleRow = Database["public"]["Tables"]["app_roles"]["Row"];

type AccountStatus = "All" | "Pending" | "Active" | "Suspended" | "Rejected";
type ActionType = "approve" | "suspend" | "reject" | "reactivate";

type ActionDialogState = {
  type: ActionType;
  user: AppUserRow;
} | null;

const PAGE_SIZE = 20;

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

const formatDateTime = (value: string | null) => {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export default function AdminUserManagement() {
  const { toast } = useToast();

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

  const totalCount = users[0]?.total_count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const loadRoles = useCallback(async () => {
    const { data, error } = await supabase
      .from("app_roles")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("role_name", { ascending: true });

    if (error) {
      throw error;
    }

    setRoles(data ?? []);
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

      setUsers(data ?? []);
    } catch (error) {
      toast({
        title: "Unable to load users",
        description:
          error instanceof Error ? error.message : "Unknown database error.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, status, toast]);

  useEffect(() => {
    void loadRoles().catch((error) => {
      toast({
        title: "Unable to load roles",
        description:
          error instanceof Error ? error.message : "Unknown database error.",
        variant: "destructive",
      });
    });
  }, [loadRoles, toast]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const summary = useMemo(() => {
    const initial = {
      Pending: 0,
      Active: 0,
      Suspended: 0,
      Rejected: 0,
    };

    return users.reduce((result, user) => {
      const key = user.account_status as keyof typeof initial;

      if (key in result) {
        result[key] += 1;
      }

      return result;
    }, initial);
  }, [users]);

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

      setDialog(null);
      setSelectedRoleCode("");
      setReason("");
      setAdminNotes("");
      await loadUsers();
    } catch (error) {
      toast({
        title: "Account update failed",
        description:
          error instanceof Error ? error.message : "Unknown database error.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
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

  return (
    <div className="w-full space-y-5 px-4 py-4 sm:px-5 lg:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <UserCog className="h-6 w-6 text-[#9E4B4B]" />
            <h1 className="text-2xl font-semibold tracking-tight">
              User Management
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Approve registrations, assign roles, and control REDS App access.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => void loadUsers()}
          disabled={loading}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

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
              className="rounded-xl border bg-card p-4 text-left shadow-sm transition hover:border-[#9E4B4B]"
            >
              <div className="text-sm text-muted-foreground">{item}</div>
              <div className="mt-1 text-2xl font-semibold">{summary[item]}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                On this result page
              </div>
            </button>
          )
        )}
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
                placeholder="Search name, email, or phone"
                className="bg-[#F7F9FB] pl-9 hover:border-[#9E4B4B]"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as AccountStatus);
              setPage(0);
            }}
            className="h-10 rounded-md border border-input bg-[#F7F9FB] px-3 text-sm hover:border-[#9E4B4B] focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {statusOptions.map((item) => (
              <option key={item} value={item}>
                {item === "All" ? "All statuses" : item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="border-b bg-muted/40 text-left">
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
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center">
                    <div className="mx-auto h-7 w-7 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-14 text-center text-muted-foreground"
                  >
                    No users match the selected filters.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.auth_user_id} className="align-top">
                    <td className="px-4 py-4">
                      <div className="font-medium">
                        {user.display_name || "Unnamed user"}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {user.email}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-muted-foreground">
                      {user.phone || "—"}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                          statusClasses[user.account_status] ||
                          "border-border bg-muted text-muted-foreground"
                        }`}
                      >
                        {user.account_status}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <div>{user.role_name || "No role assigned"}</div>
                      {user.role_code && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {user.role_code}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-4 text-muted-foreground">
                      {formatDateTime(user.created_at)}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        {user.account_status === "Pending" && (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => openDialog("approve", user)}
                            >
                              <CheckCircle2 className="mr-1.5 h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => openDialog("reject", user)}
                            >
                              <UserX className="mr-1.5 h-4 w-4" />
                              Reject
                            </Button>
                          </>
                        )}

                        {user.account_status === "Active" && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => openDialog("suspend", user)}
                          >
                            <Ban className="mr-1.5 h-4 w-4" />
                            Suspend
                          </Button>
                        )}

                        {(user.account_status === "Suspended" ||
                          user.account_status === "Rejected") && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => openDialog("reactivate", user)}
                          >
                            <ShieldCheck className="mr-1.5 h-4 w-4" />
                            Reactivate
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
              : `${page * PAGE_SIZE + 1}–${Math.min(
                  (page + 1) * PAGE_SIZE,
                  totalCount
                )} of ${totalCount}`}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page === 0 || loading}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>

            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page + 1 >= totalPages || loading}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {dialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="account-action-title"
        >
          <div className="w-full max-w-lg rounded-xl border bg-background shadow-2xl">
            <div className="flex items-start justify-between border-b p-5">
              <div>
                <h2
                  id="account-action-title"
                  className="text-lg font-semibold"
                >
                  {actionTitle}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {dialog.user.display_name || dialog.user.email}
                </p>
              </div>

              <button
                type="button"
                onClick={closeDialog}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              {(dialog.type === "approve" ||
                dialog.type === "reactivate") && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="account-role">Role</Label>
                    <select
                      id="account-role"
                      value={selectedRoleCode}
                      onChange={(event) =>
                        setSelectedRoleCode(event.target.value)
                      }
                      className="h-10 w-full rounded-md border border-input bg-[#F7F9FB] px-3 text-sm hover:border-[#9E4B4B] focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select role</option>
                      {roles.map((role) => (
                        <option key={role.role_id} value={role.role_code}>
                          {role.role_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-notes">Admin notes</Label>
                    <textarea
                      id="admin-notes"
                      value={adminNotes}
                      onChange={(event) => setAdminNotes(event.target.value)}
                      rows={4}
                      placeholder="Optional internal notes"
                      className="w-full resize-y rounded-md border border-input bg-[#F7F9FB] px-3 py-2 text-sm hover:border-[#9E4B4B] focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </>
              )}

              {(dialog.type === "suspend" || dialog.type === "reject") && (
                <div className="space-y-2">
                  <Label htmlFor="account-reason">
                    {dialog.type === "suspend"
                      ? "Suspension reason"
                      : "Rejection reason"}
                  </Label>
                  <textarea
                    id="account-reason"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    rows={4}
                    placeholder="Enter the reason for this action"
                    className="w-full resize-y rounded-md border border-input bg-[#F7F9FB] px-3 py-2 text-sm hover:border-[#9E4B4B] focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t p-5">
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                disabled={actionLoading}
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={() => void runAction()}
                disabled={actionLoading}
                className={
                  dialog.type === "suspend" || dialog.type === "reject"
                    ? "bg-[#9E4B4B] text-white hover:bg-[#873f3f]"
                    : ""
                }
              >
                {actionLoading ? "Saving..." : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}