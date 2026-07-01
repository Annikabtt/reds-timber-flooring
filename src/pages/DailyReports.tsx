import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { MobileFormSection } from "@/components/mobile/MobileFormSection";
import { MobileWorkerCard } from "@/components/mobile/MobileWorkerCard";
import { MobileProgressSummary } from "@/components/mobile/MobileProgressSummary";
import { MobileSiteNotes } from "@/components/mobile/MobileSiteNotes";
import {
  MobilePhotoUpload,
  type PendingPhoto,
} from "@/components/mobile/MobilePhotoUpload";


type TimeStatus =
  | "Pending"
  | "Missing CheckIn-Checkout"
  | "Need Review"
  | "Approved";

type LabourRecord = {
  employee_id: string;
  work_assignment_id: string;
  activity_type_id: string;
  clock_in: string;
  clock_out: string;
  break_minutes: string;
  time_status: TimeStatus;
  regular_hours: string;
  overtime_hours: string;
  completed_quantity: string;
  worker_role: string;
  notes: string;
};

const STANDARD_WORK_HOURS = 8;
const NEED_REVIEW_HOURS_LIMIT = 12;

const createEmptyLabourRecord = (): LabourRecord => ({
  employee_id: "",
  work_assignment_id: "",
  activity_type_id: "",
  clock_in: "",
  clock_out: "",
  break_minutes: "60",
  time_status: "Pending",
  regular_hours: "0",
  overtime_hours: "0",
  completed_quantity: "0",
  worker_role: "",
  notes: "",
});
const calculateLabourTime = (record: LabourRecord): LabourRecord => {
  if (!record.clock_in || !record.clock_out) {
    return {
      ...record,
      time_status: "Missing CheckIn-Checkout",
      regular_hours: "0",
      overtime_hours: "0",
    };
  }

  const [clockInHour, clockInMinute] = record.clock_in.split(":").map(Number);
  const [clockOutHour, clockOutMinute] = record.clock_out.split(":").map(Number);

  const clockInMinutes = clockInHour * 60 + clockInMinute;
  const clockOutMinutes = clockOutHour * 60 + clockOutMinute;

  if (clockOutMinutes <= clockInMinutes) {
    return {
      ...record,
      time_status: "Need Review",
      regular_hours: "0",
      overtime_hours: "0",
    };
  }

  const breakMinutes = Math.max(Number(record.break_minutes || 0), 0);
  const totalHours = Math.max(
    (clockOutMinutes - clockInMinutes - breakMinutes) / 60,
    0
  );

  const regularHours = Math.min(totalHours, STANDARD_WORK_HOURS);
  const overtimeHours = Math.max(totalHours - STANDARD_WORK_HOURS, 0);

  return {
    ...record,
    time_status:
      totalHours > NEED_REVIEW_HOURS_LIMIT ? "Need Review" : "Pending",
    regular_hours: regularHours.toFixed(2),
    overtime_hours: overtimeHours.toFixed(2),
  };
};

