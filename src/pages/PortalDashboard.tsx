import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, FolderKanban, FileText, Users, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const money = (value: number) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(value || 0);

function MetricCard({
  title,
  value,
  icon: Icon,
  note,
}: {
  title: string;
  value: string;
  icon: typeof DollarSign;
  note?: string;
}) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">
          {title}
        </CardTitle>
        <Icon className="h-5 w-5 text-slate-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        {note && <p className="text-xs text-slate-500 mt-1">{note}</p>}
      </CardContent>
    </Card>
  );
}

export default function PortalDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["portal-dashboard"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();

      const role =
        String(userData.user?.app_metadata?.role || "") ||
        String(userData.user?.user_metadata?.role || "");

      const executiveRoles = [
        "owner",
        "director",
        "admin",
        "superadmin",
        "manager",
        "executive",
      ];

      const isExecutive = executiveRoles.includes(role);

      const [
        projectsResult,
        invoicesResult,
        paymentsResult,
        employeesResult,
        payrollResult,
      ] = await Promise.all([
        supabase
          .from("projects")
          .select("project_id, project_status, contract_value")
          .eq("is_deleted", false),

        supabase
          .from("customer_invoices")
          .select("customer_invoice_id, invoice_status, total_amount, paid_amount, balance_amount, due_date")
          .eq("is_deleted", false),

        supabase
          .from("customer_payments")
          .select("customer_payment_id, amount")
          .eq("is_deleted", false),

        supabase
          .from("employees")
          .select("employee_id, is_active")
          .eq("is_deleted", false),

        supabase
          .from("payroll_entries")
          .select("payroll_entry_id, gross_amount, net_amount")
          .eq("is_deleted", false),
      ]);

      if (projectsResult.error) throw projectsResult.error;
      if (invoicesResult.error) throw invoicesResult.error;
      if (paymentsResult.error) throw paymentsResult.error;
      if (employeesResult.error) throw employeesResult.error;
      if (payrollResult.error) throw payrollResult.error;

      return {
        isExecutive,
        projects: projectsResult.data || [],
        invoices: invoicesResult.data || [],
        payments: paymentsResult.data || [],
        employees: employeesResult.data || [],
        payrollEntries: payrollResult.data || [],
      };
    },
  });

  const summary = useMemo(() => {
    const projects = data?.projects || [];
    const invoices = data?.invoices || [];
    const payments = data?.payments || [];
    const employees = data?.employees || [];
    const payrollEntries = data?.payrollEntries || [];

    const revenue = invoices.reduce(
      (sum, item) => sum + Number(item.total_amount || 0),
      0
    );

    const received = payments.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const contractValue = projects.reduce(
      (sum, item) => sum + Number(item.contract_value || 0),
      0
    );

    const payrollCost = payrollEntries.reduce(
      (sum, item) => sum + Number(item.gross_amount || item.net_amount || 0),
      0
    );

    const profit = revenue - payrollCost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
      totalProjects: projects.length,
      activeProjects: projects.filter((p) => p.project_status !== "Completed")
        .length,
      totalInvoices: invoices.length,
      revenue,
      received,
      outstanding: revenue - received,
      activeEmployees: employees.filter((e) => e.is_active).length,
      contractValue,
      payrollCost,
      profit,
      margin,
    };
  }, [data]);

  if (isLoading) {
    return <div className="p-6 text-slate-500">Loading dashboard...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">
          REDS Timber Flooring business overview.
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">
          General KPI
        </h2>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total Projects"
            value={String(summary.totalProjects)}
            icon={FolderKanban}
            note={`${summary.activeProjects} active`}
          />
          <MetricCard
            title="Total Invoices"
            value={String(summary.totalInvoices)}
            icon={FileText}
          />
          <MetricCard
            title="Revenue Invoiced"
            value={money(summary.revenue)}
            icon={DollarSign}
          />
          <MetricCard
            title="Outstanding"
            value={money(summary.outstanding)}
            icon={DollarSign}
            note="Invoice amount minus payments received"
          />
          <MetricCard
            title="Payments Received"
            value={money(summary.received)}
            icon={DollarSign}
          />
          <MetricCard
            title="Active Employees"
            value={String(summary.activeEmployees)}
            icon={Users}
          />
        </div>
      </section>

      {data?.isExecutive && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-semibold text-slate-800">
              Executive KPI
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Contract Value"
              value={money(summary.contractValue)}
              icon={DollarSign}
            />
            <MetricCard
              title="Payroll Cost"
              value={money(summary.payrollCost)}
              icon={DollarSign}
              note="Hidden from non-executive users"
            />
            <MetricCard
              title="Profit"
              value={money(summary.profit)}
              icon={DollarSign}
              note="Revenue minus payroll cost"
            />
            <MetricCard
              title="Margin"
              value={`${summary.margin.toFixed(2)}%`}
              icon={DollarSign}
            />
          </div>
        </section>
      )}
    </div>
  );
}