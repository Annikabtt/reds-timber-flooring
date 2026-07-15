import {
  LayoutDashboard,
  FolderKanban,
  Camera,
  Users,
  DollarSign,
  Settings,
  LogOut,
  ClipboardList,
  Truck,
  Database,
  PackagePlus,
  SlidersHorizontal,
} from "lucide-react";

import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import redsLogo from "@/assets/reds-logo.png";

const desktopNavItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Customers", url: "/customers", icon: Users },
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "Project Sites", url: "/project-sites", icon: FolderKanban },
  { title: "Project Areas", url: "/project-areas", icon: FolderKanban },

  { title: "Work Orders", url: "/work-orders", icon: FolderKanban },
  { title: "Daily Progress Review", url: "/daily-reports", icon: Camera },
  { title: "Suppliers", url: "/suppliers", icon: Truck },
  {
    title: "Stock Requests",
    url: "/stock-requests",
    icon: PackagePlus,
  },
  { title: "Employees", url: "/employees", icon: Users },
  { title: "Payroll Periods", url: "/payroll-periods", icon: DollarSign },
  { title: "Payroll Entries", url: "/payroll-entries", icon: DollarSign },

  { title: "Photo Approval", url: "/photos", icon: Camera },

  { title: "Master Data", url: "/master-data", icon: Database },
  { title: "Product Attributes", url: "/product-attributes", icon: SlidersHorizontal },
  { title: "Settings", url: "/settings", icon: Settings },
];

const workerNavItems = [
  { title: "My Work", url: "/my-work", icon: ClipboardList },
];


export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, signOut } = useAuth();
  const appRole = user?.app_metadata?.app_role;
  const navItems = appRole === "worker" ? workerNavItems : desktopNavItems;

  const initials = user?.user_metadata?.display_name
    ? user.user_metadata.display_name.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? "U";

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        {collapsed ? (
          <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center shrink-0 overflow-hidden">
            <img src={redsLogo} alt="REDS Timber Flooring" className="h-7 w-auto" />
          </div>
        ) : (
          <img
            src={redsLogo}
            alt="REDS Timber Flooring"
            className="h-12 w-auto object-contain"
          />
        )}
      </div>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    onClick={() => {
                      if (isMobile) {
                        setOpenMobile(false);
                      }
                    }}
                  >
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      onClick={() => {
                        window.setTimeout(() => {
                          setOpenMobile(false);
                        }, 0);
                      }}
                      className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground md:min-h-0 md:py-2.5"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-3 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.user_metadata?.display_name || user?.email}
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={signOut}
              className="text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
