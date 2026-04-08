import { useNavigate } from "react-router-dom";
import React from "react";
import { Camera, MapPin, Phone, User, Calendar, FileText, Wrench, Paintbrush, Upload, CheckSquare, Thermometer } from "lucide-react";

export default function JobCard() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 md:px-8 pb-32 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* ═══════ HEADER: INSTALLER MODE ═══════ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
            <div>
              <Badge text="Installer Mode" color="bg-slate-900" />
              <h1 className="text-2xl font-black text-slate-900 mt-2">Job Workflow & Checklist</h1>
            </div>
            <div className="bg-red-600 text-white px-6 py-2 rounded-xl font-black text-xl shadow-lg shadow-red-100 flex items-center">
              JOB #26018
            </div>
          </div>
          
          {/* Job Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm border-t pt-6">
            <InfoItem icon={<Calendar />} label="Date" value="14 Nov 2026" />
            <InfoItem icon={<User />} label="Client" value="Mr. John Doe" />
            <InfoItem icon={<Phone />} label="Contact" value="0415 504 902" />
            <InfoItem icon={<MapPin />} label="Address" value="141 Carrington St, White Gum Valley" />
          </div>
        </div>

        {/* ═══════ INSTALLATION WORKFLOW ═══════ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-slate-900 p-5 text-white flex items-center gap-3">
            <Wrench className="w-5 h-5 text-red-500" />
            <h2 className="font-bold tracking-wide uppercase">Installation Workflow</h2>
          </div>
          <div className="p-6 space-y-8">
            <ChecklistGroup title="1. Floor Prep" items={["Check subfloor condition", "Surface clean", "Check floor level"]} />
            
            {/* Moisture Test Special Input */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 border-b pb-2">2. Moisture Test</h3>
              <div className="space-y-3 pl-2">
                <CheckboxItem label="Conduct moisture test" />
                <div className="flex items-center gap-3 pl-8">
                  <Thermometer className="w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Result %" className="border rounded-md px-3 py-1.5 text-sm w-32 focus:ring-2 focus:ring-red-500 outline-none" />
                </div>
                <CheckboxItem label="Confirm acceptable level" />
              </div>
            </div>

            <ChecklistGroup title="5. Timber Install" items={["Straight alignment", "Full adhesion", "Expansion gaps", "No hollow sounds"]} />
            <PhotoUploadGroup title="10. Photos (Mandatory)" desc="Capture edges, trims, and full floor area." />
          </div>
        </div>

        {/* ═══════ SUBMIT BUTTON ═══════ */}
        <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-md border-t p-4 z-50">
          <div className="max-w-4xl mx-auto">
            <button 
  onClick={() => navigate('/customer-check')} 
  className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-red-200 transition-all active:scale-95 flex items-center gap-2"
>
  <CheckSquare className="w-5 h-5" />
  Submit Job Report
           </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// --- Helper Components ---
function Badge({ text, color }: { text: string, color: string }) {
  return <span className={`${color} text-white text-[10px] font-black uppercase px-2 py-1 rounded-md tracking-widest`}>{text}</span>;
}

function InfoItem({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-center gap-3 text-slate-600">
      <span className="text-red-600 w-5">{React.cloneElement(icon, { size: 18 })}</span>
      <span className="font-bold w-16">{label}:</span>
      <span className="text-slate-900">{value}</span>
    </div>
  );
}

function ChecklistGroup({ title, items }: { title: string, items: string[] }) {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-slate-900 border-b pb-2 uppercase text-sm tracking-wider">{title}</h3>
      <div className="space-y-3 pl-2">
        {items.map((item, idx) => <CheckboxItem key={idx} label={item} />)}
      </div>
    </div>
  );
}

function CheckboxItem({ label }: { label: string }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <input type="checkbox" className="mt-1 w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-500" />
      <span className="text-slate-700 group-hover:text-slate-900 text-sm">{label}</span>
    </label>
  );
}

function PhotoUploadGroup({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-slate-900 border-b pb-2 uppercase text-sm tracking-wider">{title}</h3>
      <p className="text-xs text-slate-500 pl-2">{desc}</p>
      <button className="ml-2 flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-xl border-2 border-dashed border-slate-300 transition-colors">
        <Camera className="w-5 h-5" />
        <Upload className="w-4 h-4" />
        Upload Photos
      </button>
    </div>
  );
}