import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'society.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = OFF');

export function initializeDatabase() {
  // Users table with role-based auth
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('resident', 'admin')),
      apartment_number TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Complaints table
  db.exec(`
    CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      resident_id TEXT NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      photo_path TEXT,
      status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open', 'In Progress', 'Resolved')),
      priority TEXT NOT NULL DEFAULT 'Medium' CHECK(priority IN ('Low', 'Medium', 'High')),
      is_overdue INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (resident_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Complaint history - tracks every status change
  db.exec(`
    CREATE TABLE IF NOT EXISTS complaint_history (
      id TEXT PRIMARY KEY,
      complaint_id TEXT NOT NULL,
      changed_by TEXT NOT NULL,
      action TEXT NOT NULL DEFAULT 'status_change',
      old_status TEXT,
      new_status TEXT NOT NULL,
      old_priority TEXT,
      new_priority TEXT,
      old_assigned_to TEXT,
      new_assigned_to TEXT,
      note TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
      FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Notice board
  db.exec(`
    CREATE TABLE IF NOT EXISTS notices (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      is_important INTEGER DEFAULT 0,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Email logs for tracking notifications
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_logs (
      id TEXT PRIMARY KEY,
      recipient_email TEXT NOT NULL,
      recipient_name TEXT NOT NULL,
      subject TEXT NOT NULL,
      type TEXT NOT NULL,
      complaint_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'sent',
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE SET NULL
    )
  `);

  // Settings table for configurable values
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert default settings
  const settingsExist = db.prepare('SELECT COUNT(*) as count FROM settings').get();
  if (settingsExist.count === 0) {
    db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('overdue_days', '7');
    db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('smtp_host', 'smtp.gmail.com');
    db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('smtp_port', '587');
    db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('smtp_user', '');
    db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run('smtp_pass', '');
  }

  // Add is_active column if it doesn't exist (migration for existing DBs)
  try {
    db.exec(`ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1`);
  } catch (e) {
    // Column already exists, ignore
  }

  // Staff table
  db.exec(`
    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('Electrician', 'Plumber', 'Cleaner', 'Security', 'Gardener')),
      phone TEXT,
      email TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Complaints assigned to staff
  try {
    db.exec(`ALTER TABLE complaints ADD COLUMN assigned_to TEXT REFERENCES staff(id) ON DELETE SET NULL`);
  } catch (e) {
    // Column already exists, ignore
  }

  // Migration: recreate complaints table with new statuses and columns
  const complaintCols = db.prepare("PRAGMA table_info(complaints)").all();
  const colNames = complaintCols.map(c => c.name);
  if (!colNames.includes('assigned_date')) {
    // Backup existing data
    db.exec(`CREATE TABLE IF NOT EXISTS complaints_backup AS SELECT * FROM complaints`);
    db.exec(`DROP TABLE IF EXISTS complaints`);
    db.exec(`
      CREATE TABLE complaints (
        id TEXT PRIMARY KEY,
        resident_id TEXT NOT NULL,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        photo_path TEXT,
        status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open', 'Assigned', 'Work Started', 'In Progress', 'Resolved', 'Confirmed', 'Reopened')),
        priority TEXT NOT NULL DEFAULT 'Medium' CHECK(priority IN ('Low', 'Medium', 'High')),
        is_overdue INTEGER DEFAULT 0,
        assigned_to TEXT REFERENCES staff(id) ON DELETE SET NULL,
        assigned_date DATETIME,
        expected_completion DATETIME,
        work_started_at DATETIME,
        confirmed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (resident_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    // Restore data
    db.exec(`
      INSERT OR IGNORE INTO complaints (id, resident_id, category, title, description, photo_path, status, priority, is_overdue, created_at, resolved_at, updated_at)
      SELECT id, resident_id, category, title, description, photo_path, status, priority, is_overdue, created_at, resolved_at, updated_at FROM complaints_backup
    `);
    db.exec(`DROP TABLE IF EXISTS complaints_backup`);
    console.log('  ↳ Complaints table migrated with new status flow');
  }

  // Add action column to complaint_history if missing
  try {
    db.exec(`ALTER TABLE complaint_history ADD COLUMN action TEXT NOT NULL DEFAULT 'status_change'`);
  } catch (e) {
    // Column already exists, ignore
  }

  // Add staff assignment columns to complaint_history if missing
  try {
    db.exec(`ALTER TABLE complaint_history ADD COLUMN old_assigned_to TEXT`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE complaint_history ADD COLUMN new_assigned_to TEXT`);
  } catch (e) {}

  // ==================== BILLING TABLES ====================

  db.exec(`
    CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY,
      resident_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      amount REAL NOT NULL,
      billing_period TEXT NOT NULL,
      due_date DATE NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Paid', 'Overdue', 'Cancelled')),
      paid_at DATETIME,
      paid_amount REAL,
      payment_method TEXT,
      receipt_number TEXT,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (resident_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS billing_history (
      id TEXT PRIMARY KEY,
      bill_id TEXT NOT NULL,
      changed_by TEXT NOT NULL,
      action TEXT NOT NULL,
      old_status TEXT,
      new_status TEXT,
      old_amount REAL,
      new_amount REAL,
      note TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
      FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // ==================== VISITOR MANAGEMENT ====================

  // Migrate users table to add 'security' role
  const userRoleCheck = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").get();
  if (userRoleCheck && !userRoleCheck.sql.includes("'security'")) {
    db.exec(`CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users`);
    db.exec(`DROP TABLE IF EXISTS users`);
    db.exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('resident', 'admin', 'security')),
        apartment_number TEXT,
        phone TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    db.exec(`
      INSERT OR IGNORE INTO users (id, email, name, password_hash, role, apartment_number, phone, is_active, created_at, updated_at)
      SELECT id, email, name, password_hash, role, apartment_number, phone, is_active, created_at, updated_at FROM users_backup
    `);
    db.exec(`DROP TABLE IF EXISTS users_backup`);
    console.log('  ↳ Users table migrated with security role');
  }

  // Visitors table
  db.exec(`
    CREATE TABLE IF NOT EXISTS visitors (
      id TEXT PRIMARY KEY,
      resident_id TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      vehicle_number TEXT,
      purpose TEXT NOT NULL,
      visit_date DATE NOT NULL,
      expected_time TEXT,
      status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending', 'Approved', 'Rejected', 'Checked-In', 'Checked-Out')),
      approved_by TEXT,
      approved_at DATETIME,
      rejected_by TEXT,
      rejected_at DATETIME,
      rejection_reason TEXT,
      checked_in_at DATETIME,
      checked_in_by TEXT,
      checked_out_at DATETIME,
      checked_out_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (resident_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (rejected_by) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (checked_in_by) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (checked_out_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Visitor history - tracks every status change
  db.exec(`
    CREATE TABLE IF NOT EXISTS visitor_history (
      id TEXT PRIMARY KEY,
      visitor_id TEXT NOT NULL,
      changed_by TEXT NOT NULL,
      action TEXT NOT NULL,
      old_status TEXT,
      new_status TEXT NOT NULL,
      note TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE,
      FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // ==================== NOTIFICATIONS & DOCUMENTS ====================

  // Notifications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      reference_id TEXT,
      reference_type TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC)`);

  // Documents table
  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      uploaded_by TEXT NOT NULL,
      name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      category TEXT DEFAULT 'General',
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_documents_search ON documents(name, category, file_type)`);

  // Seed default admin if no admin exists
  const adminExists = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();
  if (!adminExists) {
    const adminId = uuidv4();
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare(
      "INSERT INTO users (id, email, name, password_hash, role, apartment_number, phone, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(adminId, 'admin@society.com', 'Admin', hash, 'admin', 'A-001', '9000000000', 1);
    console.log('  ↳ Default admin created (admin@society.com / admin123)');
  }

  console.log('✓ Database initialized successfully');
}

export default db;
