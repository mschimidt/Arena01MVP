# Arena01 MVP — Sistema de Gestão de Futevôlei

Sistema web (PWA) para gerenciamento da Arena01 Futevôlei. Controle de aulas, check-in de alunos, planos e notificações.

## Stack

- **Framework:** Next.js 15 (App Router)
- **Linguagem:** TypeScript
- **Banco de Dados:** Supabase (PostgreSQL)
- **Autenticação:** Supabase Phone Auth (OTP)
- **Hospedagem:** Vercel
- **Estilo:** Vanilla CSS (Design System próprio)
- **Ícones:** Lucide React

## Setup Local

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/Arena01MVP.git
cd Arena01MVP

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.local.example .env.local
# Edite .env.local com suas credenciais do Supabase

# 4. Rode o servidor de desenvolvimento
npm run dev
```

## Estrutura de Pastas

```
Arena01MVP/
├── app/                    # Páginas e layouts (App Router)
│   ├── globals.css         # Design System (tokens + componentes)
│   ├── layout.tsx          # Layout raiz
│   ├── page.tsx            # Página inicial
│   ├── login/              # Autenticação
│   ├── aluno/              # Área do aluno
│   ├── professor/          # Área do professor
│   └── admin/              # Painel administrativo
├── components/             # Componentes reutilizáveis
├── lib/                    # Utilitários e configurações
│   ├── supabase.ts         # Cliente Supabase
│   └── types.ts            # Tipos TypeScript
├── public/                 # Assets estáticos
└── supabase/
    └── migrations/         # SQL migrations
```

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Servidor de produção |
| `npm run lint` | Verificar código com ESLint |
