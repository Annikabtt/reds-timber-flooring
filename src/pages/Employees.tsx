import { useMemo, useState } from "react";
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  Printer,
  FileText,
  FileSpreadsheet,
  Download,
  Pencil,
  Trash2,
} from "lucide-react";
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
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

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
  const [isActive, setIsActive] = useState(true);
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
    setIsActive(true);
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

      if (email.trim() && !email.trim().includes("@")) {
        throw new Error("Please enter a valid email address.");
      }

      if (!isActive && !endDate) {
        throw new Error("End date is required for an inactive employee.");
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
        end_date: isActive ? null : endDate,
        is_active: isActive,
        tax_file_number: taxFileNumber.trim() || null,
        bank_name: bankName.trim() || null,
        bank_account_name: bankAccountName.trim() || null,
        bank_bsb: bankBsb.trim() || null,
        bank_account_no: bankAccountNo.trim() || null,
        is_deleted: false,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Employee created successfully.");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employees-for-deliveries"] });
      queryClient.invalidateQueries({
        queryKey: ["employees-for-work-orders"],
      });
      setShowAddDialog(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const openEditEmployee = (employee: (typeof employees)[number]) => {
    setFormMode("edit");
    setEditingEmployeeId(employee.employee_id);

    setEmployeeCode(employee.employee_code || "");
    setFirstName(employee.first_name || "");
    setLastName(employee.last_name || "");
    setDisplayName(employee.display_name || "");
    setPhone(employee.phone || "");
    setEmail(employee.email || "");
    setEmploymentType(employee.employment_type || "Full Time");
    setPayMethod(employee.pay_method || "Hourly");
    setPayRate(
      employee.pay_rate === null || employee.pay_rate === undefined
        ? ""
        : String(employee.pay_rate)
    );
    setStartDate(employee.start_date || "");
    setEndDate(employee.end_date || "");
    setIsActive(employee.is_active);
    setTaxFileNumber(employee.tax_file_number || "");
    setBankName(employee.bank_name || "");
    setBankAccountName(employee.bank_account_name || "");
    setBankBsb(employee.bank_bsb || "");
    setBankAccountNo(employee.bank_account_no || "");

    setShowAddDialog(true);
  };

  const updateEmployee = useMutation({
    mutationFn: async () => {
      if (!editingEmployeeId) {
        throw new Error("No employee selected for editing.");
      }

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

      if (email.trim() && !email.trim().includes("@")) {
        throw new Error("Please enter a valid email address.");
      }

      if (!isActive && !endDate) {
        throw new Error("End date is required for an inactive employee.");
      }

      const finalDisplayName =
        displayName.trim() || `${firstName.trim()} ${lastName.trim()}`;

      const { error } = await supabase
        .from("employees")
        .update({
          employee_code: employeeCode.trim() || null,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          display_name: finalDisplayName,
          phone: phone.trim() || null,
          email: email.trim() || null,
          employment_type: employmentType,
          pay_method: payMethod,
          pay_rate: Number(payRate),
          start_date: startDate || null,
          end_date: isActive ? null : endDate,
          is_active: isActive,
          tax_file_number: taxFileNumber.trim() || null,
          bank_name: bankName.trim() || null,
          bank_account_name: bankAccountName.trim() || null,
          bank_bsb: bankBsb.trim() || null,
          bank_account_no: bankAccountNo.trim() || null,
        })
        .eq("employee_id", editingEmployeeId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Employee updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employees-for-deliveries"] });
      queryClient.invalidateQueries({
        queryKey: ["employees-for-work-orders"],
      });
      setShowAddDialog(false);
      setEditingEmployeeId(null);
      setFormMode("add");
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });


  const deleteEmployee = useMutation({
    mutationFn: async (employeeId: string) => {
      const { error } = await supabase
        .from("employees")
        .update({
          is_active: false,
          is_deleted: true,
          end_date: new Date().toISOString().slice(0, 10),
        })
        .eq("employee_id", employeeId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Employee deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employees-for-deliveries"] });
      queryClient.invalidateQueries({
        queryKey: ["employees-for-work-orders"],
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const employeeSummary = useMemo(() => {
    const total = employees.length;
    const active = employees.filter((employee) => employee.is_active).length;
    const inactive = employees.filter((employee) => !employee.is_active).length;

    return {
      total,
      active,
      inactive,
    };
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    const keyword = searchTerm.toLowerCase();

    return employees.filter((employee) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && employee.is_active) ||
        (statusFilter === "inactive" && !employee.is_active);

      const matchesKeyword =
        employee.employee_code?.toLowerCase().includes(keyword) ||
        employee.display_name?.toLowerCase().includes(keyword) ||
        employee.first_name?.toLowerCase().includes(keyword) ||
        employee.last_name?.toLowerCase().includes(keyword) ||
        employee.phone?.toLowerCase().includes(keyword) ||
        employee.email?.toLowerCase().includes(keyword) ||
        employee.employment_type?.toLowerCase().includes(keyword);

      return matchesStatus && matchesKeyword;
    });
  }, [employees, searchTerm, statusFilter]);

  const exportRows = useMemo(() => {
    return filteredEmployees.map((employee) => ({
      employeeCode: employee.employee_code || "",
      displayName:
        employee.display_name ||
        `${employee.first_name || ""} ${employee.last_name || ""}`.trim(),
      firstName: employee.first_name || "",
      lastName: employee.last_name || "",
      email: employee.email || "",
      phone: employee.phone || "",
      employmentType: employee.employment_type || "",
      payMethod: employee.pay_method || "",
      payRate: Number(employee.pay_rate || 0).toFixed(2),
      startDate: employee.start_date || "",
      endDate: employee.end_date || "",
      status: employee.is_active ? "Active" : "Inactive",
    }));
  }, [filteredEmployees]);

  const exportHeaders = [
    "Employee Code",
    "Display Name",
    "First Name",
    "Last Name",
    "Email",
    "Phone",
    "Employment Type",
    "Pay Method",
    "Pay Rate",
    "Start Date",
    "End Date",
    "Status",
  ];

  const escapeCsvValue = (value: string) => {
    return `"${value.replace(/"/g, '""')}"`;
  };

  const escapeHtmlValue = (value: string) => {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const downloadBlob = ({
    content,
    fileName,
    mimeType,
  }: {
    content: string;
    fileName: string;
    mimeType: string;
  }) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const rows = exportRows.map((row) => [
      row.employeeCode,
      row.displayName,
      row.firstName,
      row.lastName,
      row.email,
      row.phone,
      row.employmentType,
      row.payMethod,
      row.payRate,
      row.startDate,
      row.endDate,
      row.status,
    ]);

    const csvContent = [
      exportHeaders.map(escapeCsvValue).join(","),
      ...rows.map((row) => row.map(escapeCsvValue).join(",")),
    ].join("\n");

    downloadBlob({
      content: `\uFEFF${csvContent}`,
      fileName: "employees.csv",
      mimeType: "text/csv;charset=utf-8;",
    });
  };

  const handleExportExcel = () => {
    const tableHeader = exportHeaders
      .map((header) => `<th>${escapeHtmlValue(header)}</th>`)
      .join("");

    const tableRows = exportRows
      .map((row) => {
        const cells = [
          row.employeeCode,
          row.displayName,
          row.firstName,
          row.lastName,
          row.email,
          row.phone,
          row.employmentType,
          row.payMethod,
          row.payRate,
          row.startDate,
          row.endDate,
          row.status,
        ]
          .map((value) => `<td>${escapeHtmlValue(value)}</td>`)
          .join("");

        return `<tr>${cells}</tr>`;
      })
      .join("");

    const excelContent = `
      <html>
        <head>
          <meta charset="UTF-8" />
        </head>
        <body>
          <table border="1">
            <thead>
              <tr>${tableHeader}</tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>
    `;

    downloadBlob({
      content: excelContent,
      fileName: "employees.xls",
      mimeType: "application/vnd.ms-excel;charset=utf-8;",
    });
  };

  const handlePrintEmployees = (mode: "print" | "pdf") => {
    const reportWindow = window.open("", "_blank");

    if (!reportWindow) {
      toast.error("Unable to open print window.");
      return;
    }

    const generatedAt = new Date().toLocaleString("en-AU");
    const tableHeader = exportHeaders
      .map((header) => `<th>${escapeHtmlValue(header)}</th>`)
      .join("");

    const tableRows = exportRows
      .map((row) => {
        const cells = [
          row.employeeCode,
          row.displayName,
          row.firstName,
          row.lastName,
          row.email,
          row.phone,
          row.employmentType,
          row.payMethod,
          row.payRate,
          row.startDate,
          row.endDate,
          row.status,
        ]
          .map((value) => `<td>${escapeHtmlValue(value)}</td>`)
          .join("");

        return `<tr>${cells}</tr>`;
      })
      .join("");

    reportWindow.document.write(`
      <html>
        <head>
          <title>${mode === "pdf" ? "Employees PDF" : "Employees Print"}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              color: #0f172a;
              padding: 24px;
            }

            h1 {
              margin: 0 0 4px;
              font-size: 24px;
            }

            p {
              margin: 0 0 16px;
              color: #64748b;
              font-size: 12px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }

            th,
            td {
              border: 1px solid #cbd5e1;
              padding: 6px;
              text-align: left;
              vertical-align: top;
            }

            th {
              background: #f1f5f9;
              font-weight: 700;
            }
          </style>
        </head>
        <body>
          <h1>Employees</h1>
          <p>Generated: ${escapeHtmlValue(generatedAt)}</p>
          <p>Total exported rows: ${exportRows.length}</p>

          <table>
            <thead>
              <tr>${tableHeader}</tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>
    `);

    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.print();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
          onClick={() => {
            resetForm();
            setFormMode("add");
            setEditingEmployeeId(null);
            setShowAddDialog(true);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-2 font-bold text-white shadow-lg shadow-red-200 transition-all hover:bg-red-700 sm:w-auto"
        >
          <Plus className="h-5 w-5" />
          Add Employee
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total Employees</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {employeeSummary.total}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Active</p>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {employeeSummary.active}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Inactive</p>
          <p className="mt-2 text-3xl font-bold text-slate-500">
            {employeeSummary.inactive}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_220px_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Search by employee name, code, phone, email, or type..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value) => {
              if (
                value === "all" ||
                value === "active" ||
                value === "inactive"
              ) {
                setStatusFilter(value);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
            </SelectContent>
          </Select>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex">
            <Button
              type="button"
              variant="outline"
              onClick={() => handlePrintEmployees("print")}
              className="h-10 gap-2 rounded-xl text-xs"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handlePrintEmployees("pdf")}
              className="h-10 gap-2 rounded-xl text-xs"
            >
              <FileText className="h-4 w-4" />
              PDF
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleExportCsv}
              className="h-10 gap-2 rounded-xl text-xs"
            >
              <Download className="h-4 w-4" />
              CSV
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleExportExcel}
              className="h-10 gap-2 rounded-xl text-xs"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </Button>
          </div>
        </div>
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
        <div className="grid grid-cols-12 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 border-b">
          <div className="col-span-3">Employee</div>
          <div className="col-span-2">Contact</div>
          <div className="col-span-2">Employment / Payroll</div>
          <div className="col-span-2">Bank</div>
          <div className="col-span-1">Period</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1 text-right">Actions</div>
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

              <div className="md:col-span-2 text-sm text-slate-700">
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

              <div className="md:col-span-2">
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

              <div className="md:col-span-2 text-sm text-slate-700">
                <p>{employee.bank_name || "-"}</p>
                <p className="text-xs text-slate-500">
                  {employee.bank_bsb || "-"} / {employee.bank_account_no || "-"}
                </p>
              </div>

              <div className="col-span-1 text-sm text-slate-700">
                <p>{employee.start_date || "-"}</p>
                <p>{employee.end_date || "-"}</p>
              </div>

              <div className="col-span-1">
                <span
                  className={
                    employee.is_active
                      ? "inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700"
                      : "inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                  }
                >
                  {employee.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="col-span-1 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => openEditEmployee(employee)}
                  className="h-9 w-9 rounded-lg"
                  title="Edit employee"
                >
                  <Pencil className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={deleteEmployee.isPending}
                  onClick={() => {
                    if (
                      !window.confirm(
                        "Delete this employee? This will hide the employee but keep payroll and work history."
                      )
                    ) {
                      return;
                    }

                    deleteEmployee.mutate(employee.employee_id);
                  }}
                  className="h-9 w-9 rounded-lg border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  title="Delete employee"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

            </div>
          ))
        )}
      </div>

      <div className="space-y-3 lg:hidden">
        {filteredEmployees.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
            No employees found.
          </div>
        ) : (
          filteredEmployees.map((employee) => (
            <div
              key={employee.employee_id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-slate-900">
                    {employee.display_name ||
                      `${employee.first_name || ""} ${employee.last_name || ""
                        }`.trim()}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {employee.employee_code || "No employee code"}
                  </p>
                </div>

                <span
                  className={
                    employee.is_active
                      ? "shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700"
                      : "shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                  }
                >
                  {employee.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-700">
                {employee.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span>{employee.phone}</span>
                  </p>
                )}

                {employee.email && (
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="break-all">{employee.email}</span>
                  </p>
                )}

                {!employee.phone && !employee.email && (
                  <p className="text-slate-400">No contact details</p>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-500">
                    Employment
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {employee.employment_type || "-"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-500">
                    Pay Method
                  </p>
                  <p className="mt-1 font-semibold text-blue-600">
                    {employee.pay_method || "-"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-500">
                    Pay Rate
                  </p>
                  <p className="mt-1 font-semibold text-green-600">
                    ${Number(employee.pay_rate || 0).toFixed(2)}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-500">Period</p>
                  <p className="mt-1 text-xs font-semibold text-slate-900">
                    {employee.start_date || "-"}
                    {employee.end_date ? ` to ${employee.end_date}` : ""}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">
                <p className="text-xs font-medium text-slate-500">Bank</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {employee.bank_name || "-"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {employee.bank_bsb || "-"} /{" "}
                  {employee.bank_account_no || "-"}
                </p>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => openEditEmployee(employee)}
                  className="h-10 w-10 rounded-xl"
                  title="Edit employee"
                >
                  <Pencil className="h-4 w-4" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={deleteEmployee.isPending}
                  onClick={() => {
                    if (
                      !window.confirm(
                        "Delete this employee? This will hide the employee but keep payroll and work history."
                      )
                    ) {
                      return;
                    }

                    deleteEmployee.mutate(employee.employee_id);
                  }}
                  className="h-10 w-10 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  title="Delete employee"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-24px)] max-w-4xl overflow-y-auto rounded-2xl p-4 sm:p-6">
          <DialogTitle>
            {formMode === "edit" ? "Edit Employee" : "Add Employee"}
          </DialogTitle>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Employee Code</Label>
              <Input
                value={employeeCode}
                readOnly
                placeholder="Auto generated"
                className="bg-slate-50 text-slate-500"
              />
              <p className="text-xs text-slate-500">
                Employee code is generated automatically when saving a new employee.
              </p>
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

            <div className="md:col-span-2 space-y-2">
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
              <Label>Email / Worker Login Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="worker@example.com"
              />
              <p className="text-xs text-slate-500">
                Must match the Supabase Auth email when this employee logs in to MyWork.
              </p>
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
              <Label>Employment Status</Label>
              <Select
                value={isActive ? "active" : "inactive"}
                onValueChange={(value) => {
                  if (value === "active") {
                    setIsActive(true);
                    setEndDate("");
                  }

                  if (value === "inactive") {
                    setIsActive(false);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>
                End Date {!isActive && <span className="text-red-600">*</span>}
              </Label>
              <Input
                type="date"
                value={endDate}
                disabled={isActive}
                onChange={(e) => setEndDate(e.target.value)}
                className={isActive ? "bg-slate-50 text-slate-400" : ""}
              />
              <p className="text-xs text-slate-500">
                Set the employee to Inactive and enter their final employment date.
              </p>
            </div>

            <div className="md:col-span-2 border-t pt-4">
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

            <div className="md:col-span-2 space-y-2">
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
                setEditingEmployeeId(null);
                setFormMode("add");
                resetForm();
              }}
            >
              Cancel
            </Button>

            <Button
              onClick={() => {
                if (formMode === "edit") {
                  updateEmployee.mutate();
                  return;
                }

                createEmployee.mutate();
              }}
              disabled={createEmployee.isPending || updateEmployee.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {createEmployee.isPending || updateEmployee.isPending
                ? "Saving..."
                : formMode === "edit"
                  ? "Update Employee"
                  : "Save Employee"}
            </Button>

          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Employees;