import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Linking,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Contact, Group } from '../../types';
import { ContactService } from '../../services/contactService';
import { FloatingActionButton } from '../business/FloatingActionButton';
import { GroupSelectionModal } from '../business/GroupSelectionModal';
import { useIntroMessage } from '../../hooks/useIntroMessage';
import { formatPhoneForDisplay } from '../../utils/phoneFormatter';
import * as FileSystem from 'expo-file-system/legacy';
import { Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform, Share } from 'react-native';

interface ContactListProps {
  contacts: Contact[];
  groups: Group[];
  onContactSelect: (contact: Contact) => void;
  onAddContact: () => void;
  onDeleteContacts?: (contactIds: string[]) => void;
  onAddContactsToGroups?: (contactIds: string[], groupIds: string[]) => void;
  onCreateGroup?: (groupData: Omit<Group, 'id' | 'createdAt' | 'updatedAt' | 'contactCount'>) => Promise<Group> | Group | void;
  onDeleteGroup?: (groupId: string) => void;
}

export function ContactList({
  contacts,
  groups,
  onContactSelect,
  onAddContact,
  onDeleteContacts,
  onAddContactsToGroups,
  onCreateGroup,
  onDeleteGroup
}: ContactListProps) {
  const { getFormattedMessage, reloadIntroMessage } = useIntroMessage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string | null>(null);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [isUpdatingContact, setIsUpdatingContact] = useState<string | null>(null);

  // Reload intro message when screen gains focus (fixes stale message bug)
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 ContactList focused - reloading intro message');
      reloadIntroMessage();
    }, [reloadIntroMessage])
  );

  // Debug: Log groups whenever they change
  useEffect(() => {
    console.log('📊 Groups updated:', groups.length);
    groups.forEach(g => {
      console.log(`  - ${g.name}: ${g.contactCount} contacts, color: ${g.color}, icon: ${g.icon}`);
    });
  }, [groups]);

  const filteredContacts = contacts.filter(contact => {
    // Text search filter
    const matchesSearch =
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase());

    // Group filter
    const matchesGroup = selectedGroupFilter
      ? contact.groupIds?.includes(selectedGroupFilter)
      : true;

    return matchesSearch && matchesGroup;
  });

  // Debug: Log filtered contacts when filter changes
  useEffect(() => {
    console.log('🔍 Filter changed:', selectedGroupFilter || 'All');
    console.log('🔍 Total contacts:', contacts.length);
    console.log('🔍 Filtered contacts:', filteredContacts.length);

    if (selectedGroupFilter) {
      console.log('🔍 Checking which contacts have this group:');
      contacts.forEach(c => {
        const hasGroup = c.groupIds?.includes(selectedGroupFilter);
        console.log(`  - ${c.name}: groupIds=${JSON.stringify(c.groupIds)}, hasGroup=${hasGroup}`);
      });
    }
  }, [selectedGroupFilter, contacts, filteredContacts]);

  const handleContactPress = (contact: Contact) => {
    if (isSelectMode) {
      if (selectedContacts.includes(contact.id)) {
        setSelectedContacts(selectedContacts.filter(id => id !== contact.id));
      } else {
        setSelectedContacts([...selectedContacts, contact.id]);
      }
    } else {
      onContactSelect(contact);
    }
  };

  const handleLongPress = (contact: Contact) => {
    setIsSelectMode(true);
    setSelectedContacts([contact.id]);
  };

  const handleWhatsApp = async (contact: Contact) => {
    setIsUpdatingContact(contact.id);
    try {
      const cleanPhone = contact.phone.replace(/[^+\d]/g, '');
      const introMessage = getFormattedMessage(contact.name);
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(introMessage)}`;

      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        // Open WhatsApp
        await Linking.openURL(whatsappUrl);

        // Update last contact timestamp (offline-first)
        try {
          await ContactService.updateContact(contact.id, {
            lastContact: new Date().toISOString()
          });
          console.log('✅ Last contact timestamp updated for:', contact.name);
        } catch (updateError) {
          console.warn('⚠️ Failed to update last contact timestamp:', updateError);
          // Don't show error to user as WhatsApp opened successfully
        }
      } else {
        Alert.alert('Error', 'WhatsApp is not installed on this device');
      }
    } catch (error) {
      console.error('❌ WhatsApp integration failed:', error);
      Alert.alert('Error', 'Failed to open WhatsApp');
    } finally {
      setIsUpdatingContact(null);
    }
  };

  const handleExportExcel = async () => {
    try {
      const selectedContactsData = contacts.filter(c => selectedContacts.includes(c.id));

      if (selectedContactsData.length === 0) {
        Alert.alert('No Contacts', 'Please select at least one contact to export');
        return;
      }

      // Create CSV content
      const csvHeader = 'Name,Job Title,Company,Email,Phone,Mobile 2,Office,Address\n';
      const csvRows = selectedContactsData.map(contact => {
        const row = [
          contact.name || '',
          contact.jobTitle || '',
          contact.company || '',
          contact.email || '',
          contact.phones?.mobile1 || contact.phone || '',
          contact.phones?.mobile2 || '',
          contact.phones?.office || '',
          contact.address || ''
        ].map(field => `"${field.replace(/"/g, '""')}"`).join(',');
        return row;
      }).join('\n');

      const csvContent = csvHeader + csvRows;

      // Save to file with platform-specific path handling
      const filename = `contacts_export_${new Date().getTime()}.csv`;
      // Use cache directory for iOS to avoid permission issues
      const baseDir = Platform.OS === 'ios' ? FileSystem.cacheDirectory : Paths.document.uri;
      const fileUri = `${baseDir}${filename}`;

      console.log('[Export] Writing file to:', fileUri);
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: 'utf8',
      });

      console.log('[Export] File written successfully');

      // Try sharing the file
      try {
        // iOS: expo-sharing doesn't work reliably in Expo Go, use React Native Share API
        if (Platform.OS === 'ios') {
          console.log('[Export] iOS detected - using React Native Share API');
          console.log('[Export] Reading CSV content from:', fileUri);

          const csvText = await FileSystem.readAsStringAsync(fileUri);
          console.log('[Export] CSV content length:', csvText.length);

          console.log('[Export] Attempting to share CSV content...');
          const shareResult = await Share.share({
            message: csvText,
            title: 'Export Contacts',
          });

          console.log('[Export] Share result:', shareResult);

          if (shareResult.action === Share.sharedAction) {
            console.log('[Export] ✅ Content shared successfully');
            Alert.alert('Success', `Exported ${selectedContactsData.length} contacts`);
          } else if (shareResult.action === Share.dismissedAction) {
            console.log('[Export] ℹ️ Share sheet dismissed');
          }
        } else {
          // Android: Use expo-sharing which works well
          console.log('[Export] Android detected - using expo-sharing');
          const sharingAvailable = await Sharing.isAvailableAsync();
          console.log('[Export] Sharing available:', sharingAvailable);

          if (sharingAvailable) {
            console.log('[Export] Attempting to share file:', fileUri);

            await Sharing.shareAsync(fileUri, {
              mimeType: 'text/csv',
              dialogTitle: 'Export Contacts',
            });

            console.log('[Export] ✅ Share completed');
            Alert.alert('Success', `Exported ${selectedContactsData.length} contacts`);
          } else {
            throw new Error('Sharing not available on this device');
          }
        }
      } catch (shareError) {
        console.error('[Export] Share failed:', shareError);
        console.error('[Export] Error details:', JSON.stringify(shareError, null, 2));

        // Show user where file was saved
        Alert.alert(
          'Export Complete',
          `Exported ${selectedContactsData.length} contacts.\n\nFile saved to:\n${filename}\n\nThe file is in your app's cache directory.`,
          [
            {
              text: 'OK',
              onPress: () => {
                console.log('[Export] User acknowledged export');
              }
            }
          ]
        );
      }

      setIsSelectMode(false);
      setSelectedContacts([]);
    } catch (error) {
      console.error('[Export] Failed:', error);
      Alert.alert('Export Error', `Failed to export contacts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteContacts = () => {
    Alert.alert(
      'Delete Contacts',
      `Are you sure you want to delete ${selectedContacts.length} contact${selectedContacts.length > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (onDeleteContacts) {
              onDeleteContacts(selectedContacts);
            }
            setIsSelectMode(false);
            setSelectedContacts([]);
          },
        },
      ]
    );
  };

  const handleAddToGroup = () => {
    console.log('🔷 Opening group modal with groups:', groups.length);
    console.log('🔷 Selected contacts:', selectedContacts.length);
    setShowGroupModal(true);
  };

  const handleGroupSelection = async (groupIds: string[]) => {
    if (onAddContactsToGroups && selectedContacts.length > 0) {
      try {
        await onAddContactsToGroups(selectedContacts, groupIds);

        Alert.alert(
          'Success',
          `Added ${selectedContacts.length} contact${selectedContacts.length > 1 ? 's' : ''} to ${groupIds.length} group${groupIds.length > 1 ? 's' : ''}`
        );

        // Exit select mode and clear selection
        setIsSelectMode(false);
        setSelectedContacts([]);
      } catch (error) {
        Alert.alert('Error', 'Failed to add contacts to groups');
      }
    }
  };

  const handleCreateGroup = async (groupData: Omit<Group, 'id' | 'createdAt' | 'updatedAt' | 'contactCount'>): Promise<string | void> => {
    if (onCreateGroup) {
      // onCreateGroup might return a group object with an ID
      const result = await Promise.resolve(onCreateGroup(groupData));

      // If result is a Group object, return its ID
      if (result && typeof result === 'object' && 'id' in result) {
        return result.id;
      }
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    Alert.alert(
      'Delete Group',
      `Are you sure you want to delete "${group.name}"? Contacts will not be deleted, only the group.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (onDeleteGroup) {
              onDeleteGroup(groupId);
              setSelectedGroupFilter(null); // Go back to All
            }
          },
        },
      ]
    );
  };

  const handleAddManually = () => {
    onAddContact();
  };

  const handleScanCard = () => {
    onAddContact();
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map(c => c.id));
    }
  };

  const exitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedContacts([]);
  };

  const renderContact = ({ item: contact }: { item: Contact }) => (
    <TouchableOpacity
      style={[
        styles.contactCard,
        selectedContacts.includes(contact.id) && styles.selectedCard
      ]}
      onPress={() => handleContactPress(contact)}
      onLongPress={() => handleLongPress(contact)}
      activeOpacity={0.7}
    >
      {/* Selection checkbox */}
      {isSelectMode && (
        <View style={styles.checkbox}>
          <View style={[
            styles.checkboxInner,
            selectedContacts.includes(contact.id) && styles.checkboxSelected
          ]}>
            {selectedContacts.includes(contact.id) && (
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            )}
          </View>
        </View>
      )}

      {/* Business card thumbnail */}
      <View style={styles.cardThumbnail}>
        <Image
          source={{ uri: contact.imageUrl }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      </View>

      {/* Contact info */}
      <View style={styles.contactInfo}>
        <Text style={styles.contactName} numberOfLines={1}>
          {contact.name}
        </Text>
        {contact.jobTitle && (
          <Text style={styles.contactJobTitle} numberOfLines={1}>
            {contact.jobTitle}
          </Text>
        )}
        <Text style={styles.contactCompany} numberOfLines={1}>
          {contact.company}
        </Text>
        <Text style={styles.contactPhone} numberOfLines={1}>
          {formatPhoneForDisplay(contact.phones?.mobile1 || contact.phone)}
        </Text>
        {contact.phones?.mobile2 && (
          <Text style={styles.contactPhone2} numberOfLines={1}>
            {formatPhoneForDisplay(contact.phones.mobile2)}
          </Text>
        )}

        {/* Group badges */}
        {contact.groupIds && contact.groupIds.length > 0 && (
          <View style={styles.groupBadgesContainer}>
            {contact.groupIds.slice(0, 3).map((groupId) => {
              const group = groups.find(g => g.id === groupId);
              if (!group) return null;
              return (
                <View
                  key={groupId}
                  style={[styles.groupBadge, { backgroundColor: group.color + '20', borderColor: group.color }]}
                >
                  <Ionicons name={group.icon as any || 'people'} size={10} color={group.color} />
                  <Text style={[styles.groupBadgeText, { color: group.color }]} numberOfLines={1}>
                    {group.name}
                  </Text>
                </View>
              );
            })}
            {contact.groupIds.length > 3 && (
              <Text style={styles.moreGroupsText}>+{contact.groupIds.length - 3}</Text>
            )}
          </View>
        )}
      </View>

      {/* WhatsApp button */}
      {!isSelectMode && (
        <TouchableOpacity
          style={styles.whatsappButton}
          onPress={() => handleWhatsApp(contact)}
          disabled={isUpdatingContact === contact.id}
          accessibilityLabel="Open in WhatsApp"
          accessibilityHint="Opens WhatsApp conversation with this contact"
          accessibilityRole="button"
        >
          {isUpdatingContact === contact.id ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    // Empty group state (filtered view)
    if (selectedGroupFilter) {
      const selectedGroup = groups.find(g => g.id === selectedGroupFilter);
      return (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name={selectedGroup?.icon as any || 'folder-open-outline'}
              size={40}
              color={selectedGroup?.color || '#9CA3AF'}
            />
          </View>
          <Text style={styles.emptyTitle}>No contacts in {selectedGroup?.name || 'this group'}</Text>
          <Text style={styles.emptyText}>
            Add contacts to this group to organize them better
          </Text>

          {/* Actions */}
          <View style={styles.emptyActions}>
            <TouchableOpacity
              style={styles.emptyActionButton}
              onPress={() => setSelectedGroupFilter(null)}
            >
              <Ionicons name="arrow-back" size={20} color="#2563EB" />
              <Text style={styles.emptyActionText}>View All Contacts</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.emptyActionButton, styles.emptyActionButtonDanger]}
              onPress={() => handleDeleteGroup(selectedGroupFilter)}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text style={[styles.emptyActionText, styles.emptyActionTextDanger]}>
                Delete Group
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // No contacts at all (default state)
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Ionicons name="people-outline" size={48} color="#9CA3AF" />
        </View>
        <Text style={styles.emptyTitle}>No contacts yet</Text>
        <Text style={styles.emptyText}>
          Scan your first business card to get started
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {isSelectMode ? (
          <>
            <TouchableOpacity onPress={exitSelectMode}>
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {selectedContacts.length} selected
            </Text>
            <TouchableOpacity onPress={handleSelectAll}>
              <Text style={styles.selectAllText}>
                {selectedContacts.length === filteredContacts.length ? 'Unselect all' : 'Select all'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity>
              <Ionicons name="menu" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Contacts</Text>
            <TouchableOpacity
              onPress={() => {
                setIsSelectMode(true);
              }}
            >
              <Text style={styles.selectText}>Select</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Search bar and filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <Input
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search cards"
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Group Filter Pills - Horizontal Scroll */}
      {groups.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.groupFilterScroll}
          contentContainerStyle={styles.groupFilterContainer}
        >
          {/* All Contacts Filter */}
          <TouchableOpacity
            style={[
              styles.groupFilterPill,
              !selectedGroupFilter && styles.groupFilterPillActive
            ]}
            onPress={() => {
              console.log('🔍 Filter: All contacts');
              setSelectedGroupFilter(null);
            }}
          >
            <Ionicons
              name="people"
              size={12}
              color={!selectedGroupFilter ? '#2563EB' : '#6B7280'}
            />
            <Text
              style={{
                fontSize: 12,
                color: !selectedGroupFilter ? '#2563EB' : '#1F2937',
                fontWeight: !selectedGroupFilter ? '700' : '600',
                marginLeft: 6,
                lineHeight: 14,
              }}
            >
              All ({contacts.length})
            </Text>
          </TouchableOpacity>

          {/* Group Filters */}
          {groups.map(group => {
            console.log('🔍 Rendering group filter:', group.name, group.contactCount);
            return (
              <TouchableOpacity
                key={group.id}
                style={[
                  styles.groupFilterPill,
                  selectedGroupFilter === group.id && styles.groupFilterPillActive,
                  { borderColor: group.color }
                ]}
                onPress={() => {
                  console.log('🔍 Filter tapped:', group.name);
                  setSelectedGroupFilter(group.id === selectedGroupFilter ? null : group.id);
                }}
              >
                <Ionicons
                  name={group.icon as any || 'people'}
                  size={12}
                  color={selectedGroupFilter === group.id ? group.color : '#6B7280'}
                />
                <Text
                  style={{
                    fontSize: 12,
                    color: selectedGroupFilter === group.id ? group.color : '#1F2937',
                    fontWeight: selectedGroupFilter === group.id ? '700' : '600',
                    marginLeft: 6,
                    lineHeight: 14,
                  }}
                >
                  {group.name} ({group.contactCount})
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* New Group Button */}
          <TouchableOpacity
            style={styles.newGroupButton}
            onPress={() => setShowNewGroupModal(true)}
          >
            <Ionicons name="add-circle" size={12} color="#2563EB" />
            <Text style={{
              fontSize: 12,
              color: '#2563EB',
              fontWeight: '600',
              marginLeft: 6,
              lineHeight: 14,
            }}>
              New Group
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Empty State: No Groups Yet */}
      {groups.length === 0 && (
        <View style={styles.noGroupsContainer}>
          <TouchableOpacity
            style={styles.createFirstGroupButton}
            onPress={() => setShowNewGroupModal(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color="#2563EB" />
            <Text style={styles.createFirstGroupText}>Create your first group to organize contacts</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Contact count */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>{filteredContacts.length} cards</Text>
        {isSelectMode && selectedContacts.length === 0 && (
          <TouchableOpacity onPress={handleSelectAll}>
            <Text style={styles.selectAllLink}>Select all</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Contact list */}
      <FlatList
        data={filteredContacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={filteredContacts.length === 0 ? styles.emptyContainer : styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <FloatingActionButton
        isSelectMode={isSelectMode}
        selectedCount={selectedContacts.length}
        onExport={handleExportExcel}
        onDelete={handleDeleteContacts}
        onAddToGroup={handleAddToGroup}
        onAddManually={handleAddManually}
        onScanCard={handleScanCard}
      />

      {/* Group Selection Modal (for adding contacts to groups) */}
      <GroupSelectionModal
        visible={showGroupModal}
        groups={groups}
        selectedContactCount={selectedContacts.length}
        onClose={() => setShowGroupModal(false)}
        onSelectGroups={handleGroupSelection}
        onCreateGroup={handleCreateGroup}
      />

      {/* New Group Modal (for quick group creation) */}
      <GroupSelectionModal
        visible={showNewGroupModal}
        groups={groups}
        selectedContactCount={0}
        onClose={() => setShowNewGroupModal(false)}
        onSelectGroups={() => {}} // Not used in this context
        onCreateGroup={(groupData) => {
          handleCreateGroup(groupData);
          setShowNewGroupModal(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
  },
  cancelText: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '500',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    marginBottom: 0,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
    justifyContent: 'center',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyActions: {
    flexDirection: 'column',
    gap: 12,
    marginTop: 20,
    marginBottom: 100, // Add bottom margin to prevent FAB overlap
    width: '100%',
    paddingHorizontal: 16,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  emptyActionButtonDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  emptyActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  emptyActionTextDanger: {
    color: '#EF4444',
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  checkbox: {
    marginRight: 12,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  selectText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  selectAllText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  selectAllLink: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  countContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
  },
  countText: {
    fontSize: 14,
    color: '#6B7280',
  },
  cardThumbnail: {
    marginRight: 12,
  },
  cardImage: {
    width: 56,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  contactJobTitle: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  contactCompany: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  contactPhone2: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  whatsappButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Group badges on contact cards
  groupBadgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 4,
  },
  groupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    gap: 3,
  },
  groupBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    maxWidth: 60,
  },
  moreGroupsText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
    paddingHorizontal: 4,
  },
  // Group filter section
  groupFilterScroll: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  groupFilterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  groupFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  groupFilterPillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
    borderWidth: 1.5,
  },
  groupFilterText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  groupFilterTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  newGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#2563EB',
  },
  newGroupButtonText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  // No groups empty state
  noGroupsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  createFirstGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderStyle: 'dashed',
    gap: 8,
  },
  createFirstGroupText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
});