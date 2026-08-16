import type { Metadata } from "next";
import { DM_Sans, Manrope } from "next/font/google";
import "./globals.css";

const body = DM_Sans({ variable: "--font-body", subsets: ["latin"] });
const display = Manrope({ variable: "--font-display", subsets: ["latin"] });
export const metadata: Metadata = { title: "Finansee | Clareza para o seu dinheiro", description: "Controle financeiro pessoal com uma visão simples e inteligente.", applicationName: "Finansee" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="pt-BR" className={`${body.variable} ${display.variable}`}><body>{children}</body></html>; }
