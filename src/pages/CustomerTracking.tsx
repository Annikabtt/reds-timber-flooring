import React, { useState } from 'react';
import { CheckCircle2, MapPin, Sparkles, X, PenLine, FileSignature } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function CustomerTracking() {
  const [showSignModal, setShowSignModal] = useState(false);
  const [checks, setChecks] = useState([false, false, false, false]);
  const [isSigned, setIsSigned] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false); 

  const checklistItems = [
    "Flooring installed perfectly to agreed specifications.",
    "Skirting and scotia trims installed seamlessly.",
    "No visible scratches, dents, or defects on the floor.",
    "Site has been cleaned and all rubbish removed."
  ];

  const allChecked = checks.every(c => c === true);
  const toggleCheck = (index: number) => {
    const newChecks = [...checks];
    newChecks[index] = !newChecks[index];
    setChecks(newChecks);
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans sm:p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-md bg-white sm:rounded-3xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20"><img src="https://images.unsplash.com/photo-1600607686527-6fb886090705?w=600&q=80" className="w-full h-full object-cover" alt="bg"/></div>
          <div className="relative z-10">
            <h2 className="text-emerald-400 font-black tracking-widest text-sm uppercase mb-2">Project Handover</h2>
            <h1 className="text-2xl font-bold text-white">Smith Residence</h1>
            <p className="text-slate-400 text-sm mt-1 flex items-center justify-center gap-1"><MapPin size={14}/> 123 Sunshine Blvd</p>
          </div>
        </div>

        {/* Progress: 100% */}
        <div className={`p-6 border-b border-slate-100 text-center ${isCompleted ? 'bg-indigo-50' : 'bg-emerald-50'}`}>
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${isCompleted ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
            {isCompleted ? <FileSignature size={32} /> : <Sparkles size={32} />}
          </div>
          <h3 className={`font-bold text-lg ${isCompleted ? 'text-indigo-800' : 'text-emerald-800'}`}>
            {isCompleted ? "Project Successfully Closed!" : "Installation is 100% Complete!"}
          </h3>
          <p className={`text-sm mt-1 ${isCompleted ? 'text-indigo-600' : 'text-slate-500'}`}>
            {isCompleted ? "Warranty certificate has been sent to your email." : "All work is done! Please review the site and sign off below."}
          </p>
        </div>

        {/* Timeline (สีเขียวหมด งานเสร็จแล้ว) */}
        <div className="p-6 space-y-6">
          <div className="flex gap-4">
            <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center z-10"><CheckCircle2 size={16} /></div><div className="w-0.5 h-full bg-emerald-500 my-1"></div></div>
            <div className="pb-6"><h4 className="font-bold text-slate-900">Step 1: Preparation</h4><p className="text-sm text-slate-500 mt-1">Subfloor leveled and underlay placed.</p></div>
          </div>
          <div className="flex gap-4">
            <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center z-10"><CheckCircle2 size={16} /></div><div className="w-0.5 h-full bg-emerald-500 my-1"></div></div>
            <div className="pb-6"><h4 className="font-bold text-slate-900">Step 2: Laying Planks</h4><p className="text-sm text-slate-500 mt-1">Planks fully installed and secured.</p></div>
          </div>
          <div className="flex gap-4">
            <div className="flex flex-col items-center"><div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center z-10"><CheckCircle2 size={16} /></div></div>
            <div className="pb-2">
              <h4 className="font-bold text-slate-900">Step 3: Finishing & Cleanup</h4>
              <p className="text-sm text-slate-500 mt-1">Skirting installed and site cleaned up.</p>
            </div>
          </div>
        </div>

        {/* 👇 Footer Action: ปุ่มสีเขียวกระพริบ (animate-pulse) 👇 */}
        {!isCompleted && (
          <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-xs font-bold text-emerald-600 mb-4">✨ Everything is ready for you! ✨</p>
            <Button 
              onClick={() => setShowSignModal(true)} 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-14 rounded-xl shadow-lg shadow-emerald-600/30 text-lg animate-pulse"
            >
              Sign Off & Approve Job
            </Button>
          </div>
        )}
      </div>

      {/* MODAL: CHECKLIST & SIGNATURE (ฟอร์มเซ็นรับงาน) */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900">Handover Checklist</h3>
              <button onClick={() => setShowSignModal(false)} className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6">
              <p className="text-sm text-slate-500">Please confirm the following items before signing.</p>
              
              {/* รายการ Checkbox */}
              <div className="space-y-3">
                {checklistItems.map((item, idx) => (
                  <label key={idx} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${checks[idx] ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                    <input type="checkbox" className="mt-1 w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" checked={checks[idx]} onChange={() => toggleCheck(idx)} />
                    <span className={`text-sm font-medium ${checks[idx] ? 'text-emerald-800' : 'text-slate-700'}`}>{item}</span>
                  </label>
                ))}
              </div>
              
              {/* ช่องเซ็นชื่อ */}
              <div className="pt-4 border-t border-slate-100">
                <label className="text-sm font-bold text-slate-700 block mb-2">Customer Signature</label>
                <div onClick={() => setIsSigned(true)} className={`w-full h-32 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors ${isSigned ? 'bg-slate-50 border-emerald-300' : 'bg-slate-50 border-slate-300 hover:bg-slate-100'}`}>
                  {isSigned ? (
                    <div className="text-center"><span className="font-['Brush_Script_MT',cursive] text-4xl text-slate-800">John Smith</span><p className="text-xs text-emerald-600 mt-1 flex items-center justify-center gap-1"><CheckCircle2 size={12}/> Digitally Signed</p></div>
                  ) : (
                    <span className="text-slate-400 flex items-center gap-2 font-medium"><PenLine size={18}/> Tap here to sign</span>
                  )}
                </div>
              </div>
              
              {/* ปุ่ม Submit (กดได้เมื่อติ๊กครบและเซ็นแล้ว) */}
              <Button disabled={!allChecked || !isSigned} onClick={() => { setIsCompleted(true); setShowSignModal(false); }} className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-bold h-12 rounded-xl disabled:bg-slate-200 disabled:text-slate-400 transition-colors">
                Confirm & Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}