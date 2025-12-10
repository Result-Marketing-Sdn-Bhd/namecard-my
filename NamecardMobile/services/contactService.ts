import { Contact } from '../types';
import { LocalStorage } from './localStorage';
import { SupabaseService } from './supabase';
import { AuthManager } from './authManager';
import { validateContact } from '../utils/validation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

/**
 * Unified contact service that prioritizes local storage
 * and syncs with Supabase in the background
 */
export class ContactService {
  private static isOnline = true;
  private static hasAuth = false;
  private static isSyncing = false; // Mutex lock to prevent concurrent syncs

  /**
   * Initialize the contact service
   */
  static async init(): Promise<void> {
    // Initialize local storage
    await LocalStorage.init();

    // Check if we have a valid session (non-blocking)
    this.checkAuthStatus();
  }

  /**
   * Check authentication status and restore session (non-blocking)
   */
  private static async checkAuthStatus(): Promise<void> {
    try {
      // First try to restore any existing session
      const session = await AuthManager.restoreSession();

      if (session && session.user) {
        this.hasAuth = true;
        console.log('✅ Session restored for:', session.user.email);

        // Process any pending sync items
        console.log('🔄 Processing pending sync queue...');
        await this.processSyncQueue();
      } else {
        // No stored session, check if user is logged in
        const user = await SupabaseService.getCurrentUser();
        this.hasAuth = !!user;

        if (this.hasAuth) {
          console.log('📱 Auth status: Authenticated');
          // Process sync queue if authenticated
          await this.processSyncQueue();
        } else {
          console.log('📱 Running in offline/guest mode');
        }
      }
    } catch (error) {
      this.hasAuth = false;
      console.log('📱 Running in offline/guest mode:', error);
    }
  }

  /**
   * Create a new contact (offline-first)
   */
  static async createContact(contactData: Partial<Contact>): Promise<Contact> {
    // Step 0: Validate input data
    try {
      await validateContact(contactData);
    } catch (error) {
      console.error('❌ Contact validation failed:', error);
      throw error;
    }

    // Step 1: Save front image locally if provided
    let localImageUrl = contactData.imageUrl;
    if (localImageUrl && !localImageUrl.startsWith('file://')) {
      try {
        localImageUrl = await LocalStorage.saveImage(localImageUrl);
      } catch (error) {
        console.warn('Failed to save front image locally, using original:', error);
      }
    }

    // Step 2: Save back image locally if provided
    let localBackImageUrl = contactData.backImageUrl;
    if (localBackImageUrl && !localBackImageUrl.startsWith('file://')) {
      try {
        localBackImageUrl = await LocalStorage.saveImage(localBackImageUrl);
      } catch (error) {
        console.warn('Failed to save back image locally, using original:', error);
      }
    }

    // Step 3: Save contact locally (always succeeds)
    const localContact = await LocalStorage.saveContact({
      ...contactData,
      imageUrl: localImageUrl,
      backImageUrl: localBackImageUrl
    });

    // Step 3: Queue for sync if authenticated (non-blocking)
    if (this.hasAuth) {
      this.queueSync('create', localContact);
    }

    return localContact;
  }

  /**
   * Get all contacts (offline-first)
   */
  static async getContacts(): Promise<Contact[]> {
    // Always return local contacts immediately
    const contacts = await LocalStorage.getContacts();

    // Trigger background sync if authenticated (non-blocking)
    if (this.hasAuth) {
      this.syncInBackground();
    }

    return contacts;
  }

