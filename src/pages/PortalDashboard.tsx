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
          .select("project_id, project_no, project_name, project_status, contract_value")
          .eq("is_deleted", false),

        supabase
          .from("customer_invoices")
          .select(
            "customer_invoice_id, customer_id, invoice_status, total_amount, paid_amount, balance_amount, due_date, created_at, customers(customer_name)"
          )
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

    const now = new Date();

    const revenueThisMonth = invoices
      .filter((i) => {
        if (!i.created_at) return false;

        const d = new Date(i.created_at);

        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
        const previousMonth = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1
        );

        const revenueLastMonth = invoices
          .filter((i) => {
            if (!i.created_at) return false;

            const d = new Date(i.created_at);

            return (
              d.getMonth() === previousMonth.getMonth() &&
              d.getFullYear() === previousMonth.getFullYear()
            );
          })
          .reduce(
            (sum, i) => sum + Number(i.total_amount || 0),
            0
          );

        const revenueGrowth =
          revenueLastMonth > 0
            ? ((revenueThisMonth - revenueLastMonth) /
              revenueLastMonth) *
            100
            : 0;

      })
      .reduce(
        (sum, i) => sum + Number(i.total_amount || 0),
        0
      );

    const previousMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );

    const revenueLastMonth = invoices
      .filter((i) => {
        if (!i.created_at) return false;

        const d = new Date(i.created_at);

        return (
          d.getMonth() === previousMonth.getMonth() &&
          d.getFullYear() === previousMonth.getFullYear()
        );
      })
      .reduce(
        (sum, i) => sum + Number(i.total_amount || 0),
        0
      );

    const revenueGrowth =
      revenueLastMonth > 0
        ? ((revenueThisMonth - revenueLastMonth) /
          revenueLastMonth) *
        100
        : 0;

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

    const today = new Date();

    const overdueAmount = invoices
      .filter(
        (i) =>
          Number(i.balance_amount || 0) > 0 &&
          i.due_date &&
          new Date(i.due_date) < today
      )
      .reduce((sum, i) => sum + Number(i.balance_amount || 0), 0);
    const next7Days = new Date();
    next7Days.setDate(today.getDate() + 7);

    const next30Days = new Date();
    next30Days.setDate(today.getDate() + 30);

    const dueNext7Days = invoices
      .filter((i) => {
        if (!i.due_date) return false;

        const dueDate = new Date(i.due_date);

        return (
          Number(i.balance_amount || 0) > 0 &&
          dueDate >= today &&
          dueDate <= next7Days
        );
      })
      .reduce((sum, i) => sum + Number(i.balance_amount || 0), 0);

    const dueNext30Days = invoices
      .filter((i) => {
        if (!i.due_date) return false;

        const dueDate = new Date(i.due_date);

        return (
          Number(i.balance_amount || 0) > 0 &&
          dueDate >= today &&
          dueDate <= next30Days
        );
      })
      .reduce((sum, i) => sum + Number(i.balance_amount || 0), 0);
    const payrollDue = payrollEntries
      .filter((p) => Number(p.net_amount || p.gross_amount || 0) > 0)
      .reduce((sum, p) => sum + Number(p.net_amount || p.gross_amount || 0), 0);
    const customerMap = new Map<
      string,
      {
        customerName: string;
        revenue: number;
        outstanding: number;
      }
    >();

    invoices.forEach((invoice) => {
      const customerId = invoice.customer_id || "unknown";
      const customerName =
        invoice.customers?.customer_name || "Unknown Customer";

      const existing = customerMap.get(customerId) || {
        customerName,
        revenue: 0,
        outstanding: 0,
      };

      existing.revenue += Number(invoice.total_amount || 0);
      existing.outstanding += Number(invoice.balance_amount || 0);

      customerMap.set(customerId, existing);
    });

    const topCustomers = Array.from(customerMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    const projectStatusSummary = projects.reduce<Record<string, number>>(
      (acc, project) => {
        const status = project.project_status || "Unknown";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {}
    );
    const topProjects = projects
      .slice()
      .sort(
        (a, b) =>
          Number(b.contract_value || 0) - Number(a.contract_value || 0)
      )
      .slice(0, 5);
    const projectOutstanding = invoices
      .filter((i) => Number(i.balance_amount || 0) > 0)
      .reduce((sum, i) => sum + Number(i.balance_amount || 0), 0);

    const netCashPosition = dueNext30Days - payrollDue;
    const collectionRate =
      revenue > 0 ? (received / revenue) * 100 : 0;
    const profit = revenue - payrollCost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
      totalProjects: projects.length,
      activeProjects: projects.filter((p) => p.project_status !== "Completed")
        .length,
      completedProjects: projects.filter(
        (p) => p.project_status === "Completed"
      ).length,
      totalInvoices: invoices.length,
      revenue,
      revenueThisMonth,
      revenueLastMonth,
      revenueGrowth,
      received,
      collectionRate,
      outstanding: revenue - received,
      activeEmployees: employees.filter((e) => e.is_active).length,
      contractValue,
      projectStatusSummary,
      topProjects,
      topCustomers,
      projectOutstanding,
      payrollCost,
      profit,
      margin,
      overdueAmount,
      dueNext7Days,
      dueNext30Days,
      payrollDue,
      netCashPosition,
    };
  }, [data]);
  const canViewFinancialSensitiveData = Boolean(data?.isExecutive);
  if (isLoading) {
    return <div className="p-6 text-slate-500">Loading dashboard...</div>;
  }

  return (
    <div className="w-full max-w-none space-y-6">
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

        <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(250px,1fr))]">

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
            title="Active Employees"
            value={String(summary.activeEmployees)}
            icon={Users}
          />
        </div>

        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-3">
            Cash Flow
          </h2>

          <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(250px,1fr))]">
            <MetricCard
              title="Payments Received"
              value={money(summary.received)}
              icon={DollarSign}
            />
            <MetricCard
              title="Collection Rate"
              value={`${summary.collectionRate.toFixed(1)}%`}
              icon={DollarSign}
              note="Payments received divided by invoices"
            />
            <MetricCard
              title="Outstanding"
              value={money(summary.outstanding)}
              icon={DollarSign}
              note="Invoice amount minus payments received"
            />
            <MetricCard
              title="Overdue"
              value={money(summary.overdueAmount)}
              icon={DollarSign}
              note="Unpaid invoices past due date"
            />
            <MetricCard
              title="Due Next 7 Days"
              value={money(summary.dueNext7Days)}
              icon={DollarSign}
              note="Unpaid invoices due soon"
            />

            <MetricCard
              title="Due Next 30 Days"
              value={money(summary.dueNext30Days)}
              icon={DollarSign}
              note="Unpaid invoices due this month"
            />
            {canViewFinancialSensitiveData && (
              <MetricCard
                title="Payroll Due"
                value={money(summary.payrollDue)}
                icon={DollarSign}
                note="Estimated payroll amount"
              />
            )}
            {canViewFinancialSensitiveData && (
              <MetricCard
                title="Net Cash Position"
                value={money(summary.netCashPosition)}
                icon={DollarSign}
                note="Due next 30 days minus payroll due"
              />
            )}
          </div>
        </section>

      </section>
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">
          Project KPI
        </h2>

        <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(250px,1fr))]">
          <MetricCard
            title="Total Projects"
            value={String(summary.totalProjects)}
            icon={FolderKanban}
          />

          <MetricCard
            title="Active Projects"
            value={String(summary.activeProjects)}
            icon={FolderKanban}
          />
          <MetricCard
            title="Completed Projects"
            value={String(summary.completedProjects)}
            icon={FolderKanban}
          />
          <MetricCard
            title="Contract Value"
            value={money(summary.contractValue)}
            icon={DollarSign}
          />
          <MetricCard
            title="Project Outstanding"
            value={money(summary.projectOutstanding)}
            icon={DollarSign}
            note="Total unpaid invoice balance"
          />
        </div>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">
          Project Status Summary
        </h2>

        <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(250px,1fr))]">
          {Object.entries(summary.projectStatusSummary).map(
            ([status, count]) => (
              <MetricCard
                key={status}
                title={status}
                value={String(count)}
                icon={FolderKanban}
              />
            )
          )}
        </div>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">
          Revenue Trend
        </h2>

        <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(250px,1fr))]">
          <MetricCard
            title="Revenue This Month"
            value={money(summary.revenueThisMonth)}
            icon={DollarSign}

          />
          <MetricCard
            title="Revenue Last Month"
            value={money(summary.revenueLastMonth)}
            icon={DollarSign}
          />

          <MetricCard
            title="Revenue Growth"
            value={`${summary.revenueGrowth.toFixed(1)}%`}
            icon={DollarSign}
          />

        </div>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">
          Top Projects
        </h2>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Project No</th>
                    <th className="px-4 py-3 text-left font-medium">Project Name</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Contract Value</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.topProjects.map((project) => (
                    <tr
                      key={project.project_id}
                      className="border-t border-slate-100"
                    >
                      <td className="px-4 py-3 text-slate-600">
                        {project.project_no || "-"}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {project.project_name || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {project.project_status || "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        {money(Number(project.contract_value || 0))}
                      </td>
                    </tr>
                  ))}

                  {summary.topProjects.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-6 text-center text-slate-500"
                      >
                        No project data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">
          Top Customers
        </h2>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Revenue
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Outstanding
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {summary.topCustomers.map((customer) => (
                    <tr
                      key={customer.customerName}
                      className="border-t border-slate-100"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {customer.customerName}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {money(customer.revenue)}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {money(customer.outstanding)}
                      </td>
                    </tr>
                  ))}

                  {summary.topCustomers.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-6 text-center text-slate-500"
                      >
                        No customer data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>
      {canViewFinancialSensitiveData && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-semibold text-slate-800">
              Executive KPI
            </h2>
          </div>

          <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(250px,1fr))]">
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