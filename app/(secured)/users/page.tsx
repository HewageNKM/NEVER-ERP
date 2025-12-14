"use client";

import React, { useEffect, useState } from "react";
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
import { User } from "@/model";
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
        showNotification("User created successfully", "success");
      } else {
        await updateUserByIdAction(usr);
        showNotification("User updated successfully", "success");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-sm shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold uppercase tracking-wide text-gray-900">
            {user ? "Edit User" : "Add User"}
          </h2>
          <button
            onClick={isLoading ? undefined : onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <IconX size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 uppercase mb-1">
                User ID
              </label>
              <input
                name="userId"
                disabled
                defaultValue={user?.userId || "Auto Generated"}
                className="w-full px-3 py-2 border border-gray-300 rounded-sm bg-gray-50 text-gray-500 font-mono text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 uppercase mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                required
                disabled={isLoading}
                name="username"
                defaultValue={user?.username || ""}
                className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 uppercase mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="email"
                name="email"
                disabled={!!user || isLoading}
                defaultValue={user?.email || ""}
                className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 uppercase mb-1">
                  Status
                </label>
                <select
                  name="status"
                  disabled={isLoading}
                  defaultValue={user?.status || "Inactive"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 uppercase mb-1">
                  Role
                </label>
                <select
                  name="role"
                  disabled={isLoading}
                  defaultValue={user?.role?.toLowerCase() || "user"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 transition-colors bg-white"
                >
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                  <option
                    value="owner"
                    disabled={currentUser?.role !== "OWNER"}
                  >
                    Owner
                  </option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-6 py-2 text-sm font-bold text-gray-600 uppercase hover:bg-gray-100 rounded-sm transition-colors border border-gray-200"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-gray-900 text-white text-sm font-bold uppercase rounded-sm hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center"
              >
                {isLoading && (
                  <IconLoader size={16} className="animate-spin mr-2" />
                )}
                {user ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
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
  <div className="bg-white border border-gray-200 p-4 rounded-sm shadow-sm flex items-center gap-4">
    <div className={`p-3 rounded-sm ${color}`}>
      <Icon size={20} className="text-white" />
    </div>
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
        {title}
      </p>
      <p className="text-2xl font-black text-gray-900">{value}</p>
    </div>
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
      title: "Delete User",
      message: "Deleting a user has serious consequences. Are you sure?",
      onSuccess: async () => {
        try {
          await deleteUserByIdAction(userId);
          showNotification("User deleted successfully", "success");
          setTimeout(() => fetchUsers(), 1500);
        } catch (e: any) {
          showNotification(e.message, "error");
        }
      },
    });
  };

  const handleEdit = (user: User) => {
    showConfirmation({
      title: "Edit User",
      message: "Are you sure you want to edit this user?",
      onSuccess: () => {
        setSelectedUser(user);
        setShowUserForm(true);
      },
    });
  };

  const handleExport = () => {
    if (!displayedUsers.length) {
      showNotification("No users to export", "info");
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
    showNotification("Exported successfully", "success");
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

  return (
    <PageContainer title="Users" description="Users Management">
      <div className="w-full space-y-6">
        {/* Header & Filters */}
        <div className="flex flex-col gap-6 bg-white border border-gray-200 rounded-sm shadow-sm p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold uppercase tracking-tight text-gray-900">
                User Management
              </h2>
              <p className="text-sm text-gray-500 font-medium mt-1">
                Manage access, roles, and permissions.
              </p>
            </div>
            <button
              onClick={() => fetchUsers()}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-sm transition-colors text-sm font-bold uppercase"
            >
              <IconRefresh size={16} className="mr-2" />
              Refresh
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Search
              </label>
              <div className="relative">
                <IconSearch
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFilter()}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>
            </div>

            <div className="min-w-[140px]">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-900"
              >
                <option value="all">All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="min-w-[140px]">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-900"
              >
                <option value="all">All</option>
                <option value="OWNER">Owner</option>
                <option value="ADMIN">Admin</option>
                <option value="USER">User</option>
              </select>
            </div>

            {/* Anonymous Toggle */}
            <div className="flex items-center gap-3 px-3 py-2 border border-gray-200 rounded-sm bg-gray-50">
              <span className="text-xs font-bold text-gray-500 uppercase whitespace-nowrap">
                {showAnonymous ? "Anonymous" : "Users"}
              </span>
              <button
                type="button"
                onClick={() => setShowAnonymous(!showAnonymous)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showAnonymous ? "bg-gray-900" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showAnonymous ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleFilter}
                className="flex items-center px-5 py-2 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-black transition-colors"
              >
                <IconFilter size={16} className="mr-2" />
                Filter
              </button>
              <button
                onClick={handleReset}
                className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-gray-50 transition-colors"
              >
                <IconX size={16} className="mr-1" />
                Reset
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
        <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-bold uppercase tracking-wide text-gray-900">
                User List
              </h3>
              <span className="text-xs font-bold text-gray-500">
                ({displayedUsers.length} of {totalUsers})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
                disabled={!displayedUsers.length}
                className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold uppercase rounded-sm hover:bg-gray-50 disabled:opacity-50"
              >
                <IconDownload size={16} className="mr-2" />
                Export
              </button>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setShowUserForm(true);
                }}
                className="flex items-center px-4 py-2 bg-gray-900 text-white text-xs font-bold uppercase rounded-sm hover:bg-gray-800"
              >
                <IconPlus size={16} className="mr-2" />
                Add User
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 text-gray-900 border-b border-gray-200 uppercase text-xs tracking-wider font-bold">
                <tr>
                  <th className="p-4">User ID</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Created</th>
                  <th className="p-4">Updated</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center">
                      <IconLoader
                        className="animate-spin text-gray-400 mx-auto mb-2"
                        size={24}
                      />
                      <span className="text-gray-500 font-bold uppercase text-xs">
                        Loading...
                      </span>
                    </td>
                  </tr>
                ) : displayedUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-8 text-center text-gray-500 font-bold uppercase"
                    >
                      No users found.
                    </td>
                  </tr>
                ) : (
                  displayedUsers.map((user) => (
                    <tr
                      key={user.userId}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-4 font-mono text-xs text-gray-500">
                        {user.userId}
                      </td>
                      <td className="p-4 font-bold text-gray-900">
                        {user.username}
                      </td>
                      <td className="p-4 text-gray-600">{user.email}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded-sm text-xs font-bold uppercase ${
                            user.status === "Active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded-sm text-xs font-bold uppercase ${
                            user.role.toUpperCase() === "OWNER"
                              ? "bg-purple-100 text-purple-800"
                              : user.role.toUpperCase() === "ADMIN"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500 text-xs">
                        {user.createdAt}
                      </td>
                      <td className="p-4 text-gray-500 text-xs">
                        {user.updatedAt}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            disabled={
                              currentUser?.role !== "OWNER" &&
                              user.role === "OWNER"
                            }
                            onClick={() => handleEdit(user)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-sm disabled:opacity-30"
                          >
                            <IconPencil size={18} />
                          </button>
                          <button
                            disabled={
                              currentUser?.userId === user.userId ||
                              (currentUser?.role !== "OWNER" &&
                                user.role === "OWNER")
                            }
                            onClick={() => handleDelete(user.userId)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-sm disabled:opacity-30"
                          >
                            <IconTrash size={18} />
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
        <div className="flex flex-col md:flex-row justify-center items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase">
              Rows:
            </span>
            <select
              value={size}
              onChange={(e) => handleSizeChange(parseInt(e.target.value))}
              className="bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded-sm p-1.5"
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
              className="p-2 border border-gray-200 rounded-sm hover:bg-gray-50 disabled:opacity-50"
            >
              <IconChevronLeft size={18} />
            </button>
            <span className="text-sm font-bold text-gray-700 px-4">
              Page {page}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={!hasMore}
              className="p-2 border border-gray-200 rounded-sm hover:bg-gray-50 disabled:opacity-50"
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
