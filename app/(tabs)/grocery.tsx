import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
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
    
    // Navigate to grocery shopping with selected store
    router.push({
      pathname: '/grocery-shopping',
      params: { 
        location: selectedLocation,
        locationName: getLocationName(),
        store: store
      }
    });
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
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <View style={styles.header}>
          <IconSymbol size={32} name="cart.fill" color="#0066CC" />
          <ThemedText style={styles.title}>Grocery Shopping</ThemedText>
          {(selectedLocation || showCustomLocation) && (
            <TouchableOpacity onPress={resetSelection}>
              <IconSymbol size={20} name="xmark.circle.fill" color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
        
        <ThemedText style={styles.subtitle}>
          Shop anywhere in Zambia with smart price suggestions
        </ThemedText>
        
        {/* Location Selection */}
        {!showStoreSelection && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Where are you shopping?</ThemedText>
            
            {/* Predefined Locations */}
            <View style={styles.locationGrid}>
              {ZAMBIAN_LOCATIONS.filter((l: any) => !l.isCustom).map(location => (
                <TouchableOpacity
                      key={location.id}
                      style={[
                        styles.locationCard,
                        selectedLocation === location.id && styles.selectedLocation
                      ]}
                      onPress={() => handleLocationSelect(location.id)}
                    >
                      <IconSymbol size={20} name="house.fill" color="#0066CC" />
                      <ThemedText style={styles.locationName}>{location.name}</ThemedText>
                    </TouchableOpacity>
              ))}
              
              {/* Custom Location Option */}
              <TouchableOpacity
                style={[
                  styles.locationCard,
                  styles.customLocationCard,
                  showCustomLocation && styles.selectedLocation
                ]}
                onPress={() => handleLocationSelect('custom')}
              >
                <IconSymbol size={20} name="plus.circle.fill" color="#10B981" />
                <ThemedText style={styles.locationName}>Custom Location</ThemedText>
              </TouchableOpacity>
            </View>
            
            {/* Custom Location Form */}
            {showCustomLocation && (
              <Card style={styles.customForm}>
                <ThemedText style={styles.formTitle}>Create Custom Location</ThemedText>
                
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>Location Name *</ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Chingola, Mufulira, Kasama..."
                    placeholderTextColor="#666"
                    value={customLocationName}
                    onChangeText={setCustomLocationName}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>Province (Optional)</ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Copperbelt, Lusaka..."
                    placeholderTextColor="#666"
                    value={customProvince}
                    onChangeText={setCustomProvince}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>District (Optional)</ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Kitwe District..."
                    placeholderTextColor="#666"
                    value={customDistrict}
                    onChangeText={setCustomDistrict}
                  />
                </View>
                
                <View style={styles.formActions}>
                  <Button
                    title="Cancel"
                    onPress={() => setShowCustomLocation(false)}
                    variant="outline"
                    size="small"
                  />
                  <Button
                    title="Create Location"
                    onPress={handleCreateCustomLocation}
                    size="small"
                  />
                </View>
              </Card>
            )}
          </View>
        )}
        
        {/* Store Selection */}
        {showStoreSelection && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>
              Shopping at: {getLocationName()}
            </ThemedText>
            
            <View style={styles.storeGrid}>
              {UNIVERSAL_STORES.map(store => (
                <Card key={store.id} style={styles.storeCard}>
                  <View style={styles.storeRow}>
                    <View style={styles.storeInfo}>
                      <ThemedText style={styles.storeName}>{store.name}</ThemedText>
                      <ThemedText style={styles.storeType}>
                        {getStoreTypeIcon(store.type)} {store.type}
                      </ThemedText>
                    </View>
                    <Button
                      title="Start"
                      onPress={() => handleStartShopping(store.id)}
                      size="small"
                      variant="outline"
                    />
                  </View>
                </Card>
              ))}
            </View>
          </View>
        )}
        
        <View style={styles.spacer} />
        
        <Card variant="elevated" style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <IconSymbol size={24} name="checkmark.circle.fill" color="#10B981" />
            <ThemedText style={styles.infoTitle}>Universal Shopping</ThemedText>
          </View>
          <ThemedText style={styles.infoText}>
            🛒 Shop at any store type (supermarket, market, street vendor){'\n'}
            📍 Create custom locations anywhere in Zambia{'\n'}
            💰 Get smart price suggestions based on store type{'\n'}
            📊 Track actual vs estimated prices{'\n'}
            🤝 Contribute to community price database
          </ThemedText>
        </Card>
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
    marginLeft: 12,
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
    marginBottom: 30,
    lineHeight: 22,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  locationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  locationCard: {
    width: '48%',
    backgroundColor: '#2A2A2A',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#404040',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  customLocationCard: {
    backgroundColor: '#1E3A1E',
    borderColor: '#10B981',
  },
  selectedLocation: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  locationName: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    color: '#FFFFFF',
  },
  customForm: {
    padding: 20,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#2A2A2A',
    color: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#404040',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  storeGrid: {
    marginBottom: 20,
  },
  storeCard: {
    marginBottom: 10,
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
  },
  storeType: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
  },
  spacer: {
    height: 20,
  },
  infoCard: {
    padding: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
});
