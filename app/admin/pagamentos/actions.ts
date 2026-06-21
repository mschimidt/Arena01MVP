'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';

export async function marcarPago(
  pagamentoId: string,
  data_pagamento: string
): Promise<{ error?: string } | void> {
  const { error } = await supabaseAdmin
    .from('pagamentos')
    .update({ status: 'pago', data_pagamento: data_pagamento || new Date().toISOString() })
    .eq('id', pagamentoId);

  if (error) return { error: 'Falha ao marcar como pago.' };
  revalidatePath('/admin/pagamentos');
}

export async function marcarCancelado(pagamentoId: string): Promise<{ error?: string } | void> {
  // Buscar pagamento para saber tipo e referencia
  const { data: pag } = await supabaseAdmin
    .from('pagamentos')
    .select('*')
    .eq('id', pagamentoId)
    .single();

  if (!pag) return { error: 'Pagamento não encontrado.' };

  // Se for avulso com referência, tentar cancelar o check-in também
  if (pag.tipo === 'avulso' && pag.referencia_id) {
    await supabaseAdmin
      .from('checkins')
      .update({ status: 'cancelado' })
      .eq('id', pag.referencia_id)
      .eq('status', 'confirmado');
  }

  const { error } = await supabaseAdmin
    .from('pagamentos')
    .update({ status: 'cancelado' })
    .eq('id', pagamentoId);

  if (error) return { error: 'Falha ao cancelar pagamento.' };
  revalidatePath('/admin/pagamentos');
}

export async function criarPagamentoManual(formData: FormData): Promise<{ error?: string } | void> {
  const aluno_id = formData.get('aluno_id') as string;
  const valor = parseFloat(formData.get('valor') as string);
  const tipo = formData.get('tipo') as string;
  const observacao = formData.get('observacao') as string;
  const marcar_como_pago = formData.get('marcar_como_pago') === 'true';

  if (!aluno_id || isNaN(valor) || valor <= 0) {
    return { error: 'Aluno e valor são obrigatórios.' };
  }

  const { error } = await supabaseAdmin.from('pagamentos').insert({
    aluno_id,
    valor,
    tipo: tipo || 'avulso',
    status: marcar_como_pago ? 'pago' : 'pendente',
    data_pagamento: marcar_como_pago ? new Date().toISOString() : null,
    observacao: observacao || null,
  });

  if (error) return { error: 'Falha ao criar pagamento.' };
  revalidatePath('/admin/pagamentos');
}
