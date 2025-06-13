import { NextAuthOptions, Account, Profile, Session } from "next-auth"; // Added Session import
import { JWT } from "next-auth/jwt";
import AzureADProvider from "next-auth/providers/azure-ad";

// Custom interfaces for JWT and Session params are no longer needed here,
// as types are augmented in src/types/next-auth.d.ts

/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const url = `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/token`;
    
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
      body: new URLSearchParams({
        client_id: process.env.AZURE_AD_CLIENT_ID!,
        client_secret: process.env.AZURE_AD_CLIENT_SECRET!,
        scope: `openid profile email offline_access ${process.env.NEXT_PUBLIC_AZURE_AD_BACKEND_API_SCOPE!}`,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken as string,
      }),
    });

    const tokens = await response.json();

    if (!response.ok) {
      throw tokens;
    }

    return {
      ...token,
      accessToken: tokens.access_token,
      accessTokenExpires: Date.now() + (tokens.expires_in * 1000),
      refreshToken: tokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
    };
  } catch (error) {
    console.error("Error refreshing access token:", error);

    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: { 
          scope: `openid profile email offline_access ${process.env.NEXT_PUBLIC_AZURE_AD_BACKEND_API_SCOPE!}`
        }
      },
      checks: ["pkce", "state"], // Recommended for Azure AD
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }: { token: JWT; account: Account | null; profile?: Profile }): Promise<JWT> {
      // Initial sign in
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at ? account.expires_at * 1000 : 0; // Convert to milliseconds
      }

      // Add roles to the token from the profile object (populated by Azure AD provider from ID token claims)
      if (profile?.roles && Array.isArray(profile.roles)) {
        token.roles = profile.roles.filter((role: string) => typeof role === 'string');
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Access token has expired, try to update it
      return await refreshAccessToken(token);
    },
    async session({ session, token }: { session: Session; token: JWT }): Promise<Session> {
      const baseUser = session.user ?? {};

      // If there was an error refreshing the token, force re-authentication
      if (token.error === "RefreshAccessTokenError") {
        // You might want to handle this differently, such as redirecting to sign-in
        console.warn("Refresh token error detected, user may need to re-authenticate");
      }

      // Try to fetch user roles from the Django backend
      let userRoles: string[] = [];
      if (token.accessToken && !token.error) {
        try {
          // Use the Django API to get current user with roles
          const response = await fetch(`${process.env.NEXT_PUBLIC_DJANGO_API_URL}/v1/profile`, {
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
  debug: process.env.NODE_ENV === 'development',
};

// No default export needed if authOptions is imported directly by name
// export default authOptions;
