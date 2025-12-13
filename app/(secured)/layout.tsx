"use client";
import { Box, Container, styled } from "@mui/material";
import React from "react";
import GlobalProvider from "@/components/GlobalProvider";
import TopNav from "./components/layout/header/TopNav";

// Main wrapper now just handles the background and basic flex direction
const MainWrapper = styled("div")(() => ({
  display: "flex",
  minHeight: "100vh",
  width: "100%",
  flexDirection: "column", // Stack TopNav and Content vertically
  backgroundColor: "#ffffff", // Ensure white background
}));

const PageWrapper = styled("div")(() => ({
  display: "flex",
  flexGrow: 1,
  flexDirection: "column",
  zIndex: 1,
  backgroundColor: "transparent",
}));

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GlobalProvider>
      <MainWrapper className="mainwrapper">
        <TopNav />
        <PageWrapper className="page-wrapper">
          <Container
            maxWidth={false} // Full width for ERP
            sx={{
              paddingTop: "30px",
              maxWidth: "1600px", // Widescreen typical for ERP
            }}
          >
            <Box sx={{ minHeight: "calc(100vh - 170px)" }}>{children}</Box>
          </Container>
        </PageWrapper>
      </MainWrapper>
    </GlobalProvider>
  );
}
