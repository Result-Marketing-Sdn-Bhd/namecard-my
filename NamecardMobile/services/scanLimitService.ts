/**
 * Scan Limit Service for WhatsCard
 *
 * Handles daily scan limit tracking and enforcement
 */

import { getSupabaseClient } from './supabaseClient';

export interface ScanLimitInfo {
  canScan: boolean;
  scansRemaining: number;
  dailyLimit: number;
  limitReached: boolean;
}

export interface ScanUsageStats {
  dailyScanCount: number;
  totalScans: number;
  lastScanDate: string;
  tier: string;
}

export interface IncrementResult {
  dailyCount: number;
  limitReached: boolean;
}

class ScanLimitService {
  /**
   * Check if user can perform a scan
   * @param userId - User ID to check
   * @returns Scan limit information
   */
  async canUserScan(userId: string): Promise<ScanLimitInfo> {
    try {
      console.log('[ScanLimit] Checking if user can scan:', userId);

      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc('can_user_scan', {
        user_id_param: userId,
      });

      if (error || !data || data.length === 0) {
        // Silent fallback - allow scanning if API fails (offline-first)
        console.log('[ScanLimit] API unavailable, allowing scan (offline mode)');
        return {
          canScan: true,
          scansRemaining: 10,
          dailyLimit: 10,
          limitReached: false,
        };
      }

      const result = data[0];
      const info: ScanLimitInfo = {
        canScan: result.can_scan,
        scansRemaining: result.scans_remaining,
        dailyLimit: result.daily_limit,
        limitReached: !result.can_scan,
      };

      console.log('[ScanLimit] Scan check result:', info);
      return info;
    } catch (err) {
      console.error('[ScanLimit] Error:', err);
      return {
        canScan: false,
        scansRemaining: 0,
        dailyLimit: 0,
        limitReached: true,
      };
    }
  }

  /**
   * Increment user's scan count
   * @param userId - User ID
   * @returns Updated count and limit status
   */
  async incrementScanCount(userId: string): Promise<IncrementResult> {
    try {
      console.log('[ScanLimit] Incrementing scan count for:', userId);

      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc('increment_scan_count', {
        user_id_param: userId,
      });

      if (error) {
        // Silent fallback - don't block user experience
        console.log('[ScanLimit] Count increment skipped (offline mode)');
        return {
          dailyCount: 0,
          limitReached: false,
        };
      }

      const result = data[0];
      console.log('[ScanLimit] Scan count incremented:', result);

      return {
        dailyCount: result.daily_count,
        limitReached: result.limit_reached,
      };
    } catch (err) {
      // Silent catch - don't block user experience
      console.log('[ScanLimit] Count increment failed silently');
      return {
        dailyCount: 0,
        limitReached: false,
      };
    }
  }

  /**
   * Get user's daily scan limit based on tier
   * @param userId - User ID
   * @returns Daily scan limit
   */
  async getDailyLimit(userId: string): Promise<number> {
    try {
      const supabase = getSupabaseClient();
      // Get user tier
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('tier')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        console.error('[ScanLimit] Error fetching user tier:', userError);
        return 5; // Default to free tier limit
      }

      // Get appropriate limit based on tier
      const settingKey = user.tier === 'enterprise'
        ? 'enterprise_daily_scan_limit'
        : user.tier === 'pro'
        ? 'pro_daily_scan_limit'
        : 'free_daily_scan_limit';

      const { data: setting, error: settingError } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', settingKey);

      if (settingError || !setting || setting.length === 0) {
        console.error('[ScanLimit] Error fetching limit setting:', settingError);
        return 5; // Default to free tier limit
      }

      return parseInt(setting[0].value, 10);
    } catch (err) {
      console.error('[ScanLimit] Error getting daily limit:', err);
      return 5; // Default to free tier limit
    }
  }

  /**
   * Get scan usage statistics for user
   * @param userId - User ID
   * @returns Usage statistics
   */
  async getScanUsageStats(userId: string): Promise<ScanUsageStats> {
    try {
      const supabase = getSupabaseClient();
      const { data: user, error } = await supabase
        .from('users')
        .select('daily_scan_count, total_scans, last_scan_date, tier')
        .eq('id', userId)
        .single();

      if (error || !user) {
        console.error('[ScanLimit] Error fetching usage stats:', error);
        return {
          dailyScanCount: 0,
          totalScans: 0,
          lastScanDate: new Date().toISOString().split('T')[0],
          tier: 'free',
        };
      }

      return {
        dailyScanCount: user.daily_scan_count || 0,
        totalScans: user.total_scans || 0,
        lastScanDate: user.last_scan_date || new Date().toISOString().split('T')[0],
        tier: user.tier || 'free',
      };
    } catch (err) {
      console.error('[ScanLimit] Error:', err);
      return {
        dailyScanCount: 0,
        totalScans: 0,
        lastScanDate: new Date().toISOString().split('T')[0],
        tier: 'free',
      };
    }
  }

  /**
   * Check if user has reached daily limit and show paywall if needed
   * @param userId - User ID
   * @returns true if limit reached and paywall should be shown
   */
  async shouldShowPaywallForLimit(userId: string): Promise<boolean> {
    const limitInfo = await this.canUserScan(userId);
    return limitInfo.limitReached;
  }
}

export const scanLimitService = new ScanLimitService();

console.log('[scanLimitService] ✅ Service initialized');
