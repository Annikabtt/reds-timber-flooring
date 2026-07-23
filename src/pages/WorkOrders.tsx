import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Eye, Pencil, Plus, Search } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { toast } from "sonner";
import MobileWorkOrderCard from "@/components/mobile/MobileWorkOrderCard";


const workOrderInputClassName =
  "h-11 rounded-xl border-[#E5E7EB] bg-[#F7F9FB] text-base text-slate-900 hover:border-[#9E4B4B] focus-visible:border-[#9E4B4B] focus-visible:ring-[#9E4B4B]/30 md:text-sm";

const workOrderTextareaClassName =
  "min-h-28 rounded-xl border-[#E5E7EB] bg-[#F7F9FB] text-base text-slate-900 hover:border-[#9E4B4B] focus-visible:border-[#9E4B4B] focus-visible:ring-[#9E4B4B]/30 md:text-sm";

const workOrderSelectTriggerClassName =
  "h-11 rounded-xl border-[#E5E7EB] bg-[#F7F9FB] hover:border-[#9E4B4B] focus:ring-[#9E4B4B]/30";

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
  const [status, setStatus] = useState("Open");
  const [plannedStartDate, setPlannedStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [plannedEndDate, setPlannedEndDate] = useState("");
  const [actualStartDate, setActualStartDate] = useState("");
  const [actualEndDate, setActualEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [workerSearchTerm, setWorkerSearchTerm] = useState("");


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

  useEffect(() => {
    const activeEmployeeIds = new Set(
      employees.map((employee) => employee.employee_id)
    );

    setSelectedEmployeeIds((current) =>
      current.filter((employeeId) => activeEmployeeIds.has(employeeId))
    );
  }, [employees]);

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
      areaProgress.map((item) => [item.area_id, item])
    );
  }, [areaProgress]);

  const filteredSites = useMemo(() => {
    return sites.filter((site) => site.project_id === projectId);
  }, [sites, projectId]);

  const filteredWorkers = useMemo(() => {
    const keyword = workerSearchTerm.toLowerCase().trim();

    if (keyword.length < 2) {
      return [];
    }

    return [...employees]
      .filter((employee) => {
        if (selectedEmployeeIds.includes(employee.employee_id)) {
          return false;
        }

        const employeeName =
          employee.display_name ||
          `${employee.first_name || ""} ${employee.last_name || ""}`.trim();

        return (
          employee.employee_code?.toLowerCase().includes(keyword) ||
          employeeName.toLowerCase().includes(keyword)
        );
      })
      .sort((a, b) => {
        const aCode = a.employee_code || "";
        const bCode = b.employee_code || "";
        return aCode.localeCompare(bCode);
      })
      .slice(0, 10);
  }, [employees, workerSearchTerm, selectedEmployeeIds]);

  const filteredAreas = useMemo(() => {
    return areas.filter(
      (area) => area.project_id === projectId && area.site_id === siteId
    );
  }, [areas, projectId, siteId]);

  const filteredWorkOrderScopes = useMemo(() => {
    return workOrderScopes.filter(
      (scope) => scope.work_order_type_id === workOrderTypeId
    );
  }, [workOrderScopes, workOrderTypeId]);

  const resetForm = () => {
    setProjectId("");
    setSiteId("");
    setAreaId("");
    setWorkOrderTypeId("");
    setWorkOrderScopeId("");
    setTitle("");
    setDescription("");
    setPriority("Normal");
    setStatus("Open");
    setPlannedStartDate(new Date().toISOString().split("T")[0]);
    setPlannedEndDate("");
    setActualStartDate("");
    setActualEndDate("");
    setNotes("");
    setWorkerSearchTerm("");
    setSelectedEmployeeIds([]);
  };

  const createWorkOrder = useMutation({
    mutationFn: async () => {
      if (!projectId) {
        throw new Error("Please select a project.");
      }

      if (!siteId) {
        throw new Error("Please select a project site.");
      }

      if (!areaId) {
        throw new Error("Please select a project area.");
      }

      if (!workOrderTypeId) {
        throw new Error("Please select a work order type.");
      }

      if (!workOrderScopeId) {
        throw new Error("Please select a work scope.");
      }

      const selectedWorkOrderScope = workOrderScopes.find(
        (scope) => scope.work_order_scope_id === workOrderScopeId
      );

      if (!selectedWorkOrderScope) {
        throw new Error("Selected work scope was not found.");
      }

      const { data: newWorkOrder, error } = await supabase
        .from("work_orders")
        .insert({
          project_id: projectId,
          site_id: siteId,
          area_id: areaId || null,
          work_order_type_id: workOrderTypeId,
          work_order_scope_id: workOrderScopeId,
          title: selectedWorkOrderScope.work_order_scope_name,
          description: description.trim() || null,
          priority,
          status,
          planned_start_date: plannedStartDate || null,
          planned_end_date: plannedEndDate || null,
          actual_start_date: actualStartDate || null,
          actual_end_date: actualEndDate || null,
          notes: notes.trim() || null,
          is_deleted: false,
        })
        .select("work_order_id")
        .single();

      if (error) throw error;

      if (selectedEmployeeIds.length > 0) {
        const { data: activeSelectedEmployees, error: employeeCheckError } =
          await supabase
            .from("employees")
            .select("employee_id")
            .in("employee_id", selectedEmployeeIds)
            .eq("is_deleted", false)
            .eq("is_active", true);

        if (employeeCheckError) throw employeeCheckError;

        const activeSelectedEmployeeIds = new Set(
          (activeSelectedEmployees || []).map(
            (employee) => employee.employee_id
          )
        );

        const inactiveSelectedEmployeeIds = selectedEmployeeIds.filter(
          (employeeId) => !activeSelectedEmployeeIds.has(employeeId)
        );

        if (inactiveSelectedEmployeeIds.length > 0) {
          throw new Error(
            "One or more selected workers are inactive. Remove them and try again."
          );
        }

        for (const employeeId of selectedEmployeeIds) {
          const { error: assignmentError } = await supabase.rpc(
            "create_work_assignment",
            {
              p_employee_id: employeeId,
              p_project_id: projectId,
              p_site_id: siteId,
              p_area_id: areaId || null,
              p_work_order_id: newWorkOrder.work_order_id,
              p_notes: null,
            }
          );

          if (assignmentError) throw assignmentError;
        }
      }
    },

    onSuccess: () => {
      toast.success("Work order created successfully.");
      queryClient.invalidateQueries({ queryKey: ["work_orders"] });
      setShowAddDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
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

        <Button
          onClick={() => setShowAddDialog(true)}
          className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Work Order
        </Button>
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
        {filteredWorkOrders.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500">
            No work orders found.
          </div>
        ) : (
          filteredWorkOrders.map((workOrder) => (
            <MobileWorkOrderCard
              key={workOrder.work_order_id}
              workOrder={workOrder}
              progress={areaProgressMap.get(workOrder.area_id)}
              getPriorityBadgeClass={getPriorityBadgeClass}
              getStatusBadgeClass={getStatusBadgeClass}
              onView={() => navigate(`/work-orders/${workOrder.work_order_id}`)}
              onEdit={() =>
                navigate(`/work-orders/${workOrder.work_order_id}?edit=1`)
              }
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

        {filteredWorkOrders.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No work orders found.
          </div>
        ) : (
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
                  (assignment) => !assignment.is_deleted
                ).length === 0 ? (
                  <span className="text-sm text-slate-400">-</span>
                ) : (
                  <div className="space-y-2">
                    {workOrder.work_assignments
                      ?.filter(
                        (assignment) =>
                          !assignment.is_deleted &&
                          !assignment.ended_at
                      )
                      .map((assignment) => {
                        const employee = assignment.employees;

                        const employeeName = employee
                          ? employee.display_name ||
                          `${employee.first_name || ""} ${employee.last_name || ""}`.trim()
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
                    onClick={() => navigate(`/work-orders/${workOrder.work_order_id}`)}
                    className="h-8 w-8"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    title="Edit work order"
                    onClick={() => navigate(`/work-orders/${workOrder.work_order_id}?edit=1`)}
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

          if (!open) {
            resetForm();
          }
        }}
      >
        <DialogContent className="max-h-[94dvh] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] overflow-x-hidden overflow-y-auto bg-slate-50 p-0 sm:max-w-5xl">
          <div className="border-b bg-white px-5 py-5 sm:px-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-slate-900">
                Add Work Order
              </DialogTitle>
            </DialogHeader>
            <p className="mt-1 text-sm text-slate-500">
              Create the work order location, scope, schedule and worker assignments.
            </p>
          </div>

          <div className="space-y-5 p-4 sm:p-6">
            <WorkOrderFormSection
              number="01"
              title="Project Location"
              description="Select the project, site and area where this work will be performed."
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
                          {project.project_no || "-"} - {project.project_name || "-"}
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
                    }}
                    disabled={!projectId}
                  >
                    <SelectTrigger className={workOrderSelectTriggerClassName}>
                      <SelectValue
                        placeholder={
                          projectId ? "Select project site" : "Select project first"
                        }
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
                    onValueChange={setAreaId}
                    disabled={!siteId}
                  >
                    <SelectTrigger className={workOrderSelectTriggerClassName}>
                      <SelectValue
                        placeholder={
                          siteId ? "Select project area" : "Select site first"
                        }
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
                  <p className="text-sm font-bold text-slate-800">Work Order No</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Auto generated when saved. Example: WO2607-00001
                  </p>
                </div>
              </div>
            </WorkOrderFormSection>

            <WorkOrderFormSection
              number="02"
              title="Work Scope"
              description="Define the work order type, exact scope and location-specific requirements."
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
                        (scope) => scope.work_order_scope_id === value
                      );

                      setTitle(selectedScope?.work_order_scope_name || "");
                    }}
                    disabled={!workOrderTypeId}
                  >
                    <SelectTrigger className={workOrderSelectTriggerClassName}>
                      <SelectValue
                        placeholder={
                          workOrderTypeId
                            ? "Select work scope"
                            : "Select work order type first"
                        }
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
                  <p className="text-xs text-slate-500">
                    This value is saved as the work order title snapshot.
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={4}
                    placeholder="Describe the specific work requirements for this work order."
                    className={workOrderTextareaClassName}
                  />
                  <p className="text-xs text-slate-500">
                    Include area, quantity, installation method, access or site-specific requirements.
                  </p>
                </div>
              </div>
            </WorkOrderFormSection>

            <WorkOrderFormSection
              number="03"
              title="Priority & Schedule"
              description="Set the operational priority, initial status and planned dates."
            >
              <div className="grid gap-4 md:grid-cols-2">
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
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className={workOrderSelectTriggerClassName}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="Assigned">Assigned</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Ready for Inspection">
                        Ready for Inspection
                      </SelectItem>
                      <SelectItem value="Inspection">Inspection</SelectItem>
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
                    value={plannedStartDate}
                    onChange={(event) => setPlannedStartDate(event.target.value)}
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

                <div className="space-y-2">
                  <Label>Actual Start Date</Label>
                  <Input
                    type="date"
                    value={actualStartDate}
                    readOnly
                    className={`${workOrderInputClassName} bg-slate-100 text-slate-500`}
                  />
                  <p className="text-xs text-slate-500">
                    Recorded from real work activity.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Actual End Date</Label>
                  <Input
                    type="date"
                    value={actualEndDate}
                    readOnly
                    className={`${workOrderInputClassName} bg-slate-100 text-slate-500`}
                  />
                  <p className="text-xs text-slate-500">
                    Recorded when the work order is completed.
                  </p>
                </div>
              </div>
            </WorkOrderFormSection>

            <WorkOrderFormSection
              number="04"
              title="Worker Assignment"
              description="Search and select one or more active workers to assign after saving."
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Search Workers</Label>
                  <Input
                    value={workerSearchTerm}
                    onChange={(event) => setWorkerSearchTerm(event.target.value)}
                    placeholder="Type at least 2 characters to search workers..."
                    className={workOrderInputClassName}
                  />
                </div>

                {workerSearchTerm.trim().length >= 2 && (
                  <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
                    {filteredWorkers.length === 0 ? (
                      <p className="px-2 py-3 text-sm text-slate-500">
                        No matching workers found.
                      </p>
                    ) : (
                      filteredWorkers.map((employee) => {
                        const employeeName =
                          employee.display_name ||
                          `${employee.first_name || ""} ${employee.last_name || ""}`.trim() ||
                          employee.employee_code ||
                          "-";

                        return (
                          <button
                            key={employee.employee_id}
                            type="button"
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-[#9E4B4B] hover:bg-slate-50"
                            onClick={() => {
                              setSelectedEmployeeIds((current) => [
                                ...current,
                                employee.employee_id,
                              ]);
                              setWorkerSearchTerm("");
                            }}
                          >
                            <p className="text-sm font-semibold text-slate-900">
                              {employee.employee_code || "-"} - {employeeName}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Select to assign
                            </p>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-900">
                    Selected Workers
                  </p>

                  {selectedEmployeeIds.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-500">
                      No workers selected.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {selectedEmployeeIds.map((employeeId) => {
                        const employee = employees.find(
                          (item) => item.employee_id === employeeId
                        );

                        const employeeName =
                          employee?.display_name ||
                          `${employee?.first_name || ""} ${employee?.last_name || ""}`.trim() ||
                          employee?.employee_code ||
                          "-";

                        return (
                          <div
                            key={employeeId}
                            className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {employee?.employee_code || "-"} - {employeeName}
                              </p>
                              <p className="text-xs text-green-700">
                                Pending assignment
                              </p>
                            </div>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-[#9E4B4B] hover:text-[#873f3f]"
                              onClick={() =>
                                setSelectedEmployeeIds((current) =>
                                  current.filter((item) => item !== employeeId)
                                )
                              }
                            >
                              Remove
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </WorkOrderFormSection>

            <WorkOrderFormSection
              number="05"
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
                <p className="text-xs text-slate-500">
                  Use notes for information that supports the team but is not the main work scope.
                </p>
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
                {createWorkOrder.isPending ? "Saving..." : "Save Work Order"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div >
  );
};

export default WorkOrders;