import { useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Download,
  Eye,
  FileDown,
  Loader2,
  PackagePlus,
  Pencil,
  Plus,
  Printer,
  Search,
  Send,
  ShoppingCart,
  Trash2,
  X,
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

type PurchaseOrderStatus =
  | "Draft"
  | "Submitted"
  | "Confirmed"
  | "Partially Delivered"
  | "Delivered"
  | "Cancelled";

type PurchaseOrderSource =
  | "Manual"
  | "MaterialRequirement"
  | "StockRequest"
  | "Mixed";

type LineSource = "Manual" | "MaterialRequirement" | "StockRequest";

type Supplier = {
  supplier_id: string;
  supplier_code: string | null;
  supplier_name: string;
  default_currency: string | null;
  payment_terms_type: string | null;
  payment_terms_days: number | null;
  default_tax_type: string | null;
  delivery_lead_days: number | null;
};

type Project = {
  project_id: string;
  project_no: string | null;
  project_name: string;
  customers: { customer_name: string } | null;
};

type Site = {
  site_id: string;
  project_id: string;
  site_code: string | null;
  site_name: string;
};

type Product = {
  product_id: string;
  product_code: string;
  product_name: string;
  description: string | null;
  base_uom_code: string;
  default_purchase_uom_code: string | null;
  is_stock_item: boolean | null;
  is_service_item: boolean | null;
};

type ProductUomConversion = {
  product_id: string;
  from_uom_code: string;
  to_uom_code: string;
  conversion_factor: number;
  allow_fractional_quantity: boolean;
};

type SupplierProductLink = {
  material_supplier_link_id: string;
  supplier_id: string;
  product_id: string;
  supplier_product_code: string | null;
  supplier_product_name: string | null;
  default_cost_price: number | null;
  last_purchase_price: number | null;
  purchase_uom_code: string | null;
  lead_time_days: number | null;
  minimum_order_quantity: number | null;
  order_multiple: number | null;
  default_tax_type: string | null;
  is_preferred: boolean;
};

type MaterialRequirementOption = {
  material_requirement_id: string;
  material_requirement_no: string;
  requirement_status: string;
  project_id: string;
  site_id: string | null;
  required_by_date: string | null;
  material_requirement_line_id: string;
  line_no: number;
  product_id: string;
  description: string;
  requirement_uom_code: string;
  requirement_quantity: number;
  base_uom_code: string;
  required_base_quantity: number;
  preferred_supplier_id: string | null;
  line_required_by_date: string | null;
  line_status: string;
  linked_base_quantity: number;
  outstanding_base_quantity: number;
};

type StockRequestOption = {
  stock_request_id: string;
  stock_request_no: string;
  request_status: string;
  project_id: string;
  site_id: string;
  area_id: string | null;
  required_date: string | null;
  stock_request_item_id: string;
  line_no: number;
  product_id: string;
  description: string | null;
  approved_quantity: number | null;
  request_uom_code: string | null;
  base_uom_code: string | null;
  approved_base_quantity: number | null;
  conversion_factor_to_base: number | null;
};

type PurchaseOrderLineForm = {
  key: string;
  source_type: LineSource;
  material_requirement_line_id: string;
  stock_request_item_id: string;
  product_id: string;
  material_supplier_link_id: string;
  description: string;
  purchase_uom_code: string;
  quantity: string;
  unit_cost: string;
  discount_percent: string;
  tax_rate: string;
  tax_type: string;
  required_by_date: string;
  lead_time_days: string;
  supplier_product_code: string;
  supplier_product_name: string;
  notes: string;
};

type PurchaseOrderRecord = {
  purchase_order_id: string;
  purchase_order_no: string;
  supplier_id: string;
  project_id: string | null;
  site_id: string | null;
  order_date: string;
  expected_delivery_date: string | null;
  order_status: PurchaseOrderStatus;
  source_type: PurchaseOrderSource;
  subtotal_amount: number;
  tax_amount: number;
  total_amount: number;
  currency_code: string;
  supplier_reference: string | null;
  supplier_quote_no: string | null;
  supplier_quote_date: string | null;
  payment_terms_type: string | null;
  payment_terms_days: number | null;
  default_tax_type: string | null;
  delivery_destination_type: string;
  delivery_contact_name: string | null;
  delivery_contact_phone: string | null;
  delivery_method: string | null;
  delivery_instructions: string | null;
  supplier_notes: string | null;
  internal_notes: string | null;
  notes: string | null;
  submitted_at: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  suppliers: {
    supplier_code: string | null;
    supplier_name: string;
  } | null;
  projects: {
    project_no: string | null;
    project_name: string;
    customers: { customer_name: string } | null;
  } | null;
  project_sites: {
    site_code: string | null;
    site_name: string;
  } | null;
  purchase_order_lines: Array<{
    purchase_order_line_id: string;
    line_no: number;
    source_type: LineSource;
    product_id: string;
    material_supplier_link_id: string | null;
    stock_request_item_id: string | null;
    description: string;
    purchase_uom_code: string | null;
    base_uom_code: string | null;
    conversion_factor_to_base: number | null;
    ordered_base_quantity: number | null;
    quantity: number;
    unit_cost: number;
    discount_percent: number;
    discount_amount: number;
    line_subtotal: number;
    tax_rate: number;
    tax_amount: number;
    line_total: number;
    tax_type: string | null;
    required_by_date: string | null;
    lead_time_days: number | null;
    supplier_product_code: string | null;
    supplier_product_name: string | null;
    notes: string | null;
    source_snapshot: Record<string, unknown> | null;
    products: {
      product_code: string;
      product_name: string;
    } | null;
  }>;
};

type FormMode = "create" | "edit";

const inputClassName =
  "bg-[#F7F9FB] border-[#E5E7EB] hover:border-[#9E4B4B] focus-visible:ring-[#9E4B4B]";

const moneyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

const dateFormatter = new Intl.DateTimeFormat("en-AU", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const todayIso = () => new Date().toISOString().slice(0, 10);

const newLine = (): PurchaseOrderLineForm => ({
  key: crypto.randomUUID(),
  source_type: "Manual",
  material_requirement_line_id: "",
  stock_request_item_id: "",
  product_id: "",
  material_supplier_link_id: "",
  description: "",
  purchase_uom_code: "",
  quantity: "",
  unit_cost: "",
  discount_percent: "0",
  tax_rate: "10",
  tax_type: "",
  required_by_date: "",
  lead_time_days: "",
  supplier_product_code: "",
  supplier_product_name: "",
  notes: "",
});

const numberValue = (value: string | number | null | undefined) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
};

const statusClass = (status: PurchaseOrderStatus) => {
  const classes: Record<PurchaseOrderStatus, string> = {
    Draft: "bg-slate-100 text-slate-700 border-slate-200",
    Submitted: "bg-amber-50 text-amber-700 border-amber-200",
    Confirmed: "bg-blue-50 text-blue-700 border-blue-200",
    "Partially Delivered": "bg-violet-50 text-violet-700 border-violet-200",
    Delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  };
  return classes[status];
};

const PurchaseOrders = () => {
  const queryClient = useQueryClient();
  const db = supabase as any;

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [supplierFilter, setSupplierFilter] = useState("All");

  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<
    PurchaseOrderRecord | null
  >(null);

  const [supplierId, setSupplierId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [sourceType, setSourceType] = useState<PurchaseOrderSource>("Manual");
  const [orderDate, setOrderDate] = useState(todayIso());
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [currencyCode, setCurrencyCode] = useState("AUD");
  const [supplierReference, setSupplierReference] = useState("");
  const [supplierQuoteNo, setSupplierQuoteNo] = useState("");
  const [supplierQuoteDate, setSupplierQuoteDate] = useState("");
  const [paymentTermsType, setPaymentTermsType] = useState("");
  const [paymentTermsDays, setPaymentTermsDays] = useState("");
  const [defaultTaxType, setDefaultTaxType] = useState("");
  const [deliveryDestinationType, setDeliveryDestinationType] = useState(
    "Site",
  );
  const [deliveryContactName, setDeliveryContactName] = useState("");
  const [deliveryContactPhone, setDeliveryContactPhone] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [supplierNotes, setSupplierNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [headerNotes, setHeaderNotes] = useState("");
  const [lines, setLines] = useState<PurchaseOrderLineForm[]>([newLine()]);
  const [cancelReason, setCancelReason] = useState("");

  const { data: suppliers = [], isLoading: suppliersLoading } = useQuery({
    queryKey: ["purchase-order-suppliers"],
    queryFn: async () => {
      const { data, error } = await db
        .from("suppliers")
        .select(
          "supplier_id,supplier_code,supplier_name,default_currency,payment_terms_type,payment_terms_days,default_tax_type,delivery_lead_days",
        )
        .eq("is_deleted", false)
        .eq("is_active", true)
        .order("supplier_name", { ascending: true });

      if (error) throw error;
      return (data ?? []) as Supplier[];
    },
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["purchase-order-projects"],
    queryFn: async () => {
      const { data, error } = await db
        .from("projects")
        .select(
          "project_id,project_no,project_name,customers(customer_name)",
        )
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as Project[];
    },
  });

  const { data: sites = [] } = useQuery({
    queryKey: ["purchase-order-sites"],
    queryFn: async () => {
      const { data, error } = await db
        .from("project_sites")
        .select("site_id,project_id,site_code,site_name")
        .eq("is_deleted", false)
        .eq("is_active", true)
        .order("site_name", { ascending: true });

      if (error) throw error;
      return (data ?? []) as Site[];
    },
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["purchase-order-products"],
    queryFn: async () => {
      const { data, error } = await db
        .from("products")
        .select(
          "product_id,product_code,product_name,description,base_uom_code,default_purchase_uom_code,is_stock_item,is_service_item",
        )
        .eq("is_deleted", false)
        .eq("is_active", true)
        .order("product_code", { ascending: true });

      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const { data: productUomConversions = [] } = useQuery({
    queryKey: ["purchase-order-product-uom-conversions"],
    queryFn: async () => {
      const { data, error } = await db
        .from("product_uom_conversions")
        .select(
          "product_id,from_uom_code,to_uom_code,conversion_factor,allow_fractional_quantity",
        )
        .eq("is_active", true)
        .eq("is_deleted", false)
        .order("sort_order", { ascending: true });

      if (error) throw error;

      return (data ?? []) as ProductUomConversion[];
    },
  });

  const { data: supplierLinks = [] } = useQuery({
    queryKey: ["purchase-order-supplier-links", supplierId],
    enabled: Boolean(supplierId),
    queryFn: async () => {
      const { data, error } = await db
        .from("material_supplier_links")
        .select(
          "material_supplier_link_id,supplier_id,product_id,supplier_product_code,supplier_product_name,default_cost_price,last_purchase_price,purchase_uom_code,lead_time_days,minimum_order_quantity,order_multiple,default_tax_type,is_preferred",
        )
        .eq("supplier_id", supplierId)
        .eq("is_deleted", false)
        .eq("is_active", true)
        .order("is_preferred", { ascending: false });

      if (error) throw error;
      return (data ?? []) as SupplierProductLink[];
    },
  });

  const { data: materialRequirementOptions = [] } = useQuery({
    queryKey: ["purchase-order-material-requirement-options"],
    queryFn: async () => {
      const { data, error } = await db
        .from("material_requirements")
        .select(`
          material_requirement_id,
          material_requirement_no,
          requirement_status,
          project_id,
          site_id,
          required_by_date,
          material_requirement_lines!inner(
            material_requirement_line_id,
            line_no,
            product_id,
            description,
            requirement_uom_code,
            requirement_quantity,
            base_uom_code,
            required_base_quantity,
            preferred_supplier_id,
            required_by_date,
            line_status,
            material_requirement_procurement_links(
              linked_base_quantity,
              link_status,
              is_active,
              is_deleted
            )
          )
        `)
        .eq("is_deleted", false)
        .eq("is_active", true)
        .in("requirement_status", [
          "Approved",
          "InPreparation",
          "PartiallyReady",
        ])
        .eq("material_requirement_lines.is_deleted", false)
        .eq("material_requirement_lines.is_active", true)
        .in("material_requirement_lines.line_status", [
          "Required",
          "PartiallyAllocated",
          "Ordered",
        ]);

      if (error) throw error;

      const flattened: MaterialRequirementOption[] = [];
      for (const header of data ?? []) {
        for (const line of header.material_requirement_lines ?? []) {
          const linked = (line.material_requirement_procurement_links ?? [])
            .filter(
              (link: any) =>
                !link.is_deleted &&
                link.is_active &&
                ["Active", "Completed"].includes(link.link_status),
            )
            .reduce(
              (sum: number, link: any) =>
                sum + numberValue(link.linked_base_quantity),
              0,
            );

          const required = numberValue(line.required_base_quantity);
          const outstanding = Math.max(required - linked, 0);

          if (outstanding <= 0) continue;

          flattened.push({
            material_requirement_id: header.material_requirement_id,
            material_requirement_no: header.material_requirement_no,
            requirement_status: header.requirement_status,
            project_id: header.project_id,
            site_id: header.site_id,
            required_by_date: header.required_by_date,
            material_requirement_line_id: line.material_requirement_line_id,
            line_no: line.line_no,
            product_id: line.product_id,
            description: line.description,
            requirement_uom_code: line.requirement_uom_code,
            requirement_quantity: numberValue(line.requirement_quantity),
            base_uom_code: line.base_uom_code,
            required_base_quantity: required,
            preferred_supplier_id: line.preferred_supplier_id,
            line_required_by_date: line.required_by_date,
            line_status: line.line_status,
            linked_base_quantity: linked,
            outstanding_base_quantity: outstanding,
          });
        }
      }

      return flattened;
    },
  });

  const { data: stockRequestOptions = [] } = useQuery({
    queryKey: ["purchase-order-stock-request-options"],
    queryFn: async () => {
      const { data, error } = await db
        .from("stock_requests")
        .select(`
          stock_request_id,
          stock_request_no,
          request_status,
          project_id,
          site_id,
          area_id,
          required_date,
          stock_request_items!inner(
            stock_request_item_id,
            line_no,
            product_id,
            description,
            approved_quantity,
            request_uom_code,
            base_uom_code,
            approved_base_quantity,
            conversion_factor_to_base
          )
        `)
        .eq("is_deleted", false)
        .in("request_status", ["Approved", "Ordered", "Partially Delivered"])
        .eq("stock_request_items.is_deleted", false);

      if (error) throw error;

      const flattened: StockRequestOption[] = [];
      for (const header of data ?? []) {
        for (const line of header.stock_request_items ?? []) {
          if (numberValue(line.approved_base_quantity) <= 0) continue;
          flattened.push({
            stock_request_id: header.stock_request_id,
            stock_request_no: header.stock_request_no,
            request_status: header.request_status,
            project_id: header.project_id,
            site_id: header.site_id,
            area_id: header.area_id,
            required_date: header.required_date,
            stock_request_item_id: line.stock_request_item_id,
            line_no: line.line_no,
            product_id: line.product_id,
            description: line.description,
            approved_quantity: line.approved_quantity,
            request_uom_code: line.request_uom_code,
            base_uom_code: line.base_uom_code,
            approved_base_quantity: line.approved_base_quantity,
            conversion_factor_to_base: line.conversion_factor_to_base,
          });
        }
      }

      return flattened;
    },
  });

  const {
    data: purchaseOrders = [],
    isLoading: purchaseOrdersLoading,
    isError: purchaseOrdersError,
  } = useQuery({
    queryKey: ["purchase_orders"],
    queryFn: async () => {
      const { data, error } = await db
        .from("purchase_orders")
        .select(`
          purchase_order_id,
          purchase_order_no,
          supplier_id,
          project_id,
          site_id,
          order_date,
          expected_delivery_date,
          order_status,
          source_type,
          subtotal_amount,
          tax_amount,
          total_amount,
          currency_code,
          supplier_reference,
          supplier_quote_no,
          supplier_quote_date,
          payment_terms_type,
          payment_terms_days,
          default_tax_type,
          delivery_destination_type,
          delivery_contact_name,
          delivery_contact_phone,
          delivery_method,
          delivery_instructions,
          supplier_notes,
          internal_notes,
          notes,
          submitted_at,
          confirmed_at,
          cancelled_at,
          cancellation_reason,
          created_at,
          suppliers(
            supplier_code,
            supplier_name
          ),
          projects(
            project_no,
            project_name,
            customers(customer_name)
          ),
          project_sites(
            site_code,
            site_name
          ),
          purchase_order_lines(
            purchase_order_line_id,
            line_no,
            source_type,
            product_id,
            material_supplier_link_id,
            stock_request_item_id,
            description,
            purchase_uom_code,
            base_uom_code,
            conversion_factor_to_base,
            ordered_base_quantity,
            quantity,
            unit_cost,
            discount_percent,
            discount_amount,
            line_subtotal,
            tax_rate,
            tax_amount,
            line_total,
            tax_type,
            required_by_date,
            lead_time_days,
            supplier_product_code,
            supplier_product_name,
            notes,
            source_snapshot,
            products(product_code,product_name)
          )
        `)
        .eq("is_deleted", false)
        .eq("purchase_order_lines.is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as PurchaseOrderRecord[];
    },
  });

  const paymentTermsOptions = useMemo(() => {
    const values = new Set<string>();

    suppliers.forEach((supplier) => {
      if (supplier.payment_terms_type?.trim()) {
        values.add(supplier.payment_terms_type.trim());
      }
    });

    purchaseOrders.forEach((purchaseOrder) => {
      if (purchaseOrder.payment_terms_type?.trim()) {
        values.add(purchaseOrder.payment_terms_type.trim());
      }
    });

    if (paymentTermsType.trim()) {
      values.add(paymentTermsType.trim());
    }

    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [paymentTermsType, purchaseOrders, suppliers]);

  const taxTypeOptions = useMemo(() => {
    const values = new Set<string>();

    suppliers.forEach((supplier) => {
      if (supplier.default_tax_type?.trim()) {
        values.add(supplier.default_tax_type.trim());
      }
    });

    supplierLinks.forEach((link) => {
      if (link.default_tax_type?.trim()) {
        values.add(link.default_tax_type.trim());
      }
    });

    purchaseOrders.forEach((purchaseOrder) => {
      if (purchaseOrder.default_tax_type?.trim()) {
        values.add(purchaseOrder.default_tax_type.trim());
      }

      purchaseOrder.purchase_order_lines.forEach((line) => {
        if (line.tax_type?.trim()) {
          values.add(line.tax_type.trim());
        }
      });
    });

    if (defaultTaxType.trim()) {
      values.add(defaultTaxType.trim());
    }

    lines.forEach((line) => {
      if (line.tax_type.trim()) {
        values.add(line.tax_type.trim());
      }
    });

    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [
    defaultTaxType,
    lines,
    purchaseOrders,
    supplierLinks,
    suppliers,
  ]);

  const getProductUomConversions = (productIdValue: string) =>
    productUomConversions.filter(
      (conversion) => conversion.product_id === productIdValue,
    );

  const hasPurchaseUomConversion = (
    product: Product,
    uomCode: string | null | undefined,
  ) => {
    if (!uomCode) return false;

    if (uomCode === product.base_uom_code) {
      return true;
    }

    return getProductUomConversions(product.product_id).some(
      (conversion) =>
        conversion.from_uom_code === uomCode &&
        conversion.to_uom_code === product.base_uom_code,
    );
  };

  const getPurchaseUomOptions = (productIdValue: string) => {
    const product = products.find(
      (item) => item.product_id === productIdValue,
    );

    if (!product) return [];

    const options = new Set<string>();

    options.add(product.base_uom_code);

    getProductUomConversions(product.product_id)
      .filter(
        (conversion) => conversion.to_uom_code === product.base_uom_code,
      )
      .forEach((conversion) => {
        options.add(conversion.from_uom_code);
      });

    if (
      product.default_purchase_uom_code &&
      hasPurchaseUomConversion(
        product,
        product.default_purchase_uom_code,
      )
    ) {
      options.add(product.default_purchase_uom_code);
    }

    return Array.from(options).sort((a, b) => {
      if (a === product.default_purchase_uom_code) return -1;
      if (b === product.default_purchase_uom_code) return 1;
      if (a === product.base_uom_code) return -1;
      if (b === product.base_uom_code) return 1;
      return a.localeCompare(b);
    });
  };

  const getPreferredPurchaseUom = (
    product: Product | undefined,
    supplierLink: SupplierProductLink | undefined,
  ) => {
    if (!product) return "";

    if (
      supplierLink?.purchase_uom_code &&
      hasPurchaseUomConversion(
        product,
        supplierLink.purchase_uom_code,
      )
    ) {
      return supplierLink.purchase_uom_code;
    }

    if (
      product.default_purchase_uom_code &&
      hasPurchaseUomConversion(
        product,
        product.default_purchase_uom_code,
      )
    ) {
      return product.default_purchase_uom_code;
    }

    return product.base_uom_code;
  };

  const filteredSites = useMemo(
    () => sites.filter((site) => site.project_id === projectId),
    [sites, projectId],
  );

  const visibleMaterialRequirements = useMemo(
    () =>
      materialRequirementOptions.filter((option) => {
        if (projectId && option.project_id !== projectId) return false;
        if (siteId && option.site_id !== siteId) return false;
        if (
          supplierId &&
          option.preferred_supplier_id &&
          option.preferred_supplier_id !== supplierId
        ) {
          return false;
        }
        return true;
      }),
    [materialRequirementOptions, projectId, siteId, supplierId],
  );

  const visibleStockRequests = useMemo(
    () =>
      stockRequestOptions.filter((option) => {
        if (projectId && option.project_id !== projectId) return false;
        if (siteId && option.site_id !== siteId) return false;
        return true;
      }),
    [stockRequestOptions, projectId, siteId],
  );

  const formTotals = useMemo(() => {
    return lines.reduce(
      (totals, line) => {
        const quantity = numberValue(line.quantity);
        const unitCost = numberValue(line.unit_cost);
        const discountPercent = numberValue(line.discount_percent);
        const taxRate = numberValue(line.tax_rate);
        const gross = quantity * unitCost;
        const discount = gross * (discountPercent / 100);
        const subtotal = gross - discount;
        const tax = subtotal * (taxRate / 100);

        return {
          subtotal: totals.subtotal + subtotal,
          tax: totals.tax + tax,
          total: totals.total + subtotal + tax,
        };
      },
      { subtotal: 0, tax: 0, total: 0 },
    );
  }, [lines]);

  const filteredPurchaseOrders = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return purchaseOrders.filter((po) => {
      if (statusFilter !== "All" && po.order_status !== statusFilter) {
        return false;
      }
      if (supplierFilter !== "All" && po.supplier_id !== supplierFilter) {
        return false;
      }

      if (!keyword) return true;

      const values = [
        po.purchase_order_no,
        po.order_status,
        po.source_type,
        po.suppliers?.supplier_code,
        po.suppliers?.supplier_name,
        po.projects?.project_no,
        po.projects?.project_name,
        po.projects?.customers?.customer_name,
        po.project_sites?.site_code,
        po.project_sites?.site_name,
        po.supplier_reference,
      ];

      return values.some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [purchaseOrders, searchTerm, statusFilter, supplierFilter]);

  const resetForm = () => {
    setSupplierId("");
    setProjectId("");
    setSiteId("");
    setSourceType("Manual");
    setOrderDate(todayIso());
    setExpectedDeliveryDate("");
    setCurrencyCode("AUD");
    setSupplierReference("");
    setSupplierQuoteNo("");
    setSupplierQuoteDate("");
    setPaymentTermsType("");
    setPaymentTermsDays("");
    setDefaultTaxType("");
    setDeliveryDestinationType("Site");
    setDeliveryContactName("");
    setDeliveryContactPhone("");
    setDeliveryMethod("");
    setDeliveryInstructions("");
    setSupplierNotes("");
    setInternalNotes("");
    setHeaderNotes("");
    setLines([newLine()]);
    setSelectedPurchaseOrder(null);
    setFormMode("create");
  };

  const openCreateDialog = () => {
    resetForm();
    setShowFormDialog(true);
  };

  const openEditDialog = (purchaseOrder: PurchaseOrderRecord) => {
    setSelectedPurchaseOrder(purchaseOrder);
    setFormMode("edit");
    setSupplierId(purchaseOrder.supplier_id);
    setProjectId(purchaseOrder.project_id ?? "");
    setSiteId(purchaseOrder.site_id ?? "");
    setSourceType(purchaseOrder.source_type ?? "Manual");
    setOrderDate(purchaseOrder.order_date);
    setExpectedDeliveryDate(purchaseOrder.expected_delivery_date ?? "");
    setCurrencyCode(purchaseOrder.currency_code ?? "AUD");
    setSupplierReference(purchaseOrder.supplier_reference ?? "");
    setSupplierQuoteNo(purchaseOrder.supplier_quote_no ?? "");
    setSupplierQuoteDate(purchaseOrder.supplier_quote_date ?? "");
    setPaymentTermsType(purchaseOrder.payment_terms_type ?? "");
    setPaymentTermsDays(
      purchaseOrder.payment_terms_days == null
        ? ""
        : String(purchaseOrder.payment_terms_days),
    );
    setDefaultTaxType(purchaseOrder.default_tax_type ?? "");
    setDeliveryDestinationType(
      purchaseOrder.delivery_destination_type ?? "Site",
    );
    setDeliveryContactName(purchaseOrder.delivery_contact_name ?? "");
    setDeliveryContactPhone(purchaseOrder.delivery_contact_phone ?? "");
    setDeliveryMethod(purchaseOrder.delivery_method ?? "");
    setDeliveryInstructions(purchaseOrder.delivery_instructions ?? "");
    setSupplierNotes(purchaseOrder.supplier_notes ?? "");
    setInternalNotes(purchaseOrder.internal_notes ?? "");
    setHeaderNotes(purchaseOrder.notes ?? "");
    setLines(
      purchaseOrder.purchase_order_lines
        .sort((a, b) => a.line_no - b.line_no)
        .map((line) => ({
          key: line.purchase_order_line_id,
          source_type: line.source_type ?? "Manual",
          material_requirement_line_id: String(
            line.source_snapshot?.material_requirement_line_id ?? "",
          ),
          stock_request_item_id: line.stock_request_item_id ?? "",
          product_id: line.product_id,
          material_supplier_link_id: line.material_supplier_link_id ?? "",
          description: line.description ?? "",
          purchase_uom_code: line.purchase_uom_code ?? line.base_uom_code ?? "",
          quantity: String(line.quantity ?? ""),
          unit_cost: String(line.unit_cost ?? ""),
          discount_percent: String(line.discount_percent ?? 0),
          tax_rate: String(line.tax_rate ?? 0),
          tax_type: line.tax_type ?? "",
          required_by_date: line.required_by_date ?? "",
          lead_time_days: line.lead_time_days == null
            ? ""
            : String(line.lead_time_days),
          supplier_product_code: line.supplier_product_code ??
            line.products?.product_code ?? "",
          supplier_product_name: line.supplier_product_name ??
            line.products?.product_name ?? "",
          notes: line.notes ?? "",
        })),
    );
    setShowFormDialog(true);
  };

  const openDetailDialog = (purchaseOrder: PurchaseOrderRecord) => {
    setSelectedPurchaseOrder(purchaseOrder);
    setShowDetailDialog(true);
  };

  const applySupplierDefaults = (value: string) => {
    setSupplierId(value);

    const supplier = suppliers.find((item) => item.supplier_id === value);
    if (!supplier) return;

    setCurrencyCode(supplier.default_currency ?? "AUD");
    setPaymentTermsType(supplier.payment_terms_type ?? "");
    setPaymentTermsDays(
      supplier.payment_terms_days == null
        ? ""
        : String(supplier.payment_terms_days),
    );
    setDefaultTaxType(supplier.default_tax_type ?? "");

    setLines((current) =>
      current.map((line) => {
        const product = products.find(
          (item) => item.product_id === line.product_id,
        );

        return {
          ...line,
          material_supplier_link_id: "",
          supplier_product_code: product?.product_code ?? "",
          supplier_product_name: product?.product_name ?? "",
        };
      })
    );
  };

  const updateLine = (
    key: string,
    patch: Partial<PurchaseOrderLineForm>,
  ) => {
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...patch } : line))
    );
  };

  const chooseProduct = (key: string, productIdValue: string) => {
    const product = products.find(
      (item) => item.product_id === productIdValue,
    );

    const supplierLink = supplierLinks.find(
      (item) => item.product_id === productIdValue,
    );

    const currentLine = lines.find((line) => line.key === key);
    const purchaseUomCode = getPreferredPurchaseUom(
      product,
      supplierLink,
    );

    updateLine(key, {
      product_id: productIdValue,
      quantity: currentLine?.quantity || "1",
      material_supplier_link_id: supplierLink?.material_supplier_link_id ?? "",
      description: product?.description || product?.product_name || "",
      purchase_uom_code: purchaseUomCode,
      unit_cost: supplierLink?.last_purchase_price != null
        ? String(supplierLink.last_purchase_price)
        : supplierLink?.default_cost_price != null
        ? String(supplierLink.default_cost_price)
        : "",
      tax_type: supplierLink?.default_tax_type || defaultTaxType || "",
      lead_time_days: supplierLink?.lead_time_days == null
        ? ""
        : String(supplierLink.lead_time_days),
      supplier_product_code: supplierLink?.supplier_product_code ??
        product?.product_code ?? "",
      supplier_product_name: supplierLink?.supplier_product_name ??
        product?.product_name ?? "",
    });
  };

  const chooseMaterialRequirement = (key: string, value: string) => {
    const option = materialRequirementOptions.find(
      (item) => item.material_requirement_line_id === value,
    );
    if (!option) return;

    if (!projectId) setProjectId(option.project_id);
    if (!siteId && option.site_id) setSiteId(option.site_id);
    if (!supplierId && option.preferred_supplier_id) {
      applySupplierDefaults(option.preferred_supplier_id);
    }

    const product = products.find(
      (item) => item.product_id === option.product_id,
    );
    const supplierLink = supplierLinks.find(
      (item) => item.product_id === option.product_id,
    );

    updateLine(key, {
      source_type: "MaterialRequirement",
      material_requirement_line_id: option.material_requirement_line_id,
      stock_request_item_id: "",
      product_id: option.product_id,
      material_supplier_link_id: supplierLink?.material_supplier_link_id ?? "",
      description: option.description,
      purchase_uom_code: getPreferredPurchaseUom(product, supplierLink) ||
        option.base_uom_code,
      quantity: String(option.outstanding_base_quantity),
      unit_cost: supplierLink?.last_purchase_price != null
        ? String(supplierLink.last_purchase_price)
        : supplierLink?.default_cost_price != null
        ? String(supplierLink.default_cost_price)
        : "",
      required_by_date: option.line_required_by_date ||
        option.required_by_date || "",
      lead_time_days: supplierLink?.lead_time_days == null
        ? ""
        : String(supplierLink.lead_time_days),
      supplier_product_code: supplierLink?.supplier_product_code ??
        product?.product_code ?? "",
      supplier_product_name: supplierLink?.supplier_product_name ??
        product?.product_name ?? "",
      tax_type: supplierLink?.default_tax_type || defaultTaxType || "",
    });
  };

  const chooseStockRequest = (key: string, value: string) => {
    const option = stockRequestOptions.find(
      (item) => item.stock_request_item_id === value,
    );
    if (!option) return;

    setProjectId(option.project_id);
    setSiteId(option.site_id);

    const product = products.find(
      (item) => item.product_id === option.product_id,
    );
    const supplierLink = supplierLinks.find(
      (item) => item.product_id === option.product_id,
    );

    updateLine(key, {
      source_type: "StockRequest",
      material_requirement_line_id: "",
      stock_request_item_id: option.stock_request_item_id,
      product_id: option.product_id,
      material_supplier_link_id: supplierLink?.material_supplier_link_id ?? "",
      description: option.description || product?.product_name ||
        "Stock Request item",
      purchase_uom_code: getPreferredPurchaseUom(product, supplierLink) ||
        option.request_uom_code ||
        option.base_uom_code ||
        "",
      quantity: String(
        option.approved_quantity ??
          option.approved_base_quantity ??
          "",
      ),
      unit_cost: supplierLink?.last_purchase_price != null
        ? String(supplierLink.last_purchase_price)
        : supplierLink?.default_cost_price != null
        ? String(supplierLink.default_cost_price)
        : "",
      required_by_date: option.required_date ?? "",
      lead_time_days: supplierLink?.lead_time_days == null
        ? ""
        : String(supplierLink.lead_time_days),
      supplier_product_code: supplierLink?.supplier_product_code ??
        product?.product_code ?? "",
      supplier_product_name: supplierLink?.supplier_product_name ??
        product?.product_name ?? "",
      tax_type: supplierLink?.default_tax_type || defaultTaxType || "",
    });
  };

  const validateForm = () => {
    if (!supplierId) throw new Error("Please select a supplier.");
    if (!projectId) throw new Error("Please select a project.");
    if (!siteId) throw new Error("Please select a project site.");
    if (!orderDate) throw new Error("Please select the order date.");
    if (
      expectedDeliveryDate &&
      expectedDeliveryDate < orderDate
    ) {
      throw new Error(
        "Expected delivery date cannot be before the order date.",
      );
    }
    if (lines.length === 0) {
      throw new Error("At least one purchase order line is required.");
    }

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      if (!line.product_id) {
        throw new Error(`Please select a product on line ${lineNumber}.`);
      }
      if (!line.purchase_uom_code) {
        throw new Error(`Purchase UOM is required on line ${lineNumber}.`);
      }
      if (numberValue(line.quantity) <= 0) {
        throw new Error(
          `Quantity must be greater than zero on line ${lineNumber}.`,
        );
      }
      if (line.unit_cost === "" || numberValue(line.unit_cost) < 0) {
        throw new Error(
          `Unit cost must be zero or greater on line ${lineNumber}.`,
        );
      }
      if (
        numberValue(line.discount_percent) < 0 ||
        numberValue(line.discount_percent) > 100
      ) {
        throw new Error(
          `Discount must be between 0 and 100 on line ${lineNumber}.`,
        );
      }
      if (
        numberValue(line.tax_rate) < 0 ||
        numberValue(line.tax_rate) > 100
      ) {
        throw new Error(
          `Tax rate must be between 0 and 100 on line ${lineNumber}.`,
        );
      }
      if (
        line.source_type === "MaterialRequirement" &&
        !line.material_requirement_line_id
      ) {
        throw new Error(
          `Material Requirement source is required on line ${lineNumber}.`,
        );
      }
      if (
        line.source_type === "StockRequest" &&
        !line.stock_request_item_id
      ) {
        throw new Error(
          `Stock Request source is required on line ${lineNumber}.`,
        );
      }
    });
  };

  const buildHeaderPayload = () => ({
    source_type: sourceType,
    supplier_id: supplierId,
    project_id: projectId,
    site_id: siteId,
    order_date: orderDate,
    expected_delivery_date: expectedDeliveryDate || null,
    currency_code: currencyCode || "AUD",
    supplier_reference: supplierReference.trim() || null,
    supplier_quote_no: supplierQuoteNo.trim() || null,
    supplier_quote_date: supplierQuoteDate || null,
    payment_terms_type: paymentTermsType.trim() || null,
    payment_terms_days: paymentTermsDays === ""
      ? null
      : numberValue(paymentTermsDays),
    default_tax_type: defaultTaxType.trim() || null,
    delivery_destination_type: deliveryDestinationType,
    delivery_contact_name: deliveryContactName.trim() || null,
    delivery_contact_phone: deliveryContactPhone.trim() || null,
    delivery_method: deliveryMethod.trim() || null,
    delivery_instructions: deliveryInstructions.trim() || null,
    supplier_notes: supplierNotes.trim() || null,
    internal_notes: internalNotes.trim() || null,
    notes: headerNotes.trim() || null,
  });

  const buildLinePayload = () =>
    lines.map((line) => ({
      source_type: line.source_type,
      material_requirement_line_id: line.source_type === "MaterialRequirement"
        ? line.material_requirement_line_id
        : null,
      stock_request_item_id: line.source_type === "StockRequest"
        ? line.stock_request_item_id
        : null,
      product_id: line.product_id,
      material_supplier_link_id: line.material_supplier_link_id || null,
      description: line.description.trim() || null,
      purchase_uom_code: line.purchase_uom_code,
      quantity: numberValue(line.quantity),
      unit_cost: numberValue(line.unit_cost),
      discount_percent: numberValue(line.discount_percent),
      tax_rate: numberValue(line.tax_rate),
      tax_type: line.tax_type.trim() || null,
      required_by_date: line.required_by_date || null,
      lead_time_days: line.lead_time_days === ""
        ? null
        : numberValue(line.lead_time_days),
      supplier_product_code: line.supplier_product_code.trim() || null,
      supplier_product_name: line.supplier_product_name.trim() || null,
      notes: line.notes.trim() || null,
    }));

  const savePurchaseOrder = useMutation({
    mutationFn: async () => {
      validateForm();

      if (formMode === "create") {
        const { data, error } = await db.rpc(
          "create_purchase_order_atomic",
          {
            p_purchase_order: buildHeaderPayload(),
            p_lines: buildLinePayload(),
          },
        );
        if (error) throw error;
        return data;
      }

      if (!selectedPurchaseOrder) {
        throw new Error("Purchase Order was not selected.");
      }

      const { data, error } = await db.rpc(
        "update_draft_purchase_order_atomic",
        {
          p_purchase_order_id: selectedPurchaseOrder.purchase_order_id,
          p_purchase_order: buildHeaderPayload(),
          p_lines: buildLinePayload(),
        },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: async (result: any) => {
      toast.success(
        formMode === "create"
          ? `Purchase Order ${result?.purchase_order_no ?? ""} created.`
          : "Draft Purchase Order updated.",
      );
      await queryClient.invalidateQueries({
        queryKey: ["purchase_orders"],
      });
      setShowFormDialog(false);
      resetForm();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const transitionMutation = useMutation({
    mutationFn: async ({
      action,
      purchaseOrder,
      reason,
    }: {
      action: "submit" | "confirm" | "cancel";
      purchaseOrder: PurchaseOrderRecord;
      reason?: string;
    }) => {
      const rpcName = action === "submit"
        ? "submit_purchase_order_atomic"
        : action === "confirm"
        ? "confirm_purchase_order_atomic"
        : "cancel_purchase_order_atomic";

      const parameters = action === "cancel"
        ? {
          p_purchase_order_id: purchaseOrder.purchase_order_id,
          p_reason: reason,
        }
        : {
          p_purchase_order_id: purchaseOrder.purchase_order_id,
        };

      const { data, error } = await db.rpc(rpcName, parameters);
      if (error) throw error;
      return { data, action };
    },
    onSuccess: async ({ action }) => {
      const message = action === "submit"
        ? "Purchase Order submitted."
        : action === "confirm"
        ? "Purchase Order confirmed."
        : "Purchase Order cancelled.";

      toast.success(message);
      await queryClient.invalidateQueries({
        queryKey: ["purchase_orders"],
      });
      setShowCancelDialog(false);
      setCancelReason("");
      setShowDetailDialog(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const exportCsv = () => {
    if (filteredPurchaseOrders.length === 0) {
      toast.error("There are no Purchase Orders to export.");
      return;
    }

    const rows = filteredPurchaseOrders.map((po) => ({
      "PO No": po.purchase_order_no,
      Supplier: po.suppliers?.supplier_name ?? "",
      "Supplier Code": po.suppliers?.supplier_code ?? "",
      Project: po.projects?.project_name ?? "",
      "Project No": po.projects?.project_no ?? "",
      Customer: po.projects?.customers?.customer_name ?? "",
      Site: po.project_sites?.site_name ?? "",
      Status: po.order_status,
      Source: po.source_type,
      "Order Date": po.order_date,
      "Expected Delivery": po.expected_delivery_date ?? "",
      Subtotal: po.subtotal_amount,
      Tax: po.tax_amount,
      Total: po.total_amount,
      Currency: po.currency_code,
    }));

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((header) => {
            const value = String(
              row[header as keyof typeof row] ?? "",
            );
            return `"${value.replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `REDS-Purchase-Orders-${todayIso()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const buildPurchaseOrderPrintSection = (
    purchaseOrder: PurchaseOrderRecord,
  ) => {
    const lineRows = [...purchaseOrder.purchase_order_lines]
      .sort((a, b) => a.line_no - b.line_no)
      .map(
        (line) => `
          <tr>
            <td>${line.line_no}</td>
            <td>
              <strong>${line.products?.product_code ?? ""}</strong><br />
              ${line.description || line.products?.product_name || ""}
            </td>
            <td>${
          line.supplier_product_code ?? line.products?.product_code ?? ""
        }</td>
            <td class="number">${numberValue(line.quantity).toFixed(2)}</td>
            <td>${line.purchase_uom_code ?? ""}</td>
            <td class="number">${
          moneyFormatter.format(
            numberValue(line.unit_cost),
          )
        }</td>
            <td class="number">${
          numberValue(
            line.discount_percent,
          ).toFixed(2)
        }%</td>
            <td class="number">${numberValue(line.tax_rate).toFixed(2)}%</td>
            <td class="number">${
          moneyFormatter.format(
            numberValue(line.line_total),
          )
        }</td>
          </tr>
        `,
      )
      .join("");

    return `
      <section class="po-document">
        <div class="header">
          <div>
            <h1>Purchase Order</h1>
            <div class="muted">REDS Timber Flooring</div>
          </div>
          <div>
            <h2>${purchaseOrder.purchase_order_no}</h2>
            <div class="row"><strong>Status:</strong> ${purchaseOrder.order_status}</div>
            <div class="row"><strong>Order date:</strong> ${
      formatDate(
        purchaseOrder.order_date,
      )
    }</div>
            <div class="row"><strong>Expected:</strong> ${
      formatDate(
        purchaseOrder.expected_delivery_date,
      )
    }</div>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <h2>Supplier</h2>
            <div class="row"><strong>${
      purchaseOrder.suppliers?.supplier_name ?? "—"
    }</strong></div>
            <div class="row">${
      purchaseOrder.suppliers?.supplier_code ?? ""
    }</div>
            <div class="row"><strong>Supplier order reference:</strong> ${
      purchaseOrder.supplier_reference ?? "—"
    }</div>
            <div class="row"><strong>Supplier quote:</strong> ${
      purchaseOrder.supplier_quote_no ?? "—"
    }</div>
          </div>
          <div class="card">
            <h2>Project & Delivery</h2>
            <div class="row"><strong>${
      purchaseOrder.projects?.project_no ?? ""
    }</strong> ${purchaseOrder.projects?.project_name ?? "—"}</div>
            <div class="row">${purchaseOrder.project_sites?.site_code ?? ""} ${
      purchaseOrder.project_sites?.site_name ?? ""
    }</div>
            <div class="row"><strong>Contact:</strong> ${
      purchaseOrder.delivery_contact_name ?? "—"
    } ${purchaseOrder.delivery_contact_phone ?? ""}</div>
            <div class="row"><strong>Method:</strong> ${
      purchaseOrder.delivery_method ?? "—"
    }</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Product / Description</th>
              <th>Supplier / Product Code</th>
              <th class="number">Qty</th>
              <th>UOM</th>
              <th class="number">Unit Cost</th>
              <th class="number">Discount</th>
              <th class="number">Tax</th>
              <th class="number">Line Total</th>
            </tr>
          </thead>
          <tbody>${lineRows}</tbody>
        </table>

        <div class="totals">
          <div class="total-row"><span>Subtotal</span><strong>${
      moneyFormatter.format(
        numberValue(purchaseOrder.subtotal_amount),
      )
    }</strong></div>
          <div class="total-row"><span>Tax</span><strong>${
      moneyFormatter.format(
        numberValue(purchaseOrder.tax_amount),
      )
    }</strong></div>
          <div class="total-row grand-total"><span>Total</span><span>${
      moneyFormatter.format(
        numberValue(purchaseOrder.total_amount),
      )
    }</span></div>
        </div>

        <div class="grid notes-grid">
          <div class="card notes">
            <h2>Delivery Instructions</h2>
            ${purchaseOrder.delivery_instructions ?? "—"}
          </div>
          <div class="card notes">
            <h2>Supplier Notes</h2>
            ${purchaseOrder.supplier_notes ?? purchaseOrder.notes ?? "—"}
          </div>
        </div>
      </section>
    `;
  };

  const openPurchaseOrderPrintWindow = (
    purchaseOrdersToPrint: PurchaseOrderRecord[],
    title: string,
  ) => {
    if (purchaseOrdersToPrint.length === 0) {
      toast.error("There are no Purchase Orders to print.");
      return;
    }

    const printWindow = window.open("", "_blank", "width=1100,height=800");
    if (!printWindow) {
      toast.error("Pop-up was blocked. Please allow pop-ups and try again.");
      return;
    }

    const documents = purchaseOrdersToPrint
      .map(buildPurchaseOrderPrintSection)
      .join("");

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: Arial, Helvetica, sans-serif;
              color: #172033;
              margin: 32px;
              font-size: 12px;
            }
            .po-document { break-after: page; page-break-after: always; }
            .po-document:last-child { break-after: auto; page-break-after: auto; }
            .header {
              display: flex;
              justify-content: space-between;
              gap: 24px;
              border-bottom: 3px solid #8f1d2c;
              padding-bottom: 18px;
              margin-bottom: 22px;
            }
            h1 { margin: 0; font-size: 28px; }
            h2 { margin: 0 0 8px; font-size: 15px; }
            .muted { color: #667085; }
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 18px;
              margin-bottom: 22px;
            }
            .notes-grid { margin-top: 24px; }
            .card {
              border: 1px solid #d7dce3;
              border-radius: 8px;
              padding: 14px;
            }
            .row { margin: 4px 0; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 18px;
            }
            th, td {
              border: 1px solid #d7dce3;
              padding: 8px;
              vertical-align: top;
            }
            th {
              background: #f3f5f7;
              text-align: left;
              font-size: 10px;
              text-transform: uppercase;
            }
            .number { text-align: right; white-space: nowrap; }
            .totals {
              width: 360px;
              margin-left: auto;
              margin-top: 16px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 6px 0;
            }
            .grand-total {
              border-top: 2px solid #172033;
              font-size: 16px;
              font-weight: bold;
            }
            .notes { white-space: pre-wrap; }
            @media print {
              body { margin: 14mm; }
              @page { size: A4 landscape; margin: 10mm; }
            }
          </style>
        </head>
        <body>
          ${documents}
          <script>
            window.onload = () => {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const printPurchaseOrder = (purchaseOrder: PurchaseOrderRecord) => {
    openPurchaseOrderPrintWindow(
      [purchaseOrder],
      purchaseOrder.purchase_order_no,
    );
  };

  const printAllPurchaseOrders = () => {
    openPurchaseOrderPrintWindow(
      filteredPurchaseOrders,
      `REDS Purchase Orders ${todayIso()}`,
    );
  };

  const lineCommercial = (line: PurchaseOrderLineForm) => {
    const quantity = numberValue(line.quantity);
    const unitCost = numberValue(line.unit_cost);
    const discountPercent = numberValue(line.discount_percent);
    const taxRate = numberValue(line.tax_rate);
    const gross = quantity * unitCost;
    const discount = gross * (discountPercent / 100);
    const subtotal = gross - discount;
    const tax = subtotal * (taxRate / 100);
    return { gross, discount, subtotal, tax, total: subtotal + tax };
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#8F1D2C]/10 p-2.5">
              <ShoppingCart className="h-7 w-7 text-[#8F1D2C]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Purchase Orders
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Prepare, approve, print and track supplier purchase orders.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={printAllPurchaseOrders}
            disabled={filteredPurchaseOrders.length === 0}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print All POs
          </Button>
          <Button variant="outline" onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button
            onClick={openCreateDialog}
            className="flex h-11 items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Purchase Order
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">Active Purchase Orders</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {purchaseOrders.filter(
              (po) => !["Delivered", "Cancelled"].includes(po.order_status),
            ).length}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">Awaiting Confirmation</div>
          <div className="mt-2 text-2xl font-bold text-amber-700">
            {purchaseOrders.filter(
              (po) => po.order_status === "Submitted",
            ).length}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">Awaiting Delivery</div>
          <div className="mt-2 text-2xl font-bold text-blue-700">
            {purchaseOrders.filter((po) =>
              ["Confirmed", "Partially Delivered"].includes(
                po.order_status,
              )
            ).length}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">Open PO Value</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {moneyFormatter.format(
              purchaseOrders
                .filter(
                  (po) => !["Delivered", "Cancelled"].includes(po.order_status),
                )
                .reduce(
                  (sum, po) => sum + numberValue(po.total_amount),
                  0,
                ),
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_260px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search PO, supplier, project, customer or site"
              className={`${inputClassName} pl-9`}
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={inputClassName}>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All statuses</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Submitted">Submitted</SelectItem>
              <SelectItem value="Confirmed">Confirmed</SelectItem>
              <SelectItem value="Partially Delivered">
                Partially Delivered
              </SelectItem>
              <SelectItem value="Delivered">Delivered</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={supplierFilter} onValueChange={setSupplierFilter}>
            <SelectTrigger className={inputClassName}>
              <SelectValue placeholder="All suppliers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All suppliers</SelectItem>
              {suppliers.map((supplier) => (
                <SelectItem
                  key={supplier.supplier_id}
                  value={supplier.supplier_id}
                >
                  {supplier.supplier_code} — {supplier.supplier_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {purchaseOrdersLoading
          ? (
            <div className="flex min-h-64 items-center justify-center gap-2 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading Purchase Orders...
            </div>
          )
          : purchaseOrdersError
          ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-2 p-6 text-center">
              <AlertCircle className="h-8 w-8 text-rose-500" />
              <div className="font-semibold text-slate-900">
                Purchase Orders could not be loaded
              </div>
              <div className="text-sm text-slate-500">
                Check the current user permission and Supabase connection.
              </div>
            </div>
          )
          : filteredPurchaseOrders.length === 0
          ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-2 p-6 text-center">
              <ShoppingCart className="h-9 w-9 text-slate-300" />
              <div className="font-semibold text-slate-900">
                No Purchase Orders found
              </div>
              <div className="text-sm text-slate-500">
                Adjust the filters or create a new Purchase Order.
              </div>
            </div>
          )
          : (
            <>
              <div className="hidden grid-cols-12 gap-3 border-b bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 lg:grid">
                <div className="col-span-2">Purchase Order</div>
                <div className="col-span-2">Supplier</div>
                <div className="col-span-3">Project / Site</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-2">Delivery</div>
                <div className="col-span-1 text-right">Total</div>
                <div className="col-span-1 text-right">Action</div>
              </div>

              {filteredPurchaseOrders.map((po) => (
                <div
                  key={po.purchase_order_id}
                  className="border-b border-slate-100 p-4 last:border-b-0 hover:bg-slate-50/60"
                >
                  <div className="grid gap-4 lg:grid-cols-12 lg:items-center">
                    <div className="lg:col-span-2">
                      <button
                        type="button"
                        onClick={() => openDetailDialog(po)}
                        className="text-left font-bold text-[#8F1D2C] hover:underline"
                      >
                        {po.purchase_order_no}
                      </button>
                      <div className="mt-1 text-xs text-slate-500">
                        {formatDate(po.order_date)} · {po.source_type}
                      </div>
                    </div>

                    <div className="lg:col-span-2">
                      <div className="font-medium text-slate-900">
                        {po.suppliers?.supplier_name ?? "—"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {po.suppliers?.supplier_code ?? "—"}
                      </div>
                    </div>

                    <div className="lg:col-span-3">
                      <div className="font-medium text-slate-900">
                        {po.projects?.project_no ?? "—"}{" "}
                        {po.projects?.project_name ?? ""}
                      </div>
                      <div className="text-xs text-slate-500">
                        {po.projects?.customers?.customer_name ?? "—"} ·{" "}
                        {po.project_sites?.site_code ?? "—"}{" "}
                        {po.project_sites?.site_name ?? ""}
                      </div>
                    </div>

                    <div className="lg:col-span-1">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                          statusClass(po.order_status)
                        }`}
                      >
                        {po.order_status}
                      </span>
                    </div>

                    <div className="lg:col-span-2">
                      <div className="text-sm text-slate-900">
                        {formatDate(po.expected_delivery_date)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {po.delivery_method || po.delivery_destination_type}
                      </div>
                    </div>

                    <div className="text-right font-bold text-slate-900 lg:col-span-1">
                      {moneyFormatter.format(numberValue(po.total_amount))}
                    </div>

                    <div className="flex justify-end gap-1 lg:col-span-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openDetailDialog(po)}
                        title="View Purchase Order"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => printPurchaseOrder(po)}
                        title="Print / Save PDF"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      {po.order_status === "Draft" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEditDialog(po)}
                          title="Edit Draft"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
      </div>

      <Dialog
        open={showFormDialog}
        onOpenChange={(open) => {
          setShowFormDialog(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-h-[92vh] max-w-7xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <PackagePlus className="h-5 w-5 text-[#8F1D2C]" />
              {formMode === "create"
                ? "New Purchase Order"
                : `Edit ${
                  selectedPurchaseOrder?.purchase_order_no ??
                    "Draft Purchase Order"
                }`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#8F1D2C] font-bold text-white">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Supplier and Source
                  </h3>
                  <p className="text-sm text-slate-500">
                    Choose the supplier and identify how this Purchase Order
                    originated.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2 xl:col-span-2">
                  <Label>Supplier *</Label>
                  <Select
                    value={supplierId}
                    onValueChange={applySupplierDefaults}
                    disabled={suppliersLoading}
                  >
                    <SelectTrigger className={inputClassName}>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem
                          key={supplier.supplier_id}
                          value={supplier.supplier_id}
                        >
                          {supplier.supplier_code} — {supplier.supplier_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {supplierId && supplierLinks.length === 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      This supplier currently has no active Supplier Product
                      Links. Products can still be ordered manually, but
                      supplier codes, supplier UOM and cost defaults will not be
                      available.
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>PO Source *</Label>
                  <Select
                    value={sourceType}
                    onValueChange={(value) =>
                      setSourceType(value as PurchaseOrderSource)}
                  >
                    <SelectTrigger className={inputClassName}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Manual">Manual</SelectItem>
                      <SelectItem value="MaterialRequirement">
                        Material Requirement
                      </SelectItem>
                      <SelectItem value="StockRequest">
                        Stock Request
                      </SelectItem>
                      <SelectItem value="Mixed">Mixed Sources</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Input
                    value={currencyCode}
                    onChange={(event) =>
                      setCurrencyCode(event.target.value.toUpperCase())}
                    className={inputClassName}
                    maxLength={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Supplier Order Reference</Label>
                  <Input
                    value={supplierReference}
                    onChange={(event) =>
                      setSupplierReference(event.target.value)}
                    className={inputClassName}
                    placeholder="Reference supplied after the order is accepted"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Supplier Quote No.</Label>
                  <Input
                    value={supplierQuoteNo}
                    onChange={(event) => setSupplierQuoteNo(event.target.value)}
                    className={inputClassName}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Supplier Quote Date</Label>
                  <Input
                    type="date"
                    value={supplierQuoteDate}
                    onChange={(event) =>
                      setSupplierQuoteDate(event.target.value)}
                    className={inputClassName}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Default Tax Type</Label>

                  <Select
                    value={defaultTaxType || "__none"}
                    onValueChange={(value) => {
                      const nextTaxType = value === "__none" ? "" : value;

                      setDefaultTaxType(nextTaxType);

                      setLines((current) => current.map((line) => ({
                        ...line,
                        tax_type: line.tax_type || nextTaxType,
                      })));
                    }}
                  >
                    <SelectTrigger className={inputClassName}>
                      <SelectValue placeholder="Not configured" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="__none">
                        Not configured
                      </SelectItem>

                      {taxTypeOptions.map((taxType) => (
                        <SelectItem key={taxType} value={taxType}>
                          {taxType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {taxTypeOptions.length === 0 && (
                    <p className="text-xs text-slate-500">
                      No Tax Type is configured for the selected supplier. Tax
                      Rate can still be entered on each line.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Payment Terms</Label>

                  <Select
                    value={paymentTermsType || "__none"}
                    onValueChange={(value) =>
                      setPaymentTermsType(
                        value === "__none" ? "" : value,
                      )}
                  >
                    <SelectTrigger className={inputClassName}>
                      <SelectValue placeholder="Select payment terms" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="__none">
                        Not configured
                      </SelectItem>

                      {paymentTermsOptions.map((term) => (
                        <SelectItem key={term} value={term}>
                          {term}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Payment Terms Days</Label>
                  <Input
                    type="number"
                    min="0"
                    value={paymentTermsDays}
                    onChange={(event) =>
                      setPaymentTermsDays(event.target.value)}
                    className={inputClassName}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#8F1D2C] font-bold text-white">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Project and Delivery
                  </h3>
                  <p className="text-sm text-slate-500">
                    Set where and when the supplier must deliver.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2 xl:col-span-2">
                  <Label>Project *</Label>
                  <Select
                    value={projectId}
                    onValueChange={(value) => {
                      setProjectId(value);
                      setSiteId("");
                    }}
                    disabled={projectsLoading}
                  >
                    <SelectTrigger className={inputClassName}>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem
                          key={project.project_id}
                          value={project.project_id}
                        >
                          {project.project_no} — {project.project_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 xl:col-span-2">
                  <Label>Project Site *</Label>
                  <Select
                    value={siteId}
                    onValueChange={setSiteId}
                    disabled={!projectId}
                  >
                    <SelectTrigger className={inputClassName}>
                      <SelectValue
                        placeholder={projectId
                          ? "Select project site"
                          : "Select project first"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSites.map((site) => (
                        <SelectItem
                          key={site.site_id}
                          value={site.site_id}
                        >
                          {site.site_code} — {site.site_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Order Date *</Label>
                  <Input
                    type="date"
                    value={orderDate}
                    onChange={(event) => setOrderDate(event.target.value)}
                    className={inputClassName}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Expected Delivery</Label>
                  <Input
                    type="date"
                    min={orderDate}
                    value={expectedDeliveryDate}
                    onChange={(event) =>
                      setExpectedDeliveryDate(event.target.value)}
                    className={inputClassName}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Destination Type</Label>
                  <Select
                    value={deliveryDestinationType}
                    onValueChange={setDeliveryDestinationType}
                  >
                    <SelectTrigger className={inputClassName}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Site">Site</SelectItem>
                      <SelectItem value="DirectDelivery">
                        Direct Delivery
                      </SelectItem>
                      <SelectItem value="Warehouse">Warehouse</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {deliveryDestinationType === "Warehouse" && (
                    <p className="text-xs text-amber-700">
                      Warehouse delivery requires a Stock Location. Stock
                      Location selection will be enabled after the Stock
                      Location UI is connected to this form.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Delivery Method</Label>
                  <Input
                    value={deliveryMethod}
                    onChange={(event) => setDeliveryMethod(event.target.value)}
                    className={inputClassName}
                    placeholder="Supplier delivery / pickup"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Delivery Contact</Label>
                  <Input
                    value={deliveryContactName}
                    onChange={(event) =>
                      setDeliveryContactName(event.target.value)}
                    className={inputClassName}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Delivery Phone</Label>
                  <Input
                    value={deliveryContactPhone}
                    onChange={(event) =>
                      setDeliveryContactPhone(event.target.value)}
                    className={inputClassName}
                  />
                </div>

                <div className="space-y-2 md:col-span-2 xl:col-span-4">
                  <Label>Delivery Instructions</Label>
                  <Textarea
                    value={deliveryInstructions}
                    onChange={(event) =>
                      setDeliveryInstructions(event.target.value)}
                    className={inputClassName}
                    rows={2}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#8F1D2C] font-bold text-white">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      Purchase Order Lines
                    </h3>
                    <p className="text-sm text-slate-500">
                      Add multiple products and preserve the operational source
                      for each line.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLines((current) => [...current, newLine()])}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Line
                </Button>
              </div>

              <div className="space-y-4">
                {lines.map((line, index) => {
                  const commercial = lineCommercial(line);
                  const selectedProduct = products.find(
                    (item) => item.product_id === line.product_id,
                  );

                  return (
                    <div
                      key={line.key}
                      className="rounded-xl border border-slate-200 bg-slate-50/40 p-4"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-900">
                            Line {index + 1}
                          </div>
                          {selectedProduct && (
                            <div className="text-xs text-slate-500">
                              {selectedProduct.product_code} —{" "}
                              {selectedProduct.product_name}
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          disabled={lines.length === 1}
                          onClick={() =>
                            setLines((current) =>
                              current.filter(
                                (item) => item.key !== line.key,
                              )
                            )}
                          title="Remove line"
                        >
                          <Trash2 className="h-4 w-4 text-rose-600" />
                        </Button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                        <div className="space-y-2">
                          <Label>Line Source</Label>
                          <Select
                            value={line.source_type}
                            onValueChange={(value) =>
                              updateLine(line.key, {
                                source_type: value as LineSource,
                                material_requirement_line_id: "",
                                stock_request_item_id: "",
                              })}
                          >
                            <SelectTrigger className={inputClassName}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Manual">Manual</SelectItem>
                              <SelectItem value="MaterialRequirement">
                                Material Requirement
                              </SelectItem>
                              <SelectItem value="StockRequest">
                                Stock Request
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {line.source_type === "MaterialRequirement" && (
                          <div className="space-y-2 md:col-span-2 xl:col-span-5">
                            <Label>Material Requirement Line *</Label>
                            <Select
                              value={line.material_requirement_line_id}
                              onValueChange={(value) =>
                                chooseMaterialRequirement(line.key, value)}
                            >
                              <SelectTrigger className={inputClassName}>
                                <SelectValue placeholder="Select an eligible Material Requirement line" />
                              </SelectTrigger>
                              <SelectContent>
                                {visibleMaterialRequirements.length === 0
                                  ? (
                                    <SelectItem value="__none" disabled>
                                      No eligible Material Requirement lines
                                    </SelectItem>
                                  )
                                  : (
                                    visibleMaterialRequirements.map((
                                      option,
                                    ) => (
                                      <SelectItem
                                        key={option
                                          .material_requirement_line_id}
                                        value={option
                                          .material_requirement_line_id}
                                      >
                                        {option.material_requirement_no} / Line
                                        {" "}
                                        {option.line_no} — {option.description}
                                        {" "}
                                        · {option.outstanding_base_quantity}
                                        {" "}
                                        {option.base_uom_code} outstanding
                                      </SelectItem>
                                    ))
                                  )}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {line.source_type === "StockRequest" && (
                          <div className="space-y-2 md:col-span-2 xl:col-span-5">
                            <Label>Approved Stock Request Item *</Label>
                            <Select
                              value={line.stock_request_item_id}
                              onValueChange={(value) =>
                                chooseStockRequest(line.key, value)}
                            >
                              <SelectTrigger className={inputClassName}>
                                <SelectValue placeholder="Select an eligible Stock Request item" />
                              </SelectTrigger>
                              <SelectContent>
                                {visibleStockRequests.length === 0
                                  ? (
                                    <SelectItem value="__none" disabled>
                                      No eligible approved Stock Request items
                                    </SelectItem>
                                  )
                                  : (
                                    visibleStockRequests.map((option) => (
                                      <SelectItem
                                        key={option.stock_request_item_id}
                                        value={option.stock_request_item_id}
                                      >
                                        {option.stock_request_no} / Line{" "}
                                        {option.line_no} —{" "}
                                        {option.description || "Stock item"} ·
                                        {" "}
                                        {option.approved_quantity ??
                                          option.approved_base_quantity}{" "}
                                        {option.request_uom_code ||
                                          option.base_uom_code}
                                      </SelectItem>
                                    ))
                                  )}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div className="space-y-2 md:col-span-2 xl:col-span-3">
                          <Label>Product *</Label>
                          <Select
                            value={line.product_id}
                            onValueChange={(value) =>
                              chooseProduct(line.key, value)}
                            disabled={productsLoading ||
                              line.source_type !== "Manual"}
                          >
                            <SelectTrigger className={inputClassName}>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem
                                  key={product.product_id}
                                  value={product.product_id}
                                >
                                  {product.product_code} —{" "}
                                  {product.product_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Purchase UOM *</Label>

                          <Select
                            value={line.purchase_uom_code || "__none"}
                            onValueChange={(value) =>
                              updateLine(line.key, {
                                purchase_uom_code: value === "__none"
                                  ? ""
                                  : value,
                              })}
                            disabled={!line.product_id}
                          >
                            <SelectTrigger className={inputClassName}>
                              <SelectValue
                                placeholder={line.product_id
                                  ? "Select Purchase UOM"
                                  : "Select product first"}
                              />
                            </SelectTrigger>

                            <SelectContent>
                              {getPurchaseUomOptions(line.product_id).length ===
                                  0
                                ? (
                                  <SelectItem value="__none" disabled>
                                    No valid Purchase UOM
                                  </SelectItem>
                                )
                                : (
                                  getPurchaseUomOptions(line.product_id).map(
                                    (uomCode) => (
                                      <SelectItem
                                        key={uomCode}
                                        value={uomCode}
                                      >
                                        {uomCode}
                                      </SelectItem>
                                    ),
                                  )
                                )}
                            </SelectContent>
                          </Select>

                          {selectedProduct?.default_purchase_uom_code &&
                            selectedProduct.default_purchase_uom_code !==
                              selectedProduct.base_uom_code &&
                            !hasPurchaseUomConversion(
                              selectedProduct,
                              selectedProduct.default_purchase_uom_code,
                            ) && (
                            <p className="text-xs text-amber-700">
                              Default Purchase UOM{" "}
                              <strong>
                                {selectedProduct.default_purchase_uom_code}
                              </strong>{" "}
                              has no active conversion to Base UOM{" "}
                              <strong>{selectedProduct.base_uom_code}</strong>.
                              Base UOM has been selected instead.
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Quantity *</Label>
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            value={line.quantity}
                            onChange={(event) =>
                              updateLine(line.key, {
                                quantity: event.target.value,
                              })}
                            className={inputClassName}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Unit Cost *</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.unit_cost}
                            onChange={(event) =>
                              updateLine(line.key, {
                                unit_cost: event.target.value,
                              })}
                            className={inputClassName}
                          />
                          {line.product_id && (
                            <p className="text-xs text-slate-500">
                              {line.material_supplier_link_id
                                ? "Loaded from the Supplier Product Link. You may adjust it for this Purchase Order."
                                : "No Supplier Product Link is configured. Enter the supplier cost for this order."}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2 xl:col-span-3">
                          <Label>Description</Label>
                          <Input
                            value={line.description}
                            onChange={(event) => updateLine(line.key, {
                              description: event.target.value,
                            })}
                            className={inputClassName}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Discount %</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={line.discount_percent}
                            onChange={(event) =>
                              updateLine(line.key, {
                                discount_percent: event.target.value,
                              })}
                            className={inputClassName}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Tax Rate %</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={line.tax_rate}
                            onChange={(event) =>
                              updateLine(line.key, {
                                tax_rate: event.target.value,
                              })}
                            className={inputClassName}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Tax Type</Label>

                          <Select
                            value={line.tax_type || "__none"}
                            onValueChange={(value) =>
                              updateLine(line.key, {
                                tax_type: value === "__none" ? "" : value,
                              })}
                          >
                            <SelectTrigger className={inputClassName}>
                              <SelectValue placeholder="Not configured" />
                            </SelectTrigger>

                            <SelectContent>
                              <SelectItem value="__none">
                                Not configured
                              </SelectItem>

                              {taxTypeOptions.map((taxType) => (
                                <SelectItem key={taxType} value={taxType}>
                                  {taxType}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Required By</Label>
                          <Input
                            type="date"
                            value={line.required_by_date}
                            onChange={(event) =>
                              updateLine(line.key, {
                                required_by_date: event.target.value,
                              })}
                            className={inputClassName}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Lead Time Days</Label>
                          <Input
                            type="number"
                            min="0"
                            value={line.lead_time_days}
                            onChange={(event) =>
                              updateLine(line.key, {
                                lead_time_days: event.target.value,
                              })}
                            className={inputClassName}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>
                            Supplier Product Code / REDS Product Code
                          </Label>
                          <Input
                            value={line.supplier_product_code}
                            onChange={(event) => updateLine(line.key, {
                              supplier_product_code: event.target.value,
                            })}
                            className={inputClassName}
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2 xl:col-span-3">
                          <Label>Line Notes</Label>
                          <Input
                            value={line.notes}
                            onChange={(event) => updateLine(line.key, {
                              notes: event.target.value,
                            })}
                            className={inputClassName}
                          />
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-3 md:col-span-2 xl:col-span-3">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <span className="text-slate-500">Gross</span>
                            <span className="text-right font-medium">
                              {moneyFormatter.format(commercial.gross)}
                            </span>
                            <span className="text-slate-500">Discount</span>
                            <span className="text-right font-medium">
                              {moneyFormatter.format(commercial.discount)}
                            </span>
                            <span className="text-slate-500">Subtotal</span>
                            <span className="text-right font-medium">
                              {moneyFormatter.format(commercial.subtotal)}
                            </span>
                            <span className="text-slate-500">Tax</span>
                            <span className="text-right font-medium">
                              {moneyFormatter.format(commercial.tax)}
                            </span>
                            <span className="font-semibold text-slate-900">
                              Line Total
                            </span>
                            <span className="text-right font-bold text-slate-900">
                              {moneyFormatter.format(commercial.total)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#8F1D2C] font-bold text-white">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Notes and Review
                  </h3>
                  <p className="text-sm text-slate-500">
                    Review the document totals before saving the Draft.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Supplier Notes</Label>
                    <Textarea
                      value={supplierNotes}
                      onChange={(event) => setSupplierNotes(event.target.value)}
                      className={inputClassName}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Internal Notes</Label>
                    <Textarea
                      value={internalNotes}
                      onChange={(event) => setInternalNotes(event.target.value)}
                      className={inputClassName}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>General Notes</Label>
                    <Textarea
                      value={headerNotes}
                      onChange={(event) => setHeaderNotes(event.target.value)}
                      className={inputClassName}
                      rows={2}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h4 className="mb-3 font-semibold text-slate-900">
                    Purchase Order Summary
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">
                        Active lines
                      </span>
                      <span className="font-medium">{lines.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Subtotal</span>
                      <span className="font-medium">
                        {moneyFormatter.format(formTotals.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tax</span>
                      <span className="font-medium">
                        {moneyFormatter.format(formTotals.tax)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-300 pt-3 text-base">
                      <span className="font-bold">Total</span>
                      <span className="font-bold">
                        {moneyFormatter.format(formTotals.total)}
                      </span>
                    </div>
                    <p className="pt-2 text-xs text-slate-500">
                      Final values are recalculated and validated by the
                      database when the Draft is saved.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="sticky bottom-0 -mx-6 -mb-6 mt-5 flex flex-col-reverse gap-2 border-t bg-white px-6 py-4 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setShowFormDialog(false)}
              disabled={savePurchaseOrder.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => savePurchaseOrder.mutate()}
              disabled={savePurchaseOrder.isPending}
              className="bg-[#8F1D2C] text-white hover:bg-[#741725]"
            >
              {savePurchaseOrder.isPending
                ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Draft...
                  </>
                )
                : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    {formMode === "create"
                      ? "Create Draft PO"
                      : "Save Draft Changes"}
                  </>
                )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
      >
        <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-3">
              <span>{selectedPurchaseOrder?.purchase_order_no}</span>
              {selectedPurchaseOrder && (
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    statusClass(selectedPurchaseOrder.order_status)
                  }`}
                >
                  {selectedPurchaseOrder.order_status}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedPurchaseOrder && (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Supplier
                  </div>
                  <div className="mt-2 font-semibold text-slate-900">
                    {selectedPurchaseOrder.suppliers?.supplier_name ?? "—"}
                  </div>
                  <div className="text-sm text-slate-500">
                    {selectedPurchaseOrder.suppliers?.supplier_code ?? "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Project
                  </div>
                  <div className="mt-2 font-semibold text-slate-900">
                    {selectedPurchaseOrder.projects?.project_no ?? "—"}
                  </div>
                  <div className="text-sm text-slate-500">
                    {selectedPurchaseOrder.projects?.project_name ?? "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Site
                  </div>
                  <div className="mt-2 font-semibold text-slate-900">
                    {selectedPurchaseOrder.project_sites?.site_code ?? "—"}
                  </div>
                  <div className="text-sm text-slate-500">
                    {selectedPurchaseOrder.project_sites?.site_name ?? "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Total
                  </div>
                  <div className="mt-2 text-xl font-bold text-slate-900">
                    {moneyFormatter.format(
                      numberValue(selectedPurchaseOrder.total_amount),
                    )}
                  </div>
                  <div className="text-sm text-slate-500">
                    {selectedPurchaseOrder.currency_code}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <div className="text-xs text-slate-500">Order Date</div>
                  <div className="font-medium">
                    {formatDate(selectedPurchaseOrder.order_date)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">
                    Expected Delivery
                  </div>
                  <div className="font-medium">
                    {formatDate(
                      selectedPurchaseOrder.expected_delivery_date,
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Source</div>
                  <div className="font-medium">
                    {selectedPurchaseOrder.source_type}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">
                    Supplier Reference
                  </div>
                  <div className="font-medium">
                    {selectedPurchaseOrder.supplier_reference ?? "—"}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-3">#</th>
                      <th className="px-3 py-3">Product</th>
                      <th className="px-3 py-3">Source</th>
                      <th className="px-3 py-3 text-right">Qty</th>
                      <th className="px-3 py-3">UOM</th>
                      <th className="px-3 py-3 text-right">Unit Cost</th>
                      <th className="px-3 py-3 text-right">Discount</th>
                      <th className="px-3 py-3 text-right">Tax</th>
                      <th className="px-3 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPurchaseOrder.purchase_order_lines
                      .sort((a, b) => a.line_no - b.line_no)
                      .map((line) => (
                        <tr
                          key={line.purchase_order_line_id}
                          className="border-t border-slate-100"
                        >
                          <td className="px-3 py-3">{line.line_no}</td>
                          <td className="px-3 py-3">
                            <div className="font-semibold text-slate-900">
                              {line.products?.product_code ?? "—"}
                            </div>
                            <div className="text-xs text-slate-500">
                              {line.description ||
                                line.products?.product_name ||
                                "—"}
                            </div>
                            {line.supplier_product_code && (
                              <div className="mt-1 text-xs text-slate-500">
                                Supplier code: {line.supplier_product_code}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            {line.source_type}
                          </td>
                          <td className="px-3 py-3 text-right">
                            {numberValue(line.quantity).toFixed(2)}
                          </td>
                          <td className="px-3 py-3">
                            {line.purchase_uom_code ?? "—"}
                          </td>
                          <td className="px-3 py-3 text-right">
                            {moneyFormatter.format(
                              numberValue(line.unit_cost),
                            )}
                          </td>
                          <td className="px-3 py-3 text-right">
                            {numberValue(line.discount_percent).toFixed(2)}%
                          </td>
                          <td className="px-3 py-3 text-right">
                            {numberValue(line.tax_rate).toFixed(2)}%
                          </td>
                          <td className="px-3 py-3 text-right font-semibold">
                            {moneyFormatter.format(
                              numberValue(line.line_total),
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Delivery Instructions
                    </div>
                    <div className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                      {selectedPurchaseOrder.delivery_instructions ?? "—"}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Notes
                    </div>
                    <div className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                      {selectedPurchaseOrder.supplier_notes ||
                        selectedPurchaseOrder.notes ||
                        "—"}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Subtotal</span>
                      <span className="font-medium">
                        {moneyFormatter.format(
                          numberValue(
                            selectedPurchaseOrder.subtotal_amount,
                          ),
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tax</span>
                      <span className="font-medium">
                        {moneyFormatter.format(
                          numberValue(selectedPurchaseOrder.tax_amount),
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-300 pt-3 text-base">
                      <span className="font-bold">Total</span>
                      <span className="font-bold">
                        {moneyFormatter.format(
                          numberValue(selectedPurchaseOrder.total_amount),
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedPurchaseOrder.order_status === "Cancelled" &&
                selectedPurchaseOrder.cancellation_reason && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                  <strong>Cancellation reason:</strong>{" "}
                  {selectedPurchaseOrder.cancellation_reason}
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => printPurchaseOrder(selectedPurchaseOrder)}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print / Save PDF
                </Button>

                {selectedPurchaseOrder.order_status === "Draft" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowDetailDialog(false);
                        openEditDialog(selectedPurchaseOrder);
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Draft
                    </Button>
                    <Button
                      onClick={() =>
                        transitionMutation.mutate({
                          action: "submit",
                          purchaseOrder: selectedPurchaseOrder,
                        })}
                      disabled={transitionMutation.isPending}
                      className="bg-amber-600 text-white hover:bg-amber-700"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Submit
                    </Button>
                  </>
                )}

                {selectedPurchaseOrder.order_status === "Submitted" && (
                  <Button
                    onClick={() =>
                      transitionMutation.mutate({
                        action: "confirm",
                        purchaseOrder: selectedPurchaseOrder,
                      })}
                    disabled={transitionMutation.isPending}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Confirm
                  </Button>
                )}

                {["Draft", "Submitted", "Confirmed"].includes(
                  selectedPurchaseOrder.order_status,
                ) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCancelReason("");
                      setShowCancelDialog(true);
                    }}
                    disabled={transitionMutation.isPending}
                    className="border-rose-200 text-rose-700 hover:bg-rose-50"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel PO
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Cancel Purchase Order</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              Cancelling a Purchase Order is recorded in the audit fields and
              releases active Material Requirement procurement links.
            </div>
            <div className="space-y-2">
              <Label>Cancellation Reason *</Label>
              <Textarea
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                className={inputClassName}
                rows={4}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              Keep Purchase Order
            </Button>
            <Button
              onClick={() => {
                if (!selectedPurchaseOrder) return;
                if (!cancelReason.trim()) {
                  toast.error("Cancellation reason is required.");
                  return;
                }
                transitionMutation.mutate({
                  action: "cancel",
                  purchaseOrder: selectedPurchaseOrder,
                  reason: cancelReason.trim(),
                });
              }}
              disabled={transitionMutation.isPending}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              {transitionMutation.isPending
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : <X className="mr-2 h-4 w-4" />}
              Confirm Cancellation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseOrders;
