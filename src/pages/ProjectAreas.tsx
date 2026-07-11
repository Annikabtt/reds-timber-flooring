import { useMemo, useState } from "react";
import {
  FileDown,
  FileSpreadsheet,
  Layers3,
  Plus,
  Printer,
  Search,
} from "lucide-react";
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
import { ActiveStatusBadge } from "@/components/common/ActiveStatusBadge";
import { StandardActions } from "@/components/common/StandardActions";

const ProjectAreas = () => {
  const queryClient = useQueryClient();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedArea, setSelectedArea] = useState<any | null>(null);
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");

  const [projectId, setProjectId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [areaCode, setAreaCode] = useState("");
  const [areaName, setAreaName] = useState("");
  const [areaType, setAreaType] = useState("");
  const [estimatedQuantity, setEstimatedQuantity] = useState("");
  const [unitOfMeasure, setUnitOfMeasure] = useState("sqm");
  const [notes, setNotes] = useState("");

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-for-areas"],
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

        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: sites = [] } = useQuery({
    queryKey: ["sites-for-areas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_sites")
        .select(`
          site_id,
          project_id,
          site_code,
          site_name
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: areaTypes = [] } = useQuery({
    queryKey: ["project_area_types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_area_types")
        .select(`
        area_type_id,
        area_type_name,
        description,
        sort_order
      `)
        .eq("is_active", true)
        .eq("is_deleted", false)
        .order("sort_order", { ascending: true })
        .order("area_type_name", { ascending: true });

      if (error) throw error;

      return data;
    },
  });

  const { data: areaStatusRows = [] } = useQuery({
    queryKey: ["project_areas-status"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_areas")
        .select(`
          area_id,
          is_active,
          is_deleted,
          notes
        `)
        .eq("is_deleted", false);

      if (error) throw error;
      return data;
    },
  });

  const { data: areaProgressRows = [] } = useQuery({
    queryKey: ["project_area_progress_v"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_area_progress_v")
        .select(`
          area_id,
          project_id,
          site_id,
          area_code,
          area_name,
          area_type,
          estimated_quantity,
          actual_quantity,
          remaining_quantity,
          progress_percent,
          unit_of_measure,
          project_no,
          project_name,
          customer_name,
          site_code,
          site_name
        `)
        .order("area_name", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const areas = useMemo(() => {
    const statusByAreaId = new Map(
      areaStatusRows.map((row) => [row.area_id, row])
    );

    return areaProgressRows
      .map((area) => {
        const statusRow = statusByAreaId.get(area.area_id);

        return {
          ...area,
          is_active: statusRow?.is_active ?? true,
          is_deleted: statusRow?.is_deleted ?? false,
          notes: statusRow?.notes ?? null,
        };
      })
      .filter((area) => !area.is_deleted);
  }, [areaProgressRows, areaStatusRows]);

  const filteredSites = useMemo(() => {
    return sites.filter((site) => site.project_id === projectId);
  }, [sites, projectId]);

  const resetForm = () => {
    setProjectId("");
    setSiteId("");
    setAreaCode("");
    setAreaName("");
    setAreaType("");
    setEstimatedQuantity("");
    setUnitOfMeasure("sqm");
    setNotes("");
  };

  const openViewDialog = (area: any) => {
    setSelectedArea(area);
    setShowViewDialog(true);
  };

  const openAddDialog = () => {
    setEditingAreaId(null);
    resetForm();
    setShowAddDialog(true);
  };

  const openEditDialog = (area: any) => {
    setEditingAreaId(area.area_id);
    setProjectId(area.project_id || "");
    setSiteId(area.site_id || "");
    setAreaCode(area.area_code || "");
    setAreaName(area.area_name || "");
    setAreaType(area.area_type || "");
    setEstimatedQuantity(
      area.estimated_quantity !== null && area.estimated_quantity !== undefined
        ? String(area.estimated_quantity)
        : ""
    );
    setUnitOfMeasure(area.unit_of_measure || "sqm");
    setNotes(area.notes || "");
    setShowAddDialog(true);
  };

  const createArea = useMutation({
    mutationFn: async () => {
      if (!projectId) {
        throw new Error("Please select a project.");
      }

      if (!siteId) {
        throw new Error("Please select a project site.");
      }

      if (!areaName.trim()) {
        throw new Error("Please enter area name.");
      }

      const { error } = await supabase.from("project_areas").insert({
        project_id: projectId,
        site_id: siteId,
        area_name: areaName.trim(),
        area_type: areaType.trim() || null,
        estimated_quantity: estimatedQuantity
          ? Number(estimatedQuantity)
          : null,
        unit_of_measure: unitOfMeasure.trim() || null,
        notes: notes.trim() || null,
        is_active: true,
        is_deleted: false,
      });

      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Project area created successfully.");

      await queryClient.invalidateQueries({
        queryKey: ["project_area_progress_v"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["project_areas-status"],
      });

      await queryClient.refetchQueries({
        queryKey: ["project_area_progress_v"],
      });
      await queryClient.refetchQueries({
        queryKey: ["project_areas-status"],
      });

      setShowAddDialog(false);
      setEditingAreaId(null);
      resetForm();
    },
  });

  const updateArea = useMutation({
    mutationFn: async () => {
      if (!editingAreaId) {
        throw new Error("No area selected.");
      }

      if (!projectId) {
        throw new Error("Please select a project.");
      }

      if (!siteId) {
        throw new Error("Please select a project site.");
      }

      if (!areaName.trim()) {
        throw new Error("Please enter area name.");
      }

      const { error } = await supabase
        .from("project_areas")
        .update({
          project_id: projectId,
          site_id: siteId,
          area_name: areaName.trim(),
          area_type: areaType.trim() || null,
          estimated_quantity: estimatedQuantity
            ? Number(estimatedQuantity)
            : null,
          unit_of_measure: unitOfMeasure.trim() || null,
          notes: notes.trim() || null,
        })
        .eq("area_id", editingAreaId)
        .select()
        .single();

      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Project area updated successfully.");

      setShowAddDialog(false);
      setEditingAreaId(null);
      resetForm();

      await queryClient.invalidateQueries({
        queryKey: ["project_area_progress_v"]
      });

      await queryClient.refetchQueries({
        queryKey: ["project_area_progress_v"]
      });

    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  const areaSummary = useMemo(() => {
    const totalAreas = areas.length;
    const activeAreas = areas.filter((area) => area.is_active).length;
    const inactiveAreas = areas.filter((area) => !area.is_active).length;

    const totalEstimated = areas.reduce(
      (sum, area) => sum + Number(area.estimated_quantity || 0),
      0
    );

    const totalActual = areas.reduce(
      (sum, area) => sum + Number(area.actual_quantity || 0),
      0
    );

    const totalRemaining = areas.reduce(
      (sum, area) => sum + Number(area.remaining_quantity || 0),
      0
    );

    return {
      totalAreas,
      activeAreas,
      inactiveAreas,
      totalEstimated,
      totalActual,
      totalRemaining,
    };
  }, [areas]);

  const refreshProjectAreas = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["project_area_progress_v"],
    });
    await queryClient.invalidateQueries({
      queryKey: ["project_areas-status"],
    });

    await queryClient.refetchQueries({
      queryKey: ["project_area_progress_v"],
    });
    await queryClient.refetchQueries({
      queryKey: ["project_areas-status"],
    });
  };

  const setAreaActiveStatus = useMutation({
    mutationFn: async ({
      areaId,
      isActive,
    }: {
      areaId: string;
      isActive: boolean;
    }) => {
      const { error } = await supabase
        .from("project_areas")
        .update({
          is_active: isActive,
        })
        .eq("area_id", areaId)
        .eq("is_deleted", false);

      if (error) throw error;
    },
    onSuccess: async (_, variables) => {
      toast.success(
        variables.isActive
          ? "Project area reactivated successfully."
          : "Project area marked inactive successfully."
      );

      await refreshProjectAreas();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteArea = useMutation({
    mutationFn: async (areaId: string) => {
      const { error } = await supabase
        .from("project_areas")
        .update({
          is_deleted: true,
          is_active: false,
        })
        .eq("area_id", areaId);

      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Project area deleted successfully.");
      await refreshProjectAreas();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const filteredAreas = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return areas.filter((area) => {
      if (statusFilter === "active" && !area.is_active) return false;
      if (statusFilter === "inactive" && area.is_active) return false;

      const projectName = area.project_name || "";
      const customerName = area.customer_name || "";
      const siteName = area.site_name || "";

      if (!keyword) return true;

      return (
        area.area_name?.toLowerCase().includes(keyword) ||
        area.area_code?.toLowerCase().includes(keyword) ||
        area.area_type?.toLowerCase().includes(keyword) ||
        projectName.toLowerCase().includes(keyword) ||
        customerName.toLowerCase().includes(keyword) ||
        siteName.toLowerCase().includes(keyword)
      );
    });
  }, [areas, searchTerm, statusFilter]);

  const exportRows = useMemo(() => {
    return filteredAreas.map((area) => ({
      "Area Code": area.area_code || "",
      "Area Name": area.area_name || "",
      "Area Type": area.area_type || "",
      Status: area.is_active ? "Active" : "Inactive",
      "Site Code": area.site_code || "",
      "Site Name": area.site_name || "",
      "Project No": area.project_no || "",
      "Project Name": area.project_name || "",
      Customer: area.customer_name || "",
      "Estimated Quantity": area.estimated_quantity ?? "",
      "Actual Quantity": area.actual_quantity ?? 0,
      "Remaining Quantity": area.remaining_quantity ?? 0,
      "Unit": area.unit_of_measure || "",
      "Progress %": Number(area.progress_percent || 0).toFixed(2),
      Notes: area.notes || "",
    }));
  }, [filteredAreas]);

  const downloadFile = (
    filename: string,
    content: string,
    mimeType: string
  ) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
  };

  const escapeCsvValue = (value: string | number) => {
    const stringValue = String(value ?? "");

    if (
      stringValue.includes(",") ||
      stringValue.includes('"') ||
      stringValue.includes("\n")
    ) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  };

  const handleExportCsv = () => {
    if (exportRows.length === 0) {
      toast.error("No project areas to export.");
      return;
    }

    const headers = Object.keys(exportRows[0]);
    const csvContent = [
      headers.join(","),
      ...exportRows.map((row) =>
        headers
          .map((header) =>
            escapeCsvValue(row[header as keyof typeof row] ?? "")
          )
          .join(",")
      ),
    ].join("\n");

    downloadFile(
      "project-areas.csv",
      csvContent,
      "text/csv;charset=utf-8;"
    );
  };

  const handleExportExcel = () => {
    if (exportRows.length === 0) {
      toast.error("No project areas to export.");
      return;
    }

    const headers = Object.keys(exportRows[0]);

    const tableRows = exportRows
      .map((row) => {
        return `<tr>${headers
          .map((header) => {
            const value = row[header as keyof typeof row] ?? "";
            return `<td>${String(value)
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")}</td>`;
          })
          .join("")}</tr>`;
      })
      .join("");

    const excelContent = `
      <html>
        <head>
          <meta charset="UTF-8" />
        </head>
        <body>
          <table>
            <thead>
              <tr>
                ${headers.map((header) => `<th>${header}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>
    `;

    downloadFile(
      "project-areas.xls",
      excelContent,
      "application/vnd.ms-excel;charset=utf-8;"
    );
  };

  const closeDialogsBeforePrint = () => {
    setShowAddDialog(false);
    setShowViewDialog(false);
    setSelectedArea(null);
    setEditingAreaId(null);
  };

  const handlePrint = () => {
    closeDialogsBeforePrint();

    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handlePdf = () => {
    closeDialogsBeforePrint();

    setTimeout(() => {
      window.print();
    }, 100);
  };


  return (
    <div className="p-6 space-y-6 print:p-0 print:space-y-3 print:overflow-visible">
      <div className="print:hidden flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50">
              <Layers3 className="h-6 w-6 text-red-600" />
            </div>

            <div className="min-w-0">
              <h1 className="text-2xl font-black leading-tight text-slate-900 md:text-3xl">
                Project Areas
              </h1>

              <p className="mt-0.5 text-sm text-slate-500">
                Manage flooring areas under each project site.
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={openAddDialog}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-red-700 sm:w-auto sm:px-6"
        >
          <Plus className="h-5 w-5" />
          Add Area
        </Button>
      </div>

      <div className="hidden print:block border-b border-slate-300 pb-3 mb-3 print:break-after-avoid">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-slate-900">
            REDs Timber Flooring
          </h1>

          <p className="text-sm text-slate-600">
            Project Areas Report
          </p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
            <p>
              Generated:{" "}
              {new Date().toLocaleDateString("en-AU", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </p>

            <p>
              Status Filter:{" "}
              {statusFilter === "active"
                ? "Active Areas"
                : statusFilter === "inactive"
                  ? "Inactive Areas"
                  : "All Areas"}
            </p>

            {searchTerm.trim() ? (
              <p>
                Search: {searchTerm.trim()}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-6 gap-2 mt-3 text-xs">
          <div className="border border-slate-300 rounded-md p-1.5">
            <p className="text-slate-500">Total Areas</p>
            <p className="font-bold text-slate-900 mt-1">
              {areaSummary.totalAreas}
            </p>
          </div>

          <div className="border border-slate-300 rounded-md p-1.5">
            <p className="text-slate-500">Active</p>
            <p className="font-bold text-slate-900 mt-1">
              {areaSummary.activeAreas}
            </p>
          </div>

          <div className="border border-slate-300 rounded-md p-1.5">
            <p className="text-slate-500">Inactive</p>
            <p className="font-bold text-slate-900 mt-1">
              {areaSummary.inactiveAreas}
            </p>
          </div>

          <div className="border border-slate-300 rounded-md p-1.5">
            <p className="text-slate-500">Estimated</p>
            <p className="font-bold text-slate-900 mt-1">
              {areaSummary.totalEstimated.toFixed(2)}
            </p>
          </div>

          <div className="border border-slate-300 rounded-md p-1.5">
            <p className="text-slate-500">Actual</p>
            <p className="font-bold text-slate-900 mt-1">
              {areaSummary.totalActual.toFixed(2)}
            </p>
          </div>

          <div className="border border-slate-300 rounded-md p-1.5">
            <p className="text-slate-500">Remaining</p>
            <p className="font-bold text-slate-900 mt-1">
              {areaSummary.totalRemaining.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="print:hidden grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Total Areas</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {areaSummary.totalAreas}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Active</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">
            {areaSummary.activeAreas}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Inactive</p>
          <p className="text-2xl font-bold text-slate-700 mt-1">
            {areaSummary.inactiveAreas}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Estimated</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {areaSummary.totalEstimated.toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Actual</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {areaSummary.totalActual.toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Remaining</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {areaSummary.totalRemaining.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="print:hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_220px_auto] xl:items-center">
          <div className="relative min-w-0">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search by area, site, project, customer, or type..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active Areas</SelectItem>
              <SelectItem value="inactive">Inactive Areas</SelectItem>
              <SelectItem value="all">All Areas</SelectItem>
            </SelectContent>
          </Select>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:flex xl:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrint}
              className="h-10 gap-2 rounded-xl text-xs"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handlePdf}
              className="h-10 gap-2 rounded-xl text-xs"
            >
              <FileDown className="h-4 w-4" />
              PDF
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleExportCsv}
              className="h-10 gap-2 rounded-xl text-xs"
            >
              <FileSpreadsheet className="h-4 w-4" />
              CSV
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleExportExcel}
              className="h-10 gap-2 rounded-xl text-xs"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
          </div>
        </div>
      </div>

      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:block print:rounded-none print:shadow-none print:border-slate-300 print:text-[10px]">
        <div className="grid grid-cols-12 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500 px-4 py-3 border-b gap-3 print:bg-white print:text-[9px] print:px-2 print:py-1.5 print:gap-2 print:border-slate-300">
          <div className="col-span-2">Area</div>
          <div className="col-span-1">Type</div>
          <div className="col-span-2">Site</div>
          <div className="col-span-2">Project</div>
          <div className="col-span-1">Est.</div>
          <div className="col-span-1">Actual</div>
          <div className="col-span-1">Remain</div>
          <div className="col-span-1">Progress</div>
          <div className="col-span-1 text-right print:hidden">Actions</div>
        </div>

        {filteredAreas.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No project areas found.
          </div>
        ) : (
          filteredAreas.map((area) => (
            <div
              key={area.area_id}
              className="grid grid-cols-12 px-4 py-4 border-b last:border-b-0 hover:bg-slate-50 transition-colors gap-3 print:px-2 print:py-1.5 print:gap-2 print:hover:bg-white print:break-inside-avoid print:border-slate-300"
            >
              <div className="col-span-2">
                <p className="font-semibold text-slate-900">
                  {area.area_name}
                </p>
                <p className="text-xs text-slate-500 print:text-[9px]">
                  {area.area_code || "-"}
                </p>
              </div>

              <div className="col-span-1 text-slate-700">
                {area.area_type || "-"}
              </div>

              <div className="col-span-2 text-slate-700">
                <p>{area.site_name || "-"}</p>

              </div>

              <div className="col-span-2">
                <p className="font-medium text-slate-800">
                  {area.project_name || "-"}
                </p>
                <p className="text-xs text-slate-500 print:text-[9px]">
                  {area.project_no || "-"} ·{" "}
                  {area.customer_name || "-"}
                </p>
              </div>

              <div className="col-span-1 text-slate-700">
                {area.estimated_quantity ?? "-"} {area.unit_of_measure || ""}
              </div>

              <div className="col-span-1 text-slate-700">
                {area.actual_quantity ?? 0} {area.unit_of_measure || ""}
              </div>

              <div className="col-span-1 text-slate-700">
                {area.remaining_quantity ?? 0} {area.unit_of_measure || ""}
              </div>

              <div className="col-span-1 text-slate-700">
                {Number(area.progress_percent || 0).toFixed(2)}%
              </div>

              <div className="col-span-1 print:hidden">
                <StandardActions
                  isActive={area.is_active}
                  onView={() => openViewDialog(area)}
                  onEdit={() => openEditDialog(area)}
                  onToggleActive={() =>
                    setAreaActiveStatus.mutate({
                      areaId: area.area_id,
                      isActive: !area.is_active,
                    })
                  }
                  onDelete={() => {
                    const confirmed = window.confirm(
                      `Delete project area "${area.area_name}"?`
                    );

                    if (!confirmed) return;

                    deleteArea.mutate(area.area_id);
                  }}
                  isStatusPending={setAreaActiveStatus.isPending}
                  isDeletePending={deleteArea.isPending}
                  size="desktop"
                  align="end"
                />
              </div>

            </div>
          ))
        )}
      </div>

      <div className="print:hidden md:hidden space-y-4">
        {filteredAreas.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
            No project areas found.
          </div>
        ) : (
          filteredAreas.map((area) => (
            <div
              key={area.area_id}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">
                    {area.area_name || "-"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {area.area_code || "-"} · {area.area_type || "-"}
                  </p>
                </div>

              </div>

              <div className="flex items-center justify-between gap-3">
                <ActiveStatusBadge isActive={area.is_active} />

                <span className="text-xs font-semibold text-slate-500">
                  {Number(area.progress_percent || 0).toFixed(2)}% Progress
                </span>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-1">
                <p className="text-xs text-slate-500">Project</p>
                <p className="text-sm font-semibold text-slate-900">
                  {area.project_name || "-"}
                </p>
                <p className="text-xs text-slate-500">
                  {area.project_no || "-"} · {area.customer_name || "-"}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-1">
                <p className="text-xs text-slate-500">Site</p>
                <p className="text-sm font-semibold text-slate-900">
                  {area.site_name || "-"}
                </p>
                <p className="text-xs text-slate-500 print:text-[9px]">
                  {area.site_code || "-"}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Est.</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    {area.estimated_quantity ?? "-"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {area.unit_of_measure || ""}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Actual</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    {area.actual_quantity ?? 0}
                  </p>
                  <p className="text-xs text-slate-500">
                    {area.unit_of_measure || ""}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">Remain</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    {area.remaining_quantity ?? 0}
                  </p>
                  <p className="text-xs text-slate-500">
                    {area.unit_of_measure || ""}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <StandardActions
                  isActive={area.is_active}
                  onView={() => openViewDialog(area)}
                  onEdit={() => openEditDialog(area)}
                  onToggleActive={() =>
                    setAreaActiveStatus.mutate({
                      areaId: area.area_id,
                      isActive: !area.is_active,
                    })
                  }
                  onDelete={() => {
                    const confirmed = window.confirm(
                      `Delete project area "${area.area_name}"?`
                    );

                    if (!confirmed) return;

                    deleteArea.mutate(area.area_id);
                  }}
                  isStatusPending={setAreaActiveStatus.isPending}
                  isDeletePending={deleteArea.isPending}
                  size="mobile"
                  align="end"
                />
              </div>

            </div>
          ))
        )}
      </div>

      <Dialog
        open={showViewDialog}
        onOpenChange={(open) => {
          setShowViewDialog(open);

          if (!open) {
            setSelectedArea(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Project Area Details</DialogTitle>
          </DialogHeader>

          {selectedArea ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Area
                    </p>
                    <h2 className="text-xl font-bold text-slate-900 mt-1">
                      {selectedArea.area_name || "-"}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      {selectedArea.area_code || "-"} · {selectedArea.area_type || "-"}
                    </p>
                  </div>

                  <span
                    className={
                      selectedArea.is_active
                        ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200"
                        : "rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 border border-slate-200"
                    }
                  >
                    {selectedArea.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Project
                  </p>
                  <p className="font-bold text-slate-900 mt-1">
                    {selectedArea.project_name || "-"}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    {selectedArea.project_no || "-"} · {selectedArea.customer_name || "-"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Site
                  </p>
                  <p className="font-bold text-slate-900 mt-1">
                    {selectedArea.site_name || "-"}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    {selectedArea.site_code || "-"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs text-slate-500">Estimated</p>
                  <p className="text-lg font-bold text-slate-900 mt-1">
                    {selectedArea.estimated_quantity ?? "-"} {selectedArea.unit_of_measure || ""}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs text-slate-500">Actual</p>
                  <p className="text-lg font-bold text-slate-900 mt-1">
                    {selectedArea.actual_quantity ?? 0} {selectedArea.unit_of_measure || ""}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs text-slate-500">Remaining</p>
                  <p className="text-lg font-bold text-slate-900 mt-1">
                    {selectedArea.remaining_quantity ?? 0} {selectedArea.unit_of_measure || ""}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs text-slate-500">Progress</p>
                  <p className="text-lg font-bold text-slate-900 mt-1">
                    {Number(selectedArea.progress_percent || 0).toFixed(2)}%
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Notes
                </p>
                <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">
                  {selectedArea.notes || "No notes."}
                </p>
              </div>
            </div>
          ) : null}

          <div className="flex justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowViewDialog(false);
                setSelectedArea(null);
              }}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);

          if (!open) {
            setEditingAreaId(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-h-[90vh] w-[calc(100vw-24px)] max-w-3xl overflow-y-auto rounded-2xl p-4 sm:p-6">
          <DialogTitle>
            {editingAreaId ? "Edit Project Area" : "Add Project Area"}
          </DialogTitle>

          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Project / Site
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Select the project and site this area belongs to.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Project *</Label>
                  <Select
                    value={projectId}
                    onValueChange={(value) => {
                      setProjectId(value);
                      setSiteId("");
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
                    onValueChange={setSiteId}
                    disabled={!projectId}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          projectId
                            ? "Select project site"
                            : "Select project first"
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
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Area Details
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Define the area name, type, estimated quantity, and unit.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Area Code</Label>
                  <Input
                    value={areaCode}
                    readOnly
                    placeholder="Auto generated"
                    className="bg-slate-50 text-slate-500"
                  />
                  <p className="text-xs text-slate-500">
                    Area code is generated automatically when saving a new project area.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Area Name *</Label>
                  <Input
                    value={areaName}
                    onChange={(e) => setAreaName(e.target.value)}
                    placeholder="Living Room"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Area Type</Label>

                  <Select
                    value={areaType}
                    onValueChange={setAreaType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select area type" />
                    </SelectTrigger>

                    <SelectContent>
                      {areaTypes.map((type) => (
                        <SelectItem
                          key={type.area_type_id}
                          value={type.area_type_name}
                        >
                          {type.area_type_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <p className="text-xs text-slate-500">
                    Area types are loaded from the project area type master.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Select
                    value={unitOfMeasure}
                    onValueChange={setUnitOfMeasure}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sqm">sqm</SelectItem>
                      <SelectItem value="m">m</SelectItem>
                      <SelectItem value="pcs">pcs</SelectItem>
                      <SelectItem value="lot">lot</SelectItem>
                      <SelectItem value="day">day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Estimated Quantity</Label>
                  <Input
                    type="number"
                    value={estimatedQuantity}
                    onChange={(e) => setEstimatedQuantity(e.target.value)}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-slate-500">
                    This quantity is used as the baseline for progress and remaining work.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Notes
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Add optional details for this area.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Area notes, access details, or special installation requirements..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setEditingAreaId(null);
                resetForm();
              }}
            >
              Cancel
            </Button>

            <Button
              onClick={() => {
                if (editingAreaId) {
                  updateArea.mutate();
                } else {
                  createArea.mutate();
                }
              }}
              disabled={
                createArea.isPending ||
                updateArea.isPending
              }
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {
                createArea.isPending || updateArea.isPending
                  ? "Saving..."
                  : editingAreaId
                    ? "Update Area"
                    : "Save Area"
              }
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default ProjectAreas;