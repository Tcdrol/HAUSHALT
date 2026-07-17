import { useState } from 'react';
import { Alert, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
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
  });

  const userTypes = [
    { value: 'student_hostel', label: 'Student in hostel' },
    { value: 'student_private', label: 'Student renting privately' },
    { value: 'professional', label: 'Young professional' },
    { value: 'sharing_roommates', label: 'Sharing with roommates' },
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
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1 px-5 py-6">
        <View className="mb-8">
          <ThemedText className="text-text text-3xl font-bold mb-2">
            Tell us about yourself
          </ThemedText>
          <ThemedText className="text-text-secondary text-base">
            This helps us suggest personalized budgets
          </ThemedText>
        </View>
        
        <View className="bg-surface rounded-2xl p-6 border border-border mb-8">
          <View className="mb-6">
            <ThemedText className="text-text text-base font-semibold mb-3">Monthly Income (Optional)</ThemedText>
            <Input
              placeholder="Enter your monthly income"
              value={formData.monthlyIncome}
              onChangeText={(text) => setFormData({...formData, monthlyIncome: text})}
              keyboardType="numeric"
            />
          </View>
          
          <View className="mb-6">
            <ThemedText className="text-text text-base font-semibold mb-3">Your Situation *</ThemedText>
            <View className="gap-3">
              {userTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  className={`flex-row items-center py-3 px-4 rounded-lg border ${formData.userType === type.value ? 'bg-primary border-primary' : 'bg-background border-border'}`}
                  onPress={() => setFormData({...formData, userType: type.value})}
                >
                  <View className={`w-5 h-5 rounded-full border-2 mr-3 justify-center items-center ${formData.userType === type.value ? 'border-white' : 'border-text-secondary'}`}>
                    {formData.userType === type.value && (
                      <View className="w-2.5 h-2.5 rounded-full bg-white" />
                    )}
                  </View>
                  <ThemedText className={`text-base flex-1 ${formData.userType === type.value ? 'text-white' : 'text-text'}`}>
                    {type.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View className="mb-6">
            <ThemedText className="text-text text-base font-semibold mb-3">Location *</ThemedText>
            <View className="gap-3">
              {locations.map((location) => (
                <TouchableOpacity
                  key={location.value}
                  className={`flex-row items-center py-3 px-4 rounded-lg border ${formData.location === location.value ? 'bg-primary border-primary' : 'bg-background border-border'}`}
                  onPress={() => setFormData({...formData, location: location.value})}
                >
                  <View className={`w-5 h-5 rounded-full border-2 mr-3 justify-center items-center ${formData.location === location.value ? 'border-white' : 'border-text-secondary'}`}>
                    {formData.location === location.value && (
                      <View className="w-2.5 h-2.5 rounded-full bg-white" />
                    )}
                  </View>
                  <ThemedText className={`text-base flex-1 ${formData.location === location.value ? 'text-white' : 'text-text'}`}>
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
                className="mt-4"
              />
            )}
          </View>
          
          <View className="mb-2">
            <ThemedText className="text-text text-base font-semibold mb-3">People Sharing Expenses</ThemedText>
            <View className="flex-row flex-wrap gap-2.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((size) => (
                <TouchableOpacity
                  key={size}
                  className={`w-12 h-12 rounded-lg border justify-center items-center ${formData.householdSize === size ? 'bg-primary border-primary' : 'bg-background border-border'}`}
                  onPress={() => setFormData({...formData, householdSize: size})}
                >
                  <ThemedText className={`text-lg font-semibold ${formData.householdSize === size ? 'text-white' : 'text-text'}`}>
                    {size}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
        
        <Button
          title={loading ? "Saving..." : "Continue"}
          onPress={handleContinue}
          size="large"
          className="w-full"
          disabled={loading}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

