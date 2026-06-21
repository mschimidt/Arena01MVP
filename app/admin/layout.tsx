'use client';

import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LogOut, LayoutDashboard, Users, Calendar, CreditCard, Layers, DollarSign, ClipboardList } from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  const navItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Alunos', href: '/admin/alunos', icon: Users },
    { name: 'Grade de Aulas', href: '/admin/aulas', icon: Calendar },
    { name: 'Check-ins', href: '/admin/checkins', icon: ClipboardList },
    { name: 'Pagamentos', href: '/admin/pagamentos', icon: DollarSign },
    { name: 'Planos', href: '/admin/planos', icon: CreditCard },
    { name: 'Professores', href: '/admin/professores', icon: Users },
    { name: 'Quadras', href: '/admin/quadras', icon: Layers },
  ];

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        backgroundColor: 'var(--bg-main)',
      }}
    >
      {/* Sidebar (Desktop-first) */}
      <aside
        style={{
          width: '240px',
          borderRight: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-surface)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '24px 16px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Logo */}
          <h1 style={{ fontSize: '1.25rem', paddingLeft: '8px' }}>
            <span style={{ color: 'var(--brand-lime)' }}>Arena</span>01
            <span
              style={{
                fontSize: '0.625rem',
                marginLeft: '8px',
                padding: '2px 6px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--danger)',
                borderRadius: '4px',
                fontWeight: 'bold',
              }}
            >
              ADMIN
            </span>
          </h1>

          {/* Nav */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`btn btn-full ${isActive ? '' : 'btn-ghost'}`}
                  style={{
                    justifyContent: 'flex-start',
                    backgroundColor: isActive ? 'var(--brand-lime-soft)' : 'transparent',
                    color: isActive ? 'var(--brand-lime)' : 'var(--text-primary)',
                  }}
                >
                  <Icon size={18} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="btn btn-secondary btn-full"
          style={{
            borderColor: 'transparent',
            backgroundColor: 'var(--danger-soft)',
            color: 'var(--danger)',
          }}
        >
          <LogOut size={16} />
          Sair do Sistema
        </button>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
