"use client";

import React from "react";
import PageContainer from "../../../components/container/PageContainer";
import DashboardCard from "../../../components/shared/DashboardCard";
import { Stack } from "@mui/material";
import { useParams } from "next/navigation";
import OrderView from "./components/OrderView";

const OrderPage = () => {
  const params = useParams();
  const orderId = params?.orderId as string;

  return (
    <PageContainer title={`Order View - ${orderId}`} description="Order View">
      <DashboardCard title="Order Details">
        <Stack
          sx={{
            position: "relative",
            padding: 2,
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          {/* You can pass orderId to a client component */}
          <OrderView orderId={orderId} />
        </Stack>
      </DashboardCard>
    </PageContainer>
  );
};

export default OrderPage;
