import { useMemo, useState } from "react";
import {
    CheckCircle2,
    Download,
    FileEdit,
    FileText,
    Loader2,
    MoreHorizontal,
    Plus,
    Printer,
    RefreshCw,
    Search,
    Send,
    XCircle,
} from "lucide-react";
import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

/*
 * Variation tables and RPCs may not yet exist in the locally generated
 * Supabase TypeScript definitions. Using this typed bridge prevents the
 * page from being blocked until types.ts is regenerated.
 */
const database = supabase as any;

type PermissionMap = Record<string, boolean>;

type VariationStatus =
    | "Draft"
    | "Sent"
    | "Accepted"
    | "Rejected"
    | "Cancelled";

type VariationRow = {
    variation_id: string;
    variation_no: string;

    quotation_id: string;
    accepted_revision_id: string | null;

    customer_id: string;
    project_id: string;
    project_site_id: string;

    variation_status: VariationStatus;
    variation_reason: string;

    issue_date: string | null;
    valid_until: string | null;

    subtotal: number;
    discount_amount: number;
    tax_amount: number;
    total_amount: number;

    notes: string | null;

    sent_at: string | null;
    sent_by: string | null;

    accepted_at: string | null;
    accepted_by: string | null;

    rejected_at: string | null;
    rejected_by: string | null;
    rejection_reason: string | null;

    cancelled_at: string | null;
    cancelled_by: string | null;
    cancellation_reason: string | null;

    is_active: boolean;
    is_deleted: boolean;

    created_at: string;
    updated_at: string;
};

type VariationLineRow = {
    variation_line_id: string;
    variation_id: string;

    line_no: number;

    product_id: string | null;
    project_area_id: string | null;

    description: string;

    unit_of_measure: string | null;
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

    cost_price: number | null;
    margin_amount: number | null;
    margin_percent: number | null;

    notes: string | null;
    is_optional: boolean;

    is_active: boolean;
    is_deleted: boolean;
};

type AcceptedQuotationRow = {
    quotation_id: string;
    quotation_no: string;

    customer_id: string;
    project_site_id: string;

    accepted_revision_id: string | null;

    quotation_status: string;
    total_amount: number;
};

type CustomerRow = {
    customer_id: string;
    customer_name: string;
};

type ProjectRow = {
    project_id: string;
    project_name: string;
    customer_id: string;
};

type SiteRow = {
    site_id: string;
    site_code: string | null;
    site_name: string;
    project_id: string;
    site_status: string;
};

type AreaRow = {
    area_id: string;
    area_code: string | null;
    area_name: string;

    project_id: string;
    site_id: string;

    area_status: string;
};

type ProductRow = {
    product_id: string;
    product_code: string;
    product_name: string;

    base_uom_code: string;
    default_sales_uom_code: string | null;

    is_service_item: boolean;
};

type UomRow = {
    uom_code: string;
    uom_name: string;
};

type ConversionRow = {
    product_id: string;

    from_uom_code: string;
    to_uom_code: string;

    conversion_factor: number;
    allow_fractional_quantity: boolean;
};

type LookupData = {
    quotations: AcceptedQuotationRow[];
    customers: CustomerRow[];
    projects: ProjectRow[];
    sites: SiteRow[];
    areas: AreaRow[];
    products: ProductRow[];
    uoms: UomRow[];
    conversions: ConversionRow[];
};

type HeaderForm = {
    quotationId: string;
    variationReason: string;

    issueDate: string;
    validUntil: string;

    notes: string;
};

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

type RejectCancelDialogState = {
    mode: "reject" | "cancel";
    variation: VariationRow;
};

type AcceptForm = {
    requiredByDate: string;
    materialRequirementNotes: string;
};

const VARIATION_PERMISSIONS = [
    "variations.view",
    "variations.view_internal",
    "variations.view_cost",
    "variations.view_margin",
    "variations.create",
    "variations.update_draft",
    "variations.send",
    "variations.accept",
    "variations.reject",
    "variations.cancel",
] as const;

const VARIATION_STATUSES: VariationStatus[] = [
    "Draft",
    "Sent",
    "Accepted",
    "Rejected",
    "Cancelled",
];

const getToday = () => new Date().toISOString().slice(0, 10);

const addDays = (days: number) => {
    const date = new Date();

    date.setDate(date.getDate() + days);

    return date.toISOString().slice(0, 10);
};

