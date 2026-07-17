import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/app-context';
import { BudgetItemService } from '@/lib/services/budget-item-service';
import { BudgetService } from '@/lib/services/budget-service';
import { GroceryService } from '@/lib/services/grocery-service';
import { ZAMBIAN_LOCATIONS, ZAMBIAN_STORES } from '@/utils/groceryData';

export default function ExecuteBudgetScreen() {
  const params = useLocalSearchParams<{ budgetId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [budget, setBudget] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [location, setLocation] = useState('kitwe');
  const [store, setStore] = useState('shoprite');

  useEffect(() => {
    if (params.budgetId) {
      loadBudget();
    }
  }, [params.budgetId]);

  const loadBudget = async () => {
    setLoading(true);
    try {
      // Load budget categories for current month
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      const categoryResult = await BudgetService.getBudgetCategories(user!.id, currentMonth, currentYear);
      if (categoryResult.success && categoryResult.data) {
        setBudget(categoryResult.data);
        
        // Update status to 'in_progress' for all ready categories
        for (const category of categoryResult.data) {
          if (category.status === 'ready') {
            await BudgetService.updateBudgetCategory(category.id, { status: 'in_progress' } as any);
          }
        }
        
        // Load budget items for all categories
        const allBudgetItems: any[] = [];
        for (const category of categoryResult.data) {
          const itemsResult = await BudgetItemService.getBudgetItemsByCategory(category.id);
          if (itemsResult.success && itemsResult.data) {
            const categoryItems = itemsResult.data.map((item: any) => ({
              id: item.id,
              name: item.name,
              category: category.name,
              categoryId: category.id,
              estimatedPrice: item.estimated_price,
              actualPrice: item.actual_price?.toString() || '',
              quantity: item.quantity?.toString() || '1',
              store: item.store || 'shoprite',
              groceryItemId: item.grocery_item_id,
            }));
            allBudgetItems.push(...categoryItems);
          }
        }
        setItems(allBudgetItems);
      }
    } catch (error) {
      console.error('Failed to load budget:', error);
      Alert.alert('Error', 'Failed to load budget');
    } finally {
      setLoading(false);
    }
  };

  const updateActualPrice = (id: string, price: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, actualPrice: price } : item
    ));
  };

  const updateQuantity = (id: string, quantity: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, quantity } : item
    ));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const price = parseFloat(item.actualPrice) || 0;
      const qty = parseInt(item.quantity) || 1;
      return sum + (price * qty);
    }, 0);
  };

  const completeBudget = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    const itemsWithActual = items.filter(item => item.actualPrice && parseFloat(item.actualPrice) > 0);
    if (itemsWithActual.length === 0) {
      Alert.alert('Error', 'Please enter actual prices for at least one item');
      return;
    }

    setSaving(true);
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      // Update each budget item's actual price and record price for future estimates
      for (const item of itemsWithActual) {
        const actualPrice = parseFloat(item.actualPrice);
        const actualTotal = actualPrice * (parseInt(item.quantity) || 1);
        
        // Update budget item with actual price
        await BudgetItemService.updateActualPrice(item.id, actualPrice);
        
        // Record the price for future estimates using grocery_item_id
        if (item.groceryItemId) {
          await GroceryService.recordPrice(
            item.groceryItemId,
            actualPrice,
            store,
            location,
            user.id,
            'high'
          );
        }
      }

      // Recalculate category spent amounts from budget items
      for (const category of budget) {
        const totalResult = await BudgetItemService.calculateCategoryTotal(category.id);
        if (totalResult.success && totalResult.data) {
          await BudgetService.updateBudgetCategory(category.id, {
            spent_amount: totalResult.data.totalActual,
            status: 'completed',
          } as any);
        }
      }

      Alert.alert(
        'Budget Completed!',
        `Total spent: K${calculateTotal().toFixed(2)}\nCategories have been updated.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to complete budget');
    } finally {
      setSaving(false);
    }
  };

  const locationName = ZAMBIAN_LOCATIONS.find(l => l.id === location)?.name || location;

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ThemedText className="text-text-secondary">Loading budget...</ThemedText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1 px-5 py-6">
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol size={24} name="chevron.right" color="#14b8a6" />
          </TouchableOpacity>
          <ThemedText className="text-text text-3xl font-bold">Execute Budget</ThemedText>
          <View className="w-6" />
        </View>

        <View className="bg-surface rounded-2xl p-4 border border-border mb-5">
          <View className="flex-row items-center mb-3">
            <IconSymbol size={20} name="location.fill" color="#f59e0b" />
            <ThemedText className="text-text text-base font-medium ml-2">{locationName}</ThemedText>
          </View>
          <ThemedText className="text-text-secondary text-sm">Select your shopping location</ThemedText>
          <View className="flex-row flex-wrap gap-2 mt-3">
            {ZAMBIAN_LOCATIONS.map((loc) => (
              <TouchableOpacity
                key={loc.id}
                className={`py-2 px-3 rounded-lg border ${location === loc.id ? 'bg-primary border-primary' : 'border-border'}`}
                onPress={() => setLocation(loc.id)}
              >
                <ThemedText className={`text-sm ${location === loc.id ? 'text-white font-semibold' : 'text-text'}`}>
                  {loc.name}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="bg-surface rounded-2xl p-4 border border-border mb-5">
          <ThemedText className="text-text text-base font-medium mb-3">Select Store</ThemedText>
          <View className="flex-row flex-wrap gap-2">
            {ZAMBIAN_STORES.map((storeOption) => (
              <TouchableOpacity
                key={storeOption.id}
                className={`py-2 px-3 rounded-lg border ${store === storeOption.id ? 'bg-primary border-primary' : 'border-border'}`}
                onPress={() => setStore(storeOption.id)}
              >
                <ThemedText className={`text-sm ${store === storeOption.id ? 'text-white font-semibold' : 'text-text'}`}>
                  {storeOption.name}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="mb-5">
          <ThemedText className="text-text text-lg font-bold mb-4">Budget Items</ThemedText>
          
          {items.length === 0 ? (
            <View className="bg-surface rounded-2xl p-4 border border-border">
              <ThemedText className="text-text-secondary text-center">No budget items found. Create a budget first.</ThemedText>
            </View>
          ) : (
            items.map((item, index) => (
              <View key={item.id} className="bg-surface rounded-2xl p-4 border border-border mb-3">
                <View className="flex-row justify-between items-center mb-3">
                  <View className="flex-1">
                    <ThemedText className="text-text font-semibold text-base">{item.name}</ThemedText>
                    <ThemedText className="text-text-secondary text-sm">{item.category}</ThemedText>
                  </View>
                  <View className="items-end">
                    <ThemedText className="text-text-muted text-sm">Est: K{item.estimatedPrice.toFixed(2)}</ThemedText>
                  </View>
                </View>

              <View className="flex-row gap-2">
                <View className="flex-1">
                  <ThemedText className="text-text-secondary text-sm mb-1">Actual Price (K)</ThemedText>
                  <TextInput
                    className="bg-background text-text px-4 py-3 rounded-xl text-base border border-border"
                    placeholder="0.00"
                    placeholderTextColor="#64748b"
                    value={item.actualPrice}
                    onChangeText={(text) => updateActualPrice(item.id, text)}
                    keyboardType="numeric"
                  />
                </View>
                <View className="w-20">
                  <ThemedText className="text-text-secondary text-sm mb-1">Qty</ThemedText>
                  <TextInput
                    className="bg-background text-text px-4 py-3 rounded-xl text-base border border-border"
                    placeholder="1"
                    placeholderTextColor="#64748b"
                    value={item.quantity}
                    onChangeText={(text) => updateQuantity(item.id, text)}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
            ))
          )}
        </View>

        <View className="bg-surface rounded-2xl p-5 border border-border mb-5">
          <View className="flex-row justify-between items-center mb-2">
            <ThemedText className="text-text text-base font-medium">Total Estimated:</ThemedText>
            <ThemedText className="text-text-muted text-lg font-semibold">
              K{items.reduce((sum, item) => sum + (item.estimatedPrice * (parseInt(item.quantity) || 1)), 0).toFixed(2)}
            </ThemedText>
          </View>
          <View className="flex-row justify-between items-center mb-2">
            <ThemedText className="text-text text-base font-medium">Total Actual:</ThemedText>
            <ThemedText className="text-success text-lg font-semibold">K{calculateTotal().toFixed(2)}</ThemedText>
          </View>
          <View className="flex-row justify-between items-center border-t border-border pt-2 mt-2">
            <ThemedText className="text-text text-base font-medium">Difference:</ThemedText>
            <ThemedText className={`text-lg font-bold ${calculateTotal() > items.reduce((sum, item) => sum + (item.estimatedPrice * (parseInt(item.quantity) || 1)), 0) ? 'text-error' : 'text-success'}`}>
              {calculateTotal() > items.reduce((sum, item) => sum + (item.estimatedPrice * (parseInt(item.quantity) || 1)), 0) ? '+' : ''}
              K{(calculateTotal() - items.reduce((sum, item) => sum + (item.estimatedPrice * (parseInt(item.quantity) || 1)), 0)).toFixed(2)}
            </ThemedText>
          </View>
        </View>

        <Button
          title={saving ? "Saving..." : "Complete Budget"}
          onPress={completeBudget}
          size="large"
          className="w-full"
          disabled={saving}
        />
      </ScrollView>
    </SafeAreaView>
  );
}