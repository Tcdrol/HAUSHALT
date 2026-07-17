import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/app-context';
import { BudgetItemService } from '@/lib/services/budget-item-service';
import { BudgetService } from '@/lib/services/budget-service';
import { GroceryService } from '@/lib/services/grocery-service';
import { ZAMBIAN_STORES } from '@/utils/groceryData';

export default function MakeBudgetScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [budgetName, setBudgetName] = useState('');
  const [items, setItems] = useState<{
    id: string;
    name: string;
    category: string;
    store: string;
    quantity: string;
    estimatedPrice: number;
    groceryItemId?: string | null;
  }[]>([
    { id: Date.now().toString(), name: '', category: 'Groceries', store: 'shoprite', quantity: '1', estimatedPrice: 0, groceryItemId: null }
  ]);
  const [saving, setSaving] = useState(false);

  const categories = ['Groceries', 'Transport', 'Utilities', 'Dining', 'Entertainment', 'Health', 'Shopping', 'Education', 'Other'];


  const addItem = async () => {
    const newItem = {
      id: Date.now().toString(),
      name: '',
      category: 'Groceries',
      store: 'shoprite',
      quantity: '1',
      estimatedPrice: 0
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: string, value: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const fetchEstimatedPrice = async (itemName: string): Promise<{ price: number; groceryItemId: string | null }> => {
    try {
      const result = await GroceryService.searchGroceryItems(itemName, 1);
      if (result.success && result.data && result.data.length > 0) {
        const item = result.data[0];
        const priceResult = await GroceryService.getPriceSuggestions(item.id, 'kitwe');
        if (priceResult.success && priceResult.data) {
          return { price: priceResult.data.price, groceryItemId: item.id };
        }
      }
      return { price: 0, groceryItemId: null };
    } catch (error) {
      console.error('Error fetching price:', error);
      return { price: 0, groceryItemId: null };
    }
  };

  const saveBudget = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a budget');
      return;
    }

    const validItems = items.filter(item => item.name.trim());
    if (validItems.length === 0) {
      Alert.alert('Error', 'Please add at least one item with a name and estimated price');
      return;
    }

    setSaving(true);
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      // Get existing budget categories for this month
      const existingResult = await BudgetService.getBudgetCategories(user.id, currentMonth, currentYear);
      const existingCategories = existingResult.success && existingResult.data ? existingResult.data : [];

      // Update or create categories based on budget items
      const categoryColors = ['#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#f97316', '#6366f1', '#14b8a6'];
      const categoryMap: { [key: string]: string } = {}; // Maps category name to category ID
      
      // First, ensure all categories exist
      const uniqueCategories = [...new Set(validItems.map(item => item.category))];
      for (const categoryName of uniqueCategories) {
        const existingCategory = existingCategories.find(cat => cat.name === categoryName);
        
        if (existingCategory) {
          categoryMap[categoryName] = existingCategory.id;
        } else {
          // Create new category
          const colorIndex = categories.indexOf(categoryName);
          const result = await BudgetService.upsertBudgetCategory({
            user_id: user.id,
            name: categoryName,
            planned_amount: 0, // Will be updated after items are added
            spent_amount: 0,
            color: categoryColors[colorIndex % categoryColors.length],
            month: currentMonth,
            year: currentYear,
          });
          if (result.success && result.data) {
            categoryMap[categoryName] = result.data.id;
          }
        }
      }

      // Create budget items for each item
      for (const item of validItems) {
        const categoryId = categoryMap[item.category];
        if (categoryId) {
          await BudgetItemService.createBudgetItem({
            budget_category_id: categoryId,
            grocery_item_id: item.groceryItemId || null,
            name: item.name,
            quantity: parseInt(item.quantity) || 1,
            estimated_price: item.estimatedPrice,
            store: item.store,
          });
        }
      }

      // Recalculate category totals from budget items
      for (const categoryName of uniqueCategories) {
        const categoryId = categoryMap[categoryName];
        if (categoryId) {
          const totalResult = await BudgetItemService.calculateCategoryTotal(categoryId);
          if (totalResult.success && totalResult.data) {
            await BudgetService.updateBudgetCategory(categoryId, {
              planned_amount: totalResult.data.totalEstimated,
            });
          }
        }
      }

      Alert.alert(
        'Budget Created!',
        `Your budget plan has been saved with ${validItems.length} items.\nTotal Estimated: K${validItems.reduce((sum, item) => sum + (item.estimatedPrice * (parseInt(item.quantity) || 1)), 0).toFixed(2)}`,
        [
          { text: 'Start Shopping Later', onPress: () => router.back() },
          { text: 'Start Shopping Now', onPress: () => router.push('/execute-budget') }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1 px-5 py-6">
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol size={24} name="chevron.right" color="#14b8a6" />
          </TouchableOpacity>
          <ThemedText className="text-text text-3xl font-bold">Make Budget</ThemedText>
          <View className="w-6" />
        </View>

        <View className="bg-surface rounded-2xl p-5 border border-border mb-5">
          <ThemedText className="text-text text-lg font-bold mb-4">Budget Name (Optional)</ThemedText>
          <TextInput
            className="bg-background text-text px-4 py-3 rounded-xl text-base border border-border"
            placeholder="e.g., Weekly Shopping, Monthly Budget"
            placeholderTextColor="#64748b"
            value={budgetName}
            onChangeText={setBudgetName}
          />
        </View>

        <View className="mb-5">
          <View className="flex-row items-center justify-between mb-4">
            <ThemedText className="text-text text-lg font-bold">Budget Items</ThemedText>
            <TouchableOpacity onPress={addItem} className="flex-row items-center">
              <IconSymbol size={18} name="plus.circle.fill" color="#10b981" />
              <ThemedText className="text-success text-sm ml-1">Add Item</ThemedText>
            </TouchableOpacity>
          </View>

          {items.map((item, index) => (
            <View key={item.id} className="bg-surface rounded-2xl p-4 border border-border mb-3">
              <View className="flex-row justify-between items-center mb-3">
                <ThemedText className="text-text font-semibold">Item {index + 1}</ThemedText>
                {items.length > 1 && (
                  <TouchableOpacity onPress={() => removeItem(item.id)}>
                    <IconSymbol size={20} name="xmark.circle.fill" color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>

              <TextInput
                className="bg-background text-text px-4 py-3 rounded-xl text-base border border-border mb-3"
                placeholder="Item name"
                placeholderTextColor="#64748b"
                value={item.name}
                onChangeText={async (text) => {
                  updateItem(item.id, 'name', text);
                  if (text.length > 2) {
                    const { price, groceryItemId } = await fetchEstimatedPrice(text);
                    setItems(items.map(i => 
                      i.id === item.id ? { ...i, estimatedPrice: price, groceryItemId } : i
                    ));
                  }
                }}
              />

              <View className="flex-row gap-2 mb-3">
                <View className="flex-1">
                  <ThemedText className="text-text-secondary text-sm mb-1">Quantity</ThemedText>
                  <TextInput
                    className="bg-background text-text px-4 py-3 rounded-xl text-base border border-border"
                    placeholder="1"
                    placeholderTextColor="#64748b"
                    value={item.quantity}
                    onChangeText={(text) => updateItem(item.id, 'quantity', text)}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View className="mb-2">
                <ThemedText className="text-text-secondary text-sm mb-2">Category</ThemedText>
                <View className="flex-row flex-wrap gap-2">
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      className={`py-2 px-3 rounded-lg border ${item.category === category ? 'bg-primary border-primary' : 'border-border'}`}
                      onPress={() => updateItem(item.id, 'category', category)}
                    >
                      <ThemedText className={`text-sm ${item.category === category ? 'text-white font-semibold' : 'text-text'}`}>
                        {category}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View>
                <ThemedText className="text-text-secondary text-sm mb-2">Store</ThemedText>
                <View className="flex-row flex-wrap gap-2">
                  {ZAMBIAN_STORES.map((store) => (
                    <TouchableOpacity
                      key={store.id}
                      className={`py-2 px-3 rounded-lg border ${item.store === store.id ? 'bg-primary border-primary' : 'border-border'}`}
                      onPress={() => updateItem(item.id, 'store', store.id)}
                    >
                      <ThemedText className={`text-sm ${item.store === store.id ? 'text-white font-semibold' : 'text-text'}`}>
                        {store.name}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          ))}
        </View>


        <Button
          title={saving ? "Saving..." : "Save Budget"}
          onPress={saveBudget}
          size="large"
          className="w-full"
          disabled={saving}
        />
      </ScrollView>
    </SafeAreaView>
  );
}