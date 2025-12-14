"use client";
import React from "react";
import { IconLayoutGridAdd, IconAlertCircle } from "@tabler/icons-react";

const Promotions = () => {
  return (
    <div className="flex flex-col gap-12 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Active List */}
      <div className="space-y-6">
        <h3 className="text-xl font-black uppercase tracking-tighter text-black border-b-2 border-black pb-4">
          Active Campaigns
        </h3>
        <div className="p-12 border-2 border-dashed border-gray-300 bg-gray-50/50 flex flex-col items-center justify-center text-center">
          <IconAlertCircle size={32} className="text-gray-300 mb-2" />
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
            No active promotions configured
          </span>
        </div>
      </div>

      {/* Create Section */}
      <div className="space-y-6">
        <h3 className="text-xl font-black uppercase tracking-tighter text-black border-b-2 border-black pb-4">
          Initialize Campaign
        </h3>
        <div className="w-full h-64 border-2 border-gray-100 bg-white flex flex-col items-center justify-center hover:border-black transition-colors cursor-pointer group">
          <div className="w-16 h-16 bg-gray-100 group-hover:bg-black group-hover:text-white rounded-full flex items-center justify-center transition-colors mb-4">
            <IconLayoutGridAdd size={24} />
          </div>
          <span className="text-xs font-black uppercase tracking-[0.2em] text-black">
            Launch Promotion Builder
          </span>
        </div>
      </div>
    </div>
  );
};

export default Promotions;
