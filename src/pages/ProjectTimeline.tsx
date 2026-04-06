import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle2, Circle, Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const timelineSteps = [
  { label: "Site Preparation", status: "completed" as const, date: "Mar 10" },
  { label: "Flooring Installation", status: "in_progress" as const, date: "Mar 18" },
  { label: "Final Inspection & Cleanup", status: "pending" as const, date: "Apr 2" },
  { label: "Project Handover", status: "pending" as const, date: "Apr 8" },
];

const teamMembers = [
  { name: "Mike R.", role: "Lead Installer", status: "On-site", initials: "MR" },
  { name: "James T.", role: "Technician", status: "On-site", initials: "JT" },
  { name: "Sarah L.", role: "Technician", status: "Off-site", initials: "SL" },
];

const statusIcon = {
  completed: <CheckCircle2 className="h-5 w-5 text-[hsl(142,55%,40%)]" />,
  in_progress: <Loader2 className="h-5 w-5 text-primary animate-spin" />,
  pending: <Circle className="h-5 w-5 text-muted-foreground/40" />,
};

const statusBadge = {
  completed: { label: "Completed", className: "bg-[hsl(142,55%,40%)]/10 text-[hsl(142,55%,40%)]" },
  in_progress: { label: "In Progress", className: "bg-primary/10 text-primary" },
  pending: { label: "Pending", className: "bg-muted text-muted-foreground" },
};

export default function ProjectTimeline() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Project Overview: Oak Valley Office</h1>
        <p className="text-muted-foreground text-sm mt-0.5 flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" /> 42 Oak Valley Drive, Melbourne VIC
        </p>
      </div>

      {/* Progress */}
      <Card className="shadow-sm border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Overall Progress</CardTitle>
            <span className="text-2xl font-bold text-primary">75%</span>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={75} className="h-3 rounded-md" />
          <p className="text-xs text-muted-foreground mt-2">Estimated completion: April 8, 2026</p>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="shadow-sm border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Project Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {timelineSteps.map((step, i) => {
              const isLast = i === timelineSteps.length - 1;
              const badge = statusBadge[step.status];
              return (
                <div key={step.label} className="flex gap-4">
                  {/* Vertical line + icon */}
                  <div className="flex flex-col items-center">
                    <div className="mt-0.5">{statusIcon[step.status]}</div>
                    {!isLast && (
                      <div
                        className={cn(
                          "w-px flex-1 my-1",
                          step.status === "completed" ? "bg-[hsl(142,55%,40%)]" : "bg-border"
                        )}
                      />
                    )}
                  </div>
                  {/* Content */}
                  <div className={cn("pb-6", isLast && "pb-0")}>
                    <p className="font-medium leading-tight">{step.label}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{step.date}</span>
                      <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", badge.className)}>
                        {badge.label}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Assigned Team */}
      <Card className="shadow-sm border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Assigned Team</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {teamMembers.map((m) => (
            <div key={m.name} className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {m.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{m.name}</p>
                <p className="text-xs text-muted-foreground">{m.role}</p>
              </div>
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs",
                  m.status === "On-site"
                    ? "bg-[hsl(142,55%,40%)]/10 text-[hsl(142,55%,40%)]"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {m.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
