import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, ChevronDown, Hash, Loader2, PackageSearch, Palette, Ruler, Search, ShieldCheck, Tag } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const db = supabase as any;

type Family = {
    id: string; code: string; name: string; description: string | null;
    defaultTypeId: string | null; defaultSizeRuleId: string | null;
    colourMode: "required" | "optional" | "not_applicable";
};
type Variant = {
    id: string; familyId: string; fullCode: string; name: string;
    thicknessMm: number | null; subtypeValue: string | null;
    sizeRuleId: string | null;
    colourModeOverride: "required" | "optional" | "not_applicable" | null;
};
type ProductType = { id: string; code: string; name: string };
type SizeRule = {
    id: string; code: string; name: string;
    firstLabel: string; secondLabel: string;
    firstUnit: string | null; secondUnit: string | null;
    firstMode: "numeric" | "not_applicable";
    secondMode: "numeric" | "random_or_numeric" | "not_applicable";
    allowFirstUnspecified: boolean; allowSecondUnspecified: boolean;
    exampleToken: string; guidance: string | null;
};
type Colour = {
    id: string; code: string; name: string;
    referenceHex: string | null; isNotApplicable: boolean;
};
type PreviewResult = {
    product_code_preview: string; full_category_code: string;
    category_variant_name: string; family_code: string; family_name: string;
    type_code: string; type_name: string; size_token: string;
    size_rule_name: string; colour_code: string; colour_name: string;
    selected_variant_number: number; variant_code: string;
    variant_name: string; variant_description: string | null;
    is_variant_available: boolean; warning_text: string;
};

export type ProductCodeBuilderValue = {
    categoryVariantId: string; productCodeTypeId: string; sizeRuleId: string;
    colourId: string; firstValue: number | null; secondValue: number | null;
    variantNumber: number; variantCode: string;
    variantName: string; variantDescription: string | null;
    previewCode: string; fullCategoryCode: string; familyCode: string;
    familyName: string; categoryVariantName: string; typeCode: string;
    typeName: string; sizeToken: string; sizeRuleName: string;
    colourCode: string; colourName: string;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (value: ProductCodeBuilderValue) => void;
    confirmLabel?: string;
};

const titleCase = (value: string) =>
    value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

type SearchableOption = {
    value: string;
    label: string;
    searchText: string;
    description?: string | null;
    swatch?: string | null;
    searchCode?: string;
    searchName?: string;
};

const SEARCHABLE_TRIGGER_CLASS =
    "flex h-11 w-full items-center justify-between rounded-xl border border-[#E5E7EB] bg-[#F7F9FB] px-3 text-left text-sm text-[#111827] transition hover:border-[#9E4B4B] focus:border-[#9E4B4B] focus:outline-none focus:ring-2 focus:ring-[#9E4B4B]/20 disabled:cursor-not-allowed disabled:bg-[#F1F3F5] disabled:text-[#9CA3AF]";

