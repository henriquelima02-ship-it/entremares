const fs = require('fs/promises');
const path = require('path');
const { Pool } = require('pg');

const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, '..', 'data', 'runtime-db.json');
const SEED_FILE = path.join(__dirname, '..', 'data', 'seed.json');
const DATABASE_URL = String(process.env.DATABASE_URL || '').trim();
const EMPTY_DB = { users: [], fishermen: [], products: [], orders: [] };
let writeQueue = Promise.resolve();
let pgReady = null;

const pool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'disable' ? false : { rejectUnauthorized: false },
      max: 5
    })
  : null;

function normalizeDb(parsed = {}) {
  return {
    users: Array.isArray(parsed.users) ? parsed.users : [],
    fishermen: Array.isArray(parsed.fishermen) ? parsed.fishermen : [],
    products: Array.isArray(parsed.products) ? parsed.products : [],
    orders: Array.isArray(parsed.orders) ? parsed.orders : []
  };
}

async function initialData() {
  try {
    const raw = await fs.readFile(SEED_FILE, 'utf8');
    return normalizeDb(JSON.parse(raw || '{}'));
  } catch {
    return { ...EMPTY_DB };
  }
}

async function ensureFileDb() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(await initialData(), null, 2), 'utf8');
  }
}

async function ensurePostgres() {
  if (!pool) return;
  if (!pgReady) {
    pgReady = (async () => {
      const client = await pool.connect();
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS entremares_state (
            id INTEGER PRIMARY KEY,
            data JSONB NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `);
        const seed = await initialData();
        await client.query(
          `INSERT INTO entremares_state (id, data)
           VALUES (1, $1::jsonb)
           ON CONFLICT (id) DO NOTHING`,
          [JSON.stringify(seed)]
        );
      } finally {
        client.release();
      }
    })().catch(error => {
      pgReady = null;
      throw error;
    });
  }
  return pgReady;
}

async function readDb() {
  if (pool) {
    await ensurePostgres();
    const { rows } = await pool.query('SELECT data FROM entremares_state WHERE id = 1');
    return normalizeDb(rows[0]?.data || {});
  }

  await ensureFileDb();
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  return normalizeDb(JSON.parse(raw || '{}'));
}

async function persistFileDb(db) {
  await ensureFileDb();
  const tmp = `${DATA_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), 'utf8');
  await fs.rename(tmp, DATA_FILE);
  return db;
}

async function mutatePostgres(mutator) {
  await ensurePostgres();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT data FROM entremares_state WHERE id = 1 FOR UPDATE');
    const db = normalizeDb(rows[0]?.data || {});
    const result = await mutator(db);
    await client.query(
      'UPDATE entremares_state SET data = $1::jsonb, updated_at = NOW() WHERE id = 1',
      [JSON.stringify(db)]
    );
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function mutateDb(mutator) {
  if (pool) return mutatePostgres(mutator);

  writeQueue = writeQueue.catch(() => undefined).then(async () => {
    const db = await readDb();
    const result = await mutator(db);
    await persistFileDb(db);
    return result;
  });
  return writeQueue;
}

module.exports = {
  readDb,
  mutateDb,
  DATA_FILE,
  SEED_FILE,
  storageMode: pool ? 'postgres' : 'json'
};
