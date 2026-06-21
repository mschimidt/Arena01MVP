import { supabaseAdmin } from '@/lib/supabase-admin';
import Link from 'next/link';
import PaymentActions from './PaymentActions';
import { DollarSign, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';

export default async function AdminPagamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; tipo?: string; aluno?: string }>;
}) {
  const filters = await searchParams;

  // Buscar pagamentos com filtros
  let query = supabaseAdmin
    .from('pagamentos')
    .select('*, perfis:aluno_id(nome, telefone)')
    .order('created_at', { ascending: false })
    .limit(200);

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.tipo) query = query.eq('tipo', filters.tipo);
  if (filters.aluno) query = query.ilike('perfis.nome', `%${filters.aluno}%`);

  const { data: pagamentos } = await query;

  // Métricas do mês
  const mesAtual = new Date();
  const primeiroDiaMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1).toISOString();
  const ultimoDiaMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0).toISOString();

  const { data: pagamentosMes } = await supabaseAdmin
    .from('pagamentos')
    .select('valor, status, tipo')
    .gte('created_at', primeiroDiaMes)
    .lte('created_at', ultimoDiaMes);

  const totalPagoMes = pagamentosMes?.filter((p) => p.status === 'pago').reduce((sum, p) => sum + Number(p.valor), 0) ?? 0;
  const totalPendenteMes = pagamentosMes?.filter((p) => p.status === 'pendente').reduce((sum, p) => sum + Number(p.valor), 0) ?? 0;
  const contPendente = pagamentosMes?.filter((p) => p.status === 'pendente').length ?? 0;
  const contPago = pagamentosMes?.filter((p) => p.status === 'pago').length ?? 0;

  // Todos os alunos ativos para o form
  const { data: alunos } = await supabaseAdmin
    .from('perfis')
    .select('id, nome')
    .eq('role', 'aluno')
    .eq('status', 'ativo')
    .order('nome');

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const metricas = [
    {
      label: 'Recebido no Mês',
      value: formatCurrency(totalPagoMes),
      icon: TrendingUp,
      color: 'var(--success)',
      bg: 'rgba(16,185,129,0.1)',
    },
    {
      label: 'A Receber',
      value: formatCurrency(totalPendenteMes),
      icon: Clock,
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.1)',
    },
    {
      label: 'Cobranças Pagas',
      value: contPago.toString(),
      icon: CheckCircle2,
      color: 'var(--brand-lime)',
      bg: 'var(--brand-forest-soft)',
    },
    {
      label: 'Cobranças Pendentes',
      value: contPendente.toString(),
      icon: DollarSign,
      color: 'var(--text-secondary)',
      bg: 'var(--bg-main)',
    },
  ];

  const currentFilters = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
  );

  const buildFilter = (key: string, value: string) => {
    const p = new URLSearchParams(currentFilters);
    if (p.get(key) === value) p.delete(key);
    else p.set(key, value);
    return p.toString() ? `?${p}` : '?';
  };

  return (
    <div style={{ padding: '40px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Pagamentos</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.875rem' }}>
          Controle financeiro, cobranças e recebimentos da arena.
        </p>
      </div>

      {/* Métricas do Mês */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {metricas.map((m) => (
          <div key={m.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <m.icon size={20} color={m.color} />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{m.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros Rápidos */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'center', marginRight: '4px' }}>Filtrar:</span>
        {[
          { key: 'status', value: 'pendente', label: 'Pendentes' },
          { key: 'status', value: 'pago', label: 'Pagos' },
          { key: 'status', value: 'cancelado', label: 'Cancelados' },
          { key: 'tipo', value: 'plano', label: 'Mensalidades' },
          { key: 'tipo', value: 'avulso', label: 'Avulsos' },
        ].map((f) => {
          const active = filters[f.key as keyof typeof filters] === f.value;
          return (
            <Link
              key={`${f.key}-${f.value}`}
              href={buildFilter(f.key, f.value)}
              style={{
                padding: '5px 12px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: active ? 700 : 500,
                backgroundColor: active ? 'var(--brand-lime)' : 'var(--bg-surface)',
                color: active ? 'var(--brand-forest)' : 'var(--text-secondary)',
                border: active ? '1px solid var(--brand-lime)' : '1px solid var(--border-color)',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
            >
              {f.label}
            </Link>
          );
        })}
        {currentFilters.size > 0 && (
          <Link href="?" style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', color: 'var(--danger)', border: '1px solid var(--danger)', textDecoration: 'none', backgroundColor: 'rgba(239,68,68,0.05)' }}>
            Limpar filtros
          </Link>
        )}
      </div>

      {/* Tabela + Ações */}
      <PaymentActions pagamentos={pagamentos ?? []} alunos={alunos ?? []} />
    </div>
  );
}
