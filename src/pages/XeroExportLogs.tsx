import { useMemo, useState } from "react";
import { Send, Search } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const XeroExportLogs = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices-for-xero-export"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_invoices")
        .select(`
          customer_invoice_id,
          invoice_no,
          total_amount,
          invoice_status,
          xero_exported,
          xero_exported_at,
          customers (
            customer_name
          )
        `)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["xero_export_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("xero_export_logs")
        .select(`
          xero_export_log_id,
          source_type,
          source_id,
          export_status,
          xero_reference_id,
          xero_reference_no,
          exported_at,
          error_message,
          payload,
          response,
          created_at
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const exportInvoice = useMutation({
    mutationFn: async (invoice: {
      customer_invoice_id: string;
      invoice_no: string | null;
      total_amount: number | null;
      invoice_status: string | null;
    }) => {
      const now = new Date().toISOString();

      const { error: logError } = await supabase
        .from("xero_export_logs")
        .insert({
          source_type: "Customer Invoice",
          source_id: invoice.customer_invoice_id,
          export_status: "Success",
          xero_reference_id: null,
          xero_reference_no: invoice.invoice_no,
          exported_at: now,
          error_message: null,
          payload: {
            invoice_no: invoice.invoice_no,
            total_amount: invoice.total_amount,
            status: invoice.invoice_status,
          },
          response: {
            message: "Phase 1 simulated export log only.",
          },
        });

      if (logError) throw logError;

      const { error: invoiceError } = await supabase
        .from("customer_invoices")
        .update({
          xero_exported: true,
          xero_exported_at: now,
        })
        .eq("customer_invoice_id", invoice.customer_invoice_id);

      if (invoiceError) throw invoiceError;
    },
    onSuccess: () => {
      toast.success("Xero export log created.");
      queryClient.invalidateQueries({ queryKey: ["xero_export_logs"] });
      queryClient.invalidateQueries({ queryKey: ["invoices-for-xero-export"] });
      queryClient.invalidateQueries({ queryKey: ["customer_invoices"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const filteredInvoices = useMemo(() => {
    const keyword = searchTerm.toLowerCase();

    return invoices.filter((invoice) => {
      return (
        invoice.invoice_no?.toLowerCase().includes(keyword) ||
        invoice.customers?.customer_name?.toLowerCase().includes(keyword) ||
        invoice.invoice_status?.toLowerCase().includes(keyword)
      );
    });
  }, [invoices, searchTerm]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <Send className="h-8 w-8 text-red-600" />
          <h1 className="text-3xl font-bold text-slate-900">
            Xero Export Logs
          </h1>
        </div>
        <p className="text-slate-500 mt-1">
          Track invoice export status for Xero integration.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search invoice, customer, or status..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-12 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500 px-4 py-3 border-b">
          <div className="col-span-2">Invoice</div>
          <div className="col-span-3">Customer</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Amount</div>
          <div className="col-span-2">Xero</div>
          <div className="col-span-1">Action</div>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No invoices found.
          </div>
        ) : (
          filteredInvoices.map((invoice) => (
            <div
              key={invoice.customer_invoice_id}
              className="grid grid-cols-12 px-4 py-4 border-b last:border-b-0 hover:bg-slate-50 transition-colors"
            >
              <div className="col-span-2 font-semibold text-slate-900">
                {invoice.invoice_no || "-"}
              </div>

              <div className="col-span-3 text-slate-700">
                {invoice.customers?.customer_name || "-"}
              </div>

              <div className="col-span-2 text-slate-700">
                {invoice.invoice_status || "-"}
              </div>

              <div className="col-span-2 text-right font-semibold text-slate-900">
                ${Number(invoice.total_amount || 0).toFixed(2)}
              </div>

              <div className="col-span-2 text-slate-700">
                {invoice.xero_exported ? "Exported" : "Not exported"}
              </div>

              <div className="col-span-1">
                <Button
                  size="sm"
                  disabled={invoice.xero_exported || exportInvoice.isPending}
                  onClick={() => exportInvoice.mutate(invoice)}
                >
                  Export
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b bg-slate-50 font-semibold">
          Export History
        </div>

        {logs.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            No export logs found.
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.xero_export_log_id}
              className="grid grid-cols-12 px-4 py-3 border-b last:border-b-0"
            >
              <div className="col-span-2">{log.source_type}</div>
              <div className="col-span-2">{log.export_status}</div>
              <div className="col-span-3">{log.xero_reference_no || "-"}</div>
              <div className="col-span-3">{log.exported_at || "-"}</div>
              <div className="col-span-2 text-red-600">
                {log.error_message || ""}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default XeroExportLogs;