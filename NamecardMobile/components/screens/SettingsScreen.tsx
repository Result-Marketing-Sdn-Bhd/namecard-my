import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Updates from 'expo-updates';

interface SettingsScreenProps {
  onBack: () => void;
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);

  // Check for OTA updates
  const checkForUpdates = async () => {
    try {
      setIsCheckingUpdates(true);

      // Check if updates are available
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        Alert.alert(
          '🔄 Update Available',
          'A new update is available. Would you like to download and install it now?',
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Update Now',
              onPress: async () => {
                try {
                  await Updates.fetchUpdateAsync();
                  Alert.alert(
                    '✅ Update Downloaded',
                    'The update has been downloaded. The app will restart now to apply the update.',
                    [
                      {
                        text: 'Restart',
                        onPress: async () => {
                          await Updates.reloadAsync();
                        },
                      },
                    ]
                  );
                } catch (error) {
                  Alert.alert('Error', 'Failed to download update. Please try again.');
                  console.error('Update fetch error:', error);
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('✅ Up to Date', 'You are running the latest version of WhatsCard!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to check for updates. Please check your internet connection.');
      console.error('Update check error:', error);
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  // Settings removed - using standard manual workflow only

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Check for Updates Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.updateButton}
            onPress={checkForUpdates}
            disabled={isCheckingUpdates}
          >
            {isCheckingUpdates ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="cloud-download-outline" size={24} color="#FFFFFF" />
            )}
            <Text style={styles.updateButtonText}>
              {isCheckingUpdates ? 'Checking...' : 'Check for Updates'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.updateDescription}>
            Tap to manually check for the latest app updates
          </Text>
        </View>

        {/* Workflow Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scanning Workflow</Text>
          <Text style={styles.description}>
            WhatsCard uses a simple, manual workflow to ensure accuracy and control over your business card data.
          </Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How It Works:</Text>
          <View style={styles.workflow}>
            <View style={styles.workflowStep}>
              <Ionicons name="camera" size={24} color="#2563EB" />
              <Text style={styles.workflowText}>Scan Card</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#9CA3AF" />
            <View style={styles.workflowStep}>
              <Ionicons name="create" size={24} color="#2563EB" />
              <Text style={styles.workflowText}>Review & Edit</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#9CA3AF" />
            <View style={styles.workflowStep}>
              <Ionicons name="save" size={24} color="#2563EB" />
              <Text style={styles.workflowText}>Save Contact</Text>
            </View>
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.tipSection}>
          <Ionicons name="information-circle" size={20} color="#2563EB" />
          <Text style={styles.tipText}>
            After scanning, you'll always review the extracted information before saving. This ensures all your contact details are accurate.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#F9FAFB',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  workflow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  workflowStep: {
    alignItems: 'center',
    marginVertical: 8,
  },
  workflowText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  tipSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    marginLeft: 8,
    lineHeight: 20,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  updateDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
});