import { supabaseAdmin } from '@/lib/supabase-admin';
import { createPlano, togglePlanoStatus, deletePlano } from './actions';
import { Plus, Check, X, Trash2, CreditCard, Calendar, RefreshCw } from 'lucide-react';

export default async function PlanosPage() {
  const { data: planos } = await supabaseAdmin
    .from('planos')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: matriculas } = await supabaseAdmin
    .from('matriculas')
    .select('plano_id');

  const getMatriculasCount = (planoId: string) => {
    return matriculas?.filter((m) => m.plano_id === planoId).length || 0;
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div style={{ padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem' }}>Planos & Valores</h2>
          <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
            Gerencie os planos de assinatura e pacotes de aulas para os alunos.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
        {/* Formulário de Criação */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '16px' }}>Novo Plano</h3>
          <form action={createPlano} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="nome" className="form-label">Nome do Plano</label>
              <input
                type="text"
                id="nome"
                name="nome"
                className="form-input"
                placeholder="Ex: Mensal 8 Aulas"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="valor" className="form-label">Valor (R$)</label>
              <input
                type="number"
                id="valor"
                name="valor"
                className="form-input"
                placeholder="Ex: 199.90"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="limite_aulas" className="form-label">Limite de Aulas</label>
              <input
                type="number"
                id="limite_aulas"
                name="limite_aulas"
                className="form-input"
                placeholder="Ex: 8"
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="validade_dias" className="form-label">Validade (dias)</label>
              <input
                type="number"
                id="validade_dias"
                name="validade_dias"
                className="form-input"
                defaultValue={30}
                min="1"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full">
              <Plus size={16} />
              Criar Plano
            </button>
          </form>
        </div>

        {/* Lista de Planos */}
        <div className="card">
          <h3 style={{ fontSize: '1.125rem', marginBottom: '16px' }}>Planos Disponíveis</h3>
          
          {!planos || planos.length === 0 ? (
            <div className="empty-state">
              <p>Nenhum plano cadastrado.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {planos.map((plano) => {
                const matriculasCount = getMatriculasCount(plano.id);
                return (
                  <div
                    key={plano.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '20px',
                      backgroundColor: 'var(--bg-main)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      position: 'relative'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <h4 style={{ fontWeight: 600, fontSize: '1.1rem' }}>{plano.nome}</h4>
                        {plano.status === 'ativo' ? (
                          <span className="badge badge-success">Ativo</span>
                        ) : (
                          <span className="badge badge-error">Inativo</span>
                        )}
                      </div>
                      
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--brand-lime)', marginBottom: '16px' }}>
                        {formatPrice(plano.valor)}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CreditCard size={14} />
                          <span>{plano.limite_aulas} aulas incluídas</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={14} />
                          <span>Validade de {plano.validade_dias} dias</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <RefreshCw size={14} />
                          <span>{matriculasCount} {matriculasCount === 1 ? 'aluno matriculado' : 'alunos matriculados'}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                      <form action={togglePlanoStatus.bind(null, plano.id, plano.status)} style={{ flex: 1 }}>
                        <button 
                          type="submit" 
                          className={`btn btn-sm btn-full ${plano.status === 'ativo' ? 'btn-secondary' : 'btn-primary'}`}
                          style={{
                            backgroundColor: plano.status === 'ativo' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            color: plano.status === 'ativo' ? 'var(--danger)' : 'var(--success)',
                            borderColor: 'transparent'
                          }}
                        >
                          {plano.status === 'ativo' ? 'Inativar' : 'Reativar'}
                        </button>
                      </form>
                      
                      {matriculasCount === 0 && (
                        <form action={deletePlano.bind(null, plano.id)}>
                          <button 
                            type="submit" 
                            className="btn btn-ghost btn-sm" 
                            style={{ color: 'var(--danger)', height: '100%' }}
                            title="Excluir Plano"
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
