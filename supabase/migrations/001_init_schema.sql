-- ================================================
-- Arena01 MVP — Schema Inicial
-- Supabase PostgreSQL
-- ================================================

-- Habilitar extensão uuid
create extension if not exists "uuid-ossp";

-- ================================================
-- 1. PERFIS (estende auth.users)
-- ================================================
create table public.perfis (
  id uuid references auth.users on delete cascade primary key,
  nome text not null default '',
  telefone text not null default '',
  avatar_url text,
  role text not null default 'aluno' check (role in ('admin', 'professor', 'aluno')),
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  created_at timestamptz not null default now()
);

-- Trigger: criar perfil automaticamente ao signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.perfis (id, nome, telefone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', ''),
    coalesce(new.phone, new.raw_user_meta_data ->> 'telefone', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ================================================
-- 2. QUADRAS
-- ================================================
create table public.quadras (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  capacidade_maxima int not null default 12,
  status text not null default 'ativa' check (status in ('ativa', 'inativa')),
  created_at timestamptz not null default now()
);

-- ================================================
-- 3. AULAS (grade fixa semanal)
-- ================================================
create table public.aulas (
  id uuid primary key default uuid_generate_v4(),
  titulo text not null,
  nivel text not null default 'misto' check (nivel in ('iniciante', 'intermediario', 'avancado', 'misto')),
  professor_id uuid not null references public.perfis(id),
  quadra_id uuid not null references public.quadras(id),
  dias_semana text[] not null default '{}',
  hora_inicio time not null,
  hora_fim time not null,
  capacidade int not null default 10,
  status text not null default 'ativa' check (status in ('ativa', 'inativa')),
  created_at timestamptz not null default now()
);

-- ================================================
-- 4. PLANOS
-- ================================================
create table public.planos (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  valor decimal(10,2) not null default 0,
  limite_aulas int not null default 8,
  validade_dias int not null default 30,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  created_at timestamptz not null default now()
);

-- ================================================
-- 5. MATRÍCULAS (aluno ↔ plano)
-- ================================================
create table public.matriculas (
  id uuid primary key default uuid_generate_v4(),
  aluno_id uuid not null references public.perfis(id),
  plano_id uuid not null references public.planos(id),
  saldo_aulas int not null default 0,
  data_inicio date not null default current_date,
  data_fim date not null,
  status text not null default 'ativa' check (status in ('ativa', 'vencida', 'cancelada')),
  created_at timestamptz not null default now()
);

-- ================================================
-- 6. CHECKINS (presença por ocorrência)
-- ================================================
create table public.checkins (
  id uuid primary key default uuid_generate_v4(),
  aluno_id uuid not null references public.perfis(id),
  aula_id uuid not null references public.aulas(id),
  data date not null default current_date,
  status text not null default 'confirmado' check (status in ('confirmado', 'cancelado', 'lista_espera')),
  tipo text not null default 'plano' check (tipo in ('plano', 'avulso')),
  posicao_fila int,
  created_at timestamptz not null default now(),
  -- Impedir check-in duplicado no mesmo dia/aula
  unique(aluno_id, aula_id, data)
);

-- ================================================
-- 7. PAGAMENTOS
-- ================================================
create table public.pagamentos (
  id uuid primary key default uuid_generate_v4(),
  aluno_id uuid not null references public.perfis(id),
  valor decimal(10,2) not null default 0,
  tipo text not null check (tipo in ('plano', 'avulso')),
  referencia_id uuid,
  status text not null default 'pendente' check (status in ('pendente', 'pago', 'cancelado')),
  data_pagamento timestamptz,
  observacao text,
  created_at timestamptz not null default now()
);

-- ================================================
-- 8. NOTIFICAÇÕES
-- ================================================
create table public.notificacoes (
  id uuid primary key default uuid_generate_v4(),
  destinatario_id uuid not null references public.perfis(id),
  titulo text not null,
  mensagem text not null,
  tipo text not null check (tipo in ('lembrete', 'vaga_liberada', 'cancelamento', 'lista_pre_aula')),
  lida boolean not null default false,
  created_at timestamptz not null default now()
);

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

-- Perfis
alter table public.perfis enable row level security;

create policy "Perfis: leitura pública para autenticados"
  on public.perfis for select
  to authenticated
  using (true);

create policy "Perfis: usuário edita próprio perfil"
  on public.perfis for update
  to authenticated
  using (auth.uid() = id);

create policy "Perfis: admin gerencia todos"
  on public.perfis for all
  to authenticated
  using (
    exists (select 1 from public.perfis where id = auth.uid() and role = 'admin')
  );

-- Quadras
alter table public.quadras enable row level security;

create policy "Quadras: leitura para autenticados"
  on public.quadras for select
  to authenticated
  using (true);

create policy "Quadras: admin gerencia"
  on public.quadras for all
  to authenticated
  using (
    exists (select 1 from public.perfis where id = auth.uid() and role = 'admin')
  );

-- Aulas
alter table public.aulas enable row level security;

create policy "Aulas: leitura para autenticados"
  on public.aulas for select
  to authenticated
  using (true);

create policy "Aulas: admin gerencia"
  on public.aulas for all
  to authenticated
  using (
    exists (select 1 from public.perfis where id = auth.uid() and role = 'admin')
  );

-- Planos
alter table public.planos enable row level security;

create policy "Planos: leitura para autenticados"
  on public.planos for select
  to authenticated
  using (true);

create policy "Planos: admin gerencia"
  on public.planos for all
  to authenticated
  using (
    exists (select 1 from public.perfis where id = auth.uid() and role = 'admin')
  );

-- Matrículas
alter table public.matriculas enable row level security;

create policy "Matriculas: aluno vê as próprias"
  on public.matriculas for select
  to authenticated
  using (aluno_id = auth.uid());

create policy "Matriculas: admin gerencia"
  on public.matriculas for all
  to authenticated
  using (
    exists (select 1 from public.perfis where id = auth.uid() and role = 'admin')
  );

-- Checkins
alter table public.checkins enable row level security;

create policy "Checkins: aluno vê e cria os próprios"
  on public.checkins for select
  to authenticated
  using (aluno_id = auth.uid());

create policy "Checkins: aluno cria próprio checkin"
  on public.checkins for insert
  to authenticated
  with check (aluno_id = auth.uid());

create policy "Checkins: aluno atualiza próprio checkin"
  on public.checkins for update
  to authenticated
  using (aluno_id = auth.uid());

create policy "Checkins: professor vê checkins das suas aulas"
  on public.checkins for select
  to authenticated
  using (
    exists (
      select 1 from public.aulas a
      where a.id = aula_id and a.professor_id = auth.uid()
    )
  );

create policy "Checkins: professor gerencia checkins das suas aulas"
  on public.checkins for update
  to authenticated
  using (
    exists (
      select 1 from public.aulas a
      where a.id = aula_id and a.professor_id = auth.uid()
    )
  );

create policy "Checkins: admin gerencia"
  on public.checkins for all
  to authenticated
  using (
    exists (select 1 from public.perfis where id = auth.uid() and role = 'admin')
  );

-- Pagamentos
alter table public.pagamentos enable row level security;

create policy "Pagamentos: aluno vê os próprios"
  on public.pagamentos for select
  to authenticated
  using (aluno_id = auth.uid());

create policy "Pagamentos: admin gerencia"
  on public.pagamentos for all
  to authenticated
  using (
    exists (select 1 from public.perfis where id = auth.uid() and role = 'admin')
  );

-- Notificações
alter table public.notificacoes enable row level security;

create policy "Notificacoes: usuário vê as próprias"
  on public.notificacoes for select
  to authenticated
  using (destinatario_id = auth.uid());

create policy "Notificacoes: usuário marca como lida"
  on public.notificacoes for update
  to authenticated
  using (destinatario_id = auth.uid());

create policy "Notificacoes: admin gerencia"
  on public.notificacoes for all
  to authenticated
  using (
    exists (select 1 from public.perfis where id = auth.uid() and role = 'admin')
  );

-- ================================================
-- DADOS SEED (iniciais)
-- ================================================

-- Quadra inicial
insert into public.quadras (nome, capacidade_maxima)
values ('Quadra 1', 12);

-- Planos de exemplo
insert into public.planos (nome, valor, limite_aulas, validade_dias) values
  ('Mensal 8 aulas', 200.00, 8, 30),
  ('Mensal 12 aulas', 280.00, 12, 30),
  ('Mensal Livre', 400.00, 30, 30);
