import { supabaseAdmin } from '@/lib/supabase-admin';
import { createQuadra, toggleQuadraStatus, deleteQuadra } from './actions';
import { Plus, Check, X, Trash2 } from 'lucide-react';

export default async function QuadrasPage() {
  const { data: quadras } = await supabaseAdmin
    .from('quadras')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div style={{ padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem' }}>Gerenciar Quadras</h2>
          <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
            Cadastre as quadras disponíveis na arena.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
        {/* Formulário de Criação */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '16px' }}>Nova Quadra</h3>
          <form action={createQuadra} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="nome" className="form-label">Nome da Quadra</label>
              <input
                type="text"
                id="nome"
                name="nome"
                className="form-input"
                placeholder="Ex: Quadra 1"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="capacidade_maxima" className="form-label">Capacidade Máxima (Alunos)</label>
              <input
                type="number"
                id="capacidade_maxima"
                name="capacidade_maxima"
                className="form-input"
                defaultValue={12}
                min={1}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full">
              <Plus size={16} />
              Adicionar Quadra
            </button>
          </form>
        </div>

        {/* Lista de Quadras */}
        <div className="card">
          <h3 style={{ fontSize: '1.125rem', marginBottom: '16px' }}>Quadras Cadastradas</h3>
          
          {!quadras || quadras.length === 0 ? (
            <div className="empty-state">
              <p>Nenhuma quadra cadastrada.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {quadras.map((quadra) => (
                <div
                  key={quadra.id}
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
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 600 }}>{quadra.nome}</span>
                      {quadra.status === 'ativa' ? (
                        <span className="badge badge-success">Ativa</span>
                      ) : (
                        <span className="badge badge-error">Inativa</span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Capacidade: {quadra.capacidade_maxima} alunos
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <form action={toggleQuadraStatus.bind(null, quadra.id, quadra.status)}>
                      <button 
                        type="submit" 
                        className="btn btn-ghost btn-sm"
                        title={quadra.status === 'ativa' ? 'Desativar' : 'Ativar'}
                      >
                        {quadra.status === 'ativa' ? <X size={16} /> : <Check size={16} />}
                      </button>
                    </form>
                    <form action={deleteQuadra.bind(null, quadra.id)}>
                      <button 
                        type="submit" 
                        className="btn btn-ghost btn-sm" 
                        style={{ color: 'var(--danger)' }}
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
