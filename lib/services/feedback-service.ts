import { supabase } from '@/lib/supabase';

type Feedback = {
  id: string;
  user_id: string;
  feedback: string;
  email?: string;
  status: 'new' | 'reviewed' | 'resolved';
  created_at: string;
};

type FeedbackInsert = {
  user_id: string;
  feedback: string;
  email?: string;
};

export class FeedbackService {
  // Submit user feedback
  static async submitFeedback(
    data: FeedbackInsert
  ): Promise<{ success: boolean; data?: Feedback; error?: string }> {
    try {
      const { data: feedback, error } = await supabase
        .from('user_feedback')
        .insert({
          user_id: data.user_id,
          feedback: data.feedback,
          email: data.email,
          status: 'new',
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data: feedback };
    } catch (error: any) {
      console.error('Submit feedback error:', error);
      return {
        success: false,
        error: error.message || 'Failed to submit feedback'
      };
    }
  }

  // Get user's feedback history
  static async getUserFeedback(
    userId: string
  ): Promise<{ success: boolean; data?: Feedback[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_feedback')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Get user feedback error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get feedback'
      };
    }
  }
}
