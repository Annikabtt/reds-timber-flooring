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

      const totalHours =
        (end.getTime() - start.getTime()) /
        1000 /
        60 /
        60;

      const breakHours =
        Number(breakMinutes || 0) / 60;

      const workedHours =
        totalHours - breakHours;

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

      setShowAddDialog(false);
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

      return (
        employee.toLowerCase().includes(keyword) ||
        log.work_orders?.title
          ?.toLowerCase()
          .includes(keyword)
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

      <Input
        placeholder="Search..."
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
              {log.work_date}
            </div>

            <div className="text-sm">
              Regular: {log.regular_hours} hrs |
              OT: {log.overtime_hours} hrs
            </div>

            <div className="text-sm">
              {log.approved
                ? "Approved"
                : "Pending Approval"}
            </div>
          </div>
        ))}
      </div>

      {/* Dialog เหมือนหน้าก่อน ๆ */}
    </div>
  );
};

export default WorkTimeLogs;