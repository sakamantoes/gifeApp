export class AdvancedNutritionAnalyzer {
  constructor() {
    this.nutrientRanges = {
      // Based on Dietary Reference Intakes (DRI)
      protein_per_kg: { min: 0.8, max: 2.0, ideal: 1.2 },
      carb_ratio: { min: 0.45, max: 0.65, ideal: 0.5 },
      fat_ratio: { min: 0.20, max: 0.35, ideal: 0.3 },
      fiber_grams: { min: 25, max: 35, ideal: 30 },
      sugar_percent: { max: 10 }, // max 10% of calories from sugar
      sodium_mg: { max: 2300 },
      water_ml_per_kg: { min: 30 } // 30ml per kg body weight
    };
    
    this.nutrientSymptoms = {
      low_protein: ['fatigue', 'muscle loss', 'weak immune'],
      low_carbs: ['low energy', 'brain fog', 'mood swings'],
      low_fat: ['dry skin', 'hormone imbalance', 'vitamin deficiency'],
      low_fiber: ['digestive issues', 'constipation', 'high cholesterol'],
      high_sugar: ['energy crashes', 'weight gain', 'inflammation'],
      high_sodium: ['bloating', 'high blood pressure', 'thirst']
    };
  }
  
  detectImbalances(userData, foodHistory) {
    const imbalances = [];
    
    // 1. Protein Analysis
    const proteinPerKg = userData.totalProtein / userData.weight;
    if (proteinPerKg < this.nutrientRanges.protein_per_kg.min) {
      imbalances.push({
        type: 'LOW_PROTEIN',
        severity: 'HIGH',
        message: `Protein intake too low (${proteinPerKg.toFixed(1)}g/kg vs recommended ${this.nutrientRanges.protein_per_kg.min}g/kg)`,
        symptoms: this.nutrientSymptoms.low_protein,
        solutions: ['Add lean meat', 'Include eggs', 'Try Greek yogurt', 'Use protein powder'],
        foods: ['chicken breast', 'eggs', 'lentils', 'tofu', 'greek yogurt']
      });
    }
    
    // 2. Carb/Fat Balance Analysis
    const carbRatio = userData.totalCarbs / userData.totalCalories;
    const fatRatio = userData.totalFat / userData.totalCalories;
    
    if (carbRatio > this.nutrientRanges.carb_ratio.max) {
      imbalances.push({
        type: 'HIGH_CARB_RATIO',
        severity: 'MEDIUM',
        message: `High carb ratio (${Math.round(carbRatio * 100)}% vs ideal ${Math.round(this.nutrientRanges.carb_ratio.ideal * 100)}%)`,
        impact: 'May cause energy crashes and weight gain',
        adjustment: 'Replace some carbs with healthy fats or protein',
        examples: ['Swap rice for quinoa', 'Add avocado instead of bread']
      });
    }
    
    if (fatRatio < this.nutrientRanges.fat_ratio.min) {
      imbalances.push({
        type: 'LOW_FAT',
        severity: 'MEDIUM',
        message: `Low fat intake (${Math.round(fatRatio * 100)}% vs recommended ${Math.round(this.nutrientRanges.fat_ratio.min * 100)}%)`,
        symptoms: this.nutrientSymptoms.low_fat,
        solutions: ['Add nuts/seeds', 'Use olive oil', 'Include fatty fish'],
        foods: ['avocado', 'salmon', 'nuts', 'olive oil', 'chia seeds']
      });
    }
    
    // 3. Meal Timing Imbalance
    const mealPattern = this.analyzeMealPattern(foodHistory);
    if (mealPattern.gapExceeds4h) {
      imbalances.push({
        type: 'IRREGULAR_MEAL_TIMING',
        severity: 'LOW',
        message: 'Long gaps between meals detected',
        impact: 'May cause overeating and energy dips',
        recommendation: 'Try eating every 3-4 hours',
        idealSchedule: ['Breakfast: 8 AM', 'Lunch: 12 PM', 'Snack: 4 PM', 'Dinner: 7 PM']
      });
    }
    
    // 4. Food Diversity Score
    const diversityScore = this.calculateFoodDiversity(foodHistory);
    if (diversityScore < 0.6) {
      imbalances.push({
        type: 'LOW_FOOD_DIVERSITY',
        severity: 'MEDIUM',
        message: `Low food variety score: ${Math.round(diversityScore * 100)}%`,
        impact: 'May miss essential nutrients and vitamins',
        suggestion: 'Try incorporating more colorful vegetables and different protein sources',
        colorChallenge: ['Red (tomatoes)', 'Green (broccoli)', 'Orange (carrots)', 'Purple (eggplant)']
      });
    }
    
    return imbalances;
  }
  
  analyzeMealPattern(foodHistory) {
    const meals = foodHistory.map(f => new Date(f.timestamp));
    meals.sort((a, b) => a - b);
    
    let gapExceeds4h = false;
    for (let i = 1; i < meals.length; i++) {
      const gapHours = (meals[i] - meals[i-1]) / (1000 * 60 * 60);
      if (gapHours > 4) gapExceeds4h = true;
    }
    
    return {
      totalMeals: meals.length,
      gapExceeds4h,
      averageGap: meals.length > 1 ? 
        ((meals[meals.length-1] - meals[0]) / (1000 * 60 * 60 * (meals.length-1))).toFixed(1) : 0
    };
  }
  
  calculateFoodDiversity(foodHistory) {
    const uniqueFoods = [...new Set(foodHistory.map(f => f.foodName.toLowerCase()))];
    const categories = this.categorizeFoods(foodHistory);
    
    // Score based on unique foods and categories
    const maxExpected = 15; // Expect at least 15 different foods weekly
    const uniqueScore = Math.min(uniqueFoods.length / maxExpected, 1);
    
    // Category score (should have at least 4 food categories)
    const categoryScore = Math.min(Object.keys(categories).length / 5, 1);
    
    return (uniqueScore * 0.6 + categoryScore * 0.4);
  }
  
  categorizeFoods(foodHistory) {
    const categories = {
      protein: ['chicken', 'fish', 'eggs', 'meat', 'tofu', 'beans'],
      vegetable: ['broccoli', 'spinach', 'carrot', 'lettuce', 'pepper'],
      fruit: ['apple', 'banana', 'orange', 'berry', 'melon'],
      grain: ['rice', 'bread', 'pasta', 'oats', 'quinoa'],
      dairy: ['milk', 'yogurt', 'cheese']
    };
    
    const foundCategories = {};
    foodHistory.forEach(food => {
      const foodLower = food.foodName.toLowerCase();
      for (const [category, items] of Object.entries(categories)) {
        if (items.some(item => foodLower.includes(item))) {
          foundCategories[category] = (foundCategories[category] || 0) + 1;
        }
      }
    });
    
    return foundCategories;
  }
}