import { JWT } from "next-auth/jwt";
import { Session, Account, Profile, NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";

// Removed: import getConfig from 'next/config';
// Removed: const { serverRuntimeConfig, publicRuntimeConfig } = getConfig();

interface Token extends JWT {
  accessToken?: string;
}

interface SessionWithToken extends Session {
  accessToken?: string;
  // Removed: baseUrl?: string; // This is not a standard NextAuth session property and NEXTAUTH_URL is handled by NextAuth core
}

interface JWTParams {
  token: Token;
  account: Account | null;
  profile?: Profile; // Profile can be undefined for some providers or flows
}

interface SessionParams {
  session: SessionWithToken;
  token: Token; // Token here is the processed JWT from the jwt callback
}

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: { 
          scope: `openid profile email ${process.env.NEXT_PUBLIC_AZURE_AD_BACKEND_API_SCOPE!}`
        }
      },
      checks: ["pkce", "state"], // Recommended for Azure AD
    }),
  ],
  callbacks: {
    async jwt({ token, account }: JWTParams): Promise<Token> {
      // Persist the access_token to the token right after signin
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }: SessionParams): Promise<SessionWithToken> {
      // Send properties to the client, like an access_token from a provider.
      // The token parameter here is the JWT returned from the `jwt` callback
      if (token?.accessToken) {
        session.accessToken = token.accessToken;
      }
      // Removed non-standard baseUrl assignment
      return session;
    },
  },
  // It's good practice to explicitly set the session strategy if not default, though JWT is default for OAuth providers
  // session: { strategy: "jwt" }, 
  // Add debug option if needed during development, but remove for production
  // debug: process.env.NODE_ENV === 'development',
};

// No default export needed if authOptions is imported directly by name
// export default authOptions;
