import { getAvailableSpaces } from "@/server/space";
import { SidebarClient } from "@/components/dashboard/sidebar-client";

export async function Sidebar() {
  const spaces = await getAvailableSpaces();
  return <SidebarClient spaces={spaces} />;
}
