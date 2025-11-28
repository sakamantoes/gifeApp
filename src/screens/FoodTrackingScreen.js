import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../services/AuthContext';
import DataService from '../services/DataService';
import { NutritionCalculator } from '../utils/NutritionCalculator';

const { width } = Dimensions.get('window');

export default function FoodTrackingScreen({ navigation }) {
  const { user } = useAuth();
  const [foodName, setFoodName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [mealType, setMealType] = useState('breakfast');
  const [nutritionInfo, setNutritionInfo] = useState(null);
  const [recentFoods, setRecentFoods] = useState([]);
  const [showCalculator, setShowCalculator] = useState(false);

  useEffect(() => {
    loadRecentFoods();
  }, []);

  const loadRecentFoods = async () => {
    if (!user) return;
    const entries = await DataService.getFoodEntries(user.id);
    const uniqueFoods = [...new Map(entries.map(item => [item.foodName, item])).values()];
    setRecentFoods(uniqueFoods.slice(0, 8));
  };

  const calculateNutrition = () => {
    if (!foodName.trim()) {
      Alert.alert('Error', 'Please enter a food name');
      return;
    }

    const qty = parseFloat(quantity) || 1;
    const nutrition = NutritionCalculator.calculateNutrition(foodName, qty);
    setNutritionInfo(nutrition);
    setShowCalculator(true);
  };

  const saveFoodEntry = async () => {
    if (!nutritionInfo) return;

    const foodData = {
      foodName: foodName.trim(),
      quantity: parseFloat(quantity) || 1,
      mealType,
      ...nutritionInfo
    };

    await DataService.addFoodEntry(user.id, foodData);
    
    Alert.alert('Success', 'Food entry saved successfully!', [
      { 
        text: 'OK', 
        onPress: () => {
          setFoodName('');
          setQuantity('1');
          setNutritionInfo(null);
          setShowCalculator(false);
          loadRecentFoods();
        }
      }
    ]);
  };

  const quickAddFood = (food) => {
    setFoodName(food.foodName);
    const nutrition = NutritionCalculator.calculateNutrition(food.foodName, 1);
    setNutritionInfo(nutrition);
    setShowCalculator(true);
  };

  const getMealTypeIcon = (type) => {
    const icons = {
      breakfast: 'free-breakfast',
      lunch: 'lunch-dining',
      dinner: 'dinner-dining',
      snack: 'local-cafe'
    };
    return icons[type] || 'restaurant';
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.headerCard}>
          <View style={styles.headerContent}>
            <Icon name="restaurant" size={32} color="#2e86de" />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Track Your Meal</Text>
              <Text style={styles.headerSubtitle}>Log your food and track nutrition</Text>
            </View>
          </View>
        </View>

        {/* Food Input Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Add Food Entry</Text>
            <Icon name="edit" size={20} color="#6c757d" />
          </View>
          
          <TextInput
            style={styles.input}
            placeholder="What did you eat? (e.g. Rice)"
            placeholderTextColor="#9aa0a6"
            value={foodName}
            onChangeText={setFoodName}
          />
          
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Quantity</Text>
              <View style={styles.quantityContainer}>
                <TextInput
                  style={styles.quantityInput}
                  placeholder="1"
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.quantityUnit}>serving(s)</Text>
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Meal Type</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.mealScroll}
              >
                <View style={styles.mealButtons}>
                  {['breakfast', 'lunch', 'dinner', 'snack'].map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.mealButton,
                        mealType === type && styles.mealButtonActive
                      ]}
                      onPress={() => setMealType(type)}
                    >
                      <Icon 
                        name={getMealTypeIcon(type)} 
                        size={16} 
                        color={mealType === type ? 'white' : '#6c757d'} 
                      />
                      <Text 
                        style={[
                          styles.mealButtonText,
                          mealType === type && styles.mealButtonTextActive
                        ]}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>

          <TouchableOpacity 
            style={[
              styles.calculateButton,
              !foodName.trim() && styles.calculateButtonDisabled
            ]}
            onPress={calculateNutrition}
            disabled={!foodName.trim()}
          >
            <Icon name="calculate" size={20} color="white" />
            <Text style={styles.calculateButtonText}>Calculate Nutrition</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Foods */}
        {recentFoods.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Recent Foods</Text>
              <Icon name="history" size={20} color="#6c757d" />
            </View>
            <View style={styles.recentFoodsGrid}>
              {recentFoods.map((food, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.recentFoodItem}
                  onPress={() => quickAddFood(food)}
                >
                  <View style={styles.recentFoodIcon}>
                    <Icon name="fastfood" size={16} color="#2e86de" />
                  </View>
                  <Text style={styles.recentFoodName} numberOfLines={1}>
                    {food.foodName}
                  </Text>
                  <View style={styles.recentFoodCalories}>
                    <Text style={styles.caloriesText}>{food.calories} cal</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Quick Tips */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Icon name="lightbulb" size={20} color="#ff9f43" />
            <Text style={styles.tipsTitle}>Quick Tips</Text>
          </View>
          <View style={styles.tipsContent}>
            <Text style={styles.tipText}>
              • Be specific with food names for accurate nutrition data
            </Text>
            <Text style={styles.tipText}>
              • Adjust quantity for precise tracking
            </Text>
            <Text style={styles.tipText}>
              • Use recent foods for quick logging
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Nutrition Calculator Modal */}
      <Modal
        visible={showCalculator}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Icon name="nutrition" size={24} color="#2e86de" />
                <Text style={styles.modalTitle}>Nutrition Details</Text>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowCalculator(false)}
              >
                <Icon name="close" size={24} color="#6c757d" />
              </TouchableOpacity>
            </View>

            {nutritionInfo && (
              <View style={styles.modalBody}>
                <View style={styles.foodHeader}>
                  <Icon name="check-circle" size={24} color="#10ac84" />
                  <View style={styles.foodInfo}>
                    <Text style={styles.foodName}>{foodName}</Text>
                    <Text style={styles.quantity}>
                      {quantity} serving{parseFloat(quantity) !== 1 ? 's' : ''} • {mealType}
                    </Text>
                  </View>
                </View>

                {/* Nutrition Cards */}
                <View style={styles.nutritionCards}>
                  <View style={[styles.nutritionCard, styles.caloriesCard]}>
                    <Text style={styles.nutritionValue}>{nutritionInfo.calories}</Text>
                    <Text style={styles.nutritionLabel}>Calories</Text>
                    <Icon name="local-fire-department" size={20} color="#e74c3c" style={styles.nutritionIcon} />
                  </View>

                  <View style={styles.macrosRow}>
                    <View style={[styles.nutritionCard, styles.proteinCard]}>
                      <Text style={styles.nutritionValue}>{nutritionInfo.protein}g</Text>
                      <Text style={styles.nutritionLabel}>Protein</Text>
                      <Icon name="fitness-center" size={16} color="#2e86de" style={styles.nutritionIcon} />
                    </View>

                    <View style={[styles.nutritionCard, styles.carbsCard]}>
                      <Text style={styles.nutritionValue}>{nutritionInfo.carbs}g</Text>
                      <Text style={styles.nutritionLabel}>Carbs</Text>
                      <Icon name="grass" size={16} color="#10ac84" style={styles.nutritionIcon} />
                    </View>

                    <View style={[styles.nutritionCard, styles.fatCard]}>
                      <Text style={styles.nutritionValue}>{nutritionInfo.fat}g</Text>
                      <Text style={styles.nutritionLabel}>Fat</Text>
                      <Icon name="water-drop" size={16} color="#ff9f43" style={styles.nutritionIcon} />
                    </View>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => setShowCalculator(false)}
                  >
                    <Icon name="arrow-back" size={18} color="#6c757d" />
                    <Text style={styles.cancelButtonText}>Back</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.saveButton}
                    onPress={saveFoodEntry}
                  >
                    <Icon name="save" size={18} color="white" />
                    <Text style={styles.saveButtonText}>Save Entry</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  // Header Styles
  headerCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  // Card Styles
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
  // Input Styles
  input: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    fontSize: 16,
    color: '#2c3e50',
  },
  inputRow: {
    gap: 16,
  },
  inputGroup: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 12,
  },
  quantityInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  quantityUnit: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 8,
  },
  mealScroll: {
    flexGrow: 0,
  },
  mealButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  mealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    gap: 6,
  },
  mealButtonActive: {
    backgroundColor: '#2e86de',
    borderColor: '#2e86de',
  },
  mealButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6c757d',
  },
  mealButtonTextActive: {
    color: 'white',
  },
  // Button Styles
  calculateButton: {
    flexDirection: 'row',
    backgroundColor: '#2e86de',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  calculateButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  calculateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Recent Foods Styles
  recentFoodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  recentFoodItem: {
    width: (width - 72) / 2,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  recentFoodIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(46, 134, 222, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentFoodName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  recentFoodCalories: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  caloriesText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#e74c3c',
  },
  // Tips Card
  tipsCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  tipsContent: {
    gap: 6,
  },
  tipText: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  foodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  quantity: {
    fontSize: 14,
    color: '#6c757d',
  },
  // Nutrition Cards
  nutritionCards: {
    gap: 16,
    marginBottom: 24,
  },
  nutritionCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  caloriesCard: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    alignItems: 'center',
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 12,
  },
  proteinCard: {
    flex: 1,
    backgroundColor: 'rgba(46, 134, 222, 0.1)',
    alignItems: 'center',
  },
  carbsCard: {
    flex: 1,
    backgroundColor: 'rgba(16, 172, 132, 0.1)',
    alignItems: 'center',
  },
  fatCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 159, 67, 0.1)',
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6c757d',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nutritionIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  // Modal Actions
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#10ac84',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelButtonText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});