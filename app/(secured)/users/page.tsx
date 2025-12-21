"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconLoader,
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
  IconUsers,
  IconUserCheck,
  IconUserX,
  IconShield,
  IconFilter,
  IconRefresh,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import { useAppSelector } from "@/lib/hooks";
import { User } from "@/model/User";
import PageContainer from "../components/container/PageContainer";
import {
  getUsersV2Action,
  addNewUserAction,
  updateUserByIdAction,
  deleteUserByIdAction,
} from "@/actions/usersActions";
import { showNotification } from "@/utils/toast";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";
import * as XLSX from "xlsx";

// --- NIKE AESTHETIC STYLES ---
const styles = {
  label:
    "block text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-2",
  input:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium px-4 py-3 rounded-sm border-2 border-transparent focus:bg-white focus:border-black transition-all duration-200 outline-none placeholder:text-gray-400",
  select:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium px-4 py-3 rounded-sm border-2 border-transparent focus:bg-white focus:border-black transition-all duration-200 outline-none appearance-none cursor-pointer uppercase",
  primaryBtn:
    "flex items-center justify-center px-6 py-3 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-gray-900 transition-all rounded-sm shadow-sm hover:shadow-md",
  secondaryBtn:
    "flex items-center justify-center px-6 py-3 border-2 border-black text-black text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all rounded-sm",
  iconBtn:
    "w-8 h-8 flex items-center justify-center border border-gray-200 hover:bg-black hover:border-black hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-300",
  summaryCard:
    "bg-white border border-gray-200 p-6 flex flex-col justify-between hover:border-black transition-colors duration-300",
};

