import { supabase } from '../supabase';

// Define types locally to avoid circular dependencies
type UserProfile = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  user_type: 'student' | 'household' | 'sharing_roommates';
  location: 'kitwe' | 'lusaka' | 'other';
  household_size: number;
  accommodation_type: 'hostel' | 'apartment' | 'house' | 'shared';
  monthly_income: number | null;
  created_at: string;
  updated_at: string;
};

type UserProfileInsert = {
  user_id: string;
  full_name: string;
  email: string;
  user_type: 'student' | 'household' | 'sharing_roommates';
  location: 'kitwe' | 'lusaka' | 'other';
  household_size?: number;
  accommodation_type?: 'hostel' | 'apartment' | 'house' | 'shared';
  monthly_income?: number;
};

type UserProfileUpdate = {
  full_name?: string;
  user_type?: 'student' | 'household' | 'sharing_roommates';
  location?: 'kitwe' | 'lusaka' | 'other';
  household_size?: number;
  accommodation_type?: 'hostel' | 'apartment' | 'house' | 'shared';
  monthly_income?: number;
};

export class ProfileService {
  // Get user profile by ID
  static async getProfile(userId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .limit(1);

      if (error) {
        throw error;
      }

      // Return first profile if multiple exist, or null if none
      return { success: true, data: data && data.length > 0 ? data[0] : null };
    } catch (error: any) {
      console.error('Get profile error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to get profile' 
      };
    }
  }

  // Create or update user profile
  static async upsertProfile(
    userId: string, 
    profileData: UserProfileInsert | UserProfileUpdate
  ): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          ...profileData,
          user_id: userId,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Upsert profile error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to save profile' 
      };
    }
  }

  // Update user profile
  static async updateProfile(
    userId: string, 
    updates: UserProfileUpdate
  ): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Update profile error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to update profile' 
      };
    }
  }

  // Delete user profile
  static async deleteProfile(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Delete profile error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to delete profile' 
      };
    }
  }

  // Subscribe to profile changes
  static subscribeToProfile(
    userId: string, 
    callback: (profile: UserProfile) => void
  ) {
    return supabase
      .channel(`profile_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            callback(payload.new as UserProfile);
          }
        }
      )
      .subscribe();
  }

  // Search users by email or name
  static async searchUsers(
    query: string,
    currentUserId: string
  ): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, user_id, full_name, email')
        .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
        .neq('user_id', currentUserId)
        .limit(10);

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Search users error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to search users' 
      };
    }
  }

  // Get user by email
  static async getUserByEmail(
    email: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', email)
        .limit(1);

      if (error) {
        throw error;
      }

      return { success: true, data: data && data.length > 0 ? data[0] : null };
    } catch (error: any) {
      console.error('Get user by email error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to get user by email' 
      };
    }
  }

  // Get multiple users by their IDs
  static async getUsersByIds(
    userIds: string[]
  ): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .in('user_id', userIds);

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Get users by IDs error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to get users by IDs' 
      };
    }
  }
}
