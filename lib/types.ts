/* ================================================
   Arena01 — Database Types
   ================================================ */

export type UserRole = 'admin' | 'professor' | 'aluno';
export type UserStatus = 'ativo' | 'inativo';
export type AulaNivel = 'iniciante' | 'intermediario' | 'avancado' | 'misto';
export type DiaSemana = 'domingo' | 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado';
export type CheckinStatus = 'confirmado' | 'cancelado' | 'lista_espera';
export type CheckinTipo = 'plano' | 'avulso';
export type MatriculaStatus = 'ativa' | 'vencida' | 'cancelada';
export type PagamentoStatus = 'pendente' | 'pago' | 'cancelado';
export type PagamentoTipo = 'plano' | 'avulso';
export type NotificacaoTipo = 'lembrete' | 'vaga_liberada' | 'cancelamento' | 'lista_pre_aula';

export interface Perfil {
  id: string;
  nome: string;
  telefone: string;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
}

export interface Quadra {
  id: string;
  nome: string;
  capacidade_maxima: number;
  status: 'ativa' | 'inativa';
  created_at: string;
}

export interface Aula {
  id: string;
  titulo: string;
  nivel: AulaNivel;
  professor_id: string;
  quadra_id: string;
  dias_semana: DiaSemana[];
  hora_inicio: string;
  hora_fim: string;
  capacidade: number;
  status: 'ativa' | 'inativa';
  created_at: string;
  // Joins
  professor?: Perfil;
  quadra?: Quadra;
}

export interface Plano {
  id: string;
  nome: string;
  valor: number;
  limite_aulas: number;
  validade_dias: number;
  status: 'ativo' | 'inativo';
  created_at: string;
}

export interface Matricula {
  id: string;
  aluno_id: string;
  plano_id: string;
  saldo_aulas: number;
  data_inicio: string;
  data_fim: string;
  status: MatriculaStatus;
  created_at: string;
  // Joins
  aluno?: Perfil;
  plano?: Plano;
}

export interface Checkin {
  id: string;
  aluno_id: string;
  aula_id: string;
  data: string;
  status: CheckinStatus;
  tipo: CheckinTipo;
  posicao_fila: number | null;
  created_at: string;
  // Joins
  aluno?: Perfil;
  aula?: Aula;
}

export interface Pagamento {
  id: string;
  aluno_id: string;
  valor: number;
  tipo: PagamentoTipo;
  referencia_id: string | null;
  status: PagamentoStatus;
  data_pagamento: string | null;
  observacao: string | null;
  created_at: string;
  // Joins
  aluno?: Perfil;
}

export interface Notificacao {
  id: string;
  destinatario_id: string;
  titulo: string;
  mensagem: string;
  tipo: NotificacaoTipo;
  lida: boolean;
  created_at: string;
}
