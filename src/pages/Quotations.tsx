import { useMemo, useState } from "react";
import { FileText, Plus, Search } from "lucide-react";
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

const Quotations = () => {
  const queryClient = useQueryClient();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [quotationNo, setQuotationNo] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [projectSiteId, setProjectSiteId] = useState("");
  const [priceBookId, setPriceBookId] = useState("");
  const [quotationSegment, setQuotationSegment] = useState("Retail");
  const [quotationSource, setQuotationSource] = useState("");
  const [quotationStatus, setQuotationStatus] = useState("Draft");
  const [issueDate, setIssueDate] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

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

  const { data: customers = [] } = useQuery({
    queryKey: ["customers-for-quotations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select(`
          customer_id,
          customer_code,
          customer_name,
          customer_type,
          price_book_id
        `)
        .eq("is_deleted", false)
        .eq("is_active", true)
        .order("customer_name", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const { data: projectSites = [] } = useQuery({
    queryKey: ["project-sites-for-quotations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_sites")
        .select(`
          site_id,
          site_code,
          site_name,
          project_id,
          projects (
            project_no,
            project_name,
            customer_id,
            customers (
              customer_name
            )
          )
        `)
        .eq("is_deleted", false)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: projectAreas = [] } = useQuery({
    queryKey: ["project-areas-for-quotations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_areas")
        .select(`
          area_id,
          project_id,
          site_id,
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

  const { data: priceBooks = [] } = useQuery({
    queryKey: ["price-books-for-quotations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_books")
        .select(`
          price_book_id,
          price_book_code,
          price_book_name
        `)
        .eq("is_deleted", false)
        .eq("is_active", true)
        .order("price_book_name", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products-for-quotations"],
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

  const { data: priceBookLines = [] } = useQuery({
    queryKey: ["price-book-lines-for-quotations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_book_lines")
        .select(`
          price_book_line_id,
          price_book_id,
          product_id,
          unit_price,
          minimum_price
        `)
        .eq("is_deleted", false)
        .eq("is_active", true);

      if (error) throw error;
      return data;
    },
  });

  const { data: quotations = [] } = useQuery({
    queryKey: ["quotations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotations")
        .select(`
          quotation_id,
          quotation_no,
          customer_id,
          project_site_id,
          price_book_id,
          quotation_segment,
          quotation_source,
          quotation_status,
          revision_no,
          issue_date,
          valid_until,
          subtotal_amount,
          discount_amount,
          tax_amount,
          total_amount,
          notes,
          internal_notes,
          created_at,
          customers (
            customer_code,
            customer_name,
            customer_type
          ),
          project_sites (
            site_code,
            site_name,
            projects (
              project_no,
              project_name
            )
          ),
          price_books (
            price_book_code,
            price_book_name
          ),
          quotation_lines (
            quotation_line_id,
            quantity,
            unit_price,
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
    return projectSites.filter(
      (site) => site.projects?.customer_id === customerId
    );
  }, [projectSites, customerId]);

  const filteredAreas = useMemo(() => {
    return projectAreas.filter((area) => area.site_id === projectSiteId);
  }, [projectAreas, projectSiteId]);

  const resetForm = () => {
    setQuotationNo("");
    setCustomerId("");
    setProjectSiteId("");
    setPriceBookId("");
    setQuotationSegment("Retail");
    setQuotationSource("");
    setQuotationStatus("Draft");
    setIssueDate("");
    setValidUntil("");
    setNotes("");
    setInternalNotes("");
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

  const createQuotation = useMutation({
    mutationFn: async () => {
      if (!customerId) throw new Error("Please select customer.");
      if (!issueDate) throw new Error("Please select issue date.");
      if (!productId) throw new Error("Please select product.");
      if (!quantity) throw new Error("Please enter quantity.");
      if (!unitPrice) throw new Error("Please enter unit price.");

      const { data: quotationData, error: quotationError } = await supabase
        .from("quotations")
        .insert({
          quotation_no: quotationNo.trim() || null,
          customer_id: customerId,
          project_site_id: projectSiteId || null,
          price_book_id: priceBookId || null,
          quotation_segment: quotationSegment,
          quotation_source: quotationSource.trim() || null,
          quotation_status: quotationStatus,
          revision_no: 0,
          issue_date: issueDate,
          valid_until: validUntil || null,
          subtotal_amount: taxableAmount,
          discount_amount: discountAmount,
          tax_amount: taxAmount,
          total_amount: lineTotal,
          notes: notes.trim() || null,
          internal_notes: internalNotes.trim() || null,
          is_active: true,
          is_deleted: false,
        })
        .select("quotation_id")
        .single();

      if (quotationError) throw quotationError;

      const { error: lineError } = await supabase.from("quotation_lines").insert({
        quotation_id: quotationData.quotation_id,
        product_id: productId,
        project_area_id: projectAreaId || null,
        line_no: 1,
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
        is_optional: false,
        is_deleted: false,
      });

      if (lineError) throw lineError;
    },
    onSuccess: () => {
      toast.success("Quotation created successfully.");
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      setShowAddDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const filteredQuotations = useMemo(() => {
    const keyword = searchTerm.toLowerCase();

    return quotations.filter((quotation) => {
      const customerName = quotation.customers?.customer_name || "";
      const siteName = quotation.project_sites?.site_name || "";
      const projectName = quotation.project_sites?.projects?.project_name || "";
      const priceBookName = quotation.price_books?.price_book_name || "";

      return (
        quotation.quotation_no?.toLowerCase().includes(keyword) ||
        quotation.quotation_status?.toLowerCase().includes(keyword) ||
        quotation.quotation_segment?.toLowerCase().includes(keyword) ||
        customerName.toLowerCase().includes(keyword) ||
        siteName.toLowerCase().includes(keyword) ||
        projectName.toLowerCase().includes(keyword) ||
        priceBookName.toLowerCase().includes(keyword)
      );
    });
  }, [quotations, searchTerm]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-red-600" />
            <h1 className="text-3xl font-bold text-slate-900">Quotations</h1>
          </div>
          <p className="text-slate-500 mt-1">
            Manage customer quotations with pricing, tax, and margin.
          </p>
        </div>

        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl shadow-lg shadow-red-200 transition-all flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Quotation
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search by quotation, customer, project, site, status..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-12 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500 px-4 py-3 border-b">
          <div className="col-span-2">Quotation</div>
          <div className="col-span-2">Customer</div>
          <div className="col-span-2">Site</div>
          <div className="col-span-2">Price Book</div>
          <div className="col-span-1">Segment</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1">Lines</div>
          <div className="col-span-1 text-right">Total</div>
        </div>

        {filteredQuotations.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No quotations found.
          </div>
        ) : (
          filteredQuotations.map((quotation) => (
            <div
              key={quotation.quotation_id}
              className="grid grid-cols-12 px-4 py-4 border-b last:border-b-0 hover:bg-slate-50 transition-colors"
            >
              <div className="col-span-2">
                <p className="font-semibold text-slate-900">
                  {quotation.quotation_no || "-"}
                </p>
                <p className="text-xs text-slate-500">
                  Rev {quotation.revision_no ?? 0}
                </p>
              </div>

              <div className="col-span-2 text-slate-700">
                {quotation.customers?.customer_name || "-"}
              </div>

              <div className="col-span-2 text-slate-700">
                <p>{quotation.project_sites?.site_name || "-"}</p>
                <p className="text-xs text-slate-500">
                  {quotation.project_sites?.projects?.project_name || "-"}
                </p>
              </div>

              <div className="col-span-2 text-slate-700">
                {quotation.price_books?.price_book_name || "-"}
              </div>

              <div className="col-span-1 text-slate-700">
                {quotation.quotation_segment || "-"}
              </div>

              <div className="col-span-1 text-slate-700">
                {quotation.quotation_status || "-"}
              </div>

              <div className="col-span-1 text-slate-700">
                {quotation.quotation_lines?.length || 0}
              </div>

              <div className="col-span-1 text-right font-semibold text-slate-900">
                ${Number(quotation.total_amount || 0).toFixed(2)}
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Add Quotation</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <h3 className="font-semibold text-slate-800">
                Quotation Header
              </h3>
            </div>

            <div className="space-y-2">
              <Label>Quotation No</Label>
              <Input
                value={quotationNo}
                onChange={(e) => setQuotationNo(e.target.value)}
                placeholder="QT2606-00001"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={quotationStatus}
                onValueChange={setQuotationStatus}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Issued">Issued</SelectItem>
                  <SelectItem value="Accepted">Accepted</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Customer *</Label>
              <Select
                value={customerId}
                onValueChange={(value) => {
                  setCustomerId(value);
                  setProjectSiteId("");

                  const selectedCustomer = customers.find(
                    (customer) => customer.customer_id === value
                  );

                  setPriceBookId(selectedCustomer?.price_book_id || "");
                  setQuotationSegment(selectedCustomer?.customer_type || "Retail");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem
                      key={customer.customer_id}
                      value={customer.customer_id}
                    >
                      {customer.customer_code || "-"} - {customer.customer_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Project Site</Label>
              <Select
                value={projectSiteId}
                onValueChange={(value) => {
                  setProjectSiteId(value);
                  setProjectAreaId("");
                }}
                disabled={!customerId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      customerId ? "Select project site" : "Select customer first"
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
              <Label>Price Book</Label>
              <Select value={priceBookId} onValueChange={setPriceBookId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select price book" />
                </SelectTrigger>
                <SelectContent>
                  {priceBooks.map((book) => (
                    <SelectItem
                      key={book.price_book_id}
                      value={book.price_book_id}
                    >
                      {book.price_book_code || "-"} - {book.price_book_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Segment</Label>
              <Input
                value={quotationSegment}
                onChange={(e) => setQuotationSegment(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Source</Label>
              <Input
                value={quotationSource}
                onChange={(e) => setQuotationSource(e.target.value)}
                placeholder="Walk-in / Website / Referral"
              />
            </div>

            <div className="space-y-2">
              <Label>Issue Date *</Label>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Valid Until</Label>
              <Input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>

            <div className="col-span-2 border-t pt-4">
              <h3 className="font-semibold text-slate-800">Quotation Line</h3>
              <p className="text-sm text-slate-500">
                Phase 1 supports one line per quotation. Multiple lines can be added later.
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

                  const selectedPrice = priceBookLines.find(
                    (line) =>
                      line.product_id === value &&
                      line.price_book_id === priceBookId
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
                      selectedPrice?.unit_price
                        ? String(selectedPrice.unit_price)
                        : selectedProduct.default_sell_price
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
              <Select
                value={projectAreaId}
                onValueChange={setProjectAreaId}
                disabled={!projectSiteId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      projectSiteId ? "Select area" : "Select site first"
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
              <Label>Customer Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Internal Notes</Label>
              <Textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
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
              onClick={() => createQuotation.mutate()}
              disabled={createQuotation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {createQuotation.isPending ? "Saving..." : "Save Quotation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Quotations;