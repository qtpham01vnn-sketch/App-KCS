import React, { useState, useMemo, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Search, Filter, Calendar, History, 
  FileText, AlertTriangle, Send, Bot, 
  Sparkles, Cpu, ChevronRight, X, Clock,
  Database, LayoutGrid, ListFilter
} from 'lucide-react';
import { cn } from '../lib/utils';
import { chatWithData } from '../lib/gemini';
import { getKnowledgeDocs } from './KnowledgeBase';
import { exportProductionLogPDF } from '../lib/pdfExport';

// --- UI COMPONENTS ---
const FilterTag = ({ label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={cn(
      "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
      active ? "bg-brand-primary border-brand-primary text-brand-bg shadow-lg shadow-brand-primary/20 scale-105" : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
    )}
  >
    {label}
  </button>
);

export default function Dashboard({ cloudLogs: externalCloudLogs }) {
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
  const [searchTerm, setSearchTerm] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [filterType, setFilterType] = useState('Tất cả');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Chào anh Tuấn, tôi đã sẵn sàng. Anh cần tôi tìm kiếm hay phân tích mẻ nung nào không?' }
  ]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- SMART FILTER LOGIC ---
  const filteredLogs = useMemo(() => {
    return cloudLogs.filter(log => {
      // Search match
      const matchSearch = log.product_type.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Type match (Tất cả, Lò Xương, Lò Men, Cảnh báo)
      let matchType = true;
      if (filterType === 'Lò Xương') matchType = log.kiln_type === 'Lò Xương';
      if (filterType === 'Lò Men') matchType = log.kiln_type === 'Lò Men';
      if (filterType === 'Cảnh báo') matchType = log.strength_value < 30; // Example alert threshold

      // Date match
      let matchDate = true;
      if (dateFilter) {
        const logDate = new Date(log.created_at).toISOString().split('T')[0];
        matchDate = logDate === dateFilter;
      }

      return matchSearch && matchType && matchDate;
    }).slice(0, 8); // Show top 8 for dashboard
  }, [cloudLogs, searchTerm, filterType, dateFilter]);

  const handleChatSend = async () => {
    if (!chatInput.trim() || isTyping) return;
    const msg = chatInput;
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setChatInput("");
    setIsTyping(true);

    try {
      const knowledgeDocs = await getKnowledgeDocs();
      const response = await chatWithData(cloudLogs, msg, knowledgeDocs, messages);
      setMessages(prev => [...prev, { role: 'ai', text: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "Dạ, có lỗi kết nối với trí tuệ nhân tạo. Anh thử lại nhé!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-[1500px] mx-auto animate-in fade-in duration-500">
      
      {/* 🔍 TOP ROW: SEARCH & DATE FILTER */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-primary transition-colors" size={20} />
          <input 
            type="text"
            placeholder="Tìm nhanh mẻ nung..."
            className="w-full bg-[#0f172a] border border-white/5 p-5 pl-16 rounded-2xl font-bold text-sm outline-none focus:border-brand-primary transition-all shadow-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="md:col-span-4 relative group">
           <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-primary transition-colors" size={20} />
           <input 
            type="date"
            className="w-full bg-[#0f172a] border border-white/5 p-5 pl-16 rounded-2xl font-bold text-sm outline-none focus:border-brand-primary transition-all shadow-xl text-white/40 focus:text-white"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
           />
        </div>
      </div>

      {/* 🏷️ FILTER TAGS */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {['Tất cả', 'Lò Xương', 'Lò Men', 'Cảnh báo'].map(t => (
          <FilterTag 
            key={t} 
            label={t} 
            active={filterType === t} 
            onClick={() => setFilterType(t)} 
          />
        ))}
        {dateFilter && (
           <button 
            onClick={() => setDateFilter("")}
            className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[9px] font-black text-red-500 uppercase flex items-center gap-2"
           >
             Xóa ngày <X size={14} />
           </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 🤖 CENTER: AI COMMAND CONSOLE (8 COLS) */}
        <div className="lg:col-span-8 flex flex-col h-[600px] bg-[#0f172a] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl relative">
          <div className="p-8 border-b border-white/5 bg-white/2 flex justify-between items-center relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center border border-brand-primary/20 animate-pulse">
                <Bot className="text-brand-primary" size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight italic">AI Command Center</h3>
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-[4px]">Intelligence Operational</p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-500 uppercase">Database Linked</div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-10 space-y-8">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex items-start gap-4", m.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border", m.role === 'user' ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-400" : "bg-brand-primary/20 border-brand-primary/30 text-brand-primary")}>
                  {m.role === 'user' ? <Cpu size={20} /> : <Sparkles size={20} />}
                </div>
                <div className={cn("max-w-[70%] p-6 rounded-3xl text-sm font-bold leading-relaxed shadow-xl", m.role === 'user' ? "bg-indigo-600 text-white rounded-tr-none shadow-indigo-500/10" : "bg-white/5 border border-white/10 text-white/80 rounded-tl-none")}>
                  {m.role === 'ai' ? (
                    <div className="prose prose-invert prose-sm max-w-none prose-a:text-brand-primary prose-a:underline hover:prose-a:text-brand-primary/80 prose-strong:text-white prose-headings:text-white">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a: ({node, ...props}) => {
                            if (props.href && props.href.startsWith('#pdf-')) {
                              const logId = props.href.replace('#pdf-', '');
                              return (
                                <a 
                                  href="#" 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    const log = cloudLogs.find(l => l.id === logId || l.batch_code === logId);
                                    if (log) {
                                      exportProductionLogPDF(log);
                                    } else {
                                      alert("Không tìm thấy dữ liệu mẻ nung này!");
                                    }
                                  }}
                                  className="text-brand-primary underline font-bold"
                                >
                                  {props.children}
                                </a>
                              );
                            }
                            return <a {...props} target="_blank" rel="noopener noreferrer" />
                          }
                        }}
                      >
                        {m.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    m.text
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-2 text-brand-primary animate-pulse">
                <Sparkles size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Phương Nam AI đang suy nghĩ...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-8 border-t border-white/5 bg-white/2">
            <div className="relative group flex gap-4">
              <input 
                disabled={isTyping}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                type="text" 
                placeholder={isTyping ? "AI đang trả lời..." : "Hỏi về mẻ nung, kỹ thuật gạch men hoặc tiêu chuẩn ISO..."}
                className="flex-1 bg-white/5 border border-white/10 p-6 rounded-2xl font-bold text-sm outline-none focus:border-brand-primary transition-all disabled:opacity-50"
              />
              <button 
                disabled={isTyping}
                onClick={handleChatSend}
                className="bg-brand-primary text-brand-bg px-10 rounded-2xl font-black uppercase tracking-[2px] text-[11px] shadow-lg hover:scale-[1.02] active:scale-[0.95] transition-all flex items-center gap-3 disabled:opacity-50"
              >
                {isTyping ? 'Đang xử lý...' : 'Gửi lệnh'} <Send size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* 📊 RIGHT SIDE: FILTERED HISTORY & ALERTS (4 COLS) */}
        <div className="lg:col-span-4 space-y-6 flex flex-col h-[600px]">
          {/* Filtered History List */}
          <div className="bg-[#0f172a] p-8 rounded-[3rem] border border-white/5 flex flex-col flex-1 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-3 text-white/40">
                <History size={16} /> Kết quả tìm kiếm
              </h3>
              <span className="text-[10px] font-black text-brand-primary">{filteredLogs.length} mẻ</span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
              {filteredLogs.length > 0 ? filteredLogs.map((log, i) => (
                <div key={i} className="p-4 bg-white/5 rounded-2xl border border-transparent hover:border-brand-primary/30 transition-all group flex justify-between items-center">
                   <div>
                     <p className="text-xs font-black uppercase group-hover:text-brand-primary transition-colors">{log.product_type}</p>
                     <p className="text-[8px] font-bold text-white/20 uppercase mt-1">{new Date(log.created_at).toLocaleTimeString()} | {log.kiln_type}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-sm font-black text-emerald-400">{log.strength_value}N</p>
                     <ChevronRight size={14} className="ml-auto mt-1 opacity-10 group-hover:opacity-100" />
                   </div>
                </div>
              )) : (
                <div className="py-20 text-center opacity-10">
                  <p className="text-[10px] font-black uppercase tracking-widest">Không có kết quả</p>
                </div>
              )}
            </div>
          </div>

          {/* Smart Alerts */}
          <div className="bg-[#0f172a] p-8 rounded-[3rem] border border-red-500/10 bg-gradient-to-br from-red-500/5 to-transparent">
             <h3 className="text-[10px] font-black uppercase tracking-widest mb-6 text-red-400 flex items-center gap-3">
               <AlertTriangle size={16} /> Cảnh báo chất lượng
             </h3>
             <div className="space-y-3">
                <div className="p-4 bg-red-500/10 border border-red-500/10 rounded-2xl flex items-center gap-3">
                   <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                   <p className="text-[10px] font-bold text-red-400">Lực bẻ Ceramic 40x80 thấp hơn định mức</p>
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
