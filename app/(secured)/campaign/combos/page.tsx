"use client";

import React, { useState, useEffect } from "react";
import {
  IconPlus,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { getToken } from "@/firebase/firebaseClient";
import axios from "axios";
import { ComboProduct } from "@/model/ComboProduct";
import ComboListTable from "./components/ComboListTable";
import ComboFormModal from "./components/ComboFormModal"; // Will create next
import { showNotification } from "@/utils/toast";
import PageContainer from "../../components/container/PageContainer";
import { useAppSelector } from "@/lib/hooks";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";

const CombosPage = () => {
  const [combos, setCombos] = useState<ComboProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, size: 20, total: 0 });
  const { currentUser } = useAppSelector((state) => state.authSlice);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ComboProduct | null>(null);
  const { showConfirmation } = useConfirmationDialog();

  useEffect(() => {
    if (!currentUser) return;
    fetchCombos();
  }, [pagination.page, currentUser]);

  const fetchCombos = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await axios.get("/api/v2/combos", {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: pagination.page, size: pagination.size },
      });

      setCombos(response.data.dataList || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data.rowCount || 0,
      }));
    } catch (e: any) {
      console.error("Failed to fetch combos", e);
      showNotification("Failed to fetch combos", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: ComboProduct) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = () => {
    handleCloseModal();
    fetchCombos();
  };

  const handleDelete = async (item: ComboProduct) => {
    showConfirmation({
      title: "Delete Combo?",
      message: `Are you sure you want to delete combo "${item.name}"?`,
      variant: "danger",
      confirmText: "Delete",
      onSuccess: async () => {
        try {
          const token = await getToken();
          await axios.delete(`/api/v2/combos/${item.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          showNotification("Combo deleted", "success");
          fetchCombos();
        } catch (e) {
          console.error("Delete failed", e);
          showNotification("Failed to delete", "error");
        }
      },
    });
  };

  return (
    <PageContainer
      title="Combo Products"
      description="Manage product bundles and deals"
    >
      <div className="w-full">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-2xl font-bold uppercase tracking-tight text-gray-900">
            Combo Products
          </h2>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center px-5 py-2.5 bg-gray-900 text-white text-sm font-bold uppercase tracking-wide rounded-sm hover:bg-gray-800 transition-all shadow-sm"
          >
            <IconPlus size={18} className="mr-2" />
            Create Combo
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-6 mb-6">
          <ComboListTable
            items={combos}
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
                disabled={loading || combos.length < pagination.size}
                className="p-2 border border-gray-200 rounded-sm hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
              >
                <IconChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <ComboFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        combo={editingItem}
      />
    </PageContainer>
  );
};

export default CombosPage;
