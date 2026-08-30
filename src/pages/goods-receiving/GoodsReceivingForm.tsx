import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  ChevronRight,
  ImagePlus,
  Loader2,
  Lock,
  Maximize2,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
import {
  INPUT_CLASS,
  PHOTO_BUCKET,
  PHOTO_TYPES,
  REDS_ACTION,
} from "./goodsReceiving.constants";
import type {
  EmployeeLite,
  ProductUnit,
  PurchaseOrder,
  PurchaseOrderLine,
  StockLocation,
} from "./goodsReceiving.types";
import {
  employeeName,
  formatQty,
  getErrorMessage,
  safeFileName,
  toNumber,
} from "./goodsReceiving.utils";

type Props = {
  onBack: () => void;
  onCompleted: (deliveryId: string) => void;
};

type MatchMode = "bill_has_po" | "bill_no_po";
type FormStage = "entry" | "review";
type RowStatus = "Received" | "Damaged" | "Rejected" | "Short" | "Mixed";
type StockLocationChoice = "site" | "office" | "supplier";

type ReceivingStockLocation = StockLocation & {
  location_type?: string | null;
  project_id?: string | null;
  supplier_id?: string | null;
};

type LineState = {
  purchaseOrderLineId: string;
  selected: boolean;
  billQty: string;
  billUom: string;
  receivedQty: string;
  receivedUom: string;
  status: RowStatus;
  damagedQty: string;
  damagedUom: string;
  rejectedQty: string;
  rejectedUom: string;
  shortQty: string;
  shortUom: string;
  damageDescription: string;
  rejectionReason: string;
  shortReason: string;
  damagePhotos: File[];
  rejectedPhotos: File[];
  shortPhotos: File[];
};

type PhotoPreview = {
  url: string;
  title: string;
};

const factorFor = (
  productId: string,
  uom: string,
  units: ProductUnit[],
  fallbackUom: string,
  fallbackFactor: number,
) => {
  if (uom === fallbackUom) return fallbackFactor || 1;
  return (
    toNumber(
      units.find(
        (unit) => unit.product_id === productId && unit.uom_code === uom,
      )?.conversion_to_base,
    ) || 1
  );
};

const statusClass = (status: RowStatus) => {
  if (status === "Received")
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "Damaged")
    return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "Rejected") return "border-red-200 bg-red-50 text-red-700";
  if (status === "Short") return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-orange-200 bg-orange-50 text-orange-700";
};

const statusLabel = (status: RowStatus) => {
  if (status === "Received") return "Received (All)";
  if (status === "Short") return "Short / Missing";
  if (status === "Mixed") return "Partial / Mixed";
  return status;
};

const filePreview = (file: File) => URL.createObjectURL(file);

