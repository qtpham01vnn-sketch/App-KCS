"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Workspace" },
  { href: "/create", label: "Projects" },
  { href: "/library", label: "Library" },
  { href: "/settings", label: "API Settings" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-3 h-12 bg-[#1c1b1d] border-b border-[#3c4a42]">
      <div className="flex items-center gap-8">
        <span className="text-2xl font-bold text-[#4edea3] tracking-tighter">
          Tuấn Phạm Studio
        </span>
        <nav className="hidden md:flex gap-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[11px] font-semibold uppercase tracking-[0.05em] transition-colors ${
                  isActive
                    ? "text-[#4edea3] border-b-2 border-[#4edea3] pb-1"
                    : "text-[#a1a1aa] hover:text-[#e5e1e4]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative group">
          <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a1a1aa]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input
            className="bg-[#0e0e10] border border-[#3c4a42] rounded px-8 py-1 text-xs focus:outline-none focus:border-[#4edea3] w-48 transition-all focus:w-64 text-[#e5e1e4] placeholder:text-[#a1a1aa]"
            placeholder="Search projects..."
            type="text"
          />
        </div>
        <button 
          onClick={() => {
            if (typeof window !== 'undefined') window.dispatchEvent(new Event('trigger_render_mp4'));
          }}
          className="px-4 py-1.5 bg-[#4edea3] text-[#003824] rounded text-[11px] font-bold uppercase tracking-[0.05em] hover:bg-[#3bc78f] transition-colors"
        >
          Render MP4
        </button>
        <button className="p-2 text-[#a1a1aa] hover:bg-[#2a2a2c] rounded transition-all">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
        <button className="p-2 text-[#a1a1aa] hover:bg-[#2a2a2c] rounded transition-all">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
        </button>
        <div className="w-8 h-8 rounded-full bg-[#353437] border border-[#3c4a42] flex items-center justify-center text-xs font-bold text-[#4edea3]">
          TP
        </div>
      </div>
    </header>
  );
}
