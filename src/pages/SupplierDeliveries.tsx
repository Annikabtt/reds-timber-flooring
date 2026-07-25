import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Truck,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type PermissionState = {
  canView: boolean;
  canCreate: boolean;
  canReceive: boolean;
  canViewCost: boolean;
};

type PurchaseOrder = {
  purchase_order_id: string;
  purchase_order_no: string | null;
  supplier_id: string | null;
  project_id: string | null;
  site_id: string | null;
  order_status: string | null;
  total_amount: number | string | null;
  suppliers: { supplier_code: string | null; supplier_name: string | null } | null;
  projects: { project_no: string | null; project_name: string | null } | null;
  project_sites: { site_code: string | null; site_name: string | null } | null;
};

type Product = {
  product_id: string;
  product_code: string | null;
  product_name: string | null;
  base_uom_code: string | null;
  is_stock_item: boolean | null;
};

type PurchaseOrderLine = {
  purchase_order_line_id: string;
  purchase_order_id: string;
  product_id: string;
  line_no: number;
  description: string | null;
  unit_of_measure: string;
  quantity: number | string;
  unit_cost: number | string;
  purchase_uom_code: string | null;
  allow_fractional_quantity: boolean | null;
  products: Product | null;
};

type DeliveryItem = {
  supplier_delivery_item_id: string;
  supplier_delivery_id: string;
  purchase_order_line_id: string | null;
  product_id: string;
  line_no: number;
  received_quantity: number | string;
  received_uom_code: string;
  accepted_quantity: number | string;
  damaged_quantity: number | string;
  rejected_quantity: number | string;
  unit_cost: number | string | null;
  products: Product | null;
};

type SupplierDelivery = {
  supplier_delivery_id: string;
  delivery_no: string;
  purchase_order_id: string | null;
  supplier_id: string;
  project_id: string | null;
  site_id: string | null;
  delivery_date: string;
  delivery_status: string;
  supplier_delivery_note_no: string | null;
  notes: string | null;
  telegram_notified: boolean;
  telegram_notified_at: string | null;
  created_at: string;
  purchase_orders: {
    purchase_order_no: string | null;
    order_status: string | null;
    total_amount: number | string | null;
  } | null;
  suppliers: { supplier_code: string | null; supplier_name: string | null } | null;
  projects: {
    project_no: string | null;
    project_name: string | null;
    customers?: { customer_name: string | null } | null;
  } | null;
  project_sites: { site_code: string | null; site_name: string | null } | null;
  supplier_delivery_photos: { supplier_delivery_photo_id: string }[];
  supplier_delivery_items: DeliveryItem[];
};

type StockLocation = {
  stock_location_id: string;
  location_code: string;
  location_name: string;
  location_type: string;
  project_id: string | null;
  site_id: string | null;
};

type ProductUnit = {
  product_unit_id: string;
  product_id: string;
  uom_code: string;
  conversion_to_base: number | string;
  sort_order: number;
};

type CreateLineState = {
  purchaseOrderLineId: string;
  selected: boolean;
  quantity: string;
  notes: string;
};

type ReceiveLineState = {
  supplierDeliveryItemId: string;
  selected: boolean;
  received: string;
  accepted: string;
  damaged: string;
  rejected: string;
  damageDetailQuantity: string;
  damageDetailUomCode: string;
  damageDescription: string;
  lotNo: string;
  expiryDate: string;
  notes: string;
};

const inputClass =
  "bg-[#F7F9FB] border-[#E5E7EB] hover:border-[#9E4B4B] focus-visible:ring-[#9E4B4B]";

const toNumber = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const round6 = (value: number) =>
  Math.round((value + Number.EPSILON) * 1_000_000) / 1_000_000;

const formatQty = (value: unknown) =>
  toNumber(value).toLocaleString("en-AU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  });

const formatMoney = (value: unknown) =>
  toNumber(value).toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
  });

const formatDate = (value: string | null | undefined) => {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-AU");
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const candidate = error as Record<string, unknown>;
    return [candidate.message, candidate.details, candidate.hint, candidate.code]
      .filter(Boolean)
      .map(String)
      .join(" | ");
  }
  return String(error);
};

const statusClass = (status: string) => {
  if (status === "Received") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "Partial") return "bg-amber-50 text-amber-700 border-amber-200";
  if (status === "Rejected") return "bg-red-50 text-red-700 border-red-200";
  if (status === "Cancelled") return "bg-slate-100 text-slate-600 border-slate-200";
  return "bg-blue-50 text-blue-700 border-blue-200";
};

