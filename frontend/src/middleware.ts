// src/middleware.ts
import { withAuth } from "next-auth/middleware";
import { authBypassMiddleware } from "./middleware-bypass";
import type { NextRequest } from 'next/server';

export default function middleware(request: NextRequest) {
  // Check if auth bypass should be applied first
  const bypassResponse = authBypassMiddleware(request);
  if (bypassResponse) {
    return bypassResponse;
  }
  
  // Apply normal NextAuth middleware
  return withAuth(
    // `withAuth` augments your `Request` with the user's token.
    function middleware() {
      // You can add custom logic here if needed, for example, role-based access control
    },
    {
      callbacks: {
        authorized: ({ token }) => !!token, // If there is a token, the user is authorized
      },
      // You can specify a custom login page if you have one
      // pages: {
      //   signIn: '/auth/signin', 
      // },
    }
  )(request);
}

// This specifies which paths the middleware should run on.
export const config = {
  matcher: [
    "/dashboard/:path*", // Protects all routes under /dashboard
    // Add other paths you want to protect, e.g., "/profile", "/settings"
  ],
};
