'use server';

import { getSupabaseServer } from '@/lib/supabase-server';

export async function savePushSubscription(subscription: any) {
  const supabase = await getSupabaseServer();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: 'Usuário não autenticado' };
  }

  try {
    const { keys, endpoint } = subscription;
    
    // Check se já existe
    const { data: existing } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('endpoint', endpoint)
      .single();

    if (existing) {
      return { success: true, message: 'Já subscrito' };
    }

    const { error } = await supabase.from('push_subscriptions').insert({
      aluno_id: user.id,
      endpoint: endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    });

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Erro ao salvar subscription:', error);
    return { error: error.message };
  }
}
