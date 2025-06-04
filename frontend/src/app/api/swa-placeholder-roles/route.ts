import { NextResponse } from 'next/server';

export async function GET() {
  // This is a placeholder endpoint for Azure SWA's custom authentication
  // role assignment. It currently returns no specific roles for SWA's
  // built-in role-based access control.
  // Application-level roles are managed within NextAuth.js session and/or
  // your backend.
  return NextResponse.json({ roles: [] });
}