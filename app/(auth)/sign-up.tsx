import { Link , useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/app-context';
import { validateEmail, validateName, validatePassword } from '@/utils/validation';

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
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Link href="/(onboarding)/welcome">
          <ThemedText style={styles.backButton}>← Back</ThemedText>
        </Link>
        <ThemedText style={styles.title}>Create Account</ThemedText>
      </View>
      
      <View style={styles.content}>
        <Card style={styles.card}>
          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
            error={errors.name}
          />
          
          <Input
            label="Student ID (Optional)"
            placeholder="Enter your student ID"
            value={studentId}
            onChangeText={setStudentId}
            error={errors.studentId}
          />
          
          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
          
          <Input
            label="Password"
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={errors.password}
          />
          
          <Button
            title={loading ? "Creating Account..." : "Sign Up"}
            onPress={handleSignUp}
            size="large"
            style={styles.signUpButton}
            disabled={loading}
          />
        </Card>
        
        <View style={styles.signInSection}>
          <ThemedText style={styles.signInText}>
            Already have an account?{' '}
          </ThemedText>
          <Link href="/(auth)/sign-in">
            <ThemedText type="link">Sign in</ThemedText>
          </Link>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    fontSize: 16,
    marginRight: 20,
    color: '#0066CC',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    marginBottom: 20,
  },
  signUpButton: {
    marginTop: 10,
  },
  signInSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  signInText: {
    textAlign: 'center',
    fontSize: 16,
  },
});
