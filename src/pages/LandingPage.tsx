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

          <div className="hidden md:flex items-center gap-6">
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
            
            <Button variant="ghost" onClick={() => navigate('/workflow')} className="font-bold text-slate-700 hover:text-indigo-600 border border-indigo-200">
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

        </div>
      </nav>

      {/* ═══════ HERO SECTION (DYNAMIC SLIDER) ═══════ */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-50 pb-24">
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImg}
              src={heroImages[currentImg]}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="w-full h-full object-cover"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/50 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pt-40 md:pt-32">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-600 text-white text-xs font-black tracking-widest uppercase mb-6 shadow-lg shadow-red-200"
            >
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              The Gold Standard in Flooring
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl md:text-8xl font-black leading-[1.1] tracking-tight text-slate-900 drop-shadow-lg"
            >
              Next-Generation <br />
              <span className="text-red-600">Flooring Solutions.</span>
            </motion