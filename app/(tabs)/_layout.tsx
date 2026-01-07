
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export default function TabLayout() {
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

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
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
