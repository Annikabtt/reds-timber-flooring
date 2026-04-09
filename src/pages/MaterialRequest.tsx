import React, { useState } from 'react';
import { 
  ClipboardList, Search, Plus, Trash2, 
  Send, Clock, CheckCircle, PackageOpen 
} from 'lucide-react';
import { Button } from "@/components/ui/button";

// --- Mock Data ---
const mockJobs = [
  { id: 'JOB-101', name: 'Smith Residence - Kitchen' },
  { id: 'JOB-102', name: 'Oak Valley Office - Lobby' },
];

const mockCatalog = [
  { sku: 'SPC-OAK-01', name: 'Natural Oak SPC', unit: 'Box (2.2 SQM)', stock: 150 },
  { sku: 'SUP-GLU-PU', name: 'Premium PU Adhesive', unit: 'Bucket (15kg)', stock: 45 },
  { sku: 'ACC-SKT-90W', name: 'White Skirting 90mm', unit: 'Length', stock: 400 },
];

export default function MaterialRequest() {
  const [selectedJob, setSelectedJob] = useState(mockJobs[0].id);
  const [cart, setCart] = useState<{sku: string, name: string, qty: number, unit: string}[]>([]);
  const [search, setSearch] = useState('');

  // ฟังก์ชันเพิ่มของลงตะกร้าเบิก
  const addToCart = (item: any) => {
    const existing = cart.find(c => c.sku === item.sku);
    if (existing) {
      setCart(cart.map(c => c.sku === item.sku ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { sku: item.sku, name: item.name, qty: 1, unit: item.unit }]);
    }
  };

  // ฟังก์ชันลบของออกจากตะกร้า
  const removeFromCart = (sku: string) => {
    setCart(cart.filter(c => c.sku !== sku));
  };

  // ฟังก์ชันจำลองการกดส่งใบเบิก
  const handleSubmit = () => {
    if (cart.length === 0) return alert("Your request cart is empty!");
    alert("✅ Material request submitted successfully! Waiting for admin approval.");
    setCart([]); // ล้างตะกร้าหลังกดส่ง
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <PackageOpen className="text-emerald-600" size={32} />
            Material Requisition
          </h1>
          <p className="text-slate-500 mt-1">Request materials and tools for your assigned projects.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* 🔴 ฝั่งซ้าย: เลือกโปรเจกต์ & ค้นหาของ */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* เลือก Job */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <label className="font-bold text-slate-800 block mb-3">1. Select Project / Job Card</label>
              <select 
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {mockJobs.map(job => (
                  <option key={job.id} value={job.id}>{job.id} : {job.name}</option>
                ))}
              </select>
            </div>

            {/* ค้นหาแคตตาล็อก */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <label className="font-bold text-slate-800 block mb-3">2. Add Items to Request</label>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search materials or SKU..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                />
              </div>

              {/* รายการของที่ค้นเจอ */}
              <div className="space-y-3">
                {mockCatalog.filter(item => item.name.toLowerCase().includes(search.toLowerCase()) || item.sku.toLowerCase().includes(search.toLowerCase())).map(item => (
                  <div key={item.sku} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{item.name}</h4>
                      <p className="text-xs text-slate-500">{item.sku} • {item.unit}</p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => addToCart(item)}
                      className="bg-slate-900 hover:bg-emerald-600 text-white rounded-lg px-3"
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* ประวัติการเบิก (History) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <ClipboardList size={20} className="text-slate-400" />
                Recent Requests
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <div>
                    <p className="text-sm font-bold text-slate-800">REQ-8042 (Smith Residence)</p>
                    <p className="text-xs text-slate-500 mt-0.5">3 items requested</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-600 text-xs font-bold px-2.5 py-1 bg-amber-100/50 rounded-full">
                    <Clock size={14} /> Pending Approval
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-sm font-bold text-slate-800">REQ-8040 (Oak Valley)</p>
                    <p className="text-xs text-slate-500 mt-0.5">Adhesive & Underlay</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold px-2.5 py-1 bg-emerald-100/50 rounded-full">
                    <CheckCircle size={14} /> Ready for Pickup
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* 🔴 ฝั่งขวา: ตะกร้าใบเบิกของ (Request Cart) */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900 rounded-3xl shadow-xl border border-slate-800 p-6 md:p-8 text-white sticky top-24">
              <h3 className="text-xl font-black text-white mb-6 border-b border-slate-800 pb-4">
                Current Request
              </h3>

              {cart.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <PackageOpen size={48} className="mx-auto mb-3 opacity-50" />
                  <p>No items added yet.</p>
                </div>
              ) : (
                <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto pr-2 hide-scrollbar">
                  {cart.map((item) => (
                    <div key={item.sku} className="bg-slate-800/50 p-4 rounded-xl flex items-center justify-between border border-slate-700">
                      <div className="flex-1">
                        <p className="font-bold text-sm text-slate-200">{item.name}</p>
                        <p className="text-xs text-slate-400 mt-1">{item.unit}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <span className="text-xs text-slate-500 block">QTY</span>
                          <span className="font-bold text-lg text-emerald-400">{item.qty}</span>
                        </div>
                        <button onClick={() => removeFromCart(item.sku)} className="text-slate-500 hover:text-red-400 transition-colors p-2">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button 
                onClick={handleSubmit}
                disabled={cart.length === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-14 rounded-xl shadow-lg shadow-emerald-900/50 disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none transition-all"
              >
                <Send size={18} className="mr-2" /> 
                Submit Request
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}