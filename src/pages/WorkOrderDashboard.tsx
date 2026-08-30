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


type AssignmentQuantityStatus = {
    work_assignment_id: string;
    quantity_tracking_configured?: boolean;
    assigned_quantity?: number | null;
    assigned_base_quantity?: number | null;
    assigned_base_uom_code?: string | null;
    reassigned_out_quantity?: number | null;
    effective_assigned_quantity?: number | null;
    effective_assigned_base_quantity?: number | null;
    reported_quantity?: number | null;
    pending_review_quantity?: number | null;
    approved_quantity?: number | null;
    available_to_reassign_quantity?: number | null;
};

type ReassignmentHistoryRow = {
    work_assignment_reassignment_id: string;
    from_work_assignment_id: string;
    to_work_assignment_id: string;
    reassigned_quantity: number | null;
    reassigned_uom_code: string | null;
    reason: string;
    notes: string | null;
    created_at: string;
};


type CommercialSourcePreviewLine = {
    source_type: "AcceptedQuotation" | "AcceptedRevision" | "AcceptedVariation";
    source_header_id: string;
    source_document_no: string | null;
    source_revision_no: number | null;
    source_line_id: string;
    source_line_uid: string | null;
    source_line_no: number | null;
    product_id: string | null;
    product_code: string | null;
    product_name: string | null;
    description: string | null;
    source_quantity: number;
    source_uom_code: string;
    source_base_quantity: number;
    source_base_uom_code: string;
    allocated_quantity: number;
    allocated_base_quantity: number;
    available_quantity: number;
    available_base_quantity: number;
    is_fully_allocated: boolean;
};

type CommercialTraceSource = Pick<
    CommercialSourcePreviewLine,
    "source_type" | "source_line_id" | "source_document_no" | "source_revision_no" | "source_line_no" | "product_code" | "product_name" | "description" | "source_quantity" | "source_uom_code" | "source_base_quantity" | "source_base_uom_code"
>;

const workOrderPermissionCodes = [
    "work_orders.view",
    "work_orders.update",
    "work_orders.assign_worker",
    "work_orders.reassign_worker",
    "work_orders.allocate_commercial_scope",
    "work_orders.release_commercial_scope",
    "work_orders.view_commercial_source",
] as const;

type WorkOrderPermissionCode = typeof workOrderPermissionCodes[number];
type WorkOrderPermissions = Record<WorkOrderPermissionCode, boolean>;

const formatQuantity = (value: number | string | null | undefined) => {
    if (value == null || value === "") return "-";
    const number = Number(value);
    if (!Number.isFinite(number)) return "-";
    return new Intl.NumberFormat("en-AU", { maximumFractionDigits: 3 }).format(number);
};

const getEmployeeName = (employee: any) => {
    if (!employee) return "-";
    return employee.display_name || `${employee.first_name || ""} ${employee.last_name || ""}`.trim() || employee.employee_code || "-";
};

const getAssignmentStatusBadgeClass = (status: string | null) => {
    switch (status) {
        case "Active": return "border-green-200 bg-green-100 text-green-700";
        case "Completed": return "border-emerald-200 bg-emerald-100 text-emerald-700";
        case "Reassigned": return "border-purple-200 bg-purple-100 text-purple-700";
        case "Ended": return "border-slate-200 bg-slate-100 text-slate-700";
        case "Cancelled": return "border-red-200 bg-red-100 text-red-700";
        default: return "border-slate-200 bg-slate-100 text-slate-700";
    }
};

const QuantityCell = ({ label, value, uom, emphasized = false }: { label: string; value: number | string | null | undefined; uom?: string | null; emphasized?: boolean }) => (
    <div className={`rounded-lg border p-2.5 ${emphasized ? "border-[#9E4B4B]/30 bg-red-50" : "border-slate-200 bg-white"}`}>
        <p className="text-[11px] font-medium text-slate-500">{label}</p>
        <p className="mt-1 text-sm font-bold text-slate-900">{formatQuantity(value)} {uom || ""}</p>
    </div>
);

