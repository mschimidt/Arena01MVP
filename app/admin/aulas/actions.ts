'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';

// Helper para converter string de hora "HH:MM" ou "HH:MM:SS" em minutos desde a meia-noite
function timeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return hours * 60 + minutes;
}

export async function createAula(formData: FormData): Promise<{ error?: string } | void> {
  const titulo = formData.get('titulo') as string;
  const nivel = formData.get('nivel') as string;
  const professor_id = formData.get('professor_id') as string;
  const quadra_id = formData.get('quadra_id') as string;
  const dias_semana = formData.getAll('dias_semana') as string[];
  const hora_inicio = formData.get('hora_inicio') as string; // "HH:MM"
  const hora_fim = formData.get('hora_fim') as string; // "HH:MM"
  const capacidade = parseInt(formData.get('capacidade') as string, 10);

  if (
    !titulo ||
    !nivel ||
    !professor_id ||
    !quadra_id ||
    dias_semana.length === 0 ||
    !hora_inicio ||
    !hora_fim ||
    isNaN(capacidade)
  ) {
    return { error: 'Por favor, preencha todos os campos obrigatórios.' };
  }

  // Validação: hora_inicio deve ser menor que hora_fim
  const startMins = timeToMinutes(hora_inicio);
  const endMins = timeToMinutes(hora_fim);
  if (startMins >= endMins) {
    return { error: 'O horário de término deve ser após o horário de início.' };
  }

  // Validação de conflitos: buscar aulas da mesma quadra que estejam ativas
  const { data: aulasExistentes, error: fetchError } = await supabaseAdmin
    .from('aulas')
    .select('*')
    .eq('quadra_id', quadra_id)
    .eq('status', 'ativa');

  if (fetchError) {
    return { error: 'Erro ao validar conflitos de horários: ' + fetchError.message };
  }

  // Verificar intersecção
  for (const aula of aulasExistentes) {
    // 1. Verificar se há sobreposição de dias
    const diasEmComum = dias_semana.filter((d) => aula.dias_semana.includes(d));
    if (diasEmComum.length > 0) {
      // 2. Verificar se há sobreposição de horários
      const exStart = timeToMinutes(aula.hora_inicio);
      const exEnd = timeToMinutes(aula.hora_fim);

      // Intersecção ocorre se (start1 < end2) e (end1 > start2)
      if (startMins < exEnd && endMins > exStart) {
        return {
          error: `Conflito de horário! A aula "${aula.titulo}" ocorre na mesma quadra das ${aula.hora_inicio.substring(0, 5)} às ${aula.hora_fim.substring(0, 5)} no(s) dia(s): ${diasEmComum.join(', ')}.`
        };
      }
    }
  }

  const { error } = await supabaseAdmin.from('aulas').insert([
    {
      titulo,
      nivel,
      professor_id,
      quadra_id,
      dias_semana,
      hora_inicio,
      hora_fim,
      capacidade,
      status: 'ativa'
    }
  ]);

  if (error) {
    return { error: 'Erro ao criar aula: ' + error.message };
  }

  revalidatePath('/admin/aulas');
}

export async function toggleAulaStatus(id: string, currentStatus: string): Promise<void> {
  const newStatus = currentStatus === 'ativa' ? 'inativa' : 'ativa';

  const { error } = await supabaseAdmin
    .from('aulas')
    .update({ status: newStatus })
    .eq('id', id);

  if (error) {
    console.error('Erro ao alterar status da aula:', error.message);
  }
  revalidatePath('/admin/aulas');
}

export async function deleteAula(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from('aulas').delete().eq('id', id);
  if (error) {
    console.error('Erro ao excluir aula:', error.message);
  }
  revalidatePath('/admin/aulas');
}
