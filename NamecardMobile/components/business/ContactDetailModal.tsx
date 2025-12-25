import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  Alert,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Contact, Group } from '../../types';
import { ContactService } from '../../services/contactService';
import { useIntroMessage } from '../../hooks/useIntroMessage';
import { GroupSelectionModal } from './GroupSelectionModal';

const { width, height } = Dimensions.get('window');

interface ContactDetailModalProps {
  contact: Contact | null;
  visible: boolean;
  onClose: () => void;
  onDelete: (contactId: string) => void;
  onEdit: (contact: Contact) => void;
  groups?: Group[];
  onAddContactsToGroups?: (contactIds: string[], groupIds: string[]) => void;
  onCreateGroup?: (groupData: Omit<Group, 'id' | 'createdAt' | 'updatedAt' | 'contactCount'>) => Promise<Group> | Group | void;
}

export function ContactDetailModal({
  contact,
  visible,
  onClose,
  onDelete,
  onEdit,
  groups = [],
  onAddContactsToGroups,
  onCreateGroup,
}: ContactDetailModalProps) {
  const { getFormattedMessage } = useIntroMessage();
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [isLoading, setIsLoading] = useState({ phone: false, email: false, whatsapp: false });

  if (!contact) return null;

  const handleCall = async (phoneNumber: string) => {
    setIsLoading(prev => ({ ...prev, phone: true }));
    try {
      const url = `tel:${phoneNumber}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to make phone call');
      }
    } finally {
      setIsLoading(prev => ({ ...prev, phone: false }));
    }
  };

  const handleEmail = async () => {
    if (!contact.email) return;
    setIsLoading(prev => ({ ...prev, email: true }));
    try {
      const url = `mailto:${contact.email}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open email client');
      }
    } finally {
      setIsLoading(prev => ({ ...prev, email: false }));
    }
  };

  const handleWhatsApp = async (phoneNumber: string) => {
    setIsLoading(prev => ({ ...prev, whatsapp: true }));
    try {
      const cleanPhone = phoneNumber.replace(/[^+\d]/g, '');
      const message = getFormattedMessage(contact.name);
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        // Update last contact timestamp
        try {
          await ContactService.updateContact(contact.id, {
            lastContact: new Date().toISOString()
          });
        } catch (error) {
          console.warn('Failed to update last contact:', error);
        }
      } else {
        Alert.alert('Error', 'WhatsApp is not installed');
      }
    } finally {
      setIsLoading(prev => ({ ...prev, whatsapp: false }));
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ContactService.deleteContact(contact.id);
              onDelete(contact.id);
              onClose();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete contact');
            }
          },
        },
      ]
    );
  };

  const handleGroupSelection = (selectedGroupIds: string[]) => {
    if (onAddContactsToGroups && contact) {
      onAddContactsToGroups([contact.id], selectedGroupIds);
      setShowGroupModal(false);
    }
  };

  const handleCreateGroup = async (groupData: Omit<Group, 'id' | 'createdAt' | 'updatedAt' | 'contactCount'>) => {
    if (onCreateGroup) {
      await onCreateGroup(groupData);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Contact Details</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => onEdit(contact)}
              style={styles.headerButton}
            >
              <Ionicons name="create-outline" size={24} color="#2563EB" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              style={[styles.headerButton, { marginLeft: 12 }]}
            >
              <Ionicons name="trash-outline" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Business Card Image */}
          {contact.imageUrl && (
            <TouchableOpacity
              style={styles.imageContainer}
              onPress={() => setShowFullscreenImage(true)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: contact.imageUrl }}
                style={styles.cardImage}
                resizeMode="contain"
              />
              <View style={styles.imageOverlay}>
                <Ionicons name="expand-outline" size={24} color="#FFFFFF" />
                <Text style={styles.imageHintText}>Tap to view fullscreen</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Contact Info */}
          <View style={styles.infoSection}>
            <Text style={styles.name}>{contact.name || 'No Name'}</Text>
            {contact.jobTitle && (
              <Text style={styles.jobTitle}>{contact.jobTitle}</Text>
            )}
            {contact.company && (
              <Text style={styles.company}>{contact.company}</Text>
            )}
          </View>

          {/* Phone Numbers */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Phone Numbers</Text>

            {/* Primary Phone */}
            {contact.phone && (
              <TouchableOpacity
                style={styles.infoRow}
                onPress={() => handleCall(contact.phone)}
                accessibilityLabel={`Call ${contact.phone}`}
                accessibilityHint="Opens phone dialer to call this number"
                accessibilityRole="button"
              >
                <Ionicons name="call-outline" size={20} color="#6B7280" />
                <Text style={styles.infoText}>{contact.phone}</Text>
                <TouchableOpacity
                  onPress={() => handleWhatsApp(contact.phone)}
                  style={styles.actionButton}
                  disabled={isLoading.whatsapp}
                  accessibilityLabel={`Message ${contact.name} on WhatsApp`}
                  accessibilityHint="Opens WhatsApp to message this contact"
                  accessibilityRole="button"
                >
                  {isLoading.whatsapp ? (
                    <ActivityIndicator size="small" color="#25D366" />
                  ) : (
                    <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                  )}
                </TouchableOpacity>
              </TouchableOpacity>
            )}

            {/* Mobile 1 */}
            {contact.phones?.mobile1 && contact.phones.mobile1 !== contact.phone && (
              <TouchableOpacity
                style={styles.infoRow}
                onPress={() => contact.phones?.mobile1 && handleCall(contact.phones.mobile1)}
              >
                <Ionicons name="phone-portrait-outline" size={20} color="#6B7280" />
                <View style={styles.phoneInfo}>
                  <Text style={styles.infoText}>{contact.phones.mobile1}</Text>
                  <Text style={styles.phoneLabel}>Mobile 1</Text>
                </View>
                <TouchableOpacity
                  onPress={() => contact.phones?.mobile1 && handleWhatsApp(contact.phones.mobile1)}
                  style={styles.actionButton}
                  disabled={isLoading.whatsapp}
                >
                  {isLoading.whatsapp ? (
                    <ActivityIndicator size="small" color="#25D366" />
                  ) : (
                    <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                  )}
                </TouchableOpacity>
              </TouchableOpacity>
            )}

            {/* Mobile 2 */}
            {contact.phones?.mobile2 && (
              <TouchableOpacity
                style={styles.infoRow}
                onPress={() => contact.phones?.mobile2 && handleCall(contact.phones.mobile2)}
              >
                <Ionicons name="phone-portrait-outline" size={20} color="#6B7280" />
                <View style={styles.phoneInfo}>
                  <Text style={styles.infoText}>{contact.phones.mobile2}</Text>
                  <Text style={styles.phoneLabel}>Mobile 2</Text>
                </View>
                <TouchableOpacity
                  onPress={() => contact.phones?.mobile2 && handleWhatsApp(contact.phones.mobile2)}
                  style={styles.actionButton}
                  disabled={isLoading.whatsapp}
                >
                  {isLoading.whatsapp ? (
                    <ActivityIndicator size="small" color="#25D366" />
                  ) : (
                    <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                  )}
                </TouchableOpacity>
              </TouchableOpacity>
            )}

            {/* Office */}
            {contact.phones?.office && (
              <TouchableOpacity
                style={styles.infoRow}
                onPress={() => contact.phones?.office && handleCall(contact.phones.office)}
              >
                <Ionicons name="business-outline" size={20} color="#6B7280" />
                <View style={styles.phoneInfo}>
                  <Text style={styles.infoText}>{contact.phones.office}</Text>
                  <Text style={styles.phoneLabel}>Office</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Fax */}
            {contact.phones?.fax && (
              <View style={styles.infoRow}>
                <Ionicons name="print-outline" size={20} color="#6B7280" />
                <View style={styles.phoneInfo}>
                  <Text style={styles.infoText}>{contact.phones.fax}</Text>
                  <Text style={styles.phoneLabel}>Fax</Text>
                </View>
              </View>
            )}

            {/* No phone numbers */}
            {!contact.phone && !contact.phones?.mobile1 && !contact.phones?.mobile2 &&
             !contact.phones?.office && !contact.phones?.fax && (
              <Text style={styles.noInfo}>No phone numbers available</Text>
            )}
          </View>

          {/* Email */}
          {contact.email && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Email</Text>
              <TouchableOpacity style={styles.infoRow} onPress={handleEmail}>
                <Ionicons name="mail-outline" size={20} color="#6B7280" />
                <Text style={styles.infoText}>{contact.email}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Address */}
          {contact.address && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Address</Text>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color="#6B7280" />
                <Text style={[styles.infoText, { flex: 1 }]}>{contact.address}</Text>
              </View>
            </View>
          )}

          {/* Groups */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Groups</Text>
              {onAddContactsToGroups && (
                <TouchableOpacity
                  onPress={() => setShowGroupModal(true)}
                  style={styles.manageButton}
                  accessibilityLabel="Manage groups"
                  accessibilityHint="Add or remove this contact from groups"
                  accessibilityRole="button"
                >
                  <Ionicons name="add-circle-outline" size={20} color="#2563EB" />
                  <Text style={styles.manageButtonText}>Manage</Text>
                </TouchableOpacity>
              )}
            </View>

            {contact.groupIds && contact.groupIds.length > 0 ? (
              <View style={styles.groupsList}>
                {contact.groupIds.map((groupId) => {
                  const group = groups.find((g) => g.id === groupId);
                  if (!group) return null;

                  return (
                    <View key={groupId} style={styles.groupBadge}>
                      <View style={[styles.groupColorDot, { backgroundColor: group.color }]} />
                      {group.icon && (
                        <Ionicons name={group.icon as any} size={14} color="#6B7280" style={{ marginRight: 4 }} />
                      )}
                      <Text style={styles.groupBadgeText}>{group.name}</Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.noGroupsContainer}>
                <Text style={styles.noInfo}>Not in any groups</Text>
                {onAddContactsToGroups && (
                  <TouchableOpacity
                    onPress={() => setShowGroupModal(true)}
                    style={styles.addToGroupButton}
                  >
                    <Ionicons name="add-outline" size={18} color="#2563EB" />
                    <Text style={styles.addToGroupText}>Add to group</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Metadata */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Added:</Text>
              <Text style={styles.metaValue}>{contact.addedDate}</Text>
            </View>
            {contact.lastContact && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Last Contact:</Text>
                <Text style={styles.metaValue}>
                  {new Date(contact.lastContact).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Fullscreen Image Modal */}
      <Modal
        visible={showFullscreenImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFullscreenImage(false)}
      >
        <StatusBar hidden />
        <View style={styles.fullscreenImageContainer}>
          <TouchableOpacity
            style={styles.fullscreenClose}
            onPress={() => setShowFullscreenImage(false)}
          >
            <Ionicons name="close-circle" size={40} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.fullscreenImageTouchable}
            activeOpacity={0.9}
            onPress={() => setShowFullscreenImage(false)}
          >
            <Image
              source={{ uri: contact.imageUrl || '' }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Group Selection Modal */}
      <GroupSelectionModal
        visible={showGroupModal}
        groups={groups}
        selectedContactCount={1}
        onClose={() => setShowGroupModal(false)}
        onSelectGroups={handleGroupSelection}
        onCreateGroup={handleCreateGroup}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    backgroundColor: '#FFFFFF',
    marginVertical: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  cardImage: {
    width: width - 32,
    height: 200,
    resizeMode: 'contain' as const,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageHintText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  fullscreenClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  fullscreenImageContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImageTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: width,
    height: height,
  },
  infoSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  jobTitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 2,
  },
  company: {
    fontSize: 18,
    fontWeight: '500',
    color: '#374151',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  phoneInfo: {
    flex: 1,
    marginLeft: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
    flex: 1,
  },
  phoneLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  actionButton: {
    padding: 8,
  },
  noInfo: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  metaLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  metaValue: {
    fontSize: 14,
    color: '#111827',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    marginLeft: 4,
  },
  groupsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  groupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  groupColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  groupBadgeText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  noGroupsContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  addToGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
  },
  addToGroupText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    marginLeft: 6,
  },
});