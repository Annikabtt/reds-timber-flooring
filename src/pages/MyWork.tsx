import {
    CalendarDays,
    ClipboardList,
    MapPin,
    UserCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type EmployeeProfile = {
    employee_id: string;
    employee_code: string | null;
    first_name: string | null;
    last_name: string | null;
    display_name: string | null;
    email: string | null;
    is_active: boolean | null;
};

type WorkAssignmentRow = {
    work_assignment_id: string;
    work_order_id: string | null;
    project_id: string | null;
    site_id: string | null;
    area_id: string | null;
    assigned_at: string | null;
    is_deleted: boolean | null;
};

type WorkOrderRow = {
    work_order_id: string;
    work_order_no: string | null;
    title: string | null;
    description: string | null;
    status: string | null;
    priority: string | null;
    planned_start_date: string | null;
    planned_end_date: string | null;
    project_id: string | null;
    site_id: string | null;
    area_id: string | null;
};

type AssignedWorkOrder = {
    assignment: WorkAssignmentRow;
    workOrder: WorkOrderRow | null;
};

export default function MyWork() {
    const { user } = useAuth();

    const userEmail = user?.email?.toLowerCase() ?? "";

    const {
        data: employee,
        isLoading: isEmployeeLoading,
        error: employeeError,
    } = useQuery({
        queryKey: ["my-work-employee", userEmail],
        enabled: Boolean(userEmail),
        queryFn: async () => {
            const { data, error } = await supabase
                .from("employees")
                .select(
                    `
          employee_id,
          employee_code,
          first_name,
          last_name,
          display_name,
          email,
          is_active
        `
                )
                .eq("email", userEmail)
                .eq("is_deleted", false)
                .maybeSingle();

            if (error) throw error;

            return data as EmployeeProfile | null;
        },
    });

    const {
        data: assignedWorkOrders = [],
        isLoading: isAssignmentsLoading,
        error: assignmentsError,
    } = useQuery({
        queryKey: ["my-work-assigned-work-orders", employee?.employee_id],
        enabled: Boolean(employee?.employee_id),
        queryFn: async () => {
            const { data: assignmentRows, error: assignmentsFetchError } =
                await supabase
                    .from("work_assignments")
                    .select(
                        `
            work_assignment_id,
            work_order_id,
            project_id,
            site_id,
            area_id,
            assigned_at,
            is_deleted
          `
                    )
                    .eq("employee_id", employee?.employee_id)
                    .eq("is_deleted", false)
                    .order("assigned_at", { ascending: false });

            if (assignmentsFetchError) throw assignmentsFetchError;

            const assignments = (assignmentRows || []) as WorkAssignmentRow[];
            const workOrderIds = assignments
                .map((assignment) => assignment.work_order_id)
                .filter((workOrderId): workOrderId is string => Boolean(workOrderId));

            if (workOrderIds.length === 0) {
                return [];
            }

            const { data: workOrderRows, error: workOrdersFetchError } =
                await supabase
                    .from("work_orders")
                    .select(
                        `
            work_order_id,
            work_order_no,
            title,
            description,
            status,
            priority,
            planned_start_date,
            planned_end_date,
            project_id,
            site_id,
            area_id
          `
                    )
                    .in("work_order_id", workOrderIds)
                    .eq("is_deleted", false);

            if (workOrdersFetchError) throw workOrdersFetchError;

            const workOrders = (workOrderRows || []) as WorkOrderRow[];

            return assignments.map((assignment) => ({
                assignment,
                workOrder:
                    workOrders.find(
                        (workOrder) => workOrder.work_order_id === assignment.work_order_id
                    ) || null,
            })) as AssignedWorkOrder[];
        },
    });

    const employeeName =
        employee?.display_name ||
        `${employee?.first_name || ""} ${employee?.last_name || ""}`.trim() ||
        employee?.employee_code ||
        "Worker";

    const isLoading = isEmployeeLoading || isAssignmentsLoading;

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-4">
            <div className="mx-auto max-w-md space-y-4">
                <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                            <ClipboardList className="h-5 w-5" />
                        </div>

                        <div>
                            <h1 className="text-xl font-bold text-slate-900">My Work</h1>
                            <p className="text-sm text-slate-500">
                                Today&apos;s assigned work orders
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                            <UserCircle className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Logged in worker
                            </p>

                            {isEmployeeLoading ? (
                                <p className="mt-1 text-sm font-semibold text-slate-900">
                                    Loading worker profile...
                                </p>
                            ) : employeeError ? (
                                <p className="mt-1 text-sm font-semibold text-red-600">
                                    Unable to load worker profile.
                                </p>
                            ) : employee ? (
                                <>
                                    <p className="mt-1 text-base font-bold text-slate-900">
                                        {employeeName}
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        {employee.employee_code || "No employee code"} ·{" "}
                                        {employee.email || userEmail}
                                    </p>

                                    {!employee.is_active && (
                                        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                                            This employee profile is inactive.
                                        </p>
                                    )}
                                </>
                            ) : (
                                <div className="mt-1 space-y-2">
                                    <p className="text-sm font-semibold text-red-600">
                                        No employee profile found for this login.
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Please check employee email: {userEmail}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {assignmentsError && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                        Unable to load assigned work orders.
                    </div>
                )}

                {isLoading ? (
                    <div className="rounded-2xl bg-white border border-slate-200 p-6 text-center shadow-sm">
                        <p className="text-sm font-medium text-slate-700">
                            Loading assigned work orders...
                        </p>
                    </div>
                ) : assignedWorkOrders.length > 0 ? (
                    <div className="space-y-3">
                        {assignedWorkOrders.map(({ assignment, workOrder }) => (
                            <div
                                key={assignment.work_assignment_id}
                                className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            {workOrder?.work_order_no || "Work Order"}
                                        </p>
                                        <h2 className="mt-1 text-base font-bold text-slate-900">
                                            {workOrder?.title || "Untitled work order"}
                                        </h2>
                                    </div>

                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                        {workOrder?.status || "Assigned"}
                                    </span>
                                </div>

                                {workOrder?.description && (
                                    <p className="mt-3 text-sm text-slate-600">
                                        {workOrder.description}
                                    </p>
                                )}

                                <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-slate-500">
                                    <div className="flex items-center gap-2">
                                        <CalendarDays className="h-4 w-4" />
                                        <span>
                                            Assigned: {assignment.assigned_at?.slice(0, 10) || "Not set"}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        <span>
                                            Project / Site / Area linked from assignment
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (workOrder?.work_order_id) {
                                            window.location.href = `/my-work/${workOrder.work_order_id}`;
                                        }
                                    }}
                                    disabled={!workOrder?.work_order_id}
                                    className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                                >
                                    Open Daily Report
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl bg-white border border-dashed border-slate-300 p-6 text-center shadow-sm">
                        <p className="text-sm font-medium text-slate-700">
                            No assigned work orders found.
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            Assigned work orders will appear here.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}