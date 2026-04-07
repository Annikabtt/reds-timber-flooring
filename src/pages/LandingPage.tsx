import { motion, useInView } from "framer-motion";
import { useRef, ReactNode } from "react";
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

/* ─── Scroll-triggered reveal ─── */
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
      initial={{ opacity: 0, y: 44 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Data ─── */
const services = [
  {
    icon: Crosshair,
    title: "Precision Installation",
    desc: "Laser-guided fitting with sub-millimetre accuracy. Every plank locked, levelled, and structurally sound.",
  },
  {
    icon: Shield,
    title: "High-Durability Materials",
    desc: "SPC, engineered wood, and modern laminate rated for heavy foot traffic — scratch-proof, waterproof, built to last.",
  },
  {
    icon: Building2,
    title: "Commercial & Residential Fitting",
    desc: "Scalable solutions from single apartments to multi-storey office fit-outs, delivered on schedule every time.",
  },
];

const applications = [
  {
    icon: HomeIcon,
    title: "Smart Homes",
    desc: "Seamless integration with underfloor heating and modern living spaces.",
    img: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&h=400&fit=crop",
  },
  {
    icon: Briefcase,
    title: "Corporate Offices",
    desc: "Hard-wearing, acoustic-rated flooring for high-performance workplaces.",
    img: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop",
  },
  {
    icon: Building,
    title: "Premium Apartments",
    desc: "Luxury finishes with modern materials that elevate property value.",
    img: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop",
  },
];

const navLinks = ["Home", "Modern Materials", "Projects", "Contact"];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans antialiased selection:bg-red-500/20 selection:text-red-600">
      {/* ═══════ NAVBAR ═══════ */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-2xl bg-white border-b border-neutral-200/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <a href="/">
            <img src={redsLogo} alt="REDS Timber Flooring Specialists" className="h-8 sm:h-10" />
          </a>

          {/* Center links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-500">
            {navLinks.map((l) => (
              <a
                key={l}
                href={`#${l.toLowerCase().replace(/\s+/g, "-")}`}
                className="relative hover:text-neutral-900 transition-colors duration-200 after:absolute after:bottom-[-2px] after:left-0 after:h-[2px] after:w-0 after:bg-red-500 after:transition-all after:duration-300 hover:after:w-full"
              >
                {l}
              </a>
            ))}
          </div>

          {/* Portal Login */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/auth")}
            className="border-red-500/30 text-red-600 hover:bg-red-500 hover:text-white bg-transparent rounded-[4px] text-xs tracking-wide font-semibold shadow-[0_0_16px_rgba(239,68,68,0.12)] hover:shadow-[0_0_24px_rgba(239,68,68,0.35)] transition-all duration-300 gap-1.5"
          >
            <Lock className="h-3.5 w-3.5" />
            Portal Login
          </Button>
        </div>
      </nav>

      {/* ═══════ HERO ═══════ */}
      <section
        id="home"
        className="relative min-h-screen flex items-center justify-center overflow-hidden bg-neutral-950"
      >
        {/* BG */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&h=1080&fit=crop"
            alt="Modern floor installation"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-950/90 via-neutral-950/70 to-red-950/40" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-semibold tracking-widest uppercase mb-8"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            Next-Gen Flooring Technology
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight text-white"
          >
            Next-Generation
            <br />
            <span className="text-red-500">Flooring Solutions.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-6 text-neutral-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
          >
            Precision installation of highly durable, modern flooring materials
            for homes, offices, and apartments.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.65 }}
            className="mt-10 flex items-center justify-center gap-4"
          >
            <Button
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white rounded-[4px] px-8 text-sm font-semibold tracking-wide shadow-[0_4px_24px_rgba(239,68,68,0.35)] hover:shadow-[0_4px_32px_rgba(239,68,68,0.5)] transition-all duration-300 group"
            >
              Explore Materials
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <div className="w-5 h-8 rounded-full border-2 border-white/20 flex items-start justify-center p-1">
            <div className="w-1 h-2 bg-red-500/60 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* ═══════ MODERN SOLUTIONS GRID ═══════ */}
      <section id="modern-materials" className="py-28 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p className="text-red-600 text-xs font-bold tracking-[0.3em] uppercase">
              Our Expertise
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold mt-3 tracking-tight text-neutral-900">
              Modern Solutions
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14">
            {services.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.12}>
                <div className="group relative p-8 rounded-[6px] border border-neutral-200 bg-white hover:border-red-500/40 transition-all duration-500 hover:shadow-[0_8px_40px_-12px_rgba(239,68,68,0.15)]">
                  <div className="h-12 w-12 rounded-[6px] bg-red-50 flex items-center justify-center mb-6 group-hover:bg-red-500 transition-colors duration-300">
                    <s.icon className="h-6 w-6 text-red-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-lg font-bold tracking-tight text-neutral-900">
                    {s.title}
                  </h3>
                  <p className="text-neutral-500 text-sm leading-relaxed mt-3">
                    {s.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ APPLICATION AREAS ═══════ */}
      <section id="projects" className="py-28 px-6 bg-neutral-950">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p className="text-red-500 text-xs font-bold tracking-[0.3em] uppercase">
              Ideal For
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold mt-3 tracking-tight text-white">
              Application Areas
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14">
            {applications.map((a, i) => (
              <Reveal key={a.title} delay={i * 0.12}>
                <div className="group relative overflow-hidden rounded-[6px] border border-white/10 bg-white/[0.03] hover:border-red-500/30 transition-all duration-500">
                  <div className="aspect-[3/2] overflow-hidden">
                    <img
                      src={a.img}
                      alt={a.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-70 group-hover:opacity-90"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-9 w-9 rounded-[4px] bg-red-500/10 flex items-center justify-center">
                        <a.icon className="h-4 w-4 text-red-500" />
                      </div>
                      <h3 className="font-bold text-white tracking-tight">
                        {a.title}
                      </h3>
                    </div>
                    <p className="text-neutral-400 text-sm leading-relaxed">
                      {a.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="bg-neutral-950 border-t border-white/[0.06] py-16 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <a href="/">
              <img src={redsLogo} alt="REDS Timber Flooring Specialists" className="h-8 brightness-0 invert" />
            </a>
            <p className="text-neutral-500 text-sm mt-3 leading-relaxed">
              Next-generation flooring installation — SPC, engineered wood, and
              modern laminate for homes, offices, and apartments.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold tracking-[0.2em] uppercase text-neutral-500 mb-4">
              Contact
            </h4>
            <ul className="space-y-3 text-sm text-neutral-400">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-red-500" /> 0412 345 678
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-red-500" /> info@redsflooring.com.au
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-500" /> Melbourne, VIC
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold tracking-[0.2em] uppercase text-neutral-500 mb-4">
              Follow Us
            </h4>
            <div className="flex items-center gap-4 mt-2">
              {[Instagram, Facebook, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="text-neutral-500 hover:text-red-500 transition-colors duration-200"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-white/[0.06] text-center text-xs text-neutral-600">
          © {new Date().getFullYear()} REDS Timber Flooring Specialists. All
          rights reserved.
        </div>
      </footer>
    </div>
  );
}
