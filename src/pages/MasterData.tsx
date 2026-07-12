import { useEffect, useMemo, useState } from "react";
import {
    Activity,
    ClipboardList,
    GitBranch,
    Layers3,
    Pencil,
    Plus,
    Ruler,
    Search,
    Settings2,
    Tags,
} from "lucide-react";

import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ActiveStatusBadge } from "@/components/common/ActiveStatusBadge";
import {
    type AppRole,
    isAdmin,
    normalizeAppRole,
} from "@/lib/roles";

type MasterSectionKey =
    | "project-area-types"
    | "work-activities"
    | "work-order-types"
    | "work-order-scopes"
    | "units-of-measure"
    | "product-categories";

type StatusFilter = "all" | "active" | "inactive";

type MasterRow = {
    id: string;
    code: string;
    name: string;
    description: string | null;
    sortOrder: number;
    isActive: boolean;
    parentId?: string | null;
    extraLabel?: string;
    extraValue?: string;
    uomSymbol?: string;
    uomCategory?: string;
};

const masterSections = [
    {
        key: "project-area-types" as const,
        title: "Project Area Types",
        description: "Area types used in project area records.",
        icon: Layers3,
    },
    {
        key: "work-activities" as const,
        title: "Work Activities",
        description: "Activities used in daily reports and work time records.",
        icon: Activity,
    },
    {
        key: "work-order-types" as const,
        title: "Work Order Types",
        description: "Broad work classifications used for work orders.",
        icon: ClipboardList,
    },
    {
        key: "work-order-scopes" as const,
        title: "Work Order Scopes",
        description:
            "Specific work scopes linked to a parent work order type.",
        icon: GitBranch,
    },
    {
        key: "units-of-measure" as const,
        title: "Units of Measure",
        description: "Units used for areas, products, purchasing, and materials.",
        icon: Ruler,
    },
    {
        key: "product-categories" as const,
        title: "Product Categories",
        description: "Flexible parent and child categories for products and materials.",
        icon: Tags,
    },
];

