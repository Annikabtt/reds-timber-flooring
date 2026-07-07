import {
    ArrowLeft,
    ChevronDown,
    ChevronUp,
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
    projects: {
        project_no: string | null;
        project_name: string | null;
        customers: {
            customer_name: string | null;
        } | null;
    } | null;
    project_sites: {
        site_code: string | null;
        site_name: string | null;
    } | null;
    project_areas: {
        area_code: string | null;
        area_name: string | null;
    } | null;
};

type WorkerProfile = {
    employee_id: string;
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
    employee_code: string | null;
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

function getCurrentTimeValue() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    return `${hours}:${minutes}`;
}

function formatHoursAndMinutes(hoursValue: number) {
    const totalMinutes = Math.round(hoursValue * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

export default function MyWorkDailyReport() {
    const navigate = useNavigate();
    const { workOrderId } = useParams();
    const workerSource = "Assigned";
    const [showProjectDetails, setShowProjectDetails] = useState(false);
    const [attendanceStatus, setAttendanceStatus] = useState("Present");
    const [activityTypeId, setActivityTypeId] = useState("");
    const [clockIn, setClockIn] = useState("");
    const [clockOut, setClockOut] = useState("");
    const [breakMinutes, setBreakMinutes] = useState("60");
    const [hasOvertime, setHasOvertime] = useState(false);
    const [otStart, setOtStart] = useState("");
    const [otFinish, setOtFinish] = useState("");
    const [completedQuantity, setCompletedQuantity] = useState("0");
    const [otCompletedQuantity, setOtCompletedQuantity] = useState("0");
    const [photoFiles, setPhotoFiles] = useState<File[]>([]);
    const [selectedPhotos, setSelectedPhotos] = useState<
        { file: File; caption: string }[]
    >([]);
    const [photoCaption, setPhotoCaption] = useState("");
    const [issueFound, setIssueFound] = useState("");
    const [generalNote, setGeneralNote] = useState("");

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
          area_id,
          projects (
            project_no,
            project_name,
            customers (
              customer_name
            )
          ),
          project_sites (
            site_code,
            site_name
          ),
          project_areas (
            area_code,
            area_name
          )
        `
                )
                .eq("work_order_id", workOrderId)
                .eq("is_deleted", false)
                .maybeSingle();

            if (workOrderError) throw workOrderError;

            return data as WorkOrderDetail | null;
        },
    });

    const { data: workerProfile } = useQuery({
        queryKey: ["my-work-worker-profile"],
        queryFn: async () => {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) throw userError;
            if (!user?.email) return null;

            const { data, error: employeeError } = await supabase
                .from("employees")
                .select(`
                    employee_id,
                    display_name,
                    first_name,
                    last_name,
                    employee_code
                `)
                .eq("email", user.email)
                .maybeSingle();

            if (employeeError) throw employeeError;

            return data as WorkerProfile | null;
        },
    });

    const { data: activityTypes = [] } = useQuery({
        queryKey: ["my-work-activity-types"],
        queryFn: async () => {
            const { data, error: activityError } = await supabase
                .from("work_activity_types")
                .select(`
                    activity_type_id,
                    activity_code,
                    activity_name,
                    sort_order
                `)
                .eq("is_active", true)
                .order("sort_order", { ascending: true });

            if (activityError) throw activityError;

            return data || [];
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

            const submittedOtHours =
                hasOvertime && otStart && otFinish
                    ? calculateRegularHours(otStart, otFinish, "0")
                    : 0;

            const submittedRegularHours =
                attendanceStatus === "Not Attended"
                    ? 0
                    : calculateRegularHours(clockIn, clockOut, String(submittedOtHours));

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
                    work_completed: generalNote.trim() || "Worker mobile daily report",
                    issues_found: issueFound.trim() || null,
                    next_actions: null,
                    notes: generalNote.trim() || null,
                    completed_quantity: Number(completedQuantity || 0),
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
                    regular_hours: submittedRegularHours,
                    overtime_hours: submittedOtHours,
                    completed_quantity: Number(completedQuantity || 0),
                    worker_role: "Worker",
                    notes: generalNote.trim() || null,
                    activity_type_id: activityTypeId || null,
                    work_assignment_id: workAssignment?.work_assignment_id || null,
                    worker_source: workerSource,
                    attendance_status: attendanceStatus,
                    replaces_work_assignment_id: null,
                    ot_start: hasOvertime && otStart ? `${today}T${otStart}:00` : null,
                    ot_finish: hasOvertime && otFinish ? `${today}T${otFinish}:00` : null,
                    ot_completed_quantity: Number(otCompletedQuantity || 0),
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
                        attendanceStatus === "Not Attended" || !clockIn
                            ? null
                            : `${today}T${clockIn}:00`,
                    clock_out:
                        attendanceStatus === "Not Attended" || !clockOut
                            ? null
                            : `${today}T${clockOut}:00`,
                    break_minutes: Number(breakMinutes || 0),
                    regular_hours: submittedRegularHours,
                    overtime_hours: submittedOtHours,
                    approved: false,
                    report_id: reportId,
                    daily_report_id: reportId,
                    time_status: "Submitted",
                    work_assignment_id: workAssignment?.work_assignment_id || null,
                    worker_source: workerSource,
                    attendance_status: attendanceStatus,
                    replaces_work_assignment_id: null,
                    ot_start: hasOvertime && otStart ? `${today}T${otStart}:00` : null,
                    ot_finish: hasOvertime && otFinish ? `${today}T${otFinish}:00` : null,
                    ot_completed_quantity: Number(otCompletedQuantity || 0),
                    notes: generalNote.trim() || null,
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

    const otHours =
        hasOvertime && otStart && otFinish
            ? calculateRegularHours(otStart, otFinish, "0")
            : 0;

    const regularHours =
        attendanceStatus === "Not Attended"
            ? 0
            : calculateRegularHours(clockIn, clockOut, String(otHours));

    const totalHours = regularHours + otHours;

    const workerName =
        workerProfile?.display_name ||
        `${workerProfile?.first_name || ""} ${workerProfile?.last_name || ""}`.trim() ||
        workerProfile?.employee_code ||
        "Worker";

    return (
        <div className="min-h-screen overflow-x-hidden bg-slate-50 px-4 py-4">
            <div className="mx-auto w-full max-w-md min-w-0 space-y-4 overflow-hidden">
                <button
                    type="button"
                    onClick={() => navigate("/my-work")}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-700"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to My Work
                </button>

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
                        <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
                                <ClipboardList className="h-4 w-4" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-red-600">
                                            Work Order
                                        </p>

                                        <h1 className="mt-1 whitespace-nowrap text-base font-bold leading-tight text-slate-900">
                                            {workOrder.work_order_no || "Work Order"}
                                        </h1>

                                        <p className="mt-1 line-clamp-1 text-sm font-semibold leading-snug text-slate-900">
                                            {workOrder.title || "Untitled work order"}
                                        </p>
                                    </div>

                                    <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                        {workOrder.status || "Open"}
                                    </span>
                                </div>

                                {workOrder.description && (
                                    <p className="mt-3 text-sm text-slate-600">
                                        {workOrder.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowProjectDetails((current) => !current)}
                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800"
                        >
                            {showProjectDetails ? "Hide Project Details" : "Show Project Details"}
                            {showProjectDetails ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                        </button>

                        {showProjectDetails && (
                            <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Project
                                        </p>
                                        <p className="mt-1 text-base font-bold text-slate-900">
                                            {workOrder.projects?.project_name || "No project name"}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {workOrder.projects?.customers?.customer_name || "No customer"}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Site
                                            </p>
                                            <p className="mt-1 text-sm font-bold text-slate-900">
                                                {workOrder.project_sites?.site_code || "-"} -{" "}
                                                {workOrder.project_sites?.site_name || "No site"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Area
                                            </p>
                                            <p className="mt-1 text-sm font-bold text-slate-900">
                                                {workOrder.project_areas?.area_code || "-"} -{" "}
                                                {workOrder.project_areas?.area_name || "No area"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Priority
                                            </p>
                                            <p className="mt-1 text-sm font-bold text-slate-900">
                                                {workOrder.priority || "Normal"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Planned Start
                                            </p>
                                            <p className="mt-1 text-sm font-bold text-slate-900">
                                                {workOrder.planned_start_date || "Not set"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
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
                                {workerName}
                            </h3>
                            <p className="text-xs text-slate-500">
                                Worker report: attendance, activity, time, OT, and site notes
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
                                <option value="Not Attended">Not Attended</option>
                                <option value="Replaced">Replaced</option>
                                <option value="Late">Late</option>
                                <option value="Leave Early">Leave Early</option>
                                <option value="Sick">Sick</option>
                                <option value="Annual Leave">Annual Leave</option>
                                <option value="Public Holiday">Public Holiday</option>
                                <option value="Training">Training</option>
                                <option value="Travel">Travel</option>
                                <option value="Standby">Standby</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Activity
                            </label>
                            <select
                                value={activityTypeId}
                                onChange={(event) => setActivityTypeId(event.target.value)}
                                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-medium text-slate-900"
                            >
                                <option value="">Select activity</option>
                                {activityTypes.map((activityType) => (
                                    <option
                                        key={activityType.activity_type_id}
                                        value={activityType.activity_type_id}
                                    >
                                        {activityType.activity_code || "-"} - {activityType.activity_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    <Clock className="h-3.5 w-3.5" />
                                    Check In
                                </label>

                                <button
                                    type="button"
                                    onClick={() => {
                                        const now = new Date();
                                        const hours = String(now.getHours()).padStart(2, "0");
                                        const minutes = String(now.getMinutes()).padStart(2, "0");
                                        setClockIn(`${hours}:${minutes}`);
                                    }}
                                    className="mt-2 w-full rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                                >
                                    {clockIn ? "Update Check In" : "Check In Now"}
                                </button>

                                <p className="mt-2 text-sm font-bold text-slate-900">
                                    {clockIn || "Not checked in"}
                                </p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    <Clock className="h-3.5 w-3.5" />
                                    Check Out
                                </label>

                                <button
                                    type="button"
                                    disabled={!clockIn}
                                    onClick={() => {
                                        const now = new Date();
                                        const hours = String(now.getHours()).padStart(2, "0");
                                        const minutes = String(now.getMinutes()).padStart(2, "0");
                                        setClockOut(`${hours}:${minutes}`);
                                    }}
                                    className="mt-2 w-full rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:hover:bg-slate-400"
                                >
                                    {clockOut ? "Update Check Out" : "Check Out Now"}
                                </button>

                                <p className="mt-2 text-sm font-bold text-slate-900">
                                    {clockOut || "Not checked out"}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        <Timer className="h-3.5 w-3.5" />
                                        Overtime
                                    </label>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Open only when this worker has overtime work.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span
                                        className={
                                            hasOvertime
                                                ? "rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"
                                                : "rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200"
                                        }
                                    >
                                        {hasOvertime ? "Open" : "Pending"}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            const nextValue = !hasOvertime;
                                            setHasOvertime(nextValue);

                                            if (!nextValue) {
                                                setOtStart("");
                                                setOtFinish("");
                                                setOtCompletedQuantity("0");
                                            }
                                        }}
                                        className="text-xs font-semibold text-slate-700"
                                    >
                                        {hasOvertime ? "Hide" : "Open"}
                                    </button>
                                </div>
                            </div>

                            {hasOvertime && (
                                <div className="mt-4 space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                                            <p className="text-sm font-semibold text-slate-900">
                                                Start OT
                                            </p>

                                            <button
                                                type="button"
                                                disabled={!clockOut}
                                                onClick={() => setOtStart(getCurrentTimeValue())}
                                                className="mt-3 w-full rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300 disabled:hover:bg-red-300"
                                            >
                                                {clockOut ? "Start OT" : "Check Out First"}
                                            </button>

                                            <p className="mt-3 text-sm font-bold text-slate-900">
                                                {otStart || "No OT"}
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                                            <p className="text-sm font-semibold text-slate-900">
                                                Finish OT
                                            </p>

                                            <button
                                                type="button"
                                                disabled={!otStart}
                                                onClick={() => setOtFinish(getCurrentTimeValue())}
                                                className="mt-3 w-full rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300 disabled:hover:bg-red-300"
                                            >
                                                {otStart ? "Finish OT" : "Start OT First"}
                                            </button>

                                            <p className="mt-3 text-sm font-bold text-slate-900">
                                                {otFinish || "No OT finish"}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            OT Qty Completed
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={otCompletedQuantity}
                                            onChange={(event) =>
                                                setOtCompletedQuantity(event.target.value)
                                            }
                                            placeholder="0"
                                            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm font-medium text-slate-900"
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="rounded-xl bg-white p-3">
                                            <p className="text-xs font-semibold text-slate-500">
                                                Regular
                                            </p>
                                            <p className="mt-1 text-sm font-bold text-slate-900">
                                                {formatHoursAndMinutes(regularHours)}
                                            </p>
                                        </div>

                                        <div className="rounded-xl bg-white p-3">
                                            <p className="text-xs font-semibold text-slate-500">
                                                OT
                                            </p>
                                            <p className="mt-1 text-sm font-bold text-slate-900">
                                                {formatHoursAndMinutes(otHours)}
                                            </p>
                                        </div>

                                        <div className="rounded-xl bg-white p-3">
                                            <p className="text-xs font-semibold text-slate-500">
                                                Total
                                            </p>
                                            <p className="mt-1 text-sm font-bold text-slate-900">
                                                {formatHoursAndMinutes(totalHours)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Break Minutes
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={breakMinutes}
                                    onChange={(event) => setBreakMinutes(event.target.value)}
                                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm font-medium text-slate-900"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Completed Qty
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={completedQuantity}
                                    onChange={(event) => setCompletedQuantity(event.target.value)}
                                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm font-medium text-slate-900"
                                />
                            </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <h3 className="text-base font-bold text-slate-900">
                                Site Notes
                            </h3>

                            <div className="mt-4 space-y-4">
                                <div>
                                    <label className="text-sm font-semibold text-slate-900">
                                        Issue Found
                                    </label>
                                    <textarea
                                        value={issueFound}
                                        onChange={(event) => setIssueFound(event.target.value)}
                                        rows={4}
                                        placeholder="Site issue, access issue, damage, delay, or anything that needs attention."
                                        className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm text-slate-900"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-semibold text-slate-900">
                                        General Note
                                    </label>
                                    <textarea
                                        value={generalNote}
                                        onChange={(event) => setGeneralNote(event.target.value)}
                                        rows={4}
                                        placeholder="General site note, worker note, or extra information before photos."
                                        className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm text-slate-900"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                        <h3 className="text-base font-bold text-slate-900">
                            Photos
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                            Add site photos, work progress, issues, or completed areas.
                        </p>

                        <div className="mt-4 space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-slate-900">
                                    Add / Take Photos
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(event) => {
                                        const files = Array.from(event.target.files || []);
                                        setPhotoFiles(files);
                                    }}
                                    className="mt-2 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900"
                                />
                                <p className="mt-2 text-xs text-slate-500">
                                    Take a new photo or choose existing photos from your device.
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-900">
                                    Caption for selected files
                                </label>
                                <input
                                    type="text"
                                    value={photoCaption}
                                    onChange={(event) => setPhotoCaption(event.target.value)}
                                    placeholder="Optional caption for selected photos"
                                    className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm text-slate-900"
                                />
                            </div>

                            <button
                                type="button"
                                disabled={photoFiles.length === 0}
                                onClick={() => {
                                    setSelectedPhotos((current) => [
                                        ...current,
                                        ...photoFiles.map((file) => ({
                                            file,
                                            caption: photoCaption.trim(),
                                        })),
                                    ]);
                                    setPhotoFiles([]);
                                    setPhotoCaption("");
                                }}
                                className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:hover:bg-slate-200"
                            >
                                Add Selected Photos
                            </button>

                            <div>
                                <p className="text-sm font-bold text-slate-900">
                                    Selected Photos: {selectedPhotos.length}
                                </p>

                                {selectedPhotos.length === 0 ? (
                                    <div className="mt-2 rounded-xl bg-white px-3 py-3 text-sm text-slate-500">
                                        No photos selected
                                    </div>
                                ) : (
                                    <div className="mt-2 space-y-3">
                                        {selectedPhotos.map((selectedPhoto, index) => {
                                            const previewUrl = URL.createObjectURL(selectedPhoto.file);

                                            return (
                                                <div
                                                    key={`${selectedPhoto.file.name}-${index}`}
                                                    className="w-full min-w-0 max-w-full overflow-hidden rounded-xl bg-white p-3 text-sm"
                                                >
                                                    <div className="space-y-3">
                                                        <img
                                                            src={previewUrl}
                                                            alt={selectedPhoto.file.name}
                                                            className="block aspect-[4/3] w-full max-w-full rounded-xl object-cover"
                                                        />

                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-900">
                                                                Photo Caption
                                                            </p>

                                                            <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800">
                                                                {selectedPhoto.caption || "No caption"}
                                                            </div>
                                                        </div>

                                                        <div className="grid min-w-0 grid-cols-[1fr_auto] items-end gap-3 overflow-hidden">
                                                            <div className="min-w-0 overflow-hidden">
                                                                <p className="max-w-full truncate text-sm font-medium text-slate-700">
                                                                    {selectedPhoto.file.name}
                                                                </p>
                                                                <p className="text-xs text-slate-500">
                                                                    {(selectedPhoto.file.size / 1024 / 1024).toFixed(2)} MB
                                                                </p>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setSelectedPhotos((current) =>
                                                                        current.filter((_, fileIndex) => fileIndex !== index)
                                                                    )
                                                                }
                                                                className="whitespace-nowrap text-xs font-semibold text-red-600"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
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
        </div >

    );
}