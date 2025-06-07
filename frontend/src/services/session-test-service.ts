/**
 * Quick test to verify if sessionid cookie should be set
 */

export class SessionTestService {
  /**
   * Test if we can manually check session creation
   */
  static async testSessionCreation(): Promise<any> {
    console.log('[SessionTestService] Testing session creation...');
    
    try {
      // Make a simple request to a Django endpoint that should create a session
      const response = await fetch('http://localhost:8000/api/v1/auth/msal/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({
          id_token: 'test' // This will fail but should still create a session
        })
      });
      
      // Check response headers for Set-Cookie
      const setCookieHeaders = response.headers.get('set-cookie');
      console.log('[SessionTestService] Set-Cookie headers:', setCookieHeaders);
      
      // Check all response headers
      console.log('[SessionTestService] All response headers:');
      response.headers.forEach((value, key) => {
        console.log(`  ${key}: ${value}`);
      });
      
      return { success: true, headers: Object.fromEntries(response.headers.entries()) };
    } catch (error) {
      console.error('[SessionTestService] Error:', error);
      return { success: false, error };
    }
  }
}
