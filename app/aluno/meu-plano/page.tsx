import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerUser } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles, AlertTriangle, CheckCircle2, Clock, CreditCard, Calendar } from 'lucide-react';

export default async function MeuPlanoPage() {
  const user = await getServerUser();
  if (!user) redirect('/login');

  const today = new Date().toISOString().split('T')[0];

  // Buscar matrícula ativa
  const { data: matricula } = await supabaseAdmin
    .from('matriculas')
    .select('*, planos(nome, valor, limite_aulas, validade_dias)')
    .eq('aluno_id', user.id)
    .eq('status', 'ativa')
    .gte('data_fim', today)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Buscar histórico de pagamentos
  const { data: pagamentos } = await supabaseAdmin
    .from('pagamentos')
    .select('*')
    .eq('aluno_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  // Buscar total de treinos realizados
  const { count: totalTreinos } = await supabaseAdmin
    .from('checkins')
    .select('*', { count: 'exact', head: true })
    .eq('aluno_id', user.id)
    .eq('status', 'confirmado');

  const plano = matricula?.planos as any;
  const limiteAulas = plano?.limite_aulas ?? 1;
  const saldoAtual = matricula?.saldo_aulas ?? 0;
  const aulasConcluidas = limiteAulas - saldoAtual;
  const progressoPct = Math.max(0, Math.min(100, Math.round((aulasConcluidas / limiteAulas) * 100)));

  const diasParaVencer = matricula
    ? Math.ceil(
        (new Date(matricula.data_fim + 'T12:00:00').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  const saldoBaixo = saldoAtual <= 2 && saldoAtual > 0;
  const vencimentoProximo = diasParaVencer !== null && diasParaVencer <= 5;

  const formatDate = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('pt-BR');

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const statusBadgePagamento = (status: string) => {
    if (status === 'pago') return { label: 'Pago', bg: 'rgba(16,185,129,0.15)', color: 'var(--success)' };
    if (status === 'cancelado') return { label: 'Cancelado', bg: 'rgba(239,68,68,0.1)', color: 'var(--danger)' };
    return { label: 'Pendente', bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' };
  };

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: 'var(--bg-main)' }}>
      <header style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-surface)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/aluno/aulas" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={20} />
        </Link>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Meu Plano</h1>
      </header>

      <main style={{ padding: '20px', paddingBottom: '40px', maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Card do Plano Principal */}
        {matricula ? (
          <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div
              style={{
                padding: '24px',
                background: 'linear-gradient(135deg, var(--brand-forest) 0%, #1a3a25 100%)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.08 }}>
                <Sparkles size={160} color="var(--brand-lime)" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Plano Ativo</span>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--brand-lime)', marginTop: '2px' }}>{plano?.nome}</h2>
                </div>
                <span style={{ padding: '4px 10px', borderRadius: '12px', backgroundColor: 'rgba(16,185,129,0.2)', color: '#10b981', fontSize: '0.75rem', fontWeight: 700, border: '1px solid rgba(16,185,129,0.3)' }}>
                  Ativo
                </span>
              </div>

              {/* Barra de Progresso */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Aulas utilizadas</span>
                  <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 700 }}>{aulasConcluidas}/{limiteAulas}</span>
                </div>
                <div style={{ height: '8px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      borderRadius: '4px',
                      width: `${progressoPct}%`,
                      background: progressoPct >= 80
                        ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                        : 'linear-gradient(90deg, var(--brand-lime), #38bdf8)',
                      transition: 'width 0.6s ease',
                    }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {[
                  { label: 'Saldo Restante', value: `${saldoAtual} aulas` },
                  { label: 'Vencimento', value: formatDate(matricula.data_fim) },
                  { label: 'Total de Treinos', value: `${totalTreinos ?? 0}` },
                ].map((s) => (
                  <div key={s.label} style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 'var(--radius-md)', padding: '10px 12px' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>{s.value}</div>
                    <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alertas */}
            {(saldoBaixo || vencimentoProximo) && (
              <div style={{ borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)' }}>
                {saldoBaixo && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: vencimentoProximo ? '1px solid var(--border-color)' : 'none', color: '#f59e0b', fontSize: '0.85rem' }}>
                    <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                    <span><strong>Saldo baixo:</strong> Você tem apenas {saldoAtual} aula{saldoAtual !== 1 ? 's' : ''} restante{saldoAtual !== 1 ? 's' : ''}. Renove seu plano em breve.</span>
                  </div>
                )}
                {vencimentoProximo && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', color: 'var(--danger)', fontSize: '0.85rem' }}>
                    <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                    <span><strong>Vencimento próximo:</strong> Seu plano vence em {diasParaVencer} dia{diasParaVencer !== 1 ? 's' : ''}. Fale com a recepção para renovar.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
            <Sparkles size={48} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
            <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>Nenhum plano ativo</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Fale com a recepção da Arena01 para se matricular em um plano e garantir suas aulas.
            </p>
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Check-ins avulsos: <strong>R$ 50,00 / aula</strong>
            </div>
          </div>
        )}

        {/* Totais Rápidos */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Link href="/aluno/meus-checkins" style={{ textDecoration: 'none' }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--brand-forest-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Calendar size={18} color="var(--brand-lime)" />
              </div>
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{totalTreinos ?? 0}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Treinos Realizados</div>
              </div>
            </div>
          </Link>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={18} color="var(--success)" />
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{saldoAtual}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Aulas Restantes</div>
            </div>
          </div>
        </div>

        {/* Histórico Financeiro */}
        <section>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CreditCard size={16} color="var(--brand-lime)" /> Meus Pagamentos
          </h2>
          {!pagamentos || pagamentos.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', padding: '24px' }}>
              Nenhum pagamento registrado.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pagamentos.map((p) => {
                const badge = statusBadgePagamento(p.status);
                return (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'capitalize' }}>{p.tipo === 'plano' ? 'Mensalidade' : 'Aula Avulsa'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {new Date(p.created_at).toLocaleDateString('pt-BR')}
                        {p.observacao ? ` · ${p.observacao.substring(0, 40)}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <span style={{ fontWeight: 800, fontSize: '1rem' }}>{formatCurrency(Number(p.valor))}</span>
                      <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '10px', backgroundColor: badge.bg, color: badge.color, fontWeight: 700 }}>
                        {badge.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
