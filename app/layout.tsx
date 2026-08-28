import type { Metadata } from "next";
import { DM_Sans, Manrope } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { MotionProvider } from "@/components/ui/motion-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { FirstStepsTutorial } from "@/components/onboarding/first-steps-tutorial";
import { getAuthContext } from "@/server/auth-context";
import { prisma } from "@/lib/prisma";
import "./globals.css";

const body = DM_Sans({ variable: "--font-body", subsets: ["latin"] });
const display = Manrope({ variable: "--font-display", subsets: ["latin"] });
export const metadata: Metadata = { title: "Finansee | Clareza para o seu dinheiro", description: "Controle financeiro pessoal com uma visão simples e inteligente.", applicationName: "Finansee" };
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const authContext = await getAuthContext();
  const preferences = authContext ? await prisma.user.findUnique({ where: { id: authContext.user.id }, select: { themeId: true, themeMode: true } }) : null;
  return <html lang="pt-BR" className={`${body.variable} ${display.variable}`}><body><ThemeProvider initialTheme={preferences?.themeId} initialMode={preferences?.themeMode}><MotionProvider>{children}{authContext?.user.id && <FirstStepsTutorial userId={authContext.user.id} />}<Toaster /></MotionProvider></ThemeProvider></body></html>;
}
