// import React, { useEffect, useRef } from 'react';
// import * as Notifications from 'expo-notifications';
// import { useNavigation } from '@react-navigation/native';

// export default function NotificationHandler() {
//   const navigation = useNavigation();
//   const notificationListener = useRef();
//   const responseListener = useRef();

//   useEffect(() => {
//     // This listener is called when a notification is received while the app is foregrounded
//     notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
//       console.log('Notification received:', notification);
//     });

//     // This listener is called when a user taps on a notification
//     responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
//       const data = response.notification.request.content.data;
      
//       console.log('Notification tapped:', data);
      
//       // Navigate to FoodTracking screen when notification is tapped
//       if (data.autoNavigate && data.screen === 'FoodTracking') {
//         navigation.navigate('FoodTracking');
//       }
//     });

//     return () => {
//       Notifications.removeNotificationSubscription(notificationListener.current);
//       Notifications.removeNotificationSubscription(responseListener.current);
//     };
//   }, [navigation]);

//   return null;
// }
import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';

export default function NotificationHandler() {
  const navigation = useNavigation();
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // This listener is called when a notification is received while the app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // This listener is called when a user taps on a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      console.log('Notification tapped:', data);
      
      // Navigate to FoodTracking screen when notification is tapped
      if (data.autoNavigate && data.screen === 'FoodTracking') {
        navigation.navigate('FoodTracking');
      }
    });

    return () => {
      // Use the correct method to remove listeners
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [navigation]);

  return null;
}