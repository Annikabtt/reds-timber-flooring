type MobileProgressSummaryProps = {
  progressPercent: string;
  completedQuantity: string;
};

export const MobileProgressSummary = ({
  progressPercent,
  completedQuantity,
}: MobileProgressSummaryProps) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Calculated Progress
          </p>
          <p className="mt-1 text-2xl font-black text-slate-900">
            {Number(progressPercent || 0).toFixed(2)}%
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-slate-500">Completed</p>
          <p className="mt-1 text-sm font-bold text-slate-900">
            {Number(completedQuantity || 0).toFixed(2)} sqm
          </p>
        </div>
      </div>

      <div className="mt-4 h-2 w-full rounded-full bg-white">
        <div
          className="h-2 rounded-full bg-red-600"
          style={{
            width: `${Math.min(Number(progressPercent || 0), 100)}%`,
          }}
        />
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Based on completed quantity versus selected area estimate.
      </p>
    </div>
  );
};