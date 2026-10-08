const jwt = require('jsonwebtoken');
const { readDb } = require('./store');

function authSecret() {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET precisa ser configurado em produção.');
  }
  return 'entremares-dev-secret-change-me';
}

function curatorEmails() {
  return String(process.env.CURATOR_EMAILS || '')
    .split(',')
    .map(value => value.trim().toLowerCase())
    .filter(Boolean);
}

function isCuratorEmail(email) {
  return curatorEmails().includes(String(email || '').toLowerCase());
}

function signToken(user) {
  return jwt.sign(
    {
      role: user.role,
      email: user.email,
      curator: isCuratorEmail(user.email)
    },
    authSecret(),
    { subject: user.id, expiresIn: '7d' }
  );
}

async function resolveAuthFromRequest(req) {
  const header = String(req.headers.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;

  const payload = jwt.verify(token, authSecret());
  const db = await readDb();
  const user = db.users.find(item => item.id === payload.sub);
  if (!user) {
    const error = new Error('Sessão inválida.');
    error.status = 401;
    throw error;
  }

  return {
    user,
    token: payload,
    curator: Boolean(payload.curator || isCuratorEmail(user.email))
  };
}

async function authRequired(req, res, next) {
  try {
    const auth = await resolveAuthFromRequest(req);
    if (!auth) return res.status(401).json({ error: 'Faça login para continuar.' });
    req.auth = auth;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') return res.status(401).json({ error: 'Sua sessão expirou. Entre novamente.' });
    if (error.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Sessão inválida.' });
    if (error.status === 401) return res.status(401).json({ error: error.message });
    next(error);
  }
}

async function authOptional(req, res, next) {
  try {
    req.auth = await resolveAuthFromRequest(req);
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') return res.status(401).json({ error: 'Sua sessão expirou. Entre novamente.' });
    if (error.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Sessão inválida.' });
    if (error.status === 401) return res.status(401).json({ error: error.message });
    next(error);
  }
}

function requireFisher(req, res, next) {
  if (req.auth?.user?.role !== 'pescador') {
    return res.status(403).json({ error: 'Esta área é exclusiva para pescadores cadastrados.' });
  }
  next();
}

function requireCustomer(req, res, next) {
  if (req.auth?.user?.role !== 'cliente') {
    return res.status(403).json({ error: 'Esta área é exclusiva para clientes cadastrados.' });
  }
  next();
}

function requireCurator(req, res, next) {
  if (!req.auth?.curator) {
    return res.status(403).json({ error: 'Acesso restrito à curadoria.' });
  }
  next();
}

module.exports = {
  authRequired,
  authOptional,
  requireFisher,
  requireCustomer,
  requireCurator,
  signToken,
  isCuratorEmail
};
