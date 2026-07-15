import { useEffect, useMemo, useState } from "react";
import {
    Box,
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
    cost_price: number | null;
    default_sell_price: number | null;
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
    product_specification_type: string | null;
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

type FlooringForm = {
    dimensionType: string;
    width: string;
    length: string;
    minLength: string;
    maxLength: string;
    thickness: string;
    planksPerBox: string;
    declaredSqmPerBox: string;
    coverageMethod: string;
    manufacturerName: string;
    manufacturerCode: string;
    manufacturerNotes: string;
};

type CoverageForm = {
    sourceQuantity: string;
    sourceUom: string;
    coverageQuantity: string;
    coverageUom: string;
    minimumCoverage: string;
    maximumCoverage: string;
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

const emptyFlooring = (): FlooringForm => ({
    dimensionType: "fixed",
    width: "",
    length: "",
    minLength: "",
    maxLength: "",
    thickness: "",
    planksPerBox: "",
    declaredSqmPerBox: "",
    coverageMethod: "manufacturer_declared",
    manufacturerName: "",
    manufacturerCode: "",
    manufacturerNotes: "",
});

const emptyCoverage = (): CoverageForm => ({
    sourceQuantity: "1",
    sourceUom: "",
    coverageQuantity: "",
    coverageUom: "sqm",
    minimumCoverage: "",
    maximumCoverage: "",
    notes: "",
});

const numberOrNull = (value: string) =>
    value.trim() === "" ? null : Number(value);

const escapeCsv = (value: unknown) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

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
    const [viewingProduct, setViewingProduct] = useState<ProductRow | null>(null);

    const [productCode, setProductCode] = useState("");
    const [showCodeBuilder, setShowCodeBuilder] = useState(false);

    const [productCodeIdentity, setProductCodeIdentity] =
        useState<ProductCodeBuilderValue | null>(null);
    const [productName, setProductName] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [productType, setProductType] = useState<ProductType>("Material");
    const [description, setDescription] = useState("");
    const [baseUom, setBaseUom] = useState("");
    const [purchaseUom, setPurchaseUom] = useState("");
    const [requestUom, setRequestUom] = useState("");
    const [salesUom, setSalesUom] = useState("");
    const [costPrice, setCostPrice] = useState("");
    const [sellPrice, setSellPrice] = useState("");
    const [wastePercent, setWastePercent] = useState("0");
    const [usesCoverage, setUsesCoverage] = useState(false);
    const [isStockItem, setIsStockItem] = useState(true);
    const [isServiceItem, setIsServiceItem] = useState(false);
    const [searchKeywords, setSearchKeywords] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [dynamicValues, setDynamicValues] = useState<
        Record<string, AttributeFormValue>
    >({});
    const [flooringForm, setFlooringForm] = useState<FlooringForm>(emptyFlooring);
    const [coverageForm, setCoverageForm] = useState<CoverageForm>(emptyCoverage);
    const [uomConversions, setUomConversions] = useState<UomConversionForm[]>([]);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setRole(normalizeAppRole(data.user?.app_metadata?.app_role));
        });
    }, []);

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
          cost_price,
          default_sell_price,
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
          product_specification_type,
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

    const { data: units = [] } = useQuery({
        queryKey: ["products", "units"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("units_of_measure")
                .select("uom_code,uom_name,uom_symbol,is_active")
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

    const { data: specificationType = null } = useQuery({
        queryKey: ["products", "specification-type", categoryId],
        enabled: Boolean(categoryId),
        queryFn: async () => {
            const { data, error } = await supabase.rpc(
                "get_effective_product_specification_type",
                { p_category_id: categoryId },
            );
            if (error) throw error;
            return data as string | null;
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

        return Array.from(groups.entries());
    }, [effectiveAttributes]);

    const resetForm = () => {
        setEditingProduct(null);
        setProductCode("");
        setProductCodeIdentity(null);
        setShowCodeBuilder(false);
        setProductName("");
        setCategoryId("");
        setProductType("Material");
        setDescription("");
        setBaseUom("");
        setPurchaseUom("");
        setRequestUom("");
        setSalesUom("");
        setCostPrice("");
        setSellPrice("");
        setWastePercent("0");
        setUsesCoverage(false);
        setIsStockItem(true);
        setIsServiceItem(false);
        setSearchKeywords("");
        setIsActive(true);
        setDynamicValues({});
        setFlooringForm(emptyFlooring());
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
        setProductType(product.product_type as ProductType);
        setDescription(product.description ?? "");
        setBaseUom(product.base_uom_code ?? "");
        setPurchaseUom(product.default_purchase_uom_code ?? "");
        setRequestUom(product.default_request_uom_code ?? "");
        setSalesUom(product.default_sales_uom_code ?? "");
        setCostPrice(product.cost_price === null ? "" : String(product.cost_price));
        setSellPrice(
            product.default_sell_price === null
                ? ""
                : String(product.default_sell_price),
        );
        setWastePercent(String(product.default_waste_percent ?? 0));
        setUsesCoverage(product.uses_coverage);
        setIsStockItem(product.is_stock_item);
        setIsServiceItem(product.is_service_item);
        setSearchKeywords(product.search_keywords ?? "");
        setIsActive(product.is_active);

        const [valuesResult, flooringResult, coverageResult, conversionsResult] =
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
                    .from("product_flooring_specs")
                    .select("*")
                    .eq("product_id", product.product_id)
                    .eq("is_deleted", false)
                    .maybeSingle(),
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
        if (flooringResult.error) throw flooringResult.error;
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

        if (flooringResult.data) {
            const spec = flooringResult.data;
            setFlooringForm({
                dimensionType: spec.dimension_type,
                width: spec.plank_width_mm?.toString() ?? "",
                length: spec.plank_length_mm?.toString() ?? "",
                minLength: spec.minimum_length_mm?.toString() ?? "",
                maxLength: spec.maximum_length_mm?.toString() ?? "",
                thickness: spec.plank_thickness_mm?.toString() ?? "",
                planksPerBox: spec.planks_per_box?.toString() ?? "",
                declaredSqmPerBox: spec.declared_sqm_per_box?.toString() ?? "",
                coverageMethod: spec.coverage_method,
                manufacturerName: spec.manufacturer_name ?? "",
                manufacturerCode: spec.manufacturer_product_code ?? "",
                manufacturerNotes: spec.manufacturer_notes ?? "",
            });
        } else {
            setFlooringForm(emptyFlooring());
        }

        if (coverageResult.data) {
            const coverage = coverageResult.data;
            setCoverageForm({
                sourceQuantity: String(coverage.source_quantity),
                sourceUom: coverage.source_uom_code,
                coverageQuantity: String(coverage.coverage_quantity),
                coverageUom: coverage.coverage_uom_code,
                minimumCoverage: coverage.minimum_coverage?.toString() ?? "",
                maximumCoverage: coverage.maximum_coverage?.toString() ?? "",
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

        return [
            {
                source_quantity: sourceQuantity,
                source_uom_code: coverageForm.sourceUom,
                coverage_quantity: coverageQuantity,
                coverage_uom_code: coverageForm.coverageUom,
                minimum_coverage: numberOrNull(coverageForm.minimumCoverage),
                maximum_coverage: numberOrNull(coverageForm.maximumCoverage),
                is_estimate: true,
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
        product.cost_price ?? "",
        product.default_sell_price ?? "",
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
            "Cost Price",
            "Sell Price",
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

        const html = `<table><tr><th>Product Code</th><th>Product Name</th><th>Category</th><th>Product Type</th><th>Base UOM</th><th>Cost Price</th><th>Sell Price</th><th>Stock Item</th><th>Service Item</th><th>Status</th></tr>${rows}</table>`;
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
                <Select
                    value={typeof value === "boolean" ? (value ? "true" : "false") : ""}
                    onValueChange={(next) =>
                        setDynamicValue(attribute.attribute_id, next === "true")
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select Yes or No" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                </Select>
            );
        }

        if (attribute.data_type === "select") {
            const selectedValue =
                typeof value === "string" && value.trim() !== ""
                    ? value
                    : "__none__";

            return (
                <Select
                    value={selectedValue}
                    onValueChange={(next) =>
                        setDynamicValue(
                            attribute.attribute_id,
                            next === "__none__" ? "" : next
                        )
                    }
                >
                    <SelectTrigger>
                        <SelectValue
                            placeholder={`Select ${attribute.effective_label}`}
                        />
                    </SelectTrigger>

                    <SelectContent>
                        <SelectItem value="__none__">
                            — Clear selection —
                        </SelectItem>

                        {attributeOptions
                            .filter(
                                (option) =>
                                    option.attribute_id ===
                                    attribute.attribute_id
                            )
                            .map((option) => (
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
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                />
            );
        }

        return (
            <Input
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
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Search by product name, code, category or keyword..."
                            className="pl-10"
                        />
                    </div>

                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((category) => (
                                <SelectItem
                                    key={category.category_id}
                                    value={category.category_id}
                                >
                                    {categoryPath.get(category.category_id)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger>
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
                        <SelectTrigger>
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
                                        setViewingProduct(product);
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
                                    setViewingProduct(product);
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
                <DialogContent className="max-h-[90vh] w-[calc(100vw-24px)] max-w-5xl overflow-y-auto rounded-2xl p-4 sm:p-6">
                    <DialogHeader>
                        <DialogTitle>
                            {editingProduct ? "Edit Product" : "Add Product"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6">
                        <section className="rounded-2xl border border-slate-200 p-4">
                            <h3 className="font-bold text-slate-900">Product Information</h3>
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
                                        value={productName}
                                        onChange={(event) => setProductName(event.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Product Category *</Label>
                                    <Select
                                        value={categoryId}
                                        onValueChange={(value) => {
                                            setCategoryId(value);
                                            setDynamicValues({});
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories
                                                .filter(
                                                    (category) =>
                                                        category.is_active ||
                                                        category.category_id === categoryId,
                                                )
                                                .map((category) => (
                                                    <SelectItem
                                                        key={category.category_id}
                                                        value={category.category_id}
                                                    >
                                                        {categoryPath.get(category.category_id)}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
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
                                        <SelectTrigger>
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
                                        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label>Search Keywords</Label>
                                    <Input
                                        value={searchKeywords}
                                        onChange={(event) => setSearchKeywords(event.target.value)}
                                        placeholder="Example: oak engineered timber natural"
                                    />
                                </div>
                            </div>
                        </section>
                        <section className="rounded-2xl border border-slate-200 p-4">
                            <h3 className="font-bold text-slate-900">
                                Product Code Identity
                            </h3>

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
                        <section className="rounded-2xl border border-slate-200 p-4">
                            <h3 className="font-bold text-slate-900">Units and Pricing</h3>
                            <div className="mt-4 grid gap-4 md:grid-cols-4">
                                {[
                                    ["Base UOM *", baseUom, setBaseUom],
                                    ["Purchase UOM", purchaseUom, setPurchaseUom],
                                    ["Request UOM", requestUom, setRequestUom],
                                    ["Sales UOM", salesUom, setSalesUom],
                                ].map(([label, value, setter]) => (
                                    <div key={String(label)} className="space-y-2">
                                        <Label>{label as string}</Label>
                                        <Select
                                            value={value as string}
                                            onValueChange={setter as (value: string) => void}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select UOM" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {units
                                                    .filter(
                                                        (unit) => unit.is_active || unit.uom_code === value,
                                                    )
                                                    .map((unit) => (
                                                        <SelectItem
                                                            key={unit.uom_code}
                                                            value={unit.uom_code}
                                                        >
                                                            {unit.uom_name} ({unit.uom_symbol})
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ))}

                                <div className="space-y-2">
                                    <Label>Cost Price (AUD)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={costPrice}
                                        onChange={(event) => setCostPrice(event.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Default Sell Price (AUD)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={sellPrice}
                                        onChange={(event) => setSellPrice(event.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Default Waste %</Label>
                                    <Input
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
                                        <SelectTrigger>
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
                                {[
                                    ["Stock Item", isStockItem, setIsStockItem],
                                    ["Service Item", isServiceItem, setIsServiceItem],
                                    ["Uses Coverage", usesCoverage, setUsesCoverage],
                                ].map(([label, checked, setter]) => (
                                    <label
                                        key={String(label)}
                                        className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked as boolean}
                                            onChange={(event) =>
                                                (
                                                    setter as React.Dispatch<
                                                        React.SetStateAction<boolean>
                                                    >
                                                )(event.target.checked)
                                            }
                                            className="h-4 w-4 rounded border-slate-300 text-red-600"
                                        />
                                        {label as string}
                                    </label>
                                ))}
                            </div>
                        </section>

                        <section className="rounded-2xl border border-slate-200 p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h3 className="font-bold text-slate-900">UOM Conversions</h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Define how purchasing, requesting or selling units convert
                                        to the Base UOM.
                                    </p>
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
                                                    <Select
                                                        value={conversion.fromUom}
                                                        onValueChange={(value) =>
                                                            setUomConversions((current) =>
                                                                current.map((item) =>
                                                                    item.id === conversion.id
                                                                        ? { ...item, fromUom: value }
                                                                        : item,
                                                                ),
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select UOM" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {units
                                                                .filter((unit) => unit.is_active)
                                                                .map((unit) => (
                                                                    <SelectItem
                                                                        key={unit.uom_code}
                                                                        value={unit.uom_code}
                                                                    >
                                                                        {unit.uom_name} ({unit.uom_symbol})
                                                                    </SelectItem>
                                                                ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Conversion Factor *</Label>
                                                    <Input
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
                                                    <Label>To UOM *</Label>
                                                    <Select
                                                        value={conversion.toUom}
                                                        onValueChange={(value) =>
                                                            setUomConversions((current) =>
                                                                current.map((item) =>
                                                                    item.id === conversion.id
                                                                        ? { ...item, toUom: value }
                                                                        : item,
                                                                ),
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select UOM" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {units
                                                                .filter((unit) => unit.is_active)
                                                                .map((unit) => (
                                                                    <SelectItem
                                                                        key={unit.uom_code}
                                                                        value={unit.uom_code}
                                                                    >
                                                                        {unit.uom_name} ({unit.uom_symbol})
                                                                    </SelectItem>
                                                                ))}
                                                        </SelectContent>
                                                    </Select>
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
                            <section className="rounded-2xl border border-slate-200 p-4">
                                <h3 className="font-bold text-slate-900">Coverage / Yield</h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    Example: 1 box covers approximately 1.8 sqm.
                                </p>
                                <div className="mt-4 grid gap-4 md:grid-cols-4">
                                    <div className="space-y-2">
                                        <Label>Source Quantity *</Label>
                                        <Input
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
                                        <Select
                                            value={coverageForm.sourceUom}
                                            onValueChange={(value) =>
                                                setCoverageForm({
                                                    ...coverageForm,
                                                    sourceUom: value,
                                                })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select UOM" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {units.map((unit) => (
                                                    <SelectItem key={unit.uom_code} value={unit.uom_code}>
                                                        {unit.uom_name} ({unit.uom_symbol})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Coverage Quantity *</Label>
                                        <Input
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
                                        <Select
                                            value={coverageForm.coverageUom}
                                            onValueChange={(value) =>
                                                setCoverageForm({
                                                    ...coverageForm,
                                                    coverageUom: value,
                                                })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select UOM" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {units.map((unit) => (
                                                    <SelectItem key={unit.uom_code} value={unit.uom_code}>
                                                        {unit.uom_name} ({unit.uom_symbol})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Minimum Coverage</Label>
                                        <Input
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
                                    <div className="space-y-2 md:col-span-2">
                                        <Label>Coverage Notes</Label>
                                        <Input
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

                        {specificationType === "flooring" ? (
                            <section className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
                                <h3 className="font-bold text-slate-900">
                                    Flooring Specifications
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    Structured values used for stock, receiving, damage and
                                    coverage calculations.
                                </p>
                                <div className="mt-4 grid gap-4 md:grid-cols-4">
                                    <div className="space-y-2">
                                        <Label>Dimension Type</Label>
                                        <Select
                                            value={flooringForm.dimensionType}
                                            onValueChange={(value) =>
                                                setFlooringForm({
                                                    ...flooringForm,
                                                    dimensionType: value,
                                                })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="fixed">Fixed Length</SelectItem>
                                                <SelectItem value="random">Random Length</SelectItem>
                                                <SelectItem value="mixed">Mixed Length</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {[
                                        ["Plank Width (mm)", "width"],
                                        ["Plank Length (mm)", "length"],
                                        ["Minimum Length (mm)", "minLength"],
                                        ["Maximum Length (mm)", "maxLength"],
                                        ["Plank Thickness (mm)", "thickness"],
                                        ["Planks per Box", "planksPerBox"],
                                        ["Declared SQM per Box", "declaredSqmPerBox"],
                                    ].map(([label, key]) => (
                                        <div key={key} className="space-y-2">
                                            <Label>{label}</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.0001"
                                                value={flooringForm[key as keyof FlooringForm]}
                                                onChange={(event) =>
                                                    setFlooringForm({
                                                        ...flooringForm,
                                                        [key]: event.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                    ))}
                                    <div className="space-y-2">
                                        <Label>Coverage Method</Label>
                                        <Select
                                            value={flooringForm.coverageMethod}
                                            onValueChange={(value) =>
                                                setFlooringForm({
                                                    ...flooringForm,
                                                    coverageMethod: value,
                                                })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="manufacturer_declared">
                                                    Manufacturer Declared
                                                </SelectItem>
                                                <SelectItem value="calculated">Calculated</SelectItem>
                                                <SelectItem value="manual">Manual</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Manufacturer Name</Label>
                                        <Input
                                            value={flooringForm.manufacturerName}
                                            onChange={(event) =>
                                                setFlooringForm({
                                                    ...flooringForm,
                                                    manufacturerName: event.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Manufacturer Product Code</Label>
                                        <Input
                                            value={flooringForm.manufacturerCode}
                                            onChange={(event) =>
                                                setFlooringForm({
                                                    ...flooringForm,
                                                    manufacturerCode: event.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label>Manufacturer Notes</Label>
                                        <Input
                                            value={flooringForm.manufacturerNotes}
                                            onChange={(event) =>
                                                setFlooringForm({
                                                    ...flooringForm,
                                                    manufacturerNotes: event.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                            </section>
                        ) : null}

                        {categoryId ? (
                            <section className="rounded-2xl border border-slate-200 p-4">
                                <h3 className="font-bold text-slate-900">
                                    Category-specific Product Details
                                </h3>

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

            <Dialog open={showView} onOpenChange={setShowView}>
                <DialogContent className="w-[calc(100vw-24px)] max-w-2xl rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Product Details</DialogTitle>
                    </DialogHeader>

                    {viewingProduct ? (
                        <div className="space-y-4">
                            <div>
                                <p className="text-xl font-bold text-slate-900">
                                    {viewingProduct.product_name}
                                </p>
                                <p className="font-mono text-sm text-slate-500">
                                    {viewingProduct.product_code}
                                </p>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {[
                                    [
                                        "Category",
                                        viewingProduct.product_categories?.category_name ?? "-",
                                    ],
                                    ["Product Type", viewingProduct.product_type],
                                    ["Base UOM", viewingProduct.base_uom_code ?? "-"],
                                    [
                                        "Cost Price",
                                        viewingProduct.cost_price === null
                                            ? "-"
                                            : `$${viewingProduct.cost_price.toFixed(2)}`,
                                    ],
                                    [
                                        "Sell Price",
                                        viewingProduct.default_sell_price === null
                                            ? "-"
                                            : `$${viewingProduct.default_sell_price.toFixed(2)}`,
                                    ],
                                    ["Coverage", viewingProduct.uses_coverage ? "Yes" : "No"],
                                ].map(([label, value]) => (
                                    <div key={label} className="rounded-xl bg-slate-50 p-3">
                                        <p className="text-xs text-slate-500">{label}</p>
                                        <p className="mt-1 font-semibold text-slate-900">{value}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="rounded-xl bg-slate-50 p-3">
                                <p className="text-xs text-slate-500">Description</p>
                                <p className="mt-1 text-sm text-slate-700">
                                    {viewingProduct.description || "-"}
                                </p>
                            </div>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Products;