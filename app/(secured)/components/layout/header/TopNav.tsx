"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Menuitems from "../sidebar/MenuItems";
import { IconChevronDown, IconLogout, IconUser } from "@tabler/icons-react";
import { useAppDispatch } from "@/lib/hooks";
import { clearUser } from "@/lib/authSlice/authSlice";

const TopNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    // 1. Clear local storage
    window.localStorage.removeItem("nvrUser");
    // 2. Clear Redux state
    dispatch(clearUser());
    // 3. Redirect to login
    router.replace("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-light-gray h-16">
      <div className="h-full px-6 flex items-center justify-between max-w-[1920px] mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link
            href="/dashboard"
            className="text-2xl font-black tracking-tighter uppercase"
          >
            NEVER
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {Menuitems.map((item: any) => {
              if (item.navLabel) return null;

              const isActive =
                pathname === item.href ||
                (item.children &&
                  item.children.some((child: any) => pathname === child.href));

              if (item.children) {
                return (
                  <div
                    key={item.id}
                    className="relative group h-16 flex items-center"
                    onMouseEnter={() => setActiveDropdown(item.id)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <button
                      className={`flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors rounded-full hover:bg-light-gray ${
                        isActive ? "text-black bg-light-gray" : "text-accent"
                      }`}
                    >
                      {item.icon && <item.icon size={18} className="mr-1.5" />}
                      {item.title}
                      <IconChevronDown size={14} />
                    </button>

                    {/* Nav Dropdown */}
                    {activeDropdown === item.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.1 }}
                        className="absolute top-[calc(100%-8px)] left-0 w-56 bg-white border border-light-gray rounded-2xl shadow-premium p-2 overflow-hidden z-50"
                      >
                        {item.children.map((child: any) => (
                          <Link
                            key={child.id}
                            href={child.href}
                            className={`block px-4 py-3 text-sm rounded-xl transition-colors hover:bg-light-gray ${
                              pathname === child.href
                                ? "font-bold text-black"
                                : "text-accent"
                            }`}
                          >
                            {child.title}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center px-4 py-2 text-sm font-medium transition-colors rounded-full hover:bg-light-gray ${
                    isActive ? "text-black bg-light-gray" : "text-accent"
                  }`}
                >
                  {item.icon && <item.icon size={18} className="mr-1.5" />}
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            onBlur={() => setTimeout(() => setIsProfileOpen(false), 200)}
            className="w-10 h-10 rounded-full bg-light-gray hover:bg-black hover:text-white transition-colors flex items-center justify-center font-bold"
          >
            <IconUser size={20} />
          </button>

          {isProfileOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.1 }}
              className="absolute top-12 right-0 w-48 bg-white border border-light-gray rounded-2xl shadow-premium p-2 overflow-hidden z-50"
            >
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              >
                <IconLogout size={18} />
                Sign Out
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNav;
