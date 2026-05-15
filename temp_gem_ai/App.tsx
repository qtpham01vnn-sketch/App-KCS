
import React, { useState, useEffect } from 'react';
import { ChatBot } from './components/ChatBot';
import { Calculator } from './components/Calculator';
import { MOCK_TILES, MOCK_PAINTS, TILE_SPECS, WASTE_FACTOR, PAINT_COVERAGE } from './constants';
import { SavedPlan, TileSize, Tile, Paint, MaterialSelection } from './types';

const App: React.FC = () => {
  const [plans, setPlans] = useState<SavedPlan[]>(() => {
    try {
      const saved = localStorage.getItem('pnc_saved_plans');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const [activeTab, setActiveTab] = useState<'consult' | 'catalog' | 'plans'>('consult');
  const [myTiles, setMyTiles] = useState<Tile[]>(() => {
    try {
      const saved = localStorage.getItem('pnc_custom_tiles');
      return saved ? JSON.parse(saved) : MOCK_TILES;
    } catch (e) { return MOCK_TILES; }
  });

  const [selection, setSelection] = useState<MaterialSelection>({});
  const [currentArea, setCurrentArea] = useState<number>(50);
  const [currentSize, setCurrentSize] = useState<string>('600x600');
  const [autoPrompt, setAutoPrompt] = useState<string | null>(null);

  const handleSelectMaterial = (type: keyof MaterialSelection, item: Tile | Paint) => {
    setSelection(prev => ({ ...prev, [type]: item }));
    setActiveTab('consult');
    const label = type === 'floor' ? 'SÀN' : type === 'wallBottom' ? 'CHÂN TƯỜNG' : type === 'wallMain' ? 'THÂN TƯỜNG' : type === 'wallBorder' ? 'VIỀN' : 'SƠN NƯỚC';
    setAutoPrompt(`Tôi đã chọn mẫu ${item.name} cho phần ${label}. Hãy tư vấn cách phối hợp với các phần còn lại!`);
  };

  return (
    <div className="min-h-screen pb-20 bg-[#020617] text-white">
      <header className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/10 py-5 px-8 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl shadow-blue-500/20">P</div>
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase italic leading-none">Gạch Men Phương Nam</h1>
              <p className="text-[9px] uppercase tracking-[0.3em] text-cyan-400 font-black mt-1">Hệ thống AI Phối Cảnh Chuyên Nghiệp</p>
            </div>
          </div>
          <nav className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
            {['consult', 'catalog', 'plans'].map(t => (
              <button key={t} onClick={() => setActiveTab(t as any)} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-blue-600 shadow-lg' : 'text-gray-400 hover:text-white'}`}>
                {t === 'consult' ? 'Tư vấn' : t === 'catalog' ? 'Kho Gạch & Sơn' : `Dự án (${plans.length})`}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4">
          <Calculator onCalculate={(a, s) => {setCurrentArea(a); setCurrentSize(s);}} selection={selection} onRemoveMaterial={(t) => setSelection(p => {const n={...p}; delete n[t]; return n;})} />
        </div>

        <div className="lg:col-span-8">
          {activeTab === 'consult' && (
            <ChatBot selection={selection} autoPrompt={autoPrompt} onConsumedAutoPrompt={() => setAutoPrompt(null)} onClearSelection={() => setSelection({})} onAddTile={(t) => setMyTiles([t, ...myTiles])} onRemoveMaterial={(t) => setSelection(p => {const n={...p}; delete n[t]; return n;})} onSaveResultToPlan={(img, sel) => setPlans([{id: Date.now().toString(), name: `Phương án ${plans.length+1}`, timestamp: Date.now(), area: currentArea, results: {totalBoxes: 0, totalArea: 0, wasteAmount: 0, paintLiters: 0}, fengShuiNote: "", visualizedImage: img, materials: sel}, ...plans])} />
          )}

          {activeTab === 'catalog' && (
            <div className="space-y-12 animate-slideUp">
               <section className="space-y-6">
                 <h3 className="text-lg font-black uppercase tracking-widest text-blue-400 border-l-4 border-blue-600 pl-4">Kho Gạch Men Phương Nam</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   {myTiles.map(tile => (
                     <div key={tile.id} className="glass-panel rounded-[2rem] overflow-hidden border border-white/10 group hover:border-blue-500/50 transition-all">
                        <div className="relative h-56">
                          <img src={tile.imageUrl} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center p-6 gap-2">
                             <p className="text-[10px] font-black text-white mb-2 uppercase tracking-widest">Sử dụng gạch này cho:</p>
                             <div className="grid grid-cols-2 gap-2 w-full">
                               <button onClick={() => handleSelectMaterial('floor', tile)} className="py-2 bg-blue-600 rounded-lg text-[8px] font-black uppercase">Lát Sàn</button>
                               <button onClick={() => handleSelectMaterial('wallBottom', tile)} className="py-2 bg-indigo-600 rounded-lg text-[8px] font-black uppercase">Ốp Chân</button>
                               <button onClick={() => handleSelectMaterial('wallMain', tile)} className="py-2 bg-purple-600 rounded-lg text-[8px] font-black uppercase">Ốp Thân</button>
                               <button onClick={() => handleSelectMaterial('wallBorder', tile)} className="py-2 bg-orange-600 rounded-lg text-[8px] font-black uppercase">Ốp Viền</button>
                             </div>
                          </div>
                        </div>
                        <div className="p-5">
                          <h4 className="font-bold text-white text-xs mb-1">{tile.name}</h4>
                          <p className="text-[9px] text-gray-500 font-bold uppercase">{tile.size} • {tile.material}</p>
                        </div>
                     </div>
                   ))}
                 </div>
               </section>

               <section className="space-y-6">
                 <h3 className="text-lg font-black uppercase tracking-widest text-emerald-400 border-l-4 border-emerald-600 pl-4">Kho Sơn Nước Phương Nam</h3>
                 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                   {MOCK_PAINTS.map(paint => (
                     <div key={paint.id} onClick={() => handleSelectMaterial('paint', paint)} className="glass-panel p-4 rounded-2xl border border-white/10 cursor-pointer hover:border-emerald-500 transition-all group">
                        <div className="w-full aspect-square rounded-xl mb-3 shadow-inner group-hover:scale-105 transition-transform" style={{backgroundColor: paint.hex}}></div>
                        <p className="text-[9px] font-bold text-white text-center leading-tight">{paint.name}</p>
                        <p className="text-[7px] text-gray-500 text-center mt-1 uppercase">{paint.code}</p>
                     </div>
                   ))}
                 </div>
               </section>
            </div>
          )}

          {activeTab === 'plans' && (
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 animate-slideUp">
                {plans.map(p => (
                  <div key={p.id} className="glass-panel rounded-[2.5rem] border border-white/10 overflow-hidden">
                     <img src={p.visualizedImage} className="w-full h-64 object-cover" />
                     <div className="p-5 flex justify-between items-center">
                        <h4 className="font-black text-white text-xs uppercase">{p.name}</h4>
                        <button onClick={() => setPlans(plans.filter(pl => pl.id !== p.id))} className="text-red-500/40 text-xs"><i className="fas fa-trash"></i></button>
                     </div>
                  </div>
                ))}
             </div>
          )}
        </div>
      </main>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
    </div>
  );
};

export default App;
