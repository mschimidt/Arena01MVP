import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerUser } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AulaList from './AulaList';
import PushOptIn from '@/components/PushOptIn';
import LogoutButton from '@/components/LogoutButton';
import { Calendar, Award, User, Sparkles } from 'lucide-react';

export default async function AlunoAulasPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const resolvedParams = await searchParams;
  const user = await getServerUser();
  if (!user) {
    redirect('/login');
  }

  // Obter perfil
  const { data: perfil } = await supabaseAdmin
    .from('perfis')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!perfil) {
    redirect('/login');
  }

  // Definir data selecionada (default hoje)
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const selectedDateStr = resolvedParams.date || todayStr;

  // Gerar os próximos 7 dias
  const dates = [];
  const diasSemanaMapa = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const isToday = dateStr === todayStr;
    const isSelected = dateStr === selectedDateStr;
    
    dates.push({
      dateStr,
      dayNum: d.getDate(),
      dayNameShort: isToday ? 'Hoje' : d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
      monthNameShort: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      isSelected,
    });
  }

  // Obter dia da semana da data selecionada em português
  const selectedDate = new Date(selectedDateStr + 'T12:00:00'); // Evitar timezone shift
  const diasMapeados = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  const selectedDayName = diasMapeados[selectedDate.getDay()];

  // Buscar todas as aulas ativas do dia da semana correspondente
  const { data: aulas } = await supabaseAdmin
    .from('aulas')
    .select('*, perfis:professor_id(nome), quadras:quadra_id(nome)')
    .contains('dias_semana', [selectedDayName])
    .eq('status', 'ativa');

  // Buscar todos os check-ins da data selecionada nesta arena
  const { data: checkins } = await supabaseAdmin
    .from('checkins')
    .select('*')
    .eq('data', selectedDateStr);

  // Buscar matrícula ativa
  const { data: matricula } = await supabaseAdmin
    .from('matriculas')
    .select('*, planos(nome)')
    .eq('aluno_id', user.id)
    .eq('status', 'ativa')
    .gte('data_fim', selectedDateStr)
    .lte('data_inicio', selectedDateStr)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Formatar data em formato amigável
  const formatFriendlyDate = (dateString: string) => {
    const d = new Date(dateString + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-main)',
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-surface)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
          <span style={{ color: 'var(--brand-lime)' }}>Arena</span>01
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <PushOptIn />
          <LogoutButton />
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '20px', paddingBottom: '96px' }} className="container">
        {/* Card do Plano */}
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, var(--brand-forest), rgba(26, 46, 33, 0.95))',
            borderColor: 'var(--brand-lime-soft)',
            marginBottom: '24px',
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: '-10px',
              bottom: '-10px',
              opacity: 0.1,
              transform: 'scale(1.5)',
            }}
          >
            <Sparkles size={120} color="var(--brand-lime)" />
          </div>

          {matricula ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Plano Ativo
                  </span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '2px', color: 'var(--brand-lime)' }}>
                    {matricula.planos?.nome}
                  </h3>
                </div>
                <span
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    color: '#10b981',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  Ativo
                </span>
              </div>

              <div style={{ display: 'flex', gap: '24px', marginTop: '16px' }}>
                <div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff' }}>
                    {matricula.saldo_aulas}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)' }}>Aulas Restantes</div>
                </div>
                <div style={{ borderLeft: '1px solid rgba(255,255,255,0.15)' }}></div>
                <div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, paddingTop: '6px' }}>
                    {new Date(matricula.data_fim + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)' }}>Vencimento</div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#fff' }}>Nenhum plano ativo</h3>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)', marginTop: '4px' }}>
                Os seus check-ins serão gerados como avulso (R$ 50,00 cada). Fale com a recepção para ativar um plano.
              </p>
            </div>
          )}
        </div>

        {/* Calendário Semanal Slider */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>Escolha o Dia</h3>
          <div
            style={{
              display: 'flex',
              gap: '10px',
              overflowX: 'auto',
              paddingBottom: '8px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {dates.map((day) => (
              <Link
                key={day.dateStr}
                href={`?date=${day.dateStr}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: '60px',
                  padding: '12px 8px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: day.isSelected ? 'var(--brand-lime)' : 'var(--bg-surface)',
                  border: day.isSelected ? '1px solid var(--brand-lime)' : '1px solid var(--border-color)',
                  color: day.isSelected ? 'var(--brand-forest)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textDecoration: 'none',
                }}
              >
                <span style={{ fontSize: '0.7rem', fontWeight: day.isSelected ? 700 : 500, textTransform: 'uppercase' }}>
                  {day.dayNameShort}
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, margin: '4px 0' }}>
                  {day.dayNum}
                </span>
                <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>
                  {day.monthNameShort}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Data Selecionada e Grid */}
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
            {formatFriendlyDate(selectedDateStr)}
          </h4>
        </div>

        <AulaList
          aulas={aulas || []}
          checkins={checkins || []}
          currentUserId={user.id}
          selectedDateStr={selectedDateStr}
          matricula={matricula}
        />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '64px',
          backgroundColor: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          zIndex: 100,
        }}
      >
        <Link
          href="/aluno/aulas"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'none',
            border: 'none',
            color: 'var(--brand-lime)',
            fontSize: '0.75rem',
            cursor: 'pointer',
            textDecoration: 'none',
          }}
        >
          <Calendar size={20} />
          <span>Aulas</span>
        </Link>
        <Link
          href="/aluno/meu-plano"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: '0.75rem',
            cursor: 'pointer',
            textDecoration: 'none',
          }}
        >
          <Award size={20} />
          <span>Meu Plano</span>
        </Link>
        <Link
          href="/aluno/meus-checkins"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: '0.75rem',
            cursor: 'pointer',
            textDecoration: 'none',
          }}
        >
          <User size={20} />
          <span>Histórico</span>
        </Link>
      </nav>
    </div>
  );
}
