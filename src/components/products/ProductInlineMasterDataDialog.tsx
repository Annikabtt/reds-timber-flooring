import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    ChevronRight,
    FolderTree,
    ListTree,
    SlidersHorizontal,
} from "lucide-react";
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
import ProductAttributes from "@/pages/ProductAttributes";
import ProductCodeManagement from "@/pages/ProductCodeManagement";
import { toast } from "sonner";

export type ProductMasterTab =
    | "categories"
    | "product-code"
    | "attributes";

type CategoryRow = {
    category_id: string;
    parent_category_id: string | null;
    category_code: string;
    category_name: string;
    description: string | null;
    sort_order: number;
    is_active: boolean;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialTab?: ProductMasterTab;
    selectedCategoryId?: string | null;
    onCategorySelected?: (categoryId: string) => void;
    onDataChanged?: () => void | Promise<void>;
};

const FIELD_CLASS =
    "h-11 rounded-xl border-[#E5E7EB] bg-[#F7F9FB] text-[#111827] hover:border-[#9E4B4B] focus-visible:border-[#9E4B4B] focus-visible:ring-[#9E4B4B]/20";

export const ProductInlineMasterDataDialog = ({
    open,
    onOpenChange,
    initialTab = "categories",
    selectedCategoryId,
    onCategorySelected,
    onDataChanged,
}: Props) => {
    const queryClient = useQueryClient();
    const [tab, setTab] = useState<ProductMasterTab>(initialTab);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [code, setCode] = useState("");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [parentId, setParentId] = useState<string>("none");
    const [sortOrder, setSortOrder] = useState("10");
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        if (open) setTab(initialTab);
    }, [open, initialTab]);

    const { data: categories = [], isLoading } = useQuery({
        queryKey: ["inline-product-master", "categories"],
        enabled: open,
        queryFn: async (): Promise<CategoryRow[]> => {
            const { data, error } = await supabase
                .from("product_categories")
                .select(
                    "category_id,parent_category_id,category_code,category_name,description,sort_order,is_active",
                )
                .eq("is_deleted", false)
                .order("sort_order")
                .order("category_name");

            if (error) throw error;
            return data ?? [];
        },
    });

    const categoryById = useMemo(
        () => new Map(categories.map((row) => [row.category_id, row])),
        [categories],
    );

    const pathForId = (categoryId: string | null) => {
        if (!categoryId) return "";
        const names: string[] = [];
        let current = categoryById.get(categoryId);
        const visited = new Set<string>();

        while (current && !visited.has(current.category_id)) {
            visited.add(current.category_id);
            names.unshift(current.category_name.trim());
            current = current.parent_category_id
                ? categoryById.get(current.parent_category_id)
                : undefined;
        }

        return names.join(" → ");
    };

    const depthFor = (row: CategoryRow) => {
        let depth = 0;
        let current = row.parent_category_id
            ? categoryById.get(row.parent_category_id)
            : undefined;
        const visited = new Set<string>([row.category_id]);

        while (current && !visited.has(current.category_id)) {
            visited.add(current.category_id);
            depth += 1;
            current = current.parent_category_id
                ? categoryById.get(current.parent_category_id)
                : undefined;
        }

        return depth;
    };

    const sortedCategories = useMemo(() => {
        const result: CategoryRow[] = [];
        const children = new Map<string | null, CategoryRow[]>();

        for (const row of categories) {
            const key = row.parent_category_id ?? null;
            const list = children.get(key) ?? [];
            list.push(row);
            children.set(key, list);
        }

        for (const list of children.values()) {
            list.sort(
                (a, b) =>
                    a.sort_order - b.sort_order ||
                    a.category_name.localeCompare(b.category_name),
            );
        }

        const walk = (parent: string | null) => {
            for (const row of children.get(parent) ?? []) {
                result.push(row);
                walk(row.category_id);
            }
        };

        walk(null);

        // Keep malformed/orphaned rows visible instead of hiding them.
        for (const row of categories) {
            if (!result.some((item) => item.category_id === row.category_id)) {
                result.push(row);
            }
        }

        return result;
    }, [categories]);

    const resetForm = () => {
        setEditingId(null);
        setCode("");
        setName("");
        setDescription("");
        setParentId("none");
        setSortOrder("10");
        setIsActive(true);
    };

    const startEdit = (row: CategoryRow) => {
        setEditingId(row.category_id);
        setCode(row.category_code);
        setName(row.category_name);
        setDescription(row.description ?? "");
        setParentId(row.parent_category_id ?? "none");
        setSortOrder(String(row.sort_order ?? 10));
        setIsActive(row.is_active);
    };

    const normalizedParentId = parentId === "none" ? null : parentId;
    const parentPath = pathForId(normalizedParentId);
    const cleanName = name.trim();
    const pathPreview = [parentPath, cleanName].filter(Boolean).join(" → ");

    const saveCategory = useMutation({
        mutationFn: async (): Promise<string> => {
            const normalizedCode = code.trim().toUpperCase();
            const normalizedName = name.trim().replace(/\s+/g, " ");
            const numericSortOrder = Number(sortOrder || 10);

            if (!normalizedCode) throw new Error("Category Code is required.");
            if (!normalizedName) throw new Error("Category Name is required.");
            if (normalizedName.includes("→")) {
                throw new Error(
                    "Enter only the Category Name. The hierarchy path is created from Parent Category automatically.",
                );
            }
            if (!Number.isInteger(numericSortOrder)) {
                throw new Error("Sort Order must be a whole number.");
            }
            if (editingId && normalizedParentId === editingId) {
                throw new Error("A Category cannot be its own parent.");
            }

            const parentNames = parentPath
                .split("→")
                .map((value) => value.trim().toLowerCase())
                .filter(Boolean);

            if (parentNames.includes(normalizedName.toLowerCase())) {
                throw new Error(
                    "Category Name duplicates a name already used in its parent path.",
                );
            }

            const duplicate = categories.find(
                (row) =>
                    row.category_id !== editingId &&
                    (row.parent_category_id ?? null) === normalizedParentId &&
                    row.category_name.trim().toLowerCase() ===
                        normalizedName.toLowerCase(),
            );

            if (duplicate) {
                throw new Error(
                    "A Category with this name already exists under the selected Parent Category.",
                );
            }

            const payload = {
                parent_category_id: normalizedParentId,
                category_name: normalizedName,
                description: description.trim() || null,
                sort_order: numericSortOrder,
                is_active: isActive,
            };

            if (editingId) {
                const { data, error } = await supabase
                    .from("product_categories")
                    .update(payload)
                    .eq("category_id", editingId)
                    .select("category_id")
                    .single();

                if (error) throw error;
                return data.category_id;
            }

            const { data, error } = await supabase
                .from("product_categories")
                .insert({
                    category_code: normalizedCode,
                    ...payload,
                    is_deleted: false,
                })
                .select("category_id")
                .single();

            if (error) throw error;
            return data.category_id;
        },
        onSuccess: async (savedCategoryId) => {
            toast.success(
                editingId
                    ? "Product Category updated."
                    : "Product Category created.",
            );

            await queryClient.invalidateQueries({
                queryKey: ["inline-product-master", "categories"],
            });
            await onDataChanged?.();

            onCategorySelected?.(savedCategoryId);
            resetForm();
        },
        onError: (error) => toast.error(error.message),
    });

    const tabs: Array<{
        value: ProductMasterTab;
        label: string;
        helper: string;
        icon: typeof FolderTree;
    }> = [
        {
            value: "categories",
            label: "Product Categories",
            helper: "Quick add or edit",
            icon: FolderTree,
        },
        {
            value: "product-code",
            label: "Product Code Setup",
            helper: "Advanced configuration",
            icon: ListTree,
        },
        {
            value: "attributes",
            label: "Attributes & Options",
            helper: "Advanced configuration",
            icon: SlidersHorizontal,
        },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex h-[92vh] w-[calc(100vw-20px)] max-w-[1380px] flex-col overflow-hidden rounded-2xl p-0">
                <DialogHeader className="border-b border-[#E5E7EB] px-5 py-4">
                    <DialogTitle>Product Setup</DialogTitle>
                    <p className="text-sm text-slate-500">
                        Add missing setup data without closing the Product form.
                    </p>
                </DialogHeader>

                <div className="grid shrink-0 gap-2 border-b border-[#E5E7EB] bg-[#FCFAFA] p-3 sm:grid-cols-3">
                    {tabs.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Button
                                key={item.value}
                                type="button"
                                variant="outline"
                                onClick={() => setTab(item.value)}
                                className={`h-auto min-h-14 justify-start rounded-xl px-4 py-3 ${
                                    tab === item.value
                                        ? "border-[#9E4B4B] bg-[#FBF1F1] text-[#7F1D1D]"
                                        : "border-[#E5E7EB] bg-white"
                                }`}
                            >
                                <Icon className="mr-3 h-4 w-4 shrink-0" />
                                <span className="min-w-0 text-left">
                                    <span className="block font-semibold">
                                        {item.label}
                                    </span>
                                    <span className="mt-0.5 block text-xs font-normal text-slate-500">
                                        {item.helper}
                                    </span>
                                </span>
                            </Button>
                        );
                    })}
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto bg-white">
                    {tab === "categories" ? (
                        <div className="grid gap-5 p-4 lg:grid-cols-[360px_minmax(0,1fr)]">
                            <section className="h-fit rounded-2xl border border-[#E5E7EB] bg-[#FCFAFA] p-4">
                                <h3 className="font-bold text-slate-900">
                                    {editingId
                                        ? "Edit Product Category"
                                        : "Add Product Category"}
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    Enter only this Category's own name. Do not
                                    type the full hierarchy path.
                                </p>

                                <div className="mt-4 space-y-4">
                                    <div className="space-y-2">
                                        <Label>Parent Category</Label>
                                        <Select
                                            value={parentId}
                                            onValueChange={setParentId}
                                        >
                                            <SelectTrigger
                                                className={FIELD_CLASS}
                                            >
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">
                                                    No Parent
                                                </SelectItem>
                                                {sortedCategories
                                                    .filter(
                                                        (row) =>
                                                            row.category_id !==
                                                            editingId,
                                                    )
                                                    .map((row) => (
                                                        <SelectItem
                                                            key={
                                                                row.category_id
                                                            }
                                                            value={
                                                                row.category_id
                                                            }
                                                        >
                                                            {row.category_code} —{" "}
                                                            {pathForId(
                                                                row.category_id,
                                                            )}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Category Name *</Label>
                                        <Input
                                            className={FIELD_CLASS}
                                            value={name}
                                            onChange={(event) =>
                                                setName(event.target.value)
                                            }
                                            placeholder="Example: Click Lock Flooring"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Category Code *</Label>
                                        <Input
                                            className={FIELD_CLASS}
                                            value={code}
                                            disabled={Boolean(editingId)}
                                            onChange={(event) =>
                                                setCode(event.target.value)
                                            }
                                            placeholder="Example: CLICK_LOCK"
                                        />
                                        <p className="text-xs text-slate-500">
                                            Permanent after creation.
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-[#D8E4FF] bg-[#F4F7FF] p-3">
                                        <p className="text-xs font-bold uppercase tracking-wide text-[#3553A4]">
                                            Path Preview
                                        </p>
                                        <p className="mt-2 text-sm font-semibold text-slate-900">
                                            {pathPreview ||
                                                "Select a Parent and enter a Category Name."}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <textarea
                                            rows={3}
                                            value={description}
                                            onChange={(event) =>
                                                setDescription(
                                                    event.target.value,
                                                )
                                            }
                                            className="w-full rounded-xl border border-[#E5E7EB] bg-[#F7F9FB] px-3 py-2 text-sm outline-none hover:border-[#9E4B4B] focus:border-[#9E4B4B] focus:ring-2 focus:ring-[#9E4B4B]/20"
                                        />
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Sort Order</Label>
                                            <Input
                                                type="number"
                                                className={FIELD_CLASS}
                                                value={sortOrder}
                                                onChange={(event) =>
                                                    setSortOrder(
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Status</Label>
                                            <Select
                                                value={
                                                    isActive
                                                        ? "active"
                                                        : "inactive"
                                                }
                                                onValueChange={(value) =>
                                                    setIsActive(
                                                        value === "active",
                                                    )
                                                }
                                            >
                                                <SelectTrigger
                                                    className={FIELD_CLASS}
                                                >
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
                                    </div>

                                    <div className="flex gap-3">
                                        {editingId ? (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={resetForm}
                                                className="h-11 flex-1 rounded-xl"
                                            >
                                                Cancel Edit
                                            </Button>
                                        ) : null}
                                        <Button
                                            type="button"
                                            onClick={() =>
                                                saveCategory.mutate()
                                            }
                                            disabled={
                                                saveCategory.isPending
                                            }
                                            className="h-11 flex-1 rounded-xl bg-red-600 font-bold hover:bg-red-700"
                                        >
                                            {saveCategory.isPending
                                                ? "Saving..."
                                                : editingId
                                                  ? "Update Category"
                                                  : "Add Category"}
                                        </Button>
                                    </div>
                                </div>
                            </section>

                            <section className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
                                <div className="border-b border-[#E5E7EB] p-4">
                                    <h3 className="font-bold text-slate-900">
                                        Existing Product Categories
                                    </h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Select a Category for the Product or
                                        edit its name, parent and status.
                                    </p>
                                </div>

                                {isLoading ? (
                                    <p className="p-5 text-sm text-slate-500">
                                        Loading Categories...
                                    </p>
                                ) : (
                                    <div className="divide-y divide-[#E5E7EB]">
                                        {sortedCategories.map((row) => {
                                            const depth = depthFor(row);
                                            const selected =
                                                selectedCategoryId ===
                                                row.category_id;

                                            return (
                                                <div
                                                    key={row.category_id}
                                                    className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${
                                                        selected
                                                            ? "bg-[#FBF1F1]"
                                                            : ""
                                                    }`}
                                                >
                                                    <div
                                                        className="min-w-0"
                                                        style={{
                                                            paddingLeft:
                                                                depth * 22,
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {depth > 0 ? (
                                                                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                                                            ) : (
                                                                <FolderTree className="h-4 w-4 shrink-0 text-[#9E4B4B]" />
                                                            )}
                                                            <div className="min-w-0">
                                                                <p className="font-mono text-xs font-bold text-[#9E4B4B]">
                                                                    {
                                                                        row.category_code
                                                                    }
                                                                </p>
                                                                <p className="mt-0.5 break-words font-semibold text-slate-900">
                                                                    {
                                                                        row.category_name
                                                                    }
                                                                </p>
                                                                <p className="mt-1 text-xs text-slate-500">
                                                                    {row.is_active
                                                                        ? "Active"
                                                                        : "Inactive"}
                                                                    {row.parent_category_id
                                                                        ? ` · Parent: ${categoryById.get(row.parent_category_id)?.category_name ?? "Missing"}`
                                                                        : " · Top level"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex shrink-0 gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                startEdit(row)
                                                            }
                                                            className="rounded-xl"
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            disabled={
                                                                !row.is_active
                                                            }
                                                            onClick={() => {
                                                                onCategorySelected?.(
                                                                    row.category_id,
                                                                );
                                                                onOpenChange(
                                                                    false,
                                                                );
                                                            }}
                                                            className="rounded-xl bg-[#9E4B4B] hover:bg-[#7F1D1D]"
                                                        >
                                                            Use Category
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>
                        </div>
                    ) : null}

                    {tab === "product-code" ? (
                        <div className="p-3 sm:p-5">
                            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                                Advanced setup. Use this only when the Product
                                Code Builder is missing a required Family,
                                Thickness Code, Type, Size Rule or factory
                                Colour Code.
                            </div>
                            <ProductCodeManagement />
                        </div>
                    ) : null}

                    {tab === "attributes" ? (
                        <div className="p-3 sm:p-5">
                            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                                Advanced setup. Use this to create Attribute
                                definitions, controlled options and Category
                                mappings.
                            </div>
                            <ProductAttributes />
                        </div>
                    ) : null}
                </div>

                <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[#E5E7EB] bg-white px-4 py-3">
                    <p className="text-xs text-slate-500">
                        Product form values remain open behind this window.
                    </p>
                    <Button
                        type="button"
                        onClick={async () => {
                            await onDataChanged?.();
                            onOpenChange(false);
                        }}
                        className="h-10 rounded-xl bg-[#9E4B4B] px-5 font-bold hover:bg-[#7F1D1D]"
                    >
                        Done
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};