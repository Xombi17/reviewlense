"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (href: string): boolean => pathname === href;

  return (
    <nav className="flex items-center justify-between bg-white dark:bg-slate-900 shadow-sm px-6 py-4">
      {/* Logo/Brand */}
      <div className="text-lg font-bold text-gray-900 dark:text-white">
        ReviewLens AI
      </div>

      {/* Navigation Links */}
      <div className="flex gap-8 items-center">
        <Link
          href="/"
          className={
            isActive("/")
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-semibold pb-1"
              : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors pb-1"
          }
        >
          Home
        </Link>

        <Link
          href="/dashboard"
          className={
            isActive("/dashboard")
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-semibold pb-1"
              : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors pb-1"
          }
        >
          Dashboard
        </Link>

        <Link
          href="/batch"
          className={
            isActive("/batch")
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-semibold pb-1"
              : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors pb-1"
          }
        >
          Batch Analysis
        </Link>
      </div>
    </nav>
  );
}
