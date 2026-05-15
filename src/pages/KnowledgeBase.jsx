import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BookOpen, Upload, Trash2, Eye, FileText, FolderOpen,
  Search, Plus, X, CheckCircle2, Loader2, AlertTriangle,
  CloudUpload, Database as DatabaseIcon
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { ExternalLink } from 'lucide-react';

// --- PDF.js setup ---
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
import { runDocumentOCR } from '../lib/gemini';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const TABLE = 'knowledge_docs';

const CATEGORIES = [
  'ISO & Tiêu chuẩn',
  'Kỹ thuật Ceramic',
  'Văn bản hành chính',
  'Quy trình sản xuất',
  'Lỗi & Khắc phục',
  'Khác'
];

// Export cho Dashboard chatbot
export async function getKnowledgeDocs() {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('name, category, content, file_url')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('Lỗi đọc Kho Tri Thức:', e);
    // Fallback: đọc localStorage cũ nếu Supabase lỗi
    try { return JSON.parse(localStorage.getItem('kcs_knowledge_docs') || '[]'); }
    catch { return []; }
  }
}

// --- Trích xuất text từ PDF bằng pdf.js ---
async function extractPdfText(file, onProgress) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;
  let fullText = '';

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    
    // Nhóm các item theo dòng (trục Y) để giữ cấu trúc bảng
    const items = content.items;
    const lines = {};
    
    items.forEach(item => {
      // transform[5] là tọa độ Y. Làm tròn để nhóm các chữ cùng dòng.
      const y = Math.round(item.transform[5]);
      if (!lines[y]) lines[y] = [];
      lines[y].push(item);
    });

    // Sắp xếp các dòng từ trên xuống dưới (Y trong PDF tăng từ dưới lên)
    const sortedY = Object.keys(lines).sort((a, b) => b - a);
    
    let pageText = "";
    sortedY.forEach(y => {
      // Sắp xếp các chữ trong dòng từ trái sang phải (trục X)
      const rowItems = lines[y].sort((a, b) => a.transform[4] - b.transform[4]);
      
      // Nếu dòng có nhiều đoạn text cách xa nhau, giả lập là các cột bằng dấu |
      let lastX = -1;
      let lineStr = "";
      
      rowItems.forEach((item, idx) => {
        const currentX = item.transform[4];
        // Chỉ chèn dấu cách rộng nếu khoảng cách X thực sự lớn (> 45)
        if (lastX !== -1 && (currentX - lastX) > 45) {
          lineStr += "    "; 
        }
        lineStr += item.str;
        lastX = currentX + (item.width || item.str.length * 4);
      });
      
      pageText += lineStr + "\n";
    });

    fullText += pageText + "\n";
    if (onProgress) onProgress(Math.round((i / totalPages) * 100));
  }

  return fullText.trim();
}

// --- Trích xuất PDF dạng ẢNH SCAN bằng AI Vision ---
async function extractPdfWithAI(file, onProgress) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;
  let fullText = '';

  // Chỉ quét tối đa 10 trang để tránh quá tải API và chi phí, hoặc anh có thể điều chỉnh
  const maxPages = Math.min(totalPages, 15); 

  for (let i = 1; i <= maxPages; i++) {
    if (onProgress) onProgress(Math.round(((i-1) / maxPages) * 100));
    
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 }); // Scale 2.0 để ảnh đủ nét cho AI đọc
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport }).promise;
    
    // Chuyển canvas sang base64
    const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    
    try {
      const pageText = await runDocumentOCR(base64Image);
      fullText += `--- Trang ${i} ---\n${pageText}\n\n`;
    } catch (err) {
      console.error(`Lỗi AI trang ${i}:`, err);
      fullText += `--- Trang ${i} (Lỗi trích xuất) ---\n`;
    }
    
    if (onProgress) onProgress(Math.round((i / maxPages) * 100));
  }

  return fullText.trim();
}

