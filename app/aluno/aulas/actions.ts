'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerUser } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

// Helper compartilhado para cancelamento de check-in com promoção da fila
export async function executeCheckinCancellation(checkin: any): Promise<void> {
  const { id, status, tipo, aluno_id, aula_id, data: dateStr } = checkin;

  if (status === 'confirmado') {
    // 1. Devolver saldo ou cancelar cobrança
    if (tipo === 'plano') {
      const { data: matricula } = await supabaseAdmin
        .from('matriculas')
        .select('*')
        .eq('aluno_id', aluno_id)
        .eq('status', 'ativa')
        .gte('data_fim', dateStr)
        .lte('data_inicio', dateStr)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (matricula) {
        await supabaseAdmin
          .from('matriculas')
          .update({ saldo_aulas: matricula.saldo_aulas + 1 })
          .eq('id', matricula.id);
      }
    } else if (tipo === 'avulso') {
      await supabaseAdmin
        .from('pagamentos')
        .update({ status: 'cancelado' })
        .eq('referencia_id', id)
        .eq('status', 'pendente');
    }

    // 2. Excluir o check-in cancelado
    await supabaseAdmin.from('checkins').delete().eq('id', id);

    // 3. Buscar primeiro da lista de espera
    const { data: nextInLine } = await supabaseAdmin
      .from('checkins')
      .select('*')
      .eq('aula_id', aula_id)
      .eq('data', dateStr)
      .eq('status', 'lista_espera')
      .order('posicao_fila', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextInLine) {
      // Verificar saldo do aluno promovido
      const { data: bMatricula } = await supabaseAdmin
        .from('matriculas')
        .select('*')
        .eq('aluno_id', nextInLine.aluno_id)
        .eq('status', 'ativa')
        .gte('data_fim', dateStr)
        .lte('data_inicio', dateStr)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (bMatricula && bMatricula.saldo_aulas > 0) {
        // Promover para Plano
        await supabaseAdmin
          .from('matriculas')
          .update({ saldo_aulas: bMatricula.saldo_aulas - 1 })
          .eq('id', bMatricula.id);

        await supabaseAdmin
          .from('checkins')
          .update({ status: 'confirmado', tipo: 'plano', posicao_fila: null })
          .eq('id', nextInLine.id);
      } else {
        // Promover para Avulso
        await supabaseAdmin
          .from('checkins')
          .update({ status: 'confirmado', tipo: 'avulso', posicao_fila: null })
          .eq('id', nextInLine.id);

        await supabaseAdmin
          .from('pagamentos')
          .insert({
            aluno_id: nextInLine.aluno_id,
            valor: 50.00,
            tipo: 'avulso',
            referencia_id: nextInLine.id,
            status: 'pendente',
            observacao: `Check-in avulso promovido da lista de espera na aula do dia ${dateStr.split('-').reverse().join('/')}`
          });
      }

      // Enviar notificação para o aluno promovido
      await supabaseAdmin.from('notificacoes').insert({
        destinatario_id: nextInLine.aluno_id,
        titulo: 'Vaga Confirmada! 🎉',
        mensagem: `Sua vaga na lista de espera foi confirmada para o treino do dia ${dateStr.split('-').reverse().join('/')}.`,
        tipo: 'vaga_liberada'
      });
    }

    // 4. Reindexar restante da lista de espera
    await reindexWaitlist(aula_id, dateStr);

  } else if (status === 'lista_espera') {
    // Apenas remover da fila e reindexar
    await supabaseAdmin.from('checkins').delete().eq('id', id);
    await reindexWaitlist(aula_id, dateStr);
  }
}

// Reindexar a fila de espera para não deixar buracos
async function reindexWaitlist(aulaId: string, dateStr: string) {
  const { data: remaining } = await supabaseAdmin
    .from('checkins')
    .select('id')
    .eq('aula_id', aulaId)
    .eq('data', dateStr)
    .eq('status', 'lista_espera')
    .order('posicao_fila', { ascending: true });

  if (remaining && remaining.length > 0) {
    for (let i = 0; i < remaining.length; i++) {
      await supabaseAdmin
        .from('checkins')
        .update({ posicao_fila: i + 1 })
        .eq('id', remaining[i].id);
    }
  }
}

// ----------------------------------------------------
// AÇÕES DO ALUNO
// ----------------------------------------------------

