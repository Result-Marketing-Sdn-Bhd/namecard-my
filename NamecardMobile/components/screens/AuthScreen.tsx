import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SupabaseService } from '../../services/supabase';
import { Logo } from '../common/Logo';

interface AuthScreenProps {
  onAuthSuccess: (user: any) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '', confirmPassword: '', name: '' });

  const validateEmail = (email: string): string => {
    if (!email) return 'Email is required';
    if (!/\S+@\S+\.\S+/.test(email)) return 'Invalid email format';
    return '';
  };

  const validatePassword = (password: string): string => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const validateName = (name: string): string => {
    if (!name) return 'Name is required';
    if (name.length < 2) return 'Name must be at least 2 characters';
    return '';
  };

  const validateConfirmPassword = (password: string, confirmPassword: string): string => {
    if (!confirmPassword) return 'Please confirm your password';
    if (password !== confirmPassword) return 'Passwords do not match';
    return '';
  };

  const handleLogin = async () => {
    // Clear previous errors
    setErrors({ email: '', password: '', confirmPassword: '', name: '' });

    // Validate fields
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError, confirmPassword: '', name: '' });
      return;
    }

    setLoading(true);
    try {
      const { user, error } = await SupabaseService.signIn(email, password);

      if (error) {
        // Check if the error is due to unverified email
        if (error.message?.includes('Email not confirmed') ||
            error.message?.includes('email_not_confirmed')) {
          Alert.alert(
            '⚠️ Email Not Verified',
            'Please verify your email before logging in.\n\n' +
            '📧 CHECK THESE LOCATIONS:\n' +
            '• Inbox folder\n' +
            '• Spam/Junk folder\n' +
            '• Promotions tab (Gmail)\n\n' +
            'Email from: noreply@mail.app.supabase.io\n\n' +
            'Still can\'t find it? Tap "Resend Email" below.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Resend Email',
                onPress: () => handleResendVerification(email)
              }
            ]
          );
        } else {
          Alert.alert('Login Failed', error.message);
        }
      } else if (user) {
        onAuthSuccess(user);
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    // Clear previous errors
    setErrors({ email: '', password: '', confirmPassword: '', name: '' });

    // Validate fields
    const nameError = validateName(name);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmPasswordError = validateConfirmPassword(password, confirmPassword);

    if (nameError || emailError || passwordError || confirmPasswordError) {
      setErrors({
        name: nameError,
        email: emailError,
        password: passwordError,
        confirmPassword: confirmPasswordError
      });
      return;
    }

    setLoading(true);
    try {
      const { user, error } = await SupabaseService.signUp(email, password, { name });

      if (error) {
        // Check if user already exists but not verified
        if (error.message?.includes('already registered') ||
            error.message?.includes('User already registered')) {
          Alert.alert(
            'Account Exists',
            'This email is already registered but not verified. Would you like to resend the verification email?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Resend Email',
                onPress: () => handleResendVerification(email)
              },
              {
                text: 'Go to Login',
                onPress: () => setMode('login')
              }
            ]
          );
        } else {
          Alert.alert('Registration Failed', error.message);
        }
      } else if (user) {
        // Check if this is a new user or existing verified user
        // Supabase returns success even for existing verified users
        if (user.identities && user.identities.length === 0) {
          // This is an existing user (already registered)
          Alert.alert(
            'Account Already Exists',
            'This email is already registered. Please sign in instead.',
            [{
              text: 'Go to Login',
              onPress: () => setMode('login')
            }]
          );
        } else if (user.email_confirmed_at) {
          // User is already verified
          Alert.alert(
            'Account Already Verified',
            'This account is already verified. Please sign in.',
            [{
              text: 'Go to Login',
              onPress: () => setMode('login')
            }]
          );
        } else {
          // New user, needs email confirmation
          Alert.alert(
            '📧 Check Your Email',
            'We\'ve sent a verification email to:\n' + email + '\n\n' +
            '⚠️ IMPORTANT:\n' +
            '• Check your Inbox\n' +
            '• Check your Spam/Junk folder\n' +
            '• Check Promotions tab (Gmail users)\n\n' +
            'Email from: noreply@mail.app.supabase.io\n\n' +
            '⏱️ It may take 5-10 minutes to arrive.\n\n' +
            'Didn\'t receive it? Click "Resend" on the login screen.',
            [{
              text: 'OK',
              onPress: () => setMode('login')
            }]
          );
        }
      }
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async (emailToResend?: string) => {
    const targetEmail = emailToResend || email;
    if (!targetEmail) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const { error } = await SupabaseService.resendVerificationEmail(targetEmail);

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert(
          '✅ Email Sent',
          'Verification email has been resent to:\n' + targetEmail + '\n\n' +
          '📧 CHECK THESE LOCATIONS:\n' +
          '• Inbox folder\n' +
          '• Spam/Junk folder\n' +
          '• Promotions tab (Gmail)\n\n' +
          'Email from: noreply@mail.app.supabase.io\n\n' +
          '⏱️ Please wait 5-10 minutes for delivery.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend verification email');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    // Clear previous errors
    setErrors({ email: '', password: '', confirmPassword: '', name: '' });

    // Validate email
    const emailError = validateEmail(email);
    if (emailError) {
      setErrors({ email: emailError, password: '', confirmPassword: '', name: '' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await SupabaseService.resetPassword(email);

      if (error) {
        Alert.alert('Reset Failed', error.message);
      } else {
        Alert.alert(
          'Success',
          'Password reset link sent! Check your email.',
          [{
            text: 'OK',
            onPress: () => setMode('login')
          }]
        );
      }
    } catch (error: any) {
      Alert.alert('Reset Failed', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#4A7A5C', '#3B6B4E', '#2D5A40']}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo and Title */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Logo width={100} height={100} forceTheme="light" />
            </View>
            <Text style={styles.title}>WhatsCard</Text>
            <Text style={styles.subtitle}>Smart Business Networking</Text>
          </View>

          {/* Auth Form Container */}
          <View style={styles.formContainer}>
            {/* Tab Selector */}
            {mode !== 'forgot' && (
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tab, mode === 'login' && styles.activeTab]}
                  onPress={() => setMode('login')}
                >
                  <Text style={[styles.tabText, mode === 'login' && styles.activeTabText]}>
                    Sign In
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, mode === 'register' && styles.activeTab]}
                  onPress={() => setMode('register')}
                >
                  <Text style={[styles.tabText, mode === 'register' && styles.activeTabText]}>
                    Register
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Login Form */}
            {mode === 'login' && (
              <View style={styles.form}>
                <View>
                  <View style={[styles.inputContainer, errors.email && styles.inputContainerError]}>
                    <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor="#9CA3AF"
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (errors.email) {
                          setErrors(prev => ({ ...prev, email: validateEmail(text) }));
                        }
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                  {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                </View>

                <View>
                  <View style={[styles.inputContainer, errors.password && styles.inputContainerError]}>
                    <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor="#9CA3AF"
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (errors.password) {
                          setErrors(prev => ({ ...prev, password: validatePassword(text) }));
                        }
                      }}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                      testID="eye-icon"
                    >
                      <Ionicons
                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color="#6B7280"
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                </View>

                <TouchableOpacity
                  style={styles.button}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" testID="loading-indicator" />
                  ) : (
                    <Text style={styles.buttonText}>Sign In</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setMode('forgot')}>
                  <Text style={styles.linkText}>Forgot Password?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleResendVerification()}
                  style={{ marginTop: 10 }}
                >
                  <Text style={[styles.linkText, { fontSize: 14 }]}>
                    Didn't receive verification email? Resend
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Register Form */}
            {mode === 'register' && (
              <View style={styles.form}>
                <View>
                  <View style={[styles.inputContainer, errors.name && styles.inputContainerError]}>
                    <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Full Name"
                      placeholderTextColor="#9CA3AF"
                      value={name}
                      onChangeText={(text) => {
                        setName(text);
                        if (errors.name) {
                          setErrors(prev => ({ ...prev, name: validateName(text) }));
                        }
                      }}
                      autoCapitalize="words"
                    />
                  </View>
                  {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                </View>

                <View>
                  <View style={[styles.inputContainer, errors.email && styles.inputContainerError]}>
                    <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor="#9CA3AF"
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (errors.email) {
                          setErrors(prev => ({ ...prev, email: validateEmail(text) }));
                        }
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                  {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                </View>

                <View>
                  <View style={[styles.inputContainer, errors.password && styles.inputContainerError]}>
                    <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Password (min 6 characters)"
                      placeholderTextColor="#9CA3AF"
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (errors.password) {
                          setErrors(prev => ({ ...prev, password: validatePassword(text) }));
                        }
                      }}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                      testID="eye-icon"
                    >
                      <Ionicons
                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color="#6B7280"
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                </View>

                <View>
                  <View style={[styles.inputContainer, errors.confirmPassword && styles.inputContainerError]}>
                    <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm Password"
                      placeholderTextColor="#9CA3AF"
                      value={confirmPassword}
                      onChangeText={(text) => {
                        setConfirmPassword(text);
                        if (errors.confirmPassword) {
                          setErrors(prev => ({ ...prev, confirmPassword: validateConfirmPassword(password, text) }));
                        }
                      }}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.eyeIcon}
                      testID="eye-icon"
                    >
                      <Ionicons
                        name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color="#6B7280"
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
                </View>

                <TouchableOpacity
                  style={styles.button}
                  onPress={handleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" testID="loading-indicator" />
                  ) : (
                    <Text style={styles.buttonText}>Register</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Forgot Password Form */}
            {mode === 'forgot' && (
              <View style={styles.form}>
                <Text style={styles.forgotTitle}>Reset Password</Text>
                <Text style={styles.forgotSubtitle}>
                  Enter your email and we'll send you a reset link
                </Text>

                <View>
                  <View style={[styles.inputContainer, errors.email && styles.inputContainerError]}>
                    <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Email"
                      placeholderTextColor="#9CA3AF"
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (errors.email) {
                          setErrors(prev => ({ ...prev, email: validateEmail(text) }));
                        }
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                  {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                </View>

                <TouchableOpacity
                  style={styles.button}
                  onPress={handleForgotPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" testID="loading-indicator" />
                  ) : (
                    <Text style={styles.buttonText}>Send Reset Link</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setMode('login')}>
                  <Text style={styles.linkText}>Back to Sign In</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#4A7A5C',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 4,
  },
  inputContainerError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginBottom: 8,
    marginLeft: 4,
  },
  button: {
    backgroundColor: '#4A7A5C',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  linkText: {
    color: '#4A7A5C',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
    textDecorationLine: 'underline',
  },
  forgotTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  forgotSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
});