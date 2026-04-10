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