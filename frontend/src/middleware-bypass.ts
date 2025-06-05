// src/middleware-bypass.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function authBypassMiddleware(request: NextRequest) {
  // Check if auth bypass mode is enabled
  const isAuthBypassMode = process.env.NEXT_PUBLIC_AUTH_BYPASS_MODE === 'true';
  
  if (isAuthBypassMode) {
    // In bypass mode, allow all requests through without authentication checks
    console.log(`[Auth Bypass] Allowing request to ${request.nextUrl.pathname}`);
    return NextResponse.next();
  }
  
  // Not in bypass mode, return null to let normal middleware handle it
  return null;
}