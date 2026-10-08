const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { readDb, mutateDb } = require('../store');
const { authRequired, signToken, isCuratorEmail } = require('../auth');

const router = express.Router();
const ROLES = new Set(['cliente', 'pescador']);

function publicUser(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
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
    if (!phone || String(phone).trim().length < 8) return res.status(400).json({ error: 'Informe um telefone válido.' });
    if (!email || !String(email).includes('@')) return res.status(400).json({ error: 'Informe um e-mail válido.' });
    if (!password || String(password).length < 8) return res.status(400).json({ error: 'A senha precisa ter pelo menos 8 caracteres.' });

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await readDb();
    if (existing.users.some(user => user.email === normalizedEmail)) {
      return res.status(409).json({ error: 'Já existe um cadastro com este e-mail.' });
    }

    const passwordHash = await bcrypt.hash(String(password), 12);
    const now = new Date().toISOString();
    const user = {
      id: crypto.randomUUID(),
      role,
      name: String(name).trim(),
      phone: String(phone).trim(),
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
      message: fisherman ? 'Cadastro de pescador recebido para revisão.' : 'Cadastro realizado.',
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
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!email || !password) return res.status(400).json({ error: 'Informe e-mail e senha.' });

    const db = await readDb();
    const user = db.users.find(item => item.email === email);
    if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    const fisherman = user.role === 'pescador' ? db.fishermen.find(item => item.userId === user.id) || null : null;
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
