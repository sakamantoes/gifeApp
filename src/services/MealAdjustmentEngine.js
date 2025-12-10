export class MealAdjustmentEngine {
  constructor() {
    this.mealTemplates = {
      balanced_breakfast: {
        name: 'Balanced Breakfast',
        components: {
          protein: ['eggs', 'greek yogurt', 'protein shake'],
          carb: ['oats', 'whole grain bread', 'fruit'],
          fat: ['nuts', 'avocado', 'nut butter'],
          vegetable: ['spinach', 'tomato', 'bell pepper']
        },
        calorie_range: { min: 300, max: 500 },
        protein_range: { min: 20, max: 30 }
      },
      light_lunch: {
        name: 'Light & Nutritious Lunch',
        components: {
          protein: ['grilled chicken', 'salmon', 'lentils'],
          carb: ['quinoa', 'sweet potato', 'brown rice'],
          vegetable: ['mixed salad', 'steamed veggies', 'soup'],
          fat: ['olive oil dressing', 'avocado', 'seeds']
        },
        calorie_range: { min: 400, max: 600 },
        fiber_goal: 8
      },
      healthy_dinner: {
        name: 'Healthy Dinner',
        components: {
          protein: ['fish', 'tofu', 'lean meat'],
          carb: ['small portion grains', 'extra vegetables'],
          vegetable: ['double portion', 'variety of colors'],
          fat: ['moderate healthy fats']
        },
        calorie_range: { min: 450, max: 650 },
        recommendation: 'Eat 3+ hours before bed'
      },
      smart_snack: {
        name: 'Smart Snack',
        components: {
          protein: ['string cheese', 'handful nuts', 'hard boiled egg'],
          fiber: ['apple', 'carrot sticks', 'berries'],
          combo: ['apple + peanut butter', 'yogurt + berries']
        },
        calorie_range: { min: 100, max: 200 },
        timing: 'Between meals to maintain energy'
      }
    };
    
    this.swapSuggestions = {
      high_calorie: {
        from: ['white bread', 'regular pasta', 'fried foods', 'sugary drinks'],
        to: ['whole grain bread', 'zucchini noodles', 'grilled/baked', 'water/herbal tea'],
        calorie_reduction: 150
      },
      low_protein: {
        from: ['cereal alone', 'plain salad', 'fruit snack'],
        to: ['cereal + milk', 'salad + chicken', 'fruit + yogurt'],
        protein_increase: 15
      },
      low_fiber: {
        from: ['white rice', 'juice', 'mashed potatoes'],
        to: ['brown rice/quinoa', 'whole fruit', 'sweet potato with skin'],
        fiber_increase: 5
      }
    };
  }
  
  suggestMealAdjustments(currentMeal, userGoals, imbalances) {
    const adjustments = [];
    
    // 1. Check for missing components
    const missingComponents = this.identifyMissingComponents(currentMeal);
    if (missingComponents.length > 0) {
      adjustments.push({
        type: 'ADD_COMPONENTS',
        message: `Add to your meal: ${missingComponents.join(', ')}`,
        examples: this.getComponentExamples(missingComponents),
        benefit: 'More balanced nutrition and sustained energy'
      });
    }
    
    // 2. Portion adjustment based on goals
    if (userGoals.goal === 'weight_loss' && currentMeal.calories > 600) {
      adjustments.push({
        type: 'REDUCE_PORTION',
        message: 'Consider smaller portion size for weight loss',
        current: `${currentMeal.calories} calories`,
        target: '400-500 calories',
        tip: 'Use smaller plate, eat slowly, drink water first'
      });
    }
    
    // 3. Timing adjustment
    const mealTime = new Date(currentMeal.timestamp).getHours();
    if (mealTime > 21) { // Eating after 9 PM
      adjustments.push({
        type: 'TIMING_ADJUSTMENT',
        message: 'Eating late may affect sleep and digestion',
        suggestion: 'Try eating dinner before 8 PM',
        alternative: 'If hungry late, try herbal tea or small protein snack'
      });
    }
    
    // 4. Specific nutrient adjustments based on imbalances
    imbalances.forEach(imbalance => {
      const specificAdjustment = this.getNutrientSpecificAdjustment(imbalance.type, currentMeal);
      if (specificAdjustment) {
        adjustments.push(specificAdjustment);
      }
    });
    
    return adjustments;
  }
  
  identifyMissingComponents(meal) {
    const components = [];
    
    // Check for protein
    if (meal.protein < 15) {
      components.push('protein');
    }
    
    // Check for vegetables
    const vegKeywords = ['salad', 'vegetable', 'broccoli', 'spinach', 'carrot'];
    const hasVeg = vegKeywords.some(keyword => 
      meal.foodName.toLowerCase().includes(keyword)
    );
    if (!hasVeg) {
      components.push('vegetables');
    }
    
    // Check for fiber
    if (meal.fiber < 5) {
      components.push('fiber');
    }
    
    return components;
  }
  
  getComponentExamples(components) {
    const examples = {
      protein: ['chicken breast (31g protein)', 'eggs (12g protein)', 'lentils (9g protein)'],
      vegetables: ['side salad (50 cal)', 'steamed broccoli (30 cal)', 'carrot sticks (25 cal)'],
      fiber: ['apple with skin (4g fiber)', 'chia seeds (10g fiber)', 'beans (8g fiber)']
    };
    
    return components.map(comp => examples[comp] || []).flat();
  }
  
  getNutrientSpecificAdjustment(imbalanceType, currentMeal) {
    const adjustments = {
      LOW_PROTEIN: {
        type: 'INCREASE_PROTEIN',
        message: `This meal has only ${currentMeal.protein}g protein`,
        suggestion: 'Add a protein source',
        quickAdds: ['handful of nuts', 'hard boiled egg', 'scoop of protein powder']
      },
      HIGH_CARB_RATIO: {
        type: 'BALANCE_CARBS',
        message: 'High carb meal detected',
        suggestion: 'Add healthy fats or protein to slow digestion',
        examples: ['Add avocado to sandwich', 'Include nuts with pasta']
      },
      LOW_FOOD_DIVERSITY: {
        type: 'ADD_VARIETY',
        message: 'Try adding a different colored vegetable',
        challenge: 'Add one new color to your plate',
        colors: ['Red (tomatoes)', 'Purple (cabbage)', 'Orange (sweet potato)', 'Green (asparagus)']
      }
    };
    
    return adjustments[imbalanceType];
  }
  
  generateSmartSwaps(unhealthyItem) {
    for (const [category, swaps] of Object.entries(this.swapSuggestions)) {
      if (swaps.from.some(item => unhealthyItem.toLowerCase().includes(item))) {
        return {
          unhealthy: unhealthyItem,
          healthyOptions: swaps.to,
          benefit: `Saves ~${swaps.calorie_reduction} calories` || `Adds ~${swaps.protein_increase}g protein`,
          tip: 'Taste difference? Try gradually mixing with current choice'
        };
      }
    }
    return null;
  }
}