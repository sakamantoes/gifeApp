import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../services/AuthContext';
import DataService from '../services/DataService';
import AdvancedNutritionAnalyzer from '../services/AdvancedNutritionAnalyzer';
import MealAdjustmentEngine from '../services/MealAdjustmentEngine';
import TrendPredictionEngine from '../services/TrendPredictionEngine';

export default function InsightsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [insights, setInsights] = useState({
    imbalances: [],
    trends: null,
    predictions: null,
    weeklyCycles: null,
    mealPatterns: null,
    foodDiversity: null
  });
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d

  useEffect(() => {
    if (user) {
      loadInsights();
    }
  }, [user, timeRange]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      
      // Get food entries
      const allEntries = await DataService.getFoodEntries(user.id);
      if (allEntries.length === 0) {
        setLoading(false);
        return;
      }

      // Filter by time range
      const filteredEntries = filterByTimeRange(allEntries, timeRange);
      
      // Initialize analyzers
      const nutritionAnalyzer = new AdvancedNutritionAnalyzer();
      const mealAdjustmentEngine = new MealAdjustmentEngine();
      const trendPredictionEngine = new TrendPredictionEngine();

      // User data
      const userData = {
        totalProtein: calculateTotal(filteredEntries, 'protein'),
        totalCarbs: calculateTotal(filteredEntries, 'carbs'),
        totalFat: calculateTotal(filteredEntries, 'fat'),
        totalCalories: calculateTotal(filteredEntries, 'calories'),
        weight: user?.weight || 70
      };

      // 1. Nutrient Imbalance Analysis
      const imbalances = nutritionAnalyzer.detectImbalances(userData, filteredEntries);
      
      // 2. Food Diversity Score
      const diversityScore = nutritionAnalyzer.calculateFoodDiversity(filteredEntries);
      
      // 3. Meal Patterns
      const mealPatterns = nutritionAnalyzer.analyzeMealPattern(filteredEntries);
      
      // 4. Trend Analysis
      let trends = null;
      let predictions = null;
      let weeklyCycles = null;
      
      if (filteredEntries.length >= 7) {
        trends = trendPredictionEngine.analyzeTrends(filteredEntries, {
          calories: userData.totalCalories / filteredEntries.length,
          protein: userData.totalProtein / filteredEntries.length,
          carbs: userData.totalCarbs / filteredEntries.length,
          fat: userData.totalFat / filteredEntries.length,
          weight: user?.weight,
          targetWeight: user?.goal === 'weight_loss' ? user.weight * 0.9 : user?.weight,
          goal: user?.goal || 'maintenance'
        });
        
        predictions = trendPredictionEngine.predictGoalProgress(filteredEntries, {
          weight: user?.weight,
          targetWeight: user?.goal === 'weight_loss' ? user.weight * 0.9 : user?.weight
        });
        
        weeklyCycles = trendPredictionEngine.detectWeeklyCycles(filteredEntries);
      }

      setInsights({
        imbalances,
        trends,
        predictions,
        weeklyCycles,
        mealPatterns,
        foodDiversity: diversityScore
      });
      
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterByTimeRange = (entries, range) => {
    const now = new Date();
    const cutoff = new Date();
    
    switch (range) {
      case '7d':
        cutoff.setDate(cutoff.getDate() - 7);
        break;
      case '30d':
        cutoff.setDate(cutoff.getDate() - 30);
        break;
      case '90d':
        cutoff.setDate(cutoff.getDate() - 90);
        break;
      default:
        cutoff.setDate(cutoff.getDate() - 7);
    }
    
    return entries.filter(entry => new Date(entry.timestamp) >= cutoff);
  };

  const calculateTotal = (entries, nutrient) => {
    return entries.reduce((sum, entry) => sum + (entry[nutrient] || 0), 0);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInsights();
    setRefreshing(false);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'HIGH': return '#e74c3c';
      case 'MEDIUM': return '#f39c12';
      case 'LOW': return '#2e86de';
      default: return '#6c757d';
    }
  };

  const renderTimeRangeButtons = () => (
    <View style={styles.timeRangeContainer}>
      {['7d', '30d', '90d'].map(range => (
        <TouchableOpacity
          key={range}
          style={[
            styles.timeRangeButton,
            timeRange === range && styles.timeRangeButtonActive
          ]}
          onPress={() => setTimeRange(range)}
        >
          <Text style={[
            styles.timeRangeText,
            timeRange === range && styles.timeRangeTextActive
          ]}>
            {range}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderImbalanceCard = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Icon name="warning" size={24} color="#e74c3c" />
        <Text style={styles.cardTitle}>Nutrient Imbalances</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{insights.imbalances.length}</Text>
        </View>
      </View>
      
      {insights.imbalances.length > 0 ? (
        insights.imbalances.slice(0, 3).map((imbalance, index) => (
          <View key={index} style={styles.imbalanceItem}>
            <View style={styles.imbalanceHeader}>
              <View style={[
                styles.severityDot,
                { backgroundColor: getSeverityColor(imbalance.severity) }
              ]} />
              <Text style={styles.imbalanceType}>{imbalance.type.replace('_', ' ')}</Text>
            </View>
            <Text style={styles.imbalanceMessage}>{imbalance.message}</Text>
            <Text style={styles.imbalanceSolution}>
              <Icon name="lightbulb" size={14} color="#2e86de" /> {imbalance.solutions?.[0] || imbalance.suggestion}
            </Text>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Icon name="check-circle" size={32} color="#10ac84" />
          <Text style={styles.emptyText}>No imbalances detected! Great job!</Text>
        </View>
      )}
    </View>
  );

  const renderTrendCard = () => {
    if (!insights.trends?.calorieTrend) return null;
    
    const trend = insights.trends.calorieTrend;
    const arrow = trend.direction === 'increasing' ? '📈' : 
                  trend.direction === 'decreasing' ? '📉' : '➡️';
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="trending-up" size={24} color="#2e86de" />
          <Text style={styles.cardTitle}>Trend Analysis</Text>
        </View>
        
        <View style={styles.trendRow}>
          <View style={styles.trendItem}>
            <Text style={styles.trendLabel}>Current Avg</Text>
            <Text style={styles.trendValue}>{trend.currentAverage} cal</Text>
          </View>
          
          <View style={styles.trendItem}>
            <Text style={styles.trendLabel}>Trend</Text>
            <View style={styles.trendDirection}>
              <Text style={styles.trendArrow}>{arrow}</Text>
              <Text style={styles.trendChange}>{Math.abs(trend.trend)} cal/day</Text>
            </View>
          </View>
          
          <View style={styles.trendItem}>
            <Text style={styles.trendLabel}>Prediction</Text>
            <Text style={styles.trendValue}>{trend.prediction} cal</Text>
          </View>
        </View>
        
        <Text style={styles.trendInsight}>{trend.recommendation}</Text>
      </View>
    );
  };

  const renderWeeklyCycleCard = () => {
    if (!insights.weeklyCycles) return null;
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="calendar-today" size={24} color="#10ac84" />
          <Text style={styles.cardTitle}>Weekly Patterns</Text>
        </View>
        
        <View style={styles.weekGrid}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
            const dayData = insights.weeklyCycles[day] || {};
            return (
              <View key={day} style={styles.dayCell}>
                <Text style={styles.dayLabel}>{day}</Text>
                <Text style={styles.dayCalories}>
                  {dayData.averageCalories ? `${Math.round(dayData.averageCalories)}` : '-'}
                </Text>
                {dayData.isHighDay && <View style={styles.highIndicator} />}
                {dayData.isLowDay && <View style={styles.lowIndicator} />}
              </View>
            );
          })}
        </View>
        
        {insights.weeklyCycles.weekendEffect?.detected && (
          <Text style={styles.weekendAlert}>
            Weekend calories {insights.weeklyCycles.weekendEffect.difference}% higher than weekdays
          </Text>
        )}
      </View>
    );
  };

  const renderPredictionCard = () => {
    if (!insights.predictions) return null;
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="psychology" size={24} color="#9b59b6" />
          <Text style={styles.cardTitle}>Goal Prediction</Text>
        </View>
        
        <View style={styles.predictionRow}>
          <View style={styles.predictionItem}>
            <Text style={styles.predictionLabel}>Current</Text>
            <Text style={styles.predictionValue}>{insights.predictions.currentWeight}kg</Text>
          </View>
          
          <Icon name="arrow-forward" size={20} color="#6c757d" />
          
          <View style={styles.predictionItem}>
            <Text style={styles.predictionLabel}>Goal</Text>
            <Text style={styles.predictionValue}>{insights.predictions.goalWeight}kg</Text>
          </View>
        </View>
        
        <Text style={styles.predictionText}>
          Estimated: {insights.predictions.weeksToGoal} weeks to goal
        </Text>
        <Text style={styles.predictionSubtext}>
          Expected: {insights.predictions.expectedDate}
        </Text>
      </View>
    );
  };

  const renderDiversityCard = () => {
    if (!insights.foodDiversity) return null;
    
    const score = insights.foodDiversity;
    const percentage = Math.round(score * 100);
    let rating = '';
    let color = '';
    
    if (percentage >= 80) {
      rating = 'Excellent';
      color = '#10ac84';
    } else if (percentage >= 60) {
      rating = 'Good';
      color = '#2e86de';
    } else if (percentage >= 40) {
      rating = 'Fair';
      color = '#f39c12';
    } else {
      rating = 'Needs Improvement';
      color = '#e74c3c';
    }
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="eco" size={24} color={color} />
          <Text style={styles.cardTitle}>Food Diversity</Text>
          <Text style={[styles.diversityScore, { color }]}>{percentage}%</Text>
        </View>
        
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${percentage}%`, backgroundColor: color }
            ]} 
          />
        </View>
        
        <Text style={styles.diversityRating}>{rating}</Text>
        <Text style={styles.diversityTip}>
          {percentage < 60 ? 'Try adding more variety to your meals!' : 'Great variety in your diet!'}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e86de" />
        <Text style={styles.loadingText}>Analyzing your nutrition data...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Nutrition Insights</Text>
          <Text style={styles.subtitle}>Advanced analytics & predictions</Text>
        </View>
        <Icon name="insights" size={32} color="#2e86de" />
      </View>

      {/* Time Range Selector */}
      {renderTimeRangeButtons()}

      {/* Main Insights */}
      {renderImbalanceCard()}
      {renderDiversityCard()}
      {renderTrendCard()}
      {renderWeeklyCycleCard()}
      {renderPredictionCard()}

      {/* Empty State */}
      {!insights.imbalances.length && 
       !insights.trends && 
       !insights.predictions && (
        <View style={styles.emptyContainer}>
          <Icon name="analytics" size={64} color="#e9ecef" />
          <Text style={styles.emptyTitle}>Not Enough Data</Text>
          <Text style={styles.emptyMessage}>
            Track your meals for at least 7 days to see detailed insights and predictions.
          </Text>
        </View>
      )}

      {/* Information Footer */}
      <View style={styles.infoCard}>
        <Icon name="info" size={20} color="#6c757d" />
        <Text style={styles.infoText}>
          Insights update automatically as you track meals. 
          For accurate predictions, maintain consistent tracking.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
  },
  timeRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  timeRangeButtonActive: {
    backgroundColor: '#2e86de',
    borderColor: '#2e86de',
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
  },
  timeRangeTextActive: {
    color: 'white',
  },
  card: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginLeft: 12,
    flex: 1,
  },
  badge: {
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  imbalanceItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  imbalanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  imbalanceType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    textTransform: 'capitalize',
  },
  imbalanceMessage: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 8,
    lineHeight: 20,
  },
  imbalanceSolution: {
    fontSize: 13,
    color: '#2e86de',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#10ac84',
    marginTop: 8,
    textAlign: 'center',
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  trendItem: {
    alignItems: 'center',
    flex: 1,
  },
  trendLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  trendValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  trendDirection: {
    alignItems: 'center',
  },
  trendArrow: {
    fontSize: 20,
    marginBottom: 4,
  },
  trendChange: {
    fontSize: 12,
    color: '#6c757d',
  },
  trendInsight: {
    fontSize: 14,
    color: '#2c3e50',
    fontStyle: 'italic',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f8f9fa',
  },
  weekGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dayCell: {
    alignItems: 'center',
    padding: 8,
    flex: 1,
  },
  dayLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  dayCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  highIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e74c3c',
  },
  lowIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2e86de',
  },
  weekendAlert: {
    fontSize: 13,
    color: '#e74c3c',
    textAlign: 'center',
    padding: 12,
    backgroundColor: '#fff5f5',
    borderRadius: 8,
    fontStyle: 'italic',
  },
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  predictionItem: {
    alignItems: 'center',
    flex: 1,
  },
  predictionLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  predictionValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  predictionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 4,
  },
  predictionSubtext: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  diversityScore: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  diversityRating: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 4,
  },
  diversityTip: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    marginHorizontal: 16,
    marginVertical: 20,
    backgroundColor: 'white',
    borderRadius: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 13,
    color: '#1976d2',
    marginLeft: 12,
    flex: 1,
    lineHeight: 18,
  },
});