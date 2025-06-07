/**
 * Session management for healthcare applications with automatic token refresh,
 * idle timeout detection, and graceful logout.
 */

interface SessionConfig {
  /** Token refresh interval in minutes (default: 5) */
  refreshInterval: number;
  /** Session timeout warning in minutes before expiry (default: 5) */
  warningBeforeExpiry: number;
  /** Idle timeout in minutes (default: 30) */
  idleTimeout: number;
  /** Maximum session duration in minutes (default: 480 = 8 hours) */
  maxSessionDuration: number;
}

interface SessionCallbacks {
  onTokenRefreshSuccess?: (newToken: string) => void;
  onTokenRefreshFailed?: () => void;
  onSessionWarning?: (minutesRemaining: number) => void;
  onSessionExpired?: () => void;
  onIdleTimeout?: () => void;
  onForceLogout?: (reason: string) => void;
}

class SessionManager {
  private config: SessionConfig;
  private callbacks: SessionCallbacks;
  private refreshTimer?: NodeJS.Timeout;
  private warningTimer?: NodeJS.Timeout;
  private idleTimer?: NodeJS.Timeout;
  private sessionStartTime: number;
  private lastActivityTime: number;
  private isActive = false;
  private refreshTokenFunction?: () => Promise<string | null>;

  constructor(config: Partial<SessionConfig> = {}, callbacks: SessionCallbacks = {}) {
    this.config = {
      refreshInterval: 5, // Refresh every 5 minutes
      warningBeforeExpiry: 5, // Warn 5 minutes before expiry
      idleTimeout: 30, // 30 minutes idle timeout
      maxSessionDuration: 480, // 8 hours max session
      ...config
    };
    this.callbacks = callbacks;
    this.sessionStartTime = Date.now();
    this.lastActivityTime = Date.now();

    // Bind activity listeners
    this.bindActivityListeners();
  }

  /**
   * Start the session management
   */
  public start(refreshTokenFunction: () => Promise<string | null>) {
    if (this.isActive) {
      console.log('Session manager already active');
      return;
    }

    this.refreshTokenFunction = refreshTokenFunction;
    this.isActive = true;
    this.sessionStartTime = Date.now();
    this.lastActivityTime = Date.now();

    console.log('Starting session management with config:', this.config);

    // Start token refresh cycle
    this.scheduleTokenRefresh();
    
    // Start idle timeout monitoring
    this.resetIdleTimer();

    // Check if we're approaching session limit
    this.scheduleSessionWarning();
  }

  /**
   * Stop session management and cleanup
   */
  public stop() {
    console.log('Stopping session management');
    this.isActive = false;
    this.clearAllTimers();
    this.unbindActivityListeners();
  }

  /**
   * Manually refresh the token
   */
  public async refreshToken(): Promise<boolean> {
    if (!this.refreshTokenFunction) {
      console.error('No refresh token function available');
      return false;
    }

    try {
      console.log('Attempting token refresh...');
      const newToken = await this.refreshTokenFunction();
      
      if (newToken) {
        console.log('Token refreshed successfully');
        this.callbacks.onTokenRefreshSuccess?.(newToken);
        
        // Reset timers after successful refresh
        this.scheduleTokenRefresh();
        return true;
      } else {
        console.warn('Token refresh returned null');
        this.handleTokenRefreshFailure();
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.handleTokenRefreshFailure();
      return false;
    }
  }

  /**
   * Update last activity time (called on user interaction)
   */
  public updateActivity() {
    this.lastActivityTime = Date.now();
    this.resetIdleTimer();
  }

  /**
   * Force logout with reason
   */
  public forceLogout(reason: string) {
    console.log(`Forcing logout: ${reason}`);
    this.stop();
    this.callbacks.onForceLogout?.(reason);
  }

  /**
   * Check if session is still valid
   */
  public isSessionValid(): boolean {
    const now = Date.now();
    const sessionAge = now - this.sessionStartTime;
    const idleTime = now - this.lastActivityTime;

    // Check max session duration
    if (sessionAge > this.config.maxSessionDuration * 60 * 1000) {
      return false;
    }

    // Check idle timeout
    if (idleTime > this.config.idleTimeout * 60 * 1000) {
      return false;
    }

    return true;
  }

  private scheduleTokenRefresh() {
    this.clearRefreshTimer();
    
    if (!this.isActive) return;

    const refreshIntervalMs = this.config.refreshInterval * 60 * 1000;
    console.log(`Scheduling next token refresh in ${this.config.refreshInterval} minutes`);
    
    this.refreshTimer = setTimeout(() => {
      if (this.isActive && this.isSessionValid()) {
        this.refreshToken();
      }
    }, refreshIntervalMs);
  }

  private scheduleSessionWarning() {
    const maxSessionMs = this.config.maxSessionDuration * 60 * 1000;
    const warningMs = this.config.warningBeforeExpiry * 60 * 1000;
    const warningTime = maxSessionMs - warningMs;

    if (warningTime > 0) {
      this.warningTimer = setTimeout(() => {
        if (this.isActive) {
          this.callbacks.onSessionWarning?.(this.config.warningBeforeExpiry);
        }
      }, warningTime);
    }
  }

  private resetIdleTimer() {
    this.clearIdleTimer();
    
    if (!this.isActive) return;

    const idleTimeoutMs = this.config.idleTimeout * 60 * 1000;
    
    this.idleTimer = setTimeout(() => {
      if (this.isActive) {
        console.log('Idle timeout reached');
        this.callbacks.onIdleTimeout?.();
        this.forceLogout('Idle timeout');
      }
    }, idleTimeoutMs);
  }

  private handleTokenRefreshFailure() {
    console.log('Handling token refresh failure');
    this.callbacks.onTokenRefreshFailed?.();
    
    // Stop trying to refresh and force logout
    this.forceLogout('Token refresh failed');
  }

  private bindActivityListeners() {
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, this.handleActivity, { passive: true });
    });
  }

  private unbindActivityListeners() {
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    activityEvents.forEach(event => {
      document.removeEventListener(event, this.handleActivity);
    });
  }

  private handleActivity = () => {
    this.updateActivity();
  };

  private clearAllTimers() {
    this.clearRefreshTimer();
    this.clearIdleTimer();
    this.clearWarningTimer();
  }

  private clearRefreshTimer() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }

  private clearIdleTimer() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = undefined;
    }
  }

  private clearWarningTimer() {
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = undefined;
    }
  }
}

// Healthcare application specific configuration
export const healthcareSessionConfig: SessionConfig = {
  refreshInterval: 5, // Refresh every 5 minutes
  warningBeforeExpiry: 5, // Warn 5 minutes before expiry
  idleTimeout: 30, // 30 minutes idle timeout (HIPAA compliance consideration)
  maxSessionDuration: 480, // 8 hours maximum session
};

export default SessionManager;