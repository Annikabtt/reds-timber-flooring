import { useEffect, useMemo, useRef, useState } from "react";
import {
    Box,
    Check,
    ChevronDown,
    Download,
    Eye,
    FileSpreadsheet,
    Pencil,
    Plus,
    Power,
    Printer,
    Search,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
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
import { ActiveStatusBadge } from "@/components/common/ActiveStatusBadge";
import {
    ProductCodeBuilderModal,
    type ProductCodeBuilderValue,
} from "@/components/products/ProductCodeBuilderModal";

import { ProductDetailsDialog } from "@/components/products/ProductDetailsDialog";

import { type AppRole, normalizeAppRole } from "@/lib/roles";
import { toast } from "sonner";

type StatusFilter = "all" | "active" | "inactive";
type ProductType = "Material" | "Consumable" | "Tool" | "Equipment" | "Service";
type DataType =
    | "text"
    | "long_text"
    | "number"
    | "boolean"
    | "date"
    | "select"
    | "multi_select";

type ProductRow = {
    product_id: string;
    product_code: string;
    product_name: string;
    category_id: string;
    product_type: string;
    description: string | null;
    base_uom_code: string | null;
    default_purchase_uom_code: string | null;
    default_request_uom_code: string | null;
    default_sales_uom_code: string | null;
    default_waste_percent: number;
    uses_coverage: boolean;
    is_stock_item: boolean;
    is_service_item: boolean;
    search_keywords: string | null;
    variant_name: string | null;
    variant_description: string | null;
    is_active: boolean;
    product_categories: {
        category_code: string;
        category_name: string;
    } | null;
};

type Category = {
    category_id: string;
    parent_category_id: string | null;
    category_code: string;
    category_name: string;
    is_active: boolean;
};

type EffectiveAttribute = {
    attribute_id: string;
    attribute_code: string;
    effective_label: string;
    description: string | null;
    data_type: DataType;
    unit_uom_code: string | null;
    unit_symbol: string | null;
    section_name: string;
    effective_help_text: string | null;
    effective_default_value: Json | null;
    validation_rules: Json;
    is_required: boolean;
    sort_order: number;
};

type AttributeOption = {
    attribute_option_id: string;
    attribute_id: string;
    option_code: string;
    option_label: string;
    is_default: boolean;
};

type AttributeFormValue = string | boolean | string[];


type UnitOption = {
    uom_code: string;
    uom_name: string;
    uom_symbol: string;
    uom_category: string;
    sort_order: number;
    is_active: boolean;
};

type CoverageForm = {
    sourceQuantity: string;
    sourceUom: string;
    coverageQuantity: string;
    coverageUom: string;
    minimumCoverage: string;
    maximumCoverage: string;
    isEstimate: boolean;
    notes: string;
};

type UomConversionForm = {
    id: string;
    fromUom: string;
    toUom: string;
    conversionFactor: string;
    allowFractionalQuantity: boolean;
};

const createEmptyUomConversion = (): UomConversionForm => ({
    id: `uom-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    fromUom: "",
    toUom: "",
    conversionFactor: "",
    allowFractionalQuantity: true,
});

const PRODUCT_TYPES: ProductType[] = [
    "Material",
    "Consumable",
    "Tool",
    "Equipment",
    "Service",
];


const emptyCoverage = (): CoverageForm => ({
    sourceQuantity: "1",
    sourceUom: "",
    coverageQuantity: "",
    coverageUom: "sqm",
    minimumCoverage: "",
    maximumCoverage: "",
    isEstimate: true,
    notes: "",
});

const numberOrNull = (value: string) =>
    value.trim() === "" ? null : Number(value);

const escapeCsv = (value: unknown) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;


const FIELD_CLASS = "h-11 rounded-xl border-[#E5E7EB] bg-[#F7F9FB] text-[#111827] hover:border-[#9E4B4B] focus-visible:border-[#9E4B4B] focus-visible:ring-[#9E4B4B]/20";
const TEXTAREA_CLASS = "min-h-24 w-full rounded-xl border border-[#E5E7EB] bg-[#F7F9FB] px-3 py-2 text-sm text-[#111827] outline-none transition hover:border-[#9E4B4B] focus:border-[#9E4B4B] focus:ring-2 focus:ring-[#9E4B4B]/20";


type SearchableOption = {
    value: string;
    label: string;
    searchText: string;
    group?: string;
    description?: string | null;
};

function SearchablePicker({
    value,
    onChange,
    options,
    placeholder,
    searchPlaceholder,
    emptyText,
    allowClear = false,
    disabled = false,
}: {
    value: string;
    onChange: (value: string) => void;
    options: SearchableOption[];
    placeholder: string;
    searchPlaceholder: string;
    emptyText: string;
    allowClear?: boolean;
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const rootRef = useRef<HTMLDivElement | null>(null);
    const selected = options.find((option) => option.value === value) ?? null;
    const keyword = search.trim().toLowerCase();
    const filtered = keyword.length < 2
        ? options
        : options.filter((option) =>
            option.searchText.toLowerCase().includes(keyword),
        );

    useEffect(() => {
        if (!open) return;
        const close = (event: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
                setOpen(false);
                setSearch("");
            }
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, [open]);

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                disabled={disabled}
                aria-expanded={open}
                aria-haspopup="listbox"
                onClick={() => {
                    if (disabled) return;
                    setOpen((current) => !current);
                    setSearch("");
                }}
                className={`${FIELD_CLASS} flex w-full items-center justify-between px-3 text-left disabled:cursor-not-allowed disabled:bg-[#F1F3F5] disabled:text-[#9CA3AF]`}
            >
                <span className={selected ? "truncate" : "truncate text-[#6B7280]"}>
                    {selected?.label ?? placeholder}
                </span>
                <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open ? (
                <div className="absolute z-[80] mt-2 w-full min-w-[280px] overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-xl">
                    <div className="border-b border-[#E5E7EB] p-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                            <Input
                                autoFocus
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder={searchPlaceholder}
                                className={`${FIELD_CLASS} pl-10`}
                            />
                        </div>
                        <p className="mt-2 text-xs text-slate-500">Type at least 2 letters to narrow the list.</p>
                    </div>
                    <div role="listbox" className="max-h-64 overflow-y-auto p-1">
                        {allowClear ? (
                            <button
                                type="button"
                                onClick={() => {
                                    onChange("");
                                    setOpen(false);
                                    setSearch("");
                                }}
                                className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-500 hover:bg-[#FBF1F1]"
                            >
                                — Clear selection —
                            </button>
                        ) : null}
                        {filtered.length === 0 ? (
                            <div className="px-3 py-6 text-center text-sm text-slate-500">{emptyText}</div>
                        ) : (
                            filtered.map((option, index) => {
                                const showGroup = option.group && (index === 0 || filtered[index - 1]?.group !== option.group);
                                return (
                                    <div key={option.value}>
                                        {showGroup ? (
                                            <div className="px-3 pb-1 pt-3 text-xs font-bold uppercase tracking-wide text-[#9E4B4B]">{option.group}</div>
                                        ) : null}
                                        <button
                                            type="button"
                                            role="option"
                                            aria-selected={option.value === value}
                                            onClick={() => {
                                                onChange(option.value);
                                                setOpen(false);
                                                setSearch("");
                                            }}
                                            className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left hover:bg-[#FBF1F1] focus:bg-[#FBF1F1] focus:outline-none"
                                        >
                                            <Check className={`mt-0.5 h-4 w-4 shrink-0 ${option.value === value ? "text-[#9E4B4B]" : "text-transparent"}`} />
                                            <span className="min-w-0">
                                                <span className="block break-words text-sm font-semibold text-slate-900">{option.label}</span>
                                                {option.description ? <span className="mt-0.5 block text-xs text-slate-500">{option.description}</span> : null}
                                            </span>
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

const SectionHeading = ({ number, title, helper }: { number: number; title: string; helper?: string }) => (
    <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#9E4B4B] text-sm font-bold text-white">{number}</span>
        <div>
            <h3 className="font-bold text-slate-900">{title}</h3>
            {helper ? <p className="mt-1 text-sm text-slate-500">{helper}</p> : null}
        </div>
    </div>
);

const Products = () => {
    const queryClient = useQueryClient();

    const [role, setRole] = useState<AppRole>("viewer");

    const isAdmin = role === "admin";

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");

    const [showForm, setShowForm] = useState(false);
    const [showView, setShowView] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);
    const [viewingProductId, setViewingProductId] = useState<string | null>(null);

    const [productCode, setProductCode] = useState("");
    const [showCodeBuilder, setShowCodeBuilder] = useState(false);

    const [productCodeIdentity, setProductCodeIdentity] =
        useState<ProductCodeBuilderValue | null>(null);
    const [productName, setProductName] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [categorySearch, setCategorySearch] = useState("");
    const [categoryComboboxOpen, setCategoryComboboxOpen] = useState(false);
    const categoryComboboxRef = useRef<HTMLDivElement | null>(null);
    const [productType, setProductType] = useState<ProductType>("Material");
    const [description, setDescription] = useState("");
    const [baseUom, setBaseUom] = useState("");
    const [purchaseUom, setPurchaseUom] = useState("");
    const [requestUom, setRequestUom] = useState("");
    const [salesUom, setSalesUom] = useState("");
    const [wastePercent, setWastePercent] = useState("0");
    const [usesCoverage, setUsesCoverage] = useState(false);
    const [isStockItem, setIsStockItem] = useState(true);
    const [isServiceItem, setIsServiceItem] = useState(false);
    const [searchKeywords, setSearchKeywords] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [dynamicValues, setDynamicValues] = useState<
        Record<string, AttributeFormValue>
    >({});
    const [coverageForm, setCoverageForm] = useState<CoverageForm>(emptyCoverage);
    const [uomConversions, setUomConversions] = useState<UomConversionForm[]>([]);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setRole(normalizeAppRole(data.user?.app_metadata?.app_role));
        });
    }, []);

    useEffect(() => {
        if (!categoryComboboxOpen) return;

        const handlePointerDown = (event: MouseEvent) => {
            if (
                categoryComboboxRef.current &&
                !categoryComboboxRef.current.contains(event.target as Node)
            ) {
                setCategoryComboboxOpen(false);
                setCategorySearch("");
            }
        };

        document.addEventListener("mousedown", handlePointerDown);

        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
        };
    }, [categoryComboboxOpen]);

    const { data: products = [], isLoading } = useQuery({
        queryKey: ["products"],
        queryFn: async (): Promise<ProductRow[]> => {
            const { data, error } = await supabase
                .from("products")
                .select(
                    `
          product_id,
          product_code,
          product_name,
          category_id,
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
          search_keywords,
          variant_name,
          variant_description,
          is_active,
          product_categories (
            category_code,
            category_name
          )
        `,
                )
                .eq("is_deleted", false)
                .order("product_name");

            if (error) throw error;
            return (data ?? []) as ProductRow[];
        },
    });

    const { data: categories = [] } = useQuery({
        queryKey: ["products", "categories"],
        queryFn: async (): Promise<Category[]> => {
            const { data, error } = await supabase
                .from("product_categories")
                .select(
                    `
          category_id,
          parent_category_id,
          category_code,
          category_name,
          is_active
        `,
                )
                .eq("is_deleted", false)
                .order("sort_order")
                .order("category_name");

            if (error) throw error;
            return data ?? [];
        },
    });

    const { data: units = [], isLoading: loadingUnits } = useQuery({
        queryKey: ["products", "units"],
        queryFn: async (): Promise<UnitOption[]> => {
            const { data, error } = await supabase
                .from("units_of_measure")
                .select("uom_code,uom_name,uom_symbol,uom_category,sort_order,is_active")
                .eq("is_deleted", false)
                .order("uom_category")
                .order("sort_order")
                .order("uom_name");

            if (error) throw error;
            return data ?? [];
        },
    });

    const { data: effectiveAttributes = [], isFetching: loadingAttributes } =
        useQuery({
            queryKey: ["products", "effective-attributes", categoryId],
            enabled: Boolean(categoryId),
            queryFn: async (): Promise<EffectiveAttribute[]> => {
                const { data, error } = await supabase.rpc(
                    "get_effective_product_category_attributes",
                    { p_category_id: categoryId },
                );
                if (error) throw error;
                return (data ?? []) as EffectiveAttribute[];
            },
        });


    const { data: attributeOptions = [] } = useQuery({
        queryKey: [
            "products",
            "attribute-options",
            effectiveAttributes.map((a) => a.attribute_id).join(","),
        ],
        enabled: effectiveAttributes.some((a) =>
            ["select", "multi_select"].includes(a.data_type),
        ),
        queryFn: async (): Promise<AttributeOption[]> => {
            const ids = effectiveAttributes
                .filter((a) => ["select", "multi_select"].includes(a.data_type))
                .map((a) => a.attribute_id);

            if (ids.length === 0) return [];

            const { data, error } = await supabase
                .from("product_attribute_options")
                .select(
                    `
          attribute_option_id,
          attribute_id,
          option_code,
          option_label,
          is_default
        `,
                )
                .in("attribute_id", ids)
                .eq("is_deleted", false)
                .eq("is_active", true)
                .order("sort_order")
                .order("option_label");

            if (error) throw error;
            return data ?? [];
        },
    });

    const categoryPath = useMemo(() => {
        const byId = new Map(
            categories.map((category) => [category.category_id, category]),
        );
        const paths = new Map<string, string>();

        categories.forEach((category) => {
            const names = [category.category_name];
            const seen = new Set([category.category_id]);
            let parentId = category.parent_category_id;

            while (parentId && !seen.has(parentId)) {
                seen.add(parentId);
                const parent = byId.get(parentId);
                if (!parent) break;
                names.unshift(parent.category_name);
                parentId = parent.parent_category_id;
            }

            paths.set(category.category_id, names.join(" → "));
        });

        return paths;
    }, [categories]);

    const selectableCategories = useMemo(
        () =>
            categories
                .filter(
                    (category) =>
                        category.is_active ||
                        category.category_id === categoryId,
                )
                .sort((a, b) =>
                    (categoryPath.get(a.category_id) ?? a.category_name).localeCompare(
                        categoryPath.get(b.category_id) ?? b.category_name,
                        "en-AU",
                        { sensitivity: "base" },
                    ),
                ),
        [categories, categoryId, categoryPath],
    );

    const filteredCategoryOptions = useMemo(() => {
        const keyword = categorySearch.trim().toLowerCase();

        if (keyword.length < 2) {
            return selectableCategories;
        }

        return selectableCategories.filter((category) => {
            const path =
                categoryPath.get(category.category_id) ?? category.category_name;

            return (
                category.category_name.toLowerCase().includes(keyword) ||
                category.category_code.toLowerCase().includes(keyword) ||
                path.toLowerCase().includes(keyword)
            );
        });
    }, [categoryPath, categorySearch, selectableCategories]);

    const selectedCategory = useMemo(
        () =>
            categories.find((category) => category.category_id === categoryId) ??
            null,
        [categories, categoryId],
    );


    const categoryFilterOptions = useMemo<SearchableOption[]>(
        () => selectableCategories.map((category) => {
            const path = categoryPath.get(category.category_id) ?? category.category_name;
            return {
                value: category.category_id,
                label: path,
                searchText: `${category.category_code} ${category.category_name} ${path}`,
                description: category.category_code,
            };
        }),
        [categoryPath, selectableCategories],
    );

    const uomOptions = useMemo<SearchableOption[]>(
        () => [...units]
            .sort((a, b) =>
                a.uom_category.localeCompare(b.uom_category, "en-AU") ||
                Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0) ||
                a.uom_name.localeCompare(b.uom_name, "en-AU") ||
                a.uom_code.localeCompare(b.uom_code, "en-AU"),
            )
            .map((unit) => ({
                value: unit.uom_code,
                label: `${unit.uom_code} — ${unit.uom_name} (${unit.uom_symbol})`,
                searchText: `${unit.uom_code} ${unit.uom_name} ${unit.uom_symbol} ${unit.uom_category}`,
                group: unit.uom_category,
            })),
        [units],
    );

    const filteredProducts = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();

        return products.filter((product) => {
            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && product.is_active) ||
                (statusFilter === "inactive" && !product.is_active);

            const matchesCategory =
                categoryFilter === "all" || product.category_id === categoryFilter;

            const matchesType =
                typeFilter === "all" || product.product_type === typeFilter;

            const matchesSearch =
                !keyword ||
                product.product_code.toLowerCase().includes(keyword) ||
                product.product_name.toLowerCase().includes(keyword) ||
                product.description?.toLowerCase().includes(keyword) ||
                product.search_keywords?.toLowerCase().includes(keyword) ||
                product.product_categories?.category_name
                    .toLowerCase()
                    .includes(keyword);

            return matchesStatus && matchesCategory && matchesType && matchesSearch;
        });
    }, [products, statusFilter, categoryFilter, typeFilter, searchTerm]);

    const summary = useMemo(
        () => ({
            total: products.length,
            active: products.filter((product) => product.is_active).length,
            inactive: products.filter((product) => !product.is_active).length,
        }),
        [products],
    );

    const groupedAttributes = useMemo(() => {
        const groups = new Map<string, EffectiveAttribute[]>();

        effectiveAttributes.forEach((attribute) => {
            const current = groups.get(attribute.section_name) ?? [];
            current.push(attribute);
            groups.set(attribute.section_name, current);
        });

        return Array.from(groups.entries()).map(([section, attributes]) => [
            section,
            [...attributes].sort(
                (a, b) =>
                    Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0) ||
                    a.effective_label.localeCompare(b.effective_label, "en-AU"),
            ),
        ] as [string, EffectiveAttribute[]]);
    }, [effectiveAttributes]);

    const resetForm = () => {
        setEditingProduct(null);
        setProductCode("");
        setProductCodeIdentity(null);
        setShowCodeBuilder(false);
        setProductName("");
        setCategoryId("");
        setCategorySearch("");
        setCategoryComboboxOpen(false);
        setProductType("Material");
        setDescription("");
        setBaseUom("");
        setPurchaseUom("");
        setRequestUom("");
        setSalesUom("");
        setWastePercent("0");
        setUsesCoverage(false);
        setIsStockItem(true);
        setIsServiceItem(false);
        setSearchKeywords("");
        setIsActive(true);
        setDynamicValues({});
        setCoverageForm(emptyCoverage());
        setUomConversions([]);
    };

    const loadProductDetails = async (product: ProductRow) => {
        setEditingProduct(product);
        setProductCode(product.product_code);
        setProductCodeIdentity(null);
        setShowCodeBuilder(false);
        setProductName(product.product_name);
        setCategoryId(product.category_id);
        setCategorySearch("");
        setCategoryComboboxOpen(false);
        setProductType(product.product_type as ProductType);
        setDescription(product.description ?? "");
        setBaseUom(product.base_uom_code ?? "");
        setPurchaseUom(product.default_purchase_uom_code ?? "");
        setRequestUom(product.default_request_uom_code ?? "");
        setSalesUom(product.default_sales_uom_code ?? "");
        setWastePercent(String(product.default_waste_percent ?? 0));
        setUsesCoverage(product.uses_coverage);
        setIsStockItem(product.is_stock_item);
        setIsServiceItem(product.is_service_item);
        setSearchKeywords(product.search_keywords ?? "");
        setIsActive(product.is_active);

        const [valuesResult, coverageResult, conversionsResult] =
            await Promise.all([
                supabase
                    .from("product_attribute_values")
                    .select(
                        `
            product_attribute_value_id,
            attribute_id,
            value_text,
            value_number,
            value_boolean,
            value_date,
            selected_option_id,
            product_attribute_value_options (
              attribute_option_id
            )
          `,
                    )
                    .eq("product_id", product.product_id)
                    .eq("is_deleted", false),
                supabase
                    .from("product_coverages")
                    .select("*")
                    .eq("product_id", product.product_id)
                    .eq("is_deleted", false)
                    .eq("is_default", true)
                    .maybeSingle(),
                supabase
                    .from("product_uom_conversions")
                    .select(
                        `
        product_uom_conversion_id,
        from_uom_code,
        to_uom_code,
        conversion_factor,
        allow_fractional_quantity,
        sort_order
    `,
                    )
                    .eq("product_id", product.product_id)
                    .eq("is_deleted", false)
                    .order("sort_order")
                    .order("created_at"),
            ]);

        if (valuesResult.error) throw valuesResult.error;
        if (coverageResult.error) throw coverageResult.error;
        if (conversionsResult.error) throw conversionsResult.error;

        const nextValues: Record<string, AttributeFormValue> = {};

        for (const value of valuesResult.data ?? []) {
            const multi = value.product_attribute_value_options?.map(
                (option) => option.attribute_option_id,
            );

            if (multi && multi.length > 0) {
                nextValues[value.attribute_id] = multi;
            } else if (value.selected_option_id) {
                nextValues[value.attribute_id] = value.selected_option_id;
            } else if (value.value_boolean !== null) {
                nextValues[value.attribute_id] = value.value_boolean;
            } else if (value.value_number !== null) {
                nextValues[value.attribute_id] = String(value.value_number);
            } else {
                nextValues[value.attribute_id] =
                    value.value_text ?? value.value_date ?? "";
            }
        }

        setDynamicValues(nextValues);


        if (coverageResult.data) {
            const coverage = coverageResult.data;
            setCoverageForm({
                sourceQuantity: String(coverage.source_quantity),
                sourceUom: coverage.source_uom_code,
                coverageQuantity: String(coverage.coverage_quantity),
                coverageUom: coverage.coverage_uom_code,
                minimumCoverage: coverage.minimum_coverage?.toString() ?? "",
                maximumCoverage: coverage.maximum_coverage?.toString() ?? "",
                isEstimate: coverage.is_estimate ?? true,
                notes: coverage.notes ?? "",
            });
        } else {
            setCoverageForm({
                ...emptyCoverage(),
                sourceUom: product.base_uom_code ?? "",
            });
        }

        setUomConversions(
            (conversionsResult.data ?? []).map((conversion) => ({
                id: conversion.product_uom_conversion_id,
                fromUom: conversion.from_uom_code,
                toUom: conversion.to_uom_code,
                conversionFactor: String(conversion.conversion_factor),
                allowFractionalQuantity: conversion.allow_fractional_quantity,
            })),
        );

        setShowForm(true);
    };

    const buildAttributePayload = (): Json[] =>
        effectiveAttributes.flatMap((attribute) => {
            const rawValue = dynamicValues[attribute.attribute_id];
            const hasValue = Array.isArray(rawValue)
                ? rawValue.length > 0
                : typeof rawValue === "boolean"
                    ? true
                    : String(rawValue ?? "").trim() !== "";

            if (!hasValue) return [];

            const payload: Record<string, Json | undefined> = {
                attribute_id: attribute.attribute_id,
                value_text: null,
                value_number: null,
                value_boolean: null,
                value_date: null,
                selected_option_id: null,
                option_ids: [],
            };

            if (
                attribute.data_type === "text" ||
                attribute.data_type === "long_text"
            ) {
                payload.value_text = String(rawValue).trim();
            } else if (attribute.data_type === "number") {
                const numericValue = Number(rawValue);
                if (!Number.isFinite(numericValue)) {
                    throw new Error(
                        `${attribute.effective_label} must be a valid number.`,
                    );
                }
                payload.value_number = numericValue;
            } else if (attribute.data_type === "boolean") {
                payload.value_boolean = Boolean(rawValue);
            } else if (attribute.data_type === "date") {
                payload.value_date = String(rawValue);
            } else if (attribute.data_type === "select") {
                payload.selected_option_id = String(rawValue);
            } else if (attribute.data_type === "multi_select") {
                payload.option_ids = rawValue as string[];
            }

            return [payload as Json];
        });

    const buildUomConversionPayload = (): Json[] => {
        const seenFromUoms = new Set<string>();

        return uomConversions.map((conversion, index) => {
            const fromUom = conversion.fromUom.trim();
            const toUom = conversion.toUom.trim();
            const factor = Number(conversion.conversionFactor);

            if (!fromUom || !toUom) {
                throw new Error(
                    `Conversion ${index + 1}: From UOM and To UOM are required.`,
                );
            }
            if (fromUom === toUom) {
                throw new Error(
                    `Conversion ${index + 1}: From UOM and To UOM must be different.`,
                );
            }
            if (fromUom === baseUom) {
                throw new Error(
                    `Conversion ${index + 1}: Base UOM does not require a conversion.`,
                );
            }
            if (toUom !== baseUom) {
                throw new Error(
                    `Conversion ${index + 1}: To UOM must be the selected Base UOM (${baseUom}).`,
                );
            }
            if (!Number.isFinite(factor) || factor <= 0) {
                throw new Error(
                    `Conversion ${index + 1}: Conversion Factor must be greater than zero.`,
                );
            }
            if (seenFromUoms.has(fromUom)) {
                throw new Error(
                    `Only one conversion is allowed for From UOM ${fromUom}.`,
                );
            }
            seenFromUoms.add(fromUom);

            return {
                from_uom_code: fromUom,
                to_uom_code: toUom,
                conversion_factor: factor,
                allow_fractional_quantity: conversion.allowFractionalQuantity,
                sort_order: (index + 1) * 10,
                is_active: true,
            } as Json;
        });
    };

    const buildCoveragePayload = (): Json[] => {
        if (!usesCoverage) return [];

        const sourceQuantity = Number(coverageForm.sourceQuantity || 1);
        const coverageQuantity = Number(coverageForm.coverageQuantity);

        if (!coverageForm.sourceUom || !coverageForm.coverageUom) {
            throw new Error("Coverage Source UOM and Coverage UOM are required.");
        }
        if (!Number.isFinite(sourceQuantity) || sourceQuantity <= 0) {
            throw new Error("Coverage Source Quantity must be greater than zero.");
        }
        if (!Number.isFinite(coverageQuantity) || coverageQuantity <= 0) {
            throw new Error("Coverage Quantity must be greater than zero.");
        }

        const minimumCoverage = numberOrNull(coverageForm.minimumCoverage);
        const maximumCoverage = numberOrNull(coverageForm.maximumCoverage);

        if (minimumCoverage !== null && (!Number.isFinite(minimumCoverage) || minimumCoverage <= 0)) {
            throw new Error("Minimum Coverage must be greater than zero.");
        }
        if (maximumCoverage !== null && (!Number.isFinite(maximumCoverage) || maximumCoverage <= 0)) {
            throw new Error("Maximum Coverage must be greater than zero.");
        }
        if (
            minimumCoverage !== null &&
            maximumCoverage !== null &&
            minimumCoverage > maximumCoverage
        ) {
            throw new Error("Minimum Coverage cannot be greater than Maximum Coverage.");
        }
        if (minimumCoverage !== null && coverageQuantity < minimumCoverage) {
            throw new Error("Coverage Quantity cannot be less than Minimum Coverage.");
        }
        if (maximumCoverage !== null && coverageQuantity > maximumCoverage) {
            throw new Error("Coverage Quantity cannot be greater than Maximum Coverage.");
        }

        return [
            {
                source_quantity: sourceQuantity,
                source_uom_code: coverageForm.sourceUom,
                coverage_quantity: coverageQuantity,
                coverage_uom_code: coverageForm.coverageUom,
                minimum_coverage: minimumCoverage,
                maximum_coverage: maximumCoverage,
                is_estimate: coverageForm.isEstimate,
                is_default: true,
                notes: coverageForm.notes.trim() || null,
                sort_order: 10,
                is_active: true,
            } as Json,
        ];
    };

    const saveProduct = useMutation({
        mutationFn: async () => {
            if (!isAdmin) {
                throw new Error("You do not have permission to manage Products.");
            }

            const name = productName.trim();

            if (!editingProduct && !productCodeIdentity) {
                throw new Error("Create the Product Code using Product Code Builder.");
            }
            if (!name) throw new Error("Product name is required.");
            if (!categoryId) {
                throw new Error("Product Category is required.");
            }
            if (!baseUom) {
                throw new Error("Base Unit of Measure is required.");
            }

            const waste = Number(wastePercent || 0);
            if (!Number.isFinite(waste) || waste < 0 || waste > 100) {
                throw new Error("Default Waste Percent must be between 0 and 100.");
            }

            for (const attribute of effectiveAttributes) {
                const value = dynamicValues[attribute.attribute_id];
                const missing = Array.isArray(value)
                    ? value.length === 0
                    : typeof value === "boolean"
                        ? false
                        : String(value ?? "").trim() === "";

                if (attribute.is_required && missing) {
                    throw new Error(`${attribute.effective_label} is required.`);
                }
            }

            const serviceItem = productType === "Service";
            const productPayload: Record<string, Json | undefined> = {
                product_name: name,
                category_id: categoryId,
                product_type: productType,
                description: description.trim() || null,
                search_keywords: searchKeywords.trim() || null,
                base_uom_code: baseUom,
                default_purchase_uom_code: purchaseUom || baseUom,
                default_request_uom_code: requestUom || baseUom,
                default_sales_uom_code: salesUom || baseUom,
                default_waste_percent: waste,
                uses_coverage: usesCoverage,
                is_stock_item: !serviceItem,
                is_service_item: serviceItem,
                is_active: isActive,
                variant_name:
                    productCodeIdentity?.variantName ??
                    editingProduct?.variant_name ??
                    "Standard",
                variant_description:
                    productCodeIdentity?.variantDescription ??
                    editingProduct?.variant_description ??
                    null,
            };

            if (!editingProduct && productCodeIdentity) {
                productPayload.product_code_category_variant_id =
                    productCodeIdentity.categoryVariantId;
                productPayload.product_code_type_id =
                    productCodeIdentity.productCodeTypeId;
                productPayload.product_code_size_rule_id =
                    productCodeIdentity.sizeRuleId;
                productPayload.product_colour_id = productCodeIdentity.colourId;
                productPayload.first_size_value = productCodeIdentity.firstValue;
                productPayload.second_size_value = productCodeIdentity.secondValue;
                productPayload.product_code_variant_number =
                    productCodeIdentity.variantNumber;
            }

            const rpcArguments = {
                p_product: productPayload as Json,
                p_uom_conversions: buildUomConversionPayload() as Json,
                p_coverages: buildCoveragePayload() as Json,
                p_attributes: buildAttributePayload() as Json,
            };

            if (editingProduct) {
                const { error } = await supabase.rpc("update_product_atomic", {
                    p_product_id: editingProduct.product_id,
                    ...rpcArguments,
                });
                if (error) throw error;
            } else {
                const { data, error } = await supabase.rpc(
                    "create_product_atomic",
                    rpcArguments,
                );
                if (error) throw error;

                const createdProduct = data?.[0];
                if (!createdProduct?.product_id) {
                    throw new Error(
                        "Product was created but no Product ID was returned.",
                    );
                }
            }
        },
        onSuccess: () => {
            toast.success(
                editingProduct
                    ? "Product updated successfully."
                    : "Product created successfully.",
            );
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({
                queryKey: ["products-for-stock-requests"],
            });
            queryClient.invalidateQueries({
                queryKey: ["products-for-purchase-orders"],
            });
            setShowForm(false);
            resetForm();
        },
        onError: (error) => toast.error(error.message),
    });

    const toggleStatus = useMutation({
        mutationFn: async (product: ProductRow) => {
            if (!isAdmin) {
                throw new Error("You do not have permission to manage Products.");
            }

            if (!product.is_active) {
                const { error } = await supabase.rpc(
                    "assert_product_required_attributes_complete",
                    { p_product_id: product.product_id },
                );
                if (error) throw error;
            }

            const { error } = await supabase
                .from("products")
                .update({ is_active: !product.is_active })
                .eq("product_id", product.product_id);

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Product status updated.");
            queryClient.invalidateQueries({ queryKey: ["products"] });
        },
        onError: (error) => toast.error(error.message),
    });

    const setDynamicValue = (attributeId: string, value: AttributeFormValue) => {
        setDynamicValues((current) => ({
            ...current,
            [attributeId]: value,
        }));
    };

    const exportRows = filteredProducts.map((product) => [
        product.product_code,
        product.product_name,
        product.product_categories?.category_name ?? "",
        product.product_type,
        product.base_uom_code ?? "",
        product.is_stock_item ? "Yes" : "No",
        product.is_service_item ? "Yes" : "No",
        product.is_active ? "Active" : "Inactive",
    ]);

    const exportCsv = () => {
        const headers = [
            "Product Code",
            "Product Name",
            "Category",
            "Product Type",
            "Base UOM",
            "Stock Item",
            "Service Item",
            "Status",
        ];

        const content = [headers, ...exportRows]
            .map((row) => row.map(escapeCsv).join(","))
            .join("\n");

        const blob = new Blob(["\ufeff" + content], {
            type: "text/csv;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "REDS_Products.csv";
        anchor.click();
        URL.revokeObjectURL(url);
    };

    const exportExcel = () => {
        const rows = exportRows
            .map(
                (row) =>
                    `<tr>${row.map((cell) => `<td>${String(cell)}</td>`).join("")}</tr>`,
            )
            .join("");

        const html = `<table><tr><th>Product Code</th><th>Product Name</th><th>Category</th><th>Product Type</th><th>Base UOM</th><th>Stock Item</th><th>Service Item</th><th>Status</th></tr>${rows}</table>`;
        const blob = new Blob([html], {
            type: "application/vnd.ms-excel",
        });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "REDS_Products.xls";
        anchor.click();
        URL.revokeObjectURL(url);
    };

    const printProducts = () => {
        const body = filteredProducts
            .map(
                (product) =>
                    `<tr><td>${product.product_code}</td><td>${product.product_name}</td><td>${product.product_categories?.category_name ?? "-"}</td><td>${product.product_type}</td><td>${product.base_uom_code ?? "-"}</td><td>${product.is_active ? "Active" : "Inactive"}</td></tr>`,
            )
            .join("");

        const win = window.open("", "_blank");
        if (!win) return;

        win.document.write(`
      <html><head><title>REDS Products</title>
      <style>body{font-family:Arial;padding:24px}h1{color:#9E4B4B}table{border-collapse:collapse;width:100%}th{background:#9E4B4B;color:white}th,td{border:1px solid #B98A8A;padding:8px;text-align:left}</style>
      </head><body><h1>REDS Products</h1>
      <table><thead><tr><th>Code</th><th>Name</th><th>Category</th><th>Type</th><th>UOM</th><th>Status</th></tr></thead><tbody>${body}</tbody></table>
      </body></html>
    `);
        win.document.close();
        win.print();
    };

    const renderDynamicField = (attribute: EffectiveAttribute) => {
        const value = dynamicValues[attribute.attribute_id];

        if (attribute.data_type === "boolean") {
            return (
                <label className="flex h-11 items-center gap-3 rounded-xl border border-[#E5E7EB] bg-[#F7F9FB] px-3 text-sm font-semibold">
                    <input
                        type="checkbox"
                        checked={value === true}
                        onChange={(event) =>
                            setDynamicValue(attribute.attribute_id, event.target.checked)
                        }
                        className="h-4 w-4 rounded border-slate-300 text-red-600"
                    />
                    {value === true ? "Yes" : "No"}
                </label>
            );
        }

        if (attribute.data_type === "select") {
            const options = attributeOptions
                .filter((option) => option.attribute_id === attribute.attribute_id)
                .sort((a, b) => a.option_label.localeCompare(b.option_label, "en-AU"));
            const selectedValue = typeof value === "string" ? value : "";

            if (options.length > 8) {
                return (
                    <SearchablePicker
                        value={selectedValue}
                        onChange={(next) => setDynamicValue(attribute.attribute_id, next)}
                        options={options.map((option) => ({
                            value: option.attribute_option_id,
                            label: option.option_label,
                            searchText: `${option.option_code} ${option.option_label}`,
                            description: option.option_code,
                        }))}
                        placeholder={`Select ${attribute.effective_label}`}
                        searchPlaceholder={`Search ${attribute.effective_label.toLowerCase()}...`}
                        emptyText="No matching options found."
                        allowClear={!attribute.is_required}
                    />
                );
            }

            return (
                <Select
                    value={selectedValue || undefined}
                    onValueChange={(next) =>
                        setDynamicValue(
                            attribute.attribute_id,
                            next === "__none__" ? "" : next,
                        )
                    }
                >
                    <SelectTrigger className={FIELD_CLASS}>
                        <SelectValue placeholder={`Select ${attribute.effective_label}`} />
                    </SelectTrigger>
                    <SelectContent>
                        {!attribute.is_required ? (
                            <SelectItem value="__none__">— Clear selection —</SelectItem>
                        ) : null}
                        {options.map((option) => (
                            <SelectItem key={option.attribute_option_id} value={option.attribute_option_id}>
                                {option.option_label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );
        }

        if (attribute.data_type === "multi_select") {
            const selected = Array.isArray(value) ? value : [];
            return (
                <div className="grid gap-2 rounded-xl border border-slate-200 p-3 sm:grid-cols-2">
                    {attributeOptions
                        .filter((option) => option.attribute_id === attribute.attribute_id)
                        .map((option) => (
                            <label
                                key={option.attribute_option_id}
                                className="flex items-center gap-2 text-sm"
                            >
                                <input
                                    type="checkbox"
                                    checked={selected.includes(option.attribute_option_id)}
                                    onChange={(event) => {
                                        const next = event.target.checked
                                            ? [...selected, option.attribute_option_id]
                                            : selected.filter(
                                                (id) => id !== option.attribute_option_id,
                                            );
                                        setDynamicValue(attribute.attribute_id, next);
                                    }}
                                    className="h-4 w-4 rounded border-slate-300 text-red-600"
                                />
                                {option.option_label}
                            </label>
                        ))}
                </div>
            );
        }

        if (attribute.data_type === "long_text") {
            return (
                <textarea
                    rows={3}
                    value={typeof value === "string" ? value : ""}
                    onChange={(event) =>
                        setDynamicValue(attribute.attribute_id, event.target.value)
                    }
                    className={TEXTAREA_CLASS}
                />
            );
        }

        return (
            <Input
                className={FIELD_CLASS}
                type={
                    attribute.data_type === "number"
                        ? "number"
                        : attribute.data_type === "date"
                            ? "date"
                            : "text"
                }
                value={typeof value === "string" ? value : ""}
                onChange={(event) =>
                    setDynamicValue(attribute.attribute_id, event.target.value)
                }
                placeholder={attribute.effective_label}
            />
        );
    };

    return (
        <div className="space-y-6 p-4 sm:p-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                    <Box className="h-8 w-8 text-red-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                            Products
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Manage materials, services, units, coverage and category-driven
                            specifications.
                        </p>
                    </div>
                </div>

                {isAdmin ? (
                    <Button
                        onClick={() => {
                            resetForm();
                            setShowForm(true);
                        }}
                        className="h-11 w-full gap-2 rounded-xl bg-red-600 font-bold hover:bg-red-700 sm:w-auto"
                    >
                        <Plus className="h-5 w-5" />
                        Add Product
                    </Button>
                ) : null}
            </header>

            <div className="grid grid-cols-3 gap-2 sm:gap-4">
                {[
                    ["Total", summary.total, "text-slate-900"],
                    ["Active", summary.active, "text-green-600"],
                    ["Inactive", summary.inactive, "text-slate-500"],
                ].map(([label, value, colour]) => (
                    <div
                        key={String(label)}
                        className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4"
                    >
                        <p className="text-xs text-slate-500 sm:text-sm">{label}</p>
                        <p className={`mt-2 text-2xl font-bold sm:text-3xl ${colour}`}>
                            {value}
                        </p>
                    </div>
                ))}
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 xl:grid-cols-[minmax(240px,1fr)_220px_200px_180px_auto]">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                        <Input
                            className={`${FIELD_CLASS} pl-10`}
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Search by product name, code, category or keyword..."
                        />
                    </div>

                    <SearchablePicker
                        value={categoryFilter === "all" ? "" : categoryFilter}
                        onChange={(value) => setCategoryFilter(value || "all")}
                        options={categoryFilterOptions}
                        placeholder="All Categories"
                        searchPlaceholder="Search category name, code or path..."
                        emptyText="No matching Product Category found."
                        allowClear
                    />

                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className={FIELD_CLASS}>
                            <SelectValue placeholder="Product Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {PRODUCT_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                    {type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={statusFilter}
                        onValueChange={(value) => setStatusFilter(value as StatusFilter)}
                    >
                        <SelectTrigger className={FIELD_CLASS}>
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active Only</SelectItem>
                            <SelectItem value="inactive">Inactive Only</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            title="Print / PDF"
                            onClick={printProducts}
                        >
                            <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            title="CSV"
                            onClick={exportCsv}
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            title="Excel"
                            onClick={exportExcel}
                        >
                            <FileSpreadsheet className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </section>

            <section className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
                <div className="grid grid-cols-12 border-b bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                    <div className="col-span-3">Code</div>
                    <div className="col-span-3">Product</div>
                    <div className="col-span-2">Category</div>
                    <div className="col-span-1">Type / UOM</div>
                    <div className="col-span-1 text-right">Status</div>
                    <div className="col-span-2 text-right">Actions</div>
                </div>

                {isLoading ? (
                    <div className="p-8 text-center text-slate-500">
                        Loading Products...
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        No Products found.
                    </div>
                ) : (
                    filteredProducts.map((product) => (
                        <div
                            key={product.product_id}
                            className="grid grid-cols-12 items-center border-b px-4 py-4 hover:bg-slate-50"
                        >
                            <div className="col-span-3 pr-4 font-mono text-sm font-bold text-slate-900">
                                <span className="block whitespace-nowrap">
                                    {product.product_code}
                                </span>
                            </div>
                            <div className="col-span-3 pr-4">
                                <p className="font-semibold text-slate-900">
                                    {product.product_name}
                                </p>
                                <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                                    {product.description || "-"}
                                </p>
                            </div>
                            <div className="col-span-2 pr-4 text-sm text-slate-700">
                                {product.product_categories?.category_name ?? "-"}
                            </div>
                            <div className="col-span-1">
                                <p className="text-sm font-semibold text-slate-800">
                                    {product.product_type}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {product.base_uom_code ?? "-"}
                                </p>
                            </div>
                            <div className="col-span-1 flex justify-end">
                                <ActiveStatusBadge isActive={product.is_active} />
                            </div>
                            <div className="col-span-2 flex justify-end gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        setViewingProductId(product.product_id);
                                        setShowView(true);
                                    }}
                                    title="View Product"
                                >
                                    <Eye className="h-4 w-4" />
                                </Button>
                                {isAdmin ? (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                                loadProductDetails(product).catch((error) =>
                                                    toast.error(error.message),
                                                )
                                            }
                                            title="Edit Product"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => toggleStatus.mutate(product)}
                                            title={product.is_active ? "Set Inactive" : "Set Active"}
                                        >
                                            <Power className="h-4 w-4" />
                                        </Button>
                                    </>
                                ) : null}
                            </div>
                        </div>
                    ))
                )}
            </section>

            <section className="space-y-3 lg:hidden">
                {filteredProducts.map((product) => (
                    <article
                        key={product.product_id}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-base font-bold text-slate-900">
                                    {product.product_name}
                                </p>
                                <p className="mt-1 break-all font-mono text-sm font-bold text-slate-900">
                                    {product.product_code}
                                </p>
                            </div>
                            <ActiveStatusBadge isActive={product.is_active} />
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-xl bg-slate-50 p-3">
                                <p className="text-xs text-slate-500">Category</p>
                                <p className="mt-1 font-semibold">
                                    {product.product_categories?.category_name ?? "-"}
                                </p>
                            </div>
                            <div className="rounded-xl bg-slate-50 p-3">
                                <p className="text-xs text-slate-500">Type / UOM</p>
                                <p className="mt-1 font-semibold">
                                    {product.product_type} · {product.base_uom_code ?? "-"}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 flex justify-end gap-2 border-t border-slate-200 pt-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setViewingProductId(product.product_id);
                                    setShowView(true);
                                }}
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                            </Button>
                            {isAdmin ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        loadProductDetails(product).catch((error) =>
                                            toast.error(error.message),
                                        )
                                    }
                                >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                </Button>
                            ) : null}
                        </div>
                    </article>
                ))}
            </section>
            <ProductCodeBuilderModal
                open={showCodeBuilder}
                onOpenChange={setShowCodeBuilder}
                onConfirm={(value) => {
                    setProductCodeIdentity(value);

                    setProductCode(value.previewCode);
                }}
            />
            <Dialog
                open={showForm}
                onOpenChange={(open) => {
                    setShowForm(open);
                    if (!open) resetForm();
                }}
            >
                <DialogContent className="max-h-[90vh] w-[calc(100vw-24px)] max-w-5xl overflow-hidden rounded-2xl p-0">
                    <DialogHeader className="border-b border-[#E5E7EB] px-4 py-4 sm:px-6">
                        <DialogTitle>
                            {editingProduct ? "Edit Product" : "Add Product"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="max-h-[calc(90vh-72px)] space-y-6 overflow-y-auto px-4 py-5 sm:px-6">
                        <section className="rounded-2xl border border-[#E5E7EB] bg-[#FCFAFA] p-4">
                            <SectionHeading number={1} title="Product Information" helper="Basic identity and classification used across REDS." />
                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Product Code *</Label>

                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <Input
                                            value={productCode}
                                            readOnly
                                            placeholder="Use Product Code Builder"
                                            className="cursor-not-allowed bg-slate-100 font-mono"
                                        />

                                        {!editingProduct ? (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setShowCodeBuilder(true)}
                                                className="h-10 shrink-0 rounded-xl"
                                            >
                                                {productCodeIdentity
                                                    ? "Change Product Code"
                                                    : "Build Product Code"}
                                            </Button>
                                        ) : null}
                                    </div>

                                    <p className="text-xs text-slate-500">
                                        {editingProduct
                                            ? "Product Code is permanent and cannot be changed."
                                            : productCodeIdentity
                                                ? "Product Code has been previewed. It will be reserved only when the Product is saved."
                                                : "Product Code must be created using controlled Product Code master data."}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Product Name *</Label>
                                    <Input
                                        className={FIELD_CLASS}
                                        value={productName}
                                        onChange={(event) => setProductName(event.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Product Category *</Label>

                                    <div
                                        ref={categoryComboboxRef}
                                        className="relative"
                                    >
                                        <button
                                            type="button"
                                            aria-haspopup="listbox"
                                            aria-expanded={categoryComboboxOpen}
                                            onClick={() => {
                                                setCategoryComboboxOpen((current) => !current);
                                                setCategorySearch("");
                                            }}
                                            className={`${FIELD_CLASS} flex w-full items-center justify-between px-3 text-left`}
                                        >
                                            <span
                                                className={
                                                    selectedCategory
                                                        ? "truncate text-[#111827]"
                                                        : "truncate text-[#6B7280]"
                                                }
                                            >
                                                {selectedCategory
                                                    ? categoryPath.get(selectedCategory.category_id) ??
                                                    selectedCategory.category_name
                                                    : "Select Category"}
                                            </span>

                                            <ChevronDown
                                                className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${categoryComboboxOpen ? "rotate-180" : ""
                                                    }`}
                                            />
                                        </button>

                                        {categoryComboboxOpen ? (
                                            <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-xl">
                                                <div className="border-b border-[#E5E7EB] p-3">
                                                    <div className="relative">
                                                        <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                                        <Input
                                                            autoFocus
                                                            className={`${FIELD_CLASS} pl-10`}
                                                            value={categorySearch}
                                                            onChange={(event) =>
                                                                setCategorySearch(event.target.value)
                                                            }
                                                            placeholder="Type at least 2 letters..."
                                                        />
                                                    </div>

                                                    <p className="mt-2 text-xs text-slate-500">
                                                        Search by category name, code or full category path.
                                                    </p>
                                                </div>

                                                <div
                                                    role="listbox"
                                                    className="max-h-64 overflow-y-auto p-1"
                                                >
                                                    {filteredCategoryOptions.length === 0 ? (
                                                        <div className="px-3 py-6 text-center text-sm text-slate-500">
                                                            No matching Product Category found.
                                                        </div>
                                                    ) : (
                                                        filteredCategoryOptions.map((category) => {
                                                            const path =
                                                                categoryPath.get(category.category_id) ??
                                                                category.category_name;
                                                            const selected =
                                                                category.category_id === categoryId;

                                                            return (
                                                                <button
                                                                    key={category.category_id}
                                                                    type="button"
                                                                    role="option"
                                                                    aria-selected={selected}
                                                                    onClick={() => {
                                                                        setCategoryId(category.category_id);
                                                                        setDynamicValues({});
                                                                        setCategorySearch("");
                                                                        setCategoryComboboxOpen(false);
                                                                    }}
                                                                    className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left hover:bg-[#FBF1F1] focus:bg-[#FBF1F1] focus:outline-none"
                                                                >
                                                                    <Check
                                                                        className={`mt-0.5 h-4 w-4 shrink-0 ${selected
                                                                            ? "text-[#9E4B4B]"
                                                                            : "text-transparent"
                                                                            }`}
                                                                    />

                                                                    <span className="min-w-0">
                                                                        <span className="block break-words text-sm font-semibold text-slate-900">
                                                                            {path}
                                                                        </span>
                                                                        <span className="mt-0.5 block font-mono text-xs text-slate-500">
                                                                            {category.category_code}
                                                                        </span>
                                                                    </span>
                                                                </button>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>

                                    <p className="text-xs text-slate-500">
                                        Categories are arranged by Parent → Child. Type two letters to narrow the list.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Product Type *</Label>
                                    <Select
                                        value={productType}
                                        onValueChange={(value) => {
                                            const next = value as ProductType;
                                            setProductType(next);

                                            const service = next === "Service";

                                            setIsServiceItem(service);
                                            setIsStockItem(!service);
                                        }}
                                    >
                                        <SelectTrigger className={FIELD_CLASS}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PRODUCT_TYPES.map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {type}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label>Description</Label>
                                    <textarea
                                        rows={3}
                                        value={description}
                                        onChange={(event) => setDescription(event.target.value)}
                                        className={TEXTAREA_CLASS}
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label>Search Keywords</Label>
                                    <Input
                                        className={FIELD_CLASS}
                                        value={searchKeywords}
                                        onChange={(event) => setSearchKeywords(event.target.value)}
                                        placeholder="Example: oak engineered timber natural"
                                    />
                                </div>
                            </div>
                        </section>
                        <section className="rounded-2xl border border-[#E5E7EB] bg-[#FCFAFA] p-4">
                            <SectionHeading number={2} title="Product Code Identity" helper="Controlled product code identity. Immutable after creation." />

                            {!productCode ? (
                                <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                                    No Product Code has been selected.
                                </div>
                            ) : (
                                <div className="mt-4 space-y-4">
                                    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                                        <p className="text-xs font-bold uppercase tracking-wide text-red-700">
                                            Product Code
                                        </p>
                                        <p className="mt-2 break-all font-mono text-lg font-black text-slate-900">
                                            {productCode}
                                        </p>
                                    </div>

                                    {productCodeIdentity ? (
                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                            <div className="rounded-xl bg-slate-50 p-3">
                                                <p className="text-xs text-slate-500">Family</p>
                                                <p className="mt-1 font-semibold">
                                                    {productCodeIdentity.familyCode} —{" "}
                                                    {productCodeIdentity.familyName}
                                                </p>
                                            </div>

                                            <div className="rounded-xl bg-slate-50 p-3">
                                                <p className="text-xs text-slate-500">
                                                    Category Variant
                                                </p>
                                                <p className="mt-1 font-semibold">
                                                    {productCodeIdentity.fullCategoryCode} —{" "}
                                                    {productCodeIdentity.categoryVariantName}
                                                </p>
                                            </div>

                                            <div className="rounded-xl bg-slate-50 p-3">
                                                <p className="text-xs text-slate-500">Code Type</p>
                                                <p className="mt-1 font-semibold">
                                                    {productCodeIdentity.typeCode} —{" "}
                                                    {productCodeIdentity.typeName}
                                                </p>
                                            </div>

                                            <div className="rounded-xl bg-slate-50 p-3">
                                                <p className="text-xs text-slate-500">Size</p>
                                                <p className="mt-1 font-semibold">
                                                    {productCodeIdentity.sizeToken}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {productCodeIdentity.sizeRuleName}
                                                </p>
                                            </div>

                                            <div className="rounded-xl bg-slate-50 p-3">
                                                <p className="text-xs text-slate-500">Colour</p>
                                                <p className="mt-1 font-semibold">
                                                    {productCodeIdentity.colourCode} —{" "}
                                                    {productCodeIdentity.colourName}
                                                </p>
                                            </div>

                                            <div className="rounded-xl bg-slate-50 p-3">
                                                <p className="text-xs text-slate-500">Variant Code</p>
                                                <p className="mt-1 font-semibold">
                                                    {productCodeIdentity.variantCode}
                                                </p>
                                            </div>
                                        </div>
                                    ) : null}

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="rounded-xl bg-slate-50 p-3">
                                            <p className="text-xs text-slate-500">Variant Name</p>
                                            <p className="mt-1 font-semibold">
                                                {productCodeIdentity?.variantName ?? "-"}
                                            </p>
                                        </div>

                                        <div className="rounded-xl bg-slate-50 p-3">
                                            <p className="text-xs text-slate-500">
                                                Variant Description
                                            </p>
                                            <p className="mt-1 whitespace-pre-wrap text-sm">
                                                {productCodeIdentity?.variantDescription ?? "-"}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="text-xs text-amber-700">
                                        Product Code identity becomes permanent after Product
                                        creation.
                                    </p>
                                </div>
                            )}
                        </section>
                        <section className="rounded-2xl border border-[#E5E7EB] bg-[#FCFAFA] p-4">
                            <SectionHeading number={3} title="Units and UOM" helper="Select the base unit and default transaction units." />
                            <div className="mt-4 grid gap-4 md:grid-cols-4">
                                <div className="space-y-2">
                                    <Label>Base UOM *</Label>
                                    <SearchablePicker
                                        value={baseUom}
                                        onChange={(value) => {
                                            setBaseUom(value);
                                            setUomConversions((current) =>
                                                current.map((conversion) => ({ ...conversion, toUom: value })),
                                            );
                                            if (!coverageForm.coverageUom) {
                                                setCoverageForm((current) => ({ ...current, coverageUom: value }));
                                            }
                                        }}
                                        options={uomOptions.filter((option) => units.find((unit) => unit.uom_code === option.value)?.is_active || option.value === baseUom)}
                                        placeholder={loadingUnits ? "Loading UOM..." : "Select Base UOM"}
                                        searchPlaceholder="Search UOM code, name, symbol or category..."
                                        emptyText="No active Units of Measure configured."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Purchase UOM</Label>
                                    <SearchablePicker
                                        value={purchaseUom}
                                        onChange={(value) => {
                                            setPurchaseUom(value);
                                            if (value && !coverageForm.sourceUom) {
                                                setCoverageForm((current) => ({ ...current, sourceUom: value }));
                                            }
                                        }}
                                        options={uomOptions.filter((option) => units.find((unit) => unit.uom_code === option.value)?.is_active || option.value === purchaseUom)}
                                        placeholder="Select Purchase UOM"
                                        searchPlaceholder="Search UOM code, name, symbol or category..."
                                        emptyText="No active Units of Measure configured."
                                        allowClear
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Request UOM</Label>
                                    <SearchablePicker
                                        value={requestUom}
                                        onChange={setRequestUom}
                                        options={uomOptions.filter((option) => units.find((unit) => unit.uom_code === option.value)?.is_active || option.value === requestUom)}
                                        placeholder="Select Request UOM"
                                        searchPlaceholder="Search UOM code, name, symbol or category..."
                                        emptyText="No active Units of Measure configured."
                                        allowClear
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Sales UOM</Label>
                                    <SearchablePicker
                                        value={salesUom}
                                        onChange={setSalesUom}
                                        options={uomOptions.filter((option) => units.find((unit) => unit.uom_code === option.value)?.is_active || option.value === salesUom)}
                                        placeholder="Select Sales UOM"
                                        searchPlaceholder="Search UOM code, name, symbol or category..."
                                        emptyText="No active Units of Measure configured."
                                        allowClear
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Default Waste %</Label>
                                    <Input
                                        className={FIELD_CLASS}
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={wastePercent}
                                        onChange={(event) => setWastePercent(event.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select
                                        value={isActive ? "active" : "inactive"}
                                        onValueChange={(value) => setIsActive(value === "active")}
                                    >
                                        <SelectTrigger className={FIELD_CLASS}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-xl border border-[#E5E7EB] bg-white p-3">
                                    <p className="text-xs font-medium text-slate-500">Stock Item</p>
                                    <p className="mt-1 font-bold text-slate-900">{productType === "Service" ? "No" : "Yes"}</p>
                                    <p className="mt-1 text-xs text-slate-500">Derived automatically from Product Type.</p>
                                </div>
                                <div className="rounded-xl border border-[#E5E7EB] bg-white p-3">
                                    <p className="text-xs font-medium text-slate-500">Service Item</p>
                                    <p className="mt-1 font-bold text-slate-900">{productType === "Service" ? "Yes" : "No"}</p>
                                    <p className="mt-1 text-xs text-slate-500">Derived automatically from Product Type.</p>
                                </div>
                                <label className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white p-3 text-sm font-semibold">
                                    <input
                                        type="checkbox"
                                        checked={usesCoverage}
                                        onChange={(event) => setUsesCoverage(event.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300 text-red-600"
                                    />
                                    <span>
                                        <span className="block">Uses Coverage / Yield</span>
                                        <span className="mt-1 block text-xs font-normal text-slate-500">Enable structured coverage information for this Product.</span>
                                    </span>
                                </label>
                            </div>
                        </section>

                        <section className="rounded-2xl border border-[#E5E7EB] bg-[#FCFAFA] p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <SectionHeading number={4} title="UOM Conversions" helper="Define how purchasing, requesting or selling units convert to the Base UOM." />
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        setUomConversions((current) => [
                                            ...current,
                                            createEmptyUomConversion(),
                                        ])
                                    }
                                    className="h-10 w-full rounded-xl sm:w-auto"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Conversion
                                </Button>
                            </div>

                            {uomConversions.length === 0 ? (
                                <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                                    No UOM Conversions added. Add a conversion when one unit
                                    represents a quantity of another unit.
                                </div>
                            ) : (
                                <div className="mt-4 space-y-3">
                                    {uomConversions.map((conversion, index) => (
                                        <div
                                            key={conversion.id}
                                            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                                        >
                                            <div className="mb-4 flex items-center justify-between gap-3">
                                                <p className="text-sm font-bold text-slate-800">
                                                    Conversion {index + 1}
                                                </p>

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setUomConversions((current) =>
                                                            current.filter(
                                                                (item) => item.id !== conversion.id,
                                                            ),
                                                        )
                                                    }
                                                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                                >
                                                    Remove
                                                </Button>
                                            </div>

                                            <div className="grid gap-4 md:grid-cols-4">
                                                <div className="space-y-2">
                                                    <Label>From UOM *</Label>
                                                    <SearchablePicker
                                                        value={conversion.fromUom}
                                                        onChange={(value) =>
                                                            setUomConversions((current) =>
                                                                current.map((item) =>
                                                                    item.id === conversion.id
                                                                        ? { ...item, fromUom: value, toUom: baseUom }
                                                                        : item,
                                                                ),
                                                            )
                                                        }
                                                        options={uomOptions.filter((option) => {
                                                            const unit = units.find((item) => item.uom_code === option.value);
                                                            const usedByAnother = uomConversions.some(
                                                                (item) => item.id !== conversion.id && item.fromUom === option.value,
                                                            );
                                                            return Boolean(unit?.is_active) && option.value !== baseUom && !usedByAnother;
                                                        })}
                                                        placeholder="Select From UOM"
                                                        searchPlaceholder="Search UOM code, name, symbol or category..."
                                                        emptyText="No available Units of Measure found."
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Conversion Factor *</Label>
                                                    <Input
                                                        className={FIELD_CLASS}
                                                        type="number"
                                                        min="0"
                                                        step="0.0001"
                                                        value={conversion.conversionFactor}
                                                        onChange={(event) =>
                                                            setUomConversions((current) =>
                                                                current.map((item) =>
                                                                    item.id === conversion.id
                                                                        ? {
                                                                            ...item,
                                                                            conversionFactor: event.target.value,
                                                                        }
                                                                        : item,
                                                                ),
                                                            )
                                                        }
                                                        placeholder="Example: 20"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>To Base UOM *</Label>
                                                    <Input
                                                        value={baseUom || "Select Base UOM first"}
                                                        readOnly
                                                        className="h-11 cursor-not-allowed rounded-xl border-[#E5E7EB] bg-[#F1F3F5] font-semibold text-[#6B7280]"
                                                    />
                                                    <p className="text-xs text-slate-500">To UOM is controlled by the selected Base UOM.</p>
                                                </div>

                                                <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold md:self-end">
                                                    <input
                                                        type="checkbox"
                                                        checked={conversion.allowFractionalQuantity}
                                                        onChange={(event) =>
                                                            setUomConversions((current) =>
                                                                current.map((item) =>
                                                                    item.id === conversion.id
                                                                        ? {
                                                                            ...item,
                                                                            allowFractionalQuantity:
                                                                                event.target.checked,
                                                                        }
                                                                        : item,
                                                                ),
                                                            )
                                                        }
                                                        className="h-4 w-4 rounded border-slate-300 text-red-600"
                                                    />
                                                    Allow fractional quantity
                                                </label>
                                            </div>

                                            <p className="mt-3 text-xs text-slate-500">
                                                Example: 1 bag × 20 = 20 kg. Enter From UOM = bag,
                                                Conversion Factor = 20, To UOM = kg.
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {usesCoverage ? (
                            <section className="rounded-2xl border border-[#E5E7EB] bg-[#FCFAFA] p-4">
                                <SectionHeading number={5} title="Coverage / Yield" helper="Store structured estimated coverage per source unit." />
                                <p className="mt-1 text-sm text-slate-500">
                                    Example: 1 box covers approximately 1.8 sqm.
                                </p>
                                <div className="mt-4 grid gap-4 md:grid-cols-4">
                                    <div className="space-y-2">
                                        <Label>Source Quantity *</Label>
                                        <Input
                                            className={FIELD_CLASS}
                                            type="number"
                                            min="0"
                                            value={coverageForm.sourceQuantity}
                                            onChange={(event) =>
                                                setCoverageForm({
                                                    ...coverageForm,
                                                    sourceQuantity: event.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Source UOM *</Label>
                                        <SearchablePicker
                                            value={coverageForm.sourceUom}
                                            onChange={(value) =>
                                                setCoverageForm({
                                                    ...coverageForm,
                                                    sourceUom: value,
                                                })
                                            }
                                            options={uomOptions.filter((option) =>
                                                units.find((unit) => unit.uom_code === option.value)?.is_active,
                                            )}
                                            placeholder="Select UOM"
                                            searchPlaceholder="Search UOM code, name, symbol or category..."
                                            emptyText="No active Units of Measure configured."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Coverage Quantity *</Label>
                                        <Input
                                            className={FIELD_CLASS}
                                            type="number"
                                            min="0"
                                            step="0.0001"
                                            value={coverageForm.coverageQuantity}
                                            onChange={(event) =>
                                                setCoverageForm({
                                                    ...coverageForm,
                                                    coverageQuantity: event.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Coverage UOM *</Label>
                                        <SearchablePicker
                                            value={coverageForm.coverageUom}
                                            onChange={(value) =>
                                                setCoverageForm({
                                                    ...coverageForm,
                                                    coverageUom: value,
                                                })
                                            }
                                            options={uomOptions.filter((option) =>
                                                units.find((unit) => unit.uom_code === option.value)?.is_active,
                                            )}
                                            placeholder="Select UOM"
                                            searchPlaceholder="Search UOM code, name, symbol or category..."
                                            emptyText="No active Units of Measure configured."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Minimum Coverage</Label>
                                        <Input
                                            className={FIELD_CLASS}
                                            type="number"
                                            value={coverageForm.minimumCoverage}
                                            onChange={(event) =>
                                                setCoverageForm({
                                                    ...coverageForm,
                                                    minimumCoverage: event.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Maximum Coverage</Label>
                                        <Input
                                            className={FIELD_CLASS}
                                            type="number"
                                            value={coverageForm.maximumCoverage}
                                            onChange={(event) =>
                                                setCoverageForm({
                                                    ...coverageForm,
                                                    maximumCoverage: event.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="space-y-4 md:col-span-4">
                                        <div className="space-y-2">
                                            <Label>Coverage Type *</Label>

                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <label
                                                    className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition ${coverageForm.isEstimate
                                                        ? "border-[#9E4B4B] bg-[#FBF1F1] text-slate-900"
                                                        : "border-[#E5E7EB] bg-[#F7F9FB] text-slate-700 hover:border-[#9E4B4B]"
                                                        }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="coverage-type"
                                                        checked={coverageForm.isEstimate}
                                                        onChange={() =>
                                                            setCoverageForm({
                                                                ...coverageForm,
                                                                isEstimate: true,
                                                            })
                                                        }
                                                        className="h-4 w-4 shrink-0 accent-[#9E4B4B]"
                                                    />

                                                    <span className="min-w-0">
                                                        <span className="block">Estimated</span>
                                                        <span className="mt-0.5 block text-xs font-normal leading-5 text-slate-500">
                                                            Coverage may vary depending on site conditions and waste.
                                                        </span>
                                                    </span>
                                                </label>

                                                <label
                                                    className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition ${!coverageForm.isEstimate
                                                        ? "border-[#9E4B4B] bg-[#FBF1F1] text-slate-900"
                                                        : "border-[#E5E7EB] bg-[#F7F9FB] text-slate-700 hover:border-[#9E4B4B]"
                                                        }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="coverage-type"
                                                        checked={!coverageForm.isEstimate}
                                                        onChange={() =>
                                                            setCoverageForm({
                                                                ...coverageForm,
                                                                isEstimate: false,
                                                            })
                                                        }
                                                        className="h-4 w-4 shrink-0 accent-[#9E4B4B]"
                                                    />

                                                    <span className="min-w-0">
                                                        <span className="block">Confirmed</span>
                                                        <span className="mt-0.5 block text-xs font-normal leading-5 text-slate-500">
                                                            Coverage is confirmed from reliable manufacturer data.
                                                        </span>
                                                    </span>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Default Coverage</Label>

                                            <div className="rounded-xl border border-[#E5E7EB] bg-[#F1F3F5] px-4 py-3">
                                                <p className="text-sm font-semibold text-slate-800">Yes</p>
                                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                                    Phase 1 supports one default Coverage / Yield record per Product.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <Label>Coverage Notes</Label>
                                        <Input
                                            className={FIELD_CLASS}
                                            value={coverageForm.notes}
                                            onChange={(event) =>
                                                setCoverageForm({
                                                    ...coverageForm,
                                                    notes: event.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                            </section>
                        ) : null}


                        {categoryId ? (
                            <section className="rounded-2xl border border-[#E5E7EB] bg-[#FCFAFA] p-4">
                                <SectionHeading number={6} title="Dynamic Attributes" helper="Category-driven product details. Required fields must be completed before activation." />

                                {loadingAttributes ? (
                                    <p className="mt-4 text-sm text-slate-500">
                                        Loading Product fields...
                                    </p>
                                ) : groupedAttributes.length === 0 ? (
                                    <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                                        This Category has no Dynamic Attributes.
                                    </p>
                                ) : (
                                    <div className="mt-4 space-y-5">
                                        {groupedAttributes.map(([sectionName, attributes]) => (
                                            <div
                                                key={sectionName}
                                                className="rounded-xl bg-slate-50 p-4"
                                            >
                                                <h4 className="font-bold text-slate-800">
                                                    {sectionName}
                                                </h4>
                                                <div className="mt-4 grid gap-4 md:grid-cols-2">
                                                    {attributes.map((attribute) => (
                                                        <div
                                                            key={attribute.attribute_id}
                                                            className={
                                                                attribute.data_type === "long_text" ||
                                                                    attribute.data_type === "multi_select"
                                                                    ? "space-y-2 md:col-span-2"
                                                                    : "space-y-2"
                                                            }
                                                        >
                                                            <Label>
                                                                {attribute.effective_label}
                                                                {attribute.is_required ? " *" : ""}
                                                                {attribute.unit_symbol
                                                                    ? ` (${attribute.unit_symbol})`
                                                                    : ""}
                                                            </Label>
                                                            {renderDynamicField(attribute)}
                                                            {attribute.effective_help_text ? (
                                                                <p className="text-xs text-slate-500">
                                                                    {attribute.effective_help_text}
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        ) : null}

                        <section className="rounded-2xl border border-[#E5E7EB] bg-[#FCFAFA] p-4">
                            <SectionHeading
                                number={7}
                                title="Review and Status"
                                helper="Confirm the product flags and status before saving."
                            />

                            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                <div className="rounded-xl border border-[#E5E7EB] bg-white p-3 text-sm">
                                    <span className="text-slate-500">Product Type</span>
                                    <p className="mt-1 font-semibold text-slate-900">
                                        {productType}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-[#E5E7EB] bg-white p-3 text-sm">
                                    <span className="text-slate-500">Base UOM</span>
                                    <p className="mt-1 font-semibold text-slate-900">
                                        {baseUom || "Not selected"}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-[#E5E7EB] bg-white p-3 text-sm">
                                    <span className="text-slate-500">Stock Item</span>
                                    <p className="mt-1 font-semibold text-slate-900">
                                        {isStockItem ? "Yes" : "No"}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Derived from Product Type.
                                    </p>
                                </div>

                                <div className="rounded-xl border border-[#E5E7EB] bg-white p-3 text-sm">
                                    <span className="text-slate-500">Service Item</span>
                                    <p className="mt-1 font-semibold text-slate-900">
                                        {isServiceItem ? "Yes" : "No"}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Derived from Product Type.
                                    </p>
                                </div>

                                <div className="rounded-xl border border-[#E5E7EB] bg-white p-3 text-sm sm:col-span-2 lg:col-span-1">
                                    <span className="text-slate-500">Status</span>
                                    <p className="mt-1 font-semibold text-slate-900">
                                        {isActive ? "Active" : "Inactive"}
                                    </p>
                                </div>
                            </div>
                        </section>

                        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setShowForm(false)}
                                className="h-11 rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => saveProduct.mutate()}
                                disabled={saveProduct.isPending || loadingAttributes}
                                className="h-11 rounded-xl bg-red-600 px-6 font-bold hover:bg-red-700"
                            >
                                {saveProduct.isPending
                                    ? "Saving..."
                                    : editingProduct
                                        ? "Update Product"
                                        : "Save Product"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <ProductDetailsDialog
                open={showView}
                onOpenChange={(open) => {
                    setShowView(open);

                    if (!open) {
                        setViewingProductId(null);
                    }
                }}
                productId={viewingProductId}
                role={role}
            />
        </div>
    );
};

export default Products;