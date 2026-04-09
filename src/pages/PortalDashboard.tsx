import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Users, Briefcase, Calculator, 
  Settings, LogOut, Building2, UserCircle, ChevronRight, PackageOpen
} from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function PortalDashboard() {
  const navigate = useNavigate();
  // State จำลองการล็อกอิน (null = ยังไม่ล็อกอิน, 'owner', 'admin', 'installer')
  const [activeRole, setActiveRole] = useState<string | null>(null);

  // --- หน้าจอ 1: เลือก Role เพื่อล็อกอิน (Login Simulator) ---
  if (!activeRole) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-slate-100">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">System Portal</h1>
            <p className="text-slate-500 text-sm mt-2">Select your role to access the workspace</p>
          </div>
          <div className="space-y-4">
            <Button onClick={() => setActiveRole('owner')} className="w-full h-14 text-base font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md">
              <UserCircle className="mr-2 w-5 h-5" /> Login as Business Owner
            </Button>
            <Button onClick={() => setActiveRole('admin')} className="w-full h-14 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md">
              <Briefcase className="mr-2 w-5 h-5" /> Login as Admin / Sales
            </Button>
            <Button onClick={() => setActiveRole('installer')} className="w-full h-14 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
              <Users className="mr-2 w-5 h-5" /> Login as Installer (Sub)
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- หน้าจอ 2: Dashboard หลัก (แสดงเมนูตาม Role) ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header & Logout */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl text-white ${
              activeRole === 'owner' ? 'bg-slate-900' : 
              activeRole === 'admin' ? 'bg-blue-600' : 'bg-emerald-600'
            }`}>
              {activeRole === 'owner' ? <Shield size={24} /> : 
               activeRole === 'admin' ? <Briefcase size={24} /> : <Users size={24} />}
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 uppercase">
                {activeRole} Workspace
              </h1>
              <p className="text-sm text-slate-500">Welcome back, here is your daily overview.</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setActiveRole(null)}
            className="text-slate-500 hover:text-red-600 border-slate-200"
          >
            <LogOut className="mr-2 w-4 h-4" /> Sign Out
          </Button>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          
          {/* Menu 1: Job Card (ทุกคนเห็นได้ แต่ช่างเห็นแค่นี้) */}
          <DashboardCard 
            title="My Job Cards" 
            desc="View daily tasks and update progress."
            icon={<Briefcase />}
            color="emerald"
            onClick={() => navigate('/job-card')}          
          />
          
          {/* Menu 1.5: Material Request (Installer, Admin, Owner เห็นหมด) */}
          <DashboardCard 
            title="Material Requisition" 
            desc="Request items for your assigned jobs."
            icon={<PackageOpen />}
            color="emerald"
            onClick={() => navigate('/material-request')}
          />


          {/* Menu 2: Customers (Owner & Admin เห็น) */}
          {(activeRole === 'owner' || activeRole === 'admin') && (
            <DashboardCard 
              title="Customer Database" 
              desc="Manage clients and projects."
              icon={<Building2 />}
              color="blue"
              onClick={() => navigate('/customers')}
            />
          )}

          {/* Menu 3: Quotation Builder (Owner & Admin เห็น) */}
          {(activeRole === 'owner' || activeRole === 'admin') && (
            <DashboardCard 
              title="Quotation Builder" 
              desc="Create new estimates for clients."
              icon={<Calculator />}
              color="indigo"
              onClick={() => navigate('/quotation-builder')}
            />
          )}

          {/* Menu 4: Installers (Owner เห็นเท่านั้น) */}
          {activeRole === 'owner' && (
            <DashboardCard 
              title="Installer Database" 
              desc="Manage staff, subs, and work permits."
              icon={<Users />}
              color="slate"
              onClick={() => navigate('/installers')}
            />
          )}

          {/* Menu 5: Secret Pricing Menu (Owner เห็นเท่านั้น) */}
          {activeRole === 'owner' && (
            <DashboardCard 
              title="Pricing Settings" 
              desc="CONFIDENTIAL: Adjust margins and markup."
              icon={<Settings />}
              color="red"
              onClick={() => navigate('/pricing')}
            />
          )}

        </div>
      </div>
    </div>
  );
}

// --- Helper Component สำหรับวาดกล่องเมนู ---
function DashboardCard({ title, desc, icon, color, onClick }: any) {
  const colorStyles: any = {
    slate: "bg-slate-50 text-slate-600 group-hover:bg-slate-600",
    red: "bg-red-50 text-red-600 group-hover:bg-red-600",
    blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-600",
    emerald: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600",
    indigo: "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600",
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between min-h-[160px]"
    >
      <div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors group-hover:text-white mb-4 ${colorStyles[color]}`}>
          {icon}
        </div>
        <h3 className="font-bold text-lg text-slate-900">{title}</h3>
        <p className="text-slate-500 text-sm mt-1">{desc}</p>
      </div>
      <div className="flex justify-end mt-4">
        <ChevronRight className="text-slate-300 group-hover:text-slate-900 transition-colors" />
      </div>
    </div>
  );
}