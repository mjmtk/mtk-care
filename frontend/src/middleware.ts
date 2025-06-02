// src/middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware(req) {
    // You can add custom logic here if needed, for example, role-based access control
    // console.log("token: ", req.nextauth.token);
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
