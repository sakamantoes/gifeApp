import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification handler - UPDATED to fix deprecation
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // Keep for backward compatibility
    shouldPlaySound: true,
    shouldSetBadge: true,
    // Add the new properties to fix the warning
    shouldShowBanner: true, // For iOS banners
    shouldShowList: true,   // For notification center
  }),
});

class NotificationService {
  constructor() {
    this.mealReminders = {
      breakfast: { hour: 8, minute: 0, title: 'Breakfast Time!', body: 'Don\'t forget to log your breakfast and start your day with healthy nutrition!' },
      lunch: { hour: 13, minute: 0, title: 'Lunch Time!', body: 'Time for lunch! Track your meal to maintain your nutrition goals.' },
      dinner: { hour: 19, minute: 0, title: 'Dinner Time!', body: 'Evening meal time! Log your dinner to complete your daily nutrition tracking.' },
      snack: { hour: 16, minute: 0, title: 'Snack Time!', body: 'Afternoon snack reminder! Keep your energy levels up with healthy snacks.' }
    };
    
    this.setupNotificationChannel();
  }

  // Setup Android notification channel
  async setupNotificationChannel() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('meal-reminders', {
        name: 'Meal Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2e86de',
        sound: 'default',
      });
    }
  }

  // Request permissions for notifications
  async requestPermissions() {
    if (!Device.isDevice) {
      console.log('Must use physical device for push notifications');
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  // Schedule all meal reminders
  async scheduleMealReminders() {
    try {
      // Cancel existing reminders first
      await this.cancelAllMealReminders();

      const permissionsGranted = await this.requestPermissions();
      if (!permissionsGranted) {
        console.log('Notification permissions not granted');
        return;
      }

      for (const [mealType, reminder] of Object.entries(this.mealReminders)) {
        await this.scheduleMealReminder(mealType, reminder);
      }

      console.log('All meal reminders scheduled successfully');
      await this.saveReminderSettings({ enabled: true });
    } catch (error) {
      console.error('Error scheduling meal reminders:', error);
    }
  }

  // Schedule individual meal reminder
  async scheduleMealReminder(mealType, reminder) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: reminder.title,
          body: reminder.body,
          sound: 'default',
          data: { 
            mealType, 
            screen: 'FoodTracking',
            autoNavigate: true 
          },
          android: {
            channelId: 'meal-reminders',
            priority: 'high',
          },
          ios: {
            sound: true,
          },
        },
        trigger: {
          hour: reminder.hour,
          minute: reminder.minute,
          repeats: true,
        },
      });

      console.log(`✅ Scheduled ${mealType} reminder for ${reminder.hour}:${reminder.minute.toString().padStart(2, '0')}`);
    } catch (error) {
      console.error(`❌ Error scheduling ${mealType} reminder:`, error);
    }
  }

  // Cancel all meal reminders
  async cancelAllMealReminders() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('🗑️ All meal reminders cancelled');
    } catch (error) {
      console.error('Error cancelling reminders:', error);
    }
  }

  // Save reminder settings
  async saveReminderSettings(settings) {
    try {
      await AsyncStorage.setItem('mealReminderSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving reminder settings:', error);
    }
  }

  // Load reminder settings
  async loadReminderSettings() {
    try {
      const settings = await AsyncStorage.getItem('mealReminderSettings');
      return settings ? JSON.parse(settings) : { enabled: false };
    } catch (error) {
      console.error('Error loading reminder settings:', error);
      return { enabled: false };
    }
  }

  // Update reminder times
  async updateReminderTime(mealType, hour, minute) {
    this.mealReminders[mealType] = {
      ...this.mealReminders[mealType],
      hour,
      minute
    };

    // Reschedule all reminders with new times
    await this.scheduleMealReminders();
  }

  // Check if notifications are enabled
  async checkNotificationStatus() {
    try {
      const settings = await Notifications.getPermissionsAsync();
      return settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
    } catch (error) {
      console.error('Error checking notification status:', error);
      return false;
    }
  }

  // Send immediate test notification
  async sendTestNotification() {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Notification - Nutrihive',
          body: 'This is a test notification from Nutrihive! Your meal reminders are working correctly.',
          sound: 'default',
          data: { test: true },
          android: {
            channelId: 'meal-reminders',
          },
        },
        trigger: {
          seconds: 2,
        },
      });
      console.log('✅ Test notification sent');
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
    }
  }

  // Get upcoming scheduled notifications
  async getScheduledNotifications() {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  // Save meal times to storage
  async saveMealTimes(mealTimes) {
    try {
      await AsyncStorage.setItem('mealTimes', JSON.stringify(mealTimes));
    } catch (error) {
      console.error('Error saving meal times:', error);
    }
  }

  // Load meal times from storage
  async loadMealTimes() {
    try {
      const mealTimes = await AsyncStorage.getItem('mealTimes');
      return mealTimes ? JSON.parse(mealTimes) : null;
    } catch (error) {
      console.error('Error loading meal times:', error);
      return null;
    }
  }

  // Get current reminder times
  getCurrentReminderTimes() {
    return this.mealReminders;
  }

  // Check and reschedule reminders after app restart
  async checkAndRescheduleReminders() {
    try {
      const settings = await this.loadReminderSettings();
      if (settings.enabled) {
        const scheduled = await this.getScheduledNotifications();
        
        // If no reminders are scheduled but they should be, reschedule them
        if (scheduled.length === 0) {
          console.log('🔄 Rescheduling reminders after app restart...');
          await this.scheduleMealReminders();
        } else {
          console.log(`✅ ${scheduled.length} reminders already scheduled`);
        }
      }
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  }

  // Get formatted schedule for display
  getFormattedSchedule() {
    const schedule = {};
    for (const [meal, time] of Object.entries(this.mealReminders)) {
      const period = time.hour >= 12 ? 'PM' : 'AM';
      const displayHour = time.hour % 12 || 12;
      schedule[meal] = `${displayHour}:${time.minute.toString().padStart(2, '0')} ${period}`;
    }
    return schedule;
  }
}

// Export the instance
export default new NotificationService();