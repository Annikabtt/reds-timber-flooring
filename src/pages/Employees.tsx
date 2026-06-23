import { useMemo, useState } from "react";
import { Users, Plus, Search, Phone, Mail } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const Employees = () => {
  const queryClient = useQueryClient();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [employeeCode, setEmployeeCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [employmentType, setEmploymentType] = useState("Full Time");
  const [payMethod, setPayMethod] = useState("Hourly");
  const [payRate, setPayRate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [taxFileNumber, setTaxFileNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankBsb, setBankBsb] = useState("");
  const [bankAccountNo, setBankAccountNo] = useState("");

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select(`
          employee_id,
          employee_code,
          first_name,
          last_name,
          display_name,
          phone,
          email,
          employment_type,
          pay_method,
          pay_rate,
          start_date,
          end_date,
          tax_file_number,
          bank_name,
          bank_account_name,
          bank_bsb,
          bank_account_no,
          is_active,
          created_at
        `)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => {
    setEmployeeCode("");
    setFirstName("");
    setLastName("");
    setDisplayName("");
    setPhone("");
    setEmail("");
    setEmploymentType("Full Time");
    setPayMethod("Hourly");
    setPayRate("");
    setStartDate("");
    setEndDate("");
    setTaxFileNumber("");
    setBankName("");
    setBankAccountName("");
    setBankBsb("");
    setBankAccountNo("");
  };

  const createEmployee = useMutation({
    mutationFn: async () => {
      if (!firstName.trim()) {
        throw new Error("Please enter first name.");
      }

      if (!lastName.trim()) {
        throw new Error("Please enter last name.");
      }
      if (!payMethod) {
        throw new Error("Pay method is required.");
      }
      if (!payRate) {
        throw new Error("Pay rate is required.");
      }
      if (Number(payRate) <= 0) {
        throw new Error("Pay rate must be greater than 0.");
      }
      const finalDisplayName =
        displayName.trim() || `${firstName.trim()} ${lastName.trim()}`;

      const { error } = await supabase.from("employees").insert({
        employee_code: employeeCode.trim() || null,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        display_name: finalDisplayName,
        phone: phone.trim() || null,
        email: email.trim() || null,
        employment_type: employmentType,
        pay_method: payMethod,
        pay_rate: payRate ? Number(payRate) : null,
        start_date: startDate || null,
        end_date: endDate || null,
        tax_file_number: taxFileNumber.trim() || null,
        bank_name: bankName.trim() || null,
        bank_account_name: bankAccountName.trim() || null,
        bank_bsb: bankBsb.trim() || null,
        bank_account_no: bankAccountNo.trim() || null,
        is_active: true,
        is_deleted: false,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Employee created successfully.");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employees-for-deliveries"] });
      setShowAddDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const filteredEmployees = useMemo(() => {
    const keyword = searchTerm.toLowerCase();

    return employees.filter((employee) => {
      return (
        employee.employee_code?.toLowerCase().includes(keyword) ||
        employee.display_name?.toLowerCase().includes(keyword) ||
        employee.first_name?.toLowerCase().includes(keyword) ||
        employee.last_name?.toLowerCase().includes(keyword) ||
        employee.phone?.toLowerCase().includes(keyword) ||
        employee.email?.toLowerCase().includes(keyword) ||
        employee.employment_type?.toLowerCase().includes(keyword)
      );
    });
  }, [employees, searchTerm]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-red-600" />
            <h1 className="text-3xl font-bold text-slate-900">Employees</h1>
          </div>
          <p className="text-slate-500 mt-1">
            Manage workforce records for assignments, time logs, and payroll.
          </p>
        </div>

        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl shadow-lg shadow-red-200 transition-all flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Employee
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search by employee name, code, phone, email, or type..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-12 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500 px-4 py-3 border-b">
          <div className="col-span-3">Employee</div>
          <div className="col-span-2">Contact</div>
          <div className="col-span-2">Employment / Payroll</div>
          <div className="col-span-2">Bank</div>
          <div className="col-span-2">Period</div>
          <div className="col-span-1">Status</div>
        </div>

        {filteredEmployees.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No employees found.
          </div>
        ) : (
          filteredEmployees.map((employee) => (
            <div
              key={employee.employee_id}
              className="grid grid-cols-12 px-4 py-4 border-b last:border-b-0 hover:bg-slate-50 transition-colors"
            >
              <div className="col-span-3">
                <p className="font-semibold text-slate-900">
                  {employee.display_name ||
                    `${employee.first_name || ""} ${employee.last_name || ""}`}
                </p>
                <p className="text-xs text-slate-500">
                  {employee.employee_code || "-"}
                </p>
              </div>

              <div className="col-span-2 text-sm text-slate-700">
                {employee.phone && (
                  <p className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {employee.phone}
                  </p>
                )}
                {employee.email && (
                  <p className="flex items-center gap-1 mt-1">
                    <Mail className="h-3 w-3" />
                    {employee.email}
                  </p>
                )}
                {!employee.phone && !employee.email && "-"}
              </div>

              <div className="col-span-2">
                <p className="font-medium text-slate-900">
                  {employee.employment_type || "-"}
                </p>

                <p className="text-sm text-blue-600">
                  {employee.pay_method || "-"}
                </p>

                <p className="font-semibold text-green-600">
                  ${Number(employee.pay_rate || 0).toFixed(2)}
                </p>
              </div>

              <div className="col-span-2 text-sm text-slate-700">
                <p>{employee.bank_name || "-"}</p>
                <p className="text-xs text-slate-500">
                  {employee.bank_bsb || "-"} / {employee.bank_account_no || "-"}
                </p>
              </div>

              <div className="col-span-2 text-sm text-slate-700">
                <p>Start: {employee.start_date || "-"}</p>
                <p>End: {employee.end_date || "-"}</p>
              </div>

              <div className="col-span-1 text-slate-700">
                {employee.is_active ? "Active" : "Inactive"}
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Add Employee</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Employee Code</Label>
              <Input
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                placeholder="EMP-00001"
              />
            </div>

            <div className="space-y-2">
              <Label>Employment Type</Label>
              <Select
                value={employmentType}
                onValueChange={setEmploymentType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full Time">Full Time</SelectItem>
                  <SelectItem value="Part Time">Part Time</SelectItem>
                  <SelectItem value="Casual">Casual</SelectItem>
                  <SelectItem value="Contractor">Contractor</SelectItem>
                  <SelectItem value="Subcontractor">Subcontractor</SelectItem>
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
            </div>
            <div className="space-y-2">
              <Label>Pay Rate</Label>
              <Input
                type="number"
                value={payRate}
                onChange={(e) => setPayRate(e.target.value)}
                placeholder="35.00"
              />
            </div>
            <div className="space-y-2">
              <Label>First Name *</Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Last Name *</Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Display Name</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Leave blank to use First Name + Last Name"
              />
            </div>

            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="col-span-2 border-t pt-4">
              <h3 className="font-semibold text-slate-800">Payroll / Bank</h3>
            </div>

            <div className="space-y-2">
              <Label>Tax File Number</Label>
              <Input
                value={taxFileNumber}
                onChange={(e) => setTaxFileNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Bank Name</Label>
              <Input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Bank Account Name</Label>
              <Input
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>BSB</Label>
              <Input
                value={bankBsb}
                onChange={(e) => setBankBsb(e.target.value)}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Bank Account No</Label>
              <Input
                value={bankAccountNo}
                onChange={(e) => setBankAccountNo(e.target.value)}
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
              onClick={() => createEmployee.mutate()}
              disabled={createEmployee.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {createEmployee.isPending ? "Saving..." : "Save Employee"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Employees;