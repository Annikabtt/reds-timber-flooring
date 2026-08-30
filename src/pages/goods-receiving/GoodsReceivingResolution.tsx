import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Loader2,
  PackageCheck,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  INPUT_CLASS,
  REDS,
} from "./goodsReceiving.constants";
import type {
  Receipt,
  ReceiptItem,
  StockLocation,
  SupplierDelivery,
} from "./goodsReceiving.types";
import {
  formatDateTime,
  formatQty,
  getErrorMessage,
  toNumber,
} from "./goodsReceiving.utils";

type ResolutionIssueType =
  | "Damaged"
  | "Rejected / Return"
  | "Short / Missing";

type ResolutionAction =
  | "Return to Supplier"
  | "Replacement Received";

type Props = {
  deliveryId: string;
  receiptItemId?: string;
  issueType?: ResolutionIssueType;
  onBack: () => void;
  onCompleted: (deliveryId: string) => void;
};

type ResolutionSummaryRow = {
  resolution_case_id: string;
  resolution_no: string;
  supplier_delivery_receipt_item_id: string;
  product_id: string;
  issue_type: ResolutionIssueType;
  original_issue_quantity: number | string;
  original_issue_uom_code: string;
  original_issue_base_quantity: number | string;
  return_required: boolean;
  returned_base_quantity: number | string;
  outstanding_return_base_quantity: number | string;
  replacement_required: boolean;
  replacement_received_base_quantity: number | string;
  outstanding_replacement_base_quantity: number | string;
  resolution_status: string;
  supplier_replacement_claim_id: string | null;
  opened_at: string;
  resolved_at: string | null;
};

type ResolutionEvent = {
  resolution_event_id: string;
  resolution_case_id: string;
  event_no: string;
  event_sequence: number;
  event_type: string;
  event_quantity: number | string | null;
  event_uom_code: string | null;
  event_base_quantity: number | string | null;
  stock_location_id: string | null;
  stock_lot_id: string | null;
  stock_movement_id: string | null;
  supplier_replacement_receipt_id: string | null;
  supplier_replacement_receipt_item_id: string | null;
  reason: string | null;
  notes: string | null;
  event_at: string;
  performed_by_employee_id: string;
};

type ProductUnit = {
  product_unit_id: string;
  product_id: string;
  uom_code: string;
  conversion_to_base: number | string;
  allow_fractional_quantity: boolean;
  sort_order: number | null;
};

type ClaimItem = {
  supplier_replacement_claim_item_id: string;
  supplier_replacement_claim_id: string;
  supplier_delivery_receipt_item_id: string;
  product_id: string;
  replacement_uom_code: string;
  replacement_required_quantity: number | string;
  replacement_received_quantity: number | string;
  replacement_required_base_quantity: number | string | null;
  replacement_received_base_quantity: number | string;
  item_status: string;
};

type IssueCandidate = {
  key: string;
  receiptItemId: string;
  supplierDeliveryItemId: string;
  productId: string;
  productCode: string;
  productName: string;
  issueType: ResolutionIssueType;
  quantity: number;
  uom: string;
  baseQuantity: number;
  reason: string | null;
  summary: ResolutionSummaryRow | null;
};

const PANEL =
  "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

const FIELD =
  "min-h-10 rounded-lg border border-slate-200 bg-[#F7F9FB] px-3 py-2 text-sm font-medium text-slate-800";

const issueClass = (type: ResolutionIssueType) => {
  if (type === "Damaged") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  if (type === "Rejected / Return") {
    return "border-red-200 bg-red-50 text-red-700";
  }
  return "border-blue-200 bg-blue-50 text-blue-700";
};

