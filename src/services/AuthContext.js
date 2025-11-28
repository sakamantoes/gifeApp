import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService from './NotificationService'; // Remove .default

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notificationSettings, setNotificationSettings] = useState({ enabled: false });

  useEffect(() => {
    checkAuthState();
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      // FIX: Remove .default - use directly
      const settings = await NotificationService.loadReminderSettings();
      setNotificationSettings(settings);
    } catch (error) {
      console.error('Error loading notification settings:', error);
      setNotificationSettings({ enabled: false });
    }
  };

  const checkAuthState = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setUser(user);
        
        // Load user's notification preferences
        const settings = await NotificationService.loadReminderSettings();
        if (settings.enabled) {
          await NotificationService.scheduleMealReminders();
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const users = await AsyncStorage.getItem('users');
    const userList = users ? JSON.parse(users) : [];
    const foundUser = userList.find(u => u.email === email && u.password === password);
    
    if (foundUser) {
      setUser(foundUser);
      await AsyncStorage.setItem('user', JSON.stringify(foundUser));
      
      // Load user's notification preferences
      const settings = await NotificationService.loadReminderSettings();
      if (settings.enabled) {
        await NotificationService.scheduleMealReminders();
      }
      
      return { success: true };
    }
    return { success: false, error: 'Invalid credentials' };
  };

  const register = async (userData) => {
    const users = await AsyncStorage.getItem('users');
    const userList = users ? JSON.parse(users) : [];
    
    if (userList.find(u => u.email === userData.email)) {
      return { success: false, error: 'User already exists' };
    }

    const newUser = {
      id: Date.now().toString(),
      ...userData,
      createdAt: new Date().toISOString()
    };

    userList.push(newUser);
    await AsyncStorage.setItem('users', JSON.stringify(userList));
    
    setUser(newUser);
    await AsyncStorage.setItem('user', JSON.stringify(newUser));
    
    return { success: true };
  };

  const logout = async () => {
    // Cancel all notifications on logout
    await NotificationService.cancelAllMealReminders();
    await AsyncStorage.removeItem('user');
    setUser(null);
  };

  const toggleNotifications = async (enabled) => {
    if (enabled) {
      await NotificationService.scheduleMealReminders();
    } else {
      await NotificationService.cancelAllMealReminders();
    }
    setNotificationSettings({ enabled });
    
    // Save the setting
    await NotificationService.saveReminderSettings({ enabled });
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    notificationSettings,
    toggleNotifications
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}