import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  // Inicializa o cliente do Supabase no Middleware usando cookies
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll().map((cookie) => ({
          name: cookie.name,
          value: cookie.value,
        }));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Obter sessão atual
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Se tentar acessar páginas logadas sem estar autenticado
  if (!user && (path.startsWith('/aluno') || path.startsWith('/professor') || path.startsWith('/admin'))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Se já estiver logado e tentar acessar a página de login
  if (user && path === '/login') {
    // Buscar perfil para redirecionamento inteligente
    const { data: perfil } = await supabase
      .from('perfis')
      .select('role')
      .eq('id', user.id)
      .single();

    if (perfil) {
      if (perfil.role === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      } else if (perfil.role === 'professor') {
        return NextResponse.redirect(new URL('/professor/aulas', request.url));
      } else {
        return NextResponse.redirect(new URL('/aluno/aulas', request.url));
      }
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Validação de Roles específicas
  if (user) {
    // Buscar perfil/role
    const { data: perfil } = await supabase
      .from('perfis')
      .select('role')
      .eq('id', user.id)
      .single();

    if (perfil) {
      // 1. Aluno tentando acessar admin ou professor
      if (perfil.role === 'aluno' && (path.startsWith('/admin') || path.startsWith('/professor'))) {
        return NextResponse.redirect(new URL('/aluno/aulas', request.url));
      }
      // 2. Professor tentando acessar admin ou aluno
      if (perfil.role === 'professor' && (path.startsWith('/admin') || path.startsWith('/aluno'))) {
        return NextResponse.redirect(new URL('/professor/aulas', request.url));
      }
      // 3. Admin tentando acessar aluno ou professor (redireciona para o dashboard dele)
      if (perfil.role === 'admin' && (path.startsWith('/aluno') || path.startsWith('/professor'))) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
