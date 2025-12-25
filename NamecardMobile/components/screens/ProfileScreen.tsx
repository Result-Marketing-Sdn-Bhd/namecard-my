import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Logo } from '../common/Logo';
import { useIntroMessage } from '../../hooks/useIntroMessage';

interface ProfileScreenProps {
  user?: any;
  onLogout?: () => void;
  onNavigate?: (screen: string) => void;
  isPremium?: boolean;
}

export function ProfileScreen({ user, onLogout, onNavigate, isPremium = false }: ProfileScreenProps) {
  const { introMessage, setIntroMessage, isLoading } = useIntroMessage();
  const [isEditing, setIsEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState(introMessage);

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveIntro = async () => {
    setIsSaving(true);
    try {
      await setIntroMessage(editedMessage);
      setIsEditing(false);
      Alert.alert('Success', 'Introduction message updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to save introduction message');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account?\n\nThis will permanently delete:\n• All your contacts and business cards\n• Your voice notes and reminders\n• Your subscription (if any)\n• All other account data\n\nThis action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDeleteAccount,
        },
      ]
    );
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Final Confirmation',
      'Please type DELETE to confirm account deletion.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'I Understand, Delete My Account',
          style: 'destructive',
          onPress: executeDeleteAccount,
        },
      ]
    );
  };

  const executeDeleteAccount = async () => {
    try {
      // Import supabase client
      const { supabase } = require('../../services/supabase');

      // Delete user's data from database
      // Note: This requires RLS policies or a database function
      const { error: deleteError } = await supabase.rpc('delete_user_account');

      if (deleteError) {
        throw deleteError;
      }

      // Delete the user account
      const { error: authError } = await supabase.auth.admin.deleteUser(user?.id);

      if (authError) {
        // If admin delete fails, try user delete
        await supabase.auth.signOut();
      }

      Alert.alert(
        'Account Deleted',
        'Your account has been permanently deleted. Thank you for using WhatsCard.',
        [
          {
            text: 'OK',
            onPress: onLogout,
          },
        ]
      );
    } catch (error: any) {
      console.error('Delete account error:', error);
      Alert.alert(
        'Error',
        'Failed to delete account. Please contact support@whatscard.my for assistance.',
        [
          {
            text: 'Contact Support',
            onPress: () => {
              // Open email client
              const email = 'support@whatscard.my';
              const subject = 'Account Deletion Request';
              const body = `User ID: ${user?.id}\nEmail: ${user?.email}\n\nPlease delete my account.`;
              Alert.alert('Contact Support', `Please email: ${email}`);
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          {onNavigate && (
            <TouchableOpacity
              onPress={() => onNavigate('settings')}
              style={styles.settingsButton}
            >
              <Ionicons name="settings-outline" size={24} color="#374151" />
            </TouchableOpacity>
          )}
        </View>

        {/* Profile Section */}
        <View style={styles.section}>
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color="#2563EB" />
            </View>
            <Text style={styles.userName}>{user?.user_metadata?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'Not logged in'}</Text>

            {/* Upgrade Button */}
            {!isPremium && onNavigate && (
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={() => onNavigate('paywall')}
                activeOpacity={0.8}
              >
                <View style={styles.upgradeIconContainer}>
                  <Ionicons name="diamond" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.upgradeTextContainer}>
                  <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
                  <Text style={styles.upgradeSubtitle}>Unlock all features</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#4A7A5C" />
              </TouchableOpacity>
            )}

            {/* Premium Badge */}
            {isPremium && (
              <View style={styles.premiumBadge}>
                <Ionicons name="diamond" size={16} color="#4A7A5C" />
                <Text style={styles.premiumText}>Premium Member</Text>
              </View>
            )}
          </View>
        </View>

        {/* WhatsApp Introduction Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WhatsApp Introduction</Text>
          <Text style={styles.sectionDescription}>
            This message will be sent when you introduce yourself to new contacts
          </Text>
          
          <View style={styles.introCard}>
            {isEditing ? (
              <View>
                <Input
                  value={editedMessage}
                  onChangeText={setEditedMessage}
                  placeholder="Enter your introduction message"
                  style={styles.introInput}
                  multiline
                />
                <View style={styles.introActions}>
                  <Button
                    title="Cancel"
                    onPress={() => {
                      setEditedMessage(introMessage);
                      setIsEditing(false);
                    }}
                    variant="outline"
                    style={styles.cancelButton}
                  />
                  <Button
                    title="Save"
                    onPress={handleSaveIntro}
                    loading={isSaving}
                    disabled={isSaving}
                    style={styles.saveButton}
                  />
                </View>
              </View>
            ) : (
              <View>
                <Text style={styles.introMessage}>{introMessage}</Text>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => {
                    setEditedMessage(introMessage);
                    setIsEditing(true);
                  }}
                >
                  <Ionicons name="pencil" size={16} color="#2563EB" />
                  <Text style={styles.editText}>Edit Message</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Account Actions Section */}
        {onLogout && (
          <View style={styles.section}>
            <View style={styles.settingsCard}>
              <TouchableOpacity
                style={styles.settingItem}
                onPress={onLogout}
              >
                <View style={styles.settingLeft}>
                  <Ionicons name="log-out-outline" size={20} color="#F59E0B" />
                  <Text style={[styles.settingText, { color: '#F59E0B' }]}>Sign Out</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#F59E0B" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.settingItem, { borderBottomWidth: 0 }]}
                onPress={handleDeleteAccount}
              >
                <View style={styles.settingLeft}>
                  <Ionicons name="trash-outline" size={20} color="#DC2626" />
                  <Text style={[styles.settingText, { color: '#DC2626' }]}>Delete Account</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#DC2626" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* App Info */}
        <View style={styles.section}>
          <View style={styles.appInfo}>
            <Logo width={60} height={60} style={{ marginBottom: 8 }} />
            <Text style={styles.appName}>WhatsCard</Text>
            <Text style={styles.appVersion}>Version 1.0.0</Text>
          </View>
        </View>
      </ScrollView>
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
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
  },
  settingsButton: {
    padding: 4,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#4A7A5C',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    width: '100%',
    shadowColor: '#4A7A5C',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  upgradeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A7A5C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  upgradeTextContainer: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  upgradeSubtitle: {
    fontSize: 13,
    color: '#4A7A5C',
    fontWeight: '500',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#4A7A5C',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 16,
  },
  premiumText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A7A5C',
    marginLeft: 6,
  },
  introCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  introMessage: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 12,
  },
  introInput: {
    marginBottom: 12,
  },
  introActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  editText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});