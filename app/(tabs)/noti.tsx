
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { colors } from '@/styles/commonStyles';

// Set the notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function NotiScreen() {
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status);
    console.log('Notification permission status:', status);
  };

  const requestPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionStatus(status);
      console.log('Permission request result:', status);
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to use this feature.'
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request notification permissions');
    }
  };

  const scheduleInstantNotification = async () => {
    try {
      // Check permissions first
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        await requestPermissions();
        return;
      }

      // Schedule notification for immediate delivery
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Instant Notification! 🔔',
          body: 'This notification was triggered instantly!',
          data: { type: 'instant' },
        },
        trigger: null, // null trigger means immediate
      });

      console.log('Instant notification scheduled');
    } catch (error) {
      console.error('Error scheduling instant notification:', error);
      Alert.alert('Error', 'Failed to send instant notification');
    }
  };

  const scheduleDelayedNotification = async () => {
    try {
      // Check permissions first
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        await requestPermissions();
        return;
      }

      // Schedule notification for 5 seconds from now
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Delayed Notification! ⏰',
          body: 'This notification was scheduled for 5 seconds!',
          data: { type: 'delayed' },
        },
        trigger: {
          seconds: 5,
        },
      });

      console.log('Delayed notification scheduled for 5 seconds');
      Alert.alert('Scheduled', 'Notification will appear in 5 seconds!');
    } catch (error) {
      console.error('Error scheduling delayed notification:', error);
      Alert.alert('Error', 'Failed to schedule delayed notification');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title}>Push Notifications</Text>
        <Text style={styles.subtitle}>Test Expo Notifications</Text>

        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Permission Status:</Text>
          <Text style={[
            styles.statusValue,
            permissionStatus === 'granted' ? styles.statusGranted : styles.statusDenied
          ]}>
            {permissionStatus.toUpperCase()}
          </Text>
        </View>

        {permissionStatus !== 'granted' && (
          <TouchableOpacity
            style={[styles.button, styles.permissionButton]}
            onPress={requestPermissions}
          >
            <Text style={styles.buttonText}>Request Permissions</Text>
          </TouchableOpacity>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.instantButton]}
            onPress={scheduleInstantNotification}
          >
            <Text style={styles.buttonText}>Send Instant Notification</Text>
            <Text style={styles.buttonSubtext}>Triggers immediately</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.delayedButton]}
            onPress={scheduleDelayedNotification}
          >
            <Text style={styles.buttonText}>Send Delayed Notification</Text>
            <Text style={styles.buttonSubtext}>Triggers in 5 seconds</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            💡 Make sure notifications are enabled in your device settings
          </Text>
          {Platform.OS === 'ios' && (
            <Text style={styles.infoText}>
              📱 On iOS, you may need to allow notifications when prompted
            </Text>
          )}
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
    padding: 20,
    paddingBottom: 100, // Space for tab bar
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  statusLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
    marginRight: 8,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusGranted: {
    color: colors.accent,
  },
  statusDenied: {
    color: colors.highlight,
  },
  buttonContainer: {
    gap: 16,
    marginTop: 16,
  },
  button: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 4,
  },
  permissionButton: {
    backgroundColor: colors.secondary,
    marginBottom: 16,
  },
  instantButton: {
    backgroundColor: colors.primary,
  },
  delayedButton: {
    backgroundColor: colors.accent,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  buttonSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  infoContainer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
