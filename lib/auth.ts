import { ProfileService } from './services/profile-service';
import { supabase } from './supabase';

export interface AuthState {
  user: any | null;
  session: any | null;
  loading: boolean;
}

export class AuthService {
  private static instance: AuthService;
  private authStateCallback: ((authState: AuthState) => void) | null = null;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Set up auth state listener
  onAuthStateChange(callback: (authState: AuthState) => void) {
    this.authStateCallback = callback;
    
    // Initial auth state
    this.updateAuthState();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        this.updateAuthState();
      }
    );

    return () => subscription.unsubscribe();
  }

  private async updateAuthState() {
    if (this.authStateCallback) {
      try {
        const session = await supabase.auth.getSession();
        const authState: AuthState = {
          user: session.data.session?.user || null,
          session: session.data.session || null,
          loading: false
        };
        this.authStateCallback(authState);
      } catch (error) {
        console.error('Error updating auth state:', error);
        this.authStateCallback?.({
          user: null,
          session: null,
          loading: false
        });
      }
    }
  }

  // Sign up with email and password
  async signUp(email: string, password: string, fullName: string, studentId: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            student_id: studentId,
          }
        }
      });

      if (error) {
        // Handle email confirmation errors gracefully
        if (error.message.includes('Email not confirmed')) {
          // Try to auto-confirm by signing in immediately
          return this.signIn(email, password);
        }
        throw error;
      }

      // Create user profile after successful sign up
      if (data.user) {
        try {
          await ProfileService.upsertProfile(data.user.id, {
            user_id: data.user.id,
            full_name: fullName,
            email: email,
            student_id: studentId,
            user_type: 'student_private', // Default user type
            location: 'other', // Default location
            household_size: 1, // Default household size
          });
        } catch (profileError) {
          console.error('Failed to create user profile:', profileError);
          // Don't fail sign up if profile creation fails
        }
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to sign up' 
      };
    }
  }

  // Sign in with email and password
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Handle email confirmation errors
        if (error.message.includes('Email not confirmed')) {
          // Try to manually confirm the user then retry
          await this.manuallyConfirmUser(email);
          // Retry sign in
          const retryResult = await supabase.auth.signInWithPassword({ email, password });
          if (retryResult.data.session) {
            return { success: true, data: retryResult.data };
          }
        }
        throw error;
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to sign in' 
      };
    }
  }

  // Helper method to manually confirm user (admin operation)
  private async manuallyConfirmUser(email: string) {
    try {
      // This would typically require admin privileges
      // For now, we'll log the attempt
      console.log('Attempting to manually confirm user:', email);
      
      // In a real scenario, you might call a Supabase Edge Function
      // or have a server-side endpoint to handle this
      // For development, users should run the SQL script manually
      
    } catch (error) {
      console.error('Failed to manually confirm user:', error);
    }
  }

  // Sign in with Google (OAuth)
  async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'haushalt://auth/callback',
        },
      });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Google sign in error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to sign in with Google' 
      };
    }
  }

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Sign out error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to sign out' 
      };
    }
  }

  // Reset password
  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'haushalt://auth/reset-password',
      });

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Reset password error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to send reset email' 
      };
    }
  }

  // Update password
  async updatePassword(newPassword: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Update password error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to update password' 
      };
    }
  }

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        throw error;
      }

      return { success: true, user };
    } catch (error: any) {
      console.error('Get current user error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to get current user' 
      };
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    } catch (error) {
      console.error('Check authentication error:', error);
      return false;
    }
  }
}

export const authService = AuthService.getInstance();
