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
    conversions: any[];
    coverages: any[];
    attributes: any[];
    supplierLinks: any[];
    priceLines: any[];
    stockLots: any[];
    codeIdentity: any | null;
};

const formatNumber = (value: unknown, maximumFractionDigits = 4) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return "-";
    return new Intl.NumberFormat("en-AU", {
        maximumFractionDigits,
    }).format(number);
};

const formatCurrency = (value: unknown, currency = "AUD") => {
    const number = Number(value);
    if (!Number.isFinite(number)) return "-";
    return new Intl.NumberFormat("en-AU", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
    }).format(number);
};

const formatDate = (value: string | null | undefined) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("en-AU", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
};

const Section = ({
    icon: Icon,
    title,
    children,
}: {
    icon: typeof Boxes;
    title: string;
    children: React.ReactNode;
}) => (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
        <div className="flex items-center gap-2 rounded-t-2xl border-b border-[#E5E7EB] bg-[#F5DEDE] px-4 py-3">
            <Icon className="h-5 w-5 text-[#9E4B4B]" />
            <h3 className="font-bold text-slate-900">{title}</h3>
        </div>
        <div className="p-4">{children}</div>
    </section>
);

const InfoItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="rounded-xl border border-[#E5E7EB] bg-[#F7F9FB] p-3">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <div className="mt-1 break-words text-sm font-semibold text-slate-900">
            {value ?? "-"}
        </div>
    </div>
);

const EmptyState = ({ text }: { text: string }) => (
    <div className="rounded-xl border border-dashed border-[#E5E7EB] bg-[#F7F9FB] px-4 py-6 text-center text-sm text-slate-500">
        {text}
    </div>
);

type SupplierCostRow = {
    material_supplier_link_id: string;
    default_cost_price: number | null;
    last_purchase_price: number | null;
    last_purchase_date: string | null;
    currency_code: string;
};

