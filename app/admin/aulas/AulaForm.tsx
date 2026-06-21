'use client';

import { createAula } from './actions';
import { useState, useTransition } from 'react';
import { Plus, AlertCircle, Loader2 } from 'lucide-react';

interface Teacher {
  id: string;
  nome: string;
}

interface Quadra {
  id: string;
  nome: string;
}

interface AulaFormProps {
  professores: Teacher[];
  quadras: Quadra[];
}

export default function AulaForm({ professores, quadras }: AulaFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createAula(formData);
      if (result && result.error) {
        setError(result.error);
      } else {
        // Reset the form if success
        (e.target as HTMLFormElement).reset();
      }
    });
  };

  const dias = [
    { value: 'segunda', label: 'Seg' },
    { value: 'terca', label: 'Ter' },
    { value: 'quarta', label: 'Qua' },
    { value: 'quinta', label: 'Qui' },
    { value: 'sexta', label: 'Sex' },
    { value: 'sabado', label: 'Sáb' },
    { value: 'domingo', label: 'Dom' },
  ];

  return (
    <div className="card" style={{ height: 'fit-content' }}>
      <h3 style={{ fontSize: '1.125rem', marginBottom: '16px' }}>Nova Turma Recorrente</h3>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--danger)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--danger)',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="form-group">
          <label htmlFor="titulo" className="form-label">Título da Turma</label>
          <input
            type="text"
            id="titulo"
            name="titulo"
            className="form-input"
            placeholder="Ex: Futevôlei Iniciante"
            required
            disabled={isPending}
          />
        </div>

        <div className="form-group">
          <label htmlFor="nivel" className="form-label">Nível</label>
          <select id="nivel" name="nivel" className="form-input" required disabled={isPending}>
            <option value="iniciante">Iniciante</option>
            <option value="intermediario">Intermediário</option>
            <option value="avancado">Avançado</option>
            <option value="misto">Misto</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="professor_id" className="form-label">Professor</label>
          <select id="professor_id" name="professor_id" className="form-input" required disabled={isPending}>
            <option value="">Selecione um professor...</option>
            {professores.map((prof) => (
              <option key={prof.id} value={prof.id}>
                {prof.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="quadra_id" className="form-label">Quadra</label>
          <select id="quadra_id" name="quadra_id" className="form-input" required disabled={isPending}>
            <option value="">Selecione uma quadra...</option>
            {quadras.map((q) => (
              <option key={q.id} value={q.id}>
                {q.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Dias da Semana</label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
            {dias.map((dia) => (
              <label
                key={dia.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 10px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                <input type="checkbox" name="dias_semana" value={dia.value} disabled={isPending} />
                <span>{dia.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="form-group">
            <label htmlFor="hora_inicio" className="form-label">Início</label>
            <input
              type="time"
              id="hora_inicio"
              name="hora_inicio"
              className="form-input"
              required
              disabled={isPending}
            />
          </div>
          <div className="form-group">
            <label htmlFor="hora_fim" className="form-label">Término</label>
            <input
              type="time"
              id="hora_fim"
              name="hora_fim"
              className="form-input"
              required
              disabled={isPending}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="capacidade" className="form-label">Capacidade Máxima de Alunos</label>
          <input
            type="number"
            id="capacidade"
            name="capacidade"
            className="form-input"
            defaultValue={10}
            min={1}
            required
            disabled={isPending}
          />
        </div>

        <button type="submit" className="btn btn-primary btn-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Validando e Criando...
            </>
          ) : (
            <>
              <Plus size={16} />
              Criar Turma
            </>
          )}
        </button>
      </form>
    </div>
  );
}