const statusClass = (status: string) => {
  if (status === "Resolved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "In Progress") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  if (status === "Cancelled") {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }
  return "border-blue-200 bg-blue-50 text-blue-700";
};

const issueValue = (
  item: ReceiptItem,
  issueType: ResolutionIssueType,
) => {
  if (issueType === "Damaged") {
    return {
      quantity: toNumber(
        item.damaged_input_quantity ?? item.damaged_quantity,
      ),
      uom:
        item.damaged_input_uom_code ??
        item.received_uom_code,
      baseQuantity: toNumber(item.damaged_base_quantity),
      reason: item.damage_description,
    };
  }

  if (issueType === "Rejected / Return") {
    return {
      quantity: toNumber(
        item.rejected_input_quantity ?? item.rejected_quantity,
      ),
      uom:
        item.rejected_input_uom_code ??
        item.received_uom_code,
      baseQuantity: toNumber(item.rejected_base_quantity),
      reason: item.rejection_reason,
    };
  }

  return {
    quantity: toNumber(
      item.short_input_quantity ?? item.short_quantity,
    ),
    uom:
      item.short_input_uom_code ??
      item.received_uom_code,
    baseQuantity: toNumber(item.short_base_quantity),
    reason: item.short_reason,
  };
};

const formatWithUom = (
  quantity: number | string | null | undefined,
  uom: string | null | undefined,
) => `${formatQty(quantity)} ${uom ?? ""}`.trim();

export default function GoodsReceivingResolution({
  deliveryId,
  receiptItemId,
  issueType,
  onBack,
  onCompleted,
}: Props) {
  const queryClient = useQueryClient();

  const [selectedKey, setSelectedKey] = useState("");
  const [action, setAction] =
    useState<ResolutionAction>("Return to Supplier");

  const [returnRequired, setReturnRequired] = useState(false);
  const [replacementRequired, setReplacementRequired] =
    useState(false);

  const [quantity, setQuantity] = useState("");
  const [uomCode, setUomCode] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const [stockLocationId, setStockLocationId] = useState("");
  const [supplierReplacementNoteNo, setSupplierReplacementNoteNo] =
    useState("");

  const { data: delivery, isLoading: deliveryLoading } = useQuery({
    queryKey: ["goods-receiving-resolution-delivery", deliveryId],
    enabled: Boolean(deliveryId),
    queryFn: async (): Promise<SupplierDelivery | null> => {
      const { data, error } = await (supabase as any)
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
          purchase_orders (
            purchase_order_no
          ),
          suppliers (
            supplier_code,
            supplier_name
          ),
          projects (
            project_no,
            project_name
          ),
          project_sites (
            site_code,
            site_name
          ),
          supplier_delivery_items (
            supplier_delivery_item_id,
            supplier_delivery_id,
            purchase_order_line_id,
            product_id,
            line_no,
            received_quantity,
            received_uom_code,
            conversion_factor_to_base,
            products (
              product_id,
              product_code,
              product_name,
              base_uom_code
            )
          )
        `)
        .eq("supplier_delivery_id", deliveryId)
        .eq("is_deleted", false)
        .maybeSingle();

      if (error) throw error;
      return data as SupplierDelivery | null;
    },
  });

  const { data: receipts = [], isLoading: receiptsLoading } = useQuery({
    queryKey: ["goods-receiving-resolution-receipts", deliveryId],
    enabled: Boolean(deliveryId),
    queryFn: async (): Promise<Receipt[]> => {
      const { data, error } = await (supabase as any)
        .from("supplier_delivery_receipts")
        .select(`
          supplier_delivery_receipt_id,
          supplier_delivery_id,
          project_id,
          site_id,
          received_by_employee_id,
          received_at,
          receipt_status,
          notes
        `)
        .eq("supplier_delivery_id", deliveryId)
        .eq("is_deleted", false)
        .order("received_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as Receipt[];
    },
  });

  const latestReceipt = receipts[0] ?? null;

  const { data: receiptItems = [], isLoading: receiptItemsLoading } =
    useQuery({
      queryKey: [
        "goods-receiving-resolution-items",
        latestReceipt?.supplier_delivery_receipt_id,
      ],
      enabled: Boolean(latestReceipt?.supplier_delivery_receipt_id),
      queryFn: async (): Promise<ReceiptItem[]> => {
        const { data, error } = await (supabase as any)
          .from("supplier_delivery_receipt_items")
          .select(`
            supplier_delivery_receipt_item_id,
            supplier_delivery_receipt_id,
            supplier_delivery_item_id,
            expected_quantity,
            expected_uom_code,
            expected_base_quantity,
            received_quantity,
            received_uom_code,
            accepted_quantity,
            accepted_input_quantity,
            accepted_input_uom_code,
            accepted_base_quantity,
            damaged_quantity,
            damaged_input_quantity,
            damaged_input_uom_code,
            damaged_base_quantity,
            rejected_quantity,
            rejected_input_quantity,
            rejected_input_uom_code,
            rejected_base_quantity,
            short_quantity,
            short_input_quantity,
            short_input_uom_code,
            short_base_quantity,
            damage_description,
            rejection_reason,
            short_reason,
            replacement_required_quantity,
            replacement_required_uom_code,
            replacement_received_quantity,
            stock_location_id,
            stock_lot_id,
            stock_movement_id,
            notes
          `)
          .eq(
            "supplier_delivery_receipt_id",
            latestReceipt!.supplier_delivery_receipt_id,
          )
          .eq("is_deleted", false);

        if (error) throw error;
        return (data ?? []) as ReceiptItem[];
      },
    });

  const { data: resolutionSummary = [] } = useQuery({
    queryKey: [
      "goods-receiving-resolution-summary",
      latestReceipt?.supplier_delivery_receipt_id,
    ],
    enabled: Boolean(latestReceipt?.supplier_delivery_receipt_id),
    queryFn: async (): Promise<ResolutionSummaryRow[]> => {
      const { data, error } = await (supabase as any).rpc(
        "get_goods_receiving_resolution_summary",
        {
          p_supplier_delivery_receipt_id:
            latestReceipt!.supplier_delivery_receipt_id,
        },
      );

      if (error) throw error;
      return (data ?? []) as ResolutionSummaryRow[];
    },
  });

  const resolutionCaseIds = useMemo(
    () => resolutionSummary.map((row) => row.resolution_case_id),
    [resolutionSummary],
  );

  const { data: resolutionEvents = [] } = useQuery({
    queryKey: [
      "goods-receiving-resolution-events",
      resolutionCaseIds,
    ],
    enabled: resolutionCaseIds.length > 0,
    queryFn: async (): Promise<ResolutionEvent[]> => {
      const { data, error } = await (supabase as any)
        .from("goods_receiving_resolution_events")
        .select(`
          resolution_event_id,
          resolution_case_id,
          event_no,
          event_sequence,
          event_type,
          event_quantity,
          event_uom_code,
          event_base_quantity,
          stock_location_id,
          stock_lot_id,
          stock_movement_id,
          supplier_replacement_receipt_id,
          supplier_replacement_receipt_item_id,
          reason,
          notes,
          event_at,
          performed_by_employee_id
        `)
        .in("resolution_case_id", resolutionCaseIds)
        .order("event_at", { ascending: true })
        .order("event_sequence", { ascending: true });

      if (error) throw error;
      return (data ?? []) as ResolutionEvent[];
    },
  });

  const productIds = useMemo(() => {
    if (!delivery) return [];
    return Array.from(
      new Set(
        delivery.supplier_delivery_items
          .map((item) => item.product_id)
          .filter(Boolean),
      ),
    );
  }, [delivery]);

  const { data: productUnits = [] } = useQuery({
    queryKey: ["goods-receiving-resolution-product-units", productIds],
    enabled: productIds.length > 0,
    queryFn: async (): Promise<ProductUnit[]> => {
      const { data, error } = await (supabase as any)
        .from("product_units")
        .select(`
          product_unit_id,
          product_id,
          uom_code,
          conversion_to_base,
          allow_fractional_quantity,
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

  const { data: stockLocations = [] } = useQuery({
    queryKey: [
      "goods-receiving-resolution-stock-locations",
      delivery?.site_id,
      delivery?.supplier_id,
    ],
    enabled: Boolean(delivery),
    queryFn: async (): Promise<StockLocation[]> => {
      const { data, error } = await (supabase as any)
        .from("stock_locations")
        .select(`
          stock_location_id,
          location_code,
          location_name,
          location_type,
          site_id,
          project_id,
          supplier_id
        `)
        .eq("is_active", true)
        .eq("is_deleted", false)
        .order("location_name", { ascending: true });

      if (error) throw error;

      return ((data ?? []) as Array<
        StockLocation & {
          location_type?: string | null;
          project_id?: string | null;
          supplier_id?: string | null;
        }
      >).filter((location) => {
        if (location.location_type === "Site") {
          return location.site_id === delivery!.site_id;
        }

        if (location.location_type === "Warehouse") {
          if (location.supplier_id) {
            return location.supplier_id === delivery!.supplier_id;
          }
          return true;
        }

        return false;
      });
    },
  });

  const claimIds = useMemo(
    () =>
      Array.from(
        new Set(
          resolutionSummary
            .map((row) => row.supplier_replacement_claim_id)
            .filter((value): value is string => Boolean(value)),
        ),
      ),
    [resolutionSummary],
  );

  const { data: claimItems = [] } = useQuery({
    queryKey: ["goods-receiving-resolution-claim-items", claimIds],
    enabled: claimIds.length > 0,
    queryFn: async (): Promise<ClaimItem[]> => {
      const { data, error } = await (supabase as any)
        .from("supplier_replacement_claim_items")
        .select(`
          supplier_replacement_claim_item_id,
          supplier_replacement_claim_id,
          supplier_delivery_receipt_item_id,
          product_id,
          replacement_uom_code,
          replacement_required_quantity,
          replacement_received_quantity,
          replacement_required_base_quantity,
          replacement_received_base_quantity,
          item_status
        `)
        .in("supplier_replacement_claim_id", claimIds)
        .eq("is_deleted", false);

      if (error) throw error;
      return (data ?? []) as ClaimItem[];
    },
  });

  const candidates = useMemo<IssueCandidate[]>(() => {
    if (!delivery) return [];

    const rows: IssueCandidate[] = [];

    receiptItems.forEach((item) => {
      const deliveryItem = delivery.supplier_delivery_items.find(
        (row) =>
          row.supplier_delivery_item_id ===
          item.supplier_delivery_item_id,
      );

      if (!deliveryItem) return;

      (
        [
          "Damaged",
          "Rejected / Return",
          "Short / Missing",
        ] as ResolutionIssueType[]
      ).forEach((type) => {
        const issue = issueValue(item, type);
        if (issue.baseQuantity <= 0) return;

        const summary =
          resolutionSummary.find(
            (row) =>
              row.supplier_delivery_receipt_item_id ===
                item.supplier_delivery_receipt_item_id &&
              row.issue_type === type,
          ) ?? null;

        rows.push({
          key: `${item.supplier_delivery_receipt_item_id}-${type}`,
          receiptItemId: item.supplier_delivery_receipt_item_id,
          supplierDeliveryItemId:
            item.supplier_delivery_item_id,
          productId: deliveryItem.product_id,
          productCode:
            deliveryItem.products?.product_code ?? "-",
          productName:
            deliveryItem.products?.product_name ??
            "Unknown product",
          issueType: type,
          quantity: issue.quantity,
          uom: issue.uom,
          baseQuantity: issue.baseQuantity,
          reason: issue.reason,
          summary,
        });
      });
    });

    return rows;
  }, [delivery, receiptItems, resolutionSummary]);

  useEffect(() => {
    if (selectedKey || candidates.length === 0) return;

    const exact =
      candidates.find(
        (candidate) =>
          (!receiptItemId ||
            candidate.receiptItemId === receiptItemId) &&
          (!issueType || candidate.issueType === issueType),
      ) ?? candidates[0];

    setSelectedKey(exact.key);
  }, [
    candidates,
    issueType,
    receiptItemId,
    selectedKey,
  ]);

  const selected = useMemo(
    () =>
      candidates.find(
        (candidate) => candidate.key === selectedKey,
      ) ?? null,
    [candidates, selectedKey],
  );

  const selectedSummary = selected?.summary ?? null;

  const selectedClaimItem = useMemo(() => {
    if (!selectedSummary?.supplier_replacement_claim_id || !selected) {
      return null;
    }

    return (
      claimItems.find(
        (item) =>
          item.supplier_replacement_claim_id ===
            selectedSummary.supplier_replacement_claim_id &&
          item.supplier_delivery_receipt_item_id ===
            selected.receiptItemId,
      ) ?? null
    );
  }, [claimItems, selected, selectedSummary]);

  const availableUnits = useMemo(() => {
    if (!selected) return [];

    const units = productUnits
      .filter((unit) => unit.product_id === selected.productId)
      .map((unit) => unit.uom_code);

    if (!units.includes(selected.uom)) {
      units.unshift(selected.uom);
    }

    return Array.from(new Set(units));
  }, [productUnits, selected]);

  useEffect(() => {
    if (!selected) return;

    setReturnRequired(
      selected.summary?.return_required ??
        selected.issueType === "Rejected / Return",
    );

    setReplacementRequired(
      selected.summary?.replacement_required ??
        selected.issueType !== "Rejected / Return",
    );

    setQuantity("");
    setUomCode(selected.uom);
    setReason(selected.reason ?? "");
    setNotes("");

    if (
      selected.summary?.replacement_required &&
      !selected.summary?.return_required
    ) {
      setAction("Replacement Received");
    } else {
      setAction("Return to Supplier");
    }
  }, [selected?.key]);

  const refreshAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: [
          "goods-receiving-resolution-summary",
          latestReceipt?.supplier_delivery_receipt_id,
        ],
      }),
      queryClient.invalidateQueries({
        queryKey: ["goods-receiving-resolution-events"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["goods-receiving-resolution-claim-items"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["goods-receiving-edit-delivery", deliveryId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["goods-receiving-edit-receipts", deliveryId],
      }),
    ]);
  };

  const createCaseMutation = useMutation({
    mutationFn: async () => {
      if (!selected) {
        throw new Error("Select an issue to resolve.");
      }

      const { data, error } = await (supabase as any).rpc(
        "create_goods_receiving_resolution_case",
        {
          p_supplier_delivery_receipt_item_id:
            selected.receiptItemId,
          p_issue_type: selected.issueType,
          p_return_required: returnRequired,
          p_replacement_required: replacementRequired,
          p_notes: notes.trim() || null,
        },
      );

      if (error) throw error;
      return data as {
        resolution_case_id: string;
        resolution_no: string;
        created: boolean;
      };
    },
    onSuccess: async (data) => {
      await refreshAll();
      toast.success(
        data.created
          ? `Resolution ${data.resolution_no} created.`
          : `Resolution ${data.resolution_no} opened.`,
      );
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const returnMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSummary) {
        throw new Error("Create the Resolution Case first.");
      }

      if (!quantity || toNumber(quantity) <= 0) {
        throw new Error("Return quantity must be greater than zero.");
      }

      if (!uomCode) {
        throw new Error("Return UOM is required.");
      }

      if (!reason.trim()) {
        throw new Error("Return reason is required.");
      }

      const { data, error } = await (supabase as any).rpc(
        "record_goods_receiving_resolution_return",
        {
          p_resolution_case_id:
            selectedSummary.resolution_case_id,
          p_quantity: toNumber(quantity),
          p_uom_code: uomCode,
          p_reason: reason.trim(),
          p_notes: notes.trim() || null,
        },
      );

      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await refreshAll();
      setQuantity("");
      setNotes("");
      toast.success("Return event recorded.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const replacementMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSummary) {
        throw new Error("Create the Resolution Case first.");
      }

      if (!selectedSummary.supplier_replacement_claim_id) {
        throw new Error(
          "This Resolution Case is not linked to a Supplier Replacement Claim.",
        );
      }

      if (!selectedClaimItem) {
        throw new Error(
          "Supplier Replacement Claim Item was not found.",
        );
      }

      if (!quantity || toNumber(quantity) <= 0) {
        throw new Error(
          "Replacement received quantity must be greater than zero.",
        );
      }

      if (!stockLocationId) {
        throw new Error("Stock Location is required.");
      }

      if (!delivery?.site_id) {
        throw new Error("Receiving Site was not found.");
      }

      const { data, error } = await (supabase as any).rpc(
        "receive_goods_receiving_resolution_replacement",
        {
          p_resolution_case_id:
            selectedSummary.resolution_case_id,
          p_site_id: delivery.site_id,
          p_stock_location_id: stockLocationId,
          p_supplier_replacement_note_no:
            supplierReplacementNoteNo.trim() || null,
          p_items: [
            {
              supplier_replacement_claim_item_id:
                selectedClaimItem.supplier_replacement_claim_item_id,
              received_quantity: toNumber(quantity),
              notes: notes.trim() || null,
            },
          ],
          p_notes: notes.trim() || null,
        },
      );

      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await refreshAll();
      setQuantity("");
      setNotes("");
      setSupplierReplacementNoteNo("");
      toast.success("Replacement receiving recorded.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const currentEvents = useMemo(() => {
    if (!selectedSummary) return [];

    return resolutionEvents.filter(
      (event) =>
        event.resolution_case_id ===
        selectedSummary.resolution_case_id,
    );
  }, [resolutionEvents, selectedSummary]);

  const isBusy =
    createCaseMutation.isPending ||
    returnMutation.isPending ||
    replacementMutation.isPending;

  const canReceiveReplacement =
    Boolean(selectedSummary?.supplier_replacement_claim_id) &&
    Boolean(selectedClaimItem);

  const loading =
    deliveryLoading ||
    receiptsLoading ||
    receiptItemsLoading;

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Loader2
          className="h-7 w-7 animate-spin"
          style={{ color: REDS }}
        />
      </div>
    );
  }

  if (!delivery || !latestReceipt) {
    return (
      <div className="p-4 sm:p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          Posted Goods Receiving record was not found.
        </div>
        <Button
          variant="outline"
          className="mt-4"
          onClick={onBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 bg-slate-50/40 p-4 sm:p-6">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Goods Receiving
      </Button>

      <section className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
        <div className="h-1.5 bg-amber-500" />

        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">
                Resolve Receiving Issue —{" "}
                {delivery.supplier_delivery_note_no ??
                  delivery.delivery_no}
              </h1>

              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                Corrective Workflow
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Original Goods Receiving remains unchanged. Every
              corrective action becomes a new append-only Resolution
              Event.
            </p>
          </div>

          <Button variant="outline" onClick={onBack}>
            Cancel
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-amber-700" />
          <div>
            <p className="font-semibold text-amber-950">
              Original Receiving is immutable
            </p>
            <p className="mt-1 text-sm text-amber-900">
              Return and Replacement actions are recorded separately.
              Replacement Receiving creates a new receiving
              transaction and stock movement.
            </p>
          </div>
        </div>
      </section>

      {/* Source GR */}
      <section className={PANEL}>
        <div className="mb-4">
          <h2 className="font-bold text-slate-900">
            Source Goods Receiving
          </h2>
          <p className="text-xs text-slate-500">
            Read-only source transaction
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Delivery Bill</Label>
            <div className={FIELD}>
              {delivery.supplier_delivery_note_no ?? "-"}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Purchase Order</Label>
            <div className={FIELD}>
              {delivery.purchase_orders?.purchase_order_no ?? "-"}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Supplier</Label>
            <div className={FIELD}>
              {delivery.suppliers?.supplier_name ?? "-"}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Receiving Date</Label>
            <div className={FIELD}>
              {formatDateTime(latestReceipt.received_at)}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Project</Label>
            <div className={FIELD}>
              {delivery.projects?.project_name ?? "-"}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Site</Label>
            <div className={FIELD}>
              {delivery.project_sites?.site_name ?? "-"}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Delivery Status</Label>
            <div className={FIELD}>
              {delivery.delivery_status}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Receipt Status</Label>
            <div className={FIELD}>
              {latestReceipt.receipt_status}
            </div>
          </div>
        </div>
      </section>

      {/* Issue selection */}
      <section className={PANEL}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900">
              Select Issue to Resolve
            </h2>
            <p className="text-xs text-slate-500">
              Each primary issue has its own Resolution Case.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1120px] w-full text-left text-xs">
            <thead className="bg-[#F7F9FB] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="border p-2.5">Select</th>
                <th className="border p-2.5">Issue</th>
                <th className="border p-2.5">Product</th>
                <th className="border p-2.5 text-right">
                  Original Issue
                </th>
                <th className="border p-2.5">Reason</th>
                <th className="border p-2.5">Resolution</th>
                <th className="border p-2.5">Status</th>
              </tr>
            </thead>

            <tbody>
              {candidates.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="border p-6 text-center text-slate-500"
                  >
                    No receiving issue exists on the latest posted
                    receipt.
                  </td>
                </tr>
              ) : (
                candidates.map((candidate) => (
                  <tr
                    key={candidate.key}
                    className={
                      selectedKey === candidate.key
                        ? "bg-amber-50/50"
                        : ""
                    }
                  >
                    <td className="border p-2.5 text-center">
                      <input
                        type="radio"
                        checked={selectedKey === candidate.key}
                        onChange={() =>
                          setSelectedKey(candidate.key)
                        }
                        aria-label={`Select ${candidate.issueType}`}
                      />
                    </td>

                    <td className="border p-2.5">
                      <span
                        className={`inline-flex rounded-full border px-2 py-1 font-semibold ${issueClass(
                          candidate.issueType,
                        )}`}
                      >
                        {candidate.issueType}
                      </span>
                    </td>

                    <td className="border p-2.5">
                      <div className="font-semibold text-slate-900">
                        {candidate.productCode}
                      </div>
                      <div className="text-slate-500">
                        {candidate.productName}
                      </div>
                    </td>

                    <td className="border p-2.5 text-right">
                      <div className="font-semibold">
                        {formatWithUom(
                          candidate.quantity,
                          candidate.uom,
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {formatQty(candidate.baseQuantity)} base
                      </div>
                    </td>

                    <td className="border p-2.5">
                      {candidate.reason ?? "-"}
                    </td>

                    <td className="border p-2.5 font-semibold">
                      {candidate.summary?.resolution_no ??
                        "Not started"}
                    </td>

                    <td className="border p-2.5">
                      <span
                        className={`inline-flex rounded-full border px-2 py-1 font-semibold ${statusClass(
                          candidate.summary?.resolution_status ??
                            "Open",
                        )}`}
                      >
                        {candidate.summary?.resolution_status ??
                          "Open"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <>
          {/* Case */}
          <section className={PANEL}>
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-bold text-slate-900">
                  Resolution Case
                </h2>
                <p className="text-xs text-slate-500">
                  One case per source item + primary issue
                </p>
              </div>

              {selectedSummary && (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-slate-900">
                    {selectedSummary.resolution_no}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusClass(
                      selectedSummary.resolution_status,
                    )}`}
                  >
                    {selectedSummary.resolution_status}
                  </span>
                </div>
              )}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-[#F7F9FB] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Original Issue Qty
                </p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {formatWithUom(
                    selected.quantity,
                    selected.uom,
                  )}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatQty(selected.baseQuantity)} base
                </p>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4">
                <Checkbox
                  checked={returnRequired}
                  disabled={Boolean(selectedSummary)}
                  onCheckedChange={(checked) =>
                    setReturnRequired(checked === true)
                  }
                />
                <div>
                  <p className="font-semibold text-slate-900">
                    Return Required
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Supplier return may occur in partial events.
                  </p>
                </div>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4">
                <Checkbox
                  checked={replacementRequired}
                  disabled={Boolean(selectedSummary)}
                  onCheckedChange={(checked) =>
                    setReplacementRequired(checked === true)
                  }
                />
                <div>
                  <p className="font-semibold text-slate-900">
                    Replacement Required
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Replacement may be received in multiple
                    transactions.
                  </p>
                </div>
              </label>
            </div>

            {!selectedSummary && (
              <div className="mt-4 flex justify-end">
                <Button
                  className="bg-amber-600 text-white hover:bg-amber-700"
                  disabled={createCaseMutation.isPending}
                  onClick={() => createCaseMutation.mutate()}
                >
                  {createCaseMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Create Resolution Case
                </Button>
              </div>
            )}
          </section>

          {selectedSummary && (
            <>
              {/* Progress */}
              <section className={PANEL}>
                <h2 className="font-bold text-slate-900">
                  Resolution Progress
                </h2>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">
                      Original Issue
                    </p>
                    <p className="mt-1 text-lg font-bold">
                      {formatQty(
                        selectedSummary.original_issue_base_quantity,
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs text-amber-800">
                      Returned / Outstanding Return
                    </p>
                    <p className="mt-1 text-lg font-bold text-amber-900">
                      {formatQty(
                        selectedSummary.returned_base_quantity,
                      )}{" "}
                      /{" "}
                      {selectedSummary.return_required
                        ? formatQty(
                            selectedSummary.outstanding_return_base_quantity,
                          )
                        : "-"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-xs text-emerald-800">
                      Replacement Received
                    </p>
                    <p className="mt-1 text-lg font-bold text-emerald-900">
                      {formatQty(
                        selectedSummary.replacement_received_base_quantity,
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                    <p className="text-xs text-blue-800">
                      Outstanding Replacement
                    </p>
                    <p className="mt-1 text-lg font-bold text-blue-900">
                      {selectedSummary.replacement_required
                        ? formatQty(
                            selectedSummary.outstanding_replacement_base_quantity,
                          )
                        : "-"}
                    </p>
                  </div>
                </div>
              </section>

              {/* Action */}
              {selectedSummary.resolution_status !== "Resolved" &&
                selectedSummary.resolution_status !== "Cancelled" && (
                  <section className={PANEL}>
                    <div className="mb-4">
                      <h2 className="font-bold text-slate-900">
                        Resolution Action
                      </h2>
                      <p className="text-xs text-slate-500">
                        Each submission creates a new event.
                      </p>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Action Type</Label>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Button
                            type="button"
                            variant={
                              action === "Return to Supplier"
                                ? "default"
                                : "outline"
                            }
                            className={
                              action === "Return to Supplier"
                                ? "bg-amber-600 text-white hover:bg-amber-700"
                                : ""
                            }
                            disabled={!selectedSummary.return_required}
                            onClick={() =>
                              setAction("Return to Supplier")
                            }
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Return to Supplier
                          </Button>

                          <Button
                            type="button"
                            variant={
                              action === "Replacement Received"
                                ? "default"
                                : "outline"
                            }
                            className={
                              action === "Replacement Received"
                                ? "bg-emerald-700 text-white hover:bg-emerald-800"
                                : ""
                            }
                            disabled={
                              !selectedSummary.replacement_required
                            }
                            onClick={() =>
                              setAction("Replacement Received")
                            }
                          >
                            <PackageCheck className="mr-2 h-4 w-4" />
                            Replacement Received
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <div className="grid grid-cols-[1fr_150px] gap-2">
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            className={INPUT_CLASS}
                            value={quantity}
                            onChange={(event) =>
                              setQuantity(event.target.value)
                            }
                          />

                          <select
                            className={INPUT_CLASS}
                            value={uomCode}
                            disabled={
                              action === "Replacement Received"
                            }
                            onChange={(event) =>
                              setUomCode(event.target.value)
                            }
                          >
                            {availableUnits.map((uom) => (
                              <option key={uom} value={uom}>
                                {uom}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {action === "Return to Supplier" ? (
                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Return Reason</Label>
                          <Input
                            className={INPUT_CLASS}
                            value={reason}
                            onChange={(event) =>
                              setReason(event.target.value)
                            }
                            placeholder="Reason for return"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Notes</Label>
                          <Input
                            className={INPUT_CLASS}
                            value={notes}
                            onChange={(event) =>
                              setNotes(event.target.value)
                            }
                            placeholder="Optional event notes"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-4">
                        {!canReceiveReplacement && (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                              <div>
                                <p className="font-semibold">
                                  Supplier Replacement Claim required
                                </p>
                                <p className="mt-1">
                                  This case does not currently have the
                                  authoritative Supplier Replacement Claim
                                  linkage required to receive replacement
                                  stock. No stock transaction will be
                                  invented from this screen.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="grid gap-4 lg:grid-cols-3">
                          <div className="space-y-2">
                            <Label>Replacement UOM</Label>
                            <div className={FIELD}>
                              {selectedClaimItem?.replacement_uom_code ??
                                selected.uom}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Stock Location</Label>
                            <select
                              className={INPUT_CLASS}
                              value={stockLocationId}
                              onChange={(event) =>
                                setStockLocationId(event.target.value)
                              }
                            >
                              <option value="">
                                Select stock location
                              </option>
                              {stockLocations.map((location) => (
                                <option
                                  key={location.stock_location_id}
                                  value={location.stock_location_id}
                                >
                                  {location.location_code} —{" "}
                                  {location.location_name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-2">
                            <Label>
                              Supplier Replacement Note No.
                            </Label>
                            <Input
                              className={INPUT_CLASS}
                              value={supplierReplacementNoteNo}
                              onChange={(event) =>
                                setSupplierReplacementNoteNo(
                                  event.target.value,
                                )
                              }
                              placeholder="Supplier document reference"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Replacement Receipt Notes</Label>
                          <Textarea
                            className={`${INPUT_CLASS} min-h-24`}
                            value={notes}
                            onChange={(event) =>
                              setNotes(event.target.value)
                            }
                            placeholder="Optional receiving notes"
                          />
                        </div>
                      </div>
                    )}

                    <div className="mt-5 flex justify-end">
                      <Button
                        className={
                          action === "Return to Supplier"
                            ? "bg-amber-600 text-white hover:bg-amber-700"
                            : "bg-emerald-700 text-white hover:bg-emerald-800"
                        }
                        disabled={
                          isBusy ||
                          (action === "Replacement Received" &&
                            !canReceiveReplacement)
                        }
                        onClick={() => {
                          if (action === "Return to Supplier") {
                            returnMutation.mutate();
                          } else {
                            replacementMutation.mutate();
                          }
                        }}
                      >
                        {isBusy ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : action === "Return to Supplier" ? (
                          <RotateCcw className="mr-2 h-4 w-4" />
                        ) : (
                          <Truck className="mr-2 h-4 w-4" />
                        )}

                        {action === "Return to Supplier"
                          ? "Record Return Event"
                          : "Receive Replacement"}
                      </Button>
                    </div>
                  </section>
                )}

              {/* History */}
              <section className={PANEL}>
                <div className="mb-4 flex items-center gap-2">
                  <Clock3 className="h-5 w-5 text-slate-500" />
                  <div>
                    <h2 className="font-bold text-slate-900">
                      Resolution Events / History
                    </h2>
                    <p className="text-xs text-slate-500">
                      Append-only audit history
                    </p>
                  </div>
                </div>

                {currentEvents.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    No Resolution Event has been recorded yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentEvents.map((event) => (
                      <div
                        key={event.resolution_event_id}
                        className="grid gap-3 rounded-xl border border-slate-200 bg-[#F7F9FB] p-4 md:grid-cols-[180px_210px_1fr_auto]"
                      >
                        <div>
                          <p className="text-xs text-slate-500">
                            Event
                          </p>
                          <p className="font-mono text-sm font-bold text-slate-900">
                            {event.event_no}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Action
                          </p>
                          <p className="font-semibold text-slate-900">
                            {event.event_type}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Detail
                          </p>

                          {event.event_quantity !== null && (
                            <p className="font-semibold">
                              {formatWithUom(
                                event.event_quantity,
                                event.event_uom_code,
                              )}
                            </p>
                          )}

                          {(event.reason || event.notes) && (
                            <p className="mt-1 text-xs text-slate-500">
                              {[event.reason, event.notes]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          )}

                          {event.stock_movement_id && (
                            <p className="mt-1 text-[11px] text-emerald-700">
                              Stock movement linked
                            </p>
                          )}
                        </div>

                        <div className="text-right text-xs text-slate-500">
                          {formatDateTime(event.event_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {selectedSummary.resolution_status === "Resolved" && (
                <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />
                    <div>
                      <p className="font-semibold text-emerald-900">
                        Resolution completed
                      </p>
                      <p className="mt-1 text-sm text-emerald-800">
                        This Resolution Case is closed. Existing
                        events remain available as read-only history.
                      </p>
                    </div>
                  </div>
                </section>
              )}
            </>
          )}
        </>
      )}

      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => onCompleted(deliveryId)}
        >
          Done
        </Button>
      </div>
    </div>
  );
}
