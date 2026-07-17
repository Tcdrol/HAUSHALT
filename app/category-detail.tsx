import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/app-context';
import { ExpenseService } from '@/lib/services/expense-service';

export default function CategoryDetailScreen() {
  const params = useLocalSearchParams<{ category: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);

  const category = params.category || 'Groceries';

  useEffect(() => {
    if (user) {
      loadCategoryExpenses();
    }
  }, [user, category]);

  const loadCategoryExpenses = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await ExpenseService.getExpenses(user.id);
      if (result.success && result.data) {
        const categoryExpenses = result.data.filter((exp: any) => exp.category === category);
        setExpenses(categoryExpenses);
        setTotalAmount(categoryExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0));
      }
    } catch (error) {
      console.error('Error loading category expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async (expenseId: string) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await ExpenseService.deleteExpense(expenseId);
              if (result.success) {
                loadCategoryExpenses();
              } else {
                Alert.alert('Error', result.error || 'Failed to delete expense');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete expense');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-5 pt-4 pb-6 flex-row items-center justify-between border-b border-border bg-surface">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-2">
            <IconSymbol size={20} name="chevron.left" color="#64748b" />
          </TouchableOpacity>
          <ThemedText className="text-text text-xl font-bold">{category}</ThemedText>
        </View>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1 px-5 py-6">
        <View className="bg-surface rounded-2xl p-6 border border-border mb-6">
          <ThemedText className="text-text-secondary text-base mb-2">Total Spent</ThemedText>
          <ThemedText className="text-text text-3xl font-bold">K{totalAmount.toFixed(2)}</ThemedText>
          <ThemedText className="text-text-secondary text-sm mt-2">{expenses.length} expense(s)</ThemedText>
        </View>

        {loading ? (
          <ThemedText className="text-text-secondary text-center py-10">Loading...</ThemedText>
        ) : expenses.length === 0 ? (
          <View className="bg-surface rounded-2xl p-8 border border-border">
            <View className="items-center">
              <IconSymbol size={48} name="cart.fill" color="#64748b" />
              <ThemedText className="text-text-secondary text-base mt-4 text-center">
                No expenses found in {category}
              </ThemedText>
            </View>
          </View>
        ) : (
          expenses.map((expense) => (
            <View key={expense.id} className="bg-surface rounded-2xl p-4 border border-border mb-3">
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <ThemedText className="text-text text-base font-semibold mb-1">
                    {expense.description}
                  </ThemedText>
                  <ThemedText className="text-text-secondary text-sm mb-2">{expense.date}</ThemedText>
                  {expense.merchant && (
                    <ThemedText className="text-text-secondary text-xs">{expense.merchant}</ThemedText>
                  )}
                </View>
                <View className="items-end">
                  <ThemedText className="text-text text-lg font-bold mb-2">
                    K{expense.amount.toFixed(2)}
                  </ThemedText>
                  <TouchableOpacity onPress={() => deleteExpense(expense.id)}>
                    <IconSymbol size={18} name="trash.fill" color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
