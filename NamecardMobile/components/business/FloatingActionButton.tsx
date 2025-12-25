import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface FloatingActionButtonProps {
  isSelectMode: boolean;
  selectedCount: number;
  onExport: () => void;
  onDelete: () => void;
  onAddToGroup: () => void;
  onAddManually: () => void;
  onScanCard: () => void;
}

export function FloatingActionButton({
  isSelectMode,
  selectedCount,
  onExport,
  onDelete,
  onAddToGroup,
  onAddManually,
  onScanCard,
}: FloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isExpanded) {
      Animated.parallel([
        Animated.spring(animation, {
          toValue: 1,
          useNativeDriver: true,
          tension: 40,
          friction: 8,
        }),
        Animated.spring(rotation, {
          toValue: 1,
          useNativeDriver: true,
          tension: 40,
          friction: 8,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(animation, {
          toValue: 0,
          useNativeDriver: true,
          tension: 40,
          friction: 8,
        }),
        Animated.spring(rotation, {
          toValue: 0,
          useNativeDriver: true,
          tension: 40,
          friction: 8,
        }),
      ]).start();
    }
  }, [isExpanded]);

  const toggleMenu = () => {
    setIsExpanded(!isExpanded);
  };

  const handleAction = (action: () => void) => {
    setIsExpanded(false);
    action();
  };

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const animatedStyle = {
    transform: [{ rotate: rotateInterpolate }],
  };

  if (isSelectMode) {
    return (
      <>
        <TouchableOpacity
          style={styles.fab}
          onPress={toggleMenu}
          activeOpacity={0.9}
          accessible={true}
          accessibilityLabel="Manage contacts menu"
          accessibilityHint="Opens menu to manage selected contacts"
          accessibilityRole="button"
        >
          <View style={styles.fabContent}>
            <Ionicons name="options-outline" size={24} color="#FFFFFF" />
            <Text style={styles.fabLabel}>Manage</Text>
            <Animated.View style={animatedStyle}>
              <Ionicons
                name="chevron-up-outline"
                size={16}
                color="#FFFFFF"
                style={styles.chevron}
              />
            </Animated.View>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <Modal
            transparent={true}
            animationType="fade"
            visible={isExpanded}
            onRequestClose={() => setIsExpanded(false)}
            supportedOrientations={['portrait', 'landscape']}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setIsExpanded(false)}
              accessible={true}
              accessibilityLabel="Close menu"
              accessibilityHint="Tap anywhere to close the menu"
            >
              <BlurView intensity={10} style={styles.blurView} pointerEvents="none">
                <View style={styles.menuContainer}>
                  <Animated.View
                    style={[
                      styles.menuItem,
                      {
                        opacity: animation,
                        transform: [{
                          translateY: animation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [50, 0],
                          })
                        }]
                      }
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.menuButton}
                      onPress={() => handleAction(onAddToGroup)}
                      accessibilityLabel="Add to groups"
                      accessibilityHint="Add selected contacts to one or more groups"
                      accessibilityRole="button"
                    >
                      <View style={styles.menuIconContainer}>
                        <Ionicons name="people-outline" size={24} color="#2563EB" />
                      </View>
                      <Text style={styles.menuLabel}>Add to groups</Text>
                    </TouchableOpacity>
                  </Animated.View>

                  <Animated.View
                    style={[
                      styles.menuItem,
                      {
                        opacity: animation,
                        transform: [{
                          translateY: animation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [50, 0],
                          })
                        }]
                      }
                    ]}
                  >
                    <TouchableOpacity
                      style={[styles.menuButton, styles.deleteButton]}
                      onPress={() => handleAction(onDelete)}
                      accessibilityLabel="Delete contacts"
                      accessibilityHint="Permanently delete selected contacts from your list"
                      accessibilityRole="button"
                    >
                      <View style={[styles.menuIconContainer, styles.deleteIconContainer]}>
                        <Ionicons name="trash-outline" size={24} color="#EF4444" />
                      </View>
                      <Text style={styles.menuLabel}>Delete</Text>
                    </TouchableOpacity>
                  </Animated.View>

                  <Animated.View
                    style={[
                      styles.menuItem,
                      {
                        opacity: animation,
                        transform: [{
                          translateY: animation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [50, 0],
                          })
                        }]
                      }
                    ]}
                  >
                    <TouchableOpacity
                      style={[styles.menuButton, styles.exportMenuButton]}
                      onPress={() => handleAction(onExport)}
                      accessibilityLabel="Export contacts"
                      accessibilityHint="Export selected contacts to CSV file for backup or sharing"
                      accessibilityRole="button"
                    >
                      <View style={[styles.menuIconContainer, styles.exportIconContainer]}>
                        <Ionicons name="download-outline" size={24} color="#FFFFFF" />
                      </View>
                      <Text style={[styles.menuLabel, styles.exportMenuLabel]}>Export cards</Text>
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              </BlurView>
            </TouchableOpacity>
          </Modal>
        )}
      </>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={styles.fab}
        onPress={toggleMenu}
        activeOpacity={0.9}
      >
        <View style={styles.fabContent}>
          <Ionicons name="scan-outline" size={24} color="#FFFFFF" />
          <Text style={styles.fabLabel}>Scan</Text>
          <Animated.View style={animatedStyle}>
            <Ionicons
              name="chevron-up-outline"
              size={16}
              color="#FFFFFF"
              style={styles.chevron}
            />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={isExpanded}
          onRequestClose={() => setIsExpanded(false)}
          supportedOrientations={['portrait', 'landscape']}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsExpanded(false)}
            accessible={true}
            accessibilityLabel="Close menu"
            accessibilityHint="Tap anywhere to close the menu"
          >
            <BlurView intensity={10} style={styles.blurView} pointerEvents="none">
              <View style={styles.menuContainer}>
                <Animated.View
                  style={[
                    styles.menuItem,
                    {
                      opacity: animation,
                      transform: [{
                        translateY: animation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [50, 0],
                        })
                      }]
                    }
                  ]}
                >
                  <TouchableOpacity
                    style={styles.menuButton}
                    onPress={() => handleAction(onAddManually)}
                    accessibilityLabel="Add contact manually"
                    accessibilityHint="Opens form to manually enter contact information"
                    accessibilityRole="button"
                  >
                    <View style={styles.menuIconContainer}>
                      <Ionicons name="person-add-outline" size={24} color="#2563EB" />
                    </View>
                    <Text style={styles.menuLabel}>Add manually</Text>
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View
                  style={[
                    styles.menuItem,
                    {
                      opacity: animation,
                      transform: [{
                        translateY: animation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [50, 0],
                        })
                      }]
                    }
                  ]}
                >
                  <TouchableOpacity
                    style={[styles.menuButton, styles.scanMenuButton]}
                    onPress={() => handleAction(onScanCard)}
                    accessibilityLabel="Scan business card"
                    accessibilityHint="Opens camera to scan a business card"
                    accessibilityRole="button"
                  >
                    <View style={[styles.menuIconContainer, styles.scanIconContainer]}>
                      <Ionicons name="scan-outline" size={24} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.menuLabel, styles.scanMenuLabel]}>Scan a card</Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </BlurView>
          </TouchableOpacity>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 140,
  },
  fabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    marginRight: 4,
  },
  chevron: {
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
  },
  blurView: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  menuContainer: {
    position: 'absolute',
    bottom: 180,
    alignSelf: 'center',
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  menuItem: {
    marginBottom: 12,
    pointerEvents: 'box-none',
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    pointerEvents: 'auto',
    minHeight: 56,
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  exportMenuButton: {
    backgroundColor: '#2563EB',
  },
  scanMenuButton: {
    backgroundColor: '#2563EB',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deleteIconContainer: {
    backgroundColor: '#FEE2E2',
  },
  exportIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  scanIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginRight: 8,
  },
  exportMenuLabel: {
    color: '#FFFFFF',
  },
  scanMenuLabel: {
    color: '#FFFFFF',
  },
});