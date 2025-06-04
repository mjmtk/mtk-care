// src/middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware() {
    // You can add custom logic here if needed, for example, role-based access control
    // The 'req' parameter was removed as it wasn't being used
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
);

// This specifies which paths the middleware should run on.
export const config = {
  matcher: [
    "/dashboard/:path*", // Protects all routes under /dashboard
    // Add other paths you want to protect, e.g., "/profile", "/settings"
  ],
};
