"use client"
import React from 'react';
import {Stack} from "@mui/material";
import Header from "@/app/(secured)/website/banner/components/Header";
import Form from "@/app/(secured)/website/banner/components/Form";

const Banner = () => {
    return (
        <Stack
            sx={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 3,
            }}
        >
            <Header/>
            <Form/>
        </Stack>
    );
};

export default Banner;