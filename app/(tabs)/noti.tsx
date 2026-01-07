
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 40,
  },
  buttonContainer: {
    gap: 20,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  permissionText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 20,
    textAlign: 'center',
  },
});

export default function NotiScreen() {
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionGranted(status === 'granted');
    
    if (status !== 'granted') {
      await requestPermissions();
    }
  };

  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setPermissionGranted(status === 'granted');
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please enable notifications in your device settings to use this feature.'
      );
    }
  };

  const scheduleInstantNotification = async () => {
    try {
      if (!permissionGranted) {
        await requestPermissions();
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Instant Notification 📬',
          body: 'This notification was sent instantly!',
          data: { type: 'instant' },
        },
        trigger: null, // null means instant notification
      });

      Alert.alert('Success', 'Instant notification sent!');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to send notification');
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
          title: 'Delayed Notification ⏰',
          body: 'This notification was scheduled for 5 seconds!',
          data: { type: 'delayed' },
        },
        trigger: {
          seconds: 5,
        },
      });

      Alert.alert('Success', 'Notification scheduled for 5 seconds!');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to schedule notification');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Noti</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={scheduleInstantNotification}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Send Instantly</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button}
          onPress={scheduleDelayedNotification}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Send in 5 Seconds</Text>
        </TouchableOpacity>
      </View>

      {!permissionGranted && (
        <Text style={styles.permissionText}>
          Notification permissions not granted. Tap a button to request permissions.
        </Text>
      )}
    </SafeAreaView>
  );
}
