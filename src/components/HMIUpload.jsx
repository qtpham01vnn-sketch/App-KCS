import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image as ImageIcon, X, Zap, Loader2, CheckCircle2 } from 'lucide-react';
import { extractHMIData } from '../services/ai-vision';

const HMIUpload = ({ onDataExtracted }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selectedFile);
      setIsDone(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setIsDone(false);
  };

  const handleProcess = async () => {
    if (!file) return;
    setIsProcessing(true);
    
    try {
      // Logic call Gemini API thực tế
      const extractedData = await extractHMIData(file);
      console.log('Extracted Data:', extractedData);
      
      setIsDone(true);
      if (onDataExtracted) onDataExtracted(extractedData);
    } catch (error) {
      console.error('Lỗi xử lý AI:', error);
      alert('Không thể bóc tách dữ liệu. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Upload className="text-blue-400" />
                Bóc tách HMI AI
              </h2>
              <p className="text-slate-400 text-sm mt-1">Tải ảnh chụp màn hình lò nung Modena để AI xử lý</p>
            </div>
          </div>

          {!preview ? (
            <label className="group relative block w-full aspect-video rounded-[2rem] border-2 border-dashed border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer overflow-hidden">
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="text-slate-400 group-hover:text-blue-400 transition-colors" size={32} />
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold">Nhấn để chọn ảnh hoặc kéo thả</p>
                  <p className="text-slate-500 text-xs mt-1">PNG, JPG tối đa 10MB</p>
                </div>
              </div>
            </label>
          ) : (
            <div className="space-y-6">
              <div className="relative aspect-video rounded-[2rem] overflow-hidden border border-white/10 group">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    onClick={clearFile}
                    className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={clearFile}
                  disabled={isProcessing}
                  className="flex-1 px-6 py-4 rounded-2xl bg-white/5 text-white font-bold hover:bg-white/10 transition-all disabled:opacity-50"
                >
                  Chọn ảnh khác
                </button>
                <button
                  onClick={handleProcess}
                  disabled={isProcessing || isDone}
                  className={`flex-[2] px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${
                    isDone 
                    ? 'bg-green-500 text-white cursor-default' 
                    : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20 active:scale-[0.98]'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Đang bóc tách...
                    </>
                  ) : isDone ? (
                    <>
                      <CheckCircle2 size={20} />
                      Đã bóc tách xong
                    </>
                  ) : (
                    <>
                      <Zap size={20} fill="currentColor" />
                      Bắt đầu xử lý AI
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
          <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4">
            <Zap className="text-amber-500" size={20} />
          </div>
          <h4 className="text-white text-sm font-bold mb-1">Độ chính xác cao</h4>
          <p className="text-slate-500 text-xs leading-relaxed">Thuật toán Column-by-column tự động sửa lỗi nhảy mảng Modena.</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
          <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4">
            <Zap className="text-purple-500" size={20} />
          </div>
          <h4 className="text-white text-sm font-bold mb-1">Cloud Sync</h4>
          <p className="text-slate-500 text-xs leading-relaxed">Dữ liệu được đồng bộ hóa tức thì lên Supabase sau khi phê duyệt.</p>
        </div>
      </div>
    </div>
  );
};

export default HMIUpload;
