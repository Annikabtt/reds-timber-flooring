import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    AlertTriangle,
    Archive,
    ArrowLeft,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    CircleDollarSign,
    Download,
    Eye,
    FileMinus2,
    FilePlus2,
    FileText,
    Loader2,
    PackageSearch,
    Pencil,
    Plus,
    Printer,
    ReceiptText,
    RefreshCw,
    Search,
    Send,
    Trash2,
    X,
    XCircle,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type RpcError = {
    message?: string;
} | null;

type RpcCaller = (
    name: string,
    args?: Record<string, unknown>,
) => Promise<{
    data: unknown;
    error: RpcError;
}>;

type PermissionMap = Record<string, boolean>;

type PageMode = "list" | "form" | "detail";

type InvoiceCreateMode =
    | "Quotation"
    | "Accepted Revision"
    | "Variation"
    | "Counter Sale";

type InvoiceWorkStatus = {
    work_order_id: string;
    work_order_no: string;
    work_order_status: string;
    source_type: string;
    source_id: string;
    base_uom_code: string;
    commercial_base_quantity: number;
    approved_base_quantity: number;
    pending_review_base_quantity: number;
    completion_percent: number;
    source_line_ids: string[];
    quantity_integrity_ok: boolean;
    invoice_eligible: boolean;
    eligibility_status: string;
    blocking_reason: string | null;
    claim_status: string | null;
    claimed_invoice_id: string | null;
    claimed_invoice_no: string | null;
    claimed_invoice_document_status: string | null;
    claimed_invoice_status: string | null;
    ui_status: "ReadyToInvoice" | "NotReady" | "Reserved" | "FullyInvoiced";
    selectable: boolean;
};

type InvoiceSourceReference = {
    invoice_source_id: string;
    source_type: string;
    source_id: string;
    source_reference: string | null;
    source_amount: number;
    is_deleted: boolean;
};

type InvoiceRow = {
    customer_invoice_id: string;
    invoice_no: string;
    invoice_type: string;
    document_status: string;
    payment_status: string;
    due_status: string;

    customer_id: string;
    customer_code: string;
    customer_name: string;

    project_id: string | null;
    project_no: string | null;
    project_name: string | null;

    project_site_id: string | null;
    site_code: string | null;
    site_name: string | null;

    invoice_date: string;
    due_date: string;

    subtotal_amount: number;
    line_discount_amount: number;
    overall_discount_amount: number;
    discount_amount: number;
    tax_amount: number;
    total_amount: number;
    paid_amount: number;
    balance_amount: number;

    currency_code: string;
    line_amount_type: "Exclusive" | "Inclusive" | "No Tax";
    customer_reference: string | null;

    active_line_count: number;
    active_source_count: number;

    source_types: string[];
    source_references: InvoiceSourceReference[];

    modified_source_line_count: number;
    excluded_source_line_count: number;
    manual_line_count: number;
    archived_manual_line_count: number;

    days_overdue: number;
    aging_bucket: string;

    total_row_count: number;
};

type CustomerOption = {
    customer_id: string;
    customer_code: string;
    customer_name: string;
    price_book_id: string | null;
};

type CustomerFinancial = {
    customer_id: string;
    default_currency: string;
    payment_terms_type: string;
    payment_terms_days: number;
    line_amount_type: string;
    discount_percent: number;
    default_tax_type: string | null;
    is_account_on_hold: boolean;
    account_hold_reason: string | null;
};

type ProjectOption = {
    project_id: string;
    project_no: string;
    project_name: string;
    customer_id: string;
};

type SiteOption = {
    site_id: string;
    site_code: string;
    site_name: string;
    project_id: string;
};

type AreaOption = {
    area_id: string;
    area_code: string;
    area_name: string;
    project_id: string;
    site_id: string;
};

type ProductOption = {
    product_id: string;
    product_code: string;
    product_name: string;
    product_type: string;
    base_uom_code: string;
    default_sales_uom_code: string | null;
    is_service_item: boolean;
};

type ProductUnitOption = {
    product_unit_id: string;
    product_id: string;
    uom_code: string;
    conversion_to_base: number;
    is_base_unit: boolean;
    is_sales_unit: boolean;
    sort_order: number;
};

type PriceBook = {
    price_book_id: string;
    price_book_code: string;
    price_book_name: string;
    is_default: boolean;
    effective_from?: string | null;
    effective_to?: string | null;
};

type PriceBookLine = {
    price_book_line_id: string;
    price_book_id: string;
    product_id: string;
    price_uom_code?: string | null;
    unit_price: number;
    minimum_price: number | null;
    effective_from?: string | null;
    effective_to?: string | null;
};

type SourceOption = {
    source_type: "Quotation" | "Quotation Revision" | "Variation";
    source_id: string;
    source_no: string;
    customer_id: string;
    project_id: string | null;
    project_site_id: string | null;
    total_amount: number;
    price_book_id: string | null;
    payment_terms_type_snapshot: string | null;
    payment_terms_days_snapshot: number | null;
    parent_quotation_no?: string | null;
    revision_no?: number | null;
};

type VariationInvoicePreviewLine = {
    variation_line_id: string;
    variation_id: string;
    line_no: number;

    product_id: string | null;
    project_area_id: string | null;

    description: string;

    sales_uom_code: string | null;
    base_uom_code: string | null;

    quantity: number;
    conversion_factor: number;
    base_quantity: number;
    allow_fractional_quantity: boolean;

    unit_price: number;
    discount_percent: number;
    discount_amount: number;

    tax_rate: number;
    tax_amount: number;
    line_total: number;

    notes: string | null;
    is_optional: boolean;
};

type VariationInvoicePreview = {
    variation_id: string;
    variation_no: string;

    customer_id: string;
    project_id: string | null;
    project_site_id: string | null;

    quotation_id: string | null;
    accepted_revision_id: string | null;

    variation_status: string;

    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    total_amount: number;

    lines: VariationInvoicePreviewLine[];
};

type InvoiceLineDraft = {
    key: string;
    line_no: number;
    line_type: string;
    product_id: string;
    project_area_id: string;
    description: string;
    sales_uom_code: string;
    base_uom_code: string;
    conversion_factor: number;
    base_quantity: number;
    allow_fractional_quantity: boolean;
    price_book_id: string;
    price_book_line_id: string;
    price_source: string;
    original_unit_price: number | null;
    standard_reference_price: number | null;
    quantity: string;
    unit_price: string;
    discount_percent: string;
    tax_rate: string;
    notes: string;
};

type InvoiceSourceDraft = {
    key: string;
    source_type: "Quotation" | "Quotation Revision" | "Variation";
    source_id: string;
    source_amount: string;
};

type InvoiceSourceMapping = {
    invoice_item_source_id: string;
    invoice_source_id: string;
    source_type: string;
    source_header_id: string;
    source_revision_id: string | null;
    source_line_id: string | null;
    source_line_no: number | null;

    original_product_id: string | null;
    original_product_code: string | null;
    original_product_name: string | null;
    original_description: string | null;
    original_quantity: number | null;
    original_uom_code: string | null;
    original_base_uom_code: string | null;
    original_conversion_factor: number | null;
    original_base_quantity: number | null;
    original_unit_price: number | null;
    original_line_amount: number | null;

    invoiced_quantity: number | null;
    invoiced_base_quantity: number | null;
    invoiced_amount: number | null;

    is_excluded: boolean;
    exclusion_reason: string | null;

    source_snapshot: Record<string, unknown> | null;
};

type InvoiceDetailLine = {
    customer_invoice_item_id: string;
    line_no: number;
    line_type: string;

    product_id: string | null;
    product_code: string | null;
    product_name: string | null;
    project_area_id: string | null;
    project_area_name?: string | null;
    area_name?: string | null;

    description: string;
    quantity: number;
    price_book_id?: string | null;
    sales_uom_code: string;
    base_uom_code: string;
    conversion_factor: number;
    base_quantity: number;
    allow_fractional_quantity: boolean;

    unit_price: number;
    line_subtotal: number;
    discount_percent: number;
    discount_amount: number;
    tax_rate: number;
    tax_amount: number;
    line_total: number;

    price_source: string;
    price_book_line_id?: string | null;
    original_unit_price: number | null;
    notes: string | null;

    is_source_line: boolean;
    is_source_modified: boolean;
    original_description: string | null;
    original_quantity: number | null;
    original_sales_uom_code: string | null;
    override_reason: string | null;

    source_mappings: InvoiceSourceMapping[];

    created_at: string;
    created_by: string | null;
    updated_at: string;
    updated_by: string | null;
};

type InvoiceDetailSource = {
    invoice_source_id: string;
    source_type: string;
    source_id: string;
    source_no?: string | null;
    source_reference: string | null;
    source_amount: number;
    is_deleted: boolean;
    created_at: string;
    created_by: string | null;
    deleted_at?: string | null;
};

type ArchivedManualLine = {
    invoice_item_source_id: string;
    customer_invoice_item_id: string | null;
    invoice_source_id: string;
    source_header_id: string;
    source_line_no: number | null;

    line_no: number | null;
    line_type: string | null;
    product_id: string | null;
    product_code: string | null;
    product_name: string | null;
    description: string | null;

    quantity: number | null;
    sales_uom_code: string | null;
    base_uom_code: string | null;
    conversion_factor: number | null;
    base_quantity: number | null;

    unit_price: number | null;
    line_subtotal: number | null;
    tax_amount: number | null;
    line_total: number | null;
    notes: string | null;

    is_excluded: boolean;
    exclusion_reason: string | null;
    source_snapshot: Record<string, unknown> | null;

    is_deleted: boolean;
    deleted_at: string | null;
};

type InvoicePayment = {
    customer_payment_allocation_id: string;
    customer_payment_id: string;
    payment_no: string;
    payment_date: string;
    payment_method: string;
    reference_no: string | null;
    allocated_amount: number;
    currency_code: string;
    payment_status: string;
};

type InvoiceDetailPermissions = {
    can_view_internal_audit: boolean;
    can_update_draft: boolean;
    can_add_manual_line: boolean;
    can_remove_manual_line: boolean;
    can_exclude_source_line: boolean;
    can_restore_source_line: boolean;
    can_override_source_line: boolean;
    can_override_discount: boolean;
};

type InvoiceDetail = {
    invoice: Record<string, unknown>;

    active_lines: InvoiceDetailLine[];
    excluded_source_lines: InvoiceSourceMapping[];
    archived_manual_lines: ArchivedManualLine[];

    active_sources: InvoiceDetailSource[];
    archived_sources: InvoiceDetailSource[];

    payments: InvoicePayment[];
    retention_ledger: Array<Record<string, unknown>>;
    audit: Array<Record<string, unknown>>;

    permissions: InvoiceDetailPermissions;
};

const PAGE_SIZE = 25;

const INPUT_CLASS =
    "h-11 rounded-xl border-[#E5E7EB] bg-[#F7F9FB] hover:border-[#9E4B4B] focus-visible:ring-[#9E4B4B]";

const TEXTAREA_CLASS =
    "rounded-xl border-[#E5E7EB] bg-[#F7F9FB] hover:border-[#9E4B4B] focus-visible:ring-[#9E4B4B]";

const RED_BUTTON =
    "flex h-11 items-center justify-center rounded-xl bg-red-600 px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-700";

const permissionCodes = [
    "invoices.view",
    "invoices.create",
    "invoices.update_draft",
    "invoices.approve",
    "invoices.issue",
    "invoices.cancel",
    "invoices.void",
    "invoices.soft_delete",
    "invoices.create_credit_note",
    "invoices.release_retention",
    "invoices.override_price_book",
    "invoices.override_unit_price",
    "invoices.override_discount",
    "products.manage_sales_prices",
] as const;

const callRpc = async <T,>(
    name: string,
    args: Record<string, unknown> = {},
): Promise<T> => {
    const { data, error } = await (supabase.rpc as unknown as RpcCaller)(
        name,
        args,
    );

    if (error) {
        throw new Error(error.message || `Failed to call ${name}`);
    }

    return data as T;
};

const today = () => new Date().toISOString().slice(0, 10);

const addDays = (date: string, days: number) => {
    const value = new Date(`${date}T00:00:00`);
    value.setDate(value.getDate() + days);
    return value.toISOString().slice(0, 10);
};

const calculateDueDateFromTerms = (
    invoiceDateValue: string,
    paymentTermsType: string,
    paymentTermsDays: number,
) => {
    if (!invoiceDateValue) return "";

    const [year, month, day] = invoiceDateValue
        .split("-")
        .map(Number);

    if (!year || !month || !day) return "";

    const days = Number.isFinite(paymentTermsDays)
        ? Math.trunc(paymentTermsDays)
        : 14;

    const type = paymentTermsType || "Days After Bill";

    const toIsoDate = (value: Date) =>
        [
            value.getFullYear(),
            String(value.getMonth() + 1).padStart(2, "0"),
            String(value.getDate()).padStart(2, "0"),
        ].join("-");

    const daysInMonth = (y: number, oneBasedMonth: number) =>
        new Date(y, oneBasedMonth, 0).getDate();

    if (type === "Days After Bill") {
        const value = new Date(year, month - 1, day);
        value.setDate(value.getDate() + days);
        return toIsoDate(value);
    }

    if (type === "Days After Bill Month") {
        const value = new Date(year, month, 1);
        value.setDate(value.getDate() + days);
        return toIsoDate(value);
    }

    if (type === "Day of Current Month") {
        const safeDay = Math.min(
            Math.max(days, 1),
            daysInMonth(year, month),
        );
        return toIsoDate(
            new Date(year, month - 1, safeDay),
        );
    }

    if (type === "Day of Following Month") {
        const nextMonthDate = new Date(year, month, 1);
        const nextYear = nextMonthDate.getFullYear();
        const nextMonth = nextMonthDate.getMonth() + 1;
        const safeDay = Math.min(
            Math.max(days, 1),
            daysInMonth(nextYear, nextMonth),
        );
        return toIsoDate(
            new Date(nextYear, nextMonth - 1, safeDay),
        );
    }

    return addDays(invoiceDateValue, 14);
};

const formatPaymentTerms = (
    paymentTermsType: unknown,
    paymentTermsDays: unknown,
) => {
    const type = String(paymentTermsType ?? "").trim();
    const rawDays = Number(paymentTermsDays);
    const days = Number.isFinite(rawDays)
        ? Math.trunc(rawDays)
        : null;

    if (!type || days === null) return "—";

    if (type === "Days After Bill") {
        return `${days} Days After Bill`;
    }
    if (type === "Days After Bill Month") {
        return `${days} Days After Bill Month`;
    }
    if (type === "Day of Current Month") {
        return `Day ${days} of Current Month`;
    }
    if (type === "Day of Following Month") {
        return `Day ${days} of Following Month`;
    }

    return `${type} ${days}`;
};

const money = (value: unknown) =>
    new Intl.NumberFormat("en-AU", {
        style: "currency",
        currency: "AUD",
    }).format(Number(value || 0));

const numberText = (
    value: unknown,
    maximumFractionDigits = 6,
) => new Intl.NumberFormat("en-AU", {
    maximumFractionDigits,
}).format(Number(value || 0));

const dateText = (value: unknown) =>
    value ? new Date(String(value)).toLocaleDateString("en-AU") : "—";

const csvCell = (value: unknown) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