function SearchablePicker({
    value,
    onChange,
    options,
    placeholder,
    searchPlaceholder,
    disabled = false,
    emptyText,
}: {
    value: string;
    onChange: (value: string) => void;
    options: SearchableOption[];
    placeholder: string;
    searchPlaceholder: string;
    disabled?: boolean;
    emptyText: string;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const rootRef = useRef<HTMLDivElement | null>(null);

    const selected = options.find((option) => option.value === value) ?? null;
    const keyword = search.trim().toLowerCase();

    const filtered =
        keyword.length < 2
            ? options
            : options
                .filter((option) =>
                    option.searchText.toLowerCase().includes(keyword),
                )
                .sort((a, b) => {
                    const getRank = (option: SearchableOption) => {
                        const code = option.searchCode?.toLowerCase() ?? "";
                        const name = option.searchName?.toLowerCase() ?? "";
                        const description =
                            option.description?.toLowerCase() ?? "";

                        if (code === keyword) return 1;
                        if (code.startsWith(keyword)) return 2;
                        if (name.startsWith(keyword)) return 3;
                        if (name.includes(keyword)) return 4;
                        if (description.includes(keyword)) return 5;

                        return 6;
                    };

                    const rankDifference = getRank(a) - getRank(b);

                    if (rankDifference !== 0) {
                        return rankDifference;
                    }

                    return a.label.localeCompare(b.label, "en-AU", {
                        numeric: true,
                        sensitivity: "base",
                    });
                });

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
                className={SEARCHABLE_TRIGGER_CLASS}
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
                                className="h-11 rounded-xl border-[#E5E7EB] bg-[#F7F9FB] pl-10 hover:border-[#9E4B4B] focus-visible:border-[#9E4B4B] focus-visible:ring-[#9E4B4B]/20"
                            />
                        </div>
                        <p className="mt-2 text-xs text-slate-500">Type at least 2 letters to narrow the list.</p>
                    </div>
                    <div role="listbox" className="max-h-64 overflow-y-auto p-1">
                        {filtered.length === 0 ? (
                            <div className="px-3 py-6 text-center text-sm text-slate-500">{emptyText}</div>
                        ) : (
                            filtered.map((option) => (
                                <button
                                    key={option.value}
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
                                    {option.swatch ? (
                                        <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full border border-slate-300" style={{ backgroundColor: option.swatch }} />
                                    ) : null}
                                    <span className="min-w-0">
                                        <span className="block break-words text-sm font-semibold text-slate-900">{option.label}</span>
                                        {option.description ? (
                                            <span className="mt-0.5 block break-words text-xs text-slate-500">{option.description}</span>
                                        ) : null}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

const optionalInteger = (value: string) => {
    if (!value.trim()) return null;
    const number = Number(value);
    if (!Number.isInteger(number)) throw new Error("Size values must be whole millimetres.");
    return number;
};

const buildLiveSizeToken = (
    sizeRule: SizeRule | null,
    firstValue: string,
    secondValue: string,
) => {
    if (!sizeRule) return "WWWXLLLL";

    const formatSegment = (
        value: string,
        digits: number,
        mode: "numeric" | "random_or_numeric" | "not_applicable",
    ) => {
        if (mode === "not_applicable") {
            return "N".repeat(digits);
        }

        const trimmed = value.trim();

        if (!trimmed) {
            return "N".repeat(digits);
        }

        const numericValue = Number(trimmed);

        if (!Number.isInteger(numericValue) || numericValue < 0) {
            return "N".repeat(digits);
        }

        return String(numericValue)
            .padStart(digits, "0")
            .slice(-digits);
    };

    const firstSegment = formatSegment(
        firstValue,
        3,
        sizeRule.firstMode,
    );

    const secondSegment = formatSegment(
        secondValue,
        4,
        sizeRule.secondMode,
    );

    return `${firstSegment}X${secondSegment}`;
};

export function ProductCodeBuilderModal({
    open, onOpenChange, onConfirm, confirmLabel = "Use This Product Code",
}: Props) {
    const [familyId, setFamilyId] = useState("");
    const [variantId, setVariantId] = useState("");
    const [typeId, setTypeId] = useState("");
    const [sizeRuleId, setSizeRuleId] = useState("");
    const [colourId, setColourId] = useState("");
    const [firstValue, setFirstValue] = useState("");
    const [secondValue, setSecondValue] = useState("");
    const [variantNumber, setVariantNumber] = useState("01");
    const [variantName, setVariantName] = useState("Standard");
    const [variantDescription, setVariantDescription] = useState("");
    const [preview, setPreview] = useState<PreviewResult | null>(null);
    const [previewError, setPreviewError] = useState<string | null>(null);
    const [isPreviewing, setIsPreviewing] = useState(false);

    const { data: families = [], isLoading: loadingFamilies } = useQuery({
        queryKey: ["product-code-builder", "families"],
        enabled: open,
        queryFn: async (): Promise<Family[]> => {
            const { data, error } = await db.from("product_code_families")
                .select("product_code_family_id,family_code,family_name,description,default_product_code_type_id,default_size_rule_id,colour_mode")
                .eq("is_deleted", false).eq("is_active", true).eq("status", "active")
                .order("family_code");
            if (error) throw error;
            return (data ?? []).map((row: any) => ({
                id: row.product_code_family_id, code: row.family_code, name: row.family_name,
                description: row.description, defaultTypeId: row.default_product_code_type_id,
                defaultSizeRuleId: row.default_size_rule_id, colourMode: row.colour_mode,
            }));
        },
    });

    const { data: variants = [], isLoading: loadingVariants } = useQuery({
        queryKey: ["product-code-builder", "variants", familyId],
        enabled: open && Boolean(familyId),
        queryFn: async (): Promise<Variant[]> => {
            const { data, error } = await db.from("product_code_category_variants")
                .select("product_code_category_variant_id,product_code_family_id,full_category_code,variant_name,thickness_mm,subtype_value,size_rule_id,colour_mode_override")
                .eq("product_code_family_id", familyId)
                .eq("is_deleted", false).eq("is_active", true).eq("status", "active")
                .order("variant_digit");
            if (error) throw error;
            return (data ?? []).map((row: any) => ({
                id: row.product_code_category_variant_id, familyId: row.product_code_family_id,
                fullCode: row.full_category_code, name: row.variant_name,
                thicknessMm: row.thickness_mm === null ? null : Number(row.thickness_mm),
                subtypeValue: row.subtype_value, sizeRuleId: row.size_rule_id,
                colourModeOverride: row.colour_mode_override,
            }));
        },
    });

    const { data: types = [], isLoading: loadingTypes } = useQuery({
        queryKey: ["product-code-builder", "types", familyId],
        enabled: open && Boolean(familyId),
        queryFn: async (): Promise<ProductType[]> => {
            const { data, error } = await db.from("product_code_family_types")
                .select("product_code_type_id,is_default,product_code_types(product_code_type_id,type_code,type_name,status,is_active,is_deleted)")
                .eq("product_code_family_id", familyId).eq("is_deleted", false).eq("is_active", true)
                .order("is_default", { ascending: false }).order("sort_order");
            if (error) throw error;
            return (data ?? []).filter((row: any) =>
                row.product_code_types &&
                !row.product_code_types.is_deleted &&
                row.product_code_types.is_active &&
                row.product_code_types.status === "active"
            ).map((row: any) => ({
                id: row.product_code_types.product_code_type_id,
                code: row.product_code_types.type_code,
                name: row.product_code_types.type_name,
            }));
        },
    });

    const { data: sizeRules = [], isLoading: loadingSizeRules } = useQuery({
        queryKey: ["product-code-builder", "size-rules"],
        enabled: open,
        queryFn: async (): Promise<SizeRule[]> => {
            const { data, error } = await db.from("product_code_size_rules")
                .select("product_code_size_rule_id,size_rule_code,size_rule_name,first_value_label,second_value_label,first_value_unit,second_value_unit,first_value_mode,second_value_mode,allow_first_unspecified,allow_second_unspecified,example_size_token,guidance_text")
                .eq("is_deleted", false).eq("is_active", true).eq("status", "active")
                .order("sort_order");
            if (error) throw error;
            return (data ?? []).map((row: any) => ({
                id: row.product_code_size_rule_id, code: row.size_rule_code,
                name: row.size_rule_name, firstLabel: row.first_value_label,
                secondLabel: row.second_value_label, firstUnit: row.first_value_unit,
                secondUnit: row.second_value_unit, firstMode: row.first_value_mode,
                secondMode: row.second_value_mode,
                allowFirstUnspecified: row.allow_first_unspecified,
                allowSecondUnspecified: row.allow_second_unspecified,
                exampleToken: row.example_size_token, guidance: row.guidance_text,
            }));
        },
    });

    const { data: colours = [], isLoading: loadingColours } = useQuery({
        queryKey: ["product-code-builder", "colours"],
        enabled: open,
        queryFn: async (): Promise<Colour[]> => {
            const { data, error } = await db.from("product_colours")
                .select("product_colour_id,colour_code,colour_name,reference_hex,is_not_applicable")
                .eq("is_deleted", false).eq("is_active", true).eq("status", "active")
                .order("sort_order");
            if (error) throw error;
            return (data ?? []).map((row: any) => ({
                id: row.product_colour_id, code: row.colour_code, name: row.colour_name,
                referenceHex: row.reference_hex, isNotApplicable: row.is_not_applicable,
            }));
        },
    });

    const family = useMemo(() => families.find((x) => x.id === familyId) ?? null, [families, familyId]);
    const variant = useMemo(() => variants.find((x) => x.id === variantId) ?? null, [variants, variantId]);
    const productType = useMemo(() => types.find((x) => x.id === typeId) ?? null, [types, typeId]);
    const sizeRule = useMemo(() => sizeRules.find((x) => x.id === sizeRuleId) ?? null, [sizeRules, sizeRuleId]);
    const colour = useMemo(() => colours.find((x) => x.id === colourId) ?? null, [colours, colourId]);

    const colourMode = variant?.colourModeOverride ?? family?.colourMode ?? "optional";
    const availableColours = useMemo(() => {
        if (colourMode === "not_applicable") return colours.filter((x) => x.isNotApplicable);
        if (colourMode === "required") return colours.filter((x) => !x.isNotApplicable);
        return colours;
    }, [colours, colourMode]);


    const familyOptions = useMemo<SearchableOption[]>(
        () =>
            [...families]
                .sort(
                    (a, b) =>
                        a.code.localeCompare(b.code, "en-AU", {
                            numeric: true,
                        }) ||
                        a.name.localeCompare(b.name, "en-AU", {
                            sensitivity: "base",
                        }),
                )
                .map((item) => ({
                    value: item.id,
                    label: `${item.code} — ${item.name}`,
                    description: item.description,
                    searchText: `${item.code} ${item.name} ${item.description ?? ""}`,
                    searchCode: item.code,
                    searchName: item.name,
                })),
        [families],
    );

    const variantOptions = useMemo<SearchableOption[]>(
        () => [...variants]
            .sort((a, b) => a.fullCode.localeCompare(b.fullCode, "en-AU", { numeric: true }) || a.name.localeCompare(b.name, "en-AU"))
            .map((item) => ({
                value: item.id,
                label: `${item.fullCode} — ${item.name}`,
                description: item.thicknessMm !== null
                    ? `Thickness: ${item.thicknessMm} mm`
                    : item.subtypeValue
                        ? `Subtype: ${titleCase(item.subtypeValue)}`
                        : null,
                searchText: `${item.fullCode} ${item.name} ${item.thicknessMm ?? ""} ${item.subtypeValue ?? ""}`,
            })),
        [variants],
    );

    const sizeRuleOptions = useMemo<SearchableOption[]>(
        () => sizeRules.map((item) => ({
            value: item.id,
            label: `${item.name} — ${item.exampleToken}`,
            description: item.guidance,
            searchText: `${item.code} ${item.name} ${item.exampleToken} ${item.guidance ?? ""}`,
        })),
        [sizeRules],
    );

    const colourOptions = useMemo<SearchableOption[]>(
        () => availableColours.map((item) => ({
            value: item.id,
            label: `${item.code} — ${item.name}`,
            searchText: `${item.code} ${item.name}`,
            swatch: item.referenceHex,
        })),
        [availableColours],
    );

    useEffect(() => {
        if (!family) {
            setVariantId(""); setTypeId(""); setSizeRuleId(""); setColourId("");
            setFirstValue(""); setSecondValue(""); setPreview(null);
            return;
        }
        setVariantId("");
        setTypeId(family.defaultTypeId ?? "");
        setSizeRuleId(family.defaultSizeRuleId ?? "");
        setFirstValue(""); setSecondValue(""); setVariantNumber("01");
        setVariantName("Standard"); setVariantDescription("");
        setPreview(null); setPreviewError(null);
    }, [family?.id]);

    useEffect(() => {
        if (!variant) {
            setPreview(null);
            return;
        }
        setSizeRuleId(variant.sizeRuleId ?? family?.defaultSizeRuleId ?? "");
        setFirstValue(""); setSecondValue(""); setVariantNumber("01");
        setVariantName("Standard"); setVariantDescription("");
        setPreview(null); setPreviewError(null);
    }, [variant?.id, family?.defaultSizeRuleId]);

    useEffect(() => {
        if (family?.defaultTypeId && types.some((x) => x.id === family.defaultTypeId)) {
            setTypeId(family.defaultTypeId);
        } else if (types.length === 1) {
            setTypeId(types[0].id);
        }
    }, [family?.defaultTypeId, types]);

    useEffect(() => {
        if (!family || colours.length === 0) return;
        if (colourMode === "not_applicable") {
            setColourId(colours.find((x) => x.isNotApplicable)?.id ?? "");
        } else if (colourMode === "required" && colour?.isNotApplicable) {
            setColourId("");
        }
    }, [family?.id, variant?.id, colourMode, colours, colour?.isNotApplicable]);

    useEffect(() => {
        setPreview(null);
        setPreviewError(null);
    }, [
        familyId,
        variantId,
        typeId,
        sizeRuleId,
        colourId,
        firstValue,
        secondValue,
        variantNumber,
        variantName,
        variantDescription,
    ]);

    const reset = () => {
        setFamilyId(""); setVariantId(""); setTypeId(""); setSizeRuleId("");
        setColourId(""); setFirstValue(""); setSecondValue("");
        setVariantNumber("01");
        setVariantName("Standard");
        setVariantDescription("");
        setPreview(null); setPreviewError(null);
    };

    const changeOpen = (next: boolean) => {
        if (!next) reset();
        onOpenChange(next);
    };

    const validate = () => {
        if (!familyId) throw new Error("Product Family is required.");
        if (!variantId) throw new Error("Category Variant is required.");
        if (!typeId) throw new Error("Product Type is required.");
        if (!sizeRuleId) throw new Error("Size Rule is required.");
        if (!colourId) throw new Error("Product Colour is required.");
        if (!sizeRule) throw new Error("Selected Size Rule could not be found.");

        const first = optionalInteger(firstValue);
        const second = optionalInteger(secondValue);

        if (sizeRule.firstMode === "numeric" && first === null && !sizeRule.allowFirstUnspecified) {
            throw new Error(`${sizeRule.firstLabel} is required.`);
        }
        if (sizeRule.secondMode === "numeric" && second === null && !sizeRule.allowSecondUnspecified) {
            throw new Error(`${sizeRule.secondLabel} is required.`);
        }
        if (first !== null && (first < 0 || first > 999)) {
            throw new Error(`${sizeRule.firstLabel} must be between 0 and 999.`);
        }
        if (second !== null && (second < 0 || second > 9999)) {
            throw new Error(`${sizeRule.secondLabel} must be between 0 and 9999.`);
        }

        const selectedVariantNumber = Number(variantNumber);
        if (
            !Number.isInteger(selectedVariantNumber) ||
            selectedVariantNumber < 1 ||
            selectedVariantNumber > 99
        ) {
            throw new Error("Variant Code must be a whole number between 01 and 99.");
        }

        const selectedVariantName = variantName.trim();
        if (selectedVariantName.length < 2 || selectedVariantName.length > 120) {
            throw new Error("Variant Name must contain between 2 and 120 characters.");
        }

        const selectedVariantDescription = variantDescription.trim();
        if (
            selectedVariantDescription &&
            (selectedVariantDescription.length < 2 ||
                selectedVariantDescription.length > 500)
        ) {
            throw new Error(
                "Variant Description must contain between 2 and 500 characters.",
            );
        }

        return {
            first,
            second,
            selectedVariantNumber,
            selectedVariantName,
            selectedVariantDescription:
                selectedVariantDescription || null,
        };
    };

    const previewCode = async () => {
        try {
            const {
                first,
                second,
                selectedVariantNumber,
                selectedVariantName,
                selectedVariantDescription,
            } = validate();

            setIsPreviewing(true);

            const { data, error } = await db.rpc(
                "preview_product_code_variant",
                {
                    p_category_variant_id: variantId,
                    p_product_code_type_id: typeId,
                    p_size_rule_id: sizeRuleId,
                    p_colour_id: colourId,
                    p_first_value: first,
                    p_second_value: second,
                    p_variant_number: selectedVariantNumber,
                    p_variant_name: selectedVariantName,
                    p_variant_description: selectedVariantDescription,
                },
            );
            if (error) throw error;
            const result = Array.isArray(data) ? data[0] : data;
            if (!result) throw new Error("Product Code preview returned no result.");
            setPreview(result as PreviewResult);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to preview Product Code.";
            setPreview(null);
            setPreviewError(message);
            toast.error(message);
        } finally {
            setIsPreviewing(false);
        }
    };

    const confirm = () => {
        try {
            const {
                first,
                second,
                selectedVariantNumber,
                selectedVariantName,
                selectedVariantDescription,
            } = validate();

            if (!preview) {
                throw new Error("Preview the Product Code before confirming.");
            }

            if (!preview.is_variant_available) {
                throw new Error("This Variant Code has already been used.");
            }

            if (!family || !variant || !productType || !sizeRule || !colour) {
                throw new Error("Product Code selections are incomplete.");
            }

            onConfirm({
                categoryVariantId: variantId,
                productCodeTypeId: typeId,
                sizeRuleId,
                colourId,
                firstValue: first,
                secondValue: second,
                variantNumber: selectedVariantNumber,
                variantCode: preview.variant_code,
                variantName: selectedVariantName,
                variantDescription: selectedVariantDescription,
                previewCode: preview.product_code_preview,
                fullCategoryCode: preview.full_category_code,
                familyCode: preview.family_code,
                familyName: preview.family_name,
                categoryVariantName: preview.category_variant_name,
                typeCode: preview.type_code,
                typeName: preview.type_name,
                sizeToken: preview.size_token,
                sizeRuleName: preview.size_rule_name,
                colourCode: preview.colour_code,
                colourName: preview.colour_name,
            });
            changeOpen(false);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unable to confirm Product Code.");
        }
    };

    const loading = loadingFamilies || loadingVariants || loadingTypes || loadingSizeRules || loadingColours;
    const liveSizeToken = buildLiveSizeToken(
        sizeRule,
        firstValue,
        secondValue,
    );

    const liveVariantCode =
        variantNumber && Number.isInteger(Number(variantNumber))
            ? String(Number(variantNumber)).padStart(2, "0")
            : "VV";

    const previewText = preview
        ? preview.product_code_preview
        : variant
            ? `${variant.fullCode}-${productType?.code ?? "TTT"}-${liveSizeToken}-${colour?.code ?? "CLR"}-${liveVariantCode}`
            : "CCC-TTT-WWWXLLLL-CLR-VV";

    return (
        <Dialog open={open} onOpenChange={changeOpen}>
            <DialogContent className="w-[calc(100vw-24px)] max-w-4xl overflow-hidden rounded-2xl p-0">
                <div className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="border-b border-slate-200 px-4 py-5 sm:px-6">
                        <DialogTitle className="flex items-center gap-3 text-xl sm:text-2xl">
                            <PackageSearch className="h-6 w-6 text-red-600" />
                            Product Code Builder
                        </DialogTitle>
                        <p className="text-sm text-slate-500">
                            Select controlled values. The complete Product Code cannot be typed manually.
                        </p>
                    </DialogHeader>

                    <div className="space-y-6 p-4 sm:p-6">
                        <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-700">
                                Product Code Preview
                            </p>
                            <p className="mt-3 break-all font-mono text-xl font-black text-slate-950 sm:text-3xl">
                                {previewText}
                            </p>
                            <p className="mt-3 text-xs text-red-700">
                                Preview only. Admin selects the Variant Code and its meaning. It is reserved only when the Product is saved.
                            </p>
                        </section>

                        {loading && (
                            <div className="flex items-center justify-center gap-2 rounded-xl border p-5 text-sm text-slate-500">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading Product Code Master Data...
                            </div>
                        )}

                        <section className="grid gap-5 rounded-2xl border border-slate-200 p-4 sm:p-5 lg:grid-cols-2">
                            <Field label="Product Family *">
                                <SearchablePicker
                                    value={familyId}
                                    onChange={setFamilyId}
                                    options={familyOptions}
                                    placeholder="Select Product Family"
                                    searchPlaceholder="Search family code, name or description..."
                                    emptyText="No matching Product Family found."
                                />
                                {family?.description && <Help>{family.description}</Help>}
                            </Field>

                            <Field label="Category Variant *">
                                <SearchablePicker
                                    value={variantId}
                                    onChange={setVariantId}
                                    options={variantOptions}
                                    placeholder={familyId ? "Select Category Variant" : "Select Product Family first"}
                                    searchPlaceholder="Search category code, name, thickness or subtype..."
                                    disabled={!familyId}
                                    emptyText={familyId ? "No Category Variants are configured for this Family." : "Select Product Family first."}
                                />
                                {variant && (
                                    <Help>
                                        {variant.thicknessMm !== null
                                            ? `Thickness: ${variant.thicknessMm} mm`
                                            : variant.subtypeValue
                                                ? `Subtype: ${titleCase(variant.subtypeValue)}`
                                                : variant.name}
                                    </Help>
                                )}
                            </Field>

                            <Field label="Product Type *">
                                <Select value={typeId} onValueChange={setTypeId} disabled={!familyId}>
                                    <SelectTrigger className="h-11"><SelectValue placeholder="Select Product Type" /></SelectTrigger>
                                    <SelectContent>
                                        {types.map((x) => (
                                            <SelectItem key={x.id} value={x.id}>{x.code} — {x.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Help>Only Product Types permitted for the selected Family are shown.</Help>
                            </Field>

                            <Field label="Size Rule *">
                                <SearchablePicker
                                    value={sizeRuleId}
                                    onChange={(value) => {
                                        setSizeRuleId(value);
                                        setFirstValue("");
                                        setSecondValue("");
                                    }}
                                    options={sizeRuleOptions}
                                    placeholder={variantId ? "Select Size Rule" : "Select Category Variant first"}
                                    searchPlaceholder="Search size rule name, code or example..."
                                    disabled={!variantId}
                                    emptyText="No matching Size Rule found."
                                />
                                {sizeRule && <Help>Example: <span className="font-mono font-semibold">{sizeRule.exampleToken}</span></Help>}
                            </Field>

                            {sizeRule?.firstMode === "numeric" && (
                                <Field label={`${sizeRule.firstLabel}${sizeRule.firstUnit ? ` (${sizeRule.firstUnit})` : ""}${!sizeRule.allowFirstUnspecified ? " *" : ""}`}>
                                    <Input type="number" inputMode="numeric" min={0} max={999} step={1}
                                        value={firstValue} onChange={(e) => setFirstValue(e.target.value)}
                                        placeholder={sizeRule.allowFirstUnspecified ? "Leave blank if unspecified" : `Enter ${sizeRule.firstLabel.toLowerCase()}`}
                                        className="h-11" />
                                </Field>
                            )}

                            {sizeRule && sizeRule.secondMode !== "not_applicable" && (
                                <Field label={`${sizeRule.secondLabel}${sizeRule.secondUnit ? ` (${sizeRule.secondUnit})` : ""}${sizeRule.secondMode === "numeric" && !sizeRule.allowSecondUnspecified ? " *" : ""}`}>
                                    <Input type="number" inputMode="numeric" min={0} max={9999} step={1}
                                        value={secondValue} onChange={(e) => setSecondValue(e.target.value)}
                                        placeholder={sizeRule.secondMode === "random_or_numeric" || sizeRule.allowSecondUnspecified
                                            ? "Leave blank for random / unspecified"
                                            : `Enter ${sizeRule.secondLabel.toLowerCase()}`}
                                        className="h-11" />
                                </Field>
                            )}

                            <div className="space-y-2 lg:col-span-2">
                                <Label>Product Colour *</Label>
                                <SearchablePicker
                                    value={colourId}
                                    onChange={setColourId}
                                    options={colourOptions}
                                    placeholder={variantId ? "Select Product Colour" : "Select Category Variant first"}
                                    searchPlaceholder="Search colour code or name..."
                                    disabled={!variantId}
                                    emptyText="No Product Colours are available for the selected rule."
                                />
                                <Help>
                                    Colour rule: {titleCase(colourMode)}. Screen colours are references only.
                                </Help>
                            </div>

                            <Field label="Variant Code (01–99) *">
                                <Input
                                    type="number"
                                    inputMode="numeric"
                                    min={1}
                                    max={99}
                                    step={1}
                                    value={variantNumber}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        if (value === "" || /^\d{1,2}$/.test(value)) {
                                            setVariantNumber(value);
                                        }
                                    }}
                                    placeholder="Example: 05"
                                    disabled={!variantId || !typeId || !sizeRuleId || !colourId}
                                    className="h-11"
                                />
                                <Help>
                                    Use a new number when the product has a materially different specification.
                                </Help>
                            </Field>

                            <Field label="Variant Name *">
                                <Input
                                    value={variantName}
                                    onChange={(event) => setVariantName(event.target.value)}
                                    maxLength={120}
                                    placeholder="Example: Wooden Design"
                                    disabled={!variantNumber}
                                    className="h-11"
                                />
                                <Help>
                                    Short meaning of this Variant Code within the same Product Code base.
                                </Help>
                            </Field>

                            <div className="space-y-2 lg:col-span-2">
                                <Label>Variant Description</Label>
                                <textarea
                                    value={variantDescription}
                                    onChange={(event) =>
                                        setVariantDescription(event.target.value)
                                    }
                                    maxLength={500}
                                    rows={3}
                                    placeholder="Optional technical or commercial explanation, for example wood grain surface pattern."
                                    disabled={!variantNumber}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <Help>
                                    Optional. Store structured specifications such as wattage, RPM, or battery capacity separately in the Product record.
                                </Help>
                            </div>
                        </section>

                        {sizeRule?.guidance && (
                            <Info icon={Ruler} tone="blue">{sizeRule.guidance}</Info>
                        )}
                        {previewError && (
                            <Info icon={AlertTriangle} tone="red">{previewError}</Info>
                        )}

                        {preview && (
                            <section
                                className={`rounded-2xl border p-4 sm:p-5 ${preview.is_variant_available
                                    ? "border-emerald-200 bg-emerald-50"
                                    : "border-red-200 bg-red-50"
                                    }`}
                            >
                                <div
                                    className={`flex items-center gap-2 font-bold ${preview.is_variant_available
                                        ? "text-emerald-900"
                                        : "text-red-800"
                                        }`}
                                >
                                    {preview.is_variant_available ? (
                                        <Check className="h-5 w-5" />
                                    ) : (
                                        <AlertTriangle className="h-5 w-5" />
                                    )}
                                    {preview.is_variant_available
                                        ? "Product Code Preview Validated"
                                        : "Variant Code Already Used"}
                                </div>

                                <p
                                    className={`mt-2 text-sm ${preview.is_variant_available
                                        ? "text-emerald-800"
                                        : "text-red-700"
                                        }`}
                                >
                                    {preview.warning_text}
                                </p>

                                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                    <Segment
                                        icon={Hash}
                                        label="Category"
                                        value={preview.full_category_code}
                                        detail={preview.category_variant_name}
                                    />
                                    <Segment
                                        icon={Tag}
                                        label="Type"
                                        value={preview.type_code}
                                        detail={preview.type_name}
                                    />
                                    <Segment
                                        icon={Ruler}
                                        label="Size"
                                        value={preview.size_token}
                                        detail={preview.size_rule_name}
                                    />
                                    <Segment
                                        icon={Palette}
                                        label="Colour"
                                        value={preview.colour_code}
                                        detail={preview.colour_name}
                                    />
                                    <Segment
                                        icon={ShieldCheck}
                                        label="Variant"
                                        value={preview.variant_code}
                                        detail={preview.variant_name}
                                    />
                                </div>

                                {preview.variant_description && (
                                    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                            Variant Description
                                        </p>
                                        <p className="mt-2 text-sm text-slate-700">
                                            {preview.variant_description}
                                        </p>
                                    </div>
                                )}
                            </section>
                        )}

                        <Info icon={AlertTriangle} tone="amber">
                            Once reserved and assigned to a Product, the Product Code, Variant Code, and Variant meaning are permanent and cannot be reused.
                        </Info>

                        <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
                            <Button variant="outline" onClick={() => changeOpen(false)} className="h-11 rounded-xl">
                                Cancel
                            </Button>
                            <Button variant="outline" onClick={previewCode} disabled={isPreviewing || loading} className="h-11 rounded-xl">
                                {isPreviewing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Preview Product Code
                            </Button>
                            <Button
                                onClick={confirm}
                                disabled={
                                    !preview ||
                                    !preview.is_variant_available ||
                                    isPreviewing
                                }
                                className="h-11 rounded-xl bg-red-600 font-bold text-white hover:bg-red-700">
                                <Check className="mr-2 h-4 w-4" /> {confirmLabel}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
function Help({ children }: { children: React.ReactNode }) {
    return <p className="text-xs text-slate-500">{children}</p>;
}
function Segment({ icon: Icon, label, value, detail }: {
    icon: typeof Hash; label: string; value: string; detail: string;
}) {
    return (
        <div className="rounded-xl border border-emerald-200 bg-white p-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-700">
                <Icon className="h-4 w-4" /> {label}
            </div>
            <p className="mt-2 break-all font-mono text-base font-black">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
    );
}
function Info({ icon: Icon, tone, children }: {
    icon: typeof AlertTriangle; tone: "blue" | "red" | "amber"; children: React.ReactNode;
}) {
    const classes = {
        blue: "border-blue-200 bg-blue-50 text-blue-800",
        red: "border-red-200 bg-red-50 text-red-700",
        amber: "border-amber-200 bg-amber-50 text-amber-800",
    }[tone];
    return (
        <div className={`rounded-xl border p-4 text-sm ${classes}`}>
            <div className="flex items-start gap-2">
                <Icon className="mt-0.5 h-4 w-4 shrink-0" /><p>{children}</p>
            </div>
        </div>
    );
}

export default ProductCodeBuilderModal;