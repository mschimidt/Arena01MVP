'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';

export async function createQuadra(formData: FormData): Promise<void> {
  const nome = formData.get('nome') as string;
  const capacidade_maxima = parseInt(formData.get('capacidade_maxima') as string, 10);

  if (!nome || isNaN(capacidade_maxima)) {
    console.error('Dados inválidos');
    return;
  }

  const { error } = await supabaseAdmin.from('quadras').insert([
    { nome, capacidade_maxima, status: 'ativa' }
  ]);

  if (error) console.error(error.message);
  revalidatePath('/admin/quadras');
}

export async function toggleQuadraStatus(id: string, currentStatus: string): Promise<void> {
  const newStatus = currentStatus === 'ativa' ? 'inativa' : 'ativa';

  const { error } = await supabaseAdmin
    .from('quadras')
    .update({ status: newStatus })
    .eq('id', id);

  if (error) console.error(error.message);
  revalidatePath('/admin/quadras');
}

export async function deleteQuadra(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from('quadras').delete().eq('id', id);
  if (error) console.error(error.message);
  revalidatePath('/admin/quadras');
}
