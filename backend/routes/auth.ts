import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database/database.js';
import crypto from 'crypto';

const router = express.Router();
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');
  return secret;
};

// Helper to get redirect URI
const getRedirectUri = (provider: string) => {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  return `${appUrl}/api/auth/${provider}/callback`;
};

// --- Google OAuth ---
router.get('/google/url', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return res.status(500).json({ error: 'Google Client ID not configured' });

  const state = crypto.randomBytes(16).toString('hex');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri('google'),
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
    state
  });

  res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}`, state });
});

router.get('/google/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!code || typeof code !== 'string') return res.status(400).send('No code provided');
  if (!state || typeof state !== 'string' || !/^[a-f0-9]{32}$/.test(state)) {
    return res.status(400).send('Invalid state parameter');
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: getRedirectUri('google'),
        grant_type: 'authorization_code'
      })
    });

    const tokens = await tokenRes.json();
    if (tokens.error) throw new Error(tokens.error_description || tokens.error);

    // Get user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });
    const googleUser = await userRes.json();

    // Find or create user
    let user = db.prepare('SELECT * FROM users WHERE google_id = ? OR email = ?').get(googleUser.sub, googleUser.email) as any;

    if (!user) {
      const stmt = db.prepare('INSERT INTO users (name, email, google_id, is_verified) VALUES (?, ?, ?, 1)');
      const info = stmt.run(googleUser.name, googleUser.email, googleUser.sub);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    } else if (!user.google_id) {
      db.prepare('UPDATE users SET google_id = ? WHERE id = ?').run(googleUser.sub, user.id);
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, getJwtSecret(), { expiresIn: '24h' });

    const userPayload = encodeURIComponent(JSON.stringify({ id: user.id, name: user.name, email: user.email }));
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'OAUTH_AUTH_SUCCESS', 
                token: '${token}',
                user: ${JSON.stringify({ id: user.id, name: user.name, email: user.email })}
              }, window.opener.location.origin);
              window.close();
            } else {
              window.location.href = '/?oauth_token=${token}&oauth_user=${userPayload}';
            }
          </script>
          <p>Authentication successful. Closing window...</p>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('Google OAuth Error:', error.message);
    res.status(500).send('Authentication failed. Please try again.');
  }
});

// --- GitHub OAuth ---
router.get('/github/url', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) return res.status(500).json({ error: 'GitHub Client ID not configured' });

  const state = crypto.randomBytes(16).toString('hex');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri('github'),
    scope: 'user:email',
    state
  });

  res.json({ url: `https://github.com/login/oauth/authorize?${params}`, state });
});

router.get('/github/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!code || typeof code !== 'string') return res.status(400).send('No code provided');
  if (!state || typeof state !== 'string' || !/^[a-f0-9]{32}$/.test(state)) {
    return res.status(400).send('Invalid state parameter');
  }

  try {
    // Exchange code for token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: getRedirectUri('github')
      })
    });

    const tokens = await tokenRes.json();
    if (tokens.error) throw new Error(tokens.error_description || tokens.error);

    // Get user info
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `token ${tokens.access_token}`,
        'User-Agent': 'ArogyaMitra'
      }
    });
    const githubUser = await userRes.json();

    // Get user emails (GitHub might not return email in /user if private)
    const emailsRes = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `token ${tokens.access_token}`,
        'User-Agent': 'ArogyaMitra'
      }
    });
    const emails = await emailsRes.json();
    const primaryEmail = emails.find((e: any) => e.primary)?.email || emails[0]?.email || `${githubUser.login}@github.com`;

    // Find or create user
    let user = db.prepare('SELECT * FROM users WHERE github_id = ? OR email = ?').get(githubUser.id.toString(), primaryEmail) as any;

    if (!user) {
      const stmt = db.prepare('INSERT INTO users (name, email, github_id, is_verified) VALUES (?, ?, ?, 1)');
      const info = stmt.run(githubUser.name || githubUser.login, primaryEmail, githubUser.id.toString());
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    } else if (!user.github_id) {
      db.prepare('UPDATE users SET github_id = ? WHERE id = ?').run(githubUser.id.toString(), user.id);
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, getJwtSecret(), { expiresIn: '24h' });

    const userPayload = encodeURIComponent(JSON.stringify({ id: user.id, name: user.name, email: user.email }));
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'OAUTH_AUTH_SUCCESS', 
                token: '${token}',
                user: ${JSON.stringify({ id: user.id, name: user.name, email: user.email })}
              }, window.opener.location.origin);
              window.close();
            } else {
              window.location.href = '/?oauth_token=${token}&oauth_user=${userPayload}';
            }
          </script>
          <p>Authentication successful. Closing window...</p>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('GitHub OAuth Error:', error.message);
    res.status(500).send('Authentication failed. Please try again.');
  }
});

// Register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  if (name.length > 100 || email.length > 255) {
    return res.status(400).json({ error: 'Input too long' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare(`
      INSERT INTO users (name, email, password_hash, is_verified)
      VALUES (?, ?, ?, 1)
    `);

    const info = stmt.run(name, email, hashedPassword);
    res.status(201).json({ id: info.lastInsertRowid, message: "User registered successfully" });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(400).json({ error: "Email already exists" });
    }
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;

    if (!user || !user.password_hash) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      getJwtSecret(),
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Logout
router.post('/logout', (req, res) => {
  // Client clears token from frontend storage
  res.json({ success: true, message: "Logged out successfully" });
});

export default router;
