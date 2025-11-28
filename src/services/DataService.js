import AsyncStorage from '@react-native-async-storage/async-storage';

class DataService {
  // Food entries
  async addFoodEntry(userId, foodData) {
    const entries = await this.getFoodEntries(userId);
    const newEntry = {
      id: Date.now().toString(),
      userId,
      ...foodData,
      timestamp: new Date().toISOString()
    };
    
    entries.push(newEntry);
    await AsyncStorage.setItem(`foodEntries_${userId}`, JSON.stringify(entries));
    return newEntry;
  }

  async getFoodEntries(userId) {
    const entries = await AsyncStorage.getItem(`foodEntries_${userId}`);
    return entries ? JSON.parse(entries) : [];
  }

  async getTodayFoodEntries(userId) {
    const entries = await this.getFoodEntries(userId);
    const today = new Date().toDateString();
    return entries.filter(entry => 
      new Date(entry.timestamp).toDateString() === today
    );
  }

  // User goals
  async setUserGoals(userId, goals) {
    await AsyncStorage.setItem(`userGoals_${userId}`, JSON.stringify(goals));
  }

  async getUserGoals(userId) {
    try {
      const goals = await AsyncStorage.getItem(`userGoals_${userId}`);
      if (goals) {
        return JSON.parse(goals);
      } else {
        // Return default goals if none exist
        const defaultGoals = {
          calories: 2000,
          protein: 50,
          carbs: 250,
          fat: 70
        };
        // Save default goals for first time
        await this.setUserGoals(userId, defaultGoals);
        return defaultGoals;
      }
    } catch (error) {
      console.error('Error getting user goals:', error);
      // Return default goals on error
      return {
        calories: 2000,
        protein: 50,
        carbs: 250,
        fat: 70
      };
    }
  }
}

export default new DataService();