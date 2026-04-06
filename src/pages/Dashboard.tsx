import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckSquare, FolderKanban, Contact, TrendingUp, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: taskCounts } = useQuery({
    queryKey: ["task-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("status");
      if (error) throw error;
      const todo = data.filter((t) => t.status === "todo").length;
      const inProgress = data.filter((t) => t.status === "in_progress").length;
      const done = data.filter((t) => t.status === "done").length;
      return { total: data.length, todo, inProgress, done };
    },
  });

  const { data: projectCount } = useQuery({
    queryKey: ["project-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("projects").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: contactCount } = useQuery({
    queryKey: ["contact-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("contacts").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: recentTasks } = useQuery({
    queryKey: ["recent-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, status, priority, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "there";

  const stats = [
    {
      title: "Open Tasks",
      value: (taskCounts?.todo ?? 0) + (taskCounts?.inProgress ?? 0),
      icon: CheckSquare,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Active Projects",
      value: projectCount ?? 0,
      icon: FolderKanban,
      color: "text-secondary",
      bg: "bg-secondary/10",
    },
    {
      title: "Contacts",
      value: contactCount ?? 0,
      icon: Contact,
      color: "text-info",
      bg: "bg-info/10",
    },
    {
      title: "Completed",
      value: taskCounts?.done ?? 0,
      icon: TrendingUp,
      color: "text-success",
      bg: "bg-success/10",
    },
  ];

  const priorityColors: Record<string, string> = {
    urgent: "bg-destructive/15 text-destructive",
    high: "bg-warning/15 text-warning",
    medium: "bg-info/15 text-info",
    low: "bg-muted text-muted-foreground",
  };

  const statusLabels: Record<string, string> = {
    todo: "To Do",
    in_progress: "In Progress",
    done: "Done",
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Hey, {displayName} 👋
          </h1>
          <p className="text-muted-foreground mt-1">Here's what's happening today</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/tasks")} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> New Task
          </Button>
          <Button onClick={() => navigate("/projects")} size="sm" variant="outline" className="gap-1.5">
            <Plus className="h-4 w-4" /> New Project
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`h-12 w-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg">Recent Tasks</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/tasks")}>
              View all
            </Button>
          </CardHeader>
          <CardContent>
            {recentTasks && recentTasks.length > 0 ? (
              <div className="space-y-3">
                {recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <CheckSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[task.priority]}`}>
                        {task.priority}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {statusLabels[task.status]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No tasks yet. Create your first task to get started!
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={() => navigate("/tasks")}
            >
              <CheckSquare className="h-5 w-5 text-primary" />
              Create a new task
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={() => navigate("/projects")}
            >
              <FolderKanban className="h-5 w-5 text-secondary" />
              Start a new project
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={() => navigate("/contacts")}
            >
              <Contact className="h-5 w-5 text-info" />
              Add a contact
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
