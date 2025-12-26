"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  IconLayoutDashboard,
  IconDeviceDesktopAnalytics,
  IconLogout,
} from "@tabler/icons-react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { clearUser, setUser } from "@/lib/authSlice/authSlice";
import Logo from "@/app/(secured)/erp/components/layout/shared/logo/Logo";

const PortalSelect = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currentUser } = useAppSelector((state) => state.authSlice);

  useEffect(() => {
    // Safety check: if no user, redirect to login
    const userStr = window.localStorage.getItem("nvrUser");
    if (!userStr) {
      router.replace("/");
    } else if (!currentUser) {
      // Rehydrate Redux if missing (e.g. on refresh)
      try {
        const user = JSON.parse(userStr);
        dispatch(setUser(user));
      } catch (e) {
        console.error("Failed to parse user from storage", e);
      }
    }
  }, [currentUser, dispatch, router]);

  const handleLogout = () => {
    window.localStorage.removeItem("nvrUser");
    dispatch(clearUser());
    router.replace("/");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="min-h-screen w-full bg-white text-black flex flex-col relative overflow-hidden">
      {/* Top Decoration */}
      <div className="w-full h-2 bg-black fixed top-0 z-50" />

      {/* Header */}
      <header className="w-full p-6 flex justify-between items-center relative z-10">
        <div className="scale-75 origin-left">
          <Logo />
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-red-600 transition-colors"
        >
          <IconLogout size={16} />
          Logout
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-4xl"
        >
          <div className="text-center mb-16 space-y-4">
            <motion.h1
              variants={itemVariants}
              className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-black leading-none"
            >
              Select Portal
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]"
            >
              Welcome back, {currentUser?.username || "Commander"}
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* ERP Card */}
            <motion.div variants={itemVariants}>
              <button
                onClick={() => router.push("/erp/dashboard")}
                className="w-full group relative h-[300px] border-2 border-black bg-white hover:bg-black transition-all duration-300 overflow-hidden flex flex-col items-center justify-center p-8 text-center"
              >
                <div className="mb-8 p-6 rounded-full bg-gray-50 group-hover:bg-white/10 transition-colors">
                  <IconLayoutDashboard
                    size={48}
                    stroke={1.5}
                    className="text-black group-hover:text-white transition-colors"
                  />
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tighter text-black group-hover:text-white mb-2 transition-colors">
                  ERP Admin
                </h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-gray-400">
                  Management & Operations
                </p>

                {/* Visual Flair */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[100px] font-black text-white/5 leading-none">
                    01
                  </span>
                </div>
              </button>
            </motion.div>

            {/* POS Card */}
            <motion.div variants={itemVariants}>
              <button
                onClick={() => router.push("/pos")}
                className="w-full group relative h-[300px] border-2 border-gray-200 hover:border-black bg-white hover:bg-black transition-all duration-300 overflow-hidden flex flex-col items-center justify-center p-8 text-center"
              >
                <div className="mb-8 p-6 rounded-full bg-gray-50 group-hover:bg-white/10 transition-colors">
                  <IconDeviceDesktopAnalytics
                    size={48}
                    stroke={1.5}
                    className="text-black group-hover:text-white transition-colors"
                  />
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tighter text-black group-hover:text-white mb-2 transition-colors">
                  POS System
                </h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-gray-400">
                  Sales & Checkout
                </p>

                {/* Visual Flair */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[100px] font-black text-white/5 leading-none">
                    02
                  </span>
                </div>
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="w-full p-6 text-center">
        <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">
          NeverBe Internal Systems v2.0
        </p>
      </div>
    </div>
  );
};

export default PortalSelect;
