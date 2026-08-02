import { useEffect, useMemo, useRef, useState } from "react";
import {
    AlertTriangle,
    Check,
    ChevronDown,
    Loader2,
    Search,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

type Family = {
    id: string;
    code: string;
    name: string;
    description: string | null;
    defaultTypeId: string | null;
    defaultSizeRuleId: string | null;
    colourMode: "required" | "optional" | "not_applicable";
};

type ThicknessCode = {
    id: string;
    code: string;
    name: string;
    thicknessMm: number | null;
    isUnspecified: boolean;
    description: string | null;
};

type ProductCodeType = {
    id: string;
    code: string;
    name: string;
};

type SizeRule = {
    id: string;
    code: string;
    name: string;
    firstLabel: string;
    secondLabel: string;
    firstUnit: string | null;
    secondUnit: string | null;
    firstMode: "numeric" | "not_applicable";
    secondMode: "numeric" | "random_or_numeric" | "not_applicable";
    allowFirstUnspecified: boolean;
    allowSecondUnspecified: boolean;
    exampleToken: string;
    guidance: string | null;
};

type Colour = {
    id: string;
    code: string;
    name: string;
    referenceHex: string | null;
    isNotApplicable: boolean;
};

export type ProductCodePreviewResult = {
    product_code_preview: string;
    full_category_code: string;
    family_code: string;
    family_name: string;
    thickness_code: string;
    thickness_name: string;
    thickness_mm: number | null;
    thickness_meaning: string;
    type_code: string;
    type_name: string;
    size_token: string;
    size_rule_name: string;
    colour_code: string;
    colour_name: string;
    selected_variant_number: number;
    variant_code: string;
    variant_name: string;
    variant_description: string | null;
    is_variant_available: boolean;
    warning_text: string;
};

export type ProductCodeBuilderValue = {
    productCodeFamilyId: string;
    productThicknessCodeId: string;
    productCodeTypeId: string;
    sizeRuleId: string;
    colourId: string;
    firstValue: number | null;
    secondValue: number | null;
    variantNumber: number;
    variantCode: string;
    variantName: string;
    variantDescription: string | null;
    previewCode: string;
    fullCategoryCode: string;
    familyCode: string;
    familyName: string;
    thicknessCode: string;
    thicknessName: string;
    typeCode: string;
    typeName: string;
    sizeToken: string;
    sizeRuleName: string;
    colourCode: string;
    colourName: string;
};

export type ProductIdentityFormValue = {
    productCodeFamilyId: string;
    productThicknessCodeId: string;
    productCodeTypeId: string;
    sizeRuleId: string;
    colourId: string;
    firstValue: string;
    secondValue: string;
    variantNumber: string;
    variantName: string;
    variantDescription: string;
};

export type ProductIdentityValidationState = {
    status: "idle" | "validating" | "valid" | "duplicate" | "invalid";
    message: string | null;
    preview: ProductCodePreviewResult | null;
    identity: ProductCodeBuilderValue | null;
};

type ManageTarget =
    | "product-families"
    | "thickness-codes"
    | "product-code-types"
    | "size-rules"
    | "product-colours";

type Props = {
    value: ProductIdentityFormValue;
    onChange: (value: ProductIdentityFormValue) => void;
    onValidationChange: (state: ProductIdentityValidationState) => void;
    onNameSuggestionChange?: (suggestion: string) => void;
    onManage?: (target: ManageTarget) => void;
    disabled?: boolean;
};

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

    const filtered = useMemo(() => {
        if (keyword.length < 2) return options;

        const rank = (option: SearchableOption) => {
            const code = option.searchCode?.toLowerCase() ?? "";
            const name = option.searchName?.toLowerCase() ?? "";
            const description = option.description?.toLowerCase() ?? "";
            if (code === keyword) return 1;
            if (code.startsWith(keyword)) return 2;
            if (name.startsWith(keyword)) return 3;
            if (name.includes(keyword)) return 4;
            if (description.includes(keyword)) return 5;
            return 6;
        };

        return options
            .filter((option) =>
                option.searchText.toLowerCase().includes(keyword)
            )
            .sort(
                (a, b) =>
                    rank(a) - rank(b) ||
                    a.label.localeCompare(b.label, "en-AU", {
                        numeric: true,
                        sensitivity: "base",
                    }),
            );
    }, [keyword, options]);

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
                className={SEARCHABLE_TRIGGER_CLASS}
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
                                    className="h-11 rounded-xl border-[#E5E7EB] bg-[#F7F9FB] pl-10 hover:border-[#9E4B4B] focus-visible:border-[#9E4B4B] focus-visible:ring-[#9E4B4B]/20"
                                />
                            </div>
                            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                                <span>
                                    Type at least 2 letters to narrow the list.
                                </span>
                                <span className="font-semibold">
                                    {filtered.length} options
                                </span>
                            </div>
                        </div>

                        <div
                            role="listbox"
                            className="max-h-[22rem] overflow-y-auto overscroll-contain p-1"
                        >
                            {filtered.length === 0
                                ? (
                                    <div className="px-3 py-6 text-center text-sm text-slate-500">
                                        {emptyText}
                                    </div>
                                )
                                : (
                                    filtered.map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            role="option"
                                            aria-selected={option.value ===
                                                value}
                                            onClick={() => {
                                                onChange(option.value);
                                                setOpen(false);
                                                setSearch("");
                                            }}
                                            className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left hover:bg-[#FBF1F1] focus:bg-[#FBF1F1] focus:outline-none"
                                        >
                                            <Check
                                                className={`mt-0.5 h-4 w-4 shrink-0 ${
                                                    option.value === value
                                                        ? "text-[#9E4B4B]"
                                                        : "text-transparent"
                                                }`}
                                            />
                                            {option.swatch
                                                ? (
                                                    <span
                                                        className="mt-0.5 h-4 w-4 shrink-0 rounded-full border border-slate-300"
                                                        style={{
                                                            backgroundColor:
                                                                option.swatch,
                                                        }}
                                                    />
                                                )
                                                : null}
                                            <span className="min-w-0">
                                                <span className="block break-words text-sm font-semibold text-slate-900">
                                                    {option.label}
                                                </span>
                                                {option.description
                                                    ? (
                                                        <span className="mt-0.5 block break-words text-xs text-slate-500">
                                                            {option.description}
                                                        </span>
                                                    )
                                                    : null}
                                            </span>
                                        </button>
                                    ))
                                )}
                        </div>
                    </div>
                )
                : null}
        </div>
    );
}

