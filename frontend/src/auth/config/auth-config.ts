// Replace these values with your Azure AD app registration details
export const msalConfig = {
  auth: {
    clientId: process.env.REACT_APP_AZURE_AD_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${process.env.REACT_APP_AZURE_AD_TENANT_ID || 'common'}`,
    redirectUri: process.env.REACT_APP_REDIRECT_URI || window.location.origin,
    postLogoutRedirectUri: process.env.REACT_APP_POST_LOGOUT_REDIRECT_URI || window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage', // or 'localStorage' if you prefer
    storeAuthStateInCookie: false, // Set to true if you have issues in IE11/Edge
  },
};

export const loginRequest = {
  scopes: ['openid', 'profile', 'email', 'User.Read'],
};

export const tokenRequest = {
  scopes: ['api://your-api-client-id/access_as_user'], // Replace with your API scope
};
