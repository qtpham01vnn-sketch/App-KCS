import React, { useState } from 'react';
import { Cpu, LogIn, UserPlus, ShieldCheck, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

// ========== AUTH HELPERS (localStorage) ==========
const AUTH_KEYS = {
  USERS: 'kcs_auth_users',
  SESSION: 'kcs_auth_session',
  PENDING: 'kcs_auth_pending',
  PROFILE: 'kcs_admin_profile',
};

// Default admin account
const DEFAULT_ADMIN = {
  id: 'admin_pn_01',
  username: 'admin',
  password: 'phuongnam2026',
  displayName: 'Phạm Quốc Tuấn',
  department: 'Ban Tổng giám đốc',
  role: 'admin',
  createdAt: new Date().toISOString(),
};

export function initAuth() {
  // Always ensure a valid admin account exists
  try {
    const raw = localStorage.getItem(AUTH_KEYS.USERS);
    const users = raw ? JSON.parse(raw) : [];
    const admin = users.find(u => u.role === 'admin');
    if (!admin) {
      // No admin found — reset with default
      localStorage.setItem(AUTH_KEYS.USERS, JSON.stringify([DEFAULT_ADMIN, ...users.filter(u => u.role !== 'admin')]));
    }
  } catch {
    // Corrupted data — full reset
    localStorage.setItem(AUTH_KEYS.USERS, JSON.stringify([DEFAULT_ADMIN]));
  }
  if (!localStorage.getItem(AUTH_KEYS.PENDING)) {
    localStorage.setItem(AUTH_KEYS.PENDING, JSON.stringify([]));
  }
}

// Call this to force-reset admin password (emergency)
export function resetAdminPassword() {
  const users = getUsers();
  const idx = users.findIndex(u => u.role === 'admin');
  if (idx >= 0) {
    users[idx].password = DEFAULT_ADMIN.password;
    users[idx].username = DEFAULT_ADMIN.username;
  } else {
    users.unshift(DEFAULT_ADMIN);
  }
  localStorage.setItem(AUTH_KEYS.USERS, JSON.stringify(users));
}

export function getUsers() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEYS.USERS) || '[]'); } 
  catch { return []; }
}

export function getPending() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEYS.PENDING) || '[]'); } 
  catch { return []; }
}

export function getSession() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEYS.SESSION) || 'null'); } 
  catch { return null; }
}

export function getProfile() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEYS.PROFILE) || 'null'); } 
  catch { return null; }
}

export function saveProfile(profile) {
  localStorage.setItem(AUTH_KEYS.PROFILE, JSON.stringify(profile));
}

export function login(username, password) {
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return { success: false, error: 'Sai tên đăng nhập hoặc mật khẩu!' };
  const session = { id: user.id, username: user.username, displayName: user.displayName, role: user.role, department: user.department };
  localStorage.setItem(AUTH_KEYS.SESSION, JSON.stringify(session));
  return { success: true, user: session };
}

export function logout() {
  localStorage.removeItem(AUTH_KEYS.SESSION);
}

export function requestAccess(displayName, department) {
  const pending = getPending();
  const id = `req_${Date.now()}`;
  pending.push({ id, displayName, department, requestedAt: new Date().toISOString() });
  localStorage.setItem(AUTH_KEYS.PENDING, JSON.stringify(pending));
  return id;
}

