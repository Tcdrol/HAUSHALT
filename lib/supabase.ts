import { createClient, RealtimeChannel } from '@supabase/supabase-js';

// Replace these with your actual Supabase project details
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Auth helper functions
export const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting current user:', error);
    return null;
  }
  return user?.id || null;
};

export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  return session;
};

// Error handling
export const handleSupabaseError = (error: any, defaultMessage: string) => {
  console.error('Supabase error:', error);
  return error?.message || defaultMessage;
};

// Real-time subscription management
export class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map();

  subscribeToTable(
    table: string,
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
    callback: (payload: any) => void,
    filter?: string
  ): RealtimeChannel {
    const channelName = `${String(table)}_${event}_${Date.now()}`;
    
    let channel = supabase
      .channel(channelName)
      .on('postgres_changes',
        {
          event: event as any,
          schema: 'public',
          table: table,
          filter: filter,
        },
        callback
      )
      .subscribe();
    
    this.channels.set(channelName, channel);
    return channel;
  }

  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  unsubscribeAll() {
    this.channels.forEach((channel, name) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
  }
}

export const realtimeManager = new RealtimeManager();
