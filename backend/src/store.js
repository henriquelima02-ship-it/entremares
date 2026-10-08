const fs = require('fs/promises');
const path = require('path');

const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, '..', 'data', 'db.json');
const EMPTY_DB = { users: [], fishermen: [], products: [], orders: [] };
let writeQueue = Promise.resolve();

async function ensureDb() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(EMPTY_DB, null, 2), 'utf8');
  }
}

async function readDb() {
  await ensureDb();
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  const parsed = JSON.parse(raw || '{}');
  return {
    users: Array.isArray(parsed.users) ? parsed.users : [],
    fishermen: Array.isArray(parsed.fishermen) ? parsed.fishermen : [],
    products: Array.isArray(parsed.products) ? parsed.products : [],
    orders: Array.isArray(parsed.orders) ? parsed.orders : []
  };
}

async function persistDb(db) {
  await ensureDb();
  const tmp = `${DATA_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), 'utf8');
  await fs.rename(tmp, DATA_FILE);
  return db;
}

function mutateDb(mutator) {
  writeQueue = writeQueue.catch(() => undefined).then(async () => {
    const db = await readDb();
    const result = await mutator(db);
    await persistDb(db);
    return result;
  });
  return writeQueue;
}

module.exports = { readDb, mutateDb, DATA_FILE };
