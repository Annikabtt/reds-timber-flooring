import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  FileDown,
  FileSpreadsheet,
  FolderKanban,
  Plus,
  Printer,
  Search,
} from "lucide-react";
import { ActiveStatusBadge } from "@/components/common/ActiveStatusBadge";
import { StandardActions } from "@/components/common/StandardActions";

const statusBadge: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground",
  Quoted: "bg-blue-100 text-blue-700",
  Approved: "bg-green-100 text-green-700",
  "In Progress": "bg-success/15 text-success",
  "On Hold": "bg-warning/15 text-warning",
  Completed: "bg-primary/15 text-primary",
  Cancelled: "bg-destructive/15 text-destructive",
};
const formatNumberInput = (value: string) => {
  const numericValue = value.replace(/,/g, "").replace(/[^\d.]/g, "");
  if (!numericValue) return "";
  return Number(numericValue).toLocaleString("en-AU");
};

const parseNumberInput = (value: string) => {
  const numericValue = value.replace(/,/g, "");
  return numericValue ? Number(numericValue) : null;
};

export default function Projects() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingProject, setViewingProject] = useState<any | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectType, setProjectType] = useState("Residential");
  const [projectStatus, setProjectStatus] = useState("Draft");
  const [contractValue, setContractValue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState("");
  const [notes, setNotes] = useState("");
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    if (searchParams.get("newProject") === "1") {
      setDialogOpen(true);
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.delete("newProject");
        return newParams;
      });
    }
  }, [searchParams, setSearchParams]);

  const { data: customers = [] } = useQuery({
    queryKey: ["customers-for-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("customer_id, customer_name")
        .eq("is_deleted", false)
        .order("customer_name", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(
          `
          project_id,
          project_no,
          customer_id,
          project_name,
          project_type,
          project_status,
          contract_value,
          start_date,
          estimated_completion_date,
          notes,
          is_active,
          created_at,
          customers (
            customer_name
          )
        `
        )
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredProjects = projects.filter((project) => {
    const searchValue = searchText.toLowerCase();

    const matchesSearch =
      project.project_no.toLowerCase().includes(searchValue) ||
      project.project_name.toLowerCase().includes(searchValue) ||
      (project.customers?.customer_name ?? "")
        .toLowerCase()
        .includes(searchValue);

    const matchesStatus =
      statusFilter === "All" || project.project_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const resetProjectForm = () => {
    setEditingProjectId(null);
    setCustomerId("");
    setProjectName("");
    setProjectType("Residential");
    setProjectStatus("Draft");
    setContractValue("");
    setStartDate("");
    setEstimatedCompletionDate("");
    setNotes("");
  };

  const openCreateProject = () => {
    resetProjectForm();
    setDialogOpen(true);
  };

  const openEditProject = (project: any) => {
    setEditingProjectId(project.project_id);
    setCustomerId(project.customer_id ?? "");
    setProjectName(project.project_name ?? "");
    setProjectType(project.project_type ?? "Residential");
    setProjectStatus(project.project_status ?? "Draft");
    setContractValue(
      project.contract_value !== null && project.contract_value !== undefined
        ? Number(project.contract_value).toLocaleString("en-AU")
        : ""
    );
    setStartDate(project.start_date ?? "");
    setEstimatedCompletionDate(project.estimated_completion_date ?? "");
    setNotes(project.notes ?? "");
    setDialogOpen(true);
  };

  const openViewProject = (project: any) => {
    setViewingProject(project);
    setViewDialogOpen(true);
  };

  const summaryCards = [
    {
      label: "Total Projects",
      value: projects.length.toString(),
    },
    {
      label: "Filtered Results",
      value: filteredProjects.length.toString(),
    },
    {
      label: "In Progress",
      value: projects
        .filter((project) => project.project_status === "In Progress")
        .length.toString(),
    },
    {
      label: "Contract Value",
      value: projects
        .reduce(
          (total, project) => total + Number(project.contract_value ?? 0),
          0
        )
        .toLocaleString("en-AU", {
          style: "currency",
          currency: "AUD",
        }),
    },
  ];

  const createProject = useMutation({
    mutationFn: async () => {
      if (!customerId) {
        throw new Error("Please select a customer.");
      }

      const { error } = await supabase.from("projects").insert({
        project_no: "",
        customer_id: customerId,
        project_name: projectName,
        project_type: projectType,
        project_status: projectStatus,
        contract_value: parseNumberInput(contractValue),
        start_date: startDate || null,
        estimated_completion_date: estimatedCompletionDate || null,
        notes: notes || null,
        is_active: true,
        is_deleted: false,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setDialogOpen(false);
      resetProjectForm();
      toast({ title: "Project created" });
    },
    onError: (e: Error) =>
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive",
      }),
  });

  const updateProject = useMutation({
    mutationFn: async () => {
      if (!editingProjectId) {
        throw new Error("No project selected for editing.");
      }

      if (!customerId) {
        throw new Error("Please select a customer.");
      }

      const { error } = await supabase
        .from("projects")
        .update({
          customer_id: customerId,
          project_name: projectName,
          project_type: projectType,
          project_status: projectStatus,
          contract_value: parseNumberInput(contractValue),
          start_date: startDate || null,
          estimated_completion_date: estimatedCompletionDate || null,
          notes: notes || null,
        })
        .eq("project_id", editingProjectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setDialogOpen(false);
      resetProjectForm();
      toast({ title: "Project updated" });
    },
    onError: (e: Error) =>
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive",
      }),
  });

  const toggleProjectActive = useMutation({
    mutationFn: async ({
      projectId,
      isActive,
    }: {
      projectId: string;
      isActive: boolean;
    }) => {
      const { error } = await supabase
        .from("projects")
        .update({
          is_active: isActive,
        })
        .eq("project_id", projectId)
        .eq("is_deleted", false);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });

      toast({
        title: variables.isActive
          ? "Project reactivated"
          : "Project marked as inactive",
      });
    },
    onError: (e: Error) =>
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive",
      }),
  });


  const deleteProject = useMutation({
    mutationFn: async (projectId: string) => {
      const confirmed = window.confirm(
        "Delete this project? This will hide the project from the active list."
      );

      if (!confirmed) return;

      const { error } = await supabase
        .from("projects")
        .update({
          is_deleted: true,
        })
        .eq("project_id", projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({ title: "Project deleted" });
    },
    onError: (e: Error) =>
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive",
      }),
  });

  const exportRows = filteredProjects.map((project) => ({
    "Project No": project.project_no,
    "Project Name": project.project_name,
    Customer: project.customers?.customer_name ?? "No customer",
    Type: project.project_type ?? "-",
    Status: project.project_status,
    "Contract Value": project.contract_value ?? "",
    "Start Date": project.start_date ?? "",
    "Estimated Completion": project.estimated_completion_date ?? "",
    Notes: project.notes ?? "",
  }));

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
      toast({
        title: "No data to export",
        description: "There are no projects in the current filter.",
      });
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
      "projects.csv",
      "text/csv;charset=utf-8;"
    );
  };

  const handleExportExcel = () => {
    if (exportRows.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no projects in the current filter.",
      });
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
      "projects.xls",
      "application/vnd.ms-excel;charset=utf-8;"
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 px-4 pb-6 animate-fade-in sm:px-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50">
              <FolderKanban className="h-6 w-6 text-red-600" />
            </div>

            <div className="min-w-0">
              <h1 className="text-2xl font-black leading-tight text-slate-900 md:text-3xl">
                Projects
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Track project records from REDS database.
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={openCreateProject}
          className="flex h-11 w-full items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-red-700 sm:w-auto sm:px-6 print:hidden"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Project
        </Button>

        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetProjectForm();
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingProjectId ? "Edit Project" : "Create Project"}
              </DialogTitle>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingProjectId) {
                  updateProject.mutate();
                } else {
                  createProject.mutate();
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem
                        key={customer.customer_id}
                        value={customer.customer_id}
                      >
                        {customer.customer_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Project Name</Label>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Project Type</Label>
                  <Select value={projectType} onValueChange={setProjectType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Residential">Residential</SelectItem>
                      <SelectItem value="Commercial">Commercial</SelectItem>
                      <SelectItem value="Builder">Builder</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={projectStatus}
                    onValueChange={setProjectStatus}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Quoted">Quoted</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="On Hold">On Hold</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Contract Value</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={contractValue}
                  onChange={(e) => setContractValue(formatNumberInput(e.target.value))}
                  placeholder="0.00"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Estimated Completion</Label>
                  <Input
                    type="date"
                    value={estimatedCompletionDate}
                    onChange={(e) =>
                      setEstimatedCompletionDate(e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={createProject.isPending || updateProject.isPending}
              >
                {editingProjectId
                  ? updateProject.isPending
                    ? "Updating..."
                    : "Update Project"
                  : createProject.isPending
                    ? "Creating..."
                    : "Create Project"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Project Details</DialogTitle>
          </DialogHeader>

          {viewingProject && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold">
                  {viewingProject.project_name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {viewingProject.project_no}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">
                    {viewingProject.customers?.customer_name ?? "No customer"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <span
                    className={`inline-flex text-xs px-2 py-0.5 rounded-full ${statusBadge[viewingProject.project_status] ??
                      "bg-muted text-muted-foreground"
                      }`}
                  >
                    {viewingProject.project_status}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Project Type</p>
                  <p className="font-medium">
                    {viewingProject.project_type ?? "-"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Contract Value
                  </p>
                  <p className="font-medium">
                    {viewingProject.contract_value !== null
                      ? Number(viewingProject.contract_value).toLocaleString(
                        "en-AU",
                        {
                          style: "currency",
                          currency: "AUD",
                        }
                      )
                      : "-"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">
                    {viewingProject.start_date
                      ? new Date(
                        viewingProject.start_date
                      ).toLocaleDateString("en-AU")
                      : "-"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Estimated Completion
                  </p>
                  <p className="font-medium">
                    {viewingProject.estimated_completion_date
                      ? new Date(
                        viewingProject.estimated_completion_date
                      ).toLocaleDateString("en-AU")
                      : "-"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="mt-1 whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm">
                  {viewingProject.notes || "No notes"}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewDialogOpen(false);
                    openEditProject(viewingProject);
                  }}
                >
                  Edit Project
                </Button>
                <Button onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label} className="border-border/50">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm print:hidden">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_220px_auto] xl:items-center">
          <div className="relative min-w-0">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />

            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search project no, project name, or customer..."
              className="h-11 rounded-xl pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Quoted">Quoted</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="On Hold">On Hold</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:flex xl:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrint}
              className="h-10 gap-2 rounded-xl text-xs font-bold"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handlePrint}
              className="h-10 gap-2 rounded-xl text-xs font-bold"
            >
              <FileDown className="h-4 w-4" />
              PDF
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleExportCsv}
              className="h-10 gap-2 rounded-xl text-xs font-bold"
            >
              <FileSpreadsheet className="h-4 w-4" />
              CSV
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleExportExcel}
              className="h-10 gap-2 rounded-xl text-xs font-bold"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
          </div>
        </div>
      </div>

      {filteredProjects.length > 0 ? (
        <>
          <div className="hidden md:block">
            <Card className="border-border/50">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-100">
                    <TableRow className="hover:bg-slate-100">
                      <TableHead>Project No</TableHead>
                      <TableHead>Project Name</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">
                        Contract Value
                      </TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Est. Completion</TableHead>
                      <TableHead className="text-right print:hidden">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredProjects.map((project) => (
                      <TableRow key={project.project_id}>
                        <TableCell className="font-medium">
                          {project.project_no}
                        </TableCell>

                        <TableCell>{project.project_name}</TableCell>

                        <TableCell>
                          {project.customers?.customer_name ?? "No customer"}
                        </TableCell>

                        <TableCell>{project.project_type ?? "-"}</TableCell>

                        <TableCell>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${statusBadge[project.project_status] ??
                              "bg-muted text-muted-foreground"
                              }`}
                          >
                            {project.project_status}
                          </span>
                        </TableCell>

                        <TableCell className="text-right">
                          {project.contract_value !== null
                            ? Number(project.contract_value).toLocaleString(
                              "en-AU",
                              {
                                style: "currency",
                                currency: "AUD",
                              }
                            )
                            : "-"}
                        </TableCell>

                        <TableCell>
                          {project.start_date
                            ? new Date(project.start_date).toLocaleDateString(
                              "en-AU"
                            )
                            : "-"}
                        </TableCell>

                        <TableCell>
                          {project.estimated_completion_date
                            ? new Date(
                              project.estimated_completion_date
                            ).toLocaleDateString("en-AU")
                            : "-"}
                        </TableCell>

                        <TableCell className="w-[210px] text-right print:hidden">
                          <StandardActions
                            isActive={project.is_active}
                            onView={() => openViewProject(project)}
                            onEdit={() => openEditProject(project)}
                            onToggleActive={() =>
                              toggleProjectActive.mutate({
                                projectId: project.project_id,
                                isActive: !project.is_active,
                              })
                            }
                            onDelete={() =>
                              deleteProject.mutate(project.project_id)
                            }
                            isStatusPending={toggleProjectActive.isPending}
                            isDeletePending={deleteProject.isPending}
                            size="desktop"
                            align="end"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:hidden">
            {filteredProjects.map((project) => (
              <Card key={project.project_id} className="border-border/50">
                <CardContent className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold leading-tight">
                        {project.project_name}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {project.project_no}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${statusBadge[project.project_status] ??
                        "bg-muted text-muted-foreground"
                        }`}
                    >
                      {project.project_status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="col-span-2 rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Customer
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {project.customers?.customer_name ?? "No customer"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Type
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {project.project_type ?? "-"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Contract Value
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {project.contract_value !== null
                          ? Number(project.contract_value).toLocaleString(
                            "en-AU",
                            {
                              style: "currency",
                              currency: "AUD",
                            }
                          )
                          : "-"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Start Date
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {project.start_date
                          ? new Date(project.start_date).toLocaleDateString(
                            "en-AU"
                          )
                          : "-"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Est. Completion
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {project.estimated_completion_date
                          ? new Date(
                            project.estimated_completion_date
                          ).toLocaleDateString("en-AU")
                          : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-4 print:hidden">
                    <StandardActions
                      isActive={project.is_active}
                      onView={() => openViewProject(project)}
                      onEdit={() => openEditProject(project)}
                      onToggleActive={() =>
                        toggleProjectActive.mutate({
                          projectId: project.project_id,
                          isActive: !project.is_active,
                        })
                      }
                      onDelete={() =>
                        deleteProject.mutate(project.project_id)
                      }
                      isStatusPending={toggleProjectActive.isPending}
                      isDeletePending={deleteProject.isPending}
                      size="mobile"
                      align="end"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderKanban className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">
              No projects yet. Create your first one!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}