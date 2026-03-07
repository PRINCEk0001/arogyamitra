import { UserProfile, HealthStats, ChatMessage, MealPlan } from "../types";

export const generateThematicImage = async (prompt: string): Promise<string | null> => {
  // AI Image generation can be expensive/slow for this pass, 
  // keeping it as a stub or fetching a generic high-quality placeholder 
  // as per backend generateThematicImage (which returns null).
  return null;
};

export const generateNutritionPlanAI = async (params: {
  targetCalories: number;
  targetProtein: number;
  dietaryRestrictions: string;
}, token: string): Promise<MealPlan> => {
  const response = await fetch('/api/nutrition/plan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      profile: {
        goals: params.targetCalories > 2000 ? 'muscle_gain' : 'fat_loss',
        dietaryRestrictions: params.dietaryRestrictions,
        weight: params.targetProtein / 1.8 // Heuristic to satisfy backend type if needed
      }
    })
  });

  if (!response.ok) {
    throw new Error("Failed to generate nutrition plan from backend");
  }

  return response.json();
};

export const getAICoachResponse = async (params: {
  message: string;
  profile: UserProfile;
  stats: HealthStats;
  history: ChatMessage[];
}, token: string): Promise<string> => {
  const response = await fetch('/api/coach/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      message: params.message,
      profile: params.profile,
      stats: params.stats,
      history: params.history
    })
  });

  if (!response.ok) {
    throw new Error("Failed to get response from AI Coach");
  }

  const data = await response.json();
  return data.response;
};
