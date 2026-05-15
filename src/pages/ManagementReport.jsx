import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  BarChart3, FileText, Download, Calendar, Filter, 
  PieChart, CheckCircle2, AlertCircle, TrendingDown,
  ArrowUpRight, ArrowDownRight, Printer
} from 'lucide-react';

export default function ManagementReport({ cloudLogs: externalCloudLogs }) {
  const [internalCloudLogs, setInternalCloudLogs] = useState([]);
  
  // Fetch logs if not provided as props
  useEffect(() => {
    if (!externalCloudLogs) {
      supabase.from('kiln_dryer_reports').select('*').order('created_at', { ascending: false }).then(({ data }) => {
        setInternalCloudLogs(data || []);
      });
    }
  }, [externalCloudLogs]);

  const cloudLogs = externalCloudLogs || internalCloudLogs;
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // --- Logic tính toán dữ liệu báo cáo ---
  const reportData = useMemo(() => {
    if (!cloudLogs || cloudLogs.length === 0) return null;

    // Lọc theo tháng và năm
    const filtered = cloudLogs.filter(log => {
      const d = new Date(log.created_at);
      return (d.getMonth() + 1) === selectedMonth && d.getFullYear() === selectedYear;
    });

    if (filtered.length === 0) return null;

    // Tính toán các chỉ số
    const totalBatches = filtered.length;
    const avgStrength = filtered.reduce((a, b) => a + (b.strength_value || 0), 0) / totalBatches;
    
    // Giả định ngưỡng ISO: Lực bẻ > 600N là đạt
    const passCount = filtered.filter(l => (l.strength_value || 0) >= 600).length;
    const passRate = (passCount / totalBatches) * 100;

    // Phân nhóm theo sản phẩm
    const productStats = {};
    filtered.forEach(l => {
      if (!productStats[l.product_type]) {
        productStats[l.product_type] = { count: 0, avgS: 0 };
      }
      productStats[l.product_type].count++;
      productStats[l.product_type].avgS += (l.strength_value || 0);
    });

    return {
      totalBatches,
      avgStrength: avgStrength.toFixed(0),
      passRate: passRate.toFixed(1),
      productStats: Object.keys(productStats).map(p => ({
        name: p,
        count: productStats[p].count,
        avgS: (productStats[p].avgS / productStats[p].count).toFixed(0)
      }))
    };
  }, [cloudLogs, selectedMonth, selectedYear]);

  const cardCls = "glass-card p-10 rounded-[3rem] border-white/5";
  const labelCls = "text-[10px] font-black text-white/30 uppercase tracking-[3px] mb-2 block";

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-4">
            <div className="p-3 bg-brand-primary/20 rounded-2xl border border-brand-primary/30">
              <BarChart3 className="text-brand-primary" size={28} />
            </div>
            Báo cáo giám đốc
          </h1>
          <p className="text-xs font-bold text-white/40 mt-2 italic">Tổng hợp chỉ số KPI sản xuất và chất lượng KCS</p>
        </div>

        <div className="flex gap-4">
          <div className="flex items-center bg-[#0f172a] border border-white/5 rounded-2xl px-4 py-2">
            <Calendar className="text-white/20 mr-4" size={18} />
            <select 
              value={selectedMonth} 
              onChange={e => setSelectedMonth(parseInt(e.target.value))}
              className="bg-transparent text-sm font-black uppercase tracking-widest outline-none cursor-pointer"
            >
              {Array.from({length: 12}, (_, i) => (
                <option key={i+1} value={i+1} className="bg-[#020617]">Tháng {i+1}</option>
              ))}
            </select>
            <span className="mx-4 text-white/10">|</span>
            <select 
              value={selectedYear} 
              onChange={e => setSelectedYear(parseInt(e.target.value))}
              className="bg-transparent text-sm font-black uppercase tracking-widest outline-none cursor-pointer"
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y} className="bg-[#020617]">{y}</option>
              ))}
            </select>
          </div>
          <button className="bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 transition-all text-white/40 hover:text-white">
            <Printer size={20} />
          </button>
        </div>
      </div>

      {reportData ? (
        <>
          {/* KPI Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={cardCls}>
              <span className={labelCls}>Tỷ lệ đạt chuẩn ISO</span>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-5xl font-black text-emerald-400">{reportData.passRate}%</p>
                  <div className="flex items-center gap-2 mt-2 text-xs font-bold text-emerald-400/60">
                    <ArrowUpRight size={14} /> +2.4% so với tháng trước
                  </div>
                </div>
                <div className="w-16 h-16 bg-emerald-400/10 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 className="text-emerald-400" size={32} />
                </div>
              </div>
            </div>

            <div className={cardCls}>
              <span className={labelCls}>Tổng mẻ nung (Tháng)</span>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-5xl font-black text-brand-primary">{reportData.totalBatches}</p>
                  <p className="text-xs font-bold text-white/20 mt-2 uppercase tracking-widest">Mẻ đã đối soát AI</p>
                </div>
                <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center">
                  <FileText className="text-brand-primary" size={32} />
                </div>
              </div>
            </div>

            <div className={cardCls}>
              <span className={labelCls}>Nhiệt năng tiêu thụ</span>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-5xl font-black text-amber-400">92%</p>
                  <div className="flex items-center gap-2 mt-2 text-xs font-bold text-red-400/60">
                    <ArrowDownRight size={14} /> -1.2% hiệu quả lò
                  </div>
                </div>
                <div className="w-16 h-16 bg-amber-400/10 rounded-2xl flex items-center justify-center">
                  <AlertCircle className="text-amber-400" size={32} />
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Table */}
          <div className="glass-card rounded-[3rem] border-white/5 overflow-hidden">
            <div className="p-10 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
              <h3 className="text-sm font-black uppercase tracking-[4px]">Bảng kê sản lượng & Chất lượng chi tiết</h3>
              <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-primary bg-brand-primary/10 px-6 py-2.5 rounded-xl border border-brand-primary/20">
                <Download size={14} /> Xuất Báo Cáo PDF
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01]">
                    <th className="p-8 text-[10px] font-black text-white/20 uppercase tracking-widest">Sản phẩm (Mã gạch)</th>
                    <th className="p-8 text-[10px] font-black text-white/20 uppercase tracking-widest">Số mẻ nung</th>
                    <th className="p-8 text-[10px] font-black text-white/20 uppercase tracking-widest text-center">Lực bẻ TB (N)</th>
                    <th className="p-8 text-[10px] font-black text-white/20 uppercase tracking-widest text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {reportData.productStats.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-8">
                        <p className="text-sm font-black uppercase group-hover:text-brand-primary transition-colors">{item.name}</p>
                      </td>
                      <td className="p-8 text-sm font-bold text-white/60">{item.count} mẻ</td>
                      <td className="p-8 text-sm font-black text-center text-emerald-400">{item.avgS} N</td>
                      <td className="p-8 text-right">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          parseInt(item.avgS) > 600 ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'
                        }`}>
                          {parseInt(item.avgS) > 600 ? 'Ổn định' : 'Cảnh báo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="py-40 text-center glass-card rounded-[3rem] border-dashed border-white/10">
          <BarChart3 className="mx-auto text-white/5 mb-6" size={60} />
          <h3 className="text-xl font-black uppercase text-white/20 tracking-widest">Chưa có dữ liệu cho tháng {selectedMonth}/{selectedYear}</h3>
          <p className="text-xs font-bold text-white/10 mt-4 italic">Vui lòng chọn thời gian khác hoặc đồng bộ thêm dữ liệu mẻ nung</p>
        </div>
      )}
    </div>
  );
}
