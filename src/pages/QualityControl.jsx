import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gauge, Droplets, Save, RefreshCw, ClipboardList, 
  Upload, Image as ImageIcon, CheckCircle2, Loader2,
  Zap, Beaker, Plus, Trash2, MousePointerSquareDashed,
  Database, Clock, Box, History, LayoutGrid, FileText
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { runQualityOCR } from '../lib/gemini';

const QualityControl = ({ onSaveSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const fileInputRef = useRef(null);

  const now = new Date();
  const defaultDate = now.toISOString().split('T')[0];
  const defaultTime = now.toTimeString().split(' ')[0].substring(0, 5);

  const [biscuitSlurryRows, setBiscuitSlurryRows] = useState([]);
  const [glazeSlurryRows, setGlazeSlurryRows] = useState([]);
  const [sprayPowderRows, setSprayPowderRows] = useState([]);
  const [pressingPowderRows, setPressingPowderRows] = useState([]);

  const [reportInfo, setReportInfo] = useState({
    date: defaultDate,
    time: defaultTime,
    shift: 'Ca Ngày',
    line: '2'
  });

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        processFile(file);
      }
    }
  };

  const handleCreateNew = () => {
    if (window.confirm("Anh có chắc muốn tạo mẻ mới không? Dữ liệu hiện tại trên màn hình sẽ bị xóa.")) {
      setBiscuitSlurryRows([]);
      setGlazeSlurryRows([]);
      setSprayPowderRows([]);
      setPressingPowderRows([]);
      const currentNow = new Date();
      setReportInfo({
        date: currentNow.toISOString().split('T')[0],
        time: currentNow.toTimeString().split(' ')[0].substring(0, 5),
        shift: 'Ca Ngày',
        line: '2'
      });
    }
  };

  const processFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    try {
      setOcrLoading(true);
      const data = await runQualityOCR(file); 
      // Đồng bộ thời gian máy tính ngay khi nạp ảnh
      const now = new Date();
      const currentGio = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const currentNgay = now.toLocaleDateString('en-CA');

      setReportInfo(prev => ({
        ...prev,
        time: currentGio,
        date: currentNgay
      }));

      if (data.biscuit_slurry) setBiscuitSlurryRows(data.biscuit_slurry);
      if (data.glaze_slurry) setGlazeSlurryRows(data.glaze_slurry);
      if (data.spray_powder) setSprayPowderRows(data.spray_powder);
      if (data.pressing_powder) setPressingPowderRows(data.pressing_powder);
    } catch (err) {
      if (err.message.includes("503") || err.message.includes("high demand")) {
        alert("⚠️ Máy chủ AI đang bận (Lỗi 503). Anh vui lòng đợi khoảng 10-20 giây rồi dán lại ảnh nhé!");
      } else {
        alert("Lỗi AI: " + err.message);
      }
    } finally {
      setOcrLoading(false);
    }
  };

  const saveToDatabase = async () => {
    try {
      setLoading(true);
      const reportTimestamp = new Date(`${reportInfo.date}T${reportInfo.time}:00`);
      
      const { error } = await supabase
        .from('kiln_dryer_reports')
        .insert([{
          product_type: 'Báo cáo KCS Ca',
          kiln_type: 'Nhật ký QC Ca',
          batch_code: `Ca ${reportInfo.shift} - ${reportInfo.date}`,
          lab_info: JSON.stringify({
            biscuit_slurry: biscuitSlurryRows,
            glaze_slurry: glazeSlurryRows,
            spray_powder: sprayPowderRows,
            pressing_powder: pressingPowderRows,
            report_meta: reportInfo
          }),
          created_at: reportTimestamp
        }]);
      if (error) throw error;
      if (onSaveSuccess) onSaveSuccess();
      alert("✅ Đã lưu báo cáo ca thành công! Dữ liệu vẫn được giữ trên màn hình để anh kiểm tra.");
    } catch (err) {
      alert("Lỗi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const SectionHeader = ({ title, icon: Icon, colorClass }) => (
    <div className={`flex items-center gap-2 p-2 px-4 ${colorClass} border-b border-white/5`}>
      <Icon size={12} />
      <h3 className="font-bold uppercase text-[9px] tracking-[0.15em]">{title}</h3>
    </div>
  );

  const colWidths = {
    time: "w-[80px]",
    code: "w-[120px]",
    machine: "w-[90px]",
    silo: "w-[110px]",
    param: "w-[70px]",
    result: "w-[100px]",
    notes: "w-[180px]"
  };

  return (
    <div className="p-8 max-w-full mx-auto space-y-12 text-slate-200">
      {/* Header Section Clean & Elegant */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 px-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-primary/10 rounded-2xl border border-brand-primary/20 shadow-lg shadow-brand-primary/10">
            <FileText className="text-brand-primary" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-tight leading-none mb-1">
              Báo cáo KCS Ca trực
            </h1>
            <p className="text-brand-primary text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Shift Diary System</p>
          </div>
        </div>

        <div className="flex gap-4 items-center bg-slate-900/40 backdrop-blur-md p-4 rounded-3xl border border-white/5 shadow-2xl">
           <div className="flex gap-4">
             <div className="flex flex-col gap-1">
               <label className="text-[8px] font-black uppercase text-slate-600 tracking-widest px-1">Ngày làm việc</label>
               <input type="date" value={reportInfo.date} onChange={(e) => setReportInfo({...reportInfo, date: e.target.value})} className="bg-slate-950 border border-white/5 rounded-xl px-4 py-2 text-[11px] font-bold outline-none focus:border-brand-primary transition-all" />
             </div>
             <div className="flex flex-col gap-1">
               <label className="text-[8px] font-black uppercase text-slate-600 tracking-widest px-1">Giờ báo cáo</label>
               <input type="time" value={reportInfo.time} onChange={(e) => setReportInfo({...reportInfo, time: e.target.value})} className="bg-slate-950 border border-white/5 rounded-xl px-4 py-2 text-[11px] font-bold outline-none focus:border-brand-primary transition-all" />
             </div>
             <div className="flex flex-col gap-1">
               <label className="text-[8px] font-black uppercase text-slate-600 tracking-widest px-1">Ca trực</label>
               <select value={reportInfo.shift} onChange={(e) => setReportInfo({...reportInfo, shift: e.target.value})} className="bg-slate-950 border border-white/5 rounded-xl px-4 py-2 text-[11px] font-bold outline-none focus:border-brand-primary min-w-[110px]">
                 <option>Ca Ngày</option>
                 <option>Ca Đêm</option>
               </select>
             </div>
           </div>
           <div className="w-px h-10 bg-white/5" />
           <div className="flex gap-2">
             <button 
               onClick={handleCreateNew}
               className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest transition-all text-[10px] flex items-center gap-2 border border-white/10"
             >
               <Plus size={14} />
               Tạo mẻ mới
             </button>
             <button 
               onClick={saveToDatabase}
               disabled={loading || (biscuitSlurryRows.length === 0 && glazeSlurryRows.length === 0)}
               className="px-8 py-3 bg-brand-primary hover:bg-brand-primary/80 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-brand-primary/20 active:scale-95 text-[10px] flex items-center gap-2"
             >
               {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
               Lưu báo cáo
             </button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 px-4">
        {/* SIDEBAR UPLOAD CLEAN */}
        <div className="xl:col-span-2">
           <div className="bg-slate-900/30 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 shadow-xl sticky top-8 text-center space-y-4">
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Nạp dữ liệu</p>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`aspect-square border border-dashed rounded-[1.5rem] flex flex-col items-center justify-center transition-all cursor-pointer bg-slate-950/20 hover:border-brand-primary/50 border-slate-700 p-2`}
              >
                {ocrLoading ? (
                  <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
                ) : (
                  <div className="space-y-1">
                    <MousePointerSquareDashed size={24} className="mx-auto text-slate-600 opacity-50" />
                    <p className="text-slate-600 font-black uppercase text-[8px] tracking-widest">
                      Ctrl + V
                    </p>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => processFile(e.target.files[0])} />
              <div className="pt-4 border-t border-white/5">
                <p className="text-[9px] text-slate-500 italic leading-relaxed">
                  Trích xuất 4 phần<br/>trong 1 ca làm việc
                </p>
              </div>
           </div>
        </div>

        {/* TABLES SECTION WITH INCREASED SPACING */}
        <div className="xl:col-span-10 space-y-12 pb-20">
          
          {/* KHỐI I: HỒ NGHIỀN XƯƠNG */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            <SectionHeader title="I. Kiểm soát Hồ Nghiền Xương" icon={Droplets} colorClass="bg-blue-500/10 text-blue-400" />
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-[11px] text-left table-fixed border-collapse">
                <thead>
                  <tr className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] bg-white/5 border-b border-white/5">
                    <th className={`${colWidths.code} px-6 py-3`}>Mã bài</th>
                    <th className={colWidths.machine}>Mẻ/Máy</th>
                    <th className={colWidths.time}>Thời gian</th>
                    <th className="text-right px-2">D (g/l)</th>
                    <th className="text-right px-2">V (s)</th>
                    <th className="text-right px-2">R (%)</th>
                    <th className={`${colWidths.result} text-center`}>Kết quả</th>
                    <th className={colWidths.notes}>Ghi chú xả hầm</th>
                  </tr>
                </thead>
                <tbody>
                  {biscuitSlurryRows.length > 0 ? biscuitSlurryRows.map((row, idx) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-all">
                      <td className="px-6 py-2 font-black text-blue-400 uppercase truncate">{row.code}</td>
                      <td className="font-bold text-slate-400">{row.batch_no} / {row.machine_no}</td>
                      <td className="font-black text-slate-200">{row.time}</td>
                      <td className="text-right px-2 font-mono font-black text-emerald-400">{row.d}</td>
                      <td className="text-right px-2 font-mono font-black text-blue-400">{row.v}</td>
                      <td className="text-right px-2 font-mono font-black text-amber-400">{row.r}</td>
                      <td className="text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase ${row.result === 'Đạt' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                          {row.result || 'Đạt'}
                        </span>
                      </td>
                      <td className="italic text-slate-500 px-2 text-[10px] truncate">{row.notes}</td>
                    </tr>
                  )) : <tr className="opacity-10"><td colSpan="8" className="py-4 px-6 italic">Đang chờ dữ liệu...</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* KHỐI II: HỒ NGHIỀN MEN */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            <SectionHeader title="II. Kiểm soát Hồ Nghiền Men" icon={Beaker} colorClass="bg-amber-500/10 text-amber-400" />
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-[11px] text-left table-fixed border-collapse">
                <thead>
                  <tr className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] bg-white/5 border-b border-white/5">
                    <th className={`${colWidths.code} px-6 py-3`}>Mã bài men</th>
                    <th className={colWidths.machine}>Máy</th>
                    <th className={colWidths.time}>Thời gian</th>
                    <th className="text-right px-2">D (g/l)</th>
                    <th className="text-right px-2">V (s)</th>
                    <th className="text-right px-2">R (%)</th>
                    <th className="px-6">Kết quả/Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {glazeSlurryRows.length > 0 ? glazeSlurryRows.map((row, idx) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-all">
                      <td className="px-6 py-2 font-black text-amber-400 uppercase truncate">{row.code}</td>
                      <td className="font-bold text-slate-400">{row.machine_no}</td>
                      <td className="font-black text-slate-200">{row.time}</td>
                      <td className="text-right px-2 font-mono font-black text-emerald-400">{row.d}</td>
                      <td className="text-right px-2 font-mono font-black text-blue-400">{row.v}</td>
                      <td className="text-right px-2 font-mono font-black text-amber-400">{row.r}</td>
                      <td className="italic text-slate-500 px-6 text-[10px] truncate">{row.notes}</td>
                    </tr>
                  )) : <tr className="opacity-10"><td colSpan="7" className="py-4 px-6 italic">Đang chờ dữ liệu...</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* KHỐI III: BỘT SẤY PHUN */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            <SectionHeader title="III. Kiểm soát Bột Sấy Phun" icon={Zap} colorClass="bg-emerald-500/10 text-emerald-400" />
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-[11px] text-left table-fixed border-collapse text-center">
                <thead>
                  <tr className="text-[8px] font-black text-slate-500 uppercase bg-white/5 border-b border-white/5">
                    <th className={`${colWidths.time} px-6 py-3 text-left`}>Giờ</th>
                    <th className={`${colWidths.code} text-left`}>MSBX/Hầm</th>
                    <th className={`${colWidths.silo} text-left`}>Silo</th>
                    <th className="w-[80px] bg-emerald-500/5 font-black text-emerald-500">W (%)</th>
                    <th className="border-l border-white/10 bg-blue-500/5 text-blue-400 font-black">{">"} 0.6</th>
                    <th className="bg-blue-500/5 text-blue-400 font-black">{">"} 0.45</th>
                    <th className="bg-blue-500/5 text-blue-400 font-black">0.125-0.6</th>
                    <th className="bg-blue-500/5 text-blue-400 font-black">{"<"} 0.125</th>
                  </tr>
                </thead>
                <tbody>
                  {sprayPowderRows.length > 0 ? sprayPowderRows.map((row, idx) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-all">
                      <td className="px-6 py-2 font-black text-slate-200 text-left">{row.time}</td>
                      <td className="text-left font-bold text-slate-400 truncate">{row.hầm}</td>
                      <td className="text-left font-black text-emerald-400 truncate">{row.silo}</td>
                      <td className="font-black text-emerald-400 bg-emerald-500/5">{row.moisture}</td>
                      <td className="font-mono font-bold text-slate-300 bg-blue-500/5 border-l border-white/10">{row.grain_06}</td>
                      <td className="font-mono font-bold text-slate-300 bg-blue-500/5">{row.grain_045}</td>
                      <td className="font-mono font-bold text-slate-300 bg-blue-500/5">{row.grain_0125_045}</td>
                      <td className="font-mono font-bold text-slate-300 bg-blue-500/5">{row.grain_under_0125}</td>
                    </tr>
                  )) : <tr className="opacity-10"><td colSpan="8" className="py-4 px-6 italic text-left">Đang chờ dữ liệu...</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* KHỐI IV: BỘT CẤP ÉP */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            <SectionHeader title="IV. Kiểm soát Bột Cấp Ép" icon={Box} colorClass="bg-purple-500/10 text-purple-400" />
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-[11px] text-left table-fixed border-collapse text-center">
                <thead>
                  <tr className="text-[8px] font-black text-slate-500 uppercase bg-white/5 border-b border-white/5">
                    <th className={`${colWidths.time} px-6 py-3 text-left`}>Giờ</th>
                    <th className={`${colWidths.code} text-left`}>Mã bài</th>
                    <th className={`${colWidths.silo} text-left`}>Silo cấp</th>
                    <th className="w-[80px] bg-purple-500/5 font-black text-purple-400">W (%)</th>
                    <th className="border-l border-white/10 bg-blue-500/5 text-blue-400 font-black">{">"} 0.6</th>
                    <th className="text-center bg-blue-500/5 text-blue-400 font-black">{">"} 0.45</th>
                    <th className="text-center bg-blue-500/5 text-blue-400 font-black">0.125-0.6</th>
                    <th className="text-center bg-blue-500/5 text-blue-400 font-black">{"<"} 0.125</th>
                  </tr>
                </thead>
                <tbody>
                  {pressingPowderRows.length > 0 ? pressingPowderRows.map((row, idx) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-all">
                      <td className="px-6 py-2 font-black text-slate-200 text-left">{row.time}</td>
                      <td className="text-left font-bold text-slate-400 truncate">{row.code}</td>
                      <td className="text-left font-black text-purple-400 truncate">{row.silo}</td>
                      <td className="font-black text-purple-400 bg-purple-500/5">{row.moisture}</td>
                      <td className="font-mono font-bold text-slate-300 bg-blue-500/5 border-l border-white/10">{row.grain_06}</td>
                      <td className="font-mono font-bold text-slate-300 bg-blue-500/5">{row.grain_045}</td>
                      <td className="font-mono font-bold text-slate-300 bg-blue-500/5">{row.grain_0125_045}</td>
                      <td className="font-mono font-bold text-slate-300 bg-blue-500/5">{row.grain_under_0125}</td>
                    </tr>
                  )) : <tr className="opacity-10"><td colSpan="8" className="py-4 px-6 italic text-left">Đang chờ dữ liệu...</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default QualityControl;
