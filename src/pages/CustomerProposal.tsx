import React from 'react';
import { FileText, Download, CheckCircle, MapPin, Phone, Mail, Building, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

export default function CustomerProposal() {
  const navigate = useNavigate();

  // --- Mock Data: ข้อมูลบิลจำลอง (ที่บวกกำไรมาเรียบร้อยแล้ว ซ่อนต้นทุนไว้) ---
  const proposalData = {
    proposalId: "QT-2026-0842",
    date: "April 10, 2026",
    validUntil: "April 24, 2026",
    customer: {
      name: "Mr. John Smith",
      address: "123 Sunshine Boulevard, Sydney Area",
      phone: "+61 412 345 678",
      email: "john.smith@example.com"
    },
    // รายการวัสดุ
    items: [
      { name: "Natural Oak Hybrid (SPC)", qty: 55, unit: "SQM", price: 45.00, total: 2475.00 },
      { name: "White Skirting 90mm", qty: 42, unit: "LM", price: 18.00, total: 756.00 },
      { name: "Acoustic Underlay 2mm", qty: 55, unit: "SQM", price: 8.00, total: 440.00 }
    ],
    // ค่าแรงติดตั้ง
    labor: { name: "Professional Flooring Installation", qty: 55, unit: "SQM", price: 35.00, total: 1925.00 },
  };

  // คำนวณยอดรวม
  const materialSubtotal = proposalData.items.reduce((sum, item) => sum + item.total, 0);
  const subtotal = materialSubtotal + proposalData.labor.total;
  const tax = subtotal * 0.10; // สมมติภาษี 10% (GST)
  const grandTotal = subtotal + tax;

  return (
    <div className="min-h-screen bg-slate-100 font-sans p-4 md:p-8 flex flex-col items-center">
      
      {/* --- Action Bar (ปุ่มควบคุมด้านบน) --- */}
      <div className="w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="text-slate-500 hover:text-slate-900 bg-white shadow-sm"
        >
          <ArrowLeft size={18} className="mr-2" /> Back
        </Button>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-bold">
            <Download size={18} className="mr-2" /> Download PDF
          </Button>
          <Button className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20">
            <CheckCircle size={18} className="mr-2" /> Accept Proposal
          </Button>
        </div>
      </div>

      {/* --- กระดาษ A4 (Proposal Document) --- */}
      {/* โค้ดใหม่ (เปลี่ยนเป็นเทาอ่อน bg-slate-50) */}
        <div className="w-full max-w-4xl bg-slate-55 rounded-xl shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header กระดาษ */}
        <div className="bg-red-600/20 p-8 md:p-12 text-red-900 flex flex-col md:flex-row justify-between items-start gap-8 border-b border-red-200">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Building size={32} className="text-red-600" />
              <h1 className="text-3xl font-black tracking-tight text-red-800">RED'S TIMBER</h1>
            </div>
            <p className="text-red-700 font-medium text-sm">Premium Flooring Specialists</p>
            <div className="mt-6 space-y-1 text-sm text-red-800">
              <p className="flex items-center gap-2"><MapPin size={14} className="text-red-500"/> 456 Industrial Ave, Sydney</p>
              <p className="flex items-center gap-2"><Phone size={14} className="text-red-500"/> 1800-REDS-FLR</p>
              <p className="flex items-center gap-2"><Mail size={14} className="text-red-500"/> contact@redstimber.com</p>
            </div>
          </div>

          {/* กล่อง Quotation (ปรับเป็นสีขาวขุ่นให้ตัดกับพื้นแดง) */}
          <div className="text-left md:text-right w-full md:w-auto bg-white/60 p-6 rounded-xl border border-red-300 shadow-sm">
            <h2 className="text-2xl font-bold text-red-700 tracking-widest uppercase mb-4">Quotation</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between md:justify-end gap-8">
                <span className="text-red-600/80 font-medium">Quote No:</span>
                <span className="font-bold text-red-900">{proposalData.proposalId}</span>
              </div>
              <div className="flex justify-between md:justify-end gap-8">
                <span className="text-red-600/80 font-medium">Date:</span>
                <span className="font-bold text-red-900">{proposalData.date}</span>
              </div>
              <div className="flex justify-between md:justify-end gap-8">
                <span className="text-red-600/80 font-medium">Valid Until:</span>
                <span className="font-bold text-red-600">{proposalData.validUntil}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 md:p-12">
          {/* Bill To Section */}
          <div className="mb-10">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">Prepared For</h3>
            <h4 className="text-xl font-bold text-slate-800">{proposalData.customer.name}</h4>
            <p className="text-slate-500 mt-1">{proposalData.customer.address}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
              <span>{proposalData.customer.phone}</span>
              <span className="text-slate-300">•</span>
              <span>{proposalData.customer.email}</span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 text-sm">
                  <th className="py-3 px-2 font-bold text-slate-800 w-1/2">Description</th>
                  <th className="py-3 px-2 font-bold text-slate-800 text-center">Qty</th>
                  <th className="py-3 px-2 font-bold text-slate-800 text-right">Unit Price</th>
                  <th className="py-3 px-2 font-bold text-slate-800 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {/* วนลูปวัสดุ */}
                {proposalData.items.map((item, index) => (
                  <tr key={index} className="border-b border-slate-100">
                    <td className="py-4 px-2 font-medium text-slate-800">{item.name}</td>
                    <td className="py-4 px-2 text-center text-slate-600">{item.qty} <span className="text-xs">{item.unit}</span></td>
                    <td className="py-4 px-2 text-right text-slate-600">${item.price.toFixed(2)}</td>
                    <td className="py-4 px-2 text-right font-bold text-slate-800">${item.total.toFixed(2)}</td>
                  </tr>
                ))}
                
                {/* ค่าแรง (แยกให้เห็นชัดเจน) */}
                <tr className="border-b border-slate-100 bg-slate-50">
                  <td className="py-4 px-2 font-medium text-indigo-700 flex items-center gap-2">
                    <FileText size={16} /> {proposalData.labor.name}
                  </td>
                  <td className="py-4 px-2 text-center text-indigo-600">{proposalData.labor.qty} <span className="text-xs">{proposalData.labor.unit}</span></td>
                  <td className="py-4 px-2 text-right text-indigo-600">${proposalData.labor.price.toFixed(2)}</td>
                  <td className="py-4 px-2 text-right font-bold text-indigo-700">${proposalData.labor.total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

         {/* Summary Box */}
          <div className="flex flex-col items-end mt-8">
            <div className="w-full md:w-1/2 space-y-3">
              
              <div className="flex justify-between text-slate-600 px-2">
                <span>Subtotal</span>
                <span className="font-bold text-slate-800">${subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-slate-600 px-2 pb-3 border-b border-slate-200">
                <span>Tax / GST (10%)</span>
                <span className="font-bold text-slate-800">${tax.toFixed(2)}</span>
              </div>
              
              {/* 👇 จุดที่เปลี่ยน: Grand Total สีแดงโปร่งแสง โดดเด่นกระแทกตา */}
              <div className="flex justify-between items-center bg-red-600/20 border-2 border-red-500 p-5 rounded-xl shadow-lg shadow-red-500/20">
                <span className="font-black uppercase tracking-widest text-sm text-red-800">Grand Total</span>
                <span className="text-3xl font-black text-red-700">${grandTotal.toFixed(2)}</span>
              </div>
              
            </div>
          </div>

          {/* Footer / Terms */}
          <div className="mt-16 pt-8 border-t border-slate-200 text-xs text-slate-400 space-y-2">
            <p className="font-bold text-slate-500 uppercase">Terms & Conditions</p>
            <p>1. This quotation is valid for 14 days from the date of issue.</p>
            <p>2. A 50% deposit is required to secure the installation date and order materials.</p>
            <p>3. Floor preparation (leveling, removing old floors) is not included unless explicitly stated above.</p>
          </div>

        </div>
      </div>

    </div>
  );
}