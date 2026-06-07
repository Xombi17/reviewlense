"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Welcome", href: "/" },
    { label: "Analyzer", href: "/analyzer" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Batch", href: "/batch" },
  ];

  return (
    <nav className="h-[56px] min-h-[56px] border-b border-terminal-border bg-terminal-bg flex items-center justify-between px-6 select-none z-50">
      {/* Logo/Wordmark */}
      <div className="font-mono text-[13px] font-bold tracking-[0.15em] text-white uppercase">
        ReviewLens AI
      </div>

      {/* Nav Links */}
      <div className="flex gap-6 items-center h-full">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center h-full font-mono text-[11px] uppercase tracking-wider transition-colors duration-250 ${
                active ? "text-white font-bold" : "text-muted-text hover:text-white"
              }`}
            >
              <span>{item.label}</span>
              {active && (
                <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-white" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