const uniqueKey = () =>
    `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const normalizeLineAmountType = (
    value: string | undefined,
) => {
    if (value === "NoTax" || value === "No Tax") {
        return "No Tax";
    }

    if (value === "Inclusive") {
        return "Inclusive";
    }

    return "Exclusive";
};

const createBlankLine = (
    lineNo: number,
): InvoiceLineDraft => ({
    key: uniqueKey(),
    line_no: lineNo,
    line_type: "Product",
    product_id: "",
    project_area_id: "",
    description: "",
    sales_uom_code: "",
    base_uom_code: "",
    conversion_factor: 1,
    base_quantity: 0,
    allow_fractional_quantity: true,
    price_book_id: "",
    price_book_line_id: "",
    price_source: "Manual",
    original_unit_price: null,
    standard_reference_price: null,
    quantity: "1",
    unit_price: "",
    discount_percent: "0",
    tax_rate: "10",
    notes: "",
});

const statusBadgeClass = (status: string) => {
    switch (status) {
        case "Draft":
            return "border-slate-200 bg-slate-100 text-slate-700";

        case "Approved":
            return "border-blue-200 bg-blue-50 text-blue-700";

        case "Issued":
            return "border-emerald-200 bg-emerald-50 text-emerald-700";

        case "Voided":
        case "Cancelled":
            return "border-red-200 bg-red-50 text-red-700";

        case "Paid":
            return "border-green-200 bg-green-50 text-green-700";

        case "Partially Paid":
            return "border-amber-200 bg-amber-50 text-amber-700";

        case "Overdue":
            return "border-orange-200 bg-orange-50 text-orange-700";

        default:
            return "border-slate-200 bg-white text-slate-700";
    }
};

const SectionHeader = ({
    number,
    title,
    description,
}: {
    number: string;
    title: string;
    description: string;
}) => {
    return (
        <div className="flex items-start gap-3 border-b border-slate-200 pb-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#8B3F3F] text-sm font-bold text-white">
                {number}
            </div>

            <div>
                <h2 className="text-lg font-semibold text-slate-900">
                    {title}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    {description}
                </p>
            </div>
        </div>
    );
};

const Invoices = () => {
    const queryClient = useQueryClient();

    const [mode, setMode] = useState<PageMode>("list");
    const [editingId, setEditingId] = useState<string | null>(
        null,
    );
    const [selectedId, setSelectedId] = useState<string | null>(
        null,
    );

    const [search, setSearch] = useState("");
    const [documentStatus, setDocumentStatus] = useState("All");
    const [paymentStatus, setPaymentStatus] = useState("All");
    const [invoiceTypeFilter, setInvoiceTypeFilter] = useState("All");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [page, setPage] = useState(1);

    const [createMode, setCreateMode] = useState<InvoiceCreateMode>(
        "Quotation",
    );
    const [sourceSearch, setSourceSearch] = useState("");
    const [selectedCommercialSourceId, setSelectedCommercialSourceId] =
        useState("");
    const [selectedWorkOrderIds, setSelectedWorkOrderIds] = useState<string[]>(
        [],
    );

    const [customerId, setCustomerId] = useState("");
    const [projectId, setProjectId] = useState("");
    const [siteId, setSiteId] = useState("");
    const [priceBookId, setPriceBookId] = useState("");
    const [invoiceType, setInvoiceType] = useState("Standard");
    const [invoiceDate, setInvoiceDate] = useState(today());
    const [paymentTermsType, setPaymentTermsType] =
        useState("Days After Bill");
    const [paymentTermsDays, setPaymentTermsDays] = useState(14);
    const [dueDate, setDueDate] = useState(
        calculateDueDateFromTerms(
            today(),
            "Days After Bill",
            14,
        ),
    );
    const [customerReference, setCustomerReference] = useState("");
    const [notes, setNotes] = useState("");
    const [lineAmountType, setLineAmountType] = useState("Exclusive");
    const [customerDiscount, setCustomerDiscount] = useState(0);

    const [lines, setLines] = useState<InvoiceLineDraft[]>([
        createBlankLine(1),
    ]);

    const [sources, setSources] = useState<
        InvoiceSourceDraft[]
    >([]);

    const [showReasonDialog, setShowReasonDialog] = useState(false);

    const [reasonAction, setReasonAction] = useState<
        "cancel" | "void" | null
    >(null);

    const [reason, setReason] = useState("");

    // Selling price dialog state (Step 9A)
    const [showSellingPriceDialog, setShowSellingPriceDialog] = useState(false);
    const [sellingDialogTargetKey, setSellingDialogTargetKey] = useState<
        string | null
    >(null);
    const [sellingProductId, setSellingProductId] = useState<string | null>(
        null,
    );
    const [sellingProductCode, setSellingProductCode] = useState<string | null>(
        null,
    );
    const [sellingProductName, setSellingProductName] = useState<string | null>(
        null,
    );
    const [sellingUom, setSellingUom] = useState<string | null>(null);
    const [sellingPricesByBook, setSellingPricesByBook] = useState<
        Record<string, string>
    >({});
    const [sellingMinimumPricesByBook, setSellingMinimumPricesByBook] =
        useState<
            Record<string, string>
        >({});
    const [sellingEffectiveFrom, setSellingEffectiveFrom] = useState<string>(
        invoiceDate || today(),
    );

    const permissions = useQuery({
        queryKey: ["invoice-ui-permissions-v2"],
        queryFn: async () => {
            const result: PermissionMap = {};

            await Promise.all(
                permissionCodes.map(async (code) => {
                    result[code] = Boolean(
                        await callRpc<boolean>(
                            "has_permission",
                            {
                                p_permission_code: code,
                            },
                        ),
                    );
                }),
            );

            return result;
        },
    });

    const customers = useQuery({
        queryKey: ["invoice-customers-v2"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("customers")
                .select(
                    "customer_id, customer_code, customer_name, price_book_id",
                )
                .eq("is_deleted", false)
                .eq("is_active", true)
                .order("customer_name");

            if (error) {
                throw error;
            }

            return (data ?? []) as CustomerOption[];
        },
    });

    const customerFinancials = useQuery({
        queryKey: ["invoice-customer-financials-v2"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("customer_financial_settings")
                .select(
                    [
                        "customer_id",
                        "default_currency",
                        "payment_terms_type",
                        "payment_terms_days",
                        "line_amount_type",
                        "discount_percent",
                        "default_tax_type",
                        "is_account_on_hold",
                        "account_hold_reason",
                    ].join(", "),
                );

            if (error) {
                throw error;
            }

            return (data ?? []) as CustomerFinancial[];
        },
    });

    const projects = useQuery({
        queryKey: ["invoice-projects-v2"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("projects")
                .select(
                    "project_id, project_no, project_name, customer_id",
                )
                .eq("is_deleted", false)
                .eq("is_active", true)
                .order("project_no");

            if (error) {
                throw error;
            }

            return (data ?? []) as ProjectOption[];
        },
    });

    const sites = useQuery({
        queryKey: ["invoice-sites-v2"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("project_sites")
                .select(
                    "site_id, site_code, site_name, project_id",
                )
                .eq("is_deleted", false)
                .eq("is_active", true)
                .order("site_code");

            if (error) {
                throw error;
            }

            return (data ?? []) as SiteOption[];
        },
    });

    const areas = useQuery({
        queryKey: ["invoice-areas-v2"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("project_areas")
                .select(
                    "area_id, area_code, area_name, project_id, site_id",
                )
                .eq("is_deleted", false)
                .eq("is_active", true)
                .order("area_code");

            if (error) {
                throw error;
            }

            return (data ?? []) as AreaOption[];
        },
    });

    const products = useQuery({
        queryKey: ["invoice-products-v2"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("products")
                .select(
                    [
                        "product_id",
                        "product_code",
                        "product_name",
                        "product_type",
                        "base_uom_code",
                        "default_sales_uom_code",
                        "is_service_item",
                    ].join(", "),
                )
                .eq("is_deleted", false)
                .eq("is_active", true)
                .order("product_code");

            if (error) {
                throw error;
            }

            return (data ?? []) as ProductOption[];
        },
    });

    const productUnits = useQuery({
        queryKey: ["invoice-product-units-v3"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("product_units")
                .select(
                    [
                        "product_unit_id",
                        "product_id",
                        "uom_code",
                        "conversion_to_base",
                        "is_base_unit",
                        "is_sales_unit",
                        "sort_order",
                    ].join(", "),
                )
                .eq("is_deleted", false)
                .eq("is_active", true)
                .order("sort_order");

            if (error) {
                throw error;
            }

            return (data ?? []) as ProductUnitOption[];
        },
    });

    const priceBooks = useQuery({
        queryKey: ["invoice-price-books-v2"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("price_books")
                .select(
                    "price_book_id, price_book_code, price_book_name, is_default, effective_from, effective_to",
                )
                .eq("is_deleted", false)
                .eq("is_active", true)
                .order("price_book_name");

            if (error) {
                throw error;
            }

            return (data ?? []) as PriceBook[];
        },
    });

    const priceBookLines = useQuery({
        queryKey: ["invoice-price-book-lines-v2"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("price_book_lines")
                .select(
                    [
                        "price_book_line_id",
                        "price_book_id",
                        "product_id",
                        "price_uom_code",
                        "unit_price",
                        "minimum_price",
                        "effective_from",
                        "effective_to",
                    ].join(", "),
                )
                .eq("is_deleted", false)
                .eq("is_active", true);

            if (error) {
                throw error;
            }

            return (data ?? []) as PriceBookLine[];
        },
    });

    const sourceOptions = useQuery({
        queryKey: ["invoice-source-options-v3"],
        queryFn: async () => {
            const result: SourceOption[] = [];

            const {
                data: quotationRows,
                error: quotationError,
            } = await supabase
                .from("quotations")
                .select(
                    [
                        "quotation_id",
                        "quotation_no",
                        "customer_id",
                        "project_site_id",
                        "total_amount",
                        "price_book_id",
                        "payment_terms_type_snapshot",
                        "payment_terms_days_snapshot",
                        "accepted_revision_id",
                    ].join(", "),
                )
                .eq("quotation_status", "Accepted")
                .is("accepted_revision_id", null)
                .eq("is_deleted", false)
                .eq("is_active", true)
                .order("quotation_no");

            if (quotationError) {
                throw quotationError;
            } else {
                const quotationSiteIds = Array.from(
                    new Set(
                        (quotationRows ?? [])
                            .map((row) =>
                                row.project_site_id
                                    ? String(row.project_site_id)
                                    : ""
                            )
                            .filter(Boolean),
                    ),
                );

                const quotationProjectBySite = new Map<string, string>();

                if (quotationSiteIds.length > 0) {
                    const {
                        data: quotationSiteRows,
                        error: quotationSiteError,
                    } = await supabase
                        .from("project_sites")
                        .select("site_id, project_id")
                        .in("site_id", quotationSiteIds)
                        .eq("is_deleted", false);

                    if (quotationSiteError) {
                        throw quotationSiteError;
                    } else {
                        for (const site of quotationSiteRows ?? []) {
                            if (site.site_id && site.project_id) {
                                quotationProjectBySite.set(
                                    String(site.site_id),
                                    String(site.project_id),
                                );
                            }
                        }
                    }
                }

                for (const row of quotationRows ?? []) {
                    const quotationSiteId = row.project_site_id
                        ? String(row.project_site_id)
                        : null;

                    result.push({
                        source_type: "Quotation",
                        source_id: String(row.quotation_id),
                        source_no: String(row.quotation_no),
                        customer_id: String(row.customer_id),
                        project_id: quotationSiteId
                            ? quotationProjectBySite.get(quotationSiteId) ??
                                null
                            : null,
                        project_site_id: quotationSiteId,
                        total_amount: Number(row.total_amount || 0),
                        price_book_id: row.price_book_id
                            ? String(row.price_book_id)
                            : null,
                        payment_terms_type_snapshot:
                            row.payment_terms_type_snapshot
                                ? String(row.payment_terms_type_snapshot)
                                : null,
                        payment_terms_days_snapshot:
                            row.payment_terms_days_snapshot === null ||
                                    row.payment_terms_days_snapshot === undefined
                                ? null
                                : Number(row.payment_terms_days_snapshot),
                    });
                }
            }

            const {
                data: revisionRows,
                error: revisionError,
            } = await supabase
                .from("quotation_revisions")
                .select(
                    [
                        "revision_id",
                        "revision_no",
                        "quotation_id",
                        "customer_id",
                        "project_site_id",
                        "total_amount",
                        "price_book_id",
                        "payment_terms_type_snapshot",
                        "payment_terms_days_snapshot",
                    ].join(", "),
                )
                .eq("revision_status", "Accepted")
                .eq("is_deleted", false)
                .eq("is_active", true)
                .order("revision_no");

            if (revisionError) {
                throw revisionError;
            } else {
                const revisionQuotationIds = Array.from(
                    new Set(
                        (revisionRows ?? [])
                            .map((row) =>
                                row.quotation_id ? String(row.quotation_id) : ""
                            )
                            .filter(Boolean),
                    ),
                );

                const quotationById = new Map<
                    string,
                    {
                        quotation_no: string;
                        quotation_status: string;
                        accepted_revision_id: string | null;
                    }
                >();

                if (revisionQuotationIds.length > 0) {
                    const {
                        data: revisionParentRows,
                        error: revisionParentError,
                    } = await supabase
                        .from("quotations")
                        .select(
                            [
                                "quotation_id",
                                "quotation_no",
                                "quotation_status",
                                "accepted_revision_id",
                            ].join(", "),
                        )
                        .in(
                            "quotation_id",
                            revisionQuotationIds,
                        )
                        .eq("is_deleted", false)
                        .eq("is_active", true);

                    if (revisionParentError) {
                        throw revisionParentError;
                    } else {
                        for (
                            const parent of revisionParentRows ?? []
                        ) {
                            if (!parent.quotation_id) {
                                continue;
                            }

                            quotationById.set(
                                String(parent.quotation_id),
                                {
                                    quotation_no: String(
                                        parent.quotation_no ??
                                            "Quotation",
                                    ),
                                    quotation_status: String(
                                        parent.quotation_status ?? "",
                                    ),
                                    accepted_revision_id:
                                        parent.accepted_revision_id
                                            ? String(
                                                parent.accepted_revision_id,
                                            )
                                            : null,
                                },
                            );
                        }
                    }
                }

                const revisionSiteIds = Array.from(
                    new Set(
                        (revisionRows ?? [])
                            .map((row) =>
                                row.project_site_id
                                    ? String(row.project_site_id)
                                    : ""
                            )
                            .filter(Boolean),
                    ),
                );

                const revisionProjectBySite = new Map<string, string>();

                if (revisionSiteIds.length > 0) {
                    const {
                        data: revisionSiteRows,
                        error: revisionSiteError,
                    } = await supabase
                        .from("project_sites")
                        .select("site_id, project_id")
                        .in("site_id", revisionSiteIds)
                        .eq("is_deleted", false);

                    if (revisionSiteError) {
                        throw revisionSiteError;
                    } else {
                        for (
                            const site of revisionSiteRows ?? []
                        ) {
                            if (
                                site.site_id &&
                                site.project_id
                            ) {
                                revisionProjectBySite.set(
                                    String(site.site_id),
                                    String(site.project_id),
                                );
                            }
                        }
                    }
                }

                for (const row of revisionRows ?? []) {
                    const parent = quotationById.get(
                        String(row.quotation_id),
                    );

                    if (!parent) {
                        continue;
                    }

                    if (
                        parent.quotation_status !==
                            "Accepted"
                    ) {
                        continue;
                    }

                    if (
                        parent.accepted_revision_id !==
                            String(row.revision_id)
                    ) {
                        continue;
                    }

                    const revisionSiteId = row.project_site_id
                        ? String(row.project_site_id)
                        : null;

                    result.push({
                        source_type: "Quotation Revision",
                        source_id: String(
                            row.revision_id,
                        ),
                        source_no: `${parent.quotation_no} / Rev ${
                            Number(
                                row.revision_no || 0,
                            )
                        }`,
                        customer_id: String(
                            row.customer_id,
                        ),
                        project_id: revisionSiteId
                            ? revisionProjectBySite.get(
                                revisionSiteId,
                            ) ?? null
                            : null,
                        project_site_id: revisionSiteId,
                        total_amount: Number(
                            row.total_amount || 0,
                        ),
                        price_book_id: row.price_book_id
                            ? String(
                                row.price_book_id,
                            )
                            : null,
                        payment_terms_type_snapshot:
                            row.payment_terms_type_snapshot
                                ? String(row.payment_terms_type_snapshot)
                                : null,
                        payment_terms_days_snapshot:
                            row.payment_terms_days_snapshot === null ||
                                    row.payment_terms_days_snapshot === undefined
                                ? null
                                : Number(row.payment_terms_days_snapshot),
                        parent_quotation_no: parent.quotation_no,
                        revision_no: Number(
                            row.revision_no || 0,
                        ),
                    });
                }
            }

            const {
                data: variationRows,
                error: variationError,
            } = await supabase
                .from("variations")
                .select(
                    [
                        "variation_id",
                        "variation_no",
                        "customer_id",
                        "project_id",
                        "project_site_id",
                        "total_amount",
                        "price_book_id",
                        "payment_terms_type_snapshot",
                        "payment_terms_days_snapshot",
                    ].join(", "),
                )
                .eq("variation_status", "Accepted")
                .eq("is_deleted", false)
                .eq("is_active", true)
                .order("variation_no");

            if (variationError) {
                throw variationError;
            } else {
                for (const row of variationRows ?? []) {
                    result.push({
                        source_type: "Variation",
                        source_id: String(row.variation_id),
                        source_no: String(row.variation_no),
                        customer_id: String(row.customer_id),
                        project_id: row.project_id
                            ? String(row.project_id)
                            : null,
                        project_site_id: row.project_site_id
                            ? String(row.project_site_id)
                            : null,
                        total_amount: Number(row.total_amount || 0),
                        price_book_id: row.price_book_id
                            ? String(row.price_book_id)
                            : null,
                        payment_terms_type_snapshot:
                            row.payment_terms_type_snapshot
                                ? String(row.payment_terms_type_snapshot)
                                : null,
                        payment_terms_days_snapshot:
                            row.payment_terms_days_snapshot === null ||
                                    row.payment_terms_days_snapshot === undefined
                                ? null
                                : Number(row.payment_terms_days_snapshot),
                    });
                }
            }

            return result;
        },
    });

    const activeCommercialSourceType = useMemo<
        SourceOption["source_type"] | null
    >(() => {
        if (createMode === "Quotation") return "Quotation";
        if (createMode === "Accepted Revision") return "Quotation Revision";
        if (createMode === "Variation") return "Variation";
        return null;
    }, [createMode]);

    const invoiceWorkStatus = useQuery({
        queryKey: [
            "invoice-source-work-status-v2",
            activeCommercialSourceType,
            selectedCommercialSourceId,
        ],
        enabled: !editingId &&
            Boolean(activeCommercialSourceType) &&
            Boolean(selectedCommercialSourceId),
        queryFn: () =>
            callRpc<InvoiceWorkStatus[]>(
                "list_invoice_source_work_status",
                {
                    p_source_type: activeCommercialSourceType,
                    p_source_id: selectedCommercialSourceId,
                },
            ),
    });

    const invoiceList = useQuery({
        queryKey: [
            "invoice-list-v2",
            search,
            documentStatus,
            paymentStatus,
            invoiceTypeFilter,
            dateFrom,
            dateTo,
            page,
        ],
        queryFn: () =>
            callRpc<InvoiceRow[]>(
                "list_customer_invoices",
                {
                    p_search: search.trim() || null,
                    p_document_status: documentStatus === "All"
                        ? null
                        : documentStatus,
                    p_payment_status: paymentStatus === "All"
                        ? null
                        : paymentStatus,
                    p_invoice_type: invoiceTypeFilter === "All"
                        ? null
                        : invoiceTypeFilter,
                    p_customer_id: null,
                    p_project_id: null,
                    p_project_site_id: null,
                    p_date_from: dateFrom || null,
                    p_date_to: dateTo || null,
                    p_limit: PAGE_SIZE,
                    p_offset: (page - 1) * PAGE_SIZE,
                },
            ),
    });

    const detail = useQuery({
        queryKey: ["invoice-detail-v4", selectedId],
        enabled: Boolean(selectedId),
        queryFn: async () => {
            const [
                data,
                persistedPriceBookId,
                persistedPaymentTerms,
            ] = await Promise.all([
                callRpc<InvoiceDetail>(
                    "get_customer_invoice_detail",
                    {
                        p_invoice_id: selectedId,
                    },
                ),
                callRpc<string | null>(
                    "get_customer_invoice_price_book_id",
                    {
                        p_invoice_id: selectedId,
                    },
                ),
                callRpc<Record<string, unknown>>(
                    "get_customer_invoice_payment_terms",
                    {
                        p_invoice_id: selectedId,
                    },
                ),
            ]);

            return {
                ...data,
                invoice: {
                    ...(data.invoice ?? {}),
                    ...(persistedPaymentTerms ?? {}),
                    price_book_id:
                        persistedPriceBookId ??
                        data.invoice?.price_book_id ??
                        null,
                },
            } as InvoiceDetail;
        },
    });

    const permission = permissions.data ?? {};
    const rows = useMemo(
        () => invoiceList.data ?? [],
        [invoiceList.data],
    );

    const totalRows = Number(
        rows[0]?.total_row_count || 0,
    );

    const totalPages = Math.max(
        1,
        Math.ceil(totalRows / PAGE_SIZE),
    );

    const selectedCustomer = useMemo(
        () =>
            (customers.data ?? []).find(
                (customer) => customer.customer_id === customerId,
            ) ?? null,
        [customerId, customers.data],
    );

    const selectedFinancial = useMemo(
        () =>
            (customerFinancials.data ?? []).find(
                (item) => item.customer_id === customerId,
            ) ?? null,
        [customerId, customerFinancials.data],
    );

    const selectedProject = useMemo(
        () =>
            (projects.data ?? []).find(
                (project) => project.project_id === projectId,
            ) ?? null,
        [projectId, projects.data],
    );

    const selectedSite = useMemo(
        () =>
            (sites.data ?? []).find(
                (site) => site.site_id === siteId,
            ) ?? null,
        [siteId, sites.data],
    );

    const selectedPriceBook = useMemo(
        () =>
            (priceBooks.data ?? []).find(
                (book) => book.price_book_id === priceBookId,
            ) ?? null,
        [priceBookId, priceBooks.data],
    );

    const defaultPriceBook = useMemo(
        () =>
            (priceBooks.data ?? []).find(
                (book) => book.is_default,
            ) ?? null,
        [priceBooks.data],
    );

    const hasCommercialSource = (sources ?? []).some(
        (source) =>
            Boolean(source.source_id) &&
            (source.source_type === "Quotation" ||
                source.source_type === "Quotation Revision" ||
                source.source_type === "Variation"),
    );

    const isCommercialSourceCreate = !editingId &&
        createMode !== "Counter Sale";

    const commercialSourceOptions = useMemo(() => {
        const value = sourceSearch.trim().toLowerCase();

        return (sourceOptions.data ?? [])
            .filter((source) =>
                source.source_type === activeCommercialSourceType
            )
            .filter((source) => {
                if (!value) return true;

                const customer = (customers.data ?? []).find(
                    (item) => item.customer_id === source.customer_id,
                );

                const project = (projects.data ?? []).find(
                    (item) => item.project_id === source.project_id,
                );

                const haystack = [
                    source.source_no,
                    source.parent_quotation_no,
                    customer?.customer_code,
                    customer?.customer_name,
                    project?.project_no,
                    project?.project_name,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                return haystack.includes(value);
            });
    }, [
        sourceOptions.data,
        activeCommercialSourceType,
        sourceSearch,
        customers.data,
        projects.data,
    ]);

    const selectedCommercialSource = useMemo(
        () =>
            (sourceOptions.data ?? []).find(
                (source) =>
                    source.source_type === activeCommercialSourceType &&
                    source.source_id === selectedCommercialSourceId,
            ) ?? null,
        [
            sourceOptions.data,
            activeCommercialSourceType,
            selectedCommercialSourceId,
        ],
    );

    const commercialSourceLabel = createMode === "Accepted Revision"
        ? "Accepted Revision"
        : createMode === "Variation"
        ? "Accepted Variation"
        : "Accepted Quotation";

    useEffect(() => {
        if (
            !hasCommercialSource &&
            !priceBookId &&
            defaultPriceBook?.price_book_id
        ) {
            setPriceBookId(defaultPriceBook.price_book_id);
            setLines((current) =>
                current.map((line) => ({
                    ...line,
                    price_book_id: defaultPriceBook.price_book_id,
                }))
            );
        }
    }, [
        defaultPriceBook?.price_book_id,
        hasCommercialSource,
        priceBookId,
    ]);

    const filteredProjects = useMemo(
        () =>
            (projects.data ?? []).filter(
                (project) => project.customer_id === customerId,
            ),
        [customerId, projects.data],
    );

    const filteredSites = useMemo(
        () =>
            (sites.data ?? []).filter(
                (site) => site.project_id === projectId,
            ),
        [projectId, sites.data],
    );

    const filteredAreas = useMemo(
        () =>
            (areas.data ?? []).filter(
                (area) =>
                    area.project_id === projectId &&
                    (!siteId || area.site_id === siteId),
            ),
        [areas.data, projectId, siteId],
    );

    const availableSources = useMemo(
        () =>
            (sourceOptions.data ?? []).filter(
                (source) =>
                    source.customer_id === customerId &&
                    (!projectId ||
                        source.project_id === projectId) &&
                    (!siteId ||
                        source.project_site_id === siteId),
            ),
        [
            customerId,
            projectId,
            siteId,
            sourceOptions.data,
        ],
    );

    const summary = useMemo(
        () => ({
            invoiced: rows.reduce(
                (total, row) =>
                    total +
                    Number(row.total_amount || 0),
                0,
            ),
            paid: rows.reduce(
                (total, row) =>
                    total +
                    Number(row.paid_amount || 0),
                0,
            ),
            outstanding: rows.reduce(
                (total, row) =>
                    total +
                    Number(row.balance_amount || 0),
                0,
            ),
            overdue: rows
                .filter(
                    (row) => Number(row.days_overdue || 0) > 0,
                )
                .reduce(
                    (total, row) =>
                        total +
                        Number(row.balance_amount || 0),
                    0,
                ),
        }),
        [rows],
    );

    const lineCalculations = useMemo(
        () =>
            lines.map((line) => {
                const quantity = Number(
                    line.quantity || 0,
                );
                const unitPrice = Number(
                    line.unit_price || 0,
                );
                const discountPercent = Number(
                    line.discount_percent || 0,
                );

                const taxRate = lineAmountType === "No Tax"
                    ? 0
                    : Number(line.tax_rate || 0);

                const subtotal = quantity * unitPrice;

                const discountAmount = (subtotal * discountPercent) / 100;

                const taxable = subtotal - discountAmount;

                if (lineAmountType === "Inclusive") {
                    const taxAmount = taxRate === 0 ? 0 : taxable -
                        taxable /
                            (1 + taxRate / 100);

                    return {
                        subtotal,
                        discountAmount,
                        taxAmount,
                        total: taxable,
                    };
                }

                const taxAmount = lineAmountType === "No Tax"
                    ? 0
                    : (taxable * taxRate) / 100;

                return {
                    subtotal,
                    discountAmount,
                    taxAmount,
                    total: taxable + taxAmount,
                };
            }),
        [lineAmountType, lines],
    );

    const formTotals = useMemo(
        () =>
            lineCalculations.reduce(
                (total, line) => ({
                    subtotal: total.subtotal + line.subtotal,
                    discount: total.discount +
                        line.discountAmount,
                    tax: total.tax + line.taxAmount,
                    grandTotal: total.grandTotal + line.total,
                }),
                {
                    subtotal: 0,
                    discount: 0,
                    tax: 0,
                    grandTotal: 0,
                },
            ),
        [lineCalculations],
    );

    const resetForm = () => {
        setEditingId(null);
        setCustomerId("");
        setProjectId("");
        setSiteId("");
        setPriceBookId(defaultPriceBook?.price_book_id ?? "");
        setInvoiceType("Standard");
        setInvoiceDate(today());
        setPaymentTermsType("Days After Bill");
        setPaymentTermsDays(14);
        setDueDate(
            calculateDueDateFromTerms(
                today(),
                "Days After Bill",
                14,
            ),
        );
        setCustomerReference("");
        setNotes("");
        setLineAmountType("Exclusive");
        setCustomerDiscount(0);
        setLines([createBlankLine(1)]);
        setSources([]);
        setCreateMode("Quotation");
        setSourceSearch("");
        setSelectedCommercialSourceId("");
        setSelectedWorkOrderIds([]);
    };

    const openCreate = () => {
        resetForm();
        setMode("form");
    };

    const openDetail = (invoiceId: string) => {
        setSelectedId(invoiceId);
        setMode("detail");
    };

    const closeToList = () => {
        setMode("list");
        setSelectedId(null);
        resetForm();
    };

    const applyCustomerDefaults = (
        nextCustomerId: string,
    ) => {
        setCustomerId(nextCustomerId);
        setProjectId("");
        setSiteId("");
        setSources([]);

        const financial = (
            customerFinancials.data ?? []
        ).find(
            (item) => item.customer_id === nextCustomerId,
        );

        const customer = (
            customers.data ?? []
        ).find(
            (item) => item.customer_id === nextCustomerId,
        );

        const defaultBook = (
            priceBooks.data ?? []
        ).find((book) => book.is_default);

        const customerPriceBook = customer?.price_book_id
            ? (priceBooks.data ?? []).find(
                (book) =>
                    book.price_book_id ===
                        customer.price_book_id,
            )
            : null;

        setPriceBookId(
            customerPriceBook?.price_book_id ||
                defaultBook?.price_book_id ||
                "",
        );

        const nextPaymentTermsType =
            financial?.payment_terms_type ??
                "Days After Bill";
        const nextPaymentTermsDays = Number(
            financial?.payment_terms_days ?? 14,
        );

        setPaymentTermsType(nextPaymentTermsType);
        setPaymentTermsDays(nextPaymentTermsDays);

        const nextDiscount = Number(
            financial?.discount_percent ?? 0,
        );

        setCustomerDiscount(nextDiscount);

        setLineAmountType(
            normalizeLineAmountType(
                financial?.line_amount_type,
            ),
        );

        setDueDate(
            calculateDueDateFromTerms(
                invoiceDate,
                nextPaymentTermsType,
                nextPaymentTermsDays,
            ),
        );

        setLines((current) =>
            current.map((line) => ({
                ...line,
                discount_percent: String(nextDiscount),
            }))
        );
    };

    const changeCreateMode = (nextMode: InvoiceCreateMode) => {
        setCreateMode(nextMode);
        setSelectedCommercialSourceId("");
        setSelectedWorkOrderIds([]);
        setSourceSearch("");
        setSources([]);

        if (nextMode === "Counter Sale") {
            setCustomerId("");
            setProjectId("");
            setSiteId("");
            setPriceBookId(defaultPriceBook?.price_book_id ?? "");
            setLines([createBlankLine(1)]);
        } else {
            setCustomerId("");
            setProjectId("");
            setSiteId("");
            setPriceBookId("");
            setLines([createBlankLine(1)]);
        }
    };

    const selectCommercialSource = (sourceId: string) => {
        setSelectedCommercialSourceId(sourceId);
        setSelectedWorkOrderIds([]);

        const source = (sourceOptions.data ?? []).find(
            (item) =>
                item.source_type === activeCommercialSourceType &&
                item.source_id === sourceId,
        );

        if (!source) {
            setCustomerId("");
            setProjectId("");
            setSiteId("");
            setPriceBookId("");
            return;
        }

        const snapshotTermsType =
            source.payment_terms_type_snapshot ??
                "Days After Bill";
        const snapshotTermsDays = Number(
            source.payment_terms_days_snapshot ?? 14,
        );

        setCustomerId(source.customer_id);
        setProjectId(source.project_id ?? "");
        setSiteId(source.project_site_id ?? "");
        setPriceBookId(source.price_book_id ?? "");

        setPaymentTermsType(snapshotTermsType);
        setPaymentTermsDays(snapshotTermsDays);
        setDueDate(
            calculateDueDateFromTerms(
                invoiceDate,
                snapshotTermsType,
                snapshotTermsDays,
            ),
        );
    };

    const toggleWorkOrder = (work: InvoiceWorkStatus) => {
        if (!work.selectable) return;

        setSelectedWorkOrderIds((current) =>
            current.includes(work.work_order_id)
                ? current.filter((id) => id !== work.work_order_id)
                : [...current, work.work_order_id]
        );
    };

    const applyInvoiceDate = (
        nextDate: string,
    ) => {
        setInvoiceDate(nextDate);

        setDueDate(
            calculateDueDateFromTerms(
                nextDate,
                paymentTermsType,
                paymentTermsDays,
            ),
        );
    };

    const getProductUoms = (
        product: ProductOption,
    ) => {
        return (productUnits.data ?? [])
            .filter(
                (unit) =>
                    unit.product_id === product.product_id &&
                    unit.is_sales_unit,
            )
            .sort(
                (a, b) =>
                    Number(a.sort_order ?? 0) -
                    Number(b.sort_order ?? 0),
            )
            .map((unit) => ({
                uomCode: unit.uom_code,
                factor: Number(unit.conversion_to_base),
                // product_units is now the canonical UOM authority.
                // Fractional handling is not stored on product_units,
                // so Counter Sale keeps the existing permissive UI behavior.
                allowFractional: true,
            }));
    };

    const sellingProduct = sellingProductId
        ? (products.data ?? []).find(
            (item) => item.product_id === sellingProductId,
        ) ?? null
        : null;

    const sellingProductUoms = sellingProduct
        ? getProductUoms(sellingProduct)
        : [];

    const isDateWithinEffectiveRange = (
        value: string,
        effectiveFrom?: string | null,
        effectiveTo?: string | null,
    ) => {
        if (!value) return true;

        const date = new Date(`${value}T00:00:00`);
        const from = effectiveFrom
            ? new Date(`${effectiveFrom}T00:00:00`)
            : null;
        const to = effectiveTo ? new Date(`${effectiveTo}T23:59:59`) : null;

        if (from && date < from) return false;
        if (to && date > to) return false;
        return true;
    };

    const effectivePriceBooks = (priceBooks.data ?? []).filter(
        (book) =>
            isDateWithinEffectiveRange(
                invoiceDate,
                book.effective_from,
                book.effective_to,
            ),
    );

    const sellingPriceBooks = [...effectivePriceBooks].sort((a, b) => {
        if (a.is_default !== b.is_default) {
            return a.is_default ? -1 : 1;
        }

        return a.price_book_name.localeCompare(b.price_book_name);
    });

    const resolvePrice = (
        productId: string,
        sellingUom: string,
        pricingDate: string,
        targetPriceBookId = priceBookId,
    ): PriceBookLine | null => {
        if (!targetPriceBookId) return null;

        const candidates = (priceBookLines.data ?? []).filter(
            (line) =>
                line.price_book_id === targetPriceBookId &&
                line.product_id === productId &&
                (line.price_uom_code ?? "") === (sellingUom ?? "") &&
                isDateWithinEffectiveRange(
                    pricingDate,
                    line.effective_from,
                    line.effective_to,
                ),
        );

        return candidates[0] ?? null;
    };

    const resolveStandardReference = (
        productId: string,
        sellingUom: string,
        pricingDate: string,
    ): PriceBookLine | null => {
        if (!defaultPriceBook?.price_book_id) return null;

        return resolvePrice(
            productId,
            sellingUom,
            pricingDate,
            defaultPriceBook.price_book_id,
        );
    };

    const loadSellingPriceMatrix = (
        productId: string,
        sellingUom: string,
        pricingDate: string,
    ) => {
        const nextPrices: Record<string, string> = {};
        const nextMinimums: Record<string, string> = {};

        for (const book of sellingPriceBooks) {
            const existing = resolvePrice(
                productId,
                sellingUom,
                pricingDate,
                book.price_book_id,
            );

            nextPrices[book.price_book_id] = existing
                ? String(existing.unit_price)
                : "";
            nextMinimums[book.price_book_id] = existing?.minimum_price == null
                ? ""
                : String(existing.minimum_price);
        }

        setSellingPricesByBook(nextPrices);
        setSellingMinimumPricesByBook(nextMinimums);
    };

    const repriceDirectLines = (
        nextPriceBookId: string,
        pricingDate = invoiceDate,
    ) => {
        setLines((current) =>
            current.map((line) => {
                if (!line.product_id || !line.sales_uom_code) {
                    return {
                        ...line,
                        price_book_id: nextPriceBookId,
                    };
                }

                const price = resolvePrice(
                    line.product_id,
                    line.sales_uom_code,
                    pricingDate,
                    nextPriceBookId,
                );

                const standardReference = nextPriceBookId ===
                        defaultPriceBook?.price_book_id
                    ? null
                    : resolveStandardReference(
                        line.product_id,
                        line.sales_uom_code,
                        pricingDate,
                    );

                return {
                    ...line,
                    price_book_id: nextPriceBookId,
                    price_book_line_id: price?.price_book_line_id ?? "",
                    price_source: price
                        ? "Price Book"
                        : "Selling Price Missing",
                    original_unit_price: price
                        ? Number(price.unit_price)
                        : null,
                    unit_price: price ? String(price.unit_price) : "",
                    standard_reference_price: standardReference
                        ? Number(standardReference.unit_price)
                        : null,
                };
            })
        );
    };

    const changeDirectPriceBook = (nextPriceBookId: string) => {
        if (hasCommercialSource) return;

        setPriceBookId(nextPriceBookId);
        repriceDirectLines(nextPriceBookId);
    };

    const updateLine = (
        key: string,
        changes: Partial<InvoiceLineDraft>,
    ) => {
        setLines((current) =>
            current.map((line) =>
                line.key === key
                    ? {
                        ...line,
                        ...changes,
                    }
                    : line
            )
        );
    };

    const selectProduct = (
        lineKey: string,
        productId: string,
    ) => {
        const product = (products.data ?? []).find(
            (item) => item.product_id === productId,
        );

        if (!product) {
            updateLine(lineKey, {
                product_id: "",
                description: "",
                sales_uom_code: "",
                base_uom_code: "",
                conversion_factor: 1,
                base_quantity: 0,
                unit_price: "",
                price_book_id: priceBookId,
                price_book_line_id: "",
                price_source: "Manual",
                original_unit_price: null,
                standard_reference_price: null,
            });

            return;
        }

        const productUoms = getProductUoms(product);

        const preferredUom = productUoms.find(
            (item) =>
                item.uomCode ===
                    product.default_sales_uom_code,
        ) ?? productUoms[0];

        const preferredUomCode = preferredUom?.uomCode || product.base_uom_code;

        const price = resolvePrice(
            product.product_id,
            preferredUomCode,
            invoiceDate,
            priceBookId,
        );

        const standardReference = priceBookId ===
                defaultPriceBook?.price_book_id
            ? null
            : resolveStandardReference(
                product.product_id,
                preferredUomCode,
                invoiceDate,
            );

        const currentLine = lines.find(
            (line) => line.key === lineKey,
        ) ?? createBlankLine(lines.length + 1);

        const quantity = Number(
            currentLine.quantity || 0,
        );

        updateLine(lineKey, {
            product_id: product.product_id,
            line_type: product.is_service_item ||
                    product.product_type === "Service"
                ? "Service"
                : product.product_type ===
                        "Material"
                ? "Material"
                : "Product",
            description: product.product_name,
            sales_uom_code: preferredUom?.uomCode ||
                product.base_uom_code,
            base_uom_code: product.base_uom_code,
            conversion_factor: preferredUom?.factor ?? 1,
            base_quantity: quantity *
                (preferredUom?.factor ?? 1),
            allow_fractional_quantity: preferredUom?.allowFractional ??
                true,
            price_book_id: priceBookId,
            price_book_line_id: price?.price_book_line_id || "",
            price_source: price ? "Price Book" : "Selling Price Missing",
            original_unit_price: price ? Number(price.unit_price) : null,
            standard_reference_price: standardReference
                ? Number(standardReference.unit_price)
                : null,
            unit_price: price ? String(price.unit_price) : "",
            discount_percent: String(customerDiscount),
        });
    };

    const selectLineUom = (
        lineKey: string,
        uomCode: string,
    ) => {
        const line = lines.find(
            (item) => item.key === lineKey,
        );

        const product = (
            products.data ?? []
        ).find(
            (item) =>
                item.product_id ===
                    line?.product_id,
        );

        if (!line || !product) {
            return;
        }

        const uom = getProductUoms(
            product,
        ).find(
            (item) => item.uomCode === uomCode,
        );

        if (!uom) {
            return;
        }

        updateLine(lineKey, {
            sales_uom_code: uomCode,
            conversion_factor: uom.factor,
            allow_fractional_quantity: uom.allowFractional,
            base_quantity: Number(line.quantity || 0) *
                uom.factor,
        });
        // Re-resolve the exact selected Price Book + Product + UOM price.
        const priceForUom = resolvePrice(
            String(product.product_id),
            uomCode,
            invoiceDate,
            priceBookId,
        );

        const standardReference = priceBookId ===
                defaultPriceBook?.price_book_id
            ? null
            : resolveStandardReference(
                String(product.product_id),
                uomCode,
                invoiceDate,
            );

        updateLine(lineKey, {
            price_book_id: priceBookId,
            price_book_line_id: priceForUom?.price_book_line_id || "",
            price_source: priceForUom ? "Price Book" : "Selling Price Missing",
            original_unit_price: priceForUom
                ? Number(priceForUom.unit_price)
                : null,
            standard_reference_price: standardReference
                ? Number(standardReference.unit_price)
                : null,
            unit_price: priceForUom ? String(priceForUom.unit_price) : "",
        });
    };

    const changeQuantity = (
        lineKey: string,
        value: string,
    ) => {
        const line = lines.find(
            (item) => item.key === lineKey,
        );

        updateLine(lineKey, {
            quantity: value,
            base_quantity: Number(value || 0) *
                Number(
                    line?.conversion_factor || 1,
                ),
        });
    };

    const addLine = () => {
        setLines((current) => [
            ...current,
            createBlankLine(
                current.length + 1,
            ),
        ]);
    };

    const removeLine = (key: string) => {
        setLines((current) =>
            current
                .filter(
                    (line) => line.key !== key,
                )
                .map((line, index) => ({
                    ...line,
                    line_no: index + 1,
                }))
        );
    };

    const loadVariationSourceLines = async (
        variationId: string,
    ) => {
        const preview = await callRpc<VariationInvoicePreview>(
            "preview_accepted_variation_for_invoice",
            {
                p_variation_id: variationId,
            },
        );

        if (!preview?.lines?.length) {
            throw new Error(
                "The Accepted Variation has no Invoice lines.",
            );
        }

        setLines(
            preview.lines.map((line, index) => ({
                key: uniqueKey(),
                line_no: index + 1,

                line_type: line.product_id ? "Material" : "Manual",

                product_id: line.product_id ?? "",
                project_area_id: line.project_area_id ?? "",

                description: line.description ?? "",

                sales_uom_code: line.sales_uom_code ?? "",

                base_uom_code: line.base_uom_code ?? "",

                conversion_factor: Number(line.conversion_factor ?? 1),

                base_quantity: Number(line.base_quantity ?? 0),

                allow_fractional_quantity: Boolean(
                    line.allow_fractional_quantity ??
                        true,
                ),

                price_book_id: "",
                price_book_line_id: "",
                price_source: "Source Snapshot",

                original_unit_price: Number(line.unit_price ?? 0),

                standard_reference_price: null,

                quantity: String(line.quantity ?? 0),

                unit_price: String(line.unit_price ?? 0),

                discount_percent: String(
                    line.discount_percent ?? 0,
                ),

                tax_rate: String(line.tax_rate ?? 0),

                notes: line.notes ?? "",
            })),
        );
    };

    const addSource = () => {
        setSources((current) => [
            ...current,
            {
                key: uniqueKey(),
                source_type: "Quotation",
                source_id: "",
                source_amount: "0",
            },
        ]);
    };

    const updateSource = (
        key: string,
        changes: Partial<InvoiceSourceDraft>,
    ) => {
        setSources((current) =>
            current.map((source) =>
                source.key === key
                    ? {
                        ...source,
                        ...changes,
                    }
                    : source
            )
        );
    };

    const removeSource = (key: string) => {
        setSources((current) =>
            current.filter(
                (source) => source.key !== key,
            )
        );
    };

    // ===== ตอนที่ 1 จบตรงนี้ =====
    const saveInvoice = useMutation({
        mutationFn: async () => {
            if (!customerId) {
                throw new Error("Customer is required.");
            }

            if (!invoiceDate) {
                throw new Error("Invoice date is required.");
            }

            if (!dueDate) {
                throw new Error("Due date is required.");
            }

            if (
                new Date(dueDate) <
                    new Date(invoiceDate)
            ) {
                throw new Error(
                    "Due date cannot be before Invoice date.",
                );
            }

            if (
                selectedFinancial?.is_account_on_hold
            ) {
                throw new Error(
                    selectedFinancial.account_hold_reason ||
                        "This Customer account is on hold.",
                );
            }

            if (!editingId && createMode === "Quotation") {
                if (!selectedCommercialSourceId) {
                    throw new Error(
                        "Please select an Accepted Quotation.",
                    );
                }

                if (selectedWorkOrderIds.length === 0) {
                    throw new Error(
                        "Select at least one Ready to Invoice Work Order.",
                    );
                }

                return callRpc<string>(
                    "create_draft_invoice_from_ready_quotation_work_atomic",
                    {
                        p_quotation_id: selectedCommercialSourceId,
                        p_work_order_ids: selectedWorkOrderIds,
                        p_invoice: {
                            invoice_type: invoiceType,
                            invoice_date: invoiceDate,
                            customer_reference: customerReference.trim() ||
                                null,
                            notes: notes.trim() || null,
                        },
                    },
                );
            }

            if (!editingId && createMode === "Accepted Revision") {
                if (!selectedCommercialSourceId) {
                    throw new Error(
                        "Please select an Accepted Revision.",
                    );
                }

                if (selectedWorkOrderIds.length === 0) {
                    throw new Error(
                        "Select at least one Ready to Invoice Work Order.",
                    );
                }

                return callRpc<string>(
                    "create_draft_invoice_from_ready_revision_work_atomic",
                    {
                        p_revision_id: selectedCommercialSourceId,
                        p_work_order_ids: selectedWorkOrderIds,
                        p_invoice: {
                            invoice_type: invoiceType,
                            invoice_date: invoiceDate,
                            customer_reference: customerReference.trim() ||
                                null,
                            notes: notes.trim() || null,
                        },
                    },
                );
            }

            if (!editingId && createMode === "Variation") {
                if (!selectedCommercialSourceId) {
                    throw new Error(
                        "Please select an Accepted Variation.",
                    );
                }

                if (selectedWorkOrderIds.length === 0) {
                    throw new Error(
                        "Select at least one Ready to Invoice Work Order.",
                    );
                }

                return callRpc<string>(
                    "create_draft_invoice_from_ready_variation_work_atomic",
                    {
                        p_variation_id: selectedCommercialSourceId,
                        p_work_order_ids: selectedWorkOrderIds,
                        p_invoice: {
                            invoice_type: invoiceType,
                            invoice_date: invoiceDate,
                            customer_reference:
                                customerReference.trim() || null,
                            notes: notes.trim() || null,
                        },
                    },
                );
            }

            if (lines.length === 0) {
                throw new Error(
                    "At least one Invoice line is required.",
                );
            }

            const cleanLines = lines.map(
                (line, index) => {
                    const product = (
                        products.data ?? []
                    ).find(
                        (item) =>
                            item.product_id ===
                                line.product_id,
                    );

                    const quantity = Number(
                        line.quantity,
                    );

                    const unitPrice = Number(
                        line.unit_price,
                    );

                    const discountPercent = Number(
                        line.discount_percent,
                    );

                    const taxRate = lineAmountType === "No Tax" ? 0 : Number(
                        line.tax_rate,
                    );

                    if (
                        !line.product_id ||
                        !product
                    ) {
                        throw new Error(
                            `Line ${
                                index + 1
                            }: Please select a valid Product or Service.`,
                        );
                    }

                    if (
                        !line.sales_uom_code ||
                        !line.base_uom_code
                    ) {
                        throw new Error(
                            `Line ${
                                index + 1
                            }: Sales UOM and Base UOM are required.`,
                        );
                    }

                    if (quantity <= 0) {
                        throw new Error(
                            `Line ${
                                index + 1
                            }: Quantity must be greater than zero.`,
                        );
                    }

                    if (
                        !line.allow_fractional_quantity &&
                        quantity !==
                            Math.trunc(quantity)
                    ) {
                        throw new Error(
                            `Line ${
                                index + 1
                            }: ${line.sales_uom_code} does not allow fractional quantity.`,
                        );
                    }

                    if (
                        !Number.isFinite(
                            unitPrice,
                        ) ||
                        unitPrice < 0
                    ) {
                        throw new Error(
                            `Line ${
                                index + 1
                            }: Unit Price must be zero or greater.`,
                        );
                    }

                    if (
                        !Number.isFinite(
                            discountPercent,
                        ) ||
                        discountPercent < 0 ||
                        discountPercent > 100
                    ) {
                        throw new Error(
                            `Line ${
                                index + 1
                            }: Discount must be between 0 and 100.`,
                        );
                    }

                    return {
                        line_no: index + 1,
                        line_type: line.line_type,
                        product_id: line.product_id,
                        project_area_id: line.project_area_id ||
                            null,
                        description: line.description.trim(),
                        sales_uom_code: line.sales_uom_code,
                        quantity,
                        unit_price: unitPrice,
                        discount_percent: discountPercent,
                        tax_rate: taxRate,
                        notes: line.notes.trim() ||
                            null,
                    };
                },
            );

            const cleanSources = sources.map(
                (source, index) => {
                    if (!source.source_id) {
                        throw new Error(
                            `Source ${
                                index + 1
                            }: Please select a source document.`,
                        );
                    }

                    const amount = Number(
                        source.source_amount,
                    );

                    if (
                        !Number.isFinite(amount) ||
                        amount < 0
                    ) {
                        throw new Error(
                            `Source ${
                                index + 1
                            }: Source amount must be zero or greater.`,
                        );
                    }

                    return {
                        source_type: source.source_type,
                        source_id: source.source_id,
                        source_amount: amount,
                    };
                },
            );

            const header = {
                customer_id: customerId,
                project_id: projectId || null,
                project_site_id: siteId || null,
                price_book_id: priceBookId || null,
                invoice_type: invoiceType,
                invoice_date: invoiceDate,
                due_date: dueDate,
                customer_reference: customerReference.trim() ||
                    null,
                notes: notes.trim() || null,
            };

            if (editingId) {
                if (hasCommercialSource) {
                    return callRpc<string>(
                        "update_draft_invoice_atomic",
                        {
                            p_invoice_id: editingId,
                            p_invoice: header,
                            p_lines: cleanLines,
                            p_sources: cleanSources,
                        },
                    );
                }

                if (!priceBookId) {
                    throw new Error(
                        "Price Book is required for Counter Sale.",
                    );
                }

                if (cleanLines.length === 0) {
                    throw new Error(
                        "Add at least one Product Line for Counter Sale.",
                    );
                }

                const missingProductIndex = cleanLines.findIndex(
                    (line) => !line.product_id,
                );

                if (missingProductIndex !== -1) {
                    throw new Error(
                        `Line ${
                            missingProductIndex + 1
                        }: Product is required for Counter Sale.`,
                    );
                }

                // Existing Invoice detail does not expose price_book_line_id
                // on active_lines. Do not block Counter Sale Edit on missing
                // client-side pricing lineage metadata. The dedicated backend
                // update RPC is authoritative and resolves/validates the exact
                // Price Book + Product + Sales UOM + Invoice Date atomically.
                return callRpc<string>(
                    "update_counter_sale_invoice_atomic",
                    {
                        p_invoice_id: editingId,
                        p_invoice: header,
                        p_lines: cleanLines.map((line) => ({
                            product_id: line.product_id,
                            quantity: line.quantity,
                            sales_uom_code: line.sales_uom_code,
                            description: line.description,
                            notes: line.notes,
                        })),
                        p_price_book_id: priceBookId,
                    },
                );
            }

            // New Invoice creation
            if (hasCommercialSource) {
                // Preserve existing commercial-source creation flow
                return callRpc<string>(
                    "create_invoice_atomic",
                    {
                        p_invoice: header,
                        p_lines: cleanLines,
                        p_sources: cleanSources,
                    },
                );
            }

            // Counter Sale workflow (no Accepted commercial source).
            // One RPC owns validation + Header + Source + Lines + Mapping +
            // Audit + totals in one PostgreSQL transaction.
            if (!priceBookId) {
                throw new Error(
                    "Price Book is required for Counter Sale.",
                );
            }

            if (cleanLines.length === 0) {
                throw new Error(
                    "Add at least one Product Line for Counter Sale.",
                );
            }

            const missingProductIndex = cleanLines.findIndex(
                (line) => !line.product_id,
            );

            if (missingProductIndex !== -1) {
                throw new Error(
                    `Line ${
                        missingProductIndex + 1
                    }: Product is required for Counter Sale.`,
                );
            }

            // Frontend gives immediate feedback; backend remains authoritative
            // and re-validates exact Price Book + Product + Sales UOM.
            const missingPriceIndex = lines.findIndex(
                (line) =>
                    Boolean(line.product_id) &&
                    (!line.price_book_line_id ||
                        line.price_source === "Selling Price Missing"),
            );

            if (missingPriceIndex !== -1) {
                throw new Error(
                    `Line ${
                        missingPriceIndex + 1
                    }: Selling Price is missing in the selected Price Book. Please configure it before creating Counter Sale.`,
                );
            }

            return callRpc<string>(
                "create_counter_sale_invoice_atomic",
                {
                    p_invoice: header,
                    p_lines: cleanLines.map((line) => ({
                        product_id: line.product_id,
                        quantity: line.quantity,
                        sales_uom_code: line.sales_uom_code,
                        description: line.description,
                        notes: line.notes,
                    })),
                    p_price_book_id: priceBookId,
                },
            );
        },

        onSuccess: async (invoiceId) => {
            toast.success(
                editingId
                    ? "Draft Invoice updated successfully."
                    : "Draft Invoice created successfully.",
            );

            setSelectedId(invoiceId);
            setMode("detail");
            resetForm();

            await queryClient.invalidateQueries({
                queryKey: [
                    "invoice-list-v2",
                ],
            });

            await queryClient.invalidateQueries({
                queryKey: [
                    "invoice-detail-v2",
                ],
            });
        },

        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const workflowAction = useMutation({
        mutationFn: async ({
            rpcName,
            invoiceId,
            args,
        }: {
            rpcName: string;
            invoiceId: string;
            args?: Record<string, unknown>;
        }) =>
            callRpc<string>(rpcName, {
                p_invoice_id: invoiceId,
                ...(args ?? {}),
            }),

        onSuccess: async () => {
            toast.success(
                "Invoice workflow updated.",
            );

            setShowReasonDialog(false);
            setReason("");
            setReasonAction(null);

            await queryClient.invalidateQueries({
                queryKey: [
                    "invoice-list-v2",
                ],
            });

            await queryClient.invalidateQueries({
                queryKey: [
                    "invoice-detail-v2",
                ],
            });
        },

        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

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
            return callRpc<
                Array<{
                    price_book_id: string;
                    price_book_line_id: string;
                    unit_price: number;
                    minimum_price: number | null;
                }>
            >(
                "set_product_selling_price_matrix_atomic",
                {
                    p_product_id: productId,
                    p_price_uom_code: priceUom,
                    p_effective_from: effectiveFrom,
                    p_prices: entries,
                },
            );
        },

        onSuccess: async (savedRows, variables) => {
            toast.success("Selling prices saved.");

            await queryClient.invalidateQueries({
                queryKey: ["invoice-price-book-lines-v2"],
            });

            // Apply only the selected Direct Invoice Price Book back to the
            // target line. Other Price Books are saved for future use only.
            if (sellingDialogTargetKey && !hasCommercialSource) {
                const invoicePrice = savedRows.find(
                    (row) => row.price_book_id === priceBookId,
                );

                if (invoicePrice) {
                    const selectedUom = sellingProductUoms.find(
                        (item) => item.uomCode === variables.priceUom,
                    );

                    const standardEntry = defaultPriceBook
                        ? variables.entries.find(
                            (entry) =>
                                entry.price_book_id ===
                                    defaultPriceBook.price_book_id,
                        )
                        : null;

                    setLines((current) =>
                        current.map((line) =>
                            line.key === sellingDialogTargetKey
                                ? {
                                    ...line,
                                    sales_uom_code: variables.priceUom,
                                    conversion_factor: selectedUom?.factor ??
                                        line.conversion_factor,
                                    allow_fractional_quantity:
                                        selectedUom?.allowFractional ??
                                            line.allow_fractional_quantity,
                                    base_quantity: Number(line.quantity || 0) *
                                        (selectedUom?.factor ??
                                            line.conversion_factor),
                                    price_book_id: priceBookId,
                                    price_book_line_id:
                                        invoicePrice.price_book_line_id,
                                    price_source: "Price Book",
                                    original_unit_price: Number(
                                        invoicePrice.unit_price,
                                    ),
                                    standard_reference_price: priceBookId ===
                                            defaultPriceBook?.price_book_id
                                        ? null
                                        : standardEntry
                                        ? Number(standardEntry.unit_price)
                                        : line.standard_reference_price,
                                    unit_price: String(invoicePrice.unit_price),
                                }
                                : line
                        )
                    );
                }
            }

            setShowSellingPriceDialog(false);
            setSellingDialogTargetKey(null);
            setSellingProductId(null);
            setSellingProductCode(null);
            setSellingProductName(null);
            setSellingPricesByBook({});
            setSellingMinimumPricesByBook({});
        },

        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const openEdit = async (
        invoiceId: string,
    ) => {
        try {
            const [
                data,
                persistedPriceBookId,
                persistedPaymentTerms,
            ] = await Promise.all([
                callRpc<InvoiceDetail>(
                    "get_customer_invoice_detail",
                    {
                        p_invoice_id: invoiceId,
                    },
                ),
                callRpc<string | null>(
                    "get_customer_invoice_price_book_id",
                    {
                        p_invoice_id: invoiceId,
                    },
                ),
                callRpc<Record<string, unknown>>(
                    "get_customer_invoice_payment_terms",
                    {
                        p_invoice_id: invoiceId,
                    },
                ),
            ]);

            const invoice = {
                ...(data.invoice ?? {}),
                ...(persistedPaymentTerms ?? {}),
            };

            const detailLines = data.active_lines ?? [];

            const detailSources = data.active_sources ?? [];

            const nextCustomerId = String(
                invoice.customer_id ?? "",
            );

            const financial = (
                customerFinancials.data ?? []
            ).find(
                (item) =>
                    item.customer_id ===
                        nextCustomerId,
            );

            setEditingId(invoiceId);
            setCustomerId(
                nextCustomerId,
            );

            setProjectId(
                String(
                    invoice.project_id ?? "",
                ),
            );

            setSiteId(
                String(
                    invoice.project_site_id ??
                        "",
                ),
            );

            setPriceBookId(
                String(
                    persistedPriceBookId ??
                        invoice.price_book_id ??
                        detailLines.find(
                            (line) => Boolean(line.price_book_id),
                        )?.price_book_id ??
                        "",
                ),
            );

            setInvoiceType(
                String(
                    invoice.invoice_type ??
                        "Standard",
                ),
            );

            setInvoiceDate(
                String(
                    invoice.invoice_date ??
                        today(),
                ),
            );

            const persistedTermsType = String(
                invoice.payment_terms_type ??
                    "Days After Bill",
            );
            const persistedTermsDays = Number(
                invoice.payment_terms_days ?? 14,
            );

            setPaymentTermsType(persistedTermsType);
            setPaymentTermsDays(persistedTermsDays);

            setDueDate(
                String(
                    invoice.due_date ??
                        calculateDueDateFromTerms(
                            String(
                                invoice.invoice_date ??
                                    today(),
                            ),
                            persistedTermsType,
                            persistedTermsDays,
                        ),
                ),
            );

            setCustomerReference(
                String(
                    invoice.customer_reference ??
                        "",
                ),
            );

            setNotes(
                String(
                    invoice.notes ?? "",
                ),
            );

            setLineAmountType(
                normalizeLineAmountType(
                    String(
                        invoice.line_amount_type ??
                            financial?.line_amount_type ??
                            "Exclusive",
                    ),
                ),
            );

            setCustomerDiscount(
                Number(
                    financial?.discount_percent ??
                        0,
                ),
            );

            setLines(
                detailLines.length
                    ? detailLines.map((line, index) => ({
                        key: uniqueKey(),

                        line_no: Number(
                            line.line_no ?? index + 1,
                        ),

                        line_type: String(
                            line.line_type ?? "Product",
                        ),

                        product_id: String(
                            line.product_id ?? "",
                        ),

                        project_area_id: String(
                            line.project_area_id ?? "",
                        ),

                        description: String(
                            line.description ?? "",
                        ),

                        sales_uom_code: String(
                            line.sales_uom_code ?? "",
                        ),

                        base_uom_code: String(
                            line.base_uom_code ?? "",
                        ),

                        conversion_factor: Number(
                            line.conversion_factor ?? 1,
                        ),

                        base_quantity: Number(
                            line.base_quantity ?? 0,
                        ),

                        allow_fractional_quantity: Boolean(
                            line.allow_fractional_quantity ?? true,
                        ),

                        price_book_id: String(
                            line.price_book_id ?? "",
                        ),

                        standard_reference_price: null,

                        price_book_line_id: String(
                            line.price_book_line_id ?? "",
                        ),

                        price_source: String(
                            line.price_source ?? "Manual",
                        ),

                        original_unit_price: line.original_unit_price == null
                            ? null
                            : Number(
                                line.original_unit_price,
                            ),

                        quantity: String(
                            line.quantity ?? "1",
                        ),

                        unit_price: String(
                            line.unit_price ?? "0",
                        ),

                        discount_percent: String(
                            line.discount_percent ?? "0",
                        ),

                        tax_rate: String(
                            line.tax_rate ?? "0",
                        ),

                        notes: String(
                            line.notes ?? "",
                        ),
                    }))
                    : [
                        createBlankLine(1),
                    ],
            );

            setSources(
                detailSources
                    .filter(
                        (source) =>
                            !source.is_deleted,
                    )
                    .map((source) => ({
                        key: uniqueKey(),
                        source_type: String(
                            source.source_type ??
                                "Quotation",
                        ) as
                            | "Quotation"
                            | "Quotation Revision"
                            | "Variation",
                        source_id: String(
                            source.source_id ??
                                "",
                        ),
                        source_amount: String(
                            source.source_amount ??
                                "0",
                        ),
                    })),
            );

            setMode("form");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Unable to load Invoice.",
            );
        }
    };

    const handleSaveSellingPrice = () => {
        if (!sellingProductId) {
            toast.error("Product must be selected.");
            return;
        }

        if (!sellingUom) {
            toast.error("Selling UOM must be selected.");
            return;
        }

        const product = (products.data ?? []).find(
            (item) => item.product_id === sellingProductId,
        );

        if (!product) {
            toast.error("Selected Product is invalid.");
            return;
        }

        const validUom = getProductUoms(product).find(
            (item) => item.uomCode === sellingUom,
        );

        if (!validUom) {
            toast.error("Selected Selling UOM is not valid for this Product.");
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
            const minimumText =
                sellingMinimumPricesByBook[book.price_book_id] ?? "";

            // Blank means this Price Book remains Not Set.
            if (!priceText.trim()) continue;

            const unitPrice = Number(priceText);
            if (!Number.isFinite(unitPrice) || unitPrice < 0) {
                toast.error(
                    `${book.price_book_name} Selling Price must be >= 0.`,
                );
                return;
            }

            const minimumPrice = minimumText.trim()
                ? Number(minimumText)
                : null;

            if (
                minimumPrice !== null &&
                (!Number.isFinite(minimumPrice) || minimumPrice < 0)
            ) {
                toast.error(
                    `${book.price_book_name} Minimum Selling Price must be >= 0.`,
                );
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

        if (entries.length === 0) {
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

    const exportXlsx = async () => {
        try {
            /*
             * list_customer_invoices enforces p_limit between 1 and 500.
             * Export therefore reads all matching rows in safe 500-row pages
             * instead of bypassing the backend contract with a larger limit.
             */
            const exportRows: InvoiceRow[] = [];
            const exportPageSize = 500;
            let exportOffset = 0;

            while (true) {
                const batch = await callRpc<InvoiceRow[]>(
                    "list_customer_invoices",
                    {
                        p_search: search.trim() || null,
                        p_document_status: documentStatus === "All"
                            ? null
                            : documentStatus,
                        p_payment_status: paymentStatus === "All"
                            ? null
                            : paymentStatus,
                        p_invoice_type: invoiceTypeFilter === "All"
                            ? null
                            : invoiceTypeFilter,
                        p_customer_id: null,
                        p_project_id: null,
                        p_project_site_id: null,
                        p_date_from: dateFrom || null,
                        p_date_to: dateTo || null,
                        p_limit: exportPageSize,
                        p_offset: exportOffset,
                    },
                );

                exportRows.push(...batch);

                if (batch.length < exportPageSize) {
                    break;
                }

                exportOffset += exportPageSize;

                /*
                 * Defensive stop only. The backend page contract remains
                 * authoritative and no mutation occurs during export.
                 */
                if (exportOffset > 100000) {
                    throw new Error(
                        "Invoice export exceeded the safe paging limit.",
                    );
                }
            }

            if (!exportRows.length) {
                toast.error(
                    "No Invoice rows match the current search and filters.",
                );
                return;
            }

            const rows = exportRows.map((row) => ({
                "Invoice No.": row.invoice_no,
                "Invoice Type": row.invoice_type,
                "Customer Code": row.customer_code,
                "Customer": row.customer_name,
                "Project No.": row.project_no ?? "",
                "Project": row.project_name ?? "",
                "Site Code": row.site_code ?? "",
                "Site": row.site_name ?? "",
                "Invoice Date": row.invoice_date,
                "Due Date": row.due_date,
                "Document Status": row.document_status,
                "Payment Status": row.payment_status,
                "Tax Presentation": row.line_amount_type,
                "Subtotal": Number(row.subtotal_amount || 0),
                "Discount": Number(row.discount_amount || 0),
                "GST": Number(row.tax_amount || 0),
                "Total": Number(row.total_amount || 0),
                "Paid": Number(row.paid_amount || 0),
                "Amount Due": Number(row.balance_amount || 0),
                "Currency": row.currency_code || "AUD",
                "Customer Reference": row.customer_reference ?? "",
                "Source Types": (row.source_types ?? []).join(", "),
                "Source References": (row.source_references ?? [])
                    .map((source) =>
                        String(
                            source.source_reference ??
                                source.source_type ??
                                "",
                        )
                    )
                    .filter(Boolean)
                    .join(", "),
            }));

            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(rows);

            worksheet["!cols"] = [
                { wch: 16 },
                { wch: 16 },
                { wch: 16 },
                { wch: 32 },
                { wch: 16 },
                { wch: 28 },
                { wch: 16 },
                { wch: 28 },
                { wch: 14 },
                { wch: 14 },
                { wch: 18 },
                { wch: 18 },
                { wch: 18 },
                { wch: 14 },
                { wch: 14 },
                { wch: 14 },
                { wch: 14 },
                { wch: 14 },
                { wch: 14 },
                { wch: 12 },
                { wch: 24 },
                { wch: 24 },
                { wch: 42 },
            ];

            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                "Invoices",
            );

            XLSX.writeFile(
                workbook,
                `REDS-Invoices-${today()}.xlsx`,
                {
                    compression: true,
                },
            );

            toast.success(
                `Exported ${exportRows.length} Invoice row(s) to XLSX using the current search and filters.`,
            );
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Invoice XLSX export failed.",
            );
        }
    };

    const printPage = () => {
        window.print();
    };

    const printCustomerInvoice = async (
        invoice: Record<string, unknown>,
        detailLines: InvoiceDetailLine[],
    ) => {
        const printWindow = window.open("", "_blank");

        if (!printWindow) {
            toast.error(
                "Unable to open the Invoice print window. Please allow pop-ups and try again.",
            );
            return;
        }

        printWindow.document.write(
            "<!doctype html><html><head><title>Preparing Invoice…</title></head><body style='font-family:Arial,sans-serif;padding:32px'>Preparing Invoice…</body></html>",
        );
        printWindow.document.close();

        const escapeHtml = (value: unknown) =>
            String(value ?? "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");

        const formatMoney = (value: unknown) =>
            new Intl.NumberFormat("en-AU", {
                style: "currency",
                currency: "AUD",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(Number(value || 0));

        const formatNumber = (value: unknown) =>
            new Intl.NumberFormat("en-AU", {
                maximumFractionDigits: 6,
            }).format(Number(value || 0));

        const formatDate = (value: unknown) =>
            value ? new Date(String(value)).toLocaleDateString("en-AU") : "—";

        const customerId = String(invoice.customer_id ?? "");
        const projectSiteId = String(invoice.project_site_id ?? "");

        let customerAddress:
            | {
                address_line1?: string | null;
                address_line2?: string | null;
                suburb?: string | null;
                state?: string | null;
                postcode?: string | null;
                country?: string | null;
            }
            | null = null;

        let projectSite:
            | {
                address_line_1?: string | null;
                address_line_2?: string | null;
                suburb?: string | null;
                state?: string | null;
                postcode?: string | null;
                country?: string | null;
            }
            | null = null;

        try {
            if (customerId) {
                const { data, error } = await supabase
                    .from("customer_addresses")
                    .select(
                        "address_line1, address_line2, suburb, state, postcode, country, address_type, is_primary",
                    )
                    .eq("customer_id", customerId)
                    .eq("is_deleted", false)
                    .eq("is_active", true)
                    .order("is_primary", {
                        ascending: false,
                    });

                if (error) {
                    throw error;
                }

                const addresses = data ?? [];
                customerAddress = addresses.find(
                    (address) =>
                        String(address.address_type ?? "").toLowerCase() ===
                            "billing",
                ) ??
                    addresses.find(
                        (address) => Boolean(address.is_primary),
                    ) ??
                    addresses[0] ??
                    null;
            }

            if (projectSiteId) {
                const { data, error } = await supabase
                    .from("project_sites")
                    .select(
                        "address_line_1, address_line_2, suburb, state, postcode, country",
                    )
                    .eq("site_id", projectSiteId)
                    .eq("is_deleted", false)
                    .maybeSingle();

                if (error) {
                    throw error;
                }

                projectSite = data ?? null;
            }
        } catch (error) {
            printWindow.close();
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Unable to load Invoice address details.",
            );
            return;
        }

        const addressLines = (
            address:
                | {
                    address_line1?: string | null;
                    address_line2?: string | null;
                    address_line_1?: string | null;
                    address_line_2?: string | null;
                    suburb?: string | null;
                    state?: string | null;
                    postcode?: string | null;
                    country?: string | null;
                }
                | null,
        ) => {
            if (!address) return ["—"];

            const firstLine = address.address_line1 ??
                address.address_line_1 ??
                "";
            const secondLine = address.address_line2 ??
                address.address_line_2 ??
                "";
            const locality = [
                address.suburb,
                address.state,
                address.postcode,
            ]
                .filter(Boolean)
                .join(" ");

            return [
                firstLine,
                secondLine,
                locality,
                address.country,
            ].filter(
                (line): line is string => Boolean(String(line ?? "").trim()),
            );
        };

        const billingAddressLines = addressLines(customerAddress);
        const projectAddressLines = addressLines(projectSite);

        const lineAmountType = normalizeLineAmountType(
            String(invoice.line_amount_type ?? "Exclusive"),
        );

        const isCommercialTaxPresentation =
            lineAmountType === "Exclusive";
        const isResidentialTaxPresentation =
            lineAmountType === "Inclusive";
        const isDraftDocument =
            String(invoice.document_status ?? "") === "Draft";

        const paymentTermsDisplay = formatPaymentTerms(
            invoice.payment_terms_type,
            invoice.payment_terms_days,
        );

        const discountAmount = Number(invoice.discount_amount || 0);
        const taxAmount = Number(invoice.tax_amount || 0);
        const paidAmount = Number(invoice.paid_amount || 0);
        const balanceAmount = Number(invoice.balance_amount || 0);

        const lineRows = detailLines
            .map((line) => {
                const lineAmount = lineAmountType === "Exclusive"
                    ? Number(line.line_subtotal || 0) -
                        Number(line.discount_amount || 0)
                    : Number(line.line_total || 0);

                const productLabel = [
                    line.product_code,
                    line.description,
                ]
                    .filter(Boolean)
                    .join(" — ");

                if (isResidentialTaxPresentation) {
                    return `
                        <tr>
                            <td class="description">${
                        escapeHtml(
                            productLabel ||
                                line.product_name ||
                                "Item",
                        )
                    }</td>
                            <td class="num">${
                        escapeHtml(
                            formatMoney(lineAmount),
                        )
                    }</td>
                        </tr>
                    `;
                }

                const gstCell = isCommercialTaxPresentation
                    ? `<td class="num">${
                        escapeHtml(
                            `${formatNumber(line.tax_rate)}%`,
                        )
                    }</td>`
                    : "";

                return `
                    <tr>
                        <td class="description">${
                    escapeHtml(
                        productLabel || line.product_name || "Item",
                    )
                }</td>
                        <td class="num">${
                    escapeHtml(
                        formatNumber(line.quantity),
                    )
                }</td>
                        <td>${escapeHtml(line.sales_uom_code || "—")}</td>
                        <td class="num">${
                    escapeHtml(
                        formatMoney(line.unit_price),
                    )
                }</td>
                        ${gstCell}
                        <td class="num">${
                    escapeHtml(
                        formatMoney(lineAmount),
                    )
                }</td>
                    </tr>
                `;
            })
            .join("");

        const discountRow = discountAmount > 0
            ? `
                    <tr>
                        <td>Discount</td>
                        <td>${escapeHtml(formatMoney(discountAmount))}</td>
                    </tr>
                `
            : "";

        const summaryRows = isCommercialTaxPresentation
            ? `
                    <tr>
                        <td>Subtotal</td>
                        <td>${
                escapeHtml(
                    formatMoney(invoice.subtotal_amount),
                )
            }</td>
                    </tr>
                    ${discountRow}
                    <tr>
                        <td>GST</td>
                        <td>${escapeHtml(formatMoney(taxAmount))}</td>
                    </tr>
                    <tr class="invoice-total">
                        <td>Invoice Total</td>
                        <td>${
                escapeHtml(
                    formatMoney(invoice.total_amount),
                )
            }</td>
                    </tr>
                `
            : isResidentialTaxPresentation
            ? `
                    ${discountRow}
                    <tr class="invoice-total">
                        <td>Invoice Total inc GST</td>
                        <td>${
                escapeHtml(
                    formatMoney(invoice.total_amount),
                )
            }</td>
                    </tr>
                `
            : `
                    <tr>
                        <td>Subtotal</td>
                        <td>${
                escapeHtml(
                    formatMoney(invoice.subtotal_amount),
                )
            }</td>
                    </tr>
                    ${discountRow}
                    <tr class="invoice-total">
                        <td>Invoice Total</td>
                        <td>${
                escapeHtml(
                    formatMoney(invoice.total_amount),
                )
            }</td>
                    </tr>
                `;

        const projectName = String(invoice.project_name ?? "").trim();
        const siteName = String(invoice.site_name ?? "").trim();
        const projectDisplay = [projectName, siteName]
            .filter(Boolean)
            .join(" — ");

        const invoiceNo = String(invoice.invoice_no ?? "Invoice");
        const customerName = String(invoice.customer_name ?? "Customer");
        const customerCode = String(invoice.customer_code ?? "").trim();
        const customerReference = String(
            invoice.customer_reference ?? "",
        ).trim();

        const html = `
