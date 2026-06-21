import { supabaseAdmin } from '@/lib/supabase-admin';
import Link from 'next/link';
import { CheckCircle2, Clock, XCircle, Calendar, Users } from 'lucide-react';

export default async function AdminCheckinsPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string; aula?: string; status?: string }>;
}) {
  const filters = await searchParams;
  const today = new Date().toISOString().split('T')[0];
  const selectedDate = filters.data || today;

  // Buscar check-ins da data selecionada com join em aluno e aula
  let query = supabaseAdmin
    .from('checkins')
    .select('*, perfis:aluno_id(nome, telefone), aulas:aula_id(titulo, hora_inicio, hora_fim)')
    .eq('data', selectedDate)
    .order('created_at', { ascending: false });

  if (filters.aula) query = query.eq('aula_id', filters.aula);
  if (filters.status) query = query.eq('status', filters.status);

  const { data: checkins } = await query;

  // Buscar aulas ativas do dia selecionado para filtro
  const selectedDateObj = new Date(selectedDate + 'T12:00:00');
  const diasMapeados = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  const diaSemana = diasMapeados[selectedDateObj.getDay()];

  const { data: aulasHoje } = await supabaseAdmin
    .from('aulas')
    .select('id, titulo, hora_inicio')
    .contains('dias_semana', [diaSemana])
    .eq('status', 'ativa')
    .order('hora_inicio');

  // Estatísticas do dia
  const confirmados = checkins?.filter((c) => c.status === 'confirmado').length ?? 0;
  const emFila = checkins?.filter((c) => c.status === 'lista_espera').length ?? 0;
  const cancelados = checkins?.filter((c) => c.status === 'cancelado').length ?? 0;

  const metricas = [
    { label: 'Confirmados', value: confirmados, icon: CheckCircle2, color: 'var(--success)', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Em Fila', value: emFila, icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { label: 'Cancelados', value: cancelados, icon: XCircle, color: 'var(--danger)', bg: 'rgba(239,68,68,0.1)' },
    { label: 'Total', value: (checkins?.length ?? 0), icon: Users, color: 'var(--text-secondary)', bg: 'var(--bg-main)' },
  ];

  const StatusBadge = ({ status, posicao }: { status: string; posicao?: number }) => {
    if (status === 'confirmado') return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '12px', backgroundColor: 'rgba(16,185,129,0.15)', color: 'var(--success)', fontSize: '0.72rem', fontWeight: 700 }}>
        <CheckCircle2 size={11} /> Confirmado
      </span>
    );
    if (status === 'lista_espera') return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '12px', backgroundColor: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontSize: '0.72rem', fontWeight: 700 }}>
        <Clock size={11} /> Fila ({posicao}º)
      </span>
    );
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '12px', backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--danger)', fontSize: '0.72rem', fontWeight: 700 }}>
        <XCircle size={11} /> Cancelado
      </span>
    );
  };

  const formatPhone = (p?: string) => {
    if (!p) return '—';
    const c = p.replace('+55', '');
    if (c.length === 11) return `(${c.slice(0, 2)}) ${c.slice(2, 7)}-${c.slice(7)}`;
    return p;
  };

  return (
    <div style={{ padding: '40px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Check-ins</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.875rem' }}>
          Visão geral de presenças e lista de espera por dia.
        </p>
      </div>

      {/* Seletor de Data */}
      <div className="card" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Calendar size={18} color="var(--brand-lime)" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Data:</label>
          <form method="GET">
            <input
              type="date"
              name="data"
              defaultValue={selectedDate}
              className="form-input"
              style={{ width: 'auto' }}
              onChange={(e) => {
                const url = new URL(window.location.href);
                url.searchParams.set('data', e.target.value);
                window.location.href = url.toString();
              }}
            />
          </form>
        </div>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
          {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
        </span>
      </div>

      {/* Métricas do Dia */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {metricas.map((m) => (
          <div key={m.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <m.icon size={18} color={m.color} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{m.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros por Aula/Status */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'center', marginRight: '4px' }}>Turma:</span>
        <Link
          href={`?data=${selectedDate}`}
          style={{
            padding: '4px 12px',
            borderRadius: '16px',
            fontSize: '0.8rem',
            fontWeight: !filters.aula ? 700 : 400,
            backgroundColor: !filters.aula ? 'var(--brand-lime)' : 'var(--bg-surface)',
            color: !filters.aula ? 'var(--brand-forest)' : 'var(--text-secondary)',
            border: !filters.aula ? '1px solid var(--brand-lime)' : '1px solid var(--border-color)',
            textDecoration: 'none',
          }}
        >
          Todas
        </Link>
        {aulasHoje?.map((a) => (
          <Link
            key={a.id}
            href={`?data=${selectedDate}&aula=${a.id}`}
            style={{
              padding: '4px 12px',
              borderRadius: '16px',
              fontSize: '0.8rem',
              fontWeight: filters.aula === a.id ? 700 : 400,
              backgroundColor: filters.aula === a.id ? 'var(--brand-lime)' : 'var(--bg-surface)',
              color: filters.aula === a.id ? 'var(--brand-forest)' : 'var(--text-secondary)',
              border: filters.aula === a.id ? '1px solid var(--brand-lime)' : '1px solid var(--border-color)',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {a.hora_inicio?.substring(0, 5)} — {a.titulo}
          </Link>
        ))}
      </div>

      {/* Tabela de Check-ins */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
              {['Aluno', 'Telefone', 'Turma', 'Horário', 'Status', 'Tipo', 'Check-in em'].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(!checkins || checkins.length === 0) && (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  Nenhum check-in registrado para esta data.
                </td>
              </tr>
            )}
            {checkins?.map((c, i) => {
              const aluno = c.perfis as any;
              const aula = c.aulas as any;
              return (
                <tr key={c.id} style={{ borderBottom: i < checkins.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: '0.875rem' }}>{aluno?.nome ?? '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatPhone(aluno?.telefone)}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem' }}>{aula?.titulo ?? '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {aula?.hora_inicio?.substring(0, 5) ?? '—'} — {aula?.hora_fim?.substring(0, 5) ?? '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <StatusBadge status={c.status} posicao={c.posicao_fila} />
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '8px', backgroundColor: c.tipo === 'plano' ? 'var(--brand-forest-soft)' : 'var(--bg-main)', color: c.tipo === 'plano' ? 'var(--brand-lime)' : 'var(--text-secondary)', fontWeight: 600, textTransform: 'capitalize' }}>
                      {c.tipo}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(c.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
