
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export default function TabLayout() {
  // Define the tabs configuration
  const tabs: TabBarItem[] = [
    {
      name: 'noti',
      route: '/(tabs)/noti',
      icon: 'notifications',
      label: 'Noti',
    },
    {
      name: 'record',
      route: '/(tabs)/record',
      icon: 'videocam',
      label: 'Record',
    },
    {
      name: 'stats',
      route: '/(tabs)/stats',
      icon: 'bar-chart',
      label: 'Stats',
    },
  ];

  // For Android and Web, use Stack navigation with custom floating tab bar
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none', // Remove fade animation to prevent black screen flash
        }}
      >
        <Stack.Screen key="noti" name="noti" />
        <Stack.Screen key="record" name="record" />
        <Stack.Screen key="stats" name="stats" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