<!doctype html>
<html>
<head>
    <meta charset="utf-8" />
    <title>${escapeHtml(invoiceNo)} — REDS Invoice</title>
    <style>
        @page {
            size: A4;
            margin: 13mm 14mm 14mm;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            color: #171717;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 11px;
            line-height: 1.45;
            background: #fff;
        }

        .invoice {
            width: 100%;
            max-width: 100%;
        }

        .header {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 28px;
            padding-bottom: 18px;
            border-bottom: 2px solid #8B3F3F;
        }

        .brand {
            font-size: 42px;
            line-height: 0.9;
            font-weight: 900;
            letter-spacing: -2px;
            color: #B4232B;
        }

        .tagline {
            margin-top: 5px;
            color: #8B3F3F;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 1.1px;
        }

        .company {
            margin-top: 15px;
            color: #333;
        }

        .invoice-title {
            text-align: right;
        }

        .invoice-title h1 {
            margin: 0 0 12px;
            font-size: 28px;
            letter-spacing: 0.8px;
            color: #222;
        }

        .meta {
            margin-left: auto;
            border-collapse: collapse;
        }

        .meta td {
            padding: 2px 0 2px 16px;
            vertical-align: top;
        }

        .meta td:first-child {
            color: #666;
            font-weight: 700;
        }

        .parties {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 28px;
            margin: 22px 0;
        }

        .label {
            margin-bottom: 5px;
            color: #8B3F3F;
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 0.8px;
            text-transform: uppercase;
        }

        .name {
            margin-bottom: 3px;
            font-size: 13px;
            font-weight: 700;
        }

        .muted {
            color: #666;
        }

        .lines {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }

        .lines thead {
            display: table-header-group;
        }

        .lines th {
            padding: 8px 7px;
            color: #fff;
            background: #8B3F3F;
            font-size: 10px;
            text-align: left;
        }

        ${
            isResidentialTaxPresentation
                ? `
        .lines th:nth-child(1) { width: 76%; }
        .lines th:nth-child(2) { width: 24%; }`
                : isCommercialTaxPresentation
                ? `
        .lines th:nth-child(1) { width: 40%; }
        .lines th:nth-child(2) { width: 9%; }
        .lines th:nth-child(3) { width: 9%; }
        .lines th:nth-child(4) { width: 15%; }
        .lines th:nth-child(5) { width: 11%; }
        .lines th:nth-child(6) { width: 16%; }`
                : `
        .lines th:nth-child(1) { width: 48%; }
        .lines th:nth-child(2) { width: 10%; }
        .lines th:nth-child(3) { width: 10%; }
        .lines th:nth-child(4) { width: 16%; }
        .lines th:nth-child(5) { width: 16%; }`
        }

        .lines td {
            padding: 9px 7px;
            vertical-align: top;
            border-bottom: 1px solid #dedede;
        }

        .lines tr {
            break-inside: avoid;
        }

        .description {
            overflow-wrap: anywhere;
        }

        .num {
            text-align: right;
            white-space: nowrap;
        }

        .summary-wrap {
            display: flex;
            justify-content: flex-end;
            margin-top: 16px;
            break-inside: avoid;
        }

        .summary {
            width: 290px;
            border-collapse: collapse;
        }

        .summary td {
            padding: 4px 0 4px 18px;
        }

        .summary td:first-child {
            color: #555;
        }

        .summary td:last-child {
            text-align: right;
            white-space: nowrap;
        }

        .invoice-total td {
            padding-top: 8px;
            border-top: 1px solid #bbb;
            font-weight: 700;
        }

        .amount-due td {
            padding-top: 9px;
            border-top: 2px solid #8B3F3F;
            color: #8B3F3F !important;
            font-size: 15px;
            font-weight: 800;
        }

        .footer {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 26px;
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #bbb;
            break-inside: avoid;
        }

        .footer h3 {
            margin: 0 0 6px;
            color: #8B3F3F;
            font-size: 11px;
        }

        .footer p {
            margin: 2px 0;
        }

        .print-note {
            margin-top: 22px;
            color: #777;
            font-size: 9px;
            text-align: center;
        }

        @media print {
            .print-note {
                display: none;
            }
        }
    </style>
