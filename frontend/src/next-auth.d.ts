import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    accessToken?: string; // Add your custom property
    user: {
      id?: string; // Add user ID for bypass mode
      roles?: string[]; // Add roles array for authorization
      // You can add other custom user properties here if needed
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** Azure AD Access Token */
    accessToken?: string;
  }
}
