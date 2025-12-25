import * as Updates from 'expo-updates';

/**
 * Auto-Update Service
 * Handles automatic checking and downloading of OTA updates
 * Runs silently in the background without user interaction
 */
export class AutoUpdateService {
  private static updateCheckInterval: NodeJS.Timeout | null = null;
  private static isChecking = false;

  /**
   * Initialize auto-update service
   * Checks for updates on app start and sets up periodic checks
   */
  static async initialize() {
    // Only run in production builds (not in development)
    if (__DEV__) {
      console.log('[AutoUpdate] Skipping auto-update in development mode');
      return;
    }

    console.log('[AutoUpdate] 🚀 Initializing auto-update service...');

    // Check for updates silently (don't auto-reload to avoid infinite loop)
    await this.checkAndDownloadUpdates();

    // Set up periodic checks every 30 minutes
    this.startPeriodicChecks(30 * 60 * 1000); // 30 minutes in milliseconds
  }

  /**
   * Force reload the latest update immediately
   * This ensures the app always runs the newest code on startup
   */
  static async forceReloadLatestUpdate() {
    try {
      console.log('[AutoUpdate] 🔄 Checking for updates...');

      // Check if there's actually a new update available
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        console.log('[AutoUpdate] ✅ New update available! Downloading and reloading...');

        // Fetch the latest update
        await Updates.fetchUpdateAsync();

        console.log('[AutoUpdate] ✅ Latest update fetched! Reloading app now...');

        // Reload the app to apply the update immediately
        await Updates.reloadAsync();
      } else {
        console.log('[AutoUpdate] ✅ App is already up to date');
      }
    } catch (error) {
      console.warn('[AutoUpdate] ⚠️ Update check failed (this is normal if offline):', error);
    }
  }

  /**
   * Check for updates and download silently in background
   * Does not prompt user or reload the app
   *
   * NOTE: We fetch and reload directly without checking first because
   * Updates.checkForUpdateAsync() is unreliable and often returns false negatives
   */
  static async checkAndDownloadUpdates() {
    if (this.isChecking) {
      console.log('[AutoUpdate] Update check already in progress, skipping...');
      return;
    }

    try {
      this.isChecking = true;
      console.log('[AutoUpdate] 🔍 Fetching latest update...');

      // IMPORTANT: Don't use checkForUpdateAsync() - it's unreliable!
      // Just fetch and reload directly. If no update exists, this is a no-op.
      try {
        await Updates.fetchUpdateAsync();
        console.log('[AutoUpdate] 📥 Update fetched! Will apply on next app restart.');
      } catch (fetchError: any) {
        // If error is "No updates available", that's fine - app is up to date
        if (fetchError.message?.includes('No updates available') ||
            fetchError.code === 'ERR_UPDATES_DISABLED') {
          console.log('[AutoUpdate] ✅ App is up to date');
        } else {
          throw fetchError;
        }
      }
    } catch (error) {
      // Silently handle errors - don't bother the user
      console.warn('[AutoUpdate] ⚠️ Update fetch failed (this is normal if offline):', error);
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Start periodic update checks
   * @param intervalMs Check interval in milliseconds (default: 30 minutes)
   */
  static startPeriodicChecks(intervalMs: number = 30 * 60 * 1000) {
    // Clear any existing interval
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
    }

    console.log(`[AutoUpdate] ⏰ Starting periodic checks every ${intervalMs / 60000} minutes`);

    // Set up new interval
    this.updateCheckInterval = setInterval(() => {
      this.checkAndDownloadUpdates();
    }, intervalMs);
  }

  /**
   * Stop periodic update checks
   */
  static stopPeriodicChecks() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
      console.log('[AutoUpdate] ⏸️ Stopped periodic update checks');
    }
  }

  /**
   * Get current update info
   * Useful for debugging
   */
  static getUpdateInfo() {
    return {
      updateId: Updates.updateId,
      createdAt: Updates.createdAt,
      channel: Updates.channel,
      runtimeVersion: Updates.runtimeVersion,
      isEmbeddedLaunch: Updates.isEmbeddedLaunch,
      isEmergencyLaunch: Updates.isEmergencyLaunch,
    };
  }
}
