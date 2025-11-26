"use client";
import React from "react";
import Link from "next/link";
import PageContainer from "../components/container/PageContainer";
import { Box, Grid, Typography, Link as MUILink, Divider } from "@mui/material";

const Reports = () => {
  const reportSections = [
    {
      category: "Sales Reports",
      reports: [
        {
          title: "Daily Summary",
          link: "/dashboard/reports/sales/daily-summary",
        },
        {
          title: "Monthly Summary",
          link: "/dashboard/reports/sales/monthly-summary",
        },
        {
          title: "Yearly Summary",
          link: "/dashboard/reports/sales/yearly-summary",
        },
        {
          title: "Top Selling Products",
          link: "/dashboard/reports/sales/top-products",
        },
        {
          title: "Sales by Category",
          link: "/dashboard/reports/sales/by-category",
        },
        { title: "Sales by Brand", link: "/dashboard/reports/sales/by-brand" },
        {
          title: "Sales vs Discount",
          link: "/dashboard/reports/sales/sales-vs-discount",
        },
        {
          title: "Sales by Payment Method",
          link: "/dashboard/reports/sales/by-payment-method",
        },
        {
          title: "Refunds & Returns",
          link: "/dashboard/reports/sales/refunds-returns",
        },
      ],
    },
    {
      category: "Stock Reports",
      reports: [
        { title: "Live Stock", link: "/dashboard/reports/stocks/live-stock" },
        {
          title: "Low Stock",
          link: "/dashboard/reports/stocks/low-stock",
        },
        {
          title: "Stock Valuation",
          link: "/dashboard/reports/stocks/valuation",
        },
      ],
    },
    {
      category: "Revenue Reports",
      reports: [
        {
          title: "Daily Revenue",
          link: "/dashboard/reports/revenues/daily-revenue",
        },
        {
          title: "Monthly Revenue",
          link: "/dashboard/reports/revenues/monthly-revenue",
        },
        {
          title: "Yearly Revenue",
          link: "/dashboard/reports/revenues/yearly-revenue",
        },
      ],
    },
    {
      category: "Cash Reports",
      reports: [
        {
          title: "Cashflow",
          link: "/dashboard/reports/cash/cashflow",
        },
      ],
    },
  ];

  return (
    <PageContainer title="Reports">
      <Box sx={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {reportSections.map((section, i) => (
          <Box key={i}>
            {/* Category Title */}
            <Typography
              variant="h5"
              fontWeight={700}
              color="text.primary"
              sx={{ mb: 2 }}
            >
              {section.category}
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {/* Grid of Links */}
            <Grid container spacing={2}>
              {section.reports.map((report, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                  <MUILink
                    component={Link}
                    href={report.link}
                    underline="hover"
                    color="primary"
                    sx={{
                      fontSize: 16,
                      fontWeight: 500,
                      pl: 2.5,
                      position: "relative",
                      display: "inline-block",
                      "&::before": {
                        content: '"•"',
                        position: "absolute",
                        left: 0,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "primary.main",
                        fontSize: 20,
                        lineHeight: 1,
                      },
                    }}
                  >
                    {report.title}
                  </MUILink>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}
      </Box>
    </PageContainer>
  );
};

export default Reports;
