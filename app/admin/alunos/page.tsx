import { supabaseAdmin } from '@/lib/supabase-admin';
import { createAluno, toggleAlunoStatus, matricularAluno } from './actions';
import { Plus, Search, UserCheck, UserX, Award, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default async function AlunosPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const params = await searchParams;
  const searchQuery = params.query || '';

  // Buscar todos os perfis com role = 'aluno'
  let query = supabaseAdmin
    .from('perfis')
    .select('*')
    .eq('role', 'aluno')
    .order('created_at', { ascending: false });

  if (searchQuery) {
    query = query.or(`nome.ilike.%${searchQuery}%,telefone.ilike.%${searchQuery}%`);
  }

  const { data: alunos } = await query;

  // Buscar matrículas ativas com detalhes dos planos
  const { data: matriculas } = await supabaseAdmin
    .from('matriculas')
    .select('*, planos(nome, limite_aulas)')
    .eq('status', 'ativa');

  // Buscar todos os planos ativos para o dropdown de matrícula
  const { data: planos } = await supabaseAdmin
    .from('planos')
    .select('*')
    .eq('status', 'ativo');

  const getAlunoMatricula = (alunoId: string) => {
    return matriculas?.find((m) => m.aluno_id === alunoId);
  };

  const formatPhone = (phone: string) => {
    if (!phone) return '-';
    // Remove +55 se houver
    let clean = phone.replace('+55', '');
    if (clean.length === 11) {
      return `(${clean.substring(0, 2)}) ${clean.substring(2, 7)}-${clean.substring(7)}`;
    }
    return phone;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div style={{ padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem' }}>Gerenciar Alunos</h2>
          <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
            Cadastre, pesquise e vincule planos aos alunos da arena.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
        {/* Formulário de Criação & Busca */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Busca */}
          <div className="card">
            <h3 style={{ fontSize: '1.125rem', marginBottom: '16px' }}>Pesquisar Aluno</h3>
            <form method="GET" action="/admin/alunos" style={{ display: 'flex', gap: '8px' }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <input
                  type="text"
                  name="query"
                  className="form-input"
                  placeholder="Nome ou telefone..."
                  defaultValue={searchQuery}
                />
              </div>
              <button type="submit" className="btn btn-secondary">
                <Search size={16} />
              </button>
            </form>
          </div>

          {/* Cadastro */}
          <div className="card">
            <h3 style={{ fontSize: '1.125rem', marginBottom: '16px' }}>Novo Aluno</h3>
            <form action={createAluno} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label htmlFor="nome" className="form-label">Nome Completo</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  className="form-input"
                  placeholder="Ex: João Silva"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="telefone" className="form-label">Celular (com DDD)</label>
                <input
                  type="text"
                  id="telefone"
                  name="telefone"
                  className="form-input"
                  placeholder="Ex: 16997713160"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-full">
                <Plus size={16} />
                Adicionar Aluno
              </button>
            </form>
          </div>
        </div>

        {/* Lista de Alunos */}
        <div className="card">
          <h3 style={{ fontSize: '1.125rem', marginBottom: '16px' }}>Alunos Cadastrados</h3>

          {!alunos || alunos.length === 0 ? (
            <div className="empty-state">
              <p>Nenhum aluno encontrado.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {alunos.map((aluno) => {
                const matricula = getAlunoMatricula(aluno.id);
                // Tipagem dinâmica do PostgREST para planos
                const planoInfo = matricula?.planos as any;

                return (
                  <div
                    key={aluno.id}
                    style={{
                      padding: '20px',
                      backgroundColor: 'var(--bg-main)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                    }}
                  >
                    {/* Linha Superior: Info e Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{aluno.nome}</span>
                          {aluno.status === 'ativo' ? (
                            <span className="badge badge-success">Ativo</span>
                          ) : (
                            <span className="badge badge-error">Inativo</span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                          {formatPhone(aluno.telefone)}
                        </span>
                      </div>

                      <form action={toggleAlunoStatus.bind(null, aluno.id, aluno.status)}>
                        <button
                          type="submit"
                          className="btn btn-ghost btn-sm"
                          style={{ color: aluno.status === 'ativo' ? 'var(--danger)' : 'var(--success)' }}
                          title={aluno.status === 'ativo' ? 'Bloquear Aluno' : 'Ativar Aluno'}
                        >
                          {aluno.status === 'ativo' ? <UserX size={18} /> : <UserCheck size={18} />}
                        </button>
                      </form>
                    </div>

                    {/* Linha Inferior: Detalhes do Plano */}
                    <div
                      style={{
                        padding: '12px 16px',
                        backgroundColor: 'var(--bg-surface)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      {matricula && planoInfo ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <Award size={18} style={{ color: 'var(--brand-lime)' }} />
                            <div>
                              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{planoInfo.nome}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Expira em: {formatDate(matricula.data_fim)}
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--brand-lime)' }}>
                              {matricula.saldo_aulas} aulas restando
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              de {planoInfo.limite_aulas} contratadas
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            <ShieldAlert size={16} />
                            <span>Sem plano ativo</span>
                          </div>

                          {planos && planos.length > 0 && (
                            <form action={matricularAluno} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input type="hidden" name="aluno_id" value={aluno.id} />
                              <select
                                name="plano_id"
                                className="form-input"
                                style={{ padding: '4px 8px', fontSize: '0.85rem', width: 'auto', marginBottom: 0 }}
                                required
                              >
                                <option value="">Selecione um plano...</option>
                                {planos.map((plano) => (
                                  <option key={plano.id} value={plano.id}>
                                    {plano.nome} (R$ {plano.valor})
                                  </option>
                                ))}
                              </select>
                              <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '6px 12px' }}>
                                Vincular
                              </button>
                            </form>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