const WorkOrderDashboard = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { workOrderId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showAssignWorkerDialog, setShowAssignWorkerDialog] = useState(false);
    const [selectedWorkerId, setSelectedWorkerId] = useState("");
    const [selectedActivityTypeId, setSelectedActivityTypeId] = useState("");
    const [workerSearchTerm, setWorkerSearchTerm] = useState("");
    const [assignQuantity, setAssignQuantity] = useState("");
    const [assignUomCode, setAssignUomCode] = useState("");
    const [showReassignDialog, setShowReassignDialog] = useState(false);
    const [reassignSource, setReassignSource] = useState<any | null>(null);
    const [reassignToEmployeeId, setReassignToEmployeeId] = useState("");
    const [reassignWorkerSearch, setReassignWorkerSearch] = useState("");
    const [reassignQuantity, setReassignQuantity] = useState("");
    const [reassignReason, setReassignReason] = useState("");
    const [reassignNotes, setReassignNotes] = useState("");
    const [showAssignmentHistoryDialog, setShowAssignmentHistoryDialog] = useState(false);
    const [historyAssignment, setHistoryAssignment] = useState<any | null>(null);
    const [showAllocateCommercialDialog, setShowAllocateCommercialDialog] = useState(false);
    const [selectedCommercialSourceKey, setSelectedCommercialSourceKey] = useState("");
    const [commercialAllocationQuantity, setCommercialAllocationQuantity] = useState("");
    const [commercialAllocationNotes, setCommercialAllocationNotes] = useState("");
    const [showReleaseCommercialDialog, setShowReleaseCommercialDialog] = useState(false);
    const [releaseAllocation, setReleaseAllocation] = useState<any | null>(null);
    const [releaseQuantity, setReleaseQuantity] = useState("");
    const [releaseReason, setReleaseReason] = useState("");
    const [releaseNotes, setReleaseNotes] = useState("");
    const [showAllocationTraceDialog, setShowAllocationTraceDialog] = useState(false);
    const [traceSource, setTraceSource] = useState<CommercialTraceSource | null>(null);
    const [editProjectId, setEditProjectId] = useState("");
    const [editSiteId, setEditSiteId] = useState("");
    const [editAreaId, setEditAreaId] = useState("");
    const [editWorkOrderNo, setEditWorkOrderNo] = useState("");
    const [editWorkOrderTypeId, setEditWorkOrderTypeId] = useState("");
    const [editWorkOrderScopeId, setEditWorkOrderScopeId] = useState("");
    const [editWorkOrderTitle, setEditWorkOrderTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editPriority, setEditPriority] = useState("Normal");
    const [editPlannedStartDate, setEditPlannedStartDate] = useState("");
    const [editPlannedEndDate, setEditPlannedEndDate] = useState("");
    const [editActualStartDate, setEditActualStartDate] = useState("");
    const [editActualEndDate, setEditActualEndDate] = useState("");
    const [editNotes, setEditNotes] = useState("");

    const permissionsQuery = useQuery({
        queryKey: ["work-order-dashboard-permissions"],
        queryFn: async () => {
            const [permissionResults, projectRoleResult] = await Promise.all([
                Promise.all(
                    workOrderPermissionCodes.map((permissionCode) =>
                        supabase.rpc("has_permission", {
                            p_permission_code: permissionCode,
                        })
                    )
                ),
                supabase.rpc("is_project_role"),
            ]);

            const permissionError = permissionResults.find((result) => result.error)?.error;
            if (permissionError) throw permissionError;
            if (projectRoleResult.error) throw projectRoleResult.error;

            return {
                permissions: Object.fromEntries(
                    workOrderPermissionCodes.map((permissionCode, index) => [
                        permissionCode,
                        Boolean(permissionResults[index].data),
                    ])
                ) as WorkOrderPermissions,
                isProjectRole: Boolean(projectRoleResult.data),
            };
        },
    });

    const permissions = permissionsQuery.data?.permissions;
    const canViewWorkOrder = Boolean(
        permissions?.["work_orders.view"] || permissionsQuery.data?.isProjectRole
    );
    const canUpdateWorkOrder = Boolean(permissions?.["work_orders.update"]);
    const canAssignWorker = Boolean(permissions?.["work_orders.assign_worker"]);
    const canReassignWorker = Boolean(permissions?.["work_orders.reassign_worker"]);
    const canAllocateCommercialScope = Boolean(
        permissions?.["work_orders.allocate_commercial_scope"]
    );
    const canReleaseCommercialScope = Boolean(
        permissions?.["work_orders.release_commercial_scope"]
    );
    const canViewCommercialSource = Boolean(
        permissions?.["work_orders.view_commercial_source"]
    );

    const {
        data: workOrder,
        isLoading,
        isError: isWorkOrderError,
        error: workOrderError,
        refetch: refetchWorkOrder,
    } = useQuery({
        queryKey: ["work_order", workOrderId],
        enabled: !!workOrderId && canViewWorkOrder,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("work_orders")
                .select(`
                    work_order_id,
          work_order_no,
          work_order_type_id,
          work_order_scope_id,
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
          commercial_mode,
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
            activity_type_id,
            employee_id,
            assigned_at,
            ended_at,
            assigned_quantity,
            assigned_uom_code,
            assigned_base_quantity,
            assigned_base_uom_code,
            assignment_status,
            reassigned_from_work_assignment_id,
            is_deleted,
            work_activity_types (
            activity_code,
            activity_name
         ),
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
        enabled: canUpdateWorkOrder,
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
        enabled: canUpdateWorkOrder,
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
        enabled: canUpdateWorkOrder,
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


    const { data: workOrderTypes = [] } = useQuery({
        queryKey: ["work-order-types-for-work-order-edit"],
        enabled: canUpdateWorkOrder,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("work_order_types")
                .select(`
                work_order_type_id,
                work_order_type_code,
                work_order_type_name,
                sort_order
            `)
                .eq("is_deleted", false)
                .eq("is_active", true)
                .order("sort_order", { ascending: true })
                .order("work_order_type_name", { ascending: true });

            if (error) throw error;

            return data || [];
        },
    });

    const { data: workOrderScopes = [] } = useQuery({
        queryKey: ["work-order-scopes-for-work-order-edit"],
        enabled: canUpdateWorkOrder,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("work_order_scopes")
                .select(`
                work_order_scope_id,
                work_order_type_id,
                work_order_scope_code,
                work_order_scope_name,
                sort_order
            `)
                .eq("is_deleted", false)
                .eq("is_active", true)
                .order("sort_order", { ascending: true })
                .order("work_order_scope_name", { ascending: true });

            if (error) throw error;

            return data || [];
        },
    });

    const filteredEditWorkOrderScopes = workOrderScopes.filter(
        (scope) => scope.work_order_type_id === editWorkOrderTypeId
    );

    const { data: employees = [] } = useQuery({
        queryKey: ["employees-for-work-order-dashboard"],
        enabled: canAssignWorker || canReassignWorker,
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

    const { data: activityTypes = [] } = useQuery({
        queryKey: ["work-activity-types-for-work-order-assignment"],
        enabled: canAssignWorker,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("work_activity_types")
                .select(`
                activity_type_id,
                activity_code,
                activity_name,
                sort_order
            `)
                .eq("is_active", true)
                .order("sort_order", { ascending: true });

            if (error) throw error;

            return data || [];
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

    const assignmentIds = (workOrder?.work_assignments || [])
        .filter((assignment) => !assignment.is_deleted)
        .map((assignment) => assignment.work_assignment_id);

    const {
        data: assignmentQuantityStatuses = [],
        isError: isAssignmentQuantityStatusError,
        error: assignmentQuantityStatusError,
    } = useQuery({
        queryKey: ["work-assignment-quantity-statuses", workOrderId, assignmentIds.join(",")],
        enabled: assignmentIds.length > 0,
        queryFn: async () => {
            const rows = await Promise.all(
                assignmentIds.map(async (assignmentId) => {
                    const { data, error } = await (supabase.rpc as any)("get_work_assignment_quantity_status", {
                        p_work_assignment_id: assignmentId,
                    });
                    if (error) throw error;
                    return data as AssignmentQuantityStatus;
                })
            );
            return rows;
        },
    });

    const {
        data: reassignmentHistory = [],
        isError: isReassignmentHistoryError,
        error: reassignmentHistoryError,
    } = useQuery({
        queryKey: ["work-assignment-reassignment-history", workOrderId],
        enabled: !!workOrderId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("work_assignment_reassignment_history")
                .select("work_assignment_reassignment_id,work_order_id,from_work_assignment_id,to_work_assignment_id,reassigned_quantity,reassigned_uom_code,reassigned_base_quantity,reason,notes,created_at,created_by")
                .eq("work_order_id", workOrderId!)
                .order("created_at", { ascending: true });
            if (error) throw error;
            return (data || []) as ReassignmentHistoryRow[];
        },
    });

    const {
        data: commercialAllocations = [],
        isError: isCommercialAllocationsError,
        error: commercialAllocationsError,
    } = useQuery({
        queryKey: ["work-order-commercial-allocations", workOrderId],
        enabled:
            !!workOrderId &&
            workOrder?.commercial_mode === "CommercialSource" &&
            canViewCommercialSource,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("work_order_commercial_allocations")
                .select("work_order_commercial_allocation_id,source_type,source_quotation_line_id,source_revision_line_id,source_variation_line_id,source_uom_code,source_quantity,source_base_uom_code,source_base_quantity,allocated_quantity,allocated_base_quantity,released_quantity,released_base_quantity,allocation_status,is_active,is_deleted")
                .eq("work_order_id", workOrderId!)
                .eq("is_deleted", false);
            if (error) throw error;
            return data || [];
        },
    });


    const {
        data: commercialSourcePreview,
        isError: isCommercialSourcePreviewError,
        error: commercialSourcePreviewError,
    } = useQuery({
        queryKey: ["work-order-commercial-source-preview", workOrder?.project_id, workOrder?.site_id, workOrder?.area_id],
        enabled:
            workOrder?.commercial_mode === "CommercialSource" &&
            canViewCommercialSource &&
            !!workOrder?.project_id &&
            !!workOrder?.site_id &&
            !!workOrder?.area_id,
        queryFn: async () => {
            const { data, error } = await (supabase.rpc as any)("preview_work_order_commercial_sources", {
                p_project_id: workOrder!.project_id,
                p_site_id: workOrder!.site_id,
                p_area_id: workOrder!.area_id,
            });
            if (error) throw error;
            return (data || { lines: [] }) as { lines?: CommercialSourcePreviewLine[] };
        },
    });

    const commercialSourceLines = (commercialSourcePreview?.lines || []) as CommercialSourcePreviewLine[];

    const { data: uoms = [] } = useQuery({
        queryKey: ["uoms-for-worker-assignment"],
        enabled: canAssignWorker,
        queryFn: async () => {
            const { data, error } = await supabase
                .from("units_of_measure")
                .select("uom_code,uom_name")
                .order("uom_code", { ascending: true });
            if (error) throw error;
            return data || [];
        },
    });

    const activeEmployeeIds = new Set(
        workOrder?.work_assignments
            ?.filter((assignment) => !assignment.is_deleted && assignment.assignment_status === "Active")
            .map((assignment) => assignment.employees?.employee_id) || []
    );

    const filteredWorkers = employees
        .filter((employee) => {
            const keyword = workerSearchTerm.toLowerCase().trim();
            if (keyword.length < 2) return false;
            const employeeName = getEmployeeName(employee).toLowerCase();
            const matchesSearch = employee.employee_code?.toLowerCase().includes(keyword) || employeeName.includes(keyword);
            return matchesSearch && !activeEmployeeIds.has(employee.employee_id);
        })
        .slice(0, 10);

    const reassignWorkerOptions = employees
        .filter((employee) => {
            const keyword = reassignWorkerSearch.toLowerCase().trim();
            if (keyword.length < 2 || !reassignSource) return false;
            if (employee.employee_id === reassignSource.employee_id) return false;
            if (activeEmployeeIds.has(employee.employee_id)) return false;
            const employeeName = getEmployeeName(employee).toLowerCase();
            return employee.employee_code?.toLowerCase().includes(keyword) || employeeName.includes(keyword);
        })
        .slice(0, 10);

    const hasActiveAssignments = workOrder?.work_assignments?.some(
        (assignment) => !assignment.is_deleted && assignment.assignment_status === "Active"
    ) || false;

    const isEditLocationChanged = !!workOrder && (
        editProjectId !== (workOrder.project_id || "") ||
        editSiteId !== (workOrder.site_id || "") ||
        editAreaId !== (workOrder.area_id || "")
    );

    const workerAssignments = (
        workOrder?.work_assignments?.filter((assignment) => !assignment.is_deleted) || []
    ).sort((a, b) => {
        const aActive = a.assignment_status === "Active";
        const bActive = b.assignment_status === "Active";
        if (aActive !== bActive) return aActive ? -1 : 1;
        return (b.assigned_at ? new Date(b.assigned_at).getTime() : 0) - (a.assigned_at ? new Date(a.assigned_at).getTime() : 0);
    });

    const getAssignmentStatus = (assignmentId: string) =>
        assignmentQuantityStatuses.find((item) => item.work_assignment_id === assignmentId);

    const findAssignment = (assignmentId: string) =>
        workerAssignments.find((assignment) => assignment.work_assignment_id === assignmentId);

    const assignmentHistoryForSelected = historyAssignment
        ? reassignmentHistory.filter(
            (item) => item.from_work_assignment_id === historyAssignment.work_assignment_id || item.to_work_assignment_id === historyAssignment.work_assignment_id
        )
        : [];

    const commercialBaseUoms = Array.from(new Set(
        commercialAllocations
            .filter((item: any) => item.is_active && !item.is_deleted && Number(item.allocated_base_quantity || 0) - Number(item.released_base_quantity || 0) > 0)
            .map((item: any) => item.source_base_uom_code)
            .filter(Boolean)
    ));
    const commercialCapacity = commercialAllocations.reduce(
        (sum: number, item: any) => sum + Math.max(Number(item.allocated_base_quantity || 0) - Number(item.released_base_quantity || 0), 0),
        0
    );
    const effectiveWorkerBase = assignmentQuantityStatuses.reduce(
        (sum, item) => sum + Number(item.effective_assigned_base_quantity || 0),
        0
    );
    const workerCapacity = {
        uom: commercialBaseUoms.length === 1 ? String(commercialBaseUoms[0]) : "",
        total: commercialCapacity,
        assigned: effectiveWorkerBase,
        available: Math.max(commercialCapacity - effectiveWorkerBase, 0),
    };


    const selectedCommercialSource = commercialSourceLines.find(
        (line) => `${line.source_type}:${line.source_line_id}` === selectedCommercialSourceKey
    ) || null;

    const { data: allocationTraceData, isLoading: allocationTraceLoading } = useQuery({
        queryKey: ["work-order-allocation-trace", traceSource?.source_type, traceSource?.source_line_id],
        enabled: showAllocationTraceDialog && !!traceSource && canViewCommercialSource,
        queryFn: async () => {
            if (!traceSource) return { allocations: [], workOrders: [], statuses: [] };

            let allocationQuery: any = (supabase.from("work_order_commercial_allocations") as any)
                .select("work_order_commercial_allocation_id,work_order_id,source_type,source_quotation_line_id,source_revision_line_id,source_variation_line_id,source_uom_code,source_quantity,source_base_uom_code,source_base_quantity,allocated_quantity,allocated_base_quantity,released_quantity,released_base_quantity,allocation_status,is_active,is_deleted,created_at")
                .eq("source_type", traceSource.source_type)
                .eq("is_deleted", false)
                .eq("is_active", true);

            if (traceSource.source_type === "AcceptedQuotation") {
                allocationQuery = allocationQuery.eq("source_quotation_line_id", traceSource.source_line_id);
            } else if (traceSource.source_type === "AcceptedRevision") {
                allocationQuery = allocationQuery.eq("source_revision_line_id", traceSource.source_line_id);
            } else {
                allocationQuery = allocationQuery.eq("source_variation_line_id", traceSource.source_line_id);
            }

            const { data: allocations, error: allocationError } = await allocationQuery.order("created_at", { ascending: true });
            if (allocationError) throw allocationError;

            const workOrderIds = Array.from(new Set((allocations || []).map((item: any) => item.work_order_id).filter(Boolean)));
            if (workOrderIds.length === 0) return { allocations: allocations || [], workOrders: [], statuses: [] };

            const { data: traceWorkOrders, error: workOrdersError } = await (supabase.from("work_orders") as any)
                .select(`
                    work_order_id,
                    work_order_no,
                    title,
                    status,
                    commercial_mode,
                    work_assignments (
                        work_assignment_id,
                        employee_id,
                        assigned_at,
                        assigned_quantity,
                        assigned_uom_code,
                        assigned_base_quantity,
                        assigned_base_uom_code,
                        assignment_status,
                        reassigned_from_work_assignment_id,
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
                .in("work_order_id", workOrderIds)
                .eq("is_deleted", false);
            if (workOrdersError) throw workOrdersError;

            const traceAssignmentIds = (traceWorkOrders || []).flatMap((wo: any) =>
                (wo.work_assignments || [])
                    .filter((assignment: any) => !assignment.is_deleted)
                    .map((assignment: any) => assignment.work_assignment_id)
            );

            const statuses = await Promise.all(
                traceAssignmentIds.map(async (assignmentId: string) => {
                    const { data, error } = await (supabase.rpc as any)("get_work_assignment_quantity_status", {
                        p_work_assignment_id: assignmentId,
                    });
                    if (error) throw error;
                    return data as AssignmentQuantityStatus;
                })
            );

            return { allocations: allocations || [], workOrders: traceWorkOrders || [], statuses };
        },
    });

    const traceNetAllocatedBase = (allocationTraceData?.allocations || []).reduce(
        (sum: number, item: any) => sum + Math.max(Number(item.allocated_base_quantity || 0) - Number(item.released_base_quantity || 0), 0),
        0
    );
    const traceAvailableBase = traceSource
        ? Math.max(Number(traceSource.source_base_quantity || 0) - traceNetAllocatedBase, 0)
        : 0;
    const traceEffectiveWorkerAssignedBase = (allocationTraceData?.statuses || []).reduce(
        (sum: number, item: AssignmentQuantityStatus) => sum + Number(item.effective_assigned_base_quantity || 0),
        0
    );
    const tracePendingBase = (allocationTraceData?.statuses || []).reduce(
        (sum: number, item: AssignmentQuantityStatus) => sum + Number(item.pending_review_quantity || 0),
        0
    );
    const traceApprovedBase = (allocationTraceData?.statuses || []).reduce(
        (sum: number, item: AssignmentQuantityStatus) => sum + Number(item.approved_quantity || 0),
        0
    );
    const traceNotAssignedBase = Math.max(traceNetAllocatedBase - traceEffectiveWorkerAssignedBase, 0);
    const traceOutstandingBase = Math.max(traceNetAllocatedBase - traceApprovedBase, 0);

    useEffect(() => {
        if (!workOrder) return;

        setEditProjectId(workOrder.project_id || "");
        setEditSiteId(workOrder.site_id || "");
        setEditAreaId(workOrder.area_id || "");
        setEditWorkOrderNo(workOrder.work_order_no || "");
        setEditWorkOrderTypeId(workOrder.work_order_type_id || "");
        setEditWorkOrderScopeId(workOrder.work_order_scope_id || "");
        setEditWorkOrderTitle(workOrder.title || "");
        setEditDescription(workOrder.description || "");
        setEditPriority(workOrder.priority || "Normal");
        setEditPlannedStartDate(workOrder.planned_start_date || "");
        setEditPlannedEndDate(workOrder.planned_end_date || "");
        setEditActualStartDate(workOrder.actual_start_date || "");
        setEditActualEndDate(workOrder.actual_end_date || "");
        setEditNotes(workOrder.notes || "");
    }, [workOrder]);

    useEffect(() => {
        if (!workOrder) return;

        const editRequested = searchParams.get("edit") === "1";
        const assignRequested = searchParams.get("assignWorker") === "1";
        const reassignAssignmentId = searchParams.get("reassignAssignmentId");

        if (editRequested && canUpdateWorkOrder) {
            setShowEditDialog(true);
            setSearchParams({});
            return;
        }

        if (assignRequested && canAssignWorker) {
            setShowAssignWorkerDialog(true);
            setSearchParams({});
            return;
        }

        if (reassignAssignmentId && canReassignWorker) {
            const assignment = workerAssignments.find(
                (item: any) => item.work_assignment_id === reassignAssignmentId
            );

            if (assignment) {
                setReassignSource(null);
                setReassignToEmployeeId("");
                setReassignWorkerSearch("");
                setReassignQuantity("");
                setReassignReason("");
                setReassignNotes("");
                setReassignSource(assignment);
                setShowReassignDialog(true);
                setSearchParams({});
            }
        }
    }, [canAssignWorker, canReassignWorker, canUpdateWorkOrder, workOrder, workerAssignments, searchParams, setSearchParams]);


    const invalidateWorkOrderOperationalQueries = async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["work_order", workOrderId] }),
            queryClient.invalidateQueries({ queryKey: ["work_orders"] }),
            queryClient.invalidateQueries({ queryKey: ["work-assignment-quantity-statuses", workOrderId] }),
            queryClient.invalidateQueries({ queryKey: ["work-assignment-reassignment-history", workOrderId] }),
            queryClient.invalidateQueries({ queryKey: ["work-order-commercial-allocations", workOrderId] }),
        ]);
    };

    const resetReassignDialog = () => {
        setReassignSource(null);
        setReassignToEmployeeId("");
        setReassignWorkerSearch("");
        setReassignQuantity("");
        setReassignReason("");
        setReassignNotes("");
    };

    const openReassignDialog = (assignment: any) => {
        resetReassignDialog();
        setReassignSource(assignment);
        setShowReassignDialog(true);
    };

    const openAssignmentHistory = (assignment: any) => {
        setHistoryAssignment(assignment);
        setShowAssignmentHistoryDialog(true);
    };


    const openAllocationTrace = (source: CommercialTraceSource) => {
        setTraceSource(source);
        setShowAllocationTraceDialog(true);
    };

    const resetCommercialAllocationDialog = () => {
        setSelectedCommercialSourceKey("");
        setCommercialAllocationQuantity("");
        setCommercialAllocationNotes("");
    };

    const resetReleaseDialog = () => {
        setReleaseAllocation(null);
        setReleaseQuantity("");
        setReleaseReason("");
        setReleaseNotes("");
    };

    const updateWorkOrder = useMutation({
        mutationFn: async () => {
            if (!canUpdateWorkOrder) {
                throw new Error("You do not have permission to update Work Orders.");
            }
            if (!workOrderId) {
                throw new Error("Work order ID is missing.");
            }

            if (!editProjectId) {
                throw new Error("Please select project.");
            }

            if (!editSiteId) {
                throw new Error("Please select project site.");
            }

            if (!editWorkOrderTypeId) {
                throw new Error("Please select work order type.");
            }

            if (!editWorkOrderScopeId) {
                throw new Error("Please select work scope.");
            }

            const isLocationChanged =
                editProjectId !== workOrder.project_id ||
                editSiteId !== workOrder.site_id ||
                (editAreaId || null) !== workOrder.area_id;

            if (isLocationChanged && commercialAllocations.length > 0) {
                throw new Error(
                    "Project, site and area cannot be changed after commercial scope has been allocated."
                );
            }

            const selectedWorkOrderScope = workOrderScopes.find(
                (scope) => scope.work_order_scope_id === editWorkOrderScopeId
            );

            if (!selectedWorkOrderScope) {
                throw new Error("Selected work scope was not found.");
            }

            const { error } = await supabase
                .from("work_orders")
                .update({
                    project_id: editProjectId || null,
                    site_id: editSiteId || null,
                    area_id: editAreaId || null,
                    work_order_no: editWorkOrderNo.trim() || null,
                    work_order_type_id: editWorkOrderTypeId,
                    work_order_scope_id: editWorkOrderScopeId,
                    title: selectedWorkOrderScope.work_order_scope_name,
                    description: editDescription.trim() || null,
                    priority: editPriority,
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
            if (!canAssignWorker) {
                throw new Error("You do not have permission to assign Work Order workers.");
            }
            if (!workOrder) throw new Error("Work order is missing.");
            if (!selectedWorkerId) throw new Error("Please select worker.");
            if (!selectedActivityTypeId) throw new Error("Please select work activity.");

            const quantity = Number(assignQuantity);
            if (!Number.isFinite(quantity) || quantity <= 0) {
                throw new Error("Assigned quantity must be greater than zero.");
            }

            const assignedUom = workOrder.commercial_mode === "CommercialSource"
                ? workerCapacity.uom
                : assignUomCode;

            if (!assignedUom) {
                throw new Error(
                    workOrder.commercial_mode === "CommercialSource"
                        ? "Commercial scope must have one available Base UOM before assigning a worker."
                        : "Please select an operational UOM."
                );
            }

            const { data, error } = await (supabase.rpc as any)("assign_work_order_worker", {
                p_work_order_id: workOrder.work_order_id,
                p_employee_id: selectedWorkerId,
                p_assigned_quantity: quantity,
                p_assigned_uom_code: assignedUom,
                p_activity_type_id: selectedActivityTypeId,
                p_notes: null,
            });

            if (error) throw error;
            return data;
        },
        onSuccess: async () => {
            toast.success("Worker assignment created.");
            await invalidateWorkOrderOperationalQueries();
            setShowAssignWorkerDialog(false);
            setSelectedWorkerId("");
            setSelectedActivityTypeId("");
            setWorkerSearchTerm("");
            setAssignQuantity("");
            setAssignUomCode("");
        },
        onError: (error: any) => {
            toast.error(error?.message || "Unable to assign worker.");
        },
    });

    const reassignWorker = useMutation({
        mutationFn: async () => {
            if (!canReassignWorker) {
                throw new Error("You do not have permission to reassign Work Order workers.");
            }
            if (!reassignSource) throw new Error("Source assignment is missing.");
            if (!reassignToEmployeeId) throw new Error("Please select destination worker.");
            const quantity = Number(reassignQuantity);
            if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("Reassigned quantity must be greater than zero.");
            if (!reassignReason.trim()) throw new Error("Reassignment reason is required.");

            const { data, error } = await (supabase.rpc as any)("reassign_work_order_worker", {
                p_from_work_assignment_id: reassignSource.work_assignment_id,
                p_to_employee_id: reassignToEmployeeId,
                p_reassigned_quantity: quantity,
                p_reason: reassignReason.trim(),
                p_notes: reassignNotes.trim() || null,
            });
            if (error) throw error;
            return data;
        },
        onSuccess: async () => {
            toast.success("Worker responsibility reassigned.");
            await invalidateWorkOrderOperationalQueries();
            setShowReassignDialog(false);
            resetReassignDialog();
        },
        onError: (error: any) => toast.error(error?.message || "Unable to reassign worker."),
    });


    const allocateCommercialScope = useMutation({
        mutationFn: async () => {
            if (!canAllocateCommercialScope) {
                throw new Error("You do not have permission to allocate commercial scope.");
            }
            if (!workOrderId) throw new Error("Work order ID is missing.");
            if (!selectedCommercialSource) throw new Error("Please select an Accepted commercial source line.");
            const quantity = Number(commercialAllocationQuantity);
            if (!Number.isFinite(quantity) || quantity <= 0) {
                throw new Error("Allocation quantity must be greater than zero.");
            }

            const { data, error } = await (supabase.rpc as any)("allocate_work_order_commercial_scope", {
                p_work_order_id: workOrderId,
                p_source_type: selectedCommercialSource.source_type,
                p_source_line_id: selectedCommercialSource.source_line_id,
                p_allocated_quantity: quantity,
                p_notes: commercialAllocationNotes.trim() || null,
            });
            if (error) throw error;
            return data;
        },
        onSuccess: async () => {
            toast.success("Commercial scope allocated.");
            await Promise.all([
                invalidateWorkOrderOperationalQueries(),
                queryClient.invalidateQueries({ queryKey: ["work-order-commercial-source-preview"] }),
            ]);
            setShowAllocateCommercialDialog(false);
            resetCommercialAllocationDialog();
        },
        onError: (error: any) => {
            const message = error?.message || "Unable to allocate commercial scope.";
            toast.error(message);
            if (selectedCommercialSource && /exceeds available|over-allocated|already allocated/i.test(message)) {
                openAllocationTrace(selectedCommercialSource);
            }
        },
    });

    const releaseCommercialScope = useMutation({
        mutationFn: async () => {
            if (!canReleaseCommercialScope) {
                throw new Error("You do not have permission to release commercial scope.");
            }
            if (!releaseAllocation) throw new Error("Commercial allocation is missing.");
            const quantity = Number(releaseQuantity);
            if (!Number.isFinite(quantity) || quantity <= 0) {
                throw new Error("Release quantity must be greater than zero.");
            }
            if (!releaseReason.trim()) throw new Error("Release reason is required.");

            const { data, error } = await (supabase.rpc as any)("release_work_order_commercial_scope", {
                p_work_order_commercial_allocation_id: releaseAllocation.work_order_commercial_allocation_id,
                p_release_quantity: quantity,
                p_reason: releaseReason.trim(),
                p_notes: releaseNotes.trim() || null,
            });
            if (error) throw error;
            return data;
        },
        onSuccess: async () => {
            toast.success("Commercial scope released.");
            await Promise.all([
                invalidateWorkOrderOperationalQueries(),
                queryClient.invalidateQueries({ queryKey: ["work-order-commercial-source-preview"] }),
                queryClient.invalidateQueries({ queryKey: ["work-order-allocation-trace"] }),
            ]);
            setShowReleaseCommercialDialog(false);
            resetReleaseDialog();
        },
        onError: (error: any) => toast.error(error?.message || "Unable to release commercial scope."),
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
            if (!canUpdateWorkOrder) {
                throw new Error("You do not have permission to update Work Orders.");
            }
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

    if (permissionsQuery.isLoading || (canViewWorkOrder && isLoading)) {
        return (
            <div className="p-6 text-slate-500">
                Loading work order...
            </div>
        );
    }

    if (permissionsQuery.isError) {
        return (
            <div className="p-6 space-y-4">
                <p className="text-red-700">Unable to verify your Work Order permissions.</p>
                <Button variant="outline" onClick={() => permissionsQuery.refetch()}>
                    Try Again
                </Button>
            </div>
        );
    }

    if (!canViewWorkOrder) {
        return (
            <div className="p-6 space-y-4">
                <p className="text-slate-600">You do not have permission to view Work Orders.</p>
                <Button variant="outline" onClick={() => navigate("/work-orders")}>
                    Back to Work Orders
                </Button>
            </div>
        );
    }

    if (isWorkOrderError) {
        return (
            <div className="p-6 space-y-4">
                <p className="text-red-700">Unable to load this Work Order.</p>
                <p className="text-sm text-slate-600">
                    {workOrderError instanceof Error
                        ? workOrderError.message
                        : "An unexpected error occurred."}
                </p>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => refetchWorkOrder()}>
                        Try Again
                    </Button>
                    <Button variant="outline" onClick={() => navigate("/work-orders")}>
                        Back to Work Orders
                    </Button>
                </div>
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


    const operationalQueryErrors = [
        isAssignmentQuantityStatusError
            ? assignmentQuantityStatusError
            : null,
        isReassignmentHistoryError ? reassignmentHistoryError : null,
        isCommercialAllocationsError ? commercialAllocationsError : null,
        isCommercialSourcePreviewError ? commercialSourcePreviewError : null,
    ].filter((error): error is Error => error instanceof Error);

    return (
        <div className="p-6 space-y-6">
            {operationalQueryErrors.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    <p className="font-semibold">Some Work Order details could not be loaded.</p>
                    <p className="mt-1">{operationalQueryErrors[0].message}</p>
                </div>
            )}
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
                    {canUpdateWorkOrder && nextWorkflowAction && (
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

                    {(canAssignWorker || canUpdateWorkOrder) && <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="w-full bg-red-600 text-white hover:bg-red-700 sm:w-auto">
                                Manage Work Order
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Work Order Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            {canAssignWorker && (
                                <DropdownMenuItem onClick={() => setShowAssignWorkerDialog(true)}>
                                    Assign Worker / Quantity
                                </DropdownMenuItem>
                            )}

                            {canUpdateWorkOrder && (
                                <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                                    Edit Work Order
                                </DropdownMenuItem>
                            )}

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
                    </DropdownMenu>}
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
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Commercial Scope</h2>
                            <p className="mt-1 text-sm text-slate-500">Accepted commercial quantity is allocated to the Work Order first; worker responsibility is managed separately.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">
                                {workOrder.commercial_mode === "CommercialSource" ? "Commercial Source" : "Operational Manual"}
                            </Badge>
                            {workOrder.commercial_mode === "CommercialSource" && canAllocateCommercialScope && canViewCommercialSource && (
                                <Button type="button" size="sm" onClick={() => setShowAllocateCommercialDialog(true)} className="bg-red-600 text-white hover:bg-red-700">
                                    + Allocate Scope
                                </Button>
                            )}
                        </div>
                    </div>
                    {workOrder.commercial_mode === "CommercialSource" && !canViewCommercialSource ? (
                        <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                            You do not have permission to view commercial source quantities.
                        </p>
                    ) : workOrder.commercial_mode === "CommercialSource" ? (
                        <>
                            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                                <QuantityCell label="Allocated to This Work Order" value={workerCapacity.total} uom={workerCapacity.uom} />
                                <QuantityCell label="Effective Worker Assigned" value={workerCapacity.assigned} uom={workerCapacity.uom} />
                                <QuantityCell label="Not Assigned to Worker" value={workerCapacity.available} uom={workerCapacity.uom} emphasized />
                                <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                                    <p className="text-[11px] font-medium text-slate-500">Commercial Source Lines</p>
                                    <p className="mt-1 text-sm font-bold text-slate-900">{commercialAllocations.length}</p>
                                </div>
                            </div>

                            <div className="mt-4 space-y-3">
                                {commercialAllocations.length === 0 ? (
                                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                                        No commercial source has been allocated to this Work Order yet. Allocate an Accepted source line before assigning Commercial quantity to workers.
                                    </div>
                                ) : (
                                    commercialAllocations.map((allocation: any) => {
                                        const netQuantity = Math.max(Number(allocation.allocated_quantity || 0) - Number(allocation.released_quantity || 0), 0);
                                        const netBaseQuantity = Math.max(Number(allocation.allocated_base_quantity || 0) - Number(allocation.released_base_quantity || 0), 0);
                                        const preview = commercialSourceLines.find((line) => {
                                            if (line.source_type !== allocation.source_type) return false;
                                            const sourceLineId = allocation.source_type === "AcceptedQuotation"
                                                ? allocation.source_quotation_line_id
                                                : allocation.source_type === "AcceptedRevision"
                                                    ? allocation.source_revision_line_id
                                                    : allocation.source_variation_line_id;
                                            return sourceLineId === line.source_line_id;
                                        });
                                        const sourceLineId = allocation.source_type === "AcceptedQuotation"
                                            ? allocation.source_quotation_line_id
                                            : allocation.source_type === "AcceptedRevision"
                                                ? allocation.source_revision_line_id
                                                : allocation.source_variation_line_id;
                                        return (
                                            <div key={allocation.work_order_commercial_allocation_id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <p className="font-bold text-slate-900">
                                                                {preview?.source_document_no || allocation.source_type}
                                                                {preview?.source_revision_no != null ? ` · Rev ${preview.source_revision_no}` : ""}
                                                                {preview?.source_line_no != null ? ` · Line ${preview.source_line_no}` : ""}
                                                            </p>
                                                            <Badge variant="outline">{allocation.allocation_status}</Badge>
                                                        </div>
                                                        <p className="mt-1 text-sm text-slate-600">
                                                            {preview?.product_code ? `${preview.product_code} · ` : ""}{preview?.product_name || preview?.description || "Accepted Commercial Source"}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {sourceLineId && (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => openAllocationTrace(preview || {
                                                                    source_type: allocation.source_type,
                                                                    source_line_id: sourceLineId,
                                                                    source_document_no: null,
                                                                    source_revision_no: null,
                                                                    source_line_no: null,
                                                                    product_code: null,
                                                                    product_name: null,
                                                                    description: null,
                                                                    source_quantity: Number(allocation.source_quantity || 0),
                                                                    source_uom_code: allocation.source_uom_code || "",
                                                                    source_base_quantity: Number(allocation.source_base_quantity || 0),
                                                                    source_base_uom_code: allocation.source_base_uom_code || "",
                                                                })}
                                                            >
                                                                View Allocation Trace
                                                            </Button>
                                                        )}
                                                        {canReleaseCommercialScope && netQuantity > 0 && (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-orange-700"
                                                                onClick={() => {
                                                                    setReleaseAllocation(allocation);
                                                                    setReleaseQuantity("");
                                                                    setReleaseReason("");
                                                                    setReleaseNotes("");
                                                                    setShowReleaseCommercialDialog(true);
                                                                }}
                                                            >
                                                                Release
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                                                    <QuantityCell label="Original Allocation" value={allocation.allocated_quantity} uom={allocation.source_uom_code} />
                                                    <QuantityCell label="Released" value={allocation.released_quantity} uom={allocation.source_uom_code} />
                                                    <QuantityCell label="Net Allocation" value={netQuantity} uom={allocation.source_uom_code} emphasized />
                                                    <QuantityCell label="Net Base Quantity" value={netBaseQuantity} uom={allocation.source_base_uom_code} />
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </>
                    ) : (
                        <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                            This Work Order is operational/manual. Worker quantity is tracked using the operational UOM selected when assigning.
                        </p>
                    )}
                </div>

                <div id="worker-assignments" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:col-span-3">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Worker Assignment Distribution</h2>
                            <p className="mt-1 text-sm text-slate-500">
                                See who received the work, how much was assigned, when it was assigned, and the current responsibility.
                            </p>
                        </div>
                        {canAssignWorker && (
                            <Button type="button" size="sm" onClick={() => setShowAssignWorkerDialog(true)} className="bg-red-600 text-white hover:bg-red-700">
                                + Assign Worker
                            </Button>
                        )}
                    </div>

                    {workerAssignments.length === 0 ? (
                        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No worker assignments.</p>
                    ) : (
                        <div className="space-y-3">
                            {workerAssignments.map((assignment) => {
                                const status = getAssignmentStatus(assignment.work_assignment_id);
                                const canReassign = canReassignWorker && assignment.assignment_status === "Active" && Number(status?.available_to_reassign_quantity || 0) > 0;
                                return (
                                    <div key={assignment.work_assignment_id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="font-bold text-slate-900">👷 {getEmployeeName(assignment.employees)}</p>
                                                    <Badge variant="outline" className={getAssignmentStatusBadgeClass(assignment.assignment_status)}>
                                                        {assignment.assignment_status || "-"}
                                                    </Badge>
                                                </div>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {assignment.employees?.employee_code || "-"} · Assigned {formatAssignmentDateTime(assignment.assigned_at)}
                                                </p>
                                                {assignment.reassigned_from_work_assignment_id && (
                                                    <p className="mt-1 text-xs text-purple-700">Received via reassignment</p>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Button type="button" variant="outline" size="sm" onClick={() => openAssignmentHistory(assignment)}>
                                                    View History
                                                </Button>
                                                {canReassign && (
                                                    <Button type="button" variant="outline" size="sm" className="text-orange-700" onClick={() => openReassignDialog(assignment)}>
                                                        Reassign
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {assignment.assigned_quantity == null ? (
                                            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                                Legacy assignment — quantity tracking was not recorded for this assignment.
                                            </div>
                                        ) : (
                                            <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
                                                <QuantityCell label="Original Assigned" value={status?.assigned_quantity ?? assignment.assigned_quantity} uom={assignment.assigned_uom_code} />
                                                <QuantityCell label="Reassigned Out" value={status?.reassigned_out_quantity} uom={assignment.assigned_uom_code} />
                                                <QuantityCell label="Effective" value={status?.effective_assigned_quantity} uom={assignment.assigned_uom_code} />
                                                <QuantityCell label="Reported" value={status?.reported_quantity} uom={assignment.assigned_uom_code} />
                                                <QuantityCell label="Pending Review" value={status?.pending_review_quantity} uom={assignment.assigned_uom_code} />
                                                <QuantityCell label="Approved" value={status?.approved_quantity} uom={assignment.assigned_uom_code} />
                                                <QuantityCell label="Available to Reassign" value={status?.available_to_reassign_quantity} uom={assignment.assigned_uom_code} emphasized />
                                            </div>
                                        )}
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
            <Dialog
                open={showAllocateCommercialDialog}
                onOpenChange={(open) => {
                    setShowAllocateCommercialDialog(open);
                    if (!open) resetCommercialAllocationDialog();
                }}
            >
                <DialogContent className="max-h-[92vh] w-[calc(100vw-1rem)] max-w-3xl overflow-y-auto p-4 sm:p-6">
                    <DialogHeader>
                        <DialogTitle>Allocate Commercial Scope</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                            Select an Accepted source line for this Project, Site and Area. Base Quantity remains the cross-UOM allocation authority.
                        </div>

                        <div className="space-y-2">
                            <Label>Accepted Commercial Source *</Label>
                            <Select value={selectedCommercialSourceKey} onValueChange={(value) => {
                                setSelectedCommercialSourceKey(value);
                                setCommercialAllocationQuantity("");
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Accepted source line" />
                                </SelectTrigger>
                                <SelectContent>
                                    {commercialSourceLines.map((line) => (
                                        <SelectItem key={`${line.source_type}:${line.source_line_id}`} value={`${line.source_type}:${line.source_line_id}`}>
                                            {line.source_document_no || line.source_type}
                                            {line.source_revision_no != null ? ` · Rev ${line.source_revision_no}` : ""}
                                            {line.source_line_no != null ? ` · Line ${line.source_line_no}` : ""}
                                            {` · ${line.product_code || line.product_name || line.description || "Source"}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedCommercialSource && (
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                                    <QuantityCell label="Accepted Quantity" value={selectedCommercialSource.source_quantity} uom={selectedCommercialSource.source_uom_code} />
                                    <QuantityCell label="Allocated to Work Orders" value={selectedCommercialSource.allocated_quantity} uom={selectedCommercialSource.source_uom_code} />
                                    <QuantityCell label="Available for New Work Order" value={selectedCommercialSource.available_quantity} uom={selectedCommercialSource.source_uom_code} emphasized />
                                    <QuantityCell label="Available Base Quantity" value={selectedCommercialSource.available_base_quantity} uom={selectedCommercialSource.source_base_uom_code} />
                                </div>
                                <div className="mt-3 flex justify-end">
                                    <Button type="button" variant="outline" size="sm" onClick={() => openAllocationTrace(selectedCommercialSource)}>
                                        View Allocation Trace
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Allocate Quantity *</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={commercialAllocationQuantity}
                                    onChange={(event) => setCommercialAllocationQuantity(event.target.value)}
                                    placeholder={selectedCommercialSource ? `Available ${formatQuantity(selectedCommercialSource.available_quantity)} ${selectedCommercialSource.source_uom_code}` : "Select source first"}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Transaction UOM</Label>
                                <Input readOnly value={selectedCommercialSource?.source_uom_code || ""} className="bg-slate-100" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Notes</Label>
                            <Textarea value={commercialAllocationNotes} onChange={(event) => setCommercialAllocationNotes(event.target.value)} rows={3} />
                        </div>
                    </div>

                    <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
                        <Button variant="outline" onClick={() => setShowAllocateCommercialDialog(false)}>Cancel</Button>
                        <Button
                            onClick={() => allocateCommercialScope.mutate()}
                            disabled={allocateCommercialScope.isPending || !selectedCommercialSource || !commercialAllocationQuantity}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            {allocateCommercialScope.isPending ? "Allocating..." : "Allocate Commercial Scope"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={showReleaseCommercialDialog}
                onOpenChange={(open) => {
                    setShowReleaseCommercialDialog(open);
                    if (!open) resetReleaseDialog();
                }}
            >
                <DialogContent className="max-h-[92vh] w-[calc(100vw-1rem)] max-w-xl overflow-y-auto p-4 sm:p-6">
                    <DialogHeader>
                        <DialogTitle>Release Commercial Scope</DialogTitle>
                    </DialogHeader>
                    {releaseAllocation && (
                        <div className="space-y-4">
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                                Release is deliberate. It returns eligible quantity to the original Accepted source and does not reassign workers automatically.
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <QuantityCell label="Allocated" value={releaseAllocation.allocated_quantity} uom={releaseAllocation.source_uom_code} />
                                <QuantityCell label="Already Released" value={releaseAllocation.released_quantity} uom={releaseAllocation.source_uom_code} />
                            </div>
                            <div className="space-y-2">
                                <Label>Release Quantity *</Label>
                                <Input type="number" min="0" step="any" value={releaseQuantity} onChange={(event) => setReleaseQuantity(event.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Reason *</Label>
                                <Input value={releaseReason} onChange={(event) => setReleaseReason(event.target.value)} placeholder="Reason for release" />
                            </div>
                            <div className="space-y-2">
                                <Label>Notes</Label>
                                <Textarea value={releaseNotes} onChange={(event) => setReleaseNotes(event.target.value)} rows={3} />
                            </div>
                        </div>
                    )}
                    <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
                        <Button variant="outline" onClick={() => setShowReleaseCommercialDialog(false)}>Cancel</Button>
                        <Button
                            onClick={() => releaseCommercialScope.mutate()}
                            disabled={releaseCommercialScope.isPending || !releaseQuantity || !releaseReason.trim()}
                            className="bg-orange-600 text-white hover:bg-orange-700"
                        >
                            {releaseCommercialScope.isPending ? "Releasing..." : "Confirm Release"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showAllocationTraceDialog} onOpenChange={setShowAllocationTraceDialog}>
                <DialogContent className="max-h-[94vh] w-[calc(100vw-1rem)] max-w-5xl overflow-y-auto p-4 sm:p-6">
                    <DialogHeader>
                        <DialogTitle>Commercial Allocation Trace</DialogTitle>
                    </DialogHeader>
                    {!traceSource ? null : allocationTraceLoading ? (
                        <p className="py-8 text-center text-sm text-slate-500">Loading allocation trace...</p>
                    ) : (
                        <div className="space-y-5">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-lg font-bold text-slate-900">
                                    {traceSource.source_document_no || traceSource.source_type}
                                    {traceSource.source_revision_no != null ? ` · Rev ${traceSource.source_revision_no}` : ""}
                                    {traceSource.source_line_no != null ? ` · Line ${traceSource.source_line_no}` : ""}
                                </p>
                                <p className="mt-1 text-sm text-slate-600">
                                    {traceSource.product_code ? `${traceSource.product_code} · ` : ""}{traceSource.product_name || traceSource.description || "Commercial Source"}
                                </p>
                                <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
                                    <QuantityCell label="Accepted Quantity" value={traceSource.source_base_quantity} uom={traceSource.source_base_uom_code} />
                                    <QuantityCell label="Allocated to Work Orders" value={traceNetAllocatedBase} uom={traceSource.source_base_uom_code} />
                                    <QuantityCell label="Available for New Allocation" value={traceAvailableBase} uom={traceSource.source_base_uom_code} emphasized />
                                    <QuantityCell label="Assigned to Workers" value={traceEffectiveWorkerAssignedBase} uom={traceSource.source_base_uom_code} />
                                    <QuantityCell label="Not Assigned to Worker" value={traceNotAssignedBase} uom={traceSource.source_base_uom_code} />
                                    <QuantityCell label="Pending Review" value={tracePendingBase} uom={traceSource.source_base_uom_code} />
                                    <QuantityCell label="Approved Completed" value={traceApprovedBase} uom={traceSource.source_base_uom_code} />
                                </div>
                                <div className="mt-2">
                                    <QuantityCell label="Outstanding" value={traceOutstandingBase} uom={traceSource.source_base_uom_code} />
                                </div>
                            </div>

                            {(allocationTraceData?.allocations || []).length === 0 ? (
                                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">This Accepted source line has not been allocated to a Work Order.</p>
                            ) : (
                                <div className="space-y-4">
                                    {(allocationTraceData?.allocations || []).map((allocation: any) => {
                                        const wo = (allocationTraceData?.workOrders || []).find((item: any) => item.work_order_id === allocation.work_order_id);
                                        const woAssignments = (wo?.work_assignments || []).filter((assignment: any) => !assignment.is_deleted);
                                        const netBase = Math.max(Number(allocation.allocated_base_quantity || 0) - Number(allocation.released_base_quantity || 0), 0);
                                        const woStatuses = (allocationTraceData?.statuses || []).filter((status: AssignmentQuantityStatus) =>
                                            woAssignments.some((assignment: any) => assignment.work_assignment_id === status.work_assignment_id)
                                        );
                                        const woEffectiveAssigned = woStatuses.reduce((sum: number, status: AssignmentQuantityStatus) => sum + Number(status.effective_assigned_base_quantity || 0), 0);
                                        const woNotAssigned = Math.max(netBase - woEffectiveAssigned, 0);
                                        return (
                                            <div key={allocation.work_order_commercial_allocation_id} className="rounded-xl border border-slate-200 bg-white p-4">
                                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                                    <div>
                                                        <p className="font-bold text-slate-900">{wo?.work_order_no || "Work Order"} — Allocated {formatQuantity(netBase)} {traceSource.source_base_uom_code}</p>
                                                        <p className="mt-1 text-sm text-slate-500">{wo?.title || "-"} · {wo?.status || "-"}</p>
                                                        <p className="mt-1 text-xs text-slate-500">Not Assigned to Worker: {formatQuantity(woNotAssigned)} {traceSource.source_base_uom_code}</p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => navigate(`/work-orders/${allocation.work_order_id}`)}
                                                        >
                                                            Open Work Order
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => navigate(`/work-orders/${allocation.work_order_id}#worker-assignments`)}
                                                        >
                                                            Manage Assignment
                                                        </Button>
                                                        {woNotAssigned > 0 && (
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                className="bg-red-600 text-white hover:bg-red-700"
                                                                onClick={() => navigate(`/work-orders/${allocation.work_order_id}?assignWorker=1`)}
                                                            >
                                                                Assign Worker
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>

                                                {woAssignments.length === 0 ? (
                                                    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                                        No worker assigned. {woNotAssigned > 0 ? "This Work Order still has capacity available for worker assignment." : ""}
                                                    </div>
                                                ) : (
                                                    <div className="mt-4 space-y-2">
                                                        {woAssignments.map((assignment: any) => {
                                                            const status = (allocationTraceData?.statuses || []).find((item: AssignmentQuantityStatus) => item.work_assignment_id === assignment.work_assignment_id);
                                                            return (
                                                                <div key={assignment.work_assignment_id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                                        <div>
                                                                            <p className="font-semibold text-slate-900">{getEmployeeName(assignment.employees)}</p>
                                                                            <p className="text-xs text-slate-500">{assignment.assignment_status || "-"} · Assigned {formatAssignmentDateTime(assignment.assigned_at)}</p>
                                                                        </div>
                                                                        {Number(status?.available_to_reassign_quantity || 0) > 0 && (
                                                                            <Button
                                                                                type="button"
                                                                                variant="outline"
                                                                                size="sm"
                                                                                className="text-orange-700"
                                                                                onClick={() => {
                                                                                    if (allocation.work_order_id === workOrderId) {
                                                                                        setShowAllocationTraceDialog(false);
                                                                                        openReassignDialog(assignment);
                                                                                        return;
                                                                                    }

                                                                                    navigate(
                                                                                        `/work-orders/${allocation.work_order_id}?reassignAssignmentId=${assignment.work_assignment_id}`
                                                                                    );
                                                                                }}
                                                                            >
                                                                                Reassign
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                    {assignment.assigned_quantity == null ? (
                                                                        <p className="mt-2 text-xs text-amber-700">Legacy assignment — quantity tracking unavailable.</p>
                                                                    ) : (
                                                                        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
                                                                            <QuantityCell label="Original Assigned" value={status?.assigned_quantity ?? assignment.assigned_quantity} uom={assignment.assigned_uom_code} />
                                                                            <QuantityCell label="Reassigned Out" value={status?.reassigned_out_quantity} uom={assignment.assigned_uom_code} />
                                                                            <QuantityCell label="Effective" value={status?.effective_assigned_quantity} uom={assignment.assigned_uom_code} />
                                                                            <QuantityCell label="Reported" value={status?.reported_quantity} uom={assignment.assigned_uom_code} />
                                                                            <QuantityCell label="Pending Review" value={status?.pending_review_quantity} uom={assignment.assigned_uom_code} />
                                                                            <QuantityCell label="Approved" value={status?.approved_quantity} uom={assignment.assigned_uom_code} />
                                                                            <QuantityCell label="Available to Reassign" value={status?.available_to_reassign_quantity} uom={assignment.assigned_uom_code} emphasized />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={showAssignWorkerDialog}
                onOpenChange={(open) => {
                    setShowAssignWorkerDialog(open);
                    if (!open) {
                        setSelectedWorkerId("");
                        setSelectedActivityTypeId("");
                        setWorkerSearchTerm("");
                        setAssignQuantity("");
                        setAssignUomCode("");
                    }
                }}
            >
                <DialogContent className="max-h-[92vh] w-[calc(100vw-1rem)] max-w-xl overflow-y-auto p-4 sm:p-6">
                    <DialogHeader>
                        <DialogTitle>Assign Worker</DialogTitle>
                    </DialogHeader>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-slate-500">Work Order Mode</span>
                            <span className="font-semibold text-slate-900">
                                {workOrder.commercial_mode === "CommercialSource"
                                    ? "Commercial Source"
                                    : "Operational Manual"}
                            </span>
                        </div>
                        {workOrder.commercial_mode === "CommercialSource" && (
                            <div className="mt-2 flex items-center justify-between gap-3">
                                <span className="text-slate-500">Available to Assign</span>
                                <span className="font-semibold text-slate-900">
                                    {formatQuantity(workerCapacity.available)} {workerCapacity.uom || ""}
                                </span>
                            </div>
                        )}
                    </div>

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
                                                    {isSelected && <div className="mt-1 text-xs text-red-600">Selected</div>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Work Activity *</Label>
                            <Select value={selectedActivityTypeId} onValueChange={setSelectedActivityTypeId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select work activity" />
                                </SelectTrigger>
                                <SelectContent>
                                    {activityTypes.map((activityType) => (
                                        <SelectItem key={activityType.activity_type_id} value={activityType.activity_type_id}>
                                            {activityType.activity_code || "-"} - {activityType.activity_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Assigned Quantity *</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="any"
                                    value={assignQuantity}
                                    onChange={(event) => setAssignQuantity(event.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>UOM *</Label>
                                {workOrder.commercial_mode === "CommercialSource" ? (
                                    <Input value={workerCapacity.uom || ""} readOnly className="bg-slate-100" />
                                ) : (
                                    <Select value={assignUomCode} onValueChange={setAssignUomCode}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select UOM" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {uoms.map((uom) => (
                                                <SelectItem key={uom.uom_code} value={uom.uom_code}>
                                                    {uom.uom_code} - {uom.uom_name || uom.uom_code}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
                        <Button variant="outline" onClick={() => setShowAssignWorkerDialog(false)} className="w-full sm:w-auto">
                            Cancel
                        </Button>
                        <Button
                            onClick={() => assignWorker.mutate()}
                            disabled={assignWorker.isPending || !selectedWorkerId || !selectedActivityTypeId || !assignQuantity}
                            className="w-full bg-red-600 text-white hover:bg-red-700 sm:w-auto"
                        >
                            {assignWorker.isPending ? "Assigning..." : "Assign Worker"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={showReassignDialog}
                onOpenChange={(open) => {
                    setShowReassignDialog(open);
                    if (!open) resetReassignDialog();
                }}
            >
                <DialogContent className="max-h-[92vh] w-[calc(100vw-1rem)] max-w-xl overflow-y-auto p-4 sm:p-6">
                    <DialogHeader>
                        <DialogTitle>Reassign Worker</DialogTitle>
                    </DialogHeader>
                    {reassignSource && (
                        <div className="space-y-4">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                                <p className="font-semibold text-slate-900">
                                    From: {getEmployeeName(reassignSource.employees)}
                                </p>
                                <p className="mt-1 text-slate-500">
                                    Available to reassign: {formatQuantity(getAssignmentStatus(reassignSource.work_assignment_id)?.available_to_reassign_quantity)} {reassignSource.assigned_uom_code || ""}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label>Search Destination Worker</Label>
                                <Input value={reassignWorkerSearch} onChange={(e) => setReassignWorkerSearch(e.target.value)} placeholder="Type at least 2 characters..." />
                                {reassignWorkerSearch.trim().length >= 2 && (
                                    <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border p-2">
                                        {reassignWorkerOptions.map((employee) => (
                                            <button
                                                key={employee.employee_id}
                                                type="button"
                                                onClick={() => setReassignToEmployeeId(employee.employee_id)}
                                                className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${reassignToEmployeeId === employee.employee_id ? "border-red-500 bg-red-50" : "border-slate-200 bg-white"}`}
                                            >
                                                {employee.employee_code || "-"} - {getEmployeeName(employee)}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Quantity *</Label>
                                <Input type="number" min="0" step="any" value={reassignQuantity} onChange={(e) => setReassignQuantity(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Reason *</Label>
                                <Input value={reassignReason} onChange={(e) => setReassignReason(e.target.value)} placeholder="Reason for reassignment" />
                            </div>
                            <div className="space-y-2">
                                <Label>Notes</Label>
                                <Textarea value={reassignNotes} onChange={(e) => setReassignNotes(e.target.value)} rows={3} />
                            </div>
                        </div>
                    )}
                    <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
                        <Button variant="outline" onClick={() => setShowReassignDialog(false)}>Cancel</Button>
                        <Button
                            onClick={() => reassignWorker.mutate()}
                            disabled={reassignWorker.isPending || !reassignToEmployeeId || !reassignQuantity || !reassignReason.trim()}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            {reassignWorker.isPending ? "Reassigning..." : "Confirm Reassignment"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showAssignmentHistoryDialog} onOpenChange={setShowAssignmentHistoryDialog}>
                <DialogContent className="max-h-[92vh] w-[calc(100vw-1rem)] max-w-2xl overflow-y-auto p-4 sm:p-6">
                    <DialogHeader>
                        <DialogTitle>Assignment History</DialogTitle>
                    </DialogHeader>
                    {historyAssignment && (
                        <div className="space-y-4">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="font-bold text-slate-900">{getEmployeeName(historyAssignment.employees)}</p>
                                <p className="mt-1 text-sm text-slate-500">
                                    Originally assigned {formatQuantity(historyAssignment.assigned_quantity)} {historyAssignment.assigned_uom_code || ""} at {formatAssignmentDateTime(historyAssignment.assigned_at)}
                                </p>
                            </div>
                            {assignmentHistoryForSelected.length === 0 ? (
                                <p className="text-sm text-slate-500">No reassignment history for this assignment.</p>
                            ) : (
                                <div className="space-y-3">
                                    {assignmentHistoryForSelected.map((item) => (
                                        <div key={item.work_assignment_reassignment_id} className="rounded-xl border border-slate-200 p-4 text-sm">
                                            <p className="font-semibold text-slate-900">
                                                {formatQuantity(item.reassigned_quantity)} {item.reassigned_uom_code || ""} reassigned
                                            </p>
                                            <p className="mt-1 text-slate-600">
                                                {getEmployeeName(findAssignment(item.from_work_assignment_id)?.employees)} → {getEmployeeName(findAssignment(item.to_work_assignment_id)?.employees)}
                                            </p>
                                            <p className="mt-1 text-slate-500">{formatAssignmentDateTime(item.created_at)} · {item.reason}</p>
                                            {item.notes && <p className="mt-2 text-slate-500">{item.notes}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="max-h-[92vh] w-[calc(100vw-1rem)] max-w-4xl overflow-y-auto p-4 sm:p-6">
                    <DialogHeader>
                        <DialogTitle>Edit Work Order</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {hasActiveAssignments && isEditLocationChanged && (
                            <div className="sm:col-span-2 rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
                                This work order has active worker assignments. Changing Project, Site, or Area will not automatically end existing assignments. Please review assignments after saving.
                            </div>
                        )}
                        <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div className="mb-4">
                                <h3 className="text-sm font-bold text-slate-900">
                                    Work Order Details
                                </h3>
                                <p className="mt-1 text-xs text-slate-500">
                                    Select the work type first, then select the related work scope.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Work Order No</Label>
                                    <Input
                                        value={editWorkOrderNo}
                                        onChange={(event) => setEditWorkOrderNo(event.target.value)}
                                        placeholder="WO2606-00001"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Work Order Type *</Label>
                                    <Select
                                        value={editWorkOrderTypeId}
                                        onValueChange={(value) => {
                                            setEditWorkOrderTypeId(value);
                                            setEditWorkOrderScopeId("");
                                            setEditWorkOrderTitle("");
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select work order type" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            {workOrderTypes.map((workOrderType) => (
                                                <SelectItem
                                                    key={workOrderType.work_order_type_id}
                                                    value={workOrderType.work_order_type_id}
                                                >
                                                    {workOrderType.work_order_type_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Work Scope *</Label>
                                    <Select
                                        value={editWorkOrderScopeId}
                                        onValueChange={(value) => {
                                            setEditWorkOrderScopeId(value);

                                            const selectedScope = workOrderScopes.find(
                                                (scope) => scope.work_order_scope_id === value
                                            );

                                            setEditWorkOrderTitle(
                                                selectedScope?.work_order_scope_name || ""
                                            );
                                        }}
                                        disabled={!editWorkOrderTypeId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue
                                                placeholder={
                                                    editWorkOrderTypeId
                                                        ? "Select work scope"
                                                        : "Select work order type first"
                                                }
                                            />
                                        </SelectTrigger>

                                        <SelectContent>
                                            {filteredEditWorkOrderScopes.map((scope) => (
                                                <SelectItem
                                                    key={scope.work_order_scope_id}
                                                    value={scope.work_order_scope_id}
                                                >
                                                    {scope.work_order_scope_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Scope Snapshot</Label>
                                    <Input
                                        value={editWorkOrderTitle}
                                        readOnly
                                        className="bg-slate-100 text-slate-600"
                                        placeholder="Generated from selected work scope"
                                    />
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <Label>Description</Label>
                                    <Textarea
                                        value={editDescription}
                                        onChange={(event) => setEditDescription(event.target.value)}
                                        rows={3}
                                        placeholder="Enter details specific to this work order"
                                    />
                                </div>
                            </div>
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
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Assigned Workers
                                    </h3>

                                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                                        Remove is only for a worker selected by mistake before any work is recorded. If the worker has already worked, use End instead.
                                    </p>
                                </div>

                                {canAssignWorker && <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="w-full sm:w-auto"
                                    onClick={() => setShowAssignWorkerDialog(true)}
                                >
                                    + Assign Worker
                                </Button>}
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
