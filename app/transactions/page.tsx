import { Sidebar } from "@/components/dashboard/sidebar";
import { DashboardNavbar } from "@/components/dashboard/dashboard-navbar";
import { TransactionsPage } from "@/components/transactions/transactions-page";
import { getTransactionOptions, getTransactions } from "@/server/transactions";
import { resolveSpaceId } from "@/server/space";

export default async function TransactionsRoute({ searchParams }: { searchParams: Promise<{ space?: string }> }) {
  const spaceId = await resolveSpaceId((await searchParams).space);
  const [items, options] = await Promise.all([getTransactions({ spaceId }), getTransactionOptions(spaceId)]);
  return <div className="min-h-screen bg-background"><Sidebar /><DashboardNavbar /><TransactionsPage initialItems={items} options={options} spaceId={spaceId} /></div>;
}
