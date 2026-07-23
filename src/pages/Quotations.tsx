import { useMemo, useState } from "react";
import {
  CheckCircle2,
  FileEdit,
  FileText,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Send,
  Trash2,
  XCircle,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem as BaseSelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type QuotationRow = Database["public"]["Tables"]["quotations"]["Row"];
type QuotationLineRow = Database["public"]["Tables"]["quotation_lines"]["Row"];
type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];
type SiteRow = Database["public"]["Tables"]["project_sites"]["Row"];
type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type AreaRow = Database["public"]["Tables"]["project_areas"]["Row"];
type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type UomRow = Database["public"]["Tables"]["units_of_measure"]["Row"];
type ConversionRow = Database["public"]["Tables"]["product_uom_conversions"]["Row"];
type PriceBookRow = Database["public"]["Tables"]["price_books"]["Row"];
type PriceBookLineRow = Database["public"]["Tables"]["price_book_lines"]["Row"];
type AreaTypeRow = Database["public"]["Tables"]["project_area_types"]["Row"];

type Lookup = {
  customers: CustomerRow[];
  sites: SiteRow[];
  projects: ProjectRow[];
  areas: AreaRow[];
  products: ProductRow[];
  uoms: UomRow[];
  conversions: ConversionRow[];
  priceBooks: PriceBookRow[];
  priceBookLines: PriceBookLineRow[];
  areaTypes: AreaTypeRow[];
};

type PermissionMap = Record<string, boolean>;

type LineForm = {
  clientId: string;
  productId: string;
  projectAreaId: string;
  description: string;
  salesUomCode: string;
  baseUomCode: string;
  conversionFactor: string;
  quantity: string;
  unitPrice: string;
  discountPercent: string;
  taxRate: string;
  costPrice: string;
  notes: string;
  isOptional: boolean;
  allowFractionalQuantity: boolean;
};

type AreaForm = {
  areaName: string;
  areaType: string;
  estimatedQuantity: string;
  unitOfMeasure: string;
  notes: string;
};

type HeaderForm = {
  customerId: string;
  projectSiteId: string;
  priceBookId: string;
  quotationSegment: string;
  quotationSource: string;
  issueDate: string;
  validUntil: string;
  notes: string;
  internalNotes: string;
};

const emptyAreaForm = (): AreaForm => ({
  areaName: "",
  areaType: "",
  estimatedQuantity: "",
  unitOfMeasure: "sqm",
  notes: "",
});

const PERMISSIONS = [
  "quotations.view",
  "quotations.view_internal",
  "quotations.view_cost",
  "quotations.view_margin",
  "quotations.create",
  "quotations.update_draft",
  "quotations.send",
  "quotations.create_revision",
  "quotations.accept",
  "quotations.reject",
  "quotations.cancel",
  "quotations.soft_delete",
  "project_areas.create",
] as const;

const DISABLED_SITE_VALUE_PREFIX = "disabled-site:";
const ACTIVE_SITE_QUOTATION_MESSAGE = "This site already has an accepted quotation and is now active. To add a new area, products, or additional work, create the Project Area and process the change through a Variation.";

function SelectItem({ children, disabled, value, ...props }: React.ComponentProps<typeof BaseSelectItem>) {
  const isDisabledSite = value.startsWith(DISABLED_SITE_VALUE_PREFIX);

  if (!isDisabledSite) {
    return (
      <BaseSelectItem {...props} value={value} disabled={disabled}>
        {children}
      </BaseSelectItem>
    );
  }

  return (
    <>
      <BaseSelectItem {...props} value={value} disabled>
        {children}
      </BaseSelectItem>
      <div className="px-2 py-2 text-xs leading-relaxed text-amber-900">
        {ACTIVE_SITE_QUOTATION_MESSAGE}
      </div>
    </>
  );
}

const emptyHeader = (): HeaderForm => ({
  customerId: "",
  projectSiteId: "",
  priceBookId: "",
  quotationSegment: "Retail",
  quotationSource: "",
  issueDate: new Date().toISOString().slice(0, 10),
  validUntil: "",
  notes: "",
  internalNotes: "",
});

