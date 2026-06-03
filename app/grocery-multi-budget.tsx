import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import {
    MultiStoreBudget,
    ShoppingListItem,
    UNIVERSAL_STORES
} from '@/utils/groceryData';
import { getPopularItems, searchGroceryItems, suggestItemPrice } from '@/utils/priceSuggestions';

export default function GroceryMultiBudgetScreen() {
  const params = useLocalSearchParams<{ location: string; locationName?: string }>();
  const router = useRouter();
  
  const [location] = useState(params.location || 'kitwe');
  const [locationName] = useState(params.locationName || 'Kitwe');
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [budgetItems, setBudgetItems] = useState<ShoppingListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentStore, setCurrentStore] = useState('');
  const [showStoreSelection, setShowStoreSelection] = useState(true);
  const [showItemSelection, setShowItemSelection] = useState(false);
  
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
  
  const removeItemFromBudget = (itemId: string) => {
    setBudgetItems(prev => prev.filter(item => item.id !== itemId));
  };
  
  const calculateEstimatedTotal = () => {
    return budgetItems.reduce((total, item) => total + (item.suggestedPrice * item.quantity), 0);
  };
  
  const getStoreName = (storeId: string) => {
    return UNIVERSAL_STORES.find(s => s.id === storeId)?.name || storeId;
  };
  
  const getItemsByStore = (storeId: string) => {
    return budgetItems.filter(item => item.storeId === storeId);
  };
  
  const startShopping = () => {
    if (budgetItems.length === 0) {
      Alert.alert('No Items', 'Please add some items to your budget first.');
      return;
    }
    
    // Create multi-store budget
    const multiStoreBudget: MultiStoreBudget = {
      id: Date.now().toString(),
      location,
      items: budgetItems,
      stores: selectedStores,
      estimatedTotal: calculateEstimatedTotal(),
      date: new Date(),
      status: 'planning',
    };
    
    // Navigate to shopping screen with budget data
    router.push({
      pathname: '/grocery-multi-shopping',
      params: { 
        budgetId: multiStoreBudget.id,
        location,
        locationName
      }
    });
  };
  
  const goBackToStores = () => {
    setShowItemSelection(false);
    setShowStoreSelection(true);
  };
  
  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol size={20} name="chevron.right" color="#0066CC" />
          </TouchableOpacity>
          <ThemedText style={styles.title}>Multi-Store Budget</ThemedText>
          <View style={styles.placeholder} />
        </View>
        
        <Card style={styles.locationCard}>
          <View style={styles.locationInfo}>
            <IconSymbol size={20} name="house.fill" color="#0066CC" />
            <ThemedText style={styles.locationText}>
              {locationName}
            </ThemedText>
          </View>
        </Card>
        
        {/* Store Selection */}
        {showStoreSelection && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              Select stores to budget for ({selectedStores.length} selected)
            </ThemedText>
            
            <View style={styles.storeGrid}>
              {UNIVERSAL_STORES.map(store => (
                <TouchableOpacity
                  key={store.id}
                  style={[
                    styles.storeCard,
                    selectedStores.includes(store.id) && styles.selectedStore
                  ]}
                  onPress={() => handleStoreToggle(store.id)}
                >
                  <View style={styles.storeRow}>
                    <View style={styles.storeInfo}>
                      <ThemedText style={styles.storeName}>{store.name}</ThemedText>
                      <ThemedText style={styles.storeType}>
                        {getStoreTypeIcon(store.type)} {store.type}
                      </ThemedText>
                    </View>
                    <View style={styles.checkbox}>
                      {selectedStores.includes(store.id) && (
                        <IconSymbol size={20} name="checkmark.circle.fill" color="#10B981" />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.spacer} />
            
            <Button
              title="Continue to Items →"
              onPress={handleContinueToItems}
              size="large"
              disabled={selectedStores.length === 0}
            />
          </View>
        )}
        
        {/* Item Selection */}
        {showItemSelection && (
          <View style={styles.section}>
            <View style={styles.itemHeader}>
              <TouchableOpacity onPress={goBackToStores}>
                <IconSymbol size={20} name="chevron.right" color="#0066CC" />
              </TouchableOpacity>
              <ThemedText style={styles.sectionTitle}>Add Budget Items</ThemedText>
              <View style={styles.placeholder} />
            </View>
            
            {/* Store Tabs */}
            <View style={styles.storeTabs}>
              {selectedStores.map(storeId => (
                <TouchableOpacity
                  key={storeId}
                  style={[
                    styles.storeTab,
                    currentStore === storeId && styles.activeStoreTab
                  ]}
                  onPress={() => setCurrentStore(storeId)}
                >
                  <ThemedText style={[
                    styles.storeTabText,
                    currentStore === storeId && styles.activeStoreTabText
                  ]}>
                    {getStoreName(storeId)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
            
            <ThemedText style={styles.currentStoreText}>
              Adding items for: {getStoreName(currentStore)}
            </ThemedText>
            
            {/* Search Input */}
            <TextInput
              style={styles.searchInput}
              placeholder="Type item name or add custom..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <View style={styles.resultsSection}>
                <ThemedText style={styles.resultsTitle}>Suggested items:</ThemedText>
                {searchResults.map(item => {
                  const suggestion = suggestItemPrice(item, location, currentStore);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.itemCard}
                      onPress={() => addItemToBudget(item, currentStore)}
                    >
                      <View style={styles.itemInfo}>
                        <ThemedText style={styles.itemName}>{item.name}</ThemedText>
                        <ThemedText style={styles.itemUnit}>{item.unit}</ThemedText>
                      </View>
                      <View style={styles.priceInfo}>
                        <ThemedText style={styles.suggestedPrice}>
                          K{suggestion.price}
                        </ThemedText>
                        <ThemedText style={styles.storeIndicator}>
                          {getStoreName(currentStore)}
                        </ThemedText>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                
                {/* Custom Item Option */}
                <TouchableOpacity
                  style={[styles.itemCard, styles.customItemCard]}
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
                  <View style={styles.itemInfo}>
                    <ThemedText style={styles.itemName}>+ Add &quot;{searchQuery}&quot;</ThemedText>
                    <ThemedText style={styles.itemUnit}>Custom item</ThemedText>
                  </View>
                  <View style={styles.priceInfo}>
                    <ThemedText style={styles.suggestedPrice}>
                      K50 (est.)
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              </View>
            )}
            
            {/* Budget Summary */}
            <View style={styles.budgetSummary}>
              <ThemedText style={styles.summaryTitle}>Budget Summary</ThemedText>
              
              {selectedStores.map(storeId => {
                const storeItems = getItemsByStore(storeId);
                const storeTotal = storeItems.reduce((sum, item) => sum + (item.suggestedPrice * item.quantity), 0);
                
                return (
                  <View key={storeId} style={styles.storeSummary}>
                    <ThemedText style={styles.storeSummaryName}>{getStoreName(storeId)}</ThemedText>
                    <ThemedText style={styles.storeSummaryTotal}>K{storeTotal}</ThemedText>
                  </View>
                );
              })}
              
              <View style={[styles.summaryRow, styles.totalRow]}>
                <ThemedText style={styles.totalLabel}>Total Budget:</ThemedText>
                <ThemedText style={styles.totalAmount}>K{calculateEstimatedTotal()}</ThemedText>
              </View>
            </View>
          </View>
        )}
        
        <View style={styles.spacer} />
        
        {showItemSelection && (
          <Button
            title="Start Shopping →"
            onPress={startShopping}
            size="large"
            disabled={budgetItems.length === 0}
          />
        )}
      </ThemedView>
    </ScrollView>
  );
}

function getStoreTypeIcon(type: string): string {
  const icons: { [key: string]: string } = {
    'supermarket': '🏪',
    'market': '🏛️',
    'convenience': '🏪',
    'pharmacy': '💊',
    'hardware': '🔧',
    'butcher': '🥩',
    'bakery': '🍞',
    'other': '📍',
  };
  return icons[type] || '📍';
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
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#FFFFFF',
  },
  storeGrid: {
    marginBottom: 20,
  },
  storeCard: {
    backgroundColor: '#2A2A2A',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#404040',
  },
  selectedStore: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  storeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  storeType: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
    color: '#FFFFFF',
  },
  checkbox: {
    padding: 4,
  },
  spacer: {
    height: 20,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  storeTabs: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 4,
  },
  storeTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeStoreTab: {
    backgroundColor: '#0066CC',
  },
  storeTabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  activeStoreTabText: {
    color: '#FFFFFF',
  },
  currentStoreText: {
    fontSize: 14,
    marginBottom: 15,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  searchInput: {
    backgroundColor: '#2A2A2A',
    color: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#404040',
    marginBottom: 15,
  },
  resultsSection: {
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 10,
    color: '#FFFFFF',
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
  customItemCard: {
    backgroundColor: '#1E3A1E',
    borderColor: '#10B981',
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
  storeIndicator: {
    fontSize: 12,
    opacity: 0.7,
    color: '#FFFFFF',
  },
  budgetSummary: {
    backgroundColor: '#2A2A2A',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#404040',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#FFFFFF',
  },
  storeSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  storeSummaryName: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  storeSummaryTotal: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#404040',
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
});
