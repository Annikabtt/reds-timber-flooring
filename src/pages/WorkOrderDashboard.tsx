import { ArrowLeft, ClipboardList } from "lucide-react";
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
            is_deleted,
            employees (
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

    const assignedEmployees =
        workOrder?.work_assignments?.filter((assignment) => !assignment.is_deleted) ||
        [];
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

                <Button
                    onClick={() => setShowEditDialog(true)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                >
                    Edit Work Order
                </Button>
            </div>

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
                            <p className="font-medium">
                                {workOrder.planned_start_date || "-"}
                            </p>
                        </div>

                        <div>
                            <p className="text-slate-500">Planned Finish</p>
                            <p className="font-medium">
                                {workOrder.planned_end_date || "-"}
                            </p>
                        </div>

                        <div>
                            <p className="text-slate-500">Actual Start</p>
                            <p className="font-medium">
                                {workOrder.actual_start_date || "-"}
                            </p>
                        </div>

                        <div>
                            <p className="text-slate-500">Actual Finish</p>
                            <p className="font-medium">
                                {workOrder.actual_end_date || "-"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                    <h2 className="font-bold text-slate-900 mb-4">
                        Assigned Employees
                    </h2>

                    {assignedEmployees.length === 0 ? (
                        <p className="text-sm text-slate-500">
                            No employees assigned.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {assignedEmployees.map((assignment) => {
                                const employee = assignment.employees;
                                const employeeName = employee
                                    ? employee.display_name ||
                                    `${employee.first_name} ${employee.last_name}`
                                    : "-";

                                return (
                                    <div
                                        key={assignment.work_assignment_id}
                                        className="text-sm border rounded-xl px-3 py-2"
                                    >
                                        <p className="font-medium text-slate-800">
                                            {employeeName}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {employee?.employee_code || "-"}
                                        </p>
                                    </div>
                                );
                            })}
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