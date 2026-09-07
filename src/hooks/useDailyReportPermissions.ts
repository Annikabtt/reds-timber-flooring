import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { loadDailyReportPermissions, type DailyReportAction } from "@/lib/dailyReportPermissions";

export function useDailyReportPermissions() {
  const { user, loading, accountLoading, accountStatus } = useAuth();
  const enabled = Boolean(user) && !loading && !accountLoading && accountStatus === "Active";
  const query = useQuery({
    queryKey: ["daily-report-permissions", user?.id],
    enabled,
    queryFn: () => loadDailyReportPermissions(user!.id),
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: false,
  });
  const ready = enabled && query.isSuccess && !query.isFetching;
  return {
    userId: user?.id,
    isChecking: loading || accountLoading || (enabled && (query.isPending || query.isFetching)),
    error: enabled ? query.error : null,
    canRead: ready && query.data?.canRead === true,
    can: (action: DailyReportAction) => ready && query.data?.actions[action] === true,
    retry: query.refetch,
  };
}
