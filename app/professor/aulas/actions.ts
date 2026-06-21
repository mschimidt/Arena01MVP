'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerUser } from '@/lib/supabase-server';
import { executeCheckinCancellation } from '@/app/aluno/aulas/actions';
import { revalidatePath } from 'next/cache';

// Verificar se o usuário atual é professor ou admin
async function checkTeacherAuthorization(): Promise<boolean> {
  const user = await getServerUser();
  if (!user) return false;

  const { data: profile } = await supabaseAdmin
    .from('perfis')
    .select('role')
    .eq('id', user.id)
    .single();

  return !!(profile && (profile.role === 'professor' || profile.role === 'admin'));
}

export async function teacherAddStudent(
  aulaId: string,
  dateStr: string,
  alunoId: string
): Promise<{ error?: string } | void> {
  const isAuthorized = await checkTeacherAuthorization();
  if (!isAuthorized) return { error: 'Não autorizado.' };

  // Evitar duplicidade
  const { data: existing } = await supabaseAdmin
    .from('checkins')
    .select('*')
    .eq('aluno_id', alunoId)
    .eq('aula_id', aulaId)
    .eq('data', dateStr)
    .maybeSingle();

  if (existing) {
    if (existing.status === 'confirmado' || existing.status === 'lista_espera') {
      return { error: 'Aluno já cadastrado nesta aula para este dia.' };
    }
    await supabaseAdmin.from('checkins').delete().eq('id', existing.id);
  }

  // Buscar capacidade da aula
  const { data: aula, error: aulaError } = await supabaseAdmin
    .from('aulas')
    .select('capacidade, status')
    .eq('id', aulaId)
    .single();

  if (aulaError || !aula) return { error: 'Aula não encontrada.' };

  // Contar confirmados
  const { count: confirmedCount } = await supabaseAdmin
    .from('checkins')
    .select('*', { count: 'exact', head: true })
    .eq('aula_id', aulaId)
    .eq('data', dateStr)
    .eq('status', 'confirmado');

  const currentConfirmed = confirmedCount || 0;

  if (currentConfirmed < aula.capacidade) {
    // Confirmar presença direto
    const { data: matricula } = await supabaseAdmin
      .from('matriculas')
      .select('*')
      .eq('aluno_id', alunoId)
      .eq('status', 'ativa')
      .gte('data_fim', dateStr)
      .lte('data_inicio', dateStr)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (matricula && matricula.saldo_aulas > 0) {
      await supabaseAdmin
        .from('matriculas')
        .update({ saldo_aulas: matricula.saldo_aulas - 1 })
        .eq('id', matricula.id);

      await supabaseAdmin.from('checkins').insert({
        aluno_id: alunoId,
        aula_id: aulaId,
        data: dateStr,
        status: 'confirmado',
        tipo: 'plano'
      });
    } else {
      const { data: newCheckin } = await supabaseAdmin
        .from('checkins')
        .insert({
          aluno_id: alunoId,
          aula_id: aulaId,
          data: dateStr,
          status: 'confirmado',
          tipo: 'avulso'
        })
        .select()
        .single();

      if (newCheckin) {
        await supabaseAdmin.from('pagamentos').insert({
          aluno_id: alunoId,
          valor: 50.00,
          tipo: 'avulso',
          referencia_id: newCheckin.id,
          status: 'pendente',
          observacao: `Check-in avulso (adicionado pelo professor) em ${dateStr.split('-').reverse().join('/')}`
        });
      }
    }
  } else {
    // Entrar na lista de espera
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

    await supabaseAdmin.from('checkins').insert({
      aluno_id: alunoId,
      aula_id: aulaId,
      data: dateStr,
      status: 'lista_espera',
      posicao_fila: nextPos,
      tipo: 'plano'
    });
  }

  revalidatePath(`/professor/aulas/${aulaId}`);
}

export async function teacherRemoveStudent(checkinId: string, aulaId: string): Promise<{ error?: string } | void> {
  const isAuthorized = await checkTeacherAuthorization();
  if (!isAuthorized) return { error: 'Não autorizado.' };

  const { data: checkin, error: getError } = await supabaseAdmin
    .from('checkins')
    .select('*')
    .eq('id', checkinId)
    .single();

  if (getError || !checkin) return { error: 'Check-in não encontrado.' };

  // Chama o cancelamento comum (trata reembolso e auto-promoção da fila)
  await executeCheckinCancellation(checkin);
  
  revalidatePath(`/professor/aulas/${aulaId}`);
}
