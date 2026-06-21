'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="btn btn-ghost btn-sm"
      style={{ color: 'var(--danger)', padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      title="Sair do Sistema"
    >
      <LogOut size={16} />
    </button>
  );
}
