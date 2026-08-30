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
  Package,
  PackagePlus,
  PackageCheck,
  Barcode,
  FileText,
  ClipboardCheck,
  GitBranchPlus,
  SlidersHorizontal,
  UserCog,
  BellRing,
  ChevronDown,
  BriefcaseBusiness,
  Wrench,
  FileBarChart,
  ShieldCheck,
  ShoppingCart,
  ReceiptText,
  HandCoins,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import redsLogo from "@/assets/reds-logo.png";

type NavItemPermission =
  | "dashboard"
  | "users"
  | "telegram"
  | "invoices"
  | "payments"
  | "stockIssues"
  | "toolLoans"
  | "goodsReceiving";

type NavItem = {
  title: string;
  url: string;
  icon: typeof LayoutDashboard;
  permission?: NavItemPermission;
};

type NavGroup = {
  id: string;
  title: string;
  icon: typeof LayoutDashboard;
  items: NavItem[];
};

const dashboardItem: NavItem = {
  title: "Dashboard",
  url: "/dashboard",
  icon: LayoutDashboard,
  permission: "dashboard",
};

const desktopNavGroups: NavGroup[] = [
  {
    id: "customers-projects",
    title: "Customers & Projects",
    icon: BriefcaseBusiness,
    items: [
      { title: "Customers", url: "/customers", icon: Users },
      { title: "Projects", url: "/projects", icon: FolderKanban },
      { title: "Project Sites", url: "/project-sites", icon: FolderKanban },
      { title: "Project Areas", url: "/project-areas", icon: FolderKanban },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    icon: Wrench,
    items: [
      { title: "Work Orders", url: "/work-orders", icon: FolderKanban },
      {
        title: "Daily Progress Review",
        url: "/daily-reports",
        icon: Camera,
      },
      {
        title: "Material Requirements",
        url: "/material-requirements",
        icon: ClipboardCheck,
      },
      {
        title: "Stock Requests",
        url: "/stock-requests",
        icon: PackagePlus,
      },
      {
        title: "Stock Issues",
        url: "/stock-issues",
        icon: PackageCheck,
        permission: "stockIssues",
      },
      {
        title: "Tool Loans",
        url: "/tool-loans",
        icon: Wrench,
        permission: "toolLoans",
      },
      {
        title: "Purchase Orders",
        url: "/purchase-orders",
        icon: ShoppingCart,
      },
      {
        title: "Goods Receiving",
        url: "/goods-receiving",
        icon: PackageCheck,
        permission: "goodsReceiving",
      },
    ],
  },
  {
    id: "sales-commercial",
    title: "Sales & Commercial",
    icon: FileText,
    items: [
      { title: "Quotations", url: "/quotations", icon: FileText },
      { title: "Variations", url: "/variations", icon: GitBranchPlus },
      {
        title: "Invoices",
        url: "/invoices",
        icon: ReceiptText,
        permission: "invoices",
      },
      {
        title: "Payments",
        url: "/payments",
        icon: HandCoins,
        permission: "payments",
      },
    ],
  },
  {
    id: "team-payroll",
    title: "Team & Payroll",
    icon: Users,
    items: [
      { title: "Team Members", url: "/employees", icon: Users },
      {
        title: "Payroll Periods",
        url: "/payroll-periods",
        icon: DollarSign,
      },
      {
        title: "Payroll Entries",
        url: "/payroll-entries",
        icon: DollarSign,
      },
    ],
  },
  {
    id: "products-suppliers",
    title: "Products & Suppliers",
    icon: Package,
    items: [
      { title: "Products", url: "/products", icon: Package },
      { title: "Suppliers", url: "/suppliers", icon: Truck },
      {
        title: "Product Attributes",
        url: "/product-attributes",
        icon: SlidersHorizontal,
      },
      {
        title: "Product Code Management",
        url: "/product-code-management",
        icon: Barcode,
      },
    ],
  },
  {
    id: "customize-reports",
    title: "Customize Reports",
    icon: FileBarChart,
    items: [
      {
        title: "Variation Record",
        url: "/variation-records",
        icon: FileBarChart,
      },
    ],
  },
  {
    id: "review-approval",
    title: "Review & Approval",
    icon: ShieldCheck,
    items: [{ title: "Photo Approval", url: "/photos", icon: Camera }],
  },
  {
    id: "administration",
    title: "Administration",
    icon: Settings,
    items: [
      { title: "Master Data", url: "/master-data", icon: Database },
      {
        title: "User Management",
        url: "/admin/users",
        icon: UserCog,
        permission: "users",
      },
      {
        title: "Telegram Notifications",
        url: "/admin/telegram-notifications",
        icon: BellRing,
        permission: "telegram",
      },
      { title: "Settings", url: "/settings", icon: Settings },
    ],
  },
];

const workerNavItems: NavItem[] = [
  { title: "My Work", url: "/my-work", icon: ClipboardList },
  {
    title: "Goods Receiving",
    url: "/goods-receiving",
    icon: PackageCheck,
    permission: "goodsReceiving",
  },
];

const isPathActive = (pathname: string, url: string) =>
  pathname === url || pathname.startsWith(`${url}/`);

export function AppSidebar() {
  const { state, isMobile, setOpen, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, signOut } = useAuth();

  const [canViewDashboard, setCanViewDashboard] = useState(false);
  const [canViewUsers, setCanViewUsers] = useState(false);
  const [canViewTelegramNotifications, setCanViewTelegramNotifications] =
    useState(false);
  const [canViewInvoices, setCanViewInvoices] = useState(false);
  const [canViewPayments, setCanViewPayments] = useState(false);
  const [canViewStockIssues, setCanViewStockIssues] = useState(false);
  const [canViewToolLoans, setCanViewToolLoans] = useState(false);
  const [canViewGoodsReceiving, setCanViewGoodsReceiving] = useState(false);
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);

  const appRole = user?.app_metadata?.app_role;
  const isWorker = appRole === "worker";

  useEffect(() => {
    let mounted = true;

    const loadPermissions = async () => {
      if (!user) {
        if (mounted) {
          setCanViewDashboard(false);
          setCanViewUsers(false);
          setCanViewTelegramNotifications(false);
          setCanViewInvoices(false);
          setCanViewPayments(false);
          setCanViewStockIssues(false);
          setCanViewToolLoans(false);
          setCanViewGoodsReceiving(false);
        }
        return;
      }

      const [
        { data: canDashboard },
        { data: canView },
        { data: canManage },
        { data: canViewTelegram },
        { data: canManageTelegram },
        { data: canInvoices },
        { data: canPayments },
        { data: canStockIssues },
        { data: canToolLoans },
        { data: canViewOwnToolLoans },
        { data: canViewSupplierDeliveries },
        { data: canViewSiteGoodsReceiving },
        { data: canReceiveSiteGoods },
      ] = await Promise.all([
        supabase.rpc("has_permission", {
          p_permission_code: "dashboard.view",
        }),
        supabase.rpc("has_permission", {
          p_permission_code: "users.view",
        }),
        supabase.rpc("has_permission", {
          p_permission_code: "users.manage_accounts",
        }),
        supabase.rpc("has_permission", {
          p_permission_code: "telegram_notifications.view",
        }),
        supabase.rpc("has_permission", {
          p_permission_code: "telegram_notifications.manage",
        }),
        supabase.rpc("has_permission", { p_permission_code: "invoices.view" }),
        supabase.rpc("has_permission", { p_permission_code: "payments.view" }),
        supabase.rpc("has_permission", {
          p_permission_code: "stock_issues.view",
        }),
        supabase.rpc("has_permission", {
          p_permission_code: "tool_loans.view",
        }),
        supabase.rpc("has_permission", {
          p_permission_code: "tool_loans.view_own",
        }),
        supabase.rpc("has_permission", {
          p_permission_code: "supplier_deliveries.view",
        }),
        supabase.rpc("has_permission", {
          p_permission_code: "site_goods_receiving.view",
        }),
        supabase.rpc("has_permission", {
          p_permission_code: "site_goods_receiving.receive",
        }),
      ]);

      if (mounted) {
        setCanViewDashboard(Boolean(canDashboard));
        setCanViewUsers(Boolean(canView || canManage));
        setCanViewTelegramNotifications(
          Boolean(canViewTelegram || canManageTelegram)
        );
        setCanViewInvoices(Boolean(canInvoices));
        setCanViewPayments(Boolean(canPayments));
        setCanViewStockIssues(Boolean(canStockIssues));
        setCanViewToolLoans(Boolean(canToolLoans || canViewOwnToolLoans));
        setCanViewGoodsReceiving(
          Boolean(
            canViewSupplierDeliveries ||
              canViewSiteGoodsReceiving ||
              canReceiveSiteGoods
          )
        );
      }
    };

    void loadPermissions();

    return () => {
      mounted = false;
    };
  }, [user]);

  const canViewNavItem = useCallback(
    (item: NavItem) => {
      if (item.permission === "dashboard") return canViewDashboard;
      if (item.permission === "users") return canViewUsers;
      if (item.permission === "telegram") {
        return canViewTelegramNotifications;
      }
      if (item.permission === "invoices") return canViewInvoices;
      if (item.permission === "payments") return canViewPayments;
      if (item.permission === "stockIssues") return canViewStockIssues;
      if (item.permission === "toolLoans") return canViewToolLoans;
      if (item.permission === "goodsReceiving") {
        return canViewGoodsReceiving;
      }

      return true;
    },
    [
      canViewDashboard,
      canViewGoodsReceiving,
      canViewInvoices,
      canViewPayments,
      canViewStockIssues,
      canViewTelegramNotifications,
      canViewToolLoans,
      canViewUsers,
    ]
  );

  const visibleGroups = useMemo(
    () =>
      desktopNavGroups
        .map((group) => ({
          ...group,
          items: group.items.filter(canViewNavItem),
        }))
        .filter((group) => group.items.length > 0),
    [canViewNavItem]
  );

  const visibleWorkerNavItems = useMemo(
    () => workerNavItems.filter(canViewNavItem),
    [canViewNavItem]
  );

  useEffect(() => {
    if (isWorker) return;

    const activeGroup = visibleGroups.find((group) =>
      group.items.some((item) => isPathActive(location.pathname, item.url))
    );

    if (!activeGroup) return;

    setOpenGroupId(activeGroup.id);
  }, [isWorker, location.pathname, visibleGroups]);

  const closeMobileSidebar = () => {
    if (isMobile) {
      window.setTimeout(() => {
        setOpenMobile(false);
      }, 0);
    }
  };

  const toggleGroup = (groupId: string) => {
    if (collapsed && !isMobile) {
      setOpen(true);
      setOpenGroupId(groupId);
      return;
    }

    setOpenGroupId((current) => (current === groupId ? null : groupId));
  };

  const initials = user?.user_metadata?.display_name
    ? user.user_metadata.display_name.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? "U";

  const renderDirectMenuItem = (item: NavItem) => {
    const active = isPathActive(location.pathname, item.url);

    return (
      <SidebarMenuItem key={item.url}>
        <SidebarMenuButton
          asChild
          isActive={active}
          tooltip={item.title}
          className="min-h-11 rounded-xl md:min-h-0"
        >
          <NavLink
            to={item.url}
            onClick={closeMobileSidebar}
            className="flex items-center gap-3 px-3 py-3 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground md:py-2.5"
            activeClassName="bg-[#F5DEDE] font-semibold text-[#7F3030] shadow-sm ring-1 ring-inset ring-[#B98A8A]/60"
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <div className="flex items-center gap-3 border-b border-sidebar-border px-4 py-5">
        {collapsed ? (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
            <img
              src={redsLogo}
              alt="REDS Timber Flooring"
              className="h-7 w-auto"
            />
          </div>
        ) : (
          <img
            src={redsLogo}
            alt="REDS Timber Flooring"
            className="h-12 w-auto object-contain"
          />
        )}
      </div>

      <SidebarContent className="px-2 py-4">
        {canViewNavItem(dashboardItem) && (
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu>{renderDirectMenuItem(dashboardItem)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {isWorker ? (
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleWorkerNavItems.map(renderDirectMenuItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          visibleGroups.map((group) => {
            const groupActive = group.items.some((item) =>
              isPathActive(location.pathname, item.url)
            );
            const groupOpen = openGroupId === group.id;

            return (
              <SidebarGroup key={group.id} className="p-0">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      type="button"
                      tooltip={group.title}
                      isActive={groupActive}
                      aria-expanded={groupOpen}
                      onClick={() => toggleGroup(group.id)}
                      className={[
                        "min-h-11 rounded-xl px-3 md:min-h-0 md:py-2.5",
                        groupActive
                          ? "bg-[#FBF1F1] font-semibold text-[#7F3030]"
                          : "text-sidebar-foreground/80",
                      ].join(" ")}
                    >
                      <group.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate text-left">
                            {group.title}
                          </span>
                          <ChevronDown
                            className={[
                              "h-4 w-4 shrink-0 transition-transform duration-200",
                              groupOpen ? "rotate-180" : "",
                            ].join(" ")}
                          />
                        </>
                      )}
                    </SidebarMenuButton>

                    {!collapsed && groupOpen && (
                      <SidebarMenuSub className="mb-1 mt-1 border-l-[#B98A8A]/60">
                        {group.items.map((item) => {
                          const active = isPathActive(
                            location.pathname,
                            item.url
                          );

                          return (
                            <SidebarMenuSubItem key={item.url}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={active}
                                className="min-h-10 rounded-lg md:min-h-0"
                              >
                                <NavLink
                                  to={item.url}
                                  onClick={closeMobileSidebar}
                                  className="flex items-center gap-2 px-2 py-2 text-sidebar-foreground/75 transition-colors"
                                  activeClassName="bg-[#F5DEDE] font-semibold text-[#7F3030] shadow-sm ring-1 ring-inset ring-[#B98A8A]/60"
                                >
                                  <item.icon className="h-4 w-4 shrink-0" />
                                  <span>{item.title}</span>
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            );
          })
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-3 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {user?.user_metadata?.display_name || user?.email}
              </p>
            </div>
          )}

          {!collapsed && (
            <button
              type="button"
              onClick={signOut}
              className="text-sidebar-foreground/50 transition-colors hover:text-sidebar-foreground"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
