import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-key';

if (supabaseServiceRoleKey === 'dummy-key') {
  console.warn(
    '⚠️ Supabase ADMIN credentials not configured. Set SUPABASE_SERVICE_ROLE_KEY in .env.local'
  );
}

// Cliente Supabase com permissões de administrador (ignora RLS)
// IMPORTANTE: Nunca expor este cliente para componentes React do lado do cliente (Client Components)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
