import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/app-context';
import { validateEmail, validateName, validatePassword } from '@/utils/validation';
import { useRouter } from 'expo-router';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSignUp = async () => {
    const nameValidation = validateName(name);
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    const allErrors = [
      ...nameValidation.errors,
      ...emailValidation.errors,
      ...passwordValidation.errors
    ];

    if (allErrors.length > 0) {
      const errorMap: { [key: string]: string } = {};
      allErrors.forEach(error => {
        errorMap[error.field] = error.message;
      });
      setErrors(errorMap);
      return;
    }

    setLoading(true);
    try {
      const result = await signUp(email, password, name, studentId);
      
      if (result.success) {
        Alert.alert(
          'Account Created!',
          'Your account has been created successfully. Please complete your profile.',
          [
            { 
              text: 'OK', 
              onPress: () => router.push('/(onboarding)/basic-info')
            }
          ]
        );
      } else {
        Alert.alert('Sign Up Error', result.error || 'Failed to create account');
      }
    } catch (error: any) {
      Alert.alert('Sign Up Error', error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="px-5 pt-4 pb-6 flex-row items-center border-b border-border bg-surface">
        <Link href="/(onboarding)/welcome" className="mr-4">
          <ThemedText className="text-primary text-base">← Back</ThemedText>
        </Link>
        <ThemedText className="text-text text-xl font-bold">Create Account</ThemedText>
      </View>
      
      <View className="flex-1 px-5 py-6 justify-center">
        <View className="bg-surface rounded-2xl p-6 border border-border">
          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
            error={errors.name}
            containerClassName="mb-4"
          />
          
          <Input
            label="Student ID (Optional)"
            placeholder="Enter your student ID"
            value={studentId}
            onChangeText={setStudentId}
            error={errors.studentId}
            containerClassName="mb-4"
          />
          
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
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={errors.password}
            containerClassName="mb-2"
          />
          
          <Button
            title={loading ? "Creating Account..." : "Sign Up"}
            onPress={handleSignUp}
            size="large"
            className="w-full mt-4"
            disabled={loading}
          />
        </View>
        
        <View className="flex-row items-center justify-center mt-6">
          <ThemedText className="text-text-secondary">
            Already have an account?{' '}
          </ThemedText>
          <Link href="/(auth)/sign-in">
            <ThemedText className="text-primary font-semibold">Sign in</ThemedText>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