  /**
   * Update a contact (offline-first)
   */
  static async updateContact(id: string, updates: Partial<Contact>): Promise<Contact> {
    // Validate update data if it contains key fields
    if (updates.name || updates.email || updates.phone) {
      try {
        await validateContact({ ...updates, name: updates.name || 'temp' });
      } catch (error) {
        console.error('❌ Contact update validation failed:', error);
        throw error;
      }
    }

    // Save updated front image if provided and not already local
    if (updates.imageUrl && !updates.imageUrl.startsWith('file://')) {
      try {
        updates.imageUrl = await LocalStorage.saveImage(updates.imageUrl);
      } catch (error) {
        console.warn('Failed to save updated front image locally:', error);
      }
    }

    // Save updated back image if provided and not already local
    if (updates.backImageUrl && !updates.backImageUrl.startsWith('file://')) {
      try {
        updates.backImageUrl = await LocalStorage.saveImage(updates.backImageUrl);
      } catch (error) {
        console.warn('Failed to save updated back image locally:', error);
      }
    }

    // Update locally first
    const updatedContact = await LocalStorage.updateContact(id, updates);

    // Queue for sync if authenticated
    if (this.hasAuth) {
      this.queueSync('update', updatedContact);
    }

    return updatedContact;
  }

  /**
   * Delete a contact (offline-first)
   */
  static async deleteContact(id: string): Promise<void> {
    // Get the contact first to access image URLs
    const contacts = await LocalStorage.getContacts();
    const contact = contacts.find(c => c.id === id);

    if (contact) {
      // Delete associated images if they exist
      if (contact.imageUrl && contact.imageUrl.startsWith('file://')) {
        try {
          await LocalStorage.deleteImage(contact.imageUrl);
          console.log('🗑️ Deleted front image:', contact.imageUrl);
        } catch (error) {
          console.warn('Failed to delete front image:', error);
        }
      }

      if (contact.backImageUrl && contact.backImageUrl.startsWith('file://')) {
        try {
          await LocalStorage.deleteImage(contact.backImageUrl);
          console.log('🗑️ Deleted back image:', contact.backImageUrl);
        } catch (error) {
          console.warn('Failed to delete back image:', error);
        }
      }
    }

    // Delete contact from local storage
    await LocalStorage.deleteContact(id);

    // Queue for sync if authenticated
    if (this.hasAuth) {
      this.queueSync('delete', { id });
    }
  }

  /**
   * Search contacts (local only)
   */
  static async searchContacts(query: string): Promise<Contact[]> {
    return LocalStorage.searchContacts(query);
  }

  /**
   * Queue an operation for sync
   */
  private static async queueSync(action: 'create' | 'update' | 'delete', data: any): Promise<void> {
    try {
      await LocalStorage.addToSyncQueue({
        action,
        data,
        timestamp: Date.now()
      });

      // Ignore auth events for 5 seconds to prevent logout/login flash during sync
      AuthManager.ignoreAuthEventsTemporarily(5000);

      // Delay sync by 3 seconds to avoid triggering session refresh during UI operations
      // This provides true offline-first behavior - save instantly, sync later
      setTimeout(() => {
        this.processSyncQueue();
      }, 3000);
    } catch (error) {
      console.log('Failed to queue sync operation:', error);
      // Non-fatal - local operation already succeeded
    }
  }

  /**
   * Process sync queue in background
   *
   * SECURITY FIX: Added mutex lock to prevent race conditions
   * and properly increment retry counters to avoid infinite retries
   */
  private static async processSyncQueue(): Promise<void> {
    // Check auth and online status
    if (!this.hasAuth || !this.isOnline) {
      console.log('⏸️ Skipping sync (offline or not authenticated)');
      return;
    }

    // Mutex lock: prevent concurrent sync operations (RACE CONDITION FIX)
    if (this.isSyncing) {
      console.log('⏸️ Sync already in progress, skipping...');
      return;
    }

    this.isSyncing = true;

    try {
      const queue = await LocalStorage.getSyncQueue();
      console.log(`📤 Processing ${queue.length} sync items`);

      for (const item of queue) {
        try {
          await this.syncItem(item);

          // Remove from queue on success
          await LocalStorage.removeFromSyncQueue(item.id);
          console.log(`✅ Successfully synced item ${item.id}`);

        } catch (error) {
          console.log(`❌ Failed to sync item ${item.id}:`, error);

          // Increment retry counter (BUG FIX: was never incremented before)
          const currentRetries = item.retries || 0;
          const newRetries = currentRetries + 1;

          if (newRetries > 5) {
            // Too many retries, remove from queue to prevent infinite loop
            console.log(`🗑️ Removing item ${item.id} after ${newRetries} failed attempts`);
            await LocalStorage.removeFromSyncQueue(item.id);
          } else {
            // Update retry counter in queue
            await LocalStorage.updateSyncQueueItem(item.id, {
              ...item,
              retries: newRetries
            });
            console.log(`🔄 Will retry item ${item.id} (attempt ${newRetries}/5)`);
          }
        }
      }
    } catch (error) {
      console.log('❌ Sync queue processing failed:', error);
    } finally {
      // Release mutex lock
      this.isSyncing = false;
    }
  }

