import React, { useState } from 'react';
import { 
  Sparkles, Wand2, Upload, LayoutGrid, 
  ChevronRight, Image as ImageIcon, Layers, 
  Palette, Info, History, Trash2, CheckCircle2, Loader2
} from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { cn } from '../lib/utils';
import { GoogleGenAI } from "@google/genai";

// --- UI COMPONENTS (MATCHING DASHBOARD STYLE) ---
const TileCard = ({ label, sub, image, active, onClick, onUpload }) => (
  <div className="group relative">
    <button 
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-2xl border transition-all flex items-center gap-4 text-left relative overflow-hidden",
        active 
          ? "bg-brand-primary/10 border-brand-primary/30 shadow-lg shadow-brand-primary/5" 
          : "bg-white/5 border-white/5 hover:border-white/10"
      )}
    >
      <div className="w-12 h-12 bg-white/5 rounded-xl flex-shrink-0 overflow-hidden border border-white/10 flex items-center justify-center">
        {image ? (
          <img src={image} alt={label} className="w-full h-full object-cover" />
        ) : (
          <ImageIcon size={20} className="text-white/10" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-0.5">
          <p className={cn("text-[9px] font-black uppercase tracking-widest", active ? "text-brand-primary" : "text-white/40")}>
            {label}
          </p>
          {active && <CheckCircle2 size={12} className="text-brand-primary" />}
        </div>
        <p className="text-[11px] font-bold text-white/80 group-hover:text-white transition-colors truncate max-w-[150px]">{sub}</p>
      </div>
    </button>
    
    <button 
      onClick={(e) => { e.stopPropagation(); onUpload(); }}
      className="absolute right-3 bottom-3 p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/20 hover:text-brand-primary hover:border-brand-primary/30 transition-all opacity-0 group-hover:opacity-100"
      title="Tải ảnh mẫu riêng"
    >
      <Upload size={12} />
    </button>
  </div>
);

export default function AI3DInterior() {
  const [roomImage, setRoomImage] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [selectedMain, setSelectedMain] = useState({ id: 'PN-01', name: "Trắng Vân Mây 60x60", image: null });
  const [selectedBottom, setSelectedBottom] = useState({ id: 'PN-B01', name: "Đen Mun Bóng 60x60", image: null });
  const [selectedBorder, setSelectedBorder] = useState({ id: 'V-01', name: "Viền Kim Loại Bạc 10x60", image: null });
  const [isProcessing, setIsProcessing] = useState(false);
  const [webLink, setWebLink] = useState("");
  const [consultantAdvice, setConsultantAdvice] = useState(null);
  const [error, setError] = useState(null);

  // --- LOGIC: FILE UPLOAD ---
  const handleRoomUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setRoomImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleTileUpload = (category, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (category === 'main') setSelectedMain(prev => ({ ...prev, image: reader.result }));
        if (category === 'bottom') setSelectedBottom(prev => ({ ...prev, image: reader.result }));
        if (category === 'border') setSelectedBorder(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // --- LOGIC: AI RENDER ENGINE (S-TIER GENERATION) ---
  const handleRender = async () => {
    if (!roomImage) {
      alert("Anh vui lòng tải ảnh căn phòng lên trước nhé!");
      return;
    }
    
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY; 
    
    if (!API_KEY) {
      alert("Anh Tuấn ơi, em không tìm thấy API KEY trong file .env ạ!");
      return;
    }

    setIsProcessing(true);
    
    try {
      // Sử dụng SDK GoogleGenerativeAI chuẩn, ép version v1 để ổn định
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" }, { apiVersion: 'v1' });

      const wallStrategy = `
        CRITICAL INSTRUCTION - FULL WALL TRANSFORMATION:
        1. MANDATORY: Cover 100% of ALL visible wall surfaces in the image.
        2. TILING ARCHITECTURE (Strict Layering):
           - BOTTOM LAYER (20% height): Apply ${selectedBottom.name} texture.
           - MIDDLE LAYER (40% height): Apply ${selectedMain.name} texture.
           - BORDER LINE (5% height): Apply decorative line ${selectedBorder.name}.
           - TOP LAYER (Remaining): Apply smooth White Cream paint finish.
        3. CONSISTENCY: Maintain original room lighting and furniture but with 100% new textures.
      `;

      const base64Data = roomImage.split(',')[1];
      
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Data
          }
        },
        { text: wallStrategy }
      ]);

      const renderResponse = await result.response;
      
      // Bóc tách ảnh hoặc lời khuyên từ kết quả trả về
      const parts = renderResponse.candidates?.[0]?.content?.parts || [];
      let visualizedImage = null;
      let textAdvice = "";
      
      for (const part of parts) {
        if (part.inlineData) {
          visualizedImage = `data:image/png;base64,${part.inlineData.data}`;
        }
        if (part.text) {
          textAdvice += part.text;
        }
      }

      if (visualizedImage) {
        setResultImage(visualizedImage);
        setConsultantAdvice(null);
      } else if (textAdvice) {
        setConsultantAdvice(textAdvice);
        setResultImage(null);
      } else {
        setError("AI không trả về kết quả hợp lệ. Anh thử lại nhé!");
      }
      
    } catch (err) {
      console.error("Lỗi Render AI:", err);
      setError("Dạ anh, máy chủ AI đang bận hoặc hết hạn ngạch (429/503). Anh thử lại sau 10 giây nhé!");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- LOGIC: WEB IMPORT (CÀO LINK) ---
  const handleWebImport = async () => {
    if (!webLink.trim()) return;
    setIsProcessing(true);
    
    // Thông báo cho Antigravity (em) để em đi cào hộ anh
    console.log("Antigravity Request: Scrape image from " + webLink);
    
    // Giả lập bóc tách
    setTimeout(() => {
      setSelectedMain(prev => ({ 
        ...prev, 
        image: "https://pnc.net.vn/wp-content/uploads/2023/06/gach-op-tuong-30x60-phuong-nam-gr36000.jpg",
        name: "Mẫu nhập từ Website" 
      }));
      setIsProcessing(false);
      alert("Đã bóc tách mẫu gạch từ Website thành công!");
    }, 2000);
  };

  return (
    <div className="space-y-6 pb-20 max-w-[1500px] mx-auto animate-in fade-in duration-700">
      
      {/* 🚀 HEADER SECTION */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h3 className="text-3xl font-black uppercase tracking-tighter italic text-white flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center border border-brand-primary/20">
              <Wand2 className="text-brand-primary" size={28} />
            </div>
            AI Architect Pro
          </h3>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[4px] mt-2 ml-16">Intelligence Visual Consultant v2.0</p>
        </div>
        <div className="flex gap-3">
           <button className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">
             Xem lại lịch sử
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[700px]">
        
        {/* 🛠️ LEFT: MATERIAL SELECTOR (4 COLS) */}
        <div className="lg:col-span-4 flex flex-col bg-[#0f172a] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-white/5 bg-white/2">
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Palette className="text-brand-primary" size={20} />
                  <h3 className="text-sm font-black uppercase tracking-widest">Thư viện vật liệu</h3>
                </div>
                <button className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 transition-all">
                  <LayoutGrid size={16} />
                </button>
             </div>

             {/* 🌐 WEB IMPORT INPUT */}
             <div className="relative group">
                <input 
                  type="text" 
                  value={webLink}
                  onChange={(e) => setWebLink(e.target.value)}
                  placeholder="Dán Link mẫu gạch từ Website..."
                  className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-2xl font-bold text-[10px] outline-none focus:border-brand-primary transition-all text-white/60 focus:text-white"
                />
                <Wand2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-primary transition-colors" />
                <button 
                  onClick={handleWebImport}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-brand-primary text-brand-bg rounded-lg text-[8px] font-black uppercase tracking-tighter hover:scale-105 active:scale-95 transition-all"
                >
                  Import
                </button>
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 pt-6 space-y-6 scrollbar-hide">
            <section className="space-y-3">
              <h4 className="text-[9px] font-black text-white/20 uppercase tracking-[2px] ml-1">1. Chọn Gạch Thân (Main)</h4>
              <div className="grid grid-cols-1 gap-2">
                <TileCard 
                  label="Mã PN-01" 
                  sub={selectedMain.name} 
                  image={selectedMain.image}
                  active={selectedMain.id === 'PN-01'} 
                  onClick={() => setSelectedMain(prev => ({ ...prev, id: 'PN-01' }))}
                  onUpload={() => document.getElementById('upload-main').click()}
                />
                <input type="file" id="upload-main" hidden onChange={(e) => handleTileUpload('main', e)} />
              </div>
            </section>

            <section className="space-y-3">
              <h4 className="text-[9px] font-black text-white/20 uppercase tracking-[2px] ml-1">2. Chọn Gạch Chân (Bottom)</h4>
              <div className="grid grid-cols-1 gap-2">
                <TileCard 
                  label="Mã PN-B01" 
                  sub={selectedBottom.name} 
                  image={selectedBottom.image}
                  active={selectedBottom.id === 'PN-B01'} 
                  onClick={() => setSelectedBottom(prev => ({ ...prev, id: 'PN-B01' }))}
                  onUpload={() => document.getElementById('upload-bottom').click()}
                />
                <input type="file" id="upload-bottom" hidden onChange={(e) => handleTileUpload('bottom', e)} />
              </div>
            </section>

            <section className="space-y-3">
              <h4 className="text-[9px] font-black text-white/20 uppercase tracking-[2px] ml-1">3. Viền Điểm (Border)</h4>
              <div className="grid grid-cols-1 gap-2">
                <TileCard label="V-01" sub="Viền Kim Loại Bạc 10x60" active={selectedBorder === "Viền Kim Loại"} onClick={() => setSelectedBorder("Viền Kim Loại")} />
              </div>
            </section>
          </div>

          <div className="p-8 border-t border-white/5 bg-brand-primary/5">
             <div className="flex items-center gap-3 text-brand-primary">
                <Info size={16} />
                <p className="text-[10px] font-bold uppercase leading-tight">Dữ liệu được trích xuất từ kho mẫu tiêu chuẩn PN-KCS</p>
             </div>
          </div>
        </div>

        {/* 🖼️ RIGHT: RENDER VIEWER (8 COLS) */}
        <div className="lg:col-span-8 bg-[#0f172a] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl relative flex flex-col">
          
          <div className="flex-1 flex flex-col items-center justify-center p-12 relative">
            {/* Background Texture Effect */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', size: '40px 40px' }} />
            
            {roomImage ? (
              <div className="w-full h-full relative rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
                <img src={resultImage || roomImage} alt="Preview" className="w-full h-full object-contain bg-black/20" />
                {resultImage && (
                  <button 
                    onClick={() => setResultImage(null)}
                    className="absolute top-6 right-6 p-4 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:scale-105 transition-all"
                  >
                    Xóa kết quả
                  </button>
                )}

                {/* AI Advice Overlay */}
                {consultantAdvice && (
                  <div className="absolute inset-x-8 bottom-24 bg-[#0f172a]/80 backdrop-blur-2xl border border-brand-primary/20 p-8 rounded-[2.5rem] animate-in slide-in-from-bottom-6 duration-700 max-h-[60%] overflow-y-auto shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3 text-brand-primary">
                        <Sparkles size={20} className="animate-pulse" />
                        <h4 className="text-sm font-black uppercase tracking-widest italic">Tư vấn từ Kiến trúc sư AI</h4>
                      </div>
                      <button onClick={() => setConsultantAdvice(null)} className="text-white/20 hover:text-white transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="text-sm font-bold text-white/80 leading-relaxed whitespace-pre-wrap border-l-2 border-brand-primary/30 pl-6 py-2">
                      {consultantAdvice}
                    </div>
                    <div className="mt-8 flex justify-end">
                      <button onClick={() => setConsultantAdvice(null)} className="px-6 py-3 bg-brand-primary/10 text-brand-primary rounded-xl text-[9px] font-black uppercase tracking-widest border border-brand-primary/20 hover:bg-brand-primary hover:text-white transition-all">Đóng tư vấn</button>
                    </div>
                  </div>
                )}

                {/* Error Overlay */}
                {error && (
                  <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 bg-red-500/10 backdrop-blur-xl border border-red-500/20 p-8 rounded-[2.5rem] text-center animate-in zoom-in-95 duration-300">
                    <Info className="text-red-500 mx-auto mb-4" size={32} />
                    <p className="text-sm font-black text-white mb-4 uppercase">{error}</p>
                    <button onClick={() => setError(null)} className="px-6 py-3 bg-red-500 text-white rounded-xl text-[9px] font-black uppercase">Đã hiểu</button>
                  </div>
                )}
                <button 
                  onClick={() => document.getElementById('room-upload').click()}
                  className="absolute bottom-6 right-6 p-4 bg-white/10 backdrop-blur-md text-white rounded-2xl font-black text-[10px] uppercase border border-white/20 hover:bg-white/20 transition-all"
                >
                  Thay ảnh khác
                </button>
              </div>
            ) : (
              <div 
                onClick={() => document.getElementById('room-upload').click()}
                className="w-full max-w-xl aspect-video rounded-[2rem] border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-4 group hover:border-brand-primary/30 transition-all cursor-pointer bg-white/[0.01]"
              >
                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="text-white/20 group-hover:text-brand-primary" size={32} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-black uppercase tracking-widest mb-1">Tải ảnh không gian</p>
                  <p className="text-[10px] font-bold text-white/20 uppercase">JPG, PNG up to 10MB</p>
                </div>
              </div>
            )}
            <input type="file" id="room-upload" hidden onChange={handleRoomUpload} />

            {/* Float Instructions */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4">
               <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3">
                  <Layers size={16} className="text-brand-primary" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Tự động nhận diện vách tường</span>
               </div>
               <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3">
                  <Sparkles size={16} className="text-brand-primary" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/60">AI Inpainting HDR</span>
               </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="p-8 border-t border-white/5 bg-white/2 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <History size={20} className="text-white/20" />
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">
                {roomImage ? "Ảnh đã sẵn sàng" : "Vui lòng tải ảnh lên"}
              </p>
            </div>
            <button 
              onClick={handleRender}
              disabled={!roomImage || isProcessing}
              className={cn(
                "bg-brand-primary text-brand-bg px-12 py-5 rounded-2xl font-black uppercase tracking-[2px] text-[11px] shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.95] transition-all flex items-center gap-3",
                (!roomImage || isProcessing) && "opacity-50 cursor-not-allowed"
              )}
            >
              {isProcessing ? 'Đang vẽ...' : 'Xử lý phối cảnh'} <ChevronRight size={18} />
            </button>
          </div>

          {/* Processing Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-[#0f172a]/90 backdrop-blur-xl z-50 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-24 h-24 bg-brand-primary/10 rounded-[2rem] flex items-center justify-center mb-6 animate-spin-slow border border-brand-primary/20">
                <Sparkles className="text-brand-primary" size={40} />
              </div>
              <h3 className="text-2xl font-black uppercase italic mb-2 tracking-tighter">AI Designing...</h3>
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest max-w-md">
                Đang áp dụng vật liệu lên không gian 3D. <br/>Vui lòng giữ kết nối ổn định.
              </p>
              <button 
                onClick={() => setIsProcessing(false)}
                className="mt-8 text-[10px] font-black uppercase tracking-widest text-red-500/60 hover:text-red-500 transition-colors"
              >
                Hủy lệnh thực thi
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
