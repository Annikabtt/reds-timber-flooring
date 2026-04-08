import React from "react";
import { CheckCircle2, MapPin, User, ShieldCheck, PenTool, Star, Image as ImageIcon } from "lucide-react";

export default function CustomerApprovalCard() {
  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 md:px-8 pb-32 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* ═══════ HEADER: CUSTOMER MODE ═══════ */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center">
          <div className="inline-flex p-3 bg-green-50 rounded-full mb-4">
            <ShieldCheck className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-black text-slate-900">Job Completion Review</h1>
          <p className="text-slate-500 mt-2">Please review the installation and sign off below</p>
          <div className="mt-6 inline-block bg-slate-900 text-white px-6 py-2 rounded-full font-bold">
            JOB #26018
          </div>
        </div>

        {/* ═══════ PHOTO GALLERY REVIEW ═══════ */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-6">
            <ImageIcon className="text-red-600" />
            <h2 className="text-xl font-bold">Installation Photos</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-square bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 text-xs">
                Photo {i} Placeholder
              </div>
            ))}
          </div>
        </div>

        {/* ═══════ CUSTOMER CHECKLIST ═══════ */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <CheckCircle2 className="text-red-600" />
            Final Inspection
          </h2>
          <div className="space-y-4">
            <CustomerCheckItem label="Floor is clean and free of debris" />
            <CustomerCheckItem label="Trims and transitions are securely fitted" />
            <CustomerCheckItem label="No visible scratches or glue marks" />
            <CustomerCheckItem label="Overall installation meets expectations" />
          </div>
        </div>

        {/* ═══════ SIGNATURE AREA ═══════ */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <PenTool className="text-red-600" />
            Digital Signature
          </h2>
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl h-48 flex items-center justify-center text-slate-400 italic">
            Sign here...
          </div>
          <p className="text-[10px] text-slate-400 mt-4 text-center uppercase tracking-widest">
            By signing, you agree that the work has been completed to your satisfaction.
          </p>
        </div>

        {/* ═══════ APPROVE BUTTON ═══════ */}
        <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-md border-t p-4 z-50">
          <div className="max-w-4xl mx-auto">
            <button className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-red-200 flex items-center justify-center gap-3 transition-all hover:-translate-y-1">
              <Star className="w-6 h-6 fill-current" />
              Approve & Finish Job
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

function CustomerCheckItem({ label }: { label: string }) {
  return (
    <label className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer hover:border-red-200 transition-colors">
      <input type="checkbox" className="w-6 h-6 rounded-full border-slate-300 text-red-600 focus:ring-red-500" />
      <span className="text-slate-700 font-medium">{label}</span>
    </label>
  );
}