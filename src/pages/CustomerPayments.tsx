import { useMemo, useState } from "react";
import { CreditCard, Plus, Search } from "lucide-react";
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

const CustomerPayments = () => {
    const queryClient = useQueryClient();

    const [showAddDialog, setShowAddDialog] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const [invoiceId, setInvoiceId] = useState("");
    const [paymentDate, setPaymentDate] = useState("");
    const [paymentMethod, setPaymentMethod] =
        useState("Bank Transfer");
    const [amount, setAmount] = useState("");
    const [referenceNo, setReferenceNo] = useState("");
    const [notes, setNotes] = useState("");

    const { data: invoices = [] } = useQuery({
        queryKey: ["customer-invoices-for-payments"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("customer_invoices")
                .select(`
          customer_invoice_id,
          invoice_no,
          customer_id,
          project_id,
          invoice_status,
          total_amount,
          paid_amount,
          balance_amount,
          customers (
            customer_name
          ),
          projects (
            project_name
          )
        `)
                .eq("is_deleted", false)
                .order("created_at", {
                    ascending: false,
                });

            if (error) throw error;
            return data;
        },
    });

    const { data: payments = [] } = useQuery({
        queryKey: ["customer_payments"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("customer_payments")
                .select(`
          *,
          customers (
            customer_name
          ),
          customer_invoices (
            invoice_no
          )
        `)
                .eq("is_deleted", false)
                .order("created_at", {
                    ascending: false,
                });

            if (error) throw error;
            return data;
        },
    });

    const selectedInvoice = invoices.find(
        (invoice) =>
            invoice.customer_invoice_id === invoiceId
    );

    const createPayment = useMutation({
        mutationFn: async () => {
            if (!invoiceId)
                throw new Error("Please select invoice.");

            if (!paymentDate)
                throw new Error("Please select payment date.");

            const paymentAmount = Number(amount);

            if (paymentAmount <= 0)
                throw new Error("Invalid payment amount.");

            const invoiceTotal = Number(
                selectedInvoice?.total_amount || 0
            );

            const currentPaid = Number(
                selectedInvoice?.paid_amount || 0
            );

            const newPaidAmount =
                currentPaid + paymentAmount;

            const newBalance =
                invoiceTotal - newPaidAmount;

            let newStatus = "Partially Paid";

            if (newBalance <= 0) {
                newStatus = "Paid";
            }

            const { error: paymentError } =
                await supabase
                    .from("customer_payments")
                    .insert({
                        payment_no: `PAY-${Date.now()}`,
                        customer_id: selectedInvoice.customer_id,
                        payment_date: paymentDate,
                        payment_method: paymentMethod,
                        amount: paymentAmount,
                        reference_no: referenceNo || null,
                        notes: notes || null,
                        is_deleted: false,
                    });

            if (paymentError) throw paymentError;

            const { error: invoiceError } =
                await supabase
                    .from("customer_invoices")
                    .update({
                        paid_amount: newPaidAmount,
                        balance_amount: newBalance,
                        invoice_status: newStatus,
                    })
                    .eq(
                        "customer_invoice_id",
                        invoiceId
                    );

            if (invoiceError) throw invoiceError;
        },

        onSuccess: () => {
            toast.success(
                "Payment recorded successfully."
            );

            queryClient.invalidateQueries({
                queryKey: ["customer_payments"],
            });

            queryClient.invalidateQueries({
                queryKey:
                    ["customer-invoices-for-payments"],
            });

            queryClient.invalidateQueries({
                queryKey: ["customer_invoices"],
            });

            setShowAddDialog(false);

            setInvoiceId("");
            setPaymentDate("");
            setAmount("");
            setReferenceNo("");
            setNotes("");
        },

        onError: (error) => {
            toast.error(error.message);
        },
    });

    const filteredPayments = useMemo(() => {
        const keyword = searchTerm.toLowerCase();

        return payments.filter((payment) => {
            return (
                payment.customers?.customer_name
                    ?.toLowerCase()
                    .includes(keyword) ||
                payment.customer_invoices?.[0]?.invoice_no
                    ?.toLowerCase()
                    .includes(keyword) ||
                payment.payment_method
                    ?.toLowerCase()
                    .includes(keyword)
            );
        });
    }, [payments, searchTerm]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <CreditCard className="h-8 w-8 text-red-600" />
                        <h1 className="text-3xl font-bold">
                            Customer Payments
                        </h1>
                    </div>

                    <p className="text-slate-500 mt-1">
                        Record customer payments and
                        track outstanding balances.
                    </p>
                </div>

                <Button
                    onClick={() => setShowAddDialog(true)}
                    className="bg-red-600 hover:bg-red-700"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Record Payment
                </Button>
            </div>

            <Input
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) =>
                    setSearchTerm(e.target.value)
                }
            />

            <div className="bg-white rounded-xl border">
                {filteredPayments.length === 0 ? (
                    <div className="p-6 text-center text-slate-500">
                        No payments found.
                    </div>
                ) : (
                    filteredPayments.map((payment) => (
                        <div
                            key={payment.customer_payment_id}
                            className="p-4 border-b"
                        >
                            <div className="flex justify-between">
                                <div>
                                    <div className="font-semibold">
                                        {
                                            payment.customer_invoices?.[0]?.invoice_no
                                        }
                                    </div>

                                    <div className="text-sm text-slate-500">
                                        {
                                            payment.customers
                                                ?.customer_name
                                        }
                                    </div>

                                    <div className="text-sm text-slate-500">
                                        {payment.payment_method}
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="font-semibold">
                                        $
                                        {Number(
                                            payment.amount || 0
                                        ).toFixed(2)}
                                    </div>

                                    <div className="text-sm">
                                        {payment.payment_date}
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
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            Record Customer Payment
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-4">

                        <div className="col-span-2">
                            <Label>Invoice</Label>

                            <Select
                                value={invoiceId}
                                onValueChange={setInvoiceId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select invoice" />
                                </SelectTrigger>

                                <SelectContent>
                                    {invoices.map((invoice) => (
                                        <SelectItem
                                            key={
                                                invoice.customer_invoice_id
                                            }
                                            value={
                                                invoice.customer_invoice_id
                                            }
                                        >
                                            {invoice.invoice_no} -
                                            {
                                                invoice.customers
                                                    ?.customer_name
                                            }
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedInvoice && (
                            <div className="col-span-2 bg-slate-50 border rounded-xl p-4">
                                <div>
                                    Total :
                                    {" $"}
                                    {Number(
                                        selectedInvoice.total_amount
                                    ).toFixed(2)}
                                </div>

                                <div>
                                    Paid :
                                    {" $"}
                                    {Number(
                                        selectedInvoice.paid_amount
                                    ).toFixed(2)}
                                </div>

                                <div>
                                    Balance :
                                    {" $"}
                                    {Number(
                                        selectedInvoice.balance_amount
                                    ).toFixed(2)}
                                </div>
                            </div>
                        )}

                        <div>
                            <Label>Payment Date</Label>
                            <Input
                                type="date"
                                value={paymentDate}
                                onChange={(e) =>
                                    setPaymentDate(
                                        e.target.value
                                    )
                                }
                            />
                        </div>

                        <div>
                            <Label>Payment Method</Label>

                            <Select
                                value={paymentMethod}
                                onValueChange={
                                    setPaymentMethod
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="Bank Transfer">
                                        Bank Transfer
                                    </SelectItem>

                                    <SelectItem value="Cash">
                                        Cash
                                    </SelectItem>

                                    <SelectItem value="Cheque">
                                        Cheque
                                    </SelectItem>

                                    <SelectItem value="Credit Card">
                                        Credit Card
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Amount</Label>
                            <Input
                                type="number"
                                value={amount}
                                onChange={(e) =>
                                    setAmount(
                                        e.target.value
                                    )
                                }
                            />
                        </div>

                        <div>
                            <Label>Reference No</Label>
                            <Input
                                value={referenceNo}
                                onChange={(e) =>
                                    setReferenceNo(
                                        e.target.value
                                    )
                                }
                            />
                        </div>

                        <div className="col-span-2">
                            <Label>Notes</Label>

                            <Textarea
                                value={notes}
                                onChange={(e) =>
                                    setNotes(
                                        e.target.value
                                    )
                                }
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button
                            onClick={() =>
                                createPayment.mutate()
                            }
                            disabled={
                                createPayment.isPending
                            }
                        >
                            Save Payment
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CustomerPayments;