export class TrendPredictionEngine {
  constructor() {
    this.trendPeriods = {
      SHORT: 7,    // 7 days for immediate trends
      MEDIUM: 30,  // 30 days for patterns
      LONG: 90     // 90 days for habits
    };
  }
  
  analyzeTrends(foodHistory, userGoals) {
    const trends = {
      calorieTrend: this.predictCalorieTrend(foodHistory, userGoals),
      macroTrends: this.predictMacroTrends(foodHistory, userGoals),
      mealPatternTrends: this.analyzeMealPatternTrends(foodHistory),
      weeklyCycle: this.detectWeeklyCycles(foodHistory),
      goalProgress: this.predictGoalProgress(foodHistory, userGoals)
    };
    
    return trends;
  }
  
  predictCalorieTrend(foodHistory, userGoals) {
    if (foodHistory.length < 7) return null;
    
    const last7Days = this.getLastNDays(foodHistory, 7);
    const previous7Days = this.getLastNDays(foodHistory, 14, 7);
    
    const currentAvg = this.averageCalories(last7Days);
    const previousAvg = this.averageCalories(previous7Days);
    
    const trend = currentAvg - previousAvg;
    const trendDirection = trend > 50 ? 'increasing' : trend < -50 ? 'decreasing' : 'stable';
    
    // Predict next 7 days
    const prediction = this.simpleLinearPrediction(
      [previousAvg, currentAvg],
      7
    );
    
    const distanceToGoal = userGoals.calories - prediction;
    
    return {
      currentAverage: Math.round(currentAvg),
      previousAverage: Math.round(previousAvg),
      trend: Math.round(trend),
      direction: trendDirection,
      prediction: Math.round(prediction),
      daysToGoal: distanceToGoal > 0 ? 
        `At current rate, you'll reach goal in ${Math.round((userGoals.calories - currentAvg) / Math.abs(trend))} days` :
        'On track with goal',
      recommendation: this.getCalorieTrendRecommendation(trend, distanceToGoal, userGoals.goal)
    };
  }
  
  predictMacroTrends(foodHistory, userGoals) {
    const trends = {};
    const macros = ['protein', 'carbs', 'fat'];
    
    macros.forEach(macro => {
      const last7Days = this.getLastNDays(foodHistory, 7);
      const dailyMacros = last7Days.map(day => day[macro] || 0);
      
      if (dailyMacros.length >= 3) {
        const avg = this.average(dailyMacros);
        const stdDev = this.standardDeviation(dailyMacros);
        const consistency = stdDev / avg; // Lower = more consistent
        
        const goal = userGoals[macro];
        const deviation = ((avg - goal) / goal) * 100;
        
        trends[macro] = {
          average: Math.round(avg),
          goal: goal,
          deviation: Math.round(deviation),
          consistency: consistency < 0.2 ? 'Consistent' : consistency < 0.4 ? 'Moderate' : 'Variable',
          trend: this.calculateSlope(dailyMacros),
          suggestion: this.getMacroSuggestion(macro, deviation, goal)
        };
      }
    });
    
    return trends;
  }
  
  analyzeMealPatternTrends(foodHistory) {
    const patterns = {
      breakfastConsistency: this.analyzeMealConsistency(foodHistory, 'breakfast'),
      lunchTiming: this.analyzeMealTiming(foodHistory, 'lunch'),
      dinnerSize: this.analyzeDinnerPattern(foodHistory),
      snackPattern: this.analyzeSnackPattern(foodHistory)
    };
    
    return patterns;
  }
  
  detectWeeklyCycles(foodHistory) {
    const weeklyData = this.groupByDayOfWeek(foodHistory);
    const cycles = {};
    
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].forEach(day => {
      const dayData = weeklyData[day];
      if (dayData && dayData.length > 0) {
        const avgCalories = this.averageCalories(dayData);
        const avgProtein = this.average(dayData.map(d => d.protein || 0));
        
        cycles[day] = {
          averageCalories: Math.round(avgCalories),
          averageProtein: Math.round(avgProtein),
          isHighDay: avgCalories > this.averageCalories(foodHistory) * 1.1,
          isLowDay: avgCalories < this.averageCalories(foodHistory) * 0.9,
          pattern: this.getDayPattern(dayData)
        };
      }
    });
    
