const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { readDb, mutateDb } = require('../store');
const { authRequired, signToken, isCuratorEmail } = require('../auth');

const router = express.Router();
const ROLES = new Set(['cliente', 'pescador']);

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function publicUser(user) {
  if (!user) return null;
  const { passwordHash, phoneNormalized, ...safe } = user;
  return { ...safe, curator: isCuratorEmail(user.email) };
}

router.get('/welcome', (req, res) => {
  res.json({ message: 'Bem-vindo ao EntreMarés — Saberes, Lugares e Produtos Caiçaras.' });
});

router.post('/register', async (req, res, next) => {
  try {
    const { role = 'cliente', name, phone, email, password, profile = {} } = req.body || {};
    if (!ROLES.has(role)) return res.status(400).json({ error: 'Tipo de cadastro inválido.' });
    if (!name || String(name).trim().length < 3) return res.status(400).json({ error: 'Informe o nome completo.' });

    const normalizedPhone = normalizePhone(phone);
    if (normalizedPhone.length < 10) return res.status(400).json({ error: 'Informe um telefone ou WhatsApp válido.' });

    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (normalizedEmail && !normalizedEmail.includes('@')) return res.status(400).json({ error: 'Revise o e-mail informado.' });
    if (!password || String(password).length < 8) return res.status(400).json({ error: 'A senha precisa ter pelo menos 8 caracteres.' });

    const existing = await readDb();
    if (normalizedEmail && existing.users.some(user => String(user.email || '').toLowerCase() === normalizedEmail)) {
      return res.status(409).json({ error: 'Já existe um cadastro com este e-mail.' });
    }
    if (existing.users.some(user => normalizePhone(user.phoneNormalized || user.phone) === normalizedPhone)) {
      return res.status(409).json({ error: 'Já existe um cadastro com este telefone.' });
    }

    const passwordHash = await bcrypt.hash(String(password), 12);
    const now = new Date().toISOString();
    const user = {
      id: crypto.randomUUID(),
      role,
      name: String(name).trim(),
      phone: String(phone).trim(),
      phoneNormalized: normalizedPhone,
      email: normalizedEmail,
      passwordHash,
      community: String(profile.community || '').trim(),
      createdAt: now
    };

    const fisherman = role === 'pescador' ? {
      id: crypto.randomUUID(),
      userId: user.id,
      displayName: String(profile.displayName || name).trim(),
      community: String(profile.community || '').trim(),
      pickupReference: String(profile.pickupReference || '').trim(),
      bio: String(profile.bio || '').trim(),
      whatsappPublic: profile.whatsappPublic !== false,
      shipping: {
        pickup: profile.shipping?.pickup !== false,
        communityDelivery: Boolean(profile.shipping?.communityDelivery),
        collaborativeFreight: Boolean(profile.shipping?.collaborativeFreight),
        deliveryFee: Number(profile.shipping?.deliveryFee || 0),
        collaborativeFee: Number(profile.shipping?.collaborativeFee || 0),
        notes: String(profile.shipping?.notes || '').trim()
      },
      status: 'pending_review',
      createdAt: now,
      updatedAt: now
    } : null;

    await mutateDb(db => {
      db.users.push(user);
      if (fisherman) db.fishermen.push(fisherman);
    });

    res.status(201).json({
      message: fisherman ? 'Cadastro de pescador recebido para revisão.' : 'Cadastro de cliente realizado.',
      token: signToken(user),
      user: publicUser(user),
      fisherman
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const identifier = String(req.body?.identifier || req.body?.email || '').trim();
    const password = String(req.body?.password || '');
    if (!identifier || !password) return res.status(400).json({ error: 'Informe seu telefone ou e-mail e a senha.' });

    const normalizedIdentifierPhone = normalizePhone(identifier);
    const normalizedIdentifierEmail = identifier.toLowerCase();

    const db = await readDb();
    const user = db.users.find(item => {
      if (identifier.includes('@')) return String(item.email || '').toLowerCase() === normalizedIdentifierEmail;
      return normalizePhone(item.phoneNormalized || item.phone) === normalizedIdentifierPhone;
    });

    if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Telefone/e-mail ou senha inválidos.' });
    }

    const fisherman = user.role === 'pescador'
      ? db.fishermen.find(item => item.userId === user.id) || null
      : null;

    res.json({
      token: signToken(user),
      user: publicUser(user),
      fisherman
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authRequired, async (req, res, next) => {
  try {
    const db = await readDb();
    const fisherman = req.auth.user.role === 'pescador'
      ? db.fishermen.find(item => item.userId === req.auth.user.id) || null
      : null;
    res.json({ user: publicUser(req.auth.user), fisherman });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
