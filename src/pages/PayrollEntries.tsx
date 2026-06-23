import { useMemo, useState } from "react";
import { ReceiptText, Plus, Search } from "lucide-react";
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

const PayrollEntries = () => {
  const queryClient = useQueryClient();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [payrollPeriodId, setPayrollPeriodId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [payMethod, setPayMethod] = useState("Hourly");
  const [payRate, setPayRate] = useState("");
  const [regularHours, setRegularHours] = useState("");
  const [overtimeHours, setOvertimeHours] = useState("");
  const [overtimeMultiplier, setOvertimeMultiplier] = useState("1.5");
  const [baseAmount, setBaseAmount] = useState("");
  const [overtimeAmount, setOvertimeAmount] = useState("");
  const [allowanceAmount, setAllowanceAmount] = useState("0");
  const [deductionAmount, setDeductionAmount] = useState("0");
  const [taxAmount, setTaxAmount] = useState("0");
  const [status, setStatus] = useState("Draft");
  const [notes, setNotes] = useState("");

  const grossAmount =
    Number(baseAmount || 0) +
    Number(overtimeAmount || 0) +
    Number(allowanceAmount || 0);

  const netAmount =
    grossAmount -
    Number(deductionAmount || 0) -
    Number(taxAmount || 0);

  const { data: periods = [] } = useQuery({
    queryKey: ["payroll_periods-for-entries"],
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

  const { data: employees = [] } = useQuery({
    queryKey: ["employees-for-payroll-entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select(`
          employee_id,
          employee_code,
          display_name,
          first_name,
          last_name,
          employment_type,
          pay_method,
          pay_rate
        `)
        .eq("is_deleted", false)
        .eq("is_active", true)
        .order("display_name", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
  const { data: approvedTimeLogs = [] } = useQuery({
    queryKey: ["approved-work-time-logs-for-payroll"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_time_logs")
        .select(`
          work_time_log_id,
          employee_id,
          work_date,
          regular_hours,
          overtime_hours,
          approved,
          employees (
            employee_code,
            display_name,
            first_name,
            last_name
          )
        `)
        .eq("is_deleted", false)
        .eq("approved", true)
        .order("work_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
  const { data: entries = [] } = useQuery({
    queryKey: ["payroll_entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payroll_entries")
        .select(`
          payroll_entry_id,
          payroll_period_id,
          employee_id,
          pay_method,
          regular_hours,
          overtime_hours,
          base_amount,
          overtime_amount,
          allowance_amount,
          deduction_amount,
          gross_amount,
          tax_amount,
          net_amount,
          status,
          approved_by,
          approved_at,
          notes,
          created_at,
          payroll_periods (
            period_no,
            period_name,
            start_date,
            end_date
          ),
          employees (
            employee_code,
            display_name,
            first_name,
            last_name
          )
        `)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => {
    setPayrollPeriodId("");
    setEmployeeId("");
    setPayMethod("Hourly");
    setPayRate("");
    setRegularHours("");
    setOvertimeHours("");
    setOvertimeMultiplier("1.5");
    setBaseAmount("");
    setOvertimeAmount("");
    setAllowanceAmount("0");
    setDeductionAmount("0");
    setTaxAmount("0");
    setStatus("Draft");
    setNotes("");
  };
  const calculateHoursFromTimeLogs = () => {
    if (!payrollPeriodId) {
      toast.error("Please select payroll period first.");
      return;
    }

    if (!employeeId) {
      toast.error("Please select employee first.");
      return;
    }

    const selectedPeriod = periods.find(
      (period) => period.payroll_period_id === payrollPeriodId
    );

    if (!selectedPeriod) {
      toast.error("Selected payroll period not found.");
      return;
    }

    const matchedLogs = approvedTimeLogs.filter((log) => {
      const workDate = new Date(log.work_date);
      const start = new Date(selectedPeriod.start_date);
      const end = new Date(selectedPeriod.end_date);

      return (
        log.employee_id === employeeId &&
        workDate >= start &&
        workDate <= end
      );
    });

    const totalRegularHours = matchedLogs.reduce(
      (sum, log) => sum + Number(log.regular_hours || 0),
      0
    );

    const totalOvertimeHours = matchedLogs.reduce(
      (sum, log) => sum + Number(log.overtime_hours || 0),
      0
    );

    if (matchedLogs.length === 0) {
      toast.error(
        "No approved time logs found for this employee in this payroll period."
      );
      return;
    }

    if (matchedLogs.length === 0) {
      toast.error(
        "No approved time logs found for this employee in this payroll period."
      );
      return;
    }

    setRegularHours(totalRegularHours.toFixed(2));
    setOvertimeHours(totalOvertimeHours.toFixed(2));

    toast.success(
      `Calculated from ${matchedLogs.length} approved time logs.`
    );
  };
  const calculateBaseAmount = () => {
    const rate = Number(payRate || 0);
    const regular = Number(regularHours || 0);

    if (!employeeId) {
      toast.error("Please select employee first.");
      return;
    }

    if (!payMethod) {
      toast.error("Please select pay method first.");
      return;
    }

    if (!rate) {
      toast.error("Pay rate is missing.");
      return;
    }

    let calculatedBaseAmount = 0;

    if (payMethod === "Hourly") {
      calculatedBaseAmount = regular * rate;
    }

    if (payMethod === "Daily") {
      calculatedBaseAmount = regular * rate;
    }

    if (payMethod === "Weekly" || payMethod === "Monthly") {
      calculatedBaseAmount = rate;
    }

    setBaseAmount(calculatedBaseAmount.toFixed(2));
    const overtime = Number(overtimeHours || 0);

    const multiplier = Number(overtimeMultiplier || 1.5);

    const calculatedOvertimeAmount =
      overtime * rate * multiplier;

    setOvertimeAmount(
      calculatedOvertimeAmount.toFixed(2)
    );

    toast.success("Base amount calculated.");
  };
  const createEntry = useMutation({
    mutationFn: async () => {
      if (!payrollPeriodId) throw new Error("Please select payroll period.");
      if (!employeeId) throw new Error("Please select employee.");
      if (Number(regularHours || 0) <= 0) {
        throw new Error("Regular hours must be greater than 0.");
      }

      if (Number(baseAmount || 0) <= 0) {
        throw new Error("Base amount must be greater than 0. Please calculate amount first.");
      }

      if (netAmount <= 0) {
        throw new Error("Net amount must be greater than 0.");
      }
      const duplicatedEntry = entries.find(
        (entry) =>
          entry.payroll_period_id === payrollPeriodId &&
          entry.employee_id === employeeId
      );

      if (duplicatedEntry) {
        throw new Error(
          "Payroll entry already exists for this employee in this period."
        );
      }
      const { error } = await supabase.from("payroll_entries").insert({
        payroll_period_id: payrollPeriodId,
        employee_id: employeeId,
        pay_method: payMethod,
        regular_hours: regularHours ? Number(regularHours) : 0,
        overtime_hours: overtimeHours ? Number(overtimeHours) : 0,
        base_amount: baseAmount ? Number(baseAmount) : 0,
        overtime_amount: overtimeAmount ? Number(overtimeAmount) : 0,
        allowance_amount: allowanceAmount ? Number(allowanceAmount) : 0,
        deduction_amount: deductionAmount ? Number(deductionAmount) : 0,
        gross_amount: grossAmount,
        tax_amount: taxAmount ? Number(taxAmount) : 0,
        net_amount: netAmount,
        status,
        notes: notes.trim() || null,
        is_deleted: false,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payroll entry created successfully.");
      queryClient.invalidateQueries({ queryKey: ["payroll_entries"] });
      setShowAddDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  const submitPayrollEntry = useMutation({
    mutationFn: async (payrollEntryId: string) => {
      const { error } = await supabase
        .from("payroll_entries")
        .update({
          status: "Submitted",
        })
        .eq("payroll_entry_id", payrollEntryId)
        .eq("status", "Draft");

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll_entries"] });
      toast.success("Payroll entry submitted.");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  const approvePayrollEntry = useMutation({
    mutationFn: async (payrollEntryId: string) => {
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData.user?.id;

      if (!currentUserId) {
        throw new Error("User not found.");
      }

      const { error } = await supabase
        .from("payroll_entries")
        .update({
          status: "Approved",
          approved_by: currentUserId,
          approved_at: new Date().toISOString(),
        })
        .eq("payroll_entry_id", payrollEntryId)
        .eq("status", "Submitted");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll_entries"] });
      toast.success("Payroll entry approved.");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  const markPayrollEntryPaid = useMutation({
    mutationFn: async (payrollEntryId: string) => {
      const { error } = await supabase
        .from("payroll_entries")
        .update({
          status: "Paid",
        })
        .eq("payroll_entry_id", payrollEntryId)
        .eq("status", "Approved");

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll_entries"] });
      toast.success("Payroll entry marked as paid.");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  const cancelPayrollEntry = useMutation({
    mutationFn: async (payrollEntryId: string) => {
      const { error } = await supabase
        .from("payroll_entries")
        .update({
          status: "Cancelled",
        })
        .eq("payroll_entry_id", payrollEntryId)
        .in("status", ["Draft", "Submitted"]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll_entries"] });
      toast.success("Payroll entry cancelled.");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  const filteredEntries = useMemo(() => {
    const keyword = searchTerm.toLowerCase();

    return entries.filter((entry) => {
      const employeeName =
        entry.employees?.display_name ||
        `${entry.employees?.first_name || ""} ${entry.employees?.last_name || ""
        }`;

      return (
        employeeName.toLowerCase().includes(keyword) ||
        entry.employees?.employee_code?.toLowerCase().includes(keyword) ||
        entry.payroll_periods?.period_no?.toLowerCase().includes(keyword) ||
        entry.payroll_periods?.period_name?.toLowerCase().includes(keyword) ||
        entry.status?.toLowerCase().includes(keyword)
      );
    });
  }, [entries, searchTerm]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <ReceiptText className="h-8 w-8 text-red-600" />
            <h1 className="text-3xl font-bold text-slate-900">
              Payroll Entries
            </h1>
          </div>
          <p className="text-slate-500 mt-1">
            Create weekly payroll entries for hourly workers.
          </p>
        </div>

        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl shadow-lg shadow-red-200 transition-all flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Entry
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-slate-500">
            Total Entries
          </div>
          <div className="text-2xl font-bold">
            {entries.length}
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-slate-500">
            Draft
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {
              entries.filter(
                (entry) => entry.status === "Draft"
              ).length
            }
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-slate-500">
            Gross Total
          </div>
          <div className="text-2xl font-bold text-green-600">
            $
            {entries
              .reduce(
                (sum, entry) =>
                  sum + Number(entry.gross_amount || 0),
                0
              )
              .toFixed(2)}
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-slate-500">
            Net Total
          </div>
          <div className="text-2xl font-bold text-red-600">
            $
            {entries
              .reduce(
                (sum, entry) =>
                  sum + Number(entry.net_amount || 0),
                0
              )
              .toFixed(2)}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search by employee, period, or status..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-12 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500 px-4 py-3 border-b">
          <div className="col-span-2">Employee</div>
          <div className="col-span-2">Period</div>
          <div className="col-span-1">Regular</div>
          <div className="col-span-1">OT</div>
          <div className="col-span-2">Gross</div>
          <div className="col-span-2">Net</div>
          <div className="col-span-1">Method</div>
          <div className="col-span-1">Status / Action</div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No payroll entries found.
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const employeeName =
              entry.employees?.display_name ||
              `${entry.employees?.first_name || ""} ${entry.employees?.last_name || ""
                }`.trim() ||
              "-";

            return (
              <div
                key={entry.payroll_entry_id}
                className="grid grid-cols-12 px-4 py-4 border-b last:border-b-0 hover:bg-slate-50 transition-colors"
              >
                <div className="col-span-2">
                  <p className="font-semibold text-slate-900">
                    {employeeName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {entry.employees?.employee_code || "-"}
                  </p>
                </div>

                <div className="col-span-2 text-slate-700">
                  <p>{entry.payroll_periods?.period_no || "-"}</p>
                  <p className="text-xs text-slate-500">
                    {entry.payroll_periods?.period_name || "-"}
                  </p>
                </div>

                <div className="col-span-1 text-slate-700">
                  {entry.regular_hours ?? 0}
                </div>

                <div className="col-span-1 text-slate-700">
                  {entry.overtime_hours ?? 0}
                </div>

                <div className="col-span-2 font-semibold text-slate-900">
                  ${Number(entry.gross_amount || 0).toFixed(2)}
                </div>

                <div className="col-span-2 font-semibold text-slate-900">
                  ${Number(entry.net_amount || 0).toFixed(2)}
                </div>

                <div className="col-span-1 text-slate-700">
                  {entry.pay_method || "-"}
                </div>

                <div className="col-span-1 space-y-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${entry.status === "Submitted"
                      ? "bg-orange-100 text-orange-700"
                      : entry.status === "Approved"
                        ? "bg-blue-100 text-blue-700"
                        : entry.status === "Paid"
                          ? "bg-green-100 text-green-700"
                          : entry.status === "Cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-slate-100 text-slate-700"
                      }`}
                  >
                    {entry.status || "Draft"}
                  </span>

                  {entry.status === "Draft" && (
                    <Button
                      size="sm"
                      onClick={() => submitPayrollEntry.mutate(entry.payroll_entry_id)}
                      disabled={submitPayrollEntry.isPending}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      Submit
                    </Button>
                  )}

                  {entry.status === "Submitted" && (
                    <Button
                      size="sm"
                      onClick={() => approvePayrollEntry.mutate(entry.payroll_entry_id)}
                      disabled={approvePayrollEntry.isPending}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Approve
                    </Button>
                  )}

                  {entry.status === "Approved" && (
                    <Button
                      size="sm"
                      onClick={() => markPayrollEntryPaid.mutate(entry.payroll_entry_id)}
                      disabled={markPayrollEntryPaid.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Mark Paid
                    </Button>
                  )}

                  {(entry.status === "Draft" || entry.status === "Submitted") && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => cancelPayrollEntry.mutate(entry.payroll_entry_id)}
                      disabled={cancelPayrollEntry.isPending}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Payroll Entry</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Payroll Period *</Label>
              <Select
                value={payrollPeriodId}
                onValueChange={setPayrollPeriodId}
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
              <Label>Employee *</Label>
              <Select
                value={employeeId}
                onValueChange={(value) => {
                  setEmployeeId(value);

                  const selectedEmployee = employees.find(
                    (employee) => employee.employee_id === value
                  );

                  if (selectedEmployee?.pay_method) {
                    setPayMethod(selectedEmployee.pay_method);
                  }

                  if (selectedEmployee?.pay_rate !== null && selectedEmployee?.pay_rate !== undefined) {
                    setPayRate(String(selectedEmployee.pay_rate));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => {
                    const name =
                      employee.display_name ||
                      `${employee.first_name || ""} ${employee.last_name || ""
                        }`.trim();

                    return (
                      <SelectItem
                        key={employee.employee_id}
                        value={employee.employee_id}
                      >
                        {employee.employee_code || "-"} - {name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Pay Method</Label>
              <Select value={payMethod} onValueChange={setPayMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select pay method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hourly">Hourly</SelectItem>
                  <SelectItem value="Daily">Daily</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              <div className="mt-2 rounded-md border bg-slate-50 p-2">
                <p className="text-xs text-slate-500">
                  Pay Rate
                </p>

                <p className="font-semibold text-green-600">
                  ${Number(payRate || 0).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Submitted">Submitted</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Regular Hours</Label>
              <Input
                type="number"
                value={regularHours}
                onChange={(e) => setRegularHours(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Overtime Hours</Label>
              <Input
                type="number"
                value={overtimeHours}
                onChange={(e) => setOvertimeHours(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Overtime Multiplier</Label>
              <Input
                type="number"
                step="0.1"
                value={overtimeMultiplier}
                onChange={(e) => setOvertimeMultiplier(e.target.value)}
                placeholder="1.5"
              />
            </div>
            <div className="md:col-span-2">
              <Button
                type="button"
                variant="secondary"
                onClick={calculateHoursFromTimeLogs}
              >
                Calculate Hours
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Base Amount</Label>
              <Input
                type="number"
                value={baseAmount}
                onChange={(e) => setBaseAmount(e.target.value)}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={calculateBaseAmount}
              >
                Calculate Amount
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Overtime Amount</Label>
              <Input
                value={`$${Number(overtimeAmount || 0).toFixed(2)}`}
                readOnly
              />
            </div>

            <div className="space-y-2">
              <Label>Allowance Amount</Label>
              <Input
                type="number"
                value={allowanceAmount}
                onChange={(e) => setAllowanceAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Deduction Amount</Label>
              <Input
                type="number"
                value={deductionAmount}
                onChange={(e) => setDeductionAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>PAYG Tax Withheld ($)</Label>
              <Input
                type="number"
                value={taxAmount}
                onChange={(e) => setTaxAmount(e.target.value)}
                placeholder="Enter tax amount in dollars"
              />
            </div>

            <div className="space-y-2">
              <Label>Net Amount</Label>
              <Input value={`$${netAmount.toFixed(2)}`} readOnly />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
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
              onClick={() => createEntry.mutate()}
              disabled={createEntry.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {createEntry.isPending ? "Saving..." : "Save Entry"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayrollEntries;