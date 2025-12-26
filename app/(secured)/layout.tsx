"use client";
import React from "react";
import GlobalProvider from "@/components/GlobalProvider";
import TopNav from "./erp/components/layout/header/TopNav";
import { usePathname } from "next/navigation";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPos = pathname?.startsWith("/pos");

  return (
    <GlobalProvider>
      <div className="flex flex-col min-h-screen w-full bg-white text-black font-sans selection:bg-black selection:text-white">
        {/* Global Brand Accent - Only for ERP */}
        {!isPos && (
          <div className="w-full h-1 bg-black fixed top-0 z-[100]"></div>
        )}

        {!isPos && <TopNav />}

        <div className="flex-grow flex flex-col">
          {isPos ? (
            // POS Layout: Full width/height, handled by page/components
            <div className="w-full px-6 sm:px-8 lg:px-12 py-8 min-h-screen">
              {children}
            </div>
          ) : (
            // ERP Layout: Container with padding
            <div className="w-full max-w-[1800px] mx-auto pt-[40px] px-6 sm:px-8 lg:px-12 min-h-[calc(100vh-170px)]">
              {children}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="w-full py-4 text-center border-t border-gray-100 mt-auto">
          <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">
            NeverBe Internal Systems v2.0
          </p>
        </div>
      </div>
    </GlobalProvider>
  );
}
