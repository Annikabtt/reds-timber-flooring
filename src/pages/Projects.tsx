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
import { FolderKanban } from "lucide-react";

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
          project_name,
          project_type,
          project_status,
          contract_value,
          start_date,
          estimated_completion_date,
          notes,
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
      setCustomerId("");
      setProjectName("");
      setProjectType("Residential");
      setProjectStatus("Draft");
      setContractValue("");
      setStartDate("");
      setEstimatedCompletionDate("");
      setNotes("");
      toast({ title: "Project created" });
    },
    onError: (e: Error) =>
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive",
      }),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Track project records from REDS database.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createProject.mutate();
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
                disabled={createProject.isPending}
              >
                {createProject.isPending ? "Creating..." : "Create Project"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search project no, project name, or customer..."
          className="md:max-w-md"
        />

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="md:w-48">
            <SelectValue />
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
      </div>

      {filteredProjects.length > 0 ? (
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
                  <TableHead className="text-right">Contract Value</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Est. Completion</TableHead>
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
                        ? Number(project.contract_value).toLocaleString("en-AU", {
                          style: "currency",
                          currency: "AUD",
                        })
                        : "-"}
                    </TableCell>

                    <TableCell>
                      {project.start_date
                        ? new Date(project.start_date).toLocaleDateString("en-AU")
                        : "-"}
                    </TableCell>

                    <TableCell>
                      {project.estimated_completion_date
                        ? new Date(
                          project.estimated_completion_date
                        ).toLocaleDateString("en-AU")
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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