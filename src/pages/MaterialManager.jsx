import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Droplets, Calculator, Save, RefreshCw, ClipboardList, 
  Upload, Image as ImageIcon, CheckCircle2, AlertCircle, Loader2,
  FileSpreadsheet, Beaker, Plus, Trash2, MousePointerSquareDashed
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { runGrindingOCR } from '../lib/gemini';

const MaterialManager = ({ onSaveSuccess }) => {
  const [activeTab, setActiveTab] = useState('biscuit'); 
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Lấy thời gian hiện tại làm mặc định
  const now = new Date();
  const defaultDate = now.toISOString().split('T')[0];
  const defaultTime = now.toTimeString().split(' ')[0].substring(0, 5);

  // Dữ liệu mẻ nghiền hiện tại
  const [batchInfo, setBatchInfo] = useState({
    batchNo: '',
    recipeCode: '',
    reportDate: defaultDate,
    reportTime: defaultTime,
    materials: [],
    totalDry: 0,
    totalActual: 0,
    waterAdded: 0
  });

  useEffect(() => {
    fetchHumidity();
    // Lắng nghe sự kiện dán ảnh (Ctrl + V)
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const fetchHumidity = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('material_humidity')
        .select('*')
        .order('material_code', { ascending: true });
      if (error) throw error;
      setMaterials(data || []);
    } catch (err) {
      console.error('Error fetching humidity:', err);
    } finally {
      setLoading(false);
    }
  };

  const processFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    
    try {
      setOcrLoading(true);
      const data = await runGrindingOCR(file);
      
      if (!data || !data.materials) {
        throw new Error("AI không tìm thấy bảng nguyên liệu. Anh hãy thử chụp ảnh rõ nét hơn nhé.");
      }

      // Đồng bộ thời gian máy tính ngay khi nạp ảnh
      const now = new Date();
      const currentGio = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const currentNgay = now.toLocaleDateString('en-CA');

      setBatchInfo(prev => ({
        ...prev,
        batchNo: data.batch_no || '',
        recipeCode: data.recipe_code || '',
        materials: data.materials,
        totalDry: data.total_dry || 0,
        totalActual: data.total_actual || 0,
        waterAdded: data.water_added || 0,
        reportTime: currentGio,
        reportDate: currentNgay
      }));
      setActiveTab(data.recipe_type === 'Men' ? 'glaze' : 'biscuit');
    } catch (err) {
      console.error("OCR Error Detail:", err);
      if (err.message.includes("503") || err.message.includes("high demand")) {
        alert("⚠️ Máy chủ AI đang bận (Lỗi 503). Anh vui lòng đợi khoảng 5-10 giây rồi dán lại ảnh nhé!");
      } else {
        alert(`⚠️ Lỗi AI: ${err.message || "Không thể bóc tách dữ liệu. Anh hãy thử chụp lại ảnh rõ nét hơn nhé!"}`);
      }
    } finally {
      setOcrLoading(false);
    }
  };

  // Xử lý dán ảnh (Ctrl + V) - Tuyệt chiêu né lỗi Windows
  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        processFile(file);
      }
    }
  };

  // Xử lý kéo thả chuẩn
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    processFile(file);
    if (fileInputRef.current) fileInputRef.current.value = ""; 
  };

  const handleCreateNew = () => {
    if (window.confirm("Anh có chắc muốn tạo mẻ mới không? Toàn bộ bảng nguyên liệu hiện tại sẽ bị xóa.")) {
      const currentNow = new Date();
      setBatchInfo({
        batchNo: '',
        recipeCode: '',
        reportDate: currentNow.toISOString().split('T')[0],
        reportTime: currentNow.toTimeString().split(' ')[0].substring(0, 5),
        materials: [],
        totalDry: 0,
        totalActual: 0,
        waterAdded: 0
      });
    }
  };

  const saveToDatabase = async () => {
    if (!batchInfo.recipeCode) {
      alert("Vui lòng nhập Mã số bài hoặc nạp ảnh trước!");
      return;
    }

    try {
      setLoading(true);
      
      // Tạo mốc thời gian từ ngày và giờ đã chọn
      const reportTimestamp = new Date(`${batchInfo.reportDate}T${batchInfo.reportTime}:00`);

      const { error } = await supabase
        .from('kiln_dryer_reports')
        .insert([{
          product_type: activeTab === 'biscuit' ? 'Nghiền Xương' : 'Nghiền Men',
          kiln_type: 'Máy Nghiền', // Phân loại để trang DB dễ hiển thị
          batch_code: `${batchInfo.recipeCode} - Mẻ ${batchInfo.batchNo}`,
          lab_info: JSON.stringify({
            materials: batchInfo.materials,
            totalDry: batchInfo.totalDry,
            totalActual: batchInfo.totalActual,
            waterAdded: batchInfo.waterAdded,
            reportDate: batchInfo.reportDate,
            reportTime: batchInfo.reportTime
          }),
          created_at: reportTimestamp // Sử dụng thời gian anh đã chọn
        }]);

      if (error) throw error;
      
      if (onSaveSuccess) onSaveSuccess(); // Gọi làm mới dữ liệu ở App.jsx
      
      alert("✅ Đã lưu dữ liệu mẻ nghiền thành công! Dữ liệu vẫn được giữ lại để anh đối soát.");
    } catch (err) {
      alert("Lỗi khi lưu dữ liệu: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const addManualRow = () => {
    const newMaterial = {
      stt: batchInfo.materials.length + 1,
      name: '',
      position: '',
      dry_weight: 0,
      humidity: 0,
      actual_weight: 0
    };
    setBatchInfo({
      ...batchInfo,
      materials: [...batchInfo.materials, newMaterial]
    });
  };

  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
        activeTab === id 
        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105" 
        : "bg-slate-800/50 text-slate-400 hover:bg-slate-800"
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  return (
    <div 
      className="p-6 max-w-7xl mx-auto space-y-6 text-slate-200"
      onDragOver={(e) => e.preventDefault()} // Ngăn trình duyệt mở ảnh toàn trang
      onDrop={(e) => e.preventDefault()}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent uppercase tracking-tighter">
            Quản lý Nghiền Xương & Men
          </h1>
          <p className="text-slate-400 text-sm font-medium italic">Traceability System v2.0</p>
        </div>

        <div className="flex gap-2 p-1 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800">
          <TabButton id="biscuit" label="Nghiền Xương" icon={FileSpreadsheet} />
          <TabButton id="glaze" label="Nghiền Men" icon={Beaker} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          {/* KHU VỰC NẠP FILE - ĐÃ CẢI TIẾN TRÁNH LỖI WINDOWS */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <h3 className="font-bold uppercase text-xs text-slate-500 tracking-widest mb-4 flex items-center gap-2">
              <ImageIcon size={14} /> Nạp dữ liệu (Né lỗi Windows)
            </h3>
            
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden" 
              accept="image/*"
            />
            
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full py-10 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                isDragging ? "border-emerald-500 bg-emerald-500/10 scale-95" : "border-slate-700 bg-slate-950/30 hover:border-emerald-500/50"
              }`}
            >
              {ocrLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
                  <span className="text-emerald-400 font-bold animate-pulse">AI ĐANG ĐỌC...</span>
                </div>
              ) : (
                <>
                  <div className={`p-4 rounded-2xl mb-3 transition-colors ${isDragging ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-500"}`}>
                    <MousePointerSquareDashed size={32} />
                  </div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Kéo thả ảnh vào đây</span>
                  <span className="text-slate-600 font-medium text-[9px] mt-2 italic text-center px-4">
                    Hoặc Copy ảnh rồi nhấn <span className="text-emerald-500 font-black">Ctrl + V</span> để dán
                  </span>
                </>
              )}
            </div>

            <button 
              onClick={addManualRow}
              className="w-full mt-4 py-3 bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all border border-slate-800"
            >
              <Plus size={14} /> Nhập liệu thủ công
            </button>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="font-bold uppercase text-xs text-slate-500 tracking-widest flex items-center gap-2">
              <ClipboardList size={14} /> Thông tin định danh
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black text-slate-600">Ngày báo cáo</label>
                <input 
                  type="date" 
                  value={batchInfo.reportDate}
                  onChange={(e) => setBatchInfo({...batchInfo, reportDate: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 focus:border-emerald-500 outline-none font-bold text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black text-slate-600">Giờ báo cáo</label>
                <input 
                  type="time" 
                  value={batchInfo.reportTime}
                  onChange={(e) => setBatchInfo({...batchInfo, reportTime: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 focus:border-emerald-500 outline-none font-bold text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black text-slate-600">Mẻ số</label>
                <input 
                  type="text" 
                  placeholder="VD: 15/04"
                  value={batchInfo.batchNo}
                  onChange={(e) => setBatchInfo({...batchInfo, batchNo: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 focus:border-emerald-500 outline-none font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black text-slate-600">Mã bài (Code)</label>
                <input 
                  type="text" 
                  value={batchInfo.recipeCode}
                  onChange={(e) => setBatchInfo({...batchInfo, recipeCode: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 focus:border-emerald-500 outline-none font-bold text-emerald-400"
                />
              </div>
            </div>
          </div>
        </div>

        <motion.div 
          layout
          className="lg:col-span-2 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">Chi tiết nạp liệu thực tế</h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1 italic">
                Dữ liệu được bóc tách bởi KCS AI Assistant
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-500 uppercase">Tổng khối lượng (kg)</p>
              <p className="text-3xl font-black text-emerald-400 font-mono tracking-tighter">
                {batchInfo.totalActual.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto min-h-[350px]">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
                  <th className="pb-2 px-4">STT</th>
                  <th className="pb-2">Nguyên liệu</th>
                  <th className="pb-2">Kho</th>
                  <th className="pb-2 text-right">Khô (kg)</th>
                  <th className="pb-2 text-right">Ẩm (%)</th>
                  <th className="pb-2 text-right text-emerald-400">Thực tế (kg)</th>
                </tr>
              </thead>
              <tbody>
                {batchInfo.materials.map((m, idx) => (
                  <tr key={idx} className="bg-white/5 rounded-xl overflow-hidden group hover:bg-white/10 transition-all">
                    <td className="py-3 px-4 text-slate-600 font-mono text-xs rounded-l-xl">{idx + 1}</td>
                    <td className="py-3">
                      <input 
                        type="text" 
                        value={m.name} 
                        onChange={(e) => {
                          const newMats = [...batchInfo.materials];
                          newMats[idx].name = e.target.value;
                          setBatchInfo({...batchInfo, materials: newMats});
                        }}
                        className="bg-transparent border-none outline-none font-bold text-slate-300 w-full"
                      />
                    </td>
                    <td className="py-3">
                      <input 
                        type="text" 
                        value={m.position} 
                        onChange={(e) => {
                          const newMats = [...batchInfo.materials];
                          newMats[idx].position = e.target.value;
                          setBatchInfo({...batchInfo, materials: newMats});
                        }}
                        className="bg-transparent border-none outline-none text-[10px] font-bold text-slate-500 w-full uppercase"
                      />
                    </td>
                    <td className="py-3 text-right">
                      <input 
                        type="number" 
                        value={m.dry_weight} 
                        onChange={(e) => {
                          const newMats = [...batchInfo.materials];
                          newMats[idx].dry_weight = parseFloat(e.target.value) || 0;
                          setBatchInfo({...batchInfo, materials: newMats});
                        }}
                        className="bg-transparent border-none outline-none text-right font-mono text-sm text-slate-400 w-24"
                      />
                    </td>
                    <td className="py-3 text-right">
                      <input 
                        type="number" 
                        value={m.humidity} 
                        onChange={(e) => {
                          const newMats = [...batchInfo.materials];
                          newMats[idx].humidity = parseFloat(e.target.value) || 0;
                          setBatchInfo({...batchInfo, materials: newMats});
                        }}
                        className="bg-transparent border-none outline-none text-right font-mono text-sm text-blue-400 w-16 underline decoration-blue-500/30"
                      />
                    </td>
                    <td className="py-3 text-right font-black text-emerald-400 font-mono pr-4 rounded-r-xl">
                      {(Math.round(m.dry_weight / (1 - (m.humidity / 100)))).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {batchInfo.materials.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-24 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-20">
                        <ImageIcon size={48} />
                        <p className="text-sm italic uppercase font-black tracking-widest">Đang đợi dữ liệu nạp...</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex flex-col md:flex-row items-center justify-between p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] gap-6">
            <div className="flex gap-8 items-center">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase">Nước nạp thực tế (kg)</p>
                <input 
                  type="number" 
                  value={batchInfo.waterAdded} 
                  onChange={(e) => setBatchInfo({...batchInfo, waterAdded: parseFloat(e.target.value) || 0})}
                  className="bg-transparent border-none outline-none text-2xl font-black text-blue-400 font-mono w-24"
                />
              </div>
              <div className="w-px h-10 bg-slate-800" />
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase">Sẵn sàng</p>
                <div className={`flex items-center gap-1 font-bold text-[10px] uppercase tracking-wider ${batchInfo.materials.length > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                  <CheckCircle2 size={12} /> {batchInfo.materials.length > 0 ? 'Dữ liệu OK' : 'Trống'}
                </div>
              </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={handleCreateNew}
                className="flex-1 md:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase tracking-[0.2em] transition-all border border-white/10 flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Tạo mẻ mới
              </button>
              <button 
                onClick={saveToDatabase}
                disabled={loading || batchInfo.materials.length === 0}
                className="flex-2 md:w-auto px-12 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-20 text-white rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                Lưu Nhật Ký
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MaterialManager;
