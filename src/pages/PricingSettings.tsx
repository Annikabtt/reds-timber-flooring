import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; //
import { 
  Settings, TrendingUp, DollarSign, Percent, 
  Save, AlertCircle, ShieldCheck, ArrowLeft //
} from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function PricingSettings() {
    const navigate = useNavigate(); //
  // --- States สำหรับเก็บค่า Markup (จำลองว่าดึงมาจาก Database) ---
  const [markups, setMarkups] = useState({
    walkIn: 35,
    designer: 20,
    contractor: 15,
    vip: 10,
  });

  const [globals, setGlobals] = useState({
    baseLaborRate: 25.00,
    defaultWastage: 5,
  });

  const handleSave = () => {
    // ในอนาคตตรงนี้จะเขียนโค้ดส่งข้อมูลบันทึกลง Supabase
    alert("✅ Pricing margins have been updated and securely saved!");
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
       return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* 👇 เอาโค้ดปุ่ม มาวางแทรกตรงนี้เลยครับ! 👇 */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/portal')} 
          className="text-slate-500 hover:text-slate-900 hover:bg-slate-200 -ml-4"
        >
          <ArrowLeft className="mr-2" size={20} />
          Back to Portal
        </Button>
        {/* 👆 จบโค้ดปุ่ม 👆 */}

        {/* --- Header --- */}
        <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          {/* ... โค้ดด้านใน Header ... */}

        {/* --- Header --- */}
        <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <ShieldCheck size={20} />
                <span className="text-xs font-bold uppercase tracking-widest">Owner Access Only</span>
              </div>
              <h1 className="text-3xl font-black flex items-center gap-3">
                Pricing Control Room
              </h1>
              <p className="text-slate-400 mt-2 text-sm">Adjust your profit margins, labor rates, and system defaults.</p>
            </div>
            <Button 
              onClick={handleSave}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-6 px-8 rounded-xl shadow-lg shadow-red-900/50 transition-all flex items-center gap-2 text-lg"
            >
              <Save size={24} />
              Save Changes
            </Button>
          </div>
          {/* Background Decoration */}
          <Settings className="absolute -right-10 -bottom-10 text-slate-800 opacity-50" size={200} />
        </div>

        {/* --- Main Content Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 🔴 Section 1: Tier Markups */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
              <TrendingUp className="text-emerald-600" size={24} />
              <h2 className="text-xl font-bold text-slate-800">Profit Margins (Markup)</h2>
            </div>
            
            <div className="space-y-5">
              <MarkupInput 
                label="Walk-in Client" 
                desc="Standard retail margin"
                value={markups.walkIn} 
                onChange={(val) => setMarkups({...markups, walkIn: val})} 
              />
              <MarkupInput 
                label="Interior Designer" 
                desc="Trade discount tier 1"
                value={markups.designer} 
                onChange={(val) => setMarkups({...markups, designer: val})} 
              />
              <MarkupInput 
                label="Contractor / Builder" 
                desc="Volume builder margin"
                value={markups.contractor} 
                onChange={(val) => setMarkups({...markups, contractor: val})} 
              />
              <MarkupInput 
                label="VIP / Friends & Family" 
                desc="Lowest allowed margin"
                value={markups.vip} 
                onChange={(val) => setMarkups({...markups, vip: val})} 
              />
            </div>
          </div>

          {/* 🔴 Section 2: Global Settings */}
          <div className="space-y-6">
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                <DollarSign className="text-blue-600" size={24} />
                <h2 className="text-xl font-bold text-slate-800">Base Rates</h2>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="font-bold text-slate-700 text-sm block mb-2">Standard Labor Rate ($ / SQM)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="number" 
                      value={globals.baseLaborRate}
                      onChange={(e) => setGlobals({...globals, baseLaborRate: Number(e.target.value)})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-lg font-bold focus:ring-2 focus:ring-red-500 outline-none"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-2">This base rate is applied before any tier markups.</p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-amber-600 mt-0.5" size={20} />
                <div>
                  <h3 className="font-bold text-amber-800">Confidentiality Notice</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    These settings directly impact the Quotation Builder. Only users with the <span className="font-bold">Business Owner</span> role can view or edit this page.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

// --- Helper Component ---
function MarkupInput({ label, desc, value, onChange }: any) {
  return (
    <div className="flex items-center justify-between group">
      <div>
        <label className="font-bold text-slate-700 block">{label}</label>
        <span className="text-xs text-slate-400">{desc}</span>
      </div>
      <div className="relative w-24">
        <input 
          type="number" 
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-8 pl-3 py-2 text-right font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all group-hover:border-emerald-300"
        />
        <Percent className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
      </div>
    </div>
  );
}