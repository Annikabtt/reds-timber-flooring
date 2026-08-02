import { useMemo } from "react";
import {
    AlertTriangle,
    Boxes,
    CircleDollarSign,
    Database,
    Loader2,
    PackageCheck,
    Ruler,
    Tags,
    Truck,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ActiveStatusBadge } from "@/components/common/ActiveStatusBadge";
import type { AppRole } from "@/lib/roles";

const db = supabase as any;

type ProductDetailsDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    productId: string | null;
    role: AppRole;
};

type ProductDetailsData = {
    product: any;
    coverages: any[];
    attributes: any[];
    codeIdentity: any | null;
};

type ProductUnitComparisonRow = {
    product_id?: string;
    product_code: string;
    product_name: string;
    display_order: number;
    uom_code: string;
    conversion_to_base: number;
    next_smaller_uom_code: string | null;
    units_per_next_smaller: number | null;
    base_uom_code: string;
    is_purchase_unit: boolean;
    is_request_unit: boolean;
    is_sales_unit: boolean;
    is_stock_unit: boolean;
    coverage_basis_quantity: number | null;
    coverage_quantity: number | null;
    coverage_uom_code: string | null;
};

type ProductPricingPermissions = {
    can_view_sales_prices: boolean;
    can_view_supplier_cost: boolean;
    can_view_last_purchase_price: boolean;
    can_view_average_cost: boolean;
    can_manage_sales_prices: boolean;
    can_manage_supplier_cost: boolean;
};

type ProductPricingSummary = {
    product: {
        product_id: string;
        product_code: string;
        product_name: string;
        base_uom_code: string | null;
    };
    permissions: ProductPricingPermissions;
    sales_prices: Array<{
        price_book?: Record<string, unknown> | null;
        price_book_line?: Record<string, unknown> | null;
    }>;
    supplier_links: Array<Record<string, unknown>>;
    average_cost: {
        base_uom_code: string | null;
        costed_quantity: number | null;
        total_stock_value: number | null;
        weighted_average_unit_cost: number | null;
    } | null;
};

const EMPTY_PRICING_PERMISSIONS: ProductPricingPermissions = {
    can_view_sales_prices: false,
    can_view_supplier_cost: false,
    can_view_last_purchase_price: false,
    can_view_average_cost: false,
    can_manage_sales_prices: false,
    can_manage_supplier_cost: false,
};

const formatNumber = (value: unknown, maximumFractionDigits = 4) => {
    if (value === null || value === undefined || value === "") return "-";

    const number = Number(value);
    if (!Number.isFinite(number)) return "-";

    return new Intl.NumberFormat("en-AU", {
        maximumFractionDigits,
    }).format(number);
};

const formatCurrency = (
    value: unknown,
    currency = "AUD",
    uomCode?: string | null,
) => {
    if (value === null || value === undefined || value === "") return "-";

    const number = Number(value);
    if (!Number.isFinite(number)) return "-";

    const formatted = new Intl.NumberFormat("en-AU", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
    }).format(number);

    return uomCode ? `${formatted} / ${uomCode}` : formatted;
};

