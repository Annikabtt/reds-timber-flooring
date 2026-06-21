import { useMemo, useState } from "react";
import { PackagePlus, Plus, Search } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const StockRequests = () => {
  const queryClient = useQueryClient();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [stockRequestNo, setStockRequestNo] = useState("");
  const [projectId, setProjectId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [requestDate, setRequestDate] = useState("");
  const [requiredDate, setRequiredDate] = useState("");
  const [requestStatus, setRequestStatus] = useState("Draft");
  const [notes, setNotes] = useState("");

  const [productId, setProductId] = useState("");
  const [description, setDescription] = useState("");
  const [unitOfMeasure, setUnitOfMeasure] = useState("");
  const [requestedQuantity, setRequestedQuantity] = useState("");
  const [approvedQuantity, setApprovedQuantity] = useState("");
  const [itemNotes, setItemNotes] = useState("");

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-for-stock-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          project_id,
          project_no,
          project_name,
          customers (
            customer_name
          )
        `)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: sites = [] } = useQuery({
    queryKey: ["sites-for-stock-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_sites")
        .select(`
          site_id,
          project_id,
          site_code,
          site_name
        `)
        .eq("is_deleted", false)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: areas = [] } = useQuery({
    queryKey: ["areas-for-stock-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_areas")
        .select(`
          area_id,
          project_id,
          site_id,
          area_code,
          area_name
        `)
        .eq("is_deleted", false)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products-for-stock-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          product_id,
          product_code,
          product_name,
          unit,
          description
        `)
        .eq("is_deleted", false)
        .eq("is_active", true)
        .order("product_name", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const { data: stockRequests = [] } = useQuery({
    queryKey: ["stock_requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_requests")
        .select(`
          stock_request_id,
          stock_request_no,
          project_id,
          site_id,
          area_id,
          request_date,
          required_date,
          request_status,
          notes,
          created_at,
          projects (
            project_no,
            project_name,
            customers (
              customer_name
            )
          ),
          project_sites (
            site_code,
            site_name
          ),
          project_areas (
            area_code,
            area_name
          ),
          stock_request_items (
            stock_request_item_id,
            requested_quantity,
            approved_quantity,
            unit_of_measure,
            products (
              product_code,
              product_name
            )
          )
        `)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredSites = useMemo(() => {
    return sites.filter((site) => site.project_id === projectId);
  }, [sites, projectId]);

  const filteredAreas = useMemo(() => {
    return areas.filter(
      (area) => area.project_id === projectId && area.site_id === siteId
    );
  }, [areas, projectId, siteId]);

  const resetForm = () => {
    setStockRequestNo("");
    setProjectId("");
    setSiteId("");
    setAreaId("");
    setRequestDate("");
    setRequiredDate("");
    setRequestStatus("Draft");
    setNotes("");
    setProductId("");
    setDescription("");
    setUnitOfMeasure("");
    setRequestedQuantity("");
    setApprovedQuantity("");
    setItemNotes("");
  };

  const createStockRequest = useMutation({
    mutationFn: async () => {
      if (!projectId) throw new Error("Please select a project.");
      if (!siteId) throw new Error("Please select a project site.");
      if (!areaId) throw new Error("Please select a project area.");
      if (!requestDate) throw new Error("Please select request date.");
      if (!productId) throw new Error("Please select product.");
      if (!requestedQuantity) throw new Error("Please enter requested quantity.");

      const { data: requestData, error: requestError } = await supabase
        .from("stock_requests")
        .insert({
          stock_request_no: stockRequestNo.trim() || null,
          project_id: projectId,
          site_id: siteId,
          area_id: areaId,
          request_date: requestDate,
          required_date: requiredDate || null,
          request_status: requestStatus,
          notes: notes.trim() || null,
          is_deleted: false,
        })
        .select("stock_request_id")
        .single();

      if (requestError) throw requestError;

      const { error: itemError } = await supabase
        .from("stock_request_items")
        .insert({
          stock_request_id: requestData.stock_request_id,
          product_id: productId,
          line_no: 1,
          description: description.trim() || null,
          unit_of_measure: unitOfMeasure.trim() || null,
          requested_quantity: Number(requestedQuantity),
          approved_quantity: approvedQuantity ? Number(approvedQuantity) : null,
          notes: itemNotes.trim() || null,
          is_deleted: false,
        });

      if (itemError) throw itemError;
    },
    onSuccess: () => {
      toast.success("Stock request created successfully.");
      queryClient.invalidateQueries({ queryKey: ["stock_requests"] });
      setShowAddDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const filteredStockRequests = useMemo(() => {
    const keyword = searchTerm.toLowerCase();

    return stockRequests.filter((request) => {
      const projectName = request.projects?.project_name || "";
      const customerName = request.projects?.customers?.customer_name || "";
      const siteName = request.project_sites?.site_name || "";
      const areaName = request.project_areas?.area_name || "";

      return (
        request.stock_request_no?.toLowerCase().includes(keyword) ||
        request.request_status?.toLowerCase().includes(keyword) ||
        projectName.toLowerCase().includes(keyword) ||
        customerName.toLowerCase().includes(keyword) ||
        siteName.toLowerCase().includes(keyword) ||
        areaName.toLowerCase().includes(keyword)
      );
    });
  }, [stockRequests, searchTerm]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <PackagePlus className="h-8 w-8 text-red-600" />
            <h1 className="text-3xl font-bold text-slate-900">
              Stock Requests
            </h1>
          </div>
          <p className="text-slate-500 mt-1">
            Manage material requests from project sites.
          </p>
        </div>

        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl shadow-lg shadow-red-200 transition-all flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Request
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search by request no, project, site, area, status..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-12 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500 px-4 py-3 border-b">
          <div className="col-span-2">Request</div>
          <div className="col-span-3">Project</div>
          <div className="col-span-2">Site / Area</div>
          <div className="col-span-2">Dates</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-2">Items</div>
        </div>

        {filteredStockRequests.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No stock requests found.
          </div>
        ) : (
          filteredStockRequests.map((request) => (
            <div
              key={request.stock_request_id}
              className="grid grid-cols-12 px-4 py-4 border-b last:border-b-0 hover:bg-slate-50 transition-colors"
            >
              <div className="col-span-2">
                <p className="font-semibold text-slate-900">
                  {request.stock_request_no || "-"}
                </p>
                <p className="text-xs text-slate-500">
                  {request.stock_request_items?.length || 0} item(s)
                </p>
              </div>

              <div className="col-span-3">
                <p className="font-medium text-slate-800">
                  {request.projects?.project_name || "-"}
                </p>
                <p className="text-xs text-slate-500">
                  {request.projects?.project_no || "-"} ·{" "}
                  {request.projects?.customers?.customer_name || "-"}
                </p>
              </div>

              <div className="col-span-2 text-slate-700">
                <p>{request.project_sites?.site_name || "-"}</p>
                <p className="text-xs text-slate-500">
                  {request.project_areas?.area_name || "-"}
                </p>
              </div>

              <div className="col-span-2 text-sm text-slate-700">
                <p>Request: {request.request_date || "-"}</p>
                <p>Required: {request.required_date || "-"}</p>
              </div>

              <div className="col-span-1 text-slate-700">
                {request.request_status || "-"}
              </div>

              <div className="col-span-2 text-sm text-slate-700">
                {(request.stock_request_items || []).slice(0, 2).map((item) => (
                  <p key={item.stock_request_item_id}>
                    {item.products?.product_name || "-"} ·{" "}
                    {item.requested_quantity ?? "-"}{" "}
                    {item.unit_of_measure || ""}
                  </p>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Add Stock Request</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <h3 className="font-semibold text-slate-800">Request Header</h3>
            </div>

            <div className="space-y-2">
              <Label>Request No</Label>
              <Input
                value={stockRequestNo}
                onChange={(e) => setStockRequestNo(e.target.value)}
                placeholder="SR2606-00001"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={requestStatus} onValueChange={setRequestStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Submitted">Submitted</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Ordered">Ordered</SelectItem>
                  <SelectItem value="Received">Received</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Project *</Label>
              <Select
                value={projectId}
                onValueChange={(value) => {
                  setProjectId(value);
                  setSiteId("");
                  setAreaId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem
                      key={project.project_id}
                      value={project.project_id}
                    >
                      {project.project_no || "-"} - {project.project_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Project Site *</Label>
              <Select
                value={siteId}
                onValueChange={(value) => {
                  setSiteId(value);
                  setAreaId("");
                }}
                disabled={!projectId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      projectId ? "Select project site" : "Select project first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredSites.map((site) => (
                    <SelectItem key={site.site_id} value={site.site_id}>
                      {site.site_code || "-"} - {site.site_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Project Area *</Label>
              <Select
                value={areaId}
                onValueChange={setAreaId}
                disabled={!siteId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      siteId ? "Select project area" : "Select site first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredAreas.map((area) => (
                    <SelectItem key={area.area_id} value={area.area_id}>
                      {area.area_code || "-"} - {area.area_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Request Date *</Label>
              <Input
                type="date"
                value={requestDate}
                onChange={(e) => setRequestDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Required Date</Label>
              <Input
                type="date"
                value={requiredDate}
                onChange={(e) => setRequiredDate(e.target.value)}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Header Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <div className="col-span-2 border-t pt-4">
              <h3 className="font-semibold text-slate-800">
                Request Item
              </h3>
              <p className="text-sm text-slate-500">
                Phase 1 supports one item per request. Multiple items can be added in the next step.
              </p>
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Product *</Label>
              <Select
                value={productId}
                onValueChange={(value) => {
                  setProductId(value);
                  const selectedProduct = products.find(
                    (product) => product.product_id === value
                  );

                  if (selectedProduct) {
                    setDescription(selectedProduct.description || "");
                    setUnitOfMeasure(selectedProduct.unit || "");
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem
                      key={product.product_id}
                      value={product.product_id}
                    >
                      {product.product_code || "-"} - {product.product_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Unit</Label>
              <Input
                value={unitOfMeasure}
                onChange={(e) => setUnitOfMeasure(e.target.value)}
                placeholder="sqm"
              />
            </div>

            <div className="space-y-2">
              <Label>Requested Quantity *</Label>
              <Input
                type="number"
                value={requestedQuantity}
                onChange={(e) => setRequestedQuantity(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Approved Quantity</Label>
              <Input
                type="number"
                value={approvedQuantity}
                onChange={(e) => setApprovedQuantity(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Item Notes</Label>
              <Input
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                resetForm();
              }}
            >
              Cancel
            </Button>

            <Button
              onClick={() => createStockRequest.mutate()}
              disabled={createStockRequest.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {createStockRequest.isPending ? "Saving..." : "Save Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockRequests;