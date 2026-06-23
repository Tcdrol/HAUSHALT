import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/app-context';
import { BudgetService } from '@/lib/services/budget-service';
import { ExpenseService } from '@/lib/services/expense-service';
import { BudgetCategory, calculateBudgetProgress } from '@/utils/budgetCalculations';

export default function BudgetScreen() {
  const { user } = useAuth();
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showExpenses, setShowExpenses] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBudgetData();
    } else {
      setLoading(false);
    }
  }, [user, currentMonth]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBudgetData();
    setRefreshing(false);
  };

  const { totalBudget, totalSpent, totalPercentage, isOverBudget } = calculateBudgetProgress(budgetCategories);
  
  const getCategoryIcon = (categoryName: string) => {
    const iconMap: { [key: string]: 'cart.fill' | 'car.fill' | 'phone.fill' | 'house.fill' | 'person.fill' | 'dollarsign.circle.fill' } = {
      'Groceries': 'cart.fill',
      'Transport': 'car.fill',
      'Airtime/Data': 'phone.fill',
      'Rent': 'house.fill',
      'Personal': 'person.fill',
    };
    return iconMap[categoryName] || 'dollarsign.circle.fill';
  };

  const getCategoryColor = (categoryName: string) => {
    const colorMap: { [key: string]: string } = {
      'Groceries': '#10B981',
      'Transport': '#F59E0B',
      'Airtime/Data': '#8B5CF6',
      'Rent': '#6366F1',
      'Personal': '#6B7280',
    };
    return colorMap[categoryName] || '#6B7280';
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
      
      const [budgetResult, expensesResult] = await Promise.all([
        BudgetService.getBudgetCategories(user.id, month, year),
        ExpenseService.getExpensesByMonth(user.id, month, year)
      ]);
      
      if (budgetResult.success && budgetResult.data) {
        // Transform Supabase data to BudgetCategory format
        const categories: BudgetCategory[] = budgetResult.data.map((cat: any) => ({
          name: cat.name,
          plannedAmount: cat.planned_amount,
          spentAmount: cat.spent_amount,
          percentage: cat.planned_amount > 0 ? Math.round((cat.spent_amount / cat.planned_amount) * 100) : 0,
          color: cat.color || '#0066CC',
        }));
        setBudgetCategories(categories);
      } else {
        // Fallback to empty array if fetch fails
        setBudgetCategories([]);
      }

      if (expensesResult.success && expensesResult.data) {
        setExpenses(expensesResult.data);
      } else {
        setExpenses([]);
      }
    } catch (error) {
      console.error('Error fetching budget data:', error);
      setBudgetCategories([]);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <View style={styles.header}>
          <IconSymbol size={24} name="calendar" color="#FFFFFF" />
          <ThemedText style={styles.title}>{formatMonth(currentMonth)}</ThemedText>
          <IconSymbol size={24} name="person.fill" color="#FFFFFF" />
        </View>
        
        <Card variant="elevated" style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <IconSymbol size={24} name="dollarsign.circle.fill" color="#FFFFFF" />
            <ThemedText style={styles.overviewTitle}>Total Budget: K{totalBudget}</ThemedText>
          </View>
          <View style={styles.overviewDetails}>
            <ThemedText style={styles.overviewSpent}>Spent: K{totalSpent} ({totalPercentage}%)</ThemedText>
            <ThemedText style={styles.overviewRemaining}>
              Remaining: K{totalBudget - totalSpent}
            </ThemedText>
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${totalPercentage}%` }]} />
            </View>
            <ThemedText style={styles.percentageText}>{totalPercentage}%</ThemedText>
          </View>
          {isOverBudget && (
            <View style={styles.overBudgetWarning}>
              <IconSymbol size={16} name="exclamationmark.triangle.fill" color="#EF4444" />
              <ThemedText style={styles.overBudgetText}>Over budget by K{totalSpent - totalBudget}</ThemedText>
            </View>
          )}
        </Card>
        
        <Card style={styles.categoriesCard}>
          <View style={styles.categoriesHeader}>
            <ThemedText style={styles.categoriesTitle}>Categories</ThemedText>
            <IconSymbol size={20} name="chart.bar.fill" color="#0066CC" />
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ThemedText style={styles.loadingText}>Loading budget data...</ThemedText>
            </View>
          ) : (
            budgetCategories.map((category, index) => (
              <View key={index} style={styles.categoryItem}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryInfo}>
                    <IconSymbol size={20} name={getCategoryIcon(category.name)} color={category.color} />
                    <ThemedText style={styles.categoryName}>{category.name}</ThemedText>
                  </View>
                  <ThemedText style={styles.categoryBudget}>K{category.plannedAmount}</ThemedText>
                </View>
                
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[
                      styles.progressFill,
                      { width: `${category.percentage}%`, backgroundColor: category.color }
                    ]} />
                  </View>
                  <ThemedText style={styles.categorySpent}>K{category.spentAmount}</ThemedText>
                </View>
                
                <View style={styles.categoryFooter}>
                  <ThemedText style={styles.categoryPercentageText}>{category.percentage}%</ThemedText>
                  {category.percentage > 80 && category.percentage < 100 && (
                    <View style={styles.warningIndicator}>
                      <IconSymbol size={12} name="exclamationmark.circle.fill" color="#F59E0B" />
                    </View>
                  )}
                  {category.percentage >= 100 && (
                    <View style={styles.overBudgetIndicator}>
                      <IconSymbol size={12} name="xmark.circle.fill" color="#EF4444" />
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </Card>
        
        <Card style={styles.insightsCard}>
          <View style={styles.insightsHeader}>
            <IconSymbol size={20} name="lightbulb.fill" color="#F59E0B" />
            <ThemedText style={styles.insightsTitle}>Budget Insights</ThemedText>
          </View>
          <View style={styles.insightsContent}>
            <View style={styles.insightItem}>
              <IconSymbol size={16} name="trending.up.fill" color="#EF4444" />
              <ThemedText style={styles.insightText}>
                Highest spending: {budgetCategories.length > 0 ? 
                  budgetCategories.reduce((max, cat) => 
                    cat.spentAmount > max.spentAmount ? cat : max
                  ).name : 'N/A'}
              </ThemedText>
            </View>
            <View style={styles.insightItem}>
              <IconSymbol size={16} name="trending.down.fill" color="#10B981" />
              <ThemedText style={styles.insightText}>
                Lowest spending: {budgetCategories.length > 0 ? 
                  budgetCategories.reduce((min, cat) => 
                    cat.spentAmount < min.spentAmount ? cat : min
                  ).name : 'N/A'}
              </ThemedText>
            </View>
            <View style={styles.insightItem}>
              <IconSymbol size={16} name="alert.fill" color="#F59E0B" />
              <ThemedText style={styles.insightText}>
                At risk categories: {budgetCategories.filter(cat => cat.percentage > 80).length}
              </ThemedText>
            </View>
          </View>
        </Card>

        <Card style={styles.expensesCard}>
          <TouchableOpacity 
            style={styles.expensesHeader}
            onPress={() => setShowExpenses(!showExpenses)}
          >
            <View style={styles.expensesHeaderLeft}>
              <IconSymbol size={20} name="list.bullet" color="#0066CC" />
              <ThemedText style={styles.expensesTitle}>
                Expenses for {formatMonth(currentMonth)}
              </ThemedText>
            </View>
            <IconSymbol 
              size={20} 
              name={showExpenses ? "chevron.up" : "chevron.down"} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>

          {showExpenses && (
            <View style={styles.expensesList}>
              {expenses.length > 0 ? (
                expenses.map((expense) => (
                  <View key={expense.id} style={styles.expenseItem}>
                    <View style={styles.expenseLeft}>
                      <IconSymbol 
                        size={18} 
                        name={getCategoryIcon(expense.category)} 
                        color={getCategoryColor(expense.category)} 
                      />
                      <View style={styles.expenseDetails}>
                        <ThemedText style={styles.expenseMerchant}>{expense.merchant}</ThemedText>
                        <ThemedText style={styles.expenseCategory}>{expense.category}</ThemedText>
                        <ThemedText style={styles.expenseDate}>{expense.date}</ThemedText>
                      </View>
                    </View>
                    <ThemedText style={styles.expenseAmount}>K{expense.amount}</ThemedText>
                  </View>
                ))
              ) : (
                <View style={styles.noExpensesContainer}>
                  <ThemedText style={styles.noExpensesText}>No expenses for this month</ThemedText>
                </View>
              )}
            </View>
          )}
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
  overviewCard: {
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#404040',
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  overviewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  overviewDetails: {
    marginBottom: 15,
  },
  overviewSpent: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 5,
  },
  overviewRemaining: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  progressContainer: {
    marginBottom: 15,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#404040',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0066CC',
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'right',
    opacity: 0.8,
  },
  overBudgetWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  overBudgetText: {
    fontSize: 14,
    color: '#EF4444',
    marginLeft: 8,
  },
  categoriesCard: {
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#404040',
  },
  categoriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoriesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  categoryItem: {
    marginBottom: 25,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#FFFFFF',
  },
  categoryBudget: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  categorySpent: {
    fontSize: 14,
    textAlign: 'right',
    color: '#FFFFFF',
    opacity: 0.8,
  },
  categoryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryPercentageText: {
    fontSize: 14,
    opacity: 0.7,
    color: '#FFFFFF',
  },
  warningIndicator: {
    padding: 2,
    borderRadius: 4,
  },
  overBudgetIndicator: {
    padding: 2,
    borderRadius: 4,
  },
  insightsCard: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#404040',
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#FFFFFF',
  },
  insightsContent: {
    gap: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightText: {
    fontSize: 14,
    marginLeft: 8,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  expensesCard: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#404040',
  },
  expensesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expensesHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expensesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  expensesList: {
    marginTop: 15,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expenseDetails: {
    marginLeft: 12,
    flex: 1,
  },
  expenseMerchant: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  expenseCategory: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
    marginTop: 2,
  },
  expenseDate: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.5,
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  noExpensesContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  noExpensesText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
  },
});
