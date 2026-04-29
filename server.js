const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");
const { DatabaseSync } = require("node:sqlite");

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "127.0.0.1";
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const UPLOAD_DIR = path.join(__dirname, "uploads");
const LEGACY_EMPLOYEE_FILE = path.join(DATA_DIR, "employees.json");
const DB_FILE = path.join(DATA_DIR, "ezemployee.db");
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const BODY_LIMIT_BYTES = 8_000_000;
const DEFAULT_EMPLOYEE_PASSWORD = "employee123";
const sessions = new Map();

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

const ROLE_RULES = {
  Admin: {
    manageEmployees: true,
    deleteEmployees: true,
    manageAttendance: true,
    reviewLeaves: false,
    createLeaves: true,
  },
  HR: {
    manageEmployees: true,
    deleteEmployees: false,
    manageAttendance: true,
    reviewLeaves: false,
    createLeaves: true,
  },
  Manager: {
    manageEmployees: false,
    deleteEmployees: false,
    manageAttendance: true,
    reviewLeaves: true,
    createLeaves: true,
  },
  Employee: {
    manageEmployees: false,
    deleteEmployees: false,
    manageAttendance: false,
    reviewLeaves: false,
    createLeaves: false,
    selfAttendance: true,
    selfLeave: true,
  },
};

let db;

function nowIso() {
  return new Date().toISOString();
}

function passwordHash(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = String(storedHash || "").split(":");
  if (!salt || !hash) {
    return false;
  }
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(derived, "hex"));
}

function toSlug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeStatus(value, fallback) {
  const allowed = new Set(["Active", "Inactive"]);
  return allowed.has(value) ? value : fallback;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > BODY_LIMIT_BYTES) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function parseCookies(cookieHeader = "") {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separatorIndex = part.indexOf("=");
        const key = separatorIndex >= 0 ? part.slice(0, separatorIndex) : part;
        const value = separatorIndex >= 0 ? part.slice(separatorIndex + 1) : "";
        return [key, decodeURIComponent(value)];
      })
  );
}

function createSession(user) {
  const token = crypto.randomBytes(24).toString("hex");
  sessions.set(token, {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    accountType: user.accountType,
    employeeId: user.employeeId || null,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
  return token;
}

function clearSession(req) {
  const token = parseCookies(req.headers.cookie).ezemployee_session;
  if (token) {
    sessions.delete(token);
  }
}

function getSessionToken(req) {
  return parseCookies(req.headers.cookie).ezemployee_session;
}

function getSessionUser(req) {
  const token = getSessionToken(req);
  if (!token || !sessions.has(token)) {
    return null;
  }
  const session = sessions.get(token);
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }
  return session;
}

function updateSessionUser(req, updates = {}) {
  const token = getSessionToken(req);
  if (!token || !sessions.has(token)) {
    return;
  }
  const session = sessions.get(token);
  sessions.set(token, {
    ...session,
    ...updates,
  });
}

function sendJson(res, statusCode, payload, headers = {}) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    ...headers,
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, text, headers = {}) {
  res.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    ...headers,
  });
  res.end(text);
}

function requireAuth(req, res) {
  const user = getSessionUser(req);
  if (!user) {
    sendJson(res, 401, { error: "Authentication required." });
    return null;
  }
  return user;
}

function requirePermission(req, res, permission) {
  const user = requireAuth(req, res);
  if (!user) {
    return null;
  }
  if (!getPermissionSet(user)?.[permission]) {
    sendJson(res, 403, { error: "You do not have permission for this action." });
    return null;
  }
  return user;
}

function serializeUser(user) {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    accountType: user.accountType,
    employeeId: user.employeeId || null,
  };
}

function getPermissionSet(user) {
  return ROLE_RULES[user.role] || ROLE_RULES.Employee;
}

function queryAll(sql, params = {}) {
  return db.prepare(sql).all(params);
}

function queryGet(sql, params = {}) {
  return db.prepare(sql).get(params);
}

function queryRun(sql, params = {}) {
  return db.prepare(sql).run(params);
}

function logActivity(actorUsername, action, entityType, entityId, description) {
  queryRun(
    `
      INSERT INTO activity_logs (actor_username, action, entity_type, entity_id, description, created_at)
      VALUES ($actorUsername, $action, $entityType, $entityId, $description, $createdAt)
    `,
    {
      $actorUsername: actorUsername,
      $action: action,
      $entityType: entityType,
      $entityId: String(entityId),
      $description: description,
      $createdAt: nowIso(),
    }
  );
}

async function ensureDirectories() {
  await fs.promises.mkdir(DATA_DIR, { recursive: true });
  await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
}

