import { Configuration, PopupRequest } from "@azure/msal-browser";

// Runtime check for required Azure AD environment variables (skip if in auth bypass mode)
const isAuthBypassMode = process.env.NEXT_PUBLIC_AUTH_BYPASS_MODE === 'true';

if (!isAuthBypassMode && (
  process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID === undefined ||
  process.env.NEXT_PUBLIC_AZURE_AD_TENANT_ID === undefined ||
  process.env.NEXT_PUBLIC_AZURE_POST_LOGOUT_REDIRECT_URI === undefined
)) {
  throw new Error("One or more required Azure AD environment variables are missing. Please check your .env file and Next.js configuration.");
}


/**
 * App roles are now defined in @/types/auth for better organization
 */

/**
 * MSAL configuration object (populated from environment variables for security and flexibility)
 */
export const msalConfig: Configuration = {
    auth: {
        clientId: process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID || 'bypass-client-id',
        authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_AD_TENANT_ID || 'bypass-tenant'}`,
        redirectUri: process.env.NEXT_PUBLIC_NEXTAUTH_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000',
        postLogoutRedirectUri: process.env.NEXT_PUBLIC_AZURE_POST_LOGOUT_REDIRECT_URI || 'http://localhost:3000',
        navigateToLoginRequestUrl: true,
    },
    cache: {
        cacheLocation: "localStorage", // Switched to localStorage for better persistence
        storeAuthStateInCookie: true, // Enable cookie fallback for compatibility
    },
    system: {
        // MSAL v3 doesn't support allowPlatformBroker in BrowserSystemOptions
        // allowPlatformBroker: false, // Disables WAM Broker
        loggerOptions: {
            loggerCallback: (level: number, message: string, containsPii: boolean) => {
                if (containsPii) {
                    return;
                }
                switch (level) {
                    case 0:
                        console.error(message);
                        return;
                    case 1:
                        console.warn(message);
                        return;
                    case 2:
                        console.info(message);
                        return;
                    case 3:
                        console.debug(message);
                        return;
                    default:
                        console.log(message);
                        return;
                }
            },
            logLevel: 1, //3 -  LogLevel.Verbose
        }
    },
};

/**
 * Scopes for id token to be used at MS Identity Platform endpoints.
 */
export const loginRequest: PopupRequest = {
    scopes: [
        "User.Read", 
        "User.Read.All", 
        "Directory.Read.All", 
        "Directory.ReadWrite.All"
    ],
};
