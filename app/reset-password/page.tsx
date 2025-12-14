"use client";
import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import PageContainer from "@/app/(secured)/components/container/PageContainer";
import Logo from "@/app/(secured)/components/layout/shared/logo/Logo";
import { showNotification } from "@/utils/toast";
import ComponentsLoader from "@/app/components/ComponentsLoader";
import { sendPasswordResetLinkAction } from "@/actions/authActions";

const ResetPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const [emailSent, setEmailSent] = useState(false);

  const onFormSubmit = async (evt: any) => {
    evt.preventDefault();
    setIsLoading(true);
    try {
      const email: string = evt.target.email.value;
      await sendPasswordResetLinkAction(email);
      setEmailSent(true);
      showNotification("Reset link sent to your email", "success");
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
      <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-white text-black selection:bg-black selection:text-white overflow-hidden">
        {/* Card Container */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[440px] px-8 md:px-12 py-12 bg-white"
        >
          {/* Header Section */}
          <div className="flex flex-col items-center mb-12 space-y-6">
            <div className="scale-125">
              <Logo />
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center"
            >
              <h1 className="text-3xl font-black uppercase tracking-tighter italic text-black mb-1">
                Reset Password
              </h1>
              <p className="text-xs font-bold tracking-widest text-gray-500 uppercase mt-4">
                Enter your email to receive instructions
              </p>
            </motion.div>
          </div>

          {/* Form Section */}
          {!emailSent ? (
            <form onSubmit={onFormSubmit} className="mt-10 space-y-6">
              <div className="space-y-1">
                <label
                  htmlFor="email"
                  className="block text-xs font-bold tracking-widest text-black uppercase mb-2"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full px-4 py-4 border border-gray-300 bg-white text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors duration-200 rounded-none text-sm font-medium"
                  placeholder="NAME@EXAMPLE.COM"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-4 px-6 bg-black text-white font-black rounded-full hover:bg-gray-800 hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 uppercase tracking-widest text-sm shadow-none"
                >
                  Send Reset Link
                </button>
              </div>

              <div className="mt-8 text-center">
                <Link
                  href="/"
                  className="text-xs font-bold text-gray-500 hover:text-black underline underline-offset-4 decoration-1 transition-all uppercase tracking-wide"
                >
                  Back to Login
                </Link>
              </div>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-6"
            >
              <div className="p-6 bg-gray-50 border border-gray-200">
                <p className="text-sm font-medium text-black">
                  Check your email for the reset link.
                </p>
              </div>
              <Link
                href="/"
                className="inline-block w-full py-4 px-6 bg-black text-white font-black rounded-full hover:bg-gray-800 transition-all duration-300 uppercase tracking-widest text-sm"
              >
                Return to Login
              </Link>
            </motion.div>
          )}
        </motion.div>

        {/* Footer Brand Mark */}
        <div className="absolute bottom-8 left-0 w-full text-center pointer-events-none opacity-20">
          <span className="text-6xl md:text-[100px] leading-none font-black italic tracking-tighter text-gray-100 select-none">
            NEVER
          </span>
        </div>

        {isLoading && (
          <ComponentsLoader title="SENDING LINK" position="fixed" />
        )}
      </div>
    </PageContainer>
  );
};

export default ResetPassword;