function initializeDatabase() {
  db = new DatabaseSync(DB_FILE);
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      contact_number TEXT NOT NULL,
      department TEXT,
      role_title TEXT,
      joined_on TEXT,
      status TEXT NOT NULL DEFAULT 'Active',
      notes TEXT,
      photo_path TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      created_by TEXT,
      updated_by TEXT
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      attendance_date TEXT NOT NULL,
      check_in TEXT,
      check_out TEXT,
      status TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      created_by TEXT,
      UNIQUE(employee_id, attendance_date),
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS leave_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      leave_type TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      reason TEXT,
      status TEXT NOT NULL DEFAULT 'Pending',
      reviewer_notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      created_by TEXT,
      reviewed_by TEXT,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_username TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

function ensureUserTableColumns() {
  const columns = queryAll("PRAGMA table_info(users)");
  const names = new Set(columns.map((column) => column.name));

  if (!names.has("account_type")) {
    db.exec("ALTER TABLE users ADD COLUMN account_type TEXT NOT NULL DEFAULT 'staff'");
  }
  if (!names.has("employee_id")) {
    db.exec("ALTER TABLE users ADD COLUMN employee_id INTEGER");
  }
  if (!names.has("is_active")) {
    db.exec("ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1");
  }
  if (!names.has("reset_code")) {
    db.exec("ALTER TABLE users ADD COLUMN reset_code TEXT");
  }
  if (!names.has("reset_code_expires_at")) {
    db.exec("ALTER TABLE users ADD COLUMN reset_code_expires_at TEXT");
  }

  queryRun("UPDATE users SET account_type = COALESCE(account_type, 'staff')");
  queryRun("UPDATE users SET is_active = COALESCE(is_active, 1)");
}

function seedUsers() {
  const count = queryGet("SELECT COUNT(*) AS count FROM users").count;
  if (count > 0) {
    return;
  }

  const demoUsers = [
    { username: "admin", fullName: "Admin User", role: "Admin", password: "admin123" },
    { username: "hrlead", fullName: "Priya Sharma", role: "HR", password: "hr123" },
    { username: "manager", fullName: "Rohan Mehta", role: "Manager", password: "manager123" },
  ];

  for (const user of demoUsers) {
    queryRun(
      `
        INSERT INTO users (username, full_name, role, password_hash, created_at, account_type, employee_id, is_active)
        VALUES ($username, $fullName, $role, $passwordHash, $createdAt, 'staff', NULL, 1)
      `,
      {
        $username: user.username,
        $fullName: user.fullName,
        $role: user.role,
        $passwordHash: passwordHash(user.password),
        $createdAt: nowIso(),
      }
    );
  }
}

function syncEmployeeAccount(employee) {
  const username = String(employee.employee_code || "").toLowerCase();
  const existing = queryGet(
    "SELECT * FROM users WHERE account_type = 'employee' AND employee_id = $employeeId",
    { $employeeId: employee.id }
  );

  if (existing) {
    queryRun(
      `
        UPDATE users
        SET username = $username,
            full_name = $fullName,
            role = 'Employee',
            account_type = 'employee',
            is_active = CASE WHEN $status = 'Inactive' THEN 0 ELSE 1 END
        WHERE id = $id
      `,
      {
        $id: existing.id,
        $username: username,
        $fullName: employee.name,
        $status: employee.status,
      }
    );
    return;
  }

  const usernameConflict = queryGet("SELECT id FROM users WHERE username = $username", {
    $username: username,
  });
  const finalUsername = usernameConflict ? `${username}-emp` : username;

  queryRun(
    `
      INSERT INTO users (username, full_name, role, password_hash, created_at, account_type, employee_id, is_active)
      VALUES ($username, $fullName, 'Employee', $passwordHash, $createdAt, 'employee', $employeeId, $isActive)
    `,
    {
      $username: finalUsername,
      $fullName: employee.name,
      $passwordHash: passwordHash(DEFAULT_EMPLOYEE_PASSWORD),
      $createdAt: nowIso(),
      $employeeId: employee.id,
      $isActive: employee.status === "Inactive" ? 0 : 1,
    }
  );
}

function syncAllEmployeeAccounts() {
  const employees = queryAll("SELECT id, employee_code, name, status FROM employees");
  employees.forEach(syncEmployeeAccount);
}

function ensureStaffLinkedProfiles() {
  const staffProfiles = [
    {
      username: "hrlead",
      employeeCode: "HR201",
      name: "Priya Sharma",
      email: "priya.sharma@ezemployee.com",
      contactNumber: "+91 9810011223",
      department: "Human Resources",
      roleTitle: "HR Lead",
      joinedOn: "2025-07-01",
      status: "Active",
      notes: "Linked staff employee profile for HR leave and attendance workflows.",
    },
    {
      username: "manager",
      employeeCode: "MGR301",
      name: "Rohan Mehta",
      email: "rohan.mehta@ezemployee.com",
      contactNumber: "+91 9810011224",
      department: "Operations",
      roleTitle: "Delivery Manager",
      joinedOn: "2025-06-15",
      status: "Active",
      notes: "Linked staff employee profile for manager self-service and approvals.",
    },
  ];

  for (const profile of staffProfiles) {
    let employee = queryGet(
      `
        SELECT *
        FROM employees
        WHERE employee_code = $employeeCode OR email = $email
      `,
      {
        $employeeCode: profile.employeeCode,
        $email: profile.email,
      }
    );

    if (!employee) {
      const timestamp = nowIso();
      const result = queryRun(
        `
          INSERT INTO employees (
            employee_code, name, email, contact_number, department, role_title,
            joined_on, status, notes, photo_path, created_at, updated_at, created_by, updated_by
          )
          VALUES (
            $employeeCode, $name, $email, $contactNumber, $department, $roleTitle,
            $joinedOn, $status, $notes, '', $createdAt, $updatedAt, 'system', 'system'
          )
        `,
        {
          $employeeCode: profile.employeeCode,
          $name: profile.name,
          $email: profile.email,
          $contactNumber: profile.contactNumber,
          $department: profile.department,
          $roleTitle: profile.roleTitle,
          $joinedOn: profile.joinedOn,
          $status: profile.status,
          $notes: profile.notes,
          $createdAt: timestamp,
          $updatedAt: timestamp,
        }
      );
      employee = getEmployeeById(result.lastInsertRowid);
    }

    queryRun(
      `
        UPDATE users
        SET employee_id = $employeeId,
            full_name = $fullName
        WHERE username = $username AND account_type = 'staff'
      `,
      {
        $employeeId: employee.id,
        $fullName: profile.name,
        $username: profile.username,
      }
    );
  }
}

async function migrateLegacyEmployees() {
  const employeeCount = queryGet("SELECT COUNT(*) AS count FROM employees").count;
  if (employeeCount > 0) {
    return;
  }
  if (!fs.existsSync(LEGACY_EMPLOYEE_FILE)) {
    return;
  }

  try {
    const raw = await fs.promises.readFile(LEGACY_EMPLOYEE_FILE, "utf8");
    const employees = JSON.parse(raw);
    if (!Array.isArray(employees) || employees.length === 0) {
      return;
    }

    for (const employee of employees) {
      const createdAt = employee.createdAt || nowIso();
      const updatedAt = employee.updatedAt || createdAt;
      queryRun(
        `
          INSERT INTO employees (
            employee_code, name, email, contact_number, department, role_title,
            joined_on, status, notes, photo_path, created_at, updated_at, created_by, updated_by
          )
          VALUES (
            $employeeCode, $name, $email, $contactNumber, $department, $roleTitle,
            $joinedOn, $status, $notes, $photoPath, $createdAt, $updatedAt, $createdBy, $updatedBy
          )
        `,
        {
          $employeeCode: employee.employeeId,
          $name: employee.name,
          $email: employee.email,
          $contactNumber: employee.contactNumber,
          $department: employee.department || "",
          $roleTitle: employee.role || "",
          $joinedOn: employee.joinedOn || "",
          $status: normalizeStatus(employee.status, "Active"),
          $notes: employee.notes || "",
          $photoPath: employee.photoPath || "",
          $createdAt: createdAt,
          $updatedAt: updatedAt,
          $createdBy: employee.createdBy || "admin",
          $updatedBy: employee.createdBy || "admin",
        }
      );
    }
  } catch {
    // Ignore malformed legacy data and continue with seed data.
  }
}

function seedEmployeesAndOperations() {
  const employeeCount = queryGet("SELECT COUNT(*) AS count FROM employees").count;
  if (employeeCount === 0) {
    const createdAt = nowIso();
    const sampleEmployees = [
      {
        employeeCode: "EMP101",
        name: "Aarav Mehta",
        email: "aarav.mehta@ezemployee.com",
        contactNumber: "+91 9876543210",
        department: "Engineering",
        roleTitle: "Backend Engineer",
        joinedOn: "2025-11-18",
        status: "Active",
        notes: "Owns platform APIs and integration work.",
      },
      {
        employeeCode: "EMP102",
        name: "Sana Kapoor",
        email: "sana.kapoor@ezemployee.com",
        contactNumber: "+91 9123456780",
        department: "Human Resources",
        roleTitle: "HR Specialist",
        joinedOn: "2025-09-03",
        status: "Active",
        notes: "Leads onboarding and policy administration.",
      },
      {
        employeeCode: "EMP103",
        name: "Vihaan Nair",
        email: "vihaan.nair@ezemployee.com",
        contactNumber: "+91 9988776655",
        department: "Design",
        roleTitle: "Product Designer",
        joinedOn: "2026-01-14",
        status: "Inactive",
        notes: "Currently on long-term leave status.",
      },
      {
        employeeCode: "EMP104",
        name: "Meera Sethi",
        email: "meera.sethi@ezemployee.com",
        contactNumber: "+91 9000011111",
        department: "Finance",
        roleTitle: "Finance Analyst",
        joinedOn: "2025-08-20",
        status: "Active",
        notes: "Handles payroll reconciliation and reporting.",
      },
    ];

    for (const employee of sampleEmployees) {
      queryRun(
        `
          INSERT INTO employees (
            employee_code, name, email, contact_number, department, role_title,
            joined_on, status, notes, photo_path, created_at, updated_at, created_by, updated_by
          )
          VALUES (
            $employeeCode, $name, $email, $contactNumber, $department, $roleTitle,
            $joinedOn, $status, $notes, $photoPath, $createdAt, $updatedAt, $createdBy, $updatedBy
          )
        `,
        {
          $employeeCode: employee.employeeCode,
          $name: employee.name,
          $email: employee.email,
          $contactNumber: employee.contactNumber,
          $department: employee.department,
          $roleTitle: employee.roleTitle,
          $joinedOn: employee.joinedOn,
          $status: employee.status,
          $notes: employee.notes,
          $photoPath: "",
          $createdAt: createdAt,
          $updatedAt: createdAt,
          $createdBy: "admin",
          $updatedBy: "admin",
        }
      );
    }
  }

  const attendanceCount = queryGet("SELECT COUNT(*) AS count FROM attendance").count;
  if (attendanceCount === 0) {
    const employees = queryAll("SELECT id FROM employees ORDER BY id ASC LIMIT 4");
    const today = new Date();
    const statuses = [
      ["Present", "Present", "Remote", "On Leave"],
      ["Present", "Present", "Present", "Present"],
      ["Remote", "Present", "Present", "Absent"],
      ["Present", "Remote", "Present", "Present"],
      ["Present", "Present", "Absent", "Present"],
    ];

    for (let dayIndex = 0; dayIndex < 5; dayIndex += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - dayIndex);
      const dateIso = date.toISOString().slice(0, 10);
      employees.forEach((employee, employeeIndex) => {
        const status = statuses[dayIndex][employeeIndex];
        queryRun(
          `
            INSERT INTO attendance (
              employee_id, attendance_date, check_in, check_out, status, notes,
              created_at, updated_at, created_by
            )
            VALUES (
              $employeeId, $attendanceDate, $checkIn, $checkOut, $status, $notes,
              $createdAt, $updatedAt, $createdBy
            )
          `,
          {
            $employeeId: employee.id,
            $attendanceDate: dateIso,
            $checkIn: status === "Absent" ? "" : "09:30",
            $checkOut: status === "Absent" ? "" : "18:15",
            $status: status,
            $notes: status === "Remote" ? "Remote work schedule" : "",
            $createdAt: nowIso(),
            $updatedAt: nowIso(),
            $createdBy: "admin",
          }
        );
      });
    }
  }

  const leaveCount = queryGet("SELECT COUNT(*) AS count FROM leave_requests").count;
  if (leaveCount === 0) {
    const employeeRows = queryAll("SELECT id, employee_code FROM employees ORDER BY id ASC LIMIT 3");
    const leaveRows = [
      {
        employeeId: employeeRows[0]?.id,
        leaveType: "Annual Leave",
        startDate: "2026-05-02",
        endDate: "2026-05-05",
        reason: "Family travel",
        status: "Approved",
        reviewerNotes: "Approved for planned travel.",
      },
      {
        employeeId: employeeRows[1]?.id,
        leaveType: "Sick Leave",
        startDate: "2026-05-06",
        endDate: "2026-05-06",
        reason: "Medical check-up",
        status: "Pending",
        reviewerNotes: "",
      },
      {
        employeeId: employeeRows[2]?.id,
        leaveType: "Work From Home",
        startDate: "2026-05-08",
        endDate: "2026-05-09",
        reason: "Temporary remote arrangement",
        status: "Rejected",
        reviewerNotes: "Please coordinate with department lead.",
      },
    ].filter((row) => row.employeeId);

    for (const row of leaveRows) {
      queryRun(
        `
          INSERT INTO leave_requests (
            employee_id, leave_type, start_date, end_date, reason, status,
            reviewer_notes, created_at, updated_at, created_by, reviewed_by
          )
          VALUES (
            $employeeId, $leaveType, $startDate, $endDate, $reason, $status,
            $reviewerNotes, $createdAt, $updatedAt, $createdBy, $reviewedBy
          )
        `,
        {
          $employeeId: row.employeeId,
          $leaveType: row.leaveType,
          $startDate: row.startDate,
          $endDate: row.endDate,
          $reason: row.reason,
          $status: row.status,
          $reviewerNotes: row.reviewerNotes,
          $createdAt: nowIso(),
          $updatedAt: nowIso(),
          $createdBy: "admin",
          $reviewedBy: row.status === "Pending" ? "" : "admin",
        }
      );
    }
  }
}

