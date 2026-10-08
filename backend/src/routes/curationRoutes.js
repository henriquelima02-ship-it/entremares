const express = require('express');
const { authRequired, requireCurator } = require('../auth');
const { readDb, mutateDb } = require('../store');

const router = express.Router();

function productIsActive(item) {
  if (item.status !== 'published') return false;
  const hours = [24, 36, 42].includes(Number(item.availabilityHours)) ? Number(item.availabilityHours) : 36;
  const expiry = item.expiresAt || (() => {
    const base = item.publishedAt || item.reviewedAt || item.updatedAt || item.createdAt;
    const baseTime = Date.parse(base);
    return Number.isFinite(baseTime) ? new Date(baseTime + hours * 60 * 60 * 1000).toISOString() : null;
  })();
  return !expiry || Date.parse(expiry) > Date.now();
}

router.use(authRequired, requireCurator);

router.get('/summary', async (req, res, next) => {
  try {
    const db = await readDb();
    res.json({
      fishermenPending: db.fishermen.filter(item => item.status === 'pending_review').length,
      productsPending: db.products.filter(item => item.status === 'pending_review').length,
      fishermenPublished: db.fishermen.filter(item => item.status === 'published').length,
      productsPublished: db.products.filter(productIsActive).length,
      ordersOpen: db.orders.filter(item => !['concluido', 'recusado', 'cancelado'].includes(item.status)).length
    });
  } catch (error) {
    next(error);
  }
});

router.get('/pending', async (req, res, next) => {
  try {
    const db = await readDb();
    const fishermen = db.fishermen
      .filter(item => item.status === 'pending_review')
      .map(item => {
        const user = db.users.find(user => user.id === item.userId);
        return {
          ...item,
          privateContact: user ? { name: user.name, email: user.email, phone: user.phone } : null
        };
      });
    const products = db.products
      .filter(item => item.status === 'pending_review')
      .map(item => ({
        ...item,
        fisherman: db.fishermen.find(fisherman => fisherman.id === item.fishermanId) || null
      }));
    res.json({ fishermen, products });
  } catch (error) {
    next(error);
  }
});

router.patch('/fishermen/:id', async (req, res, next) => {
  try {
    const action = String(req.body?.action || '');
    if (!['approve', 'reject'].includes(action)) return res.status(400).json({ error: 'Ação de curadoria inválida.' });
    const fisherman = await mutateDb(db => {
      const item = db.fishermen.find(entry => entry.id === req.params.id);
      if (!item) throw Object.assign(new Error('Pescador não encontrado.'), { status: 404 });
      item.status = action === 'approve' ? 'published' : 'rejected';
      item.reviewedAt = new Date().toISOString();
      item.reviewNote = String(req.body?.note || '').trim();
      return item;
    });
    res.json({ message: action === 'approve' ? 'Pescador aprovado.' : 'Cadastro recusado.', fisherman });
  } catch (error) {
    next(error);
  }
});

router.patch('/products/:id', async (req, res, next) => {
  try {
    const action = String(req.body?.action || '');
    if (!['approve', 'reject'].includes(action)) return res.status(400).json({ error: 'Ação de curadoria inválida.' });
    const product = await mutateDb(db => {
      const item = db.products.find(entry => entry.id === req.params.id);
      if (!item) throw Object.assign(new Error('Pescado não encontrado.'), { status: 404 });
      const fisherman = db.fishermen.find(entry => entry.id === item.fishermanId);
      if (action === 'approve' && fisherman?.status !== 'published') {
        throw Object.assign(new Error('Aprove primeiro o perfil do pescador.'), { status: 409 });
      }
      const now = new Date().toISOString();
      item.status = action === 'approve' ? 'published' : 'rejected';
      item.reviewedAt = now;
      item.reviewNote = String(req.body?.note || '').trim();
      item.updatedAt = now;
      if (action === 'approve') {
        const hours = [24, 36, 42].includes(Number(item.availabilityHours)) ? Number(item.availabilityHours) : 36;
        item.availabilityHours = hours;
        item.publishedAt = now;
        item.expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      } else {
        item.expiresAt = null;
      }
      return item;
    });
    res.json({ message: action === 'approve' ? 'Pescado publicado.' : 'Pescado recusado.', product });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
