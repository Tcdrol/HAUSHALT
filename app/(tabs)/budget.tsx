import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/app-context';
import { BudgetService } from '@/lib/services/budget-service';
import { BudgetCategory, calculateBudgetProgress } from '@/utils/budgetCalculations';

type BudgetCategoryWithStatus = BudgetCategory & { id: string; status: string };

export default function BudgetScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategoryWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  useEffect(() => {
    if (user) {
      fetchBudgetData();
    } else {
      setLoading(false);
    }
  }, [user, currentMonth]);

  const { totalBudget, totalSpent, totalPercentage, isOverBudget } = calculateBudgetProgress(budgetCategories);
  
  const getCategoryIcon = (categoryName: string) => {
    const iconMap: { [key: string]: 'cart.fill' | 'car.fill' | 'bolt.fill' | 'fork.knife' | 'gamecontroller.fill' | 'heart.fill' | 'bag.fill' | 'book.fill' | 'questionmark.circle.fill' } = {
      'Groceries': 'cart.fill',
      'Transport': 'car.fill',
      'Utilities': 'bolt.fill',
      'Dining': 'fork.knife',
      'Entertainment': 'gamecontroller.fill',
      'Health': 'heart.fill',
      'Shopping': 'bag.fill',
      'Education': 'book.fill',
      'Other': 'questionmark.circle.fill',
    };
    return iconMap[categoryName] || 'questionmark.circle.fill';
  };

  const formatMonth = (date: Date) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Supabase connection - fetch real budget data
  const fetchBudgetData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const month = currentMonth.getMonth() + 1;
      const year = currentMonth.getFullYear();
      
      const result = await BudgetService.getBudgetCategories(user.id, month, year);
      
      if (result.success && result.data) {
        // Transform Supabase data to BudgetCategory format with status
        const categories: BudgetCategoryWithStatus[] = result.data.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          plannedAmount: cat.planned_amount,
          spentAmount: cat.spent_amount,
          percentage: cat.planned_amount > 0 ? Math.round((cat.spent_amount / cat.planned_amount) * 100) : 0,
          color: cat.color || '#0066CC',
          status: cat.status || 'ready',
        }));
        setBudgetCategories(categories);
      } else {
        // Fallback to empty array if fetch fails
        setBudgetCategories([]);
      }
    } catch (error) {
      console.error('Error fetching budget data:', error);
      setBudgetCategories([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="px-5 pt-4 pb-6">
        <View className="flex-row justify-between items-center">
          <View>
            <ThemedText className="text-text-muted text-sm uppercase tracking-wider">Budget Overview</ThemedText>
            <ThemedText className="text-text text-2xl font-bold mt-1">{formatMonth(currentMonth)}</ThemedText>
          </View>
          <TouchableOpacity 
            onPress={() => router.push('/make-budget')}
            className="w-12 h-12 bg-primary rounded-full items-center justify-center"
          >
            <IconSymbol size={20} name="plus.circle.fill" color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Total Budget Overview Card */}
        <View className="mx-5 mb-6">
          <View className="bg-surface rounded-2xl p-6 border border-border">
            <View className="flex-row items-center mb-5">
              <View className="w-12 h-12 bg-primary/20 rounded-xl items-center justify-center mr-4">
                <IconSymbol size={24} name="dollarsign.circle.fill" color="#14b8a6" />
              </View>
              <View>
                <ThemedText className="text-text-muted text-sm">Total Budget</ThemedText>
                <ThemedText className="text-text text-2xl font-bold">K{totalBudget}</ThemedText>
              </View>
            </View>

            <View className="flex-row justify-between mb-4">
              <View className="flex-1">
                <ThemedText className="text-text-muted text-xs">Spent</ThemedText>
                <ThemedText className="text-text-lg font-semibold mt-0.5">K{totalSpent}</ThemedText>
              </View>
              <View className="flex-1 items-center">
                <ThemedText className="text-text-muted text-xs">Percentage</ThemedText>
                <ThemedText className={`text-lg font-semibold mt-0.5 ${isOverBudget ? 'text-error' : 'text-primary'}`}>
                  {totalPercentage}%
                </ThemedText>
              </View>
              <View className="flex-1 items-end">
                <ThemedText className="text-text-muted text-xs">Remaining</ThemedText>
                <ThemedText className={`text-lg font-semibold mt-0.5 ${isOverBudget ? 'text-error' : 'text-success'}`}>
                  K{Math.max(0, totalBudget - totalSpent)}
                </ThemedText>
              </View>
            </View>

            {/* Progress Bar */}
            <View className="h-3 bg-surface-elevated rounded-full overflow-hidden mb-4">
              <View
                className={`h-full rounded-full ${isOverBudget ? 'bg-error' : 'bg-primary'}`}
                style={{ width: `${Math.min(totalPercentage, 100)}%` }}
              />
            </View>

            {/* Over Budget Warning */}
            {isOverBudget && (
              <View className="p-3 bg-error/10 rounded-xl border border-error/30 flex-row items-center">
                <IconSymbol size={18} name="exclamationmark.triangle.fill" color="#ef4444" />
                <ThemedText className="text-error text-sm ml-2 flex-1">
                  Over budget by K{totalSpent - totalBudget}
                </ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Categories Section */}
        <View className="px-5 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <ThemedText className="text-text text-lg font-semibold">Budget Categories</ThemedText>
            <View className="w-10 h-10 bg-surface rounded-xl items-center justify-center mr-3">
              <IconSymbol size={20} name="cart.fill" color="#14b8a6" />
            </View>
          </View>

          <View className="bg-surface rounded-2xl border border-border overflow-hidden">
            {loading ? (
              <View className="p-10 items-center">
                <ActivityIndicator size="large" color="#14b8a6" />
                <ThemedText className="text-text-secondary mt-3">Loading budget data...</ThemedText>
              </View>
            ) : budgetCategories.length > 0 ? (
              budgetCategories.map((category, index) => (
                <View
                  key={category.id}
                  className={`p-5 ${index !== budgetCategories.length - 1 ? 'border-b border-border' : ''}`}
                >
                  {/* Category Header */}
                  <View className="flex-row justify-between items-center mb-3">
                    <TouchableOpacity
                      className="flex-row items-center flex-1"
                      onPress={() => router.push(`/category-detail?category=${encodeURIComponent(category.name)}`)}
                    >
                      <View
                        className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <IconSymbol size={20} name={getCategoryIcon(category.name)} color={category.color} />
                      </View>
                      <ThemedText className="text-text font-semibold text-base">{category.name}</ThemedText>
                    </TouchableOpacity>
                    <View className="flex-row items-center">
                      <ThemedText className="text-text font-semibold mr-2">K{category.plannedAmount}</ThemedText>
                      {category.status === 'ready' && (
                        <TouchableOpacity
                          onPress={() => {
                            Alert.alert(
                              'Start Shopping',
                              `Start shopping for ${category.name} now?`,
                              [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Start', onPress: () => router.push('/execute-budget') }
                              ]
                            );
                          }}
                          className="bg-primary px-3 py-1.5 rounded-lg mr-2"
                        >
                          <ThemedText className="text-white text-xs font-semibold">Execute</ThemedText>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity onPress={() => router.push(`/category-detail?category=${encodeURIComponent(category.name)}`)}>
                        <IconSymbol size={16} name="chevron.right" color="#64748b" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View className="h-2 bg-surface-elevated rounded-full overflow-hidden mb-2">
                    <View
                      className="h-full rounded-full"
                      style={{ width: `${Math.min(category.percentage, 100)}%`, backgroundColor: category.color }}
                    />
                  </View>

                  {/* Category Stats */}
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <ThemedText className="text-text-muted text-sm">{category.percentage}% used</ThemedText>
                      {category.percentage > 80 && category.percentage < 100 && (
                        <View className="ml-2 px-2 py-0.5 bg-warning/20 rounded-full">
                          <ThemedText className="text-warning text-xs font-medium">At Risk</ThemedText>
                        </View>
                      )}
                      {category.percentage >= 100 && (
                        <View className="ml-2 px-2 py-0.5 bg-error/20 rounded-full">
                          <ThemedText className="text-error text-xs font-medium">Over Budget</ThemedText>
                        </View>
                      )}
                    </View>
                    <ThemedText className="text-text-secondary text-sm">K{category.spentAmount} spent</ThemedText>
                  </View>
                </View>
              ))
            ) : (
              <View className="p-8 items-center">
                <View className="w-20 h-20 bg-surface-elevated rounded-full items-center justify-center mb-4">
                  <IconSymbol size={36} name="person.2.fill" color="#64748b" />
                </View>
                <ThemedText className="text-text-secondary text-center">No budget categories</ThemedText>
                <ThemedText className="text-text-muted text-sm text-center mt-1">Add categories in budget settings</ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Budget Insights */}
        <View className="px-5 mb-6">
          <View className="flex-row items-center mb-4">
            <View className="w-10 h-10 bg-warning/20 rounded-xl items-center justify-center mr-3">
              <IconSymbol size={20} name="lightbulb.fill" color="#f59e0b" />
            </View>
            <ThemedText className="text-text text-lg font-semibold">Budget Insights</ThemedText>
          </View>

          <View className="bg-surface rounded-2xl p-5 border border-border">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-error/20 rounded-xl items-center justify-center mr-4">
                <IconSymbol size={20} name="trending.up.fill" color="#ef4444" />
              </View>
              <View className="flex-1">
                <ThemedText className="text-text-muted text-sm">Highest Spending</ThemedText>
                <ThemedText className="text-text font-semibold">
                  {budgetCategories.length > 0 ?
                    budgetCategories.reduce((max, cat) =>
                      cat.spentAmount > max.spentAmount ? cat : max
                    ).name : 'N/A'}
                </ThemedText>
              </View>
            </View>

            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-success/20 rounded-xl items-center justify-center mr-4">
                <IconSymbol size={20} name="trending.down.fill" color="#22c55e" />
              </View>
              <View className="flex-1">
                <ThemedText className="text-text-muted text-sm">Lowest Spending</ThemedText>
                <ThemedText className="text-text font-semibold">
                  {budgetCategories.length > 0 ?
                    budgetCategories.reduce((min, cat) =>
                      cat.spentAmount < min.spentAmount ? cat : min
                    ).name : 'N/A'}
                </ThemedText>
              </View>
            </View>

            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-warning/20 rounded-xl items-center justify-center mr-4">
                <IconSymbol size={20} name="alert.fill" color="#f59e0b" />
              </View>
              <View className="flex-1">
                <ThemedText className="text-text-muted text-sm">At Risk Categories</ThemedText>
                <ThemedText className="text-text font-semibold">
                  {budgetCategories.filter(cat => cat.percentage > 80).length} categories
                </ThemedText>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

