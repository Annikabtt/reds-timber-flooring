import { useCallback, useMemo, useState } from "react";
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
  SelectItem as BaseSelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type QuotationRow = Database["public"]["Tables"]["quotations"]["Row"];
type QuotationLineRow = Database["public"]["Tables"]["quotation_lines"]["Row"];
type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];
type SiteRow = Database["public"]["Tables"]["project_sites"]["Row"];
type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type AreaRow = Database["public"]["Tables"]["project_areas"]["Row"];
type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type UomRow = Database["public"]["Tables"]["units_of_measure"]["Row"];
type ProductUnitRow =
  Database["public"]["Tables"]["product_units"]["Row"];
type PriceBookRow = Database["public"]["Tables"]["price_books"]["Row"];
type PriceBookLineRow = Database["public"]["Tables"]["price_book_lines"]["Row"];
type AreaTypeRow = Database["public"]["Tables"]["project_area_types"]["Row"];
type QuotationBillingUnitRow =
  Database["public"]["Tables"]["quotation_billing_units"]["Row"];
type QuotationBillingAllocationRow =
  Database["public"]["Tables"]["quotation_line_billing_allocations"]["Row"];

type Lookup = {
  customers: CustomerRow[];
  sites: SiteRow[];
  projects: ProjectRow[];
  areas: AreaRow[];
  products: ProductRow[];
  uoms: UomRow[];
  productUnits: ProductUnitRow[];
  priceBooks: PriceBookRow[];
  areaTypes: AreaTypeRow[];
};

type PermissionMap = Record<string, boolean>;

type BillingMethod = "Quantity" | "WorkUnit" | "Percentage";
type PriceMode = "Standard" | "Manual";

type LineForm = {
  clientId: string;
  lineUid: string;
  productId: string;
  projectAreaId: string;
  description: string;
  salesUomCode: string;
  baseUomCode: string;
  conversionFactor: string;
  quantity: string;
  unitPrice: string;
  discountPercent: string;
  discountReason: string;
  maximumDiscountPercent: number;
  taxRate: string;
  costPrice: string;
  notes: string;
  isOptional: boolean;
  allowFractionalQuantity: boolean;
  billingMethod: BillingMethod;
  priceMode: PriceMode;
  priceSource: string;
  originalUnitPrice: number | null;
  minimumPriceSnapshot: number | null;
  priceError: string;
  priceLoading: boolean;
};

type BillingUnitForm = {
  clientId: string;
  billingUnitUid: string;
  code: string;
  name: string;
  allocations: Record<string, string>;
};

type ResolvedQuotationPrice = {
  resolved_unit_price: number;
  original_unit_price: number | null;
  minimum_price_snapshot: number | null;
  price_book_line_id: string | null;
  price_source: string;
  manual_price_reason: string | null;
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
  projectId: string;
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
  "quotations.apply_discount",
  "quotations.send",
  "quotations.create_revision",
  "quotations.accept",
  "quotations.reject",
  "quotations.cancel",
  "quotations.soft_delete",
  "project_areas.create",
  "products.manage_sales_prices",
] as const;

const DISABLED_SITE_VALUE_PREFIX = "disabled-site:";
const ACTIVE_SITE_QUOTATION_MESSAGE =
  "This site already has an accepted quotation and is now active. To add a new area, products, or additional work, create the Project Area and process the change through a Variation.";

function SelectItem(
  { children, disabled, value, ...props }: React.ComponentProps<
    typeof BaseSelectItem
  >,
) {
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
  projectId: "",
  projectSiteId: "",
  priceBookId: "",
  quotationSegment: "Retail",
  quotationSource: "",
  issueDate: new Date().toISOString().slice(0, 10),
  validUntil: "",
  notes: "",
  internalNotes: "",
});

const createStableUuid = () => {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};

const createClientId = () => createStableUuid();

const emptyLine = (): LineForm => ({
  clientId: createClientId(),
  lineUid: createStableUuid(),
  productId: "",
  projectAreaId: "",
  description: "",
  salesUomCode: "",
  baseUomCode: "",
  conversionFactor: "1",
  quantity: "1",
  unitPrice: "",
  discountPercent: "0",
  discountReason: "",
  maximumDiscountPercent: 0,
  taxRate: "10",
  costPrice: "0",
  notes: "",
  isOptional: false,
  allowFractionalQuantity: true,
  billingMethod: "Quantity",
  priceMode: "Standard",
  priceSource: "",
  originalUnitPrice: null,
  minimumPriceSnapshot: null,
  priceError: "",
  priceLoading: false,
});

const emptyBillingUnit = (): BillingUnitForm => ({
  clientId: createClientId(),
  billingUnitUid: createStableUuid(),
  code: "",
  name: "",
  allocations: {},
});

const money = (value: number | null | undefined) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(
    Number(value ?? 0),
  );

const textOrDash = (value: string | null | undefined) => value?.trim() || "-";

const safeNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatQuantityValue = (value: number) => {
  if (!Number.isFinite(value)) return "";
  return Number(value.toFixed(6)).toString();
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
  const [billingUnits, setBillingUnits] = useState<BillingUnitForm[]>([]);
  const [actionDialog, setActionDialog] = useState<
    { type: string; quotation: QuotationRow } | null
  >(null);
  const [actionReason, setActionReason] = useState("");
  const [acceptRequiredBy, setAcceptRequiredBy] = useState("");
  const [areaDialog, setAreaDialog] = useState<{ lineId: string } | null>(null);
  const [areaForm, setAreaForm] = useState<AreaForm>(emptyAreaForm());
  const [showSellingPriceDialog, setShowSellingPriceDialog] = useState(false);
  const [sellingDialogTargetLineId, setSellingDialogTargetLineId] = useState<string | null>(null);
  const [sellingProductId, setSellingProductId] = useState<string | null>(null);
  const [sellingProductCode, setSellingProductCode] = useState<string | null>(null);
  const [sellingProductName, setSellingProductName] = useState<string | null>(null);
  const [sellingUom, setSellingUom] = useState<string | null>(null);
  const [sellingEffectiveFrom, setSellingEffectiveFrom] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [sellingPricesByBook, setSellingPricesByBook] = useState<Record<string, string>>({});
  const [sellingMinimumPricesByBook, setSellingMinimumPricesByBook] = useState<Record<string, string>>({});

  const permissionsQuery = useQuery({
    queryKey: ["quotation-permissions"],
    queryFn: async () => {
      const entries = await Promise.all(
        PERMISSIONS.map(async (code) => {
          const { data, error } = await supabase.rpc("has_permission", {
            p_permission_code: code,
          });
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
      const [
        customers,
        sites,
        projects,
        areas,
        products,
        uoms,
        productUnits,
        priceBooks,
        areaTypes,
      ] = await Promise.all([
        supabase.from("customers").select("*").eq("is_deleted", false).eq(
          "is_active",
          true,
        ).order("customer_name"),
        supabase.from("project_sites").select("*").eq("is_deleted", false).eq(
          "is_active",
          true,
        ).order("site_name"),
        supabase.from("projects").select("*").eq("is_deleted", false).eq(
          "is_active",
          true,
        ).order("project_name"),
        supabase.from("project_areas").select("*").eq("is_deleted", false).eq(
          "is_active",
          true,
        ).order("area_name"),
        supabase.from("products").select("*").eq("is_deleted", false).eq(
          "is_active",
          true,
        ).order("product_name"),
        supabase.from("units_of_measure").select("*").eq("is_deleted", false)
          .eq("is_active", true).order("sort_order"),
        supabase.from("product_units").select("*").eq(
          "is_deleted",
          false,
        ).eq("is_active", true).order("sort_order"),
        supabase.from("price_books").select("*").eq("is_deleted", false).eq(
          "is_active",
          true,
        ).order("price_book_name"),
        supabase.from("project_area_types").select("*").eq("is_deleted", false)
          .eq("is_active", true).order("sort_order"),
      ]);
      for (
        const result of [
          customers,
          sites,
          projects,
          areas,
          products,
          uoms,
          productUnits,
          priceBooks,
            areaTypes,
        ]
      ) {
        if (result.error) throw result.error;
      }
      return {
        customers: customers.data ?? [],
        sites: sites.data ?? [],
        projects: projects.data ?? [],
        areas: areas.data ?? [],
        products: products.data ?? [],
        uoms: uoms.data ?? [],
        productUnits: productUnits.data ?? [],
        priceBooks: priceBooks.data ?? [],
        areaTypes: areaTypes.data ?? [],
      };
    },
  });

  const priceBookLinesQuery = useQuery({
    queryKey: ["quotation-price-book-lines-v1"],
    queryFn: async (): Promise<PriceBookLineRow[]> => {
      const { data, error } = await supabase
        .from("price_book_lines")
        .select("*")
        .eq("is_deleted", false)
        .eq("is_active", true);
      if (error) throw error;
      return data ?? [];
    },
  });

  const listQuery = useQuery({
    queryKey: ["quotations", status],
    enabled: can("quotations.view"),
    queryFn: async () => {
      let query = supabase.from("quotations").select("*").eq(
        "is_deleted",
        false,
      ).order("created_at", { ascending: false });
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
      const [
        { data: quotation, error: qError },
        { data: detailLines, error: lError },
        { data: revisions, error: rError },
      ] = await Promise.all([
        supabase.from("quotations").select("*").eq("quotation_id", selectedId)
          .single(),
        supabase.from("quotation_lines").select("*").eq(
          "quotation_id",
          selectedId,
        ).eq("is_deleted", false).order("line_no"),
        supabase.from("quotation_revisions").select("*").eq(
          "quotation_id",
          selectedId,
        ).eq("is_deleted", false).order("revision_no", { ascending: false }),
      ]);
      if (qError) throw qError;
      if (lError) throw lError;
      if (rError) throw rError;
      return {
        quotation,
        lines: detailLines ?? [],
        revisions: revisions ?? [],
      };
    },
  });

  const customerById = useMemo(
    () =>
      new Map(
        (lookupQuery.data?.customers ?? []).map((
          customer,
        ) => [customer.customer_id, customer]),
      ),
    [lookupQuery.data?.customers],
  );
  const siteById = useMemo(
    () =>
      new Map(
        (lookupQuery.data?.sites ?? []).map((site) => [site.site_id, site]),
      ),
    [lookupQuery.data?.sites],
  );
  const projectById = useMemo(
    () =>
      new Map(
        (lookupQuery.data?.projects ?? []).map((
          project,
        ) => [project.project_id, project]),
      ),
    [lookupQuery.data?.projects],
  );
  const getQuotationContext = useCallback((quotation: QuotationRow) => {
    const customer = customerById.get(quotation.customer_id);
    const site = quotation.project_site_id
      ? siteById.get(quotation.project_site_id)
      : undefined;
    const project = site ? projectById.get(site.project_id) : undefined;
    return { customer, site, project };
  }, [customerById, projectById, siteById]);
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
  }, [getQuotationContext, listQuery.data, search]);

  const filteredProjects = useMemo(() =>
    (lookupQuery.data?.projects ?? []).filter((project) =>
      project.customer_id === header.customerId
    ), [lookupQuery.data?.projects, header.customerId]);

  const filteredSites = useMemo(() => {
    if (!header.projectId) return [];
    return (lookupQuery.data?.sites ?? [])
      .filter((site) => site.project_id === header.projectId)
      .map((site) =>
        site.site_status === "Active"
          ? {
            ...site,
            site_id: `${DISABLED_SITE_VALUE_PREFIX}${site.site_id}`,
            site_name: `${site.site_name} — Active — Use Variation`,
          }
          : site
      );
  }, [lookupQuery.data?.sites, header.projectId]);

  const selectedProject = lookupQuery.data?.projects.find((project) =>
    project.project_id === header.projectId
  );

  const selectedSite = lookupQuery.data?.sites.find((site) =>
    site.site_id === header.projectSiteId
  );

  const areasForSite = (siteId: string) =>
    (lookupQuery.data?.areas ?? []).filter((x) =>
      x.site_id === siteId && x.area_status === "Quotation"
    );

  const resetEditor = () => {
    setEditingId(null);
    setHeader(emptyHeader());
    setLines([emptyLine()]);
    setBillingUnits([]);
  };

  const openCreate = () => {
    resetEditor();
    setEditorOpen(true);
  };

  const openEdit = async (quotation: QuotationRow) => {
    const [
      { data: existingLines, error: linesError },
      { data: existingUnits, error: unitsError },
      { data: existingAllocations, error: allocationsError },
    ] = await Promise.all([
      supabase.from("quotation_lines").select("*").eq(
        "quotation_id",
        quotation.quotation_id,
      ).eq("is_deleted", false).order("line_no"),
      supabase.from("quotation_billing_units").select("*").eq(
        "quotation_id",
        quotation.quotation_id,
      ).eq("is_deleted", false).eq("is_active", true).order("sort_order"),
      supabase.from("quotation_line_billing_allocations").select("*").eq(
        "quotation_id",
        quotation.quotation_id,
      ).eq("is_deleted", false).eq("is_active", true).order("sort_order"),
    ]);

    if (linesError) return toast.error(linesError.message);
    if (unitsError) return toast.error(unitsError.message);
    if (allocationsError) return toast.error(allocationsError.message);

    setEditingId(quotation.quotation_id);
    const existingSite = quotation.project_site_id
      ? lookupQuery.data?.sites.find((site) => site.site_id === quotation.project_site_id)
      : undefined;

    setHeader({
      customerId: quotation.customer_id,
      projectId: existingSite?.project_id ?? "",
      projectSiteId: quotation.project_site_id ?? "",
      priceBookId: quotation.price_book_id ?? "",
      quotationSegment: quotation.quotation_segment,
      quotationSource: quotation.quotation_source ?? "",
      issueDate: quotation.issue_date ?? "",
      validUntil: quotation.valid_until ?? "",
      notes: quotation.notes ?? "",
      internalNotes: quotation.internal_notes ?? "",
    });

    setLines((existingLines ?? []).map((line: QuotationLineRow) => ({
      clientId: line.quotation_line_id,
      lineUid: line.line_uid ?? createStableUuid(),
      productId: line.product_id ?? "",
      projectAreaId: line.project_area_id ?? "",
      description: line.description,
      salesUomCode: line.sales_uom_code ?? line.unit_of_measure,
      baseUomCode: line.base_uom_code ?? "",
      conversionFactor: String(line.conversion_factor ?? 1),
      quantity: String(line.quantity),
      unitPrice: String(line.unit_price),
      discountPercent: String(line.discount_percent),
      discountReason: line.discount_reason ?? "",
      maximumDiscountPercent: Number(
        lookupQuery.data?.products.find(
          (product) => product.product_id === line.product_id,
        )?.maximum_discount_percent ?? 0,
      ),
      taxRate: String(line.tax_rate),
      costPrice: String(line.cost_price ?? 0),
      notes: line.notes ?? "",
      isOptional: line.is_optional,
      allowFractionalQuantity: line.allow_fractional_quantity,
      billingMethod: (line.billing_method ?? "Quantity") as BillingMethod,
      priceMode: line.product_id ? "Standard" : "Manual",
      priceSource: line.price_source ?? "",
      originalUnitPrice: line.original_unit_price === null ||
          line.original_unit_price === undefined
        ? null
        : Number(line.original_unit_price),
      minimumPriceSnapshot: line.minimum_price_snapshot === null ||
          line.minimum_price_snapshot === undefined
        ? null
        : Number(line.minimum_price_snapshot),
      priceError: "",
      priceLoading: false,
    })));

    const allocationRows: QuotationBillingAllocationRow[] =
      existingAllocations ?? [];
    setBillingUnits((existingUnits ?? []).map((unit: QuotationBillingUnitRow) => {
      const allocations: Record<string, string> = {};
      allocationRows.filter((allocation) =>
        allocation.billing_unit_uid === unit.billing_unit_uid
      ).forEach((allocation) => {
        allocations[allocation.line_uid] = String(allocation.allocated_quantity);
      });

      return {
        clientId: unit.quotation_billing_unit_id ??
          unit.billing_unit_uid ??
          createClientId(),
        billingUnitUid: unit.billing_unit_uid,
        code: unit.billing_unit_code ?? "",
        name: unit.billing_unit_name ?? "",
        allocations,
      };
    }));

    setEditorOpen(true);
  };

  const updateLine = (id: string, patch: Partial<LineForm>) =>
    setLines((current) =>
      current.map((line) => line.clientId === id ? { ...line, ...patch } : line)
    );

  const removeLine = (line: LineForm) => {
    setLines((current) => current.filter((item) => item.clientId !== line.clientId));
    setBillingUnits((current) =>
      current.map((unit) => {
        const allocations = { ...unit.allocations };
        delete allocations[line.lineUid];
        return { ...unit, allocations };
      })
    );
  };

  const updateBillingUnit = (
    clientId: string,
    patch: Partial<BillingUnitForm>,
  ) =>
    setBillingUnits((current) =>
      current.map((unit) => unit.clientId === clientId
        ? { ...unit, ...patch }
        : unit)
    );

  const updateBillingAllocation = (
    billingUnitClientId: string,
    lineUid: string,
    value: string,
  ) =>
    setBillingUnits((current) =>
      current.map((unit) =>
        unit.clientId === billingUnitClientId
          ? {
            ...unit,
            allocations: {
              ...unit.allocations,
              [lineUid]: value,
            },
          }
          : unit
      )
    );

  const findProductUnit = (
    productId: string,
    uomCode: string,
  ) =>
    lookupQuery.data?.productUnits.find(
      (unit) =>
        unit.product_id === productId &&
        unit.uom_code === uomCode &&
        unit.is_active &&
        !unit.is_deleted,
    );

  const supportedSalesUoms = (line: LineForm): ProductUnitRow[] => {
    if (!line.productId) return [];

    return (lookupQuery.data?.productUnits ?? [])
      .filter(
        (unit) =>
          unit.product_id === line.productId &&
          unit.is_active &&
          !unit.is_deleted &&
          Number(unit.conversion_to_base) > 0,
      )
      .sort((a, b) => {
        const sortDifference = Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0);
        if (sortDifference !== 0) return sortDifference;
        return a.uom_code.localeCompare(b.uom_code);
      });
  };

  const uomDisplayName = (uomCode: string) =>
    lookupQuery.data?.uoms.find((uom) => uom.uom_code === uomCode)?.uom_name ??
    uomCode;

  const resolveLineUom = (line: LineForm) => {
    const product = lookupQuery.data?.products.find(
      (item) => item.product_id === line.productId,
    );

    const baseUomCode = line.baseUomCode ||
      product?.base_uom_code ||
      "";

    const salesUomCode = line.salesUomCode ||
      product?.default_sales_uom_code ||
      baseUomCode;

    const productUnit = line.productId
      ? findProductUnit(line.productId, salesUomCode)
      : undefined;

    const conversionFactor = line.productId
      ? Number(productUnit?.conversion_to_base ?? line.conversionFactor)
      : Number(line.conversionFactor || 1);

    return {
      salesUomCode,
      baseUomCode,
      conversionFactor,
      allowFractionalQuantity: productUnit?.allow_fractional_quantity ??
        line.allowFractionalQuantity,
    };
  };

  const isDateWithinRange = (
    dateValue: string,
    fromValue: string | null | undefined,
    toValue: string | null | undefined,
  ) => {
    if (!dateValue) return false;
    if (fromValue && dateValue < fromValue) return false;
    if (toValue && dateValue > toValue) return false;
    return true;
  };

  const sellingPriceBooks = lookupQuery.data?.priceBooks ?? [];

  const resolveExistingSellingPrice = (
    productId: string,
    priceUom: string,
    pricingDate: string,
    priceBookId: string,
  ) =>
    (priceBookLinesQuery.data ?? []).find((row) =>
      row.price_book_id === priceBookId &&
      row.product_id === productId &&
      (row.price_uom_code ?? "") === priceUom &&
      isDateWithinRange(pricingDate, row.effective_from, row.effective_to)
    ) ?? null;

  const loadSellingPriceMatrix = (
    productId: string,
    priceUom: string,
    pricingDate: string,
  ) => {
    const prices: Record<string, string> = {};
    const minimums: Record<string, string> = {};

    for (const book of sellingPriceBooks) {
      const existing = resolveExistingSellingPrice(
        productId,
        priceUom,
        pricingDate,
        book.price_book_id,
      );
      prices[book.price_book_id] = existing ? String(existing.unit_price) : "";
      minimums[book.price_book_id] = existing?.minimum_price == null
        ? ""
        : String(existing.minimum_price);
    }

    setSellingPricesByBook(prices);
    setSellingMinimumPricesByBook(minimums);
  };

  const openSellingPriceDialogForLine = (line: LineForm) => {
    if (!line.productId) {
      toast.error("Select a Product first.");
      return;
    }

    const product = lookupQuery.data?.products.find(
      (item) => item.product_id === line.productId,
    );
    if (!product) {
      toast.error("Selected Product is invalid.");
      return;
    }

    const pricingUomCode = product.pricing_uom_code ?? "";
    if (!pricingUomCode) {
      toast.error("This Product does not have a Pricing UOM configured.");
      return;
    }

    const pricingDate = header.issueDate || new Date().toISOString().slice(0, 10);
    setSellingDialogTargetLineId(line.clientId);
    setSellingProductId(product.product_id);
    setSellingProductCode(product.product_code ?? null);
    setSellingProductName(product.product_name ?? null);
    setSellingUom(pricingUomCode);
    setSellingEffectiveFrom(pricingDate);
    loadSellingPriceMatrix(product.product_id, pricingUomCode, pricingDate);
    setShowSellingPriceDialog(true);
  };

  const resolveStandardPrice = async (
    lineId: string,
    productId: string,
    salesUomCode: string,
    pricingDate = header.issueDate,
    priceBookId = header.priceBookId,
  ) => {
    if (!productId || !salesUomCode || !pricingDate || !priceBookId) {
      updateLine(lineId, {
        unitPrice: "",
        priceSource: "",
        originalUnitPrice: null,
        minimumPriceSnapshot: null,
        priceError: !priceBookId
          ? "The selected Customer does not have a Price Book."
          : "",
        priceLoading: false,
      });
      return;
    }

    updateLine(lineId, { priceLoading: true, priceError: "" });

    const { data, error } = await supabase.rpc(
      "resolve_quotation_line_price",
      {
        p_price_book_id: priceBookId,
        p_product_id: productId,
        p_sales_uom_code: salesUomCode,
        p_pricing_date: pricingDate,
        p_requested_unit_price: null,
        p_manual_price_reason: null,
      },
    );

    if (error) {
      updateLine(lineId, {
        unitPrice: "",
        priceSource: "",
        originalUnitPrice: null,
        minimumPriceSnapshot: null,
        priceError: error.message,
        priceLoading: false,
      });
      return;
    }

    const row = (Array.isArray(data) ? data[0] : data) as
      | ResolvedQuotationPrice
      | null;

    if (!row) {
      updateLine(lineId, {
        unitPrice: "",
        priceSource: "",
        originalUnitPrice: null,
        minimumPriceSnapshot: null,
        priceError: "The server did not return a selling price.",
        priceLoading: false,
      });
      return;
    }

    updateLine(lineId, {
      unitPrice: String(row.resolved_unit_price),
      priceMode: "Standard",
      priceSource: row.price_source,
      originalUnitPrice: row.original_unit_price === null
        ? null
        : Number(row.original_unit_price),
      minimumPriceSnapshot: row.minimum_price_snapshot === null
        ? null
        : Number(row.minimum_price_snapshot),
      priceError: "",
      priceLoading: false,
    });
  };

  const setSellingPrices = useMutation({
    mutationFn: async ({
      productId,
      priceUom,
      effectiveFrom,
      entries,
    }: {
      productId: string;
      priceUom: string;
      effectiveFrom: string;
      entries: Array<{
        price_book_id: string;
        unit_price: number;
        minimum_price: number | null;
      }>;
    }) => {
      const { data, error } = await supabase.rpc(
        "set_product_selling_price_matrix_atomic",
        {
          p_product_id: productId,
          p_price_uom_code: priceUom,
          p_effective_from: effectiveFrom,
          p_prices: entries,
        },
      );
      if (error) throw error;
      return data as Array<{
        price_book_id: string;
        price_book_line_id: string;
        unit_price: number;
        minimum_price: number | null;
      }>;
    },
    onSuccess: async (_savedRows, variables) => {
      toast.success("Selling prices saved.");
      await priceBookLinesQuery.refetch();

      if (sellingDialogTargetLineId && sellingProductId && sellingUom) {
        await resolveStandardPrice(
          sellingDialogTargetLineId,
          sellingProductId,
          sellingUom,
          header.issueDate || variables.effectiveFrom,
          header.priceBookId,
        );
      }

      setShowSellingPriceDialog(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleSaveSellingPrice = () => {
    if (!sellingProductId || !sellingUom) {
      toast.error("Product and Selling UOM are required.");
      return;
    }
    if (!sellingEffectiveFrom) {
      toast.error("Effective From date is required.");
      return;
    }

    const entries: Array<{
      price_book_id: string;
      unit_price: number;
      minimum_price: number | null;
    }> = [];

    for (const book of sellingPriceBooks) {
      const priceText = sellingPricesByBook[book.price_book_id] ?? "";
      const minimumText = sellingMinimumPricesByBook[book.price_book_id] ?? "";
      if (!priceText.trim()) continue;

      const unitPrice = Number(priceText);
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        toast.error(`${book.price_book_name} Selling Price must be >= 0.`);
        return;
      }

      const minimumPrice = minimumText.trim() ? Number(minimumText) : null;
      if (
        minimumPrice !== null &&
        (!Number.isFinite(minimumPrice) || minimumPrice < 0)
      ) {
        toast.error(`${book.price_book_name} Minimum Selling Price must be >= 0.`);
        return;
      }
      if (minimumPrice !== null && minimumPrice > unitPrice) {
        toast.error(
          `${book.price_book_name} Minimum Selling Price cannot exceed its Selling Price.`,
        );
        return;
      }

      entries.push({
        price_book_id: book.price_book_id,
        unit_price: unitPrice,
        minimum_price: minimumPrice,
      });
    }

    if (!entries.length) {
      toast.error("Enter at least one Selling Price before saving.");
      return;
    }

    setSellingPrices.mutate({
      productId: sellingProductId,
      priceUom: sellingUom,
      effectiveFrom: sellingEffectiveFrom,
      entries,
    });
  };

  const chooseProduct = async (lineId: string, productId: string) => {
    const product = lookupQuery.data?.products.find(
      (item) => item.product_id === productId,
    );

    if (!product) return;

    const baseUomCode = product.base_uom_code ?? "";
    const requestedSalesUom = product.default_sales_uom_code ?? baseUomCode;
    const requestedUnit = findProductUnit(productId, requestedSalesUom);
    const baseUnit = findProductUnit(productId, baseUomCode);
    const selectedUnit = requestedUnit ?? baseUnit;

    if (!selectedUnit || Number(selectedUnit.conversion_to_base) <= 0) {
      toast.error(
        "This Product does not have an active Supported Transaction UOM with a valid Factor-to-Base.",
      );
      return;
    }

    const salesUomCode = selectedUnit.uom_code;

    updateLine(lineId, {
      productId,
      description: product.description?.trim() || product.product_name,
      salesUomCode,
      baseUomCode,
      conversionFactor: String(selectedUnit.conversion_to_base),
      unitPrice: "",
      discountPercent: "0",
      discountReason: "",
      maximumDiscountPercent: Number(product.maximum_discount_percent ?? 0),
      allowFractionalQuantity: selectedUnit.allow_fractional_quantity,
      priceMode: "Standard",
      priceSource: "",
      originalUnitPrice: null,
      minimumPriceSnapshot: null,
      priceError: "",
    });

    await resolveStandardPrice(lineId, productId, salesUomCode);
  };

  const chooseSalesUom = async (line: LineForm, salesUomCode: string) => {
    const product = lookupQuery.data?.products.find(
      (item) => item.product_id === line.productId,
    );

    const baseUomCode = line.baseUomCode || product?.base_uom_code || "";
    const currentResolvedUom = resolveLineUom(line);

    const nextUnit = findProductUnit(
      line.productId,
      salesUomCode,
    );
    const nextConversionFactor = Number(nextUnit?.conversion_to_base ?? 0);

    if (
      !baseUomCode ||
      !nextUnit ||
      !Number.isFinite(nextConversionFactor) ||
      nextConversionFactor <= 0
    ) {
      toast.error(
        `${salesUomCode} is not an active Supported Transaction UOM with a valid Factor-to-Base.`,
      );
      return;
    }

    const currentQuantity = safeNumber(line.quantity);
    const currentConversionFactor =
      Number(currentResolvedUom.conversionFactor);

    const currentBaseQuantity =
      Number.isFinite(currentConversionFactor) &&
        currentConversionFactor > 0
        ? currentQuantity * currentConversionFactor
        : 0;

    const convertedQuantity =
      currentBaseQuantity > 0
        ? currentBaseQuantity / nextConversionFactor
        : currentQuantity;

    updateLine(line.clientId, {
      salesUomCode,
      baseUomCode,
      conversionFactor: String(nextConversionFactor),
      quantity: formatQuantityValue(convertedQuantity),
      allowFractionalQuantity: nextUnit.allow_fractional_quantity,
      priceMode: line.productId ? "Standard" : "Manual",
      unitPrice: line.productId ? "" : line.unitPrice,
      priceSource: "",
      originalUnitPrice: null,
      minimumPriceSnapshot: null,
      priceError: "",
    });

    if (line.productId) {
      await resolveStandardPrice(line.clientId, line.productId, salesUomCode);
    }
  };

  const refreshAllStandardPrices = async (
    pricingDate: string,
    priceBookId: string,
  ) => {
    await Promise.all(
      lines.filter((line) => line.productId && line.priceMode === "Standard")
        .map((line) =>
          resolveStandardPrice(
            line.clientId,
            line.productId,
            line.salesUomCode,
            pricingDate,
            priceBookId,
          )
        ),
    );
  };

  const buildPayloadLines = () =>
    lines.map((line, index) => {
      const resolvedUom = resolveLineUom(line);
      const quantity = safeNumber(line.quantity);
      const conversionFactor = resolvedUom.conversionFactor;

      const payload: Record<string, unknown> = {
        line_no: index + 1,
        line_uid: line.lineUid,
        billing_method: line.billingMethod,
        product_id: line.productId || null,
        project_area_id: line.projectAreaId || null,
        description: line.description.trim(),
        sales_uom_code: resolvedUom.salesUomCode,
        unit_of_measure: resolvedUom.salesUomCode,
        base_uom_code: resolvedUom.baseUomCode,
        conversion_factor: conversionFactor,
        base_quantity: quantity * conversionFactor,
        quantity,
        discount_percent: line.productId
          ? can("quotations.apply_discount")
            ? safeNumber(line.discountPercent)
            : null
          : safeNumber(line.discountPercent),
        discount_reason: line.productId &&
            can("quotations.apply_discount") &&
            safeNumber(line.discountPercent) > 0
          ? line.discountReason.trim() || null
          : null,
        tax_rate: safeNumber(line.taxRate),
        notes: line.notes.trim() || null,
        is_optional: line.isOptional,
        allow_fractional_quantity: resolvedUom.allowFractionalQuantity,
      };

      if (can("quotations.view_cost")) {
        payload.cost_price = safeNumber(line.costPrice);
      }

      if (!line.productId) {
        payload.unit_price = safeNumber(line.unitPrice);
      }

      return payload;
    });

  const payloadLines = (): Json => buildPayloadLines() as Json;

  const buildBillingPayload = () => {
    const workUnitLines = lines.filter((line) => line.billingMethod === "WorkUnit");

    if (!workUnitLines.length) {
      return {
        units: [] as Record<string, unknown>[],
        allocations: [] as Record<string, unknown>[],
      };
    }

    const units = billingUnits.map((unit, index) => ({
      billing_unit_uid: unit.billingUnitUid,
      billing_unit_code: unit.code.trim(),
      billing_unit_name: unit.name.trim(),
      sort_order: index + 1,
    }));

    const allocations: Record<string, unknown>[] = [];

    billingUnits.forEach((unit) => {
      workUnitLines.forEach((line) => {
        const raw = unit.allocations[line.lineUid] ?? "";
        if (!raw.trim()) return;

        const allocatedQuantity = Number(raw);
        if (!Number.isFinite(allocatedQuantity) || allocatedQuantity <= 0) return;

        allocations.push({
          line_uid: line.lineUid,
          billing_unit_uid: unit.billingUnitUid,
          allocated_quantity: allocatedQuantity,
          sort_order: allocations.length + 1,
        });
      });
    });

    return { units, allocations };
  };

  const validateEditor = () => {
    if (!header.customerId) {
      throw new Error("Please select a customer.");
    }

    if (!header.priceBookId) {
      throw new Error(
        "The selected Customer must have a Price Book before creating a Quotation.",
      );
    }

    if (!header.projectId) {
      throw new Error("Please select a project.");
    }

    if (selectedProject?.customer_id !== header.customerId) {
      throw new Error("The selected Project does not belong to the selected Customer.");
    }

    if (!header.projectSiteId) {
      throw new Error("Please select a project site.");
    }

    if (selectedSite?.project_id !== header.projectId) {
      throw new Error("The selected Project Site does not belong to the selected Project.");
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

      if (!line.lineUid) {
        throw new Error(`Line ${index + 1}: stable line identity is missing.`);
      }

      if (!line.description.trim()) {
        throw new Error(`Line ${index + 1}: description is required.`);
      }

      if (safeNumber(line.quantity) <= 0) {
        throw new Error(`Line ${index + 1}: quantity must be greater than zero.`);
      }

      if (!resolvedUom.salesUomCode) {
        throw new Error(`Line ${index + 1}: Sales UOM is required.`);
      }

      if (!resolvedUom.baseUomCode) {
        throw new Error(`Line ${index + 1}: Product Base UOM is missing.`);
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

      if (!line.productId) {
        if (!line.unitPrice.trim() || safeNumber(line.unitPrice) < 0) {
          throw new Error(`Line ${index + 1}: Manual line requires a Unit Price.`);
        }
      } else {
        if (!line.unitPrice.trim() || safeNumber(line.unitPrice) < 0) {
          throw new Error(
            `Line ${index + 1}: Product Unit Price could not be resolved from Product Pricing.`,
          );
        }

        const discount = safeNumber(line.discountPercent);
        if (discount < 0 || discount > 100) {
          throw new Error(`Line ${index + 1}: Discount must be between 0 and 100.`);
        }

        if (discount > 0) {
          if (!can("quotations.apply_discount")) {
            throw new Error(
              `Line ${index + 1}: quotations.apply_discount permission is required.`,
            );
          }
          if (!line.discountReason.trim()) {
            throw new Error(`Line ${index + 1}: Discount Reason is required.`);
          }
          if (discount > line.maximumDiscountPercent) {
            throw new Error(
              `Line ${index + 1}: Discount ${discount}% exceeds the Product maximum ` +
                `${line.maximumDiscountPercent}%.`,
            );
          }
        }
      }

      if (line.billingMethod === "Percentage") {
        throw new Error(
          `Line ${index + 1}: Percentage billing is not enabled in this UI. ` +
            "Please keep the historical Draft unchanged or use Quantity / Work Unit.",
        );
      }
    });

    const workUnitLines = lines.filter((line) => line.billingMethod === "WorkUnit");

    if (workUnitLines.length) {
      if (!billingUnits.length) {
        throw new Error(
          "Add at least one Billing Unit for Work Unit billing lines.",
        );
      }

      billingUnits.forEach((unit, index) => {
        if (!unit.code.trim()) {
          throw new Error(`Billing Unit ${index + 1}: Code is required.`);
        }
        if (!unit.name.trim()) {
          throw new Error(`Billing Unit ${index + 1}: Name is required.`);
        }
      });

      workUnitLines.forEach((line) => {
        const lineIndex = lines.findIndex((item) => item.lineUid === line.lineUid);
        const totalAllocated = billingUnits.reduce(
          (sum, unit) => sum + safeNumber(unit.allocations[line.lineUid] ?? ""),
          0,
        );
        const quantity = safeNumber(line.quantity);

        if (!line.isOptional && Math.abs(totalAllocated - quantity) > 0.000001) {
          throw new Error(
            `Line ${lineIndex + 1}: Work Unit allocations must total exactly ` +
              `${quantity} ${line.salesUomCode || ""}. Current allocation: ${totalAllocated}.`,
          );
        }

        if (line.isOptional && totalAllocated - quantity > 0.000001) {
          throw new Error(
            `Line ${lineIndex + 1}: Work Unit allocations cannot exceed ` +
              `${quantity} ${line.salesUomCode || ""}.`,
          );
        }
      });
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      validateEditor();

      const p_quotation = {
        customer_id: header.customerId,
        project_site_id: header.projectSiteId,
        price_book_id: header.priceBookId,
        quotation_segment: header.quotationSegment.trim() || "Retail",
        quotation_source: header.quotationSource.trim() || null,
        issue_date: header.issueDate,
        valid_until: header.validUntil || null,
        notes: header.notes.trim() || null,
        internal_notes: header.internalNotes.trim() || null,
      } as Json;

      const billingPayload = buildBillingPayload();

      const result = editingId
        ? await supabase.rpc("update_draft_quotation_progress_atomic", {
          p_quotation_id: editingId,
          p_quotation,
          p_lines: payloadLines(),
          p_billing_units: billingPayload.units as Json,
          p_billing_allocations: billingPayload.allocations as Json,
        })
        : await supabase.rpc("create_quotation_progress_atomic", {
          p_quotation,
          p_lines: payloadLines(),
          p_billing_units: billingPayload.units as Json,
          p_billing_allocations: billingPayload.allocations as Json,
        });

      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      toast.success(
        editingId ? "Draft quotation updated." : "Quotation created.",
      );
      setEditorOpen(false);
      resetEditor();
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotation-detail"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const createAreaMutation = useMutation({
    mutationFn: async () => {
      if (!areaDialog) throw new Error("No quotation line selected.");
      if (!header.projectSiteId) {
        throw new Error("Please select a Project Site first.");
      }
      if (selectedSite?.site_status !== "Quotation") {
        throw new Error(
          "Areas added from a base quotation must belong to a Site with Quotation status.",
        );
      }
      if (!areaForm.areaName.trim()) throw new Error("Area Name is required.");

      const estimatedQuantity = areaForm.estimatedQuantity.trim()
        ? Number(areaForm.estimatedQuantity)
        : null;

      if (
        estimatedQuantity !== null &&
        (!Number.isFinite(estimatedQuantity) || estimatedQuantity < 0)
      ) {
        throw new Error("Estimated Quantity must be zero or greater.");
      }

      const result = await supabase.rpc(
        "create_project_area_atomic",
        {
          p_site_id: header.projectSiteId,
          p_area_name: areaForm.areaName.trim(),
          p_area_type: areaForm.areaType || null,
          p_estimated_quantity: estimatedQuantity,
          p_unit_of_measure: areaForm.unitOfMeasure || "sqm",
          p_notes: areaForm.notes.trim() || null,
        },
      );

      if (result.error) throw result.error;

      const payload = result.data as unknown as {
        area_id?: string;
        area_code?: string;
        area_name?: string;
        required_commercial_workflow?: string;
      };

      if (!payload?.area_id) {
        throw new Error("The server did not return the new Project Area ID.");
      }
      return payload;
    },
    onSuccess: async (createdArea) => {
      const lineId = areaDialog?.lineId;
      await queryClient.invalidateQueries({ queryKey: ["quotation-lookups"] });
      if (lineId) {
        updateLine(lineId, { projectAreaId: createdArea.area_id ?? "" });
      }
      setAreaDialog(null);
      setAreaForm(emptyAreaForm());
      toast.success(
        `${createdArea.area_code ?? "Project Area"} created and selected.`,
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const workflowMutation = useMutation({
    mutationFn: async () => {
      if (!actionDialog) throw new Error("No action selected.");
      const quotation = actionDialog.quotation;
      let result;
      if (actionDialog.type === "send") {
        result = await supabase.rpc("send_quotation_atomic", {
          p_quotation_id: quotation.quotation_id,
        });
      } else if (actionDialog.type === "accept") {
        result = await supabase.rpc("accept_quotation_atomic", {
          p_quotation_id: quotation.quotation_id,
          p_required_by_date: acceptRequiredBy || undefined,
        });
      } else if (actionDialog.type === "reject") {
        result = await supabase.rpc("reject_quotation_atomic", {
          p_quotation_id: quotation.quotation_id,
          p_rejection_reason: actionReason.trim(),
        });
      } else if (actionDialog.type === "cancel") {
        result = await supabase.rpc("cancel_quotation_atomic", {
          p_quotation_id: quotation.quotation_id,
          p_cancellation_reason: actionReason.trim(),
        });
      } else if (actionDialog.type === "delete") {
        result = await supabase.rpc("soft_delete_quotation_atomic", {
          p_quotation_id: quotation.quotation_id,
        });
      } else if (actionDialog.type === "revision") {
        result = await supabase.rpc(
          "create_quotation_revision_atomic",
          {
            p_quotation_id: quotation.quotation_id,
            p_revision_reason: actionReason.trim() || undefined,
          },
        );
      } else throw new Error("Unsupported action.");
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      toast.success("Quotation action completed.");
      setActionDialog(null);
      setActionReason("");
      setAcceptRequiredBy("");
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotation-detail"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const linePreview = (line: LineForm) => {
    const qty = safeNumber(line.quantity);
    const unit = safeNumber(line.unitPrice);
    const discount = safeNumber(line.discountPercent);
    const tax = safeNumber(line.taxRate);
    const subtotal = qty * unit;
    const discounted = subtotal - subtotal * discount / 100;
    return discounted + discounted * tax / 100;
  };

  if (permissionsQuery.isLoading) {
    return (
      <PageState
        icon={<Loader2 className="h-7 w-7 animate-spin" />}
        title="Checking quotation permissions..."
      />
    );
  }
  if (!can("quotations.view")) {
    return (
      <PageState
        icon={<FileText className="h-7 w-7" />}
        title="You do not have permission to view quotations."
      />
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50">
            <FileText className="h-6 w-6 text-red-600" />
          </div>

          <div className="min-w-0">
            <h1 className="text-2xl font-black leading-tight text-slate-900 md:text-3xl">
              Quotations
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Create, revise, send and accept customer quotations.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => listQuery.refetch()}
            className="h-11 w-full rounded-xl px-5 text-sm font-semibold sm:w-auto"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>

          {can("quotations.create") && (
            <Button
              type="button"
              onClick={openCreate}
              className="flex h-11 w-full items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-700 sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Quotation
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quotation, customer, project or site..."
            className="bg-[#F7F9FB] pl-9"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="bg-[#F7F9FB]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[
              "all",
              "Draft",
              "Sent",
              "Revised",
              "Accepted",
              "Rejected",
              "Cancelled",
            ].map((x) => (
              <SelectItem key={x} value={x}>
                {x === "all" ? "All statuses" : x}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {listQuery.isLoading
        ? (
          <PageState
            icon={<Loader2 className="h-7 w-7 animate-spin" />}
            title="Loading quotations..."
          />
        )
        : listQuery.isError
        ? (
          <PageState
            icon={<XCircle className="h-7 w-7" />}
            title={(listQuery.error as Error).message}
          />
        )
        : !filteredQuotations.length
        ? (
          <PageState
            icon={<FileText className="h-7 w-7" />}
            title="No quotations found."
          />
        )
        : (
          <>
            <div className="hidden overflow-hidden rounded-2xl border bg-white md:block">
              <table className="w-full text-sm">
                <thead className="bg-[#FBF1F1] text-left text-xs uppercase text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Quotation</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Project / Site</th>
                    <th className="px-4 py-3">Issue date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuotations.map((q) => {
                    const { customer, site, project } = getQuotationContext(q);
                    return (
                      <tr
                        key={q.quotation_id}
                        className="border-t hover:bg-slate-50"
                      >
                        <td className="px-4 py-4">
                          <button
                            onClick={() => setSelectedId(q.quotation_id)}
                            className="font-semibold text-[#9E4B4B] hover:underline"
                          >
                            {q.quotation_no}
                          </button>
                          <div className="text-xs text-slate-500">
                            Revision {q.revision_no}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-medium">
                            {textOrDash(customer?.customer_code)}
                          </div>
                          <div className="text-xs text-slate-500">
                            {textOrDash(customer?.customer_name)}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-medium">
                            {project
                              ? `${project.project_no} — ${project.project_name}`
                              : "-"}
                          </div>
                          <div className="text-xs text-slate-500">
                            {site
                              ? `${site.site_code} — ${site.site_name}`
                              : "-"}
                          </div>
                        </td>
                        <td className="px-4 py-4">{q.issue_date || "-"}</td>
                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              statusClass(q.quotation_status)
                            }`}
                          >
                            {q.quotation_status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right font-semibold">
                          {money(q.total_amount)}
                        </td>
                        <td className="px-4 py-4">
                          <RowActions
                            quotation={q}
                            can={can}
                            onView={() => setSelectedId(q.quotation_id)}
                            onEdit={openEdit}
                            onAction={(type) =>
                              setActionDialog({ type, quotation: q })}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="space-y-3 md:hidden">
              {filteredQuotations.map((q) => {
                const { customer, site, project } = getQuotationContext(q);
                return (
                  <div
                    key={q.quotation_id}
                    className="rounded-2xl border bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <button
                          onClick={() => setSelectedId(q.quotation_id)}
                          className="font-bold text-[#9E4B4B]"
                        >
                          {q.quotation_no}
                        </button>
                        <div className="text-xs text-slate-500">
                          Revision {q.revision_no}
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          statusClass(q.quotation_status)
                        }`}
                      >
                        {q.quotation_status}
                      </span>
                    </div>
                    <div className="mt-3 space-y-2 text-sm">
                      <div>
                        <span className="text-slate-500">Customer</span>
                        <div className="font-medium">
                          {textOrDash(customer?.customer_name)}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">Project</span>
                        <div className="font-medium">
                          {project
                            ? `${project.project_no} — ${project.project_name}`
                            : "-"}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">Site</span>
                        <div className="font-medium">
                          {site ? `${site.site_code} — ${site.site_name}` : "-"}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-slate-500">Issue date</span>
                        <div>{q.issue_date || "-"}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500">Total</span>
                        <div className="font-semibold">
                          {money(q.total_amount)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 border-t pt-3">
                      <RowActions
                        quotation={q}
                        can={can}
                        onView={() => setSelectedId(q.quotation_id)}
                        onEdit={openEdit}
                        onAction={(type) =>
                          setActionDialog({ type, quotation: q })}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

      <Dialog
        open={editorOpen}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) resetEditor();
        }}
      >
        <DialogContent className="max-h-[94vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Draft Quotation" : "New Quotation"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <Section number="1" title="Quotation context">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Customer *">
                  <Select
                    value={header.customerId}
                    onValueChange={(value) => {
                      const customer = lookupQuery.data?.customers.find((x) =>
                        x.customer_id === value
                      );
                      const nextPriceBookId = customer?.price_book_id ?? "";
                      setHeader((x) => ({
                        ...x,
                        customerId: value,
                        projectId: "",
                        projectSiteId: "",
                        priceBookId: nextPriceBookId,
                      }));
                      setLines((current) =>
                        current.map((line) => line.productId
                          ? {
                            ...line,
                            priceMode: "Standard",
                            unitPrice: "",
                            priceSource: "",
                            originalUnitPrice: null,
                            minimumPriceSnapshot: null,
                                                      priceError: nextPriceBookId
                              ? ""
                              : "The selected Customer does not have a Price Book.",
                          }
                          : line)
                      );
                      if (nextPriceBookId) {
                        void refreshAllStandardPrices(
                          header.issueDate,
                          nextPriceBookId,
                        );
                      }
                    }}
                  >
                    <SelectTrigger className="bg-[#F7F9FB]">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {lookupQuery.data?.customers.map((x) => (
                        <SelectItem key={x.customer_id} value={x.customer_id}>
                          {x.customer_code} — {x.customer_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Project *">
                  <Select
                    value={header.projectId}
                    disabled={!header.customerId}
                    onValueChange={(value) =>
                      setHeader((current) => ({
                        ...current,
                        projectId: value,
                        projectSiteId: "",
                      }))}
                  >
                    <SelectTrigger className="bg-[#F7F9FB]">
                      <SelectValue
                        placeholder={header.customerId ? "Select project" : "Select a Customer first"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredProjects.map((project) => (
                        <SelectItem key={project.project_id} value={project.project_id}>
                          {project.project_no} — {project.project_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {header.customerId && !filteredProjects.length && (
                    <p className="mt-1 text-xs text-amber-700">
                      No active Project is available for this Customer.
                    </p>
                  )}
                </Field>
                <Field label="Project site *">
                  <Select
                    value={header.projectSiteId}
                    disabled={!header.projectId}
                    onValueChange={(value) =>
                      setHeader((x) => ({ ...x, projectSiteId: value }))}
                  >
                    <SelectTrigger className="bg-[#F7F9FB]">
                      <SelectValue
                        placeholder={header.projectId ? "Select project site" : "Select a Project first"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSites.map((x) => (
                        <SelectItem key={x.site_id} value={x.site_id}>
                          {x.site_code} — {x.site_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {header.projectId && !filteredSites.length && (
                    <p className="mt-1 text-xs text-slate-500">
                      No Project Site is available for this Project.
                    </p>
                  )}
                </Field>
                <Field label="Customer Price Book *">
                  <div className="rounded-md border border-[#E5E7EB] bg-[#F7F9FB] px-3 py-2.5 text-sm">
                    {(() => {
                      const priceBook = lookupQuery.data?.priceBooks.find(
                        (item) => item.price_book_id === header.priceBookId,
                      );
                      return priceBook
                        ? `${priceBook.price_book_code} — ${priceBook.price_book_name}`
                        : header.customerId
                        ? "No Price Book assigned to this Customer"
                        : "Select a Customer first";
                    })()}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Derived from Customer master data and locked for this Quotation.
                  </p>
                </Field>
                <Field label="Segment">
                  <Input
                    value={header.quotationSegment}
                    onChange={(e) =>
                      setHeader((x) => ({
                        ...x,
                        quotationSegment: e.target.value,
                      }))}
                    className="bg-[#F7F9FB]"
                  />
                </Field>
                <Field label="Issue date *">
                  <Input
                    type="date"
                    value={header.issueDate}
                    onChange={(e) => {
                      const nextDate = e.target.value;
                      setHeader((x) => ({ ...x, issueDate: nextDate }));
                      if (nextDate && header.priceBookId) {
                        void refreshAllStandardPrices(
                          nextDate,
                          header.priceBookId,
                        );
                      }
                    }}
                    className="bg-[#F7F9FB]"
                  />
                </Field>
                <Field label="Valid until">
                  <Input
                    type="date"
                    value={header.validUntil}
                    onChange={(e) =>
                      setHeader((x) => ({ ...x, validUntil: e.target.value }))}
                    className="bg-[#F7F9FB]"
                  />
                </Field>
                <Field label="Source">
                  <Input
                    value={header.quotationSource}
                    onChange={(e) =>
                      setHeader((x) => ({
                        ...x,
                        quotationSource: e.target.value,
                      }))}
                    className="bg-[#F7F9FB]"
                  />
                </Field>
              </div>
            </Section>
            <Section number="2" title="Quotation lines">
              <div className="space-y-4">
                {lines.map((line, index) => (
                  <div key={line.clientId} className="rounded-xl border p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <strong>Line {index + 1}</strong>
                      {lines.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          title="Remove Quotation Line"
                          aria-label="Remove Quotation Line"
                          onClick={() =>
                            removeLine(line)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <Field label="Product">
                        <Select
                          value={line.productId || "none"}
                          onValueChange={(value) =>
                            value === "none"
                              ? updateLine(line.clientId, {
                                productId: "",
                                priceMode: "Manual",
                                priceSource: "Manual",
                                originalUnitPrice: null,
                                minimumPriceSnapshot: null,
                                                              unitPrice: line.productId ? "" : line.unitPrice,
                                priceError: "",
                              })
                              : void chooseProduct(line.clientId, value)}
                        >
                          <SelectTrigger className="bg-[#F7F9FB]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Manual line</SelectItem>
                            {lookupQuery.data?.products.map((x) => (
                              <SelectItem
                                key={x.product_id}
                                value={x.product_id}
                              >
                                {x.product_code} — {x.product_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Project area">
                        <div className="flex gap-2">
                          <Select
                            value={line.projectAreaId || "none"}
                            onValueChange={(value) =>
                              updateLine(line.clientId, {
                                projectAreaId: value === "none" ? "" : value,
                              })}
                          >
                            <SelectTrigger className="min-w-0 flex-1 bg-[#F7F9FB]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No area</SelectItem>
                              {areasForSite(header.projectSiteId).map((x) => (
                                <SelectItem key={x.area_id} value={x.area_id}>
                                  {x.area_code} — {x.area_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {can("project_areas.create") && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              title="Add Project Area"
                              aria-label="Add Project Area"
                              disabled={!header.projectSiteId ||
                                selectedSite?.site_status !== "Quotation"}
                              onClick={() => {
                                setAreaForm(emptyAreaForm());
                                setAreaDialog({ lineId: line.clientId });
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        {header.projectSiteId &&
                          !areasForSite(header.projectSiteId).length && (
                          <p className="text-xs text-slate-500">
                            No provisional areas are available for this Site.
                          </p>
                        )}
                      </Field>
                      <Field label="Sales UOM *">
                        <Select
                          value={line.salesUomCode}
                          onValueChange={(value) => void chooseSalesUom(line, value)}
                        >
                          <SelectTrigger className="bg-[#F7F9FB]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {supportedSalesUoms(line).map((unit) => (
                              <SelectItem
                                key={unit.product_unit_id}
                                value={unit.uom_code}
                              >
                                {unit.uom_code} — {uomDisplayName(unit.uom_code)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Quantity *">
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          value={line.quantity}
                          onChange={(e) =>
                            updateLine(line.clientId, {
                              quantity: e.target.value,
                            })}
                          className="bg-[#F7F9FB]"
                        />
                      </Field>
                      <Field label="Unit price">
                        <div className="space-y-2">
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            value={line.unitPrice}
                            readOnly={Boolean(line.productId)}
                            onChange={(e) =>
                              updateLine(line.clientId, {
                                unitPrice: e.target.value,
                              })}
                            className="bg-[#F7F9FB]"
                            placeholder={line.priceLoading
                              ? "Resolving Price Book price..."
                              : "0.00"}
                          />
                          {line.productId && (
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              {line.priceLoading
                                ? <span className="text-slate-500">Checking Customer Price Book...</span>
                                : line.priceError
                                ? <span className="text-amber-700">{line.priceError}</span>
                                : line.priceSource
                                ? (
                                  <span className="text-emerald-700">
                                    {line.priceSource}
                                    {line.minimumPriceSnapshot !== null
                                      ? ` · Minimum ${money(line.minimumPriceSnapshot)}`
                                      : ""}
                                  </span>
                                )
                                : null}
                              {line.priceError &&
                                can("products.manage_sales_prices") && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openSellingPriceDialogForLine(line)}
                                  >
                                    Set Selling Price
                                  </Button>
                                )}
                              {line.priceError &&
                                !can("products.manage_sales_prices") && (
                                  <span className="text-slate-500">
                                    Ask an authorised user to configure the Customer Price Book price.
                                  </span>
                                )}

                            </div>
                          )}
                        </div>
                      </Field>
                      <Field
                        label={line.productId
                          ? `Discount % · Max ${line.maximumDiscountPercent}%`
                          : "Discount %"}
                      >
                        <div className="space-y-2">
                          <Input
                            type="number"
                            min="0"
                            max={line.productId
                              ? line.maximumDiscountPercent
                              : 100}
                            step="0.01"
                            value={line.discountPercent}
                            disabled={Boolean(line.productId) &&
                              (!can("quotations.apply_discount") ||
                                line.maximumDiscountPercent <= 0)}
                            onChange={(e) => {
                              const nextValue = e.target.value;
                              updateLine(line.clientId, {
                                discountPercent: nextValue,
                                discountReason: safeNumber(nextValue) > 0
                                  ? line.discountReason
                                  : "",
                              });
                            }}
                            className="bg-[#F7F9FB]"
                          />
                          {line.productId &&
                            line.maximumDiscountPercent <= 0 && (
                            <p className="text-xs text-slate-500">
                              This Product does not allow a discount.
                            </p>
                          )}
                          {line.productId &&
                            line.maximumDiscountPercent > 0 &&
                            !can("quotations.apply_discount") && (
                            <p className="text-xs text-slate-500">
                              quotations.apply_discount permission is required.
                            </p>
                          )}
                        </div>
                      </Field>
                      {line.productId &&
                        safeNumber(line.discountPercent) > 0 && (
                        <Field label="Discount Reason *">
                          <Input
                            value={line.discountReason}
                            disabled={!can("quotations.apply_discount")}
                            onChange={(e) =>
                              updateLine(line.clientId, {
                                discountReason: e.target.value,
                              })}
                            placeholder="Reason for Product discount"
                            className="bg-[#F7F9FB]"
                          />
                        </Field>
                      )}
                      <Field label="Tax %">
                        <Input
                          type="number"
                          min="0"
                          value={line.taxRate}
                          onChange={(e) =>
                            updateLine(line.clientId, {
                              taxRate: e.target.value,
                            })}
                          className="bg-[#F7F9FB]"
                        />
                      </Field>
                      {can("quotations.view_cost") && (
                        <Field label="Cost price">
                          <Input
                            type="number"
                            min="0"
                            value={line.costPrice}
                            onChange={(e) =>
                              updateLine(line.clientId, {
                                costPrice: e.target.value,
                              })}
                            className="bg-[#F7F9FB]"
                          />
                        </Field>
                      )}
                      <Field label="Billing basis">
                        {line.billingMethod === "Percentage"
                          ? (
                            <Input
                              readOnly
                              value="Percentage (legacy — not editable here)"
                              className="bg-slate-100"
                            />
                          )
                          : (
                            <Select
                              value={line.billingMethod}
                              onValueChange={(value) =>
                                updateLine(line.clientId, {
                                  billingMethod: value as BillingMethod,
                                })}
                            >
                              <SelectTrigger className="bg-[#F7F9FB]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Quantity">
                                  Quantity
                                </SelectItem>
                                <SelectItem value="WorkUnit">
                                  Work Unit
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        <p className="mt-1 text-xs text-slate-500">
                          Work Unit is for rooms / stages / scope units. It is not a Product UOM conversion.
                        </p>
                      </Field>
                      <Field label="Preview total">
                        <Input readOnly value={money(linePreview(line))} />
                      </Field>
                      <div className="md:col-span-3">
                        <Field label="Description *">
                          <Textarea
                            value={line.description}
                            onChange={(e) =>
                              updateLine(line.clientId, {
                                description: e.target.value,
                              })}
                            className="bg-[#F7F9FB]"
                          />
                        </Field>
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLines((x) => [...x, emptyLine()])}
                >
                  <Plus className="mr-2 h-4 w-4" />Add line
                </Button>
              </div>
            </Section>
            <Section number="3" title="Billing breakdown">
              {lines.some((line) => line.billingMethod === "WorkUnit")
                ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-[#B98A8A] bg-[#FBF1F1] p-4 text-sm text-slate-700">
                      Work Units describe claimable scope such as Room 001, Room 002,
                      Level 1 or Stage A. Allocated quantities remain in each
                      quotation line&apos;s Sales UOM and must not exceed the source quantity.
                    </div>

                    {billingUnits.map((unit, unitIndex) => (
                      <div
                        key={unit.clientId}
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <strong>Billing Unit {unitIndex + 1}</strong>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setBillingUnits((current) =>
                                current.filter((item) =>
                                  item.clientId !== unit.clientId
                                )
                              )}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <Field label="Unit code *">
                            <Input
                              value={unit.code}
                              onChange={(e) =>
                                updateBillingUnit(unit.clientId, {
                                  code: e.target.value,
                                })}
                              placeholder="ROOM-001"
                              className="bg-[#F7F9FB]"
                            />
                          </Field>
                          <Field label="Unit name *">
                            <Input
                              value={unit.name}
                              onChange={(e) =>
                                updateBillingUnit(unit.clientId, {
                                  name: e.target.value,
                                })}
                              placeholder="Room 001"
                              className="bg-[#F7F9FB]"
                            />
                          </Field>
                        </div>

                        <div className="mt-4 overflow-x-auto rounded-lg border">
                          <table className="w-full min-w-[620px] text-sm">
                            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-600">
                              <tr>
                                <th className="px-3 py-2">Quotation line</th>
                                <th className="px-3 py-2">Sales UOM</th>
                                <th className="px-3 py-2 text-right">Source Qty</th>
                                <th className="px-3 py-2 text-right">Allocated Qty</th>
                              </tr>
                            </thead>
                            <tbody>
                              {lines.filter((line) =>
                                line.billingMethod === "WorkUnit"
                              ).map((line) => {
                                const lineIndex = lines.findIndex((item) =>
                                  item.lineUid === line.lineUid
                                );
                                return (
                                  <tr key={line.lineUid} className="border-t">
                                    <td className="px-3 py-2">
                                      <div className="font-medium">
                                        Line {lineIndex + 1}
                                      </div>
                                      <div className="max-w-[280px] truncate text-xs text-slate-500">
                                        {line.description || "No description"}
                                      </div>
                                    </td>
                                    <td className="px-3 py-2">
                                      {line.salesUomCode || "-"}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      {line.quantity || "0"}
                                    </td>
                                    <td className="px-3 py-2">
                                      <Input
                                        type="number"
                                        min="0"
                                        step="any"
                                        value={unit.allocations[line.lineUid] ?? ""}
                                        onChange={(e) =>
                                          updateBillingAllocation(
                                            unit.clientId,
                                            line.lineUid,
                                            e.target.value,
                                          )}
                                        className="ml-auto w-36 bg-[#F7F9FB] text-right"
                                      />
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setBillingUnits((current) => [
                          ...current,
                          emptyBillingUnit(),
                        ])}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Billing Unit
                    </Button>

                    {lines.filter((line) =>
                      line.billingMethod === "WorkUnit" && !line.isOptional
                    ).map((line) => {
                      const allocated = billingUnits.reduce(
                        (sum, unit) =>
                          sum + safeNumber(unit.allocations[line.lineUid] ?? ""),
                        0,
                      );
                      const quantity = safeNumber(line.quantity);
                      const remaining = quantity - allocated;
                      const lineIndex = lines.findIndex((item) =>
                        item.lineUid === line.lineUid
                      );

                      return (
                        <div
                          key={`billing-summary-${line.lineUid}`}
                          className={`rounded-lg border px-3 py-2 text-sm ${
                            Math.abs(remaining) <= 0.000001
                              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                              : "border-amber-200 bg-amber-50 text-amber-800"
                          }`}
                        >
                          Line {lineIndex + 1}: Allocated {allocated} / {quantity}{" "}
                          {line.salesUomCode || ""} · Remaining {remaining}
                        </div>
                      );
                    })}
                  </div>
                )
                : (
                  <div className="rounded-xl border border-dashed p-5 text-sm text-slate-500">
                    No Work Unit billing lines. Quantity billing uses the quotation
                    line quantity directly and does not require a Billing Breakdown.
                  </div>
                )}
            </Section>

            <Section number="4" title="Notes">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Customer notes">
                  <Textarea
                    value={header.notes}
                    onChange={(e) =>
                      setHeader((x) => ({ ...x, notes: e.target.value }))}
                    className="bg-[#F7F9FB]"
                  />
                </Field>
                {can("quotations.view_internal") && (
                  <Field label="Internal notes">
                    <Textarea
                      value={header.internalNotes}
                      onChange={(e) =>
                        setHeader((x) => ({
                          ...x,
                          internalNotes: e.target.value,
                        }))}
                      className="bg-[#F7F9FB]"
                    />
                  </Field>
                )}
              </div>
            </Section>
            <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-white py-4">
              <Button variant="outline" onClick={() => setEditorOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="bg-[#9E4B4B] text-white hover:bg-[#843e3e]"
              >
                {saveMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}Save Draft
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(areaDialog)}
        onOpenChange={(open) => {
          if (!open && !createAreaMutation.isPending) {
            setAreaDialog(null);
            setAreaForm(emptyAreaForm());
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Project Area</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="rounded-xl border border-[#B98A8A] bg-[#FBF1F1] p-4 text-sm">
              <div className="font-semibold text-slate-900">
                {selectedSite?.site_code} — {selectedSite?.site_name}
              </div>
              <div className="mt-1 text-slate-600">
                The new Area will start with Quotation status and will be
                selected on the quotation line.
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Area name *">
                <Input
                  value={areaForm.areaName}
                  onChange={(e) =>
                    setAreaForm((current) => ({
                      ...current,
                      areaName: e.target.value,
                    }))}
                  className="bg-[#F7F9FB]"
                  autoFocus
                />
              </Field>
              <Field label="Area type">
                <Select
                  value={areaForm.areaType || "none"}
                  onValueChange={(value) =>
                    setAreaForm((current) => ({
                      ...current,
                      areaType: value === "none" ? "" : value,
                    }))}
                >
                  <SelectTrigger className="bg-[#F7F9FB]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    {lookupQuery.data?.areaTypes.map((item) => (
                      <SelectItem
                        key={item.area_type_id}
                        value={item.area_type_name}
                      >
                        {item.area_type_code} — {item.area_type_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Estimated quantity">
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={areaForm.estimatedQuantity}
                  onChange={(e) =>
                    setAreaForm((current) => ({
                      ...current,
                      estimatedQuantity: e.target.value,
                    }))}
                  className="bg-[#F7F9FB]"
                />
              </Field>
              <Field label="Unit of measure">
                <Select
                  value={areaForm.unitOfMeasure}
                  onValueChange={(value) =>
                    setAreaForm((current) => ({
                      ...current,
                      unitOfMeasure: value,
                    }))}
                >
                  <SelectTrigger className="bg-[#F7F9FB]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {lookupQuery.data?.uoms.map((item) => (
                      <SelectItem key={item.uom_code} value={item.uom_code}>
                        {item.uom_code} — {item.uom_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <div className="md:col-span-2">
                <Field label="Notes">
                  <Textarea
                    value={areaForm.notes}
                    onChange={(e) =>
                      setAreaForm((current) => ({
                        ...current,
                        notes: e.target.value,
                      }))}
                    className="bg-[#F7F9FB]"
                  />
                </Field>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={createAreaMutation.isPending}
                onClick={() => {
                  setAreaDialog(null);
                  setAreaForm(emptyAreaForm());
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={createAreaMutation.isPending ||
                  !areaForm.areaName.trim()}
                onClick={() => createAreaMutation.mutate()}
                className="bg-[#9E4B4B] text-white hover:bg-[#843e3e]"
              >
                {createAreaMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}Create Area
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showSellingPriceDialog}
        onOpenChange={(open) => {
          if (!setSellingPrices.isPending) setShowSellingPriceDialog(open);
        }}
      >
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Set Selling Price</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Product Code</p>
                  <p className="font-semibold text-slate-900">
                    {sellingProductCode ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Product Name</p>
                  <p className="font-semibold text-slate-900">
                    {sellingProductName ?? "—"}
                  </p>
                </div>
              </div>
            </div>

            <Field label="Selling UOM *">
              <Select
                value={sellingUom ?? ""}
                onValueChange={(value) => {
                  setSellingUom(value);
                  if (sellingProductId) {
                    loadSellingPriceMatrix(
                      sellingProductId,
                      value,
                      sellingEffectiveFrom || header.issueDate,
                    );
                  }
                }}
              >
                <SelectTrigger className="bg-[#F7F9FB]">
                  <SelectValue placeholder="Select UOM" />
                </SelectTrigger>
                <SelectContent>
                  {lookupQuery.data?.uoms.map((uom) => (
                    <SelectItem key={uom.uom_code} value={uom.uom_code}>
                      {uom.uom_code} — {uom.uom_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="grid grid-cols-[minmax(120px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)] gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <div>Price Book</div>
                <div>Selling Price</div>
                <div>Minimum Price</div>
              </div>

              <div className="mt-3 space-y-3">
                {sellingPriceBooks.map((book) => (
                  <div
                    key={book.price_book_id}
                    className="grid grid-cols-[minmax(120px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)] items-center gap-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {book.price_book_code} — {book.price_book_name}
                      </p>
                      {book.price_book_id === header.priceBookId && (
                        <p className="mt-0.5 text-xs font-medium text-[#8B3F3F]">
                          Current Customer Price Book
                        </p>
                      )}
                    </div>

                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className="bg-white"
                      value={sellingPricesByBook[book.price_book_id] ?? ""}
                      onChange={(event) =>
                        setSellingPricesByBook((current) => ({
                          ...current,
                          [book.price_book_id]: event.target.value,
                        }))}
                      placeholder="Not Set"
                    />

                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      className="bg-white"
                      value={sellingMinimumPricesByBook[book.price_book_id] ?? ""}
                      onChange={(event) =>
                        setSellingMinimumPricesByBook((current) => ({
                          ...current,
                          [book.price_book_id]: event.target.value,
                        }))}
                      placeholder="Optional"
                    />
                  </div>
                ))}
              </div>

              <p className="mt-3 text-xs text-slate-500">
                Blank prices remain Not Set. The current Customer Price Book is highlighted.
                Saving here updates Product selling-price master data for future Quotations and Invoices.
              </p>
            </div>

            <Field label="Effective From *">
              <Input
                type="date"
                value={sellingEffectiveFrom}
                onChange={(event) => {
                  setSellingEffectiveFrom(event.target.value);
                  if (sellingProductId && sellingUom) {
                    loadSellingPriceMatrix(
                      sellingProductId,
                      sellingUom,
                      event.target.value,
                    );
                  }
                }}
                className="bg-[#F7F9FB]"
              />
            </Field>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={setSellingPrices.isPending}
                onClick={() => setShowSellingPriceDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={setSellingPrices.isPending}
                onClick={handleSaveSellingPrice}
                className="bg-[#9E4B4B] text-white hover:bg-[#843e3e]"
              >
                {setSellingPrices.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Selling Prices
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(selectedId)}
        onOpenChange={(open) => !open && setSelectedId(null)}
      >
        <DialogContent className="max-h-[94vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quotation Details</DialogTitle>
          </DialogHeader>
          {detailQuery.isLoading
            ? (
              <PageState
                icon={<Loader2 className="h-6 w-6 animate-spin" />}
                title="Loading quotation..."
              />
            )
            : detailQuery.data && (
              <div className="space-y-5">
                <div className="rounded-xl bg-[#FBF1F1] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xl font-bold">
                        {detailQuery.data.quotation.quotation_no}
                      </div>
                      <div className="text-sm text-slate-500">
                        Revision {detailQuery.data.quotation.revision_no}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-sm ${
                        statusClass(detailQuery.data.quotation.quotation_status)
                      }`}
                    >
                      {detailQuery.data.quotation.quotation_status}
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Line</th>
                        <th className="px-3 py-2 text-left">Description</th>
                        <th className="px-3 py-2 text-right">Qty</th>
                        <th className="px-3 py-2 text-left">UOM</th>
                        <th className="px-3 py-2 text-right">Price</th>
                        <th className="px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailQuery.data.lines.map((line) => (
                        <tr key={line.quotation_line_id} className="border-t">
                          <td className="px-3 py-3">{line.line_no}</td>
                          <td className="px-3 py-3">{line.description}</td>
                          <td className="px-3 py-3 text-right">
                            {line.quantity}
                          </td>
                          <td className="px-3 py-3">
                            {line.sales_uom_code || line.unit_of_measure}
                          </td>
                          <td className="px-3 py-3 text-right">
                            {money(line.unit_price)}
                          </td>
                          <td className="px-3 py-3 text-right font-medium">
                            {money(line.line_total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end">
                  <div className="w-full max-w-sm space-y-2 rounded-xl border p-4">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <strong>
                        {money(detailQuery.data.quotation.subtotal_amount)}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <strong>
                        {money(detailQuery.data.quotation.tax_amount)}
                      </strong>
                    </div>
                    <div className="flex justify-between border-t pt-2 text-lg">
                      <span>Total</span>
                      <strong>
                        {money(detailQuery.data.quotation.total_amount)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(actionDialog)}
        onOpenChange={(open) => !open && setActionDialog(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.type
                ? `${actionDialog.type[0].toUpperCase()}${
                  actionDialog.type.slice(1)
                } Quotation`
                : "Quotation Action"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {["reject", "cancel", "revision"].includes(
              actionDialog?.type ?? "",
            ) && (
              <Field label="Reason">
                <Textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="bg-[#F7F9FB]"
                />
              </Field>
            )}
            {actionDialog?.type === "accept" && (
              <Field label="Required by date">
                <Input
                  type="date"
                  value={acceptRequiredBy}
                  onChange={(e) => setAcceptRequiredBy(e.target.value)}
                  className="bg-[#F7F9FB]"
                />
              </Field>
            )}
            <p className="text-sm text-slate-500">
              This action is processed by the server workflow and cannot bypass
              backend validation.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setActionDialog(null)}>
                Back
              </Button>
              <Button
                onClick={() => workflowMutation.mutate()}
                disabled={workflowMutation.isPending}
                className="bg-[#9E4B4B] text-white hover:bg-[#843e3e]"
              >
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RowActions({
  quotation,
  can,
  onView,
  onEdit,
  onAction,
}: {
  quotation: QuotationRow;
  can: (code: string) => boolean;
  onView: () => void;
  onEdit: (q: QuotationRow) => void;
  onAction: (type: string) => void;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        title="View Quotation"
        aria-label="View Quotation"
        onClick={onView}
      >
        <FileText className="h-4 w-4" />
      </Button>
      {quotation.quotation_status === "Draft" &&
        can("quotations.update_draft") && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          title="Edit Quotation"
          aria-label="Edit Quotation"
          onClick={() => onEdit(quotation)}
        >
          <FileEdit className="h-4 w-4" />
        </Button>
      )}
      {quotation.quotation_status === "Draft" && can("quotations.send") && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          title="Send Quotation"
          aria-label="Send Quotation"
          onClick={() => onAction("send")}
        >
          <Send className="h-4 w-4" />
        </Button>
      )}
      {["Sent", "Revised"].includes(quotation.quotation_status) &&
        can("quotations.accept") && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          title="Accept Quotation"
          aria-label="Accept Quotation"
          onClick={() => onAction("accept")}
        >
          <CheckCircle2 className="h-4 w-4" />
        </Button>
      )}
      {["Sent", "Revised"].includes(quotation.quotation_status) &&
        can("quotations.reject") && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          title="Reject Quotation"
          aria-label="Reject Quotation"
          onClick={() => onAction("reject")}
        >
          <XCircle className="h-4 w-4" />
        </Button>
      )}
      {["Sent", "Revised"].includes(quotation.quotation_status) &&
        can("quotations.create_revision") && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          title="Create Revision"
          aria-label="Create Revision"
          onClick={() => onAction("revision")}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      )}
      {!["Accepted", "Rejected", "Cancelled"].includes(
        quotation.quotation_status,
      ) && can("quotations.cancel") && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          title="Cancel Quotation"
          aria-label="Cancel Quotation"
          onClick={() => onAction("cancel")}
        >
          <XCircle className="h-4 w-4" />
        </Button>
      )}
      {quotation.quotation_status === "Draft" &&
        can("quotations.soft_delete") && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          title="Delete Quotation"
          aria-label="Delete Quotation"
          onClick={() => onAction("delete")}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function Field(
  { label, children }: { label: string; children: React.ReactNode },
) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
function Section(
  { number, title, children }: {
    number: string;
    title: string;
    children: React.ReactNode;
  },
) {
  return (
    <section className="rounded-2xl border bg-white p-4 md:p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#9E4B4B] text-sm font-bold text-white">
          {number}
        </span>
        <h2 className="font-semibold text-slate-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}
function PageState({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-2xl border bg-white p-8 text-center text-slate-500">
      {icon}
      <p>{title}</p>
    </div>
  );
}
