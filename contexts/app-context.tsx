import React, { createContext, ReactNode, useContext, useEffect, useReducer } from 'react';
import { AppState } from 'react-native';
import { authService, AuthState } from '../lib/auth';
import { BudgetService } from '../lib/services/budget-service';
import { ProfileService } from '../lib/services/profile-service';
import { storageService } from '../lib/storage';
import { realtimeManager } from '../lib/supabase';

// App state types
interface AppStateData {
  auth: AuthState;
  userProfile: any;
  userPreferences: any;
  notifications: any[];
  unreadNotifications: number;
  networkStatus: 'online' | 'offline';
  lastSync: Date | null;
}

// Action types
type AppAction =
  | { type: 'SET_AUTH_STATE'; payload: AuthState }
  | { type: 'SET_USER_PROFILE'; payload: any }
  | { type: 'SET_USER_PREFERENCES'; payload: any }
  | { type: 'ADD_NOTIFICATION'; payload: any }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'MARK_ALL_NOTIFICATIONS_READ' }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'SET_NETWORK_STATUS'; payload: 'online' | 'offline' }
  | { type: 'SET_LAST_SYNC'; payload: Date }
  | { type: 'LOGOUT' };

// Initial state
const initialState: AppStateData = {
  auth: { user: null, session: null, loading: true },
  userProfile: null,
  userPreferences: null,
  notifications: [],
  unreadNotifications: 0,
  networkStatus: 'online',
  lastSync: null,
};

// Reducer
function appReducer(state: AppStateData, action: AppAction): AppStateData {
  switch (action.type) {
    case 'SET_AUTH_STATE':
      return {
        ...state,
        auth: action.payload,
      };

    case 'SET_USER_PROFILE':
      return {
        ...state,
        userProfile: action.payload,
      };

    case 'SET_USER_PREFERENCES':
      return {
        ...state,
        userPreferences: action.payload,
      };

    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadNotifications: state.unreadNotifications + 1,
      };
    
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, read: true } : n
        ),
        unreadNotifications: Math.max(0, state.unreadNotifications - 1),
      };
    
    case 'MARK_ALL_NOTIFICATIONS_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadNotifications: 0,
      };
    
    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        notifications: [],
        unreadNotifications: 0,
      };
    
    case 'SET_NETWORK_STATUS':
      return {
        ...state,
        networkStatus: action.payload,
      };
    
    case 'SET_LAST_SYNC':
      return {
        ...state,
        lastSync: action.payload,
      };
    
    case 'LOGOUT':
      return {
        ...initialState,
        auth: { user: null, session: null, loading: false },
      };
    
    default:
      return state;
  }
}

