import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/app-context';
import { useRealtimeBudgetCategories, useRealtimeExpenses } from '@/hooks/use-realtime-data';
import { BudgetService } from '@/lib/services/budget-service';
import { GroupService } from '@/lib/services/group-service';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [budgetOverview, setBudgetOverview] = useState<any>(null);
  const [groups, setGroups] = useState<any[]>([]);

  const { data: recentExpenses } = useRealtimeExpenses(user?.id || '');
  const { data: budgetCategories } = useRealtimeBudgetCategories(
    user?.id || '',
    new Date().getMonth() + 1,
    new Date().getFullYear()
  );

  useEffect(() => {
    if (user) {
      loadBudgetOverview();
      loadGroups();
    }
  }, [user, budgetCategories]);

  const loadBudgetOverview = async () => {
    if (!user) return;

    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const result = await BudgetService.getBudgetOverview(user.id, currentMonth, currentYear);
      if (result.success) {
        setBudgetOverview(result.data);
      }
    } catch (error) {
      console.error('Error loading budget overview:', error);
    }
  };

  const loadGroups = async () => {
    if (!user) return;

    try {
      const result = await GroupService.getUserGroups(user.id);
      if (result.success && result.data) {
        setGroups(result.data);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'groceries': return 'cart.fill';
      case 'airtime/data': return 'phone.fill';
      case 'transport': return 'car.fill';
      case 'utilities': return 'bolt.fill';
      case 'rent': return 'house.fill';
      case 'personal': return 'person.fill';
      default: return 'dollarsign.circle.fill';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'groceries': return '#10B981';
      case 'airtime/data': return '#8B5CF6';
      case 'transport': return '#F59E0B';
      case 'utilities': return '#EF4444';
      case 'rent': return '#6366F1';
      case 'personal': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const formatCurrency = (amount: number) => {
    return `K${amount.toFixed(0)}`;
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#14b8a6" />
          <ThemedText className="text-text-secondary mt-4 text-base">Loading dashboard...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="px-5 pt-4 pb-6">
        <View className="flex-row justify-between items-center">
          <View>
            <ThemedText className="text-text-muted text-sm uppercase tracking-wider">Welcome back</ThemedText>
            <ThemedText className="text-text text-2xl font-bold mt-1">
              {user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}
            </ThemedText>
          </View>
          <View className="w-12 h-12 bg-surface rounded-full items-center justify-center border border-border">
            <IconSymbol size={24} name="person.fill" color="#94a3b8" />
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Main Budget Card */}
        {budgetOverview && (
          <View className="mx-5 mb-6">
            <View className="bg-surface rounded-2xl p-6 border border-border">
              {/* Budget Header */}
              <View className="flex-row justify-between items-start mb-6">
                <View>
                  <ThemedText className="text-text-muted text-sm">Monthly Budget</ThemedText>
                  <ThemedText className="text-text text-3xl font-bold mt-1">
                    {formatCurrency(budgetOverview.totalSpent)}
                  </ThemedText>
                  <ThemedText className="text-text-secondary text-sm mt-1">
                    of {formatCurrency(budgetOverview.totalBudget)}
                  </ThemedText>
                </View>
                <View className={`px-3 py-1.5 rounded-full ${budgetOverview.isOverBudget ? 'bg-error/20' : 'bg-success/20'}`}>
                  <ThemedText className={`text-sm font-semibold ${budgetOverview.isOverBudget ? 'text-error' : 'text-success'}`}>
                    {Math.round(budgetOverview.totalPercentage)}%
                  </ThemedText>
                </View>
              </View>

              {/* Progress Bar */}
              <View className="h-3 bg-surface-elevated rounded-full overflow-hidden mb-4">
                <View
                  className={`h-full rounded-full ${budgetOverview.isOverBudget ? 'bg-error' : 'bg-primary'}`}
                  style={{ width: `${Math.min(budgetOverview.totalPercentage, 100)}%` }}
                />
              </View>

              {/* Budget Stats */}
              <View className="flex-row justify-between">
                <View className="flex-1">
                  <ThemedText className="text-text-muted text-xs">Remaining</ThemedText>
                  <ThemedText className={`text-lg font-semibold mt-0.5 ${budgetOverview.isOverBudget ? 'text-error' : 'text-text'}`}>
                    {formatCurrency(Math.max(0, budgetOverview.totalBudget - budgetOverview.totalSpent))}
                  </ThemedText>
                </View>
                <View className="flex-1 items-center">
                  <ThemedText className="text-text-muted text-xs">Spent</ThemedText>
                  <ThemedText className="text-text text-lg font-semibold mt-0.5">
                    {formatCurrency(budgetOverview.totalSpent)}
                  </ThemedText>
                </View>
                <View className="flex-1 items-end">
                  <ThemedText className="text-text-muted text-xs">Budget</ThemedText>
                  <ThemedText className="text-text text-lg font-semibold mt-0.5">
                    {formatCurrency(budgetOverview.totalBudget)}
                  </ThemedText>
                </View>
              </View>

              {/* Over Budget Warning */}
              {budgetOverview.isOverBudget && (
                <View className="mt-4 p-3 bg-error/10 rounded-xl border border-error/30 flex-row items-center">
                  <IconSymbol size={18} name="exclamationmark.triangle.fill" color="#ef4444" />
                  <ThemedText className="text-error text-sm ml-2 flex-1">
                    Over budget by {formatCurrency(budgetOverview.totalSpent - budgetOverview.totalBudget)}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View className="px-5 mb-6">
          <Button
            title="Add Expense"
            onPress={() => router.push('/add-expense')}
            size="large"
            className="bg-primary shadow-lg shadow-primary/30"
            textClassName="text-white"
            icon={<IconSymbol size={20} name="plus.circle.fill" color="#ffffff" />}
          />
        </View>

        {/* Recent Expenses */}
        <View className="px-5 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <ThemedText className="text-text text-lg font-semibold">Recent Expenses</ThemedText>
            <Button
              title="View All"
              onPress={() => router.push('/(tabs)/budget')}
              variant="ghost"
              size="small"
              textClassName="text-primary"
            />
          </View>

          <View className="bg-surface rounded-2xl border border-border overflow-hidden">
            {recentExpenses && recentExpenses.length > 0 ? (
              recentExpenses.slice(0, 5).map((expense: any, index: number) => (
                <View
                  key={expense.id}
                  className={`flex-row items-center p-4 ${index !== 4 && index !== (recentExpenses.slice(0, 5).length - 1) ? 'border-b border-border' : ''}`}
                >
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center mr-4"
                    style={{ backgroundColor: `${getCategoryColor(expense.category)}20` }}
                  >
                    <IconSymbol
                      size={20}
                      name={getCategoryIcon(expense.category)}
                      color={getCategoryColor(expense.category)}
                    />
                  </View>
                  <View className="flex-1">
                    <ThemedText className="text-text font-medium">{expense.merchant}</ThemedText>
                    <ThemedText className="text-text-muted text-sm capitalize">{expense.category}</ThemedText>
                  </View>
                  <ThemedText className="text-text font-semibold text-base">
                    {formatCurrency(expense.amount)}
                  </ThemedText>
                </View>
              ))
            ) : (
              <View className="p-8 items-center">
                <View className="w-16 h-16 bg-surface-elevated rounded-full items-center justify-center mb-3">
                  <IconSymbol size={28} name="cart.fill" color="#64748b" />
                </View>
                <ThemedText className="text-text-secondary text-center">No expenses yet</ThemedText>
                <ThemedText className="text-text-muted text-sm text-center mt-1">Add your first expense to get started</ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Groups Card */}
        <View className="px-5 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <ThemedText className="text-text text-lg font-semibold">Shared Groups</ThemedText>
            <Button
              title="View All"
              onPress={() => router.push('/(tabs)/groups')}
              variant="ghost"
              size="small"
              textClassName="text-primary"
            />
          </View>

          {groups.length === 0 ? (
            <View className="bg-surface rounded-2xl p-5 border border-border">
              <View className="items-center">
                <View className="w-12 h-12 bg-primary/20 rounded-xl items-center justify-center mb-3">
                  <IconSymbol size={24} name="person.2.fill" color="#14b8a6" />
                </View>
                <ThemedText className="text-text-secondary text-center">No groups yet</ThemedText>
                <ThemedText className="text-text-muted text-sm text-center mt-1">Create a group to share expenses</ThemedText>
              </View>
            </View>
          ) : (
            groups.slice(0, 1).map((group) => (
              <View key={group.id} className="bg-surface rounded-2xl p-5 border border-border">
                <View className="flex-row items-center mb-4">
                  <View className="w-12 h-12 bg-primary/20 rounded-xl items-center justify-center mr-4">
                    <IconSymbol size={24} name="person.2.fill" color="#14b8a6" />
                  </View>
                  <View className="flex-1">
                    <ThemedText className="text-text font-semibold text-lg">{group.name}</ThemedText>
                    <ThemedText className="text-text-muted text-sm">Active</ThemedText>
                  </View>
                  <View className="items-end">
                    <ThemedText className="text-success font-bold text-lg">K0</ThemedText>
                    <ThemedText className="text-text-muted text-xs">Settled</ThemedText>
                  </View>
                </View>
                <Button
                  title="View Details"
                  onPress={() => router.push(`/group-detail?id=${group.id}`)}
                  variant="outline"
                  size="medium"
                  className="w-full"
                />
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