</head>
<body>
    <main class="invoice">
        <section class="header">
            <div>
                <div class="brand">REDS</div>
                <div class="tagline">TIMBER FLOORING SPECIALISTS</div>

                <div class="company">
                    <strong>REDS FLOORING PTY LTD</strong><br />
                    Unit 27 70 Norma Road Myaree WA 6154<br />
                    ABN: 61 621 645 949<br />
                    Ph: 0498 072 147<br />
                    projects@redstimberflooring.com<br />
                    accounts@redstimberflooring.com<br />
                    www.redstimberflooring.com
                </div>
            </div>

            <div class="invoice-title">
                <h1>${
                    escapeHtml(
                        `${isDraftDocument ? "DRAFT " : ""}TAX INVOICE`,
                    )
                }</h1>

                <table class="meta">
                    <tr>
                        <td>Invoice No.</td>
                        <td>${escapeHtml(invoiceNo)}</td>
                    </tr>
                    <tr>
                        <td>Invoice Date</td>
                        <td>${
            escapeHtml(
                formatDate(invoice.invoice_date),
            )
        }</td>
                    </tr>
                    <tr>
                        <td>Due Date</td>
                        <td>${
            escapeHtml(
                formatDate(invoice.due_date),
            )
        }</td>
                    </tr>
                    <tr>
                        <td>Payment Terms</td>
                        <td>${escapeHtml(paymentTermsDisplay)}</td>
                    </tr>
                    ${
            customerReference
                ? `<tr><td>Reference</td><td>${
                    escapeHtml(
                        customerReference,
                    )
                }</td></tr>`
                : ""
        }
                </table>
            </div>
        </section>

        <section class="parties">
            <div>
                <div class="label">Bill To</div>
                <div class="name">${escapeHtml(customerName)}</div>
                ${
            customerCode
                ? `<div class="muted">${
                    escapeHtml(
                        customerCode,
                    )
                }</div>`
                : ""
        }
                ${
            billingAddressLines
                .map((line) => `<div>${escapeHtml(line)}</div>`)
                .join("")
        }
            </div>

            <div>
                <div class="label">Project / Site</div>
                <div class="name">${
            escapeHtml(
                projectDisplay || "—",
            )
        }</div>
                ${
            projectAddressLines
                .map((line) => `<div>${escapeHtml(line)}</div>`)
                .join("")
        }
            </div>
        </section>

        <table class="lines">
            <thead>
                ${
                    isResidentialTaxPresentation
                        ? `
                <tr>
                    <th>Product Code / Description</th>
                    <th class="num">Total</th>
                </tr>`
                        : `
                <tr>
                    <th>Product Code / Description</th>
                    <th class="num">Qty</th>
                    <th>UOM</th>
                    <th class="num">Unit Price</th>
                    ${
                        isCommercialTaxPresentation
                            ? '<th class="num">GST</th>'
                            : ""
                    }
                    <th class="num">Amount</th>
                </tr>`
                }
            </thead>
            <tbody>
                ${
            lineRows ||
            `<tr><td colspan="${isResidentialTaxPresentation ? 2 : isCommercialTaxPresentation ? 6 : 5}" style="text-align:center;color:#777;padding:20px">No invoice lines.</td></tr>`
        }
            </tbody>
        </table>

        <div class="summary-wrap">
            <table class="summary">
                ${summaryRows}
                <tr>
                    <td>Paid</td>
                    <td>${escapeHtml(formatMoney(paidAmount))}</td>
                </tr>
                <tr class="amount-due">
                    <td>AMOUNT DUE</td>
                    <td>${escapeHtml(formatMoney(balanceAmount))}</td>
                </tr>
            </table>
        </div>

        <section class="footer">
            <div>
                <h3>Electronic Funds Transfer</h3>
                <p><strong>Account Name:</strong> Reds Flooring Pty Ltd</p>
                <p><strong>Account BSB:</strong> 016-267</p>
                <p><strong>Account Number:</strong> 466752247</p>
                <p><strong>Reference:</strong> ${escapeHtml(invoiceNo)}</p>
            </div>

            <div>
                <h3>Defect Claims</h3>
                <p>
                    All claims of defect or dispute must be made in writing
                    within 14 days of the invoice date.
                </p>
                <p>
                    Failure to provide this notice will result in the Invoice
                    being due and payable as per the original terms.
                </p>
            </div>
        </section>

        <div class="print-note">
            Print this customer Invoice or choose “Save as PDF” in the
            browser Print dialog.
        </div>
    </main>

    <script>
        window.addEventListener("load", function () {
            setTimeout(function () {
                window.focus();
                window.print();
            }, 250);
        });
    </script>
