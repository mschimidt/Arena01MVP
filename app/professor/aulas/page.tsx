import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerUser } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Users, Clock, Calendar, CheckSquare } from 'lucide-react';

export default async function ProfessorAulasPage() {
  const user = await getServerUser();
  if (!user) {
    redirect('/login');
  }

  // Obter perfil do professor
  const { data: perfil } = await supabaseAdmin
    .from('perfis')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!perfil || perfil.role !== 'professor') {
    redirect('/login');
  }

  // Determinar o dia de hoje
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const diasMapeados = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  const diaHoje = diasMapeados[today.getDay()];

  // Buscar aulas ativas deste professor na grade semanal hoje
  const { data: aulas } = await supabaseAdmin
    .from('aulas')
    .select('*, quadras:quadra_id(nome)')
    .eq('professor_id', user.id)
    .contains('dias_semana', [diaHoje])
    .eq('status', 'ativa')
    .order('hora_inicio', { ascending: true });

  // Buscar todos os check-ins de hoje
  const { data: checkins } = await supabaseAdmin
    .from('checkins')
    .select('*')
    .eq('data', todayStr)
    .eq('status', 'confirmado');

  const getConfirmadosCount = (aulaId: string) => {
    return checkins?.filter((c) => c.aula_id === aulaId).length || 0;
  };

  const formatFriendlyDate = () => {
    return today.toLocaleDateString('pt-BR', {
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
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Prof. {perfil.nome.split(' ')[0]}
          </span>
          <form action="/login" method="GET">
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', padding: '4px 8px' }}>
              <LogOut size={16} />
            </button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '20px', paddingBottom: '96px' }} className="container">
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Minha Agenda</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'capitalize', marginTop: '4px' }}>
            {formatFriendlyDate()}
          </p>
        </div>

        {!aulas || aulas.length === 0 ? (
          <div className="empty-state card">
            <Calendar size={48} className="empty-state-icon" style={{ color: 'var(--text-muted)' }} />
            <h3>Nenhum treino hoje</h3>
            <p style={{ marginTop: '8px', fontSize: '0.875rem' }}>
              Você não possui turmas agendadas na grade para hoje.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {aulas.map((aula) => {
              const confirmados = getConfirmadosCount(aula.id);
              const courtName = (aula.quadras as any)?.nome || 'N/A';

              return (
                <div
                  key={aula.id}
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>{aula.titulo}</span>
                        <span className="badge badge-secondary" style={{ textTransform: 'capitalize' }}>
                          {aula.nivel}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '6px' }}>
                        <Clock size={14} />
                        <span>{aula.hora_inicio.substring(0, 5)} - {aula.hora_fim.substring(0, 5)}</span>
                        <span>•</span>
                        <span>{courtName}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-lime)' }}>
                        {confirmados} / {aula.capacidade}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Alunos Confirmados</div>
                    </div>
                  </div>

                  <div
                    style={{
                      borderTop: '1px solid var(--border-color)',
                      paddingTop: '12px',
                      display: 'flex',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <Link
                      href={`/professor/aulas/${aula.id}?data=${todayStr}`}
                      className="btn btn-primary btn-sm"
                      style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <CheckSquare size={14} />
                      Fazer Chamada
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