function Field({
    label,
    manageLabel,
    onManage,
    children,
    helper,
    className = "",
}: {
    label: string;
    manageLabel?: string;
    onManage?: () => void;
    children: React.ReactNode;
    helper?: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={className}>
            <div className="mb-1.5 flex items-center justify-between gap-2">
                <label className="text-sm font-bold text-[#111827]">
                    {label}
                </label>
                {manageLabel && onManage
                    ? (
                        <button
                            type="button"
                            onClick={onManage}
                            className="text-xs font-semibold text-[#9E4B4B] underline-offset-2 hover:underline"
                        >
                            {manageLabel}
                        </button>
                    )
                    : null}
            </div>
            {children}
            {helper
                ? (
                    <div className="mt-1.5 text-xs leading-5 text-[#6B7280]">
                        {helper}
                    </div>
                )
                : null}
        </div>
    );
}

const optionalInteger = (value: string) => {
    if (!value.trim()) return null;
    const number = Number(value);
    return Number.isInteger(number) ? number : null;
};

const formatSegment = (
    value: string,
    length: number,
    mode: SizeRule["firstMode"] | SizeRule["secondMode"],
) => {
    if (mode === "not_applicable") return "N".repeat(length);
    const parsed = optionalInteger(value);
    if (parsed === null) return "N".repeat(length);
    return String(parsed).padStart(length, "0").slice(-length);
};

const buildLiveSizeToken = (
    sizeRule: SizeRule | null,
    firstValue: string,
    secondValue: string,
) => {
    if (!sizeRule) return "WWWXLLLL";
    return `${formatSegment(firstValue, 3, sizeRule.firstMode)}X${
        formatSegment(
            secondValue,
            4,
            sizeRule.secondMode,
        )
    }`;
};

export const EMPTY_PRODUCT_IDENTITY: ProductIdentityFormValue = {
    productCodeFamilyId: "",
    productThicknessCodeId: "",
    productCodeTypeId: "",
    sizeRuleId: "",
    colourId: "",
    firstValue: "",
    secondValue: "",
    variantNumber: "01",
    variantName: "Standard",
    variantDescription: "",
};

