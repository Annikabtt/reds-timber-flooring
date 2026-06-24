import { useMemo, useState } from "react";
import { Layers3, Plus, Search } from "lucide-react";
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

const ProjectAreas = () => {
  const queryClient = useQueryClient();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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

  const { data: areas = [] } = useQuery({
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
        area_code: areaCode.trim() || null,
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
      toast.success("Project area updated successfully.");

      await queryClient.invalidateQueries({
        queryKey: ["project_area_progress_v"],
      });

      await queryClient.refetchQueries({
        queryKey: ["project_area_progress_v"],
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
          area_code: areaCode.trim() || null,
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

  const filteredAreas = useMemo(() => {
    const keyword = searchTerm.toLowerCase();

    return areas.filter((area) => {
      const projectName = area.project_name || "";
      const customerName = area.customer_name || "";
      const siteName = area.site_name || "";

      return (
        area.area_name?.toLowerCase().includes(keyword) ||
        area.area_code?.toLowerCase().includes(keyword) ||
        area.area_type?.toLowerCase().includes(keyword) ||
        projectName.toLowerCase().includes(keyword) ||
        customerName.toLowerCase().includes(keyword) ||
        siteName.toLowerCase().includes(keyword)
      );
    });
  }, [areas, searchTerm]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Layers3 className="h-8 w-8 text-red-600" />
            <h1 className="text-3xl font-bold text-slate-900">
              Project Areas
            </h1>
          </div>
          <p className="text-slate-500 mt-1">
            Manage flooring areas under each project site.
          </p>
        </div>

        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl shadow-lg shadow-red-200 transition-all flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Area
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search by area, site, project, customer, or type..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-12 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500 px-4 py-3 border-b gap-3">
          <div className="col-span-2">Area</div>
          <div className="col-span-1">Type</div>
          <div className="col-span-2">Site</div>
          <div className="col-span-2">Project</div>
          <div className="col-span-1">Est.</div>
          <div className="col-span-1">Actual</div>
          <div className="col-span-1">Remain</div>
          <div className="col-span-1">Progress</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {filteredAreas.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No project areas found.
          </div>
        ) : (
          filteredAreas.map((area) => (
            <div
              key={area.area_id}
              className="grid grid-cols-12 px-4 py-4 border-b last:border-b-0 hover:bg-slate-50 transition-colors gap-3"
            >
              <div className="col-span-2">
                <p className="font-semibold text-slate-900">
                  {area.area_name}
                </p>
                <p className="text-xs text-slate-500">
                  {area.area_code || "-"}
                </p>
              </div>

              <div className="col-span-1 text-slate-700">
                {area.area_type || "-"}
              </div>

              <div className="col-span-2 text-slate-700">
                <p>{area.site_name || "-"}</p>
                <p className="text-xs text-slate-500">
                  {area.site_code || "-"}
                </p>
              </div>

              <div className="col-span-2">
                <p className="font-medium text-slate-800">
                  {area.project_name || "-"}
                </p>
                <p className="text-xs text-slate-500">
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

              <div className="col-span-1 text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(area)}
                >
                  Edit
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-3xl">
          <DialogTitle>
            {editingAreaId ? "Edit Project Area" : "Add Project Area"}
          </DialogTitle>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
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

            <div className="col-span-2 space-y-2">
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

            <div className="space-y-2">
              <Label>Area Code</Label>
              <Input
                value={areaCode}
                onChange={(e) => setAreaCode(e.target.value)}
                placeholder="AREA-001"
              />
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
              <Input
                value={areaType}
                onChange={(e) => setAreaType(e.target.value)}
                placeholder="Flooring / Stair / Decking"
              />
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

            <div className="space-y-2">
              <Label>Estimated Quantity</Label>
              <Input
                type="number"
                value={estimatedQuantity}
                onChange={(e) => setEstimatedQuantity(e.target.value)}
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