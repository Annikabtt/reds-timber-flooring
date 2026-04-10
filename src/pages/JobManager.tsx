import React, { useState } from 'react';
import { 
  MapPin, Calendar, UserPlus, HardHat, 
  Camera, CheckCircle, Clock, AlertCircle, ArrowLeft
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

export default function JobManager() {
  const navigate = useNavigate();
  // สถานะจำลองว่าจ่ายงานหรือยัง
  const [isAssigned, setIsAssigned] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState("");

  const handleAssign = () => {
    if(!selectedTeam) return alert("Please select an installer team first!");
    setIsAssigned(true);
    alert("✅ Job successfully assigned to " + selectedTeam);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="bg-white shadow-sm hover:bg-slate-100">
            <ArrowLeft size={18} className="mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-3">
              Job Management <span className="text-sm px-3 py-1 bg-slate-900 text-white rounded-full">JOB-2026-084</span>
            </h1>
            <p className="text-slate-500 mt-1">Smith Residence - 123 Sunshine Blvd</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* --- ฝั่งซ้าย: ASSIGN JOB (จ่ายงาน) --- */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
                <UserPlus className="text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900">Assign Job</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-2">Installation Dates</label>
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl text-slate-600">
                    <Calendar size={18} /> April 10, 2026 - April 12, 2026
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-2">Select Installer Team</label>
                  <select 
                    disabled={isAssigned}
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                  >
                    <option value="">-- Choose Team --</option>
                    <option value="Mike Team A">Mike - Team A (Expert SPC)</option>
                    <option value="Tom Team B">Tom - Team B (Timber Specialist)</option>
                  </select>
                </div>

                <div className="pt-4">
                  {isAssigned ? (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl flex items-center gap-3 font-bold">
                      <CheckCircle size={20} /> Assigned to {selectedTeam}
                    </div>
                  ) : (
                    <Button onClick={handleAssign} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 rounded-xl">
                      Confirm Assignment
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Job Specs Summary */}
            <div className="bg-slate-900 p-6 rounded-2xl shadow-sm text-white">
               <h3 className="text-lg font-bold text-amber-400 mb-4">Material Specs</h3>
               <ul className="space-y-3 text-sm text-slate-300">
                 <li className="flex justify-between border-b border-slate-700 pb-2">
                   <span>Natural Oak Hybrid</span> <span className="font-bold text-white">55 SQM</span>
                 </li>
                 <li className="flex justify-between border-b border-slate-700 pb-2">
                   <span>White Skirting 90mm</span> <span className="font-bold text-white">42 LM</span>
                 </li>
                 <li className="flex justify-between">
                   <span>Acoustic Underlay</span> <span className="font-bold text-white">55 SQM</span>
                 </li>
               </ul>
            </div>
          </div>

          {/* --- ฝั่งขวา: PROGRESS MONITOR (ติดตามงาน) --- */}
          <div className="lg:col-span-7">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <HardHat className="text-emerald-600" />
                  <h2 className="text-lg font-bold text-slate-900">Progress Monitor</h2>
                </div>
                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                  65% Completed
                </span>
              </div>

              {/* Timeline แถบความคืบหน้า */}
              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-slate-200 before:to-slate-200">
                
                {/* Step 1: Done */}
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-emerald-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    <CheckCircle size={16} />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-slate-800">Day 1: Preparation</h4>
                      <span className="text-xs text-slate-400 font-medium">Apr 10, 09:00 AM</span>
                    </div>
                    <p className="text-sm text-slate-500 mb-3">Floor leveled and underlay installed successfully. Ready for planks tomorrow.</p>
                    <div className="flex gap-2">
                      <img src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=150&h=100&fit=crop" className="rounded-lg border border-slate-300" alt="Prep" />
                    </div>
                  </div>
                </div>

                {/* Step 2: Current */}
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-amber-400 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 animate-pulse">
                    <Camera size={16} />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-amber-200 bg-white shadow-md">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-amber-600">Day 2: Laying Planks</h4>
                      <span className="text-xs text-slate-400 font-medium">Today, 02:30 PM</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">Living room 80% done. No issues found.</p>
                    <div className="flex gap-2">
                      <img src="https://images.unsplash.com/photo-1581858326456-6189df1a590e?w=150&h=100&fit=crop" className="rounded-lg border border-slate-200" alt="Planks" />
                    </div>
                  </div>
                </div>

                {/* Step 3: Pending */}
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-200 text-slate-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    <Clock size={16} />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 bg-slate-50/50 opacity-60">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-slate-500">Day 3: Skirting & Cleanup</h4>
                      <span className="text-xs text-slate-400 font-medium">Expected Apr 12</span>
                    </div>
                    <p className="text-sm text-slate-400">Awaiting installation of accessories and final site cleaning.</p>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}