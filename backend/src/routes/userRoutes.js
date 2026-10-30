const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { readDb, mutateDb } = require('../store');
const { authRequired, signToken, isCuratorEmail } = require('../auth');

const { newCodes, findCode, smsReady, toBrazilPhone, twilioVerify, allowAttempt, rateKey } = require('../recovery');

const router = express.Router();
const ROLES = new Set(['cliente', 'pescador']);

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function publicUser(user) {
  if (!user) return null;
  const { passwordHash, phoneNormalized, recoveryCodeHashes, credentialVersion, ...safe } = user;
  return { ...safe, curator: isCuratorEmail(user.email) };
}

router.get('/welcome', (req, res) => {
  res.json({ message: 'Bem-vindo ao EntreMarés — Saberes, Povoados e Produtos Caiçaras.' });
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
    const recovery = newCodes();
    const now = new Date().toISOString();
    const user = {
      id: crypto.randomUUID(),
      role,
      name: String(name).trim(),
      phone: String(phone).trim(),
      phoneNormalized: normalizedPhone,
      email: normalizedEmail,
      passwordHash,
      recoveryCodeHashes: recovery.hashes,
      credentialVersion: crypto.randomUUID(),
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
      status: 'published',
      publishedAt: now,
      createdAt: now,
      updatedAt: now
    } : null;

    await mutateDb(db => {
      db.users.push(user);
      if (fisherman) db.fishermen.push(fisherman);
    });

    res.set('Cache-Control', 'no-store').status(201).json({
      message: fisherman ? 'Cadastro criado. Você já pode anunciar pescados.' : 'Cadastro de cliente realizado.',
      token: signToken(user),
      user: publicUser(user),
      fisherman,
      recoveryCodes: recovery.codes
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

const genericSmsMessage = 'Se o telefone estiver cadastrado e o envio por SMS estiver habilitado, um código será enviado.';
function lookupUser(db, identifier) {
  const input = String(identifier || '').trim();
  if (!input || input.length > 150) return null;
  if (input.includes('@')) return db.users.find(u => String(u.email || '').toLowerCase() === input.toLowerCase()) || null;
  const digits = normalizePhone(input);
  if (!/^\d{10,13}$/.test(digits)) return null;
  const normalizeDomestic = value => {
    const phone = normalizePhone(value);
    return /^55\d{10,11}$/.test(phone) ? phone.slice(2) : phone;
  };
  const domestic = normalizeDomestic(digits);
  return db.users.find(u => normalizeDomestic(u.phoneNormalized || u.phone) === domestic) || null;
}
function rate(req, prefix, identifier, max, duration) {
  return allowAttempt(rateKey(prefix, req, identifier), max, duration)
    && allowAttempt(rateKey(prefix + '-ip', req), max * 4, duration);
}
router.get('/recovery/options', (_req, res) => {
  res.set('Cache-Control', 'no-store').json({ smsAvailable: smsReady(), backupCodesAvailable: true });
});
router.post('/recovery/request', async (req, res, next) => {
  try {
    if (!smsReady()) return res.status(503).json({ error: 'SMS ainda não configurado. Utilize um código de recuperação.' });
    const identifier = String(req.body?.identifier || '').trim();
    if (!identifier || identifier.length > 150 || identifier.includes('@')) {
      return res.status(400).json({ error: 'Informe o telefone cadastrado.' });
    }
    if (!rate(req, 'sms', identifier, 3, 3600000)) {
      return res.status(429).json({ error: 'Muitas solicitações. Tente novamente em uma hora.' });
    }
    const db = await readDb();
    const user = lookupUser(db, identifier);
    const phone = user && toBrazilPhone(user.phone);
    if (phone) {
      try { await twilioVerify('Verifications', { To: phone, Channel: 'sms' }); }
      catch (_) { console.warn('Erro temporário no provedor de SMS.'); }
    }
    res.json({ message: genericSmsMessage });
  } catch (error) { next(error); }
});
router.post('/recovery/reset', async (req, res, next) => {
  try {
    const identifier = String(req.body?.identifier || '').trim();
    const method = String(req.body?.method || 'backup');
    const code = String(req.body?.code || '').trim();
    const password = String(req.body?.newPassword || '');
    if (!identifier || identifier.length > 150 || !['backup', 'sms'].includes(method)) {
      return res.status(400).json({ error: 'Informe o telefone e a forma de recuperação.' });
    }
    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ error: 'Use de 8 a 128 caracteres na nova senha.' });
    }
    if (!rate(req, 'reset', identifier, 7, 15 * 60000)) {
      return res.status(429).json({ error: 'Muitas tentativas. Tente novamente em 15 minutos.' });
    }
    const db = await readDb();
    const user = lookupUser(db, identifier);
    if (method === 'backup') {
      if (!user || findCode(user.recoveryCodeHashes, code) < 0) {
        return res.status(400).json({ error: 'Não foi possível validar o código de recuperação.' });
      }
    } else {
      if (!smsReady()) return res.status(503).json({ error: 'Recuperação por SMS ainda não disponível.' });
      if (!/^\d{4,10}$/.test(code) || !user || !toBrazilPhone(user.phone)) {
        return res.status(400).json({ error: 'Não foi possível validar o código SMS.' });
      }
      let check = null;
      try { check = await twilioVerify('VerificationCheck', { To: toBrazilPhone(user.phone), Code: code }); }
      catch (_) { /* não revelar dados do provedor nem da conta */ }
      if (check?.status !== 'approved') {
        return res.status(400).json({ error: 'Não foi possível validar o código SMS.' });
      }
    }
    const hashed = await bcrypt.hash(password, 12);
    await mutateDb(db => {
      const account = db.users.find(u => u.id === user.id);
      if (!account) throw Object.assign(new Error('Conta indisponível.'), { status: 404 });
      if (method === 'backup') {
        const index = findCode(account.recoveryCodeHashes, code);
        if (index < 0) throw Object.assign(new Error('Código inválido ou já utilizado.'), { status: 400 });
        account.recoveryCodeHashes.splice(index, 1);
      }
      account.passwordHash = hashed;
      account.credentialVersion = crypto.randomUUID();
      account.passwordChangedAt = new Date().toISOString();
    });
    res.json({ message: 'Senha redefinida. Entre novamente com a nova senha.' });
  } catch (error) { next(error); }
});
router.get('/recovery/codes', authRequired, async (req, res, next) => {
  try {
    const db = await readDb();
    const user = db.users.find(u => u.id === req.auth.user.id);
    res.set('Cache-Control', 'no-store').json({
      available: Array.isArray(user?.recoveryCodeHashes) ? user.recoveryCodeHashes.length : 0
    });
  } catch (error) { next(error); }
});
router.post('/recovery/codes', authRequired, async (req, res, next) => {
  try {
    if (!rate(req, 'codes', req.auth.user.id, 5, 15 * 60000)) {
      return res.status(429).json({ error: 'Muitas tentativas. Tente novamente em 15 minutos.' });
    }
    const db = await readDb();
    const user = db.users.find(u => u.id === req.auth.user.id);
    if (!user || !(await bcrypt.compare(String(req.body?.password || ''), user.passwordHash))) {
      return res.status(400).json({ error: 'Senha atual incorreta.' });
    }
    const recovery = newCodes();
    await mutateDb(db => {
      const account = db.users.find(u => u.id === user.id);
      account.recoveryCodeHashes = recovery.hashes;
    });
    res.set('Cache-Control', 'no-store').json({
      recoveryCodes: recovery.codes,
      message: 'Códigos novos criados. Os anteriores foram cancelados.'
    });
  } catch (error) { next(error); }
});
router.post('/password/change', authRequired, async (req, res, next) => {
  try {
    const current = String(req.body?.currentPassword || '');
    const nextPassword = String(req.body?.newPassword || '');
    if (nextPassword.length < 8 || nextPassword.length > 128) {
      return res.status(400).json({ error: 'Use de 8 a 128 caracteres na nova senha.' });
    }
    if (!rate(req, 'change-password', req.auth.user.id, 5, 15 * 60000)) {
      return res.status(429).json({ error: 'Muitas tentativas. Tente novamente em 15 minutos.' });
    }
    const db = await readDb();
    const user = db.users.find(u => u.id === req.auth.user.id);
    if (!user || !(await bcrypt.compare(current, user.passwordHash))) {
      return res.status(400).json({ error: 'Senha atual incorreta.' });
    }
    const passwordHash = await bcrypt.hash(nextPassword, 12);
    await mutateDb(db => {
      const actual = db.users.find(u => u.id === user.id);
      actual.passwordHash = passwordHash;
      actual.credentialVersion = crypto.randomUUID();
      actual.passwordChangedAt = new Date().toISOString();
    });
    res.json({ message: 'Senha alterada. Entre novamente com a nova senha.' });
  } catch (error) { next(error); }
});

module.exports = router;
