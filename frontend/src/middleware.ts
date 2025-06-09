// src/middleware.ts
import { withAuth } from "next-auth/middleware";
import { authBypassMiddleware } from "./middleware-bypass";
import type { NextRequest } from 'next/server';

export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware(request: NextRequest) {
    // Check if auth bypass should be applied first
    const bypassResponse = authBypassMiddleware(request);
    if (bypassResponse) {
      return bypassResponse;
    }
    // Custom middleware logic can go here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Check if auth bypass mode is enabled first
        const isAuthBypassMode = process.env.NEXT_PUBLIC_AUTH_BYPASS_MODE === 'true';
        
        if (isAuthBypassMode) {
          console.log(`[Auth Bypass] Authorizing request to ${req.nextUrl?.pathname} via bypass mode`);
          return true; // Always authorize in bypass mode
        }
        
        // Normal mode - require a valid token
        return !!token;
      },
    },
    // You can specify a custom login page if you have one
    // pages: {
    //   signIn: '/auth/signin', 
    // },
  }
);

// This specifies which paths the middleware should run on.
export const config = {
  matcher: [
    "/dashboard/:path*", // Protects all routes under /dashboard
    // Add other paths you want to protect, e.g., "/profile", "/settings"
  ],
};
