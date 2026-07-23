import { useMemo, useState } from "react";
import { ClipboardList, History, Loader2, PackagePlus, RefreshCw, Search, UserRound, XCircle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const supabaseUntyped = supabase as any;

type MR = {
  material_requirement_id: string;
  material_requirement_no: string;
  requirement_status: string;
  source_type: string;
  required_by_date: string | null;
  project_id: string | null;
  site_id: string | null;
  quotation_id: string | null;
  accepted_revision_id: string | null;
  delivery_destination_type: string;
  delivery_stock_location_id: string | null;
  responsible_auth_user_id: string | null;
  notes: string | null;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
};
type MRLine = {
  material_requirement_line_id: string;
  material_requirement_id: string;
  line_no: number;
  line_origin: string;
  line_status: string;
  product_id: string | null;
  preferred_supplier_id: string | null;
  project_area_id: string | null;
  source_product_code: string | null;
  description: string;
  requirement_quantity: number;
  requirement_uom_code: string;
  base_uom_code: string;
  waste_percent: number;
  is_active: boolean;
  is_deleted: boolean;
};
type Adjustment = {
  material_requirement_line_adjustment_id: string;
  material_requirement_line_id: string;
  adjustment_type: string;
  adjustment_reason: string;
  commercial_impact: string;
  variation_required: boolean;
  created_at: string;
};
type MRLineAreaLink = Pick<MRLine, "material_requirement_id" | "project_area_id">;
type Product = Database["public"]["Tables"]["products"]["Row"];
type Area = Database["public"]["Tables"]["project_areas"]["Row"];
type Site = Database["public"]["Tables"]["project_sites"]["Row"];
type Uom = Database["public"]["Tables"]["units_of_measure"]["Row"];
type Employee = Database["public"]["Tables"]["employees"]["Row"];
type StockLocation = Database["public"]["Tables"]["stock_locations"]["Row"];
type Supplier = Database["public"]["Tables"]["suppliers"]["Row"];
type Customer = Database["public"]["Tables"]["customers"]["Row"];
type Project = Database["public"]["Tables"]["projects"]["Row"];
type PermissionMap = Record<string, boolean>;

type MRListItem = MR & {
  customerName: string;
  projectName: string;
  siteName: string;
  areaNames: string[];
};

const PERMISSIONS = ["material_requirements.view","material_requirements.update","material_requirements.create"] as const;
const statuses = ["Draft","UnderReview","Approved","InPreparation","PartiallyReady","Ready","Completed","Cancelled"];
const transitionMap: Record<string, { action: string; label: string }[]> = {
  Draft: [{ action: "SubmitForReview", label: "Submit for Review" }, { action: "Cancel", label: "Cancel" }],
  UnderReview: [{ action: "ReturnToDraft", label: "Return to Draft" }, { action: "Approve", label: "Approve" }, { action: "Cancel", label: "Cancel" }],
  Approved: [{ action: "StartPreparation", label: "Start Preparation" }, { action: "Cancel", label: "Cancel" }],
  InPreparation: [{ action: "MarkReady", label: "Mark Ready" }, { action: "Cancel", label: "Cancel" }],
  PartiallyReady: [{ action: "MarkReady", label: "Mark Ready" }, { action: "Cancel", label: "Cancel" }],
  Ready: [{ action: "Complete", label: "Complete" }, { action: "Cancel", label: "Cancel" }],
};
const statusClass = (status: string) => ({ Draft:"bg-slate-100 text-slate-700", UnderReview:"bg-amber-100 text-amber-800", Approved:"bg-blue-100 text-blue-700", InPreparation:"bg-violet-100 text-violet-700", PartiallyReady:"bg-teal-100 text-teal-700", Ready:"bg-emerald-100 text-emerald-700", Completed:"bg-green-100 text-green-800", Cancelled:"bg-zinc-200 text-zinc-700" }[status] ?? "bg-slate-100 text-slate-700");
const n = (v: string) => Number.isFinite(Number(v)) ? Number(v) : 0;

function MaterialRequest() {
  const qc = useQueryClient();
  const [search, setSearch] = useState(""); const [status, setStatus] = useState("all"); const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ type: string; line?: MRLine } | null>(null); const [reason, setReason] = useState("");
  const [quantity, setQuantity] = useState("0"); const [waste, setWaste] = useState("0"); const [productId, setProductId] = useState("");
  const [description, setDescription] = useState(""); const [uomCode, setUomCode] = useState(""); const [baseUomCode, setBaseUomCode] = useState("");
  const [areaId, setAreaId] = useState(""); const [supplierId, setSupplierId] = useState("");
  const [headerDate, setHeaderDate] = useState(""); const [headerSite, setHeaderSite] = useState(""); const [headerDestination, setHeaderDestination] = useState("Site"); const [headerLocation, setHeaderLocation] = useState(""); const [headerNotes, setHeaderNotes] = useState("");
  const [responsibleId, setResponsibleId] = useState("");

  const permissionQuery = useQuery({ queryKey:["mr-permissions"], queryFn: async () => Object.fromEntries(await Promise.all(PERMISSIONS.map(async code => { const {data,error}=await supabase.rpc("has_permission",{p_permission_code:code}); if(error) throw error; return [code,Boolean(data)] as const; }))) as PermissionMap });
  const can = (code:string) => permissionQuery.data?.[code] === true;

  const lookups = useQuery({ queryKey:["mr-lookups"], queryFn: async () => {
    const [products,areas,sites,projects,customers,uoms,employees,locations,suppliers] = await Promise.all([
      supabase.from("products").select("*").eq("is_deleted",false).eq("is_active",true).order("product_name"),
      supabase.from("project_areas").select("*").eq("is_deleted",false).eq("is_active",true).order("area_name"),
      supabase.from("project_sites").select("*").eq("is_deleted",false).eq("is_active",true).order("site_name"),
      supabase.from("projects").select("*").eq("is_deleted",false).order("project_name"),
      supabase.from("customers").select("*").eq("is_deleted",false).eq("is_active",true).order("customer_name"),
      supabase.from("units_of_measure").select("*").eq("is_deleted",false).eq("is_active",true).order("sort_order"),
      supabase.from("employees").select("*").eq("is_deleted",false).eq("is_active",true).order("first_name").order("last_name"),
      supabase.from("stock_locations").select("*").eq("is_deleted",false).eq("is_active",true).order("location_name"),
      supabase.from("suppliers").select("*").eq("is_deleted",false).eq("is_active",true).order("supplier_name"),
    ]); for(const r of [products,areas,sites,projects,customers,uoms,employees,locations,suppliers]) if(r.error) throw r.error;
    return { products:products.data??[], areas:areas.data??[], sites:sites.data??[], projects:projects.data??[], customers:customers.data??[], uoms:uoms.data??[], employees:employees.data??[], locations:locations.data??[], suppliers:suppliers.data??[] };
  }});

  const listQuery = useQuery({
    queryKey:["material-requirements",status],
    enabled:can("material_requirements.view"),
    queryFn: async (): Promise<MRListItem[]> => {
      let query = supabaseUntyped
        .from("material_requirements")
        .select("*")
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (status !== "all") {
        query = query.eq("requirement_status", status);
      }

      const { data: requirements, error: requirementError } = await query;
      if (requirementError) throw requirementError;

      const rows = (requirements ?? []) as MR[];
      if (!rows.length) return [];

      const requirementIds = rows.map((row) => row.material_requirement_id);
      const projectIds = [...new Set(rows.map((row) => row.project_id).filter(Boolean))] as string[];
      const siteIds = [...new Set(rows.map((row) => row.site_id).filter(Boolean))] as string[];

      const [projectsResult, sitesResult, linesResult] = await Promise.all([
        projectIds.length
          ? supabase.from("projects").select("*").in("project_id", projectIds)
          : Promise.resolve({ data: [] as Project[], error: null }),
        siteIds.length
          ? supabase.from("project_sites").select("*").in("site_id", siteIds)
          : Promise.resolve({ data: [] as Site[], error: null }),
        supabaseUntyped
          .from("material_requirement_lines")
          .select("material_requirement_id, project_area_id")
          .in("material_requirement_id", requirementIds)
          .eq("is_deleted", false),
      ]);

      if (projectsResult.error) throw projectsResult.error;
      if (sitesResult.error) throw sitesResult.error;
      if (linesResult.error) throw linesResult.error;

      const projects = projectsResult.data ?? [];
      const sites = sitesResult.data ?? [];
      const lines = (linesResult.data ?? []) as MRLineAreaLink[];
      const customerIds = [...new Set(projects.map((project) => project.customer_id).filter(Boolean))] as string[];
      const areaIds = [...new Set(lines.map((line) => line.project_area_id).filter(Boolean))] as string[];

      const [customersResult, areasResult] = await Promise.all([
        customerIds.length
          ? supabase.from("customers").select("*").in("customer_id", customerIds)
          : Promise.resolve({ data: [] as Customer[], error: null }),
        areaIds.length
          ? supabase.from("project_areas").select("*").in("area_id", areaIds)
          : Promise.resolve({ data: [] as Area[], error: null }),
      ]);

      if (customersResult.error) throw customersResult.error;
      if (areasResult.error) throw areasResult.error;

      const projectMap = new Map(projects.map((project) => [project.project_id, project]));
      const customerMap = new Map((customersResult.data ?? []).map((customer) => [customer.customer_id, customer]));
      const siteMap = new Map(sites.map((site) => [site.site_id, site]));
      const areaMap = new Map((areasResult.data ?? []).map((area) => [area.area_id, area]));
      const areaIdsByRequirement = new Map<string, Set<string>>();

      for (const line of lines) {
        if (!line.project_area_id) continue;
        const ids = areaIdsByRequirement.get(line.material_requirement_id) ?? new Set<string>();
        ids.add(line.project_area_id);
        areaIdsByRequirement.set(line.material_requirement_id, ids);
      }

      return rows.map((row) => {
        const project = row.project_id ? projectMap.get(row.project_id) : undefined;
        const customer = project?.customer_id ? customerMap.get(project.customer_id) : undefined;
        const site = row.site_id ? siteMap.get(row.site_id) : undefined;
        const linkedAreaIds = [...(areaIdsByRequirement.get(row.material_requirement_id) ?? new Set<string>())];
        const areaNames = linkedAreaIds
          .map((areaId) => areaMap.get(areaId))
          .filter((area): area is Area => Boolean(area))
          .map((area) => `${area.area_code} - ${area.area_name}`);

        return {
          ...row,
          customerName: customer ? `${customer.customer_code} - ${customer.customer_name}` : "-",
          projectName: project ? `${project.project_no} - ${project.project_name}` : "-",
          siteName: site ? `${site.site_code} - ${site.site_name}` : "-",
          areaNames,
        };
      });
    },
  });

  const filteredList = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return listQuery.data ?? [];

    return (listQuery.data ?? []).filter((row) =>
      [
        row.material_requirement_no,
        row.customerName,
        row.projectName,
        row.siteName,
        row.source_type,
        ...row.areaNames,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase().includes(term)),
    );
  }, [listQuery.data, search]);

  const detailQuery = useQuery({ queryKey:["material-requirement-detail",selectedId], enabled:Boolean(selectedId), queryFn: async () => {
    if(!selectedId) throw new Error("Material Requirement not selected.");
    const [header,lines]=await Promise.all([supabaseUntyped.from("material_requirements").select("*").eq("material_requirement_id",selectedId).single(),supabaseUntyped.from("material_requirement_lines").select("*").eq("material_requirement_id",selectedId).eq("is_deleted",false).order("line_no")]);
    if(header.error) throw header.error; if(lines.error) throw lines.error;
    const detailHeader = header.data as MR;
    const detailLines = (lines.data ?? []) as MRLine[];
    const ids=detailLines.map(x=>x.material_requirement_line_id); let adjustments:Adjustment[]=[];
    if(ids.length){const r=await supabaseUntyped.from("material_requirement_line_adjustments").select("*").in("material_requirement_line_id",ids).order("created_at",{ascending:false}); if(r.error) throw r.error; adjustments=(r.data??[]) as Adjustment[];}
    let currentSite: Site | null = null;
    if(detailHeader.site_id){const s=await supabase.from("project_sites").select("*").eq("site_id",detailHeader.site_id).maybeSingle(); if(s.error) throw s.error; currentSite=s.data;}
    return {header:detailHeader,lines:detailLines,adjustments,currentSite};
  }});

  const selected = detailQuery.data?.header;
  const employeeName = (employee: Employee) => [employee.first_name, employee.last_name].filter(Boolean).join(" ").trim() || employee.employee_code || "Unnamed employee";
  const employeeByAuthUserId = useMemo(() => new Map((lookups.data?.employees ?? []).filter(employee => Boolean(employee.auth_user_id)).map(employee => [employee.auth_user_id!, employee])), [lookups.data?.employees]);
  const projectById = useMemo(() => new Map((lookups.data?.projects ?? []).map(project => [project.project_id, project])), [lookups.data?.projects]);
  const customerById = useMemo(() => new Map((lookups.data?.customers ?? []).map(customer => [customer.customer_id, customer])), [lookups.data?.customers]);
  const siteById = useMemo(() => new Map([...(lookups.data?.sites ?? []), ...(detailQuery.data?.currentSite ? [detailQuery.data.currentSite] : [])].map(site => [site.site_id, site])), [lookups.data?.sites, detailQuery.data?.currentSite]);
  const areaById = useMemo(() => new Map((lookups.data?.areas ?? []).map(area => [area.area_id, area])), [lookups.data?.areas]);
  const selectedProject = selected?.project_id ? projectById.get(selected.project_id) : undefined;
  const selectedCustomer = selectedProject ? customerById.get(selectedProject.customer_id) : undefined;
  const selectedSourceSite = selected?.site_id ? siteById.get(selected.site_id) : undefined;
  const isSourceSiteLocked = selected?.source_type === "AcceptedQuotation" || selected?.source_type === "AcceptedRevision";
  const responsibleDisplayName = (authUserId: string | null) => {
    if(!authUserId) return "Not assigned";
    const employee = employeeByAuthUserId.get(authUserId);
    return employee ? employeeName(employee) : "Assigned user unavailable";
  };
  const areasForSelectedRequirement = useMemo(() => (lookups.data?.areas ?? []).filter(area => area.site_id === selected?.site_id && area.project_id === selected?.project_id && area.is_active && !area.is_deleted), [lookups.data?.areas, selected?.site_id, selected?.project_id]);
  const relatedAreas = useMemo(() => {
    const ids = new Set((detailQuery.data?.lines ?? []).map(line => line.project_area_id).filter(Boolean) as string[]);
    return [...ids].map(id => areaById.get(id)).filter((area): area is Area => Boolean(area));
  }, [areaById, detailQuery.data?.lines]);
  const openHeader = () => { if(!selected)return; setHeaderDate(selected.required_by_date??""); setHeaderSite(selected.site_id??""); setHeaderDestination(selected.delivery_destination_type); setHeaderLocation(selected.delivery_stock_location_id??""); setHeaderNotes(selected.notes??""); setDialog({type:"header"}); };
  const openLine = (type:string,line:MRLine) => { setQuantity(String(line.requirement_quantity)); setWaste(String(line.waste_percent)); setProductId(line.product_id??""); setDescription(line.description); setUomCode(line.requirement_uom_code); setBaseUomCode(line.base_uom_code); setAreaId(line.project_area_id??""); setSupplierId(line.preferred_supplier_id??""); setReason(""); setDialog({type,line}); };
  const invalidate = () => { qc.invalidateQueries({queryKey:["material-requirements"]}); qc.invalidateQueries({queryKey:["material-requirement-detail"]}); };

  const mutation = useMutation({ mutationFn: async () => {
    if(!selectedId||!dialog) throw new Error("No action selected."); let result;
    if(dialog.type==="quantity"&&dialog.line) result=await supabaseUntyped.rpc("update_material_requirement_line_quantity",{p_material_requirement_line_id:dialog.line.material_requirement_line_id,p_requirement_quantity:n(quantity),p_waste_percent:n(waste),p_adjustment_reason:reason.trim()});
    else if(dialog.type==="exclude"&&dialog.line) result=await supabaseUntyped.rpc("exclude_material_requirement_line",{p_material_requirement_line_id:dialog.line.material_requirement_line_id,p_exclusion_reason:reason.trim(),p_adjustment_reason:reason.trim()});
    else if(dialog.type==="restore"&&dialog.line) result=await supabaseUntyped.rpc("restore_material_requirement_line",{p_material_requirement_line_id:dialog.line.material_requirement_line_id,p_adjustment_reason:reason.trim()});
    else if(dialog.type==="substitute"&&dialog.line) result=await supabaseUntyped.rpc("substitute_material_requirement_line_product",{p_material_requirement_line_id:dialog.line.material_requirement_line_id,p_product_id:productId,p_description:description.trim(),p_requirement_quantity:n(quantity),p_requirement_uom_code:uomCode,p_base_uom_code:baseUomCode,p_conversion_factor_to_base:1,p_waste_percent:n(waste),p_allow_fractional_quantity:true,p_preferred_supplier_id:supplierId||undefined,p_adjustment_reason:reason.trim()});
    else if(dialog.type==="add") result=await supabaseUntyped.rpc("add_material_requirement_operational_line",{p_material_requirement_id:selectedId,p_product_id:productId,p_project_area_id:areaId,p_description:description.trim(),p_requirement_quantity:n(quantity),p_requirement_uom_code:uomCode,p_base_uom_code:baseUomCode,p_conversion_factor_to_base:1,p_waste_percent:n(waste),p_preferred_supplier_id:supplierId||undefined,p_adjustment_reason:reason.trim()});
    else if(dialog.type==="header") {
      const deliveryStockLocationId = headerDestination === "Warehouse" ? headerLocation : null;
      const sourceSiteId = isSourceSiteLocked ? selected?.site_id ?? "" : headerSite;
      if (!sourceSiteId) throw new Error("Source Site is required.");
      if (headerDestination === "Warehouse" && !deliveryStockLocationId) throw new Error("Stock Location is required.");
      result=await supabaseUntyped.rpc("update_material_requirement_header",{p_material_requirement_id:selectedId,p_required_by_date:headerDate,p_site_id:sourceSiteId,p_delivery_destination_type:headerDestination,p_delivery_stock_location_id:deliveryStockLocationId,p_notes:headerNotes});
    }
    else if(dialog.type==="assign") result=await supabaseUntyped.rpc("assign_material_requirement_responsible",{p_material_requirement_id:selectedId,p_responsible_auth_user_id:responsibleId,p_assignment_reason:reason.trim()});
    else if(dialog.type==="transition") {
      const workflowReason = headerNotes.trim();
      if (["ReturnToDraft", "Cancel"].includes(reason) && !workflowReason) throw new Error("Workflow reason is required.");
      result=await supabaseUntyped.rpc("transition_material_requirement_status",{p_material_requirement_id:selectedId,p_action:reason,p_reason:workflowReason||undefined});
    }
    else throw new Error("Unsupported action."); if(result.error) throw result.error; return result.data;
  }, onSuccess:()=>{toast.success("Material Requirement updated.");setDialog(null);setReason("");invalidate();},onError:(e:Error)=>toast.error(e.message)});

  if(permissionQuery.isLoading) return <State title="Checking permissions..." />;
  if(!can("material_requirements.view")) return <State title="You do not have permission to view Material Requirements." />;
  return <div className="space-y-6 p-4 md:p-6">
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h1 className="flex items-center gap-3 text-2xl font-bold md:text-3xl"><ClipboardList className="h-8 w-8 text-[#9E4B4B]"/>Material Requirements</h1><p className="mt-1 text-sm text-slate-500">Operational material preparation generated from accepted quotations.</p></div><Button variant="outline" onClick={()=>listQuery.refetch()}><RefreshCw className="mr-2 h-4 w-4"/>Refresh</Button></div>
    <div className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-[1fr_220px]"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><Input className="bg-[#F7F9FB] pl-9" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search MR, customer, project, site or area..."/></div><Select value={status} onValueChange={setStatus}><SelectTrigger className="bg-[#F7F9FB]"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{statuses.map(x=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select></div>
    {listQuery.isLoading ? (
      <State title="Loading Material Requirements..."/>
    ) : listQuery.isError ? (
      <State title={(listQuery.error as Error).message}/>
    ) : !filteredList.length ? (
      <State title="No Material Requirements found."/>
    ) : (
      <>
        <div className="hidden overflow-hidden rounded-2xl border bg-white md:block">
          <table className="w-full text-sm">
            <thead className="bg-[#FBF1F1]">
              <tr>
                <th className="px-4 py-3 text-left">MR</th>
                <th className="px-4 py-3 text-left">Customer / Project</th>
                <th className="px-4 py-3 text-left">Site / Areas</th>
                <th className="px-4 py-3 text-left">Required by</th>
                <th className="px-4 py-3 text-left">Source</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((item) => (
                <tr key={item.material_requirement_id} className="border-t align-top hover:bg-slate-50">
                  <td className="px-4 py-4">
                    <button
                      className="font-semibold text-[#9E4B4B] hover:underline"
                      onClick={() => setSelectedId(item.material_requirement_id)}
                    >
                      {item.material_requirement_no}
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-slate-900">{item.customerName}</div>
                    <div className="mt-1 text-xs text-slate-500">{item.projectName}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-slate-900">{item.siteName}</div>
                    <div className="mt-1 max-w-md text-xs text-slate-500">
                      {item.areaNames.length ? item.areaNames.join(", ") : "No linked area"}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">{item.required_by_date || "-"}</td>
                  <td className="whitespace-nowrap px-4 py-4">{item.source_type}</td>
                  <td className="px-4 py-4">
                    <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs ${statusClass(item.requirement_status)}`}>
                      {item.requirement_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 md:hidden">
          {filteredList.map((item) => (
            <button
              key={item.material_requirement_id}
              onClick={() => setSelectedId(item.material_requirement_id)}
              className="w-full rounded-2xl border bg-white p-4 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <strong className="text-[#9E4B4B]">{item.material_requirement_no}</strong>
                <span className={`whitespace-nowrap rounded-full px-2 py-1 text-xs ${statusClass(item.requirement_status)}`}>
                  {item.requirement_status}
                </span>
              </div>
              <div className="mt-3 font-medium text-slate-900">{item.customerName}</div>
              <div className="mt-1 text-sm text-slate-600">{item.projectName}</div>
              <div className="mt-2 text-sm text-slate-600">{item.siteName}</div>
              <div className="mt-1 text-xs text-slate-500">
                {item.areaNames.length ? item.areaNames.join(", ") : "No linked area"}
              </div>
              <div className="mt-3 text-sm text-slate-500">Required by: {item.required_by_date || "-"}</div>
            </button>
          ))}
        </div>
      </>
    )}

    <Dialog open={Boolean(selectedId)} onOpenChange={o=>!o&&setSelectedId(null)}><DialogContent className="max-h-[94vh] max-w-6xl overflow-y-auto"><DialogHeader><DialogTitle>Material Requirement Details</DialogTitle></DialogHeader>{detailQuery.isLoading?<State title="Loading details..."/>:detailQuery.data&&<div className="space-y-5"><div className="rounded-2xl bg-[#FBF1F1] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-xl font-bold">{detailQuery.data.header.material_requirement_no}</div><div className="mt-1 text-sm text-slate-500">Source: {detailQuery.data.header.source_type}</div></div><span className={`rounded-full px-3 py-1 text-sm ${statusClass(detailQuery.data.header.requirement_status)}`}>{detailQuery.data.header.requirement_status}</span></div><div className="mt-4 grid gap-3 text-sm md:grid-cols-3"><Info label="Customer" value={selectedCustomer ? `${selectedCustomer.customer_code} - ${selectedCustomer.customer_name}` : "-"}/><Info label="Project" value={selectedProject ? `${selectedProject.project_no} - ${selectedProject.project_name}` : "-"}/><Info label="Site" value={selectedSourceSite ? `${selectedSourceSite.site_code} - ${selectedSourceSite.site_name}` : "-"}/><Info label="Required by" value={detailQuery.data.header.required_by_date||"-"}/><Info label="Delivery" value={detailQuery.data.header.delivery_destination_type}/><Info label="Responsible" value={responsibleDisplayName(detailQuery.data.header.responsible_auth_user_id)}/><div><div className="text-xs uppercase text-slate-500">Related Areas</div>{relatedAreas.length?<div className="mt-1 flex flex-wrap gap-1">{relatedAreas.map(area=><span key={area.area_id} className="rounded-full bg-white px-2 py-1 text-xs font-medium text-slate-700">{area.area_code} - {area.area_name}</span>)}</div>:<div className="font-medium">Not assigned</div>}</div></div></div>
      {can("material_requirements.update")&&!["Completed","Cancelled"].includes(detailQuery.data.header.requirement_status)&&<div className="flex flex-wrap gap-2"><Button variant="outline" onClick={openHeader}>Update Header</Button><Button variant="outline" onClick={()=>{setResponsibleId(detailQuery.data?.header.responsible_auth_user_id??"");setReason("");setDialog({type:"assign"});}}><UserRound className="mr-2 h-4 w-4"/>Assign Responsible</Button><Button variant="outline" onClick={()=>{setProductId("");setDescription("");setUomCode("");setBaseUomCode("");setAreaId("");setSupplierId("");setQuantity("1");setWaste("0");setReason("");setDialog({type:"add"});}}><PackagePlus className="mr-2 h-4 w-4"/>Add Operational Line</Button>{(transitionMap[detailQuery.data.header.requirement_status]??[]).map(t=><Button key={t.action} onClick={()=>{setReason(t.action);setHeaderNotes("");setDialog({type:"transition"});}} className="bg-[#9E4B4B] text-white hover:bg-[#843e3e]">{t.label}</Button>)}</div>}
      <div className="overflow-x-auto rounded-2xl border"><table className="w-full min-w-[1000px] text-sm"><thead className="bg-slate-50"><tr><th className="px-3 py-3 text-left">Line</th><th className="px-3 py-3 text-left">Origin</th><th className="px-3 py-3 text-left">Product / Description</th><th className="px-3 py-3 text-right">Qty</th><th className="px-3 py-3 text-right">Waste</th><th className="px-3 py-3 text-left">Status</th><th className="px-3 py-3 text-right">Actions</th></tr></thead><tbody>{detailQuery.data.lines.map(line=><tr key={line.material_requirement_line_id} className="border-t"><td className="px-3 py-3">{line.line_no}</td><td className="px-3 py-3">{line.line_origin}</td><td className="px-3 py-3"><strong>{line.source_product_code||"Operational"}</strong><div>{line.description}</div></td><td className="px-3 py-3 text-right">{line.requirement_quantity} {line.requirement_uom_code}</td><td className="px-3 py-3 text-right">{line.waste_percent}%</td><td className="px-3 py-3">{line.line_status}</td><td className="px-3 py-3"><div className="flex justify-end gap-1">{can("material_requirements.update")&&!["Completed","Cancelled"].includes(detailQuery.data.header.requirement_status)&&(line.line_status==="Excluded"?<Button size="sm" variant="outline" onClick={()=>openLine("restore",line)}>Restore</Button>:<><Button size="sm" variant="outline" onClick={()=>openLine("quantity",line)}>Qty/Waste</Button><Button size="sm" variant="outline" onClick={()=>openLine("substitute",line)}>Substitute</Button><Button size="sm" variant="outline" onClick={()=>openLine("exclude",line)}>Exclude</Button></>)}</div></td></tr>)}</tbody></table></div>
      <div className="rounded-2xl border"><div className="flex items-center gap-2 border-b bg-slate-50 px-4 py-3 font-semibold"><History className="h-4 w-4"/>Adjustment History</div>{!detailQuery.data.adjustments.length?<div className="p-5 text-sm text-slate-500">No adjustments recorded.</div>:<div className="divide-y">{detailQuery.data.adjustments.map(a=><div key={a.material_requirement_line_adjustment_id} className="p-4"><div className="flex flex-wrap justify-between gap-2"><strong>{a.adjustment_type}</strong><span className="text-xs text-slate-500">{new Date(a.created_at).toLocaleString("en-AU")}</span></div><p className="mt-1 text-sm">{a.adjustment_reason}</p><div className="mt-1 text-xs text-slate-500">Commercial impact: {a.commercial_impact} - Variation required: {a.variation_required?"Yes":"No"}</div></div>)}</div>}</div>
    </div>}</DialogContent></Dialog>

    <Dialog open={Boolean(dialog)} onOpenChange={o=>!o&&setDialog(null)}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{dialog?.type?.replace(/(^|_)(\w)/g,(_,a,b)=>`${a?" ":""}${b.toUpperCase()}`)}</DialogTitle></DialogHeader><div className="space-y-4">{["quantity","substitute","add"].includes(dialog?.type??"")&&<div className="grid gap-4 md:grid-cols-2">{["substitute","add"].includes(dialog?.type??"")&&<><F label="Product"><Select value={productId} onValueChange={v=>{setProductId(v);const p=lookups.data?.products.find(x=>x.product_id===v);if(p){setDescription(p.description||p.product_name);setUomCode(p.default_request_uom_code||p.base_uom_code||"");setBaseUomCode(p.base_uom_code||"");}}}><SelectTrigger><SelectValue placeholder="Select product"/></SelectTrigger><SelectContent>{lookups.data?.products.map(x=><SelectItem key={x.product_id} value={x.product_id}>{x.product_code} - {x.product_name}</SelectItem>)}</SelectContent></Select></F><F label="Project Area"><Select value={areaId} onValueChange={setAreaId}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{areasForSelectedRequirement.map(x=><SelectItem key={x.area_id} value={x.area_id}>{x.area_code} - {x.area_name}</SelectItem>)}</SelectContent></Select>{!areasForSelectedRequirement.length&&<p className="text-xs text-slate-500">No active areas found for this Material Requirement site.</p>}</F><F label="Requirement UOM"><Select value={uomCode} onValueChange={setUomCode}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{lookups.data?.uoms.map(x=><SelectItem key={x.uom_code} value={x.uom_code}>{x.uom_code} - {x.uom_name}</SelectItem>)}</SelectContent></Select></F><F label="Base UOM"><Select value={baseUomCode} onValueChange={setBaseUomCode}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{lookups.data?.uoms.map(x=><SelectItem key={x.uom_code} value={x.uom_code}>{x.uom_code} - {x.uom_name}</SelectItem>)}</SelectContent></Select></F></>}<F label="Quantity"><Input type="number" min="0" step="any" value={quantity} onChange={e=>setQuantity(e.target.value)}/></F><F label="Waste %"><Input type="number" min="0" value={waste} onChange={e=>setWaste(e.target.value)}/></F>{["substitute","add"].includes(dialog?.type??"")&&<div className="md:col-span-2"><F label="Description"><Textarea value={description} onChange={e=>setDescription(e.target.value)}/></F></div>}</div>}{dialog?.type==="header"&&<div className="grid gap-4 md:grid-cols-2"><F label="Required by"><Input type="date" value={headerDate} onChange={e=>setHeaderDate(e.target.value)}/></F>{isSourceSiteLocked?<div className="space-y-2"><Label>Source Site</Label><div className="rounded-md border bg-slate-50 px-3 py-2 text-sm font-medium">{selectedSourceSite ? `${selectedSourceSite.site_code} - ${selectedSourceSite.site_name}` : "-"}</div></div>:<F label="Site"><Select value={headerSite} onValueChange={setHeaderSite}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{lookups.data?.sites.map(x=><SelectItem key={x.site_id} value={x.site_id}>{x.site_code} - {x.site_name}</SelectItem>)}</SelectContent></Select></F>}<F label="Destination"><Select value={headerDestination} onValueChange={value => { setHeaderDestination(value); if (value !== "Warehouse") setHeaderLocation(""); }}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Site">Direct to Site</SelectItem><SelectItem value="Warehouse">Stock Location</SelectItem></SelectContent></Select></F>{headerDestination==="Warehouse"&&<F label="Stock Location"><Select value={headerLocation} onValueChange={setHeaderLocation}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{lookups.data?.locations.map(x=><SelectItem key={x.stock_location_id} value={x.stock_location_id}>{x.location_code} - {x.location_name}</SelectItem>)}</SelectContent></Select></F>}<div className="md:col-span-2"><F label="Notes"><Textarea value={headerNotes} onChange={e=>setHeaderNotes(e.target.value)}/></F></div></div>}{dialog?.type==="assign"&&<><F label="Responsible employee"><Select value={responsibleId} onValueChange={setResponsibleId}><SelectTrigger><SelectValue placeholder="Select employee"/></SelectTrigger><SelectContent>{lookups.data?.employees.map(x=><SelectItem key={x.employee_id} value={x.auth_user_id || `no-auth-${x.employee_id}`} disabled={!x.auth_user_id}>{employeeName(x)}{!x.auth_user_id ? " (No application account)" : ""}</SelectItem>)}</SelectContent></Select></F></>}{!["header","transition"].includes(dialog?.type??"")&&<F label="Reason"><Textarea value={reason} onChange={e=>setReason(e.target.value)}/></F>}{dialog?.type==="transition"&&<F label="Workflow note / cancellation reason"><Textarea value={headerNotes} onChange={e=>setHeaderNotes(e.target.value)}/></F>}<div className="flex justify-end gap-2"><Button variant="outline" onClick={()=>setDialog(null)}>Cancel</Button><Button onClick={()=>mutation.mutate()} disabled={mutation.isPending} className="bg-[#9E4B4B] text-white hover:bg-[#843e3e]">{mutation.isPending&&<Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Confirm</Button></div></div></DialogContent></Dialog>
  </div>;
}
function F({label,children}:{label:string;children:React.ReactNode}){return <div className="space-y-2"><Label>{label}</Label>{children}</div>}
function Info({label,value}:{label:string;value:string}){return <div><div className="text-xs uppercase text-slate-500">{label}</div><div className="font-medium">{value}</div></div>}
function State({title}:{title:string}){return <div className="flex min-h-56 items-center justify-center rounded-2xl border bg-white p-8 text-center text-slate-500"><XCircle className="mr-2 h-5 w-5"/>{title}</div>}

export default MaterialRequest;
