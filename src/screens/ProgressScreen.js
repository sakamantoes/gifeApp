import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
  Animated
} from 'react-native';
import { LineChart, BarChart, ProgressChart } from 'react-native-chart-kit';
import { useAuth } from '../services/AuthContext';
import DataService from '../services/DataService';
import { NutritionCalculator } from '../utils/NutritionCalculator';
import Icon from 'react-native-vector-icons/MaterialIcons';

const screenWidth = Dimensions.get('window').width;

export default function ProgressScreen() {
  const { user } = useAuth();
  const [progressData, setProgressData] = useState({});
  const [weeklyTotals, setWeeklyTotals] = useState({});
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);
  const [chartType, setChartType] = useState('line');
  const [activeMetric, setActiveMetric] = useState('calories');
  const fadeAnim = useState(new Animated.Value(0))[0];

  const periods = [
    { id: '7d', label: '7 Days', icon: 'calendar-today' },
    { id: '30d', label: '30 Days', icon: 'date-range' },
    { id: '90d', label: '90 Days', icon: 'event' },
    { id: '1y', label: '1 Year', icon: 'calendar-month' }
  ];

  const metrics = [
    { 
      id: 'calories', 
      label: 'Calories', 
      icon: 'local-fire-department', 
      color: '#FF6B6B', 
      gradient: ['#FF6B6B', '#FF8E8E'],
      unit: 'cal' 
    },
    { 
      id: 'protein', 
      label: 'Protein', 
      icon: 'fitness-center', 
      color: '#4ECDC4', 
      gradient: ['#4ECDC4', '#6DE0D9'],
      unit: 'g' 
    },
    { 
      id: 'carbs', 
      label: 'Carbs', 
      icon: 'bakery-dining', 
      color: '#45B7D1', 
      gradient: ['#45B7D1', '#67C9E6'],
      unit: 'g' 
    },
    { 
      id: 'fat', 
      label: 'Fat', 
      icon: 'water-drop', 
      color: '#FFA07A', 
      gradient: ['#FFA07A', '#FFB899'],
      unit: 'g' 
    }
  ];

  useEffect(() => {
    loadProgressData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [selectedPeriod]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProgressData();
    setRefreshing(false);
  };

  const loadProgressData = async () => {
    if (!user) return;

    const entries = await DataService.getFoodEntries(user.id);
    const analyzedData = NutritionCalculator.analyzeProgress(entries);
    setProgressData(analyzedData);

    const totals = Object.values(analyzedData).reduce((acc, day) => ({
      calories: acc.calories + day.calories,
      protein: acc.protein + day.protein,
      carbs: acc.carbs + day.carbs,
      fat: acc.fat + day.fat
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    const daysCount = Object.keys(analyzedData).length || 1;
    setWeeklyTotals({
      calories: Math.round(totals.calories / daysCount),
      protein: Math.round(totals.protein / daysCount),
      carbs: Math.round(totals.carbs / daysCount),
      fat: Math.round(totals.fat / daysCount)
    });
  };

  const getChartData = (nutrient) => {
    const dates = Object.keys(progressData).slice(-7);
    const values = dates.map(date => progressData[date][nutrient]);
    
    const currentMetric = metrics.find(m => m.id === nutrient);
    
    return {
      labels: dates.map(date => {
        const dateObj = new Date(date);
        return `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
      }),
      datasets: [
        {
          data: values.length > 0 ? values : [0],
          color: () => currentMetric?.color || '#2e86de',
          strokeWidth: 3,
          withShadow: true
        }
      ]
    };
  };

  const getProgressChartData = () => {
    const goals = {
      calories: 2000,
      protein: 50,
      carbs: 250,
      fat: 70
    };

    const todayData = Object.values(progressData).pop() || { calories: 0, protein: 0, carbs: 0, fat: 0 };
    
    return {
      labels: ["Cal", "Pro", "Carb", "Fat"],
      data: [
        Math.min(todayData.calories / goals.calories, 1),
        Math.min(todayData.protein / goals.protein, 1),
        Math.min(todayData.carbs / goals.carbs, 1),
        Math.min(todayData.fat / goals.fat, 1)
      ],
      colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A']
    };
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: '#ffffff'
    },
    fillShadowGradient: '#2e86de',
    fillShadowGradientOpacity: 0.3,
  };

  const MetricCard = ({ metric, value, progress, trend }) => {
    const currentMetric = metrics.find(m => m.id === metric);
    
    return (
      <TouchableOpacity 
        style={[
          styles.metricCard,
          activeMetric === metric && styles.metricCardActive
        ]}
        onPress={() => setActiveMetric(metric)}
      >
        <View style={styles.metricHeader}>
          <View style={[styles.metricIcon, { backgroundColor: currentMetric?.color }]}>
            <Icon name={currentMetric?.icon} size={18} color="white" />
          </View>
          <View style={styles.metricTextContainer}>
            <Text style={styles.metricLabel}>{currentMetric?.label}</Text>
            <Text style={styles.metricValue}>
              {value}{currentMetric?.unit}
            </Text>
          </View>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress</Text>
            <View style={styles.trendContainer}>
              <Icon 
                name={trend > 0 ? "trending-up" : "trending-down"} 
                size={14} 
                color={trend > 0 ? '#4ECDC4' : '#FF6B6B'} 
              />
              <Text style={[
                styles.trendText,
                { color: trend > 0 ? '#4ECDC4' : '#FF6B6B' }
              ]}>
                {trend > 0 ? '+' : ''}{trend}%
              </Text>
            </View>
          </View>
          
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { 
                  width: `${progress}%`,
                  backgroundColor: currentMetric?.color
                }
              ]} 
            />
          </View>
          
          <Text style={styles.progressText}>{progress}% of goal</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const PeriodSelector = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.periodSelectorContainer}
    >
      <View style={styles.periodSelector}>
        {periods.map((period) => (
          <TouchableOpacity
            key={period.id}
            style={[
              styles.periodButton,
              selectedPeriod === period.id && styles.periodButtonActive
            ]}
            onPress={() => setSelectedPeriod(period.id)}
          >
            <Icon 
              name={period.icon} 
              size={16} 
              color={selectedPeriod === period.id ? 'white' : '#2e86de'} 
            />
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === period.id && styles.periodButtonTextActive
            ]}>
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const CircularProgress = ({ progress, color, size = 80 }) => {
    const circumference = 2 * Math.PI * (size / 2 - 5);
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <View style={[styles.circularProgress, { width: size, height: size }]}>
        <View style={[styles.circleBackground, { width: size, height: size }]} />
        <View 
          style={[
            styles.circleProgress,
            { 
              width: size, 
              height: size,
              borderColor: color,
              transform: [{ rotate: '-90deg' }]
            }
          ]} 
        />
        <View style={styles.circleText}>
          <Text style={styles.circleProgressText}>{progress}%</Text>
        </View>
      </View>
    );
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#2e86de']}
            tintColor="#2e86de"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerBackground} />
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Nutrition Analytics</Text>
              <Text style={styles.subtitle}>Track your health journey</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={[
                  styles.chartToggle,
                  chartType === 'line' && styles.chartToggleActive
                ]}
                onPress={() => setChartType('line')}
              >
                <Icon name="show-chart" size={20} color={chartType === 'line' ? 'white' : '#2e86de'} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.chartToggle,
                  chartType === 'bar' && styles.chartToggleActive
                ]}
                onPress={() => setChartType('bar')}
              >
                <Icon name="bar-chart" size={20} color={chartType === 'bar' ? 'white' : '#2e86de'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Period Selector */}
        <View style={styles.section}>
          <PeriodSelector />
        </View>

        {/* Key Metrics Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.metricsScrollView}
          >
            <View style={styles.metricsGrid}>
              {metrics.map((metric, index) => (
                <MetricCard
                  key={metric.id}
                  metric={metric.id}
                  value={weeklyTotals[metric.id] || 0}
                  progress={Math.min(Math.round((weeklyTotals[metric.id] / 
                    (metric.id === 'calories' ? 2000 : 
                     metric.id === 'protein' ? 50 : 
                     metric.id === 'carbs' ? 250 : 70)) * 100), 100)}
                  trend={[5.2, 3.1, -2.4, 1.8][index]}
                />
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Progress Rings Section */}
        <View style={styles.section}>
          <View style={styles.progressRingsCard}>
            <Text style={styles.progressTitle}>Daily Goals Progress</Text>
            <Text style={styles.progressSubtitle}>Today's completion rate</Text>
            
            <View style={styles.progressRingsContainer}>
              {metrics.map((metric, index) => {
                const progress = Math.min(Math.round((weeklyTotals[metric.id] / 
                  (metric.id === 'calories' ? 2000 : 
                   metric.id === 'protein' ? 50 : 
                   metric.id === 'carbs' ? 250 : 70)) * 100), 100);
                
                return (
                  <View key={metric.id} style={styles.progressRingItem}>
                    <CircularProgress 
                      progress={progress} 
                      color={metric.color}
                      size={70}
                    />
                    <View style={styles.ringLabelContainer}>
                      <Text style={styles.ringLabel}>{metric.label}</Text>
                      <Text style={styles.ringValue}>{progress}%</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Main Chart */}
        <View style={styles.section}>
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View>
                <Text style={styles.chartTitle}>
                  {metrics.find(m => m.id === activeMetric)?.label} Trend
                </Text>
                <Text style={styles.chartSubtitle}>Last 7 days performance</Text>
              </View>
              <View style={styles.chartMetrics}>
                {metrics.map(metric => (
                  <TouchableOpacity
                    key={metric.id}
                    style={[
                      styles.metricButton,
                      activeMetric === metric.id && styles.metricButtonActive
                    ]}
                    onPress={() => setActiveMetric(metric.id)}
                  >
                    <View style={[styles.metricDot, { backgroundColor: metric.color }]} />
                    <Text style={[
                      styles.metricButtonText,
                      activeMetric === metric.id && styles.metricButtonTextActive
                    ]}>
                      {metric.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {Object.keys(progressData).length > 0 ? (
              <View style={styles.chartContainer}>
                {chartType === 'line' ? (
                  <LineChart
                    data={getChartData(activeMetric)}
                    width={screenWidth - 60}
                    height={240}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chart}
                    withVerticalLines={true}
                    withHorizontalLines={true}
                    withShadow={true}
                    segments={5}
                    fromZero={true}
                  />
                ) : (
                  <BarChart
                    data={getChartData(activeMetric)}
                    width={screenWidth - 60}
                    height={240}
                    chartConfig={chartConfig}
                    style={styles.chart}
                    showValuesOnTopOfBars={true}
                    fromZero={true}
                  />
                )}
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <View style={styles.noDataIcon}>
                  <Icon name="analytics" size={48} color="#e9ecef" />
                </View>
                <Text style={styles.noDataText}>No data available yet</Text>
                <Text style={styles.noDataSubtext}>Start tracking your meals to see progress insights</Text>
              </View>
            )}
          </View>
        </View>

        {/* AI Insights Section */}
        <View style={styles.section}>
          <View style={styles.insightsCard}>
            <View style={styles.insightsHeader}>
              <View style={styles.insightsIcon}>
                <Icon name="insights" size={24} color="#2e86de" />
              </View>
              <View>
                <Text style={styles.insightsTitle}>AI Insights</Text>
                <Text style={styles.insightsSubtitle}>Personalized recommendations</Text>
              </View>
            </View>
            
            <View style={styles.insightsContent}>
              <View style={styles.insightItem}>
                <View style={[styles.insightIcon, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                  <Icon name="thumb-up" size={18} color="#4CAF50" />
                </View>
                <View style={styles.insightText}>
                  <Text style={styles.insightTitle}>Excellent Protein Intake</Text>
                  <Text style={styles.insightDescription}>
                    You're meeting up with your daily protein goal. Great for your health maintenance!
                  </Text>
                </View>
              </View>
              
              <View style={styles.insightItem}>
                <View style={[styles.insightIcon, { backgroundColor: 'rgba(255, 152, 0, 0.1)' }]}>
                  <Icon name="warning" size={18} color="#FF9800" />
                </View>
                <View style={styles.insightText}>
                  <Text style={styles.insightTitle}>Balance Your Carbs</Text>
                  <Text style={styles.insightDescription}>
                    Consider adding more complex carbs like whole grains for sustained energy
                  </Text>
                </View>
              </View>
              
              <View style={styles.insightItem}>
                <View style={[styles.insightIcon, { backgroundColor: 'rgba(33, 150, 243, 0.1)' }]}>
                  <Icon name="trending-up" size={18} color="#2196F3" />
                </View>
                <View style={styles.insightText}>
                  <Text style={styles.insightTitle}>Consistency Improved</Text>
                  <Text style={styles.insightDescription}>
                    Your tracking consistency increased this week. Keep it up!
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 8,
    overflow: 'hidden',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 4,
  },
  chartToggle: {
    padding: 8,
    borderRadius: 12,
    marginHorizontal: 2,
  },
  chartToggleActive: {
    backgroundColor: '#2e86de',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
    marginLeft: 4,
  },
  periodSelectorContainer: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  periodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    backgroundColor: '#f8f9fa',
  },
  periodButtonActive: {
    backgroundColor: '#2e86de',
    shadowColor: '#2e86de',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
    marginLeft: 6,
  },
  periodButtonTextActive: {
    color: 'white',
  },
  metricsScrollView: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    paddingRight: 20,
  },
  metricCard: {
    width: 280,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  metricCardActive: {
    borderColor: '#2e86de',
    shadowColor: '#2e86de',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    transform: [{ scale: 1.02 }],
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  metricTextContainer: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
  progressRingsCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 24,
  },
  progressRingsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  progressRingItem: {
    alignItems: 'center',
    width: '48%',
    marginBottom: 20,
  },
  circularProgress: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBackground: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: '#f8f9fa',
  },
  circleProgress: {
    position: 'absolute',
    borderRadius: 50,
    borderWidth: 4,
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: 'transparent',
  },
  circleText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleProgressText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  ringLabelContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  ringLabel: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
    marginBottom: 2,
  },
  ringValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  chartHeader: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  chartMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  metricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  metricButtonActive: {
    backgroundColor: '#2e86de',
    borderColor: '#2e86de',
  },
  metricDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  metricButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6c757d',
  },
  metricButtonTextActive: {
    color: 'white',
  },
  chartContainer: {
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noDataIcon: {
    marginBottom: 16,
  },
  noDataText: {
    fontSize: 18,
    color: '#6c757d',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
  insightsCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  insightsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(46, 134, 222, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  insightsSubtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  insightsContent: {
    // Space for insights content
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    flexShrink: 0,
  },
  insightText: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  insightDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
});