import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/app-context';
import { GroceryService } from '@/lib/services/grocery-service';
import {
    ShoppingListItem,
    UNIVERSAL_STORES
} from '@/utils/groceryData';
import { getPopularItems, searchGroceryItems, suggestItemPrice } from '@/utils/priceSuggestions';

export default function GroceryMultiBudgetScreen() {
  const params = useLocalSearchParams<{ location: string; locationName?: string }>();
  const router = useRouter();
  const { user } = useAuth();
  
  const [location] = useState(params.location || 'kitwe');
  const [locationName] = useState(params.locationName || 'Kitwe');
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [budgetItems, setBudgetItems] = useState<ShoppingListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentStore, setCurrentStore] = useState('');
  const [showStoreSelection, setShowStoreSelection] = useState(true);
  const [showItemSelection, setShowItemSelection] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Search results
  const searchResults = searchQuery.length >= 2 ? searchGroceryItems(searchQuery) : getPopularItems();
  
  const handleStoreToggle = (storeId: string) => {
    setSelectedStores(prev => 
      prev.includes(storeId) 
        ? prev.filter(id => id !== storeId)
        : [...prev, storeId]
    );
  };
  
  const handleContinueToItems = () => {
    if (selectedStores.length === 0) {
      Alert.alert('Stores Required', 'Please select at least one store to budget for.');
      return;
    }
    
    setShowStoreSelection(false);
    setShowItemSelection(true);
    setCurrentStore(selectedStores[0]); // Start with first store
  };
  
  const addItemToBudget = (item: any, storeId: string) => {
    const suggestion = suggestItemPrice(item, location, storeId);
    const listItem: ShoppingListItem = {
      id: Date.now().toString(),
      item,
      suggestedPrice: suggestion.price,
      quantity: 1,
      added: new Date(),
      storeId,
    };
    
    setBudgetItems(prev => [...prev, listItem]);
    setSearchQuery('');
  };

  const addCustomItem = (itemName: string, storeId: string) => {
    const customItem = {
      id: `custom_${Date.now()}`,
      name: itemName.trim(),
      category: 'other' as const,
      unit: 'item',
      baselinePrice: 50,
      lastUpdated: new Date()
    };
    
    const listItem: ShoppingListItem = {
      id: Date.now().toString(),
      item: customItem,
      suggestedPrice: 50,
      quantity: 1,
      added: new Date(),
      storeId,
    };
    
    setBudgetItems(prev => [...prev, listItem]);
    setSearchQuery('');
  };
  
  const removeItemFromBudget = (itemId: string) => {
    setBudgetItems(prev => prev.filter(item => item.id !== itemId));
  };
  
  const calculateEstimatedTotal = () => {
    return budgetItems.reduce((total, item) => total + (item.suggestedPrice * item.quantity), 0);
  };
  
  const getStoreName = (storeId: string) => {
    return UNIVERSAL_STORES.find(s => s.id === storeId)?.name || storeId;
  };
  
  const getStoreTypeIcon = (storeType: string) => {
    switch (storeType) {
      case 'supermarket': return '🏪';
      case 'hypermarket': return '🏬';
      case 'convenience': return '🏪';
      case 'wholesale': return '📦';
      default: return '🏪';
    }
  };
  
  const getItemsByStore = (storeId: string) => {
    return budgetItems.filter(item => item.storeId === storeId);
  };
  
  const startShopping = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a shopping trip.');
      return;
    }

    if (budgetItems.length === 0) {
      Alert.alert('No Items', 'Please add some items to your budget first.');
      return;
    }
    
    setSaving(true);
    try {
      // Create a grocery trip for each store
      const tripIds: string[] = [];
      
      for (const storeId of selectedStores) {
        const storeItems = budgetItems.filter(item => item.storeId === storeId);
        const storeTotal = storeItems.reduce((sum, item) => sum + (item.suggestedPrice * item.quantity), 0);
        
        if (storeItems.length === 0) continue;
        
        const tripResult = await GroceryService.createGroceryTrip({
          user_id: user.id,
          store: storeId,
          location,
          estimated_total: storeTotal,
          date: new Date().toISOString().split('T')[0],
        });
        
        if (!tripResult.success || !tripResult.data) {
          throw new Error(tripResult.error || 'Failed to create trip');
        }
        
        const tripId = tripResult.data.id;
        tripIds.push(tripId);
        
        // Add items to this trip
        for (const item of storeItems) {
          await GroceryService.addTripItem(
            tripId,
            item.item.id,
            item.suggestedPrice,
            item.quantity
          );
        }
      }
      
      // Navigate to shopping screen with the first trip ID
      // In a full implementation, we'd pass all trip IDs
      if (tripIds.length > 0) {
        router.push({
          pathname: '/grocery-multi-shopping',
          params: { 
            tripIds: tripIds.join(','),
            location,
            locationName
          }
        });
      } else {
        Alert.alert('Error', 'No items to shop');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create shopping trips');
    } finally {
      setSaving(false);
    }
  };
  
  const goBackToStores = () => {
    setShowItemSelection(false);
    setShowStoreSelection(true);
  };
  
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1 px-5 py-6">
        <View className="flex-row items-center justify-between mb-5">
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol size={20} name="chevron.right" color="#14b8a6" />
          </TouchableOpacity>
          <ThemedText className="text-text text-2xl font-bold">Multi-Store Budget</ThemedText>
          <View className="w-6" />
        </View>
        
        <View className="bg-surface rounded-2xl p-4 border border-border mb-5">
          <View className="flex-row items-center">
            <IconSymbol size={20} name="house.fill" color="#14b8a6" />
            <ThemedText className="text-text text-base font-medium ml-2">
              {locationName}
            </ThemedText>
          </View>
        </View>
        
        {/* Store Selection */}
        {showStoreSelection && (
          <View className="mb-8">
            <ThemedText className="text-text text-lg font-semibold mb-4">
              Select stores to budget for ({selectedStores.length} selected)
            </ThemedText>
            
            <View className="mb-5">
              {UNIVERSAL_STORES.map(store => (
                <TouchableOpacity
                  key={store.id}
                  className={`p-4 rounded-xl mb-2 border ${selectedStores.includes(store.id) ? 'bg-primary border-primary' : 'bg-surface border-border'}`}
                  onPress={() => handleStoreToggle(store.id)}
                >
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1">
                      <ThemedText className={`text-base font-medium ${selectedStores.includes(store.id) ? 'text-white' : 'text-text'}`}>{store.name}</ThemedText>
                      <ThemedText className={`text-sm mt-0.5 ${selectedStores.includes(store.id) ? 'text-white/70' : 'text-text-secondary'}`}>
                        {getStoreTypeIcon(store.type)} {store.type}
                      </ThemedText>
                    </View>
                    <View className="p-1">
                      {selectedStores.includes(store.id) && (
                        <IconSymbol size={20} name="checkmark.circle.fill" color="#10b981" />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            
            <View className="h-5" />
            
            <Button
              title="Continue to Items →"
              onPress={handleContinueToItems}
              size="large"
              className="w-full"
              disabled={selectedStores.length === 0}
            />
          </View>
        )}
        
        {/* Item Selection */}
        {showItemSelection && (
          <View className="mb-8">
            <View className="flex-row items-center justify-between mb-4">
              <TouchableOpacity onPress={goBackToStores}>
                <IconSymbol size={20} name="chevron.right" color="#14b8a6" />
              </TouchableOpacity>
              <ThemedText className="text-text text-lg font-semibold">Add Budget Items</ThemedText>
              <View className="w-6" />
            </View>
            
            {/* Store Tabs */}
            <View className="flex-row mb-4 bg-background rounded-lg p-1">
              {selectedStores.map(storeId => (
                <TouchableOpacity
                  key={storeId}
                  className={`flex-1 py-2 px-3 rounded-md items-center ${currentStore === storeId ? 'bg-primary' : ''}`}
                  onPress={() => setCurrentStore(storeId)}
                >
                  <ThemedText className={`text-xs font-medium ${currentStore === storeId ? 'text-white' : 'text-text'}`}>
                    {getStoreName(storeId)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
            
            <ThemedText className="text-text text-sm text-center mb-4">
              Adding items for: {getStoreName(currentStore)}
            </ThemedText>
            
            {/* Search Input */}
            <TextInput
              className="bg-surface text-text px-4 py-4 rounded-xl text-base border border-border mb-4"
              placeholder="Type item name or add custom..."
              placeholderTextColor="#64748b"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <View className="mb-5">
                <ThemedText className="text-text text-sm font-medium mb-2">Suggested items:</ThemedText>
                {searchResults.map(item => {
                  const suggestion = suggestItemPrice(item, location, currentStore);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      className="flex-row justify-between items-center bg-surface p-4 rounded-xl mb-2 border border-border"
                      onPress={() => addItemToBudget(item, currentStore)}
                    >
                      <View className="flex-1">
                        <ThemedText className="text-text text-base font-medium">{item.name}</ThemedText>
                        <ThemedText className="text-text-secondary text-sm">{item.unit}</ThemedText>
                      </View>
                      <View className="items-end">
                        <ThemedText className="text-success text-base font-semibold">
                          K{suggestion.price}
                        </ThemedText>
                        <ThemedText className="text-text-secondary text-xs">
                          {getStoreName(currentStore)}
                        </ThemedText>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                
                {/* Custom Item Option */}
                <TouchableOpacity
                  className="flex-row justify-between items-center bg-success/10 p-4 rounded-xl mb-2 border border-success"
                  onPress={() => {
                    if (searchQuery.trim()) {
                      addItemToBudget({
                        id: `custom_${Date.now()}`,
                        name: searchQuery.trim(),
                        category: 'other',
                        unit: 'item',
                        baselinePrice: 50,
                        lastUpdated: new Date()
                      }, currentStore);
                    }
                  }}
                >
                  <View className="flex-1">
                    <ThemedText className="text-text text-base font-medium">+ Add "{searchQuery}"</ThemedText>
                    <ThemedText className="text-text-secondary text-sm">Custom item</ThemedText>
                  </View>
                  <View className="items-end">
                    <ThemedText className="text-success text-base font-semibold">
                      K50 (est.)
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              </View>
            )}
            
            {/* Budget Summary */}
            <View className="bg-surface rounded-2xl p-4 border border-border">
              <ThemedText className="text-text text-base font-semibold mb-3">Budget Summary</ThemedText>
              
              {selectedStores.map(storeId => {
                const storeItems = getItemsByStore(storeId);
                const storeTotal = storeItems.reduce((sum, item) => sum + (item.suggestedPrice * item.quantity), 0);
                
                return (
                  <View key={storeId} className="flex-row justify-between mb-2">
                    <ThemedText className="text-text text-sm">{getStoreName(storeId)}</ThemedText>
                    <ThemedText className="text-text text-sm font-medium">K{storeTotal}</ThemedText>
                  </View>
                );
              })}
              
              <View className="flex-row justify-between items-center border-t border-border pt-2 mt-1">
                <ThemedText className="text-text text-base font-semibold">Total Budget:</ThemedText>
                <ThemedText className="text-success text-lg font-bold">K{calculateEstimatedTotal()}</ThemedText>
              </View>
            </View>
          </View>
        )}
        
        <View className="h-5" />
        
        {showItemSelection && (
          <Button
            title={saving ? "Creating Trips..." : "Start Shopping →"}
            onPress={startShopping}
            size="large"
            className="w-full"
            disabled={budgetItems.length === 0 || saving}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
