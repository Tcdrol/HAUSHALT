import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/app-context';
import { BudgetService } from '@/lib/services/budget-service';
import { ProfileService } from '@/lib/services/profile-service';
import { useRouter } from 'expo-router';

export default function BudgetSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [monthlyIncome, setMonthlyIncome] = useState('2000');
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [autoCategorize, setAutoCategorize] = useState(true);
  const [currency, setCurrency] = useState('ZMW');

  // Load user preferences from Supabase
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Load preferences
      const prefResult = await BudgetService.getUserPreferences(user.id);
      if (prefResult.success && prefResult.data) {
        setCurrency(prefResult.data.currency || 'ZMW');
        setBudgetAlerts(prefResult.data.budget_alerts !== false);
        setAutoCategorize(prefResult.data.auto_categorize !== false);
      }

      // Load profile for income
      const profileResult = await ProfileService.getProfile(user.id);
      if (profileResult.success && profileResult.data) {
        setMonthlyIncome(profileResult.data.monthly_income?.toString() || '2000');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save settings');
      return;
    }

    setSaving(true);
    try {
      // Save preferences
      const prefResult = await BudgetService.upsertUserPreferences(
        user.id,
        {
          user_id: user.id,
          currency,
          budget_alerts: budgetAlerts,
          auto_categorize: autoCategorize,
          default_location: 'kitwe',
          monthly_budget: parseFloat(monthlyIncome) || 2000,
        }
      );

      // Save monthly income to profile
      const profileResult = await ProfileService.upsertProfile(
        user.id,
        {
          monthly_income: parseFloat(monthlyIncome) || 2000,
        }
      );

      if (prefResult.success && profileResult.success) {
        Alert.alert(
          'Settings Saved',
          'Your budget settings have been updated.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        throw new Error(prefResult.error || profileResult.error || 'Failed to save');
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to save budget settings. Please try again.',
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
          <ThemedText style={styles.title}>Budget Settings</ThemedText>
          <View style={styles.placeholder} />
        </View>
        
        <Card style={styles.settingsCard}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <IconSymbol size={20} name="dollarsign.circle.fill" color="#10B981" />
              <ThemedText style={styles.sectionTitle}>Income & Budget</ThemedText>
            </View>
            
            <Input
              label="Monthly Income"
              placeholder="Enter your monthly income"
              value={monthlyIncome}
              onChangeText={setMonthlyIncome}
              keyboardType="numeric"
            />
            
            <View style={styles.settingItem}>
              <ThemedText style={styles.settingLabel}>Currency</ThemedText>
              <View style={styles.options}>
                {['ZMW', 'USD', 'EUR'].map((curr) => (
                  <TouchableOpacity
                    key={curr}
                    style={[
                      styles.option,
                      currency === curr && styles.selectedOption
                    ]}
                    onPress={() => setCurrency(curr)}
                  >
                    <ThemedText style={[
                      styles.optionText,
                      currency === curr && styles.selectedOptionText
                    ]}>
                      {curr}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
          
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <IconSymbol size={20} name="bell.fill" color="#F59E0B" />
              <ThemedText style={styles.sectionTitle}>Notifications</ThemedText>
            </View>
            
            <TouchableOpacity
              style={styles.toggleItem}
              onPress={() => setBudgetAlerts(!budgetAlerts)}
            >
              <View style={styles.toggleContent}>
                <ThemedText style={styles.toggleLabel}>Budget Alerts</ThemedText>
                <ThemedText style={styles.toggleDescription}>
                  Get notified when you&apos;re close to budget limits
                </ThemedText>
              </View>
              <View style={[styles.toggleSwitch, budgetAlerts && styles.toggleSwitchOn]} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.toggleItem}
              onPress={() => setAutoCategorize(!autoCategorize)}
            >
              <View style={styles.toggleContent}>
                <ThemedText style={styles.toggleLabel}>Auto-categorize Expenses</ThemedText>
                <ThemedText style={styles.toggleDescription}>
                  Automatically categorize expenses based on description
                </ThemedText>
              </View>
              <View style={[styles.toggleSwitch, autoCategorize && styles.toggleSwitchOn]} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <IconSymbol size={20} name="chart.bar.fill" color="#8B5CF6" />
              <ThemedText style={styles.sectionTitle}>Budget Categories</ThemedText>
            </View>
            
            <View style={styles.categoryItem}>
              <ThemedText style={styles.categoryName}>Groceries</ThemedText>
              <ThemedText style={styles.categoryPercentage}>45%</ThemedText>
            </View>
            <View style={styles.categoryItem}>
              <ThemedText style={styles.categoryName}>Transport</ThemedText>
              <ThemedText style={styles.categoryPercentage}>15%</ThemedText>
            </View>
            <View style={styles.categoryItem}>
              <ThemedText style={styles.categoryName}>Rent</ThemedText>
              <ThemedText style={styles.categoryPercentage}>30%</ThemedText>
            </View>
            <View style={styles.categoryItem}>
              <ThemedText style={styles.categoryName}>Personal</ThemedText>
              <ThemedText style={styles.categoryPercentage}>10%</ThemedText>
            </View>
          </View>
          
          <Button
            title={saving ? "Saving..." : loading ? "Loading..." : "Save Settings"}
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
  settingsCard: {
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
    gap: 10,
  },
  option: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#404040',
    minWidth: 60,
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
  toggleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  toggleContent: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  toggleDescription: {
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
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  categoryName: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  categoryPercentage: {
    fontSize: 16,
    color: '#0066CC',
    fontWeight: '600',
  },
  saveButton: {
    marginTop: 20,
  },
});
