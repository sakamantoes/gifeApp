import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { AppState } from 'react-native';
import { AuthProvider, useAuth } from './src/services/AuthContext';
import NotificationHandler from './src/components/NotificationHandler';
import NotificationService from './src/services/NotificationService';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import FoodTrackingScreen from './src/screens/FoodTrackingScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import NotificationSettingsScreen from './src/screens/NotificationSettingsScreen';

const Stack = createStackNavigator();

function AppNavigator() {
  const { user } = useAuth();

  return (
    <NavigationContainer>
      {/* Notification Handler Component */}
      <NotificationHandler />
      
      <Stack.Navigator>
        {!user ? (
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <>
            <Stack.Screen 
              name="Dashboard" 
              component={DashboardScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="FoodTracking" 
              component={FoodTrackingScreen}
              options={{ title: 'Track Food' }}
            />
            <Stack.Screen 
              name="Progress" 
              component={ProgressScreen}
              options={{ title: 'Your Progress' }}
            />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen}
              options={{ title: 'Profile' }}
            />
            <Stack.Screen 
              name="NotificationSettings" 
              component={NotificationSettingsScreen}
              options={{ title: 'Notification Settings' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  // AppState handling for notification resilience
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        // Check and reschedule reminders when app comes to foreground
        console.log('🔄 App became active - checking reminders...');
        NotificationService.checkAndRescheduleReminders();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Initial check when app starts
    console.log('🚀 App starting - initial reminder check...');
    NotificationService.checkAndRescheduleReminders();

    return () => {
      console.log('🧹 Cleaning up AppState listener...');
      subscription.remove();
    };
  }, []);

  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </AuthProvider>
  );
}