import React from 'react';
import { CheckCircle2, MapPin, PenTool, Clock, Image as ImageIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function CustomerUpdate() {
  return (
    <div className="min-h-screen bg-slate-100 font-sans sm:p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-md bg-white sm:rounded-3xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20"><img src="https://images.unsplash.com/photo-1600607686527-6fb886090705?w=600&q=80" className="w-full h-full object-cover" alt="bg"/></div>
          <div className="relative z-10">
            <h2 className="text-amber-400 font-black tracking-widest text-sm uppercase mb-2">Live Update</h2>
            <h1 className="text-2xl font-bold text-white">Smith Residence</h1>
            <p className="text-slate-400 text-sm mt-1 flex items-center justify-center gap-1"><MapPin size={14}/> 123 Sunshine Blvd</p>
          </div>
        </div>

        {/* Progress: 65% */}
        <div className="p-6 border-b border-slate-100 text-center bg-emerald-50">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 bg-amber-100 text-amber-600">
            <PenTool size={32} />
          </div>
          <h3 className="font-bold text-lg text-amber-700">Installation is 65% Complete</h3>
          <p className="text-sm mt-1 text-slate-500">Our team is currently on-site working magic.</p>
        </div>

        {/* Timeline */}
        <div className="p-6 space-y-6">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center z-10"><CheckCircle2 size={16} /></div>
              <div className="w-0.5 h-full bg-emerald-500 my-1"></div>
            </div>
            <div className="pb-6">
              <h4 className="font-bold text-slate-900">Step 1: Preparation</h4>
              <p className="text-sm text-slate-500 mt-1">Subfloor leveled and underlay placed.</p>
            </div>
          </div>

          {/* Step 2 (กำลังทำ) */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-amber-400 text-white flex items-center justify-center z-10 shadow-lg shadow-amber-200 animate-pulse"><PenTool size={16} /></div>
              <div className="w-0.5 h-full bg-slate-200 my-1"></div>
            </div>
            <div className="pb-6">
              <h4 className="font-bold text-amber-600">Step 2: Laying Planks</h4>
              <p className="text-sm text-slate-500 mt-1">Currently installing Natural Oak Hybrid planks.</p>
              <img src="/FinishWork.jpg" className="mt-3 rounded-xl border border-slate-200 shadow-sm" alt="Update"/>
            </div>
          </div>

          {/* Step 3 (ยังไม่ถึง) */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-slate-50 border-slate-200 text-slate-400 border-2 flex items-center justify-center z-10"><Clock size={16} /></div>
            </div>
            <div className="pb-2">
              <h4 className="font-bold text-slate-400">Step 3: Finishing & Cleanup</h4>
              <p className="text-sm text-slate-400 mt-1">Awaiting completion of previous steps.</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500 mb-4">Sign-off will be unlocked once Step 3 is completed.</p>
          <Button disabled className="w-full bg-slate-200 text-slate-400 font-bold h-14 rounded-xl text-lg">Awaiting Completion...</Button>
        </div>
      </div>
    </div>
  );
}