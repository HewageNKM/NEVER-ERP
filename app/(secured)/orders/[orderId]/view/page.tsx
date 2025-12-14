"use client";

import React from "react";
import PageContainer from "../../../components/container/PageContainer";
import { useParams } from "next/navigation";
import OrderView from "./components/OrderView";

const OrderPage = () => {
  const params = useParams();
  const orderId = params?.orderId as string;

  return (
    <PageContainer title={`Order View - ${orderId}`} description="Order View">
      {/* 
          Removing DashboardCard wrapper here to allow OrderView to control its own layout cards
          similar to how we did in Edit page for a cleaner, less nested look.
       */}
      <div className="max-w-5xl mx-auto">
        <OrderView orderId={orderId} />
      </div>
    </PageContainer>
  );
};

export default OrderPage;
