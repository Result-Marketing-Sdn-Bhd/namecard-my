import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  ActivityIndicator,
  AppState,
  AppStateStatus,
  Platform,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Contact } from '../../types';
import { GeminiOCRService } from '../../services/geminiOCR';
import { autoCropBusinessCard } from '../../utils/imageProcessing';
import { LocalStorage } from '../../services/localStorage';
import { ContactService } from '../../services/contactService';
import { scanLimitService } from '../../services/scanLimitService';

const { width, height } = Dimensions.get('window');

interface CameraScreenProps {
  onScanCard: (cardData: Partial<Contact>) => void;
  onNavigateToForm: (imageUri: string, processOCR: boolean) => void;
  onNavigateToSettings?: () => void;
  currentUser?: any;
  isPremiumUser?: boolean;
  onShowPaywall?: () => void;
}

export function CameraScreen({
  onScanCard,
  onNavigateToForm,
  onNavigateToSettings,
  currentUser,
  isPremiumUser,
  onShowPaywall
}: CameraScreenProps) {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false); // Start as false to ensure initialization
  const [cameraKey, setCameraKey] = useState(0); // Force remount key
  const cameraRef = useRef<CameraView>(null);
  const appState = useRef(AppState.currentState);
  const insets = useSafeAreaInsets(); // Get safe area insets for proper positioning

  // Reinitialize camera when screen comes into focus (React Navigation)
  useFocusEffect(
    useCallback(() => {
      console.log('📷 CameraScreen focused - initializing camera');
      setIsCameraReady(false);

      // Force a fresh camera instance
      setCameraKey(prev => prev + 1);

      // Allow camera to initialize
      const timer = setTimeout(() => {
        console.log('✅ Camera ready');
        setIsCameraReady(true);
      }, 500);

      // Cleanup when screen loses focus
      return () => {
        console.log('📷 CameraScreen unfocused - releasing camera');
        clearTimeout(timer);
        setIsCameraReady(false);
      };
    }, [])
  );

  // Request camera permissions on mount
  useEffect(() => {
    if (!permission?.granted && permission?.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    // App going to background or inactive
    if (
      appState.current.match(/active/) &&
      nextAppState.match(/inactive|background/)
    ) {
      console.log('📱 App going to background - camera will be released');
      setIsCameraReady(false);
    }

    // App coming back to foreground
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      console.log('📱 App returning to foreground - reinitializing camera');
      // Force camera remount to re-establish session
      setCameraKey(prev => prev + 1);

      // Small delay to ensure camera is fully re-initialized
      setTimeout(() => {
        setIsCameraReady(true);
      }, 300);
    }

    appState.current = nextAppState;
  };

  const handleCapture = async () => {
    // Validate camera is ready
    if (!cameraRef.current || isScanning || !isCameraReady) {
      if (!isCameraReady) {
        Alert.alert(
          'Camera Not Ready',
          'Camera is initializing. Please wait a moment and try again.',
          [{ text: 'OK', style: 'default' }]
        );
      }
      return;
    }

    // 🔒 SCAN LIMIT CHECK (for authenticated users)
    if (currentUser?.id && !isPremiumUser) {
      try {
        // Check if user can scan
        const scanInfo = await scanLimitService.canUserScan(currentUser.id);

        if (!scanInfo.canScan) {
          // Limit reached - show paywall
          Alert.alert(
            '📸 Daily Limit Reached',
            `You've used all ${scanInfo.dailyLimit} free scans today.\n\n` +
            `Upgrade to Premium for unlimited scanning!`,
            [
              {
                text: 'Maybe Tomorrow',
                style: 'cancel',
                onPress: () => {
                  console.log('User declined upgrade');
                }
              },
              {
                text: 'Upgrade to Premium',
                style: 'default',
                onPress: () => {
                  console.log('User wants to upgrade');
                  onShowPaywall?.();
                }
              }
            ]
          );
          return; // Don't allow scan
        }

        // Show gentle reminder when approaching limit
        if (scanInfo.scansRemaining === 2) {
          console.log('⚠️ User has 2 scans remaining');
        } else if (scanInfo.scansRemaining === 1) {
          console.log('⚠️ User has 1 scan remaining');
        }
      } catch (error) {
        console.error('❌ Error checking scan limit:', error);
        // Continue with scan even if check fails (offline mode)
      }
    }

    setIsScanning(true);
    try {
      // Take photo with proper settings
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64: false,
        exif: true, // Include EXIF data for proper orientation
        skipProcessing: false, // Allow processing for orientation fixes
      });

      console.log('📸 Photo captured, auto-cropping to frame area...');

      // Auto-crop the business card to the exact frame area
      const croppedImage = await autoCropBusinessCard(photo.uri);
      console.log('✂️ Image auto-cropped to frame boundaries');

      // 📊 INCREMENT SCAN COUNT (for authenticated non-premium users)
      if (currentUser?.id && !isPremiumUser) {
        try {
          const result = await scanLimitService.incrementScanCount(currentUser.id);
          console.log(`✅ Scan count incremented: ${result.dailyCount} scans today`);

          // Show gentle reminder when approaching limit
          const remaining = 5 - result.dailyCount; // Assuming 5 is the free tier limit
          if (remaining === 2) {
            setTimeout(() => {
              Alert.alert(
                '📸 Almost at your limit!',
                `You have ${remaining} free scans remaining today.`,
                [{ text: 'OK', style: 'default' }]
              );
            }, 2000); // Show after 2 seconds
          } else if (remaining === 1) {
            setTimeout(() => {
              Alert.alert(
                '⚠️ Last free scan!',
                'This is your last free scan for today. Upgrade to Premium for unlimited scanning!',
                [
                  { text: 'OK', style: 'cancel' },
                  {
                    text: 'Upgrade',
                    onPress: () => onShowPaywall?.()
                  }
                ]
              );
            }, 2000);
          }
        } catch (error) {
          console.error('❌ Error incrementing scan count:', error);
          // Continue anyway (offline mode)
        }
      }

      // Navigate to form immediately with the cropped image
      // OCR will be processed in the background
      setIsScanning(false);
      onNavigateToForm(croppedImage.uri, true);

    } catch (error) {
      setIsScanning(false);
      console.error('❌ Capture failed:', error);

      Alert.alert(
        'Capture Failed',
        'Failed to capture image. The camera may need to reinitialize. Please try again in a moment.',
        [
          {
            text: 'Retry',
            onPress: () => {
              // Force camera reinit
              setIsCameraReady(false);
              setCameraKey(prev => prev + 1);
              setTimeout(() => setIsCameraReady(true), 500);
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color="#9CA3AF" />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            Please grant camera permission to scan business cards
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.logo}>
            <Ionicons name="camera" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.headerTitle}>WhatsCard</Text>
        </View>
        <TouchableOpacity onPress={onNavigateToSettings}>
          <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          key={cameraKey} // Force remount on app state changes
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
        />

        {/* Scanning frame overlay - moved outside CameraView */}
        <View style={styles.overlay}>
          <View style={styles.scanFrame}>
            <Text style={styles.scanText}>
              {!isCameraReady
                ? 'Initializing camera...'
                : isScanning
                ? 'Capturing...'
                : 'Position card within frame'}
            </Text>

            {/* Corner brackets for visual guidance */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>

        {/* Camera not ready indicator */}
        {!isCameraReady && (
          <View style={styles.cameraNotReadyOverlay}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.cameraNotReadyText}>Initializing camera...</Text>
          </View>
        )}
      </View>

      {/* Capture button */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.captureButton, isScanning && styles.captureButtonScanning]}
          onPress={handleCapture}
          disabled={isScanning}
          accessibilityLabel="Capture business card"
          accessibilityHint="Takes a photo of the business card in the frame"
          accessibilityRole="button"
        >
          {isScanning ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Ionicons name="camera" size={32} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      {/* Scanning overlay */}
      {isScanning && (
        <View style={styles.scanningOverlay}>
          <View style={styles.scanningModal}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.scanningText}>Capturing image...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
    backgroundColor: '#2563EB',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  scanFrame: {
    width: width * 0.8,
    height: width * 0.8 * 0.6, // Increased height by 20% (from 0.5 to 0.6)
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  scanText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#FFFFFF',
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  controls: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  captureButtonScanning: {
    backgroundColor: '#1D4ED8',
  },
  scanningOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scanningText: {
    fontSize: 16,
    color: '#374151',
    marginTop: 12,
  },
  cameraNotReadyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraNotReadyText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '500',
  },
});