/**
 * DataConsentScreen - Apple Guideline 5.1.2 Compliance
 *
 * Shows users what data will be collected and uploaded to server
 * Requests explicit consent before accessing contacts
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CONSENT_STORAGE_KEY = '@whatscard_data_consent';

interface DataConsentScreenProps {
  onAccept: () => void;
  onDecline: () => void;
}

export const DataConsentScreen: React.FC<DataConsentScreenProps> = ({
  onAccept,
  onDecline,
}) => {
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAccept = async () => {
    try {
      setIsAccepting(true);

      // Save consent to storage
      await AsyncStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({
        consented: true,
        timestamp: new Date().toISOString(),
        version: '1.0',
      }));

      console.log('[DataConsent] ✅ User consented to data collection');
      onAccept();
    } catch (error) {
      console.error('[DataConsent] ❌ Error saving consent:', error);
      Alert.alert('Error', 'Failed to save consent. Please try again.');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = () => {
    Alert.alert(
      'Limited Functionality',
      'Without access to store your business cards, you can only view the app but cannot save contacts. You can change this later in Settings.',
      [
        {
          text: 'Go Back',
          style: 'cancel',
        },
        {
          text: 'Continue Without Saving',
          onPress: onDecline,
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={64} color="#4A7A5C" />
          </View>
          <Text style={styles.title}>Your Privacy Matters</Text>
          <Text style={styles.subtitle}>
            Please read how we handle your data
          </Text>
        </View>

        {/* What We Collect */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={24} color="#4A7A5C" />
            <Text style={styles.sectionTitle}>What We Collect</Text>
          </View>
          <Text style={styles.sectionText}>
            When you scan business cards or manually add contacts, we collect:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Contact names</Text>
            <Text style={styles.bulletItem}>• Phone numbers</Text>
            <Text style={styles.bulletItem}>• Email addresses</Text>
            <Text style={styles.bulletItem}>• Company information</Text>
            <Text style={styles.bulletItem}>• Business card images (if scanned)</Text>
          </View>
        </View>

        {/* Where Data Goes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cloud-upload" size={24} color="#4A7A5C" />
            <Text style={styles.sectionTitle}>Where Your Data Goes</Text>
          </View>
          <Text style={styles.sectionText}>
            Your contact data will be securely uploaded to our server (Supabase) and stored encrypted for:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Syncing across your devices</Text>
            <Text style={styles.bulletItem}>• Backup and recovery</Text>
            <Text style={styles.bulletItem}>• Accessing your contacts from anywhere</Text>
          </View>
          <View style={styles.guaranteeBox}>
            <Ionicons name="lock-closed" size={20} color="#10B981" />
            <Text style={styles.guaranteeText}>
              Your data is encrypted and never shared with third parties
            </Text>
          </View>
        </View>

        {/* How We Use It */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="settings" size={24} color="#4A7A5C" />
            <Text style={styles.sectionTitle}>How We Use Your Data</Text>
          </View>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• Store your business card contacts</Text>
            <Text style={styles.bulletItem}>• Enable contact search and management</Text>
            <Text style={styles.bulletItem}>• Sync data across your devices (if signed in)</Text>
            <Text style={styles.bulletItem}>• Provide backup and restore functionality</Text>
          </View>
          <Text style={styles.importantText}>
            We will NEVER sell or share your contact data with anyone.
          </Text>
        </View>

        {/* Your Rights */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="hand-right" size={24} color="#4A7A5C" />
            <Text style={styles.sectionTitle}>Your Rights</Text>
          </View>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• You can delete your data anytime from Settings</Text>
            <Text style={styles.bulletItem}>• You can export all your data</Text>
            <Text style={styles.bulletItem}>• You can revoke this consent in Settings</Text>
            <Text style={styles.bulletItem}>• You can use the app offline (data stays on device only)</Text>
          </View>
        </View>

        {/* Legal Notice */}
        <View style={styles.legalSection}>
          <Text style={styles.legalText}>
            By tapping "I Agree", you consent to the collection, storage, and use of your contact data as described above. You can review our full{' '}
            <Text style={styles.link}>Privacy Policy</Text> and{' '}
            <Text style={styles.link}>Terms of Service</Text> at any time.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.acceptButton, isAccepting && styles.acceptButtonDisabled]}
            onPress={handleAccept}
            disabled={isAccepting}
          >
            <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
            <Text style={styles.acceptButtonText}>
              {isAccepting ? 'Processing...' : 'I Agree - Continue'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.declineButton}
            onPress={handleDecline}
            disabled={isAccepting}
          >
            <Text style={styles.declineButtonText}>No Thanks - Use Without Saving</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F5ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 12,
  },
  sectionText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 12,
  },
  bulletList: {
    marginLeft: 8,
  },
  bulletItem: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 4,
  },
  guaranteeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  guaranteeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 8,
    flex: 1,
  },
  importantText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#059669',
    marginTop: 12,
    textAlign: 'center',
  },
  legalSection: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  legalText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 20,
  },
  link: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  buttonContainer: {
    marginTop: 8,
  },
  acceptButton: {
    backgroundColor: '#4A7A5C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#4A7A5C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptButtonDisabled: {
    opacity: 0.6,
  },
  acceptButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  declineButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  bottomSpacing: {
    height: 40,
  },
});

/**
 * Check if user has consented to data collection
 */
export const hasDataConsent = async (): Promise<boolean> => {
  try {
    const consentData = await AsyncStorage.getItem(CONSENT_STORAGE_KEY);
    if (!consentData) return false;

    const consent = JSON.parse(consentData);
    return consent.consented === true;
  } catch (error) {
    console.error('[DataConsent] ❌ Error checking consent:', error);
    return false;
  }
};

/**
 * Revoke data consent (for Settings)
 */
export const revokeDataConsent = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(CONSENT_STORAGE_KEY);
    console.log('[DataConsent] 🗑️ Consent revoked');
  } catch (error) {
    console.error('[DataConsent] ❌ Error revoking consent:', error);
  }
};
