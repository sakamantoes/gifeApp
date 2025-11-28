// Mock AI nutrition data - In real app, connect to nutrition API
const NUTRITION_DATABASE = {
  'apple': { calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  'banana': { calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  'chicken breast': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  'rice': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  'eggs': { calories: 155, protein: 13, carbs: 1.1, fat: 11 },
  'bread': { calories: 265, protein: 9, carbs: 49, fat: 3.2 },
  'milk': { calories: 42, protein: 3.4, carbs: 5, fat: 1 },
  'yogurt': { calories: 59, protein: 3.5, carbs: 4.7, fat: 3.3 },
  'pasta': { calories: 131, protein: 5, carbs: 25, fat: 1 },
  'salmon': { calories: 208, protein: 20, carbs: 0, fat: 13 },
  'broccoli': { calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
  'spinach': { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
};

export class NutritionCalculator {
  static calculateNutrition(foodName, quantity = 1) {
    const food = foodName.toLowerCase();
    const baseNutrition = NUTRITION_DATABASE[food] || {
      calories: 100,
      protein: 5,
      carbs: 15,
      fat: 3
    };

    return {
      calories: Math.round(baseNutrition.calories * quantity),
      protein: Math.round(baseNutrition.protein * quantity * 10) / 10,
      carbs: Math.round(baseNutrition.carbs * quantity * 10) / 10,
      fat: Math.round(baseNutrition.fat * quantity * 10) / 10
    };
  }

  static getAIRecommendations(currentNutrition, goals) {
    // Ensure goals exist, use defaults if not
    const safeGoals = goals || {
      calories: 2000,
      protein: 50,
      carbs: 250,
      fat: 70
    };

    const recommendations = [];
    
    if (currentNutrition.calories < safeGoals.calories * 0.8) {
      recommendations.push("Consider adding a healthy snack to meet your calorie goals");
    }
    
    if (currentNutrition.protein < safeGoals.protein * 0.7) {
      recommendations.push("Your protein intake is low. Add lean protein sources like chicken, fish, or legumes");
    }
    
    if (currentNutrition.carbs > safeGoals.carbs * 1.2) {
      recommendations.push("Your carb intake is high. Consider balancing with more protein and vegetables");
    }
    
    if (currentNutrition.fat > safeGoals.fat * 1.3) {
      recommendations.push("Monitor your fat intake. Try incorporating more lean proteins and vegetables");
    }

    if (recommendations.length === 0) {
      recommendations.push("Great job! Your nutrition is well balanced. Keep it up!");
    }

    return recommendations;
  }

  static analyzeProgress(entries) {
    const weeklyData = {};
    const last7Days = entries.slice(-7);
    
    last7Days.forEach(entry => {
      const date = new Date(entry.timestamp).toDateString();
      if (!weeklyData[date]) {
        weeklyData[date] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }
      
      weeklyData[date].calories += entry.calories;
      weeklyData[date].protein += entry.protein;
      weeklyData[date].carbs += entry.carbs;
      weeklyData[date].fat += entry.fat;
    });

    return weeklyData;
  }
}