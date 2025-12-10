import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Contact } from '../types';

const CONTACTS_KEY = '@namecard/contacts';
const SYNC_QUEUE_KEY = '@namecard/sync_queue';
const IMAGES_DIR = `${FileSystem.documentDirectory}business_cards/`;

export interface SyncQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retries: number;
}

export class LocalStorage {
  /**
   * Initialize local storage and create necessary directories
   */
  static async init(): Promise<void> {
    try {
      // Ensure images directory exists
      const dirInfo = await FileSystem.getInfoAsync(IMAGES_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
        console.log('📁 Created local images directory');
      }

      // Initialize empty contacts array if not exists
      const contacts = await AsyncStorage.getItem(CONTACTS_KEY);
      if (!contacts) {
        await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify([]));
        console.log('📱 Initialized local contacts storage');
      }
    } catch (error) {
      console.error('Failed to initialize local storage:', error);
      // Non-fatal - app continues to work
    }
  }

  /**
   * Save contact locally with generated ID
   */
  static async saveContact(contact: Partial<Contact>): Promise<Contact> {
    try {
      const contacts = await this.getContacts();

      // Generate local ID using UUID to prevent collisions
      const newContact: Contact = {
        id: contact.id || `local_${uuidv4()}`,
        name: contact.name || '',
        company: contact.company || '',
        phone: contact.phone || '',
        email: contact.email || '',
        address: contact.address || '',
        imageUrl: contact.imageUrl || '',
        addedDate: contact.addedDate || new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        jobTitle: contact.jobTitle,
        lastContact: contact.lastContact,
        phones: contact.phones,
      };

      contacts.push(newContact);
      await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));

      console.log('✅ Contact saved locally:', newContact.id);
      return newContact;
    } catch (error) {
      console.error('Failed to save contact locally:', error);
      throw new Error('Failed to save contact');
    }
  }

  /**
   * Get all contacts from local storage
   */
  static async getContacts(): Promise<Contact[]> {
    try {
      const contactsJson = await AsyncStorage.getItem(CONTACTS_KEY);
      if (!contactsJson) return [];

      const contacts = JSON.parse(contactsJson);
      return Array.isArray(contacts) ? contacts : [];
    } catch (error) {
      console.error('Failed to get contacts:', error);
      return []; // Always return array to prevent crashes
    }
  }

  /**
   * Update a contact locally
   *
   * RACE CONDITION FIX: If a local ID is not found (because it was replaced
   * by server ID during sync), try to find the contact by matching imageUrl
   * or create a new contact with the updates
   */
  static async updateContact(id: string, updates: Partial<Contact>): Promise<Contact> {
    try {
      const contacts = await this.getContacts();
      let index = contacts.findIndex(c => c.id === id);

      // RACE CONDITION FIX: If local ID not found, try to match by imageUrl
      if (index === -1 && id.startsWith('local_')) {
        console.log(`⚠️ Local ID ${id} not found (may have been replaced by server ID during sync)`);

        // Strategy 1: Match by imageUrl (most reliable since it doesn't change during edits)
        if (updates.imageUrl) {
          const matchingContact = contacts.find(c => c.imageUrl === updates.imageUrl);
          if (matchingContact) {
            index = contacts.findIndex(c => c.id === matchingContact.id);
            console.log(`✅ Found contact by imageUrl, using server ID: ${matchingContact.id}`);
          }
        }

        // Strategy 2: If still not found, find the most recently created contact
        // (likely the one that just got synced and had its ID replaced)
        if (index === -1 && contacts.length > 0) {
          // Sort by created_at or addedDate and get the most recent
          const sortedContacts = [...contacts].sort((a, b) => {
            const dateA = new Date(a.addedDate || '').getTime();
            const dateB = new Date(b.addedDate || '').getTime();
            return dateB - dateA;
          });

          const mostRecent = sortedContacts[0];
          index = contacts.findIndex(c => c.id === mostRecent.id);
          console.log(`✅ Using most recent contact (likely just synced): ${mostRecent.id}`);
        }
      }

      if (index === -1) {
        console.error(`❌ Contact not found: ${id}`);
        console.log(`💡 Creating new contact instead of updating missing one`);

        // Fallback: Create as new contact (this preserves user's work)
        return await this.saveContact(updates);
      }

      const updatedContact = { ...contacts[index], ...updates };
      contacts[index] = updatedContact;

      await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
      console.log('✅ Contact updated locally:', updatedContact.id);

      return updatedContact;
    } catch (error) {
      console.error('Failed to update contact:', error);
      throw new Error('Failed to update contact');
    }
  }

  /**
   * Delete a contact locally
   */
  static async deleteContact(id: string): Promise<void> {
    try {
      const contacts = await this.getContacts();
      const filteredContacts = contacts.filter(c => c.id !== id);

      await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(filteredContacts));
      console.log('✅ Contact deleted locally:', id);
    } catch (error) {
      console.error('Failed to delete contact:', error);
      throw new Error('Failed to delete contact');
    }
  }

  /**
   * Search contacts locally
   */
  static async searchContacts(query: string): Promise<Contact[]> {
    try {
      const contacts = await this.getContacts();
      const lowercaseQuery = query.toLowerCase();

      return contacts.filter(contact =>
        contact.name.toLowerCase().includes(lowercaseQuery) ||
        contact.company.toLowerCase().includes(lowercaseQuery) ||
        contact.phone.toLowerCase().includes(lowercaseQuery) ||
        contact.email.toLowerCase().includes(lowercaseQuery)
      );
    } catch (error) {
      console.error('Failed to search contacts:', error);
      return [];
    }
  }

  /**
   * Save image to local filesystem
   */
  static async saveImage(imageUri: string): Promise<string> {
    try {
      // Ensure directory exists
      await this.init();

      // Generate unique filename using UUID
      const fileName = `card_${uuidv4()}.jpg`;
      const localUri = `${IMAGES_DIR}${fileName}`;

      // Copy image to app's document directory
      await FileSystem.copyAsync({
        from: imageUri,
        to: localUri
      });

      console.log('✅ Image saved locally:', localUri);
      return localUri;
    } catch (error) {
      console.error('Failed to save image locally:', error);
      // Return original URI as fallback
      return imageUri;
    }
  }

  /**
   * Delete image from local filesystem
   */
  static async deleteImage(imageUri: string): Promise<void> {
    try {
      // Only delete if it's a local image
      if (imageUri.includes(IMAGES_DIR)) {
        await FileSystem.deleteAsync(imageUri, { idempotent: true });
        console.log('✅ Image deleted locally:', imageUri);
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
      // Non-fatal error
    }
  }

  /**
   * Add item to sync queue
   */
  static async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'retries'>): Promise<void> {
    try {
      const queueJson = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      const queue: SyncQueueItem[] = queueJson ? JSON.parse(queueJson) : [];

      const newItem: SyncQueueItem = {
        ...item,
        id: `sync_${uuidv4()}`,
        retries: 0
      };

      queue.push(newItem);
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));

      console.log('📤 Added to sync queue:', newItem.action);
    } catch (error) {
      console.error('Failed to add to sync queue:', error);
      // Non-fatal - sync will be skipped
    }
  }

  /**
   * Get sync queue items
   */
  static async getSyncQueue(): Promise<SyncQueueItem[]> {
    try {
      const queueJson = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      return queueJson ? JSON.parse(queueJson) : [];
    } catch (error) {
      console.error('Failed to get sync queue:', error);
      return [];
    }
  }

  /**
   * Remove item from sync queue
   */
  static async removeFromSyncQueue(id: string): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      const filteredQueue = queue.filter(item => item.id !== id);
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filteredQueue));
    } catch (error) {
      console.error('Failed to remove from sync queue:', error);
    }
  }

  /**
   * Update an item in the sync queue (for retry counter)
   *
   * SECURITY FIX: Added to properly track retry attempts
   */
  static async updateSyncQueueItem(id: string, updatedItem: SyncQueueItem): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      const updatedQueue = queue.map(item =>
        item.id === id ? updatedItem : item
      );
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updatedQueue));
      console.log(`🔄 Updated sync queue item ${id}, retries: ${updatedItem.retries}`);
    } catch (error) {
      console.error('Failed to update sync queue item:', error);
    }
  }

  /**
   * Clear all local data (for debugging)
   */
  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([CONTACTS_KEY, SYNC_QUEUE_KEY]);

      // Clear images directory
      const images = await FileSystem.readDirectoryAsync(IMAGES_DIR);
      for (const image of images) {
        await FileSystem.deleteAsync(`${IMAGES_DIR}${image}`, { idempotent: true });
      }

      console.log('🗑️ Cleared all local data');
    } catch (error) {
      console.error('Failed to clear local data:', error);
    }
  }

  /**
   * Get storage statistics
   */
  static async getStorageStats(): Promise<{
    contactsCount: number;
    imagesCount: number;
    syncQueueCount: number;
    totalSizeKB: number;
  }> {
    try {
      const contacts = await this.getContacts();
      const syncQueue = await this.getSyncQueue();

      let imagesCount = 0;
      let totalSize = 0;

      try {
        const images = await FileSystem.readDirectoryAsync(IMAGES_DIR);
        imagesCount = images.length;

        // Calculate total size
        for (const image of images) {
          const info = await FileSystem.getInfoAsync(`${IMAGES_DIR}${image}`);
          if (info.exists && 'size' in info) {
            totalSize += info.size;
          }
        }
      } catch {
        // Directory might not exist yet
      }

      return {
        contactsCount: contacts.length,
        imagesCount,
        syncQueueCount: syncQueue.length,
        totalSizeKB: Math.round(totalSize / 1024)
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        contactsCount: 0,
        imagesCount: 0,
        syncQueueCount: 0,
        totalSizeKB: 0
      };
    }
  }
}