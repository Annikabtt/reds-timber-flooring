import { useMemo, useState } from "react";
import { Clock3, Plus, Search } from "lucide-react";
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

const WorkTimeLogs = () => {
  const queryClient = useQueryClient();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [employeeId, setEmployeeId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [workOrderId, setWorkOrderId] = useState("");

  const [workDate, setWorkDate] = useState("");
  const [clockIn, setClockIn] = useState("");
  const [clockOut, setClockOut] = useState("");
  const [breakMinutes, setBreakMinutes] = useState("0");
  const [notes, setNotes] = useState("");
  const resetForm = () => {
    setEmployeeId("");
    setProjectId("");
    setSiteId("");
    setAreaId("");
    setWorkOrderId("");
    setWorkDate("");
    setClockIn("");
    setClockOut("");
    setBreakMinutes("0");
    setNotes("");
  };


  const { data: employees = [] } = useQuery({
    queryKey: ["employees-for-time-logs"],
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
        .eq("is_active", true);

      if (error) throw error;
      return data;
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-for-time-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          project_id,
          project_no,
          project_name
        `)
        .eq("is_deleted", false);

      if (error) throw error;
      return data;
    },
  });

  const { data: sites = [] } = useQuery({
    queryKey: ["sites-for-time-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_sites")
        .select(`
          site_id,
          project_id,
          site_name
        `)
        .eq("is_deleted", false);

      if (error) throw error;
      return data;
    },
  });

  const { data: areas = [] } = useQuery({
    queryKey: ["areas-for-time-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_areas")
        .select(`
          area_id,
          project_id,
          site_id,
          area_name
        `)
        .eq("is_deleted", false);

      if (error) throw error;
      return data;
    },
  });

  const { data: workOrders = [] } = useQuery({
    queryKey: ["work-orders-for-time-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_orders")
        .select(`
          work_order_id,
          project_id,
          site_id,
          area_id,
          work_order_no,
          title
        `)
        .eq("is_deleted", false);

      if (error) throw error;
      return data;
    },
  });

  const { data: timeLogs = [] } = useQuery({
    queryKey: ["work_time_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_time_logs")
        .select(`
          *,
          employees (
            employee_code,
            display_name
          ),
          projects (
            project_name
          ),
          work_orders (
            work_order_no,
            title
          )
        `)
        .eq("is_deleted", false)
        .order("work_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredSites = sites.filter(
    (site) => site.project_id === projectId
  );

  const filteredAreas = areas.filter(
    (area) =>
      area.project_id === projectId &&
      area.site_id === siteId
  );

  const filteredWorkOrders = workOrders.filter(
    (workOrder) =>
      workOrder.project_id === projectId &&
      workOrder.site_id === siteId &&
      workOrder.area_id === areaId
  );

  const createTimeLog = useMutation({
    mutationFn: async () => {
      if (!employeeId) throw new Error("Please select employee.");
      if (!workDate) throw new Error("Please select work date.");
      if (!clockIn) throw new Error("Please enter clock in.");
      if (!clockOut) throw new Error("Please enter clock out.");

      const start = new Date(clockIn);
      const end = new Date(clockOut);

      if (end <= start) {
        throw new Error("Clock out must be later than clock in.");
      }

      const totalHours =
        (end.getTime() - start.getTime()) /
        1000 /
        60 /
        60;

      const breakHours =
        Number(breakMinutes || 0) / 60;

      const workedHours =
        totalHours - breakHours;

      if (workedHours <= 0) {
        throw new Error("Worked hours must be greater than zero.");
      }

      const regularHours =
        Math.min(workedHours, 8);

      const overtimeHours =
        Math.max(workedHours - 8, 0);

      const { error } = await supabase
        .from("work_time_logs")
        .insert({
          employee_id: employeeId,
          project_id: projectId || null,
          site_id: siteId || null,
          area_id: areaId || null,
          work_order_id: workOrderId || null,
          work_date: workDate,
          clock_in: clockIn,
          clock_out: clockOut,
          break_minutes: Number(breakMinutes || 0),
          regular_hours: regularHours,
          overtime_hours: overtimeHours,
          approved: false,
          notes: notes || null,
          is_deleted: false,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Time log saved.");
      queryClient.invalidateQueries({
        queryKey: ["work_time_logs"],
      });

      resetForm();
      setShowAddDialog(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const approveTimeLog = useMutation({
    mutationFn: async (workTimeLogId: string) => {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;

      const currentUserId = authData.user?.id;

      if (!currentUserId) {
        throw new Error("Current user not found.");
      }

      const { error } = await supabase
        .from("work_time_logs")
        .update({
          approved: true,
          approved_by: currentUserId,
          approved_at: new Date().toISOString(),
        })
        .eq("work_time_log_id", workTimeLogId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Time log approved.");

      queryClient.invalidateQueries({
        queryKey: ["work_time_logs"],
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  const filteredLogs = useMemo(() => {
    const keyword = searchTerm.toLowerCase();

    return timeLogs.filter((log) => {
      const employee =
        log.employees?.display_name || "";

      const project =
        log.projects?.project_name || "";

      const workOrderNo =
        log.work_orders?.work_order_no || "";

      const workOrderTitle =
        log.work_orders?.title || "";

      const workDate =
        String(log.work_date || "");

      return (
        employee.toLowerCase().includes(keyword) ||
        project.toLowerCase().includes(keyword) ||
        workOrderNo.toLowerCase().includes(keyword) ||
        workOrderTitle.toLowerCase().includes(keyword) ||
        workDate.toLowerCase().includes(keyword)
      );
    });
  }, [timeLogs, searchTerm]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Clock3 className="h-8 w-8 text-red-600" />
            <h1 className="text-3xl font-bold">
              Work Time Logs
            </h1>
          </div>
          <p className="text-slate-500 mt-1">
            Employee attendance and payroll hours.
          </p>
        </div>

        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-red-600 hover:bg-red-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Time Log
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-slate-500">
            Total Logs
          </div>
          <div className="text-2xl font-bold">
            {timeLogs.length}
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-slate-500">
            Pending Approval
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {
              timeLogs.filter(
                (log) => !log.approved
              ).length
            }
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-slate-500">
            Regular Hours
          </div>
          <div className="text-2xl font-bold text-green-600">
            {timeLogs
              .reduce(
                (sum, log) =>
                  sum +
                  Number(
                    log.regular_hours || 0
                  ),
                0
              )
              .toFixed(2)}
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-slate-500">
            OT Hours
          </div>
          <div className="text-2xl font-bold text-red-600">
            {timeLogs
              .reduce(
                (sum, log) =>
                  sum +
                  Number(
                    log.overtime_hours || 0
                  ),
                0
              )
              .toFixed(2)}
          </div>
        </div>
      </div>
      <Input
        placeholder="Search employee, project, work order, date..."
        value={searchTerm}
        onChange={(e) =>
          setSearchTerm(e.target.value)
        }
      />

      <div className="bg-white rounded-xl border">
        {filteredLogs.map((log) => (
          <div
            key={log.work_time_log_id}
            className="p-4 border-b"
          >
            <div className="font-semibold">
              {log.employees?.display_name}
            </div>

            <div className="text-sm text-slate-500">
              {log.projects?.project_name}
            </div>

            <div className="text-sm text-slate-500">
              {log.projects?.project_name}
            </div>

            {log.work_orders && (
              <div className="text-sm text-slate-500">
                {log.work_orders.work_order_no} - {log.work_orders.title}
              </div>
            )}

            <div className="text-sm text-slate-500">
              {log.work_date}
            </div>

            {log.approved_at && (
              <div className="text-xs text-slate-500">
                Approved:{" "}
                {new Date(log.approved_at).toLocaleString()}
              </div>
            )}

            <div className="text-sm">
              Regular: {log.regular_hours} hrs |
              OT: {log.overtime_hours} hrs
            </div>

            <div className="flex items-center gap-3 mt-2">
              
              <div
                className={`text-xs font-semibold px-3 py-1 rounded-full ${log.approved
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-100 text-orange-700"
                  }`}
              >
                {log.approved ? "Approved" : "Pending Approval"}
              </div>

              {!log.approved && (
                <Button
                  size="sm"
                  onClick={() =>
                    approveTimeLog.mutate(
                      log.work_time_log_id
                    )
                  }
                >
                  Approve
                </Button>
              )}
            </div>
          </div>
        ))}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Time Log</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem
                      key={employee.employee_id}
                      value={employee.employee_id}
                    >
                      {employee.display_name ||
                        `${employee.first_name} ${employee.last_name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Work Date</Label>
              <Input
                type="date"
                value={workDate}
                onChange={(e) => setWorkDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Project</Label>
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
                      {project.project_no} - {project.project_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Site</Label>
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
                  <SelectValue placeholder="Select site" />
                </SelectTrigger>
                <SelectContent>
                  {filteredSites.map((site) => (
                    <SelectItem key={site.site_id} value={site.site_id}>
                      {site.site_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Area</Label>
              <Select
                value={areaId}
                onValueChange={(value) => {
                  setAreaId(value);
                  setWorkOrderId("");
                }}
                disabled={!siteId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent>
                  {filteredAreas.map((area) => (
                    <SelectItem key={area.area_id} value={area.area_id}>
                      {area.area_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Work Order</Label>
              <Select
                value={workOrderId}
                onValueChange={setWorkOrderId}
                disabled={!areaId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select work order" />
                </SelectTrigger>
                <SelectContent>
                  {filteredWorkOrders.map((workOrder) => (
                    <SelectItem
                      key={workOrder.work_order_id}
                      value={workOrder.work_order_id}
                    >
                      {workOrder.work_order_no} - {workOrder.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Clock In</Label>
              <Input
                type="datetime-local"
                value={clockIn}
                onChange={(e) => setClockIn(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Clock Out</Label>
              <Input
                type="datetime-local"
                value={clockOut}
                onChange={(e) => setClockOut(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Break Minutes</Label>
              <Input
                type="number"
                min="0"
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
            >
              Cancel
            </Button>

            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => createTimeLog.mutate()}
              disabled={createTimeLog.isPending}
            >
              {createTimeLog.isPending ? "Saving..." : "Save Time Log"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default WorkTimeLogs;