"use client";
import React from "react";
import Link from "next/link";
import { IconLock, IconShieldLock } from "@tabler/icons-react";

const RestrictedPage = () => {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-white text-black relative overflow-hidden">
      {/* Background Hazard Pattern (Subtle) */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)",
          backgroundSize: "20px 20px",
        }}
      />

      <div className="z-10 flex flex-col items-center text-center max-w-lg px-6">
        {/* Icon */}
        <div className="mb-6 p-4 border-4 border-black rounded-full">
          <IconLock size={48} stroke={2} className="text-black" />
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-[0.9] mb-6 text-black mix-blend-multiply">
          Restricted
          <br />
          Access
        </h1>

        {/* Technical Subtext */}
        <div className="space-y-1 mb-10 border-l-2 border-black pl-4 text-left">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-black">
            Authorization Failed
          </p>
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wide">
            Error Code: 403_FORBIDDEN // Insufficient permissions detected.
          </p>
        </div>

        {/* Industrial Button */}
        <Link
          href="/"
          className="group relative inline-flex items-center justify-center px-10 py-4 bg-black text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-gray-900 transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(200,200,200,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
        >
          <IconShieldLock
            size={16}
            className="mr-2 group-hover:text-gray-300 transition-colors"
          />
          Authenticate
        </Link>
      </div>

      {/* Footer Brand Element */}
      <div className="absolute bottom-8 text-center opacity-40">
        <span className="text-[10px] font-black italic tracking-tighter uppercase block">
          NeverBe.
        </span>
        <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">
          Security Protocols Active
        </span>
      </div>
    </main>
  );
};

export default RestrictedPage;
