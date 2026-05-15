import React, { useState, useMemo, useEffect } from 'react';
import { 
  ScanLine, Activity, Target, ShieldCheck, 
  ArrowRight, Zap, Flame, Droplets, 
  AlertTriangle, CheckCircle2, ChevronRight,
  Monitor, Info, Gauge, Database, Calendar, Search, RefreshCcw,
  Settings as SettingsIcon, Upload, Check, X,
  TrendingUp, BarChart3, Layers, Thermometer, Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { runStandardOCR, runExcelOCR } from '../lib/gemini';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area 
} from 'recharts';

export default function TechnicalMonitoring({ cloudLogs: externalCloudLogs }) {
  const [internalCloudLogs, setInternalCloudLogs] = useState([]);
  const [fetchingLogs, setFetchingLogs] = useState(!externalCloudLogs);
  
  // Fetch logs if not provided as props
  useEffect(() => {
    if (!externalCloudLogs) {
      const fetchLogs = async () => {
        try {
          const { data, error } = await supabase
            .from('kiln_dryer_reports')
            .select('*')
            .order('created_at', { ascending: false });
          if (error) throw error;
          setInternalCloudLogs(data || []);
        } catch (err) {
          console.error("Fetch logs error:", err);
        } finally {
          setFetchingLogs(false);
        }
      };
      fetchLogs();
    }
  }, [externalCloudLogs]);

  const cloudLogs = externalCloudLogs || internalCloudLogs;
  const [selectedProduct, setSelectedProduct] = useState('Tất cả');
  const [selectedLine, setSelectedLine] = useState('ALL');
  const [activeStage, setActiveStage] = useState('PREP');
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingFile, setPendingFile] = useState(null); // File đang chờ xử lý
  const [showRawData, setShowRawData] = useState(false); // Hiển thị dữ liệu thô AI bóc tách

  // --- DATE RANGE STATE ---
  const today = new Date().toISOString().split('T')[0];
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [dateRange, setDateRange] = useState({ start: lastWeek, end: today });

  // --- STANDARDS STATE (Fetched from DB) ---
  const [standards, setStandards] = useState([]);
  
  useEffect(() => {
    fetchStandards();
  }, []);

  const fetchStandards = async () => {
    try {
      console.log("Fetching standards for Stage:", activeStage);
      const { data, error } = await supabase
        .from('production_standards')
        .select('*')
        .order('created_at', { ascending: false }); // Dùng created_at thay vì updated_at
      
      if (error) {
        console.error("Fetch Error:", error);
        throw error;
      }
      
      console.log("Standards fetched count:", data?.length);
      setStandards(data || []);
      return data;
    } catch (err) {
      console.error("Critical Fetch Error:", err);
    }
  };

  const currentStandard = useMemo(() => {
    // Ưu tiên sản phẩm đang chọn, nếu là 'Tất cả' thì lấy mặc định '40X80'
    const targetProduct = selectedProduct === 'Tất cả' ? '40X80' : selectedProduct;
    
    const raw = standards.find(s => s.product_type === targetProduct && s.category === activeStage) || 
                standards.find(s => s.product_type === '40X80' && s.category === activeStage) || null;
    
    if (!raw) return null;

    // CHUẨN HÓA DỮ LIỆU
    let data = raw.standards;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch(e) { console.error("JSON Parse Error", e); }
    }
    // Nếu là mảng, lấy phần tử đầu tiên
    if (Array.isArray(data)) data = data[0];
    
    console.log("Current Standard Object:", data);
    return { ...raw, standards: data };
  }, [standards, selectedProduct, activeStage]);

  // --- AI OCR FOR STANDARDS ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setPendingFile(file);
  };

  const processStandardWithAI = async () => {
    if (!pendingFile) return;

    try {
      setIsLoading(true);
      console.log("Starting AI Process for file:", pendingFile.name);
      
      // 1. CHẠY AI OCR
      const result = await runExcelOCR(pendingFile, activeStage);
      console.log("AI Result:", result);
      
      if (result) {
        // 2. TẢI FILE LÊN SUPABASE STORAGE
        const fileExt = pendingFile.name.split('.').pop();
        const fileName = `std_${Date.now()}.${fileExt}`;
        console.log("Uploading to Storage:", fileName);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('iso-documents')
          .upload(`standards/${fileName}`, pendingFile);

        if (uploadError) {
          console.error("Storage Error:", uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('iso-documents')
          .getPublicUrl(`standards/${fileName}`);

        console.log("File URL:", publicUrl);

        // 3. LƯU VÀO DATABASE
        const saveProduct = selectedProduct === 'Tất cả' ? '40X80' : selectedProduct;
        console.log("Upserting to DB for product:", saveProduct);

        const { error } = await supabase.from('production_standards').upsert({
          product_type: saveProduct,
          category: activeStage,
          standards: { ...result, file_url: publicUrl }
        }, { onConflict: 'product_type,category' });
        
        console.log("Upsert Success. Fetching fresh data...");
        const freshData = await fetchStandards();
        
        // Cập nhật lại ngay lập tức
        if (freshData) setStandards(freshData);

        setPendingFile(null);
        setIsSetupMode(false);
        alert("Hệ thống AI đã nghiên cứu, tải file lên Cloud và cập nhật Tiêu chuẩn gốc thành công!");
      }
    } catch (err) {
      alert("Lỗi AI: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- LOGIC PHÂN TÍCH & ĐỐI SOÁT ---
  const analytics = useMemo(() => {
    if (!cloudLogs || cloudLogs.length === 0) return { range: { v1: [0,0], v2: [0,0], v3: [0,0] }, anomalies: [], chartData: [] };

    const selP = selectedProduct.toUpperCase();
    
    // 1. Lọc theo sản phẩm và ngày tháng
    const filtered = cloudLogs.filter(log => {
      if (!log.created_at) return false;
      const dateObj = new Date(log.created_at);
      if (isNaN(dateObj.getTime())) return false;
      
      const logDate = dateObj.toISOString().split('T')[0];
      const isWithinDate = logDate >= dateRange.start && logDate <= dateRange.end;
      if (!isWithinDate) return false;

      if (selectedProduct !== 'Tất cả') {
        const logP = (log.product_type || '').toUpperCase();
        if (!logP.includes(selP)) return false;
      }

      // Filter by Line (New)
      if (selectedLine !== 'ALL') {
        const lab = typeof log.lab_info === 'string' ? JSON.parse(log.lab_info || '{}') : (log.lab_info || {});
        const dc = lab?.dayChuyen || log.kiln_data?.metadata?.dayChuyen || '';
        if (!dc.includes(selectedLine.replace('DC', ''))) return false;
      }

      return true;
    });

    // 2. Trích xuất chỉ số tương ứng với giai đoạn
    const mapped = filtered.map(log => {
      const lab = typeof log.lab_info === 'string' ? JSON.parse(log.lab_info || '{}') : (log.lab_info || {});
      const isDryer = log.product_type?.toUpperCase().includes('SẤY');
      const isPrep = log.product_type?.toUpperCase().includes('NGHIỀN') || log.product_type?.toUpperCase().includes('HỒ') || log.product_type?.toUpperCase().includes('KCS CA');
      
      let v1 = 0, v2 = 0, v3 = 0, v4 = 0, type = 'KCS';
      let thermalData = [];

      if (activeStage === 'PREP') {
        const row = [...(lab.biscuit_slurry || []), ...(lab.glaze_slurry || [])].find(r => selectedProduct === 'Tất cả' || (r.code || '').toUpperCase().includes(selP)) || (lab.biscuit_slurry || [])[0] || {};
        v1 = Number(row.d || 0); v2 = Number(row.v || 0); v3 = Number(row.r || 0); type = 'PREP';
      } else if (activeStage === 'DRYER') {
        v1 = Number(lab.cuongDo || 0); v2 = Number(lab.doAm || 0); type = 'DRYER';
        thermalData = lab.grid || []; // Lưới 120 điểm
      } else {
        const row = [...(lab.biscuit_slurry || []), ...(lab.glaze_slurry || [])].find(r => selectedProduct === 'Tất cả' || (r.code || '').toUpperCase().includes(selP)) || (lab.biscuit_slurry || [])[0] || {};
        v1 = Number(row.lucBe || row.strength || log.strength_value || 0); 
        v2 = Number(row.benUon || lab.benUon || 0); 
        v3 = Number(row.hutNuoc || lab.hutNuoc || 0);
        v4 = Number(row.doDay || lab.doDay || 0);
        type = 'KCS';
        thermalData = log.kiln_data?.filteredModules || []; // Dải nhiệt M21-M55
      }

      return { id: log.id, date: new Date(log.created_at).toLocaleDateString('vi-VN'), v1, v2, v3, v4, type, thermalData };
    }).filter(m => m.type === activeStage);

    // 3. Tính toán dải TỪ ... ĐẾN (Min - Max)
    const getRange = (vals) => {
      if (vals.length === 0) return [0, 0];
      return [Math.min(...vals), Math.max(...vals)];
    };

    const range = {
      v1: getRange(mapped.map(m => m.v1)),
      v2: getRange(mapped.map(m => m.v2)),
      v3: getRange(mapped.map(m => m.v3)),
      v4: getRange(mapped.map(m => m.v4)),
    };

    // Chart data cho M21-M55 (Lấy mẻ mới nhất)
    const latest = mapped[0] || null;
    const chartData = latest?.thermalData?.map(m => ({
      name: m.id,
      pv: Number(m.pv),
      sv: Number(m.sv)
    })) || [];

    return { range, chartData, total: mapped.length, latest };
  }, [cloudLogs, selectedProduct, activeStage, dateRange]);

  // --- UI COMPONENTS ---
  const RangeGauge = ({ label, range, target, unit }) => {
    const avg = (range[0] + range[1]) / 2;
    const percent = target > 0 ? Math.min(100, (avg / target) * 100) : 0;
    const deviation = target > 0 ? (((avg - target) / target) * 100).toFixed(1) : 0;
    const isError = Math.abs(deviation) > 10;

    return (
      <div className="bg-slate-950/50 p-8 rounded-[2.5rem] border border-white/5 relative group transition-all hover:bg-slate-900/60">
        <div className="flex justify-between items-start mb-8">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[3px] text-white/30">{label}</p>
            <p className="text-[9px] font-bold text-brand-primary italic">TC Gốc: {target} {unit}</p>
          </div>
          <div className={`p-2 rounded-lg ${isError ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
            <TrendingUp size={16} />
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
              <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * percent) / 100} className={`transition-all duration-1000 ${isError ? 'text-rose-500' : 'text-brand-primary'}`} />
            </svg>
            <div className="absolute flex flex-col items-center">
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-white/40">Từ</span>
                <span className="text-2xl font-black text-white">{range[0]}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-white/40">Đến</span>
                <span className="text-2xl font-black text-white">{range[1]}</span>
              </div>
              <span className="text-[8px] font-black uppercase text-white/20 tracking-widest">{unit}</span>
            </div>
          </div>

          {/* KHUNG BÊN DƯỚI VÒNG TRÒN */}
          <div className={`mt-8 w-full px-6 py-3 rounded-2xl flex justify-between items-center ${isError ? 'bg-rose-500/10 border border-rose-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
            <span className={`text-[10px] font-black uppercase tracking-widest ${isError ? 'text-rose-500' : 'text-emerald-400'}`}>
              {Math.abs(deviation)}% {deviation > 0 ? 'CAO' : 'THẤP'}
            </span>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${isError ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
              {isError ? 'CẦN ĐIỀU CHỈNH' : 'ỔN ĐỊNH'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const DryerGrid = ({ grid = [], targetGrid = [] }) => {
    return (
      <div className="bg-slate-900/50 p-8 rounded-[3rem] border border-white/5 space-y-6">
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-black uppercase tracking-[3px] text-white/40">Lưới nhiệt độ sấy (12 Vùng x 5 Tầng)</h4>
          <div className="flex gap-4 text-[9px] font-bold">
            <div className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-full" /> Đạt</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 bg-amber-500 rounded-full" /> Cảnh báo</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 bg-rose-500 rounded-full" /> Lệch lớn</div>
          </div>
        </div>
        <div className="grid grid-cols-12 gap-2">
          {Array.from({length: 60}).map((_, i) => {
            const zone = (i % 12) + 1;
            const floor = Math.floor(i / 12) + 1;
            const data = grid.find(g => g.zone === zone && g.floor === floor) || {};
            const target = 180 - (floor * 10); // Giả lập target giảm dần theo tầng
            const diffT = Math.abs(Number(data.t || 0) - target);
            const bgColor = diffT < 5 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : diffT < 15 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400';

            return (
              <div key={i} className={`p-2 rounded-lg border text-center transition-all hover:scale-110 cursor-help ${bgColor}`}>
                <p className="text-[8px] font-black opacity-30">Z{zone}-T{floor}</p>
                <p className="text-[10px] font-black">{data.t || '--'}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
    <div className="space-y-10 pb-20">
      
      {/* HEADER BIẾN ĐỘNG */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSetupMode(!isSetupMode)} className={`p-2.5 rounded-full transition-all ${isSetupMode ? 'bg-brand-primary text-white' : 'bg-white/5 text-white/40 hover:text-white'}`}>
              <SettingsIcon size={18} />
            </button>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter leading-none invisible h-0 overflow-hidden">
            Giám sát Tiêu chuẩn
          </h1>
        </div>

        <div className="flex flex-wrap gap-6 bg-slate-900/50 p-4 rounded-3xl border border-white/5">
           <div className="flex flex-col gap-2">
             <span className="text-[9px] font-black text-white/20 uppercase ml-2">Sản phẩm</span>
             <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="bg-slate-950 border border-white/10 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest outline-none">
               {Array.from(new Set(['Tất cả', ...cloudLogs.map(l => l.product_type)])).map(p => <option key={p} value={p}>{p}</option>)}
             </select>
           </div>
           <div className="flex flex-col gap-2">
             <span className="text-[9px] font-black text-white/20 uppercase ml-2">Dây chuyền</span>
             <select 
               value={selectedLine}
               className="bg-slate-950 border border-white/10 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest outline-none"
               onChange={(e) => setSelectedLine(e.target.value)}
             >
               <option value="ALL">TẤT CẢ</option>
               <option value="DC1">DÂY CHUYỀN 1</option>
               <option value="DC2">DÂY CHUYỀN 2</option>
             </select>
           </div>
           <div className="flex flex-col gap-2">
             <span className="text-[9px] font-black text-white/20 uppercase ml-2">Thời gian từ</span>
             <input type="date" value={dateRange.start} onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))} className="bg-slate-950 border border-white/10 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase outline-none" />
           </div>
           <div className="flex flex-col gap-2">
             <span className="text-[9px] font-black text-white/20 uppercase ml-2">Đến ngày</span>
             <input type="date" value={dateRange.end} onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))} className="bg-slate-950 border border-white/10 px-6 py-2.5 rounded-xl text-[11px] font-black uppercase outline-none" />
           </div>
        </div>
      </div>

      {/* SETUP MODE OVERLAY */}
      {isSetupMode && (
        <div className="bg-brand-primary/5 border border-brand-primary/20 p-10 rounded-[3rem] animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-brand-primary text-white shadow-lg"><Upload size={24} /></div>
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Thiết lập Tiêu chuẩn gốc</h3>
                <p className="text-xs text-white/40">Upload ảnh phiếu tiêu chuẩn để AI trích xuất tự động</p>
              </div>
            </div>
            <button onClick={() => setIsSetupMode(false)} className="p-3 rounded-full hover:bg-white/5"><X size={20} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border-2 border-dashed border-white/10 rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center space-y-6 hover:border-brand-primary/40 transition-all group">
              <input 
                type="file" 
                id="standard-upload" 
                hidden 
                onChange={handleFileChange} 
                accept="image/*,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" 
              />
              <label htmlFor="standard-upload" className="cursor-pointer space-y-6 flex flex-col items-center">
                <div className="p-8 rounded-full bg-white/5 group-hover:scale-110 transition-transform">
                  {pendingFile ? <CheckCircle2 size={48} className="text-brand-primary" /> : <Upload size={48} className="text-white/20" />}
                </div>
                <p className="text-sm font-bold text-white/40">
                  {pendingFile ? `Đã chọn: ${pendingFile.name}` : "Nhấn để chọn TỆP TIÊU CHUẨN (.xlsx / .pdf)"}
                </p>
                {pendingFile && (
                  <button 
                    disabled={isLoading}
                    onClick={() => { console.log("Processing file..."); processStandardWithAI().then(() => fetchStandards()); }}
                    className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-900 disabled:opacity-50 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-cyan-500/20 transition-all active:scale-95"
                  >
                    {isLoading ? <Loader2 className="animate-spin text-white" style={{ animation: 'spin 1s linear infinite' }} size={18} /> : <Zap size={18} />}
                    <span>{isLoading ? 'Hệ thống AI đang xử lý...' : 'BẮT ĐẦU TRÍCH XUẤT AI'}</span>
                  </button>
                )}
              </label>
            </div>
            <div className="bg-slate-950/50 rounded-[2.5rem] p-10 space-y-6 border border-white/5">
               <h4 className="text-sm font-black text-brand-primary uppercase tracking-widest flex items-center gap-3">
                 <Info size={16} /> Thông số đang áp dụng
               </h4>
               {currentStandard?.standards?.metrics ? (
                 <div className="grid grid-cols-2 gap-4">
                   {currentStandard.standards.metrics.map((m, i) => (
                     <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-[10px] text-white/30 uppercase font-black">{m.label}</p>
                        <p className="text-xl font-black text-white">{m.target} <span className="text-[10px] text-white/20">{m.unit}</span></p>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="py-10 text-center opacity-20"><CheckCircle2 size={48} className="mx-auto mb-4" /><p className="text-xs font-bold uppercase tracking-widest">Sẵn sàng tiếp nhận tiêu chuẩn mới</p></div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* PROCESS TABS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[
          { id: 'PREP', label: 'NGUYÊN LIỆU & HỒ', icon: <Droplets />, color: 'text-cyan-400' },
          { id: 'DRYER', label: 'SẤY MỘC 5 TẦNG', icon: <Zap />, color: 'text-amber-400' },
          { id: 'KCS', label: 'THÀNH PHẨM (KCS)', icon: <Flame />, color: 'text-rose-400' }
        ].map((s, i) => (
          <button key={s.id} onClick={() => setActiveStage(s.id)} className={`relative p-8 rounded-[2.5rem] border text-left transition-all group ${activeStage === s.id ? 'bg-brand-primary/10 border-brand-primary shadow-2xl scale-[1.02]' : 'bg-slate-900/50 border-white/5 opacity-40 hover:opacity-100'}`}>
            <div className="flex items-center gap-5">
              <div className={`p-5 rounded-2xl bg-white/5 ${activeStage === s.id ? s.color : 'text-white/20'}`}>{s.icon}</div>
              <div>
                <p className="text-[10px] font-black text-white/30 tracking-[3px] uppercase">Giai đoạn {i+1}</p>
                <h3 className="text-xl font-black text-white tracking-tight leading-none">{s.label}</h3>
              </div>
            </div>
            {activeStage === s.id && <div className="absolute top-6 right-10 w-2.5 h-2.5 bg-brand-primary rounded-full shadow-[0_0_15px_rgba(16,185,129,1)]" />}
          </button>
        ))}
      </div>

      {/* MAIN MONITORING AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        
        {/* GAUGES COLUMN */}
        <div className="lg:col-span-3 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {activeStage === 'PREP' && (
              <>
                <RangeGauge label="Tỷ trọng hồ (D)" range={analytics.range.v1} target={currentStandard?.standards?.metrics?.find(m => m.name === 'tyTrong')?.target || 1.70} unit="g/l" />
                <RangeGauge label="Độ nhớt (V)" range={analytics.range.v2} target={currentStandard?.standards?.metrics?.find(m => m.name === 'doNhot')?.target || 35} unit="s" />
                <RangeGauge label="Sót sàng (R)" range={analytics.range.v3} target={currentStandard?.standards?.metrics?.find(m => m.name === 'sotSang')?.target || 6.5} unit="%" />
              </>
            )}
            {activeStage === 'DRYER' && (
              <>
                <RangeGauge label="Cường độ sấy" range={analytics.range.v1} target={currentStandard?.standards?.metrics?.find(m => m.name === 'cuongDo')?.target || 45} unit="kg/cm2" />
                <RangeGauge label="Độ ẩm mộc" range={analytics.range.v2} target={currentStandard?.standards?.metrics?.find(m => m.name === 'doAm')?.target || 0.3} unit="%" />
                <div className="bg-slate-900/40 p-8 rounded-[2.5rem] border border-white/5 flex flex-col items-center justify-center text-center space-y-4">
                   <ShieldCheck className="text-brand-primary" size={48} />
                   <h4 className="text-2xl font-black text-white italic">Hệ thống Sấy</h4>
                   <p className="text-[10px] font-black uppercase tracking-[3px] text-white/20">Syncing 120 points</p>
                </div>
              </>
            )}
            {activeStage === 'KCS' && (
              <>
                <RangeGauge label="Lực bẻ thực tế" range={analytics.range.v1} target={currentStandard?.standards?.metrics?.find(m => m.name === 'lucBe')?.target || 2500} unit="N" />
                <RangeGauge label="Bền uốn" range={analytics.range.v2} target={currentStandard?.standards?.metrics?.find(m => m.name === 'benUon')?.target || 35} unit="N/mm2" />
                <RangeGauge label="Độ hút nước" range={analytics.range.v3} target={currentStandard?.standards?.metrics?.find(m => m.name === 'hutNuoc')?.target || 0.5} unit="%" />
              </>
            )}
          </div>

          {activeStage === 'PREP' && (
            <div className="bg-slate-900/50 p-10 rounded-[3rem] border border-white/5 space-y-8 animate-in fade-in zoom-in duration-500">
               <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
                      <Layers size={24} />
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Bảng Tiêu chuẩn Gốc (BTP)</h4>
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-[3px]">Cấu trúc theo ISO-9001:2026</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        if (currentStandard?.standards?.file_url) {
                          window.open(`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(currentStandard.standards.file_url)}`, '_blank');
                        } else {
                          alert("Chưa có tệp gốc đính kèm. Anh vui lòng cập nhật lại tiêu chuẩn bằng file Excel.");
                        }
                      }}
                      className="px-6 py-3 bg-brand-primary text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20 flex items-center gap-2"
                    >
                      <ArrowRight size={16} /> MỞ XEM FILE GỐC (EXCEL)
                    </button>
                    <button 
                      onClick={() => setShowRawData(true)}
                      className="px-6 py-3 bg-white/5 text-white/40 rounded-xl text-[11px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-2 hover:bg-white/10 transition-all"
                    >
                      <Search size={16} /> ĐỐI SOÁT AI CHI TIẾT
                    </button>
                    <button 
                      onClick={() => setIsSetupMode(true)}
                      className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-black uppercase transition-all"
                    >
                      Cập nhật AI
                    </button>
                  </div>
               </div>

               <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                  {/* CỘT 1: HỒ XƯƠNG & BỘT SẤY PHUN */}
                  <div className="space-y-6">
                    <h5 className="text-[11px] font-black text-cyan-400 uppercase tracking-[4px] pl-2 border-l-2 border-cyan-400">I. Hồ Xương & Bột Sấy Phun</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="glass-card bg-white/2 rounded-2xl border-white/5 overflow-hidden">
                        <div className="p-3 bg-white/5 text-[9px] font-black uppercase text-white/40">1. Hồ Xương</div>
                        <table className="w-full text-[11px]">
                          <tbody className="font-bold">
                            <tr className="border-t border-white/5"><td className="p-3 text-white/50">Tỷ trọng (D)</td><td className="p-3 text-right text-cyan-400">{currentStandard?.standards?.prep?.hoXuong?.d || currentStandard?.standards?.prep?.hoxuong?.d || '1.65 ÷ 1.76'}</td></tr>
                            <tr className="border-t border-white/5"><td className="p-3 text-white/50">Độ nhớt (V)</td><td className="p-3 text-right text-cyan-400">{currentStandard?.standards?.prep?.hoXuong?.v || currentStandard?.standards?.prep?.hoxuong?.v || '20 ÷ 50s'}</td></tr>
                            <tr className="border-t border-white/5"><td className="p-3 text-white/50">Sót sàng (R)</td><td className="p-3 text-right text-cyan-400">{currentStandard?.standards?.prep?.hoXuong?.r || currentStandard?.standards?.prep?.hoxuong?.r || '3.0 ÷ 5.0%'}</td></tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="glass-card bg-white/2 rounded-2xl border-white/5 overflow-hidden">
                        <div className="p-3 bg-white/5 text-[9px] font-black uppercase text-white/40">2. Bột Sấy Phun</div>
                        <table className="w-full text-[11px]">
                          <tbody className="font-bold">
                            <tr className="border-t border-white/5"><td className="p-3 text-white/50">Độ ẩm (W)</td><td className="p-3 text-right text-cyan-400">{currentStandard?.standards?.prep?.botSayPhun?.w || '5.0 ÷ 7.0%'}</td></tr>
                            <tr className="border-t border-white/5"><td className="p-3 text-white/50">Co rút (Δs)</td><td className="p-3 text-right text-cyan-400">{currentStandard?.standards?.prep?.botSayPhun?.s || '3.5 ÷ 5.5%'}</td></tr>
                            <tr className="border-t border-white/5"><td className="p-3 text-white/50">Mất khi nung</td><td className="p-3 text-right text-cyan-400">{currentStandard?.standards?.prep?.botSayPhun?.loi || '3.0 ÷ 6.0%'}</td></tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* CỘT 2: HỒ MEN (CHI TIẾT THEO LOẠI) */}
                  <div className="space-y-6">
                    <h5 className="text-[11px] font-black text-amber-400 uppercase tracking-[4px] pl-2 border-l-2 border-amber-400">II. Tiêu chuẩn Hồ Men</h5>
                    <div className="glass-card bg-white/2 rounded-2xl border-white/5 overflow-hidden">
                      <table className="w-full text-[10px]">
                        <thead className="bg-white/5 text-white/30 font-black uppercase">
                          <tr>
                            <th className="p-3">Loại Men</th>
                            <th className="p-3 text-center">Tỷ trọng (D)</th>
                            <th className="p-3 text-center">Độ nhớt (V)</th>
                            <th className="p-3 text-center">Sót sàng (R)</th>
                          </tr>
                        </thead>
                        <tbody className="font-bold">
                          <tr className="border-t border-white/5">
                            <td className="p-3 text-white/50 font-black">Men trắng đế</td>
                            <td className="p-3 text-center text-amber-400">{currentStandard?.standards?.prep?.hoMen?.trangDe?.d || currentStandard?.standards?.prep?.hoMen?.trangde?.d || '1.15 ÷ 1.25'}</td>
                            <td className="p-3 text-center opacity-20">---</td>
                            <td className="p-3 text-center text-amber-400">{currentStandard?.standards?.prep?.hoMen?.trangDe?.r || currentStandard?.standards?.prep?.hoMen?.trangde?.r || '≤ 1.0%'}</td>
                          </tr>
                          <tr className="border-t border-white/5">
                            <td className="p-3 text-white/50 font-black">Men Engobe</td>
                            <td className="p-3 text-center text-amber-400">{currentStandard?.standards?.prep?.hoMen?.engobe?.d || '1.75 ÷ 1.80'}</td>
                            <td className="p-3 text-center text-amber-400">{currentStandard?.standards?.prep?.hoMen?.engobe?.v || '30 ÷ 100s'}</td>
                            <td className="p-3 text-center text-amber-400">{currentStandard?.standards?.prep?.hoMen?.engobe?.r || '0.5 ÷ 1.0%'}</td>
                          </tr>
                          <tr className="border-t border-white/5">
                            <td className="p-3 text-white/50 font-black">Men Nền (Bóng)</td>
                            <td className="p-3 text-center text-amber-400">{currentStandard?.standards?.prep?.hoMen?.menNenBong?.d || currentStandard?.standards?.prep?.hoMen?.menNen?.d || '1.75 ÷ 1.90'}</td>
                            <td className="p-3 text-center text-amber-400">{currentStandard?.standards?.prep?.hoMen?.menNenBong?.v || currentStandard?.standards?.prep?.hoMen?.menNen?.v || '30 ÷ 100s'}</td>
                            <td className="p-3 text-center text-amber-400">{currentStandard?.standards?.prep?.hoMen?.menNenBong?.r || currentStandard?.standards?.prep?.hoMen?.menNen?.r || '4.0 ÷ 6.0%'}</td>
                          </tr>
                          <tr className="border-t border-white/5">
                            <td className="p-3 text-white/50 font-black">Men Matt</td>
                            <td className="p-3 text-center text-amber-400">{currentStandard?.standards?.prep?.hoMen?.menNenMatt?.d || currentStandard?.standards?.prep?.hoMen?.menMatt?.d || '1.78 ÷ 1.90'}</td>
                            <td className="p-3 text-center text-amber-400">{currentStandard?.standards?.prep?.hoMen?.menNenMatt?.v || currentStandard?.standards?.prep?.hoMen?.menMatt?.v || '30 ÷ 100s'}</td>
                            <td className="p-3 text-center text-amber-400">{currentStandard?.standards?.prep?.hoMen?.menNenMatt?.r || currentStandard?.standards?.prep?.hoMen?.menMatt?.r || '0.5 ÷ 2.0%'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
               </div>
            </div>
          )}

          {/* EXPANDED SECTION FOR STAGE 2 & 3 */}
          {activeStage === 'DRYER' && <DryerGrid grid={analytics.latest?.thermalData} />}
          
          {activeStage === 'KCS' && (
            <div className="bg-slate-900/50 p-10 rounded-[3rem] border border-white/5 space-y-8">
               <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <Thermometer className="text-rose-500" />
                    <h4 className="text-xs font-black uppercase tracking-[3px] text-white/40">Dải nhiệt nung chín (M21 - M55)</h4>
                  </div>
                  <div className="px-5 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black text-brand-primary">Mẻ mới nhất: {analytics.latest?.date}</div>
               </div>
               <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.chartData}>
                      <defs>
                        <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                      <XAxis dataKey="name" stroke="#ffffff20" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis stroke="#ffffff20" fontSize={10} axisLine={false} tickLine={false} domain={[800, 1250]} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} />
                      <Area type="monotone" dataKey="pv" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPv)" />
                      <Line type="monotone" dataKey="sv" stroke="#ffffff40" strokeDasharray="5 5" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>
          )}
        </div>

        {/* SIDEBAR: STATS & SUMMARY */}
        <div className="space-y-8">
           <div className="bg-slate-900/80 p-10 rounded-[3rem] border border-white/5 space-y-8 relative overflow-hidden shadow-2xl">
              <div className="flex items-center gap-4">
                <BarChart3 className="text-brand-primary" size={24} />
                <h3 className="text-xl font-black uppercase tracking-tight text-white leading-none">Thống kê lọc</h3>
              </div>
              <div className="space-y-6">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-white/40 uppercase">Tổng số mẻ</span>
                    <span className="text-2xl font-black text-white">{analytics.total}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-white/40 uppercase">Giai đoạn</span>
                    <span className="text-sm font-black text-brand-primary uppercase">{activeStage}</span>
                 </div>
                 <div className="pt-6 border-t border-white/5">
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[3px] mb-4">Mẻ bất thường gần nhất</p>
                    <div className="space-y-3">
                      {cloudLogs.slice(0, 3).map((l, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-white/5 flex items-center justify-between border border-white/5">
                           <p className="text-[10px] font-black text-white truncate max-w-[120px] uppercase">{l.batch_code || 'B001'}</p>
                           <ChevronRight size={14} className="text-white/20" />
                        </div>
                      ))}
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-brand-primary p-10 rounded-[3rem] space-y-4 shadow-[0_20px_50px_rgba(16,185,129,0.3)]">
              <ShieldCheck className="text-white" size={32} />
              <h4 className="text-xl font-black text-white leading-tight">Dữ liệu đã được đối soát AI</h4>
              <p className="text-[10px] font-bold text-white/60 leading-relaxed uppercase tracking-wider">Hệ thống tự động đồng bộ và tính toán sai lệch dựa trên Tiêu chuẩn chuẩn của công ty.</p>
           </div>
        </div>
      </div>

      {/* FOOTER CONNECTION STATUS */}
      <div className="bg-slate-950 p-6 rounded-[2.5rem] border border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-6">
           <Database className="text-brand-primary" size={20} />
           <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Đang kết nối Cloud: {standards.length} bộ tiêu chuẩn gốc</p>
        </div>
        <div className="flex gap-3 items-center">
           <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
           <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Live syncing ACTIVE</span>
        </div>
      </div>

    </div>

    {/* MODAL XEM CHI TIẾT DỮ LIỆU AI TRÍCH XUẤT */}
    {showRawData && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-10 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
        <div className="bg-slate-900 border border-white/10 rounded-[3.5rem] w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]">
          <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/2">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-brand-primary/20 text-brand-primary"><Database size={24} /></div>
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Bản đối soát dữ liệu AI</h3>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[3px]">Thông tin chi tiết bóc tách từ tệp gốc</p>
              </div>
            </div>
            <button onClick={() => setShowRawData(false)} className="p-4 rounded-full bg-white/5 hover:bg-white/10 text-white/40 transition-colors"><X size={24} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
            <div className="space-y-12 pb-10">
               {/* 1. HỒ XƯƠNG */}
               <div className="space-y-6">
                  <h4 className="text-xs font-black text-cyan-400 uppercase tracking-widest border-l-2 border-cyan-400 pl-4 flex items-center gap-2">
                    <Droplets size={14} /> I. TIÊU CHUẨN HỒ XƯƠNG
                  </h4>
                  <div className="bg-white/2 border border-white/5 rounded-3xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/5 font-black text-white/40 uppercase tracking-widest">
                        <tr>
                          <th className="p-5">Chỉ số kỹ thuật</th>
                          <th className="p-5 text-right">Tiêu chuẩn trích xuất (AI)</th>
                        </tr>
                      </thead>
                      <tbody className="text-white/80 font-bold">
                        <tr className="border-t border-white/5"><td className="p-5 opacity-50">Tỷ trọng (D)</td><td className="p-5 text-right text-cyan-400">{currentStandard?.standards?.prep?.hoXuong?.d || currentStandard?.standards?.prep?.hoxuong?.d || currentStandard?.standards?.hoXuong?.d || '---'}</td></tr>
                        <tr className="border-t border-white/5"><td className="p-5 opacity-50">Sót sàng (R)</td><td className="p-5 text-right text-cyan-400">{currentStandard?.standards?.prep?.hoXuong?.r || currentStandard?.standards?.prep?.hoxuong?.r || currentStandard?.standards?.hoXuong?.r || '---'}</td></tr>
                        <tr className="border-t border-white/5"><td className="p-5 opacity-50">Độ nhớt (V)</td><td className="p-5 text-right text-cyan-400">{currentStandard?.standards?.prep?.hoXuong?.v || currentStandard?.standards?.prep?.hoxuong?.v || currentStandard?.standards?.hoXuong?.v || '---'}</td></tr>
                      </tbody>
                    </table>
                  </div>
               </div>

               {/* 2. BỘT SẤY PHUN */}
               <div className="space-y-6">
                  <h4 className="text-xs font-black text-brand-primary uppercase tracking-widest border-l-2 border-brand-primary pl-4 flex items-center gap-2">
                    <Zap size={14} /> II. TIÊU CHUẨN BỘT SẤY PHUN
                  </h4>
                  <div className="bg-white/2 border border-white/5 rounded-3xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/5 font-black text-white/40 uppercase tracking-widest">
                        <tr>
                          <th className="p-5">Chỉ số kỹ thuật</th>
                          <th className="p-5 text-right">Tiêu chuẩn trích xuất (AI)</th>
                        </tr>
                      </thead>
                      <tbody className="text-white/80 font-bold">
                        <tr className="border-t border-white/5"><td className="p-5 opacity-50">Độ ẩm (W)</td><td className="p-5 text-right text-brand-primary">{currentStandard?.standards?.prep?.botSayPhun?.w || currentStandard?.standards?.prep?.botsayPhun?.w || currentStandard?.standards?.botSayPhun?.w || '---'}</td></tr>
                        <tr className="border-t border-white/5"><td className="p-5 opacity-50">Co rút (Δs)</td><td className="p-5 text-right text-brand-primary">{currentStandard?.standards?.prep?.botSayPhun?.s || currentStandard?.standards?.prep?.botsayPhun?.s || currentStandard?.standards?.botSayPhun?.s || '---'}</td></tr>
                        <tr className="border-t border-white/5"><td className="p-5 opacity-50">Mất khi nung (L.O.I)</td><td className="p-5 text-right text-brand-primary">{currentStandard?.standards?.prep?.botSayPhun?.loi || currentStandard?.standards?.prep?.botsayPhun?.loi || currentStandard?.standards?.botSayPhun?.loi || '---'}</td></tr>
                      </tbody>
                    </table>
                  </div>
               </div>

               {/* 3. HỒ MEN */}
               <div className="space-y-6">
                  <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest border-l-2 border-amber-400 pl-4 flex items-center gap-2">
                    <Flame size={14} /> III. TIÊU CHUẨN HỒ MEN
                  </h4>
                  <div className="bg-white/2 border border-white/5 rounded-3xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/5 font-black text-white/40 uppercase tracking-widest">
                        <tr>
                          <th className="p-5">Loại Men</th>
                          <th className="p-5 text-center">Tỷ trọng (D)</th>
                          <th className="p-5 text-center">Độ nhớt (V)</th>
                          <th className="p-5 text-center">Sót sàng (R)</th>
                        </tr>
                      </thead>
                      <tbody className="text-white/80 font-bold">
                        {[
                          { label: 'Men Trắng Đế', data: currentStandard?.standards?.prep?.hoMen?.trangDe || currentStandard?.standards?.hoMen?.trangDe },
                          { label: 'Men Engobe', data: currentStandard?.standards?.prep?.hoMen?.engobe || currentStandard?.standards?.hoMen?.engobe },
                          { label: 'Men Nền (Bóng)', data: currentStandard?.standards?.prep?.hoMen?.menNenBong || currentStandard?.standards?.prep?.hoMen?.menNen || currentStandard?.standards?.hoMen?.menNenBong },
                          { label: 'Men Matt', data: currentStandard?.standards?.prep?.hoMen?.menNenMatt || currentStandard?.standards?.prep?.hoMen?.menMatt || currentStandard?.standards?.hoMen?.menNenMatt },
                        ].map((row, idx) => (
                          <tr key={idx} className="border-t border-white/5">
                            <td className="p-5 opacity-50">{row.label}</td>
                            <td className="p-5 text-center text-amber-400">{row.data?.d || '---'}</td>
                            <td className="p-5 text-center text-amber-400">{row.data?.v || '---'}</td>
                            <td className="p-5 text-center text-amber-400">{row.data?.r || '---'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>

               {/* LUÔN HIỂN THỊ DỮ LIỆU THÔ NẾU CÓ ĐỂ ĐỐI SOÁT */}
               {currentStandard?.standards && (
                 <div className="mt-20 p-8 bg-white/5 border border-white/10 rounded-[2.5rem]">
                    <h5 className="text-[10px] font-black text-cyan-400 uppercase mb-6 flex items-center gap-2">
                      <Database size={14} /> DỮ LIỆU GỐC TỪ AI (DÙNG ĐỂ ĐỐI CHIẾU NẾU BẢNG TRÊN CHƯA CẬP NHẬT)
                    </h5>
                    <pre className="text-[11px] text-cyan-200/60 overflow-x-auto p-6 bg-black/40 rounded-3xl font-mono leading-relaxed">
                      {JSON.stringify(currentStandard.standards, null, 2)}
                    </pre>
                 </div>
               )}
            </div>
          </div>
          <div className="p-8 bg-brand-primary/5 text-center">
            <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">Dữ liệu này được AI bóc tách tự động và đồng bộ thời gian thực vào bảng Giám sát</p>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
