'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Shield, Calendar, Users, LogIn, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        
        // Buscar papel do usuário
        const { data: perfil } = await supabase
          .from('perfis')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (perfil) {
          setRole(perfil.role);
        }
      }
      setLoading(false);
    }
    checkUser();
  }, []);

  const getDashboardLink = () => {
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'professor') return '/professor/aulas';
    return '/aluno/aulas';
  };

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
        gap: '32px',
        backgroundColor: 'var(--bg-main)',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--brand-forest) 0%, var(--brand-lime) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-lime)',
          }}
        >
          <Shield size={28} color="var(--bg-main)" strokeWidth={2.5} />
        </div>
        <div style={{ textAlign: 'left' }}>
          <h1 style={{ fontSize: '1.75rem', lineHeight: 1 }}>
            <span style={{ color: 'var(--brand-lime)' }}>ARENA</span>
            <span style={{ color: 'var(--text-primary)' }}>01</span>
          </h1>
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          >
            Futevôlei
          </span>
        </div>
      </div>

      {/* Main card */}
      <div className="card" style={{ maxWidth: '400px', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Gestão de Futevôlei</h2>
          <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
            Faça check-in nas aulas, gerencie presença e planos de forma rápida.
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px' }}>
            <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={24} color="var(--brand-lime)" />
          </div>
        ) : user ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Você está autenticado</p>
            <Link href={getDashboardLink()} className="btn btn-primary btn-full">
              Ir para o Painel
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <Link href="/login" className="btn btn-primary btn-full">
            Entrar no Sistema
            <LogIn size={16} />
          </Link>
        )}

        <hr style={{ borderColor: 'var(--border-color)', margin: '4px 0' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div className="card-glass" style={{ padding: '16px 12px', textAlign: 'center' }}>
            <Calendar size={20} color="var(--brand-lime)" style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Aulas</div>
          </div>
          <div className="card-glass" style={{ padding: '16px 12px', textAlign: 'center' }}>
            <Shield size={20} color="var(--brand-lime)" style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Check-in</div>
          </div>
          <div className="card-glass" style={{ padding: '16px 12px', textAlign: 'center' }}>
            <Users size={20} color="var(--brand-lime)" style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Turmas</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Arena01 Futevôlei © {new Date().getFullYear()}</p>
    </main>
  );
}
