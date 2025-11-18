"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { HiMenu, HiX } from "react-icons/hi";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const menu = [
    { name: "الملف الشخصي", href: "/merchant/dashboard/profile" },
    { name: "الحسابات البنكية", href: "/merchant/dashboard/banks" },
    { name: "المنتجات", href: "/merchant/dashboard/products" },
    { name: "المدفوعات", href: "/merchant/dashboard/payments" },
    { name: "الخدمات", href: "/merchant/dashboard/services" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex" dir="rtl">

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 bg-white border-l border-gray-200 p-6 flex-col shadow-sm">
        <h1 className="text-2xl font-bold mb-10 text-gray-900 tracking-tight">
          Filemart
        </h1>

        <nav className="space-y-2">
          {menu.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition
                  ${
                    active
                      ? "bg-blue-600 text-white shadow"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6">
          <button
            onClick={() => (window.location.href = "/merchant/login")}
            className="w-full text-right text-sm text-red-600 hover:underline"
          >
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black z-30 md:hidden"
        />
      )}

      <motion.aside
        initial={{ x: 300 }}
        animate={{ x: open ? 0 : 300 }}
        transition={{ type: "spring", bounce: 0 }}
        className="fixed top-0 right-0 w-64 h-full bg-white shadow-xl border-l border-gray-200 z-40 p-6 md:hidden"
      >
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-xl font-bold text-gray-900">Filemart</h1>
          <button onClick={() => setOpen(false)}>
            <HiX size={28} className="text-gray-700" />
          </button>
        </div>

        <nav className="space-y-2">
          {menu.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition
                  ${
                    active
                      ? "bg-blue-600 text-white shadow"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => (window.location.href = "/merchant/login")}
          className="text-red-600 text-sm mt-10"
        >
          تسجيل الخروج
        </button>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1">

        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-4 md:px-8 flex justify-between items-center">

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setOpen(true)}>
            <HiMenu size={28} className="text-gray-700" />
          </button>

          <h2 className="text-lg font-semibold text-gray-900">
            لوحة تحكم المتجر
          </h2>

          {/* Empty placeholder to balance layout */}
          <div className="w-7 md:hidden"></div>
        </header>

        {/* Page Body */}
        <main className="px-4 py-6 md:px-10 md:py-8">{children}</main>
      </div>

    </div>
  );
}
