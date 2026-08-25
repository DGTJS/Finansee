import { DashboardNavbar } from "@/components/dashboard/dashboard-navbar";
import { Sidebar } from "@/components/dashboard/sidebar";
import { HelpPage } from "@/components/help/help-page";
import { getAuthContext } from "@/server/auth-context";
import { redirect } from "next/navigation";

export default async function HelpRoute() {
  if (!(await getAuthContext())) redirect("/login");
  return <div className="min-h-screen bg-background"><Sidebar /><DashboardNavbar /><HelpPage /></div>;
}