// --- Trích xuất dữ liệu từ EXCEL (.xlsx, .xls) ---
async function extractExcelText(file) {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  let fullMarkdown = "";

  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    if (json.length > 0) {
      fullMarkdown += `## Sheet: ${sheetName}\n\n`;
      const header = json[0];
      const rows = json.slice(1);
      
      if (header && header.length > 0) {
        fullMarkdown += `| ${header.map(h => String(h || "").replace(/\|/g, '\\|')).join(' | ')} |\n`;
        fullMarkdown += `| ${header.map(() => '---').join(' | ')} |\n`;
        
        rows.forEach(row => {
          if (row && Array.isArray(row) && row.length > 0) {
            const formattedRow = header.map((_, index) => row[index] !== undefined ? String(row[index]).replace(/\|/g, '\\|') : "");
            fullMarkdown += `| ${formattedRow.join(' | ')} |\n`;
          }
        });
      }
      fullMarkdown += "\n\n";
    }
  });

  return fullMarkdown.trim() || "Bảng tính trống hoặc không có dữ liệu.";
}

// --- Trích xuất dữ liệu từ WORD (.docx) ---
async function extractWordText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToMarkdown({ arrayBuffer });
  return result.value;
}

// --- Hàm làm sạch văn bản trích xuất ---
function cleanExtractedText(text) {
  if (!text) return "";
  return text
    .replace(/\|/g, ' ')            // Xóa toàn bộ dấu |
    .replace(/-{3,}/g, ' ')         // Xóa gạch ngang
    .replace(/_{3,}/g, ' ')         // Xóa gạch dưới
    .replace(/\s+/g, ' ')           // Thu gọn khoảng trắng thừa
    .replace(/Trang \d+/g, '')      // Xóa chữ Trang
    .trim();
}

