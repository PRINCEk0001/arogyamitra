import express from 'express';
import { calculateHealthStats } from '../services/healthLogic.js';
import { generateNutritionPlanAI } from '../services/aiService.js';
import db from '../database/database.js';

const router = express.Router();

router.post('/plan', async (req, res) => {
  const { profile, userId } = req.body;

  if (!profile) {
    return res.status(400).json({ error: "Profile data is required" });
  }

  try {
    const stats = calculateHealthStats(profile);
    
    let targetCalories = stats.tdee;
    if (profile.goals === 'fat_loss') targetCalories -= 300;
    else if (profile.goals === 'muscle_gain') targetCalories += 300;

    const targetProtein = profile.weight * 1.8;

    const plan = await generateNutritionPlanAI({
      targetCalories,
      targetProtein,
      dietaryRestrictions: profile.dietaryRestrictions
    });

    if (userId) {
      const stmt = db.prepare(`
        INSERT INTO nutrition_plans (user_id, target_calories, target_protein, meals)
        VALUES (?, ?, ?, ?)
      `);
      stmt.run(userId, targetCalories, targetProtein, JSON.stringify(plan));
    }

    res.json({ ...plan, targetCalories, targetProtein });
  } catch (error) {
    console.error("Nutrition plan error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
