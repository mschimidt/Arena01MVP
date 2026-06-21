-- Criar tabela de subscrições PWA (Push)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    aluno_id UUID REFERENCES public.perfis(id) ON DELETE CASCADE NOT NULL,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Alunos podem inserir suas próprias subscriptions"
    ON public.push_subscriptions FOR INSERT
    WITH CHECK (auth.uid() = aluno_id);

CREATE POLICY "Alunos podem ver suas subscriptions"
    ON public.push_subscriptions FOR SELECT
    USING (auth.uid() = aluno_id);

CREATE POLICY "Alunos podem deletar suas subscriptions"
    ON public.push_subscriptions FOR DELETE
    USING (auth.uid() = aluno_id);

-- Admins podem ver todas
CREATE POLICY "Admins podem ver todas subscriptions"
    ON public.push_subscriptions FOR SELECT
    USING (public.is_admin());
