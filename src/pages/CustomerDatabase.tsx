import { useMemo, useState } from "react";
import { Building2, Plus, Search, Filter, Phone, Mail } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

type Customer = {
  customer_id: string;
  customer_code: string;
  customer_name: string;
  customer_type: string;
  phone: string | null;
  email: string | null;
  abn: string | null;
  is_active: boolean;
  created_at: string;
};

export default function CustomerDatabase() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerType, setCustomerType] = useState("Residential");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [abn, setAbn] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const {
    data: customers = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select(
          "customer_id, customer_code, customer_name, customer_type, phone, email, abn, is_active, created_at"
        )
        .eq("is_deleted", false)
        .order("customer_name", { ascending: true });

      if (error) throw error;
      return data as Customer[];
    },
  });

  const handleAddCustomer = async () => {
    if (!customerName.trim()) {
      alert("Customer Name is required");
      return;
    }

    const customerCode =
      "CUS-" +
      Date.now().toString().slice(-6);

    const { error } = await supabase
      .from("customers")
      .insert({
        customer_code: customerCode,
        customer_name: customerName,
        customer_type: customerType,
        phone: phone || null,
        email: email || null,
        abn: abn || null,
        notes: address.trim()
          ? `Address: ${address.trim()}${notes.trim() ? `\nNotes: ${notes.trim()}` : ""}`
          : notes.trim() || null,
        is_active: true,
        is_deleted: false,
      });

    if (error) {
      alert(error.message);
      return;
    }

    setCustomerName("");
    setCustomerType("Residential");
    setPhone("");
    setEmail("");
    setAbn("");
    setAddress("");
    setNotes("");

    setShowAddDialog(false);

    queryClient.invalidateQueries({
      queryKey: ["customers"],
    });
  };

  const filteredCustomers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    const typeMatchedCustomers =
      typeFilter === "All"
        ? customers
        : customers.filter((customer) => customer.customer_type === typeFilter);

    if (!keyword) return typeMatchedCustomers;

    return typeMatchedCustomers.filter((customer) => {
      return (
        customer.customer_code.toLowerCase().includes(keyword) ||
        customer.customer_name.toLowerCase().includes(keyword) ||
        customer.customer_type.toLowerCase().includes(keyword) ||
        (customer.email || "").toLowerCase().includes(keyword) ||
        (customer.phone || "").toLowerCase().includes(keyword)
      );
    });
  }, [customers, searchTerm, typeFilter]);

  return (
    <div className="space-y-5">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50">
                <Building2 className="h-6 w-6 text-red-600" />
              </div>

              <div className="min-w-0">
                <h1 className="text-2xl font-black leading-tight text-slate-900 md:text-3xl">
                  Customers
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  Manage residential and commercial customers.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => setShowAddDialog(true)}
            className="h-11 w-full rounded-xl bg-red-600 px-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-red-700 md:w-auto md:px-6"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>

        <Dialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
        >
          <DialogContent className="max-h-[90vh] w-[calc(100vw-24px)] max-w-lg overflow-y-auto rounded-2xl p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Quick Add Customer
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 text-sm">
              <div>
                <Label>
                  {customerType === "Commercial" ? "Business / Company Name" : "Customer Name"}
                </Label>
                <Input
                  className="h-11 rounded-xl text-base md:text-sm"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={
                    customerType === "Commercial"
                      ? "Business or company name"
                      : "Customer full name"
                  }
                />
              </div>

              <div>
                <Label>Customer Type</Label>
                <Select
                  value={customerType}
                  onValueChange={(value) => {
                    setCustomerType(value);
                    if (value === "Residential") {
                      setAbn("");
                    }
                  }}
                >
                  <SelectTrigger className="h-11 rounded-xl text-base md:text-sm">
                    <SelectValue placeholder="Select customer type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Residential">Residential</SelectItem>
                    <SelectItem value="Commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>
                  {customerType === "Commercial" ? "Business Phone" : "Phone"}
                </Label>
                <Input
                  className="h-11 rounded-xl text-base md:text-sm"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={
                    customerType === "Commercial"
                      ? "Office or business phone"
                      : "Customer phone"
                  }
                />
              </div>

              <div>
                <Label>
                  {customerType === "Commercial" ? "Business Address" : "Address"}
                </Label>
                <Input
                  className="h-11 rounded-xl text-base md:text-sm"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={
                    customerType === "Commercial"
                      ? "Office or billing address"
                      : "Customer address"
                  }
                />
              </div>

              <div>
                <Label>
                  {customerType === "Commercial" ? "Business Email" : "Email"}
                </Label>
                <Input
                  className="h-11 rounded-xl text-base md:text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    customerType === "Commercial"
                      ? "Accounts or office email"
                      : "Customer email"
                  }
                />
              </div>

              {customerType === "Commercial" && (
                <div>
                  <Label>ABN</Label>
                  <Input
                    className="h-11 rounded-xl text-base md:text-sm"
                    value={abn}
                    onChange={(e) => setAbn(e.target.value)}
                    placeholder="Australian Business Number"
                  />
                </div>
              )}

              <div>
                <Label>Notes</Label>
                <Textarea
                  className="min-h-24 rounded-xl text-base md:text-sm"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    customerType === "Commercial"
                      ? "Contact person, billing notes, site notes"
                      : "Access notes, job notes, customer notes"
                  }
                />
              </div>

              <Button
                onClick={handleAddCustomer}
                className="h-11 w-full rounded-xl bg-red-600 text-sm font-bold text-white hover:bg-red-700"
              >
                Create Customer
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm md:p-4">
          <div className="relative w-full">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by code, name, type, phone, or email..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="mt-3 md:mt-0 md:w-56">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-11 rounded-xl text-base md:text-sm">
                <Filter className="mr-2 h-4 w-4 text-slate-400" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Customers</SelectItem>
                <SelectItem value="Residential">Residential</SelectItem>
                <SelectItem value="Commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">
              Loading customers...
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">
              Failed to load customers.
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No customers found.
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="divide-y divide-slate-100 md:hidden">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.customer_id}
                    className="space-y-3 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-base font-bold text-slate-900 break-words">
                          {customer.customer_name}
                        </p>
                        <p className="mt-1 text-xs font-mono text-slate-400">
                          {customer.customer_code}
                        </p>
                      </div>

                      <span
                        className={
                          customer.is_active
                            ? "shrink-0 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"
                            : "shrink-0 inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500"
                        }
                      >
                        {customer.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                        {customer.customer_type}
                      </span>

                      {customer.abn && (
                        <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600">
                          ABN: {customer.abn}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="shrink-0 text-slate-400" />
                        <span className="break-all">{customer.phone || "-"}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Mail size={14} className="shrink-0 text-slate-400" />
                        <span className="break-all">{customer.email || "-"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-900 text-white">
                    <tr>
                      <th className="px-6 py-4 font-bold uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-4 font-bold uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-4 font-bold uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-4 font-bold uppercase tracking-wider">
                        ABN
                      </th>
                      <th className="px-6 py-4 font-bold uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredCustomers.map((customer) => (
                      <tr
                        key={customer.customer_id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-base">
                              {customer.customer_name}
                            </span>
                            <span className="text-slate-400 text-xs font-mono mt-1">
                              {customer.customer_code}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold border bg-slate-100 text-slate-700 border-slate-200">
                            {customer.customer_type}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5 text-slate-600 text-xs">
                            <div className="flex items-center gap-2">
                              <Phone size={14} className="text-slate-400" />
                              {customer.phone || "-"}
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail size={14} className="text-slate-400" />
                              {customer.email || "-"}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-slate-600">
                          {customer.abn || "-"}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={
                              customer.is_active
                                ? "inline-flex px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "inline-flex px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200"
                            }
                          >
                            {customer.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div >
  );
}