import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, ReactNode, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Lock,
  Crosshair,
  Shield,
  Building2,
  Home as HomeIcon,
  Briefcase,
  Building,
  Phone,
  Mail,
  MapPin,
  Instagram,
  Facebook,
  Linkedin,
  Menu,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import redsLogo from "@/assets/reds-logo.png";

/* ═══════ ข้อมูลทั้งหมด (DATA) ═══════ */

const heroImages = [
  "/Slide1.jpg",
  "/Slide2.jpg",
  "/Slide3.jpg",
  "/Slide4.jpg"
];

const partners = [
  { name: "360 Commercial Construction", logo: "/logo-360.jpg" },
  { name: "ATFA", logo: "/logo-atfa.jpg" },
  { name: "BallPoint", logo: "/logo-ballpoint.jpg" },
  { name: "Blackburne", logo: "/logo-blackburne.jpg" },
  { name: "Dunlop Flooring", logo: "/logo-dunlop.jpg" },
  { name: "Edge Visionary Living", logo: "/logo-edge.jpg" },
  { name: "Mapei", logo: "/logo-mapei.jpg" },
  { name: "Woodpecker Flooring", logo: "/logo-woodpecker.jpg" },
];

const services = [
  {
    icon: Crosshair,
    title: "Precision Installation",
    desc: "Laser-guided fitting with sub-millimetre accuracy. Every plank is perfectly locked, levelled, and structurally sound.",
  },
  {
    icon: Shield,
    title: "High-Durability Materials",
    desc: "Premium SPC, engineered wood, and modern laminate rated for heavy foot traffic—scratch-proof and 100% waterproof.",
  },
  {
    icon: Building2,
    title: "Commercial & Residential",
    desc: "Scalable solutions from luxury private residences to multi-storey commercial fit-outs, delivered on schedule.",
  },
];

const applications = [
  {
    icon: HomeIcon,
    title: "Smart Homes",
    desc: "Seamless integration with underfloor heating and modern minimalist living spaces.",
    img: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&h=400&fit=crop",
  },
  {
    icon: Briefcase,
    title: "Corporate Offices",
    desc: "Hard-wearing, acoustic-rated flooring designed for high-performance professional environments.",
    img: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop",
  },
  {
    icon: Building,
    title: "Premium Apartments",
    desc: "Luxury finishes with modern materials that significantly elevate property value and aesthetic appeal.",
    img: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop",
  },
];

const navLinks = ["Home", "Modern Materials", "Projects", "Contact"];

