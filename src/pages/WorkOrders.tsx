import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Plus, Search } from "lucide-react";
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

const WorkOrders = () => {
  const getStatusBadgeClass = (status: string | null) => {
    switch (status) {
      case "Open":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "Assigned":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "In Progress":
        return "bg-orange-100 text-orange-700 border-orange-200";
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
  const [workOrderNo, setWorkOrderNo] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [status, setStatus] = useState("Open");
  const [plannedStartDate, setPlannedStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [plannedEndDate, setPlannedEndDate] = useState("");
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
    return [...employees].sort((a, b) => {
      const aCode = a.employee_code || "";
      const bCode = b.employee_code || "";
      return aCode.localeCompare(bCode);
    });
  }, [employees]);

  const filteredAreas = useMemo(() => {
    return areas.filter(
      (area) => area.project_id === projectId && area.site_id === siteId
    );
  }, [areas, projectId, siteId]);

  const resetForm = () => {
    setProjectId("");
    setSiteId("");
    setAreaId("");
    setWorkOrderNo("");
    setTitle("");
    setDescription("");
    setPriority("Normal");
    setStatus("Open");
    setPlannedStartDate(new Date().toISOString().split("T")[0]);
    setPlannedEndDate("");
    setSelectedEmployeeIds([]);
    setWorkerSearchTerm("");
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

      if (!title.trim()) {
        throw new Error("Please enter work order title.");
      }

      const { data: newWorkOrder, error } = await supabase
        .from("work_orders")
        .insert({
          work_order_no: workOrderNo.trim() || undefined,
          project_id: projectId,
          site_id: siteId,
          area_id: areaId || null,
          title: title.trim(),
          description: description.trim() || null,
          priority,
          status,
          planned_start_date: plannedStartDate || null,
          planned_end_date: plannedEndDate || null,
          notes: notes.trim() || null,
          is_deleted: false,
        })
        .select("work_order_id")
        .single();

      if (error) throw error;

      if (selectedEmployeeIds.length > 0) {
        for (const employeeId of selectedEmployeeIds) {
          const { error: assignmentError } = await supabase.rpc("create_work_assignment", {
            p_employee_id: employeeId,
            p_project_id: projectId,
            p_site_id: siteId,
            p_area_id: areaId || null,
            p_work_order_id: newWorkOrder.work_order_id,
            p_notes: null,
          });

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
      <div className="flex items-center justify-between">
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
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl shadow-lg shadow-red-200 transition-all flex items-center gap-2"
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

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
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
              <div className="col-span-2 text-xs text-slate-700">
                {workOrder.work_assignments?.filter((assignment) => !assignment.is_deleted)
                  .length === 0 ? (
                  <span className="text-slate-400">-</span>
                ) : (
                  <div className="space-y-1">
                    {workOrder.work_assignments
                      ?.filter((assignment) => !assignment.is_deleted)
                      .map((assignment) => {
                        const employee = assignment.employees;
                        const employeeName = employee
                          ? employee.display_name ||
                          `${employee.first_name} ${employee.last_name}`
                          : "-";

                        return (
                          <div key={assignment.work_assignment_id}>
                            {employee?.employee_code || "-"} - {employeeName}
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

              <div className="col-span-1 text-slate-700">
                {workOrder.status || "-"}
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
              <div className="col-span-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/work-orders/${workOrder.work_order_id}`)}
                >
                  View
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Work Order</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="border-b pb-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Work Order Details
                </h3>
                <p className="text-xs text-slate-500">
                  Select the project location and basic work information.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
              </div>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Project *</Label>
              <Select
                value={projectId}
                onValueChange={(value) => {
                  setProjectId(value);
                  setSiteId("");
                  setAreaId("");
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
                      {project.project_no || "-"} - {project.project_name}
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
                <SelectTrigger>
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
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label>Work Order No</Label>
              <Input
                value={workOrderNo}
                onChange={(e) => setWorkOrderNo(e.target.value)}
                placeholder="WO2606-00001"
              />
            </div>

            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Install timber flooring"
              />
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
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
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Assigned">Assigned</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
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
                onChange={(e) => setPlannedStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Planned End Date</Label>
              <Input
                type="date"
                value={plannedEndDate}
                onChange={(e) => setPlannedEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                Worker Assignment
              </h3>
              <p className="text-xs text-slate-500">
                Select workers who will be assigned after this work order is saved.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Assign Workers to this Work Order</Label>

            <Select
              key={selectedEmployeeIds.join("-")}
              onValueChange={(employeeId) => {
                if (!selectedEmployeeIds.includes(employeeId)) {
                  setSelectedEmployeeIds((current) => [...current, employeeId]);
                }
              }}

            >

              <SelectTrigger>
                <SelectValue placeholder="Select worker" />
              </SelectTrigger>
              <SelectContent>
                {filteredWorkers
                  .filter((employee) => !selectedEmployeeIds.includes(employee.employee_id))
                  .map((employee) => {
                    const employeeName =
                      employee.display_name ||
                      `${employee.first_name || ""} ${employee.last_name || ""}`.trim() ||
                      employee.employee_code;

                    return (
                      <SelectItem
                        key={employee.employee_id}
                        value={employee.employee_id}
                      >
                        {employee.employee_code || "-"} - {employeeName}
                      </SelectItem>
                    );
                  })}
              </SelectContent>

            </Select>

            <p className="text-xs text-slate-500">
              Workers already selected are hidden from this list.
            </p>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
              <p className="text-sm font-semibold text-slate-900">
                Selected Workers
              </p>

              {selectedEmployeeIds.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No workers selected.
                </p>
              ) : (
                <div className="space-y-2">
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
                        className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
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
                          className="text-orange-600 hover:text-orange-700"
                          onClick={() =>
                            setSelectedEmployeeIds((current) =>
                              current.filter((id) => id !== employeeId)
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

          <div className="space-y-3">
            <div className="border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                Additional Information
              </h3>
              <p className="text-xs text-slate-500">
                Add work details, notes, or instructions for the team.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />

            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                resetForm();
              }}
            >
              Cancel
            </Button>

            <Button
              onClick={() => createWorkOrder.mutate()}
              disabled={createWorkOrder.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {createWorkOrder.isPending ? "Saving..." : "Save Work Order"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div >
  );
};

export default WorkOrders;