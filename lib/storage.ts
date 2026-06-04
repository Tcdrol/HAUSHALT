import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER_PROFILE: '@haushalt:user_profile',
  USER_PREFERENCES: '@haushalt:user_preferences',
  AUTH_STATE: '@haushalt:auth_state',
};

// Check if AsyncStorage is available
const isStorageAvailable = () => {
  try {
    return typeof AsyncStorage !== 'undefined' && AsyncStorage.getItem;
  } catch {
    return false;
  }
};

export class StorageService {
  // Save user profile locally
  static async saveUserProfile(profile: any): Promise<void> {
    if (!isStorageAvailable()) {
      console.warn('AsyncStorage not available, skipping profile save');
      return;
    }
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  }

  // Get user profile from local storage
  static async getUserProfile(): Promise<any | null> {
    if (!isStorageAvailable()) {
      console.warn('AsyncStorage not available, returning null for profile');
      return null;
    }
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  // Save user preferences locally
  static async saveUserPreferences(preferences: any): Promise<void> {
    if (!isStorageAvailable()) {
      console.warn('AsyncStorage not available, skipping preferences save');
      return;
    }
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving user preferences:', error);
    }
  }

  // Get user preferences from local storage
  static async getUserPreferences(): Promise<any | null> {
    if (!isStorageAvailable()) {
      console.warn('AsyncStorage not available, returning null for preferences');
      return null;
    }
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }
  }

  // Clear all user data (on logout)
  static async clearUserData(): Promise<void> {
    if (!isStorageAvailable()) {
      console.warn('AsyncStorage not available, skipping data clear');
      return;
    }
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_PREFERENCES);
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_STATE);
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  }

  // Save basic auth state flag
  static async setLoggedIn(isLoggedIn: boolean): Promise<void> {
    if (!isStorageAvailable()) {
      console.warn('AsyncStorage not available, skipping auth state save');
      return;
    }
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_STATE, JSON.stringify({ isLoggedIn }));
    } catch (error) {
      console.error('Error setting auth state:', error);
    }
  }

  // Check if user was logged in
  static async isLoggedIn(): Promise<boolean> {
    if (!isStorageAvailable()) {
      console.warn('AsyncStorage not available, returning false for login state');
      return false;
    }
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_STATE);
      return data ? JSON.parse(data).isLoggedIn : false;
    } catch (error) {
      console.error('Error checking login state:', error);
      return false;
    }
  }
}

export const storageService = StorageService;
