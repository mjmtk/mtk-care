/**
 * Token Manager Service
 * 
 * Handles proactive token refresh and monitoring to prevent token expiration errors.
 * This service works alongside the axios interceptors to provide a robust token management system.
 */

interface TokenInfo {
  token: string;
  expiresAt: number; // Unix timestamp
}

class TokenManager {
  private currentToken: TokenInfo | null = null;
  private refreshFunction: (() => Promise<string | null>) | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  // Set the function to call when token needs refreshing
  setRefreshFunction(fn: () => Promise<string | null>) {
    this.refreshFunction = fn;
  }

  // Store token with its expiration time
  setToken(token: string, expiresInSeconds?: number) {
    const expiresAt = expiresInSeconds 
      ? Date.now() + (expiresInSeconds * 1000)
      : Date.now() + (3600 * 1000); // Default to 1 hour

    this.currentToken = { token, expiresAt };
    this.scheduleRefresh();
  }

  // Get current token if it's still valid
  getCurrentToken(): string | null {
    if (!this.currentToken) return null;
    
    // Check if token is expired or will expire in the next 5 minutes
    const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000);
    if (this.currentToken.expiresAt <= fiveMinutesFromNow) {
      return null; // Token is expired or will expire soon
    }

    return this.currentToken.token;
  }

  // Check if token needs refresh (expires in next 10 minutes)
  needsRefresh(): boolean {
    if (!this.currentToken) return true;
    
    const tenMinutesFromNow = Date.now() + (10 * 60 * 1000);
    return this.currentToken.expiresAt <= tenMinutesFromNow;
  }

  // Manually trigger token refresh
  async refreshToken(): Promise<string | null> {
    if (!this.refreshFunction) {
      console.warn('No refresh function set for token manager');
      return null;
    }

    try {
      console.log('Refreshing token proactively...');
      const newToken = await this.refreshFunction();
      
      if (newToken) {
        // Parse JWT to get expiration time (basic parsing)
        try {
          const payload = JSON.parse(atob(newToken.split('.')[1]));
          const expiresAt = payload.exp ? payload.exp * 1000 : Date.now() + (3600 * 1000);
          this.currentToken = { token: newToken, expiresAt };
          this.scheduleRefresh();
          console.log('Token refreshed successfully');
        } catch (parseError) {
          // If we can't parse JWT, assume 1 hour expiration
          this.setToken(newToken);
        }
      }

      return newToken;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return null;
    }
  }

  // Schedule automatic token refresh
  private scheduleRefresh() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    if (!this.currentToken) return;

    // Schedule refresh 10 minutes before expiration
    const refreshTime = this.currentToken.expiresAt - (10 * 60 * 1000) - Date.now();
    
    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshToken();
      }, refreshTime);
      
      console.log(`Token refresh scheduled in ${Math.round(refreshTime / 1000 / 60)} minutes`);
    } else {
      // Token expires soon, refresh immediately
      this.refreshToken();
    }
  }

  // Clear all timers and reset state
  clear() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.currentToken = null;
    this.refreshFunction = null;
  }
}

// Export singleton instance
export const tokenManager = new TokenManager();