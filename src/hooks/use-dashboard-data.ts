import { useQuery } from "@tanstack/react-query";
import { analyticsApi, candidatesApi, reportsApi, unwrapData } from "@/lib/api";
import type { AnalyticsDashboardPayload, ChartPoint, DashboardStats, PieSlice, TrendPoint } from "@/types/api";

export function useDashboardData() {
  const dashQuery = useQuery({
    queryKey: ["analytics", "dashboard-full"],
    queryFn: async () => unwrapData<AnalyticsDashboardPayload>(await analyticsApi.getDashboardData()),
    retry: 2,
    staleTime: 60_000,
  });

  const recentCandidatesQuery = useQuery({
    queryKey: ["candidates", "recent", { limit: 6 }],
    queryFn: async () => {
      const page = unwrapData(await candidatesApi.findAll({ limit: 6, page: 1 }));
      return page.data;
    },
    retry: 2,
    staleTime: 30_000,
  });

  const recentReportsQuery = useQuery({
    queryKey: ["reports", "recent", { limit: 5 }],
    queryFn: async () => {
      const page = unwrapData(await reportsApi.findAll({ limit: 5, page: 1 }));
      return page.data;
    },
    retry: 2,
    staleTime: 30_000,
  });

  const dash = dashQuery.data;

  const summary: DashboardStats | undefined = dash?.summary;
  const topicChart: ChartPoint[] = dash?.trends?.topicPerformance?.map((t) => ({ label: t.topic, value: t.score })) ?? [];
  const passFail: PieSlice[] | undefined = dash?.trends?.passFailRatio;
  const trends: TrendPoint[] | undefined = dash?.trends?.applicationsOverTime;
  const leaderboard = dash?.trends?.leaderboard ?? [];
  const funnel = dash?.trends?.funnel ?? [];

  return {
    dash,
    dashLoading: dashQuery.isLoading,
    dashError: dashQuery.isError,
    refetchDash: dashQuery.refetch,
    failureReason: dashQuery.failureReason,
    summary,
    topicChart,
    passFail,
    trends,
    leaderboard,
    funnel,
    recentCandidates: recentCandidatesQuery.data ?? [],
    candidatesLoading: recentCandidatesQuery.isLoading,
    recentReports: recentReportsQuery.data ?? [],
    reportsLoading: recentReportsQuery.isLoading,
  };
}
