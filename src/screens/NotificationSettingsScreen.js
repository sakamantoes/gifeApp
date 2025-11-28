import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../services/AuthContext';
import NotificationService from '../services/NotificationService';

const { width } = Dimensions.get('window');

export default function NotificationSettingsScreen() {
  const { toggleNotifications } = useAuth();
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [scheduledNotifications, setScheduledNotifications] = useState([]);

  // Simple default times in 12-hour format
  const defaultMealTimes = {
    breakfast: '8:00 AM',
    lunch: '1:00 PM', 
    snack: '4:00 PM',
    dinner: '7:00 PM'
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const settings = await NotificationService.loadReminderSettings();
    setRemindersEnabled(settings.enabled);
    loadScheduledNotifications();
  };

  const loadScheduledNotifications = async () => {
    const notifications = await NotificationService.getScheduledNotifications();
    setScheduledNotifications(notifications);
  };

  // Check notification status function
  const checkNotificationStatus = async () => {
    const status = await NotificationService.checkNotificationStatus();
    if (!status) {
      Alert.alert(
        'Notifications Disabled',
        'Please enable notifications in your device settings to receive meal reminders.',
        [
          { 
            text: 'Open Settings', 
            onPress: () => {
              Alert.alert(
                'How to Enable Notifications',
                'Go to:\nSettings > Apps > NutriTrack > Notifications > Enable notifications\n\nThen come back and enable reminders.',
                [{ text: 'OK', style: 'default' }]
              );
            }
          },
          { text: 'Later', style: 'cancel' }
        ]
      );
      return false;
    }
    return true;
  };

  // Updated toggle function with permission check
  const handleToggleReminders = async (enabled) => {
    if (enabled) {
      const hasPermission = await checkNotificationStatus();
      if (!hasPermission) {
        setRemindersEnabled(false);
        return;
      }
    }
    
    setRemindersEnabled(enabled);
    
    if (enabled) {
      // Enable reminders with default times
      await NotificationService.scheduleMealReminders();
      Alert.alert('✅ Reminders Enabled', 'You will get meal reminders at:\n• 8:00 AM - Breakfast\n• 1:00 PM - Lunch\n• 4:00 PM - Snack\n• 7:00 PM - Dinner');
    } else {
      await NotificationService.cancelAllMealReminders();
      Alert.alert('Reminders Off', 'Meal reminders are now disabled');
    }
    
    loadScheduledNotifications();
  };

  const handleTestNotification = async () => {
    // Check permissions before sending test
    const hasPermission = await checkNotificationStatus();
    if (!hasPermission) {
      setRemindersEnabled(false);
      return;
    }
    
    await NotificationService.sendTestNotification();
    Alert.alert('Test Sent', 'Check your notifications in 2 seconds!');
  };

  const resetToDefaultTimes = async () => {
    if (!remindersEnabled) {
      Alert.alert('Enable Reminders First', 'Turn on reminders to reset times');
      return;
    }

    Alert.alert(
      'Reset to Default Times?',
      'This will reset all reminders to:\n8:00 AM, 1:00 PM, 4:00 PM, 7:00 PM',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: async () => {
            await NotificationService.scheduleMealReminders();
            loadScheduledNotifications();
            Alert.alert('✅ Reset Complete', 'All reminders set to default times');
          }
        }
      ]
    );
  };

  const MealTimeItem = ({ meal, icon, time }) => (
    <View style={styles.mealItem}>
      <View style={styles.mealLeft}>
        <View style={styles.mealIcon}>
          <Icon name={icon} size={20} color="#2e86de" />
        </View>
        <Text style={styles.mealName}>{meal}</Text>
      </View>
      <Text style={styles.mealTime}>{time}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* Main Toggle - Simple */}
      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Meal Reminders</Text>
            <Text style={styles.toggleSubtitle}>
              Get reminders to log your meals
            </Text>
          </View>
          <Switch
            value={remindersEnabled}
            onValueChange={handleToggleReminders}
            trackColor={{ false: '#e9ecef', true: '#b8d4ff' }}
            thumbColor={remindersEnabled ? '#2e86de' : '#ffffff'}
          />
        </View>
        
        {/* Permission Status Indicator */}
        {remindersEnabled && (
          <View style={styles.permissionStatus}>
            <Icon name="check-circle" size={16} color="#10ac84" />
            <Text style={styles.permissionText}>Notifications enabled</Text>
          </View>
        )}
      </View>

      {remindersEnabled ? (
        <>
          {/* Current Schedule - Simple */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Current Schedule</Text>
              <TouchableOpacity onPress={resetToDefaultTimes} style={styles.resetBtn}>
                <Text style={styles.resetText}>Reset</Text>
              </TouchableOpacity>
            </View>
            
            <MealTimeItem
              meal="Breakfast"
              icon="free-breakfast"
              time={defaultMealTimes.breakfast}
            />
            <MealTimeItem
              meal="Lunch"
              icon="lunch-dining"
              time={defaultMealTimes.lunch}
            />
            <MealTimeItem
              meal="Afternoon Snack"
              icon="local-cafe"
              time={defaultMealTimes.snack}
            />
            <MealTimeItem
              meal="Dinner"
              icon="dinner-dining"
              time={defaultMealTimes.dinner}
            />

            <Text style={styles.note}>
              💡 Times are fixed for simplicity. Contact support for custom times.
            </Text>
          </View>

          {/* Test Button */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Test Notifications</Text>
            <Text style={styles.cardSubtitle}>Check if reminders work</Text>
            <TouchableOpacity style={styles.testButton} onPress={handleTestNotification}>
              <Icon name="notifications" size={20} color="white" />
              <Text style={styles.testButtonText}>Send Test</Text>
            </TouchableOpacity>
          </View>

          {/* Active Reminders - Optional (commented out) */}
          {/* <View style={styles.card}>
            <Text style={styles.cardTitle}>Active Reminders</Text>
            <Text style={styles.cardSubtitle}>
              {scheduledNotifications.length} reminders scheduled
            </Text>
            
            {scheduledNotifications.length > 0 ? (
              scheduledNotifications.slice(0, 4).map((notification, index) => {
                const hour = notification.trigger.hour;
                const minute = notification.trigger.minute;
                const period = hour >= 12 ? 'PM' : 'AM';
                const displayHour = hour % 12 || 12;
                
                return (
                  <View key={index} style={styles.reminderItem}>
                    <Icon name="schedule" size={16} color="#10ac84" />
                    <Text style={styles.reminderText}>
                      {notification.content.title} at {displayHour}:{minute.toString().padStart(2, '0')} {period}
                    </Text>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyReminders}>
                <Icon name="notifications-off" size={32} color="#e9ecef" />
                <Text style={styles.emptyText}>No active reminders</Text>
              </View>
            )}
          </View> */}
        </>
      ) : (
        /* Simple Disabled State */
        <View style={styles.disabledCard}>
          <Icon name="notifications-off" size={40} color="#e9ecef" />
          <Text style={styles.disabledTitle}>Reminders Off</Text>
          <Text style={styles.disabledText}>
            Turn on reminders to get notified about meals
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  card: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  toggleSubtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  permissionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 172, 132, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  permissionText: {
    fontSize: 12,
    color: '#10ac84',
    fontWeight: '500',
    marginLeft: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 16,
  },
  resetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },
  resetText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  mealLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mealIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(46, 134, 222, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mealName: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  mealTime: {
    fontSize: 16,
    color: '#2e86de',
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
  },
  testButton: {
    flexDirection: 'row',
    backgroundColor: '#2e86de',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
    gap: 10,
  },
  reminderText: {
    fontSize: 14,
    color: '#2c3e50',
    flex: 1,
  },
  emptyReminders: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 8,
  },
  disabledCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 12,
    marginBottom: 8,
  },
  disabledText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
});