// ============ USER FORM MODAL ============
const UserForm = ({
  showForm,
  onClose,
  user,
  currentUser,
  onSuccess,
}: {
  showForm: boolean;
  onClose: () => void;
  user: User | null;
  currentUser: User | null;
  onSuccess: () => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (evt: React.FormEvent<HTMLFormElement>) => {
    try {
      setIsLoading(true);
      evt.preventDefault();
      const form = evt.target as HTMLFormElement;
      const userId: string = (
        form.elements.namedItem("userId") as HTMLInputElement
      ).value;
      const username: string = (
        form.elements.namedItem("username") as HTMLInputElement
      ).value;
      const email: string = (
        form.elements.namedItem("email") as HTMLInputElement
      ).value;
      const status: string = (
        form.elements.namedItem("status") as HTMLSelectElement
      ).value;
      const role: string = (
        form.elements.namedItem("role") as HTMLSelectElement
      ).value.toUpperCase();

      const usr: User = {
        userId,
        username,
        email,
        status,
        role,
        createdAt: user?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (userId === "Auto Generated") {
        await addNewUserAction(usr);
        showNotification("USER CREATED", "success");
      } else {
        await updateUserByIdAction(usr);
        showNotification("USER UPDATED", "success");
      }

      setTimeout(() => onSuccess(), 1500);
      onClose();
    } catch (e: any) {
      console.error(e);
      showNotification(e.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!showForm) return null;

  return (
    <AnimatePresence>
      {showForm && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-md p-4 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="bg-white w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-200"
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex justify-between items-center p-6 border-b-2 border-black">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">
                  System Access
                </span>
                <h2 className="text-2xl font-black uppercase tracking-tighter text-black leading-none">
                  {user ? "Modify User" : "New User"}
                </h2>
              </div>
              <button
                onClick={isLoading ? undefined : onClose}
                disabled={isLoading}
                className="group relative flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-black transition-colors duration-300"
              >
                <IconX
                  size={20}
                  className="text-black group-hover:text-white transition-colors"
                />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className={styles.label}>User ID</label>
                  <input
                    name="userId"
                    disabled
                    defaultValue={user?.userId || "Auto Generated"}
                    className={`${styles.input} font-mono text-xs tracking-wider bg-gray-100 text-gray-500 cursor-not-allowed`}
                  />
                </div>

                <div>
                  <label className={styles.label}>
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    disabled={isLoading}
                    name="username"
                    defaultValue={user?.username || ""}
                    className={styles.input}
                    placeholder="ENTER NAME..."
                  />
                </div>

                <div>
                  <label className={styles.label}>
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="email"
                    name="email"
                    disabled={!!user || isLoading}
                    defaultValue={user?.email || ""}
                    className={`${styles.input} disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed`}
                    placeholder="ENTER EMAIL..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className={styles.label}>Account Status</label>
                    <select
                      name="status"
                      disabled={isLoading}
                      defaultValue={user?.status || "Inactive"}
                      className={styles.select}
                    >
                      <option value="Active">ACTIVE</option>
                      <option value="Inactive">INACTIVE</option>
                    </select>
                  </div>

                  <div>
                    <label className={styles.label}>Access Role</label>
                    <select
                      name="role"
                      disabled={isLoading}
                      defaultValue={user?.role?.toLowerCase() || "user"}
                      className={styles.select}
                    >
                      <option value="admin">ADMIN</option>
                      <option value="user">USER</option>
                      <option
                        value="owner"
                        disabled={currentUser?.role !== "OWNER"}
                      >
                        OWNER
                      </option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-8">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading}
                    className="px-6 py-3 text-xs font-black uppercase tracking-widest text-black border border-transparent hover:border-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={styles.primaryBtn}
                  >
                    {isLoading ? (
                      <IconLoader size={16} className="animate-spin mr-2" />
                    ) : user ? (
                      "Save Changes"
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============ SUMMARY CARD ============
const SummaryCard = ({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
}) => (
  <div className={styles.summaryCard}>
    <div className="flex justify-between items-start mb-4">
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
        {title}
      </span>
      <Icon size={20} className="text-black" stroke={1.5} />
    </div>
    <p className="text-4xl font-black text-black tracking-tighter leading-none">
      {value}
    </p>
  </div>
);

// ============ MAIN USERS PAGE ============
const UsersPage = () => {
  // State
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [showAnonymous, setShowAnonymous] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { currentUser } = useAppSelector((state) => state.authSlice);

  const { showConfirmation } = useConfirmationDialog();

  // Fetch users
  const fetchUsers = async (params?: {
    page?: number;
    size?: number;
    search?: string;
    role?: string;
    status?: string;
  }) => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const response = await getUsersV2Action({
        page: params?.page ?? page,
        size: params?.size ?? size,
        search: params?.search ?? search,
        role: params?.role ?? role,
        status: params?.status ?? status,
      });
      setUsers(response.users);
      setTotalUsers(response.total);
      setHasMore(response.hasMore);
    } catch (e: any) {
      console.error(e);
      showNotification(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentUser]);

  // Handlers
  const handleFilter = () => {
    setPage(1);
    fetchUsers({ page: 1 });
  };

  const handleReset = () => {
    setSearch("");
    setRole("all");
    setStatus("all");
    setPage(1);
    fetchUsers({ page: 1, search: "", role: "all", status: "all" });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchUsers({ page: newPage });
  };

  const handleSizeChange = (newSize: number) => {
    setSize(newSize);
    setPage(1);
    fetchUsers({ page: 1, size: newSize });
  };

  const handleDelete = async (userId: string) => {
    showConfirmation({
      title: "DELETE USER?",
      message: "This action cannot be undone.",
      variant: "danger",
      onSuccess: async () => {
        try {
          await deleteUserByIdAction(userId);
          showNotification("USER DELETED", "success");
          setTimeout(() => fetchUsers(), 1500);
        } catch (e: any) {
          showNotification(e.message, "error");
        }
      },
    });
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowUserForm(true);
  };

  const handleExport = () => {
    if (!displayedUsers.length) {
      showNotification("No data to export", "info");
      return;
    }
    const exportData = displayedUsers.map((u) => ({
      "User ID": u.userId,
      Username: u.username,
      Email: u.email,
      Status: u.status,
      Role: u.role,
      "Created At": u.createdAt,
      "Updated At": u.updatedAt,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, `users_${new Date().toISOString().split("T")[0]}.xlsx`);
    showNotification("EXPORT COMPLETE", "success");
  };

  // Filter users based on anonymous toggle
  const isAnonymousUser = (u: User) =>
    u.role === "Pending" || u.email?.includes("anonymous") || !u.email;

  const displayedUsers = showAnonymous
    ? users.filter(isAnonymousUser)
    : users.filter((u) => !isAnonymousUser(u));

  // Stats (based on displayed users)
  const stats = {
    total: totalUsers,
    active: displayedUsers.filter((u) => u.status === "Active").length,
    inactive: displayedUsers.filter((u) => u.status === "Inactive").length,
    admins: displayedUsers.filter((u) =>
      ["ADMIN", "OWNER"].includes(u.role.toUpperCase())
    ).length,
    anonymous: users.filter(isAnonymousUser).length,
  };

  // Render Status Badge
  const renderStatus = (status: string) => {
    const isSuccess = status === "Active";
    return (
      <span
        className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest border ${
          isSuccess
            ? "bg-black text-white border-black"
            : "bg-white text-gray-400 border-gray-200"
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <PageContainer title="Users" description="Users Management">
      <div className="w-full space-y-8">
        {/* Header - Fixed Mobile Layout */}
        <div className="flex flex-row justify-between items-end gap-4 border-b-2 border-black pb-6">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase flex items-center gap-2">
              <IconUsers size={14} /> System Administration
            </span>
            <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
              <h2 className="text-3xl sm:text-4xl font-black text-black uppercase tracking-tighter leading-none">
                User Management
              </h2>
            </div>
          </div>
          <button
            onClick={() => fetchUsers()}
            className="shrink-0 w-10 h-10 flex items-center justify-center bg-white border-2 border-black text-black hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
            title="Refresh List"
          >
            <IconRefresh size={18} stroke={2.5} />
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-4">
              <label className={styles.label}>Search Users</label>
              <div className="relative">
                <IconSearch
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="NAME OR EMAIL..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFilter()}
                  className={styles.input}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className={styles.label}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={styles.select}
              >
                <option value="all">ALL STATUS</option>
                <option value="Active">ACTIVE</option>
                <option value="Inactive">INACTIVE</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className={styles.label}>Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={styles.select}
              >
                <option value="all">ALL ROLES</option>
                <option value="OWNER">OWNER</option>
                <option value="ADMIN">ADMIN</option>
                <option value="USER">USER</option>
              </select>
            </div>

            {/* Anonymous Toggle */}
            <div className="md:col-span-2 flex items-center justify-between p-3 border-2 border-transparent bg-[#f5f5f5] hover:border-gray-200 transition-colors h-[48px]">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                {showAnonymous ? "Anonymous" : "Registered"}
              </span>
              <button
                type="button"
                onClick={() => setShowAnonymous(!showAnonymous)}
                className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
                  showAnonymous ? "bg-black" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    showAnonymous ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            <div className="md:col-span-2 flex gap-2">
              <button
                onClick={handleFilter}
                className={`${styles.primaryBtn} w-full`}
              >
                <IconFilter size={16} />
              </button>
              <button
                onClick={handleReset}
                className={`${styles.secondaryBtn} w-full bg-white`}
              >
                <IconX size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            title="Total Users"
            value={stats.total}
            icon={IconUsers}
            color="bg-gray-900"
          />
          <SummaryCard
            title="Active"
            value={stats.active}
            icon={IconUserCheck}
            color="bg-green-600"
          />
          <SummaryCard
            title="Inactive"
            value={stats.inactive}
            icon={IconUserX}
            color="bg-red-500"
          />
          <SummaryCard
            title="Admins"
            value={stats.admins}
            icon={IconShield}
            color="bg-blue-600"
          />
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 overflow-hidden">
          {/* Fixed Directory Header - Mobile Optimized with Icons */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 sm:p-6 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-black uppercase tracking-tighter text-black">
                Directory
              </h3>
              <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1">
                {displayedUsers.length} / {totalUsers}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleExport}
                disabled={!displayedUsers.length}
                className={`${styles.secondaryBtn} w-full sm:w-auto px-3 py-3 sm:px-4 sm:py-2 border-gray-200 hover:border-black text-gray-600 hover:text-black disabled:opacity-50 flex items-center justify-center whitespace-nowrap`}
              >
                <IconDownload size={16} className="mr-2 shrink-0" />
                Export
              </button>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setShowUserForm(true);
                }}
                className={`${styles.primaryBtn} w-full sm:w-auto px-3 py-3 sm:px-4 sm:py-2 shadow-none hover:shadow-lg flex items-center justify-center whitespace-nowrap`}
              >
                <IconPlus size={16} className="mr-2 shrink-0" />
                Add User
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] border-b-2 border-black">
                <tr>
                  <th className="p-6">User Details</th>
                  <th className="p-6 text-center">Status</th>
                  <th className="p-6 text-center">Role</th>
                  <th className="p-6 text-center">Joined</th>
                  <th className="p-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-20 text-center">
                      <IconLoader
                        className="animate-spin text-black mx-auto mb-2"
                        size={32}
                      />
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                        Loading Data...
                      </span>
                    </td>
                  </tr>
                ) : displayedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-20 text-center">
                      <p className="text-lg font-black uppercase tracking-tighter text-gray-300">
                        No Users Found
                      </p>
                    </td>
                  </tr>
                ) : (
                  displayedUsers.map((user) => (
                    <tr
                      key={user.userId}
                      className="border-b border-gray-100 group hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-6 align-top">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-black uppercase tracking-wide">
                            {user.username}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {user.email}
                          </span>
                          <span className="text-[9px] text-gray-300 font-mono mt-1">
                            ID: {user.userId.slice(0, 8)}...
                          </span>
                        </div>
                      </td>
                      <td className="p-6 align-top text-center">
                        {renderStatus(user.status)}
                      </td>
                      <td className="p-6 align-top text-center">
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider bg-gray-100 px-2 py-1">
                          {user.role}
                        </span>
                      </td>
                      <td className="p-6 align-top text-center">
                        <span className="text-[10px] font-mono text-gray-500 font-bold">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="p-6 align-top text-right">
                        <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200">
                          <button
                            disabled={
                              currentUser?.role !== "OWNER" &&
                              user.role === "OWNER"
                            }
                            onClick={() => handleEdit(user)}
                            className={styles.iconBtn}
                            title="Edit"
                          >
                            <IconPencil size={16} stroke={2} />
                          </button>
                          <button
                            disabled={
                              currentUser?.userId === user.userId ||
                              (currentUser?.role !== "OWNER" &&
                                user.role === "OWNER")
                            }
                            onClick={() => handleDelete(user.userId)}
                            className={`${styles.iconBtn} hover:border-red-600 hover:bg-red-600`}
                            title="Delete"
                          >
                            <IconTrash size={16} stroke={2} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Rows:
            </span>
            <select
              value={size}
              onChange={(e) => handleSizeChange(parseInt(e.target.value))}
              className="bg-[#f5f5f5] text-black text-xs font-bold uppercase rounded-sm border-transparent focus:ring-0 focus:border-black cursor-pointer py-1 pl-2 pr-6"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className={styles.iconBtn}
            >
              <IconChevronLeft size={18} />
            </button>
            <span className="text-xs font-black text-black px-4 uppercase tracking-widest">
              Page {page}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={!hasMore}
              className={styles.iconBtn}
            >
              <IconChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* User Form Modal */}
      <UserForm
        showForm={showUserForm}
        onClose={() => {
          setShowUserForm(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        currentUser={currentUser}
        onSuccess={() => fetchUsers()}
      />
    </PageContainer>
  );
};

export default UsersPage;
