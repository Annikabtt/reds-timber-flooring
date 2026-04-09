import React, { useState, useEffect } from 'react';
import { 
  Calculator, User, Box, Ruler, Hammer, 
  FileText, Send, Download, PlusCircle 
} from 'lucide-react';
import { Button } from "@/components/ui/button";

// --- Mock Data ---
const mockCustomers = [
  { id: "CUST-1001", name: "Sarah Jenkins", tier: "Walk-in" },
  { id: "CUST-1002", name: "James Wilson (Contractor)", tier: "Contractor" },
];

const mockProducts = [
  { id: "SPC-01", name: "Oak SPC Hybrid", pricePerSqm: 35.00 },
  { id: "TMB-01", name: "Spotted Gum Timber", pricePerSqm: 85.00 },
  { id: "LAM-01", name: "Classic Laminate", pricePerSqm: 25.00 },
];

export default function QuotationBuilder() {
  // --- States สำหรับเก็บค่าที่ผู้ใช้กรอก ---
  const [selectedCustomer, setSelectedCustomer] = useState(mockCustomers[0]);
  const [selectedProduct, setSelectedProduct] = useState(mockProducts[0]);
  const [areaSqm, setAreaSqm] = useState<number>(50);
  const [wastagePercent, setWastagePercent] = useState<number>(5);
  
  // ค่าแรงพื้นฐาน (Mock)
  const laborRatePerSqm = 25.00; 

  // --- ตัวแปรสำหรับแสดงผลการคำนวณ ---
  const [calcResult, setCalcResult] = useState({
    totalArea: 0,
    materialCost: 0,
    laborCost: 0,
    subtotal: 0,
    markupAmount: 0,
    grandTotal: 0
  });

  // --- Logic คำนวณอัตโนมัติ (จำลอง) ---
  useEffect(() => {
    // 1. คำนวณพื้นที่รวมเผื่อเสีย (Wastage)
    const totalArea = areaSqm * (1 + wastagePercent / 100);
    
    // 2. คำนวณต้นทุน
    const materialCost = totalArea * selectedProduct.pricePerSqm;
    const laborCost = areaSqm * laborRatePerSqm; // ค่าแรงคิดตามพื้นที่จริง ไม่คิดส่วนเผื่อเสีย
    const subtotal = materialCost + laborCost;

    // 3. ดึง % Markup ลับ ตาม Tier ของลูกค้า (จำลองดึงจากตั้งค่า)
    let markupRate = 0.35; // Default Walk-in 35%
    if (selectedCustomer.tier === "Contractor") markupRate = 0.15;
    if (selectedCustomer.tier === "Designer") markupRate = 0.20;
    
    const markupAmount = subtotal * markupRate;
    const grandTotal = subtotal + markupAmount;

    setCalcResult({
      totalArea,
      materialCost,
      laborCost,
      subtotal,
      markupAmount,
      grandTotal
    });
  }, [areaSqm, selectedProduct, selectedCustomer, wastagePercent]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Calculator className="text-indigo-600" size={32} />
            Quotation Builder
          </h1>
          <p className="text-slate-500 mt-1">Create fast, accurate estimates based on client tiers.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* 🔴 ฝั่งซ้าย: ฟอร์มกรอกข้อมูล (Input Form) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. Customer Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <User className="text-slate-400" size={20} />
                <h2 className="font-bold text-slate-800">1. Select Client</h2>
              </div>
              <div className="flex gap-4">
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  onChange={(e) => setSelectedCustomer(mockCustomers.find(c => c.id === e.target.value) || mockCustomers[0])}
                >
                  {mockCustomers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.tier})</option>
                  ))}
                </select>
                <Button variant="outline" className="border-slate-200 text-indigo-600 hover:bg-indigo-50 px-4">
                  <PlusCircle size={20} />
                </Button>
              </div>
            </div>

            {/* 2. Project Specs Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <Ruler className="text-slate-400" size={20} />
                <h2 className="font-bold text-slate-800">2. Project Measurements</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Floor Area (SQM)</label>
                  <input 
                    type="number" 
                    value={areaSqm}
                    onChange={(e) => setAreaSqm(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Wastage Buffer (%)</label>
                  <select 
                    value={wastagePercent}
                    onChange={(e) => setWastagePercent(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value={5}>5% (Standard)</option>
                    <option value={10}>10% (Herringbone / Complex)</option>
                    <option value={15}>15% (Custom Pattern)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 3. Material Selection */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <Box className="text-slate-400" size={20} />
                <h2 className="font-bold text-slate-800">3. Select Material</h2>
              </div>
              <div className="space-y-3">
                {mockProducts.map(product => (
                  <label key={product.id} className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedProduct.id === product.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}>
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="material" 
                        className="w-4 h-4 text-indigo-600 accent-indigo-600"
                        checked={selectedProduct.id === product.id}
                        onChange={() => setSelectedProduct(product)}
                      />
                      <span className="font-bold text-slate-700">{product.name}</span>
                    </div>
                    <span className="text-slate-500 text-sm font-mono">${product.pricePerSqm.toFixed(2)} / SQM</span>
                  </label>
                ))}
              </div>
            </div>

          </div>

          {/* 🔴 ฝั่งขวา: สรุปใบเสนอราคา (Live Preview) */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900 rounded-3xl shadow-xl border border-slate-800 p-6 md:p-8 text-white sticky top-24">
              
              <div className="flex justify-between items-start mb-8 pb-6 border-b border-slate-800">
                <div>
                  <h3 className="text-xl font-black text-white">ESTIMATE</h3>
                  <p className="text-slate-400 text-xs mt-1 font-mono">REF: EST-{Math.floor(Math.random() * 10000)}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Client</p>
                  <p className="font-bold text-sm text-indigo-400">{selectedCustomer.name}</p>
                  <p className="text-slate-500 text-xs mt-1">Tier: {selectedCustomer.tier}</p>
                </div>
              </div>

              {/* Breakdown */}
              <div className="space-y-4 text-sm mb-8 pb-6 border-b border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Area (incl. {wastagePercent}% wastage)</span>
                  <span className="font-mono">{calcResult.totalArea.toFixed(2)} SQM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Material ({selectedProduct.name})</span>
                  <span className="font-mono">${calcResult.materialCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Labor (Installation)</span>
                  <span className="font-mono">${calcResult.laborCost.toFixed(2)}</span>
                </div>
                {/* 🔴 ซ่อนการโชว์ Markup ไว้ไม่ให้ลูกค้าเห็นในบิลจริง (โชว์เฉพาะแอดมินตอนทำงาน) */}
                <div className="flex justify-between text-indigo-400/80 italic text-xs pt-2">
                  <span>*Internal System Markup Applied</span>
                  <span className="font-mono">+${calcResult.markupAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-end mb-8">
                <span className="text-slate-400 uppercase tracking-widest text-xs font-bold">Grand Total</span>
                <span className="text-4xl font-black text-white font-mono">
                  ${calcResult.grandTotal.toFixed(2)}
                </span>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold h-12 rounded-xl">
                  <Download size={18} className="mr-2" /> PDF
                </Button>
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-indigo-900/50">
                  <Send size={18} className="mr-2" /> Send
                </Button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}