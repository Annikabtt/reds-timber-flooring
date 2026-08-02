import { useMemo, useState } from "react";
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

import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
    discount_amount?: number;
    tax_amount: number;
    total_amount: number;
    paid_amount: number;
    balance_amount: number;
    currency_code: string;
    customer_reference: string | null;
    active_line_count: number;
    active_source_count: number;
    source_types: unknown[];
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

type UomConversion = {
    product_uom_conversion_id: string;
    product_id: string;
    from_uom_code: string;
    to_uom_code: string;
    conversion_factor: number;
    allow_fractional_quantity: boolean;
    sort_order: number;
};

type PriceBook = {
    price_book_id: string;
    price_book_code: string;
    price_book_name: string;
    is_default: boolean;
};

type PriceBookLine = {
    price_book_line_id: string;
    price_book_id: string;
    product_id: string;
    unit_price: number;
    minimum_price: number | null;
};

type SourceOption = {
    source_type: "Quotation" | "Variation";
    source_id: string;
    source_no: string;
    customer_id: string;
    project_id: string | null;
    project_site_id: string | null;
    total_amount: number;
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
    price_book_line_id: string;
    price_source: string;
    original_unit_price: number | null;
    quantity: string;
    unit_price: string;
    discount_percent: string;
    tax_rate: string;
    notes: string;
};

type InvoiceSourceDraft = {
    key: string;
    source_type: "Quotation" | "Variation";
    source_id: string;
    source_amount: string;
};

