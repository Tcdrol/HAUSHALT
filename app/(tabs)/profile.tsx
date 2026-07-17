import { useEffect, useState } from 'react';
import { Alert, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/app-context';
import { ProfileService } from '@/lib/services/profile-service';
import { cn } from '@/utils/cn';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const result = await ProfileService.getProfile(user.id);
      if (result.success && result.data) {
        setUserProfile(result.data);
      } else {
        // Keep default values if fetch fails
        setUserProfile({
          full_name: user.user_metadata?.full_name || 'User',
          email: user.email || 'No email',
          student_id: user.user_metadata?.student_id || 'N/A',
          user_type: user.user_metadata?.user_type || 'student_private',
          location: user.user_metadata?.location || 'kitwe',
          household_size: 1,
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Set basic profile from auth metadata
      setUserProfile({
        full_name: user.user_metadata?.full_name || 'User',
        email: user.email || 'No email',
        student_id: user.user_metadata?.student_id || 'N/A',
        user_type: user.user_metadata?.user_type || 'student_private',
        location: user.user_metadata?.location || 'kitwe',
        household_size: 1,
      });
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    {
      title: 'Edit Profile',
      icon: 'person.fill' as const,
      color: '#3b82f6',
      onPress: () => router.push('/edit-profile')
    },
    {
      title: 'My Budget Settings',
      icon: 'dollarsign.circle.fill' as const,
      color: '#14b8a6',
      onPress: () => router.push('/budget-settings')
    },
    {
      title: 'Location & Preferences',
      icon: 'location.fill' as const,
      color: '#f59e0b',
      onPress: () => router.push('/preferences')
    },
    {
      title: 'Export Data',
      icon: 'download.fill' as const,
      color: '#8b5cf6',
      onPress: () => handleExportData()
    },
    {
      title: 'Privacy & Security',
      icon: 'shield.fill' as const,
      color: '#22c55e',
      onPress: () => router.push('/privacy')
    },
    {
      title: 'Help & Feedback',
      icon: 'questionmark.circle.fill' as const,
      color: '#64748b',
      onPress: () => router.push('/help')
    },
    {
      title: 'Log Out',
      icon: 'arrow.up.square.fill' as const,
      color: '#ef4444',
      onPress: () => handleLogout(),
      isDestructive: true
    },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: async () => {
          const result = await signOut();
          if (result.success) {
            router.push('/(auth)/sign-in');
          } else {
            Alert.alert('Error', result.error || 'Failed to log out');
          }
        }}
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Your data will be exported and sent to your email.',
      [{ text: 'OK', style: 'default' }]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="px-5 pt-4 pb-6">
        <View className="flex-row justify-between items-center">
          <View>
            <ThemedText className="text-text-muted text-sm uppercase tracking-wider">My Account</ThemedText>
            <ThemedText className="text-text text-2xl font-bold mt-1">Profile</ThemedText>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/preferences')}
            className="w-12 h-12 bg-surface rounded-full items-center justify-center border border-border"
          >
            <IconSymbol size={24} name="gear.fill" color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Profile Card */}
        <View className="mx-5 mb-6">
          <View className="bg-surface rounded-2xl p-6 border border-border items-center">
            {/* Avatar */}
            <View className="w-24 h-24 bg-primary/20 rounded-full items-center justify-center mb-4 border-2 border-primary/30">
              <IconSymbol size={40} name="person.fill" color="#14b8a6" />
            </View>

            {/* User Info */}
            <ThemedText className="text-text text-2xl font-bold mb-1">
              {userProfile?.full_name || 'Loading...'}
            </ThemedText>
            <ThemedText className="text-text-secondary text-base mb-1">
              {userProfile?.email || 'Loading...'}
            </ThemedText>
            <ThemedText className="text-text-muted text-sm">
              ID: {userProfile?.student_id || 'N/A'}
            </ThemedText>

            {/* Profile Stats */}
            <View className="flex-row justify-around w-full mt-6 pt-6 border-t border-border">
              <View className="items-center">
                <View className="w-10 h-10 bg-warning/20 rounded-xl items-center justify-center mb-2">
                  <IconSymbol size={20} name="location.fill" color="#f59e0b" />
                </View>
                <ThemedText className="text-text text-sm font-medium">
                  {userProfile?.location ? userProfile.location.charAt(0).toUpperCase() + userProfile.location.slice(1) : 'Loading...'}
                </ThemedText>
                <ThemedText className="text-text-muted text-xs">Location</ThemedText>
              </View>
              <View className="items-center">
                <View className="w-10 h-10 bg-success/20 rounded-xl items-center justify-center mb-2">
                  <IconSymbol size={20} name="home" color="#22c55e" />
                </View>
                <ThemedText className="text-text text-sm font-medium capitalize">
                  {userProfile?.user_type ? userProfile.user_type.replace('_', ' ') : 'Loading...'}
                </ThemedText>
                <ThemedText className="text-text-muted text-xs">Type</ThemedText>
              </View>
              <View className="items-center">
                <View className="w-10 h-10 bg-info/20 rounded-xl items-center justify-center mb-2">
                  <IconSymbol size={20} name="person.2.fill" color="#3b82f6" />
                </View>
                <ThemedText className="text-text text-sm font-medium">
                  {userProfile?.household_size || 1}
                </ThemedText>
                <ThemedText className="text-text-muted text-xs">
                  {userProfile?.household_size === 1 ? 'Person' : 'People'}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View className="px-5 mb-6">
          <View className="bg-surface rounded-2xl border border-border overflow-hidden">
            {loading ? (
              <View className="p-10 items-center">
                <ThemedText className="text-text-secondary">Loading profile...</ThemedText>
              </View>
            ) : (
              menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                  className={cn(
                    'flex-row items-center justify-between p-4',
                    index !== menuItems.length - 1 && 'border-b border-border'
                  )}
                >
                  <View className="flex-row items-center flex-1">
                    <View
                      className="w-10 h-10 rounded-xl items-center justify-center mr-4"
                      style={{ backgroundColor: `${item.color}20` }}
                    >
                      <IconSymbol
                        size={20}
                        name={item.icon}
                        color={item.color}
                      />
                    </View>
                    <ThemedText
                      className={cn(
                        'text-base font-medium',
                        item.isDestructive ? 'text-error' : 'text-text'
                      )}
                    >
                      {item.title}
                    </ThemedText>
                  </View>
                  <IconSymbol
                    size={20}
                    name="chevron.right"
                    color="#64748b"
                  />
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        {/* Account Info */}
        <View className="px-5 mb-6">
          <View className="flex-row items-center mb-4">
            <View className="w-10 h-10 bg-primary/20 rounded-xl items-center justify-center mr-3">
              <IconSymbol size={20} name="info.circle.fill" color="#14b8a6" />
            </View>
            <ThemedText className="text-text text-lg font-semibold">Account Information</ThemedText>
          </View>

          <View className="bg-surface rounded-2xl p-5 border border-border">
            <View className="flex-row justify-between items-center mb-4">
              <ThemedText className="text-text-secondary text-sm">Member Since</ThemedText>
              <ThemedText className="text-text font-medium">March 2025</ThemedText>
            </View>
            <View className="flex-row justify-between items-center mb-4">
              <ThemedText className="text-text-secondary text-sm">Account Type</ThemedText>
              <View className="px-3 py-1 bg-primary/20 rounded-full">
                <ThemedText className="text-primary text-sm font-medium">Premium Student</ThemedText>
              </View>
            </View>
            <View className="flex-row justify-between items-center">
              <ThemedText className="text-text-secondary text-sm">Data Usage</ThemedText>
              <ThemedText className="text-text font-medium">2.3 GB / 10 GB</ThemedText>
            </View>
          </View>
        </View>

        {/* App Version */}
        <View className="px-5 items-center pb-8">
          <ThemedText className="text-text-muted text-xs">Haushalt v1.0.0</ThemedText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

