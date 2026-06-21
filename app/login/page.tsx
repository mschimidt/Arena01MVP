'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Shield, Mail, Lock, User, Phone, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Formata o telefone em tempo real: (XX) XXXXX-XXXX
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 7) {
      value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    } else if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    } else if (value.length > 0) {
      value = `(${value}`;
    }
    setPhone(value);
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;

      if (data.user) {
        setMessage('Autenticado com sucesso! Redirecionando...');
        
        // Buscar a role do usuário na tabela perfis para redirecionar corretamente
        const { data: perfil, error: perfilError } = await supabase
          .from('perfis')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (perfilError || !perfil) {
          router.push('/');
        } else {
          // Redireciona conforme a role
          if (perfil.role === 'admin') {
            router.push('/admin/dashboard');
          } else if (perfil.role === 'professor') {
            router.push('/professor/aulas');
          } else {
            router.push('/aluno/aulas');
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 11) {
      setError('Por favor, insira um celular válido com DDD (ex: 11 99999-9999).');
      return;
    }

    setLoading(true);

    try {
      const { data, error: registerError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome: name,
            telefone: `+55${cleanPhone}`,
          },
        },
      });

      if (registerError) throw registerError;

      if (data.user) {
        if (data.session) {
          setMessage('Cadastro realizado com sucesso! Redirecionando...');
          router.push('/aluno/aulas');
        } else {
          setMessage('Cadastro realizado! Confirme sua conta no link enviado ao seu e-mail.');
          setName('');
          setPhone('');
          setEmail('');
          setPassword('');
          setActiveTab('login');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao realizar cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'var(--bg-main)',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '420px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Header/Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--brand-forest) 0%, var(--brand-lime) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-lime)',
            }}
          >
            <Shield size={24} color="var(--bg-main)" strokeWidth={2.5} />
          </div>
          <div style={{ textAlign: 'center', marginTop: '4px' }}>
            <h1 style={{ fontSize: '1.5rem', lineHeight: 1 }}>
              <span style={{ color: 'var(--brand-lime)' }}>ARENA</span>
              <span style={{ color: 'var(--text-primary)' }}>01</span>
            </h1>
            <span
              style={{
                fontSize: '0.625rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
              }}
            >
              Futevôlei
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            padding: '4px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setError(null);
              setMessage(null);
            }}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: 0,
              fontSize: '0.875rem',
              fontWeight: activeTab === 'login' ? 600 : 500,
              backgroundColor: activeTab === 'login' ? 'var(--brand-forest-soft)' : 'transparent',
              color: activeTab === 'login' ? 'var(--brand-lime)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setError(null);
              setMessage(null);
            }}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: 0,
              fontSize: '0.875rem',
              fontWeight: activeTab === 'register' ? 600 : 500,
              backgroundColor: activeTab === 'register' ? 'var(--brand-forest-soft)' : 'transparent',
              color: activeTab === 'register' ? 'var(--brand-lime)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Cadastrar
          </button>
        </div>

        {/* Formulario */}
        {activeTab === 'login' ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'center', marginBottom: '4px' }}>
              <h2 style={{ fontSize: '1.125rem', marginBottom: '4px' }}>Acessar Conta</h2>
              <p className="text-secondary" style={{ fontSize: '0.8125rem' }}>
                Entre com seu e-mail e senha cadastrados.
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="email-login" className="form-label">
                E-mail
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={18}
                  color="var(--text-muted)"
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                />
                <input
                  id="email-login"
                  type="email"
                  className="form-input"
                  placeholder="exemplo@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '38px' }}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password-login" className="form-label">
                Senha
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={18}
                  color="var(--text-muted)"
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                />
                <input
                  id="password-login"
                  type="password"
                  className="form-input"
                  placeholder="Sua senha secreta"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '38px' }}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  padding: '10px 12px',
                  backgroundColor: 'var(--danger-soft)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--danger)',
                  fontSize: '0.75rem',
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  padding: '10px 12px',
                  backgroundColor: 'var(--success-soft)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--success)',
                  fontSize: '0.75rem',
                }}
              >
                <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{message}</span>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="spin" size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'center', marginBottom: '4px' }}>
              <h2 style={{ fontSize: '1.125rem', marginBottom: '4px' }}>Criar sua Conta</h2>
              <p className="text-secondary" style={{ fontSize: '0.8125rem' }}>
                Preencha os campos para se cadastrar como aluno.
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="name-register" className="form-label">
                Nome Completo
              </label>
              <div style={{ position: 'relative' }}>
                <User
                  size={18}
                  color="var(--text-muted)"
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                />
                <input
                  id="name-register"
                  type="text"
                  className="form-input"
                  placeholder="João Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ paddingLeft: '38px' }}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="phone-register" className="form-label">
                Celular / WhatsApp
              </label>
              <div style={{ position: 'relative' }}>
                <Phone
                  size={18}
                  color="var(--text-muted)"
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                />
                <input
                  id="phone-register"
                  type="text"
                  className="form-input"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={handlePhoneChange}
                  style={{ paddingLeft: '38px' }}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email-register" className="form-label">
                E-mail
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={18}
                  color="var(--text-muted)"
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                />
                <input
                  id="email-register"
                  type="email"
                  className="form-input"
                  placeholder="exemplo@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '38px' }}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password-register" className="form-label">
                Senha
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={18}
                  color="var(--text-muted)"
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                />
                <input
                  id="password-register"
                  type="password"
                  className="form-input"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '38px' }}
                  required
                  minLength={6}
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  padding: '10px 12px',
                  backgroundColor: 'var(--danger-soft)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--danger)',
                  fontSize: '0.75rem',
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="spin" size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Cadastrando...
                </>
              ) : (
                'Cadastrar e Entrar'
              )}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
