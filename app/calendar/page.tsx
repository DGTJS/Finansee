import { Sidebar } from "@/components/dashboard/sidebar";
import { DashboardNavbar } from "@/components/dashboard/dashboard-navbar";
import { CalendarPage } from "@/components/calendar/calendar-page";
import { getTransactions } from "@/server/transactions";
import { resolveSpaceId } from "@/server/space";
import { getBusinessDate } from "@/lib/business-date";

export default async function CalendarRoute({ searchParams }: { searchParams: Promise<{ space?: string }> }) {
  const spaceId = await resolveSpaceId((await searchParams).space);
  const transactions = await getTransactions({ spaceId });
  const initialDate = getBusinessDate();
  const events = transactions.map((item) => ({ id: item.id, title: item.description, date: item.dueDate ?? item.competenceDate, competenceDate: item.competenceDate, dueDate: item.dueDate, amountCents: item.amountCents, category: item.categoryName ?? "Sem categoria", account: item.accountName ?? "Sem conta", accountType: item.accountType, accountImage: item.accountOwnerImage, status: item.status, kind: item.kind }));
  return <div className="min-h-screen bg-background"><Sidebar /><DashboardNavbar /><CalendarPage events={events} initialDate={initialDate} /></div>;
}