function formatEmployee(row) {
  return {
    id: row.id,
    employeeId: row.employee_code,
    name: row.name,
    email: row.email,
    contactNumber: row.contact_number,
    department: row.department || "",
    role: row.role_title || "",
    joinedOn: row.joined_on || "",
    status: row.status,
    notes: row.notes || "",
    photoPath: row.photo_path || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by || "",
    updatedBy: row.updated_by || "",
  };
}

function validateEmployee(employee) {
  const errors = [];
  if (!employee.employeeId) {
    errors.push("Employee ID is required.");
  }
  if (!employee.name) {
    errors.push("Employee name is required.");
  }
  if (!employee.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) {
    errors.push("A valid email address is required.");
  }
  if (!employee.contactNumber || !/^[+\d\s-]{7,20}$/.test(employee.contactNumber)) {
    errors.push("A valid contact number is required.");
  }
  if (employee.joinedOn && Number.isNaN(Date.parse(employee.joinedOn))) {
    errors.push("Join date must be a valid date.");
  }
  return errors;
}

function normalizeEmployeePayload(input = {}) {
  return {
    employeeId: String(input.employeeId || "").trim(),
    name: String(input.name || "").trim(),
    email: String(input.email || "").trim().toLowerCase(),
    contactNumber: String(input.contactNumber || "").trim(),
    department: String(input.department || "").trim(),
    role: String(input.role || "").trim(),
    joinedOn: String(input.joinedOn || "").trim(),
    status: normalizeStatus(String(input.status || "Active").trim(), "Active"),
    notes: String(input.notes || "").trim(),
  };
}

function validatePasswordStrength(password) {
  const normalized = String(password || "");
  if (normalized.length < 8) {
    return "Password must be at least 8 characters long.";
  }
  return "";
}

