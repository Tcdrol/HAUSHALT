import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/app-context';
import { BudgetService } from '@/lib/services/budget-service';
import { useRouter } from 'expo-router';

export default function PreferencesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [defaultLocation, setDefaultLocation] = useState('');
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
        setDefaultLocation(result.data.default_location || '');
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
      const result = await BudgetService.upsertUserPreferences(
        user.id,
        {
          user_id: user.id,
          default_location: defaultLocation,
          theme,
          budget_reminders: budgetReminders,
          price_alerts: priceAlerts,
          group_updates: groupUpdates,
        }
      );

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
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol size={24} name="chevron.right" color="#0066CC" />
          </TouchableOpacity>
          <ThemedText style={styles.title}>Location & Preferences</ThemedText>
          <View style={styles.placeholder} />
        </View>
        
        <Card style={styles.preferencesCard}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <IconSymbol size={20} name="location.fill" color="#F59E0B" />
              <ThemedText style={styles.sectionTitle}>Location Settings</ThemedText>
            </View>
            
            <View style={styles.settingItem}>
              <ThemedText style={styles.settingLabel}>Default Location</ThemedText>
              <View style={styles.options}>
                {['kitwe', 'lusaka'].map((location) => (
                  <TouchableOpacity
                    key={location}
                    style={[
                      styles.option,
                      defaultLocation === location && styles.selectedOption
                    ]}
                    onPress={() => setDefaultLocation(location)}
                  >
                    <ThemedText style={[
                      styles.optionText,
                      defaultLocation === location && styles.selectedOptionText
                    ]}>
                      {location.charAt(0).toUpperCase() + location.slice(1)}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
          </View>
          
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <IconSymbol size={20} name="gear.fill" color="#8B5CF6" />
              <ThemedText style={styles.sectionTitle}>App Preferences</ThemedText>
            </View>
            
            <View style={styles.settingItem}>
              <ThemedText style={styles.settingLabel}>Theme</ThemedText>
              <View style={styles.options}>
                {['light', 'dark', 'system'].map((themeOption) => (
                  <TouchableOpacity
                    key={themeOption}
                    style={[
                      styles.option,
                      theme === themeOption && styles.selectedOption
                    ]}
                    onPress={() => setTheme(themeOption)}
                  >
                    <ThemedText style={[
                      styles.optionText,
                      theme === themeOption && styles.selectedOptionText
                    ]}>
                      {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
          
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <IconSymbol size={20} name="bell.fill" color="#10B981" />
              <ThemedText style={styles.sectionTitle}>Notifications</ThemedText>
            </View>
            
            <View style={styles.preferenceItem}>
              <View style={styles.preferenceContent}>
                <ThemedText style={styles.preferenceTitle}>Budget Reminders</ThemedText>
                <ThemedText style={styles.preferenceDescription}>
                  Weekly budget summary notifications
                </ThemedText>
              </View>
              <TouchableOpacity onPress={() => setBudgetReminders(!budgetReminders)}>
                <View style={[styles.toggleSwitch, budgetReminders && styles.toggleSwitchOn]} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.preferenceItem}>
              <View style={styles.preferenceContent}>
                <ThemedText style={styles.preferenceTitle}>Price Alerts</ThemedText>
                <ThemedText style={styles.preferenceDescription}>
                  Get notified about price changes
                </ThemedText>
              </View>
              <TouchableOpacity onPress={() => setPriceAlerts(!priceAlerts)}>
                <View style={[styles.toggleSwitch, priceAlerts && styles.toggleSwitchOn]} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.preferenceItem}>
              <View style={styles.preferenceContent}>
                <ThemedText style={styles.preferenceTitle}>Group Updates</ThemedText>
                <ThemedText style={styles.preferenceDescription}>
                  Notifications for group expenses
                </ThemedText>
              </View>
              <TouchableOpacity onPress={() => setGroupUpdates(!groupUpdates)}>
                <View style={[styles.toggleSwitch, groupUpdates && styles.toggleSwitchOn]} />
              </TouchableOpacity>
            </View>
          </View>
          
          <Button
            title={saving ? "Saving..." : loading ? "Loading..." : "Save Preferences"}
            onPress={handleSave}
            size="large"
            style={styles.saveButton}
            disabled={loading || saving}
          />
        </Card>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 24,
  },
  preferencesCard: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#404040',
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  settingItem: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  option: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#404040',
    minWidth: 80,
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  optionText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  selectedOptionText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  preferenceContent: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  preferenceDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
    marginTop: 4,
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#404040',
  },
  toggleSwitchOn: {
    backgroundColor: '#0066CC',
  },
  saveButton: {
    marginTop: 20,
  },
});
