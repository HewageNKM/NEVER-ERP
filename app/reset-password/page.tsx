"use client";
import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  IconMail,
  IconArrowLeft,
  IconRobot,
  IconCheck,
} from "@tabler/icons-react";
import PageContainer from "@/app/(secured)/erp/components/container/PageContainer";
import Logo from "@/app/(secured)/erp/components/layout/shared/logo/Logo";
import { showNotification } from "@/utils/toast";
import ComponentsLoader from "@/app/components/ComponentsLoader";
import { sendPasswordResetLinkAction } from "@/actions/authActions";

// --- NIKE AESTHETIC STYLES ---
const styles = {
  label:
    "block text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-2",
  inputContainer: "relative group",
  inputIcon:
    "absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors",
  input:
    "w-full bg-[#f5f5f5] text-black text-sm font-bold px-4 py-4 pl-12 rounded-sm border-2 border-transparent focus:bg-white focus:border-black transition-all duration-200 outline-none placeholder:text-gray-400 uppercase",
  primaryBtn:
    "w-full py-4 px-6 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-gray-900 transition-all rounded-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
  secondaryBtn:
    "w-full py-4 px-6 border-2 border-black text-black text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all rounded-sm text-center block",
};

const ResetPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const onFormSubmit = async (evt: any) => {
    evt.preventDefault();

    if (!isVerified) {
      showNotification("Please complete human verification.", "warning");
      return;
    }

    setIsLoading(true);
    try {
      const email: string = evt.target.email.value;
      await sendPasswordResetLinkAction(email);
      setEmailSent(true);
      showNotification("RESET LINK DISPATCHED", "success");
    } catch (e: any) {
      console.log(e);
      showNotification(e.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer
      title="Reset Password"
      description="Reset your password for NEVER Panel"
    >
      <div className="relative h-screen w-screen flex flex-col items-center justify-center bg-white text-black overflow-hidden">
        {/* Decorative Top Border */}
        <div className="absolute top-0 left-0 w-full h-2 bg-black z-20"></div>

        {/* Content Wrapper */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[440px] px-6 relative z-10"
        >
          {/* Header Section */}
          <div className="flex flex-col items-center mb-10">
            <div className="mb-8 scale-125">
              <Logo />
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center space-y-2"
            >
              <h1 className="text-3xl font-black uppercase tracking-tighter text-black leading-none">
                Reset Access
              </h1>
              <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                Enter email to receive recovery link
              </p>
            </motion.div>
          </div>

          {/* Form Section */}
          {!emailSent ? (
            <form onSubmit={onFormSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className={styles.label}>
                  Registered Email
                </label>
                <div className={styles.inputContainer}>
                  <IconMail size={18} className={styles.inputIcon} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className={styles.input}
                    placeholder="ENTER EMAIL ADDRESS..."
                  />
                </div>
              </div>

              {/* Custom "I'm not a robot" Verification */}
              <div
                onClick={() => setIsVerified(!isVerified)}
                className={`flex items-center justify-between p-4 border-2 cursor-pointer transition-all duration-200 group ${
                  isVerified
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 border-2 flex items-center justify-center transition-all ${
                      isVerified
                        ? "border-white bg-white"
                        : "border-gray-300 bg-gray-50"
                    }`}
                  >
                    {isVerified && (
                      <IconCheck size={14} className="text-black" stroke={4} />
                    )}
                  </div>
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${
                      isVerified ? "text-white" : "text-gray-500"
                    }`}
                  >
                    Human Verification
                  </span>
                </div>
                <IconRobot
                  size={20}
                  className={`transition-colors ${
                    isVerified
                      ? "text-white"
                      : "text-gray-300 group-hover:text-gray-400"
                  }`}
                />
              </div>

              {/* Actions */}
              <div className="pt-4 space-y-3">
                <button
                  type="submit"
                  disabled={!isVerified}
                  className={styles.primaryBtn}
                >
                  Send Reset Link
                </button>

                <Link
                  href="/"
                  className="flex items-center justify-center gap-2 text-[10px] font-bold text-gray-400 hover:text-black transition-colors uppercase tracking-widest py-2"
                >
                  <IconArrowLeft size={14} /> Back to Login
                </Link>
              </div>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6"
            >
              <div className="p-8 bg-[#f5f5f5] border-2 border-transparent">
                <div className="w-12 h-12 bg-black text-white flex items-center justify-center mx-auto mb-4 rounded-sm">
                  <IconMail size={24} />
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight mb-2">
                  Check Your Email
                </h3>
                <p className="text-xs font-medium text-gray-500 uppercase leading-relaxed">
                  We have sent password recovery instructions to your inbox.
                </p>
              </div>

              <Link href="/" className={styles.secondaryBtn}>
                Return to Login
              </Link>
            </motion.div>
          )}
        </motion.div>

        {/* Footer */}
        <div className="text-center opacity-40">
          <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">
            System Security Active
          </p>
        </div>

        {isLoading && (
          <ComponentsLoader title="PROCESSING REQUEST" position="fixed" />
        )}
      </div>
    </PageContainer>
  );
};

export default ResetPassword;
