import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  History,
  ImagePlus,
  Loader2,
  Maximize2,
  X,
  Lock,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  INPUT_CLASS,
  PHOTO_BUCKET,
  PHOTO_TYPES,
  REDS,
} from "./goodsReceiving.constants";
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
  formatDateTime,
  formatQty,
  getErrorMessage,
  statusClass,
  toNumber,
} from "./goodsReceiving.utils";

type Props = {
  deliveryId: string;
  onBack: () => void;
  onSaved: (deliveryId: string) => void;
  onResolve: (
    deliveryId: string,
    receiptItemId?: string,
    issueType?: ResolutionIssueType,
  ) => void;
};

type ResolutionIssueType =
  | "Damaged"
  | "Rejected / Return"
  | "Short / Missing";

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

type StockMovementLite = {
  stock_movement_id: string;
  movement_type: string;
  movement_date: string;
  quantity: number | string;
  base_uom_code: string;
  from_location_id: string | null;
  to_location_id: string | null;
  reference_no: string | null;
  reason: string | null;
  notes: string | null;
};

type IssueRow = {
  key: string;
  receiptItemId: string;
  productCode: string;
  productName: string;
  issueType: ResolutionIssueType;
  originalQty: number;
  originalUom: string;
  originalBaseQty: number;
  reason: string | null;
  summary: ResolutionSummaryRow | null;
};

const FIELD_CLASS =
  "min-h-10 rounded-lg border border-slate-200 bg-[#F7F9FB] px-3 py-2 text-sm font-medium text-slate-800";

const metricClass = (tone: "green" | "amber" | "red" | "blue") => {
  if (tone === "green") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (tone === "amber") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  if (tone === "red") {
    return "border-red-200 bg-red-50 text-red-800";
  }
  return "border-blue-200 bg-blue-50 text-blue-800";
};

