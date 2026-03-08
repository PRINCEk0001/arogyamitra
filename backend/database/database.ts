import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use DATABASE_URL env var if set, otherwise resolve db at project root
// On Render, process.cwd() is the project root (/opt/render/project/src)
const dbFileName = process.env.DATABASE_URL || 'arogyamitra.db';
const dbPath = path.isAbsolute(dbFileName)
  ? dbFileName
  : path.resolve(process.cwd(), dbFileName);

console.log(`[DB] Using database at: ${dbPath}`);
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    google_id TEXT UNIQUE,
    github_id TEXT UNIQUE,
    is_verified INTEGER DEFAULT 1,
    age INTEGER,
    gender TEXT,
    height REAL,
    weight REAL,
    activity_level TEXT,
    goal TEXT,
    sleep_hours REAL,
    dietary_restrictions TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS health_assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    bmi REAL,
    bmr REAL,
    tdee REAL,
    category TEXT,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS workout_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    duration TEXT,
    intensity TEXT,
    exercises TEXT, -- JSON string
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS nutrition_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    target_calories REAL,
    target_protein REAL,
    meals TEXT, -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    weight REAL,
    bmi REAL,
    workout_completed INTEGER DEFAULT 0, -- 0 for false, 1 for true
    date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS google_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expiry_date INTEGER,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );
`);

// Add password column if it doesn't exist
try {
  db.exec('ALTER TABLE users ADD COLUMN password_hash TEXT');
} catch (e) {
  // Column already exists
}

// Add OAuth columns if they don't exist
try {
  db.exec('ALTER TABLE users ADD COLUMN google_id TEXT UNIQUE');
} catch (e) { }
try {
  db.exec('ALTER TABLE users ADD COLUMN github_id TEXT UNIQUE');
} catch (e) { }
try {
  db.exec('ALTER TABLE users ADD COLUMN clerk_id TEXT');
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id)');
} catch (e) {
  // If column already exists but index might not, try adding index anyway
  try {
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id)');
  } catch (idxErr) { }
}

export default db;
