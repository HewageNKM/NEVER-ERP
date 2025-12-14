"use client";
import React, { useState, useRef } from "react";
import Image from "next/image";
import { useAppSelector, useAppDispatch } from "@/lib/hooks"; // Added dispatch
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion"; // Add import
import {
  IconUser,
  IconMail,
  IconShieldLock,
  IconCalendar,
  IconCircleCheck,
  IconLogout,
  IconPencil,
  IconCamera,
  IconX,
  IconLoader,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext"; // Add import

const ProfilePage = () => {
  const { currentUser } = useAppSelector((state) => state.authSlice);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showConfirmation } = useConfirmationDialog(); // Use hook

  // Animation Variants (Consistent with ConfirmationDialog)
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: "spring", damping: 20, stiffness: 300 },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 10,
      transition: { duration: 0.1 },
    },
  };

  // === LOCAL STATE ===
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editName, setEditName] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  // === HELPERS ===
  const formatDate = (date: any) => {
    if (!date) return "N/A";
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // === ACTIONS ===

  // 1. Open Edit Modal
  const openEditModal = () => {
    setEditName(currentUser.username || "");
    setPreviewUrl(currentUser.photoURL || null);
    setEditFile(null);
    setIsEditing(true);
  };

  // 2. Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showNotification("Image too large (Max 2MB)", "error");
        return;
      }
      setEditFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // 3. Update Profile (PUT /api/v2/users/[id])
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("username", editName);
      if (editFile) {
        formData.append("file", editFile);
      }

      // Call your API endpoint
      const response = await fetch(`/api/v2/users/${currentUser.userId}`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to update profile");

      const updatedUser = await response.json();

      // Update Redux Store
      // Ensure your backend returns the updated user object structure expected by Redux
      // dispatch(setCurrentUser({ ...currentUser, ...updatedUser })); // Assumed action exists or replace with setUser
      showNotification("PROFILE UPDATED", "success");
      setIsEditing(false);
    } catch (error: any) {
      console.error(error);
      showNotification(error.message || "Update failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Logout
  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    // Clear Redux state if needed, usually handled by an auth listener
    router.push("/");
    showNotification("LOGGED OUT SUCCESSFULLY", "success");
  };

  // 5. Delete Account (DELETE /api/v2/users/[id])
  const handleDeleteAccount = () => {
    showConfirmation({
      title: "DELETE THIS ACCOUNT?",
      message:
        "This action cannot be undone. All data will be permanently removed.",
      variant: "danger",
      confirmText: "DELETE ACCOUNT",
      onSuccess: async () => {
        try {
          setIsLoading(true);
          const response = await fetch(`/api/v2/users/${currentUser.userId}`, {
            method: "DELETE",
          });

          if (!response.ok) throw new Error("Failed to delete account");

          // Sign out from Firebase immediately after DB deletion
          const auth = getAuth();
          await signOut(auth);

          router.push("/");
          showNotification("ACCOUNT DELETED", "success");
        } catch (error: any) {
          console.error(error);
          showNotification("Could not delete account", "error");
          setIsLoading(false);
        }
      },
    });
  };

  const InfoCard = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: any;
    label: string;
    value: string;
  }) => (
    <div className="p-6 border-2 border-transparent bg-gray-50 hover:bg-white hover:border-black transition-all duration-300 group">
      <div className="flex items-start gap-5">
        <div className="p-3 bg-white border border-gray-200 group-hover:bg-black group-hover:text-white group-hover:border-black transition-colors">
          <Icon size={24} stroke={1.5} />
        </div>
        <div>
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 group-hover:text-black transition-colors">
            {label}
          </h3>
          <p className="text-sm font-black text-black uppercase tracking-wide break-all">
            {value}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 relative">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between border-b-2 border-black pb-8 mb-12 gap-6">
        <div>
          <h1 className="text-4xl md:text-6xl font-black text-black uppercase tracking-tighter leading-none mb-4">
            My Profile
          </h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">
            Manage account details & preferences
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 border border-green-200 text-[10px] font-black uppercase tracking-widest">
            <IconCircleCheck size={14} />
            {currentUser.status || "ACTIVE"}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Identity Card (Sticky) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border-2 border-black p-8 flex flex-col items-center text-center relative overflow-hidden group">
            {/* Background Pattern */}
            <div className="absolute top-0 left-0 w-full h-24 bg-gray-100 -z-0"></div>

            <div className="relative z-10 w-32 h-32 mb-6">
              <div className="w-full h-full rounded-full bg-white border-4 border-black p-1 overflow-hidden relative">
                {currentUser.photoURL ? (
                  <Image
                    src={currentUser.photoURL}
                    alt="Profile"
                    fill
                    className="object-cover rounded-full"
                  />
                ) : (
                  <div className="w-full h-full bg-black text-white flex items-center justify-center rounded-full">
                    <span className="text-4xl font-black uppercase">
                      {currentUser.username?.charAt(0) || "U"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-1">
              {currentUser.username || "Unknown User"}
            </h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">
              {currentUser.role || "Member"}
            </p>

            <div className="w-full space-y-3">
              <button
                onClick={openEditModal}
                className="w-full py-3 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <IconPencil size={16} /> Edit Details
              </button>
              <button
                onClick={handleLogout}
                className="w-full py-3 bg-white border-2 border-gray-200 text-black text-xs font-black uppercase tracking-widest hover:border-red-600 hover:text-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <IconLogout size={16} /> Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Info */}
        <div className="lg:col-span-8">
          <h3 className="text-xl font-black uppercase tracking-tighter mb-6 flex items-center gap-2">
            Account Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard
              icon={IconUser}
              label="Display Name"
              value={currentUser.username}
            />
            <InfoCard
              icon={IconMail}
              label="Email Address"
              value={currentUser.email}
            />
            <InfoCard
              icon={IconShieldLock}
              label="Account Role"
              value={currentUser.role}
            />
            <InfoCard
              icon={IconCalendar}
              label="Member Since"
              value={formatDate(currentUser.createdAt)}
            />
          </div>

          <div className="mt-12 p-6 bg-red-50 border border-red-100">
            <div className="flex items-start gap-3">
              <IconAlertTriangle className="text-red-600 shrink-0" size={24} />
              <div>
                <h4 className="text-red-700 font-bold uppercase tracking-wide text-sm mb-2">
                  Danger Zone
                </h4>
                <p className="text-xs text-red-600/80 mb-4 leading-relaxed">
                  Permanently remove your account and all of its contents from
                  the platform. This action is not reversible.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isLoading}
                  className="text-[10px] font-black uppercase tracking-widest text-red-600 border-b-2 border-red-600 hover:text-black hover:border-black transition-colors pb-1 disabled:opacity-50"
                >
                  {isLoading ? "PROCESSING..." : "DELETE ACCOUNT"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === EDIT PROFILE MODAL === */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-white/80 backdrop-blur-md"
              onClick={() => setIsEditing(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* Modal Panel */}
            <motion.div
              className="relative bg-white w-full max-w-md border-2 border-black shadow-2xl overflow-hidden"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Modal Header */}
              <div className="bg-black text-white p-4 flex justify-between items-center">
                <h3 className="text-sm font-black uppercase tracking-widest">
                  Edit Profile
                </h3>
                <button
                  onClick={() => setIsEditing(false)}
                  className="hover:text-gray-300 transition-colors"
                >
                  <IconX size={20} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleUpdateProfile} className="p-6 space-y-6">
                {/* Photo Upload */}
                <div className="flex flex-col items-center gap-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-24 h-24 rounded-full border-2 border-dashed border-gray-300 hover:border-black cursor-pointer overflow-hidden flex items-center justify-center group transition-colors"
                  >
                    {previewUrl ? (
                      <Image
                        src={previewUrl}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <IconCamera className="text-gray-300 group-hover:text-black" />
                    )}
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <IconPencil className="text-white" size={20} />
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">
                    Click to change photo
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>

                {/* Name Input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-black uppercase tracking-widest">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-black p-3 text-sm font-bold outline-none transition-colors"
                    placeholder="Enter your name"
                  />
                </div>

                {/* Actions */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-black text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <IconLoader className="animate-spin" size={16} />
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfilePage;
