import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  Settings, 
  Layers, 
  PlusCircle, 
  FolderHeart, 
  MessageSquare, 
  CheckCircle2, 
  RefreshCw 
} from 'lucide-react';
import { AmbianceSelector } from './AmbianceSelector';
import confetti from 'canvas-confetti';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [isAmbianceOpen, setIsAmbianceOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleSyncStitch = () => {
    setIsSyncing(true);
    // Simulate Fetching latest design tokens from Stitch project
    setTimeout(() => {
      setIsSyncing(false);
      setToastMessage('Đã đồng bộ thành công thiết kế "Luminous Keepsake" từ Google Stitch!');
      
      // Fire beautiful rose-gold confetti!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#c5a391', '#e9d6cb', '#745849', '#fcf9f8']
      });

      // Clear toast after 3s
      setTimeout(() => {
        setToastMessage(null);
      }, 3500);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface transition-colors duration-500 pb-8 relative selection:bg-primary/20 selection:text-primary">
      {/* Dynamic Toast feedback */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-bounce bg-surface-container-lowest border-2 border-primary/20 text-on-surface px-5 py-3 rounded-full shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* TopAppBar */}
      <header className="bg-surface/80 backdrop-blur-md sticky top-0 z-40 flex justify-between items-center w-full px-6 py-4 border-b border-outline/5">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="material-symbols-outlined text-primary text-2xl transition-transform group-hover:rotate-12" data-icon="auto_stories">auto_stories</span>
            <h1 className="font-headline text-2xl font-bold tracking-tight text-primary">Memories</h1>
          </Link>
          <span className="px-2 py-0.5 rounded bg-primary/10 text-[10px] font-bold uppercase tracking-widest text-primary hidden sm:inline-block">PRO</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Sync Button */}
          <button
            onClick={handleSyncStitch}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container hover:bg-surface-container-high rounded-full text-xs font-semibold text-primary transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Đồng bộ...' : 'Sync with Stitch'}</span>
          </button>

          {/* Settings / Ambiance Dial Trigger */}
          <button 
            onClick={() => setIsAmbianceOpen(true)}
            className="p-2 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors relative"
            title="Đổi chủ đề màu sắc"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* Profile Picture */}
          <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/20 shadow-sm">
            <img 
              alt="Profile" 
              className="w-full h-full object-cover"
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop"
            />
          </div>
        </div>
      </header>

      {/* Main Page Area */}
      <main className="max-w-4xl mx-auto px-4 py-6 md:px-6 md:pl-20">
        {children}
      </main>

      {/* Left Vertical NavBar (Floating Glassmorphism style for desktop) */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40 hidden md:block">
        <nav className="flex flex-col gap-6 px-3.5 py-6 bg-surface-container/85 backdrop-blur-xl border border-outline/10 rounded-2xl shadow-xl shadow-black/20">
          <Link 
            to="/" 
            className={`flex flex-col items-center justify-center transition-all duration-200 hover:scale-105 ${isActive('/') ? 'text-primary scale-110 font-bold' : 'text-on-surface-variant opacity-60 hover:opacity-90'}`}
            title="Feed"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${isActive('/') ? 1 : 0}` }}>auto_awesome_motion</span>
            <span className="text-[8px] tracking-wider font-bold uppercase mt-1">Feed</span>
          </Link>

          <Link 
            to="/create" 
            className={`flex flex-col items-center justify-center transition-all duration-200 hover:scale-105 ${isActive('/create') ? 'text-primary scale-110 font-bold' : 'text-on-surface-variant opacity-60 hover:opacity-90'}`}
            title="Tạo"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${isActive('/create') ? 1 : 0}` }}>add_circle</span>
            <span className="text-[8px] tracking-wider font-bold uppercase mt-1">Tạo</span>
          </Link>

          <Link 
            to="/editor" 
            className={`flex flex-col items-center justify-center transition-all duration-200 hover:scale-105 ${isActive('/editor') ? 'text-primary scale-110 font-bold' : 'text-on-surface-variant opacity-60 hover:opacity-90'}`}
            title="AI Chat"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${isActive('/editor') ? 1 : 0}` }}>chat_bubble</span>
            <span className="text-[8px] tracking-wider font-bold uppercase mt-1">AI Chat</span>
          </Link>

          <Link 
            to="/profile" 
            className={`flex flex-col items-center justify-center transition-all duration-200 hover:scale-105 ${isActive('/profile') ? 'text-primary scale-110 font-bold' : 'text-on-surface-variant opacity-60 hover:opacity-90'}`}
            title="Thư viện"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: `'FILL' ${isActive('/profile') ? 1 : 0}` }}>folder_special</span>
            <span className="text-[8px] tracking-wider font-bold uppercase mt-1">Thư viện</span>
          </Link>

          <button 
            onClick={() => setIsAmbianceOpen(true)}
            className="flex flex-col items-center justify-center text-on-surface-variant opacity-60 hover:opacity-90 transition-all duration-200 hover:scale-105"
            title="Bản sắc"
          >
            <span className="material-symbols-outlined">palette</span>
            <span className="text-[8px] tracking-wider font-bold uppercase mt-1">Bản sắc</span>
          </button>
        </nav>
      </div>

      {/* Left Compact NavBar for Mobile */}
      <div className="fixed left-2 top-1/3 -translate-y-1/2 z-40 md:hidden">
        <nav className="flex flex-col gap-4 p-2 bg-surface-container/90 backdrop-blur-md border border-outline/10 rounded-xl shadow-lg shadow-black/10">
          <Link 
            to="/" 
            className={`flex flex-col items-center justify-center transition-all duration-150 ${isActive('/') ? 'text-primary scale-105 font-bold' : 'text-on-surface-variant opacity-60'}`}
            title="Feed"
          >
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: `'FILL' ${isActive('/') ? 1 : 0}` }}>auto_awesome_motion</span>
          </Link>

          <Link 
            to="/create" 
            className={`flex flex-col items-center justify-center transition-all duration-150 ${isActive('/create') ? 'text-primary scale-105 font-bold' : 'text-on-surface-variant opacity-60'}`}
            title="Tạo"
          >
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: `'FILL' ${isActive('/create') ? 1 : 0}` }}>add_circle</span>
          </Link>

          <Link 
            to="/editor" 
            className={`flex flex-col items-center justify-center transition-all duration-150 ${isActive('/editor') ? 'text-primary scale-105 font-bold' : 'text-on-surface-variant opacity-60'}`}
            title="AI Chat"
          >
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: `'FILL' ${isActive('/editor') ? 1 : 0}` }}>chat_bubble</span>
          </Link>

          <Link 
            to="/profile" 
            className={`flex flex-col items-center justify-center transition-all duration-150 ${isActive('/profile') ? 'text-primary scale-105 font-bold' : 'text-on-surface-variant opacity-60'}`}
            title="Thư viện"
          >
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: `'FILL' ${isActive('/profile') ? 1 : 0}` }}>folder_special</span>
          </Link>

          <button 
            onClick={() => setIsAmbianceOpen(true)}
            className="flex flex-col items-center justify-center text-on-surface-variant opacity-60"
            title="Bản sắc"
          >
            <span className="material-symbols-outlined text-lg">palette</span>
          </button>
        </nav>
      </div>

      {/* Ambiance Selector Sheet */}
      <AmbianceSelector 
        isOpen={isAmbianceOpen} 
        onClose={() => setIsAmbianceOpen(false)}
        onSyncStitch={handleSyncStitch}
      />
    </div>
  );
};