const SupplierDeliveries = () => {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [purchaseOrderId, setPurchaseOrderId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 10));
  const [supplierDeliveryNoteNo, setSupplierDeliveryNoteNo] = useState("");
  const [createNotes, setCreateNotes] = useState("");
  const [createLines, setCreateLines] = useState<CreateLineState[]>([]);

  const [showReceiveDialog, setShowReceiveDialog] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState("");
  const [stockLocationId, setStockLocationId] = useState("");
  const [receiveNotes, setReceiveNotes] = useState("");
  const [receiveLines, setReceiveLines] = useState<ReceiveLineState[]>([]);

  const { data: permissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ["supplier-delivery-permissions"],
    queryFn: async (): Promise<PermissionState> => {
      const client = supabase as any;
      const check = async (code: string) => {
        const { data, error } = await client.rpc("has_permission", {
          p_permission_code: code,
        });
        return !error && data === true;
      };

      const [canView, canCreate, canReceive, canViewCost] = await Promise.all([
        check("supplier_deliveries.view"),
        check("supplier_deliveries.create"),
        check("site_goods_receiving.receive"),
        check("supplier_deliveries.view_cost"),
      ]);

      return { canView, canCreate, canReceive, canViewCost };
    },
    staleTime: 60_000,
  });

  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ["purchase-orders-for-supplier-deliveries"],
    enabled: permissions?.canCreate === true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select(`
          purchase_order_id,
          purchase_order_no,
          supplier_id,
          project_id,
          site_id,
          order_status,
          total_amount,
          suppliers (supplier_code, supplier_name),
          projects (project_no, project_name),
          project_sites (site_code, site_name)
        `)
        .eq("is_deleted", false)
        .neq("order_status", "Cancelled")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as PurchaseOrder[];
    },
  });

  const { data: poLineResult, isLoading: poLinesLoading } = useQuery({
    queryKey: ["purchase-order-lines-for-delivery", purchaseOrderId],
    enabled: showCreateDialog && Boolean(purchaseOrderId),
    queryFn: async () => {
      const { data: lineData, error: lineError } = await supabase
        .from("purchase_order_lines")
        .select(`
          purchase_order_line_id,
          purchase_order_id,
          product_id,
          line_no,
          description,
          unit_of_measure,
          quantity,
          unit_cost,
          purchase_uom_code,
          allow_fractional_quantity,
          products (
            product_id,
            product_code,
            product_name,
            base_uom_code,
            is_stock_item
          )
        `)
        .eq("purchase_order_id", purchaseOrderId)
        .eq("is_deleted", false)
        .order("line_no", { ascending: true });

      if (lineError) throw lineError;

      const lines = (lineData ?? []) as unknown as PurchaseOrderLine[];
      const ids = lines.map((line) => line.purchase_order_line_id);

      const existing = new Map<string, number>();

      if (ids.length > 0) {
        const { data: deliveryRows, error: deliveryError } = await supabase
          .from("supplier_delivery_items")
          .select(`
            purchase_order_line_id,
            received_quantity,
            supplier_deliveries!inner (
              delivery_status,
              is_deleted
            )
          `)
          .in("purchase_order_line_id", ids)
          .eq("is_deleted", false)
          .eq("supplier_deliveries.is_deleted", false)
          .neq("supplier_deliveries.delivery_status", "Cancelled");

        if (deliveryError) throw deliveryError;

        for (const row of deliveryRows ?? []) {
          if (!row.purchase_order_line_id) continue;
          existing.set(
            row.purchase_order_line_id,
            round6((existing.get(row.purchase_order_line_id) ?? 0) + toNumber(row.received_quantity)),
          );
        }
      }

      return { lines, existing };
    },
  });

  const poLines = poLineResult?.lines ?? [];
  const existingQuantities = poLineResult?.existing ?? new Map<string, number>();

  useEffect(() => {
    if (!showCreateDialog || !purchaseOrderId) {
      setCreateLines([]);
      return;
    }

    setCreateLines(
      poLines.map((line) => {
        const existing = existingQuantities.get(line.purchase_order_line_id) ?? 0;
        const outstanding = Math.max(0, round6(toNumber(line.quantity) - existing));
        return {
          purchaseOrderLineId: line.purchase_order_line_id,
          selected: outstanding > 0,
          quantity: outstanding > 0 ? String(outstanding) : "",
          notes: "",
        };
      }),
    );
  }, [showCreateDialog, purchaseOrderId, poLines, existingQuantities]);

  const {
    data: deliveries = [],
    isLoading: deliveriesLoading,
    error: deliveriesError,
    refetch,
  } = useQuery({
    queryKey: ["supplier_deliveries"],
    enabled: permissions?.canView === true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplier_deliveries")
        .select(`
          supplier_delivery_id,
          delivery_no,
          purchase_order_id,
          supplier_id,
          project_id,
          site_id,
          delivery_date,
          delivery_status,
          supplier_delivery_note_no,
          notes,
          telegram_notified,
          telegram_notified_at,
          created_at,
          purchase_orders (
            purchase_order_no,
            order_status,
            total_amount
          ),
          suppliers (
            supplier_code,
            supplier_name
          ),
          projects (
            project_no,
            project_name,
            customers (customer_name)
          ),
          project_sites (
            site_code,
            site_name
          ),
          supplier_delivery_photos (
            supplier_delivery_photo_id
          ),
          supplier_delivery_items (
            supplier_delivery_item_id,
            supplier_delivery_id,
            purchase_order_line_id,
            product_id,
            line_no,
            received_quantity,
            received_uom_code,
            accepted_quantity,
            damaged_quantity,
            rejected_quantity,
            unit_cost,
            products (
              product_id,
              product_code,
              product_name,
              base_uom_code,
              is_stock_item
            )
          )
        `)
        .eq("is_deleted", false)
        .eq("supplier_delivery_items.is_deleted", false)
        .order("created_at", { ascending: false })
        .order("line_no", {
          referencedTable: "supplier_delivery_items",
          ascending: true,
        });

      if (error) throw error;
      return (data ?? []) as unknown as SupplierDelivery[];
    },
  });

  const selectedDelivery =
    deliveries.find((item) => item.supplier_delivery_id === selectedDeliveryId) ?? null;

  const { data: stockLocations = [], isLoading: stockLocationsLoading } = useQuery({
    queryKey: ["stock-locations-for-site-receiving", selectedDelivery?.site_id],
    enabled: showReceiveDialog && Boolean(selectedDelivery?.site_id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_locations")
        .select(`
          stock_location_id,
          location_code,
          location_name,
          location_type,
          project_id,
          site_id
        `)
        .eq("site_id", selectedDelivery!.site_id!)
        .eq("is_active", true)
        .eq("is_deleted", false)
        .order("location_name", { ascending: true });

      if (error) throw error;
      return (data ?? []) as StockLocation[];
    },
  });

  const productIds = useMemo(
    () =>
      Array.from(
        new Set((selectedDelivery?.supplier_delivery_items ?? []).map((item) => item.product_id)),
      ),
    [selectedDelivery],
  );

  const { data: productUnits = [] } = useQuery({
    queryKey: ["product-units-for-site-receiving", productIds],
    enabled: showReceiveDialog && productIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_units")
        .select(`
          product_unit_id,
          product_id,
          uom_code,
          conversion_to_base,
          sort_order
        `)
        .in("product_id", productIds)
        .eq("is_active", true)
        .eq("is_deleted", false)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data ?? []) as ProductUnit[];
    },
  });

  const resetCreate = () => {
    setPurchaseOrderId("");
    setDeliveryDate(new Date().toISOString().slice(0, 10));
    setSupplierDeliveryNoteNo("");
    setCreateNotes("");
    setCreateLines([]);
  };

  const resetReceive = () => {
    setSelectedDeliveryId("");
    setStockLocationId("");
    setReceiveNotes("");
    setReceiveLines([]);
  };

  const openReceive = (delivery: SupplierDelivery) => {
    setSelectedDeliveryId(delivery.supplier_delivery_id);
    setStockLocationId("");
    setReceiveNotes("");
    setReceiveLines(
      delivery.supplier_delivery_items.map((item) => {
        const processed =
          toNumber(item.accepted_quantity) +
          toNumber(item.damaged_quantity) +
          toNumber(item.rejected_quantity);
        const outstanding = Math.max(0, round6(toNumber(item.received_quantity) - processed));

        return {
          supplierDeliveryItemId: item.supplier_delivery_item_id,
          selected: outstanding > 0,
          received: outstanding > 0 ? String(outstanding) : "",
          accepted: outstanding > 0 ? String(outstanding) : "",
          damaged: "0",
          rejected: "0",
          damageDetailQuantity: "0",
          damageDetailUomCode: "",
          damageDescription: "",
          lotNo: "",
          expiryDate: "",
          notes: "",
        };
      }),
    );
    setShowReceiveDialog(true);
  };

  const createDelivery = useMutation({
    mutationFn: async () => {
      if (!purchaseOrderId) throw new Error("Please select a purchase order.");
      if (!deliveryDate) throw new Error("Please select the delivery date.");

      const selected = createLines.filter((line) => line.selected);
      if (selected.length === 0) throw new Error("Please select at least one PO line.");

      const items = selected.map((state) => {
        const line = poLines.find(
          (candidate) => candidate.purchase_order_line_id === state.purchaseOrderLineId,
        );
        if (!line) throw new Error("Selected PO line was not found.");

        const quantity = toNumber(state.quantity);
        const existing = existingQuantities.get(line.purchase_order_line_id) ?? 0;
        const outstanding = Math.max(0, round6(toNumber(line.quantity) - existing));

        if (quantity <= 0) {
          throw new Error(`Delivery quantity must be greater than zero on PO line ${line.line_no}.`);
        }
        if (round6(quantity) > round6(outstanding)) {
          throw new Error(`Delivery quantity exceeds outstanding on PO line ${line.line_no}.`);
        }

        return {
          purchase_order_line_id: line.purchase_order_line_id,
          received_quantity: quantity,
          received_uom_code: line.purchase_uom_code || line.unit_of_measure,
          notes: state.notes.trim() || null,
        };
      });

      const { data, error } = await (supabase as any).rpc(
        "create_supplier_delivery_from_purchase_order_atomic",
        {
          p_purchase_order_id: purchaseOrderId,
          p_delivery_date: deliveryDate,
          p_supplier_delivery_note_no: supplierDeliveryNoteNo.trim() || null,
          p_notes: createNotes.trim() || null,
          p_items: items,
        },
      );

      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      toast.success("Pending supplier delivery created successfully.");
      setShowCreateDialog(false);
      resetCreate();

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["supplier_deliveries"] }),
        queryClient.invalidateQueries({ queryKey: ["purchase-order-lines-for-delivery"] }),
        queryClient.invalidateQueries({ queryKey: ["purchase_orders"] }),
      ]);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const receiveDelivery = useMutation({
    mutationFn: async () => {
      if (!selectedDelivery) throw new Error("Supplier delivery was not found.");
      if (!selectedDelivery.site_id) throw new Error("Delivery site is missing.");
      if (!stockLocationId) throw new Error("Please select a stock location.");

      const selected = receiveLines.filter((line) => line.selected);
      if (selected.length === 0) throw new Error("Please select at least one delivery line.");

      const items = selected.map((state) => {
        const item = selectedDelivery.supplier_delivery_items.find(
          (candidate) => candidate.supplier_delivery_item_id === state.supplierDeliveryItemId,
        );
        if (!item) throw new Error("Selected delivery item was not found.");

        const received = toNumber(state.received);
        const accepted = toNumber(state.accepted);
        const damaged = toNumber(state.damaged);
        const rejected = toNumber(state.rejected);
        const damageDetail = toNumber(state.damageDetailQuantity);

        const processed =
          toNumber(item.accepted_quantity) +
          toNumber(item.damaged_quantity) +
          toNumber(item.rejected_quantity);
        const outstanding = Math.max(0, round6(toNumber(item.received_quantity) - processed));

        if (received <= 0) {
          throw new Error(`Received quantity must be greater than zero on line ${item.line_no}.`);
        }
        if (round6(received) > round6(outstanding)) {
          throw new Error(`Received quantity exceeds outstanding on line ${item.line_no}.`);
        }
        if (round6(accepted + damaged + rejected) !== round6(received)) {
          throw new Error(
            `Accepted + damaged + rejected must equal received quantity on line ${item.line_no}.`,
          );
        }

        if (damageDetail > 0) {
          if (!state.damageDetailUomCode) {
            throw new Error(`Please select damage UOM on line ${item.line_no}.`);
          }
          if (!state.damageDescription.trim()) {
            throw new Error(`Please describe the damage on line ${item.line_no}.`);
          }
        }

        return {
          supplier_delivery_item_id: item.supplier_delivery_item_id,
          received_quantity: received,
          accepted_quantity: accepted,
          damaged_quantity: damaged,
          rejected_quantity: rejected,
          damage_detail_quantity: damageDetail,
          damage_detail_uom_code: damageDetail > 0 ? state.damageDetailUomCode : null,
          damage_description: damageDetail > 0 ? state.damageDescription.trim() : null,
          replacement_required: damageDetail > 0,
          lot_no: state.lotNo.trim() || null,
          expiry_date: state.expiryDate || null,
          notes: state.notes.trim() || null,
        };
      });

      const { data, error } = await (supabase as any).rpc(
        "create_site_goods_receiving_atomic",
        {
          p_supplier_delivery_id: selectedDelivery.supplier_delivery_id,
          p_site_id: selectedDelivery.site_id,
          p_stock_location_id: stockLocationId,
          p_items: items,
          p_notes: receiveNotes.trim() || null,
        },
      );

      if (error) throw error;
      return data;
    },
    onSuccess: async (result) => {
      const statusText = result?.delivery_status ? ` Delivery: ${result.delivery_status}.` : "";
      toast.success(`Goods receiving completed.${statusText}`);
      setShowReceiveDialog(false);
      resetReceive();

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["supplier_deliveries"] }),
        queryClient.invalidateQueries({ queryKey: ["purchase_orders"] }),
        queryClient.invalidateQueries({ queryKey: ["stock_lots"] }),
        queryClient.invalidateQueries({ queryKey: ["stock_movements"] }),
        queryClient.invalidateQueries({ queryKey: ["notification_events"] }),
      ]);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const selectedPO = purchaseOrders.find((po) => po.purchase_order_id === purchaseOrderId);

  const filteredDeliveries = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return deliveries.filter((delivery) => {
      if (statusFilter !== "all" && delivery.delivery_status !== statusFilter) return false;
      if (!keyword) return true;

      return [
        delivery.delivery_no,
        delivery.supplier_delivery_note_no,
        delivery.purchase_orders?.purchase_order_no,
        delivery.suppliers?.supplier_name,
        delivery.suppliers?.supplier_code,
        delivery.projects?.project_name,
        delivery.projects?.project_no,
        delivery.project_sites?.site_name,
        delivery.project_sites?.site_code,
      ].some((value) => (value ?? "").toLowerCase().includes(keyword));
    });
  }, [deliveries, searchTerm, statusFilter]);

  const summary = useMemo(
    () => ({
      total: deliveries.length,
      pending: deliveries.filter((item) => item.delivery_status === "Pending").length,
      partial: deliveries.filter((item) => item.delivery_status === "Partial").length,
      received: deliveries.filter((item) => item.delivery_status === "Received").length,
      rejected: deliveries.filter((item) => item.delivery_status === "Rejected").length,
    }),
    [deliveries],
  );

  if (permissionsLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-[#9E4B4B]" />
      </div>
    );
  }

  if (!permissions?.canView) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          You do not have permission to view supplier deliveries.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Truck className="h-8 w-8 text-[#9E4B4B]" />
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Supplier Deliveries
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Create delivery documents from purchase orders and confirm goods received at site.
          </p>
        </div>

        {permissions.canCreate && (
          <Button
            onClick={() => {
              resetCreate();
              setShowCreateDialog(true);
            }}
            className="gap-2 bg-[#9E4B4B] text-white hover:bg-[#863F3F]"
          >
            <Plus className="h-4 w-4" />
            Create Delivery
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["All Deliveries", summary.total],
          ["Pending", summary.pending],
          ["Partial", summary.partial],
          ["Received", summary.received],
          ["Rejected", summary.rejected],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search delivery, PO, supplier, project or site..."
              className={`pl-10 ${inputClass}`}
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={inputClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Partial">Partial</SelectItem>
              <SelectItem value="Received">Received</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {deliveriesLoading ? (
        <div className="flex min-h-[260px] items-center justify-center rounded-2xl border bg-white">
          <Loader2 className="h-7 w-7 animate-spin text-[#9E4B4B]" />
        </div>
      ) : deliveriesError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
          {getErrorMessage(deliveriesError)}
        </div>
      ) : filteredDeliveries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No supplier deliveries found.
        </div>
      ) : (
        <div className="space-y-0">
          <div className="hidden grid-cols-[minmax(210px,1.1fr)_minmax(180px,1fr)_minmax(180px,1fr)_minmax(240px,1.2fr)_minmax(180px,1fr)_120px] gap-4 rounded-t-2xl border border-b-0 border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 lg:grid">
            <div>Delivery</div>
            <div>Purchase Order</div>
            <div>Supplier</div>
            <div>Project / Site</div>
            <div>Progress</div>
            <div className="text-right">Action</div>
          </div>

          {filteredDeliveries.map((delivery) => {
            const items = delivery.supplier_delivery_items ?? [];
            const outstanding = Math.max(
              0,
              round6(
                items.reduce(
                  (sum, item) =>
                    sum +
                    toNumber(item.received_quantity) -
                    toNumber(item.accepted_quantity) -
                    toNumber(item.damaged_quantity) -
                    toNumber(item.rejected_quantity),
                  0,
                ),
              ),
            );

            return (
              <div
                key={delivery.supplier_delivery_id}
                className="border border-slate-200 bg-white p-4 shadow-sm first:rounded-t-none last:rounded-b-2xl lg:border-t-0 lg:shadow-none"
              >
                <div className="grid gap-4 lg:grid-cols-[minmax(210px,1.1fr)_minmax(180px,1fr)_minmax(180px,1fr)_minmax(240px,1.2fr)_minmax(180px,1fr)_120px] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900">{delivery.delivery_no}</p>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(
                          delivery.delivery_status,
                        )}`}
                      >
                        {delivery.delivery_status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(delivery.delivery_date)}
                      {delivery.supplier_delivery_note_no
                        ? ` · DO ${delivery.supplier_delivery_note_no}`
                        : ""}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 lg:hidden">Purchase Order</p>
                    <p className="font-medium text-slate-800">
                      {delivery.purchase_orders?.purchase_order_no ?? "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 lg:hidden">Supplier</p>
                    <p className="font-medium text-slate-800">
                      {delivery.suppliers?.supplier_name ?? "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 lg:hidden">Project / Site</p>
                    <p className="font-medium text-slate-800">
                      {delivery.projects?.project_name ?? "-"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {delivery.project_sites?.site_name ?? "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 lg:hidden">Progress</p>
                    <p className="font-medium text-slate-800">
                      {items.length} lines · Outstanding {formatQty(outstanding)}
                    </p>
                    {permissions.canViewCost && (
                      <p className="text-xs text-slate-500">
                        {formatMoney(delivery.purchase_orders?.total_amount)}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-start lg:justify-end">
                    {permissions.canReceive &&
                    outstanding > 0 &&
                    !["Rejected", "Cancelled"].includes(delivery.delivery_status) ? (
                      <Button
                        size="sm"
                        onClick={() => openReceive(delivery)}
                        className="gap-2 bg-[#9E4B4B] text-white hover:bg-[#863F3F]"
                      >
                        <ClipboardCheck className="h-4 w-4" />
                        Receive
                      </Button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <CheckCircle2 className="h-4 w-4" />
                        No action
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) resetCreate();
        }}
      >
        <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-[#9E4B4B]" />
              Create Supplier Delivery from Purchase Order
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <section className="rounded-2xl border p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#9E4B4B] text-sm font-bold text-white">
                  1
                </span>
                <h3 className="font-semibold text-slate-900">Delivery document</h3>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Purchase Order *</Label>
                  <Select value={purchaseOrderId} onValueChange={setPurchaseOrderId}>
                    <SelectTrigger className={inputClass}>
                      <SelectValue placeholder="Select purchase order" />
                    </SelectTrigger>
                    <SelectContent>
                      {purchaseOrders.map((po) => (
                        <SelectItem key={po.purchase_order_id} value={po.purchase_order_id}>
                          {po.purchase_order_no ?? "-"} — {po.suppliers?.supplier_name ?? "-"} —{" "}
                          {po.order_status ?? "-"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Delivery Date *</Label>
                  <Input
                    type="date"
                    value={deliveryDate}
                    onChange={(event) => setDeliveryDate(event.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Supplier Delivery Note No</Label>
                  <Input
                    value={supplierDeliveryNoteNo}
                    onChange={(event) => setSupplierDeliveryNoteNo(event.target.value)}
                    className={inputClass}
                  />
                </div>

                {selectedPO && (
                  <div className="rounded-xl border bg-slate-50 p-4 text-sm md:col-span-2">
                    <p><strong>Supplier:</strong> {selectedPO.suppliers?.supplier_name ?? "-"}</p>
                    <p><strong>Project:</strong> {selectedPO.projects?.project_name ?? "-"}</p>
                    <p><strong>Site:</strong> {selectedPO.project_sites?.site_name ?? "-"}</p>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#9E4B4B] text-sm font-bold text-white">
                  2
                </span>
                <h3 className="font-semibold text-slate-900">Items on this delivery</h3>
              </div>

              {!purchaseOrderId ? (
                <div className="mt-4 rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">
                  Select a purchase order first.
                </div>
              ) : poLinesLoading ? (
                <div className="flex min-h-[150px] items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-[#9E4B4B]" />
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {poLines.map((line) => {
                    const state = createLines.find(
                      (item) => item.purchaseOrderLineId === line.purchase_order_line_id,
                    );
                    const existing = existingQuantities.get(line.purchase_order_line_id) ?? 0;
                    const outstanding = Math.max(0, round6(toNumber(line.quantity) - existing));

                    return (
                      <div key={line.purchase_order_line_id} className="rounded-xl border p-4">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={state?.selected ?? false}
                            disabled={outstanding <= 0}
                            onChange={(event) =>
                              setCreateLines((current) =>
                                current.map((item) =>
                                  item.purchaseOrderLineId === line.purchase_order_line_id
                                    ? { ...item, selected: event.target.checked }
                                    : item,
                                ),
                              )
                            }
                            className="mt-1 h-4 w-4 accent-[#9E4B4B]"
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                              <div>
                                <p className="font-semibold text-slate-900">
                                  Line {line.line_no} — {line.products?.product_code ?? "-"}
                                </p>
                                <p className="text-sm text-slate-700">
                                  {line.products?.product_name ?? line.description ?? "-"}
                                </p>
                              </div>
                              <div className="text-xs text-slate-500 sm:text-right">
                                <p>Ordered: {formatQty(line.quantity)}</p>
                                <p>Existing deliveries: {formatQty(existing)}</p>
                                <p className="font-semibold">Outstanding: {formatQty(outstanding)}</p>
                              </div>
                            </div>

                            {state?.selected && (
                              <div className="mt-4 grid gap-3 md:grid-cols-2">
                                <div className="space-y-2">
                                  <Label>Delivery Quantity *</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max={outstanding}
                                    step={line.allow_fractional_quantity === false ? "1" : "0.000001"}
                                    value={state.quantity}
                                    onChange={(event) =>
                                      setCreateLines((current) =>
                                        current.map((item) =>
                                          item.purchaseOrderLineId === line.purchase_order_line_id
                                            ? { ...item, quantity: event.target.value }
                                            : item,
                                        ),
                                      )
                                    }
                                    className={inputClass}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Line Notes</Label>
                                  <Input
                                    value={state.notes}
                                    onChange={(event) =>
                                      setCreateLines((current) =>
                                        current.map((item) =>
                                          item.purchaseOrderLineId === line.purchase_order_line_id
                                            ? { ...item, notes: event.target.value }
                                            : item,
                                        ),
                                      )
                                    }
                                    className={inputClass}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-2xl border p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#9E4B4B] text-sm font-bold text-white">
                  3
                </span>
                <h3 className="font-semibold text-slate-900">Delivery notes</h3>
              </div>
              <Textarea
                value={createNotes}
                onChange={(event) => setCreateNotes(event.target.value)}
                rows={3}
                className={`mt-4 ${inputClass}`}
              />
            </section>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createDelivery.mutate()}
                disabled={createDelivery.isPending || poLinesLoading}
                className="gap-2 bg-[#9E4B4B] text-white hover:bg-[#863F3F]"
              >
                {createDelivery.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PackageCheck className="h-4 w-4" />
                )}
                Create Pending Delivery
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showReceiveDialog}
        onOpenChange={(open) => {
          setShowReceiveDialog(open);
          if (!open) resetReceive();
        }}
      >
        <DialogContent className="max-h-[94vh] max-w-7xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Receive Goods — {selectedDelivery?.delivery_no ?? ""}</DialogTitle>
          </DialogHeader>

          {selectedDelivery && (
            <div className="space-y-5">
              <div className="rounded-2xl border bg-slate-50 p-4 text-sm">
                <p><strong>Supplier:</strong> {selectedDelivery.suppliers?.supplier_name ?? "-"}</p>
                <p><strong>PO:</strong> {selectedDelivery.purchase_orders?.purchase_order_no ?? "-"}</p>
                <p><strong>Project:</strong> {selectedDelivery.projects?.project_name ?? "-"}</p>
                <p><strong>Site:</strong> {selectedDelivery.project_sites?.site_name ?? "-"}</p>
              </div>

              <section className="rounded-2xl border p-4">
                <h3 className="font-semibold text-slate-900">1. Receiving location</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Stock Location *</Label>
                    <Select value={stockLocationId} onValueChange={setStockLocationId}>
                      <SelectTrigger className={inputClass}>
                        <SelectValue
                          placeholder={
                            stockLocationsLoading ? "Loading locations..." : "Select stock location"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {stockLocations.map((location) => (
                          <SelectItem
                            key={location.stock_location_id}
                            value={location.stock_location_id}
                          >
                            {location.location_code} — {location.location_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Receipt Notes</Label>
                    <Input
                      value={receiveNotes}
                      onChange={(event) => setReceiveNotes(event.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                {!stockLocationsLoading && stockLocations.length === 0 && (
                  <p className="mt-3 text-xs text-red-600">
                    This site has no active stock location.
                  </p>
                )}
              </section>

              <section className="rounded-2xl border p-4">
                <h3 className="font-semibold text-slate-900">2. Inspect and classify items</h3>

                <div className="mt-4 space-y-4">
                  {selectedDelivery.supplier_delivery_items.map((item) => {
                    const state = receiveLines.find(
                      (line) => line.supplierDeliveryItemId === item.supplier_delivery_item_id,
                    );
                    const processed =
                      toNumber(item.accepted_quantity) +
                      toNumber(item.damaged_quantity) +
                      toNumber(item.rejected_quantity);
                    const outstanding = Math.max(
                      0,
                      round6(toNumber(item.received_quantity) - processed),
                    );
                    const classified =
                      toNumber(state?.accepted) +
                      toNumber(state?.damaged) +
                      toNumber(state?.rejected);
                    const balanced = round6(classified) === round6(toNumber(state?.received));
                    const units = productUnits.filter((unit) => unit.product_id === item.product_id);

                    return (
                      <div key={item.supplier_delivery_item_id} className="rounded-2xl border p-4">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={state?.selected ?? false}
                            disabled={outstanding <= 0}
                            onChange={(event) =>
                              setReceiveLines((current) =>
                                current.map((line) =>
                                  line.supplierDeliveryItemId === item.supplier_delivery_item_id
                                    ? { ...line, selected: event.target.checked }
                                    : line,
                                ),
                              )
                            }
                            className="mt-1 h-4 w-4 accent-[#9E4B4B]"
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                              <div>
                                <p className="font-semibold text-slate-900">
                                  Line {item.line_no} — {item.products?.product_code ?? "-"}
                                </p>
                                <p className="text-sm text-slate-700">
                                  {item.products?.product_name ?? "-"}
                                </p>
                              </div>
                              <div className="text-xs text-slate-500 sm:text-right">
                                <p>Document: {formatQty(item.received_quantity)} {item.received_uom_code}</p>
                                <p>Processed: {formatQty(processed)}</p>
                                <p className="font-semibold">Outstanding: {formatQty(outstanding)}</p>
                              </div>
                            </div>

                            {state?.selected && (
                              <>
                                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                  {[
                                    ["Process Now", "received"],
                                    ["Accepted", "accepted"],
                                    ["Damaged", "damaged"],
                                    ["Rejected", "rejected"],
                                  ].map(([label, field]) => (
                                    <div key={field} className="space-y-2">
                                      <Label>{label} *</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        step="0.000001"
                                        value={state[field as keyof ReceiveLineState] as string}
                                        onChange={(event) =>
                                          setReceiveLines((current) =>
                                            current.map((line) =>
                                              line.supplierDeliveryItemId ===
                                              item.supplier_delivery_item_id
                                                ? { ...line, [field]: event.target.value }
                                                : line,
                                            ),
                                          )
                                        }
                                        className={inputClass}
                                      />
                                    </div>
                                  ))}
                                </div>

                                <div
                                  className={`mt-3 rounded-lg border px-3 py-2 text-xs ${
                                    balanced
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                      : "border-red-200 bg-red-50 text-red-700"
                                  }`}
                                >
                                  Classified {formatQty(classified)} of {formatQty(state.received)}{" "}
                                  {item.received_uom_code}
                                </div>

                                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                                  <div className="flex items-start gap-2">
                                    <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-700" />
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-amber-900">
                                        Detailed damage inside accepted goods
                                      </p>
                                      <div className="mt-3 grid gap-3 md:grid-cols-3">
                                        <div className="space-y-2">
                                          <Label>Damage Quantity</Label>
                                          <Input
                                            type="number"
                                            min="0"
                                            step="0.000001"
                                            value={state.damageDetailQuantity}
                                            onChange={(event) =>
                                              setReceiveLines((current) =>
                                                current.map((line) =>
                                                  line.supplierDeliveryItemId ===
                                                  item.supplier_delivery_item_id
                                                    ? {
                                                        ...line,
                                                        damageDetailQuantity: event.target.value,
                                                      }
                                                    : line,
                                                ),
                                              )
                                            }
                                            className={inputClass}
                                          />
                                        </div>

                                        <div className="space-y-2">
                                          <Label>Damage UOM</Label>
                                          <Select
                                            value={state.damageDetailUomCode}
                                            onValueChange={(value) =>
                                              setReceiveLines((current) =>
                                                current.map((line) =>
                                                  line.supplierDeliveryItemId ===
                                                  item.supplier_delivery_item_id
                                                    ? { ...line, damageDetailUomCode: value }
                                                    : line,
                                                ),
                                              )
                                            }
                                          >
                                            <SelectTrigger className={inputClass}>
                                              <SelectValue placeholder="Select UOM" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {units.map((unit) => (
                                                <SelectItem
                                                  key={unit.product_unit_id}
                                                  value={unit.uom_code}
                                                >
                                                  {unit.uom_code}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>

                                        <div className="space-y-2">
                                          <Label>Damage Description</Label>
                                          <Input
                                            value={state.damageDescription}
                                            onChange={(event) =>
                                              setReceiveLines((current) =>
                                                current.map((line) =>
                                                  line.supplierDeliveryItemId ===
                                                  item.supplier_delivery_item_id
                                                    ? {
                                                        ...line,
                                                        damageDescription: event.target.value,
                                                      }
                                                    : line,
                                                ),
                                              )
                                            }
                                            className={inputClass}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-4 grid gap-3 md:grid-cols-3">
                                  <div className="space-y-2">
                                    <Label>Lot No</Label>
                                    <Input
                                      value={state.lotNo}
                                      onChange={(event) =>
                                        setReceiveLines((current) =>
                                          current.map((line) =>
                                            line.supplierDeliveryItemId ===
                                            item.supplier_delivery_item_id
                                              ? { ...line, lotNo: event.target.value }
                                              : line,
                                          ),
                                        )
                                      }
                                      className={inputClass}
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Expiry Date</Label>
                                    <Input
                                      type="date"
                                      value={state.expiryDate}
                                      onChange={(event) =>
                                        setReceiveLines((current) =>
                                          current.map((line) =>
                                            line.supplierDeliveryItemId ===
                                            item.supplier_delivery_item_id
                                              ? { ...line, expiryDate: event.target.value }
                                              : line,
                                          ),
                                        )
                                      }
                                      className={inputClass}
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Item Notes</Label>
                                    <Input
                                      value={state.notes}
                                      onChange={(event) =>
                                        setReceiveLines((current) =>
                                          current.map((line) =>
                                            line.supplierDeliveryItemId ===
                                            item.supplier_delivery_item_id
                                              ? { ...line, notes: event.target.value }
                                              : line,
                                          ),
                                        )
                                      }
                                      className={inputClass}
                                    />
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                The backend atomically creates receipt audit records, stock lots and movements,
                replacement claims/payment holds, delivery status, PO status and Telegram events.
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowReceiveDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => receiveDelivery.mutate()}
                  disabled={receiveDelivery.isPending || stockLocations.length === 0}
                  className="gap-2 bg-[#9E4B4B] text-white hover:bg-[#863F3F]"
                >
                  {receiveDelivery.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ClipboardCheck className="h-4 w-4" />
                  )}
                  Confirm Goods Receipt
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupplierDeliveries;