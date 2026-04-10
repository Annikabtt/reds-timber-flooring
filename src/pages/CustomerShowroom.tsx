import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; //
import { 
  Droplets, Shield, PawPrint, CheckCircle2, 
  Heart, ArrowRight, Sparkles 
} from 'lucide-react';
import { Button } from "@/components/ui/button";

// --- Mock Data: ข้อมูลสำหรับโชว์ลูกค้า (ซ่อนราคาและสต็อก) ---
const showroomProducts = [
  { 
    id: 'SPC-01', 
    name: "Natural Oak Hybrid", 
    category: "spc",
    desc: "Authentic timber look with ultimate durability.",
    features: ['100% Waterproof', 'Scratch Resistant', 'Pet Friendly'],
    img: "https://images.unsplash.com/photo-1581858326456-6189df1a590e?w=800&q=80"
  },
  { 
    id: 'TMB-02', 
    name: "Spotted Gum Timber", 
    category: "timber",
    desc: "Premium Australian engineered timber.",
    features: ['Real Wood Top', 'Elegant Finish', 'Eco-Friendly'],
    img: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80"
  },
  { 
    id: 'LAM-03', 
    name: "Classic Walnut", 
    category: "laminate",
    desc: "Budget-friendly classic style for any room.",
    features: ['Fade Resistant', 'Easy Clean', 'Durable'],
    img: "https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?w=800&q=80"
  },
  { 
    id: 'SPC-04', 
    name: "Grey Ash Hybrid", 
    category: "spc",
    desc: "Modern grey tones for contemporary spaces.",
    features: ['100% Waterproof', 'Acoustic Backing', 'Pet Friendly'],
    img: "https://images.unsplash.com/photo-1582582621959-48d27397dc69?w=800&q=80"
  },
];

const categories = [
  { id: 'all', name: 'All Collections' },
  { id: 'spc', name: 'SPC Hybrid' },
  { id: 'timber', name: 'Engineered Timber' },
  { id: 'laminate', name: 'Laminate' },
];

export default function CustomerShowroom() {
  const navigate = useNavigate(); //
  const [activeTab, setActiveTab] = useState('all');
  const [wishlist, setWishlist] = useState<string[]>([]);

  // ฟังก์ชันกดหัวใจ (เพิ่มลง Wishlist)
  const toggleWishlist = (id: string) => {
    if (wishlist.includes(id)) {
      setWishlist(wishlist.filter(item => item !== id));
    } else {
      setWishlist([...wishlist, id]);
    }
  };

  const filteredProducts = showroomProducts.filter(p => activeTab === 'all' || p.category === activeTab);

  // Helper function เลือก Icon ให้ตรงกับ Feature
  const getFeatureIcon = (feature: string) => {
    if (feature.includes('Waterproof')) return <Droplets size={14} className="text-blue-500" />;
    if (feature.includes('Pet')) return <PawPrint size={14} className="text-amber-500" />;
    if (feature.includes('Resistant') || feature.includes('Durable')) return <Shield size={14} className="text-emerald-500" />;
    return <CheckCircle2 size={14} className="text-slate-400" />;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      {/* --- Hero Section (หน้าปกพรีเมียม) --- */}
      <div className="bg-slate-900 text-white py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img src="https://images.unsplash.com/photo-1600607686527-6fb886090705?w=1600&q=80" alt="Background" className="w-full h-full object-cover" />
        </div>
        <div className="max-w-6xl mx-auto relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-sm font-bold tracking-widest uppercase mb-4">
            <Sparkles size={16} className="text-amber-400" />
            Premium Flooring
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight">
            Find Your Perfect <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">Foundation.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-light">
            Explore our curated collection of high-quality flooring options designed to elevate your living spaces.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 space-y-12">
        
        {/* --- Category Tabs --- */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 ${
                activeTab === cat.id 
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-105' 
                  : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* --- Product Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => {
            const isSelected = wishlist.includes(product.id);
            return (
              <div key={product.id} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 group border border-slate-100">
                
                {/* Product Image */}
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={product.img} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  {/* Heart Button */}
                  <button 
                    onClick={() => toggleWishlist(product.id)}
                    className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:scale-110 transition-transform"
                  >
                    <Heart 
                      size={20} 
                      className={`transition-colors ${isSelected ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} 
                    />
                  </button>
                </div>

                {/* Product Details */}
                <div className="p-6 md:p-8 space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{product.name}</h3>
                    <p className="text-slate-500 text-sm mt-2 leading-relaxed">{product.desc}</p>
                  </div>

                  {/* Features List */}
                  <div className="space-y-2 pt-4 border-t border-slate-100">
                    {product.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                        {getFeatureIcon(feature)}
                        {feature}
                      </div>
                    ))}
                  </div>

                  <Button 
                    onClick={() => toggleWishlist(product.id)}
                    variant={isSelected ? "default" : "outline"}
                    className={`w-full mt-6 h-12 rounded-xl font-bold transition-all ${
                      isSelected 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                        : 'border-slate-200 text-slate-700 hover:border-slate-900 hover:text-slate-900'
                    }`}
                  >
                    {isSelected ? '✓ Added to Wishlist' : 'Select for Quote'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* --- Floating Action Bar (แสดงเมื่อมีของใน Wishlist) --- */}
        {wishlist.length > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-10 z-50">
            <div className="font-medium text-sm flex items-center gap-2">
              <Heart size={16} className="fill-red-500 text-red-500" />
              <span className="font-bold text-lg">{wishlist.length}</span> items selected
            </div>
            <Button 
             onClick={() => navigate('/proposal')} 
             className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-full px-6"
>             View Proposal <ArrowRight size={16} className="ml-2" />
           </Button>
          </div>
        )}

      </div>
    </div>
  );
}