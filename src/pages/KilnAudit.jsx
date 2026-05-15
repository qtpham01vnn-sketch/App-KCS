import React, { useState } from 'react';
import { 
  Database, ChevronRight, CheckCircle2, LayoutDashboard
} from 'lucide-react';
import { PRODUCTS } from '../lib/constants';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import HMIUpload from '../components/HMIUpload';
import HMIPreview from '../components/HMIPreview';
import { useNavigate } from 'react-router-dom';

export default function KilnAudit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [extractedData, setExtractedData] = useState(null);
  
  const [formData, setFormData] = useState({
    batchCode: '',
    maGach: PRODUCTS[1],
    loaiLo: 'Lò Men',
    ngay: new Date().toLocaleDateString('en-CA'),
    lucBe: '',
    benUon: '',
    hutNuoc: '',
    dayMin: '',
    baiXuong: '',
    menEngobe: '',
    menNen: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const onDataExtracted = (data) => {
    setExtractedData(data);
    setStep(3);
  };

  const saveToDatabase = async (finalData) => {
    try {
      const { error } = await supabase.from('production_logs').insert([{
        user_id: user.id,
        batch_code: formData.batchCode || `BATCH-${Date.now()}`,
        kiln_id: formData.loaiLo,
        product_name: formData.maGach,
        hmi_data: finalData,
        lab_data: {
          lucBe: formData.lucBe,
          benUon: formData.benUon,
          hutNuoc: formData.hutNuoc,
          dayMin: formData.dayMin,
          baiXuong: formData.baiXuong,
          menEngobe: formData.menEngobe,
          menNen: formData.menNen
        }
      }]);

      if (error) throw error;
      setStep(4);
    } catch (err) {
      alert("Lỗi lưu trữ: " + err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      {/* Progress Header */}
      <div className="flex justify-between items-center px-10 relative">
        <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-white/5 -z-10" />
        {[
          { s: 1, label: 'Thông tin LAB', icon: Database },
          { s: 2, label: 'Bóc tách AI', icon: LayoutDashboard },
          { s: 3, label: 'Kiểm tra', icon: CheckCircle2 },
        ].map((item) => (
          <div key={item.s} className={cn(
            "flex flex-col items-center gap-3 bg-[#020617] px-4 transition-all duration-500",
            step >= item.s ? "text-blue-400" : "text-white/20"
          )}>
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all",
              step >= item.s ? "border-blue-500 shadow-lg shadow-blue-500/20" : "border-white/5"
            )}>
              <item.icon size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Step 1: Lab Info */}
      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white/5 p-10 space-y-8 rounded-[3rem] border border-white/5">
            <h3 className="text-xl font-black uppercase italic tracking-tight flex items-center gap-3">
              <Database className="text-blue-400" size={24} /> I. SẢN PHẨM & MẺ NUNG
            </h3>
            <div className="space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Mã Gạch / Quy cách</label>
                 <select 
                   value={formData.maGach} 
                   onChange={(e) => handleInputChange('maGach', e.target.value)}
                   className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl font-bold text-white outline-none focus:border-blue-500 transition-all appearance-none"
                 >
                   {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                 </select>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Loại Lò</label>
                    <select 
                      value={formData.loaiLo} 
                      onChange={(e) => handleInputChange('loaiLo', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl font-bold text-white outline-none focus:border-blue-500 transition-all appearance-none"
                    >
                      <option value="Lò Men">Lò Men</option>
                      <option value="Lò Xương">Lò Xương</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Mã Mẻ (Batch ID)</label>
                    <input 
                      type="text" 
                      placeholder="VD: ME-01" 
                      value={formData.batchCode} 
                      onChange={(e) => handleInputChange('batchCode', e.target.value)} 
                      className="w-full bg-blue-500/5 border border-blue-500/20 p-5 rounded-2xl font-bold outline-none focus:border-blue-500 transition-all text-blue-400" 
                    />
                  </div>
               </div>
            </div>
          </div>

          <div className="bg-white/5 p-10 space-y-8 rounded-[3rem] border border-white/5">
            <h3 className="text-xl font-black uppercase italic tracking-tight flex items-center gap-3">
              <CheckCircle2 className="text-blue-400" size={24} /> II. CHỈ SỐ LAB
            </h3>
            <div className="grid grid-cols-2 gap-6">
              {[
                { label: 'Lực bẻ (N)', key: 'lucBe' },
                { label: 'Độ bền uốn (N/mm2)', key: 'benUon' },
                { label: 'Độ hút nước (%)', key: 'hutNuoc' },
                { label: 'Độ dày min (mm)', key: 'dayMin' },
              ].map(item => (
                <div key={item.key} className="space-y-2">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">{item.label}</label>
                  <input type="text" value={formData[item.key]} onChange={(e) => handleInputChange(item.key, e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl font-bold text-white outline-none focus:border-blue-500 transition-all" />
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 flex justify-center mt-8">
            <button 
              onClick={() => setStep(2)}
              className="px-20 py-6 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-[4px] shadow-2xl shadow-blue-500/30 flex items-center gap-4 group active:scale-95 transition-all"
            >
              TIẾP TỤC NẠP ẢNH HMI <ChevronRight className="group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: AI Upload */}
      {step === 2 && (
        <div className="max-w-3xl mx-auto">
          <HMIUpload onDataExtracted={onDataExtracted} />
          <div className="flex justify-center mt-8">
            <button onClick={() => setStep(1)} className="text-slate-500 font-bold hover:text-white transition-colors">Quay lại GĐ 1</button>
          </div>
        </div>
      )}

      {/* Step 3: Preview & Edit */}
      {step === 3 && (
        <HMIPreview 
          data={extractedData} 
          onSave={saveToDatabase} 
          onReset={() => setStep(2)} 
        />
      )}

      {/* Step 4: Success */}
      {step === 4 && (
        <div className="text-center py-20 space-y-8 animate-in zoom-in duration-500">
          <div className="w-32 h-32 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-500/20">
            <CheckCircle2 className="text-green-500" size={64} />
          </div>
          <h2 className="text-4xl font-black text-white italic">LƯU DỮ LIỆU THÀNH CÔNG!</h2>
          <p className="text-slate-400 max-w-md mx-auto">Mẻ nung **{formData.batchCode}** đã được đồng bộ hóa lên hệ thống Cloud KCS.</p>
          <div className="flex gap-4 justify-center pt-8">
            <button onClick={() => navigate('/')} className="px-10 py-5 bg-white text-slate-900 rounded-2xl font-black uppercase text-[10px] tracking-widest">Về bảng điều khiển</button>
            <button onClick={() => { setStep(1); setExtractedData(null); }} className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/20">Tiếp tục mẻ mới</button>
          </div>
        </div>
      )}
    </div>
  );
}
