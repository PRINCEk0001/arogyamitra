import express from 'express';
import { generateWorkoutPlanAI } from '../services/aiService.js';
import { getExerciseVideo } from '../services/youtubeService.js';
import db from '../database/database.js';

const router = express.Router();

router.post('/plan', async (req, res) => {
  const { profile, userId } = req.body;

  if (!profile) {
    return res.status(400).json({ error: "Profile data is required" });
  }

  try {
    const workout = await generateWorkoutPlanAI({
      goals: profile.goals || profile.goal,
      sleepHours: profile.sleepHours,
      profile
    });

    // Fetch YouTube videos for each exercise
    if (workout.exercises && Array.isArray(workout.exercises)) {
      const exercisesWithVideos = await Promise.all(
        workout.exercises.map(async (exercise: any) => {
          const videoUrl = await getExerciseVideo(exercise.name);
          return { ...exercise, videoUrl };
        })
      );
      workout.exercises = exercisesWithVideos;
    }

    if (userId) {
      const stmt = db.prepare(`
        INSERT INTO workout_history (user_id, title, duration, intensity, exercises, reason)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(userId, workout.title, workout.duration, workout.intensity, JSON.stringify(workout.exercises), workout.reason);
    }

    res.json(workout);
  } catch (error) {
    console.error("Workout generation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
