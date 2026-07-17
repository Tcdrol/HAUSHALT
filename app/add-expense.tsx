import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/app-context';
import { ExpenseService } from '@/lib/services/expense-service';
import { GroupService } from '@/lib/services/group-service';
import { parseExpenseInput } from '@/utils/expenseCategorization';
import { validateExpenseInput } from '@/utils/validation';

export default function AddExpenseScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Groceries');
  const [isShared, setIsShared] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const categories = ['Groceries', 'Transport', 'Utilities', 'Dining', 'Entertainment', 'Health', 'Shopping', 'Education', 'Other'];

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
    
    setSaving(true);
    try {
      // Save to Supabase
      const expenseData = {
        user_id: user.id,
        description: parsed.merchant || description,
        amount: parsed.amount,
        category: selectedCategory,
        merchant: parsed.merchant || 'Unknown',
        date: new Date().toISOString().split('T')[0],
        is_shared: isShared,
        group_id: isShared && selectedGroup ? groups.find(g => g.name === selectedGroup)?.id : null,
      };

      const result = await ExpenseService.addExpense(expenseData);
      
      if (result.success) {
        Alert.alert(
          'Success',
          `Expense added:\n${parsed.merchant}: K${parsed.amount}\nCategory: ${selectedCategory}`,
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
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="px-5 pt-4 pb-6 flex-row items-center justify-between border-b border-border bg-surface">
        <ThemedText className="text-text text-xl font-bold">Add Expense</ThemedText>
        <View className="w-6" />
      </View>
      
      <ScrollView className="flex-1 px-5 py-6">
        <View className="bg-surface rounded-2xl p-6 border border-border mb-6">
          <Input
            label="What did you spend on?"
            placeholder="Enter description and amount (e.g., Groceries 150)"
            value={description}
            onChangeText={setDescription}
            error={errors.description}
            containerClassName="mb-6"
          />
          
          <View className="mb-6">
            <ThemedText className="text-text text-lg font-bold mb-4">Category</ThemedText>
            <View className="flex-row flex-wrap gap-2">
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  className={`py-2 px-4 rounded-lg border ${selectedCategory === category ? 'bg-primary border-primary' : 'border-border'}`}
                  onPress={() => setSelectedCategory(category)}
                >
                  <ThemedText className={`text-sm ${selectedCategory === category ? 'text-white font-semibold' : 'text-text'}`}>
                    {category}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View className="mb-6">
            <ThemedText className="text-text text-lg font-bold mb-4">Shared Expense</ThemedText>
            
            <View className="flex-row bg-background rounded-lg p-1 mb-5">
              <TouchableOpacity
                className={`flex-1 flex-row items-center justify-center py-2.5 rounded-md border ${!isShared ? 'bg-primary border-primary' : 'bg-surface border-border'}`}
                onPress={() => setIsShared(false)}
              >
                <IconSymbol 
                  size={20} 
                  name="person.fill" 
                  color={!isShared ? "#ffffff" : "#64748b"} 
                />
                <ThemedText className={`text-sm ml-2 ${!isShared ? 'text-white font-medium' : 'text-text-secondary'}`}>
                  Personal Expense
                </ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                className={`flex-1 flex-row items-center justify-center py-2.5 rounded-md border ml-1 ${isShared ? 'bg-primary border-primary' : 'bg-surface border-border'}`}
                onPress={() => setIsShared(true)}
              >
                <IconSymbol 
                  size={20} 
                  name="person.2.fill" 
                  color={isShared ? "#ffffff" : "#64748b"} 
                />
                <ThemedText className={`text-sm ml-2 ${isShared ? 'text-white font-medium' : 'text-text-secondary'}`}>
                  Shared Expense
                </ThemedText>
              </TouchableOpacity>
            </View>
            
            {isShared && (
              <View className="mb-5">
                <ThemedText className="text-text font-semibold text-base mb-3">Select Group:</ThemedText>
                <View className="mb-4">
                  {groups.length === 0 ? (
                    <ThemedText className="text-text-secondary text-sm text-center py-5">
                      No groups found. Create a group first.
                    </ThemedText>
                  ) : (
                    groups.map((group) => (
                      <TouchableOpacity
                        key={group.id}
                        className={`flex-row items-center p-3 rounded-lg border mb-2 ${selectedGroup === group.name ? 'bg-primary border-primary' : 'bg-background border-border'}`}
                        onPress={() => setSelectedGroup(group.name)}
                      >
                        <IconSymbol 
                          size={16} 
                          name="person.2.fill" 
                          color={selectedGroup === group.name ? "#ffffff" : "#64748b"} 
                        />
                        <ThemedText className={`text-sm ml-2 ${selectedGroup === group.name ? 'text-white font-medium' : 'text-text-secondary'}`}>
                          {group.name}
                        </ThemedText>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
                
                <TouchableOpacity
                  className="flex-row items-center justify-center p-3 rounded-lg bg-success/20 border border-border mb-2"
                  onPress={() => router.push('/create-group')}
                >
                  <IconSymbol 
                    size={16} 
                    name="plus.circle.fill" 
                    color="#10b981" 
                  />
                  <ThemedText className="text-sm ml-2 text-text">
                    Create New Group
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        
        <Button
          title={saving ? "Adding..." : "Add Expense"}
          onPress={addExpense}
          size="large"
          className="w-full"
          disabled={!description.trim() || saving}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
