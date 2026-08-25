"use client";

import { FinancialCalendar, type FinancialCalendarEvent } from "@/components/calendar/financial-calendar";

export function CalendarPage({ events, initialDate }: { events: FinancialCalendarEvent[]; initialDate: string }) { return <main className="min-h-screen bg-background lg:pl-64"><div className="mx-auto max-w-[1200px] px-5 pb-12 pt-20 sm:px-8 lg:px-10 lg:pt-24"><header className="border-b border-border pb-7"><p className="text-sm text-muted-foreground">Preferências do espaço</p><h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Calendário</h1><p className="mt-2 text-sm text-muted-foreground">Veja vencimentos e competências em uma visão mensal.</p></header><FinancialCalendar events={events} initialDate={initialDate} /></div></main>; }
