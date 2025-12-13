"use client"
import DashboardCard from "@/app/(secured)/components/shared/DashboardCard";
import {Stack} from "@mui/material";
import PageContainer from "@/app/(secured)/components/container/PageContainer";

import React, {useState} from 'react';
import Banner from "@/app/(secured)/website/banner/page";
import Header from "../website/components/Header";

const Page = () => {
    const [formType, setFormType] = useState("dashboard")
    return (
        <PageContainer title="Website" description="Manage Website">
            <DashboardCard title="Website">
                <Stack>
                    <Header formType={formType} setFormType={setFormType}/>
                    {formType === "banner" && (<Banner/>)}
                </Stack>
            </DashboardCard>
        </PageContainer>
    );
};

export default Page;