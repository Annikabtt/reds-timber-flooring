import { useEffect, useMemo, useState } from "react";
import {
    Boxes,
    Braces,
    Grid3X3,
    Layers3,
    Palette,
    Pencil,
    Plus,
    Ruler,
    Search,
    ShieldCheck,
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
import { toast } from "sonner";
import { type AppRole, isAdmin, normalizeAppRole } from "@/lib/roles";
import ProductCodeBuilderModal, {
    type ProductCodeBuilderValue,
} from "@/components/products/ProductCodeBuilderModal";

type TabKey =
    "families" | "variants" | "ranges" | "types" | "size-rules" | "colours";

type RecordStatus = "active" | "reserved" | "inactive";
type StatusFilter = "all" | RecordStatus;

type RangeRow = {
    id: string;
    code: string;
    name: string;
    description: string | null;
    start: number;
    end: number;
    domain: string;
    guidance: string | null;
    locked: boolean;
    adminOnly: boolean;
    status: RecordStatus;
    sortOrder: number;
    active: boolean;
};

type TypeRow = {
    id: string;
    code: string;
    name: string;
    description: string | null;
    productClass: string;
    guidance: string | null;
    status: RecordStatus;
    sortOrder: number;
    active: boolean;
};

type SizeRuleRow = {
    id: string;
    code: string;
    name: string;
    description: string | null;
    firstLabel: string;
    secondLabel: string;
    firstUnit: string | null;
    secondUnit: string | null;
    firstMode: string;
    secondMode: string;
    allowFirstUnspecified: boolean;
    allowSecondUnspecified: boolean;
    example: string;
    guidance: string | null;
    status: RecordStatus;
    sortOrder: number;
    active: boolean;
};

type ColourRow = {
    id: string;
    code: string;
    name: string;
    description: string | null;
    hex: string | null;
    referenceOnly: boolean;
    notApplicable: boolean;
    guidance: string | null;
    status: RecordStatus;
    sortOrder: number;
    active: boolean;
};

type FamilyRow = {
    id: string;
    rangeId: string;
    rangeCode: string;
    code: string;
    name: string;
    description: string | null;
    domain: string;
    defaultTypeId: string | null;
    defaultTypeCode: string | null;
    defaultSizeRuleId: string | null;
    defaultSizeRuleCode: string | null;
    colourMode: string;
    variantMeaning: string;
    guidance: string | null;
    reservationNotes: string | null;
    status: RecordStatus;
    sortOrder: number;
    active: boolean;
};

type VariantRow = {
    id: string;
    familyId: string;
    familyCode: string;
    familyName: string;
    digit: string;
    fullCode: string;
    name: string;
    description: string | null;
    thickness: number | null;
    subtype: string | null;
    sizeRuleId: string | null;
    sizeRuleCode: string | null;
    colourModeOverride: string | null;
    guidance: string | null;
    reservationNotes: string | null;
    status: RecordStatus;
    sortOrder: number;
    active: boolean;
};

const db = supabase as any;

const TABS = [
    { key: "families" as const, title: "Product Families", icon: Boxes },
    { key: "variants" as const, title: "Category Variants", icon: Grid3X3 },
    { key: "ranges" as const, title: "Code Ranges", icon: Layers3 },
    { key: "types" as const, title: "Product Types", icon: Braces },
    { key: "size-rules" as const, title: "Size Rules", icon: Ruler },
    { key: "colours" as const, title: "Colours", icon: Palette },
];

const STATUS_OPTIONS: RecordStatus[] = ["active", "reserved", "inactive"];

const DOMAIN_OPTIONS = [
    "flooring",
    "floor_preparation",
    "adhesives_consumables",
    "finishing_accessories",
    "hand_tools",
    "power_tools",
    "cleaning",
    "protective_consumables",
    "equipment_assets",
    "services",
    "future",
];

const PRODUCT_CLASS_OPTIONS = [
    "material",
    "consumable",
    "tool",
    "equipment",
    "labour",
    "service",
    "freight",
    "subcontract",
];

const COLOUR_MODE_OPTIONS = ["required", "optional", "not_applicable"];
const VARIANT_MEANING_OPTIONS = [
    "thickness",
    "subtype",
    "grade",
    "pack_size",
    "category_variant",
];

const statusLabel = (status: RecordStatus) =>
    status === "active"
        ? "Active"
        : status === "reserved"
            ? "Reserved"
            : "Inactive";

const statusClass = (status: RecordStatus) =>
    status === "active"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : status === "reserved"
            ? "border-amber-200 bg-amber-50 text-amber-700"
            : "border-slate-200 bg-slate-100 text-slate-600";

const parseNonNegative = (value: string, label: string) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0) {
        throw new Error(`${label} must be zero or a positive number.`);
    }
    return numeric;
};

