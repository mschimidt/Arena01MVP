import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerUser } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AttendanceManager from './AttendanceManager';
import { ChevronLeft, Calendar, User, Clock, MapPin } from 'lucide-react';

export default async function ProfessorAulaDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ data?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const user = await getServerUser();
  if (!user) {
    redirect('/login');
  }

  // Verificar perfil
  const { data: perfil } = await supabaseAdmin
    .from('perfis')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!perfil || (perfil.role !== 'professor' && perfil.role !== 'admin')) {
    redirect('/login');
  }

  const { id } = resolvedParams;
  const todayStr = new Date().toISOString().split('T')[0];
  const dateStr = resolvedSearchParams.data || todayStr;

  // Buscar detalhes da aula
  const { data: aula } = await supabaseAdmin
    .from('aulas')
    .select('*, perfis:professor_id(nome), quadras:quadra_id(nome)')
    .eq('id', id)
    .single();

  if (!aula) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Turma não encontrada</h2>
        <Link href="/professor/aulas" style={{ color: 'var(--brand-lime)', textDecoration: 'underline', marginTop: '16px', display: 'inline-block' }}>
          Voltar para agenda
        </Link>
      </div>
    );
  }

  // Buscar check-ins cadastrados nesta data para esta aula
  const { data: checkins } = await supabaseAdmin
    .from('checkins')
    .select('*, perfis:aluno_id(nome, telefone)')
    .eq('aula_id', id)
    .eq('data', dateStr);

  // Buscar todos os alunos ativos da arena para inclusão manual
  const { data: alunos } = await supabaseAdmin
    .from('perfis')
    .select('id, nome, telefone')
    .eq('role', 'aluno')
    .eq('status', 'ativo')
    .order('nome', { ascending: true });

  const formatFriendlyDate = (dateString: string) => {
    const d = new Date(dateString + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const profName = (aula.perfis as any)?.nome || 'N/A';
  const courtName = (aula.quadras as any)?.nome || 'N/A';

  return (
    <div style={{ padding: '40px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link
          href="/professor/aulas"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            textDecoration: 'none',
            marginBottom: '16px',
          }}
        >
          <ChevronLeft size={16} />
          Voltar para agenda
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{aula.titulo}</h2>
              <span className="badge badge-secondary" style={{ textTransform: 'capitalize' }}>{aula.nivel}</span>
            </div>
            
            <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '8px', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={14} />
                {aula.hora_inicio.substring(0, 5)} - {aula.hora_fim.substring(0, 5)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={14} />
                {courtName}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <User size={14} />
                Prof. {profName}
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
            }}
          >
            <Calendar size={16} color="var(--brand-lime)" />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'capitalize' }}>
              {formatFriendlyDate(dateStr)}
            </span>
          </div>
        </div>
      </div>

      <AttendanceManager
        aulaId={id}
        dateStr={dateStr}
        checkins={checkins || []}
        alunosDisponiveis={alunos || []}
      />
    </div>
  );
}
