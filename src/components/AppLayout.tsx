import { ReactNode } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";




export function AppLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
 

  const initials = user?.user_metadata?.display_name
    ? user.user_metadata.display_name.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? "U";

  return (
  <SidebarProvider>
    <AppSidebar />

    <SidebarInset>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b bg-white px-4 py-3 md:hidden">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="h-9 w-9" />
          <span className="font-bold text-slate-900">REDS</span>
        </div>

        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-red-600 text-white text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>

      <main className="flex-1 w-full max-w-none px-2 py-4 md:py-6 overflow-auto">
        {children}
      </main>
    </SidebarInset>
  </SidebarProvider>
);
}
