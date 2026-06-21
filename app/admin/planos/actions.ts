'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';

export async function createPlano(formData: FormData): Promise<void> {
  const nome = formData.get('nome') as string;
  const valor = parseFloat(formData.get('valor') as string);
  const limite_aulas = parseInt(formData.get('limite_aulas') as string, 10);
  const validade_dias = parseInt(formData.get('validade_dias') as string, 10);

  if (!nome || isNaN(valor) || isNaN(limite_aulas) || isNaN(validade_dias)) {
    console.error('Dados inválidos para o plano');
    return;
  }

  const { error } = await supabaseAdmin.from('planos').insert([
    {
      nome,
      valor,
      limite_aulas,
      validade_dias,
      status: 'ativo'
    }
  ]);

  if (error) {
    console.error('Erro ao criar plano:', error.message);
  }
  revalidatePath('/admin/planos');
}

export async function togglePlanoStatus(id: string, currentStatus: string): Promise<void> {
  const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';

  const { error } = await supabaseAdmin
    .from('planos')
    .update({ status: newStatus })
    .eq('id', id);

  if (error) {
    console.error('Erro ao alterar status do plano:', error.message);
  }
  revalidatePath('/admin/planos');
}

export async function deletePlano(id: string): Promise<void> {
  // Verificar se há matrículas ativas vinculadas a este plano
  const { data: matriculas, error: checkError } = await supabaseAdmin
    .from('matriculas')
    .select('id')
    .eq('plano_id', id)
    .limit(1);

  if (checkError) {
    console.error('Erro ao verificar dependências do plano:', checkError.message);
    return;
  }

  if (matriculas && matriculas.length > 0) {
    console.error('Não é possível excluir um plano com matrículas vinculadas');
    // Em produção, poderíamos retornar um erro amigável, mas para o fluxo simples, apenas impedimos no backend
    return;
  }

  const { error } = await supabaseAdmin.from('planos').delete().eq('id', id);
  if (error) {
    console.error('Erro ao excluir plano:', error.message);
  }
  revalidatePath('/admin/planos');
}
