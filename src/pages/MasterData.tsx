import { useMemo, useState } from "react";
import {
    Activity,
    ClipboardList,
    Layers3,
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

type MasterSectionKey =
    | "project-area-types"
    | "work-activities"
    | "work-order-types"
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
    extraLabel?: string;
    extraValue?: string;
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
        description: "Standard classifications used for work orders.",
        icon: ClipboardList,
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

    const [activeSection, setActiveSection] =
        useState<MasterSectionKey>("project-area-types");

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] =
        useState<StatusFilter>("all");

    const [showAddDialog, setShowAddDialog] = useState(false);
    const [formCode, setFormCode] = useState("");
    const [formName, setFormName] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [formSortOrder, setFormSortOrder] = useState("0");
    const [formIsActive, setFormIsActive] = useState(true);

    const supportsStandardAdd =
        activeSection === "project-area-types" ||
        activeSection === "work-activities" ||
        activeSection === "work-order-types";

    const resetAddForm = () => {
        setFormCode("");
        setFormName("");
        setFormDescription("");
        setFormSortOrder("0");
        setFormIsActive(true);
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

            const numericSortOrder = Number(formSortOrder);

            if (!normalizedCode) {
                throw new Error("Code is required.");
            }

            if (!normalizedName) {
                throw new Error("Name is required.");
            }

            if (
                !Number.isFinite(numericSortOrder) ||
                numericSortOrder < 0
            ) {
                throw new Error(
                    "Sort order must be zero or a positive number."
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

            throw new Error(
                "Adding records for this master data group is not available yet."
            );
        },

        onSuccess: () => {
            toast.success(
                `${activeSectionInfo.title} record created successfully.`
            );

            queryClient.invalidateQueries({
                queryKey: ["master-data", activeSection],
            });

            setShowAddDialog(false);
            resetAddForm();
        },

        onError: (error) => {
            toast.error(error.message);
        },
    });

    const activeSectionInfo =
        masterSections.find((section) => section.key === activeSection) ??
        masterSections[0];

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

    const changeSection = (section: MasterSectionKey) => {
        setActiveSection(section);
        setSearchTerm("");
        setStatusFilter("all");
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
                                    onClick={() => {
                                        resetAddForm();
                                        setShowAddDialog(true);
                                    }}
                                    className="h-11 w-full gap-2 rounded-xl bg-red-600 px-5 font-bold text-white hover:bg-red-700 sm:w-auto"
                                >
                                    <Plus className="h-5 w-5" />
                                    Add {activeSectionInfo.title.replace(/s$/, "")}
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
                            <div className="col-span-4">Description</div>
                            <div className="col-span-1 text-center">Order</div>
                            <div className="col-span-2 text-right">Status</div>
                        </div>

                        {isLoading ? (
                            <div className="p-8 text-center text-slate-500">
                                Loading master data...
                            </div>
                        ) : filteredRows.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                No records found.
                            </div>
                        ) : (
                            filteredRows.map((row) => (
                                <div
                                    key={row.id}
                                    className="grid grid-cols-12 border-b px-4 py-4 transition-colors last:border-b-0 hover:bg-slate-50"
                                >
                                    <div className="col-span-2 break-words font-mono text-xs text-slate-500">
                                        {row.code}
                                    </div>

                                    <div className="col-span-3">
                                        <p className="font-semibold text-slate-900">
                                            {row.name}
                                        </p>

                                        {row.extraValue ? (
                                            <p className="mt-1 text-xs text-slate-500">
                                                {row.extraLabel}: {row.extraValue}
                                            </p>
                                        ) : null}
                                    </div>

                                    <div className="col-span-4 pr-4 text-sm text-slate-600">
                                        {row.description || "-"}
                                    </div>

                                    <div className="col-span-1 text-center text-sm font-medium text-slate-700">
                                        {row.sortOrder}
                                    </div>

                                    <div className="col-span-2 flex justify-end">
                                        <ActiveStatusBadge isActive={row.isActive} />
                                    </div>
                                </div>
                            ))
                        )}
                    </section>

                    <section className="space-y-3 lg:hidden">
                        {isLoading ? (
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
                                Loading master data...
                            </div>
                        ) : filteredRows.length === 0 ? (
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
                                No records found.
                            </div>
                        ) : (
                            filteredRows.map((row) => (
                                <div
                                    key={row.id}
                                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="break-words text-base font-bold text-slate-900">
                                                {row.name}
                                            </p>

                                            <p className="mt-1 break-all font-mono text-xs text-slate-500">
                                                {row.code}
                                            </p>
                                        </div>

                                        <ActiveStatusBadge
                                            isActive={row.isActive}
                                            className="shrink-0"
                                        />
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
                            ))
                        )}
                    </section>
                </main>
            </div>

            <Dialog
                open={showAddDialog}
                onOpenChange={(open) => {
                    setShowAddDialog(open);

                    if (!open) {
                        resetAddForm();
                    }
                }}
            >
                <DialogContent className="max-h-[90vh] w-[calc(100vw-24px)] max-w-xl overflow-y-auto rounded-2xl p-4 sm:p-6">
                    <DialogHeader>
                        <DialogTitle>
                            Add {activeSectionInfo.title.replace(/s$/, "")}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-5">
                        <div className="space-y-2">
                            <Label>Code *</Label>
                            <Input
                                value={formCode}
                                onChange={(event) =>
                                    setFormCode(event.target.value)
                                }
                                placeholder="Example: FLOOR_PREPARATION"
                            />
                            <p className="text-xs text-slate-500">
                                Code will be saved in uppercase and used as a
                                stable system reference.
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
                                    resetAddForm();
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
                                    createMasterRecord.isPending
                                }
                                className="h-11 rounded-xl bg-red-600 px-6 font-bold text-white hover:bg-red-700"
                            >
                                {createMasterRecord.isPending
                                    ? "Saving..."
                                    : "Save"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MasterData;