const MasterData = () => {
    const queryClient = useQueryClient();

    const [currentAppRole, setCurrentAppRole] =
        useState<AppRole>("viewer");

    const userIsAdmin = isAdmin(currentAppRole);

    useEffect(() => {
        const loadCurrentUserRole = async () => {
            const { data } = await supabase.auth.getUser();

            setCurrentAppRole(
                normalizeAppRole(
                    data.user?.app_metadata?.app_role
                )
            );
        };

        loadCurrentUserRole();
    }, []);

    const [activeSection, setActiveSection] =
        useState<MasterSectionKey>("project-area-types");

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] =
        useState<StatusFilter>("active");

    const [showAddDialog, setShowAddDialog] = useState(false);
    const [editingRow, setEditingRow] =
        useState<MasterRow | null>(null);
    const [editingScopeIsUsed, setEditingScopeIsUsed] =
        useState(false);
    const [isCheckingScopeUsage, setIsCheckingScopeUsage] =
        useState(false);

    const [formCode, setFormCode] = useState("");
    const [formName, setFormName] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [formSortOrder, setFormSortOrder] = useState("0");
    const [formIsActive, setFormIsActive] = useState(true);
    const [formParentWorkOrderTypeId, setFormParentWorkOrderTypeId] =
        useState("");
    const [formParentCategoryId, setFormParentCategoryId] =
        useState("root");

    const [formUomSymbol, setFormUomSymbol] =
        useState("");
    const [formUomCategory, setFormUomCategory] =
        useState("");

    const { data: workOrderTypes = [] } = useQuery({
        queryKey: ["master-data", "work-order-types-for-scope"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("work_order_types")
                .select(`
                    work_order_type_id,
                    work_order_type_code,
                    work_order_type_name,
                    is_active
                `)
                .eq("is_deleted", false)
                .order("is_active", { ascending: false })
                .order("sort_order", { ascending: true })
                .order("work_order_type_name", { ascending: true });

            if (error) throw error;

            return data ?? [];
        },
    });

    const { data: productCategories = [] } = useQuery({
        queryKey: ["master-data", "product-categories-for-parent"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("product_categories")
                .select(`
                    category_id,
                    parent_category_id,
                    category_code,
                    category_name,
                    sort_order,
                    is_active
                `)
                .eq("is_deleted", false)
                .order("is_active", { ascending: false })
                .order("sort_order", { ascending: true })
                .order("category_name", { ascending: true });

            if (error) throw error;

            return data ?? [];
        },
    });

    const supportsStandardAdd =
        activeSection === "project-area-types" ||
        activeSection === "work-activities" ||
        activeSection === "work-order-types" ||
        activeSection === "work-order-scopes" ||
        activeSection === "product-categories" ||
        (activeSection === "units-of-measure" &&
            userIsAdmin);

    const resetMasterForm = () => {
        setEditingRow(null);
        setEditingScopeIsUsed(false);
        setIsCheckingScopeUsage(false);
        setFormCode("");
        setFormName("");
        setFormDescription("");
        setFormSortOrder("0");
        setFormIsActive(true);
        setFormParentWorkOrderTypeId("");
        setFormParentCategoryId("root");
        setFormUomSymbol("");
        setFormUomCategory("");
    };

    const openAddDialog = () => {
        resetMasterForm();
        setShowAddDialog(true);
    };

    const openEditDialog = async (row: MasterRow) => {
        setEditingRow(row);
        setEditingScopeIsUsed(false);
        setFormCode(row.code);
        setFormName(row.name);
        setFormDescription(row.description ?? "");
        setFormSortOrder(String(row.sortOrder));
        setFormIsActive(row.isActive);
        setFormParentWorkOrderTypeId(
            activeSection === "work-order-scopes"
                ? row.parentId ?? ""
                : ""
        );
        setFormParentCategoryId(
            activeSection === "product-categories"
                ? row.parentId ?? "root"
                : "root"
        );
        setFormUomSymbol(
            activeSection === "units-of-measure"
                ? row.uomSymbol ?? ""
                : ""
        );
        setFormUomCategory(
            activeSection === "units-of-measure"
                ? row.uomCategory ?? ""
                : ""
        );
        setShowAddDialog(true);

        if (activeSection !== "work-order-scopes") {
            return;
        }
        setIsCheckingScopeUsage(true);

        const { count, error } = await supabase
            .from("work_orders")
            .select("work_order_id", {
                count: "exact",
                head: true,
            })
            .eq("work_order_scope_id", row.id);

        setIsCheckingScopeUsage(false);

        if (error) {
            toast.error(
                "Unable to check whether this Work Order Scope is already in use."
            );
            return;
        }

        setEditingScopeIsUsed((count ?? 0) > 0);
    };

    const createMasterRecord = useMutation({
        mutationFn: async () => {
            const normalizedCode = formCode
                .trim()
                .toUpperCase()
                .replace(/[^A-Z0-9]+/g, "_")
                .replace(/^_+|_+$/g, "");

            const normalizedName = formName.trim();
            const normalizedDescription =
                formDescription.trim() || null;

            const normalizedUomCode = formCode
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "_")
                .replace(/^_+|_+$/g, "");

            const normalizedUomSymbol =
                formUomSymbol.trim();

            const normalizedUomCategory =
                formUomCategory.trim();

            const numericSortOrder = Number(formSortOrder);

            if (!normalizedCode) {
                throw new Error("Code is required.");
            }

            if (!normalizedName) {
                throw new Error("Name is required.");
            }

            if (activeSection === "units-of-measure") {
                if (!normalizedUomCode) {
                    throw new Error(
                        "Unit of Measure code is required."
                    );
                }

                if (!normalizedUomSymbol) {
                    throw new Error(
                        "Unit of Measure symbol is required."
                    );
                }

                if (!normalizedUomCategory) {
                    throw new Error(
                        "Unit of Measure category is required."
                    );
                }

                if (!userIsAdmin) {
                    throw new Error(
                        "Only an Admin can add or edit Units of Measure."
                    );
                }
            }

            if (
                !Number.isFinite(numericSortOrder) ||
                numericSortOrder < 0
            ) {
                throw new Error(
                    "Sort order must be zero or a positive number."
                );
            }

            if (
                (activeSection === "work-order-types" ||
                    activeSection === "work-order-scopes") &&
                normalizedName.toLowerCase() === "other"
            ) {
                throw new Error(
                    'Work Order Type or Scope cannot use the name "Other".'
                );
            }

            if (editingRow) {
                if (activeSection === "project-area-types") {
                    const { error } = await supabase
                        .from("project_area_types")
                        .update({
                            area_type_name: normalizedName,
                            description: normalizedDescription,
                            sort_order: numericSortOrder,
                            is_active: formIsActive,
                        })
                        .eq("area_type_id", editingRow.id);

                    if (error) throw error;
                    return;
                }

                if (activeSection === "work-activities") {
                    const { error } = await supabase
                        .from("work_activity_types")
                        .update({
                            activity_name: normalizedName,
                            description: normalizedDescription,
                            sort_order: numericSortOrder,
                            is_active: formIsActive,
                        })
                        .eq("activity_type_id", editingRow.id);

                    if (error) throw error;
                    return;
                }

                if (activeSection === "work-order-types") {
                    if (!formIsActive) {
                        const {
                            count,
                            error: scopeCheckError,
                        } = await supabase
                            .from("work_order_scopes")
                            .select("work_order_scope_id", {
                                count: "exact",
                                head: true,
                            })
                            .eq(
                                "work_order_type_id",
                                editingRow.id
                            )
                            .eq("is_deleted", false)
                            .eq("is_active", true);

                        if (scopeCheckError) {
                            throw scopeCheckError;
                        }

                        if ((count ?? 0) > 0) {
                            throw new Error(
                                "This Work Order Type still has active Work Order Scopes. Set those scopes to Inactive before deactivating the type."
                            );
                        }
                    }

                    const { error } = await supabase
                        .from("work_order_types")
                        .update({
                            work_order_type_name: normalizedName,
                            description: normalizedDescription,
                            sort_order: numericSortOrder,
                            is_active: formIsActive,
                        })
                        .eq(
                            "work_order_type_id",
                            editingRow.id
                        );

                    if (error) throw error;
                    return;
                }

                if (activeSection === "work-order-scopes") {
                    if (!formParentWorkOrderTypeId) {
                        throw new Error(
                            "Work Order Type is required."
                        );
                    }

                    if (formIsActive) {
                        const {
                            data: parentType,
                            error: parentTypeError,
                        } = await supabase
                            .from("work_order_types")
                            .select("is_active")
                            .eq(
                                "work_order_type_id",
                                formParentWorkOrderTypeId
                            )
                            .eq("is_deleted", false)
                            .maybeSingle();

                        if (parentTypeError) {
                            throw parentTypeError;
                        }

                        if (!parentType) {
                            throw new Error(
                                "The selected Work Order Type could not be found."
                            );
                        }

                        if (!parentType.is_active) {
                            throw new Error(
                                "This Work Order Scope cannot be Active because its parent Work Order Type is Inactive."
                            );
                        }
                    }

                    const scopeUpdateData = {
                        work_order_scope_name: normalizedName,
                        description: normalizedDescription,
                        sort_order: numericSortOrder,
                        is_active: formIsActive,
                        ...(!editingScopeIsUsed
                            ? {
                                work_order_type_id:
                                    formParentWorkOrderTypeId,
                            }
                            : {}),
                    };

                    const { error } = await supabase
                        .from("work_order_scopes")
                        .update(scopeUpdateData)
                        .eq(
                            "work_order_scope_id",
                            editingRow.id
                        );

                    if (error) throw error;
                    return;
                }

                if (activeSection === "units-of-measure") {
                    if (!userIsAdmin) {
                        throw new Error(
                            "Only an Admin can edit Units of Measure."
                        );
                    }

                    if (!formIsActive) {
                        const uomCode = editingRow.code;

                        const {
                            count: productUsageCount,
                            error: productUsageError,
                        } = await supabase
                            .from("products")
                            .select("product_id", {
                                count: "exact",
                                head: true,
                            })
                            .eq("is_deleted", false)
                            .eq("is_active", true)
                            .or(
                                [
                                    `base_uom_code.eq.${uomCode}`,
                                    `default_purchase_uom_code.eq.${uomCode}`,
                                    `default_request_uom_code.eq.${uomCode}`,
                                    `default_sales_uom_code.eq.${uomCode}`,
                                ].join(",")
                            );

                        if (productUsageError) {
                            throw productUsageError;
                        }

                        if ((productUsageCount ?? 0) > 0) {
                            throw new Error(
                                "This Unit of Measure is still used by active Products. Update those Products before setting this unit to Inactive."
                            );
                        }
                    }

                    const { error } = await supabase
                        .from("units_of_measure")
                        .update({
                            uom_name: normalizedName,
                            uom_symbol: normalizedUomSymbol,
                            uom_category: normalizedUomCategory,
                            description: normalizedDescription,
                            sort_order: numericSortOrder,
                            is_active: formIsActive,
                        })
                        .eq("uom_id", editingRow.id);

                    if (error) throw error;
                    return;
                }

                if (activeSection === "product-categories") {
                    const parentCategoryId =
                        formParentCategoryId === "root"
                            ? null
                            : formParentCategoryId;

                    if (normalizedName.toLowerCase() === "other") {
                        throw new Error(
                            'Product Category cannot use the name "Other".'
                        );
                    }

                    if (parentCategoryId === editingRow.id) {
                        throw new Error(
                            "A Product Category cannot be its own Parent Category."
                        );
                    }

                    const existingChildren =
                        productCategories.filter(
                            (category) =>
                                category.parent_category_id ===
                                editingRow.id
                        );

                    const parentHasChanged =
                        (editingRow.parentId ?? null) !==
                        parentCategoryId;

                    const {
                        count: productCount,
                        error: productUsageError,
                    } = await supabase
                        .from("products")
                        .select("product_id", {
                            count: "exact",
                            head: true,
                        })
                        .eq("category_id", editingRow.id)
                        .eq("is_deleted", false);

                    if (productUsageError) {
                        throw productUsageError;
                    }

                    const {
                        count: activeProductCount,
                        error: activeProductUsageError,
                    } = await supabase
                        .from("products")
                        .select("product_id", {
                            count: "exact",
                            head: true,
                        })
                        .eq("category_id", editingRow.id)
                        .eq("is_deleted", false)
                        .eq("is_active", true);

                    if (activeProductUsageError) {
                        throw activeProductUsageError;
                    }

                    if (
                        parentHasChanged &&
                        existingChildren.length > 0
                    ) {
                        throw new Error(
                            "This Product Category already has child categories. Its Parent Category cannot be changed."
                        );
                    }

                    if (
                        parentHasChanged &&
                        (productCount ?? 0) > 0
                    ) {
                        throw new Error(
                            "This Product Category is already used by Products. Its Parent Category cannot be changed because the existing product history must be preserved."
                        );
                    }

                    if (
                        !formIsActive &&
                        (activeProductCount ?? 0) > 0
                    ) {
                        throw new Error(
                            "This Product Category still has active Products. Set those Products to Inactive or move them to another active category before deactivating this category."
                        );
                    }

                    if (
                        !formIsActive &&
                        existingChildren.some(
                            (category) => category.is_active
                        )
                    ) {
                        throw new Error(
                            "This Product Category still has active child categories. Set those child categories to Inactive first."
                        );
                    }

                    if (parentCategoryId) {
                        const parentCategory =
                            productCategories.find(
                                (category) =>
                                    category.category_id ===
                                    parentCategoryId
                            );

                        if (!parentCategory) {
                            throw new Error(
                                "The selected Parent Category could not be found."
                            );
                        }

                        if (
                            formIsActive &&
                            !parentCategory.is_active
                        ) {
                            throw new Error(
                                "This Product Category cannot be Active because its Parent Category is Inactive."
                            );
                        }

                        let currentCategoryId:
                            | string
                            | null = parentCategoryId;

                        while (currentCategoryId) {
                            if (
                                currentCategoryId ===
                                editingRow.id
                            ) {
                                throw new Error(
                                    "This Parent Category selection would create a circular category hierarchy."
                                );
                            }

                            const currentCategory =
                                productCategories.find(
                                    (category) =>
                                        category.category_id ===
                                        currentCategoryId
                                );

                            currentCategoryId =
                                currentCategory
                                    ?.parent_category_id ?? null;
                        }
                    }

                    const { error } = await supabase
                        .from("product_categories")
                        .update({
                            parent_category_id:
                                parentCategoryId,
                            category_name: normalizedName,
                            description: normalizedDescription,
                            sort_order: numericSortOrder,
                            is_active: formIsActive,
                        })
                        .eq("category_id", editingRow.id);

                    if (error) throw error;
                    return;
                }

                throw new Error(
                    "Editing this master data group is not available yet."
                );
            }

            if (activeSection === "project-area-types") {
                const { error } = await supabase
                    .from("project_area_types")
                    .insert({
                        area_type_code: normalizedCode,
                        area_type_name: normalizedName,
                        description: normalizedDescription,
                        sort_order: numericSortOrder,
                        is_active: formIsActive,
                        is_deleted: false,
                    });

                if (error) throw error;
                return;
            }

            if (activeSection === "work-activities") {
                const { error } = await supabase
                    .from("work_activity_types")
                    .insert({
                        activity_code: normalizedCode,
                        activity_name: normalizedName,
                        description: normalizedDescription,
                        sort_order: numericSortOrder,
                        is_active: formIsActive,
                        is_deleted: false,
                    });

                if (error) throw error;
                return;
            }

            if (activeSection === "work-order-types") {
                const { error } = await supabase
                    .from("work_order_types")
                    .insert({
                        work_order_type_code: normalizedCode,
                        work_order_type_name: normalizedName,
                        description: normalizedDescription,
                        sort_order: numericSortOrder,
                        is_active: formIsActive,
                        is_deleted: false,
                    });

                if (error) throw error;
                return;
            }

            if (activeSection === "work-order-scopes") {
                if (!formParentWorkOrderTypeId) {
                    throw new Error(
                        "Work Order Type is required."
                    );
                }

                const { error } = await supabase
                    .from("work_order_scopes")
                    .insert({
                        work_order_type_id:
                            formParentWorkOrderTypeId,
                        work_order_scope_code: normalizedCode,
                        work_order_scope_name: normalizedName,
                        description: normalizedDescription,
                        sort_order: numericSortOrder,
                        is_active: formIsActive,
                        is_deleted: false,
                    });

                if (error) throw error;
                return;
            }

            if (activeSection === "units-of-measure") {
                if (!userIsAdmin) {
                    throw new Error(
                        "Only an Admin can add Units of Measure."
                    );
                }

                const { error } = await supabase
                    .from("units_of_measure")
                    .insert({
                        uom_code: normalizedUomCode,
                        uom_name: normalizedName,
                        uom_symbol: normalizedUomSymbol,
                        uom_category: normalizedUomCategory,
                        description: normalizedDescription,
                        sort_order: numericSortOrder,
                        is_active: formIsActive,
                        is_deleted: false,
                    });

                if (error) throw error;
                return;
            }

            if (activeSection === "product-categories") {
                const parentCategoryId =
                    formParentCategoryId === "root"
                        ? null
                        : formParentCategoryId;

                if (normalizedName.toLowerCase() === "other") {
                    throw new Error(
                        'Product Category cannot use the name "Other".'
                    );
                }

                if (parentCategoryId) {
                    const {
                        data: parentCategory,
                        error: parentCategoryError,
                    } = await supabase
                        .from("product_categories")
                        .select("is_active")
                        .eq("category_id", parentCategoryId)
                        .eq("is_deleted", false)
                        .maybeSingle();

                    if (parentCategoryError) {
                        throw parentCategoryError;
                    }

                    if (!parentCategory) {
                        throw new Error(
                            "The selected Parent Category could not be found."
                        );
                    }

                    if (!parentCategory.is_active) {
                        throw new Error(
                            "A new Product Category cannot be created under an Inactive Parent Category."
                        );
                    }
                }

                const { error } = await supabase
                    .from("product_categories")
                    .insert({
                        parent_category_id:
                            parentCategoryId,
                        category_code: normalizedCode,
                        category_name: normalizedName,
                        description: normalizedDescription,
                        sort_order: numericSortOrder,
                        is_active: formIsActive,
                        is_deleted: false,
                    });

                if (error) throw error;
                return;
            }

            throw new Error(
                "Adding records for this master data group is not available yet."
            );
        },
        
        onSuccess: () => {
            toast.success(
                editingRow
                    ? `${activeSectionInfo.title} record updated successfully.`
                    : `${activeSectionInfo.title} record created successfully.`
            );

            queryClient.invalidateQueries({
                queryKey: ["master-data", activeSection],
            });

            queryClient.invalidateQueries({
                queryKey: [
                    "master-data",
                    "work-order-types-for-scope",
                ],
            });

            queryClient.invalidateQueries({
                queryKey: [
                    "master-data",
                    "product-categories-for-parent",
                ],
            });

            setShowAddDialog(false);
            resetMasterForm();
        },

        onError: (error) => {
            const message = error.message.toLowerCase();

            if (
                message.includes(
                    "work_order_scopes_code_unique"
                ) ||
                message.includes("duplicate key value")
            ) {
                toast.error(
                    "This code is already in use. Please enter a different code."
                );
                return;
            }

            toast.error(error.message);
        },
    });

    const activeSectionInfo =
        masterSections.find((section) => section.key === activeSection) ??
        masterSections[0];

    const activeSectionSingularTitle =
        activeSection === "product-categories"
            ? "Product Category"
            : activeSection === "units-of-measure"
                ? "Unit of Measure"
                : activeSectionInfo.title.replace(/s$/, "");

    const { data: rows = [], isLoading } = useQuery({
        queryKey: ["master-data", activeSection],
        queryFn: async (): Promise<MasterRow[]> => {
            if (activeSection === "project-area-types") {
                const { data, error } = await supabase
                    .from("project_area_types")
                    .select(`
                        area_type_id,
                        area_type_code,
                        area_type_name,
                        description,
                        sort_order,
                        is_active
                    `)
                    .eq("is_deleted", false)
                    .order("sort_order", { ascending: true })
                    .order("area_type_name", { ascending: true });

                if (error) throw error;

                return (data ?? []).map((item) => ({
                    id: item.area_type_id,
                    code: item.area_type_code,
                    name: item.area_type_name,
                    description: item.description,
                    sortOrder: item.sort_order,
                    isActive: item.is_active,
                }));
            }

            if (activeSection === "work-activities") {
                const { data, error } = await supabase
                    .from("work_activity_types")
                    .select(`
            activity_type_id,
            activity_code,
            activity_name,
            description,
            sort_order,
            is_active
          `)
                    .eq("is_deleted", false)
                    .order("sort_order", { ascending: true })
                    .order("activity_name", { ascending: true });

                if (error) throw error;

                return (data ?? []).map((item) => ({
                    id: item.activity_type_id,
                    code: item.activity_code,
                    name: item.activity_name,
                    description: item.description,
                    sortOrder: item.sort_order,
                    isActive: item.is_active,
                }));
            }

            if (activeSection === "work-order-types") {
                const { data, error } = await supabase
                    .from("work_order_types")
                    .select(`
            work_order_type_id,
            work_order_type_code,
            work_order_type_name,
            description,
            sort_order,
            is_active
          `)
                    .eq("is_deleted", false)
                    .order("sort_order", { ascending: true })
                    .order("work_order_type_name", { ascending: true });

                if (error) throw error;

                return (data ?? []).map((item) => ({
                    id: item.work_order_type_id,
                    code: item.work_order_type_code,
                    name: item.work_order_type_name,
                    description: item.description,
                    sortOrder: item.sort_order,
                    isActive: item.is_active,
                }));
            }

            if (activeSection === "work-order-scopes") {
                const { data, error } = await supabase
                    .from("work_order_scopes")
                    .select(`
            work_order_scope_id,
            work_order_type_id,
            work_order_scope_code,
            work_order_scope_name,
            description,
            sort_order,
            is_active,
            work_order_types (
              work_order_type_name
            )
          `)
                    .eq("is_deleted", false)
                    .order("sort_order", { ascending: true })
                    .order("work_order_scope_name", {
                        ascending: true,
                    });

                if (error) throw error;

                return (data ?? []).map((item) => ({
                    id: item.work_order_scope_id,
                    code: item.work_order_scope_code,
                    name: item.work_order_scope_name,
                    description: item.description,
                    sortOrder: item.sort_order,
                    isActive: item.is_active,
                    parentId: item.work_order_type_id,
                    extraLabel: "Work Order Type",
                    extraValue:
                        item.work_order_types?.work_order_type_name ?? "-",
                }));
            }

            if (activeSection === "units-of-measure") {
                const { data, error } = await supabase
                    .from("units_of_measure")
                    .select(`
            uom_id,
            uom_code,
            uom_name,
            uom_symbol,
            uom_category,
            description,
            sort_order,
            is_active
          `)
                    .eq("is_deleted", false)
                    .order("uom_category", { ascending: true })
                    .order("sort_order", { ascending: true })
                    .order("uom_name", { ascending: true });

                if (error) throw error;

                return (data ?? []).map((item) => ({
                    id: item.uom_id,
                    code: item.uom_code,
                    name: item.uom_name,
                    description: item.description,
                    sortOrder: item.sort_order,
                    isActive: item.is_active,
                    uomSymbol: item.uom_symbol,
                    uomCategory: item.uom_category,
                    extraLabel: "Category / Symbol",
                    extraValue: `${item.uom_category} / ${item.uom_symbol}`,
                }));
            }

            const { data, error } = await supabase
                .from("product_categories")
                .select(`
          category_id,
          parent_category_id,
          category_code,
          category_name,
          description,
          sort_order,
          is_active
        `)
                .eq("is_deleted", false)
                .order("sort_order", { ascending: true })
                .order("category_name", { ascending: true });

            if (error) throw error;

            const categoryNameById = new Map(
                (data ?? []).map((item) => [
                    item.category_id,
                    item.category_name,
                ])
            );

            return (data ?? []).map((item) => ({
                id: item.category_id,
                code: item.category_code,
                name: item.category_name,
                description: item.description,
                sortOrder: item.sort_order,
                isActive: item.is_active,
                parentId: item.parent_category_id,
                extraLabel: "Parent Category",
                extraValue: item.parent_category_id
                    ? categoryNameById.get(item.parent_category_id) ?? "-"
                    : "Root Category",
            }));
        },
    });

    const summary = useMemo(() => {
        const total = rows.length;
        const active = rows.filter((row) => row.isActive).length;
        const inactive = rows.filter((row) => !row.isActive).length;

        return {
            total,
            active,
            inactive,
        };
    }, [rows]);

    const filteredRows = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase();

        return rows.filter((row) => {
            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && row.isActive) ||
                (statusFilter === "inactive" && !row.isActive);

            const matchesSearch =
                !keyword ||
                row.name.toLowerCase().includes(keyword) ||
                row.code.toLowerCase().includes(keyword) ||
                row.description?.toLowerCase().includes(keyword) ||
                row.extraValue?.toLowerCase().includes(keyword);

            return matchesStatus && matchesSearch;
        });
    }, [rows, searchTerm, statusFilter]);
    const displayedRows = useMemo(() => {
        if (statusFilter !== "all") {
            return filteredRows;
        }

        return [...filteredRows].sort((a, b) => {
            if (a.isActive !== b.isActive) {
                return a.isActive ? -1 : 1;
            }

            if (a.sortOrder !== b.sortOrder) {
                return a.sortOrder - b.sortOrder;
            }

            return a.name.localeCompare(b.name);
        });
    }, [filteredRows, statusFilter]);
    const changeSection = (section: MasterSectionKey) => {
        setActiveSection(section);
        setSearchTerm("");
        setStatusFilter("active");
    };

    const ActiveSectionIcon = activeSectionInfo.icon;

    return (
        <div className="space-y-6 p-4 sm:p-6">
            <div>
                <div className="flex items-center gap-3">
                    <Settings2 className="h-8 w-8 text-red-600" />
                    <h1 className="text-3xl font-bold text-slate-900">
                        Master Data
                    </h1>
                </div>

                <p className="mt-1 text-slate-500">
                    Manage database-driven dropdown values used throughout the system.
                </p>
            </div>

            <div className="lg:hidden">
                <Select
                    value={activeSection}
                    onValueChange={(value) =>
                        changeSection(value as MasterSectionKey)
                    }
                >
                    <SelectTrigger className="h-11 rounded-xl bg-white">
                        <SelectValue placeholder="Select master data" />
                    </SelectTrigger>

                    <SelectContent>
                        {masterSections.map((section) => (
                            <SelectItem key={section.key} value={section.key}>
                                {section.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
                <aside className="hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:block">
                    <p className="px-3 pb-3 pt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Master Data Groups
                    </p>

                    <div className="space-y-1">
                        {masterSections.map((section) => {
                            const Icon = section.icon;
                            const isSelected = section.key === activeSection;

                            return (
                                <button
                                    key={section.key}
                                    type="button"
                                    onClick={() => changeSection(section.key)}
                                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${isSelected
                                        ? "bg-red-50 text-red-700"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        }`}
                                >
                                    <Icon className="h-5 w-5 shrink-0" />

                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold">
                                            {section.title}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </aside>

                <main className="min-w-0 space-y-6">
                    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-start gap-3">
                                <div className="rounded-xl bg-red-50 p-2 text-red-600">
                                    <ActiveSectionIcon className="h-6 w-6" />
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">
                                        {activeSectionInfo.title}
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        {activeSectionInfo.description}
                                    </p>
                                </div>
                            </div>

                            {supportsStandardAdd ? (
                                <Button
                                    type="button"
                                    onClick={openAddDialog}
                                    className="h-11 w-full gap-2 rounded-xl bg-red-600 px-5 font-bold text-white hover:bg-red-700 sm:w-auto"
                                >
                                    <Plus className="h-5 w-5" />
                                    Add {activeSectionSingularTitle}
                                </Button>
                            ) : null}
                        </div>
                    </section>

                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
                            <p className="text-xs font-medium text-slate-500 sm:text-sm">
                                Total
                            </p>
                            <p className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                                {summary.total}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
                            <p className="text-xs font-medium text-slate-500 sm:text-sm">
                                Active
                            </p>
                            <p className="mt-2 text-2xl font-bold text-green-600 sm:text-3xl">
                                {summary.active}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
                            <p className="text-xs font-medium text-slate-500 sm:text-sm">
                                Inactive
                            </p>
                            <p className="mt-2 text-2xl font-bold text-slate-500 sm:text-3xl">
                                {summary.inactive}
                            </p>
                        </div>
                    </div>

                    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />

                                <Input
                                    value={searchTerm}
                                    onChange={(event) =>
                                        setSearchTerm(event.target.value)
                                    }
                                    placeholder={`Search ${activeSectionInfo.title.toLowerCase()} by name or code...`}
                                    className="pl-10"
                                />
                            </div>

                            <Select
                                value={statusFilter}
                                onValueChange={(value) =>
                                    setStatusFilter(value as StatusFilter)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active Only</SelectItem>
                                    <SelectItem value="inactive">
                                        Inactive Only
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </section>

                    <section className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
                        <div className="grid grid-cols-12 border-b bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                            <div className="col-span-2">Code</div>
                            <div className="col-span-3">Name</div>
                            <div className="col-span-3">Description</div>
                            <div className="col-span-1 text-center">Order</div>
                            <div className="col-span-2 text-right">Status</div>
                            <div className="col-span-1 text-right">Actions</div>
                        </div>

                        {isLoading ? (
                            <div className="p-8 text-center text-slate-500">
                                Loading master data...
                            </div>
                        ) : displayedRows.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                No records found.
                            </div>
                        ) : (
                            displayedRows.map((row, index) => {
                                const showActiveHeading =
                                    statusFilter === "all" &&
                                    index === 0 &&
                                    row.isActive;

                                const showInactiveHeading =
                                    statusFilter === "all" &&
                                    !row.isActive &&
                                    (index === 0 ||
                                        displayedRows[index - 1].isActive);

                                return (
                                    <div key={row.id}>
                                        {showActiveHeading ? (
                                            <div className="border-b bg-green-50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-green-700">
                                                Active Records
                                            </div>
                                        ) : null}

                                        {showInactiveHeading ? (
                                            <div className="border-y bg-slate-100 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-600">
                                                Inactive Records — retained for
                                                historical reference
                                            </div>
                                        ) : null}

                                        <div className="grid grid-cols-12 border-b px-4 py-4 transition-colors hover:bg-slate-50">
                                            <div className="col-span-2 break-words font-mono text-xs text-slate-500">
                                                {row.code}
                                            </div>

                                            <div className="col-span-3">
                                                <p className="font-semibold text-slate-900">
                                                    {row.name}
                                                </p>

                                                {row.extraValue ? (
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {row.extraLabel}:{" "}
                                                        {row.extraValue}
                                                    </p>
                                                ) : null}
                                            </div>

                                            <div className="col-span-3 pr-4 text-sm text-slate-600">
                                                {row.description || "-"}
                                            </div>

                                            <div className="col-span-1 text-center text-sm font-medium text-slate-700">
                                                {row.sortOrder}
                                            </div>

                                            <div className="col-span-2 flex justify-end">
                                                <ActiveStatusBadge
                                                    isActive={row.isActive}
                                                />
                                            </div>

                                            <div className="col-span-1 flex justify-end">
                                                {activeSection ===
                                                    "project-area-types" ||
                                                    activeSection ===
                                                    "work-activities" ||
                                                    activeSection ===
                                                    "work-order-types" ||
                                                    activeSection ===
                                                    "work-order-scopes" ||
                                                    activeSection ===
                                                    "product-categories" ||
                                                    (activeSection ===
                                                        "units-of-measure" &&
                                                        userIsAdmin) ? (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            openEditDialog(row)
                                                        }
                                                        className="h-9 w-9 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-700"
                                                        aria-label={`Edit ${row.name}`}
                                                        title={`Edit ${row.name}`}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}

                    </section>
                    <section className="space-y-3 lg:hidden">
                        {isLoading ? (
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
                                Loading master data...
                            </div>
                        ) : displayedRows.length === 0 ? (
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
                                No records found.
                            </div>
                        ) : (
                            displayedRows.map((row, index) => {
                                const showActiveHeading =
                                    statusFilter === "all" &&
                                    index === 0 &&
                                    row.isActive;

                                const showInactiveHeading =
                                    statusFilter === "all" &&
                                    !row.isActive &&
                                    (index === 0 ||
                                        displayedRows[index - 1].isActive);

                                return (
                                    <div key={row.id}>
                                        {showActiveHeading ? (
                                            <div className="mb-3 rounded-xl bg-green-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-green-700">
                                                Active Records
                                            </div>
                                        ) : null}

                                        {showInactiveHeading ? (
                                            <div className="mb-3 mt-5 rounded-xl bg-slate-100 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600">
                                                Inactive Records — historical
                                                reference
                                            </div>
                                        ) : null}

                                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <p className="break-words text-base font-bold text-slate-900">
                                                        {row.name}
                                                    </p>

                                                    <p className="mt-1 break-all font-mono text-xs text-slate-500">
                                                        {row.code}
                                                    </p>
                                                </div>

                                                <div className="flex shrink-0 items-center gap-2">
                                                    <ActiveStatusBadge
                                                        isActive={row.isActive}
                                                    />

                                                    {activeSection ===
                                                        "project-area-types" ||
                                                        activeSection ===
                                                        "work-activities" ||
                                                        activeSection ===
                                                        "work-order-types" ||
                                                        activeSection ===
                                                        "work-order-scopes" ||
                                                        activeSection ===
                                                        "product-categories" ||
                                                        (activeSection ===
                                                            "units-of-measure" &&
                                                            userIsAdmin) ? (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() =>
                                                                openEditDialog(
                                                                    row
                                                                )
                                                            }
                                                            className="h-9 w-9 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-700"
                                                            aria-label={`Edit ${row.name}`}
                                                            title={`Edit ${row.name}`}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    ) : null}
                                                </div>
                                            </div>

                                            <div className="mt-4 space-y-3 text-sm">
                                                <div className="rounded-xl bg-slate-50 p-3">
                                                    <p className="text-xs font-medium text-slate-500">
                                                        Description
                                                    </p>

                                                    <p className="mt-1 text-slate-700">
                                                        {row.description || "-"}
                                                    </p>
                                                </div>

                                                {row.extraValue ? (
                                                    <div className="rounded-xl bg-slate-50 p-3">
                                                        <p className="text-xs font-medium text-slate-500">
                                                            {row.extraLabel}
                                                        </p>

                                                        <p className="mt-1 font-semibold text-slate-900">
                                                            {row.extraValue}
                                                        </p>
                                                    </div>
                                                ) : null}

                                                <div className="rounded-xl bg-slate-50 p-3">
                                                    <p className="text-xs font-medium text-slate-500">
                                                        Sort Order
                                                    </p>

                                                    <p className="mt-1 font-semibold text-slate-900">
                                                        {row.sortOrder}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </section>

                </main>
            </div>

            <Dialog
                open={showAddDialog}
                onOpenChange={(open) => {
                    setShowAddDialog(open);

                    if (!open) {
                        resetMasterForm();
                    }
                }}
            >
                <DialogContent className="max-h-[90vh] w-[calc(100vw-24px)] max-w-xl overflow-y-auto rounded-2xl p-4 sm:p-6">
                    <DialogHeader>
                        <DialogTitle>
                            {editingRow ? "Edit" : "Add"}{" "}
                            {activeSectionSingularTitle}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-5">
                        {activeSection === "work-order-scopes" ? (
                            <div className="space-y-2">
                                <Label>Work Order Type *</Label>

                                <Select
                                    value={formParentWorkOrderTypeId}
                                    onValueChange={
                                        setFormParentWorkOrderTypeId
                                    }
                                    disabled={
                                        Boolean(editingRow) &&
                                        (editingScopeIsUsed ||
                                            isCheckingScopeUsage)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select parent work order type" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {workOrderTypes
                                            .filter(
                                                (workOrderType) =>
                                                    workOrderType.is_active ||
                                                    workOrderType.work_order_type_id ===
                                                    formParentWorkOrderTypeId
                                            )
                                            .map((workOrderType) => (
                                                <SelectItem
                                                    key={
                                                        workOrderType.work_order_type_id
                                                    }
                                                    value={
                                                        workOrderType.work_order_type_id
                                                    }
                                                >
                                                    {
                                                        workOrderType.work_order_type_name
                                                    }
                                                    {" — "}
                                                    {
                                                        workOrderType.work_order_type_code
                                                    }
                                                    {!workOrderType.is_active
                                                        ? " — Inactive"
                                                        : ""}
                                                </SelectItem>
                                            )
                                            )}
                                    </SelectContent>
                                </Select>

                                <p className="text-xs text-slate-500">
                                    {isCheckingScopeUsage
                                        ? "Checking whether this scope has been used..."
                                        : editingRow && editingScopeIsUsed
                                            ? "This scope has already been used in Work Orders. Its parent Work Order Type is locked to preserve history."
                                            : "This scope will be available only when this Work Order Type is selected."}
                                </p>
                            </div>
                        ) : null}

                        {activeSection === "product-categories" ? (
                            <div className="space-y-2">
                                <Label>Parent Category</Label>

                                <Select
                                    value={formParentCategoryId}
                                    onValueChange={
                                        setFormParentCategoryId
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select parent category" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        <SelectItem value="root">
                                            Root Category
                                        </SelectItem>

                                        {productCategories
                                            .filter(
                                                (category) =>
                                                    category.is_active &&
                                                    category.category_id !==
                                                    editingRow?.id
                                            )
                                            .map((category) => (
                                                <SelectItem
                                                    key={
                                                        category.category_id
                                                    }
                                                    value={
                                                        category.category_id
                                                    }
                                                >
                                                    {
                                                        category.category_name
                                                    }
                                                    {" — "}
                                                    {
                                                        category.category_code
                                                    }
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>

                                <p className="text-xs text-slate-500">
                                    Select Root Category for a top-level
                                    category, or choose an existing parent.
                                </p>
                            </div>
                        ) : null}

                        <div className="space-y-2">
                            <Label>Code *</Label>

                            <Input
                                value={formCode}
                                onChange={(event) =>
                                    setFormCode(event.target.value)
                                }
                                placeholder="Example: FLOOR_PREPARATION"
                                readOnly={Boolean(editingRow)}
                                className={
                                    editingRow
                                        ? "cursor-not-allowed bg-slate-100 text-slate-600"
                                        : undefined
                                }
                            />
                            <p className="text-xs text-slate-500">
                                {editingRow
                                    ? "Code is a permanent system reference and cannot be changed after creation."
                                    : "Code will be saved in uppercase and used as a permanent system reference."}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Name *</Label>
                            <Input
                                value={formName}
                                onChange={(event) =>
                                    setFormName(event.target.value)
                                }
                                placeholder="Enter display name"
                            />
                            <p className="text-xs text-slate-500">
                                Users will see and search by this name.
                            </p>
                        </div>

                        {activeSection === "units-of-measure" ? (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Symbol *</Label>

                                    <Input
                                        value={formUomSymbol}
                                        onChange={(event) =>
                                            setFormUomSymbol(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Example: m², kg, box"
                                    />

                                    <p className="text-xs text-slate-500">
                                        Short symbol displayed beside quantities.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label>UOM Category *</Label>

                                    <Select
                                        value={formUomCategory}
                                        onValueChange={
                                            setFormUomCategory
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select UOM category" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            <SelectItem value="Area">
                                                Area
                                            </SelectItem>
                                            <SelectItem value="Length">
                                                Length
                                            </SelectItem>
                                            <SelectItem value="Packaging">
                                                Packaging
                                            </SelectItem>
                                            <SelectItem value="Quantity">
                                                Quantity
                                            </SelectItem>
                                            <SelectItem value="Service">
                                                Service
                                            </SelectItem>
                                            <SelectItem value="Time">
                                                Time
                                            </SelectItem>
                                            <SelectItem value="Volume">
                                                Volume
                                            </SelectItem>
                                            <SelectItem value="Weight">
                                                Weight
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <p className="text-xs text-slate-500">
                                        Used to group units consistently.
                                    </p>
                                </div>
                            </div>
                        ) : null}

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <textarea
                                value={formDescription}
                                onChange={(event) =>
                                    setFormDescription(event.target.value)
                                }
                                placeholder="Enter a short description"
                                rows={4}
                                className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Sort Order</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={formSortOrder}
                                    onChange={(event) =>
                                        setFormSortOrder(event.target.value)
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={
                                        formIsActive
                                            ? "active"
                                            : "inactive"
                                    }
                                    onValueChange={(value) =>
                                        setFormIsActive(value === "active")
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
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
                        </div>

                        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setShowAddDialog(false);
                                    resetMasterForm();
                                }}
                                className="h-11 rounded-xl"
                            >
                                Cancel
                            </Button>

                            <Button
                                type="button"
                                onClick={() =>
                                    createMasterRecord.mutate()
                                }
                                disabled={
                                    createMasterRecord.isPending ||
                                    isCheckingScopeUsage
                                }
                                className="h-11 rounded-xl bg-red-600 px-6 font-bold text-white hover:bg-red-700"
                            >
                                {isCheckingScopeUsage
                                    ? "Checking history..."
                                    : createMasterRecord.isPending
                                        ? editingRow
                                            ? "Updating..."
                                            : "Saving..."
                                        : editingRow
                                            ? "Update"
                                            : "Save"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
};

export default MasterData;