"use client";
import React from "react";
import Link from "next/link";
import { IconArrowLeft, IconAlertTriangle } from "@tabler/icons-react";

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-black p-6 text-center relative overflow-hidden">
      {/* Top Border Accent */}
      <div className="absolute top-0 left-0 w-full h-2 bg-black"></div>

      {/* Background Decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none select-none">
        <span className="text-[20rem] font-black uppercase tracking-tighter">
          NULL
        </span>
      </div>

      <div className="z-10 flex flex-col items-center max-w-2xl">
        {/* Icon */}
        <IconAlertTriangle size={48} stroke={1.5} className="mb-4 text-black" />

        {/* Massive 404 Text */}
        <h1 className="text-[10rem] sm:text-[14rem] md:text-[16rem] font-black italic tracking-tighter leading-[0.8] mb-2 select-none mix-blend-multiply">
          404
        </h1>

        {/* Technical Subtitle */}
        <div className="space-y-2 mb-10">
          <p className="text-sm md:text-base font-bold uppercase tracking-[0.25em] text-black">
            Page Not Found
          </p>
          <p className="text-[10px] md:text-xs font-mono text-gray-500 uppercase tracking-wide">
            Error Code: 404_NOT_FOUND // The requested resource could not be
            located.
          </p>
        </div>

        {/* Industrial Button */}
        <Link
          href="/"
          className="group relative inline-flex items-center justify-center px-12 py-5 bg-black text-white text-xs font-black uppercase tracking-[0.15em] hover:bg-gray-900 transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(229,231,235,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
        >
          <IconArrowLeft
            size={16}
            className="mr-3 group-hover:-translate-x-1 transition-transform duration-300"
          />
          Return Home
        </Link>
      </div>

      {/* Footer Brand Mark */}
      <div className="absolute bottom-10 flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity">
        <span className="text-lg font-black italic tracking-tighter uppercase">
          NeverBe.
        </span>
        <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">
          System Diagnostics
        </span>
      </div>
    </div>
  );
};

export default NotFound;
