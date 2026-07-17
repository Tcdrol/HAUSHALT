import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/app-context';
import { ExpenseService } from '@/lib/services/expense-service';
import { GroupService } from '@/lib/services/group-service';
import { categorizeExpense } from '@/utils/expenseCategorization';

export default function AddSharedExpenseScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [expenseItems, setExpenseItems] = useState<{description: string; amount: number}[]>([{description: '', amount: 0}]);
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

  const addExpenseItem = () => {
    setExpenseItems([...expenseItems, {description: '', amount: 0}]);
  };

  const removeExpenseItem = (index: number) => {
    if (expenseItems.length > 1) {
      setExpenseItems(expenseItems.filter((_, i) => i !== index));
    }
  };

  const updateExpenseItem = (index: number, field: 'description' | 'amount', value: string) => {
    const updated = [...expenseItems];
    if (field === 'amount') {
      updated[index].amount = parseFloat(value) || 0;
    } else {
      updated[index].description = value;
    }
    setExpenseItems(updated);
  };

  const addExpense = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to add expenses');
      return;
    }

    const validItems = expenseItems.filter(item => item.description.trim() && item.amount > 0);
    
    if (validItems.length === 0) {
      Alert.alert('Error', 'Please add at least one expense item with a description and amount');
      return;
    }

    setSaving(true);
    try {
      const totalAmount = validItems.reduce((sum, item) => sum + item.amount, 0);
      const splitAmount = totalAmount / members.length;

      // Save each expense item to Supabase
      const results = await Promise.all(validItems.map(async (item) => {
        const category = categorizeExpense(item.description);
        const expenseData = {
          user_id: user.id,
          description: item.description,
          amount: item.amount,
          category: category.name,
          merchant: 'Unknown',
          date: new Date().toISOString().split('T')[0],
          is_shared: true,
          group_id: selectedGroupId,
        };
        return await ExpenseService.addExpense(expenseData);
      }));

      const allSuccess = results.every(r => r.success);
      
      if (allSuccess) {
        Alert.alert(
          'Success',
          `${validItems.length} shared expense(s) added:\nTotal: K${totalAmount}\nSplit: K${splitAmount.toFixed(2)} per person`,
          [
            { 
              text: 'OK', 
              onPress: () => router.push('/(tabs)/groups')
            }
          ]
        );
        
        // Reset form
        setExpenseItems([{description: '', amount: 0}]);
        setErrors({});
      } else {
        const failed = results.filter(r => !r.success);
        Alert.alert('Error', `Failed to add ${failed.length} expense(s). Please try again.`);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add expenses');
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => {
    router.push('/(tabs)/groups');
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-5 pt-4 pb-6 flex-row items-center justify-between border-b border-border bg-surface">
        <ThemedText className="text-text text-xl font-bold">Add Shared Expense</ThemedText>
        <View className="w-6" />
      </View>
      
      <ScrollView className="flex-1 px-5 py-6">
        <View className="bg-surface rounded-2xl p-6 border border-border mb-6">
          <ThemedText className="text-text text-lg font-bold mb-4">Expense Items</ThemedText>
          
          {expenseItems.map((item, index) => (
            <View key={index} className="bg-background rounded-xl p-4 border border-border mb-3">
              <View className="flex-row justify-between items-center mb-3">
                <ThemedText className="text-text font-semibold text-base">Item {index + 1}</ThemedText>
                {expenseItems.length > 1 && (
                  <TouchableOpacity onPress={() => removeExpenseItem(index)}>
                    <IconSymbol size={18} name="xmark.circle.fill" color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
              
              <TextInput
                className="bg-surface text-text px-4 py-3 rounded-xl text-base border border-border mb-3"
                placeholder="Description (e.g., Groceries)"
                placeholderTextColor="#64748b"
                value={item.description}
                onChangeText={(text: string) => updateExpenseItem(index, 'description', text)}
              />
              
              <TextInput
                className="bg-surface text-text px-4 py-3 rounded-xl text-base border border-border"
                placeholder="Amount (ZMW)"
                placeholderTextColor="#64748b"
                value={item.amount > 0 ? item.amount.toString() : ''}
                onChangeText={(text: string) => updateExpenseItem(index, 'amount', text)}
                keyboardType="numeric"
              />
            </View>
          ))}
          
          <TouchableOpacity
            className="flex-row items-center justify-center py-3 rounded-lg bg-success/20 border border-border mb-4"
            onPress={addExpenseItem}
          >
            <IconSymbol size={18} name="plus.circle.fill" color="#10b981" />
            <ThemedText className="text-text text-sm ml-2">Add Another Item</ThemedText>
          </TouchableOpacity>
          
          <View className="flex-row justify-between items-center py-3 border-t border-border">
            <ThemedText className="text-text font-semibold text-base">Total:</ThemedText>
            <ThemedText className="text-primary text-lg font-bold">
              K{expenseItems.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
            </ThemedText>
          </View>
        </View>
        
        <View className="bg-surface rounded-2xl p-6 border border-border mb-6">
          <ThemedText className="text-text text-lg font-bold mb-4">Group Details</ThemedText>
          
          <View className="mb-5">
            <ThemedText className="text-text font-semibold text-base mb-3">Select Group:</ThemedText>
            <View className="flex-row flex-wrap gap-2">
              {groups.length === 0 ? (
                <ThemedText className="text-text-secondary text-sm text-center py-5 w-full">
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
                  />
                ))
              )}
            </View>
          </View>
          
          <View className="mb-5">
            <ThemedText className="text-text font-semibold text-base mb-3">Paid by:</ThemedText>
            <View className="flex-row flex-wrap gap-2">
              {members.map((member, index) => (
                <Button
                  key={index}
                  title={member}
                  onPress={() => setPaidBy(member)}
                  variant={paidBy === member ? 'primary' : 'outline'}
                  size="small"
                />
              ))}
            </View>
          </View>
          
          <View className="flex-row items-center bg-success/20 p-4 rounded-lg mt-4 border border-border">
            <IconSymbol size={20} name="person.2.fill" color="#14b8a6" />
            <ThemedText className="text-text text-sm ml-3">
              {groups.length === 0 
                ? 'Select a group to see split details'
                : `This will be split among ${members.length} members`}
            </ThemedText>
          </View>
        </View>
        
        <Button
          title={saving ? "Adding..." : "Add Shared Expense"}
          onPress={addExpense}
          size="large"
          className="w-full"
          disabled={saving || groups.length === 0}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
