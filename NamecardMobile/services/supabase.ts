import * as FileSystem from 'expo-file-system';
import { Contact, Group } from '../types';
import { AuthManager } from './authManager';
import { getSupabaseClient } from './supabaseClient';
import Config from '../config/environment';

// Database types based on our new schema
interface DatabaseContact {
  id: string;
  user_id?: string;
  name: string;
  company: string | null;
  phone: string | null;
  phones: any | null; // JSONB field for multiple phones
  job_title: string | null;
  email: string | null;
  address: string | null;
  card_image_url: string | null;
  image_url: string | null; // Alternative field name
  last_contact: string | null;
  reminder_date: string | null;
  reminder_note: string | null;
  voice_notes: any[] | null;
  tags: string[] | null;
  added_date: string | null; // For compatibility
  created_at: string;
  updated_at: string;
}

export class SupabaseService {
  /**
   * Get Supabase client
   */
  static getClient() {
    return getSupabaseClient();
  }

  /**
   * Upload business card image to Supabase Storage
   */
  static async uploadCardImage(imageUri: string, contactId: string): Promise<string> {
    try {
      const client = this.getClient();

      // Check if bucket exists first
      const { data: buckets, error: bucketError } = await client.storage.listBuckets();

      if (bucketError || !buckets?.some(b => b.id === 'contact-images')) {
        console.warn('⚠️ Storage bucket not found. Using local image URI.');
        console.warn('📝 Please run database/fix-rls-and-storage.sql in Supabase SQL Editor');
        return imageUri; // Return local URI if bucket doesn't exist
      }

      // Read file as ArrayBuffer for React Native
      const response = await fetch(imageUri);
      const arrayBuffer = await response.arrayBuffer();

      const fileName = `card_${contactId}_${Date.now()}.jpg`;
      const filePath = `business-cards/${fileName}`;

      const { data, error } = await client.storage
        .from('contact-images')
        .upload(filePath, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) {
        console.error('❌ Storage upload error:', error.message);
        if (error.message.includes('Bucket not found')) {
          console.error('🚨 Run database/URGENT_FIX_ALL_ISSUES.sql in Supabase');
        }
        // Return local URI as fallback
        return imageUri;
      }

      // Get public URL
      const { data: urlData } = client.storage
        .from('contact-images')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error: any) {
      console.error('❌ Image upload failed:', error.message || error);
      // Always return local URI as fallback
      return imageUri;
    }
  }

