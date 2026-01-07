
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function StatsScreen() {
  const [recordingCount, setRecordingCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    loadStats();
    
    // Set up polling to update stats every 2 seconds
    const interval = setInterval(() => {
      loadStats();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      // Fetch recording count from backend API
      const { apiGet, BACKEND_URL, isBackendConfigured } = await import('@/utils/api');
      
      if (!isBackendConfigured()) {
        console.error('[Stats] Backend URL not configured');
        setRecordingCount(0);
        setIsLoading(false);
        setRefreshing(false);
        return;
      }
      
      console.log('[Stats] Fetching recording count from backend:', BACKEND_URL);
      
      const response = await apiGet<{ count: number }>('/recordings/count');
      
      console.log('[Stats] Recording count from backend:', response.count);
      setRecordingCount(response.count);
      setIsLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('[Stats] Error loading stats:', error);
      // Set to 0 on error instead of keeping old value
      setRecordingCount(0);
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          <Text style={styles.title}>Recording Statistics</Text>
          <Text style={styles.subtitle}>Live updates every 2 seconds</Text>

          <View style={styles.statsCard}>
            <View style={styles.iconContainer}>
              <IconSymbol
                ios_icon_name="video.fill"
                android_material_icon_name="videocam"
                size={48}
                color={colors.primary}
              />
            </View>

            <View style={styles.countContainer}>
              <Text style={styles.countNumber}>{recordingCount}</Text>
              <Text style={styles.countLabel}>
                {recordingCount === 1 ? 'Recording' : 'Recordings'}
              </Text>
            </View>

            <View style={styles.statusIndicator}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Live</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <IconSymbol
                ios_icon_name="arrow.clockwise"
                android_material_icon_name="refresh"
                size={20}
                color={colors.accent}
              />
              <Text style={styles.infoText}>
                Stats update automatically when recordings are added or deleted
              </Text>
            </View>

            <View style={styles.infoRow}>
              <IconSymbol
                ios_icon_name="arrow.down"
                android_material_icon_name="arrow-downward"
                size={20}
                color={colors.secondary}
              />
              <Text style={styles.infoText}>
                Pull down to refresh manually
              </Text>
            </View>
          </View>

          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total Videos:</Text>
              <Text style={styles.detailValue}>{recordingCount}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Update Interval:</Text>
              <Text style={styles.detailValue}>2 seconds</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text style={[styles.detailValue, styles.statusActive]}>Active</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
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
  statsCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.1)',
    elevation: 4,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  countContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  countNumber: {
    fontSize: 72,
    fontWeight: 'bold',
    color: colors.primary,
    lineHeight: 80,
  },
  countLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: `${colors.accent}15`,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    gap: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  detailsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.textSecondary}20`,
  },
  detailLabel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  statusActive: {
    color: colors.accent,
  },
});