const resolutionStatusClass = (status: string) => {
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

const issueBadgeClass = (issueType: ResolutionIssueType) => {
  if (issueType === "Damaged") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  if (issueType === "Rejected / Return") {
    return "border-red-200 bg-red-50 text-red-700";
  }
  return "border-blue-200 bg-blue-50 text-blue-700";
};

const safeFileName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-");

const displayProduct = (
  delivery: SupplierDelivery,
  supplierDeliveryItemId: string,
) => {
  const line = delivery.supplier_delivery_items.find(
    (item) => item.supplier_delivery_item_id === supplierDeliveryItemId,
  );

  return {
    code: line?.products?.product_code ?? "-",
    name: line?.products?.product_name ?? "Unknown product",
  };
};

const inputIssueValue = (
  item: ReceiptItem,
  issueType: ResolutionIssueType,
) => {
  if (issueType === "Damaged") {
    return {
      qty: toNumber(item.damaged_input_quantity ?? item.damaged_quantity),
      uom: item.damaged_input_uom_code ?? item.received_uom_code,
      baseQty: toNumber(item.damaged_base_quantity),
      reason: item.damage_description,
    };
  }

  if (issueType === "Rejected / Return") {
    return {
      qty: toNumber(item.rejected_input_quantity ?? item.rejected_quantity),
      uom: item.rejected_input_uom_code ?? item.received_uom_code,
      baseQty: toNumber(item.rejected_base_quantity),
      reason: item.rejection_reason,
    };
  }

  return {
    qty: toNumber(item.short_input_quantity ?? item.short_quantity),
    uom: item.short_input_uom_code ?? item.received_uom_code,
    baseQty: toNumber(item.short_base_quantity),
    reason: item.short_reason,
  };
};

const quantityWithUom = (
  quantity: number | string | null | undefined,
  uom: string | null | undefined,
) => `${formatQty(quantity)} ${uom ?? ""}`.trim();

export default function GoodsReceivingEdit({
  deliveryId,
  onBack,
  onSaved,
  onResolve,
}: Props) {
  const queryClient = useQueryClient();
  const supplierDocumentInputRef = useRef<HTMLInputElement | null>(null);
  const deliveredGoodsInputRef = useRef<HTMLInputElement | null>(null);
  const damageInputRef = useRef<HTMLInputElement | null>(null);
  const otherEvidenceInputRef = useRef<HTMLInputElement | null>(null);

  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [receiptNotes, setReceiptNotes] = useState("");
  const [uploadingPhotoType, setUploadingPhotoType] = useState<string | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  const { data: permissions } = useQuery({
    queryKey: ["goods-receiving-edit-permissions"],
    queryFn: async () => {
      const client = supabase as any;
      const check = async (code: string) => {
        const { data, error } = await client.rpc("has_permission", {
          p_permission_code: code,
        });
        return !error && data === true;
      };

      const [canUpdate, canUpdateNotes, canUploadPhotos] = await Promise.all([
        check("supplier_deliveries.update"),
        check("site_goods_receiving.update_notes"),
        check("supplier_deliveries.upload_photos"),
      ]);

      return {
        canUpdate: canUpdate || canUpdateNotes,
        canUploadPhotos,
      };
    },
    staleTime: 60_000,
  });

  const {
    data: delivery,
    isLoading: deliveryLoading,
    error: deliveryError,
  } = useQuery({
    queryKey: ["goods-receiving-edit-delivery", deliveryId],
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
          created_at,
          purchase_orders (
            purchase_order_no,
            order_status,
            expected_delivery_date
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
            accepted_quantity,
            damaged_quantity,
            rejected_quantity,
            short_quantity,
            short_base_quantity,
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
    queryKey: ["goods-receiving-edit-receipts", deliveryId],
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

  const receiptIds = useMemo(
    () => receipts.map((receipt) => receipt.supplier_delivery_receipt_id),
    [receipts],
  );

  const { data: receiptItems = [], isLoading: receiptItemsLoading } = useQuery({
    queryKey: ["goods-receiving-edit-items", receiptIds],
    enabled: receiptIds.length > 0,
    queryFn: async (): Promise<ReceiptItem[]> => {
      const { data, error } = await (supabase as any)
        .from("supplier_delivery_receipt_items")
        .select(`
          supplier_delivery_receipt_item_id,
          supplier_delivery_receipt_id,
          supplier_delivery_item_id,
          stock_location_id,
          stock_lot_id,
          stock_movement_id,
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
          notes
        `)
        .in("supplier_delivery_receipt_id", receiptIds)
        .eq("is_deleted", false);

      if (error) throw error;
      return (data ?? []) as ReceiptItem[];
    },
  });

  const latestReceipt = receipts[0] ?? null;

  const latestItems = useMemo(
    () =>
      latestReceipt
        ? receiptItems.filter(
            (item) =>
              item.supplier_delivery_receipt_id ===
              latestReceipt.supplier_delivery_receipt_id,
          )
        : [],
    [latestReceipt, receiptItems],
  );

  const employeeIds = useMemo(
    () =>
      Array.from(
        new Set(
          receipts
            .map((receipt) => receipt.received_by_employee_id)
            .filter(Boolean),
        ),
      ),
    [receipts],
  );

  const { data: employees = [] } = useQuery({
    queryKey: ["goods-receiving-edit-employees", employeeIds],
    enabled: employeeIds.length > 0,
    queryFn: async (): Promise<EmployeeLite[]> => {
      const { data, error } = await (supabase as any)
        .from("employees")
        .select(
          "employee_id, employee_code, display_name, first_name, last_name, auth_user_id",
        )
        .in("employee_id", employeeIds);

      if (error) throw error;
      return (data ?? []) as EmployeeLite[];
    },
  });

  const stockLocationIds = useMemo(
    () =>
      Array.from(
        new Set(
          receiptItems
            .map((item) => item.stock_location_id)
            .filter((value): value is string => Boolean(value)),
        ),
      ),
    [receiptItems],
  );

  const { data: stockLocations = [] } = useQuery({
    queryKey: ["goods-receiving-edit-stock-locations", stockLocationIds],
    enabled: stockLocationIds.length > 0,
    queryFn: async (): Promise<StockLocation[]> => {
      const { data, error } = await (supabase as any)
        .from("stock_locations")
        .select(
          "stock_location_id, location_code, location_name, site_id",
        )
        .in("stock_location_id", stockLocationIds);

      if (error) throw error;
      return (data ?? []) as StockLocation[];
    },
  });

  const stockMovementIds = useMemo(
    () =>
      Array.from(
        new Set(
          (receiptItems as Array<
            ReceiptItem & { stock_movement_id?: string | null }
          >)
            .map((item) => item.stock_movement_id)
            .filter((value): value is string => Boolean(value)),
        ),
      ),
    [receiptItems],
  );

  const { data: stockMovements = [] } = useQuery({
    queryKey: ["goods-receiving-edit-stock-movements", stockMovementIds],
    enabled: stockMovementIds.length > 0,
    queryFn: async (): Promise<StockMovementLite[]> => {
      const { data, error } = await (supabase as any)
        .from("stock_movements")
        .select(`
          stock_movement_id,
          movement_type,
          movement_date,
          quantity,
          base_uom_code,
          from_location_id,
          to_location_id,
          reference_no,
          reason,
          notes
        `)
        .in("stock_movement_id", stockMovementIds)
        .eq("is_deleted", false);

      if (error) throw error;
      return (data ?? []) as StockMovementLite[];
    },
  });

  const { data: photos = [] } = useQuery({
    queryKey: ["goods-receiving-edit-photos", deliveryId],
    enabled: Boolean(deliveryId),
    queryFn: async (): Promise<DeliveryPhoto[]> => {
      const { data, error } = await (supabase as any)
        .from("supplier_delivery_photos")
        .select(`
          supplier_delivery_photo_id,
          supplier_delivery_id,
          supplier_delivery_receipt_id,
          photo_url,
          photo_type,
          caption,
          sort_order,
          created_at
        `)
        .eq("supplier_delivery_id", deliveryId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const rows = (data ?? []) as DeliveryPhoto[];

      return Promise.all(
        rows.map(async (photo) => {
          const { data: signed } = await supabase.storage
            .from(PHOTO_BUCKET)
            .createSignedUrl(photo.photo_url, 3600);

          return {
            ...photo,
            signedUrl: signed?.signedUrl ?? null,
          };
        }),
      );
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
    queryKey: ["goods-receiving-resolution-events", resolutionCaseIds],
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

  useEffect(() => {
    if (!delivery) return;
    setDeliveryNotes(delivery.notes ?? "");
  }, [delivery]);

  useEffect(() => {
    if (!latestReceipt) {
      setReceiptNotes("");
      return;
    }
    setReceiptNotes(latestReceipt.notes ?? "");
  }, [latestReceipt]);

  const totals = useMemo(
    () =>
      latestItems.reduce(
        (acc, item) => ({
          accepted:
            acc.accepted + toNumber(item.accepted_base_quantity),
          damaged:
            acc.damaged + toNumber(item.damaged_base_quantity),
          rejected:
            acc.rejected + toNumber(item.rejected_base_quantity),
          short: acc.short + toNumber(item.short_base_quantity),
        }),
        { accepted: 0, damaged: 0, rejected: 0, short: 0 },
      ),
    [latestItems],
  );

  const issueRows = useMemo<IssueRow[]>(() => {
    if (!delivery) return [];

    const rows: IssueRow[] = [];

    latestItems.forEach((item) => {
      (
        [
          "Damaged",
          "Rejected / Return",
          "Short / Missing",
        ] as ResolutionIssueType[]
      ).forEach((issueType) => {
        const source = inputIssueValue(item, issueType);

        if (source.baseQty <= 0) return;

        const summary =
          resolutionSummary.find(
            (row) =>
              row.supplier_delivery_receipt_item_id ===
                item.supplier_delivery_receipt_item_id &&
              row.issue_type === issueType,
          ) ?? null;

        const product = displayProduct(
          delivery,
          item.supplier_delivery_item_id,
        );

        rows.push({
          key: `${item.supplier_delivery_receipt_item_id}-${issueType}`,
          receiptItemId: item.supplier_delivery_receipt_item_id,
          productCode: product.code,
          productName: product.name,
          issueType,
          originalQty: source.qty,
          originalUom: source.uom,
          originalBaseQty: source.baseQty,
          reason: source.reason,
          summary,
        });
      });
    });

    return rows;
  }, [delivery, latestItems, resolutionSummary]);

  const latestStockLocationText = useMemo(() => {
    const ids = Array.from(
      new Set(
        latestItems
          .map((item) => item.stock_location_id)
          .filter((value): value is string => Boolean(value)),
      ),
    );

    if (ids.length === 0) return "-";

    return ids
      .map((id) => {
        const location = stockLocations.find(
          (candidate) => candidate.stock_location_id === id,
        );
        return location
          ? `${location.location_code} — ${location.location_name}`
          : id.slice(0, 8);
      })
      .join(", ");
  }, [latestItems, stockLocations]);

  const saveNotes = useMutation({
    mutationFn: async () => {
      if (!delivery) throw new Error("Supplier Delivery not found.");
      if (!latestReceipt) {
        throw new Error("Posted Goods Receiving receipt not found.");
      }

      if (!permissions?.canUpdate) {
        throw new Error(
          "You do not have permission to update Goods Receiving notes.",
        );
      }

      const { error } = await (supabase as any).rpc(
        "update_goods_receiving_editable_notes",
        {
          p_supplier_delivery_id: delivery.supplier_delivery_id,
          p_supplier_delivery_receipt_id:
            latestReceipt.supplier_delivery_receipt_id,
          p_delivery_notes: deliveryNotes.trim() || null,
          p_receipt_notes: receiptNotes.trim() || null,
        },
      );

      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["goods-receiving-dashboard-deliveries"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["goods-receiving-edit-delivery", deliveryId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["goods-receiving-edit-receipts", deliveryId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["goods-receiving-view-delivery", deliveryId],
        }),
      ]);

      toast.success("Goods Receiving notes updated.");
      onSaved(deliveryId);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const uploadPhoto = async (
    event: ChangeEvent<HTMLInputElement>,
    photoType: "SupplierDocument" | "ReceiptEvidence" | "DamagedOnDelivery" | "Other",
    caption: string,
  ) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!file || !delivery || !latestReceipt) return;

    if (!permissions?.canUploadPhotos) {
      toast.error(
        "You do not have permission to upload Goods Receiving photos.",
      );
      return;
    }

    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      toast.error("Use JPEG, PNG or WebP images only.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must not exceed 10 MB.");
      return;
    }

    setUploadingPhotoType(photoType);

    try {
      const { data: authData } = await supabase.auth.getUser();

      const path = `${delivery.supplier_delivery_id}/${latestReceipt.supplier_delivery_receipt_id}/${Date.now()}-${safeFileName(file.name)}`;

      const { error: uploadError } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(path, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { error: insertError } = await (supabase as any)
        .from("supplier_delivery_photos")
        .insert({
          supplier_delivery_id: delivery.supplier_delivery_id,
          supplier_delivery_receipt_id:
            latestReceipt.supplier_delivery_receipt_id,
          photo_url: path,
          photo_type: photoType,
          caption,
          sort_order: photos.length,
          is_deleted: false,
          uploaded_by: authData.user?.id ?? null,
        });

      if (insertError) throw insertError;

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["goods-receiving-edit-photos", deliveryId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["goods-receiving-view-photos", deliveryId],
        }),
      ]);

      toast.success(`${caption} added.`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUploadingPhotoType(null);
    }
  };

  const photoGroups = [
    {
      key: "supplier",
      title: "Supplier Documents",
      description: "Delivery docket, supplier invoice or related supplier document.",
      types: ["SupplierDocument", "DeliveryDocket", "Delivery Docket", "Invoice"],
      uploadType: "SupplierDocument" as const,
      caption: "Supplier Document",
      inputRef: supplierDocumentInputRef,
    },
    {
      key: "goods",
      title: "Delivered Goods Photos",
      description: "Photos showing the goods as delivered or received.",
      types: ["ReceiptEvidence", "Material", "Receipt"],
      uploadType: "ReceiptEvidence" as const,
      caption: "Delivered Goods Photo",
      inputRef: deliveredGoodsInputRef,
    },
    {
      key: "damage",
      title: "Damage / Issue Photos",
      description: "Damage, rejected goods or short/missing receiving evidence.",
      types: [
        "DamagedOnDelivery",
        "RejectedOnDelivery",
        "ShortMissingOnDelivery",
        "Damage",
      ],
      uploadType: "DamagedOnDelivery" as const,
      caption: "Damage / Issue Photo",
      inputRef: damageInputRef,
    },
    {
      key: "other",
      title: "Other Evidence",
      description: "Additional evidence that does not belong to another category.",
      types: ["Other"],
      uploadType: "Other" as const,
      caption: "Additional Goods Receiving evidence",
      inputRef: otherEvidenceInputRef,
    },
  ];

  const renderPhotoGroup = (
    group: (typeof photoGroups)[number],
  ) => {
    const groupPhotos = photos.filter((photo) =>
      group.types.includes(photo.photo_type),
    );

    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900">
                {group.title}
              </h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {groupPhotos.length}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {group.description}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={
              !permissions?.canUploadPhotos ||
              !latestReceipt ||
              uploadingPhotoType !== null
            }
            onClick={() => group.inputRef.current?.click()}
          >
            {uploadingPhotoType === group.uploadType ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="mr-2 h-4 w-4" />
            )}
            Add Photo
          </Button>

          <input
            ref={group.inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="hidden"
            onChange={(event) =>
              uploadPhoto(
                event,
                group.uploadType,
                group.caption,
              )
            }
          />
        </div>

        {groupPhotos.length === 0 ? (
          <div className="mt-3 flex min-h-24 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-sm text-slate-400">
            No photos in this category.
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {groupPhotos.map((photo) => (
              <button
                key={photo.supplier_delivery_photo_id}
                type="button"
                disabled={!photo.signedUrl}
                onClick={() =>
                  photo.signedUrl &&
                  setPhotoPreviewUrl(photo.signedUrl)
                }
                className="group overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition hover:border-[#9E4B4B] hover:shadow-sm disabled:cursor-default"
              >
                {photo.signedUrl ? (
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    <img
                      src={photo.signedUrl}
                      alt={photo.caption ?? group.title}
                      className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]"
                    />
                    <span className="absolute bottom-2 right-2 rounded-md bg-black/60 p-1.5 text-white opacity-0 transition group-hover:opacity-100">
                      <Maximize2 className="h-4 w-4" />
                    </span>
                  </div>
                ) : (
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

  const isLoading =
    deliveryLoading || receiptsLoading || receiptItemsLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Loader2
          className="h-7 w-7 animate-spin"
          style={{ color: REDS }}
        />
      </div>
    );
  }

  if (deliveryError || !delivery) {
    return (
      <div className="p-4 sm:p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          {deliveryError
            ? getErrorMessage(deliveryError)
            : "Goods Receiving delivery was not found."}
        </div>
        <Button variant="outline" className="mt-4" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to List
        </Button>
      </div>
    );
  }

  const receivedBy = latestReceipt
    ? employeeName(
        employees.find(
          (employee) =>
            employee.employee_id ===
            latestReceipt.received_by_employee_id,
        ),
      )
    : "-";

  return (
    <div className="space-y-5 bg-slate-50/40 p-4 sm:p-6">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to List
      </Button>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div
          className="h-1.5"
          style={{ backgroundColor: REDS }}
        />

        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900">
                Edit Goods Receiving —{" "}
                {delivery.supplier_delivery_note_no ??
                  delivery.delivery_no}
              </h1>

              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(
                  delivery.delivery_status,
                )}`}
              >
                {delivery.delivery_status}
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Posted quantities and stock transactions are locked.
              Only notes and additional evidence can be edited.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onBack}>
              Cancel
            </Button>

            <Button
              className="text-white"
              style={{ backgroundColor: REDS }}
              disabled={
                saveNotes.isPending ||
                !permissions?.canUpdate ||
                !latestReceipt
              }
              onClick={() => saveNotes.mutate()}
            >
              {saveNotes.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </section>

      {/* 1. Delivery & Receiving Details */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: REDS }}
          >
            1
          </div>
          <div>
            <h2 className="font-bold text-slate-900">
              Delivery & Receiving Details
            </h2>
            <p className="text-xs text-slate-500">
              Posted reference information — read only
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Delivery Bill</Label>
            <div className={FIELD_CLASS}>
              {delivery.supplier_delivery_note_no ?? "-"}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Delivery Date</Label>
            <div className={FIELD_CLASS}>
              {delivery.delivery_date ?? "-"}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Purchase Order</Label>
            <div className={FIELD_CLASS}>
              {delivery.purchase_orders?.purchase_order_no ?? "-"}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Supplier</Label>
            <div className={FIELD_CLASS}>
              {delivery.suppliers?.supplier_name ?? "-"}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Project</Label>
            <div className={FIELD_CLASS}>
              {delivery.projects
                ? `${delivery.projects.project_no ?? ""}${
                    delivery.projects.project_no &&
                    delivery.projects.project_name
                      ? " — "
                      : ""
                  }${delivery.projects.project_name ?? ""}` || "-"
                : "-"}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Receiving Site</Label>
            <div className={FIELD_CLASS}>
              {delivery.project_sites
                ? `${delivery.project_sites.site_code ?? ""}${
                    delivery.project_sites.site_code &&
                    delivery.project_sites.site_name
                      ? " — "
                      : ""
                  }${delivery.project_sites.site_name ?? ""}` || "-"
                : "-"}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Stock Location</Label>
            <div className={FIELD_CLASS}>
              {latestStockLocationText}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Received By</Label>
            <div className={FIELD_CLASS}>{receivedBy}</div>
          </div>
        </div>
      </section>

      {/* 2. Posted Inspection */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-2">
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: REDS }}
            >
              2
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900">
                  Posted Item Inspection
                </h2>
                <Lock className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500">
                Original posted inspection cannot be changed.
              </p>
            </div>
          </div>

          {latestReceipt && (
            <div className="text-xs text-slate-500">
              Posted {formatDateTime(latestReceipt.received_at)}
            </div>
          )}
        </div>

        <div className="mt-4 space-y-3 md:hidden">
          {latestItems.length === 0 ? (
            <div className="rounded-xl border p-5 text-center text-sm text-slate-500">
              No posted receipt items found.
            </div>
          ) : (
            latestItems.map((item) => {
              const product = displayProduct(
                delivery,
                item.supplier_delivery_item_id,
              );

              const goodQty = toNumber(
                item.accepted_input_quantity ?? item.accepted_quantity,
              );
              const damagedQty = toNumber(
                item.damaged_input_quantity ?? item.damaged_quantity,
              );
              const rejectedQty = toNumber(
                item.rejected_input_quantity ?? item.rejected_quantity,
              );
              const shortQty = toNumber(
                item.short_input_quantity ?? item.short_quantity,
              );
              const hasIssue =
                damagedQty > 0 || rejectedQty > 0 || shortQty > 0;

              return (
                <article
                  key={item.supplier_delivery_receipt_item_id}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3 border-b bg-[#F7F9FB] p-3">
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-slate-900">
                        {product.code}
                      </p>
                      <p className="break-words text-xs text-slate-500">
                        {product.name}
                      </p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 rounded-full border px-2 py-1 text-xs font-semibold ${
                        hasIssue
                          ? "border-amber-200 bg-amber-50 text-amber-800"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {hasIssue ? "Issue Recorded" : "Accepted"}
                    </span>
                  </div>

                  <dl className="grid grid-cols-2 gap-px bg-slate-200">
                    <div className="bg-white p-3">
                      <dt className="text-xs text-slate-500">UOM</dt>
                      <dd className="mt-1 font-medium">{item.received_uom_code}</dd>
                    </div>
                    <div className="bg-white p-3">
                      <dt className="text-xs text-slate-500">Delivery Bill Qty</dt>
                      <dd className="mt-1 font-semibold">
                        {formatQty(item.expected_quantity)}
                      </dd>
                    </div>
                    <div className="bg-emerald-50 p-3 text-emerald-700">
                      <dt className="text-xs">Received / Good</dt>
                      <dd className="mt-1 font-semibold">{formatQty(goodQty)}</dd>
                    </div>
                    <div className="bg-amber-50 p-3 text-amber-700">
                      <dt className="text-xs">Damaged</dt>
                      <dd className="mt-1 font-semibold">{formatQty(damagedQty)}</dd>
                    </div>
                    <div className="bg-red-50 p-3 text-red-700">
                      <dt className="text-xs">Rejected / Return</dt>
                      <dd className="mt-1 font-semibold">{formatQty(rejectedQty)}</dd>
                    </div>
                    <div className="bg-blue-50 p-3 text-blue-700">
                      <dt className="text-xs">Short / Missing</dt>
                      <dd className="mt-1 font-semibold">{formatQty(shortQty)}</dd>
                    </div>
                  </dl>
                </article>
              );
            })
          )}
        </div>

        <div className="mt-4 hidden overflow-x-auto md:block">
          <table className="min-w-[1040px] w-full text-left text-sm">
            <thead className="bg-[#F7F9FB] text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="border p-2.5">Product</th>
                <th className="border p-2.5 text-center">UOM</th>
                <th className="border p-2.5 text-right">
                  Delivery Bill Qty
                </th>
                <th className="border p-2.5 text-right text-emerald-700">
                  Received / Good
                </th>
                <th className="border p-2.5 text-right text-amber-700">
                  Damaged
                </th>
                <th className="border p-2.5 text-right text-red-700">
                  Rejected / Return
                </th>
                <th className="border p-2.5 text-right text-blue-700">
                  Short / Missing
                </th>
                <th className="border p-2.5">Status</th>
              </tr>
            </thead>

            <tbody>
              {latestItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="border p-6 text-center text-slate-500"
                  >
                    No posted receipt items found.
                  </td>
                </tr>
              ) : (
                latestItems.map((item) => {
                  const product = displayProduct(
                    delivery,
                    item.supplier_delivery_item_id,
                  );

                  const goodQty = toNumber(
                    item.accepted_input_quantity ??
                      item.accepted_quantity,
                  );
                  const damagedQty = toNumber(
                    item.damaged_input_quantity ??
                      item.damaged_quantity,
                  );
                  const rejectedQty = toNumber(
                    item.rejected_input_quantity ??
                      item.rejected_quantity,
                  );
                  const shortQty = toNumber(
                    item.short_input_quantity ??
                      item.short_quantity,
                  );

                  const hasIssue =
                    damagedQty > 0 ||
                    rejectedQty > 0 ||
                    shortQty > 0;

                  return (
                    <tr
                      key={item.supplier_delivery_receipt_item_id}
                      className="border-t"
                    >
                      <td className="border p-2.5">
                        <div className="font-semibold text-slate-900">
                          {product.code}
                        </div>
                        <div className="text-xs text-slate-500">
                          {product.name}
                        </div>
                      </td>

                      <td className="border p-2.5 text-center">
                        {item.received_uom_code}
                      </td>

                      <td className="border p-2.5 text-right font-medium">
                        {formatQty(item.expected_quantity)}
                      </td>

                      <td className="border bg-emerald-50/50 p-2.5 text-right font-semibold text-emerald-700">
                        {formatQty(goodQty)}
                      </td>

                      <td className="border bg-amber-50/50 p-2.5 text-right font-semibold text-amber-700">
                        {formatQty(damagedQty)}
                      </td>

                      <td className="border bg-red-50/40 p-2.5 text-right font-semibold text-red-700">
                        {formatQty(rejectedQty)}
                      </td>

                      <td className="border bg-blue-50/40 p-2.5 text-right font-semibold text-blue-700">
                        {formatQty(shortQty)}
                      </td>

                      <td className="border p-2.5">
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${
                            hasIssue
                              ? "border-amber-200 bg-amber-50 text-amber-800"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {hasIssue ? "Issue Recorded" : "Accepted"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div
            className={`rounded-xl border p-3 ${metricClass("green")}`}
          >
            <p className="text-xs font-medium">Received / Good (Base)</p>
            <strong className="mt-1 block text-xl">
              {formatQty(totals.accepted)}
            </strong>
          </div>

          <div
            className={`rounded-xl border p-3 ${metricClass("amber")}`}
          >
            <p className="text-xs font-medium">Damaged (Base)</p>
            <strong className="mt-1 block text-xl">
              {formatQty(totals.damaged)}
            </strong>
          </div>

          <div
            className={`rounded-xl border p-3 ${metricClass("red")}`}
          >
            <p className="text-xs font-medium">
              Rejected / Return (Base)
            </p>
            <strong className="mt-1 block text-xl">
              {formatQty(totals.rejected)}
            </strong>
          </div>

          <div
            className={`rounded-xl border p-3 ${metricClass("blue")}`}
          >
            <p className="text-xs font-medium">
              Short / Missing (Base)
            </p>
            <strong className="mt-1 block text-xl">
              {formatQty(totals.short)}
            </strong>
          </div>
        </div>
      </section>

      {/* 3. Editable Notes / Evidence */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: REDS }}
          >
            3
          </div>
          <div>
            <h2 className="font-bold text-slate-900">
              Delivery Notes & Evidence
            </h2>
            <p className="text-xs text-slate-500">
              Notes are editable. Existing photos remain part of the audit trail and new evidence may be added.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label>Delivery Notes</Label>
            <Textarea
              value={deliveryNotes}
              onChange={(event) =>
                setDeliveryNotes(event.target.value)
              }
              disabled={!permissions?.canUpdate}
              className={`${INPUT_CLASS} min-h-28`}
              placeholder="Delivery-level notes"
            />
          </div>

          <div className="space-y-2">
            <Label>Receipt Notes</Label>
            <Textarea
              value={receiptNotes}
              onChange={(event) =>
                setReceiptNotes(event.target.value)
              }
              disabled={!permissions?.canUpdate || !latestReceipt}
              className={`${INPUT_CLASS} min-h-28`}
              placeholder="Receipt notes"
            />
          </div>
        </div>

        <div className="mt-6 border-t border-slate-200 pt-5">
          <div className="mb-4">
            <h3 className="font-semibold text-slate-900">
              Documents & Photos
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              All photos linked to this Supplier Delivery are shown here, including evidence captured during the original Goods Receiving workflow.
            </p>
          </div>

          <div className="space-y-4">
            {photoGroups.map((group) => (
              <div key={group.key}>
                {renderPhotoGroup(group)}
              </div>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 767px) {
          .gr-mobile-table,
          .gr-mobile-table tbody,
          .gr-mobile-table tr,
          .gr-mobile-table td {
            display: block;
            width: 100%;
          }

          .gr-mobile-table {
            min-width: 0 !important;
          }

          .gr-mobile-table thead {
            display: none;
          }

          .gr-mobile-table tbody {
            padding: 0;
          }

          .gr-mobile-table tr {
            margin-bottom: 12px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            background: white;
          }

          .gr-mobile-table td {
            display: grid;
            grid-template-columns: 118px minmax(0, 1fr);
            gap: 12px;
            border-width: 0 0 1px 0 !important;
            padding: 10px 12px !important;
            text-align: left !important;
            overflow-wrap: anywhere;
          }

          .gr-mobile-table td:last-child {
            border-bottom-width: 0 !important;
          }

          .gr-mobile-table td::before {
            color: #64748b;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
          }

          .gr-issues-table td:nth-child(1)::before { content: "Issue"; }
          .gr-issues-table td:nth-child(2)::before { content: "Product"; }
          .gr-issues-table td:nth-child(3)::before { content: "Resolution"; }
          .gr-issues-table td:nth-child(4)::before { content: "Original Issue"; }
          .gr-issues-table td:nth-child(5)::before { content: "Resolved"; }
          .gr-issues-table td:nth-child(6)::before { content: "Outstanding"; }
          .gr-issues-table td:nth-child(7)::before { content: "Returned"; }
          .gr-issues-table td:nth-child(8)::before { content: "Outstanding Return"; }
          .gr-issues-table td:nth-child(9)::before { content: "Replacement Required"; }
          .gr-issues-table td:nth-child(10)::before { content: "Replacement Received"; }
          .gr-issues-table td:nth-child(11)::before { content: "Outstanding Replacement"; }
          .gr-issues-table td:nth-child(12)::before { content: "Status"; }
          .gr-issues-table td:nth-child(13)::before { content: "Action"; }

          .gr-history-table td:nth-child(1)::before { content: "Receipt"; }
          .gr-history-table td:nth-child(2)::before { content: "Received At"; }
          .gr-history-table td:nth-child(3)::before { content: "Received By"; }
          .gr-history-table td:nth-child(4)::before { content: "Good"; }
          .gr-history-table td:nth-child(5)::before { content: "Damaged"; }
          .gr-history-table td:nth-child(6)::before { content: "Rejected"; }
          .gr-history-table td:nth-child(7)::before { content: "Short"; }
          .gr-history-table td:nth-child(8)::before { content: "Stock Movement"; }
          .gr-history-table td:nth-child(9)::before { content: "Status"; }
        }
      `}</style>

      {/* 4. Issue / Resolution Summary */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-2">
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: REDS }}
            >
              4
            </div>
            <div>
              <h2 className="font-bold text-slate-900">
                Goods Receiving Issues & Resolution
              </h2>
              <p className="text-xs text-slate-500">
                Original issues remain immutable. Corrective actions are
                append-only Resolution events.
              </p>
            </div>
          </div>

          {issueRows.length > 0 && (
            <Button
              variant="outline"
              className="border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
              onClick={() => onResolve(deliveryId)}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Open Resolution
            </Button>
          )}
        </div>

        <div className="overflow-visible md:overflow-x-auto">
          <table className="gr-mobile-table gr-issues-table w-full text-left text-xs md:min-w-[1500px]">
            <thead className="bg-[#F7F9FB] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="border p-2.5">Issue</th>
                <th className="border p-2.5">Product</th>
                <th className="border p-2.5">Resolution</th>
                <th className="border p-2.5 text-right">Original Issue</th>
                <th className="border p-2.5 text-right">Resolved</th>
                <th className="border p-2.5 text-right">Outstanding</th>
                <th className="border p-2.5 text-right">Returned</th>
                <th className="border p-2.5 text-right">
                  Outstanding Return
                </th>
                <th className="border p-2.5 text-center">
                  Replacement Required
                </th>
                <th className="border p-2.5 text-right">
                  Replacement Received
                </th>
                <th className="border p-2.5 text-right">
                  Outstanding Replacement
                </th>
                <th className="border p-2.5">Status</th>
                <th className="border p-2.5">Action</th>
              </tr>
            </thead>

            <tbody>
              {issueRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={13}
                    className="border p-6 text-center text-slate-500"
                  >
                    No Damaged, Rejected / Return, or Short / Missing
                    issue exists on the latest posted receipt.
                  </td>
                </tr>
              ) : (
                issueRows.map((row) => {
                  const summary = row.summary;

                  const returnedBase = summary
                    ? toNumber(summary.returned_base_quantity)
                    : 0;

                  const outstandingReturnBase =
                    summary?.return_required
                      ? toNumber(
                          summary.outstanding_return_base_quantity,
                        )
                      : 0;

                  const replacementReceivedBase = summary
                    ? toNumber(
                        summary.replacement_received_base_quantity,
                      )
                    : 0;

                  const outstandingReplacementBase =
                    summary?.replacement_required
                      ? toNumber(
                          summary.outstanding_replacement_base_quantity,
                        )
                      : 0;

                  const outstandingBase = summary
                    ? Math.max(
                        outstandingReturnBase,
                        outstandingReplacementBase,
                      )
                    : row.originalBaseQty;

                  const resolvedBase = Math.max(
                    0,
                    row.originalBaseQty - outstandingBase,
                  );

                  return (
                    <tr key={row.key} className="border-t align-top">
                      <td className="border p-2.5">
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 font-semibold ${issueBadgeClass(
                            row.issueType,
                          )}`}
                        >
                          {row.issueType}
                        </span>
                        {row.reason && (
                          <p className="mt-2 max-w-[240px] text-slate-500">
                            {row.reason}
                          </p>
                        )}
                      </td>

                      <td className="border p-2.5">
                        <div className="font-semibold text-slate-900">
                          {row.productCode}
                        </div>
                        <div className="mt-0.5 text-slate-500">
                          {row.productName}
                        </div>
                      </td>

                      <td className="border p-2.5 font-semibold">
                        {summary?.resolution_no ?? "Not started"}
                      </td>

                      <td className="border p-2.5 text-right">
                        <div className="font-semibold">
                          {quantityWithUom(
                            row.originalQty,
                            row.originalUom,
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {formatQty(row.originalBaseQty)} base
                        </div>
                      </td>

                      <td className="border p-2.5 text-right font-semibold text-emerald-700">
                        {formatQty(resolvedBase)}
                      </td>

                      <td className="border p-2.5 text-right font-semibold text-amber-700">
                        {formatQty(outstandingBase)}
                      </td>

                      <td className="border p-2.5 text-right">
                        {formatQty(returnedBase)}
                      </td>

                      <td className="border p-2.5 text-right">
                        {summary?.return_required
                          ? formatQty(outstandingReturnBase)
                          : "-"}
                      </td>

                      <td className="border p-2.5 text-center">
                        {summary?.replacement_required ? "Yes" : "No"}
                      </td>

                      <td className="border p-2.5 text-right">
                        {formatQty(replacementReceivedBase)}
                      </td>

                      <td className="border p-2.5 text-right">
                        {summary?.replacement_required
                          ? formatQty(outstandingReplacementBase)
                          : "-"}
                      </td>

                      <td className="border p-2.5">
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 font-semibold ${resolutionStatusClass(
                            summary?.resolution_status ?? "Open",
                          )}`}
                        >
                          {summary?.resolution_status ?? "Open"}
                        </span>
                      </td>

                      <td className="border p-2.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            onResolve(
                              deliveryId,
                              row.receiptItemId,
                              row.issueType,
                            )
                          }
                        >
                          {summary?.resolution_status === "Resolved"
                            ? "View Resolution"
                            : summary
                              ? "View / Resolve"
                              : "Resolve"}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {resolutionEvents.length > 0 && (
          <div className="mt-5">
            <div className="mb-3 flex items-center gap-2">
              <History className="h-4 w-4 text-slate-500" />
              <h3 className="font-semibold text-slate-900">
                Resolution Events / History
              </h3>
            </div>

            <div className="space-y-2">
              {resolutionEvents.map((event) => {
                const relatedCase = resolutionSummary.find(
                  (row) =>
                    row.resolution_case_id === event.resolution_case_id,
                );

                return (
                  <div
                    key={event.resolution_event_id}
                    className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-sm md:grid-cols-[170px_190px_1fr_auto]"
                  >
                    <div>
                      <p className="text-xs text-slate-500">
                        Event
                      </p>
                      <p className="font-semibold text-slate-900">
                        {event.event_no}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {relatedCase?.resolution_no}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Action
                      </p>
                      <p className="font-semibold">
                        {event.event_type}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Detail
                      </p>
                      <p>
                        {event.event_quantity !== null
                          ? quantityWithUom(
                              event.event_quantity,
                              event.event_uom_code,
                            )
                          : event.reason ?? event.notes ?? "-"}
                      </p>
                      {(event.reason || event.notes) && (
                        <p className="mt-1 text-xs text-slate-500">
                          {[event.reason, event.notes]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                    </div>

                    <div className="text-right text-xs text-slate-500">
                      {formatDateTime(event.event_at)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* 5. Receipt / Stock History */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: REDS }}
          >
            5
          </div>
          <div>
            <h2 className="font-bold text-slate-900">
              Receiving & Stock History
            </h2>
            <p className="text-xs text-slate-500">
              Posted audit trail — read only
            </p>
          </div>
        </div>

        <div className="overflow-visible md:overflow-x-auto">
          <table className="gr-mobile-table gr-history-table w-full text-left text-xs md:min-w-[1120px]">
            <thead className="bg-[#F7F9FB] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="border p-2.5">Receipt</th>
                <th className="border p-2.5">Received At</th>
                <th className="border p-2.5">Received By</th>
                <th className="border p-2.5 text-right">Good</th>
                <th className="border p-2.5 text-right">Damaged</th>
                <th className="border p-2.5 text-right">Rejected</th>
                <th className="border p-2.5 text-right">Short</th>
                <th className="border p-2.5">Stock Movement</th>
                <th className="border p-2.5">Status</th>
              </tr>
            </thead>

            <tbody>
              {receipts.map((receipt) => {
                const items = receiptItems.filter(
                  (item) =>
                    item.supplier_delivery_receipt_id ===
                    receipt.supplier_delivery_receipt_id,
                );

                const receiptTotals = items.reduce(
                  (acc, item) => ({
                    accepted:
                      acc.accepted +
                      toNumber(item.accepted_base_quantity),
                    damaged:
                      acc.damaged +
                      toNumber(item.damaged_base_quantity),
                    rejected:
                      acc.rejected +
                      toNumber(item.rejected_base_quantity),
                    short:
                      acc.short + toNumber(item.short_base_quantity),
                  }),
                  {
                    accepted: 0,
                    damaged: 0,
                    rejected: 0,
                    short: 0,
                  },
                );

                const movementList = items
                  .map((item) => {
                    const movementId = (
                      item as ReceiptItem & {
                        stock_movement_id?: string | null;
                      }
                    ).stock_movement_id;

                    return stockMovements.find(
                      (movement) =>
                        movement.stock_movement_id === movementId,
                    );
                  })
                  .filter(
                    (
                      movement,
                    ): movement is StockMovementLite =>
                      Boolean(movement),
                  );

                const receiver = employees.find(
                  (employee) =>
                    employee.employee_id ===
                    receipt.received_by_employee_id,
                );

                return (
                  <tr
                    key={receipt.supplier_delivery_receipt_id}
                    className="border-t align-top"
                  >
                    <td className="border p-2.5 font-mono font-semibold">
                      {receipt.supplier_delivery_receipt_id.slice(
                        0,
                        12,
                      )}
                    </td>

                    <td className="border p-2.5">
                      {formatDateTime(receipt.received_at)}
                    </td>

                    <td className="border p-2.5">
                      {employeeName(receiver)}
                    </td>

                    <td className="border p-2.5 text-right text-emerald-700">
                      {formatQty(receiptTotals.accepted)}
                    </td>

                    <td className="border p-2.5 text-right text-amber-700">
                      {formatQty(receiptTotals.damaged)}
                    </td>

                    <td className="border p-2.5 text-right text-red-700">
                      {formatQty(receiptTotals.rejected)}
                    </td>

                    <td className="border p-2.5 text-right text-blue-700">
                      {formatQty(receiptTotals.short)}
                    </td>

                    <td className="border p-2.5">
                      {movementList.length === 0 ? (
                        <span className="text-slate-400">
                          No stock movement
                        </span>
                      ) : (
                        <div className="space-y-1">
                          {movementList.map((movement) => (
                            <div
                              key={movement.stock_movement_id}
                              className="flex items-center gap-2"
                            >
                              <PackageCheck className="h-3.5 w-3.5 text-emerald-600" />
                              <span className="font-medium">
                                {movement.movement_type}
                              </span>
                              <span className="text-slate-500">
                                {formatQty(movement.quantity)}{" "}
                                {movement.base_uom_code}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="border p-2.5">
                      <span
                        className={`rounded-full border px-2 py-1 font-semibold ${
                          receipt.receipt_status === "Confirmed"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-100 text-slate-600"
                        }`}
                      >
                        {receipt.receipt_status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-300 bg-slate-100/70 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-slate-600" />
          <div>
            <p className="font-semibold text-slate-800">
              Posted Goods Receiving is protected.
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Item quantities, inspection results, receipt history and
              stock movements cannot be rewritten from this screen.
              Corrections must be recorded through Goods Receiving
              Resolution so the original transaction and full audit
              history remain intact.
            </p>
          </div>
        </div>
      </section>
      {photoPreviewUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPhotoPreviewUrl(null)}
        >
          <button
            type="button"
            aria-label="Close photo preview"
            className="absolute right-5 top-5 rounded-full bg-white/90 p-2 text-slate-900 shadow"
            onClick={() => setPhotoPreviewUrl(null)}
          >
            <X className="h-5 w-5" />
          </button>

          <img
            src={photoPreviewUrl}
            alt="Goods Receiving evidence preview"
            className="max-h-[90vh] max-w-[94vw] rounded-xl object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}

    </div>
  );
}