export function approveRequest(requestId, username, password) {
  const pending = getPending();
  const req = pending.find(r => r.id === requestId);
  if (!req) return false;
  
  const users = getUsers();
  users.push({
    id: `user_${Date.now()}`,
    username,
    password,
    displayName: req.displayName,
    department: req.department,
    role: 'viewer',
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem(AUTH_KEYS.USERS, JSON.stringify(users));
  localStorage.setItem(AUTH_KEYS.PENDING, JSON.stringify(pending.filter(r => r.id !== requestId)));
  return true;
}

export function rejectRequest(requestId) {
  const pending = getPending();
  localStorage.setItem(AUTH_KEYS.PENDING, JSON.stringify(pending.filter(r => r.id !== requestId)));
}

export function removeUser(userId) {
  const users = getUsers();
  localStorage.setItem(AUTH_KEYS.USERS, JSON.stringify(users.filter(u => u.id !== userId || u.role === 'admin')));
}

export function changeAdminPassword(oldPass, newPass) {
  const users = getUsers();
  const admin = users.find(u => u.role === 'admin');
  if (!admin || admin.password !== oldPass) return false;
  admin.password = newPass;
  localStorage.setItem(AUTH_KEYS.USERS, JSON.stringify(users));
  return true;
}

// ========== LOGIN GATE COMPONENT ==========
export default function LoginGate({ children, onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'request'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  
  // Request access form
  const [reqName, setReqName] = useState('');
  const [reqDept, setReqDept] = useState('Phòng KCS');
  const [reqSent, setReqSent] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    const result = login(username, password);
    if (result.success) {
      onLogin(result.user);
    } else {
      setError(result.error);
    }
  };

  const handleRequest = (e) => {
    e.preventDefault();
    if (!reqName.trim()) { setError('Vui lòng nhập họ tên!'); return; }
    requestAccess(reqName.trim(), reqDept);
    setReqSent(true);
    setError('');
  };

  return (
    <div className="min-h-screen w-full bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary/30 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/20 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-brand-primary/20 rounded-3xl flex items-center justify-center border border-brand-primary/30 shadow-[0_0_40px_rgba(14,165,233,0.3)] mx-auto mb-6">
            <Cpu className="text-brand-primary" size={40} />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">PHƯƠNG NAM</h1>
          <p className="text-[10px] font-black text-brand-primary uppercase tracking-[4px] animate-pulse">Smart KCS AI — Industrial System</p>
        </div>

        {/* Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} autoComplete="off" className="glass-card p-10 rounded-[3rem] space-y-6 border-brand-primary/10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-lg font-black uppercase tracking-tight text-center flex items-center justify-center gap-3">
              <ShieldCheck className="text-brand-primary" size={24} /> Đăng nhập hệ thống
            </h2>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-black">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Tên đăng nhập</label>
              <input 
                type="text" 
                name="kcs_user"
                autoComplete="off"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl font-black text-sm outline-none focus:border-brand-primary transition-all"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Mật khẩu</label>
              <div className="relative">
                <input 
                  type={showPass ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 p-5 pr-14 rounded-2xl font-black text-sm outline-none focus:border-brand-primary transition-all"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-brand-primary transition-all">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="w-full bg-brand-primary text-brand-bg py-5 rounded-2xl font-black uppercase tracking-[4px] shadow-lg shadow-brand-primary/30 flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-[0.99] transition-all text-sm">
              <LogIn size={20} /> Đăng nhập
            </button>

            <div className="text-center pt-2">
              <button type="button" onClick={() => { setMode('request'); setError(''); }} className="text-[10px] font-black text-brand-primary/60 uppercase tracking-widest hover:text-brand-primary transition-all">
                <UserPlus size={12} className="inline mr-2" /> Yêu cầu quyền truy cập
              </button>
            </div>
          </form>
        )}

        {/* Request Access Form */}
        {mode === 'request' && !reqSent && (
          <form onSubmit={handleRequest} className="glass-card p-10 rounded-[3rem] space-y-6 border-brand-primary/10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-lg font-black uppercase tracking-tight text-center flex items-center justify-center gap-3">
              <UserPlus className="text-brand-primary" size={24} /> Yêu cầu truy cập
            </h2>
            <p className="text-[10px] text-white/30 text-center font-bold uppercase tracking-widest">Gửi yêu cầu đến Quản trị viên để được cấp quyền xem</p>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-black">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Họ tên</label>
              <input type="text" value={reqName} onChange={(e) => setReqName(e.target.value)} placeholder="Nguyễn Văn A" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl font-black text-sm outline-none focus:border-brand-primary transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Phòng ban</label>
              <select value={reqDept} onChange={(e) => setReqDept(e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl font-black text-sm outline-none focus:border-brand-primary appearance-none">
                <option className="bg-[#020617]">Phòng KCS</option>
                <option className="bg-[#020617]">Phòng Lab</option>
                <option className="bg-[#020617]">Phòng Công nghệ</option>
                <option className="bg-[#020617]">Ban Tổng giám đốc</option>
                <option className="bg-[#020617]">PXSX</option>
                <option className="bg-[#020617]">PXCĐ-NL</option>
              </select>
            </div>

            <button type="submit" className="w-full bg-brand-primary text-brand-bg py-5 rounded-2xl font-black uppercase tracking-[4px] shadow-lg shadow-brand-primary/30 flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-[0.99] transition-all text-sm">
              <UserPlus size={20} /> Gửi yêu cầu
            </button>
            <div className="text-center">
              <button type="button" onClick={() => { setMode('login'); setError(''); }} className="text-[10px] font-black text-white/30 uppercase tracking-widest hover:text-brand-primary transition-all">← Quay lại đăng nhập</button>
            </div>
          </form>
        )}

        {/* Request Sent Success */}
        {mode === 'request' && reqSent && (
          <div className="glass-card p-10 rounded-[3rem] text-center space-y-6 border-emerald-500/20 animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircle2 className="text-emerald-400" size={40} />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight text-emerald-400">Đã gửi yêu cầu!</h3>
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest leading-loose">
              Vui lòng liên hệ Quản trị viên để được duyệt quyền truy cập. Sau khi được duyệt, bạn sẽ nhận tài khoản đăng nhập.
            </p>
            <button onClick={() => { setMode('login'); setReqSent(false); setReqName(''); }} className="text-[10px] font-black text-brand-primary uppercase tracking-widest hover:underline">← Quay lại đăng nhập</button>
          </div>
        )}

        {/* Footer */}
        <p className="text-center mt-8 text-[9px] font-mono text-white/10 tracking-widest">v1.1 — Phương Nam Smart KCS AI</p>
      </div>
    </div>
  );
}
