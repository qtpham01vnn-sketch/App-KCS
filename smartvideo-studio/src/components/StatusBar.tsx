export function StatusBar() {
  return (
    <footer className="fixed bottom-0 left-16 right-0 h-7 flex items-center justify-between px-4 z-40 bg-[#0e0e10] border-t border-[#3c4a42]">
      <div className="flex items-center gap-4 text-[#4cd7f6] text-xs font-medium">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse" />
          Status: Online
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#4edea3]" />
          API: Connected
        </span>
      </div>
      <div className="text-[#a1a1aa] text-xs font-medium">
        © 2024 Tuấn Phạm Studio • Render Engine v2.4
      </div>
      <div className="flex items-center gap-4 text-[#a1a1aa] text-xs font-medium">
        <a className="hover:text-[#e5e1e4] transition-colors" href="#">
          Documentation
        </a>
        <span className="text-[#3c4a42]">|</span>
        <span>Local Node: 127.0.0.1</span>
      </div>
    </footer>
  );
}
