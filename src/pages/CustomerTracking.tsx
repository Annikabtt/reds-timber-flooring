import React from 'react';
import { 
  CheckCircle2, Clock, MapPin, 
  Sparkles, PenTool, Image as ImageIcon
} from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function CustomerTracking() {
  return (
    <div className="min-h-screen bg-slate-100 font-sans sm:p-4 md:p-8 flex items-center justify-center">
      
      {/* Mobile-sized Card for Customer */}
      <div className="w-full max-w-md bg-white sm:rounded-3xl shadow-xl overflow-hidden min-h-screen sm:min-h-0">
        
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

        {/* Progress Summary */}
        <div className="p-6 border-b border-slate-100 bg-emerald-50 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mb-3">
            <Sparkles size={32} />
          </div>
          <h3 className="font-bold text-emerald-800 text-lg">Installation is 65% Complete!</h3>
          <p className="text-sm text-emerald-600/80 mt-1">Our team is currently on-site working magic.</p>
        </div>

        {/* Customer Timeline */}
        <div className="p-6 space-y-6">
          
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center z-10">
                <CheckCircle2 size={16} />
              </div>
              <div className="w-0.5 h-full bg-emerald-500 my-1"></div>
            </div>
            <div className="pb-6">
              <h4 className="font-bold text-slate-900">Step 1: Preparation</h4>
              <p className="text-sm text-slate-500 mt-1">Subfloor leveled and underlay placed.</p>
              <div className="mt-2 text-xs font-bold text-indigo-600 flex items-center gap-1 bg-indigo-50 inline-flex px-2 py-1 rounded">
                <ImageIcon size={12}/> View 2 Photos
              </div>
            </div>
          </div>

          {/* Step 2 (Current) */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-amber-400 text-white flex items-center justify-center z-10 shadow-lg shadow-amber-200 animate-pulse">
                <PenTool size={16} />
              </div>
              <div className="w-0.5 h-full bg-slate-200 my-1"></div>
            </div>
            <div className="pb-6">
              <h4 className="font-bold text-amber-600">Step 2: Laying Planks</h4>
              <p className="text-sm text-slate-500 mt-1">Currently installing Natural Oak Hybrid planks in the living area.</p>
              <img src="https://images.unsplash.com/photo-1581858326456-6189df1a590e?w=400&q=80" className="mt-3 rounded-xl border border-slate-200 shadow-sm" alt="Update"/>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center z-10 border-2 border-slate-200">
                <Clock size={16} />
              </div>
            </div>
            <div>
              <h4 className="font-bold text-slate-400">Step 3: Finishing & Sign Off</h4>
              <p className="text-sm text-slate-400 mt-1">Skirting installation and final inspection.</p>
            </div>
          </div>

        </div>

        {/* Footer Action */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500 mb-4">Once step 3 is completed, you will be able to sign off the project here.</p>
          <Button disabled className="w-full bg-slate-300 text-slate-500 font-bold h-12 rounded-xl">
            Sign Off & Approve Job
          </Button>
        </div>

      </div>
    </div>
  );
}