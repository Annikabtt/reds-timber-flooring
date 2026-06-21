import { useMemo, useState } from "react";
import { WalletCards, Plus, Search } from "lucide-react";
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

const PayrollPayments = () => {
  const queryClient = useQueryClient();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [payrollPaymentNo, setPayrollPaymentNo] = useState("");
  const [payrollPeriodId, setPayrollPeriodId] = useState("");
  const [payrollEntryId, setPayrollEntryId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");
  const [referenceNo, setReferenceNo] = useState("");
  const [status, setStatus] = useState("Draft");
  const [notes, setNotes] = useState("");
  const [lineNotes, setLineNotes] = useState("");

  const { data: periods = [] } = useQuery({
    queryKey: ["payroll-periods-for-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payroll_periods")
        .select(`
          payroll_period_id,
          period_no,
          period_name,
          start_date,
          end_date,
          status
        `)
        .eq("is_deleted", false)
        .order("start_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: entries = [] } = useQuery({
    queryKey: ["payroll-entries-for-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payroll_entries")
        .select(`
          payroll_entry_id,
          payroll_period_id,
          employee_id,
          regular_hours,
          overtime_hours,
          gross_amount,
          net_amount,
          status,
          employees (
            employee_code,
            display_name,
            first_name,
            last_name
          ),
          payroll_periods (
            period_no,
            period_name
          )
        `)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["payroll_payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payroll_payments")
        .select(`
          payroll_payment_id,
          payroll_payment_no,
          payroll_period_id,
          payment_date,
          payment_method,
          total_amount,
          reference_no,
          notes,
          status,
          created_at,
          payroll_periods (
            period_no,
            period_name,
            start_date,
            end_date
          ),
          payroll_payment_lines (
            payroll_payment_line_id,
            payroll_entry_id,
            employee_id,
            amount,
            notes,
            employees (
              employee_code,
              display_name,
              first_name,
              last_name
            ),
            payroll_entries (
              net_amount,
              status
            )
          )
        `)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredEntries = useMemo(() => {
    return entries.filter(
      (entry) =>
        entry.payroll_period_id === payrollPeriodId &&
        entry.status !== "Paid" &&
        entry.status !== "Cancelled"
    );
  }, [entries, payrollPeriodId]);

  const selectedEntry = entries.find(
    (entry) => entry.payroll_entry_id === payrollEntryId
  );

  const selectedAmount = Number(selectedEntry?.net_amount || 0);

  const resetForm = () => {
    setPayrollPaymentNo("");
    setPayrollPeriodId("");
    setPayrollEntryId("");
    setEmployeeId("");
    setPaymentDate("");
    setPaymentMethod("Bank Transfer");
    setReferenceNo("");
    setStatus("Draft");
    setNotes("");
    setLineNotes("");
  };

  const createPayment = useMutation({
    mutationFn: async () => {
      if (!payrollPeriodId) throw new Error("Please select payroll period.");
      if (!payrollEntryId) throw new Error("Please select payroll entry.");
      if (!employeeId) throw new Error("Employee is missing from payroll entry.");
      if (!paymentDate) throw new Error("Please select payment date.");

      const { data: paymentData, error: paymentError } = await supabase
        .from("payroll_payments")
        .insert({
          payroll_payment_no: payrollPaymentNo.trim() || null,
          payroll_period_id: payrollPeriodId,
          payment_date: paymentDate,
          payment_method: paymentMethod,
          total_amount: selectedAmount,
          reference_no: referenceNo.trim() || null,
          notes: notes.trim() || null,
          status,
          is_deleted: false,
        })
        .select("payroll_payment_id")
        .single();

      if (paymentError) throw paymentError;

      const { error: lineError } = await supabase
        .from("payroll_payment_lines")
        .insert({
          payroll_payment_id: paymentData.payroll_payment_id,
          payroll_entry_id: payrollEntryId,
          employee_id: employeeId,
          amount: selectedAmount,
          notes: lineNotes.trim() || null,
          is_deleted: false,
        });

      if (lineError) throw lineError;

      if (status === "Paid") {
        const { error: entryError } = await supabase
          .from("payroll_entries")
          .update({ status: "Paid" })
          .eq("payroll_entry_id", payrollEntryId);

        if (entryError) throw entryError;
      }
    },
    onSuccess: () => {
      toast.success("Payroll payment created successfully.");
      queryClient.invalidateQueries({ queryKey: ["payroll_payments"] });
      queryClient.invalidateQueries({
        queryKey: ["payroll-entries-for-payments"],
      });
      queryClient.invalidateQueries({ queryKey: ["payroll_entries"] });
      setShowAddDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const filteredPayments = useMemo(() => {
    const keyword = searchTerm.toLowerCase();

    return payments.filter((payment) => {
      const periodNo = payment.payroll_periods?.period_no || "";
      const periodName = payment.payroll_periods?.period_name || "";

      return (
        payment.payroll_payment_no?.toLowerCase().includes(keyword) ||
        payment.payment_method?.toLowerCase().includes(keyword) ||
        payment.reference_no?.toLowerCase().includes(keyword) ||
        payment.status?.toLowerCase().includes(keyword) ||
        periodNo.toLowerCase().includes(keyword) ||
        periodName.toLowerCase().includes(keyword)
      );
    });
  }, [payments, searchTerm]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <WalletCards className="h-8 w-8 text-red-600" />
            <h1 className="text-3xl font-bold text-slate-900">
              Payroll Payments
            </h1>
          </div>
          <p className="text-slate-500 mt-1">
            Record bank transfers and payroll payment lines.
          </p>
        </div>

        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl shadow-lg shadow-red-200 transition-all flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Payment
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search by payment no, period, method, reference, or status..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-12 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500 px-4 py-3 border-b">
          <div className="col-span-2">Payment</div>
          <div className="col-span-2">Period</div>
          <div className="col-span-2">Date / Method</div>
          <div className="col-span-2">Reference</div>
          <div className="col-span-2">Lines</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1 text-right">Total</div>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No payroll payments found.
          </div>
        ) : (
          filteredPayments.map((payment) => (
            <div
              key={payment.payroll_payment_id}
              className="grid grid-cols-12 px-4 py-4 border-b last:border-b-0 hover:bg-slate-50 transition-colors"
            >
              <div className="col-span-2">
                <p className="font-semibold text-slate-900">
                  {payment.payroll_payment_no || "-"}
                </p>
                <p className="text-xs text-slate-500">
                  {payment.payroll_payment_lines?.length || 0} line(s)
                </p>
              </div>

              <div className="col-span-2 text-slate-700">
                <p>{payment.payroll_periods?.period_no || "-"}</p>
                <p className="text-xs text-slate-500">
                  {payment.payroll_periods?.period_name || "-"}
                </p>
              </div>

              <div className="col-span-2 text-slate-700">
                <p>{payment.payment_date || "-"}</p>
                <p className="text-xs text-slate-500">
                  {payment.payment_method || "-"}
                </p>
              </div>

              <div className="col-span-2 text-slate-700">
                {payment.reference_no || "-"}
              </div>

              <div className="col-span-2 text-sm text-slate-700">
                {(payment.payroll_payment_lines || []).slice(0, 2).map((line) => {
                  const employeeName =
                    line.employees?.display_name ||
                    `${line.employees?.first_name || ""} ${
                      line.employees?.last_name || ""
                    }`.trim() ||
                    "-";

                  return (
                    <p key={line.payroll_payment_line_id}>
                      {employeeName} · ${Number(line.amount || 0).toFixed(2)}
                    </p>
                  );
                })}
              </div>

              <div className="col-span-1 text-slate-700">
                {payment.status || "-"}
              </div>

              <div className="col-span-1 text-right font-semibold text-slate-900">
                ${Number(payment.total_amount || 0).toFixed(2)}
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Add Payroll Payment</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Payment No</Label>
              <Input
                value={payrollPaymentNo}
                onChange={(e) => setPayrollPaymentNo(e.target.value)}
                placeholder="PAY2606-00001"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Payroll Period *</Label>
              <Select
                value={payrollPeriodId}
                onValueChange={(value) => {
                  setPayrollPeriodId(value);
                  setPayrollEntryId("");
                  setEmployeeId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payroll period" />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((period) => (
                    <SelectItem
                      key={period.payroll_period_id}
                      value={period.payroll_period_id}
                    >
                      {period.period_no || "-"} - {period.period_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Payroll Entry *</Label>
              <Select
                value={payrollEntryId}
                disabled={!payrollPeriodId}
                onValueChange={(value) => {
                  setPayrollEntryId(value);

                  const entry = entries.find(
                    (item) => item.payroll_entry_id === value
                  );

                  setEmployeeId(entry?.employee_id || "");
                }}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      payrollPeriodId
                        ? "Select payroll entry"
                        : "Select period first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredEntries.map((entry) => {
                    const employeeName =
                      entry.employees?.display_name ||
                      `${entry.employees?.first_name || ""} ${
                        entry.employees?.last_name || ""
                      }`.trim() ||
                      "-";

                    return (
                      <SelectItem
                        key={entry.payroll_entry_id}
                        value={entry.payroll_entry_id}
                      >
                        {employeeName} - ${Number(entry.net_amount || 0).toFixed(2)}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Payment Date *</Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select
                value={paymentMethod}
                onValueChange={setPaymentMethod}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reference No</Label>
              <Input
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="Bank reference"
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Amount</Label>
              <Input value={`$${selectedAmount.toFixed(2)}`} readOnly />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Payment Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
              onClick={() => createPayment.mutate()}
              disabled={createPayment.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {createPayment.isPending ? "Saving..." : "Save Payment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayrollPayments;