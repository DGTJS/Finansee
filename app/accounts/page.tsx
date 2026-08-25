import { Sidebar } from "@/components/dashboard/sidebar";
import { DashboardNavbar } from "@/components/dashboard/dashboard-navbar";
import { AccountsPage } from "@/components/accounts/accounts-page";
import { getAccounts } from "@/server/accounts";
import { resolveSpaceId } from "@/server/space";

export default async function AccountsRoute({ searchParams }: { searchParams: Promise<{ space?: string }> }) {
  const spaceId = await resolveSpaceId((await searchParams).space);
  const accounts = await getAccounts(spaceId);
  return <div className="min-h-screen bg-background"><Sidebar /><DashboardNavbar /><AccountsPage initialAccounts={accounts} spaceId={spaceId} /></div>;
}
