import { Sidebar } from "@/components/dashboard/sidebar";
import { DashboardNavbar } from "@/components/dashboard/dashboard-navbar";
import { OpenFinancePage } from "@/components/open-finance/open-finance-page";
import { listOpenFinance } from "@/server/open-finance";
import { resolveSpaceId } from "@/server/space";

export default async function OpenFinanceRoute({ searchParams }: { searchParams: Promise<{ space?: string }> }) {
  const spaceId = await resolveSpaceId((await searchParams).space);
  const data = await listOpenFinance(spaceId);
  return <div className="min-h-screen bg-background"><Sidebar /><DashboardNavbar /><OpenFinancePage spaceId={spaceId} initialData={data} /></div>;
}
