/**
 * Debug utilities for authentication troubleshooting
 */

import { apiRequest } from './api-request';

export class AuthDebugService {
  /**
   * Test cookie sending behavior with detailed network analysis
   */
  static async testCookieSending(): Promise<any> {
    console.log('[AuthDebugService] Testing cookie sending behavior...');
    
    // Check what cookies are visible to JavaScript
    const jsCookies = this.getCookies();
    console.log('[AuthDebugService] JS-visible cookies:', jsCookies);
    
    // Test with a simple fetch to see raw headers
    console.log('[AuthDebugService] Testing with raw fetch...');
    try {
      const response = await fetch('http://localhost:8000/api/v1/users/me/', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('[AuthDebugService] Fetch response status:', response.status);
      console.log('[AuthDebugService] Fetch response headers:');
      response.headers.forEach((value, key) => {
        console.log(`  ${key}: ${value}`);
      });
      
      const responseData = await response.text();
      console.log('[AuthDebugService] Fetch response body:', responseData);
      
      return {
        success: response.ok,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseData
      };
      
    } catch (error) {
      console.error('[AuthDebugService] Fetch test failed:', error);
      return { success: false, error };
    }
  }

  /**
   * Test the Django session establishment with detailed error reporting
   */
  static async testDjangoSessionEstablishment(msalIdToken: string): Promise<any> {
    console.log('[AuthDebugService] Testing Django session establishment...');
    console.log('[AuthDebugService] MSAL ID Token (first 50 chars):', msalIdToken.substring(0, 50) + '...');
    
    try {
      const response = await apiRequest({
        url: 'auth/msal/login/',
        method: 'post',
        data: { id_token: msalIdToken }
      });
      
      console.log('[AuthDebugService] Session establishment successful!', response);
      return { success: true, data: response };
    } catch (error: any) {
      console.error('[AuthDebugService] Session establishment failed:', error);
      
      // Extract detailed error information
      const errorDetails = {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
      };
      
      console.error('[AuthDebugService] Error details:', errorDetails);
      return { success: false, error: errorDetails };
    }
  }
  
  /**
   * Test current user endpoint (requires existing session)
   */
  static async testCurrentUserEndpoint(): Promise<any> {
    console.log('[AuthDebugService] Testing current user endpoint...');
    console.log('[AuthDebugService] Current cookies:', this.getCookies());
    
    try {
      const response = await apiRequest({
        url: 'users/me/',
        method: 'get'
      });
      
      console.log('[AuthDebugService] Current user fetch successful!', response);
      return { success: true, data: response };
    } catch (error: any) {
      console.error('[AuthDebugService] Current user fetch failed:', error);
      
      const errorDetails = {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        requestUrl: error.config?.url,
        requestHeaders: error.config?.headers,
      };
      
      console.error('[AuthDebugService] Error details:', errorDetails);
      return { success: false, error: errorDetails };
    }
  }
  
  /**
   * Get current browser cookies for debugging
   */
  static getCookies(): Record<string, string> {
    const cookies: Record<string, string> = {};
    document.cookie.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = value;
      }
    });
    return cookies;
  }
  
  /**
   * Log current authentication state
   */
  static logAuthState(): void {
    console.log('[AuthDebugService] Current authentication state:');
    console.log('- Cookies:', this.getCookies());
    console.log('- Local Storage:', Object.fromEntries(
      Object.entries(localStorage).filter(([key]) => key.includes('msal') || key.includes('auth'))
    ));
    console.log('- Session Storage:', Object.fromEntries(
      Object.entries(sessionStorage).filter(([key]) => key.includes('msal') || key.includes('auth'))
    ));
  }
}
