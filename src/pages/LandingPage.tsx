import { motion, useInView } from "framer-motion";
import { useRef, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Ruler,
  Wind,
  Hammer,
  ArrowRight,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Instagram,
  Facebook,
  Linkedin,
  FileText,
  Layers,
  Smartphone,
  CheckCircle2,
  Star,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

/* ─── Scroll animation wrapper ─── */
function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Data ─── */
const services = [
  { icon: Ruler, title: "Precision Installation", desc: "Millimetre-perfect fitting using laser-guided systems and premium-grade adhesives for installations that last decades." },
  { icon: Wind, title: "Advanced Dustless Sanding", desc: "Our enclosed sanding systems eliminate 99.5% of airborne dust, protecting your home and delivering a flawless finish." },
  { icon: Hammer, title: "Structural Restoration", desc: "From heritage buildings to modern homes, we restore and reinforce timber subfloors and surfaces to their original glory." },
];

const projects = [
  { img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=700&fit=crop", label: "Premium Oak", title: "Bayside Residence" },
  { img: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=500&fit=crop", label: "Engineered Wood", title: "Collins St Office" },
  { img: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=700&fit=crop", label: "Spotted Gum", title: "Brighton Villa" },
  { img: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600&h=500&fit=crop", label: "Blackbutt", title: "Toorak Penthouse" },
];

const steps = [
  { icon: FileText, title: "Digital Quote", desc: "Instant online quote with transparent, itemised pricing." },
  { icon: Layers, title: "Material Selection", desc: "Hand-pick from our curated range of sustainably sourced timbers." },
  { icon: Smartphone, title: "Real-time Tracking", desc: "Track daily progress with photos and updates from your phone." },
  { icon: CheckCircle2, title: "Final Handover", desc: "Detailed inspection, care guide, and our 10-year guarantee." },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white font-sans antialiased selection:bg-[#5C4033]/60 selection:text-white">
      {/* ═══════ NAVBAR ═══════ */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-[#1A1A1A]/60 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="text-lg font-bold tracking-tight">
            <span className="text-[#C9A96E]">Red's</span> Timber
          </a>

          <div className="hidden md:flex items-center gap-8 text-sm text-white/70">
            {["Home", "Expertise", "Portfolio", "Reviews"].map((l) => (
              <a key={l} href={`#${l.toLowerCase()}`} className="hover:text-white transition-colors duration-200">
                {l}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/auth")}
              className="hidden sm:inline-flex border-white/20 text-white/80 hover:bg-white/10 hover:text-white bg-transparent rounded-sm text-xs tracking-wide"
            >
              Client Portal
            </Button>
            <Button
              size="sm"
              className="bg-[#5C4033] hover:bg-[#6d4d3d] text-white rounded-sm text-xs tracking-wide"
            >
              Get an Estimate
            </Button>
          </div>
        </div>
      </nav>

      {/* ═══════ HERO ═══════ */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* BG image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&h=1080&fit=crop"
            alt="Premium timber flooring"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#1A1A1A]/80 via-[#1A1A1A]/60 to-[#1A1A1A]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[#C9A96E] text-sm tracking-[0.3em] uppercase mb-6"
          >
            Est. 2005 · Melbourne
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-4xl sm:text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight"
          >
            Mastering the Art
            <br />
            <span className="text-[#C9A96E]">of Timber Flooring.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-6 text-white/60 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
          >
            Precision engineering meets premium materials. We deliver flawless
            installations and restorations with transparent, tech-driven project
            tracking.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-10 flex items-center justify-center gap-4"
          >
            <Button
              size="lg"
              className="bg-[#5C4033] hover:bg-[#6d4d3d] text-white rounded-sm px-8 text-sm tracking-wide group"
            >
              View Our Work
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>

        {/* scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <div className="w-5 h-8 rounded-full border-2 border-white/20 flex items-start justify-center p-1">
            <div className="w-1 h-2 bg-white/40 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* ═══════ EXPERTISE ═══════ */}
      <section id="expertise" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p className="text-[#C9A96E] text-xs tracking-[0.3em] uppercase">What We Do</p>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3 tracking-tight">Our Expertise</h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14">
            {services.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.15}>
                <div className="group relative p-8 rounded-sm border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-500 hover:border-[#C9A96E]/30 hover:shadow-[0_8px_40px_-12px_rgba(201,169,110,0.15)]">
                  <div className="h-12 w-12 rounded-sm bg-[#5C4033]/20 flex items-center justify-center mb-6 group-hover:bg-[#5C4033]/30 transition-colors">
                    <s.icon className="h-6 w-6 text-[#C9A96E]" />
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight">{s.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed mt-3">{s.desc}</p>
                  <ChevronRight className="h-4 w-4 text-[#C9A96E] mt-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ PORTFOLIO ═══════ */}
      <section id="portfolio" className="py-28 px-6 bg-[#141414]">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p className="text-[#C9A96E] text-xs tracking-[0.3em] uppercase">Our Work</p>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3 tracking-tight">Signature Projects</h2>
          </Reveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-14">
            {projects.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.1} className={i % 3 === 0 ? "md:row-span-2" : ""}>
                <div className="group relative overflow-hidden rounded-sm h-full min-h-[240px]">
                  <img
                    src={p.img}
                    alt={p.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="bg-[#C9A96E]/90 text-[#1A1A1A] text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-sm">
                      {p.label}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <p className="text-white font-semibold text-sm">{p.title}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ PROCESS ═══════ */}
      <section className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p className="text-[#C9A96E] text-xs tracking-[0.3em] uppercase text-center">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3 tracking-tight text-center">
              Tech-Driven Transparency
            </h2>
            <p className="text-white/50 text-sm text-center mt-4 max-w-xl mx-auto">
              Track every stage of your project from your phone. No surprises, no guesswork.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.12}>
                <div className="relative p-6 text-center">
                  {/* step number */}
                  <span className="text-[#C9A96E]/20 text-6xl font-bold absolute -top-2 left-1/2 -translate-x-1/2 select-none">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="relative z-10">
                    <div className="h-14 w-14 mx-auto rounded-full border border-[#C9A96E]/30 flex items-center justify-center mb-5">
                      <s.icon className="h-6 w-6 text-[#C9A96E]" />
                    </div>
                    <h3 className="font-semibold tracking-tight">{s.title}</h3>
                    <p className="text-white/45 text-sm leading-relaxed mt-2">{s.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ REVIEWS ═══════ */}
      <section id="reviews" className="py-28 px-6 bg-[#141414]">
        <div className="max-w-4xl mx-auto text-center">
          <Reveal>
            <p className="text-[#C9A96E] text-xs tracking-[0.3em] uppercase">Testimonials</p>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3 tracking-tight">What Clients Say</h2>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="mt-14 p-10 rounded-sm border border-white/[0.06] bg-white/[0.02]">
              <div className="flex justify-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-[#C9A96E] text-[#C9A96E]" />
                ))}
              </div>
              <blockquote className="text-white/70 text-lg leading-relaxed italic max-w-2xl mx-auto">
                "Red's team transformed our entire home. The precision of the installation was remarkable — every plank aligned perfectly. The real-time tracking app kept us informed daily. Absolutely world-class."
              </blockquote>
              <p className="mt-6 text-sm font-semibold">Sarah & James Mitchell</p>
              <p className="text-white/40 text-xs mt-1">Brighton Residence · Premium Oak</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="border-t border-white/[0.06] py-16 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <a href="/" className="text-lg font-bold tracking-tight">
              <span className="text-[#C9A96E]">Red's</span> Timber
            </a>
            <p className="text-white/40 text-sm mt-3 leading-relaxed">
              Premium timber flooring installation, sanding, and restoration across Melbourne.
            </p>
          </div>

          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-white/50 mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-[#C9A96E]" /> 0412 345 678</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-[#C9A96E]" /> info@redstimber.com.au</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#C9A96E]" /> Melbourne, VIC</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs tracking-[0.2em] uppercase text-white/50 mb-4">Newsletter</h4>
            <p className="text-sm text-white/40 mb-3">Get flooring tips and project updates.</p>
            <div className="flex gap-2">
              <Input
                placeholder="Your email"
                className="bg-white/[0.05] border-white/10 text-white placeholder:text-white/30 rounded-sm h-9 text-sm focus-visible:ring-[#C9A96E]/40"
              />
              <Button size="sm" className="bg-[#5C4033] hover:bg-[#6d4d3d] text-white rounded-sm shrink-0">
                Subscribe
              </Button>
            </div>
            <div className="flex items-center gap-4 mt-6">
              {[Instagram, Facebook, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="text-white/30 hover:text-[#C9A96E] transition-colors">
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-white/[0.06] text-center text-xs text-white/25">
          © {new Date().getFullYear()} Red's Timber Flooring. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
