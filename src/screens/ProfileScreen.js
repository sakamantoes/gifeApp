import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../services/AuthContext';
import DataService from '../services/DataService';

export default function ProfileScreen({ navigation }) { // Add navigation prop
  const { user, logout } = useAuth();
  const [goals, setGoals] = useState({
    calories: 2000,
    protein: 50,
    carbs: 250,
    fat: 70
  });

  useEffect(() => {
    loadUserGoals();
  }, []);

  const loadUserGoals = async () => {
    if (!user) return;
    const userGoals = await DataService.getUserGoals(user.id);
    setGoals(userGoals);
  };

  const updateGoal = async (field, value) => {
    const newGoals = { ...goals, [field]: value };
    setGoals(newGoals);
    await DataService.setUserGoals(user.id, newGoals);
    Alert.alert('Success', 'Goals updated successfully!');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout }
      ]
    );
  };

  const GoalInput = ({ label, value, field, unit = '' }) => (
    <View style={styles.goalItem}>
      <Text style={styles.goalLabel}>{label}</Text>
      <View style={styles.goalControls}>
        <TouchableOpacity 
          style={styles.goalButton}
          onPress={() => updateGoal(field, Math.max(0, value - 10))}
        >
          <Icon name="remove" size={20} color="#6c757d" />
        </TouchableOpacity>
        
        <Text style={styles.goalValue}>
          {value} {unit}
        </Text>
        
        <TouchableOpacity 
          style={styles.goalButton}
          onPress={() => updateGoal(field, value + 10)}
        >
          <Icon name="add" size={20} color="#6c757d" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* User Info Card */}
      <View style={styles.card}>
        <View style={styles.userHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.memberSince}>
              Member since {new Date(user?.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Daily Goals Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Daily Nutrition Goals</Text>
        
        <GoalInput
          label="Calories"
          value={goals.calories}
          field="calories"
          unit="cal"
        />
        
        <GoalInput
          label="Protein"
          value={goals.protein}
          field="protein"
          unit="g"
        />
        
        <GoalInput
          label="Carbohydrates"
          value={goals.carbs}
          field="carbs"
          unit="g"
        />
        
        <GoalInput
          label="Fat"
          value={goals.fat}
          field="fat"
          unit="g"
        />
      </View>

      {/* App Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>App Information</Text>
        
        <View style={styles.infoItem}>
          <Icon name="info" size={20} color="#6c757d" />
          <Text style={styles.infoText}>Version 1.0.0</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Icon name="update" size={20} color="#6c757d" />
          <Text style={styles.infoText}>Last updated: {new Date().toLocaleDateString()}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Icon name="support" size={20} color="#6c757d" />
          <Text style={styles.infoText}>Support: support@nutritrack.com</Text>
        </View>
      </View>

      {/* Actions Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Actions</Text>
        
        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => navigation.navigate('NotificationSettings')}
        >
          <Icon name="notifications" size={20} color="#6c757d" />
          <Text style={styles.actionText}>Notification Settings</Text>
          <Icon name="chevron-right" size={20} color="#6c757d" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionItem}>
          <Icon name="privacy-tip" size={20} color="#6c757d" />
          <Text style={styles.actionText}>Privacy Policy</Text>
          <Icon name="chevron-right" size={20} color="#6c757d" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionItem}>
          <Icon name="description" size={20} color="#6c757d" />
          <Text style={styles.actionText}>Terms of Service</Text>
          <Icon name="chevron-right" size={20} color="#6c757d" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionItem} onPress={handleLogout}>
          <Icon name="logout" size={20} color="#e74c3c" />
          <Text style={[styles.actionText, styles.logoutText]}>Logout</Text>
          <Icon name="chevron-right" size={20} color="#e74c3c" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 15,
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2e86de',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 12,
    color: '#6c757d',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
  },
  goalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  goalLabel: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
  },
  goalControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  goalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e86de',
    marginHorizontal: 15,
    minWidth: 60,
    textAlign: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  infoText: {
    fontSize: 14,
    color: '#6c757d',
    marginLeft: 12,
    flex: 1,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  actionText: {
    fontSize: 16,
    color: '#2c3e50',
    marginLeft: 12,
    flex: 1,
  },
  logoutText: {
    color: '#e74c3c',
  },
});