"use client";
import React from "react";
import GlobalProvider from "@/components/GlobalProvider";
import TopNav from "./components/layout/header/TopNav";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GlobalProvider>
      <div className="flex flex-col min-h-screen w-full bg-gray-50 text-gray-900 font-sans">
        <TopNav />
        <div className="flex-grow flex flex-col">
          <div className="w-full max-w-[1600px] mx-auto pt-[30px] px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-170px)]">
            {children}
          </div>
        </div>
      </div>
    </GlobalProvider>
  );
}
