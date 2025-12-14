"use client";
import React from "react";

const Header = ({
  formType,
  setFormType,
}: {
  formType: string;
  setFormType: any;
}) => {
  const tabs = [
    { id: "banner", label: "Banner Rotator" },
    { id: "promotions", label: "Promo Grid" },
    { id: "navigation", label: "Site Navigation" },
  ];

  return (
    <div className="flex justify-start border-b border-gray-200">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setFormType(tab.id)}
          className={`px-8 py-4 text-[10px] font-black uppercase tracking-[0.15em] transition-all relative ${
            formType === tab.id
              ? "text-black bg-gray-50"
              : "text-gray-400 hover:text-black hover:bg-gray-50/50"
          }`}
        >
          {tab.label}
          {formType === tab.id && (
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-black" />
          )}
        </button>
      ))}
    </div>
  );
};

export default Header;
