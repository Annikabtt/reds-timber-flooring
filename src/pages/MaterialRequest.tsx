import { useMemo, useState } from "react";
import { ClipboardList, History, Loader2, PackagePlus, RefreshCw, Search, UserRound, XCircle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type MR = Database["public"]["Tables"]["material_requirements"]["Row"];
type MRLine = Database["public"]["Tables"]["material_requirement_lines"]["Row"];
type Adjustment = Database["public"]["Tables"]["material_requirement_line_adjustments"]["Row"];
type Product = Database["public"]["Tables"]["products"]["Row"];
type Area = Database["public"]["Tables"]["project_areas"]["Row"];
type Project = Database["public"]["Tables"]["projects"]["Row"];
type Site = Database["public"]["Tables"]["project_sites"]["Row"];
type Quotation = Database["public"]["Tables"]["quotations"]["Row"];
type QuotationRevision = Database["public"]["Tables"]["quotation_revisions"]["Row"];
type Uom = Database["public"]["Tables"]["units_of_measure"]["Row"];
type Employee = Database["public"]["Tables"]["employees"]["Row"];
type StockLocation = Database["public"]["Tables"]["stock_locations"]["Row"];
type Supplier = Database["public"]["Tables"]["suppliers"]["Row"];
type PermissionMap = Record<string, boolean>;

const PERMISSIONS = ["material_requirements.view", "material_requirements.update", "material_requirements.create"] as const;
const statuses = ["Draft", "UnderReview", "Approved", "InPreparation", "PartiallyReady", "Ready", "Completed", "Cancelled"];
const transitionMap: Record<string, { action: string; label: string }[]> = {
  Draft: [{ action: "SubmitForReview", label: "Submit for Review" }, { action: "Cancel", label: "Cancel" }],
  UnderReview: [{ action: "ReturnToDraft", label: "Return to Draft" }, { action: "Approve", label: "Approve" }, { action: "Cancel", label: "Cancel" }],
  Approved: [{ action: "StartPreparation", label: "Start Preparation" }, { action: "Cancel", label: "Cancel" }],
  InPreparation: [{ action: "MarkReady", label: "Mark Ready" }, { action: "Cancel", label: "Cancel" }],
  PartiallyReady: [{ action: "MarkReady", label: "Mark Ready" }, { action: "Cancel", label: "Cancel" }],
  Ready: [{ action: "Complete", label: "Complete" }, { action: "Cancel", label: "Cancel" }],
};
const statusClass = (status: string) => ({ Draft: "bg-slate-100 text-slate-700", UnderReview: "bg-amber-100 text-amber-800", Approved: "bg-blue-100 text-blue-700", InPreparation: "bg-violet-100 text-violet-700", PartiallyReady: "bg-teal-100 text-teal-700", Ready: "bg-emerald-100 text-emerald-700", Completed: "bg-green-100 text-green-800", Cancelled: "bg-zinc-200 text-zinc-700" }[status] ?? "bg-slate-100 text-slate-700");
const n = (v: string) => Number.isFinite(Number(v)) ? Number(v) : 0;
const textValue = (value: string | number | boolean | null | undefined) => value === null || value === undefined || value === "" ? "-" : String(value);
const formatDateTime = (value: string | null | undefined) => value ? new Date(value).toLocaleString("en-AU") : "-";
const escapeHtml = (value: string | number | boolean | null | undefined) => textValue(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char] ?? char));
const csvCell = (value: string | number | boolean | null | undefined) => {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
};
const safeFilePart = (value: string) => value.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "") || "material-requirement";
const downloadFile = (content: string, fileName: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

function MaterialRequest() {
  const qc = useQueryClient();
  const [search, setSearch] = useState(""); const [status, setStatus] = useState("all"); const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ type: string; line?: MRLine } | null>(null); const [reason, setReason] = useState("");
  const [quantity, setQuantity] = useState("0"); const [waste, setWaste] = useState("0"); const [productId, setProductId] = useState("");
  const [description, setDescription] = useState(""); const [uomCode, setUomCode] = useState(""); const [baseUomCode, setBaseUomCode] = useState("");
  const [areaId, setAreaId] = useState(""); const [supplierId, setSupplierId] = useState("");
  const [headerDate, setHeaderDate] = useState(""); const [headerSite, setHeaderSite] = useState(""); const [headerDestination, setHeaderDestination] = useState("Site"); const [headerLocation, setHeaderLocation] = useState(""); const [headerNotes, setHeaderNotes] = useState("");
  const [responsibleId, setResponsibleId] = useState("");
  const [exporting, setExporting] = useState<"print" | "csv" | null>(null);

  const permissionQuery = useQuery({ queryKey: ["mr-permissions"], queryFn: async () => Object.fromEntries(await Promise.all(PERMISSIONS.map(async code => { const { data, error } = await supabase.rpc("has_permission", { p_permission_code: code }); if (error) throw error; return [code, Boolean(data)] as const; }))) as PermissionMap });
  const can = (code: string) => permissionQuery.data?.[code] === true;

  const lookups = useQuery({
    queryKey: ["mr-lookups"], queryFn: async () => {
      const [products, areas, projects, sites, uoms, employees, locations, suppliers] = await Promise.all([
        supabase.from("products").select("*").eq("is_deleted", false).eq("is_active", true).order("product_name"),
        supabase.from("project_areas").select("*").eq("is_deleted", false).eq("is_active", true).order("area_name"),
        supabase.from("projects").select("*").eq("is_deleted", false).eq("is_active", true).order("project_name"),
        supabase.from("project_sites").select("*").eq("is_deleted", false).eq("is_active", true).order("site_name"),
        supabase.from("units_of_measure").select("*").eq("is_deleted", false).eq("is_active", true).order("sort_order"),
        supabase.from("employees").select("*").eq("is_deleted", false).eq("is_active", true).not("auth_user_id", "is", null).order("first_name"),
        supabase.from("stock_locations").select("*").eq("is_deleted", false).eq("is_active", true).order("location_name"),
        supabase.from("suppliers").select("*").eq("is_deleted", false).eq("is_active", true).order("supplier_name"),
      ]); for (const r of [products, areas, projects, sites, uoms, employees, locations, suppliers]) if (r.error) throw r.error;
      return { products: products.data ?? [], areas: areas.data ?? [], projects: projects.data ?? [], sites: sites.data ?? [], uoms: uoms.data ?? [], employees: employees.data ?? [], locations: locations.data ?? [], suppliers: suppliers.data ?? [] };
    }
  });

  const listQuery = useQuery({
    queryKey: ["material-requirements", search, status], enabled: can("material_requirements.view"), queryFn: async () => {
      let q = supabase.from("material_requirements").select("*").eq("is_deleted", false).order("created_at", { ascending: false });
      if (status !== "all") q = q.eq("requirement_status", status); if (search.trim()) q = q.ilike("material_requirement_no", `%${search.trim()}%`);
      const { data, error } = await q; if (error) throw error; return data ?? [];
    }
  });

  const detailQuery = useQuery({
    queryKey: ["material-requirement-detail", selectedId], enabled: Boolean(selectedId), queryFn: async () => {
      if (!selectedId) throw new Error("Material Requirement not selected.");
      const [header, lines] = await Promise.all([supabase.from("material_requirements").select("*").eq("material_requirement_id", selectedId).single(), supabase.from("material_requirement_lines").select("*").eq("material_requirement_id", selectedId).eq("is_deleted", false).order("line_no")]);
      if (header.error) throw header.error; if (lines.error) throw lines.error;
      const ids = (lines.data ?? []).map(x => x.material_requirement_line_id); let adjustments: Adjustment[] = [];
      if (ids.length) { const r = await supabase.from("material_requirement_line_adjustments").select("*").in("material_requirement_line_id", ids).order("created_at", { ascending: false }); if (r.error) throw r.error; adjustments = r.data ?? []; }
      let quotation: Quotation | null = null; let acceptedRevision: QuotationRevision | null = null;
      if (header.data.quotation_id) { const q = await supabase.from("quotations").select("*").eq("quotation_id", header.data.quotation_id).maybeSingle(); if (!q.error) quotation = q.data; }
      if (header.data.accepted_revision_id) { const r = await supabase.from("quotation_revisions").select("*").eq("revision_id", header.data.accepted_revision_id).maybeSingle(); if (!r.error) acceptedRevision = r.data; }
      return { header: header.data, lines: lines.data ?? [], adjustments, quotation, acceptedRevision };
    }
  });

  const selected = detailQuery.data?.header;
  const detailStatus = selected?.requirement_status ?? "";
  const isTerminalDetail = ["Completed", "Cancelled"].includes(detailStatus);
  const detailProject = lookups.data?.projects.find((x: Project) => x.project_id === selected?.project_id);
  const detailSite = lookups.data?.sites.find(x => x.site_id === selected?.site_id);
  const activeLines = useMemo(() => (detailQuery.data?.lines ?? []).filter(line => line.is_active && !line.is_deleted), [detailQuery.data?.lines]);
  const relatedAreas = useMemo(() => {
    const areaIds = new Set(activeLines.filter(line => line.project_area_id).map(line => line.project_area_id!));
    return Array.from(areaIds).map(id => lookups.data?.areas.find(area => area.area_id === id)).filter((area): area is Area => Boolean(area));
  }, [activeLines, lookups.data?.areas]);
  const detailInstruction = detailStatus === "Completed"
    ? "Review the completed material requirement and its adjustment history."
    : detailStatus === "Cancelled"
      ? "Review the cancelled material requirement and its cancellation details."
      : "Review and manage the operational material requirements.";
  const siteAddress = [detailSite?.address_line_1, detailSite?.address_line_2].filter(Boolean).join(", ");
  const siteDisplay = detailSite ? `${detailSite.site_code} — ${detailSite.site_name}${siteAddress ? `, ${siteAddress}` : ""}` : "Not assigned";
  const projectDisplay = detailProject ? `${detailProject.project_no} — ${detailProject.project_name}` : "Not assigned";
  const stockLocationDisplay = selected?.delivery_stock_location_id
    ? (() => { const location = lookups.data?.locations.find(x => x.stock_location_id === selected.delivery_stock_location_id); return location ? `${location.location_code} - ${location.location_name}` : "Not assigned"; })()
    : "Not applicable";
  const sourceReference = detailQuery.data?.acceptedRevision
    ? `${detailQuery.data.quotation?.quotation_no ?? "Quotation"} Rev ${detailQuery.data.acceptedRevision.revision_no}`
    : detailQuery.data?.quotation?.quotation_no ?? "Not assigned";
  const openHeader = () => { if (!selected) return; setHeaderDate(selected.required_by_date ?? ""); setHeaderSite(selected.site_id ?? ""); setHeaderDestination(selected.delivery_destination_type); setHeaderLocation(selected.delivery_stock_location_id ?? ""); setHeaderNotes(selected.notes ?? ""); setDialog({ type: "header" }); };
  const openLine = (type: string, line: MRLine) => { setQuantity(String(line.requirement_quantity)); setWaste(String(line.waste_percent)); setProductId(line.product_id ?? ""); setDescription(line.description); setUomCode(line.requirement_uom_code); setBaseUomCode(line.base_uom_code); setAreaId(line.project_area_id ?? ""); setSupplierId(line.preferred_supplier_id ?? ""); setReason(""); setDialog({ type, line }); };
  const invalidate = () => { qc.invalidateQueries({ queryKey: ["material-requirements"] }); qc.invalidateQueries({ queryKey: ["material-requirement-detail"] }); };
  const responsibleDisplayName = (authUserId: string | null) => {
    if (!authUserId) return "Unassigned";
    const employee = lookups.data?.employees.find(x => x.auth_user_id === authUserId);
    if (!employee) return "Unassigned";
    return employee.display_name?.trim() || `${employee.first_name} ${employee.last_name}`.trim() || "Unassigned";
  };
  const areaDisplay = (areaId: string | null) => {
    if (!areaId) return "Not assigned";
    const area = lookups.data?.areas.find(x => x.area_id === areaId);
    return area ? `${area.area_code} - ${area.area_name}` : "Not assigned";
  };
  const productCodeDisplay = (line: MRLine) => {
    const product = line.product_id ? lookups.data?.products.find(x => x.product_id === line.product_id) : undefined;
    return line.source_product_code || product?.product_code || "Operational";
  };
  const relatedAreasDisplay = relatedAreas.length ? relatedAreas.map(area => `${area.area_code} - ${area.area_name}`).join(", ") : "Not assigned";
  const lineById = useMemo(() => new Map(activeLines.map(line => [line.material_requirement_line_id, line])), [activeLines]);
  const buildPrintHtml = () => {
    if (!detailQuery.data) throw new Error("Material Requirement details are still loading.");
    const header = detailQuery.data.header;
    const printedAt = new Date().toLocaleString("en-AU");
    const lineRows = activeLines.map(line => `<tr><td>${escapeHtml(line.line_no)}</td><td>${escapeHtml(line.line_origin)}</td><td>${escapeHtml(areaDisplay(line.project_area_id))}</td><td>${escapeHtml(productCodeDisplay(line))}</td><td>${escapeHtml(line.description)}</td><td class="num">${escapeHtml(line.requirement_quantity)}</td><td>${escapeHtml(line.requirement_uom_code)}</td><td class="num">${escapeHtml(`${line.waste_percent}%`)}</td><td class="num">${escapeHtml(line.required_base_quantity)}</td><td>${escapeHtml(line.line_status)}</td></tr>`).join("");
    const adjustmentRows = detailQuery.data.adjustments.map(adjustment => {
      const line = lineById.get(adjustment.material_requirement_line_id);
      return `<tr class="adjustment-row"><td>${escapeHtml(formatDateTime(adjustment.created_at))}</td><td>${escapeHtml(line?.line_no ?? "-")}</td><td>${escapeHtml(adjustment.adjustment_type)}</td><td>${escapeHtml(adjustment.adjustment_reason)}</td><td>${escapeHtml(adjustment.commercial_impact)}</td><td>${escapeHtml(adjustment.variation_required ? "Yes" : "No")}</td><td>${escapeHtml(adjustment.approval_status)}</td></tr>`;
    }).join("");
    return `<!doctype html><html><head><meta charset="utf-8" /><title>${escapeHtml(header.material_requirement_no)}</title><style>@page{size:A4;margin:14mm}body{font-family:Tahoma,Arial,"Noto Sans Thai","Leelawadee UI",sans-serif;color:#111827;font-size:12px;line-height:1.4}.heading{display:flex;justify-content:space-between;gap:16px;border-bottom:2px solid #9E4B4B;padding-bottom:12px;margin-bottom:18px}.brand{font-size:18px;font-weight:700;color:#7f3d3d}.title{font-size:24px;font-weight:700}.status{display:inline-block;border:1px solid #d1d5db;border-radius:999px;padding:4px 10px;font-weight:700}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 18px;margin-bottom:18px}.heading,.doc-context,.adjustment-row,.cancellation-block{break-inside:avoid;page-break-inside:avoid}.item-label{font-size:10px;text-transform:uppercase;color:#6b7280}.item-value{font-weight:600}.section{margin-top:18px}.section h2{font-size:15px;margin:0 0 8px;color:#7f3d3d}table{width:100%;border-collapse:collapse;page-break-inside:auto}th,td{border:1px solid #d1d5db;padding:6px;vertical-align:top}th{background:#f8eeee;text-align:left}.num{text-align:right}.notes{white-space:pre-wrap}.footer{margin-top:18px;border-top:1px solid #d1d5db;padding-top:8px;color:#6b7280;font-size:11px}@media print{button{display:none}}</style></head><body><div class="heading"><div><div class="brand">REDS Timber Flooring</div><div class="title">Material Requirement</div></div><div><div class="status">${escapeHtml(header.requirement_status)}</div></div></div><div class="grid doc-context"><div><div class="item-label">Material Requirement</div><div class="item-value">${escapeHtml(header.material_requirement_no)}</div></div><div><div class="item-label">Source</div><div class="item-value">${escapeHtml(header.source_type)}</div></div><div><div class="item-label">Source reference</div><div class="item-value">${escapeHtml(sourceReference)}</div></div><div><div class="item-label">Project</div><div class="item-value">${escapeHtml(projectDisplay)}</div></div><div><div class="item-label">Project Site</div><div class="item-value">${escapeHtml(siteDisplay)}</div></div><div><div class="item-label">Related Project Areas</div><div class="item-value">${escapeHtml(relatedAreasDisplay)}</div></div><div><div class="item-label">Required by</div><div class="item-value">${escapeHtml(header.required_by_date || "-")}</div></div><div><div class="item-label">Delivery destination</div><div class="item-value">${escapeHtml(header.delivery_destination_type)}</div></div><div><div class="item-label">Delivery stock location</div><div class="item-value">${escapeHtml(stockLocationDisplay)}</div></div><div><div class="item-label">Responsible</div><div class="item-value">${escapeHtml(responsibleDisplayName(header.responsible_auth_user_id))}</div></div></div>${header.notes ? `<div class="section"><h2>Notes</h2><div class="notes">${escapeHtml(header.notes)}</div></div>` : ""}<div class="section"><h2>Material Lines</h2><table><thead><tr><th>Line</th><th>Origin</th><th>Area</th><th>Product</th><th>Description</th><th>Quantity</th><th>UOM</th><th>Waste</th><th>Required Base Qty</th><th>Status</th></tr></thead><tbody>${lineRows || `<tr><td colspan="10">No active material lines.</td></tr>`}</tbody></table></div><div class="section"><h2>Adjustment History</h2><table><thead><tr><th>Date/time</th><th>Line</th><th>Type</th><th>Reason</th><th>Commercial impact</th><th>Variation required</th><th>Approval status</th></tr></thead><tbody>${adjustmentRows || `<tr><td colspan="7">No adjustments recorded.</td></tr>`}</tbody></table></div>${header.requirement_status === "Cancelled" ? `<div class="section cancellation-block"><h2>Cancellation Reason</h2><div>${escapeHtml(header.cancellation_reason || "Not recorded")}</div></div>` : ""}<div class="footer">Printed: ${escapeHtml(printedAt)}</div></body></html>`;
  };
  const handlePrint = () => {
    if (exporting) return;
    setExporting("print");
    try {
      const printWindow = window.open("", "_blank");
      if (!printWindow) throw new Error("Unable to open the print window. Check your browser popup settings.");
      printWindow.document.write(buildPrintHtml());
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 250);
      toast.success("Print view opened.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to prepare the print view.");
    } finally {
      setExporting(null);
    }
  };
  const handleExportCsv = () => {
    if (exporting) return;
    setExporting("csv");
    try {
      if (!detailQuery.data) throw new Error("Material Requirement details are still loading.");
      const header = detailQuery.data.header;
      const rows: (string | number | boolean | null | undefined)[][] = [
        ["REDS Timber Flooring"],
        ["Material Requirement", header.material_requirement_no],
        [],
        ["Document Context"],
        ["Material Requirement", header.material_requirement_no],
        ["Status", header.requirement_status],
        ["Source", header.source_type],
        ["Source reference", sourceReference],
        ["Project", projectDisplay],
        ["Project Site", siteDisplay],
        ["Related Project Areas", relatedAreasDisplay],
        ["Required by", header.required_by_date || ""],
        ["Delivery destination", header.delivery_destination_type],
        ["Delivery stock location", stockLocationDisplay],
        ["Responsible", responsibleDisplayName(header.responsible_auth_user_id)],
        ["Notes", header.notes || ""],
      ];
      if (header.requirement_status === "Cancelled") rows.push(["Cancellation reason", header.cancellation_reason || "Not recorded"]);
      rows.push([], ["Material Lines"], ["Line", "Origin", "Area", "Product code", "Description", "Quantity", "UOM", "Waste %", "Required base quantity", "Line status"]);
      activeLines.forEach(line => rows.push([line.line_no, line.line_origin, areaDisplay(line.project_area_id), productCodeDisplay(line), line.description, line.requirement_quantity, line.requirement_uom_code, line.waste_percent, line.required_base_quantity, line.line_status]));
      if (!activeLines.length) rows.push(["No active material lines."]);
      rows.push([], ["Adjustment History"], ["Date/time", "Line", "Adjustment type", "Reason", "Commercial impact", "Variation required", "Approval status"]);
      detailQuery.data.adjustments.forEach(adjustment => {
        const line = lineById.get(adjustment.material_requirement_line_id);
        rows.push([formatDateTime(adjustment.created_at), line?.line_no ?? "", adjustment.adjustment_type, adjustment.adjustment_reason, adjustment.commercial_impact, adjustment.variation_required ? "Yes" : "No", adjustment.approval_status]);
      });
      if (!detailQuery.data.adjustments.length) rows.push(["No adjustments recorded."]);
      rows.push([], ["Exported at", new Date().toLocaleString("en-AU")]);
      downloadFile(`\uFEFF${rows.map(row => row.map(csvCell).join(",")).join("\r\n")}`, `${safeFilePart(header.material_requirement_no)}-material-requirement.csv`, "text/csv;charset=utf-8");
      toast.success("Material Requirement CSV exported.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to export CSV.");
    } finally {
      setExporting(null);
    }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!selectedId || !dialog) throw new Error("No action selected."); let result;
      if (dialog.type === "quantity" && dialog.line) result = await supabase.rpc("update_material_requirement_line_quantity", { p_material_requirement_line_id: dialog.line.material_requirement_line_id, p_requirement_quantity: n(quantity), p_waste_percent: n(waste), p_adjustment_reason: reason.trim() });
      else if (dialog.type === "exclude" && dialog.line) result = await supabase.rpc("exclude_material_requirement_line", { p_material_requirement_line_id: dialog.line.material_requirement_line_id, p_exclusion_reason: reason.trim(), p_adjustment_reason: reason.trim() });
      else if (dialog.type === "restore" && dialog.line) result = await supabase.rpc("restore_material_requirement_line", { p_material_requirement_line_id: dialog.line.material_requirement_line_id, p_adjustment_reason: reason.trim() });
      else if (dialog.type === "substitute" && dialog.line) result = await supabase.rpc("substitute_material_requirement_line_product", { p_material_requirement_line_id: dialog.line.material_requirement_line_id, p_product_id: productId, p_description: description.trim(), p_requirement_quantity: n(quantity), p_requirement_uom_code: uomCode, p_base_uom_code: baseUomCode, p_conversion_factor_to_base: 1, p_waste_percent: n(waste), p_allow_fractional_quantity: true, p_preferred_supplier_id: supplierId || undefined, p_adjustment_reason: reason.trim() });
      else if (dialog.type === "add") result = await supabase.rpc("add_material_requirement_operational_line", { p_material_requirement_id: selectedId, p_product_id: productId, p_project_area_id: areaId, p_description: description.trim(), p_requirement_quantity: n(quantity), p_requirement_uom_code: uomCode, p_base_uom_code: baseUomCode, p_conversion_factor_to_base: 1, p_waste_percent: n(waste), p_preferred_supplier_id: supplierId || undefined, p_adjustment_reason: reason.trim() });
      else if (dialog.type === "header") {
        if (!headerSite) throw new Error("Site is required.");
        const deliveryStockLocationId = headerDestination === "Warehouse" ? headerLocation : null;
        if (headerDestination === "Warehouse" && !deliveryStockLocationId) throw new Error("Stock Location is required.");
        result = await supabase.rpc("update_material_requirement_header", { p_material_requirement_id: selectedId, p_required_by_date: headerDate, p_site_id: headerSite, p_delivery_destination_type: headerDestination, p_delivery_stock_location_id: deliveryStockLocationId as unknown as string, p_notes: headerNotes });
      }
      else if (dialog.type === "assign") result = await supabase.rpc("assign_material_requirement_responsible", { p_material_requirement_id: selectedId, p_responsible_auth_user_id: responsibleId, p_assignment_reason: reason.trim() });
      else if (dialog.type === "transition") {
        const workflowReason = headerNotes.trim();
        if (["ReturnToDraft", "Cancel"].includes(reason) && !workflowReason) throw new Error("Workflow reason is required.");
        result = await supabase.rpc("transition_material_requirement_status", { p_material_requirement_id: selectedId, p_action: reason, p_reason: workflowReason || undefined });
      }
      else throw new Error("Unsupported action."); if (result.error) throw result.error; return result.data;
    }, onSuccess: () => { toast.success("Material Requirement updated."); setDialog(null); setReason(""); invalidate(); }, onError: (e: Error) => toast.error(e.message)
  });

  if (permissionQuery.isLoading) return <State title="Checking permissions..." />;
  if (!can("material_requirements.view")) return <State title="You do not have permission to view Material Requirements." />;
  return <div className="space-y-6 p-4 md:p-6">
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h1 className="flex items-center gap-3 text-2xl font-bold md:text-3xl"><ClipboardList className="h-8 w-8 text-[#9E4B4B]" />Material Requirements</h1><p className="mt-1 text-sm text-slate-500">Operational material preparation generated from accepted quotations.</p></div><Button variant="outline" onClick={() => listQuery.refetch()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button></div>
    <div className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-[1fr_220px]"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input className="bg-[#F7F9FB] pl-9" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search MR number..." /></div><Select value={status} onValueChange={setStatus}><SelectTrigger className="bg-[#F7F9FB]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{statuses.map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
    {listQuery.isLoading ? <State title="Loading Material Requirements..." /> : listQuery.isError ? <State title={(listQuery.error as Error).message} /> : !listQuery.data?.length ? <State title="No Material Requirements found." /> : <><div className="hidden overflow-hidden rounded-2xl border bg-white md:block"><table className="w-full text-sm"><thead className="bg-[#FBF1F1]"><tr><th className="px-4 py-3 text-left">MR</th><th className="px-4 py-3 text-left">Required by</th><th className="px-4 py-3 text-left">Source</th><th className="px-4 py-3 text-left">Status</th></tr></thead><tbody>{listQuery.data.map(x => <tr key={x.material_requirement_id} className="border-t hover:bg-slate-50"><td className="px-4 py-4"><button className="font-semibold text-[#9E4B4B] hover:underline" onClick={() => setSelectedId(x.material_requirement_id)}>{x.material_requirement_no}</button></td><td className="px-4 py-4">{x.required_by_date || "-"}</td><td className="px-4 py-4">{x.source_type}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs ${statusClass(x.requirement_status)}`}>{x.requirement_status}</span></td></tr>)}</tbody></table></div><div className="space-y-3 md:hidden">{listQuery.data.map(x => <button key={x.material_requirement_id} onClick={() => setSelectedId(x.material_requirement_id)} className="w-full rounded-2xl border bg-white p-4 text-left"><div className="flex items-start justify-between"><strong className="text-[#9E4B4B]">{x.material_requirement_no}</strong><span className={`rounded-full px-2 py-1 text-xs ${statusClass(x.requirement_status)}`}>{x.requirement_status}</span></div><div className="mt-3 text-sm text-slate-500">Required by: {x.required_by_date || "-"}</div></button>)}</div></>}

    <Dialog open={Boolean(selectedId)} onOpenChange={o => !o && setSelectedId(null)}><DialogContent className="max-h-[94vh] max-w-6xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {dialog?.type?.replace(
            /(^|_)(\w)/g,
            (_, a, b) => `${a ? " " : ""}${b.toUpperCase()}`,
          )}
        </DialogTitle>

        <DialogDescription>
          {detailInstruction}
        </DialogDescription>
      </DialogHeader>
      {detailQuery.isLoading ? <State title="Loading details..." /> : detailQuery.data && <div className="space-y-5">{isTerminalDetail && <div className={`rounded-xl border p-4 text-sm font-medium ${detailStatus === "Completed" ? "border-green-200 bg-green-50 text-green-800" : "border-zinc-300 bg-zinc-50 text-zinc-800"}`}>{detailStatus === "Completed" ? "This Material Requirement is completed and is now read-only." : "This Material Requirement is cancelled and is now read-only."}</div>}<div className="rounded-2xl bg-[#FBF1F1] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-xl font-bold">{detailQuery.data.header.material_requirement_no}</div><div className="mt-1 text-sm text-slate-500">Source: {detailQuery.data.header.source_type}</div></div><div className="flex flex-wrap items-center justify-end gap-2"><Button size="sm" variant="outline" onClick={handlePrint} disabled={Boolean(exporting)} title="Print the document or choose Save as PDF / Adobe PDF in the print dialog.">{exporting === "print" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Print / Save PDF</Button><Button size="sm" variant="outline" onClick={handleExportCsv} disabled={Boolean(exporting)}>{exporting === "csv" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Export CSV</Button><span className={`rounded-full px-3 py-1 text-sm ${statusClass(detailQuery.data.header.requirement_status)}`}>{detailQuery.data.header.requirement_status}</span><div className="basis-full text-right text-xs text-slate-500">Print the document or choose Save as PDF / Adobe PDF in the print dialog.</div></div></div><div className="mt-4 grid gap-3 text-sm md:grid-cols-2"><Info label="Material Requirement" value={detailQuery.data.header.material_requirement_no} /><Info label="Source" value={detailQuery.data.header.source_type} /><Info label="Project" value={projectDisplay} /><Info label="Project Site" value={siteDisplay} /><Info label="Required by" value={detailQuery.data.header.required_by_date || "-"} /><Info label="Delivery" value={detailQuery.data.header.delivery_destination_type} /><Info label="Responsible" value={responsibleDisplayName(detailQuery.data.header.responsible_auth_user_id)} /><div><div className="text-xs uppercase text-slate-500">Related Project Areas</div>{relatedAreas.length ? <div className="mt-1 flex flex-wrap gap-1">{relatedAreas.map(area => <span key={area.area_id} className="rounded-full bg-white px-2 py-1 text-xs font-medium text-slate-700">{area.area_code} — {area.area_name}</span>)}</div> : <div className="font-medium">Not assigned</div>}</div>{detailStatus === "Cancelled" && <Info label="Cancellation reason" value={detailQuery.data.header.cancellation_reason || "Not recorded"} />}</div></div>
        {can("material_requirements.update") && !["Completed", "Cancelled"].includes(detailQuery.data.header.requirement_status) && <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={openHeader}>Update Header</Button><Button variant="outline" onClick={() => { setResponsibleId(detailQuery.data?.header.responsible_auth_user_id ?? ""); setReason(""); setDialog({ type: "assign" }); }}><UserRound className="mr-2 h-4 w-4" />Assign Responsible</Button><Button variant="outline" onClick={() => { setProductId(""); setDescription(""); setUomCode(""); setBaseUomCode(""); setAreaId(""); setSupplierId(""); setQuantity("1"); setWaste("0"); setReason(""); setDialog({ type: "add" }); }}><PackagePlus className="mr-2 h-4 w-4" />Add Operational Line</Button>{(transitionMap[detailQuery.data.header.requirement_status] ?? []).map(t => <Button key={t.action} onClick={() => { setReason(t.action); setHeaderNotes(""); setDialog({ type: "transition" }); }} className="bg-[#9E4B4B] text-white hover:bg-[#843e3e]">{t.label}</Button>)}</div>}
        <div className="overflow-x-auto rounded-2xl border"><table className="w-full min-w-[1000px] text-sm"><thead className="bg-slate-50"><tr><th className="px-3 py-3 text-left">Line</th><th className="px-3 py-3 text-left">Origin</th><th className="px-3 py-3 text-left">Product / Description</th><th className="px-3 py-3 text-right">Qty</th><th className="px-3 py-3 text-right">Waste</th><th className="px-3 py-3 text-left">Status</th><th className="px-3 py-3 text-right">Actions</th></tr></thead><tbody>{detailQuery.data.lines.map(line => <tr key={line.material_requirement_line_id} className="border-t"><td className="px-3 py-3">{line.line_no}</td><td className="px-3 py-3">{line.line_origin}</td><td className="px-3 py-3"><strong>{line.source_product_code || "Operational"}</strong><div>{line.description}</div></td><td className="px-3 py-3 text-right">{line.requirement_quantity} {line.requirement_uom_code}</td><td className="px-3 py-3 text-right">{line.waste_percent}%</td><td className="px-3 py-3">{line.line_status}</td><td className="px-3 py-3"><div className="flex justify-end gap-1">{can("material_requirements.update") && !["Completed", "Cancelled"].includes(detailQuery.data.header.requirement_status) && (line.line_status === "Excluded" ? <Button size="sm" variant="outline" onClick={() => openLine("restore", line)}>Restore</Button> : <><Button size="sm" variant="outline" onClick={() => openLine("quantity", line)}>Qty/Waste</Button><Button size="sm" variant="outline" onClick={() => openLine("substitute", line)}>Substitute</Button><Button size="sm" variant="outline" onClick={() => openLine("exclude", line)}>Exclude</Button></>)}</div></td></tr>)}</tbody></table></div>
        <div className="rounded-2xl border"><div className="flex items-center gap-2 border-b bg-slate-50 px-4 py-3 font-semibold"><History className="h-4 w-4" />Adjustment History</div>{!detailQuery.data.adjustments.length ? <div className="p-5 text-sm text-slate-500">No adjustments recorded.</div> : <div className="divide-y">{detailQuery.data.adjustments.map(a => <div key={a.material_requirement_line_adjustment_id} className="p-4"><div className="flex flex-wrap justify-between gap-2"><strong>{a.adjustment_type}</strong><span className="text-xs text-slate-500">{new Date(a.created_at).toLocaleString("en-AU")}</span></div><p className="mt-1 text-sm">{a.adjustment_reason}</p><div className="mt-1 text-xs text-slate-500">Commercial impact: {a.commercial_impact} · Variation required: {a.variation_required ? "Yes" : "No"}</div></div>)}</div>}</div>
      </div>}</DialogContent></Dialog>

    <Dialog open={Boolean(dialog)} onOpenChange={o => !o && setDialog(null)}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{dialog?.type?.replace(/(^|_)(\w)/g, (_, a, b) => `${a ? " " : ""}${b.toUpperCase()}`)}</DialogTitle></DialogHeader><div className="space-y-4">{["quantity", "substitute", "add"].includes(dialog?.type ?? "") && <div className="grid gap-4 md:grid-cols-2">{["substitute", "add"].includes(dialog?.type ?? "") && <><F label="Product"><Select value={productId} onValueChange={v => { setProductId(v); const p = lookups.data?.products.find(x => x.product_id === v); if (p) { setDescription(p.description || p.product_name); setUomCode(p.default_request_uom_code || p.base_uom_code || ""); setBaseUomCode(p.base_uom_code || ""); } }}><SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger><SelectContent>{lookups.data?.products.map(x => <SelectItem key={x.product_id} value={x.product_id}>{x.product_code} — {x.product_name}</SelectItem>)}</SelectContent></Select></F><F label="Project Area"><Select value={areaId} onValueChange={setAreaId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{lookups.data?.areas.map(x => <SelectItem key={x.area_id} value={x.area_id}>{x.area_code} — {x.area_name}</SelectItem>)}</SelectContent></Select></F><F label="Requirement UOM"><Select value={uomCode} onValueChange={setUomCode}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{lookups.data?.uoms.map(x => <SelectItem key={x.uom_code} value={x.uom_code}>{x.uom_code} — {x.uom_name}</SelectItem>)}</SelectContent></Select></F><F label="Base UOM"><Select value={baseUomCode} onValueChange={setBaseUomCode}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{lookups.data?.uoms.map(x => <SelectItem key={x.uom_code} value={x.uom_code}>{x.uom_code} — {x.uom_name}</SelectItem>)}</SelectContent></Select></F></>}<F label="Quantity"><Input type="number" min="0" step="any" value={quantity} onChange={e => setQuantity(e.target.value)} /></F><F label="Waste %"><Input type="number" min="0" value={waste} onChange={e => setWaste(e.target.value)} /></F>{["substitute", "add"].includes(dialog?.type ?? "") && <div className="md:col-span-2"><F label="Description"><Textarea value={description} onChange={e => setDescription(e.target.value)} /></F></div>}</div>}{dialog?.type === "header" && <div className="grid gap-4 md:grid-cols-2"><F label="Required by"><Input type="date" value={headerDate} onChange={e => setHeaderDate(e.target.value)} /></F><F label="Site"><Select value={headerSite} onValueChange={setHeaderSite}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{lookups.data?.sites.map(x => <SelectItem key={x.site_id} value={x.site_id}>{x.site_code} — {x.site_name}</SelectItem>)}</SelectContent></Select></F><F label="Destination"><Select value={headerDestination} onValueChange={v => { setHeaderDestination(v); if (v === "Site") setHeaderLocation(""); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Site">Direct to Site</SelectItem>
      <SelectItem value="Warehouse">
        Stock Location
      </SelectItem>
    </SelectContent></Select></F>{headerDestination === "Warehouse" && <F label="Stock Location"><Select value={headerLocation} onValueChange={setHeaderLocation}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{lookups.data?.locations.map(x => <SelectItem key={x.stock_location_id} value={x.stock_location_id}>{x.location_code} — {x.location_name}</SelectItem>)}</SelectContent></Select></F>}<div className="md:col-span-2"><F label="Notes"><Textarea value={headerNotes} onChange={e => setHeaderNotes(e.target.value)} /></F></div></div>}{dialog?.type === "assign" && <><F label="Responsible employee"><Select value={responsibleId} onValueChange={setResponsibleId}><SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent>{lookups.data?.employees.map(x => <SelectItem key={x.employee_id} value={x.auth_user_id!}>{x.display_name || `${x.first_name} ${x.last_name}`}</SelectItem>)}</SelectContent></Select></F></>}{!["header", "transition"].includes(dialog?.type ?? "") && <F label="Reason"><Textarea value={reason} onChange={e => setReason(e.target.value)} /></F>}{dialog?.type === "transition" && <F label="Workflow note / cancellation reason"><Textarea value={headerNotes} onChange={e => setHeaderNotes(e.target.value)} /></F>}<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button><Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="bg-[#9E4B4B] text-white hover:bg-[#843e3e]">{mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirm</Button></div></div></DialogContent></Dialog>
  </div>;
}
function F({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div> }
function Info({ label, value }: { label: string; value: string }) { return <div><div className="text-xs uppercase text-slate-500">{label}</div><div className="font-medium">{value}</div></div> }
function State({ title }: { title: string }) { return <div className="flex min-h-56 items-center justify-center rounded-2xl border bg-white p-8 text-center text-slate-500"><XCircle className="mr-2 h-5 w-5" />{title}</div> }

export default MaterialRequest;
