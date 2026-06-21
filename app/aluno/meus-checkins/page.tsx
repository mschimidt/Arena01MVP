import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerUser } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, CheckCircle2, XCircle, Clock, Award, ChevronRight } from 'lucide-react';

export default async function MeusCheckinsPage() {
  const user = await getServerUser();
  if (!user) redirect('/login');

  const today = new Date().toISOString().split('T')[0];

  // Buscar todos os check-ins do aluno, ordenados por data desc
  const { data: checkins } = await supabaseAdmin
    .from('checkins')
    .select('*, aulas:aula_id(titulo, hora_inicio, hora_fim, nivel, perfis:professor_id(nome))')
    .eq('aluno_id', user.id)
    .order('data', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(60);

  const confirmados = checkins?.filter((c) => c.status === 'confirmado' && c.data <= today) ?? [];
  const agendados = checkins?.filter((c) => c.status === 'confirmado' && c.data > today) ?? [];
  const fila = checkins?.filter((c) => c.status === 'lista_espera') ?? [];
  const cancelados = checkins?.filter((c) => c.status === 'cancelado') ?? [];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const statusBadge = (checkin: any) => {
    if (checkin.status === 'confirmado') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', fontSize: '0.72rem', fontWeight: 700 }}>
          <CheckCircle2 size={11} /> Confirmado
        </span>
      );
    }
    if (checkin.status === 'lista_espera') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontSize: '0.72rem', fontWeight: 700 }}>
          <Clock size={11} /> Fila ({checkin.posicao_fila}º)
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', fontSize: '0.72rem', fontWeight: 700 }}>
        <XCircle size={11} /> Cancelado
      </span>
    );
  };

  const CheckinCard = ({ c }: { c: any }) => {
    const aula = c.aulas as any;
    const professor = aula?.perfis?.nome ?? 'N/A';
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', minWidth: 0 }}>
          <div style={{ flexShrink: 0, width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--brand-forest-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={18} color="var(--brand-lime)" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{aula?.titulo ?? '—'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {formatDate(c.data)} · {aula?.hora_inicio?.substring(0, 5) ?? '—'} · Prof. {professor}
            </div>
          </div>
        </div>
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', marginLeft: '12px' }}>
          {statusBadge(c)}
          <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>{c.tipo}</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: 'var(--bg-main)' }}>
      <header style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-surface)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/aluno/aulas" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={20} />
        </Link>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Meu Histórico</h1>
      </header>

      <main style={{ padding: '20px', paddingBottom: '40px', maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>

        {/* Próximas Aulas */}
        {agendados.length > 0 && (
          <section>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} color="var(--brand-lime)" /> Próximas Aulas
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {agendados.map((c) => <CheckinCard key={c.id} c={c} />)}
            </div>
          </section>
        )}

        {/* Na Fila */}
        {fila.length > 0 && (
          <section>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} color="#f59e0b" /> Na Lista de Espera
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {fila.map((c) => <CheckinCard key={c.id} c={c} />)}
            </div>
          </section>
        )}

        {/* Histórico Confirmado */}
        <section>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} color="var(--success)" /> Treinos Realizados ({confirmados.length})
          </h2>
          {confirmados.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', padding: '24px' }}>
              Nenhum treino confirmado ainda.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {confirmados.map((c) => <CheckinCard key={c.id} c={c} />)}
            </div>
          )}
        </section>

        {/* Cancelamentos */}
        {cancelados.length > 0 && (
          <section>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
              <XCircle size={16} /> Cancelados
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {cancelados.map((c) => <CheckinCard key={c.id} c={c} />)}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
