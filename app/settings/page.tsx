import { Sidebar } from "@/components/dashboard/sidebar";
import { DashboardNavbar } from "@/components/dashboard/dashboard-navbar";
import { SettingsPage } from "@/components/settings/settings-page";
import { getIncomeProfiles } from "@/server/income-profiles";
import { prisma } from "@/lib/prisma";
import { resolveSpaceId } from "@/server/space";
import { getAuthContext } from "@/server/auth-context";

export default async function SettingsRoute({ searchParams }: { searchParams: Promise<{ space?: string; tab?: string }> }) {
  const params = await searchParams;
  const spaceId = await resolveSpaceId(params.space);
  const authContext = await getAuthContext();
  const membership = authContext ? await prisma.spaceMember.findFirst({ where: { financialSpaceId: spaceId, userId: authContext.user.id, status: "active" } }) : null;
  const permissions = (membership?.permissions ?? {}) as Record<string, boolean>;
  const canAdministrate = membership?.role === "owner" || membership?.role === "admin" || permissions["accounts:write"] === true;
  const canPlan = membership?.role === "owner" || membership?.role === "admin" || permissions["planning:write"] === true;
  const [members, accounts, profile, profiles] = await Promise.all([
    prisma.spaceMember.findMany({ where: { financialSpaceId: spaceId }, include: { user: { select: { name: true } } } }).then((rows) => rows.map(({ id, userId, role, status, permissions, user }) => ({ id, userId, name: user.name, role, status, permissions: (permissions ?? {}) as Record<string, boolean> }))),
    prisma.financialAccount.findMany({ where: { financialSpaceId: spaceId }, select: { id: true, name: true } }),
    prisma.user.findUnique({ where: { id: authContext!.user.id }, select: { name: true, email: true, image: true } }).then((row) => row ? [row] : []),
    getIncomeProfiles(spaceId),
  ]);
  const initialTab = params.tab === "members" || params.tab === "invite" || params.tab === "income" || params.tab === "danger" ? params.tab : "profile";
  return <div className="min-h-screen bg-background"><Sidebar /><DashboardNavbar /><SettingsPage initialTab={initialTab} data={{ spaceId, members, accounts, profiles, profile: profile[0] ?? { name: "Usuário Finansee", email: "", image: null }, capabilities: { canManageMembers: canAdministrate, canManageIncomeProfiles: canPlan, canDeleteAccount: Boolean(authContext?.user.id) } }} /></div>;
}
