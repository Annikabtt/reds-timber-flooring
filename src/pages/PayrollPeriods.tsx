import { useMemo, useState } from "react";
import { CalendarRange, Eye, Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { toast } from "sonner";

const PayrollPeriods = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [periodNo, setPeriodNo] = useState("");
  const [periodName, setPeriodName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [periodType, setPeriodType] = useState("Weekly");
  const [status, setStatus] = useState("Open");
  const [notes, setNotes] = useState("");

  const { data: periods = [] } = useQuery({
    queryKey: ["payroll_periods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payroll_periods")
        .select(`
          payroll_period_id,
          period_no,
          period_name,
          start_date,
          end_date,
          period_type,
          status,
          notes,
          created_at
        `)
        .eq("is_deleted", false)
        .order("start_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => {
    setPeriodNo("");
    setPeriodName("");
    setStartDate("");
    setEndDate("");
    setPeriodType("Weekly");
    setStatus("Open");
    setNotes("");
  };

  const createPeriod = useMutation({
    mutationFn: async () => {
      if (!periodName.trim()) {
        throw new Error("Please enter period name.");
      }

      if (!startDate) {
        throw new Error("Please select start date.");
      }

      if (!endDate) {
        throw new Error("Please select end date.");
      }
      if (new Date(endDate) < new Date(startDate)) {
        throw new Error("End date must be later than or equal to start date.");
      }
      const { error } = await supabase.from("payroll_periods").insert({
        period_no: periodNo.trim() || null,
        period_name: periodName.trim(),
        start_date: startDate,
        end_date: endDate,
        period_type: periodType,
        status,
        notes: notes.trim() || null,
        is_deleted: false,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payroll period created successfully.");
      queryClient.invalidateQueries({ queryKey: ["payroll_periods"] });
      setShowAddDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const filteredPeriods = useMemo(() => {
    const keyword = searchTerm.toLowerCase();

    return periods.filter((period) => {
      return (
        period.period_no?.toLowerCase().includes(keyword) ||
        period.period_name?.toLowerCase().includes(keyword) ||
        period.period_type?.toLowerCase().includes(keyword) ||
        period.status?.toLowerCase().includes(keyword)
      );
    });
  }, [periods, searchTerm]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <CalendarRange className="h-8 w-8 text-red-600" />
            <h1 className="text-3xl font-bold text-slate-900">
              Payroll Periods
            </h1>
          </div>
          <p className="text-slate-500 mt-1">
            Manage weekly, monthly, and custom payroll periods.
          </p>
        </div>

        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl shadow-lg shadow-red-200 transition-all flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Period
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-slate-500">
            Total Periods
          </div>
          <div className="text-2xl font-bold">
            {periods.length}
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-slate-500">
            Open
          </div>
          <div className="text-2xl font-bold text-green-600">
            {
              periods.filter(
                (period) => period.status === "Open"
              ).length
            }
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-slate-500">
            Processing
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {
              periods.filter(
                (period) => period.status === "Processing"
              ).length
            }
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <div className="text-sm text-slate-500">
            Closed / Paid
          </div>
          <div className="text-2xl font-bold text-slate-700">
            {
              periods.filter(
                (period) =>
                  period.status === "Closed" ||
                  period.status === "Paid"
              ).length
            }
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search by period no, name, type, or status..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-12 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500 px-4 py-3 border-b">
          <div className="col-span-2">Period No</div>
          <div className="col-span-2">Period Name</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Start Date</div>
          <div className="col-span-2">End Date</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        {filteredPeriods.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No payroll periods found.
          </div>
        ) : (
          filteredPeriods.map((period) => (
            <div
              key={period.payroll_period_id}
              className="grid grid-cols-12 px-4 py-4 border-b last:border-b-0 hover:bg-slate-50 transition-colors"
            >
              <div className="col-span-2 font-semibold text-slate-900">
                {period.period_no || "-"}
              </div>

              <div className="col-span-2 text-slate-700">
                {period.period_name || "-"}
              </div>

              <div className="col-span-2 text-slate-700">
                {period.period_type || "-"}
              </div>

              <div className="col-span-2 text-slate-700">
                {period.start_date || "-"}
              </div>

              <div className="col-span-2 text-slate-700">
                {period.end_date || "-"}
              </div>

              <div className="col-span-1">
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${period.status === "Open"
                    ? "bg-green-100 text-green-700"
                    : period.status === "Processing"
                      ? "bg-orange-100 text-orange-700"
                      : period.status === "Paid" ||
                        period.status === "Closed"
                        ? "bg-slate-100 text-slate-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                >
                  {period.status || "-"}
                </span>
              </div>
              <div className="col-span-1 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    navigate(
                      `/payroll-periods/${period.payroll_period_id}`
                    )
                  }
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);

          if (!open) {
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Payroll Period</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Period No</Label>
              <Input
                value={periodNo}
                onChange={(e) => setPeriodNo(e.target.value)}
                placeholder="PP2606-W1"
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
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Period Name *</Label>
              <Input
                value={periodName}
                onChange={(e) => setPeriodName(e.target.value)}
                placeholder="June Week 1"
              />
            </div>

            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>End Date *</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Period Type</Label>
              <Select value={periodType} onValueChange={setPeriodType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
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
              onClick={() => createPeriod.mutate()}
              disabled={createPeriod.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {createPeriod.isPending ? "Saving..." : "Save Period"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayrollPeriods;