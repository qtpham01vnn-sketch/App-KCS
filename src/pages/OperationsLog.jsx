import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  FileEdit, Search, Filter, History, Clock, 
  User, CheckCircle2, AlertTriangle, ShieldCheck,
  Calendar, Download, Database, Cpu
} from 'lucide-react';

export default function OperationsLog({ cloudLogs: externalCloudLogs }) {
  const [internalCloudLogs, setInternalCloudLogs] = useState([]);
  const [loading, setLoading] = useState(!externalCloudLogs);
  
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
          setLoading(false);
        }
      };
      fetchLogs();
    }
  }, [externalCloudLogs]);

  const cloudLogs = externalCloudLogs || internalCloudLogs;
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- Giả lập dữ liệu log từ logs thực tế (trong thực tế có thể tạo bảng riêng trên Supabase) ---
  const systemLogs = useMemo(() => {
    if (!cloudLogs || cloudLogs.length === 0) return [];

    return cloudLogs.map(log => ({
      id: log.id,
      time: new Date(log.created_at).toLocaleString('vi-VN'),
      timestamp: new Date(log.created_at).getTime(),
      user: log.truongCa || 'Admin',
      action: 'Trích xuất AI & Lưu mẻ nung',
      target: log.product_type,
      status: 'Thành công',
      type: 'Data',
      detail: `Mã mẻ: ${log.batch_code || 'N/A'} | Lực bẻ: ${log.strength_value}N`
    })).sort((a, b) => b.timestamp - a.timestamp);
  }, [cloudLogs]);

  const filteredLogs = systemLogs.filter(l => 
    l.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.detail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cardCls = "glass-card p-10 rounded-[3rem] border-white/5";
  const labelCls = "text-[10px] font-black text-white/30 uppercase tracking-[3px] mb-2 block";

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-4">
            <div className="p-3 bg-brand-primary/20 rounded-2xl border border-brand-primary/30">
              <FileEdit className="text-brand-primary" size={28} />
            </div>
            Nhật ký vận hành
          </h1>
          <p className="text-xs font-bold text-white/40 mt-2 italic">Lịch sử thao tác hệ thống và kiểm soát quy trình</p>
        </div>

        <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-8 py-5 rounded-2xl border border-emerald-400/20">
          <Download size={18} /> Xuất Nhật Ký (.CSV)
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card px-8 py-6 rounded-3xl border-white/5">
          <p className={labelCls}>Hoạt động (24h)</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-brand-primary">124</span>
            <ActivityIcon color="text-brand-primary" />
          </div>
        </div>
        <div className="glass-card px-8 py-6 rounded-3xl border-white/5">
          <p className={labelCls}>Mẻ nung đã lưu</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-emerald-400">{cloudLogs.length}</span>
            <Database className="text-emerald-400/30" size={24} />
          </div>
        </div>
        <div className="glass-card px-8 py-6 rounded-3xl border-white/5">
          <p className={labelCls}>Cảnh báo hệ thống</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-amber-400">0</span>
            <AlertTriangle className="text-amber-400/30" size={24} />
          </div>
        </div>
        <div className="glass-card px-8 py-6 rounded-3xl border-white/5">
          <p className={labelCls}>Máy chủ AI</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-indigo-400">ONLINE</span>
            <Cpu className="text-indigo-400/30" size={24} />
          </div>
        </div>
      </div>

      {/* Search & List */}
      <div className="glass-card rounded-[3.5rem] border-white/5 overflow-hidden flex flex-col h-[700px]">
        <div className="p-8 border-b border-white/5 bg-white/[0.01] flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-primary" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm theo người dùng, mẻ gạch hoặc chi tiết..."
              className="w-full bg-[#0f172a] border border-white/5 p-4 pl-16 rounded-2xl font-bold text-sm outline-none focus:border-brand-primary transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button className="bg-white/5 px-6 py-4 rounded-2xl border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/40 hover:border-brand-primary/40 transition-all">
              Tất cả
            </button>
            <button className="bg-white/5 px-6 py-4 rounded-2xl border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/40 hover:border-brand-primary/40 transition-all">
              Hệ thống
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {filteredLogs.length > 0 ? filteredLogs.map((log, idx) => (
            <div key={idx} className="p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] hover:bg-white/[0.04] transition-all flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="flex items-center gap-4 min-w-[200px]">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                  <User className="text-indigo-400" size={20} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-white/20 tracking-widest">Nhân viên</p>
                  <p className="text-sm font-black text-white/80">{log.user}</p>
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[9px] font-black uppercase bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-full border border-brand-primary/20">{log.action}</span>
                  <span className="text-[9px] font-black uppercase bg-emerald-400/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-400/20">{log.status}</span>
                </div>
                <p className="text-xs font-bold text-white/60">{log.detail}</p>
              </div>

              <div className="flex flex-col items-end gap-1 min-w-[150px]">
                <div className="flex items-center gap-2 text-white/40">
                  <Clock size={12} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{log.time}</span>
                </div>
                <div className="flex items-center gap-2 text-white/10">
                  <ShieldCheck size={12} />
                  <span className="text-[8px] font-bold uppercase">ID: {log.id.slice(0, 8)}...</span>
                </div>
              </div>
            </div>
          )) : (
            <div className="h-full flex flex-col items-center justify-center opacity-20">
              <History size={60} />
              <p className="mt-4 text-xs font-black uppercase tracking-widest">Không có dữ liệu nhật ký</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityIcon({ color }) {
  return (
    <svg width="40" height="24" viewBox="0 0 40 24" fill="none" className={color}>
      <path d="M2 12H8L12 2L18 22L22 12H28L32 6L38 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
