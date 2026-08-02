import { useEffect, useMemo, useRef, useState } from "react";
import {
    ArrowDown,
    ArrowUp,
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
    Settings2,
    Trash2,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ActiveStatusBadge } from "@/components/common/ActiveStatusBadge";
import {
    EMPTY_PRODUCT_IDENTITY,
    type ProductCodeBuilderValue,
    type ProductIdentityFormValue,
    ProductIdentityStep,
    type ProductIdentityValidationState,
} from "@/components/products/ProductIdentityStep";

import { ProductDetailsDialog } from "@/components/products/ProductDetailsDialog";
import {
    ProductInlineMasterDataDialog,
    type ProductMasterTab,
} from "@/components/products/ProductInlineMasterDataDialog";

import { type AppRole, normalizeAppRole } from "@/lib/roles";
import { toast } from "sonner";

type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

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

type ProductUnitForm = {
    id: string;
    uomCode: string;
    conversionToBase: string;
    isBaseUnit: boolean;
    allowFractionalQuantity: boolean;
    barcode: string;
};

const createEmptyProductUnit = (): ProductUnitForm => ({
    id: `product-unit-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    uomCode: "",
    conversionToBase: "",
    isBaseUnit: false,
    allowFractionalQuantity: false,
    barcode: "",
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

const FIELD_CLASS =
    "h-11 rounded-xl border border-[#E5E7EB] bg-[#F7F9FB] text-[#111827] transition-colors hover:border-[#9E4B4B] focus-visible:border-[#9E4B4B] focus-visible:ring-[#9E4B4B]/20";
const TEXTAREA_CLASS =
    "min-h-24 w-full rounded-xl border border-[#E5E7EB] bg-[#F7F9FB] px-3 py-2 text-sm text-[#111827] outline-none transition hover:border-[#9E4B4B] focus:border-[#9E4B4B] focus:ring-2 focus:ring-[#9E4B4B]/20";

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
            option.searchText.toLowerCase().includes(keyword)
        );

    useEffect(() => {
        if (!open) return;
        const close = (event: MouseEvent) => {
            if (
                rootRef.current &&
                !rootRef.current.contains(event.target as Node)
            ) {
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
                <span
                    className={selected
                        ? "truncate"
                        : "truncate text-[#6B7280]"}
                >
                    {selected?.label ?? placeholder}
                </span>
                <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform ${
                        open ? "rotate-180" : ""
                    }`}
                />
            </button>

            {open
                ? (
                    <div className="absolute z-[80] mt-2 w-full min-w-[280px] overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-xl">
                        <div className="border-b border-[#E5E7EB] p-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                <Input
                                    autoFocus
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)}
                                    placeholder={searchPlaceholder}
                                    className={`${FIELD_CLASS} pl-10`}
                                />
                            </div>
                            <p className="mt-2 text-xs text-slate-500">
                                Type at least 2 letters to narrow the list.
                            </p>
                        </div>
                        <div
                            role="listbox"
                            className="max-h-64 overflow-y-auto p-1"
                        >
                            {allowClear
                                ? (
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
                                )
                                : null}
                            {filtered.length === 0
                                ? (
                                    <div className="px-3 py-6 text-center text-sm text-slate-500">
                                        {emptyText}
                                    </div>
                                )
                                : (
                                    filtered.map((option, index) => {
                                        const showGroup = option.group &&
                                            (index === 0 ||
                                                filtered[index - 1]?.group !==
                                                    option.group);
                                        return (
                                            <div key={option.value}>
                                                {showGroup
                                                    ? (
                                                        <div className="px-3 pb-1 pt-3 text-xs font-bold uppercase tracking-wide text-[#9E4B4B]">
                                                            {option.group}
                                                        </div>
                                                    )
                                                    : null}
                                                <button
                                                    type="button"
                                                    role="option"
                                                    aria-selected={option
                                                        .value === value}
                                                    onClick={() => {
                                                        onChange(option.value);
                                                        setOpen(false);
                                                        setSearch("");
                                                    }}
                                                    className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left hover:bg-[#FBF1F1] focus:bg-[#FBF1F1] focus:outline-none"
                                                >
                                                    <Check
                                                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                                                            option.value ===
                                                                    value
                                                                ? "text-[#9E4B4B]"
                                                                : "text-transparent"
                                                        }`}
                                                    />
                                                    <span className="min-w-0">
                                                        <span className="block break-words text-sm font-semibold text-slate-900">
                                                            {option.label}
                                                        </span>
                                                        {option.description
                                                            ? (
                                                                <span className="mt-0.5 block text-xs text-slate-500">
                                                                    {option
                                                                        .description}
                                                                </span>
                                                            )
                                                            : null}
                                                    </span>
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                        </div>
                    </div>
                )
                : null}
        </div>
    );
}

const SectionHeading = (
    { number, title, helper }: {
        number: number;
        title: string;
        helper?: string;
    },
) => (
    <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#9E4B4B] text-sm font-bold text-white">
            {number}
        </span>
        <div>
            <h3 className="font-bold text-slate-900">{title}</h3>
            {helper
                ? <p className="mt-1 text-sm text-slate-500">{helper}</p>
                : null}
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
    const [editingProduct, setEditingProduct] = useState<ProductRow | null>(
        null,
    );
    const [viewingProductId, setViewingProductId] = useState<string | null>(
        null,
    );

    const [productCode, setProductCode] = useState("");

    const [productCodeIdentity, setProductCodeIdentity] = useState<
        ProductCodeBuilderValue | null
    >(null);
    const [productIdentityForm, setProductIdentityForm] = useState<
        ProductIdentityFormValue
    >({ ...EMPTY_PRODUCT_IDENTITY });
    const [productIdentityValidation, setProductIdentityValidation] = useState<
        ProductIdentityValidationState
    >({
        status: "idle",
        message: null,
        preview: null,
        identity: null,
    });
    const [productName, setProductName] = useState("");
    const [lastSuggestedName, setLastSuggestedName] = useState<
        string | null
    >(null);
    const [liveIdentityNameSuggestion, setLiveIdentityNameSuggestion] =
        useState("");
    const [categoryId, setCategoryId] = useState("");
    const [categorySearch, setCategorySearch] = useState("");
    const [categoryComboboxOpen, setCategoryComboboxOpen] = useState(false);
    const categoryComboboxRef = useRef<HTMLDivElement | null>(null);
    const [productType, setProductType] = useState<ProductType>("Material");
    const [description, setDescription] = useState("");
    const [baseUom, setBaseUom] = useState("");
    const [wastePercent, setWastePercent] = useState("0");
    const [usesCoverage, setUsesCoverage] = useState(false);
    const [isStockItem, setIsStockItem] = useState(true);
    const [isServiceItem, setIsServiceItem] = useState(false);
    const [searchKeywords, setSearchKeywords] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [dynamicValues, setDynamicValues] = useState<
        Record<string, AttributeFormValue>
    >({});
    const [coverageForm, setCoverageForm] = useState<CoverageForm>(
        emptyCoverage,
    );
    const [productUnits, setProductUnits] = useState<ProductUnitForm[]>([]);
    const [masterDataOpen, setMasterDataOpen] = useState(false);
    const [masterDataTab, setMasterDataTab] = useState<ProductMasterTab>(
        "categories",
    );

    const openMasterData = (tab: ProductMasterTab) => {
        setMasterDataTab(tab);
        setMasterDataOpen(true);
    };

    const addSupportedProductUnit = () => {
        setProductUnits((current) => {
            const nextUnit = createEmptyProductUnit();
            const baseIndex = current.findIndex((unit) => unit.isBaseUnit);
            if (baseIndex < 0) return [...current, nextUnit];

            return [
                ...current.slice(0, baseIndex),
                nextUnit,
                ...current.slice(baseIndex),
            ];
        });
    };

    const moveProductUnit = (unitId: string, direction: -1 | 1) => {
        setProductUnits((current) => {
            const currentIndex = current.findIndex((unit) =>
                unit.id === unitId
            );
            if (currentIndex < 0) return current;

            const unit = current[currentIndex];
            if (unit.isBaseUnit) return current;

            const targetIndex = currentIndex + direction;
            if (targetIndex < 0 || targetIndex >= current.length) {
                return current;
            }
            if (current[targetIndex]?.isBaseUnit && direction === 1) {
                return current;
            }

            const next = [...current];
            [next[currentIndex], next[targetIndex]] = [
                next[targetIndex],
                next[currentIndex],
            ];
            return next;
        });
    };

    const selectBaseProductUnit = (uomCode: string) => {
        setBaseUom(uomCode);
        setProductUnits((current) => {
            const supported = current.filter(
                (unit) => !unit.isBaseUnit && unit.uomCode !== uomCode,
            );
            return [
                ...supported,
                {
                    id: `base-unit-${uomCode}`,
                    uomCode,
                    conversionToBase: "1",
                    isBaseUnit: true,
                    allowFractionalQuantity: true,
                    barcode: "",
                },
            ];
        });
        setCoverageForm((current) => ({
            ...current,
            coverageUom: current.coverageUom || uomCode,
        }));
    };

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
                .select(
                    "uom_code,uom_name,uom_symbol,uom_category,sort_order,is_active",
                )
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
            ["select", "multi_select"].includes(a.data_type)
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
                    (categoryPath.get(a.category_id) ?? a.category_name)
                        .localeCompare(
                            categoryPath.get(b.category_id) ?? b.category_name,
                            "en-AU",
                            { sensitivity: "base" },
                        )
                ),
        [categories, categoryId, categoryPath],
    );

    const filteredCategoryOptions = useMemo(() => {
        const keyword = categorySearch.trim().toLowerCase();

        if (keyword.length < 2) {
            return selectableCategories;
        }

        return selectableCategories.filter((category) => {
            const path = categoryPath.get(category.category_id) ??
                category.category_name;

            return (
                category.category_name.toLowerCase().includes(keyword) ||
                category.category_code.toLowerCase().includes(keyword) ||
                path.toLowerCase().includes(keyword)
            );
        });
    }, [categoryPath, categorySearch, selectableCategories]);

    const selectedCategory = useMemo(
        () =>
            categories.find((category) =>
                category.category_id === categoryId
            ) ??
                null,
        [categories, categoryId],
    );

    const buildSuggestedProductName = (
        identity: ProductCodeBuilderValue | null,
    ) => {
        if (!identity) return "";

        const cleanThickness = identity.thicknessName
            ?.replace(/\b(unknown|not applicable)\b/gi, "")
            .replace(/\s+/g, " ")
            .trim();

        const coreParts = [
            identity.typeName,
            identity.colourName,
            cleanThickness,
        ].filter(Boolean);

        const variantName = identity.variantName?.trim();
        if (
            identity.variantCode !== "01" &&
            variantName &&
            variantName.toLowerCase() !== "standard"
        ) {
            coreParts.push(variantName);
        }

        const coreName = coreParts.join(" ").replace(/\s+/g, " ").trim();
        if (!coreName) return "";

        const firstValue = identity.firstValue;
        const secondValue = identity.secondValue;
        const ruleName = identity.sizeRuleName?.toLowerCase() ?? "";
        let readableSize = "";

        if (firstValue !== null && secondValue !== null) {
            readableSize = `${firstValue} × ${secondValue} mm`;
        } else if (firstValue !== null && ruleName.includes("random")) {
            readableSize = `${firstValue} mm × Random Length`;
        } else if (firstValue !== null) {
            readableSize = `${firstValue} mm`;
        } else if (secondValue !== null) {
            readableSize = `${secondValue} mm`;
        }

        return readableSize ? `${coreName} — ${readableSize}` : coreName;
    };

    const suggestedProductName = useMemo(
        () =>
            buildSuggestedProductName(productCodeIdentity) ||
            liveIdentityNameSuggestion,
        [liveIdentityNameSuggestion, productCodeIdentity],
    );

    useEffect(() => {
        if (editingProduct) return;
        if (!suggestedProductName) return;

        const trimmedName = productName.trim();
        const isSystemGenerated = trimmedName === "" ||
            trimmedName === lastSuggestedName;

        if (isSystemGenerated) {
            setProductName(suggestedProductName);
            setLastSuggestedName(suggestedProductName);
        }
    }, [editingProduct, lastSuggestedName, productName, suggestedProductName]);

    const categoryFilterOptions = useMemo<SearchableOption[]>(
        () =>
            selectableCategories.map((category) => {
                const path = categoryPath.get(category.category_id) ??
                    category.category_name;
                return {
                    value: category.category_id,
                    label: path,
                    searchText:
                        `${category.category_code} ${category.category_name} ${path}`,
                    description: category.category_code,
                };
            }),
        [categoryPath, selectableCategories],
    );

    const uomOptions = useMemo<SearchableOption[]>(
        () =>
            [...units]
                .sort((a, b) =>
                    a.uom_category.localeCompare(b.uom_category, "en-AU") ||
                    Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0) ||
                    a.uom_name.localeCompare(b.uom_name, "en-AU") ||
                    a.uom_code.localeCompare(b.uom_code, "en-AU")
                )
                .map((unit) => ({
                    value: unit.uom_code,
                    label:
                        `${unit.uom_code} — ${unit.uom_name} (${unit.uom_symbol})`,
                    searchText:
                        `${unit.uom_code} ${unit.uom_name} ${unit.uom_symbol} ${unit.uom_category}`,
                    group: unit.uom_category,
                })),
        [units],
    );

    const filteredProducts = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();

        return products.filter((product) => {
            const matchesStatus = statusFilter === "all" ||
                (statusFilter === "active" && product.is_active) ||
                (statusFilter === "inactive" && !product.is_active);

            const matchesCategory = categoryFilter === "all" ||
                product.category_id === categoryFilter;

            const matchesType = typeFilter === "all" ||
                product.product_type === typeFilter;

            const matchesSearch = !keyword ||
                product.product_code.toLowerCase().includes(keyword) ||
                product.product_name.toLowerCase().includes(keyword) ||
                product.description?.toLowerCase().includes(keyword) ||
                product.search_keywords?.toLowerCase().includes(keyword) ||
                product.product_categories?.category_name
                    .toLowerCase()
                    .includes(keyword);

            return matchesStatus && matchesCategory && matchesType &&
                matchesSearch;
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

        return Array.from(groups.entries()).map(([section, attributes]) =>
            [
                section,
                [...attributes].sort(
                    (a, b) =>
                        Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0) ||
                        a.effective_label.localeCompare(
                            b.effective_label,
                            "en-AU",
                        ),
                ),
            ] as [string, EffectiveAttribute[]]
        );
    }, [effectiveAttributes]);

    const resetForm = () => {
        setEditingProduct(null);
        setProductCode("");
        setProductCodeIdentity(null);
        setProductIdentityForm({ ...EMPTY_PRODUCT_IDENTITY });
        setProductIdentityValidation({
            status: "idle",
            message: null,
            preview: null,
            identity: null,
        });
        setProductName("");
        setLastSuggestedName(null);
        setLiveIdentityNameSuggestion("");
        setCategoryId("");
        setCategorySearch("");
        setCategoryComboboxOpen(false);
        setProductType("Material");
        setDescription("");
        setBaseUom("");
        setWastePercent("0");
        setUsesCoverage(false);
        setIsStockItem(true);
        setIsServiceItem(false);
        setSearchKeywords("");
        setIsActive(true);
        setDynamicValues({});
        setCoverageForm(emptyCoverage());
        setProductUnits([]);
    };

    const loadProductDetails = async (product: ProductRow) => {
        setEditingProduct(product);
        setProductCode(product.product_code);
        setProductCodeIdentity(null);
        setProductIdentityForm({ ...EMPTY_PRODUCT_IDENTITY });
        setProductIdentityValidation({
            status: "idle",
            message: null,
            preview: null,
            identity: null,
        });
        setProductName(product.product_name);
        setLastSuggestedName(null);
        setLiveIdentityNameSuggestion("");
        setCategoryId(product.category_id);
        setCategorySearch("");
        setCategoryComboboxOpen(false);
        setProductType(product.product_type as ProductType);
        setDescription(product.description ?? "");
        setBaseUom(product.base_uom_code ?? "");
        setWastePercent(String(product.default_waste_percent ?? 0));
        setUsesCoverage(product.uses_coverage);
        setIsStockItem(product.is_stock_item);
        setIsServiceItem(product.is_service_item);
        setSearchKeywords(product.search_keywords ?? "");
        setIsActive(product.is_active);

        const [valuesResult, coverageResult, productUnitsResult] = await Promise
            .all([
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
                    .eq("is_active", true)
                    .order("sort_order"),
                supabase
                    .from("product_units")
                    .select(
                        `
        product_unit_id,
        uom_code,
        conversion_to_base,
        is_base_unit,
        allow_fractional_quantity,
        sort_order,
        barcode,
        is_active
    `,
                    )
                    .eq("product_id", product.product_id)
                    .eq("is_deleted", false)
                    .eq("is_active", true)
                    .order("sort_order", { ascending: false })
                    .order("conversion_to_base", { ascending: false }),
            ]);

        if (valuesResult.error) throw valuesResult.error;
        if (coverageResult.error) throw coverageResult.error;
        if (productUnitsResult.error) throw productUnitsResult.error;

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
                nextValues[value.attribute_id] = value.value_text ??
                    value.value_date ?? "";
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

        const loadedProductUnits: ProductUnitForm[] = (
            productUnitsResult.data ?? []
        ).map((unit) => ({
            id: unit.product_uom_conversion_id,
            uomCode: unit.from_uom_code,
            conversionToBase: String(unit.conversion_factor),
            isBaseUnit: false,
            allowFractionalQuantity: unit.allow_fractional_quantity,
            barcode: "",
        }));

        setProductUnits([
            ...loadedProductUnits.filter(
                (unit) => unit.uomCode !== product.base_uom_code,
            ),
            ...(product.base_uom_code
                ? [
                    {
                        id: `base-unit-${product.base_uom_code}`,
                        uomCode: product.base_uom_code,
                        conversionToBase: "1",
                        isBaseUnit: true,
                        allowFractionalQuantity: true,
                        barcode: "",
                    } satisfies ProductUnitForm,
                ]
                : []),
        ]);

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

    const buildProductUnitsPayload = (): Json[] => {
        if (!baseUom) {
            throw new Error("Base Unit of Measure is required.");
        }

        if (productUnits.length === 0) {
            throw new Error("At least one Product Unit is required.");
        }

        const seenUoms = new Set<string>();
        const baseRows = productUnits.filter((unit) => unit.isBaseUnit);

        if (baseRows.length !== 1) {
            throw new Error("Exactly one Base Unit is required.");
        }

        return productUnits.map((unit, index) => {
            const uomCode = unit.uomCode.trim();
            const conversionToBase = Number(unit.conversionToBase);

            if (!uomCode) {
                throw new Error(`Product Unit ${index + 1}: UOM is required.`);
            }
            if (seenUoms.has(uomCode)) {
                throw new Error(
                    `Product Unit ${
                        index + 1
                    }: UOM ${uomCode} is already configured.`,
                );
            }
            seenUoms.add(uomCode);

            if (!Number.isFinite(conversionToBase) || conversionToBase <= 0) {
                throw new Error(
                    `Product Unit ${
                        index + 1
                    }: Conversion to Base must be greater than zero.`,
                );
            }
            if (unit.isBaseUnit && uomCode !== baseUom) {
                throw new Error(
                    "The Base Unit row must use the selected Base UOM.",
                );
            }
            if (unit.isBaseUnit && conversionToBase !== 1) {
                throw new Error(
                    "The Base Unit conversion factor must equal 1.",
                );
            }
            if (!unit.isBaseUnit && uomCode === baseUom) {
                throw new Error(
                    "The selected Base UOM may appear only in the Base Unit row.",
                );
            }

            if (unit.isBaseUnit) {
                return null;
            }

            return {
                from_uom_code: uomCode,
                to_uom_code: baseUom,
                conversion_factor: conversionToBase,
                allow_fractional_quantity: unit.allowFractionalQuantity,
                sort_order: (productUnits.length - index) * 10,
                is_active: true,
            } as Json;
        }).filter((unit): unit is Json => unit !== null);
    };

    const buildCoveragePayload = (): Json[] => {
        if (!usesCoverage) return [];

        const sourceQuantity = Number(coverageForm.sourceQuantity || 1);
        const coverageQuantity = Number(coverageForm.coverageQuantity);

        if (!coverageForm.sourceUom || !coverageForm.coverageUom) {
            throw new Error(
                "Coverage Source UOM and Coverage UOM are required.",
            );
        }
        if (
            !productUnits.some((unit) =>
                unit.uomCode === coverageForm.sourceUom
            )
        ) {
            throw new Error(
                "Coverage Source UOM must be one of the configured Product Units.",
            );
        }
        if (!Number.isFinite(sourceQuantity) || sourceQuantity <= 0) {
            throw new Error(
                "Coverage Source Quantity must be greater than zero.",
            );
        }
        if (!Number.isFinite(coverageQuantity) || coverageQuantity <= 0) {
            throw new Error("Coverage Quantity must be greater than zero.");
        }

        const minimumCoverage = numberOrNull(coverageForm.minimumCoverage);
        const maximumCoverage = numberOrNull(coverageForm.maximumCoverage);

        if (
            minimumCoverage !== null &&
            (!Number.isFinite(minimumCoverage) || minimumCoverage <= 0)
        ) {
            throw new Error("Minimum Coverage must be greater than zero.");
        }
        if (
            maximumCoverage !== null &&
            (!Number.isFinite(maximumCoverage) || maximumCoverage <= 0)
        ) {
            throw new Error("Maximum Coverage must be greater than zero.");
        }
        if (
            minimumCoverage !== null &&
            maximumCoverage !== null &&
            minimumCoverage > maximumCoverage
        ) {
            throw new Error(
                "Minimum Coverage cannot be greater than Maximum Coverage.",
            );
        }
        if (minimumCoverage !== null && coverageQuantity < minimumCoverage) {
            throw new Error(
                "Coverage Quantity cannot be less than Minimum Coverage.",
            );
        }
        if (maximumCoverage !== null && coverageQuantity > maximumCoverage) {
            throw new Error(
                "Coverage Quantity cannot be greater than Maximum Coverage.",
            );
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
                throw new Error(
                    "You do not have permission to manage Products.",
                );
            }

            const name = productName.trim();

            if (
                !editingProduct && productIdentityValidation.status !== "valid"
            ) {
                throw new Error(
                    productIdentityValidation.message ||
                        "Complete Product Code Identity and wait for validation.",
                );
            }
            if (!editingProduct && !productCodeIdentity) {
                throw new Error("Validated Product Code identity is required.");
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
                throw new Error(
                    "Default Waste Percent must be between 0 and 100.",
                );
            }

            for (const attribute of effectiveAttributes) {
                const value = dynamicValues[attribute.attribute_id];
                const missing = Array.isArray(value)
                    ? value.length === 0
                    : typeof value === "boolean"
                    ? false
                    : String(value ?? "").trim() === "";

                if (attribute.is_required && missing) {
                    throw new Error(
                        `${attribute.effective_label} is required.`,
                    );
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
                default_purchase_uom_code: baseUom,
                default_request_uom_code: baseUom,
                default_sales_uom_code: baseUom,
                default_waste_percent: waste,
                uses_coverage: usesCoverage,
                is_stock_item: !serviceItem,
                is_service_item: serviceItem,
                is_active: isActive,
                variant_name: productCodeIdentity?.variantName ??
                    editingProduct?.variant_name ??
                    "Standard",
                variant_description: productCodeIdentity?.variantDescription ??
                    editingProduct?.variant_description ??
                    null,
            };

            if (!editingProduct && productCodeIdentity) {
                productPayload.product_code_family_id =
                    productCodeIdentity.productCodeFamilyId;
                productPayload.product_thickness_code_id =
                    productCodeIdentity.productThicknessCodeId;
                productPayload.product_code_type_id =
                    productCodeIdentity.productCodeTypeId;
                productPayload.product_code_size_rule_id =
                    productCodeIdentity.sizeRuleId;
                productPayload.product_colour_id = productCodeIdentity.colourId;
                productPayload.first_size_value =
                    productCodeIdentity.firstValue;
                productPayload.second_size_value =
                    productCodeIdentity.secondValue;
                productPayload.product_code_variant_number =
                    productCodeIdentity.variantNumber;
            }

            const rpcArguments = {
                p_product: productPayload as Json,
                p_uom_conversions: buildProductUnitsPayload() as Json,
                p_coverages: buildCoveragePayload() as Json,
                p_attributes: buildAttributePayload() as Json,
            };

            if (editingProduct) {
                const { error } = await supabase.rpc(
                    "update_product_atomic",
                    {
                        p_product_id: editingProduct.product_id,
                        ...rpcArguments,
                    },
                );
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
        onSuccess: async () => {
            toast.success(
                editingProduct
                    ? "Product updated successfully."
                    : "Product created successfully.",
            );

            await queryClient.invalidateQueries({
                queryKey: ["products"],
            });

            await queryClient.refetchQueries({
                queryKey: ["products"],
                exact: true,
                type: "active",
            });

            void queryClient.invalidateQueries({
                queryKey: ["products-for-stock-requests"],
            });

            void queryClient.invalidateQueries({
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
                throw new Error(
                    "You do not have permission to manage Products.",
                );
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

    const setDynamicValue = (
        attributeId: string,
        value: AttributeFormValue,
    ) => {
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
                    `<tr>${
                        row.map((cell) => `<td>${String(cell)}</td>`).join("")
                    }</tr>`,
            )
            .join("");

        const html =
            `<table><tr><th>Product Code</th><th>Product Name</th><th>Category</th><th>Product Type</th><th>Base UOM</th><th>Stock Item</th><th>Service Item</th><th>Status</th></tr>${rows}</table>`;
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
                    `<tr><td>${product.product_code}</td><td>${product.product_name}</td><td>${
                        product.product_categories?.category_name ?? "-"
                    }</td><td>${product.product_type}</td><td>${
                        product.base_uom_code ?? "-"
                    }</td><td>${
                        product.is_active ? "Active" : "Inactive"
                    }</td></tr>`,
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
                            setDynamicValue(
                                attribute.attribute_id,
                                event.target.checked,
                            )}
                        className="h-4 w-4 rounded border-slate-300 text-red-600"
                    />
                    {value === true ? "Yes" : "No"}
                </label>
            );
        }

        if (attribute.data_type === "select") {
            const options = attributeOptions
                .filter((option) =>
                    option.attribute_id === attribute.attribute_id
                )
                .sort((a, b) =>
                    a.option_label.localeCompare(b.option_label, "en-AU")
                );
            const selectedValue = typeof value === "string" ? value : "";

            if (options.length > 8) {
                return (
                    <SearchablePicker
                        value={selectedValue}
                        onChange={(next) =>
                            setDynamicValue(attribute.attribute_id, next)}
                        options={options.map((option) => ({
                            value: option.attribute_option_id,
                            label: option.option_label,
                            searchText:
                                `${option.option_code} ${option.option_label}`,
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
                        )}
                >
                    <SelectTrigger className={FIELD_CLASS}>
                        <SelectValue
                            placeholder={`Select ${attribute.effective_label}`}
                        />
                    </SelectTrigger>
                    <SelectContent>
                        {!attribute.is_required
                            ? (
                                <SelectItem value="__none__">
                                    — Clear selection —
                                </SelectItem>
                            )
                            : null}
                        {options.map((option) => (
                            <SelectItem
                                key={option.attribute_option_id}
                                value={option.attribute_option_id}
                            >
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
                        .filter((option) =>
                            option.attribute_id === attribute.attribute_id
                        )
                        .map((option) => (
                            <label
                                key={option.attribute_option_id}
                                className="flex items-center gap-2 text-sm"
                            >
                                <input
                                    type="checkbox"
                                    checked={selected.includes(
                                        option.attribute_option_id,
                                    )}
                                    onChange={(event) => {
                                        const next = event.target.checked
                                            ? [
                                                ...selected,
                                                option.attribute_option_id,
                                            ]
                                            : selected.filter(
                                                (id) =>
                                                    id !==
                                                        option
                                                            .attribute_option_id,
                                            );
                                        setDynamicValue(
                                            attribute.attribute_id,
                                            next,
                                        );
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
                        setDynamicValue(
                            attribute.attribute_id,
                            event.target.value,
                        )}
                    className={TEXTAREA_CLASS}
                />
            );
        }

        return (
            <Input
                className={FIELD_CLASS}
                type={attribute.data_type === "number"
                    ? "number"
                    : attribute.data_type === "date"
                    ? "date"
                    : "text"}
                value={typeof value === "string" ? value : ""}
                onChange={(event) =>
                    setDynamicValue(attribute.attribute_id, event.target.value)}
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
                            Manage materials, services, units, coverage and
                            category-driven specifications.
                        </p>
                    </div>
                </div>

                {isAdmin
                    ? (
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
                    )
                    : null}
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
                        <p className="text-xs text-slate-500 sm:text-sm">
                            {label}
                        </p>
                        <p
                            className={`mt-2 text-2xl font-bold sm:text-3xl ${colour}`}
                        >
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
                            onChange={(event) =>
                                setSearchTerm(event.target.value)}
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
                        onValueChange={(value) =>
                            setStatusFilter(value as StatusFilter)}
                    >
                        <SelectTrigger className={FIELD_CLASS}>
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active Only</SelectItem>
                            <SelectItem value="inactive">
                                Inactive Only
                            </SelectItem>
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

                {isLoading
                    ? (
                        <div className="p-8 text-center text-slate-500">
                            Loading Products...
                        </div>
                    )
                    : filteredProducts.length === 0
                    ? (
                        <div className="p-8 text-center text-slate-500">
                            No Products found.
                        </div>
                    )
                    : (
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
                                    {product.product_categories
                                        ?.category_name ?? "-"}
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
                                    <ActiveStatusBadge
                                        isActive={product.is_active}
                                    />
                                </div>
                                <div className="col-span-2 flex justify-end gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            setViewingProductId(
                                                product.product_id,
                                            );
                                            setShowView(true);
                                        }}
                                        title="View Product"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    {isAdmin
                                        ? (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        loadProductDetails(
                                                            product,
                                                        ).catch((error) =>
                                                            toast.error(
                                                                error.message,
                                                            )
                                                        )}
                                                    title="Edit Product"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        toggleStatus.mutate(
                                                            product,
                                                        )}
                                                    title={product.is_active
                                                        ? "Set Inactive"
                                                        : "Set Active"}
                                                >
                                                    <Power className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )
                                        : null}
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
                                <p className="text-xs text-slate-500">
                                    Category
                                </p>
                                <p className="mt-1 font-semibold">
                                    {product.product_categories
                                        ?.category_name ?? "-"}
                                </p>
                            </div>
                            <div className="rounded-xl bg-slate-50 p-3">
                                <p className="text-xs text-slate-500">
                                    Type / UOM
                                </p>
                                <p className="mt-1 font-semibold">
                                    {product.product_type} ·{" "}
                                    {product.base_uom_code ?? "-"}
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
                            {isAdmin
                                ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            loadProductDetails(product).catch((
                                                error,
                                            ) => toast.error(error.message))}
                                    >
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Edit
                                    </Button>
                                )
                                : null}
                        </div>
                    </article>
                ))}
            </section>
            <Dialog
                open={showForm}
                onOpenChange={(open) => {
                    setShowForm(open);
                    if (!open) resetForm();
                }}
            >
                <DialogContent className="max-h-[90vh] w-[calc(100vw-24px)] max-w-6xl overflow-hidden rounded-2xl p-0">
                    <DialogHeader className="border-b border-[#E5E7EB] px-4 py-4 sm:px-6">
                        <DialogTitle>
                            {editingProduct ? "Edit Product" : "Add Product"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="max-h-[calc(90vh-72px)] space-y-6 overflow-y-auto px-4 py-5 sm:px-6">
                        <section className="rounded-2xl border border-[#E5E7EB] bg-[#FCFAFA] p-4">
                            <SectionHeading
                                number={1}
                                title="Product Identity & Information"
                                helper="Basic identity, category and code values used across REDS."
                            />
                            <div className="mt-5 rounded-2xl border border-[#E5E7EB] bg-white p-4">
                                <div className="text-sm font-semibold text-slate-900">
                                    Product Code Identity
                                </div>
                                <p className="mt-1 text-sm text-slate-500">
                                    {editingProduct
                                        ? "Product Code identity is permanent and cannot be changed."
                                        : "Select the controlled values that form the permanent Product Code."}
                                </p>

                                {editingProduct
                                    ? (
                                        <div className="mt-4 space-y-4">
                                            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                                                <p className="text-xs font-bold uppercase tracking-wide text-red-700">
                                                    Product Code
                                                </p>
                                                <p className="mt-2 break-all font-mono text-lg font-black text-slate-900">
                                                    {productCode}
                                                </p>
                                            </div>

                                            <p className="text-xs text-amber-700">
                                                Product Code identity is
                                                immutable after Product
                                                creation.
                                            </p>
                                        </div>
                                    )
                                    : (
                                        <div className="mt-4">
                                            <ProductIdentityStep
                                                value={productIdentityForm}
                                                onChange={setProductIdentityForm}
                                                onNameSuggestionChange={setLiveIdentityNameSuggestion}
                                                onValidationChange={(state) => {
                                                    setProductIdentityValidation(
                                                        state,
                                                    );
                                                    setProductCodeIdentity(
                                                        state.identity,
                                                    );
                                                    setProductCode(
                                                        state.preview
                                                            ?.product_code_preview ??
                                                            "",
                                                    );
                                                }}
                                                onManage={() =>
                                                    openMasterData(
                                                        "product-code",
                                                    )}
                                                disabled={saveProduct.isPending}
                                            />
                                        </div>
                                    )}
                            </div>

                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                                {editingProduct
                                    ? (
                                        <div className="space-y-2">
                                            <Label>Product Code</Label>
                                            <Input
                                                value={productCode}
                                                readOnly
                                                className="cursor-not-allowed bg-slate-100 font-mono"
                                            />
                                            <p className="text-xs text-slate-500">
                                                Product Code is permanent and
                                                cannot be changed.
                                            </p>
                                        </div>
                                    )
                                    : null}

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
                                                setCategoryComboboxOpen((
                                                    current,
                                                ) => !current);
                                                setCategorySearch("");
                                            }}
                                            className={`${FIELD_CLASS} flex w-full items-center justify-between px-3 text-left`}
                                        >
                                            <span
                                                className={selectedCategory
                                                    ? "truncate text-[#111827]"
                                                    : "truncate text-[#6B7280]"}
                                            >
                                                {selectedCategory
                                                    ? categoryPath.get(
                                                        selectedCategory
                                                            .category_id,
                                                    ) ??
                                                        selectedCategory
                                                            .category_name
                                                    : "Select Category"}
                                            </span>

                                            <ChevronDown
                                                className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${
                                                    categoryComboboxOpen
                                                        ? "rotate-180"
                                                        : ""
                                                }`}
                                            />
                                        </button>

                                        {categoryComboboxOpen
                                            ? (
                                                <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-xl">
                                                    <div className="border-b border-[#E5E7EB] p-3">
                                                        <div className="relative">
                                                            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                                            <Input
                                                                autoFocus
                                                                className={`${FIELD_CLASS} pl-10`}
                                                                value={categorySearch}
                                                                onChange={(
                                                                    event,
                                                                ) => setCategorySearch(
                                                                    event.target
                                                                        .value,
                                                                )}
                                                                placeholder="Type at least 2 letters..."
                                                            />
                                                        </div>

                                                        <p className="mt-2 text-xs text-slate-500">
                                                            Search by category
                                                            name, code or full
                                                            category path.
                                                        </p>
                                                    </div>

                                                    <div
                                                        role="listbox"
                                                        className="max-h-64 overflow-y-auto p-1"
                                                    >
                                                        {filteredCategoryOptions
                                                                .length === 0
                                                            ? (
                                                                <div className="px-3 py-6 text-center text-sm text-slate-500">
                                                                    No matching
                                                                    Product
                                                                    Category
                                                                    found.
                                                                </div>
                                                            )
                                                            : (
                                                                filteredCategoryOptions
                                                                    .map(
                                                                        (
                                                                            category,
                                                                        ) => {
                                                                            const path =
                                                                                categoryPath
                                                                                    .get(
                                                                                        category
                                                                                            .category_id,
                                                                                    ) ??
                                                                                    category
                                                                                        .category_name;
                                                                            const selected =
                                                                                category
                                                                                    .category_id ===
                                                                                    categoryId;

                                                                            return (
                                                                                <button
                                                                                    key={category
                                                                                        .category_id}
                                                                                    type="button"
                                                                                    role="option"
                                                                                    aria-selected={selected}
                                                                                    onClick={() => {
                                                                                        setCategoryId(
                                                                                            category
                                                                                                .category_id,
                                                                                        );
                                                                                        setDynamicValues(
                                                                                            {},
                                                                                        );
                                                                                        setCategorySearch(
                                                                                            "",
                                                                                        );
                                                                                        setCategoryComboboxOpen(
                                                                                            false,
                                                                                        );
                                                                                    }}
                                                                                    className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left hover:bg-[#FBF1F1] focus:bg-[#FBF1F1] focus:outline-none"
                                                                                >
                                                                                    <Check
                                                                                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                                                                                            selected
                                                                                                ? "text-[#9E4B4B]"
                                                                                                : "text-transparent"
                                                                                        }`}
                                                                                    />

                                                                                    <span className="min-w-0">
                                                                                        <span className="block break-words text-sm font-semibold text-slate-900">
                                                                                            {path}
                                                                                        </span>
                                                                                        <span className="mt-0.5 block font-mono text-xs text-slate-500">
                                                                                            {category
                                                                                                .category_code}
                                                                                        </span>
                                                                                    </span>
                                                                                </button>
                                                                            );
                                                                        },
                                                                    )
                                                            )}
                                                    </div>
                                                </div>
                                            )
                                            : null}
                                    </div>

                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-xs text-slate-500">
                                            Categories are arranged by Parent →
                                            Child. Type two letters to narrow
                                            the list.
                                        </p>
                                        {isAdmin
                                            ? (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        openMasterData(
                                                            "categories",
                                                        )}
                                                    className="h-9 rounded-xl border-[#D8B4B4] text-[#7F1D1D] hover:bg-[#FBF1F1]"
                                                >
                                                    <Settings2 className="mr-2 h-4 w-4" />
                                                    Manage Categories
                                                </Button>
                                            )
                                            : null}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Business Product Type *</Label>
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
                                                <SelectItem
                                                    key={type}
                                                    value={type}
                                                >
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
                                        onChange={(event) =>
                                            setDescription(event.target.value)}
                                        className={TEXTAREA_CLASS}
                                    />
                                </div>

                                <div
                                    className={`space-y-2 ${
                                        editingProduct ? "" : "md:col-span-2"
                                    }`}
                                >
                                    <Label>Product Name *</Label>
                                    <Input
                                        className={FIELD_CLASS}
                                        value={productName}
                                        onChange={(event) => {
                                            setProductName(event.target.value);
                                            setLastSuggestedName(null);
                                        }}
                                        placeholder="Enter the product name used throughout REDS"
                                    />
                                    {!editingProduct && suggestedProductName
                                        ? (
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                <p className="text-xs text-slate-500">
                                                    Suggested from Product Code
                                                    identity:{" "}
                                                    <span className="font-semibold text-slate-900">
                                                        {suggestedProductName}
                                                    </span>
                                                </p>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setProductName(
                                                            suggestedProductName,
                                                        );
                                                        setLastSuggestedName(
                                                            suggestedProductName,
                                                        );
                                                    }}
                                                >
                                                    Regenerate Name
                                                </Button>
                                            </div>
                                        )
                                        : null}
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label>Search Keywords</Label>
                                    <Input
                                        className={FIELD_CLASS}
                                        value={searchKeywords}
                                        onChange={(event) => setSearchKeywords(
                                            event.target.value,
                                        )}
                                        placeholder="Example: oak engineered timber natural"
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="rounded-2xl border border-[#E5E7EB] bg-[#FCFAFA] p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <SectionHeading
                                    number={2}
                                    title="Units & Packaging"
                                    helper="Set the common Base Unit, then arrange every supported packaging level from largest to smallest."
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addSupportedProductUnit}
                                    disabled={!baseUom}
                                    className="h-10 w-full rounded-xl border-[#D8B4B4] text-[#7F1D1D] hover:bg-[#FBF1F1] sm:w-auto"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Unit
                                </Button>
                            </div>

                            <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(230px,0.9fr)_minmax(170px,0.65fr)_minmax(300px,1.45fr)]">
                                <div className="rounded-xl border border-[#DDD6FE] bg-[#F5F3FF] p-3">
                                    <p className="text-xs font-bold uppercase tracking-wide text-[#6D28D9]">
                                        Base Unit
                                    </p>
                                    <div className="mt-2">
                                        <SearchablePicker
                                            value={baseUom}
                                            onChange={selectBaseProductUnit}
                                            options={uomOptions.filter(
                                                (option) => {
                                                    const unit = units.find(
                                                        (item) =>
                                                            item.uom_code ===
                                                                option.value,
                                                    );
                                                    return Boolean(
                                                        unit?.is_active,
                                                    ) ||
                                                        option.value ===
                                                            baseUom;
                                                },
                                            )}
                                            placeholder={loadingUnits
                                                ? "Loading UOM..."
                                                : "Select Base Unit"}
                                            searchPlaceholder="Search UOM code, name or category..."
                                            emptyText="No active Units of Measure configured."
                                        />
                                    </div>
                                    <p className="mt-2 text-xs text-slate-500">
                                        Common calculation unit for quantity,
                                        cost and reporting.
                                    </p>
                                </div>

                                <div className="rounded-xl border border-[#E5E7EB] bg-white p-3">
                                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                        Supported Units
                                    </p>
                                    <p className="mt-2 text-2xl font-black text-slate-900">
                                        {productUnits.filter((unit) =>
                                            unit.uomCode
                                        ).length}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {productUnits.filter((unit) =>
                                                unit.uomCode
                                            ).length === 1
                                            ? "1 level"
                                            : "levels"}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-[#E5E7EB] bg-white p-3">
                                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                        Hierarchy
                                    </p>
                                    <p className="mt-2 break-words text-base font-bold text-slate-900">
                                        {productUnits
                                            .filter((unit) => unit.uomCode)
                                            .map((unit) => unit.uomCode)
                                            .join(" → ") ||
                                            "Select a Base Unit to begin"}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Largest packaging first; Base Unit
                                        remains last.
                                    </p>
                                </div>
                            </div>

                            {!baseUom
                                ? (
                                    <div className="mt-4 rounded-xl border border-dashed border-[#D8B4B4] bg-[#FFF8F8] p-5 text-center">
                                        <p className="font-semibold text-slate-900">
                                            Select the Base Unit first
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500">
                                            The system will create and lock the
                                            Base Unit row automatically.
                                        </p>
                                    </div>
                                )
                                : (
                                    <div className="mt-4 min-w-0 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
                                        <div className="hidden grid-cols-[52px_minmax(175px,1.2fr)_minmax(165px,0.95fr)_112px_minmax(135px,0.75fr)_104px] gap-2 border-b border-[#E5E7EB] bg-[#F8FAFC] px-3 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 lg:grid">
                                            <span>Level</span>
                                            <span>Unit</span>
                                            <span>1 Unit Equals (Base)</span>
                                            <span>Fractional</span>
                                            <span>Barcode</span>
                                            <span className="text-right">
                                                Actions
                                            </span>
                                        </div>

                                        <div className="divide-y divide-[#E5E7EB]">
                                            {productUnits.map((unit, index) => {
                                                const selectedMasterUnit = units
                                                    .find(
                                                        (item) =>
                                                            item.uom_code ===
                                                                unit.uomCode,
                                                    );
                                                const nonBaseUnits =
                                                    productUnits.filter(
                                                        (item) =>
                                                            !item.isBaseUnit,
                                                    );
                                                const nonBaseIndex =
                                                    nonBaseUnits.findIndex(
                                                        (item) =>
                                                            item.id === unit.id,
                                                    );
                                                const canMoveUp =
                                                    !unit.isBaseUnit &&
                                                    nonBaseIndex > 0;
                                                const canMoveDown =
                                                    !unit.isBaseUnit &&
                                                    nonBaseIndex >= 0 &&
                                                    nonBaseIndex <
                                                        nonBaseUnits.length - 1;

                                                return (
                                                    <div
                                                        key={unit.id}
                                                        className="grid min-w-0 gap-3 px-3 py-4 lg:grid-cols-[52px_minmax(175px,1.2fr)_minmax(165px,0.95fr)_112px_minmax(135px,0.75fr)_104px] lg:gap-2 lg:items-center"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-slate-100 px-2 text-sm font-bold text-slate-800">
                                                                {index + 1}
                                                            </span>
                                                            {unit.isBaseUnit
                                                                ? (
                                                                    <span className="rounded-full bg-[#DCFCE7] px-2 py-1 text-[11px] font-bold text-[#166534]">
                                                                        Base
                                                                    </span>
                                                                )
                                                                : null}
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label className="lg:hidden">
                                                                Unit
                                                            </Label>
                                                            {unit.isBaseUnit
                                                                ? (
                                                                    <div className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-3 py-2.5">
                                                                        <p className="font-semibold text-slate-900">
                                                                            {unit
                                                                                .uomCode}
                                                                            {" "}
                                                                            —
                                                                            {" "}
                                                                            {selectedMasterUnit
                                                                                ?.uom_name ??
                                                                                "Base Unit"}
                                                                        </p>
                                                                        <p className="mt-0.5 text-xs text-[#166534]">
                                                                            Base
                                                                            Unit
                                                                            ·
                                                                            locked
                                                                            in
                                                                            this
                                                                            hierarchy
                                                                        </p>
                                                                    </div>
                                                                )
                                                                : (
                                                                    <SearchablePicker
                                                                        value={unit
                                                                            .uomCode}
                                                                        onChange={(
                                                                            value,
                                                                        ) => setProductUnits(
                                                                            (
                                                                                current,
                                                                            ) => current
                                                                                .map(
                                                                                    (
                                                                                        item,
                                                                                    ) => item
                                                                                            .id ===
                                                                                            unit.id
                                                                                        ? {
                                                                                            ...item,
                                                                                            uomCode:
                                                                                                value,
                                                                                        }
                                                                                        : item,
                                                                                ),
                                                                        )}
                                                                        options={uomOptions
                                                                            .filter(
                                                                                (
                                                                                    option,
                                                                                ) => {
                                                                                    const masterUnit =
                                                                                        units
                                                                                            .find(
                                                                                                (
                                                                                                    item,
                                                                                                ) => item
                                                                                                    .uom_code ===
                                                                                                    option
                                                                                                        .value,
                                                                                            );
                                                                                    const usedElsewhere =
                                                                                        productUnits
                                                                                            .some(
                                                                                                (
                                                                                                    item,
                                                                                                ) => item
                                                                                                            .id !==
                                                                                                        unit.id &&
                                                                                                    item.uomCode ===
                                                                                                        option
                                                                                                            .value,
                                                                                            );
                                                                                    return (
                                                                                        Boolean(
                                                                                            masterUnit
                                                                                                ?.is_active,
                                                                                        ) &&
                                                                                        option
                                                                                                .value !==
                                                                                            baseUom &&
                                                                                        !usedElsewhere
                                                                                    );
                                                                                },
                                                                            )}
                                                                        placeholder="Select supported UOM"
                                                                        searchPlaceholder="Search UOM code, name or category..."
                                                                        emptyText="No available Units of Measure found."
                                                                    />
                                                                )}
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label className="lg:hidden">
                                                                1 Unit Equals
                                                                (Base Unit)
                                                            </Label>
                                                            <div className="flex items-center gap-2">
                                                                <Input
                                                                    className={unit
                                                                            .isBaseUnit
                                                                        ? "h-11 cursor-not-allowed rounded-xl border-[#BBF7D0] bg-[#F0FDF4] font-semibold text-[#166534]"
                                                                        : FIELD_CLASS}
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.000001"
                                                                    value={unit
                                                                        .conversionToBase}
                                                                    readOnly={unit
                                                                        .isBaseUnit}
                                                                    onChange={(
                                                                        event,
                                                                    ) => setProductUnits(
                                                                        (
                                                                            current,
                                                                        ) => current
                                                                            .map(
                                                                                (
                                                                                    item,
                                                                                ) => item
                                                                                        .id ===
                                                                                        unit.id
                                                                                    ? {
                                                                                        ...item,
                                                                                        conversionToBase:
                                                                                            event
                                                                                                .target
                                                                                                .value,
                                                                                    }
                                                                                    : item,
                                                                            ),
                                                                    )}
                                                                    placeholder="Example: 2.2"
                                                                />
                                                                <span className="min-w-12 shrink-0 text-sm font-semibold text-slate-600">
                                                                    {baseUom}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label className="lg:hidden">
                                                                Allow Fractional
                                                            </Label>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setProductUnits(
                                                                        (
                                                                            current,
                                                                        ) => current
                                                                            .map(
                                                                                (
                                                                                    item,
                                                                                ) => item
                                                                                        .id ===
                                                                                        unit.id
                                                                                    ? {
                                                                                        ...item,
                                                                                        allowFractionalQuantity:
                                                                                            !item
                                                                                                .allowFractionalQuantity,
                                                                                    }
                                                                                    : item,
                                                                            ),
                                                                    )}
                                                                className={`inline-flex h-10 min-w-24 items-center justify-center rounded-xl border px-3 text-sm font-bold transition ${
                                                                    unit.allowFractionalQuantity
                                                                        ? "border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]"
                                                                        : "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]"
                                                                }`}
                                                            >
                                                                {unit
                                                                        .allowFractionalQuantity
                                                                    ? "✓ Yes"
                                                                    : "× No"}
                                                            </button>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label className="lg:hidden">
                                                                Barcode
                                                            </Label>
                                                            <Input
                                                                className={FIELD_CLASS}
                                                                value={unit
                                                                    .barcode}
                                                                onChange={(
                                                                    event,
                                                                ) => setProductUnits(
                                                                    (current) =>
                                                                        current
                                                                            .map(
                                                                                (
                                                                                    item,
                                                                                ) => item
                                                                                        .id ===
                                                                                        unit.id
                                                                                    ? {
                                                                                        ...item,
                                                                                        barcode:
                                                                                            event
                                                                                                .target
                                                                                                .value,
                                                                                    }
                                                                                    : item,
                                                                            ),
                                                                )}
                                                                placeholder="Optional"
                                                            />
                                                        </div>

                                                        <div className="flex min-w-0 items-center justify-start gap-0.5 lg:justify-end">
                                                            {unit.isBaseUnit
                                                                ? (
                                                                    <span className="whitespace-nowrap rounded-lg bg-slate-100 px-2 py-2 text-xs font-semibold text-slate-500">
                                                                        Locked
                                                                    </span>
                                                                )
                                                                : (
                                                                    <>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            disabled={!canMoveUp}
                                                                            onClick={() =>
                                                                                moveProductUnit(
                                                                                    unit.id,
                                                                                    -1,
                                                                                )}
                                                                            title="Move up"
                                                                            className="h-8 w-8 shrink-0 rounded-lg"
                                                                        >
                                                                            <ArrowUp className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            disabled={!canMoveDown}
                                                                            onClick={() =>
                                                                                moveProductUnit(
                                                                                    unit.id,
                                                                                    1,
                                                                                )}
                                                                            title="Move down"
                                                                            className="h-8 w-8 shrink-0 rounded-lg"
                                                                        >
                                                                            <ArrowDown className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() =>
                                                                                setProductUnits(
                                                                                    (
                                                                                        current,
                                                                                    ) => current
                                                                                        .filter(
                                                                                            (
                                                                                                item,
                                                                                            ) => item
                                                                                                .id !==
                                                                                                unit.id,
                                                                                        ),
                                                                                )}
                                                                            title="Remove unit"
                                                                            className="h-8 w-8 shrink-0 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </>
                                                                )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="flex flex-col gap-2 border-t border-[#BFDBFE] bg-[#EFF6FF] px-3 py-3 text-xs text-[#1E3A8A] sm:flex-row sm:items-center sm:justify-between">
                                            <span>
                                                Base Unit ({baseUom}) is the
                                                common calculation unit used
                                                across REDS.
                                            </span>
                                            <span className="font-semibold">
                                                Use arrows to arrange packaging
                                                levels.
                                            </span>
                                        </div>
                                    </div>
                                )}

                            <div className="mt-4 grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label>Default Waste %</Label>
                                    <Input
                                        className={FIELD_CLASS}
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={wastePercent}
                                        onChange={(event) =>
                                            setWastePercent(event.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select
                                        value={isActive ? "active" : "inactive"}
                                        onValueChange={(value) =>
                                            setIsActive(value === "active")}
                                    >
                                        <SelectTrigger className={FIELD_CLASS}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">
                                                Active
                                            </SelectItem>
                                            <SelectItem value="inactive">
                                                Inactive
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <label className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white p-3 text-sm font-semibold md:self-end">
                                    <input
                                        type="checkbox"
                                        checked={usesCoverage}
                                        onChange={(event) => setUsesCoverage(
                                            event.target.checked,
                                        )}
                                        className="h-4 w-4 rounded border-slate-300 text-red-600"
                                    />
                                    <span>
                                        <span className="block">
                                            Uses Coverage / Yield
                                        </span>
                                        <span className="mt-1 block text-xs font-normal text-slate-500">
                                            Enable structured coverage
                                            information for this Product.
                                        </span>
                                    </span>
                                </label>
                            </div>
                        </section>

                        {usesCoverage
                            ? (
                                <section className="rounded-2xl border border-[#E5E7EB] bg-[#FCFAFA] p-4">
                                    <SectionHeading
                                        number={3}
                                        title="Specifications & Coverage"
                                        helper="Store structured estimated coverage per source unit."
                                    />
                                    <p className="mt-1 text-sm text-slate-500">
                                        Example: 1 box covers approximately 1.8
                                        sqm.
                                    </p>
                                    <div className="mt-4 grid gap-4 md:grid-cols-4">
                                        <div className="space-y-2">
                                            <Label>Source Quantity *</Label>
                                            <Input
                                                className={FIELD_CLASS}
                                                type="number"
                                                min="0"
                                                value={coverageForm
                                                    .sourceQuantity}
                                                onChange={(event) =>
                                                    setCoverageForm({
                                                        ...coverageForm,
                                                        sourceQuantity:
                                                            event.target.value,
                                                    })}
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
                                                    })}
                                                options={uomOptions.filter((
                                                    option,
                                                ) => productUnits.some((unit) =>
                                                    unit.uomCode ===
                                                        option.value
                                                ))}
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
                                                value={coverageForm
                                                    .coverageQuantity}
                                                onChange={(event) =>
                                                    setCoverageForm({
                                                        ...coverageForm,
                                                        coverageQuantity:
                                                            event.target.value,
                                                    })}
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
                                                    })}
                                                options={uomOptions.filter((
                                                    option,
                                                ) => units.find((unit) =>
                                                    unit.uom_code ===
                                                        option.value
                                                )?.is_active)}
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
                                                value={coverageForm
                                                    .minimumCoverage}
                                                onChange={(event) =>
                                                    setCoverageForm({
                                                        ...coverageForm,
                                                        minimumCoverage:
                                                            event.target.value,
                                                    })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Maximum Coverage</Label>
                                            <Input
                                                className={FIELD_CLASS}
                                                type="number"
                                                value={coverageForm
                                                    .maximumCoverage}
                                                onChange={(event) =>
                                                    setCoverageForm({
                                                        ...coverageForm,
                                                        maximumCoverage:
                                                            event.target.value,
                                                    })}
                                            />
                                        </div>
                                        <div className="space-y-4 md:col-span-4">
                                            <div className="space-y-2">
                                                <Label>Coverage Type *</Label>

                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <label
                                                        className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                                                            coverageForm
                                                                    .isEstimate
                                                                ? "border-[#9E4B4B] bg-[#FBF1F1] text-slate-900"
                                                                : "border-[#E5E7EB] bg-[#F7F9FB] text-slate-700 hover:border-[#9E4B4B]"
                                                        }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="coverage-type"
                                                            checked={coverageForm
                                                                .isEstimate}
                                                            onChange={() =>
                                                                setCoverageForm(
                                                                    {
                                                                        ...coverageForm,
                                                                        isEstimate:
                                                                            true,
                                                                    },
                                                                )}
                                                            className="h-4 w-4 shrink-0 accent-[#9E4B4B]"
                                                        />

                                                        <span className="min-w-0">
                                                            <span className="block">
                                                                Estimated
                                                            </span>
                                                            <span className="mt-0.5 block text-xs font-normal leading-5 text-slate-500">
                                                                Coverage may
                                                                vary depending
                                                                on site
                                                                conditions and
                                                                waste.
                                                            </span>
                                                        </span>
                                                    </label>

                                                    <label
                                                        className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                                                            !coverageForm
                                                                    .isEstimate
                                                                ? "border-[#9E4B4B] bg-[#FBF1F1] text-slate-900"
                                                                : "border-[#E5E7EB] bg-[#F7F9FB] text-slate-700 hover:border-[#9E4B4B]"
                                                        }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="coverage-type"
                                                            checked={!coverageForm
                                                                .isEstimate}
                                                            onChange={() =>
                                                                setCoverageForm(
                                                                    {
                                                                        ...coverageForm,
                                                                        isEstimate:
                                                                            false,
                                                                    },
                                                                )}
                                                            className="h-4 w-4 shrink-0 accent-[#9E4B4B]"
                                                        />

                                                        <span className="min-w-0">
                                                            <span className="block">
                                                                Confirmed
                                                            </span>
                                                            <span className="mt-0.5 block text-xs font-normal leading-5 text-slate-500">
                                                                Coverage is
                                                                confirmed from
                                                                reliable
                                                                manufacturer
                                                                data.
                                                            </span>
                                                        </span>
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Default Coverage</Label>

                                                <div className="rounded-xl border border-[#E5E7EB] bg-[#F1F3F5] px-4 py-3">
                                                    <p className="text-sm font-semibold text-slate-800">
                                                        Yes
                                                    </p>
                                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                                        Phase 1 supports one
                                                        default Coverage / Yield
                                                        record per Product.
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
                                                        notes:
                                                            event.target.value,
                                                    })}
                                            />
                                        </div>
                                    </div>
                                </section>
                            )
                            : null}

                        {categoryId
                            ? (
                                <section className="rounded-2xl border border-[#E5E7EB] bg-[#FCFAFA] p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <h3 className="font-bold text-slate-900">
                                                Product Specifications
                                            </h3>
                                            <p className="mt-1 text-sm text-slate-500">
                                                Category-driven product details.
                                                Required fields must be
                                                completed before activation.
                                            </p>
                                        </div>
                                        {isAdmin
                                            ? (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        openMasterData(
                                                            "attributes",
                                                        )}
                                                    className="h-9 rounded-xl border-[#D8B4B4] text-[#7F1D1D] hover:bg-[#FBF1F1]"
                                                >
                                                    <Settings2 className="mr-2 h-4 w-4" />
                                                    Manage Attributes
                                                </Button>
                                            )
                                            : null}
                                    </div>

                                    {loadingAttributes
                                        ? (
                                            <p className="mt-4 text-sm text-slate-500">
                                                Loading Product fields...
                                            </p>
                                        )
                                        : groupedAttributes.length === 0
                                        ? (
                                            <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                                                This Category has no Dynamic
                                                Attributes.
                                            </p>
                                        )
                                        : (
                                            <div className="mt-4 space-y-5">
                                                {groupedAttributes.map((
                                                    [sectionName, attributes],
                                                ) => (
                                                    <div
                                                        key={sectionName}
                                                        className="rounded-xl bg-slate-50 p-4"
                                                    >
                                                        <h4 className="font-bold text-slate-800">
                                                            {sectionName}
                                                        </h4>
                                                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                                                            {attributes.map((
                                                                attribute,
                                                            ) => (
                                                                <div
                                                                    key={attribute
                                                                        .attribute_id}
                                                                    className={attribute
                                                                                    .data_type ===
                                                                                "long_text" ||
                                                                            attribute
                                                                                    .data_type ===
                                                                                "multi_select"
                                                                        ? "space-y-2 md:col-span-2"
                                                                        : "space-y-2"}
                                                                >
                                                                    <Label>
                                                                        {attribute
                                                                            .effective_label}
                                                                        {attribute
                                                                                .is_required
                                                                            ? " *"
                                                                            : ""}
                                                                        {attribute
                                                                                .unit_symbol
                                                                            ? ` (${attribute.unit_symbol})`
                                                                            : ""}
                                                                    </Label>
                                                                    {renderDynamicField(
                                                                        attribute,
                                                                    )}
                                                                    {attribute
                                                                            .effective_help_text
                                                                        ? (
                                                                            <p className="text-xs text-slate-500">
                                                                                {attribute
                                                                                    .effective_help_text}
                                                                            </p>
                                                                        )
                                                                        : null}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                </section>
                            )
                            : null}

                        <section className="rounded-2xl border border-[#E5E7EB] bg-[#FCFAFA] p-4">
                            <SectionHeading
                                number={4}
                                title="Review and Status"
                                helper="Confirm the product flags and status before saving."
                            />

                            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                <div className="rounded-xl border border-[#E5E7EB] bg-white p-3 text-sm">
                                    <span className="text-slate-500">
                                        Product Type
                                    </span>
                                    <p className="mt-1 font-semibold text-slate-900">
                                        {productType}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-[#E5E7EB] bg-white p-3 text-sm">
                                    <span className="text-slate-500">
                                        Base UOM
                                    </span>
                                    <p className="mt-1 font-semibold text-slate-900">
                                        {baseUom || "Not selected"}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-[#E5E7EB] bg-white p-3 text-sm">
                                    <span className="text-slate-500">
                                        Stock Item
                                    </span>
                                    <p className="mt-1 font-semibold text-slate-900">
                                        {isStockItem ? "Yes" : "No"}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Derived from Product Type.
                                    </p>
                                </div>

                                <div className="rounded-xl border border-[#E5E7EB] bg-white p-3 text-sm">
                                    <span className="text-slate-500">
                                        Service Item
                                    </span>
                                    <p className="mt-1 font-semibold text-slate-900">
                                        {isServiceItem ? "Yes" : "No"}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Derived from Product Type.
                                    </p>
                                </div>

                                <div className="rounded-xl border border-[#E5E7EB] bg-white p-3 text-sm sm:col-span-2 lg:col-span-1">
                                    <span className="text-slate-500">
                                        Status
                                    </span>
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
                                disabled={saveProduct.isPending ||
                                    loadingAttributes}
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

            <ProductInlineMasterDataDialog
                open={masterDataOpen}
                onOpenChange={setMasterDataOpen}
                initialTab={masterDataTab}
                selectedCategoryId={categoryId || null}
                onCategorySelected={(selectedId) => {
                    setCategoryId(selectedId);
                    setDynamicValues({});
                    setCategorySearch("");
                    setCategoryComboboxOpen(false);
                }}
                onDataChanged={async () => {
                    await Promise.all([
                        queryClient.invalidateQueries({
                            queryKey: ["products", "categories"],
                        }),
                        queryClient.invalidateQueries({
                            queryKey: ["products", "effective-attributes"],
                        }),
                        queryClient.invalidateQueries({
                            queryKey: ["products", "attribute-options"],
                        }),
                        queryClient.invalidateQueries({
                            queryKey: ["product-code-builder"],
                        }),
                    ]);
                }}
            />

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
