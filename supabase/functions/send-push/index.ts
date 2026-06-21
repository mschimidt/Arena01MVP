import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import webPush from 'npm:web-push'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configura o Web Push com as chaves VAPID configuradas no Supabase Secrets
const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY') || '';
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY') || '';
const VAPID_SUBJECT = 'mailto:contato@arena01.com';

webPush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC,
  VAPID_PRIVATE
);

serve(async (req) => {
  try {
    const payload = await req.json();

    // A notificação a enviar (pode vir do trigger do webhook)
    const { record } = payload;
    if (!record || !record.aluno_id) {
      return new Response(JSON.stringify({ error: 'Missing record' }), { status: 400 });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar as subscrições do aluno alvo
    const { data: subscriptions, error } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .eq('aluno_id', record.aluno_id);

    if (error) throw error;
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: 'No subscriptions found for user' }), { status: 200 });
    }

    const notificationPayload = JSON.stringify({
      title: record.titulo || 'Arena01',
      body: record.mensagem || 'Nova notificação da Arena01',
      url: record.link || '/aluno/aulas',
    });

    const sendPromises = subscriptions.map((sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      return webPush.sendNotification(pushSubscription, notificationPayload)
        .catch(async (err) => {
          if (err.statusCode === 404 || err.statusCode === 410) {
            // Subscription expirada/inválida, remover do banco
            await supabaseAdmin.from('push_subscriptions').delete().eq('id', sub.id);
          } else {
            console.error('Erro ao enviar push:', err);
          }
        });
    });

    await Promise.all(sendPromises);

    return new Response(
      JSON.stringify({ success: true, sent: subscriptions.length }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
})
