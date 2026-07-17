import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/app-context';
import { authService } from '@/lib/auth';
import { useRouter } from 'expo-router';

export default function SignInScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setErrors({
        email: !email.trim() ? 'Email is required' : '',
        password: !password.trim() ? 'Password is required' : '',
      });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const result = await signIn(email, password);
      
      if (result.success) {
        // Navigate to main app
        router.replace('/(tabs)/dashboard');
      } else {
        Alert.alert('Sign In Error', result.error || 'Failed to sign in');
      }
    } catch (error: any) {
      Alert.alert('Sign In Error', error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address first.');
      return;
    }

    const result = await authService.resetPassword(email.trim());
    if (result.success) {
      Alert.alert(
        'Password Reset Email Sent',
        'Check your email for instructions to reset your password.'
      );
    } else {
      Alert.alert('Error', result.error || 'Failed to send reset email.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="px-5 pt-4 pb-6 flex-row items-center border-b border-border bg-surface">
        <Link href="/(onboarding)/welcome" className="mr-4">
          <ThemedText className="text-primary text-base">← Back</ThemedText>
        </Link>
        <ThemedText className="text-text text-xl font-bold">Sign In</ThemedText>
      </View>
      
      <View className="flex-1 px-5 py-6 justify-center">
        <View className="bg-surface rounded-2xl p-6 border border-border">
          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
            containerClassName="mb-4"
          />
          
          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={errors.password}
            containerClassName="mb-2"
          />
          
          <View className="items-end mb-4">
            <ThemedText 
              className="text-primary text-sm" 
              onPress={handleForgotPassword}
            >
              Forgot password?
            </ThemedText>
          </View>
          
          <Button
            title={loading ? "Signing In..." : "Sign In"}
            onPress={handleSignIn}
            size="large"
            className="w-full"
            disabled={loading}
          />
        </View>
        
        <View className="flex-row items-center justify-center mt-6">
          <ThemedText className="text-text-secondary">
            Don't have an account?{' '}
          </ThemedText>
          <Link href="/(auth)/sign-up">
            <ThemedText className="text-primary font-semibold">Sign up</ThemedText>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
