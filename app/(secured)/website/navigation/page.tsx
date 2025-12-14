"use client";
import React from "react";

const Navigation = () => {
  return (
    <div className="flex flex-col gap-8 w-full p-2">
      <div className="space-y-4">
        <h3 className="text-lg font-bold uppercase text-gray-900 border-b border-gray-100 pb-2">
          Main Navigation
        </h3>
        <div className="p-4 bg-gray-50 rounded-sm text-center text-gray-500 text-sm">
          Manage your main menu links here.
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold uppercase text-gray-900 border-b border-gray-100 pb-2">
          Footer Navigation
        </h3>
        <div className="p-4 bg-gray-50 rounded-sm text-center text-gray-500 text-sm">
          Manage your footer links here.
        </div>
      </div>
    </div>
  );
};

export default Navigation;
