import { ArrowLeft, CalendarDays } from "lucide-react";
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

    const reportedProgressPercent =
        areaEstimatedQuantity > 0
            ? Math.min(
                (areaReportedSummary.totalReported / areaEstimatedQuantity) * 100,
                100
            )
            : 0;

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


    const approveDailyReport = useMutation({
        mutationFn: async () => {
            if (!reportId) {
                throw new Error("Daily report ID is missing.");
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
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <Button
                    variant="outline"
                    onClick={() => navigate("/daily-reports")}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>

                <div className="flex gap-3">
                    {report.approval_status === "Submitted" && (
                        <Button
                            variant="outline"
                            onClick={() => markReadyForInspection.mutate()}
                            disabled={markReadyForInspection.isPending}
                        >
                            {markReadyForInspection.isPending
                                ? "Updating..."
                                : "Mark Ready for Inspection"}
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
                            className="text-red-600 hover:text-red-700"
                        >
                            {rejectDailyReport.isPending ? "Rejecting..." : "Reject"}
                        </Button>
                    )}

                    <Button
                        onClick={() => setShowEditDialog(true)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        Edit Daily Report
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3">
                    <CalendarDays className="h-8 w-8 text-red-600" />
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">
                            Daily Report
                        </h1>
                        <p className="text-slate-500 mt-1">
                            Report Date: {report.report_date || "-"}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
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

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                    <h2 className="font-bold text-slate-900 mb-4">Daily Summary</h2>

                    <div className="space-y-3 text-sm">

                        <div>
                            <p className="text-slate-500">Approval Status</p>
                            <p className="font-medium">
                                {report.approval_status || "-"}
                            </p>
                        </div>

                        <div>
                            <p className="text-slate-500">Weather</p>
                            <p className="font-medium">
                                {report.weather_condition || "-"}
                            </p>
                        </div>

                        <div>
                            <p className="text-slate-500">Workers Count</p>
                            <p className="font-medium">
                                {report.workers_count ?? "-"}
                            </p>
                        </div>

                        <div>
                            <p className="text-slate-500">Completed Today</p>
                            <p className="font-medium">
                                {report.completed_quantity ?? 0}{" "}
                                {report.project_areas?.unit_of_measure || ""}
                            </p>
                        </div>

                        <div>
                            <p className="text-slate-500">Estimated Area</p>
                            <p className="font-medium">
                                {report.project_areas?.estimated_quantity ?? 0}{" "}
                                {report.project_areas?.unit_of_measure || ""}
                            </p>
                        </div>

                        <div>
                            <p className="text-slate-500">Progress</p>
                            <p className="font-medium">
                                {report.progress_percent ?? "-"}%
                            </p>
                        </div>

                        <div>
                            <p className="text-slate-500">Photos</p>
                            <p className="font-medium">
                                {report.daily_report_photos?.filter((photo) => !photo.is_deleted).length || 0}
                            </p>
                        </div>

                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                    <h2 className="font-bold text-slate-900 mb-4">
                        Area Progress Summary
                    </h2>

                    <div className="space-y-3 text-sm">
                        <div>
                            <p className="text-slate-500">Area Estimated</p>
                            <p className="font-medium">
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

                        <div>
                            <p className="text-slate-500">Remaining Approved</p>
                            <p className="font-medium">
                                {Number(areaProgress?.remaining_quantity || 0).toFixed(2)}{" "}
                                {areaProgress?.unit_of_measure || report.project_areas?.unit_of_measure || ""}
                            </p>
                        </div>

                        <div>
                            <p className="text-slate-500">Official Progress</p>
                            <p className="font-medium">
                                {Number(areaProgress?.progress_percent || 0).toFixed(2)}%
                            </p>
                        </div>

                        <div>
                            <p className="text-slate-500">Reported Progress</p>
                            <p className="font-medium text-blue-600">
                                {reportedProgressPercent.toFixed(2)}%
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                    <h2 className="font-bold text-slate-900 mb-3">Work Completed</h2>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">
                        {report.work_completed || "No work completed note."}
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                    <h2 className="font-bold text-slate-900 mb-3">Issues Found</h2>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">
                        {report.issues_found || "No issues found."}
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                    <h2 className="font-bold text-slate-900 mb-3">Next Actions</h2>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">
                        {report.next_actions || "No next actions."}
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                    <h2 className="font-bold text-slate-900 mb-3">Notes</h2>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">
                        {report.notes || "No notes."}
                    </p>
                </div>
                <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Edit Daily Report</DialogTitle>
                        </DialogHeader>

                        <div className="grid grid-cols-2 gap-4">
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

                            <div className="col-span-2 space-y-2">
                                <Label>Work Completed</Label>
                                <Textarea
                                    value={editWorkCompleted}
                                    onChange={(event) => setEditWorkCompleted(event.target.value)}
                                    rows={3}
                                />
                            </div>

                            <div className="col-span-2 space-y-2">
                                <Label>Issues Found</Label>
                                <Textarea
                                    value={editIssuesFound}
                                    onChange={(event) => setEditIssuesFound(event.target.value)}
                                    rows={3}
                                />
                            </div>

                            <div className="col-span-2 space-y-2">
                                <Label>Next Actions</Label>
                                <Textarea
                                    value={editNextActions}
                                    onChange={(event) => setEditNextActions(event.target.value)}
                                    rows={3}
                                />
                            </div>

                            <div className="col-span-2 space-y-2">
                                <Label>Notes</Label>
                                <Textarea
                                    value={editNotes}
                                    onChange={(event) => setEditNotes(event.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                                Cancel
                            </Button>

                            <Button
                                onClick={() => updateDailyReport.mutate()}
                                disabled={updateDailyReport.isPending}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                {updateDailyReport.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                <h2 className="font-bold text-slate-900 mb-4">Photos</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="md:col-span-1 space-y-2">
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

                    <div className="md:col-span-2 space-y-2">
                        <Label>Caption</Label>
                        <Input
                            value={photoCaption}
                            onChange={(event) => setPhotoCaption(event.target.value)}
                            placeholder="Photo caption"
                        />
                    </div>
                </div>

                <div className="flex justify-end mb-6">
                    <Button
                        onClick={() => uploadPhoto.mutate()}
                        disabled={uploadPhoto.isPending}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {uploadPhoto.isPending ? "Uploading..." : "Upload Photo"}
                    </Button>
                </div>

                {report.daily_report_photos?.filter((photo) => !photo.is_deleted).length ===
                    0 ? (
                    <p className="text-sm text-slate-500">No photos uploaded.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {report.daily_report_photos
                            ?.filter((photo) => !photo.is_deleted)
                            .map((photo) => (
                                <div
                                    key={photo.photo_id}
                                    className="border rounded-xl overflow-hidden bg-white"
                                >
                                    <img
                                        src={photo.photo_url}
                                        alt={photo.caption || "Daily report photo"}
                                        className="w-full h-48 object-cover"
                                    />
                                    <div className="p-3">
                                        <p className="text-sm font-medium text-slate-800">
                                            {photo.caption || "No caption"}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {photo.taken_at
                                                ? new Date(photo.taken_at).toLocaleString()
                                                : "-"
                                            }
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => deletePhoto.mutate(photo.photo_id)}
                                                disabled={deletePhoto.isPending}
                                                className="mt-3 w-full text-red-600 hover:text-red-700"
                                            >
                                                Delete
                                            </Button>
                                        </p>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DailyReportDashboard;