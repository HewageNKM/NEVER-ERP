"use client";
import React, { useState } from "react";
import PageContainer from "@/app/(secured)/components/container/PageContainer";
import Banner from "@/app/(secured)/website/banner/page";
import Header from "../website/components/Header";
import Promotions from "@/app/(secured)/website/promotions/page";
import Navigation from "@/app/(secured)/website/navigation/page";
import { IconLayoutDashboard } from "@tabler/icons-react";

const Page = () => {
  const [formType, setFormType] = useState("banner");

  return (
    <PageContainer title="Website" description="Manage Website Content">
      <div className="w-full">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold uppercase tracking-tight text-gray-900 flex items-center gap-2">
              <IconLayoutDashboard className="text-gray-900" size={28} />
              Website Management
            </h2>
            <p className="text-sm text-gray-500 mt-1 uppercase font-semibold">
              Manage Banners and Content
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-6">
          <Header formType={formType} setFormType={setFormType} />
          <div className="mt-6">
            {formType === "banner" && <Banner />}
            {formType === "promotions" && <Promotions />}
            {formType === "navigation" && <Navigation />}
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default Page;
