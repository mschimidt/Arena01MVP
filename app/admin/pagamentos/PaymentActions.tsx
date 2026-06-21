'use client';

import { useState, useTransition } from 'react';
import { marcarPago, marcarCancelado, criarPagamentoManual } from './actions';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Plus, AlertCircle, Loader2 } from 'lucide-react';

interface PaymentActionsProps {
  pagamentos: any[];
  alunos: any[];
}

export default function PaymentActions({ pagamentos, alunos }: PaymentActionsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleMarcarPago = (id: string) => {
    setError(null);
    setSuccess(null);
    setLoadingId(id);
    startTransition(async () => {
      const result = await marcarPago(id, new Date().toISOString());
      setLoadingId(null);
      if (result?.error) setError(result.error);
      else { setSuccess('Pagamento marcado como pago!'); router.refresh(); }
    });
  };

  const handleMarcarCancelado = (id: string) => {
    if (!confirm('Confirmar cancelamento deste pagamento?')) return;
    setError(null);
    setSuccess(null);
    setLoadingId(id);
    startTransition(async () => {
      const result = await marcarCancelado(id);
      setLoadingId(null);
      if (result?.error) setError(result.error);
      else { setSuccess('Pagamento cancelado.'); router.refresh(); }
    });
  };

  const handleCriar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await criarPagamentoManual(fd);
      if (result?.error) setError(result.error);
      else {
        setSuccess('Pagamento registrado com sucesso!');
        setShowForm(false);
        router.refresh();
      }
    });
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, { label: string; bg: string; color: string }> = {
      pago: { label: 'Pago', bg: 'rgba(16,185,129,0.15)', color: 'var(--success)' },
      cancelado: { label: 'Cancelado', bg: 'rgba(239,68,68,0.1)', color: 'var(--danger)' },
      pendente: { label: 'Pendente', bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
    };
    const b = map[status] ?? map.pendente;
    return (
      <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '12px', backgroundColor: b.bg, color: b.color, fontWeight: 700 }}>
        {b.label}
      </span>
    );
  };

  const formatCurrency = (v: number) =>
    Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Feedback */}
      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--danger)', fontSize: '0.875rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '12px 16px', backgroundColor: 'rgba(16,185,129,0.1)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--success)', fontSize: '0.875rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <CheckCircle2 size={16} /> {success}
        </div>
      )}

      {/* Form novo pagamento */}
      {showForm && (
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Registrar Pagamento Manual</h3>
          <form onSubmit={handleCriar} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Aluno *</label>
              <select name="aluno_id" required className="form-input" defaultValue="">
                <option value="" disabled>Selecione o aluno</option>
                {alunos.map((a) => (
                  <option key={a.id} value={a.id}>{a.nome}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Valor (R$) *</label>
                <input name="valor" type="number" min="0.01" step="0.01" required placeholder="50.00" className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Tipo</label>
                <select name="tipo" className="form-input">
                  <option value="avulso">Avulso</option>
                  <option value="plano">Mensalidade</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Observação</label>
              <input name="observacao" type="text" placeholder="Ex: Aula de reposição" className="form-input" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" id="marcar_como_pago" name="marcar_como_pago" value="true" style={{ width: '16px', height: '16px', accentColor: 'var(--brand-lime)' }} />
              <label htmlFor="marcar_como_pago" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>Marcar como pago imediatamente</label>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={isPending}>
                {isPending ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
                Registrar Pagamento
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabela de pagamentos */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
              {['Aluno', 'Tipo', 'Valor', 'Status', 'Data Criação', 'Data Pagamento', 'Ações'].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagamentos.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Nenhum pagamento encontrado com os filtros selecionados.
                </td>
              </tr>
            )}
            {pagamentos.map((p, i) => {
              const aluno = p.perfis as any;
              const isLoading = loadingId === p.id && isPending;
              return (
                <tr key={p.id} style={{ borderBottom: i < pagamentos.length - 1 ? '1px solid var(--border-color)' : 'none', transition: 'background 0.15s' }}>
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem', fontWeight: 600 }}>{aluno?.nome ?? '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem', textTransform: 'capitalize' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '8px', backgroundColor: p.tipo === 'plano' ? 'var(--brand-forest-soft)' : 'var(--bg-main)', fontSize: '0.75rem', fontWeight: 600, color: p.tipo === 'plano' ? 'var(--brand-lime)' : 'var(--text-secondary)' }}>
                      {p.tipo === 'plano' ? 'Mensalidade' : 'Avulso'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.9rem', fontWeight: 800 }}>{formatCurrency(p.valor)}</td>
                  <td style={{ padding: '12px 16px' }}><StatusBadge status={p.status} /></td>
                  <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(p.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {p.data_pagamento ? new Date(p.data_pagamento).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {p.status === 'pendente' && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => handleMarcarPago(p.id)}
                          disabled={isLoading}
                          className="btn btn-success btn-sm"
                          style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Marcar como pago"
                        >
                          {isLoading ? <Loader2 size={12} className="spin" /> : <CheckCircle2 size={12} />}
                          Pago
                        </button>
                        <button
                          onClick={() => handleMarcarCancelado(p.id)}
                          disabled={isLoading}
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: '0.75rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Cancelar"
                        >
                          <XCircle size={12} /> Cancelar
                        </button>
                      </div>
                    )}
                    {p.status !== 'pendente' && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Botão Novo Pagamento */}
      {!showForm && (
        <div>
          <button
            onClick={() => { setShowForm(true); setError(null); setSuccess(null); }}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} /> Registrar Pagamento Manual
          </button>
        </div>
      )}
    </div>
  );
}
