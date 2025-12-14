"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Order } from "@/model";
import PageContainer from "../../components/container/PageContainer";
import DashboardCard from "../../components/shared/DashboardCard";
import { useAppSelector } from "@/lib/hooks";
import { getToken } from "@/firebase/firebaseClient";
import axios from "axios";
import { OrderEditForm } from "./components/OrderEditForm";
import { showNotification } from "@/utils/toast";
import Link from "next/link"; // Use Next.js Link instead of MUI

const OrderEditPage = () => {
  const param = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentUser, loading: authLoading } = useAppSelector(
    (state) => state.authSlice
  );

  useEffect(() => {
    if (param.orderId && !authLoading && currentUser) {
      fetchOrder();
    }
  }, [currentUser, param.orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await axios.get(`/api/v1/orders/${param.orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrder(response.data);
    } catch (error: any) {
      console.error(error);
      showNotification(error.message || "Failed to fetch order", "error");
    } finally {
      setLoading(false);
    }
  };

  // Breadcrumb Component
  const BreadcrumbNav = () => (
    <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 font-medium uppercase tracking-wide">
      <Link href="/orders" className="hover:text-black transition-colors">
        Orders
      </Link>
      <span>/</span>
      <span className="text-black font-bold">
        Edit Order #{order?.orderId || param.orderId}
      </span>
    </div>
  );

  if (loading) {
    return (
      <PageContainer title="Edit Order">
        <DashboardCard title="Loading Order...">
          <div className="flex justify-center items-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black" />
          </div>
        </DashboardCard>
      </PageContainer>
    );
  }

  if (!order) {
    return (
      <PageContainer title="Edit Order">
        <DashboardCard title="Order Not Found">
          <div className="p-8 text-center text-gray-500">
            <p>Order not found or failed to load.</p>
          </div>
        </DashboardCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={`Edit Order #${order.orderId}`}>
      <BreadcrumbNav />
      <div className="max-w-5xl mx-auto">
        <OrderEditForm order={order} onRefresh={fetchOrder} />
      </div>
    </PageContainer>
  );
};

export default OrderEditPage;
