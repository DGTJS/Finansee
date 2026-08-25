import { Sidebar } from "@/components/dashboard/sidebar";
import { DashboardNavbar } from "@/components/dashboard/dashboard-navbar";
import { PlanningPage } from "@/components/planning/planning-page";
import { getPlanningData } from "@/server/planning";
import { resolveSpaceId } from "@/server/space";

export default async function PlanningRoute({ searchParams }: { searchParams: Promise<{ space?: string }> }) {
  const spaceId = await resolveSpaceId((await searchParams).space);
  const data = await getPlanningData(spaceId);
  return <div className="min-h-screen bg-background"><Sidebar /><DashboardNavbar /><PlanningPage data={data} spaceId={spaceId} /></div>;
}
