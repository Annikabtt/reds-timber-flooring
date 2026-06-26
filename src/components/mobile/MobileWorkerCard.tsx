import { Button } from "@/components/ui/button";

type MobileWorkerCardProps = {
  workerNumber: number;
  canRemove: boolean;
  onRemove: () => void;
  children: React.ReactNode;
};

export function MobileWorkerCard({
  workerNumber,
  canRemove,
  onRemove,
  children,
}: MobileWorkerCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <p className="text-sm font-bold text-slate-900">
            Worker #{workerNumber}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Labour, activity, hours, and completed quantity.
          </p>
        </div>

        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-9 rounded-xl px-3 text-red-600 hover:text-red-700"
          >
            Remove
          </Button>
        )}
      </div>

      {children}
    </div>
  );
}