const formatDate = (value: unknown) => {
    if (typeof value !== "string" || !value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("en-AU", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
};

const readText = (
    record: Record<string, unknown> | null | undefined,
    key: string,
) => {
    const value = record?.[key];
    return typeof value === "string" && value.trim() ? value : null;
};

const readNumber = (
    record: Record<string, unknown> | null | undefined,
    key: string,
) => {
    const value = record?.[key];

    if (value === null || value === undefined || value === "") {
        return null;
    }

    const number = Number(value);
    return Number.isFinite(number) ? number : null;
};

const readBoolean = (
    record: Record<string, unknown> | null | undefined,
    key: string,
) => record?.[key] === true;

const Section = ({
    icon: Icon,
    title,
    helper,
    children,
}: {
    icon: typeof Boxes;
    title: string;
    helper?: string;
    children: React.ReactNode;
}) => (
    <section className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
        <div className="flex items-start gap-3 border-b border-[#E5E7EB] bg-[#F5DEDE] px-4 py-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/80">
                <Icon className="h-5 w-5 text-[#9E4B4B]" />
            </span>
            <div className="min-w-0">
                <h3 className="font-bold text-slate-900">{title}</h3>
                {helper ? (
                    <p className="mt-0.5 text-xs leading-5 text-slate-600">
                        {helper}
                    </p>
                ) : null}
            </div>
        </div>
        <div className="p-4 sm:p-5">{children}</div>
    </section>
);

const InfoItem = ({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) => (
    <div className="rounded-xl border border-[#E5E7EB] bg-[#F7F9FB] p-3">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <div className="mt-1 break-words text-sm font-semibold text-slate-900">
            {value ?? "-"}
        </div>
    </div>
);

const EmptyState = ({ text }: { text: string }) => (
    <div className="rounded-xl border border-dashed border-[#D1D5DB] bg-[#F7F9FB] px-4 py-6 text-center text-sm text-slate-500">
        {text}
    </div>
);

const PermissionNotice = ({ text }: { text: string }) => (
    <div className="rounded-xl border border-[#E5E7EB] bg-[#F7F9FB] px-4 py-3 text-sm text-slate-600">
        {text}
    </div>
);

export function ProductDetailsDialog({
    open,
    onOpenChange,
    productId,
    role,
}: ProductDetailsDialogProps) {
    const canViewCodeIdentity =
        role === "admin" ||
        role === "manager" ||
        role === "project_manager";

    const canViewAudit = role === "admin";

    const detailsQuery = useQuery({
        queryKey: ["product-details", "core", productId, role],
        enabled: open && Boolean(productId),
        queryFn: async (): Promise<ProductDetailsData> => {
            if (!productId) throw new Error("Product ID is required.");

            const [
                productResult,
                coveragesResult,
                attributesResult,
                codeIdentityResult,
            ] = await Promise.all([
                db
                    .from("products")
                    .select(`
                        product_id,
                        product_code,
                        product_name,
                        product_type,
                        description,
                        base_uom_code,
                        default_purchase_uom_code,
                        default_request_uom_code,
                        default_sales_uom_code,
                        default_waste_percent,
                        uses_coverage,
                        is_stock_item,
                        is_service_item,
                        variant_name,
                        variant_description,
                        is_active,
                        created_at,
                        updated_at,
                        product_categories(category_code,category_name)
                    `)
                    .eq("product_id", productId)
                    .eq("is_deleted", false)
                    .single(),
                db
                    .from("product_coverages")
                    .select(`
                        product_coverage_id,
                        source_quantity,
                        source_uom_code,
                        coverage_quantity,
                        coverage_uom_code,
                        minimum_coverage,
                        maximum_coverage,
                        is_estimate,
                        is_default,
                        notes,
                        sort_order
                    `)
                    .eq("product_id", productId)
                    .eq("is_deleted", false)
                    .eq("is_active", true)
                    .order("is_default", { ascending: false })
                    .order("sort_order"),
                db
                    .from("product_attribute_values")
                    .select(`
                        product_attribute_value_id,
                        value_text,
                        value_number,
                        value_boolean,
                        value_date,
                        selected_option_id,
                        product_attribute_definitions(
                            attribute_id,
                            attribute_code,
                            attribute_name,
                            data_type,
                            unit_uom_code,
                            sort_order
                        ),
                        product_attribute_options(
                            attribute_option_id,
                            option_label
                        ),
                        product_attribute_value_options(
                            attribute_option_id,
                            product_attribute_options(
                                attribute_option_id,
                                option_label,
                                sort_order
                            )
                        )
                    `)
                    .eq("product_id", productId)
                    .eq("is_deleted", false),
                canViewCodeIdentity
                    ? db
                          .from("product_code_variant_registry")
                          .select(`
                              full_product_code,
                              full_category_code,
                              type_code,
                              size_token,
                              colour_code,
                              variant_code,
                              variant_name,
                              variant_description
                          `)
                          .eq("product_id", productId)
                          .maybeSingle()
                    : Promise.resolve({ data: null, error: null }),
            ]);

            const results = [
                productResult,
                coveragesResult,
                attributesResult,
                codeIdentityResult,
            ];

            const failed = results.find((result) => result.error);
            if (failed?.error) throw failed.error;

            return {
                product: productResult.data,
                coverages: coveragesResult.data ?? [],
                attributes: attributesResult.data ?? [],
                codeIdentity: codeIdentityResult.data ?? null,
            };
        },
    });

    const unitComparisonQuery = useQuery({
        queryKey: ["product-details", "unit-comparison", productId],
        enabled: open && Boolean(productId),
        queryFn: async (): Promise<ProductUnitComparisonRow[]> => {
            if (!productId) return [];

            const { data, error } = await db.rpc(
                "get_product_unit_comparison",
                {
                    p_product_id: productId,
                },
            );

            if (error) throw error;

            return (data ?? []) as ProductUnitComparisonRow[];
        },
    });

    const pricingQuery = useQuery({
        queryKey: ["product-details", "pricing-summary", productId],
        enabled: open && Boolean(productId),
        queryFn: async (): Promise<ProductPricingSummary> => {
            if (!productId) throw new Error("Product ID is required.");

            const { data, error } = await db.rpc(
                "get_product_pricing_summary",
                {
                    p_product_id: productId,
                },
            );

            if (error) throw error;

            return data as ProductPricingSummary;
        },
    });

    const details = detailsQuery.data;
    const product = details?.product;
    const pricing = pricingQuery.data;
    const pricingPermissions =
        pricing?.permissions ?? EMPTY_PRICING_PERMISSIONS;

    const unitRows = useMemo(
        () =>
            [...(unitComparisonQuery.data ?? [])].sort(
                (first, second) =>
                    Number(first.display_order ?? 0) -
                    Number(second.display_order ?? 0),
            ),
        [unitComparisonQuery.data],
    );

    const getAttributeValue = (row: any) => {
        const definition = row.product_attribute_definitions;
        if (!definition) return "-";

        if (definition.data_type === "multi_select") {
            const labels = (row.product_attribute_value_options ?? [])
                .map(
                    (item: any) =>
                        item.product_attribute_options?.option_label,
                )
                .filter(Boolean);

            return labels.length ? labels.join(", ") : "-";
        }

        if (definition.data_type === "select") {
            return row.product_attribute_options?.option_label ?? "-";
        }

        if (definition.data_type === "boolean") {
            return row.value_boolean === null
                ? "-"
                : row.value_boolean
                  ? "Yes"
                  : "No";
        }

        if (definition.data_type === "number") {
            if (row.value_number === null) return "-";

            return `${formatNumber(row.value_number)}${
                definition.unit_uom_code
                    ? ` ${definition.unit_uom_code}`
                    : ""
            }`;
        }

        if (definition.data_type === "date") {
            return formatDate(row.value_date);
        }

        return row.value_text || "-";
    };

    const pricingError =
        pricingQuery.error instanceof Error
            ? pricingQuery.error.message
            : pricingQuery.isError
              ? "Unable to load pricing information."
              : null;

    const unitComparisonError =
        unitComparisonQuery.error instanceof Error
            ? unitComparisonQuery.error.message
            : unitComparisonQuery.isError
              ? "Unable to load unit comparison."
              : null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92vh] w-[calc(100vw-20px)] max-w-6xl overflow-hidden rounded-2xl border-[#E5E7EB] p-0">
                <DialogHeader className="border-b border-[#E5E7EB] bg-white px-5 py-4 pr-12">
                    <DialogTitle className="text-slate-900">
                        Product Details
                    </DialogTitle>
                </DialogHeader>

                <div className="max-h-[calc(92vh-69px)] overflow-y-auto bg-[#F8FAFC] p-3 sm:p-5">
                    {detailsQuery.isLoading ? (
                        <div className="flex min-h-64 items-center justify-center gap-3 text-slate-500">
                            <Loader2 className="h-5 w-5 animate-spin text-[#9E4B4B]" />
                            Loading product details...
                        </div>
                    ) : detailsQuery.isError ? (
                        <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                            <AlertTriangle className="h-8 w-8 text-red-500" />
                            <div>
                                <p className="font-bold text-red-700">
                                    Unable to load product details
                                </p>
                                <p className="mt-1 text-sm text-red-600">
                                    {detailsQuery.error instanceof Error
                                        ? detailsQuery.error.message
                                        : "Unknown error"}
                                </p>
                            </div>
                        </div>
                    ) : !product ? (
                        <EmptyState text="Product details were not found." />
                    ) : (
                        <div className="space-y-4">
                            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm sm:p-5">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                        <p className="break-words text-xl font-bold text-slate-900 sm:text-2xl">
                                            {product.product_name}
                                        </p>
                                        <p className="mt-1 break-all font-mono text-sm font-bold text-[#9E4B4B]">
                                            {product.product_code}
                                        </p>
                                    </div>
                                    <ActiveStatusBadge
                                        isActive={product.is_active}
                                    />
                                </div>

                                {product.description ? (
                                    <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                        {product.description}
                                    </p>
                                ) : null}
                            </div>

                            <Section
                                icon={PackageCheck}
                                title="Product Summary"
                                helper="Core product identity and operational defaults."
                            >
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    <InfoItem
                                        label="Category"
                                        value={
                                            product.product_categories
                                                ?.category_name ?? "-"
                                        }
                                    />
                                    <InfoItem
                                        label="Product Type"
                                        value={product.product_type}
                                    />
                                    <InfoItem
                                        label="Stock / Service"
                                        value={
                                            product.is_service_item
                                                ? "Service item"
                                                : product.is_stock_item
                                                  ? "Stock item"
                                                  : "Non-stock item"
                                        }
                                    />
                                    <InfoItem
                                        label="Default Waste"
                                        value={`${formatNumber(
                                            product.default_waste_percent,
                                        )}%`}
                                    />
                                </div>
                            </Section>

                            <Section
                                icon={Ruler}
                                title="Units and Packaging"
                                helper="Product unit hierarchy. Conversion and coverage remain separate."
                            >
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    <InfoItem
                                        label="Base UOM"
                                        value={
                                            product.base_uom_code || "-"
                                        }
                                    />
                                    <InfoItem
                                        label="Purchase UOM"
                                        value={
                                            product.default_purchase_uom_code ||
                                            "-"
                                        }
                                    />
                                    <InfoItem
                                        label="Request UOM"
                                        value={
                                            product.default_request_uom_code ||
                                            "-"
                                        }
                                    />
                                    <InfoItem
                                        label="Sales UOM"
                                        value={
                                            product.default_sales_uom_code ||
                                            "-"
                                        }
                                    />
                                </div>

                                <div className="mt-4">
                                    {unitComparisonQuery.isLoading ? (
                                        <div className="flex min-h-24 items-center justify-center gap-2 text-sm text-slate-500">
                                            <Loader2 className="h-4 w-4 animate-spin text-[#9E4B4B]" />
                                            Loading unit comparison...
                                        </div>
                                    ) : unitComparisonError ? (
                                        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                            {unitComparisonError}
                                        </div>
                                    ) : unitRows.length === 0 ? (
                                        <EmptyState text="No active Product UOM hierarchy is configured." />
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                                {unitRows.map(
                                                    (unit, index) => (
                                                        <div
                                                            key={`${unit.uom_code}-${unit.display_order}`}
                                                            className="flex items-center gap-2"
                                                        >
                                                            <span className="rounded-full border border-[#E5E7EB] bg-[#F7F9FB] px-3 py-1.5 text-sm font-bold text-slate-900">
                                                                {unit.uom_code}
                                                            </span>
                                                            {index <
                                                            unitRows.length -
                                                                1 ? (
                                                                <span className="text-[#9E4B4B]">
                                                                    →
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                    ),
                                                )}
                                            </div>

                                            <div className="grid gap-3 md:grid-cols-2">
                                                {unitRows.map((unit) => {
                                                    const roles = [
                                                        unit.is_purchase_unit
                                                            ? "Purchase"
                                                            : null,
                                                        unit.is_request_unit
                                                            ? "Request"
                                                            : null,
                                                        unit.is_sales_unit
                                                            ? "Sales"
                                                            : null,
                                                        unit.is_stock_unit
                                                            ? "Stock"
                                                            : null,
                                                    ].filter(Boolean);

                                                    return (
                                                        <div
                                                            key={`${unit.uom_code}-${unit.display_order}-detail`}
                                                            className="rounded-xl border border-[#E5E7EB] bg-[#F7F9FB] p-4"
                                                        >
                                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                                <div>
                                                                    <p className="font-bold text-slate-900">
                                                                        Level{" "}
                                                                        {
                                                                            unit.display_order
                                                                        }{" "}
                                                                        —{" "}
                                                                        {
                                                                            unit.uom_code
                                                                        }
                                                                    </p>
                                                                    <p className="mt-1 text-sm text-slate-600">
                                                                        {unit.next_smaller_uom_code
                                                                            ? `1 ${unit.uom_code} = ${formatNumber(
                                                                                  unit.units_per_next_smaller,
                                                                              )} ${unit.next_smaller_uom_code}`
                                                                            : `Base unit: 1 ${unit.uom_code}`}
                                                                    </p>
                                                                    {unit.uom_code !==
                                                                    unit.base_uom_code ? (
                                                                        <p className="mt-1 text-xs text-slate-500">
                                                                            1{" "}
                                                                            {
                                                                                unit.uom_code
                                                                            }{" "}
                                                                            ={" "}
                                                                            {formatNumber(
                                                                                unit.conversion_to_base,
                                                                            )}{" "}
                                                                            {
                                                                                unit.base_uom_code
                                                                            }
                                                                        </p>
                                                                    ) : null}
                                                                </div>

                                                                {roles.length >
                                                                0 ? (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {roles.map(
                                                                            (
                                                                                unitRole,
                                                                            ) => (
                                                                                <span
                                                                                    key={
                                                                                        unitRole
                                                                                    }
                                                                                    className="rounded-full bg-[#F5DEDE] px-2 py-1 text-xs font-bold text-[#9E4B4B]"
                                                                                >
                                                                                    {
                                                                                        unitRole
                                                                                    }
                                                                                </span>
                                                                            ),
                                                                        )}
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Section>

                            <Section
                                icon={Database}
                                title="Coverage / Yield"
                                helper="Coverage describes yield. It is not a unit conversion."
                            >
                                {!product.uses_coverage ? (
                                    <EmptyState text="Coverage tracking is not enabled for this product." />
                                ) : details.coverages.length === 0 ? (
                                    <EmptyState text="Coverage is enabled, but no active coverage record is configured." />
                                ) : (
                                    <div className="space-y-3">
                                        {details.coverages.map(
                                            (coverage: any) => (
                                                <div
                                                    key={
                                                        coverage.product_coverage_id
                                                    }
                                                    className="rounded-xl border border-[#E5E7EB] bg-[#F7F9FB] p-4"
                                                >
                                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                        <p className="font-bold text-slate-900">
                                                            {formatNumber(
                                                                coverage.source_quantity,
                                                            )}{" "}
                                                            {
                                                                coverage.source_uom_code
                                                            }{" "}
                                                            covers{" "}
                                                            {formatNumber(
                                                                coverage.coverage_quantity,
                                                            )}{" "}
                                                            {
                                                                coverage.coverage_uom_code
                                                            }
                                                        </p>

                                                        <div className="flex flex-wrap gap-2 text-xs">
                                                            {coverage.is_default ? (
                                                                <span className="rounded-full bg-[#F5DEDE] px-2 py-1 font-bold text-[#9E4B4B]">
                                                                    Default
                                                                </span>
                                                            ) : null}
                                                            <span className="rounded-full bg-slate-200 px-2 py-1 font-medium text-slate-700">
                                                                {coverage.is_estimate
                                                                    ? "Estimated"
                                                                    : "Confirmed"}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {coverage.minimum_coverage !==
                                                        null ||
                                                    coverage.maximum_coverage !==
                                                        null ? (
                                                        <p className="mt-2 text-sm text-slate-600">
                                                            Range:{" "}
                                                            {coverage.minimum_coverage ===
                                                            null
                                                                ? "-"
                                                                : formatNumber(
                                                                      coverage.minimum_coverage,
                                                                  )}{" "}
                                                            –{" "}
                                                            {coverage.maximum_coverage ===
                                                            null
                                                                ? "-"
                                                                : formatNumber(
                                                                      coverage.maximum_coverage,
                                                                  )}{" "}
                                                            {
                                                                coverage.coverage_uom_code
                                                            }
                                                        </p>
                                                    ) : null}

                                                    {coverage.notes ? (
                                                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                                                            {coverage.notes}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            ),
                                        )}
                                    </div>
                                )}
                            </Section>

                            <Section
                                icon={Tags}
                                title="Dynamic Attributes"
                                helper="Category-driven technical specifications."
                            >
                                {details.attributes.length === 0 ? (
                                    <EmptyState text="No dynamic attribute values recorded." />
                                ) : (
                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        {[...details.attributes]
                                            .sort(
                                                (first: any, second: any) =>
                                                    Number(
                                                        first
                                                            .product_attribute_definitions
                                                            ?.sort_order ?? 0,
                                                    ) -
                                                    Number(
                                                        second
                                                            .product_attribute_definitions
                                                            ?.sort_order ?? 0,
                                                    ),
                                            )
                                            .map((attribute: any) => (
                                                <InfoItem
                                                    key={
                                                        attribute.product_attribute_value_id
                                                    }
                                                    label={
                                                        attribute
                                                            .product_attribute_definitions
                                                            ?.attribute_name ??
                                                        "Attribute"
                                                    }
                                                    value={getAttributeValue(
                                                        attribute,
                                                    )}
                                                />
                                            ))}
                                    </div>
                                )}
                            </Section>

                            <Section
                                icon={Truck}
                                title="Supplier Information"
                                helper="Operational supplier details are returned by the permission-aware pricing RPC."
                            >
                                {pricingQuery.isLoading ? (
                                    <div className="flex min-h-24 items-center justify-center gap-2 text-sm text-slate-500">
                                        <Loader2 className="h-4 w-4 animate-spin text-[#9E4B4B]" />
                                        Loading supplier information...
                                    </div>
                                ) : pricingError ? (
                                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                        {pricingError}
                                    </div>
                                ) : (pricing?.supplier_links ?? []).length ===
                                  0 ? (
                                    <EmptyState text="No supplier links configured." />
                                ) : (
                                    <div className="space-y-3">
                                        {(pricing?.supplier_links ?? []).map(
                                            (link, index) => {
                                                const supplierLinkId =
                                                    readText(
                                                        link,
                                                        "material_supplier_link_id",
                                                    ) ?? `supplier-${index}`;

                                                const currencyCode =
                                                    readText(
                                                        link,
                                                        "currency_code",
                                                    ) ?? "AUD";

                                                const defaultCost =
                                                    readNumber(
                                                        link,
                                                        "default_cost_price",
                                                    );

                                                const lastPurchasePrice =
                                                    readNumber(
                                                        link,
                                                        "last_purchase_price",
                                                    );

                                                const lastPurchaseDate =
                                                    readText(
                                                        link,
                                                        "last_purchase_date",
                                                    );

                                                return (
                                                    <div
                                                        key={supplierLinkId}
                                                        className="rounded-xl border border-[#E5E7EB] bg-[#F7F9FB] p-4"
                                                    >
                                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                            <div>
                                                                <p className="font-bold text-slate-900">
                                                                    {readText(
                                                                        link,
                                                                        "supplier_product_name",
                                                                    ) ??
                                                                        readText(
                                                                            link,
                                                                            "supplier_product_code",
                                                                        ) ??
                                                                        "Linked supplier"}
                                                                </p>
                                                                <p className="mt-1 break-all text-xs text-slate-500">
                                                                    Supplier ID:{" "}
                                                                    {readText(
                                                                        link,
                                                                        "supplier_id",
                                                                    ) ?? "-"}
                                                                </p>
                                                            </div>

                                                            <div className="flex flex-wrap gap-2 text-xs">
                                                                {readBoolean(
                                                                    link,
                                                                    "is_preferred",
                                                                ) ? (
                                                                    <span className="rounded-full bg-[#F5DEDE] px-2 py-1 font-bold text-[#9E4B4B]">
                                                                        Preferred
                                                                    </span>
                                                                ) : null}
                                                                <span className="rounded-full bg-slate-200 px-2 py-1 font-medium text-slate-700">
                                                                    {readBoolean(
                                                                        link,
                                                                        "is_active",
                                                                    )
                                                                        ? "Active"
                                                                        : "Inactive"}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                                            <InfoItem
                                                                label="Supplier Product Code"
                                                                value={
                                                                    readText(
                                                                        link,
                                                                        "supplier_product_code",
                                                                    ) ?? "-"
                                                                }
                                                            />
                                                            <InfoItem
                                                                label="Purchase UOM"
                                                                value={
                                                                    readText(
                                                                        link,
                                                                        "purchase_uom_code",
                                                                    ) ?? "-"
                                                                }
                                                            />
                                                            <InfoItem
                                                                label="Lead Time"
                                                                value={
                                                                    readNumber(
                                                                        link,
                                                                        "lead_time_days",
                                                                    ) === null
                                                                        ? "-"
                                                                        : `${formatNumber(
                                                                              readNumber(
                                                                                  link,
                                                                                  "lead_time_days",
                                                                              ),
                                                                              0,
                                                                          )} days`
                                                                }
                                                            />
                                                            <InfoItem
                                                                label="Minimum Order"
                                                                value={formatNumber(
                                                                    readNumber(
                                                                        link,
                                                                        "minimum_order_quantity",
                                                                    ),
                                                                )}
                                                            />
                                                            <InfoItem
                                                                label="Order Multiple"
                                                                value={formatNumber(
                                                                    readNumber(
                                                                        link,
                                                                        "order_multiple",
                                                                    ),
                                                                )}
                                                            />

                                                            {pricingPermissions.can_view_supplier_cost ? (
                                                                <InfoItem
                                                                    label="Default Cost"
                                                                    value={
                                                                        defaultCost ===
                                                                        null
                                                                            ? "Not configured"
                                                                            : formatCurrency(
                                                                                  defaultCost,
                                                                                  currencyCode,
                                                                                  readText(
                                                                                      link,
                                                                                      "purchase_uom_code",
                                                                                  ),
                                                                              )
                                                                    }
                                                                />
                                                            ) : null}

                                                            {pricingPermissions.can_view_last_purchase_price ? (
                                                                <>
                                                                    <InfoItem
                                                                        label="Last Purchase Price"
                                                                        value={
                                                                            lastPurchasePrice ===
                                                                            null
                                                                                ? "Not configured"
                                                                                : formatCurrency(
                                                                                      lastPurchasePrice,
                                                                                      currencyCode,
                                                                                      readText(
                                                                                          link,
                                                                                          "purchase_uom_code",
                                                                                      ),
                                                                                  )
                                                                        }
                                                                    />
                                                                    <InfoItem
                                                                        label="Last Purchase Date"
                                                                        value={
                                                                            lastPurchaseDate
                                                                                ? formatDate(
                                                                                      lastPurchaseDate,
                                                                                  )
                                                                                : "Not configured"
                                                                        }
                                                                    />
                                                                </>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                );
                                            },
                                        )}
                                    </div>
                                )}
                            </Section>

                            {pricingPermissions.can_view_sales_prices ? (
                                <Section
                                    icon={CircleDollarSign}
                                    title="Sales Pricing"
                                    helper="Active Price Book lines returned by the secured pricing RPC."
                                >
                                    {(pricing?.sales_prices ?? []).length ===
                                    0 ? (
                                        <EmptyState text="No active Price Book lines are configured for this product." />
                                    ) : (
                                        <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
                                            <table className="min-w-[860px] w-full text-left text-sm">
                                                <thead className="bg-[#9E4B4B] text-white">
                                                    <tr>
                                                        <th className="px-3 py-2">
                                                            Price Book
                                                        </th>
                                                        <th className="px-3 py-2">
                                                            Price UOM
                                                        </th>
                                                        <th className="px-3 py-2 text-right">
                                                            Unit Price
                                                        </th>
                                                        <th className="px-3 py-2 text-right">
                                                            Minimum
                                                        </th>
                                                        <th className="px-3 py-2">
                                                            Effective
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(
                                                        pricing?.sales_prices ??
                                                        []
                                                    ).map(
                                                        (
                                                            entry,
                                                            index,
                                                        ) => {
                                                            const priceBook =
                                                                entry.price_book ??
                                                                {};
                                                            const priceLine =
                                                                entry.price_book_line ??
                                                                {};

                                                            const priceBookLineId =
                                                                readText(
                                                                    priceLine,
                                                                    "price_book_line_id",
                                                                ) ??
                                                                `price-${index}`;

                                                            const currencyCode =
                                                                readText(
                                                                    priceBook,
                                                                    "currency_code",
                                                                ) ??
                                                                readText(
                                                                    priceLine,
                                                                    "currency_code",
                                                                ) ??
                                                                "AUD";

                                                            const priceUom =
                                                                readText(
                                                                    priceLine,
                                                                    "price_uom_code",
                                                                ) ??
                                                                product.default_sales_uom_code ??
                                                                product.base_uom_code;

                                                            return (
                                                                <tr
                                                                    key={
                                                                        priceBookLineId
                                                                    }
                                                                    className="border-t border-[#E5E7EB] bg-white"
                                                                >
                                                                    <td className="px-3 py-2 font-semibold text-slate-900">
                                                                        {readText(
                                                                            priceBook,
                                                                            "price_book_name",
                                                                        ) ??
                                                                            readText(
                                                                                priceBook,
                                                                                "price_book_code",
                                                                            ) ??
                                                                            "-"}
                                                                        {readBoolean(
                                                                            priceBook,
                                                                            "is_default",
                                                                        ) ? (
                                                                            <span className="ml-2 rounded-full bg-[#F5DEDE] px-2 py-0.5 text-xs font-bold text-[#9E4B4B]">
                                                                                Default
                                                                            </span>
                                                                        ) : null}
                                                                    </td>
                                                                    <td className="px-3 py-2 font-mono">
                                                                        {priceUom ??
                                                                            "-"}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-right font-semibold">
                                                                        {formatCurrency(
                                                                            readNumber(
                                                                                priceLine,
                                                                                "unit_price",
                                                                            ),
                                                                            currencyCode,
                                                                            priceUom,
                                                                        )}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-right">
                                                                        {formatCurrency(
                                                                            readNumber(
                                                                                priceLine,
                                                                                "minimum_price",
                                                                            ),
                                                                            currencyCode,
                                                                            priceUom,
                                                                        )}
                                                                    </td>
                                                                    <td className="px-3 py-2">
                                                                        {formatDate(
                                                                            readText(
                                                                                priceLine,
                                                                                "effective_from",
                                                                            ),
                                                                        )}{" "}
                                                                        –{" "}
                                                                        {readText(
                                                                            priceLine,
                                                                            "effective_to",
                                                                        )
                                                                            ? formatDate(
                                                                                  readText(
                                                                                      priceLine,
                                                                                      "effective_to",
                                                                                  ),
                                                                              )
                                                                            : "No expiry"}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        },
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </Section>
                            ) : (
                                <PermissionNotice text="Sales pricing is hidden because this user does not have Product Sales Price permission." />
                            )}

                            {pricingPermissions.can_view_average_cost ? (
                                <Section
                                    icon={CircleDollarSign}
                                    title="Stock Cost Summary"
                                    helper="Weighted average cost is calculated by the Backend from active costed Stock Lots."
                                >
                                    {!pricing?.average_cost ? (
                                        <EmptyState text="Average stock cost is not available." />
                                    ) : (
                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                            <InfoItem
                                                label="Costed Quantity"
                                                value={`${formatNumber(
                                                    pricing.average_cost
                                                        .costed_quantity,
                                                )} ${
                                                    pricing.average_cost
                                                        .base_uom_code ??
                                                    product.base_uom_code ??
                                                    ""
                                                }`}
                                            />
                                            <InfoItem
                                                label="Total Stock Value"
                                                value={formatCurrency(
                                                    pricing.average_cost
                                                        .total_stock_value,
                                                )}
                                            />
                                            <InfoItem
                                                label="Weighted Average Unit Cost"
                                                value={formatCurrency(
                                                    pricing.average_cost
                                                        .weighted_average_unit_cost,
                                                    "AUD",
                                                    pricing.average_cost
                                                        .base_uom_code ??
                                                        product.base_uom_code,
                                                )}
                                            />
                                            <InfoItem
                                                label="Calculation"
                                                value="Total costed stock value ÷ total costed quantity"
                                            />
                                        </div>
                                    )}
                                </Section>
                            ) : null}

                            {canViewCodeIdentity ? (
                                <Section
                                    icon={Database}
                                    title="Product Code Identity"
                                    helper="Immutable identity segments recorded by the Product Code registry."
                                >
                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                        <InfoItem
                                            label="Full Product Code"
                                            value={
                                                <span className="font-mono">
                                                    {product.product_code}
                                                </span>
                                            }
                                        />
                                        <InfoItem
                                            label="Category Code"
                                            value={
                                                details.codeIdentity
                                                    ?.full_category_code ||
                                                "Legacy / unavailable"
                                            }
                                        />
                                        <InfoItem
                                            label="Type Code"
                                            value={
                                                details.codeIdentity
                                                    ?.type_code || "-"
                                            }
                                        />
                                        <InfoItem
                                            label="Size Token"
                                            value={
                                                details.codeIdentity
                                                    ?.size_token || "-"
                                            }
                                        />
                                        <InfoItem
                                            label="Colour Code"
                                            value={
                                                details.codeIdentity
                                                    ?.colour_code || "-"
                                            }
                                        />
                                        <InfoItem
                                            label="Variant"
                                            value={
                                                details.codeIdentity
                                                    ? `${details.codeIdentity.variant_code} — ${details.codeIdentity.variant_name}`
                                                    : product.variant_name || "-"
                                            }
                                        />
                                    </div>
                                </Section>
                            ) : null}

                            {canViewAudit ? (
                                <Section
                                    icon={Database}
                                    title="Audit Information"
                                    helper="System timestamps for the Product master record."
                                >
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <InfoItem
                                            label="Created"
                                            value={formatDate(
                                                product.created_at,
                                            )}
                                        />
                                        <InfoItem
                                            label="Last Updated"
                                            value={formatDate(
                                                product.updated_at,
                                            )}
                                        />
                                    </div>
                                </Section>
                            ) : null}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}