import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Plus, Search } from "lucide-react";
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

type LabourRecord = {
  employee_id: string;
  activity_type_id: string;
  regular_hours: string;
  overtime_hours: string;
  completed_quantity: string;
  worker_role: string;
  notes: string;
};

const DailyReports = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [projectId, setProjectId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [workOrderId, setWorkOrderId] = useState("");

  const [reportDate, setReportDate] = useState("");
  const [weatherCondition, setWeatherCondition] = useState("Fine");
  const [workersCount, setWorkersCount] = useState("");
  const [progressPercent, setProgressPercent] = useState("");
  const [completedQuantity, setCompletedQuantity] = useState("");
  const [workCompleted, setWorkCompleted] = useState("");
  const [issuesFound, setIssuesFound] = useState("");
  const [nextActions, setNextActions] = useState("");
  const [notes, setNotes] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoCaption, setPhotoCaption] = useState("");
  const [selectedActivityTypeIds, setSelectedActivityTypeIds] = useState<string[]>([]);
  const [labourRecords, setLabourRecords] = useState<LabourRecord[]>([
    {
      employee_id: "",
      activity_type_id: "",
      regular_hours: "8",
      overtime_hours: "0",
      completed_quantity: "0",
      worker_role: "",
      notes: "",
    },
  ]);
  const { data: projects = [] } = useQuery({
    queryKey: ["projects-for-daily-reports"],
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
    queryKey: ["sites-for-daily-reports"],
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
    queryKey: ["areas-for-daily-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_areas")
        .select(`
          area_id,
          project_id,
          site_id,
          area_code,
          area_name,
          estimated_quantity
        `)
        .eq("is_deleted", false)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees-for-daily-reports"],
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
        .eq("is_active", true)
        .order("display_name", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const { data: activityTypes = [] } = useQuery({
    queryKey: ["work-activity-types-for-daily-reports"],
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
      return data;
    },
  });
  const { data: workOrders = [] } = useQuery({
    queryKey: ["work-orders-for-daily-reports"],
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

  const { data: dailyReports = [] } = useQuery({
    queryKey: ["daily_reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_reports")
        .select(`
        report_id,
        project_id,
        site_id,
        area_id,
        work_order_id,
        report_date,
        weather_condition,
        workers_count,
        completed_quantity,
        progress_percent,
        approval_status,
        work_completed,
        issues_found,
        next_actions,
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
          area_name,
          estimated_quantity,
          unit_of_measure
        ),
        work_orders (
          work_order_no,
          title,
          status
        ),
        daily_report_activities (
          daily_report_activity_id,
          activity_type_id,
          work_activity_types (
            activity_name,
            sort_order
          )
        ),
        daily_report_photos (
          photo_id,
          is_deleted
        )
      `)
        .eq("is_deleted", false)
        .order("report_date", { ascending: false });

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

  const selectedArea = useMemo(() => {
    return areas.find((area) => area.area_id === areaId);
  }, [areas, areaId]);

  console.log("Daily Report Progress Debug", {
    areaId,
    selectedArea,
    completedQuantity,
    estimatedQuantity: selectedArea?.estimated_quantity,
  });


  useEffect(() => {
    const completed = Number(completedQuantity || 0);
    const estimated = Number(selectedArea?.estimated_quantity || 0);

    if (completed <= 0 || estimated <= 0) {
      setProgressPercent("0.00");
      return;
    }

    const calculatedProgress = Math.min(
      (completed / estimated) * 100,
      100
    );

    setProgressPercent(calculatedProgress.toFixed(2));
  }, [completedQuantity, selectedArea]);

  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter(
      (workOrder) =>
        workOrder.project_id === projectId &&
        workOrder.site_id === siteId &&
        workOrder.area_id === areaId
    );
  }, [workOrders, projectId, siteId, areaId]);

  const resetForm = () => {
    setProjectId("");
    setSiteId("");
    setAreaId("");
    setWorkOrderId("");
    setReportDate("");
    setWeatherCondition("Fine");
    setWorkersCount("");
    setProgressPercent("");
    setCompletedQuantity("");
    setWorkCompleted("");
    setIssuesFound("");
    setNextActions("");
    setNotes("");
    setPhotoFiles([]);
    setPhotoCaption("");
    setSelectedActivityTypeIds([]);
  };

  setLabourRecords([
    {
      employee_id: "",
      activity_type_id: "",
      regular_hours: "8",
      overtime_hours: "0",
      completed_quantity: "0",
      worker_role: "",
      notes: "",
    },
  ]);

  const createDailyReport = useMutation({
    mutationFn: async () => {
      if (!projectId) throw new Error("Please select a project.");
      if (!siteId) throw new Error("Please select a project site.");
      if (!areaId) throw new Error("Please select a project area.");
      if (!workOrderId) throw new Error("Please select a work order.");
      if (!reportDate) throw new Error("Please select report date.");
      const validLabourRecords = labourRecords.filter(
        (record) => record.employee_id && record.activity_type_id
      );

      if (validLabourRecords.length === 0) {
        throw new Error("Please add at least one labour record.");
      }
      const completedToday = Number(completedQuantity || 0);

      if (completedToday < 0) {
        throw new Error("Completed Quantity Today cannot be negative.");
      }

      if (
        completedToday === 0 &&
        !issuesFound.trim() &&
        !notes.trim()
      ) {
        throw new Error(
          "Please enter Issues Found or Notes when Completed Quantity Today is 0."
        );
      }

      const progress = progressPercent ? Number(progressPercent) : null;

      if (progress !== null && (progress < 0 || progress > 100)) {
        throw new Error("Progress percent must be between 0 and 100.");
      }

      const { data: createdReport, error } = await supabase
        .from("daily_reports")
        .insert({
          project_id: projectId,
          site_id: siteId,
          area_id: areaId,
          work_order_id: workOrderId,
          report_date: reportDate,
          weather_condition: weatherCondition || null,
          workers_count: new Set(validLabourRecords.map((record) => record.employee_id)).size,
          approval_status: "Submitted",
          progress_percent: progress,
          completed_quantity: completedToday,
          work_completed: workCompleted.trim() || null,
          issues_found: issuesFound.trim() || null,
          next_actions: nextActions.trim() || null,
          notes: notes.trim() || null,
          is_deleted: false,
        })
        .select("report_id")
        .single();

      if (error) throw error;

      if (!createdReport?.report_id) {
        throw new Error("Daily report was created but report ID was not returned.");
      }
      const activityRows = selectedActivityTypeIds.map((activityTypeId) => ({
        report_id: createdReport.report_id,
        activity_type_id: activityTypeId,
      }));

      const { error: activityInsertError } = await supabase
        .from("daily_report_activities")
        .insert(activityRows);

      if (activityInsertError) throw activityInsertError;
      const workerRows = validLabourRecords.map((record) => ({
        report_id: createdReport.report_id,
        employee_id: record.employee_id,
        activity_type_id: record.activity_type_id,
        regular_hours: Number(record.regular_hours || 0),
        overtime_hours: Number(record.overtime_hours || 0),
        completed_quantity: Number(record.completed_quantity || 0),
        worker_role: record.worker_role.trim() || null,
        notes: record.notes.trim() || null,
      }));

      const { error: workerInsertError } = await supabase
        .from("daily_report_workers")
        .insert(workerRows);

      if (workerInsertError) throw workerInsertError;

      if (photoFiles.length > 0) {
        for (const photoFile of photoFiles) {
          const fileName =
            `${createdReport.report_id}/${Date.now()}-${photoFile.name}`;

          const { error: uploadError } = await supabase.storage
            .from("daily-report-photos")
            .upload(fileName, photoFile, {
              cacheControl: "3600",
              upsert: false,
            });

          if (uploadError) throw uploadError;

          const { data: publicUrlData } = supabase.storage
            .from("daily-report-photos")
            .getPublicUrl(fileName);

          const { error: photoInsertError } = await supabase
            .from("daily_report_photos")
            .insert({
              report_id: createdReport.report_id,
              photo_url: publicUrlData.publicUrl,
              caption: photoCaption.trim() || null,
              sort_order: 0,
              taken_at: new Date().toISOString(),
              is_deleted: false,

              approval_status: "Pending",
              approved_by: null,
              approved_at: null,
              rejected_reason: null,
            });

          if (photoInsertError) throw photoInsertError;
        }
      }

      if (progress !== null) {
        let nextStatus = "In Progress";

        if (progress === 0) {
          nextStatus = "Open";
        }

        if (progress >= 100) {
          nextStatus = "Completed";
        }

        const { error: workOrderError } = await supabase
          .from("work_orders")
          .update({
            status: nextStatus,
            actual_start_date: progress > 0 ? reportDate : null,
            actual_end_date: progress >= 100 ? reportDate : null,
          })
          .eq("work_order_id", workOrderId);

        if (workOrderError) throw workOrderError;
      }
    },
    onSuccess: () => {
      toast.success("Daily report created successfully.");
      queryClient.invalidateQueries({ queryKey: ["daily_reports"] });
      queryClient.invalidateQueries({
        queryKey: ["work-orders-for-daily-reports"],
      });
      queryClient.invalidateQueries({ queryKey: ["work_orders"] });
      setShowAddDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const filteredDailyReports = useMemo(() => {
    const keyword = searchTerm.toLowerCase();

    return dailyReports.filter((report) => {
      const projectName = report.projects?.project_name || "";
      const customerName = report.projects?.customers?.customer_name || "";
      const siteName = report.project_sites?.site_name || "";
      const areaName = report.project_areas?.area_name || "";
      const workOrderTitle = report.work_orders?.title || "";

      return (
        report.report_date?.toLowerCase().includes(keyword) ||
        report.weather_condition?.toLowerCase().includes(keyword) ||
        report.work_completed?.toLowerCase().includes(keyword) ||
        projectName.toLowerCase().includes(keyword) ||
        customerName.toLowerCase().includes(keyword) ||
        siteName.toLowerCase().includes(keyword) ||
        areaName.toLowerCase().includes(keyword) ||
        workOrderTitle.toLowerCase().includes(keyword)
      );
    });
  }, [dailyReports, searchTerm]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <CalendarDays className="h-8 w-8 text-red-600" />
            <h1 className="text-3xl font-bold text-slate-900">
              Daily Reports
            </h1>
          </div>
          <p className="text-slate-500 mt-1">
            Record site progress, labour count, weather, and daily issues.
          </p>
        </div>

        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl shadow-lg shadow-red-200 transition-all flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Report
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search by date, project, site, area, work order..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-12 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500 px-4 py-3 border-b gap-3">
          <div className="col-span-1">Date</div>
          <div className="col-span-2">Project</div>
          <div className="col-span-2">Site / Area</div>
          <div className="col-span-2">Work Order</div>
          <div className="col-span-1">Weather</div>
          <div className="col-span-1">Workers</div>
          <div className="col-span-1">Progress</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1">Action</div>
        </div>

        {filteredDailyReports.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No daily reports found.
          </div>
        ) : (
          filteredDailyReports.map((report) => (
            <div
              key={report.report_id}
              className="grid grid-cols-12 px-4 py-4 border-b last:border-b-0 hover:bg-slate-50 transition-colors gap-3"
            >
              <div className="col-span-1 text-sm text-slate-700">
                {report.report_date || "-"}
              </div>

              <div className="col-span-2">
                <p className="font-medium text-slate-800">
                  {report.projects?.project_name || "-"}
                </p>
                <p className="text-xs text-slate-500">
                  {report.projects?.project_no || "-"} ·{" "}
                  {report.projects?.customers?.customer_name || "-"}
                </p>
              </div>

              <div className="col-span-2 text-slate-700">
                <p>{report.project_sites?.site_name || "-"}</p>
                <p className="text-xs text-slate-500">
                  {report.project_areas?.area_name || "-"}
                </p>
              </div>

              <div className="col-span-2 text-slate-700">
                <p>{report.work_orders?.title || "-"}</p>
                <p className="text-xs text-slate-500">
                  {report.work_orders?.work_order_no || "-"} ·{" "}
                  {report.work_orders?.status || "-"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Activities:{" "}
                  {report.daily_report_activities?.length
                    ? report.daily_report_activities
                      .map((item) => item.work_activity_types?.activity_name)
                      .filter(Boolean)
                      .join(", ")
                    : "-"}
                </p>
              </div>

              <div className="col-span-1 text-slate-700">
                {report.weather_condition || "-"}
              </div>

              <div className="col-span-1 text-slate-700">
                {report.workers_count ?? "-"}
              </div>

              <div className="col-span-1 text-slate-700">
                <p>
                  {report.progress_percent ?? "-"}%
                </p>
                <p className="text-xs text-slate-500">
                  {report.completed_quantity ?? 0} /{" "}
                  {report.project_areas?.estimated_quantity ?? 0}{" "}
                  {report.project_areas?.unit_of_measure || ""}
                </p>
              </div>

              <div className="col-span-1 text-slate-700">
                {report.approval_status || "-"}
                <p className="text-xs text-slate-500">
                  Photos:{" "}
                  {report.daily_report_photos?.filter((photo) => !photo.is_deleted).length || 0}
                </p>
              </div>

              <div className="col-span-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/daily-reports/${report.report_id}`)}
                >
                  View
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Daily Report</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
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
            <div className="col-span-2 space-y-2">
              <Label>Work Activities *</Label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded-xl border border-slate-200 p-3">
                {activityTypes.map((activity) => {
                  const checked = selectedActivityTypeIds.includes(
                    activity.activity_type_id
                  );

                  return (
                    <label
                      key={activity.activity_type_id}
                      className="flex items-center gap-2 text-sm text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedActivityTypeIds((current) => [
                              ...current,
                              activity.activity_type_id,
                            ]);
                            return;
                          }

                          setSelectedActivityTypeIds((current) =>
                            current.filter(
                              (activityTypeId) =>
                                activityTypeId !== activity.activity_type_id
                            )
                          );
                        }}
                      />
                      <span>{activity.activity_name}</span>
                    </label>
                  );
                })}
              </div>

              <p className="text-xs text-slate-500">
                Select one or more activities completed today.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Report Date *</Label>
              <Input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Weather</Label>
              <Select
                value={weatherCondition}
                onValueChange={setWeatherCondition}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select weather" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fine">Fine</SelectItem>
                  <SelectItem value="Cloudy">Cloudy</SelectItem>
                  <SelectItem value="Rain">Rain</SelectItem>
                  <SelectItem value="Storm">Storm</SelectItem>
                  <SelectItem value="Hot">Hot</SelectItem>
                  <SelectItem value="Cold">Cold</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <Label>Labour Records *</Label>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setLabourRecords((current) => [
                      ...current,
                      {
                        employee_id: "",
                        activity_type_id: "",
                        regular_hours: "8",
                        overtime_hours: "0",
                        completed_quantity: "0",
                        worker_role: "",
                        notes: "",
                      },
                    ])
                  }
                >
                  + Add Worker
                </Button>
              </div>

              <div className="space-y-3">
                {labourRecords.map((record, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 rounded-xl border border-slate-200 p-3"
                  >
                    <div className="md:col-span-3 space-y-1">
                      <Label>Employee</Label>
                      <Select
                        value={record.employee_id}
                        onValueChange={(value) => {
                          setLabourRecords((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, employee_id: value }
                                : item
                            )
                          );
                        }}
                      >
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

                    <div className="md:col-span-3 space-y-1">
                      <Label>Activity</Label>
                      <Select
                        value={record.activity_type_id}
                        onValueChange={(value) => {
                          setLabourRecords((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, activity_type_id: value }
                                : item
                            )
                          );
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select activity" />
                        </SelectTrigger>
                        <SelectContent>
                          {activityTypes.map((activity) => (
                            <SelectItem
                              key={activity.activity_type_id}
                              value={activity.activity_type_id}
                            >
                              {activity.activity_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-1 space-y-1">
                      <Label>Hours</Label>
                      <Input
                        type="number"
                        min="0"
                        value={record.regular_hours}
                        onChange={(e) => {
                          setLabourRecords((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, regular_hours: e.target.value }
                                : item
                            )
                          );
                        }}
                      />
                    </div>

                    <div className="md:col-span-1 space-y-1">
                      <Label>OT</Label>
                      <Input
                        type="number"
                        min="0"
                        value={record.overtime_hours}
                        onChange={(e) => {
                          setLabourRecords((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, overtime_hours: e.target.value }
                                : item
                            )
                          );
                        }}
                      />
                    </div>

                    <div className="md:col-span-1 space-y-1">
                      <Label>Qty</Label>
                      <Input
                        type="number"
                        min="0"
                        value={record.completed_quantity}
                        onChange={(e) => {
                          setLabourRecords((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, completed_quantity: e.target.value }
                                : item
                            )
                          );
                        }}
                      />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <Label>Role</Label>
                      <Input
                        value={record.worker_role}
                        onChange={(e) => {
                          setLabourRecords((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, worker_role: e.target.value }
                                : item
                            )
                          );
                        }}
                        placeholder="Installer"
                      />
                    </div>

                    <div className="md:col-span-1 flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={labourRecords.length === 1}
                        onClick={() =>
                          setLabourRecords((current) =>
                            current.filter((_, itemIndex) => itemIndex !== index)
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="md:col-span-12 space-y-1">
                      <Label>Notes</Label>
                      <Input
                        value={record.notes}
                        onChange={(e) => {
                          setLabourRecords((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, notes: e.target.value }
                                : item
                            )
                          );
                        }}
                        placeholder="Optional notes"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Completed Quantity Today</Label>
              <Input
                type="number"
                min="0"
                value={completedQuantity}
                onChange={(e) => setCompletedQuantity(e.target.value)}
                placeholder="e.g. 25"
              />
            </div>
            <div className="space-y-2">
              <Label>Estimated Progress %</Label>

              <Input
                value={progressPercent}
                readOnly
                className="bg-slate-50"
              />

              <p className="text-xs text-slate-500">
                Calculated from completed quantity versus estimated area quantity.
              </p>
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Work Completed</Label>
              <Textarea
                value={workCompleted}
                onChange={(e) => setWorkCompleted(e.target.value)}
                rows={3}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Issues Found</Label>
              <Textarea
                value={issuesFound}
                onChange={(e) => setIssuesFound(e.target.value)}
                rows={3}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Next Actions</Label>
              <Textarea
                value={nextActions}
                onChange={(e) => setNextActions(e.target.value)}
                rows={3}
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
            <div className="col-span-2 space-y-2">
              <Label>Photos</Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setPhotoFiles(files);
                }}
              />
              <p className="text-xs text-slate-500">
                {photoFiles.length > 0
                  ? `${photoFiles.length} photo(s) selected`
                  : "No photos selected"}
              </p>
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Photo Caption</Label>
              <Input
                value={photoCaption}
                onChange={(e) => setPhotoCaption(e.target.value)}
                placeholder="Optional caption for uploaded photos"
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
              onClick={() => createDailyReport.mutate()}
              disabled={createDailyReport.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {createDailyReport.isPending ? "Saving..." : "Save Report"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DailyReports;