</body>
</html>
        `;

        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const downloadCustomerInvoicePdf = async (
        invoice: Record<string, unknown>,
        detailLines: InvoiceDetailLine[],
    ) => {
        try {
            /*
             * PDF libraries are loaded only when the user clicks Download PDF.
             * This keeps them out of the initial Invoice page execution path.
             */
            const [{ jsPDF }, autoTableModule] = await Promise.all([
                import("jspdf"),
                import("jspdf-autotable"),
            ]);

            const autoTable = autoTableModule.default;

            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
                compress: true,
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const marginLeft = 14;
            const marginRight = 14;
            const contentWidth =
                pageWidth - marginLeft - marginRight;

            const cleanText = (value: unknown) =>
                String(value ?? "")
                    .replace(/[–—]/g, "-")
                    .replace(/[“”]/g, '"')
                    .replace(/[‘’]/g, "'")
                    .trim();

            const moneyPdf = (value: unknown) =>
                new Intl.NumberFormat("en-AU", {
                    style: "currency",
                    currency: "AUD",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })
                    .format(Number(value || 0))
                    .replace(/\u00a0/g, " ");

            const numberPdf = (value: unknown) =>
                new Intl.NumberFormat("en-AU", {
                    maximumFractionDigits: 6,
                }).format(Number(value || 0));

            const datePdf = (value: unknown) => {
                const raw = cleanText(value);
                if (!raw) return "-";

                const iso = raw.match(
                    /^(\d{4})-(\d{2})-(\d{2})/,
                );

                if (iso) {
                    return `${iso[3]}/${iso[2]}/${iso[1]}`;
                }

                const parsed = new Date(raw);
                return Number.isNaN(parsed.getTime())
                    ? raw
                    : parsed.toLocaleDateString("en-AU");
            };

            const customerId = cleanText(
                invoice.customer_id,
            );
            const projectSiteId = cleanText(
                invoice.project_site_id,
            );

            let customerAddress:
                | {
                    address_line1?: string | null;
                    address_line2?: string | null;
                    suburb?: string | null;
                    state?: string | null;
                    postcode?: string | null;
                    country?: string | null;
                }
                | null = null;

            let projectSite:
                | {
                    address_line_1?: string | null;
                    address_line_2?: string | null;
                    suburb?: string | null;
                    state?: string | null;
                    postcode?: string | null;
                    country?: string | null;
                }
                | null = null;

            if (customerId) {
                const { data, error } = await supabase
                    .from("customer_addresses")
                    .select(
                        "address_line1, address_line2, suburb, state, postcode, country, address_type, is_primary",
                    )
                    .eq("customer_id", customerId)
                    .eq("is_deleted", false)
                    .eq("is_active", true)
                    .order("is_primary", {
                        ascending: false,
                    });

                if (error) throw error;

                const addresses = data ?? [];

                customerAddress = addresses.find(
                    (address) =>
                        String(
                            address.address_type ?? "",
                        ).toLowerCase() === "billing",
                ) ??
                    addresses.find(
                        (address) =>
                            Boolean(address.is_primary),
                    ) ??
                    addresses[0] ??
                    null;
            }

            if (projectSiteId) {
                const { data, error } = await supabase
                    .from("project_sites")
                    .select(
                        "address_line_1, address_line_2, suburb, state, postcode, country",
                    )
                    .eq("site_id", projectSiteId)
                    .eq("is_deleted", false)
                    .maybeSingle();

                if (error) throw error;

                projectSite = data ?? null;
            }

            const buildAddressLines = (
                address:
                    | {
                        address_line1?: string | null;
                        address_line2?: string | null;
                        address_line_1?: string | null;
                        address_line_2?: string | null;
                        suburb?: string | null;
                        state?: string | null;
                        postcode?: string | null;
                        country?: string | null;
                    }
                    | null,
            ) => {
                if (!address) return ["-"];

                const firstLine =
                    address.address_line1 ??
                    address.address_line_1 ??
                    "";

                const secondLine =
                    address.address_line2 ??
                    address.address_line_2 ??
                    "";

                const locality = [
                    address.suburb,
                    address.state,
                    address.postcode,
                ]
                    .filter(Boolean)
                    .join(" ");

                return [
                    firstLine,
                    secondLine,
                    locality,
                    address.country,
                ]
                    .map(cleanText)
                    .filter(Boolean);
            };

            const billingAddressLines =
                buildAddressLines(customerAddress);

            const projectAddressLines =
                buildAddressLines(projectSite);

            const lineAmountType =
                normalizeLineAmountType(
                    cleanText(
                        invoice.line_amount_type ||
                            "Exclusive",
                    ),
                );

            const isCommercialTaxPresentation =
                lineAmountType === "Exclusive";

            const isResidentialTaxPresentation =
                lineAmountType === "Inclusive";

            const isDraftDocument =
                cleanText(invoice.document_status) ===
                "Draft";

            const paymentTermsDisplay =
                formatPaymentTerms(
                    invoice.payment_terms_type,
                    invoice.payment_terms_days,
                );

            const invoiceNo =
                cleanText(invoice.invoice_no) ||
                "Invoice";

            const customerName =
                cleanText(invoice.customer_name) ||
                "Customer";

            const customerCode =
                cleanText(invoice.customer_code);

            const customerReference =
                cleanText(
                    invoice.customer_reference,
                );

            const projectDisplay = [
                cleanText(invoice.project_name),
                cleanText(invoice.site_name),
            ]
                .filter(Boolean)
                .join(" - ");

            const drawPageHeader = () => {
                pdf.setTextColor(180, 35, 43);
                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(30);
                pdf.text("REDS", marginLeft, 18);

                pdf.setFontSize(7.5);
                pdf.text(
                    "TIMBER FLOORING SPECIALISTS",
                    marginLeft,
                    23,
                );

                pdf.setTextColor(40, 40, 40);
                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(8.5);
                pdf.text(
                    "REDS FLOORING PTY LTD",
                    marginLeft,
                    31,
                );

                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(7.5);

                [
                    "Unit 27 70 Norma Road Myaree WA 6154",
                    "ABN: 61 621 645 949",
                    "Ph: 0498 072 147",
                    "projects@redstimberflooring.com",
                    "accounts@redstimberflooring.com",
                    "www.redstimberflooring.com",
                ].forEach((line, index) => {
                    pdf.text(
                        line,
                        marginLeft,
                        35 + index * 4,
                    );
                });

                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(18);
                pdf.text(
                    `${
                        isDraftDocument
                            ? "DRAFT "
                            : ""
                    }TAX INVOICE`,
                    pageWidth - marginRight,
                    18,
                    {
                        align: "right",
                    },
                );

                const metaRows: Array<
                    [string, string]
                > = [
                    [
                        "Invoice No.",
                        invoiceNo,
                    ],
                    [
                        "Invoice Date",
                        datePdf(
                            invoice.invoice_date,
                        ),
                    ],
                    [
                        "Due Date",
                        datePdf(invoice.due_date),
                    ],
                    [
                        "Payment Terms",
                        cleanText(
                            paymentTermsDisplay,
                        ) || "-",
                    ],
                ];

                if (customerReference) {
                    metaRows.push([
                        "Reference",
                        customerReference,
                    ]);
                }

                let metaY = 27;

                metaRows.forEach(
                    ([label, value]) => {
                        pdf.setFont(
                            "helvetica",
                            "bold",
                        );
                        pdf.setFontSize(7.5);
                        pdf.text(
                            label,
                            pageWidth - 61,
                            metaY,
                        );

                        pdf.setFont(
                            "helvetica",
                            "normal",
                        );

                        const split =
                            pdf.splitTextToSize(
                                value,
                                43,
                            );

                        pdf.text(
                            split,
                            pageWidth -
                                marginRight,
                            metaY,
                            {
                                align: "right",
                            },
                        );

                        metaY += Math.max(
                            4.5,
                            split.length * 3.3 +
                                1,
                        );
                    },
                );

                pdf.setDrawColor(139, 63, 63);
                pdf.setLineWidth(0.6);
                pdf.line(
                    marginLeft,
                    59,
                    pageWidth - marginRight,
                    59,
                );
            };

            const drawPageFooter = (
                pageNumber: number,
                totalPages: number,
            ) => {
                pdf.setDrawColor(190, 190, 190);
                pdf.setLineWidth(0.2);
                pdf.line(
                    marginLeft,
                    pageHeight - 13,
                    pageWidth - marginRight,
                    pageHeight - 13,
                );

                pdf.setTextColor(105, 105, 105);
                pdf.setFont(
                    "helvetica",
                    "normal",
                );
                pdf.setFontSize(7);
                pdf.text(
                    "REDS Flooring Pty Ltd",
                    marginLeft,
                    pageHeight - 8,
                );

                pdf.text(
                    `Page ${pageNumber} of ${totalPages}`,
                    pageWidth - marginRight,
                    pageHeight - 8,
                    {
                        align: "right",
                    },
                );
            };

            drawPageHeader();

            let y = 67;

            pdf.setTextColor(139, 63, 63);
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(7.5);
            pdf.text("BILL TO", marginLeft, y);

            pdf.text(
                "PROJECT / SITE",
                marginLeft + contentWidth / 2,
                y,
            );

            y += 5;

            pdf.setTextColor(35, 35, 35);
            pdf.setFontSize(9);
            pdf.text(
                customerName,
                marginLeft,
                y,
            );

            pdf.text(
                projectDisplay || "-",
                marginLeft + contentWidth / 2,
                y,
            );

            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(7.5);

            const leftPartyLines = [
                customerCode,
                ...billingAddressLines,
            ]
                .map(cleanText)
                .filter(Boolean);

            const rightPartyLines =
                projectAddressLines
                    .map(cleanText)
                    .filter(Boolean);

            const leftPartyY = y + 4;
            const rightPartyY = y + 4;

            leftPartyLines.forEach(
                (line, index) => {
                    pdf.text(
                        pdf.splitTextToSize(
                            line,
                            contentWidth / 2 - 8,
                        ),
                        marginLeft,
                        leftPartyY +
                            index * 3.8,
                    );
                },
            );

            rightPartyLines.forEach(
                (line, index) => {
                    pdf.text(
                        pdf.splitTextToSize(
                            line,
                            contentWidth / 2 - 8,
                        ),
                        marginLeft +
                            contentWidth / 2,
                        rightPartyY +
                            index * 3.8,
                    );
                },
            );

            y +=
                Math.max(
                    leftPartyLines.length,
                    rightPartyLines.length,
                    1,
                ) *
                    3.8 +
                9;

            const bodyRows = detailLines.map(
                (line) => {
                    const lineAmount =
                        lineAmountType ===
                            "Exclusive"
                            ? Number(
                                line.line_subtotal ||
                                    0,
                            ) -
                                Number(
                                    line.discount_amount ||
                                        0,
                                )
                            : Number(
                                line.line_total || 0,
                            );

                    const productLabel = [
                        line.product_code,
                        line.description,
                    ]
                        .map(cleanText)
                        .filter(Boolean)
                        .join(" - ");

                    if (
                        isResidentialTaxPresentation
                    ) {
                        return [
                            productLabel ||
                                cleanText(
                                    line.product_name,
                                ) ||
                                "Item",
                            moneyPdf(lineAmount),
                        ];
                    }

                    const row = [
                        productLabel ||
                            cleanText(
                                line.product_name,
                            ) ||
                            "Item",
                        numberPdf(line.quantity),
                        cleanText(
                            line.sales_uom_code,
                        ) || "-",
                        moneyPdf(
                            line.unit_price,
                        ),
                    ];

                    if (
                        isCommercialTaxPresentation
                    ) {
                        row.push(
                            `${numberPdf(
                                line.tax_rate,
                            )}%`,
                        );
                    }

                    row.push(
                        moneyPdf(lineAmount),
                    );

                    return row;
                },
            );

            const head = isResidentialTaxPresentation
                ? [[
                    "Description",
                    "Total",
                ]]
                : isCommercialTaxPresentation
                ? [[
                    "Description",
                    "Qty",
                    "UOM",
                    "Unit Price",
                    "GST",
                    "Amount",
                ]]
                : [[
                    "Description",
                    "Qty",
                    "UOM",
                    "Unit Price",
                    "Amount",
                ]];

            const columnStyles =
                isResidentialTaxPresentation
                    ? {
                        0: {
                            cellWidth: 137,
                        },
                        1: {
                            cellWidth: 45,
                            halign: "right",
                        },
                    }
                    : isCommercialTaxPresentation
                    ? {
                        0: {
                            cellWidth: 72,
                        },
                        1: {
                            cellWidth: 17,
                            halign: "right",
                        },
                        2: {
                            cellWidth: 18,
                        },
                        3: {
                            cellWidth: 27,
                            halign: "right",
                        },
                        4: {
                            cellWidth: 18,
                            halign: "right",
                        },
                        5: {
                            cellWidth: 30,
                            halign: "right",
                        },
                    }
                    : {
                        0: {
                            cellWidth: 82,
                        },
                        1: {
                            cellWidth: 18,
                            halign: "right",
                        },
                        2: {
                            cellWidth: 18,
                        },
                        3: {
                            cellWidth: 30,
                            halign: "right",
                        },
                        4: {
                            cellWidth: 34,
                            halign: "right",
                        },
                    };

            autoTable(pdf, {
                startY: y,
                head,
                body:
                    bodyRows.length > 0
                        ? bodyRows
                        : [[
                            "No invoice lines.",
                            ...new Array(
                                head[0].length - 1,
                            ).fill(""),
                        ]],
                margin: {
                    left: marginLeft,
                    right: marginRight,
                    top: 64,
                    bottom: 20,
                },
                theme: "plain",
                styles: {
                    font: "helvetica",
                    fontSize: 7.5,
                    cellPadding: 2.2,
                    lineColor: [
                        222,
                        222,
                        222,
                    ],
                    lineWidth: {
                        bottom: 0.15,
                    },
                    overflow: "linebreak",
                    valign: "top",
                    textColor: [
                        35,
                        35,
                        35,
                    ],
                },
                headStyles: {
                    fillColor: [
                        139,
                        63,
                        63,
                    ],
                    textColor: [
                        255,
                        255,
                        255,
                    ],
                    fontStyle: "bold",
                    lineWidth: 0,
                },
                columnStyles,
                didDrawPage: () => {
                    /*
                     * The first page header is already drawn before
                     * autoTable. For continuation pages, redraw the
                     * REDS document header so each page is standalone.
                     */
                    if (
                        pdf.getNumberOfPages() > 1
                    ) {
                        drawPageHeader();
                    }
                },
            });

            const pdfWithAutoTable = pdf as typeof pdf & {
                lastAutoTable?: { finalY?: number };
            };
            const tableFinalY = Number(
                pdfWithAutoTable.lastAutoTable?.finalY,
            ) || y;

            let summaryY = tableFinalY + 8;

            const ensureSpace = (
                requiredHeight: number,
            ) => {
                if (
                    summaryY + requiredHeight >
                    pageHeight - 23
                ) {
                    pdf.addPage();
                    drawPageHeader();
                    summaryY = 67;
                }
            };

            const summaryRows: Array<
                [string, string, boolean?]
            > = [];

            if (
                isCommercialTaxPresentation
            ) {
                summaryRows.push([
                    "Subtotal",
                    moneyPdf(
                        invoice.subtotal_amount,
                    ),
                ]);
            }

            if (
                Number(
                    invoice.discount_amount ||
                        0,
                ) > 0
            ) {
                summaryRows.push([
                    "Discount",
                    moneyPdf(
                        invoice.discount_amount,
                    ),
                ]);
            }

            if (
                isCommercialTaxPresentation
            ) {
                summaryRows.push([
                    "GST",
                    moneyPdf(invoice.tax_amount),
                ]);
            }

            summaryRows.push([
                isResidentialTaxPresentation
                    ? "Invoice Total inc GST"
                    : "Invoice Total",
                moneyPdf(invoice.total_amount),
                true,
            ]);

            summaryRows.push([
                "Paid",
                moneyPdf(invoice.paid_amount),
            ]);

            summaryRows.push([
                "AMOUNT DUE",
                moneyPdf(invoice.balance_amount),
                true,
            ]);

            ensureSpace(
                summaryRows.length * 6 + 42,
            );

            const summaryLabelX =
                pageWidth - marginRight - 63;

            const summaryValueX =
                pageWidth - marginRight;

            summaryRows.forEach(
                ([label, value, strong]) => {
                    if (
                        label === "AMOUNT DUE"
                    ) {
                        /*
                         * Draw the separator in its own vertical space.
                         * Previously the rule sat only 2 mm above the text
                         * baseline, so it crossed the 10 pt AMOUNT DUE text.
                         */
                        pdf.setDrawColor(
                            139,
                            63,
                            63,
                        );
                        pdf.setLineWidth(0.6);
                        pdf.line(
                            summaryLabelX,
                            summaryY,
                            summaryValueX,
                            summaryY,
                        );

                        summaryY += 5;

                        pdf.setTextColor(
                            139,
                            63,
                            63,
                        );
                    } else {
                        pdf.setTextColor(
                            55,
                            55,
                            55,
                        );
                    }

                    pdf.setFont(
                        "helvetica",
                        strong
                            ? "bold"
                            : "normal",
                    );

                    pdf.setFontSize(
                        label ===
                                "AMOUNT DUE"
                            ? 10
                            : 8,
                    );

                    pdf.text(
                        label,
                        summaryLabelX,
                        summaryY,
                    );

                    pdf.text(
                        value,
                        summaryValueX,
                        summaryY,
                        {
                            align: "right",
                        },
                    );

                    summaryY +=
                        label ===
                                "AMOUNT DUE"
                            ? 7
                            : 5.5;
                },
            );

            summaryY += 5;

            pdf.setTextColor(139, 63, 63);
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(8);
            pdf.text(
                "Electronic Funds Transfer",
                marginLeft,
                summaryY,
            );

            pdf.text(
                "Defect Claims",
                marginLeft +
                    contentWidth / 2,
                summaryY,
            );

            summaryY += 4.5;

            pdf.setTextColor(55, 55, 55);
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(7.2);

            const bankLines = [
                "Account Name: Reds Flooring Pty Ltd",
                "Account BSB: 016-267",
                "Account Number: 466752247",
                `Reference: ${invoiceNo}`,
            ];

            bankLines.forEach(
                (line, index) => {
                    pdf.text(
                        line,
                        marginLeft,
                        summaryY +
                            index * 3.8,
                    );
                },
            );

            const defectText =
                "All claims of defect or dispute must be made in writing within 14 days of the invoice date. Failure to provide this notice will result in the Invoice being due and payable as per the original terms.";

            pdf.text(
                pdf.splitTextToSize(
                    defectText,
                    contentWidth / 2 - 6,
                ),
                marginLeft +
                    contentWidth / 2,
                summaryY,
            );

            const totalPages =
                pdf.getNumberOfPages();

            for (
                let pageNumber = 1;
                pageNumber <= totalPages;
                pageNumber += 1
            ) {
                pdf.setPage(pageNumber);
                drawPageFooter(
                    pageNumber,
                    totalPages,
                );
            }

            pdf.save(
                `${invoiceNo.replace(
                    /[^A-Za-z0-9._-]+/g,
                    "-",
                )}.pdf`,
            );

            toast.success(
                `Downloaded ${invoiceNo}.pdf`,
            );
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Invoice PDF download failed.",
            );
        }
    };

    const renderList = () => (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                    <div className="flex items-center gap-3">
                        <ReceiptText className="h-8 w-8 text-[#8B3F3F]" />

                        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
                            Customer Invoices
                        </h1>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                        Create, review, issue and monitor REDS customer
                        invoices.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={exportXlsx}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export XLSX
                    </Button>

                    <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={printPage}
                    >
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                    </Button>

                    {permission[
                        "invoices.create"
                    ] && (
                        <Button
                            className={RED_BUTTON}
                            onClick={openCreate}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            New Invoice
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    {
                        label: "Invoiced",
                        value: summary.invoiced,
                        icon: FileText,
                    },
                    {
                        label: "Paid",
                        value: summary.paid,
                        icon: CheckCircle2,
                    },
                    {
                        label: "Outstanding",
                        value: summary.outstanding,
                        icon: CircleDollarSign,
                    },
                    {
                        label: "Overdue",
                        value: summary.overdue,
                        icon: AlertTriangle,
                    },
                ].map((item) => (
                    <Card
                        key={item.label}
                        className="rounded-2xl"
                    >
                        <CardContent className="flex items-center justify-between p-5">
                            <div>
                                <p className="text-sm text-slate-500">
                                    {item.label}
                                </p>

                                <p className="mt-1 text-2xl font-bold text-slate-900">
                                    {money(
                                        item.value,
                                    )}
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-100 p-3">
                                <item.icon className="h-5 w-5 text-[#8B3F3F]" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="rounded-2xl">
                <CardContent className="space-y-4 p-4 md:p-5">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                        <div className="relative xl:col-span-2">
                            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />

                            <Input
                                className={`${INPUT_CLASS} pl-10`}
                                placeholder="Search invoice, customer, project or site"
                                value={search}
                                onChange={(
                                    event,
                                ) => {
                                    setSearch(
                                        event
                                            .target
                                            .value,
                                    );
                                    setPage(
                                        1,
                                    );
                                }}
                            />
                        </div>

                        <Select
                            value={documentStatus}
                            onValueChange={(
                                value,
                            ) => {
                                setDocumentStatus(
                                    value,
                                );
                                setPage(1);
                            }}
                        >
                            <SelectTrigger
                                className={INPUT_CLASS}
                            >
                                <SelectValue placeholder="Document Status" />
                            </SelectTrigger>

                            <SelectContent>
                                {[
                                    "All",
                                    "Draft",
                                    "Approved",
                                    "Issued",
                                    "Voided",
                                    "Cancelled",
                                ].map(
                                    (
                                        status,
                                    ) => (
                                        <SelectItem
                                            key={status}
                                            value={status}
                                        >
                                            {status ===
                                                    "All"
                                                ? "All Document Statuses"
                                                : status}
                                        </SelectItem>
                                    ),
                                )}
                            </SelectContent>
                        </Select>

                        <Select
                            value={paymentStatus}
                            onValueChange={(
                                value,
                            ) => {
                                setPaymentStatus(
                                    value,
                                );
                                setPage(1);
                            }}
                        >
                            <SelectTrigger
                                className={INPUT_CLASS}
                            >
                                <SelectValue placeholder="Payment Status" />
                            </SelectTrigger>

                            <SelectContent>
                                {[
                                    "All",
                                    "Unpaid",
                                    "Partially Paid",
                                    "Paid",
                                    "Overpaid",
                                ].map(
                                    (
                                        status,
                                    ) => (
                                        <SelectItem
                                            key={status}
                                            value={status}
                                        >
                                            {status ===
                                                    "All"
                                                ? "All Payment Statuses"
                                                : status}
                                        </SelectItem>
                                    ),
                                )}
                            </SelectContent>
                        </Select>

                        <Select
                            value={invoiceTypeFilter}
                            onValueChange={(
                                value,
                            ) => {
                                setInvoiceTypeFilter(
                                    value,
                                );
                                setPage(1);
                            }}
                        >
                            <SelectTrigger
                                className={INPUT_CLASS}
                            >
                                <SelectValue placeholder="Invoice Type" />
                            </SelectTrigger>

                            <SelectContent>
                                {[
                                    "All",
                                    "Standard",
                                    "Deposit",
                                    "Progress",
                                    "Variation",
                                    "Final",
                                    "Retention Release",
                                    "Credit Note",
                                ].map(
                                    (type) => (
                                        <SelectItem
                                            key={type}
                                            value={type}
                                        >
                                            {type ===
                                                    "All"
                                                ? "All Invoice Types"
                                                : type}
                                        </SelectItem>
                                    ),
                                )}
                            </SelectContent>
                        </Select>

                        <Button
                            variant="outline"
                            className="h-11 rounded-xl"
                            onClick={() => invoiceList.refetch()}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 md:max-w-xl">
                        <div>
                            <Label className="text-xs text-slate-500">
                                Invoice date from
                            </Label>

                            <Input
                                type="date"
                                className={INPUT_CLASS}
                                value={dateFrom}
                                onChange={(
                                    event,
                                ) => {
                                    setDateFrom(
                                        event
                                            .target
                                            .value,
                                    );
                                    setPage(
                                        1,
                                    );
                                }}
                            />
                        </div>

                        <div>
                            <Label className="text-xs text-slate-500">
                                Invoice date to
                            </Label>

                            <Input
                                type="date"
                                className={INPUT_CLASS}
                                value={dateTo}
                                onChange={(
                                    event,
                                ) => {
                                    setDateTo(
                                        event
                                            .target
                                            .value,
                                    );
                                    setPage(
                                        1,
                                    );
                                }}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-2xl">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>
                                        Invoice
                                    </TableHead>

                                    <TableHead>
                                        Customer / Project
                                    </TableHead>

                                    <TableHead>
                                        Dates
                                    </TableHead>

                                    <TableHead>
                                        Status
                                    </TableHead>

                                    <TableHead className="text-right">
                                        Total
                                    </TableHead>

                                    <TableHead className="text-right">
                                        Paid
                                    </TableHead>

                                    <TableHead className="text-right">
                                        Balance
                                    </TableHead>

                                    <TableHead className="w-[90px] text-right">
                                        Action
                                    </TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {invoiceList.isLoading
                                    ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={8}
                                                className="h-32 text-center"
                                            >
                                                <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#8B3F3F]" />
                                            </TableCell>
                                        </TableRow>
                                    )
                                    : rows.length ===
                                            0
                                    ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={8}
                                                className="h-32 text-center"
                                            >
                                                <FileText className="mx-auto h-8 w-8 text-slate-300" />

                                                <p className="mt-2 font-medium text-slate-600">
                                                    No Invoices found
                                                </p>
                                            </TableCell>
                                        </TableRow>
                                    )
                                    : (
                                        rows.map(
                                            (
                                                row,
                                            ) => (
                                                <TableRow
                                                    key={row
                                                        .customer_invoice_id}
                                                    className="cursor-pointer hover:bg-slate-50"
                                                    onClick={() =>
                                                        openDetail(
                                                            row.customer_invoice_id,
                                                        )}
                                                >
                                                    <TableCell>
                                                        <p className="font-semibold text-slate-900">
                                                            {row.invoice_no}
                                                        </p>

                                                        <p className="text-xs text-slate-500">
                                                            {row.invoice_type}
                                                        </p>
                                                    </TableCell>

                                                    <TableCell>
                                                        <p className="font-medium text-slate-900">
                                                            {row.customer_code}
                                                            {" "}
                                                            —{" "}
                                                            {row.customer_name}
                                                        </p>

                                                        <p className="text-xs text-slate-500">
                                                            {row.project_no
                                                                ? `${row.project_no} — ${
                                                                    row.project_name ??
                                                                        ""
                                                                }`
                                                                : "No Project"}

                                                            {row.site_code
                                                                ? ` / ${row.site_code} — ${
                                                                    row.site_name ??
                                                                        ""
                                                                }`
                                                                : ""}
                                                        </p>
                                                    </TableCell>

                                                    <TableCell>
                                                        <p className="text-sm">
                                                            Invoice: {dateText(
                                                                row.invoice_date,
                                                            )}
                                                        </p>

                                                        <p className="text-xs text-slate-500">
                                                            Due: {dateText(
                                                                row.due_date,
                                                            )}
                                                        </p>
                                                    </TableCell>

                                                    <TableCell>
                                                        <div className="flex flex-wrap gap-1">
                                                            <Badge
                                                                variant="outline"
                                                                className={statusBadgeClass(
                                                                    row.document_status,
                                                                )}
                                                            >
                                                                {row.document_status}
                                                            </Badge>

                                                            <Badge
                                                                variant="outline"
                                                                className={statusBadgeClass(
                                                                    row.payment_status,
                                                                )}
                                                            >
                                                                {row.payment_status}
                                                            </Badge>
                                                        </div>

                                                        {Number(
                                                                    row.days_overdue ||
                                                                        0,
                                                                ) >
                                                                0 && (
                                                            <p className="mt-1 text-xs font-medium text-orange-600">
                                                                {row.days_overdue}
                                                                {" "}
                                                                days overdue
                                                            </p>
                                                        )}
                                                    </TableCell>

                                                    <TableCell className="text-right font-semibold">
                                                        {money(
                                                            row.total_amount,
                                                        )}
                                                    </TableCell>

                                                    <TableCell className="text-right">
                                                        {money(
                                                            row.paid_amount,
                                                        )}
                                                    </TableCell>

                                                    <TableCell className="text-right font-semibold">
                                                        {money(
                                                            row.balance_amount,
                                                        )}
                                                    </TableCell>

                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="rounded-xl"
                                                            onClick={(
                                                                event,
                                                            ) => {
                                                                event
                                                                    .stopPropagation();

                                                                openDetail(
                                                                    row.customer_invoice_id,
                                                                );
                                                            }}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ),
                                        )
                                    )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between border-t px-4 py-3">
                        <p className="text-sm text-slate-500">
                            {totalRows === 0
                                ? "0 records"
                                : `${(page - 1) * PAGE_SIZE + 1}–${
                                    Math.min(
                                        page *
                                            PAGE_SIZE,
                                        totalRows,
                                    )
                                } of ${totalRows}`}
                        </p>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="rounded-xl"
                                disabled={page <= 1}
                                onClick={() =>
                                    setPage(
                                        (
                                            current,
                                        ) => current -
                                            1,
                                    )}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            <span className="text-sm text-slate-600">
                                Page {page} of {totalPages}
                            </span>

                            <Button
                                variant="outline"
                                size="icon"
                                className="rounded-xl"
                                disabled={page >=
                                    totalPages}
                                onClick={() =>
                                    setPage(
                                        (
                                            current,
                                        ) => current +
                                            1,
                                    )}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    const renderForm = () => (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div className="flex items-start gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        className="mt-1 rounded-xl"
                        onClick={closeToList}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>

                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
                            {editingId ? "Edit Draft Invoice" : "New Invoice"}
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Search accepted work, select only billable completed
                            Work, then save a protected Draft Invoice.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={closeToList}
                    >
                        Cancel
                    </Button>

                    <Button
                        className={RED_BUTTON}
                        disabled={
                            saveInvoice.isPending ||
                            (
                                !editingId &&
                                (
                                    createMode === "Quotation" ||
                                    createMode === "Accepted Revision" ||
                                    createMode === "Variation"
                                ) &&
                                selectedWorkOrderIds.length === 0
                            )
                        }
                        onClick={() => saveInvoice.mutate()}
                    >
                        {saveInvoice.isPending
                            ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            : <FilePlus2 className="mr-2 h-4 w-4" />}

                        {editingId ? "Update Draft" : "Save Draft"}
                    </Button>
                </div>
            </div>

            {selectedFinancial?.is_account_on_hold && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

                        <div>
                            <p className="font-semibold">
                                Customer account is on hold
                            </p>

                            <p className="mt-1 text-sm">
                                {selectedFinancial.account_hold_reason ||
                                    "Invoice creation is blocked until the hold is removed."}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <Card className="rounded-2xl border-slate-200">
                <CardContent className="space-y-5 p-5 md:p-6">
                    <SectionHeader
                        number="01"
                        title={editingId
                            ? "Customer & Commercial Source"
                            : "Invoice Source"}
                        description={editingId
                            ? "Source information for this existing Draft Invoice."
                            : "Choose one Invoice flow. Accepted commercial documents use immutable source pricing; Counter Sale uses current Product/UOM/Price Book data."}
                    />

                    {!editingId && (
                        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                            {(
                                [
                                    ["Quotation", "Quotation"],
                                    ["Accepted Revision", "Accepted Revision"],
                                    ["Variation", "Variation"],
                                    ["Counter Sale", "Counter Sale"],
                                ] as [InvoiceCreateMode, string][]
                            ).map(([value, label]) => {
                                const active = createMode === value;

                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => changeCreateMode(value)}
                                        className={`rounded-xl border px-4 py-3 text-left transition ${
                                            active
                                                ? "border-[#8B3F3F] bg-[#8B3F3F] text-white shadow-sm"
                                                : "border-slate-200 bg-white text-slate-700 hover:border-[#9E4B4B] hover:bg-[#F7F9FB]"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-semibold">
                                                {label}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {!editingId && createMode !== "Counter Sale" && (
                        <div className="space-y-5">
                            <div className="rounded-2xl border border-slate-200 bg-[#F7F9FB] p-4">
                                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(300px,420px)] lg:items-end">
                                    <div>
                                        <Label>
                                            Search {commercialSourceLabel}
                                        </Label>
                                        <div className="relative mt-2">
                                            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                            <Input
                                                className={`${INPUT_CLASS} pl-10`}
                                                value={sourceSearch}
                                                onChange={(event) =>
                                                    setSourceSearch(
                                                        event.target.value,
                                                    )}
                                                placeholder={`Search ${commercialSourceLabel.toLowerCase()} no., customer or project`}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label>{commercialSourceLabel} *</Label>
                                        <Select
                                            value={selectedCommercialSourceId ||
                                                "none"}
                                            onValueChange={(value) =>
                                                selectCommercialSource(
                                                    value === "none"
                                                        ? ""
                                                        : value,
                                                )}
                                        >
                                            <SelectTrigger
                                                className={`${INPUT_CLASS} mt-2`}
                                            >
                                                <SelectValue
                                                    placeholder={`Select ${commercialSourceLabel}`}
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">
                                                    Select{" "}
                                                    {commercialSourceLabel}
                                                </SelectItem>
                                                {commercialSourceOptions.map((
                                                    source,
                                                ) => (
                                                    <SelectItem
                                                        key={source.source_id}
                                                        value={source.source_id}
                                                    >
                                                        {source.source_no} —
                                                        {" "}
                                                        {money(
                                                            source.total_amount,
                                                        )}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {selectedCommercialSource && (
                                <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
                                    <div>
                                        <p className="text-xs text-slate-500">
                                            Accepted Source
                                        </p>
                                        <p className="mt-1 font-semibold text-slate-900">
                                            {selectedCommercialSource.source_no}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">
                                            Customer
                                        </p>
                                        <p className="mt-1 font-semibold text-slate-900">
                                            {selectedCustomer
                                                ? `${selectedCustomer.customer_code} — ${selectedCustomer.customer_name}`
                                                : "—"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">
                                            Project / Site
                                        </p>
                                        <p className="mt-1 font-semibold text-slate-900">
                                            {[
                                                filteredProjects.find((item) =>
                                                    item.project_id ===
                                                        projectId
                                                )?.project_no,
                                                filteredSites.find((item) =>
                                                    item.site_id === siteId
                                                )?.site_code,
                                            ].filter(Boolean).join(" / ") ||
                                                "—"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">
                                            Accepted Price Book
                                        </p>
                                        <p className="mt-1 font-semibold text-slate-900">
                                            {selectedPriceBook
                                                ? `${selectedPriceBook.price_book_code} — ${selectedPriceBook.price_book_name}`
                                                : "Source snapshot"}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {selectedCommercialSourceId && (
                                <div className="space-y-3">
                                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                                        <div>
                                            <p className="font-semibold text-slate-900">
                                                Ready Work
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Only 100% completed work backed
                                                by Approved Daily Reports can be
                                                selected.
                                            </p>
                                        </div>
                                        <div className="text-sm text-slate-500">
                                            Selected{" "}
                                            <span className="font-semibold text-slate-900">
                                                {selectedWorkOrderIds.length}
                                            </span>
                                        </div>
                                    </div>

                                    {invoiceWorkStatus.isLoading
                                        ? (
                                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 p-4 text-sm text-slate-500">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Loading Work status…
                                            </div>
                                        )
                                        : invoiceWorkStatus.isError
                                        ? (
                                            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                                                Work eligibility could not be
                                                loaded.
                                            </div>
                                        )
                                        : (invoiceWorkStatus.data ?? [])
                                                .length === 0
                                        ? (
                                            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                                                No commercial Work Order
                                                allocation is available for this
                                                {" "}
                                                {commercialSourceLabel}.
                                            </div>
                                        )
                                        : (
                                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                                                <div className="overflow-x-auto">
                                                    <Table className="min-w-[980px]">
                                                        <TableHeader>
                                                            <TableRow className="bg-slate-50/90 hover:bg-slate-50/90">
                                                                <TableHead className="w-[72px] text-center">
                                                                    Select
                                                                </TableHead>
                                                                <TableHead className="min-w-[190px]">
                                                                    Work /
                                                                    Status
                                                                </TableHead>
                                                                <TableHead className="w-[100px]">
                                                                    UOM
                                                                </TableHead>
                                                                <TableHead className="min-w-[145px] text-right">
                                                                    Accepted
                                                                    Base Qty
                                                                </TableHead>
                                                                <TableHead className="min-w-[155px] text-right">
                                                                    Completed
                                                                    (Approved)
                                                                </TableHead>
                                                                <TableHead className="min-w-[145px] text-right">
                                                                    Previously
                                                                    Invoiced
                                                                </TableHead>
                                                                <TableHead className="min-w-[145px] text-right">
                                                                    Available to
                                                                    Invoice
                                                                </TableHead>
                                                                <TableHead className="min-w-[150px]">
                                                                    Status
                                                                </TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {(invoiceWorkStatus
                                                                .data ?? [])
                                                                .map((work) => {
                                                                    const selected =
                                                                        selectedWorkOrderIds
                                                                            .includes(
                                                                                work.work_order_id,
                                                                            );
                                                                    const ready =
                                                                        work.ui_status ===
                                                                            "ReadyToInvoice";
                                                                    const invoiced =
                                                                        work.ui_status ===
                                                                            "FullyInvoiced";
                                                                    const reserved =
                                                                        work.ui_status ===
                                                                            "Reserved";

                                                                    // Phase 1 invoices whole eligible Work portions only.
                                                                    // Partial completion never creates a partially billable quantity.
                                                                    const previouslyInvoiced =
                                                                        invoiced
                                                                            ? Number(
                                                                                work.commercial_base_quantity ??
                                                                                    0,
                                                                            )
                                                                            : 0;
                                                                    const availableToInvoice =
                                                                        ready
                                                                            ? Number(
                                                                                work.commercial_base_quantity ??
                                                                                    0,
                                                                            )
                                                                            : 0;

                                                                    const rowSurface =
                                                                        selected
                                                                            ? "bg-emerald-50/80"
                                                                            : invoiced
                                                                            ? "bg-slate-50"
                                                                            : reserved
                                                                            ? "bg-amber-50/60"
                                                                            : ready
                                                                            ? "bg-emerald-50/35"
                                                                            : "bg-red-50/45";

                                                                    return (
                                                                        <TableRow
                                                                            key={work
                                                                                .work_order_id}
                                                                            className={`${rowSurface} ${
                                                                                work.selectable
                                                                                    ? "cursor-pointer"
                                                                                    : ""
                                                                            }`}
                                                                            onClick={() => {
                                                                                if (
                                                                                    work.selectable
                                                                                ) {
                                                                                    toggleWorkOrder(
                                                                                        work,
                                                                                    );
                                                                                }
                                                                            }}
                                                                        >
                                                                            <TableCell className="text-center">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={selected}
                                                                                    disabled={!work
                                                                                        .selectable}
                                                                                    onChange={() =>
                                                                                        toggleWorkOrder(
                                                                                            work,
                                                                                        )}
                                                                                    onClick={(
                                                                                        event,
                                                                                    ) => event
                                                                                        .stopPropagation()}
                                                                                    aria-label={`Select ${work.work_order_no}`}
                                                                                    className="h-4 w-4 rounded border-slate-300 accent-[#934544] disabled:cursor-not-allowed"
                                                                                />
                                                                            </TableCell>

                                                                            <TableCell>
                                                                                <p className="font-semibold text-slate-900">
                                                                                    {work
                                                                                        .work_order_no}
                                                                                </p>
                                                                                <p className="mt-0.5 text-xs text-slate-500">
                                                                                    {work
                                                                                        .work_order_status}
                                                                                </p>
                                                                                {(work
                                                                                    .claimed_invoice_no ||
                                                                                    work.blocking_reason) &&
                                                                                    (
                                                                                        <p className="mt-1 text-xs text-slate-500">
                                                                                            {work
                                                                                                    .claimed_invoice_no
                                                                                                ? `Invoice: ${work.claimed_invoice_no}`
                                                                                                : work
                                                                                                    .blocking_reason}
                                                                                        </p>
                                                                                    )}
                                                                            </TableCell>

                                                                            <TableCell className="font-medium text-slate-700">
                                                                                {work
                                                                                    .base_uom_code ||
                                                                                    "—"}
                                                                            </TableCell>

                                                                            <TableCell className="text-right font-semibold tabular-nums">
                                                                                {numberText(
                                                                                    work.commercial_base_quantity,
                                                                                    6,
                                                                                )}
                                                                                {" "}
                                                                                {work
                                                                                    .base_uom_code}
                                                                            </TableCell>

                                                                            <TableCell className="text-right tabular-nums">
                                                                                <span className="font-semibold text-slate-900">
                                                                                    {numberText(
                                                                                        work.approved_base_quantity,
                                                                                        6,
                                                                                    )}
                                                                                    {" "}
                                                                                    {work
                                                                                        .base_uom_code}
                                                                                </span>
                                                                                <span className="ml-2 text-xs text-slate-500">
                                                                                    ({numberText(
                                                                                        work.completion_percent,
                                                                                        2,
                                                                                    )}%)
                                                                                </span>
                                                                            </TableCell>

                                                                            <TableCell className="text-right tabular-nums">
                                                                                {numberText(
                                                                                    previouslyInvoiced,
                                                                                    6,
                                                                                )}
                                                                                {" "}
                                                                                {work
                                                                                    .base_uom_code}
                                                                            </TableCell>

                                                                            <TableCell className="text-right font-semibold tabular-nums">
                                                                                {numberText(
                                                                                    availableToInvoice,
                                                                                    6,
                                                                                )}
                                                                                {" "}
                                                                                {work
                                                                                    .base_uom_code}
                                                                            </TableCell>

                                                                            <TableCell>
                                                                                <Badge
                                                                                    className={ready
                                                                                        ? "border-emerald-200 bg-emerald-100 text-emerald-800"
                                                                                        : invoiced
                                                                                        ? "border-slate-200 bg-slate-200 text-slate-700"
                                                                                        : reserved
                                                                                        ? "border-amber-200 bg-amber-100 text-amber-800"
                                                                                        : "border-red-200 bg-red-100 text-red-800"}
                                                                                    variant="outline"
                                                                                >
                                                                                    {ready
                                                                                        ? "Ready"
                                                                                        : invoiced
                                                                                        ? "Fully Invoiced"
                                                                                        : reserved
                                                                                        ? "Reserved"
                                                                                        : work
                                                                                                .approved_base_quantity >
                                                                                                0
                                                                                        ? "Not Completed"
                                                                                        : "Not Started"}
                                                                                </Badge>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    );
                                                                })}
                                                        </TableBody>
                                                    </Table>
                                                </div>

                                                <div className="grid gap-2 border-t border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                                        Ready — 100% Approved
                                                        and billable
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                                                        Not Completed / Not
                                                        Started — cannot Invoice
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                                                        Reserved — already held
                                                        by a Draft Invoice
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                                                        Fully Invoiced — cannot
                                                        Invoice again
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                </div>
                            )}
                        </div>
                    )}

                    {(!editingId && createMode === "Counter Sale") && (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <div className="space-y-2">
                                <Label>
                                    Customer{" "}
                                    <span className="text-red-600">*</span>
                                </Label>
                                <Select
                                    value={customerId}
                                    onValueChange={applyCustomerDefaults}
                                >
                                    <SelectTrigger className={INPUT_CLASS}>
                                        <SelectValue placeholder="Select Customer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(customers.data ?? []).map((
                                            customer,
                                        ) => (
                                            <SelectItem
                                                key={customer.customer_id}
                                                value={customer.customer_id}
                                            >
                                                {customer.customer_code} —{" "}
                                                {customer.customer_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Project</Label>
                                <Select
                                    value={projectId || "none"}
                                    onValueChange={(value) => {
                                        setProjectId(
                                            value === "none" ? "" : value,
                                        );
                                        setSiteId("");
                                    }}
                                    disabled={!customerId}
                                >
                                    <SelectTrigger className={INPUT_CLASS}>
                                        <SelectValue placeholder="Select Project" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            No Project
                                        </SelectItem>
                                        {filteredProjects.map((project) => (
                                            <SelectItem
                                                key={project.project_id}
                                                value={project.project_id}
                                            >
                                                {project.project_no} —{" "}
                                                {project.project_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Project Site</Label>
                                <Select
                                    value={siteId || "none"}
                                    onValueChange={(value) =>
                                        setSiteId(
                                            value === "none" ? "" : value,
                                        )}
                                    disabled={!projectId}
                                >
                                    <SelectTrigger className={INPUT_CLASS}>
                                        <SelectValue placeholder="Select Site" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            No Site
                                        </SelectItem>
                                        {filteredSites.map((site) => (
                                            <SelectItem
                                                key={site.site_id}
                                                value={site.site_id}
                                            >
                                                {site.site_code} —{" "}
                                                {site.site_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Price Book *</Label>
                                <Select
                                    value={priceBookId}
                                    onValueChange={changeDirectPriceBook}
                                >
                                    <SelectTrigger className={INPUT_CLASS}>
                                        <SelectValue placeholder="Select Price Book" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {effectivePriceBooks.map((book) => (
                                            <SelectItem
                                                key={book.price_book_id}
                                                value={book.price_book_id}
                                            >
                                                {book.price_book_name}
                                                {book.is_default
                                                    ? " (Default)"
                                                    : ""}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {editingId && (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <div className="space-y-2">
                                <Label>Customer</Label>
                                <Input
                                    className={INPUT_CLASS}
                                    value={selectedCustomer
                                        ? `${selectedCustomer.customer_code} — ${selectedCustomer.customer_name}`
                                        : customerId}
                                    readOnly
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Project</Label>
                                <Input
                                    className={INPUT_CLASS}
                                    value={selectedProject
                                        ? `${selectedProject.project_no} — ${selectedProject.project_name}`
                                        : projectId || "—"}
                                    readOnly
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Site</Label>
                                <Input
                                    className={INPUT_CLASS}
                                    value={selectedSite
                                        ? `${selectedSite.site_code} — ${selectedSite.site_name}`
                                        : siteId || "—"}
                                    readOnly
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Price Book</Label>
                                <Input
                                    className={INPUT_CLASS}
                                    value={selectedPriceBook?.price_book_name ??
                                        "Source / existing snapshot"}
                                    readOnly
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="rounded-2xl">
                <CardContent className="space-y-5 p-5 md:p-6">
                    <SectionHeader
                        number="02"
                        title="Invoice Details"
                        description="Invoice number is system-generated. Currency is fixed to AUD and is not entered here."
                    />

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="space-y-2">
                            <Label>
                                Invoice Number
                            </Label>

                            <Input
                                className={`${INPUT_CLASS} text-slate-500`}
                                value={editingId
                                    ? "Existing system-generated number"
                                    : "Generated after Save Draft"}
                                readOnly
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Invoice Type
                            </Label>

                            <Select
                                value={invoiceType}
                                onValueChange={setInvoiceType}
                            >
                                <SelectTrigger
                                    className={INPUT_CLASS}
                                >
                                    <SelectValue />
                                </SelectTrigger>

                                <SelectContent>
                                    {[
                                        "Standard",
                                        "Deposit",
                                        "Progress",
                                        "Variation",
                                        "Final",
                                    ].map(
                                        (
                                            type,
                                        ) => (
                                            <SelectItem
                                                key={type}
                                                value={type}
                                            >
                                                {type}
                                            </SelectItem>
                                        ),
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Invoice Date{" "}
                                <span className="text-red-600">
                                    *
                                </span>
                            </Label>

                            <Input
                                type="date"
                                className={INPUT_CLASS}
                                value={invoiceDate}
                                onChange={(
                                    event,
                                ) => applyInvoiceDate(
                                    event
                                        .target
                                        .value,
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Payment Terms</Label>

                            <Input
                                className={INPUT_CLASS}
                                value={formatPaymentTerms(
                                    paymentTermsType,
                                    paymentTermsDays,
                                )}
                                readOnly
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Due Date{" "}
                                <span className="text-red-600">
                                    *
                                </span>
                            </Label>

                            <Input
                                type="date"
                                className={INPUT_CLASS}
                                value={dueDate}
                                readOnly
                            />

                            <p className="text-xs text-slate-500">
                                Calculated automatically from the Invoice Payment Terms.
                            </p>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label>
                                Customer Reference
                            </Label>

                            <Input
                                className={INPUT_CLASS}
                                value={customerReference}
                                onChange={(
                                    event,
                                ) => setCustomerReference(
                                    event
                                        .target
                                        .value,
                                )}
                                placeholder="Customer purchase order or reference"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label>
                                Internal / Invoice Notes
                            </Label>

                            <Textarea
                                className={TEXTAREA_CLASS}
                                value={notes}
                                onChange={(
                                    event,
                                ) => setNotes(
                                    event
                                        .target
                                        .value,
                                )}
                                placeholder="Notes to retain with this Invoice"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {(!isCommercialSourceCreate) && (
                <>
                    <Card className="rounded-2xl">
                        <CardContent className="space-y-5 p-5 md:p-6">
                            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                                <SectionHeader
                                    number="03"
                                    title="Products & Services"
                                    description="Product, Sales UOM, Base UOM, conversion, pricing and discount snapshots are validated by the Backend."
                                />

                                <div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="shrink-0 rounded-xl"
                                        onClick={addLine}
                                        disabled={hasCommercialSource}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Line
                                    </Button>

                                    {hasCommercialSource && (
                                        <p className="mt-2 text-sm text-amber-600">
                                            This Invoice is based on an approved
                                            commercial source. Additional
                                            Products cannot be added here.
                                            Create a new Invoice for any
                                            additional sale.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                {lines.map(
                                    (
                                        line,
                                        index,
                                    ) => {
                                        const product = (
                                            products.data ??
                                                []
                                        ).find(
                                            (
                                                item,
                                            ) => item.product_id ===
                                                line.product_id,
                                        );

                                        const productUoms = product
                                            ? getProductUoms(
                                                product,
                                            )
                                            : [];

                                        const calculation = lineCalculations[
                                            index
                                        ];

                                        return (
                                            <div
                                                key={line.key}
                                                className="rounded-2xl border border-slate-200 bg-white p-4"
                                            >
                                                <div className="mb-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <PackageSearch className="h-5 w-5 text-[#8B3F3F]" />

                                                        <p className="font-semibold text-slate-900">
                                                            Line {index +
                                                                1}
                                                        </p>

                                                        <Badge variant="outline">
                                                            {line.price_source}
                                                        </Badge>
                                                    </div>

                                                    {lines.length >
                                                            1 && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="rounded-xl text-red-600"
                                                            onClick={() =>
                                                                removeLine(
                                                                    line.key,
                                                                )}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>

                                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
                                                    <div className="space-y-2 xl:col-span-4">
                                                        <Label>
                                                            Product / Service
                                                            {" "}
                                                            <span className="text-red-600">
                                                                *
                                                            </span>
                                                        </Label>

                                                        <Select
                                                            value={line
                                                                .product_id ||
                                                                "none"}
                                                            onValueChange={(
                                                                value,
                                                            ) => selectProduct(
                                                                line.key,
                                                                value ===
                                                                        "none"
                                                                    ? ""
                                                                    : value,
                                                            )}
                                                        >
                                                            <SelectTrigger
                                                                className={INPUT_CLASS}
                                                            >
                                                                <SelectValue placeholder="Select Product" />
                                                            </SelectTrigger>

                                                            <SelectContent>
                                                                <SelectItem value="none">
                                                                    Select
                                                                    Product
                                                                </SelectItem>

                                                                {(
                                                                    products
                                                                        .data ??
                                                                        []
                                                                ).map(
                                                                    (
                                                                        item,
                                                                    ) => (
                                                                        <SelectItem
                                                                            key={item
                                                                                .product_id}
                                                                            value={item
                                                                                .product_id}
                                                                        >
                                                                            {item
                                                                                .product_code}
                                                                            {" "}
                                                                            —
                                                                            {" "}
                                                                            {item
                                                                                .product_name}
                                                                        </SelectItem>
                                                                    ),
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-2 xl:col-span-3">
                                                        <Label>
                                                            Project Area
                                                        </Label>

                                                        <Select
                                                            value={line
                                                                .project_area_id ||
                                                                "none"}
                                                            onValueChange={(
                                                                value,
                                                            ) => updateLine(
                                                                line.key,
                                                                {
                                                                    project_area_id:
                                                                        value ===
                                                                                "none"
                                                                            ? ""
                                                                            : value,
                                                                },
                                                            )}
                                                            disabled={!siteId}
                                                        >
                                                            <SelectTrigger
                                                                className={INPUT_CLASS}
                                                            >
                                                                <SelectValue placeholder="No Area" />
                                                            </SelectTrigger>

                                                            <SelectContent>
                                                                <SelectItem value="none">
                                                                    No Area
                                                                </SelectItem>

                                                                {filteredAreas
                                                                    .map(
                                                                        (
                                                                            area,
                                                                        ) => (
                                                                            <SelectItem
                                                                                key={area
                                                                                    .area_id}
                                                                                value={area
                                                                                    .area_id}
                                                                            >
                                                                                {area
                                                                                    .area_code}
                                                                                {" "}
                                                                                —
                                                                                {" "}
                                                                                {area
                                                                                    .area_name}
                                                                            </SelectItem>
                                                                        ),
                                                                    )}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-2 xl:col-span-2">
                                                        <Label>
                                                            Sales UOM{" "}
                                                            <span className="text-red-600">
                                                                *
                                                            </span>
                                                        </Label>

                                                        <Select
                                                            value={line
                                                                .sales_uom_code ||
                                                                "none"}
                                                            onValueChange={(
                                                                value,
                                                            ) => selectLineUom(
                                                                line.key,
                                                                value ===
                                                                        "none"
                                                                    ? ""
                                                                    : value,
                                                            )}
                                                            disabled={!product}
                                                        >
                                                            <SelectTrigger
                                                                className={INPUT_CLASS}
                                                            >
                                                                <SelectValue placeholder="Select UOM" />
                                                            </SelectTrigger>

                                                            <SelectContent>
                                                                <SelectItem value="none">
                                                                    Select UOM
                                                                </SelectItem>

                                                                {productUoms
                                                                    .map(
                                                                        (
                                                                            uom,
                                                                        ) => (
                                                                            <SelectItem
                                                                                key={uom
                                                                                    .uomCode}
                                                                                value={uom
                                                                                    .uomCode}
                                                                            >
                                                                                {uom.uomCode}

                                                                                {uom.factor !==
                                                                                        1
                                                                                    ? ` → ${uom.factor} ${product?.base_uom_code}`
                                                                                    : ""}
                                                                            </SelectItem>
                                                                        ),
                                                                    )}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-2 xl:col-span-1">
                                                        <Label>
                                                            Qty *
                                                        </Label>

                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step={line
                                                                    .allow_fractional_quantity
                                                                ? "0.000001"
                                                                : "1"}
                                                            className={INPUT_CLASS}
                                                            value={line
                                                                .quantity}
                                                            onChange={(
                                                                event,
                                                            ) => changeQuantity(
                                                                line.key,
                                                                event
                                                                    .target
                                                                    .value,
                                                            )}
                                                        />
                                                    </div>

                                                    <div className="space-y-2 xl:col-span-2">
                                                        <Label>
                                                            Unit Price *
                                                        </Label>

                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            className={INPUT_CLASS}
                                                            value={line
                                                                .unit_price}
                                                            readOnly={line
                                                                        .price_source ===
                                                                    "Selling Price Missing" ||
                                                                (Boolean(
                                                                    line.price_book_line_id,
                                                                ) &&
                                                                    !permission[
                                                                        "invoices.override_unit_price"
                                                                    ])}
                                                            onChange={(
                                                                event,
                                                            ) => {
                                                                // Block manual edits when the selected Price Book price is missing
                                                                if (
                                                                    line.price_source ===
                                                                        "Selling Price Missing"
                                                                ) return;

                                                                updateLine(
                                                                    line.key,
                                                                    {
                                                                        unit_price:
                                                                            event
                                                                                .target
                                                                                .value,
                                                                        price_source:
                                                                            line.original_unit_price !==
                                                                                    null &&
                                                                                Number(
                                                                                        event
                                                                                            .target
                                                                                            .value,
                                                                                    ) !==
                                                                                    Number(
                                                                                        line.original_unit_price,
                                                                                    )
                                                                                ? "Manual"
                                                                                : line
                                                                                        .price_book_line_id
                                                                                ? "Price Book"
                                                                                : "Manual",
                                                                    },
                                                                );
                                                            }}
                                                        />
                                                    </div>

                                                    {/* Missing selected Price Book price warning + action */}
                                                    {product &&
                                                        line.sales_uom_code &&
                                                        !line
                                                            .price_book_line_id &&
                                                        line.price_source ===
                                                            "Selling Price Missing" &&
                                                        (
                                                            <div className="xl:col-span-12 mt-2 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800">
                                                                <div className="text-sm">
                                                                    <p>
                                                                        No{" "}
                                                                        {selectedPriceBook
                                                                            ?.price_book_name ??
                                                                            "selected Price Book"}
                                                                        {" "}
                                                                        selling
                                                                        price is
                                                                        configured
                                                                        for this
                                                                        Product
                                                                        / UOM.
                                                                    </p>
                                                                    {line
                                                                                .standard_reference_price !==
                                                                            null &&
                                                                        priceBookId !==
                                                                            defaultPriceBook
                                                                                ?.price_book_id &&
                                                                        (
                                                                            <p className="mt-1 font-medium">
                                                                                Standard
                                                                                Reference:
                                                                                {" "}
                                                                                {money(
                                                                                    line.standard_reference_price,
                                                                                )}
                                                                                {" "}
                                                                                /
                                                                                {" "}
                                                                                {line
                                                                                    .sales_uom_code}
                                                                            </p>
                                                                        )}
                                                                </div>

                                                                {permission[
                                                                        "products.manage_sales_prices"
                                                                    ]
                                                                    ? (
                                                                        <Button
                                                                            variant="outline"
                                                                            className="ml-auto rounded-xl"
                                                                            onClick={() => {
                                                                                setSellingDialogTargetKey(
                                                                                    line.key,
                                                                                );
                                                                                setSellingProductId(
                                                                                    line.product_id ??
                                                                                        null,
                                                                                );
                                                                                setSellingProductCode(
                                                                                    product
                                                                                        .product_code ??
                                                                                        null,
                                                                                );
                                                                                setSellingProductName(
                                                                                    product
                                                                                        .product_name ??
                                                                                        null,
                                                                                );
                                                                                const dialogDate =
                                                                                    invoiceDate ||
                                                                                    today();
                                                                                const dialogUom =
                                                                                    line.sales_uom_code ??
                                                                                        "";

                                                                                setSellingUom(
                                                                                    dialogUom ||
                                                                                        null,
                                                                                );
                                                                                setSellingEffectiveFrom(
                                                                                    dialogDate,
                                                                                );

                                                                                if (
                                                                                    line.product_id &&
                                                                                    dialogUom
                                                                                ) {
                                                                                    loadSellingPriceMatrix(
                                                                                        line.product_id,
                                                                                        dialogUom,
                                                                                        dialogDate,
                                                                                    );
                                                                                } else {
                                                                                    setSellingPricesByBook(
                                                                                        {},
                                                                                    );
                                                                                    setSellingMinimumPricesByBook(
                                                                                        {},
                                                                                    );
                                                                                }

                                                                                setShowSellingPriceDialog(
                                                                                    true,
                                                                                );
                                                                            }}
                                                                        >
                                                                            Set
                                                                            Selling
                                                                            Price
                                                                        </Button>
                                                                    )
                                                                    : (
                                                                        <div className="ml-auto text-sm">
                                                                            Ask
                                                                            an
                                                                            authorised
                                                                            user
                                                                            to
                                                                            configure
                                                                            the
                                                                            selected
                                                                            Price
                                                                            Book
                                                                            selling
                                                                            price.
                                                                        </div>
                                                                    )}
                                                            </div>
                                                        )}

                                                    <div className="space-y-2 xl:col-span-5">
                                                        <Label>
                                                            Description
                                                        </Label>

                                                        <Input
                                                            className={INPUT_CLASS}
                                                            value={line
                                                                .description}
                                                            onChange={(
                                                                event,
                                                            ) => updateLine(
                                                                line.key,
                                                                {
                                                                    description:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                },
                                                            )}
                                                        />
                                                    </div>

                                                    <div className="space-y-2 xl:col-span-2">
                                                        <Label>
                                                            Base UOM
                                                        </Label>

                                                        <Input
                                                            className={`${INPUT_CLASS} text-slate-500`}
                                                            value={line
                                                                .base_uom_code}
                                                            readOnly
                                                        />
                                                    </div>

                                                    <div className="space-y-2 xl:col-span-2">
                                                        <Label>
                                                            Conversion
                                                        </Label>

                                                        <Input
                                                            className={`${INPUT_CLASS} text-slate-500`}
                                                            value={numberText(
                                                                line.conversion_factor,
                                                                6,
                                                            )}
                                                            readOnly
                                                        />
                                                    </div>

                                                    <div className="space-y-2 xl:col-span-2">
                                                        <Label>
                                                            Base Quantity
                                                        </Label>

                                                        <Input
                                                            className={`${INPUT_CLASS} text-slate-500`}
                                                            value={numberText(
                                                                line.base_quantity,
                                                                6,
                                                            )}
                                                            readOnly
                                                        />
                                                    </div>

                                                    <div className="space-y-2 xl:col-span-1">
                                                        <Label>
                                                            Discount %
                                                        </Label>

                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            step="0.0001"
                                                            className={INPUT_CLASS}
                                                            value={line
                                                                .discount_percent}
                                                            readOnly={!permission[
                                                                "invoices.override_discount"
                                                            ]}
                                                            onChange={(
                                                                event,
                                                            ) => updateLine(
                                                                line.key,
                                                                {
                                                                    discount_percent:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                },
                                                            )}
                                                        />
                                                    </div>

                                                    <div className="space-y-2 xl:col-span-1">
                                                        <Label>
                                                            GST %
                                                        </Label>

                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            step="0.0001"
                                                            className={INPUT_CLASS}
                                                            value={lineAmountType ===
                                                                    "No Tax"
                                                                ? "0"
                                                                : line.tax_rate}
                                                            readOnly={lineAmountType ===
                                                                "No Tax"}
                                                            onChange={(
                                                                event,
                                                            ) => updateLine(
                                                                line.key,
                                                                {
                                                                    tax_rate:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                },
                                                            )}
                                                        />
                                                    </div>

                                                    <div className="space-y-2 xl:col-span-6">
                                                        <Label>
                                                            Line Notes
                                                        </Label>

                                                        <Input
                                                            className={INPUT_CLASS}
                                                            value={line.notes}
                                                            onChange={(
                                                                event,
                                                            ) => updateLine(
                                                                line.key,
                                                                {
                                                                    notes: event
                                                                        .target
                                                                        .value,
                                                                },
                                                            )}
                                                        />
                                                    </div>

                                                    <div className="xl:col-span-6">
                                                        <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm sm:grid-cols-4">
                                                            <div>
                                                                <p className="text-xs text-slate-500">
                                                                    Line
                                                                    Subtotal
                                                                </p>

                                                                <p className="font-semibold">
                                                                    {money(
                                                                        calculation
                                                                            ?.subtotal,
                                                                    )}
                                                                </p>
                                                            </div>

                                                            <div>
                                                                <p className="text-xs text-slate-500">
                                                                    Discount
                                                                </p>

                                                                <p className="font-semibold">
                                                                    {money(
                                                                        calculation
                                                                            ?.discountAmount,
                                                                    )}
                                                                </p>
                                                            </div>

                                                            <div>
                                                                <p className="text-xs text-slate-500">
                                                                    GST
                                                                </p>

                                                                <p className="font-semibold">
                                                                    {money(
                                                                        calculation
                                                                            ?.taxAmount,
                                                                    )}
                                                                </p>
                                                            </div>

                                                            <div>
                                                                <p className="text-xs text-slate-500">
                                                                    Line Total
                                                                </p>

                                                                <p className="font-bold text-[#8B3F3F]">
                                                                    {money(
                                                                        calculation
                                                                            ?.total,
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    },
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl">
                        <CardContent className="space-y-5 p-5 md:p-6">
                            <SectionHeader
                                number="04"
                                title="Financial Summary"
                                description="Values below are previews. The Backend recalculates and validates all final amounts."
                            />

                            <div className="ml-auto grid max-w-2xl gap-3 sm:grid-cols-2">
                                <div className="rounded-xl border border-slate-200 p-4">
                                    <p className="text-sm text-slate-500">
                                        Subtotal before discount
                                    </p>

                                    <p className="mt-1 text-xl font-semibold">
                                        {money(
                                            formTotals.subtotal,
                                        )}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-200 p-4">
                                    <p className="text-sm text-slate-500">
                                        Line Discounts
                                    </p>

                                    <p className="mt-1 text-xl font-semibold text-red-700">
                                        − {money(
                                            formTotals.discount,
                                        )}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-200 p-4">
                                    <p className="text-sm text-slate-500">
                                        GST (
                                        {lineAmountType}
                                        )
                                    </p>

                                    <p className="mt-1 text-xl font-semibold">
                                        {money(
                                            formTotals.tax,
                                        )}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-[#8B3F3F] bg-red-50 p-4">
                                    <p className="text-sm text-[#8B3F3F]">
                                        Invoice Total
                                    </p>

                                    <p className="mt-1 text-2xl font-bold text-[#8B3F3F]">
                                        {money(
                                            formTotals.grandTotal,
                                        )}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            <Card className="rounded-2xl">
                <CardContent className="space-y-5 p-5 md:p-6">
                    <SectionHeader
                        number={isCommercialSourceCreate ? "03" : "05"}
                        title="Review & Status"
                        description="The Invoice is saved as Draft. Approval and Issue remain separate permission-controlled actions."
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 p-4">
                            <p className="text-xs text-slate-500">
                                Document Status
                            </p>

                            <p className="mt-1 font-semibold text-slate-900">
                                Draft
                            </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 p-4">
                            <p className="text-xs text-slate-500">
                                Payment Status
                            </p>

                            <p className="mt-1 font-semibold text-slate-900">
                                Unpaid
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            className="rounded-xl"
                            onClick={closeToList}
                        >
                            Cancel
                        </Button>

                        <Button
                            className={RED_BUTTON}
                            disabled={
                                saveInvoice.isPending ||
                                (
                                    !editingId &&
                                    (
                                        createMode === "Quotation" ||
                                        createMode === "Accepted Revision" ||
                                        createMode === "Variation"
                                    ) &&
                                    selectedWorkOrderIds.length === 0
                                )
                            }
                            onClick={() => saveInvoice.mutate()}
                        >
                            {saveInvoice.isPending
                                ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )
                                : <FilePlus2 className="mr-2 h-4 w-4" />}

                            {editingId ? "Update Draft" : "Save Draft"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    const renderDetail = () => {
        const invoice = detail.data?.invoice ?? {};

        const detailLines = detail.data?.active_lines ?? [];

        const detailSources = (
            detail.data?.active_sources ?? []
        ).filter(
            (source) =>
                !source.is_deleted,
        );

        const allocations = detail.data?.payments ?? [];

        const status = String(
            invoice.document_status ?? "",
        );

        const invoiceId = String(
            invoice.customer_invoice_id ??
                selectedId ??
                "",
        );

        const detailLineAmountType = normalizeLineAmountType(
            String(invoice.line_amount_type ?? "Exclusive"),
        );
        const detailShowsSeparateGst =
            detailLineAmountType === "Exclusive";

        return (
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div className="flex items-start gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            className="mt-1 rounded-xl"
                            onClick={closeToList}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>

                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
                                    {String(
                                        invoice.invoice_no ??
                                            "Invoice",
                                    )}
                                </h1>

                                <Badge
                                    variant="outline"
                                    className={statusBadgeClass(
                                        status,
                                    )}
                                >
                                    {status ||
                                        "—"}
                                </Badge>

                                <Badge
                                    variant="outline"
                                    className={statusBadgeClass(
                                        String(
                                            invoice.payment_status ??
                                                "",
                                        ),
                                    )}
                                >
                                    {String(
                                        invoice.payment_status ??
                                            "—",
                                    )}
                                </Badge>
                            </div>

                            <p className="mt-1 text-sm text-slate-500">
                                {String(
                                    invoice.invoice_type ??
                                        "Standard",
                                )} Invoice
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            className="rounded-xl"
                            onClick={() =>
                                printCustomerInvoice(
                                    invoice,
                                    detailLines,
                                )}
                        >
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                        </Button>

                        <Button
                            variant="outline"
                            className="rounded-xl"
                            onClick={() =>
                                downloadCustomerInvoicePdf(
                                    invoice,
                                    detailLines,
                                )}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                        </Button>

                        {status ===
                                "Draft" &&
                            permission[
                                "invoices.update_draft"
                            ] && (
                            <Button
                                variant="outline"
                                className="rounded-xl"
                                onClick={() =>
                                    openEdit(
                                        invoiceId,
                                    )}
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        )}

                        {status ===
                                "Draft" &&
                            permission[
                                "invoices.approve"
                            ] && (
                            <Button
                                className={RED_BUTTON}
                                disabled={workflowAction.isPending}
                                onClick={() =>
                                    workflowAction.mutate(
                                        {
                                            rpcName: "approve_invoice_atomic",
                                            invoiceId,
                                        },
                                    )}
                            >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Approve
                            </Button>
                        )}

                        {status ===
                                "Approved" &&
                            permission[
                                "invoices.issue"
                            ] && (
                            <Button
                                className={RED_BUTTON}
                                disabled={workflowAction.isPending}
                                onClick={() =>
                                    workflowAction.mutate(
                                        {
                                            rpcName: "issue_invoice_atomic",
                                            invoiceId,
                                        },
                                    )}
                            >
                                <Send className="mr-2 h-4 w-4" />
                                Issue
                            </Button>
                        )}
                    </div>
                </div>

                {detail.isLoading
                    ? (
                        <Card className="rounded-2xl">
                            <CardContent className="flex h-48 items-center justify-center">
                                <Loader2 className="h-7 w-7 animate-spin text-[#8B3F3F]" />
                            </CardContent>
                        </Card>
                    )
                    : (
                        <>
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                <Card className="rounded-2xl">
                                    <CardContent className="p-5">
                                        <p className="text-sm text-slate-500">
                                            Invoice Total
                                        </p>

                                        <p className="mt-1 text-2xl font-bold">
                                            {money(
                                                invoice.total_amount,
                                            )}
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="rounded-2xl">
                                    <CardContent className="p-5">
                                        <p className="text-sm text-slate-500">
                                            Paid
                                        </p>

                                        <p className="mt-1 text-2xl font-bold text-green-700">
                                            {money(
                                                invoice.paid_amount,
                                            )}
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="rounded-2xl">
                                    <CardContent className="p-5">
                                        <p className="text-sm text-slate-500">
                                            Balance
                                        </p>

                                        <p className="mt-1 text-2xl font-bold text-[#8B3F3F]">
                                            {money(
                                                invoice.balance_amount,
                                            )}
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="rounded-2xl">
                                    <CardContent className="p-5">
                                        <p className="text-sm text-slate-500">
                                            Due Date
                                        </p>

                                        <p className="mt-1 text-xl font-bold">
                                            {dateText(
                                                invoice.due_date,
                                            )}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="rounded-2xl">
                                <CardHeader>
                                    <CardTitle className="text-lg">
                                        Invoice Information
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
                                    {[
                                        [
                                            "Customer",
                                            invoice.customer_name,
                                        ],
                                        [
                                            "Customer Code",
                                            invoice.customer_code,
                                        ],
                                        [
                                            "Project",
                                            invoice.project_name,
                                        ],
                                        [
                                            "Project Site",
                                            invoice.site_name,
                                        ],
                                        [
                                            "Invoice Date",
                                            dateText(
                                                invoice.invoice_date,
                                            ),
                                        ],
                                        [
                                            "Due Date",
                                            dateText(
                                                invoice.due_date,
                                            ),
                                        ],
                                        [
                                            "Customer Reference",
                                            invoice.customer_reference,
                                        ],
                                        [
                                            "Price Book",
                                            (priceBooks.data ?? []).find(
                                                (book) =>
                                                    book.price_book_id ===
                                                    invoice.price_book_id,
                                            )?.price_book_name ??
                                                invoice.price_book_name ??
                                                "—",
                                        ],
                                        [
                                            "Line Amount Type",
                                            invoice.line_amount_type,
                                        ],
                                        [
                                            "Payment Terms",
                                            formatPaymentTerms(
                                                invoice.payment_terms_type,
                                                invoice.payment_terms_days,
                                            ),
                                        ],
                                        [
                                            "Subtotal",
                                            money(
                                                invoice.subtotal_amount,
                                            ),
                                        ],
                                        [
                                            "Discount",
                                            money(
                                                invoice.discount_amount,
                                            ),
                                        ],
                                        ...(detailShowsSeparateGst
                                            ? [[
                                                "GST",
                                                money(
                                                    invoice.tax_amount,
                                                ),
                                            ]]
                                            : []),
                                        [
                                            "Total",
                                            money(
                                                invoice.total_amount,
                                            ),
                                        ],
                                        [
                                            "Notes",
                                            invoice.notes,
                                        ],
                                    ].map(
                                        ([
                                            label,
                                            value,
                                        ]) => (
                                            <div
                                                key={String(
                                                    label,
                                                )}
                                            >
                                                <p className="text-xs text-slate-500">
                                                    {String(
                                                        label,
                                                    )}
                                                </p>

                                                <p className="mt-1 font-medium text-slate-900">
                                                    {String(
                                                        value ??
                                                            "—",
                                                    )}
                                                </p>
                                            </div>
                                        ),
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="overflow-hidden rounded-2xl">
                                <CardHeader>
                                    <CardTitle className="text-lg">
                                        Products & Services
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>
                                                        #
                                                    </TableHead>

                                                    <TableHead>
                                                        Product / Description
                                                    </TableHead>

                                                    <TableHead>
                                                        UOM Conversion
                                                    </TableHead>

                                                    <TableHead className="text-right">
                                                        Qty
                                                    </TableHead>

                                                    <TableHead className="text-right">
                                                        Unit Price
                                                    </TableHead>

                                                    <TableHead className="text-right">
                                                        Discount
                                                    </TableHead>

                                                    {detailShowsSeparateGst && (
                                                        <TableHead className="text-right">
                                                            GST
                                                        </TableHead>
                                                    )}

                                                    <TableHead className="text-right">
                                                        Total
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>

                                            <TableBody>
                                                {detailLines.map(
                                                    (
                                                        line,
                                                        index,
                                                    ) => (
                                                        <TableRow
                                                            key={String(
                                                                line.customer_invoice_item_id ??
                                                                    index,
                                                            )}
                                                        >
                                                            <TableCell>
                                                                {String(
                                                                    line.line_no ??
                                                                        index +
                                                                            1,
                                                                )}
                                                            </TableCell>

                                                            <TableCell>
                                                                <p className="font-semibold text-slate-900">
                                                                    {String(
                                                                        line.product_code ??
                                                                            "Manual",
                                                                    )}
                                                                </p>

                                                                <p className="text-sm">
                                                                    {String(
                                                                        line.description ??
                                                                            "—",
                                                                    )}
                                                                </p>

                                                                <p className="text-xs text-slate-500">
                                                                    {String(
                                                                        line.product_name ??
                                                                            "",
                                                                    )}
                                                                </p>
                                                            </TableCell>

                                                            <TableCell>
                                                                <p>
                                                                    {String(
                                                                        line.sales_uom_code ??
                                                                            "—",
                                                                    )} →{" "}
                                                                    {String(
                                                                        line.base_uom_code ??
                                                                            "—",
                                                                    )}
                                                                </p>

                                                                <p className="text-xs text-slate-500">
                                                                    Factor{" "}
                                                                    {numberText(
                                                                        line.conversion_factor,
                                                                        6,
                                                                    )}{" "}
                                                                    / Base Qty
                                                                    {" "}
                                                                    {numberText(
                                                                        line.base_quantity,
                                                                        6,
                                                                    )}
                                                                </p>
                                                            </TableCell>

                                                            <TableCell className="text-right">
                                                                {numberText(
                                                                    line.quantity,
                                                                    6,
                                                                )}
                                                            </TableCell>

                                                            <TableCell className="text-right">
                                                                {money(
                                                                    line.unit_price,
                                                                )}

                                                                <p className="text-xs text-slate-500">
                                                                    {String(
                                                                        line.price_source ??
                                                                            "",
                                                                    )}
                                                                </p>
                                                            </TableCell>

                                                            <TableCell className="text-right">
                                                                {numberText(
                                                                    line.discount_percent,
                                                                    4,
                                                                )}
                                                                %

                                                                <p className="text-xs text-slate-500">
                                                                    {money(
                                                                        line.discount_amount,
                                                                    )}
                                                                </p>
                                                            </TableCell>

                                                            {detailShowsSeparateGst && (
                                                                <TableCell className="text-right">
                                                                    {money(
                                                                        line.tax_amount,
                                                                    )}
                                                                </TableCell>
                                                            )}

                                                            <TableCell className="text-right font-semibold">
                                                                {money(
                                                                    line.line_total,
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ),
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="grid gap-4 lg:grid-cols-2">
                                <Card className="rounded-2xl">
                                    <CardHeader>
                                        <CardTitle className="text-lg">
                                            Commercial Sources
                                        </CardTitle>
                                    </CardHeader>

                                    <CardContent>
                                        {detailSources.length ===
                                                0
                                            ? (
                                                <p className="text-sm text-slate-500">
                                                    No linked Quotation or
                                                    Variation source.
                                                </p>
                                            )
                                            : (
                                                <div className="space-y-3">
                                                    {detailSources.map(
                                                        (
                                                            source,
                                                            index,
                                                        ) => (
                                                            <div
                                                                key={String(
                                                                    source
                                                                        .invoice_source_id ??
                                                                        index,
                                                                )}
                                                                className="flex items-center justify-between rounded-xl border border-slate-200 p-3"
                                                            >
                                                                <div>
                                                                    <p className="font-medium">
                                                                        {String(
                                                                            source
                                                                                .source_type ??
                                                                                "Source",
                                                                        )}
                                                                    </p>

                                                                    <p className="text-xs text-slate-500">
                                                                        {String(
                                                                            source
                                                                                .source_reference ??
                                                                                source
                                                                                    .source_id ??
                                                                                "—",
                                                                        )}
                                                                    </p>
                                                                </div>

                                                                <p className="font-semibold">
                                                                    {money(
                                                                        source
                                                                            .source_amount,
                                                                    )}
                                                                </p>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            )}
                                    </CardContent>
                                </Card>

                                <Card className="rounded-2xl">
                                    <CardHeader>
                                        <CardTitle className="text-lg">
                                            Payment Allocations
                                        </CardTitle>
                                    </CardHeader>

                                    <CardContent>
                                        {allocations.length ===
                                                0
                                            ? (
                                                <p className="text-sm text-slate-500">
                                                    No payments allocated to
                                                    this Invoice.
                                                </p>
                                            )
                                            : (
                                                <div className="space-y-3">
                                                    {allocations.map(
                                                        (
                                                            allocation,
                                                            index,
                                                        ) => (
                                                            <div
                                                                key={String(
                                                                    allocation
                                                                        .customer_payment_allocation_id ??
                                                                        index,
                                                                )}
                                                                className="flex items-center justify-between rounded-xl border border-slate-200 p-3"
                                                            >
                                                                <div>
                                                                    <p className="font-medium">
                                                                        {String(
                                                                            allocation
                                                                                .payment_no ??
                                                                                "Payment",
                                                                        )}
                                                                    </p>

                                                                    <p className="text-xs text-slate-500">
                                                                        {dateText(
                                                                            allocation
                                                                                .payment_date,
                                                                        )}
                                                                    </p>
                                                                </div>

                                                                <p className="font-semibold text-green-700">
                                                                    {money(
                                                                        allocation
                                                                            .allocated_amount,
                                                                    )}
                                                                </p>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            )}
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="rounded-2xl">
                                <CardHeader>
                                    <CardTitle className="text-lg">
                                        Workflow Actions
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="flex flex-wrap gap-2">
                                    {(status ===
                                            "Draft" ||
                                        status ===
                                            "Approved") &&
                                        permission[
                                            "invoices.cancel"
                                        ] && (
                                        <Button
                                            variant="outline"
                                            className="rounded-xl border-red-200 text-red-700 hover:bg-red-50"
                                            onClick={() => {
                                                setReasonAction(
                                                    "cancel",
                                                );
                                                setReason(
                                                    "",
                                                );
                                                setShowReasonDialog(
                                                    true,
                                                );
                                            }}
                                        >
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Cancel Invoice
                                        </Button>
                                    )}

                                    {status ===
                                            "Issued" &&
                                        Number(
                                                invoice.paid_amount ||
                                                    0,
                                            ) === 0 &&
                                        permission[
                                            "invoices.void"
                                        ] && (
                                        <Button
                                            variant="outline"
                                            className="rounded-xl border-red-200 text-red-700 hover:bg-red-50"
                                            onClick={() => {
                                                setReasonAction(
                                                    "void",
                                                );
                                                setReason(
                                                    "",
                                                );
                                                setShowReasonDialog(
                                                    true,
                                                );
                                            }}
                                        >
                                            <FileMinus2 className="mr-2 h-4 w-4" />
                                            Void Invoice
                                        </Button>
                                    )}

                                    {(status ===
                                            "Draft" ||
                                        status ===
                                            "Cancelled") &&
                                        permission[
                                            "invoices.soft_delete"
                                        ] && (
                                        <Button
                                            variant="outline"
                                            className="rounded-xl"
                                            disabled={workflowAction.isPending}
                                            onClick={() =>
                                                workflowAction.mutate(
                                                    {
                                                        rpcName:
                                                            "soft_delete_invoice_atomic",
                                                        invoiceId,
                                                    },
                                                )}
                                        >
                                            <Archive className="mr-2 h-4 w-4" />
                                            Archive
                                        </Button>
                                    )}

                                    {status ===
                                            "Issued" &&
                                        permission[
                                            "invoices.create_credit_note"
                                        ] && (
                                        <div className="rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-500">
                                            Credit Note uses the dedicated
                                            Credit Note workflow.
                                        </div>
                                    )}

                                    {permission[
                                        "invoices.release_retention"
                                    ] && (
                                        <div className="rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-500">
                                            Retention Release uses the dedicated
                                            Site Retention workflow.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    )}
            </div>
        );
    };

    return (
        <>
            {mode === "list" &&
                renderList()}

            {mode === "form" &&
                renderForm()}

            {mode === "detail" &&
                renderDetail()}

            <Dialog
                open={showReasonDialog}
                onOpenChange={setShowReasonDialog}
            >
                <DialogContent className="rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {reasonAction ===
                                    "cancel"
                                ? "Cancel Invoice"
                                : "Void Invoice"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>
                                Reason{" "}
                                <span className="text-red-600">
                                    *
                                </span>
                            </Label>

                            <Textarea
                                className={TEXTAREA_CLASS}
                                value={reason}
                                onChange={(
                                    event,
                                ) => setReason(
                                    event
                                        .target
                                        .value,
                                )}
                                placeholder="Enter the required reason"
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                className="rounded-xl"
                                onClick={() =>
                                    setShowReasonDialog(
                                        false,
                                    )}
                            >
                                Close
                            </Button>

                            <Button
                                className={RED_BUTTON}
                                disabled={!reason.trim() ||
                                    workflowAction.isPending ||
                                    !selectedId}
                                onClick={() => {
                                    if (
                                        !selectedId ||
                                        !reasonAction
                                    ) {
                                        return;
                                    }

                                    workflowAction.mutate(
                                        {
                                            rpcName: reasonAction ===
                                                    "cancel"
                                                ? "cancel_invoice_atomic"
                                                : "void_invoice_atomic",
                                            invoiceId: selectedId,
                                            args: {
                                                p_reason: reason.trim(),
                                            },
                                        },
                                    );
                                }}
                            >
                                {workflowAction.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}

                                Confirm
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={showSellingPriceDialog}
                onOpenChange={setShowSellingPriceDialog}
            >
                <DialogContent className="rounded-2xl max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Set Selling Price</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-3">
                        <div>
                            <p className="text-xs text-slate-500">
                                Product Code
                            </p>
                            <p className="font-medium">
                                {sellingProductCode ?? "—"}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-slate-500">
                                Product Name
                            </p>
                            <p className="font-medium">
                                {sellingProductName ?? "—"}
                            </p>
                        </div>

                        <div>
                            <Label>Selling UOM *</Label>
                            <Select
                                value={sellingUom || "none"}
                                onValueChange={(value) => {
                                    const nextUom = value === "none"
                                        ? null
                                        : value;
                                    setSellingUom(nextUom);

                                    if (sellingProductId && nextUom) {
                                        loadSellingPriceMatrix(
                                            sellingProductId,
                                            nextUom,
                                            sellingEffectiveFrom ||
                                                invoiceDate || today(),
                                        );
                                    } else {
                                        setSellingPricesByBook({});
                                        setSellingMinimumPricesByBook({});
                                    }
                                }}
                                disabled={!sellingProduct}
                            >
                                <SelectTrigger className={INPUT_CLASS}>
                                    <SelectValue placeholder="Select UOM" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="none">
                                        Select UOM
                                    </SelectItem>
                                    {sellingProductUoms.map((uom) => (
                                        <SelectItem
                                            key={uom.uomCode}
                                            value={uom.uomCode}
                                        >
                                            {uom.uomCode}
                                            {uom.factor !== 1
                                                ? ` → ${uom.factor} ${sellingProduct?.base_uom_code}`
                                                : ""}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

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
                                                {book.price_book_name}
                                                {book.is_default
                                                    ? " (Default)"
                                                    : ""}
                                            </p>
                                            {!hasCommercialSource &&
                                                book.price_book_id ===
                                                    priceBookId &&
                                                (
                                                    <p className="mt-0.5 text-xs text-[#8B3F3F]">
                                                        Current Invoice Price
                                                        Book
                                                    </p>
                                                )}
                                        </div>

                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className={INPUT_CLASS}
                                            value={sellingPricesByBook[
                                                book.price_book_id
                                            ] ?? ""}
                                            onChange={(event) =>
                                                setSellingPricesByBook((
                                                    current,
                                                ) => ({
                                                    ...current,
                                                    [book.price_book_id]:
                                                        event.target.value,
                                                }))}
                                            placeholder="Not Set"
                                        />

                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className={INPUT_CLASS}
                                            value={sellingMinimumPricesByBook[
                                                book.price_book_id
                                            ] ?? ""}
                                            onChange={(event) =>
                                                setSellingMinimumPricesByBook(
                                                    (current) => ({
                                                        ...current,
                                                        [book.price_book_id]:
                                                            event.target.value,
                                                    }),
                                                )}
                                            placeholder="Optional"
                                        />
                                    </div>
                                ))}
                            </div>

                            <p className="mt-3 text-xs text-slate-500">
                                Blank prices remain Not Set. Prices are saved
                                separately for each Price Book and are never
                                silently replaced by Standard.
                            </p>
                        </div>

                        <div>
                            <Label>Effective From</Label>
                            <Input
                                type="date"
                                className={INPUT_CLASS}
                                value={sellingEffectiveFrom}
                                onChange={(e) =>
                                    setSellingEffectiveFrom(e.target.value)}
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowSellingPriceDialog(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className={RED_BUTTON}
                                onClick={handleSaveSellingPrice}
                                disabled={setSellingPrices.isPending}
                            >
                                Save Selling Prices
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default Invoices;
