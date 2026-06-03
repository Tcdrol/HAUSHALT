import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Your Suggested Budget
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Based on {userProfile.userType.replace('_', ' ')} in {userProfile.location.charAt(0).toUpperCase() + userProfile.location.slice(1)}
          </ThemedText>
          <ThemedText style={styles.incomeText}>
            Monthly Income: {formatCurrency(userProfile.monthlyIncome)}
          </ThemedText>
        </View>
        
        <Card style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <IconSymbol size={20} name="dollarsign.circle.fill" color="#10B981" />
            <ThemedText style={styles.summaryTitle}>Budget Breakdown</ThemedText>
          </View>
          
          {budgetCategories.map((category, index) => (
            <View key={index} style={styles.categoryItem}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryInfo}>
                  <IconSymbol size={20} name={category.icon} color="#FFFFFF" />
                  <ThemedText style={styles.categoryName}>{category.name}</ThemedText>
                </View>
                <ThemedText style={styles.categoryAmount}>{formatCurrency(category.amount)}</ThemedText>
              </View>
              <View style={styles.progressBar}>
                <View style={[
                  styles.progressFill,
                  { width: `${category.percentage}%` }
                ]} />
              </View>
              <ThemedText style={styles.percentageText}>{category.percentage}% of income</ThemedText>
            </View>
          ))}
          
          <View style={styles.totalRow}>
            <ThemedText style={styles.totalLabel}>Total Budget</ThemedText>
            <ThemedText style={styles.totalAmount}>
              {formatCurrency(budgetCategories.reduce((sum, cat) => sum + cat.amount, 0))}
            </ThemedText>
          </View>
        </Card>
        
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <IconSymbol size={20} name="lightbulb.fill" color="#F59E0B" />
            <ThemedText style={styles.tipsTitle}>Budget Tips</ThemedText>
          </View>
          <ThemedText style={styles.tipText}>
            • Track your expenses regularly to stay within budget
          </ThemedText>
          <ThemedText style={styles.tipText}>
            • Adjust categories as needed based on your actual spending
          </ThemedText>
          <ThemedText style={styles.tipText}>
            • Set up alerts to notify when you&apos;re approaching limits
          </ThemedText>
        </View>
        
        <View style={styles.buttonRow}>
          <Button
            title="Adjust"
            onPress={handleAdjust}
            size="large"
            style={styles.secondaryButton}
            variant="outline"
          />
          
          <Button
            title={loading ? "Saving..." : "Accept Budget"}
            onPress={handleAccept}
            size="large"
            style={styles.primaryButton}
            disabled={loading}
          />
        </View>
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
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
    marginBottom: 10,
    color: '#FFFFFF',
  },
  incomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 20,
  },
  summaryCard: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#404040',
    backgroundColor: '#2A2A2A',
    marginBottom: 20,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  categoryItem: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#404040',
    borderRadius: 4,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0066CC',
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'right',
    color: '#FFFFFF',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#404040',
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  tipsCard: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#404040',
    backgroundColor: '#2A2A2A',
    marginBottom: 20,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 8,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 20,
  },
  primaryButton: {
    flex: 1,
  },
  secondaryButton: {
    flex: 1,
  },
});
