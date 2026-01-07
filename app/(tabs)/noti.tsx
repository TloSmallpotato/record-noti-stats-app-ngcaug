
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
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
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 40,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 12,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
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
    if (!permissionGranted) {
      await requestPermissions();
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Instant Notification 🎉',
          body: 'This notification was triggered instantly!',
          data: { type: 'instant' },
        },
        trigger: null, // null means instant
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to send notification');
      console.error(error);
    }
  };

  const scheduleDelayedNotification = async () => {
    if (!permissionGranted) {
      await requestPermissions();
      return;
    }

    try {
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
      
      Alert.alert('Scheduled', 'Notification will appear in 5 seconds');
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule notification');
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title}>Notifications</Text>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={scheduleInstantNotification}
        >
          <Text style={styles.buttonText}>Send Instant Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button}
          onPress={scheduleDelayedNotification}
        >
          <Text style={styles.buttonText}>Send in 5 Seconds</Text>
        </TouchableOpacity>

        {!permissionGranted && (
          <Text style={styles.permissionText}>
            Notification permissions not granted. Tap a button to request permissions.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}
