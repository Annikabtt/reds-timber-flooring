import { Eye, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Assignment = {
  work_assignment_id: string;
  is_deleted: boolean | null;
  employees: {
    employee_code: string | null;
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
};

type AreaProgress = {
  area_id: string | null;
  actual_quantity: number | null;
  progress_percent: number | null;
  unit_of_measure: string | null;
};

type WorkOrder = {
  work_order_id: string;
  work_order_no: string | null;
  title: string | null;
  priority: string | null;
  status: string | null;
  area_id: string | null;
  projects: {
    project_no: string | null;
    project_name: string | null;
    customers: {
      customer_name: string | null;
    } | null;
  } | null;
  project_sites: {
    site_code: string | null;
    site_name: string | null;
  } | null;
  project_areas: {
    area_code: string | null;
    area_name: string | null;
  } | null;
  work_assignments: Assignment[] | null;
};

type MobileWorkOrderCardProps = {
  workOrder: WorkOrder;
  progress: AreaProgress | undefined;
  getPriorityBadgeClass: (priority: string | null) => string;
  getStatusBadgeClass: (status: string | null) => string;
  onView: () => void;
  onEdit: () => void;
};

const getEmployeeName = (assignment: Assignment) => {
  const employee = assignment.employees;

  if (!employee) return "-";

  return (
    employee.display_name ||
    `${employee.first_name || ""} ${employee.last_name || ""}`.trim() ||
    employee.employee_code ||
    "-"
  );
};

const MobileWorkOrderCard = ({
  workOrder,
  progress,
  getPriorityBadgeClass,
  getStatusBadgeClass,
  onView,
  onEdit,
}: MobileWorkOrderCardProps) => {
  const activeAssignments =
    workOrder.work_assignments?.filter((assignment) => !assignment.is_deleted) ||
    [];

  const visibleAssignments = activeAssignments.slice(0, 3);
  const hiddenAssignmentCount = Math.max(activeAssignments.length - 3, 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="line-clamp-2 text-base font-bold leading-snug text-slate-900">
            {workOrder.title || "-"}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500">
            {workOrder.work_order_no || "-"}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge
            variant="outline"
            className={getPriorityBadgeClass(workOrder.priority)}
          >
            {workOrder.priority || "-"}
          </Badge>

          <Badge
            variant="outline"
            className={getStatusBadgeClass(workOrder.status)}
          >
            {workOrder.status || "-"}
          </Badge>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2">
        <div className="rounded-xl bg-slate-50 px-3 py-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Project
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">
            {workOrder.projects?.project_name || "-"}
          </p>
          <p className="truncate text-xs text-slate-500">
            {workOrder.projects?.project_no || "-"} ·{" "}
            {workOrder.projects?.customers?.customer_name || "-"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Site
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">
              {workOrder.project_sites?.site_name || "-"}
            </p>
            <p className="truncate text-xs text-slate-500">
              {workOrder.project_sites?.site_code || "-"}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Area
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">
              {workOrder.project_areas?.area_name || "-"}
            </p>
            <p className="truncate text-xs text-slate-500">
              {workOrder.project_areas?.area_code || "-"}
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Progress
            </p>
            <p className="text-sm font-bold text-slate-900">
              {progress
                ? `${Number(progress.progress_percent || 0).toFixed(2)}%`
                : "-"}
            </p>
          </div>

          <p className="mt-0.5 text-xs text-slate-500">
            Completed:{" "}
            {progress
              ? `${progress.actual_quantity || 0}${progress.unit_of_measure || ""}`
              : "-"}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 px-3 py-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
            Assigned Workers
          </p>

          {activeAssignments.length === 0 ? (
            <p className="mt-1 text-sm text-slate-400">No workers assigned</p>
          ) : (
            <div className="mt-1 space-y-1">
              {visibleAssignments.map((assignment) => (
                <p
                  key={assignment.work_assignment_id}
                  className="truncate text-sm text-slate-700"
                >
                  {assignment.employees?.employee_code || "-"} -{" "}
                  {getEmployeeName(assignment)}
                </p>
              ))}

              {hiddenAssignmentCount > 0 && (
                <p className="text-xs font-medium text-slate-500">
                  +{hiddenAssignmentCount} more worker
                  {hiddenAssignmentCount > 1 ? "s" : ""}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onView}
          className="h-10 w-full gap-2"
        >
          <Eye className="h-4 w-4" />
          View
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onEdit}
          className="h-10 w-full gap-2"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
      </div>
    </div>
  );
};

export default MobileWorkOrderCard;