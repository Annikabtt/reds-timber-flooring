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
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerType, setCustomerType] = useState("Residential");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [abn, setAbn] = useState("");
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
        notes: notes || null,
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
    setNotes("");

    setShowAddDialog(false);

    queryClient.invalidateQueries({
      queryKey: ["customers"],
    });
  };

  const filteredCustomers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) return customers;

    return customers.filter((customer) => {
      return (
        customer.customer_code.toLowerCase().includes(keyword) ||
        customer.customer_name.toLowerCase().includes(keyword) ||
        customer.customer_type.toLowerCase().includes(keyword) ||
        (customer.email || "").toLowerCase().includes(keyword) ||
        (customer.phone || "").toLowerCase().includes(keyword)
      );
    });
  }, [customers, searchTerm]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <Building2 className="text-red-600" size={32} />
              Customer Management
            </h1>
            <p className="text-slate-500 mt-1">
              Manage customer records from REDS database.
            </p>
          </div>

          <Button
           onClick={() => setShowAddDialog(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl shadow-lg shadow-red-200 transition-all flex items-center gap-2"
          >
            <Plus size={20} />
            Add New Customer
          </Button>
        </div>

        <Dialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                Add New Customer
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">

              <div>
                <Label>Customer Name</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div>
                <Label>Customer Type</Label>
                <Input
                  value={customerType}
                  onChange={(e) => setCustomerType(e.target.value)}
                />
              </div>

              <div>
                <Label>Phone</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div>
                <Label>Email</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <Label>ABN</Label>
                <Input
                  value={abn}
                  onChange={(e) => setAbn(e.target.value)}
                />
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button
                onClick={handleAddCustomer}
                className="w-full"
              >
                Save Customer
              </Button>

            </div>
          </DialogContent>
        </Dialog>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
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

          <Button
            disabled
            variant="outline"
            className="w-full md:w-auto flex items-center gap-2 text-slate-600 border-slate-200"
          >
            <Filter size={18} />
            Filter
          </Button>
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
            <div className="overflow-x-auto">
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
          )}
        </div>
      </div>
    </div>
  );
}