type InvoiceDetail = {
    invoice?: Record<string, unknown>;
    lines?: Array<Record<string, unknown>>;
    sources?: Array<Record<string, unknown>>;
    allocations?: Array<Record<string, unknown>>;
    status_history?: Array<Record<string, unknown>>;
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

const money = (value: unknown) =>
    new Intl.NumberFormat("en-AU", {
        style: "currency",
        currency: "AUD",
    }).format(Number(value || 0));

const numberText = (
    value: unknown,
    maximumFractionDigits = 6,
) =>
    new Intl.NumberFormat("en-AU", {
        maximumFractionDigits,
    }).format(Number(value || 0));

const dateText = (value: unknown) =>
    value
        ? new Date(String(value)).toLocaleDateString("en-AU")
        : "—";

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
    price_book_line_id: "",
    price_source: "Manual",
    original_unit_price: null,
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
    const [documentStatus, setDocumentStatus] =
        useState("All");
    const [paymentStatus, setPaymentStatus] = useState("All");
    const [invoiceTypeFilter, setInvoiceTypeFilter] =
        useState("All");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [page, setPage] = useState(1);

    const [customerId, setCustomerId] = useState("");
    const [projectId, setProjectId] = useState("");
    const [siteId, setSiteId] = useState("");
    const [priceBookId, setPriceBookId] = useState("");
    const [invoiceType, setInvoiceType] =
        useState("Standard");
    const [invoiceDate, setInvoiceDate] = useState(today());
    const [dueDate, setDueDate] = useState(
        addDays(today(), 14),
    );
    const [customerReference, setCustomerReference] =
        useState("");
    const [notes, setNotes] = useState("");
    const [lineAmountType, setLineAmountType] =
        useState("Exclusive");
    const [customerDiscount, setCustomerDiscount] =
        useState(0);

    const [lines, setLines] = useState<InvoiceLineDraft[]>([
        createBlankLine(1),
    ]);

    const [sources, setSources] = useState<
        InvoiceSourceDraft[]
    >([]);

    const [showReasonDialog, setShowReasonDialog] =
        useState(false);

    const [reasonAction, setReasonAction] = useState<
        "cancel" | "void" | null
    >(null);

    const [reason, setReason] = useState("");

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
            const { data, error } = await (supabase as any)
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
            const { data, error } = await (supabase as any)
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
            const { data, error } = await (supabase as any)
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
            const { data, error } = await (supabase as any)
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
            const { data, error } = await (supabase as any)
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
            const { data, error } = await (supabase as any)
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

    const conversions = useQuery({
        queryKey: ["invoice-product-uom-conversions-v2"],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("product_uom_conversions")
                .select(
                    [
                        "product_uom_conversion_id",
                        "product_id",
                        "from_uom_code",
                        "to_uom_code",
                        "conversion_factor",
                        "allow_fractional_quantity",
                        "sort_order",
                    ].join(", "),
                )
                .eq("is_deleted", false)
                .eq("is_active", true)
                .order("sort_order");

            if (error) {
                throw error;
            }

            return (data ?? []) as UomConversion[];
        },
    });

    const priceBooks = useQuery({
        queryKey: ["invoice-price-books-v2"],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("price_books")
                .select(
                    "price_book_id, price_book_code, price_book_name, is_default",
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
            const { data, error } = await (supabase as any)
                .from("price_book_lines")
                .select(
                    [
                        "price_book_line_id",
                        "price_book_id",
                        "product_id",
                        "unit_price",
                        "minimum_price",
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
        queryKey: ["invoice-source-options-v2"],
        queryFn: async () => {
            const result: SourceOption[] = [];

            const {
                data: quotationRows,
                error: quotationError,
            } = await (supabase as any)
                .from("quotations")
                .select(
                    [
                        "quotation_id",
                        "quotation_no",
                        "customer_id",
                        "project_site_id",
                        "total_amount",
                        "project_sites(project_id)",
                    ].join(", "),
                )
                .eq("quotation_status", "Accepted")
                .eq("is_deleted", false)
                .eq("is_active", true)
                .order("quotation_no");

            if (quotationError) {
                throw quotationError;
            }

            for (const row of quotationRows ?? []) {
                result.push({
                    source_type: "Quotation",
                    source_id: String(row.quotation_id),
                    source_no: String(row.quotation_no),
                    customer_id: String(row.customer_id),
                    project_id:
                        row.project_sites?.project_id
                            ? String(
                                  row.project_sites.project_id,
                              )
                            : null,
                    project_site_id: row.project_site_id
                        ? String(row.project_site_id)
                        : null,
                    total_amount: Number(
                        row.total_amount || 0,
                    ),
                });
            }

            const {
                data: variationRows,
                error: variationError,
            } = await (supabase as any)
                .from("variations")
                .select(
                    [
                        "variation_id",
                        "variation_no",
                        "customer_id",
                        "project_id",
                        "project_site_id",
                        "total_amount",
                    ].join(", "),
                )
                .eq("variation_status", "Accepted")
                .eq("is_deleted", false)
                .eq("is_active", true)
                .order("variation_no");

            if (variationError) {
                throw variationError;
            }

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
                    total_amount: Number(
                        row.total_amount || 0,
                    ),
                });
            }

            return result;
        },
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
                    p_document_status:
                        documentStatus === "All"
                            ? null
                            : documentStatus,
                    p_payment_status:
                        paymentStatus === "All"
                            ? null
                            : paymentStatus,
                    p_invoice_type:
                        invoiceTypeFilter === "All"
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
        queryKey: ["invoice-detail-v2", selectedId],
        enabled: Boolean(selectedId),
        queryFn: () =>
            callRpc<InvoiceDetail>(
                "get_customer_invoice_detail",
                {
                    p_invoice_id: selectedId,
                },
            ),
    });

    const permission = permissions.data ?? {};
    const rows = invoiceList.data ?? [];

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
                (customer) =>
                    customer.customer_id === customerId,
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

    const selectedPriceBook = useMemo(
        () =>
            (priceBooks.data ?? []).find(
                (book) =>
                    book.price_book_id === priceBookId,
            ) ?? null,
        [priceBookId, priceBooks.data],
    );

    const filteredProjects = useMemo(
        () =>
            (projects.data ?? []).filter(
                (project) =>
                    project.customer_id === customerId,
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
                    (row) =>
                        Number(row.days_overdue || 0) > 0,
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

                const taxRate =
                    lineAmountType === "No Tax"
                        ? 0
                        : Number(line.tax_rate || 0);

                const subtotal = quantity * unitPrice;

                const discountAmount =
                    (subtotal * discountPercent) / 100;

                const taxable =
                    subtotal - discountAmount;

                if (lineAmountType === "Inclusive") {
                    const taxAmount =
                        taxRate === 0
                            ? 0
                            : taxable -
                              taxable /
                                  (1 + taxRate / 100);

                    return {
                        subtotal,
                        discountAmount,
                        taxAmount,
                        total: taxable,
                    };
                }

                const taxAmount =
                    lineAmountType === "No Tax"
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
                    subtotal:
                        total.subtotal + line.subtotal,
                    discount:
                        total.discount +
                        line.discountAmount,
                    tax: total.tax + line.taxAmount,
                    grandTotal:
                        total.grandTotal + line.total,
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
        setPriceBookId("");
        setInvoiceType("Standard");
        setInvoiceDate(today());
        setDueDate(addDays(today(), 14));
        setCustomerReference("");
        setNotes("");
        setLineAmountType("Exclusive");
        setCustomerDiscount(0);
        setLines([createBlankLine(1)]);
        setSources([]);
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

        const customer = (customers.data ?? []).find(
            (item) =>
                item.customer_id === nextCustomerId,
        );

        const financial = (
            customerFinancials.data ?? []
        ).find(
            (item) =>
                item.customer_id === nextCustomerId,
        );

        const defaultBook = (
            priceBooks.data ?? []
        ).find((book) => book.is_default);

        setPriceBookId(
            customer?.price_book_id ||
                defaultBook?.price_book_id ||
                "",
        );

        const termsDays = Number(
            financial?.payment_terms_days ?? 14,
        );

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
            addDays(invoiceDate, termsDays),
        );

        setLines((current) =>
            current.map((line) => ({
                ...line,
                discount_percent:
                    String(nextDiscount),
            })),
        );
    };

    const applyInvoiceDate = (
        nextDate: string,
    ) => {
        setInvoiceDate(nextDate);

        setDueDate(
            addDays(
                nextDate,
                Number(
                    selectedFinancial?.payment_terms_days ??
                        14,
                ),
            ),
        );
    };

    const getProductUoms = (
        product: ProductOption,
    ) => {
        const result = new Map<
            string,
            {
                factor: number;
                allowFractional: boolean;
            }
        >();

        result.set(product.base_uom_code, {
            factor: 1,
            allowFractional: true,
        });

        for (const conversion of conversions.data ?? []) {
            if (
                conversion.product_id ===
                    product.product_id &&
                conversion.to_uom_code ===
                    product.base_uom_code
            ) {
                result.set(
                    conversion.from_uom_code,
                    {
                        factor: Number(
                            conversion.conversion_factor,
                        ),
                        allowFractional:
                            conversion.allow_fractional_quantity,
                    },
                );
            }
        }

        return [...result.entries()].map(
            ([uomCode, detailValue]) => ({
                uomCode,
                ...detailValue,
            }),
        );
    };

    const resolvePrice = (
        productId: string,
        selectedBookId: string,
    ): PriceBookLine | null => {
        return (
            (priceBookLines.data ?? []).find(
                (line) =>
                    line.product_id === productId &&
                    line.price_book_id ===
                        selectedBookId,
            ) ?? null
        );
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
                    : line,
            ),
        );
    };

    const selectProduct = (
        lineKey: string,
        productId: string,
    ) => {
        const product = (products.data ?? []).find(
            (item) =>
                item.product_id === productId,
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
                price_book_line_id: "",
                price_source: "Manual",
                original_unit_price: null,
            });

            return;
        }

        const productUoms =
            getProductUoms(product);

        const preferredUom =
            productUoms.find(
                (item) =>
                    item.uomCode ===
                    product.default_sales_uom_code,
            ) ?? productUoms[0];

        const price = resolvePrice(
            product.product_id,
            priceBookId,
        );

        const currentLine =
            lines.find(
                (line) => line.key === lineKey,
            ) ?? createBlankLine(lines.length + 1);

        const quantity = Number(
            currentLine.quantity || 0,
        );

        updateLine(lineKey, {
            product_id: product.product_id,
            line_type:
                product.is_service_item ||
                product.product_type === "Service"
                    ? "Service"
                    : product.product_type ===
                        "Material"
                      ? "Material"
                      : "Product",
            description: product.product_name,
            sales_uom_code:
                preferredUom?.uomCode ||
                product.base_uom_code,
            base_uom_code:
                product.base_uom_code,
            conversion_factor:
                preferredUom?.factor ?? 1,
            base_quantity:
                quantity *
                (preferredUom?.factor ?? 1),
            allow_fractional_quantity:
                preferredUom?.allowFractional ??
                true,
            price_book_line_id:
                price?.price_book_line_id || "",
            price_source:
                price ? "Price Book" : "Manual",
            original_unit_price:
                price
                    ? Number(price.unit_price)
                    : null,
            unit_price:
                price
                    ? String(price.unit_price)
                    : "",
            discount_percent:
                String(customerDiscount),
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
            (item) =>
                item.uomCode === uomCode,
        );

        if (!uom) {
            return;
        }

        updateLine(lineKey, {
            sales_uom_code: uomCode,
            conversion_factor: uom.factor,
            allow_fractional_quantity:
                uom.allowFractional,
            base_quantity:
                Number(line.quantity || 0) *
                uom.factor,
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
            base_quantity:
                Number(value || 0) *
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
                    : source,
            ),
        );
    };

    const removeSource = (key: string) => {
        setSources((current) =>
            current.filter(
                (source) => source.key !== key,
            ),
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

                    const discountPercent =
                        Number(
                            line.discount_percent,
                        );

                    const taxRate =
                        lineAmountType === "No Tax"
                            ? 0
                            : Number(
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
                            }: ${
                                line.sales_uom_code
                            } does not allow fractional quantity.`,
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
                        line_type:
                            line.line_type,
                        product_id:
                            line.product_id,
                        project_area_id:
                            line.project_area_id ||
                            null,
                        description:
                            line.description.trim(),
                        sales_uom_code:
                            line.sales_uom_code,
                        quantity,
                        unit_price: unitPrice,
                        discount_percent:
                            discountPercent,
                        tax_rate: taxRate,
                        notes:
                            line.notes.trim() ||
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
                        source_type:
                            source.source_type,
                        source_id:
                            source.source_id,
                        source_amount: amount,
                    };
                },
            );

            const header = {
                customer_id: customerId,
                project_id:
                    projectId || null,
                project_site_id:
                    siteId || null,
                price_book_id:
                    priceBookId || null,
                invoice_type:
                    invoiceType,
                invoice_date:
                    invoiceDate,
                due_date: dueDate,
                customer_reference:
                    customerReference.trim() ||
                    null,
                notes:
                    notes.trim() || null,
            };

            if (editingId) {
                return callRpc<string>(
                    "update_draft_invoice_atomic",
                    {
                        p_invoice_id:
                            editingId,
                        p_invoice: header,
                        p_lines: cleanLines,
                        p_sources:
                            cleanSources,
                    },
                );
            }

            return callRpc<string>(
                "create_invoice_atomic",
                {
                    p_invoice: header,
                    p_lines: cleanLines,
                    p_sources:
                        cleanSources,
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

    const openEdit = async (
        invoiceId: string,
    ) => {
        try {
            const data =
                await callRpc<InvoiceDetail>(
                    "get_customer_invoice_detail",
                    {
                        p_invoice_id:
                            invoiceId,
                    },
                );

            const invoice =
                data.invoice ?? {};

            const detailLines =
                data.lines ?? [];

            const detailSources =
                data.sources ?? [];

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
                    invoice.price_book_id ??
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

            setDueDate(
                String(
                    invoice.due_date ??
                        addDays(
                            today(),
                            14,
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
                    ? detailLines
                          .filter(
                              (line) =>
                                  !Boolean(
                                      line.is_deleted,
                                  ),
                          )
                          .map(
                              (
                                  line,
                                  index,
                              ) => ({
                                  key: uniqueKey(),
                                  line_no:
                                      Number(
                                          line.line_no ??
                                              index +
                                                  1,
                                      ),
                                  line_type:
                                      String(
                                          line.line_type ??
                                              "Product",
                                      ),
                                  product_id:
                                      String(
                                          line.product_id ??
                                              "",
                                      ),
                                  project_area_id:
                                      String(
                                          line.project_area_id ??
                                              "",
                                      ),
                                  description:
                                      String(
                                          line.description ??
                                              "",
                                      ),
                                  sales_uom_code:
                                      String(
                                          line.sales_uom_code ??
                                              "",
                                      ),
                                  base_uom_code:
                                      String(
                                          line.base_uom_code ??
                                              "",
                                      ),
                                  conversion_factor:
                                      Number(
                                          line.conversion_factor ??
                                              1,
                                      ),
                                  base_quantity:
                                      Number(
                                          line.base_quantity ??
                                              0,
                                      ),
                                  allow_fractional_quantity:
                                      Boolean(
                                          line.allow_fractional_quantity ??
                                              true,
                                      ),
                                  price_book_line_id:
                                      String(
                                          line.price_book_line_id ??
                                              "",
                                      ),
                                  price_source:
                                      String(
                                          line.price_source ??
                                              "Manual",
                                      ),
                                  original_unit_price:
                                      line.original_unit_price ===
                                          null ||
                                      line.original_unit_price ===
                                          undefined
                                          ? null
                                          : Number(
                                                line.original_unit_price,
                                            ),
                                  quantity:
                                      String(
                                          line.quantity ??
                                              "1",
                                      ),
                                  unit_price:
                                      String(
                                          line.unit_price ??
                                              "0",
                                      ),
                                  discount_percent:
                                      String(
                                          line.discount_percent ??
                                              financial?.discount_percent ??
                                              0,
                                      ),
                                  tax_rate:
                                      String(
                                          line.tax_rate ??
                                              "0",
                                      ),
                                  notes: String(
                                      line.notes ??
                                          "",
                                  ),
                              }),
                          )
                    : [
                          createBlankLine(
                              1,
                          ),
                      ],
            );

            setSources(
                detailSources
                    .filter(
                        (source) =>
                            !Boolean(
                                source.is_deleted,
                            ),
                    )
                    .map((source) => ({
                        key: uniqueKey(),
                        source_type:
                            String(
                                source.source_type ??
                                    "Quotation",
                            ) as
                                | "Quotation"
                                | "Variation",
                        source_id:
                            String(
                                source.source_id ??
                                    "",
                            ),
                        source_amount:
                            String(
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

    const exportCsv = () => {
        const headers = [
            "Invoice",
            "Type",
            "Customer",
            "Project",
            "Site",
            "Invoice Date",
            "Due Date",
            "Document Status",
            "Payment Status",
            "Subtotal",
            "Discount",
            "Tax",
            "Total",
            "Paid",
            "Balance",
        ];

        const body = rows.map((row) =>
            [
                row.invoice_no,
                row.invoice_type,
                `${row.customer_code} - ${row.customer_name}`,
                row.project_no
                    ? `${row.project_no} - ${
                          row.project_name ?? ""
                      }`
                    : "",
                row.site_code
                    ? `${row.site_code} - ${
                          row.site_name ?? ""
                      }`
                    : "",
                row.invoice_date,
                row.due_date,
                row.document_status,
                row.payment_status,
                row.subtotal_amount,
                row.discount_amount ?? 0,
                row.tax_amount,
                row.total_amount,
                row.paid_amount,
                row.balance_amount,
            ]
                .map(csvCell)
                .join(","),
        );

        const blob = new Blob(
            [
                [
                    headers
                        .map(csvCell)
                        .join(","),
                    ...body,
                ].join("\n"),
            ],
            {
                type: "text/csv;charset=utf-8",
            },
        );

        const url =
            URL.createObjectURL(blob);

        const anchor =
            document.createElement("a");

        anchor.href = url;

        anchor.download =
            `REDS-Invoices-${today()}.csv`;

        anchor.click();

        URL.revokeObjectURL(url);
    };

    const printPage = () => {
        window.print();
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
                        Create, review, issue and
                        monitor REDS customer
                        invoices.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={exportCsv}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
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
                            className={
                                RED_BUTTON
                            }
                            onClick={
                                openCreate
                            }
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
                        value:
                            summary.invoiced,
                        icon: FileText,
                    },
                    {
                        label: "Paid",
                        value: summary.paid,
                        icon: CheckCircle2,
                    },
                    {
                        label:
                            "Outstanding",
                        value:
                            summary.outstanding,
                        icon:
                            CircleDollarSign,
                    },
                    {
                        label: "Overdue",
                        value:
                            summary.overdue,
                        icon:
                            AlertTriangle,
                    },
                ].map((item) => (
                    <Card
                        key={item.label}
                        className="rounded-2xl"
                    >
                        <CardContent className="flex items-center justify-between p-5">
                            <div>
                                <p className="text-sm text-slate-500">
                                    {
                                        item.label
                                    }
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
                            value={
                                documentStatus
                            }
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
                                className={
                                    INPUT_CLASS
                                }
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
                                            key={
                                                status
                                            }
                                            value={
                                                status
                                            }
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
                            value={
                                paymentStatus
                            }
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
                                className={
                                    INPUT_CLASS
                                }
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
                                            key={
                                                status
                                            }
                                            value={
                                                status
                                            }
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
                            value={
                                invoiceTypeFilter
                            }
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
                                className={
                                    INPUT_CLASS
                                }
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
                                            key={
                                                type
                                            }
                                            value={
                                                type
                                            }
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
                            onClick={() =>
                                invoiceList.refetch()
                            }
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 md:max-w-xl">
                        <div>
                            <Label className="text-xs text-slate-500">
                                Invoice
                                date from
                            </Label>

                            <Input
                                type="date"
                                className={
                                    INPUT_CLASS
                                }
                                value={
                                    dateFrom
                                }
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
                                Invoice
                                date to
                            </Label>

                            <Input
                                type="date"
                                className={
                                    INPUT_CLASS
                                }
                                value={
                                    dateTo
                                }
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
                                        Customer
                                        / Project
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
                                {invoiceList.isLoading ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={
                                                8
                                            }
                                            className="h-32 text-center"
                                        >
                                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#8B3F3F]" />
                                        </TableCell>
                                    </TableRow>
                                ) : rows.length ===
                                  0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={
                                                8
                                            }
                                            className="h-32 text-center"
                                        >
                                            <FileText className="mx-auto h-8 w-8 text-slate-300" />

                                            <p className="mt-2 font-medium text-slate-600">
                                                No
                                                Invoices
                                                found
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    rows.map(
                                        (
                                            row,
                                        ) => (
                                            <TableRow
                                                key={
                                                    row.customer_invoice_id
                                                }
                                                className="cursor-pointer hover:bg-slate-50"
                                                onClick={() =>
                                                    openDetail(
                                                        row.customer_invoice_id,
                                                    )
                                                }
                                            >
                                                <TableCell>
                                                    <p className="font-semibold text-slate-900">
                                                        {
                                                            row.invoice_no
                                                        }
                                                    </p>

                                                    <p className="text-xs text-slate-500">
                                                        {
                                                            row.invoice_type
                                                        }
                                                    </p>
                                                </TableCell>

                                                <TableCell>
                                                    <p className="font-medium text-slate-900">
                                                        {
                                                            row.customer_code
                                                        }{" "}
                                                        —{" "}
                                                        {
                                                            row.customer_name
                                                        }
                                                    </p>

                                                    <p className="text-xs text-slate-500">
                                                        {row.project_no
                                                            ? `${row.project_no} — ${row.project_name ?? ""}`
                                                            : "No Project"}

                                                        {row.site_code
                                                            ? ` / ${row.site_code} — ${row.site_name ?? ""}`
                                                            : ""}
                                                    </p>
                                                </TableCell>

                                                <TableCell>
                                                    <p className="text-sm">
                                                        Invoice:{" "}
                                                        {dateText(
                                                            row.invoice_date,
                                                        )}
                                                    </p>

                                                    <p className="text-xs text-slate-500">
                                                        Due:{" "}
                                                        {dateText(
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
                                                            {
                                                                row.document_status
                                                            }
                                                        </Badge>

                                                        <Badge
                                                            variant="outline"
                                                            className={statusBadgeClass(
                                                                row.payment_status,
                                                            )}
                                                        >
                                                            {
                                                                row.payment_status
                                                            }
                                                        </Badge>
                                                    </div>

                                                    {Number(
                                                        row.days_overdue ||
                                                            0,
                                                    ) >
                                                        0 && (
                                                        <p className="mt-1 text-xs font-medium text-orange-600">
                                                            {
                                                                row.days_overdue
                                                            }{" "}
                                                            days
                                                            overdue
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
                                                            event.stopPropagation();

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
                                : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(
                                      page *
                                          PAGE_SIZE,
                                      totalRows,
                                  )} of ${totalRows}`}
                        </p>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="rounded-xl"
                                disabled={
                                    page <= 1
                                }
                                onClick={() =>
                                    setPage(
                                        (
                                            current,
                                        ) =>
                                            current -
                                            1,
                                    )
                                }
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            <span className="text-sm text-slate-600">
                                Page {page}{" "}
                                of{" "}
                                {
                                    totalPages
                                }
                            </span>

                            <Button
                                variant="outline"
                                size="icon"
                                className="rounded-xl"
                                disabled={
                                    page >=
                                    totalPages
                                }
                                onClick={() =>
                                    setPage(
                                        (
                                            current,
                                        ) =>
                                            current +
                                            1,
                                    )
                                }
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
                        onClick={
                            closeToList
                        }
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>

                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
                            {editingId
                                ? "Edit Draft Invoice"
                                : "New Invoice"}
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Invoice number
                            is generated
                            automatically
                            when the Draft is
                            saved.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={
                            closeToList
                        }
                    >
                        Cancel
                    </Button>

                    <Button
                        className={
                            RED_BUTTON
                        }
                        disabled={
                            saveInvoice.isPending
                        }
                        onClick={() =>
                            saveInvoice.mutate()
                        }
                    >
                        {saveInvoice.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <FilePlus2 className="mr-2 h-4 w-4" />
                        )}

                        {editingId
                            ? "Update Draft"
                            : "Save Draft"}
                    </Button>
                </div>
            </div>

            {selectedFinancial?.is_account_on_hold && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

                        <div>
                            <p className="font-semibold">
                                Customer
                                account is on
                                hold
                            </p>

                            <p className="mt-1 text-sm">
                                {selectedFinancial.account_hold_reason ||
                                    "Invoice creation is blocked until the hold is removed."}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <Card className="rounded-2xl">
                <CardContent className="space-y-5 p-5 md:p-6">
                    <SectionHeader
                        number="01"
                        title="Customer & Commercial Source"
                        description="Select the Customer, Project, Site, Price Book and accepted commercial source."
                    />

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="space-y-2">
                            <Label>
                                Customer{" "}
                                <span className="text-red-600">
                                    *
                                </span>
                            </Label>

                            <Select
                                value={
                                    customerId
                                }
                                onValueChange={
                                    applyCustomerDefaults
                                }
                                disabled={Boolean(
                                    editingId,
                                )}
                            >
                                <SelectTrigger
                                    className={
                                        INPUT_CLASS
                                    }
                                >
                                    <SelectValue placeholder="Select Customer" />
                                </SelectTrigger>

                                <SelectContent>
                                    {(
                                        customers.data ??
                                        []
                                    ).map(
                                        (
                                            customer,
                                        ) => (
                                            <SelectItem
                                                key={
                                                    customer.customer_id
                                                }
                                                value={
                                                    customer.customer_id
                                                }
                                            >
                                                {
                                                    customer.customer_code
                                                }{" "}
                                                —{" "}
                                                {
                                                    customer.customer_name
                                                }
                                            </SelectItem>
                                        ),
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Project
                            </Label>

                            <Select
                                value={
                                    projectId ||
                                    "none"
                                }
                                onValueChange={(
                                    value,
                                ) => {
                                    setProjectId(
                                        value ===
                                            "none"
                                            ? ""
                                            : value,
                                    );

                                    setSiteId(
                                        "",
                                    );

                                    setSources(
                                        [],
                                    );
                                }}
                                disabled={
                                    !customerId ||
                                    Boolean(
                                        editingId,
                                    )
                                }
                            >
                                <SelectTrigger
                                    className={
                                        INPUT_CLASS
                                    }
                                >
                                    <SelectValue placeholder="Select Project" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="none">
                                        No
                                        Project
                                    </SelectItem>

                                    {filteredProjects.map(
                                        (
                                            project,
                                        ) => (
                                            <SelectItem
                                                key={
                                                    project.project_id
                                                }
                                                value={
                                                    project.project_id
                                                }
                                            >
                                                {
                                                    project.project_no
                                                }{" "}
                                                —{" "}
                                                {
                                                    project.project_name
                                                }
                                            </SelectItem>
                                        ),
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Project Site
                            </Label>

                            <Select
                                value={
                                    siteId ||
                                    "none"
                                }
                                onValueChange={(
                                    value,
                                ) => {
                                    setSiteId(
                                        value ===
                                            "none"
                                            ? ""
                                            : value,
                                    );

                                    setSources(
                                        [],
                                    );
                                }}
                                disabled={
                                    !projectId ||
                                    Boolean(
                                        editingId,
                                    )
                                }
                            >
                                <SelectTrigger
                                    className={
                                        INPUT_CLASS
                                    }
                                >
                                    <SelectValue placeholder="Select Site" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="none">
                                        No Site
                                    </SelectItem>

                                    {filteredSites.map(
                                        (
                                            site,
                                        ) => (
                                            <SelectItem
                                                key={
                                                    site.site_id
                                                }
                                                value={
                                                    site.site_id
                                                }
                                            >
                                                {
                                                    site.site_code
                                                }{" "}
                                                —{" "}
                                                {
                                                    site.site_name
                                                }
                                            </SelectItem>
                                        ),
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Price Book
                            </Label>

                            <Select
                                value={
                                    priceBookId ||
                                    "none"
                                }
                                onValueChange={(
                                    value,
                                ) =>
                                    setPriceBookId(
                                        value ===
                                            "none"
                                            ? ""
                                            : value,
                                    )
                                }
                                disabled={
                                    !permission[
                                        "invoices.override_price_book"
                                    ] ||
                                    !customerId
                                }
                            >
                                <SelectTrigger
                                    className={
                                        INPUT_CLASS
                                    }
                                >
                                    <SelectValue placeholder="No Price Book" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="none">
                                        No Price
                                        Book
                                    </SelectItem>

                                    {(
                                        priceBooks.data ??
                                        []
                                    ).map(
                                        (
                                            book,
                                        ) => (
                                            <SelectItem
                                                key={
                                                    book.price_book_id
                                                }
                                                value={
                                                    book.price_book_id
                                                }
                                            >
                                                {
                                                    book.price_book_code
                                                }{" "}
                                                —{" "}
                                                {
                                                    book.price_book_name
                                                }

                                                {book.is_default
                                                    ? " (Default)"
                                                    : ""}
                                            </SelectItem>
                                        ),
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {customerId && (
                        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm md:grid-cols-5">
                            <div>
                                <p className="text-xs text-slate-500">
                                    Customer
                                </p>

                                <p className="font-medium text-slate-900">
                                    {selectedCustomer
                                        ? `${selectedCustomer.customer_code} — ${selectedCustomer.customer_name}`
                                        : "—"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-slate-500">
                                    Price
                                    Book
                                </p>

                                <p className="font-medium text-slate-900">
                                    {selectedPriceBook
                                        ? `${selectedPriceBook.price_book_code} — ${selectedPriceBook.price_book_name}`
                                        : "Not configured"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-slate-500">
                                    Payment
                                    Terms
                                </p>

                                <p className="font-medium text-slate-900">
                                    {selectedFinancial
                                        ? `${selectedFinancial.payment_terms_type} ${selectedFinancial.payment_terms_days}`
                                        : "14 Days After Bill"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-slate-500">
                                    Line
                                    Amount
                                    Type
                                </p>

                                <p className="font-medium text-slate-900">
                                    {
                                        lineAmountType
                                    }
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-slate-500">
                                    Default
                                    Discount
                                </p>

                                <p className="font-medium text-slate-900">
                                    {numberText(
                                        customerDiscount,
                                        4,
                                    )}
                                    %
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                            <div>
                                <p className="font-medium text-slate-900">
                                    Accepted
                                    Commercial
                                    Sources
                                </p>

                                <p className="text-xs text-slate-500">
                                    Optional.
                                    Sources
                                    must match
                                    the selected
                                    Customer,
                                    Project and
                                    Site.
                                </p>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-xl"
                                disabled={
                                    !customerId
                                }
                                onClick={
                                    addSource
                                }
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Source
                            </Button>
                        </div>

                        {sources.length ===
                        0 ? (
                            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                                No commercial
                                source linked.
                                This Invoice
                                will be treated
                                as a direct or
                                manual
                                commercial
                                Invoice.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {sources.map(
                                    (
                                        source,
                                        index,
                                    ) => {
                                        const options =
                                            availableSources.filter(
                                                (
                                                    option,
                                                ) =>
                                                    option.source_type ===
                                                    source.source_type,
                                            );

                                        return (
                                            <div
                                                key={
                                                    source.key
                                                }
                                                className="grid gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-[160px_1fr_180px_44px]"
                                            >
                                                <Select
                                                    value={
                                                        source.source_type
                                                    }
                                                    onValueChange={(
                                                        value,
                                                    ) =>
                                                        updateSource(
                                                            source.key,
                                                            {
                                                                source_type:
                                                                    value as
                                                                        | "Quotation"
                                                                        | "Variation",
                                                                source_id:
                                                                    "",
                                                                source_amount:
                                                                    "0",
                                                            },
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger
                                                        className={
                                                            INPUT_CLASS
                                                        }
                                                    >
                                                        <SelectValue />
                                                    </SelectTrigger>

                                                    <SelectContent>
                                                        <SelectItem value="Quotation">
                                                            Quotation
                                                        </SelectItem>

                                                        <SelectItem value="Variation">
                                                            Variation
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>

                                                <Select
                                                    value={
                                                        source.source_id ||
                                                        "none"
                                                    }
                                                    onValueChange={(
                                                        value,
                                                    ) => {
                                                        const option =
                                                            options.find(
                                                                (
                                                                    item,
                                                                ) =>
                                                                    item.source_id ===
                                                                    value,
                                                            );

                                                        updateSource(
                                                            source.key,
                                                            {
                                                                source_id:
                                                                    value ===
                                                                    "none"
                                                                        ? ""
                                                                        : value,
                                                                source_amount:
                                                                    option
                                                                        ? String(
                                                                              option.total_amount,
                                                                          )
                                                                        : "0",
                                                            },
                                                        );
                                                    }}
                                                >
                                                    <SelectTrigger
                                                        className={
                                                            INPUT_CLASS
                                                        }
                                                    >
                                                        <SelectValue
                                                            placeholder={`Select accepted ${source.source_type}`}
                                                        />
                                                    </SelectTrigger>

                                                    <SelectContent>
                                                        <SelectItem value="none">
                                                            Select
                                                            accepted{" "}
                                                            {
                                                                source.source_type
                                                            }
                                                        </SelectItem>

                                                        {options.map(
                                                            (
                                                                option,
                                                            ) => (
                                                                <SelectItem
                                                                    key={
                                                                        option.source_id
                                                                    }
                                                                    value={
                                                                        option.source_id
                                                                    }
                                                                >
                                                                    {
                                                                        option.source_no
                                                                    }{" "}
                                                                    —{" "}
                                                                    {money(
                                                                        option.total_amount,
                                                                    )}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>

                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    className={
                                                        INPUT_CLASS
                                                    }
                                                    value={
                                                        source.source_amount
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        updateSource(
                                                            source.key,
                                                            {
                                                                source_amount:
                                                                    event
                                                                        .target
                                                                        .value,
                                                            },
                                                        )
                                                    }
                                                    placeholder="Source Amount"
                                                />

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-11 rounded-xl text-red-600"
                                                    onClick={() =>
                                                        removeSource(
                                                            source.key,
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>

                                                <p className="text-xs text-slate-400 md:col-span-4">
                                                    Source{" "}
                                                    {index +
                                                        1}
                                                </p>
                                            </div>
                                        );
                                    },
                                )}
                            </div>
                        )}
                    </div>
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
                                Invoice
                                Number
                            </Label>

                            <Input
                                className={`${INPUT_CLASS} text-slate-500`}
                                value={
                                    editingId
                                        ? "Existing system-generated number"
                                        : "Generated after Save Draft"
                                }
                                readOnly
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>
                                Invoice
                                Type
                            </Label>

                            <Select
                                value={
                                    invoiceType
                                }
                                onValueChange={
                                    setInvoiceType
                                }
                            >
                                <SelectTrigger
                                    className={
                                        INPUT_CLASS
                                    }
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
                                                key={
                                                    type
                                                }
                                                value={
                                                    type
                                                }
                                            >
                                                {
                                                    type
                                                }
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
                                className={
                                    INPUT_CLASS
                                }
                                value={
                                    invoiceDate
                                }
                                onChange={(
                                    event,
                                ) =>
                                    applyInvoiceDate(
                                        event
                                            .target
                                            .value,
                                    )
                                }
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
                                className={
                                    INPUT_CLASS
                                }
                                value={
                                    dueDate
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setDueDate(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label>
                                Customer
                                Reference
                            </Label>

                            <Input
                                className={
                                    INPUT_CLASS
                                }
                                value={
                                    customerReference
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setCustomerReference(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                placeholder="Customer purchase order or reference"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label>
                                Internal /
                                Invoice Notes
                            </Label>

                            <Textarea
                                className={
                                    TEXTAREA_CLASS
                                }
                                value={
                                    notes
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setNotes(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                placeholder="Notes to retain with this Invoice"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-2xl">
                <CardContent className="space-y-5 p-5 md:p-6">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                        <SectionHeader
                            number="03"
                            title="Products & Services"
                            description="Product, Sales UOM, Base UOM, conversion, pricing and discount snapshots are validated by the Backend."
                        />

                        <Button
                            type="button"
                            variant="outline"
                            className="shrink-0 rounded-xl"
                            onClick={
                                addLine
                            }
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Line
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {lines.map(
                            (
                                line,
                                index,
                            ) => {
                                const product =
                                    (
                                        products.data ??
                                        []
                                    ).find(
                                        (
                                            item,
                                        ) =>
                                            item.product_id ===
                                            line.product_id,
                                    );

                                const productUoms =
                                    product
                                        ? getProductUoms(
                                              product,
                                          )
                                        : [];

                                const calculation =
                                    lineCalculations[
                                        index
                                    ];

                                return (
                                    <div
                                        key={
                                            line.key
                                        }
                                        className="rounded-2xl border border-slate-200 bg-white p-4"
                                    >
                                        <div className="mb-4 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <PackageSearch className="h-5 w-5 text-[#8B3F3F]" />

                                                <p className="font-semibold text-slate-900">
                                                    Line{" "}
                                                    {index +
                                                        1}
                                                </p>

                                                <Badge variant="outline">
                                                    {
                                                        line.price_source
                                                    }
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
                                                        )
                                                    }
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
                                            <div className="space-y-2 xl:col-span-4">
                                                <Label>
                                                    Product
                                                    /
                                                    Service{" "}
                                                    <span className="text-red-600">
                                                        *
                                                    </span>
                                                </Label>

                                                <Select
                                                    value={
                                                        line.product_id ||
                                                        "none"
                                                    }
                                                    onValueChange={(
                                                        value,
                                                    ) =>
                                                        selectProduct(
                                                            line.key,
                                                            value ===
                                                                "none"
                                                                ? ""
                                                                : value,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger
                                                        className={
                                                            INPUT_CLASS
                                                        }
                                                    >
                                                        <SelectValue placeholder="Select Product" />
                                                    </SelectTrigger>

                                                    <SelectContent>
                                                        <SelectItem value="none">
                                                            Select
                                                            Product
                                                        </SelectItem>

                                                        {(
                                                            products.data ??
                                                            []
                                                        ).map(
                                                            (
                                                                item,
                                                            ) => (
                                                                <SelectItem
                                                                    key={
                                                                        item.product_id
                                                                    }
                                                                    value={
                                                                        item.product_id
                                                                    }
                                                                >
                                                                    {
                                                                        item.product_code
                                                                    }{" "}
                                                                    —{" "}
                                                                    {
                                                                        item.product_name
                                                                    }
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2 xl:col-span-3">
                                                <Label>
                                                    Project
                                                    Area
                                                </Label>

                                                <Select
                                                    value={
                                                        line.project_area_id ||
                                                        "none"
                                                    }
                                                    onValueChange={(
                                                        value,
                                                    ) =>
                                                        updateLine(
                                                            line.key,
                                                            {
                                                                project_area_id:
                                                                    value ===
                                                                    "none"
                                                                        ? ""
                                                                        : value,
                                                            },
                                                        )
                                                    }
                                                    disabled={
                                                        !siteId
                                                    }
                                                >
                                                    <SelectTrigger
                                                        className={
                                                            INPUT_CLASS
                                                        }
                                                    >
                                                        <SelectValue placeholder="No Area" />
                                                    </SelectTrigger>

                                                    <SelectContent>
                                                        <SelectItem value="none">
                                                            No
                                                            Area
                                                        </SelectItem>

                                                        {filteredAreas.map(
                                                            (
                                                                area,
                                                            ) => (
                                                                <SelectItem
                                                                    key={
                                                                        area.area_id
                                                                    }
                                                                    value={
                                                                        area.area_id
                                                                    }
                                                                >
                                                                    {
                                                                        area.area_code
                                                                    }{" "}
                                                                    —{" "}
                                                                    {
                                                                        area.area_name
                                                                    }
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2 xl:col-span-2">
                                                <Label>
                                                    Sales
                                                    UOM{" "}
                                                    <span className="text-red-600">
                                                        *
                                                    </span>
                                                </Label>

                                                <Select
                                                    value={
                                                        line.sales_uom_code ||
                                                        "none"
                                                    }
                                                    onValueChange={(
                                                        value,
                                                    ) =>
                                                        selectLineUom(
                                                            line.key,
                                                            value ===
                                                                "none"
                                                                ? ""
                                                                : value,
                                                        )
                                                    }
                                                    disabled={
                                                        !product
                                                    }
                                                >
                                                    <SelectTrigger
                                                        className={
                                                            INPUT_CLASS
                                                        }
                                                    >
                                                        <SelectValue placeholder="Select UOM" />
                                                    </SelectTrigger>

                                                    <SelectContent>
                                                        <SelectItem value="none">
                                                            Select
                                                            UOM
                                                        </SelectItem>

                                                        {productUoms.map(
                                                            (
                                                                uom,
                                                            ) => (
                                                                <SelectItem
                                                                    key={
                                                                        uom.uomCode
                                                                    }
                                                                    value={
                                                                        uom.uomCode
                                                                    }
                                                                >
                                                                    {
                                                                        uom.uomCode
                                                                    }

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
                                                    Qty
                                                    *
                                                </Label>

                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step={
                                                        line.allow_fractional_quantity
                                                            ? "0.000001"
                                                            : "1"
                                                    }
                                                    className={
                                                        INPUT_CLASS
                                                    }
                                                    value={
                                                        line.quantity
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        changeQuantity(
                                                            line.key,
                                                            event
                                                                .target
                                                                .value,
                                                        )
                                                    }
                                                />
                                            </div>

                                            <div className="space-y-2 xl:col-span-2">
                                                <Label>
                                                    Unit
                                                    Price
                                                    *
                                                </Label>

                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    className={
                                                        INPUT_CLASS
                                                    }
                                                    value={
                                                        line.unit_price
                                                    }
                                                    readOnly={
                                                        Boolean(
                                                            line.price_book_line_id,
                                                        ) &&
                                                        !permission[
                                                            "invoices.override_unit_price"
                                                        ]
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
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
                                                                        : line.price_book_line_id
                                                                          ? "Price Book"
                                                                          : "Manual",
                                                            },
                                                        )
                                                    }
                                                />
                                            </div>

                                            <div className="space-y-2 xl:col-span-5">
                                                <Label>
                                                    Description
                                                </Label>

                                                <Input
                                                    className={
                                                        INPUT_CLASS
                                                    }
                                                    value={
                                                        line.description
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        updateLine(
                                                            line.key,
                                                            {
                                                                description:
                                                                    event
                                                                        .target
                                                                        .value,
                                                            },
                                                        )
                                                    }
                                                />
                                            </div>

                                            <div className="space-y-2 xl:col-span-2">
                                                <Label>
                                                    Base
                                                    UOM
                                                </Label>

                                                <Input
                                                    className={`${INPUT_CLASS} text-slate-500`}
                                                    value={
                                                        line.base_uom_code
                                                    }
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
                                                    Base
                                                    Quantity
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
                                                    Discount
                                                    %
                                                </Label>

                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.0001"
                                                    className={
                                                        INPUT_CLASS
                                                    }
                                                    value={
                                                        line.discount_percent
                                                    }
                                                    readOnly={
                                                        !permission[
                                                            "invoices.override_discount"
                                                        ]
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        updateLine(
                                                            line.key,
                                                            {
                                                                discount_percent:
                                                                    event
                                                                        .target
                                                                        .value,
                                                            },
                                                        )
                                                    }
                                                />
                                            </div>

                                            <div className="space-y-2 xl:col-span-1">
                                                <Label>
                                                    GST
                                                    %
                                                </Label>

                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.0001"
                                                    className={
                                                        INPUT_CLASS
                                                    }
                                                    value={
                                                        lineAmountType ===
                                                        "No Tax"
                                                            ? "0"
                                                            : line.tax_rate
                                                    }
                                                    readOnly={
                                                        lineAmountType ===
                                                        "No Tax"
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        updateLine(
                                                            line.key,
                                                            {
                                                                tax_rate:
                                                                    event
                                                                        .target
                                                                        .value,
                                                            },
                                                        )
                                                    }
                                                />
                                            </div>

                                            <div className="space-y-2 xl:col-span-6">
                                                <Label>
                                                    Line
                                                    Notes
                                                </Label>

                                                <Input
                                                    className={
                                                        INPUT_CLASS
                                                    }
                                                    value={
                                                        line.notes
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        updateLine(
                                                            line.key,
                                                            {
                                                                notes:
                                                                    event
                                                                        .target
                                                                        .value,
                                                            },
                                                        )
                                                    }
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
                                                                calculation?.subtotal,
                                                            )}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs text-slate-500">
                                                            Discount
                                                        </p>

                                                        <p className="font-semibold">
                                                            {money(
                                                                calculation?.discountAmount,
                                                            )}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs text-slate-500">
                                                            GST
                                                        </p>

                                                        <p className="font-semibold">
                                                            {money(
                                                                calculation?.taxAmount,
                                                            )}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs text-slate-500">
                                                            Line
                                                            Total
                                                        </p>

                                                        <p className="font-bold text-[#8B3F3F]">
                                                            {money(
                                                                calculation?.total,
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
                                Subtotal
                                before
                                discount
                            </p>

                            <p className="mt-1 text-xl font-semibold">
                                {money(
                                    formTotals.subtotal,
                                )}
                            </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 p-4">
                            <p className="text-sm text-slate-500">
                                Line
                                Discounts
                            </p>

                            <p className="mt-1 text-xl font-semibold text-red-700">
                                −{" "}
                                {money(
                                    formTotals.discount,
                                )}
                            </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 p-4">
                            <p className="text-sm text-slate-500">
                                GST (
                                {
                                    lineAmountType
                                }
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
                                Invoice
                                Total
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

            <Card className="rounded-2xl">
                <CardContent className="space-y-5 p-5 md:p-6">
                    <SectionHeader
                        number="05"
                        title="Review & Status"
                        description="The Invoice is saved as Draft. Approval and Issue remain separate permission-controlled actions."
                    />

                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-xl border border-slate-200 p-4">
                            <p className="text-xs text-slate-500">
                                Document
                                Status
                            </p>

                            <p className="mt-1 font-semibold text-slate-900">
                                Draft
                            </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 p-4">
                            <p className="text-xs text-slate-500">
                                Payment
                                Status
                            </p>

                            <p className="mt-1 font-semibold text-slate-900">
                                Unpaid
                            </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 p-4">
                            <p className="text-xs text-slate-500">
                                Currency
                            </p>

                            <p className="mt-1 font-semibold text-slate-900">
                                AUD —
                                stored by
                                Backend
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            className="rounded-xl"
                            onClick={
                                closeToList
                            }
                        >
                            Cancel
                        </Button>

                        <Button
                            className={
                                RED_BUTTON
                            }
                            disabled={
                                saveInvoice.isPending
                            }
                            onClick={() =>
                                saveInvoice.mutate()
                            }
                        >
                            {saveInvoice.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <FilePlus2 className="mr-2 h-4 w-4" />
                            )}

                            {editingId
                                ? "Update Draft"
                                : "Save Draft"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    const renderDetail = () => {
        const invoice =
            detail.data?.invoice ?? {};

        const detailLines = (
            detail.data?.lines ?? []
        ).filter(
            (line) =>
                !Boolean(line.is_deleted),
        );

        const detailSources = (
            detail.data?.sources ?? []
        ).filter(
            (source) =>
                !Boolean(
                    source.is_deleted,
                ),
        );

        const allocations =
            detail.data?.allocations ?? [];

        const status = String(
            invoice.document_status ?? "",
        );

        const invoiceId = String(
            invoice.customer_invoice_id ??
                selectedId ??
                "",
        );

        return (
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div className="flex items-start gap-3">
                        <Button
                            variant="outline"
                            size="icon"
                            className="mt-1 rounded-xl"
                            onClick={
                                closeToList
                            }
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
                                )}{" "}
                                Invoice
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            className="rounded-xl"
                            onClick={
                                printPage
                            }
                        >
                            <Printer className="mr-2 h-4 w-4" />
                            Print
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
                                        )
                                    }
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
                                    className={
                                        RED_BUTTON
                                    }
                                    disabled={
                                        workflowAction.isPending
                                    }
                                    onClick={() =>
                                        workflowAction.mutate(
                                            {
                                                rpcName:
                                                    "approve_invoice_atomic",
                                                invoiceId,
                                            },
                                        )
                                    }
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
                                    className={
                                        RED_BUTTON
                                    }
                                    disabled={
                                        workflowAction.isPending
                                    }
                                    onClick={() =>
                                        workflowAction.mutate(
                                            {
                                                rpcName:
                                                    "issue_invoice_atomic",
                                                invoiceId,
                                            },
                                        )
                                    }
                                >
                                    <Send className="mr-2 h-4 w-4" />
                                    Issue
                                </Button>
                            )}
                    </div>
                </div>

                {detail.isLoading ? (
                    <Card className="rounded-2xl">
                        <CardContent className="flex h-48 items-center justify-center">
                            <Loader2 className="h-7 w-7 animate-spin text-[#8B3F3F]" />
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <Card className="rounded-2xl">
                                <CardContent className="p-5">
                                    <p className="text-sm text-slate-500">
                                        Invoice
                                        Total
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
                                        Due
                                        Date
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
                                    Invoice
                                    Information
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
                                        invoice.price_book_name,
                                    ],
                                    [
                                        "Line Amount Type",
                                        invoice.line_amount_type,
                                    ],
                                    [
                                        "Payment Terms",
                                        `${invoice.payment_terms_type ?? "—"} ${invoice.payment_terms_days ?? ""}`,
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
                                    [
                                        "GST",
                                        money(
                                            invoice.tax_amount,
                                        ),
                                    ],
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
                                    Products
                                    &
                                    Services
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
                                                    Product
                                                    /
                                                    Description
                                                </TableHead>

                                                <TableHead>
                                                    Area
                                                </TableHead>

                                                <TableHead>
                                                    UOM
                                                    Conversion
                                                </TableHead>

                                                <TableHead className="text-right">
                                                    Qty
                                                </TableHead>

                                                <TableHead className="text-right">
                                                    Unit
                                                    Price
                                                </TableHead>

                                                <TableHead className="text-right">
                                                    Discount
                                                </TableHead>

                                                <TableHead className="text-right">
                                                    GST
                                                </TableHead>

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
                                                                    line.product_code_snapshot ??
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
                                                                    line.product_name_snapshot ??
                                                                        "",
                                                                )}
                                                            </p>
                                                        </TableCell>

                                                        <TableCell>
                                                            {String(
                                                                line.project_area_name ??
                                                                    line.area_name ??
                                                                    "—",
                                                            )}
                                                        </TableCell>

                                                        <TableCell>
                                                            <p>
                                                                {String(
                                                                    line.sales_uom_code ??
                                                                        "—",
                                                                )}{" "}
                                                                →{" "}
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
                                                                /
                                                                Base
                                                                Qty{" "}
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

                                                        <TableCell className="text-right">
                                                            {money(
                                                                line.tax_amount,
                                                            )}
                                                        </TableCell>

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
                                        Commercial
                                        Sources
                                    </CardTitle>
                                </CardHeader>

                                <CardContent>
                                    {detailSources.length ===
                                    0 ? (
                                        <p className="text-sm text-slate-500">
                                            No linked
                                            Quotation
                                            or
                                            Variation
                                            source.
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {detailSources.map(
                                                (
                                                    source,
                                                    index,
                                                ) => (
                                                    <div
                                                        key={String(
                                                            source.invoice_source_id ??
                                                                index,
                                                        )}
                                                        className="flex items-center justify-between rounded-xl border border-slate-200 p-3"
                                                    >
                                                        <div>
                                                            <p className="font-medium">
                                                                {String(
                                                                    source.source_type ??
                                                                        "Source",
                                                                )}
                                                            </p>

                                                            <p className="text-xs text-slate-500">
                                                                {String(
                                                                    source.source_no ??
                                                                        source.source_id ??
                                                                        "—",
                                                                )}
                                                            </p>
                                                        </div>

                                                        <p className="font-semibold">
                                                            {money(
                                                                source.source_amount,
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
                                        Payment
                                        Allocations
                                    </CardTitle>
                                </CardHeader>

                                <CardContent>
                                    {allocations.length ===
                                    0 ? (
                                        <p className="text-sm text-slate-500">
                                            No
                                            payments
                                            allocated
                                            to this
                                            Invoice.
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {allocations.map(
                                                (
                                                    allocation,
                                                    index,
                                                ) => (
                                                    <div
                                                        key={String(
                                                            allocation.customer_payment_allocation_id ??
                                                                index,
                                                        )}
                                                        className="flex items-center justify-between rounded-xl border border-slate-200 p-3"
                                                    >
                                                        <div>
                                                            <p className="font-medium">
                                                                {String(
                                                                    allocation.payment_no ??
                                                                        "Payment",
                                                                )}
                                                            </p>

                                                            <p className="text-xs text-slate-500">
                                                                {dateText(
                                                                    allocation.payment_date,
                                                                )}
                                                            </p>
                                                        </div>

                                                        <p className="font-semibold text-green-700">
                                                            {money(
                                                                allocation.allocated_amount,
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
                                    Workflow
                                    Actions
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
                                            Cancel
                                            Invoice
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
                                            Void
                                            Invoice
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
                                            disabled={
                                                workflowAction.isPending
                                            }
                                            onClick={() =>
                                                workflowAction.mutate(
                                                    {
                                                        rpcName:
                                                            "soft_delete_invoice_atomic",
                                                        invoiceId,
                                                    },
                                                )
                                            }
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
                                            Credit
                                            Note
                                            uses
                                            the
                                            dedicated
                                            Credit
                                            Note
                                            workflow.
                                        </div>
                                    )}

                                {permission[
                                    "invoices.release_retention"
                                ] && (
                                    <div className="rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-500">
                                        Retention
                                        Release
                                        uses the
                                        dedicated
                                        Site
                                        Retention
                                        workflow.
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
                onOpenChange={
                    setShowReasonDialog
                }
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
                                className={
                                    TEXTAREA_CLASS
                                }
                                value={
                                    reason
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setReason(
                                        event
                                            .target
                                            .value,
                                    )
                                }
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
                                    )
                                }
                            >
                                Close
                            </Button>

                            <Button
                                className={
                                    RED_BUTTON
                                }
                                disabled={
                                    !reason.trim() ||
                                    workflowAction.isPending ||
                                    !selectedId
                                }
                                onClick={() => {
                                    if (
                                        !selectedId ||
                                        !reasonAction
                                    ) {
                                        return;
                                    }

                                    workflowAction.mutate(
                                        {
                                            rpcName:
                                                reasonAction ===
                                                "cancel"
                                                    ? "cancel_invoice_atomic"
                                                    : "void_invoice_atomic",
                                            invoiceId:
                                                selectedId,
                                            args: {
                                                p_reason:
                                                    reason.trim(),
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
        </>
    );
};

export default Invoices;