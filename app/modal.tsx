
import { StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import { useTheme } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
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

export default function Modal() {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      await requestPermissions();
    }
  };

  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please enable notifications in settings');
    }
  };

  const triggerNotificationDelayed = async () => {
    try {
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
      console.error("Error scheduling notification:", error);
      Alert.alert('Error', `Failed to schedule notification: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Notifications</Text>
      <Text style={[styles.text, { color: theme.colors.text }]}>Test push notifications</Text>

      <Pressable 
        onPress={triggerNotificationDelayed}
        disabled={isLoading}
        style={({ pressed }) => [
          styles.notificationButton,
          { opacity: pressed || isLoading ? 0.7 : 1 }
        ]}
      >
        <GlassView style={styles.button} glassEffectStyle="clear">
          <Text style={[styles.buttonText, { color: theme.colors.primary }]}>
            {isLoading ? 'Scheduling...' : 'Send in 3 Seconds'}
          </Text>
        </GlassView>
      </Pressable>

      {statusMessage ? (
        <Text style={[styles.statusText, { color: theme.colors.text }]}>{statusMessage}</Text>
      ) : null}

      <Pressable onPress={() => router.back()} style={styles.closeButton}>
        <GlassView style={styles.button} glassEffectStyle="clear">
          <Text style={[styles.buttonText, { color: theme.colors.primary }]}>Close</Text>
        </GlassView>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  notificationButton: {
    marginBottom: 16,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 14,
    marginTop: 12,
    marginBottom: 24,
  },
  closeButton: {
    marginTop: 12,
  },
});
