import { useEffect, useState } from 'react';
import { Alert, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/app-context';
import { ProfileService } from '@/lib/services/profile-service';
import { useRouter } from 'expo-router';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<{
    fullName: string;
    email: string;
    userType: 'student' | 'household' | 'sharing_roommates';
    location: 'kitwe' | 'lusaka' | 'other';
    householdSize: number;
  }>({
    fullName: '',
    email: '',
    userType: 'student',
    location: 'kitwe',
    householdSize: 1,
  });

  // Load user profile from Supabase
  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await ProfileService.getProfile(user.id);
      if (result.success && result.data) {
        setFormData({
          fullName: result.data.full_name || '',
          email: result.data.email || user.email || '',
          userType: result.data.user_type || 'student',
          location: result.data.location || 'kitwe',
          householdSize: result.data.household_size || 1,
        });
      } else {
        // Use user metadata if profile doesn't exist yet
        setFormData(prev => ({
          ...prev,
          fullName: user.user_metadata?.full_name || '',
          email: user.email || '',
        }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to update profile');
      return;
    }

    setSaving(true);
    try {
      const result = await ProfileService.upsertProfile(user.id, {
        full_name: formData.fullName,
        email: formData.email,
        user_type: formData.userType,
        location: formData.location,
        household_size: formData.householdSize,
      });

      if (result.success) {
        Alert.alert(
          'Profile Updated',
          'Your profile has been successfully updated.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        throw new Error(result.error || 'Failed to update profile');
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to update profile. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1 px-5 py-6">
        <View className="flex-row justify-between items-center mb-6">
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol size={24} name="chevron.right" color="#14b8a6" />
          </TouchableOpacity>
          <ThemedText className="text-text text-3xl font-bold">Edit Profile</ThemedText>
          <View className="w-6" />
        </View>
        
        <View className="bg-surface rounded-2xl p-5 border border-border">
          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={formData.fullName}
            onChangeText={(text) => setFormData({...formData, fullName: text})}
          />
          
          <Input
            label="Email"
            placeholder="Enter your email"
            value={formData.email}
            onChangeText={(text) => setFormData({...formData, email: text})}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <View className="mt-6">
            <ThemedText className="text-text text-lg font-bold mb-4">User Type</ThemedText>
            <View className="flex-row flex-wrap gap-2.5">
              {['student', 'household', 'sharing_roommates'].map((type) => (
                <TouchableOpacity
                  key={type}
                  className={`py-3 px-4 rounded-lg border min-w-28 items-center ${formData.userType === type ? 'bg-primary border-primary' : 'border-border'}`}
                  onPress={() => setFormData({...formData, userType: type as 'student' | 'household' | 'sharing_roommates'})}
                >
                  <ThemedText className={`text-sm ${formData.userType === type ? 'text-white font-semibold' : 'text-text'}`}>
                    {type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View className="mt-6">
            <ThemedText className="text-text text-lg font-bold mb-4">Location</ThemedText>
            <View className="flex-row flex-wrap gap-2.5">
              {['kitwe', 'lusaka'].map((location) => (
                <TouchableOpacity
                  key={location}
                  className={`py-3 px-4 rounded-lg border min-w-28 items-center ${formData.location === location ? 'bg-primary border-primary' : 'border-border'}`}
                  onPress={() => setFormData({...formData, location: location as 'kitwe' | 'lusaka'})}
                >
                  <ThemedText className={`text-sm ${formData.location === location ? 'text-white font-semibold' : 'text-text'}`}>
                    {location.charAt(0).toUpperCase() + location.slice(1)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View className="mt-6">
            <ThemedText className="text-text text-lg font-bold mb-4">Household Size</ThemedText>
            <View className="flex-row flex-wrap gap-2.5">
              {[1, 2, 3, 4, 5].map((size) => (
                <TouchableOpacity
                  key={size}
                  className={`py-3 px-4 rounded-lg border min-w-28 items-center ${formData.householdSize === size ? 'bg-primary border-primary' : 'border-border'}`}
                  onPress={() => setFormData({...formData, householdSize: size})}
                >
                  <ThemedText className={`text-sm ${formData.householdSize === size ? 'text-white font-semibold' : 'text-text'}`}>
                    {size} {size === 1 ? 'person' : 'people'}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <Button
            title={saving ? "Saving..." : loading ? "Loading..." : "Save Changes"}
            onPress={handleSave}
            size="large"
            className="w-full mt-8"
            disabled={loading || saving}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}