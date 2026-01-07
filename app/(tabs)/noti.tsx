
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';

// Configure notification handler
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
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') {
      setPermissionGranted(true);
    } else {
      requestPermissions();
    }
  };

  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setPermissionGranted(status === 'granted');
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please enable notifications in settings');
    }
  };

  const triggerNotificationDelayed = async () => {
    try {
      if (!permissionGranted) {
        await requestPermissions();
        return;
      }

      setIsLoading(true);
      setStatusMessage('');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Natively",
          body: getRandomMessage(),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 3,
        },
      });

      setStatusMessage('Notification scheduled for 3 seconds!');
    } catch (error) {
      console.error('Error scheduling notification:', error);
      Alert.alert('Error', `Failed to schedule notification: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title}>Push Notifications</Text>
        <Text style={styles.subtitle}>Test Expo Notifications</Text>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={triggerNotificationDelayed}
          activeOpacity={0.7}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Scheduling...' : 'Send in 3 Seconds'}
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
    backgroundColor: colors.primary,
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
});
