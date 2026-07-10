import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActiveStatusBadge } from "@/components/common/ActiveStatusBadge";

type StandardActionsProps = {
    isActive: boolean;
    onView?: () => void;
    onEdit?: () => void;
    onToggleActive?: () => void;
    onDelete?: () => void;
    isStatusPending?: boolean;
    isDeletePending?: boolean;
    size?: "desktop" | "mobile";
    align?: "start" | "center" | "end";
};

export const StandardActions = ({
    isActive,
    onView,
    onEdit,
    onToggleActive,
    onDelete,
    isStatusPending = false,
    isDeletePending = false,
    size = "desktop",
    align = "end",
}: StandardActionsProps) => {
    const buttonSizeClassName =
        size === "mobile" ? "h-10 w-10" : "h-9 w-9";

    const alignmentClassName =
        align === "start"
            ? "justify-start"
            : align === "center"
                ? "justify-center"
                : "justify-end";

    return (
        <div
            className={`flex items-center gap-2 whitespace-nowrap ${alignmentClassName}`}
        >
            {onView ? (
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={onView}
                    className={`${buttonSizeClassName} rounded-lg`}
                    title="View"
                >
                    <Eye className="h-4 w-4" />
                </Button>
            ) : null}

            {onEdit ? (
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={onEdit}
                    className={`${buttonSizeClassName} rounded-lg`}
                    title="Edit"
                >
                    <Pencil className="h-4 w-4" />
                </Button>
            ) : null}

            {onToggleActive ? (
                <ActiveStatusBadge
                    isActive={isActive}
                    onClick={onToggleActive}
                    disabled={isStatusPending}
                />
            ) : null}

            {onDelete ? (
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={onDelete}
                    disabled={isDeletePending}
                    className={`${buttonSizeClassName} rounded-lg border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700`}
                    title="Delete"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            ) : null}
        </div>
    );
};