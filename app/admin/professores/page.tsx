import { supabaseAdmin } from '@/lib/supabase-admin';
import { createProfessor, toggleProfessorStatus, deleteProfessor } from './actions';
import { Plus, Check, X, User, Trash2, Calendar } from 'lucide-react';

export default async function ProfessoresPage() {
  // Busca todos os perfis com role = 'professor'
  const { data: professores } = await supabaseAdmin
    .from('perfis')
    .select('*')
    .eq('role', 'professor')
    .order('created_at', { ascending: false });

  // Buscar todas as aulas para contar a dependência
  const { data: aulas } = await supabaseAdmin
    .from('aulas')
    .select('professor_id, status');

  const getAulasCount = (profId: string) => {
    return aulas?.filter((a) => a.professor_id === profId && a.status === 'ativa').length || 0;
  };

  const formatPhone = (phone: string) => {
    if (!phone) return '-';
    let clean = phone.replace('+55', '');
    if (clean.length === 11) {
      return `(${clean.substring(0, 2)}) ${clean.substring(2, 7)}-${clean.substring(7)}`;
    }
    return phone;
  };

  return (
    <div style={{ padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem' }}>Gerenciar Professores</h2>
          <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
            Cadastre e gerencie os professores de futevôlei da arena.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
        {/* Formulário de Criação */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '16px' }}>Novo Professor</h3>
          <form action={createProfessor} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
              Cadastrar Professor
            </button>
          </form>
        </div>

        {/* Lista de Professores */}
        <div className="card">
          <h3 style={{ fontSize: '1.125rem', marginBottom: '16px' }}>Professores Cadastrados</h3>
          
          {!professores || professores.length === 0 ? (
            <div className="empty-state">
              <p>Nenhum professor cadastrado.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {professores.map((prof) => {
                const aulasCount = getAulasCount(prof.id);
                return (
                  <div
                    key={prof.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      backgroundColor: 'var(--bg-main)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ 
                        width: '40px', height: '40px', borderRadius: '50%', 
                        backgroundColor: 'var(--brand-forest-soft)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center' 
                      }}>
                        <User size={20} color="var(--brand-lime)" />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 600 }}>{prof.nome}</span>
                          {prof.status === 'ativo' ? (
                            <span className="badge badge-success">Ativo</span>
                          ) : (
                            <span className="badge badge-error">Inativo</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {formatPhone(prof.telefone)}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} />
                            {aulasCount} {aulasCount === 1 ? 'aula ativa' : 'aulas ativas'} vinculadas
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <form action={toggleProfessorStatus.bind(null, prof.id, prof.status)}>
                        <button 
                          type="submit" 
                          className="btn btn-ghost btn-sm"
                          title={prof.status === 'ativo' ? 'Desativar' : 'Ativar'}
                        >
                          {prof.status === 'ativo' ? <X size={16} /> : <Check size={16} />}
                        </button>
                      </form>
                      {aulasCount === 0 && (
                        <form action={deleteProfessor.bind(null, prof.id)}>
                          <button 
                            type="submit" 
                            className="btn btn-ghost btn-sm" 
                            style={{ color: 'var(--danger)' }}
                            title="Excluir Professor"
                          >
                            <Trash2 size={16} />
                          </button>
                        </form>
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
