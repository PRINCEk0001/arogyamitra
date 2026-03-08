import Groq from 'groq-sdk';
import { GoogleGenAI } from '@google/genai';

const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
};

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const generateNutritionPlanAI = async (params: {
  targetCalories: number;
  targetProtein: number;
  dietaryRestrictions: string;
}) => {
  const prompt = `Generate a daily meal plan with:
  Target: ${params.targetCalories} kcal, ${params.targetProtein}g protein.
  Restrictions: ${params.dietaryRestrictions}.
  
  You MUST return ONLY a valid JSON object with exactly this structure, no markdown formatting or backticks around it:
  {
    "breakfast": { "name": "string", "calories": number, "macros": { "p": number, "c": number, "f": number } },
    "lunch": { "name": "string", "calories": number, "macros": { "p": number, "c": number, "f": number } },
    "dinner": { "name": "string", "calories": number, "macros": { "p": number, "c": number, "f": number } },
    "snack": { "name": "string", "calories": number, "macros": { "p": number, "c": number, "f": number } }
  }`;

  const groq = getGroqClient();
  if (groq) {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are a world-class nutrition expert. Return ONLY valid JSON.' },
          { role: 'user', content: prompt }
        ],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
      });
      return JSON.parse(completion.choices[0].message.content || '{}');
    } catch (e) {
      console.error('Groq Nutrition Error:', e);
      // Fall through to Gemini if Groq fails
    }
  }

  const gemini = getGeminiClient();
  if (gemini) {
    try {
      const response = await gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      const text = response.text || '{}';
      const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      console.error('Gemini Nutrition Error:', e);
      throw e;
    }
  }

  throw new Error('No AI service (Groq or Gemini) available in backend');
};

export const analyzeFoodMacroAI = async (foodQuery: string) => {
  const prompt = `Analyze this food query: "${foodQuery}"
  Return ONLY a valid JSON object estimating the nutritional value. The response must exactly match this structure:
  {
    "food": "The normalized name of the food (e.g., '1 Large Banana', '2 Scrambled Eggs')",
    "calories": number (total kcal),
    "protein": number (total grams),
    "carbs": number (total grams),
    "fat": number (total grams)
  }
  Do not include any other text, markdown, or explanations. Just the JSON object.`;

  const groq = getGroqClient();
  if (groq) {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are a precise nutritional calculator. Return ONLY valid JSON.' },
          { role: 'user', content: prompt }
        ],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
      });
      return JSON.parse(completion.choices[0].message.content || '{}');
    } catch (e) {
      console.error('Groq Macro Error:', e);
    }
  }

  const gemini = getGeminiClient();
  if (gemini) {
    try {
      const response = await gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      const text = response.text || '{}';
      const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      console.error('Gemini Macro Error:', e);
      throw e;
    }
  }

  throw new Error('No AI service available in backend');
};

export const generateWorkoutPlanAI = async (params: {
  goals: string;
  sleepHours: number;
  profile: any;
}) => {
  const prompt = `Generate a personalized workout plan for:
  Goals: ${params.goals}
  Sleep: ${params.sleepHours} hours
  User Profile: Age ${params.profile.age}, Weight ${params.profile.weight}kg, Activity ${params.profile.activityLevel}.
  
  You MUST return ONLY a valid JSON object with exactly this structure, no markdown formatting or backticks:
  {
    "title": "Workout Title",
    "duration": "Duration (e.g. 45 Min)",
    "intensity": "Intensity Level",
    "exercises": [
      { "name": "Exercise Name", "sets": number, "reps": "number or time" }
    ],
    "reason": "Brief explanation of why this plan was chosen"
  }`;

  const groq = getGroqClient();
  if (groq) {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are a professional fitness coach. Return ONLY valid JSON.' },
          { role: 'user', content: prompt }
        ],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
      });
      return JSON.parse(completion.choices[0].message.content || '{}');
    } catch (e) {
      console.error('Groq Workout Error:', e);
      // Fall through
    }
  }

  const gemini = getGeminiClient();
  if (gemini) {
    try {
      const response = await gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      const text = response.text || '{}';
      const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      console.error('Gemini Workout Error:', e);
      throw e;
    }
  }

  throw new Error('No AI service available in backend');
};

export const getAICoachResponse = async (params: {
  message: string;
  profile: any;
  stats: any;
  history: any[];
}) => {
  // Build a safe text-based history string instead of passing complex role objects 
  // which causes strict 400 errors with Groq and Gemini when roles are misaligned.
  const recentHistory = params.history.slice(-4);
  let historyText = "";
  if (recentHistory.length > 0) {
    historyText = "\n\n--- Recent Chat History ---\n";
    for (const h of recentHistory) {
      if (!h.text) continue;
      historyText += `${h.role === 'model' ? 'ArogyaMitra (You)' : 'User'}: ${h.text}\n`;
    }
  }

  const systemPrompt = `You are ArogyaMitra, an AI health coach. 
  You were developed and crafted by PRINCE KORI. 
  If anyone asks who created you or who is the developer, you must proudly state that you were developed by PRINCE KORI.
  User Profile: BMI ${params.stats.bmi} (${params.stats.category}), Goal: ${params.profile.goals}, Sleep: ${params.profile.sleepHours}h.
  Give short, actionable fitness advice. Do not provide medical diagnosis.
  ${historyText}`;

  const groq = getGroqClient();
  if (groq) {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: params.message }
        ],
        model: 'llama-3.3-70b-versatile',
      });
      return completion.choices[0].message.content;
    } catch (e: any) {
      console.error('Groq Chat Error:', e?.error?.error?.message || e.message);
      // Fall through to Gemini
    }
  }

  const gemini = getGeminiClient();
  if (gemini) {
    try {
      let conversation = systemPrompt + "\\n\\n--- Chat History ---\\n";
      for (const h of params.history) {
        conversation += `\${h.role === 'model' ? 'Coach' : 'User'}: \${h.text}\\n`;
      }
      conversation += `User: \${params.message}`;

      const response = await gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: conversation
      });
      return response.text;
    } catch (e) {
      console.error('Gemini Chat Error:', e);
    }
  }

  throw new Error('No AI service available in backend');
};

export const getHealthInsight = async (params: {
  profile: any;
  stats: any;
}) => {
  const prompt = `User Profile: Age ${params.profile.age}, Goal: ${params.profile.goal}. Stats: BMI ${params.stats.bmi} (${params.stats.category}), TDEE: ${params.stats.tdee}. Provide a concise, 2-sentence health summary for the user based on their metrics. Be encouraging.`;

  const groq = getGroqClient();
  if (groq) {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are a health coach.' },
          { role: 'user', content: prompt }
        ],
        model: 'llama-3.3-70b-versatile',
      });
      return completion.choices[0].message.content;
    } catch (e) {
      console.error('Groq Insight Error:', e);
    }
  }

  const gemini = getGeminiClient();
  if (gemini) {
    try {
      const response = await gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: "You are a health coach. " + prompt
      });
      return response.text;
    } catch (e) {
      console.error('Gemini Insight Error:', e);
    }
  }

  return 'Keep up the great work on your health journey!';
};

export const generateThematicImage = async (prompt: string) => {
  return null;
};
