import { useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/app-context';
import { BudgetService } from '@/lib/services/budget-service';
import { ProfileService } from '@/lib/services/profile-service';
import { useRouter } from 'expo-router';

export default function SuggestedBudgetScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState({
    monthlyIncome: 2000,
    userType: 'student_private',
    location: 'kitwe',
    householdSize: 1,
  });
  const [budgetCategories, setBudgetCategories] = useState([
    { name: 'Groceries', amount: 1677, percentage: 45, spent: 1200, icon: 'cart.fill' as const },
    { name: 'Transport', amount: 400, percentage: 15, spent: 180, icon: 'car.fill' as const },
    { name: 'Airtime/Data', amount: 300, percentage: 10, spent: 250, icon: 'bolt.fill' as const },
    { name: 'Rent', amount: 800, percentage: 30, spent: 800, icon: 'house.fill' as const },
    { name: 'Personal', amount: 500, percentage: 15, spent: 20, icon: 'person.fill' as const },
  ]);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const result = await ProfileService.getProfile(user.id);
      if (result.success && result.data) {
        setUserProfile({
          monthlyIncome: result.data.monthly_income || 2000,
          userType: result.data.user_type || 'student_private',
          location: result.data.location || 'kitwe',
          householdSize: result.data.household_size || 1,
        });
        generateBudgetSuggestions(result.data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Keep default values as fallback
      setUserProfile({
        monthlyIncome: 2000,
        userType: 'student_private',
        location: 'kitwe',
        householdSize: 1,
      });
      generateBudgetSuggestions(null);
    }
  };

  const generateBudgetSuggestions = (profile: any) => {
    const income = profile.monthly_income || 2000;
    const userType = profile.user_type || 'student_private';
    const location = profile.location || 'kitwe';
    
    const suggestions = [
      { name: 'Groceries', amount: Math.round(income * 0.45), percentage: 45, spent: 0, icon: 'cart.fill' as const },
      { name: 'Transport', amount: Math.round(income * 0.15), percentage: 15, spent: 0, icon: 'car.fill' as const },
      { name: 'Airtime/Data', amount: Math.round(income * 0.10), percentage: 10, spent: 0, icon: 'bolt.fill' as const },
      { name: 'Rent', amount: Math.round(income * 0.30), percentage: 30, spent: 0, icon: 'house.fill' as const },
      { name: 'Personal', amount: Math.round(income * 0.15), percentage: 15, spent: 0, icon: 'person.fill' as const },
    ];
    
    setBudgetCategories(suggestions);
  };

  const handleAccept = async () => {
    setLoading(true);
    try {
      // Save budget settings to Supabase
      const budgetData = {
        user_id: user.id,
        monthly_income: userProfile.monthlyIncome,
        currency: 'ZMW',
        budget_alerts: true,
        auto_categorize: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const settingsResult = await BudgetService.upsertUserPreferences(user.id, budgetData);
      
      if (!settingsResult.success) {
        throw new Error(settingsResult.error);
      }

      // Save budget categories
      for (const category of budgetCategories) {
        await BudgetService.upsertBudgetCategory({
          user_id: user.id,
          name: category.name,
          planned_amount: category.amount,
          spent_amount: 0,
          color: category.icon.replace('.fill', '').replace('"', ''),
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
        });
      }

      Alert.alert(
        'Budget Set Up!',
        'Your personalized budget has been saved successfully.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/dashboard') }]
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        'Failed to save your budget. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAdjust = () => {
    router.push('/(onboarding)/basic-info');
  };

  const formatCurrency = (amount: number) => {
    return `K${amount.toLocaleString()}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1 px-5 py-6">
        <View className="mb-8">
          <ThemedText className="text-text text-3xl font-bold mb-2">
            Your Suggested Budget
          </ThemedText>
          <ThemedText className="text-text-secondary text-base mb-2">
            Based on {userProfile.userType.replace('_', ' ')} in {userProfile.location.charAt(0).toUpperCase() + userProfile.location.slice(1)}
          </ThemedText>
          <ThemedText className="text-success text-lg font-semibold mb-5">
            Monthly Income: {formatCurrency(userProfile.monthlyIncome)}
          </ThemedText>
        </View>
        
        <View className="bg-surface rounded-2xl p-5 border border-border mb-5">
          <View className="flex-row items-center mb-5">
            <IconSymbol size={20} name="dollarsign.circle.fill" color="#10b981" />
            <ThemedText className="text-text text-lg font-bold ml-2">Budget Breakdown</ThemedText>
          </View>
          
          {budgetCategories.map((category, index) => (
            <View key={index} className="mb-5">
              <View className="flex-row justify-between items-center mb-2">
                <View className="flex-row items-center flex-1">
                  <IconSymbol size={20} name={category.icon} color="#ffffff" />
                  <ThemedText className="text-text text-base font-semibold ml-2">{category.name}</ThemedText>
                </View>
                <ThemedText className="text-text text-base font-semibold">{formatCurrency(category.amount)}</ThemedText>
              </View>
              <View className="h-2 bg-border rounded-full mb-1 overflow-hidden">
                <View 
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${category.percentage}%` }}
                />
              </View>
              <ThemedText className="text-text-secondary text-sm text-right">{category.percentage}% of income</ThemedText>
            </View>
          ))}
          
          <View className="flex-row justify-between items-center pt-4 border-t border-border mt-3">
            <ThemedText className="text-text text-lg font-bold">Total Budget</ThemedText>
            <ThemedText className="text-success text-lg font-bold">
              {formatCurrency(budgetCategories.reduce((sum, cat) => sum + cat.amount, 0))}
            </ThemedText>
          </View>
        </View>
        
        <View className="bg-surface rounded-2xl p-5 border border-border mb-5">
          <View className="flex-row items-center mb-4">
            <IconSymbol size={20} name="lightbulb.fill" color="#f59e0b" />
            <ThemedText className="text-text text-lg font-bold ml-2">Budget Tips</ThemedText>
          </View>
          <ThemedText className="text-text opacity-80 text-sm mb-2 leading-5">
            • Track your expenses regularly to stay within budget
          </ThemedText>
          <ThemedText className="text-text opacity-80 text-sm mb-2 leading-5">
            • Adjust categories as needed based on your actual spending
          </ThemedText>
          <ThemedText className="text-text opacity-80 text-sm mb-2 leading-5">
            • Set up alerts to notify when you're approaching limits
          </ThemedText>
        </View>
        
        <View className="flex-row gap-4 mt-5">
          <Button
            title="Adjust"
            onPress={handleAdjust}
            size="large"
            className="flex-1"
            variant="outline"
          />
          
          <Button
            title={loading ? "Saving..." : "Accept Budget"}
            onPress={handleAccept}
            size="large"
            className="flex-1"
            disabled={loading}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