  /**
   * Sync a single item to Supabase
   */
  private static async syncItem(item: any): Promise<void> {
    const isLocalId = (id: string) => id.startsWith('local_');

    switch (item.action) {
      case 'create':
        // Upload front image to Supabase if it's local
        let remoteImageUrl = item.data.imageUrl;
        if (remoteImageUrl && remoteImageUrl.includes(FileSystem.documentDirectory)) {
          try {
            remoteImageUrl = await SupabaseService.uploadCardImage(
              remoteImageUrl,
              item.data.id + '_front'
            );
          } catch {
            // Keep local URL if upload fails
          }
        }

        // Upload back image to Supabase if it's local
        let remoteBackImageUrl = item.data.backImageUrl;
        if (remoteBackImageUrl && remoteBackImageUrl.includes(FileSystem.documentDirectory)) {
          try {
            remoteBackImageUrl = await SupabaseService.uploadCardImage(
              remoteBackImageUrl,
              item.data.id + '_back'
            );
          } catch {
            // Keep local URL if upload fails
          }
        }

        const newContact = await SupabaseService.createContact({
          ...item.data,
          imageUrl: remoteImageUrl,
          backImageUrl: remoteBackImageUrl
        });

        // Update local storage with server-generated ID if it was a local ID
        if (isLocalId(item.data.id)) {
          await this.replaceLocalIdWithServerId(item.data.id, newContact.id);
        }
        break;

      case 'update':
        // If updating a contact with a local ID, treat it as a create instead
        if (isLocalId(item.data.id)) {
          console.log(`📝 Converting update to create for local ID: ${item.data.id}`);

          // Upload front image if local
          let updateImageUrl = item.data.imageUrl;
          if (updateImageUrl && updateImageUrl.includes(FileSystem.documentDirectory)) {
            try {
              updateImageUrl = await SupabaseService.uploadCardImage(
                updateImageUrl,
                item.data.id + '_front'
              );
            } catch {
              // Keep local URL if upload fails
            }
          }

          // Upload back image if local
          let updateBackImageUrl = item.data.backImageUrl;
          if (updateBackImageUrl && updateBackImageUrl.includes(FileSystem.documentDirectory)) {
            try {
              updateBackImageUrl = await SupabaseService.uploadCardImage(
                updateBackImageUrl,
                item.data.id + '_back'
              );
            } catch {
              // Keep local URL if upload fails
            }
          }

          const createdContact = await SupabaseService.createContact({
            ...item.data,
            imageUrl: updateImageUrl,
            backImageUrl: updateBackImageUrl
          });

          // Replace local ID with server ID
          await this.replaceLocalIdWithServerId(item.data.id, createdContact.id);
        } else {
          // Regular update for contacts with valid UUIDs
          await SupabaseService.updateContact(item.data.id, item.data);
        }
        break;

      case 'delete':
        // Skip delete if it's a local ID (contact never made it to server)
        if (isLocalId(item.data.id)) {
          console.log(`⏩ Skipping delete for local ID: ${item.data.id}`);
          return;
        }
        await SupabaseService.deleteContact(item.data.id);
        break;
    }
  }

