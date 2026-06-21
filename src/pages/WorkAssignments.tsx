import { useMemo, useState } from "react";
import { UserCheck, Plus, Search } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

const WorkAssignments = () => {
  const queryClient = useQueryClient();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [employeeId, setEmployeeId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [workOrderId, setWorkOrderId] = useState("");
  const [assignedDate, setAssignedDate] = useState("");
  const [unassignedDate, setUnassignedDate] = useState("");
  const [notes, setNotes] = useState("");

  const { data: employees = [] } = useQuery({
    queryKey: ["employees-for-work-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select(`
          employee_id,
          employee_code,
          display_name,
          first_name,
          last_name,
          employment_type
        `)
        .eq("is_deleted", false)
        .eq("is_active", true)
        .order("display_name", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-for-work-assignments"],
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
    queryKey: ["sites-for-work-assignments"],
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
    queryKey: ["areas-for-work-assignments"],
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
    queryKey: ["work-orders-for-work-assignments"],
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
          status
        `)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["work_assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_assignments")
        .select(`
          work_assignment_id,
          employee_id,
          project_id,
          site_id,
          area_id,
          work_order_id,
          assigned_date,
          unassigned_date,
          notes,
          created_at,
          employees (
            employee_code,
            display_name,
            first_name,
            last_name,
            employment_type
          ),
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
          work_orders (
            work_order_no,
            title,
            status
          )
        `)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredSites = useMemo(() => {
    return sites.filter((site) => site.project_id === projectId);
  }, [sites, projectId]);

  const filteredAreas = useMemo(() => {
    return areas.filter(
      (area) => area.project_id === projectId && area.site_id === siteId
    );
  }, [areas, projectId, siteId]);

  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter(
      (workOrder) =>
        workOrder.project_id === projectId &&
        workOrder.site_id === siteId &&
        workOrder.area_id === areaId
    );
  }, [workOrders, projectId, siteId, areaId]);

  const resetForm = () => {
    setEmployeeId("");
    setProjectId("");
    setSiteId("");
    setAreaId("");
    setWorkOrderId("");
    setAssignedDate("");
    setUnassignedDate("");
    setNotes("");
  };

  const createAssignment = useMutation({
    mutationFn: async () => {
      if (!employeeId) throw new Error("Please select employee.");
      if (!projectId) throw new Error("Please select project.");
      if (!siteId) throw new Error("Please select project site.");
      if (!areaId) throw new Error("Please select project area.");
      if (!workOrderId) throw new Error("Please select work order.");
      if (!assignedDate) throw new Error("Please select assigned date.");

      const { error } = await supabase.from("work_assignments").insert({
        employee_id: employeeId,
        project_id: projectId,
        site_id: siteId,
        area_id: areaId,
        work_order_id: workOrderId,
        assigned_date: assignedDate,
        unassigned_date: unassignedDate || null,
        notes: notes.trim() || null,
        is_deleted: false,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Work assignment created successfully.");
      queryClient.invalidateQueries({ queryKey: ["work_assignments"] });
      setShowAddDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const filteredAssignments = useMemo(() => {
    const keyword = searchTerm.toLowerCase();

    return assignments.filter((assignment) => {
      const employeeName =
        assignment.employees?.display_name ||
        `${assignment.employees?.first_name || ""} ${
          assignment.employees?.last_name || ""
        }`;

      const projectName = assignment.projects?.project_name || "";
      const customerName = assignment.projects?.customers?.customer_name || "";
      const siteName = assignment.project_sites?.site_name || "";
      const areaName = assignment.project_areas?.area_name || "";
      const workOrderTitle = assignment.work_orders?.title || "";

      return (
        employeeName.toLowerCase().includes(keyword) ||
        assignment.employees?.employee_code?.toLowerCase().includes(keyword) ||
        projectName.toLowerCase().includes(keyword) ||
        customerName.toLowerCase().includes(keyword) ||
        siteName.toLowerCase().includes(keyword) ||
        areaName.toLowerCase().includes(keyword) ||
        workOrderTitle.toLowerCase().includes(keyword) ||
        assignment.work_orders?.status?.toLowerCase().includes(keyword)
      );
    });
  }, [assignments, searchTerm]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <UserCheck className="h-8 w-8 text-red-600" />
            <h1 className="text-3xl font-bold text-slate-900">
              Work Assignments
            </h1>
          </div>
          <p className="text-slate-500 mt-1">
            Assign employees to project work orders by site and area.
          </p>
        </div>

        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl shadow-lg shadow-red-200 transition-all flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Assignment
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search by employee, project, site, area, work order..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-12 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500 px-4 py-3 border-b">
          <div className="col-span-2">Employee</div>
          <div className="col-span-3">Project</div>
          <div className="col-span-2">Site / Area</div>
          <div className="col-span-2">Work Order</div>
          <div className="col-span-2">Assignment Period</div>
          <div className="col-span-1">Status</div>
        </div>

        {filteredAssignments.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No work assignments found.
          </div>
        ) : (
          filteredAssignments.map((assignment) => {
            const employeeName =
              assignment.employees?.display_name ||
              `${assignment.employees?.first_name || ""} ${
                assignment.employees?.last_name || ""
              }`.trim() ||
              "-";

            return (
              <div
                key={assignment.work_assignment_id}
                className="grid grid-cols-12 px-4 py-4 border-b last:border-b-0 hover:bg-slate-50 transition-colors"
              >
                <div className="col-span-2">
                  <p className="font-semibold text-slate-900">
                    {employeeName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {assignment.employees?.employee_code || "-"} ·{" "}
                    {assignment.employees?.employment_type || "-"}
                  </p>
                </div>

                <div className="col-span-3">
                  <p className="font-medium text-slate-800">
                    {assignment.projects?.project_name || "-"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {assignment.projects?.project_no || "-"} ·{" "}
                    {assignment.projects?.customers?.customer_name || "-"}
                  </p>
                </div>

                <div className="col-span-2 text-slate-700">
                  <p>{assignment.project_sites?.site_name || "-"}</p>
                  <p className="text-xs text-slate-500">
                    {assignment.project_areas?.area_name || "-"}
                  </p>
                </div>

                <div className="col-span-2 text-slate-700">
                  <p>{assignment.work_orders?.title || "-"}</p>
                  <p className="text-xs text-slate-500">
                    {assignment.work_orders?.work_order_no || "-"}
                  </p>
                </div>

                <div className="col-span-2 text-sm text-slate-700">
                  <p>Start: {assignment.assigned_date || "-"}</p>
                  <p>End: {assignment.unassigned_date || "Current"}</p>
                </div>

                <div className="col-span-1 text-slate-700">
                  {assignment.work_orders?.status || "-"}
                </div>
              </div>
            );
          })
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Add Work Assignment</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Employee *</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => {
                    const name =
                      employee.display_name ||
                      `${employee.first_name || ""} ${
                        employee.last_name || ""
                      }`.trim();

                    return (
                      <SelectItem
                        key={employee.employee_id}
                        value={employee.employee_id}
                      >
                        {employee.employee_code || "-"} - {name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Project *</Label>
              <Select
                value={projectId}
                onValueChange={(value) => {
                  setProjectId(value);
                  setSiteId("");
                  setAreaId("");
                  setWorkOrderId("");
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
                  setWorkOrderId("");
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
                onValueChange={(value) => {
                  setAreaId(value);
                  setWorkOrderId("");
                }}
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

            <div className="col-span-2 space-y-2">
              <Label>Work Order *</Label>
              <Select
                value={workOrderId}
                onValueChange={setWorkOrderId}
                disabled={!areaId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      areaId ? "Select work order" : "Select area first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredWorkOrders.map((workOrder) => (
                    <SelectItem
                      key={workOrder.work_order_id}
                      value={workOrder.work_order_id}
                    >
                      {workOrder.work_order_no || "-"} - {workOrder.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assigned Date *</Label>
              <Input
                type="date"
                value={assignedDate}
                onChange={(e) => setAssignedDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Unassigned Date</Label>
              <Input
                type="date"
                value={unassignedDate}
                onChange={(e) => setUnassignedDate(e.target.value)}
              />
            </div>

            <div className="col-span-2 space-y-2">
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
              onClick={() => createAssignment.mutate()}
              disabled={createAssignment.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {createAssignment.isPending ? "Saving..." : "Save Assignment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkAssignments;