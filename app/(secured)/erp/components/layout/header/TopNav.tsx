"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconChevronDown,
  IconLogout,
  IconUser,
  IconMenu2,
  IconX,
} from "@tabler/icons-react";
import { useAppDispatch } from "@/lib/hooks";
import { clearUser } from "@/lib/authSlice/authSlice";
import Logo from "../shared/logo/Logo";
import Menuitems from "./MenuItems";

const TopNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Desktop State
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState({ left: 0, top: 0 });
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Mobile State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileActiveDropdown, setMobileActiveDropdown] = useState<
    string | null
  >(null);

  // --- Handlers ---

  const handleLogout = () => {
    window.localStorage.removeItem("nvrUser");
    dispatch(clearUser());
    router.replace("/");
  };

  // Calculate position for desktop fixed dropdown
  const handleMouseEnter = (itemId: string, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownPos({ left: rect.left, top: rect.bottom });
    setActiveDropdown(itemId);
  };

  // Toggle mobile accordion
  const toggleMobileDropdown = (id: string) => {
    setMobileActiveDropdown(mobileActiveDropdown === id ? null : id);
  };

  // Find active item data for desktop portal rendering
  const activeItem = Menuitems.find((item: any) => item.id === activeDropdown);

  // Close mobile menu automatically on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      {/* --- MAIN HEADER --- */}
      <header className="sticky top-0 z-40 bg-white border-b-2 border-black h-16 lg:h-20 transition-all duration-300">
        <div className="h-full px-4 lg:px-6 flex items-center justify-between max-w-[1920px] mx-auto relative">
          {/* 1. Mobile Menu Trigger (Visible < lg) */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 text-black hover:bg-gray-100 transition-colors"
          >
            <IconMenu2 size={24} stroke={2} />
          </button>

          {/* 2. Logo */}
          <div className="flex-shrink-0 lg:mr-8 scale-[.4] sm:scale-[.5] md:scale-50 origin-center lg:origin-left">
            <Link href="/erp/dashboard" className="block">
              <Logo />
            </Link>
          </div>

          {/* 3. Desktop Navigation (Hidden < lg) */}
          <nav className="hidden lg:flex flex-1 overflow-x-auto items-center gap-1 no-scrollbar mask-gradient">
            {Menuitems.map((item: any) => {
              if (item.navLabel) return null;

              const isActive =
                pathname === item.href ||
                (item.children &&
                  item.children.some((c: any) => pathname === c.href));

              // Industrial Button Style
              const baseBtn = `
                flex items-center gap-2 px-5 py-3 text-[11px] font-black uppercase tracking-[0.15em] transition-all 
                ${
                  isActive
                    ? "bg-black text-white"
                    : "text-gray-500 hover:text-black hover:bg-gray-100"
                }
              `;

              // Dropdown Trigger Logic
              if (item.children) {
                return (
                  <div
                    key={item.id}
                    onMouseEnter={(e) => handleMouseEnter(item.id, e)}
                    onMouseLeave={() => setActiveDropdown(null)}
                    className="h-full flex items-center"
                  >
                    <button className={baseBtn}>
                      {item.title}
                      <IconChevronDown
                        size={14}
                        stroke={3}
                        className={isActive ? "text-white" : "text-gray-400"}
                      />
                    </button>
                  </div>
                );
              }

              // Direct Link Logic
              return (
                <Link key={item.id} href={item.href} className={baseBtn}>
                  {item.title}
                </Link>
              );
            })}
          </nav>

          {/* 4. User Actions */}
          <div className="flex-shrink-0 ml-4 relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              onBlur={() => setTimeout(() => setIsProfileOpen(false), 200)}
              className="w-8 h-8 lg:w-10 lg:h-10 border-2 border-gray-200 hover:border-black hover:bg-black hover:text-white transition-colors flex items-center justify-center text-black"
            >
              <IconUser size={18} stroke={2.5} />
            </button>

            {/* User Profile Dropdown */}
            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-12 lg:top-14 right-0 w-48 bg-white border-2 border-black p-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50"
                >
                  <Link
                    href="/erp/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="w-full flex items-center gap-3 px-5 py-4 text-xs font-black uppercase tracking-widest text-black hover:bg-gray-100 transition-colors border-b border-gray-100"
                  >
                    <IconUser size={16} />
                    My Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-5 py-4 text-xs font-black uppercase tracking-widest text-black hover:bg-red-600 hover:text-white transition-colors"
                  >
                    <IconLogout size={16} />
                    Log Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* --- DESKTOP DROPDOWN PORTAL (Fixed Position) --- */}
      <AnimatePresence>
        {activeDropdown && activeItem && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "circOut" }}
            onMouseEnter={() => setActiveDropdown(activeDropdown)}
            onMouseLeave={() => setActiveDropdown(null)}
            style={{
              position: "fixed",
              left: dropdownPos.left,
              top: dropdownPos.top + 4, // slight offset from header
              zIndex: 50,
            }}
            className="hidden lg:block w-64 bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)] overflow-hidden"
          >
            <div className="py-2">
              {activeItem.children?.map((child: any) => (
                <Link
                  key={child.id}
                  href={child.href}
                  className={`
                    block px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors
                    ${
                      pathname === child.href
                        ? "bg-black text-white"
                        : "text-gray-500 hover:bg-gray-100 hover:text-black"
                    }
                  `}
                >
                  {child.title}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MOBILE SIDE DRAWER --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
            />

            {/* Slide-out Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-white z-[70] border-r-2 border-black flex flex-col lg:hidden"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-6 border-b-2 border-black">
                <span className="text-xs font-black uppercase tracking-widest text-black">
                  Menu
                </span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 border-2 border-transparent hover:border-black transition-all"
                >
                  <IconX size={20} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-2">
                {Menuitems.map((item: any, index: number) => {
                  // Render Nav Labels (e.g., "Management", "Finance")
                  if (item.navLabel) {
                    return (
                      <div
                        key={index}
                        className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-6 mb-2 border-b border-gray-100 pb-1"
                      >
                        {item.subHeader}
                      </div>
                    );
                  }

                  const isActive = pathname === item.href;
                  const hasChildren = item.children && item.children.length > 0;
                  const isExpanded = mobileActiveDropdown === item.id;

                  return (
                    <div key={item.id}>
                      {hasChildren ? (
                        <>
                          {/* Accordion Trigger */}
                          <button
                            onClick={() => toggleMobileDropdown(item.id)}
                            className={`w-full flex items-center justify-between p-4 text-xs font-bold uppercase tracking-wide border-2 transition-all ${
                              isExpanded
                                ? "bg-black text-white border-black"
                                : "bg-white text-black border-gray-100"
                            }`}
                          >
                            <span className="flex items-center gap-3">
                              {item.icon && <item.icon size={18} />}
                              {item.title}
                            </span>
                            <IconChevronDown
                              size={16}
                              className={`transition-transform duration-300 ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          {/* Accordion Content */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden bg-gray-50 border-x-2 border-b-2 border-gray-100"
                              >
                                {item.children.map((child: any) => {
                                  const isChildActive = pathname === child.href;
                                  return (
                                    <Link
                                      key={child.id}
                                      href={child.href}
                                      className={`flex items-center gap-2 px-8 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                                        isChildActive
                                          ? "text-black bg-gray-200"
                                          : "text-gray-500 hover:text-black"
                                      }`}
                                    >
                                      {/* Active Dot Indicator */}
                                      {isChildActive && (
                                        <div className="w-1.5 h-1.5 bg-black rounded-none" />
                                      )}
                                      {child.title}
                                    </Link>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      ) : (
                        /* Standard Link */
                        <Link
                          href={item.href}
                          className={`flex items-center gap-3 p-4 text-xs font-bold uppercase tracking-wide border-2 transition-all ${
                            isActive
                              ? "bg-black text-white border-black"
                              : "bg-white text-black border-gray-100 hover:border-black"
                          }`}
                        >
                          {item.icon && <item.icon size={18} />}
                          {item.title}
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t-2 border-black bg-gray-50 space-y-2">
                <Link
                  href="/erp/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 p-4 bg-white border-2 border-transparent hover:border-black text-xs font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-sm"
                >
                  <IconUser size={16} />
                  My Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 p-4 bg-white border-2 border-black text-xs font-black uppercase tracking-widest hover:bg-red-600 hover:border-red-600 hover:text-white transition-colors shadow-sm"
                >
                  <IconLogout size={16} />
                  Log Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default TopNav;
