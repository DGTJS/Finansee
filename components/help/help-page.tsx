import { ArrowRight, CalendarDays, CircleHelp, WalletCards } from "@/components/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const topics = [
  { title: "Organize suas contas", description: "Cadastre contas correntes, cartões e carteiras para acompanhar cada saldo separadamente.", icon: WalletCards },
  { title: "Acompanhe vencimentos", description: "Configure fechamento e vencimento de cada cartão para encontrar primeiro o compromisso mais próximo.", icon: CalendarDays },
  { title: "Use o espaço conjunto", description: "Alterne entre sua conta, a conta convidada e a visão conjunta sem misturar os dados financeiros.", icon: CircleHelp },
];

const questions = [
  ["Como adicionar uma transação?", "Abra Nova transação, escolha a data de competência, informe os dados do lançamento e confirme o valor na etapa final."],
  ["Como funciona o saldo previsto?", "O saldo previsto considera receitas futuras e despesas pendentes do espaço ativo. Lançamentos cancelados ficam fora do cálculo."],
  ["Como configurar um cartão?", "Em Contas, crie ou edite um cartão e informe os dias de fechamento e vencimento. Esses dados também aparecem no painel."],
  ["Como proteger meus dados?", "Cada leitura e alteração é limitada ao espaço financeiro ativo e às permissões do membro autenticado."],
];

export function HelpPage() {
  return <main className="min-h-screen bg-background lg:pl-64"><div className="mx-auto max-w-[1200px] px-5 pb-12 pt-20 sm:px-8 lg:px-10 lg:pt-24"><header className="border-b border-border pb-7"><p className="text-sm text-muted-foreground">Suporte Finansee</p><h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Central de ajuda</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Encontre orientações para organizar seu espaço financeiro com clareza.</p></header><section className="mt-6 grid gap-4 md:grid-cols-3">{topics.map(({ title, description, icon: Icon }) => <Card key={title}><CardHeader><Icon className="size-5 text-primary" /><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">{description}</p></CardContent></Card>)}</section><section className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_.8fr]"><Card><CardHeader><CardTitle>Perguntas frequentes</CardTitle><CardDescription>Respostas rápidas sobre as principais funções.</CardDescription></CardHeader><CardContent className="grid gap-2">{questions.map(([question, answer]) => <details key={question} className="group rounded-xl border border-border px-4 py-3"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium [&::-webkit-details-marker]:hidden">{question}<ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" /></summary><p className="mt-3 max-w-prose text-sm leading-6 text-muted-foreground">{answer}</p></details>)}</CardContent></Card><Card className="bg-sidebar text-sidebar-foreground"><CardHeader><CardTitle className="text-sidebar-foreground">Precisa de suporte?</CardTitle><CardDescription className="text-sidebar-foreground/70">Consulte as configurações do seu espaço para revisar membros, permissões e dados pessoais.</CardDescription></CardHeader><CardContent><p className="text-sm leading-6 text-sidebar-foreground/80">O Finansee mantém suas contas, transações e metas isoladas por espaço financeiro.</p></CardContent></Card></section></div></main>;
}
