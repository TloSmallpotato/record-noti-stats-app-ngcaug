
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
    fontSize: 24,
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
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
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
      requestPermissions();
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
          title: 'Instant Notification',
          body: 'This notification was sent instantly!',
        },
        trigger: null, // null trigger means instant notification
      });

      Alert.alert('Success', 'Instant notification sent!');
    } catch (error) {
      console.error('Error scheduling instant notification:', error);
      Alert.alert('Error', 'Failed to send instant notification');
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
          title: 'Delayed Notification',
          body: 'This notification was scheduled for 5 seconds!',
        },
        trigger: {
          seconds: 5,
        },
      });

      Alert.alert('Success', 'Notification scheduled for 5 seconds!');
    } catch (error) {
      console.error('Error scheduling delayed notification:', error);
      Alert.alert('Error', 'Failed to schedule notification');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title}>Test Notifications</Text>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={scheduleInstantNotification}
        >
          <Text style={styles.buttonText}>Send Instantly</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button}
          onPress={scheduleDelayedNotification}
        >
          <Text style={styles.buttonText}>Send in 5 Seconds</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
