import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function WelcomeScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    // Navigate to sign up
    router.push('/(auth)/sign-up');
  };

  const handleSignIn = () => {
    // Navigate to sign in
    router.push('/(auth)/sign-in');
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View className="flex-1 px-5 py-6 justify-center">
          <View className="items-center mb-10">
            <View className="mb-5">
              <IconSymbol size={60} name="home" color="#14b8a6" />
            </View>
            <ThemedText className="text-text text-5xl font-bold text-center mb-3">
              HAUSHALT
            </ThemedText>
            <ThemedText className="text-text-secondary text-lg text-center">
              Your smart budget companion for Zambian students
            </ThemedText>
          </View>
          
          <View className="mb-10">
            <View className="bg-surface rounded-2xl p-5 border border-border mb-4">
              <View className="flex-row items-center">
                <IconSymbol size={24} name="dollarsign.circle.fill" color="#10b981" />
                <View className="ml-4 flex-1">
                  <ThemedText className="text-text text-base font-semibold mb-1">Smart Budgeting</ThemedText>
                  <ThemedText className="text-text-secondary text-sm">
                    Track expenses and manage your monthly budget
                  </ThemedText>
                </View>
              </View>
            </View>
            
            <View className="bg-surface rounded-2xl p-5 border border-border mb-4">
              <View className="flex-row items-center">
                <IconSymbol size={24} name="person.2.fill" color="#8b5cf6" />
                <View className="ml-4 flex-1">
                  <ThemedText className="text-text text-base font-semibold mb-1">Shared Expenses</ThemedText>
                  <ThemedText className="text-text-secondary text-sm">
                    Split costs with roommates and friends
                  </ThemedText>
                </View>
              </View>
            </View>
            
            <View className="bg-surface rounded-2xl p-5 border border-border mb-4">
              <View className="flex-row items-center">
                <IconSymbol size={24} name="cart.fill" color="#f59e0b" />
                <View className="ml-4 flex-1">
                  <ThemedText className="text-text text-base font-semibold mb-1">Grocery Planning</ThemedText>
                  <ThemedText className="text-text-secondary text-sm">
                    Compare prices and plan shopping trips
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>
          
          <View className="bg-surface rounded-2xl p-5 border border-border items-center mb-6">
            <Button
              title="Let's get started"
              onPress={handleGetStarted}
              size="large"
              className="w-full"
            />
          </View>
          
          <View className="flex-row items-center justify-center">
            <ThemedText className="text-text-secondary text-base">
              Already have an account?{' '}
            </ThemedText>
            <ThemedText 
              onPress={handleSignIn}
              className="text-primary font-semibold text-base"
            >
              Sign in
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
