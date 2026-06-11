import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('augure_session');
  if (!session?.value) {
    return NextResponse.redirect(new URL('/welcome', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/search', '/glossary'],
};
