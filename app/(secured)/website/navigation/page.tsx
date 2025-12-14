"use client";
import React from "react";
import { IconSitemap, IconLink } from "@tabler/icons-react";

const Navigation = () => {
  return (
    <div className="flex flex-col gap-12 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Main Nav */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b-2 border-black pb-4">
          <h3 className="text-xl font-black uppercase tracking-tighter text-black">
            Main Menu Structure
          </h3>
          <IconSitemap className="text-gray-300" />
        </div>

        <div className="p-8 border-2 border-gray-200 bg-white">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-mono text-gray-400 uppercase block">
              config.main_nav.json
            </span>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
              Menu configuration interface loading...
            </p>
          </div>
        </div>
      </div>

      {/* Footer Nav */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b-2 border-black pb-4">
          <h3 className="text-xl font-black uppercase tracking-tighter text-black">
            Footer Links
          </h3>
          <IconLink className="text-gray-300" />
        </div>
        <div className="p-8 border-2 border-gray-200 bg-white">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-mono text-gray-400 uppercase block">
              config.footer.json
            </span>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
              Footer configuration interface loading...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
