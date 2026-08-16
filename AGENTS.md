<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Padrão obrigatório de UI/UX do Finansee

- Sempre revisar o tamanho da fonte, a hierarquia tipográfica e a legibilidade em mobile, tablet e desktop.
- Sempre garantir contraste suficiente entre cores semelhantes; estados, textos e fundos precisam permanecer visíveis.
- Sempre garantir que cards, grids e listas sejam responsivos, alinhados e tenham espaçamento consistente.
- Ícones devem usar tamanho visual padronizado, área de toque adequada e alinhamento consistente com o texto.
- Os componentes documentados em `README.md` e em `prompts/components/` são a opção principal. Antes de criar um componente novo, verificar se é possível compor ou adaptar um existente.
- Preferir tokens semânticos do design system, variantes dos componentes e composição consistente em vez de estilos isolados.

## Skills oficiais de interface e arquitetura

Aplicar estas referências nas tarefas correspondentes:

- `frontend-skill`: direção visual, composição, hierarquia, densidade e motion de interfaces.
- `frontend-design`: frontend distintivo, tipografia, cores, responsividade e acabamento visual.
- `next-best-practices`: convenções do Next.js 16, RSC, dados, rotas e build.
- `shadcn`: seleção, composição, acessibilidade e uso dos componentes UI.
- `artifact-template-system-design`: documentação de arquitetura e decisões de sistema quando um artefato System Design for solicitado.
