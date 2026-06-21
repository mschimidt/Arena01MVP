import { supabaseAdmin } from '@/lib/supabase-admin';
import AulaForm from './AulaForm';
import { toggleAulaStatus, deleteAula } from './actions';
import { Trash2, AlertTriangle, Play, Square, Calendar } from 'lucide-react';

export default async function AulasPage() {
  // Buscar todas as aulas cadastrados com nomes de professores e quadras
  const { data: aulas } = await supabaseAdmin
    .from('aulas')
    .select('*, perfis:professor_id(nome), quadras:quadra_id(nome)');

  // Buscar professores e quadras para o formulário
  const { data: professores } = await supabaseAdmin
    .from('perfis')
    .select('id, nome')
    .eq('role', 'professor')
    .eq('status', 'ativo');

  const { data: quadras } = await supabaseAdmin
    .from('quadras')
    .select('id, nome')
    .eq('status', 'ativa');

  const diasSemana = [
    { value: 'segunda', label: 'Segunda-feira' },
    { value: 'terca', label: 'Terça-feira' },
    { value: 'quarta', label: 'Quarta-feira' },
    { value: 'quinta', label: 'Quinta-feira' },
    { value: 'sexta', label: 'Sexta-feira' },
    { value: 'sabado', label: 'Sábado' },
    { value: 'domingo', label: 'Domingo' },
  ];

  // Agrupar aulas por dia da semana
  const getAulasDoDia = (diaValue: string) => {
    if (!aulas) return [];
    return aulas
      .filter((aula) => aula.dias_semana.includes(diaValue))
      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'iniciante': return 'Iniciante';
      case 'intermediario': return 'Intermediário';
      case 'avancado': return 'Avançado';
      default: return 'Misto';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'iniciante': return 'rgba(16, 185, 129, 0.15)'; // Green soft
      case 'intermediario': return 'rgba(245, 158, 11, 0.15)'; // Yellow soft
      case 'avancado': return 'rgba(239, 68, 68, 0.15)'; // Red soft
      default: return 'rgba(59, 130, 246, 0.15)'; // Blue soft
    }
  };

  const getLevelTextColor = (level: string) => {
    switch (level) {
      case 'iniciante': return '#10b981';
      case 'intermediario': return '#f59e0b';
      case 'avancado': return '#ef4444';
      default: return '#3b82f6';
    }
  };

  return (
    <div style={{ padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem' }}>Grade de Aulas Semanal</h2>
          <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
            Configure e gerencie o cronograma recorrente de aulas e treinos da arena.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '32px', alignItems: 'flex-start' }}>
        {/* Formulário de Criação no menu esquerdo */}
        <AulaForm
          professores={professores || []}
          quadras={quadras || []}
        />

        {/* Grade Semanal */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h3 style={{ fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} />
            Cronograma da Semana
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {diasSemana.map((dia) => {
              const aulasDoDia = getAulasDoDia(dia.value);
              return (
                <div
                  key={dia.value}
                  style={{
                    padding: '16px',
                    backgroundColor: 'var(--bg-main)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <h4 style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--brand-lime)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px' }}>
                    {dia.label}
                  </h4>

                  {aulasDoDia.length === 0 ? (
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Sem turmas agendadas para este dia.
                    </p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                      {aulasDoDia.map((aula) => {
                        const prof = aula.perfis as any;
                        const qdr = aula.quadras as any;

                        return (
                          <div
                            key={aula.id}
                            style={{
                              padding: '14px',
                              backgroundColor: 'var(--bg-surface)',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-color)',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              gap: '12px',
                              opacity: aula.status === 'inativa' ? 0.6 : 1,
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{aula.titulo}</span>
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    backgroundColor: getLevelColor(aula.nivel),
                                    color: getLevelTextColor(aula.nivel),
                                    fontWeight: 'bold',
                                  }}
                                >
                                  {getLevelLabel(aula.nivel)}
                                </span>
                              </div>

                              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div>
                                  <strong>Horário:</strong> {aula.hora_inicio.substring(0, 5)} - {aula.hora_fim.substring(0, 5)}
                                </div>
                                <div>
                                  <strong>Professor:</strong> {prof?.nome || 'N/A'}
                                </div>
                                <div>
                                  <strong>Quadra:</strong> {qdr?.nome || 'N/A'}
                                </div>
                                <div>
                                  <strong>Vagas:</strong> {aula.capacidade} alunos
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                              <span style={{ fontSize: '0.75rem' }}>
                                {aula.status === 'ativa' ? (
                                  <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--success)', borderRadius: '50%' }}></span> Ativa
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--text-muted)', borderRadius: '50%' }}></span> Inativa
                                  </span>
                                )}
                              </span>

                              <div style={{ display: 'flex', gap: '4px' }}>
                                <form action={toggleAulaStatus.bind(null, aula.id, aula.status)}>
                                  <button
                                    type="submit"
                                    className="btn btn-ghost btn-sm"
                                    style={{ padding: '4px 8px' }}
                                    title={aula.status === 'ativa' ? 'Pausar Turma' : 'Ativar Turma'}
                                  >
                                    {aula.status === 'ativa' ? <Square size={14} /> : <Play size={14} />}
                                  </button>
                                </form>

                                <form action={deleteAula.bind(null, aula.id)}>
                                  <button
                                    type="submit"
                                    className="btn btn-ghost btn-sm"
                                    style={{ color: 'var(--danger)', padding: '4px 8px' }}
                                    title="Remover Turma"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </form>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