function validateSelfProfile(payload) {
  const errors = [];
  if (!payload.name) {
    errors.push("Full name is required.");
  }
  if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    errors.push("A valid email address is required.");
  }
  if (!payload.contactNumber || !/^[+\d\s-]{7,20}$/.test(payload.contactNumber)) {
    errors.push("A valid contact number is required.");
  }
  return errors;
}

function validateAttendance(payload) {
  const errors = [];
  if (!payload.employeeId) {
    errors.push("Employee is required.");
  }
  if (!payload.attendanceDate) {
    errors.push("Attendance date is required.");
  }
  if (!payload.status) {
    errors.push("Attendance status is required.");
  }
  return errors;
}

function validateLeave(payload) {
  const errors = [];
  if (!payload.employeeId) {
    errors.push("Employee is required.");
  }
  if (!payload.leaveType) {
    errors.push("Leave type is required.");
  }
  if (!payload.startDate || !payload.endDate) {
    errors.push("Start and end dates are required.");
  }
  if (payload.startDate && payload.endDate && payload.startDate > payload.endDate) {
    errors.push("Leave end date must be on or after the start date.");
  }
  return errors;
}

function generateResetCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function savePhotoFromPayload(photoFilename, photoDataUrl) {
  if (!photoDataUrl) {
    return "";
  }

  const match = String(photoDataUrl).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid image format.");
  }

  const mimeType = match[1];
  const base64 = match[2];
  const extensionMap = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
  };
  const extension = extensionMap[mimeType];
  if (!extension) {
    throw new Error("Only PNG, JPEG, and WebP images are supported.");
  }

  const safeName = toSlug(path.parse(photoFilename || "employee-photo").name) || "employee-photo";
  const fileName = `${Date.now()}-${safeName}-${crypto.randomBytes(4).toString("hex")}${extension}`;
  const targetPath = path.join(UPLOAD_DIR, fileName);
  fs.writeFileSync(targetPath, Buffer.from(base64, "base64"));
  return `/uploads/${fileName}`;
}

function getEmployeeById(id) {
  return queryGet("SELECT * FROM employees WHERE id = $id", { $id: id });
}

function getEmployees(filters = {}) {
  let sql = `
    SELECT *
    FROM employees
    WHERE 1 = 1
  `;
  const params = {};

  if (filters.query) {
    sql += `
      AND (
        LOWER(employee_code) LIKE $query
        OR LOWER(name) LIKE $query
        OR LOWER(email) LIKE $query
        OR LOWER(contact_number) LIKE $query
        OR LOWER(COALESCE(department, '')) LIKE $query
        OR LOWER(COALESCE(role_title, '')) LIKE $query
      )
    `;
    params.$query = `%${filters.query.toLowerCase()}%`;
  }

  if (filters.status) {
    sql += " AND status = $status";
    params.$status = filters.status;
  }

  if (filters.department) {
    sql += " AND department = $department";
    params.$department = filters.department;
  }

  sql += " ORDER BY employee_code ASC";

  return queryAll(sql, params).map(formatEmployee);
}

function getAttendanceRecords(filters = {}) {
  let sql = `
    SELECT
      attendance.id,
      attendance.employee_id AS employeeId,
      employees.employee_code AS employeeCode,
      employees.name AS employeeName,
      attendance.attendance_date AS attendanceDate,
      attendance.check_in AS checkIn,
      attendance.check_out AS checkOut,
      attendance.status,
      attendance.notes,
      attendance.updated_at AS updatedAt
    FROM attendance
    INNER JOIN employees ON employees.id = attendance.employee_id
    WHERE 1 = 1
  `;
  const params = {};

  if (filters.employeeId) {
    sql += " AND attendance.employee_id = $employeeId";
    params.$employeeId = filters.employeeId;
  }
  if (filters.date) {
    sql += " AND attendance.attendance_date = $date";
    params.$date = filters.date;
  }

  sql += " ORDER BY attendance.attendance_date DESC, employees.name ASC LIMIT 20";
  return queryAll(sql, params);
}

function getLeaveRequests(filters = {}) {
  let sql = `
    SELECT
      leave_requests.id,
      leave_requests.employee_id AS employeeId,
      employees.employee_code AS employeeCode,
      employees.name AS employeeName,
      leave_requests.leave_type AS leaveType,
      leave_requests.start_date AS startDate,
      leave_requests.end_date AS endDate,
      leave_requests.reason,
      leave_requests.status,
      leave_requests.reviewer_notes AS reviewerNotes,
      leave_requests.reviewed_by AS reviewedBy,
      leave_requests.updated_at AS updatedAt
    FROM leave_requests
    INNER JOIN employees ON employees.id = leave_requests.employee_id
    WHERE 1 = 1
  `;
  const params = {};
  if (filters.status) {
    sql += " AND leave_requests.status = $status";
    params.$status = filters.status;
  }
  if (filters.employeeId) {
    sql += " AND leave_requests.employee_id = $employeeId";
    params.$employeeId = filters.employeeId;
  }
  sql += " ORDER BY leave_requests.created_at DESC LIMIT 20";
  return queryAll(sql, params);
}

function getManagerApprovalQueue() {
  return queryAll(
    `
      SELECT
        leave_requests.id,
        leave_requests.employee_id AS employeeId,
        employees.employee_code AS employeeCode,
        employees.name AS employeeName,
        COALESCE(employees.department, '') AS department,
        COALESCE(employees.role_title, '') AS roleTitle,
        leave_requests.leave_type AS leaveType,
        leave_requests.start_date AS startDate,
        leave_requests.end_date AS endDate,
        leave_requests.reason,
        leave_requests.status,
        leave_requests.created_at AS createdAt,
        leave_requests.created_by AS createdBy
      FROM leave_requests
      INNER JOIN employees ON employees.id = leave_requests.employee_id
      WHERE leave_requests.status = 'Pending'
      ORDER BY leave_requests.created_at DESC
    `
  );
}

function getEmployeeAccountByEmployeeId(employeeId) {
  return queryGet(
    `
      SELECT username, full_name AS fullName, role, account_type AS accountType
      FROM users
      WHERE account_type = 'employee' AND employee_id = $employeeId
    `,
    { $employeeId: employeeId }
  );
}

