"use client";
import { useEffect, useState } from "react";
import { useAppDispatch } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { IoEye, IoEyeOff } from "react-icons/io5";
import PageContainer from "@/app/(secured)/components/container/PageContainer";
import Logo from "@/app/(secured)/components/layout/shared/logo/Logo";
import { authenticateUserAction } from "@/actions/authActions";
import { setUser } from "@/lib/authSlice/authSlice";
import { User } from "@/model";
import { showNotification } from "@/utils/toast";
import ComponentsLoader from "@/app/components/ComponentsLoader";

const Login = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  
  const [showPassword, setShowPassword] = useState(false);

  const onFormSubmit = async (evt: any) => {
    evt.preventDefault();
    setIsLoading(true);
    try {
      const email: string = evt.target.email.value;
      const password: string = evt.target.password.value;
      const user: User = await authenticateUserAction(email, password);
      dispatch(setUser(user));
      window.localStorage.setItem("nvrUser", JSON.stringify(user));
      router.replace("/dashboard");
    } catch (e: any) {
      console.log(e);
      showNotification(e.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    try {
      const user = window.localStorage.getItem("nvrUser");
      if (user) {
        router.replace("/dashboard");
      }
    } catch (e: any) {
      console.log(e);
      showNotification(e.message, "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <PageContainer title="Login" description="Login to NEVER Panel">
      <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-white text-black selection:bg-black selection:text-white overflow-hidden">
        {/* Login Card Container */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} // Custom easing for "snap" feel
          className="w-full max-w-[440px] px-8 md:px-12 py-12 bg-white"
        >
          {/* Header Section */}
          <div className="flex flex-col items-center mb-3">
            <div>
              <Logo />
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center"
            >
              <p className="text-xs font-bold tracking-widest text-gray-500 uppercase">
                Authorized Access Only
              </p>
            </motion.div>
          </div>

          <form onSubmit={onFormSubmit} className="mt-8 space-y-6">
            {/* Email Field */}
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

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex justify-between items-center mb-2">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold tracking-widest text-black uppercase"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  pattern="^\S{6,}$"
                  title="6 characters minimum no spaces"
                  className="w-full px-4 py-4 border border-gray-300 bg-white text-black placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors duration-200 pr-12 rounded-none text-sm font-medium"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black transition-colors"
                >
                  {showPassword ? <IoEye size={22} /> : <IoEyeOff size={22} />}
                </button>
              </div>
            </div>

            {/* Reset Password Link */}
            <div className="flex justify-end pt-1">
              <Link
                href="/reset-password"
                className="text-xs font-bold text-gray-500 hover:text-black underline underline-offset-4 decoration-1 transition-all uppercase tracking-wide"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button - The "Nike Pill" */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full py-4 px-6 bg-black text-white font-black rounded-full hover:bg-gray-800 hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 uppercase tracking-widest text-sm shadow-none"
              >
                Sign In
              </button>
            </div>

            <div className="mt-8 text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                By logging in, you agree to the internal policies.
              </p>
            </div>
          </form>
        </motion.div>

        {isLoading && (
          <ComponentsLoader title="AUTHENTICATING" position="fixed" />
        )}
      </div>
    </PageContainer>
  );
};

export default Login;
