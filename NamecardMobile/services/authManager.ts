import * as SecureStore from 'expo-secure-store';
import { SupabaseService } from './supabase';
import { getSupabaseClient } from './supabaseClient';

/**
 * SECURITY FIX: Replaced AsyncStorage with SecureStore for JWT tokens
 *
 * SecureStore uses the device's secure keychain/keystore to encrypt
 * sensitive data like authentication tokens, preventing unauthorized access.
 *
 * - iOS: Uses Keychain Services
 * - Android: Uses Keystore system
 */

interface AuthSession {
  user: any;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export class AuthManager {
  private static SESSION_KEY = 'auth_session';
  private static sessionCache: AuthSession | null = null;

  /**
   * Verify and refresh session if needed
   */
  static async verifySession(): Promise<{ user: any; error: any }> {
    try {
      const client = getSupabaseClient();

      // First, try to get the current session
      const { data: { session }, error: sessionError } = await client.auth.getSession();

      if (sessionError) {
        console.error('Session error:', sessionError);
        return { user: null, error: sessionError };
      }

      if (!session) {
        // Try to restore from AsyncStorage
        const storedSession = await this.getStoredSession();
        if (storedSession) {
          // Attempt to restore the session
          const { data, error } = await client.auth.setSession({
            access_token: storedSession.accessToken,
            refresh_token: storedSession.refreshToken,
          });

          if (!error && data.session) {
            await this.storeSession(data.session);
            return { user: data.user, error: null };
          }
        }

        return { user: null, error: { message: 'No active session. Please sign in.' } };
      }

      // Check if session needs refresh (expires in less than 60 seconds)
      const expiresAt = new Date(session.expires_at || 0).getTime();
      const now = Date.now();
      const needsRefresh = expiresAt - now < 60000; // Less than 1 minute

      if (needsRefresh) {
        console.log('⏳ Session expiring soon, refreshing...');
        try {
          const { data, error } = await client.auth.refreshSession();
          if (!error && data.session) {
            await this.storeSession(data.session);
            console.log('✅ Session refreshed successfully');
            return { user: data.user, error: null };
          } else {
            // Refresh failed - log the error but don't crash
            // The session will continue to work until it fully expires
            console.warn('⚠️ Session refresh failed (will use existing session):', error?.message || 'Unknown error');
            // Return the existing session instead of erroring out
            await this.storeSession(session);
            return { user: session.user, error: null };
          }
        } catch (refreshError: any) {
          // Catch any exceptions during refresh
          console.warn('⚠️ Session refresh exception (will use existing session):', refreshError?.message || 'Unknown error');
          // Return the existing session
          await this.storeSession(session);
          return { user: session.user, error: null };
        }
      }

      // Session is valid
      await this.storeSession(session);
      return { user: session.user, error: null };

    } catch (error) {
      console.error('Session verification failed:', error);
      return { user: null, error };
    }
  }

  /**
   * Store session in SecureStore for persistence
   *
   * SECURITY: Uses platform-specific secure storage (Keychain/Keystore)
   * to encrypt JWT tokens and prevent unauthorized access
   */
  static async storeSession(session: any): Promise<void> {
    try {
      if (!session) return;

      const authSession: AuthSession = {
        user: session.user,
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: new Date(session.expires_at || 0).getTime(),
      };

      this.sessionCache = authSession;

      // Use SecureStore instead of AsyncStorage for JWT tokens
      await SecureStore.setItemAsync(
        this.SESSION_KEY,
        JSON.stringify(authSession)
      );

      console.log('🔒 Session securely stored in device keychain');
    } catch (error) {
      console.error('❌ Failed to store session:', error);
    }
  }

  /**
   * Get stored session from SecureStore
   *
   * SECURITY: Retrieves securely stored JWT tokens from device keychain
   */
  static async getStoredSession(): Promise<AuthSession | null> {
    try {
      // Check cache first
      if (this.sessionCache) {
        return this.sessionCache;
      }

      // Retrieve from SecureStore instead of AsyncStorage
      const stored = await SecureStore.getItemAsync(this.SESSION_KEY);
      if (stored) {
        const session = JSON.parse(stored) as AuthSession;
        this.sessionCache = session;
        console.log('🔒 Session retrieved from secure storage');
        return session;
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to get stored session:', error);
      return null;
    }
  }

  /**
   * Clear stored session from SecureStore
   *
   * SECURITY: Removes JWT tokens from secure storage on logout
   */
  static async clearSession(): Promise<void> {
    try {
      this.sessionCache = null;

      // Remove from SecureStore instead of AsyncStorage
      await SecureStore.deleteItemAsync(this.SESSION_KEY);

      console.log('🔒 Session removed from secure storage');
    } catch (error) {
      console.error('❌ Failed to clear session:', error);
    }
  }

  /**
   * Restore session from storage and verify it's still valid
   */
  static async restoreSession(): Promise<any> {
    try {
      // Get stored session
      const storedSession = await this.getStoredSession();

      if (!storedSession) {
        return null;
      }

      // Check if session is expired
      const now = Date.now();
      if (storedSession.expiresAt && storedSession.expiresAt < now) {
        // Session expired, try to refresh with refresh token
        const client = SupabaseService.getClient();
        if (!client) return null;

        const { data, error } = await client.auth.refreshSession({
          refresh_token: storedSession.refreshToken
        });

        if (error || !data.session) {
          console.log('Failed to refresh expired session:', error);
          await this.clearSession();
          return null;
        }

        // Store the new session
        await this.storeSession(data.session);
        return data.session;
      }

      // Session still valid, return it
      return {
        user: storedSession.user,
        access_token: storedSession.accessToken,
        refresh_token: storedSession.refreshToken,
        expires_at: storedSession.expiresAt
      };
    } catch (error) {
      console.error('Failed to restore session:', error);
      return null;
    }
  }

  /**
   * Wrapper to execute operations with verified session
   */
  static async withVerifiedSession<T>(
    operation: (userId: string) => Promise<T>,
    retries: number = 3
  ): Promise<T> {
    let lastError: any = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Verify session before operation
        const { user, error } = await this.verifySession();

        if (error || !user) {
          throw new Error(error?.message || 'Authentication required');
        }

        // Execute the operation
        return await operation(user.id);

      } catch (error: any) {
        lastError = error;

        // If it's an auth error and we have retries left, refresh session
        if (attempt < retries &&
            (error.message?.includes('JWT') ||
             error.message?.includes('token') ||
             error.message?.includes('expired') ||
             error.message?.includes('row-level security'))) {
          console.log(`🔄 Attempt ${attempt}/${retries} - Session expired, refreshing...`);

          // Wait with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));

          // Try to refresh the session
          const client = getSupabaseClient();
          const { data, error: refreshError } = await client.auth.refreshSession();

          if (!refreshError && data.session) {
            await this.storeSession(data.session);
            continue; // Retry the operation
          }
        }

        // If it's not an auth error or we're out of retries, throw
        if (attempt === retries) {
          console.error(`❌ Operation failed after ${retries} attempts:`, error.message);
          throw lastError;
        }
      }
    }

    throw lastError;
  }

