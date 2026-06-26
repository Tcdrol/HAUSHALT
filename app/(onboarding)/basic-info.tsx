import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useRouter } from 'expo-router';

export default function BasicInfoScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    monthlyIncome: '',
    userType: '',
    location: '',
    householdSize: 1,
    otherLocation: '',
    accommodationType: 'hostel',
  });

  const userTypes = [
    { value: 'student', label: 'Student' },
    { value: 'household', label: 'Household' },
    { value: 'sharing_roommates', label: 'Sharing Roommates' },
  ];

  const locations = [
    { value: 'kitwe', label: 'Kitwe' },
    { value: 'lusaka', label: 'Lusaka' },
    { value: 'other', label: 'Other' },
  ];

  const handleContinue = async () => {
    if (!formData.userType || !formData.location) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    if (formData.location === 'other' && !formData.otherLocation.trim()) {
      Alert.alert('Missing Information', 'Please specify your location.');
      return;
    }

    setLoading(true);
    try {
      // Store form data temporarily (will be saved after sign-up)
      // Navigate to dashboard
      router.push('/(tabs)/dashboard');
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to proceed. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Tell us about yourself
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            This helps us suggest personalized budgets
          </ThemedText>
        </View>
        
        <Card style={styles.formCard}>
          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Monthly Income (Optional)</ThemedText>
            <Input
              placeholder="Enter your monthly income"
              value={formData.monthlyIncome}
              onChangeText={(text) => setFormData({...formData, monthlyIncome: text})}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>
          
          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Your Situation *</ThemedText>
            <View style={styles.options}>
              {userTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.option,
                    formData.userType === type.value && styles.selectedOption
                  ]}
                  onPress={() => setFormData({...formData, userType: type.value})}
                >
                  <View style={[
                    styles.radioCircle,
                    formData.userType === type.value && styles.radioCircleSelected
                  ]}>
                    {formData.userType === type.value && (
                      <View style={styles.radioDot} />
                    )}
                  </View>
                  <ThemedText style={styles.optionText}>
                    {type.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Location *</ThemedText>
            <View style={styles.options}>
              {locations.map((location) => (
                <TouchableOpacity
                  key={location.value}
                  style={[
                    styles.option,
                    formData.location === location.value && styles.selectedOption
                  ]}
                  onPress={() => setFormData({...formData, location: location.value})}
                >
                  <View style={[
                    styles.radioCircle,
                    formData.location === location.value && styles.radioCircleSelected
                  ]}>
                    {formData.location === location.value && (
                      <View style={styles.radioDot} />
                    )}
                  </View>
                  <ThemedText style={styles.optionText}>
                    {location.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
            
            {formData.location === 'other' && (
              <Input
                placeholder="Enter your location"
                value={formData.otherLocation}
                onChangeText={(text) => setFormData({...formData, otherLocation: text})}
                style={styles.otherLocationInput}
              />
            )}
          </View>
          
          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Accommodation Type</ThemedText>
            <View style={styles.options}>
              {['hostel', 'apartment', 'house', 'shared'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.option,
                    formData.accommodationType === type && styles.selectedOption
                  ]}
                  onPress={() => setFormData({...formData, accommodationType: type})}
                >
                  <View style={[
                    styles.radioCircle,
                    formData.accommodationType === type && styles.radioCircleSelected
                  ]}>
                    {formData.accommodationType === type && (
                      <View style={styles.radioDot} />
                    )}
                  </View>
                  <ThemedText style={styles.optionText}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Card>
        
        <Button
          title={loading ? "Saving..." : "Continue"}
          onPress={handleContinue}
          size="large"
          style={styles.button}
          disabled={loading}
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
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
    marginBottom: 30,
    color: '#FFFFFF',
  },
  formCard: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#404040',
    backgroundColor: '#2A2A2A',
    marginBottom: 30,
  },
  formGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#FFFFFF',
  },
  input: {
    marginBottom: 10,
  },
  otherLocationInput: {
    marginTop: 10,
  },
  options: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#404040',
    backgroundColor: '#333333',
  },
  selectedOption: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#666666',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#FFFFFF',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  optionText: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
  },
  householdOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  householdOption: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#404040',
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedHouseholdOption: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  householdNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectedHouseholdNumber: {
    color: '#FFFFFF',
  },
  button: {
    marginTop: 20,
  },
});
