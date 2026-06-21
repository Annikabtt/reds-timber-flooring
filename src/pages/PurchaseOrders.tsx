import { useMemo, useState } from "react";
import { ShoppingCart, Plus, Search } from "lucide-react";
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

const PurchaseOrders = () => {
  const queryClient = useQueryClient();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [purchaseOrderNo, setPurchaseOrderNo] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [orderStatus, setOrderStatus] = useState("Draft");
  const [notes, setNotes] = useState("");

  const [productId, setProductId] = useState("");
  const [description, setDescription] = useState("");
  const [unitOfMeasure, setUnitOfMeasure] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [taxRate, setTaxRate] = useState("10");
  const [lineNotes, setLineNotes] = useState("");

  const numericQuantity = quantity ? Number(quantity) : 0;
  const numericUnitCost = unitCost ? Number(unitCost) : 0;
  const numericTaxRate = taxRate ? Number(taxRate) : 0;

  const subtotalAmount = numericQuantity * numericUnitCost;
  const taxAmount = subtotalAmount * (numericTaxRate / 100);
  const totalAmount = subtotalAmount + taxAmount;

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers-for-purchase-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select(`
          supplier_id,
          supplier_code,
          supplier_name
        `)
        .eq("is_deleted", false)
        .eq("is_active", true)
        .order("supplier_name", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-for-purchase-orders"],
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
    queryKey: ["sites-for-purchase-orders"],
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

  const { data: products = [] } = useQuery({
    queryKey: ["products-for-purchase-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          product_id,
          product_code,
          product_name,
          unit,
          description,
          cost_price
        `)
        .eq("is_deleted", false)
        .eq("is_active", true)
        .order("product_name", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ["purchase_orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select(`
          purchase_order_id,
          purchase_order_no,
          supplier_id,
          project_id,
          site_id,
          order_date,
          expected_delivery_date,
          order_status,
          subtotal_amount,
          tax_amount,
          total_amount,
          notes,
          created_at,
          suppliers (
            supplier_code,
            supplier_name
          ),
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
          purchase_order_lines (
            purchase_order_line_id,
            quantity,
            unit_of_measure,
            unit_cost,
            line_total,
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

  const resetForm = () => {
    setPurchaseOrderNo("");
    setSupplierId("");
    setProjectId("");
    setSiteId("");
    setOrderDate("");
    setExpectedDeliveryDate("");
    setOrderStatus("Draft");
    setNotes("");
    setProductId("");
    setDescription("");
    setUnitOfMeasure("");
    setQuantity("");
    setUnitCost("");
    setTaxRate("10");
    setLineNotes("");
  };

  const createPurchaseOrder = useMutation({
    mutationFn: async () => {
      if (!supplierId) throw new Error("Please select a supplier.");
      if (!projectId) throw new Error("Please select a project.");
      if (!siteId) throw new Error("Please select a project site.");
      if (!orderDate) throw new Error("Please select order date.");
      if (!productId) throw new Error("Please select product.");
      if (!quantity) throw new Error("Please enter quantity.");
      if (!unitCost) throw new Error("Please enter unit cost.");

      const { data: poData, error: poError } = await supabase
        .from("purchase_orders")
        .insert({
          purchase_order_no: purchaseOrderNo.trim() || null,
          supplier_id: supplierId,
          project_id: projectId,
          site_id: siteId,
          order_date: orderDate,
          expected_delivery_date: expectedDeliveryDate || null,
          order_status: orderStatus,
          subtotal_amount: subtotalAmount,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          notes: notes.trim() || null,
          is_deleted: false,
        })
        .select("purchase_order_id")
        .single();

      if (poError) throw poError;

      const { error: lineError } = await supabase
        .from("purchase_order_lines")
        .insert({
          purchase_order_id: poData.purchase_order_id,
          product_id: productId,
          line_no: 1,
          description: description.trim() || null,
          unit_of_measure: unitOfMeasure.trim() || null,
          quantity: numericQuantity,
          unit_cost: numericUnitCost,
          tax_rate: numericTaxRate,
          tax_amount: taxAmount,
          line_total: totalAmount,
          notes: lineNotes.trim() || null,
          is_deleted: false,
        });

      if (lineError) throw lineError;
    },
    onSuccess: () => {
      toast.success("Purchase order created successfully.");
      queryClient.invalidateQueries({ queryKey: ["purchase_orders"] });
      setShowAddDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const filteredPurchaseOrders = useMemo(() => {
    const keyword = searchTerm.toLowerCase();

    return purchaseOrders.filter((po) => {
      const supplierName = po.suppliers?.supplier_name || "";
      const projectName = po.projects?.project_name || "";
      const customerName = po.projects?.customers?.customer_name || "";
      const siteName = po.project_sites?.site_name || "";

      return (
        po.purchase_order_no?.toLowerCase().includes(keyword) ||
        po.order_status?.toLowerCase().includes(keyword) ||
        supplierName.toLowerCase().includes(keyword) ||
        projectName.toLowerCase().includes(keyword) ||
        customerName.toLowerCase().includes(keyword) ||
        siteName.toLowerCase().includes(keyword)
      );
    });
  }, [purchaseOrders, searchTerm]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-red-600" />
            <h1 className="text-3xl font-bold text-slate-900">
              Purchase Orders
            </h1>
          </div>
          <p className="text-slate-500 mt-1">
            Manage supplier purchase orders for project sites.
          </p>
        </div>

        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl shadow-lg shadow-red-200 transition-all flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add PO
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search by PO no, supplier, project, site, status..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-12 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500 px-4 py-3 border-b">
          <div className="col-span-2">PO</div>
          <div className="col-span-2">Supplier</div>
          <div className="col-span-3">Project</div>
          <div className="col-span-2">Site</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1">Date</div>
          <div className="col-span-1 text-right">Total</div>
        </div>

        {filteredPurchaseOrders.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No purchase orders found.
          </div>
        ) : (
          filteredPurchaseOrders.map((po) => (
            <div
              key={po.purchase_order_id}
              className="grid grid-cols-12 px-4 py-4 border-b last:border-b-0 hover:bg-slate-50 transition-colors"
            >
              <div className="col-span-2">
                <p className="font-semibold text-slate-900">
                  {po.purchase_order_no || "-"}
                </p>
                <p className="text-xs text-slate-500">
                  {po.purchase_order_lines?.length || 0} line(s)
                </p>
              </div>

              <div className="col-span-2 text-slate-700">
                <p>{po.suppliers?.supplier_name || "-"}</p>
                <p className="text-xs text-slate-500">
                  {po.suppliers?.supplier_code || "-"}
                </p>
              </div>

              <div className="col-span-3">
                <p className="font-medium text-slate-800">
                  {po.projects?.project_name || "-"}
                </p>
                <p className="text-xs text-slate-500">
                  {po.projects?.project_no || "-"} ·{" "}
                  {po.projects?.customers?.customer_name || "-"}
                </p>
              </div>

              <div className="col-span-2 text-slate-700">
                <p>{po.project_sites?.site_name || "-"}</p>
                <p className="text-xs text-slate-500">
                  Expected: {po.expected_delivery_date || "-"}
                </p>
              </div>

              <div className="col-span-1 text-slate-700">
                {po.order_status || "-"}
              </div>

              <div className="col-span-1 text-sm text-slate-700">
                {po.order_date || "-"}
              </div>

              <div className="col-span-1 text-right font-semibold text-slate-900">
                ${Number(po.total_amount || 0).toFixed(2)}
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Add Purchase Order</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <h3 className="font-semibold text-slate-800">PO Header</h3>
            </div>

            <div className="space-y-2">
              <Label>PO No</Label>
              <Input
                value={purchaseOrderNo}
                onChange={(e) => setPurchaseOrderNo(e.target.value)}
                placeholder="PO2606-00001"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={orderStatus} onValueChange={setOrderStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Sent">Sent</SelectItem>
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                  <SelectItem value="Partially Received">
                    Partially Received
                  </SelectItem>
                  <SelectItem value="Received">Received</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Supplier *</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem
                      key={supplier.supplier_id}
                      value={supplier.supplier_id}
                    >
                      {supplier.supplier_code || "-"} -{" "}
                      {supplier.supplier_name}
                    </SelectItem>
                  ))}
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
                onValueChange={setSiteId}
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
              <Label>Order Date *</Label>
              <Input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Expected Delivery Date</Label>
              <Input
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Total Amount</Label>
              <Input value={`$${totalAmount.toFixed(2)}`} readOnly />
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
              <h3 className="font-semibold text-slate-800">PO Line</h3>
              <p className="text-sm text-slate-500">
                Phase 1 supports one product line per PO. Multiple lines can be
                added in the next step.
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
                    setUnitCost(
                      selectedProduct.cost_price
                        ? String(selectedProduct.cost_price)
                        : ""
                    );
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
              <Label>Quantity *</Label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Unit Cost *</Label>
              <Input
                type="number"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Tax Rate %</Label>
              <Input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Subtotal</Label>
              <Input value={`$${subtotalAmount.toFixed(2)}`} readOnly />
            </div>

            <div className="space-y-2">
              <Label>Tax Amount</Label>
              <Input value={`$${taxAmount.toFixed(2)}`} readOnly />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Line Notes</Label>
              <Input
                value={lineNotes}
                onChange={(e) => setLineNotes(e.target.value)}
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
              onClick={() => createPurchaseOrder.mutate()}
              disabled={createPurchaseOrder.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {createPurchaseOrder.isPending ? "Saving..." : "Save PO"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseOrders;