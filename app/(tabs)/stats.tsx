
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { colors } from '@/styles/commonStyles';
import { View, Text, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@recordings';

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
  countContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  count: {
    fontSize: 72,
    fontWeight: 'bold',
    color: colors.primary,
  },
  label: {
    fontSize: 18,
    color: colors.textSecondary,
    marginTop: 10,
  },
});

export default function StatsScreen() {
  const [count, setCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
    
    // Poll for updates every 2 seconds
    const interval = setInterval(loadStats, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const recordings = JSON.parse(stored);
        setCount(recordings.length);
      } else {
        setCount(0);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>Statistics</Text>
        
        <View style={styles.countContainer}>
          <Text style={styles.count}>{count}</Text>
          <Text style={styles.label}>Total Recordings</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
