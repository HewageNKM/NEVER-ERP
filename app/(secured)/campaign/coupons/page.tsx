"use client";

import React, { useState, useEffect } from "react";
import PageContainer from "../../components/container/PageContainer";
import {
  IconPlus,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { getToken } from "@/firebase/firebaseClient";
import axios from "axios";
import { Coupon } from "@/model/Coupon";
import CouponListTable from "./components/CouponListTable";
import CouponFormModal from "./components/CouponFormModal"; // Will create next
import { showNotification } from "@/utils/toast";

const CouponsPage = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, size: 20, total: 0 });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Coupon | null>(null);

  useEffect(() => {
    fetchCoupons();
  }, [pagination.page]);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await axios.get("/api/v2/coupons", {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: pagination.page, size: pagination.size },
      });

      setCoupons(response.data.dataList || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data.rowCount || 0,
      }));
    } catch (e: any) {
      console.error("Failed to fetch coupons", e);
      showNotification("Failed to fetch coupons", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Coupon) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = () => {
    handleCloseModal();
    fetchCoupons();
  };

  const handleDelete = async (item: Coupon) => {
    if (
      !window.confirm(`Are you sure you want to delete coupon "${item.code}"?`)
    )
      return;

    try {
      const token = await getToken();
      await axios.delete(`/api/v2/coupons/${item.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showNotification("Coupon deleted", "success");
      fetchCoupons();
    } catch (e) {
      console.error("Delete failed", e);
      showNotification("Failed to delete", "error");
    }
  };

  return (
    <PageContainer title="Coupons" description="Manage discount codes">
      <div className="w-full">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold uppercase tracking-tight text-gray-900">
            Coupons
          </h2>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center px-5 py-2.5 bg-gray-900 text-white text-sm font-bold uppercase tracking-wide rounded-sm hover:bg-gray-800 transition-all shadow-sm"
          >
            <IconPlus size={18} className="mr-2" />
            Create Coupon
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-6 mb-6">
          <CouponListTable
            items={coupons}
            loading={loading}
            onEdit={handleOpenEditModal}
            onDelete={handleDelete}
          />

          {/* Pagination */}
          <div className="flex justify-center mt-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.max(1, prev.page - 1),
                  }))
                }
                disabled={pagination.page === 1 || loading}
                className="p-2 border border-gray-200 rounded-sm hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
              >
                <IconChevronLeft size={18} />
              </button>
              <span className="text-sm font-bold text-gray-700 px-4">
                Page {pagination.page}
              </span>
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: prev.page + 1,
                  }))
                }
                disabled={loading || coupons.length < pagination.size}
                className="p-2 border border-gray-200 rounded-sm hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
              >
                <IconChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <CouponFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        coupon={editingItem}
      />
    </PageContainer>
  );
};

export default CouponsPage;
