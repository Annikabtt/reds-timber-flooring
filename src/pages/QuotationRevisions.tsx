import { useMemo, useState } from "react";
import { FileClock, Plus, Search } from "lucide-react";
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

const QuotationRevisions = () => {
  const queryClient = useQueryClient();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [quotationId, setQuotationId] = useState("");
  const [revisionReason, setRevisionReason] = useState("");
  const [revisionNotes, setRevisionNotes] = useState("");

  const [productId, setProductId] = useState("");
  const [projectAreaId, setProjectAreaId] = useState("");
  const [description, setDescription] = useState("");
  const [unitOfMeasure, setUnitOfMeasure] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [taxRate, setTaxRate] = useState("10");
  const [costPrice, setCostPrice] = useState("0");
  const [lineNotes, setLineNotes] = useState("");

  const numericQuantity = Number(quantity || 0);
  const numericUnitPrice = Number(unitPrice || 0);
  const numericDiscountPercent = Number(discountPercent || 0);
  const numericTaxRate = Number(taxRate || 0);
  const numericCostPrice = Number(costPrice || 0);

  const grossLineAmount = numericQuantity * numericUnitPrice;
  const discountAmount = grossLineAmount * (numericDiscountPercent / 100);
  const taxableAmount = grossLineAmount - discountAmount;
  const taxAmount = taxableAmount * (numericTaxRate / 100);
  const lineTotal = taxableAmount + taxAmount;
  const marginAmount = taxableAmount - numericQuantity * numericCostPrice;
  const marginPercent =
    taxableAmount > 0 ? (marginAmount / taxableAmount) * 100 : 0;

  const { data: quotations = [] } = useQuery({
    queryKey: ["quotations-for-revisions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotations")
        .select(`
          quotation_id,
          quotation_no,
          revision_no,
          customer_id,
          project_site_id,
          price_book_id,
          quotation_status,
          total_amount,
          customers (
            customer_name
          ),
          project_sites (
            site_name,
            projects (
              project_name
            )
          ),
          quotation_lines (
            quotation_line_id,
            product_id,
            project_area_id,
            description,
            unit_of_measure,
            quantity,
            unit_price,
            discount_percent,
            tax_rate,
            cost_price,
            notes
          )
        `)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products-for-revisions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          product_id,
          product_code,
          product_name,
          unit,
          description,
          cost_price,
          default_sell_price
        `)
        .eq("is_deleted", false)
        .eq("is_active", true)
        .order("product_name", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const { data: projectAreas = [] } = useQuery({
    queryKey: ["project-areas-for-revisions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_areas")
        .select(`
          area_id,
          area_code,
          area_name,
          unit_of_measure,
          estimated_quantity
        `)
        .eq("is_deleted", false)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: revisions = [] } = useQuery({
    queryKey: ["quotation_revisions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotation_revisions")
        .select(`
          revision_id,
          quotation_id,
          revision_no,
          revision_reason,
          revision_notes,
          subtotal_amount,
          discount_amount,
          tax_amount,
          total_amount,
          created_at,
          quotations (
            quotation_no,
            customers (
              customer_name
            )
          ),
          quotation_revision_lines (
            revision_line_id,
            quantity,
            unit_price,
            line_total,
            products (
              product_code,
              product_name
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const selectedQuotation = quotations.find(
    (quotation) => quotation.quotation_id === quotationId
  );

  const resetForm = () => {
    setQuotationId("");
    setRevisionReason("");
    setRevisionNotes("");
    setProductId("");
    setProjectAreaId("");
    setDescription("");
    setUnitOfMeasure("");
    setQuantity("");
    setUnitPrice("");
    setDiscountPercent("0");
    setTaxRate("10");
    setCostPrice("0");
    setLineNotes("");
  };

  const createRevision = useMutation({
    mutationFn: async () => {
      if (!quotationId) throw new Error("Please select quotation.");
      if (!revisionReason.trim()) throw new Error("Please enter revision reason.");
      if (!productId) throw new Error("Please select product.");
      if (!quantity) throw new Error("Please enter quantity.");
      if (!unitPrice) throw new Error("Please enter unit price.");

      const nextRevisionNo = (selectedQuotation?.revision_no || 0) + 1;

      const { data: revisionData, error: revisionError } = await supabase
        .from("quotation_revisions")
        .insert({
          quotation_id: quotationId,
          revision_no: nextRevisionNo,
          revision_reason: revisionReason.trim(),
          revision_notes: revisionNotes.trim() || null,
          subtotal_amount: taxableAmount,
          discount_amount: discountAmount,
          tax_amount: taxAmount,
          total_amount: lineTotal,
        })
        .select("revision_id")
        .single();

      if (revisionError) throw revisionError;

      const originalLine = selectedQuotation?.quotation_lines?.[0];

      const { error: lineError } = await supabase
        .from("quotation_revision_lines")
        .insert({
          revision_id: revisionData.revision_id,
          quotation_line_id: originalLine?.quotation_line_id || null,
          line_no: 1,
          product_id: productId,
          project_area_id: projectAreaId || null,
          description: description.trim() || null,
          unit_of_measure: unitOfMeasure.trim() || null,
          quantity: numericQuantity,
          unit_price: numericUnitPrice,
          discount_percent: numericDiscountPercent,
          discount_amount: discountAmount,
          tax_rate: numericTaxRate,
          tax_amount: taxAmount,
          line_total: lineTotal,
          cost_price: numericCostPrice,
          margin_amount: marginAmount,
          margin_percent: marginPercent,
          notes: lineNotes.trim() || null,
        });

      if (lineError) throw lineError;

      const { error: quotationUpdateError } = await supabase
        .from("quotations")
        .update({
          revision_no: nextRevisionNo,
          subtotal_amount: taxableAmount,
          discount_amount: discountAmount,
          tax_amount: taxAmount,
          total_amount: lineTotal,
        })
        .eq("quotation_id", quotationId);

      if (quotationUpdateError) throw quotationUpdateError;
    },
    onSuccess: () => {
      toast.success("Quotation revision created successfully.");
      queryClient.invalidateQueries({ queryKey: ["quotation_revisions"] });
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotations-for-revisions"] });
      setShowAddDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const filteredRevisions = useMemo(() => {
    const keyword = searchTerm.toLowerCase();

    return revisions.filter((revision) => {
      const quotationNo = revision.quotations?.quotation_no || "";
      const customerName = revision.quotations?.customers?.customer_name || "";

      return (
        quotationNo.toLowerCase().includes(keyword) ||
        customerName.toLowerCase().includes(keyword) ||
        revision.revision_reason?.toLowerCase().includes(keyword) ||
        revision.revision_notes?.toLowerCase().includes(keyword)
      );
    });
  }, [revisions, searchTerm]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <FileClock className="h-8 w-8 text-red-600" />
            <h1 className="text-3xl font-bold text-slate-900">
              Quotation Revisions
            </h1>
          </div>
          <p className="text-slate-500 mt-1">
            Manage quotation revisions before customer acceptance.
          </p>
        </div>

        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl shadow-lg shadow-red-200 transition-all flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Revision
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search by quotation, customer, or reason..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-12 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500 px-4 py-3 border-b">
          <div className="col-span-2">Quotation</div>
          <div className="col-span-1">Rev</div>
          <div className="col-span-3">Reason</div>
          <div className="col-span-2">Lines</div>
          <div className="col-span-2">Created</div>
          <div className="col-span-2 text-right">Total</div>
        </div>

        {filteredRevisions.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No quotation revisions found.
          </div>
        ) : (
          filteredRevisions.map((revision) => (
            <div
              key={revision.revision_id}
              className="grid grid-cols-12 px-4 py-4 border-b last:border-b-0 hover:bg-slate-50 transition-colors"
            >
              <div className="col-span-2">
                <p className="font-semibold text-slate-900">
                  {revision.quotations?.quotation_no || "-"}
                </p>
                <p className="text-xs text-slate-500">
                  {revision.quotations?.customers?.customer_name || "-"}
                </p>
              </div>

              <div className="col-span-1 text-slate-700">
                {revision.revision_no}
              </div>

              <div className="col-span-3 text-slate-700">
                {revision.revision_reason || "-"}
              </div>

              <div className="col-span-2 text-sm text-slate-700">
                {(revision.quotation_revision_lines || [])
                  .slice(0, 2)
                  .map((line) => (
                    <p key={line.revision_line_id}>
                      {line.products?.product_name || "-"} ·{" "}
                      {line.quantity ?? "-"}
                    </p>
                  ))}
              </div>

              <div className="col-span-2 text-slate-700">
                {revision.created_at
                  ? new Date(revision.created_at).toLocaleDateString()
                  : "-"}
              </div>

              <div className="col-span-2 text-right font-semibold text-slate-900">
                ${Number(revision.total_amount || 0).toFixed(2)}
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Add Quotation Revision</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Quotation *</Label>
              <Select
                value={quotationId}
                onValueChange={(value) => {
                  setQuotationId(value);

                  const quotation = quotations.find(
                    (item) => item.quotation_id === value
                  );

                  const firstLine = quotation?.quotation_lines?.[0];

                  if (firstLine) {
                    setProductId(firstLine.product_id || "");
                    setProjectAreaId(firstLine.project_area_id || "");
                    setDescription(firstLine.description || "");
                    setUnitOfMeasure(firstLine.unit_of_measure || "");
                    setQuantity(firstLine.quantity ? String(firstLine.quantity) : "");
                    setUnitPrice(firstLine.unit_price ? String(firstLine.unit_price) : "");
                    setDiscountPercent(
                      firstLine.discount_percent
                        ? String(firstLine.discount_percent)
                        : "0"
                    );
                    setTaxRate(firstLine.tax_rate ? String(firstLine.tax_rate) : "10");
                    setCostPrice(firstLine.cost_price ? String(firstLine.cost_price) : "0");
                    setLineNotes(firstLine.notes || "");
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select quotation" />
                </SelectTrigger>
                <SelectContent>
                  {quotations.map((quotation) => (
                    <SelectItem
                      key={quotation.quotation_id}
                      value={quotation.quotation_id}
                    >
                      {quotation.quotation_no || "-"} -{" "}
                      {quotation.customers?.customer_name || "-"} - Rev{" "}
                      {quotation.revision_no || 0}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedQuotation && (
              <div className="col-span-2 rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700">
                <p>
                  <strong>Current Rev:</strong>{" "}
                  {selectedQuotation.revision_no || 0}
                </p>
                <p>
                  <strong>New Rev:</strong>{" "}
                  {(selectedQuotation.revision_no || 0) + 1}
                </p>
                <p>
                  <strong>Current Total:</strong> $
                  {Number(selectedQuotation.total_amount || 0).toFixed(2)}
                </p>
              </div>
            )}

            <div className="col-span-2 space-y-2">
              <Label>Revision Reason *</Label>
              <Input
                value={revisionReason}
                onChange={(e) => setRevisionReason(e.target.value)}
                placeholder="Customer requested material change"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Revision Notes</Label>
              <Textarea
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                rows={2}
              />
            </div>

            <div className="col-span-2 border-t pt-4">
              <h3 className="font-semibold text-slate-800">Revision Line</h3>
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
                    setCostPrice(
                      selectedProduct.cost_price
                        ? String(selectedProduct.cost_price)
                        : "0"
                    );
                    setUnitPrice(
                      selectedProduct.default_sell_price
                        ? String(selectedProduct.default_sell_price)
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
              <Label>Project Area</Label>
              <Select value={projectAreaId} onValueChange={setProjectAreaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent>
                  {projectAreas.map((area) => (
                    <SelectItem key={area.area_id} value={area.area_id}>
                      {area.area_code || "-"} - {area.area_name}
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
              <Label>Unit Price *</Label>
              <Input
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Discount %</Label>
              <Input
                type="number"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Tax %</Label>
              <Input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Cost Price</Label>
              <Input
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Line Total</Label>
              <Input value={`$${lineTotal.toFixed(2)}`} readOnly />
            </div>

            <div className="space-y-2">
              <Label>Margin</Label>
              <Input
                value={`$${marginAmount.toFixed(2)} / ${marginPercent.toFixed(2)}%`}
                readOnly
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

            <div className="col-span-2 space-y-2">
              <Label>Line Notes</Label>
              <Textarea
                value={lineNotes}
                onChange={(e) => setLineNotes(e.target.value)}
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
              onClick={() => createRevision.mutate()}
              disabled={createRevision.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {createRevision.isPending ? "Saving..." : "Save Revision"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuotationRevisions;