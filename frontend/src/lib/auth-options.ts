import { JWT } from "next-auth/jwt";
import { Session, Account, Profile } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import getConfig from 'next/config';

const { serverRuntimeConfig, publicRuntimeConfig } = getConfig();

interface Token extends JWT {
  accessToken?: string;
}

interface SessionWithToken extends Session {
  accessToken?: string;
  baseUrl?: string;
}

interface JWTParams {
  token: Token;
  account: Account | null;
  profile?: Profile;
}

interface SessionParams {
  session: SessionWithToken;
  token: Token;
}

export const authOptions = {
  providers: [
    AzureADProvider({
      clientId: publicRuntimeConfig.AZURE_AD_CLIENT_ID,
      clientSecret: serverRuntimeConfig.AZURE_AD_CLIENT_SECRET,
      tenantId: publicRuntimeConfig.AZURE_AD_TENANT_ID,
      authorization: {
        params: { 
          scope: `openid profile email ${publicRuntimeConfig.NEXT_PUBLIC_AZURE_AD_BACKEND_API_SCOPE}`
        }
      },
      checks: ["pkce", "state"],
    }),
  ],
  callbacks: {
    async jwt({ token, account }: JWTParams): Promise<Token> {
      if (account?.access_token) {
        return {
          ...token,
          accessToken: account.access_token,
        };
      }
      return token;
    },
    async session({ session, token }: SessionParams): Promise<SessionWithToken> {
      // Make sure the session has the correct URL
      if (publicRuntimeConfig.NEXTAUTH_URL) {
        session.baseUrl = publicRuntimeConfig.NEXTAUTH_URL;
      }
      
      if (token?.accessToken) {
        return {
          ...session,
          accessToken: token.accessToken,
        };
      }
      return session;
    },
  },
};

export default authOptions;
