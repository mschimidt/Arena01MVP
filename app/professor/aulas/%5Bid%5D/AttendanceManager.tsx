'use client';

import { useState, useTransition } from 'react';
import { teacherAddStudent, teacherRemoveStudent } from '../actions';
import { useRouter } from 'next/navigation';
import { User, Trash2, Plus, Clock, Search, Phone, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

interface Student {
  id: string;
  nome: string;
  telefone: string;
}

interface AttendanceManagerProps {
  aulaId: string;
  dateStr: string;
  checkins: any[];
  alunosDisponiveis: Student[];
}

export default function AttendanceManager({
  aulaId,
  dateStr,
  checkins,
  alunosDisponiveis,
}: AttendanceManagerProps) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [isPending, startTransition] = useTransition();
  const [loadingCheckinId, setLoadingCheckinId] = useState<string | null>(null);

  const confirmados = checkins.filter((c) => c.status === 'confirmado');
  const filaEspera = checkins
    .filter((c) => c.status === 'lista_espera')
    .sort((a, b) => (a.posicao_fila || 0) - (b.posicao_fila || 0));

  const formatPhone = (phone: string) => {
    if (!phone) return '-';
    let clean = phone.replace('+55', '');
    if (clean.length === 11) return `(${clean.substring(0, 2)}) ${clean.substring(2, 7)}-${clean.substring(7)}`;
    return phone;
  };

  const inscritosIds = new Set(checkins.map((c) => c.aluno_id));
  const alunosFiltrados = alunosDisponiveis
    .filter((a) => !inscritosIds.has(a.id))
    .filter((a) => a.nome.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, 10);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    startTransition(async () => {
      const result = await teacherAddStudent(aulaId, dateStr, selectedStudentId);
      if (result && result.error) {
        toastError(result.error);
      } else {
        success('Aluno adicionado à turma! ✅');
        setSelectedStudentId('');
        setSearchQuery('');
        router.refresh();
      }
    });
  };

  const handleRemove = async (checkinId: string) => {
    setLoadingCheckinId(checkinId);
    startTransition(async () => {
      const result = await teacherRemoveStudent(checkinId, aulaId);
      setLoadingCheckinId(null);
      if (result && result.error) {
        toastError(result.error);
      } else {
        success('Aluno removido da turma.');
        router.refresh();
      }
    });
  };

  const StudentRow = ({ c }: { c: any }) => {
    const sProfile = c.perfis as any;
    const isLoading = loadingCheckinId === c.id && isPending;

    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          backgroundColor: 'var(--bg-main)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          transition: 'opacity 0.2s ease',
          opacity: isLoading ? 0.5 : 1,
        }}
      >
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: c.status === 'lista_espera' ? 'rgba(245,158,11,0.1)' : 'var(--brand-forest-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {c.status === 'lista_espera'
              ? <Clock size={18} color="var(--warning)" />
              : <User size={18} color="var(--brand-lime)" />
            }
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{sProfile?.nome || 'N/A'}</span>
              {c.status === 'lista_espera' ? (
                <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(245,158,11,0.15)', color: 'var(--warning)', fontWeight: 'bold' }}>
                  {c.posicao_fila}º da fila
                </span>
              ) : (
                <span className={c.tipo === 'plano' ? 'badge badge-success' : 'badge badge-neutral'} style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                  {c.tipo}
                </span>
              )}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <Phone size={10} />
              {formatPhone(sProfile?.telefone)}
            </span>
          </div>
        </div>

        <button
          onClick={() => handleRemove(c.id)}
          disabled={isLoading}
          className="btn btn-ghost btn-sm"
          style={{ color: 'var(--danger)', padding: '6px' }}
          title="Remover"
        >
          {isLoading ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
        </button>
      </div>
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px', alignItems: 'flex-start' }}>
      {/* Listas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="card">
          <h3 style={{ fontSize: '1.125rem', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Confirmados</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{confirmados.length} Alunos</span>
          </h3>
          {confirmados.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px' }}>
              <p>Nenhum aluno confirmado nesta aula.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {confirmados.map((c) => <StudentRow key={c.id} c={c} />)}
            </div>
          )}
        </div>

        {filaEspera.length > 0 && (
          <div className="card">
            <h3 style={{ fontSize: '1.125rem', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Fila de Espera</span>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{filaEspera.length} na fila</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filaEspera.map((c) => <StudentRow key={c.id} c={c} />)}
            </div>
          </div>
        )}
      </div>

      {/* Adicionar Aluno */}
      <div className="card" style={{ height: 'fit-content', position: 'sticky', top: '24px' }}>
        <h3 style={{ fontSize: '1.125rem', marginBottom: '16px' }}>Adicionar Aluno</h3>

        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="student-search">Buscar Aluno</label>
            <div style={{ position: 'relative' }}>
              <input
                id="student-search"
                type="text"
                className="form-input"
                placeholder="Nome do aluno..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSelectedStudentId(''); }}
                disabled={isPending}
                style={{ paddingLeft: '34px' }}
                autoComplete="off"
              />
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          {searchQuery.length >= 1 && (
            <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-main)', maxHeight: '200px', overflowY: 'auto' }}>
              {alunosFiltrados.length === 0 ? (
                <div style={{ padding: '14px', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  Nenhum aluno encontrado
                </div>
              ) : (
                alunosFiltrados.map((aluno) => (
                  <button
                    key={aluno.id}
                    type="button"
                    onClick={() => { setSelectedStudentId(aluno.id); setSearchQuery(aluno.nome); }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      textAlign: 'left',
                      background: selectedStudentId === aluno.id ? 'var(--brand-lime-soft)' : 'none',
                      border: 'none',
                      borderBottom: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{aluno.nome}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{formatPhone(aluno.telefone)}</div>
                  </button>
                ))
              )}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={isPending || !selectedStudentId}
          >
            {isPending ? <Loader2 size={14} className="spin" /> : <Plus size={14} />}
            {isPending ? 'Adicionando...' : 'Adicionar na Aula'}
          </button>
        </form>
      </div>
    </div>
  );
}
