import NextAuth from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";

export const authOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: { scope: `openid profile email ${process.env.NEXT_PUBLIC_AZURE_AD_BACKEND_API_SCOPE}` },
      },
      checks: ["pkce", "state"], // Re-adding PKCE as required by Azure AD

    }),
  ],
  callbacks: {
    async jwt({ token, profile, account }) {
      if (account && profile) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Pass the accessToken from the JWT token to the session
      if (token.accessToken) {
        (session as any).accessToken = token.accessToken;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
