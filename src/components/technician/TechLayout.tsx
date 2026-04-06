import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function TechLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[hsl(30,20%,97%)] max-w-lg mx-auto relative">
      <main className="pb-24 px-4 pt-4">{children}</main>
      <BottomNav />
    </div>
  );
}