  /**
   * Replace local ID with server-generated ID in local storage
   */
  private static async replaceLocalIdWithServerId(localId: string, serverId: string): Promise<void> {
    try {
      const contacts = await LocalStorage.getContacts();
      const updatedContacts = contacts.map(contact =>
        contact.id === localId ? { ...contact, id: serverId } : contact
      );

      // Save updated contacts
      await LocalStorage.init();
      const CONTACTS_KEY = '@namecard/contacts';
      await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(updatedContacts));

      console.log(`✅ Replaced local ID ${localId} with server ID ${serverId}`);
    } catch (error) {
      console.error('Failed to replace local ID:', error);
    }
  }

  /**
   * Sync contacts in background (non-blocking)
   */
  private static async syncInBackground(): Promise<void> {
    // Run sync in background without blocking UI
    setTimeout(async () => {
      try {
        await this.processSyncQueue();
      } catch (error) {
        console.log('Background sync failed:', error);
      }
    }, 1000);
  }

  /**
   * Force sync all contacts (for manual sync button)
   */
  static async forceSyncAll(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.hasAuth) {
        return { success: false, message: 'Please sign in to sync' };
      }

      // Get all local contacts
      const localContacts = await LocalStorage.getContacts();

      // Get all remote contacts
      const remoteContacts = await SupabaseService.getContacts();

      // Merge logic (local takes precedence)
      // This is simplified - real implementation needs conflict resolution
      for (const localContact of localContacts) {
        const exists = remoteContacts.find(r => r.id === localContact.id);
        if (!exists) {
          await this.queueSync('create', localContact);
        }
      }

      await this.processSyncQueue();

      return { success: true, message: 'Sync completed' };
    } catch (error) {
      console.error('Force sync failed:', error);
      return { success: false, message: 'Sync failed' };
    }
  }

  /**
   * Get sync status
   */
  static async getSyncStatus(): Promise<{
    isAuthenticated: boolean;
    isOnline: boolean;
    pendingSyncCount: number;
  }> {
    const queue = await LocalStorage.getSyncQueue();
    return {
      isAuthenticated: this.hasAuth,
      isOnline: this.isOnline,
      pendingSyncCount: queue.length
    };
  }

  /**
   * Sign in and enable sync
   */
  static async enableSync(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { user, error } = await SupabaseService.signIn(email, password);
      if (error) {
        return { success: false, error: error.message };
      }

      this.hasAuth = true;
      await this.forceSyncAll();

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Sign out and disable sync
   */
  static async disableSync(): Promise<void> {
    this.hasAuth = false;
    await SupabaseService.signOut();
  }

  /**
   * Add contacts to a group
   */
  static async addContactsToGroup(contactIds: string[], groupId: string): Promise<void> {
    try {
      const contacts = await LocalStorage.getContacts();

      // Update each contact to include the groupId
      for (const contactId of contactIds) {
        const contact = contacts.find(c => c.id === contactId);
        if (contact) {
          const currentGroupIds = contact.groupIds || [];

          // Only add if not already in the group
          if (!currentGroupIds.includes(groupId)) {
            const updatedGroupIds = [...currentGroupIds, groupId];
            await this.updateContact(contactId, { groupIds: updatedGroupIds });
          }
        }
      }

      console.log(`✅ Added ${contactIds.length} contacts to group ${groupId}`);
    } catch (error) {
      console.error('❌ Failed to add contacts to group:', error);
      throw new Error('Failed to add contacts to group');
    }
  }

  /**
   * Remove contacts from a group
   */
  static async removeContactsFromGroup(contactIds: string[], groupId: string): Promise<void> {
    try {
      const contacts = await LocalStorage.getContacts();

      // Update each contact to remove the groupId
      for (const contactId of contactIds) {
        const contact = contacts.find(c => c.id === contactId);
        if (contact && contact.groupIds) {
          const updatedGroupIds = contact.groupIds.filter(id => id !== groupId);
          await this.updateContact(contactId, { groupIds: updatedGroupIds });
        }
      }

      console.log(`✅ Removed ${contactIds.length} contacts from group ${groupId}`);
    } catch (error) {
      console.error('❌ Failed to remove contacts from group:', error);
      throw new Error('Failed to remove contacts from group');
    }
  }

  /**
   * Get contacts by group ID
   */
  static async getContactsByGroup(groupId: string): Promise<Contact[]> {
    try {
      const contacts = await LocalStorage.getContacts();
      return contacts.filter(contact => contact.groupIds?.includes(groupId));
    } catch (error) {
      console.error('❌ Failed to get contacts by group:', error);
      return [];
    }
  }
}