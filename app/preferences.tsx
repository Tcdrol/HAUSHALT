import { useEffect, useState } from 'react';
import { Alert, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/app-context';
import { BudgetService } from '@/lib/services/budget-service';
import { useRouter } from 'expo-router';

export default function PreferencesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [defaultLocation, setDefaultLocation] = useState('kitwe');
  const [theme, setTheme] = useState('dark');
  const [budgetReminders, setBudgetReminders] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [groupUpdates, setGroupUpdates] = useState(true);

  // Load user preferences from Supabase
  useEffect(() => {
    if (user) {
      loadUserPreferences();
    }
  }, [user]);

  const loadUserPreferences = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await BudgetService.getUserPreferences(user.id);
      if (result.success && result.data) {
        setDefaultLocation(result.data.default_location || 'kitwe');
        setTheme(result.data.theme || 'dark');
        setBudgetReminders(result.data.budget_reminders !== false);
        setPriceAlerts(result.data.price_alerts !== false);
        setGroupUpdates(result.data.group_updates !== false);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save preferences');
      return;
    }

    setSaving(true);
    try {
      const result = await BudgetService.upsertUserPreferences(user.id, {
        default_location: defaultLocation,
        theme,
        budget_reminders: budgetReminders,
        price_alerts: priceAlerts,
        group_updates: groupUpdates,
      });

      if (result.success) {
        Alert.alert(
          'Preferences Saved',
          'Your preferences have been updated.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        throw new Error(result.error || 'Failed to save preferences');
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to save preferences. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1 px-5 py-6">
        <View className="flex-row justify-between items-center mb-6">
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol size={24} name="chevron.right" color="#14b8a6" />
          </TouchableOpacity>
          <ThemedText className="text-text text-3xl font-bold">Location & Preferences</ThemedText>
          <View className="w-6" />
        </View>
        
        <View className="bg-surface rounded-2xl p-5 border border-border mb-5">
          <View className="mb-8">
            <View className="flex-row items-center mb-5">
              <IconSymbol size={20} name="location.fill" color="#f59e0b" />
              <ThemedText className="text-text text-lg font-bold ml-2">Location Settings</ThemedText>
            </View>
            
            <View className="mb-5">
              <ThemedText className="text-text text-base font-semibold mb-2">Default Location</ThemedText>
              <View className="flex-row flex-wrap gap-2.5">
                {['kitwe', 'lusaka'].map((location) => (
                  <TouchableOpacity
                    key={location}
                    className={`py-3 px-4 rounded-lg border min-w-20 items-center ${defaultLocation === location ? 'bg-primary border-primary' : 'border-border'}`}
                    onPress={() => setDefaultLocation(location)}
                  >
                    <ThemedText className={`text-sm ${defaultLocation === location ? 'text-white font-semibold' : 'text-text'}`}>
                      {location.charAt(0).toUpperCase() + location.slice(1)}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
          
          <View className="mb-8">
            <View className="flex-row items-center mb-5">
              <IconSymbol size={20} name="gear.fill" color="#8b5cf6" />
              <ThemedText className="text-text text-lg font-bold ml-2">App Preferences</ThemedText>
            </View>
            
            <View className="mb-5">
              <ThemedText className="text-text text-base font-semibold mb-2">Theme</ThemedText>
              <View className="flex-row flex-wrap gap-2.5">
                {['light', 'dark', 'system'].map((themeOption) => (
                  <TouchableOpacity
                    key={themeOption}
                    className={`py-3 px-4 rounded-lg border min-w-20 items-center ${theme === themeOption ? 'bg-primary border-primary' : 'border-border'}`}
                    onPress={() => setTheme(themeOption)}
                  >
                    <ThemedText className={`text-sm ${theme === themeOption ? 'text-white font-semibold' : 'text-text'}`}>
                      {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
          
          <View className="mb-5">
            <View className="flex-row items-center mb-5">
              <IconSymbol size={20} name="bell.fill" color="#10b981" />
              <ThemedText className="text-text text-lg font-bold ml-2">Notifications</ThemedText>
            </View>
            
            <View className="flex-row justify-between items-center py-4 border-b border-border">
              <View className="flex-1">
                <ThemedText className="text-text text-base font-semibold">Budget Reminders</ThemedText>
                <ThemedText className="text-text-secondary text-sm mt-1">
                  Weekly budget summary notifications
                </ThemedText>
              </View>
              <TouchableOpacity onPress={() => setBudgetReminders(!budgetReminders)}>
                <View className={`w-12 h-8 rounded-full ${budgetReminders ? 'bg-primary' : 'bg-border'}`} />
              </TouchableOpacity>
            </View>
            
            <View className="flex-row justify-between items-center py-4 border-b border-border">
              <View className="flex-1">
                <ThemedText className="text-text text-base font-semibold">Price Alerts</ThemedText>
                <ThemedText className="text-text-secondary text-sm mt-1">
                  Get notified about price changes
                </ThemedText>
              </View>
              <TouchableOpacity onPress={() => setPriceAlerts(!priceAlerts)}>
                <View className={`w-12 h-8 rounded-full ${priceAlerts ? 'bg-primary' : 'bg-border'}`} />
              </TouchableOpacity>
            </View>
            
            <View className="flex-row justify-between items-center py-4 border-b border-border">
              <View className="flex-1">
                <ThemedText className="text-text text-base font-semibold">Group Updates</ThemedText>
                <ThemedText className="text-text-secondary text-sm mt-1">
                  Notifications for group expenses
                </ThemedText>
              </View>
              <TouchableOpacity onPress={() => setGroupUpdates(!groupUpdates)}>
                <View className={`w-12 h-8 rounded-full ${groupUpdates ? 'bg-primary' : 'bg-border'}`} />
              </TouchableOpacity>
            </View>
          </View>
          
          <Button
            title={saving ? "Saving..." : loading ? "Loading..." : "Save Preferences"}
            onPress={handleSave}
            size="large"
            className="w-full mt-5"
            disabled={loading || saving}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
