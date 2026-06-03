import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/app-context';
import { GroupService } from '@/lib/services/group-service';

export default function GroupDetailScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { groupId } = useLocalSearchParams();
  
  const [groupData, setGroupData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGroupData = useCallback(async () => {
    if (!groupId || typeof groupId !== 'string') {
      setError('Invalid group ID');
      setLoading(false);
      return;
    }

    try {
      const result = await GroupService.getGroupDetails(groupId);
      if (result.success && result.data) {
        setGroupData(result.data);
      } else {
        setError(result.error || 'Failed to load group data');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load group data');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadGroupData();
  }, [loadGroupData]);

  const goBack = () => {
    router.push('/(tabs)/groups');
  };

  const addExpense = () => {
    router.push(`/add-shared-expense?groupId=${groupId}`);
  };

  const settleUp = () => {
    router.push(`/settle-up?groupId=${groupId}`);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Loading...</ThemedText>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centerContainer}>
          <ThemedText>Loading group data...</ThemedText>
        </View>
      </View>
    );
  }

  if (error || !groupData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Error</ThemedText>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centerContainer}>
          <ThemedText style={styles.errorText}>{error || 'Failed to load group'}</ThemedText>
          <Button title="Go Back" onPress={goBack} style={styles.backButton} />
        </View>
      </View>
    );
  }

  const members = groupData.group_members?.map((member: any) => ({
    id: member.user_id,
    name: member.user_profiles?.full_name || member.user_id,
    email: member.user_profiles?.email || '',
    isCurrentUser: member.user_id === user?.id,
    role: member.role,
  })) || [];

  const expenses = groupData.group_expenses?.map((expense: any) => ({
    id: expense.id,
    name: expense.description,
    amount: `K${expense.amount.toFixed(2)}`,
    paidBy: members.find((m: any) => m.id === expense.paid_by)?.name || 'Unknown',
    eachOwes: `K${(expense.amount / expense.split_between.length).toFixed(2)}`,
    eachOwesAmount: expense.amount / expense.split_between.length,
    paidById: expense.paid_by,
    splitBetween: expense.split_between,
  })) || [];

  const totalOwed = expenses.reduce((sum: number, expense: any) => {
    if (expense.splitBetween.includes(user?.id) && expense.paidById !== user?.id) {
      return sum + expense.eachOwesAmount;
    }
    return sum;
  }, 0);

  const totalOwedToYou = expenses.reduce((sum: number, expense: any) => {
    if (expense.paidById === user?.id) {
      return sum + (expense.amount - expense.eachOwesAmount);
    }
    return sum;
  }, 0);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>{groupData.name}</ThemedText>
        <View style={styles.placeholder} />
      </View>
      
      <ThemedView style={styles.content}>
        <Card style={styles.membersCard}>
          <ThemedText style={styles.sectionTitle}>Members</ThemedText>
          <View style={styles.membersList}>
            {members.map((member: any, index: number) => (
              <View key={index} style={styles.memberItem}>
                <IconSymbol 
                  size={20} 
                  name={member.isCurrentUser ? 'person.fill' : 'person.2.fill'} 
                  color="#0066CC" 
                />
                <ThemedText style={styles.memberName}>
                  {member.name} {member.isCurrentUser ? '(you)' : ''}
                </ThemedText>
                {member.role === 'admin' && (
                  <IconSymbol size={16} name="star.fill" color="#F59E0B" />
                )}
              </View>
            ))}
          </View>
        </Card>
        
        <Button
          title="+ Add Shared Expense"
          onPress={addExpense}
          size="large"
          style={styles.addButton}
        />
        
        <ThemedText style={styles.sectionTitle}>Recent Expenses</ThemedText>
        
        {expenses.length === 0 ? (
          <Card style={styles.expenseCard}>
            <ThemedText style={styles.noExpensesText}>No expenses yet</ThemedText>
          </Card>
        ) : (
          expenses.map((expense: any) => (
            <Card key={expense.id} style={styles.expenseCard}>
              <View style={styles.expenseHeader}>
                <View style={styles.expenseInfo}>
                  <ThemedText style={styles.expenseName}>{expense.name}</ThemedText>
                  <ThemedText style={styles.expenseAmount}>{expense.amount}</ThemedText>
                </View>
                <IconSymbol size={24} name="bolt.fill" color="#F59E0B" />
              </View>
              
              <View style={styles.expenseDetails}>
                <ThemedText style={styles.paidBy}>Paid by: {expense.paidBy}</ThemedText>
                <ThemedText style={styles.eachOwes}>Each owes: {expense.eachOwes}</ThemedText>
              </View>
              
              {expense.paidById !== user?.id && expense.splitBetween.includes(user?.id) && (
                <View style={styles.youOweSection}>
                  <IconSymbol size={16} name="arrow.up.circle.fill" color="#EF4444" />
                  <ThemedText style={styles.youOwe}>You owe {expense.eachOwes}</ThemedText>
                </View>
              )}
            </Card>
          ))
        )}
        
        <Card style={styles.balancesCard}>
          <ThemedText style={styles.sectionTitle}>Balances</ThemedText>
          
          {totalOwed > 0 && (
            <View style={styles.balanceItem}>
              <IconSymbol size={20} name="arrow.up.circle.fill" color="#EF4444" />
              <ThemedText style={styles.balanceText}>You owe: K{totalOwed.toFixed(2)}</ThemedText>
            </View>
          )}
          
          {totalOwedToYou > 0 && (
            <View style={styles.balanceItem}>
              <IconSymbol size={20} name="arrow.down.circle.fill" color="#10B981" />
              <ThemedText style={styles.balanceText}>You are owed: K{totalOwedToYou.toFixed(2)}</ThemedText>
            </View>
          )}
          
          {totalOwed === 0 && totalOwedToYou === 0 && (
            <ThemedText style={styles.settledText}>All settled up!</ThemedText>
          )}
          
          {(totalOwed > 0 || totalOwedToYou > 0) && (
            <Button
              title="Settle Up →"
              onPress={settleUp}
              size="large"
              style={styles.settleButton}
            />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#2A2A2A',
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 24,
  },
  content: {
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#FFFFFF',
  },
  membersCard: {
    padding: 20,
    marginBottom: 20,
  },
  membersList: {
    marginBottom: 10,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  memberName: {
    fontSize: 16,
    marginLeft: 8,
    color: '#FFFFFF',
  },
  addButton: {
    marginBottom: 30,
  },
  expenseCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#404040',
  },
  noExpensesText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#FFFFFF',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  expenseDetails: {
    marginBottom: 15,
  },
  paidBy: {
    fontSize: 14,
    opacity: 0.8,
    color: '#FFFFFF',
    marginBottom: 5,
  },
  eachOwes: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  paymentsSection: {
    marginTop: 10,
  },
  paymentsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#FFFFFF',
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  paymentText: {
    fontSize: 14,
    marginLeft: 8,
    color: '#FFFFFF',
  },
  youOweSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  youOwe: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
    marginLeft: 8,
  },
  balancesCard: {
    padding: 20,
    marginTop: 20,
  },
  balanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  balanceText: {
    fontSize: 16,
    marginLeft: 8,
    color: '#FFFFFF',
  },
  settledText: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  settleButton: {
    marginTop: 10,
  },
});
