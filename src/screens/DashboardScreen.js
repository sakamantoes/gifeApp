import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image
} from 'react-native';
import { useAuth } from '../services/AuthContext';
import DataService from '../services/DataService';
import { NutritionCalculator } from '../utils/NutritionCalculator';

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [todayEntries, setTodayEntries] = useState([]);
  const [goals, setGoals] = useState({
    calories: 2000,
    protein: 50,
    carbs: 250,
    fat: 70
  });
  const [totalNutrition, setTotalNutrition] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    if (!user) return;

    const entries = await DataService.getTodayFoodEntries(user.id);
    const userGoals = await DataService.getUserGoals(user.id);
    
    setTodayEntries(entries);
    
    if (userGoals) {
      setGoals(userGoals);
    }

    const totals = entries.reduce((acc, entry) => ({
      calories: acc.calories + entry.calories,
      protein: acc.protein + entry.protein,
      carbs: acc.carbs + entry.carbs,
      fat: acc.fat + entry.fat
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    setTotalNutrition(totals);
  };

  const getProgressPercentage = (current, goal) => {
    if (!goal || goal === 0) return 0;
    return Math.min((current / goal) * 100, 100);
  };

  const getAIRecommendations = () => {
    return NutritionCalculator.getAIRecommendations(totalNutrition, goals);
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

  const getProgressColor = (percentage) => {
    if (percentage < 50) return '#10ac84'; // Green
    if (percentage < 85) return '#ff9f43'; // Orange
    return '#ee5a24'; // Red
  };

  const getMealTypeColor = (mealType) => {
    const colors = {
      breakfast: '#ff9f43',
      lunch: '#2e86de',
      dinner: '#ee5a24',
      snack: '#10ac84'
    };
    return colors[mealType] || '#6c757d';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>Welcome back,</Text>
              <View style={styles.userNameContainer}>
                <Text style={styles.userName}>{user?.name}!</Text>
              </View>
            </View>
            <Text style={styles.date}>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </View>
                    
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Image 
              source={require('../icon/logout.png')}
              style={styles.logoutIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Nutrition Overview Card */}
        <View style={styles.overviewCard}>
          <Text style={styles.sectionTitle}>Today's Nutrition</Text>
          
          {/* Calories Progress */}
          <View style={styles.caloriesContainer}>
            <View style={styles.caloriesHeader}>
              <Text style={styles.caloriesLabel}>Calories</Text>
              <Text style={styles.caloriesCount}>
                {totalNutrition.calories}<Text style={styles.caloriesGoal}> / {goals.calories}</Text>
              </Text>
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressBackground}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${getProgressPercentage(totalNutrition.calories, goals.calories)}%`,
                      backgroundColor: getProgressColor(getProgressPercentage(totalNutrition.calories, goals.calories))
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressPercentage}>
                {Math.round(getProgressPercentage(totalNutrition.calories, goals.calories))}%
              </Text>
            </View>
          </View>

          {/* Macronutrients Grid */}
        <View style={styles.macrosGrid}>
  <View style={styles.macroItem}>
    <View style={styles.circleContainer}>
      <View style={[styles.circleProgress, { borderColor: '#2e86de' }]}>
        <Text style={styles.macroValue}>{totalNutrition.protein}g</Text>
      </View>
    </View>
    <Text style={styles.macroLabel}>Protein</Text>
  </View>

  <View style={styles.macroItem}>
    <View style={styles.circleContainer}>
      <View style={[styles.circleProgress, { borderColor: '#10ac84' }]}>
        <Text style={styles.macroValue}>{totalNutrition.carbs}g</Text>
      </View>
    </View>
    <Text style={styles.macroLabel}>Carbs</Text>
  </View>

  <View style={styles.macroItem}>
    <View style={styles.circleContainer}>
      <View style={[styles.circleProgress, { borderColor: '#ff9f43' }]}>
        <Text style={styles.macroValue}>{totalNutrition.fat}g</Text>
      </View>
    </View>
    <Text style={styles.macroLabel}>Fat</Text>
  </View>
</View>

        </View>

        {/* AI Recommendations */}
        <View style={styles.recommendationsCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#ffeaa7' }]}>
              {/* Replace with AI/bulb icon */}
              <Text style={styles.sectionIconText}>AI</Text>
            </View>
            <Text style={styles.sectionTitle}>Smart Recommendations</Text>
          </View>
          <View style={styles.recommendationsList}>
            {getAIRecommendations().map((rec, index) => (
              <View key={index} style={styles.recommendationItem}>
                <View style={styles.recommendationBullet} />
                <Text style={styles.recommendationText}>{rec}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('FoodTracking')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#2e86de' }]}>
                {/* Replace with add food icon */}
                <Text style={styles.actionIconText}>+</Text>
              </View>
              <Text style={styles.actionTitle}>Add Food</Text>
              <Text style={styles.actionSubtitle}>Log your meals</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Progress')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#10ac84' }]}>
                {/* Replace with progress icon */}
                <Text style={styles.actionIconText}>📈</Text>
              </View>
              <Text style={styles.actionTitle}>Progress</Text>
              <Text style={styles.actionSubtitle}>View analytics</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Profile')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#ee5a24' }]}>
                {/* Replace with profile icon */}
                <Text style={styles.actionIconText}>👤</Text>
              </View>
              <Text style={styles.actionTitle}>Profile</Text>
              <Text style={styles.actionSubtitle}>Manage account</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('NotificationSettings')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#ff9f43' }]}>
                {/* Replace with notifications icon */}
                <Text style={styles.actionIconText}>🔔</Text>
              </View>
              <Text style={styles.actionTitle}>Reminders</Text>
              <Text style={styles.actionSubtitle}>Meal alerts</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Meals */}
        <View style={styles.mealsCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Meals</Text>
            <TouchableOpacity onPress={() => navigation.navigate('FoodTracking')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {todayEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                {/* Replace with empty state icon */}
                <Text style={styles.emptyIconText}>🍽️</Text>
              </View>
              <Text style={styles.emptyTitle}>No meals logged today</Text>
              <Text style={styles.emptySubtitle}>Start tracking your nutrition by adding your first meal</Text>
              <TouchableOpacity 
                style={styles.addFirstMealButton}
                onPress={() => navigation.navigate('FoodTracking')}
              >
                <Text style={styles.addFirstMealText}>Add First Meal</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.mealsList}>
              {todayEntries.slice(0, 5).map(entry => (
                <View key={entry.id} style={styles.mealCard}>
                  <View style={styles.mealHeader}>
                    <View style={styles.mealTypeIndicator}>
                      <View 
                        style={[
                          styles.mealTypeDot,
                          { backgroundColor: getMealTypeColor(entry.mealType) }
                        ]} 
                      />
                      <Text style={styles.mealType}>
                        {entry.mealType.charAt(0).toUpperCase() + entry.mealType.slice(1)}
                      </Text>
                    </View>
                    <Text style={styles.mealTime}>
                      {new Date(entry.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  </View>
                  <Text style={styles.mealName}>{entry.foodName}</Text>
                  <View style={styles.mealNutrition}>
                    <Text style={styles.mealCalories}>{entry.calories} cal</Text>
                    <View style={styles.mealMacros}>
                      <Text style={styles.mealMacro}>P: {entry.protein}g</Text>
                      <Text style={styles.mealMacro}>C: {entry.carbs}g</Text>
                      <Text style={styles.mealMacro}>F: {entry.fat}g</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfo: {
    flex: 1,
    marginRight: 15,
  },
  greetingContainer: {
    marginBottom: 8,
  },
  greeting: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 4,
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginRight: 8,
  },
  userIcon: {
    fontSize: 20,
  },
  date: {
    fontSize: 14,
    color: '#6c757d',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  logoutIcon: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logoutIconText: {
    fontSize: 18,
  },
  overviewCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 20,
  },
  caloriesContainer: {
    marginBottom: 24,
  },
  caloriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  caloriesLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  caloriesCount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  caloriesGoal: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#2e86de',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    minWidth: 40,
  },
  macrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  circleContainer: {
    marginBottom: 8,
  },
  circleProgress: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  macroValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  macroLabel: {
    fontSize: 12,
    color: '#6c757d',
  },
  recommendationsCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionIconText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
  recommendationsList: {
    gap: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  recommendationBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2e86de',
    marginTop: 8,
    marginRight: 12,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    fontWeight: '500',
  },
  actionsCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionIconText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
  },
  mealsCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e86de',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIconText: {
    fontSize: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  addFirstMealButton: {
    backgroundColor: '#2e86de',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addFirstMealText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  mealsList: {
    gap: 12,
  },
  mealCard: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealTypeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  mealType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textTransform: 'capitalize',
  },
  mealTime: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  mealNutrition: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealCalories: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2e86de',
  },
  mealMacros: {
    flexDirection: 'row',
    gap: 8,
  },
  mealMacro: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
});