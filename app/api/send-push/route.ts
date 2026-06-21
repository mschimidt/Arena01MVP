import { NextResponse } from 'next/server';
import webPush from 'web-push';
import { supabaseAdmin } from '@/lib/supabase-admin';

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = 'mailto:contato@arena01.com';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webPush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC,
    VAPID_PRIVATE
  );
}

export async function POST(request: Request) {
  try {
    // Verificar token de autorização
    const authHeader = request.headers.get('Authorization');
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (serviceKey && authHeader !== `Bearer ${serviceKey}`) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const payload = await request.json();
    const { record } = payload;

    if (!record) {
      return NextResponse.json({ error: 'Payload sem record' }, { status: 400 });
    }

    const destinatarioId = record.destinatario_id || record.aluno_id;

    if (!destinatarioId) {
      return NextResponse.json({ error: 'destinatario_id ou aluno_id ausente no record' }, { status: 400 });
    }

    // Buscar as subscrições do aluno
    const { data: subscriptions, error } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .eq('aluno_id', destinatarioId);

    if (error) {
      console.error('Erro ao buscar push subscriptions:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ message: 'Nenhuma subscrição encontrada para o usuário' }, { status: 200 });
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
            await supabaseAdmin
              .from('push_subscriptions')
              .delete()
              .eq('id', sub.id);
          } else {
            console.error('Erro ao enviar push para sub:', sub.id, err);
          }
        });
    });

    await Promise.all(sendPromises);

    return NextResponse.json({ success: true, sentCount: subscriptions.length });
  } catch (error: any) {
    console.error('Erro no endpoint de push:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
