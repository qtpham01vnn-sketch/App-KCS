import React, { useState, useMemo } from 'react';
import { 
  ArrowLeftRight, Search, Clock, Thermometer, 
  Gauge, Wind, Beaker, Layers, X, ChevronDown,
  AlertTriangle, CheckCircle2, TrendingUp, TrendingDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

// Reuse helper from DatabaseView
const formatDate = (dateStr) => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "---";
    return d.toLocaleString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  } catch (e) { return "---"; }
};

const getHeatColor = (val, diff = 0) => {
  if (!val) return 'bg-white/5 border-white/5';
  
  // If we are in "Delta" mode, use diff colors
  if (diff !== 0) {
    if (diff >= 10) return 'bg-red-500/40 border-red-400 text-white';
    if (diff > 0) return 'bg-red-500/20 border-red-400/30 text-red-200';
    if (diff <= -10) return 'bg-blue-500/40 border-blue-400 text-white';
    if (diff < 0) return 'bg-blue-500/20 border-blue-400/30 text-blue-200';
  }

  const n = parseFloat(val);
  if (isNaN(n)) return 'bg-white/5 border-white/5';
  if (n > 1100) return 'bg-red-600/40 text-white border-red-400';
  if (n > 800) return 'bg-orange-500/30 text-white border-orange-400';
  if (n > 100) return 'bg-emerald-500/20 text-emerald-50 border-emerald-400';
  return 'bg-blue-600/20 text-blue-50 border-blue-400';
};

