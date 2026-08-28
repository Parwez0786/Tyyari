import { useQuery } from "@tanstack/react-query";
import { authApi } from "../services/api";

export function useAuthPublicConfig() {
  return useQuery({
    queryKey: ["auth-public-config"],
    queryFn: authApi.publicConfig,
    staleTime: 5 * 60_000,
  });
}
