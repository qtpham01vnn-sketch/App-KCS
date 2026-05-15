import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, ScanLine, ArrowLeftRight, Database as DatabaseIcon, 
  Flame, Layers, Cpu, Zap, Settings as SettingsIcon, BookOpen,
  LineChart, AlertTriangle, BarChart3, FileEdit,
  Settings2, Users2, Box, Lock
} from 'lucide-react';
import { cn } from '../lib/utils';

const SidebarItem = ({ icon: Icon, label, to }) => (
  <NavLink
    to={to}
    className={({ isActive }) => cn(
      "w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 group",
      isActive 
        ? "bg-brand-primary/10 text-brand-primary active-glow border border-brand-primary/20" 
        : "text-white/40 hover:bg-white/5"
    )}
  >
    {({ isActive }) => (
      <div className="flex items-center gap-4">
        <Icon size={20} className={cn(
          isActive ? "text-brand-primary" : "group-hover:text-white/60 transition-colors"
        )} />
        <span className="text-[11px] font-black uppercase tracking-widest text-left leading-tight">{label}</span>
      </div>
    )}
  </NavLink>
);

export default function Sidebar() {
  return (
    <aside className="w-[280px] p-6 flex flex-col border-r border-white/5 bg-[#020617] h-full">
      <div className="flex items-center gap-4 mb-12 px-2">
        <div className="w-12 h-12 bg-brand-primary/20 rounded-2xl flex items-center justify-center border border-brand-primary/30 shadow-[0_0_20px_rgba(14,165,233,0.3)]">
          <Cpu className="text-brand-primary" size={24} />
        </div>
        <div>
          <h2 className="font-black text-xl tracking-tighter uppercase leading-tight">PHƯƠNG NAM</h2>
          <p className="text-[10px] font-bold text-brand-primary uppercase tracking-[2px] animate-pulse">Smart KCS AI</p>
        </div>
      </div>
      
      <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
        <SidebarItem icon={LayoutDashboard} label="Bảng điều khiển" to="/" />
        
        <div className="pt-4 pb-2 px-6">
          <p className="text-[9px] font-black text-white/20 uppercase tracking-[3px]">Quy trình sản xuất</p>
        </div>
        <SidebarItem icon={ScanLine} label="Nguyên liệu & Phối liệu" to="/materials" />
        <SidebarItem icon={Zap} label="Kiểm soát Hồ & Bột" to="/qc" />
        <SidebarItem icon={Layers} label="Lò Sấy 5 Tầng" to="/dryer" />
        <SidebarItem icon={Flame} label="Lò Nung Men/Xương" to="/kiln" />
        
        <div className="pt-4 pb-2 px-6">
          <p className="text-[9px] font-black text-white/20 uppercase tracking-[3px]">Phân tích & Lưu trữ</p>
        </div>
        <SidebarItem icon={ScanLine} label="Giám sát tiêu chuẩn" to="/trends" />
        <SidebarItem icon={AlertTriangle} label="Thư viện lỗi gạch" to="/defects" />
        <SidebarItem icon={ArrowLeftRight} label="So sánh dải nhiệt" to="/comparison" />
        <SidebarItem icon={DatabaseIcon} label="Cơ sở dữ liệu" to="/database" />
        
        <div className="pt-4 pb-2 px-6">
          <p className="text-[9px] font-black text-white/20 uppercase tracking-[3px]">Hệ thống & Tài liệu</p>
        </div>
        <SidebarItem icon={BarChart3} label="Báo cáo giám đốc" to="/management" />
        <SidebarItem icon={FileEdit} label="Nhật ký vận hành" to="/logs" />
        <SidebarItem icon={BookOpen} label="Kho Tri Thức" to="/knowledge" />
        
        <div className="pt-4 pb-2 px-6">
          <p className="text-[9px] font-black text-brand-primary/40 uppercase tracking-[3px]">Quản trị & Trải nghiệm AI</p>
        </div>
        <SidebarItem icon={Settings2} label="Máy móc thiết bị (MMTB)" to="/machines" />
        <SidebarItem icon={Users2} label="Phòng ban nội bộ" to="/departments" />
        <SidebarItem icon={Box} label="AI 3D Interior" to="/ai-interior" />

        <div className="pt-4 pb-2 px-6">
          <p className="text-[9px] font-black text-white/20 uppercase tracking-[3px]">Hệ thống</p>
        </div>
        <SidebarItem icon={SettingsIcon} label="Cài đặt hệ thống" to="/settings" />
      </nav>

      <div className="glass-card p-6 rounded-[2rem] mt-auto border border-brand-primary/10 mb-4">
        <p className="text-[10px] font-black text-brand-primary uppercase mb-1 tracking-widest">Hệ thống giám sát</p>
        <p className="text-xs font-black truncate text-white/80 italic">Chuyên gia Phương Nam</p>
      </div>

      <div className="px-6 opacity-20 hover:opacity-40 transition-opacity">
        <p className="text-[9px] font-mono tracking-widest">v2.0.0</p>
      </div>
    </aside>
  );
}

