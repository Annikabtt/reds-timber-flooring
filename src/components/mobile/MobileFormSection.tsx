import { ReactNode } from "react";

type MobileFormSectionProps = {
  title: string;
  children: ReactNode;
};

export function MobileFormSection({
  title,
  children,
}: MobileFormSectionProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-bold text-slate-900">{title}</h3>

      <div className="space-y-4">{children}</div>
    </div>
  );
}