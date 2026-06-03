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

export default function AddExpenseScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [description, setDescription] = useState('');
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

  const addExpense = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to add expenses');
      return;
    }

    const validation = validateExpenseInput(description);
    
    if (!validation.isValid) {
      const errorMap: { [key: string]: string } = {};
      validation.errors.forEach(error => {
        errorMap[error.field] = error.message;
      });
      setErrors(errorMap);
      return;
    }

    const parsed = parseExpenseInput(description);
    if (!parsed.amount) {
      setErrors({ description: 'Could not extract amount from description' });
      return;
    }

    const category = categorizeExpense(description);
    
    setSaving(true);
    try {
      // Save to Supabase
      const expenseData = {
        user_id: user.id,
        description: parsed.merchant || description,
        amount: parsed.amount,
        category: category.name,
        merchant: parsed.merchant || 'Unknown',
        date: new Date().toISOString().split('T')[0],
        is_shared: isShared,
        group_id: isShared && selectedGroup ? groups.find(g => g.name === selectedGroup)?.id : null,
      };

      const result = await ExpenseService.addExpense(expenseData);
      
      if (result.success) {
        Alert.alert(
          'Success',
          `Expense added:\n${parsed.merchant}: K${parsed.amount}\nCategory: ${category.name}`,
          [
            { 
              text: 'OK', 
              onPress: () => router.push('/(tabs)/dashboard')
            }
          ]
        );
        
        // Reset form
        setDescription('');
        setErrors({});
        setIsShared(false);
      } else {
        Alert.alert('Error', result.error || 'Failed to add expense');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add expense');
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
          <Input
            label="What did you spend on?"
            placeholder="Shoprite 350"
            value={description}
            onChangeText={setDescription}
            error={errors.description}
          />
          
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
          title={saving ? "Adding..." : "Add Expense"}
          onPress={addExpense}
          size="large"
          style={styles.addButton}
          disabled={!description.trim() || saving}
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
