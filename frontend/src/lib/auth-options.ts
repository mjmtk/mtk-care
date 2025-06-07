import { NextAuthOptions, Account, Profile, Session } from "next-auth"; // Added Session import
import { JWT } from "next-auth/jwt";
import AzureADProvider from "next-auth/providers/azure-ad";

// Custom interfaces for JWT and Session params are no longer needed here,
// as types are augmented in src/types/next-auth.d.ts

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
    async jwt({ token, account, profile }: { token: JWT; account: Account | null; profile?: Profile }): Promise<JWT> {
      // Persist the access_token to the token right after signin
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      // Add roles to the token from the profile object (populated by Azure AD provider from ID token claims)
      // Ensure 'roles' is a claim in your Azure AD ID token and it's an array of strings.
      // The 'profile' object and its 'roles' property are now typed via next-auth.d.ts
      if (profile?.roles && Array.isArray(profile.roles)) {
        token.roles = profile.roles.filter((role: string) => typeof role === 'string');
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }): Promise<Session> {
      const baseUser = session.user ?? {};

      // Try to fetch user roles from the Django backend
      let userRoles: string[] = [];
      if (token.accessToken) {
        try {
          // Use the Django API to get current user with roles
          const response = await fetch(`${process.env.NEXT_PUBLIC_DJANGO_API_URL}/v1/users/me/`, {
            headers: {
              'Authorization': `Bearer ${token.accessToken}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const userData = await response.json();
            // Extract role names from the user data
            if (userData.roles && Array.isArray(userData.roles)) {
              userRoles = userData.roles.map((role: any) => role.name || role).filter(Boolean);
            }
            console.log('Fetched user roles from backend:', userRoles);
          } else {
            console.warn('Failed to fetch user roles from backend:', response.status);
          }
        } catch (error) {
          console.error('Error fetching user roles from backend:', error);
        }
      }

      const augmentedUser = {
        ...baseUser,
        roles: userRoles.length > 0 ? userRoles : (token.roles || []), // Use backend roles or fallback to token roles
      };

      const newSession: Session = {
        expires: session.expires,
        user: augmentedUser,
        ...(token.accessToken && { accessToken: token.accessToken }),
      };
      
      return newSession;
    },
  },
  // It's good practice to explicitly set the session strategy if not default, though JWT is default for OAuth providers
  // session: { strategy: "jwt" }, 
  // Add debug option if needed during development, but remove for production
  // debug: process.env.NODE_ENV === 'development',
};

// No default export needed if authOptions is imported directly by name
// export default authOptions;
