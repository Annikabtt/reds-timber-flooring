import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, DollarSign, Store, FileText, 
  UserPlus, Truck, HardHat, BarChart, 
  CheckSquare, CheckCircle, ArrowRight 
} from 'lucide-react';
import { Button } from "@/components/ui/button";

// โครงสร้างข้อมูล Workflow ทั้ง 10 ขั้นตอน
const workflowSteps = [
  {
    phase: "Phase 1: Setup & Sales (ตั้งค่าและงานขาย)",
    steps: [
      { id: 1, title: "1. Prepare Materials", desc: "Owner/Admin สร้างฐานข้อมูลวัสดุ คิ้ว บัว กาว และเช็คสต็อก", icon: <Package size={24} />, color: "bg-blue-100 text-blue-700", border: "border-blue-200", role: "Owner / Admin", path: "/materials" },
      { id: 2, title: "2. Set Pricing", desc: "Owner กำหนดราคาต้นทุน ค่าแรง และ % กำไร (Markup)", icon: <DollarSign size={24} />, color: "bg-blue-100 text-blue-700", border: "border-blue-200", role: "Owner", path: "/pricing" },
      { id: 3, title: "3. Customer Showroom", desc: "ลูกค้าเข้าเว็บเลือกชมสินค้า (ซ่อนราคาต้นทุน) และกดขอใบเสนอราคา", icon: <Store size={24} />, color: "bg-amber-100 text-amber-700", border: "border-amber-200", role: "Customer", path: "/showroom" },
      { id: 4, title: "4. Initial Quotation", desc: "ส่งบิลประเมินราคาให้ลูกค้า (หมายเหตุ: ราคาอาจเปลี่ยนตามพื้นที่หน้างานจริง)", icon: <FileText size={24} />, color: "bg-amber-100 text-amber-700", border: "border-amber-200", role: "Customer / Sales", path: "/proposal" },
    ]
  },
  {
    phase: "Phase 2: Operations & Installation (งานปฏิบัติการและติดตั้ง)",
    steps: [
      { id: 5, title: "5. Assign Job", desc: "Admin เปิด Job Card จ่ายงานให้ช่าง พร้อมแนบข้อมูลหน้างาน", icon: <UserPlus size={24} />, color: "bg-blue-100 text-blue-700", border: "border-blue-200", role: "Admin", path: "/job-manager" },
      { id: 6, title: "6. Material Requisition", desc: "ช่างกดเบิกวัสดุ กาว คิ้ว บัว จากคลังเพื่อเตรียมไปหน้างาน", icon: <Truck size={24} />, color: "bg-emerald-100 text-emerald-700", border: "border-emerald-200", role: "Installer", path: "/material-request" },
      { id: 7, title: "7. Daily Report (Job Card)", desc: "ช่างลงมือทำงาน ถ่ายรูปรายงานความคืบหน้าหน้างานแบบรายวัน", icon: <HardHat size={24} />, color: "bg-emerald-100 text-emerald-700", border: "border-emerald-200", role: "Installer", path: "/job-card" },
    ]
  },
  {
    phase: "Phase 3: Tracking & Handover (ติดตามงานและส่งมอบ)",
    steps: [
      { id: 8, title: "8. Progress Monitor", desc: "Owner ตรวจสอบรูปภาพ รายงาน และประเมินวันงานเสร็จ", icon: <BarChart size={24} />, color: "bg-blue-100 text-blue-700", border: "border-blue-200", role: "Owner", path: "job-manager" },
      { id: 9, title: "9. Customer Update", desc: "ระบบส่งอัปเดตความคืบหน้าให้ลูกค้าดู (ลิงก์พิเศษสำหรับลูกค้า)", icon: <CheckSquare size={24} />, color: "bg-amber-100 text-amber-700", border: "border-amber-200", role: "Customer", path: "/customer-tracking" }, // อนาคตลิงก์ไปหน้า Customer Tracking
      { id: 10, title: "10. Sign-off & Close Job", desc: "ช่างกดปิดงาน ลูกค้าตรวจสอบหน้างาน เซ็นรับงาน หรือสั่งแก้ไข", icon: <CheckCircle size={24} />, color: "bg-purple-100 text-purple-700", border: "border-purple-200", role: "All Roles", path: "/customer-tracking" },
    ]
  }
];

export default function SystemWorkflow() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900">System Workflow Map</h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            แผนผังจำลองขั้นตอนการทำงานจริง (Clickable Prototype) <br/>
            ตั้งแต่เปิดบิลจนถึงส่งมอบงาน แบ่งตามผู้ใช้งาน (Owner / Customer / Installer)
          </p>
        </div>

        {/* Workflow Map */}
        <div className="space-y-12">
          {workflowSteps.map((phase, phaseIdx) => (
            <div key={phaseIdx} className="relative">
              
              {/* Phase Title */}
              <div className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-md py-4 mb-4">
                <h2 className="text-xl font-bold text-slate-800 border-l-4 border-slate-900 pl-4">
                  {phase.phase}
                </h2>
              </div>

              {/* Steps Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4 md:pl-8 border-l-2 border-slate-200 ml-2 md:ml-4">
                {phase.steps.map((step) => (
                  <div key={step.id} className="relative bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg transition-all group">
                    
                    {/* จุดเชื่อมต่อ Timeline (Timeline Node) */}
                    <div className={`absolute -left-[27px] md:-left-[43px] top-8 w-4 h-4 rounded-full border-4 border-white shadow-sm ${step.color.split(' ')[0]}`}></div>

                    <div className="flex items-start justify-between gap-4">
                      <div className={`p-3 rounded-xl ${step.color} border ${step.border}`}>
                        {step.icon}
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full uppercase tracking-wider">
                          {step.role}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
                      <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <Button 
                        onClick={() => navigate(step.path)}
                        variant="ghost" 
                        className="w-full justify-between text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 font-bold group-hover:px-6 transition-all"
                      >
                        Preview this step <ArrowRight size={18} />
                      </Button>
                    </div>

                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}