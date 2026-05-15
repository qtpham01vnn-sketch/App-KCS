import React, { useState, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Database as DatabaseIcon, Search, Eye, X, 
  Thermometer, Gauge, Wind, CheckCircle2, History,
  Beaker, Layers, Download, FileJson, FileSpreadsheet,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { exportProductionLogPDF } from '../lib/pdfExport';

export default function DatabaseView({ cloudLogs: externalCloudLogs }) {
  const [internalCloudLogs, setInternalCloudLogs] = useState([]);
  const [loading, setLoading] = useState(!externalCloudLogs);
  const [selectedLog, setSelectedLog] = useState(null);
  
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
  const [searchTerm, setSearchTerm] = useState("");
  const reportRef = useRef(null);

  const filteredLogs = useMemo(() => {
    return cloudLogs.filter(log => {
      const lab = typeof log.lab_info === 'string' ? JSON.parse(log.lab_info) : log.lab_info;
      const dc = (lab?.dayChuyen || log.kiln_data?.metadata?.dayChuyen || '').toLowerCase();
      const term = searchTerm.toLowerCase();
      
      return (
        log.product_type.toLowerCase().includes(term) ||
        (log.batch_code && log.batch_code.toLowerCase().includes(term)) ||
        dc.includes(term) ||
        (term === 'dc1' && dc.includes('1')) ||
        (term === 'dc2' && dc.includes('2'))
      );
    });
  }, [cloudLogs, searchTerm]);

  const handleExport = async (type) => {
    if (type === 'EXCEL') {
      const btn = document.activeElement;
      if (btn) btn.innerText = "Dang xuat Excel...";
      
      try {
        const exportData = filteredLogs.map(log => {
          const lab = typeof log.lab_info === 'string' ? JSON.parse(log.lab_info) : log.lab_info;
          let formattedDate = "---";
          try {
            const d = new Date(log.created_at);
            formattedDate = isNaN(d.getTime()) ? "Ngay loi" : d.toLocaleString('vi-VN');
          } catch(e) { formattedDate = "Ngay loi"; }

          return {
            "Thoi Gian": formattedDate,
            "San Pham": log.product_type,
            "Ma Me": log.batch_code || '---',
            "Loai Lo": log.kiln_type,
            "Luc Be/Do Am": log.strength_value,
            "Ben Uon (N/mm2)": lab?.benUon || '---',
            "Do Day Min (mm)": lab?.dayMin || '---',
            "Do Hut Nuoc (%)": lab?.doHutNuoc || '---',
            "Bai Xuong": lab?.baiXuong || '---',
            "Men Engobe": lab?.menEngobe || '---',
            "Men Nen": lab?.menNen || '---',
            "Ghi chu": lab?.ghiChu || ''
          };
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Danh Sach Me KCS");
        
        // Auto-size columns
        const colWidths = Object.keys(exportData[0] || {}).map(key => ({ wch: Math.max(key.length, 15) }));
        ws['!cols'] = colWidths;

        // Google Sheets / Manual Copy Method: 100% Fail-safe
        const newWin = window.open('', '_blank');
        if (!newWin) {
          alert("Vui lòng cho phép Pop-up để xem báo cáo!");
          return;
        }

        const tableHtml = `
          <html>
          <head>
            <title>Bao Cao KCS - Google Sheets Export</title>
            <style>
              body { font-family: sans-serif; padding: 20px; background: #f8fafc; }
              .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
              button { background: #10b981; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: bold; }
              button:hover { background: #059669; }
              table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
              th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; font-size: 13px; }
              th { background: #f1f5f9; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>DANH SACH ME KCS - PHUONG NAM SMART AI</h2>
              <button onclick="copyTable()">SAO CHEP DU LIEU DE DAN VAO GOOGLE SHEETS</button>
            </div>
            <table id="data-table">
              <thead>
                <tr>${Object.keys(exportData[0]).map(k => `<th>${k}</th>`).join('')}</tr>
              </thead>
              <tbody>
                ${exportData.map(row => `<tr>${Object.values(row).map(v => `<td>${v}</td>`).join('')}</tr>`).join('')}
              </tbody>
            </table>
            <script>
              function copyTable() {
                const table = document.getElementById('data-table');
                const range = document.createRange();
                range.selectNode(table);
                window.getSelection().removeAllRanges();
                window.getSelection().addRange(range);
                document.execCommand('copy');
                window.getSelection().removeAllRanges();
                alert('Da sao chep! Hay sang Google Sheets va nhan Ctrl+V (hoac Cmd+V) de dan du lieu.');
              }
            </script>
          </body>
          </html>
        `;
        newWin.document.write(tableHtml);
        newWin.document.close();

      } catch (error) {
        console.error("Export Error:", error);
        alert("Loi xuat du lieu: " + error.message);
      } finally {
        if (btn) btn.innerText = "Xuat Excel";
      }
    }

    if (type === 'PDF' && selectedLog) {
      const btn = document.activeElement;
      if (btn) btn.innerText = "Dang tao PDF...";
      exportProductionLogPDF(selectedLog);
      if (btn) btn.innerText = "Xuất PDF";
      return;
    }
    alert(`Đang chuẩn bị tệp báo cáo ${type}... Chức năng xuất Excel đang được kết nối.`);
  };

  const renderDetailModal = () => {
    if (!selectedLog) return null;
    
    const kilnData = selectedLog.kiln_data || {};
    const kilnType = selectedLog.kiln_type;
    const labInfo = typeof selectedLog.lab_info === 'string' ? JSON.parse(selectedLog.lab_info) : selectedLog.lab_info;

    const formatDate = (dateStr) => {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? "Ngày chưa xác định" : d.toLocaleString('vi-VN');
    };

    const renderDryerGrid = () => {
      const gridData = kilnData.grid || [];
      const meta = kilnData.metadata || {};
      
      const getHeatColor = (val) => {
        if (!val) return 'bg-white/5 border-white/5';
        const n = parseFloat(val);
        if (isNaN(n)) return 'bg-slate-700/80 text-white/70 border-white/20';
        if (n > 150) return 'bg-red-600/40 text-white border-red-400';
        if (n > 100) return 'bg-emerald-500/30 text-emerald-50 border-emerald-400';
        return 'bg-blue-600/40 text-blue-50 border-blue-400';
      };

      return (
        <div className="space-y-10">
           {/* Dryer Metadata */}
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Thời gian', val: meta.thoiGian },
                { label: 'CK Ép', val: meta.ckEp },
                { label: 'Dẫn động', val: meta.danDong },
                { label: 'Quạt F1', val: meta.quatF1 },
                { label: 'Quạt F2', val: meta.quatF2 },
                { label: 'Độ ẩm', val: meta.doAm },
                { label: 'Dây chuyền', val: labInfo?.dayChuyen || '---' },
              ].map((m, i) => (
                <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                  <p className="text-[8px] font-black text-white/20 uppercase mb-1">{m.label}</p>
                  <p className="text-lg font-black text-brand-primary">{m.val || '---'}</p>
                </div>
              ))}
           </div>

           {/* 120-Point Grid */}
           <div className="glass-card p-6 rounded-[2.5rem] overflow-x-auto bg-[#020617]/50 border-white/5">
              <div className="min-w-[1200px] space-y-2">
                 <div className="flex gap-1.5 items-center pl-12">
                    {Array.from({length: 12}).map((_, i) => (
                      <div key={i} className="flex-1 py-1.5 bg-brand-primary/10 border border-brand-primary/20 rounded-lg text-center">
                        <span className="text-[8px] font-black uppercase text-brand-primary">K.{i+1}</span>
                      </div>
                    ))}
                 </div>
                 {[1, 2, 3, 4, 5].map(floor => (
                   <div key={floor} className="flex gap-1.5 items-center">
                      <div className="w-10 h-10 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center font-black italic text-xs">{floor}</div>
                      {Array.from({length: 12}).map((_, i) => {
                        const zone = i + 1;
                        const cell = gridData.find(g => g.zone === zone && g.floor === floor);
                        return (
                          <div key={zone} className="flex-1 grid grid-cols-2 gap-1 p-1 bg-[#0f172a] rounded-xl border border-white/5">
                             <div className={cn("text-center py-1 rounded-lg border text-[10px] font-black", getHeatColor(cell?.t))}>
                               {cell?.t || '--'}
                             </div>
                             <div className={cn("text-center py-1 rounded-lg border text-[10px] font-black", getHeatColor(cell?.p))}>
                               {cell?.p || '--'}
                             </div>
                          </div>
                        );
                      })}
                   </div>
                 ))}
              </div>
           </div>
        </div>
      );
    };

    const renderGrindingDetails = () => {
      const materials = labInfo?.materials || [];
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
              <p className="text-[8px] font-black text-white/20 uppercase mb-1">Tổng nạp thực tế</p>
              <p className="text-xl font-black text-emerald-400 font-mono">{labInfo?.totalActual?.toLocaleString()} kg</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
              <p className="text-[8px] font-black text-white/20 uppercase mb-1">Nước nạp</p>
              <p className="text-xl font-black text-blue-400 font-mono">{labInfo?.waterAdded?.toLocaleString()} kg</p>
            </div>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden border-white/5 bg-white/2">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-[10px] font-black uppercase text-white/30">
                <tr>
                  <th className="p-4">STT</th>
                  <th className="p-4">Nguyên liệu</th>
                  <th className="p-4">Kho</th>
                  <th className="p-4 text-right">Khô (kg)</th>
                  <th className="p-4 text-right">Ẩm (%)</th>
                  <th className="p-4 text-right text-emerald-400">Thực tế (kg)</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((m, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="p-4 text-xs font-mono opacity-40">{m.stt}</td>
                    <td className="p-4 font-bold text-slate-300">{m.name}</td>
                    <td className="p-4 text-[10px] font-black text-slate-500 uppercase">{m.position}</td>
                    <td className="p-4 text-right font-mono text-sm opacity-50">{m.dry_weight?.toLocaleString()}</td>
                    <td className="p-4 text-right font-mono text-sm text-blue-400">{m.humidity}%</td>
                    <td className="p-4 text-right font-black text-emerald-400 font-mono">{m.actual_weight?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    };

    const renderQCDetails = () => {
      const qcData = labInfo || {};
      const renderSection = (title, data, type) => {
        if (!data || data.length === 0) return null;
        return (
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-brand-primary flex items-center gap-2">
              {title}
            </h4>
            <div className="glass-card rounded-2xl overflow-hidden border-white/5 bg-white/2">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white/5 text-[9px] font-black uppercase tracking-[2px] text-white/30">
                  {type === 'slurry' ? (
                    <tr>
                      <th className="p-4">Mã/Máy</th>
                      <th className="p-4">Thời gian</th>
                      <th className="p-4 text-center text-emerald-400">D (g/l)</th>
                      <th className="p-4 text-center text-blue-400">V (s)</th>
                      <th className="p-4 text-center text-amber-400">R (%)</th>
                      <th className="p-4">Ghi chú</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="p-4">Giờ</th>
                      <th className="p-4">Hầm/Silo</th>
                      <th className="p-4 text-center text-emerald-400">W (%)</th>
                      <th className="p-4 text-center">{">"} 0.6</th>
                      <th className="p-4 text-center">{">"} 0.45</th>
                      <th className="p-4 text-center">0.125-0.6</th>
                      <th className="p-4 text-center">{"<"} 0.125</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr key={i} className="border-t border-white/5 hover:bg-white/5 transition-all text-[11px]">
                      {type === 'slurry' ? (
                        <>
                          <td className="p-4 font-black text-brand-primary">{row.code || row.batch_no || row.machine_no}</td>
                          <td className="p-4">{row.time}</td>
                          <td className="p-4 text-center font-black text-emerald-400">{row.d}</td>
                          <td className="p-4 text-center font-black text-blue-400">{row.v}</td>
                          <td className="p-4 text-center font-black text-amber-400">{row.r}</td>
                          <td className="p-4 italic text-white/40">{row.notes}</td>
                        </>
                      ) : (
                        <>
                          <td className="p-4 font-black">{row.time}</td>
                          <td className="p-4 font-bold text-brand-primary">{row.hầm || row.silo || row.code}</td>
                          <td className="p-4 text-center font-black text-emerald-400">{row.moisture}</td>
                          <td className="p-4 text-center opacity-60">{row.grain_06}</td>
                          <td className="p-4 text-center opacity-60">{row.grain_045}</td>
                          <td className="p-4 text-center opacity-60">{row.grain_0125_045}</td>
                          <td className="p-4 text-center opacity-60">{row.grain_under_0125}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      };

      return (
        <div className="space-y-10">
          {renderSection('I. Kiểm soát Hồ Nghiền Xương', qcData.biscuit_slurry, 'slurry')}
          {renderSection('II. Kiểm soát Hồ Nghiền Men', qcData.glaze_slurry, 'slurry')}
          {renderSection('III. Kiểm soát Bột Sấy Phun', qcData.spray_powder, 'powder')}
          {renderSection('IV. Kiểm soát Bột Cấp Ép', qcData.pressing_powder, 'powder')}
        </div>
      );
    };

    const renderKilnDetails = () => {
      return (
        <div className="space-y-10">
              {/* Block I: Temperatures */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-brand-primary flex items-center gap-2">
                  <Thermometer size={16} /> I. Dải nhiệt độ trích xuất
                </h4>
                <div className="glass-card rounded-2xl overflow-hidden border-white/5 bg-white/2">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-white/5 text-[9px] font-black uppercase tracking-[2px] text-white/30">
                      <tr>
                        <th className="p-4 border-r border-white/5 w-24">Module</th>
                        <th className="p-4 border-r border-white/5 text-center">Nhiệt độ trên (Mxxx - PV/SV)</th>
                        <th className="p-4 text-center text-blue-400">Nhiệt độ dưới (M0xxx - PV/SV)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(kilnData.nhietDo || []).filter(m => !m.id.startsWith('M0')).map((m, i) => {
                        const zoneId = m.id.replace(/\D/g, '');
                        const bottom = (kilnData.nhietDo || []).find(x => x.id === `M0${zoneId}`);
                        return (
                          <tr key={i} className="border-t border-white/5 hover:bg-white/5 transition-all">
                            <td className="p-4 border-r border-white/5 font-black text-brand-primary text-base italic">M{zoneId}</td>
                            <td className="p-4 border-r border-white/5 text-center">
                              <div className="flex items-center justify-center gap-4">
                                <span className="text-xl font-black text-emerald-400">{m.pv}</span>
                                <span className="text-[10px] font-bold text-white/20 border-l border-white/10 pl-4">{m.sv}</span>
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-4">
                                <span className="text-xl font-black text-blue-400 italic">{bottom?.pv || '---'}</span>
                                <span className="text-[10px] font-bold text-white/20 border-l border-white/10 pl-4">{bottom?.sv || '---'}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Block II: Fans & Pressures */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-brand-primary flex items-center gap-2">
                  <Wind size={16} /> II. TRẠNG THÁI HỆ THỐNG QUẠT - ÁP SUẤT
                </h4>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {(kilnData.quat || []).filter(q => {
                      const name = q.name.toUpperCase();
                      return !['M7', 'M11', 'M14', 'M17', 'M19', 'M20'].some(skip => name.startsWith(skip));
                    }).map((q, i) => (
                      <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5 flex flex-col gap-1">
                        <span className="text-[8px] font-black uppercase opacity-40 truncate">{q.name}</span>
                        <span className="text-brand-primary font-black text-sm italic">{q.hz} Hz</span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 border-t border-white/5">
                    {['TP1', 'TP2', 'TP3', 'TP4', 'TP5', 'MC1'].map((id) => {
                      const p = (kilnData.apSuat || []).find(x => x.id.toUpperCase() === id);
                      return (
                        <div key={id} className="p-4 bg-brand-primary/5 rounded-xl border border-brand-primary/10 flex flex-col gap-1">
                          <span className="text-[8px] font-black text-brand-primary uppercase opacity-60">{id}</span>
                          <span className="text-base font-black italic text-white">{p?.val || '---'} Pa</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
        </div>
      );
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/80 backdrop-blur-md">
        <motion.div 
          ref={reportRef}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="glass-card w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-[3rem] border-brand-primary/20 flex flex-col"
        >
          {/* Modal Header */}
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="px-3 py-1 bg-brand-primary/20 text-brand-primary text-[10px] font-black rounded-full uppercase">
                  {selectedLog.kiln_type}
                </span>
                <h3 className="text-2xl font-black uppercase tracking-tight">{selectedLog.product_type}</h3>
              </div>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
                <History size={12} /> {formatDate(selectedLog.created_at)} | {labInfo?.dayChuyen || '---'}
              </p>
            </div>
            <div className="flex gap-3 header-actions">
               <button onClick={() => handleExport('PDF')} className="glass-btn p-3 px-6 rounded-xl flex items-center gap-2 text-brand-primary font-black uppercase text-[10px]">
                 <Download size={16} /> Xuất PDF
               </button>
               <button onClick={() => setSelectedLog(null)} className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center hover:bg-red-500/20 hover:text-red-500 transition-all">
                <X size={24} />
               </button>
            </div>
          </div>

            {/* Body Content */}
            <div className="flex-1 overflow-y-auto p-10 space-y-10">
               {kilnType === 'Máy Nghiền' ? (
                 // Chỉ hiện bảng nguyên liệu cho Máy Nghiền
                 renderGrindingDetails()
               ) : kilnType === 'Nhật ký QC Ca' ? (
                 // Hiện bảng chi tiết cho KCS Ca
                 renderQCDetails()
               ) : (
                 // Hiện giao diện cũ cho Lò Nung / Lò Sấy
                 <>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-4">
                         <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                           <Beaker size={12} /> Thông số LAB / Kỹ thuật
                         </h4>
                         <div className="grid grid-cols-2 gap-4">
                           <div>
                             <p className="text-[8px] font-bold text-white/20 uppercase">Chỉ số Lab</p>
                             <p className="text-base font-black">{selectedLog.strength_value}{kilnType === 'Lò Sấy' ? '%' : 'N'}</p>
                           </div>
                           {kilnType === 'Lò Sấy' ? (
                             <div>
                               <p className="text-[8px] font-bold text-white/20 uppercase">Cường độ</p>
                               <p className="text-base font-black">{labInfo?.cuongDo || '---'}</p>
                             </div>
                           ) : (
                             <>
                               <div>
                                 <p className="text-[8px] font-bold text-white/20 uppercase">Bền uốn</p>
                                 <p className="text-base font-black">{labInfo?.benUon || '---'} N/mm²</p>
                               </div>
                               <div>
                                 <p className="text-[8px] font-bold text-white/20 uppercase">Độ dày min</p>
                                 <p className="text-base font-black">{labInfo?.dayMin || '---'} mm</p>
                               </div>
                             </>
                           )}
                         </div>
                      </div>

                      {kilnType !== 'Lò Sấy' && (
                       <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-4">
                           <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                             <Layers size={12} /> Bài phối liệu
                           </h4>
                           <div className="grid grid-cols-3 gap-4">
                             <div>
                               <p className="text-[8px] font-bold text-white/20 uppercase">Bài xương</p>
                               <p className="text-sm font-black truncate">{labInfo?.baiXuong || '---'}</p>
                             </div>
                             <div>
                               <p className="text-[8px] font-bold text-white/20 uppercase">Men Engobe</p>
                               <p className="text-sm font-black truncate">{labInfo?.menEngobe || '---'}</p>
                             </div>
                             <div>
                               <p className="text-[8px] font-bold text-white/20 uppercase">Men Nền</p>
                               <p className="text-sm font-black truncate">{labInfo?.menNen || '---'}</p>
                             </div>
                           </div>
                       </div>
                      )}
                   </div>

                   <div className="border-t border-white/5 pt-10">
                      {kilnType === 'Lò Sấy' ? renderDryerGrid() : renderKilnDetails()}
                   </div>
                 </>
               )}
            </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="glass-card rounded-[3rem] overflow-hidden animate-in fade-in duration-700 shadow-2xl">
      <div className="p-10 border-b border-white/5 flex flex-col md:flex-row justify-between items-center bg-white/2 gap-6">
        <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-4 text-brand-primary">
          <DatabaseIcon size={32}/> Thư viện mẻ nung Cloud
        </h3>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="glass-btn p-4 px-6 rounded-2xl flex items-center gap-3 flex-1 md:flex-initial">
            <Search size={18} className="text-white/20"/>
            <input 
              type="text" 
              placeholder="Tìm mẻ sản xuất..." 
              className="bg-transparent outline-none font-black text-xs uppercase w-48" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => handleExport('EXCEL')}
            className="bg-emerald-500 text-brand-bg p-4 px-8 rounded-2xl flex items-center gap-3 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20"
          >
            <FileSpreadsheet size={18} /> Xuất Excel
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left font-bold">
          <thead className="bg-white/5 text-white/20 uppercase text-[10px] tracking-widest">
            <tr>
              <th className="p-6">Thời gian</th>
              <th className="p-6">Sản phẩm</th>
              <th className="p-6">Loại lò</th>
              <th className="p-6 text-center">Dây chuyền</th>
              <th className="p-6 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log, i) => (
              <tr key={i} className="border-b border-white/[0.03] hover:bg-white/5 transition-all group">
                <td className="p-6 text-xs font-mono opacity-40">
                  {(() => {
                    const d = new Date(log.created_at);
                    return isNaN(d.getTime()) ? "Ngay loi" : d.toLocaleString('vi-VN');
                  })()}
                </td>
                <td className="p-6 font-black uppercase text-sm tracking-tight group-hover:text-brand-primary transition-all">{log.product_type}</td>
                <td className="p-6">
                  <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary text-[10px] font-black rounded-full uppercase border border-brand-primary/20">
                    {log.kiln_type}
                  </span>
                </td>
                <td className="p-6 text-center">
                  {(() => {
                    const lab = typeof log.lab_info === 'string' ? JSON.parse(log.lab_info) : log.lab_info;
                    const dc = lab?.dayChuyen || log.kiln_data?.metadata?.dayChuyen;
                    if (!dc) return <span className="opacity-20">---</span>;
                    return (
                      <span className={cn(
                        "px-3 py-1 rounded-lg font-black text-xs",
                        dc.includes('1') ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      )}>
                        {dc.includes('1') ? 'DC 1' : 'DC 2'}
                      </span>
                    );
                  })()}
                </td>
                <td className="p-6 text-right">
                  <button 
                    onClick={() => setSelectedLog(log)}
                    className="glass-btn p-3 rounded-xl hover:scale-110 active:scale-95 transition-all text-brand-primary"
                  >
                    <Eye size={18}/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selectedLog && renderDetailModal()}
      </AnimatePresence>
    </div>
  );
}
