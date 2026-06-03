import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

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

export default function AddSharedExpenseScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedGroupName, setSelectedGroupName] = useState<string>('');
  const [paidBy, setPaidBy] = useState('You');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [groups, setGroups] = useState<any[]>([]);
  const [members, setMembers] = useState<string[]>(['You']);
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
          setSelectedGroupId(result.data[0].id);
          setSelectedGroupName(result.data[0].name);
          // For now, default to just the current user
          // Group members will be fetched when group details API is implemented
          setMembers(['You']);
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
    const splitAmount = parsed.amount / members.length;

    setSaving(true);
    try {
      // First, create the master expense for the payer
      const masterExpenseData = {
        user_id: user.id,
        description: parsed.merchant || description,
        amount: parsed.amount,
        category: category.name,
        merchant: parsed.merchant || 'Unknown',
        date: new Date().toISOString().split('T')[0],
        is_shared: true,
        group_id: selectedGroupId,
      };

      const masterExpenseResult = await ExpenseService.addExpense(masterExpenseData);
      
      if (!masterExpenseResult.success || !masterExpenseResult.data) {
        Alert.alert('Error', masterExpenseResult.error || 'Failed to create master expense');
        return;
      }

      // Check if group is selected
      if (!selectedGroupId) {
        Alert.alert('Error', 'Please select a group');
        return;
      }

      // Then, create the group expense using the master expense ID
      const groupExpenseData = {
        group_id: selectedGroupId,
        expense_id: masterExpenseResult.data.id,
        description: parsed.merchant || description,
        amount: parsed.amount,
        paid_by: user.id,
        split_between: members.map(m => m === 'You' ? user.id : m), // In real implementation, would map member names to IDs
        date: new Date().toISOString().split('T')[0],
      };

      const result = await GroupService.addGroupExpense(groupExpenseData);
      
      if (result.success) {
        Alert.alert(
          'Success',
          `Shared expense added:\n${parsed.merchant}: K${parsed.amount}\nSplit: K${splitAmount.toFixed(2)} per person\nCategory: ${category.name}`,
          [
            { 
              text: 'OK', 
              onPress: () => router.push('/(tabs)/groups')
            }
          ]
        );
        
        // Reset form
        setDescription('');
        setErrors({});
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
    router.push('/(tabs)/groups');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Add Shared Expense</ThemedText>
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
          
          <ThemedText style={styles.sectionTitle}>Group Details</ThemedText>
          
          <View style={styles.groupSection}>
            <ThemedText style={styles.label}>Select Group:</ThemedText>
            <View style={styles.groupOptions}>
              {groups.length === 0 ? (
                <ThemedText style={styles.noGroupsText}>
                  No groups found. Create a group first.
                </ThemedText>
              ) : (
                groups.map((group) => (
                  <Button
                    key={group.id}
                    title={group.name}
                    onPress={() => {
                      setSelectedGroupId(group.id);
                      setSelectedGroupName(group.name);
                    }}
                    variant={selectedGroupId === group.id ? 'primary' : 'outline'}
                    size="small"
                    style={styles.groupOption}
                  />
                ))
              )}
            </View>
          </View>
          
          <View style={styles.paidBySection}>
            <ThemedText style={styles.label}>Paid by:</ThemedText>
            <View style={styles.memberOptions}>
              {members.map((member, index) => (
                <Button
                  key={index}
                  title={member}
                  onPress={() => setPaidBy(member)}
                  variant={paidBy === member ? 'primary' : 'outline'}
                  size="small"
                  style={styles.memberOption}
                />
              ))}
            </View>
          </View>
          
          <View style={styles.splitInfo}>
            <IconSymbol size={20} name="person.2.fill" color="#0066CC" />
            <ThemedText style={styles.splitText}>
              {groups.length === 0 
                ? 'Select a group to see split details'
                : `This will be split among ${members.length} members`}
            </ThemedText>
          </View>
        </Card>
        
        <Button
          title={saving ? "Adding..." : "Add Shared Expense"}
          onPress={addExpense}
          size="large"
          style={styles.addButton}
          disabled={!description.trim() || saving || groups.length === 0}
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
  },
  exampleSection: {
    marginBottom: 25,
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
    marginTop: 20,
    color: '#FFFFFF',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#FFFFFF',
  },
  groupSection: {
    marginBottom: 20,
  },
  groupOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  groupOption: {
    marginBottom: 5,
  },
  paidBySection: {
    marginBottom: 20,
  },
  memberOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  memberOption: {
    marginBottom: 5,
  },
  splitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A3A',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#404040',
  },
  splitText: {
    fontSize: 14,
    marginLeft: 10,
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
