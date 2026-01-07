
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import * as Notifications from 'expo-notifications';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function NotiScreen() {
  const [permissionGranted, setPermissionGranted] = useState(false);

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

  const scheduleDelayedNotification = async () => {
    try {
      if (!permissionGranted) {
        await requestPermissions();
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Notification Sent! 🎉',
          body: 'This notification was scheduled 3 seconds ago',
        },
        trigger: {
          seconds: 3,
        },
      });

      Alert.alert('Success', 'Notification will appear in 3 seconds!');
    } catch (error) {
      console.error('Error scheduling notification:', error);
      Alert.alert('Error', 'Failed to schedule notification');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title}>Push Notifications</Text>
        <Text style={styles.subtitle}>Test Expo Notifications</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={scheduleDelayedNotification}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Send in 3 Seconds</Text>
        </TouchableOpacity>

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
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  warningText: {
    marginTop: 24,
    color: '#FF9500',
    fontSize: 14,
    textAlign: 'center',
  },
});
