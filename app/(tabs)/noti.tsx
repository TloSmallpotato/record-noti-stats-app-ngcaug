
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';

// Configure notification handler for LOCAL notifications only
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const getRandomMessage = () => {
  const messages = [
    "Your notification is here!",
    "Hello from Natively!",
    "Notification delivered successfully!",
    "This is a test notification",
    "Scheduled notification working!",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
};

export default function NotiScreen() {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isLoadingInstant, setIsLoadingInstant] = useState(false);
  const [isLoadingDelayed, setIsLoadingDelayed] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      console.log('Current notification permission status:', status);
      if (status === 'granted') {
        setPermissionGranted(true);
      } else {
        requestPermissions();
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      console.log('Requested notification permission status:', status);
      setPermissionGranted(status === 'granted');
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please enable notifications in settings to use this feature');
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const triggerNotificationInstant = async () => {
    try {
      if (!permissionGranted) {
        await requestPermissions();
        return;
      }

      setIsLoadingInstant(true);
      setStatusMessage('');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Schedule LOCAL notification immediately (trigger: null)
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Natively",
          body: getRandomMessage(),
        },
        trigger: null, // null = immediate local notification
      });

      console.log('Instant local notification scheduled with ID:', notificationId);
      setStatusMessage('Notification sent instantly!');
    } catch (error) {
      console.error('Error scheduling instant notification:', error);
      Alert.alert('Error', `Failed to send notification: ${error}`);
    } finally {
      setIsLoadingInstant(false);
    }
  };

  const triggerNotificationDelayed = async () => {
    try {
      if (!permissionGranted) {
        await requestPermissions();
        return;
      }

      setIsLoadingDelayed(true);
      setStatusMessage('');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Schedule LOCAL notification with 5 second delay
      // Using explicit TimeIntervalTriggerInput format
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Natively",
          body: getRandomMessage(),
        },
        trigger: {
          seconds: 5,
          repeats: false, // Explicitly set to false to ensure it only fires once
        },
      });

      console.log('Delayed local notification scheduled with ID:', notificationId);
      console.log('Notification will appear in 5 seconds');
      setStatusMessage('Notification scheduled for 5 seconds!');
      
      // Update status message after 5 seconds to confirm
      setTimeout(() => {
        setStatusMessage('Notification should have appeared!');
      }, 5500);
    } catch (error) {
      console.error('Error scheduling delayed notification:', error);
      Alert.alert('Error', `Failed to schedule notification: ${error}`);
    } finally {
      setIsLoadingDelayed(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title}>Local Notifications</Text>
        <Text style={styles.subtitle}>Test Local Notifications (No Push)</Text>

        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary, isLoadingInstant && styles.buttonDisabled]}
          onPress={triggerNotificationInstant}
          activeOpacity={0.7}
          disabled={isLoadingInstant}
        >
          <Text style={styles.buttonText}>
            {isLoadingInstant ? 'Sending...' : 'Send Instantly'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary, isLoadingDelayed && styles.buttonDisabled]}
          onPress={triggerNotificationDelayed}
          activeOpacity={0.7}
          disabled={isLoadingDelayed}
        >
          <Text style={styles.buttonText}>
            {isLoadingDelayed ? 'Scheduling...' : 'Send in 5 Seconds'}
          </Text>
        </TouchableOpacity>

        {statusMessage ? (
          <Text style={styles.statusText}>{statusMessage}</Text>
        ) : null}

        {!permissionGranted && (
          <Text style={styles.warningText}>
            ⚠️ Notification permissions not granted
          </Text>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ℹ️ Local Notifications Only</Text>
          <Text style={styles.infoText}>
            This app uses LOCAL notifications that work completely offline.
            {'\n\n'}
            No push notification server, APNs keys, or backend required!
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 48,
  },
  button: {
    paddingHorizontal: 48,
    paddingVertical: 20,
    borderRadius: 16,
    minWidth: 250,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 16,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: '#34C759',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  statusText: {
    marginTop: 24,
    color: colors.text,
    fontSize: 16,
    textAlign: 'center',
  },
  warningText: {
    marginTop: 24,
    color: '#FF9500',
    fontSize: 14,
    textAlign: 'center',
  },
  infoBox: {
    marginTop: 48,
    padding: 20,
    backgroundColor: colors.cardBackground || 'rgba(128, 128, 128, 0.1)',
    borderRadius: 12,
    maxWidth: 350,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