// Context
const AppContext = createContext<{
  state: AppStateData;
  dispatch: React.Dispatch<AppAction>;
  actions: {
    signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signUp: (email: string, password: string, fullName: string, studentId: string) => Promise<{ success: boolean; error?: string }>;
    signOut: () => Promise<{ success: boolean; error?: string }>;
    refreshUserProfile: () => Promise<void>;
    refreshUserPreferences: () => Promise<void>;
    addNotification: (notification: any) => void;
    markNotificationRead: (id: string) => void;
    markAllNotificationsRead: () => void;
    clearNotifications: () => void;
    syncData: () => Promise<void>;
  };
} | null>(null);

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Actions
  const actions = {
    signIn: async (email: string, password: string) => {
      const result = await authService.signIn(email, password);
      if (result.success) {
        // Auth state will be updated by the listener
        // Note: refreshUserProfile will be called from the auth state listener
      }
      return result;
    },

    signUp: async (email: string, password: string, fullName: string, studentId: string) => {
      const result = await authService.signUp(email, password, fullName, studentId);
      return result;
    },

    signOut: async () => {
      const result = await authService.signOut();
      if (result.success) {
        realtimeManager.unsubscribeAll();
        dispatch({ type: 'LOGOUT' });
        // Clear persisted data
        await storageService.clearUserData();
      }
      return result;
    },

    refreshUserProfile: async () => {
      try {
        const userResult = await authService.getCurrentUser();
        if (userResult.success && userResult.user) {
          const profileResult = await ProfileService.getProfile(userResult.user.id);
          if (profileResult.success && profileResult.data) {
            dispatch({ type: 'SET_USER_PROFILE', payload: profileResult.data });
            // Save to storage for persistence
            await storageService.saveUserProfile(profileResult.data);
          } else {
            // Create profile if it doesn't exist
            const userData = userResult.user;
            const metadata = userData.user_metadata || {};
            const newProfile = await ProfileService.upsertProfile(userData.id, {
              user_id: userData.id,
              full_name: metadata.full_name || userData.email?.split('@')[0] || 'User',
              email: userData.email || '',
              student_id: metadata.student_id || '',
              user_type: 'student_private',
              location: 'other',
              household_size: 1,
            });

            // Try to fetch again
            const retryResult = await ProfileService.getProfile(userData.id);
            if (retryResult.success && retryResult.data) {
              dispatch({ type: 'SET_USER_PROFILE', payload: retryResult.data });
              await storageService.saveUserProfile(retryResult.data);
            }
          }
        }
      } catch (error) {
        console.error('Error refreshing user profile:', error);
      }
    },

    refreshUserPreferences: async () => {
      try {
        const userResult = await authService.getCurrentUser();
        if (userResult.success && userResult.user) {
          const prefResult = await BudgetService.getUserPreferences(userResult.user.id);
          if (prefResult.success && prefResult.data) {
            dispatch({ type: 'SET_USER_PREFERENCES', payload: prefResult.data });
            // Save to storage for persistence
            await storageService.saveUserPreferences(prefResult.data);
          }
        }
      } catch (error) {
        console.error('Error refreshing user preferences:', error);
      }
    },

    addNotification: (notification: any) => {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { ...notification, read: false } });
    },

    markNotificationRead: (id: string) => {
      dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id });
    },

    markAllNotificationsRead: () => {
      dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' });
    },

    clearNotifications: () => {
      dispatch({ type: 'CLEAR_NOTIFICATIONS' });
    },

    syncData: async () => {
      if (state.auth.user) {
        try {
          // Trigger data sync here
          dispatch({ type: 'SET_LAST_SYNC', payload: new Date() });
        } catch (error) {
          console.error('Sync error:', error);
        }
      }
    },
  };

  // Set up auth state listener
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((authState) => {
      dispatch({ type: 'SET_AUTH_STATE', payload: authState });

      if (authState.user) {
        // Save login state
        try {
          storageService.setLoggedIn(true);
        } catch (error) {
          console.error('Error setting login state:', error);
        }
        // Load user data
        actions.refreshUserProfile();
        actions.refreshUserPreferences();
        // Set up real-time subscriptions
        setupRealtimeSubscriptions(authState.user.id);
      } else {
        realtimeManager.unsubscribeAll();
        try {
          storageService.setLoggedIn(false);
        } catch (error) {
          console.error('Error setting login state:', error);
        }
      }
    });

    return unsubscribe;
  }, []);

  // Load persisted data on startup
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        // Load user profile from storage
        const persistedProfile = await storageService.getUserProfile();
        if (persistedProfile) {
          dispatch({ type: 'SET_USER_PROFILE', payload: persistedProfile });
        }

        // Load user preferences from storage
        const persistedPreferences = await storageService.getUserPreferences();
        if (persistedPreferences) {
          dispatch({ type: 'SET_USER_PREFERENCES', payload: persistedPreferences });
        }
      } catch (error) {
        console.error('Error loading persisted data:', error);
      }
    };

    loadPersistedData();
  }, []);

  // Set up real-time subscriptions
  const setupRealtimeSubscriptions = (userId: string) => {
    // Subscribe to notifications
    const notificationChannelName = `notifications_${Date.now()}`;
    realtimeManager.subscribeToTable(
      'user_notifications' as any, // This table would need to be created
      'INSERT',
      (payload) => {
        actions.addNotification(payload.new);
      },
      `user_id=eq.${userId}`
    );

    return () => {
      realtimeManager.unsubscribe(notificationChannelName);
    };
  };

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => dispatch({ type: 'SET_NETWORK_STATUS', payload: 'online' });
    const handleOffline = () => dispatch({ type: 'SET_NETWORK_STATUS', payload: 'offline' });

    // For React Native, we'll use AppState and assume online for now
    // In a real app, you'd use @react-native-async-storage/async-storage and @react-native-netinfo/netinfo
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        handleOnline();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (state.networkStatus === 'online' && state.auth.user) {
      actions.syncData();
    }
  }, [state.networkStatus, state.auth.user]);

  const value = {
    state,
    dispatch,
    actions,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Hook to use app context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Convenience hooks
export function useAuth() {
  const { state, actions } = useApp();
  return {
    user: state.auth.user,
    session: state.auth.session,
    loading: state.auth.loading,
    isAuthenticated: !!state.auth.user,
    userProfile: state.userProfile,
    userPreferences: state.userPreferences,
    signIn: actions.signIn,
    signUp: actions.signUp,
    signOut: actions.signOut,
    refreshUserProfile: actions.refreshUserProfile,
    refreshUserPreferences: actions.refreshUserPreferences,
  };
}

export function useUserProfile() {
  const { state, actions } = useApp();
  return {
    profile: state.userProfile,
    refreshProfile: actions.refreshUserProfile,
  };
}

export function useNotifications() {
  const { state, actions } = useApp();
  return {
    notifications: state.notifications,
    unreadCount: state.unreadNotifications,
    addNotification: actions.addNotification,
    markAsRead: actions.markNotificationRead,
    markAllAsRead: actions.markAllNotificationsRead,
    clearNotifications: actions.clearNotifications,
  };
}

export function useNetworkStatus() {
  const { state } = useApp();
  return {
    isOnline: state.networkStatus === 'online',
    status: state.networkStatus,
    lastSync: state.lastSync,
  };
}
