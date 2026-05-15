import React, { useState, useEffect } from 'react';
import { 
  Settings2, Plus, Search, Filter, Activity, 
  AlertCircle, Wrench, ChevronDown, ChevronUp,
  LayoutGrid, List, Map, Box
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

const MachineCard = ({ machine }) => (
  <div className="group relative glass-card p-6 rounded-[2rem] border border-white/5 hover:border-brand-primary/20 transition-all duration-500">
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
        <Box size={20} className="text-brand-primary" />
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <h4 className="font-black text-sm uppercase tracking-tight text-white/90">{machine.name}</h4>
          <span className={cn(
            "w-2 h-2 rounded-full",
            machine.status === 'active' ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
          )} />
        </div>
        <p className="text-[10px] font-bold text-white/30 tracking-widest uppercase">Mã: {machine.code}</p>
      </div>
    </div>
    <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
      <div className="flex gap-4">
        <div className="flex items-center gap-1.5">
          <Activity size={10} className="text-emerald-500" />
          <span className="text-[9px] font-black text-white/40 uppercase">OEE: 92%</span>
        </div>
      </div>
      <button className="text-[9px] font-black uppercase tracking-widest text-brand-primary hover:underline">Chi tiết</button>
    </div>
  </div>
);

export default function MachineManager() {
  const [groupedMachines, setGroupedMachines] = useState({});
  const [expandedAreas, setExpandedAreas] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMachines();
  }, []);

  async function fetchMachines() {
    try {
      const { data, error } = await supabase
        .from('kcs_machines')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      
      // Group machines by type (Area)
      const groups = data.reduce((acc, m) => {
        const area = m.type || 'Khác';
        if (!acc[area]) acc[area] = [];
        acc[area].push(m);
        return acc;
      }, {});
      
      setGroupedMachines(groups);
      // Auto-expand the first group
      const firstArea = Object.keys(groups)[0];
      if (firstArea) setExpandedAreas({ [firstArea]: true });
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  const toggleArea = (area) => {
    setExpandedAreas(prev => ({ ...prev, [area]: !prev[area] }));
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">
            Quản trị <span className="text-brand-primary">Khu vực & Thiết bị</span>
          </h1>
          <p className="text-white/40 font-medium tracking-wide">
            Cơ cấu máy móc theo dây chuyền sản xuất thực tế.
          </p>
        </div>
        <button className="bg-brand-primary text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-[0_0_30px_rgba(14,165,233,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
          <Plus size={18} />
          Đăng ký máy mới
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
          <p className="text-sm font-black uppercase tracking-widest text-white/20">Đang bóc tách khu vực...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedMachines).map(([area, machines]) => (
            <div key={area} className="glass-card rounded-[2.5rem] border border-white/5 overflow-hidden">
              <button 
                onClick={() => toggleArea(area)}
                className="w-full p-8 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center border border-brand-primary/20">
                    <Map size={24} className="text-brand-primary" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-xl font-black uppercase tracking-tight">{area}</h2>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-[2px]">{machines.length} Thiết bị vận hành</p>
                  </div>
                </div>
                {expandedAreas[area] ? <ChevronUp className="text-white/20" /> : <ChevronDown className="text-white/20" />}
              </button>

              {expandedAreas[area] && (
                <div className="px-8 pb-8 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t border-white/5">
                    {machines.map(machine => (
                      <MachineCard key={machine.id} machine={machine} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
