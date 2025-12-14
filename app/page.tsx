"use client";
import { useEffect, useState } from "react";
import { useAppDispatch } from "@/lib/hooks";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { IconEye, IconEyeOff, IconLock, IconUser } from "@tabler/icons-react";
import PageContainer from "@/app/(secured)/components/container/PageContainer";
import Logo from "@/app/(secured)/components/layout/shared/logo/Logo";
import { authenticateUserAction } from "@/actions/authActions";
import { setUser } from "@/lib/authSlice/authSlice";
import { User } from "@/model";
import { showNotification } from "@/utils/toast";
import ComponentsLoader from "@/app/components/ComponentsLoader";

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
    "w-full py-4 px-6 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-gray-900 transition-all rounded-sm",
};

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
      {/* Main Container: Full Screen, No Scroll */}
      <div className="relative h-screen w-screen flex flex-col items-center justify-center bg-white text-black overflow-hidden">
        {/* Decorative Top Border */}
        <div className="absolute top-0 left-0 w-full h-2 bg-black z-20"></div>

        {/* Content Wrapper - No Card Borders */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[420px] px-6 relative z-10"
        >
          {/* Header Section */}
          <div className="flex flex-col items-center mb-12">
            <div className="mb-8 scale-125">
              <Logo />
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center space-y-2"
            >
              <h1 className="text-4xl font-black uppercase tracking-tighter text-black leading-none">
                System Access
              </h1>
              <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                Authorized Personnel Only
              </p>
            </motion.div>
          </div>

          <form onSubmit={onFormSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className={styles.label}>
                Account ID / Email
              </label>
              <div className={styles.inputContainer}>
                <IconUser size={18} className={styles.inputIcon} />
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

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label
                  htmlFor="password"
                  className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em]"
                >
                  Security Code
                </label>
              </div>
              <div className={styles.inputContainer}>
                <IconLock size={18} className={styles.inputIcon} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  pattern="^\S{6,}$"
                  title="6 characters minimum no spaces"
                  className={`${styles.input} pr-12`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors p-1"
                >
                  {showPassword ? (
                    <IconEye size={20} />
                  ) : (
                    <IconEyeOff size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-8 space-y-6">
              <button type="submit" className={styles.primaryBtn}>
                Authenticate
              </button>

              <div className="flex justify-center">
                <Link
                  href="/reset-password"
                  className="text-[10px] font-bold text-gray-400 hover:text-black transition-colors uppercase tracking-widest border-b border-transparent hover:border-black pb-0.5"
                >
                  Reset Password
                </Link>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 text-center opacity-60">
              <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">
                Protected by NeverBe Security Systems
              </p>
            </div>
          </form>
        </motion.div>

        {isLoading && (
          <ComponentsLoader title="INITIALIZING" position="fixed" />
        )}
      </div>
    </PageContainer>
  );
};

export default Login;