/* ═══════ คอมโพเนนต์ช่วยแสดงเอฟเฟกต์ (REVEAL) ═══════ */
function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ═══════ โครงสร้างหลักของหน้าเว็บ (MAIN COMPONENT) ═══════ */
export default function LandingPage() {
  const navigate = useNavigate();
  const [currentImg, setCurrentImg] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auto-slide logic for Hero Section
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImg((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-red-600 selection:text-white">
      
      {/* ═══════ NAVBAR ═══════ */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-red-950/10 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          <a href="/" className="flex items-center">
            <img 
              src={redsLogo} 
              alt="REDS Timber Flooring Specialists" 
              className="h-6 sm:h-12 w-auto object-contain relative z-10 drop-shadow-sm" 
            />
          </a>

          {/* --- 💻 โหมด DESKTOP (ซ่อนในมือถือ) --- */}
          <div className="hidden lg:flex items-center gap-6">
            <div className="flex items-center gap-8 text-sm font-bold text-slate-600 mr-4">
              {navLinks.map((l) => (
                <a
                  key={l}
                  href={`#${l.toLowerCase().replace(/\s+/g, "-")}`}
                  className="relative hover:text-red-600 transition-colors duration-300 group"
                >
                  {l}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-600 transition-all duration-300 group-hover:w-full" />
                </a>
              ))}
            </div>

            <Button variant="ghost" onClick={() => navigate('/showroom')} className="font-bold text-slate-700 hover:text-amber-600">
              Our Collection
            </Button>
            
            <Button variant="ghost" onClick={() => navigate('/workflow')} className="font-bold text-slate-700 hover:text-indigo-600 border border-indigo-200 px-4 py-2 rounded-lg">
              System Workflow
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/portal")}
              className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white bg-transparent rounded-full px-4 py-2 font-bold transition-all duration-300 flex items-center gap-2 shadow-sm hover:shadow-red-100"
            >
              <Lock className="h-4 w-4" />
              <span>Portal Login</span>
            </Button>
          </div>

          {/* --- 📱 ปุ่มเมนูมือถือ ☰ (ซ่อนใน Desktop) --- */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-800 hover:text-red-600 focus:outline-none transition-colors"
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* --- 📱 หน้าต่างเมนูที่เด้งลงมาตอนกดมือถือ --- */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-20 left-0 w-full bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-2xl lg:hidden flex flex-col px-6 py-8 gap-6 z-40"
            >
              <div className="flex flex-col gap-4 text-center">
                {navLinks.map((l) => (
                  <a
                    key={l}
                    href={`#${l.toLowerCase().replace(/\s+/g, "-")}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-lg font-bold text-slate-700 hover:text-red-600"
                  >
                    {l}
                  </a>
                ))}
              </div>
              
              <div className="w-full h-px bg-slate-200" />
              
              <div className="flex flex-col gap-3">
                <Button variant="ghost" onClick={() => { navigate('/showroom'); setIsMobileMenuOpen(false); }} className="w-full font-bold text-slate-700 hover:text-amber-600 bg-amber-50">
                  Our Collection
                </Button>
                <Button variant="outline" onClick={() => { navigate('/workflow'); setIsMobileMenuOpen(false); }} className="w-full font-bold text-indigo-700 border-indigo-200 hover:bg-indigo-50">
                  System Workflow
                </Button>
                <Button
                  onClick={() => { navigate("/portal"); setIsMobileMenuOpen(false); }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold transition-all duration-300 flex items-center justify-center gap-2 py-6 rounded-xl shadow-lg shadow-red-600/30"
                >
                  <Lock className="h-5 w-5" />
                  <span>Portal Login</span>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ═══════ HERO SECTION (DYNAMIC SLIDER) ═══════ */}
      {/* 👇 แก้ 1: เปลี่ยน bg-slate-900 เป็น bg-black สีดำสนิท เวลาเปลี่ยนรูปจะได้ไม่แลบเป็นสีน้ำเงิน */}
      <section id="home" className="relative min-h-screen flex items-center justify-start overflow-hidden bg-black pb-24">
        
        {/* --- ส่วนที่ 1: รูปภาพพื้นหลัง --- */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImg}
              src={heroImages[currentImg]}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="w-full h-full object-cover"
            />
          </AnimatePresence>
          
          {/* ❌ แก้ 2: ลบฟิลเตอร์/เงาซ้ายมือ (Gradient) ออกทิ้งไปเลยครับ โชว์รูป 100% */}
        </div>

        {/* --- ส่วนที่ 2: ข้อความ --- */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pt-40 md:pt-32">
          
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl" 
          >
            {/* ป้าย Tag ด้านบน */}
            <motion.div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-600 text-white text-xs font-black tracking-widest uppercase mb-6 shadow-lg">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              The Gold Standard in Flooring
            </motion.div>

            {/* 👇 แก้ 3: ใส่เงาที่ตัวหนังสือ (drop-shadow แบบเข้ม) แทนเงาที่พื้นหลัง เพื่อให้อ่านออกไม่ว่าจะเจอรูปสว่างแค่ไหน */}
            <motion.h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">
              Next-Generation <br />
              <span className="text-red-500 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">Flooring Solutions.</span>
            </motion.h1>

            {/* คำอธิบาย: ใส่เงาเข้มๆ ให้ตัวหนังสือเหมือนกัน */}
            <motion.p className="mt-6 text-slate-100 text-base md:text-lg max-w-lg leading-relaxed font-semibold drop-shadow-[0_3px_3px_rgba(0,0,0,0.8)]">
              Precision installation of high-durability timber, SPC, and engineered flooring for modern living and workspaces.
            </motion.p>

            {/* ปุ่มกด */}
            <motion.div className="mt-10 flex flex-col sm:flex-row gap-4 w-full">
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/showroom')}
                className="w-full sm:w-auto border-none bg-red-600 text-white hover:bg-red-700 rounded-full px-10 py-7 text-base font-bold transition-all hover:-translate-y-1 shadow-lg shadow-red-600/50 group"
              >
                Explore Materials
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/workflow')}
                className="w-full sm:w-auto border-2 border-white/50 text-white hover:bg-white hover:text-slate-900 bg-black/20 backdrop-blur-sm rounded-full px-10 py-7 text-base font-bold transition-all hover:-translate-y-1"
              >
                System Workflow
              </Button>
            </motion.div>
          </motion.div>

        </div>
      </section>

      {/* ═══════ SPECIALIST ADVERTISEMENT SECTION ═══════ */}
      <section className="py-24 px-6 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <Reveal>
            <h3 className="text-2xl md:text-3xl font-medium leading-relaxed text-slate-800 pr-0 md:pr-8">
              TIMBER FLOORING SPECIALIST, WHO CAN PROVIDE YOU WITH FULL SUPPLY OF ALL TIMBER FLOORS, COMPLETE INSTALLATION AND ALL YOUR <span className="text-red-600 font-bold">SMART MATERIAL NEEDS</span>.
            </h3>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="flex items-start gap-12">
              <div className="w-0.5 h-64 bg-red-600 rounded-full hidden md:block" />
              <div className="space-y-12 text-slate-700 font-medium">
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-6">Contact Information</h4>
                  <p className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-red-600" /> 0415 504 902
                  </p>
                  <p className="flex items-center gap-3 mt-3">
                    <Mail className="h-5 w-5 text-red-600" /> projects@redstimberflooring.com
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 mb-6">Address</h4>
                  <p className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-red-600" />
                    <span>
                      141 Carrington St<br />
                      White Gum Valley WA, 6162<br />
                      Australia
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════ MODERN SOLUTIONS ═══════ */}
      <section id="modern-materials" className="py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <Reveal className="text-center mb-20">
            <p className="text-red-600 text-sm font-black tracking-[0.2em] uppercase mb-4">
              Why Choose Reds Timber Flooring
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900">
              Modern Solutions
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.1}>
                <div className="group p-10 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-2xl hover:border-red-100 transition-all duration-500 h-full">
                  <div className="h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center mb-8 group-hover:bg-red-600 transition-colors duration-500">
                    <s.icon className="h-8 w-8 text-red-600 group-hover:text-white transition-colors duration-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-red-600 transition-colors">
                    {s.title}
                  </h3>
                  <p className="text-slate-500 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ APPLICATION AREAS ═══════ */}
      <section id="projects" className="py-32 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <Reveal className="mb-16">
            <p className="text-red-600 text-sm font-black tracking-[0.2em] uppercase mb-4">
              Versatile Applications
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900">
              Ideal For Every Space
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {applications.map((a, i) => (
              <Reveal key={a.title} delay={i * 0.1}>
                <div className="group overflow-hidden rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500">
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img
                      src={a.img}
                      alt={a.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
                        <a.icon className="h-5 w-5 text-red-600" />
                      </div>
                      <h3 className="font-bold text-xl text-slate-900 group-hover:text-red-600 transition-colors">
                        {a.title}
                      </h3>
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      {a.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ VALUED PARTNERS SECTION ═══════ */}
      <section className="py-24 px-6 bg-white border-t border-slate-50">
        <div className="max-w-7xl mx-auto">
          <Reveal className="text-center mb-16">
            <p className="text-red-600 text-sm font-black tracking-[0.2em] uppercase mb-4">
              Our Network
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">
              Some of our valued partners and supporters
            </h2>
            <div className="w-20 h-1 bg-red-600 mx-auto mt-6 rounded-full" />
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 items-center justify-items-center">
            {partners.map((partner, i) => (
              <Reveal key={partner.name} delay={i * 0.05}>
                <div className="group relative flex items-center justify-center p-4 w-full h-32">
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="max-h-full max-w-full object-contain transition-transform duration-500 ease-in-out hover:scale-105"
                  />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="bg-white border-t border-slate-100 pt-20 pb-10 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <img src={redsLogo} alt="REDS Logo" className="h-12 w-auto object-contain mb-6" />
            <p className="text-slate-500 text-base max-w-sm leading-relaxed">
              Specialists in next-generation flooring installation. We bring durability, precision, and style to every floor we touch.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6">
              Contact Info
            </h4>
            <ul className="space-y-4 text-slate-500">
              <li className="flex items-center gap-3 hover:text-red-600 transition-colors cursor-pointer">
                <Phone className="h-5 w-5 text-red-600" /> 0415 504 902
              </li>
              <li className="flex items-center gap-3 hover:text-red-600 transition-colors cursor-pointer">
                <Mail className="h-5 w-5 text-red-600" /> projects@redstimberflooring.com
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-red-600" /> Perth, Western Australia
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6">
              Social Media
            </h4>
            <div className="flex gap-4">
              {[Instagram, Facebook, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-red-600 hover:text-white transition-all duration-300 shadow-sm"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-50 text-center text-sm text-slate-400 font-bold">
          © {new Date().getFullYear()} REDS Timber Flooring Specialists. All rights reserved.
        </div>
      </footer>
    </div>
  );
}