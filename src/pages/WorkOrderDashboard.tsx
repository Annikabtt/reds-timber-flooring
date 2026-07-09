import { ArrowLeft, ClipboardList } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Badge } from "@/components/ui/badge";
const getStatusBadgeClass = (status: string | null) => {
    switch (status) {
        case "Open":
            return "bg-slate-100 text-slate-700 border-slate-200";
        case "Assigned":
            return "bg-blue-100 text-blue-700 border-blue-200";
        case "In Progress":
            return "bg-orange-100 text-orange-700 border-orange-200";
        case "Ready for Inspection":
            return "bg-purple-100 text-purple-700 border-purple-200";
        case "Inspection":
            return "bg-yellow-100 text-yellow-700 border-yellow-200";
        case "Approved Completion":
            return "bg-emerald-100 text-emerald-700 border-emerald-200";
        case "Completed":
            return "bg-green-100 text-green-700 border-green-200";
        case "Cancelled":
            return "bg-red-100 text-red-700 border-red-200";
        default:
            return "bg-slate-100 text-slate-700 border-slate-200";
    }
};

const formatAssignmentDateTime = (value: string | null) => {
    if (!value) return "-";

    return new Intl.DateTimeFormat("en-AU", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    }).format(new Date(value));
};
//เริ่มจากตรงนี้
const getAssignmentDurationText = (
    assignedDate: string | null,
    endedDate: string | null
) => {
    if (!assignedDate || !endedDate) return "-";

    const startDate = new Date(assignedDate);
    const endDate = new Date(endedDate);

    const diffSeconds = Math.max(
        0,
        Math.floor((endDate.getTime() - startDate.getTime()) / 1000)
    );

    if (diffSeconds < 60) return `${diffSeconds} sec`;

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} min`;

    const diffHours = Math.floor(diffMinutes / 60);
    const remainingMinutes = diffMinutes % 60;

    if (diffHours < 24) {
        return remainingMinutes > 0
            ? `${diffHours} hr ${remainingMinutes} min`
            : `${diffHours} hr`;
    }

    const diffDays = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;

    return remainingHours > 0
        ? `${diffDays} d ${remainingHours} hr`
        : `${diffDays} d`;
};

const getPriorityBadgeClass = (priority: string | null) => {
    switch (priority) {
        case "Low":
            return "bg-slate-100 text-slate-700 border-slate-200";
        case "Normal":
            return "bg-blue-100 text-blue-700 border-blue-200";
        case "High":
            return "bg-orange-100 text-orange-700 border-orange-200";
        case "Urgent":
            return "bg-red-100 text-red-700 border-red-200";
        default:
            return "bg-slate-100 text-slate-700 border-slate-200";
    }
};

const WorkOrderDashboard = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { workOrderId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showAssignWorkerDialog, setShowAssignWorkerDialog] = useState(false);
    const [selectedWorkerId, setSelectedWorkerId] = useState("");
    const [workerSearchTerm, setWorkerSearchTerm] = useState("");
    const [editProjectId, setEditProjectId] = useState("");
    const [editSiteId, setEditSiteId] = useState("");
    const [editAreaId, setEditAreaId] = useState("");
    const [editWorkOrderNo, setEditWorkOrderNo] = useState("");
    const [editWorkOrderTitle, setEditWorkOrderTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editPriority, setEditPriority] = useState("Normal");
    const [editStatus, setEditStatus] = useState("Open");
    const [editPlannedStartDate, setEditPlannedStartDate] = useState("");
    const [editPlannedEndDate, setEditPlannedEndDate] = useState("");
    const [editActualStartDate, setEditActualStartDate] = useState("");
    const [editActualEndDate, setEditActualEndDate] = useState("");
    const [editNotes, setEditNotes] = useState("");

    const { data: workOrder, isLoading } = useQuery({
        queryKey: ["work_order", workOrderId],
        enabled: !!workOrderId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("work_orders")
                .select(`
          work_order_id,
          work_order_no,
          title,
          description,
          priority,
          status,
          planned_start_date,
          planned_end_date,
          actual_start_date,
          actual_end_date,
          notes,
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
          ),
          work_assignments (
            work_assignment_id,
            assigned_at,
            ended_at,
            is_deleted,
            employees (
            employee_id,
            employee_code,
            display_name,
              first_name,
              last_name
            )
          )
        `)
                .eq("work_order_id", workOrderId)
                .eq("is_deleted", false)
                .single();

            if (error) throw error;
            return data;
        },
    });

    const { data: projects = [] } = useQuery({
        queryKey: ["projects-for-work-order-edit"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("projects")
                .select(`
                    project_id,
                    project_no,
                    project_name,
                    customers (
                        customer_name
                    )
                `)
                .eq("is_deleted", false)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data;
        },
    });

    const { data: sites = [] } = useQuery({
        queryKey: ["sites-for-work-order-edit"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("project_sites")
                .select(`
                    site_id,
                    project_id,
                    site_code,
                    site_name
                `)
                .eq("is_deleted", false)
                .eq("is_active", true)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data;
        },
    });

    const { data: areas = [] } = useQuery({
        queryKey: ["areas-for-work-order-edit"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("project_areas")
                .select(`
                    area_id,
                    project_id,
                    site_id,
                    area_code,
                    area_name
                `)
                .eq("is_deleted", false)
                .eq("is_active", true)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data;
        },
    });

    const filteredEditSites = sites.filter(
        (site) => site.project_id === editProjectId
    );

    const filteredEditAreas = areas.filter(
        (area) =>
            area.project_id === editProjectId &&
            area.site_id === editSiteId
    );

    const { data: employees = [] } = useQuery({
        queryKey: ["employees-for-work-order-dashboard"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("employees")
                .select(`
                employee_id,
                employee_code,
                first_name,
                last_name,
                display_name
            `)
                .eq("is_deleted", false)
                .eq("is_active", true)
                .order("employee_code", { ascending: true });

            if (error) throw error;
            return data;
        },
    });

    const { data: areaProgress } = useQuery({
        queryKey: ["area_progress", workOrder?.area_id],
        enabled: !!workOrder?.area_id,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("project_area_progress_v")
                .select("*")
                .eq("area_id", workOrder?.area_id)
                .single();

            if (error) throw error;

            return data;
        },
    });

    const activeEmployeeIds = new Set(
        workOrder?.work_assignments
            ?.filter((assignment) => !assignment.is_deleted && !assignment.ended_at)
            .map((assignment) => assignment.employees?.employee_id) || []
    );

    const filteredWorkers = employees
        .filter((employee) => {
            const keyword = workerSearchTerm.toLowerCase().trim();

            if (keyword.length < 2) {
                return false;
            }

            const employeeName =
                employee.display_name ||
                `${employee.first_name || ""} ${employee.last_name || ""}`.trim();

            const matchesSearch =
                employee.employee_code?.toLowerCase().includes(keyword) ||
                employeeName.toLowerCase().includes(keyword);

            const isAlreadyActive = activeEmployeeIds.has(employee.employee_id);

            return matchesSearch && !isAlreadyActive;
        })
        .slice(0, 10);

    const hasActiveAssignments =
        workOrder?.work_assignments?.some(
            (assignment) => !assignment.is_deleted && !assignment.ended_at
        ) || false;

    const isEditLocationChanged =
        !!workOrder &&
        (
            editProjectId !== (workOrder.project_id || "") ||
            editSiteId !== (workOrder.site_id || "") ||
            editAreaId !== (workOrder.area_id || "")
        );

    const workerAssignments = (
        workOrder?.work_assignments?.filter(
            (assignment) => !assignment.is_deleted
        ) || []
    ).sort((a, b) => {
        const aIsActive = !a.ended_at;
        const bIsActive = !b.ended_at;

        if (aIsActive !== bIsActive) {
            return aIsActive ? -1 : 1;
        }

        const aAssignedTime = a.assigned_at
            ? new Date(a.assigned_at).getTime()
            : 0;

        const bAssignedTime = b.assigned_at
            ? new Date(b.assigned_at).getTime()
            : 0;

        return bAssignedTime - aAssignedTime;

    });

    useEffect(() => {
        if (!workOrder) return;

        setEditProjectId(workOrder.project_id || "");
        setEditSiteId(workOrder.site_id || "");
        setEditAreaId(workOrder.area_id || "");
        setEditWorkOrderNo(workOrder.work_order_no || "");
        setEditWorkOrderTitle(workOrder.title || "");
        setEditDescription(workOrder.description || "");
        setEditPriority(workOrder.priority || "Normal");
        setEditStatus(workOrder.status || "Open");
        setEditPlannedStartDate(workOrder.planned_start_date || "");
        setEditPlannedEndDate(workOrder.planned_end_date || "");
        setEditActualStartDate(workOrder.actual_start_date || "");
        setEditActualEndDate(workOrder.actual_end_date || "");
        setEditNotes(workOrder.notes || "");
    }, [workOrder]);

    useEffect(() => {
        if (!workOrder) return;

        if (searchParams.get("edit") === "1") {
            setShowEditDialog(true);
            setSearchParams({});
        }
    }, [workOrder, searchParams, setSearchParams]);

    const updateWorkOrder = useMutation({
        mutationFn: async () => {
            if (!workOrderId) {
                throw new Error("Work order ID is missing.");
            }

            if (!editProjectId) {
                throw new Error("Please select project.");
            }

            if (!editSiteId) {
                throw new Error("Please select project site.");
            }

            if (!editWorkOrderTitle.trim()) {
                throw new Error("Please enter work order title.");
            }

            const { error } = await supabase
                .from("work_orders")
                .update({
                    project_id: editProjectId || null,
                    site_id: editSiteId || null,
                    area_id: editAreaId || null,
                    work_order_no: editWorkOrderNo.trim() || null,
                    title: editWorkOrderTitle.trim(),
                    description: editDescription.trim() || null,
                    priority: editPriority,
                    status: editStatus,
                    planned_start_date: editPlannedStartDate || null,
                    planned_end_date: editPlannedEndDate || null,
                    actual_start_date: workOrder.actual_start_date || null,
                    actual_end_date: workOrder.actual_end_date || null,
                    notes: editNotes.trim() || null,
                })
                .eq("work_order_id", workOrderId);

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Work order updated successfully.");
            queryClient.invalidateQueries({ queryKey: ["work_order", workOrderId] });
            queryClient.invalidateQueries({ queryKey: ["work_orders"] });
            setShowEditDialog(false);
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const assignWorker = useMutation({
        mutationFn: async () => {
            if (!workOrder) {
                throw new Error("Work order is missing.");
            }

            if (!selectedWorkerId) {
                throw new Error("Please select worker.");
            }

            const { data, error } = await supabase.rpc("create_work_assignment", {
                p_employee_id: selectedWorkerId,
                p_project_id: workOrder.project_id,
                p_site_id: workOrder.site_id,
                p_area_id: workOrder.area_id || null,
                p_work_order_id: workOrder.work_order_id,
                p_notes: null,
            });

            if (error) throw error;

            return data;
        },
        onSuccess: async () => {
            toast.success("Worker assigned.");

            await queryClient.invalidateQueries({ queryKey: ["work_order", workOrderId] });
            await queryClient.invalidateQueries({ queryKey: ["work_orders"] });

            setShowAssignWorkerDialog(false);
            setSelectedWorkerId("");
            setWorkerSearchTerm("");
        },
        onError: (error) => {
            console.error(error);
            toast.error(error.message);
        },
    });

    const endAssignment = useMutation({
        mutationFn: async (workAssignmentId: string) => {
            const { error } = await supabase.rpc("end_work_assignment", {
                p_work_assignment_id: workAssignmentId,
            });

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Assignment ended.");
            queryClient.invalidateQueries({ queryKey: ["work_order", workOrderId] });
            queryClient.invalidateQueries({ queryKey: ["work_orders"] });
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const removeMistakenAssignment = useMutation({
        mutationFn: async (workAssignmentId: string) => {
            const confirmed = window.confirm(
                "Remove this worker assignment? Only use this when the worker was selected by mistake and has not worked on this work order."
            );

            if (!confirmed) {
                return;
            }

            const { error } = await supabase.rpc("remove_mistaken_work_assignment", {
                p_work_assignment_id: workAssignmentId,
            });

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Mistaken assignment removed.");
            queryClient.invalidateQueries({ queryKey: ["work_order", workOrderId] });
            queryClient.invalidateQueries({ queryKey: ["work_orders"] });
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const updateWorkOrderStatus = useMutation({
        mutationFn: async (nextStatus: string) => {
            if (!workOrderId) {
                throw new Error("Work order ID is missing.");
            }

            const { error } = await supabase
                .from("work_orders")
                .update({
                    status: nextStatus,
                })
                .eq("work_order_id", workOrderId);

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Work order status updated.");
            queryClient.invalidateQueries({ queryKey: ["work_order", workOrderId] });
            queryClient.invalidateQueries({ queryKey: ["work_orders"] });
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });
    const getNextWorkflowAction = (status: string | null) => {
        switch (status) {
            case "Open":
            case "Assigned":
                return {
                    label: "Start Work",
                    nextStatus: "In Progress",
                };

            case "In Progress":
                return {
                    label: "Submit for Inspection",
                    nextStatus: "Ready for Inspection",
                };

            case "Ready for Inspection":
                return {
                    label: "Start Inspection",
                    nextStatus: "Inspection",
                };

            case "Inspection":
                return {
                    label: "Approve Completion",
                    nextStatus: "Approved Completion",
                };

            case "Approved Completion":
                return {
                    label: "Mark Completed",
                    nextStatus: "Completed",
                };

            default:
                return null;
        }
    };

    const nextWorkflowAction = getNextWorkflowAction(workOrder?.status || null);

    if (isLoading) {
        return (
            <div className="p-6 text-slate-500">
                Loading work order...
            </div>
        );
    }

    if (!workOrder) {
        return (
            <div className="p-6 space-y-4">
                <p className="text-slate-500">Work order not found.</p>
                <Button variant="outline" onClick={() => navigate("/work-orders")}>
                    Back to Work Orders
                </Button>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                    variant="outline"
                    onClick={() => navigate("/work-orders")}
                    className="w-full justify-center gap-2 sm:w-auto"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Work Orders
                </Button>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    {nextWorkflowAction && (
                        <Button
                            onClick={() =>
                                updateWorkOrderStatus.mutate(
                                    nextWorkflowAction.nextStatus
                                )
                            }
                            className="w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
                        >
                            {nextWorkflowAction.label}
                        </Button>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="w-full bg-red-600 text-white hover:bg-red-700 sm:w-auto">
                                Manage Work Order
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Work Order Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem onClick={() => setShowAssignWorkerDialog(true)}>
                                Assign Worker
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                                Edit Work Order
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                onClick={() =>
                                    navigate(`/daily-reports?workOrderId=${workOrder.work_order_id}`)
                                }
                            >
                                + Daily Report
                            </DropdownMenuItem>

                            <DropdownMenuItem disabled>
                                Close Work Order
                            </DropdownMenuItem>

                            <DropdownMenuItem disabled>
                                Send Customer
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {areaProgress && (
                <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
                        <p className="text-xs font-medium text-slate-500 sm:text-sm">
                            Estimated Quantity
                        </p>
                        <p className="mt-1 text-xl font-bold text-slate-900 sm:mt-2 sm:text-2xl">
                            {Number(areaProgress.estimated_quantity || 0).toFixed(2)}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
                        <p className="text-xs font-medium text-slate-500 sm:text-sm">
                            Approved Quantity
                        </p>
                        <p className="mt-1 text-xl font-bold text-slate-900 sm:mt-2 sm:text-2xl">
                            {Number(areaProgress.actual_quantity || 0).toFixed(2)}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
                        <p className="text-xs font-medium text-slate-500 sm:text-sm">
                            Remaining
                        </p>
                        <p className="mt-1 text-xl font-bold text-slate-900 sm:mt-2 sm:text-2xl">
                            {Number(areaProgress.remaining_quantity || 0).toFixed(2)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400 sm:text-xs">
                            From estimate
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
                        <p className="text-xs font-medium text-slate-500 sm:text-sm">
                            Approved Progress
                        </p>
                        <p className="mt-1 text-xl font-bold text-slate-900 sm:mt-2 sm:text-2xl">
                            {Number(areaProgress.progress_percent || 0).toFixed(2)}%
                        </p>
                    </div>
                </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <div className="flex items-start gap-3">
                            <div className="rounded-xl bg-red-50 p-2">
                                <ClipboardList className="h-6 w-6 text-red-600 sm:h-8 sm:w-8" />
                            </div>

                            <div className="min-w-0">
                                <h1 className="text-xl font-bold leading-snug text-slate-900 sm:text-3xl">
                                    {workOrder.title}
                                </h1>
                                <p className="mt-1 text-sm text-slate-500">
                                    {workOrder.work_order_no || "-"}
                                </p>
                            </div>
                        </div>

                        <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
                            {workOrder.description || "No description."}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2 sm:justify-end">
                        <Badge
                            variant="outline"
                            className={getPriorityBadgeClass(workOrder.priority)}
                        >
                            {workOrder.priority}
                        </Badge>

                        <Badge
                            variant="outline"
                            className={getStatusBadgeClass(workOrder.status)}
                        >
                            {workOrder.status}
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <h2 className="mb-3 text-base font-bold text-slate-900 sm:mb-4">Project</h2>

                    <div className="space-y-2.5 text-sm sm:space-y-3">
                        <div>
                            <p className="text-slate-500">Customer</p>
                            <p className="font-medium">
                                {workOrder.projects?.customers?.customer_name || "-"}
                            </p>
                        </div>

                        <div>
                            <p className="text-slate-500">Project</p>
                            <p className="font-medium">
                                {workOrder.projects?.project_no || "-"} -{" "}
                                {workOrder.projects?.project_name || "-"}
                            </p>
                        </div>

                        <div>
                            <p className="text-slate-500">Site</p>
                            <p className="font-medium">
                                {workOrder.project_sites?.site_code || "-"} -{" "}
                                {workOrder.project_sites?.site_name || "-"}
                            </p>
                        </div>

                        <div>
                            <p className="text-slate-500">Area</p>
                            <p className="font-medium">
                                {workOrder.project_areas?.area_code || "-"} -{" "}
                                {workOrder.project_areas?.area_name || "-"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <h2 className="mb-3 text-base font-bold text-slate-900 sm:mb-4">Schedule</h2>

                    <div className="space-y-2.5 text-sm sm:space-y-3">
                        <div>
                            <p className="text-slate-500">Planned Start</p>
                            <p className="font-medium">{workOrder.planned_start_date || "-"}</p>
                        </div>

                        <div>
                            <p className="text-slate-500">Planned Finish</p>
                            <p className="font-medium">{workOrder.planned_end_date || "-"}</p>
                        </div>

                        <div>
                            <p className="text-slate-500">Actual Start</p>
                            <p className="font-medium">{workOrder.actual_start_date || "-"}</p>
                        </div>

                        <div>
                            <p className="text-slate-500">Actual Finish</p>
                            <p className="font-medium">{workOrder.actual_end_date || "-"}</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:col-span-3">
                    <h2 className="mb-3 text-base font-bold text-slate-900 sm:mb-4">
                        Worker Assignments
                    </h2>

                    {workerAssignments.length === 0 ? (
                        <p className="text-sm text-slate-500">No worker assignments.</p>
                    ) : (
                        <>
                            <div className="space-y-3 md:hidden">
                                {workerAssignments.map((assignment) => {
                                    const employee = assignment.employees;
                                    const employeeName = employee
                                        ? employee.display_name ||
                                        `${employee.first_name || ""} ${employee.last_name || ""}`.trim()
                                        : "-";

                                    const isActive = !assignment.ended_at;

                                    return (
                                        <div
                                            key={assignment.work_assignment_id}
                                            className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-bold text-slate-900">
                                                        👷 {employeeName}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {employee?.employee_code || "-"}
                                                    </p>
                                                </div>

                                                {isActive ? (
                                                    <Badge
                                                        variant="outline"
                                                        className="shrink-0 border-green-200 bg-green-100 text-green-700"
                                                    >
                                                        Active
                                                    </Badge>
                                                ) : (
                                                    <Badge
                                                        variant="outline"
                                                        className="shrink-0 border-slate-200 bg-slate-100 text-slate-700"
                                                    >
                                                        Ended
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                                <div className="rounded-lg bg-white p-2">
                                                    <p className="font-medium text-slate-400">Assigned</p>
                                                    <p className="mt-1 text-slate-700">
                                                        {formatAssignmentDateTime(assignment.assigned_at)}
                                                    </p>
                                                </div>

                                                <div className="rounded-lg bg-white p-2">
                                                    <p className="font-medium text-slate-400">Ended</p>
                                                    <p className="mt-1 text-slate-700">
                                                        {assignment.ended_at
                                                            ? formatAssignmentDateTime(assignment.ended_at)
                                                            : "-"}
                                                    </p>
                                                </div>

                                                <div className="rounded-lg bg-white p-2">
                                                    <p className="font-medium text-slate-400">Duration</p>
                                                    <p className="mt-1 text-slate-700">
                                                        {assignment.ended_at
                                                            ? getAssignmentDurationText(
                                                                assignment.assigned_at,
                                                                assignment.ended_at
                                                            )
                                                            : "Active"}
                                                    </p>
                                                </div>

                                                <div className="rounded-lg bg-white p-2">
                                                    <p className="font-medium text-slate-400">Action</p>
                                                    <div className="mt-1">
                                                        {isActive ? (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 w-full text-xs text-red-600 hover:text-red-700"
                                                                onClick={() =>
                                                                    endAssignment.mutate(assignment.work_assignment_id)
                                                                }
                                                                disabled={endAssignment.isPending}
                                                            >
                                                                End
                                                            </Button>
                                                        ) : (
                                                            <span className="text-slate-400">-</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="hidden overflow-x-auto md:block">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-slate-500">
                                            <th className="py-2 pr-3 font-medium">Worker</th>
                                            <th className="py-2 pr-3 font-medium">Assigned</th>
                                            <th className="py-2 pr-3 font-medium">Ended</th>
                                            <th className="py-2 pr-3 font-medium">Duration</th>
                                            <th className="py-2 pr-3 font-medium">Status</th>
                                            <th className="py-2 pr-3 font-medium text-right">Action</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {workerAssignments.map((assignment) => {
                                            const employee = assignment.employees;
                                            const employeeName = employee
                                                ? employee.display_name ||
                                                `${employee.first_name || ""} ${employee.last_name || ""}`.trim()
                                                : "-";

                                            const isActive = !assignment.ended_at;

                                            return (
                                                <tr
                                                    key={assignment.work_assignment_id}
                                                    className="border-b last:border-b-0"
                                                >
                                                    <td className="py-3 pr-3">
                                                        <div className="font-medium text-slate-900">
                                                            👷 {employeeName}
                                                        </div>
                                                        <div className="text-xs text-slate-500">
                                                            {employee?.employee_code || "-"}
                                                        </div>
                                                    </td>

                                                    <td className="whitespace-nowrap py-3 pr-3 text-slate-700">
                                                        {formatAssignmentDateTime(assignment.assigned_at)}
                                                    </td>

                                                    <td className="whitespace-nowrap py-3 pr-3 text-slate-700">
                                                        {assignment.ended_at
                                                            ? formatAssignmentDateTime(assignment.ended_at)
                                                            : "-"}
                                                    </td>

                                                    <td className="whitespace-nowrap py-3 pr-3 text-slate-700">
                                                        {assignment.ended_at
                                                            ? getAssignmentDurationText(
                                                                assignment.assigned_at,
                                                                assignment.ended_at
                                                            )
                                                            : "Active"}
                                                    </td>

                                                    <td className="whitespace-nowrap py-3 pr-3">
                                                        {isActive ? (
                                                            <Badge
                                                                variant="outline"
                                                                className="border-green-200 bg-green-100 text-green-700"
                                                            >
                                                                Active
                                                            </Badge>
                                                        ) : (
                                                            <Badge
                                                                variant="outline"
                                                                className="border-slate-200 bg-slate-100 text-slate-700"
                                                            >
                                                                Ended
                                                            </Badge>
                                                        )}
                                                    </td>

                                                    <td className="whitespace-nowrap py-3 pr-3 text-right">
                                                        {isActive ? (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-red-600 hover:text-red-700"
                                                                onClick={() =>
                                                                    endAssignment.mutate(assignment.work_assignment_id)
                                                                }
                                                                disabled={endAssignment.isPending}
                                                            >
                                                                End Assignment
                                                            </Button>
                                                        ) : (
                                                            <span className="text-slate-400">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                <h2 className="font-bold text-slate-900 mb-3">Notes</h2>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">
                    {workOrder.notes || "No notes."}
                </p>
            </div>
            <Dialog
                open={showAssignWorkerDialog}
                onOpenChange={(open) => {
                    setShowAssignWorkerDialog(open);

                    if (!open) {
                        setSelectedWorkerId("");
                        setWorkerSearchTerm("");
                    }
                }}
            >
                <DialogContent className="max-h-[92vh] w-[calc(100vw-1rem)] max-w-xl overflow-y-auto p-4 sm:p-6">
                    <DialogHeader>
                        <DialogTitle>Assign Worker</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Search Worker</Label>
                            <Input
                                value={workerSearchTerm}
                                onChange={(event) => setWorkerSearchTerm(event.target.value)}
                                placeholder="Type at least 2 characters to search workers..."
                            />
                        </div>

                        {workerSearchTerm.trim().length >= 2 && (
                            <div className="space-y-2">
                                <Label>Available Workers</Label>

                                {filteredWorkers.length === 0 ? (
                                    <p className="rounded-lg border p-3 text-sm text-slate-500">
                                        No available workers found.
                                    </p>
                                ) : (
                                    <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border p-2">
                                        {filteredWorkers.map((employee) => {
                                            const employeeName =
                                                employee.display_name ||
                                                `${employee.first_name || ""} ${employee.last_name || ""}`.trim() ||
                                                employee.employee_code;

                                            const isSelected = selectedWorkerId === employee.employee_id;

                                            return (
                                                <button
                                                    key={employee.employee_id}
                                                    type="button"
                                                    onClick={() => setSelectedWorkerId(employee.employee_id)}
                                                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${isSelected
                                                        ? "border-red-500 bg-red-50 text-red-700"
                                                        : "border-slate-200 bg-white hover:bg-slate-50"
                                                        }`}
                                                >
                                                    <div className="font-medium">
                                                        {employee.employee_code || "-"} - {employeeName}
                                                    </div>

                                                    {isSelected && (
                                                        <div className="mt-1 text-xs text-red-600">
                                                            Selected
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowAssignWorkerDialog(false);
                                setSelectedWorkerId("");
                                setWorkerSearchTerm("");
                                document.body.style.pointerEvents = "";
                                document.body.style.overflow = "";
                            }}
                            className="w-full sm:w-auto"
                        >
                            Cancel
                        </Button>

                        <Button
                            onClick={() => assignWorker.mutate()}
                            disabled={assignWorker.isPending || !selectedWorkerId}
                            className="w-full bg-red-600 text-white hover:bg-red-700 sm:w-auto"
                        >
                            {assignWorker.isPending ? "Assigning..." : "Assign Worker"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="max-h-[92vh] w-[calc(100vw-1rem)] max-w-2xl overflow-y-auto p-4 sm:p-6">
                    <DialogHeader>
                        <DialogTitle>Edit Work Order</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {hasActiveAssignments && isEditLocationChanged && (
                            <div className="sm:col-span-2 rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
                                This work order has active worker assignments. Changing Project, Site, or Area will not automatically end existing assignments. Please review assignments after saving.
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>Work Order No</Label>
                            <Input
                                value={editWorkOrderNo}
                                onChange={(event) => setEditWorkOrderNo(event.target.value)}
                                placeholder="WO2606-00001"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Work Order Title *</Label>
                            <Input
                                value={editWorkOrderTitle}
                                onChange={(event) => setEditWorkOrderTitle(event.target.value)}
                                placeholder="Install timber flooring"
                            />
                        </div>

                        <div className="sm:col-span-2 space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={editDescription}
                                onChange={(event) => setEditDescription(event.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Project</Label>
                            <Select
                                value={editProjectId}
                                onValueChange={(value) => {
                                    setEditProjectId(value);
                                    setEditSiteId("");
                                    setEditAreaId("");
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select project" />
                                </SelectTrigger>
                                <SelectContent>
                                    {projects.map((project) => (
                                        <SelectItem
                                            key={project.project_id}
                                            value={project.project_id}
                                        >
                                            {project.project_no || "-"} - {project.project_name || "-"}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Project Site</Label>
                            <Select
                                value={editSiteId}
                                onValueChange={(value) => {
                                    setEditSiteId(value);
                                    setEditAreaId("");
                                }}
                                disabled={!editProjectId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select site" />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredEditSites.map((site) => (
                                        <SelectItem
                                            key={site.site_id}
                                            value={site.site_id}
                                        >
                                            {site.site_code || "-"} - {site.site_name || "-"}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="sm:col-span-2 space-y-2">
                            <Label>Project Area</Label>
                            <Select
                                value={editAreaId}
                                onValueChange={setEditAreaId}
                                disabled={!editProjectId || !editSiteId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select area" />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredEditAreas.map((area) => (
                                        <SelectItem
                                            key={area.area_id}
                                            value={area.area_id}
                                        >
                                            {area.area_code || "-"} - {area.area_name || "-"}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Priority</Label>
                            <Select value={editPriority} onValueChange={setEditPriority}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Low">Low</SelectItem>
                                    <SelectItem value="Normal">Normal</SelectItem>
                                    <SelectItem value="High">High</SelectItem>
                                    <SelectItem value="Urgent">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={editStatus} onValueChange={setEditStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Open">Open</SelectItem>
                                    <SelectItem value="Assigned">Assigned</SelectItem>
                                    <SelectItem value="In Progress">In Progress</SelectItem>

                                    <SelectItem value="Ready for Inspection">
                                        Ready for Inspection
                                    </SelectItem>

                                    <SelectItem value="Inspection">
                                        Inspection
                                    </SelectItem>

                                    <SelectItem value="Approved Completion">
                                        Approved Completion
                                    </SelectItem>

                                    <SelectItem value="Completed">Completed</SelectItem>
                                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Planned Start Date</Label>
                            <Input
                                type="date"
                                value={editPlannedStartDate}
                                onChange={(event) => setEditPlannedStartDate(event.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Planned End Date</Label>
                            <Input
                                type="date"
                                value={editPlannedEndDate}
                                onChange={(event) => setEditPlannedEndDate(event.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Actual Start Date</Label>
                            <Input
                                type="date"
                                value={editActualStartDate}
                                readOnly
                                className="bg-slate-50 text-slate-500"
                            />
                            <p className="text-xs text-slate-500">
                                Actual start date is recorded from real work activity.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Actual End Date</Label>
                            <Input
                                type="date"
                                value={editActualEndDate}
                                readOnly
                                className="bg-slate-50 text-slate-500"
                            />
                            <p className="text-xs text-slate-500">
                                Actual end date is recorded when the work order is completed.
                            </p>
                        </div>

                        <div className="sm:col-span-2 space-y-2">
                            <Label>Notes</Label>
                            <Textarea
                                value={editNotes}
                                onChange={(event) => setEditNotes(event.target.value)}
                                rows={4}
                            />
                        </div>

                        <div className="sm:col-span-2 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">
                                    Assigned Workers
                                </h3>
                                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                                    Remove is only for a worker selected by mistake before any work is recorded. If the worker has already worked, use End instead.
                                </p>
                            </div>

                            {workerAssignments.length === 0 ? (
                                <p className="rounded-lg bg-white p-3 text-sm text-slate-500">
                                    No worker assignments.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {workerAssignments.map((assignment) => {
                                        const employee = assignment.employees;
                                        const employeeName = employee
                                            ? employee.display_name ||
                                            `${employee.first_name || ""} ${employee.last_name || ""}`.trim()
                                            : "-";

                                        const isActive = !assignment.ended_at;

                                        return (
                                            <div
                                                key={assignment.work_assignment_id}
                                                className="rounded-lg border border-slate-200 bg-white p-3"
                                            >
                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-bold text-slate-900">
                                                            👷 {employeeName}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {employee?.employee_code || "-"}
                                                        </p>
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            Assigned: {formatAssignmentDateTime(assignment.assigned_at)}
                                                        </p>
                                                    </div>

                                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                                        {isActive ? (
                                                            <Badge
                                                                variant="outline"
                                                                className="w-full justify-center border-green-200 bg-green-100 text-green-700 sm:w-auto"
                                                            >
                                                                Active
                                                            </Badge>
                                                        ) : (
                                                            <Badge
                                                                variant="outline"
                                                                className="w-full justify-center border-slate-200 bg-slate-100 text-slate-700 sm:w-auto"
                                                            >
                                                                Ended
                                                            </Badge>
                                                        )}

                                                        {isActive && (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                className="w-full text-orange-600 hover:text-orange-700 sm:w-auto"
                                                                onClick={() =>
                                                                    endAssignment.mutate(assignment.work_assignment_id)
                                                                }
                                                                disabled={endAssignment.isPending}
                                                            >
                                                                End
                                                            </Button>
                                                        )}

                                                        {isActive && (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                className="w-full text-red-600 hover:text-red-700 sm:w-auto"
                                                                onClick={() =>
                                                                    removeMistakenAssignment.mutate(
                                                                        assignment.work_assignment_id
                                                                    )
                                                                }
                                                                disabled={removeMistakenAssignment.isPending}
                                                            >
                                                                Remove
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                    </div>

                    <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setShowEditDialog(false)}
                            className="w-full sm:w-auto"
                        >
                            Cancel
                        </Button>

                        <Button
                            onClick={() => updateWorkOrder.mutate()}
                            disabled={updateWorkOrder.isPending}
                            className="w-full bg-red-600 text-white hover:bg-red-700 sm:w-auto"
                        >
                            {updateWorkOrder.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
};

export default WorkOrderDashboard;