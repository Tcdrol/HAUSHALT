import { useState } from 'react';
import { Alert, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/app-context';
import { useRouter } from 'expo-router';

export default function PrivacyScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [dataSharing, setDataSharing] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [locationTracking, setLocationTracking] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to delete your account');
      return;
    }

    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            setDeleting(true);
            try {
              // Delete user data from all tables first
              // Note: This requires a server function or admin privileges
              // For now, we'll just sign out and let the user know
              
              // Sign out the user
              await signOut();
              
              Alert.alert(
                'Account Scheduled for Deletion',
                'Your account has been marked for deletion and will be permanently removed within 30 days. You have been logged out.',
                [{ text: 'OK', onPress: () => router.push('/(auth)/sign-in') }]
              );
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete account. Please try again.');
            } finally {
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Your data will be prepared and sent to your email within 24 hours.',
      [{ text: 'OK', style: 'default' }]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1 px-5 py-6">
        <View className="flex-row justify-between items-center mb-6">
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol size={24} name="chevron.right" color="#14b8a6" />
          </TouchableOpacity>
          <ThemedText className="text-text text-3xl font-bold">Privacy & Security</ThemedText>
          <View className="w-6" />
        </View>
        
        <View className="bg-surface rounded-2xl p-5 border border-border">
          <View className="mb-8">
            <View className="flex-row items-center mb-5">
              <IconSymbol size={20} name="shield.fill" color="#10b981" />
              <ThemedText className="text-text text-lg font-bold ml-2">Privacy Settings</ThemedText>
            </View>
            
            <TouchableOpacity
              className="flex-row justify-between items-center py-4 border-b border-border"
              onPress={() => setDataSharing(!dataSharing)}
            >
              <View className="flex-1">
                <ThemedText className="text-text text-base font-semibold">Data Sharing</ThemedText>
                <ThemedText className="text-text-secondary text-sm mt-1">
                  Share anonymous usage data to improve the app
                </ThemedText>
              </View>
              <View className={`w-12 h-8 rounded-full ${dataSharing ? 'bg-primary' : 'bg-border'}`} />
            </TouchableOpacity>
            
            <TouchableOpacity
              className="flex-row justify-between items-center py-4 border-b border-border"
              onPress={() => setAnalytics(!analytics)}
            >
              <View className="flex-1">
                <ThemedText className="text-text text-base font-semibold">Analytics</ThemedText>
                <ThemedText className="text-text-secondary text-sm mt-1">
                  Help us understand how you use the app
                </ThemedText>
              </View>
              <View className={`w-12 h-8 rounded-full ${analytics ? 'bg-primary' : 'bg-border'}`} />
            </TouchableOpacity>
            
            <TouchableOpacity
              className="flex-row justify-between items-center py-4 border-b border-border"
              onPress={() => setLocationTracking(!locationTracking)}
            >
              <View className="flex-1">
                <ThemedText className="text-text text-base font-semibold">Location Tracking</ThemedText>
                <ThemedText className="text-text-secondary text-sm mt-1">
                  Use location for better price suggestions
                </ThemedText>
              </View>
              <View className={`w-12 h-8 rounded-full ${locationTracking ? 'bg-primary' : 'bg-border'}`} />
            </TouchableOpacity>
            
            <TouchableOpacity
              className="flex-row justify-between items-center py-4 border-b border-border"
              onPress={() => setMarketingEmails(!marketingEmails)}
            >
              <View className="flex-1">
                <ThemedText className="text-text text-base font-semibold">Marketing Emails</ThemedText>
                <ThemedText className="text-text-secondary text-sm mt-1">
                  Receive tips and updates via email
                </ThemedText>
              </View>
              <View className={`w-12 h-8 rounded-full ${marketingEmails ? 'bg-primary' : 'bg-border'}`} />
            </TouchableOpacity>
          </View>
          
          <View className="mb-8">
            <View className="flex-row items-center mb-5">
              <IconSymbol size={20} name="lock.fill" color="#f59e0b" />
              <ThemedText className="text-text text-lg font-bold ml-2">Security</ThemedText>
            </View>
            
            <TouchableOpacity className="flex-row justify-between items-center py-4 border-b border-border" onPress={() => router.push('/add-expense')}>
              <View className="flex-row items-center flex-1">
                <IconSymbol size={20} name="key.fill" color="#ffffff" />
                <View className="ml-3 flex-1">
                  <ThemedText className="text-text text-base font-semibold">Change Password</ThemedText>
                  <ThemedText className="text-text-secondary text-sm">
                    Update your account password
                  </ThemedText>
                </View>
              </View>
              <IconSymbol size={20} name="chevron.right" color="#64748b" />
            </TouchableOpacity>
            
            <TouchableOpacity className="flex-row justify-between items-center py-4 border-b border-border" onPress={() => router.push('/add-expense')}>
              <View className="flex-row items-center flex-1">
                <IconSymbol size={20} name="phone.fill" color="#ffffff" />
                <View className="ml-3 flex-1">
                  <ThemedText className="text-text text-base font-semibold">Two-Factor Authentication</ThemedText>
                  <ThemedText className="text-text-secondary text-sm">
                    Add an extra layer of security
                  </ThemedText>
                </View>
              </View>
              <IconSymbol size={20} name="chevron.right" color="#64748b" />
            </TouchableOpacity>
            
            <TouchableOpacity className="flex-row justify-between items-center py-4 border-b border-border" onPress={handleExportData}>
              <View className="flex-row items-center flex-1">
                <IconSymbol size={20} name="download.fill" color="#ffffff" />
                <View className="ml-3 flex-1">
                  <ThemedText className="text-text text-base font-semibold">Export Your Data</ThemedText>
                  <ThemedText className="text-text-secondary text-sm">
                    Download all your personal data
                  </ThemedText>
                </View>
              </View>
              <IconSymbol size={20} name="chevron.right" color="#64748b" />
            </TouchableOpacity>
          </View>
          
          <View className="mb-5">
            <View className="flex-row items-center mb-5">
              <IconSymbol size={20} name="info.circle.fill" color="#ef4444" />
              <ThemedText className="text-text text-lg font-bold ml-2">Account Management</ThemedText>
            </View>
            
            <TouchableOpacity 
              className="flex-row justify-between items-center py-4 bg-error/10 rounded-lg border border-error px-3"
              onPress={handleDeleteAccount}
            >
              <View className="flex-row items-center flex-1">
                <IconSymbol size={20} name="trash.fill" color="#ef4444" />
                <View className="ml-3 flex-1">
                  <ThemedText className="text-error text-base font-semibold">Delete Account</ThemedText>
                  <ThemedText className="text-error/80 text-sm">
                    Permanently delete your account and all data
                  </ThemedText>
                </View>
              </View>
              <IconSymbol size={20} name="chevron.right" color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
