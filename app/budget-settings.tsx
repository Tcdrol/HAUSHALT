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

interface BudgetCategory {
  id: string;
  name: string;
  amount: string;
  color: string;
}

export default function BudgetSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [autoCategorize, setAutoCategorize] = useState(true);
  const [currency, setCurrency] = useState('ZMW');
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryAmount, setNewCategoryAmount] = useState('');

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
        setMonthlyIncome(profileResult.data.monthly_income?.toString() || '');
      }

      // Load existing budget categories for current month
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const categoriesResult = await BudgetService.getBudgetCategories(user.id, currentMonth, currentYear);
      if (categoriesResult.success && categoriesResult.data && categoriesResult.data.length > 0) {
        const loadedCategories = categoriesResult.data.map(cat => ({
          id: cat.id,
          name: cat.name,
          amount: cat.planned_amount.toString(),
          color: cat.color,
        }));
        setBudgetCategories(loadedCategories);
      } else {
        // Load most recent budget from any month
        const recentResult = await BudgetService.getMostRecentBudget(user.id);
        if (recentResult.success && recentResult.data && recentResult.data.length > 0) {
        const recentCategories = recentResult.data.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          amount: cat.planned_amount.toString(),
          color: cat.color,
        }));
          setBudgetCategories(recentCategories);
        }
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
        }
      );

      // Save monthly income to profile
      const profileResult = await ProfileService.upsertProfile(
        user.id,
        {
          monthly_income: parseFloat(monthlyIncome) || 2000,
        }
      );

      // Save budget categories
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      for (const category of budgetCategories) {
        if (category.amount && parseFloat(category.amount) > 0) {
          await BudgetService.upsertBudgetCategory({
            user_id: user.id,
            name: category.name,
            planned_amount: parseFloat(category.amount),
            spent_amount: 0,
            color: category.color,
            month: currentMonth,
            year: currentYear,
          });
        }
      }

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

  const addCategory = () => {
    if (newCategoryName.trim() && newCategoryAmount.trim()) {
      const colors = ['#10B981', '#F59E0B', '#6366F1', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      setBudgetCategories([
        ...budgetCategories,
        {
          id: Date.now().toString(),
          name: newCategoryName.trim(),
          amount: newCategoryAmount.trim(),
          color: randomColor,
        }
      ]);
      setNewCategoryName('');
      setNewCategoryAmount('');
    }
  };

  const removeCategory = (id: string) => {
    setBudgetCategories(budgetCategories.filter(cat => cat.id !== id));
  };

  const updateCategoryAmount = (id: string, amount: string) => {
    setBudgetCategories(budgetCategories.map(cat => 
      cat.id === id ? { ...cat, amount } : cat
    ));
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
            
            {budgetCategories.map((category) => (
              <View key={category.id} style={styles.categoryEditItem}>
                <View style={styles.categoryInfoRow}>
                  <View style={[styles.categoryColorIndicator, { backgroundColor: category.color }]} />
                  <ThemedText style={styles.categoryName}>{category.name}</ThemedText>
                </View>
                <View style={styles.categoryAmountRow}>
                  <Input
                    placeholder="Amount"
                    value={category.amount}
                    onChangeText={(value) => updateCategoryAmount(category.id, value)}
                    keyboardType="numeric"
                    style={styles.categoryAmountInput}
                  />
                  <TouchableOpacity
                    style={styles.removeCategoryButton}
                    onPress={() => removeCategory(category.id)}
                  >
                    <IconSymbol size={20} name="trash.fill" color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            
            <View style={styles.addCategorySection}>
              <Input
                label="New Category Name"
                placeholder="Enter category name"
                value={newCategoryName}
                onChangeText={setNewCategoryName}
              />
              <Input
                label="Budget Amount"
                placeholder="Enter amount"
                value={newCategoryAmount}
                onChangeText={setNewCategoryAmount}
                keyboardType="numeric"
              />
              <Button
                title="Add Category"
                onPress={addCategory}
                size="small"
                disabled={!newCategoryName.trim() || !newCategoryAmount.trim()}
              />
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
  categoryInfo: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
    fontStyle: 'italic',
  },
  categoryEditItem: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  categoryInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryAmountInput: {
    flex: 1,
  },
  removeCategoryButton: {
    padding: 8,
  },
  addCategorySection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#404040',
  },
  saveButton: {
    marginTop: 20,
  },
});
