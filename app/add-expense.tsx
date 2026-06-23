import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/app-context';
import { ExpenseService } from '@/lib/services/expense-service';
import { GroupService } from '@/lib/services/group-service';
import { categorizeExpense, parseExpenseInput } from '@/utils/expenseCategorization';
import { validateExpenseInput } from '@/utils/validation';

interface ExpenseEntry {
  id: string;
  description: string;
}

export default function AddExpenseScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([{ id: '1', description: '' }]);
  const [isShared, setIsShared] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch user's groups from Supabase
  useEffect(() => {
    if (user) {
      fetchUserGroups();
    }
  }, [user]);

  const fetchUserGroups = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await GroupService.getUserGroups(user.id);
      if (result.success && result.data) {
        setGroups(result.data);
        if (result.data.length > 0) {
          setSelectedGroup(result.data[0].name);
        }
      } else {
        setGroups([]);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const addExpenseRow = () => {
    const newId = (expenses.length + 1).toString();
    setExpenses([...expenses, { id: newId, description: '' }]);
  };

  const removeExpenseRow = (id: string) => {
    if (expenses.length > 1) {
      setExpenses(expenses.filter(exp => exp.id !== id));
      // Clear error for this row if exists
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`description_${id}`];
        return newErrors;
      });
    }
  };

  const updateExpenseDescription = (id: string, value: string) => {
    setExpenses(expenses.map(exp => exp.id === id ? { ...exp, description: value } : exp));
    // Clear error for this row when user starts typing
    if (errors[`description_${id}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`description_${id}`];
        return newErrors;
      });
    }
  };

  const addExpense = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to add expenses');
      return;
    }

    // Validate all expense entries
    const errorMap: { [key: string]: string } = {};
    let hasErrors = false;

    expenses.forEach(expense => {
      const validation = validateExpenseInput(expense.description);
      if (!validation.isValid) {
        hasErrors = true;
        validation.errors.forEach(error => {
          errorMap[`description_${expense.id}`] = error.message;
        });
      }
    });

    if (hasErrors) {
      setErrors(errorMap);
      return;
    }

    // Parse and prepare all expenses
    const expenseDataList = expenses
      .map(expense => {
        const parsed = parseExpenseInput(expense.description);
        const category = categorizeExpense(expense.description);
        return {
          user_id: user.id,
          description: parsed.merchant || expense.description,
          amount: parsed.amount,
          category: category.name,
          merchant: parsed.merchant || 'Unknown',
          date: new Date().toISOString().split('T')[0],
          is_shared: isShared,
          group_id: isShared && selectedGroup ? groups.find(g => g.name === selectedGroup)?.id : null,
        };
      })
      .filter((exp): exp is typeof exp & { amount: number } => exp.amount !== null);

    setSaving(true);
    try {
      // Save all expenses to Supabase
      const results = await Promise.all(
        expenseDataList.map(data => ExpenseService.addExpense(data))
      );

      const failedExpenses = results.filter(r => !r.success);

      if (failedExpenses.length === 0) {
        const totalAmount = expenseDataList.reduce((sum, exp) => sum + (exp.amount || 0), 0);
        Alert.alert(
          'Success',
          `${expenses.length} expense(s) added successfully!\nTotal: K${totalAmount}`,
          [
            { 
              text: 'OK', 
              onPress: () => router.push('/(tabs)/dashboard')
            }
          ]
        );
        
        // Reset form
        setExpenses([{ id: '1', description: '' }]);
        setErrors({});
        setIsShared(false);
      } else {
        Alert.alert(
          'Partial Success',
          `${results.length - failedExpenses.length}/${expenses.length} expenses added. Some failed.`
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add expenses');
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => {
    router.push('/(tabs)/dashboard');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Add Expense</ThemedText>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          {expenses.map((expense, index) => (
            <View key={expense.id} style={styles.expenseRow}>
              <View style={styles.expenseInputContainer}>
                <Input
                  label={`Expense ${index + 1}`}
                  placeholder="Shoprite 350"
                  value={expense.description}
                  onChangeText={(value) => updateExpenseDescription(expense.id, value)}
                  error={errors[`description_${expense.id}`]}
                />
              </View>
              {expenses.length > 1 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeExpenseRow(expense.id)}
                >
                  <IconSymbol size={20} name="minus.circle.fill" color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity
            style={styles.addExpenseButton}
            onPress={addExpenseRow}
          >
            <IconSymbol size={20} name="plus.circle.fill" color="#10B981" />
            <ThemedText style={styles.addExpenseText}>Add Another Expense</ThemedText>
          </TouchableOpacity>
          
          <View style={styles.exampleSection}>
            <View style={styles.exampleHeader}>
              <IconSymbol size={20} name="lightbulb.fill" color="#F59E0B" />
              <ThemedText style={styles.exampleTitle}>
                Type something like:
              </ThemedText>
            </View>
            <View style={styles.examples}>
              <View style={styles.exampleItem}>
                <IconSymbol size={16} name="phone.fill" color="#8B5CF6" />
                <ThemedText style={styles.example}>&quot;MTN 100&quot; → Airtime</ThemedText>
              </View>
              <View style={styles.exampleItem}>
                <IconSymbol size={16} name="bolt.fill" color="#EF4444" />
                <ThemedText style={styles.example}>&quot;ZESCO 200&quot; → Electricity</ThemedText>
              </View>
              <View style={styles.exampleItem}>
                <IconSymbol size={16} name="car.fill" color="#F59E0B" />
                <ThemedText style={styles.example}>&quot;Kombi 10&quot; → Transport</ThemedText>
              </View>
              <View style={styles.exampleItem}>
                <IconSymbol size={16} name="cart.fill" color="#10B981" />
                <ThemedText style={styles.example}>&quot;Shoprite 350&quot; → Groceries</ThemedText>
              </View>
            </View>
          </View>
          
          <View style={styles.sharedSection}>
            <ThemedText style={styles.sectionTitle}>Shared Expense</ThemedText>
            
            <View style={styles.toggleSection}>
              <TouchableOpacity
                style={[
                  styles.toggleOption,
                  !isShared && styles.toggleOptionActive
                ]}
                onPress={() => setIsShared(false)}
              >
                <IconSymbol 
                  size={20} 
                  name="person.fill" 
                  color={!isShared ? "#0066CC" : "#666"} 
                />
                <ThemedText style={[
                  styles.toggleText,
                  !isShared && styles.toggleTextActive
                ]}>
                  Personal Expense
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.toggleOption,
                  isShared && styles.toggleOptionActive
                ]}
                onPress={() => setIsShared(true)}
              >
                <IconSymbol 
                  size={20} 
                  name="person.2.fill" 
                  color={isShared ? "#0066CC" : "#666"} 
                />
                <ThemedText style={[
                  styles.toggleText,
                  isShared && styles.toggleTextActive
                ]}>
                  Shared Expense
                </ThemedText>
              </TouchableOpacity>
            </View>
            
            {isShared && (
              <View style={styles.groupSection}>
                <ThemedText style={styles.label}>Select Group:</ThemedText>
                <View style={styles.groupOptions}>
                  {groups.length === 0 ? (
                    <ThemedText style={styles.noGroupsText}>
                      No groups found. Create a group first.
                    </ThemedText>
                  ) : (
                    groups.map((group) => (
                      <TouchableOpacity
                        key={group.id}
                        style={[
                          styles.groupOption,
                          selectedGroup === group.name && styles.groupOptionSelected
                        ]}
                        onPress={() => setSelectedGroup(group.name)}
                      >
                        <IconSymbol 
                          size={16} 
                          name="person.2.fill" 
                          color={selectedGroup === group.name ? "#FFFFFF" : "#666"} 
                        />
                        <ThemedText style={[
                          styles.groupOptionText,
                          selectedGroup === group.name && styles.groupOptionTextSelected
                        ]}>
                          {group.name}
                        </ThemedText>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
                
                <TouchableOpacity
                  style={styles.createGroupOption}
                  onPress={() => router.push('/create-group')}
                >
                  <IconSymbol 
                    size={16} 
                    name="plus.circle.fill" 
                    color="#10B981" 
                  />
                  <ThemedText style={styles.createGroupOptionText}>
                    Create New Group
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Card>
        
        <Button
          title={saving ? "Adding..." : "Add Expense(s)"}
          onPress={addExpense}
          size="large"
          style={styles.addButton}
          disabled={!expenses.some(e => e.description.trim()) || saving}
        />
      </ScrollView>
    </View>
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
    flex: 1,
    padding: 20,
  },
  card: {
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#404040',
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  expenseInputContainer: {
    flex: 1,
  },
  removeButton: {
    marginLeft: 10,
    marginTop: 30,
    padding: 4,
  },
  addExpenseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#1E3A1E',
    borderWidth: 1,
    borderColor: '#404040',
    marginBottom: 20,
  },
  addExpenseText: {
    fontSize: 14,
    marginLeft: 8,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  exampleSection: {
    marginBottom: 30,
  },
  exampleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#FFFFFF',
  },
  examples: {
    marginBottom: 5,
  },
  exampleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  example: {
    fontSize: 14,
    marginLeft: 8,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#FFFFFF',
  },
  sharedSection: {
    marginBottom: 30,
  },
  toggleSection: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  toggleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#404040',
  },
  toggleOptionActive: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  toggleText: {
    fontSize: 14,
    marginLeft: 8,
    color: '#666',
  },
  toggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  groupSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#FFFFFF',
  },
  groupOptions: {
    marginBottom: 15,
  },
  groupOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#404040',
    marginBottom: 8,
  },
  groupOptionSelected: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  groupOptionText: {
    fontSize: 14,
    marginLeft: 8,
    color: '#666',
  },
  groupOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  createGroupOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#1E3A1E',
    borderWidth: 1,
    borderColor: '#404040',
    marginBottom: 8,
  },
  createGroupOptionText: {
    fontSize: 14,
    marginLeft: 8,
    color: '#FFFFFF',
  },
  addButton: {
    marginTop: 10,
  },
  noGroupsText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
