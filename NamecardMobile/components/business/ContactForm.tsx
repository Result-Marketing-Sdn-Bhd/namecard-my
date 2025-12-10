import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Contact } from '../../types';
import { TopLoader } from '../common/TopLoader';
import { GeminiOCRService } from '../../services/geminiOCR';
import { useIntroMessage } from '../../hooks/useIntroMessage';

interface ContactFormProps {
  scannedData: Partial<Contact> | null;
  imageUri?: string;
  backImageUri?: string;
  processOCR?: boolean;
  onSave: (contactData: Partial<Contact>) => void;
  onBack: () => void;
  onCaptureBackImage?: () => void;
}

export function ContactForm({ scannedData, imageUri, backImageUri, processOCR, onSave, onBack, onCaptureBackImage }: ContactFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const { getFormattedMessage } = useIntroMessage();
  const [formData, setFormData] = useState({
    name: scannedData?.name || '',
    jobTitle: scannedData?.jobTitle || '',
    company: scannedData?.company || '',
    phone: scannedData?.phone || '',
    phones: {
      mobile1: scannedData?.phones?.mobile1 || '',
      mobile2: scannedData?.phones?.mobile2 || '',
      office: scannedData?.phones?.office || '',
      fax: scannedData?.phones?.fax || '',
    },
    email: scannedData?.email || '',
    address: scannedData?.address || '',
  });
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [frontImageUri, setFrontImageUri] = useState(imageUri || scannedData?.imageUrl || '');
  const [backImageState, setBackImageState] = useState(backImageUri || '');

  useEffect(() => {
    if (imageUri && processOCR) {
      performOCR();
    }
  }, [imageUri, processOCR]);

  // Re-run OCR when back image is captured
  useEffect(() => {
    if (backImageUri) {
      setBackImageState(backImageUri);
      if (frontImageUri) {
        performDualOCR();
      }
    }
  }, [backImageUri]);

  const performOCR = async () => {
    if (!imageUri) return;

    setIsProcessingOCR(true);
    setOcrProgress(0.2);

    try {
      console.log('🔍 Starting background OCR processing...');

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setOcrProgress(prev => Math.min(prev + 0.1, 0.8));
      }, 200);

      // Process OCR using Gemini 2.0 Flash
      const ocrData = await GeminiOCRService.processBusinessCard(imageUri);

      clearInterval(progressInterval);
      setOcrProgress(0.9);

      // Animate field updates
      updateFormWithOCRData(ocrData);

      setOcrProgress(1);
      console.log('✅ OCR processing completed:', ocrData);

      // Hide loader after a brief moment
      setTimeout(() => {
        setIsProcessingOCR(false);
      }, 500);

    } catch (error) {
      console.error('❌ OCR processing failed:', error);
      setOcrProgress(1);
      setTimeout(() => {
        setIsProcessingOCR(false);
      }, 500);

      // Don't show error alert - user can still manually enter data
    }
  };

  const performDualOCR = async () => {
    if (!frontImageUri || !backImageState) return;

    setIsProcessingOCR(true);
    setOcrProgress(0.2);

    try {
      console.log('🔍 Starting dual-sided OCR processing...');

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setOcrProgress(prev => Math.min(prev + 0.1, 0.7));
      }, 200);

      // Process both images
      const [frontData, backData] = await Promise.all([
        GeminiOCRService.processBusinessCard(frontImageUri),
        GeminiOCRService.processBusinessCard(backImageState)
      ]);

      clearInterval(progressInterval);
      setOcrProgress(0.9);

      console.log('📄 Front data:', frontData);
      console.log('📄 Back data:', backData);

      // Merge data from both sides (front takes priority, back fills in missing info)
      const mergedData = mergeCardData(frontData, backData);
      console.log('🔀 Merged data:', mergedData);

      // Update form with merged data
      updateFormWithOCRData(mergedData);

      setOcrProgress(1);
      console.log('✅ Dual OCR processing completed');

      // Hide loader after a brief moment
      setTimeout(() => {
        setIsProcessingOCR(false);
      }, 500);

    } catch (error) {
      console.error('❌ Dual OCR processing failed:', error);
      setOcrProgress(1);
      setTimeout(() => {
        setIsProcessingOCR(false);
      }, 500);
    }
  };

  // Helper function to merge data from front and back of card
  const mergeCardData = (front: Partial<Contact>, back: Partial<Contact>): Partial<Contact> => {
    return {
      name: front.name || back.name || '',
      jobTitle: front.jobTitle || back.jobTitle || '',
      company: front.company || back.company || '',
      phone: front.phone || back.phone || '',
      phones: {
        mobile1: front.phones?.mobile1 || back.phones?.mobile1 || '',
        mobile2: front.phones?.mobile2 || back.phones?.mobile2 || '',
        office: front.phones?.office || back.phones?.office || '',
        fax: front.phones?.fax || back.phones?.fax || '',
      },
      email: front.email || back.email || '',
      address: front.address || back.address || '',
    };
  };

  // Helper function to update form with OCR data
  const updateFormWithOCRData = async (ocrData: Partial<Contact>) => {
    if (ocrData.name) {
      setFormData(prev => ({ ...prev, name: ocrData.name || '' }));
    }
    await new Promise(resolve => setTimeout(resolve, 100));

    if (ocrData.jobTitle) {
      setFormData(prev => ({ ...prev, jobTitle: ocrData.jobTitle || '' }));
    }
    await new Promise(resolve => setTimeout(resolve, 100));

    if (ocrData.company) {
      setFormData(prev => ({ ...prev, company: ocrData.company || '' }));
    }
    await new Promise(resolve => setTimeout(resolve, 100));

    // Handle multiple phone numbers
    if (ocrData.phones) {
      setFormData(prev => ({
        ...prev,
        phone: ocrData.phone || '',
        phones: {
          mobile1: ocrData.phones?.mobile1 || '',
          mobile2: ocrData.phones?.mobile2 || '',
          office: ocrData.phones?.office || '',
          fax: ocrData.phones?.fax || '',
        }
      }));
    } else if (ocrData.phone) {
      setFormData(prev => ({ ...prev, phone: ocrData.phone || '' }));
    }
    await new Promise(resolve => setTimeout(resolve, 100));

    if (ocrData.email) {
      setFormData(prev => ({ ...prev, email: ocrData.email || '' }));
    }
    await new Promise(resolve => setTimeout(resolve, 100));

    if (ocrData.address) {
      setFormData(prev => ({ ...prev, address: ocrData.address || '' }));
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (phoneType: 'mobile1' | 'mobile2' | 'office' | 'fax', value: string) => {
    setFormData(prev => ({
      ...prev,
      phones: {
        ...prev.phones,
        [phoneType]: value,
      },
      // Update primary phone if it's the first mobile number
      ...(phoneType === 'mobile1' ? { phone: value } : {})
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    setIsSaving(true);
    try {
      // Use front image as primary, but could store both in future
      // Include the id if we're editing an existing contact
      await onSave({
        ...formData,
        id: scannedData?.id, // Preserve the id for updates
        imageUrl: frontImageUri,
        backImageUrl: backImageState || undefined,
        phones: formData.phones
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleWhatsAppIntro = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    // Get the primary phone number (prioritize mobile1, then mobile2, then office, then phone)
    const whatsappPhone = formData.phones.mobile1 ||
                          formData.phones.mobile2 ||
                          formData.phones.office ||
                          formData.phone;

    if (!whatsappPhone?.trim()) {
      Alert.alert('Error', 'Please enter a phone number for WhatsApp');
      return;
    }

    try {
      // Clean phone number (remove spaces, dashes, etc.)
      let cleanPhone = whatsappPhone.replace(/[^+\d]/g, '');

      // Add Malaysian country code if not present
      if (cleanPhone.startsWith('01')) {
        // Malaysian mobile number starting with 01, replace 0 with 60
        cleanPhone = '60' + cleanPhone.substring(1);
      } else if (cleanPhone.startsWith('0')) {
        // Other Malaysian numbers starting with 0, replace 0 with 60
        cleanPhone = '60' + cleanPhone.substring(1);
      } else if (!cleanPhone.startsWith('60') && !cleanPhone.startsWith('+')) {
        // Number without country code, assume Malaysian
        cleanPhone = '60' + cleanPhone;
      } else if (cleanPhone.startsWith('+')) {
        // Remove + sign for WhatsApp URL
        cleanPhone = cleanPhone.substring(1);
      }

      // Get user's personalized introduction message
      const introMessage = getFormattedMessage(formData.name);

      // Create WhatsApp URL
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(introMessage)}`;

      // Check if WhatsApp can be opened
      const canOpen = await Linking.canOpenURL(whatsappUrl);

      if (canOpen) {
        // Save the contact first
        await handleSave();
        // Then open WhatsApp
        await Linking.openURL(whatsappUrl);
      } else {
        Alert.alert('Error', 'WhatsApp is not installed on this device');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open WhatsApp');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Loader Bar */}
      <TopLoader isLoading={isProcessingOCR} progress={ocrProgress} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Horizontal Scrollable Image Section */}
        <View style={styles.imagesSection}>
          <Text style={styles.imagesSectionTitle}>Business Card Images</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imagesScrollView}
            contentContainerStyle={styles.imagesScrollContent}
          >
            {/* Front Image */}
            {frontImageUri && (
              <View style={styles.imageSlot}>
                <Image
                  source={{ uri: frontImageUri }}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
                <View style={styles.imageLabel}>
                  <Text style={styles.imageLabelText}>Front</Text>
                </View>
                {isProcessingOCR && !backImageState && (
                  <View style={styles.ocrOverlay}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.ocrText}>Processing...</Text>
                  </View>
                )}
              </View>
            )}

            {/* Back Image or Placeholder */}
            {onCaptureBackImage && (
              <TouchableOpacity
                style={styles.imageSlot}
                onPress={onCaptureBackImage}
                activeOpacity={0.7}
              >
                {backImageState ? (
                  <>
                    <Image
                      source={{ uri: backImageState }}
                      style={styles.cardImage}
                      resizeMode="cover"
                    />
                    <View style={styles.imageLabel}>
                      <Text style={styles.imageLabelText}>Back</Text>
                    </View>
                    {isProcessingOCR && (
                      <View style={styles.ocrOverlay}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text style={styles.ocrText}>Processing...</Text>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.placeholderContainer}>
                    <Ionicons name="camera-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.placeholderText}>Tap to scan</Text>
                    <Text style={styles.placeholderSubtext}>back of card</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Form fields */}
        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <Input
              label="Name *"
              value={formData.name}
              onChangeText={(text) => handleInputChange('name', text)}
              placeholder={isProcessingOCR ? "Extracting..." : "Enter name"}
            />
            {isProcessingOCR && !formData.name && (
              <ActivityIndicator size="small" color="#2563EB" style={styles.fieldLoader} />
            )}
          </View>

          <View style={styles.inputWrapper}>
            <Input
              label="Job Title"
              value={formData.jobTitle}
              onChangeText={(text) => handleInputChange('jobTitle', text)}
              placeholder={isProcessingOCR ? "Extracting..." : "Enter job title"}
            />
            {isProcessingOCR && !formData.jobTitle && (
              <ActivityIndicator size="small" color="#2563EB" style={styles.fieldLoader} />
            )}
          </View>

          <View style={styles.inputWrapper}>
            <Input
              label="Company"
              value={formData.company}
              onChangeText={(text) => handleInputChange('company', text)}
              placeholder={isProcessingOCR ? "Extracting..." : "Enter company"}
            />
            {isProcessingOCR && !formData.company && (
              <ActivityIndicator size="small" color="#2563EB" style={styles.fieldLoader} />
            )}
          </View>

          {/* Show multiple phone fields if any are detected */}
          {(formData.phones.mobile1 || formData.phones.mobile2 || formData.phones.office || formData.phones.fax) ? (
            <>
              {formData.phones.mobile1 && (
                <View style={styles.inputWrapper}>
                  <Input
                    label="Mobile 1"
                    value={formData.phones.mobile1}
                    onChangeText={(text) => handlePhoneChange('mobile1', text)}
                    placeholder="Enter mobile number"
                    keyboardType="phone-pad"
                  />
                </View>
              )}

              {formData.phones.mobile2 && (
                <View style={styles.inputWrapper}>
                  <Input
                    label="Mobile 2"
                    value={formData.phones.mobile2}
                    onChangeText={(text) => handlePhoneChange('mobile2', text)}
                    placeholder="Enter second mobile number"
                    keyboardType="phone-pad"
                  />
                </View>
              )}

              {formData.phones.office && (
                <View style={styles.inputWrapper}>
                  <Input
                    label="Office"
                    value={formData.phones.office}
                    onChangeText={(text) => handlePhoneChange('office', text)}
                    placeholder="Enter office number"
                    keyboardType="phone-pad"
                  />
                </View>
              )}

              {formData.phones.fax && (
                <View style={styles.inputWrapper}>
                  <Input
                    label="Fax"
                    value={formData.phones.fax}
                    onChangeText={(text) => handlePhoneChange('fax', text)}
                    placeholder="Enter fax number"
                    keyboardType="phone-pad"
                  />
                </View>
              )}
            </>
          ) : (
            <View style={styles.inputWrapper}>
              <Input
                label="Phone"
                value={formData.phone}
                onChangeText={(text) => handleInputChange('phone', text)}
                placeholder={isProcessingOCR ? "Extracting..." : "Enter phone number"}
                keyboardType="phone-pad"
              />
              {isProcessingOCR && !formData.phone && (
                <ActivityIndicator size="small" color="#2563EB" style={styles.fieldLoader} />
              )}
            </View>
          )}

          <View style={styles.inputWrapper}>
            <Input
              label="Email"
              value={formData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              placeholder={isProcessingOCR ? "Extracting..." : "Enter email"}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {isProcessingOCR && !formData.email && (
              <ActivityIndicator size="small" color="#2563EB" style={styles.fieldLoader} />
            )}
          </View>

          <View style={styles.inputWrapper}>
            <Input
              label="Address"
              value={formData.address}
              onChangeText={(text) => handleInputChange('address', text)}
              placeholder={isProcessingOCR ? "Extracting..." : "Enter address"}
            />
            {isProcessingOCR && !formData.address && (
              <ActivityIndicator size="small" color="#2563EB" style={styles.fieldLoader} />
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom actions */}
      <View style={styles.actions}>
        <Button
          title={isSaving ? "Sending..." : "Send WhatsApp Intro"}
          onPress={handleWhatsAppIntro}
          disabled={!formData.name.trim() || isSaving}
          style={styles.primaryButton}
        />

        <Button
          title={isSaving ? "Saving..." : "Save Contact"}
          onPress={handleSave}
          variant="outline"
          disabled={!formData.name.trim() || isSaving}
          style={styles.secondaryButton}
        />
        
        <Text style={styles.saveNote}>
          Contact will be saved automatically
        </Text>
      </View>
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
    width: 32, // Same width as back button for centering
  },
  content: {
    flex: 1,
  },
  imagesSection: {
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  imagesSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  imagesScrollView: {
    paddingHorizontal: 16,
  },
  imagesScrollContent: {
    gap: 12,
  },
  imageSlot: {
    width: 280,
    height: 176,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imageLabel: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(37, 99, 235, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  imageLabelText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  form: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  actions: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  primaryButton: {
    marginBottom: 12,
  },
  secondaryButton: {
    marginBottom: 8,
  },
  saveNote: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  inputWrapper: {
    position: 'relative',
  },
  fieldLoader: {
    position: 'absolute',
    right: 16,
    top: 36,
  },
  ocrOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(37, 99, 235, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ocrText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
});