export default function GoodsReceivingForm({ onBack, onCompleted }: Props) {
  const queryClient = useQueryClient();
  const [stage, setStage] = useState<FormStage>("entry");
  const [matchMode, setMatchMode] = useState<MatchMode>("bill_has_po");
  const [deliveryBillNo, setDeliveryBillNo] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [purchaseOrderId, setPurchaseOrderId] = useState("");
  const [poMatched, setPoMatched] = useState(false);
  const [stockLocationId, setStockLocationId] = useState("");
  const [stockLocationChoice, setStockLocationChoice] =
    useState<StockLocationChoice>("site");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [receiptNotes, setReceiptNotes] = useState("");
  const [lineStates, setLineStates] = useState<LineState[]>([]);
  const [billPhoto, setBillPhoto] = useState<File | null>(null);
  const [deliveredGoodsPhotos, setDeliveredGoodsPhotos] = useState<File[]>([]);
  const [preview, setPreview] = useState<PhotoPreview | null>(null);

  const billRef = useRef<HTMLInputElement>(null);
  const goodsRef = useRef<HTMLInputElement>(null);

  const { data: currentEmployee } = useQuery({
    queryKey: ["goods-receiving-form-current-employee"],
    queryFn: async (): Promise<EmployeeLite | null> => {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user?.id) return null;
      const { data, error } = await (supabase as any)
        .from("employees")
        .select(
          "employee_id, employee_code, display_name, first_name, last_name, auth_user_id",
        )
        .eq("auth_user_id", authData.user.id)
        .eq("is_active", true)
        .eq("is_deleted", false)
        .maybeSingle();
      if (error) throw error;
      return data as EmployeeLite | null;
    },
  });

  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ["goods-receiving-form-purchase-orders"],
    queryFn: async (): Promise<PurchaseOrder[]> => {
      const { data, error } = await (supabase as any).rpc(
        "get_goods_receiving_purchase_orders",
      );

      if (error) throw error;
      return (data ?? []) as PurchaseOrder[];
    },
  });

  const selectedPO =
    purchaseOrders.find((po) => po.purchase_order_id === purchaseOrderId) ??
    null;

  const { data: poLines = [] } = useQuery({
    queryKey: ["goods-receiving-form-po-lines", purchaseOrderId],
    enabled: Boolean(purchaseOrderId),
    queryFn: async (): Promise<PurchaseOrderLine[]> => {
      const { data, error } = await (supabase as any).rpc(
        "get_goods_receiving_purchase_order_lines",
        {
          p_purchase_order_id: purchaseOrderId,
        },
      );

      if (error) throw error;
      return (data ?? []) as PurchaseOrderLine[];
    },
  });

  const productIds = useMemo(
    () =>
      Array.from(
        new Set(poLines.map((line) => line.product_id).filter(Boolean)),
      ),
    [poLines],
  );

  const { data: productUnits = [] } = useQuery({
    queryKey: ["goods-receiving-form-product-units", productIds],
    enabled: productIds.length > 0,
    queryFn: async (): Promise<ProductUnit[]> => {
      const { data, error } = await (supabase as any)
        .from("product_units")
        .select(
          "product_unit_id, product_id, uom_code, conversion_to_base, allow_fractional_quantity, sort_order",
        )
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
      "goods-receiving-form-stock-locations",
      selectedPO?.site_id,
      selectedPO?.supplier_id,
    ],
    enabled: Boolean(selectedPO?.site_id && selectedPO?.supplier_id),
    queryFn: async (): Promise<ReceivingStockLocation[]> => {
      const { data, error } = await (supabase as any)
        .from("stock_locations")
        .select(
          "stock_location_id, location_code, location_name, location_type, project_id, site_id, supplier_id",
        )
        .eq("is_active", true)
        .eq("is_deleted", false)
        .or(
          `site_id.eq.${selectedPO!.site_id},location_code.eq.MAIN-WH,supplier_id.eq.${selectedPO!.supplier_id}`,
        )
        .order("location_name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ReceivingStockLocation[];
    },
  });

  const siteStockLocation = useMemo(
    () =>
      stockLocations.find(
        (location) =>
          location.location_type === "Site" &&
          location.site_id === selectedPO?.site_id &&
          !location.supplier_id,
      ) ?? null,
    [stockLocations, selectedPO?.site_id],
  );

  const officeWarehouseLocation = useMemo(
    () =>
      stockLocations.find(
        (location) =>
          location.location_type === "Warehouse" &&
          location.location_code === "MAIN-WH" &&
          !location.site_id &&
          !location.project_id &&
          !location.supplier_id,
      ) ?? null,
    [stockLocations],
  );

  const supplierWarehouseLocation = useMemo(
    () =>
      stockLocations.find(
        (location) =>
          location.location_type === "Warehouse" &&
          !location.site_id &&
          !location.project_id &&
          location.supplier_id === selectedPO?.supplier_id,
      ) ?? null,
    [stockLocations, selectedPO?.supplier_id],
  );

  const resolvedStockLocation = useMemo(() => {
    if (stockLocationChoice === "site") return siteStockLocation;
    if (stockLocationChoice === "office") return officeWarehouseLocation;
    return supplierWarehouseLocation;
  }, [
    stockLocationChoice,
    siteStockLocation,
    officeWarehouseLocation,
    supplierWarehouseLocation,
  ]);

  const stockLocationChoiceLabel =
    stockLocationChoice === "site"
      ? "Site"
      : stockLocationChoice === "office"
        ? "Office Warehouse"
        : "Supplier Warehouse";

  useEffect(() => {
    setStockLocationId(resolvedStockLocation?.stock_location_id ?? "");
  }, [resolvedStockLocation]);

  const initialiseLines = (lines: PurchaseOrderLine[]) => {
    setLineStates(
      lines.map((line) => {
        const docUom = line.purchase_uom_code || line.unit_of_measure;
        return {
          purchaseOrderLineId: line.purchase_order_line_id,
          selected: true,
          billQty: String(line.quantity),
          billUom: docUom,
          receivedQty: String(line.quantity),
          receivedUom: docUom,
          status: "Received",
          damagedQty: "0",
          damagedUom: docUom,
          rejectedQty: "0",
          rejectedUom: docUom,
          shortQty: "0",
          shortUom: docUom,
          damageDescription: "",
          rejectionReason: "",
          shortReason: "",
          damagePhotos: [],
          rejectedPhotos: [],
          shortPhotos: [],
        };
      }),
    );
  };

  const changePurchaseOrder = (value: string) => {
    setPurchaseOrderId(value);
    setPoMatched(false);
    setStockLocationChoice("site");
    setStockLocationId("");
    setLineStates([]);
    setStage("entry");
  };

  const confirmPoMatch = (checked: boolean) => {
    setPoMatched(checked);
    if (checked && poLines.length > 0 && lineStates.length === 0)
      initialiseLines(poLines);
  };

  const updateLine = (id: string, patch: Partial<LineState>) => {
    setLineStates((current) =>
      current.map((line) =>
        line.purchaseOrderLineId === id ? { ...line, ...patch } : line,
      ),
    );
  };

  const uomsFor = (line: PurchaseOrderLine) => {
    const docUom = line.purchase_uom_code || line.unit_of_measure;
    const supported = productUnits
      .filter((unit) => unit.product_id === line.product_id)
      .map((unit) => unit.uom_code);
    return Array.from(new Set([docUom, ...supported]));
  };

  const lineMath = (line: PurchaseOrderLine, state: LineState) => {
    const docUom = line.purchase_uom_code || line.unit_of_measure;
    const docFactor = toNumber(line.conversion_factor_to_base) || 1;
    const billFactor = factorFor(
      line.product_id,
      state.billUom,
      productUnits,
      docUom,
      docFactor,
    );
    const acceptedFactor = factorFor(
      line.product_id,
      state.receivedUom,
      productUnits,
      docUom,
      docFactor,
    );

    const billBase = toNumber(state.billQty) * billFactor;
    const acceptedBase = toNumber(state.receivedQty) * acceptedFactor;
    const damagedBase =
      toNumber(state.damagedQty) *
      factorFor(
        line.product_id,
        state.damagedUom,
        productUnits,
        docUom,
        docFactor,
      );
    const rejectedBase =
      toNumber(state.rejectedQty) *
      factorFor(
        line.product_id,
        state.rejectedUom,
        productUnits,
        docUom,
        docFactor,
      );
    const shortBase =
      toNumber(state.shortQty) *
      factorFor(
        line.product_id,
        state.shortUom,
        productUnits,
        docUom,
        docFactor,
      );

    const accountedBase = acceptedBase + damagedBase + rejectedBase + shortBase;
    const remainingBase = billBase - accountedBase;
    const remainingDocQty =
      docFactor > 0 ? remainingBase / docFactor : remainingBase;
    const acceptedDocQty =
      docFactor > 0 ? acceptedBase / docFactor : acceptedBase;
    const epsilon = 0.000001;
    const balanced = Math.abs(remainingBase) <= epsilon;
    const valid = remainingBase >= -epsilon;

    const positiveBuckets = [
      acceptedBase,
      damagedBase,
      rejectedBase,
      shortBase,
    ].filter((value) => value > epsilon).length;
    let derivedStatus: RowStatus = "Received";
    if (positiveBuckets > 1) derivedStatus = "Mixed";
    else if (damagedBase > epsilon) derivedStatus = "Damaged";
    else if (rejectedBase > epsilon) derivedStatus = "Rejected";
    else if (shortBase > epsilon) derivedStatus = "Short";

    return {
      billBase,
      acceptedBase,
      damagedBase,
      rejectedBase,
      shortBase,
      accountedBase,
      remainingBase,
      remainingDocQty,
      acceptedDocQty,
      balanced,
      valid,
      derivedStatus,
    };
  };

  const issueSummaryGroups = useMemo(() => {
    const groups = new Map<
      string,
      {
        uom: string;
        damaged: number;
        rejected: number;
        short: number;
        total: number;
      }
    >();

    lineStates.forEach((state) => {
      if (!state.selected) return;
      const line = poLines.find(
        (candidate) =>
          candidate.purchase_order_line_id === state.purchaseOrderLineId,
      );
      if (!line) return;

      const math = lineMath(line, state);
      const uom =
        line.base_uom_code ||
        line.products?.base_uom_code ||
        state.billUom ||
        "unit";
      const current = groups.get(uom) ?? {
        uom,
        damaged: 0,
        rejected: 0,
        short: 0,
        total: 0,
      };
      current.damaged += math.damagedBase;
      current.rejected += math.rejectedBase;
      current.short += math.shortBase;
      current.total += math.damagedBase + math.rejectedBase + math.shortBase;
      groups.set(uom, current);
    });

    return Array.from(groups.values());
  }, [lineStates, poLines, productUnits]);

  const issueSummaryText = (
    key: "damaged" | "rejected" | "short" | "total",
  ) => {
    const values = issueSummaryGroups
      .filter((group) => Math.abs(group[key]) > 0.000001)
      .map((group) => `${formatQty(group[key])} ${group.uom}`);
    return values.length ? values.join(" · ") : "0";
  };

  const hasReceivingIssues = issueSummaryGroups.some(
    (group) => group.total > 0.000001,
  );

  const addFiles = (
    lineId: string,
    key: "damagePhotos" | "rejectedPhotos" | "shortPhotos",
    files: FileList | null,
  ) => {
    if (!files?.length) return;
    const incoming = Array.from(files);
    setLineStates((current) =>
      current.map((line) =>
        line.purchaseOrderLineId === lineId
          ? { ...line, [key]: [...line[key], ...incoming] }
          : line,
      ),
    );
  };

  const removeFile = (
    lineId: string,
    key: "damagePhotos" | "rejectedPhotos" | "shortPhotos",
    index: number,
  ) => {
    setLineStates((current) =>
      current.map((line) =>
        line.purchaseOrderLineId === lineId
          ? { ...line, [key]: line[key].filter((_, i) => i !== index) }
          : line,
      ),
    );
  };

  const uploadFile = async (
    file: File,
    photoType: string,
    deliveryId: string,
  ) => {
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      throw new Error("Use JPEG, PNG or WebP images only.");
    }
    if (file.size > 10 * 1024 * 1024)
      throw new Error("Image must not exceed 10 MB.");

    const path = `${deliveryId}/${crypto.randomUUID()}-${safeFileName(
      file.name || "photo.jpg",
    )}`;
    const { error: uploadError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;

    const { data: authData } = await supabase.auth.getUser();
    const { error } = await (supabase as any)
      .from("supplier_delivery_photos")
      .insert({
        supplier_delivery_id: deliveryId,
        supplier_delivery_receipt_id: null,
        photo_url: path,
        photo_type: photoType,
        caption: null,
        sort_order: 0,
        is_deleted: false,
        uploaded_by: authData.user?.id ?? null,
      });
    if (error) throw error;
  };

  const validateEntry = () => {
    if (!deliveryBillNo.trim())
      throw new Error("Delivery Bill No. is required.");
    if (!billPhoto) throw new Error("Delivery Bill photo is required.");
    if (!purchaseOrderId || !poMatched)
      throw new Error("Confirm the Purchase Order match first.");
    if (!stockLocationId) throw new Error("Stock Location is required.");
    if (!currentEmployee)
      throw new Error("Your login is not linked to an active Employee record.");

    const selected = lineStates.filter((line) => line.selected);
    if (!selected.length)
      throw new Error("Select at least one item to receive.");

    selected.forEach((state) => {
      const line = poLines.find(
        (candidate) =>
          candidate.purchase_order_line_id === state.purchaseOrderLineId,
      );
      if (!line) throw new Error("Purchase Order line was not found.");
      if (toNumber(state.billQty) <= 0) {
        throw new Error(
          `Delivery Bill quantity must be greater than zero on line ${line.line_no}.`,
        );
      }
      if (toNumber(state.receivedQty) < 0) {
        throw new Error(
          `Received / Good quantity cannot be negative on line ${line.line_no}.`,
        );
      }
      const math = lineMath(line, state);
      if (!math.valid) {
        throw new Error(
          `Allocated quantity exceeds the Delivery Bill quantity on line ${line.line_no}.`,
        );
      }
      if (!math.balanced) {
        throw new Error(
          `${formatQty(Math.abs(math.remainingDocQty))} ${state.billUom} remains unallocated on line ${line.line_no}.`,
        );
      }
      if (math.damagedBase > 0) {
        if (!state.damageDescription.trim()) {
          throw new Error(
            `Damage description is required on line ${line.line_no}.`,
          );
        }
        if (!state.damagePhotos.length) {
          throw new Error(`Damage photo is required on line ${line.line_no}.`);
        }
      }
      if (math.rejectedBase > 0) {
        if (!state.rejectionReason.trim()) {
          throw new Error(
            `Rejection reason is required on line ${line.line_no}.`,
          );
        }
        if (!state.rejectedPhotos.length) {
          throw new Error(
            `Rejected goods photo is required on line ${line.line_no}.`,
          );
        }
      }
      if (math.shortBase > 0 && !state.shortReason.trim()) {
        throw new Error(
          `Short / Missing reason is required on line ${line.line_no}.`,
        );
      }
    });

    if (!deliveredGoodsPhotos.length)
      throw new Error("Delivered Goods photo is required.");
  };

  const openReview = () => {
    try {
      validateEntry();
      setStage("review");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const confirmReceiving = useMutation({
    mutationFn: async () => {
      validateEntry();

      const selectedStates = lineStates.filter((line) => line.selected);
      const createItems = selectedStates.map((state) => {
        const line = poLines.find(
          (candidate) =>
            candidate.purchase_order_line_id === state.purchaseOrderLineId,
        )!;
        return {
          purchase_order_line_id: line.purchase_order_line_id,
          received_quantity: toNumber(state.billQty),
          received_uom_code: state.billUom,
          notes: null,
        };
      });

      const { data: createData, error: createError } = await (
        supabase as any
      ).rpc("create_supplier_delivery_from_purchase_order_atomic", {
        p_purchase_order_id: purchaseOrderId,
        p_delivery_date: deliveryDate,
        p_supplier_delivery_note_no: deliveryBillNo.trim(),
        p_notes: deliveryNotes.trim() || null,
        p_items: createItems,
      });
      if (createError) throw createError;

      const deliveryId = createData?.supplier_delivery_id as string | undefined;
      if (!deliveryId)
        throw new Error("Created Supplier Delivery ID was not returned.");

      await uploadFile(billPhoto!, PHOTO_TYPES.supplierDocument, deliveryId);
      for (const file of deliveredGoodsPhotos) {
        await uploadFile(file, PHOTO_TYPES.receiptEvidence, deliveryId);
      }
      for (const state of selectedStates) {
        for (const file of state.damagePhotos) {
          await uploadFile(file, PHOTO_TYPES.damaged, deliveryId);
        }
        for (const file of state.rejectedPhotos) {
          await uploadFile(file, PHOTO_TYPES.rejected, deliveryId);
        }
        for (const file of state.shortPhotos) {
          await uploadFile(file, PHOTO_TYPES.short, deliveryId);
        }
      }

      const { data: deliveryData, error: deliveryError } = await (
        supabase as any
      )
        .from("supplier_deliveries")
        .select(
          `
          supplier_delivery_id, site_id,
          supplier_delivery_items (
            supplier_delivery_item_id, purchase_order_line_id, product_id, line_no,
            received_quantity, received_uom_code, conversion_factor_to_base
          )
        `,
        )
        .eq("supplier_delivery_id", deliveryId)
        .eq("is_deleted", false)
        .single();
      if (deliveryError) throw deliveryError;

      const deliveryItems = (deliveryData?.supplier_delivery_items ??
        []) as Array<{
        supplier_delivery_item_id: string;
        purchase_order_line_id: string | null;
        product_id: string;
        line_no: number;
        received_quantity: number | string;
        received_uom_code: string;
        conversion_factor_to_base: number | string | null;
      }>;

      const receiptItems = selectedStates.map((state) => {
        const poLine = poLines.find(
          (candidate) =>
            candidate.purchase_order_line_id === state.purchaseOrderLineId,
        )!;
        const deliveryItem = deliveryItems.find(
          (item) => item.purchase_order_line_id === state.purchaseOrderLineId,
        );
        if (!deliveryItem) {
          throw new Error(
            `Created delivery line ${poLine.line_no} could not be matched.`,
          );
        }

        const math = lineMath(poLine, state);
        const docUom = poLine.purchase_uom_code || poLine.unit_of_measure;
        const docFactor = toNumber(poLine.conversion_factor_to_base) || 1;

        return {
          supplier_delivery_item_id: deliveryItem.supplier_delivery_item_id,
          received_quantity: toNumber(state.billQty),
          accepted_components:
            math.acceptedBase > 0
              ? [
                  {
                    quantity: toNumber(state.receivedQty),
                    uom_code: state.receivedUom,
                  },
                ]
              : [],
          damaged_components:
            math.damagedBase > 0
              ? [
                  {
                    quantity: toNumber(state.damagedQty),
                    uom_code: state.damagedUom,
                  },
                ]
              : [],
          rejected_components:
            math.rejectedBase > 0
              ? [
                  {
                    quantity: toNumber(state.rejectedQty),
                    uom_code: state.rejectedUom,
                  },
                ]
              : [],
          short_components:
            math.shortBase > 0
              ? [
                  {
                    quantity: toNumber(state.shortQty),
                    uom_code: state.shortUom,
                  },
                ]
              : [],
          damage_description:
            math.damagedBase > 0 ? state.damageDescription.trim() : null,
          rejection_reason:
            math.rejectedBase > 0 ? state.rejectionReason.trim() : null,
          short_reason: math.shortBase > 0 ? state.shortReason.trim() : null,
          damage_detail_quantity: 0,
          damage_detail_uom_code: null,
          replacement_required: false,
          lot_no: null,
          expiry_date: null,
          notes: null,
        };
      });

      const { error: receiptError } = await (supabase as any).rpc(
        "create_site_goods_receiving_atomic",
        {
          p_supplier_delivery_id: deliveryId,
          p_site_id: deliveryData.site_id,
          p_stock_location_id: stockLocationId,
          p_items: receiptItems,
          p_notes: receiptNotes.trim() || null,
        },
      );
      if (receiptError) throw receiptError;

      return deliveryId;
    },
    onSuccess: async (deliveryId) => {
      await queryClient.invalidateQueries({
        queryKey: ["goods-receiving-dashboard-deliveries"],
      });
      toast.success("Goods Receiving completed.");
      onCompleted(deliveryId);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const changeStatus = (lineId: string, status: RowStatus) => {
    setLineStates((current) =>
      current.map((state) => {
        if (state.purchaseOrderLineId !== lineId) return state;
        const line = poLines.find(
          (candidate) => candidate.purchase_order_line_id === lineId,
        );
        if (!line) return state;

        if (status === "Received") {
          return {
            ...state,
            status: "Received",
            receivedQty: state.billQty,
            receivedUom: state.billUom,
            damagedQty: "0",
            rejectedQty: "0",
            shortQty: "0",
            damageDescription: "",
            rejectionReason: "",
            shortReason: "",
            damagePhotos: [],
            rejectedPhotos: [],
            shortPhotos: [],
          };
        }

        const math = lineMath(line, state);
        const remainingBase = Math.max(0, math.remainingBase);
        const docUom = line.purchase_uom_code || line.unit_of_measure;
        const docFactor = toNumber(line.conversion_factor_to_base) || 1;
        const quantityFor = (uom: string) => {
          const factor = factorFor(
            line.product_id,
            uom,
            productUnits,
            docUom,
            docFactor,
          );
          if (!factor) return "0";
          return String(Number((remainingBase / factor).toFixed(6)));
        };

        if (status === "Damaged") {
          return {
            ...state,
            status,
            damagedQty:
              remainingBase > 0
                ? quantityFor(state.damagedUom)
                : state.damagedQty,
          };
        }
        if (status === "Rejected") {
          return {
            ...state,
            status,
            rejectedQty:
              remainingBase > 0
                ? quantityFor(state.rejectedUom)
                : state.rejectedQty,
          };
        }
        if (status === "Short") {
          return {
            ...state,
            status,
            shortQty:
              remainingBase > 0 ? quantityFor(state.shortUom) : state.shortQty,
          };
        }

        return { ...state, status };
      }),
    );
  };

  const removeIssue = (
    lineId: string,
    issue: "Damaged" | "Rejected" | "Short",
  ) => {
    setLineStates((current) =>
      current.map((state) => {
        if (state.purchaseOrderLineId !== lineId) return state;
        const next = { ...state };

        if (issue === "Damaged") {
          next.damagedQty = "0";
          next.damageDescription = "";
          next.damagePhotos = [];
        } else if (issue === "Rejected") {
          next.rejectedQty = "0";
          next.rejectionReason = "";
          next.rejectedPhotos = [];
        } else {
          next.shortQty = "0";
          next.shortReason = "";
          next.shortPhotos = [];
        }

        if (toNumber(next.damagedQty) > 0) next.status = "Damaged";
        else if (toNumber(next.rejectedQty) > 0) next.status = "Rejected";
        else if (toNumber(next.shortQty) > 0) next.status = "Short";
        else next.status = "Received";
        return next;
      }),
    );
  };

  const issuePhotoStrip = (
    state: LineState,
    key: "damagePhotos" | "rejectedPhotos" | "shortPhotos",
    label: string,
    accent: string,
  ) => (
    <div>
      <Label>{label}</Label>
      <div className="mt-2 flex flex-wrap gap-2">
        {state[key].map((file, index) => {
          const url = filePreview(file);
          return (
            <div
              key={`${file.name}-${file.lastModified}-${index}`}
              className="relative"
            >
              <button
                type="button"
                onClick={() => setPreview({ url, title: label })}
                className="block"
              >
                <img
                  src={url}
                  alt={label}
                  className="h-20 w-24 rounded-lg border object-cover"
                />
              </button>
              <button
                type="button"
                onClick={() =>
                  removeFile(state.purchaseOrderLineId, key, index)
                }
                className="absolute -right-1 -top-1 rounded-full bg-white p-1 shadow"
                aria-label="Remove photo"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}
        <label
          className="flex h-20 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-white text-xs"
          style={{ color: accent }}
        >
          <ImagePlus className="mb-1 h-4 w-4" />
          Add Photo
          <input
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={(event) => {
              addFiles(state.purchaseOrderLineId, key, event.target.files);
              event.target.value = "";
            }}
          />
        </label>
      </div>
    </div>
  );

  const detailRows = (line: PurchaseOrderLine, state: LineState) => {
    const math = lineMath(line, state);
    const uoms = uomsFor(line);
    const showDamaged =
      toNumber(state.damagedQty) > 0 || state.status === "Damaged";
    const showRejected =
      toNumber(state.rejectedQty) > 0 || state.status === "Rejected";
    const showShort = toNumber(state.shortQty) > 0 || state.status === "Short";
    const hasIssue = showDamaged || showRejected || showShort;

    if (!hasIssue && math.balanced) return null;

    return (
      <tr className="border-t bg-white">
        <td colSpan={8} className="p-0">
          <div className="space-y-3 p-3 sm:p-4">
            {showDamaged && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="inline-flex rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                    Damaged
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-amber-300 text-amber-800"
                    onClick={() =>
                      removeIssue(state.purchaseOrderLineId, "Damaged")
                    }
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    Remove
                  </Button>
                </div>
                <div className="grid gap-3 lg:grid-cols-[150px_150px_minmax(260px,1fr)_minmax(280px,1fr)]">
                  <div>
                    <Label className="text-amber-800">Damaged Quantity *</Label>
                    <Input
                      type="number"
                      min="0"
                      value={state.damagedQty}
                      onChange={(event) =>
                        updateLine(state.purchaseOrderLineId, {
                          damagedQty: event.target.value,
                        })
                      }
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <Label className="text-amber-800">UOM *</Label>
                    <Select
                      value={state.damagedUom}
                      onValueChange={(value) =>
                        updateLine(state.purchaseOrderLineId, {
                          damagedUom: value,
                        })
                      }
                    >
                      <SelectTrigger className={INPUT_CLASS}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {uoms.map((uom) => (
                          <SelectItem key={uom} value={uom}>
                            {uom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-amber-800">
                      Damage Description *
                    </Label>
                    <Input
                      value={state.damageDescription}
                      onChange={(event) =>
                        updateLine(state.purchaseOrderLineId, {
                          damageDescription: event.target.value,
                        })
                      }
                      className={INPUT_CLASS}
                    />
                  </div>
                  {issuePhotoStrip(
                    state,
                    "damagePhotos",
                    "Damage Photos *",
                    "#B45309",
                  )}
                </div>
              </div>
            )}

            {showRejected && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="inline-flex rounded-full border border-red-300 bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800">
                    Rejected / Return
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-800"
                    onClick={() =>
                      removeIssue(state.purchaseOrderLineId, "Rejected")
                    }
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    Remove
                  </Button>
                </div>
                <div className="grid gap-3 lg:grid-cols-[150px_150px_minmax(260px,1fr)_minmax(280px,1fr)]">
                  <div>
                    <Label className="text-red-800">Rejected Quantity *</Label>
                    <Input
                      type="number"
                      min="0"
                      value={state.rejectedQty}
                      onChange={(event) =>
                        updateLine(state.purchaseOrderLineId, {
                          rejectedQty: event.target.value,
                        })
                      }
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <Label className="text-red-800">UOM *</Label>
                    <Select
                      value={state.rejectedUom}
                      onValueChange={(value) =>
                        updateLine(state.purchaseOrderLineId, {
                          rejectedUom: value,
                        })
                      }
                    >
                      <SelectTrigger className={INPUT_CLASS}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {uoms.map((uom) => (
                          <SelectItem key={uom} value={uom}>
                            {uom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-red-800">Reason *</Label>
                    <Input
                      value={state.rejectionReason}
                      onChange={(event) =>
                        updateLine(state.purchaseOrderLineId, {
                          rejectionReason: event.target.value,
                        })
                      }
                      className={INPUT_CLASS}
                    />
                  </div>
                  {issuePhotoStrip(
                    state,
                    "rejectedPhotos",
                    "Rejected Goods Photos *",
                    "#B91C1C",
                  )}
                </div>
              </div>
            )}

            {showShort && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="inline-flex rounded-full border border-blue-300 bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800">
                    Short / Missing
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-blue-300 text-blue-800"
                    onClick={() =>
                      removeIssue(state.purchaseOrderLineId, "Short")
                    }
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    Remove
                  </Button>
                </div>
                <div className="grid gap-3 lg:grid-cols-[150px_150px_minmax(260px,1fr)_minmax(280px,1fr)]">
                  <div>
                    <Label className="text-blue-800">
                      Short / Missing Quantity *
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={state.shortQty}
                      onChange={(event) =>
                        updateLine(state.purchaseOrderLineId, {
                          shortQty: event.target.value,
                        })
                      }
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <Label className="text-blue-800">UOM *</Label>
                    <Select
                      value={state.shortUom}
                      onValueChange={(value) =>
                        updateLine(state.purchaseOrderLineId, {
                          shortUom: value,
                        })
                      }
                    >
                      <SelectTrigger className={INPUT_CLASS}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {uoms.map((uom) => (
                          <SelectItem key={uom} value={uom}>
                            {uom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-blue-800">Reason *</Label>
                    <Input
                      value={state.shortReason}
                      onChange={(event) =>
                        updateLine(state.purchaseOrderLineId, {
                          shortReason: event.target.value,
                        })
                      }
                      className={INPUT_CLASS}
                    />
                  </div>
                  {issuePhotoStrip(
                    state,
                    "shortPhotos",
                    "Short / Missing Photos",
                    "#1D4ED8",
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span>
                Total Accounted (Base UOM):{" "}
                <strong>{formatQty(math.accountedBase)}</strong>
              </span>
              <span
                className={
                  math.balanced
                    ? "font-semibold text-emerald-700"
                    : "font-semibold text-red-700"
                }
              >
                {math.balanced
                  ? "✓ Fully accounted"
                  : math.remainingBase > 0
                    ? `⚠ ${formatQty(math.remainingDocQty)} ${state.billUom} remaining — select another status`
                    : `✕ Exceeds Delivery Bill by ${formatQty(Math.abs(math.remainingDocQty))} ${state.billUom}`}
              </span>
            </div>
          </div>
        </td>
      </tr>
    );
  };

  const renderEntry = () => (
    <div className="space-y-5 p-4 sm:p-6">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to List
      </Button>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Goods Receiving — Delivery Bill
            </h1>
            <p className="text-sm text-slate-500">
              Receive one supplier Delivery Bill at a time.
            </p>
          </div>
          <div className="flex gap-5 text-xs">
            <span className="font-bold text-[#9E4B4B]">1 Delivery Bill</span>
            <span className={poMatched ? "font-semibold" : "text-slate-400"}>
              2 Items Inspection
            </span>
            <span className="text-slate-400">3 Review & Confirm</span>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_180px_1fr]">
          <div>
            <Label>Delivery Bill No. *</Label>
            <div className="mt-1 flex gap-2">
              <Input
                value={deliveryBillNo}
                onChange={(event) => setDeliveryBillNo(event.target.value)}
                className={INPUT_CLASS}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => billRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
              </Button>
              <input
                ref={billRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) setBillPhoto(file);
                  event.target.value = "";
                }}
              />
            </div>
          </div>

          <div className="hidden lg:block">
            {billPhoto ? (
              <button
                type="button"
                onClick={() =>
                  setPreview({
                    url: filePreview(billPhoto),
                    title: "Delivery Bill Photo",
                  })
                }
                className="relative"
              >
                <img
                  src={filePreview(billPhoto)}
                  alt="Delivery Bill"
                  className="h-20 w-32 rounded-lg border object-cover"
                />
                <span className="absolute bottom-1 right-1 rounded bg-black/60 p-1 text-white">
                  <Maximize2 className="h-3 w-3" />
                </span>
              </button>
            ) : (
              <div className="flex h-20 items-center justify-center rounded-lg border border-dashed text-xs text-slate-400">
                Delivery Bill Photo
              </div>
            )}
          </div>

          <div>
            <Label>Delivery Date *</Label>
            <Input
              type="date"
              value={deliveryDate}
              onChange={(event) => setDeliveryDate(event.target.value)}
              className={`mt-1 ${INPUT_CLASS}`}
            />
          </div>
        </div>

        <div className="mt-5 rounded-xl border bg-[#F7F9FB] p-4">
          <Label>How is the PO identified?</Label>
          <div className="mt-2 flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={matchMode === "bill_has_po"}
                onChange={() => {
                  setMatchMode("bill_has_po");
                  changePurchaseOrder("");
                }}
              />
              PO number shown on Delivery Bill
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={matchMode === "bill_no_po"}
                onChange={() => {
                  setMatchMode("bill_no_po");
                  changePurchaseOrder("");
                }}
              />
              PO number not shown — Find matching PO
            </label>
          </div>

          <div className="mt-4">
            <Label>
              {matchMode === "bill_has_po"
                ? "Purchase Order *"
                : "Suggested / Matching Purchase Order *"}
            </Label>
            <Select value={purchaseOrderId} onValueChange={changePurchaseOrder}>
              <SelectTrigger className={`mt-1 ${INPUT_CLASS}`}>
                <SelectValue placeholder="Select Purchase Order" />
              </SelectTrigger>
              <SelectContent>
                {purchaseOrders.map((po) => (
                  <SelectItem
                    key={po.purchase_order_id}
                    value={po.purchase_order_id}
                  >
                    {po.purchase_order_no} — {po.suppliers?.supplier_name} —{" "}
                    {po.project_sites?.site_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPO && (
            <div className="mt-4 grid gap-3 rounded-xl border bg-white p-3 md:grid-cols-5">
              <div>
                <p className="text-xs text-slate-500">PO No.</p>
                <strong>{selectedPO.purchase_order_no}</strong>
              </div>
              <div>
                <p className="text-xs text-slate-500">Supplier</p>
                <strong>{selectedPO.suppliers?.supplier_name}</strong>
              </div>
              <div>
                <p className="text-xs text-slate-500">Project</p>
                <strong>{selectedPO.projects?.project_name}</strong>
              </div>
              <div>
                <p className="text-xs text-slate-500">Site</p>
                <strong>{selectedPO.project_sites?.site_name}</strong>
              </div>
              <div>
                <p className="text-xs text-slate-500">Expected</p>
                <strong>{selectedPO.expected_delivery_date ?? "-"}</strong>
              </div>
            </div>
          )}

          {selectedPO && poLines.length > 0 && (
            <div className="mt-4 overflow-hidden rounded-xl border bg-white">
              <div className="border-b bg-[#F7F9FB] px-3 py-2">
                <p className="text-sm font-semibold">
                  Purchase Order Items — Check against Delivery Bill
                </p>
                <p className="text-xs text-slate-500">
                  Read only. Confirm the product, UOM and PO quantity against
                  the supplier Delivery Bill before enabling inspection.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-white">
                    <tr className="border-b">
                      <th className="p-2 text-center">No.</th>
                      <th className="p-2 text-left">Product</th>
                      <th className="p-2 text-center">UOM</th>
                      <th className="p-2 text-right">PO Ordered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {poLines.map((line) => (
                      <tr
                        key={`verify-${line.purchase_order_line_id}`}
                        className="border-t"
                      >
                        <td className="p-2 text-center">{line.line_no}</td>
                        <td className="p-2">
                          <strong>
                            {line.products?.product_name ??
                              line.description ??
                              "-"}
                          </strong>
                          <p className="text-xs text-slate-500">
                            {line.products?.product_code ?? ""}
                          </p>
                        </td>
                        <td className="p-2 text-center">
                          {line.purchase_uom_code || line.unit_of_measure}
                        </td>
                        <td className="p-2 text-right font-semibold">
                          {formatQty(line.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedPO && (
            <label className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              <input
                type="checkbox"
                checked={poMatched}
                onChange={(event) => confirmPoMatch(event.target.checked)}
              />
              I confirm this PO matches the Delivery Bill
              {matchMode === "bill_no_po"
                ? " using Supplier / Project / Site / item information."
                : " number."}
            </label>
          )}
        </div>
      </section>

      {selectedPO && poMatched && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold">
                Items on this Delivery Bill ({poLines.length})
              </h2>
              <p className="text-xs text-slate-500">
                Select items to inspect. Unchecked items are not included in
                this receiving and are not Rejected.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-xs">
              <span className="text-emerald-700">● Received</span>
              <span className="text-amber-700">● Damaged</span>
              <span className="text-red-700">● Rejected</span>
              <span className="text-blue-700">● Short / Missing</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-sm">
              <thead className="bg-[#F7F9FB]">
                <tr>
                  <th className="p-3">Select</th>
                  <th className="p-3">No.</th>
                  <th className="p-3 text-left">Product</th>
                  <th className="p-3">UOM (Doc.)</th>
                  <th className="p-3">PO Ordered</th>
                  <th className="p-3">Delivery Bill Qty</th>
                  <th className="p-3">Received / Good</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {poLines.map((line) => {
                  const state = lineStates.find(
                    (candidate) =>
                      candidate.purchaseOrderLineId ===
                      line.purchase_order_line_id,
                  );
                  if (!state) return null;
                  const math = lineMath(line, state);
                  return (
                    <>
                      <tr
                        key={`${line.purchase_order_line_id}-main`}
                        className="border-t"
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={state.selected}
                            onChange={(event) =>
                              updateLine(state.purchaseOrderLineId, {
                                selected: event.target.checked,
                              })
                            }
                            className="h-4 w-4 accent-[#9E4B4B]"
                          />
                        </td>
                        <td className="p-3 text-center">{line.line_no}</td>
                        <td className="p-3">
                          <strong>
                            {line.products?.product_name ??
                              line.description ??
                              "-"}
                          </strong>
                          <p className="text-xs text-slate-500">
                            {line.products?.product_code ?? ""}
                          </p>
                        </td>
                        <td className="p-3 text-center">
                          {line.purchase_uom_code || line.unit_of_measure}
                        </td>
                        <td className="p-3 text-center">
                          {formatQty(line.quantity)}
                        </td>
                        <td className="p-3">
                          <div className="mx-auto flex max-w-48 items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              value={state.billQty}
                              onChange={(event) =>
                                updateLine(state.purchaseOrderLineId, {
                                  billQty: event.target.value,
                                })
                              }
                              className={INPUT_CLASS}
                              disabled={!state.selected}
                            />
                            <span className="min-w-12 text-xs text-slate-500">
                              {state.billUom}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="mx-auto flex max-w-48 items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              value={state.receivedQty}
                              onChange={(event) =>
                                updateLine(state.purchaseOrderLineId, {
                                  receivedQty: event.target.value,
                                })
                              }
                              className={INPUT_CLASS}
                              disabled={!state.selected}
                            />
                            <span className="min-w-12 text-xs text-slate-500">
                              {state.receivedUom}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <Select
                            value={state.status}
                            onValueChange={(value) =>
                              changeStatus(
                                state.purchaseOrderLineId,
                                value as RowStatus,
                              )
                            }
                            disabled={!state.selected}
                          >
                            <SelectTrigger
                              className={
                                !math.balanced
                                  ? "border-2 border-red-500 bg-red-50 font-semibold text-red-700 focus:ring-red-500"
                                  : statusClass(math.derivedStatus)
                              }
                            >
                              <SelectValue>
                                {!math.balanced
                                  ? math.remainingBase > 0
                                    ? `⚠ ${formatQty(math.remainingDocQty)} ${state.billUom} remaining`
                                    : `✕ Over ${formatQty(Math.abs(math.remainingDocQty))} ${state.billUom}`
                                  : statusLabel(math.derivedStatus)}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Received">
                                Received (All)
                              </SelectItem>
                              <SelectItem value="Damaged">Damaged</SelectItem>
                              <SelectItem value="Rejected">Rejected</SelectItem>
                              <SelectItem value="Short">
                                Short / Missing
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          {state.selected &&
                            !math.balanced &&
                            math.remainingBase > 0 && (
                              <p className="mt-1 text-center text-[11px] font-semibold text-red-600">
                                Select where the remaining quantity belongs.
                              </p>
                            )}
                        </td>
                      </tr>
                      {state.selected && detailRows(line, state)}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="border-t bg-amber-50/70 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-slate-900">Issue Summary</p>
              {!hasReceivingIssues && (
                <span className="font-semibold text-emerald-700">
                  ✓ No receiving issues
                </span>
              )}
            </div>
            {hasReceivingIssues && (
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-amber-200 bg-white p-3 text-amber-700">
                  <p className="text-xs">Damaged</p>
                  <strong>{issueSummaryText("damaged")}</strong>
                </div>
                <div className="rounded-lg border border-red-200 bg-white p-3 text-red-700">
                  <p className="text-xs">Rejected / Return</p>
                  <strong>{issueSummaryText("rejected")}</strong>
                </div>
                <div className="rounded-lg border border-blue-200 bg-white p-3 text-blue-700">
                  <p className="text-xs">Short / Missing</p>
                  <strong>{issueSummaryText("short")}</strong>
                </div>
                <div className="rounded-lg border border-slate-300 bg-white p-3 text-slate-900">
                  <p className="text-xs">Total Issue</p>
                  <strong>{issueSummaryText("total")}</strong>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {selectedPO && poMatched && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl border bg-[#F7F9FB] p-3">
              <p className="text-xs text-slate-500">Receiving Site</p>
              <p className="font-semibold">
                {selectedPO.project_sites?.site_name ?? "-"}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                <Lock className="h-3 w-3" />
                Locked from {selectedPO.purchase_order_no}
              </p>
            </div>
            <div>
              <Label>Stock Location *</Label>
              <Select
                value={stockLocationChoice}
                onValueChange={(value) =>
                  setStockLocationChoice(value as StockLocationChoice)
                }
              >
                <SelectTrigger className={`mt-1 ${INPUT_CLASS}`}>
                  <SelectValue placeholder="Select Stock Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="site" disabled={!siteStockLocation}>
                    Site
                  </SelectItem>
                  <SelectItem
                    value="office"
                    disabled={!officeWarehouseLocation}
                  >
                    Office Warehouse
                  </SelectItem>
                  <SelectItem
                    value="supplier"
                    disabled={!supplierWarehouseLocation}
                  >
                    Supplier Warehouse
                  </SelectItem>
                </SelectContent>
              </Select>

              {resolvedStockLocation ? (
                <div className="mt-2 rounded-xl border bg-[#F7F9FB] p-3">
                  <p className="font-semibold">
                    {resolvedStockLocation.location_code} —{" "}
                    {resolvedStockLocation.location_name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {stockLocationChoice === "site"
                      ? `Receiving Site from ${selectedPO.purchase_order_no}`
                      : stockLocationChoice === "office"
                        ? "REDS Office Warehouse"
                        : `Supplier from ${selectedPO.purchase_order_no}`}
                  </p>
                </div>
              ) : (
                <div className="mt-2 rounded-xl border-2 border-red-300 bg-red-50 p-3 text-sm text-red-700">
                  <p className="font-semibold">
                    {stockLocationChoiceLabel} is not configured.
                  </p>
                  <p className="mt-1 text-xs">
                    Select another available Stock Location or configure the
                    missing location before continuing.
                  </p>
                </div>
              )}
            </div>
            <div className="rounded-xl border bg-[#F7F9FB] p-3">
              <p className="text-xs text-slate-500">Received By</p>
              <p className="font-semibold">{employeeName(currentEmployee)}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                <Lock className="h-3 w-3" />
                Login user
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <Label>Delivery Notes</Label>
              <Textarea
                value={deliveryNotes}
                onChange={(event) => setDeliveryNotes(event.target.value)}
                className={`mt-1 ${INPUT_CLASS}`}
              />
            </div>
            <div>
              <Label>Receipt Notes</Label>
              <Textarea
                value={receiptNotes}
                onChange={(event) => setReceiptNotes(event.target.value)}
                className={`mt-1 ${INPUT_CLASS}`}
              />
            </div>
          </div>
        </section>
      )}

      {selectedPO && poMatched && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold">Delivery Evidence (Photos)</h3>
          <p className="mt-1 text-xs text-slate-500">
            On mobile, photos stay below the item inspection. Tap any photo to
            enlarge.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-white p-3">
              <p className="font-semibold">Delivery Bill Photo *</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {billPhoto ? (
                  <button
                    type="button"
                    onClick={() =>
                      setPreview({
                        url: filePreview(billPhoto),
                        title: "Delivery Bill Photo",
                      })
                    }
                  >
                    <img
                      src={filePreview(billPhoto)}
                      alt="Delivery Bill"
                      className="h-28 w-40 rounded-lg border object-cover"
                    />
                  </button>
                ) : (
                  <div className="flex h-28 w-40 items-center justify-center rounded-lg border border-dashed text-xs text-slate-400">
                    No photo
                  </div>
                )}
                <Button
                  variant="outline"
                  className="h-28 w-36"
                  onClick={() => billRef.current?.click()}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Take Photo
                </Button>
              </div>
            </div>

            <div className="rounded-xl border bg-white p-3">
              <p className="font-semibold">Delivered Goods Photo *</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {deliveredGoodsPhotos.map((file, index) => {
                  const url = filePreview(file);
                  return (
                    <div
                      key={`${file.name}-${file.lastModified}-${index}`}
                      className="relative"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setPreview({ url, title: "Delivered Goods Photo" })
                        }
                      >
                        <img
                          src={url}
                          alt="Delivered Goods"
                          className="h-28 w-40 rounded-lg border object-cover"
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeliveredGoodsPhotos((current) =>
                            current.filter((_, i) => i !== index),
                          )
                        }
                        className="absolute -right-1 -top-1 rounded-full bg-white p-1 shadow"
                        aria-label="Remove photo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
                <Button
                  variant="outline"
                  className="h-28 w-36"
                  onClick={() => goodsRef.current?.click()}
                >
                  <ImagePlus className="mr-2 h-4 w-4" />
                  Add Photo
                </Button>
                <input
                  ref={goodsRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    if (event.target.files?.length) {
                      setDeliveredGoodsPhotos((current) => [
                        ...current,
                        ...Array.from(event.target.files!),
                      ]);
                    }
                    event.target.value = "";
                  }}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {selectedPO && poMatched && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onBack}>
            Cancel
          </Button>
          <Button
            className="text-white"
            style={{ backgroundColor: REDS_ACTION }}
            onClick={openReview}
            disabled={!stockLocationId}
            title={
              !stockLocationId
                ? "Select an available Stock Location before continuing."
                : undefined
            }
          >
            <ChevronRight className="mr-2 h-4 w-4" />
            Review & Confirm
          </Button>
        </div>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreview(null)}
        >
          <div className="absolute left-4 top-4 rounded bg-black/50 px-3 py-2 text-sm text-white">
            {preview.title}
          </div>
          <button
            type="button"
            className="absolute right-5 top-5 rounded-full bg-white p-2"
            onClick={() => setPreview(null)}
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={preview.url}
            alt={preview.title}
            className="max-h-[92vh] max-w-[96vw] object-contain"
          />
        </div>
      )}
    </div>
  );

  const renderReview = () => (
    <div className="space-y-5 p-4 sm:p-6">
      <Button variant="ghost" onClick={() => setStage("entry")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Items Inspection
      </Button>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Review & Confirm Goods Receiving
            </h1>
            <p className="text-sm text-slate-500">
              Check the Delivery Bill, linked PO, quantities, issues and
              evidence before posting stock.
            </p>
          </div>
          <div className="flex gap-5 text-xs">
            <span className="text-slate-400">1 Delivery Bill</span>
            <span className="text-slate-400">2 Items Inspection</span>
            <span className="font-bold text-[#9E4B4B]">3 Review & Confirm</span>
          </div>
        </div>

        <div className="mt-5 grid gap-3 rounded-xl border bg-[#F7F9FB] p-4 md:grid-cols-3 lg:grid-cols-6">
          <div>
            <p className="text-xs text-slate-500">Delivery Bill No.</p>
            <strong>{deliveryBillNo}</strong>
          </div>
          <div>
            <p className="text-xs text-slate-500">PO No.</p>
            <strong>{selectedPO?.purchase_order_no}</strong>
          </div>
          <div>
            <p className="text-xs text-slate-500">Supplier</p>
            <strong>{selectedPO?.suppliers?.supplier_name}</strong>
          </div>
          <div>
            <p className="text-xs text-slate-500">Receiving Site</p>
            <strong>{selectedPO?.project_sites?.site_name}</strong>
          </div>
          <div>
            <p className="text-xs text-slate-500">Stock Location</p>
            <strong>{stockLocationChoiceLabel}</strong>
            <p className="text-xs text-slate-500">
              {resolvedStockLocation?.location_name ?? "-"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Received By</p>
            <strong>{employeeName(currentEmployee)}</strong>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold">Issue Summary</h2>
        {!hasReceivingIssues ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-700">
            ✓ No receiving issues
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-700">
              <p className="text-xs">Damaged</p>
              <strong className="text-lg">{issueSummaryText("damaged")}</strong>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              <p className="text-xs">Rejected / Return</p>
              <strong className="text-lg">
                {issueSummaryText("rejected")}
              </strong>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-700">
              <p className="text-xs">Short / Missing</p>
              <strong className="text-lg">{issueSummaryText("short")}</strong>
            </div>
            <div className="rounded-xl border border-slate-300 bg-slate-50 p-4 text-slate-900">
              <p className="text-xs">Total Issue</p>
              <strong className="text-lg">{issueSummaryText("total")}</strong>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold">Selected Items</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-[#F7F9FB]">
              <tr>
                <th className="p-3">No.</th>
                <th className="p-3 text-left">Product</th>
                <th className="p-3">Received / Good</th>
                <th className="p-3">Status</th>
                <th className="p-3">Received / Good (Base)</th>
                <th className="p-3">Damaged</th>
                <th className="p-3">Rejected</th>
                <th className="p-3">Short</th>
              </tr>
            </thead>
            <tbody>
              {lineStates
                .filter((state) => state.selected)
                .map((state) => {
                  const line = poLines.find(
                    (candidate) =>
                      candidate.purchase_order_line_id ===
                      state.purchaseOrderLineId,
                  )!;
                  const math = lineMath(line, state);
                  return (
                    <tr key={state.purchaseOrderLineId} className="border-t">
                      <td className="p-3 text-center">{line.line_no}</td>
                      <td className="p-3">
                        <strong>
                          {line.products?.product_name ?? line.description}
                        </strong>
                      </td>
                      <td className="p-3 text-center">
                        {formatQty(state.receivedQty)} {state.receivedUom}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(state.status)}`}
                        >
                          {statusLabel(state.status)}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {formatQty(math.acceptedBase)}
                      </td>
                      <td className="p-3 text-center">
                        {formatQty(math.damagedBase)}
                      </td>
                      <td className="p-3 text-center">
                        {formatQty(math.rejectedBase)}
                      </td>
                      <td className="p-3 text-center">
                        {formatQty(math.shortBase)}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setStage("entry")}>
          Back
        </Button>
        <Button
          className="text-white"
          style={{ backgroundColor: REDS_ACTION }}
          onClick={() => confirmReceiving.mutate()}
          disabled={confirmReceiving.isPending}
        >
          {confirmReceiving.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="mr-2 h-4 w-4" />
          )}
          Confirm Goods Receiving
        </Button>
      </div>
    </div>
  );

  return stage === "review" ? renderReview() : renderEntry();
}
