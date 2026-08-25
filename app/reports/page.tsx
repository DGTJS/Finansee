import { Sidebar } from "@/components/dashboard/sidebar";
import { DashboardNavbar } from "@/components/dashboard/dashboard-navbar";
import { ReportsPage } from "@/components/reports/reports-page";
import { getReportData } from "@/server/reports";
import { resolveSpaceId } from "@/server/space";
import { getBusinessMonthRange } from "@/lib/business-date";

export default async function ReportsRoute({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; space?: string }> }) {
  const params = await searchParams;
  const defaultRange = getBusinessMonthRange();
  const data = await getReportData(params.from || defaultRange.from, params.to || defaultRange.to, await resolveSpaceId(params.space));
  return <div className="min-h-screen bg-background"><Sidebar /><DashboardNavbar /><ReportsPage data={data} /></div>;
}
