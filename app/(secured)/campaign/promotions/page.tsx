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
import { Promotion } from "@/model/Promotion";
import PromotionListTable from "./components/PromotionListTable";
import PromotionFormModal from "./components/PromotionFormModal"; // Will create next
import { showNotification } from "@/utils/toast";
import { useAppSelector } from "@/lib/hooks";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";

const PromotionsPage = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, size: 20, total: 0 });
  const [filterStatus, setFilterStatus] = useState<string>("");
  const { currentUser } = useAppSelector((state) => state.authSlice);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Promotion | null>(null);
  const { showConfirmation } = useConfirmationDialog();

  useEffect(() => {
    if (!currentUser) return;
    fetchPromotions();
  }, [pagination.page, filterStatus, currentUser]);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const params: any = {
        page: pagination.page,
        size: pagination.size,
      };
      if (filterStatus) params.status = filterStatus;

      const response = await axios.get("/api/v2/promotions", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setPromotions(response.data.dataList || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data.rowCount || 0,
      }));
    } catch (e: any) {
      console.error("Failed to fetch promotions", e);
      showNotification("Failed to fetch promotions", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Promotion) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = () => {
    handleCloseModal();
    fetchPromotions();
  };

  const handleDelete = async (item: Promotion) => {
    showConfirmation({
      title: "Delete Promotion?",
      message: `Are you sure you want to delete "${item.name}"?`,
      variant: "danger",
      confirmText: "Delete",
      onSuccess: async () => {
        try {
          const token = await getToken();
          await axios.delete(`/api/v2/promotions/${item.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          showNotification("Promotion deleted", "success");
          fetchPromotions();
        } catch (e) {
          console.error("Delete failed", e);
          showNotification("Failed to delete", "error");
        }
      },
    });
  };

  return (
    <PageContainer
      title="Promotions"
      description="Manage promotional campaigns"
    >
      <div className="w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">
              Campaign Management
            </span>
            <h2 className="text-4xl font-black text-black uppercase tracking-tighter leading-none">
              Promotions
            </h2>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center px-6 py-4 bg-black text-white text-sm font-black uppercase tracking-widest hover:bg-gray-900 transition-all shadow-[4px_4px_0px_0px_rgba(156,163,175,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
          >
            <IconPlus size={18} className="mr-2" />
            Create Promotion
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-6 mb-6">
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <PromotionListTable
            items={promotions}
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
                disabled={loading || promotions.length < pagination.size} // Simple check
                className="p-2 border border-gray-200 rounded-sm hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
              >
                <IconChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <PromotionFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        promotion={editingItem}
      />
    </PageContainer>
  );
};

export default PromotionsPage;
