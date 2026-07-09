import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Plus,
  Search,
  Phone,
  Eye,
  Pencil,
  PowerOff,
  Trash2,
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

const ProjectSites = () => {
  const queryClient = useQueryClient();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectId, setProjectId] = useState("");
  const [siteCode, setSiteCode] = useState("");
  const [siteName, setSiteName] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [suburb, setSuburb] = useState("");
  const [stateName, setStateName] = useState("");
  const [postcode, setPostcode] = useState("");
  const [country, setCountry] = useState("Australia");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [notes, setNotes] = useState("");

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-for-sites"],
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
    queryKey: ["project_sites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_sites")
        .select(`
          site_id,
          project_id,
          site_code,
          site_name,
          address_line_1,
          address_line_2,
          suburb,
          state,
          postcode,
          country,
          contact_name,
          contact_phone,
          notes,
          is_active,
          created_at,
          projects (
            project_no,
            project_name,
            customers (
              customer_name
            )
          )
                `)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => {
    setEditingSiteId(null);
    setProjectId("");
    setSiteCode("");
    setSiteName("");
    setAddressLine1("");
    setAddressLine2("");
    setSuburb("");
    setStateName("");
    setPostcode("");
    setCountry("Australia");
    setContactName("");
    setContactPhone("");
    setNotes("");
  };

  const openCreateSite = () => {
    resetForm();
    setShowAddDialog(true);
  };

  const openEditSite = (site: any) => {
    setEditingSiteId(site.site_id);
    setProjectId(site.project_id ?? "");
    setSiteCode(site.site_code ?? "");
    setSiteName(site.site_name ?? "");
    setAddressLine1(site.address_line_1 ?? "");
    setAddressLine2(site.address_line_2 ?? "");
    setSuburb(site.suburb ?? "");
    setStateName(site.state ?? "");
    setPostcode(site.postcode ?? "");
    setCountry(site.country ?? "Australia");
    setContactName(site.contact_name ?? "");
    setContactPhone(site.contact_phone ?? "");
    setNotes(site.notes ?? "");
    setShowAddDialog(true);
  };

  const createSite = useMutation({
    mutationFn: async () => {
      if (!projectId) {
        throw new Error("Please select a project.");
      }

      if (!siteName.trim()) {
        throw new Error("Please enter site name.");
      }

      const { error } = await supabase.from("project_sites").insert({
        project_id: projectId,
        site_code: siteCode.trim() || null,
        site_name: siteName.trim(),
        address_line_1: addressLine1.trim() || null,
        address_line_2: addressLine2.trim() || null,
        suburb: suburb.trim() || null,
        state: stateName.trim() || null,
        postcode: postcode.trim() || null,
        country: country.trim() || null,
        contact_name: contactName.trim() || null,
        contact_phone: contactPhone.trim() || null,
        notes: notes.trim() || null,
        is_active: true,
        is_deleted: false,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Project site created successfully.");
      queryClient.invalidateQueries({ queryKey: ["project_sites"] });
      setShowAddDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateSite = useMutation({
    mutationFn: async () => {
      if (!editingSiteId) {
        throw new Error("No site selected for editing.");
      }

      if (!projectId) {
        throw new Error("Please select a project.");
      }

      if (!siteName.trim()) {
        throw new Error("Please enter site name.");
      }

      const { error } = await supabase
        .from("project_sites")
        .update({
          project_id: projectId,
          site_code: siteCode.trim() || null,
          site_name: siteName.trim(),
          address_line_1: addressLine1.trim() || null,
          address_line_2: addressLine2.trim() || null,
          suburb: suburb.trim() || null,
          state: stateName.trim() || null,
          postcode: postcode.trim() || null,
          country: country.trim() || null,
          contact_name: contactName.trim() || null,
          contact_phone: contactPhone.trim() || null,
          notes: notes.trim() || null,
        })
        .eq("site_id", editingSiteId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Project site updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["project_sites"] });
      setShowAddDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const inactiveSite = useMutation({
    mutationFn: async (siteId: string) => {
      const { error } = await supabase
        .from("project_sites")
        .update({
          is_active: false,
        })
        .eq("site_id", siteId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Project site marked as inactive.");
      queryClient.invalidateQueries({ queryKey: ["project_sites"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteSite = useMutation({
    mutationFn: async (siteId: string) => {
      const confirmed = window.confirm(
        "Delete this project site? This will hide it from the active list."
      );

      if (!confirmed) return;

      const { error } = await supabase
        .from("project_sites")
        .update({
          is_deleted: true,
        })
        .eq("site_id", siteId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Project site deleted.");
      queryClient.invalidateQueries({ queryKey: ["project_sites"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const siteSummary = useMemo(() => {
    return {
      totalSites: sites.length,
      activeSites: sites.filter((s) => s.is_active).length,
      inactiveSites: sites.filter((s) => !s.is_active).length,
      totalProjects: new Set(
        sites.map((s) => s.project_id)
      ).size,
    };
  }, [sites]);
  const filteredSites = useMemo(() => {
    const keyword = searchTerm.toLowerCase();

    return sites.filter((site) => {
      if (statusFilter === "active" && !site.is_active) return false;
      if (statusFilter === "inactive" && site.is_active) return false;

      const projectName = site.projects?.project_name || "";
      const customerName = site.projects?.customers?.customer_name || "";

      return (
        site.site_name?.toLowerCase().includes(keyword) ||
        site.site_code?.toLowerCase().includes(keyword) ||
        projectName.toLowerCase().includes(keyword) ||
        customerName.toLowerCase().includes(keyword) ||
        site.suburb?.toLowerCase().includes(keyword)
      );
    });
  }, [sites, searchTerm, statusFilter]);

  const exportRows = filteredSites.map((site) => {
    const address = [
      site.address_line_1,
      site.address_line_2,
      site.suburb,
      site.state,
      site.postcode,
      site.country,
    ]
      .filter(Boolean)
      .join(", ");

    return {
      "Site Code": site.site_code ?? "",
      "Site Name": site.site_name ?? "",
      Project: site.projects?.project_name ?? "",
      "Project No": site.projects?.project_no ?? "",
      Customer: site.projects?.customers?.customer_name ?? "",
      Address: address,
      "Contact Name": site.contact_name ?? "",
      "Contact Phone": site.contact_phone ?? "",
      Status: site.is_active ? "Active" : "Inactive",
      Notes: site.notes ?? "",
    };
  });

  const downloadFile = (
    content: string,
    fileName: string,
    mimeType: string
  ) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    if (exportRows.length === 0) {
      toast.error("No project sites to export.");
      return;
    }

    const headers = Object.keys(exportRows[0]);

    const csvContent = [
      headers.join(","),
      ...exportRows.map((row) =>
        headers
          .map((header) => {
            const value = String(row[header as keyof typeof row] ?? "");
            return `"${value.replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ].join("\n");

    downloadFile(
      csvContent,
      "project-sites.csv",
      "text/csv;charset=utf-8;"
    );
  };

  const handleExportExcel = () => {
    if (exportRows.length === 0) {
      toast.error("No project sites to export.");
      return;
    }

    const headers = Object.keys(exportRows[0]);

    const tableRows = exportRows
      .map(
        (row) =>
          `<tr>${headers
            .map(
              (header) =>
                `<td>${String(row[header as keyof typeof row] ?? "")}</td>`
            )
            .join("")}</tr>`
      )
      .join("");

    const excelContent = `
      <html>
        <head>
          <meta charset="UTF-8" />
        </head>
        <body>
          <table>
            <thead>
              <tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>
    `;

    downloadFile(
      excelContent,
      "project-sites.xls",
      "application/vnd.ms-excel;charset=utf-8;"
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <MapPin className="h-8 w-8 text-red-600" />
            <h1 className="text-3xl font-bold text-slate-900">
              Project Sites
            </h1>
          </div>
          <p className="text-slate-500 mt-1">
            Manage project site locations and site contact details.
          </p>
        </div>

        <Button
          onClick={openCreateSite}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl shadow-lg shadow-red-200 transition-all flex items-center gap-2 print:hidden"
        >
          <Plus className="h-5 w-5" />
          Add Site
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="bg-white rounded-2xl border p-4">
          <p className="text-sm text-slate-500">Total Sites</p>
          <p className="text-2xl font-bold">{siteSummary.totalSites}</p>
        </div>

        <div className="bg-white rounded-2xl border p-4">
          <p className="text-sm text-slate-500">Active Sites</p>
          <p className="text-2xl font-bold text-green-600">
            {siteSummary.activeSites}
          </p>
        </div>

        <div className="bg-white rounded-2xl border p-4">
          <p className="text-sm text-slate-500">Inactive Sites</p>
          <p className="text-2xl font-bold text-slate-600">
            {siteSummary.inactiveSites}
          </p>
        </div>

        <div className="bg-white rounded-2xl border p-4">
          <p className="text-sm text-slate-500">Projects</p>
          <p className="text-2xl font-bold">
            {siteSummary.totalProjects}
          </p>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 print:hidden">
        <div className="grid gap-3 xl:grid-cols-[1fr_220px_auto] xl:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search by site, project, customer, or suburb..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sites</SelectItem>
              <SelectItem value="active">Active Sites</SelectItem>
              <SelectItem value="inactive">Inactive Sites</SelectItem>
            </SelectContent>
          </Select>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
            <Button variant="outline" onClick={handlePrint}>
              Print
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              PDF
            </Button>
            <Button variant="outline" onClick={handleExportCsv}>
              CSV
            </Button>
            <Button variant="outline" onClick={handleExportExcel}>
              Excel
            </Button>
          </div>
        </div>
      </div>

      {filteredSites.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
          No project sites found.
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
            <div className="grid grid-cols-12 gap-4 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 border-b">
              <div className="col-span-2">Site</div>
              <div className="col-span-3">Project</div>
              <div className="col-span-2">Customer</div>
              <div className="col-span-2">Address</div>
              <div className="col-span-1">Contact</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1 text-right print:hidden">Actions</div>
            </div>

            {filteredSites.map((site) => {
              const address = [
                site.address_line_1,
                site.address_line_2,
                site.suburb,
                site.state,
                site.postcode,
                site.country,
              ]
                .filter(Boolean)
                .join(", ");

              return (
                <div
                  key={site.site_id}
                  className="grid grid-cols-12 gap-4 px-4 py-4 border-b last:border-b-0 hover:bg-slate-50 transition-colors"
                >
                  <div className="col-span-2 min-w-0">
                    <p className="truncate font-semibold text-slate-900">
                      {site.site_name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {site.site_code || "-"}
                    </p>
                  </div>

                  <div className="col-span-3 min-w-0">
                    <p className="truncate font-medium text-slate-800">
                      {site.projects?.project_name || "-"}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {site.projects?.project_no || "-"}
                    </p>
                  </div>

                  <div className="col-span-2 min-w-0 text-slate-700">
                    <p className="truncate">
                      {site.projects?.customers?.customer_name || "-"}
                    </p>
                  </div>

                  <div className="col-span-2 min-w-0 text-sm text-slate-600">
                    <p className="line-clamp-2">{address || "-"}</p>
                  </div>

                  <div className="col-span-1 min-w-0 text-sm text-slate-600">
                    <p className="truncate">{site.contact_name || "-"}</p>

                    {site.contact_phone && (
                      <p className="mt-1 flex items-center gap-1 truncate text-slate-500">
                        <Phone className="h-3 w-3 shrink-0" />
                        {site.contact_phone}
                      </p>
                    )}
                  </div>

                  <div className="col-span-1">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${site.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-500"
                        }`}
                    >
                      {site.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="col-span-1 flex flex-wrap justify-end gap-2 print:hidden">
                    <Button asChild size="sm" variant="outline" title="View site">
                      <Link to={`/project-sites/${site.site_id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditSite(site)}
                      title="Edit site"
                      className="gap-2"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => inactiveSite.mutate(site.site_id)}
                      disabled={inactiveSite.isPending || !site.is_active}
                      title="Mark inactive"
                      className="gap-2"
                    >
                      <PowerOff className="h-4 w-4" />
                      Inactive
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteSite.mutate(site.site_id)}
                      disabled={deleteSite.isPending}
                      title="Delete site"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid gap-4 lg:hidden">
            {filteredSites.map((site) => {
              const address = [
                site.address_line_1,
                site.address_line_2,
                site.suburb,
                site.state,
                site.postcode,
                site.country,
              ]
                .filter(Boolean)
                .join(", ");

              return (
                <div
                  key={site.site_id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">
                        {site.site_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {site.site_code || "-"}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${site.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-500"
                        }`}
                    >
                      {site.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="col-span-2">
                      <p className="text-slate-500">Project</p>
                      <p className="font-medium text-slate-800">
                        {site.projects?.project_name || "-"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {site.projects?.project_no || "-"}
                      </p>
                    </div>

                    <div className="col-span-2">
                      <p className="text-slate-500">Customer</p>
                      <p className="font-medium text-slate-800">
                        {site.projects?.customers?.customer_name || "-"}
                      </p>
                    </div>

                    <div className="col-span-2">
                      <p className="text-slate-500">Address</p>
                      <p className="font-medium text-slate-800">
                        {address || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Contact</p>
                      <p className="font-medium text-slate-800">
                        {site.contact_name || "-"}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Phone</p>
                      <p className="font-medium text-slate-800">
                        {site.contact_phone || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 print:hidden">
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/project-sites/${site.site_id}`}>
                        View
                      </Link>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditSite(site)}
                    >
                      Edit
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => inactiveSite.mutate(site.site_id)}
                      disabled={inactiveSite.isPending || !site.is_active}
                      className="gap-2"
                    >
                      Inactive
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteSite.mutate(site.site_id)}
                      disabled={deleteSite.isPending}
                      title="Delete site"
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingSiteId ? "Edit Project Site" : "Add Project Site"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Project *</Label>
              <Select value={projectId} onValueChange={setProjectId}>
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
              <Label>Site Code</Label>
              <Input
                value={siteCode}
                onChange={(e) => setSiteCode(e.target.value)}
                placeholder="SITE-001"
              />
            </div>

            <div className="space-y-2">
              <Label>Site Name *</Label>
              <Input
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="Main Residence"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Address Line 1</Label>
              <Input
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Address Line 2</Label>
              <Input
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Suburb</Label>
              <Input
                value={suburb}
                onChange={(e) => setSuburb(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>State</Label>
              <Input
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Postcode</Label>
              <Input
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Country</Label>
              <Input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Contact Name</Label>
              <Input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Contact Phone</Label>
              <Input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
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
                if (editingSiteId) {
                  updateSite.mutate();
                } else {
                  createSite.mutate();
                }
              }}
              disabled={createSite.isPending || updateSite.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {editingSiteId
                ? updateSite.isPending
                  ? "Updating..."
                  : "Update Site"
                : createSite.isPending
                  ? "Saving..."
                  : "Save Site"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectSites;