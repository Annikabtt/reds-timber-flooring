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
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewLog, setReviewLog] = useState<any | null>(null);
  const [reviewClockIn, setReviewClockIn] = useState("");
  const [reviewClockOut, setReviewClockOut] = useState("");
  const [reviewBreakMinutes, setReviewBreakMinutes] = useState("0");
  const [reviewNotes, setReviewNotes] = useState("");
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
            display_name,
            first_name,
            last_name
          ),
          projects (
            project_no,
            project_name
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
            title
          ),
          daily_reports (
            report_id,
            report_date
          ),
          work_activity_types (
            activity_name
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

  const calculateRoundedHours = (
    clockInValue: string,
    clockOutValue: string,
    breakMinutesValue: string
  ) => {
    if (!clockInValue || !clockOutValue) {
      return {
        regularHours: 0,
        overtimeHours: 0,
        workedHours: 0,
      };
    }

    const start = new Date(clockInValue);
    const end = new Date(clockOutValue);

    if (end <= start) {
      return {
        regularHours: 0,
        overtimeHours: 0,
        workedHours: 0,
      };
    }

    const totalHours =
      (end.getTime() - start.getTime()) / 1000 / 60 / 60;

    const breakHours = Number(breakMinutesValue || 0) / 60;

    const rawWorkedHours = Math.max(totalHours - breakHours, 0);

    const roundedWorkedHours = Math.ceil(rawWorkedHours / 0.25) * 0.25;

    return {
      regularHours: Math.min(roundedWorkedHours, 8),
      overtimeHours: Math.max(roundedWorkedHours - 8, 0),
      workedHours: roundedWorkedHours,
    };
  };

  const openReviewDialog = (log: any) => {
    setReviewLog(log);
    setReviewClockIn(log.clock_in || "");
    setReviewClockOut(log.clock_out || "");
    setReviewBreakMinutes(
      log.break_minutes === null || log.break_minutes === undefined
        ? "0"
        : String(log.break_minutes)
    );
    setReviewNotes(log.notes || "");
    setShowReviewDialog(true);
  };

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

      const calculated = calculateRoundedHours(
        clockIn,
        clockOut,
        breakMinutes
      );

      if (calculated.workedHours <= 0) {
        throw new Error("Worked hours must be greater than zero.");
      }

      const regularHours = calculated.regularHours;
      const overtimeHours = calculated.overtimeHours;

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

  const saveReviewTimeLog = useMutation({
    mutationFn: async () => {
      if (!reviewLog?.work_time_log_id) {
        throw new Error("Time log is missing.");
      }

      if (!reviewClockIn || !reviewClockOut) {
        throw new Error("Clock in and clock out are required.");
      }

      const start = new Date(reviewClockIn);
      const end = new Date(reviewClockOut);

      if (end <= start) {
        throw new Error("Clock out must be later than clock in.");
      }

      const calculated = calculateRoundedHours(
        reviewClockIn,
        reviewClockOut,
        reviewBreakMinutes
      );

      if (calculated.workedHours <= 0) {
        throw new Error("Worked hours must be greater than zero.");
      }

      const { error } = await supabase
        .from("work_time_logs")
        .update({
          approved_clock_in: reviewClockIn,
          approved_clock_out: reviewClockOut,
          approved_break_minutes: Number(reviewBreakMinutes || 0),

          approved_regular_hours: calculated.regularHours,
          approved_overtime_hours: calculated.overtimeHours,

          review_reason: reviewNotes.trim(),

          reviewed_by: (await supabase.auth.getUser()).data.user?.id ?? null,

          reviewed_at: new Date().toISOString(),

          time_status: "Pending",
        })
        .eq("work_time_log_id", reviewLog.work_time_log_id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Time log review saved.");

      queryClient.invalidateQueries({
        queryKey: ["work_time_logs"],
      });

      setShowReviewDialog(false);
      setReviewLog(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const approveTimeLog = useMutation({
    mutationFn: async (log: any) => {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;

      const currentUserId = authData.user?.id;

      if (!currentUserId) {
        throw new Error("Current user not found.");
      }

      const approvedClockIn = log.approved_clock_in || log.clock_in;
      const approvedClockOut = log.approved_clock_out || log.clock_out;
      const approvedBreakMinutes =
        log.approved_break_minutes === null ||
          log.approved_break_minutes === undefined
          ? String(log.break_minutes || 0)
          : String(log.approved_break_minutes);

      if (!approvedClockIn || !approvedClockOut) {
        throw new Error("Clock in and clock out are required before approval.");
      }

      const calculated = calculateRoundedHours(
        approvedClockIn,
        approvedClockOut,
        approvedBreakMinutes
      );

      if (calculated.workedHours <= 0) {
        throw new Error("Worked hours must be greater than zero.");
      }

      const { error } = await supabase
        .from("work_time_logs")
        .update({
          approved_clock_in: approvedClockIn,
          approved_clock_out: approvedClockOut,
          approved_break_minutes: Number(approvedBreakMinutes || 0),
          approved_regular_hours: calculated.regularHours,
          approved_overtime_hours: calculated.overtimeHours,
          regular_hours: calculated.regularHours,
          overtime_hours: calculated.overtimeHours,
          approved: true,
          approved_by: currentUserId,
          approved_at: new Date().toISOString(),
          time_status: "Approved",
        })
        .eq("work_time_log_id", log.work_time_log_id);

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

  const today = new Date().toISOString().slice(0, 10);

  const todaysLogs = timeLogs.filter(
    (log) => log.work_date === today
  );

  const pendingReviewCount = todaysLogs.filter(
    (log) => !log.approved
  ).length;

  const approvedCount = todaysLogs.filter(
    (log) => log.approved
  ).length;

  const missingCheckCount = todaysLogs.filter(
    (log) => !log.clock_in || !log.clock_out
  ).length;

  const getTimeStatus = (log: any) => {
    if (log.approved) return "Approved";

    if (!log.clock_in || !log.clock_out) {
      return "Missing CheckIn-Checkout";
    }

    const totalHours =
      Number(log.regular_hours || 0) + Number(log.overtime_hours || 0);

    if (totalHours > 12 || Number(log.overtime_hours || 0) > 4) {
      return "Need Review";
    }

    return "Pending";
  };

  const getTimeStatusClass = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-700";
      case "Missing CheckIn-Checkout":
        return "bg-red-100 text-red-700";
      case "Need Review":
        return "bg-amber-100 text-amber-700";
      case "Pending":
      default:
        return "bg-orange-100 text-orange-700";
    }
  };

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
            Today's Time Logs
          </div>
          <div className="text-2xl font-bold">
            {todaysLogs.length}
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-slate-500">
            Pending Review
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {pendingReviewCount}
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-slate-500">
            Missing Check In/Out
          </div>
          <div className="text-2xl font-bold text-red-600">
            {missingCheckCount}
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-slate-500">
            Approved Today
          </div>
          <div className="text-2xl font-bold text-green-600">
            {approvedCount}
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

            {log.work_orders && (
              <div className="text-sm text-slate-500">
                {log.work_orders.work_order_no} - {log.work_orders.title}
              </div>
            )}

            <div className="text-sm text-slate-500">
              {log.work_date}
            </div>

            <div className="mt-2 text-sm text-slate-700">
              <span className="font-medium">Time:</span>{" "}
              {log.clock_in ? new Date(log.clock_in).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }) : "-"}
              {" → "}
              {log.clock_out ? new Date(log.clock_out).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }) : "-"}
            </div>

            <div className="text-sm text-slate-500">
              Break: {Number(log.break_minutes || 0)} min
            </div>

            {log.approved_at && (
              <div className="text-xs text-slate-500">
                Approved:{" "}
                {new Date(log.approved_at).toLocaleString()}
              </div>
            )}
            {log.work_activity_types && (
              <div className="text-sm text-slate-500">
                Activity: {log.work_activity_types.activity_name}
              </div>
            )}
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-slate-500">Regular</span>
                <div className="font-semibold">
                  {Number(log.regular_hours || 0).toFixed(2)} h
                </div>
              </div>

              <div>
                <span className="text-slate-500">OT</span>
                <div className="font-semibold text-red-600">
                  {Number(log.overtime_hours || 0).toFixed(2)} h
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <div
                className={`text-xs font-semibold px-3 py-1 rounded-full ${log.daily_report_id
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-100 text-slate-700"
                  }`}
              >
                {log.daily_report_id ? "Daily Report" : "Manual"}
              </div>
              <div
                className={`text-xs font-semibold px-3 py-1 rounded-full ${getTimeStatusClass(
                  getTimeStatus(log)
                )}`}
              >
                {getTimeStatus(log)}
              </div>

              {!log.approved && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openReviewDialog(log)}
                  >
                    Review
                  </Button>

                  <Button
                    size="sm"
                    onClick={() =>
                      approveTimeLog.mutate(log)
                    }
                  >
                    Approve
                  </Button>
                </>
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
      <Dialog
        open={showReviewDialog}
        onOpenChange={(open) => {
          setShowReviewDialog(open);

          if (!open) {
            setReviewLog(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Time Log</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-xl border bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Employee</p>
              <p className="font-semibold text-slate-900">
                {reviewLog?.employees?.display_name ||
                  `${reviewLog?.employees?.first_name || ""} ${reviewLog?.employees?.last_name || ""}`.trim() ||
                  reviewLog?.employees?.employee_code ||
                  "-"}
              </p>

              <p className="mt-3 text-sm text-slate-500">Work Date</p>
              <p className="font-semibold text-slate-900">
                {reviewLog?.work_date || "-"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">
                Original Time
              </p>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-slate-500">Clock In</p>
                  <p className="font-semibold text-slate-900">
                    {reviewLog?.clock_in
                      ? new Date(reviewLog.clock_in).toLocaleString()
                      : "-"}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">Clock Out</p>
                  <p className="font-semibold text-slate-900">
                    {reviewLog?.clock_out
                      ? new Date(reviewLog.clock_out).toLocaleString()
                      : "-"}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">Break</p>
                  <p className="font-semibold text-slate-900">
                    {Number(reviewLog?.break_minutes || 0)} min
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">Regular</p>
                  <p className="font-semibold text-slate-900">
                    {Number(reviewLog?.regular_hours || 0).toFixed(2)} h
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">OT</p>
                  <p className="font-semibold text-red-600">
                    {Number(reviewLog?.overtime_hours || 0).toFixed(2)} h
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">Status</p>
                  <p className="font-semibold text-slate-900">
                    {reviewLog ? getTimeStatus(reviewLog) : "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <p className="text-sm font-semibold text-slate-900">
                Approved Time
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Adjust the time below if the original clock in/out needs supervisor correction.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Clock In</Label>
                <Input
                  type="datetime-local"
                  value={reviewClockIn}
                  onChange={(e) => setReviewClockIn(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Clock Out</Label>
                <Input
                  type="datetime-local"
                  value={reviewClockOut}
                  onChange={(e) => setReviewClockOut(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Break Minutes</Label>
                <Input
                  type="number"
                  min="0"
                  value={reviewBreakMinutes}
                  onChange={(e) => setReviewBreakMinutes(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <div
                  className={`flex h-10 items-center rounded-md px-3 text-sm font-semibold ${reviewLog
                    ? getTimeStatusClass(getTimeStatus(reviewLog))
                    : "bg-slate-100 text-slate-700"
                    }`}
                >
                  {reviewLog ? getTimeStatus(reviewLog) : "-"}
                </div>
              </div>

              <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  Calculated Payroll Hours
                </p>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500">Worked Hours</p>
                    <p className="font-bold text-slate-900">
                      {calculateRoundedHours(
                        reviewClockIn,
                        reviewClockOut,
                        reviewBreakMinutes
                      ).workedHours.toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500">Regular Hours</p>
                    <p className="font-bold text-slate-900">
                      {calculateRoundedHours(
                        reviewClockIn,
                        reviewClockOut,
                        reviewBreakMinutes
                      ).regularHours.toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-500">OT Hours</p>
                    <p className="font-bold text-red-600">
                      {calculateRoundedHours(
                        reviewClockIn,
                        reviewClockOut,
                        reviewBreakMinutes
                      ).overtimeHours.toFixed(2)}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  Hours are rounded up to the nearest 15 minutes.
                </p>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label>Review Reason *</Label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Example: Forgot to check out, corrected checkout time, break adjusted"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowReviewDialog(false)}
              >
                Cancel
              </Button>

              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={() => saveReviewTimeLog.mutate()}
                disabled={saveReviewTimeLog.isPending}
              >
                Save Review
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkTimeLogs;