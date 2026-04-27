import React, { useState } from 'react';
import { Package, Plus, Search, Box, Layers, Spline, Wrench } from 'lucide-react';
import { Button } from "@/components/ui/button";

// --- Main Categories ---
const mainCategories = [
  { id: 'flooring', name: 'Flooring', icon: <Layers size={18} /> },
  { id: 'accessories', name: 'Accessories', icon: <Spline size={18} /> },
  { id: 'supplies', name: 'Supplies & Tools', icon: <Wrench size={18} /> },
];

// --- Sub-Categories ---
const subCategories: Record<string, { id: string, name: string }[]> = {
  flooring: [
    { id: 'all', name: 'All Flooring' },
    { id: 'spc', name: 'SPC Hybrid' },
    { id: 'timber', name: 'Engineered Timber' },
    { id: 'laminate', name: 'Laminate' },
  ],
  accessories: [
    { id: 'all', name: 'All Accessories' },
    { id: 'skirting', name: 'Skirting' },
    { id: 'scotia', name: 'Scotia Trim' },
    { id: 't-molding', name: 'T-Molding' },
  ],
  supplies: [
    { id: 'all', name: 'All Supplies' },
    { id: 'adhesive', name: 'Adhesive' },
    { id: 'underlay', name: 'Underlay' },
    { id: 'tools', name: 'Tools' },
  ]
};

// --- Mock Database ---
const mockProducts = [
  // Flooring
  { id: 1, name: "Natural Oak SPC", sku: "SPC-OAK-01", mainCat: "flooring", subCat: "spc", price: 35.00, stock: 1250, unit: "SQM", img:"/images/natural-oak-spc.png" },
  { id: 2, name: "Spotted Gum Timber", sku: "TMB-SG-02", mainCat: "flooring", subCat: "timber", price: 85.00, stock: 320, unit: "SQM", img:"/images/white-skirting.png" },
  { id: 3, name: "Classic Walnut Laminate", sku: "LAM-WAL-03", mainCat: "flooring", subCat: "laminate", price: 25.00, stock: 450, unit: "SQM", img:"/images/classic-walnut-laminate.png" },
  
  // Accessories
  { id: 4, name: "White Skirting 90mm", sku: "ACC-SKT-90W", mainCat: "accessories", subCat: "skirting", price: 15.00, stock: 400, unit: "Length (5.4m)", img:"/images/white-skirting-90mm.png" }, 
  { id: 5, name: "Oak Scotia Trim", sku: "ACC-SCT-OAK", mainCat: "accessories", subCat: "scotia", price: 12.00, stock: 150, unit: "Length (2.4m)", img:"/images/oak-scotia-trim.png" },
  
  // Supplies & Tools
  { id: 6, name: "Premium PU Adhesive", sku: "SUP-GLU-PU", mainCat: "supplies", subCat: "adhesive", price: 120.00, stock: 45, unit: "Bucket (15kg)", img: "/images/white-skirting-90mm.png" },
  { id: 7, name: "Acoustic Underlay 2mm", sku: "SUP-UND-02", mainCat: "supplies", subCat: "underlay", price: 65.00, stock: 80, unit: "Roll (20 SQM)", img: "/images/acoustic-underlay-2mm.png" },
  { id: 8, name: "Rubber Mallet", sku: "TOL-MAL-01", mainCat: "supplies", subCat: "tools", price: 25.00, stock: 12, unit: "Piece", img: "/images/rubber-mallet.png" },
];

export default function MaterialCatalog() {
  const [activeMainCat, setActiveMainCat] = useState('flooring');
  const [activeSubCat, setActiveSubCat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleMainCatChange = (catId: string) => {
    setActiveMainCat(catId);
    setActiveSubCat('all');
  };

  const filteredProducts = mockProducts.filter(p => {
    const matchMain = p.mainCat === activeMainCat;
    const matchSub = activeSubCat === 'all' || p.subCat === activeSubCat;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchMain && matchSub && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* --- Header Section --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <Package className="text-indigo-600" size={32} />
              Material Catalog
            </h1>
            <p className="text-slate-500 mt-1">Manage flooring products, accessories, and supplies.</p>
          </div>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 px-6 rounded-xl shadow-lg shadow-indigo-900/20">
            <Plus className="mr-2" size={20} /> Add New Item
          </Button>
        </div>

        {/* --- Filter System --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          
          <div className="flex border-b border-slate-100 bg-slate-50/50">
            {mainCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleMainCatChange(cat.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all border-b-2 ${
                  activeMainCat === cat.id 
                    ? 'border-indigo-600 text-indigo-700 bg-white' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                {cat.icon}
                <span className="hidden sm:inline">{cat.name}</span>
              </button>
            ))}
          </div>

          <div className="p-4 space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Search by name or SKU..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>

            <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar">
              {subCategories[activeMainCat].map((subCat) => (
                <button
                  key={subCat.id}
                  onClick={() => setActiveSubCat(subCat.id)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${
                    activeSubCat === subCat.id 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {subCat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* --- Product Grid --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all group cursor-pointer flex flex-col">
              <div className="h-48 overflow-hidden relative bg-slate-100 shrink-0">
                <img 
                  src={product.img} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-bold text-slate-700 shadow-sm">
                  {subCategories[product.mainCat].find(c => c.id === product.subCat)?.name || product.subCat}
                </div>
              </div>
              
              <div className="p-5 flex flex-col flex-1">
                <div className="text-xs text-slate-400 font-mono mb-1">{product.sku}</div>
                <h3 className="font-bold text-lg text-slate-800 leading-tight mb-3 flex-1">{product.name}</h3>
                
                <div className="flex items-end justify-between mt-auto pt-4 border-t border-slate-100">
                  <div>
                    <span className="text-xs text-slate-500 font-bold uppercase block mb-1">Base Price</span>
                    <span className="text-xl font-black text-indigo-600">${product.price.toFixed(2)}</span>
                    <span className="text-xs text-slate-500"> /{product.unit}</span>
                  </div>
                  <div className={`text-right ${product.stock < 50 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    <Box size={16} className="inline mr-1" />
                    <span className="font-bold text-sm">{product.stock}</span>
                    <div className="text-[10px] uppercase tracking-wider mt-0.5">In Stock</div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Empty State */}
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <Package className="mx-auto text-slate-300 mb-4" size={48} />
              <p className="text-slate-500 font-medium text-lg">No items found.</p>
              <p className="text-slate-400 text-sm mt-1">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}