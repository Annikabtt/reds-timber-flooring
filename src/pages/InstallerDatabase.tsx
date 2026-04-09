import React, { useState } from 'react';
import { 
  Users, Plus, Search, Filter, MoreVertical, 
  AlertTriangle, CheckCircle, FileText, Phone, MapPin 
} from 'lucide-react';
import { Button } from "@/components/ui/button";

// --- Mock Data ---
const mockInstallers = [
  {
    id: "INST-001",
    name: "Michael Chen",
    whatsapp: "+61 412 345 678",
    employmentType: "Full-time",
    nationality: "Australian",
    workPermitExpiry: null, // Citizen
    skills: ["Timber", "SPC"],
    rate: "45.00",
    rateType: "Hourly",
    status: "Available"
  },
  {
    id: "INST-002",
    name: "David Silva",
    whatsapp: "+61 498 765 432",
    employmentType: "Sub-contractor",
    nationality: "Brazilian",
    workPermitExpiry: "2026-05-10", // Expiring soon!
    skills: ["SPC", "Skirting", "Leveling"],
    rate: "25.00",
    rateType: "SQM",
    status: "On-site"
  },
  {
    id: "INST-003",
    name: "John Smith",
    whatsapp: "+61 455 555 555",
    employmentType: "Hourly",
    nationality: "British",
    workPermitExpiry: "2028-12-01",
    skills: ["Timber", "Stairs"],
    rate: "40.00",
    rateType: "Hourly",
    status: "On Leave"
  }
];

export default function InstallerDatabase() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <Users className="text-red-600" size={32} />
              Installer Management
            </h1>
            <p className="text-slate-500 mt-1">Manage installer profiles, contracts, and work permits.</p>
          </div>
          <Button className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl shadow-lg shadow-red-200 transition-all flex items-center gap-2">
            <Plus size={20} />
            Add New Installer
          </Button>
        </div>

        {/* --- Filter & Search Bar --- */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search by name, ID, or skill..." 
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

        {/* --- Data Table / List --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider">Installer Profile</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider">Employment & Rate</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider">Work Permit Status</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider">Current Status</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockInstallers.map((installer) => (
                  <tr key={installer.id} className="hover:bg-slate-50 transition-colors">
                    
                    {/* Profile Column */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-lg border-2 border-white shadow-sm">
                          {installer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-base">{installer.name}</p>
                          <p className="text-slate-500 text-xs font-mono">{installer.id}</p>
                          <div className="flex items-center gap-1 text-slate-500 text-xs mt-1">
                            <Phone size={12} /> {installer.whatsapp}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Employment & Rate Column */}
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{installer.employmentType}</p>
                      <p className="text-slate-600 text-sm">
                        AUD ${installer.rate} <span className="text-slate-400 text-xs">/ {installer.rateType}</span>
                      </p>
                      <div className="flex gap-1 mt-2">
                        {installer.skills.map(skill => (
                          <span key={skill} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold border border-slate-200">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Work Permit Column (Compliance Check) */}
                    <td className="px-6 py-4">
                      {installer.workPermitExpiry ? (
                        <PermitBadge expiryDate={installer.workPermitExpiry} nationality={installer.nationality} />
                      ) : (
                        <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg w-fit border border-emerald-100">
                          <CheckCircle size={14} />
                          <span className="text-xs font-bold">{installer.nationality} (Citizen/PR)</span>
                        </div>
                      )}
                    </td>

                    {/* Status Column */}
                    <td className="px-6 py-4">
                      <StatusBadge status={installer.status} />
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

// --- Helper Components ---

function PermitBadge({ expiryDate, nationality }: { expiryDate: string, nationality: string }) {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
  
  let statusColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
  let icon = <CheckCircle size={14} />;
  let alertText = "Valid";

  if (daysLeft < 0) {
    statusColor = "bg-red-50 text-red-700 border-red-200";
    icon = <AlertTriangle size={14} />;
    alertText = "EXPIRED";
  } else if (daysLeft <= 45) {
    statusColor = "bg-amber-50 text-amber-700 border-amber-200";
    icon = <AlertTriangle size={14} />;
    alertText = `Expiring in ${daysLeft} days`;
  }

  return (
    <div className={`flex flex-col gap-1 px-3 py-2 rounded-lg border w-fit ${statusColor}`}>
      <div className="flex items-center gap-1.5 font-bold text-xs">
        {icon}
        <span>{alertText}</span>
      </div>
      <div className="text-[10px] opacity-80 font-medium">
        {nationality} • Exp: {expiryDate}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    "Available": "bg-emerald-100 text-emerald-700 border-emerald-200",
    "On-site": "bg-blue-100 text-blue-700 border-blue-200",
    "On Leave": "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || styles["On Leave"]}`}>
      {status}
    </span>
  );
}