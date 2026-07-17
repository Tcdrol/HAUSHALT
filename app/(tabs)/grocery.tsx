import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { cn } from '@/utils/cn';
import {
    UNIVERSAL_STORES,
    ZAMBIAN_LOCATIONS
} from '@/utils/groceryData';
import { createCustomLocation } from '@/utils/priceSuggestions';

export default function GroceryScreen() {
  const router = useRouter();
  
  const [selectedLocation, setSelectedLocation] = useState('');
  const [customLocationName, setCustomLocationName] = useState('');
  const [customProvince, setCustomProvince] = useState('');
  const [customDistrict, setCustomDistrict] = useState('');
  const [showCustomLocation, setShowCustomLocation] = useState(false);
  const [showStoreSelection, setShowStoreSelection] = useState(false);
  
  const handleLocationSelect = (locationId: string) => {
    if (locationId === 'custom') {
      setShowCustomLocation(true);
    } else {
      setSelectedLocation(locationId);
      setShowCustomLocation(false);
      setShowStoreSelection(true);
    }
  };
  
  const handleCreateCustomLocation = () => {
    if (!customLocationName.trim()) {
      Alert.alert('Location Required', 'Please enter a location name');
      return;
    }
    
    const customLocation = createCustomLocation(
      customLocationName,
      customProvince || undefined,
      customDistrict || undefined
    );
    
    setSelectedLocation(customLocation.id);
    setShowCustomLocation(false);
    setShowStoreSelection(true);
  };
  
  const handleStartShopping = (store: string) => {
    if (!selectedLocation) {
      Alert.alert('Location Required', 'Please select a location first');
      return;
    }
    
    // Show option for single store vs multi-store
    Alert.alert(
      'Shopping Mode',
      'How would you like to shop?',
      [
        {
          text: 'Single Store',
          onPress: () => {
            router.push({
              pathname: '/grocery-shopping',
              params: { store, location: selectedLocation }
            });
          }
        },
        {
          text: 'Multiple Stores',
          onPress: () => {
            router.push({
              pathname: '/grocery-multi-budget',
              params: { 
                location: selectedLocation,
                locationName: getLocationName()
              }
            });
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };
  
  const getLocationName = () => {
    if (selectedLocation.startsWith('custom_')) {
      return customLocationName || 'Custom Location';
    }
    return ZAMBIAN_LOCATIONS.find((l: any) => l.id === selectedLocation)?.name || '';
  };
  
  const resetSelection = () => {
    setSelectedLocation('');
    setShowCustomLocation(false);
    setShowStoreSelection(false);
  };
  
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View className="px-5 pt-4 pb-6">
          <View className="flex-row justify-between items-center mb-4">
            <View className="w-12 h-12 bg-primary/20 rounded-xl items-center justify-center">
              <IconSymbol size={24} name="cart.fill" color="#14b8a6" />
            </View>
            {(selectedLocation || showCustomLocation) && (
              <TouchableOpacity
                onPress={resetSelection}
                className="w-10 h-10 bg-surface rounded-full items-center justify-center"
              >
                <IconSymbol size={20} name="xmark.circle.fill" color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
          <ThemedText className="text-text-muted text-sm uppercase tracking-wider">Smart Shopping</ThemedText>
          <ThemedText className="text-text text-2xl font-bold mt-1">Grocery Shopping</ThemedText>
          <ThemedText className="text-text-secondary text-base mt-2">
            Shop anywhere in Zambia with smart price suggestions
          </ThemedText>
        </View>

        {/* Location Selection */}
        {!showStoreSelection && (
          <View className="px-5 mb-6">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-surface rounded-xl items-center justify-center mr-3">
                <IconSymbol size={20} name="location.fill" color="#f59e0b" />
              </View>
              <ThemedText className="text-text text-lg font-semibold">Where are you shopping?</ThemedText>
            </View>

            {/* Location Grid */}
            <View className="flex-row flex-wrap justify-between">
              {ZAMBIAN_LOCATIONS.filter((l: any) => !l.isCustom).map(location => (
                <TouchableOpacity
                  key={location.id}
                  onPress={() => handleLocationSelect(location.id)}
                  className={cn(
                    'w-[48%] bg-surface rounded-xl p-4 mb-3 border items-center flex-row justify-center',
                    selectedLocation === location.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border'
                  )}
                >
                  <IconSymbol size={18} name="house.fill" color={selectedLocation === location.id ? '#14b8a6' : '#64748b'} />
                  <ThemedText
                    className={cn(
                      'text-sm font-medium ml-2',
                      selectedLocation === location.id ? 'text-primary' : 'text-text'
                    )}
                  >
                    {location.name}
                  </ThemedText>
                </TouchableOpacity>
              ))}

              {/* Custom Location */}
              <TouchableOpacity
                onPress={() => handleLocationSelect('custom')}
                className={cn(
                  'w-[48%] rounded-xl p-4 mb-3 border items-center flex-row justify-center',
                  showCustomLocation
                    ? 'border-success bg-success/10'
                    : 'border-success/50 bg-success/5'
                )}
              >
                <IconSymbol size={18} name="plus.circle.fill" color="#22c55e" />
                <ThemedText className="text-success text-sm font-medium ml-2">Custom Location</ThemedText>
              </TouchableOpacity>
            </View>

            {/* Custom Location Form */}
            {showCustomLocation && (
              <View className="bg-surface rounded-2xl p-5 border border-border mt-4">
                <ThemedText className="text-text text-lg font-semibold mb-4">Create Custom Location</ThemedText>

                <View className="mb-4">
                  <ThemedText className="text-text-secondary text-sm mb-2">Location Name *</ThemedText>
                  <TextInput
                    className="bg-surface-elevated text-text p-4 rounded-xl border border-border text-base"
                    placeholder="e.g., Chingola, Mufulira, Kasama..."
                    placeholderTextColor="#64748b"
                    value={customLocationName}
                    onChangeText={setCustomLocationName}
                  />
                </View>

                <View className="mb-4">
                  <ThemedText className="text-text-secondary text-sm mb-2">Province (Optional)</ThemedText>
                  <TextInput
                    className="bg-surface-elevated text-text p-4 rounded-xl border border-border text-base"
                    placeholder="e.g., Copperbelt, Lusaka..."
                    placeholderTextColor="#64748b"
                    value={customProvince}
                    onChangeText={setCustomProvince}
                  />
                </View>

                <View className="mb-4">
                  <ThemedText className="text-text-secondary text-sm mb-2">District (Optional)</ThemedText>
                  <TextInput
                    className="bg-surface-elevated text-text p-4 rounded-xl border border-border text-base"
                    placeholder="e.g., Kitwe District..."
                    placeholderTextColor="#64748b"
                    value={customDistrict}
                    onChangeText={setCustomDistrict}
                  />
                </View>

                <View className="flex-row gap-3">
                  <Button
                    title="Cancel"
                    onPress={() => setShowCustomLocation(false)}
                    variant="outline"
                    size="medium"
                    className="flex-1"
                  />
                  <Button
                    title="Create"
                    onPress={handleCreateCustomLocation}
                    size="medium"
                    className="flex-1 bg-success"
                    textClassName="text-white"
                  />
                </View>
              </View>
            )}
          </View>
        )}

        {/* Store Selection */}
        {showStoreSelection && (
          <View className="px-5 mb-6">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-surface rounded-xl items-center justify-center mr-3">
                <IconSymbol size={20} name="cart.fill" color="#14b8a6" />
              </View>
              <View className="flex-1">
                <ThemedText className="text-text-muted text-xs uppercase tracking-wider">Shopping at</ThemedText>
                <ThemedText className="text-text text-lg font-semibold">{getLocationName()}</ThemedText>
              </View>
            </View>

            <View className="space-y-3">
              {UNIVERSAL_STORES.map(store => (
                <View key={store.id} className="bg-surface rounded-2xl p-4 border border-border">
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1">
                      <View className="flex-row items-center mb-1">
                        <ThemedText className="text-xl mr-2">{getStoreTypeIcon(store.type)}</ThemedText>
                        <ThemedText className="text-text text-base font-semibold">{store.name}</ThemedText>
                      </View>
                      <ThemedText className="text-text-muted text-sm capitalize">{store.type}</ThemedText>
                    </View>
                    <Button
                      title="Start"
                      onPress={() => handleStartShopping(store.id)}
                      size="small"
                      className="bg-primary"
                      textClassName="text-white"
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Info Card */}
        <View className="px-5">
          <View className="bg-surface rounded-2xl p-5 border border-border">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-success/20 rounded-xl items-center justify-center mr-3">
                <IconSymbol size={20} name="checkmark.circle.fill" color="#22c55e" />
              </View>
              <ThemedText className="text-text text-lg font-semibold">Universal Shopping</ThemedText>
            </View>

            <View className="space-y-3">
              <View className="flex-row items-start">
                <ThemedText className="text-xl mr-3">🛒</ThemedText>
                <ThemedText className="text-text-secondary flex-1">Shop at any store type (supermarket, market, street vendor)</ThemedText>
              </View>
              <View className="flex-row items-start">
                <ThemedText className="text-xl mr-3">📍</ThemedText>
                <ThemedText className="text-text-secondary flex-1">Create custom locations anywhere in Zambia</ThemedText>
              </View>
              <View className="flex-row items-start">
                <ThemedText className="text-xl mr-3">💰</ThemedText>
                <ThemedText className="text-text-secondary flex-1">Get smart price suggestions based on store type</ThemedText>
              </View>
              <View className="flex-row items-start">
                <ThemedText className="text-xl mr-3">📊</ThemedText>
                <ThemedText className="text-text-secondary flex-1">Track actual vs estimated prices</ThemedText>
              </View>
              <View className="flex-row items-start">
                <ThemedText className="text-xl mr-3">🤝</ThemedText>
                <ThemedText className="text-text-secondary flex-1">Contribute to community price database</ThemedText>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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

