import React from 'react';
import { UserCheck, ShieldCheck, Crown, Cpu, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header({ activeMenu }) {
  const { user, profile, signOut } = useAuth();

  return (
    <header className="flex justify-between items-center mb-12">
      <div className="animate-in fade-in slide-in-from-left duration-700">
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-2 italic tech-gradient">{activeMenu}</h1>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[4px]">System Online | Network Secured</p>
        </div>
      </div>
      
      <div className="flex items-center gap-6 glass-card p-3 pr-6 rounded-2xl border-brand-primary/20 relative group hover:scale-[1.02] transition-all cursor-pointer">
        <div className="absolute inset-0 bg-brand-primary/5 rounded-2xl blur-xl group-hover:bg-brand-primary/10 transition-all"></div>
        
        <div className="relative">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="User" className="w-14 h-14 rounded-xl border border-white/20 shadow-lg transform -rotate-3 group-hover:rotate-0 transition-all object-cover" />
          ) : (
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 via-brand-primary to-emerald-500 rounded-xl flex items-center justify-center border border-white/20 shadow-lg transform -rotate-3 group-hover:rotate-0 transition-all">
              <Cpu className="text-white" size={28} />
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-md border-2 border-[#020617] shadow-lg">
            <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
          </div>
        </div>
        
        <div className="text-left relative">
          <div className="flex items-center gap-2">
            <p className="text-sm font-black uppercase tracking-tight text-white/90">{profile?.full_name || user?.email || 'Hệ thống KCS'}</p>
            <ShieldCheck size={14} className="text-brand-primary" />
          </div>
          <p className="text-[10px] font-bold text-brand-primary/60 uppercase tracking-widest">
            {profile?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}
          </p>
        </div>
        
        <button 
          onClick={() => signOut()}
          className="p-2 hover:bg-red-500/10 rounded-lg text-white/20 hover:text-red-500 transition-all ml-2"
          title="Đăng xuất"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

