import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/app-context';
import { ProfileService } from '@/lib/services/profile-service';
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
          user_type: user.user_metadata?.user_type || 'student',
          location: user.user_metadata?.location || 'kitwe',
          household_size: 1,
          accommodation_type: 'hostel',
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Set basic profile from auth metadata
      setUserProfile({
        full_name: user.user_metadata?.full_name || 'User',
        email: user.email || 'No email',
        user_type: user.user_metadata?.user_type || 'student',
        location: user.user_metadata?.location || 'kitwe',
        household_size: 1,
        accommodation_type: 'hostel',
      });
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { 
      title: 'Edit Profile', 
      icon: 'person.fill' as const,
      onPress: () => router.push('/edit-profile')
    },
    { 
      title: 'My Budget Settings', 
      icon: 'dollarsign.circle.fill' as const,
      onPress: () => router.push('/budget-settings')
    },
    { 
      title: 'Location & Preferences', 
      icon: 'location.fill' as const,
      onPress: () => router.push('/preferences')
    },
    { 
      title: 'Export Data', 
      icon: 'download.fill' as const,
      onPress: () => handleExportData()
    },
    { 
      title: 'Privacy & Security', 
      icon: 'shield.fill' as const,
      onPress: () => router.push('/privacy')
    },
    { 
      title: 'Help & Feedback', 
      icon: 'questionmark.circle.fill' as const,
      onPress: () => router.push('/help')
    },
    { 
      title: 'Log Out', 
      icon: 'arrow.up.square.fill' as const,
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
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <View style={styles.header}>
          <IconSymbol size={24} name="person.fill" color="#FFFFFF" />
          <ThemedText style={styles.title}>Profile</ThemedText>
          <IconSymbol size={24} name="gear.fill" color="#FFFFFF" />
        </View>
        
        <Card variant="elevated" style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <IconSymbol size={60} name="person.fill" color="#0066CC" />
          </View>
          <ThemedText style={styles.name}>{userProfile?.full_name || 'Loading...'}</ThemedText>
          <ThemedText style={styles.email}>{userProfile?.email || 'Loading...'}</ThemedText>
          
          <View style={styles.profileStats}>
            <View style={styles.statItem}>
              <IconSymbol size={20} name="location.fill" color="#F59E0B" />
              <ThemedText style={styles.statText}>{userProfile?.location ? userProfile.location.charAt(0).toUpperCase() + userProfile.location.slice(1) : 'Loading...'}</ThemedText>
            </View>
            <View style={styles.statItem}>
              <IconSymbol size={20} name="person.fill" color="#10B981" />
              <ThemedText style={styles.statText}>{userProfile?.user_type ? userProfile.user_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Loading...'}</ThemedText>
            </View>
            <View style={styles.statItem}>
              <IconSymbol size={20} name="house.fill" color="#8B5CF6" />
              <ThemedText style={styles.statText}>{userProfile?.accommodation_type ? userProfile.accommodation_type.charAt(0).toUpperCase() + userProfile.accommodation_type.slice(1) : 'Loading...'}</ThemedText>
            </View>
          </View>
        </Card>
        
        <Card style={styles.menuCard}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ThemedText style={styles.loadingText}>Loading profile...</ThemedText>
            </View>
          ) : (
            menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemContent}>
                  <View style={styles.menuItemLeft}>
                    <IconSymbol 
                      size={20} 
                      name={item.icon} 
                      color={item.isDestructive ? '#EF4444' : '#FFFFFF'} 
                    />
                    <ThemedText style={[
                      styles.menuTitle,
                      item.isDestructive && styles.destructiveText
                    ]}>
                      {item.title}
                    </ThemedText>
                  </View>
                  <IconSymbol 
                    size={20} 
                    name="chevron.right" 
                    color="#666" 
                  />
                </View>
              </TouchableOpacity>
            ))
          )}
        </Card>
        
        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <IconSymbol size={20} name="info.circle.fill" color="#0066CC" />
            <ThemedText style={styles.infoTitle}>Account Information</ThemedText>
          </View>
          <View style={styles.infoContent}>
            <View style={styles.infoItem}>
              <ThemedText style={styles.infoLabel}>Member Since:</ThemedText>
              <ThemedText style={styles.infoValue}>2025</ThemedText>
            </View>
          </View>
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
  profileCard: {
    padding: 30,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#404040',
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 5,
  },
  studentId: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#404040',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    marginLeft: 5,
  },
  menuCard: {
    borderWidth: 1,
    borderColor: '#404040',
    marginBottom: 25,
  },
  menuItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  menuItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 15,
  },
  destructiveText: {
    color: '#EF4444',
  },
  infoCard: {
    borderWidth: 1,
    borderColor: '#404040',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#FFFFFF',
  },
  infoContent: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.7,
  },
});
