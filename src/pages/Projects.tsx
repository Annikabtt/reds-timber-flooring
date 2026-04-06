import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Plus, FolderKanban } from "lucide-react";

type ProjectStatus = "active" | "completed" | "on_hold" | "archived";

const statusBadge: Record<string, string> = {
  active: "bg-success/15 text-success",
  completed: "bg-primary/15 text-primary",
  on_hold: "bg-warning/15 text-warning",
  archived: "bg-muted text-muted-foreground",
};

export default function Projects() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>("active");
  const [dueDate, setDueDate] = useState("");

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: tasksByProject } = useQuery({
    queryKey: ["tasks-by-project"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("project_id, status");
      if (error) throw error;
      const map: Record<string, { total: number; done: number }> = {};
      data.forEach((t) => {
        if (!t.project_id) return;
        if (!map[t.project_id]) map[t.project_id] = { total: 0, done: 0 };
        map[t.project_id].total++;
        if (t.status === "done") map[t.project_id].done++;
      });
      return map;
    },
  });

  const createProject = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("projects").insert({
        name,
        description: description || null,
        status: projectStatus,
        due_date: dueDate || null,
        owner_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-count"] });
      setDialogOpen(false);
      setName("");
      setDescription("");
      setProjectStatus("active");
      setDueDate("");
      toast({ title: "Project created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">Track progress across your projects</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> New Project</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Project</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createProject.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={projectStatus} onValueChange={(v) => setProjectStatus(v as ProjectStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createProject.isPending}>
                {createProject.isPending ? "Creating..." : "Create Project"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const stats = tasksByProject?.[project.id];
            const progress = stats ? Math.round((stats.done / stats.total) * 100) : 0;
            return (
              <Card key={project.id} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FolderKanban className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{project.name}</h3>
                        {project.due_date && (
                          <p className="text-xs text-muted-foreground">
                            Due {new Date(project.due_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge[project.status]}`}>
                      {project.status.replace("_", " ")}
                    </span>
                  </div>
                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                  )}
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                      <span>Progress</span>
                      <span>{stats ? `${stats.done}/${stats.total} tasks` : "0 tasks"}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderKanban className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">No projects yet. Create your first one!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
