import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
  const [groupBalances, setGroupBalances] = useState<any>(null);
  
  // Real-time data hooks
  const { data: recentExpenses } = useRealtimeExpenses(user?.id || '');
  const { data: budgetCategories } = useRealtimeBudgetCategories(
    user?.id || '', 
    new Date().getMonth() + 1, 
    new Date().getFullYear()
  );

  const loadBudgetOverview = useCallback(async () => {
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
    } finally {
      setLoading(false);
    }
  }, [user]);

  const calculateGroupBalances = useCallback((groupData: any) => {
    const expenses = groupData.group_expenses || [];
    const members = groupData.group_members || [];
    
    let totalOwed = 0;
    let totalOwedToYou = 0;
    
    expenses.forEach((expense: any) => {
      const splitAmount = expense.amount / expense.split_between.length;
      
      if (expense.paid_by === user?.id) {
        // You paid this expense
        totalOwedToYou += (expense.amount - splitAmount);
      } else if (expense.split_between.includes(user?.id)) {
        // Someone else paid and you owe your share
        totalOwed += splitAmount;
      }
    });
    
    setGroupBalances({
      totalOwed,
      totalOwedToYou,
      memberCount: members.length,
      groupName: groupData.name
    });
  }, [user]);

  const loadUserGroups = useCallback(async () => {
    if (!user) return;
    
    try {
      const result = await GroupService.getUserGroups(user.id);
      if (result.success && result.data) {
        setGroups(result.data);
        
        // Calculate balances for the first group (if any)
        if (result.data.length > 0) {
          const firstGroup = result.data[0];
          const groupDetails = await GroupService.getGroupDetails(firstGroup.id);
          if (groupDetails.success && groupDetails.data) {
            calculateGroupBalances(groupDetails.data);
          }
        }
      }
    } catch (error) {
      console.error('Error loading user groups:', error);
    }
  }, [user, calculateGroupBalances]);

  useEffect(() => {
    if (user) {
      loadBudgetOverview();
      loadUserGroups();
    }
  }, [user, budgetCategories, loadBudgetOverview, loadUserGroups]);

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
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.appName}>HAUSHALT</ThemedText>
          <IconSymbol size={24} name="person.fill" color="#FFFFFF" />
        </View>
        <ThemedView style={styles.content}>
          <ThemedText style={styles.loadingText}>Loading dashboard...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        
        <ThemedText style={styles.appName}>HAUSHALT</ThemedText>
        <IconSymbol size={24} name="person.fill" color="#FFFFFF" />
      </View>
      
      <ThemedView style={styles.content}>
        <ThemedText style={styles.greeting}>Hello, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}!</ThemedText>
        
        {budgetOverview && (
          <Card variant="elevated" style={styles.budgetCard}>
            <ThemedText style={styles.budgetTitle}>This month's spending</ThemedText>
            <View style={styles.budgetDetails}>
              <ThemedText style={styles.budgetItem}>Budget: {formatCurrency(budgetOverview.totalBudget)}</ThemedText>
              <ThemedText style={styles.budgetItem}>Spent: {formatCurrency(budgetOverview.totalSpent)}</ThemedText>
              <ThemedText style={styles.budgetItem}>Remaining: {formatCurrency(budgetOverview.totalBudget - budgetOverview.totalSpent)}</ThemedText>
            </View>
            <View style={styles.progressBar}>
              <View style={[
                styles.progressFill, 
                { 
                  width: `${Math.min(budgetOverview.totalPercentage, 100)}%`,
                  backgroundColor: budgetOverview.isOverBudget ? '#EF4444' : '#0066CC'
                }
              ]} />
            </View>
            <ThemedText style={styles.percentageText}>{Math.round(budgetOverview.totalPercentage)}%</ThemedText>
            {budgetOverview.isOverBudget && (
              <View style={styles.overBudgetWarning}>
                <IconSymbol size={16} name="exclamationmark.triangle.fill" color="#EF4444" />
                <ThemedText style={styles.overBudgetText}>
                  Over budget by {formatCurrency(budgetOverview.totalSpent - budgetOverview.totalBudget)}
                </ThemedText>
              </View>
            )}
            
            {budgetCategories && budgetCategories.length > 0 && (
              <View style={styles.categoriesSection}>
                <ThemedText style={styles.categoriesTitle}>Budget Categories</ThemedText>
                {budgetCategories.slice(0, 4).map((category: any) => (
                  <View key={category.id} style={styles.categoryRow}>
                    <View style={styles.categoryInfo}>
                      <View style={[styles.categoryColorDot, { backgroundColor: category.color }]} />
                      <ThemedText style={styles.categoryName}>{category.name}</ThemedText>
                    </View>
                    <ThemedText style={styles.categoryAmount}>
                      {formatCurrency(category.spent_amount)} / {formatCurrency(category.planned_amount)}
                    </ThemedText>
                  </View>
                ))}
              </View>
            )}
          </Card>
        )}
        
        <ThemedText style={styles.sectionTitle}>Recent Expenses</ThemedText>
        
        <Card style={styles.expensesCard}>
          {recentExpenses && recentExpenses.length > 0 ? (
            recentExpenses.slice(0, 5).map((expense: any, index: number) => (
              <View key={expense.id} style={styles.expenseItem}>
                <View style={styles.expenseLeft}>
                  <IconSymbol 
                    size={20} 
                    name={getCategoryIcon(expense.category)} 
                    color={getCategoryColor(expense.category)} 
                  />
                  <ThemedText style={styles.expenseName}>{expense.merchant}</ThemedText>
                </View>
                <ThemedText style={styles.expenseAmount}>{formatCurrency(expense.amount)}</ThemedText>
              </View>
            ))
          ) : (
            <ThemedText style={styles.noExpensesText}>No expenses yet. Add your first expense!</ThemedText>
          )}
        </Card>
        
        <Button
            title="+ Add Expense"
            onPress={() => router.push('/add-expense')}
            size="large"
            icon={<IconSymbol size={20} name="plus.circle.fill" color="#FFFFFF" />}
          />
        
        <Card style={styles.groupsCard}>
          <View style={styles.groupsHeader}>
            <ThemedText style={styles.sectionTitle}>Groups</ThemedText>
            <IconSymbol size={20} name="person.2.fill" color="#0066CC" />
          </View>
          
          {groups.length === 0 ? (
            <ThemedText style={styles.noGroupsText}>No groups yet. Create a group to track shared expenses!</ThemedText>
          ) : groupBalances ? (
            <>
              <ThemedText style={styles.groupName}>{groupBalances.groupName} • {groupBalances.memberCount} members</ThemedText>
              {groupBalances.totalOwed > 0 && (
                <ThemedText style={styles.groupOwes}>You owe {formatCurrency(groupBalances.totalOwed)}</ThemedText>
              )}
              {groupBalances.totalOwedToYou > 0 && (
                <ThemedText style={styles.groupOwedToYou}>You are owed {formatCurrency(groupBalances.totalOwedToYou)}</ThemedText>
              )}
              {groupBalances.totalOwed === 0 && groupBalances.totalOwedToYou === 0 && (
                <ThemedText style={styles.groupSettled}>All settled up!</ThemedText>
              )}
            </>
          ) : (
            <ThemedText style={styles.loadingGroupsText}>Loading group data...</ThemedText>
          )}
          
          <Button
            title="View All Groups"
            onPress={() => router.push('/(tabs)/groups')}
            variant="outline"
            size="small"
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#2A2A2A',
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 25,
  },
  budgetCard: {
    marginBottom: 25,
  },
  budgetTitle: {
    fontSize: 16,
    marginBottom: 15,
    color: '#666',
  },
  budgetDetails: {
    marginBottom: 15,
  },
  budgetItem: {
    fontSize: 14,
    marginBottom: 5,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0066CC',
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 14,
    textAlign: 'right',
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  expensesCard: {
    marginBottom: 25,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expenseName: {
    fontSize: 16,
    marginLeft: 12,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  groupsCard: {
    marginBottom: 25,
  },
  groupsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  groupName: {
    fontSize: 16,
    marginBottom: 5,
  },
  groupOwes: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
    marginBottom: 5,
  },
  groupOwedToYou: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 5,
  },
  groupSettled: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 15,
  },
  noGroupsText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#FFFFFF',
    opacity: 0.7,
    paddingVertical: 20,
  },
  loadingGroupsText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#FFFFFF',
    opacity: 0.7,
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#FFFFFF',
    opacity: 0.7,
  },
  noExpensesText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#FFFFFF',
    opacity: 0.7,
    paddingVertical: 20,
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
  categoriesSection: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#404040',
  },
  categoriesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    color: '#FFFFFF',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  categoryAmount: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '600',
  },
});