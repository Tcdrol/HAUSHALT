import { useCallback, useEffect, useRef, useState } from 'react';
import { realtimeManager, supabase } from '../lib/supabase';

// Generic hook for real-time data synchronization
export function useRealtimeData<T>(
  table: string,
  userId: string,
  initialData: T[] = [],
  filter?: string
) {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<string | null>(null);

  const fetchInitialData = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase.from(table).select('*');
      
      // Add user filter for user-specific tables
      if (table === 'expenses' || table === 'budget_categories' || table === 'user_preferences') {
        query = query.eq('user_id', userId);
      }
      
      // Add additional filter if provided
      if (filter) {
        const filters = filter.split('&');
        filters.forEach(f => {
          const [key, value] = f.split('=');
          if (key && value && value !== '') {
            // Remove PostgREST operator prefix (eq., neq., etc.) if present
            const cleanValue = value.replace(/^(eq|neq|gt|gte|lt|lte|like|ilike)\./, '');
            query = query.eq(key, cleanValue);
          }
        });
      }

      // Order by date descending for expenses
      if (table === 'expenses') {
        query = query.order('date', { ascending: false }).order('created_at', { ascending: false });
      }

      const { data: fetchedData, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setData(fetchedData as T[] || []);
    } catch (err: any) {
      console.error(`Error fetching initial data for ${table}:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [table, userId, filter]);

  const subscribe = useCallback(() => {
    if (!userId) return;

    // Subscribe to real-time updates
    const channelName = `${table}_${Date.now()}`;
    realtimeManager.subscribeToTable(
      table as any,
      '*',
      (payload) => {
        console.log(`Real-time update for ${table}:`, payload);
        
        if (payload.eventType === 'INSERT') {
          setData(prev => [payload.new as T, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setData(prev => prev.map(item => 
            (item as any).id === payload.new.id ? payload.new as T : item
          ));
        } else if (payload.eventType === 'DELETE') {
          setData(prev => prev.filter(item => (item as any).id !== payload.old.id));
        }
      },
      filter
    );

    channelRef.current = channelName;
  }, [table, userId, filter]);

  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      realtimeManager.unsubscribe(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
    subscribe();
    return unsubscribe;
  }, [fetchInitialData, subscribe, unsubscribe]);

  return { data, loading, error, refresh: fetchInitialData, unsubscribe };
}

// Hook for real-time expenses
export function useRealtimeExpenses(userId: string) {
  return useRealtimeData('expenses', userId);
}

// Hook for real-time budget categories
export function useRealtimeBudgetCategories(userId: string, month: number, year: number) {
  const filter = `user_id=${userId}&month=${month}&year=${year}`;
  return useRealtimeData('budget_categories', userId, [], filter);
}

// Hook for real-time groups
export function useRealtimeGroups(userId: string) {
  return useRealtimeData('groups', userId);
}

// Hook for real-time grocery trips
export function useRealtimeGroceryTrips(userId: string) {
  return useRealtimeData('grocery_trips', userId);
}

// Hook for real-time notifications
export function useRealtimeNotifications(userId: string) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    // Subscribe to various events that could trigger notifications
    const expenseChannelName = `expenses_${Date.now()}`;
    realtimeManager.subscribeToTable(
      'expenses' as any,
      'INSERT',
      (payload) => {
        if (payload.new.user_id === userId) {
          const notification = {
            id: `expense_${payload.new.id}`,
            type: 'expense_added',
            title: 'New Expense Added',
            message: `K${payload.new.amount} spent at ${payload.new.merchant}`,
            data: payload.new,
            created_at: new Date().toISOString(),
            read: false,
          };
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      }
    );

    const budgetChannelName = `budget_${Date.now()}`;
    realtimeManager.subscribeToTable(
      'budget_categories' as any,
      'UPDATE',
      (payload) => {
        if (payload.new.user_id === userId) {
          const percentage = (payload.new.spent_amount / payload.new.planned_amount) * 100;
          if (percentage > 80 && percentage < 100) {
            const notification = {
              id: `budget_warning_${payload.new.id}`,
              type: 'budget_warning',
              title: 'Budget Warning',
              message: `${payload.new.name}: ${Math.round(percentage)}% spent`,
              data: payload.new,
              created_at: new Date().toISOString(),
              read: false,
            };
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        }
      }
    );

    const groupChannelName = `group_${Date.now()}`;
    realtimeManager.subscribeToTable(
      'group_expenses' as any,
      'INSERT',
      (payload) => {
        // Check if user is a member of this group
        // This would require additional logic to verify group membership
        const notification = {
          id: `group_expense_${payload.new.id}`,
          type: 'group_expense',
          title: 'New Group Expense',
          message: `K${payload.new.amount} - ${payload.new.description}`,
          data: payload.new,
          created_at: new Date().toISOString(),
          read: false,
        };
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    );

    return () => {
      realtimeManager.unsubscribe(expenseChannelName);
      realtimeManager.unsubscribe(budgetChannelName);
      realtimeManager.unsubscribe(groupChannelName);
    };
  }, [userId]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
}

// Hook for real-time connection status
export function useRealtimeConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');

  useEffect(() => {
    // Monitor connection status
    const checkConnection = () => {
      // This is a simplified connection check
      // In a real implementation, you might want to use Supabase's connection status
      setIsConnected(true);
      setConnectionStatus('connected');
    };

    const interval = setInterval(checkConnection, 5000);
    checkConnection();

    return () => clearInterval(interval);
  }, []);

  return { isConnected, connectionStatus };
}

// Hook for real-time collaboration (for groups)
export function useRealtimeCollaboration(groupId: string, userId: string) {
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [lastActivity, setLastActivity] = useState<Date | null>(null);

  useEffect(() => {
    if (!groupId || !userId) return;

    // Subscribe to group activities
    const channelName = `group_${Date.now()}`;
    realtimeManager.subscribeToTable(
      'group_expenses' as any,
      '*',
      (payload) => {
        setLastActivity(new Date());
        
        // Update active users (simplified - in real app, use presence channels)
        if (payload.eventType === 'INSERT') {
          setActiveUsers(prev => {
            const userExists = prev.some(u => u.id === payload.new.paid_by);
            if (!userExists) {
              return [...prev, { id: payload.new.paid_by, lastSeen: new Date() }];
            }
            return prev.map(u => 
              u.id === payload.new.paid_by 
                ? { ...u, lastSeen: new Date() }
                : u
            );
          });
        }
      },
      `group_id=eq.${groupId}`
    );

    // Clean up inactive users
    const cleanupInterval = setInterval(() => {
      setActiveUsers(prev => 
        prev.filter(user => 
          Date.now() - new Date(user.lastSeen).getTime() < 300000 // 5 minutes
        )
      );
    }, 60000);

    return () => {
      realtimeManager.unsubscribe(channelName);
      clearInterval(cleanupInterval);
    };
  }, [groupId, userId]);

  return { activeUsers, lastActivity };
}
