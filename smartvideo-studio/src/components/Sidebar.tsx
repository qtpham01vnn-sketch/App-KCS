"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

interface SideItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

const topItems: SideItem[] = [
  {
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
    label: "Storyboard",
    href: "/",
  },
  {
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="2" y="2" width="20" height="20" rx="2"/><circle cx="8" cy="8" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>,
    label: "Assets",
    href: "/assets",
  },
  {
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>,
    label: "AI Tools",
    href: "/create",
  },
  {
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>,
    label: "History",
    href: "/history",
  },
];

const bottomItems: SideItem[] = [
  {
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>,
    label: "Support",
    href: "/support",
  },
  {
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
    label: "Settings",
    href: "/settings",
  },
];

function SideButton({ item, isActive }: { item: SideItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={`w-[72px] h-[56px] flex flex-col items-center justify-center gap-1 transition-colors rounded ${
        isActive
          ? "text-[#4edea3] bg-[#353437] border-l-2 border-[#4edea3]"
          : "text-[#a1a1aa] hover:text-[#bbcabf] hover:bg-[#201f22]"
      }`}
    >
      {item.icon}
      <span className="text-[9px] font-semibold uppercase tracking-[0.05em]">
        {item.label}
      </span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-12 bottom-0 w-20 flex flex-col items-center py-4 z-40 bg-[#18181b] border-r border-[#3c4a42]">
      <div className="flex flex-col gap-4 items-center w-full">
        {topItems.map((item) => (
          <SideButton
            key={item.href}
            item={item}
            isActive={pathname === item.href}
          />
        ))}
      </div>
      <div className="mt-auto flex flex-col gap-4 items-center w-full">
        {bottomItems.map((item) => (
          <SideButton
            key={item.href}
            item={item}
            isActive={pathname === item.href}
          />
        ))}
      </div>
    </aside>
  );
}
