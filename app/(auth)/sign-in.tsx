import { Link , useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/app-context';

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

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Password reset functionality coming soon!');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Link href="/(onboarding)/welcome">
          <ThemedText style={styles.backButton}>← Back</ThemedText>
        </Link>
        <ThemedText style={styles.title}>Sign In</ThemedText>
      </View>
      
      <View style={styles.content}>
        <Card style={styles.card}>
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
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={errors.password}
          />
          
          <View style={styles.forgotPasswordContainer}>
            <ThemedText 
              style={styles.forgotPasswordLink} 
              onPress={handleForgotPassword}
            >
              Forgot password?
            </ThemedText>
          </View>
          
          <Button
            title={loading ? "Signing In..." : "Sign In"}
            onPress={handleSignIn}
            size="large"
            style={styles.signInButton}
            disabled={loading}
          />
        </Card>
        
        <View style={styles.signUpSection}>
          <ThemedText style={styles.signUpText}>
            Don&apos;t have an account?{' '}
          </ThemedText>
          <Link href="/(auth)/sign-up">
            <ThemedText type="link">Sign up</ThemedText>
          </Link>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#2A2A2A',
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  backButton: {
    fontSize: 16,
    marginRight: 20,
    color: '#0066CC',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#404040',
    backgroundColor: '#2A2A2A',
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginVertical: 10,
  },
  forgotPasswordLink: {
    fontSize: 14,
    color: '#0066CC',
  },
  signInButton: {
    marginTop: 10,
  },
  signUpSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  signUpText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#FFFFFF',
  },
});
