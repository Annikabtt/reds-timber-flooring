import { ArrowLeft, ClipboardList } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
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

    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showAssignWorkerDialog, setShowAssignWorkerDialog] = useState(false);
    const [selectedWorkerId, setSelectedWorkerId] = useState("");
    const [workerSearchTerm, setWorkerSearchTerm] = useState("");
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

    const filteredWorkers = employees.filter((employee) => {
        const keyword = workerSearchTerm.toLowerCase().trim();

        const employeeName =
            employee.display_name ||
            `${employee.first_name || ""} ${employee.last_name || ""}`.trim();

        const matchesSearch =
            !keyword ||
            employee.employee_code?.toLowerCase().includes(keyword) ||
            employeeName.toLowerCase().includes(keyword);

        const isAlreadyActive = activeEmployeeIds.has(employee.employee_id);

        return matchesSearch && !isAlreadyActive;
    });

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

        setEditPriority(workOrder.priority || "Normal");
        setEditStatus(workOrder.status || "Open");
        setEditPlannedStartDate(workOrder.planned_start_date || "");
        setEditPlannedEndDate(workOrder.planned_end_date || "");
        setEditActualStartDate(workOrder.actual_start_date || "");
        setEditActualEndDate(workOrder.actual_end_date || "");
        setEditNotes(workOrder.notes || "");
    }, [workOrder]);
    const updateWorkOrder = useMutation({
        mutationFn: async () => {
            if (!workOrderId) {
                throw new Error("Work order ID is missing.");
            }

            const { error } = await supabase
                .from("work_orders")
                .update({
                    priority: editPriority,
                    status: editStatus,
                    planned_start_date: editPlannedStartDate || null,
                    planned_end_date: editPlannedEndDate || null,
                    actual_start_date: editActualStartDate || null,
                    actual_end_date: editActualEndDate || null,
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
            <div className="flex items-center justify-between">
                <Button
                    variant="outline"
                    onClick={() => navigate("/work-orders")}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>

                {nextWorkflowAction && (
                    <Button
                        onClick={() =>
                            updateWorkOrderStatus.mutate(
                                nextWorkflowAction.nextStatus
                            )
                        }
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {nextWorkflowAction.label}
                    </Button>
                )}

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button className="bg-red-600 hover:bg-red-700 text-white">
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

            {areaProgress && (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                        <p className="text-sm text-slate-500">Estimated Quantity</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">
                            {Number(areaProgress.estimated_quantity || 0).toFixed(2)}
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                        <p className="text-sm text-slate-500">Approved Quantity</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">
                            {Number(areaProgress.actual_quantity || 0).toFixed(2)}
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                        <p className="text-sm text-slate-500">Remaining From Estimate</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">
                            {Number(areaProgress.remaining_quantity || 0).toFixed(2)}
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                        <p className="text-sm text-slate-500">Approved Progress</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">
                            {Number(areaProgress.progress_percent || 0).toFixed(2)}%
                        </p>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <ClipboardList className="h-8 w-8 text-red-600" />
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900">
                                    {workOrder.title}
                                </h1>
                                <p className="text-slate-500 mt-1">
                                    {workOrder.work_order_no || "-"}
                                </p>
                            </div>
                        </div>

                        <p className="text-slate-600 mt-4">
                            {workOrder.description || "No description."}
                        </p>
                    </div>

                    <div className="flex gap-2">
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                    <h2 className="font-bold text-slate-900 mb-4">Project</h2>

                    <div className="space-y-3 text-sm">
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

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                    <h2 className="font-bold text-slate-900 mb-4">Schedule</h2>

                    <div className="space-y-3 text-sm">
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

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 lg:col-span-3">
                    <h2 className="font-bold text-slate-900 mb-4">Worker Assignments</h2>

                    {workerAssignments.length === 0 ? (
                        <p className="text-sm text-slate-500">No worker assignments.</p>
                    ) : (
                        <div className="overflow-x-auto">
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

                                                <td className="py-3 pr-3 text-slate-700 whitespace-nowrap">
                                                    {formatAssignmentDateTime(assignment.assigned_at)}
                                                </td>

                                                <td className="py-3 pr-3 text-slate-700 whitespace-nowrap">
                                                    {assignment.ended_at
                                                        ? formatAssignmentDateTime(assignment.ended_at)
                                                        : "-"}
                                                </td>

                                                <td className="py-3 pr-3 text-slate-700 whitespace-nowrap">
                                                    {assignment.ended_at
                                                        ? getAssignmentDurationText(
                                                            assignment.assigned_at,
                                                            assignment.ended_at
                                                        )
                                                        : "Active"}
                                                </td>

                                                <td className="py-3 pr-3 whitespace-nowrap">
                                                    {isActive ? (
                                                        <Badge
                                                            variant="outline"
                                                            className="bg-green-100 text-green-700 border-green-200"
                                                        >
                                                            Active
                                                        </Badge>
                                                    ) : (
                                                        <Badge
                                                            variant="outline"
                                                            className="bg-slate-100 text-slate-700 border-slate-200"
                                                        >
                                                            Ended
                                                        </Badge>
                                                    )}
                                                </td>

                                                <td className="py-3 pr-3 text-right whitespace-nowrap">
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
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Assign Worker</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Search Worker</Label>
                            <Input
                                value={workerSearchTerm}
                                onChange={(event) => setWorkerSearchTerm(event.target.value)}
                                placeholder="Search by worker code or name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Available Workers</Label>

                            {filteredWorkers.length === 0 ? (
                                <p className="text-sm text-slate-500 border rounded-lg p-3">
                                    No available workers found.
                                </p>
                            ) : (
                                <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-2">
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
                                                className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition ${isSelected
                                                    ? "border-red-500 bg-red-50 text-red-700"
                                                    : "border-slate-200 bg-white hover:bg-slate-50"
                                                    }`}
                                            >
                                                <div className="font-medium">
                                                    {employee.employee_code || "-"} - {employeeName}
                                                </div>

                                                {isSelected && (
                                                    <div className="text-xs text-red-600 mt-1">
                                                        Selected
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowAssignWorkerDialog(false);
                                setSelectedWorkerId("");
                                setWorkerSearchTerm("");
                                document.body.style.pointerEvents = "";
                                document.body.style.overflow = "";
                            }}
                        >
                            Cancel
                        </Button>

                        <Button
                            onClick={() => assignWorker.mutate()}
                            disabled={assignWorker.isPending || !selectedWorkerId}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {assignWorker.isPending ? "Assigning..." : "Assign Worker"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Work Order</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-4">
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
                                onChange={(event) => setEditActualStartDate(event.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Actual End Date</Label>
                            <Input
                                type="date"
                                value={editActualEndDate}
                                onChange={(event) => setEditActualEndDate(event.target.value)}
                            />
                        </div>

                        <div className="col-span-2 space-y-2">
                            <Label>Notes</Label>
                            <Textarea
                                value={editNotes}
                                onChange={(event) => setEditNotes(event.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                            Cancel
                        </Button>

                        <Button
                            onClick={() => updateWorkOrder.mutate()}
                            disabled={updateWorkOrder.isPending}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {updateWorkOrder.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default WorkOrderDashboard;