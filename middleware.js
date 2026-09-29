import { NextResponse } from 'next/server';
import { COOKIE, tokenFor } from './lib/auth';

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/login') || pathname.startsWith('/api/login')) return NextResponse.next();

  const pass = process.env.APP_PASSWORD;
  if (!pass) return NextResponse.next(); // sin contraseña configurada: abierto (solo para pruebas locales)

  const cookie = req.cookies.get(COOKIE)?.value;
  if (cookie && cookie === (await tokenFor(pass))) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg).*)'],
};
