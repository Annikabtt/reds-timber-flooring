import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FolderKanban,
  HardHat,
  Camera,
  DollarSign,
  Check,
  X,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Demo data for photo approval (no DB table yet)
const pendingPhotos = [
  { id: 1, project: "Smith Residence — Kitchen", tech: "Mike R.", time: "12 min ago", thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=80&h=80&fit=crop" },
  { id: 2, project: "Oak Valley Office — Lobby", tech: "James T.", time: "28 min ago", thumbnail: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=80&h=80&fit=crop" },
  { id: 3, project: "Maple Court — Hallway", tech: "Sarah L.", time: "1h ago", thumbnail: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=80&h=80&fit=crop" },
];

export default function Dashboard() {
  const { data: projectData } = useQuery({
    queryKey: ["dashboard-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, status")
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  const { data: projectCount } = useQuery({
    queryKey: ["project-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: teamCount } = useQuery({
    queryKey: ["team-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const statusColors: Record<string, string> = {
    active: "bg-primary/10 text-primary",
    completed: "bg-success/15 text-success",
    on_hold: "bg-warning/15 text-warning",
    archived: "bg-muted text-muted-foreground",
  };

  const statusLabels: Record<string, string> = {
    active: "In Progress",
    completed: "Complete",
    on_hold: "Material Prep",
    archived: "Archived",
  };

  const stats = [
    {
      title: "Active Projects",
      value: projectCount ?? 0,
      icon: FolderKanban,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Technicians On-site",
      value: teamCount ?? 0,
      icon: HardHat,
      color: "text-info",
      bg: "bg-info/10",
    },
    {
      title: "Photos Pending",
      value: pendingPhotos.length,
      icon: Camera,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      title: "Weekly Payroll Est.",
      value: "$4,200",
      icon: DollarSign,
      color: "text-success",
      bg: "bg-success/10",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Red's Timber Flooring — Operations Overview
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-sm">
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

      {/* Split view */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Photo approval */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recent Photo Updates</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingPhotos.length > 0 ? (
              <div className="space-y-3">
                {pendingPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <img
                      src={photo.thumbnail}
                      alt={photo.project}
                      className="h-14 w-14 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{photo.project}</p>
                      <p className="text-xs text-muted-foreground">
                        {photo.tech} · {photo.time}
                      </p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Button size="sm" variant="outline" className="h-8 gap-1 border-success/30 text-success hover:bg-success/10 hover:text-success">
                        <Check className="h-3.5 w-3.5" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 gap-1 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive">
                        <X className="h-3.5 w-3.5" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No photos pending approval.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Active projects table */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Active Projects Status</CardTitle>
          </CardHeader>
          <CardContent>
            {projectData && projectData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectData.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={statusColors[project.status] ?? ""}
                        >
                          {statusLabels[project.status] ?? project.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No projects yet. Create your first project to get started!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
