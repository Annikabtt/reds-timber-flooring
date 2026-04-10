import React, { useState } from 'react';
import { 
  CheckCircle2, MapPin, Sparkles, 
  PenTool, X, PenLine, FileSignature
} from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function CustomerTracking() {
  // --- States สำหรับควบคุมระบบเซ็นรับงาน ---
  const [showSignModal, setShowSignModal] = useState(false);
  const [checks, setChecks] = useState([false, false, false, false]);
  const [isSigned, setIsSigned] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false); // สถานะปิดจ๊อบสมบูรณ์

  // รายการ Checklist ให้ลูกค้าตรวจ
  const checklistItems = [
    "Flooring installed perfectly to agreed specifications.",
    "Skirting and scotia trims installed seamlessly.",
    "No visible scratches, dents, or defects on the floor.",
    "Site has been cleaned and all rubbish removed."
  ];

  // เช็คว่าลูกค้าติ๊กครบทุกข้อหรือยัง
  const allChecked = checks.every(c => c === true);

  const toggleCheck = (index: number) => {
    const newChecks = [...checks];
    newChecks[index] = !newChecks[index];
    setChecks(newChecks);
  };

  const handleSignOff = () => {
    setIsCompleted(true);
    setShowSignModal(false);
    alert("🎉 Thank You! Your floor is now officially handed over.");
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans sm:p-4 md:p-8 flex items-center justify-center">
      
      {/* --- Mobile-sized Card for Customer --- */}
      <div className="w-full max-w-md bg-white sm:rounded-3xl shadow-xl overflow-hidden min-h-screen sm:min-h-0 relative">
        
        {/* Header Cover */}
        <div className="bg-slate-900 p-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <img src="https://images.unsplash.com/photo-1600607686527-6fb886090705?w=600&q=80" className="w-full h-full object-cover" alt="bg"/>
          </div>
          <div className="relative z-10">
            <h2 className="text-amber-400 font-black tracking-widest text-sm uppercase mb-2">Your New Floor Journey</h2>
            <h1 className="text-2xl font-bold text-white">Smith Residence</h1>
            <p className="text-slate-400 text-sm mt-1 flex items-center justify-center gap-1">
              <MapPin size={14}/> 123 Sunshine Blvd
            </p>
          </div>
        </div>

        {/* Progress Summary (เปลี่ยนเป็น 100%) */}
        <div className={`p-6 border-b border-slate-100 text-center transition-colors duration-500 ${isCompleted ? 'bg-indigo-50' : 'bg-emerald-50'}`}>
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${isCompleted ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
            {isCompleted ? <FileSignature size={32} /> : <Sparkles size={32} />}
          </div>
          <h3 className={`font-bold text-lg ${isCompleted ? 'text-indigo-800' : 'text-emerald-800'}`}>
            {isCompleted ? "Project Successfully Closed!" : "Installation is 100% Complete!"}
          </h3>
          <p className={`text-sm mt-1 ${isCompleted ? 'text-indigo-600/80' : 'text-emerald-600/80'}`}>
            {isCompleted ? "Warranty certificate has been sent to your email." : "Please review the site and sign off below."}
          </p>
        </div>

        {/* Customer Timeline */}
        <div className="p-6 space-y-6">
          {/* Step 1 & 2 (ย่อให้ดูสั้นลง) */}
          <div className="flex gap-4 opacity-50">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center z-10"><CheckCircle2 size={16} /></div>
              <div className="w-0.5 h-full bg-emerald-500 my-1"></div>
            </div>
            <div className="pb-6"><h4 className="font-bold text-slate-900">Step 1 & 2 Completed</h4></div>
          </div>

          {/* Step 3 (Current) */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center z-10 ${isCompleted ? 'bg-emerald-500' : 'bg-amber-400 shadow-lg shadow-amber-200 animate-pulse'}`}>
                {isCompleted ? <CheckCircle2 size={16} />