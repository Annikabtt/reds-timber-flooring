import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Camera, Send, X } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type DailyReportPhoto =
  Database["public"]["Tables"]["daily_report_photos"]["Row"];
type DailyReport = Database["public"]["Tables"]["daily_reports"]["Row"];
type Project = Database["public"]["Tables"]["projects"]["Row"];
type WorkOrder = Database["public"]["Tables"]["work_orders"]["Row"];
type ProjectArea = Database["public"]["Tables"]["project_areas"]["Row"];

type PhotoApprovalItem = {
  photo: DailyReportPhoto;
  report: DailyReport | null;
  project: Project | null;
  workOrder: WorkOrder | null;
  area: ProjectArea | null;
};
type PhotoAreaGroup = {
  groupKey: string;
  projectName: string;
  areaName: string;
  workOrderLabel: string;
  reportDateLabel: string;
  photos: PhotoApprovalItem[];
};

const uniqueIds = (values: Array<string | null>) =>
  Array.from(new Set(values.filter((value): value is string => Boolean(value))));

export default function PhotoApproval() {
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["photo_approval_pending"],
    queryFn: async (): Promise<PhotoApprovalItem[]> => {
      const { data: photos, error: photosError } = await supabase
        .from("daily_report_photos")
        .select("*")
        .eq("is_deleted", false)
        .eq("approval_status", "Pending")
        .order("created_at", { ascending: false });

      if (photosError) throw photosError;

      const reportIds = uniqueIds((photos || []).map((photo) => photo.report_id));

      if (reportIds.length === 0) return [];

      const { data: reports, error: reportsError } = await supabase
        .from("daily_reports")
        .select("*")
        .in("report_id", reportIds)
        .eq("is_deleted", false);

      if (reportsError) throw reportsError;

      const projectIds = uniqueIds((reports || []).map((report) => report.project_id));
      const workOrderIds = uniqueIds(
        (reports || []).map((report) => report.work_order_id)
      );
      const areaIds = uniqueIds((reports || []).map((report) => report.area_id));

      const { data: projects, error: projectsError } =
        projectIds.length > 0
          ? await supabase
            .from("projects")
            .select("*")
            .in("project_id", projectIds)
            .eq("is_deleted", false)
          : { data: [], error: null };

      if (projectsError) throw projectsError;

      const { data: workOrders, error: workOrdersError } =
        workOrderIds.length > 0
          ? await supabase
            .from("work_orders")
            .select("*")
            .in("work_order_id", workOrderIds)
            .eq("is_deleted", false)
          : { data: [], error: null };

      if (workOrdersError) throw workOrdersError;

      const { data: areas, error: areasError } =
        areaIds.length > 0
          ? await supabase
            .from("project_areas")
            .select("*")
            .in("area_id", areaIds)
            .eq("is_deleted", false)
          : { data: [], error: null };

      if (areasError) throw areasError;

      return (photos || []).map((photo) => {
        const report =
          (reports || []).find((item) => item.report_id === photo.report_id) ||
          null;

        const project =
          report && projects
            ? projects.find((item) => item.project_id === report.project_id) ||
            null
            : null;

        const workOrder =
          report && workOrders
            ? workOrders.find(
              (item) => item.work_order_id === report.work_order_id
            ) || null
            : null;

        const area =
          report && areas
            ? areas.find((item) => item.area_id === report.area_id) || null
            : null;

        return {
          photo,
          report,
          project,
          workOrder,
          area,
        };
      });
    },
  });

  const pendingCount = useMemo(() => items.length, [items]);
  const groupedItems = useMemo<PhotoAreaGroup[]>(() => {
    const groups = new Map<string, PhotoAreaGroup>();

    items.forEach((item) => {
      const projectName = item.project?.project_name || "Unknown Project";
      const areaName = item.area
        ? `${item.area.area_code || "-"} - ${item.area.area_name}`
        : "Unknown Area";

      const workOrderLabel = item.workOrder
        ? `${item.workOrder.work_order_no || "-"} · ${item.workOrder.title || "-"}`
        : "-";

      const reportDateLabel = item.report?.report_date || "-";

      const groupKey = `${item.project?.project_id || "no-project"}-${item.area?.area_id || "no-area"
        }-${item.workOrder?.work_order_id || "no-work-order"}`;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          groupKey,
          projectName,
          areaName,
          workOrderLabel,
          reportDateLabel,
          photos: [],
        });
      }

      groups.get(groupKey)?.photos.push(item);
    });

    return Array.from(groups.values());
  }, [items]);

  const approvePhoto = useMutation({
    mutationFn: async (photoId: string) => {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("daily_report_photos")
        .update({
          approval_status: "Approved",
          approved_by: userData.user?.id || null,
          approved_at: new Date().toISOString(),
          rejected_reason: null,
        })
        .eq("photo_id", photoId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Photo approved.");
      queryClient.invalidateQueries({ queryKey: ["photo_approval_pending"] });
      queryClient.invalidateQueries({ queryKey: ["daily_reports"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const rejectPhoto = useMutation({
    mutationFn: async (photoId: string) => {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("daily_report_photos")
        .update({
          approval_status: "Rejected",
          approved_by: userData.user?.id || null,
          approved_at: new Date().toISOString(),
          rejected_reason: "Rejected from photo approval page",
        })
        .eq("photo_id", photoId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Photo rejected.");
      queryClient.invalidateQueries({ queryKey: ["photo_approval_pending"] });
      queryClient.invalidateQueries({ queryKey: ["daily_reports"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return <div className="p-6 text-slate-500">Loading photos...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Photo Approval</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Review and approve daily report photo uploads.
          </p>
        </div>

        <Badge variant="outline" className="text-sm">
          Pending: {pendingCount}
        </Badge>
      </div>

      <div className="space-y-6">
        {groupedItems.map((group) => (
          <Card key={group.groupKey} className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-lg">{group.projectName}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Area: {group.areaName}
                </p>
                <p className="text-sm text-muted-foreground">
                  Work Order: {group.workOrderLabel}
                </p>
                <p className="text-sm text-muted-foreground">
                  Report Date: {group.reportDateLabel}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant="outline" className="w-fit">
                    Photos: {group.photos.length}
                  </Badge>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled
                    title="Telegram sending will be added later"
                    className="gap-1"
                  >
                    <Send className="h-4 w-4" />
                    Send Telegram
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {group.photos.map(({ photo, project }) => (
                  <Card key={photo.photo_id} className="overflow-hidden shadow-sm">
                    <img
                      src={photo.photo_url}
                      alt={
                        photo.caption ||
                        project?.project_name ||
                        "Daily report photo"
                      }
                      className="w-full h-40 object-cover bg-slate-100"
                    />

                    <CardContent className="p-3 space-y-3">
                      <div className="h-12">
                        <p className="text-sm line-clamp-2">
                          {photo.caption || "-"}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 gap-1 bg-green-600 hover:bg-green-700 text-white"
                          disabled={
                            approvePhoto.isPending || rejectPhoto.isPending
                          }
                          onClick={() => approvePhoto.mutate(photo.photo_id)}
                        >
                          <Check className="h-4 w-4" />
                          Approve
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-1 border-red-300 text-red-600 hover:bg-red-50"
                          disabled={
                            approvePhoto.isPending || rejectPhoto.isPending
                          }
                          onClick={() => rejectPhoto.mutate(photo.photo_id)}
                        >
                          <X className="h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {items.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <Camera className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">
              No photos pending approval
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}