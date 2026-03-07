import express from 'express';
import { calculateHealthStats } from '../services/healthLogic.js';
import { getAICoachResponse } from '../services/aiService.js';

const router = express.Router();

router.post('/chat', async (req, res) => {
  const { message, profile, history } = req.body;

  if (!message || !profile) {
    return res.status(400).json({ error: "Message and profile are required" });
  }

  try {
    const stats = calculateHealthStats(profile);
    const responseText = await getAICoachResponse({
      message,
      profile,
      stats,
      history: history || []
    });

    res.json({ response: responseText });
  } catch (error) {
    console.error("Coach chat error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