const ProductCodeManagement = () => {
    const queryClient = useQueryClient();
    const [role, setRole] = useState<AppRole>("viewer");
    const userIsAdmin = isAdmin(role);

    const [tab, setTab] = useState<TabKey>("families");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [rangeFilter, setRangeFilter] = useState("all");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [builderOpen, setBuilderOpen] = useState(false);
    const [builderResult, setBuilderResult] =
        useState<ProductCodeBuilderValue | null>(null);

    const [rangeForm, setRangeForm] = useState({
        code: "",
        name: "",
        description: "",
        start: "",
        end: "",
        domain: "future",
        guidance: "",
        status: "active" as RecordStatus,
        sortOrder: "0",
        active: true,
    });

    const [typeForm, setTypeForm] = useState({
        code: "",
        name: "",
        description: "",
        productClass: "material",
        guidance: "",
        status: "active" as RecordStatus,
        sortOrder: "0",
        active: true,
    });

    const [sizeForm, setSizeForm] = useState({
        code: "",
        name: "",
        description: "",
        firstLabel: "Width",
        secondLabel: "Length",
        firstUnit: "mm",
        secondUnit: "mm",
        firstMode: "numeric",
        secondMode: "numeric",
        allowFirstUnspecified: false,
        allowSecondUnspecified: false,
        example: "190X2200",
        guidance: "",
        status: "active" as RecordStatus,
        sortOrder: "0",
        active: true,
    });

    const [colourForm, setColourForm] = useState({
        code: "",
        name: "",
        description: "",
        hex: "",
        referenceOnly: true,
        notApplicable: false,
        guidance: "",
        status: "active" as RecordStatus,
        sortOrder: "0",
        active: true,
    });

    const [familyForm, setFamilyForm] = useState({
        rangeId: "",
        code: "",
        name: "",
        description: "",
        defaultTypeId: "none",
        defaultSizeRuleId: "none",
        colourMode: "optional",
        variantMeaning: "category_variant",
        guidance: "",
        reservationNotes: "",
        status: "active" as RecordStatus,
        sortOrder: "0",
        active: true,
    });

    const [variantForm, setVariantForm] = useState({
        familyId: "",
        digit: "",
        name: "",
        description: "",
        thickness: "",
        subtype: "",
        sizeRuleId: "default",
        colourModeOverride: "default",
        guidance: "",
        reservationNotes: "",
        status: "active" as RecordStatus,
        sortOrder: "0",
        active: true,
    });

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setRole(normalizeAppRole(data.user?.app_metadata?.app_role));
        });
    }, []);

    const { data: ranges = [], isLoading: loadingRanges } = useQuery({
        queryKey: ["product-code-management", "ranges"],
        queryFn: async (): Promise<RangeRow[]> => {
            const { data, error } = await db
                .from("product_code_ranges")
                .select("*")
                .eq("is_deleted", false)
                .order("start_family_number");
            if (error) throw error;
            return (data ?? []).map((row: any) => ({
                id: row.product_code_range_id,
                code: row.range_code,
                name: row.range_name,
                description: row.description,
                start: row.start_family_number,
                end: row.end_family_number,
                domain: row.product_domain,
                guidance: row.guidance_text,
                locked: row.is_locked,
                adminOnly: row.admin_only_manage,
                status: row.status,
                sortOrder: row.sort_order,
                active: row.is_active,
            }));
        },
    });

    const { data: types = [], isLoading: loadingTypes } = useQuery({
        queryKey: ["product-code-management", "types"],
        queryFn: async (): Promise<TypeRow[]> => {
            const { data, error } = await db
                .from("product_code_types")
                .select("*")
                .eq("is_deleted", false)
                .order("sort_order")
                .order("type_code");
            if (error) throw error;
            return (data ?? []).map((row: any) => ({
                id: row.product_code_type_id,
                code: row.type_code,
                name: row.type_name,
                description: row.description,
                productClass: row.product_class,
                guidance: row.guidance_text,
                status: row.status,
                sortOrder: row.sort_order,
                active: row.is_active,
            }));
        },
    });

    const { data: sizeRules = [], isLoading: loadingSizeRules } = useQuery({
        queryKey: ["product-code-management", "size-rules"],
        queryFn: async (): Promise<SizeRuleRow[]> => {
            const { data, error } = await db
                .from("product_code_size_rules")
                .select("*")
                .eq("is_deleted", false)
                .order("sort_order")
                .order("size_rule_code");
            if (error) throw error;
            return (data ?? []).map((row: any) => ({
                id: row.product_code_size_rule_id,
                code: row.size_rule_code,
                name: row.size_rule_name,
                description: row.description,
                firstLabel: row.first_value_label,
                secondLabel: row.second_value_label,
                firstUnit: row.first_value_unit,
                secondUnit: row.second_value_unit,
                firstMode: row.first_value_mode,
                secondMode: row.second_value_mode,
                allowFirstUnspecified: row.allow_first_unspecified,
                allowSecondUnspecified: row.allow_second_unspecified,
                example: row.example_size_token,
                guidance: row.guidance_text,
                status: row.status,
                sortOrder: row.sort_order,
                active: row.is_active,
            }));
        },
    });

    const { data: colours = [], isLoading: loadingColours } = useQuery({
        queryKey: ["product-code-management", "colours"],
        queryFn: async (): Promise<ColourRow[]> => {
            const { data, error } = await db
                .from("product_colours")
                .select("*")
                .eq("is_deleted", false)
                .order("sort_order")
                .order("colour_code");
            if (error) throw error;
            return (data ?? []).map((row: any) => ({
                id: row.product_colour_id,
                code: row.colour_code,
                name: row.colour_name,
                description: row.description,
                hex: row.reference_hex,
                referenceOnly: row.is_reference_only,
                notApplicable: row.is_not_applicable,
                guidance: row.guidance_text,
                status: row.status,
                sortOrder: row.sort_order,
                active: row.is_active,
            }));
        },
    });

    const { data: families = [], isLoading: loadingFamilies } = useQuery({
        queryKey: ["product-code-management", "families"],
        queryFn: async (): Promise<FamilyRow[]> => {
            const { data, error } = await db
                .from("product_code_families")
                .select(
                    `
          *,
          product_code_ranges(range_code),
          product_code_types(type_code),
          product_code_size_rules(size_rule_code)
        `,
                )
                .eq("is_deleted", false)
                .order("family_code");
            if (error) throw error;
            return (data ?? []).map((row: any) => ({
                id: row.product_code_family_id,
                rangeId: row.product_code_range_id,
                rangeCode: row.product_code_ranges?.range_code ?? "-",
                code: row.family_code,
                name: row.family_name,
                description: row.description,
                domain: row.product_domain,
                defaultTypeId: row.default_product_code_type_id,
                defaultTypeCode: row.product_code_types?.type_code ?? null,
                defaultSizeRuleId: row.default_size_rule_id,
                defaultSizeRuleCode:
                    row.product_code_size_rules?.size_rule_code ?? null,
                colourMode: row.colour_mode,
                variantMeaning: row.variant_meaning,
                guidance: row.guidance_text,
                reservationNotes: row.reservation_notes,
                status: row.status,
                sortOrder: row.sort_order,
                active: row.is_active,
            }));
        },
    });

    const { data: variants = [], isLoading: loadingVariants } = useQuery({
        queryKey: ["product-code-management", "variants"],
        queryFn: async (): Promise<VariantRow[]> => {
            const { data, error } = await db
                .from("product_code_category_variants")
                .select(
                    `
          *,
          product_code_families(family_code,family_name),
          product_code_size_rules(size_rule_code)
        `,
                )
                .eq("is_deleted", false)
                .order("full_category_code");
            if (error) throw error;
            return (data ?? []).map((row: any) => ({
                id: row.product_code_category_variant_id,
                familyId: row.product_code_family_id,
                familyCode: row.product_code_families?.family_code ?? "-",
                familyName: row.product_code_families?.family_name ?? "-",
                digit: row.variant_digit,
                fullCode: row.full_category_code,
                name: row.variant_name,
                description: row.description,
                thickness: row.thickness_mm,
                subtype: row.subtype_value,
                sizeRuleId: row.size_rule_id,
                sizeRuleCode: row.product_code_size_rules?.size_rule_code ?? null,
                colourModeOverride: row.colour_mode_override,
                guidance: row.guidance_text,
                reservationNotes: row.reservation_notes,
                status: row.status,
                sortOrder: row.sort_order,
                active: row.is_active,
            }));
        },
    });

    const allRows = useMemo(() => {
        if (tab === "families") return families;
        if (tab === "variants") return variants;
        if (tab === "ranges") return ranges;
        if (tab === "types") return types;
        if (tab === "size-rules") return sizeRules;
        return colours;
    }, [tab, families, variants, ranges, types, sizeRules, colours]);

    const loading =
        tab === "families"
            ? loadingFamilies
            : tab === "variants"
                ? loadingVariants
                : tab === "ranges"
                    ? loadingRanges
                    : tab === "types"
                        ? loadingTypes
                        : tab === "size-rules"
                            ? loadingSizeRules
                            : loadingColours;

    const summary = useMemo(() => {
        const statuses = allRows.map((row: any) => row.status as RecordStatus);
        return {
            total: allRows.length,
            active: statuses.filter((value) => value === "active").length,
            reserved: statuses.filter((value) => value === "reserved").length,
            inactive: statuses.filter((value) => value === "inactive").length,
        };
    }, [allRows]);

    const allocatedFamilyCodes = useMemo(
        () => new Set(families.map((family) => Number(family.code))),
        [families],
    );

    const availableFamilyCodes = useMemo(() => {
        return ranges.flatMap((range) => {
            const result: string[] = [];
            for (let value = range.start; value <= range.end; value += 1) {
                if (!allocatedFamilyCodes.has(value)) {
                    result.push(String(value).padStart(2, "0"));
                }
            }
            return result;
        });
    }, [ranges, allocatedFamilyCodes]);

    const filteredRows = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        const getPrimaryCode = (row: any) => {
            if (tab === "families") return String(row.code ?? "");
            if (tab === "variants") return String(row.fullCode ?? "");
            if (tab === "ranges") return String(row.rangeCode ?? "");
            if (tab === "types") return String(row.code ?? "");
            if (tab === "size-rules") return String(row.code ?? "");
            if (tab === "colours") return String(row.code ?? "");

            return "";
        };

        const getPrimaryName = (row: any) => {
            return String(
                row.name ??
                row.rangeName ??
                row.familyName ??
                row.variantName ??
                "",
            );
        };

        const getSearchPriority = (row: any) => {
            if (!keyword) return 0;

            const code = getPrimaryCode(row).toLowerCase();
            const name = getPrimaryName(row).toLowerCase();
            const completeRow = JSON.stringify(row).toLowerCase();

            if (code === keyword) return 0;
            if (code.startsWith(keyword)) return 1;
            if (name.startsWith(keyword)) return 2;
            if (code.includes(keyword)) return 3;
            if (name.includes(keyword)) return 4;
            if (completeRow.includes(keyword)) return 5;

            return 99;
        };

        return allRows
            .filter((row: any) => {
                const matchesStatus =
                    statusFilter === "all" || row.status === statusFilter;

                const matchesRange =
                    rangeFilter === "all" ||
                    tab !== "families" ||
                    row.rangeId === rangeFilter;

                const matchesSearch =
                    !keyword ||
                    JSON.stringify(row).toLowerCase().includes(keyword);

                return matchesStatus && matchesRange && matchesSearch;
            })
            .sort((firstRow: any, secondRow: any) => {
                const priorityDifference =
                    getSearchPriority(firstRow) -
                    getSearchPriority(secondRow);

                if (priorityDifference !== 0) {
                    return priorityDifference;
                }

                return getPrimaryCode(firstRow).localeCompare(
                    getPrimaryCode(secondRow),
                    undefined,
                    {
                        numeric: true,
                        sensitivity: "base",
                    },
                );
            });
    }, [allRows, search, statusFilter, rangeFilter, tab]);

    const invalidate = () =>
        queryClient.invalidateQueries({
            queryKey: ["product-code-management"],
        });

    const requireAdmin = () => {
        if (!userIsAdmin) {
            throw new Error("Only an Admin can manage Product Code settings.");
        }
    };

    const resetForms = () => {
        setEditingId(null);
        setRangeForm({
            code: "",
            name: "",
            description: "",
            start: "",
            end: "",
            domain: "future",
            guidance: "",
            status: "active",
            sortOrder: "0",
            active: true,
        });
        setTypeForm({
            code: "",
            name: "",
            description: "",
            productClass: "material",
            guidance: "",
            status: "active",
            sortOrder: "0",
            active: true,
        });
        setSizeForm({
            code: "",
            name: "",
            description: "",
            firstLabel: "Width",
            secondLabel: "Length",
            firstUnit: "mm",
            secondUnit: "mm",
            firstMode: "numeric",
            secondMode: "numeric",
            allowFirstUnspecified: false,
            allowSecondUnspecified: false,
            example: "190X2200",
            guidance: "",
            status: "active",
            sortOrder: "0",
            active: true,
        });
        setColourForm({
            code: "",
            name: "",
            description: "",
            hex: "",
            referenceOnly: true,
            notApplicable: false,
            guidance: "",
            status: "active",
            sortOrder: "0",
            active: true,
        });
        setFamilyForm({
            rangeId: "",
            code: "",
            name: "",
            description: "",
            defaultTypeId: "none",
            defaultSizeRuleId: "none",
            colourMode: "optional",
            variantMeaning: "category_variant",
            guidance: "",
            reservationNotes: "",
            status: "active",
            sortOrder: "0",
            active: true,
        });
        setVariantForm({
            familyId: "",
            digit: "",
            name: "",
            description: "",
            thickness: "",
            subtype: "",
            sizeRuleId: "default",
            colourModeOverride: "default",
            guidance: "",
            reservationNotes: "",
            status: "active",
            sortOrder: "0",
            active: true,
        });
    };

    const openAdd = () => {
        if (!userIsAdmin) {
            toast.error("Only an Admin can manage Product Code settings.");
            return;
        }
        resetForms();
        setDialogOpen(true);
    };

    const openEdit = (row: any) => {
        if (!userIsAdmin) return;
        setEditingId(row.id);

        if (tab === "ranges") {
            setRangeForm({
                code: row.code,
                name: row.name,
                description: row.description ?? "",
                start: String(row.start),
                end: String(row.end),
                domain: row.domain,
                guidance: row.guidance ?? "",
                status: row.status,
                sortOrder: String(row.sortOrder),
                active: row.active,
            });
        } else if (tab === "types") {
            setTypeForm({
                code: row.code,
                name: row.name,
                description: row.description ?? "",
                productClass: row.productClass,
                guidance: row.guidance ?? "",
                status: row.status,
                sortOrder: String(row.sortOrder),
                active: row.active,
            });
        } else if (tab === "size-rules") {
            setSizeForm({
                code: row.code,
                name: row.name,
                description: row.description ?? "",
                firstLabel: row.firstLabel,
                secondLabel: row.secondLabel,
                firstUnit: row.firstUnit ?? "",
                secondUnit: row.secondUnit ?? "",
                firstMode: row.firstMode,
                secondMode: row.secondMode,
                allowFirstUnspecified: row.allowFirstUnspecified,
                allowSecondUnspecified: row.allowSecondUnspecified,
                example: row.example,
                guidance: row.guidance ?? "",
                status: row.status,
                sortOrder: String(row.sortOrder),
                active: row.active,
            });
        } else if (tab === "colours") {
            setColourForm({
                code: row.code,
                name: row.name,
                description: row.description ?? "",
                hex: row.hex ?? "",
                referenceOnly: row.referenceOnly,
                notApplicable: row.notApplicable,
                guidance: row.guidance ?? "",
                status: row.status,
                sortOrder: String(row.sortOrder),
                active: row.active,
            });
        } else if (tab === "families") {
            setFamilyForm({
                rangeId: row.rangeId,
                code: row.code,
                name: row.name,
                description: row.description ?? "",
                defaultTypeId: row.defaultTypeId ?? "none",
                defaultSizeRuleId: row.defaultSizeRuleId ?? "none",
                colourMode: row.colourMode,
                variantMeaning: row.variantMeaning,
                guidance: row.guidance ?? "",
                reservationNotes: row.reservationNotes ?? "",
                status: row.status,
                sortOrder: String(row.sortOrder),
                active: row.active,
            });
        } else {
            setVariantForm({
                familyId: row.familyId,
                digit: row.digit,
                name: row.name,
                description: row.description ?? "",
                thickness: row.thickness === null ? "" : String(row.thickness),
                subtype: row.subtype ?? "",
                sizeRuleId: row.sizeRuleId ?? "default",
                colourModeOverride: row.colourModeOverride ?? "default",
                guidance: row.guidance ?? "",
                reservationNotes: row.reservationNotes ?? "",
                status: row.status,
                sortOrder: String(row.sortOrder),
                active: row.active,
            });
        }

        setDialogOpen(true);
    };

    const saveRecord = useMutation({
        mutationFn: async () => {
            requireAdmin();

            if (tab === "ranges") {
                const name = rangeForm.name.trim();
                if (!name) throw new Error("Range name is required.");

                if (editingId) {
                    const { error } = await db
                        .from("product_code_ranges")
                        .update({
                            range_name: name,
                            description: rangeForm.description.trim() || null,
                            guidance_text: rangeForm.guidance.trim() || null,
                            status: rangeForm.status,
                            sort_order: parseNonNegative(rangeForm.sortOrder, "Sort order"),
                            is_active: rangeForm.active,
                        })
                        .eq("product_code_range_id", editingId);
                    if (error) throw error;
                    return;
                }

                const start = Number(rangeForm.start);
                const end = Number(rangeForm.end);
                if (!Number.isInteger(start) || !Number.isInteger(end)) {
                    throw new Error("Start and end must be whole numbers.");
                }
                if (start < 1 || end > 99 || start > end) {
                    throw new Error(
                        "Range must be between 01 and 99, with start not greater than end.",
                    );
                }
                const code = `${String(start).padStart(2, "0")}-${String(end).padStart(2, "0")}`;

                const { error } = await db.from("product_code_ranges").insert({
                    range_code: code,
                    range_name: name,
                    description: rangeForm.description.trim() || null,
                    start_family_number: start,
                    end_family_number: end,
                    product_domain: rangeForm.domain,
                    guidance_text: rangeForm.guidance.trim() || null,
                    is_locked: true,
                    admin_only_manage: true,
                    status: rangeForm.status,
                    sort_order: parseNonNegative(rangeForm.sortOrder, "Sort order"),
                    is_active: rangeForm.active,
                    is_deleted: false,
                });
                if (error) throw error;
                return;
            }

            if (tab === "types") {
                const code = typeForm.code.trim().toUpperCase();
                const name = typeForm.name.trim();
                if (!/^[A-Z0-9]{3}$/.test(code)) {
                    throw new Error(
                        "Product Type Code must contain exactly 3 uppercase letters or numbers.",
                    );
                }
                if (!name) throw new Error("Product Type name is required.");

                const payload = {
                    type_name: name,
                    description: typeForm.description.trim() || null,
                    product_class: typeForm.productClass,
                    guidance_text: typeForm.guidance.trim() || null,
                    status: typeForm.status,
                    sort_order: parseNonNegative(typeForm.sortOrder, "Sort order"),
                    is_active: typeForm.active,
                    is_deleted: false,
                };

                const result = editingId
                    ? await db
                        .from("product_code_types")
                        .update(payload)
                        .eq("product_code_type_id", editingId)
                    : await db
                        .from("product_code_types")
                        .insert({ type_code: code, ...payload });
                if (result.error) throw result.error;
                return;
            }

            if (tab === "size-rules") {
                const code = sizeForm.code.trim().toUpperCase();
                const name = sizeForm.name.trim();
                if (!/^[A-Z0-9_]{3,40}$/.test(code)) {
                    throw new Error(
                        "Size Rule Code must use uppercase letters, numbers, or underscore.",
                    );
                }
                if (!name) throw new Error("Size Rule name is required.");
                if (
                    !/^[0-9N]{3}X[0-9N]{4}$/.test(sizeForm.example.trim().toUpperCase())
                ) {
                    throw new Error(
                        "Example must follow WWWXLLLL, such as 190X2200 or NNNXNNNN.",
                    );
                }

                const payload = {
                    size_rule_name: name,
                    description: sizeForm.description.trim() || null,
                    first_value_label: sizeForm.firstLabel.trim() || "First Value",
                    second_value_label: sizeForm.secondLabel.trim() || "Second Value",
                    first_value_unit: sizeForm.firstUnit.trim() || null,
                    second_value_unit: sizeForm.secondUnit.trim() || null,
                    first_value_mode: sizeForm.firstMode,
                    second_value_mode: sizeForm.secondMode,
                    allow_first_unspecified: sizeForm.allowFirstUnspecified,
                    allow_second_unspecified: sizeForm.allowSecondUnspecified,
                    example_size_token: sizeForm.example.trim().toUpperCase(),
                    guidance_text: sizeForm.guidance.trim() || null,
                    status: sizeForm.status,
                    sort_order: parseNonNegative(sizeForm.sortOrder, "Sort order"),
                    is_active: sizeForm.active,
                    is_deleted: false,
                };

                const result = editingId
                    ? await db
                        .from("product_code_size_rules")
                        .update(payload)
                        .eq("product_code_size_rule_id", editingId)
                    : await db
                        .from("product_code_size_rules")
                        .insert({ size_rule_code: code, ...payload });
                if (result.error) throw result.error;
                return;
            }

            if (tab === "colours") {
                const code = colourForm.code.trim().toUpperCase();
                const name = colourForm.name.trim();
                if (!/^[A-Z0-9]{3}$/.test(code)) {
                    throw new Error(
                        "Colour Code must contain exactly 3 uppercase letters or numbers.",
                    );
                }
                if (!name) throw new Error("Colour name is required.");
                const hex = colourForm.hex.trim();
                if (hex && !/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                    throw new Error("Reference Hex must use format #RRGGBB.");
                }
                if (colourForm.notApplicable && code !== "XXX") {
                    throw new Error("Only Colour Code XXX may be marked Not Applicable.");
                }

                const payload = {
                    colour_name: name,
                    description: colourForm.description.trim() || null,
                    reference_hex: hex || null,
                    is_reference_only: colourForm.referenceOnly,
                    is_not_applicable: colourForm.notApplicable,
                    guidance_text: colourForm.guidance.trim() || null,
                    status: colourForm.status,
                    sort_order: parseNonNegative(colourForm.sortOrder, "Sort order"),
                    is_active: colourForm.active,
                    is_deleted: false,
                };

                const result = editingId
                    ? await db
                        .from("product_colours")
                        .update(payload)
                        .eq("product_colour_id", editingId)
                    : await db
                        .from("product_colours")
                        .insert({ colour_code: code, ...payload });
                if (result.error) throw result.error;
                return;
            }

            if (tab === "families") {
                if (!familyForm.rangeId)
                    throw new Error("Product Code Range is required.");
                const range = ranges.find((item) => item.id === familyForm.rangeId);
                if (!range)
                    throw new Error("Selected Product Code Range could not be found.");

                const code = familyForm.code.trim();
                const name = familyForm.name.trim();
                if (!/^[0-9]{2}$/.test(code)) {
                    throw new Error("Family Code must contain exactly 2 digits.");
                }
                const numericCode = Number(code);
                if (numericCode < range.start || numericCode > range.end) {
                    throw new Error(`Family Code must be inside range ${range.code}.`);
                }
                if (!name) throw new Error("Product Family name is required.");

                const payload = {
                    family_name: name,
                    description: familyForm.description.trim() || null,
                    default_product_code_type_id:
                        familyForm.defaultTypeId === "none"
                            ? null
                            : familyForm.defaultTypeId,
                    default_size_rule_id:
                        familyForm.defaultSizeRuleId === "none"
                            ? null
                            : familyForm.defaultSizeRuleId,
                    colour_mode: familyForm.colourMode,
                    variant_meaning: familyForm.variantMeaning,
                    guidance_text: familyForm.guidance.trim() || null,
                    reservation_notes: familyForm.reservationNotes.trim() || null,
                    status: familyForm.status,
                    sort_order: parseNonNegative(familyForm.sortOrder, "Sort order"),
                    is_active: familyForm.active,
                    is_deleted: false,
                };

                let familyId = editingId;
                if (editingId) {
                    const { error } = await db
                        .from("product_code_families")
                        .update(payload)
                        .eq("product_code_family_id", editingId);
                    if (error) throw error;
                } else {
                    const { data, error } = await db
                        .from("product_code_families")
                        .insert({
                            product_code_range_id: range.id,
                            family_code: code,
                            product_domain: range.domain,
                            ...payload,
                        })
                        .select("product_code_family_id")
                        .single();
                    if (error) throw error;
                    familyId = data.product_code_family_id;
                }

                if (familyId && familyForm.defaultTypeId !== "none") {
                    const { error: clearError } = await db
                        .from("product_code_family_types")
                        .update({ is_default: false })
                        .eq("product_code_family_id", familyId)
                        .eq("is_deleted", false);
                    if (clearError) throw clearError;

                    const { error: mappingError } = await db
                        .from("product_code_family_types")
                        .upsert(
                            {
                                product_code_family_id: familyId,
                                product_code_type_id: familyForm.defaultTypeId,
                                is_default: true,
                                sort_order: 0,
                                is_active: true,
                                is_deleted: false,
                                deleted_at: null,
                            },
                            {
                                onConflict: "product_code_family_id,product_code_type_id",
                            },
                        );
                    if (mappingError) throw mappingError;
                }
                return;
            }

            if (!variantForm.familyId) throw new Error("Product Family is required.");
            const family = families.find((item) => item.id === variantForm.familyId);
            if (!family)
                throw new Error("Selected Product Family could not be found.");

            const digit = variantForm.digit.trim();
            const name = variantForm.name.trim();
            if (!/^[0-9]$/.test(digit)) {
                throw new Error("Variant Digit must contain exactly 1 digit.");
            }
            if (!name) throw new Error("Category Variant name is required.");
            const thickness =
                variantForm.thickness.trim() === ""
                    ? null
                    : Number(variantForm.thickness);
            if (
                thickness !== null &&
                (!Number.isFinite(thickness) || thickness <= 0)
            ) {
                throw new Error("Thickness must be greater than zero.");
            }
            if (thickness !== null && family.variantMeaning !== "thickness") {
                throw new Error(
                    "Thickness may only be entered for a Thickness-based Product Family.",
                );
            }

            const payload = {
                variant_name: name,
                description: variantForm.description.trim() || null,
                thickness_mm: thickness,
                subtype_value: variantForm.subtype.trim() || null,
                size_rule_id:
                    variantForm.sizeRuleId === "default" ? null : variantForm.sizeRuleId,
                colour_mode_override:
                    variantForm.colourModeOverride === "default"
                        ? null
                        : variantForm.colourModeOverride,
                guidance_text: variantForm.guidance.trim() || null,
                reservation_notes: variantForm.reservationNotes.trim() || null,
                status: variantForm.status,
                sort_order: parseNonNegative(variantForm.sortOrder, "Sort order"),
                is_active: variantForm.active,
                is_deleted: false,
            };

            const result = editingId
                ? await db
                    .from("product_code_category_variants")
                    .update(payload)
                    .eq("product_code_category_variant_id", editingId)
                : await db.from("product_code_category_variants").insert({
                    product_code_family_id: family.id,
                    variant_digit: digit,
                    full_category_code: `${family.code}${digit}`,
                    ...payload,
                });
            if (result.error) throw result.error;
        },
        onSuccess: () => {
            toast.success(
                editingId
                    ? "Product Code record updated."
                    : "Product Code record created.",
            );
            setDialogOpen(false);
            resetForms();
            invalidate();
        },
        onError: (error: Error) => toast.error(error.message),
    });

    const activeTab = TABS.find((item) => item.key === tab) ?? TABS[0];
    const ActiveIcon = activeTab.icon;

    const renderStatusBadge = (status: RecordStatus) => (
        <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(status)}`}
        >
            {statusLabel(status)}
        </span>
    );

    const renderRows = () => {
        if (loading) {
            return (
                <div className="p-10 text-center text-slate-500">
                    Loading Product Code settings...
                </div>
            );
        }
        if (filteredRows.length === 0) {
            return (
                <div className="p-10 text-center text-slate-500">No records found.</div>
            );
        }

        if (tab === "families") {
            return (
                <div className="divide-y divide-slate-200">
                    {(filteredRows as FamilyRow[]).map((row) => (
                        <div
                            key={row.id}
                            className="grid gap-4 p-4 hover:bg-slate-50 lg:grid-cols-[90px_1.4fr_1fr_1fr_1fr_auto] lg:items-center"
                        >
                            <div>
                                <p className="font-mono text-2xl font-black text-red-700">
                                    {row.code}
                                </p>
                                <p className="text-xs text-slate-500">Range {row.rangeCode}</p>
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">{row.name}</p>
                                <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                                    {row.description || "-"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-slate-400">
                                    Default Type
                                </p>
                                <p className="font-semibold text-slate-700">
                                    {row.defaultTypeCode || "Not assigned"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase text-slate-400">
                                    Variant Rule
                                </p>
                                <p className="font-semibold text-slate-700">
                                    {row.variantMeaning.replace("_", " ")}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {renderStatusBadge(row.status)}
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                    {row.colourMode.replace("_", " ")}
                                </span>
                            </div>
                            {userIsAdmin && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openEdit(row)}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            );
        }

        if (tab === "variants") {
            return (
                <div className="divide-y divide-slate-200">
                    {(filteredRows as VariantRow[]).map((row) => (
                        <div
                            key={row.id}
                            className="grid gap-4 p-4 hover:bg-slate-50 lg:grid-cols-[100px_1.5fr_1.2fr_1fr_auto] lg:items-center"
                        >
                            <p className="font-mono text-2xl font-black text-red-700">
                                {row.fullCode}
                            </p>
                            <div>
                                <p className="font-bold text-slate-900">{row.name}</p>
                                <p className="text-sm text-slate-500">
                                    {row.familyCode} · {row.familyName}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-700">
                                    {row.thickness !== null
                                        ? `${row.thickness} mm`
                                        : row.subtype || "General variant"}
                                </p>
                                <p className="text-xs text-slate-500">
                                    Size: {row.sizeRuleCode || "Family default"}
                                </p>
                            </div>
                            <div>{renderStatusBadge(row.status)}</div>
                            {userIsAdmin && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openEdit(row)}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            );
        }

        const rows = filteredRows as Array<
            RangeRow | TypeRow | SizeRuleRow | ColourRow
        >;
        return (
            <div className="divide-y divide-slate-200">
                {rows.map((row: any) => (
                    <div
                        key={row.id}
                        className="grid gap-4 p-4 hover:bg-slate-50 lg:grid-cols-[140px_1.7fr_1.2fr_1fr_auto] lg:items-center"
                    >
                        <div>
                            {tab === "colours" && row.hex ? (
                                <div className="flex items-center gap-3">
                                    <span
                                        className="h-9 w-9 rounded-xl border border-slate-300 shadow-sm"
                                        style={{ backgroundColor: row.hex }}
                                    />
                                    <p className="font-mono font-black text-slate-800">
                                        {row.code}
                                    </p>
                                </div>
                            ) : (
                                <p className="font-mono text-lg font-black text-slate-800">
                                    {row.code}
                                </p>
                            )}
                        </div>
                        <div>
                            <p className="font-bold text-slate-900">{row.name}</p>
                            <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                                {row.description || "-"}
                            </p>
                        </div>
                        <div className="text-sm text-slate-600">
                            {tab === "ranges" &&
                                `${row.start.toString().padStart(2, "0")}–${row.end.toString().padStart(2, "0")} · ${row.domain.replaceAll("_", " ")}`}
                            {tab === "types" && row.productClass}
                            {tab === "size-rules" && row.example}
                            {tab === "colours" && (row.hex || "No reference colour")}
                        </div>
                        <div>{renderStatusBadge(row.status)}</div>
                        {userIsAdmin && (
                            <Button variant="ghost" size="icon" onClick={() => openEdit(row)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    const TextAreaField = ({
        label,
        value,
        onChange,
        placeholder,
    }: {
        label: string;
        value: string;
        onChange: (value: string) => void;
        placeholder?: string;
    }) => (
        <div className="space-y-2">
            <Label>{label}</Label>
            <textarea
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
        </div>
    );

    const StatusAndOrder = ({
        status,
        setStatus,
        order,
        setOrder,
        active,
        setActive,
    }: {
        status: RecordStatus;
        setStatus: (value: RecordStatus) => void;
        order: string;
        setOrder: (value: string) => void;
        active: boolean;
        setActive: (value: boolean) => void;
    }) => (
        <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
                <Label>Status</Label>
                <Select
                    value={status}
                    onValueChange={(value) => setStatus(value as RecordStatus)}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {STATUS_OPTIONS.map((value) => (
                            <SelectItem key={value} value={value}>
                                {statusLabel(value)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input
                    type="number"
                    min="0"
                    value={order}
                    onChange={(event) => setOrder(event.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label>Selectable</Label>
                <Select
                    value={active ? "yes" : "no"}
                    onValueChange={(value) => setActive(value === "yes")}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );

    const renderDialogFields = () => {
        if (tab === "ranges") {
            return (
                <>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Start Family Number *</Label>
                            <Input
                                type="number"
                                min="1"
                                max="99"
                                value={rangeForm.start}
                                disabled={Boolean(editingId)}
                                onChange={(event) =>
                                    setRangeForm((current) => ({
                                        ...current,
                                        start: event.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>End Family Number *</Label>
                            <Input
                                type="number"
                                min="1"
                                max="99"
                                value={rangeForm.end}
                                disabled={Boolean(editingId)}
                                onChange={(event) =>
                                    setRangeForm((current) => ({
                                        ...current,
                                        end: event.target.value,
                                    }))
                                }
                            />
                        </div>
                    </div>
                    {editingId && (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                            Range Code and number boundaries are locked after creation.
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label>Range Name *</Label>
                        <Input
                            value={rangeForm.name}
                            onChange={(event) =>
                                setRangeForm((current) => ({
                                    ...current,
                                    name: event.target.value,
                                }))
                            }
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Product Domain *</Label>
                        <Select
                            value={rangeForm.domain}
                            disabled={Boolean(editingId)}
                            onValueChange={(value) =>
                                setRangeForm((current) => ({ ...current, domain: value }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {DOMAIN_OPTIONS.map((value) => (
                                    <SelectItem key={value} value={value}>
                                        {value.replace("_", " ")}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <TextAreaField
                        label="Description"
                        value={rangeForm.description}
                        onChange={(value) =>
                            setRangeForm((current) => ({ ...current, description: value }))
                        }
                    />
                    <TextAreaField
                        label="Admin Guidance"
                        value={rangeForm.guidance}
                        onChange={(value) =>
                            setRangeForm((current) => ({ ...current, guidance: value }))
                        }
                    />
                    <StatusAndOrder
                        status={rangeForm.status}
                        setStatus={(value) =>
                            setRangeForm((current) => ({ ...current, status: value }))
                        }
                        order={rangeForm.sortOrder}
                        setOrder={(value) =>
                            setRangeForm((current) => ({ ...current, sortOrder: value }))
                        }
                        active={rangeForm.active}
                        setActive={(value) =>
                            setRangeForm((current) => ({ ...current, active: value }))
                        }
                    />
                </>
            );
        }

        if (tab === "types") {
            return (
                <>
                    <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
                        <div className="space-y-2">
                            <Label>Type Code *</Label>
                            <Input
                                maxLength={3}
                                value={typeForm.code}
                                disabled={Boolean(editingId)}
                                onChange={(event) =>
                                    setTypeForm((current) => ({
                                        ...current,
                                        code: event.target.value.toUpperCase(),
                                    }))
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Type Name *</Label>
                            <Input
                                value={typeForm.name}
                                onChange={(event) =>
                                    setTypeForm((current) => ({
                                        ...current,
                                        name: event.target.value,
                                    }))
                                }
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Product Class *</Label>
                        <Select
                            value={typeForm.productClass}
                            onValueChange={(value) =>
                                setTypeForm((current) => ({ ...current, productClass: value }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PRODUCT_CLASS_OPTIONS.map((value) => (
                                    <SelectItem key={value} value={value}>
                                        {value}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <TextAreaField
                        label="Description"
                        value={typeForm.description}
                        onChange={(value) =>
                            setTypeForm((current) => ({ ...current, description: value }))
                        }
                    />
                    <TextAreaField
                        label="Builder Guidance"
                        value={typeForm.guidance}
                        onChange={(value) =>
                            setTypeForm((current) => ({ ...current, guidance: value }))
                        }
                    />
                    <StatusAndOrder
                        status={typeForm.status}
                        setStatus={(value) =>
                            setTypeForm((current) => ({ ...current, status: value }))
                        }
                        order={typeForm.sortOrder}
                        setOrder={(value) =>
                            setTypeForm((current) => ({ ...current, sortOrder: value }))
                        }
                        active={typeForm.active}
                        setActive={(value) =>
                            setTypeForm((current) => ({ ...current, active: value }))
                        }
                    />
                </>
            );
        }

        if (tab === "size-rules") {
            return (
                <>
                    <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
                        <div className="space-y-2">
                            <Label>Size Rule Code *</Label>
                            <Input
                                value={sizeForm.code}
                                disabled={Boolean(editingId)}
                                onChange={(event) =>
                                    setSizeForm((current) => ({
                                        ...current,
                                        code: event.target.value.toUpperCase(),
                                    }))
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Size Rule Name *</Label>
                            <Input
                                value={sizeForm.name}
                                onChange={(event) =>
                                    setSizeForm((current) => ({
                                        ...current,
                                        name: event.target.value,
                                    }))
                                }
                            />
                        </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>First Label</Label>
                            <Input
                                value={sizeForm.firstLabel}
                                onChange={(event) =>
                                    setSizeForm((current) => ({
                                        ...current,
                                        firstLabel: event.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Second Label</Label>
                            <Input
                                value={sizeForm.secondLabel}
                                onChange={(event) =>
                                    setSizeForm((current) => ({
                                        ...current,
                                        secondLabel: event.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>First Unit</Label>
                            <Input
                                value={sizeForm.firstUnit}
                                onChange={(event) =>
                                    setSizeForm((current) => ({
                                        ...current,
                                        firstUnit: event.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Second Unit</Label>
                            <Input
                                value={sizeForm.secondUnit}
                                onChange={(event) =>
                                    setSizeForm((current) => ({
                                        ...current,
                                        secondUnit: event.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>First Mode</Label>
                            <Select
                                value={sizeForm.firstMode}
                                onValueChange={(value) =>
                                    setSizeForm((current) => ({ ...current, firstMode: value }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="numeric">Numeric</SelectItem>
                                    <SelectItem value="not_applicable">Not Applicable</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Second Mode</Label>
                            <Select
                                value={sizeForm.secondMode}
                                onValueChange={(value) =>
                                    setSizeForm((current) => ({ ...current, secondMode: value }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="numeric">Numeric</SelectItem>
                                    <SelectItem value="random_or_numeric">
                                        Random or Numeric
                                    </SelectItem>
                                    <SelectItem value="not_applicable">Not Applicable</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Example Size Token *</Label>
                        <Input
                            className="font-mono"
                            maxLength={8}
                            value={sizeForm.example}
                            onChange={(event) =>
                                setSizeForm((current) => ({
                                    ...current,
                                    example: event.target.value.toUpperCase(),
                                }))
                            }
                        />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Allow First Unspecified</Label>
                            <Select
                                value={sizeForm.allowFirstUnspecified ? "yes" : "no"}
                                onValueChange={(value) =>
                                    setSizeForm((current) => ({
                                        ...current,
                                        allowFirstUnspecified: value === "yes",
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="yes">Yes</SelectItem>
                                    <SelectItem value="no">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Allow Second Unspecified</Label>
                            <Select
                                value={sizeForm.allowSecondUnspecified ? "yes" : "no"}
                                onValueChange={(value) =>
                                    setSizeForm((current) => ({
                                        ...current,
                                        allowSecondUnspecified: value === "yes",
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="yes">Yes</SelectItem>
                                    <SelectItem value="no">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <TextAreaField
                        label="Description"
                        value={sizeForm.description}
                        onChange={(value) =>
                            setSizeForm((current) => ({ ...current, description: value }))
                        }
                    />
                    <TextAreaField
                        label="Builder Guidance"
                        value={sizeForm.guidance}
                        onChange={(value) =>
                            setSizeForm((current) => ({ ...current, guidance: value }))
                        }
                    />
                    <StatusAndOrder
                        status={sizeForm.status}
                        setStatus={(value) =>
                            setSizeForm((current) => ({ ...current, status: value }))
                        }
                        order={sizeForm.sortOrder}
                        setOrder={(value) =>
                            setSizeForm((current) => ({ ...current, sortOrder: value }))
                        }
                        active={sizeForm.active}
                        setActive={(value) =>
                            setSizeForm((current) => ({ ...current, active: value }))
                        }
                    />
                </>
            );
        }

        if (tab === "colours") {
            return (
                <>
                    <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
                        <div className="space-y-2">
                            <Label>Colour Code *</Label>
                            <Input
                                maxLength={3}
                                value={colourForm.code}
                                disabled={Boolean(editingId)}
                                onChange={(event) =>
                                    setColourForm((current) => ({
                                        ...current,
                                        code: event.target.value.toUpperCase(),
                                    }))
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Colour Name *</Label>
                            <Input
                                value={colourForm.name}
                                onChange={(event) =>
                                    setColourForm((current) => ({
                                        ...current,
                                        name: event.target.value,
                                    }))
                                }
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Reference Hex</Label>
                        <div className="flex items-center gap-3">
                            <Input
                                value={colourForm.hex}
                                placeholder="#C8A77A"
                                onChange={(event) =>
                                    setColourForm((current) => ({
                                        ...current,
                                        hex: event.target.value,
                                    }))
                                }
                            />
                            {/^#[0-9A-Fa-f]{6}$/.test(colourForm.hex) && (
                                <span
                                    className="h-10 w-10 shrink-0 rounded-xl border border-slate-300"
                                    style={{ backgroundColor: colourForm.hex }}
                                />
                            )}
                        </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Reference Only</Label>
                            <Select
                                value={colourForm.referenceOnly ? "yes" : "no"}
                                onValueChange={(value) =>
                                    setColourForm((current) => ({
                                        ...current,
                                        referenceOnly: value === "yes",
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="yes">Yes</SelectItem>
                                    <SelectItem value="no">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Not Applicable</Label>
                            <Select
                                value={colourForm.notApplicable ? "yes" : "no"}
                                disabled={Boolean(editingId && colourForm.code !== "XXX")}
                                onValueChange={(value) =>
                                    setColourForm((current) => ({
                                        ...current,
                                        notApplicable: value === "yes",
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="yes">Yes</SelectItem>
                                    <SelectItem value="no">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <TextAreaField
                        label="Description"
                        value={colourForm.description}
                        onChange={(value) =>
                            setColourForm((current) => ({ ...current, description: value }))
                        }
                    />
                    <TextAreaField
                        label="Builder Guidance"
                        value={colourForm.guidance}
                        onChange={(value) =>
                            setColourForm((current) => ({ ...current, guidance: value }))
                        }
                    />
                    <StatusAndOrder
                        status={colourForm.status}
                        setStatus={(value) =>
                            setColourForm((current) => ({ ...current, status: value }))
                        }
                        order={colourForm.sortOrder}
                        setOrder={(value) =>
                            setColourForm((current) => ({ ...current, sortOrder: value }))
                        }
                        active={colourForm.active}
                        setActive={(value) =>
                            setColourForm((current) => ({ ...current, active: value }))
                        }
                    />
                </>
            );
        }

        if (tab === "families") {
            const selectedRange = ranges.find(
                (range) => range.id === familyForm.rangeId,
            );
            return (
                <>
                    <div className="space-y-2">
                        <Label>Product Code Range *</Label>
                        <Select
                            value={familyForm.rangeId}
                            disabled={Boolean(editingId)}
                            onValueChange={(value) =>
                                setFamilyForm((current) => ({
                                    ...current,
                                    rangeId: value,
                                    code: "",
                                }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select reserved range" />
                            </SelectTrigger>
                            <SelectContent>
                                {ranges.map((range) => (
                                    <SelectItem key={range.id} value={range.id}>
                                        {range.code} — {range.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
                        <div className="space-y-2">
                            <Label>Family Code *</Label>
                            <Input
                                maxLength={2}
                                value={familyForm.code}
                                disabled={Boolean(editingId)}
                                onChange={(event) =>
                                    setFamilyForm((current) => ({
                                        ...current,
                                        code: event.target.value.replace(/\D/g, ""),
                                    }))
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Family Name *</Label>
                            <Input
                                value={familyForm.name}
                                onChange={(event) =>
                                    setFamilyForm((current) => ({
                                        ...current,
                                        name: event.target.value,
                                    }))
                                }
                            />
                        </div>
                    </div>
                    {selectedRange && !editingId && (
                        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                            Available in {selectedRange.code}:{" "}
                            {availableFamilyCodes
                                .filter(
                                    (code) =>
                                        Number(code) >= selectedRange.start &&
                                        Number(code) <= selectedRange.end,
                                )
                                .join(", ") || "No available Family Codes"}
                        </div>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Default Product Type</Label>
                            <Select
                                value={familyForm.defaultTypeId}
                                onValueChange={(value) =>
                                    setFamilyForm((current) => ({
                                        ...current,
                                        defaultTypeId: value,
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Not assigned</SelectItem>
                                    {types.map((type) => (
                                        <SelectItem key={type.id} value={type.id}>
                                            {type.code} — {type.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Default Size Rule</Label>
                            <Select
                                value={familyForm.defaultSizeRuleId}
                                onValueChange={(value) =>
                                    setFamilyForm((current) => ({
                                        ...current,
                                        defaultSizeRuleId: value,
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Not assigned</SelectItem>
                                    {sizeRules.map((rule) => (
                                        <SelectItem key={rule.id} value={rule.id}>
                                            {rule.code} — {rule.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Colour Rule</Label>
                            <Select
                                value={familyForm.colourMode}
                                onValueChange={(value) =>
                                    setFamilyForm((current) => ({
                                        ...current,
                                        colourMode: value,
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {COLOUR_MODE_OPTIONS.map((value) => (
                                        <SelectItem key={value} value={value}>
                                            {value.replace("_", " ")}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Third Digit Meaning</Label>
                            <Select
                                value={familyForm.variantMeaning}
                                onValueChange={(value) =>
                                    setFamilyForm((current) => ({
                                        ...current,
                                        variantMeaning: value,
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {VARIANT_MEANING_OPTIONS.map((value) => (
                                        <SelectItem key={value} value={value}>
                                            {value.replace("_", " ")}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <TextAreaField
                        label="Description"
                        value={familyForm.description}
                        onChange={(value) =>
                            setFamilyForm((current) => ({ ...current, description: value }))
                        }
                    />
                    <TextAreaField
                        label="Builder Guidance"
                        value={familyForm.guidance}
                        onChange={(value) =>
                            setFamilyForm((current) => ({ ...current, guidance: value }))
                        }
                    />
                    <TextAreaField
                        label="Reservation Notes"
                        value={familyForm.reservationNotes}
                        onChange={(value) =>
                            setFamilyForm((current) => ({
                                ...current,
                                reservationNotes: value,
                            }))
                        }
                    />
                    <StatusAndOrder
                        status={familyForm.status}
                        setStatus={(value) =>
                            setFamilyForm((current) => ({ ...current, status: value }))
                        }
                        order={familyForm.sortOrder}
                        setOrder={(value) =>
                            setFamilyForm((current) => ({ ...current, sortOrder: value }))
                        }
                        active={familyForm.active}
                        setActive={(value) =>
                            setFamilyForm((current) => ({ ...current, active: value }))
                        }
                    />
                </>
            );
        }

        const selectedFamily = families.find(
            (family) => family.id === variantForm.familyId,
        );
        return (
            <>
                <div className="space-y-2">
                    <Label>Product Family *</Label>
                    <Select
                        value={variantForm.familyId}
                        disabled={Boolean(editingId)}
                        onValueChange={(value) =>
                            setVariantForm((current) => ({
                                ...current,
                                familyId: value,
                                digit: "",
                            }))
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Product Family" />
                        </SelectTrigger>
                        <SelectContent>
                            {families
                                .filter((family) => family.status !== "inactive")
                                .map((family) => (
                                    <SelectItem key={family.id} value={family.id}>
                                        {family.code} — {family.name}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
                    <div className="space-y-2">
                        <Label>Variant Digit *</Label>
                        <Input
                            maxLength={1}
                            value={variantForm.digit}
                            disabled={Boolean(editingId)}
                            onChange={(event) =>
                                setVariantForm((current) => ({
                                    ...current,
                                    digit: event.target.value.replace(/\D/g, ""),
                                }))
                            }
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Variant Name *</Label>
                        <Input
                            value={variantForm.name}
                            onChange={(event) =>
                                setVariantForm((current) => ({
                                    ...current,
                                    name: event.target.value,
                                }))
                            }
                        />
                    </div>
                </div>
                {selectedFamily && variantForm.digit && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
                        <p className="text-xs font-bold uppercase tracking-wide text-red-600">
                            Full Category Code
                        </p>
                        <p className="mt-1 font-mono text-4xl font-black text-red-700">
                            {selectedFamily.code}
                            {variantForm.digit}
                        </p>
                    </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Thickness (mm)</Label>
                        <Input
                            type="number"
                            step="0.1"
                            min="0"
                            disabled={selectedFamily?.variantMeaning !== "thickness"}
                            value={variantForm.thickness}
                            onChange={(event) =>
                                setVariantForm((current) => ({
                                    ...current,
                                    thickness: event.target.value,
                                }))
                            }
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Subtype Value</Label>
                        <Input
                            value={variantForm.subtype}
                            onChange={(event) =>
                                setVariantForm((current) => ({
                                    ...current,
                                    subtype: event.target.value.toUpperCase(),
                                }))
                            }
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Size Rule Override</Label>
                        <Select
                            value={variantForm.sizeRuleId}
                            onValueChange={(value) =>
                                setVariantForm((current) => ({ ...current, sizeRuleId: value }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="default">Use Family default</SelectItem>
                                {sizeRules.map((rule) => (
                                    <SelectItem key={rule.id} value={rule.id}>
                                        {rule.code} — {rule.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Colour Rule Override</Label>
                        <Select
                            value={variantForm.colourModeOverride}
                            onValueChange={(value) =>
                                setVariantForm((current) => ({
                                    ...current,
                                    colourModeOverride: value,
                                }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="default">Use Family default</SelectItem>
                                {COLOUR_MODE_OPTIONS.map((value) => (
                                    <SelectItem key={value} value={value}>
                                        {value.replace("_", " ")}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <TextAreaField
                    label="Description"
                    value={variantForm.description}
                    onChange={(value) =>
                        setVariantForm((current) => ({ ...current, description: value }))
                    }
                />
                <TextAreaField
                    label="Builder Guidance"
                    value={variantForm.guidance}
                    onChange={(value) =>
                        setVariantForm((current) => ({ ...current, guidance: value }))
                    }
                />
                <TextAreaField
                    label="Reservation Notes"
                    value={variantForm.reservationNotes}
                    onChange={(value) =>
                        setVariantForm((current) => ({
                            ...current,
                            reservationNotes: value,
                        }))
                    }
                />
                <StatusAndOrder
                    status={variantForm.status}
                    setStatus={(value) =>
                        setVariantForm((current) => ({ ...current, status: value }))
                    }
                    order={variantForm.sortOrder}
                    setOrder={(value) =>
                        setVariantForm((current) => ({ ...current, sortOrder: value }))
                    }
                    active={variantForm.active}
                    setActive={(value) =>
                        setVariantForm((current) => ({ ...current, active: value }))
                    }
                />
            </>
        );
    };

    return (
        <div className="space-y-6 p-4 sm:p-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                    <ShieldCheck className="h-8 w-8 shrink-0 text-red-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                            Product Code Management
                        </h1>
                        <p className="mt-1 max-w-3xl text-sm text-slate-500">
                            Admin-controlled setup for Product Code ranges, families,
                            variants, types, dimensions, and colours.
                        </p>
                    </div>
                </div>
                {userIsAdmin && (
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setBuilderOpen(true)}
                            className="h-11 rounded-xl border-red-200 px-5 font-bold text-red-700 hover:bg-red-50"
                        >
                            <Braces className="mr-2 h-4 w-4" />
                            Test Product Code Builder
                        </Button>
                        <Button
                            onClick={openAdd}
                            className="h-11 rounded-xl bg-red-600 px-5 font-bold text-white hover:bg-red-700"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add {activeTab.title.replace(/s$/, "")}
                        </Button>
                    </div>
                )}
            </header>

            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <strong>Locked rule:</strong> Product Family Codes 01–40 are reserved
                for flooring boards and floor coverings only. Generated Product Code
                identities cannot be changed or reused.
            </div>

            {builderResult && (
                <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                                Product Code Builder Test Result
                            </p>
                            <p className="mt-2 break-all font-mono text-xl font-black text-slate-950 sm:text-2xl">
                                {builderResult.previewCode}
                            </p>
                            <p className="mt-2 text-sm text-slate-600">
                                {builderResult.categoryVariantName} · {builderResult.typeName} · {builderResult.colourName}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                This is a preview only. No Product was created and no Running Number was consumed.
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setBuilderResult(null)}
                            className="h-10 rounded-xl"
                        >
                            Clear Test Result
                        </Button>
                    </div>
                </section>
            )}

            {!userIsAdmin && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    View-only access. Only Admin can add or edit Product Code settings.
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
                <aside className="hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:block">
                    <p className="px-3 pb-3 pt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Product Code Setup
                    </p>
                    {TABS.map(({ key, title, icon: Icon }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => {
                                setTab(key);
                                setSearch("");
                                setStatusFilter("all");
                                setRangeFilter("all");
                            }}
                            className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold ${tab === key
                                ? "bg-red-50 text-red-700"
                                : "text-slate-600 hover:bg-slate-50"
                                }`}
                        >
                            <Icon className="h-5 w-5" />
                            {title}
                        </button>
                    ))}
                </aside>

                <main className="min-w-0 space-y-6">
                    <div className="lg:hidden">
                        <Select
                            value={tab}
                            onValueChange={(value) => {
                                setTab(value as TabKey);
                                setSearch("");
                                setStatusFilter("all");
                                setRangeFilter("all");
                            }}
                        >
                            <SelectTrigger className="h-12 rounded-xl bg-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {TABS.map(({ key, title }) => (
                                    <SelectItem key={key} value={key}>
                                        {title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start gap-3">
                            <ActiveIcon className="h-6 w-6 text-red-600" />
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">
                                    {activeTab.title}
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    {tab === "families" &&
                                        "Broad permanent Product Family identifiers. Keep low-volume Products together."}
                                    {tab === "variants" &&
                                        "The third digit of CCC, normally representing thickness or operational subtype."}
                                    {tab === "ranges" &&
                                        "Reserved two-digit Family Code blocks. Ranges may not overlap."}
                                    {tab === "types" &&
                                        "Controlled three-character TTT codes used by the Product Code generator."}
                                    {tab === "size-rules" &&
                                        "Rules that create the fixed WWWXLLLL size segment."}
                                    {tab === "colours" &&
                                        "Controlled three-character CLR codes. On-screen swatches are reference only."}
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="grid grid-cols-2 gap-3 xl:grid-cols-5">
                        {[
                            ["Total", summary.total],
                            ["Active", summary.active],
                            ["Reserved", summary.reserved],
                            ["Inactive", summary.inactive],
                            ...(tab === "families"
                                ? [["Available Codes", availableFamilyCodes.length]]
                                : []),
                        ].map(([label, value]) => (
                            <div
                                key={String(label)}
                                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                            >
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                    {label}
                                </p>
                                <p className="mt-2 text-2xl font-black text-slate-900">
                                    {value}
                                </p>
                            </div>
                        ))}
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="grid gap-3 border-b border-slate-200 p-4 lg:grid-cols-[minmax(0,1fr)_180px_220px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder={`Search ${activeTab.title.toLowerCase()}...`}
                                    className="h-10 pl-9"
                                />
                            </div>
                            <Select
                                value={statusFilter}
                                onValueChange={(value) =>
                                    setStatusFilter(value as StatusFilter)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All statuses</SelectItem>
                                    {STATUS_OPTIONS.map((value) => (
                                        <SelectItem key={value} value={value}>
                                            {statusLabel(value)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {tab === "families" ? (
                                <Select value={rangeFilter} onValueChange={setRangeFilter}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All ranges</SelectItem>
                                        {ranges.map((range) => (
                                            <SelectItem key={range.id} value={range.id}>
                                                {range.code} — {range.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div />
                            )}
                        </div>
                        {renderRows()}
                    </section>
                </main>
            </div>

            <Dialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) resetForms();
                }}
            >
                <DialogContent className="max-h-[90vh] w-[calc(100vw-24px)] max-w-2xl overflow-y-auto rounded-xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingId ? "Edit" : "Add"} {activeTab.title.replace(/s$/, "")}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-5">
                        {renderDialogFields()}
                        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={() => saveRecord.mutate()}
                                disabled={saveRecord.isPending}
                                className="bg-red-600 text-white hover:bg-red-700"
                            >
                                {saveRecord.isPending
                                    ? "Saving..."
                                    : editingId
                                        ? "Save Changes"
                                        : "Create Record"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <ProductCodeBuilderModal
                open={builderOpen}
                onOpenChange={setBuilderOpen}
                onConfirm={(value) => {
                    setBuilderResult(value);
                    toast.success("Product Code preview selected for testing.");
                }}
                confirmLabel="Confirm Test Preview"
            />
        </div>
    );
};

export default ProductCodeManagement;