# Finansee

Sistema financeiro pessoal focado em clareza, velocidade e uso confortável em qualquer tela. O primeiro corte entrega o dashboard mensal com dados reais do PostgreSQL, seed local e uma base visual premium limpa com acentos dark fintech.

## Stack

- Next.js 16 App Router + React 19 + TypeScript strict
- Tailwind CSS v4 + tokens CSS + componentes base inspirados em shadcn/ui
- Drizzle ORM + PostgreSQL + Better Auth + Zod
- Recharts para visualização, Lucide para ícones de interface, Simple Icons e TheSVG Icons para marcas bancárias
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

Defina `DATABASE_URL`, `BETTER_AUTH_SECRET` e `BETTER_AUTH_URL` no provedor de hospedagem. O segredo padrão existe apenas para o ambiente local e deve ser substituído antes de publicar. Todas as rotas do painel exigem uma sessão Better Auth válida, inclusive durante o desenvolvimento.

## Scripts

`npm run dev` inicia o app. `npm run lint` valida o código. `npm run typecheck` executa o TypeScript. `npm run build` gera a build de produção. `npm run db:generate`, `db:migrate`, `db:seed` e `db:studio` cuidam do ciclo Drizzle local.

## Componentes implementados

- Layout responsivo com sidebar desktop e menu móvel
- Cards de métricas para saldo realizado, saldo previsto, receitas e despesas consultados por espaço
- Gráfico de fluxo de caixa com receita versus despesa calculado a partir das transações
- Indicador de saúde financeira, progresso de meta e alerta derivados do banco
- Lista de transações em BRL, próximos vencimentos e alerta de orçamento
- `components/ui/transaction-list.tsx` como lista reutilizável para transações e contas a pagar; cada linha é clicável e abre os detalhes animados do padrão documentado
- Metas editáveis com atualização segura por `financialSpaceId` e Central de ajuda em `/help`
- Configuração de perfil com nome, e-mail, upload de avatar JPG/PNG/WebP validado no servidor, senha, convite com token hash/expiração e exclusão confirmada da conta
- `components/accounts/bank-mark.tsx` como identidade reutilizável com marcas reais locais de Nubank, Bradesco e Itaú, com avatar do responsável separado da conta principal
- Contas fixas derivadas de lançamentos históricos reais, com gráfico mensal e destaque de valores pendentes
- Tela `/investments` consulta cotações brasileiras reais no backend via brapi.dev, permite cadastrar/remover posições no PostgreSQL e calcula valor atual e rendimento a partir do preço médio e da cotação disponível; sem cotação, exibe o estado indisponível sem inventar números
- Navbar com notificações reais, alternância de tema e animações de saudação por horário
- Estados globais de carregamento, erro e página não encontrada
- Tokens semânticos de cor preparados para tema claro/escuro
- Handler Better Auth em `app/api/auth/[...all]/route.ts`
- Recuperação de senha via Better Auth; em desenvolvimento o link é exibido para teste local e em produção usa `RESEND_API_KEY` e `RESEND_FROM_EMAIL`
- Schema Drizzle com isolamento por `financialSpaceId`, valores monetários em centavos, recorrências, grupos de parcelas, autoria de lançamentos e ciclo individual de cartões

## Padrão UI/UX obrigatório

Estas regras devem ser verificadas em toda nova tela ou alteração visual:

- Cuidar sempre do tamanho da fonte, da hierarquia tipográfica e da leitura em todas as larguras.
- Garantir contraste entre cores semelhantes para que texto, estados, bordas e fundos permaneçam visíveis.
- Garantir que cards sejam responsivos, alinhados e tenham espaçamentos consistentes.
- Manter ícones com tamanhos visuais padronizados, alinhamento consistente e área de toque adequada.
- Usar primeiro os componentes listados neste README e em `prompts/components/`, adaptando-os ao Finansee antes de criar uma solução nova.
- Componentes visuais recorrentes devem existir em `components/` e ser reutilizados entre as páginas; não duplicar cards, métricas, filtros ou padrões de espaçamento dentro de uma rota.

## Skills de referência

- `frontend-skill`: composição visual, hierarquia, densidade e motion.
- `frontend-design`: acabamento visual, tipografia, cores e responsividade.
- `next-best-practices`: arquitetura e práticas do Next.js 16.
- `shadcn`: componentes, composição, tokens semânticos e acessibilidade.
- `artifact-template-system-design`: documentação de arquitetura quando for necessário criar um artefato System Design.

## Dados e segurança

Consultas financeiras devem sempre ser filtradas pelo espaço financeiro ativo. Valores são armazenados em `integer` como centavos. A camada de produção recebe apenas `DATABASE_URL` de um PostgreSQL gerenciado e não depende do Docker Compose.

As regras funcionais oficiais estão em [`docs/DOMAIN_RULES.md`](./docs/DOMAIN_RULES.md). Elas definem ciclo de vida, sinais de receitas e despesas, competência, vencimento, saldo realizado e previsto, transferências, parcelamentos, recorrências, orçamentos, metas, alertas e permissões de espaços compartilhados.

