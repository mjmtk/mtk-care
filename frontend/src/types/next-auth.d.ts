import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    accessToken?: string;
    user?: {
      roles?: string[];
      programIds?: string[];
      practiceId?: string;
    } & DefaultSession['user']; // Merge with default user properties (name, email, image)
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User {
    roles?: string[];
    programIds?: string[];
    practiceId?: string;
  }

  /**
   * Usually contains information about the provider being used and token details, 
   * e.g., for OAuth providers profile information.
   */
  interface Profile {
    roles?: string[]; // Assuming 'roles' is a claim in your Azure AD ID token
  }
}

declare module 'next-auth/jwt' {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    roles?: string[];
    programIds?: string[];
    practiceId?: string;
    error?: string;
  }
}
