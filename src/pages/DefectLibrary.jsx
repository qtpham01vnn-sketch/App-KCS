import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AlertTriangle, Upload, Trash2, Eye, FileText, Search, Plus, X, 
  CheckCircle2, Loader2, CloudUpload, Cpu, BookOpen, Layers
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { extractPptxText } from '../lib/pptx';

const TABLE = 'defect_library';

const DEFECT_CATEGORIES = [
  'Lỗi bề mặt',
  'Lỗi kích thước',
  'Lỗi kết cấu',
  'Lỗi nung',
  'Lỗi men',
  'Khác'
];

export default function DefectLibrary({ currentUser }) {
  const isAdmin = currentUser?.role === 'admin';
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCat, setFilterCat] = useState('Tất cả');
  const [viewingDefect, setViewingDefect] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  
  // Form states
  const [uploadName, setUploadName] = useState('');
  const [uploadCat, setUploadCat] = useState(DEFECT_CATEGORIES[0]);
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadCauses, setUploadCauses] = useState('');
  const [uploadSolutions, setUploadSolutions] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  
  const fileInputRef = useRef(null);

  const fetchDefects = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setDefects(data || []);
    } catch (e) {
      console.error('Lỗi tải thư viện lỗi:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDefects(); }, [fetchDefects]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pptx')) {
      setUploadStatus('⚠️ Chỉ hỗ trợ tệp PowerPoint (.pptx)');
      return;
    }

    setExtracting(true);
    setExtractProgress(0);
    setUploadStatus('📖 Đang bóc tách từng slide PowerPoint...');
    
    try {
      const slides = await extractPptxText(file, setExtractProgress);
      if (slides.length > 0) {
        // Lấy nội dung slide đầu tiên làm gợi ý hoặc ghép tất cả
        const fullContent = slides.map(s => `[Slide ${s.slideIndex}]\n${s.content}`).join('\n\n');
        setUploadDesc(fullContent);
        setUploadName(file.name.replace('.pptx', ''));
        setUploadStatus(`✅ Đã bóc tách ${slides.length} slide từ ${file.name}`);
      }
    } catch (err) {
      console.error('PPTX extract error:', err);
      setUploadStatus('⚠️ Lỗi đọc PowerPoint. Anh thử lại nhé.');
    } finally {
      setExtracting(false);
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveDefect = async () => {
    if (!uploadName.trim()) {
      setUploadStatus('⚠️ Vui lòng nhập tên lỗi!');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from(TABLE).insert({
        defect_name: uploadName,
        category: uploadCat,
        description: uploadDesc,
        causes: uploadCauses,
        solutions: uploadSolutions,
        raw_content: uploadDesc + '\n' + uploadCauses + '\n' + uploadSolutions
      });
      if (error) throw error;

      setShowUpload(false);
      resetForm();
      fetchDefects();
    } catch (e) {
      setUploadStatus(`❌ Lỗi: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setUploadName('');
    setUploadCat(DEFECT_CATEGORIES[0]);
    setUploadDesc('');
    setUploadCauses('');
    setUploadSolutions('');
    setUploadStatus('');
  };

  const handleDelete = async (id) => {
    if (!confirm('Xóa thông tin lỗi này?')) return;
    try {
      await supabase.from(TABLE).delete().eq('id', id);
      fetchDefects();
      if (viewingDefect?.id === id) setViewingDefect(null);
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = defects.filter(d => {
    const matchSearch = d.defect_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (d.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = filterCat === 'Tất cả' || d.category === filterCat;
    return matchSearch && matchCat;
  });

  const inputCls = "w-full bg-white/5 border border-white/10 p-4 rounded-2xl font-bold text-sm outline-none focus:border-brand-primary transition-all";
  const labelCls = "text-[10px] font-black text-white/30 uppercase tracking-widest";

  return (
    <div className="space-y-6 pb-20 max-w-[1500px] mx-auto animate-in fade-in duration-500">
      
      {/* Header Info */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-4">
            <AlertTriangle className="text-amber-400" size={32} />
            Thư viện lỗi gạch
          </h1>
          <p className="text-xs font-bold text-white/40 mt-2">Số hóa kinh nghiệm sản xuất & kiến thức từ PowerPoint</p>
        </div>
        <div className="flex gap-4">
          <div className="glass-card px-6 py-3 rounded-2xl flex items-center gap-3 border-brand-primary/10">
            <Layers className="text-brand-primary" size={18} />
            <span className="text-xs font-black uppercase tracking-widest">{defects.length} DANH MỤC LỖI</span>
          </div>
        </div>
      </div>

      {/* Search & Action */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-primary" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm loại lỗi..."
            className="w-full bg-[#0f172a] border border-white/5 p-5 pl-16 rounded-2xl font-bold text-sm outline-none focus:border-brand-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="bg-brand-primary text-brand-bg px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus size={18} /> Thêm dữ liệu lỗi
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['Tất cả', ...DEFECT_CATEGORIES].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
              filterCat === cat
                ? 'bg-brand-primary border-brand-primary text-brand-bg'
                : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT: Grid View or Form */}
        <div className="lg:col-span-7 space-y-6">
          {showUpload && isAdmin ? (
            <div className="glass-card p-8 rounded-[3rem] border-brand-primary/20 space-y-6 animate-in slide-in-from-top-4 duration-500">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black uppercase tracking-tight flex items-center gap-3 text-brand-primary">
                  <CloudUpload size={20} /> Nạp dữ liệu từ PowerPoint
                </h3>
                <button onClick={() => { setShowUpload(false); resetForm(); }} className="text-white/20 hover:text-red-400">
                  <X size={20} />
                </button>
              </div>

              {/* PPTX Upload */}
              <div className="relative">
                <input type="file" ref={fileInputRef} accept=".pptx" onChange={handleFileUpload} className="hidden" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={extracting}
                  className="w-full border-2 border-dashed border-white/10 p-12 rounded-[2rem] text-center hover:border-brand-primary/40 transition-all group disabled:opacity-50"
                >
                  {extracting ? (
                    <div className="space-y-4">
                      <Loader2 size={40} className="mx-auto text-brand-primary animate-spin" />
                      <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Đang bóc tách Slide... {extractProgress}%</p>
                    </div>
                  ) : (
                    <>
                      <BookOpen size={40} className="mx-auto mb-4 text-white/10 group-hover:text-brand-primary/40" />
                      <p className="text-[11px] font-black text-white/40 uppercase tracking-[2px]">Chọn tệp PowerPoint (.pptx)</p>
                      <p className="text-[9px] font-bold text-white/10 mt-2 italic">Hệ thống sẽ tự động bóc tách text từ các slide</p>
                    </>
                  )}
                </button>
                {uploadStatus && (
                  <p className={`text-[10px] font-bold mt-3 text-center ${uploadStatus.includes('⚠️') ? 'text-amber-400' : 'text-brand-primary'}`}>{uploadStatus}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className={labelCls}>Tên loại lỗi</label>
                  <input value={uploadName} onChange={e => setUploadName(e.target.value)} className={inputCls} placeholder="Ví dụ: Nứt nung" />
                </div>
                <div className="space-y-2">
                  <label className={labelCls}>Danh mục</label>
                  <select value={uploadCat} onChange={e => setUploadCat(e.target.value)} className={`${inputCls} appearance-none`}>
                    {DEFECT_CATEGORIES.map(c => <option key={c} className="bg-[#020617]">{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelCls}>Mô tả & Nội dung từ Slide</label>
                <textarea value={uploadDesc} onChange={e => setUploadDesc(e.target.value)} className={`${inputCls} min-h-[120px]`} placeholder="Thông tin chi tiết bóc tách từ PPT..." />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className={labelCls}>Nguyên nhân</label>
                  <textarea value={uploadCauses} onChange={e => setUploadCauses(e.target.value)} className={`${inputCls} min-h-[100px]`} placeholder="Do nhiệt độ, lực ép..." />
                </div>
                <div className="space-y-2">
                  <label className={labelCls}>Cách khắc phục</label>
                  <textarea value={uploadSolutions} onChange={e => setUploadSolutions(e.target.value)} className={`${inputCls} min-h-[100px]`} placeholder="Điều chỉnh zone nung..." />
                </div>
              </div>

              <button
                onClick={handleSaveDefect}
                disabled={saving || !uploadName}
                className="w-full bg-brand-primary text-brand-bg py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-brand-primary/20 hover:scale-[1.01] transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={20} />}
                {saving ? 'Đang lưu...' : 'Lưu vào thư viện lỗi'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-fit">
              {loading ? (
                <div className="col-span-2 py-20 text-center">
                  <Loader2 className="mx-auto text-brand-primary animate-spin" size={32} />
                </div>
              ) : filtered.map(item => (
                <div
                  key={item.id}
                  onClick={() => setViewingDefect(item)}
                  className={`glass-card p-6 rounded-[2rem] border cursor-pointer transition-all hover:scale-[1.02] group ${
                    viewingDefect?.id === item.id ? 'border-brand-primary/40 bg-brand-primary/5' : 'border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-amber-400/10 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="text-amber-400" size={20} />
                    </div>
                    {isAdmin && (
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="p-2 text-white/10 hover:text-red-400 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <h4 className="text-sm font-black uppercase tracking-tight group-hover:text-brand-primary transition-colors">{item.defect_name}</h4>
                  <div className="mt-4 flex items-center gap-3">
                    <span className="text-[9px] font-black uppercase px-3 py-1 bg-white/5 rounded-full text-white/40">{item.category}</span>
                    <span className="text-[8px] font-bold text-white/20">{new Date(item.created_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Preview */}
        <div className="lg:col-span-5 h-[700px]">
          <div className="glass-card h-full rounded-[3rem] border-white/5 overflow-hidden flex flex-col">
            {viewingDefect ? (
              <>
                <div className="p-10 border-b border-white/5">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-black uppercase text-brand-primary tracking-widest mb-2 block">{viewingDefect.category}</span>
                      <h2 className="text-2xl font-black uppercase tracking-tight">{viewingDefect.defect_name}</h2>
                    </div>
                    <button onClick={() => setViewingDefect(null)} className="text-white/20 hover:text-red-400">
                      <X size={24} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-black uppercase text-amber-400 tracking-[3px]">Mô tả lỗi & Slide content</h5>
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5 text-sm text-white/60 leading-relaxed italic whitespace-pre-wrap">
                      {viewingDefect.description || 'Chưa có mô tả.'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-3">
                      <h5 className="text-[10px] font-black uppercase text-red-400 tracking-[3px]">Nguyên nhân phổ biến</h5>
                      <p className="text-sm text-white/70 leading-relaxed font-bold">
                        {viewingDefect.causes || 'Chưa cập nhật nguyên nhân.'}
                      </p>
                    </div>
                    <div className="space-y-3">
                      <h5 className="text-[10px] font-black uppercase text-emerald-400 tracking-[3px]">Cách khắc phục đề xuất</h5>
                      <p className="text-sm text-white/70 leading-relaxed font-bold">
                        {viewingDefect.solutions || 'Chưa cập nhật giải pháp.'}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mb-6">
                  <AlertTriangle size={32} className="text-white/10" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-white/20">Chọn một loại lỗi để xem chi tiết</h3>
                <p className="text-[10px] font-bold text-white/10 mt-4 leading-relaxed">
                  Thông tin sẽ bao gồm mô tả bóc tách từ PowerPoint nhà máy, các nguyên nhân kỹ thuật và giải pháp khắc phục KCS.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
