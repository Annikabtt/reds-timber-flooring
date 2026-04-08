import { Camera, MapPin, Phone, User, Calendar, FileText, Wrench, Paintbrush, Upload, CheckSquare } from "lucide-react";

export default function JobCard() {
  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 md:px-8 pb-32 font-sans selection:bg-red-600 selection:text-white">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* ═══════ HEADER SECTION ═══════ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">Job Workflow & Checklist</h1>
              <p className="text-slate-500 font-medium">Digital Job Card for On-site Installers</p>
            </div>
            <div className="inline-flex items-center bg-red-50 border border-red-100 text-red-700 px-4 py-2 rounded-full font-black text-lg shadow-sm">
              JOB no# 26018
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-100">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-slate-700">
                <Calendar className="w-5 h-5 text-red-600" />
                <span className="font-semibold w-20">Date:</span>
                <span className="text-slate-900">14 Nov 2026</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700">
                <User className="w-5 h-5 text-red-600" />
                <span className="font-semibold w-20">Client:</span>
                <span className="text-slate-900">Mr. John Doe</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-slate-700">
                <Phone className="w-5 h-5 text-red-600" />
                <span className="font-semibold w-20">Contact:</span>
                <span className="text-slate-900">0415 504 902</span>
              </div>
              <div className="flex items-start gap-3 text-slate-700">
                <MapPin className="w-5 h-5 text-red-600 mt-0.5" />
                <span className="font-semibold w-20">Address:</span>
                <span className="text-slate-900">141 Carrington St, White Gum Valley WA, 6162</span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════ DETAILS GRID ═══════ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Scope of Work */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-100 rounded-lg"><FileText className="w-5 h-5 text-slate-700" /></div>
              <h2 className="text-xl font-bold text-slate-900">Scope of Work</h2>
            </div>
            <ul className="space-y-3">
              {[
                "Supply and/or installation of timber flooring as per quotation",
                "Subfloor preparation (minor leveling only unless specified)",
                "Moisture testing of subfloor",
                "Installation of adhesive / underlay / moisture barrier (if required)",
                "Installation of flooring boards",
                "Installation of trims (if included in quote)",
                "Floor sanding and sealing",
                "Basic site clean of flooring area upon completion"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-600 leading-relaxed">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Materials */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-100 rounded-lg"><Wrench className="w-5 h-5 text-slate-700" /></div>
              <h2 className="text-xl font-bold text-slate-900">Materials</h2>
            </div>
            <div className="bg-red-50 text-red-800 font-bold px-4 py-3 rounded-lg border border-red-100 mb-6">
              Engineered Timber Floor
            </div>
            <div className="space-y-4 text-slate-600">
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="font-semibold text-slate-900">Product:</span>
                <span>1910mm x 1900mm x 12mm</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="font-semibold text-slate-900">Colours:</span>
                <span>Balboa (Ghost Gum & Iron Bark)</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="font-semibold text-slate-900">Location:</span>
                <span>Apartments as per plans</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="font-semibold text-slate-900">Pattern:</span>
                <span>Plank (incl. 8.5% wastage)</span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════ INSTALLATION WORKFLOW ═══════ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-slate-900 p-6 text-white flex items-center gap-3">
            <Wrench className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-black tracking-wide">INSTALLATION WORKFLOW</h2>
          </div>
          <div className="p-6 md:p-8 space-y-8">
            
            <ChecklistGroup title="1. FLOOR PREP" items={[
              "Check subfloor condition",
              "Ensure surface clean (dust/debris removed)",
              "Check floor level"
            ]} />
            
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-lg border-b border-slate-100 pb-2">2. MOISTURE TEST</h3>
              <div className="space-y-3 pl-2">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" className="mt-1 w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer" />
                  <span className="text-slate-700 group-hover:text-slate-900 transition-colors">Conduct moisture test</span>
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 pl-8">
                  <span className="text-slate-700 font-medium">Record result:</span>
                  <input type="text" placeholder="e.g. 4.5%" className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none w-full sm:w-32" />
                </div>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" className="mt-1 w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer" />
                  <span className="text-slate-700 group-hover:text-slate-900 transition-colors">Confirm acceptable level before proceeding</span>
                </label>
              </div>
            </div>

            <ChecklistGroup title="3. MOISTURE BARRIER (IF REQUIRED)" items={["Apply moisture barrier to substrate", "Ensure full coverage", "Allow proper curing time"]} />
            <ChecklistGroup title="4. UNDERLAY (IF REQUIRED)" items={["Install underlay correctly", "Ensure no gaps or movement", "Check alignment"]} />
            <ChecklistGroup title="5. TIMBER INSTALL" items={["Install boards straight and aligned", "Ensure full adhesion", "Maintain expansion gaps", "Check no hollow/drummy sound"]} />
            <ChecklistGroup title="6. CAULKING" items={["Apply caulking where required", "Ensure neat and consistent finish"]} />
            <ChecklistGroup title="7. TRIMS" items={["Install all trims (doorways, edges, transitions)", "Ensure secure fixing", "Check no missing sections"]} />
            <ChecklistGroup title="8. FLOOR PROTECTION (FLOOR SHIELD)" items={["Install floor protection if required", "Ensure secure and full coverage"]} />
            <ChecklistGroup title="9. FINAL CHECK" items={["No scratches", "No gaps", "No glue marks", "Edges and corners checked", "Full walkthrough completed"]} />
            
            <PhotoUploadGroup title="10. PHOTOS (MANDATORY)" desc="Take final photos of completed area. Capture edges and trims." />
            
            <div className="pt-6 border-t border-slate-100">
              <ChecklistGroup title="11. FINAL SIGN-OFF" items={["Confirm job complete", "No outstanding items"]} />
              <div className="mt-6 bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center flex flex-col items-center justify-center">
                <span className="text-slate-400 font-medium mb-4">Customer Digital Signature Area</span>
                <div className="w-full max-w-sm h-32 bg-white border border-slate-200 rounded-lg shadow-inner"></div>
              </div>
            </div>

          </div>
        </div>

        {/* ═══════ SANDING & SEALING WORKFLOW ═══════ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-8">
          <div className="bg-slate-900 p-6 text-white flex items-center gap-3">
            <Paintbrush className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-black tracking-wide">SANDING & SEALING WORKFLOW</h2>
          </div>
          <div className="p-6 md:p-8 space-y-8">
            
            <ChecklistGroup title="1. PREP & INSPECTION" items={["Check floor condition (damage, gaps, loose boards)", "Confirm all nails punched down", "Ensure site clear and ready"]} />
            <ChecklistGroup title="2. FLOOR PREP" items={["Remove dirt, debris, and contaminants", "Fill gaps or holes where required", "Secure any loose boards"]} />
            <ChecklistGroup title="3. SANDING" items={["Sand floor progressively to 180 grit finish", "Complete edges and corners", "Ensure even surface (no waves or marks)"]} />
            <ChecklistGroup title="4. CLEAN BEFORE COATING" items={["Vacuum thoroughly", "Remove all dust from floor, walls, and surfaces"]} />
            <ChecklistGroup title="5. SEALER COAT" items={["Apply 1 coat sealer evenly", "Allow proper drying time"]} />
            <ChecklistGroup title="6. TOP COATS (POLYURETHANE)" items={["Apply 2 coats water-based polyurethane", "Ensure even coverage (no streaks/bubbles)", "Allow drying between coats"]} />
            <ChecklistGroup title="7. FINISHING CHECK" items={["Check for uneven finish, bubbles or marks, missed areas"]} />
            <ChecklistGroup title="8. FINAL CLEAN" items={["Ensure floor clean and presentable", "Remove dust from surrounding areas"]} />
            <ChecklistGroup title="9. FINAL CHECK" items={["No scratches", "No sanding marks", "Consistent finish across entire area", "Edges and corners checked", "Full walkthrough completed"]} />
            
            <PhotoUploadGroup title="10. PHOTOS (MANDATORY)" desc="Take final photos of completed floor. Capture full area and close-up finish." />
            
            <div className="pt-6 border-t border-slate-100">
              <ChecklistGroup title="11. FINAL SIGN-OFF" items={["Confirm job complete", "No outstanding items"]} />
              <div className="mt-6 bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center flex flex-col items-center justify-center">
                <span className="text-slate-400 font-medium mb-4">Customer Digital Signature Area</span>
                <div className="w-full max-w-sm h-32 bg-white border border-slate-200 rounded-lg shadow-inner"></div>
              </div>
            </div>

          </div>
        </div>

        {/* ═══════ SUBMIT BUTTON ═══════ */}
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50">
          <div className="max-w-4xl mx-auto flex justify-end">
            <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-red-200 transition-all active:scale-95 flex items-center gap-2">
              <CheckSquare className="w-5 h-5" />
              Submit Job Report
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

/* --- Component ช่วยเหลือสำหรับ Checkbox Group --- */
function ChecklistGroup({ title, items }: { title: string, items: string[] }) {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-slate-900 text-lg border-b border-slate-100 pb-2">{title}</h3>
      <div className="space-y-3 pl-2">
        {items.map((item, idx) => (
          <label key={idx} className="flex items-start gap-3 cursor-pointer group">
            <input 
              type="checkbox" 
              className="mt-1 w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer transition-colors" 
            />
            <span className="text-slate-700 group-hover:text-slate-900 transition-colors leading-relaxed">{item}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

/* --- Component ช่วยเหลือสำหรับ Upload รูปภาพ (อัปเดตให้กดเปิดกล้องได้จริง) --- */
function PhotoUploadGroup({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-slate-900 text-lg border-b border-slate-100 pb-2">{title}</h3>
      <p className="text-slate-500 pl-2">{desc}</p>
      <div className="pl-2">
        {/* เปลี่ยนจาก button ธรรมดา เป็น label ที่ซ่อน input file เอาไว้ */}
        <label className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-6 rounded-lg transition-colors border border-slate-200 cursor-pointer active:scale-95">
          <Camera className="w-5 h-5" />
          <Upload className="w-4 h-4 mr-1" />
          Take / Upload Photos
          {/* โค้ดลับ: accept="image/*" คือรับเฉพาะรูป, capture="environment" คือบังคับเปิดกล้องหลังมือถือ */}
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
          />
        </label>
      </div>
    </div>
  );
}