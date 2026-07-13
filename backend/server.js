import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db, { initializeDatabase } from './database.js';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// ==================== ENV VALIDATION ====================
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key-change-in-production') {
    console.error('FATAL: JWT_SECRET is not set or using default value. Set JWT_SECRET in environment variables.');
    process.exit(1);
  }
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('WARNING: SMTP_USER/SMTP_PASS not set. Emails will not be delivered.');
  }
} else {
  console.log('Running in development mode');
}

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize database
try {
  initializeDatabase();
} catch (err) {
  console.error('FATAL: Database initialization failed:', err.message);
  process.exit(1);
}

// Ensure uploads directory exists
try {
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (err) {
  console.error('WARNING: Could not create uploads directory:', err.message);
}

// Multer configuration for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ==================== EMAIL CONFIGURATION ====================

let transporter = null;

try {
  console.log("Email transporter configured");

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
        ? process.env.SMTP_PASS.replace(/\s/g, "")
        : "",
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  transporter.verify((error) => {
    if (error) {
      console.warn('SMTP verification failed — emails will not be delivered:', error.message);
    } else {
      console.log('✓ Email transporter ready');
    }
  });
} catch (err) {
  console.error("Email transporter initialization failed:", err);
}
// Authentication middleware
function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Admin middleware
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Security middleware
function securityOnly(req, res, next) {
  if (req.user.role !== 'security') {
    return res.status(403).json({ error: 'Security access required' });
  }
  next();
}

// Admin or Security middleware
function adminOrSecurity(req, res, next) {
  if (req.user.role !== 'admin' && req.user.role !== 'security') {
    return res.status(403).json({ error: 'Admin or Security access required' });
  }
  next();
}

// ==================== AUTH ENDPOINTS ====================

// Register
app.post('/api/auth/register', (req, res) => {
  const { email, name, password, role, apartment_number, phone } = req.body;

  if (!email || !name || !password) {
    return res.status(400).json({ error: 'Email, name, and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Only allow 'resident' and 'security' roles via self-registration. Admin must be created by another admin.
  const allowedRoles = ['resident', 'security'];
  const assignedRole = allowedRoles.includes(role) ? role : 'resident';

  try {
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const id = uuidv4();
    const password_hash = bcrypt.hashSync(password, 10);

    db.prepare(
      'INSERT INTO users (id, email, name, password_hash, role, apartment_number, phone) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, email, name, password_hash, assignedRole, apartment_number || null, phone || null);

    const token = jwt.sign({ id, email, role: assignedRole }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ message: 'Registration successful', token, user: { id, email, name, role: assignedRole } });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Your account has been disabled. Please contact the administrator.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, apartment_number: user.apartment_number }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, email, name, role, apartment_number, phone, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

// ==================== COMPLAINT ENDPOINTS ====================

// Create complaint (resident)
app.post('/api/complaints', authenticateToken, upload.single('photo'), (req, res) => {
  const { category, title, description } = req.body;
  const resident_id = req.user.id;

  if (!title || !category) {
    return res.status(400).json({ error: 'Title and category are required' });
  }

  try {
    const id = uuidv4();
    const photo_path = req.file ? `/uploads/${req.file.filename}` : null;

    db.prepare(
      'INSERT INTO complaints (id, resident_id, category, title, description, photo_path, status, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, resident_id, category, title, description, photo_path, 'Open', 'Medium');

    // Record initial history
    db.prepare(
      'INSERT INTO complaint_history (id, complaint_id, changed_by, new_status, note) VALUES (?, ?, ?, ?, ?)'
    ).run(uuidv4(), id, resident_id, 'Open', 'Complaint created');

    // Get resident details for email
    const resident = db.prepare('SELECT email, name FROM users WHERE id = ?').get(resident_id);
    
    // Send confirmation email
    sendEmail(resident.email, resident.name, 'Complaint Registered', `Your complaint "${title}" has been registered and is being reviewed.`, 'complaint_created', id);

    // Notify all admins
    notifyAdmins('complaint', 'New Complaint', `New complaint "${title}" submitted by ${resident.name}`, id, 'complaint');

    res.status(201).json({ message: 'Complaint created successfully', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get complaints (resident - own only, admin - all)
app.get('/api/complaints', authenticateToken, (req, res) => {
  try {
    let query = `SELECT c.*, s.name as staff_name, s.role as staff_role FROM complaints c LEFT JOIN staff s ON c.assigned_to = s.id`;
    let params = [];

    if (req.user.role === 'resident') {
      query += ' WHERE c.resident_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'admin') {
      const { category, status, priority, search, sort, assigned } = req.query;
      const filters = [];

      if (category) {
        filters.push('c.category = ?');
        params.push(category);
      }
      if (status) {
        filters.push('c.status = ?');
        params.push(status);
      }
      if (priority) {
        filters.push('c.priority = ?');
        params.push(priority);
      }
      if (search) {
        filters.push('(c.title LIKE ? OR c.description LIKE ?)');
        params.push(`%${search}%`, `%${search}%`);
      }
      if (assigned === 'yes') {
        filters.push('c.assigned_to IS NOT NULL');
      } else if (assigned === 'no') {
        filters.push('c.assigned_to IS NULL');
      }

      if (filters.length > 0) {
        query += ' WHERE ' + filters.join(' AND ');
      }

      if (sort === 'overdue') {
        query += ' ORDER BY c.is_overdue DESC, c.created_at DESC';
      } else if (sort === 'priority') {
        query += ' ORDER BY CASE WHEN c.priority = "High" THEN 1 WHEN c.priority = "Medium" THEN 2 ELSE 3 END, c.created_at DESC';
      } else {
        query += ' ORDER BY c.created_at DESC';
      }
    } else {
      query += ' ORDER BY c.created_at DESC';
    }

    const complaints = db.prepare(query).all(...params);

    const complaintWithHistory = complaints.map(complaint => {
      const history = db.prepare(`
        SELECT ch.*, u.name as actor_name, st.name as assigned_staff_name
        FROM complaint_history ch
        LEFT JOIN users u ON ch.changed_by = u.id
        LEFT JOIN staff st ON ch.new_assigned_to = st.id
        WHERE ch.complaint_id = ? ORDER BY ch.timestamp DESC
      `).all(complaint.id);
      return { ...complaint, history };
    });

    res.json(complaintWithHistory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single complaint with full details
app.get('/api/complaints/:id', authenticateToken, (req, res) => {
  try {
    const complaint = db.prepare(`
      SELECT c.*, s.name as staff_name, s.role as staff_role, s.phone as staff_phone
      FROM complaints c LEFT JOIN staff s ON c.assigned_to = s.id
      WHERE c.id = ?
    `).get(req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    if (req.user.role === 'resident' && complaint.resident_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const history = db.prepare(`
      SELECT ch.*, u.name as actor_name, st.name as assigned_staff_name
      FROM complaint_history ch
      LEFT JOIN users u ON ch.changed_by = u.id
      LEFT JOIN staff st ON ch.new_assigned_to = st.id
      WHERE ch.complaint_id = ? ORDER BY ch.timestamp DESC
    `).all(complaint.id);
    const resident = db.prepare('SELECT id, name, email, apartment_number FROM users WHERE id = ?').get(complaint.resident_id);

    res.json({ ...complaint, history, resident });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update complaint (admin) - handles status transitions, assignment, priority
app.put('/api/complaints/:id/status', authenticateToken, adminOnly, (req, res) => {
  const { status, priority, note, assigned_to, expected_completion } = req.body;
  const { id } = req.params;

  try {
    const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    const oldStatus = complaint.status;
    const oldPriority = complaint.priority;
    const oldAssigned = complaint.assigned_to;

    const updates = [];
    const values = [];
    let action = 'status_change';

    // Handle assignment
    if (assigned_to !== undefined) {
      if (assigned_to === null || assigned_to === '') {
        updates.push('assigned_to = NULL');
        updates.push('assigned_date = NULL');
        action = 'unassigned';
      } else {
        const staffMember = db.prepare('SELECT id, name FROM staff WHERE id = ?').get(assigned_to);
        if (!staffMember) return res.status(400).json({ error: 'Staff member not found' });
        updates.push('assigned_to = ?');
        values.push(assigned_to);
        updates.push('assigned_date = CURRENT_TIMESTAMP');
        action = 'assigned';
        if (!complaint.assigned_to) {
          updates.push('status = ?');
          values.push('Assigned');
        }
      }
    }

    // Handle expected completion
    if (expected_completion !== undefined) {
      updates.push('expected_completion = ?');
      values.push(expected_completion || null);
    }

    // Handle status transitions
    if (status && status !== oldStatus) {
      const VALID_TRANSITIONS = {
        'Open': ['Assigned', 'In Progress', 'Resolved'],
        'Assigned': ['Work Started', 'In Progress', 'Resolved', 'Open'],
        'Work Started': ['In Progress', 'Resolved'],
        'In Progress': ['Resolved', 'Work Started'],
        'Resolved': ['Confirmed', 'Reopened'],
        'Reopened': ['In Progress', 'Assigned', 'Work Started'],
        'Confirmed': [],
      };

      if (!VALID_TRANSITIONS[oldStatus]?.includes(status)) {
        return res.status(400).json({ error: `Cannot transition from "${oldStatus}" to "${status}"` });
      }

      updates.push('status = ?');
      values.push(status);

      if (status === 'Work Started') {
        updates.push('work_started_at = CURRENT_TIMESTAMP');
        action = 'work_started';
      } else if (status === 'In Progress' && oldStatus !== 'Work Started') {
        action = 'status_change';
      } else if (status === 'In Progress' && oldStatus === 'Work Started') {
        action = 'work_in_progress';
      } else if (status === 'Resolved') {
        updates.push('resolved_at = CURRENT_TIMESTAMP');
        updates.push('is_overdue = 0');
        action = 'resolved';
      } else if (status === 'Reopened') {
        updates.push('resolved_at = NULL');
        action = 'reopened';
      } else if (status === 'Confirmed') {
        action = 'confirmed';
      }
    }

    // Handle priority
    if (priority && priority !== oldPriority) {
      updates.push('priority = ?');
      values.push(priority);
      action = 'priority_change';
    }

    if (updates.length === 0) return res.status(400).json({ error: 'No changes to update' });

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    db.prepare(`UPDATE complaints SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    // Record history
    const newAssignedName = (assigned_to && assigned_to !== oldAssigned)
      ? db.prepare('SELECT name FROM staff WHERE id = ?').get(assigned_to)?.name : null;

    db.prepare(`
      INSERT INTO complaint_history (id, complaint_id, changed_by, action, old_status, new_status, old_priority, new_priority, old_assigned_to, new_assigned_to, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(), id, req.user.id, action,
      oldStatus, status || oldStatus,
      oldPriority, priority || oldPriority,
      oldAssigned || null,
      assigned_to || null,
      note || null
    );

    // Send email to resident
    const resident = db.prepare('SELECT email, name FROM users WHERE id = ?').get(complaint.resident_id);
    let emailSubject = 'Complaint Updated';
    let emailText = `Your complaint "${complaint.title}" has been updated.`;

    if (action === 'assigned') {
      const staffName = db.prepare('SELECT name FROM staff WHERE id = ?').get(assigned_to)?.name;
      emailSubject = 'Complaint Assigned';
      emailText = `Your complaint "${complaint.title}" has been assigned to ${staffName}.${note ? ` Note: ${note}` : ''}`;
    } else if (action === 'resolved') {
      emailSubject = 'Complaint Resolved';
      emailText = `Your complaint "${complaint.title}" has been resolved. Please confirm once verified.${note ? ` Note: ${note}` : ''}`;
    } else if (status) {
      emailText += ` Status: ${status}.${note ? ` Note: ${note}` : ''}`;
    } else if (priority) {
      emailText += ` Priority changed to ${priority}.`;
    }

    sendEmail(resident.email, resident.name, emailSubject, emailText, action, id);

    // Notify resident via notification system
    createNotification(complaint.resident_id, 'complaint', emailSubject, emailText, id, 'complaint');

    // Notify SSE clients
    notifyComplaintUpdate(id);

    res.json({ message: 'Complaint updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check and mark overdue complaints (admin)
app.post('/api/complaints/check-overdue', authenticateToken, adminOnly, (req, res) => {
  try {
    const settingRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('overdue_days');
    const overdueDays = parseInt(settingRow.value) || 7;

    const overdueComplaints = db.prepare(`
      SELECT id, created_at FROM complaints 
      WHERE status != 'Resolved' AND status != 'Confirmed'
      AND datetime(created_at, '+' || ? || ' days') < CURRENT_TIMESTAMP
    `).all(overdueDays);

    for (const complaint of overdueComplaints) {
      db.prepare('UPDATE complaints SET is_overdue = 1 WHERE id = ?').run(complaint.id);
    }

    res.json({ message: 'Overdue complaints updated', count: overdueComplaints.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resident confirms or rejects resolution
app.put('/api/complaints/:id/confirm', authenticateToken, (req, res) => {
  const { confirmed, note } = req.body;
  const { id } = req.params;

  try {
    const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    if (complaint.resident_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });
    if (complaint.status !== 'Resolved') return res.status(400).json({ error: 'Complaint is not in Resolved status' });

    if (confirmed) {
      db.prepare('UPDATE complaints SET status = ?, confirmed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('Confirmed', id);

      db.prepare(`
        INSERT INTO complaint_history (id, complaint_id, changed_by, action, old_status, new_status, note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), id, req.user.id, 'confirmed', 'Resolved', 'Confirmed', note || 'Resident confirmed resolution');
    } else {
      db.prepare('UPDATE complaints SET status = ?, resolved_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('Reopened', id);

      db.prepare(`
        INSERT INTO complaint_history (id, complaint_id, changed_by, action, old_status, new_status, note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), id, req.user.id, 'reopened', 'Resolved', 'Reopened', note || 'Resident rejected resolution');
    }

    res.json({ message: confirmed ? 'Resolution confirmed' : 'Complaint reopened' });

    // Notify admins about confirmation/reopening
    if (confirmed) {
      notifyAdmins('complaint', 'Complaint Confirmed', `Complaint "${complaint.title}" has been confirmed by the resident`, id, 'complaint');
    } else {
      notifyAdmins('complaint', 'Complaint Reopened', `Complaint "${complaint.title}" has been reopened by the resident. Reason: ${note || 'No reason given'}`, id, 'complaint');
    }

    // Notify SSE clients
    notifyComplaintUpdate(id);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available staff for assignment
app.get('/api/complaints/:id/available-staff', authenticateToken, adminOnly, (req, res) => {
  try {
    const staff = db.prepare('SELECT id, name, role FROM staff WHERE is_active = 1 ORDER BY name ASC').all();
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== NOTICE BOARD ENDPOINTS ====================

// Get all notices
app.get('/api/notices', (req, res) => {
  try {
    const notices = db.prepare(`
      SELECT n.*, u.name as creator_name FROM notices n
      LEFT JOIN users u ON n.created_by = u.id
      ORDER BY n.is_important DESC, n.created_at DESC
    `).all();
    res.json(notices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create notice (admin)
app.post('/api/notices', authenticateToken, adminOnly, (req, res) => {
  const { title, description, is_important } = req.body;

  try {
    const id = uuidv4();
    db.prepare('INSERT INTO notices (id, title, description, is_important, created_by) VALUES (?, ?, ?, ?, ?)')
      .run(id, title, description, is_important ? 1 : 0, req.user.id);

    // If important, send email to all residents
    if (is_important) {
      const residents = db.prepare('SELECT email, name FROM users WHERE role = ?').all('resident');
      for (const resident of residents) {
        sendEmail(resident.email, resident.name, `Important Notice: ${title}`, description, 'important_notice', null);
      }
    }

    // Notify all residents via notification system
    const allResidents = db.prepare("SELECT id FROM users WHERE role = 'resident'").all();
    for (const r of allResidents) {
      createNotification(r.id, 'notice', is_important ? `Important Notice: ${title}` : `New Notice: ${title}`, description || title, id, 'notice');
    }

    res.status(201).json({ message: 'Notice posted successfully', id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete notice (admin)
app.delete('/api/notices/:id', authenticateToken, adminOnly, (req, res) => {
  try {
    db.prepare('DELETE FROM notices WHERE id = ?').run(req.params.id);
    res.json({ message: 'Notice deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== DASHBOARD ENDPOINTS ====================

app.get('/api/dashboard', authenticateToken, adminOnly, (req, res) => {
  try {
    const totalComplaints = db.prepare('SELECT COUNT(*) as count FROM complaints').get();
    const byStatus = db.prepare(`
      SELECT status, COUNT(*) as count FROM complaints GROUP BY status
    `).all();
    const byCategory = db.prepare(`
      SELECT category, COUNT(*) as count FROM complaints GROUP BY category
    `).all();
    const overdueCount = db.prepare('SELECT COUNT(*) as count FROM complaints WHERE is_overdue = 1').get();
    const recentComplaints = db.prepare(`
      SELECT c.*, s.name as staff_name FROM complaints c
      LEFT JOIN staff s ON c.assigned_to = s.id
      ORDER BY c.created_at DESC LIMIT 5
    `).all();

    // Progress stats
    const assignedCount = db.prepare("SELECT COUNT(*) as count FROM complaints WHERE assigned_to IS NOT NULL").get();
    const unassignedOpen = db.prepare("SELECT COUNT(*) as count FROM complaints WHERE assigned_to IS NULL AND status NOT IN ('Resolved', 'Confirmed')").get();
    const avgResolutionDays = db.prepare(`
      SELECT ROUND(AVG(julianday(resolved_at) - julianday(created_at)), 1) as avg_days
      FROM complaints WHERE resolved_at IS NOT NULL
    `).get();
    const todayResolved = db.prepare(`
      SELECT COUNT(*) as count FROM complaints
      WHERE status IN ('Resolved', 'Confirmed') AND date(resolved_at) = date('now')
    `).get();

    // Staff workload
    const staffWorkload = db.prepare(`
      SELECT s.name, s.role,
        SUM(CASE WHEN c.status IN ('Assigned', 'Work Started', 'In Progress') THEN 1 ELSE 0 END) as active_count,
        SUM(CASE WHEN c.status IN ('Resolved', 'Confirmed') THEN 1 ELSE 0 END) as completed_count
      FROM staff s
      LEFT JOIN complaints c ON c.assigned_to = s.id
      WHERE s.is_active = 1
      GROUP BY s.id
      ORDER BY active_count DESC
    `).all();

    res.json({
      total: totalComplaints.count,
      byStatus,
      byCategory,
      overdue: overdueCount.count,
      recent: recentComplaints,
      progress: {
        assigned: assignedCount.count,
        unassignedOpen: unassignedOpen.count,
        avgResolutionDays: avgResolutionDays.avg_days || 0,
        todayResolved: todayResolved.count,
      },
      staffWorkload,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== EMAIL HELPER ====================

function sendEmail(to, name, subject, text, type, complaintId) {
  const mailOptions = {
    from: process.env.SMTP_USER || 'noreply@societytracker.com',
    to,
    subject,
    html: `
      <h2>${subject}</h2>
      <p>Hello ${name},</p>
      <p>${text}</p>
      <p style="color: #666; font-size: 12px; margin-top: 20px;">Society Maintenance Tracker</p>
    `
  };

  // Log the email
  db.prepare('INSERT INTO email_logs (id, recipient_email, recipient_name, subject, type, complaint_id) VALUES (?, ?, ?, ?, ?, ?)')
    .run(uuidv4(), to, name, subject, type, complaintId || null);

  // Send if transporter is available
  if (transporter) {
    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.log('Email send attempted (may not have been delivered):', to);
      }
    });
  }
}

// ==================== SETTINGS ENDPOINTS ====================

app.get('/api/settings', authenticateToken, adminOnly, (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM settings').all();
    const settingsObj = {};
    settings.forEach(s => settingsObj[s.key] = s.value);
    res.json(settingsObj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/settings/:key', authenticateToken, adminOnly, (req, res) => {
  try {
    const { value } = req.body;
    db.prepare('UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?')
      .run(value, req.params.key);
    res.json({ message: 'Setting updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ADMIN RESIDENT MANAGEMENT ====================

// List residents with search and filters
app.get('/api/admin/residents', authenticateToken, adminOnly, (req, res) => {
  try {
    const { search, status, sort } = req.query;
    let query = `SELECT id, email, name, role, apartment_number, phone, is_active, created_at, updated_at FROM users WHERE role = 'resident'`;
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ? OR apartment_number LIKE ? OR phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status === 'active') {
      query += ' AND is_active = 1';
    } else if (status === 'disabled') {
      query += ' AND is_active = 0';
    }

    if (sort === 'name') {
      query += ' ORDER BY name ASC';
    } else if (sort === 'apartment') {
      query += ' ORDER BY apartment_number ASC';
    } else {
      query += ' ORDER BY created_at DESC';
    }

    const residents = db.prepare(query).all(...params);

    // Attach complaint counts
    const result = residents.map(r => {
      const counts = db.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) as open_count,
          SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_count,
          SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved_count
        FROM complaints WHERE resident_id = ?
      `).get(r.id);
      return { ...r, complaints: counts };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single resident profile with complaint history
app.get('/api/admin/residents/:id', authenticateToken, adminOnly, (req, res) => {
  try {
    const resident = db.prepare(
      "SELECT id, email, name, role, apartment_number, phone, is_active, created_at, updated_at FROM users WHERE id = ? AND role = 'resident'"
    ).get(req.params.id);

    if (!resident) return res.status(404).json({ error: 'Resident not found' });

    const complaintStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) as open_count,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_count,
        SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved_count
      FROM complaints WHERE resident_id = ?
    `).get(resident.id);

    const complaints = db.prepare(
      'SELECT * FROM complaints WHERE resident_id = ? ORDER BY created_at DESC'
    ).all(resident.id);

    res.json({ ...resident, complaints, complaintStats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Edit resident
app.put('/api/admin/residents/:id', authenticateToken, adminOnly, (req, res) => {
  const { name, email, apartment_number, phone } = req.body;
  const { id } = req.params;

  try {
    const resident = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'resident'").get(id);
    if (!resident) return res.status(404).json({ error: 'Resident not found' });

    // Check email uniqueness if changed
    if (email) {
      const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, id);
      if (existing) return res.status(400).json({ error: 'Email already in use' });
    }

    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (email !== undefined) { updates.push('email = ?'); values.push(email); }
    if (apartment_number !== undefined) { updates.push('apartment_number = ?'); values.push(apartment_number || null); }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone || null); }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updated = db.prepare(
      "SELECT id, email, name, role, apartment_number, phone, is_active, created_at, updated_at FROM users WHERE id = ?"
    ).get(id);

    res.json({ message: 'Resident updated', resident: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle resident active status (enable/disable)
app.put('/api/admin/residents/:id/toggle-status', authenticateToken, adminOnly, (req, res) => {
  try {
    const resident = db.prepare("SELECT id, is_active FROM users WHERE id = ? AND role = 'resident'").get(req.params.id);
    if (!resident) return res.status(404).json({ error: 'Resident not found' });

    const newStatus = resident.is_active ? 0 : 1;
    db.prepare('UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, resident.id);

    res.json({
      message: newStatus ? 'Resident enabled' : 'Resident disabled',
      is_active: newStatus,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete resident
app.delete('/api/admin/residents/:id', authenticateToken, adminOnly, (req, res) => {
  try {
    const resident = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'resident'").get(req.params.id);
    if (!resident) return res.status(404).json({ error: 'Resident not found' });

    db.prepare('DELETE FROM users WHERE id = ?').run(resident.id);
    res.json({ message: 'Resident deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ADMIN STAFF MANAGEMENT ====================

// List staff with search and filters
app.get('/api/admin/staff', authenticateToken, adminOnly, (req, res) => {
  try {
    const { search, role, status, sort } = req.query;
    let query = 'SELECT * FROM staff';
    const params = [];
    const filters = [];

    if (search) {
      filters.push('(name LIKE ? OR email LIKE ? OR phone LIKE ? OR role LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (role) {
      filters.push('role = ?');
      params.push(role);
    }

    if (status === 'active') {
      filters.push('is_active = 1');
    } else if (status === 'disabled') {
      filters.push('is_active = 0');
    }

    if (filters.length > 0) {
      query += ' WHERE ' + filters.join(' AND ');
    }

    if (sort === 'name') {
      query += ' ORDER BY name ASC';
    } else if (sort === 'role') {
      query += ' ORDER BY role ASC';
    } else {
      query += ' ORDER BY created_at DESC';
    }

    const staff = db.prepare(query).all(...params);

    // Attach complaint counts for each staff member
    const result = staff.map(s => {
      const counts = db.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) as open_count,
          SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_count,
          SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved_count
        FROM complaints WHERE assigned_to = ?
      `).get(s.id);
      return { ...s, complaints: counts };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single staff member with assigned complaints
app.get('/api/admin/staff/:id', authenticateToken, adminOnly, (req, res) => {
  try {
    const member = db.prepare('SELECT * FROM staff WHERE id = ?').get(req.params.id);
    if (!member) return res.status(404).json({ error: 'Staff member not found' });

    const complaintStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) as open_count,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_count,
        SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved_count
      FROM complaints WHERE assigned_to = ?
    `).get(member.id);

    const complaints = db.prepare(
      'SELECT * FROM complaints WHERE assigned_to = ? ORDER BY created_at DESC'
    ).all(member.id);

    res.json({ ...member, complaints, complaintStats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create staff member
app.post('/api/admin/staff', authenticateToken, adminOnly, (req, res) => {
  const { name, role, phone, email } = req.body;

  if (!name || !role) {
    return res.status(400).json({ error: 'Name and role are required' });
  }

  const validRoles = ['Electrician', 'Plumber', 'Cleaner', 'Security', 'Gardener'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    if (email) {
      const existing = db.prepare('SELECT id FROM staff WHERE email = ?').get(email);
      if (existing) return res.status(400).json({ error: 'Email already in use' });
    }

    const id = uuidv4();
    db.prepare(
      'INSERT INTO staff (id, name, role, phone, email) VALUES (?, ?, ?, ?, ?)'
    ).run(id, name, role, phone || null, email || null);

    const member = db.prepare('SELECT * FROM staff WHERE id = ?').get(id);
    res.status(201).json({ message: 'Staff member added', staff: member });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Edit staff member
app.put('/api/admin/staff/:id', authenticateToken, adminOnly, (req, res) => {
  const { name, role, phone, email } = req.body;
  const { id } = req.params;

  try {
    const member = db.prepare('SELECT id FROM staff WHERE id = ?').get(id);
    if (!member) return res.status(404).json({ error: 'Staff member not found' });

    if (role) {
      const validRoles = ['Electrician', 'Plumber', 'Cleaner', 'Security', 'Gardener'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
    }

    if (email) {
      const existing = db.prepare('SELECT id FROM staff WHERE email = ? AND id != ?').get(email, id);
      if (existing) return res.status(400).json({ error: 'Email already in use' });
    }

    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (role !== undefined) { updates.push('role = ?'); values.push(role); }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone || null); }
    if (email !== undefined) { updates.push('email = ?'); values.push(email || null); }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    db.prepare(`UPDATE staff SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM staff WHERE id = ?').get(id);
    res.json({ message: 'Staff member updated', staff: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle staff active status (enable/disable)
app.put('/api/admin/staff/:id/toggle-status', authenticateToken, adminOnly, (req, res) => {
  try {
    const member = db.prepare('SELECT id, is_active FROM staff WHERE id = ?').get(req.params.id);
    if (!member) return res.status(404).json({ error: 'Staff member not found' });

    const newStatus = member.is_active ? 0 : 1;
    db.prepare('UPDATE staff SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, member.id);

    res.json({
      message: newStatus ? 'Staff member enabled' : 'Staff member disabled',
      is_active: newStatus,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete staff member
app.delete('/api/admin/staff/:id', authenticateToken, adminOnly, (req, res) => {
  try {
    const member = db.prepare('SELECT id FROM staff WHERE id = ?').get(req.params.id);
    if (!member) return res.status(404).json({ error: 'Staff member not found' });

    // Unassign any complaints assigned to this staff
    db.prepare('UPDATE complaints SET assigned_to = NULL WHERE assigned_to = ?').run(member.id);

    db.prepare('DELETE FROM staff WHERE id = ?').run(member.id);
    res.json({ message: 'Staff member deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== LIVE STATUS (SSE) ====================

// Server-Sent Events for live complaint updates
const sseClients = new Map();

app.get('/api/complaints/:id/stream', authenticateToken, (req, res) => {
  const complaint = db.prepare('SELECT id, resident_id FROM complaints WHERE id = ?').get(req.params.id);
  if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
  if (req.user.role === 'resident' && complaint.resident_id !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  const key = `${req.params.id}:${req.user.id}`;
  sseClients.set(key, res);

  req.on('close', () => {
    sseClients.delete(key);
  });
});

// Helper to notify SSE clients
function notifyComplaintUpdate(complaintId) {
  for (const [key, client] of sseClients) {
    if (key.startsWith(`${complaintId}:`)) {
      try {
        const complaint = db.prepare(`
          SELECT c.*, s.name as staff_name, s.role as staff_role
          FROM complaints c LEFT JOIN staff s ON c.assigned_to = s.id
          WHERE c.id = ?
        `).get(complaintId);
        const history = db.prepare(`
          SELECT ch.*, u.name as actor_name
          FROM complaint_history ch LEFT JOIN users u ON ch.changed_by = u.id
          WHERE ch.complaint_id = ? ORDER BY ch.timestamp DESC
        `).all(complaintId);
        client.write(`data: ${JSON.stringify({ type: 'update', complaint: { ...complaint, history } })}\n\n`);
      } catch (e) {
        // Ignore
      }
    }
  }
}

// ==================== ADMIN BILLING MANAGEMENT ====================

// List bills (admin sees all, resident sees own)
app.get('/api/bills', authenticateToken, (req, res) => {
  try {
    const { search, status, period, sort } = req.query;
    let query = `SELECT b.*, u.name as resident_name, u.apartment_number, c.name as creator_name
      FROM bills b
      LEFT JOIN users u ON b.resident_id = u.id
      LEFT JOIN users c ON b.created_by = c.id`;
    const params = [];
    const filters = [];

    if (req.user.role === 'resident') {
      filters.push('b.resident_id = ?');
      params.push(req.user.id);
    }

    if (search) {
      filters.push('(b.title LIKE ? OR u.name LIKE ? OR u.apartment_number LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) {
      filters.push('b.status = ?');
      params.push(status);
    }
    if (period) {
      filters.push('b.billing_period = ?');
      params.push(period);
    }

    if (filters.length > 0) {
      query += ' WHERE ' + filters.join(' AND ');
    }

    if (sort === 'amount') {
      query += ' ORDER BY b.amount DESC';
    } else if (sort === 'due') {
      query += ' ORDER BY b.due_date ASC';
    } else {
      query += ' ORDER BY b.created_at DESC';
    }

    const bills = db.prepare(query).all(...params);
    res.json(bills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export bills as CSV (admin) - MUST be before /api/bills/:id
app.get('/api/bills/export/csv', authenticateToken, adminOnly, (req, res) => {
  try {
    const { status, period } = req.query;
    let query = `SELECT b.*, u.name as resident_name, u.apartment_number
      FROM bills b LEFT JOIN users u ON b.resident_id = u.id`;
    const params = [];
    const filters = [];

    if (status) { filters.push('b.status = ?'); params.push(status); }
    if (period) { filters.push('b.billing_period = ?'); params.push(period); }
    if (filters.length > 0) query += ' WHERE ' + filters.join(' AND ');
    query += ' ORDER BY b.created_at DESC';

    const bills = db.prepare(query).all(...params);

    const csvHeader = 'Bill ID,Resident,Apartment,Title,Amount,Billing Period,Due Date,Status,Paid At,Paid Amount,Payment Method,Receipt Number\n';
    const csvRows = bills.map(b =>
      `"${b.id}","${b.resident_name || ''}","${b.apartment_number || ''}","${b.title}",${b.amount},"${b.billing_period}","${b.due_date}","${b.status}","${b.paid_at || ''}",${b.paid_amount || ''},"${b.payment_method || ''}","${b.receipt_number || ''}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=bills-${Date.now()}.csv`);
    res.send(csvHeader + csvRows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get billing summary (admin) - MUST be before /api/bills/:id
app.get('/api/bills/stats/summary', authenticateToken, adminOnly, (req, res) => {
  try {
    const totalBilled = db.prepare('SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM bills').get();
    const pending = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM bills WHERE status = 'Pending'").get();
    const paid = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(COALESCE(paid_amount, amount)), 0) as total FROM bills WHERE status = 'Paid'").get();
    const overdue = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM bills WHERE status = 'Pending' AND due_date < date('now')").get();
    const cancelled = db.prepare("SELECT COUNT(*) as count FROM bills WHERE status = 'Cancelled'").get();

    const byPeriod = db.prepare(`
      SELECT billing_period, COUNT(*) as count, SUM(amount) as total, SUM(CASE WHEN status = 'Paid' THEN 1 ELSE 0 END) as paid_count
      FROM bills GROUP BY billing_period ORDER BY billing_period DESC LIMIT 12
    `).all();

    res.json({
      totalBilled,
      pending,
      paid,
      overdue,
      cancelled: cancelled.count,
      byPeriod,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single bill with history
app.get('/api/bills/:id', authenticateToken, (req, res) => {
  try {
    const bill = db.prepare(`
      SELECT b.*, u.name as resident_name, u.apartment_number, u.email as resident_email,
             c.name as creator_name
      FROM bills b
      LEFT JOIN users u ON b.resident_id = u.id
      LEFT JOIN users c ON b.created_by = c.id
      WHERE b.id = ?
    `).get(req.params.id);

    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    if (req.user.role === 'resident' && bill.resident_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const history = db.prepare(`
      SELECT bh.*, u.name as actor_name
      FROM billing_history bh
      LEFT JOIN users u ON bh.changed_by = u.id
      WHERE bh.bill_id = ? ORDER BY bh.timestamp DESC
    `).all(bill.id);

    res.json({ ...bill, history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate bill (admin - single or bulk)
app.post('/api/bills', authenticateToken, adminOnly, (req, res) => {
  const { resident_id, resident_ids, title, description, amount, billing_period, due_date } = req.body;

  if (!title || !amount || !billing_period || !due_date) {
    return res.status(400).json({ error: 'Title, amount, billing period, and due date are required' });
  }

  try {
    const ids = resident_ids || (resident_id ? [resident_id] : []);
    if (ids.length === 0) return res.status(400).json({ error: 'At least one resident is required' });

    const created = [];
    const insertBill = db.prepare(`
      INSERT INTO bills (id, resident_id, title, description, amount, billing_period, due_date, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?)
    `);
    const insertHistory = db.prepare(`
      INSERT INTO billing_history (id, bill_id, changed_by, action, new_status, new_amount, note)
      VALUES (?, ?, ?, 'created', 'Pending', ?, ?)
    `);

    const tx = db.transaction(() => {
      for (const rId of ids) {
        const resident = db.prepare('SELECT id, name, email FROM users WHERE id = ? AND role = ?').get(rId, 'resident');
        if (!resident) continue;

        const billId = uuidv4();
        insertBill.run(billId, rId, title, description || null, amount, billing_period, due_date, req.user.id);
        insertHistory.run(uuidv4(), billId, req.user.id, amount, `Bill generated for ${resident.name}`);

        created.push({ id: billId, resident_name: resident.name });

        // Send email notification
        sendEmail(resident.email, resident.name, `New Bill: ${title}`,
          `A new bill of ₹${amount} has been generated for ${billing_period}. Due date: ${due_date}.`,
          'bill_created', billId);

        // Notification
        createNotification(rId, 'bill', `New Bill: ${title}`,
          `A new bill of ₹${amount} has been generated for ${billing_period}. Due: ${due_date}.`,
          billId, 'bill');
      }
    });

    tx();
    res.status(201).json({ message: `${created.length} bill(s) created`, bills: created });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Edit bill (admin)
app.put('/api/bills/:id', authenticateToken, adminOnly, (req, res) => {
  const { title, description, amount, billing_period, due_date } = req.body;
  const { id } = req.params;

  try {
    const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(id);
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    if (bill.status === 'Paid') return res.status(400).json({ error: 'Cannot edit a paid bill' });

    const updates = [];
    const values = [];

    if (title !== undefined) { updates.push('title = ?'); values.push(title); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description || null); }
    if (amount !== undefined) { updates.push('amount = ?'); values.push(amount); }
    if (billing_period !== undefined) { updates.push('billing_period = ?'); values.push(billing_period); }
    if (due_date !== undefined) { updates.push('due_date = ?'); values.push(due_date); }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    db.prepare(`UPDATE bills SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    // Record history
    db.prepare(`
      INSERT INTO billing_history (id, bill_id, changed_by, action, old_amount, new_amount, note)
      VALUES (?, ?, ?, 'updated', ?, ?, ?)
    `).run(uuidv4(), id, req.user.id, bill.amount, amount || bill.amount, 'Bill details updated');

    const updated = db.prepare('SELECT * FROM bills WHERE id = ?').get(id);
    res.json({ message: 'Bill updated', bill: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark bill as paid (admin)
app.put('/api/bills/:id/pay', authenticateToken, adminOnly, (req, res) => {
  const { payment_method, paid_amount, note } = req.body;
  const { id } = req.params;

  try {
    const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(id);
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    if (bill.status === 'Paid') return res.status(400).json({ error: 'Bill is already paid' });
    if (bill.status === 'Cancelled') return res.status(400).json({ error: 'Cannot mark cancelled bill as paid' });

    const receiptNumber = `RCT-${Date.now().toString(36).toUpperCase()}-${id.slice(0, 4).toUpperCase()}`;

    db.prepare(`
      UPDATE bills SET status = 'Paid', paid_at = CURRENT_TIMESTAMP, paid_amount = ?,
        payment_method = ?, receipt_number = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(paid_amount || bill.amount, payment_method || 'Cash', receiptNumber, id);

    db.prepare(`
      INSERT INTO billing_history (id, bill_id, changed_by, action, old_status, new_status, note)
      VALUES (?, ?, ?, 'paid', ?, 'Paid', ?)
    `).run(uuidv4(), id, req.user.id, bill.status, note || `Paid via ${payment_method || 'Cash'}`);

    // Notify resident
    const resident = db.prepare('SELECT email, name FROM users WHERE id = ?').get(bill.resident_id);
    sendEmail(resident.email, resident.name, `Payment Received: ${bill.title}`,
      `Your payment of ₹${paid_amount || bill.amount} has been recorded. Receipt: ${receiptNumber}`,
      'bill_paid', id);

    // Notification for resident
    createNotification(bill.resident_id, 'bill', `Payment Received: ${bill.title}`,
      `Your payment of ₹${paid_amount || bill.amount} has been recorded. Receipt: ${receiptNumber}`,
      id, 'bill');

    // Notify admins
    notifyAdmins('bill', 'Bill Paid', `${resident.name} paid ₹${paid_amount || bill.amount} for "${bill.title}"`, id, 'bill');

    res.json({ message: 'Bill marked as paid', receipt_number: receiptNumber });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel bill (admin)
app.put('/api/bills/:id/cancel', authenticateToken, adminOnly, (req, res) => {
  const { note } = req.body;
  const { id } = req.params;

  try {
    const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(id);
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    if (bill.status === 'Paid') return res.status(400).json({ error: 'Cannot cancel a paid bill' });
    if (bill.status === 'Cancelled') return res.status(400).json({ error: 'Bill is already cancelled' });

    db.prepare('UPDATE bills SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('Cancelled', id);

    db.prepare(`
      INSERT INTO billing_history (id, bill_id, changed_by, action, old_status, new_status, note)
      VALUES (?, ?, ?, 'cancelled', ?, 'Cancelled', ?)
    `).run(uuidv4(), id, req.user.id, bill.status, note || 'Bill cancelled by admin');

    // Notify resident
    createNotification(bill.resident_id, 'bill', `Bill Cancelled: ${bill.title}`,
      `Your bill "${bill.title}" of ₹${bill.amount} has been cancelled.`, id, 'bill');

    res.json({ message: 'Bill cancelled' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete bill (admin)
app.delete('/api/bills/:id', authenticateToken, adminOnly, (req, res) => {
  try {
    const bill = db.prepare('SELECT * FROM bills WHERE id = ?').get(req.params.id);
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    if (bill.status === 'Paid') return res.status(400).json({ error: 'Cannot delete a paid bill' });

    db.prepare('DELETE FROM billing_history WHERE bill_id = ?').run(req.params.id);
    db.prepare('DELETE FROM bills WHERE id = ?').run(req.params.id);
    res.json({ message: 'Bill deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== VISITOR MANAGEMENT APIs ====================

// Helper: record visitor history
function logVisitorHistory(visitorId, changedBy, action, oldStatus, newStatus, note) {
  db.prepare(`
    INSERT INTO visitor_history (id, visitor_id, changed_by, action, old_status, new_status, note)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), visitorId, changedBy, action, oldStatus, newStatus, note || null);
}

// List visitors (role-based)
app.get('/api/visitors', authenticateToken, (req, res) => {
  try {
    const { search, status, date, sort } = req.query;
    let query = `SELECT v.*, u.name as resident_name, u.apartment_number,
      ab.name as approved_by_name, rb.name as rejected_by_name,
      ci.name as checked_in_by_name, co.name as checked_out_by_name
      FROM visitors v
      LEFT JOIN users u ON v.resident_id = u.id
      LEFT JOIN users ab ON v.approved_by = ab.id
      LEFT JOIN users rb ON v.rejected_by = rb.id
      LEFT JOIN users ci ON v.checked_in_by = ci.id
      LEFT JOIN users co ON v.checked_out_by = co.id`;
    const params = [];
    const filters = [];

    // Residents see only their own visitors
    if (req.user.role === 'resident') {
      filters.push('v.resident_id = ?');
      params.push(req.user.id);
    }

    // Security sees only approved + checked-in + checked-out (active visitors)
    if (req.user.role === 'security') {
      filters.push("v.status IN ('Approved', 'Checked-In', 'Checked-Out')");
    }

    if (search) {
      filters.push('(v.name LIKE ? OR v.phone LIKE ? OR v.vehicle_number LIKE ? OR u.name LIKE ? OR u.apartment_number LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) {
      filters.push('v.status = ?');
      params.push(status);
    }
    if (date) {
      filters.push('v.visit_date = ?');
      params.push(date);
    }

    if (filters.length > 0) query += ' WHERE ' + filters.join(' AND ');

    if (sort === 'date') query += ' ORDER BY v.visit_date DESC, v.created_at DESC';
    else if (sort === 'name') query += ' ORDER BY v.name ASC';
    else query += ' ORDER BY v.created_at DESC';

    const visitors = db.prepare(query).all(...params);
    res.json(visitors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Visitor stats (admin/security) - MUST be before /api/visitors/:id
app.get('/api/visitors/stats/summary', authenticateToken, adminOrSecurity, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const total = db.prepare('SELECT COUNT(*) as count FROM visitors').get();
    const pending = db.prepare("SELECT COUNT(*) as count FROM visitors WHERE status = 'Pending'").get();
    const approved = db.prepare("SELECT COUNT(*) as count FROM visitors WHERE status = 'Approved'").get();
    const checkedIn = db.prepare("SELECT COUNT(*) as count FROM visitors WHERE status = 'Checked-In'").get();
    const todayVisitors = db.prepare('SELECT COUNT(*) as count FROM visitors WHERE visit_date = ?').get(today);
    const todayCheckedIn = db.prepare("SELECT COUNT(*) as count FROM visitors WHERE visit_date = ? AND status IN ('Checked-In', 'Checked-Out')").get(today);

    res.json({ total, pending, approved, checkedIn, todayVisitors, todayCheckedIn });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single visitor with history
app.get('/api/visitors/:id', authenticateToken, (req, res) => {
  try {
    const visitor = db.prepare(`
      SELECT v.*, u.name as resident_name, u.apartment_number,
        ab.name as approved_by_name, rb.name as rejected_by_name,
        ci.name as checked_in_by_name, co.name as checked_out_by_name
      FROM visitors v
      LEFT JOIN users u ON v.resident_id = u.id
      LEFT JOIN users ab ON v.approved_by = ab.id
      LEFT JOIN users rb ON v.rejected_by = rb.id
      LEFT JOIN users ci ON v.checked_in_by = ci.id
      LEFT JOIN users co ON v.checked_out_by = co.id
      WHERE v.id = ?
    `).get(req.params.id);

    if (!visitor) return res.status(404).json({ error: 'Visitor not found' });
    if (req.user.role === 'resident' && visitor.resident_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const history = db.prepare(`
      SELECT vh.*, u.name as actor_name
      FROM visitor_history vh
      LEFT JOIN users u ON vh.changed_by = u.id
      WHERE vh.visitor_id = ? ORDER BY vh.timestamp DESC
    `).all(visitor.id);

    res.json({ ...visitor, history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register visitor (resident)
app.post('/api/visitors', authenticateToken, (req, res) => {
  const { name, phone, vehicle_number, purpose, visit_date, expected_time } = req.body;

  if (!name || !purpose || !visit_date) {
    return res.status(400).json({ error: 'Name, purpose, and visit date are required' });
  }

  try {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO visitors (id, resident_id, name, phone, vehicle_number, purpose, visit_date, expected_time, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
    `).run(id, req.user.id, name, phone || null, vehicle_number || null, purpose, visit_date, expected_time || null);

    logVisitorHistory(id, req.user.id, 'registered', null, 'Pending', `Visitor registered by resident`);

    const visitor = db.prepare('SELECT * FROM visitors WHERE id = ?').get(id);
    res.status(201).json({ message: 'Visitor registered successfully', visitor });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve visitor (admin)
app.put('/api/visitors/:id/approve', authenticateToken, adminOnly, (req, res) => {
  const { note } = req.body;
  try {
    const visitor = db.prepare('SELECT * FROM visitors WHERE id = ?').get(req.params.id);
    if (!visitor) return res.status(404).json({ error: 'Visitor not found' });
    if (visitor.status !== 'Pending') return res.status(400).json({ error: `Cannot approve visitor with status: ${visitor.status}` });

    db.prepare(`
      UPDATE visitors SET status = 'Approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.user.id, req.params.id);

    logVisitorHistory(req.params.id, req.user.id, 'approved', 'Pending', 'Approved', note || 'Visitor approved by admin');

    // Notify resident
    createNotification(visitor.resident_id, 'visitor', 'Visitor Approved',
      `Your visitor "${visitor.name}" has been approved.`, req.params.id, 'visitor');

    res.json({ message: 'Visitor approved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reject visitor (admin)
app.put('/api/visitors/:id/reject', authenticateToken, adminOnly, (req, res) => {
  const { reason, note } = req.body;
  try {
    const visitor = db.prepare('SELECT * FROM visitors WHERE id = ?').get(req.params.id);
    if (!visitor) return res.status(404).json({ error: 'Visitor not found' });
    if (visitor.status !== 'Pending') return res.status(400).json({ error: `Cannot reject visitor with status: ${visitor.status}` });

    db.prepare(`
      UPDATE visitors SET status = 'Rejected', rejected_by = ?, rejected_at = CURRENT_TIMESTAMP,
        rejection_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(req.user.id, reason || 'Rejected by admin', req.params.id);

    logVisitorHistory(req.params.id, req.user.id, 'rejected', 'Pending', 'Rejected', reason || note || 'Visitor rejected by admin');

    // Notify resident
    createNotification(visitor.resident_id, 'visitor', 'Visitor Rejected',
      `Your visitor "${visitor.name}" has been rejected. Reason: ${reason || 'No reason given'}`, req.params.id, 'visitor');

    res.json({ message: 'Visitor rejected' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check-in visitor (security)
app.put('/api/visitors/:id/checkin', authenticateToken, securityOnly, (req, res) => {
  const { note } = req.body;
  try {
    const visitor = db.prepare('SELECT * FROM visitors WHERE id = ?').get(req.params.id);
    if (!visitor) return res.status(404).json({ error: 'Visitor not found' });
    if (visitor.status !== 'Approved') return res.status(400).json({ error: `Cannot check-in visitor with status: ${visitor.status}` });

    db.prepare(`
      UPDATE visitors SET status = 'Checked-In', checked_in_at = CURRENT_TIMESTAMP,
        checked_in_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(req.user.id, req.params.id);

    logVisitorHistory(req.params.id, req.user.id, 'checked_in', 'Approved', 'Checked-In', note || 'Visitor checked in by security');

    // Notify resident
    createNotification(visitor.resident_id, 'visitor', 'Visitor Checked In',
      `Your visitor "${visitor.name}" has been checked in.`, req.params.id, 'visitor');

    res.json({ message: 'Visitor checked in' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check-out visitor (security)
app.put('/api/visitors/:id/checkout', authenticateToken, securityOnly, (req, res) => {
  const { note } = req.body;
  try {
    const visitor = db.prepare('SELECT * FROM visitors WHERE id = ?').get(req.params.id);
    if (!visitor) return res.status(404).json({ error: 'Visitor not found' });
    if (visitor.status !== 'Checked-In') return res.status(400).json({ error: `Cannot check-out visitor with status: ${visitor.status}` });

    db.prepare(`
      UPDATE visitors SET status = 'Checked-Out', checked_out_at = CURRENT_TIMESTAMP,
        checked_out_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(req.user.id, req.params.id);

    logVisitorHistory(req.params.id, req.user.id, 'checked_out', 'Checked-In', 'Checked-Out', note || 'Visitor checked out by security');

    // Notify resident
    createNotification(visitor.resident_id, 'visitor', 'Visitor Checked Out',
      `Your visitor "${visitor.name}" has been checked out.`, req.params.id, 'visitor');

    res.json({ message: 'Visitor checked out' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete visitor (resident can delete own pending, admin can delete any)
app.delete('/api/visitors/:id', authenticateToken, (req, res) => {
  try {
    const visitor = db.prepare('SELECT * FROM visitors WHERE id = ?').get(req.params.id);
    if (!visitor) return res.status(404).json({ error: 'Visitor not found' });

    if (req.user.role === 'resident') {
      if (visitor.resident_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });
      if (visitor.status !== 'Pending') return res.status(400).json({ error: 'Can only delete pending visitors' });
    }

    db.prepare('DELETE FROM visitor_history WHERE visitor_id = ?').run(req.params.id);
    db.prepare('DELETE FROM visitors WHERE id = ?').run(req.params.id);
    res.json({ message: 'Visitor deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ANALYTICS APIs ====================

// Overall analytics summary
app.get('/api/analytics/summary', authenticateToken, adminOnly, (req, res) => {
  try {
    const totalComplaints = db.prepare('SELECT COUNT(*) as count FROM complaints').get();
    const totalResidents = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'resident'").get();
    const totalStaff = db.prepare("SELECT COUNT(*) as count FROM staff WHERE is_active = 1").get();
    const totalNotices = db.prepare('SELECT COUNT(*) as count FROM notices').get();
    const totalBills = db.prepare('SELECT COUNT(*) as count FROM bills').get();
    const totalBilledAmount = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM bills').get();
    const totalCollected = db.prepare("SELECT COALESCE(SUM(COALESCE(paid_amount, amount)), 0) as total FROM bills WHERE status = 'Paid'").get();
    const totalVisitors = db.prepare('SELECT COUNT(*) as count FROM visitors').get();
    const resolvedComplaints = db.prepare("SELECT COUNT(*) as count FROM complaints WHERE status IN ('Resolved', 'Confirmed')").get();
    const openComplaints = db.prepare("SELECT COUNT(*) as count FROM complaints WHERE status NOT IN ('Resolved', 'Confirmed')").get();

    res.json({
      totalComplaints: totalComplaints.count,
      totalResidents: totalResidents.count,
      totalStaff: totalStaff.count,
      totalNotices: totalNotices.count,
      totalBills: totalBills.count,
      totalBilledAmount: totalBilledAmount.total,
      totalCollected: totalCollected.total,
      totalVisitors: totalVisitors.count,
      resolvedComplaints: resolvedComplaints.count,
      openComplaints: openComplaints.count,
      resolutionRate: totalComplaints.count > 0 ? Math.round((resolvedComplaints.count / totalComplaints.count) * 100) : 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Monthly complaints trend (last 12 months)
app.get('/api/analytics/monthly-complaints', authenticateToken, adminOnly, (req, res) => {
  try {
    const months = db.prepare(`
      SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
      FROM complaints
      WHERE created_at >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month ASC
    `).all();

    const resolved = db.prepare(`
      SELECT strftime('%Y-%m', resolved_at) as month, COUNT(*) as count
      FROM complaints
      WHERE resolved_at IS NOT NULL AND resolved_at >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', resolved_at)
      ORDER BY month ASC
    `).all();

    const resolvedMap = {};
    resolved.forEach(r => { resolvedMap[r.month] = r.count; });

    const result = months.map(m => ({
      month: m.month,
      label: new Date(m.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      complaints: m.count,
      resolved: resolvedMap[m.month] || 0,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Category breakdown
app.get('/api/analytics/category-breakdown', authenticateToken, adminOnly, (req, res) => {
  try {
    const data = db.prepare(`
      SELECT category, COUNT(*) as count,
        SUM(CASE WHEN status IN ('Resolved', 'Confirmed') THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN status NOT IN ('Resolved', 'Confirmed') THEN 1 ELSE 0 END) as open
      FROM complaints
      GROUP BY category
      ORDER BY count DESC
    `).all();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Priority breakdown
app.get('/api/analytics/priority-breakdown', authenticateToken, adminOnly, (req, res) => {
  try {
    const data = db.prepare(`
      SELECT priority, COUNT(*) as count,
        ROUND(AVG(CASE WHEN resolved_at IS NOT NULL THEN
          (julianday(resolved_at) - julianday(created_at)) * 24
        END), 1) as avg_hours
      FROM complaints
      GROUP BY priority
      ORDER BY CASE priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 3 END
    `).all();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resolution time analytics
app.get('/api/analytics/resolution-time', authenticateToken, adminOnly, (req, res) => {
  try {
    const overall = db.prepare(`
      SELECT
        ROUND(AVG(julianday(resolved_at) - julianday(created_at)), 1) as avg_days,
        ROUND(MIN(julianday(resolved_at) - julianday(created_at)), 1) as min_days,
        ROUND(MAX(julianday(resolved_at) - julianday(created_at)), 1) as max_days,
        COUNT(*) as resolved_count
      FROM complaints
      WHERE resolved_at IS NOT NULL
    `).get();

    const byCategory = db.prepare(`
      SELECT category,
        ROUND(AVG(julianday(resolved_at) - julianday(created_at)), 1) as avg_days,
        COUNT(*) as count
      FROM complaints
      WHERE resolved_at IS NOT NULL
      GROUP BY category
      ORDER BY avg_days DESC
    `).all();

    const monthly = db.prepare(`
      SELECT strftime('%Y-%m', resolved_at) as month,
        ROUND(AVG(julianday(resolved_at) - julianday(created_at)), 1) as avg_days,
        COUNT(*) as count
      FROM complaints
      WHERE resolved_at IS NOT NULL AND resolved_at >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', resolved_at)
      ORDER BY month ASC
    `).all();

    const monthlyMap = {};
    monthly.forEach(m => {
      monthlyMap[m.month] = { avg_days: m.avg_days, count: m.count };
    });

    res.json({ overall, byCategory, monthly: monthly.map(m => ({
      month: m.month,
      label: new Date(m.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      avgDays: m.avg_days,
      count: m.count,
    }))});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resident growth
app.get('/api/analytics/resident-growth', authenticateToken, adminOnly, (req, res) => {
  try {
    const growth = db.prepare(`
      SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
      FROM users
      WHERE role = 'resident'
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month ASC
    `).all();

    let cumulative = 0;
    const result = growth.map(g => {
      cumulative += g.count;
      return {
        month: g.month,
        label: new Date(g.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        newResidents: g.count,
        totalResidents: cumulative,
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== NOTIFICATION SYSTEM ====================

// Helper: create notification
function createNotification(userId, type, title, message, referenceId, referenceType) {
  try {
    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, reference_id, reference_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), userId, type, title, message, referenceId || null, referenceType || null);
  } catch (e) { console.error('Notification error:', e.message); }
}

// Helper: notify all admins
function notifyAdmins(type, title, message, refId, refType) {
  const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all();
  admins.forEach(a => createNotification(a.id, type, title, message, refId, refType));
}

// Get notifications (user's own)
app.get('/api/notifications', authenticateToken, (req, res) => {
  try {
    const { unread_only } = req.query;
    let query = 'SELECT * FROM notifications WHERE user_id = ?';
    const params = [req.user.id];
    if (unread_only === 'true') { query += ' AND is_read = 0'; }
    query += ' ORDER BY created_at DESC LIMIT 50';
    const notifications = db.prepare(query).all(...params);
    const unread = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id);
    res.json({ notifications, unreadCount: unread.count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unread count only (lightweight)
app.get('/api/notifications/unread-count', authenticateToken, (req, res) => {
  try {
    const unread = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id);
    res.json({ count: unread.count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', authenticateToken, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all as read
app.put('/api/notifications/read-all', authenticateToken, (req, res) => {
  try {
    const result = db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0').run(req.user.id);
    res.json({ message: 'All notifications marked as read', count: result.changes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete notification
app.delete('/api/notifications/:id', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== DOCUMENT CENTER ====================

// Upload document (admin can upload, all authenticated users can view)
app.post('/api/documents', authenticateToken, adminOnly, upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { category, description } = req.body;
    const id = uuidv4();
    db.prepare(`
      INSERT INTO documents (id, uploaded_by, name, file_path, file_type, file_size, category, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user.id, req.file.originalname, `/uploads/${req.file.filename}`,
      req.file.mimetype, req.file.size, category || 'General', description || null);
    const doc = db.prepare('SELECT d.*, u.name as uploader_name FROM documents d LEFT JOIN users u ON d.uploaded_by = u.id WHERE d.id = ?').get(id);
    res.status(201).json({ message: 'Document uploaded', document: doc });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List/search documents
app.get('/api/documents', authenticateToken, (req, res) => {
  try {
    const { search, category, type } = req.query;
    let query = `SELECT d.*, u.name as uploader_name FROM documents d LEFT JOIN users u ON d.uploaded_by = u.id`;
    const params = [];
    const filters = [];

    if (search) {
      filters.push('(d.name LIKE ? OR d.description LIKE ? OR u.name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (category) { filters.push('d.category = ?'); params.push(category); }
    if (type) { filters.push('d.file_type LIKE ?'); params.push(`%${type}%`); }

    if (filters.length > 0) query += ' WHERE ' + filters.join(' AND ');
    query += ' ORDER BY d.created_at DESC';

    const docs = db.prepare(query).all(...params);
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single document
app.get('/api/documents/:id', authenticateToken, (req, res) => {
  try {
    const doc = db.prepare('SELECT d.*, u.name as uploader_name FROM documents d LEFT JOIN users u ON d.uploaded_by = u.id WHERE d.id = ?').get(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete document
app.delete('/api/documents/:id', authenticateToken, adminOnly, (req, res) => {
  try {
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    const filePath = path.join(__dirname, doc.file_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
    res.json({ message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    application: 'Society Maintenance Tracker Backend',
    status: 'Running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/api/health', (req, res) => {
  let dbStatus = 'connected';
  try {
    db.prepare('SELECT 1').get();
  } catch {
    dbStatus = 'disconnected';
  }
  res.json({
    success: true,
    status: 'healthy',
    database: dbStatus,
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// ==================== GLOBAL ERROR HANDLERS ====================

// 404 handler — must be AFTER all routes
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});

// Global Express error handler — must be LAST middleware
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err.message);

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large. Maximum size is 5MB.' });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Unexpected file field' });
  }

  res.status(500).json({ error: 'Internal server error' });
});

// ==================== PROCESS ERROR HANDLERS ====================

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  // Give the server time to finish pending requests before exiting
  setTimeout(() => process.exit(1), 1000);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
