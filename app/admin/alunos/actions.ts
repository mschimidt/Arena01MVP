'use server';

import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';

export async function createAluno(formData: FormData): Promise<void> {
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

  // Criar o usuário no Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    phone: formattedPhone,
    phone_confirm: true,
    user_metadata: { nome }
  });

  if (authError) {
    console.error('Erro ao criar aluno no Auth:', authError.message);
    return;
  }

  // O trigger handle_new_user já cria o perfil do aluno como 'aluno'
  // Vamos atualizar o nome e telefone do perfil para garantir caso não tenha sido disparado
  const userId = authData.user.id;
  const { error: profileError } = await supabaseAdmin
    .from('perfis')
    .update({ nome, telefone: formattedPhone, role: 'aluno', status: 'ativo' })
    .eq('id', userId);

  if (profileError) {
    console.error('Erro ao atualizar perfil do aluno:', profileError.message);
  }

  revalidatePath('/admin/alunos');
}

export async function toggleAlunoStatus(id: string, currentStatus: string): Promise<void> {
  const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';

  const { error } = await supabaseAdmin
    .from('perfis')
    .update({ status: newStatus })
    .eq('id', id);

  if (error) {
    console.error('Erro ao alterar status do aluno:', error.message);
  }
  revalidatePath('/admin/alunos');
}

export async function matricularAluno(formData: FormData): Promise<void> {
  const aluno_id = formData.get('aluno_id') as string;
  const plano_id = formData.get('plano_id') as string;

  if (!aluno_id || !plano_id) {
    console.error('Dados de matrícula inválidos');
    return;
  }

  // Buscar detalhes do plano para calcular expiração e saldo
  const { data: plano, error: planoError } = await supabaseAdmin
    .from('planos')
    .select('*')
    .eq('id', plano_id)
    .single();

  if (planoError || !plano) {
    console.error('Plano não encontrado:', planoError?.message);
    return;
  }

  // Calcular datas
  const data_inicio = new Date();
  const data_fim = new Date();
  data_fim.setDate(data_inicio.getDate() + plano.validade_dias);

  // Formatar datas para YYYY-MM-DD
  const formatSQLDate = (date: Date) => date.toISOString().split('T')[0];

  // Inativar qualquer matrícula ativa anterior desse aluno
  await supabaseAdmin
    .from('matriculas')
    .update({ status: 'cancelada' })
    .eq('aluno_id', aluno_id)
    .eq('status', 'ativa');

  // Criar matrícula
  const { data: matricula, error: matriculaError } = await supabaseAdmin
    .from('matriculas')
    .insert([
      {
        aluno_id,
        plano_id,
        saldo_aulas: plano.limite_aulas,
        data_inicio: formatSQLDate(data_inicio),
        data_fim: formatSQLDate(data_fim),
        status: 'ativa'
      }
    ])
    .select()
    .single();

  if (matriculaError || !matricula) {
    console.error('Erro ao criar matrícula:', matriculaError?.message);
    return;
  }

  // Gerar pagamento pendente correspondente
  const { error: pagamentoError } = await supabaseAdmin
    .from('pagamentos')
    .insert([
      {
        aluno_id,
        valor: plano.valor,
        tipo: 'plano',
        referencia_id: matricula.id,
        status: 'pendente',
        observacao: `Matrícula no plano: ${plano.nome}`
      }
    ]);

  if (pagamentoError) {
    console.error('Erro ao gerar pagamento:', pagamentoError.message);
  }

  revalidatePath('/admin/alunos');
}
