import { useState, useEffect, useCallback } from 'react';
import { Group, Contact } from '../types';
import { GroupService } from '../services/groupService';
import { ContactService } from '../services/contactService';

/**
 * Hook for managing groups
 * - Provides group CRUD operations
 * - Automatically recalculates contact counts
 * - Handles offline-first storage
 */
export function useGroups(contacts: Contact[]) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load groups on mount
  useEffect(() => {
    loadGroups();
  }, []);

  // Recalculate contact counts when contacts change
  useEffect(() => {
    if (groups.length > 0 && contacts.length > 0) {
      recalculateContactCounts();
    }
  }, [contacts]);

  const loadGroups = async () => {
    try {
      setIsLoading(true);
      const loadedGroups = await GroupService.getGroups();
      setGroups(loadedGroups);
      setError(null);
    } catch (err) {
      console.error('Failed to load groups:', err);
      setError('Failed to load groups');
    } finally {
      setIsLoading(false);
    }
  };

  const createGroup = async (
    groupData: Omit<Group, 'id' | 'createdAt' | 'updatedAt' | 'contactCount'>
  ): Promise<Group> => {
    try {
      const newGroup = await GroupService.createGroup(groupData);
      setGroups(prev => [newGroup, ...prev]);
      return newGroup;
    } catch (err) {
      console.error('Failed to create group:', err);
      throw err;
    }
  };

  const updateGroup = async (
    groupId: string,
    updates: Partial<Omit<Group, 'id' | 'createdAt'>>
  ): Promise<void> => {
    try {
      const updatedGroup = await GroupService.updateGroup(groupId, updates);
      setGroups(prev => prev.map(g => (g.id === groupId ? updatedGroup : g)));
    } catch (err) {
      console.error('Failed to update group:', err);
      throw err;
    }
  };

  const deleteGroup = async (groupId: string): Promise<void> => {
    try {
      await GroupService.deleteGroup(groupId);

      // Remove group from all contacts
      const contactsInGroup = contacts.filter(c => c.groupIds?.includes(groupId));
      for (const contact of contactsInGroup) {
        await ContactService.removeContactsFromGroup([contact.id], groupId);
      }

      setGroups(prev => prev.filter(g => g.id !== groupId));
    } catch (err) {
      console.error('Failed to delete group:', err);
      throw err;
    }
  };

  const addContactsToGroup = async (contactIds: string[], groupId: string): Promise<void> => {
    try {
      await ContactService.addContactsToGroup(contactIds, groupId);

      // Don't manually update count - let recalculateContactCounts handle it
      // The parent component will call recalculateContactCounts after loadContacts
      console.log('✅ Contacts added to group, waiting for parent to recalculate counts');
    } catch (err) {
      console.error('Failed to add contacts to group:', err);
      throw err;
    }
  };

  const removeContactsFromGroup = async (contactIds: string[], groupId: string): Promise<void> => {
    try {
      await ContactService.removeContactsFromGroup(contactIds, groupId);

      // Don't manually update count - let recalculateContactCounts handle it
      // The parent component will call recalculateContactCounts after loadContacts
      console.log('✅ Contacts removed from group, waiting for parent to recalculate counts');
    } catch (err) {
      console.error('Failed to remove contacts from group:', err);
      throw err;
    }
  };

  const recalculateContactCounts = async () => {
    try {
      await GroupService.recalculateContactCounts(contacts);
      // Reload groups to get updated counts
      await loadGroups();
    } catch (err) {
      console.error('Failed to recalculate contact counts:', err);
    }
  };

  const getContactsByGroup = async (groupId: string): Promise<Contact[]> => {
    return ContactService.getContactsByGroup(groupId);
  };

  return {
    groups,
    isLoading,
    error,
    createGroup,
    updateGroup,
    deleteGroup,
    addContactsToGroup,
    removeContactsFromGroup,
    getContactsByGroup,
    recalculateContactCounts,
    refreshGroups: loadGroups,
  };
}