const DailyReports = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const workOrderIdFromUrl = searchParams.get("workOrderId");

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProjectId, setFilterProjectId] = useState("all");
  const [filterSiteId, setFilterSiteId] = useState("all");
  const [filterAreaId, setFilterAreaId] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showLatestOnly, setShowLatestOnly] = useState(false);
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
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);

  // ใช้ชั่วคราวระหว่างการ Refactor
  const photoFiles = pendingPhotos.map((photo) => photo.file);
  const photoCaption = "";
  const setPhotoCaption = () => { };
  const [selectedActivityTypeIds, setSelectedActivityTypeIds] = useState<string[]>([]);
  const [openWorkerCardIndexes, setOpenWorkerCardIndexes] = useState<number[]>([0]);
  const [labourRecords, setLabourRecords] = useState<LabourRecord[]>([
    createEmptyLabourRecord(),
  ]);

  const addLabourRecord = () => {
    setLabourRecords((prev) => {
      const nextIndex = prev.length;
      setOpenWorkerCardIndexes((current) => [...current, nextIndex]);
      return [...prev, createEmptyLabourRecord()];
    });
  };

  const removeLabourRecord = (index: number) => {
    setLabourRecords((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLabourRecord = (
    index: number,
    field: keyof LabourRecord,
    value: string
  ) => {
    setLabourRecords((prev) =>
      prev.map((record, i) => {
        if (i !== index) return record;

        const updatedRecord = {
          ...record,
          [field]: value,
        };

        if (
          field === "clock_in" ||
          field === "clock_out" ||
          field === "break_minutes"
        ) {
          return calculateLabourTime(updatedRecord);
        }

        return updatedRecord;
      })
    );
  };

  const getWorkerCompletionStatus = (record: LabourRecord) => {
    if (!record.employee_id && !record.activity_type_id && !record.clock_in) {
      return {
        label: "Not Started",
        className: "bg-slate-100 text-slate-600 border-slate-200",
      };
    }

    if (record.clock_in && !record.clock_out) {
      return {
        label: "Missing Check Out",
        className: "bg-red-100 text-red-700 border-red-200",
      };
    }

    if (
      record.employee_id &&
      record.activity_type_id &&
      record.clock_in &&
      record.clock_out
    ) {
      return {
        label: "Complete",
        className: "bg-green-100 text-green-700 border-green-200",
      };
    }

    return {
      label: "In Progress",
      className: "bg-amber-100 text-amber-700 border-amber-200",
    };
  };

  const getTimeStatusClass = (status: TimeStatus) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-700 border-green-200";
      case "Need Review":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "Missing CheckIn-Checkout":
        return "bg-red-100 text-red-700 border-red-200";
      case "Pending":
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

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
        status,
        work_assignments (
          work_assignment_id,
          employee_id,
          project_id,
          site_id,
          area_id,
          work_order_id,
          assigned_date,
          assigned_at,
          ended_date,
          ended_at,
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
          daily_report_workers (
            daily_report_worker_id,
            employee_id,
            regular_hours,
            overtime_hours,
            completed_quantity
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
  const filterSites = useMemo(() => {
    if (filterProjectId === "all") return sites;
    return sites.filter((site) => site.project_id === filterProjectId);
  }, [sites, filterProjectId]);

  const filterAreas = useMemo(() => {
    return areas.filter((area) => {
      const matchProject =
        filterProjectId === "all" || area.project_id === filterProjectId;
      const matchSite = filterSiteId === "all" || area.site_id === filterSiteId;

      return matchProject && matchSite;
    });
  }, [areas, filterProjectId, filterSiteId]);

  const selectedProject = useMemo(() => {
    return projects.find((project) => project.project_id === projectId);
  }, [projects, projectId]);

  const selectedSite = useMemo(() => {
    return sites.find((site) => site.site_id === siteId);
  }, [sites, siteId]);

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

  useEffect(() => {
    if (!workOrderIdFromUrl) return;

    setShowAddDialog(true);

  }, [workOrderIdFromUrl]);

  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter(
      (workOrder) =>
        workOrder.project_id === projectId &&
        workOrder.site_id === siteId &&
        workOrder.area_id === areaId
    );
  }, [workOrders, projectId, siteId, areaId]);

  const selectedWorkOrder = useMemo(() => {
    if (!workOrderIdFromUrl) return null;

    return (
      workOrders.find(
        (workOrder) =>
          workOrder.work_order_id === workOrderIdFromUrl
      ) || null
    );

  }, [workOrders, workOrderIdFromUrl]);

  const selectedWorkOrderForForm = useMemo(() => {
    return (
      workOrders.find((workOrder) => workOrder.work_order_id === workOrderId) ||
      selectedWorkOrder ||
      null
    );
  }, [workOrders, workOrderId, selectedWorkOrder]);

  useEffect(() => {
    if (!selectedWorkOrder) return;

    setProjectId(selectedWorkOrder.project_id || "");
    setSiteId(selectedWorkOrder.site_id || "");
    setAreaId(selectedWorkOrder.area_id || "");
    setWorkOrderId(selectedWorkOrder.work_order_id || "");

    if (!reportDate) {
      setReportDate(new Date().toISOString().slice(0, 10));
    }

  }, [selectedWorkOrder, reportDate]);

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
    setPendingPhotos([]);
    setSelectedActivityTypeIds([]);
    setLabourRecords([createEmptyLabourRecord()]);
  };

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
      const timeLogRows = validLabourRecords.map((record) => ({
        report_id: createdReport.report_id,
        employee_id: record.employee_id,
        project_id: projectId,
        site_id: siteId,
        area_id: areaId,
        work_order_id: workOrderId,
        activity_type_id: record.activity_type_id,
        work_date: reportDate,
        regular_hours: Number(record.regular_hours || 0),
        overtime_hours: Number(record.overtime_hours || 0),
        break_minutes: Number(record.break_minutes || 0),
        approved: false,
        time_status: "Needs Review",
        notes: record.notes.trim() || record.worker_role.trim() || null,
        is_deleted: false,
      }));

      if (timeLogRows.length > 0) {
        const { error: timeLogInsertError } = await supabase
          .from("work_time_logs")
          .insert(timeLogRows);

        if (timeLogInsertError) throw timeLogInsertError;
      }

      let uploadedPhotoCount = 0;
      let failedPhotoCount = 0;

      if (pendingPhotos.length > 0) {
        for (const photo of pendingPhotos) {
          setPendingPhotos((prev) =>
            prev.map((item) =>
              item.id === photo.id
                ? { ...item, status: "uploading", error: "" }
                : item
            )
          );

          try {
            const fileExt = photo.file.name.split(".").pop();

            const fileName =
              `${createdReport.report_id}/${crypto.randomUUID()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
              .from("daily-report-photos")
              .upload(fileName, photo.file);

            if (uploadError) throw uploadError;

            const { error: photoInsertError } = await supabase
              .from("daily_report_photos")
              .insert({
                report_id: createdReport.report_id,
                photo_url: fileName,
                caption: photo.caption?.trim() || null,
                taken_at: photo.takenAt
                  ? new Date(photo.takenAt).toISOString()
                  : null,
                approval_status: "Pending",
                approved_by: null,
                approved_at: null,
                rejected_reason: null,
                is_deleted: false,
              });

            if (photoInsertError) throw photoInsertError;

            uploadedPhotoCount += 1;

            setPendingPhotos((prev) =>
              prev.map((item) =>
                item.id === photo.id
                  ? { ...item, status: "uploaded", error: "" }
                  : item
              )
            );
          } catch (error) {
            failedPhotoCount += 1;

            setPendingPhotos((prev) =>
              prev.map((item) =>
                item.id === photo.id
                  ? {
                    ...item,
                    status: "uploaded",
                    error:
                      error instanceof Error
                        ? error.message
                        : "Photo upload failed.",
                  }
                  : item
              )
            );
          }
        }
      }

      return {
        uploadedPhotoCount,
        failedPhotoCount,
      };

    },
    onSuccess: (result) => {

      if (result.failedPhotoCount > 0) {
        toast.warning(
          `Daily report saved. ${result.uploadedPhotoCount} photo(s) uploaded, ${result.failedPhotoCount} failed.`
        );
      } else {
        toast.success("Daily report submitted and time logs created for review.");
      }
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

    let reports = dailyReports.filter((report) => {
      const projectName = report.projects?.project_name || "";
      const customerName = report.projects?.customers?.customer_name || "";
      const siteName = report.project_sites?.site_name || "";
      const areaName = report.project_areas?.area_name || "";
      const workOrderTitle = report.work_orders?.title || "";

      const matchKeyword =
        !keyword ||
        report.report_date?.toLowerCase().includes(keyword) ||
        report.weather_condition?.toLowerCase().includes(keyword) ||
        report.work_completed?.toLowerCase().includes(keyword) ||
        projectName.toLowerCase().includes(keyword) ||
        customerName.toLowerCase().includes(keyword) ||
        siteName.toLowerCase().includes(keyword) ||
        areaName.toLowerCase().includes(keyword) ||
        workOrderTitle.toLowerCase().includes(keyword);

      const matchProject =
        filterProjectId === "all" || report.project_id === filterProjectId;
      const matchSite =
        filterSiteId === "all" || report.site_id === filterSiteId;
      const matchArea =
        filterAreaId === "all" || report.area_id === filterAreaId;
      const matchStatus =
        filterStatus === "all" || report.approval_status === filterStatus;

      return (
        matchKeyword &&
        matchProject &&
        matchSite &&
        matchArea &&
        matchStatus
      );
    });

    if (showLatestOnly) {
      const latestByArea = new Map<string, any>();

      reports.forEach((report) => {
        const key = report.area_id || report.report_id;
        const current = latestByArea.get(key);

        if (!current || report.report_date > current.report_date) {
          latestByArea.set(key, report);
        }
      });

      reports = Array.from(latestByArea.values());
    }

    return reports;
  }, [
    dailyReports,
    searchTerm,
    filterProjectId,
    filterSiteId,
    filterAreaId,
    filterStatus,
    showLatestOnly,
  ]);

  const areaSummary = useMemo(() => {
    const approvedReports = filteredDailyReports.filter(
      (report) => report.approval_status === "Approved"
    );

    const pendingReports = filteredDailyReports.filter((report) =>
      ["Submitted", "Ready for Inspection"].includes(report.approval_status || "")
    );

    const approvedProgress = approvedReports.reduce(
      (sum, report) => sum + Number(report.completed_quantity || 0),
      0
    );

    const pendingReview = pendingReports.reduce(
      (sum, report) => sum + Number(report.completed_quantity || 0),
      0
    );

    const estimatedQuantity =
      filterAreaId !== "all"
        ? Number(
          areas.find((area) => area.area_id === filterAreaId)
            ?.estimated_quantity || 0
        )
        : 0;

    const latestReport = filteredDailyReports[0]?.report_date || "-";

    return {
      approvedProgress,
      pendingReview,
      estimatedQuantity,
      remaining: Math.max(estimatedQuantity - approvedProgress, 0),
      latestReport,
      pendingReports: pendingReports.length,
    };
  }, [filteredDailyReports, areas, filterAreaId]);

  const groupedDailyReports = useMemo(() => {
    const groups = new Map<string, any[]>();

    filteredDailyReports.forEach((report) => {
      const key = report.area_id || "no-area";

      if (!groups.has(key)) {
        groups.set(key, []);
      }

      groups.get(key)?.push(report);
    });

    return Array.from(groups.entries()).map(([areaKey, reports]) => {
      const firstReport = reports[0];

      const approvedProgress = reports
        .filter((report) => report.approval_status === "Approved")
        .reduce(
          (sum, report) => sum + Number(report.completed_quantity || 0),
          0
        );

      const pendingProgress = reports
        .filter((report) =>
          ["Submitted", "Ready for Inspection"].includes(
            report.approval_status || ""
          )
        )

        .reduce(
          (sum, report) => sum + Number(report.completed_quantity || 0),
          0
        );

      const estimatedQuantity = Number(
        firstReport?.project_areas?.estimated_quantity || 0
      );

      return {
        areaKey,
        reports,
        areaName: firstReport?.project_areas?.area_name || "-",
        areaCode: firstReport?.project_areas?.area_code || "-",
        siteName: firstReport?.project_sites?.site_name || "-",
        unitOfMeasure: firstReport?.project_areas?.unit_of_measure || "sqm",
        approvedProgress,
        pendingProgress,
        remaining: Math.max(estimatedQuantity - approvedProgress, 0),
        latestReport: reports[0]?.report_date || "-",
        reportCount: reports.length,
      };
    });
  }, [filteredDailyReports]);
  const getApprovalStatusClass = (status?: string | null) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-700 border-green-200";
      case "Submitted":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Ready for Inspection":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "Rejected":
        return "bg-red-100 text-red-700 border-red-200";
      case "Draft":
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-slate-100 text-slate-500 border-slate-200";
    }

  };
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50">
              <CalendarDays className="h-6 w-6 text-red-600" />
            </div>

            <div className="min-w-0">
              <h1 className="text-2xl font-black leading-tight text-slate-900 md:text-3xl">
                Daily Progress Review
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Record site progress, labour, weather, and issues.
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={() => setShowAddDialog(true)}
          className="h-11 w-full rounded-xl bg-red-600 px-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-red-700 md:w-auto md:px-6"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Report
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-4 md:p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <Select
            value={filterProjectId}
            onValueChange={(value) => {
              setFilterProjectId(value);
              setFilterSiteId("all");
              setFilterAreaId("all");
            }}
          >
            <SelectTrigger className="h-11 rounded-xl text-base md:text-sm">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.project_id} value={project.project_id}>
                  {project.project_no || "-"} - {project.project_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterSiteId}
            onValueChange={(value) => {
              setFilterSiteId(value);
              setFilterAreaId("all");
            }}
          >
            <SelectTrigger className="h-11 rounded-xl text-base md:text-sm">
              <SelectValue placeholder="Site" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sites</SelectItem>
              {filterSites.map((site) => (
                <SelectItem key={site.site_id} value={site.site_id}>
                  {site.site_code || "-"} - {site.site_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterAreaId} onValueChange={setFilterAreaId}>
            <SelectTrigger className="h-11 rounded-xl text-base md:text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              {filterAreas.map((area) => (
                <SelectItem key={area.area_id} value={area.area_id}>
                  {area.area_code || "-"} - {area.area_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-11 rounded-xl text-base md:text-sm">
              <SelectValue placeholder="Area" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Submitted">Submitted</SelectItem>
              <SelectItem value="Ready for Inspection">
                Ready for Inspection
              </SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={showLatestOnly}
              onChange={(e) => setShowLatestOnly(e.target.checked)}
            />
            Show latest only
          </label>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search by date, project, site, area, work order..."
            className="h-11 rounded-xl pl-10 text-base md:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">
                Area Progress Summary
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Approved, pending review, Remaining From Estimate, and latest report status.
              </p>
            </div>

            <div className="text-sm text-slate-500">
              Latest Report:{" "}
              <span className="font-semibold text-slate-900">
                {areaSummary.latestReport}
              </span>
            </div>
          </div>

          {filterAreaId === "all" ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">
                Select an area to view area-level progress.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                The list below is currently showing reports across all selected areas.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-500">
                    Approved Progress
                  </p>
                  <p className="mt-2 text-lg font-black text-slate-900">
                    {areaSummary.approvedProgress.toFixed(2)} sqm
                  </p>
                </div>

                <div className="rounded-xl bg-amber-50 p-3">
                  <p className="text-xs font-medium text-amber-700">
                    Pending Review
                  </p>
                  <p className="mt-2 text-lg font-black text-amber-700">
                    {areaSummary.pendingReview.toFixed(2)} sqm
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-500">
                    Pending Reports
                  </p>
                  <p className="mt-2 text-lg font-black text-slate-900">
                    {areaSummary.pendingReports}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-4 max-w-3xl">
                <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                  <span>Approved Progress</span>
                  <span className="font-semibold text-slate-900">
                    {areaSummary.estimatedQuantity > 0
                      ? `${Math.min(
                        (areaSummary.approvedProgress /
                          areaSummary.estimatedQuantity) *
                        100,
                        100
                      ).toFixed(2)}%`
                      : "0.00%"}
                  </span>
                </div>

                <div className="mt-2 h-3 w-full rounded-full bg-slate-200">
                  <div
                    className="h-3 rounded-full bg-red-600"
                    style={{
                      width: `${areaSummary.estimatedQuantity > 0
                        ? Math.min(
                          (areaSummary.approvedProgress /
                            areaSummary.estimatedQuantity) *
                          100,
                          100
                        )
                        : 0
                        }%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Approved Progress
                  </p>
                  <p className="mt-2 text-xl font-black text-slate-900">
                    {areaSummary.approvedProgress.toFixed(2)} sqm
                  </p>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-medium text-amber-700">
                    Pending Review
                  </p>
                  <p className="mt-2 text-xl font-black text-amber-700">
                    {areaSummary.pendingReview.toFixed(2)} sqm
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Remaining
                  </p>
                  <p className="mt-2 text-xl font-black text-slate-900">
                    {areaSummary.remaining.toFixed(2)} sqm
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Estimated Quantity
                  </p>
                  <p className="mt-2 text-xl font-black text-slate-900">
                    {areaSummary.estimatedQuantity.toFixed(2)} sqm
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Pending Reports
                  </p>
                  <p className="mt-2 text-xl font-black text-slate-900">
                    {areaSummary.pendingReports}
                  </p>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Desktop table header */}
        <div className="hidden grid-cols-12 gap-3 border-b bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 xl:grid">
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
          groupedDailyReports.map((group) => (
            <div key={group.areaKey} className="border-b last:border-b-0">
              <div className="border-b bg-slate-100 px-4 py-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-bold text-slate-900">
                      {group.areaCode} - {group.areaName}
                    </p>
                    <p className="text-xs text-slate-500">
                      Site: {group.siteName} · Reports: {group.reportCount} · Latest:{" "}
                      {group.latestReport}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="text-slate-500">Approved</p>
                      <p className="font-bold text-slate-900">
                        {group.approvedProgress.toFixed(2)} {group.unitOfMeasure}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Pending</p>
                      <p className="font-bold text-amber-700">
                        {group.pendingProgress.toFixed(2)} {group.unitOfMeasure}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Remaining</p>
                      <p className="font-bold text-slate-900">
                        {group.remaining.toFixed(2)} {group.unitOfMeasure}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {group.reports.map((report) => (
                <div key={report.report_id}>
                  {/* Mobile card */}
                  <div className="space-y-4 border-b px-4 py-4 last:border-b-0 xl:hidden">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900">
                          {report.report_date || "-"}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {report.projects?.project_name || "-"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {report.projects?.project_no || "-"} ·{" "}
                          {report.projects?.customers?.customer_name || "-"}
                        </p>
                      </div>

                      <span
                        className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${getApprovalStatusClass(
                          report.approval_status
                        )}`}
                      >
                        {report.approval_status || "-"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">Weather</p>
                        <p className="mt-1 font-medium text-slate-900">
                          {report.weather_condition || "-"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">Workers</p>
                        <p className="mt-1 font-medium text-slate-900">
                          {report.daily_report_workers?.length
                            ? new Set(
                              report.daily_report_workers.map(
                                (worker) => worker.employee_id
                              )
                            ).size
                            : report.workers_count ?? "-"}{" "}
                          workers
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="text-xs text-slate-500">Work Order</p>
                      <p className="mt-1 font-medium text-slate-900">
                        {report.work_orders?.title || "-"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {report.work_orders?.work_order_no || "-"} ·{" "}
                        {report.work_orders?.status || "-"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="text-xs text-slate-500">Work Completed</p>
                      <p className="mt-1 text-sm text-slate-800">
                        {report.work_completed || "No work summary"}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        Issues: {report.issues_found || "-"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs text-slate-500">Progress</p>
                          <p className="mt-1 text-base font-bold text-slate-900">
                            {Number(report.progress_percent || 0).toFixed(2)}%
                          </p>
                        </div>

                        <div className="text-right text-xs text-slate-500">
                          {Number(report.completed_quantity || 0).toFixed(2)} /{" "}
                          {Number(
                            report.project_areas?.estimated_quantity || 0
                          ).toFixed(2)}{" "}
                          {report.project_areas?.unit_of_measure || ""}
                        </div>
                      </div>

                      <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-red-600"
                          style={{
                            width: `${Math.min(
                              Number(report.progress_percent || 0),
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">Hours</p>
                        <p className="mt-1 font-medium text-slate-900">
                          {report.daily_report_workers?.length
                            ? report.daily_report_workers
                              .reduce(
                                (sum, worker) =>
                                  sum +
                                  Number(worker.regular_hours || 0) +
                                  Number(worker.overtime_hours || 0),
                                0
                              )
                              .toFixed(2)
                            : "0.00"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">Photos</p>
                        <p className="mt-1 font-medium text-slate-900">
                          {report.daily_report_photos?.filter(
                            (photo) => !photo.is_deleted
                          ).length || 0}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="h-11 w-full rounded-xl"
                      onClick={() => navigate(`/daily-reports/${report.report_id}`)}
                    >
                      View Report
                    </Button>
                  </div>

                  {/* Desktop row */}
                  <div className="hidden grid-cols-12 gap-3 border-b px-4 py-4 transition-colors hover:bg-slate-50 last:border-b-0 xl:grid">
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
                      <p className="font-medium text-slate-800">
                        {report.work_completed || "No work summary"}
                      </p>
                      <p className="text-xs text-slate-500">
                        Issues: {report.issues_found || "-"}
                      </p>
                    </div>

                    <div className="col-span-2 text-slate-700">
                      <p>{report.work_orders?.title || "-"}</p>
                      <p className="text-xs text-slate-500">
                        {report.work_orders?.work_order_no || "-"} ·{" "}
                        {report.work_orders?.status || "-"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
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
                      <p>
                        {report.daily_report_workers?.length
                          ? new Set(
                            report.daily_report_workers.map(
                              (worker) => worker.employee_id
                            )
                          ).size
                          : report.workers_count ?? "-"}{" "}
                        workers
                      </p>

                      <p className="text-xs text-slate-500">
                        Hours:{" "}
                        {report.daily_report_workers?.length
                          ? report.daily_report_workers
                            .reduce(
                              (sum, worker) =>
                                sum +
                                Number(worker.regular_hours || 0) +
                                Number(worker.overtime_hours || 0),
                              0
                            )
                            .toFixed(2)
                          : "0.00"}
                      </p>

                      <p className="text-xs text-slate-500">
                        Qty:{" "}
                        {report.daily_report_workers?.length
                          ? report.daily_report_workers
                            .reduce(
                              (sum, worker) =>
                                sum + Number(worker.completed_quantity || 0),
                              0
                            )
                            .toFixed(2)
                          : "0.00"}
                      </p>
                    </div>

                    <div className="col-span-1 text-slate-700">
                      <p className="font-semibold text-slate-900">
                        {Number(report.progress_percent || 0).toFixed(2)}%
                      </p>

                      <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-red-600"
                          style={{
                            width: `${Math.min(
                              Number(report.progress_percent || 0),
                              100
                            )}%`,
                          }}
                        />
                      </div>

                      <p className="mt-2 text-xs text-slate-500">
                        {Number(report.completed_quantity || 0).toFixed(2)} /{" "}
                        {Number(
                          report.project_areas?.estimated_quantity || 0
                        ).toFixed(2)}{" "}
                        {report.project_areas?.unit_of_measure || ""}
                      </p>
                    </div>

                    <div className="col-span-1 text-slate-700">
                      <span
                        className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${getApprovalStatusClass(
                          report.approval_status
                        )}`}
                      >
                        {report.approval_status || "-"}
                      </span>

                      <p className="mt-2 text-xs text-slate-500">
                        Photos:{" "}
                        {report.daily_report_photos?.filter(
                          (photo) => !photo.is_deleted
                        ).length || 0}
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
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>

        <DialogContent className="max-h-[92vh] w-[calc(100vw-24px)] max-w-4xl overflow-y-auto rounded-2xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Add Daily Report
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <MobileFormSection title="Project Information">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="space-y-3">
                  <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                      WORK ORDER
                    </p>

                    <p className="mt-1 text-xl font-black text-slate-900">
                      {selectedWorkOrderForForm?.work_order_no || "-"}
                    </p>

                    <p className="mt-2 text-base font-bold text-slate-900">
                      {selectedProject?.project_name || "-"}
                    </p>

                    <div className="mt-3 space-y-2">

                      <div className="flex gap-3">
                        <p className="w-24 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Site
                        </p>

                        <p className="text-sm font-semibold text-slate-900">
                          {selectedSite?.site_name || "-"}
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <p className="w-24 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Area
                        </p>

                        <p className="text-sm font-semibold text-slate-900">
                          {selectedArea?.area_name || "-"}
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <p className="w-24 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Activity
                        </p>

                        <p className="text-sm font-semibold text-slate-900">
                          {selectedWorkOrderForForm?.title || "-"}
                        </p>
                      </div>

                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Project
                      </p>
                      <p className="mt-1 text-base font-bold text-slate-900">
                        {selectedProject?.project_name || "-"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {selectedProject?.customers?.customer_name || "-"}
                      </p>
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="space-y-3">

                          <div className="flex flex-col gap-1 md:flex-row">
                            <p className="w-32 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Site
                            </p>

                            <p className="font-semibold text-slate-900">
                              {selectedSite?.site_code || "-"} - {selectedSite?.site_name || "-"}
                            </p>
                          </div>

                          <div className="flex flex-col gap-1 md:flex-row">
                            <p className="w-32 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Area
                            </p>

                            <p className="font-semibold text-slate-900">
                              {selectedArea?.area_code || "-"} - {selectedArea?.area_name || "-"}
                            </p>
                          </div>

                          <div className="flex flex-col gap-1 md:flex-row">
                            <p className="w-32 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Work Order
                            </p>

                            <p className="font-semibold text-slate-900">
                              {selectedWorkOrderForForm?.title || "-"}
                            </p>
                          </div>

                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </MobileFormSection>
          </div>

          <MobileFormSection title="Report Date / Weather">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Report Date *</Label>
                <Input
                  className="h-11 rounded-xl text-base md:text-sm"
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
                  <SelectTrigger className="h-11 rounded-xl text-base md:text-sm">
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
            </div>
          </MobileFormSection>

          <MobileFormSection title="Worker Cards">
            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Label>Worker Cards *</Label>

                <Button
                  type="button"
                  variant="outline"
                  onClick={addLabourRecord}
                  className="h-11 w-full rounded-xl text-sm font-semibold sm:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  Add Additional Worker
                </Button>
              </div>

              {labourRecords.map((record, index) => {
                const workerStatus = getWorkerCompletionStatus(record);
                const isOpen = openWorkerCardIndexes.includes(index);
                const isAssignedWorker = index === 0;

                const selectedEmployee = employees.find(
                  (employee) => employee.employee_id === record.employee_id
                );

                const workerName =
                  selectedEmployee?.display_name ||
                  `${selectedEmployee?.first_name || ""} ${selectedEmployee?.last_name || ""}`.trim() ||
                  "Select worker";

                return (
                  <div
                    key={index}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setOpenWorkerCardIndexes((current) =>
                          current.includes(index)
                            ? current.filter((item) => item !== index)
                            : [...current, index]
                        );
                      }}
                      className="flex w-full flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-left sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-slate-900">
                            Worker #{index + 1}
                          </p>

                          <p className="text-sm font-semibold text-slate-700">
                            {workerName}
                          </p>

                          <span
                            className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${workerStatus.className}`}
                          >
                            {workerStatus.label}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-slate-500">
                          {isAssignedWorker
                            ? "Assigned From Work Order"
                            : "Additional Worker - Needs Review"}
                        </p>
                      </div>

                      <span className="text-xs font-semibold text-slate-500">
                        {isOpen ? "Hide Details" : "Show Details"}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="space-y-4 p-4">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Employee</Label>
                            <Select
                              value={record.employee_id}
                              onValueChange={(value) =>
                                updateLabourRecord(index, "employee_id", value)
                              }
                            >
                              <SelectTrigger className="h-11 rounded-xl text-base md:text-sm">
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
                            <Label>Activity</Label>
                            <Select
                              value={record.activity_type_id}
                              onValueChange={(value) =>
                                updateLabourRecord(index, "activity_type_id", value)
                              }
                            >
                              <SelectTrigger className="h-11 rounded-xl text-base md:text-sm">
                                <SelectValue placeholder="Select activity" />
                              </SelectTrigger>
                              <SelectContent>
                                {activityTypes.map((activityType) => (
                                  <SelectItem
                                    key={activityType.activity_type_id}
                                    value={activityType.activity_type_id}
                                  >
                                    {activityType.activity_code || "-"} -{" "}
                                    {activityType.activity_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 p-3">
                          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                            Regular Time
                          </p>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="space-y-2">
                              <Label>Check In</Label>
                              <Input
                                type="time"
                                value={record.clock_in}
                                onChange={(e) =>
                                  updateLabourRecord(index, "clock_in", e.target.value)
                                }
                                className="h-11 rounded-xl text-base md:text-sm"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Check Out</Label>
                              <Input
                                type="time"
                                value={record.clock_out}
                                onChange={(e) =>
                                  updateLabourRecord(index, "clock_out", e.target.value)
                                }
                                className="h-11 rounded-xl text-base md:text-sm"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Break Minutes</Label>
                              <Input
                                type="number"
                                inputMode="numeric"
                                min="0"
                                value={record.break_minutes}
                                onChange={(e) =>
                                  updateLabourRecord(index, "break_minutes", e.target.value)
                                }
                                placeholder="60"
                                className="h-11 rounded-xl text-base md:text-sm"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div className="space-y-2">
                            <Label>Regular Hours</Label>
                            <Input
                              value={record.regular_hours}
                              readOnly
                              className="h-11 rounded-xl bg-slate-50 text-base md:text-sm"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>OT Hours</Label>
                            <Input
                              value={record.overtime_hours}
                              readOnly
                              className="h-11 rounded-xl bg-slate-50 text-base md:text-sm"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Time Status</Label>
                            <div
                              className={`flex h-11 items-center rounded-xl border px-3 text-sm font-semibold ${getTimeStatusClass(
                                record.time_status
                              )}`}
                            >
                              {record.time_status}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Qty Completed</Label>
                          <Input
                            type="number"
                            inputMode="decimal"
                            value={record.completed_quantity}
                            onChange={(e) =>
                              updateLabourRecord(index, "completed_quantity", e.target.value)
                            }
                            placeholder="0"
                            className="h-11 rounded-xl text-base md:text-sm"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Worker Notes</Label>
                          <textarea
                            value={record.notes}
                            onChange={(e) =>
                              updateLabourRecord(index, "notes", e.target.value)
                            }
                            placeholder="Worker notes..."
                            className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-base outline-none focus:border-red-300 md:text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </MobileFormSection>

          <MobileFormSection title="Site Notes">
            <MobileSiteNotes
              workCompleted={workCompleted}
              issuesFound={issuesFound}
              nextActions={nextActions}
              notes={notes}
              setWorkCompleted={setWorkCompleted}
              setIssuesFound={setIssuesFound}
              setNextActions={setNextActions}
              setNotes={setNotes}
            />
          </MobileFormSection>
          <MobilePhotoUpload
            pendingPhotos={pendingPhotos}
            setPendingPhotos={setPendingPhotos}
          />
          <div className="sticky bottom-0 -mx-4 mt-4 border-t bg-white px-4 py-3 sm:static sm:mx-0 sm:flex sm:justify-end sm:gap-2 sm:border-t-0 sm:bg-transparent sm:px-0 sm:py-0">
            <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false);
                  resetForm();
                }}
                disabled={createDailyReport.isPending}
                className="h-11 w-full sm:w-auto"
              >
                Cancel
              </Button>

              <Button
                onClick={() => createDailyReport.mutate()}
                disabled={createDailyReport.isPending}
                className="h-11 w-full bg-red-600 text-white hover:bg-red-700 sm:w-auto"
              >
                {createDailyReport.isPending ? "Saving..." : "Save Report"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog >
    </div >
  );
};

export default DailyReports;