'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';

export async function createProfessor(formData: FormData): Promise<void> {
  const nome = formData.get('nome') as string;
  const rawPhone = formData.get('telefone') as string;

  if (!nome || !rawPhone) {
    console.error('Dados inválidos');
    return;
  }

  const cleanPhone = rawPhone.replace(/\D/g, '');
  if (cleanPhone.length !== 11) {
    console.error('Telefone inválido. Deve conter DDD e 9 dígitos.');
    return;
  }

  const formattedPhone = `+55${cleanPhone}`;

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    phone: formattedPhone,
    phone_confirm: true,
    user_metadata: { nome }
  });

  if (authError) {
    console.error(authError.message);
    return;
  }

  const userId = authData.user.id;
  const { error: profileError } = await supabaseAdmin
    .from('perfis')
    .update({ role: 'professor' })
    .eq('id', userId);

  if (profileError) {
    console.error(profileError.message);
  }

  revalidatePath('/admin/professores');
}

export async function toggleProfessorStatus(id: string, currentStatus: string): Promise<void> {
  const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';

  const { error } = await supabaseAdmin
    .from('perfis')
    .update({ status: newStatus })
    .eq('id', id);

  if (error) console.error(error.message);
  revalidatePath('/admin/professores');
}

export async function deleteProfessor(id: string): Promise<void> {
  // T-3.2.5: Impedir exclusão de professor com aulas ativas
  const { data: aulas, error: checkError } = await supabaseAdmin
    .from('aulas')
    .select('id')
    .eq('professor_id', id)
    .eq('status', 'ativa')
    .limit(1);

  if (checkError) {
    console.error('Erro ao verificar aulas do professor:', checkError.message);
    return;
  }

  if (aulas && aulas.length > 0) {
    console.error('Não é possível excluir um professor com aulas ativas vinculadas');
    return;
  }

  // Deletar da tabela perfis (exclusão no auth.users é feita em cascata se configurado,
  // ou podemos deletar do Auth Admin diretamente)
  const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (authDeleteError) {
    console.error('Erro ao excluir usuário do auth:', authDeleteError.message);
    // Tenta deletar apenas o perfil caso o usuário de auth não exista mais
  }

  const { error: profileDeleteError } = await supabaseAdmin
    .from('perfis')
    .delete()
    .eq('id', id);

  if (profileDeleteError) {
    console.error('Erro ao excluir perfil:', profileDeleteError.message);
  }

  revalidatePath('/admin/professores');
}
