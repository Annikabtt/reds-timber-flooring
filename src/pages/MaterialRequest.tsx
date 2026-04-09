import React, { useState } from 'react';
import { 
  ClipboardList, Search, Plus, Trash2, 
  Send, Clock, CheckCircle, PackageOpen,
  Layers, Spline, Wrench
} from 'lucide-react';
import { Button } from "@/components/ui/button";

// --- 1. Categories (ก๊อปมาจากหน้า Catalog) ---
const mainCategories = [
  { id: 'flooring', name: 'Flooring', icon: <Layers size={16} /> },
  { id: 'accessories', name: 'Accessories', icon: <Spline size={16} /> },
  { id: 'supplies', name: 'Supplies & Tools', icon: <Wrench size={16} /> },
];

const subCategories: Record<string, { id: string, name: string }[]> = {
  flooring: [
    { id: 'all', name: 'All Flooring' },
    { id: 'spc', name: 'SPC Hybrid' },
    { id: 'timber', name: 'Engineered Timber' },
    { id: 'laminate', name: 'Laminate' },
  ],
  accessories: [
    { id: 'all', name: 'All Accessories' },
    { id: 'skirting', name: 'Skirting' },
    { id: 'scotia', name: 'Scotia Trim' },
    { id: 't-molding', name: 'T-Molding' },
  ],
  supplies: [
    { id: 'all', name: 'All Supplies' },
    { id: 'adhesive', name: 'Adhesive' },
    { id: 'underlay', name: 'Underlay' },
    { id: 'tools', name: 'Tools' },
  ]
};

// --- 2. Mock Database ---
const mockJobs = [
  { id: 'JOB-101', name: 'Smith Residence - Kitchen' },
  { id: 'JOB-102', name: 'Oak Valley Office - Lobby' },
];

const mockProducts = [
  { sku: "SPC-OAK-01", name: "Natural Oak SPC", mainCat: "flooring", subCat: "spc", unit: "Box (2.2 SQM)", stock: 150 },
  { sku: "TMB-SG-02", name: "Spotted Gum Timber", mainCat: "flooring", subCat: "timber", unit: "Box (1.8 SQM)", stock: 80 },
  { sku: "ACC-SKT-90W", name: "White Skirting 90mm", mainCat: "accessories", subCat: "skirting", unit: "Length (5.4m)", stock: 400 }, 
  { sku: "ACC-SCT-OAK", name: "Oak Scotia Trim", mainCat: "accessories", subCat: "scotia", unit: "Length (2.4m)", stock: 120 },
  { sku: "SUP-GLU-PU", name: "Premium PU Adhesive", mainCat: "supplies", subCat: "adhesive", unit: "Bucket (15kg)", stock: 45 },
  { sku: "SUP-UND-02", name: "Acoustic Underlay 2mm", mainCat: "supplies", subCat: "underlay", unit: "Roll (20 SQM)", stock: 80 },
  { sku: "TOL-MAL-01", name: "Rubber Mallet", mainCat: "supplies", subCat: "tools", unit: "Piece", stock: 12 },
];

export default function MaterialRequest() {
  const [selectedJob, setSelectedJob] = useState(mockJobs[0].id);
  const [cart, setCart] = useState<{sku: string, name: string, qty: number, unit: string}[]>([]);
  
  // States สำหรับตัวกรอง
  const [search, setSearch] = useState('');
  const [activeMainCat, setActiveMainCat] = useState('flooring');
  const [activeSubCat, setActiveSubCat] = useState('all');

  const handleMainCatChange = (catId: string) => {
    setActiveMainCat(catId);
    setActiveSubCat('all');
  };

  const addToCart = (item: any) => {
    const existing = cart.find(c => c.sku === item.sku);
    if (existing) {
      setCart(cart.map(c => c.sku === item.sku ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { sku: item.sku, name: item.name, qty: 1, unit: item.unit }]);
    }
  };

  const removeFromCart = (sku: string) => {
    setCart(cart.filter(c => c.sku !== sku));
  };

  const handleSubmit = () => {
    if (cart.length === 0) return alert("Your request cart is empty!");
    alert("✅ Material request submitted successfully! Waiting for admin approval.");
    setCart([]);
  };

  // ฟังก์ชันกรองของที่จะแสดงให้เบิก
  const displayItems = mockProducts.filter(p => {
    const matchMain = p.mainCat === activeMainCat;
    const matchSub = activeSubCat === 'all' || p.subCat === activeSubCat;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    return matchMain && matchSub && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <PackageOpen className="text-emerald-600" size={32} />
            Material Requisition
          </h1>
          <p className="text-slate-500 mt-1">Request materials and tools for your assigned projects.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* --- ฝั่งซ้าย: ค้นหาและเลือกของ --- */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <label className="font-bold text-slate-800 block mb-3">1. Select Project / Job Card</label>
              <select 
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {mockJobs.map(job => (
                  <option key={job.id} value={job.id}>{job.id} : {job.name}</option>
                ))}
              </select>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 pb-0">
                <label className="font-bold text-slate-800 block mb-4">2. Browse & Add Items</label>
                
                {/* 🔴 ระบบกรอง 2 ชั้น สำหรับช่าง 🔴 */}
                <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                  {mainCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleMainCatChange(cat.id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                        activeMainCat === cat.id 
                          ? 'bg-white text-emerald-700 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {cat.icon}
                      <span className="hidden sm:inline">{cat.name}</span>
                    </button>
                  ))}
                </div>

                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search in this category..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  />
                </div>

                <div className="flex overflow-x-auto pb-4 gap-2 hide-scrollbar">
                  {subCategories[activeMainCat].map((subCat) => (
                    <button
                      key={subCat.id}
                      onClick={() => setActiveSubCat(subCat.id)}
                      className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                        activeSubCat === subCat.id 
                          ? 'bg-slate-800 text-white' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {subCat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* รายการของที่ค้นเจอ */}
              <div className="bg-slate-50 p-6 space-y-3 min-h-[300px] max-h-[400px] overflow-y-auto border-t border-slate-100">
                {displayItems.length > 0 ? (
                  displayItems.map(item => (
                    <div key={item.sku} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-300 shadow-sm transition-all">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{item.name}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">{item.sku}</span>
                          <span className="text-xs text-slate-500">{item.unit}</span>
                          <span className={`text-xs font-bold ${item.stock < 50 ? 'text-amber-500' : 'text-emerald-500'}`}>
                            Stock: {item.stock}
                          </span>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => addToCart(item)}
                        className="bg-slate-900 hover:bg-emerald-600 text-white rounded-lg px-4 h-10 shadow-md transition-colors"
                      >
                        <Plus size={18} className="mr-1" /> Add
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-slate-400">
                    <Search className="mx-auto mb-2 opacity-50" size={32} />
                    <p>No items found in this category.</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* ... (ส่วน History ย่อไว้เพื่อความกะทัดรัด) ... */}
          </div>

          {/* --- ฝั่งขวา: ตะกร้าใบเบิกของ --- */}
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