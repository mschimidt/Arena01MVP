'use client';

import { checkIn, cancelCheckIn } from './actions';
import { useState, useTransition } from 'react';
import { CheckCircle2, Clock, Users, Calendar, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastProvider';

interface AulaListProps {
  aulas: any[];
  checkins: any[];
  currentUserId: string;
  selectedDateStr: string;
  matricula: any;
}

export default function AulaList({ aulas, checkins, currentUserId, selectedDateStr, matricula }: AulaListProps) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [loadingAulaId, setLoadingAulaId] = useState<string | null>(null);
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const triggerAnimation = (aulaId: string) => {
    setAnimatingId(aulaId);
    setTimeout(() => setAnimatingId(null), 700);
  };

  const handleCheckIn = async (aulaId: string) => {
    setLoadingAulaId(aulaId);

    startTransition(async () => {
      const result = await checkIn(aulaId, selectedDateStr);
      setLoadingAulaId(null);
      if (result && result.error) {
        toastError(result.error);
      } else {
        triggerAnimation(aulaId);
        success('Presença confirmada! ✅');
        router.refresh();
      }
    });
  };

  const handleCancel = async (checkinId: string, aulaId: string) => {
    setLoadingAulaId(aulaId);

    startTransition(async () => {
      const result = await cancelCheckIn(checkinId);
      setLoadingAulaId(null);
      if (result && result.error) {
        toastError(result.error);
      } else {
        success('Presença desmarcada.');
        router.refresh();
      }
    });
  };

  if (aulas.length === 0) {
    return (
      <div className="empty-state card">
        <Calendar size={48} className="empty-state-icon" style={{ color: 'var(--text-muted)' }} />
        <h3>Nenhuma aula hoje</h3>
        <p style={{ marginTop: '8px', fontSize: '0.875rem' }}>
          Não temos turmas agendadas para o dia selecionado.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {aulas.map((aula) => {
        const confirmedCheckins = checkins.filter((c) => c.aula_id === aula.id && c.status === 'confirmado');
        const userCheckin = checkins.find((c) => c.aula_id === aula.id && c.aluno_id === currentUserId);

        const countConfirmed = confirmedCheckins.length;
        const slotsLeft = Math.max(0, aula.capacidade - countConfirmed);
        const isFull = slotsLeft === 0;
        const isLoading = loadingAulaId === aula.id && isPending;
        const isAnimating = animatingId === aula.id;
        const profName = aula.perfis?.nome || 'N/A';
        const courtName = aula.quadras?.nome || 'N/A';
        const occupancyPct = Math.round((countConfirmed / aula.capacidade) * 100);

        return (
          <div
            key={aula.id}
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              borderLeft: userCheckin?.status === 'confirmado'
                ? '3px solid var(--success)'
                : userCheckin?.status === 'lista_espera'
                  ? '3px solid var(--warning)'
                  : '1px solid var(--border-color)',
              transform: isAnimating ? 'scale(1.01)' : 'scale(1)',
              transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.2s ease, box-shadow 0.2s ease',
              boxShadow: isAnimating ? '0 0 24px rgba(184, 224, 0, 0.2)' : undefined,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>{aula.titulo}</span>
                  <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--bg-main)', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {aula.nivel}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '6px', flexWrap: 'wrap' }}>
                  <Clock size={14} />
                  <span>{aula.hora_inicio.substring(0, 5)} - {aula.hora_fim.substring(0, 5)}</span>
                  <span>·</span>
                  <span>Prof. {profName}</span>
                  <span>·</span>
                  <span>{courtName}</span>
                </div>
              </div>

              {/* Badge de Status */}
              {userCheckin && (
                <div style={{ flexShrink: 0 }}>
                  {userCheckin.status === 'confirmado' ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '12px', backgroundColor: 'rgba(34,197,94,0.15)', color: 'var(--success)', fontSize: '0.75rem', fontWeight: 700 }}>
                      <CheckCircle2 size={12} /> Confirmado
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '12px', backgroundColor: 'rgba(245,158,11,0.15)', color: 'var(--warning)', fontSize: '0.75rem', fontWeight: 700 }}>
                      <Clock size={12} /> Fila ({userCheckin.posicao_fila}º)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Barra de Ocupação */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={12} /> {countConfirmed} / {aula.capacidade} vagas
                </span>
                {isFull && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--warning)', fontWeight: 700 }}>Lotada</span>
                )}
              </div>
              <div style={{ height: '5px', borderRadius: '4px', backgroundColor: 'var(--bg-input)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${occupancyPct}%`,
                    borderRadius: '4px',
                    background: occupancyPct >= 100
                      ? 'var(--danger)'
                      : occupancyPct >= 75
                        ? 'var(--warning)'
                        : 'var(--brand-lime)',
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
            </div>

            {/* Ação */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
              {isLoading ? (
                <button className="btn btn-secondary btn-sm" disabled>
                  <Loader2 size={14} className="spin" /> Processando...
                </button>
              ) : userCheckin ? (
                <button
                  onClick={() => handleCancel(userCheckin.id, aula.id)}
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--danger)', fontSize: '0.85rem' }}
                >
                  Desmarcar
                </button>
              ) : (
                <button
                  onClick={() => handleCheckIn(aula.id)}
                  className={isFull ? 'btn btn-secondary btn-sm' : 'btn btn-primary btn-sm'}
                  style={{ fontSize: '0.85rem' }}
                >
                  {isFull ? '📋 Entrar na Fila' : '✅ Confirmar Presença'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
