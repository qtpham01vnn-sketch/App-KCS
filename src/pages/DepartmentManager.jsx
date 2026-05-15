import React, { useState, useEffect, useRef } from 'react';
import { 
  Users2, FileText, ShieldCheck, UserCheck, 
  History, ArrowLeft, Search, LayoutGrid, 
  List, Building2, ChevronRight, FileSpreadsheet,
  Download, Plus, Upload, Loader2, CheckCircle2,
  FileUp, AlertCircle, Eye, ExternalLink, X, PlusCircle, Edit3, Trash2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

// --- MODALS ---

const ModalBase = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="glass-card w-full max-w-md rounded-[2.5rem] border border-white/10 p-10 relative animate-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute right-6 top-6 text-white/20 hover:text-white transition-colors"><X size={24} /></button>
        <h3 className="text-3xl font-black uppercase tracking-tighter mb-8 text-brand-primary leading-tight">{title}</h3>
        {children}
      </div>
    </div>
  );
};

// --- COMPONENTS ---

const FormCard = ({ form, onUploadSuccess, onEdit, onDelete }) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${form.code}_${Date.now()}.${fileExt}`;
      const filePath = `${form.procedure_id}/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('iso-documents').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('iso-documents').getPublicUrl(filePath);
      const { error: updateError } = await supabase.from('kcs_iso_forms').update({ file_url: publicUrl }).eq('id', form.id);
      if (updateError) throw updateError;
      onUploadSuccess();
    } catch (err) { alert(err.message); } 
    finally { setUploading(false); }
  };

  const handleViewFile = () => {
    if (!form.file_url) return;
    const url = form.file_url;
    const isOfficeFile = url.toLowerCase().endsWith('.docx') || url.toLowerCase().endsWith('.xlsx') || url.toLowerCase().endsWith('.doc') || url.toLowerCase().endsWith('.xls');
    if (isOfficeFile) {
      window.open(`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`, '_blank');
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="glass-card p-8 rounded-[2rem] border border-white/5 hover:border-brand-primary/40 transition-all group relative overflow-hidden bg-white/[0.02]">
      <div className="absolute right-4 top-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button onClick={() => onEdit(form)} className="p-2 bg-white/5 text-white/40 hover:text-brand-primary rounded-lg border border-white/10 transition-all"><Edit3 size={12} /></button>
        <button onClick={() => onDelete(form.id)} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"><Trash2 size={12} /></button>
      </div>
      
      <div className="flex items-start justify-between mb-6">
        <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center border border-brand-primary/20"><FileSpreadsheet size={24} className="text-brand-primary" /></div>
        <div className="flex flex-col gap-2">
          <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" />
          <button onClick={() => fileInputRef.current.click()} disabled={uploading} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", form.file_url ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-brand-primary text-white shadow-[0_0_20px_rgba(14,165,233,0.3)]")}>
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <><FileUp size={14} /> {form.file_url ? "Cập nhật" : "Tải lên"}</>}
          </button>
          {form.file_url && <button onClick={handleViewFile} className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-white/60 text-[10px] font-black uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all"><Eye size={14} /> Xem</button>}
        </div>
      </div>
      <div className="space-y-2">
        <span className="text-[10px] font-black text-brand-primary uppercase tracking-[2px]">{form.code}</span>
        <h5 className="font-black text-lg tracking-tighter uppercase leading-tight group-hover:text-brand-primary transition-colors">{form.name}</h5>
      </div>
    </div>
  );
};