  /**
   * Create a new contact
   */
  static async createContact(contactData: Partial<Contact>): Promise<Contact> {
    return AuthManager.withVerifiedSession(async (userId) => {
      const client = this.getClient();

      console.log('📝 Creating contact with user ID:', userId);

      // Upload image if provided
      let imageUrl = contactData.imageUrl || '';
      if (contactData.imageUrl && contactData.imageUrl.startsWith('file://')) {
        const tempId = `temp_${Date.now()}`;
        try {
          imageUrl = await this.uploadCardImage(contactData.imageUrl, tempId);
        } catch (uploadError) {
          console.warn('⚠️ Image upload failed, using local URI');
          imageUrl = contactData.imageUrl;
        }
      }

      const insertData = {
        user_id: userId,
        name: contactData.name || '',
        company: contactData.company || null,
        phone: contactData.phone || null,
        phones: contactData.phones || null, // Multiple phone numbers
        job_title: contactData.jobTitle || null,
        email: contactData.email || null,
        address: contactData.address || null,
        image_url: imageUrl, // Using image_url field
        card_image_url: imageUrl, // Also set legacy field for compatibility
        added_date: contactData.addedDate || new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        last_contact: null,
        reminder_date: null,
        reminder_note: null,
        voice_notes: [],
        tags: null,
      };

      const { data, error } = await client
        .from('contacts')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create contact: ${error.message}`);
      }

      return this.transformDatabaseContact(data);
    });
  }

  /**
   * Get all contacts for the current user
   */
  static async getContacts(): Promise<Contact[]> {
    return AuthManager.withVerifiedSession(async (userId) => {
      const client = this.getClient();

      const { data, error } = await client
        .from('contacts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch contacts: ${error.message}`);
      }

      return data.map(this.transformDatabaseContact);
    });
  }

  /**
   * Update a contact
   *
   * Supports updating both owned contacts and claiming orphaned offline contacts
   */
  static async updateContact(id: string, updates: Partial<Contact>): Promise<Contact> {
    return AuthManager.withVerifiedSession(async (userId) => {
      const client = this.getClient();

      const updateData: Record<string, any> = {
        user_id: userId, // Always assign to current user (claim orphaned contacts)
      };
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.company !== undefined) updateData.company = updates.company;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      if (updates.phones !== undefined) updateData.phones = updates.phones;
      if (updates.jobTitle !== undefined) updateData.job_title = updates.jobTitle;
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.address !== undefined) updateData.address = updates.address;
      if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;
      if (updates.lastContact !== undefined) updateData.last_contact = updates.lastContact;

      const { data, error } = await (client as any)
        .from('contacts')
        .update(updateData)
        .eq('id', id)
        // Don't filter by user_id - let RLS policy handle ownership check
        // This allows claiming orphaned contacts (user_id = NULL)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update contact: ${error.message}`);
      }

      return this.transformDatabaseContact(data);
    });
  }

  /**
   * Delete a contact
   */
  static async deleteContact(id: string): Promise<void> {
    return AuthManager.withVerifiedSession(async (userId) => {
      const client = this.getClient();

      const { error } = await client
        .from('contacts')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);  // Ensure user owns this contact

      if (error) {
        throw new Error(`Failed to delete contact: ${error.message}`);
      }
    });
  }

  /**
   * Search contacts
   *
   * SECURITY FIX: Sanitize query to prevent SQL injection via special characters
   */
  static async searchContacts(query: string): Promise<Contact[]> {
    return AuthManager.withVerifiedSession(async (userId) => {
      const client = this.getClient();

      // SECURITY: Escape special characters that could be used for SQL injection
      // PostgreSQL LIKE/ILIKE uses % and _ as wildcards that need escaping
      const sanitizedQuery = query
        .replace(/\\/g, '\\\\')  // Escape backslashes first
        .replace(/%/g, '\\%')    // Escape % wildcard
        .replace(/_/g, '\\_');   // Escape _ wildcard

      const { data, error } = await client
        .from('contacts')
        .select('*')
        .eq('user_id', userId)  // Only search user's own contacts
        .or(`name.ilike.%${sanitizedQuery}%,company.ilike.%${sanitizedQuery}%,phone.ilike.%${sanitizedQuery}%,email.ilike.%${sanitizedQuery}%`)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to search contacts: ${error.message}`);
      }

      return data.map(this.transformDatabaseContact);
    });
  }

  /**
   * Update last contact timestamp
   */
  static async updateLastContact(id: string): Promise<void> {
    return AuthManager.withVerifiedSession(async (userId) => {
      const client = this.getClient();

      const { error } = await (client as any)
        .from('contacts')
        .update({ last_contact: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId);  // Ensure user owns this contact

      if (error) {
        throw new Error(`Failed to update last contact: ${error.message}`);
      }
    });
  }

  /**
   * Subscribe to real-time contact changes
   */
  static subscribeToContacts(
    onInsert?: (contact: Contact) => void,
    onUpdate?: (contact: Contact) => void,
    onDelete?: (id: string) => void
  ) {
    const client = this.getClient();

    return client
      .channel('contacts-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'contacts' },
        (payload) => {
          if (onInsert) {
            onInsert(this.transformDatabaseContact(payload.new as DatabaseContact));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'contacts' },
        (payload) => {
          if (onUpdate) {
            onUpdate(this.transformDatabaseContact(payload.new as DatabaseContact));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'contacts' },
        (payload) => {
          if (onDelete) {
            onDelete(payload.old.id);
          }
        }
      )
      .subscribe();
  }

  /**
   * Transform database contact to app contact format
   */
  private static transformDatabaseContact(dbContact: DatabaseContact): Contact {
    return {
      id: dbContact.id,
      name: dbContact.name,
      company: dbContact.company || '',
      phone: dbContact.phone || '',
      phones: dbContact.phones || undefined, // Multiple phone numbers
      jobTitle: dbContact.job_title || undefined,
      email: dbContact.email || '',
      address: dbContact.address || '',
      imageUrl: dbContact.image_url || dbContact.card_image_url || '',
      addedDate: dbContact.added_date || new Date(dbContact.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      lastContact: dbContact.last_contact
        ? this.formatRelativeTime(new Date(dbContact.last_contact))
        : undefined,
    };
  }

  /**
   * Format relative time (e.g., "2 days ago")
   */
  private static formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  /**
   * Test connection to Supabase
   */
  static async testConnection(): Promise<boolean> {
    try {
      const client = this.getClient();
      const { error } = await client.from('contacts').select('count', { count: 'exact', head: true });
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Sign up a new user
   */
  static async signUp(email: string, password: string, metadata?: { name?: string }): Promise<{ user: any; error: any }> {
    try {
      const client = this.getClient();
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: 'whatscard://auth-confirm'
        }
      });

      // Store session if sign up created one (when email confirmation is disabled)
      if (data?.session) {
        await AuthManager.storeSession(data.session);
      }

      return { user: data?.user, error };
    } catch (error) {
      console.error('Sign up error:', error);
      return { user: null, error };
    }
  }

  /**
   * Sign in an existing user
   */
  static async signIn(email: string, password: string): Promise<{ user: any; error: any }> {
    try {
      const client = this.getClient();
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      });

      // Check if login failed due to unconfirmed email
      if (error && error.message?.includes('Email not confirmed')) {
        return {
          user: null,
          error: {
            ...error,
            message: 'Email not confirmed. Please check your inbox for the verification email.',
            code: 'email_not_confirmed'
          }
        };
      }

      // Store session on successful sign in
      if (data?.session) {
        await AuthManager.storeSession(data.session);
      }

      return { user: data?.user, error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { user: null, error };
    }
  }

  /**
   * Sign out the current user
   */
  static async signOut(): Promise<{ error: any }> {
    try {
      const client = this.getClient();
      const { error } = await client.auth.signOut();

      // Clear stored session
      await AuthManager.clearSession();

      return { error };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  }

  /**
   * Reset password for a user
   */
  static async resetPassword(email: string): Promise<{ error: any }> {
    try {
      const client = this.getClient();
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: 'whatscard://reset-password',
      });
      return { error };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error };
    }
  }

  /**
   * Resend verification email for unverified accounts
   */
  static async resendVerificationEmail(email: string): Promise<{ error: any }> {
    try {
      const client = this.getClient();
      const { error } = await client.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: 'whatscard://auth-confirm'
        }
      });
      return { error };
    } catch (error) {
      console.error('Resend verification error:', error);
      return { error };
    }
  }

  /**
   * Get current user session
   */
  static async getCurrentSession(): Promise<any> {
    try {
      const client = this.getClient();
      const { data: { session }, error } = await client.auth.getSession();

      return session;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }

  /**
   * Get current user
   */
  static async getCurrentUser(): Promise<{ user: any; error: any }> {
    try {
      const client = this.getClient();
      const { data: { user }, error } = await client.auth.getUser();

      return { user, error };
    } catch (error) {
      console.error('Get user error:', error);
      return { user: null, error };
    }
  }

  /**
   * Get all groups for the current user
   */
  static async getGroups(): Promise<Group[]> {
    try {
      return await AuthManager.withVerifiedSession(async (userId) => {
        const client = this.getClient();

        const { data, error } = await client
          .from('groups')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('⚠️ Failed to fetch groups from cloud:', error.message);
          return [];
        }

        return data || [];
      });
    } catch (error) {
      // Not authenticated - return empty array
      console.log('⚠️ Not authenticated, returning empty groups array');
      return [];
    }
  }

  /**
   * Create or update a group
   */
  static async upsertGroup(group: Partial<Group> & { name: string; color: string }): Promise<Group> {
    return AuthManager.withVerifiedSession(async (userId) => {
      const client = this.getClient();

      const upsertData: any = {
        user_id: userId,
        name: group.name,
        description: group.description || null,
        color: group.color,
        icon: group.icon || null,
        contact_count: group.contactCount || 0,
      };

      // Only include id if it's a valid UUID (not a local ID)
      if (group.id && !group.id.startsWith('group_')) {
        upsertData.id = group.id;
        upsertData.created_at = group.createdAt;
        upsertData.updated_at = group.updatedAt || new Date().toISOString();
      }

      const { data, error } = await client
        .from('groups')
        .upsert(upsertData)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to upsert group: ${error.message}`);
      }

      return {
        id: data.id,
        name: data.name,
        description: data.description || undefined,
        color: data.color,
        icon: data.icon || undefined,
        contactCount: data.contact_count,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        userId: data.user_id,
      };
    });
  }

  /**
   * Delete a group
   */
  static async deleteGroup(groupId: string): Promise<void> {
    return AuthManager.withVerifiedSession(async (userId) => {
      const client = this.getClient();

      const { error } = await client
        .from('groups')
        .delete()
        .eq('id', groupId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to delete group: ${error.message}`);
      }
    });
  }

  /**
   * Initialize storage bucket if it doesn't exist
   */
  static async initializeStorage(): Promise<void> {
    try {
      const client = this.getClient();

      // Check if bucket exists
      const { data: buckets, error: listError } = await client.storage.listBuckets();

      if (listError) {
        console.warn('⚠️ Could not list storage buckets:', listError.message);
        return;
      }

      const bucketExists = buckets?.some(bucket => bucket.name === 'contact-images');

      if (!bucketExists) {
        console.log('📦 Storage bucket does not exist yet');
        console.log('⚠️ Please run the SQL script in database/fix_storage_bucket_rls.sql');
        console.log('   This will create the bucket with proper RLS policies');

        // Don't try to create from client - RLS policies prevent it
        // The bucket should be created via SQL with proper permissions
      } else {
        console.log('✅ Storage bucket already exists');
      }
    } catch (error) {
      console.warn('⚠️ Storage initialization check failed:', error);
    }
  }
}