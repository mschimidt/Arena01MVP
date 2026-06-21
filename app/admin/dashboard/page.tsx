import { supabaseAdmin } from '@/lib/supabase-admin';
import { Users, Calendar, Landmark, CheckSquare, Clock } from 'lucide-react';

export default async function AdminDashboardPage() {
  // 1. Obter total de alunos ativos
  const { count: totalAlunos } = await supabaseAdmin
    .from('perfis')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'aluno')
    .eq('status', 'ativo');

  // 2. Determinar dia de hoje
  const diasMapeados = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  const hojeNum = new Date().getDay();
  const diaHoje = diasMapeados[hojeNum];

  // Buscar todas as aulas ativas de hoje
  const { data: aulasHoje } = await supabaseAdmin
    .from('aulas')
    .select('*, perfis:professor_id(nome), quadras:quadra_id(nome)')
    .contains('dias_semana', [diaHoje])
    .eq('status', 'ativa')
    .order('hora_inicio', { ascending: true });

  // 3. Buscar todos os check-ins confirmados hoje
  const todayStr = new Date().toISOString().split('T')[0];
  const { data: checkinsHoje } = await supabaseAdmin
    .from('checkins')
    .select('*')
    .eq('data', todayStr)
    .eq('status', 'confirmado');

  // 4. Receita do mês (pagamentos confirmados no mês atual)
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  
  const { data: pagamentosMes } = await supabaseAdmin
    .from('pagamentos')
    .select('valor')
    .eq('status', 'pago')
    .gte('created_at', firstDay);

  const receitaMes = pagamentosMes?.reduce((acc, p) => acc + Number(p.valor), 0) || 0;

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Mapear check-ins por aula para contagem nas próximas aulas
  const getConfirmadosCount = (aulaId: string) => {
    return checkinsHoje?.filter((c) => c.aula_id === aulaId).length || 0;
  };

  return (
    <div style={{ padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem' }}>Painel Administrativo</h2>
          <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
            Visão geral da operação em tempo real da Arena01.
          </p>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '24px',
          marginBottom: '40px',
        }}
      >
        {/* Card 1: Alunos Ativos */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span className="text-secondary" style={{ fontSize: '0.875rem' }}>
              Alunos Ativos
            </span>
            <Users size={20} color="var(--brand-lime)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{totalAlunos || 0}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Matriculados e ativos</span>
        </div>

        {/* Card 2: Aulas Hoje */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span className="text-secondary" style={{ fontSize: '0.875rem' }}>
              Aulas Hoje
            </span>
            <Calendar size={20} color="var(--brand-lime)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{aulasHoje?.length || 0}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Agendadas para hoje</span>
        </div>

        {/* Card 3: Check-ins Hoje */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span className="text-secondary" style={{ fontSize: '0.875rem' }}>
              Presenças Confirmadas
            </span>
            <CheckSquare size={20} color="var(--brand-lime)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{checkinsHoje?.length || 0}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Check-ins realizados hoje</span>
        </div>

        {/* Card 4: Receita do Mês */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span className="text-secondary" style={{ fontSize: '0.875rem' }}>
              Faturamento do Mês
            </span>
            <Landmark size={20} color="var(--brand-lime)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{formatPrice(receitaMes)}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pagamentos realizados</span>
        </div>
      </div>

      {/* Próximas Aulas do Dia */}
      <div className="card">
        <h3 style={{ fontSize: '1.125rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} />
          Agenda de Hoje
        </h3>

        {!aulasHoje || aulasHoje.length === 0 ? (
          <div className="empty-state">
            <p>Nenhuma aula programada para hoje ({diaHoje}).</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {aulasHoje.map((aula) => {
              const confirmados = getConfirmadosCount(aula.id);
              const vagasRestantes = Math.max(0, aula.capacidade - confirmados);
              const prof = aula.perfis as any;
              const qdr = aula.quadras as any;

              return (
                <div
                  key={aula.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    backgroundColor: 'var(--bg-main)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 600 }}>{aula.titulo}</span>
                      <span className="badge badge-secondary">{aula.nivel}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      <span>{aula.hora_inicio.substring(0, 5)} - {aula.hora_fim.substring(0, 5)}</span>
                      <span style={{ margin: '0 8px' }}>|</span>
                      <span>Prof. {prof?.nome || 'N/A'}</span>
                      <span style={{ margin: '0 8px' }}>|</span>
                      <span>{qdr?.nome || 'N/A'}</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: vagasRestantes === 0 ? 'var(--danger)' : 'var(--brand-lime)' }}>
                      {confirmados} / {aula.capacidade} Alunos
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {vagasRestantes === 0 ? 'Lotada' : `${vagasRestantes} vagas restantes`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
