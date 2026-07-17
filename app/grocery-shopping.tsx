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
    GroceryItem,
    ShoppingListItem,
    ZAMBIAN_LOCATIONS,
    ZAMBIAN_STORES
} from '@/utils/groceryData';

export default function GroceryShoppingScreen() {
  const params = useLocalSearchParams<{ location: string }>();
  const router = useRouter();
  const { user } = useAuth();
  
  const [location] = useState(params.location || 'kitwe');
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<GroceryItem | null>(null);
  const [showCustomItemForm, setShowCustomItemForm] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');
  const [customItemQuantity, setCustomItemQuantity] = useState('1');
  const [customItemCategory, setCustomItemCategory] = useState<string>('other');
  const [saving, setSaving] = useState(false);
  
  const locationName = ZAMBIAN_LOCATIONS.find(l => l.id === location)?.name || location;
  
  // Search results - empty since we removed hardcoded items
  const searchResults: GroceryItem[] = [];
  
  const addItemToList = (item: GroceryItem) => {
    const listItem: ShoppingListItem = {
      id: Date.now().toString(),
      item,
      suggestedPrice: item.baselinePrice,
      quantity: 1,
      added: new Date(),
    };
    
    setShoppingList(prev => [...prev, listItem]);
    setSearchQuery('');
    setSelectedItem(null);
  };
  
  const removeItemFromList = (itemId: string) => {
    setShoppingList(prev => prev.filter(item => item.id !== itemId));
  };
  
  const addCustomItem = () => {
    if (!customItemName.trim() || !customItemPrice.trim()) {
      Alert.alert('Error', 'Please enter item name and price');
      return;
    }

    const price = parseFloat(customItemPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    const newItem: ShoppingListItem = {
      id: Date.now().toString(),
      item: {
        id: Date.now().toString(),
        name: customItemName.trim(),
        category: customItemCategory as GroceryItem['category'],
        unit: 'item',
        baselinePrice: price,
        lastUpdated: new Date(),
      },
      suggestedPrice: price,
      actualPrice: price,
      quantity: parseInt(customItemQuantity) || 1,
      added: new Date(),
    };

    setShoppingList([...shoppingList, newItem]);
    setCustomItemName('');
    setCustomItemPrice('');
    setCustomItemQuantity('1');
    setCustomItemCategory('other');
    setShowCustomItemForm(false);
  };
  
  const calculateEstimatedTotal = () => {
    return shoppingList.reduce((total, item) => total + (item.suggestedPrice * item.quantity), 0);
  };
  
  const startShopping = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a shopping trip.');
      return;
    }

    if (shoppingList.length === 0) {
      Alert.alert('No Items', 'Please add some items to your shopping list first.');
      return;
    }
    
    if (!selectedStore) {
      Alert.alert('Select Store', 'Please select a store first.');
      return;
    }
    
    setSaving(true);
    try {
      // Create grocery trip in database
      const estimatedTotal = calculateEstimatedTotal();
      const tripResult = await GroceryService.createGroceryTrip({
        user_id: user.id,
        store: selectedStore,
        location,
        estimated_total: estimatedTotal,
        date: new Date().toISOString().split('T')[0],
      });
      
      if (!tripResult.success || !tripResult.data) {
        throw new Error(tripResult.error || 'Failed to create trip');
      }
      
      const tripId = tripResult.data.id;
      
      // Add items to the trip
      for (const listItem of shoppingList) {
        await GroceryService.addTripItem(
          tripId,
          listItem.item.id,
          listItem.suggestedPrice,
          listItem.quantity
        );
      }
      
      router.push({
        pathname: '/grocery-active',
        params: { 
          store: selectedStore, 
          location, 
          tripId 
        }
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create shopping trip');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1 px-5 py-6">
        <View className="flex-row items-center justify-between mb-5">
          <ThemedText className="text-text text-2xl font-bold">Shopping List</ThemedText>
          <View className="w-6" />
        </View>
        
        <View className="bg-surface rounded-2xl p-4 border border-border mb-5">
          <ThemedText className="text-text text-base font-medium mb-3">Location: {locationName}</ThemedText>
          <ThemedText className="text-text text-base font-semibold mb-3">Select Store:</ThemedText>
          <View className="flex-row flex-wrap gap-2">
            {ZAMBIAN_STORES.map((store) => (
              <TouchableOpacity
                key={store.id}
                className={`py-2 px-4 rounded-lg border ${selectedStore === store.id ? 'bg-primary border-primary' : 'border-border'}`}
                onPress={() => setSelectedStore(store.id)}
              >
                <ThemedText className={`text-sm ${selectedStore === store.id ? 'text-white font-semibold' : 'text-text'}`}>
                  {store.name}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View className="mb-5">
          <ThemedText className="text-text text-lg font-semibold mb-3">Add items:</ThemedText>
          <TextInput
            className="bg-surface text-text px-4 py-4 rounded-xl text-base border border-border"
            placeholder="Type item name..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        {/* Add Custom Item Button */}
        <TouchableOpacity
          className="flex-row items-center justify-center py-3 rounded-lg bg-primary/20 border border-border mb-5"
          onPress={() => setShowCustomItemForm(!showCustomItemForm)}
        >
          <IconSymbol size={18} name="plus.circle.fill" color="#10b981" />
          <ThemedText className="text-text text-sm ml-2">
            {showCustomItemForm ? 'Cancel' : 'Add Custom Item'}
          </ThemedText>
        </TouchableOpacity>
        
        {/* Search Results - removed since we removed hardcoded items */}
        {searchResults.length > 0 && (
          <View className="mb-5">
            {searchResults.map(item => (
              <TouchableOpacity
                key={item.id}
                className="flex-row justify-between items-center bg-surface p-4 rounded-xl mb-2 border border-border"
                onPress={() => addItemToList(item)}
              >
                <View className="flex-1">
                  <ThemedText className="text-text text-base font-medium">{item.name}</ThemedText>
                  <ThemedText className="text-text-secondary text-sm">{item.unit}</ThemedText>
                </View>
                <View className="items-end">
                  <ThemedText className="text-success text-base font-semibold">
                    K{item.baselinePrice}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {/* Shopping List */}
        <View className="mb-5">
          <ThemedText className="text-text text-lg font-semibold mb-3">
            Current List ({shoppingList.length} items)
          </ThemedText>
          
          {shoppingList.map(listItem => (
            <View key={listItem.id} className="bg-surface rounded-2xl p-4 border border-border mb-2">
              <View className="flex-row justify-between items-center">
                <View className="flex-1">
                  <ThemedText className="text-text text-base font-medium">{listItem.item.name}</ThemedText>
                  <ThemedText className="text-text-secondary text-sm">
                    K{listItem.suggestedPrice}
                  </ThemedText>
                </View>
                <TouchableOpacity
                  onPress={() => removeItemFromList(listItem.id)}
                  className="p-1"
                >
                  <IconSymbol size={20} name="xmark.circle.fill" color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          
          {shoppingList.length > 0 && (
            <View className="bg-surface rounded-2xl p-5 border border-border mt-3">
              <View className="flex-row justify-between items-center">
                <ThemedText className="text-text text-lg font-semibold">Estimated Total:</ThemedText>
                <ThemedText className="text-success text-xl font-bold">
                  K{calculateEstimatedTotal()}
                </ThemedText>
              </View>
            </View>
          )}
        </View>
        
        {/* Custom Item Form */}
        {showCustomItemForm && (
          <View className="bg-surface rounded-2xl p-5 border border-border mb-5">
            <ThemedText className="text-text text-lg font-semibold mb-4">Add Custom Item</ThemedText>
            
            <TextInput
              className="bg-background text-text px-4 py-3 rounded-xl text-base border border-border mb-3"
              placeholder="Item name"
              placeholderTextColor="#64748b"
              value={customItemName}
              onChangeText={setCustomItemName}
            />
            
            <View className="flex-row gap-2 mb-3">
              <TextInput
                className="flex-1 bg-background text-text px-4 py-3 rounded-xl text-base border border-border"
                placeholder="Price (ZMW)"
                placeholderTextColor="#64748b"
                value={customItemPrice}
                onChangeText={setCustomItemPrice}
                keyboardType="numeric"
              />
              <TextInput
                className="flex-1 bg-background text-text px-4 py-3 rounded-xl text-base border border-border"
                placeholder="Qty"
                placeholderTextColor="#64748b"
                value={customItemQuantity}
                onChangeText={setCustomItemQuantity}
                keyboardType="numeric"
              />
            </View>

            <View className="mb-4">
              <ThemedText className="text-text text-base font-semibold mb-2">Category</ThemedText>
              <View className="flex-row flex-wrap gap-2">
                {['grains', 'oils', 'vegetables', 'proteins', 'dairy', 'household', 'other'].map((category) => (
                  <TouchableOpacity
                    key={category}
                    className={`py-2 px-3 rounded-lg border ${customItemCategory === category ? 'bg-primary border-primary' : 'border-border'}`}
                    onPress={() => setCustomItemCategory(category)}
                  >
                    <ThemedText className={`text-sm ${customItemCategory === category ? 'text-white font-semibold' : 'text-text'}`}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View className="flex-row gap-2">
              <Button
                title="Cancel"
                onPress={() => setShowCustomItemForm(false)}
                variant="outline"
                size="small"
                className="flex-1"
              />
              <Button
                title="Add Item"
                onPress={addCustomItem}
                size="small"
                className="flex-1"
              />
            </View>
          </View>
        )}
        
        {!showCustomItemForm && (
          <Button
            title="+ Add Custom Item"
            onPress={() => setShowCustomItemForm(true)}
            variant="outline"
            size="medium"
            className="w-full mb-5"
          />
        )}
        
        <View className="h-5" />
        
        <Button
          title={saving ? "Creating Trip..." : "Complete Shopping →"}
          onPress={startShopping}
          size="large"
          className="w-full"
          disabled={shoppingList.length === 0 || saving}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
