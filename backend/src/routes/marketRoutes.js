const express = require('express');
const crypto = require('crypto');
const { readDb, mutateDb } = require('../store');

const router = express.Router();
const CUT_LABELS = {
  inteiro: 'Inteiro',
  limpo: 'Limpo',
  eviscerado: 'Eviscerado',
  file: 'Filé',
  posta: 'Posta',
  descascado: 'Descascado',
  sem_cabeca: 'Sem cabeça'
};

function money(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function normalizeCuts(cuts) {
  if (!Array.isArray(cuts)) return [];
  return cuts
    .filter(cut => cut && CUT_LABELS[cut.id])
    .map(cut => ({
      id: cut.id,
      label: CUT_LABELS[cut.id],
      extraPerKg: money(Math.max(0, Number(cut.extraPerKg || 0)))
    }));
}

function productView(product, fisherman) {
  return {
    ...product,
    fisherman: fisherman ? {
      id: fisherman.id,
      displayName: fisherman.displayName,
      community: fisherman.community,
      pickupReference: fisherman.pickupReference
    } : null
  };
}

router.get('/fishermen', async (req, res, next) => {
  try {
    const db = await readDb();
    const items = db.fishermen
      .filter(item => item.status === 'published')
      .map(item => ({
        id: item.id,
        displayName: item.displayName,
        community: item.community,
        pickupReference: item.pickupReference,
        bio: item.bio,
        shipping: item.shipping
      }));
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

router.get('/fishermen/:id', async (req, res, next) => {
  try {
    const db = await readDb();
    const fisherman = db.fishermen.find(item => item.id === req.params.id && item.status === 'published');
    if (!fisherman) return res.status(404).json({ error: 'Pescador não encontrado.' });
    const products = db.products.filter(item => item.fishermanId === fisherman.id && item.status === 'published');
    res.json({ fisherman, products });
  } catch (error) {
    next(error);
  }
});

router.get('/products', async (req, res, next) => {
  try {
    const db = await readDb();
    const species = String(req.query.species || '').trim().toLowerCase();
    const fishermanId = String(req.query.fishermanId || '').trim();
    const items = db.products
      .filter(item => item.status === 'published')
      .filter(item => !species || item.species.toLowerCase().includes(species))
      .filter(item => !fishermanId || item.fishermanId === fishermanId)
      .map(item => productView(item, db.fishermen.find(f => f.id === item.fishermanId)));
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

router.get('/products/:id', async (req, res, next) => {
  try {
    const db = await readDb();
    const product = db.products.find(item => item.id === req.params.id && item.status === 'published');
    if (!product) return res.status(404).json({ error: 'Produto não encontrado.' });
    res.json(productView(product, db.fishermen.find(f => f.id === product.fishermanId)));
  } catch (error) {
    next(error);
  }
});

router.post('/fishermen/:id/products', async (req, res, next) => {
  try {
    const body = req.body || {};
    const species = String(body.species || '').trim();
    const quantityKg = Number(body.quantityKg);
    const pricePerKg = Number(body.pricePerKg);
    if (!species) return res.status(400).json({ error: 'Informe o pescado.' });
    if (!Number.isFinite(quantityKg) || quantityKg <= 0) return res.status(400).json({ error: 'Informe a quantidade disponível em kg.' });
    if (!Number.isFinite(pricePerKg) || pricePerKg <= 0) return res.status(400).json({ error: 'Informe o preço por kg.' });

    const db = await readDb();
    const fisherman = db.fishermen.find(item => item.id === req.params.id);
    if (!fisherman) return res.status(404).json({ error: 'Cadastro de pescador não encontrado.' });

    const now = new Date().toISOString();
    const shippingBase = fisherman.shipping || {};
    const product = {
      id: crypto.randomUUID(),
      fishermanId: fisherman.id,
      species,
      scientificName: String(body.scientificName || '').trim(),
      category: String(body.category || 'peixe').trim(),
      state: String(body.state || 'fresco').trim(),
      quantityKg: money(quantityKg),
      pricePerKg: money(pricePerKg),
      catchDate: String(body.catchDate || '').trim(),
      originNote: String(body.originNote || '').trim(),
      description: String(body.description || '').trim(),
      cuts: normalizeCuts(body.cuts),
      shipping: {
        pickup: body.shipping?.pickup ?? shippingBase.pickup ?? true,
        communityDelivery: body.shipping?.communityDelivery ?? shippingBase.communityDelivery ?? false,
        collaborativeFreight: body.shipping?.collaborativeFreight ?? shippingBase.collaborativeFreight ?? false,
        deliveryFee: money(body.shipping?.deliveryFee ?? shippingBase.deliveryFee ?? 0),
        collaborativeFee: money(body.shipping?.collaborativeFee ?? shippingBase.collaborativeFee ?? 0),
        notes: String(body.shipping?.notes ?? shippingBase.notes ?? '').trim()
      },
      status: fisherman.status === 'published' ? 'published' : 'pending_review',
      createdAt: now,
      updatedAt: now
    };

    await mutateDb(store => store.products.push(product));
    res.status(201).json({
      message: product.status === 'published' ? 'Pescado publicado.' : 'Pescado cadastrado e aguardando revisão.',
      product
    });
  } catch (error) {
    next(error);
  }
});

router.get('/shipping/options', async (req, res, next) => {
  try {
    const productId = String(req.query.productId || '');
    const quantityKg = Math.max(0.1, Number(req.query.quantityKg || 1));
    const db = await readDb();
    const product = db.products.find(item => item.id === productId && item.status === 'published');
    if (!product) return res.status(404).json({ error: 'Produto não encontrado.' });
    const options = [];
    if (product.shipping?.pickup) {
      const fisher = db.fishermen.find(item => item.id === product.fishermanId);
      options.push({ id: 'pickup', label: 'Retirada com o pescador', fee: 0, note: fisher?.pickupReference || 'Combinar ponto de retirada.' });
    }
    if (product.shipping?.communityDelivery) {
      options.push({ id: 'community_delivery', label: 'Entrega comunitária', fee: money(product.shipping.deliveryFee || 0), note: product.shipping.notes || 'Rota e horário combinados após o pedido.' });
    }
    if (product.shipping?.collaborativeFreight) {
      const base = Number(product.shipping.collaborativeFee || 0);
      options.push({ id: 'collaborative_freight', label: 'Frete colaborativo', fee: money(base + Math.max(0, quantityKg - 1) * 1.5), note: product.shipping.notes || 'Valor estimado; a rota é confirmada com a comunidade.' });
    }
    res.json({ productId, quantityKg: money(quantityKg), options });
  } catch (error) {
    next(error);
  }
});

router.post('/orders', async (req, res, next) => {
  try {
    const { customer = {}, items = [], shippingType = 'pickup' } = req.body || {};
    if (!customer.name || !customer.phone) return res.status(400).json({ error: 'Informe nome e telefone para o pedido.' });
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Adicione pelo menos um item.' });

    const order = await mutateDb(db => {
      let subtotal = 0;
      const normalizedItems = items.map(item => {
        const product = db.products.find(p => p.id === item.productId && p.status === 'published');
        if (!product) throw Object.assign(new Error('Um dos produtos não está mais disponível.'), { status: 409 });
        const quantityKg = money(Number(item.quantityKg || 0));
        if (!quantityKg || quantityKg <= 0 || quantityKg > product.quantityKg) {
          throw Object.assign(new Error(`Quantidade indisponível para ${product.species}.`), { status: 409 });
        }
        const cut = product.cuts.find(c => c.id === item.cutId) || null;
        const unitPrice = money(product.pricePerKg + Number(cut?.extraPerKg || 0));
        const lineTotal = money(unitPrice * quantityKg);
        subtotal = money(subtotal + lineTotal);
        return {
          productId: product.id,
          fishermanId: product.fishermanId,
          species: product.species,
          quantityKg,
          cut: cut ? { id: cut.id, label: cut.label } : null,
          unitPrice,
          lineTotal
        };
      });

      const firstProduct = db.products.find(p => p.id === normalizedItems[0].productId);
      const shipping = firstProduct.shipping || {};
      let shippingFee = 0;
      if (shippingType === 'community_delivery' && shipping.communityDelivery) shippingFee = money(shipping.deliveryFee || 0);
      else if (shippingType === 'collaborative_freight' && shipping.collaborativeFreight) {
        const totalKg = normalizedItems.reduce((sum, item) => sum + item.quantityKg, 0);
        shippingFee = money(Number(shipping.collaborativeFee || 0) + Math.max(0, totalKg - 1) * 1.5);
      } else if (shippingType !== 'pickup' || !shipping.pickup) {
        throw Object.assign(new Error('Modalidade de entrega indisponível para este pedido.'), { status: 409 });
      }

      normalizedItems.forEach(item => {
        const product = db.products.find(p => p.id === item.productId);
        product.quantityKg = money(product.quantityKg - item.quantityKg);
        product.updatedAt = new Date().toISOString();
      });

      const created = {
        id: crypto.randomUUID(),
        code: `EM-${Date.now().toString(36).toUpperCase()}`,
        customer: {
          name: String(customer.name).trim(),
          phone: String(customer.phone).trim(),
          community: String(customer.community || '').trim(),
          notes: String(customer.notes || '').trim()
        },
        items: normalizedItems,
        shippingType,
        subtotal,
        shippingFee,
        total: money(subtotal + shippingFee),
        status: 'recebido',
        createdAt: new Date().toISOString()
      };
      db.orders.push(created);
      return created;
    });

    res.status(201).json({ message: 'Pedido recebido. O contato e a logística ainda devem ser confirmados pela comunidade.', order });
  } catch (error) {
    next(error);
  }
});

router.get('/orders/:id', async (req, res, next) => {
  try {
    const db = await readDb();
    const order = db.orders.find(item => item.id === req.params.id || item.code === req.params.id);
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado.' });
    res.json(order);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