export default function KnowledgeBase({ currentUser }) {
  const isAdmin = currentUser?.role === 'admin';
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCat, setFilterCat] = useState('Tất cả');
  const [viewingDoc, setViewingDoc] = useState(null);
  const [viewMode, setViewMode] = useState('original'); // 'original' | 'ai'
  const [showUpload, setShowUpload] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadCat, setUploadCat] = useState(CATEGORIES[0]);
  const [uploadContent, setUploadContent] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadQueue, setUploadQueue] = useState([]); // Hàng chờ tải nhiều file
  const fileInputRef = useRef(null);
  const dirInputRef = useRef(null);

  // --- Fetch docs from Supabase ---
  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setDocs(data || []);
    } catch (e) {
      console.error('Lỗi tải kho tri thức:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  // --- File upload handler ---
  const handleFileUpload = async (e, isDirectory = false) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(file => {
      const ext = file.name.split('.').pop().toLowerCase();
      return ['txt', 'md', 'pdf', 'xlsx', 'xls', 'docx'].includes(ext);
    });

    if (validFiles.length === 0) {
      setUploadStatus('⚠️ Không tìm thấy file phù hợp (.pdf, .xlsx, .docx, .txt)');
      return;
    }

    // Nếu chỉ chọn 1 file, giữ nguyên logic cũ để hiện preview
    if (validFiles.length === 1 && !isDirectory) {
      const file = validFiles[0];
      setSelectedFile(file);
      setUploadName(file.name.replace(/\.[^.]+$/, ''));
      processSingleFile(file);
    } else {
      // Nếu chọn nhiều file hoặc thư mục, đưa vào hàng chờ
      const newQueue = validFiles.map(file => ({
        file,
        name: file.name.replace(/\.[^.]+$/, ''),
        status: 'Chờ xử lý',
        content: '',
        progress: 0
      }));
      setUploadQueue(prev => [...prev, ...newQueue]);
      setUploadStatus(`📂 Đã thêm ${validFiles.length} file vào hàng chờ`);
    }
  };

  // Tách logic xử lý 1 file ra để dùng chung
  const processSingleFile = async (file) => {
    if (file.name.endsWith('.pdf')) {
      setExtracting(true);
      setExtractProgress(0);
      setUploadStatus('📖 Đang trích xuất nội dung PDF...');
      try {
        const nameLower = file.name.toLowerCase();
        const isTableHeavy = nameLower.includes('bc') || 
                             nameLower.includes('kh') || 
                             nameLower.includes('bao cao') || 
                             nameLower.includes('danh muc') ||
                             nameLower.includes('.xls');

        let text = "";
        if (isTableHeavy) {
          setUploadStatus('🚀 Phát hiện file Báo cáo/Bảng biểu. Đang dùng AI Vision để tái cấu trúc bảng chuyên nghiệp...');
          text = await extractPdfWithAI(file, setExtractProgress);
        } else {
          text = await extractPdfText(file, setExtractProgress);
          if (text.length < 100 || (text.includes('|') && text.length < 300)) {
            setUploadStatus('🔍 Nội dung PDF phức tạp. Đang dùng AI Vision để xử lý bảng biểu...');
            setExtractProgress(0);
            text = await extractPdfWithAI(file, setExtractProgress);
          }
        }

        if (text.length > 20) {
          setUploadContent(text);
          setUploadStatus(`✅ Đã trích xuất ${text.length.toLocaleString()} ký tự từ ${file.name}`);
        } else {
          setUploadStatus('⚠️ Không thể trích xuất nội dung. Anh kiểm tra lại tệp nhé.');
        }
      } catch (err) {
        console.error('PDF extract error:', err);
        setUploadStatus('⚠️ Lỗi đọc PDF. Anh thử dán text thủ công nhé.');
      } finally {
        setExtracting(false);
      }
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      setExtracting(true);
      setUploadStatus('📊 Đang xử lý bảng tính Excel...');
      try {
        const text = await extractExcelText(file);
        setUploadContent(text);
        setUploadStatus(`✅ Đã chuyển đổi Excel sang bảng Markdown (${text.length.toLocaleString()} ký tự)`);
      } catch (err) {
        console.error('Excel error:', err);
        setUploadStatus('⚠️ Lỗi đọc Excel. Anh kiểm tra lại tệp nhé.');
      } finally {
        setExtracting(false);
      }
    } else if (file.name.endsWith('.docx')) {
      setExtracting(true);
      setUploadStatus('📝 Đang xử lý tài liệu Word...');
      try {
        const text = await extractWordText(file);
        setUploadContent(text);
        setUploadStatus(`✅ Đã trích xuất Word sang Markdown (${text.length.toLocaleString()} ký tự)`);
      } catch (err) {
        console.error('Word error:', err);
        setUploadStatus('⚠️ Lỗi đọc Word. Anh kiểm tra lại tệp nhé.');
      } finally {
        setExtracting(false);
      }
    } else {
      setUploadStatus('⚠️ Chỉ hỗ trợ .txt, .md, .pdf, .xlsx, .docx');
      return;
    }

    const cleaned = cleanExtractedText(uploadContent);
    setUploadContent(cleaned);
  };

  // --- Hàm xử lý lưu hàng loạt ---
  const handleSaveAll = async () => {
    if (uploadQueue.length === 0) return;
    setSaving(true);
    let successCount = 0;

    for (let i = 0; i < uploadQueue.length; i++) {
      const item = uploadQueue[i];
      setUploadStatus(`🚀 Đang xử lý (${i + 1}/${uploadQueue.length}): ${item.name}...`);
      
      try {
        // 1. Trích xuất nội dung dựa trên loại file
        let content = "";
        const file = item.file;
        const ext = file.name.split('.').pop().toLowerCase();

        if (ext === 'pdf') {
          const isTableHeavy = file.name.toLowerCase().match(/(bc|kh|bao cao|danh muc|\.xls)/);
          content = isTableHeavy ? await extractPdfWithAI(file) : await extractPdfText(file);
        } else if (ext === 'xlsx' || ext === 'xls') {
          content = await extractExcelText(file);
        } else if (ext === 'docx') {
          content = await extractWordText(file);
        } else {
          content = await file.text();
        }

        content = cleanExtractedText(content);

        // 2. Tải file gốc lên Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `KB_B_${Date.now()}_${i}.${fileExt}`;
        const filePath = `${fileName}`;
        
        const { error: uploadError } = await supabase.storage.from('iso-documents').upload(filePath, file);
        let fileUrl = null;
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('iso-documents').getPublicUrl(filePath);
          fileUrl = publicUrl;
        }

        // 3. Lưu vào DB
        await supabase.from(TABLE).insert({
          name: item.name,
          category: uploadCat,
          content: content,
          char_count: content.length,
          file_url: fileUrl,
          uploaded_by: currentUser?.username || 'admin'
        });

        successCount++;
        // Cập nhật trạng thái trong queue để UI biết
        setUploadQueue(prev => prev.map((it, idx) => idx === i ? { ...it, status: 'Hoàn thành' } : it));
      } catch (err) {
        console.error(`Lỗi file ${item.name}:`, err);
        setUploadQueue(prev => prev.map((it, idx) => idx === i ? { ...it, status: 'Lỗi' } : it));
      }
    }

    setSaving(false);
    setUploadStatus(`✅ Đã lưu thành công ${successCount}/${uploadQueue.length} tài liệu!`);
    if (successCount > 0) {
      setTimeout(() => {
        setUploadQueue([]);
        setShowUpload(false);
        setSaveSuccess(true);
        fetchDocs();
      }, 2000);
    }
  };

  // --- Save to Supabase ---
  const handleSaveDoc = async () => {
    if (!uploadName.trim() || !uploadContent.trim()) {
      setUploadStatus('⚠️ Vui lòng nhập tên và nội dung tài liệu!');
      return;
    }
    
    setSaving(true);
    setUploadStatus('☁️ Đang chuẩn bị lưu...');
    
    try {
      let fileUrl = null;
      const file = selectedFile;
      
      // 1. Nếu có file, upload lên Storage để xem gốc
      if (file) {
        setUploadStatus('📤 Đang tải file gốc lên Cloud...');
        const fileExt = file.name.split('.').pop();
        const fileName = `KB_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`; // Lưu ở root của bucket cho dễ truy cập
        
        const { error: uploadError } = await supabase.storage
          .from('iso-documents')
          .upload(filePath, file);
          
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('iso-documents')
            .getPublicUrl(filePath);
          fileUrl = publicUrl;
        }
      }

      // 2. Lưu thông tin vào Database
      setUploadStatus('💾 Đang cập nhật dữ liệu...');
      const { error } = await supabase.from(TABLE).insert({
        name: uploadName.trim(),
        category: uploadCat,
        content: uploadContent,
        char_count: uploadContent.length,
        file_url: fileUrl, // Lưu link file gốc
        uploaded_by: currentUser?.username || 'admin'
      });
      if (error) throw error;

      setShowUpload(false);
      setUploadName('');
      setUploadContent('');
      setUploadCat(CATEGORIES[0]);
      setUploadStatus('');
      setSelectedFile(null); // Lưu xong mới xóa file
      setSaveSuccess(true);
      setFilterCat('Tất cả'); // Tự động chuyển về tab "Tất cả" để thấy tài liệu mới
      fetchDocs();
      
      // Tự tắt thông báo thành công sau 5 giây
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (e) {
      console.error('Save error:', e);
      setUploadStatus(`❌ Lỗi lưu: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  // --- Delete from Supabase ---
  const handleDeleteDoc = async (docId) => {
    if (!confirm('Xóa tài liệu này khỏi Kho Tri Thức?')) return;
    try {
      const { error } = await supabase.from(TABLE).delete().eq('id', docId);
      if (error) throw error;
      if (viewingDoc?.id === docId) setViewingDoc(null);
      fetchDocs();
    } catch (e) {
      console.error('Delete error:', e);
    }
  };

  // Filtered docs
  const filtered = docs.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = filterCat === 'Tất cả' || d.category === filterCat;
    return matchSearch && matchCat;
  });

  const totalChars = docs.reduce((sum, d) => sum + (d.char_count || 0), 0);

  const inputCls = "w-full bg-white/5 border border-white/10 p-5 rounded-2xl font-bold text-sm outline-none focus:border-brand-primary transition-all";
  const labelCls = "text-[10px] font-black text-white/30 uppercase tracking-widest";

  return (
    <div className="space-y-6 pb-20 max-w-[1500px] mx-auto animate-in fade-in duration-500">
      
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-8 rounded-[2rem] text-center border-brand-primary/10">
          <p className={labelCls}>Tổng tài liệu</p>
          <p className="text-4xl font-black text-brand-primary mt-2">{docs.length}</p>
          <p className="text-[8px] font-bold text-emerald-400/40 mt-1 uppercase">☁️ Supabase Cloud</p>
        </div>
        <div className="glass-card p-8 rounded-[2rem] text-center border-brand-primary/10">
          <p className={labelCls}>Tổng dung lượng</p>
          <p className="text-4xl font-black text-emerald-400 mt-2">
            {totalChars > 1000 ? `${(totalChars / 1000).toFixed(1)}K` : totalChars}
            <span className="text-sm text-white/20 ml-2">ký tự</span>
          </p>
        </div>
        <div className="glass-card p-8 rounded-[2rem] text-center border-brand-primary/10">
          <p className={labelCls}>Danh mục</p>
          <p className="text-4xl font-black text-indigo-400 mt-2">
            {new Set(docs.map(d => d.category)).size}
          </p>
        </div>
      </div>

      {/* Search + Upload Button */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-primary" size={20} />
          <input
            type="text"
            placeholder="Tìm tài liệu..."
            className="w-full bg-[#0f172a] border border-white/5 p-5 pl-16 rounded-2xl font-bold text-sm outline-none focus:border-brand-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="bg-brand-primary text-brand-bg px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-brand-primary/20"
          >
            <Plus size={18} /> Thêm tài liệu
          </button>
        )}
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['Tất cả', ...CATEGORIES].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
              filterCat === cat
                ? 'bg-brand-primary border-brand-primary text-brand-bg shadow-lg shadow-brand-primary/20'
                : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="text-emerald-400" size={20} />
          <p className="text-xs font-black uppercase text-emerald-400 tracking-tight">Đã lưu tài liệu vào Kho Tri Thức thành công! Anh có thể xem ở danh sách bên dưới.</p>
          <button onClick={() => setSaveSuccess(false)} className="ml-auto text-emerald-400/40 hover:text-emerald-400">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT: Document List */}
        <div className="lg:col-span-5 space-y-3">
          
          {/* Upload Form */}
          {showUpload && isAdmin && (
            <div className="glass-card p-8 rounded-[2rem] border-brand-primary/20 space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black uppercase tracking-tight flex items-center gap-3">
                  <CloudUpload size={18} className="text-brand-primary" /> Thêm Tài Liệu Mới
                </h3>
                <button onClick={() => { setShowUpload(false); setUploadStatus(''); }} className="text-white/20 hover:text-red-400 transition-all">
                  <X size={18} />
                </button>
              </div>

              {/* File Input Batch */}
              <div className="grid grid-cols-2 gap-4">
                <input type="file" ref={fileInputRef} accept=".txt,.md,.pdf,.xlsx,.xls,.docx" multiple onChange={handleFileUpload} className="hidden" />
                <input type="file" ref={dirInputRef} webkitdirectory="true" onChange={(e) => handleFileUpload(e, true)} className="hidden" />
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={extracting || saving}
                  className="border-2 border-dashed border-white/10 p-6 rounded-2xl text-center hover:border-brand-primary/40 transition-all group disabled:opacity-50"
                >
                  <FileText size={24} className="mx-auto mb-2 text-white/10 group-hover:text-brand-primary/40" />
                  <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Chọn nhiều file</p>
                </button>

                <button
                  onClick={() => dirInputRef.current?.click()}
                  disabled={extracting || saving}
                  className="border-2 border-dashed border-white/10 p-6 rounded-2xl text-center hover:border-brand-primary/40 transition-all group disabled:opacity-50"
                >
                  <FolderOpen size={24} className="mx-auto mb-2 text-white/10 group-hover:text-brand-primary/40" />
                  <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Chọn cả thư mục</p>
                </button>
              </div>

              {/* Queue List */}
              {uploadQueue.length > 0 && (
                <div className="bg-black/20 rounded-2xl p-4 max-h-[200px] overflow-y-auto border border-white/5">
                  <div className="flex justify-between mb-3 border-b border-white/5 pb-2">
                    <span className="text-[8px] font-black uppercase text-white/30">Hàng chờ ({uploadQueue.length})</span>
                    <button onClick={() => setUploadQueue([])} className="text-[8px] font-black text-red-400 uppercase">Xóa hết</button>
                  </div>
                  <div className="space-y-2">
                    {uploadQueue.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                        <span className="text-[10px] font-bold truncate pr-4 text-white/60">{item.name}</span>
                        <span className={`text-[8px] font-black uppercase ${item.status === 'Hoàn thành' ? 'text-emerald-400' : item.status === 'Lỗi' ? 'text-red-400' : 'text-brand-primary'}`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploadStatus && (
                <p className={`text-[10px] font-bold ${uploadStatus.startsWith('⚠️') || uploadStatus.startsWith('❌') ? 'text-red-400' : 'text-brand-primary'}`}>{uploadStatus}</p>
              )}

              {/* Only show single file name/cat if not batching */}
              {uploadQueue.length <= 1 && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className={labelCls}>Tên tài liệu</label>
                    <input value={uploadName} onChange={e => setUploadName(e.target.value)} className={inputCls} placeholder="Tên tài liệu" />
                  </div>
                  <div className="space-y-2">
                    <label className={labelCls}>Danh mục</label>
                    <select value={uploadCat} onChange={e => setUploadCat(e.target.value)} className={`${inputCls} appearance-none`}>
                      {CATEGORIES.map(c => <option key={c} className="bg-[#020617]">{c}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {uploadQueue.length > 1 && (
                <div className="space-y-2">
                  <label className={labelCls}>Danh mục chung cho cả bộ</label>
                  <select value={uploadCat} onChange={e => setUploadCat(e.target.value)} className={`${inputCls} appearance-none`}>
                    {CATEGORIES.map(c => <option key={c} className="bg-[#020617]">{c}</option>)}
                  </select>
                </div>
              )}

              {uploadQueue.length <= 1 && (
                <div className="space-y-2">
                  <label className={labelCls}>Nội dung</label>
                  <textarea
                    value={uploadContent}
                    onChange={e => setUploadContent(e.target.value)}
                    className={`${inputCls} min-h-[100px] resize-y`}
                  />
                </div>
              )}

              <button
                onClick={uploadQueue.length > 1 ? handleSaveAll : handleSaveDoc}
                disabled={saving || extracting || (uploadQueue.length === 0 && !uploadContent.trim())}
                className="w-full bg-brand-primary text-brand-bg py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 shadow-lg shadow-brand-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
              >
                {saving ? (
                  <><Loader2 size={20} className="animate-spin" /> Đang xử lý hàng loạt...</>
                ) : (
                  <><CloudUpload size={20} /> {uploadQueue.length > 1 ? `LƯU TẤT CẢ ${uploadQueue.length} FILE` : 'Lưu vào Kho Tri Thức'}</>
                )}
              </button>
            </div>
          )}

          {/* Document List */}
          <div className="bg-[#0f172a] rounded-[2rem] border border-white/5 overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-3">
                <FolderOpen size={16} /> Danh sách tài liệu
              </h3>
              <span className="text-[10px] font-black text-brand-primary">{filtered.length} tài liệu</span>
            </div>
            <div className="max-h-[500px] overflow-y-auto p-4 space-y-2">
              {loading ? (
                <div className="py-20 text-center">
                  <Loader2 size={32} className="mx-auto mb-4 text-brand-primary animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Đang tải từ Cloud...</p>
                </div>
              ) : filtered.length > 0 ? filtered.map(doc => (
                <div
                  key={doc.id}
                  onClick={() => setViewingDoc(doc)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all group ${
                    viewingDoc?.id === doc.id
                      ? 'bg-brand-primary/10 border-brand-primary/30'
                      : 'bg-white/5 border-transparent hover:border-brand-primary/20'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black uppercase group-hover:text-brand-primary transition-colors truncate">{doc.name}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[8px] font-black uppercase bg-white/5 px-3 py-1 rounded-full text-brand-primary/60">{doc.category}</span>
                        <span className="text-[8px] font-bold text-white/20">{(doc.char_count || 0).toLocaleString()} ký tự</span>
                      </div>
                      <p className="text-[8px] font-bold text-white/10 mt-2">{new Date(doc.created_at).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (doc.file_url) {
                            const url = doc.file_url;
                            const isOffice = url.toLowerCase().match(/\.(docx|xlsx|doc|xls)$/);
                            if (isOffice) {
                              window.open(`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`, '_blank');
                            } else {
                              window.open(url, '_blank');
                            }
                          } else {
                            setViewingDoc(doc);
                          }
                        }} 
                        className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/20"
                        title="MỞ XEM FILE GỐC (NHANH)"
                      >
                        <ExternalLink size={18} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setViewingDoc(doc); setViewMode('ai'); }} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 hover:text-brand-primary hover:bg-brand-primary/10 transition-all">
                        <Eye size={18} />
                      </button>
                      {isAdmin && (
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteDoc(doc.id); }} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="py-20 text-center">
                  <BookOpen size={40} className="mx-auto mb-4 text-white/5" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/10">Chưa có tài liệu</p>
                  {isAdmin && <p className="text-[9px] font-bold text-white/5 mt-2">Bấm "Thêm tài liệu" để bắt đầu</p>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Document Viewer */}
        <div className="lg:col-span-7">
          <div className="bg-[#0f172a] rounded-[2rem] border border-white/5 h-[650px] flex flex-col overflow-hidden">
            {viewingDoc ? (
              <>
                <div className="p-6 border-b border-white/5 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-black uppercase tracking-tight truncate pr-4">{viewingDoc.name}</h3>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[9px] font-black uppercase bg-brand-primary/10 text-brand-primary px-4 py-1 rounded-full">{viewingDoc.category}</span>
                        <span className="text-[9px] font-bold text-white/20">{(viewingDoc.char_count || 0).toLocaleString()} ký tự</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {viewingDoc.file_url && (
                        <>
                          <button 
                            onClick={() => window.open(viewingDoc.file_url, '_blank')}
                            className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl hover:bg-indigo-500 hover:text-white transition-all"
                            title="Tải về máy"
                          >
                            <CloudUpload size={16} className="rotate-180" />
                          </button>
                          <button 
                            onClick={() => {
                              const url = viewingDoc.file_url;
                              const isOffice = url.toLowerCase().match(/\.(docx|xlsx|doc|xls)$/);
                              if (isOffice) {
                                window.open(`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`, '_blank');
                              } else {
                                window.open(url, '_blank');
                              }
                            }}
                            className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all"
                            title="Mở xem nhanh"
                          >
                            <ExternalLink size={16} />
                          </button>
                        </>
                      )}
                      <button onClick={() => setViewingDoc(null)} className="p-2 text-white/20 hover:text-red-400 transition-all">
                        <X size={20} />
                      </button>
                    </div>
                  </div>

                  {/* View Mode Tabs */}
                  <div className="flex bg-white/5 p-1 rounded-xl w-fit">
                    <button 
                      onClick={() => setViewMode('original')}
                      className={cn(
                        "px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                        viewMode === 'original' ? "bg-brand-primary text-brand-bg shadow-lg shadow-brand-primary/20" : "text-white/30 hover:text-white/60"
                      )}
                    >
                      Bản gốc O1R
                    </button>
                    <button 
                      onClick={() => setViewMode('ai')}
                      className={cn(
                        "px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                        viewMode === 'ai' ? "bg-brand-primary text-brand-bg shadow-lg shadow-brand-primary/20" : "text-white/30 hover:text-white/60"
                      )}
                    >
                      Dữ liệu AI
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden relative">
                  {viewMode === 'original' && viewingDoc.file_url ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center bg-[#020617]/20">
                      <div className="w-24 h-24 bg-brand-primary/10 rounded-[2.5rem] flex items-center justify-center border border-brand-primary/20 mb-8 animate-pulse">
                        <FileText size={48} className="text-brand-primary" />
                      </div>
                      <h4 className="text-xl font-black uppercase tracking-tight mb-4">Tài liệu gốc đã sẵn sàng</h4>
                      <p className="text-xs font-bold text-white/30 max-w-sm mb-10 leading-loose uppercase tracking-widest">
                        Để đảm bảo độ nét cao nhất và giữ nguyên định dạng bảng biểu, anh vui lòng xem ở chế độ cửa sổ mới.
                      </p>
                      
                      <div className="flex gap-4">
                        <button 
                          onClick={() => {
                            const url = viewingDoc.file_url;
                            const isOffice = url.toLowerCase().match(/\.(docx|xlsx|doc|xls)$/);
                            if (isOffice) {
                              window.open(`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`, '_blank');
                            } else {
                              window.open(url, '_blank');
                            }
                          }}
                          className="px-10 py-5 bg-brand-primary text-brand-bg rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-brand-primary/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                        >
                          <ExternalLink size={18} /> MỞ XEM FILE GỐC (O1R)
                        </button>
                        <button 
                          onClick={() => window.open(viewingDoc.file_url, '_blank')}
                          className="px-8 py-5 bg-white/5 border border-white/10 text-white/60 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all flex items-center gap-3"
                        >
                          <CloudUpload size={18} className="rotate-180" /> TẢI VỀ MÁY
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full overflow-y-auto p-10 bg-[#020617]/50">
                       <div className="max-w-4xl mx-auto space-y-6">
                         <div className="bg-brand-primary/5 border border-brand-primary/10 p-6 rounded-2xl flex items-center gap-4">
                            <DatabaseIcon size={20} className="text-brand-primary" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/60">Dữ liệu này đã được AI tối ưu hóa để trả lời câu hỏi của anh.</p>
                         </div>
                         <div className="custom-markdown leading-relaxed text-sm text-white/70 whitespace-pre-wrap font-medium">
                            {cleanExtractedText(viewingDoc.content)}
                         </div>
                       </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <BookOpen size={60} className="mx-auto mb-6 text-white/5" />
                  <p className="text-xs font-black uppercase tracking-widest text-white/10">Chọn tài liệu để xem nội dung</p>
                  <p className="text-[9px] font-bold text-white/5 mt-3 max-w-sm mx-auto leading-loose">
                    Kho Tri Thức giúp chatbot AI trả lời chính xác hơn. Anh upload tài liệu ISO, kỹ thuật ngành, văn bản pháp luật vào đây.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
