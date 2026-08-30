import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Loader2, Maximize2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PHOTO_BUCKET } from "./goodsReceiving.constants";
import type {
  DeliveryPhoto,
  EmployeeLite,
  Receipt,
  ReceiptItem,
  StockLocation,
  SupplierDelivery,
} from "./goodsReceiving.types";
import {
  employeeName,
  formatDate,
  formatDateTime,
  formatQty,
  statusClass,
  toNumber,
} from "./goodsReceiving.utils";

type Props = {
  deliveryId: string;
  onBack: () => void;
  onEdit: (deliveryId: string) => void;
};

export default function GoodsReceivingView(
  { deliveryId, onBack, onEdit }: Props,
) {
  const [preview, setPreview] = useState<string | null>(null);

  const { data: delivery, isLoading } = useQuery({
    queryKey: ["goods-receiving-view-delivery", deliveryId],
    queryFn: async (): Promise<SupplierDelivery | null> => {
      const { data, error } = await (supabase as any).from(
        "supplier_deliveries",
      ).select(`
        supplier_delivery_id, delivery_no, purchase_order_id, supplier_id, project_id, site_id,
        delivery_date, delivery_status, supplier_delivery_note_no, notes, created_at,
        purchase_orders (purchase_order_no, order_status, expected_delivery_date),
        suppliers (supplier_code, supplier_name), projects (project_no, project_name), project_sites (site_code, site_name),
        supplier_delivery_items (
          supplier_delivery_item_id, supplier_delivery_id, purchase_order_line_id, product_id, line_no,
          received_quantity, received_uom_code, conversion_factor_to_base,
          accepted_quantity, damaged_quantity, rejected_quantity, short_quantity, short_base_quantity,
          products (product_id, product_code, product_name, base_uom_code)
        )
      `).eq("supplier_delivery_id", deliveryId).eq("is_deleted", false)
        .maybeSingle();
      if (error) throw error;
      return data as SupplierDelivery | null;
    },
  });

  const { data: receipts = [] } = useQuery({
    queryKey: ["goods-receiving-view-receipts", deliveryId],
    enabled: Boolean(deliveryId),
    queryFn: async (): Promise<Receipt[]> => {
      const { data, error } = await (supabase as any).from(
        "supplier_delivery_receipts",
      )
        .select(
          "supplier_delivery_receipt_id, supplier_delivery_id, project_id, site_id, received_by_employee_id, received_at, receipt_status, notes",
        )
        .eq("supplier_delivery_id", deliveryId).eq("is_deleted", false).order(
          "received_at",
          { ascending: false },
        );
      if (error) throw error;
      return (data ?? []) as Receipt[];
    },
  });

  const receiptIds = useMemo(
    () => receipts.map((r) => r.supplier_delivery_receipt_id),
    [receipts],
  );
  const { data: receiptItems = [] } = useQuery({
    queryKey: ["goods-receiving-view-items", receiptIds],
    enabled: receiptIds.length > 0,
    queryFn: async (): Promise<ReceiptItem[]> => {
      const { data, error } = await (supabase as any).from(
        "supplier_delivery_receipt_items",
      ).select(`
        supplier_delivery_receipt_item_id, supplier_delivery_receipt_id, supplier_delivery_item_id, stock_location_id,
        expected_quantity, expected_uom_code, expected_base_quantity, received_quantity, received_uom_code,
        accepted_quantity, accepted_input_quantity, accepted_input_uom_code, accepted_base_quantity,
        damaged_quantity, damaged_input_quantity, damaged_input_uom_code, damaged_base_quantity,
        rejected_quantity, rejected_input_quantity, rejected_input_uom_code, rejected_base_quantity,
        short_quantity, short_input_quantity, short_input_uom_code, short_base_quantity,
        accepted_components, damaged_components, rejected_components, short_components,
        damage_description, rejection_reason, short_reason, notes
      `).in("supplier_delivery_receipt_id", receiptIds).eq("is_deleted", false);
      if (error) throw error;
      return (data ?? []) as ReceiptItem[];
    },
  });

  const employeeIds = useMemo(
    () =>
      Array.from(
        new Set(receipts.map((r) => r.received_by_employee_id).filter(Boolean)),
      ),
    [receipts],
  );
  const { data: employees = [] } = useQuery({
    queryKey: ["goods-receiving-view-employees", employeeIds],
    enabled: employeeIds.length > 0,
    queryFn: async (): Promise<EmployeeLite[]> => {
      const { data, error } = await (supabase as any).from("employees").select(
        "employee_id, employee_code, display_name, first_name, last_name",
      ).in("employee_id", employeeIds);
      if (error) throw error;
      return (data ?? []) as EmployeeLite[];
    },
  });

  const stockLocationIds = useMemo(
    () =>
      Array.from(
        new Set(receiptItems.map((i) => i.stock_location_id).filter(Boolean)),
      ) as string[],
    [receiptItems],
  );
  const { data: stockLocations = [] } = useQuery({
    queryKey: ["goods-receiving-view-stock-locations", stockLocationIds],
    enabled: stockLocationIds.length > 0,
    queryFn: async (): Promise<StockLocation[]> => {
      const { data, error } = await (supabase as any).from("stock_locations")
        .select("stock_location_id, location_code, location_name, site_id").in(
          "stock_location_id",
          stockLocationIds,
        );
      if (error) throw error;
      return (data ?? []) as StockLocation[];
    },
  });

  const { data: photos = [] } = useQuery({
    queryKey: ["goods-receiving-view-photos", deliveryId],
    enabled: Boolean(deliveryId),
    queryFn: async (): Promise<DeliveryPhoto[]> => {
      const { data, error } = await (supabase as any).from(
        "supplier_delivery_photos",
      )
        .select(
          "supplier_delivery_photo_id, supplier_delivery_id, supplier_delivery_receipt_id, photo_url, photo_type, caption, sort_order, created_at",
        )
        .eq("supplier_delivery_id", deliveryId).eq("is_deleted", false).order(
          "created_at",
          { ascending: true },
        );
      if (error) throw error;
      return await Promise.all(
        ((data ?? []) as DeliveryPhoto[]).map(async (p) => {
          const { data: signed } = await supabase.storage.from(PHOTO_BUCKET)
            .createSignedUrl(p.photo_url, 3600);
          return { ...p, signedUrl: signed?.signedUrl ?? null };
        }),
      );
    },
  });

  const latest = receipts[0];
  const latestItems = latest
    ? receiptItems.filter((i) =>
      i.supplier_delivery_receipt_id === latest.supplier_delivery_receipt_id
    )
    : [];
  const totals = latestItems.reduce((a, i) => ({
    ordered: a.ordered + toNumber(i.expected_base_quantity),
    accepted: a.accepted + toNumber(i.accepted_base_quantity),
    damaged: a.damaged + toNumber(i.damaged_base_quantity),
    rejected: a.rejected + toNumber(i.rejected_base_quantity),
    short: a.short + toNumber(i.short_base_quantity),
  }), { ordered: 0, accepted: 0, damaged: 0, rejected: 0, short: 0 });
  const totalAccounted = totals.accepted + totals.damaged + totals.rejected +
    totals.short;
  const latestEmployee = latest
    ? employees.find((e) => e.employee_id === latest.received_by_employee_id)
    : null;
  const latestStock = latestItems.map((i) =>
    stockLocations.find((s) => s.stock_location_id === i.stock_location_id)
  ).find(Boolean);

  const gallerySection = (
    title: string,
    types: string[],
    emptyText: string,
  ) => {
    const group = photos.filter((photo) => types.includes(photo.photo_type));

    return (
      <div className="border-b border-slate-200 py-5 last:border-b-0">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="font-semibold text-slate-900">
              {title}
              <span className="ml-2 text-sm font-normal text-slate-500">
                ({group.length})
              </span>
            </h4>
          </div>
        </div>

        {group.length === 0
          ? (
            <div className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-sm text-slate-400">
              {emptyText}
            </div>
          )
          : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
              {group.map((photo) => (
                <button
                  key={photo.supplier_delivery_photo_id}
                  type="button"
                  disabled={!photo.signedUrl}
                  onClick={() => photo.signedUrl && setPreview(photo.signedUrl)}
                  className="group overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition hover:border-[#9E4B4B] hover:shadow-sm disabled:cursor-default"
                >
                  {photo.signedUrl
                    ? (
                      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                        <img
                          src={photo.signedUrl}
                          alt={photo.caption ?? title}
                          className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]"
                        />
                        <span className="absolute bottom-2 right-2 rounded-md bg-black/60 p-1.5 text-white opacity-0 transition group-hover:opacity-100">
                          <Maximize2 className="h-4 w-4" />
                        </span>
                      </div>
                    )
                    : (
                      <div className="flex aspect-[4/3] items-center justify-center bg-slate-100 px-2 text-center text-xs text-slate-400">
                        Preview unavailable
                      </div>
                    )}

                  <div className="min-h-12 p-2">
                    <p className="line-clamp-2 text-xs font-medium text-slate-700">
                      {photo.caption || photo.photo_type}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
      </div>
    );
  };

  if (isLoading || !delivery) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="print:hidden">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />Back to List
        </Button>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold">
              Goods Receiving Detail —{" "}
              {delivery.supplier_delivery_note_no ?? delivery.delivery_no}
            </h2>
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                statusClass(delivery.delivery_status)
              }`}
            >
              {delivery.delivery_status === "Received"
                ? "Goods Received"
                : delivery.delivery_status}
            </span>
          </div>
          <Button
            variant="outline"
            onClick={() => onEdit(deliveryId)}
            className="print:hidden"
          >
            Edit
          </Button>
        </div>
        <div className="grid gap-x-10 gap-y-2 p-5 text-sm md:grid-cols-2">
          <div className="grid grid-cols-[150px_1fr] gap-y-2">
            <span className="text-slate-500">PO No.</span>
            <strong>
              {delivery.purchase_orders?.purchase_order_no ?? "-"}
            </strong>
            <span className="text-slate-500">Delivery No.</span>
            <strong>{delivery.delivery_no}</strong>
            <span className="text-slate-500">Delivery Date</span>
            <strong>{formatDate(delivery.delivery_date)}</strong>
            <span className="text-slate-500">Supplier</span>
            <strong>{delivery.suppliers?.supplier_name ?? "-"}</strong>
            <span className="text-slate-500">Site</span>
            <strong>{delivery.project_sites?.site_name ?? "-"}</strong>
          </div>
          <div className="grid grid-cols-[150px_1fr] gap-y-2">
            <span className="text-slate-500">Received At</span>
            <strong>{formatDateTime(latest?.received_at)}</strong>
            <span className="text-slate-500">Received By</span>
            <strong>{employeeName(latestEmployee)}</strong>
            <span className="text-slate-500">Stock Location</span>
            <strong>
              {latestStock
                ? `${latestStock.location_code} — ${latestStock.location_name}`
                : "-"}
            </strong>
            <span className="text-slate-500">Delivery Bill No.</span>
            <strong>{delivery.supplier_delivery_note_no ?? "-"}</strong>
            <span className="text-slate-500">Notes</span>
            <strong>{delivery.notes || "-"}</strong>
          </div>
        </div>

        <div className="overflow-x-auto border-t">
          <table className="min-w-[1100px] w-full text-xs">
            <thead className="bg-[#F7F9FB]">
              <tr>
                <th rowSpan={2} className="border p-2">No.</th>
                <th rowSpan={2} className="border p-2 text-left">Product</th>
                <th rowSpan={2} className="border p-2">UOM (Doc.)</th>
                <th rowSpan={2} className="border p-2">Ordered</th>
                <th colSpan={2} className="border p-2">Accepted</th>
                <th colSpan={2} className="border p-2">Damaged</th>
                <th colSpan={2} className="border p-2">Rejected</th>
                <th colSpan={2} className="border p-2">Short / Missing</th>
              </tr>
              <tr>
                <th className="border p-2">Qty</th>
                <th className="border p-2">UOM (Input)</th>
                <th className="border p-2">Qty</th>
                <th className="border p-2">UOM (Input)</th>
                <th className="border p-2">Qty</th>
                <th className="border p-2">UOM (Input)</th>
                <th className="border p-2">Qty</th>
                <th className="border p-2">UOM (Input)</th>
              </tr>
            </thead>
            <tbody>
              {latestItems.map((i, index) => {
                const dItem = delivery.supplier_delivery_items.find((x) =>
                  x.supplier_delivery_item_id === i.supplier_delivery_item_id
                );
                return (
                  <tr key={i.supplier_delivery_receipt_item_id}>
                    <td className="border p-2 text-center">{index + 1}</td>
                    <td className="border p-2">
                      <p className="font-medium">
                        {dItem?.products?.product_name ?? "-"}
                      </p>
                      <p className="text-slate-500">
                        {dItem?.products?.product_code ?? ""}
                      </p>
                    </td>
                    <td className="border p-2 text-center">
                      {i.expected_uom_code ?? i.received_uom_code}
                    </td>
                    <td className="border p-2 text-right">
                      {formatQty(i.expected_quantity)}
                    </td>
                    <td className="border p-2 text-right">
                      {formatQty(
                        i.accepted_input_quantity ?? i.accepted_quantity,
                      )}
                    </td>
                    <td className="border p-2 text-center">
                      {i.accepted_input_uom_code ?? i.received_uom_code}
                    </td>
                    <td className="border p-2 text-right">
                      {formatQty(
                        i.damaged_input_quantity ?? i.damaged_quantity,
                      )}
                    </td>
                    <td className="border p-2 text-center">
                      {i.damaged_input_uom_code ?? i.received_uom_code}
                    </td>
                    <td className="border p-2 text-right">
                      {formatQty(
                        i.rejected_input_quantity ?? i.rejected_quantity,
                      )}
                    </td>
                    <td className="border p-2 text-center">
                      {i.rejected_input_uom_code ?? i.received_uom_code}
                    </td>
                    <td className="border p-2 text-right">
                      {formatQty(i.short_input_quantity ?? i.short_quantity)}
                    </td>
                    <td className="border p-2 text-center">
                      {i.short_input_uom_code ?? i.received_uom_code}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-[#F7F9FB] font-bold">
              <tr>
                <td colSpan={3} className="border p-2">Total (Base UOM)</td>
                <td className="border p-2 text-right">
                  {formatQty(totals.ordered)}
                </td>
                <td colSpan={2} className="border p-2 text-center">
                  {formatQty(totals.accepted)}
                </td>
                <td colSpan={2} className="border p-2 text-center">
                  {formatQty(totals.damaged)}
                </td>
                <td colSpan={2} className="border p-2 text-center">
                  {formatQty(totals.rejected)}
                </td>
                <td colSpan={2} className="border p-2 text-center">
                  {formatQty(totals.short)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="font-bold">Goods Receiving Summary</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
            <p className="text-xs font-medium">Accepted</p>
            <strong className="mt-1 block text-lg">
              {formatQty(totals.accepted)}
            </strong>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800">
            <p className="text-xs font-medium">Damaged</p>
            <strong className="mt-1 block text-lg">
              {formatQty(totals.damaged)}
            </strong>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-800">
            <p className="text-xs font-medium">Rejected</p>
            <strong className="mt-1 block text-lg">
              {formatQty(totals.rejected)}
            </strong>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-blue-800">
            <p className="text-xs font-medium">Short / Missing</p>
            <strong className="mt-1 block text-lg">
              {formatQty(totals.short)}
            </strong>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-800">
            <p className="text-xs font-medium">Total (Base UOM)</p>
            <strong className="mt-1 block text-lg">
              {formatQty(totalAccounted)}
            </strong>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="font-bold">Receiving History (This Delivery)</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-[800px] w-full text-left text-xs">
              <thead className="bg-[#F7F9FB]">
                <tr>
                  <th className="p-2">Delivery Bill No.</th>
                  <th className="p-2">Received At</th>
                  <th className="p-2">Received By</th>
                  <th className="p-2">Accepted (Base)</th>
                  <th className="p-2">Damaged (Base)</th>
                  <th className="p-2">Rejected (Base)</th>
                  <th className="p-2">Short/Missing (Base)</th>
                  <th className="p-2">Telegram</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((r) => {
                  const items = receiptItems.filter((i) =>
                    i.supplier_delivery_receipt_id ===
                      r.supplier_delivery_receipt_id
                  );
                  const t = items.reduce((a, i) => ({
                    accepted: a.accepted + toNumber(i.accepted_base_quantity),
                    damaged: a.damaged + toNumber(i.damaged_base_quantity),
                    rejected: a.rejected + toNumber(i.rejected_base_quantity),
                    short: a.short + toNumber(i.short_base_quantity),
                  }), { accepted: 0, damaged: 0, rejected: 0, short: 0 });
                  const emp = employees.find((e) =>
                    e.employee_id === r.received_by_employee_id
                  );
                  return (
                    <tr
                      key={r.supplier_delivery_receipt_id}
                      className="border-t"
                    >
                      <td className="p-2 font-medium">
                        {delivery.supplier_delivery_note_no ??
                          delivery.delivery_no}
                      </td>
                      <td className="p-2">{formatDateTime(r.received_at)}</td>
                      <td className="p-2">{employeeName(emp)}</td>
                      <td className="p-2">{formatQty(t.accepted)}</td>
                      <td className="p-2">{formatQty(t.damaged)}</td>
                      <td className="p-2">{formatQty(t.rejected)}</td>
                      <td className="p-2">{formatQty(t.short)}</td>
                      <td className="p-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="font-bold">Telegram Notifications</h3>
          <p className="mt-3 text-sm text-slate-500">
            Notification status remains linked to each receipt. Detailed
            Telegram rendering stays isolated from this View component.
          </p>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="border-b border-slate-200 pb-4">
          <h3 className="font-bold text-slate-900">
            Related Documents & Photos
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            All documents and photos linked to this Supplier Delivery are shown
            here. Select a thumbnail to open the full preview.
          </p>
        </div>

        {gallerySection(
          "Supplier Documents",
          ["Delivery Docket", "Invoice", "SupplierDocument"],
          "No supplier document linked to this delivery.",
        )}

        {gallerySection(
          "Delivered Goods Photos",
          ["Material", "Receipt", "ReceiptEvidence"],
          "No delivered goods photo linked to this delivery.",
        )}

        {gallerySection(
          "Damage / Issue Photos",
          [
            "Damage",
            "DamagedOnDelivery",
            "RejectedOnDelivery",
            "ShortMissingOnDelivery",
          ],
          "No damage or receiving issue photo linked to this delivery.",
        )}

        {gallerySection(
          "Other Evidence",
          ["Other"],
          "No other evidence linked to this delivery.",
        )}
      </section>

      {preview && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreview(null)}
        >
          <button
            className="absolute right-5 top-5 rounded-full bg-white p-2"
            onClick={() => setPreview(null)}
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={preview}
            alt="Preview"
            className="max-h-[92vh] max-w-[95vw] object-contain"
          />
        </div>
      )}
    </div>
  );
}
