
import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger key="noti" name="noti">
        <Icon sf="bell.fill" />
        <Label>Noti</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="record" name="record">
        <Icon sf="video.fill" />
        <Label>Record</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="stats" name="stats">
        <Icon sf="chart.bar.fill" />
        <Label>Stats</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
