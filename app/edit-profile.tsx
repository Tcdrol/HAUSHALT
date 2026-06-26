import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    userType: 'student',
    location: 'kitwe',
    householdSize: 1,
    accommodationType: 'hostel',
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
          accommodationType: result.data.accommodation_type || 'hostel',
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
      const result = await ProfileService.upsertProfile(
        user.id,
        {
          full_name: formData.fullName,
          email: formData.email,
          user_type: formData.userType as 'student' | 'household' | 'sharing_roommates',
          location: formData.location as 'kitwe' | 'lusaka' | 'other',
          household_size: formData.householdSize,
          accommodation_type: formData.accommodationType as 'hostel' | 'apartment' | 'house' | 'shared',
        }
      );

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
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol size={24} name="chevron.right" color="#0066CC" />
          </TouchableOpacity>
          <ThemedText style={styles.title}>Edit Profile</ThemedText>
          <View style={styles.placeholder} />
        </View>
        
        <Card style={styles.formCard}>
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
          
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>User Type</ThemedText>
            <View style={styles.options}>
              {['student', 'household', 'sharing_roommates'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.option,
                    formData.userType === type && styles.selectedOption
                  ]}
                  onPress={() => setFormData({...formData, userType: type})}
                >
                  <ThemedText style={[
                    styles.optionText,
                    formData.userType === type && styles.selectedOptionText
                  ]}>
                    {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Location</ThemedText>
            <View style={styles.options}>
              {['kitwe', 'lusaka'].map((location) => (
                <TouchableOpacity
                  key={location}
                  style={[
                    styles.option,
                    formData.location === location && styles.selectedOption
                  ]}
                  onPress={() => setFormData({...formData, location})}
                >
                  <ThemedText style={[
                    styles.optionText,
                    formData.location === location && styles.selectedOptionText
                  ]}>
                    {location.charAt(0).toUpperCase() + location.slice(1)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Accommodation Type</ThemedText>
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
                  <ThemedText style={[
                    styles.optionText,
                    formData.accommodationType === type && styles.selectedOptionText
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <Button
            title={saving ? "Saving..." : loading ? "Loading..." : "Save Changes"}
            onPress={handleSave}
            size="large"
            style={styles.saveButton}
            disabled={loading || saving}
          />
        </Card>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 24,
  },
  formCard: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#404040',
  },
  section: {
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  option: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#404040',
    minWidth: 100,
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#0066CC',
    borderColor: '#0066CC',
  },
  optionText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  selectedOptionText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  saveButton: {
    marginTop: 30,
  },
});
