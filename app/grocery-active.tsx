import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/app-context';
import { BudgetService } from '@/lib/services/budget-service';
import { GroceryService } from '@/lib/services/grocery-service';
import { ZAMBIAN_LOCATIONS, ZAMBIAN_STORES } from '@/utils/groceryData';

export default function GroceryActiveScreen() {
  const params = useLocalSearchParams<{ store: string; location: string; tripId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  
  const [store] = useState(params.store || 'shoprite');
  const [location] = useState(params.location || 'kitwe');
  const [tripId] = useState(params.tripId);
  const [tripItems, setTripItems] = useState<any[]>([]);
  const [actualPrices, setActualPrices] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const storeName = ZAMBIAN_STORES.find(s => s.id === store)?.name || store;
  const locationName = ZAMBIAN_LOCATIONS.find(l => l.id === location)?.name || location;
  
  // Load trip details from database
  useEffect(() => {
    if (tripId) {
      loadTripDetails();
    }
  }, [tripId]);
  
  const loadTripDetails = async () => {
    setLoading(true);
    try {
      const result = await GroceryService.getGroceryTripDetails(tripId!);
      if (result.success && result.data) {
        const items = result.data.grocery_trip_items || [];
        setTripItems(items);
        
        // Load existing actual prices
        const prices: { [key: string]: number } = {};
        items.forEach((item: any) => {
          if (item.actual_price) {
            prices[item.id] = item.actual_price;
          }
        });
        setActualPrices(prices);
      }
    } catch (error) {
      console.error('Failed to load trip:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const updateActualPrice = async (tripItemId: string, price: string) => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return;
    
    setActualPrices(prev => ({
      ...prev,
      [tripItemId]: numPrice
    }));
    
    // Save to database immediately
    const result = await GroceryService.updateTripItemPrice(tripItemId, numPrice);
    if (!result.success) {
      console.error('Failed to update price:', result.error);
    }
  };
  
  const calculateEstimatedTotal = () => {
    return tripItems.reduce((total, item) => total + (item.suggested_price * item.quantity), 0);
  };
  
  const calculateActualTotal = () => {
    return tripItems.reduce((total, item) => {
      const actualPrice = actualPrices[item.id] || item.suggested_price;
      return total + (actualPrice * item.quantity);
    }, 0);
  };
  
  const calculateDifference = () => {
    return calculateActualTotal() - calculateEstimatedTotal();
  };
  
  const saveTrip = async () => {
    if (!user || !tripId) {
      Alert.alert('Error', 'Missing user or trip information');
      return;
    }
    
    const missingPrices = tripItems.filter(item => !actualPrices[item.id]);
    if (missingPrices.length > 0) {
      Alert.alert('Missing Prices', 'Please enter actual prices for all items before saving.');
      return;
    }
    
    setSaving(true);
    
    try {
      // Record all prices to price_records for future suggestions
      for (const item of tripItems) {
        const actualPrice = actualPrices[item.id];
        await GroceryService.recordPrice(
          item.item_id || item.grocery_items?.id,
          actualPrice,
          store,
          location,
          user.id,
          'high'
        );
      }
      
      // Complete the trip
      const actualTotal = calculateActualTotal();
      const result = await GroceryService.completeGroceryTrip(tripId, actualTotal);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to complete trip');
      }

      // Update Groceries budget category with the actual spending
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      const budgetResult = await BudgetService.getBudgetCategories(user.id, currentMonth, currentYear);
      if (budgetResult.success && budgetResult.data) {
        // Find the Groceries category
        const groceriesCategory = budgetResult.data.find(cat => cat.name === 'Groceries');
        if (groceriesCategory) {
          // Update the spent amount
          const newSpentAmount = groceriesCategory.spent_amount + actualTotal;
          await BudgetService.updateBudgetCategory(groceriesCategory.id, {
            spent_amount: newSpentAmount,
          });
        }
      }
      
      Alert.alert(
        'Trip Saved!',
        `Your shopping trip has been saved. ${calculateDifference() >= 0 ? 'You spent' : 'You saved'} K${Math.abs(calculateDifference())}.`,
        [
          { text: 'OK', onPress: () => router.push('/(tabs)/dashboard') }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save trip');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1 px-5 py-6">
        <View className="flex-row items-center justify-between mb-5">
          <ThemedText className="text-text text-2xl font-bold">Update Actual Prices</ThemedText>
          <View className="w-6" />
        </View>
        
        <View className="bg-surface rounded-2xl p-4 border border-border mb-5">
          <View className="flex-row items-center">
            <IconSymbol size={20} name="cart.fill" color="#14b8a6" />
            <ThemedText className="text-text text-base font-medium ml-2">
              {storeName} • {locationName}
            </ThemedText>
          </View>
        </View>
        
        <ThemedText className="text-text text-base text-center mb-5">
          Enter the actual prices you paid at the store:
        </ThemedText>
        
        <View className="mb-5">
          {loading ? (
            <ThemedText className="text-text-secondary text-base text-center py-5">Loading trip...</ThemedText>
          ) : tripItems.length === 0 ? (
            <ThemedText className="text-text-secondary text-base text-center py-5">No items in this trip</ThemedText>
          ) : (
            tripItems.map(item => (
              <View key={item.id} className="bg-surface rounded-2xl p-5 border border-border mb-4">
                <View className="mb-4">
                  <View className="flex-1">
                    <ThemedText className="text-text text-lg font-semibold mb-1">{item.grocery_items?.name || 'Unknown'}</ThemedText>
                    <ThemedText className="text-text-secondary text-sm">{item.grocery_items?.unit || ''}</ThemedText>
                  </View>
                </View>
                
                <View className="flex-row justify-between">
                  <View className="flex-1 items-center">
                    <ThemedText className="text-text-secondary text-sm mb-1">Suggested:</ThemedText>
                    <ThemedText className="text-success text-base font-semibold">K{item.suggested_price}</ThemedText>
                  </View>
                  
                  <View className="flex-1 items-center">
                    <ThemedText className="text-text-secondary text-sm mb-1">Actual:</ThemedText>
                    <TextInput
                      className="bg-background text-text px-3 py-2 rounded-lg text-base border border-border text-center min-w-20"
                      placeholder="K0"
                      placeholderTextColor="#64748b"
                      value={actualPrices[item.id]?.toString() || ''}
                      onChangeText={(text) => updateActualPrice(item.id, text)}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
        
        <View className="bg-surface rounded-2xl p-5 border border-border mb-5">
          <View className="flex-row justify-between items-center mb-3">
            <ThemedText className="text-text text-base font-medium">Estimated:</ThemedText>
            <ThemedText className="text-success text-lg font-semibold">K{calculateEstimatedTotal()}</ThemedText>
          </View>
          
          <View className="flex-row justify-between items-center mb-3">
            <ThemedText className="text-text text-base font-medium">Actual:</ThemedText>
            <ThemedText className="text-text text-lg font-semibold">K{calculateActualTotal()}</ThemedText>
          </View>
          
          <View className="flex-row justify-between items-center border-t border-border pt-3 mt-1">
            <ThemedText className="text-text text-base font-medium">Difference:</ThemedText>
            <ThemedText className={`text-xl font-bold ${calculateDifference() >= 0 ? 'text-error' : 'text-success'}`}>
              {calculateDifference() >= 0 ? '+' : ''}K{calculateDifference()}
            </ThemedText>
          </View>
          
          <ThemedText className="text-text-secondary text-sm text-center mt-2">
            {calculateDifference() >= 0 ? 'You spent more than estimated' : 'You saved money!'}
          </ThemedText>
        </View>
        
        <View className="h-5" />
        
        <Button
          title={saving ? "Saving..." : "Save Trip →"}
          onPress={saveTrip}
          size="large"
          className="w-full"
          disabled={saving || tripItems.length === 0}
        />
      </ScrollView>
    </SafeAreaView>
  );
}