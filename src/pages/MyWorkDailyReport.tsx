import {
    ArrowLeft,
    ClipboardList,
    Clock,
    FileText,
    Timer,
    UserCircle,
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type WorkOrderDetail = {
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

function calculateRegularHours(
    clockInValue: string,
    clockOutValue: string,
    overtimeValue: string
) {
    if (!clockInValue || !clockOutValue) return 0;

    const [inHour, inMinute] = clockInValue.split(":").map(Number);
    const [outHour, outMinute] = clockOutValue.split(":").map(Number);

    const inTotalMinutes = inHour * 60 + inMinute;
    const outTotalMinutes = outHour * 60 + outMinute;

    if (outTotalMinutes <= inTotalMinutes) return 0;

    const totalHours = (outTotalMinutes - inTotalMinutes) / 60;
    const overtime = Number(overtimeValue || 0);

    return Math.max(Number((totalHours - overtime).toFixed(2)), 0);
}

export default function MyWorkDailyReport() {
    const navigate = useNavigate();
    const { workOrderId } = useParams();
    const workerSource = "Assigned Worker";
    const [attendanceStatus, setAttendanceStatus] = useState("Present");
    const [clockIn, setClockIn] = useState("");
    const [clockOut, setClockOut] = useState("");
    const [overtimeHours, setOvertimeHours] = useState("");
    const [siteNotes, setSiteNotes] = useState("");

    const {
        data: workOrder,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["my-work-daily-report-work-order", workOrderId],
        enabled: Boolean(workOrderId),
        queryFn: async () => {
            const { data, error: workOrderError } = await supabase
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
                .eq("work_order_id", workOrderId)
                .eq("is_deleted", false)
                .maybeSingle();

            if (workOrderError) throw workOrderError;

            return data as WorkOrderDetail | null;
        },
    });

    const submitDailyReport = useMutation({
        mutationFn: async () => {
            if (!workOrder) {
                throw new Error("Work order not found.");
            }

            if (!workOrder.project_id || !workOrder.site_id) {
                throw new Error("This work order is missing project or site.");
            }

            if (attendanceStatus !== "Absent" && (!clockIn || !clockOut)) {
                throw new Error("Please enter Check In and Check Out time.");
            }

            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) throw userError;
            if (!user?.email) {
                throw new Error("Unable to find logged-in user email.");
            }

            const { data: employee, error: employeeError } = await supabase
                .from("employees")
                .select("employee_id")
                .eq("email", user.email)
                .maybeSingle();

            if (employeeError) throw employeeError;
            if (!employee?.employee_id) {
                throw new Error("No employee record found for this login email.");
            }

            const { data: workAssignment, error: assignmentError } = await supabase
                .from("work_assignments")
                .select("work_assignment_id")
                .eq("employee_id", employee.employee_id)
                .eq("work_order_id", workOrder.work_order_id)
                .maybeSingle();

            if (assignmentError) throw assignmentError;

            const today = new Date().toISOString().slice(0, 10);
            const regularHours =
                attendanceStatus === "Absent"
                    ? 0
                    : calculateRegularHours(clockIn, clockOut, overtimeHours);
            const otHours = Number(overtimeHours || 0);

            const { data: createdReport, error: reportError } = await supabase
                .from("daily_reports")
                .insert({
                    project_id: workOrder.project_id,
                    site_id: workOrder.site_id,
                    area_id: workOrder.area_id,
                    work_order_id: workOrder.work_order_id,
                    report_date: today,
                    weather_condition: "Not recorded",
                    workers_count: 1,
                    progress_percent: 0,
                    work_completed: siteNotes.trim() || "Worker mobile daily report",
                    issues_found: null,
                    next_actions: null,
                    notes: siteNotes.trim() || null,
                    completed_quantity: 0,
                    approval_status: "Submitted",
                    is_deleted: false,
                })
                .select("report_id")
                .single();

            if (reportError) throw reportError;

            const reportId = createdReport.report_id;

            const { error: workerError } = await supabase
                .from("daily_report_workers")
                .insert({
                    report_id: reportId,
                    employee_id: employee.employee_id,
                    regular_hours: regularHours,
                    overtime_hours: otHours,
                    completed_quantity: 0,
                    worker_role: "Worker",
                    notes: siteNotes.trim() || null,
                    activity_type_id: null,
                    work_assignment_id: workAssignment?.work_assignment_id || null,
                    worker_source: workerSource,
                    attendance_status: attendanceStatus,
                    replaces_work_assignment_id: null,
                    ot_start: null,
                    ot_finish: null,
                    ot_completed_quantity: 0,
                });

            if (workerError) throw workerError;

            const { error: timeLogError } = await supabase
                .from("work_time_logs")
                .insert({
                    employee_id: employee.employee_id,
                    project_id: workOrder.project_id,
                    site_id: workOrder.site_id,
                    area_id: workOrder.area_id,
                    work_order_id: workOrder.work_order_id,
                    work_date: today,
                    clock_in:
                        attendanceStatus === "Absent" || !clockIn
                            ? null
                            : `${today}T${clockIn}:00`,
                    clock_out:
                        attendanceStatus === "Absent" || !clockOut
                            ? null
                            : `${today}T${clockOut}:00`,
                    break_minutes: 0,
                    regular_hours: regularHours,
                    overtime_hours: otHours,
                    approved: false,
                    report_id: reportId,
                    daily_report_id: reportId,
                    time_status: "Submitted",
                    work_assignment_id: workAssignment?.work_assignment_id || null,
                    worker_source: workerSource,
                    attendance_status: attendanceStatus,
                    replaces_work_assignment_id: null,
                    ot_start: null,
                    ot_finish: null,
                    ot_completed_quantity: 0,
                    notes: siteNotes.trim() || null,
                });

            if (timeLogError) throw timeLogError;
        },
        onSuccess: () => {
            toast.success("Daily report submitted.");
            navigate("/my-work");
        },
        onError: (submitError) => {
            toast.error(
                submitError instanceof Error
                    ? submitError.message
                    : "Unable to submit daily report."
            );
        },
    });

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-4">
            <div className="mx-auto max-w-md space-y-4">
                <button
                    type="button"
                    onClick={() => navigate("/my-work")}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-700"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to My Work
                </button>

                <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                            <ClipboardList className="h-5 w-5" />
                        </div>

                        <div>
                            <h1 className="text-xl font-bold text-slate-900">
                                Daily Report
                            </h1>
                            <p className="text-sm text-slate-500">
                                Mobile worker report
                            </p>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="rounded-2xl bg-white border border-slate-200 p-6 text-center shadow-sm">
                        <p className="text-sm font-medium text-slate-700">
                            Loading work order...
                        </p>
                    </div>
                ) : error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                        Unable to load work order.
                    </div>
                ) : workOrder ? (
                    <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    {workOrder.work_order_no || "Work Order"}
                                </p>
                                <h2 className="mt-1 text-lg font-bold text-slate-900">
                                    {workOrder.title || "Untitled work order"}
                                </h2>
                            </div>

                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                {workOrder.status || "Open"}
                            </span>
                        </div>

                        {workOrder.description && (
                            <p className="mt-3 text-sm text-slate-600">
                                {workOrder.description}
                            </p>
                        )}

                        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
                            <div className="rounded-xl bg-slate-50 p-3">
                                <p className="font-medium text-slate-500">Priority</p>
                                <p className="mt-1 font-semibold text-slate-800">
                                    {workOrder.priority || "Normal"}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-3">
                                <p className="font-medium text-slate-500">Planned Start</p>
                                <p className="mt-1 font-semibold text-slate-800">
                                    {workOrder.planned_start_date || "Not set"}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-700">
                        Work order not found.
                    </div>
                )}

                <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                            <UserCircle className="h-5 w-5" />
                        </div>

                        <div>
                            <h3 className="text-base font-bold text-slate-900">
                                Worker Report
                            </h3>
                            <p className="text-xs text-slate-500">
                                Your attendance, time, OT, and site notes
                            </p>
                            <div className="mt-2">
                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                    {workerSource}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 space-y-4">
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Attendance
                            </label>
                            <select
                                value={attendanceStatus}
                                onChange={(event) => setAttendanceStatus(event.target.value)}
                                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-medium text-slate-900"
                            >
                                <option value="Present">Present</option>
                                <option value="Late">Late</option>
                                <option value="Absent">Absent</option>
                                <option value="Leave">Leave</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    <Clock className="h-3.5 w-3.5" />
                                    Check In
                                </label>
                                <input
                                    type="time"
                                    value={clockIn}
                                    onChange={(event) => setClockIn(event.target.value)}
                                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm font-medium text-slate-900"
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    <Clock className="h-3.5 w-3.5" />
                                    Check Out
                                </label>
                                <input
                                    type="time"
                                    value={clockOut}
                                    onChange={(event) => setClockOut(event.target.value)}
                                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm font-medium text-slate-900"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                <Timer className="h-3.5 w-3.5" />
                                OT Hours
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.25"
                                value={overtimeHours}
                                onChange={(event) => setOvertimeHours(event.target.value)}
                                placeholder="0"
                                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm font-medium text-slate-900"
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                <FileText className="h-3.5 w-3.5" />
                                Site Notes
                            </label>
                            <textarea
                                value={siteNotes}
                                onChange={(event) => setSiteNotes(event.target.value)}
                                rows={4}
                                placeholder="Add site notes..."
                                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm text-slate-900"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={() => submitDailyReport.mutate()}
                            disabled={submitDailyReport.isPending || !workOrder}
                            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                            {submitDailyReport.isPending
                                ? "Submitting..."
                                : "Submit Daily Report"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}