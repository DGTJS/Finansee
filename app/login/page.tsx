import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getAuthContext } from "@/server/auth-context";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reset?: string; mode?: string }> }) {
  if (await getAuthContext()) redirect("/");
  const params = await searchParams;
  return <LoginForm resetSuccess={params.reset === "success"} initialMode={params.mode === "sign-up" ? "sign-up" : "sign-in"} />;
}