export default function DepartmentManager() {
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [procedures, setProcedures] = useState([]);
  const [forms, setForms] = useState({});
  const [loading, setLoading] = useState(true);

  const [modals, setModals] = useState({ dept: false, proc: false, form: false });
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  
  const [newDept, setNewDept] = useState({ name: '', description: '' });
  const [newProc, setNewProc] = useState({ code: '', name: '', version: '1.0' });
  const [newForm, setNewForm] = useState({ code: '', name: '', drafter: 'P.Q. Tuấn', approver: 'Giám Đốc' });

  useEffect(() => { fetchDepartments(); }, []);

  async function fetchDepartments() {
    setLoading(true);
    const { data } = await supabase.from('kcs_departments').select('*').order('name');
    setDepartments(data || []);
    setLoading(false);
  }

  async function loadISOData(dept) {
    const { data: qts } = await supabase.from('kcs_iso_procedures').select('*').eq('department_id', dept.id).order('code');
    setProcedures(qts || []);
    if (qts?.length > 0) {
      const { data: bms } = await supabase.from('kcs_iso_forms').select('*').in('procedure_id', qts.map(q => q.id));
      const grouped = (bms || []).reduce((acc, b) => {
        if (!acc[b.procedure_id]) acc[b.procedure_id] = [];
        acc[b.procedure_id].push(b);
        return acc;
      }, {});
      setForms(grouped);
    }
  }

  const handleAddOrEditDept = async (e) => {
    e.preventDefault();
    if (isEditMode) {
      await supabase.from('kcs_departments').update(newDept).eq('id', activeItem.id);
    } else {
      await supabase.from('kcs_departments').insert([newDept]);
    }
    fetchDepartments();
    setModals({...modals, dept: false});
    setNewDept({name:'', description:''});
  };

  const handleAddOrEditProc = async (e) => {
    e.preventDefault();
    if (isEditMode) {
      await supabase.from('kcs_iso_procedures').update(newProc).eq('id', activeItem.id);
    } else {
      await supabase.from('kcs_iso_procedures').insert([{ ...newProc, department_id: selectedDept.id }]);
    }
    loadISOData(selectedDept);
    setModals({...modals, proc: false});
    setNewProc({code:'', name:'', version:'1.0'});
  };

  const handleAddOrEditForm = async (e) => {
    e.preventDefault();
    if (isEditMode) {
      await supabase.from('kcs_iso_forms').update(newForm).eq('id', activeItem.id);
    } else {
      await supabase.from('kcs_iso_forms').insert([{ ...newForm, procedure_id: activeItem.id }]);
    }
    loadISOData(selectedDept);
    setModals({...modals, form: false});
    setNewForm({code:'', name:'', drafter:'P.Q. Tuấn', approver:'Giám Đốc'});
  };

  const deleteItem = async (table, id) => {
    if (!confirm('Anh có chắc muốn xóa không?')) return;
    await supabase.from(table).delete().eq('id', id);
    if (table === 'kcs_departments') fetchDepartments();
    else loadISOData(selectedDept);
  };

  if (selectedDept) {
    return (
      <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
        <button onClick={() => setSelectedDept(null)} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[3px] text-white/40 hover:text-brand-primary transition-all group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1" /> Quay lại danh sách
        </button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="w-20 h-20 bg-brand-primary/10 rounded-[2rem] flex items-center justify-center border border-brand-primary/20"><Building2 size={32} className="text-brand-primary" /></div>
            <div>
              <div className="flex items-center gap-4">
                <h1 className="text-5xl font-black tracking-tighter uppercase mb-1">{selectedDept.name}</h1>
                <button onClick={() => deleteItem('kcs_departments', selectedDept.id)} className="text-white/10 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
              </div>
              <p className="text-xs font-bold text-white/40 uppercase tracking-[3px]">{selectedDept.description}</p>
            </div>
          </div>
          <button onClick={() => { setIsEditMode(false); setModals({...modals, proc: true}); }} className="flex items-center gap-3 px-6 py-4 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-2xl font-black uppercase text-xs hover:bg-brand-primary hover:text-white transition-all">
            <PlusCircle size={18} /> Thêm Quy Trình (QT)
          </button>
        </div>

        <div className="space-y-16 pt-12">
          {procedures.map(proc => (
            <div key={proc.id} className="space-y-8 group/proc">
              <div className="flex items-center justify-between border-b border-white/5 pb-6">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-white/[0.03] rounded-2xl flex items-center justify-center border border-white/5"><FileText size={24} className="text-brand-primary" /></div>
                  <h2 className="text-2xl font-black uppercase">{proc.code}: {proc.name}</h2>
                  <div className="flex items-center gap-3 opacity-0 group-hover/proc:opacity-100 transition-opacity">
                    <button onClick={() => { setIsEditMode(true); setActiveItem(proc); setNewProc({code: proc.code, name: proc.name, version: proc.version}); setModals({...modals, proc: true}); }} className="p-2 text-white/20 hover:text-brand-primary transition-colors"><Edit3 size={16} /></button>
                    <button onClick={() => deleteItem('kcs_iso_procedures', proc.id)} className="p-2 text-white/10 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {forms[proc.id]?.map(form => (
                  <FormCard 
                    key={form.id} 
                    form={form} 
                    onUploadSuccess={() => loadISOData(selectedDept)}
                    onEdit={(f) => { setIsEditMode(true); setActiveItem(f); setNewForm({code: f.code, name: f.name, drafter: f.drafter, approver: f.approver}); setModals({...modals, form: true}); }}
                    onDelete={(id) => deleteItem('kcs_iso_forms', id)}
                  />
                ))}
                <button onClick={() => { setIsEditMode(false); setActiveItem(proc); setModals({...modals, form: true}); }} className="border-2 border-dashed border-white/5 rounded-[2rem] flex flex-col items-center justify-center p-8 text-white/10 hover:text-brand-primary hover:border-brand-primary/40 cursor-pointer transition-all min-h-[200px]">
                  <Plus size={32} className="mb-4" /><span className="text-[10px] font-black uppercase tracking-[2px]">Thêm biểu mẫu</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Thêm/Sửa Quy Trình */}
        <ModalBase isOpen={modals.proc} onClose={() => setModals({...modals, proc: false})} title={isEditMode ? "Sửa Quy Trình" : "Thêm Quy Trình"}>
          <form onSubmit={handleAddOrEditProc} className="space-y-6">
            <input required value={newProc.code} onChange={e => setNewProc({...newProc, code: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black uppercase outline-none focus:border-brand-primary" placeholder="Mã QT (VD: QT.12)" />
            <input required value={newProc.name} onChange={e => setNewProc({...newProc, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black uppercase outline-none focus:border-brand-primary" placeholder="Tên Quy trình" />
            <button type="submit" className="w-full bg-brand-primary text-white font-black uppercase py-5 rounded-2xl">{isEditMode ? "Cập nhật ngay" : "Xác nhận thêm"}</button>
          </form>
        </ModalBase>

        {/* Modal Thêm/Sửa Biểu Mẫu */}
        <ModalBase isOpen={modals.form} onClose={() => setModals({...modals, form: false})} title={isEditMode ? "Sửa Biểu Mẫu" : "Thêm Biểu Mẫu"}>
          <form onSubmit={handleAddOrEditForm} className="space-y-6">
            <input required value={newForm.code} onChange={e => setNewForm({...newForm, code: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black uppercase outline-none focus:border-brand-primary" placeholder="Mã BM (VD: BM.12.01)" />
            <input required value={newForm.name} onChange={e => setNewForm({...newForm, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black uppercase outline-none focus:border-brand-primary" placeholder="Tên Biểu mẫu" />
            <button type="submit" className="w-full bg-brand-primary text-white font-black uppercase py-5 rounded-2xl">{isEditMode ? "Cập nhật ngay" : "Xác nhận thêm"}</button>
          </form>
        </ModalBase>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-black tracking-tighter uppercase">Hệ thống <span className="text-brand-primary">Phòng ban ISO</span></h1>
        <button onClick={() => { setIsEditMode(false); setModals({...modals, dept: true}); }} className="flex items-center gap-3 px-6 py-4 bg-brand-primary text-white rounded-2xl font-black uppercase text-xs shadow-[0_0_30px_rgba(14,165,233,0.3)] hover:scale-105 transition-all">
          <PlusCircle size={18} /> Thêm Phòng Ban
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {departments.map((dept) => (
          <div key={dept.id} className="group relative">
            <button onClick={() => { setSelectedDept(dept); loadISOData(dept); }} className="w-full glass-card p-10 rounded-[3rem] border border-white/5 hover:border-brand-primary/30 transition-all text-left overflow-hidden bg-white/[0.01]">
              <div className="w-20 h-20 bg-brand-primary/10 rounded-[2rem] flex items-center justify-center border border-brand-primary/20 mb-8"><Building2 size={36} className="text-brand-primary" /></div>
              <h3 className="font-black text-3xl tracking-tighter uppercase leading-none mb-3">{dept.name}</h3>
              <p className="text-[11px] font-bold text-white/40 uppercase tracking-[2px] line-clamp-1">{dept.description}</p>
            </button>
            <div className="absolute right-6 top-6 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <button onClick={() => { setIsEditMode(true); setActiveItem(dept); setNewDept({name: dept.name, description: dept.description}); setModals({...modals, dept: true}); }} className="p-3 bg-white/5 text-white/40 hover:text-brand-primary rounded-2xl border border-white/10 transition-all"><Edit3 size={16} /></button>
              <button onClick={() => deleteItem('kcs_departments', dept.id)} className="p-3 bg-white/5 text-white/40 hover:text-red-500 rounded-2xl border border-white/10 transition-all"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      <ModalBase isOpen={modals.dept} onClose={() => setModals({...modals, dept: false})} title={isEditMode ? "Sửa Phòng Ban" : "Thêm Phòng Ban"}>
        <form onSubmit={handleAddOrEditDept} className="space-y-6">
          <input required value={newDept.name} onChange={e => setNewDept({...newDept, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black uppercase outline-none focus:border-brand-primary" placeholder="Tên phòng ban" />
          <input required value={newDept.description} onChange={e => setNewDept({...newDept, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-black uppercase outline-none focus:border-brand-primary" placeholder="Mô tả" />
          <button type="submit" className="w-full bg-brand-primary text-white font-black uppercase py-5 rounded-2xl">{isEditMode ? "Cập nhật ngay" : "Tạo phòng ban"}</button>
        </form>
      </ModalBase>
    </div>
  );
}
