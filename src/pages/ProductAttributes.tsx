import { useEffect, useMemo, useState } from "react";
import { Database, Layers3, ListChecks, Pencil, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActiveStatusBadge } from "@/components/common/ActiveStatusBadge";
import { type AppRole, isAdmin, normalizeAppRole } from "@/lib/roles";
import { toast } from "sonner";

type TabKey = "definitions" | "options" | "mapping";
type StatusFilter = "all" | "active" | "inactive";
type DataType = "text" | "long_text" | "number" | "boolean" | "date" | "select" | "multi_select";

type Definition = {
  id: string; code: string; name: string; description: string | null;
  dataType: DataType; unitCode: string | null; placeholder: string | null;
  helpText: string | null; rules: Record<string, unknown>;
  searchable: boolean; filterable: boolean; sortOrder: number; active: boolean;
};
type OptionRow = {
  id: string; attributeId: string; attributeName: string; attributeCode: string;
  code: string; label: string; description: string | null;
  sortOrder: number; isDefault: boolean; active: boolean;
};
type Category = {
  id: string; parentId: string | null; code: string; name: string; active: boolean;
};
type Mapping = {
  id: string; categoryId: string; categoryName: string; categoryCode: string;
  attributeId: string; attributeName: string; attributeCode: string; dataType: DataType;
  section: string; labelOverride: string | null; helpOverride: string | null;
  required: boolean; inherited: boolean; hidden: boolean; sortOrder: number; active: boolean;
};

const DATA_TYPE_LABELS: Record<DataType, string> = {
  text: "Text", long_text: "Long Text", number: "Number", boolean: "Yes / No",
  date: "Date", select: "Select", multi_select: "Multi-select",
};
const TABS = [
  { key: "definitions" as const, title: "Attribute Definitions", icon: SlidersHorizontal },
  { key: "options" as const, title: "Attribute Options", icon: ListChecks },
  { key: "mapping" as const, title: "Category Mapping", icon: Layers3 },
];
const normalizeCode = (value: string) =>
  value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
const boolValue = (value: boolean) => (value ? "yes" : "no");

