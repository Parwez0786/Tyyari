import { useQuery } from "@tanstack/react-query";
import { authApi } from "../services/api";
import { useAuthStore } from "../stores/authStore";

export function useEntitled() {
  const token = useAuthStore((s) => s.accessToken);
  const me = useQuery({
    queryKey: ["me"],
    queryFn: authApi.me,
    enabled: Boolean(token),
  });
  const role = me.data?.data?.role;
  return Boolean(me.data?.data?.premium) || role === "ADMIN" || role === "EDITOR";
}

export function isPremiumLocked(question, entitled) {
  if (entitled) return false;
  return Boolean(question?.premium || question?.locked);
}
