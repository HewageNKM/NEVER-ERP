"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Permission, Role } from "@/model/Role";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { auth } from "@/firebase/firebaseClient";
import {
  IconDeviceFloppy,
  IconArrowLeft,
  IconLoader,
  IconShield,
  IconCheck,
} from "@tabler/icons-react";
import PageContainer from "../../components/container/PageContainer";

// --- NIKE AESTHETIC STYLES ---
const styles = {
  label:
    "block text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-2",
  input:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium px-4 py-3 rounded-sm border-2 border-transparent focus:bg-white focus:border-black transition-all duration-200 outline-none placeholder:text-gray-400",
  primaryBtn:
    "flex items-center justify-center px-6 py-4 bg-black text-white text-sm font-black uppercase tracking-widest hover:bg-gray-900 transition-all shadow-[4px_4px_0px_0px_rgba(156,163,175,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50",
  secondaryBtn:
    "flex items-center justify-center px-6 py-4 border-2 border-black text-black text-sm font-black uppercase tracking-widest hover:bg-gray-50 transition-all",
};

const EditRolePage = ({ params }: { params: Promise<{ id: string }> }) => {
  const router = useRouter();
  const [permissionsList, setPermissionsList] = useState<Permission[]>([]);
  const [roleId, setRoleId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    permissions: [] as string[],
  });

  useEffect(() => {
    async function init() {
      const { id } = await params;
      setRoleId(id);

      try {
        const token = await auth.currentUser?.getIdToken();
        const [permRes, roleRes] = await Promise.all([
          axios.get("/api/v2/roles", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`/api/v2/roles/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setPermissionsList(permRes.data.permissions || []);
        const roleData = roleRes.data as Role;
        setForm({
          name: roleData.name,
          permissions: roleData.permissions,
        });
      } catch (e) {
        toast.error("Failed to load data");
        router.push("/erp/roles");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [params, router]);

  const handlePermChange = (key: string, checked: boolean) => {
    if (checked) {
      setForm((prev) => ({ ...prev, permissions: [...prev.permissions, key] }));
    } else {
      setForm((prev) => ({
        ...prev,
        permissions: prev.permissions.filter((p) => p !== key),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return toast.error("Name is required");

    setSaving(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      await axios.put(`/api/v2/roles/${roleId}`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Role updated successfully");
      router.push("/erp/roles");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update role");
    } finally {
      setSaving(false);
    }
  };

  // Group permissions
  const groupedPermissions = permissionsList.reduce((acc, perm) => {
    if (!acc[perm.group]) acc[perm.group] = [];
    acc[perm.group].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) {
    return (
      <PageContainer title="Edit Role" description="Loading...">
        <div className="flex flex-col items-center justify-center py-32">
          <IconLoader className="animate-spin text-black mb-3" size={32} />
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Loading Role...
          </p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Edit Role" description={`Editing role: ${roleId}`}>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b-2 border-black pb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-black transition-colors w-fit"
          >
            <IconArrowLeft size={14} /> Back to Roles
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1 flex items-center gap-2">
              <IconShield size={14} /> Access Control
            </span>
            <h2 className="text-4xl font-black text-black uppercase tracking-tighter leading-none">
              Edit Role
            </h2>
            <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 mt-2 w-fit">
              {roleId}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white border border-gray-200 p-8 space-y-6">
            <div>
              <label className={styles.label}>
                Role Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={styles.input}
                placeholder="e.g. Inventory Manager"
              />
            </div>
          </div>

          {/* Permissions */}
          <div className="bg-white border border-gray-200 p-8">
            <h3 className="text-lg font-black uppercase tracking-tighter mb-6 border-b border-gray-100 pb-4">
              Permissions
            </h3>

            <div className="space-y-8">
              {Object.entries(groupedPermissions).map(([group, perms]) => (
                <div key={group}>
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">
                    {group}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {perms.map((perm) => (
                      <label
                        key={perm.key}
                        className="flex items-center gap-3 cursor-pointer group p-3 border border-gray-100 hover:border-black transition-colors"
                      >
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={form.permissions.includes(perm.key)}
                            onChange={(e) =>
                              handlePermChange(perm.key, e.target.checked)
                            }
                            className="sr-only peer"
                          />
                          <div className="w-5 h-5 border-2 border-gray-300 bg-white peer-checked:bg-black peer-checked:border-black transition-colors flex items-center justify-center">
                            <IconCheck
                              size={14}
                              className="text-white opacity-0 peer-checked:opacity-100"
                            />
                          </div>
                        </div>
                        <span className="text-xs font-medium text-gray-600 group-hover:text-black transition-colors">
                          {perm.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className={styles.secondaryBtn}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={saving}
            >
              {saving ? (
                <>
                  <IconLoader size={18} className="animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <IconDeviceFloppy size={18} className="mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
};

export default EditRolePage;
