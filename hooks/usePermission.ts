import { useSelector } from "react-redux";
import { User } from "@/model/User";

export const usePermission = (permissionKey: string): boolean => {
  const user = useSelector(
    (state: any) => state.authSlice.currentUser
  ) as User | null;

  if (!user) return false;

  // Super Admin has all permissions
  if (user.role === "ADMIN") {
    return true;
  }

  // Check if user has the specific permission
  if (user.permissions && user.permissions.includes(permissionKey)) {
    return true;
  }

  return false;
};
