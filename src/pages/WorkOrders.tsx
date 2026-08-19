import { type ReactNode, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Eye,
  FileCheck2,
  Pencil,
  Plus,
  Search,
  UserPlus,
  X,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import MobileWorkOrderCard from "@/components/mobile/MobileWorkOrderCard";

const workOrderInputClassName =
  "h-11 rounded-xl border-[#E5E7EB] bg-[#F7F9FB] text-base text-slate-900 hover:border-[#9E4B4B] focus-visible:border-[#9E4B4B] focus-visible:ring-[#9E4B4B]/30 md:text-sm";

const workOrderTextareaClassName =
  "min-h-28 rounded-xl border-[#E5E7EB] bg-[#F7F9FB] text-base text-slate-900 hover:border-[#9E4B4B] focus-visible:border-[#9E4B4B] focus-visible:ring-[#9E4B4B]/30 md:text-sm";

const workOrderSelectTriggerClassName =
  "h-11 rounded-xl border-[#E5E7EB] bg-[#F7F9FB] hover:border-[#9E4B4B] focus:ring-[#9E4B4B]/30";

type CommercialSourceType =
  | "AcceptedQuotation"
  | "AcceptedRevision"
  | "AcceptedVariation";

type CommercialSourcePreviewLine = {
  source_type: CommercialSourceType;
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

type WorkerDraft = {
  id: string;
  employeeId: string;
  activityTypeId: string;
  quantity: string;
};

const sourceTypeLabel: Record<CommercialSourceType, string> = {
  AcceptedQuotation: "Accepted Quotation",
  AcceptedRevision: "Accepted Revision",
  AcceptedVariation: "Accepted Variation",
};

const formatQuantity = (value: number | string | null | undefined) => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return "0";
  return new Intl.NumberFormat("en-AU", {
    maximumFractionDigits: 3,
  }).format(numeric);
};

const newWorkerDraft = (): WorkerDraft => ({
  id: typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`,
  employeeId: "",
  activityTypeId: "",
  quantity: "",
});

function WorkOrderFormSection({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-5 flex gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#9E4B4B] text-xs font-black text-white">
          {number}
        </span>
        <div>
          <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">
            {title}
          </h3>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

const WorkOrders = () => {
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [projectId, setProjectId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [areaId, setAreaId] = useState("");

  const [workOrderTypeId, setWorkOrderTypeId] = useState("");
  const [workOrderScopeId, setWorkOrderScopeId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [plannedStartDate, setPlannedStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [plannedEndDate, setPlannedEndDate] = useState("");
  const [notes, setNotes] = useState("");

  const [createMode, setCreateMode] = useState<
    "CommercialSource" | "OperationalManual"
  >(
    "CommercialSource",
  );
  const [sourceType, setSourceType] = useState<CommercialSourceType>(
    "AcceptedQuotation",
  );
  const [sourceSearchTerm, setSourceSearchTerm] = useState("");
  const [selectedCommercialSourceKey, setSelectedCommercialSourceKey] =
    useState("");
  const [workOrderQuantity, setWorkOrderQuantity] = useState("");
  const [workerDrafts, setWorkerDrafts] = useState<WorkerDraft[]>([]);
  const [manualUomCode, setManualUomCode] = useState("");

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-for-work-orders"],
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
    queryKey: ["sites-for-work-orders"],
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

  const { data: workOrderTypes = [] } = useQuery({
    queryKey: ["work-order-types-for-add-work-order"],
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
    queryKey: ["work-order-scopes-for-add-work-order"],
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

  const { data: employees = [] } = useQuery({
    queryKey: ["employees-for-work-orders"],
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
    queryKey: ["work-activity-types-for-create-work-order"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_activity_types")
        .select("activity_type_id,activity_code,activity_name,sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("activity_name", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: uoms = [] } = useQuery({
    queryKey: ["uoms-for-create-work-order"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("units_of_measure")
        .select("uom_code,uom_name")
        .order("uom_code", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: areas = [] } = useQuery({
    queryKey: ["areas-for-work-orders"],
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

  const { data: workOrders = [] } = useQuery({
    queryKey: ["work_orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_orders")
        .select(`
          work_order_id,
          work_order_no,
          project_id,
          site_id,
          area_id,
          title,
          description,
          priority,
          status,
          planned_start_date,
          planned_end_date,
          actual_start_date,
          actual_end_date,
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
  area_name
),
work_assignments (
  work_assignment_id,
  employee_id,
  is_deleted,
  ended_at,
  employees (
    employee_code,
    display_name,
    first_name,
    last_name
  )
)
        `)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: areaProgress = [] } = useQuery({
    queryKey: ["project_area_progress_v"],
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
      `);

      if (error) throw error;
      return data;
    },
  });

  const areaProgressMap = useMemo(() => {
    return new Map(
      areaProgress.map((item) => [item.area_id, item]),
    );
  }, [areaProgress]);

  const filteredSites = useMemo(() => {
    return sites.filter((site) => site.project_id === projectId);
  }, [sites, projectId]);

  const { data: commercialSourcePreview, isLoading: loadingCommercialSources } =
    useQuery({
      queryKey: [
        "create-work-order-commercial-sources",
        projectId,
        siteId,
        areaId,
      ],
      enabled: showAddDialog &&
        createMode === "CommercialSource" &&
        !!projectId &&
        !!siteId &&
        !!areaId,
      queryFn: async () => {
        const { data, error } = await (supabase.rpc as any)(
          "preview_work_order_commercial_sources",
          {
            p_project_id: projectId,
            p_site_id: siteId,
            p_area_id: areaId,
          },
        );

        if (error) throw error;
        return (data || { lines: [] }) as {
          lines?: CommercialSourcePreviewLine[];
        };
      },
    });

  const commercialSourceLines = useMemo(
    () =>
      (commercialSourcePreview?.lines || []) as CommercialSourcePreviewLine[],
    [commercialSourcePreview],
  );

  const filteredCommercialSources = useMemo(() => {
    const keyword = sourceSearchTerm.trim().toLowerCase();

    return commercialSourceLines
      .filter((line) => line.source_type === sourceType)
      .filter((line) => {
        if (!keyword) return true;

        return [
          line.source_document_no,
          line.source_revision_no != null
            ? `revision ${line.source_revision_no}`
            : null,
          line.source_line_no != null ? `line ${line.source_line_no}` : null,
          line.product_code,
          line.product_name,
          line.description,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      });
  }, [commercialSourceLines, sourceSearchTerm, sourceType]);

  const selectedCommercialSource = commercialSourceLines.find(
    (line) =>
      `${line.source_type}:${line.source_line_id}` ===
        selectedCommercialSourceKey,
  ) || null;

  const workOrderQuantityNumber = Number(workOrderQuantity || 0);
  const totalWorkerQuantity = workerDrafts.reduce(
    (sum, row) => sum + (Number(row.quantity) || 0),
    0,
  );
  const notAssignedQuantity = Math.max(
    workOrderQuantityNumber - totalWorkerQuantity,
    0,
  );

  const filteredAreas = useMemo(() => {
    return areas.filter(
      (area) => area.project_id === projectId && area.site_id === siteId,
    );
  }, [areas, projectId, siteId]);

  const filteredWorkOrderScopes = useMemo(() => {
    return workOrderScopes.filter(
      (scope) => scope.work_order_type_id === workOrderTypeId,
    );
  }, [workOrderScopes, workOrderTypeId]);

  const resetCommercialSelection = () => {
    setSourceType("AcceptedQuotation");
    setSourceSearchTerm("");
    setSelectedCommercialSourceKey("");
    setWorkOrderQuantity("");
    setWorkerDrafts([]);
  };

  const resetForm = () => {
    setProjectId("");
    setSiteId("");
    setAreaId("");
    setWorkOrderTypeId("");
    setWorkOrderScopeId("");
    setTitle("");
    setDescription("");
    setPriority("Normal");
    setPlannedStartDate(new Date().toISOString().split("T")[0]);
    setPlannedEndDate("");
    setNotes("");
    setManualUomCode("");
    resetCommercialSelection();
  };

  const openCommercialWorkOrder = () => {
    resetForm();
    setCreateMode("CommercialSource");
    setShowAddDialog(true);
  };

  const openManualWorkOrder = () => {
    resetForm();
    setCreateMode("OperationalManual");
    setShowAddDialog(true);
  };

  const updateWorkerDraft = (
    id: string,
    patch: Partial<Omit<WorkerDraft, "id">>,
  ) => {
    setWorkerDrafts((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  };

  const createWorkOrder = useMutation({
    mutationFn: async () => {
      if (!projectId) throw new Error("Please select a project.");
      if (!siteId) throw new Error("Please select a project site.");
      if (!areaId) throw new Error("Please select a project area.");
      if (!workOrderTypeId) throw new Error("Please select a work order type.");
      if (!workOrderScopeId) throw new Error("Please select a work scope.");

      const selectedWorkOrderScope = workOrderScopes.find(
        (scope) => scope.work_order_scope_id === workOrderScopeId,
      );

      if (!selectedWorkOrderScope) {
        throw new Error("Selected work scope was not found.");
      }

      if (createMode === "CommercialSource") {
        if (!selectedCommercialSource) {
          throw new Error("Please select an Accepted commercial source line.");
        }

        if (
          !Number.isFinite(workOrderQuantityNumber) ||
          workOrderQuantityNumber <= 0
        ) {
          throw new Error(
            "Quantity for this Work Order must be greater than zero.",
          );
        }

        if (
          workOrderQuantityNumber >
            Number(selectedCommercialSource.available_base_quantity || 0)
        ) {
          throw new Error(
            `Quantity for this Work Order cannot exceed ${
              formatQuantity(
                selectedCommercialSource.available_base_quantity,
              )
            } ${selectedCommercialSource.source_base_uom_code} available.`,
          );
        }
      } else if (workerDrafts.length > 0 && !manualUomCode) {
        throw new Error(
          "Please select the operational UOM for worker assignments.",
        );
      }

      for (const row of workerDrafts) {
        if (!row.employeeId) {
          throw new Error("Please select a worker for every assignment row.");
        }
        if (!row.activityTypeId) {
          throw new Error("Please select a work activity for every worker.");
        }
        const quantity = Number(row.quantity);
        if (!Number.isFinite(quantity) || quantity <= 0) {
          throw new Error("Every assigned quantity must be greater than zero.");
        }
      }

      if (
        createMode === "CommercialSource" &&
        totalWorkerQuantity > workOrderQuantityNumber
      ) {
        throw new Error(
          "Total worker assigned quantity cannot exceed the quantity allocated to this Work Order.",
        );
      }

      const duplicateWorkerIds = workerDrafts
        .map((row) => row.employeeId)
        .filter(
          (employeeId, index, all) =>
            employeeId && all.indexOf(employeeId) !== index,
        );

      if (duplicateWorkerIds.length > 0) {
        throw new Error(
          "The same worker cannot be added twice to the initial assignment list.",
        );
      }

      const commercialAllocations =
        createMode === "CommercialSource" && selectedCommercialSource
          ? [
              {
                source_type: selectedCommercialSource.source_type,
                source_line_id: selectedCommercialSource.source_line_id,
                allocated_quantity: workOrderQuantityNumber,
                notes: "Initial allocation from Create Work Order",
              },
            ]
          : [];

      const assignmentUom =
        createMode === "CommercialSource"
          ? selectedCommercialSource?.source_base_uom_code || ""
          : manualUomCode;

      const workerAssignments = workerDrafts.map((row) => ({
        employee_id: row.employeeId,
        activity_type_id: row.activityTypeId,
        assigned_quantity: Number(row.quantity),
        assigned_uom_code: assignmentUom,
        notes: null,
      }));

      const { data: createResult, error } = await supabase.rpc(
        "create_work_order_atomic",
        {
          p_work_order: {
            project_id: projectId,
            site_id: siteId,
            area_id: areaId,
            work_order_type_id: workOrderTypeId,
            work_order_scope_id: workOrderScopeId,
            commercial_mode: createMode,
            priority,
            planned_start_date: plannedStartDate || null,
            planned_end_date: plannedEndDate || null,
            description: description.trim() || null,
            notes: notes.trim() || null,
          },
          p_commercial_allocations: commercialAllocations,
          p_worker_assignments: workerAssignments,
        },
      );

      if (error) throw error;

      const result = createResult as {
        work_order_id?: string | null;
      } | null;

      const newWorkOrderId = result?.work_order_id || null;

      if (!newWorkOrderId) {
        throw new Error(
          "Work Order was created but the backend did not return a Work Order ID.",
        );
      }

      return newWorkOrderId;
    },

    onSuccess: async (newWorkOrderId) => {
      toast.success("Work order created successfully.");
      await queryClient.invalidateQueries({ queryKey: ["work_orders"] });
      await queryClient.invalidateQueries({
        queryKey: ["create-work-order-commercial-sources"],
      });
      setShowAddDialog(false);
      resetForm();
      navigate(`/work-orders/${newWorkOrderId}`);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Unable to create work order.");
    },
  });

  const filteredWorkOrders = useMemo(() => {
    const keyword = searchTerm.toLowerCase();

    return workOrders.filter((workOrder) => {
      const projectName = workOrder.projects?.project_name || "";
      const customerName = workOrder.projects?.customers?.customer_name || "";
      const siteName = workOrder.project_sites?.site_name || "";
      const areaName = workOrder.project_areas?.area_name || "";

      return (
        workOrder.work_order_no?.toLowerCase().includes(keyword) ||
        workOrder.title?.toLowerCase().includes(keyword) ||
        workOrder.priority?.toLowerCase().includes(keyword) ||
        workOrder.status?.toLowerCase().includes(keyword) ||
        projectName.toLowerCase().includes(keyword) ||
        customerName.toLowerCase().includes(keyword) ||
        siteName.toLowerCase().includes(keyword) ||
        areaName.toLowerCase().includes(keyword)
      );
    });
  }, [workOrders, searchTerm]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-red-600" />
            <h1 className="text-3xl font-bold text-slate-900">
              Work Orders
            </h1>
          </div>
          <p className="text-slate-500 mt-1">
            Manage planned work orders by project, site, and area.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={openManualWorkOrder}
            className="h-11 rounded-xl"
          >
            <Plus className="mr-2 h-4 w-4" />
            Manual Work Order
          </Button>
          <Button
            type="button"
            onClick={openCommercialWorkOrder}
            className="h-11 rounded-xl bg-red-600 px-5 font-bold text-white shadow-sm transition-all hover:bg-red-700"
          >
            <FileCheck2 className="mr-2 h-4 w-4" />
            Work Order from Accepted Source
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search by work order, project, site, area, status..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {filteredWorkOrders.length === 0
          ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500">
              No work orders found.
            </div>
          )
          : (
            filteredWorkOrders.map((workOrder) => (
              <MobileWorkOrderCard
                key={workOrder.work_order_id}
                workOrder={workOrder}
                progress={areaProgressMap.get(workOrder.area_id)}
                getPriorityBadgeClass={getPriorityBadgeClass}
                getStatusBadgeClass={getStatusBadgeClass}
                onView={() =>
                  navigate(`/work-orders/${workOrder.work_order_id}`)}
                onEdit={() =>
                  navigate(`/work-orders/${workOrder.work_order_id}?edit=1`)}
              />
            ))
          )}
      </div>

      <div className="hidden bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden md:block">
        <div className="grid grid-cols-12 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500 px-4 py-3 border-b">
          <div className="col-span-2">Work Order</div>
          <div className="col-span-2">Project</div>
          <div className="col-span-1">Site</div>
          <div className="col-span-1">Area</div>
          <div className="col-span-2">Assigned</div>
          <div className="col-span-1">Priority</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1">Progress</div>
          <div className="col-span-1">Action</div>
        </div>

        {filteredWorkOrders.length === 0
          ? (
            <div className="p-8 text-center text-slate-500">
              No work orders found.
            </div>
          )
          : (
            filteredWorkOrders.map((workOrder) => (
              <div
                key={workOrder.work_order_id}
                className="grid grid-cols-12 px-4 py-4 border-b last:border-b-0 hover:bg-slate-50 transition-colors"
              >
                <div className="col-span-2">
                  <p className="font-semibold text-slate-900">
                    {workOrder.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {workOrder.work_order_no || "-"}
                  </p>
                </div>

                <div className="col-span-2">
                  <p className="font-medium text-slate-800">
                    {workOrder.projects?.project_name || "-"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {workOrder.projects?.project_no || "-"} ·{" "}
                    {workOrder.projects?.customers?.customer_name || "-"}
                  </p>
                </div>

                <div className="col-span-1 text-slate-700">
                  <p>{workOrder.project_sites?.site_name || "-"}</p>
                  <p className="text-xs text-slate-500">
                    {workOrder.project_sites?.site_code || "-"}
                  </p>
                </div>

                <div className="col-span-1 text-slate-700">
                  <p>{workOrder.project_areas?.area_name || "-"}</p>
                  <p className="text-xs text-slate-500">
                    {workOrder.project_areas?.area_code || "-"}
                  </p>
                </div>
                <div className="col-span-2">
                  {workOrder.work_assignments?.filter(
                      (assignment) => !assignment.is_deleted,
                    ).length === 0
                    ? <span className="text-sm text-slate-400">-</span>
                    : (
                      <div className="space-y-2">
                        {workOrder.work_assignments
                          ?.filter(
                            (assignment) =>
                              !assignment.is_deleted &&
                              !assignment.ended_at,
                          )
                          .map((assignment) => {
                            const employee = assignment.employees;

                            const employeeName = employee
                              ? employee.display_name ||
                                `${employee.first_name || ""} ${
                                  employee.last_name || ""
                                }`.trim()
                              : "-";

                            return (
                              <div key={assignment.work_assignment_id}>
                                <p className="text-sm font-semibold text-slate-900">
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
                <div className="col-span-1">
                  <Badge
                    variant="outline"
                    className={getPriorityBadgeClass(workOrder.priority)}
                  >
                    {workOrder.priority || "-"}
                  </Badge>
                </div>

                <div className="col-span-1">
                  <Badge
                    variant="outline"
                    className={getStatusBadgeClass(workOrder.status)}
                  >
                    {workOrder.status || "-"}
                  </Badge>
                </div>

                <div className="col-span-1 text-xs text-slate-700">
                  {(() => {
                    const progress = areaProgressMap.get(workOrder.area_id);

                    if (!progress) {
                      return "-";
                    }

                    return (
                      <div>
                        <p className="font-medium">
                          {Number(progress.progress_percent || 0).toFixed(2)}%
                        </p>
                        <p className="text-slate-500">
                          {progress.actual_quantity || 0}
                          {progress.unit_of_measure || ""}
                        </p>
                      </div>
                    );
                  })()}
                </div>

                <div className="col-span-1 flex items-start justify-center">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      title="View work order"
                      onClick={() =>
                        navigate(`/work-orders/${workOrder.work_order_id}`)}
                      className="h-8 w-8"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      title="Edit work order"
                      onClick={() =>
                        navigate(
                          `/work-orders/${workOrder.work_order_id}?edit=1`,
                        )}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
      </div>

      <Dialog
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-h-[94dvh] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] overflow-x-hidden overflow-y-auto bg-slate-50 p-0 sm:max-w-6xl">
          <div className="border-b bg-white px-5 py-5 sm:px-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-slate-900">
                {createMode === "CommercialSource"
                  ? "Create Work Order from Accepted Source"
                  : "Create Manual Work Order"}
              </DialogTitle>
            </DialogHeader>
            <p className="mt-1 text-sm text-slate-500">
              {createMode === "CommercialSource"
                ? "Select an Accepted Quotation, Accepted Revision or Accepted Variation source line, allocate quantity and assign workers."
                : "Create an operational Work Order that is not tied to a commercial source."}
            </p>
          </div>

          <div className="space-y-5 p-4 sm:p-6">
            <WorkOrderFormSection
              number="01"
              title="Project Location"
              description="Select the Project, Site and Area where this work will be performed."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Project *</Label>
                  <Select
                    value={projectId}
                    onValueChange={(value) => {
                      setProjectId(value);
                      setSiteId("");
                      setAreaId("");
                      resetCommercialSelection();
                    }}
                  >
                    <SelectTrigger className={workOrderSelectTriggerClassName}>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem
                          key={project.project_id}
                          value={project.project_id}
                        >
                          {project.project_no || "-"} -{" "}
                          {project.project_name || "-"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Project Site *</Label>
                  <Select
                    value={siteId}
                    onValueChange={(value) => {
                      setSiteId(value);
                      setAreaId("");
                      resetCommercialSelection();
                    }}
                    disabled={!projectId}
                  >
                    <SelectTrigger className={workOrderSelectTriggerClassName}>
                      <SelectValue
                        placeholder={projectId
                          ? "Select project site"
                          : "Select project first"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSites.map((site) => (
                        <SelectItem key={site.site_id} value={site.site_id}>
                          {site.site_code || "-"} - {site.site_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Project Area *</Label>
                  <Select
                    value={areaId}
                    onValueChange={(value) => {
                      setAreaId(value);
                      resetCommercialSelection();
                    }}
                    disabled={!siteId}
                  >
                    <SelectTrigger className={workOrderSelectTriggerClassName}>
                      <SelectValue
                        placeholder={siteId
                          ? "Select project area"
                          : "Select site first"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredAreas.map((area) => (
                        <SelectItem key={area.area_id} value={area.area_id}>
                          {area.area_code || "-"} - {area.area_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 md:col-span-2">
                  <p className="text-sm font-bold text-slate-800">
                    Work Order No
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Auto generated when saved. Example: WO2608-00001
                  </p>
                </div>
              </div>
            </WorkOrderFormSection>

            {createMode === "CommercialSource" && (
              <WorkOrderFormSection
                number="02"
                title="Commercial Source"
                description="Choose an Accepted source line. Results are limited to the selected Project, Site and Area."
              >
                {!projectId || !siteId || !areaId
                  ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      Select Project, Site and Area first to load eligible
                      Accepted commercial sources.
                    </div>
                  )
                  : (
                    <div className="space-y-4">
                      <div className="grid gap-2 sm:grid-cols-3">
                        {(
                          [
                            "AcceptedQuotation",
                            "AcceptedRevision",
                            "AcceptedVariation",
                          ] as CommercialSourceType[]
                        ).map((type) => (
                          <Button
                            key={type}
                            type="button"
                            variant={sourceType === type
                              ? "default"
                              : "outline"}
                            onClick={() => {
                              setSourceType(type);
                              setSelectedCommercialSourceKey("");
                              setWorkOrderQuantity("");
                              setWorkerDrafts([]);
                            }}
                            className={sourceType === type
                              ? "h-11 rounded-xl bg-[#9E4B4B] hover:bg-[#873f3f]"
                              : "h-11 rounded-xl"}
                          >
                            {sourceTypeLabel[type]}
                          </Button>
                        ))}
                      </div>

                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                        <Input
                          value={sourceSearchTerm}
                          onChange={(event) =>
                            setSourceSearchTerm(event.target.value)}
                          placeholder="Search document no., revision, line, product code, product name or description..."
                          className={`${workOrderInputClassName} pl-10`}
                        />
                      </div>

                      <div className="max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white">
                        {loadingCommercialSources
                          ? (
                            <div className="p-5 text-sm text-slate-500">
                              Loading Accepted commercial sources...
                            </div>
                          )
                          : filteredCommercialSources.length === 0
                          ? (
                            <div className="p-5 text-sm text-slate-500">
                              No matching eligible {sourceTypeLabel[sourceType]}
                              {" "}
                              source lines found.
                            </div>
                          )
                          : (
                            filteredCommercialSources.map((line) => {
                              const key =
                                `${line.source_type}:${line.source_line_id}`;
                              const selected =
                                key === selectedCommercialSourceKey;

                              return (
                                <button
                                  key={key}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCommercialSourceKey(key);
                                    setWorkOrderQuantity("");
                                    setWorkerDrafts([]);
                                  }}
                                  className={`w-full border-b border-slate-100 p-4 text-left last:border-b-0 ${
                                    selected
                                      ? "bg-[#FBF1F1] ring-1 ring-inset ring-[#9E4B4B]"
                                      : "hover:bg-slate-50"
                                  }`}
                                >
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-black text-slate-900">
                                          {line.source_document_no || "-"}
                                        </span>
                                        {line.source_revision_no != null && (
                                          <Badge variant="outline">
                                            Revision {line.source_revision_no}
                                          </Badge>
                                        )}
                                        <Badge
                                          variant="outline"
                                          className="border-green-200 bg-green-50 text-green-700"
                                        >
                                          Accepted
                                        </Badge>
                                      </div>
                                      <p className="mt-2 text-sm font-semibold text-slate-800">
                                        Line {line.source_line_no ?? "-"} ·{" "}
                                        {line.product_code
                                          ? `${line.product_code} · `
                                          : ""}
                                        {line.product_name ||
                                          line.description || "-"}
                                      </p>
                                      {line.description && line.product_name &&
                                        (
                                          <p className="mt-1 text-xs text-slate-500">
                                            {line.description}
                                          </p>
                                        )}
                                    </div>

                                    <div className="grid shrink-0 grid-cols-3 gap-2 text-right text-xs sm:min-w-[330px]">
                                      <div>
                                        <p className="text-slate-500">
                                          Accepted
                                        </p>
                                        <p className="font-bold text-slate-900">
                                          {formatQuantity(
                                            line.source_base_quantity,
                                          )} {line.source_base_uom_code}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-slate-500">
                                          Allocated
                                        </p>
                                        <p className="font-bold text-slate-900">
                                          {formatQuantity(
                                            line.allocated_base_quantity,
                                          )} {line.source_base_uom_code}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-slate-500">
                                          Available
                                        </p>
                                        <p className="font-black text-green-700">
                                          {formatQuantity(
                                            line.available_base_quantity,
                                          )} {line.source_base_uom_code}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              );
                            })
                          )}
                      </div>

                      {selectedCommercialSource && (
                        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                              <p className="text-xs text-slate-500">
                                Accepted Quantity
                              </p>
                              <p className="mt-1 font-black text-slate-900">
                                {formatQuantity(
                                  selectedCommercialSource.source_base_quantity,
                                )}{" "}
                                {selectedCommercialSource.source_base_uom_code}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">
                                Allocated to Work Orders
                              </p>
                              <p className="mt-1 font-black text-slate-900">
                                {formatQuantity(
                                  selectedCommercialSource
                                    .allocated_base_quantity,
                                )}{" "}
                                {selectedCommercialSource.source_base_uom_code}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">
                                Available for New Work Order
                              </p>
                              <p className="mt-1 font-black text-green-700">
                                {formatQuantity(
                                  selectedCommercialSource
                                    .available_base_quantity,
                                )}{" "}
                                {selectedCommercialSource.source_base_uom_code}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">
                                Commercial Base UOM
                              </p>
                              <p className="mt-1 font-black text-slate-900">
                                {selectedCommercialSource.source_base_uom_code}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 max-w-sm space-y-2">
                            <Label>Quantity for this Work Order *</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                step="any"
                                value={workOrderQuantity}
                                onChange={(event) =>
                                  setWorkOrderQuantity(event.target.value)}
                                placeholder="0.00"
                                className={workOrderInputClassName}
                              />
                              <span className="min-w-16 text-sm font-bold text-slate-700">
                                {selectedCommercialSource.source_base_uom_code}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">
                              Cannot exceed {formatQuantity(
                                selectedCommercialSource
                                  .available_base_quantity,
                              )}{" "}
                              {selectedCommercialSource.source_base_uom_code}.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
              </WorkOrderFormSection>
            )}

            <WorkOrderFormSection
              number={createMode === "CommercialSource" ? "03" : "02"}
              title="Work Scope"
              description="Define the Work Order Type, work scope and location-specific requirements."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Work Order Type *</Label>
                  <Select
                    value={workOrderTypeId}
                    onValueChange={(value) => {
                      setWorkOrderTypeId(value);
                      setWorkOrderScopeId("");
                      setTitle("");
                    }}
                  >
                    <SelectTrigger className={workOrderSelectTriggerClassName}>
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
                    value={workOrderScopeId}
                    onValueChange={(value) => {
                      setWorkOrderScopeId(value);
                      const selectedScope = workOrderScopes.find(
                        (scope) => scope.work_order_scope_id === value,
                      );
                      setTitle(selectedScope?.work_order_scope_name || "");
                    }}
                    disabled={!workOrderTypeId}
                  >
                    <SelectTrigger className={workOrderSelectTriggerClassName}>
                      <SelectValue
                        placeholder={workOrderTypeId
                          ? "Select work scope"
                          : "Select work order type first"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredWorkOrderScopes.map((scope) => (
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

                <div className="space-y-2 md:col-span-2">
                  <Label>Selected Work Scope</Label>
                  <Input
                    value={title}
                    readOnly
                    className={`${workOrderInputClassName} bg-slate-100 text-slate-600`}
                    placeholder="Generated from selected work scope"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={4}
                    placeholder="Describe the specific work requirements for this Work Order."
                    className={workOrderTextareaClassName}
                  />
                </div>
              </div>
            </WorkOrderFormSection>

            <WorkOrderFormSection
              number={createMode === "CommercialSource" ? "04" : "03"}
              title="Priority & Schedule"
              description="Set planning priority and target dates. Actual dates remain operationally controlled."
            >
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className={workOrderSelectTriggerClassName}>
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
                    value={plannedStartDate}
                    onChange={(event) =>
                      setPlannedStartDate(event.target.value)}
                    className={workOrderInputClassName}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Planned End Date</Label>
                  <Input
                    type="date"
                    value={plannedEndDate}
                    onChange={(event) => setPlannedEndDate(event.target.value)}
                    className={workOrderInputClassName}
                  />
                </div>
              </div>
            </WorkOrderFormSection>

            <WorkOrderFormSection
              number={createMode === "CommercialSource" ? "05" : "04"}
              title="Worker Assignment"
              description={createMode === "CommercialSource"
                ? "Distribute the Work Order quantity to workers. The Commercial Base UOM is fixed by the Accepted source."
                : "Optionally assign initial workers. Manual Work Orders use the selected operational UOM."}
            >
              <div className="space-y-4">
                {createMode === "OperationalManual" && (
                  <div className="max-w-sm space-y-2">
                    <Label>
                      Operational UOM {workerDrafts.length > 0 ? "*" : ""}
                    </Label>
                    <Select
                      value={manualUomCode}
                      onValueChange={setManualUomCode}
                    >
                      <SelectTrigger
                        className={workOrderSelectTriggerClassName}
                      >
                        <SelectValue placeholder="Select operational UOM" />
                      </SelectTrigger>
                      <SelectContent>
                        {uoms.map((uom) => (
                          <SelectItem key={uom.uom_code} value={uom.uom_code}>
                            {uom.uom_code} - {uom.uom_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Initial Worker Distribution
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Reassignment later is managed from Work Order Detail and
                      preserves reassignment history.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setWorkerDrafts((
                      current,
                    ) => [...current, newWorkerDraft()])}
                    disabled={createMode === "CommercialSource" &&
                      (!selectedCommercialSource ||
                        workOrderQuantityNumber <= 0)}
                    className="rounded-xl"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Worker
                  </Button>
                </div>

                {workerDrafts.length === 0
                  ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                      No worker assigned yet. Unassigned Work Order capacity is
                      allowed and can be assigned later from Work Order Detail.
                    </div>
                  )
                  : (
                    <div className="space-y-3">
                      {workerDrafts.map((row, index) => {
                        const selectedEmployeeIds = new Set(
                          workerDrafts
                            .filter((item) => item.id !== row.id)
                            .map((item) => item.employeeId)
                            .filter(Boolean),
                        );

                        return (
                          <div
                            key={row.id}
                            className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 lg:grid-cols-[48px_minmax(200px,1.3fr)_minmax(190px,1fr)_minmax(140px,0.7fr)_110px_44px]"
                          >
                            <div className="flex h-10 items-center justify-center rounded-lg bg-slate-100 text-sm font-black text-slate-700">
                              {index + 1}
                            </div>

                            <div className="space-y-2">
                              <Label>Worker *</Label>
                              <Select
                                value={row.employeeId}
                                onValueChange={(value) =>
                                  updateWorkerDraft(row.id, {
                                    employeeId: value,
                                  })}
                              >
                                <SelectTrigger
                                  className={workOrderSelectTriggerClassName}
                                >
                                  <SelectValue placeholder="Select worker" />
                                </SelectTrigger>
                                <SelectContent>
                                  {employees
                                    .filter(
                                      (employee) =>
                                        !selectedEmployeeIds.has(
                                          employee.employee_id,
                                        ),
                                    )
                                    .map((employee) => {
                                      const name = employee.display_name ||
                                        `${employee.first_name || ""} ${
                                          employee.last_name || ""
                                        }`.trim() ||
                                        employee.employee_code ||
                                        "-";
                                      return (
                                        <SelectItem
                                          key={employee.employee_id}
                                          value={employee.employee_id}
                                        >
                                          {employee.employee_code || "-"} -{" "}
                                          {name}
                                        </SelectItem>
                                      );
                                    })}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Activity *</Label>
                              <Select
                                value={row.activityTypeId}
                                onValueChange={(value) =>
                                  updateWorkerDraft(row.id, {
                                    activityTypeId: value,
                                  })}
                              >
                                <SelectTrigger
                                  className={workOrderSelectTriggerClassName}
                                >
                                  <SelectValue placeholder="Select activity" />
                                </SelectTrigger>
                                <SelectContent>
                                  {activityTypes.map((activity) => (
                                    <SelectItem
                                      key={activity.activity_type_id}
                                      value={activity.activity_type_id}
                                    >
                                      {activity.activity_code || "-"} -{" "}
                                      {activity.activity_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Assigned Quantity *</Label>
                              <Input
                                type="number"
                                min="0"
                                step="any"
                                value={row.quantity}
                                onChange={(event) =>
                                  updateWorkerDraft(row.id, {
                                    quantity: event.target.value,
                                  })}
                                placeholder="0.00"
                                className={workOrderInputClassName}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>UOM</Label>
                              <Input
                                readOnly
                                value={createMode === "CommercialSource"
                                  ? selectedCommercialSource
                                    ?.source_base_uom_code || ""
                                  : manualUomCode}
                                className={`${workOrderInputClassName} bg-slate-100 font-semibold text-slate-600`}
                              />
                            </div>

                            <div className="flex items-end justify-end">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() =>
                                  setWorkerDrafts((current) =>
                                    current.filter((item) => item.id !== row.id)
                                  )}
                                className="h-11 w-11 rounded-xl text-red-600"
                                title="Remove worker"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                {createMode === "CommercialSource" &&
                  selectedCommercialSource && (
                  <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-slate-500">
                        Quantity for this Work Order
                      </p>
                      <p className="mt-1 font-black text-slate-900">
                        {formatQuantity(workOrderQuantityNumber)}{" "}
                        {selectedCommercialSource.source_base_uom_code}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">
                        Effective Initial Worker Assigned
                      </p>
                      <p className="mt-1 font-black text-slate-900">
                        {formatQuantity(totalWorkerQuantity)}{" "}
                        {selectedCommercialSource.source_base_uom_code}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">
                        Not Assigned to Worker
                      </p>
                      <p
                        className={`mt-1 font-black ${
                          totalWorkerQuantity > workOrderQuantityNumber
                            ? "text-red-700"
                            : "text-green-700"
                        }`}
                      >
                        {totalWorkerQuantity > workOrderQuantityNumber
                          ? `Over by ${
                            formatQuantity(
                              totalWorkerQuantity - workOrderQuantityNumber,
                            )
                          }`
                          : formatQuantity(notAssignedQuantity)}{" "}
                        {selectedCommercialSource.source_base_uom_code}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </WorkOrderFormSection>

            <WorkOrderFormSection
              number={createMode === "CommercialSource" ? "06" : "05"}
              title="Work Instructions"
              description="Record internal notes, access instructions, safety details and special site conditions."
            >
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={4}
                  placeholder="Add internal notes, access instructions, safety notes, or special conditions."
                  className={workOrderTextareaClassName}
                />
              </div>
            </WorkOrderFormSection>

            <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t bg-slate-50/95 py-4 backdrop-blur sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  resetForm();
                }}
                className="h-11 w-full rounded-xl sm:w-auto"
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={() => createWorkOrder.mutate()}
                disabled={createWorkOrder.isPending}
                className="h-11 w-full rounded-xl bg-[#9E4B4B] px-5 font-bold text-white hover:bg-[#873f3f] sm:w-auto"
              >
                {createWorkOrder.isPending ? "Saving..." : "Create Work Order"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkOrders;