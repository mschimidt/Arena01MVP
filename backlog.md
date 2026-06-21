# Arena01 MVP — Backlog de Desenvolvimento

Backlog organizado em épicos, histórias de usuário e tasks para o desenvolvimento sequencial do sistema Arena01.

**Legenda de prioridade:** 🔴 Crítica | 🟡 Alta | 🟢 Média | ⚪ Baixa

---

## Épico 1: Infraestrutura e Setup

> Objetivo: ambiente de desenvolvimento funcional, repositório configurado, projeto Next.js rodando localmente e com deploy automático na Vercel.

### US-1.1: Setup do Repositório e Projeto
**Como** desenvolvedor, **quero** ter o projeto Next.js inicializado com a estrutura de pastas definida, **para** começar a desenvolver com padrões consistentes.

🔴 **Tasks:**
- [ ] T-1.1.1: Inicializar projeto Next.js 15 (App Router) com TypeScript no repositório `Arena01MVP`
- [ ] T-1.1.2: Configurar estrutura de pastas (`/app`, `/components`, `/lib`, `/styles`, `/public`)
- [ ] T-1.1.3: Configurar `.env.local.example` com variáveis do Supabase
- [ ] T-1.1.4: Criar `.gitignore` adequado (node_modules, .env, .next)
- [ ] T-1.1.5: Criar `README.md` com instruções de setup

**Critérios de aceite:**
- `npm run dev` roda sem erros
- Estrutura de pastas organizada e documentada

---

### US-1.2: Configuração do Supabase
**Como** desenvolvedor, **quero** ter o banco de dados configurado com todas as tabelas e políticas de segurança, **para** que o backend esteja pronto para uso.

🔴 **Tasks:**
- [ ] T-1.2.1: Criar projeto no Supabase (free tier)
- [ ] T-1.2.2: Criar migration SQL com todas as tabelas (perfis, quadras, aulas, planos, matriculas, checkins, pagamentos, notificacoes)
- [ ] T-1.2.3: Configurar RLS (Row Level Security) por role para cada tabela
- [ ] T-1.2.4: Criar triggers e functions (ex: auto-criar perfil após signup, atualizar saldo)
- [ ] T-1.2.5: Configurar Supabase Phone Auth (OTP)
- [ ] T-1.2.6: Inserir dados seed (quadra inicial, planos de exemplo, admin padrão)
- [ ] T-1.2.7: Criar client Supabase no Next.js (`/lib/supabase.ts`)

**Critérios de aceite:**
- Todas as tabelas criadas com relacionamentos corretos
- RLS ativo e testado por role
- Conexão Next.js ↔ Supabase funcionando

---

### US-1.3: Deploy na Vercel
**Como** desenvolvedor, **quero** ter deploy automático configurado, **para** que cada push no GitHub publique automaticamente.

🟡 **Tasks:**
- [ ] T-1.3.1: Conectar repositório GitHub à Vercel
- [ ] T-1.3.2: Configurar variáveis de ambiente na Vercel (SUPABASE_URL, SUPABASE_ANON_KEY)
- [ ] T-1.3.3: Verificar deploy inicial funcionando
- [ ] T-1.3.4: Configurar domínio customizado (se houver)

**Critérios de aceite:**
- Push na `main` faz deploy automático
- Site acessível pela URL da Vercel

---

### US-1.4: Design System Base
**Como** desenvolvedor, **quero** ter o design system implementado em CSS, **para** que todos os componentes sigam a identidade visual da Arena01.

🔴 **Tasks:**
- [ ] T-1.4.1: Criar `/styles/globals.css` com tokens CSS (cores, tipografia, espaçamentos)
- [ ] T-1.4.2: Importar Google Fonts (Outfit + Inter)
- [ ] T-1.4.3: Criar componentes base: Button, Input, Card, Badge, Modal
- [ ] T-1.4.4: Criar layout base mobile (bottom-tab navigation)
- [ ] T-1.4.5: Criar layout base desktop (sidebar + content area)
- [ ] T-1.4.6: Implementar glassmorphism e micro-animações base

**Critérios de aceite:**
- Paleta de cores consistente com a logo
- Componentes reutilizáveis e responsivos
- Dark mode como padrão único

---

## Épico 2: Autenticação e Perfis

> Objetivo: alunos, professores e admins conseguem fazer login com telefone e são redirecionados para suas áreas.

### US-2.1: Login por Telefone (OTP)
**Como** usuário, **quero** fazer login usando meu número de celular e receber um código por SMS, **para** acessar o sistema sem precisar de senha.

🔴 **Tasks:**
- [ ] T-2.1.1: Criar página `/login` com campo de telefone (máscara brasileira)
- [ ] T-2.1.2: Implementar envio de OTP via Supabase Auth (`signInWithOtp`)
- [ ] T-2.1.3: Criar tela de verificação do código OTP
- [ ] T-2.1.4: Tratar erros (número inválido, código expirado, limite de tentativas)
- [ ] T-2.1.5: Estilizar com design system (mobile-first)

**Critérios de aceite:**
- Usuário insere telefone → recebe SMS → digita código → entra no sistema
- Erros tratados com mensagens claras

---

### US-2.2: Criação Automática de Perfil
**Como** admin, **quero** que o perfil do usuário seja criado automaticamente no primeiro login, **para** que eu só precise pré-cadastrar o número de telefone.

🟡 **Tasks:**
- [ ] T-2.2.1: Criar trigger no Supabase: `on auth.users INSERT → criar perfil`
- [ ] T-2.2.2: Definir role padrão como 'aluno' (admin altera depois)
- [ ] T-2.2.3: Criar tela de "completar perfil" (nome, avatar) no primeiro acesso

**Critérios de aceite:**
- Novo login cria perfil automaticamente
- Usuário é solicitado a completar dados no primeiro acesso

---

### US-2.3: Middleware de Controle de Acesso
**Como** sistema, **quero** validar o role do usuário em cada rota protegida, **para** que ninguém acesse áreas sem permissão.

🔴 **Tasks:**
- [ ] T-2.3.1: Criar middleware Next.js (`middleware.ts`) com verificação de sessão
- [ ] T-2.3.2: Implementar redirecionamento por role após login
- [ ] T-2.3.3: Proteger rotas `/aluno/*`, `/professor/*`, `/admin/*`
- [ ] T-2.3.4: Criar página de "Acesso negado" (403)
- [ ] T-2.3.5: Implementar logout

**Critérios de aceite:**
- Aluno não acessa `/admin/*`
- Professor não acessa `/admin/*`
- Logout limpa sessão e redireciona para `/login`

---

## Épico 3: Painel Administrativo — Cadastros

> Objetivo: o admin consegue cadastrar e gerenciar todas as entidades do sistema.

### US-3.1: CRUD de Quadras
**Como** admin, **quero** cadastrar, editar e desativar quadras, **para** organizar os espaços da arena.

🟡 **Tasks:**
- [ ] T-3.1.1: Criar página `/admin/quadras` com listagem em cards
- [ ] T-3.1.2: Implementar modal de criação (nome, capacidade)
- [ ] T-3.1.3: Implementar edição inline ou via modal
- [ ] T-3.1.4: Implementar toggle ativa/inativa
- [ ] T-3.1.5: Validações (nome obrigatório, capacidade > 0)

**Critérios de aceite:**
- Admin cria, edita e desativa quadras
- Quadra inativa não aparece na grade de aulas

---

### US-3.2: CRUD de Professores
**Como** admin, **quero** cadastrar professores com seus dados e especialidade, **para** vinculá-los às aulas.

🟡 **Tasks:**
- [ ] T-3.2.1: Criar página `/admin/professores` com listagem
- [ ] T-3.2.2: Implementar formulário de cadastro (nome, telefone, status)
- [ ] T-3.2.3: Implementar edição e desativação
- [ ] T-3.2.4: Exibir quantidade de aulas vinculadas por professor
- [ ] T-3.2.5: Impedir exclusão de professor com aulas ativas

**Critérios de aceite:**
- Admin gerencia professores
- Sistema impede exclusão com dependências

---

### US-3.3: CRUD de Alunos
**Como** admin, **quero** cadastrar alunos e visualizar seus dados, planos e histórico, **para** ter controle da base de alunos.

🟡 **Tasks:**
- [ ] T-3.3.1: Criar página `/admin/alunos` com listagem e busca
- [ ] T-3.3.2: Implementar cadastro (nome, telefone, email)
- [ ] T-3.3.3: Implementar edição e toggle ativo/inativo
- [ ] T-3.3.4: Exibir plano ativo, saldo e validade por aluno
- [ ] T-3.3.5: Implementar filtros (status, plano, saldo)

**Critérios de aceite:**
- Admin visualiza e gerencia todos os alunos
- Informações de plano visíveis na listagem

---

### US-3.4: CRUD de Planos e Valores
**Como** admin, **quero** criar e gerenciar planos com valores e limites de aulas, **para** oferecer opções aos alunos.

🟡 **Tasks:**
- [ ] T-3.4.1: Criar página `/admin/planos` com listagem em cards
- [ ] T-3.4.2: Implementar criação (nome, valor, limite_aulas, validade_dias)
- [ ] T-3.4.3: Implementar edição e desativação
- [ ] T-3.4.4: Exibir quantidade de alunos matriculados em cada plano
- [ ] T-3.4.5: Impedir exclusão de plano com matrículas ativas

**Critérios de aceite:**
- Admin cria e gerencia planos
- Plano inativo não aparece para novos alunos

---

### US-3.5: CRUD de Grade de Aulas
**Como** admin, **quero** montar a grade semanal de aulas, **para** definir a rotina da arena.

🟡 **Tasks:**
- [ ] T-3.5.1: Criar página `/admin/aulas` com visualização em grade semanal
- [ ] T-3.5.2: Implementar criação (título, nível, professor, quadra, dias da semana, horários, capacidade)
- [ ] T-3.5.3: Implementar edição e desativação
- [ ] T-3.5.4: Validar conflitos de horário (mesma quadra, mesmo horário)
- [ ] T-3.5.5: Exibir preview da grade semanal completa

**Critérios de aceite:**
- Admin monta grade sem conflitos
- Visualização semanal clara

---

### US-3.6: Dashboard Administrativo
**Como** admin, **quero** ver um resumo geral do sistema ao abrir o painel, **para** ter visão rápida da operação.

🟢 **Tasks:**
- [ ] T-3.6.1: Criar página `/admin/dashboard`
- [ ] T-3.6.2: Card: total de alunos ativos
- [ ] T-3.6.3: Card: aulas do dia (com contagem de confirmados)
- [ ] T-3.6.4: Card: receita do mês (pagamentos confirmados)
- [ ] T-3.6.5: Card: check-ins do dia
- [ ] T-3.6.6: Lista: próximas aulas com vagas restantes

**Critérios de aceite:**
- Dados atualizados em tempo real
- Carregamento rápido (< 2s)

---

## Épico 4: Check-in e Presença

> Objetivo: alunos fazem check-in/cancelamento, professores gerenciam presença.

### US-4.1: Grade de Aulas do Aluno
**Como** aluno, **quero** ver a grade semanal de aulas disponíveis, **para** escolher em qual vou participar.

🔴 **Tasks:**
- [ ] T-4.1.1: Criar página `/aluno/aulas` com grade semanal (cards por dia)
- [ ] T-4.1.2: Exibir: título, horário, professor, vagas disponíveis, status do aluno
- [ ] T-4.1.3: Indicação visual: "confirmado" (verde), "lista de espera" (amarelo), "vaga disponível" (lime), "lotada" (vermelho)
- [ ] T-4.1.4: Filtro por dia da semana
- [ ] T-4.1.5: Pull-to-refresh ou atualização automática

**Critérios de aceite:**
- Aluno vê todas as aulas dos próximos 7 dias
- Status visualmente claro

---

### US-4.2: Check-in em Aula
**Como** aluno, **quero** confirmar minha presença em uma aula, **para** garantir minha vaga.

🔴 **Tasks:**
- [ ] T-4.2.1: Criar página `/aluno/aulas/[id]` com detalhes da aula
- [ ] T-4.2.2: Botão "Confirmar Presença" → verificar saldo/vaga
- [ ] T-4.2.3: Fluxo "tem vaga + tem saldo" → confirmar e decrementar saldo
- [ ] T-4.2.4: Fluxo "tem vaga + sem saldo" → oferecer aula avulsa (gerar pagamento pendente)
- [ ] T-4.2.5: Fluxo "sem vaga" → adicionar à lista de espera (exibir posição)
- [ ] T-4.2.6: Feedback visual de sucesso com micro-animação
- [ ] T-4.2.7: Impedir check-in duplicado no mesmo dia/aula

**Critérios de aceite:**
- Saldo é decrementado corretamente
- Lista de espera funciona com posição visível
- Não é possível confirmar duas vezes

---

### US-4.3: Cancelamento de Presença
**Como** aluno, **quero** desmarcar minha presença, **para** liberar minha vaga caso não possa comparecer.

🔴 **Tasks:**
- [ ] T-4.3.1: Botão "Desmarcar" na aula confirmada
- [ ] T-4.3.2: Devolver saldo (se tipo='plano')
- [ ] T-4.3.3: Cancelar pagamento (se tipo='avulso')
- [ ] T-4.3.4: Promover automaticamente o 1º da lista de espera
- [ ] T-4.3.5: Confirmar ação com modal de confirmação

**Critérios de aceite:**
- Saldo devolvido corretamente
- Próximo da fila é promovido automaticamente

---

### US-4.4: Lista de Espera
**Como** aluno, **quero** entrar na lista de espera quando a aula estiver lotada, **para** ser avisado se uma vaga abrir.

🟡 **Tasks:**
- [ ] T-4.4.1: Registrar check-in com status='lista_espera' e posição na fila
- [ ] T-4.4.2: Exibir posição atual na fila para o aluno
- [ ] T-4.4.3: Quando vaga libera → promover 1º da fila para 'confirmado'
- [ ] T-4.4.4: Decrementar saldo automaticamente ao ser promovido
- [ ] T-4.4.5: Permitir sair da lista de espera

**Critérios de aceite:**
- Fila FIFO (primeiro que entrou, primeiro promovido)
- Posição atualizada em tempo real

---

### US-4.5: Gerenciamento de Presença pelo Professor
**Como** professor, **quero** ver a lista de alunos confirmados nas minhas aulas e poder gerenciar presenças, **para** ter controle da turma.

🔴 **Tasks:**
- [ ] T-4.5.1: Criar página `/professor/aulas` com aulas do dia/semana
- [ ] T-4.5.2: Criar página `/professor/aulas/[id]` com lista de alunos (confirmados + espera)
- [ ] T-4.5.3: Permitir confirmar/remover alunos manualmente
- [ ] T-4.5.4: Exibir contador de vagas (ocupadas/total)
- [ ] T-4.5.5: Diferenciação visual: plano vs avulso

**Critérios de aceite:**
- Professor vê e gerencia apenas suas aulas
- Ações do professor refletem no saldo do aluno

---

### US-4.6: Histórico de Presenças
**Como** aluno/professor, **quero** ver o histórico de check-ins, **para** acompanhar a frequência.

🟢 **Tasks:**
- [ ] T-4.6.1: Criar página `/aluno/meus-checkins` com lista cronológica
- [ ] T-4.6.2: Criar página `/professor/historico` com filtro por aula e período
- [ ] T-4.6.3: Exibir: data, aula, status, tipo (plano/avulso)
- [ ] T-4.6.4: Criar visão admin em `/admin/checkins` com filtros avançados

**Critérios de aceite:**
- Histórico completo e filtrável
- Dados consistentes com ações realizadas

---

## Épico 5: Planos, Matrículas e Pagamentos

> Objetivo: controle financeiro completo de planos e pagamentos.

### US-5.1: Vincular Aluno a Plano (Matrícula)
**Como** admin, **quero** matricular um aluno em um plano, **para** que ele tenha saldo de aulas.

🔴 **Tasks:**
- [ ] T-5.1.1: Botão "Matricular em Plano" na tela de detalhes do aluno
- [ ] T-5.1.2: Selecionar plano → calcular data_fim (data_inicio + validade_dias)
- [ ] T-5.1.3: Definir saldo_aulas = plano.limite_aulas
- [ ] T-5.1.4: Gerar pagamento pendente automaticamente
- [ ] T-5.1.5: Exibir matrícula ativa na listagem do aluno

**Critérios de aceite:**
- Matrícula criada com saldo correto
- Pagamento pendente gerado

---

### US-5.2: Visão do Plano pelo Aluno
**Como** aluno, **quero** ver meu plano ativo, saldo de aulas e histórico de pagamentos, **para** acompanhar minha situação.

🟡 **Tasks:**
- [ ] T-5.2.1: Criar página `/aluno/meu-plano`
- [ ] T-5.2.2: Exibir: nome do plano, saldo restante, validade
- [ ] T-5.2.3: Barra visual de progresso do saldo (usado/total)
- [ ] T-5.2.4: Lista de pagamentos com status (pendente/pago)
- [ ] T-5.2.5: Alerta visual quando saldo < 2 aulas ou validade < 7 dias

**Critérios de aceite:**
- Aluno vê informações precisas do seu plano
- Alertas visuais funcionando

---

### US-5.3: Registro de Pagamentos
**Como** admin, **quero** registrar pagamentos de alunos, **para** controlar a receita da arena.

🔴 **Tasks:**
- [ ] T-5.3.1: Criar página `/admin/pagamentos` com listagem e filtros
- [ ] T-5.3.2: Permitir registrar pagamento manual (valor, tipo, aluno, observação)
- [ ] T-5.3.3: Marcar pagamento como "pago" (com data)
- [ ] T-5.3.4: Marcar pagamento como "cancelado"
- [ ] T-5.3.5: Filtros: por aluno, status, tipo, período
- [ ] T-5.3.6: Exibir total recebido no período

