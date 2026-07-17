import { useEffect, useState } from 'react';
import { Alert, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
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
  const [customCategories, setCustomCategories] = useState<{name: string; percentage: number}[]>(
    [
      { name: 'Groceries', percentage: 30 },
      { name: 'Transport', percentage: 15 },
      { name: 'Utilities', percentage: 10 },
      { name: 'Dining', percentage: 10 },
      { name: 'Entertainment', percentage: 10 },
      { name: 'Health', percentage: 10 },
      { name: 'Shopping', percentage: 10 },
      { name: 'Education', percentage: 5 },
      { name: 'Other', percentage: 0 },
    ]
  );
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryPercentage, setNewCategoryPercentage] = useState('');

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

      // Load most recent budget categories
      const budgetResult = await BudgetService.getMostRecentBudget(user.id);
      if (budgetResult.success && budgetResult.data && budgetResult.data.length > 0) {
        const categories = budgetResult.data.map(cat => ({
          name: cat.name,
          percentage: cat.planned_amount ? Math.round((cat.planned_amount / parseFloat(monthlyIncome)) * 100) : 0
        }));
        setCustomCategories(categories);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCustomCategory = () => {
    if (!newCategoryName.trim() || !newCategoryPercentage.trim()) {
      Alert.alert('Error', 'Please enter category name and percentage');
      return;
    }

    const percentage = parseFloat(newCategoryPercentage);
    if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
      Alert.alert('Error', 'Please enter a valid percentage (1-100)');
      return;
    }

    const totalPercentage = customCategories.reduce((sum, cat) => sum + cat.percentage, 0) + percentage;
    if (totalPercentage > 100) {
      Alert.alert('Error', `Total percentage cannot exceed 100%. Current total: ${totalPercentage}%`);
      return;
    }

    setCustomCategories([...customCategories, { name: newCategoryName.trim(), percentage }]);
    setNewCategoryName('');
    setNewCategoryPercentage('');
  };

  const removeCustomCategory = (index: number) => {
    setCustomCategories(customCategories.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save settings');
      return;
    }

    setSaving(true);
    try {
      // Save preferences
      const prefResult = await BudgetService.upsertUserPreferences(user.id, {
        currency,
        budget_alerts: budgetAlerts,
        auto_categorize: autoCategorize,
        monthly_budget: parseFloat(monthlyIncome) || 2000,
      });

      // Save monthly income to profile
      const profileResult = await ProfileService.upsertProfile(user.id, {
        monthly_income: parseFloat(monthlyIncome) || 2000,
      });

      // Save budget categories for current month
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      const income = parseFloat(monthlyIncome) || 2000;

      // Delete existing categories for this month
      await BudgetService.getBudgetCategories(user.id, currentMonth, currentYear).then(async (result) => {
        if (result.success && result.data) {
          for (const cat of result.data) {
            await BudgetService.deleteBudgetCategory(cat.id);
          }
        }
      });

      // Add new categories
      const categoryColors = ['#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];
      const budgetAllocations = customCategories.map((cat, index) => ({
        name: cat.name,
        amount: (cat.percentage / 100) * income,
        color: categoryColors[index % categoryColors.length]
      }));

      if (budgetAllocations.length > 0) {
        await BudgetService.initializeMonthlyBudget(user.id, currentMonth, currentYear, budgetAllocations);
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

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1 px-5 py-6">
        <View className="flex-row justify-between items-center mb-6">
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol size={24} name="chevron.right" color="#14b8a6" />
          </TouchableOpacity>
          <ThemedText className="text-text text-3xl font-bold">Budget Settings</ThemedText>
          <View className="w-6" />
        </View>
        
        <View className="bg-surface rounded-2xl p-5 border border-border">
          <View className="mb-8">
            <View className="flex-row items-center mb-5">
              <IconSymbol size={20} name="dollarsign.circle.fill" color="#10b981" />
              <ThemedText className="text-text text-lg font-bold ml-2">Income & Budget</ThemedText>
            </View>
            
            <Input
              label="Monthly Income"
              placeholder="Enter your monthly income"
              value={monthlyIncome}
              onChangeText={setMonthlyIncome}
              keyboardType="numeric"
            />
            
            <View className="mb-5">
              <ThemedText className="text-text text-base font-semibold mb-2">Currency</ThemedText>
              <View className="flex-row gap-2.5">
                {['ZMW', 'USD', 'EUR'].map((curr) => (
                  <TouchableOpacity
                    key={curr}
                    className={`py-3 px-4 rounded-lg border min-w-16 items-center ${currency === curr ? 'bg-primary border-primary' : 'border-border'}`}
                    onPress={() => setCurrency(curr)}
                  >
                    <ThemedText className={`text-sm ${currency === curr ? 'text-white font-semibold' : 'text-text'}`}>
                      {curr}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
          
          <View className="mb-8">
            <View className="flex-row items-center mb-5">
              <IconSymbol size={20} name="bell.fill" color="#f59e0b" />
              <ThemedText className="text-text text-lg font-bold ml-2">Notifications</ThemedText>
            </View>
            
            <TouchableOpacity
              className="flex-row justify-between items-center py-4 border-b border-border"
              onPress={() => setBudgetAlerts(!budgetAlerts)}
            >
              <View className="flex-1">
                <ThemedText className="text-text text-base font-semibold">Budget Alerts</ThemedText>
                <ThemedText className="text-text-secondary text-sm mt-1">
                  Get notified when you're close to budget limits
                </ThemedText>
              </View>
              <View className={`w-12 h-8 rounded-full ${budgetAlerts ? 'bg-primary' : 'bg-border'}`} />
            </TouchableOpacity>
            
            <TouchableOpacity
              className="flex-row justify-between items-center py-4 border-b border-border"
              onPress={() => setAutoCategorize(!autoCategorize)}
            >
              <View className="flex-1">
                <ThemedText className="text-text text-base font-semibold">Auto-categorize Expenses</ThemedText>
                <ThemedText className="text-text-secondary text-sm mt-1">
                  Automatically categorize expenses based on description
                </ThemedText>
              </View>
              <View className={`w-12 h-8 rounded-full ${autoCategorize ? 'bg-primary' : 'bg-border'}`} />
            </TouchableOpacity>
          </View>
          
          <View className="mb-5">
            <View className="flex-row items-center mb-5">
              <IconSymbol size={20} name="chart.bar.fill" color="#8b5cf6" />
              <ThemedText className="text-text text-lg font-bold ml-2">Budget Categories</ThemedText>
            </View>
            
            {customCategories.length === 0 ? (
              <ThemedText className="text-text-secondary text-sm text-center py-5">
                No categories added yet. Add custom categories below.
              </ThemedText>
            ) : (
              customCategories.map((cat, index) => (
                <View key={index} className="flex-row justify-between items-center py-3 border-b border-border">
                  <ThemedText className="text-text text-base">{cat.name}</ThemedText>
                  <View className="flex-row items-center">
                    <ThemedText className="text-primary text-base font-semibold mr-3">{cat.percentage}%</ThemedText>
                    <TouchableOpacity onPress={() => removeCustomCategory(index)}>
                      <IconSymbol size={18} name="xmark.circle.fill" color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
            
            <View className="flex-row justify-between items-center py-3 border-b border-border">
              <ThemedText className="text-text-secondary text-sm">Total</ThemedText>
              <ThemedText className="text-text-secondary text-sm font-semibold">
                {customCategories.reduce((sum, cat) => sum + cat.percentage, 0)}%
              </ThemedText>
            </View>
          </View>
          
          <View className="mb-5">
            <View className="flex-row items-center mb-4">
              <IconSymbol size={20} name="plus.circle.fill" color="#10b981" />
              <ThemedText className="text-text text-lg font-bold ml-2">Add Custom Category</ThemedText>
            </View>
            
            <View className="flex-row gap-2 mb-3">
              <TextInput
                className="flex-1 bg-background text-text px-4 py-3 rounded-xl text-base border border-border"
                placeholder="Category name"
                placeholderTextColor="#64748b"
                value={newCategoryName}
                onChangeText={setNewCategoryName}
              />
              <TextInput
                className="w-24 bg-background text-text px-4 py-3 rounded-xl text-base border border-border"
                placeholder="%"
                placeholderTextColor="#64748b"
                value={newCategoryPercentage}
                onChangeText={setNewCategoryPercentage}
                keyboardType="numeric"
              />
            </View>
            
            <Button
              title="Add Category"
              onPress={addCustomCategory}
              size="small"
              className="w-full"
              disabled={!newCategoryName.trim() || !newCategoryPercentage.trim()}
            />
          </View>
          
          <Button
            title={saving ? "Saving..." : loading ? "Loading..." : "Save Settings"}
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
