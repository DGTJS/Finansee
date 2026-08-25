import { DashboardNavbar } from "@/components/dashboard/dashboard-navbar";
import { Sidebar } from "@/components/dashboard/sidebar";
import { InvestmentsPage } from "@/components/investments/investments-page";
import { getInvestmentQuotes } from "@/server/investments";
import { resolveSpaceId } from "@/server/space";

export default async function InvestmentsRoute({ searchParams }: { searchParams: Promise<{ space?: string }> }) {
  const spaceId = await resolveSpaceId((await searchParams).space);
  const data = await getInvestmentQuotes(spaceId);
  return <div className="min-h-screen bg-background"><Sidebar /><DashboardNavbar /><InvestmentsPage spaceId={spaceId} quotes={data.quotes} positions={data.positions} message={data.message} /></div>;
}
