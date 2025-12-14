"use client";
import React from "react";

const Header = ({
  formType,
  setFormType,
}: {
  formType: string;
  setFormType: any;
}) => {
  return (
    <div className="flex justify-center mb-6">
      <div className="flex bg-gray-100 p-1 rounded-sm">
        <button
          onClick={() => setFormType("banner")}
          className={`px-6 py-2 text-sm font-bold uppercase tracking-wide rounded-sm transition-all duration-200 ${
            formType === "banner"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          Banner
        </button>
        <button
          onClick={() => setFormType("promotions")}
          className={`px-6 py-2 text-sm font-bold uppercase tracking-wide rounded-sm transition-all duration-200 ${
            formType === "promotions"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          Promotions
        </button>
        <button
          onClick={() => setFormType("navigation")}
          className={`px-6 py-2 text-sm font-bold uppercase tracking-wide rounded-sm transition-all duration-200 ${
            formType === "navigation"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          Navigation
        </button>
      </div>
    </div>
  );
};

export default Header;