const BatchSelector = ({ label, logs, selected, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return logs.filter(l => 
      l.product_type.toLowerCase().includes(search.toLowerCase()) ||
      formatDate(l.created_at).includes(search)
    ).slice(0, 10);
  }, [logs, search]);

  return (
    <div className="relative flex-1">
      <p className="text-[10px] font-black text-white/30 uppercase tracking-[4px] mb-3 ml-2">{label}</p>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full glass-card p-5 rounded-2xl border-white/10 flex justify-between items-center group hover:border-brand-primary transition-all"
      >
        {selected ? (
          <div className="text-left">
            <p className="text-sm font-black uppercase text-brand-primary italic">{selected.product_type}</p>
            <p className="text-[10px] font-bold text-white/40">{formatDate(selected.created_at)}</p>
          </div>
        ) : (
          <span className="text-sm font-black text-white/20 uppercase italic">Chọn mẻ dữ liệu...</span>
        )}
        <ChevronDown className={cn("text-white/20 group-hover:text-brand-primary transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 mt-3 z-50 glass-card rounded-2xl border-white/10 p-2 shadow-2xl overflow-hidden"
          >
            <div className="p-2 border-b border-white/5 mb-2">
              <input 
                autoFocus
                type="text" 
                placeholder="Tìm kiếm..." 
                className="w-full bg-white/5 border-none p-3 rounded-xl text-xs font-bold outline-none"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filtered.map(log => (
                <button
                  key={log.id}
                  onClick={() => { onSelect(log); setIsOpen(false); }}
                  className="w-full text-left p-4 rounded-xl hover:bg-brand-primary/10 transition-all border border-transparent hover:border-brand-primary/20 group mb-1"
                >
                  <p className="text-xs font-black uppercase group-hover:text-brand-primary transition-colors italic">{log.product_type}</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-[9px] font-bold text-white/30">{formatDate(log.created_at)}</p>
                    <span className="text-[9px] font-black text-brand-primary uppercase">{log.kiln_type}</span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ComparisonBlock = ({ log, otherLog }) => {
  if (!log) return (
    <div className="flex-1 min-h-[600px] rounded-[3rem] border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-white/10 space-y-4">
       <ArrowLeftRight size={48} className="animate-pulse" />
       <p className="text-sm font-black uppercase tracking-widest">Chờ chọn dữ liệu</p>
    </div>
  );

  const kilnData = log.kiln_data || {};
  const labInfo = typeof log.lab_info === 'string' ? JSON.parse(log.lab_info) : log.lab_info;
  const isDryer = log.kiln_type === 'Lò Sấy';

  return (
    <div className="flex-1 glass-card rounded-[3rem] border-white/10 overflow-hidden flex flex-col shadow-2xl">
      <div className="p-8 border-b border-white/5 bg-white/5">
        <div className="flex items-center gap-4 mb-2">
          <span className={cn(
            "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest",
            isDryer ? "bg-amber-500/20 text-amber-500" : "bg-brand-primary/20 text-brand-primary"
          )}>
            {log.kiln_type}
          </span>
          <h3 className="text-2xl font-black uppercase tracking-tight italic text-white/90 truncate">{log.product_type}</h3>
        </div>
        <p className="text-[10px] font-bold text-white/30 uppercase tracking-[4px] flex items-center gap-2">
          <Clock size={12} className="text-brand-primary" /> {formatDate(log.created_at)}
        </p>
      </div>

      <div className="flex-1 p-8 space-y-8 overflow-y-auto custom-scrollbar">
        {/* Lab Stats Comparison */}
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <p className="text-[8px] font-black text-white/20 uppercase mb-1">Lực bẻ</p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-brand-primary italic">{log.strength_value}N</span>
                {otherLog && (
                  <span className={cn(
                    "text-[10px] font-black",
                    log.strength_value > otherLog.strength_value ? "text-emerald-400" : "text-red-400"
                  )}>
                    {log.strength_value > otherLog.strength_value ? <TrendingUp size={10} className="inline mr-1" /> : <TrendingDown size={10} className="inline mr-1" />}
                    {Math.abs(log.strength_value - otherLog.strength_value).toFixed(1)}
                  </span>
                )}
              </div>
           </div>
           <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <p className="text-[8px] font-black text-white/20 uppercase mb-1">Hút nước</p>
              <p className="text-xl font-black italic">{labInfo?.hutNuoc || '---'}%</p>
           </div>
        </div>

        {/* Thermal Content */}
        {isDryer ? (
           <div className="space-y-4">
              <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest">Lưới nhiệt lò sấy</h4>
              <div className="space-y-1.5">
                 {[5,4,3,2,1].map(floor => (
                   <div key={floor} className="flex gap-1.5 items-center">
                      <div className="w-10 h-10 bg-white/5 rounded-lg border border-white/5 flex items-center justify-center text-[10px] font-black opacity-30">{floor}</div>
                      {Array.from({length: 12}).map((_, i) => {
                         const cell = kilnData.grid?.find(g => g.zone === (i+1) && g.floor === floor);
                         return (
                           <div key={i} className={cn("flex-1 h-10 rounded-lg border text-[10px] font-black flex items-center justify-center", getHeatColor(cell?.t))}>
                             {cell?.t || '--'}
                           </div>
                         )
                      })}
                   </div>
                 ))}
              </div>
           </div>
        ) : (
           <div className="space-y-6">
              <h4 className="text-xs font-black text-brand-primary uppercase tracking-widest">Dải nhiệt lò nung (PV)</h4>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                 {Array.from({length: 100}).map((_, i) => {
                    const top = kilnData.nhietDo?.find(n => n.id === `M${i}`);
                    const bot = kilnData.nhietDo?.find(n => n.id === `M0${i}`);
                    if (!top && !bot) return null;
                    
                    // Comparison logic if other log exists and is also Kiln
                    let diffTop = 0;
                    if (otherLog && otherLog.kiln_type === 'Lò Nung' && otherLog.kiln_data?.nhietDo) {
                      const otherTop = otherLog.kiln_data.nhietDo.find(n => n.id === `M${i}`);
                      if (top?.pv && otherTop?.pv) diffTop = parseFloat(top.pv) - parseFloat(otherTop.pv);
                    }

                    return (
                      <div key={i} className="space-y-2 p-3 bg-black/20 rounded-2xl border border-white/5 text-center">
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-tighter">Z{i}</p>
                        <div className={cn("py-2 rounded-xl border text-sm font-black shadow-inner", getHeatColor(top?.pv, diffTop))}>
                          {top?.pv || '--'}
                        </div>
                        <div className={cn("py-2 rounded-xl border text-sm font-black shadow-inner", getHeatColor(bot?.pv))}>
                          {bot?.pv || '--'}
                        </div>
                      </div>
                    )
                 })}
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default function ThermalCompare({ cloudLogs }) {
  const [batchA, setBatchA] = useState(null);
  const [batchB, setBatchB] = useState(null);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h3 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-4 text-brand-primary italic">
            <ArrowLeftRight size={36}/> So sánh dải nhiệt
          </h3>
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[6px] ml-1">Đối soát thông số kỹ thuật đa mẻ</p>
        </div>
        
        <div className="flex gap-4 w-full max-w-2xl">
           <BatchSelector 
             label="Mẻ đối chứng (A)" 
             logs={cloudLogs} 
             selected={batchA} 
             onSelect={setBatchA} 
           />
           <div className="flex items-center justify-center pt-8">
             <div className="w-10 h-10 bg-brand-primary/10 rounded-full flex items-center justify-center border border-brand-primary/20">
                <ArrowLeftRight size={16} className="text-brand-primary" />
             </div>
           </div>
           <BatchSelector 
             label="Mẻ so sánh (B)" 
             logs={cloudLogs} 
             selected={batchB} 
             onSelect={setBatchB} 
           />
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="flex flex-col lg:flex-row gap-8 min-h-[70vh]">
         <ComparisonBlock log={batchA} otherLog={batchB} />
         <ComparisonBlock log={batchB} otherLog={batchA} />
      </div>

      {/* Delta Analysis Panel (Only shown if both selected) */}
      <AnimatePresence>
        {batchA && batchB && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-10 rounded-[3rem] border-brand-primary/20 bg-brand-primary/5"
          >
            <h4 className="text-sm font-black uppercase tracking-[6px] text-brand-primary flex items-center gap-4 mb-8 italic">
              <AlertTriangle size={20} /> PHÂN TÍCH BIẾN THIÊN (A - B)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
               <div className="space-y-4">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Độ lệch Lực bẻ</p>
                  <div className="flex items-center gap-6">
                    <div className="text-4xl font-black italic">
                      {(batchA.strength_value - batchB.strength_value).toFixed(1)}N
                    </div>
                    <div className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase",
                      Math.abs(batchA.strength_value - batchB.strength_value) < 50 ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/20 text-red-500"
                    )}>
                      {Math.abs(batchA.strength_value - batchB.strength_value) < 50 ? "Ổn định" : "Lệch cao"}
                    </div>
                  </div>
               </div>
               
               <div className="md:col-span-2">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Nhận xét từ AI Trợ lý</p>
                  <div className="bg-black/40 p-6 rounded-2xl border border-white/5 flex gap-4">
                     <div className="w-12 h-12 bg-brand-primary/20 rounded-xl flex items-center justify-center shrink-0">
                        <CheckCircle2 className="text-brand-primary" size={24} />
                     </div>
                     <p className="text-sm text-white/70 leading-relaxed italic">
                        Dựa trên dữ liệu so sánh, mẻ <strong>{batchA.product_type}</strong> ({formatDate(batchA.created_at)}) có xu hướng nhiệt độ 
                        {batchA.strength_value > batchB.strength_value ? " cao hơn " : " thấp hơn "} 
                        so với mẻ <strong>{batchB.product_type}</strong>. 
                        Độ lệch lực bẻ đạt {Math.abs(batchA.strength_value - batchB.strength_value).toFixed(1)}N. 
                        Khuyến nghị kiểm tra dải nhiệt các zone từ Z20-Z40 nếu có sự thay đổi lớn về độ hút nước.
                     </p>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
