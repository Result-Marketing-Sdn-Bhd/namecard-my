import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Alert, ActivityIndicator, View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { CameraScreen } from './components/screens/CameraScreen';
import { ContactForm } from './components/business/ContactForm';
import { ContactList } from './components/screens/ContactList';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { PaywallScreen } from './components/screens/PaywallScreen';
import { Contact, Group } from './types';
import { ContactService } from './services/contactService';
import { GroupService } from './services/groupService';
import { SupabaseService } from './services/supabase';
import { AuthManager } from './services/authManager';
import { validateConfig } from './config/environment';
import { AuthScreen } from './components/screens/AuthScreen';
import { SplashScreen } from './components/screens/SplashScreen';
import { DataConsentScreen, hasDataConsent } from './components/screens/DataConsentScreen';
import { ContactDetailModal } from './components/business/ContactDetailModal';
import { useGroups } from './hooks/useGroups';
import { subscriptionCheckService } from './services/subscriptionCheckService';
import { scanLimitService } from './services/scanLimitService';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Styles defined before component
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 0, // SafeAreaView handles this automatically
  },
});

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2563EB',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default function App() {
  const navigationRef = useRef<any>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [scannedCardData, setScannedCardData] = useState<Partial<Contact> | null>(null);
  const [pendingImageUri, setPendingImageUri] = useState<string | undefined>(undefined);
  const [pendingBackImageUri, setPendingBackImageUri] = useState<string | undefined>(undefined);
  const [shouldProcessOCR, setShouldProcessOCR] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [showConsent, setShowConsent] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showContactDetail, setShowContactDetail] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isPremiumUser, setIsPremiumUser] = useState(false);

  // Initialize groups hook
  const {
    groups,
    createGroup,
    deleteGroup,
    addContactsToGroup,
    recalculateContactCounts,
  } = useGroups(contacts);

  // Check subscription status function (defined before useEffects that use it)
  const checkSubscriptionStatus = React.useCallback(async (userId: string) => {
    try {
      const isPremium = await subscriptionCheckService.isPremiumUser(userId);
      setIsPremiumUser(isPremium);

      // ✅ VALUE-FIRST APPROACH: Don't show paywall immediately!
      // Let users experience the app first (scan 5 cards for free)
      // Paywall will show automatically when they hit the scan limit
      // This improves conversion rate by 5-10x!
      console.log('✅ Subscription checked - isPremium:', isPremium);
      console.log('📱 User will experience value before seeing paywall');
    } catch (error) {
      console.error('⚠️ Failed to check subscription:', error);
      setIsPremiumUser(false);
    }
  }, []);

  // Initialize app and validate environment
  useEffect(() => {
    initializeApp();

    // SECURITY FIX: Setup auth listener with proper cleanup to prevent memory leak
    const unsubscribe = AuthManager.setupAuthListener(async (user) => {
      if (user) {
        // User signed in (not token refresh, which is handled silently)
        setIsAuthenticated(true);
        setCurrentUser(user);
        console.log('✅ Auth state changed: User logged in');

        // Reload contacts after explicit login
        await loadContacts();
      } else {
        // User signed out
        setIsAuthenticated(false);
        setCurrentUser(null);
        setContacts([]);
        console.log('📤 Auth state changed: User logged out');
      }
    });

    // Cleanup function to unsubscribe from auth listener
    return () => {
      console.log('🧹 Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  // Check subscription status when user logs in
  useEffect(() => {
    if (currentUser?.id && isAuthenticated) {
      checkSubscriptionStatus(currentUser.id);
    }
  }, [currentUser?.id, isAuthenticated, checkSubscriptionStatus]);

  const initializeApp = async () => {
    try {
      // Validate environment variables (optional for offline mode)
      const { isValid, missingKeys } = validateConfig();
      if (!isValid) {
        console.warn('⚠️ Missing API keys:', missingKeys);
        console.warn('📱 Running in offline mode');
      }

      // Initialize services (works offline)
      await ContactService.init();
      await GroupService.init();

      // Load contacts from local storage first
      await loadContacts();

      // Try to verify session (non-blocking)
      try {
        const { user, error } = await AuthManager.verifySession();
        if (user && !error) {
          setIsAuthenticated(true);
          setCurrentUser(user);
          console.log('✅ User authenticated, sync enabled');
        } else {
          console.log('📱 Running in guest mode');
        }
      } catch (authError) {
        console.log('📱 Auth check failed, continuing in offline mode');
      }

    } catch (error) {
      console.error('⚠️ App initialization warning:', error);
      // Continue without crashing
    } finally {
      setIsLoading(false);
    }
  };

  const loadContacts = async () => {
    try {
      const contactsData = await ContactService.getContacts();
      setContacts(contactsData);
      console.log('✅ Loaded contacts:', contactsData.length);
    } catch (error) {
      console.error('⚠️ Failed to load contacts:', error);
      // Always fallback to empty array
      setContacts([]);
    }
  };

  const handleScanCard = (cardData: Partial<Contact>) => {
    setScannedCardData(cardData);
  };

  const checkScanLimit = async (): Promise<boolean> => {
    if (!currentUser?.id) {
      console.log('⚠️ No user ID, allowing scan (offline mode)');
      return true;
    }

    try {
      const limitInfo = await scanLimitService.canUserScan(currentUser.id);

      if (!limitInfo.canScan) {
        Alert.alert(
          'Daily Limit Reached',
          `You've reached your daily scan limit of ${limitInfo.dailyLimit} scans. Upgrade to Premium for unlimited scans!`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Upgrade',
              style: 'default',
              onPress: () => setShowPaywall(true),
            },
          ]
        );
        return false;
      }

      console.log(`✅ Scan allowed - ${limitInfo.scansRemaining} scans remaining`);
      return true;
    } catch (error) {
      console.error('⚠️ Error checking scan limit:', error);
      // Allow scan on error (offline mode)
      return true;
    }
  };

  const handleNavigateToForm = async (imageUri: string, processOCR: boolean, isBackImage: boolean = false) => {
    // Check scan limit before proceeding (only for front image, not back image)
    if (!isBackImage) {
      const canScan = await checkScanLimit();
      if (!canScan) {
        return; // Don't proceed if limit reached
      }

      // Increment scan count
      if (currentUser?.id) {
        try {
          await scanLimitService.incrementScanCount(currentUser.id);
          console.log('✅ Scan count incremented');
        } catch (error) {
          console.error('⚠️ Failed to increment scan count:', error);
        }
      }
    }

    if (isBackImage) {
      // Capturing back image
      setPendingBackImageUri(imageUri);
      setShouldProcessOCR(false); // Don't auto-process, will be handled in ContactForm
    } else {
      // Capturing front image
      setPendingImageUri(imageUri);
      setPendingBackImageUri(undefined); // Clear any previous back image
      setShouldProcessOCR(processOCR);
      setScannedCardData(null); // Clear any previous scanned data
    }
  };

  const handleSaveContact = async (contactData: Partial<Contact>) => {
    try {
      console.log('💾 Saving contact:', contactData);

      let savedContact: Contact;

      // Check if we're editing an existing contact or creating a new one
      if (contactData.id) {
        // Update existing contact
        console.log('📝 Updating existing contact:', contactData.id);
        savedContact = await ContactService.updateContact(contactData.id, contactData);
        console.log('✅ Contact updated successfully:', savedContact);
      } else {
        // Create new contact
        console.log('➕ Creating new contact');
        savedContact = await ContactService.createContact(contactData);
        console.log('✅ Contact created successfully:', savedContact);
      }

      // Reload contacts from LocalStorage to ensure UI is in sync
      await loadContacts();

      // Clear scanned data and pending images
      setScannedCardData(null);
      setPendingImageUri(undefined);
      setPendingBackImageUri(undefined);
      setShouldProcessOCR(false);

      // Show non-blocking success message
      setTimeout(() => {
        const action = contactData.id ? 'updated' : 'created';
        Alert.alert('Success', `Contact "${savedContact.name}" ${action}!`,
          [{ text: 'OK', style: 'default' }],
          { cancelable: true }
        );
      }, 500);

    } catch (error) {
      console.error('Failed to save contact:', error);

      // This should rarely happen with offline-first approach
      const errorMessage = error instanceof Error ? error.message : 'Failed to save contact';
      Alert.alert(
        'Save Failed',
        errorMessage,
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setShowContactDetail(true);
  };

  const handleContactDelete = async (contactId: string) => {
    try {
      // Remove from local state
      setContacts(prevContacts => prevContacts.filter(c => c.id !== contactId));
      console.log('✅ Contact deleted:', contactId);
    } catch (error) {
      console.error('Failed to delete contact:', error);
      Alert.alert('Error', 'Failed to delete contact');
    }
  };

  const handleBulkContactDelete = async (contactIds: string[]) => {
    try {
      // Delete multiple contacts
      for (const contactId of contactIds) {
        await ContactService.deleteContact(contactId);
      }

      // Remove from local state
      setContacts(prevContacts => prevContacts.filter(c => !contactIds.includes(c.id)));
      console.log(`✅ ${contactIds.length} contacts deleted`);

      Alert.alert('Success', `${contactIds.length} contact${contactIds.length > 1 ? 's' : ''} deleted successfully`);
    } catch (error) {
      console.error('Failed to delete contacts:', error);
      Alert.alert('Error', 'Failed to delete contacts');
    }
  };

  const handleContactEdit = (contact: Contact) => {
    // Close modal
    setShowContactDetail(false);
    setSelectedContact(null);

    // Set the contact data for editing
    setScannedCardData(contact);
    setPendingImageUri(contact.imageUrl);
    setPendingBackImageUri(contact.backImageUrl);
    setShouldProcessOCR(false);

    // Use setTimeout to ensure state is updated before navigation
    setTimeout(() => {
      // Navigate to Camera tab, then to ContactForm screen
      if (navigationRef.current) {
        navigationRef.current.navigate('Camera', {
          screen: 'ContactForm'
        });
      }
    }, 100);
  };

  const handleAddContactsToGroups = async (contactIds: string[], groupIds: string[]) => {
    try {
      console.log('🔷 Adding contacts to groups:', { contactIds, groupIds });

      // Add contacts to each selected group
      for (const groupId of groupIds) {
        console.log('🔷 Adding to group:', groupId);
        await addContactsToGroup(contactIds, groupId);
      }

      // Reload contacts to get updated groupIds
      console.log('🔷 Reloading contacts...');
      await loadContacts();

      // Recalculate group contact counts
      console.log('🔷 Recalculating group counts...');
      await recalculateContactCounts();

      console.log('✅ Successfully added contacts to groups');
    } catch (error) {
      console.error('❌ Failed to add contacts to groups:', error);
      throw error;
    }
  };

  const handleCreateGroup = async (groupData: Omit<Group, 'id' | 'createdAt' | 'updatedAt' | 'contactCount'>): Promise<Group> => {
    try {
      console.log('🔷 Creating group:', groupData.name);
      const newGroup = await createGroup(groupData);
      console.log('✅ Group created successfully:', newGroup);
      return newGroup; // Return the created group so modal can get its ID
    } catch (error) {
      console.error('❌ Failed to create group:', error);
      Alert.alert('Error', 'Failed to create group');
      throw error; // Re-throw to maintain Promise<Group> type
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      console.log('🔷 Deleting group:', groupId);
      await deleteGroup(groupId);
      console.log('✅ Group deleted successfully');
      Alert.alert('Success', 'Group deleted');
    } catch (error) {
      console.error('❌ Failed to delete group:', error);
      Alert.alert('Error', 'Failed to delete group');
    }
  };


  // Camera Stack Navigator
  function CameraStack() {
    const CameraStackNavigator = createStackNavigator();

    return (
      <CameraStackNavigator.Navigator screenOptions={{ headerShown: false }}>
        <CameraStackNavigator.Screen name="CameraMain">
          {({ navigation }) => (
            <CameraScreen
              onScanCard={handleScanCard}
              onNavigateToForm={(imageUri, processOCR) => {
                // Always navigate to form for manual review
                handleNavigateToForm(imageUri, processOCR, false);
                navigation.navigate('ContactForm');
              }}
              onNavigateToSettings={() => navigation.navigate('Settings')}
              currentUser={currentUser}
              isPremiumUser={isPremiumUser}
              onShowPaywall={() => setShowPaywall(true)}
            />
          )}
        </CameraStackNavigator.Screen>
        <CameraStackNavigator.Screen name="ContactForm">
          {({ navigation }) => (
            <ContactForm
              scannedData={scannedCardData}
              imageUri={pendingImageUri}
              backImageUri={pendingBackImageUri}
              processOCR={shouldProcessOCR}
              onSave={async (contactData) => {
                await handleSaveContact(contactData);
                // Navigate back to camera after saving
                navigation.navigate('CameraMain');
              }}
              onBack={() => {
                setPendingImageUri(undefined);
                setPendingBackImageUri(undefined);
                setShouldProcessOCR(false);
                navigation.goBack();
              }}
              onCaptureBackImage={() => {
                // Navigate to camera to capture back image
                navigation.navigate('CameraBack');
              }}
            />
          )}
        </CameraStackNavigator.Screen>
        <CameraStackNavigator.Screen name="CameraBack">
          {({ navigation }) => (
            <CameraScreen
              onScanCard={handleScanCard}
              onNavigateToForm={(imageUri, processOCR) => {
                // Capture back image and return to form
                handleNavigateToForm(imageUri, processOCR, true);
                navigation.navigate('ContactForm');
              }}
              onNavigateToSettings={() => navigation.navigate('Settings')}
              currentUser={currentUser}
              isPremiumUser={isPremiumUser}
              onShowPaywall={() => setShowPaywall(true)}
            />
          )}
        </CameraStackNavigator.Screen>
        <CameraStackNavigator.Screen name="Settings">
          {({ navigation }) => (
            <SettingsScreen
              onBack={() => navigation.goBack()}
            />
          )}
        </CameraStackNavigator.Screen>
      </CameraStackNavigator.Navigator>
    );
  }

  // Contacts Stack Navigator
  function ContactsStack({ navigation }: any) {
    const ContactsNavigator = createStackNavigator();

    return (
      <ContactsNavigator.Navigator screenOptions={{ headerShown: false }}>
        <ContactsNavigator.Screen name="ContactList">
          {() => (
            <ContactList
              contacts={contacts}
              groups={groups}
              onContactSelect={handleContactSelect}
              onAddContact={() => {
                // Navigate to Camera tab to scan card
                navigation.navigate('Camera');
              }}
              onDeleteContacts={handleBulkContactDelete}
              onAddContactsToGroups={handleAddContactsToGroups}
              onCreateGroup={handleCreateGroup}
              onDeleteGroup={handleDeleteGroup}
            />
          )}
        </ContactsNavigator.Screen>
      </ContactsNavigator.Navigator>
    );
  }

  // Profile Stack Navigator
  function ProfileStack() {
    const ProfileStackNavigator = createStackNavigator();

    return (
      <ProfileStackNavigator.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <ProfileStackNavigator.Screen name="ProfileMain">
          {(props) => (
            <ProfileScreen
              {...props}
              user={currentUser}
              isPremium={false} // TODO: Connect to subscription state
              onNavigate={(screen) => {
                if (screen === 'paywall') {
                  props.navigation.navigate('Paywall');
                }
              }}
              onLogout={async () => {
                await SupabaseService.signOut();
                setIsAuthenticated(false);
                setCurrentUser(null);
                setContacts([]);
              }}
            />
          )}
        </ProfileStackNavigator.Screen>
        <ProfileStackNavigator.Screen
          name="Paywall"
          component={PaywallScreen}
          options={{
            headerShown: true,
            headerTitle: 'Upgrade to Premium',
            headerBackTitle: 'Back',
            presentation: 'modal',
          }}
        />
      </ProfileStackNavigator.Navigator>
    );
  }


  // Handle successful authentication
  const handleAuthSuccess = async (user: any) => {
    setCurrentUser(user);
    setIsAuthenticated(true);

    // Initialize app after authentication
    await SupabaseService.initializeStorage();
    await loadContacts();

    // Check subscription status and potentially show paywall
    if (user?.id) {
      await checkSubscriptionStatus(user.id);
    }
  };

  // Show splash screen
  if (showSplash) {
    return (
      <>
        <StatusBar style="light" />
        <SplashScreen onFinish={async () => {
          setShowSplash(false);
          // Check if user has given consent
          const consent = await hasDataConsent();
          if (!consent) {
            setShowConsent(true);
          } else {
            setHasConsent(true);
          }
        }} />
      </>
    );
  }

  // Show consent screen (Apple Guideline 5.1.2 compliance)
  if (showConsent) {
    return (
      <>
        <StatusBar style="dark" />
        <DataConsentScreen
          onAccept={() => {
            setShowConsent(false);
            setHasConsent(true);
            console.log('✅ User consented to data collection');
          }}
          onDecline={() => {
            setShowConsent(false);
            setHasConsent(false);
            console.log('⚠️ User declined data consent - limited functionality');
          }}
        />
      </>
    );
  }

  // Show loading screen during initialization
  if (isLoading) {
    return (
      <View style={loadingStyles.container}>
        <StatusBar style="auto" />
        <View style={loadingStyles.content}>
          <ActivityIndicator size="large" color="#4A7A5C" />
          <Text style={loadingStyles.title}>WhatsCard</Text>
          <Text style={loadingStyles.subtitle}>Initializing...</Text>
        </View>
      </View>
    );
  }

  // Show authentication screen if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <StatusBar style="auto" />
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
      </>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <NavigationContainer ref={navigationRef}>
        <StatusBar style="auto" />
        <Tab.Navigator
        screenOptions={({ route, navigation }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Camera') {
              iconName = focused ? 'camera' : 'camera-outline';
            } else if (route.name === 'Contacts') {
              iconName = focused ? 'people' : 'people-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            } else {
              iconName = 'help-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#2563EB',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
            paddingBottom: 20,
            paddingTop: 8,
            height: 80,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
          headerShown: false,
          tabBarHideOnKeyboard: true,
        })}
        screenListeners={({ navigation, route }) => ({
          tabPress: (e) => {
            // Handle camera navigation with scanned data
            if (route.name === 'Camera' && scannedCardData) {
              e.preventDefault();
              navigation.navigate('Camera', { 
                screen: 'ContactForm',
              });
            }
          },
        })}
      >
        <Tab.Screen 
          name="Camera" 
          component={CameraStack}
          options={{ title: 'Scan' }}
        />
        <Tab.Screen 
          name="Contacts" 
          component={ContactsStack}
          options={{ 
            title: 'Contacts',
            tabBarBadge: contacts.length > 0 ? contacts.length : undefined,
            tabBarBadgeStyle: {
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              fontSize: 10,
            }
          }}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileStack}
          options={{ title: 'Profile' }}
        />
      </Tab.Navigator>

      {/* Contact Detail Modal */}
      <ContactDetailModal
        contact={selectedContact}
        visible={showContactDetail}
        onClose={() => {
          setShowContactDetail(false);
          setSelectedContact(null);
        }}
        onDelete={handleContactDelete}
        onEdit={handleContactEdit}
      />

      {/* Paywall Modal */}
      {showPaywall && !isPremiumUser && (
        <View style={StyleSheet.absoluteFill}>
          <PaywallScreen
            onClose={() => setShowPaywall(false)}
            onSuccess={() => {
              setShowPaywall(false);
              setIsPremiumUser(true);
              // Refresh subscription status
              if (currentUser?.id) {
                checkSubscriptionStatus(currentUser.id);
              }
            }}
            onSkip={() => {
              console.log('✅ User skipped paywall');
              setShowPaywall(false);
            }}
            showSkipButton={true}
          />
        </View>
      )}
      </NavigationContainer>
    </SafeAreaView>
  );
}
