'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Shield, Phone, KeyRound, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
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

  // Envia o OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 11) {
      setError('Por favor, insira um celular válido com DDD (ex: 11 99999-9999).');
      return;
    }

    setLoading(true);
    // Formato E.164 exigido pelo Supabase (+55 no início para Brasil)
    const formattedPhone = `+55${cleanPhone}`;

    try {
      console.log("Supabase URL used:", process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log("Phone being sent:", formattedPhone);
      
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (otpError) throw otpError;

      setStep('otp');
      setMessage('Código de verificação enviado por SMS!');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao enviar SMS. Verifique o número ou tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Verifica o OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = `+55${cleanPhone}`;

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: 'sms',
      });

      if (verifyError) throw verifyError;

      if (data.user) {
        setMessage('Autenticado com sucesso! Redirecionando...');
        
        // Buscar a role do usuário na tabela perfis para redirecionar corretamente
        const { data: perfil, error: perfilError } = await supabase
          .from('perfis')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (perfilError || !perfil) {
          // Se não achar o perfil (ex: primeiro login), envia para a home ou perfil
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
      setError(err.message || 'Código inválido ou expirado. Tente novamente.');
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
          maxWidth: '400px',
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

        {/* Formulário */}
        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.125rem', marginBottom: '4px' }}>Entrar no Sistema</h2>
              <p className="text-secondary" style={{ fontSize: '0.8125rem' }}>
                Digite seu telefone para receber o código de acesso por SMS.
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="phone" className="form-label">
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
                  id="phone"
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
                  <Loader2 className="animate-spin" size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Enviando...
                </>
              ) : (
                'Enviar Código'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.125rem', marginBottom: '4px' }}>Verificação</h2>
              <p className="text-secondary" style={{ fontSize: '0.8125rem' }}>
                Digite o código de 6 dígitos enviado para <strong>{phone}</strong>.
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="otp" className="form-label">
                Código de Acesso
              </label>
              <div style={{ position: 'relative' }}>
                <KeyRound
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
                  id="otp"
                  type="text"
                  className="form-input"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  style={{ paddingLeft: '38px', letterSpacing: '4px', textAlign: 'center', fontWeight: 'bold' }}
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
                  padding: '10px 12px',
                  backgroundColor: 'var(--success-soft)',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--success)',
                  fontSize: '0.75rem',
                  textAlign: 'center',
                }}
              >
                {message}
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={16} />
                  Verificando...
                </>
              ) : (
                'Entrar'
              )}
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-full"
              onClick={() => {
                setStep('phone');
                setError(null);
                setMessage(null);
                setOtp('');
              }}
              disabled={loading}
              style={{ fontSize: '0.8125rem' }}
            >
              Alterar Telefone
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
