import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../services/api";

export function useAuthPublicConfig() {
  return useQuery({
    queryKey: ["auth-public-config"],
    queryFn: adminApi.publicConfig,
    staleTime: 5 * 60_000,
  });
}
