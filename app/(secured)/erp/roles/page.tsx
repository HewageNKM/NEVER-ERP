"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Role } from "@/model/Role";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { auth } from "@/firebase/firebaseClient";
import PageContainer from "../components/container/PageContainer";
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconLoader,
  IconShield,
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";

// --- NIKE AESTHETIC STYLES ---
const styles = {
  primaryBtn:
    "flex items-center justify-center px-6 py-4 bg-black text-white text-sm font-black uppercase tracking-widest hover:bg-gray-900 transition-all shadow-[4px_4px_0px_0px_rgba(156,163,175,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50",
  iconBtn:
    "w-8 h-8 flex items-center justify-center border border-gray-200 hover:bg-black hover:border-black hover:text-white transition-colors disabled:opacity-30",
};

type RoleWithPermissions = Role & { permissions: string[] };

const RolesPage = () => {
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();
  const { showConfirmation } = useConfirmationDialog();

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await axios.get("/api/v2/roles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoles(response.data.roles || []);
    } catch (error) {
      console.error("Failed to fetch roles", error);
      toast.error("Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    showConfirmation({
      title: "Delete Role",
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
      onSuccess: async () => {
        setDeleting(id);
        try {
          const token = await auth.currentUser?.getIdToken();
          await axios.delete(`/api/v2/roles/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          toast.success("Role deleted");
          fetchRoles();
        } catch (e) {
          toast.error("Failed to delete role");
        } finally {
          setDeleting(null);
        }
      },
    });
  };

  return (
    <PageContainer
      title="Roles"
      description="Manage user roles and permissions"
    >
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-2 border-black pb-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1 flex items-center gap-2">
              <IconShield size={14} /> Access Control
            </span>
            <h2 className="text-4xl font-black text-black uppercase tracking-tighter leading-none">
              Role Management
            </h2>
          </div>
          <button
            onClick={() => router.push("/erp/roles/create")}
            className={styles.primaryBtn}
          >
            <IconPlus size={18} className="mr-2" />
            New Role
          </button>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <IconLoader className="animate-spin text-black mb-3" size={32} />
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Loading Roles...
              </p>
            </div>
          ) : roles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-100 m-4">
              <p className="text-lg font-black uppercase tracking-tighter text-gray-300">
                No Roles Found
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Create your first role to get started.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] border-b-2 border-black">
                  <tr>
                    <th className="p-6">Role Name</th>
                    <th className="p-6">Role ID</th>
                    <th className="p-6">Permissions</th>
                    <th className="p-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {roles.map((role) => (
                    <tr
                      key={role.id}
                      className="border-b border-gray-100 group hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-6 align-middle">
                        <div className="flex flex-col">
                          <span className="font-black text-black uppercase tracking-wide">
                            {role.name}
                          </span>
                          {role.isSystem && (
                            <span className="text-[9px] text-gray-400 font-bold uppercase">
                              System Role
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-6 align-middle">
                        <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1">
                          {role.id}
                        </span>
                      </td>
                      <td className="p-6 align-middle">
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.slice(0, 4).map((p) => (
                            <span
                              key={p}
                              className="px-1.5 py-0.5 bg-gray-100 text-[9px] font-bold text-gray-600 uppercase border border-gray-200"
                            >
                              {p}
                            </span>
                          ))}
                          {role.permissions.length > 4 && (
                            <span className="px-1.5 py-0.5 bg-black text-[9px] font-bold text-white uppercase">
                              +{role.permissions.length - 4} MORE
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-6 align-middle text-right">
                        {!role.isSystem && (
                          <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200">
                            <button
                              onClick={() =>
                                router.push(`/erp/roles/${role.id}`)
                              }
                              className={styles.iconBtn}
                              title="Edit"
                            >
                              <IconPencil size={16} stroke={2} />
                            </button>
                            <button
                              onClick={() => handleDelete(role.id, role.name)}
                              disabled={deleting === role.id}
                              className={`${styles.iconBtn} hover:border-red-600 hover:bg-red-600`}
                              title="Delete"
                            >
                              {deleting === role.id ? (
                                <IconLoader
                                  size={16}
                                  className="animate-spin"
                                />
                              ) : (
                                <IconTrash size={16} stroke={2} />
                              )}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default RolesPage;
