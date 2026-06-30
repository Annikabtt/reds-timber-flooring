import { ArrowLeft, CalendarDays, Pencil, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useEffect, useState } from "react";

const DailyReportDashboard = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { reportId } = useParams();

    const [showEditDialog, setShowEditDialog] = useState(false);
    const [editReportDate, setEditReportDate] = useState("");
    const [editWeatherCondition, setEditWeatherCondition] = useState("Fine");
    const [editWorkersCount, setEditWorkersCount] = useState("");
    const [editProgressPercent, setEditProgressPercent] = useState("");
    const [editCompletedQuantity, setEditCompletedQuantity] = useState("");
    const [editWorkCompleted, setEditWorkCompleted] = useState("");
    const [editIssuesFound, setEditIssuesFound] = useState("");
    const [editNextActions, setEditNextActions] = useState("");
    const [editNotes, setEditNotes] = useState("");
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoCaption, setPhotoCaption] = useState("");
    const [editingWorkerId, setEditingWorkerId] = useState("");
    const [showLabourForm, setShowLabourForm] = useState(false);
    const [labourEmployeeId, setLabourEmployeeId] = useState("");
    const [labourActivityTypeId, setLabourActivityTypeId] = useState("");
    const [labourClockIn, setLabourClockIn] = useState("");
    const [labourClockOut, setLabourClockOut] = useState("");
    const [labourBreakMinutes, setLabourBreakMinutes] = useState("60");
    const [labourRegularHours, setLabourRegularHours] = useState("");
    const [labourOvertimeHours, setLabourOvertimeHours] = useState("");
    const [labourCompletedQuantity, setLabourCompletedQuantity] = useState("");
    const [labourWorkerRole, setLabourWorkerRole] = useState("");
    const [labourNotes, setLabourNotes] = useState("");

    const { data: report, isLoading } = useQuery({
        queryKey: ["daily_report", reportId],
        enabled: !!reportId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("daily_reports")
                .select(`
          report_id,
          project_id,
          site_id,
          area_id,
          work_order_id,
          report_date,
          weather_condition,
          workers_count,
          progress_percent,
          completed_quantity,
          approval_status,
          work_completed,
          issues_found,
          next_actions,
          notes,
          created_at,
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
            area_name,
            estimated_quantity,
            unit_of_measure
            ),
          work_orders (
            work_order_no,
            title,
            status,
            priority
            ),
            daily_report_activities (
            daily_report_activity_id,
            activity_type_id,
            work_activity_types (
                activity_name,
                sort_order
            )
            ),
            daily_report_workers (
            daily_report_worker_id,
            employee_id,
            activity_type_id,
            regular_hours,
            overtime_hours,
            completed_quantity,
            worker_role,
            notes,
            employees (
                employee_code,
                display_name,
                first_name,
                last_name
            ),
            work_activity_types (
                activity_name,
                sort_order
            )
            ),
            daily_report_photos (
            photo_id,
            photo_url,
            caption,
            sort_order,
            taken_at,
            is_deleted,
            approval_status
            )
        `)
                .eq("report_id", reportId)
                .eq("is_deleted", false)
                .single();

            if (error) throw error;
            return data;
        },
    });

    // เพิ่ม Linked Work Time Logs เป็น query แยก เพื่อใช้แสดงในหน้า Dashboard สำหรับ UAT

    const { data: linkedWorkTimeLogs = [] } = useQuery({
        queryKey: ["linked_work_time_logs", reportId],
        enabled: !!reportId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("work_time_logs")
                .select(`
                work_time_log_id,
                report_id,
                employee_id,
                activity_type_id,
                work_date,
                regular_hours,
                overtime_hours,
                break_minutes,
                approved,
                time_status,
                notes,
                employees (
                    employee_code,
                    display_name,
                    first_name,
                    last_name
                ),
                work_activity_types (
                    activity_name
                )
            `)
                .eq("report_id", reportId)
                .eq("is_deleted", false)
                .order("work_date", { ascending: true });

            if (error) throw error;

            return data || [];
        },
    });

    // จบโค้ดบันทัดนี้ เพิ่ม Linked Work Time Logs เป็น query แยก เพื่อใช้แสดงในหน้า Dashboard สำหรับ UAT

    useEffect(() => {
        if (!report) return;

        setEditReportDate(report.report_date || "");
        setEditWeatherCondition(report.weather_condition || "Fine");
        setEditWorkersCount(
            report.workers_count === null || report.workers_count === undefined
                ? ""
                : String(report.workers_count)
        );
        setEditProgressPercent(
            report.progress_percent === null || report.progress_percent === undefined
                ? ""
                : String(report.progress_percent)
        );
        setEditCompletedQuantity(
            report.completed_quantity === null || report.completed_quantity === undefined
                ? ""
                : String(report.completed_quantity)
        );
        setEditWorkCompleted(report.work_completed || "");
        setEditIssuesFound(report.issues_found || "");
        setEditNextActions(report.next_actions || "");
        setEditNotes(report.notes || "");
    }, [report]);

    const { data: areaProgress } = useQuery({
        queryKey: ["daily_report_area_progress", report?.area_id],
        enabled: !!report?.area_id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("project_area_progress_v")
                .select(`
        area_id,
        estimated_quantity,
        actual_quantity,
        remaining_quantity,
        progress_percent,
        unit_of_measure
      `)
                .eq("area_id", report?.area_id)
                .single();

            if (error) throw error;

            return data;
        },
    });

    const { data: employees = [] } = useQuery({
        queryKey: ["employees_for_daily_report_labour"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("employees")
                .select(`
                employee_id,
                employee_code,
                display_name,
                first_name,
                last_name
            `)
                .eq("is_deleted", false)
                .eq("is_active", true)
                .order("display_name", { ascending: true });

            if (error) throw error;
            return data;
        },
    });
    const calculateLabourHours = (
        clockIn: string,
        clockOut: string,
        breakMinutesText: string
    ) => {
        if (!clockIn || !clockOut) {
            setLabourRegularHours("");
            setLabourOvertimeHours("");
            return;
        }

        const [clockInHour, clockInMinute] = clockIn.split(":").map(Number);
        const [clockOutHour, clockOutMinute] = clockOut.split(":").map(Number);

        const clockInMinutes = clockInHour * 60 + clockInMinute;
        const clockOutMinutes = clockOutHour * 60 + clockOutMinute;

        if (clockOutMinutes <= clockInMinutes) {
            setLabourRegularHours("");
            setLabourOvertimeHours("");
            return;
        }

        const breakMinutes = Math.max(Number(breakMinutesText || 0), 0);
        const totalHours = Math.max(
            (clockOutMinutes - clockInMinutes - breakMinutes) / 60,
            0
        );

        const regularHours = Math.min(totalHours, 8);
        const overtimeHours = Math.max(totalHours - 8, 0);

        setLabourRegularHours(regularHours.toFixed(2));
        setLabourOvertimeHours(overtimeHours.toFixed(2));

        const calculateLabourHours = (
            clockIn: string,
            clockOut: string,
            breakMinutesText: string
        ) => {
            if (!clockIn || !clockOut) {
                setLabourRegularHours("");
                setLabourOvertimeHours("");
                return;
            }

            const [clockInHour, clockInMinute] = clockIn.split(":").map(Number);
            const [clockOutHour, clockOutMinute] = clockOut.split(":").map(Number);

            const clockInMinutes = clockInHour * 60 + clockInMinute;
            const clockOutMinutes = clockOutHour * 60 + clockOutMinute;

            if (clockOutMinutes <= clockInMinutes) {
                setLabourRegularHours("");
                setLabourOvertimeHours("");
                return;
            }

            const breakMinutes = Math.max(Number(breakMinutesText || 0), 0);
            const totalHours = Math.max(
                (clockOutMinutes - clockInMinutes - breakMinutes) / 60,
                0
            );

            const regularHours = Math.min(totalHours, 8);
            const overtimeHours = Math.max(totalHours - 8, 0);

            setLabourRegularHours(regularHours.toFixed(2));
            setLabourOvertimeHours(overtimeHours.toFixed(2));
        };

    };
    const resetLabourForm = () => {
        setEditingWorkerId("");
        setLabourEmployeeId("");
        setLabourActivityTypeId("");
        setLabourClockIn("");
        setLabourClockOut("");
        setLabourBreakMinutes("60");
        setLabourRegularHours("");
        setLabourOvertimeHours("");
        setLabourCompletedQuantity("");
        setLabourWorkerRole("");
        setLabourNotes("");
        setShowLabourForm(false);
    };

    const { data: workActivityTypes = [] } = useQuery({
        queryKey: ["work_activity_types_for_daily_report_labour"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("work_activity_types")
                .select(`
                activity_type_id,
                activity_name,
                sort_order
            `)
                .eq("is_active", true)
                .order("sort_order", { ascending: true });

            if (error) throw error;
            return data;
        },
    });

    const { data: areaReports = [] } = useQuery({
        queryKey: ["daily_report_area_reports", report?.area_id],
        enabled: !!report?.area_id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("daily_reports")
                .select(`
        report_id,
        completed_quantity,
        approval_status
      `)
                .eq("area_id", report?.area_id)
                .eq("is_deleted", false);

            if (error) throw error;

            return data;
        },
    });

    const areaReportedSummary = areaReports.reduce(
        (summary, item) => {
            const qty = Number(item.completed_quantity || 0);

            summary.totalReported += qty;

            if (item.approval_status === "Approved") {
                summary.approvedCompleted += qty;
            } else if (
                item.approval_status === "Submitted" ||
                item.approval_status === "Ready for Inspection"
            ) {
                summary.pendingReview += qty;
            }

            return summary;
        },
        {
            totalReported: 0,
            approvedCompleted: 0,
            pendingReview: 0,
        }
    );

    const areaEstimatedQuantity = Number(
        areaProgress?.estimated_quantity ||
        report?.project_areas?.estimated_quantity ||
        0
    );

    const reportedIncludingPendingPercent =
        areaEstimatedQuantity > 0
            ? (areaReportedSummary.totalReported / areaEstimatedQuantity) * 100
            : 0;
    const approvedCompletedQuantity = areaReportedSummary.approvedCompleted;

    const isAreaCompleted =
        areaEstimatedQuantity > 0 &&
        approvedCompletedQuantity >= areaEstimatedQuantity;

    const isReportedOverEstimate =
        areaEstimatedQuantity > 0 &&
        areaReportedSummary.totalReported > areaEstimatedQuantity;

    const getDailyReportPhotoUrl = (photoUrl?: string | null) => {
        if (!photoUrl) return "";

        if (photoUrl.startsWith("http")) {
            return photoUrl;
        }

        const { data } = supabase.storage
            .from("daily-report-photos")
            .getPublicUrl(photoUrl);

        return data.publicUrl;
    };

    const activePhotos =
        report?.daily_report_photos?.filter((photo) => !photo.is_deleted) || [];

    const pendingPhotos = activePhotos.filter(
        (photo) => photo.approval_status === "Pending"
    );

    const rejectedPhotos = activePhotos.filter(
        (photo) => photo.approval_status === "Rejected"
    );

    const hasLabourRecords = (report?.daily_report_workers?.length || 0) > 0;
    const hasPhotos = activePhotos.length > 0;
    const hasPendingPhotos = pendingPhotos.length > 0;
    const hasRejectedPhotos = rejectedPhotos.length > 0;

    const approvalBlockedReasons = [
        !hasLabourRecords ? "Labour records missing." : null,
        !hasPhotos ? "At least one photo is required." : null,
        hasPendingPhotos ? "Some photos are still pending approval." : null,
        hasRejectedPhotos ? "Some photos were rejected." : null,
        isReportedOverEstimate
            ? "Reported quantity is over the estimated area. Please review before approval."
            : null,
    ].filter(Boolean);

    const currentReportCompletedQuantity = Number(report?.completed_quantity || 0);
    const labourSummary = (report?.daily_report_workers || []).reduce(
        (summary, worker) => {
            summary.regularHours += Number(worker.regular_hours || 0);
            summary.overtimeHours += Number(worker.overtime_hours || 0);
            summary.completedQuantity += Number(worker.completed_quantity || 0);

            return summary;
        },
        {
            regularHours: 0,
            overtimeHours: 0,
            completedQuantity: 0,
        }
    );
    const approvedCompletedBeforeThisReport =
        report?.approval_status === "Approved"
            ? Math.max(
                areaReportedSummary.approvedCompleted - currentReportCompletedQuantity,
                0
            )
            : areaReportedSummary.approvedCompleted;

    const saveLabourRecord = useMutation({
        mutationFn: async () => {
            if (!reportId) {
                throw new Error("Daily report ID is missing.");
            }

            if (!report) {
                throw new Error("Daily report data is missing.");
            }

            if (!labourEmployeeId) {
                throw new Error("Please select employee.");
            }

            if (!labourActivityTypeId) {
                throw new Error("Please select activity.");
            }

            const regularHours = Number(labourRegularHours || 0);
            const overtimeHours = Number(labourOvertimeHours || 0);
            const completedQuantity = Number(labourCompletedQuantity || 0);

            if (regularHours < 0) {
                throw new Error("Regular hours cannot be negative.");
            }

            if (overtimeHours < 0) {
                throw new Error("Overtime hours cannot be negative.");
            }

            if (completedQuantity < 0) {
                throw new Error("Completed quantity cannot be negative.");
            }

            await ensurePayrollTimeLogsAreEditable(reportId);

            const payload = {
                report_id: reportId,
                employee_id: labourEmployeeId,
                activity_type_id: labourActivityTypeId,
                regular_hours: regularHours,
                overtime_hours: overtimeHours,
                completed_quantity: completedQuantity,
                worker_role: labourWorkerRole.trim() || null,
                notes: labourNotes.trim() || null,
            };

            if (editingWorkerId) {
                const { error } = await supabase
                    .from("daily_report_workers")
                    .update(payload)
                    .eq("daily_report_worker_id", editingWorkerId);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("daily_report_workers")
                    .insert(payload);

                if (error) throw error;
            }
            const { data: latestLabourRecords, error: latestLabourRecordsError } =
                await supabase
                    .from("daily_report_workers")
                    .select("*")
                    .eq("report_id", reportId);

            if (latestLabourRecordsError) throw latestLabourRecordsError;

            await syncWorkTimeLogs(report, latestLabourRecords || []);
        },
        onSuccess: () => {
            toast.success(
                editingWorkerId
                    ? "Labour record updated successfully."
                    : "Labour record added successfully."
            );

            queryClient.invalidateQueries({ queryKey: ["daily_report", reportId] });
            queryClient.invalidateQueries({ queryKey: ["daily_reports"] });
            resetLabourForm();
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const deleteLabourRecord = useMutation({
        mutationFn: async (dailyReportWorkerId: string) => {
            await ensurePayrollTimeLogsAreEditable(reportId);

            const { error } = await supabase
                .from("daily_report_workers")
                .delete()
                .eq("daily_report_worker_id", dailyReportWorkerId);

            if (error) throw error;
            const { data: latestLabourRecords, error: latestLabourRecordsError } =
                await supabase
                    .from("daily_report_workers")
                    .select("*")
                    .eq("report_id", reportId);

            if (latestLabourRecordsError) throw latestLabourRecordsError;

            await syncWorkTimeLogs(report, latestLabourRecords || []);
        },
        onSuccess: () => {
            toast.success("Labour record deleted successfully.");
            queryClient.invalidateQueries({ queryKey: ["daily_report", reportId] });
            queryClient.invalidateQueries({ queryKey: ["daily_reports"] });
            resetLabourForm();
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const startEditLabourRecord = (worker: any) => {
        setEditingWorkerId(worker.daily_report_worker_id);
        setLabourEmployeeId(worker.employee_id || "");
        setLabourActivityTypeId(worker.activity_type_id || "");
        setLabourClockIn("");
        setLabourClockOut("");
        setLabourBreakMinutes("60");
        setLabourRegularHours(
            worker.regular_hours === null || worker.regular_hours === undefined
                ? ""
                : String(worker.regular_hours)
        );
        setLabourOvertimeHours(
            worker.overtime_hours === null || worker.overtime_hours === undefined
                ? ""
                : String(worker.overtime_hours)
        );
        setLabourCompletedQuantity(
            worker.completed_quantity === null || worker.completed_quantity === undefined
                ? ""
                : String(worker.completed_quantity)
        );
        setLabourWorkerRole(worker.worker_role || "");
        setLabourNotes(worker.notes || "");
        setShowLabourForm(true);
    };

    const updateDailyReport = useMutation({
        mutationFn: async () => {
            if (!reportId) {
                throw new Error("Daily report ID is missing.");
            }

            if (!report) {
                throw new Error("Daily report data is missing.");
            }

            if (!editReportDate) {
                throw new Error("Please select report date.");
            }

            const completedToday = Number(editCompletedQuantity || 0);
            const estimatedQuantity = Number(report.project_areas?.estimated_quantity || 0);

            if (completedToday < 0) {
                throw new Error("Completed Quantity Today cannot be negative.");
            }

            if (
                completedToday === 0 &&
                !editIssuesFound.trim() &&
                !editNotes.trim()
            ) {
                throw new Error(
                    "Please enter Issues Found or Notes when Completed Quantity Today is 0."
                );
            }

            const progress =
                estimatedQuantity > 0
                    ? Math.min((completedToday / estimatedQuantity) * 100, 100)
                    : 0;
            const workers = editWorkersCount ? Number(editWorkersCount) : null;

            if (progress !== null && (progress < 0 || progress > 100)) {
                throw new Error("Progress percent must be between 0 and 100.");
            }

            if (workers !== null && workers < 0) {
                throw new Error("Workers count cannot be negative.");
            }

            const { error } = await supabase
                .from("daily_reports")
                .update({
                    report_date: editReportDate,
                    weather_condition: editWeatherCondition || null,
                    workers_count: workers,
                    approval_status: report.approval_status || "Submitted",
                    progress_percent: progress,
                    completed_quantity: completedToday,
                    work_completed: editWorkCompleted.trim() || null,
                    issues_found: editIssuesFound.trim() || null,
                    next_actions: editNextActions.trim() || null,
                    notes: editNotes.trim() || null,
                })
                .eq("report_id", reportId);

            if (error) throw error;

            const { data: latestLabourRecords, error: latestLabourRecordsError } =
                await supabase
                    .from("daily_report_workers")
                    .select("*")
                    .eq("report_id", reportId);

            if (latestLabourRecordsError) throw latestLabourRecordsError;

            await syncWorkTimeLogs(
                {
                    ...report,
                    report_id: reportId,
                    report_date: editReportDate,
                },
                latestLabourRecords || []
            );

            if (progress !== null && report.work_order_id) {
                let nextStatus = "In Progress";

                if (progress === 0) {
                    nextStatus = "Open";
                }

                if (progress >= 100) {
                    nextStatus = "Completed";
                }

                const { error: workOrderError } = await supabase
                    .from("work_orders")
                    .update({
                        status: nextStatus,
                        actual_start_date: progress > 0 ? editReportDate : null,
                        actual_end_date: progress >= 100 ? editReportDate : null,
                    })
                    .eq("work_order_id", report.work_order_id);

                if (workOrderError) throw workOrderError;
            }
        },
        onSuccess: () => {
            toast.success("Daily report updated successfully.");
            queryClient.invalidateQueries({ queryKey: ["daily_report", reportId] });
            queryClient.invalidateQueries({ queryKey: ["daily_reports"] });
            queryClient.invalidateQueries({ queryKey: ["work_orders"] });
            setShowEditDialog(false);
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const markReadyForInspection = useMutation({
        mutationFn: async () => {
            if (!reportId) {
                throw new Error("Daily report ID is missing.");
            }

            const { error } = await supabase
                .from("daily_reports")
                .update({
                    approval_status: "Ready for Inspection",
                    completed_quantity: report?.completed_quantity ?? 0,
                })
                .eq("report_id", reportId);

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Daily report marked ready for inspection.");
            queryClient.invalidateQueries({ queryKey: ["daily_report", reportId] });
            queryClient.invalidateQueries({ queryKey: ["daily_reports"] });
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const ensurePayrollTimeLogsAreEditable = async (targetReportId: string) => {
        const { data: approvedTimeLogs, error } = await supabase
            .from("work_time_logs")
            .select("work_time_log_id")
            .eq("report_id", targetReportId)
            .eq("approved", true);

        if (error) throw error;

        if ((approvedTimeLogs || []).length > 0) {
            throw new Error(
                "This daily report already has approved payroll time logs. Please unapprove payroll time before editing labour records."
            );
        }
    };

    const syncWorkTimeLogs = async (
        targetReport: any,
        labourRecords: any[]
    ) => {
        if (!targetReport?.report_id) {
            throw new Error("Daily report ID is missing.");
        }

        const { data: approvedTimeLogs, error: approvedTimeLogsError } =
            await supabase
                .from("work_time_logs")
                .select("work_time_log_id")
                .eq("report_id", targetReport.report_id)
                .eq("approved", true);

        if (approvedTimeLogsError) throw approvedTimeLogsError;

        if ((approvedTimeLogs || []).length > 0) {
            throw new Error(
                "This daily report already has approved payroll time logs.  Please unapprove payroll time before updating this daily report."
            );
        }

        const timeLogRows = labourRecords.map((worker) => ({
            report_id: targetReport.report_id,
            employee_id: worker.employee_id,
            project_id: targetReport.project_id,
            site_id: targetReport.site_id,
            area_id: targetReport.area_id,
            work_order_id: targetReport.work_order_id,
            activity_type_id: worker.activity_type_id,
            work_date: targetReport.report_date,
            regular_hours: Number(worker.regular_hours || 0),
            overtime_hours: Number(worker.overtime_hours || 0),
            break_minutes: Number(worker.break_minutes || 0),
            approved: false,
            time_status: "Needs Review",
            notes: worker.notes || worker.worker_role || null,
            is_deleted: false,
        }));

        const { error: deleteExistingTimeLogsError } = await supabase
            .from("work_time_logs")
            .delete()
            .eq("report_id", targetReport.report_id);

        if (deleteExistingTimeLogsError) throw deleteExistingTimeLogsError;

        if (timeLogRows.length > 0) {
            const { error: insertTimeLogsError } = await supabase
                .from("work_time_logs")
                .insert(timeLogRows);

            if (insertTimeLogsError) throw insertTimeLogsError;
        }
    };

    const approveDailyReport = useMutation({
        mutationFn: async () => {
            if (!reportId) {
                throw new Error("Daily report ID is missing.");
            }
            const labourRecords = report.daily_report_workers || [];

            const estimatedQuantity = areaEstimatedQuantity;
            const approvedAfterThisApproval =
                approvedCompletedBeforeThisReport + currentReportCompletedQuantity;

            if (
                estimatedQuantity > 0 &&
                approvedAfterThisApproval > estimatedQuantity
            ) {
                throw new Error(
                    "This approval would exceed the estimated area quantity. Please create a variation or adjust the estimate before approval."
                );
            }

            if (labourRecords.length === 0) {
                throw new Error(
                    "Please add labour records before approving this daily report."
                );
            }

            const invalidLabourRecords = labourRecords.filter(
                (worker) => !worker.employee_id || !worker.activity_type_id
            );

            if (invalidLabourRecords.length > 0) {
                throw new Error(
                    "Some labour records are missing employee or activity."
                );
            }
            const photos =
                report.daily_report_photos?.filter((photo) => !photo.is_deleted) || [];

            if (photos.length === 0) {
                throw new Error(
                    "Please upload and approve at least one photo before approving this daily report."
                );
            }

            const pendingPhotos = photos.filter(
                (photo) => photo.approval_status === "Pending"
            );

            if (pendingPhotos.length > 0) {
                throw new Error(
                    "Please complete photo approval before approving this daily report."
                );
            }

            const rejectedPhotos = photos.filter(
                (photo) => photo.approval_status === "Rejected"
            );

            if (rejectedPhotos.length > 0) {
                throw new Error(
                    "This daily report has rejected photos. Please review photos before approving."
                );
            }

            const { error } = await supabase
                .from("daily_reports")
                .update({
                    approval_status: "Approved",
                    completed_quantity: report?.completed_quantity ?? 0,
                })
                .eq("report_id", reportId);

            if (error) throw error;


        },
        onSuccess: () => {
            toast.success("Daily report approved.");
            queryClient.invalidateQueries({ queryKey: ["daily_report", reportId] });
            queryClient.invalidateQueries({ queryKey: ["daily_reports"] });
            queryClient.invalidateQueries({ queryKey: ["work_time_logs"] });
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const rejectDailyReport = useMutation({
        mutationFn: async () => {
            if (!reportId) {
                throw new Error("Daily report ID is missing.");
            }

            const { error } = await supabase
                .from("daily_reports")
                .update({
                    approval_status: "Rejected",
                    completed_quantity: report?.completed_quantity ?? 0,
                })
                .eq("report_id", reportId);

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Daily report rejected.");
            queryClient.invalidateQueries({ queryKey: ["daily_report", reportId] });
            queryClient.invalidateQueries({ queryKey: ["daily_reports"] });
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const uploadPhoto = useMutation({

        mutationFn: async () => {
            if (!reportId) {
                throw new Error("Daily report ID is missing.");
            }

            if (!photoFile) {
                throw new Error("Please select a photo.");
            }

            const fileExt = photoFile.name.split(".").pop();
            const fileName = `${reportId}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("daily-report-photos")
                .upload(fileName, photoFile, {
                    cacheControl: "3600",
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
                .from("daily-report-photos")
                .getPublicUrl(fileName);

            const { error: insertError } = await supabase
                .from("daily_report_photos")
                .insert({
                    report_id: reportId,
                    photo_url: publicUrlData.publicUrl,
                    caption: photoCaption.trim() || null,
                    sort_order: 0,
                    taken_at: new Date().toISOString(),
                    is_deleted: false,
                    approval_status: "Pending",
                    approved_by: null,
                    approved_at: null,
                    rejected_reason: null,
                });

            if (insertError) throw insertError;
        },
        onSuccess: () => {
            toast.success("Photo uploaded successfully.");
            queryClient.invalidateQueries({ queryKey: ["daily_report", reportId] });
            queryClient.invalidateQueries({ queryKey: ["daily_reports"] });
            setPhotoFile(null);
            setPhotoCaption("");
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const approvePhoto = useMutation({
        mutationFn: async (photoId: string) => {
            const { error } = await supabase
                .from("daily_report_photos")
                .update({
                    approval_status: "Approved",
                    approved_by: null,
                    approved_at: new Date().toISOString(),
                    rejected_reason: null,
                })
                .eq("photo_id", photoId);

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Photo approved.");
            queryClient.invalidateQueries({ queryKey: ["daily_report", reportId] });
            queryClient.invalidateQueries({ queryKey: ["daily_reports"] });
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const rejectPhoto = useMutation({
        mutationFn: async (photoId: string) => {
            const { error } = await supabase
                .from("daily_report_photos")
                .update({
                    approval_status: "Rejected",
                    approved_by: null,
                    approved_at: null,
                    rejected_reason: "Rejected from daily report review.",
                })
                .eq("photo_id", photoId);

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Photo rejected.");
            queryClient.invalidateQueries({ queryKey: ["daily_report", reportId] });
            queryClient.invalidateQueries({ queryKey: ["daily_reports"] });
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const deletePhoto = useMutation({
        mutationFn: async (photoId: string) => {
            const { error } = await supabase
                .from("daily_report_photos")
                .update({
                    is_deleted: true,
                    deleted_at: new Date().toISOString(),
                    approval_status: "Pending",
                    approved_by: null,
                    approved_at: null,
                    rejected_reason: null,
                })
                .eq("photo_id", photoId);

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Photo deleted successfully.");
            queryClient.invalidateQueries({ queryKey: ["daily_report", reportId] });
            queryClient.invalidateQueries({ queryKey: ["daily_reports"] });
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });
    if (isLoading) {
        return <div className="p-6 text-slate-500">Loading daily report...</div>;
    }

    if (!report) {
        return (
            <div className="p-6 space-y-4">
                <p className="text-slate-500">Daily report not found.</p>
                <Button variant="outline" onClick={() => navigate("/daily-reports")}>
                    Back to Daily Reports
                </Button>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <Button
                    variant="outline"
                    onClick={() => navigate("/daily-reports")}
                    className="w-full sm:w-auto flex items-center justify-center gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>

                <div className="grid grid-cols-1 sm:flex gap-2 sm:gap-3 w-full sm:w-auto">
                    {report.approval_status === "Submitted" && (
                        <Button
                            variant="outline"
                            onClick={() => markReadyForInspection.mutate()}

                            disabled={markReadyForInspection.isPending}
                        >
                            {markReadyForInspection.isPending
                                ? "Updating..."
                                : "Ready for Inspection"}
                        </Button>
                    )}

                    {report.approval_status === "Ready for Inspection" && (
                        <Button
                            variant="outline"
                            onClick={() => approveDailyReport.mutate()}
                            disabled={approveDailyReport.isPending}
                        >
                            {approveDailyReport.isPending ? "Approving..." : "Approve"}
                        </Button>
                    )}

                    {report.approval_status === "Ready for Inspection" && (
                        <Button
                            variant="outline"
                            onClick={() => rejectDailyReport.mutate()}
                            disabled={rejectDailyReport.isPending}
                            className="w-full sm:w-auto text-red-600 hover:text-red-700"
                        >
                            {rejectDailyReport.isPending ? "Rejecting..." : "Reject"}
                        </Button>
                    )}

                    <Button
                        onClick={() => setShowEditDialog(true)}
                        className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
                    >
                        Edit Daily Report
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
                <div className="flex items-center gap-3">
                    <CalendarDays className="h-8 w-8 text-red-600" />
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                            Daily Report
                        </h1>
                        <p className="text-slate-500 mt-1">
                            Report Date: {report.report_date || "-"}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5">
                    <h2 className="font-bold text-slate-900 mb-4">Project</h2>

                    <div className="space-y-3 text-sm">
                        <div>
                            <p className="text-slate-500">Customer</p>
                            <p className="font-medium">
                                {report.projects?.customers?.customer_name || "-"}
                            </p>
                        </div>

                        <div>
                            <p className="text-slate-500">Project</p>
                            <p className="font-medium">
                                {report.projects?.project_no || "-"} -{" "}
                                {report.projects?.project_name || "-"}
                            </p>
                        </div>

                        <div>
                            <p className="text-slate-500">Site</p>
                            <p className="font-medium">
                                {report.project_sites?.site_code || "-"} -{" "}
                                {report.project_sites?.site_name || "-"}
                            </p>
                        </div>

                        <div>
                            <p className="text-slate-500">Area</p>
                            <p className="font-medium">
                                {report.project_areas?.area_code || "-"} -{" "}
                                {report.project_areas?.area_name || "-"}
                            </p>
                        </div>
                        <div className="border-t pt-3 mt-3">
                            <p className="font-semibold text-slate-900 mb-2">
                                Work Order
                            </p>
                        </div>

                        <div>
                            <p className="text-slate-500">Work Order</p>
                            <p className="font-medium">
                                {report.work_orders?.work_order_no || "-"} -{" "}
                                {report.work_orders?.title || "-"}
                            </p>
                        </div>

                        <div>
                            <p className="text-slate-500">Status</p>
                            <p className="font-medium">
                                {report.work_orders?.status || "-"}
                            </p>
                        </div>

                        <div>
                            <p className="text-slate-500">Priority</p>
                            <p className="font-medium">
                                {report.work_orders?.priority || "-"}
                            </p>
                        </div>
                    </div>
                </div>

                // เพิ่ม Card แสดง Linked Work Time Logs

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                        <div>
                            <h2 className="font-bold text-slate-900">Work Time Log Verification</h2>
                            <p className="text-sm text-slate-500">
                                Compare labour records with linked work time logs before payroll review.
                            </p>
                        </div>
                        <span className="text-sm font-semibold text-slate-700">
                            {linkedWorkTimeLogs.length} log(s)
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <p className="text-xs text-slate-500">Labour Records</p>
                            <p className="mt-1 text-lg font-bold text-slate-900">
                                {report.daily_report_workers?.length || 0}
                            </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <p className="text-xs text-slate-500">Work Time Logs</p>
                            <p className="mt-1 text-lg font-bold text-slate-900">
                                {linkedWorkTimeLogs.length}
                            </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <p className="text-xs text-slate-500">Verification</p>
                            <p className="mt-1 text-lg font-bold text-slate-900">
                                {(report.daily_report_workers?.length || 0) === linkedWorkTimeLogs.length
                                    ? "PASS"
                                    : "CHECK"}
                            </p>
                        </div>
                    </div>

                    {linkedWorkTimeLogs.length === 0 ? (
                        <p className="text-sm text-slate-500">
                            No linked work time logs found for this daily report.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-left text-slate-500">
                                        <th className="py-2 pr-3 font-medium">Employee</th>
                                        <th className="py-2 pr-3 font-medium">Activity</th>
                                        <th className="py-2 pr-3 font-medium">Work Date</th>
                                        <th className="py-2 pr-3 font-medium">Regular</th>
                                        <th className="py-2 pr-3 font-medium">OT</th>
                                        <th className="py-2 pr-3 font-medium">Break</th>
                                        <th className="py-2 pr-3 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {linkedWorkTimeLogs.map((log: any) => {
                                        const employeeName =
                                            log.employees?.display_name ||
                                            `${log.employees?.first_name || ""} ${log.employees?.last_name || ""}`.trim() ||
                                            log.employees?.employee_code ||
                                            "-";

                                        return (
                                            <tr key={log.work_time_log_id} className="border-b border-slate-100">
                                                <td className="py-2 pr-3 font-medium text-slate-900">
                                                    {employeeName}
                                                </td>
                                                <td className="py-2 pr-3 text-slate-700">
                                                    {log.work_activity_types?.activity_name || "-"}
                                                </td>
                                                <td className="py-2 pr-3 text-slate-700">
                                                    {log.work_date || "-"}
                                                </td>
                                                <td className="py-2 pr-3 text-slate-700">
                                                    {Number(log.regular_hours || 0).toFixed(2)}
                                                </td>
                                                <td className="py-2 pr-3 text-slate-700">
                                                    {Number(log.overtime_hours || 0).toFixed(2)}
                                                </td>
                                                <td className="py-2 pr-3 text-slate-700">
                                                    {Number(log.break_minutes || 0)}
                                                </td>
                                                <td className="py-2 pr-3 text-slate-700">
                                                    {log.approved ? "Payroll Approved" : log.time_status || "Needs Review"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                //จบเพิ่ม Card แสดง Linked Work Time Logs

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5">
                    <h2 className="font-bold text-slate-900 mb-4">Daily Summary</h2>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                                <p className="text-xs text-slate-500">Completed Today</p>
                                <p className="text-lg font-bold text-slate-900 mt-1">
                                    {report.completed_quantity ?? 0}{" "}
                                    {report.project_areas?.unit_of_measure || ""}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                                <p className="text-xs text-slate-500">Progress</p>
                                <p className="text-lg font-bold text-slate-900 mt-1">
                                    {report.progress_percent ?? "-"}%
                                </p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 p-3">
                            <p className="text-xs text-slate-500">Approval Status</p>
                            <p className="text-base font-semibold text-slate-900 mt-1">
                                {report.approval_status || "-"}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-slate-500">Weather</p>
                                <p className="font-medium text-slate-900">
                                    {report.weather_condition || "-"}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-500">Workers Count</p>
                                <p className="font-medium text-slate-900">
                                    {report.daily_report_workers?.length
                                        ? new Set(
                                            report.daily_report_workers.map(
                                                (worker) => worker.employee_id
                                            )
                                        ).size
                                        : 0}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-500">Estimated Area</p>
                                <p className="font-medium text-slate-900">
                                    {report.project_areas?.estimated_quantity ?? 0}{" "}
                                    {report.project_areas?.unit_of_measure || ""}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-500">Photos</p>
                                <p className="font-medium text-slate-900">
                                    {report.daily_report_photos?.filter((photo) => !photo.is_deleted).length || 0}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5">
                    <h2 className="font-bold text-slate-900 mb-4">
                        Area Progress Summary
                    </h2>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                                <p className="text-xs text-slate-500">Official Progress</p>
                                <p className="text-lg font-bold text-slate-900 mt-1">
                                    {Number(areaProgress?.progress_percent || 0).toFixed(2)}%
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                                <p className="text-xs text-slate-500">Remaining</p>
                                <p className="text-lg font-bold text-slate-900 mt-1">
                                    {Number(areaProgress?.remaining_quantity || 0).toFixed(2)}{" "}
                                    {areaProgress?.unit_of_measure || report.project_areas?.unit_of_measure || ""}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-slate-500">Area Estimated</p>
                                <p className="font-medium text-slate-900">
                                    {areaEstimatedQuantity.toFixed(2)}{" "}
                                    {areaProgress?.unit_of_measure || report.project_areas?.unit_of_measure || ""}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-500">Approved Completed</p>
                                <p className="font-medium text-green-600">
                                    {areaReportedSummary.approvedCompleted.toFixed(2)}{" "}
                                    {areaProgress?.unit_of_measure || report.project_areas?.unit_of_measure || ""}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-500">Pending Review</p>
                                <p className="font-medium text-orange-600">
                                    {areaReportedSummary.pendingReview.toFixed(2)}{" "}
                                    {areaProgress?.unit_of_measure || report.project_areas?.unit_of_measure || ""}
                                </p>
                            </div>

                            <div>
                                <p className="text-slate-500">Total Reported</p>
                                <p className="font-medium text-blue-600">
                                    {areaReportedSummary.totalReported.toFixed(2)}{" "}
                                    {areaProgress?.unit_of_measure || report.project_areas?.unit_of_measure || ""}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 p-3">
                            <p className="text-xs text-slate-500">Reported Including Pending</p>
                            <p className="text-base font-semibold text-blue-600 mt-1">
                                {areaReportedSummary.totalReported.toFixed(2)}{" "}
                                {areaProgress?.unit_of_measure || report.project_areas?.unit_of_measure || ""}{" "}
                                ({reportedIncludingPendingPercent.toFixed(2)}% of estimate)
                            </p>
                        </div>

                        {isReportedOverEstimate && (
                            <div className="rounded-xl border border-orange-200 bg-orange-50 p-3">
                                <p className="text-sm font-semibold text-orange-700">
                                    Reported quantity is over the estimated area.
                                </p>
                                <p className="text-xs text-orange-700 mt-1">
                                    Please review pending reports before approval.
                                </p>
                            </div>
                        )}

                        {isAreaCompleted && (
                            <div className="border-t pt-3 mt-3">
                                <p className="text-sm font-semibold text-green-700">
                                    Area completed: {approvedCompletedQuantity.toFixed(2)} /{" "}
                                    {areaEstimatedQuantity.toFixed(2)}{" "}
                                    {areaProgress?.unit_of_measure || report.project_areas?.unit_of_measure || ""}
                                    {" "}(100%)
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    Approved completed quantity has reached the estimated area quantity.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {approvalBlockedReasons.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-orange-200 p-4 sm:p-5">
                    <h2 className="font-bold text-slate-900 mb-3">
                        Approval Checklist
                    </h2>

                    <div className="rounded-xl bg-orange-50 border border-orange-200 p-3 sm:p-4">
                        <p className="text-sm font-semibold text-orange-700 mb-2">
                            This daily report cannot be approved yet.
                        </p>

                        <ul className="list-disc pl-5 space-y-1 text-sm text-orange-700">
                            {approvalBlockedReasons.map((reason) => (
                                <li key={reason}>{reason}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5">
                <h2 className="font-bold text-slate-900 mb-3">Work Activities & Labour</h2>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5">
                    <h2 className="font-bold text-slate-900 mb-4">Labour Records Summary</h2>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                            <p className="text-xs text-slate-500">Regular</p>
                            <p className="text-base font-bold text-slate-900 mt-1">
                                {labourSummary.regularHours.toFixed(2)}
                            </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                            <p className="text-xs text-slate-500">OT</p>
                            <p className="text-base font-bold text-slate-900 mt-1">
                                {labourSummary.overtimeHours.toFixed(2)}
                            </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                            <p className="text-xs text-slate-500">Qty</p>
                            <p className="text-base font-bold text-slate-900 mt-1">
                                {labourSummary.completedQuantity.toFixed(2)}
                            </p>
                        </div>
                    </div>

                    {report.daily_report_workers?.length ? (
                        <div className="space-y-3">
                            {report.daily_report_workers.map((worker) => (
                                <div
                                    key={worker.daily_report_worker_id}
                                    className="rounded-2xl border border-slate-200 p-4 bg-slate-50"
                                >
                                    <div className="flex flex-col gap-3">
                                        <div className="rounded-xl border border-slate-200 bg-white p-3">
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                        Worker
                                                    </p>

                                                    <p className="mt-1 text-base font-bold text-slate-900">
                                                        {worker.employees?.display_name ||
                                                            `${worker.employees?.first_name || ""} ${worker.employees?.last_name || ""}`.trim() ||
                                                            worker.employees?.employee_code ||
                                                            "-"}
                                                    </p>
                                                </div>

                                                <div className="sm:text-right">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                        Activity
                                                    </p>

                                                    <p className="mt-1 text-sm font-semibold text-slate-800">
                                                        {worker.work_activity_types?.activity_name || "-"}
                                                    </p>
                                                </div>
                                            </div>

                                            <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                                                Labour, activity, hours, and completed quantity for this worker.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                            <div>
                                                <p className="text-slate-500">Regular</p>
                                                <p className="font-medium text-slate-900">
                                                    {Number(worker.regular_hours || 0).toFixed(2)}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-slate-500">OT</p>
                                                <p className="font-medium text-slate-900">
                                                    {Number(worker.overtime_hours || 0).toFixed(2)}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-slate-500">Qty</p>
                                                <p className="font-medium text-slate-900">
                                                    {Number(worker.completed_quantity || 0).toFixed(2)}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-slate-500">Role</p>
                                                <p className="font-medium text-slate-900">
                                                    {worker.worker_role || "-"}
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-sm text-slate-500">Notes</p>
                                            <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                                {worker.notes || "-"}
                                            </p>
                                        </div>

                                        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => startEditLabourRecord(worker)}
                                                className="h-9 rounded-lg border-blue-200 bg-blue-50 px-3 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                                            >
                                                <Pencil className="mr-1.5 h-4 w-4" />
                                                Edit
                                            </Button>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const confirmed = window.confirm(
                                                        "Are you sure you want to delete this labour record?"
                                                    );

                                                    if (!confirmed) return;

                                                    deleteLabourRecord.mutate(worker.daily_report_worker_id);
                                                }}
                                                disabled={deleteLabourRecord.isPending}
                                                className="h-9 rounded-lg border-red-200 bg-red-50 px-3 text-red-700 hover:bg-red-100 hover:text-red-800"
                                            >
                                                <Trash2 className="mr-1.5 h-4 w-4" />
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500">No labour records added.</p>
                    )}
                    <div className="mt-5 border-t border-slate-200 pt-5">
                        <div className="flex flex-col gap-2">
                            <h3 className="font-semibold text-slate-900">
                                {editingWorkerId ? "Edit Worker" : "Add Worker"}
                            </h3>

                            <p className="text-xs text-slate-500">
                                Add or edit labour records for this daily progress review.
                            </p>
                        </div>

                        {!showLabourForm && (
                            <div className="mt-4 flex justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowLabourForm(true)}
                                    className="w-auto rounded-lg border-slate-300 bg-white px-4 font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    + Add Worker
                                </Button>
                            </div>
                        )}

                        {showLabourForm && (
                            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-5">
                                <div className="border-b border-slate-200 pb-3">
                                    <p className="font-semibold text-slate-900">
                                        {editingWorkerId ? "Edit Worker Details" : "Add Worker Details"}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Select worker, activity, role, time, completed quantity, and notes.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Employee *</Label>
                                        <Select value={labourEmployeeId} onValueChange={setLabourEmployeeId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select employee" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {employees.map((employee) => (
                                                    <SelectItem key={employee.employee_id} value={employee.employee_id}>
                                                        {employee.display_name ||
                                                            `${employee.first_name || ""} ${employee.last_name || ""}`.trim() ||
                                                            employee.employee_code}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Activity *</Label>
                                        <Select value={labourActivityTypeId} onValueChange={setLabourActivityTypeId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select activity" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {workActivityTypes.map((activity) => (
                                                    <SelectItem key={activity.activity_type_id} value={activity.activity_type_id}>
                                                        {activity.activity_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Role</Label>
                                        <Select value={labourWorkerRole} onValueChange={setLabourWorkerRole}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Installer">Installer</SelectItem>
                                                <SelectItem value="Supervisor">Supervisor</SelectItem>
                                                <SelectItem value="Team Leader">Team Leader</SelectItem>
                                                <SelectItem value="Labourer">Labourer</SelectItem>
                                                <SelectItem value="Helper">Helper</SelectItem>
                                                <SelectItem value="Apprentice">Apprentice</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div>
                                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Time and Quantity
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>Clock In</Label>
                                            <Input
                                                type="time"
                                                value={labourClockIn}
                                                onChange={(event) => {
                                                    const value = event.target.value;
                                                    setLabourClockIn(value);
                                                    calculateLabourHours(value, labourClockOut, labourBreakMinutes);
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Clock Out</Label>
                                    <Input
                                        type="time"
                                        value={labourClockOut}
                                        onChange={(event) => {
                                            const value = event.target.value;
                                            setLabourClockOut(value);
                                            calculateLabourHours(labourClockIn, value, labourBreakMinutes);
                                        }}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:flex sm:justify-end gap-3">
                                    <Button variant="outline" className="w-full sm:w-auto" onClick={resetLabourForm}>
                                        Cancel
                                    </Button>

                                    <Button
                                        onClick={() => saveLabourRecord.mutate()}
                                        disabled={saveLabourRecord.isPending}
                                        className="bg-red-600 hover:bg-red-700 text-white"
                                    >
                                        {saveLabourRecord.isPending
                                            ? "Saving..."
                                            : editingWorkerId
                                                ? "Update Worker"
                                                : "Save Worker"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 border-t border-slate-200 pt-5">
                        <h3 className="font-semibold text-slate-900">Work Activities</h3>

                        <p className="mt-1 text-xs text-slate-500">
                            Select one or more work activities completed in this daily report.
                        </p>

                        {report.daily_report_activities?.length ? (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {report.daily_report_activities.map((item) => (
                                    <span
                                        key={item.daily_report_activity_id}
                                        className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
                                    >
                                        {item.work_activity_types?.activity_name || "-"}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                                <p className="font-medium text-amber-800">
                                    No work activities selected.
                                </p>
                                <p className="mt-1 text-sm text-amber-700">
                                    Please select one or more work activities for this daily progress review.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5">
                    <h2 className="font-bold text-slate-900 mb-3">Work Completed</h2>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">
                        {report.work_completed || "No work completed note."}
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5">
                    <h2 className="font-bold text-slate-900 mb-3">Issues Found</h2>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">
                        {report.issues_found || "No issues found."}
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5">
                    <h2 className="font-bold text-slate-900 mb-3">Next Actions</h2>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">
                        {report.next_actions || "No next actions."}
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5">
                    <h2 className="font-bold text-slate-900 mb-3">Notes</h2>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">
                        {report.notes || "No notes."}
                    </p>
                </div>
                <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                    <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Edit Daily Report</DialogTitle>
                        </DialogHeader>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Report Date *</Label>
                                <Input
                                    type="date"
                                    value={editReportDate}
                                    onChange={(event) => setEditReportDate(event.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Weather</Label>
                                <Select
                                    value={editWeatherCondition}
                                    onValueChange={setEditWeatherCondition}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select weather" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Fine">Fine</SelectItem>
                                        <SelectItem value="Cloudy">Cloudy</SelectItem>
                                        <SelectItem value="Rain">Rain</SelectItem>
                                        <SelectItem value="Storm">Storm</SelectItem>
                                        <SelectItem value="Hot">Hot</SelectItem>
                                        <SelectItem value="Cold">Cold</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Workers Count</Label>
                                <Input
                                    type="number"
                                    value={editWorkersCount}
                                    onChange={(event) => setEditWorkersCount(event.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Completed Quantity Today</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={editCompletedQuantity}
                                    onChange={(event) => setEditCompletedQuantity(event.target.value)}
                                />
                            </div>

                            <div className="sm:col-span-2 space-y-2">
                                <Label>Work Completed</Label>
                                <Textarea
                                    value={editWorkCompleted}
                                    onChange={(event) => setEditWorkCompleted(event.target.value)}
                                    rows={3}
                                />
                            </div>

                            <div className="sm:col-span-2 space-y-2">
                                <Label>Issues Found</Label>
                                <Textarea
                                    value={editIssuesFound}
                                    onChange={(event) => setEditIssuesFound(event.target.value)}
                                    rows={3}
                                />
                            </div>

                            <div className="sm:col-span-2 space-y-2">
                                <Label>Next Actions</Label>
                                <Textarea
                                    value={editNextActions}
                                    onChange={(event) => setEditNextActions(event.target.value)}
                                    rows={3}
                                />
                            </div>

                            <div className="sm:col-span-2 space-y-2">
                                <Label>Notes</Label>
                                <Textarea
                                    value={editNotes}
                                    onChange={(event) => setEditNotes(event.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:flex sm:justify-end gap-3 pt-4">
                            <Button
                                variant="outline"
                                className="w-full sm:w-auto"
                                onClick={() => setShowEditDialog(false)}
                            >
                                Cancel
                            </Button>

                            <Button
                                onClick={() => updateDailyReport.mutate()}
                                disabled={updateDailyReport.isPending}
                                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
                            >
                                {updateDailyReport.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>

                    </DialogContent>
                </Dialog>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5">
                <h2 className="font-bold text-slate-900 mb-4">Photos</h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 sm:mb-6">
                    <div className="sm:col-span-1 space-y-2">
                        <Label>Photo</Label>
                        <Input
                            type="file"
                            accept="image/*"
                            onChange={(event) => {
                                const file = event.target.files?.[0] || null;
                                setPhotoFile(file);
                            }}
                        />
                    </div>

                    <div className="sm:col-span-2 space-y-2">
                        <Label>Caption</Label>
                        <Input
                            value={photoCaption}
                            onChange={(event) => setPhotoCaption(event.target.value)}
                            placeholder="Photo caption"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:flex sm:justify-end mb-6">
                    <Button
                        onClick={() => uploadPhoto.mutate()}
                        disabled={uploadPhoto.isPending}
                        className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
                    >
                        {uploadPhoto.isPending ? "Uploading..." : "Upload Photo"}
                    </Button>
                </div>

                {report.daily_report_photos?.filter((photo) => !photo.is_deleted).length ===
                    0 ? (
                    <p className="text-sm text-slate-500">No photos uploaded.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                        {report.daily_report_photos
                            ?.filter((photo) => !photo.is_deleted)
                            .map((photo) => (
                                <div
                                    key={photo.photo_id}
                                    className="border rounded-xl overflow-hidden bg-white"
                                >
                                    <img
                                        src={getDailyReportPhotoUrl(photo.photo_url)}
                                        alt={photo.caption || "Daily report photo"}
                                        className="w-full h-44 sm:h-48 object-cover"
                                    />
                                    <div className="p-3">
                                        <p className="text-sm font-medium text-slate-800">
                                            {photo.caption || "No caption"}
                                        </p>
                                        <p className="text-xs mt-2">
                                            Status:{" "}
                                            <span className="font-semibold">
                                                {photo.approval_status || "Pending"}
                                            </span>
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {photo.taken_at
                                                ? new Date(photo.taken_at).toLocaleString()
                                                : "-"
                                            }
                                        </p>

                                        <div className="mt-3 grid grid-cols-1 gap-2">
                                            {photo.approval_status !== "Approved" && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => approvePhoto.mutate(photo.photo_id)}
                                                    disabled={approvePhoto.isPending}
                                                    className="w-full text-green-700 hover:text-green-800"
                                                >
                                                    Approve
                                                </Button>
                                            )}

                                            {photo.approval_status !== "Rejected" && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => rejectPhoto.mutate(photo.photo_id)}
                                                    disabled={rejectPhoto.isPending}
                                                    className="w-full text-orange-700 hover:text-orange-800"
                                                >
                                                    Reject
                                                </Button>
                                            )}

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => deletePhoto.mutate(photo.photo_id)}
                                                disabled={deletePhoto.isPending}
                                                className="w-full text-red-600 hover:text-red-700"
                                            >
                                                Delete
                                            </Button>

                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div >
    );
};

export default DailyReportDashboard;