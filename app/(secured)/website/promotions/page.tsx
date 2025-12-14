"use client";
import React from "react";
// We can assume we might need similar header/form components later, but for now we'll just put a placeholder
// or reuse the style wrapper.

const Promotions = () => {
  return (
    <div className="flex flex-col gap-8 w-full p-2">
      <div className="space-y-4">
        <h3 className="text-lg font-bold uppercase text-gray-900 border-b border-gray-100 pb-2">
          Active Promotions
        </h3>
        <div className="p-4 bg-gray-50 rounded-sm text-center text-gray-500 text-sm">
          No active promotions found.
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold uppercase text-gray-900 border-b border-gray-100 pb-2">
          Create New Promotion
        </h3>
        <div className="p-8 border-2 border-dashed border-gray-200 rounded-sm flex items-center justify-center text-gray-400">
          Promotion Form Placeholder
        </div>
      </div>
    </div>
  );
};

export default Promotions;