const createClientId = () => {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random()}`;
};

const createEmptyHeader = (): HeaderForm => ({
    quotationId: "",
    variationReason: "",
    issueDate: getToday(),
    validUntil: addDays(14),
    notes: "",
});

const createEmptyLine = (): LineForm => ({
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

const toNumber = (value: string) => {
    const parsedValue = Number(value);

    return Number.isFinite(parsedValue) ? parsedValue : 0;
};

const formatMoney = (value: unknown) =>
    new Intl.NumberFormat("en-AU", {
        style: "currency",
        currency: "AUD",
    }).format(Number(value ?? 0));

const formatDate = (value: string | null | undefined) => {
    if (!value) {
        return "—";
    }

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("en-AU");
};

const escapeCsv = (value: unknown) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

const getStatusClassName = (status: string) => {
    const styles: Record<string, string> = {
        Draft: "bg-slate-100 text-slate-700",
        Sent: "bg-blue-100 text-blue-800",
        Accepted: "bg-emerald-100 text-emerald-800",
        Rejected: "bg-rose-100 text-rose-800",
        Cancelled: "bg-zinc-200 text-zinc-700",
    };

    return styles[status] ?? "bg-slate-100 text-slate-700";
};

const Variations = () => {
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const [selectedVariationId, setSelectedVariationId] = useState("");

    const [showFormDialog, setShowFormDialog] = useState(false);
    const [showDetailDialog, setShowDetailDialog] = useState(false);

    const [editingVariation, setEditingVariation] =
        useState<VariationRow | null>(null);

    const [viewingVariation, setViewingVariation] =
        useState<VariationRow | null>(null);

    const [headerForm, setHeaderForm] =
        useState<HeaderForm>(createEmptyHeader);

    const [lineForms, setLineForms] = useState<LineForm[]>([
        createEmptyLine(),
    ]);

    const [rejectCancelDialog, setRejectCancelDialog] =
        useState<RejectCancelDialogState | null>(null);

    const [workflowReason, setWorkflowReason] = useState("");

    const [acceptingVariation, setAcceptingVariation] =
        useState<VariationRow | null>(null);

    const [acceptForm, setAcceptForm] = useState<AcceptForm>({
        requiredByDate: addDays(7),
        materialRequirementNotes: "",
    });

    const permissionsQuery = useQuery({
        queryKey: ["variation-permissions"],

        queryFn: async (): Promise<PermissionMap> => {
            const permissionEntries = await Promise.all(
                VARIATION_PERMISSIONS.map(async (permissionCode) => {
                    const { data, error } = await database.rpc(
                        "has_permission",
                        {
                            p_permission_code: permissionCode,
                        },
                    );

                    if (error) {
                        throw error;
                    }

                    return [
                        permissionCode,
                        Boolean(data),
                    ] as const;
                }),
            );

            return Object.fromEntries(permissionEntries);
        },
    });

    const permissions = permissionsQuery.data ?? {};

    const hasPermission = (permissionCode: string) =>
        permissions[permissionCode] === true;

    const canReadVariationTables =
        hasPermission("variations.view") &&
        hasPermission("variations.view_internal") &&
        hasPermission("variations.view_cost") &&
        hasPermission("variations.view_margin");

    const lookupQuery = useQuery({
        queryKey: ["variation-lookups"],

        enabled:
            hasPermission("variations.view") ||
            hasPermission("variations.create"),

        queryFn: async (): Promise<LookupData> => {
            const [
                quotationResult,
                customerResult,
                projectResult,
                siteResult,
                areaResult,
                productResult,
                uomResult,
                conversionResult,
            ] = await Promise.all([
                database
                    .from("quotations")
                    .select(
                        [
                            "quotation_id",
                            "quotation_no",
                            "customer_id",
                            "project_site_id",
                            "accepted_revision_id",
                            "quotation_status",
                            "total_amount",
                        ].join(","),
                    )
                    .eq("quotation_status", "Accepted")
                    .eq("is_active", true)
                    .eq("is_deleted", false)
                    .order("accepted_at", {
                        ascending: false,
                    }),

                database
                    .from("customers")
                    .select("customer_id,customer_name")
                    .eq("is_deleted", false)
                    .order("customer_name"),

                database
                    .from("projects")
                    .select("project_id,project_name,customer_id")
                    .eq("is_deleted", false)
                    .order("project_name"),

                database
                    .from("project_sites")
                    .select(
                        "site_id,site_code,site_name,project_id,site_status",
                    )
                    .eq("site_status", "Active")
                    .eq("is_active", true)
                    .eq("is_deleted", false)
                    .order("site_name"),

                database
                    .from("project_areas")
                    .select(
                        [
                            "area_id",
                            "area_code",
                            "area_name",
                            "project_id",
                            "site_id",
                            "area_status",
                        ].join(","),
                    )
                    .in("area_status", [
                        "Quotation",
                        "Active",
                    ])
                    .eq("is_active", true)
                    .eq("is_deleted", false)
                    .order("area_name"),

                database
                    .from("products")
                    .select(
                        [
                            "product_id",
                            "product_code",
                            "product_name",
                            "base_uom_code",
                            "default_sales_uom_code",
                            "is_service_item",
                        ].join(","),
                    )
                    .eq("is_active", true)
                    .eq("is_deleted", false)
                    .order("product_code"),

                database
                    .from("units_of_measure")
                    .select("uom_code,uom_name")
                    .eq("is_active", true)
                    .eq("is_deleted", false)
                    .order("uom_code"),

                database
                    .from("product_uom_conversions")
                    .select(
                        [
                            "product_id",
                            "from_uom_code",
                            "to_uom_code",
                            "conversion_factor",
                            "allow_fractional_quantity",
                        ].join(","),
                    )
                    .eq("is_active", true)
                    .eq("is_deleted", false),
            ]);

            const firstError = [
                quotationResult.error,
                customerResult.error,
                projectResult.error,
                siteResult.error,
                areaResult.error,
                productResult.error,
                uomResult.error,
                conversionResult.error,
            ].find(Boolean);

            if (firstError) {
                throw firstError;
            }

            return {
                quotations:
                    (quotationResult.data ?? []) as AcceptedQuotationRow[],

                customers:
                    (customerResult.data ?? []) as CustomerRow[],

                projects:
                    (projectResult.data ?? []) as ProjectRow[],

                sites:
                    (siteResult.data ?? []) as SiteRow[],

                areas:
                    (areaResult.data ?? []) as AreaRow[],

                products:
                    (productResult.data ?? []) as ProductRow[],

                uoms:
                    (uomResult.data ?? []) as UomRow[],

                conversions:
                    (conversionResult.data ?? []) as ConversionRow[],
            };
        },
    });

    const variationsQuery = useQuery({
        queryKey: ["variations"],

        enabled: canReadVariationTables,

        queryFn: async (): Promise<VariationRow[]> => {
            const { data, error } = await database
                .from("variations")
                .select("*")
                .eq("is_deleted", false)
                .order("created_at", {
                    ascending: false,
                });

            if (error) {
                throw error;
            }

            return (data ?? []) as VariationRow[];
        },
    });

    const detailLinesQuery = useQuery({
        queryKey: [
            "variation-lines",
            viewingVariation?.variation_id,
        ],

        enabled:
            canReadVariationTables &&
            Boolean(viewingVariation?.variation_id),

        queryFn: async (): Promise<VariationLineRow[]> => {
            if (!viewingVariation) {
                return [];
            }

            const { data, error } = await database
                .from("variation_lines")
                .select("*")
                .eq(
                    "variation_id",
                    viewingVariation.variation_id,
                )
                .eq("is_deleted", false)
                .order("line_no");

            if (error) {
                throw error;
            }

            return (data ?? []) as VariationLineRow[];
        },
    });

    const lookups = lookupQuery.data;

    const quotations = lookups?.quotations ?? [];
    const customers = lookups?.customers ?? [];
    const projects = lookups?.projects ?? [];
    const sites = lookups?.sites ?? [];
    const areas = lookups?.areas ?? [];
    const products = lookups?.products ?? [];
    const uoms = lookups?.uoms ?? [];
    const conversions = lookups?.conversions ?? [];

    const variations = variationsQuery.data ?? [];
    const detailLines = detailLinesQuery.data ?? [];

    const selectedVariation =
        variations.find(
            (variation) =>
                variation.variation_id === selectedVariationId,
        ) ?? null;

    const quotationMap = useMemo(
        () =>
            new Map(
                quotations.map((quotation) => [
                    quotation.quotation_id,
                    quotation,
                ]),
            ),
        [quotations],
    );

    const customerMap = useMemo(
        () =>
            new Map(
                customers.map((customer) => [
                    customer.customer_id,
                    customer,
                ]),
            ),
        [customers],
    );

    const projectMap = useMemo(
        () =>
            new Map(
                projects.map((project) => [
                    project.project_id,
                    project,
                ]),
            ),
        [projects],
    );

    const siteMap = useMemo(
        () =>
            new Map(
                sites.map((site) => [
                    site.site_id,
                    site,
                ]),
            ),
        [sites],
    );

    const areaMap = useMemo(
        () =>
            new Map(
                areas.map((area) => [
                    area.area_id,
                    area,
                ]),
            ),
        [areas],
    );

    const productMap = useMemo(
        () =>
            new Map(
                products.map((product) => [
                    product.product_id,
                    product,
                ]),
            ),
        [products],
    );

    const selectedQuotation = quotationMap.get(
        headerForm.quotationId,
    );

    const selectedSite = selectedQuotation
        ? siteMap.get(selectedQuotation.project_site_id)
        : undefined;

    const selectedProject = selectedSite
        ? projectMap.get(selectedSite.project_id)
        : undefined;

    const selectedCustomer = selectedQuotation
        ? customerMap.get(selectedQuotation.customer_id)
        : undefined;

    const availableAreas = useMemo(() => {
        if (!selectedSite || !selectedProject) {
            return [];
        }

        return areas.filter(
            (area) =>
                area.site_id === selectedSite.site_id &&
                area.project_id === selectedProject.project_id,
        );
    }, [
        areas,
        selectedSite,
        selectedProject,
    ]);

    const filteredVariations = useMemo(() => {
        const normalizedSearchTerm = searchTerm
            .trim()
            .toLowerCase();

        return variations.filter((variation) => {
            if (
                statusFilter !== "all" &&
                variation.variation_status !== statusFilter
            ) {
                return false;
            }

            if (!normalizedSearchTerm) {
                return true;
            }

            const customerName =
                customerMap.get(variation.customer_id)
                    ?.customer_name ?? "";

            const projectName =
                projectMap.get(variation.project_id)
                    ?.project_name ?? "";

            const site = siteMap.get(
                variation.project_site_id,
            );

            const siteText = [
                site?.site_code,
                site?.site_name,
            ]
                .filter(Boolean)
                .join(" ");

            return [
                variation.variation_no,
                variation.variation_reason,
                customerName,
                projectName,
                siteText,
            ].some((value) =>
                value
                    .toLowerCase()
                    .includes(normalizedSearchTerm),
            );
        });
    }, [
        variations,
        statusFilter,
        searchTerm,
        customerMap,
        projectMap,
        siteMap,
    ]);

    const calculatedTotals = useMemo(() => {
        return lineForms.reduce(
            (totals, line) => {
                if (line.isOptional) {
                    return totals;
                }

                const quantity = toNumber(line.quantity);
                const unitPrice = toNumber(line.unitPrice);

                const discountPercent = toNumber(
                    line.discountPercent,
                );

                const taxRate = toNumber(line.taxRate);

                const subtotal =
                    quantity * unitPrice;

                const discount =
                    subtotal *
                    (discountPercent / 100);

                const tax =
                    (subtotal - discount) *
                    (taxRate / 100);

                totals.subtotal += subtotal;
                totals.discount += discount;
                totals.tax += tax;

                totals.total +=
                    subtotal -
                    discount +
                    tax;

                return totals;
            },
            {
                subtotal: 0,
                discount: 0,
                tax: 0,
                total: 0,
            },
        );
    }, [lineForms]);

    const isInitialLoading =
        permissionsQuery.isLoading ||
        lookupQuery.isLoading ||
        variationsQuery.isLoading;

    const resetVariationForm = () => {
        setEditingVariation(null);
        setHeaderForm(createEmptyHeader());
        setLineForms([createEmptyLine()]);
    };

    const openCreateDialog = () => {
        resetVariationForm();
        setShowFormDialog(true);
    };

    const closeCreateEditDialog = () => {
        setShowFormDialog(false);
        resetVariationForm();
    };

    const updateLineForm = (
        clientId: string,
        values: Partial<LineForm>,
    ) => {
        setLineForms((currentLines) =>
            currentLines.map((line) =>
                line.clientId === clientId
                    ? {
                        ...line,
                        ...values,
                    }
                    : line,
            ),
        );
    };

    const handleQuotationChange = (
        quotationId: string,
    ) => {
        setHeaderForm((currentHeader) => ({
            ...currentHeader,
            quotationId,
        }));

        setLineForms((currentLines) =>
            currentLines.map((line) => ({
                ...line,
                projectAreaId: "",
            })),
        );
    };

    const handleProductChange = (
        clientId: string,
        productId: string,
    ) => {
        if (productId === "__manual__") {
            updateLineForm(clientId, {
                productId: "",
            });

            return;
        }

        const product = productMap.get(productId);

        if (!product) {
            return;
        }

        const salesUomCode =
            product.default_sales_uom_code ||
            product.base_uom_code;

        const matchingConversion =
            conversions.find(
                (conversion) =>
                    conversion.product_id === productId &&
                    conversion.from_uom_code ===
                    salesUomCode &&
                    conversion.to_uom_code ===
                    product.base_uom_code,
            );

        updateLineForm(clientId, {
            productId,
            description: product.product_name,

            salesUomCode,
            baseUomCode: product.base_uom_code,

            conversionFactor: String(
                matchingConversion?.conversion_factor ?? 1,
            ),

            allowFractionalQuantity:
                matchingConversion
                    ?.allow_fractional_quantity ?? true,
        });
    };

    const buildVariationPayload = () => {
        if (!headerForm.quotationId) {
            throw new Error(
                "Accepted Quotation is required.",
            );
        }

        if (!headerForm.variationReason.trim()) {
            throw new Error(
                "Variation Reason is required.",
            );
        }

        if (
            headerForm.issueDate &&
            headerForm.validUntil &&
            headerForm.validUntil <
            headerForm.issueDate
        ) {
            throw new Error(
                "Valid Until cannot be earlier than Issue Date.",
            );
        }

        if (lineForms.length === 0) {
            throw new Error(
                "At least one Variation line is required.",
            );
        }

        const linePayload = lineForms.map(
            (line, index) => {
                const lineNumber = index + 1;

                if (!line.description.trim()) {
                    throw new Error(
                        `Description is required for line ${lineNumber}.`,
                    );
                }

                if (!line.salesUomCode) {
                    throw new Error(
                        `Sales UOM is required for line ${lineNumber}.`,
                    );
                }

                if (!line.baseUomCode) {
                    throw new Error(
                        `Base UOM is required for line ${lineNumber}.`,
                    );
                }

                const quantity = toNumber(
                    line.quantity,
                );

                const conversionFactor =
                    toNumber(
                        line.conversionFactor,
                    );

                if (quantity <= 0) {
                    throw new Error(
                        `Quantity must be greater than zero for line ${lineNumber}.`,
                    );
                }

                if (conversionFactor <= 0) {
                    throw new Error(
                        `Conversion Factor must be greater than zero for line ${lineNumber}.`,
                    );
                }

                if (
                    !line.allowFractionalQuantity &&
                    quantity !== Math.trunc(quantity)
                ) {
                    throw new Error(
                        `Line ${lineNumber} does not allow fractional quantity.`,
                    );
                }

                return {
                    product_id:
                        line.productId || null,

                    project_area_id:
                        line.projectAreaId || null,

                    description:
                        line.description.trim(),

                    sales_uom_code:
                        line.salesUomCode,

                    base_uom_code:
                        line.baseUomCode,

                    conversion_factor:
                        conversionFactor,

                    allow_fractional_quantity:
                        line.allowFractionalQuantity,

                    quantity,

                    unit_price:
                        toNumber(line.unitPrice),

                    discount_percent:
                        toNumber(
                            line.discountPercent,
                        ),

                    tax_rate:
                        toNumber(line.taxRate),

                    cost_price:
                        toNumber(line.costPrice),

                    notes:
                        line.notes.trim() || null,

                    is_optional:
                        line.isOptional,
                };
            },
        );

        return {
            header: {
                quotation_id:
                    headerForm.quotationId,

                variation_reason:
                    headerForm.variationReason.trim(),

                issue_date:
                    headerForm.issueDate || null,

                valid_until:
                    headerForm.validUntil || null,

                notes:
                    headerForm.notes.trim() || null,
            },

            lines: linePayload,
        };
    };

    const openEditDialog = async (
        variation: VariationRow,
    ) => {
        if (
            variation.variation_status !== "Draft"
        ) {
            toast.error(
                "Only a Draft Variation can be edited.",
            );

            return;
        }

        const { data, error } = await database
            .from("variation_lines")
            .select("*")
            .eq(
                "variation_id",
                variation.variation_id,
            )
            .eq("is_deleted", false)
            .order("line_no");

        if (error) {
            toast.error(error.message);

            return;
        }

        const existingLines =
            (data ?? []) as VariationLineRow[];

        setEditingVariation(variation);

        setHeaderForm({
            quotationId:
                variation.quotation_id,

            variationReason:
                variation.variation_reason,

            issueDate:
                variation.issue_date ??
                getToday(),

            validUntil:
                variation.valid_until ?? "",

            notes:
                variation.notes ?? "",
        });

        setLineForms(
            existingLines.length > 0
                ? existingLines.map((line) => ({
                    clientId:
                        line.variation_line_id,

                    productId:
                        line.product_id ?? "",

                    projectAreaId:
                        line.project_area_id ?? "",

                    description:
                        line.description,

                    salesUomCode:
                        line.sales_uom_code ??
                        line.unit_of_measure ??
                        "",

                    baseUomCode:
                        line.base_uom_code ?? "",

                    conversionFactor:
                        String(
                            line.conversion_factor ?? 1,
                        ),

                    quantity:
                        String(line.quantity ?? 1),

                    unitPrice:
                        String(
                            line.unit_price ?? 0,
                        ),

                    discountPercent:
                        String(
                            line.discount_percent ?? 0,
                        ),

                    taxRate:
                        String(line.tax_rate ?? 0),

                    costPrice:
                        String(
                            line.cost_price ?? 0,
                        ),

                    notes:
                        line.notes ?? "",

                    isOptional:
                        Boolean(line.is_optional),

                    allowFractionalQuantity:
                        Boolean(
                            line.allow_fractional_quantity,
                        ),
                }))
                : [createEmptyLine()],
        );

        setShowDetailDialog(false);
        setShowFormDialog(true);
    };

    const fetchVariationLines = async (
        variationId: string,
    ): Promise<VariationLineRow[]> => {
        const { data, error } = await database
            .from("variation_lines")
            .select("*")
            .eq("variation_id", variationId)
            .eq("is_deleted", false)
            .order("line_no");

        if (error) {
            throw error;
        }

        return (data ?? []) as VariationLineRow[];
    };

    const openDetailDialog = (
        variation: VariationRow,
    ) => {
        setSelectedVariationId(variation.variation_id);
        setViewingVariation(variation);
        setShowDetailDialog(true);
    };

    const handleToolbarDetail = () => {
        if (!selectedVariation) {
            toast.error("Please select a Variation first.");
            return;
        }

        openDetailDialog(selectedVariation);
    };

    const handleToolbarCsv = async () => {
        if (!selectedVariation) {
            toast.error("Please select a Variation first.");
            return;
        }

        try {
            const variationLines =
                await fetchVariationLines(
                    selectedVariation.variation_id,
                );

            exportVariationCsv(
                selectedVariation,
                variationLines,
            );
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Variation CSV could not be generated.",
            );
        }
    };

    const handleToolbarPrint = async () => {
        if (!selectedVariation) {
            toast.error("Please select a Variation first.");
            return;
        }

        try {
            await queryClient.fetchQuery({
                queryKey: [
                    "variation-lines",
                    selectedVariation.variation_id,
                ],

                queryFn: () =>
                    fetchVariationLines(
                        selectedVariation.variation_id,
                    ),
            });

            setViewingVariation(selectedVariation);
            setShowDetailDialog(true);

            window.setTimeout(() => {
                window.print();
            }, 350);
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Variation could not be prepared for printing.",
            );
        }
    };

    const saveVariationMutation = useMutation({
        mutationFn: async () => {
            const payload =
                buildVariationPayload();

            if (editingVariation) {
                const { data, error } =
                    await database.rpc(
                        "update_draft_variation_atomic",
                        {
                            p_variation_id:
                                editingVariation.variation_id,

                            p_variation:
                                payload.header,

                            p_lines:
                                payload.lines,
                        },
                    );

                if (error) {
                    throw error;
                }

                return data;
            }

            const { data, error } =
                await database.rpc(
                    "create_variation_atomic",
                    {
                        p_variation:
                            payload.header,

                        p_lines:
                            payload.lines,
                    },
                );

            if (error) {
                throw error;
            }

            return data;
        },

        onSuccess: async () => {
            toast.success(
                editingVariation
                    ? "Variation updated successfully."
                    : "Variation created successfully.",
            );

            closeCreateEditDialog();

            await queryClient.invalidateQueries({
                queryKey: ["variations"],
            });
        },

        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const sendVariationMutation = useMutation({
        mutationFn: async (
            variation: VariationRow,
        ) => {
            const { data, error } =
                await database.rpc(
                    "send_variation_atomic",
                    {
                        p_variation_id:
                            variation.variation_id,
                    },
                );

            if (error) {
                throw error;
            }

            return data;
        },

        onSuccess: async () => {
            toast.success(
                "Variation sent successfully.",
            );

            await queryClient.invalidateQueries({
                queryKey: ["variations"],
            });
        },

        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const acceptVariationMutation = useMutation({
        mutationFn: async ({
            variation,
            form,
        }: {
            variation: VariationRow;
            form: AcceptForm;
        }) => {
            const { data, error } =
                await database.rpc(
                    "accept_variation_atomic",
                    {
                        p_variation_id:
                            variation.variation_id,

                        p_required_by_date:
                            form.requiredByDate || null,

                        p_delivery_stock_location_id:
                            null,

                        p_responsible_auth_user_id:
                            null,

                        p_material_requirement_notes:
                            form.materialRequirementNotes.trim() ||
                            `Generated from Accepted Variation ${variation.variation_no}`,
                    },
                );

            if (error) {
                throw error;
            }

            return data as string;
        },

        onSuccess: async (
            materialRequirementId,
        ) => {
            toast.success(
                "Variation accepted and an additional Material Requirement was created.",
            );

            setAcceptingVariation(null);

            setShowDetailDialog(false);

            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: ["variations"],
                }),

                queryClient.invalidateQueries({
                    queryKey: [
                        "material-requirements",
                    ],
                }),
            ]);

            console.info(
                "Created Material Requirement:",
                materialRequirementId,
            );
        },

        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const rejectVariationMutation = useMutation({
        mutationFn: async ({
            variation,
            reason,
        }: {
            variation: VariationRow;
            reason: string;
        }) => {
            if (!reason.trim()) {
                throw new Error(
                    "Rejection Reason is required.",
                );
            }

            const { data, error } =
                await database.rpc(
                    "reject_variation_atomic",
                    {
                        p_variation_id:
                            variation.variation_id,

                        p_rejection_reason:
                            reason.trim(),
                    },
                );

            if (error) {
                throw error;
            }

            return data;
        },

        onSuccess: async () => {
            toast.success(
                "Variation rejected successfully.",
            );

            setRejectCancelDialog(null);
            setWorkflowReason("");
            setShowDetailDialog(false);

            await queryClient.invalidateQueries({
                queryKey: ["variations"],
            });
        },

        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const cancelVariationMutation = useMutation({
        mutationFn: async ({
            variation,
            reason,
        }: {
            variation: VariationRow;
            reason: string;
        }) => {
            if (!reason.trim()) {
                throw new Error(
                    "Cancellation Reason is required.",
                );
            }

            const { data, error } =
                await database.rpc(
                    "cancel_variation_atomic",
                    {
                        p_variation_id:
                            variation.variation_id,

                        p_cancellation_reason:
                            reason.trim(),
                    },
                );

            if (error) {
                throw error;
            }

            return data;
        },

        onSuccess: async () => {
            toast.success(
                "Variation cancelled successfully.",
            );

            setRejectCancelDialog(null);
            setWorkflowReason("");
            setShowDetailDialog(false);

            await queryClient.invalidateQueries({
                queryKey: ["variations"],
            });
        },

        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const exportVariationCsv = (
        variation: VariationRow,
        variationLines: VariationLineRow[],
    ) => {
        const customer =
            customerMap.get(
                variation.customer_id,
            );

        const project =
            projectMap.get(
                variation.project_id,
            );

        const site =
            siteMap.get(
                variation.project_site_id,
            );

        const quotation =
            quotationMap.get(
                variation.quotation_id,
            );

        const csvRows: unknown[][] = [
            [
                "Variation No",
                "Status",
                "Accepted Quotation",
                "Customer",
                "Project",
                "Site",
                "Reason",
                "Issue Date",
                "Valid Until",
                "Subtotal",
                "Discount",
                "Tax",
                "Total",
            ],

            [
                variation.variation_no,
                variation.variation_status,
                quotation?.quotation_no ?? "",
                customer?.customer_name ?? "",
                project?.project_name ?? "",
                site?.site_name ?? "",
                variation.variation_reason,
                variation.issue_date ?? "",
                variation.valid_until ?? "",
                variation.subtotal,
                variation.discount_amount,
                variation.tax_amount,
                variation.total_amount,
            ],

            [],

            [
                "Line",
                "Area",
                "Product Code",
                "Product Name",
                "Description",
                "Quantity",
                "Sales UOM",
                "Base UOM",
                "Conversion Factor",
                "Base Quantity",
                "Unit Price",
                "Discount %",
                "Tax %",
                "Line Total",
                "Optional",
            ],

            ...variationLines.map((line) => {
                const product = line.product_id
                    ? productMap.get(line.product_id)
                    : undefined;

                const area = line.project_area_id
                    ? areaMap.get(
                        line.project_area_id,
                    )
                    : undefined;

                return [
                    line.line_no,
                    area?.area_name ?? "",
                    product?.product_code ?? "",
                    product?.product_name ?? "",
                    line.description,
                    line.quantity,
                    line.sales_uom_code ??
                    line.unit_of_measure ??
                    "",
                    line.base_uom_code ?? "",
                    line.conversion_factor,
                    line.base_quantity,
                    line.unit_price,
                    line.discount_percent,
                    line.tax_rate,
                    line.line_total,
                    line.is_optional ? "Yes" : "No",
                ];
            }),
        ];

        const csv = csvRows
            .map((row) =>
                row
                    .map(escapeCsv)
                    .join(","),
            )
            .join("\n");

        const blob = new Blob(
            [csv],
            {
                type: "text/csv;charset=utf-8",
            },
        );

        const objectUrl =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = objectUrl;

        link.download =
            `${variation.variation_no}.csv`;

        document.body.appendChild(link);

        link.click();
        link.remove();

        URL.revokeObjectURL(objectUrl);
    };

    const handleRefresh = async () => {
        await Promise.all([
            queryClient.invalidateQueries({
                queryKey: ["variation-lookups"],
            }),

            queryClient.invalidateQueries({
                queryKey: ["variations"],
            }),
        ]);
    };

    const saveIsPending =
        saveVariationMutation.isPending;

    const workflowIsPending =
        sendVariationMutation.isPending ||
        acceptVariationMutation.isPending ||
        rejectVariationMutation.isPending ||
        cancelVariationMutation.isPending;

    if (
        !permissionsQuery.isLoading &&
        !hasPermission("variations.view")
    ) {
        return (
            <div className="min-h-screen bg-slate-50 p-4 md:p-6">
                <div className="mx-auto max-w-5xl">
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
                        <h1 className="text-lg font-bold">
                            Variations
                        </h1>

                        <p className="mt-2 text-sm">
                            You do not have permission to view
                            Variations.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (
        !permissionsQuery.isLoading &&
        hasPermission("variations.view") &&
        !canReadVariationTables
    ) {
        return (
            <div className="min-h-screen bg-slate-50 p-4 md:p-6">
                <div className="mx-auto max-w-5xl">
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
                        <h1 className="text-lg font-bold">
                            Variation access is incomplete
                        </h1>

                        <p className="mt-2 text-sm">
                            The current database read policy requires
                            Variation view, internal, cost and margin
                            permissions together. Ask an Admin to review
                            this user&apos;s Variation permissions.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6">
            <style>
                {`
                    @media print {
                        @page {
                            size: A4 portrait;
                            margin: 11mm;
                        }

                        html,
                        body {
                            width: 210mm;
                            min-height: 297mm;
                            background: #ffffff !important;
                        }

                        body * {
                            visibility: hidden;
                        }

                        .variation-print-dialog {
                            position: static !important;
                            left: auto !important;
                            top: auto !important;
                            width: 100% !important;
                            max-width: none !important;
                            max-height: none !important;
                            height: auto !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            transform: none !important;
                            overflow: visible !important;
                            border: 0 !important;
                            box-shadow: none !important;
                            background: transparent !important;
                        }

                        .variation-print-dialog > button,
                        [data-radix-dialog-overlay] {
                            display: none !important;
                        }

                        .variation-print-report,
                        .variation-print-report * {
                            visibility: visible !important;
                        }

                        .variation-print-report {
                            position: absolute !important;
                            left: 0 !important;
                            top: 0 !important;
                            width: 100% !important;
                            max-width: 188mm !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            transform: none !important;
                            box-shadow: none !important;
                            color: #111827 !important;
                            font-size: 9.5pt !important;
                            line-height: 1.35 !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }

                        .variation-print-report h2 {
                            font-size: 15pt !important;
                            color: #ffffff !important;
                            font-weight: 800 !important;
                        }

                        .variation-print-block,
                        .variation-print-header,
                        .variation-print-context,
                        .variation-print-totals {
                            break-inside: avoid;
                            page-break-inside: avoid;
                        }

                        .variation-print-header {
                            border: 1px solid #B98A8A !important;
                            border-radius: 8px !important;
                            overflow: hidden !important;
                            box-shadow: none !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }

                        .variation-print-header > div:first-child {
                            background: #9E4B4B !important;
                            padding: 8pt 10pt !important;
                            color: #ffffff !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }

                        .variation-status-badge {
                            border: 1px solid rgba(17, 24, 39, 0.16) !important;
                            font-size: 7.5pt !important;
                            font-weight: 800 !important;
                            line-height: 1 !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }

                        .variation-status-draft {
                            background: #FFFFFF !important;
                            color: #9E4B4B !important;
                        }

                        .variation-status-sent {
                            background: #DBEAFE !important;
                            color: #1D4ED8 !important;
                        }

                        .variation-status-accepted {
                            background: #D1FAE5 !important;
                            color: #047857 !important;
                        }

                        .variation-status-rejected {
                            background: #FEE2E2 !important;
                            color: #B91C1C !important;
                        }

                        .variation-status-cancelled {
                            background: #E5E7EB !important;
                            color: #374151 !important;
                        }

                        .variation-print-context,
                        .variation-print-totals {
                            display: grid !important;
                            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
                        }

                        .variation-print-context > div,
                        .variation-print-totals > div {
                            background: #FBF1F1 !important;
                            border-color: #B98A8A !important;
                            padding: 7pt !important;
                            min-width: 0 !important;
                            overflow-wrap: anywhere !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }

                        .variation-report-label {
                            color: #6B7280 !important;
                            font-size: 7pt !important;
                            font-weight: 700 !important;
                            letter-spacing: 0.02em !important;
                        }

                        .variation-report-value {
                            color: #111827 !important;
                            font-size: 8.5pt !important;
                            font-weight: 600 !important;
                        }

                        .variation-print-context > div:last-child {
                            grid-column: span 2 !important;
                        }

                        .variation-print-lines {
                            border: 1px solid #B98A8A !important;
                            border-radius: 8px !important;
                            overflow: visible !important;
                            break-inside: auto;
                            page-break-inside: auto;
                        }

                        .variation-section-title {
                            background: #F5DEDE !important;
                            color: #111827 !important;
                            font-size: 9pt !important;
                            font-weight: 800 !important;
                            padding: 6pt 8pt !important;
                            border-bottom: 1px solid #B98A8A !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }

                        .variation-print-table-wrap {
                            overflow: visible !important;
                            width: 100% !important;
                        }

                        .variation-print-table {
                            width: 100% !important;
                            min-width: 0 !important;
                            table-layout: fixed !important;
                            border-collapse: collapse !important;
                            font-size: 8.2pt !important;
                            border: 1px solid #B98A8A !important;
                        }

                        .variation-print-table thead {
                            display: table-header-group !important;
                            background: #9E4B4B !important;
                            color: #FFFFFF !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }

                        .variation-print-table tr {
                            break-inside: avoid;
                            page-break-inside: avoid;
                        }

                        .variation-print-table tbody tr:nth-child(odd) {
                            background: #FFFFFF !important;
                        }

                        .variation-print-table tbody tr:nth-child(even) {
                            background: #FBF1F1 !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }

                        .variation-print-table th,
                        .variation-print-table td {
                            border-bottom: 1px solid #E5E7EB !important;
                            padding: 4pt 3.5pt !important;
                            overflow-wrap: anywhere !important;
                            word-break: normal !important;
                            white-space: normal !important;
                            vertical-align: top !important;
                        }

                        .variation-print-table th {
                            color: #FFFFFF !important;
                            font-size: 7.5pt !important;
                            font-weight: 800 !important;
                        }

                        .variation-line-product {
                            color: #111827 !important;
                            font-weight: 700 !important;
                        }

                        .variation-line-description {
                            color: #374151 !important;
                        }

                        .variation-print-table th:nth-child(1),
                        .variation-print-table td:nth-child(1) {
                            width: 6%;
                        }

                        .variation-print-table th:nth-child(2),
                        .variation-print-table td:nth-child(2) {
                            width: 11%;
                        }

                        .variation-print-table th:nth-child(3),
                        .variation-print-table td:nth-child(3) {
                            width: 29%;
                        }

                        .variation-print-table th:nth-child(4),
                        .variation-print-table td:nth-child(4) {
                            width: 8%;
                        }

                        .variation-print-table th:nth-child(5),
                        .variation-print-table td:nth-child(5) {
                            width: 7%;
                        }

                        .variation-print-table th:nth-child(6),
                        .variation-print-table td:nth-child(6) {
                            width: 11%;
                        }

                        .variation-print-table th:nth-child(7),
                        .variation-print-table td:nth-child(7),
                        .variation-print-table th:nth-child(8),
                        .variation-print-table td:nth-child(8) {
                            width: 8%;
                        }

                        .variation-print-table th:nth-child(9),
                        .variation-print-table td:nth-child(9) {
                            width: 12%;
                        }

                        .variation-print-totals {
                            border: 1px solid #B98A8A !important;
                            border-radius: 8px !important;
                            background: #FBF1F1 !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }

                        .variation-print-totals > div {
                            border-right: 1px solid #B98A8A !important;
                        }

                        .variation-print-totals > div:last-child {
                            background: #F5DEDE !important;
                            border-right: 0 !important;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }

                        .variation-print-totals > div:last-child .variation-report-value {
                            color: #9E4B4B !important;
                            font-size: 10pt !important;
                            font-weight: 800 !important;
                        }

                        .variation-notes {
                            background: #FBF1F1 !important;
                            border: 1px solid #B98A8A !important;
                        }

                        .variation-rejection {
                            background: #FEE2E2 !important;
                            border: 1px solid #FCA5A5 !important;
                        }

                        .variation-rejection h3 {
                            color: #B91C1C !important;
                        }

                        .variation-cancellation {
                            background: #F3F4F6 !important;
                            border: 1px solid #9CA3AF !important;
                        }

                        .variation-cancellation h3 {
                            color: #374151 !important;
                        }

                        .print\\:hidden {
                            display: none !important;
                        }
                    }
                `}
            </style>

            <div className="mx-auto max-w-[1500px] space-y-5">
                <section className="overflow-hidden rounded-2xl border border-[#B98A8A] bg-white shadow-sm">
                    <div className="flex flex-col gap-4 bg-[#9E4B4B] px-5 py-5 text-white md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <FileText className="h-6 w-6" />

                                <h1 className="text-2xl font-bold">
                                    Variations
                                </h1>
                            </div>

                            <p className="mt-1 max-w-3xl text-sm text-white/80">
                                Commercial changes after an Accepted
                                Quotation. Accepting a Variation creates a
                                new additional Material Requirement and does
                                not alter an existing completed requirement.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                disabled={isInitialLoading}
                                onClick={handleRefresh}
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Refresh
                            </Button>

                            {hasPermission(
                                "variations.create",
                            ) && (
                                    <Button
                                        type="button"
                                        className="bg-white text-[#9E4B4B] hover:bg-rose-50"
                                        onClick={openCreateDialog}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        New Variation
                                    </Button>
                                )}
                        </div>
                    </div>

                    <div className="border-t border-[#B98A8A]/40 p-4">
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                            <div className="relative min-w-0 flex-1">
                                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />

                                <Input
                                    value={searchTerm}
                                    onChange={(event) =>
                                        setSearchTerm(event.target.value)
                                    }
                                    placeholder="Search Variation, customer, project, site or reason"
                                    className="h-11 bg-[#F7F9FB] pl-9"
                                />
                            </div>

                            <div className="w-full xl:w-[210px]">
                                <Select
                                    value={statusFilter}
                                    onValueChange={setStatusFilter}
                                >
                                    <SelectTrigger className="h-11 bg-[#F7F9FB]">
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Status
                                        </SelectItem>

                                        {VARIATION_STATUSES.map((status) => (
                                            <SelectItem
                                                key={status}
                                                value={status}
                                            >
                                                {status}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={!selectedVariation}
                                    onClick={handleToolbarDetail}
                                    className="h-11"
                                >
                                    <FileText className="mr-2 h-4 w-4" />
                                    Detail
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={!selectedVariation}
                                    onClick={handleToolbarPrint}
                                    className="h-11"
                                >
                                    <Printer className="mr-2 h-4 w-4" />
                                    Print
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={!selectedVariation}
                                    onClick={handleToolbarPrint}
                                    className="h-11"
                                >
                                    <FileText className="mr-2 h-4 w-4" />
                                    PDF
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={!selectedVariation}
                                    onClick={handleToolbarCsv}
                                    className="h-11"
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    CSV
                                </Button>
                            </div>
                        </div>

                        {selectedVariation && (
                            <div className="mt-3 rounded-xl border border-[#B98A8A]/50 bg-[#FBF1F1] px-4 py-2 text-sm">
                                Selected:{" "}
                                <span className="font-bold text-[#9E4B4B]">
                                    {selectedVariation.variation_no}
                                </span>
                                {" — "}
                                {selectedVariation.variation_reason}
                            </div>
                        )}
                    </div>
                </section>

                {variationsQuery.isError && (
                    <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-800">
                        <h2 className="font-bold">
                            Variations could not be loaded
                        </h2>

                        <p className="mt-1 text-sm">
                            {
                                (
                                    variationsQuery.error as Error
                                ).message
                            }
                        </p>
                    </section>
                )}

                {lookupQuery.isError && (
                    <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-800">
                        <h2 className="font-bold">
                            Variation lookup data could not be
                            loaded
                        </h2>

                        <p className="mt-1 text-sm">
                            {
                                (
                                    lookupQuery.error as Error
                                ).message
                            }
                        </p>
                    </section>
                )}

                <section className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
                    <div className="grid grid-cols-12 border-b bg-[#F5DEDE] px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-700">
                        <div className="col-span-2">
                            Variation
                        </div>

                        <div className="col-span-3">
                            Customer / Project
                        </div>

                        <div className="col-span-2">
                            Site
                        </div>

                        <div className="col-span-2">
                            Reason
                        </div>

                        <div className="col-span-1 text-right">
                            Total
                        </div>

                        <div className="col-span-1 text-center">
                            Status
                        </div>

                        <div className="col-span-1 text-right">
                            Actions
                        </div>
                    </div>

                    {isInitialLoading ? (
                        <div className="flex items-center justify-center gap-2 p-10 text-slate-500">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Loading Variations...
                        </div>
                    ) : filteredVariations.length === 0 ? (
                        <div className="p-10 text-center text-slate-500">
                            No Variations found.
                        </div>
                    ) : (
                        filteredVariations.map(
                            (variation) => {
                                const site =
                                    siteMap.get(
                                        variation.project_site_id,
                                    );

                                return (
                                    <div
                                        key={variation.variation_id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() =>
                                            setSelectedVariationId(
                                                variation.variation_id,
                                            )
                                        }
                                        onKeyDown={(event) => {
                                            if (
                                                event.key === "Enter" ||
                                                event.key === " "
                                            ) {
                                                event.preventDefault();

                                                setSelectedVariationId(
                                                    variation.variation_id,
                                                );
                                            }
                                        }}
                                        className={[
                                            "grid cursor-pointer grid-cols-12 items-center border-b px-4 py-4 text-sm transition-colors last:border-b-0",
                                            selectedVariationId === variation.variation_id
                                                ? "bg-[#FBF1F1] ring-1 ring-inset ring-[#B98A8A]"
                                                : "hover:bg-slate-50",
                                        ].join(" ")}
                                    >
                                        <div className="col-span-2">
                                            <button
                                                type="button"
                                                className="font-bold text-[#9E4B4B] hover:underline"
                                                onClick={() =>
                                                    openDetailDialog(
                                                        variation,
                                                    )
                                                }
                                            >
                                                {
                                                    variation.variation_no
                                                }
                                            </button>

                                            <div className="text-xs text-slate-500">
                                                {formatDate(
                                                    variation.issue_date,
                                                )}
                                            </div>
                                        </div>

                                        <div className="col-span-3">
                                            <div className="font-medium">
                                                {customerMap.get(
                                                    variation.customer_id,
                                                )?.customer_name ??
                                                    "Unknown customer"}
                                            </div>

                                            <div className="text-xs text-slate-500">
                                                {projectMap.get(
                                                    variation.project_id,
                                                )?.project_name ??
                                                    "Unknown project"}
                                            </div>
                                        </div>

                                        <div className="col-span-2">
                                            <div>
                                                {site?.site_name ??
                                                    "Unknown site"}
                                            </div>

                                            <div className="text-xs text-slate-500">
                                                {site?.site_code ?? ""}
                                            </div>
                                        </div>

                                        <div className="col-span-2 line-clamp-2">
                                            {
                                                variation.variation_reason
                                            }
                                        </div>

                                        <div className="col-span-1 text-right font-semibold">
                                            {formatMoney(
                                                variation.total_amount,
                                            )}
                                        </div>

                                        <div className="col-span-1 text-center">
                                            <span
                                                className={[
                                                    "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                                                    getStatusClassName(
                                                        variation.variation_status,
                                                    ),
                                                ].join(" ")}
                                            >
                                                {
                                                    variation.variation_status
                                                }
                                            </span>
                                        </div>

                                        <div
                                            className="col-span-1 flex justify-end gap-1"
                                            onClick={(event) => event.stopPropagation()}
                                        >
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                title="View Variation"
                                                onClick={() =>
                                                    openDetailDialog(
                                                        variation,
                                                    )
                                                }
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>

                                            {variation.variation_status ===
                                                "Draft" &&
                                                hasPermission(
                                                    "variations.update_draft",
                                                ) && (
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="ghost"
                                                        title="Edit Draft"
                                                        onClick={() =>
                                                            openEditDialog(
                                                                variation,
                                                            )
                                                        }
                                                    >
                                                        <FileEdit className="h-4 w-4" />
                                                    </Button>
                                                )}
                                        </div>
                                    </div>
                                );
                            },
                        )
                    )}
                </section>

                <section className="space-y-3 lg:hidden">
                    {isInitialLoading ? (
                        <div className="flex items-center justify-center gap-2 rounded-2xl border bg-white p-8 text-slate-500">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Loading Variations...
                        </div>
                    ) : filteredVariations.length === 0 ? (
                        <div className="rounded-2xl border bg-white p-8 text-center text-slate-500">
                            No Variations found.
                        </div>
                    ) : (
                        filteredVariations.map(
                            (variation) => {
                                const site =
                                    siteMap.get(
                                        variation.project_site_id,
                                    );

                                return (
                                    <article
                                        key={variation.variation_id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() =>
                                            setSelectedVariationId(
                                                variation.variation_id,
                                            )
                                        }
                                        onKeyDown={(event) => {
                                            if (
                                                event.key === "Enter" ||
                                                event.key === " "
                                            ) {
                                                event.preventDefault();

                                                setSelectedVariationId(
                                                    variation.variation_id,
                                                );
                                            }
                                        }}
                                        className={[
                                            "cursor-pointer rounded-2xl border bg-white p-4 shadow-sm transition-colors",
                                            selectedVariationId === variation.variation_id
                                                ? "border-[#9E4B4B] bg-[#FBF1F1] ring-1 ring-[#9E4B4B]"
                                                : "border-slate-200",
                                        ].join(" ")}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <button
                                                type="button"
                                                className="text-left text-lg font-bold text-[#9E4B4B]"
                                                onClick={() =>
                                                    openDetailDialog(
                                                        variation,
                                                    )
                                                }
                                            >
                                                {
                                                    variation.variation_no
                                                }
                                            </button>

                                            <span
                                                className={[
                                                    "rounded-full px-2.5 py-1 text-xs font-semibold",
                                                    getStatusClassName(
                                                        variation.variation_status,
                                                    ),
                                                ].join(" ")}
                                            >
                                                {
                                                    variation.variation_status
                                                }
                                            </span>
                                        </div>

                                        <div className="mt-3 space-y-1 text-sm">
                                            <p className="font-medium">
                                                {customerMap.get(
                                                    variation.customer_id,
                                                )?.customer_name ??
                                                    "Unknown customer"}
                                            </p>

                                            <p className="text-slate-600">
                                                {projectMap.get(
                                                    variation.project_id,
                                                )?.project_name ??
                                                    "Unknown project"}
                                            </p>

                                            <p className="text-slate-600">
                                                {site?.site_name ??
                                                    "Unknown site"}
                                            </p>

                                            <p className="pt-2">
                                                {
                                                    variation.variation_reason
                                                }
                                            </p>
                                        </div>

                                        <div className="mt-4 flex items-center justify-between border-t pt-3">
                                            <span className="font-bold">
                                                {formatMoney(
                                                    variation.total_amount,
                                                )}
                                            </span>

                                            <div
                                                className="flex gap-2"
                                                onClick={(event) => event.stopPropagation()}
                                            >
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        openDetailDialog(
                                                            variation,
                                                        )
                                                    }
                                                >
                                                    View
                                                </Button>

                                                {variation.variation_status ===
                                                    "Draft" &&
                                                    hasPermission(
                                                        "variations.update_draft",
                                                    ) && (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            onClick={() =>
                                                                openEditDialog(
                                                                    variation,
                                                                )
                                                            }
                                                        >
                                                            Edit
                                                        </Button>
                                                    )}
                                            </div>
                                        </div>
                                    </article>
                                );
                            },
                        )
                    )}
                </section>
            </div>

            <Dialog
                open={showFormDialog}
                onOpenChange={(open) => {
                    if (!open) {
                        closeCreateEditDialog();
                    }
                }}
            >
                <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingVariation
                                ? `Edit ${editingVariation.variation_no}`
                                : "New Variation"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-5">
                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                            <SectionHeader
                                number="1"
                                title="Accepted Commercial Source"
                                description="Select the Accepted Quotation that this Variation changes."
                            />

                            <div className="grid gap-4 p-4 md:grid-cols-2">
                                <div className="md:col-span-2">
                                    <Label>
                                        Accepted Quotation{" "}
                                        <span className="text-rose-600">
                                            *
                                        </span>
                                    </Label>

                                    <Select
                                        value={
                                            headerForm.quotationId
                                        }
                                        disabled={Boolean(
                                            editingVariation,
                                        )}
                                        onValueChange={
                                            handleQuotationChange
                                        }
                                    >
                                        <SelectTrigger className="mt-1 h-11 bg-[#F7F9FB]">
                                            <SelectValue placeholder="Select Accepted Quotation" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            {quotations.map(
                                                (quotation) => {
                                                    const customer =
                                                        customerMap.get(
                                                            quotation.customer_id,
                                                        );

                                                    const site =
                                                        siteMap.get(
                                                            quotation.project_site_id,
                                                        );

                                                    return (
                                                        <SelectItem
                                                            key={
                                                                quotation.quotation_id
                                                            }
                                                            value={
                                                                quotation.quotation_id
                                                            }
                                                        >
                                                            {
                                                                quotation.quotation_no
                                                            }{" "}
                                                            —{" "}
                                                            {customer?.customer_name ??
                                                                "Customer"}{" "}
                                                            —{" "}
                                                            {site?.site_name ??
                                                                "Site"}
                                                        </SelectItem>
                                                    );
                                                },
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <ContextCard
                                    label="Customer"
                                    value={
                                        selectedCustomer?.customer_name
                                    }
                                />

                                <ContextCard
                                    label="Project"
                                    value={
                                        selectedProject?.project_name
                                    }
                                />

                                <ContextCard
                                    label="Active Site"
                                    value={
                                        selectedSite
                                            ? [
                                                selectedSite.site_code,
                                                selectedSite.site_name,
                                            ]
                                                .filter(Boolean)
                                                .join(" — ")
                                            : undefined
                                    }
                                />

                                <ContextCard
                                    label="Accepted Source"
                                    value={
                                        selectedQuotation
                                            ? selectedQuotation.accepted_revision_id
                                                ? "Accepted Quotation Revision"
                                                : "Accepted Base Quotation"
                                            : undefined
                                    }
                                />
                            </div>
                        </section>

                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                            <SectionHeader
                                number="2"
                                title="Variation Details"
                                description="Record the reason, issue date and customer-facing validity period."
                            />

                            <div className="grid gap-4 p-4 md:grid-cols-2">
                                <div className="md:col-span-2">
                                    <Label>
                                        Variation Reason{" "}
                                        <span className="text-rose-600">
                                            *
                                        </span>
                                    </Label>

                                    <Textarea
                                        value={
                                            headerForm.variationReason
                                        }
                                        onChange={(event) =>
                                            setHeaderForm(
                                                (currentHeader) => ({
                                                    ...currentHeader,

                                                    variationReason:
                                                        event.target.value,
                                                }),
                                            )
                                        }
                                        placeholder="Describe the commercial change"
                                        className="mt-1 min-h-24 bg-[#F7F9FB]"
                                    />
                                </div>

                                <div>
                                    <Label>
                                        Issue Date
                                    </Label>

                                    <Input
                                        type="date"
                                        value={
                                            headerForm.issueDate
                                        }
                                        onChange={(event) =>
                                            setHeaderForm(
                                                (currentHeader) => ({
                                                    ...currentHeader,

                                                    issueDate:
                                                        event.target.value,
                                                }),
                                            )
                                        }
                                        className="mt-1 h-11 bg-[#F7F9FB]"
                                    />
                                </div>

                                <div>
                                    <Label>
                                        Valid Until
                                    </Label>

                                    <Input
                                        type="date"
                                        value={
                                            headerForm.validUntil
                                        }
                                        onChange={(event) =>
                                            setHeaderForm(
                                                (currentHeader) => ({
                                                    ...currentHeader,

                                                    validUntil:
                                                        event.target.value,
                                                }),
                                            )
                                        }
                                        className="mt-1 h-11 bg-[#F7F9FB]"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <Label>
                                        Notes
                                    </Label>

                                    <Textarea
                                        value={
                                            headerForm.notes
                                        }
                                        onChange={(event) =>
                                            setHeaderForm(
                                                (currentHeader) => ({
                                                    ...currentHeader,

                                                    notes:
                                                        event.target.value,
                                                }),
                                            )
                                        }
                                        className="mt-1 min-h-20 bg-[#F7F9FB]"
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                            <div className="flex flex-col gap-3 bg-[#F5DEDE] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3">
                                    <StepNumber number="3" />

                                    <div>
                                        <h2 className="font-bold">
                                            Variation Lines
                                        </h2>

                                        <p className="text-xs text-slate-600">
                                            Areas are limited to the
                                            selected Project and Active
                                            Site.
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        setLineForms(
                                            (currentLines) => [
                                                ...currentLines,
                                                createEmptyLine(),
                                            ],
                                        )
                                    }
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Line
                                </Button>
                            </div>

                            <div className="space-y-4 p-4">
                                {lineForms.map(
                                    (line, index) => (
                                        <div
                                            key={line.clientId}
                                            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                        >
                                            <div className="mb-4 flex items-center justify-between gap-3">
                                                <h3 className="font-bold">
                                                    Line {index + 1}
                                                </h3>

                                                {lineForms.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-rose-700"
                                                        onClick={() =>
                                                            setLineForms(
                                                                (
                                                                    currentLines,
                                                                ) =>
                                                                    currentLines.filter(
                                                                        (
                                                                            currentLine,
                                                                        ) =>
                                                                            currentLine.clientId !==
                                                                            line.clientId,
                                                                    ),
                                                            )
                                                        }
                                                    >
                                                        Remove
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                                <div className="xl:col-span-2">
                                                    <Label>
                                                        Product
                                                    </Label>

                                                    <Select
                                                        value={
                                                            line.productId ||
                                                            "__manual__"
                                                        }
                                                        onValueChange={(
                                                            value,
                                                        ) =>
                                                            handleProductChange(
                                                                line.clientId,
                                                                value,
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="mt-1 h-11 bg-[#F7F9FB]">
                                                            <SelectValue placeholder="Select Product" />
                                                        </SelectTrigger>

                                                        <SelectContent>
                                                            <SelectItem value="__manual__">
                                                                Manual / Non-product
                                                                line
                                                            </SelectItem>

                                                            {products.map(
                                                                (product) => (
                                                                    <SelectItem
                                                                        key={
                                                                            product.product_id
                                                                        }
                                                                        value={
                                                                            product.product_id
                                                                        }
                                                                    >
                                                                        {
                                                                            product.product_code
                                                                        }{" "}
                                                                        —{" "}
                                                                        {
                                                                            product.product_name
                                                                        }
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="xl:col-span-2">
                                                    <Label>
                                                        Project Area
                                                    </Label>

                                                    <Select
                                                        value={
                                                            line.projectAreaId ||
                                                            "__none__"
                                                        }
                                                        disabled={
                                                            !selectedQuotation
                                                        }
                                                        onValueChange={(
                                                            value,
                                                        ) =>
                                                            updateLineForm(
                                                                line.clientId,
                                                                {
                                                                    projectAreaId:
                                                                        value ===
                                                                            "__none__"
                                                                            ? ""
                                                                            : value,
                                                                },
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="mt-1 h-11 bg-[#F7F9FB]">
                                                            <SelectValue placeholder="Select Area" />
                                                        </SelectTrigger>

                                                        <SelectContent>
                                                            <SelectItem value="__none__">
                                                                No specific Area
                                                            </SelectItem>

                                                            {availableAreas.map(
                                                                (area) => (
                                                                    <SelectItem
                                                                        key={
                                                                            area.area_id
                                                                        }
                                                                        value={
                                                                            area.area_id
                                                                        }
                                                                    >
                                                                        {area.area_code
                                                                            ? `${area.area_code} — `
                                                                            : ""}

                                                                        {
                                                                            area.area_name
                                                                        }{" "}
                                                                        (
                                                                        {
                                                                            area.area_status
                                                                        }
                                                                        )
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="md:col-span-2 xl:col-span-4">
                                                    <Label>
                                                        Description{" "}
                                                        <span className="text-rose-600">
                                                            *
                                                        </span>
                                                    </Label>

                                                    <Input
                                                        value={
                                                            line.description
                                                        }
                                                        onChange={(event) =>
                                                            updateLineForm(
                                                                line.clientId,
                                                                {
                                                                    description:
                                                                        event.target
                                                                            .value,
                                                                },
                                                            )
                                                        }
                                                        className="mt-1 h-11 bg-[#F7F9FB]"
                                                    />
                                                </div>

                                                <NumberField
                                                    label="Quantity"
                                                    value={
                                                        line.quantity
                                                    }
                                                    onChange={(value) =>
                                                        updateLineForm(
                                                            line.clientId,
                                                            {
                                                                quantity:
                                                                    value,
                                                            },
                                                        )
                                                    }
                                                />

                                                <UomSelectField
                                                    label="Sales UOM"
                                                    value={
                                                        line.salesUomCode
                                                    }
                                                    uoms={uoms}
                                                    onChange={(value) =>
                                                        updateLineForm(
                                                            line.clientId,
                                                            {
                                                                salesUomCode:
                                                                    value,
                                                            },
                                                        )
                                                    }
                                                />

                                                <UomSelectField
                                                    label="Base UOM"
                                                    value={
                                                        line.baseUomCode
                                                    }
                                                    uoms={uoms}
                                                    onChange={(value) =>
                                                        updateLineForm(
                                                            line.clientId,
                                                            {
                                                                baseUomCode:
                                                                    value,
                                                            },
                                                        )
                                                    }
                                                />

                                                <NumberField
                                                    label="Conversion Factor"
                                                    value={
                                                        line.conversionFactor
                                                    }
                                                    onChange={(value) =>
                                                        updateLineForm(
                                                            line.clientId,
                                                            {
                                                                conversionFactor:
                                                                    value,
                                                            },
                                                        )
                                                    }
                                                />

                                                <NumberField
                                                    label="Unit Price"
                                                    value={
                                                        line.unitPrice
                                                    }
                                                    onChange={(value) =>
                                                        updateLineForm(
                                                            line.clientId,
                                                            {
                                                                unitPrice:
                                                                    value,
                                                            },
                                                        )
                                                    }
                                                />

                                                <NumberField
                                                    label="Discount %"
                                                    value={
                                                        line.discountPercent
                                                    }
                                                    onChange={(value) =>
                                                        updateLineForm(
                                                            line.clientId,
                                                            {
                                                                discountPercent:
                                                                    value,
                                                            },
                                                        )
                                                    }
                                                />

                                                <NumberField
                                                    label="Tax %"
                                                    value={
                                                        line.taxRate
                                                    }
                                                    onChange={(value) =>
                                                        updateLineForm(
                                                            line.clientId,
                                                            {
                                                                taxRate:
                                                                    value,
                                                            },
                                                        )
                                                    }
                                                />

                                                {hasPermission(
                                                    "variations.view_cost",
                                                ) && (
                                                        <NumberField
                                                            label="Cost Price"
                                                            value={
                                                                line.costPrice
                                                            }
                                                            onChange={(
                                                                value,
                                                            ) =>
                                                                updateLineForm(
                                                                    line.clientId,
                                                                    {
                                                                        costPrice:
                                                                            value,
                                                                    },
                                                                )
                                                            }
                                                        />
                                                    )}

                                                <div className="md:col-span-2 xl:col-span-4">
                                                    <Label>
                                                        Line Notes
                                                    </Label>

                                                    <Input
                                                        value={line.notes}
                                                        onChange={(event) =>
                                                            updateLineForm(
                                                                line.clientId,
                                                                {
                                                                    notes:
                                                                        event.target
                                                                            .value,
                                                                },
                                                            )
                                                        }
                                                        className="mt-1 h-11 bg-[#F7F9FB]"
                                                    />
                                                </div>

                                                <CheckboxCard
                                                    label="Optional line"
                                                    checked={
                                                        line.isOptional
                                                    }
                                                    onChange={(checked) =>
                                                        updateLineForm(
                                                            line.clientId,
                                                            {
                                                                isOptional:
                                                                    checked,
                                                            },
                                                        )
                                                    }
                                                />

                                                <CheckboxCard
                                                    label="Allow fractional quantity"
                                                    checked={
                                                        line.allowFractionalQuantity
                                                    }
                                                    onChange={(checked) =>
                                                        updateLineForm(
                                                            line.clientId,
                                                            {
                                                                allowFractionalQuantity:
                                                                    checked,
                                                            },
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>
                        </section>

                        <section className="rounded-2xl border border-[#B98A8A] bg-[#FBF1F1] p-4">
                            <p className="mb-3 text-xs text-slate-600">
                                Preview only. Final totals are
                                recalculated and stored by the
                                atomic backend RPC.
                            </p>

                            <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                                <SummaryCard
                                    label="Subtotal"
                                    value={formatMoney(
                                        calculatedTotals.subtotal,
                                    )}
                                />

                                <SummaryCard
                                    label="Discount"
                                    value={formatMoney(
                                        calculatedTotals.discount,
                                    )}
                                />

                                <SummaryCard
                                    label="Tax"
                                    value={formatMoney(
                                        calculatedTotals.tax,
                                    )}
                                />

                                <SummaryCard
                                    label="Total"
                                    value={formatMoney(
                                        calculatedTotals.total,
                                    )}
                                    strong
                                />
                            </div>
                        </section>

                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={saveIsPending}
                                onClick={
                                    closeCreateEditDialog
                                }
                            >
                                Cancel
                            </Button>

                            <Button
                                type="button"
                                disabled={saveIsPending}
                                className="bg-[#9E4B4B] hover:bg-[#873f3f]"
                                onClick={() =>
                                    saveVariationMutation.mutate()
                                }
                            >
                                {saveIsPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}

                                {editingVariation
                                    ? "Save Draft Variation"
                                    : "Create Draft Variation"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={showDetailDialog}
                onOpenChange={(open) => {
                    setShowDetailDialog(open);

                    if (!open) {
                        setViewingVariation(null);
                    }
                }}
            >
                <DialogContent className="variation-print-dialog max-h-[92vh] max-w-6xl overflow-y-auto print:max-h-none print:max-w-none print:overflow-visible print:border-0 print:shadow-none">
                    {viewingVariation && (
                        <>
                            <DialogHeader className="print:hidden">
                                <DialogTitle>
                                    {
                                        viewingVariation.variation_no
                                    }
                                </DialogTitle>
                            </DialogHeader>

                            <div id="variation-detail-report" className="variation-print-report space-y-5">
                                <section className="variation-print-header variation-print-block overflow-hidden rounded-lg border border-[#B98A8A]">
                                    <div className="flex flex-col gap-3 bg-[#9E4B4B] px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h2 className="text-xl font-bold">
                                                REDS Timber Flooring
                                            </h2>

                                            <p className="text-sm text-white/80">
                                                Variation Record —{" "}
                                                {
                                                    viewingVariation.variation_no
                                                }
                                            </p>
                                        </div>

                                        <span
                                            className={[
                                                "variation-status-badge w-fit rounded-full px-3 py-1 text-xs font-bold",
                                                `variation-status-${viewingVariation.variation_status.toLowerCase()}`,
                                                getStatusClassName(
                                                    viewingVariation.variation_status,
                                                ),
                                            ].join(" ")}
                                        >
                                            {
                                                viewingVariation.variation_status
                                            }
                                        </span>
                                    </div>

                                    <div className="variation-print-context grid gap-px bg-[#B98A8A] sm:grid-cols-2 lg:grid-cols-4">
                                        <ReportCell
                                            label="Customer"
                                            value={
                                                customerMap.get(
                                                    viewingVariation.customer_id,
                                                )?.customer_name
                                            }
                                        />

                                        <ReportCell
                                            label="Project"
                                            value={
                                                projectMap.get(
                                                    viewingVariation.project_id,
                                                )?.project_name
                                            }
                                        />

                                        <ReportCell
                                            label="Site"
                                            value={
                                                siteMap.get(
                                                    viewingVariation.project_site_id,
                                                )?.site_name
                                            }
                                        />

                                        <ReportCell
                                            label="Accepted Quotation"
                                            value={
                                                quotationMap.get(
                                                    viewingVariation.quotation_id,
                                                )?.quotation_no
                                            }
                                        />

                                        <ReportCell
                                            label="Issue Date"
                                            value={formatDate(
                                                viewingVariation.issue_date,
                                            )}
                                        />

                                        <ReportCell
                                            label="Valid Until"
                                            value={formatDate(
                                                viewingVariation.valid_until,
                                            )}
                                        />

                                        <ReportCell
                                            label="Variation Reason"
                                            value={
                                                viewingVariation.variation_reason
                                            }
                                            wide
                                        />
                                    </div>
                                </section>

                                <section className="variation-print-lines overflow-hidden rounded-lg border border-[#B98A8A]">
                                    <div className="variation-section-title bg-[#F5DEDE] px-4 py-3 font-bold text-[#111827]">
                                        Variation Lines
                                    </div>

                                    {detailLinesQuery.isLoading ? (
                                        <div className="flex items-center gap-2 p-6 text-slate-500">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Loading lines...
                                        </div>
                                    ) : detailLinesQuery.isError ? (
                                        <div className="p-6 text-rose-700">
                                            {
                                                (
                                                    detailLinesQuery.error as Error
                                                ).message
                                            }
                                        </div>
                                    ) : detailLines.length === 0 ? (
                                        <div className="p-6 text-center text-slate-500">
                                            No active Variation lines
                                            found.
                                        </div>
                                    ) : (
                                        <div className="variation-print-table-wrap overflow-x-auto">
                                            <table className="variation-print-table w-full min-w-[950px] text-sm">
                                                <thead className="bg-[#9E4B4B] text-white">
                                                    <tr>
                                                        <th className="px-3 py-3 text-left">
                                                            Line
                                                        </th>

                                                        <th className="px-3 py-3 text-left">
                                                            Area
                                                        </th>

                                                        <th className="px-3 py-3 text-left">
                                                            Product /
                                                            Description
                                                        </th>

                                                        <th className="px-3 py-3 text-right">
                                                            Qty
                                                        </th>

                                                        <th className="px-3 py-3 text-left">
                                                            UOM
                                                        </th>

                                                        <th className="px-3 py-3 text-right">
                                                            Unit Price
                                                        </th>

                                                        <th className="px-3 py-3 text-right">
                                                            Discount
                                                        </th>

                                                        <th className="px-3 py-3 text-right">
                                                            Tax
                                                        </th>

                                                        <th className="px-3 py-3 text-right">
                                                            Total
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {detailLines.map(
                                                        (line) => {
                                                            const product =
                                                                line.product_id
                                                                    ? productMap.get(
                                                                        line.product_id,
                                                                    )
                                                                    : undefined;

                                                            const area =
                                                                line.project_area_id
                                                                    ? areaMap.get(
                                                                        line.project_area_id,
                                                                    )
                                                                    : undefined;

                                                            return (
                                                                <tr
                                                                    key={
                                                                        line.variation_line_id
                                                                    }
                                                                    className="border-b border-slate-200 align-top odd:bg-white even:bg-[#FBF1F1]"
                                                                >
                                                                    <td className="px-3 py-3">
                                                                        {
                                                                            line.line_no
                                                                        }
                                                                    </td>

                                                                    <td className="px-3 py-3">
                                                                        {area?.area_name ??
                                                                            "—"}
                                                                    </td>

                                                                    <td className="px-3 py-3">
                                                                        {product && (
                                                                            <div className="variation-line-product font-semibold text-[#111827]">
                                                                                {
                                                                                    product.product_code
                                                                                }{" "}
                                                                                —{" "}
                                                                                {
                                                                                    product.product_name
                                                                                }
                                                                            </div>
                                                                        )}

                                                                        <div className="variation-line-description text-[#374151]">
                                                                            {
                                                                                line.description
                                                                            }
                                                                        </div>

                                                                        {line.is_optional && (
                                                                            <span className="mt-1 inline-flex rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                                                                                Optional
                                                                            </span>
                                                                        )}
                                                                    </td>

                                                                    <td className="px-3 py-3 text-right">
                                                                        {
                                                                            line.quantity
                                                                        }
                                                                    </td>

                                                                    <td className="px-3 py-3">
                                                                        {line.sales_uom_code ??
                                                                            line.unit_of_measure ??
                                                                            "—"}
                                                                    </td>

                                                                    <td className="px-3 py-3 text-right">
                                                                        {formatMoney(
                                                                            line.unit_price,
                                                                        )}
                                                                    </td>

                                                                    <td className="px-3 py-3 text-right">
                                                                        {
                                                                            line.discount_percent
                                                                        }
                                                                        %
                                                                    </td>

                                                                    <td className="px-3 py-3 text-right">
                                                                        {
                                                                            line.tax_rate
                                                                        }
                                                                        %
                                                                    </td>

                                                                    <td className="px-3 py-3 text-right font-bold text-[#111827]">
                                                                        {formatMoney(
                                                                            line.line_total,
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        },
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </section>

                                <section className="variation-print-totals variation-print-block grid gap-px overflow-hidden rounded-lg border border-[#B98A8A] bg-[#B98A8A] sm:grid-cols-4">
                                    <ReportCell
                                        label="Subtotal"
                                        value={formatMoney(
                                            viewingVariation.subtotal,
                                        )}
                                    />

                                    <ReportCell
                                        label="Discount"
                                        value={formatMoney(
                                            viewingVariation.discount_amount,
                                        )}
                                    />

                                    <ReportCell
                                        label="Tax"
                                        value={formatMoney(
                                            viewingVariation.tax_amount,
                                        )}
                                    />

                                    <ReportCell
                                        label="Total"
                                        value={formatMoney(
                                            viewingVariation.total_amount,
                                        )}
                                        strong
                                    />
                                </section>

                                {viewingVariation.notes && (
                                    <section className="variation-notes variation-print-block rounded-lg border border-[#B98A8A] bg-[#FBF1F1] p-4">
                                        <h3 className="font-bold">
                                            Notes
                                        </h3>

                                        <p className="mt-2 whitespace-pre-wrap text-sm">
                                            {
                                                viewingVariation.notes
                                            }
                                        </p>
                                    </section>
                                )}

                                {viewingVariation.rejection_reason && (
                                    <section className="variation-rejection variation-print-block rounded-lg border border-[#FCA5A5] bg-[#FEE2E2] p-4">
                                        <h3 className="font-bold text-rose-800">
                                            Rejection Reason
                                        </h3>

                                        <p className="mt-2 whitespace-pre-wrap text-sm text-rose-800">
                                            {
                                                viewingVariation.rejection_reason
                                            }
                                        </p>
                                    </section>
                                )}

                                {viewingVariation.cancellation_reason && (
                                    <section className="variation-cancellation variation-print-block rounded-lg border border-[#9CA3AF] bg-[#F3F4F6] p-4">
                                        <h3 className="font-bold text-zinc-800">
                                            Cancellation Reason
                                        </h3>

                                        <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-800">
                                            {
                                                viewingVariation.cancellation_reason
                                            }
                                        </p>
                                    </section>
                                )}

                                <div className="flex flex-wrap justify-end gap-2 print:hidden">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            window.print()
                                        }
                                    >
                                        <Printer className="mr-2 h-4 w-4" />
                                        Print / PDF
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={
                                            detailLinesQuery.isLoading
                                        }
                                        onClick={() =>
                                            exportVariationCsv(
                                                viewingVariation,
                                                detailLines,
                                            )
                                        }
                                    >
                                        <Download className="mr-2 h-4 w-4" />
                                        CSV
                                    </Button>

                                    {viewingVariation.variation_status ===
                                        "Draft" &&
                                        hasPermission(
                                            "variations.update_draft",
                                        ) && (
                                            <Button
                                                type="button"
                                                onClick={() =>
                                                    openEditDialog(
                                                        viewingVariation,
                                                    )
                                                }
                                            >
                                                <FileEdit className="mr-2 h-4 w-4" />
                                                Edit Draft
                                            </Button>
                                        )}

                                    {viewingVariation.variation_status ===
                                        "Draft" &&
                                        hasPermission(
                                            "variations.send",
                                        ) && (
                                            <Button
                                                type="button"
                                                disabled={
                                                    workflowIsPending
                                                }
                                                className="bg-blue-700 hover:bg-blue-800"
                                                onClick={() =>
                                                    sendVariationMutation.mutate(
                                                        viewingVariation,
                                                    )
                                                }
                                            >
                                                <Send className="mr-2 h-4 w-4" />
                                                Send
                                            </Button>
                                        )}

                                    {viewingVariation.variation_status ===
                                        "Sent" &&
                                        hasPermission(
                                            "variations.accept",
                                        ) && (
                                            <Button
                                                type="button"
                                                disabled={
                                                    workflowIsPending
                                                }
                                                className="bg-emerald-700 hover:bg-emerald-800"
                                                onClick={() => {
                                                    setAcceptForm({
                                                        requiredByDate:
                                                            addDays(7),

                                                        materialRequirementNotes:
                                                            `Generated from Accepted Variation ${viewingVariation.variation_no}`,
                                                    });

                                                    setAcceptingVariation(
                                                        viewingVariation,
                                                    );
                                                }}
                                            >
                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                Accept & Create MR
                                            </Button>
                                        )}

                                    {viewingVariation.variation_status ===
                                        "Sent" &&
                                        hasPermission(
                                            "variations.reject",
                                        ) && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                disabled={
                                                    workflowIsPending
                                                }
                                                className="border-rose-300 text-rose-700"
                                                onClick={() => {
                                                    setWorkflowReason("");

                                                    setRejectCancelDialog(
                                                        {
                                                            mode: "reject",

                                                            variation:
                                                                viewingVariation,
                                                        },
                                                    );
                                                }}
                                            >
                                                <XCircle className="mr-2 h-4 w-4" />
                                                Reject
                                            </Button>
                                        )}

                                    {[
                                        "Draft",
                                        "Sent",
                                    ].includes(
                                        viewingVariation.variation_status,
                                    ) &&
                                        hasPermission(
                                            "variations.cancel",
                                        ) && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                disabled={
                                                    workflowIsPending
                                                }
                                                onClick={() => {
                                                    setWorkflowReason("");

                                                    setRejectCancelDialog(
                                                        {
                                                            mode: "cancel",

                                                            variation:
                                                                viewingVariation,
                                                        },
                                                    );
                                                }}
                                            >
                                                Cancel Variation
                                            </Button>
                                        )}
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={Boolean(acceptingVariation)}
                onOpenChange={(open) => {
                    if (!open) {
                        setAcceptingVariation(null);
                    }
                }}
            >
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>
                            Accept Variation and Create Material
                            Requirement
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                            Accepting this Variation will create a new
                            additional Material Requirement. Existing
                            Material Requirements will not be modified.
                        </div>

                        <div>
                            <Label>
                                Required By Date
                            </Label>

                            <Input
                                type="date"
                                value={
                                    acceptForm.requiredByDate
                                }
                                onChange={(event) =>
                                    setAcceptForm(
                                        (currentForm) => ({
                                            ...currentForm,

                                            requiredByDate:
                                                event.target.value,
                                        }),
                                    )
                                }
                                className="mt-1 h-11 bg-[#F7F9FB]"
                            />
                        </div>

                        <div>
                            <Label>
                                Material Requirement Notes
                            </Label>

                            <Textarea
                                value={
                                    acceptForm.materialRequirementNotes
                                }
                                onChange={(event) =>
                                    setAcceptForm(
                                        (currentForm) => ({
                                            ...currentForm,

                                            materialRequirementNotes:
                                                event.target.value,
                                        }),
                                    )
                                }
                                className="mt-1 min-h-28 bg-[#F7F9FB]"
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={
                                    acceptVariationMutation.isPending
                                }
                                onClick={() =>
                                    setAcceptingVariation(null)
                                }
                            >
                                Back
                            </Button>

                            <Button
                                type="button"
                                disabled={
                                    acceptVariationMutation.isPending ||
                                    !acceptingVariation
                                }
                                className="bg-emerald-700 hover:bg-emerald-800"
                                onClick={() => {
                                    if (!acceptingVariation) {
                                        return;
                                    }

                                    acceptVariationMutation.mutate({
                                        variation:
                                            acceptingVariation,

                                        form:
                                            acceptForm,
                                    });
                                }}
                            >
                                {acceptVariationMutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}

                                Confirm Acceptance
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={Boolean(rejectCancelDialog)}
                onOpenChange={(open) => {
                    if (!open) {
                        setRejectCancelDialog(null);
                        setWorkflowReason("");
                    }
                }}
            >
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {rejectCancelDialog?.mode ===
                                "reject"
                                ? "Reject Variation"
                                : "Cancel Variation"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label>
                                {rejectCancelDialog?.mode ===
                                    "reject"
                                    ? "Rejection Reason"
                                    : "Cancellation Reason"}{" "}
                                <span className="text-rose-600">
                                    *
                                </span>
                            </Label>

                            <Textarea
                                value={workflowReason}
                                onChange={(event) =>
                                    setWorkflowReason(
                                        event.target.value,
                                    )
                                }
                                className="mt-1 min-h-28 bg-[#F7F9FB]"
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={workflowIsPending}
                                onClick={() => {
                                    setRejectCancelDialog(null);
                                    setWorkflowReason("");
                                }}
                            >
                                Back
                            </Button>

                            <Button
                                type="button"
                                disabled={workflowIsPending}
                                className={
                                    rejectCancelDialog?.mode ===
                                        "reject"
                                        ? "bg-rose-700 hover:bg-rose-800"
                                        : "bg-slate-800 hover:bg-slate-900"
                                }
                                onClick={() => {
                                    if (!rejectCancelDialog) {
                                        return;
                                    }

                                    if (
                                        rejectCancelDialog.mode ===
                                        "reject"
                                    ) {
                                        rejectVariationMutation.mutate(
                                            {
                                                variation:
                                                    rejectCancelDialog.variation,

                                                reason:
                                                    workflowReason,
                                            },
                                        );

                                        return;
                                    }

                                    cancelVariationMutation.mutate(
                                        {
                                            variation:
                                                rejectCancelDialog.variation,

                                            reason:
                                                workflowReason,
                                        },
                                    );
                                }}
                            >
                                {workflowIsPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}

                                Confirm
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

const StepNumber = ({
    number,
}: {
    number: string;
}) => (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#9E4B4B] text-sm font-bold text-white">
        {number}
    </span>
);

const SectionHeader = ({
    number,
    title,
    description,
}: {
    number: string;
    title: string;
    description: string;
}) => (
    <div className="flex items-center gap-3 bg-[#F5DEDE] px-4 py-3">
        <StepNumber number={number} />

        <div>
            <h2 className="font-bold">
                {title}
            </h2>

            <p className="text-xs text-slate-600">
                {description}
            </p>
        </div>
    </div>
);

const ContextCard = ({
    label,
    value,
}: {
    label: string;
    value?: string;
}) => (
    <div className="rounded-xl border border-slate-200 bg-[#FBF1F1] p-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
        </div>

        <div className="mt-1 font-medium">
            {value ||
                "Select an Accepted Quotation"}
        </div>
    </div>
);

const NumberField = ({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) => (
    <div>
        <Label>
            {label}
        </Label>

        <Input
            type="number"
            min="0"
            step="any"
            value={value}
            onChange={(event) =>
                onChange(event.target.value)
            }
            className="mt-1 h-11 bg-[#F7F9FB]"
        />
    </div>
);

const UomSelectField = ({
    label,
    value,
    uoms,
    onChange,
}: {
    label: string;
    value: string;
    uoms: UomRow[];
    onChange: (value: string) => void;
}) => (
    <div>
        <Label>
            {label}
        </Label>

        <Select
            value={value}
            onValueChange={onChange}
        >
            <SelectTrigger className="mt-1 h-11 bg-[#F7F9FB]">
                <SelectValue
                    placeholder={`Select ${label}`}
                />
            </SelectTrigger>

            <SelectContent>
                {uoms.map((uom) => (
                    <SelectItem
                        key={uom.uom_code}
                        value={uom.uom_code}
                    >
                        {uom.uom_code} —{" "}
                        {uom.uom_name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    </div>
);

const CheckboxCard = ({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) => (
    <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
        <input
            type="checkbox"
            checked={checked}
            onChange={(event) =>
                onChange(event.target.checked)
            }
        />

        <span className="text-sm">
            {label}
        </span>
    </label>
);

const SummaryCard = ({
    label,
    value,
    strong = false,
}: {
    label: string;
    value: string;
    strong?: boolean;
}) => (
    <div className="rounded-xl bg-white p-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
        </div>

        <div
            className={[
                "mt-1 text-right",
                strong
                    ? "text-lg font-bold text-[#9E4B4B]"
                    : "font-semibold",
            ].join(" ")}
        >
            {value}
        </div>
    </div>
);

const ReportCell = ({
    label,
    value,
    wide = false,
    strong = false,
}: {
    label: string;
    value?: string | null;
    wide?: boolean;
    strong?: boolean;
}) => (
    <div
        className={[
            "variation-report-cell bg-[#FBF1F1] p-4",
            strong
                ? "variation-report-cell-strong"
                : "",
            wide
                ? "sm:col-span-2 lg:col-span-2"
                : "",
        ].join(" ")}
    >
        <div className="variation-report-label text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
            {label}
        </div>

        <div
            className={[
                "variation-report-value mt-1 text-[#111827]",
                strong
                    ? "text-lg font-bold text-[#9E4B4B]"
                    : "font-medium",
            ].join(" ")}
        >
            {value || "—"}
        </div>
    </div>
);

export default Variations;