function getDashboardSummary() {
  const employeeMetrics = queryGet(`
    SELECT
      COUNT(*) AS totalEmployees,
      SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) AS activeEmployees,
      SUM(CASE WHEN status = 'Inactive' THEN 1 ELSE 0 END) AS inactiveEmployees,
      COUNT(DISTINCT department) AS departmentCount
    FROM employees
  `);

  const today = new Date().toISOString().slice(0, 10);
  const attendanceToday = queryAll(
    `
      SELECT status AS label, COUNT(*) AS value
      FROM attendance
      WHERE attendance_date = $today
      GROUP BY status
      ORDER BY value DESC
    `,
    { $today: today }
  );

  const leaveBreakdown = queryAll(`
    SELECT status AS label, COUNT(*) AS value
    FROM leave_requests
    GROUP BY status
    ORDER BY value DESC
  `);

  const departmentBreakdown = queryAll(`
    SELECT COALESCE(department, 'Unassigned') AS label, COUNT(*) AS value
    FROM employees
    GROUP BY COALESCE(department, 'Unassigned')
    ORDER BY value DESC, label ASC
  `);

  const roleBreakdown = queryAll(`
    SELECT COALESCE(role_title, 'Unassigned') AS label, COUNT(*) AS value
    FROM employees
    GROUP BY COALESCE(role_title, 'Unassigned')
    ORDER BY value DESC, label ASC
    LIMIT 6
  `);

  const monthlyJoins = queryAll(`
    SELECT
      substr(joined_on, 1, 7) AS label,
      COUNT(*) AS value
    FROM employees
    WHERE joined_on <> ''
    GROUP BY substr(joined_on, 1, 7)
    ORDER BY label DESC
    LIMIT 6
  `).reverse();

  const attendanceTrend = queryAll(`
    SELECT attendance_date AS label, COUNT(*) AS value
    FROM attendance
    WHERE status IN ('Present', 'Remote')
    GROUP BY attendance_date
    ORDER BY attendance_date DESC
    LIMIT 7
  `).reverse();

  const pendingLeaves = queryGet(`
    SELECT COUNT(*) AS count FROM leave_requests WHERE status = 'Pending'
  `).count;

  const recentActivity = queryAll(`
    SELECT actor_username AS actorUsername, description, created_at AS createdAt
    FROM activity_logs
    ORDER BY created_at DESC
    LIMIT 8
  `);

  return {
    metrics: {
      totalEmployees: employeeMetrics.totalEmployees || 0,
      activeEmployees: employeeMetrics.activeEmployees || 0,
      inactiveEmployees: employeeMetrics.inactiveEmployees || 0,
      departmentCount: employeeMetrics.departmentCount || 0,
      pendingLeaves,
    },
    charts: {
      attendanceToday,
      leaveBreakdown,
      departmentBreakdown,
      roleBreakdown,
      monthlyJoins,
      attendanceTrend,
    },
    recentActivity,
  };
}

function buildEmployeeProfile(employeeId) {
  const employee = getEmployeeById(employeeId);
  if (!employee) {
    return null;
  }

  const attendanceSummary = queryAll(
    `
      SELECT status AS label, COUNT(*) AS value
      FROM attendance
      WHERE employee_id = $employeeId
      GROUP BY status
      ORDER BY value DESC
    `,
    { $employeeId: employeeId }
  );

  const leaveSummary = queryAll(
    `
      SELECT status AS label, COUNT(*) AS value
      FROM leave_requests
      WHERE employee_id = $employeeId
      GROUP BY status
      ORDER BY value DESC
    `,
    { $employeeId: employeeId }
  );

  return {
    employee: formatEmployee(employee),
    attendanceSummary,
    leaveSummary,
    recentAttendance: getAttendanceRecords({ employeeId }),
    recentLeaves: queryAll(
      `
        SELECT
          id,
          leave_type AS leaveType,
          start_date AS startDate,
          end_date AS endDate,
          status,
          reviewer_notes AS reviewerNotes
        FROM leave_requests
        WHERE employee_id = $employeeId
        ORDER BY created_at DESC
        LIMIT 5
      `,
      { $employeeId: employeeId }
    ),
  };
}