A matriz de requisitos, critérios de aceite e ordem de implementação está em [`docs/REQUIREMENTS.md`](./docs/REQUIREMENTS.md).

## Estado atual do painel

O painel possui autenticação Better Auth, criação automática do espaço pessoal no cadastro e guardas de sessão/membro nas leituras e mutações. A troca de espaço ocorre por `?space=` quando o usuário possui associação válida.

O CRUD inicial contempla criação e edição de transações simples pelo fluxo em três etapas, validação por campo, origem de receitas (salário, VA, VR e benefícios), filtros, cancelamento lógico com autoria, criação/edição/arquivamento persistido de contas, fechamento e vencimento de cartões, adição de saldo, transferência atômica entre contas, parcelamentos, recorrências pausáveis, criação/edição/remoção de metas e criação/remoção de orçamentos. Contas arquivadas permanecem no histórico, mas não aparecem em novos lançamentos. Alertas de orçamento, vencimento e saldo são derivados dos dados atuais; o sino permite marcar alertas armazenados como lidos. Configurações permitem perfil com foto, senha, recuperação de senha, exclusão protegida, convites e gestão de papel/status de membros. O logout invalida a sessão pelo Better Auth e páginas protegidas redirecionam para o login. Relatórios já possuem filtro de período, resumo agregado, gastos por categoria e maiores despesas. O calendário usa competência, vencimento, status e avatar da conta vindos do banco. Todas as telas usam tokens semânticos e componentes shadcn existentes no projeto.

O componente documentado em `prompts/components/EconomicCalendar.MD` foi adaptado para `components/ui/economic-calendar.tsx` como uma lista horizontal responsiva de contas e cartões, exibindo dívidas em aberto e históricos de contas fixas derivados do banco, sem dependência de dados econômicos externos.

O padrão `TransactionList` documentado em `prompts/components/TransactionList.MD` é usado no dashboard para transações recentes e próximos vencimentos. A implementação mantém a composição animada de lista/detalhes do prompt, valores em BRL e uma única estrutura reutilizável entre telas.

Configurações usa dados reais do espaço ativo para cadastrar rendas individuais. Salário, VA, VR e outros benefícios guardam pessoa responsável, valor, dia de recebimento e conta de destino. O perfil aceita upload de imagem limitado a 500 KB e os avatares são reutilizados em navbar, cartões e detalhes de transações. O convite usa token aleatório armazenado somente como hash, expira em sete dias e valida o e-mail do membro antes de ativar o acesso. Membros ativos também carregam status e permissões por módulo no banco; proprietários e administradores mantêm os privilégios administrativos definidos em `docs/FAMILY_ACCOUNTS.md`.

Investimentos usa a API da brapi.dev no servidor, com `BRAPI_TOKEN` opcional e `FINANSEE_INVESTMENT_SYMBOLS` para configurar os ativos consultados. Cotações são dados de mercado e a interface deixa explícito que a leitura não é recomendação financeira.

## Próximos módulos

1. Evoluir permissões por módulo com telas administrativas para proprietários e administradores.
2. Adicionar edição em lote de parcelamentos e recorrências já gerados.
3. Expandir alertas configuráveis para saldo baixo, vencimento e alterações no espaço.
4. Adicionar histórico persistido de cotações e evolução das posições, mantendo a leitura informativa.
5. Ampliar testes de integração, acessibilidade e revisão visual automatizada nas larguras suportadas.

O `db:seed` cria fixtures locais reproduzíveis para validar o painel, incluindo os espaços de Diego, Raissa e a conta conjunta. Esses valores demonstrativos não representam dados de produção; em produção, os números devem vir exclusivamente das entidades cadastradas no PostgreSQL do ambiente.

## Documentação

O contexto, regras de domínio, arquitetura e MVP estão em [`docs/`](./docs/). Os prompts de execução ficam em [`prompts/`](./prompts/) e os papéis de engenharia em [`agents/`](./agents/). Os componentes de referência visual foram mantidos em [`prompts/components/`](./prompts/components/) e adaptados ao produto, sem copiar suas demos literalmente.

Desenvolvido por [Diego Martins](https://github.com/DGTJS).
# Open Finance

O módulo Open Finance conecta instituições pelo Pluggy Connect em modo estritamente somente leitura. Ele importa contas, saldos e transações para o espaço financeiro selecionado, preserva lançamentos manuais e mantém o histórico importado quando uma conexão é removida.

Configure `PLUGGY_CLIENT_ID`, `PLUGGY_CLIENT_SECRET` e, opcionalmente, `PLUGGY_BASE_URL` a partir de `.env.example`. O segredo nunca é enviado ao navegador. As credenciais e a disponibilidade da API dependem do plano contratado diretamente com a Pluggy.

Para executar localmente, instale as dependências, configure `DATABASE_URL`, rode `npm run db:generate` e `npm run dev`. Valide com `npm run lint`, `npm run typecheck`, `npm run test:domain` e `npm run build`.
