import express from 'express';
import { google } from 'googleapis';
import db from '../database/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const getOAuthClient = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.APP_URL}/api/calendar/auth/callback`
  );
};

router.get('/auth/url', authenticateToken, (req, res) => {
  const oauth2Client = getOAuthClient();
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.readonly'],
    state: (req as any).user.userId.toString(),
    prompt: 'consent'
  });
  res.json({ url });
});

router.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state) return res.status(400).send("Missing code or state");
  
  const userId = parseInt(state as string);
  const oauth2Client = getOAuthClient();

  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    
    // Store tokens in DB
    const stmt = db.prepare(`
      INSERT INTO google_tokens (user_id, access_token, refresh_token, expiry_date)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        access_token = excluded.access_token,
        refresh_token = COALESCE(excluded.refresh_token, google_tokens.refresh_token),
        expiry_date = excluded.expiry_date
    `);
    stmt.run(userId, tokens.access_token, tokens.refresh_token, tokens.expiry_date);

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'CALENDAR_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Calendar connected successfully! Closing window...</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Calendar OAuth Error:", error);
    res.status(500).send("Failed to connect calendar");
  }
});

router.get('/events', authenticateToken, async (req, res) => {
  const userId = (req as any).user.userId;
  const tokenData = db.prepare('SELECT * FROM google_tokens WHERE user_id = ?').get(userId) as any;

  if (!tokenData) {
    return res.status(401).json({ error: "Calendar not connected" });
  }

  const auth = getOAuthClient();
  auth.setCredentials({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expiry_date: tokenData.expiry_date
  });

  // Check if token is expired and refresh if needed
  if (tokenData.expiry_date && Date.now() > tokenData.expiry_date && tokenData.refresh_token) {
    try {
      const { credentials } = await auth.refreshAccessToken();
      const stmt = db.prepare(`
        UPDATE google_tokens 
        SET access_token = ?, expiry_date = ? 
        WHERE user_id = ?
      `);
      stmt.run(credentials.access_token, credentials.expiry_date, userId);
      auth.setCredentials(credentials);
    } catch (refreshError) {
      console.error("Token refresh error:", refreshError);
      return res.status(401).json({ error: "Session expired, please reconnect calendar" });
    }
  }

  const calendar = google.calendar({ version: 'v3', auth });

  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });

    res.json(response.data.items);
  } catch (error) {
    console.error("Fetch Events Error:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

export default router;