  private static ignoreAuthEvents = false; // Flag to ignore auth events during operations
  private static lastEventTime = 0; // Track last event time

  /**
   * Temporarily ignore auth events (used during session refresh operations)
   */
  static ignoreAuthEventsTemporarily(durationMs: number = 5000): void {
    this.ignoreAuthEvents = true;
    console.log('🔇 Ignoring auth events for', durationMs, 'ms');
    setTimeout(() => {
      this.ignoreAuthEvents = false;
      console.log('🔊 Auth events listening resumed');
    }, durationMs);
  }

  /**
   * Setup auth state change listener
   */
  static setupAuthListener(onAuthChange: (user: any) => void): () => void {
    const client = getSupabaseClient();

    const { data: subscription } = client.auth.onAuthStateChange(async (event: string, session: any) => {
      // Ignore events if flag is set (during background sync operations)
      if (this.ignoreAuthEvents) {
        console.log('🔇 Ignoring auth event:', event, '(operations in progress)');
        return;
      }

      // Debounce rapid-fire events (ignore events within 500ms of each other)
      const now = Date.now();
      if (now - this.lastEventTime < 500 && event === 'SIGNED_OUT') {
        console.log('⏭️ Debouncing rapid SIGNED_OUT event');
        return;
      }
      this.lastEventTime = now;

      console.log('🔔 Auth event:', event, 'Session:', session ? 'present' : 'null');

      if (event === 'SIGNED_IN') {
        if (session) {
          await this.storeSession(session);
          onAuthChange(session.user);
          console.log('✅ User signed in');
        }
      } else if (event === 'TOKEN_REFRESHED') {
        // Silent token refresh - don't trigger UI changes
        if (session) {
          await this.storeSession(session);
          console.log('🔄 Token refreshed silently');
          // Don't call onAuthChange to avoid logout/login flash
        }
      } else if (event === 'SIGNED_OUT') {
        // User explicitly signed out
        await this.clearSession();
        onAuthChange(null);
        console.log('📤 User signed out');
      }
    });

    // Return unsubscribe function
    return () => {
      subscription?.subscription?.unsubscribe();
    };
  }
}