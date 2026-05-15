import React, { useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeftRight, Thermometer, Gauge, Wind, 
  Beaker, Layers, Calendar, Package, Monitor, Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export default function Comparison({ cloudLogs: externalCloudLogs }) {
  const [internalCloudLogs, setInternalCloudLogs] = useState([]);
  const [loading, setLoading] = useState(!externalCloudLogs);
  
  // Fetch logs if not provided as props
  React.useEffect(() => {
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
          setLoading(false);
        }
      };
      fetchLogs();
    }
  }, [externalCloudLogs]);

  const cloudLogs = externalCloudLogs || internalCloudLogs;
  const [filterDate, setFilterDate] = useState('');
  const [filterProduct, setFilterProduct] = useState('Tất cả');
  const [filterKilnType, setFilterKilnType] = useState('Tất cả');
  
  const [batchAId, setBatchAId] = useState('');
  const [batchBId, setBatchBId] = useState('');

  // Get unique values for filters
  const products = useMemo(() => ['Tất cả', ...new Set(cloudLogs.map(log => log.product_type))], [cloudLogs]);
  const kilnTypes = ['Tất cả', 'Lò Xương', 'Lò Men', 'Lò Sấy'];

  // Filter logs based on top row filters
  const filteredLogs = useMemo(() => {
    return cloudLogs.filter(log => {
      const matchProduct = filterProduct === 'Tất cả' || log.product_type === filterProduct;
      const matchKiln = filterKilnType === 'Tất cả' || log.kiln_type === filterKilnType;
      const matchDate = !filterDate || new Date(log.created_at).toLocaleDateString('en-CA') === filterDate;
      return matchProduct && matchKiln && matchDate;
    });
  }, [cloudLogs, filterProduct, filterKilnType, filterDate]);

  const batchA = useMemo(() => cloudLogs.find(log => log.id === batchAId), [cloudLogs, batchAId]);
  const batchB = useMemo(() => cloudLogs.find(log => log.id === batchBId), [cloudLogs, batchBId]);

  // ========== PDF EXPORT ==========
  const handleExportPDF = () => {
    if (!batchA && !batchB) {
      alert('Vui lòng chọn ít nhất 1 mẻ để xuất báo cáo.');
      return;
    }

    const formatDate = (d) => {
      try {
        const date = new Date(d);
        return isNaN(date.getTime()) ? 'Ngày chưa xác định' : date.toLocaleString('vi-VN');
      } catch { return 'Ngày chưa xác định'; }
    };

    const buildBatchSection = (log, label, borderColor) => {
      if (!log) return `<div style="flex:1;padding:20px;border:1px dashed #334155;border-radius:8px;text-align:center;color:#64748b;">Chưa chọn ${label}</div>`;
      const kd = log.kiln_data || {};
      const lab = typeof log.lab_info === 'string' ? JSON.parse(log.lab_info) : (log.lab_info || {});
      const isDryer = log.kiln_type === 'Lò Sấy';

      // Lab info rows
      const labRows = isDryer ? `
        <tr><th>Độ ẩm</th><td>${log.strength_value}%</td></tr>
        <tr><th>Cường độ</th><td>${lab.cuongDo || '---'}</td></tr>
      ` : `
        <tr><th>Lực bẻ (N)</th><td>${log.strength_value}N</td></tr>
        <tr><th>Bền uốn</th><td>${lab.benUon || '---'} N/mm²</td></tr>
        <tr><th>Độ dày min</th><td>${lab.dayMin || '---'} mm</td></tr>
        <tr><th>Độ hút nước</th><td>${lab.doHutNuoc || lab.hutNuoc || '---'}%</td></tr>
        <tr><th>Bài xương</th><td>${lab.baiXuong || '---'}</td></tr>
        <tr><th>Men Engobe</th><td>${lab.menEngobe || '---'}</td></tr>
        <tr><th>Men nền</th><td>${lab.menNen || '---'}</td></tr>
      `;

      // Temperature rows
      let tempRows = '';
      if (!isDryer) {
        const topModules = (kd.nhietDo || []).filter(m => !m.id.startsWith('M0'));
        tempRows = topModules.map(m => {
          const zid = m.id.replace(/\D/g, '');
          const bot = (kd.nhietDo || []).find(x => x.id === `M0${zid}`);
          return `<tr>
            <td style="font-weight:bold;color:${borderColor};">M${zid}</td>
            <td><b>${m.pv}</b> <small style="color:#94a3b8;">${m.sv}</small></td>
            <td><b>${bot?.pv || '--'}</b> <small style="color:#94a3b8;">${bot?.sv || '--'}</small></td>
          </tr>`;
        }).join('');
      }

      // Fan rows
      const fanRows = (kd.quat || []).filter(q => {
        const name = q.name.toUpperCase();
        return !['M7','M11','M14','M17','M19','M20'].some(s => name.startsWith(s));
      }).map(q => `<tr><td>${q.name}</td><td><b>${q.hz}</b> Hz</td></tr>`).join('');

      // Pressure rows
      const pressRows = ['TP1','TP2','TP3','TP4','TP5','MC1'].map(id => {
        const p = (kd.apSuat || []).find(x => x.id.toUpperCase() === id);
        return `<tr><td>${id}</td><td><b>${p?.val || '---'}</b> Pa</td></tr>`;
      }).join('');

      return `
        <div style="flex:1;border-left:4px solid ${borderColor};padding-left:0;">
          <h3 style="margin:0 0 5px 12px;font-size:16px;color:${borderColor};">${label}</h3>
          <table class="info"><tr><th>Sản phẩm</th><td><b>${log.product_type}</b></td></tr><tr><th>Loại lò</th><td>${log.kiln_type}</td></tr><tr><th>Mã mẻ</th><td>${log.batch_code || '---'}</td></tr><tr><th>Thời gian</th><td>${formatDate(log.created_at)}</td></tr></table>
          <div class="stitle">Thông số Lab</div>
          <table class="info">${labRows}</table>
          ${!isDryer ? `
            <div class="stitle">Dải nhiệt độ</div>
            <table class="grid"><thead><tr><th>Module</th><th>Trên (PV/SV)</th><th>Dưới (PV/SV)</th></tr></thead><tbody>${tempRows}</tbody></table>
            <div class="stitle">Hệ thống Quạt & Áp suất</div>
            <div style="display:flex;gap:10px;">
              <table class="grid" style="flex:1;"><thead><tr><th>Quạt</th><th>Hz</th></tr></thead><tbody>${fanRows}</tbody></table>
              <table class="grid" style="flex:1;"><thead><tr><th>Áp suất</th><th>Pa</th></tr></thead><tbody>${pressRows}</tbody></table>
            </div>
          ` : ''}
        </div>
      `;
    };

    // Delta column
    let deltaHtml = '';
    if (batchA && batchB && batchA.kiln_type === batchB.kiln_type && batchA.kiln_type !== 'Lò Sấy') {
      const topA = (batchA.kiln_data?.nhietDo || []).filter(m => !m.id.startsWith('M0'));
      const deltaRows = topA.map(m => {
        const mB = (batchB.kiln_data?.nhietDo || []).find(x => x.id === m.id);
        const pvA = parseFloat(m.pv);
        const pvB = parseFloat(mB?.pv || 0);
        const d = isNaN(pvA) || isNaN(pvB) ? null : Math.round(pvA - pvB);
        const warn = d !== null && Math.abs(d) > 5;
        const zid = m.id.replace(/\D/g, '');
        return `<tr><td>M${zid}</td><td style="font-weight:bold;color:${warn ? '#ef4444' : '#10b981'};background:${warn ? '#fef2f2' : '#f0fdf4'};">${d !== null ? (d > 0 ? '+'+d : d) : '--'}°C</td></tr>`;
      }).join('');
      deltaHtml = `
        <div class="stitle" style="margin-top:30px;">Bảng Delta (A - B)</div>
        <table class="grid"><thead><tr><th>Module</th><th>Δ PV (°C)</th></tr></thead><tbody>${deltaRows}</tbody></table>
      `;
    }

    const newWin = window.open('', '_blank');
    if (!newWin) { alert('Vui lòng cho phép Pop-up để xem báo cáo!'); return; }

    const html = `<!DOCTYPE html><html><head><title>So Sánh Dải Nhiệt - ${batchA?.product_type || ''} vs ${batchB?.product_type || ''}</title>
    <style>
      body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;padding:30px;background:#f8fafc;color:#1e293b;line-height:1.5;}
      .container{max-width:1100px;margin:0 auto;background:white;padding:30px;border-radius:12px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);border:1px solid #e2e8f0;}
      .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #10b981;padding-bottom:15px;margin-bottom:20px;}
      .brand{color:#10b981;font-weight:900;font-size:22px;}
      h2{color:#0f172a;margin:0 0 5px 0;font-size:17px;text-transform:uppercase;}
      .stitle{font-weight:bold;font-size:13px;margin:18px 0 8px 0;color:#10b981;border-left:4px solid #10b981;padding-left:8px;}
      table.info{width:100%;border-collapse:collapse;margin-bottom:10px;}
      table.info th,table.info td{border:1px solid #e2e8f0;padding:8px 10px;text-align:left;font-size:12px;}
      table.info th{background:#f8fafc;color:#64748b;font-weight:bold;width:35%;}
      table.grid{width:100%;border-collapse:collapse;margin-bottom:10px;}
      table.grid th,table.grid td{border:1px solid #e2e8f0;padding:6px 8px;text-align:center;font-size:11px;}
      table.grid th{background:#10b981;color:white;font-size:10px;}
      .cols{display:flex;gap:20px;margin-bottom:20px;}
      .print-btn{position:fixed;bottom:25px;right:25px;background:#10b981;color:white;border:none;padding:14px 28px;border-radius:50px;cursor:pointer;font-weight:bold;box-shadow:0 10px 15px -3px rgba(16,185,129,0.4);font-size:14px;}
      @media print{.print-btn{display:none;}body{padding:0;background:white;}.container{box-shadow:none;border:none;max-width:100%;}}
    </style></head><body>
    <button class="print-btn" onclick="window.print()">BẤM ĐỂ IN HOẶC LƯU PDF</button>
    <div class="container">
      <div class="header"><div><div class="brand">PHƯƠNG NAM SMART KCS AI</div><h2>BÁO CÁO SO SÁNH DẢI NHIỆT</h2></div><div style="text-align:right;font-size:12px;color:#64748b;">Ngày xuất: ${new Date().toLocaleString('vi-VN')}</div></div>
      <div class="cols">
        ${buildBatchSection(batchA, 'MẺ CHUẨN (A)', '#10b981')}
        ${buildBatchSection(batchB, 'MẺ SO SÁNH (B)', '#0ea5e9')}
      </div>
      ${deltaHtml}
      <div style="margin-top:40px;font-size:11px;color:#94a3b8;text-align:center;border-top:1px solid #f1f5f9;padding-top:15px;">Báo cáo so sánh được tạo tự động bởi Hệ thống KCS Thông minh Phương Nam</div>
    </div></body></html>`;
    newWin.document.write(html);
    newWin.document.close();
  };
  // ========== END PDF EXPORT ==========

  const renderBatchColumn = (log, title, color) => {
    if (!log) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-12 glass-card rounded-[3rem] border-dashed border-white/10 opacity-30">
          <Monitor size={48} className="mb-4 text-white/20" />
          <p className="text-xs font-black uppercase tracking-widest text-white/40">Chọn mẻ để bắt đầu so sánh {title}</p>
        </div>
      );
    }

    const kilnData = log.kiln_data || {};
    const labInfo = typeof log.lab_info === 'string' ? JSON.parse(log.lab_info) : log.lab_info;
    const isDryer = log.kiln_type === 'Lò Sấy';

    return (
      <div className="flex-1 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className={cn("glass-card p-8 rounded-[3rem] border-l-4", color)}>
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="px-3 py-1 bg-white/10 text-white/60 text-[10px] font-black rounded-full uppercase mb-2 inline-block">
                {log.kiln_type}
              </span>
              <h3 className="text-xl font-black uppercase tracking-tight text-white mb-1">{log.product_type}</h3>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{log.batch_code || '---'}</p>
            </div>
            <p className="text-[10px] font-black text-brand-primary uppercase bg-brand-primary/10 px-3 py-1 rounded-lg">
              {new Date(log.created_at).toLocaleTimeString('vi-VN')}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-6">
            <div className="text-center">
              <p className="text-[8px] font-black text-white/20 uppercase mb-1">{isDryer ? 'Độ ẩm' : 'Lực bẻ'}</p>
              <p className="text-lg font-black text-brand-primary">{log.strength_value}{isDryer ? '%' : 'N'}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-black text-white/20 uppercase mb-1">Cường độ/Bền uốn</p>
              <p className="text-lg font-black text-white">{isDryer ? (labInfo?.cuongDo || '---') : (labInfo?.benUon || '---')}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-black text-white/20 uppercase mb-1">Độ dày</p>
              <p className="text-lg font-black text-white">{labInfo?.dayMin || labInfo?.doDay || '---'}mm</p>
            </div>
          </div>
        </div>

        {/* Materials */}
        {!isDryer && (
          <div className="glass-card p-6 rounded-[2rem] border-white/5 bg-white/2 space-y-4">
            <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
              <Layers size={14} /> Bài phối liệu
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-[8px] font-bold text-white/20 uppercase mb-1">Xương</p>
                <p className="text-xs font-black truncate">{labInfo?.baiXuong || '---'}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-white/20 uppercase mb-1">Engobe</p>
                <p className="text-xs font-black truncate">{labInfo?.menEngobe || '---'}</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-white/20 uppercase mb-1">Nền</p>
                <p className="text-xs font-black truncate">{labInfo?.menNen || '---'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Temperature Data Placeholder or Table would go here */}
        <div className="glass-card p-6 rounded-[2rem] border-white/5 bg-white/2 space-y-4">
           <h4 className="text-[10px] font-black text-brand-primary uppercase tracking-widest flex items-center gap-2">
             <Thermometer size={14} /> Dải nhiệt độ
           </h4>
           <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {isDryer ? (
                <p className="text-[10px] text-white/30 italic text-center py-4">Dữ liệu lò sấy hiển thị lưới nhiệt...</p>
              ) : (
                (kilnData.nhietDo || []).filter(m => !m.id.startsWith('M0')).map((m, i) => {
                  const zoneId = m.id.replace(/\D/g, '');
                  const bottom = (kilnData.nhietDo || []).find(x => x.id === `M0${zoneId}`);
                  return (
                    <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-xs font-black italic text-brand-primary w-8">M{zoneId}</span>
                      <div className="flex-1 flex justify-center gap-6">
                        <div className="flex flex-col items-center">
                          <span className="text-[8px] text-white/20 uppercase">Trên</span>
                          <span className="text-sm font-black text-emerald-400">{m.pv} <small className="text-[9px] text-white/30 ml-1 font-normal">{m.sv}</small></span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[8px] text-white/20 uppercase">Dưới</span>
                          <span className="text-sm font-black text-blue-400 italic">{bottom?.pv || '--'} <small className="text-[9px] text-white/30 ml-1 font-normal">{bottom?.sv || '--'}</small></span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
           </div>
        </div>

        {/* Fans & Pressures */}
        {!isDryer && (
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-brand-primary uppercase tracking-widest flex items-center gap-2">
              <Wind size={14} /> Hệ thống Phụ trợ
            </h4>
            <div className="grid grid-cols-3 gap-2">
               {(kilnData.quat || []).slice(0, 6).map((q, i) => (
                 <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[8px] font-black opacity-30 uppercase truncate">{q.name}</p>
                    <p className="text-xs font-black text-brand-primary">{q.hz} Hz</p>
                 </div>
               ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
               {(kilnData.apSuat || []).slice(0, 6).map((p, i) => (
                 <div key={i} className="p-3 bg-brand-primary/5 rounded-xl border border-brand-primary/10">
                    <p className="text-[8px] font-black text-brand-primary opacity-60 uppercase">{p.id}</p>
                    <p className="text-xs font-black text-white">{p.val} Pa</p>
                 </div>
               ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDeltaColumn = () => {
    if (!batchA || !batchB || batchA.kiln_type !== batchB.kiln_type || batchA.kiln_type === 'Lò Sấy') return null;

    return (
      <div className="w-16 flex flex-col gap-8 pt-[320px]">
        <div className="h-[44px]"></div> {/* Spacing for Materials section if needed */}
        <div className="space-y-2">
          {(batchA.kiln_data?.nhietDo || []).filter(m => !m.id.startsWith('M0')).map((m, i) => {
            const mB = (batchB.kiln_data?.nhietDo || []).find(x => x.id === m.id);
            const pvA = parseFloat(m.pv);
            const pvB = parseFloat(mB?.pv || 0);
            const delta = isNaN(pvA) || isNaN(pvB) ? null : (pvA - pvB).toFixed(0);
            const isWarning = delta !== null && Math.abs(delta) > 5;

            return (
              <div key={i} className="h-[58px] flex items-center justify-center">
                {delta !== null ? (
                  <div className={cn(
                    "text-[10px] font-black p-1 px-2 rounded-md border",
                    isWarning ? "bg-red-500/20 text-red-500 border-red-500/40 animate-pulse" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  )}>
                    {delta > 0 ? `+${delta}` : delta}
                  </div>
                ) : (
                  <span className="text-[10px] text-white/10">--</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header Filters */}
      <div className="glass-card p-8 rounded-[3rem] border-white/5 bg-white/2">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex items-center gap-4 flex-1 w-full">
            <div className="w-12 h-12 bg-brand-primary/20 rounded-2xl flex items-center justify-center border border-brand-primary/30">
              <ArrowLeftRight className="text-brand-primary" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tighter">So sánh dải nhiệt</h2>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[2px]">Đối soát mẻ nung song song</p>
            </div>
            
            <button 
              onClick={handleExportPDF}
              disabled={!batchA && !batchB}
              className="glass-btn p-3 px-6 rounded-xl flex items-center gap-2 text-brand-primary font-black uppercase text-[10px] tracking-widest hover:bg-brand-primary/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed shrink-0"
            >
              <Download size={16} /> Xuất PDF
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full md:w-auto">
            <div className="glass-btn p-3 px-4 rounded-xl flex items-center gap-3">
              <Calendar size={14} className="text-white/20" />
              <input 
                type="date" 
                className="bg-transparent outline-none text-[10px] font-black uppercase w-28" 
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
            <div className="glass-btn p-3 px-4 rounded-xl flex items-center gap-3">
              <Package size={14} className="text-white/20" />
              <select 
                className="bg-transparent outline-none text-[10px] font-black uppercase w-32"
                value={filterProduct}
                onChange={(e) => setFilterProduct(e.target.value)}
              >
                {products.map(p => <option key={p} value={p} className="bg-[#020617]">{p}</option>)}
              </select>
            </div>
            <div className="glass-btn p-3 px-4 rounded-xl flex items-center gap-3">
              <Monitor size={14} className="text-white/20" />
              <select 
                className="bg-transparent outline-none text-[10px] font-black uppercase w-32"
                value={filterKilnType}
                onChange={(e) => setFilterKilnType(e.target.value)}
              >
                {kilnTypes.map(k => <option key={k} value={k} className="bg-[#020617]">{k}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Batch Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-card p-6 rounded-[2rem] border-emerald-500/20 bg-emerald-500/5">
          <p className="text-[10px] font-black text-emerald-400 uppercase mb-4 tracking-widest">Mẻ chuẩn (A)</p>
          <select 
            className="w-full bg-[#020617]/50 p-4 rounded-2xl border border-white/5 outline-none font-black text-xs uppercase"
            value={batchAId}
            onChange={(e) => setBatchAId(e.target.value)}
          >
            <option value="">-- CHỌN MẺ CHUẨN --</option>
            {filteredLogs.map(log => (
              <option key={log.id} value={log.id} className="bg-[#020617]">
                {new Date(log.created_at).toLocaleDateString('vi-VN')} - {log.product_type} ({log.batch_code})
              </option>
            ))}
          </select>
        </div>
        <div className="glass-card p-6 rounded-[2rem] border-brand-primary/20 bg-brand-primary/5">
          <p className="text-[10px] font-black text-brand-primary uppercase mb-4 tracking-widest">Mẻ so sánh (B)</p>
          <select 
            className="w-full bg-[#020617]/50 p-4 rounded-2xl border border-white/5 outline-none font-black text-xs uppercase"
            value={batchBId}
            onChange={(e) => setBatchBId(e.target.value)}
          >
            <option value="">-- CHỌN MẺ SO SÁNH --</option>
            {filteredLogs.map(log => (
              <option key={log.id} value={log.id} className="bg-[#020617]">
                {new Date(log.created_at).toLocaleDateString('vi-VN')} - {log.product_type} ({log.batch_code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="flex gap-8 items-start">
        {renderBatchColumn(batchA, "(A)", "border-emerald-500")}
        {renderDeltaColumn()}
        {renderBatchColumn(batchB, "(B)", "border-brand-primary")}
      </div>
    </div>
  );
}
