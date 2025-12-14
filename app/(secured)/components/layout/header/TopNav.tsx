"use client";
import React, { useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Menuitems from "../sidebar/MenuItems";
import { IconChevronDown, IconLogout, IconUser } from "@tabler/icons-react";
import { useAppDispatch } from "@/lib/hooks";
import { clearUser } from "@/lib/authSlice/authSlice";

const TopNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    window.localStorage.removeItem("nvrUser");
    dispatch(clearUser());
    router.replace("/");
  };

  const handleMouseEnter = (
    itemId: string,
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setDropdownPos({
      left: rect.left,
      top: rect.bottom,
    });
    setActiveDropdown(itemId);
  };

  const handleScroll = () => {
    // Close dropdown on scroll to prevent detachment
    if (activeDropdown) {
      setActiveDropdown(null);
    }
  };

  // Find active item data for rendering outside
  const activeItem = Menuitems.find((item: any) => item.id === activeDropdown);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-light-gray h-16 transition-all duration-300">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between max-w-[1920px] mx-auto gap-4 relative">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Link
            href="/dashboard"
            className="text-2xl font-black tracking-tighter uppercase block"
          >
            NEVER
          </Link>
        </div>

        {/* Scrollable Nav Container */}
        {/* Added 'static' to ensure fixed children aren't affected by transforms if any were present, but overflow hidden requires portal/fixed strategy implemented below */}
        <div className="flex-1 overflow-hidden relative mx-4 group">
          <nav
            ref={navRef}
            onScroll={handleScroll}
            className="flex items-center gap-2 w-full whitespace-nowrap px-2 pb-1 hover-scrollbar"
          >
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
                    className="relative px-1 h-10 flex-shrink-0 flex items-center"
                    onMouseEnter={(e) => handleMouseEnter(item.id, e)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <button
                      className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold uppercase tracking-wide transition-all rounded-full hover:bg-gray-100 ${
                        isActive
                          ? "text-black bg-gray-100"
                          : "text-gray-500 hover:text-black"
                      }`}
                    >
                      {item.icon && <item.icon size={18} />}
                      {item.title}
                      <IconChevronDown size={14} />
                    </button>
                    {/* No Dropdown rendered here to avoid clipping */}
                  </div>
                );
              }

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-sm font-bold uppercase tracking-wide transition-all rounded-full hover:bg-gray-100 ${
                    isActive
                      ? "text-black bg-gray-100"
                      : "text-gray-500 hover:text-black"
                  }`}
                >
                  {item.icon && <item.icon size={18} />}
                  {item.title}
                </Link>
              );
            })}
          </nav>

          <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-white to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-white to-transparent pointer-events-none" />
        </div>

        {/* Render Active Dropdown Portal/Overlay */}
        {/* We render this OUTSIDE the overflow container but INSIDE the header (or fixed to body via fixed positioning) */}
        <AnimatePresence>
          {activeDropdown && activeItem && dropdownPos && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              onMouseEnter={() => setActiveDropdown(activeDropdown)} // Keep open when hovering the dropdown itself
              onMouseLeave={() => setActiveDropdown(null)}
              style={{
                position: "fixed",
                left: dropdownPos.left,
                top: dropdownPos.top,
                zIndex: 1000,
              }}
              className="w-56 bg-white border border-gray-200 rounded-sm shadow-2xl p-2 mt-1"
            >
              {activeItem.children.map((child: any) => (
                <Link
                  key={child.id}
                  href={child.href}
                  className={`block px-4 py-2.5 text-sm font-semibold rounded-sm transition-colors uppercase ${
                    pathname === child.href
                      ? "bg-gray-100 text-black"
                      : "text-gray-500 hover:bg-gray-50 hover:text-black"
                  }`}
                >
                  {child.title}
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* User Profile Dropdown */}
        <div className="flex-shrink-0 relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            onBlur={() => setTimeout(() => setIsProfileOpen(false), 200)}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-black hover:text-white transition-colors flex items-center justify-center text-gray-700"
          >
            <IconUser size={20} />
          </button>

          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className="absolute top-12 right-0 w-48 bg-white border border-gray-200 rounded-sm shadow-2xl p-2 z-50"
              >
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-red-500 hover:bg-red-50 rounded-sm transition-colors"
                >
                  <IconLogout size={18} />
                  Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
