export type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Goal = 'fat_loss' | 'muscle_gain' | 'maintenance';

export interface UserProfile {
  age: number;
  weight: number;
  height: number; // in cm
  gender: Gender;
  activityLevel: ActivityLevel;
  goals: Goal;
  dietaryRestrictions: string;
  sleepHours: number;
}

export interface HealthStats {
  bmi: number;
  bmr: number;
  tdee: number;
  category: string;
}

export interface Meal {
  name: string;
  calories: number;
  macros: {
    p: number;
    c: number;
    f: number;
  };
}

export interface MealPlan {
  targetCalories: number;
  targetProtein: number;
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  snack: Meal;
  imageUrl?: string;
}

export interface Workout {
  title: string;
  duration: string;
  intensity: 'Beginner' | 'Intermediate' | 'Advanced';
  exercises: { name: string; sets: number; reps: string; videoUrl?: string }[];
  imageUrl: string;
  recommendationReason?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface ProgressEntry {
  id: number;
  user_id: number;
  weight: number;
  bmi: number;
  workout_completed: boolean;
  date: string;
  notes?: string;
}

export interface VideoSuggestion {
  id: string;
  title: string;
  thumbnail: string;
  videoUrl: string;
  category: string;
  duration: string;
}

export interface DiscoverData {
  suggestions: VideoSuggestion[];
  thematicImage: string | null;
}
