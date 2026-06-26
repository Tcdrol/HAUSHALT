import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import {
  GroceryItem,
  ShoppingListItem,
  ZAMBIAN_LOCATIONS,
  ZAMBIAN_STORES
} from '@/utils/groceryData';
import { getPopularItems, searchGroceryItems, suggestItemPrice } from '@/utils/priceSuggestions';

export default function GroceryShoppingScreen() {
  const params = useLocalSearchParams<{ store: string; location: string }>();
  const router = useRouter();
  
  const [store] = useState(params.store || 'shoprite');
  const [location] = useState(params.location || 'kitwe');
  const [searchQuery, setSearchQuery] = useState('');
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<GroceryItem | null>(null);
  const [showCustomItemForm, setShowCustomItemForm] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');
  const [customItemQuantity, setCustomItemQuantity] = useState('1');
  const [customItemCategory, setCustomItemCategory] = useState<string>('other');
  
  const storeName = ZAMBIAN_STORES.find(s => s.id === store)?.name || store;
  const locationName = ZAMBIAN_LOCATIONS.find(l => l.id === location)?.name || location;
  
  // Search results
  const searchResults = searchQuery.length >= 2 ? searchGroceryItems(searchQuery) : getPopularItems();
  
  const addItemToList = (item: GroceryItem) => {
    const suggestion = suggestItemPrice(item, location, store);
    const listItem: ShoppingListItem = {
      id: Date.now().toString(),
      item,
      suggestedPrice: suggestion.price,
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
  
  const startShopping = () => {
    if (shoppingList.length === 0) {
      Alert.alert('No Items', 'Please add some items to your shopping list first.');
      return;
    }
    
    router.push({
      pathname: '/grocery-active',
      params: { 
        store, 
        location, 
        listId: Date.now().toString() 
      }
    });
  };
  
  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Shopping List</ThemedText>
          <View style={styles.placeholder} />
        </View>
        
        <Card style={styles.locationCard}>
          <View style={styles.locationInfo}>
            <IconSymbol size={20} name="cart.fill" color="#0066CC" />
            <ThemedText style={styles.locationText}>
              {storeName} • {locationName}
            </ThemedText>
          </View>
        </Card>
        
        <View style={styles.searchSection}>
          <ThemedText style={styles.sectionTitle}>Add items:</ThemedText>
          <TextInput
            style={styles.searchInput}
            placeholder="Type item name..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        {/* Search Results */}
        {searchResults.length > 0 && (
          <View style={styles.resultsSection}>
            {searchResults.map(item => {
              const suggestion = suggestItemPrice(item, location, store);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.itemCard}
                  onPress={() => addItemToList(item)}
                >
                  <View style={styles.itemInfo}>
                    <ThemedText style={styles.itemName}>{item.name}</ThemedText>
                    <ThemedText style={styles.itemUnit}>{item.unit}</ThemedText>
                  </View>
                  <View style={styles.priceInfo}>
                    <ThemedText style={styles.suggestedPrice}>
                      K{suggestion.price}
                    </ThemedText>
                    <ThemedText style={styles.confidence}>
                      {suggestion.confidence === 'high' ? '🔥' : 
                       suggestion.confidence === 'medium' ? '📊' : '💡'}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        
        {/* Shopping List */}
        <View style={styles.listSection}>
          <ThemedText style={styles.sectionTitle}>
            Current List ({shoppingList.length} items)
          </ThemedText>
          
          {shoppingList.map(listItem => (
            <Card key={listItem.id} style={styles.listItemCard}>
              <View style={styles.listItemRow}>
                <View style={styles.listItemInfo}>
                  <ThemedText style={styles.listItemName}>{listItem.item.name}</ThemedText>
                  <ThemedText style={styles.listItemPrice}>
                    K{listItem.suggestedPrice}
                  </ThemedText>
                </View>
                <TouchableOpacity
                  onPress={() => removeItemFromList(listItem.id)}
                  style={styles.removeButton}
                >
                  <IconSymbol size={20} name="xmark.circle.fill" color="#EF4444" />
                </TouchableOpacity>
              </View>
            </Card>
          ))}
          
          {shoppingList.length > 0 && (
            <Card variant="elevated" style={styles.totalCard}>
              <View style={styles.totalRow}>
                <ThemedText style={styles.totalLabel}>Estimated Total:</ThemedText>
                <ThemedText style={styles.totalAmount}>
                  K{calculateEstimatedTotal()}
                </ThemedText>
              </View>
            </Card>
          )}
        </View>
        
        {/* Custom Item Form */}
        {showCustomItemForm && (
          <Card style={styles.customItemCard}>
            <ThemedText style={styles.customItemTitle}>Add Custom Item</ThemedText>
            
            <TextInput
              style={styles.customItemInput}
              placeholder="Item name"
              placeholderTextColor="#666"
              value={customItemName}
              onChangeText={setCustomItemName}
            />
            
            <View style={styles.customItemRow}>
              <TextInput
                style={[styles.customItemInput, styles.halfInput]}
                placeholder="Price (ZMW)"
                placeholderTextColor="#666"
                value={customItemPrice}
                onChangeText={setCustomItemPrice}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.customItemInput, styles.halfInput]}
                placeholder="Qty"
                placeholderTextColor="#666"
                value={customItemQuantity}
                onChangeText={setCustomItemQuantity}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.categorySection}>
              <ThemedText style={styles.categoryLabel}>Category</ThemedText>
              <View style={styles.categoryOptions}>
                {['grains', 'oils', 'vegetables', 'proteins', 'dairy', 'household', 'other'].map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryOption,
                      customItemCategory === category && styles.selectedCategoryOption
                    ]}
                    onPress={() => setCustomItemCategory(category)}
                  >
                    <ThemedText style={[
                      styles.categoryOptionText,
                      customItemCategory === category && styles.selectedCategoryOptionText
                    ]}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.customItemButtons}>
              <Button
                title="Cancel"
                onPress={() => setShowCustomItemForm(false)}
                variant="outline"
                size="small"
              />
              <Button
                title="Add Item"
                onPress={addCustomItem}
                size="small"
              />
            </View>
          </Card>
        )}
        
        {!showCustomItemForm && (
          <Button
            title="+ Add Custom Item"
            onPress={() => setShowCustomItemForm(true)}
            variant="outline"
            size="medium"
            style={styles.addCustomButton}
          />
        )}
        
        <View style={styles.spacer} />
        
        <Button
          title="Complete Shopping →"
          onPress={startShopping}
          size="large"
          disabled={shoppingList.length === 0}
        />
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 24,
  },
  locationCard: {
    padding: 15,
    marginBottom: 20,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  searchSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#FFFFFF',
  },
  searchInput: {
    backgroundColor: '#2A2A2A',
    color: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#404040',
  },
  resultsSection: {
    marginBottom: 20,
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    padding: 15,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#404040',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  itemUnit: {
    fontSize: 14,
    opacity: 0.7,
    color: '#FFFFFF',
  },
  priceInfo: {
    alignItems: 'flex-end',
  },
  suggestedPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  confidence: {
    fontSize: 12,
    marginTop: 2,
  },
  listSection: {
    marginBottom: 20,
  },
  listItemCard: {
    padding: 15,
    marginBottom: 8,
  },
  listItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listItemInfo: {
    flex: 1,
  },
  listItemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  listItemPrice: {
    fontSize: 14,
    opacity: 0.8,
  },
  removeButton: {
    padding: 4,
  },
  totalCard: {
    padding: 20,
    marginTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  spacer: {
    height: 20,
  },
  customItemCard: {
    padding: 20,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#404040',
  },
  customItemTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#FFFFFF',
  },
  customItemInput: {
    backgroundColor: '#1A1A1A',
    color: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#404040',
    marginBottom: 10,
  },
  customItemRow: {
    flexDirection: 'row',
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  categorySection: {
    marginBottom: 15,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#FFFFFF',
  },
  categoryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#404040',
    backgroundColor: '#333333',
  },
  selectedCategoryOption: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  categoryOptionText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  selectedCategoryOptionText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  customItemButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  addCustomButton: {
    marginBottom: 20,
  },
});
