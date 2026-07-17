import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/app-context';
import { GroceryService } from '@/lib/services/grocery-service';
import { UNIVERSAL_STORES } from '@/utils/groceryData';

export default function GroceryMultiShoppingScreen() {
  const params = useLocalSearchParams<{ tripIds: string; location: string; locationName?: string }>();
  const router = useRouter();
  const { user } = useAuth();
  
  const [location] = useState(params.location || 'kitwe');
  const [locationName] = useState(params.locationName || 'Kitwe');
  const [currentStoreIndex, setCurrentStoreIndex] = useState(0);
  const [actualPrices, setActualPrices] = useState<{ [key: string]: number }>({});
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Load trip data from database
  useEffect(() => {
    if (params.tripIds) {
      loadTrips();
    }
  }, [params.tripIds]);
  
  const loadTrips = async () => {
    setLoading(true);
    try {
      const tripIds = params.tripIds?.split(',') || [];
      const tripData: any[] = [];
      
      for (const tripId of tripIds) {
        const result = await GroceryService.getGroceryTripDetails(tripId);
        if (result.success && result.data) {
          tripData.push(result.data);
        }
      }
      
      setTrips(tripData);
    } catch (error) {
      console.error('Failed to load trips:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const currentTrip = trips[currentStoreIndex];
  const currentStore = currentTrip?.store || '';
  const currentStoreItems = currentTrip?.grocery_trip_items || [];
  
  const getStoreName = (storeId: string) => {
    return UNIVERSAL_STORES.find(s => s.id === storeId)?.name || storeId;
  };
  
  const updateActualPrice = async (tripItemId: string, price: string) => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return;
    
    setActualPrices(prev => ({
      ...prev,
      [tripItemId]: numPrice
    }));
    
    // Update in database immediately
    const result = await GroceryService.updateTripItemPrice(tripItemId, numPrice);
    if (!result.success) {
      console.error('Failed to update price:', result.error);
    }
  };
  
  const addMissingItem = () => {
    if (!newItemName.trim()) {
      Alert.alert('Item Required', 'Please enter an item name');
      return;
    }
    
    // In real app, this would add item to the trip
    Alert.alert('Item Added', `"${newItemName}" added to your shopping list.`);
    setNewItemName('');
    setShowAddItem(false);
  };
  
  const calculateStoreEstimated = (trip: any) => {
    return trip?.grocery_trip_items?.reduce((total: number, item: any) => 
      total + (item.suggested_price * item.quantity), 0) || 0;
  };
  
  const calculateStoreActual = (trip: any) => {
    return trip?.grocery_trip_items?.reduce((total: number, item: any) => {
      const actualPrice = actualPrices[item.id] || item.suggested_price;
      return total + (actualPrice * item.quantity);
    }, 0) || 0;
  };
  
  const calculateTotalEstimated = () => {
    return trips.reduce((total, trip) => total + calculateStoreEstimated(trip), 0);
  };
  
  const calculateTotalActual = () => {
    return trips.reduce((total, trip) => total + calculateStoreActual(trip), 0);
  };
  
  const calculateDifference = () => {
    return calculateTotalActual() - calculateTotalEstimated();
  };
  
  const goToNextStore = () => {
    if (currentStoreIndex < trips.length - 1) {
      setCurrentStoreIndex(prev => prev + 1);
    }
  };
  
  const goToPreviousStore = () => {
    if (currentStoreIndex > 0) {
      setCurrentStoreIndex(prev => prev - 1);
    }
  };
  
  const saveShoppingTrip = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save shopping trip.');
      return;
    }

    const allItems = trips.flatMap(trip => trip.grocery_trip_items || []);
    const missingPrices = allItems.filter(item => !actualPrices[item.id]);
    
    if (missingPrices.length > 0) {
      Alert.alert('Missing Prices', 'Please enter actual prices for all items before saving.');
      return;
    }
    
    setSaving(true);
    try {
      // Record all prices to price_records
      for (const trip of trips) {
        const store = trip.store;
        const tripItems = trip.grocery_trip_items || [];
        
        for (const item of tripItems) {
          const actualPrice = actualPrices[item.id];
          await GroceryService.recordPrice(
            item.item_id,
            actualPrice,
            store,
            location,
            user.id,
            'high'
          );
        }
        
        // Complete the trip
        const actualTotal = calculateStoreActual(trip);
        await GroceryService.completeGroceryTrip(trip.id, actualTotal);
      }
      
      Alert.alert(
        'Shopping Trip Complete!',
        `Your multi-store shopping trip has been saved. ${calculateDifference() >= 0 ? 'You spent' : 'You saved'} K${Math.abs(calculateDifference())}.`,
        [
          { text: 'OK', onPress: () => router.push('/(tabs)/dashboard') }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save shopping trip');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1 px-5 py-6">
        <View className="flex-row items-center justify-between mb-5">
          <ThemedText className="text-text text-2xl font-bold">Multi-Store Shopping</ThemedText>
          <View className="w-6" />
        </View>
        
        <View className="bg-surface rounded-2xl p-4 border border-border mb-5">
          <View className="flex-row items-center">
            <IconSymbol size={20} name="cart.fill" color="#14b8a6" />
            <ThemedText className="text-text text-base font-medium ml-2">
              {locationName} • {trips.length} stores
            </ThemedText>
          </View>
        </View>
        
        {/* Store Navigation */}
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity
            onPress={goToPreviousStore}
            disabled={currentStoreIndex === 0}
            className={`p-2.5 rounded-lg bg-surface ${currentStoreIndex === 0 ? 'opacity-50' : ''}`}
          >
            <IconSymbol size={20} name="chevron.left" color={currentStoreIndex === 0 ? '#64748b' : '#ffffff'} />
          </TouchableOpacity>
          
          <View className="items-center flex-1">
            <ThemedText className="text-text-secondary text-xs">Store {currentStoreIndex + 1} of {trips.length}</ThemedText>
            <ThemedText className="text-text text-base font-semibold">{getStoreName(currentStore)}</ThemedText>
          </View>
          
          <TouchableOpacity
            onPress={goToNextStore}
            disabled={currentStoreIndex === trips.length - 1}
            className={`p-2.5 rounded-lg bg-surface ${currentStoreIndex === trips.length - 1 ? 'opacity-50' : ''}`}
          >
            <IconSymbol size={20} name="chevron.right" color={currentStoreIndex === trips.length - 1 ? '#64748b' : '#ffffff'} />
          </TouchableOpacity>
        </View>
        
        {/* Store Progress */}
        <View className="flex-row h-1 bg-border rounded-sm mb-5 overflow-hidden">
          {trips.map((trip, index) => (
            <View
              key={trip.id}
              className={`flex-1 mx-0.5 rounded-sm ${index <= currentStoreIndex ? 'bg-success' : 'bg-border'}`}
            />
          ))}
        </View>
        
        {/* Current Store Items */}
        <View className="mb-5">
          <View className="flex-row items-center justify-between mb-4">
            <ThemedText className="text-text text-lg font-semibold">Items at {getStoreName(currentStore)}</ThemedText>
            <TouchableOpacity onPress={() => setShowAddItem(true)}>
              <IconSymbol size={20} name="plus.circle.fill" color="#10b981" />
            </TouchableOpacity>
          </View>
          
          {currentStoreItems.map((item: any) => (
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
          ))}
          
          {/* Store Summary */}
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <View className="flex-row justify-between items-center">
              <ThemedText className="text-text text-base font-medium">Store Total:</ThemedText>
              <ThemedText className="text-success text-lg font-semibold">
                K{calculateStoreActual(currentTrip)}
              </ThemedText>
            </View>
          </View>
        </View>
        
        {/* Overall Summary */}
        <View className="bg-surface rounded-2xl p-5 border border-border mb-5">
          <ThemedText className="text-text text-lg font-semibold mb-4 text-center">Overall Shopping Summary</ThemedText>
          
          {trips.map(trip => (
            <View key={trip.id} className="flex-row justify-between mb-2">
              <ThemedText className="text-text text-sm">{getStoreName(trip.store)}</ThemedText>
              <ThemedText className="text-text text-sm font-medium">
                K{calculateStoreActual(trip)}
              </ThemedText>
            </View>
          ))}
          
          <View className="flex-row justify-between items-center border-t border-border pt-2 mt-1">
            <ThemedText className="text-text text-base font-medium">Total Spent:</ThemedText>
            <ThemedText className="text-text text-xl font-bold">K{calculateTotalActual()}</ThemedText>
          </View>
          
          <View className="flex-row justify-between items-center mt-2">
            <ThemedText className="text-text text-base font-medium">Budget:</ThemedText>
            <ThemedText className="text-success text-base font-semibold">K{calculateTotalEstimated()}</ThemedText>
          </View>
          
          <View className="flex-row justify-between items-center mt-3">
            <ThemedText className="text-text text-base font-medium">Difference:</ThemedText>
            <ThemedText className={`text-lg font-bold ${calculateDifference() >= 0 ? 'text-error' : 'text-success'}`}>
              {calculateDifference() >= 0 ? '+' : ''}K{calculateDifference()}
            </ThemedText>
          </View>
        </View>
        
        {/* Add Item Modal */}
        {showAddItem && (
          <View className="bg-surface rounded-2xl p-5 border border-border mb-5">
            <ThemedText className="text-text text-lg font-semibold mb-4 text-center">Add Missing Item</ThemedText>
            <TextInput
              className="bg-background text-text px-4 py-4 rounded-xl text-base border border-border mb-4"
              placeholder="Enter item name..."
              placeholderTextColor="#64748b"
              value={newItemName}
              onChangeText={setNewItemName}
            />
            <View className="flex-row justify-between">
              <Button
                title="Cancel"
                onPress={() => setShowAddItem(false)}
                variant="outline"
                size="small"
                className="flex-1 mr-2"
              />
              <Button
                title="Add Item"
                onPress={addMissingItem}
                size="small"
                className="flex-1 ml-2"
              />
            </View>
          </View>
        )}
        
        <View className="h-5" />
        
        <Button
          title={saving ? "Saving..." : "Complete Shopping Trip →"}
          onPress={saveShoppingTrip}
          size="large"
          className="w-full"
          disabled={saving}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
