import { useMemo, useState } from "react";
import { Receipt, Plus, Search } from "lucide-react";
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

const CustomerInvoices = () => {
  const queryClient = useQueryClient();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [invoiceNo, setInvoiceNo] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [invoiceStatus, setInvoiceStatus] = useState("Draft");
  const [notes, setNotes] = useState("");

  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [taxRate, setTaxRate] = useState("10");

  const [sourceType, setSourceType] = useState("Manual");
  const [sourceAmount, setSourceAmount] = useState("");

  const numericQty = Number(quantity || 0);
  const numericUnitPrice = Number(unitPrice || 0);
  const numericTaxRate = Number(taxRate || 0);

  const subtotalAmount = numericQty * numericUnitPrice;
  const taxAmount = subtotalAmount * (numericTaxRate / 100);
  const totalAmount = subtotalAmount + taxAmount;

  const { data: customers = [] } = useQuery({
    queryKey: ["customers-for-invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select(`
          customer_id,
          customer_code,
          customer_name
        `)
        .eq("is_deleted", false)
        .eq("is_active", true)
        .order("customer_name");

      if (error) throw error;
      return data;
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-for-invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          project_id,
          project_no,
          project_name,
          customer_id
        `)
        .eq("is_deleted", false)
        .order("project_name");

      if (error) throw error;
      return data;
    },
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["customer_invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_invoices")
        .select(`
          customer_invoice_id,
          invoice_no,
          customer_id,
          project_id,
          invoice_date,
          due_date,
          invoice_status,
          subtotal_amount,
          tax_amount,
          total_amount,
          paid_amount,
          balance_amount,
          notes,
          xero_exported,
          created_at,

          customers (
            customer_code,
            customer_name
          ),

          projects (
            project_no,
            project_name
          ),

          customer_invoice_items (
            customer_invoice_item_id,
            description,
            quantity,
            unit_price,
            line_total
          )
        `)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredProjects = useMemo(() => {
    return projects.filter(
      (project) => project.customer_id === customerId
    );
  }, [projects, customerId]);

  const createInvoice = useMutation({
    mutationFn: async () => {
      if (!customerId)
        throw new Error("Please select customer.");

      if (!invoiceDate)
        throw new Error("Please select invoice date.");

      if (!description.trim())
        throw new Error("Please enter description.");

      const { data: invoiceData, error: invoiceError } =
        await supabase
          .from("customer_invoices")
          .insert({
            invoice_no: invoiceNo || null,
            customer_id: customerId,
            project_id: projectId || null,
            invoice_date: invoiceDate,
            due_date: dueDate || null,
            invoice_status: invoiceStatus,
            subtotal_amount: subtotalAmount,
            tax_amount: taxAmount,
            total_amount: totalAmount,
            paid_amount: 0,
            balance_amount: totalAmount,
            notes: notes || null,
            xero_exported: false,
            is_deleted: false,
          })
          .select("customer_invoice_id")
          .single();

      if (invoiceError) throw invoiceError;

      const { error: itemError } = await supabase
        .from("customer_invoice_items")
        .insert({
          customer_invoice_id:
            invoiceData.customer_invoice_id,
          line_no: 1,
          description,
          quantity: numericQty,
          unit_price: numericUnitPrice,
          tax_rate: numericTaxRate,
          tax_amount: taxAmount,
          line_total: totalAmount,
        });

      if (itemError) throw itemError;

      const { error: sourceError } = await supabase
        .from("invoice_sources")
        .insert({
          customer_invoice_id:
            invoiceData.customer_invoice_id,
          source_type: sourceType,
          source_id: null,
          source_amount:
            Number(sourceAmount || totalAmount),
        });

      if (sourceError) throw sourceError;
    },

    onSuccess: () => {
      toast.success("Invoice created successfully");

      queryClient.invalidateQueries({
        queryKey: ["customer_invoices"],
      });

      setShowAddDialog(false);
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });

  const filteredInvoices = useMemo(() => {
    const keyword = searchTerm.toLowerCase();

    return invoices.filter((invoice) => {
      return (
        invoice.invoice_no
          ?.toLowerCase()
          .includes(keyword) ||
        invoice.customers?.customer_name
          ?.toLowerCase()
          .includes(keyword) ||
        invoice.projects?.project_name
          ?.toLowerCase()
          .includes(keyword) ||
        invoice.invoice_status
          ?.toLowerCase()
          .includes(keyword)
      );
    });
  }, [invoices, searchTerm]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Receipt className="h-8 w-8 text-red-600" />
            <h1 className="text-3xl font-bold">
              Customer Invoices
            </h1>
          </div>

          <p className="text-slate-500 mt-1">
            Manage customer invoices and revenue.
          </p>
        </div>

        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-red-600 hover:bg-red-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Invoice
        </Button>
      </div>

      <Input
        placeholder="Search invoices..."
        value={searchTerm}
        onChange={(e) =>
          setSearchTerm(e.target.value)
        }
      />

      <div className="bg-white rounded-xl border">
        {filteredInvoices.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            No invoices found.
          </div>
        ) : (
          filteredInvoices.map((invoice) => (
            <div
              key={invoice.customer_invoice_id}
              className="p-4 border-b"
            >
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">
                    {invoice.invoice_no || "-"}
                  </div>

                  <div className="text-sm text-slate-500">
                    {
                      invoice.customers
                        ?.customer_name
                    }
                  </div>

                  <div className="text-sm text-slate-500">
                    {
                      invoice.projects
                        ?.project_name
                    }
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-semibold">
                    $
                    {Number(
                      invoice.total_amount || 0
                    ).toFixed(2)}
                  </div>

                  <div className="text-sm">
                    {invoice.invoice_status}
                  </div>

                  <div className="text-xs text-slate-500">
                    Balance $
                    {Number(
                      invoice.balance_amount || 0
                    ).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Add Customer Invoice
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">

            <div className="space-y-2">
              <Label>Invoice No</Label>
              <Input
                value={invoiceNo}
                onChange={(e) =>
                  setInvoiceNo(e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={invoiceStatus}
                onValueChange={setInvoiceStatus}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="Draft">
                    Draft
                  </SelectItem>
                  <SelectItem value="Issued">
                    Issued
                  </SelectItem>
                  <SelectItem value="Partially Paid">
                    Partially Paid
                  </SelectItem>
                  <SelectItem value="Paid">
                    Paid
                  </SelectItem>
                  <SelectItem value="Overdue">
                    Overdue
                  </SelectItem>
                  <SelectItem value="Cancelled">
                    Cancelled
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Customer</Label>
              <Select
                value={customerId}
                onValueChange={(value) => {
                  setCustomerId(value);
                  setProjectId("");
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
                      {customer.customer_code} -{" "}
                      {customer.customer_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Project</Label>
              <Select
                value={projectId}
                onValueChange={setProjectId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>

                <SelectContent>
                  {filteredProjects.map((project) => (
                    <SelectItem
                      key={project.project_id}
                      value={project.project_id}
                    >
                      {project.project_no} -{" "}
                      {project.project_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Invoice Date</Label>
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) =>
                  setInvoiceDate(e.target.value)
                }
              />
            </div>

            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) =>
                  setDueDate(e.target.value)
                }
              />
            </div>

            <div className="col-span-2 border-t pt-4">
              <h3 className="font-semibold">
                Invoice Item
              </h3>
            </div>

            <div className="col-span-2">
              <Label>Description</Label>
              <Input
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
              />
            </div>

            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) =>
                  setQuantity(e.target.value)
                }
              />
            </div>

            <div>
              <Label>Unit Price</Label>
              <Input
                type="number"
                value={unitPrice}
                onChange={(e) =>
                  setUnitPrice(e.target.value)
                }
              />
            </div>

            <div>
              <Label>Tax %</Label>
              <Input
                type="number"
                value={taxRate}
                onChange={(e) =>
                  setTaxRate(e.target.value)
                }
              />
            </div>

            <div>
              <Label>Total</Label>
              <Input
                value={`$${totalAmount.toFixed(2)}`}
                readOnly
              />
            </div>

            <div>
              <Label>Source Type</Label>
              <Select
                value={sourceType}
                onValueChange={setSourceType}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="Manual">
                    Manual
                  </SelectItem>
                  <SelectItem value="Quotation">
                    Quotation
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Source Amount</Label>
              <Input
                type="number"
                value={sourceAmount}
                onChange={(e) =>
                  setSourceAmount(e.target.value)
                }
              />
            </div>

            <div className="col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) =>
                  setNotes(e.target.value)
                }
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() =>
                createInvoice.mutate()
              }
              disabled={createInvoice.isPending}
            >
              Save Invoice
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerInvoices;