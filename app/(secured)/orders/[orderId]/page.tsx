"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Breadcrumbs, Link, Typography, CircularProgress, Box } from "@mui/material";
import { Order } from "@/model";
import PageContainer from "../../components/container/PageContainer";
import DashboardCard from "../../components/shared/DashboardCard";
import { useAppSelector } from "@/lib/hooks";
import { getToken } from "@/firebase/firebaseClient";
import axios from "axios";
import { OrderEditForm } from "./components/OrderEditForm";
import { useSnackbar } from "@/contexts/SnackBarContext";

const OrderEditPage = () => {
  const param = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentUser, loading: authLoading } = useAppSelector(
    (state) => state.authSlice
  );
  const { showNotification } = useSnackbar();

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
    <Box mb={2}>
      <Breadcrumbs aria-label="breadcrumb">
        <Link
          underline="hover"
          color="inherit"
          sx={{ cursor: "pointer" }}
          onClick={() => router.push("/dashboard")}
        >
          Dashboard
        </Link>
        <Link
          underline="hover"
          color="inherit"
          sx={{ cursor: "pointer" }}
          onClick={() => router.push("/dashboard/orders")}
        >
          Orders
        </Link>
        <Typography color="text.primary">
          Edit Order #{order?.orderId || param.orderId}
        </Typography>
      </Breadcrumbs>
    </Box>
  );

  if (loading) {
    return (
      <PageContainer title="Edit Order">
        <DashboardCard>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
            <CircularProgress />
          </Box>
        </DashboardCard>
      </PageContainer>
    );
  }

  if (!order) {
    return (
      <PageContainer title="Edit Order">
        <DashboardCard>
          <Box p={4} textAlign="center">
            <p>Order not found or failed to load.</p>
          </Box>
        </DashboardCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={`Edit Order #${order.orderId}`}>
      {/* ✅ Breadcrumbs added here */}
      <BreadcrumbNav />
      <DashboardCard>
        <OrderEditForm order={order} onRefresh={fetchOrder} />
      </DashboardCard>
    </PageContainer>
  );
};

export default OrderEditPage;
