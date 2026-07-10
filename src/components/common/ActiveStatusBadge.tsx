type ActiveStatusBadgeProps = {
    isActive: boolean;
    onClick?: () => void;
    disabled?: boolean;
    title?: string;
    className?: string;
};

export const ActiveStatusBadge = ({
    isActive,
    onClick,
    disabled = false,
    title,
    className = "",
}: ActiveStatusBadgeProps) => {
    const statusClassName = isActive
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-slate-200 bg-slate-100 text-slate-600";

    const sharedClassName = [
        "inline-flex min-h-7 items-center justify-center rounded-full border px-3 py-1",
        "text-xs font-bold leading-none",
        statusClassName,
        className,
    ]
        .filter(Boolean)
        .join(" ");

    if (!onClick) {
        return (
            <span className={sharedClassName}>
                {isActive ? "Active" : "Inactive"}
            </span>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={
                title ??
                (isActive ? "Mark inactive" : "Reactivate")
            }
            className={[
                sharedClassName,
                "transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2",
                disabled
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer hover:brightness-95",
            ].join(" ")}
        >
            {isActive ? "Active" : "Inactive"}
        </button>
    );
};