**Critérios de aceite:**
- Admin controla todos os pagamentos
- Filtros funcionais e totalizadores corretos

---

## Épico 6: Notificações Push (PWA)

> Objetivo: alunos e professores recebem notificações relevantes em seus celulares.

### US-6.1: Setup do PWA
**Como** usuário, **quero** instalar o sistema como app no meu celular, **para** acessar rapidamente e receber notificações.

🟡 **Tasks:**
- [ ] T-6.1.1: Configurar next-pwa (manifest.json, service worker)
- [ ] T-6.1.2: Criar ícones do app (baseados na logo Arena01) em múltiplas resoluções
- [ ] T-6.1.3: Configurar cores do tema no manifest (bg: #080C14, theme: #B8E000)
- [ ] T-6.1.4: Implementar banner de instalação customizado
- [ ] T-6.1.5: Testar instalação em Android e iOS

**Critérios de aceite:**
- App instalável na tela inicial
- Ícone e cores consistentes com a marca

---

### US-6.2: Notificações Push
**Como** aluno, **quero** receber notificações no celular sobre minhas aulas, **para** não perder nenhuma informação.

🟡 **Tasks:**
- [ ] T-6.2.1: Implementar Web Push API (gerar VAPID keys, subscription)
- [ ] T-6.2.2: Tela de permissão de notificações (opt-in)
- [ ] T-6.2.3: Salvar subscription no Supabase (tabela push_subscriptions)
- [ ] T-6.2.4: Criar Edge Function na Vercel para envio de push
- [ ] T-6.2.5: Configurar Supabase Database Webhooks para disparar notificações
- [ ] T-6.2.6: Implementar notificação: check-in confirmado
- [ ] T-6.2.7: Implementar notificação: vaga liberada (lista de espera)
- [ ] T-6.2.8: Implementar notificação: aula cancelada
- [ ] T-6.2.9: Implementar notificação: lembrete pré-aula (aluno)
- [ ] T-6.2.10: Implementar notificação: lista pré-aula (professor)

**Critérios de aceite:**
- Notificações chegam em Android e iOS
- Cada tipo de notificação com conteúdo correto
- Usuário pode desativar notificações

---

## Épico 7: PWA e Polimento

> Objetivo: experiência de uso refinada, performance otimizada, pronto para produção.

### US-7.1: Experiência Offline
**Como** aluno, **quero** ver a grade de aulas mesmo sem internet, **para** consultar rapidamente.

🟢 **Tasks:**
- [ ] T-7.1.1: Configurar cache de assets estáticos (CSS, JS, fontes)
- [ ] T-7.1.2: Cache da grade de aulas (última versão carregada)
- [ ] T-7.1.3: Tela de "sem conexão" com dados cacheados
- [ ] T-7.1.4: Sincronização ao reconectar

**Critérios de aceite:**
- Grade visível offline
- Ações pendentes sincronizadas ao reconectar

---

### US-7.2: Polimento Visual e UX
**Como** usuário, **quero** uma interface bonita e fluida, **para** ter uma experiência agradável.

🟢 **Tasks:**
- [ ] T-7.2.1: Revisar todas as micro-animações (check-in, cancelar, navegar)
- [ ] T-7.2.2: Skeleton loaders em todas as listagens
- [ ] T-7.2.3: Empty states (sem aulas, sem alunos, etc.)
- [ ] T-7.2.4: Feedback de erro (toast notifications)
- [ ] T-7.2.5: Transições de página suaves
- [ ] T-7.2.6: Responsividade em todos os breakpoints

**Critérios de aceite:**
- Lighthouse Performance > 90
- Sem quebras visuais em mobile e desktop

---

### US-7.3: Testes e Validação Final
**Como** desenvolvedor, **quero** validar todos os fluxos antes do lançamento, **para** garantir qualidade.

🟢 **Tasks:**
- [ ] T-7.3.1: Teste E2E: fluxo completo de check-in (aluno)
- [ ] T-7.3.2: Teste E2E: gerenciamento de presença (professor)
- [ ] T-7.3.3: Teste E2E: CRUD completo (admin)
- [ ] T-7.3.4: Teste: login OTP com número real
- [ ] T-7.3.5: Teste: push notification em Android e iOS
- [ ] T-7.3.6: Teste: instalação PWA em ambas as plataformas
- [ ] T-7.3.7: Lighthouse audit final (todas as páginas)
- [ ] T-7.3.8: Revisão de segurança (RLS, middleware)

**Critérios de aceite:**
- Todos os fluxos funcionando sem erros
- Lighthouse > 90 em todas as categorias
- Sem vulnerabilidades de acesso