    // Detect weekend effect
    const weekdayAvg = this.average(
      ['Monday','Tuesday','Wednesday','Thursday','Friday']
        .map(day => cycles[day]?.averageCalories || 0)
        .filter(val => val > 0)
    );
    
    const weekendAvg = this.average(
      ['Saturday','Sunday']
        .map(day => cycles[day]?.averageCalories || 0)
        .filter(val => val > 0)
    );
    
    cycles.weekendEffect = weekendAvg > weekdayAvg * 1.15 ? {
      detected: true,
      difference: Math.round(((weekendAvg - weekdayAvg) / weekdayAvg) * 100),
      suggestion: 'Weekend eating is higher. Try planning one healthy weekend meal.'
    } : { detected: false };
    
    return cycles;
  }
  
  predictGoalProgress(foodHistory, userGoals) {
    const last30Days = this.getLastNDays(foodHistory, 30);
    if (last30Days.length < 14) return null;
    
    const currentWeight = userGoals.weight;
    const goalWeight = userGoals.targetWeight;
    
    if (!currentWeight || !goalWeight) return null;
    
    // Simple weight prediction based on calorie deficit
    const avgCalorieDeficit = userGoals.calories - this.averageCalories(last30Days);
    const caloriesPerKg = 7700; // Calories to lose 1kg fat
    
    if (avgCalorieDeficit <= 0) return null;
    
    const kgPerWeek = (avgCalorieDeficit * 7) / caloriesPerKg;
    const weeksToGoal = (currentWeight - goalWeight) / kgPerWeek;
    
    return {
      currentWeight: currentWeight,
      goalWeight: goalWeight,
      predictedLossPerWeek: kgPerWeek.toFixed(2),
      weeksToGoal: Math.round(weeksToGoal),
      expectedDate: this.addWeeks(new Date(), weeksToGoal).toDateString(),
      confidence: this.calculatePredictionConfidence(last30Days),
      milestones: this.generateMilestones(currentWeight, goalWeight, kgPerWeek)
    };
  }
  
  // Helper methods
  getLastNDays(foodHistory, n, offset = 0) {
    const today = new Date();
    const cutoffDate = new Date(today);
    cutoffDate.setDate(cutoffDate.getDate() - (n + offset));
    
    return foodHistory.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      const startOffset = new Date(today);
      startOffset.setDate(startOffset.getDate() - offset);
      
      return entryDate >= cutoffDate && entryDate <= startOffset;
    });
  }
  
  averageCalories(entries) {
    if (!entries.length) return 0;
    const total = entries.reduce((sum, entry) => sum + (entry.calories || 0), 0);
    return total / entries.length;
  }
  
  simpleLinearPrediction(dataPoints, daysAhead) {
    if (dataPoints.length < 2) return dataPoints[0] || 0;
    
    // Simple linear regression
    const n = dataPoints.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = dataPoints.reduce((sum, y) => sum + y, 0);
    const sumXY = dataPoints.reduce((sum, y, i) => sum + (i * y), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX - sumX * sumX);
    return dataPoints[dataPoints.length - 1] + (slope * daysAhead);
  }
  
  getCalorieTrendRecommendation(trend, distanceToGoal, goalType) {
    if (goalType === 'weight_loss') {
      if (trend > 50) {
        return 'Calories trending up. For weight loss, aim to reverse this trend.';
      } else if (trend < -50) {
        return 'Good progress! Calories trending down.';
      }
    }
    return 'Calories stable. Continue monitoring.';
  }
  
  generateMilestones(current, goal, weeklyLoss) {
    const milestones = [];
    const totalToLose = current - goal;
    const kgPerMilestone = Math.max(1, Math.floor(totalToLose / 5));
    
    for (let i = 1; i * kgPerMilestone <= totalToLose; i++) {
      const milestoneKg = current - (i * kgPerMilestone);
      const weeksToMilestone = (i * kgPerMilestone) / weeklyLoss;
      
      milestones.push({
        milestone: `${milestoneKg}kg`,
        kgToLose: i * kgPerMilestone,
        weeksToReach: Math.round(weeksToMilestone),
        celebration: i === 1 ? 'First milestone!' : `Milestone ${i}`
      });
    }
    
    return milestones;
  }
}