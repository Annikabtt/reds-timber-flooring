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
        <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-white px-3 shadow-sm md:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <SidebarTrigger className="h-10 w-10 shrink-0 rounded-xl border bg-white" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight text-slate-900">
                REDS Timber
              </p>
              <p className="truncate text-xs leading-tight text-slate-500">
                Site Management
              </p>
            </div>
          </div>

          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="bg-red-600 text-white text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>

        <main className="flex-1 w-full max-w-none overflow-x-hidden bg-slate-50">
          <div className="w-full px-3 py-4 md:px-6 md:py-6">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
