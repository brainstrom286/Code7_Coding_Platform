require('dotenv').config();

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const CONNECTION_STRING =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/mock_placement';

const useSsl = process.env.PGSSL === 'true' || /railway|render|supabase|neon/i.test(CONNECTION_STRING);

const pool = new Pool({
  connectionString: CONNECTION_STRING,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

function normalizeQuery(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

async function query(sql, params = []) {
  const text = normalizeQuery(sql);
  return pool.query(text, params);
}

async function all(sql, params = []) {
  const { rows } = await query(sql, params);
  return rows;
}

async function get(sql, params = []) {
  const { rows } = await query(sql, params);
  return rows[0] || null;
}

async function run(sql, params = []) {
  return query(sql, params);
}

const schema = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    enrollment TEXT UNIQUE,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS tests (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL,
    total_marks INTEGER NOT NULL DEFAULT 0,
    instructions TEXT,
    is_active INTEGER DEFAULT 1,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    test_id TEXT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    problem_statement TEXT NOT NULL,
    input_format TEXT,
    output_format TEXT,
    constraints TEXT,
    marks INTEGER NOT NULL DEFAULT 10,
    order_index INTEGER DEFAULT 0,
    image_url TEXT
  );

  CREATE TABLE IF NOT EXISTS sample_test_cases (
    id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    input TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    explanation TEXT
  );

  CREATE TABLE IF NOT EXISTS hidden_test_cases (
    id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    input TEXT NOT NULL,
    expected_output TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS boilerplate_code (
    id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    language TEXT NOT NULL,
    code TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS test_attempts (
    id TEXT PRIMARY KEY,
    test_id TEXT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    status TEXT DEFAULT 'in_progress',
    total_marks_obtained INTEGER DEFAULT 0,
    tab_switches INTEGER DEFAULT 0,
    auto_submitted INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS question_submissions (
    id TEXT PRIMARY KEY,
    attempt_id TEXT NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    language TEXT NOT NULL,
    code TEXT NOT NULL,
    marks_obtained INTEGER DEFAULT 0,
    test_cases_passed INTEGER DEFAULT 0,
    total_test_cases INTEGER DEFAULT 0,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE UNIQUE INDEX IF NOT EXISTS question_submissions_attempt_question_idx
    ON question_submissions (attempt_id, question_id);
`;

async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || 'tnpcell@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'svittnp@1234';
  const existing = await get('SELECT id, email FROM users WHERE role = ? LIMIT 1', ['admin']);

  if (!existing) {
    await run(
      'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), 'TNP Cell', adminEmail, bcrypt.hashSync(adminPassword, 10), 'admin']
    );
    console.log(`Admin created: ${adminEmail}`);
    return;
  }

  if (existing.email !== adminEmail) {
    await run(
      "UPDATE users SET email = ?, password = ?, name = 'TNP Cell' WHERE role = ?",
      [adminEmail, bcrypt.hashSync(adminPassword, 10), 'admin']
    );
    console.log(`Admin updated: ${adminEmail}`);
  }
}

async function initDB() {
  await query(schema);
  await seedAdmin();
  return pool;
}

async function closeDB() {
  await pool.end();
}

module.exports = { initDB, all, get, run, query, closeDB };
