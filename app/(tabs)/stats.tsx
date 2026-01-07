
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const STORAGE_KEY = '@recorded_videos';

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
  countContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  count: {
    fontSize: 120,
    fontWeight: 'bold',
    color: colors.primary,
  },
  label: {
    fontSize: 24,
    color: colors.textSecondary,
    marginTop: 20,
  },
});

export default function StatsScreen() {
  const [recordingCount, setRecordingCount] = useState(0);

  const loadCount = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const videos = JSON.parse(stored);
        setRecordingCount(videos.length);
      } else {
        setRecordingCount(0);
      }
    } catch (error) {
      console.error('Failed to load count:', error);
      setRecordingCount(0);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadCount();
      
      // Set up interval to check for updates
      const interval = setInterval(loadCount, 1000);
      
      return () => clearInterval(interval);
    }, [])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Stats</Text>
      
      <View style={styles.countContainer}>
        <Text style={styles.count}>{recordingCount}</Text>
        <Text style={styles.label}>
          {recordingCount === 1 ? 'Recording' : 'Recordings'}
        </Text>
      </View>
    </SafeAreaView>
  );
}
