import { useParams } from "react-router-dom";
import { CalendarRange } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PayrollPeriodDashboard = () => {
  const { payrollPeriodId } = useParams();

  const { data: period, isLoading } = useQuery({
    queryKey: ["payroll_period", payrollPeriodId],
    queryFn: async () => {
      if (!payrollPeriodId) {
        throw new Error("Payroll period ID not found.");
      }

      const { data, error } = await supabase
        .from("payroll_periods")
        .select(`
          payroll_period_id,
          period_no,
          period_name,
          start_date,
          end_date,
          period_type,
          status,
          notes,
          created_at
        `)
        .eq("payroll_period_id", payrollPeriodId)
        .eq("is_deleted", false)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!payrollPeriodId,
  });

  if (isLoading) {
    return (
      <div className="p-6 text-slate-500">
        Loading payroll period...
      </div>
    );
  }

  if (!period) {
    return (
      <div className="p-6 text-slate-500">
        Payroll period not found.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <CalendarRange className="h-8 w-8 text-red-600" />
          <h1 className="text-3xl font-bold text-slate-900">
            {period.period_name}
          </h1>
        </div>

        <p className="text-slate-500 mt-1">
          Payroll period dashboard and summary.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-slate-500">
            Period No
          </div>
          <div className="text-2xl font-bold">
            {period.period_no || "-"}
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-slate-500">
            Type
          </div>
          <div className="text-2xl font-bold">
            {period.period_type || "-"}
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-slate-500">
            Status
          </div>
          <div className="text-2xl font-bold">
            {period.status || "-"}
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-slate-500">
            Created
          </div>
          <div className="text-lg font-bold">
            {period.created_at
              ? new Date(period.created_at).toLocaleDateString()
              : "-"}
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-2xl p-6 space-y-4">
        <h2 className="text-xl font-bold text-slate-900">
          Period Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-slate-500">Start Date</div>
            <div className="font-semibold">
              {period.start_date || "-"}
            </div>
          </div>

          <div>
            <div className="text-slate-500">End Date</div>
            <div className="font-semibold">
              {period.end_date || "-"}
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="text-slate-500">Notes</div>
            <div className="font-semibold whitespace-pre-wrap">
              {period.notes || "-"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollPeriodDashboard;