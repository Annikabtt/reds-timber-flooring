import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Eye, FileDown, Loader2, Pencil, Plus, Printer, Search, Truck } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DELIVERY_STATUSES, INPUT_CLASS, REDS, REDS_ACTION } from "./goodsReceiving.constants";
import type { EmployeeLite, Receipt, SupplierDelivery } from "./goodsReceiving.types";
import { csvEscape, employeeName, formatDate, getErrorMessage, statusClass } from "./goodsReceiving.utils";

type Props = {
  onView: (deliveryId: string) => void;
  onEdit: (deliveryId: string) => void;
  onReceive: () => void;
};

export default function GoodsReceivingDashboard({ onView, onEdit, onReceive }: Props) {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: deliveries = [], isLoading, error } = useQuery({
    queryKey: ["goods-receiving-dashboard-deliveries"],
    queryFn: async (): Promise<SupplierDelivery[]> => {
      const { data, error } = await (supabase as any)
        .from("supplier_deliveries")
        .select(`
          supplier_delivery_id, delivery_no, purchase_order_id, supplier_id, project_id, site_id,
          delivery_date, delivery_status, supplier_delivery_note_no, notes, created_at,
          purchase_orders (purchase_order_no, order_status, expected_delivery_date),
          suppliers (supplier_code, supplier_name),
          projects (project_no, project_name),
          project_sites (site_code, site_name),
          supplier_delivery_items (
            supplier_delivery_item_id, supplier_delivery_id, purchase_order_line_id, product_id, line_no,
            received_quantity, received_uom_code, conversion_factor_to_base,
            accepted_quantity, damaged_quantity, rejected_quantity, short_quantity, short_base_quantity,
            products (product_id, product_code, product_name, base_uom_code)
          )
        `)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SupplierDelivery[];
    },
  });

  const { data: purchaseOrderNumbers = [] } = useQuery({
    queryKey: ["goods-receiving-dashboard-po-numbers"],
    queryFn: async (): Promise<Array<{
      purchase_order_id: string;
      purchase_order_no: string | null;
    }>> => {
      const { data, error } = await (supabase as any).rpc(
        "get_goods_receiving_dashboard_po_numbers",
      );
      if (error) throw error;
      return data ?? [];
    },
  });

  const purchaseOrderNoFor = (purchaseOrderId: string | null) =>
    purchaseOrderNumbers.find(
      (purchaseOrder) =>
        purchaseOrder.purchase_order_id === purchaseOrderId,
    )?.purchase_order_no ?? "-";

  const deliveryIds = useMemo(() => deliveries.map((d) => d.supplier_delivery_id), [deliveries]);

  const { data: receipts = [] } = useQuery({
    queryKey: ["goods-receiving-dashboard-receipts", deliveryIds],
    enabled: deliveryIds.length > 0,
    queryFn: async (): Promise<Receipt[]> => {
      const { data, error } = await (supabase as any)
        .from("supplier_delivery_receipts")
        .select("supplier_delivery_receipt_id, supplier_delivery_id, project_id, site_id, received_by_employee_id, received_at, receipt_status, notes")
        .in("supplier_delivery_id", deliveryIds)
        .eq("is_deleted", false)
        .order("received_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Receipt[];
    },
  });

  const employeeIds = useMemo(() => Array.from(new Set(receipts.map((r) => r.received_by_employee_id).filter(Boolean))), [receipts]);
  const { data: employees = [] } = useQuery({
    queryKey: ["goods-receiving-dashboard-employees", employeeIds],
    enabled: employeeIds.length > 0,
    queryFn: async (): Promise<EmployeeLite[]> => {
      const { data, error } = await (supabase as any)
        .from("employees")
        .select("employee_id, employee_code, display_name, first_name, last_name")
        .in("employee_id", employeeIds);
      if (error) throw error;
      return (data ?? []) as EmployeeLite[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return deliveries.filter((d) => {
      if (statusFilter !== "all" && d.delivery_status !== statusFilter) return false;
      if (dateFrom && d.delivery_date < dateFrom) return false;
      if (dateTo && d.delivery_date > dateTo) return false;
      const latestReceipt = receipts.find((r) => r.supplier_delivery_id === d.supplier_delivery_id);
      const receiver = latestReceipt ? employeeName(employees.find((e) => e.employee_id === latestReceipt.received_by_employee_id)) : "";
      if (!q) return true;
      return [
        d.delivery_no,
        purchaseOrderNoFor(d.purchase_order_id),
        d.supplier_delivery_note_no,
        d.suppliers?.supplier_name,
        d.suppliers?.supplier_code,
        d.projects?.project_name,
        d.projects?.project_no,
        d.project_sites?.site_name,
        d.project_sites?.site_code,
        receiver,
      ].some((value) => String(value ?? "").toLowerCase().includes(q));
    });
  }, [deliveries, receipts, employees, purchaseOrderNumbers, search, statusFilter, dateFrom, dateTo]);

  const exportCsv = () => {
    const rows = filtered.map((d) => {
      const latestReceipt = receipts.find((r) => r.supplier_delivery_id === d.supplier_delivery_id);
      const receiver = latestReceipt ? employeeName(employees.find((e) => e.employee_id === latestReceipt.received_by_employee_id)) : "";
      return [d.delivery_no, purchaseOrderNoFor(d.purchase_order_id), d.supplier_delivery_note_no, d.suppliers?.supplier_name, d.projects?.project_name, d.project_sites?.site_name, receiver, d.delivery_date, d.delivery_status];
    });
    const content = [
      ["Delivery No.", "PO No.", "Delivery Bill No.", "Supplier", "Project", "Site", "Received By", "Date", "Status"],
      ...rows,
    ].map((row) => row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "goods-receiving.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text("Goods Receiving", 14, 15);
    autoTable(doc, {
      startY: 22,
      head: [["Delivery No.", "PO / Delivery Bill", "Supplier", "Project / Site", "Received By", "Date", "Status"]],
      body: filtered.map((d) => {
        const latestReceipt = receipts.find((r) => r.supplier_delivery_id === d.supplier_delivery_id);
        const receiver = latestReceipt ? employeeName(employees.find((e) => e.employee_id === latestReceipt.received_by_employee_id)) : "-";
        return [
          d.delivery_no,
          `${purchaseOrderNoFor(d.purchase_order_id) ?? "-"}\nDelivery Bill: ${d.supplier_delivery_note_no ?? "-"}`,
          d.suppliers?.supplier_name ?? "-",
          `${d.projects?.project_name ?? "-"}\n${d.project_sites?.site_name ?? "-"}`,
          receiver,
          formatDate(d.delivery_date),
          d.delivery_status,
        ];
      }),
      styles: { fontSize: 8 },
    });
    doc.save("goods-receiving.pdf");
  };

  return (
    <div className="min-w-0 space-y-5 p-4 sm:p-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between print:hidden">
        <div>
          <div className="flex items-center gap-3">
            <Truck className="h-8 w-8" style={{ color: REDS }} />
            <h1 className="text-3xl font-bold text-slate-950">Goods Receiving</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">Search and manage supplier goods receiving records, delivery evidence and receipt history.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print</Button>
          <Button variant="outline" onClick={exportPdf}><FileDown className="mr-2 h-4 w-4" />Export PDF</Button>
          <Button variant="outline" onClick={exportCsv}><Download className="mr-2 h-4 w-4" />Export CSV</Button>
          <Button onClick={onReceive} className="text-white" style={{ backgroundColor: REDS_ACTION }}><Plus className="mr-2 h-4 w-4" />Goods Receiving</Button>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-3 border-b border-slate-200 p-4 xl:grid-cols-[minmax(280px,1.5fr)_170px_170px_180px_auto] xl:items-end">
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">Search PO / Project / Site / Received By / Delivery Bill No.</Label>
            <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="PO, project, site, receiver, delivery bill, supplier..." className={`pl-9 ${INPUT_CLASS}`} /></div>
          </div>
          <div className="space-y-1"><Label className="text-xs text-slate-500">Date From</Label><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={INPUT_CLASS} /></div>
          <div className="space-y-1"><Label className="text-xs text-slate-500">Date To</Label><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={INPUT_CLASS} /></div>
          <div className="space-y-1"><Label className="text-xs text-slate-500">Status</Label><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className={INPUT_CLASS}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{DELIVERY_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
          <Button className="text-white" style={{ backgroundColor: REDS }}><Search className="mr-2 h-4 w-4" />Search</Button>
        </div>

        {isLoading ? <div className="flex min-h-[260px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div> : error ? (
          <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Unable to load Goods Receiving records: {getErrorMessage(error)}</div>
        ) : (
          <div className="w-full max-w-full overflow-visible md:overflow-x-auto">
            <table className="block w-full text-left text-sm md:table md:min-w-[1050px]">
              <thead className="hidden bg-[#F7F9FB] text-xs font-bold uppercase tracking-wide text-slate-500 md:table-header-group"><tr><th className="px-4 py-3">Delivery No.</th><th className="px-4 py-3">Purchase Order</th><th className="px-4 py-3">Supplier</th><th className="px-4 py-3">Project / Site</th><th className="px-4 py-3">Received By</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Action</th></tr></thead>
              <tbody className="block space-y-3 bg-slate-50 p-3 md:table-row-group md:space-y-0 md:bg-transparent md:p-0">
                {filtered.map((d) => {
                  const latestReceipt = receipts.find((r) => r.supplier_delivery_id === d.supplier_delivery_id);
                  const receiver = latestReceipt ? employeeName(employees.find((e) => e.employee_id === latestReceipt.received_by_employee_id)) : "-";
                  return <tr key={d.supplier_delivery_id} className="block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:table-row md:rounded-none md:border-0 md:shadow-none md:hover:bg-slate-50/70">
                    <td data-label="Delivery" className="grid min-w-0 grid-cols-[105px_minmax(0,1fr)] gap-3 border-b border-slate-100 px-4 py-3 before:text-xs before:font-semibold before:uppercase before:text-slate-500 before:content-[attr(data-label)] md:table-cell md:border-0 md:before:hidden"><div className="min-w-0"><p className="break-words font-bold text-slate-900">{d.delivery_no}</p><p className="mt-1 break-words text-xs text-slate-500">Supplier Bill: {d.supplier_delivery_note_no ?? "-"}</p></div></td>
                    <td data-label="Purchase Order" className="grid min-w-0 grid-cols-[105px_minmax(0,1fr)] gap-3 border-b border-slate-100 px-4 py-3 before:text-xs before:font-semibold before:uppercase before:text-slate-500 before:content-[attr(data-label)] md:table-cell md:border-0 md:before:hidden"><p className="break-words font-semibold">{purchaseOrderNoFor(d.purchase_order_id)}</p></td>
                    <td data-label="Supplier" className="grid min-w-0 grid-cols-[105px_minmax(0,1fr)] gap-3 border-b border-slate-100 px-4 py-3 before:text-xs before:font-semibold before:uppercase before:text-slate-500 before:content-[attr(data-label)] md:table-cell md:border-0 md:before:hidden"><div className="min-w-0"><p className="break-words font-medium">{d.suppliers?.supplier_name ?? "-"}</p><p className="break-words text-xs text-slate-500">{d.suppliers?.supplier_code ?? ""}</p></div></td>
                    <td data-label="Project / Site" className="grid min-w-0 grid-cols-[105px_minmax(0,1fr)] gap-3 border-b border-slate-100 px-4 py-3 before:text-xs before:font-semibold before:uppercase before:text-slate-500 before:content-[attr(data-label)] md:table-cell md:border-0 md:before:hidden"><div className="min-w-0"><p className="break-words font-medium">{d.projects?.project_name ?? "-"}</p><p className="break-words text-xs text-slate-500">{d.project_sites?.site_name ?? "-"}</p></div></td>
                    <td data-label="Received By" className="grid min-w-0 grid-cols-[105px_minmax(0,1fr)] gap-3 border-b border-slate-100 px-4 py-3 before:text-xs before:font-semibold before:uppercase before:text-slate-500 before:content-[attr(data-label)] md:table-cell md:border-0 md:before:hidden"><span className="break-words">{receiver}</span></td><td data-label="Date" className="grid min-w-0 grid-cols-[105px_minmax(0,1fr)] gap-3 border-b border-slate-100 px-4 py-3 before:text-xs before:font-semibold before:uppercase before:text-slate-500 before:content-[attr(data-label)] md:table-cell md:border-0 md:before:hidden">{formatDate(d.delivery_date)}</td>
                    <td data-label="Status" className="grid min-w-0 grid-cols-[105px_minmax(0,1fr)] gap-3 border-b border-slate-100 px-4 py-3 before:text-xs before:font-semibold before:uppercase before:text-slate-500 before:content-[attr(data-label)] md:table-cell md:border-0 md:before:hidden"><span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(d.delivery_status)}`}>{d.delivery_status}</span></td>
                    <td className="block px-4 py-3 md:table-cell"><div className="grid grid-cols-2 gap-2 md:flex md:justify-end"><Button variant="outline" size="sm" className="w-full md:w-auto" onClick={() => onView(d.supplier_delivery_id)}><Eye className="mr-1.5 h-4 w-4" />View</Button><Button variant="outline" size="sm" className="w-full md:w-auto" onClick={() => onEdit(d.supplier_delivery_id)}><Pencil className="mr-1.5 h-4 w-4" />Edit</Button></div></td>
                  </tr>;
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="p-10 text-center text-sm text-slate-500">No Goods Receiving records match the current filters.</div>}
          </div>
        )}
      </section>
    </div>
  );
}