const createClientId = () => {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `quotation-line-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
};

const emptyLine = (): LineForm => ({
  clientId: createClientId(),
  productId: "",
  projectAreaId: "",
  description: "",
  salesUomCode: "",
  baseUomCode: "",
  conversionFactor: "1",
  quantity: "1",
  unitPrice: "0",
  discountPercent: "0",
  taxRate: "10",
  costPrice: "0",
  notes: "",
  isOptional: false,
  allowFractionalQuantity: true,
});

const money = (value: number | null | undefined) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(Number(value ?? 0));

const textOrDash = (value: string | null | undefined) => value?.trim() || "-";

const safeNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const statusClass = (status: string) => {
  const map: Record<string, string> = {
    Draft: "bg-slate-100 text-slate-700",
    Sent: "bg-blue-100 text-blue-700",
    Revised: "bg-amber-100 text-amber-800",
    Accepted: "bg-emerald-100 text-emerald-700",
    Rejected: "bg-rose-100 text-rose-700",
    Cancelled: "bg-zinc-200 text-zinc-700",
  };
  return map[status] ?? "bg-slate-100 text-slate-700";
};

export default function Quotations() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [header, setHeader] = useState<HeaderForm>(emptyHeader());
  const [lines, setLines] = useState<LineForm[]>([emptyLine()]);
  const [actionDialog, setActionDialog] = useState<{ type: string; quotation: QuotationRow } | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [acceptRequiredBy, setAcceptRequiredBy] = useState("");
  const [areaDialog, setAreaDialog] = useState<{ lineId: string } | null>(null);
  const [areaForm, setAreaForm] = useState<AreaForm>(emptyAreaForm());

  const permissionsQuery = useQuery({
    queryKey: ["quotation-permissions"],
    queryFn: async () => {
      const entries = await Promise.all(
        PERMISSIONS.map(async (code) => {
          const { data, error } = await supabase.rpc("has_permission", { p_permission_code: code });
          if (error) throw error;
          return [code, Boolean(data)] as const;
        }),
      );
      return Object.fromEntries(entries) as PermissionMap;
    },
  });
  const can = (code: string) => permissionsQuery.data?.[code] === true;

  const lookupQuery = useQuery({
    queryKey: ["quotation-lookups"],
    queryFn: async (): Promise<Lookup> => {
      const [customers, sites, projects, areas, products, uoms, conversions, priceBooks, priceBookLines, areaTypes] = await Promise.all([
        supabase.from("customers").select("*").eq("is_deleted", false).eq("is_active", true).order("customer_name"),
        supabase.from("project_sites").select("*").eq("is_deleted", false).eq("is_active", true).order("site_name"),
        supabase.from("projects").select("*").eq("is_deleted", false).eq("is_active", true).order("project_name"),
        supabase.from("project_areas").select("*").eq("is_deleted", false).eq("is_active", true).order("area_name"),
        supabase.from("products").select("*").eq("is_deleted", false).eq("is_active", true).order("product_name"),
        supabase.from("units_of_measure").select("*").eq("is_deleted", false).eq("is_active", true).order("sort_order"),
        supabase.from("product_uom_conversions").select("*").eq("is_deleted", false).eq("is_active", true),
        supabase.from("price_books").select("*").eq("is_deleted", false).eq("is_active", true).order("price_book_name"),
        supabase.from("price_book_lines").select("*").eq("is_deleted", false).eq("is_active", true),
        supabase.from("project_area_types").select("*").eq("is_deleted", false).eq("is_active", true).order("sort_order"),
      ]);
      for (const result of [customers, sites, projects, areas, products, uoms, conversions, priceBooks, priceBookLines, areaTypes]) {
        if (result.error) throw result.error;
      }
      return {
        customers: customers.data ?? [], sites: sites.data ?? [], projects: projects.data ?? [], areas: areas.data ?? [], products: products.data ?? [],
        uoms: uoms.data ?? [], conversions: conversions.data ?? [], priceBooks: priceBooks.data ?? [], priceBookLines: priceBookLines.data ?? [], areaTypes: areaTypes.data ?? [],
      };
    },
  });

  const listQuery = useQuery({
    queryKey: ["quotations", status],
    enabled: can("quotations.view"),
    queryFn: async () => {
      let query = supabase.from("quotations").select("*").eq("is_deleted", false).order("created_at", { ascending: false });
      if (status !== "all") query = query.eq("quotation_status", status);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const detailQuery = useQuery({
    queryKey: ["quotation-detail", selectedId],
    enabled: Boolean(selectedId),
    queryFn: async () => {
      if (!selectedId) throw new Error("Quotation not selected.");
      const [{ data: quotation, error: qError }, { data: detailLines, error: lError }, { data: revisions, error: rError }] = await Promise.all([
        supabase.from("quotations").select("*").eq("quotation_id", selectedId).single(),
        supabase.from("quotation_lines").select("*").eq("quotation_id", selectedId).eq("is_deleted", false).order("line_no"),
        (supabase as any).from("quotation_revisions").select("*").eq("quotation_id", selectedId).eq("is_deleted", false).order("revision_no", { ascending: false }),
      ]);
      if (qError) throw qError;
      if (lError) throw lError;
      if (rError) throw rError;
      return { quotation, lines: detailLines ?? [], revisions: revisions ?? [] };
    },
  });

  const customerById = useMemo(() => new Map((lookupQuery.data?.customers ?? []).map((customer) => [customer.customer_id, customer])), [lookupQuery.data?.customers]);
  const siteById = useMemo(() => new Map((lookupQuery.data?.sites ?? []).map((site) => [site.site_id, site])), [lookupQuery.data?.sites]);
  const projectById = useMemo(() => new Map((lookupQuery.data?.projects ?? []).map((project) => [project.project_id, project])), [lookupQuery.data?.projects]);
  const getQuotationContext = (quotation: QuotationRow) => {
    const customer = customerById.get(quotation.customer_id);
    const site = quotation.project_site_id ? siteById.get(quotation.project_site_id) : undefined;
    const project = site ? projectById.get(site.project_id) : undefined;
    return { customer, site, project };
  };
  const filteredQuotations = useMemo(() => {
    const rows = listQuery.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((quotation) => {
      const { customer, site, project } = getQuotationContext(quotation);
      return [
        quotation.quotation_no,
        customer?.customer_code,
        customer?.customer_name,
        project?.project_no,
        project?.project_name,
        site?.site_code,
        site?.site_name,
      ].some((value) => value?.toLowerCase().includes(term));
    });
  }, [listQuery.data, search, customerById, siteById, projectById]);

  const filteredSites = useMemo(() => {
    const customer = lookupQuery.data?.customers.find((x) => x.customer_id === header.customerId);
    if (!customer) return [];
    const projectIds = new Set((lookupQuery.data?.projects ?? []).filter((project) => project.customer_id === customer.customer_id).map((project) => project.project_id));
    return (lookupQuery.data?.sites ?? [])
      .filter((site) => projectIds.has(site.project_id))
      .map((site) => site.site_status === "Active"
        ? {
          ...site,
          site_id: `${DISABLED_SITE_VALUE_PREFIX}${site.site_id}`,
          site_name: `${site.site_name} — Active — Use Variation`,
        }
        : site);
  }, [lookupQuery.data, header.customerId]);

  const selectedSite = lookupQuery.data?.sites.find((site) => site.site_id === header.projectSiteId);

  const areasForSite = (siteId: string) => (lookupQuery.data?.areas ?? []).filter((x) => x.site_id === siteId && x.area_status === "Quotation");

  const resetEditor = () => {
    setEditingId(null);
    setHeader(emptyHeader());
    setLines([emptyLine()]);
  };

  const openCreate = () => {
    resetEditor();
    setEditorOpen(true);
  };

  const openEdit = async (quotation: QuotationRow) => {
    const { data: existingLines, error } = await supabase.from("quotation_lines").select("*").eq("quotation_id", quotation.quotation_id).eq("is_deleted", false).order("line_no");
    if (error) return toast.error(error.message);
    setEditingId(quotation.quotation_id);
    setHeader({
      customerId: quotation.customer_id,
      projectSiteId: quotation.project_site_id ?? "",
      priceBookId: quotation.price_book_id ?? "",
      quotationSegment: quotation.quotation_segment,
      quotationSource: quotation.quotation_source ?? "",
      issueDate: quotation.issue_date ?? "",
      validUntil: quotation.valid_until ?? "",
      notes: quotation.notes ?? "",
      internalNotes: quotation.internal_notes ?? "",
    });
    setLines((existingLines ?? []).map((line) => ({
      clientId: line.quotation_line_id,
      productId: line.product_id ?? "",
      projectAreaId: line.project_area_id ?? "",
      description: line.description,
      salesUomCode: line.sales_uom_code ?? line.unit_of_measure,
      baseUomCode: line.base_uom_code ?? "",
      conversionFactor: String(line.conversion_factor ?? 1),
      quantity: String(line.quantity),
      unitPrice: String(line.unit_price),
      discountPercent: String(line.discount_percent),
      taxRate: String(line.tax_rate),
      costPrice: String(line.cost_price ?? 0),
      notes: line.notes ?? "",
      isOptional: line.is_optional,
      allowFractionalQuantity: line.allow_fractional_quantity,
    })));
    setEditorOpen(true);
  };

  const updateLine = (id: string, patch: Partial<LineForm>) => setLines((current) => current.map((line) => line.clientId === id ? { ...line, ...patch } : line));

  const findConversion = (
    productId: string,
    salesUomCode: string,
    baseUomCode: string,
  ) => {
    if (!salesUomCode || !baseUomCode) return undefined;
    if (salesUomCode === baseUomCode) return undefined;

    return lookupQuery.data?.conversions.find(
      (conversion) =>
        conversion.product_id === productId &&
        conversion.from_uom_code === salesUomCode &&
        conversion.to_uom_code === baseUomCode &&
        conversion.is_active &&
        !conversion.is_deleted,
    );
  };

  const resolveLineUom = (line: LineForm) => {
    const product = lookupQuery.data?.products.find(
      (item) => item.product_id === line.productId,
    );

    const baseUomCode =
      line.baseUomCode ||
      product?.base_uom_code ||
      "";

    const salesUomCode =
      line.salesUomCode ||
      product?.default_sales_uom_code ||
      baseUomCode;

    const conversion = findConversion(
      line.productId,
      salesUomCode,
      baseUomCode,
    );

    const conversionFactor =
      salesUomCode === baseUomCode
        ? 1
        : Number(conversion?.conversion_factor ?? line.conversionFactor);

    return {
      salesUomCode,
      baseUomCode,
      conversionFactor,
      allowFractionalQuantity:
        conversion?.allow_fractional_quantity ??
        line.allowFractionalQuantity,
    };
  };

  const chooseProduct = (lineId: string, productId: string) => {
    const product = lookupQuery.data?.products.find(
      (item) => item.product_id === productId,
    );

    if (!product) return;

    const baseUomCode = product.base_uom_code ?? "";
    const salesUomCode =
      product.default_sales_uom_code ??
      baseUomCode;

    const conversion = findConversion(
      productId,
      salesUomCode,
      baseUomCode,
    );

    const price = lookupQuery.data?.priceBookLines.find(
      (item) =>
        item.product_id === productId &&
        item.price_book_id === header.priceBookId,
    );

    updateLine(lineId, {
      productId,
      description:
        product.description?.trim() ||
        product.product_name,
      salesUomCode,
      baseUomCode,
      conversionFactor: String(
        salesUomCode === baseUomCode
          ? 1
          : conversion?.conversion_factor ?? 0,
      ),
      unitPrice: String(price?.unit_price ?? 0),
      allowFractionalQuantity:
        conversion?.allow_fractional_quantity ?? true,
    });
  };

  const chooseSalesUom = (line: LineForm, salesUomCode: string) => {
    const product = lookupQuery.data?.products.find(
      (item) => item.product_id === line.productId,
    );

    const baseUomCode =
      line.baseUomCode ||
      product?.base_uom_code ||
      "";

    const conversion = findConversion(
      line.productId,
      salesUomCode,
      baseUomCode,
    );

    updateLine(line.clientId, {
      salesUomCode,
      baseUomCode,
      conversionFactor: String(
        salesUomCode === baseUomCode
          ? 1
          : conversion?.conversion_factor ?? 0,
      ),
      allowFractionalQuantity:
        conversion?.allow_fractional_quantity ??
        line.allowFractionalQuantity,
    });
  };

  const buildPayloadLines = () =>
    lines.map((line, index) => {
      const resolvedUom = resolveLineUom(line);
      const quantity = safeNumber(line.quantity);
      const conversionFactor = resolvedUom.conversionFactor;

      return {
        line_no: index + 1,
        product_id: line.productId || null,
        project_area_id: line.projectAreaId || null,
        description: line.description.trim(),
        sales_uom_code: resolvedUom.salesUomCode,
        unit_of_measure: resolvedUom.salesUomCode,
        base_uom_code: resolvedUom.baseUomCode,
        conversion_factor: conversionFactor,
        base_quantity: quantity * conversionFactor,
        quantity,
        unit_price: safeNumber(line.unitPrice),
        discount_percent: safeNumber(line.discountPercent),
        tax_rate: safeNumber(line.taxRate),
        cost_price: can("quotations.view_cost")
          ? safeNumber(line.costPrice)
          : 0,
        notes: line.notes.trim() || null,
        is_optional: line.isOptional,
        allow_fractional_quantity:
          resolvedUom.allowFractionalQuantity,
      };
    });

  const payloadLines = (): Json => buildPayloadLines() as Json;

  const validateEditor = () => {
    if (!header.customerId) {
      throw new Error("Please select a customer.");
    }

    if (!header.projectSiteId) {
      throw new Error("Please select a project site.");
    }

    if (selectedSite?.site_status !== "Quotation") {
      throw new Error("Please select a project site with Quotation status.");
    }

    if (!header.issueDate) {
      throw new Error("Please enter the issue date.");
    }

    if (!lines.length) {
      throw new Error("Add at least one quotation line.");
    }

    lines.forEach((line, index) => {
      const resolvedUom = resolveLineUom(line);

      if (!line.description.trim()) {
        throw new Error(
          `Line ${index + 1}: description is required.`,
        );
      }

      if (safeNumber(line.quantity) <= 0) {
        throw new Error(
          `Line ${index + 1}: quantity must be greater than zero.`,
        );
      }

      if (!resolvedUom.salesUomCode) {
        throw new Error(
          `Line ${index + 1}: Sales UOM is required.`,
        );
      }

      if (!resolvedUom.baseUomCode) {
        throw new Error(
          `Line ${index + 1}: Product Base UOM is missing.`,
        );
      }

      if (
        resolvedUom.salesUomCode !== resolvedUom.baseUomCode &&
        (!Number.isFinite(resolvedUom.conversionFactor) ||
          resolvedUom.conversionFactor <= 0)
      ) {
        throw new Error(
          `Line ${index + 1}: No active conversion exists from ` +
            `${resolvedUom.salesUomCode} to ${resolvedUom.baseUomCode}.`,
        );
      }
    });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      validateEditor();
      const p_quotation = {
        customer_id: header.customerId,
        project_site_id: header.projectSiteId,
        price_book_id: header.priceBookId || null,
        quotation_segment: header.quotationSegment.trim() || "Retail",
        quotation_source: header.quotationSource.trim() || null,
        issue_date: header.issueDate,
        valid_until: header.validUntil || null,
        notes: header.notes.trim() || null,
        internal_notes: header.internalNotes.trim() || null,
      } as Json;
      const result = editingId
        ? await (supabase as any).rpc("update_draft_quotation_atomic", { p_quotation_id: editingId, p_quotation, p_lines: payloadLines() })
        : await (supabase as any).rpc("create_quotation_atomic", { p_quotation, p_lines: payloadLines() });
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      toast.success(editingId ? "Draft quotation updated." : "Quotation created.");
      setEditorOpen(false);
      resetEditor();
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const createAreaMutation = useMutation({
    mutationFn: async () => {
      if (!areaDialog) throw new Error("No quotation line selected.");
      if (!header.projectSiteId) throw new Error("Please select a Project Site first.");
      if (selectedSite?.site_status !== "Quotation") throw new Error("Areas added from a base quotation must belong to a Site with Quotation status.");
      if (!areaForm.areaName.trim()) throw new Error("Area Name is required.");

      const estimatedQuantity = areaForm.estimatedQuantity.trim()
        ? Number(areaForm.estimatedQuantity)
        : null;

      if (estimatedQuantity !== null && (!Number.isFinite(estimatedQuantity) || estimatedQuantity < 0)) {
        throw new Error("Estimated Quantity must be zero or greater.");
      }

      const result = await supabase.rpc(
        "create_project_area_atomic" as never,
        {
          p_site_id: header.projectSiteId,
          p_area_name: areaForm.areaName.trim(),
          p_area_type: areaForm.areaType || null,
          p_estimated_quantity: estimatedQuantity,
          p_unit_of_measure: areaForm.unitOfMeasure || "sqm",
          p_notes: areaForm.notes.trim() || null,
        } as never,
      );

      if (result.error) throw result.error;

      const payload = result.data as unknown as {
        area_id?: string;
        area_code?: string;
        area_name?: string;
        required_commercial_workflow?: string;
      };

      if (!payload?.area_id) throw new Error("The server did not return the new Project Area ID.");
      return payload;
    },
    onSuccess: async (createdArea) => {
      const lineId = areaDialog?.lineId;
      await queryClient.invalidateQueries({ queryKey: ["quotation-lookups"] });
      if (lineId) updateLine(lineId, { projectAreaId: createdArea.area_id ?? "" });
      setAreaDialog(null);
      setAreaForm(emptyAreaForm());
      toast.success(`${createdArea.area_code ?? "Project Area"} created and selected.`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const workflowMutation = useMutation({
    mutationFn: async () => {
      if (!actionDialog) throw new Error("No action selected.");
      const quotation = actionDialog.quotation;
      let result;
      if (actionDialog.type === "send") result = await (supabase as any).rpc("send_quotation_atomic", { p_quotation_id: quotation.quotation_id });
      else if (actionDialog.type === "accept") result = await (supabase as any).rpc("accept_quotation_atomic", { p_quotation_id: quotation.quotation_id, p_required_by_date: acceptRequiredBy || undefined });
      else if (actionDialog.type === "reject") result = await (supabase as any).rpc("reject_quotation_atomic", { p_quotation_id: quotation.quotation_id, p_rejection_reason: actionReason.trim() });
      else if (actionDialog.type === "cancel") result = await (supabase as any).rpc("cancel_quotation_atomic", { p_quotation_id: quotation.quotation_id, p_cancellation_reason: actionReason.trim() });
      else if (actionDialog.type === "delete") result = await (supabase as any).rpc("soft_delete_quotation_atomic", { p_quotation_id: quotation.quotation_id });
      else if (actionDialog.type === "revision") result = await (supabase as any).rpc("create_quotation_revision_atomic", { p_quotation_id: quotation.quotation_id, p_revision_reason: actionReason.trim() || undefined });
      else throw new Error("Unsupported action.");
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      toast.success("Quotation action completed.");
      setActionDialog(null); setActionReason(""); setAcceptRequiredBy("");
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotation-detail"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const linePreview = (line: LineForm) => {
    const qty = safeNumber(line.quantity); const unit = safeNumber(line.unitPrice); const discount = safeNumber(line.discountPercent); const tax = safeNumber(line.taxRate);
    const subtotal = qty * unit; const discounted = subtotal - subtotal * discount / 100; return discounted + discounted * tax / 100;
  };

  if (permissionsQuery.isLoading) return <PageState icon={<Loader2 className="h-7 w-7 animate-spin" />} title="Checking quotation permissions..." />;
  if (!can("quotations.view")) return <PageState icon={<FileText className="h-7 w-7" />} title="You do not have permission to view quotations." />;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div><h1 className="flex items-center gap-3 text-2xl font-bold text-slate-900 md:text-3xl"><FileText className="h-8 w-8 text-[#9E4B4B]" />Quotations</h1><p className="mt-1 text-sm text-slate-500">Create, revise, send and accept customer quotations.</p></div>
        <div className="flex gap-2"><Button variant="outline" onClick={() => listQuery.refetch()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>{can("quotations.create") && <Button onClick={openCreate} className="bg-[#9E4B4B] text-white hover:bg-[#843e3e]"><Plus className="mr-2 h-4 w-4" />New Quotation</Button>}</div>
      </div>

      <div className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-[1fr_220px]">
        <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search quotation, customer, project or site..." className="bg-[#F7F9FB] pl-9" /></div>
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="bg-[#F7F9FB]"><SelectValue /></SelectTrigger><SelectContent>{["all", "Draft", "Sent", "Revised", "Accepted", "Rejected", "Cancelled"].map((x) => <SelectItem key={x} value={x}>{x === "all" ? "All statuses" : x}</SelectItem>)}</SelectContent></Select>
      </div>

      {listQuery.isLoading ? <PageState icon={<Loader2 className="h-7 w-7 animate-spin" />} title="Loading quotations..." /> : listQuery.isError ? <PageState icon={<XCircle className="h-7 w-7" />} title={(listQuery.error as Error).message} /> : !filteredQuotations.length ? <PageState icon={<FileText className="h-7 w-7" />} title="No quotations found." /> : <>
        <div className="hidden overflow-hidden rounded-2xl border bg-white md:block"><table className="w-full text-sm"><thead className="bg-[#FBF1F1] text-left text-xs uppercase text-slate-600"><tr><th className="px-4 py-3">Quotation</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Project / Site</th><th className="px-4 py-3">Issue date</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody>{filteredQuotations.map((q) => { const { customer, site, project } = getQuotationContext(q); return <tr key={q.quotation_id} className="border-t hover:bg-slate-50"><td className="px-4 py-4"><button onClick={() => setSelectedId(q.quotation_id)} className="font-semibold text-[#9E4B4B] hover:underline">{q.quotation_no}</button><div className="text-xs text-slate-500">Revision {q.revision_no}</div></td><td className="px-4 py-4"><div className="font-medium">{textOrDash(customer?.customer_code)}</div><div className="text-xs text-slate-500">{textOrDash(customer?.customer_name)}</div></td><td className="px-4 py-4"><div className="font-medium">{project ? `${project.project_no} — ${project.project_name}` : "-"}</div><div className="text-xs text-slate-500">{site ? `${site.site_code} — ${site.site_name}` : "-"}</div></td><td className="px-4 py-4">{q.issue_date || "-"}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(q.quotation_status)}`}>{q.quotation_status}</span></td><td className="px-4 py-4 text-right font-semibold">{money(q.total_amount)}</td><td className="px-4 py-4"><RowActions quotation={q} can={can} onView={() => setSelectedId(q.quotation_id)} onEdit={openEdit} onAction={(type) => setActionDialog({ type, quotation: q })} /></td></tr>; })}</tbody></table></div>
        <div className="space-y-3 md:hidden">{filteredQuotations.map((q) => { const { customer, site, project } = getQuotationContext(q); return <div key={q.quotation_id} className="rounded-2xl border bg-white p-4"><div className="flex items-start justify-between gap-3"><div><button onClick={() => setSelectedId(q.quotation_id)} className="font-bold text-[#9E4B4B]">{q.quotation_no}</button><div className="text-xs text-slate-500">Revision {q.revision_no}</div></div><span className={`rounded-full px-2 py-1 text-xs ${statusClass(q.quotation_status)}`}>{q.quotation_status}</span></div><div className="mt-3 space-y-2 text-sm"><div><span className="text-slate-500">Customer</span><div className="font-medium">{textOrDash(customer?.customer_name)}</div></div><div><span className="text-slate-500">Project</span><div className="font-medium">{project ? `${project.project_no} — ${project.project_name}` : "-"}</div></div><div><span className="text-slate-500">Site</span><div className="font-medium">{site ? `${site.site_code} — ${site.site_name}` : "-"}</div></div></div><div className="mt-3 grid grid-cols-2 gap-2 text-sm"><div><span className="text-slate-500">Issue date</span><div>{q.issue_date || "-"}</div></div><div className="text-right"><span className="text-slate-500">Total</span><div className="font-semibold">{money(q.total_amount)}</div></div></div><div className="mt-3 border-t pt-3"><RowActions quotation={q} can={can} onView={() => setSelectedId(q.quotation_id)} onEdit={openEdit} onAction={(type) => setActionDialog({ type, quotation: q })} /></div></div>; })}</div>
      </>}

      <Dialog open={editorOpen} onOpenChange={(open) => { setEditorOpen(open); if (!open) resetEditor(); }}><DialogContent className="max-h-[94vh] max-w-6xl overflow-y-auto"><DialogHeader><DialogTitle>{editingId ? "Edit Draft Quotation" : "New Quotation"}</DialogTitle></DialogHeader><div className="space-y-6">
        <Section number="1" title="Quotation context"><div className="grid gap-4 md:grid-cols-2"><Field label="Customer *"><Select value={header.customerId} onValueChange={(value) => { const customer = lookupQuery.data?.customers.find((x) => x.customer_id === value); setHeader((x) => ({ ...x, customerId: value, projectSiteId: "", priceBookId: customer?.price_book_id ?? "" })); }}><SelectTrigger className="bg-[#F7F9FB]"><SelectValue placeholder="Select customer" /></SelectTrigger><SelectContent>{lookupQuery.data?.customers.map((x) => <SelectItem key={x.customer_id} value={x.customer_id}>{x.customer_code} — {x.customer_name}</SelectItem>)}</SelectContent></Select></Field><Field label="Project site *"><Select value={header.projectSiteId} onValueChange={(value) => setHeader((x) => ({ ...x, projectSiteId: value }))}><SelectTrigger className="bg-[#F7F9FB]"><SelectValue placeholder="Select project site" /></SelectTrigger><SelectContent>{filteredSites.map((x) => <SelectItem key={x.site_id} value={x.site_id}>{x.site_code} — {x.site_name}</SelectItem>)}</SelectContent></Select></Field><Field label="Price book"><Select value={header.priceBookId || "none"} onValueChange={(value) => setHeader((x) => ({ ...x, priceBookId: value === "none" ? "" : value }))}><SelectTrigger className="bg-[#F7F9FB]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">No price book</SelectItem>{lookupQuery.data?.priceBooks.map((x) => <SelectItem key={x.price_book_id} value={x.price_book_id}>{x.price_book_code} — {x.price_book_name}</SelectItem>)}</SelectContent></Select></Field><Field label="Segment"><Input value={header.quotationSegment} onChange={(e) => setHeader((x) => ({ ...x, quotationSegment: e.target.value }))} className="bg-[#F7F9FB]" /></Field><Field label="Issue date *"><Input type="date" value={header.issueDate} onChange={(e) => setHeader((x) => ({ ...x, issueDate: e.target.value }))} className="bg-[#F7F9FB]" /></Field><Field label="Valid until"><Input type="date" value={header.validUntil} onChange={(e) => setHeader((x) => ({ ...x, validUntil: e.target.value }))} className="bg-[#F7F9FB]" /></Field><Field label="Source"><Input value={header.quotationSource} onChange={(e) => setHeader((x) => ({ ...x, quotationSource: e.target.value }))} className="bg-[#F7F9FB]" /></Field></div></Section>
        <Section number="2" title="Quotation lines"><div className="space-y-4">{lines.map((line, index) => <div key={line.clientId} className="rounded-xl border p-4"><div className="mb-4 flex items-center justify-between"><strong>Line {index + 1}</strong>{lines.length > 1 && <Button type="button" size="sm" variant="ghost" title="Remove Quotation Line" aria-label="Remove Quotation Line" onClick={() => setLines((x) => x.filter((v) => v.clientId !== line.clientId))}><Trash2 className="h-4 w-4" /></Button>}</div><div className="grid gap-4 md:grid-cols-3"><Field label="Product"><Select value={line.productId || "none"} onValueChange={(value) => value === "none" ? updateLine(line.clientId, { productId: "" }) : chooseProduct(line.clientId, value)}><SelectTrigger className="bg-[#F7F9FB]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Manual line</SelectItem>{lookupQuery.data?.products.map((x) => <SelectItem key={x.product_id} value={x.product_id}>{x.product_code} — {x.product_name}</SelectItem>)}</SelectContent></Select></Field><Field label="Project area"><div className="flex gap-2"><Select value={line.projectAreaId || "none"} onValueChange={(value) => updateLine(line.clientId, { projectAreaId: value === "none" ? "" : value })}><SelectTrigger className="min-w-0 flex-1 bg-[#F7F9FB]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">No area</SelectItem>{areasForSite(header.projectSiteId).map((x) => <SelectItem key={x.area_id} value={x.area_id}>{x.area_code} — {x.area_name}</SelectItem>)}</SelectContent></Select>{can("project_areas.create") && <Button type="button" variant="outline" size="icon" title="Add Project Area" aria-label="Add Project Area" disabled={!header.projectSiteId || selectedSite?.site_status !== "Quotation"} onClick={() => { setAreaForm(emptyAreaForm()); setAreaDialog({ lineId: line.clientId }); }}><Plus className="h-4 w-4" /></Button>}</div>{header.projectSiteId && !areasForSite(header.projectSiteId).length && <p className="text-xs text-slate-500">No provisional areas are available for this Site.</p>}</Field><Field label="Sales UOM *"><Select value={line.salesUomCode} onValueChange={(value) => chooseSalesUom(line, value)}><SelectTrigger className="bg-[#F7F9FB]"><SelectValue /></SelectTrigger><SelectContent>{lookupQuery.data?.uoms.map((x) => <SelectItem key={x.uom_code} value={x.uom_code}>{x.uom_code} — {x.uom_name}</SelectItem>)}</SelectContent></Select></Field><Field label="Quantity *"><Input type="number" min="0" step="any" value={line.quantity} onChange={(e) => updateLine(line.clientId, { quantity: e.target.value })} className="bg-[#F7F9FB]" /></Field><Field label="Unit price"><Input type="number" min="0" step="any" value={line.unitPrice} onChange={(e) => updateLine(line.clientId, { unitPrice: e.target.value })} className="bg-[#F7F9FB]" /></Field><Field label="Discount %"><Input type="number" min="0" max="100" value={line.discountPercent} onChange={(e) => updateLine(line.clientId, { discountPercent: e.target.value })} className="bg-[#F7F9FB]" /></Field><Field label="Tax %"><Input type="number" min="0" value={line.taxRate} onChange={(e) => updateLine(line.clientId, { taxRate: e.target.value })} className="bg-[#F7F9FB]" /></Field>{can("quotations.view_cost") && <Field label="Cost price"><Input type="number" min="0" value={line.costPrice} onChange={(e) => updateLine(line.clientId, { costPrice: e.target.value })} className="bg-[#F7F9FB]" /></Field>}<Field label="Preview total"><Input readOnly value={money(linePreview(line))} /></Field><div className="md:col-span-3"><Field label="Description *"><Textarea value={line.description} onChange={(e) => updateLine(line.clientId, { description: e.target.value })} className="bg-[#F7F9FB]" /></Field></div></div></div>)}<Button type="button" variant="outline" onClick={() => setLines((x) => [...x, emptyLine()])}><Plus className="mr-2 h-4 w-4" />Add line</Button></div></Section>
        <Section number="3" title="Notes"><div className="grid gap-4 md:grid-cols-2"><Field label="Customer notes"><Textarea value={header.notes} onChange={(e) => setHeader((x) => ({ ...x, notes: e.target.value }))} className="bg-[#F7F9FB]" /></Field>{can("quotations.view_internal") && <Field label="Internal notes"><Textarea value={header.internalNotes} onChange={(e) => setHeader((x) => ({ ...x, internalNotes: e.target.value }))} className="bg-[#F7F9FB]" /></Field>}</div></Section>
        <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-white py-4"><Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button><Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-[#9E4B4B] text-white hover:bg-[#843e3e]">{saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Draft</Button></div>
      </div></DialogContent></Dialog>


      <Dialog open={Boolean(areaDialog)} onOpenChange={(open) => { if (!open && !createAreaMutation.isPending) { setAreaDialog(null); setAreaForm(emptyAreaForm()); } }}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Add Project Area</DialogTitle></DialogHeader><div className="space-y-5"><div className="rounded-xl border border-[#B98A8A] bg-[#FBF1F1] p-4 text-sm"><div className="font-semibold text-slate-900">{selectedSite?.site_code} — {selectedSite?.site_name}</div><div className="mt-1 text-slate-600">The new Area will start with Quotation status and will be selected on the quotation line.</div></div><div className="grid gap-4 md:grid-cols-2"><Field label="Area name *"><Input value={areaForm.areaName} onChange={(e) => setAreaForm((current) => ({ ...current, areaName: e.target.value }))} className="bg-[#F7F9FB]" autoFocus /></Field><Field label="Area type"><Select value={areaForm.areaType || "none"} onValueChange={(value) => setAreaForm((current) => ({ ...current, areaType: value === "none" ? "" : value }))}><SelectTrigger className="bg-[#F7F9FB]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Not specified</SelectItem>{lookupQuery.data?.areaTypes.map((item) => <SelectItem key={item.area_type_id} value={item.area_type_name}>{item.area_type_code} — {item.area_type_name}</SelectItem>)}</SelectContent></Select></Field><Field label="Estimated quantity"><Input type="number" min="0" step="any" value={areaForm.estimatedQuantity} onChange={(e) => setAreaForm((current) => ({ ...current, estimatedQuantity: e.target.value }))} className="bg-[#F7F9FB]" /></Field><Field label="Unit of measure"><Select value={areaForm.unitOfMeasure} onValueChange={(value) => setAreaForm((current) => ({ ...current, unitOfMeasure: value }))}><SelectTrigger className="bg-[#F7F9FB]"><SelectValue /></SelectTrigger><SelectContent>{lookupQuery.data?.uoms.map((item) => <SelectItem key={item.uom_code} value={item.uom_code}>{item.uom_code} — {item.uom_name}</SelectItem>)}</SelectContent></Select></Field><div className="md:col-span-2"><Field label="Notes"><Textarea value={areaForm.notes} onChange={(e) => setAreaForm((current) => ({ ...current, notes: e.target.value }))} className="bg-[#F7F9FB]" /></Field></div></div><div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={createAreaMutation.isPending} onClick={() => { setAreaDialog(null); setAreaForm(emptyAreaForm()); }}>Cancel</Button><Button type="button" disabled={createAreaMutation.isPending || !areaForm.areaName.trim()} onClick={() => createAreaMutation.mutate()} className="bg-[#9E4B4B] text-white hover:bg-[#843e3e]">{createAreaMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Area</Button></div></div></DialogContent></Dialog>

      <Dialog open={Boolean(selectedId)} onOpenChange={(open) => !open && setSelectedId(null)}><DialogContent className="max-h-[94vh] max-w-5xl overflow-y-auto"><DialogHeader><DialogTitle>Quotation Details</DialogTitle></DialogHeader>{detailQuery.isLoading ? <PageState icon={<Loader2 className="h-6 w-6 animate-spin" />} title="Loading quotation..." /> : detailQuery.data && <div className="space-y-5"><div className="rounded-xl bg-[#FBF1F1] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-xl font-bold">{detailQuery.data.quotation.quotation_no}</div><div className="text-sm text-slate-500">Revision {detailQuery.data.quotation.revision_no}</div></div><span className={`rounded-full px-3 py-1 text-sm ${statusClass(detailQuery.data.quotation.quotation_status)}`}>{detailQuery.data.quotation.quotation_status}</span></div></div><div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[760px] text-sm"><thead className="bg-slate-50"><tr><th className="px-3 py-2 text-left">Line</th><th className="px-3 py-2 text-left">Description</th><th className="px-3 py-2 text-right">Qty</th><th className="px-3 py-2 text-left">UOM</th><th className="px-3 py-2 text-right">Price</th><th className="px-3 py-2 text-right">Total</th></tr></thead><tbody>{detailQuery.data.lines.map((line) => <tr key={line.quotation_line_id} className="border-t"><td className="px-3 py-3">{line.line_no}</td><td className="px-3 py-3">{line.description}</td><td className="px-3 py-3 text-right">{line.quantity}</td><td className="px-3 py-3">{line.sales_uom_code || line.unit_of_measure}</td><td className="px-3 py-3 text-right">{money(line.unit_price)}</td><td className="px-3 py-3 text-right font-medium">{money(line.line_total)}</td></tr>)}</tbody></table></div><div className="flex justify-end"><div className="w-full max-w-sm space-y-2 rounded-xl border p-4"><div className="flex justify-between"><span>Subtotal</span><strong>{money(detailQuery.data.quotation.subtotal_amount)}</strong></div><div className="flex justify-between"><span>Tax</span><strong>{money(detailQuery.data.quotation.tax_amount)}</strong></div><div className="flex justify-between border-t pt-2 text-lg"><span>Total</span><strong>{money(detailQuery.data.quotation.total_amount)}</strong></div></div></div></div>}</DialogContent></Dialog>

      <Dialog open={Boolean(actionDialog)} onOpenChange={(open) => !open && setActionDialog(null)}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{actionDialog?.type ? `${actionDialog.type[0].toUpperCase()}${actionDialog.type.slice(1)} Quotation` : "Quotation Action"}</DialogTitle></DialogHeader><div className="space-y-4">{["reject", "cancel", "revision"].includes(actionDialog?.type ?? "") && <Field label="Reason"><Textarea value={actionReason} onChange={(e) => setActionReason(e.target.value)} className="bg-[#F7F9FB]" /></Field>}{actionDialog?.type === "accept" && <Field label="Required by date"><Input type="date" value={acceptRequiredBy} onChange={(e) => setAcceptRequiredBy(e.target.value)} className="bg-[#F7F9FB]" /></Field>}<p className="text-sm text-slate-500">This action is processed by the server workflow and cannot bypass backend validation.</p><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setActionDialog(null)}>Back</Button><Button onClick={() => workflowMutation.mutate()} disabled={workflowMutation.isPending} className="bg-[#9E4B4B] text-white hover:bg-[#843e3e]">Confirm</Button></div></div></DialogContent></Dialog>
    </div>
  );
}

function RowActions({ quotation, can, onView, onEdit, onAction }: { quotation: QuotationRow; can: (code: string) => boolean; onView: () => void; onEdit: (q: QuotationRow) => void; onAction: (type: string) => void }) {
  return <div className="flex flex-wrap justify-end gap-1"><Button type="button" size="sm" variant="outline" title="View Quotation" aria-label="View Quotation" onClick={onView}><FileText className="h-4 w-4" /></Button>{quotation.quotation_status === "Draft" && can("quotations.update_draft") && <Button type="button" size="sm" variant="outline" title="Edit Quotation" aria-label="Edit Quotation" onClick={() => onEdit(quotation)}><FileEdit className="h-4 w-4" /></Button>}{quotation.quotation_status === "Draft" && can("quotations.send") && <Button type="button" size="sm" variant="outline" title="Send Quotation" aria-label="Send Quotation" onClick={() => onAction("send")}><Send className="h-4 w-4" /></Button>}{["Sent", "Revised"].includes(quotation.quotation_status) && can("quotations.accept") && <Button type="button" size="sm" variant="outline" title="Accept Quotation" aria-label="Accept Quotation" onClick={() => onAction("accept")}><CheckCircle2 className="h-4 w-4" /></Button>}{["Sent", "Revised"].includes(quotation.quotation_status) && can("quotations.reject") && <Button type="button" size="sm" variant="outline" title="Reject Quotation" aria-label="Reject Quotation" onClick={() => onAction("reject")}><XCircle className="h-4 w-4" /></Button>}{["Sent", "Revised"].includes(quotation.quotation_status) && can("quotations.create_revision") && <Button type="button" size="sm" variant="outline" title="Create Revision" aria-label="Create Revision" onClick={() => onAction("revision")}><MoreHorizontal className="h-4 w-4" /></Button>}{!["Accepted", "Rejected", "Cancelled"].includes(quotation.quotation_status) && can("quotations.cancel") && <Button type="button" size="sm" variant="outline" title="Cancel Quotation" aria-label="Cancel Quotation" onClick={() => onAction("cancel")}><XCircle className="h-4 w-4" /></Button>}{quotation.quotation_status === "Draft" && can("quotations.soft_delete") && <Button type="button" size="sm" variant="outline" title="Delete Quotation" aria-label="Delete Quotation" onClick={() => onAction("delete")}><Trash2 className="h-4 w-4" /></Button>}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) { return <section className="rounded-2xl border bg-white p-4 md:p-5"><div className="mb-4 flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#9E4B4B] text-sm font-bold text-white">{number}</span><h2 className="font-semibold text-slate-900">{title}</h2></div>{children}</section>; }
function PageState({ icon, title }: { icon: React.ReactNode; title: string }) { return <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-2xl border bg-white p-8 text-center text-slate-500">{icon}<p>{title}</p></div>; }