function serveFile(res, resolvedPath) {
  const ext = path.extname(resolvedPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const content = fs.readFileSync(resolvedPath);
  res.writeHead(200, { "Content-Type": contentType });
  res.end(content);
}

async function serveStatic(res, pathname) {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  let baseDir = PUBLIC_DIR;
  if (requestedPath.startsWith("/uploads/")) {
    baseDir = UPLOAD_DIR;
  }

  const relativePath = requestedPath.startsWith("/uploads/")
    ? requestedPath.replace(/^\/uploads/, "")
    : requestedPath;
  const resolvedPath = path.normalize(path.join(baseDir, relativePath));
  if (!resolvedPath.startsWith(baseDir)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  try {
    const stats = await fs.promises.stat(resolvedPath);
    const filePath = stats.isDirectory() ? path.join(resolvedPath, "index.html") : resolvedPath;
    serveFile(res, filePath);
  } catch {
    sendText(res, 404, "Not found");
  }
}

function exportEmployeesCsv(res) {
  const employees = getEmployees();
  const rows = [
    [
      "Employee ID",
      "Name",
      "Email",
      "Contact Number",
      "Department",
      "Role",
      "Joined On",
      "Status",
      "Notes",
    ],
    ...employees.map((employee) => [
      employee.employeeId,
      employee.name,
      employee.email,
      employee.contactNumber,
      employee.department,
      employee.role,
      employee.joinedOn,
      employee.status,
      employee.notes,
    ]),
  ];

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`).join(","))
    .join("\n");

  res.writeHead(200, {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": 'attachment; filename="ezemployee-report.csv"',
  });
  res.end(csv);
}

async function handleApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/auth/options") {
    const employeeAccounts = queryAll(
      `
        SELECT users.username, users.full_name AS fullName, employees.employee_code AS employeeCode
        FROM users
        INNER JOIN employees ON employees.id = users.employee_id
        WHERE users.account_type = 'employee' AND users.is_active = 1
        ORDER BY employees.employee_code ASC
      `
    );
    sendJson(res, 200, {
      staffAccounts: [
        { username: "admin", password: "admin123", role: "Admin" },
        { username: "hrlead", password: "hr123", role: "HR" },
        { username: "manager", password: "manager123", role: "Manager" },
      ],
      employeeAccounts: employeeAccounts.map((account) => ({
        username: account.username,
        password: DEFAULT_EMPLOYEE_PASSWORD,
        role: "Employee",
        employeeCode: account.employeeCode,
        fullName: account.fullName,
      })),
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/login") {
    try {
      const body = await readBody(req);
      const row = queryGet("SELECT * FROM users WHERE username = $username AND is_active = 1", {
        $username: String(body.username || "").trim(),
      });
      if (!row || !verifyPassword(String(body.password || ""), row.password_hash)) {
        sendJson(res, 401, { error: "Invalid username or password." });
        return;
      }

      const user = {
        id: row.id,
        username: row.username,
        fullName: row.full_name,
        role: row.role,
        accountType: row.account_type || "staff",
        employeeId: row.employee_id || null,
      };
      const token = createSession(user);
      sendJson(
        res,
        200,
        { message: "Login successful.", user: serializeUser(user) },
        {
          "Set-Cookie": `ezemployee_session=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_TTL_MS / 1000}`,
        }
      );
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/password/forgot") {
    try {
      const body = await readBody(req);
      const username = String(body.username || "").trim();
      if (!username) {
        sendJson(res, 400, { error: "Username is required." });
        return;
      }

      const row = queryGet("SELECT id, username, is_active AS isActive FROM users WHERE username = $username", {
        $username: username,
      });
      if (!row || !row.isActive) {
        sendJson(res, 404, { error: "No active account was found for that username." });
        return;
      }

      const resetCode = generateResetCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      queryRun(
        `
          UPDATE users
          SET reset_code = $resetCode,
              reset_code_expires_at = $expiresAt
          WHERE id = $id
        `,
        {
          $id: row.id,
          $resetCode: resetCode,
          $expiresAt: expiresAt,
        }
      );

      logActivity(username, "reset_request", "user", row.id, `Requested password reset for ${username}.`);
      sendJson(res, 200, {
        message: "Reset code generated successfully.",
        resetCode,
        expiresAt,
      });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/password/reset") {
    try {
      const body = await readBody(req);
      const username = String(body.username || "").trim();
      const resetCode = String(body.resetCode || "").trim();
      const newPassword = String(body.newPassword || "");
      const passwordError = validatePasswordStrength(newPassword);

      if (!username || !resetCode || !newPassword) {
        sendJson(res, 400, { error: "Username, reset code, and new password are required." });
        return;
      }
      if (passwordError) {
        sendJson(res, 400, { error: passwordError });
        return;
      }

      const row = queryGet("SELECT * FROM users WHERE username = $username AND is_active = 1", {
        $username: username,
      });
      if (!row || !row.reset_code || row.reset_code !== resetCode) {
        sendJson(res, 400, { error: "Invalid reset code." });
        return;
      }
      if (!row.reset_code_expires_at || Date.parse(row.reset_code_expires_at) < Date.now()) {
        sendJson(res, 400, { error: "Reset code has expired. Please request a new one." });
        return;
      }

      queryRun(
        `
          UPDATE users
          SET password_hash = $passwordHash,
              reset_code = NULL,
              reset_code_expires_at = NULL
          WHERE id = $id
        `,
        {
          $id: row.id,
          $passwordHash: passwordHash(newPassword),
        }
      );

      logActivity(username, "reset_complete", "user", row.id, `Password reset completed for ${username}.`);
      sendJson(res, 200, { message: "Password reset successfully. You can sign in now." });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/logout") {
    clearSession(req);
    sendJson(
      res,
      200,
      { message: "Logged out successfully." },
      {
        "Set-Cookie": "ezemployee_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0",
      }
    );
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/session") {
    const user = getSessionUser(req);
    sendJson(res, 200, {
      authenticated: Boolean(user),
      user: user ? serializeUser(user) : null,
      permissions: user ? getPermissionSet(user) : null,
    });
    return;
  }

  const user = requireAuth(req, res);
  if (!user) {
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/password/change") {
    try {
      const body = await readBody(req);
      const currentPassword = String(body.currentPassword || "");
      const newPassword = String(body.newPassword || "");
      const passwordError = validatePasswordStrength(newPassword);
      if (!currentPassword || !newPassword) {
        sendJson(res, 400, { error: "Current password and new password are required." });
        return;
      }
      if (passwordError) {
        sendJson(res, 400, { error: passwordError });
        return;
      }

      const row = queryGet("SELECT * FROM users WHERE id = $id", { $id: user.id });
      if (!row || !verifyPassword(currentPassword, row.password_hash)) {
        sendJson(res, 400, { error: "Current password is incorrect." });
        return;
      }
      if (verifyPassword(newPassword, row.password_hash)) {
        sendJson(res, 400, { error: "New password must be different from the current password." });
        return;
      }

      queryRun(
        `
          UPDATE users
          SET password_hash = $passwordHash,
              reset_code = NULL,
              reset_code_expires_at = NULL
          WHERE id = $id
        `,
        {
          $id: user.id,
          $passwordHash: passwordHash(newPassword),
        }
      );

      logActivity(user.username, "password_change", "user", user.id, `Password changed for ${user.username}.`);
      sendJson(res, 200, { message: "Password changed successfully." });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/employee/dashboard") {
    if (user.accountType !== "employee" || !user.employeeId) {
      sendJson(res, 403, { error: "Employee dashboard access only." });
      return;
    }
    sendJson(res, 200, {
      profile: buildEmployeeProfile(user.employeeId),
      attendance: getAttendanceRecords({ employeeId: user.employeeId }),
      leaves: getLeaveRequests({ employeeId: user.employeeId }),
      account: getEmployeeAccountByEmployeeId(user.employeeId),
      permissions: getPermissionSet(user),
    });
    return;
  }

  if (req.method === "PUT" && url.pathname === "/api/employee/profile") {
    if (user.accountType !== "employee" || !user.employeeId) {
      sendJson(res, 403, { error: "Employee profile editing is only available in self-service mode." });
      return;
    }

    try {
      const body = await readBody(req);
      const row = getEmployeeById(user.employeeId);
      if (!row) {
        sendJson(res, 404, { error: "Employee record not found." });
        return;
      }

      const payload = {
        name: String(body.name || "").trim(),
        email: String(body.email || "").trim().toLowerCase(),
        contactNumber: String(body.contactNumber || "").trim(),
        notes: String(body.notes || "").trim(),
      };
      const errors = validateSelfProfile(payload);
      if (errors.length) {
        sendJson(res, 400, { error: errors.join(" ") });
        return;
      }

      const conflict = queryGet(
        "SELECT id FROM employees WHERE id <> $id AND email = $email",
        { $id: user.employeeId, $email: payload.email }
      );
      if (conflict) {
        sendJson(res, 409, { error: "Email address already belongs to another employee." });
        return;
      }

      const photoPath = body.photoDataUrl
        ? savePhotoFromPayload(body.photoFilename, body.photoDataUrl)
        : row.photo_path || "";
      queryRun(
        `
          UPDATE employees
          SET name = $name,
              email = $email,
              contact_number = $contactNumber,
              notes = $notes,
              photo_path = $photoPath,
              updated_at = $updatedAt,
              updated_by = $updatedBy
          WHERE id = $id
        `,
        {
          $id: user.employeeId,
          $name: payload.name,
          $email: payload.email,
          $contactNumber: payload.contactNumber,
          $notes: payload.notes,
          $photoPath: photoPath,
          $updatedAt: nowIso(),
          $updatedBy: user.username,
        }
      );

      syncEmployeeAccount(getEmployeeById(user.employeeId));
      updateSessionUser(req, { fullName: payload.name });

      logActivity(user.username, "profile_update", "employee", user.employeeId, `Updated self profile for ${payload.name}.`);
      sendJson(res, 200, {
        message: "Profile updated successfully.",
        profile: buildEmployeeProfile(user.employeeId),
        user: serializeUser({
          ...user,
          fullName: payload.name,
        }),
      });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/dashboard") {
    if (user.accountType === "employee") {
      sendJson(res, 403, { error: "Use the employee dashboard for this account." });
      return;
    }
    sendJson(res, 200, {
      summary: getDashboardSummary(),
      permissions: getPermissionSet(user),
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/manager/approvals") {
    const permittedUser = requirePermission(req, res, "reviewLeaves");
    if (!permittedUser) {
      return;
    }
    sendJson(res, 200, {
      approvals: getManagerApprovalQueue(),
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/employees") {
    const employees = getEmployees({
      query: (url.searchParams.get("q") || "").trim(),
      status: (url.searchParams.get("status") || "").trim(),
      department: (url.searchParams.get("department") || "").trim(),
    });
    if (user.accountType === "employee" && user.employeeId) {
      sendJson(res, 200, { employees: employees.filter((employee) => employee.id === user.employeeId) });
      return;
    }
    sendJson(res, 200, { employees });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/employees") {
    const permittedUser = requirePermission(req, res, "manageEmployees");
    if (!permittedUser) {
      return;
    }

    try {
      const body = await readBody(req);
      const employee = normalizeEmployeePayload(body);
      const errors = validateEmployee(employee);
      if (errors.length) {
        sendJson(res, 400, { error: errors.join(" ") });
        return;
      }

      const existing = queryGet(
        "SELECT id FROM employees WHERE employee_code = $employeeCode OR email = $email",
        {
          $employeeCode: employee.employeeId,
          $email: employee.email,
        }
      );
      if (existing) {
        sendJson(res, 409, { error: "Employee ID or email already exists." });
        return;
      }

      const photoPath = body.photoDataUrl ? savePhotoFromPayload(body.photoFilename, body.photoDataUrl) : "";
      const timestamp = nowIso();
      const result = queryRun(
        `
          INSERT INTO employees (
            employee_code, name, email, contact_number, department, role_title,
            joined_on, status, notes, photo_path, created_at, updated_at, created_by, updated_by
          )
          VALUES (
            $employeeCode, $name, $email, $contactNumber, $department, $roleTitle,
            $joinedOn, $status, $notes, $photoPath, $createdAt, $updatedAt, $createdBy, $updatedBy
          )
        `,
        {
          $employeeCode: employee.employeeId,
          $name: employee.name,
          $email: employee.email,
          $contactNumber: employee.contactNumber,
          $department: employee.department,
          $roleTitle: employee.role,
          $joinedOn: employee.joinedOn,
          $status: employee.status,
          $notes: employee.notes,
          $photoPath: photoPath,
          $createdAt: timestamp,
          $updatedAt: timestamp,
          $createdBy: permittedUser.username,
          $updatedBy: permittedUser.username,
        }
      );

      logActivity(
        permittedUser.username,
        "create",
        "employee",
        result.lastInsertRowid,
        `Created employee ${employee.name} (${employee.employeeId}).`
      );

      syncEmployeeAccount(getEmployeeById(result.lastInsertRowid));

      sendJson(res, 201, {
        message: "Employee added successfully.",
        employee: formatEmployee(getEmployeeById(result.lastInsertRowid)),
      });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/attendance") {
    const employeeIdFilter = user.accountType === "employee" ? user.employeeId : url.searchParams.get("employeeId");
    sendJson(res, 200, {
      records: getAttendanceRecords({
        employeeId: employeeIdFilter,
        date: url.searchParams.get("date"),
      }),
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/attendance") {
    const isEmployeeSelf = user.accountType === "employee" && Boolean(user.employeeId);
    const permittedUser = isEmployeeSelf ? user : requirePermission(req, res, "manageAttendance");
    if (!permittedUser) return;

    try {
      const body = await readBody(req);
      const payload = {
        employeeId: isEmployeeSelf ? Number(user.employeeId) : Number(body.employeeId || 0),
        attendanceDate: String(body.attendanceDate || "").trim(),
        status: String(body.status || "").trim(),
        checkIn: String(body.checkIn || "").trim(),
        checkOut: String(body.checkOut || "").trim(),
        notes: String(body.notes || "").trim(),
      };
      const errors = validateAttendance(payload);
      if (errors.length) {
        sendJson(res, 400, { error: errors.join(" ") });
        return;
      }
      if (!getEmployeeById(payload.employeeId)) {
        sendJson(res, 404, { error: "Employee not found." });
        return;
      }

      const existing = queryGet(
        "SELECT id FROM attendance WHERE employee_id = $employeeId AND attendance_date = $attendanceDate",
        { $employeeId: payload.employeeId, $attendanceDate: payload.attendanceDate }
      );
      const timestamp = nowIso();
      if (existing) {
        queryRun(
          `
            UPDATE attendance
            SET check_in = $checkIn,
                check_out = $checkOut,
                status = $status,
                notes = $notes,
                updated_at = $updatedAt,
                created_by = $createdBy
            WHERE id = $id
          `,
          {
            $id: existing.id,
            $checkIn: payload.checkIn,
            $checkOut: payload.checkOut,
            $status: payload.status,
            $notes: payload.notes,
            $updatedAt: timestamp,
            $createdBy: permittedUser.username,
          }
        );
        logActivity(
          permittedUser.username,
          "update",
          "attendance",
          existing.id,
          `Updated attendance for employee #${payload.employeeId} on ${payload.attendanceDate}.`
        );
      } else {
        queryRun(
          `
            INSERT INTO attendance (
              employee_id, attendance_date, check_in, check_out, status, notes,
              created_at, updated_at, created_by
            )
            VALUES (
              $employeeId, $attendanceDate, $checkIn, $checkOut, $status, $notes,
              $createdAt, $updatedAt, $createdBy
            )
          `,
          {
            $employeeId: payload.employeeId,
            $attendanceDate: payload.attendanceDate,
            $checkIn: payload.checkIn,
            $checkOut: payload.checkOut,
            $status: payload.status,
            $notes: payload.notes,
            $createdAt: timestamp,
            $updatedAt: timestamp,
            $createdBy: permittedUser.username,
          }
        );
        logActivity(
          permittedUser.username,
          "create",
          "attendance",
          payload.employeeId,
          `${isEmployeeSelf ? "Self-marked" : "Marked"} ${payload.status} attendance for employee #${payload.employeeId}.`
        );
      }

      sendJson(res, 200, { message: "Attendance saved successfully." });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/leaves") {
    const statusFilter = (url.searchParams.get("status") || "").trim();
    sendJson(res, 200, {
      leaves: getLeaveRequests({
        status: statusFilter,
        employeeId: user.accountType === "employee" ? user.employeeId : null,
      }),
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/leaves") {
    if (!getPermissionSet(user)?.createLeaves && !getPermissionSet(user)?.selfLeave) {
      sendJson(res, 403, { error: "You do not have permission to create leave requests." });
      return;
    }

    try {
      const body = await readBody(req);
      const payload = {
        employeeId: user.accountType === "employee" && user.employeeId ? Number(user.employeeId) : Number(body.employeeId || 0),
        leaveType: String(body.leaveType || "").trim(),
        startDate: String(body.startDate || "").trim(),
        endDate: String(body.endDate || "").trim(),
        reason: String(body.reason || "").trim(),
      };
      const errors = validateLeave(payload);
      if (errors.length) {
        sendJson(res, 400, { error: errors.join(" ") });
        return;
      }
      if (!getEmployeeById(payload.employeeId)) {
        sendJson(res, 404, { error: "Employee not found." });
        return;
      }

      const timestamp = nowIso();
      const result = queryRun(
        `
          INSERT INTO leave_requests (
            employee_id, leave_type, start_date, end_date, reason, status,
            reviewer_notes, created_at, updated_at, created_by, reviewed_by
          )
          VALUES (
            $employeeId, $leaveType, $startDate, $endDate, $reason, 'Pending',
            '', $createdAt, $updatedAt, $createdBy, ''
          )
        `,
        {
          $employeeId: payload.employeeId,
          $leaveType: payload.leaveType,
          $startDate: payload.startDate,
          $endDate: payload.endDate,
          $reason: payload.reason,
          $createdAt: timestamp,
          $updatedAt: timestamp,
          $createdBy: user.username,
        }
      );

      logActivity(
        user.username,
        "create",
        "leave",
        result.lastInsertRowid,
          `${user.accountType === "employee" ? "Self-submitted" : "Submitted"} ${payload.leaveType} leave request for employee #${payload.employeeId}.`
        );

      sendJson(res, 201, { message: "Leave request submitted successfully." });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  const leaveReviewMatch = url.pathname.match(/^\/api\/leaves\/(\d+)\/review$/);
  if (leaveReviewMatch && req.method === "POST") {
    const permittedUser = requirePermission(req, res, "reviewLeaves");
    if (!permittedUser) {
      return;
    }

    try {
      const leaveId = Number(leaveReviewMatch[1]);
      const body = await readBody(req);
      const nextStatus = String(body.status || "").trim();
      if (!["Approved", "Rejected"].includes(nextStatus)) {
        sendJson(res, 400, { error: "Leave review status must be Approved or Rejected." });
        return;
      }

      const existing = queryGet("SELECT * FROM leave_requests WHERE id = $id", { $id: leaveId });
      if (!existing) {
        sendJson(res, 404, { error: "Leave request not found." });
        return;
      }

      queryRun(
        `
          UPDATE leave_requests
          SET status = $status,
              reviewer_notes = $reviewerNotes,
              reviewed_by = $reviewedBy,
              updated_at = $updatedAt
          WHERE id = $id
        `,
        {
          $id: leaveId,
          $status: nextStatus,
          $reviewerNotes: String(body.reviewerNotes || "").trim(),
          $reviewedBy: permittedUser.username,
          $updatedAt: nowIso(),
        }
      );

      logActivity(
        permittedUser.username,
        "review",
        "leave",
        leaveId,
        `${nextStatus} leave request #${leaveId}.`
      );

      sendJson(res, 200, { message: `Leave request ${nextStatus.toLowerCase()}.` });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/reports/export.csv") {
    exportEmployeesCsv(res);
    return;
  }

  const employeeMatch = url.pathname.match(/^\/api\/employees\/(\d+)$/);
  if (employeeMatch) {
    const employeeId = Number(employeeMatch[1]);
    const row = getEmployeeById(employeeId);
    if (!row) {
      sendJson(res, 404, { error: "Employee not found." });
      return;
    }
    if (user.accountType === "employee" && user.employeeId !== employeeId) {
      sendJson(res, 403, { error: "You can only access your own employee profile." });
      return;
    }

    if (req.method === "GET") {
      sendJson(res, 200, buildEmployeeProfile(employeeId));
      return;
    }

    if (req.method === "PUT") {
      const permittedUser = requirePermission(req, res, "manageEmployees");
      if (!permittedUser) {
        return;
      }

      try {
        const body = await readBody(req);
        const employee = normalizeEmployeePayload(body);
        const errors = validateEmployee(employee);
        if (errors.length) {
          sendJson(res, 400, { error: errors.join(" ") });
          return;
        }

        const conflict = queryGet(
          `
            SELECT id
            FROM employees
            WHERE id <> $id AND (employee_code = $employeeCode OR email = $email)
          `,
          {
            $id: employeeId,
            $employeeCode: employee.employeeId,
            $email: employee.email,
          }
        );
        if (conflict) {
          sendJson(res, 409, { error: "Employee ID or email already exists." });
          return;
        }

        const photoPath = body.photoDataUrl
          ? savePhotoFromPayload(body.photoFilename, body.photoDataUrl)
          : row.photo_path || "";
        queryRun(
          `
            UPDATE employees
            SET employee_code = $employeeCode,
                name = $name,
                email = $email,
                contact_number = $contactNumber,
                department = $department,
                role_title = $roleTitle,
                joined_on = $joinedOn,
                status = $status,
                notes = $notes,
                photo_path = $photoPath,
                updated_at = $updatedAt,
                updated_by = $updatedBy
            WHERE id = $id
          `,
          {
            $id: employeeId,
            $employeeCode: employee.employeeId,
            $name: employee.name,
            $email: employee.email,
            $contactNumber: employee.contactNumber,
            $department: employee.department,
            $roleTitle: employee.role,
            $joinedOn: employee.joinedOn,
            $status: employee.status,
            $notes: employee.notes,
            $photoPath: photoPath,
            $updatedAt: nowIso(),
            $updatedBy: permittedUser.username,
          }
        );

        logActivity(
          permittedUser.username,
          "update",
          "employee",
          employeeId,
          `Updated employee ${employee.name} (${employee.employeeId}).`
        );

        syncEmployeeAccount(getEmployeeById(employeeId));

        sendJson(res, 200, {
          message: "Employee updated successfully.",
          employee: formatEmployee(getEmployeeById(employeeId)),
        });
      } catch (error) {
        sendJson(res, 400, { error: error.message });
      }
      return;
    }

    if (req.method === "DELETE") {
      const permittedUser = requirePermission(req, res, "deleteEmployees");
      if (!permittedUser) {
        return;
      }

      queryRun("DELETE FROM users WHERE account_type = 'employee' AND employee_id = $employeeId", {
        $employeeId: employeeId,
      });
      queryRun("DELETE FROM employees WHERE id = $id", { $id: employeeId });
      logActivity(
        permittedUser.username,
        "delete",
        "employee",
        employeeId,
        `Deleted employee ${row.name} (${row.employee_code}).`
      );
      sendJson(res, 200, { message: "Employee deleted successfully." });
      return;
    }
  }

  sendJson(res, 404, { error: "API route not found." });
}

async function bootstrap() {
  await ensureDirectories();
  initializeDatabase();
  ensureUserTableColumns();
  seedUsers();
  await migrateLegacyEmployees();
  seedEmployeesAndOperations();
  ensureStaffLinkedProfiles();
  syncAllEmployeeAccounts();

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);

    try {
      if (url.pathname.startsWith("/api/")) {
        await handleApi(req, res, url);
        return;
      }
      await serveStatic(res, url.pathname);
    } catch (error) {
      sendJson(res, 500, {
        error: "Internal server error.",
        details: error.message,
      });
    }
  });

  server.listen(PORT, HOST, () => {
    console.log(`EZEmployee is running at http://${HOST}:${PORT}`);
    console.log("Demo users: admin/admin123, hrlead/hr123, manager/manager123, employee accounts use employee123 by default");
  });
}

bootstrap();
