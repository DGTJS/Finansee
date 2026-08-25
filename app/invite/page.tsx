import { InvitationAcceptance } from "@/components/help/invitation-acceptance";

export default async function InviteRoute({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token ?? "";
  return <InvitationAcceptance token={token} />;
}
