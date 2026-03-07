import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
  };
}

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');
  return secret;
};

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  console.log(`\n--- NEW REQUEST to ${req.path} ---`);
  console.log(`Auth Header received: ${authHeader ? authHeader.substring(0, 20) + '...' : 'NONE'}`);

  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log("-> 401: No token provided");
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, getJwtSecret()) as { userId: number; email: string };
  } catch (error: any) {
    console.error(`-> 403 Forbidden. JWT Error: [${error.name}] ${error.message}`);
    return res.status(403).json({ error: `Invalid or expired token: ${error.message}` });
  }

  req.user = decoded;
  console.log(`-> Token verified successfully for user: ${decoded.userId}`);
  next();
};
