import "@/global.css";
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AppProvider } from '@/contexts/app-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)/dashboard',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AppProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="make-budget" options={{ title: 'Make Budget', presentation: 'modal' }} />
          <Stack.Screen name="execute-budget" options={{ title: 'Execute Budget', presentation: 'modal' }} />
          <Stack.Screen name="add-expense" options={{ title: 'Add Expense', presentation: 'modal' }} />
          <Stack.Screen name="group-detail" options={{ title: 'Group Details' }} />
          <Stack.Screen name="create-group" options={{ title: 'Create Group' }} />
          <Stack.Screen name="settle-up" options={{ title: 'Settle Up' }} />
          <Stack.Screen name="add-shared-expense" options={{ title: 'Add Shared Expense' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AppProvider>
  );
}
