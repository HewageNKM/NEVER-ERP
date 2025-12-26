"use client";
import React, { useState } from "react";
import PageContainer from "@/app/(secured)/erp/components/container/PageContainer";
import Banner from "@/app/(secured)/erp/website/banner/page";
import Header from "./components/Header";
import Navigation from "@/app/(secured)/erp/website/navigation/page";
import { IconLayoutDashboard, IconWorldWww } from "@tabler/icons-react";

const Page = () => {
  const [formType, setFormType] = useState("banner");

  return (
    <PageContainer title="Website" description="Manage Website Content">
      <div className="w-full space-y-8">
        {/* Header Section */}
        <div className="flex flex-col gap-2 border-b-2 border-black pb-6">
          <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase flex items-center gap-2">
            <IconWorldWww size={14} /> Front-End Controller
          </span>
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black leading-none">
            Website Management
          </h2>
        </div>

        {/* Content Control Panel */}
        <div className="bg-white border-2 border-gray-200">
          {/* Tab Navigation Area */}
          <div className="p-6 border-b border-gray-200 bg-gray-50/50">
            <Header formType={formType} setFormType={setFormType} />
          </div>

          {/* Dynamic Content Area */}
          <div className="p-6 md:p-8 min-h-[500px]">
            {formType === "banner" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Banner />
              </div>
            )}
            {formType === "navigation" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Navigation />
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default Page;
