
import React, { useState, useRef, useEffect } from 'react';
import { askGemAI } from '../services/geminiService';
import { ChatMessage, Tile, MaterialSelection } from '../types';

interface ExtendedChatMessage extends ChatMessage {
  visualizedImage?: string;
  extractedTile?: Tile;
  isError?: boolean;
}

interface ChatBotProps {
  selection: MaterialSelection;
  autoPrompt: string | null;
  onConsumedAutoPrompt: () => void;
  onClearSelection: () => void;
  onAddTile: (tile: Tile) => void;
  onRemoveMaterial: (type: keyof MaterialSelection) => void;
  onSaveResultToPlan: (image: string, selection: MaterialSelection) => void;
}

export const ChatBot: React.FC<ChatBotProps> = ({ selection, autoPrompt, onConsumedAutoPrompt, onClearSelection, onAddTile, onRemoveMaterial, onSaveResultToPlan }) => {
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: 'Chào mừng quý khách! Hệ thống AI của **Phương Nam** đã được nâng cấp để **ỐP FULL 100% DIỆN TÍCH TƯỜNG**. Quý khách hãy chọn đủ gạch Chân - Thân - Viền để có kết quả đẹp nhất nhé!',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoPrompt) {
      handleAction(autoPrompt);
      onConsumedAutoPrompt();
    }
  }, [autoPrompt]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAction = async (customPrompt: string) => {
    if (!customPrompt.trim() && !selectedImage) return;

    const isVisualRequest = customPrompt.toLowerCase().includes('phối') || customPrompt.toLowerCase().includes('3d');
    if (isVisualRequest && !selectedImage && !messages.some(m => m.image)) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: `Để phối cảnh **FULL TOÀN BỘ VÁCH TƯỜNG**, quý khách vui lòng tải ảnh hiện trạng lên nhé!`,
        timestamp: Date.now()
      }]);
      return;
    }

    const userMsg: ExtendedChatMessage = {
      id: Date.now().toString(), role: 'user', text: customPrompt, image: selectedImage || undefined, timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    const currentImage = selectedImage;
    setSelectedImage(null);
    setInput('');

    const history = messages.slice(-3).map(m => ({ role: m.role, parts: [{ text: m.text }] }));
    const result = await askGemAI(customPrompt, currentImage || undefined, history, selection);
    
    const aiMsg: ExtendedChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: result.text,
      visualizedImage: result.visualizedImage,
      timestamp: Date.now(),
      isError: (result as any).error
    };

    setMessages((prev) => [...prev, aiMsg]);
    setIsTyping(false);
  };

  const startFullPhối = () => {
    const prompt = `YÊU CẦU PHỐI CẢNH FULL 100% CÁC VÁCH TƯỜNG:
    - Ốp gạch chân ${selection.wallBottom?.name || 'màu đậm'}.
    - Ốp gạch thân ${selection.wallMain?.name || 'màu sáng'}.
    - Chạy viền ${selection.wallBorder?.name || 'trang trí'}.
    - Phủ sơn ${selection.paint?.name || 'màu đã chọn'} lên phần còn lại.
    Lưu ý: Không để trống bất kỳ mảng tường nào, kể cả cột và góc khuất.`;
    handleAction(prompt);
  };

  return (
    <div className="flex flex-col h-[750px] glass-panel rounded-[3rem] overflow-hidden shadow-2xl border border-white/10">
      <div className="bg-[#1e293b]/95 p-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <p className="text-[10px] font-black uppercase text-blue-400">PNC AI - Full Wall Coverage Mode</p>
        </div>
        {selectedImage && (
          <button 
            onClick={startFullPhối}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center gap-2 border border-blue-400/50 animate-bounce"
          >
            <i className="fas fa-layer-group"></i> KÍCH HOẠT PHỐI FULL TƯỜNG
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 bg-black/20 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
            <div className="max-w-[85%] space-y-3">
              {msg.image && (
                <div className="rounded-3xl overflow-hidden border border-white/20 shadow-2xl max-w-xs ml-auto relative">
                  <img src={msg.image} className="w-full object-cover" />
                  <span className="absolute top-2 right-2 bg-blue-600 text-[7px] font-bold px-2 py-1 rounded">ẢNH HIỆN TRẠNG</span>
                </div>
              )}
              <div className={`p-6 rounded-[2.2rem] text-sm shadow-xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/5 border border-white/10 text-gray-100 rounded-tl-none'}`}>
                <div className="whitespace-pre-wrap">{msg.text}</div>
                
                {msg.visualizedImage && (
                  <div className="mt-8 space-y-5">
                    <div className="flex items-center justify-between bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                      <p className="text-[9px] text-emerald-400 uppercase font-black tracking-widest">Bản phối Full vách (Hoàn thiện 100%)</p>
                      <button onClick={() => onSaveResultToPlan(msg.visualizedImage!, selection)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-[8px] font-black uppercase">Lưu PA</button>
                    </div>
                    <img src={msg.visualizedImage} className="w-full h-auto rounded-[2.5rem] border-2 border-blue-500/40 shadow-2xl" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
           <div className="flex justify-start">
             <div className="bg-white/5 px-8 py-4 rounded-full border border-blue-500/20 flex items-center gap-4">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                </div>
                <span className="text-[10px] text-blue-400 font-black uppercase tracking-tighter">AI đang quét mọi ngóc ngách để phủ gạch...</span>
             </div>
           </div>
        )}
      </div>

      <div className="p-6 bg-[#0f172a] border-t border-white/10 flex gap-4">
        <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
        <button onClick={() => fileInputRef.current?.click()} className={`w-14 h-14 rounded-2xl border transition-all flex items-center justify-center ${selectedImage ? 'bg-emerald-600 border-emerald-400' : 'bg-white/5 border-white/10 text-blue-400'}`}>
          <i className={`fas ${selectedImage ? 'fa-check-circle' : 'fa-camera-retro'} text-xl`}></i>
        </button>
        <div className="flex-1 relative">
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleAction(input)} 
            placeholder="Mô tả thêm yêu cầu phối full tường..." 
            className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm outline-none focus:border-blue-500/50" 
          />
          <button onClick={() => handleAction(input)} disabled={isTyping} className="absolute right-2 top-2 w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <i className="fas fa-paper-plane text-xs"></i>
          </button>
        </div>
      </div>
    </div>
  );
};