export function ProductDetailsDialog({
    open,
    onOpenChange,
    productId,
    role,
}: ProductDetailsDialogProps) {
    const isAdmin = role === "admin";
    const canViewSupplier =
        role === "admin" ||
        role === "manager" ||
        role === "project_manager";
    const canViewSalesPricing =
        role === "admin" ||
        role === "manager" ||
        role === "project_manager";
    const canViewStock =
        role === "admin" ||
        role === "manager" ||
        role === "project_manager" ||
        role === "site_supervisor";
    const canViewCodeIdentity =
        role === "admin" ||
        role === "manager" ||
        role === "project_manager";
    const canViewAudit = role === "admin";

    const detailsQuery = useQuery({
        queryKey: ["product-details", productId, role],
        enabled: open && Boolean(productId),
        queryFn: async (): Promise<ProductDetailsData> => {
            if (!productId) throw new Error("Product ID is required.");

            const [
                productResult,
                conversionsResult,
                coveragesResult,
                attributesResult,
                supplierLinksResult,
                priceLinesResult,
                stockLotsResult,
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
                    .from("product_uom_conversions")
                    .select(`
                        product_uom_conversion_id,
                        from_uom_code,
                        to_uom_code,
                        conversion_factor,
                        allow_fractional_quantity,
                        sort_order
                    `)
                    .eq("product_id", productId)
                    .eq("is_deleted", false)
                    .eq("is_active", true)
                    .order("sort_order"),
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
                canViewSupplier
                    ? db
                        .from("material_supplier_links")
                        .select(`
                            material_supplier_link_id,
                            supplier_id,
                            supplier_product_code,
                            supplier_product_name,
                            purchase_uom_code,
                            lead_time_days,
                            minimum_order_quantity,
                            order_multiple,
                            is_preferred,
                            is_active,
                            suppliers(supplier_code,supplier_name)
                        `)
                        .eq("product_id", productId)
                        .eq("is_deleted", false)
                        .order("is_preferred", { ascending: false })
                        .order("created_at")
                    : Promise.resolve({ data: [], error: null }),
                canViewSalesPricing
                    ? db
                        .from("price_book_lines")
                        .select(`
                            price_book_line_id,
                            unit_price,
                            minimum_price,
                            effective_from,
                            effective_to,
                            is_active,
                            price_books(
                                price_book_code,
                                price_book_name,
                                is_default,
                                is_active
                            )
                        `)
                        .eq("product_id", productId)
                        .eq("is_deleted", false)
                        .order("effective_from", { ascending: false })
                    : Promise.resolve({ data: [], error: null }),
                canViewStock
                    ? db
                        .from("stock_lots")
                        .select(`
                            stock_lot_id,
                            lot_no,
                            lot_status,
                            base_uom_code,
                            received_date,
                            received_quantity,
                            remaining_quantity,
                            reserved_quantity,
                            damaged_quantity,
                            expiry_date,
                            is_active,
                            stock_locations(location_code,location_name),
                            suppliers(supplier_code,supplier_name)
                        `)
                        .eq("product_id", productId)
                        .eq("is_deleted", false)
                        .order("received_date", { ascending: false })
                    : Promise.resolve({ data: [], error: null }),
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
                conversionsResult,
                coveragesResult,
                attributesResult,
                supplierLinksResult,
                priceLinesResult,
                stockLotsResult,
                codeIdentityResult,
            ];
            const failed = results.find((result) => result.error);
            if (failed?.error) throw failed.error;

            return {
                product: productResult.data,
                conversions: conversionsResult.data ?? [],
                coverages: coveragesResult.data ?? [],
                attributes: attributesResult.data ?? [],
                supplierLinks: supplierLinksResult.data ?? [],
                priceLines: priceLinesResult.data ?? [],
                stockLots: stockLotsResult.data ?? [],
                codeIdentity: codeIdentityResult.data ?? null,
            };
        },
    });

    const supplierCostsQuery = useQuery({
        queryKey: ["product-details", "admin-costs", productId],
        enabled: open && Boolean(productId) && isAdmin,
        queryFn: async () => {
            if (!productId) return [];
            const { data, error } = await db
                .from("material_supplier_links")
                .select(`
                    material_supplier_link_id,
                    currency_code,
                    default_cost_price,
                    last_purchase_price,
                    last_purchase_date,
                    price_effective_from,
                    price_effective_to
                `)
                .eq("product_id", productId)
                .eq("is_deleted", false);
            if (error) throw error;
            return data ?? [];
        },
    });

    const stockCostsQuery = useQuery({
        queryKey: ["product-details", "admin-stock-costs", productId],
        enabled: open && Boolean(productId) && isAdmin,
        queryFn: async () => {
            if (!productId) return [];
            const { data, error } = await db
                .from("stock_lots")
                .select("stock_lot_id,average_unit_cost")
                .eq("product_id", productId)
                .eq("is_deleted", false);
            if (error) throw error;
            return data ?? [];
        },
    });

    const supplierCostByLinkId = useMemo(
        () =>
            new Map<string, SupplierCostRow>(
                ((supplierCostsQuery.data ?? []) as SupplierCostRow[]).map(
                    (cost) => [
                        cost.material_supplier_link_id,
                        cost,
                    ],
                ),
            ),
        [supplierCostsQuery.data],
    );

    const stockCostByLotId = useMemo(
        () =>
            new Map(
                (stockCostsQuery.data ?? []).map((row: any) => [
                    row.stock_lot_id,
                    row.average_unit_cost,
                ]),
            ),
        [stockCostsQuery.data],
    );

    const adminCostSummary = useMemo(() => {
        const supplierLinks = detailsQuery.data?.supplierLinks ?? [];
        const preferredLink =
            supplierLinks.find((link: any) => link.is_preferred) ??
            supplierLinks[0] ??
            null;

        const supplierCost = preferredLink
            ? supplierCostByLinkId.get(preferredLink.material_supplier_link_id)
            : undefined;

        const stockCosts = (stockCostsQuery.data ?? [])
            .map((row: any) => Number(row.average_unit_cost))
            .filter((value: number) => Number.isFinite(value));

        const averageUnitCost =
            stockCosts.length > 0
                ? stockCosts.reduce((total: number, value: number) => total + value, 0) /
                  stockCosts.length
                : null;

        return {
            preferredSupplierName:
                preferredLink?.suppliers?.supplier_name ?? null,
            defaultCost: supplierCost?.default_cost_price ?? null,
            lastPurchasePrice: supplierCost?.last_purchase_price ?? null,
            lastPurchaseDate: supplierCost?.last_purchase_date ?? null,
            currencyCode: supplierCost?.currency_code || "AUD",
            averageUnitCost,
        };
    }, [
        detailsQuery.data?.supplierLinks,
        stockCostsQuery.data,
        supplierCostByLinkId,
    ]);

    const stockSummary = useMemo(() => {
        const lots = detailsQuery.data?.stockLots ?? [];
        return lots.reduce(
            (summary: any, lot: any) => {
                summary.onHand += Number(lot.remaining_quantity ?? 0);
                summary.reserved += Number(lot.reserved_quantity ?? 0);
                summary.damaged += Number(lot.damaged_quantity ?? 0);
                if (lot.is_active) summary.activeLots += 1;
                return summary;
            },
            { onHand: 0, reserved: 0, damaged: 0, activeLots: 0 },
        );
    }, [detailsQuery.data?.stockLots]);

    const getAttributeValue = (row: any) => {
        const definition = row.product_attribute_definitions;
        if (!definition) return "-";

        if (definition.data_type === "multi_select") {
            const labels = (row.product_attribute_value_options ?? [])
                .map((item: any) => item.product_attribute_options?.option_label)
                .filter(Boolean);
            return labels.length ? labels.join(", ") : "-";
        }
        if (definition.data_type === "select") {
            return row.product_attribute_options?.option_label ?? "-";
        }
        if (definition.data_type === "boolean") {
            return row.value_boolean === null ? "-" : row.value_boolean ? "Yes" : "No";
        }
        if (definition.data_type === "number") {
            if (row.value_number === null) return "-";
            return `${formatNumber(row.value_number)}${definition.unit_uom_code ? ` ${definition.unit_uom_code}` : ""
                }`;
        }
        if (definition.data_type === "date") return formatDate(row.value_date);
        return row.value_text || "-";
    };

    const details = detailsQuery.data;
    const product = details?.product;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] w-[calc(100vw-24px)] max-w-6xl overflow-hidden rounded-2xl p-0">
                <DialogHeader className="border-b border-[#E5E7EB] bg-white px-5 py-4 pr-12">
                    <DialogTitle>Product Details</DialogTitle>
                </DialogHeader>

                <div className="max-h-[calc(90vh-69px)] overflow-y-auto bg-[#F8FAFC] p-4 sm:p-5">
                    {detailsQuery.isLoading ? (
                        <div className="flex min-h-64 items-center justify-center gap-3 text-slate-500">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Loading product details...
                        </div>
                    ) : detailsQuery.isError ? (
                        <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                            <AlertTriangle className="h-8 w-8 text-red-500" />
                            <div>
                                <p className="font-bold text-red-700">Unable to load product details</p>
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
                                    <ActiveStatusBadge isActive={product.is_active} />
                                </div>
                                {product.description ? (
                                    <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                        {product.description}
                                    </p>
                                ) : null}
                            </div>

                            <Section icon={PackageCheck} title="Product Summary">
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    <InfoItem
                                        label="Category"
                                        value={product.product_categories?.category_name ?? "-"}
                                    />
                                    <InfoItem label="Product Type" value={product.product_type} />
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
                                        value={`${formatNumber(product.default_waste_percent)}%`}
                                    />
                                </div>
                            </Section>

                            <Section icon={Ruler} title="Units and Packaging">
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    <InfoItem label="Base UOM" value={product.base_uom_code || "-"} />
                                    <InfoItem
                                        label="Purchase UOM"
                                        value={product.default_purchase_uom_code || "-"}
                                    />
                                    <InfoItem
                                        label="Request UOM"
                                        value={product.default_request_uom_code || "-"}
                                    />
                                    <InfoItem
                                        label="Sales UOM"
                                        value={product.default_sales_uom_code || "-"}
                                    />
                                </div>

                                <div className="mt-4">
                                    <p className="mb-2 text-sm font-bold text-slate-800">UOM Conversions</p>
                                    {details.conversions.length === 0 ? (
                                        <EmptyState text="No UOM conversions configured." />
                                    ) : (
                                        <div className="grid gap-2 sm:grid-cols-2">
                                            {details.conversions.map((conversion: any) => (
                                                <div
                                                    key={conversion.product_uom_conversion_id}
                                                    className="rounded-xl border border-[#E5E7EB] bg-[#F7F9FB] p-3 text-sm"
                                                >
                                                    <p className="font-bold text-slate-900">
                                                        1 {conversion.from_uom_code} = {formatNumber(conversion.conversion_factor)} {conversion.to_uom_code}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        Fractional quantity: {conversion.allow_fractional_quantity ? "Allowed" : "Not allowed"}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Section>

                            <Section icon={Database} title="Coverage / Yield">
                                {!product.uses_coverage ? (
                                    <EmptyState text="Coverage tracking is not enabled for this product." />
                                ) : details.coverages.length === 0 ? (
                                    <EmptyState text="Coverage is enabled, but no active coverage record is configured." />
                                ) : (
                                    <div className="space-y-3">
                                        {details.coverages.map((coverage: any) => (
                                            <div
                                                key={coverage.product_coverage_id}
                                                className="rounded-xl border border-[#E5E7EB] bg-[#F7F9FB] p-4"
                                            >
                                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                    <p className="font-bold text-slate-900">
                                                        {formatNumber(coverage.source_quantity)} {coverage.source_uom_code} covers {formatNumber(coverage.coverage_quantity)} {coverage.coverage_uom_code}
                                                    </p>
                                                    <div className="flex gap-2 text-xs">
                                                        {coverage.is_default ? (
                                                            <span className="rounded-full bg-[#F5DEDE] px-2 py-1 font-bold text-[#9E4B4B]">Default</span>
                                                        ) : null}
                                                        <span className="rounded-full bg-slate-200 px-2 py-1 font-medium text-slate-700">
                                                            {coverage.is_estimate ? "Estimated" : "Confirmed"}
                                                        </span>
                                                    </div>
                                                </div>
                                                {(coverage.minimum_coverage !== null || coverage.maximum_coverage !== null) ? (
                                                    <p className="mt-2 text-sm text-slate-600">
                                                        Range: {coverage.minimum_coverage === null ? "-" : formatNumber(coverage.minimum_coverage)} – {coverage.maximum_coverage === null ? "-" : formatNumber(coverage.maximum_coverage)} {coverage.coverage_uom_code}
                                                    </p>
                                                ) : null}
                                                {coverage.notes ? (
                                                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{coverage.notes}</p>
                                                ) : null}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Section>

                            <Section icon={Tags} title="Dynamic Attributes">
                                {details.attributes.length === 0 ? (
                                    <EmptyState text="No dynamic attribute values recorded." />
                                ) : (
                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        {[...details.attributes]
                                            .sort(
                                                (a: any, b: any) =>
                                                    Number(a.product_attribute_definitions?.sort_order ?? 0) -
                                                    Number(b.product_attribute_definitions?.sort_order ?? 0),
                                            )
                                            .map((attribute: any) => (
                                                <InfoItem
                                                    key={attribute.product_attribute_value_id}
                                                    label={
                                                        attribute.product_attribute_definitions?.attribute_name ??
                                                        "Attribute"
                                                    }
                                                    value={getAttributeValue(attribute)}
                                                />
                                            ))}
                                    </div>
                                )}
                            </Section>

                            {isAdmin ? (
                                <Section icon={CircleDollarSign} title="Admin Cost and Purchase Information">
                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                        <InfoItem
                                            label="Preferred Supplier"
                                            value={adminCostSummary.preferredSupplierName || "Not configured"}
                                        />
                                        <InfoItem
                                            label="Default Cost"
                                            value={
                                                adminCostSummary.defaultCost === null
                                                    ? "Not configured"
                                                    : formatCurrency(
                                                        adminCostSummary.defaultCost,
                                                        adminCostSummary.currencyCode,
                                                    )
                                            }
                                        />
                                        <InfoItem
                                            label="Last Purchase Price"
                                            value={
                                                adminCostSummary.lastPurchasePrice === null
                                                    ? "Not configured"
                                                    : formatCurrency(
                                                        adminCostSummary.lastPurchasePrice,
                                                        adminCostSummary.currencyCode,
                                                    )
                                            }
                                        />
                                        <InfoItem
                                            label="Last Purchase Date"
                                            value={
                                                adminCostSummary.lastPurchaseDate
                                                    ? formatDate(adminCostSummary.lastPurchaseDate)
                                                    : "Not configured"
                                            }
                                        />
                                        <InfoItem
                                            label="Average Unit Cost"
                                            value={
                                                adminCostSummary.averageUnitCost === null
                                                    ? "Not configured"
                                                    : formatCurrency(
                                                        adminCostSummary.averageUnitCost,
                                                        adminCostSummary.currencyCode,
                                                    )
                                            }
                                        />
                                    </div>
                                </Section>
                            ) : null}

                            {canViewSupplier ? (
<Section icon={Truck} title="Supplier Information">
                                {details.supplierLinks.length === 0 ? (
                                    <EmptyState text="No supplier links configured." />
                                ) : (
                                    <div className="space-y-3">
                                        {details.supplierLinks.map((link: any) => {
                                            const cost = supplierCostByLinkId.get(
                                                link.material_supplier_link_id,
                                            );

                                            return (
                                                <div
                                                    key={link.material_supplier_link_id}
                                                    className="rounded-xl border border-[#E5E7EB] bg-[#F7F9FB] p-4"
                                                >
                                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                        <div>
                                                            <p className="font-bold text-slate-900">
                                                                {link.suppliers?.supplier_name ?? "Unknown supplier"}
                                                            </p>
                                                            <p className="mt-1 text-xs text-slate-500">
                                                                {link.suppliers?.supplier_code ?? "-"}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-2 text-xs">
                                                            {link.is_preferred ? (
                                                                <span className="rounded-full bg-[#F5DEDE] px-2 py-1 font-bold text-[#9E4B4B]">Preferred</span>
                                                            ) : null}
                                                            <span className="rounded-full bg-slate-200 px-2 py-1 font-medium text-slate-700">
                                                                {link.is_active ? "Active" : "Inactive"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                                                        <InfoItem label="Supplier Product Code" value={link.supplier_product_code || "-"} />
                                                        <InfoItem label="Supplier Product Name" value={link.supplier_product_name || "-"} />
                                                        <InfoItem label="Purchase UOM" value={link.purchase_uom_code || "-"} />
                                                        <InfoItem label="Lead Time" value={link.lead_time_days === null ? "-" : `${link.lead_time_days} days`} />
                                                        <InfoItem label="Minimum Order" value={link.minimum_order_quantity === null ? "-" : formatNumber(link.minimum_order_quantity)} />
                                                        <InfoItem label="Order Multiple" value={link.order_multiple === null ? "-" : formatNumber(link.order_multiple)} />
                                                        {isAdmin ? (
                                                            <>
                                                                <InfoItem label="Default Cost" value={cost ? formatCurrency(cost.default_cost_price, cost.currency_code || "AUD") : "-"} />
                                                                <InfoItem label="Last Purchase Price" value={cost ? formatCurrency(cost.last_purchase_price, cost.currency_code || "AUD") : "-"} />
                                                                <InfoItem label="Last Purchase Date" value={cost ? formatDate(cost.last_purchase_date) : "-"} />
                                                            </>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </Section>
                            ) : null}

                            {canViewSalesPricing ? (
<Section icon={CircleDollarSign} title="Sales Pricing">
                                {details.priceLines.length === 0 ? (
                                    <EmptyState text="No price book lines configured." />
                                ) : (
                                    <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
                                        <table className="min-w-full text-left text-sm">
                                            <thead className="bg-[#9E4B4B] text-white">
                                                <tr>
                                                    <th className="px-3 py-2">Price Book</th>
                                                    <th className="px-3 py-2 text-right">Unit Price</th>
                                                    <th className="px-3 py-2 text-right">Minimum</th>
                                                    <th className="px-3 py-2">Effective</th>
                                                    <th className="px-3 py-2">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {details.priceLines.map((line: any) => (
                                                    <tr key={line.price_book_line_id} className="border-t border-[#E5E7EB] bg-white">
                                                        <td className="px-3 py-2 font-semibold">
                                                            {line.price_books?.price_book_name ?? "-"}
                                                            {line.price_books?.is_default ? (
                                                                <span className="ml-2 text-xs text-[#9E4B4B]">Default</span>
                                                            ) : null}
                                                        </td>
                                                        <td className="px-3 py-2 text-right">{formatCurrency(line.unit_price)}</td>
                                                        <td className="px-3 py-2 text-right">{formatCurrency(line.minimum_price)}</td>
                                                        <td className="px-3 py-2">{formatDate(line.effective_from)} – {line.effective_to ? formatDate(line.effective_to) : "No expiry"}</td>
                                                        <td className="px-3 py-2">{line.is_active ? "Active" : "Inactive"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </Section>
                            ) : null}

                            {canViewStock ? (
<Section icon={Boxes} title="Stock Summary and Lots">
                                {product.is_service_item || !product.is_stock_item ? (
                                    <EmptyState text="Stock tracking does not apply to this product." />
                                ) : (
                                    <>
                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                            <InfoItem label="On Hand" value={`${formatNumber(stockSummary.onHand)} ${product.base_uom_code}`} />
                                            <InfoItem label="Reserved" value={`${formatNumber(stockSummary.reserved)} ${product.base_uom_code}`} />
                                            <InfoItem label="Available" value={`${formatNumber(Math.max(0, stockSummary.onHand - stockSummary.reserved - stockSummary.damaged))} ${product.base_uom_code}`} />
                                            <InfoItem label="Active Lots" value={formatNumber(stockSummary.activeLots, 0)} />
                                        </div>
                                        <div className="mt-4">
                                            {details.stockLots.length === 0 ? (
                                                <EmptyState text="No stock lots recorded." />
                                            ) : (
                                                <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
                                                    <table className="min-w-full text-left text-sm">
                                                        <thead className="bg-[#9E4B4B] text-white">
                                                            <tr>
                                                                <th className="px-3 py-2">Lot</th>
                                                                <th className="px-3 py-2">Location</th>
                                                                <th className="px-3 py-2 text-right">Remaining</th>
                                                                <th className="px-3 py-2 text-right">Reserved</th>
                                                                {isAdmin ? <th className="px-3 py-2 text-right">Avg. Cost</th> : null}
                                                                <th className="px-3 py-2">Received</th>
                                                                <th className="px-3 py-2">Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {details.stockLots.map((lot: any) => (
                                                                <tr key={lot.stock_lot_id} className="border-t border-[#E5E7EB] bg-white">
                                                                    <td className="px-3 py-2 font-mono font-semibold">{lot.lot_no}</td>
                                                                    <td className="px-3 py-2">{lot.stock_locations?.location_name ?? "-"}</td>
                                                                    <td className="px-3 py-2 text-right">{formatNumber(lot.remaining_quantity)} {lot.base_uom_code}</td>
                                                                    <td className="px-3 py-2 text-right">{formatNumber(lot.reserved_quantity)} {lot.base_uom_code}</td>
                                                                    {isAdmin ? <td className="px-3 py-2 text-right">{formatCurrency(stockCostByLotId.get(lot.stock_lot_id))}</td> : null}
                                                                    <td className="px-3 py-2">{formatDate(lot.received_date)}</td>
                                                                    <td className="px-3 py-2">{lot.lot_status}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </Section>
                            ) : null}

                            {canViewCodeIdentity ? (
                                <Section icon={Database} title="Product Code Identity">
                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                        <InfoItem
                                            label="Full Product Code"
                                            value={<span className="font-mono">{product.product_code}</span>}
                                        />
                                        <InfoItem
                                            label="Category Code"
                                            value={details.codeIdentity?.full_category_code || "Legacy / unavailable"}
                                        />
                                        <InfoItem
                                            label="Type Code"
                                            value={details.codeIdentity?.type_code || "-"}
                                        />
                                        <InfoItem
                                            label="Size Token"
                                            value={details.codeIdentity?.size_token || "-"}
                                        />
                                        <InfoItem
                                            label="Colour Code"
                                            value={details.codeIdentity?.colour_code || "-"}
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
                                <Section icon={Database} title="Audit Information">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <InfoItem label="Created" value={formatDate(product.created_at)} />
                                        <InfoItem label="Last Updated" value={formatDate(product.updated_at)} />
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