export function ProductIdentityStep({
    value,
    onChange,
    onValidationChange,
    onNameSuggestionChange,
    onManage,
    disabled = false,
}: Props) {
    const [preview, setPreview] = useState<ProductCodePreviewResult | null>(
        null,
    );
    const [previewError, setPreviewError] = useState<string | null>(null);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const requestSequence = useRef(0);
    const onValidationChangeRef = useRef(onValidationChange);

    useEffect(() => {
        onValidationChangeRef.current = onValidationChange;
    }, [onValidationChange]);

    const update = (patch: Partial<ProductIdentityFormValue>) => {
        onChange({ ...value, ...patch });
    };

    const { data: families = [], isLoading: loadingFamilies } = useQuery({
        queryKey: ["product-code-builder", "families"],
        queryFn: async (): Promise<Family[]> => {
            const { data, error } = await supabase
                .from("product_code_families")
                .select(
                    "product_code_family_id,family_code,family_name,description,default_product_code_type_id,default_size_rule_id,colour_mode",
                )
                .eq("is_deleted", false)
                .eq("is_active", true)
                .eq("status", "active")
                .order("family_code");
            if (error) throw error;
            return (data ?? []).map((row: any) => ({
                id: row.product_code_family_id,
                code: row.family_code,
                name: row.family_name,
                description: row.description,
                defaultTypeId: row.default_product_code_type_id,
                defaultSizeRuleId: row.default_size_rule_id,
                colourMode: row.colour_mode,
            }));
        },
    });

    const { data: thicknessCodes = [], isLoading: loadingThicknessCodes } =
        useQuery({
            queryKey: ["product-code-builder", "thickness-codes"],
            queryFn: async (): Promise<ThicknessCode[]> => {
                const { data, error } = await supabase
                    .from("product_thickness_codes")
                    .select(
                        "product_thickness_code_id, thickness_code, thickness_name, thickness_mm, thickness_meaning, description, guidance_text, status, sort_order, is_active, is_deleted",
                    )
                    .eq("is_deleted", false)
                    .eq("is_active", true)
                    .eq("status", "active")
                    .order("sort_order")
                    .order("thickness_code");
                if (error) throw error;
                return (data ?? []).map((row: any) => ({
                    id: row.product_thickness_code_id,
                    code: row.thickness_code,
                    name: row.thickness_name,
                    thicknessMm: row.thickness_mm === null
                        ? null
                        : Number(row.thickness_mm),
                    isUnspecified: row.thickness_meaning === "unknown" ||
                        row.thickness_code === "Z",
                    isNotApplicable:
                        row.thickness_meaning === "not_applicable" ||
                        row.thickness_code === "X",
                    description: row.description,
                }));
            },
        });

    const { data: types = [], isLoading: loadingTypes } = useQuery({
        queryKey: [
            "product-identity-step",
            "types",
            value.productCodeFamilyId,
        ],
        queryFn: async (): Promise<ProductCodeType[]> => {
            const typeRequest = supabase
                .from("product_code_types")
                .select("product_code_type_id,type_code,type_name,sort_order")
                .eq("is_deleted", false)
                .eq("is_active", true)
                .eq("status", "active")
                .order("sort_order")
                .order("type_code");

            const mappingRequest = value.productCodeFamilyId
                ? supabase
                    .from("product_code_family_types")
                    .select("product_code_type_id,is_default,sort_order")
                    .eq(
                        "product_code_family_id",
                        value.productCodeFamilyId,
                    )
                    .eq("is_deleted", false)
                    .eq("is_active", true)
                : Promise.resolve({ data: [], error: null });

            const [typeResult, mappingResult] = await Promise.all([
                typeRequest,
                mappingRequest,
            ]);
            if (typeResult.error) throw typeResult.error;
            if (mappingResult.error) throw mappingResult.error;

            const recommendation = new Map<
                string,
                { isDefault: boolean; sortOrder: number }
            >(
                (mappingResult.data ?? []).map((row: any) => [
                    row.product_code_type_id,
                    {
                        isDefault: Boolean(row.is_default),
                        sortOrder: Number(row.sort_order ?? 9999),
                    },
                ]),
            );

            return (typeResult.data ?? [])
                .map((row: any) => ({
                    id: row.product_code_type_id,
                    code: row.type_code,
                    name: row.type_name,
                    masterSortOrder: Number(row.sort_order ?? 9999),
                }))
                .sort((a: any, b: any) => {
                    const aRecommendation = recommendation.get(a.id);
                    const bRecommendation = recommendation.get(b.id);
                    const aGroup = aRecommendation
                        ? aRecommendation.isDefault ? 0 : 1
                        : 2;
                    const bGroup = bRecommendation
                        ? bRecommendation.isDefault ? 0 : 1
                        : 2;
                    return (
                        aGroup - bGroup ||
                        (aRecommendation?.sortOrder ?? a.masterSortOrder) -
                            (bRecommendation?.sortOrder ?? b.masterSortOrder) ||
                        a.code.localeCompare(b.code, "en-AU", { numeric: true })
                    );
                })
                .map(({ masterSortOrder: _ignored, ...item }: any) => item);
        },
    });

    const { data: sizeRules = [], isLoading: loadingSizeRules } = useQuery({
        queryKey: ["product-code-builder", "size-rules"],
        queryFn: async (): Promise<SizeRule[]> => {
            const { data, error } = await supabase
                .from("product_code_size_rules")
                .select(
                    "product_code_size_rule_id,size_rule_code,size_rule_name,first_value_label,second_value_label,first_value_unit,second_value_unit,first_value_mode,second_value_mode,allow_first_unspecified,allow_second_unspecified,example_size_token,guidance_text",
                )
                .eq("is_deleted", false)
                .eq("is_active", true)
                .eq("status", "active")
                .order("sort_order");
            if (error) throw error;
            return (data ?? []).map((row: any) => ({
                id: row.product_code_size_rule_id,
                code: row.size_rule_code,
                name: row.size_rule_name,
                firstLabel: row.first_value_label,
                secondLabel: row.second_value_label,
                firstUnit: row.first_value_unit,
                secondUnit: row.second_value_unit,
                firstMode: row.first_value_mode,
                secondMode: row.second_value_mode,
                allowFirstUnspecified: row.allow_first_unspecified,
                allowSecondUnspecified: row.allow_second_unspecified,
                exampleToken: row.example_size_token,
                guidance: row.guidance_text,
            }));
        },
    });

    const { data: colours = [], isLoading: loadingColours } = useQuery({
        queryKey: ["product-code-builder", "colours"],
        queryFn: async (): Promise<Colour[]> => {
            const { data, error } = await supabase
                .from("product_colours")
                .select(
                    "product_colour_id,colour_code,colour_name,reference_hex,is_not_applicable",
                )
                .eq("is_deleted", false)
                .eq("is_active", true)
                .eq("status", "active")
                .order("sort_order");
            if (error) throw error;
            return (data ?? []).map((row: any) => ({
                id: row.product_colour_id,
                code: row.colour_code,
                name: row.colour_name,
                referenceHex: row.reference_hex,
                isNotApplicable: row.is_not_applicable,
            }));
        },
    });

    const family = useMemo(
        () =>
            families.find((item) => item.id === value.productCodeFamilyId) ??
                null,
        [families, value.productCodeFamilyId],
    );
    const thicknessCode = useMemo(
        () =>
            thicknessCodes.find(
                (item) => item.id === value.productThicknessCodeId,
            ) ?? null,
        [thicknessCodes, value.productThicknessCodeId],
    );
    const productCodeType = useMemo(
        () => types.find((item) => item.id === value.productCodeTypeId) ?? null,
        [types, value.productCodeTypeId],
    );
    const sizeRule = useMemo(
        () => sizeRules.find((item) => item.id === value.sizeRuleId) ?? null,
        [sizeRules, value.sizeRuleId],
    );
    const colour = useMemo(
        () => colours.find((item) => item.id === value.colourId) ?? null,
        [colours, value.colourId],
    );

    const colourMode = family?.colourMode ?? "optional";
    const availableColours = useMemo(() => {
        if (colourMode === "not_applicable") {
            return colours.filter((item) => item.isNotApplicable);
        }
        if (colourMode === "required") {
            return colours.filter((item) => !item.isNotApplicable);
        }
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
                    searchText: `${item.code} ${item.name} ${
                        item.description ?? ""
                    }`,
                    searchCode: item.code,
                    searchName: item.name,
                })),
        [families],
    );

    const thicknessOptions = useMemo<SearchableOption[]>(
        () =>
            thicknessCodes.map((item) => ({
                value: item.id,
                label: `${item.code} — ${item.name}`,
                description: item.description,
                searchText: `${item.code} ${item.name} ${
                    item.description ?? ""
                }`,
                searchCode: item.code,
                searchName: item.name,
            })),
        [thicknessCodes],
    );

    const typeOptions = useMemo<SearchableOption[]>(
        () =>
            types.map((item) => ({
                value: item.id,
                label: `${item.code} — ${item.name}`,
                searchText: `${item.code} ${item.name}`,
                searchCode: item.code,
                searchName: item.name,
            })),
        [types],
    );

    const sizeRuleOptions = useMemo<SearchableOption[]>(
        () =>
            sizeRules.map((item) => {
                const source = `${item.code} ${item.name}`.toLowerCase();
                const first = item.firstLabel.toLowerCase();
                const second = item.secondLabel.toLowerCase();

                let businessLabel = item.name;
                if (source.includes("floor") && item.secondMode === "random_or_numeric") {
                    businessLabel = "Flooring — Fixed Width × Random Length";
                } else if (source.includes("floor") || (first.includes("width") && second.includes("length"))) {
                    businessLabel = "Flooring — Fixed Width × Fixed Length";
                } else if (
                    source.includes("profile") || source.includes("trim") ||
                    source.includes("skirting") || source.includes("scotia") ||
                    source.includes("nosing") || first.includes("size")
                ) {
                    businessLabel = "Profile — Size × Length";
                } else if (item.firstMode === "not_applicable" && item.secondMode === "not_applicable") {
                    businessLabel = "Non-dimensional Product";
                }

                const technicalReference = [
                    item.guidance,
                    item.exampleToken ? `Technical reference: ${item.exampleToken}` : null,
                ].filter(Boolean).join(" ");

                return {
                    value: item.id,
                    label: businessLabel,
                    description: technicalReference,
                    searchText: `${item.code} ${item.name} ${businessLabel} ${item.exampleToken} ${
                        item.guidance ?? ""
                    }`,
                    searchCode: item.code,
                    searchName: businessLabel,
                };
            }),
        [sizeRules],
    );

    const colourOptions = useMemo<SearchableOption[]>(
        () =>
            availableColours.map((item) => ({
                value: item.id,
                label: `${item.code} — ${item.name}`,
                searchText: `${item.code} ${item.name}`,
                swatch: item.referenceHex,
                searchCode: item.code,
                searchName: item.name,
            })),
        [availableColours],
    );

    useEffect(() => {
        if (!family) return;
        const patch: Partial<ProductIdentityFormValue> = {};
        if (
            family.defaultTypeId &&
            types.some((item) => item.id === family.defaultTypeId) &&
            !value.productCodeTypeId
        ) {
            patch.productCodeTypeId = family.defaultTypeId;
        }
        if (family.defaultSizeRuleId && !value.sizeRuleId) {
            patch.sizeRuleId = family.defaultSizeRuleId;
        }
        if (
            colourMode === "not_applicable" &&
            !value.colourId &&
            colours.some((item) => item.isNotApplicable)
        ) {
            patch.colourId = colours.find((item) => item.isNotApplicable)?.id ??
                "";
        }
        if (Object.keys(patch).length > 0) update(patch);
        // Controlled defaults intentionally react only to loaded master data.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        family?.id,
        family?.defaultTypeId,
        family?.defaultSizeRuleId,
        colourMode,
        types,
        colours,
    ]);

    const validationInput = useMemo(() => {
        if (
            !family ||
            !thicknessCode ||
            !productCodeType ||
            !sizeRule ||
            !colour
        ) {
            return { error: null, payload: null };
        }

        const first = optionalInteger(value.firstValue);
        const second = optionalInteger(value.secondValue);

        if (
            sizeRule.firstMode === "numeric" &&
            first === null &&
            !sizeRule.allowFirstUnspecified
        ) {
            return {
                error: `${sizeRule.firstLabel} is required.`,
                payload: null,
            };
        }
        if (
            sizeRule.secondMode === "numeric" &&
            second === null &&
            !sizeRule.allowSecondUnspecified
        ) {
            return {
                error: `${sizeRule.secondLabel} is required.`,
                payload: null,
            };
        }
        if (first !== null && (first < 0 || first > 999)) {
            return {
                error: `${sizeRule.firstLabel} must be between 0 and 999.`,
                payload: null,
            };
        }
        if (second !== null && (second < 0 || second > 9999)) {
            return {
                error: `${sizeRule.secondLabel} must be between 0 and 9999.`,
                payload: null,
            };
        }

        const variantNumber = Number(value.variantNumber);
        if (
            !Number.isInteger(variantNumber) ||
            variantNumber < 1 ||
            variantNumber > 99
        ) {
            return {
                error: "Variant Code must be a whole number between 01 and 99.",
                payload: null,
            };
        }

        const variantName = variantNumber === 1
            ? "Standard"
            : value.variantName.trim();
        if (variantNumber > 1 && variantName.toLowerCase() === "standard") {
            return {
                error:
                    "Variant Name ‘Standard’ is reserved for Variant Code 01.",
                payload: null,
            };
        }
        if (variantName.length < 2 || variantName.length > 120) {
            return {
                error:
                    "Variant Name must contain between 2 and 120 characters.",
                payload: null,
            };
        }

        const variantDescription = value.variantDescription.trim();
        if (
            variantDescription &&
            (variantDescription.length < 2 || variantDescription.length > 500)
        ) {
            return {
                error:
                    "Variant Description must contain between 2 and 500 characters.",
                payload: null,
            };
        }

        return {
            error: null,
            payload: {
                first,
                second,
                variantNumber,
                variantName,
                variantDescription: variantDescription || null,
            },
        };
    }, [
        family,
        thicknessCode,
        productCodeType,
        sizeRule,
        colour,
        value.firstValue,
        value.secondValue,
        value.variantNumber,
        value.variantName,
        value.variantDescription,
    ]);

    useEffect(() => {
        setPreview(null);
        setPreviewError(null);

        if (!validationInput.payload) {
            const state: ProductIdentityValidationState = validationInput.error
                ? {
                    status: "invalid",
                    message: validationInput.error,
                    preview: null,
                    identity: null,
                }
                : {
                    status: "idle",
                    message: null,
                    preview: null,
                    identity: null,
                };
            onValidationChangeRef.current(state);
            return;
        }

        const sequence = ++requestSequence.current;
        setIsPreviewing(true);
        onValidationChangeRef.current({
            status: "validating",
            message: null,
            preview: null,
            identity: null,
        });

        const timer = window.setTimeout(async () => {
            try {
                const payload = validationInput.payload;
                const { data, error } = await supabase.rpc(
                    "preview_product_code_variant_v2",
                    {
                        p_product_code_family_id: value.productCodeFamilyId,
                        p_product_thickness_code_id:
                            value.productThicknessCodeId,
                        p_product_code_type_id: value.productCodeTypeId,
                        p_size_rule_id: value.sizeRuleId,
                        p_colour_id: value.colourId,
                        p_first_value: payload.first,
                        p_second_value: payload.second,
                        p_variant_number: payload.variantNumber,
                        p_variant_name: payload.variantName,
                        p_variant_description: payload.variantDescription,
                    },
                );
                if (error) throw error;
                if (sequence !== requestSequence.current) return;

                const result = (Array.isArray(data) ? data[0] : data) as
                    | ProductCodePreviewResult
                    | undefined;
                if (!result) {
                    throw new Error("Product Code preview returned no result.");
                }

                setPreview(result);
                setPreviewError(null);

                const identity: ProductCodeBuilderValue = {
                    productCodeFamilyId: value.productCodeFamilyId,
                    productThicknessCodeId: value.productThicknessCodeId,
                    productCodeTypeId: value.productCodeTypeId,
                    sizeRuleId: value.sizeRuleId,
                    colourId: value.colourId,
                    firstValue: payload.first,
                    secondValue: payload.second,
                    variantNumber: payload.variantNumber,
                    variantCode: result.variant_code,
                    variantName: payload.variantName,
                    variantDescription: payload.variantDescription,
                    previewCode: result.product_code_preview,
                    fullCategoryCode: result.full_category_code,
                    familyCode: result.family_code,
                    familyName: result.family_name,
                    thicknessCode: result.thickness_code,
                    thicknessName: result.thickness_name,
                    typeCode: result.type_code,
                    typeName: result.type_name,
                    sizeToken: result.size_token,
                    sizeRuleName: result.size_rule_name,
                    colourCode: result.colour_code,
                    colourName: result.colour_name,
                };

                onValidationChangeRef.current({
                    status: result.is_variant_available ? "valid" : "duplicate",
                    message: result.warning_text || null,
                    preview: result,
                    identity: result.is_variant_available ? identity : null,
                });
            } catch (error) {
                if (sequence !== requestSequence.current) return;
                const message = error instanceof Error
                    ? error.message
                    : "Unable to validate Product Code.";
                setPreview(null);
                setPreviewError(message);
                onValidationChangeRef.current({
                    status: "invalid",
                    message,
                    preview: null,
                    identity: null,
                });
            } finally {
                if (sequence === requestSequence.current) {
                    setIsPreviewing(false);
                }
            }
        }, 450);

        return () => {
            window.clearTimeout(timer);
            requestSequence.current += 1;
        };
    }, [
        validationInput,
        value.productCodeFamilyId,
        value.productThicknessCodeId,
        value.productCodeTypeId,
        value.sizeRuleId,
        value.colourId,
    ]);

    const loading = loadingFamilies ||
        loadingThicknessCodes ||
        loadingTypes ||
        loadingSizeRules ||
        loadingColours;

    const liveSizeToken = buildLiveSizeToken(
        sizeRule,
        value.firstValue,
        value.secondValue,
    );
    const variantNumber = Number(value.variantNumber);
    const liveVariantCode = Number.isInteger(variantNumber)
        ? String(variantNumber).padStart(2, "0")
        : "VV";
    const previewText = preview?.product_code_preview ??
        (family && thicknessCode
            ? `${family.code}${thicknessCode.code}-${
                productCodeType?.code ?? "TTT"
            }-${liveSizeToken}-${colour?.code ?? "CLR"}-${liveVariantCode}`
            : "CCC-TTT-WWWXLLLL-CLR-VV");
    const isSpecialVariant = variantNumber > 1;

    const liveNameSuggestion = useMemo(() => {
        const cleanThickness = thicknessCode?.name
            ?.replace(/\b(unknown|not applicable)\b/gi, "")
            .replace(/\s+/g, " ")
            .trim();

        const parts = [
            productCodeType?.name,
            colour?.isNotApplicable ? null : colour?.name,
            cleanThickness,
        ].filter(Boolean) as string[];

        if (isSpecialVariant && value.variantName.trim()) {
            parts.push(value.variantName.trim());
        }

        const first = value.firstValue.trim();
        const second = value.secondValue.trim();
        const ruleName = sizeRule?.name.toLowerCase() ?? "";
        let readableSize = "";

        if (first && second && !ruleName.includes("random")) {
            readableSize = `${Number(first)} × ${Number(second)} mm`;
        } else if (first && ruleName.includes("random")) {
            readableSize = `${Number(first)} mm × Random Length`;
        } else if (first) {
            readableSize = `${Number(first)} mm`;
        } else if (second) {
            readableSize = `${Number(second)} mm`;
        }

        const base = parts.join(" ").replace(/\s+/g, " ").trim();
        if (!base) return "";
        return readableSize ? `${base} — ${readableSize}` : base;
    }, [
        colour,
        isSpecialVariant,
        productCodeType,
        sizeRule,
        thicknessCode,
        value.firstValue,
        value.secondValue,
        value.variantName,
    ]);

    useEffect(() => {
        onNameSuggestionChange?.(liveNameSuggestion);
    }, [liveNameSuggestion, onNameSuggestionChange]);

    return (
        <div className="space-y-5">
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 text-center sm:p-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9E4B4B]">
                    Product Code Preview
                </p>

                <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 font-mono text-sm font-black text-slate-900 sm:text-base">
                    <span className="rounded-lg border border-[#E5E7EB] bg-[#F7F9FB] px-2 py-1">
                        {family?.code ?? "CC"}
                    </span>
                    <span className="rounded-lg border border-[#E5E7EB] bg-[#F7F9FB] px-2 py-1">
                        {thicknessCode?.code ?? "C"}
                    </span>
                    <span>-</span>
                    <span className="rounded-lg border border-[#E5E7EB] bg-[#F7F9FB] px-2 py-1">
                        {productCodeType?.code ?? "TTT"}
                    </span>
                    <span>-</span>
                    <span className="rounded-lg border border-[#E5E7EB] bg-[#F7F9FB] px-2 py-1">
                        {liveSizeToken}
                    </span>
                    <span>-</span>
                    <span className="rounded-lg border border-[#E5E7EB] bg-[#F7F9FB] px-2 py-1">
                        {colour?.code ?? "CLR"}
                    </span>
                    <span>-</span>
                    <span className="rounded-lg border border-[#E5E7EB] bg-[#F7F9FB] px-2 py-1">
                        {liveVariantCode}
                    </span>
                </div>

                <p className="mt-3 break-all font-mono text-xl font-black text-slate-900 sm:text-2xl">
                    {previewText}
                </p>
                <div className="mt-4 flex justify-center">
                    {isPreviewing
                        ? (
                            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Validating
                            </span>
                        )
                        : preview?.is_variant_available
                        ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800">
                                <Check className="h-3.5 w-3.5" />
                                Available
                            </span>
                        )
                        : preview
                        ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Already used
                            </span>
                        )
                        : previewError || validationInput.error
                        ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Check fields
                            </span>
                        )
                        : (
                            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                                Awaiting details
                            </span>
                        )}
                </div>

                {previewError || validationInput.error
                    ? (
                        <div className="mx-auto mt-3 max-w-3xl rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-left text-sm text-red-700">
                            {previewError ?? validationInput.error}
                        </div>
                    )
                    : preview?.warning_text
                    ? (
                        <div
                            className={`mx-auto mt-3 max-w-3xl rounded-xl border px-3 py-2 text-left text-sm ${
                                preview.is_variant_available
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                    : "border-red-200 bg-red-50 text-red-700"
                            }`}
                        >
                            {preview.warning_text}
                        </div>
                    )
                    : null}
            </div>

            {loading
                ? (
                    <div className="flex items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-white p-5 text-sm text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading Product Code master data...
                    </div>
                )
                : null}

            <div className="grid gap-4 lg:grid-cols-3">
                <Field
                    label="Product Family *"
                    manageLabel="Manage Product Families"
                    onManage={onManage
                        ? () => onManage("product-families")
                        : undefined}
                    helper={family?.description}
                >
                    <SearchablePicker
                        value={value.productCodeFamilyId}
                        onChange={(selected) =>
                            onChange({
                                ...EMPTY_PRODUCT_IDENTITY,
                                productCodeFamilyId: selected,
                            })}
                        options={familyOptions}
                        placeholder="Select Product Family"
                        searchPlaceholder="Search family code, name or description..."
                        emptyText="No matching Product Family found."
                        disabled={disabled}
                    />
                </Field>

                <Field
                    label="Thickness Code *"
                    manageLabel="Manage Thickness Codes"
                    onManage={onManage
                        ? () => onManage("thickness-codes")
                        : undefined}
                    helper={thicknessCode
                        ? thicknessCode.isUnspecified
                            ? "Unknown thickness is allowed. Actual thickness may be entered later without changing the Product Code."
                            : thicknessCode.thicknessMm === null
                            ? thicknessCode.description
                            : `Reference thickness: ${thicknessCode.thicknessMm} mm.`
                        : null}
                >
                    <SearchablePicker
                        value={value.productThicknessCodeId}
                        onChange={(selected) =>
                            update({ productThicknessCodeId: selected })}
                        options={thicknessOptions}
                        placeholder="Select Thickness Code"
                        searchPlaceholder="Search thickness code or name..."
                        emptyText="No active Thickness Codes found."
                        disabled={disabled || !value.productCodeFamilyId}
                    />
                </Field>

                <Field
                    label="Product Code Type *"
                    manageLabel="Manage Product Code Types"
                    onManage={onManage
                        ? () => onManage("product-code-types")
                        : undefined}
                    helper="This controls the TTT segment. Business Product Type is selected separately below this identity section."
                >
                    <SearchablePicker
                        value={value.productCodeTypeId}
                        onChange={(selected) =>
                            update({ productCodeTypeId: selected })}
                        options={typeOptions}
                        placeholder="Select Product Code Type"
                        searchPlaceholder="Search type code or name..."
                        emptyText="No active Product Code Types found."
                        disabled={disabled || !value.productCodeFamilyId}
                    />
                </Field>

                <Field
                    label="Size Rule *"
                    manageLabel="Manage Size Rules"
                    onManage={onManage
                        ? () => onManage("size-rules")
                        : undefined}
                    helper={sizeRule?.guidance}
                >
                    <SearchablePicker
                        value={value.sizeRuleId}
                        onChange={(selected) =>
                            update({
                                sizeRuleId: selected,
                                firstValue: "",
                                secondValue: "",
                            })}
                        options={sizeRuleOptions}
                        placeholder="Select Size Rule"
                        searchPlaceholder="Search size rule or example token..."
                        emptyText="No active Size Rules found."
                        disabled={disabled || !value.productCodeFamilyId}
                    />
                </Field>

                <Field
                    label="Product Colour *"
                    manageLabel="Manage Product Colours"
                    onManage={onManage
                        ? () => onManage("product-colours")
                        : undefined}
                    helper={colourMode === "not_applicable"
                        ? "This Product Family uses the Not Applicable colour identity."
                        : null}
                >
                    <SearchablePicker
                        value={value.colourId}
                        onChange={(selected) => update({ colourId: selected })}
                        options={colourOptions}
                        placeholder="Select Product Colour"
                        searchPlaceholder="Search colour code or name..."
                        emptyText="No matching Product Colour found."
                        disabled={disabled || !value.productCodeFamilyId}
                    />
                </Field>

                <Field
                    label="Variant Code *"
                    helper="01 = Standard Product. 02–99 = Special Product Variant."
                >
                    <Input
                        value={value.variantNumber}
                        onChange={(event) => {
                            const raw = event.target.value.replace(/\D/g, "")
                                .slice(0, 2);
                            const numeric = Number(raw || "0");
                            update({
                                variantNumber: raw,
                                variantName: numeric === 1
                                    ? "Standard"
                                    : value.variantName === "Standard"
                                    ? ""
                                    : value.variantName,
                                variantDescription: numeric === 1
                                    ? ""
                                    : value.variantDescription,
                            });
                        }}
                        onBlur={() => {
                            const numeric = Number(value.variantNumber);
                            if (
                                Number.isInteger(numeric) && numeric >= 1 &&
                                numeric <= 99
                            ) {
                                update({
                                    variantNumber: String(numeric).padStart(
                                        2,
                                        "0",
                                    ),
                                });
                            }
                        }}
                        inputMode="numeric"
                        placeholder="01"
                        disabled={disabled}
                        className="h-11 rounded-xl border-[#E5E7EB] bg-[#F7F9FB] font-mono hover:border-[#9E4B4B] focus-visible:border-[#9E4B4B] focus-visible:ring-[#9E4B4B]/20"
                    />
                </Field>
            </div>

            {sizeRule
                ? (
                    <div className="grid gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 sm:grid-cols-2">
                        <Field
                            label={`${sizeRule.firstLabel}${
                                sizeRule.firstUnit
                                    ? ` (${sizeRule.firstUnit})`
                                    : ""
                            }${
                                sizeRule.firstMode === "numeric" &&
                                    !sizeRule.allowFirstUnspecified
                                    ? " *"
                                    : ""
                            }`}
                        >
                            <Input
                                value={value.firstValue}
                                onChange={(event) =>
                                    update({ firstValue: event.target.value })}
                                inputMode="numeric"
                                disabled={disabled ||
                                    sizeRule.firstMode === "not_applicable"}
                                placeholder={sizeRule.firstMode ===
                                        "not_applicable"
                                    ? "Not applicable"
                                    : "Enter value"}
                                className="h-11 rounded-xl border-[#E5E7EB] bg-[#F7F9FB] hover:border-[#9E4B4B] focus-visible:border-[#9E4B4B] focus-visible:ring-[#9E4B4B]/20"
                            />
                        </Field>

                        <Field
                            label={`${sizeRule.secondLabel}${
                                sizeRule.secondUnit
                                    ? ` (${sizeRule.secondUnit})`
                                    : ""
                            }${
                                sizeRule.secondMode === "numeric" &&
                                    !sizeRule.allowSecondUnspecified
                                    ? " *"
                                    : ""
                            }`}
                        >
                            <Input
                                value={value.secondValue}
                                onChange={(event) =>
                                    update({ secondValue: event.target.value })}
                                inputMode="numeric"
                                disabled={disabled ||
                                    sizeRule.secondMode === "not_applicable"}
                                placeholder={sizeRule.secondMode ===
                                        "not_applicable"
                                    ? "Not applicable"
                                    : sizeRule.secondMode ===
                                            "random_or_numeric"
                                    ? "Leave blank for random"
                                    : "Enter value"}
                                className="h-11 rounded-xl border-[#E5E7EB] bg-[#F7F9FB] hover:border-[#9E4B4B] focus-visible:border-[#9E4B4B] focus-visible:ring-[#9E4B4B]/20"
                            />
                        </Field>
                    </div>
                )
                : null}

            {isSpecialVariant
                ? (
                    <div className="grid gap-4 rounded-2xl border border-[#E5E7EB] bg-white p-4 sm:grid-cols-2">
                        <Field label="Variant Name *">
                            <Input
                                value={value.variantName}
                                onChange={(event) =>
                                    update({ variantName: event.target.value })}
                                maxLength={120}
                                placeholder="Describe the special variant"
                                disabled={disabled}
                                className="h-11 rounded-xl border-[#E5E7EB] bg-[#F7F9FB] hover:border-[#9E4B4B] focus-visible:border-[#9E4B4B] focus-visible:ring-[#9E4B4B]/20"
                            />
                        </Field>

                        <Field label="Variant Description *">
                            <textarea
                                value={value.variantDescription}
                                onChange={(event) =>
                                    update({
                                        variantDescription: event.target.value,
                                    })}
                                maxLength={500}
                                rows={3}
                                placeholder="Explain what makes this Product variant different."
                                disabled={disabled}
                                className="w-full rounded-xl border border-[#E5E7EB] bg-[#F7F9FB] px-3 py-2 text-sm outline-none transition hover:border-[#9E4B4B] focus:border-[#9E4B4B] focus:ring-2 focus:ring-[#9E4B4B]/20 disabled:cursor-not-allowed disabled:bg-[#F1F3F5] disabled:text-[#9CA3AF]"
                            />
                        </Field>
                    </div>
                )
                : null}
        </div>
    );
}