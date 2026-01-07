
import React, { useEffect } from "react";
import { Redirect } from "expo-router";

export default function HomeScreen() {
  // Redirect to the noti tab
  return <Redirect href="/(tabs)/noti" />;
}
