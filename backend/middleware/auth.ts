import { Request, Response, NextFunction } from 'express';
import { requireAuth, clerkClient } from '@clerk/express';
import db from '../database/database.js';

export interface AuthRequest extends Request {
  user?: {
    userId: number; // Important: Must remain a number for SQLite queries untouched
    email: string;
  };
  auth?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  console.log(`\n--- NEW REQUEST to ${req.path} ---`);

  requireAuth()(req, res, async (err: any) => {
    if (err) {
      console.log("-> 401: Clerk Auth Failed");
      return res.status(401).json({ error: 'Access denied. Invalid or missing token.' });
    }

    if (!req.auth || !req.auth.userId) {
      console.log("-> 401: No userId found in Clerk auth object");
      return res.status(401).json({ error: 'Access denied. Unauthenticated request.' });
    }

    const clerkId = req.auth.userId;

    try {
      // 1. Check if user already exists in our DB via clerk_id
      let userRow = db.prepare('SELECT id, email FROM users WHERE clerk_id = ?').get(clerkId) as { id: number; email: string } | undefined;

      if (!userRow) {
        // 2. Fetch user from Clerk to get email if not found
        // This bridges the gap between Clerk's string ID and our SQLite DB integer IDs
        const clerkUser = await clerkClient.users.getUser(clerkId);
        const email = clerkUser.emailAddresses[0]?.emailAddress || '';
        const name = clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : 'User';

        // 3. See if we have this user by email from the old auth system
        const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: number } | undefined;

        if (existingUser) {
          // Link new Clerk ID to old account
          db.prepare('UPDATE users SET clerk_id = ? WHERE id = ?').run(clerkId, existingUser.id);
          userRow = { id: existingUser.id, email: email };
        } else {
          // Create brand new user in DB
          const info = db.prepare('INSERT INTO users (name, email, clerk_id) VALUES (?, ?, ?)').run(name, email, clerkId);
          userRow = { id: info.lastInsertRowid as number, email: email };
        }
      }

      // 4. Attach the DB integer ID back to the standard req.user format so ALL OTHER APIS KEEP WORKING UNCHANGED
      req.user = { userId: userRow.id, email: userRow.email };
      console.log(`-> Clerk Token verified successfully for DB user: ${userRow.id} (Clerk ID: ${clerkId})`);
      next();

    } catch (dbError) {
      console.error(`-> 500 DB or Clerk API Error:`, dbError);
      return res.status(500).json({ error: `Internal Server Error validating user` });
    }
  });
};