export async function checkIn(aulaId: string, dateStr: string): Promise<{ error?: string } | void> {
  const user = await getServerUser();
  if (!user) return { error: 'Não autorizado.' };

  // Evitar duplicados
  const { data: existing } = await supabaseAdmin
    .from('checkins')
    .select('*')
    .eq('aluno_id', user.id)
    .eq('aula_id', aulaId)
    .eq('data', dateStr)
    .maybeSingle();

  if (existing) {
    if (existing.status === 'confirmado' || existing.status === 'lista_espera') {
      return { error: 'Você já está inscrito nesta aula.' };
    }
    // Se for cancelado, limpa para inserir novo
    await supabaseAdmin.from('checkins').delete().eq('id', existing.id);
  }

  // Buscar detalhes da aula e capacidade
  const { data: aula, error: aulaError } = await supabaseAdmin
    .from('aulas')
    .select('capacidade, status')
    .eq('id', aulaId)
    .single();

  if (aulaError || !aula) return { error: 'Aula não encontrada.' };
  if (aula.status !== 'ativa') return { error: 'Esta aula não está disponível para reservas.' };

  // Contar confirmados
  const { count: confirmedCount } = await supabaseAdmin
    .from('checkins')
    .select('*', { count: 'exact', head: true })
    .eq('aula_id', aulaId)
    .eq('data', dateStr)
    .eq('status', 'confirmado');

  const currentConfirmed = confirmedCount || 0;

  if (currentConfirmed < aula.capacidade) {
    // Há vaga! Verificar matrícula ativa do aluno
    const { data: matricula } = await supabaseAdmin
      .from('matriculas')
      .select('*')
      .eq('aluno_id', user.id)
      .eq('status', 'ativa')
      .gte('data_fim', dateStr)
      .lte('data_inicio', dateStr)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (matricula && matricula.saldo_aulas > 0) {
      // Reservar no plano
      const { error: decError } = await supabaseAdmin
        .from('matriculas')
        .update({ saldo_aulas: matricula.saldo_aulas - 1 })
        .eq('id', matricula.id);

      if (decError) return { error: 'Falha ao deduzir saldo do plano.' };

      const { error: insError } = await supabaseAdmin
        .from('checkins')
        .insert({
          aluno_id: user.id,
          aula_id: aulaId,
          data: dateStr,
          status: 'confirmado',
          tipo: 'plano'
        });

      if (insError) return { error: 'Falha ao registrar presença.' };
    } else {
      // Reservar como avulso
      const { data: newCheckin, error: insError } = await supabaseAdmin
        .from('checkins')
        .insert({
          aluno_id: user.id,
          aula_id: aulaId,
          data: dateStr,
          status: 'confirmado',
          tipo: 'avulso'
        })
        .select()
        .single();

      if (insError || !newCheckin) return { error: 'Falha ao registrar check-in avulso.' };

      // Criar pagamento pendente
      await supabaseAdmin.from('pagamentos').insert({
        aluno_id: user.id,
        valor: 50.00,
        tipo: 'avulso',
        referencia_id: newCheckin.id,
        status: 'pendente',
        observacao: `Check-in avulso na aula do dia ${dateStr.split('-').reverse().join('/')}`
      });
    }
  } else {
    // Sem vaga: lista de espera
    const { data: maxQueue } = await supabaseAdmin
      .from('checkins')
      .select('posicao_fila')
      .eq('aula_id', aulaId)
      .eq('data', dateStr)
      .eq('status', 'lista_espera')
      .order('posicao_fila', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextPos = maxQueue ? (maxQueue.posicao_fila || 0) + 1 : 1;

    const { error: queueError } = await supabaseAdmin
      .from('checkins')
      .insert({
        aluno_id: user.id,
        aula_id: aulaId,
        data: dateStr,
        status: 'lista_espera',
        posicao_fila: nextPos,
        tipo: 'plano' // Provisório, será ajustado no momento de uma possível promoção
      });

    if (queueError) return { error: 'Falha ao entrar na lista de espera.' };
  }

  revalidatePath('/aluno/aulas');
}

export async function cancelCheckIn(checkinId: string): Promise<{ error?: string } | void> {
  const user = await getServerUser();
  if (!user) return { error: 'Não autorizado.' };

  const { data: checkin, error: getError } = await supabaseAdmin
    .from('checkins')
    .select('*')
    .eq('id', checkinId)
    .single();

  if (getError || !checkin) return { error: 'Check-in não encontrado.' };
  if (checkin.aluno_id !== user.id) return { error: 'Você não tem permissão para desmarcar este check-in.' };

  await executeCheckinCancellation(checkin);
  revalidatePath('/aluno/aulas');
}
