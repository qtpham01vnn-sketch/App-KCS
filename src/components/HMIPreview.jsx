import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, AlertCircle, RefreshCcw, Database } from 'lucide-react';

const HMIPreview = ({ data, onSave, onReset }) => {
  const [editedData, setEditedData] = useState(data);

  useEffect(() => {
    setEditedData(data);
  }, [data]);

  const handleChange = (section, index, field, value) => {
    const newData = { ...editedData };
    if (index !== null) {
      newData[section][index][field] = value;
    } else {
      newData[section] = value;
    }
    setEditedData(newData);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertCircle className="text-amber-500" />
            Kiểm tra dữ liệu bóc tách
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={onReset}
              className="p-2 hover:bg-white/5 rounded-lg text-slate-400 transition-colors"
              title="Làm mới"
            >
              <RefreshCcw size={20} />
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {/* 1. Nhiệt độ (Main Data) */}
          <section>
            <h4 className="text-blue-400 text-xs font-black uppercase tracking-widest mb-4">Nhiệt độ MODENA (PV/SV)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {editedData?.nhietDo?.map((item, idx) => (
                <div key={idx} className="bg-white/5 p-3 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-bold text-slate-500 mb-2">{item.id}</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-red-400 font-bold">PV</span>
                      <input 
                        type="text" 
                        value={item.pv} 
                        onChange={(e) => handleChange('nhietDo', idx, 'pv', e.target.value)}
                        className="bg-transparent text-white text-sm font-bold text-right w-12 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center justify-between border-t border-white/5 pt-1">
                      <span className="text-[10px] text-green-400 font-bold">SV</span>
                      <input 
                        type="text" 
                        value={item.sv} 
                        onChange={(e) => handleChange('nhietDo', idx, 'sv', e.target.value)}
                        className="bg-transparent text-white text-sm font-bold text-right w-12 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 2. Áp suất */}
            <section>
              <h4 className="text-blue-400 text-xs font-black uppercase tracking-widest mb-4">Áp suất & Chu kỳ</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
                  <span className="text-sm text-slate-300 font-bold">Chu kỳ nung</span>
                  <input 
                    type="text" 
                    value={editedData?.chuKy} 
                    onChange={(e) => handleChange('chuKy', null, null, e.target.value)}
                    className="bg-transparent text-white font-black text-right focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {editedData?.apSuat?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
                      <span className="text-xs text-slate-400 font-bold">{item.id}</span>
                      <input 
                        type="text" 
                        value={item.val} 
                        onChange={(e) => handleChange('apSuat', idx, 'val', e.target.value)}
                        className="bg-transparent text-white text-sm font-bold text-right w-12 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 3. Hệ thống quạt */}
            <section>
              <h4 className="text-blue-400 text-xs font-black uppercase tracking-widest mb-4">Hệ thống quạt (Hz)</h4>
              <div className="grid grid-cols-2 gap-2">
                {editedData?.quat?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
                    <span className="text-xs text-slate-400 font-bold">{item.name}</span>
                    <input 
                      type="text" 
                      value={item.hz} 
                      onChange={(e) => handleChange('quat', idx, 'hz', e.target.value)}
                      className="bg-transparent text-white text-sm font-bold text-right w-12 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="mt-12 flex justify-end gap-4">
          <button 
            onClick={onReset}
            className="px-8 py-4 rounded-2xl bg-white/5 text-slate-400 font-bold hover:bg-white/10 transition-all"
          >
            Hủy bỏ
          </button>
          <button 
            onClick={() => onSave(editedData)}
            className="px-10 py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-500 shadow-xl shadow-blue-500/20 active:scale-[0.98] flex items-center gap-3"
          >
            <Database size={20} />
            Lưu vào Supabase
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default HMIPreview;
