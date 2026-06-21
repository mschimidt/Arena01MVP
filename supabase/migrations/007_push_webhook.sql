-- =========================================================================
-- TRIGGER PARA NOTIFICAÇÕES PUSH VIA WEBHOOK
-- =========================================================================
-- OBSERVAÇÃO: É altamente recomendável configurar isso diretamente pelo
-- painel do Supabase (Database -> Webhooks) para evitar commitar chaves
-- de segurança (Service Role Key) no Git.
-- 
-- Se optar por usar SQL, substitua os placeholders abaixo.
-- =========================================================================

-- Habilitar a extensão pg_net se não estiver ativa
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.trg_notificacoes_send_push()
RETURNS TRIGGER AS $$
BEGIN
  -- Faz o POST assíncrono para a API de Push do Next.js
  PERFORM extensions.net_http_post(
    'https://SEU_DOMINIO_VERCEL.vercel.app/api/send-push',
    jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer SUA_SUPABASE_SERVICE_ROLE_KEY'
    ),
    jsonb_build_object(
      'record', jsonb_build_object(
        'destinatario_id', NEW.destinatario_id,
        'titulo', NEW.titulo,
        'mensagem', NEW.mensagem,
        'tipo', NEW.tipo
      )
    ),
    '{}'::jsonb,
    1000
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar o trigger na tabela notificacoes
DROP TRIGGER IF EXISTS trigger_notificacoes_send_push ON public.notificacoes;
CREATE TRIGGER trigger_notificacoes_send_push
  AFTER INSERT ON public.notificacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notificacoes_send_push();
