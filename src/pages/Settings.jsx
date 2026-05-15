import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User, Shield, Bell, Database, Users, Key, Briefcase,
  Save, Crown, AlertCircle, Activity, Cloud, LogOut,
  CheckCircle2, XCircle, Trash2, RefreshCw, HardDrive, Eye, EyeOff
} from 'lucide-react';
import { getUsers, getPending, approveRequest, rejectRequest, removeUser, changeAdminPassword, getProfile, saveProfile } from '../components/LoginGate';
import { supabase } from '../lib/supabase';

export default function Settings({ 
  cloudLogs: externalCloudLogs, 
  currentUser: externalUser, 
  onLogout, 
  onProfileUpdate 
}) {
  const { user: authUser, profile: authProfile } = useAuth();
  const currentUser = externalUser || authProfile || { role: 'admin', displayName: 'Quản trị viên' };
  
  const [internalCloudLogs, setInternalCloudLogs] = useState([]);
  
  useEffect(() => {
    if (!externalCloudLogs) {
      supabase.from('kiln_dryer_reports').select('*').then(({ data }) => setInternalCloudLogs(data || []));
    }
  }, [externalCloudLogs]);

  const cloudLogs = externalCloudLogs || internalCloudLogs;
  const [activeTab, setActiveTab] = useState('Hồ sơ cá nhân');
  const isAdmin = currentUser?.role === 'admin';

  // Profile state
  const [profile, setProfile] = useState(() => {
    const saved = getProfile();
    return saved || { displayName: currentUser?.displayName || 'Hệ thống KCS', department: currentUser?.department || 'Ban Tổng giám đốc', position: 'Quản trị viên hệ thống' };
  });
  const [profileSaved, setProfileSaved] = useState(false);

  // Password state
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Pending & Users
  const [pending, setPending] = useState(getPending());
  const [users, setUsers] = useState(getUsers());
  const [approveForm, setApproveForm] = useState({});

  // Reset modal
  const [showReset, setShowReset] = useState(false);
  const [resetConfirm, setResetConfirm] = useState('');
  const [resetStatus, setResetStatus] = useState('');

  // System stats
  const [dbStatus, setDbStatus] = useState('checking');
  useEffect(() => {
    supabase.from('kiln_dryer_reports').select('id', { count: 'exact', head: true })
      .then(({ error }) => setDbStatus(error ? 'offline' : 'online'))
      .catch(() => setDbStatus('offline'));
  }, []);

  const refreshData = () => { setPending(getPending()); setUsers(getUsers()); };

  const tabs = [
    { label: 'Hồ sơ cá nhân', icon: User },
    ...(isAdmin ? [{ label: 'Quản trị nhân sự', icon: Users }] : []),
    { label: 'Bảo mật & Quyền', icon: Shield },
    ...(isAdmin ? [{ label: 'Thông báo', icon: Bell, badge: pending.length }] : []),
    { label: 'Dữ liệu hệ thống', icon: Database },
  ];

  const inputCls = "w-full bg-white/5 border border-white/10 p-5 rounded-2xl font-bold text-sm outline-none focus:border-brand-primary transition-all";
  const labelCls = "text-[10px] font-black text-white/30 uppercase tracking-widest";

  const handleSaveProfile = () => {
    saveProfile(profile);
    // Update session in localStorage so Header refreshes
    const session = JSON.parse(localStorage.getItem('kcs_auth_session') || '{}');
    session.displayName = profile.displayName;
    session.department = profile.department;
    localStorage.setItem('kcs_auth_session', JSON.stringify(session));
    // Notify App.jsx to refresh currentUser
    if (onProfileUpdate) onProfileUpdate(session);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleChangePassword = () => {
    setPassMsg('');
    if (newPass.length < 6) { setPassMsg('Mật khẩu mới phải từ 6 ký tự!'); return; }
    if (newPass !== confirmPass) { setPassMsg('Xác nhận mật khẩu không khớp!'); return; }
    if (changeAdminPassword(oldPass, newPass)) {
      setPassMsg('✅ Đổi mật khẩu thành công!');
      setOldPass(''); setNewPass(''); setConfirmPass('');
    } else { setPassMsg('Mật khẩu cũ không đúng!'); }
  };

  const handleApprove = (reqId) => {
    const form = approveForm[reqId];
    if (!form?.username || !form?.password) return;
    approveRequest(reqId, form.username, form.password);
    refreshData();
    setApproveForm(prev => { const n = {...prev}; delete n[reqId]; return n; });
  };

  const handleReject = (reqId) => { rejectRequest(reqId); refreshData(); };
  const handleRemoveUser = (userId) => { removeUser(userId); refreshData(); };

  const handleReset = async () => {
    if (resetConfirm !== 'XÓA TẤT CẢ') return;
    setResetStatus('deleting');
    try {
      const { error } = await supabase.from('kiln_dryer_reports').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      setResetStatus('done');
    } catch (err) { setResetStatus('error: ' + err.message); }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Hồ sơ cá nhân':
        return (
          <div className="glass-card p-10 rounded-[3rem] space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
              <User className="text-brand-primary" /> Thông tin {isAdmin ? 'quản trị' : 'cá nhân'}
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className={labelCls}>Tên hiển thị</label>
                <input type="text" value={profile.displayName} onChange={e => setProfile({...profile, displayName: e.target.value})} className={inputCls} />
              </div>
              <div className="space-y-2">
                <label className={labelCls}>Mã định danh</label>
                <input type="text" value={currentUser?.id || 'N/A'} readOnly className={`${inputCls} opacity-50 cursor-not-allowed`} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className={labelCls}>Phòng ban</label>
                <div className="relative">
                  <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-primary/40" size={18} />
                  <select value={profile.department} onChange={e => setProfile({...profile, department: e.target.value})} className={`${inputCls} pl-14 appearance-none`}>
                    {['Ban Tổng giám đốc','Phòng Công nghệ','Phòng KCS','Phòng Lab','PXSX','PXCĐ-NL'].map(d => <option key={d} className="bg-[#020617]">{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className={labelCls}>Vai trò</label>
                <div className="relative">
                  <Crown className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-primary/40" size={18} />
                  <input type="text" value={isAdmin ? 'Quản trị viên (Admin)' : 'Người xem (Viewer)'} readOnly className={`${inputCls} pl-14 opacity-50 cursor-not-allowed`} />
                </div>
              </div>
            </div>
            {profileSaved ? (
              <div className="flex items-center justify-center gap-3 text-emerald-400 font-black uppercase tracking-widest bg-emerald-500/10 py-5 rounded-2xl border border-emerald-500/20">
                <CheckCircle2 size={20} /> Đã lưu hồ sơ!
              </div>
            ) : (
              <button onClick={handleSaveProfile} className="w-full bg-brand-primary text-brand-bg py-6 rounded-2xl font-black uppercase tracking-[4px] shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-[0.99] transition-all">
                <Save size={20} /> Lưu hồ sơ
              </button>
            )}
          </div>
        );

      case 'Quản trị nhân sự':
        return (
          <div className="glass-card p-10 rounded-[3rem] space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
              <Users className="text-brand-primary" /> Danh sách người dùng ({users.length})
            </h3>
            <div className="space-y-3">
              {users.map(u => (
                <div key={u.id} className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-brand-primary/20 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${u.role === 'admin' ? 'bg-brand-primary/20 text-brand-primary' : 'bg-indigo-500/20 text-indigo-400'}`}>
                      {u.role === 'admin' ? <Crown size={18} /> : <User size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-black">{u.displayName}</p>
                      <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">@{u.username} · {u.department} · {u.role === 'admin' ? 'ADMIN' : 'VIEWER'}</p>
                    </div>
                  </div>
                  {u.role !== 'admin' && (
                    <button onClick={() => handleRemoveUser(u.id)} className="p-2 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'Bảo mật & Quyền':
        return (
          <div className="glass-card p-10 rounded-[3rem] space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
              <Shield className="text-brand-primary" /> {isAdmin ? 'Đổi mật khẩu Admin' : 'Thông tin bảo mật'}
            </h3>
            {isAdmin ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className={labelCls}>Mật khẩu hiện tại</label>
                  <div className="relative">
                    <input type={showOld ? "text" : "password"} value={oldPass} onChange={e => setOldPass(e.target.value)} className={inputCls} />
                    <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20"><Eye size={16} /></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className={labelCls}>Mật khẩu mới</label>
                    <div className="relative">
                      <input type={showNew ? "text" : "password"} value={newPass} onChange={e => setNewPass(e.target.value)} className={inputCls} />
                      <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20"><Eye size={16} /></button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className={labelCls}>Xác nhận mật khẩu mới</label>
                    <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} className={inputCls} />
                  </div>
                </div>
                {passMsg && (
                  <div className={`p-4 rounded-2xl text-xs font-black ${passMsg.includes('✅') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {passMsg}
                  </div>
                )}
                <button onClick={handleChangePassword} className="w-full bg-brand-primary text-brand-bg py-5 rounded-2xl font-black uppercase tracking-[4px] shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-[0.99] transition-all">
                  <Key size={20} /> Cập nhật mật khẩu
                </button>
              </div>
            ) : (
              <div className="text-center py-10 text-white/20">
                <Shield size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-xs font-black uppercase tracking-widest">Bạn đang đăng nhập với quyền Viewer</p>
                <p className="text-[10px] text-white/10 mt-2">Liên hệ Admin để thay đổi mật khẩu</p>
              </div>
            )}
          </div>
        );

      case 'Thông báo':
        return (
          <div className="glass-card p-10 rounded-[3rem] space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
              <Bell className="text-brand-primary" /> Yêu cầu truy cập ({pending.length})
            </h3>
            {pending.length === 0 ? (
              <div className="text-center py-12 text-white/20">
                <Bell size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-xs font-black uppercase tracking-widest">Không có yêu cầu nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pending.map(req => {
                  const form = approveForm[req.id] || {};
                  return (
                    <div key={req.id} className="p-6 bg-white/5 rounded-2xl border border-amber-500/20 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-black text-sm">{req.displayName}</p>
                          <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{req.department} · {new Date(req.requestedAt).toLocaleString('vi-VN')}</p>
                        </div>
                        <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-[9px] font-black rounded-full uppercase">Chờ duyệt</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="Username cấp cho user" value={form.username || ''} onChange={e => setApproveForm({...approveForm, [req.id]: {...form, username: e.target.value}})} className="bg-white/5 border border-white/10 p-3 rounded-xl text-xs font-bold outline-none focus:border-brand-primary" />
                        <input type="text" placeholder="Mật khẩu cấp cho user" value={form.password || ''} onChange={e => setApproveForm({...approveForm, [req.id]: {...form, password: e.target.value}})} className="bg-white/5 border border-white/10 p-3 rounded-xl text-xs font-bold outline-none focus:border-brand-primary" />
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => handleApprove(req.id)} disabled={!form.username || !form.password} className="flex-1 bg-emerald-500/20 text-emerald-400 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-30">
                          <CheckCircle2 size={14} /> Duyệt & Cấp TK
                        </button>
                        <button onClick={() => handleReject(req.id)} className="px-6 bg-red-500/10 text-red-400 py-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-red-500 hover:text-white transition-all">
                          <XCircle size={14} /> Từ chối
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'Dữ liệu hệ thống':
        const totalLogs = cloudLogs.length;
        const kilnLogs = cloudLogs.filter(l => l.kiln_type !== 'Lò Sấy').length;
        const dryerLogs = cloudLogs.filter(l => l.kiln_type === 'Lò Sấy').length;
        const latestLog = cloudLogs[0];
        return (
          <div className="glass-card p-10 rounded-[3rem] space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
              <Database className="text-brand-primary" /> Thống kê hệ thống
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Tổng mẻ', value: totalLogs, color: 'brand-primary' },
                { label: 'Lò Nung', value: kilnLogs, color: 'emerald-400' },
                { label: 'Lò Sấy', value: dryerLogs, color: 'blue-400' },
              ].map(s => (
                <div key={s.label} className="p-6 bg-white/5 rounded-2xl border border-white/5 text-center">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">{s.label}</p>
                  <p className={`text-3xl font-black text-${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-3"><Cloud size={16} className="text-brand-primary" /><span className="text-xs font-black uppercase">Supabase</span></div>
                <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${dbStatus === 'online' ? 'bg-emerald-500/20 text-emerald-400' : dbStatus === 'checking' ? 'bg-amber-500/20 text-amber-400 animate-pulse' : 'bg-red-500/20 text-red-400'}`}>
                  {dbStatus === 'online' ? '● Online' : dbStatus === 'checking' ? '◌ Đang kiểm tra...' : '● Offline'}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-3"><Activity size={16} className="text-brand-primary" /><span className="text-xs font-black uppercase">Gemini AI</span></div>
                <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400">● Sẵn sàng</span>
              </div>
              {latestLog && (
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3"><HardDrive size={16} className="text-brand-primary" /><span className="text-xs font-black uppercase">Mẻ mới nhất</span></div>
                  <span className="text-[10px] font-black text-white/50">{latestLog.product_type} — {new Date(latestLog.created_at).toLocaleString('vi-VN')}</span>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="glass-card p-12 rounded-[3rem] text-center animate-in fade-in duration-500">
            <p className="text-white/20 font-black uppercase tracking-widest">Tính năng đang được thiết lập</p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="space-y-3">
          {tabs.map((item, i) => (
            <button key={i} onClick={() => setActiveTab(item.label)}
              className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl transition-all border relative ${activeTab === item.label ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary shadow-lg shadow-brand-primary/10' : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10'}`}>
              <item.icon size={20} />
              <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
              {item.badge > 0 && <span className="absolute right-4 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">{item.badge}</span>}
            </button>
          ))}

          {/* Logout */}
          <button onClick={onLogout} className="w-full flex items-center gap-4 px-6 py-5 rounded-2xl bg-white/5 border border-transparent text-white/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all mt-6">
            <LogOut size={20} />
            <span className="text-xs font-black uppercase tracking-widest">Đăng xuất</span>
          </button>

          {/* Danger Zone - Admin only */}
          {isAdmin && (
            <div className="glass-card p-6 rounded-[2rem] border-red-500/10 bg-red-500/5 mt-6">
              <div className="flex items-center gap-4 text-red-500 mb-3">
                <AlertCircle size={20} />
                <h4 className="text-[10px] font-black uppercase tracking-widest">Khu vực nguy hiểm</h4>
              </div>
              <button onClick={() => setShowReset(true)} className="w-full text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-500/10 py-3 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                Reset Toàn bộ dữ liệu
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="md:col-span-2">{renderContent()}</div>
      </div>

      {/* Reset Modal */}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => { setShowReset(false); setResetConfirm(''); setResetStatus(''); }}>
          <div className="glass-card p-10 rounded-[3rem] max-w-md w-full space-y-6 border-red-500/20 animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-black uppercase text-red-500">Xác nhận xóa</h3>
              <p className="text-[10px] text-white/30 font-bold mt-2 uppercase tracking-widest">Hành động này sẽ xóa toàn bộ dữ liệu mẻ nung trên Cloud. Không thể hoàn tác!</p>
            </div>
            {resetStatus === 'done' ? (
              <div className="text-center text-emerald-400 font-black uppercase tracking-widest py-4">
                <CheckCircle2 size={32} className="mx-auto mb-2" /> Đã xóa thành công!
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-red-500/60 uppercase tracking-widest">Gõ "XÓA TẤT CẢ" để xác nhận</label>
                  <input type="text" value={resetConfirm} onChange={e => setResetConfirm(e.target.value)} placeholder="XÓA TẤT CẢ" className="w-full bg-red-500/5 border border-red-500/20 p-4 rounded-2xl font-black text-sm outline-none focus:border-red-500 text-red-400 text-center uppercase" />
                </div>
                <button onClick={handleReset} disabled={resetConfirm !== 'XÓA TẤT CẢ' || resetStatus === 'deleting'} className="w-full bg-red-500 text-white py-5 rounded-2xl font-black uppercase tracking-[4px] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-red-600 transition-all">
                  {resetStatus === 'deleting' ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
