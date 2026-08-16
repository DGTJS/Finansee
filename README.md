# Finansee

Sistema financeiro pessoal focado em clareza, velocidade e uso confortável em qualquer tela. O primeiro corte entrega o dashboard mensal com dados reais do PostgreSQL, seed local e uma base visual premium limpa com acentos dark fintech.

## Stack

- Next.js 16 App Router + React 19 + TypeScript strict
- Tailwind CSS v4 + tokens CSS + componentes base inspirados em shadcn/ui
- Drizzle ORM + PostgreSQL + Better Auth + Zod
- Recharts para visualização e Lucide para ícones
- Docker Compose somente no desenvolvimento local

## Rodar localmente

```bash
npm install
Copy-Item .env.example .env.local
docker compose up -d
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Abra `http://localhost:3000`. O dashboard tenta ler o banco local; antes do seed, ele exibe uma orientação de configuração para manter o primeiro carregamento amigável.

Em produção, defina `DATABASE_URL`, `BETTER_AUTH_SECRET` e `BETTER_AUTH_URL` no provedor de hospedagem. O segredo padrão existe apenas para o ambiente local e deve ser substituído antes de publicar.

## Scripts

`npm run dev` inicia o app. `npm run lint` valida o código. `npm run typecheck` executa o TypeScript. `npm run build` gera a build de produção. `npm run db:generate`, `db:migrate`, `db:seed` e `db:studio` cuidam do ciclo Drizzle local.

## Componentes implementados

- Layout responsivo com sidebar desktop e menu móvel
- Cards de métricas para saldo realizado, saldo previsto, receitas e despesas
- Gráfico de fluxo de caixa com receita versus despesa
- Indicador de saúde financeira e progresso de meta
- Lista de transações em BRL, próximos vencimentos e alerta de orçamento
- Estados globais de carregamento, erro e página não encontrada
- Tokens semânticos de cor preparados para tema claro/escuro
- Handler Better Auth em `app/api/auth/[...all]/route.ts`
- Schema Drizzle com isolamento por `financialSpaceId` e valores monetários em centavos

## Padrão UI/UX obrigatório

Estas regras devem ser verificadas em toda nova tela ou alteração visual:

- Cuidar sempre do tamanho da fonte, da hierarquia tipográfica e da leitura em todas as larguras.
- Garantir contraste entre cores semelhantes para que texto, estados, bordas e fundos permaneçam visíveis.
- Garantir que cards sejam responsivos, alinhados e tenham espaçamentos consistentes.
- Manter ícones com tamanhos visuais padronizados, alinhamento consistente e área de toque adequada.
- Usar primeiro os componentes listados neste README e em `prompts/components/`, adaptando-os ao Finansee antes de criar uma solução nova.

## Skills de referência

- `frontend-skill`: composição visual, hierarquia, densidade e motion.
- `frontend-design`: acabamento visual, tipografia, cores e responsividade.
- `next-best-practices`: arquitetura e práticas do Next.js 16.
- `shadcn`: componentes, composição, tokens semânticos e acessibilidade.
- `artifact-template-system-design`: documentação de arquitetura quando for necessário criar um artefato System Design.

## Dados e segurança

Consultas financeiras devem sempre ser filtradas pelo espaço financeiro do usuário. Valores são armazenados em `integer` como centavos; transferências e parcelamentos serão adicionados como operações transacionais na próxima etapa. A camada de produção recebe apenas `DATABASE_URL` de um PostgreSQL gerenciado e não depende do Docker Compose.

## Próximos módulos

1. Fluxo visual de cadastro/login e proteção efetiva das rotas por sessão.
2. CRUD de transações, contas e transferências atômicas.
3. Recorrências, parcelamentos, orçamentos, metas e alertas editáveis.
4. Relatórios, auditoria, testes de domínio e revisão visual em mobile/tablet/desktop.

## Documentação

O contexto, regras de domínio, arquitetura e MVP estão em [`docs/`](./docs/). Os prompts de execução ficam em [`prompts/`](./prompts/) e os papéis de engenharia em [`agents/`](./agents/). Os componentes de referência visual foram mantidos em [`prompts/components/`](./prompts/components/) e adaptados ao produto, sem copiar suas demos literalmente.

Desenvolvido por [Diego Martins](https://github.com/DGTJS).
