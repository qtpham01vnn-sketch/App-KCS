import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Layers, Upload, BrainCircuit, CheckCircle2, 
  ChevronRight, Save, Thermometer, Wind, 
  Gauge, Clock, AlertCircle, Trash2, Maximize2, Database, Plus
} from 'lucide-react';
import { runOCR } from '../lib/gemini';
import { SYSTEM_PROMPT_DRYER_V1, SCHEMA_DRYER } from '../lib/constants';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

export default function DryerAudit({ 
  formData: externalFormData, 
  handleInputChange: externalHandleInputChange, 
  dryerFormData: externalDryerFormData, 
  setDryerFormData: externalSetDryerFormData, 
  onSaveSuccess, 
  dryerState: externalDryerState, 
  setDryerState: externalSetDryerState 
}) {
  // Internal state fallback if props are not provided (Fix for direct routing)
  const [internalDryerState, setInternalDryerState] = React.useState({
    step: 1,
    image: null,
    isSaved: false,
    isAnalyzing: false
  });

  const [internalDryerFormData, setInternalDryerFormData] = React.useState({
    metadata: { thoiGian: '', ckEp: '', danDong: '', quatF1: '', quatF2: '', ngay: '', doAm: '', cuongDo: '', dayChuyen: 'Dây chuyền 1' },
    grid: Array.from({ length: 60 }, (_, i) => ({
      zone: (i % 12) + 1,
      floor: Math.floor(i / 12) + 1,
      t: '',
      p: ''
    }))
  });

  const [internalFormData, setInternalFormData] = React.useState({
    batchCode: '',
    gio: '',
    ngay: new Date().toLocaleDateString('vi-VN')
  });

  // Use props if available, otherwise use internal state
  const dryerState = externalDryerState || internalDryerState;
  const setDryerState = externalSetDryerState || setInternalDryerState;
  const dryerFormData = externalDryerFormData || internalDryerFormData;
  const setDryerFormData = externalSetDryerFormData || setInternalDryerFormData;
  const formData = externalFormData || internalFormData;
  
  const handleInputChange = (field, value) => {
    if (externalHandleInputChange) {
      externalHandleInputChange(field, value);
    } else {
      setInternalFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const { step, image, isSaved, isAnalyzing } = dryerState;
  const { grid: gridData, metadata } = dryerFormData;

  const setStep = (val) => setDryerState(prev => ({ ...prev, step: val }));
  const setImage = (val) => setDryerState(prev => ({ ...prev, image: val }));
  const setIsSaved = (val) => setDryerState(prev => ({ ...prev, isSaved: val }));
  const setIsAnalyzing = (val) => setDryerState(prev => ({ ...prev, isAnalyzing: val }));

  const resetForm = () => {
    setDryerState({
      step: 1,
      image: null,
      isSaved: false,
      isAnalyzing: false
    });
    // Reset grid and metadata to defaults
    setDryerFormData({
      metadata: { thoiGian: '', ckEp: '', danDong: '', quatF1: '', quatF2: '', ngay: '', doAm: '', cuongDo: '', dayChuyen: 'Dây chuyền 1' },
      grid: Array.from({ length: 60 }, (_, i) => ({
        zone: (i % 12) + 1,
        floor: Math.floor(i / 12) + 1,
        t: '',
        p: ''
      }))
    });
    handleInputChange('batchCode', '');
  };

  const setMetadata = (updater) => {
    setDryerFormData(prev => ({
      ...prev,
      metadata: typeof updater === 'function' ? updater(prev.metadata) : updater
    }));
  };

  const setGridData = (updater) => {
    setDryerFormData(prev => ({
      ...prev,
      grid: typeof updater === 'function' ? updater(prev.grid) : updater
    }));
  };

  const handleGridChange = (zone, floor, side, val) => {
    setGridData(prev => prev.map(item => 
      (item.zone === zone && item.floor === floor) 
        ? { ...item, [side]: val } 
        : item
    ));
  };

  const getHeatColor = (val) => {
    if (!val) return 'bg-white/5 border-white/5';
    const text = String(val).trim().toLowerCase();
    
    if (text.includes("mờ") || text.includes("mo")) {
      return 'bg-slate-700/80 text-white/70 border-white/20 italic font-medium';
    }

    const n = parseFloat(val);
    if (isNaN(n)) return 'bg-white/5 border-white/5';

    // Vivid Heatmap Scale
    if (n > 180) return 'bg-red-600/60 text-white border-red-400 shadow-[inset_0_0_15px_rgba(239,68,68,0.4)]';
    if (n > 150) return 'bg-orange-500/50 text-white border-orange-400';
    if (n > 120) return 'bg-amber-500/40 text-amber-50 border-amber-400';
    if (n > 100) return 'bg-emerald-500/30 text-emerald-50 border-emerald-400';
    if (n > 0) return 'bg-blue-600/40 text-blue-50 border-blue-400';
    
    return 'bg-white/5 border-white/5';
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Đồng bộ thời gian máy tính ngay khi nạp ảnh (Giống Lò Nung)
      const now = new Date();
      const currentGio = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const currentNgay = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;

      handleInputChange('gio', currentGio);
      handleInputChange('ngay', currentNgay);

      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const startOCR = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    try {
      const result = await runOCR([{ base64: image.split(',')[1], mimeType: 'image/jpeg' }], SYSTEM_PROMPT_DRYER_V1, SCHEMA_DRYER);
      
      if (result.metadata) setMetadata(prev => ({ ...prev, ...result.metadata }));
      if (result.grid) {
        setGridData(prev => prev.map(item => {
          const match = result.grid.find(g => g.zone === item.zone && g.floor === item.floor);
          return match ? { ...item, t: match.t, p: match.p } : item;
        }));
      }
      if (result.phu) setMetadata(prev => ({ ...prev, ...result.phu }));
      
      setStep(1); 
    } catch (error) {
      console.error("Dryer OCR Error:", error);
      alert("Lỗi AI: " + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveDryerData = async () => {
    try {
      // Improved Robust Date Formatting (Đồng bộ với Lò Nung)
      let dbDate = new Date();
      const rawDate = formData.ngay;
      if (rawDate) {
        const parts = rawDate.split(/[/.-]/);
        if (parts.length === 3) {
          let day, month, year;
          
          if (parts[0].length === 4) {
            // YYYY-MM-DD
            year = parseInt(parts[0]);
            month = parseInt(parts[1]) - 1;
            day = parseInt(parts[2]);
          } else {
            // DD/MM/YYYY
            day = parseInt(parts[0]);
            month = parseInt(parts[1]) - 1;
            const yearRaw = parts[2];
            year = yearRaw.length === 2 ? 2000 + parseInt(yearRaw) : parseInt(yearRaw);
          }
          
          let hours = 0, mins = 0;
          if (formData.gio) {
            const timeParts = formData.gio.split(/[:.-]/);
            if (timeParts.length >= 2) {
              hours = parseInt(timeParts[0]);
              mins = parseInt(timeParts[1]);
            }
          }
          dbDate = new Date(year, month, day, hours, mins, 0);
        }
      }

      const finalIsoDate = isNaN(dbDate.getTime()) ? new Date().toISOString() : dbDate.toISOString();

      const { error } = await supabase.from('kiln_dryer_reports').insert([{
        product_type: `LÒ SẤY 5 TẦNG`,
        kiln_type: 'Lò Sấy',
        batch_code: formData.batchCode || `BATCH-DRY-${Date.now()}`,
        kiln_data: { grid: gridData, metadata },
        strength_value: parseFloat(metadata.doAm) || 0,
        lab_info: metadata,
        created_at: finalIsoDate
      }]);
      if (error) throw error;
      setIsSaved(true);
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      console.error("Dryer Save Error:", err);
      alert("Lỗi lưu trữ: " + err.message);
    }
  };

  return (
    <div className="max-w-full mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header & Metadata (Compact version) */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h2 className="text-4xl font-black uppercase italic tracking-tighter flex items-center gap-4">
            <Layers className="text-brand-primary" size={36} /> Lò Sấy 5 Tầng
          </h2>
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[4px]">Hệ thống giám sát nhiệt độ 120 điểm</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="bg-brand-primary/10 border border-brand-primary/20 px-4 py-2 rounded-xl">
             <p className="text-[7px] font-black text-brand-primary uppercase mb-0.5">Thời gian</p>
             <input 
               value={formData.gio} 
               onChange={e => handleInputChange('gio', e.target.value)}
               className="bg-transparent border-none p-0 text-xs font-black text-brand-primary outline-none w-[60px]" 
             />
          </div>
          {[
            { label: 'CK Ép', val: metadata.ckEp, key: 'ckEp' },
            { label: 'Quạt F1', val: metadata.quatF1, key: 'quatF1' },
            { label: 'Quạt F2', val: metadata.quatF2, key: 'quatF2' },
            { label: 'Độ ẩm', val: metadata.doAm, key: 'doAm' },
            { label: 'Dây chuyền', val: metadata.dayChuyen || 'Dây chuyền 1', key: 'dayChuyen', isSelect: true },
          ].map(m => (
            <div key={m.key} className="bg-white/5 border border-white/5 px-4 py-2 rounded-xl">
              <p className="text-[7px] font-black text-white/30 uppercase mb-0.5">{m.label}</p>
              {m.isSelect ? (
                <select 
                  value={m.val}
                  onChange={e => setMetadata({...metadata, [m.key]: e.target.value})}
                  className="bg-transparent border-none p-0 text-xs font-black text-brand-primary outline-none appearance-none cursor-pointer"
                >
                  <option value="Dây chuyền 1">DC 1</option>
                  <option value="Dây chuyền 2">DC 2</option>
                </select>
              ) : (
                <input 
                  value={m.val} 
                  onChange={e => setMetadata({...metadata, [m.key]: e.target.value})}
                  className="w-[80px] bg-transparent border-none p-0 text-xs font-black text-brand-primary outline-none"
                />
              )}
            </div>
          ))}
          <div className="bg-brand-primary/10 border border-brand-primary/20 px-4 py-2 rounded-xl">
             <p className="text-[7px] font-black text-brand-primary uppercase mb-0.5">Mã Mẻ (Batch ID)</p>
             <input 
               placeholder="Mã Mẻ"
               value={formData.batchCode} 
               onChange={e => handleInputChange('batchCode', e.target.value)} 
               className="bg-transparent border-none p-0 text-[10px] font-black text-white outline-none w-[100px]" 
             />
          </div>
          <div className="bg-brand-primary/10 border border-brand-primary/20 px-4 py-2 rounded-xl">
             <p className="text-[7px] font-black text-brand-primary uppercase mb-0.5">Ngày</p>
             <input 
               value={formData.ngay} 
               onChange={e => handleInputChange('ngay', e.target.value)} 
               className="bg-transparent border-none p-0 text-[10px] font-black text-white outline-none w-[90px]" 
             />
          </div>
        </div>
      </div>

      {step === 1 ? (
        <div className="space-y-6">
          <div className="glass-card rounded-[2.5rem] border-white/5 overflow-hidden shadow-2xl p-2 bg-[#020617]/50">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-brand-primary scrollbar-track-white/5">
              <div className="min-w-[1800px] p-6 space-y-3">
                
                {/* Zone Headers - COMPACT */}
                <div className="flex gap-2 items-center">
                   <div className="w-16" /> {/* Floor Label Spacer narrowed */}
                   {Array.from({length: 12}).map((_, i) => (
                     <div key={i} className="flex-1 py-2 bg-brand-primary/20 border border-brand-primary/30 rounded-xl flex items-center justify-center">
                       <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary italic">Khoang {i+1}</span>
                     </div>
                   ))}
                </div>

                {/* Floors Data - WIDE & SHORT */}
                {[1, 2, 3, 4, 5].map(floor => (
                  <div key={floor} className="flex gap-2 items-center group">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center justify-center group-hover:border-brand-primary transition-all">
                       <span className="text-xl font-black italic">{floor}</span>
                       <p className="text-[7px] font-black text-white/20 uppercase tracking-widest -mt-1">Tầng</p>
                    </div>

                    {Array.from({length: 12}).map((_, i) => {
                      const zone = i + 1;
                      const cell = gridData.find(g => g.zone === zone && g.floor === floor);
                      return (
                        <div key={zone} className="flex-1 grid grid-cols-2 gap-1.5 p-1.5 bg-[#0f172a] rounded-2xl border border-white/5 group-hover:bg-white/[0.03] transition-all">
                           {/* Trái (T) - WIDER, SHORTER */}
                           <div className={cn("flex flex-col items-center py-1.5 px-1 rounded-xl border transition-all", getHeatColor(cell?.t))}>
                              <span className="text-[6px] font-black uppercase mb-0.5 opacity-50">T</span>
                              <input 
                                value={cell?.t || ''} 
                                onChange={(e) => handleGridChange(zone, floor, 't', e.target.value)}
                                className="w-full bg-transparent border-none text-center text-sm font-black outline-none placeholder:text-white/5"
                                placeholder="--"
                              />
                           </div>
                           {/* Phải (P) - WIDER, SHORTER */}
                           <div className={cn("flex flex-col items-center py-1.5 px-1 rounded-xl border transition-all", getHeatColor(cell?.p))}>
                              <span className="text-[6px] font-black uppercase mb-0.5 opacity-50">P</span>
                              <input 
                                value={cell?.p || ''} 
                                onChange={(e) => handleGridChange(zone, floor, 'p', e.target.value)}
                                className="w-full bg-transparent border-none text-center text-sm font-black outline-none placeholder:text-white/5"
                                placeholder="--"
                              />
                           </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 max-w-2xl mx-auto w-full">
            {isSaved ? (
              <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-500 w-full">
                <div className="flex items-center gap-3 text-emerald-400 font-black uppercase tracking-widest bg-emerald-500/10 px-8 py-4 rounded-2xl border border-emerald-500/20 w-full justify-center">
                  <CheckCircle2 size={24} /> ĐÃ LƯU DỮ LIỆU LÒ SẤY THÀNH CÔNG
                </div>
                <button 
                  onClick={resetForm} 
                  className="px-20 py-6 bg-brand-primary text-brand-bg rounded-3xl font-black uppercase tracking-[4px] shadow-2xl shadow-brand-primary/30 flex items-center gap-4 group active:scale-95 transition-all w-full justify-center"
                >
                  <Plus size={24} /> TẠO MẺ MỚI (RESET)
                </button>
              </div>
            ) : (
              <div className="flex gap-4 w-full">
                <button 
                  onClick={() => setStep(2)}
                  className="flex-1 py-5 bg-white/5 border border-white/10 text-white/60 rounded-2xl font-black uppercase tracking-[2px] text-[10px] flex items-center justify-center gap-3 hover:bg-brand-primary hover:text-brand-bg hover:border-brand-primary transition-all"
                >
                  <Upload size={16} /> Nạp ảnh phiếu sấy (AI)
                </button>
                <button 
                  onClick={saveDryerData}
                  className="flex-1 py-5 bg-brand-primary text-brand-bg rounded-2xl font-black uppercase tracking-[2px] text-[10px] shadow-xl shadow-brand-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  <Save size={16} /> Lưu vào Cloud
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="py-20 text-center space-y-10 animate-in slide-in-from-bottom duration-700">
           <div className="glass-card max-w-2xl mx-auto p-16 rounded-[3rem] border-2 border-dashed border-white/5 hover:border-brand-primary transition-all relative overflow-hidden group cursor-pointer shadow-2xl">
              <input type="file" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
              {image ? (
                <img src={image} className="max-h-[400px] mx-auto rounded-2xl shadow-2xl" alt="Dryer Sheet" />
              ) : (
                <div className="space-y-4">
                  <Upload size={48} className="mx-auto text-white/10 group-hover:text-brand-primary" />
                  <p className="text-sm font-black uppercase tracking-[4px] text-white/20">Chụp hoặc Chọn ảnh phiếu sấy</p>
                </div>
              )}
           </div>
           
           {isAnalyzing ? (
              <div className="space-y-4">
                <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto shadow-lg shadow-brand-primary/20" />
                <h3 className="text-lg font-black uppercase italic text-brand-primary tracking-tighter">AI đang đọc 120 điểm nhiệt...</h3>
              </div>
           ) : (
              <div className="flex gap-4 justify-center">
                <button onClick={() => setStep(1)} className="px-10 py-4 rounded-2xl border border-white/10 font-black uppercase text-[10px] tracking-widest hover:bg-white/5 transition-all">Hủy bỏ</button>
                {image && (
                  <button 
                    onClick={startOCR}
                    className="px-12 py-4 rounded-2xl bg-brand-primary text-brand-bg font-black uppercase text-[10px] tracking-widest shadow-2xl"
                  >
                    Bắt đầu trích xuất AI
                  </button>
                )}
              </div>
           )}
        </div>
      )}
    </div>
  );
}