const ProductAttributes = () => {
  const queryClient = useQueryClient();
  const [role, setRole] = useState<AppRole>("viewer");
  const userIsAdmin = isAdmin(role);
  const [tab, setTab] = useState<TabKey>("definitions");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [search, setSearch] = useState("");

  const [definitionDialog, setDefinitionDialog] = useState(false);
  const [optionDialog, setOptionDialog] = useState(false);
  const [mappingDialog, setMappingDialog] = useState(false);

  const [editingDefinition, setEditingDefinition] = useState<Definition | null>(null);
  const [editingOption, setEditingOption] = useState<OptionRow | null>(null);
  const [editingMapping, setEditingMapping] = useState<Mapping | null>(null);

  const [definitionForm, setDefinitionForm] = useState({
    code: "", name: "", description: "", dataType: "text" as DataType,
    unitCode: "none", placeholder: "", helpText: "", min: "", max: "",
    minLength: "", maxLength: "", pattern: "", searchable: false, filterable: false,
    sortOrder: "0", active: true,
  });
  const [optionForm, setOptionForm] = useState({
    attributeId: "", code: "", label: "", description: "",
    sortOrder: "0", isDefault: false, active: true,
  });
  const [mappingForm, setMappingForm] = useState({
    categoryId: "", attributeId: "", section: "Product Details",
    labelOverride: "", helpOverride: "", required: false,
    inherited: true, hidden: false, sortOrder: "0", active: true,
  });
  const [previewCategoryId, setPreviewCategoryId] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setRole(normalizeAppRole(data.user?.app_metadata?.app_role));
    });
  }, []);

  const { data: units = [] } = useQuery({
    queryKey: ["product-attributes", "uom"],
    queryFn: async () => {
      const { data, error } = await supabase.from("units_of_measure")
        .select("uom_code,uom_name,uom_symbol,is_active")
        .eq("is_deleted", false).order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["product-attributes", "categories"],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase.from("product_categories")
        .select("category_id,parent_category_id,category_code,category_name,is_active")
        .eq("is_deleted", false).order("sort_order").order("category_name");
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.category_id, parentId: r.parent_category_id, code: r.category_code,
        name: r.category_name, active: r.is_active,
      }));
    },
  });

  const { data: definitions = [], isLoading: loadingDefinitions } = useQuery({
    queryKey: ["product-attributes", "definitions"],
    queryFn: async (): Promise<Definition[]> => {
      const { data, error } = await supabase.from("product_attribute_definitions")
        .select("attribute_id,attribute_code,attribute_name,description,data_type,unit_uom_code,placeholder,help_text,validation_rules,is_searchable,is_filterable,sort_order,is_active")
        .eq("is_deleted", false).order("sort_order").order("attribute_name");
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.attribute_id, code: r.attribute_code, name: r.attribute_name,
        description: r.description, dataType: r.data_type as DataType,
        unitCode: r.unit_uom_code, placeholder: r.placeholder, helpText: r.help_text,
        rules: r.validation_rules && typeof r.validation_rules === "object" && !Array.isArray(r.validation_rules)
          ? r.validation_rules as Record<string, unknown> : {},
        searchable: r.is_searchable, filterable: r.is_filterable,
        sortOrder: r.sort_order, active: r.is_active,
      }));
    },
  });

  const { data: options = [], isLoading: loadingOptions } = useQuery({
    queryKey: ["product-attributes", "options"],
    queryFn: async (): Promise<OptionRow[]> => {
      const { data, error } = await supabase.from("product_attribute_options")
        .select("attribute_option_id,attribute_id,option_code,option_label,description,sort_order,is_default,is_active,product_attribute_definitions(attribute_code,attribute_name)")
        .eq("is_deleted", false).order("sort_order").order("option_label");
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.attribute_option_id, attributeId: r.attribute_id,
        attributeName: r.product_attribute_definitions?.attribute_name ?? "-",
        attributeCode: r.product_attribute_definitions?.attribute_code ?? "-",
        code: r.option_code, label: r.option_label, description: r.description,
        sortOrder: r.sort_order, isDefault: r.is_default, active: r.is_active,
      }));
    },
  });

  const { data: mappings = [], isLoading: loadingMappings } = useQuery({
    queryKey: ["product-attributes", "mappings"],
    queryFn: async (): Promise<Mapping[]> => {
      const { data, error } = await supabase.from("product_category_attributes")
        .select("category_attribute_id,category_id,attribute_id,section_name,display_label_override,help_text_override,is_required,is_inherited,is_hidden,sort_order,is_active,product_categories(category_code,category_name),product_attribute_definitions(attribute_code,attribute_name,data_type)")
        .eq("is_deleted", false).order("sort_order");
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.category_attribute_id, categoryId: r.category_id,
        categoryName: r.product_categories?.category_name ?? "-",
        categoryCode: r.product_categories?.category_code ?? "-",
        attributeId: r.attribute_id,
        attributeName: r.product_attribute_definitions?.attribute_name ?? "-",
        attributeCode: r.product_attribute_definitions?.attribute_code ?? "-",
        dataType: (r.product_attribute_definitions?.data_type ?? "text") as DataType,
        section: r.section_name, labelOverride: r.display_label_override,
        helpOverride: r.help_text_override, required: r.is_required,
        inherited: r.is_inherited, hidden: r.is_hidden,
        sortOrder: r.sort_order, active: r.is_active,
      }));
    },
  });

  const { data: preview = [], isFetching: loadingPreview } = useQuery({
    queryKey: ["product-attributes", "preview", previewCategoryId],
    enabled: Boolean(previewCategoryId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_effective_product_category_attributes", {
        p_category_id: previewCategoryId,
      });
      if (error) throw error;
      return data ?? [];
    },
  });

  const categoryPath = useMemo(() => {
    const byId = new Map(categories.map((c) => [c.id, c]));
    const result = new Map<string, string>();
    categories.forEach((category) => {
      const names = [category.name];
      const seen = new Set([category.id]);
      let parentId = category.parentId;
      while (parentId && !seen.has(parentId)) {
        seen.add(parentId);
        const parent = byId.get(parentId);
        if (!parent) break;
        names.unshift(parent.name);
        parentId = parent.parentId;
      }
      result.set(category.id, names.join(" → "));
    });
    return result;
  }, [categories]);

  const selectableDefinitions = definitions.filter((d) =>
    d.dataType === "select" || d.dataType === "multi_select"
  );


  const currentRows = tab === "definitions" ? definitions : tab === "options" ? options : mappings;
  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return currentRows.filter((row) => {
      const active = "active" in row ? row.active : true;
      const matchesStatus = statusFilter === "all" ||
        (statusFilter === "active" && active) ||
        (statusFilter === "inactive" && !active);
      const haystack = JSON.stringify(row).toLowerCase();
      return matchesStatus && (!keyword || haystack.includes(keyword));
    });
  }, [currentRows, search, statusFilter]);

  const summary = {
    total: currentRows.length,
    active: currentRows.filter((r) => "active" in r && r.active).length,
    inactive: currentRows.filter((r) => "active" in r && !r.active).length,
  };
  const loading = tab === "definitions" ? loadingDefinitions : tab === "options" ? loadingOptions : loadingMappings;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["product-attributes"] });
  const requireAdmin = () => {
    if (!userIsAdmin) throw new Error("Only an Admin can manage Product Attributes.");
  };
  const parseOrder = (value: string) => {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) throw new Error("Sort order must be zero or a positive number.");
    return number;
  };

  const saveDefinition = useMutation({
    mutationFn: async () => {
      requireAdmin();
      const code = normalizeCode(definitionForm.code);
      const name = definitionForm.name.trim();
      if (!code) throw new Error("Attribute code is required.");
      if (!name) throw new Error("Attribute name is required.");
      const rules: Record<string, Json | undefined> = {};
      const setNumber = (key: string, value: string) => {
        if (!value.trim()) return;
        const number = Number(value);
        if (!Number.isFinite(number)) throw new Error(`${key} must be a valid number.`);
        rules[key] = number;
      };
      setNumber("min", definitionForm.min);
      setNumber("max", definitionForm.max);
      setNumber("min_length", definitionForm.minLength);
      setNumber("max_length", definitionForm.maxLength);
      if (definitionForm.pattern.trim()) rules.pattern = definitionForm.pattern.trim();

      const payload = {
        attribute_name: name,
        description: definitionForm.description.trim() || null,
        data_type: definitionForm.dataType,
        unit_uom_code: definitionForm.unitCode === "none" ? null : definitionForm.unitCode,
        placeholder: definitionForm.placeholder.trim() || null,
        help_text: definitionForm.helpText.trim() || null,
        validation_rules: rules as Json,
        is_searchable: definitionForm.searchable,
        is_filterable: definitionForm.filterable,
        sort_order: parseOrder(definitionForm.sortOrder),
        is_active: definitionForm.active,
        is_deleted: false,
      };
      const result = editingDefinition
        ? await supabase.from("product_attribute_definitions").update(payload).eq("attribute_id", editingDefinition.id)
        : await supabase.from("product_attribute_definitions").insert({ attribute_code: code, ...payload });
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      toast.success(editingDefinition ? "Attribute updated." : "Attribute created.");
      setDefinitionDialog(false); setEditingDefinition(null); invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const saveOption = useMutation({
    mutationFn: async () => {
      requireAdmin();
      if (!optionForm.attributeId) throw new Error("Attribute is required.");
      const code = normalizeCode(optionForm.code);
      const label = optionForm.label.trim();
      if (!code) throw new Error("Option code is required.");
      if (!label) throw new Error("Option label is required.");
      const payload = {
        option_label: label, description: optionForm.description.trim() || null,
        sort_order: parseOrder(optionForm.sortOrder), is_default: optionForm.isDefault,
        is_active: optionForm.active, is_deleted: false,
      };
      const result = editingOption
        ? await supabase.from("product_attribute_options").update(payload).eq("attribute_option_id", editingOption.id)
        : await supabase.from("product_attribute_options").insert({
            attribute_id: optionForm.attributeId, option_code: code, ...payload,
          });
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      toast.success(editingOption ? "Option updated." : "Option created.");
      setOptionDialog(false); setEditingOption(null); invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const saveMapping = useMutation({
    mutationFn: async () => {
      requireAdmin();
      if (!mappingForm.categoryId) throw new Error("Product Category is required.");
      if (!mappingForm.attributeId) throw new Error("Attribute is required.");
      if (!mappingForm.section.trim()) throw new Error("Section name is required.");
      if (mappingForm.hidden && mappingForm.required) throw new Error("A hidden Attribute cannot be required.");
      const payload = {
        category_id: mappingForm.categoryId, attribute_id: mappingForm.attributeId,
        section_name: mappingForm.section.trim(),
        display_label_override: mappingForm.labelOverride.trim() || null,
        help_text_override: mappingForm.helpOverride.trim() || null,
        is_required: mappingForm.required, is_inherited: mappingForm.inherited,
        is_hidden: mappingForm.hidden, sort_order: parseOrder(mappingForm.sortOrder),
        is_active: mappingForm.active, is_deleted: false,
      };
      const result = editingMapping
        ? await supabase.from("product_category_attributes").update({
            section_name: payload.section_name,
            display_label_override: payload.display_label_override,
            help_text_override: payload.help_text_override,
            is_required: payload.is_required, is_inherited: payload.is_inherited,
            is_hidden: payload.is_hidden, sort_order: payload.sort_order, is_active: payload.is_active,
          }).eq("category_attribute_id", editingMapping.id)
        : await supabase.from("product_category_attributes").insert(payload);
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      toast.success(editingMapping ? "Mapping updated." : "Mapping created.");
      setMappingDialog(false); setEditingMapping(null); invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const openAdd = () => {
    if (!userIsAdmin) return toast.error("Only an Admin can manage Product Attributes.");
    if (tab === "definitions") {
      setEditingDefinition(null);
      setDefinitionForm({ code: "", name: "", description: "", dataType: "text", unitCode: "none",
        placeholder: "", helpText: "", min: "", max: "", minLength: "", maxLength: "",
        pattern: "", searchable: false, filterable: false, sortOrder: "0", active: true });
      setDefinitionDialog(true);
    } else if (tab === "options") {
      setEditingOption(null);
      setOptionForm({ attributeId: "", code: "", label: "", description: "", sortOrder: "0", isDefault: false, active: true });
      setOptionDialog(true);
    } else {
      setEditingMapping(null);
      setMappingForm({ categoryId: "", attributeId: "", section: "Product Details", labelOverride: "",
        helpOverride: "", required: false, inherited: true, hidden: false, sortOrder: "0", active: true });
      setMappingDialog(true);
    }
  };

  const editDefinition = (row: Definition) => {
    setEditingDefinition(row);
    setDefinitionForm({
      code: row.code, name: row.name, description: row.description ?? "", dataType: row.dataType,
      unitCode: row.unitCode ?? "none", placeholder: row.placeholder ?? "", helpText: row.helpText ?? "",
      min: row.rules.min === undefined ? "" : String(row.rules.min),
      max: row.rules.max === undefined ? "" : String(row.rules.max),
      minLength: row.rules.min_length === undefined ? "" : String(row.rules.min_length),
      maxLength: row.rules.max_length === undefined ? "" : String(row.rules.max_length),
      pattern: typeof row.rules.pattern === "string" ? row.rules.pattern : "",
      searchable: row.searchable, filterable: row.filterable, sortOrder: String(row.sortOrder), active: row.active,
    });
    setDefinitionDialog(true);
  };
  const editOption = (row: OptionRow) => {
    setEditingOption(row);
    setOptionForm({ attributeId: row.attributeId, code: row.code, label: row.label,
      description: row.description ?? "", sortOrder: String(row.sortOrder), isDefault: row.isDefault, active: row.active });
    setOptionDialog(true);
  };
  const editMapping = (row: Mapping) => {
    setEditingMapping(row);
    setMappingForm({ categoryId: row.categoryId, attributeId: row.attributeId, section: row.section,
      labelOverride: row.labelOverride ?? "", helpOverride: row.helpOverride ?? "",
      required: row.required, inherited: row.inherited, hidden: row.hidden,
      sortOrder: String(row.sortOrder), active: row.active });
    setMappingDialog(true);
  };

  const BoolSelect = ({ value, onChange, yes = "Yes", no = "No" }: {
    value: boolean; onChange: (value: boolean) => void; yes?: string; no?: string;
  }) => (
    <Select value={boolValue(value)} onValueChange={(v) => onChange(v === "yes")}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent><SelectItem value="yes">{yes}</SelectItem><SelectItem value="no">{no}</SelectItem></SelectContent>
    </Select>
  );

  const Badge = ({ children }: { children: React.ReactNode }) => (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{children}</span>
  );


  const renderRows = () => {
    if (loading) return <div className="p-8 text-center text-slate-500">Loading Product Attributes...</div>;
    if (filteredRows.length === 0) return <div className="p-8 text-center text-slate-500">No records found.</div>;

    if (tab === "definitions") return (
      <div className="divide-y divide-slate-200">
        {(filteredRows as Definition[]).map((row) => (
          <div key={row.id} className="grid gap-4 p-4 hover:bg-slate-50 lg:grid-cols-[1.2fr_1.6fr_1fr_1fr_auto] lg:items-center">
            <div><p className="font-mono text-xs text-slate-500">{row.code}</p><p className="font-bold text-slate-900">{row.name}</p></div>
            <p className="text-sm text-slate-600">{row.description || "-"}</p>
            <div><p className="font-semibold text-slate-800">{DATA_TYPE_LABELS[row.dataType]}</p><p className="text-xs text-slate-500">{row.unitCode ? `Unit: ${row.unitCode}` : "No unit"}</p></div>
            <div className="flex flex-wrap gap-2"><Badge>{row.searchable ? "Searchable" : "Not searchable"}</Badge><Badge>{row.filterable ? "Filterable" : "Not filterable"}</Badge></div>
            <div className="flex items-center justify-between gap-2 lg:justify-end"><ActiveStatusBadge isActive={row.active} />{userIsAdmin && <Button variant="ghost" size="icon" onClick={() => editDefinition(row)}><Pencil className="h-4 w-4" /></Button>}</div>
          </div>
        ))}
      </div>
    );

    if (tab === "options") return (
      <div className="divide-y divide-slate-200">
        {(filteredRows as OptionRow[]).map((row) => (
          <div key={row.id} className="grid gap-4 p-4 hover:bg-slate-50 lg:grid-cols-[1fr_1.4fr_1.4fr_1fr_auto] lg:items-center">
            <div><p className="font-mono text-xs text-slate-500">{row.code}</p><p className="font-bold text-slate-900">{row.label}</p></div>
            <p className="text-sm text-slate-600">{row.description || "-"}</p>
            <div><p className="font-semibold text-slate-900">{row.attributeName}</p><p className="font-mono text-xs text-slate-500">{row.attributeCode}</p></div>
            <div className="flex gap-2"><Badge>{row.isDefault ? "Default" : "Standard"}</Badge><Badge>Order {row.sortOrder}</Badge></div>
            <div className="flex items-center justify-between gap-2 lg:justify-end"><ActiveStatusBadge isActive={row.active} />{userIsAdmin && <Button variant="ghost" size="icon" onClick={() => editOption(row)}><Pencil className="h-4 w-4" /></Button>}</div>
          </div>
        ))}
      </div>
    );

    return (
      <div className="divide-y divide-slate-200">
        {(filteredRows as Mapping[]).map((row) => (
          <div key={row.id} className="grid gap-4 p-4 hover:bg-slate-50 lg:grid-cols-[1.5fr_1.5fr_1fr_1.2fr_auto] lg:items-center">
            <div><p className="font-bold text-slate-900">{categoryPath.get(row.categoryId) ?? row.categoryName}</p><p className="font-mono text-xs text-slate-500">{row.categoryCode}</p></div>
            <div><p className="font-bold text-slate-900">{row.labelOverride || row.attributeName}</p><p className="font-mono text-xs text-slate-500">{row.attributeCode} · {DATA_TYPE_LABELS[row.dataType]}</p></div>
            <div><p className="font-semibold text-slate-800">{row.section}</p><p className="text-xs text-slate-500">Order {row.sortOrder}</p></div>
            <div className="flex flex-wrap gap-2"><Badge>{row.hidden ? "Hidden" : row.required ? "Required" : "Optional"}</Badge><Badge>{row.inherited ? "Inherited" : "This category only"}</Badge></div>
            <div className="flex items-center justify-between gap-2 lg:justify-end"><ActiveStatusBadge isActive={row.active} />{userIsAdmin && <Button variant="ghost" size="icon" onClick={() => editMapping(row)}><Pencil className="h-4 w-4" /></Button>}</div>
          </div>
        ))}
      </div>
    );
  };

  const ActiveIcon = TABS.find((item) => item.key === tab)?.icon ?? SlidersHorizontal;
  const activeTitle = TABS.find((item) => item.key === tab)?.title ?? "Attribute Definitions";

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <header className="flex items-start gap-3">
        <Database className="h-8 w-8 text-red-600" />
        <div><h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Product Attributes</h1><p className="mt-1 text-sm text-slate-500">Configure database-driven Product Form fields, options, and Category inheritance.</p></div>
      </header>

      {!userIsAdmin && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">View-only access. Only Admin can add or edit Product Attribute settings.</div>}

      <div className="grid gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
        <aside className="hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:block">
          <p className="px-3 pb-3 pt-1 text-xs font-bold uppercase tracking-wide text-slate-500">Product Attribute Setup</p>
          {TABS.map(({ key, title, icon: Icon }) => (
            <button key={key} type="button" onClick={() => { setTab(key); setSearch(""); setStatusFilter("active"); }}
              className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold ${tab === key ? "bg-red-50 text-red-700" : "text-slate-600 hover:bg-slate-50"}`}>
              <Icon className="h-5 w-5" />{title}
            </button>
          ))}
        </aside>

        <main className="min-w-0 space-y-6">
          <div className="lg:hidden">
            <Select value={tab} onValueChange={(v) => { setTab(v as TabKey); setSearch(""); setStatusFilter("active"); }}>
              <SelectTrigger className="h-11 rounded-xl bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>{TABS.map((item) => <SelectItem key={item.key} value={item.key}>{item.title}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3"><div className="rounded-xl bg-red-50 p-2 text-red-600"><ActiveIcon className="h-6 w-6" /></div><div><h2 className="text-xl font-bold text-slate-900">{activeTitle}</h2><p className="mt-1 text-sm text-slate-500">{tab === "definitions" ? "Create reusable field definitions." : tab === "options" ? "Manage Select and Multi-select choices." : "Assign fields to Categories and control inheritance."}</p></div></div>
              {userIsAdmin && <Button onClick={openAdd} className="h-11 w-full gap-2 rounded-xl bg-red-600 font-bold hover:bg-red-700 sm:w-auto"><Plus className="h-5 w-5" />Add {tab === "definitions" ? "Attribute" : tab === "options" ? "Option" : "Mapping"}</Button>}
            </div>
          </section>

          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {([["Total", summary.total, "text-slate-900"], ["Active", summary.active, "text-green-600"], ["Inactive", summary.inactive, "text-slate-500"]] as const).map(([label, value, colour]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4"><p className="text-xs text-slate-500 sm:text-sm">{label}</p><p className={`mt-2 text-2xl font-bold sm:text-3xl ${colour}`}>{value}</p></div>
            ))}
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
              <div className="relative"><Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${activeTitle.toLowerCase()}...`} className="pl-10" /></div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="active">Active Only</SelectItem><SelectItem value="inactive">Inactive Only</SelectItem></SelectContent></Select>
            </div>
          </section>

          {tab === "mapping" && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="font-bold text-slate-900">Effective Attribute Preview</h3>
              <p className="mt-1 text-sm text-slate-500">Verify inherited, overridden, hidden, and required fields before building Products.</p>
              <div className="mt-4"><Select value={previewCategoryId} onValueChange={setPreviewCategoryId}><SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger><SelectContent>{categories.filter((c) => c.active).map((c) => <SelectItem key={c.id} value={c.id}>{categoryPath.get(c.id) ?? c.name}</SelectItem>)}</SelectContent></Select></div>
              {previewCategoryId && <div className="mt-4 space-y-2">{loadingPreview ? <p className="text-sm text-slate-500">Loading preview...</p> : preview.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No effective Attributes.</p> : preview.map((r) => <div key={r.attribute_id} className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-slate-900">{r.effective_label}</p><p className="text-xs text-slate-500">{r.section_name} · {DATA_TYPE_LABELS[r.data_type as DataType]}</p></div><div className="flex gap-2"><Badge>{r.is_required ? "Required" : "Optional"}</Badge><Badge>Source: {r.source_category_name}</Badge></div></div>)}</div>}
            </section>
          )}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">{renderRows()}</section>
        </main>
      </div>


      <Dialog open={definitionDialog} onOpenChange={setDefinitionDialog}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-24px)] max-w-3xl overflow-y-auto rounded-2xl p-4 sm:p-6">
          <DialogHeader><DialogTitle>{editingDefinition ? "Edit" : "Add"} Attribute Definition</DialogTitle></DialogHeader>
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Code *</Label><Input value={definitionForm.code} readOnly={Boolean(editingDefinition)} className={editingDefinition ? "cursor-not-allowed bg-slate-100" : ""} onChange={(e) => setDefinitionForm({ ...definitionForm, code: e.target.value })} placeholder="TIMBER_SPECIES" /></div>
              <div className="space-y-2"><Label>Name *</Label><Input value={definitionForm.name} onChange={(e) => setDefinitionForm({ ...definitionForm, name: e.target.value })} placeholder="Timber Species" /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Data Type *</Label><Select value={definitionForm.dataType} onValueChange={(v) => setDefinitionForm({ ...definitionForm, dataType: v as DataType, unitCode: v === "select" || v === "multi_select" ? "none" : definitionForm.unitCode })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(DATA_TYPE_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Unit of Measure</Label><Select value={definitionForm.unitCode} disabled={definitionForm.dataType === "select" || definitionForm.dataType === "multi_select"} onValueChange={(v) => setDefinitionForm({ ...definitionForm, unitCode: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">No Unit</SelectItem>{units.filter((u) => u.is_active || u.uom_code === definitionForm.unitCode).map((u) => <SelectItem key={u.uom_code} value={u.uom_code}>{u.uom_name} ({u.uom_symbol})</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label>Description</Label><textarea rows={3} value={definitionForm.description} onChange={(e) => setDefinitionForm({ ...definitionForm, description: e.target.value })} className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Placeholder</Label><Input value={definitionForm.placeholder} onChange={(e) => setDefinitionForm({ ...definitionForm, placeholder: e.target.value })} /></div>
              <div className="space-y-2"><Label>Help Text</Label><Input value={definitionForm.helpText} onChange={(e) => setDefinitionForm({ ...definitionForm, helpText: e.target.value })} /></div>
            </div>
            {definitionForm.dataType === "number" && <div className="grid gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2"><div className="space-y-2"><Label>Minimum Value</Label><Input type="number" value={definitionForm.min} onChange={(e) => setDefinitionForm({ ...definitionForm, min: e.target.value })} /></div><div className="space-y-2"><Label>Maximum Value</Label><Input type="number" value={definitionForm.max} onChange={(e) => setDefinitionForm({ ...definitionForm, max: e.target.value })} /></div></div>}
            {(definitionForm.dataType === "text" || definitionForm.dataType === "long_text") && <div className="grid gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-3"><div className="space-y-2"><Label>Minimum Length</Label><Input type="number" min="0" value={definitionForm.minLength} onChange={(e) => setDefinitionForm({ ...definitionForm, minLength: e.target.value })} /></div><div className="space-y-2"><Label>Maximum Length</Label><Input type="number" min="0" value={definitionForm.maxLength} onChange={(e) => setDefinitionForm({ ...definitionForm, maxLength: e.target.value })} /></div><div className="space-y-2"><Label>Pattern</Label><Input value={definitionForm.pattern} onChange={(e) => setDefinitionForm({ ...definitionForm, pattern: e.target.value })} placeholder="Optional regex" /></div></div>}
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2"><Label>Searchable</Label><BoolSelect value={definitionForm.searchable} onChange={(v) => setDefinitionForm({ ...definitionForm, searchable: v })} /></div>
              <div className="space-y-2"><Label>Filterable</Label><BoolSelect value={definitionForm.filterable} onChange={(v) => setDefinitionForm({ ...definitionForm, filterable: v })} /></div>
              <div className="space-y-2"><Label>Sort Order</Label><Input type="number" min="0" value={definitionForm.sortOrder} onChange={(e) => setDefinitionForm({ ...definitionForm, sortOrder: e.target.value })} /></div>
              <div className="space-y-2"><Label>Status</Label><BoolSelect value={definitionForm.active} onChange={(v) => setDefinitionForm({ ...definitionForm, active: v })} yes="Active" no="Inactive" /></div>
            </div>
            <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end"><Button variant="outline" onClick={() => setDefinitionDialog(false)} className="h-11 rounded-xl">Cancel</Button><Button onClick={() => saveDefinition.mutate()} disabled={saveDefinition.isPending} className="h-11 rounded-xl bg-red-600 px-6 font-bold hover:bg-red-700">{saveDefinition.isPending ? "Saving..." : editingDefinition ? "Update Attribute" : "Save Attribute"}</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={optionDialog} onOpenChange={setOptionDialog}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-24px)] max-w-xl overflow-y-auto rounded-2xl p-4 sm:p-6">
          <DialogHeader><DialogTitle>{editingOption ? "Edit" : "Add"} Attribute Option</DialogTitle></DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2"><Label>Attribute *</Label><Select value={optionForm.attributeId} disabled={Boolean(editingOption)} onValueChange={(v) => setOptionForm({ ...optionForm, attributeId: v })}><SelectTrigger><SelectValue placeholder="Select Attribute" /></SelectTrigger><SelectContent>{selectableDefinitions.filter((d) => d.active || d.id === optionForm.attributeId).map((d) => <SelectItem key={d.id} value={d.id}>{d.name} — {DATA_TYPE_LABELS[d.dataType]}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Option Code *</Label><Input value={optionForm.code} readOnly={Boolean(editingOption)} className={editingOption ? "cursor-not-allowed bg-slate-100" : ""} onChange={(e) => setOptionForm({ ...optionForm, code: e.target.value })} placeholder="MATTE" /></div><div className="space-y-2"><Label>Option Label *</Label><Input value={optionForm.label} onChange={(e) => setOptionForm({ ...optionForm, label: e.target.value })} placeholder="Matte" /></div></div>
            <div className="space-y-2"><Label>Description</Label><textarea rows={3} value={optionForm.description} onChange={(e) => setOptionForm({ ...optionForm, description: e.target.value })} className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" /></div>
            <div className="grid gap-4 sm:grid-cols-3"><div className="space-y-2"><Label>Sort Order</Label><Input type="number" min="0" value={optionForm.sortOrder} onChange={(e) => setOptionForm({ ...optionForm, sortOrder: e.target.value })} /></div><div className="space-y-2"><Label>Default</Label><BoolSelect value={optionForm.isDefault} onChange={(v) => setOptionForm({ ...optionForm, isDefault: v })} /></div><div className="space-y-2"><Label>Status</Label><BoolSelect value={optionForm.active} onChange={(v) => setOptionForm({ ...optionForm, active: v })} yes="Active" no="Inactive" /></div></div>
            <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end"><Button variant="outline" onClick={() => setOptionDialog(false)} className="h-11 rounded-xl">Cancel</Button><Button onClick={() => saveOption.mutate()} disabled={saveOption.isPending} className="h-11 rounded-xl bg-red-600 px-6 font-bold hover:bg-red-700">{saveOption.isPending ? "Saving..." : editingOption ? "Update Option" : "Save Option"}</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={mappingDialog} onOpenChange={setMappingDialog}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-24px)] max-w-2xl overflow-y-auto rounded-2xl p-4 sm:p-6">
          <DialogHeader><DialogTitle>{editingMapping ? "Edit" : "Add"} Category Attribute Mapping</DialogTitle></DialogHeader>
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Product Category *</Label><Select value={mappingForm.categoryId} disabled={Boolean(editingMapping)} onValueChange={(v) => setMappingForm({ ...mappingForm, categoryId: v })}><SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger><SelectContent>{categories.filter((c) => c.active || c.id === mappingForm.categoryId).map((c) => <SelectItem key={c.id} value={c.id}>{categoryPath.get(c.id) ?? c.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Attribute *</Label><Select value={mappingForm.attributeId} disabled={Boolean(editingMapping)} onValueChange={(v) => setMappingForm({ ...mappingForm, attributeId: v })}><SelectTrigger><SelectValue placeholder="Select Attribute" /></SelectTrigger><SelectContent>{definitions.filter((d) => d.active || d.id === mappingForm.attributeId).map((d) => <SelectItem key={d.id} value={d.id}>{d.name} — {DATA_TYPE_LABELS[d.dataType]}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label>Section Name *</Label><Input value={mappingForm.section} onChange={(e) => setMappingForm({ ...mappingForm, section: e.target.value })} placeholder="Flooring Details" /></div>
            <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Display Label Override</Label><Input value={mappingForm.labelOverride} onChange={(e) => setMappingForm({ ...mappingForm, labelOverride: e.target.value })} /></div><div className="space-y-2"><Label>Sort Order</Label><Input type="number" min="0" value={mappingForm.sortOrder} onChange={(e) => setMappingForm({ ...mappingForm, sortOrder: e.target.value })} /></div></div>
            <div className="space-y-2"><Label>Help Text Override</Label><Input value={mappingForm.helpOverride} onChange={(e) => setMappingForm({ ...mappingForm, helpOverride: e.target.value })} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Required</Label><BoolSelect value={mappingForm.required} onChange={(v) => setMappingForm({ ...mappingForm, required: v, hidden: v ? false : mappingForm.hidden })} yes="Required" no="Optional" /></div>
              <div className="space-y-2"><Label>Inherited by Child Categories</Label><BoolSelect value={mappingForm.inherited} onChange={(v) => setMappingForm({ ...mappingForm, inherited: v })} yes="Yes — inherit" no="No — this category only" /></div>
              <div className="space-y-2"><Label>Hide Attribute</Label><BoolSelect value={mappingForm.hidden} onChange={(v) => setMappingForm({ ...mappingForm, hidden: v, required: v ? false : mappingForm.required })} yes="Hidden" no="Visible" /></div>
              <div className="space-y-2"><Label>Status</Label><BoolSelect value={mappingForm.active} onChange={(v) => setMappingForm({ ...mappingForm, active: v })} yes="Active" no="Inactive" /></div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">To hide an inherited Parent field, create a mapping for the same Attribute on the Child Category and set Hide Attribute = Hidden.</div>
            <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end"><Button variant="outline" onClick={() => setMappingDialog(false)} className="h-11 rounded-xl">Cancel</Button><Button onClick={() => saveMapping.mutate()} disabled={saveMapping.isPending} className="h-11 rounded-xl bg-red-600 px-6 font-bold hover:bg-red-700">{saveMapping.isPending ? "Saving..." : editingMapping ? "Update Mapping" : "Save Mapping"}</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductAttributes;