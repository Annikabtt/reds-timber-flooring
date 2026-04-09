import React, { useState } from 'react';
import { 
  Building2, Plus, Search, Filter, MoreVertical, 
  Phone, Mail, MapPin, Star, MessageCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";

// --- Mock Data ---
const mockCustomers = [
  {
    id: "CUST-1001",
    name: "Sarah Jenkins",
    company: "Private Homeowner",
    phone: "0412 345 678",
    whatsapp: "+61 412 345 678",
    email: "sarah.j@email.com",
    tier: "Walk-in",
    source: "Google Search",
    propertyType: "House",
    address: "123 Sydney Rd, Brunswick VIC 3056"
  },
  {
    id: "CUST-1002",
    name: "James Wilson",
    company: "Wilson Construction Pty Ltd",
    phone: "0498 765 432",
    whatsapp: "+61 498 765 432",
    email: "projects@wilsonconst.com.au",
    tier: "Contractor",
    source: "Referral",
    propertyType: "Apartment/Condo",
    address: "Level 4, 50 Lonsdale St, Melbourne VIC 3000"
  },
  {
    id: "CUST-1003",
    name: "Elena Rodriguez",
    company: "ER Interior Design",
    phone: "0455 555 555",
    whatsapp: "+61 455 555 555",
    email: "hello@erdesign.com.au",
    tier: "Designer",
    source: "Instagram",
    propertyType: "Office",
    address: "Suite 2, 88 Chapel St, Windsor VIC 3181"
  }
];

export default function CustomerDatabase() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <Building2 className="text-red-600" size={32} />
              Customer Management
            </h1>
            <p className="text-slate-500 mt-1">Manage client profiles, contact details, and customer tiers.</p>
          </div>
          <Button className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl shadow-lg shadow-red-200 transition-all flex items-center gap-2">
            <Plus size={20} />
            Add New Customer
          </Button>
        </div>

        {/* --- Filter & Search Bar --- */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search by name, company, or ID..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="w-full md:w-auto flex items-center gap-2 text-slate-600 border-slate-200">
            <Filter size={18} />
            Filter
          </Button>
        </div>

        {/* --- Data Table --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider">Customer Details</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider">Contact Info</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider">Tier & Source</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider">Property & Location</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                    
                    {/* Customer Details Column */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-base">{customer.name}</span>
                        <span className="text-slate-500 text-xs font-medium">{customer.company}</span>
                        <span className="text-slate-400 text-xs font-mono mt-1">{customer.id}</span>
                      </div>
                    </td>

                    {/* Contact Info Column */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 text-slate-600 text-xs">
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-slate-400" /> {customer.phone}
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageCircle size={14} className="text-emerald-500" /> {customer.whatsapp}
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-slate-400" /> {customer.email}
                        </div>
                      </div>
                    </td>

                    {/* Tier Column */}
                    <td className="px-6 py-4">
                      <TierBadge tier={customer.tier} />
                      <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                        Source: <span className="font-medium text-slate-600">{customer.source}</span>
                      </div>
                    </td>

                    {/* Location Column */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-xs">
                        <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded w-fit">
                          {customer.propertyType}
                        </span>
                        <div className="flex items-start gap-1 text-slate-500 mt-1 max-w-[200px] whitespace-normal">
                          <MapPin size={14} className="min-w-[14px] mt-0.5 text-red-500" />
                          <span>{customer.address}</span>
                        </div>
                      </div>
                    </td>

                    {/* Actions Column */}
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-600 transition-colors">
                        <MoreVertical size={18} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

// --- Helper Component ---
function TierBadge({ tier }: { tier: string }) {
  const styles: Record<string, string> = {
    "Walk-in": "bg-slate-100 text-slate-700 border-slate-200",
    "Contractor": "bg-blue-50 text-blue-700 border-blue-200",
    "Designer": "bg-purple-50 text-purple-700 border-purple-200",
    "VIP": "bg-amber-50 text-amber-700 border-amber-200",
  };

  const showStar = tier === "VIP" || tier === "Designer";

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full w-fit border ${styles[tier] || styles["Walk-in"]}`}>
      {showStar && <Star size={12} className={tier === "VIP" ? "fill-amber-500 text-amber-500" : ""} />}
      <span className="text-xs font-bold">{tier}</span>
    </div>
  );
}