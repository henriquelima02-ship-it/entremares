const express = require('express');
const crypto = require('crypto');
const { readDb, mutateDb } = require('../store');
const { authRequired, authOptional, requireFisher, requireCustomer } = require('../auth');

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

const ORDER_STATUS = new Set([
  'recebido',
  'confirmado',
  'em_preparo',
  'pronto_retirada',
  'em_rota',
  'concluido',
  'recusado',
  'cancelado'
]);

const AVAILABILITY_HOURS = new Set([24, 36, 42]);

function money(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function whatsappNumber(value) {
  let digits = normalizePhone(value);
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  return digits.length >= 12 ? digits : '';
}

function normalizeAvailabilityHours(value) {
  const hours = Number(value);
  return AVAILABILITY_HOURS.has(hours) ? hours : 36;
}

function expiresFromNow(hours) {
  const normalized = normalizeAvailabilityHours(hours);
  return new Date(Date.now() + normalized * 60 * 60 * 1000).toISOString();
}

function effectiveExpiresAt(product) {
  if (!product) return null;
  if (product.expiresAt) return product.expiresAt;
  if (product.status !== 'published') return null;

  const base = product.publishedAt || product.reviewedAt || product.updatedAt || product.createdAt;
  const baseTime = Date.parse(base);
  if (!Number.isFinite(baseTime)) return null;

  return new Date(baseTime + normalizeAvailabilityHours(product.availabilityHours) * 60 * 60 * 1000).toISOString();
}

function isExpired(product) {
  const expiresAt = effectiveExpiresAt(product);
  if (!expiresAt) return false;
  const time = Date.parse(expiresAt);
  return Number.isFinite(time) && time <= Date.now();
}

function isPublicProduct(product) {
  return product?.status === 'published'
    && Number(product.quantityKg) > 0
    && !isExpired(product);
}

function availabilityView(product) {
  return {
    ...product,
    availabilityHours: normalizeAvailabilityHours(product.availabilityHours),
    expiresAt: effectiveExpiresAt(product),
    expired: isExpired(product),
    active: isPublicProduct(product)
  };
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

function normalizeShipping(body = {}, fallback = {}) {
  return {
    pickup: body.pickup ?? fallback.pickup ?? true,
    communityDelivery: body.communityDelivery ?? fallback.communityDelivery ?? false,
    collaborativeFreight: body.collaborativeFreight ?? fallback.collaborativeFreight ?? false,
    deliveryFee: money(body.deliveryFee ?? fallback.deliveryFee ?? 0),
    collaborativeFee: money(body.collaborativeFee ?? fallback.collaborativeFee ?? 0),
    notes: String(body.notes ?? fallback.notes ?? '').trim()
  };
}

function publicFisherman(db, fisherman) {
  if (!fisherman) return null;
  const user = db.users.find(item => item.id === fisherman.userId);
  return {
    id: fisherman.id,
    displayName: fisherman.displayName,
    community: fisherman.community,
    pickupReference: fisherman.pickupReference,
    bio: fisherman.bio,
    shipping: fisherman.shipping,
    whatsapp: fisherman.whatsappPublic ? whatsappNumber(user?.phone) : ''
  };
}

function productView(db, product) {
  return {
    ...availabilityView(product),
    fisherman: publicFisherman(db, db.fishermen.find(item => item.id === product.fishermanId))
  };
}

function fishermanForUser(db, userId) {
  return db.fishermen.find(item => item.userId === userId) || null;
}

function assertOwnedProduct(db, productId, fishermanId) {
  const product = db.products.find(item => item.id === productId);
  if (!product) throw Object.assign(new Error('Pescado não encontrado.'), { status: 404 });
  if (product.fishermanId !== fishermanId) {
    throw Object.assign(new Error('Você não pode alterar este pescado.'), { status: 403 });
  }
  return product;
}

router.get('/fishermen', async (req, res, next) => {
  try {
    const db = await readDb();
    const items = db.fishermen
      .filter(item => item.status === 'published')
      .map(item => publicFisherman(db, item));
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

    const products = db.products
      .filter(item => item.fishermanId === fisherman.id && isPublicProduct(item))
      .map(item => productView(db, item));

    res.json({ fisherman: publicFisherman(db, fisherman), products });
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
      .filter(isPublicProduct)
      .filter(item => !species || item.species.toLowerCase().includes(species))
      .filter(item => !fishermanId || item.fishermanId === fishermanId)
      .map(item => productView(db, item));

    res.json({ items });
  } catch (error) {
    next(error);
  }
});

router.get('/products/:id', async (req, res, next) => {
  try {
    const db = await readDb();
    const product = db.products.find(item => item.id === req.params.id && isPublicProduct(item));
    if (!product) return res.status(404).json({ error: 'Produto não encontrado ou disponibilidade encerrada.' });
    res.json(productView(db, product));
  } catch (error) {
    next(error);
  }
});

router.get('/shipping/options', async (req, res, next) => {
  try {
    const productId = String(req.query.productId || '');
    const quantityKg = Math.max(0.1, Number(req.query.quantityKg || 1));
    const db = await readDb();
    const product = db.products.find(item => item.id === productId && isPublicProduct(item));
    if (!product) return res.status(404).json({ error: 'Produto não encontrado ou disponibilidade encerrada.' });

    const options = [];
    if (product.shipping?.pickup) {
      const fisherman = db.fishermen.find(item => item.id === product.fishermanId);
      options.push({
        id: 'pickup',
        label: 'Retirada com o pescador',
        fee: 0,
        note: fisherman?.pickupReference || 'Combinar ponto de retirada.'
      });
    }
    if (product.shipping?.communityDelivery) {
      options.push({
        id: 'community_delivery',
        label: 'Entrega comunitária',
        fee: money(product.shipping.deliveryFee || 0),
        note: product.shipping.notes || 'Rota e horário combinados após o pedido.'
      });
    }
    if (product.shipping?.collaborativeFreight) {
      const base = Number(product.shipping.collaborativeFee || 0);
      options.push({
        id: 'collaborative_freight',
        label: 'Frete colaborativo',
        fee: money(base + Math.max(0, quantityKg - 1) * 1.5),
        note: product.shipping.notes || 'Valor estimado; a rota é confirmada com a comunidade.'
      });
    }

    res.json({ productId, quantityKg: money(quantityKg), options });
  } catch (error) {
    next(error);
  }
});

router.post('/orders', authOptional, async (req, res, next) => {
  try {
    const loggedCustomer = req.auth?.user?.role === 'cliente' ? req.auth.user : null;
    const suppliedCustomer = req.body?.customer || {};
    const customer = loggedCustomer ? {
      name: loggedCustomer.name,
      phone: loggedCustomer.phone,
      community: loggedCustomer.community || suppliedCustomer.community || '',
      notes: suppliedCustomer.notes || ''
    } : suppliedCustomer;

    const { items = [], shippingType = 'pickup' } = req.body || {};
    if (!customer.name || !customer.phone) {
      return res.status(400).json({ error: 'Informe nome e telefone para o pedido.' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Adicione pelo menos um item.' });
    }

    const order = await mutateDb(db => {
      let subtotal = 0;
      let orderFishermanId = null;

      const normalizedItems = items.map(item => {
        const product = db.products.find(p => p.id === item.productId && isPublicProduct(p));
        if (!product) {
          throw Object.assign(new Error('Um dos produtos não está mais disponível.'), { status: 409 });
        }

        if (orderFishermanId && orderFishermanId !== product.fishermanId) {
          throw Object.assign(new Error('Nesta etapa, cada pedido deve conter produtos de um único pescador.'), { status: 409 });
        }
        orderFishermanId = product.fishermanId;

        const quantityKg = money(Number(item.quantityKg || 0));
        if (!quantityKg || quantityKg <= 0 || quantityKg > product.quantityKg) {
          throw Object.assign(new Error(`Quantidade indisponível para ${product.species}.`), { status: 409 });
        }

        const cuts = Array.isArray(product.cuts) ? product.cuts : [];
        const cut = cuts.find(c => c.id === item.cutId) || null;
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

      if (shippingType === 'community_delivery' && shipping.communityDelivery) {
        shippingFee = money(shipping.deliveryFee || 0);
      } else if (shippingType === 'collaborative_freight' && shipping.collaborativeFreight) {
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

      const now = new Date().toISOString();
      const created = {
        id: crypto.randomUUID(),
        code: `EM-${Date.now().toString(36).toUpperCase()}`,
        fishermanId: orderFishermanId,
        customerUserId: loggedCustomer?.id || null,
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
        stockRestored: false,
        createdAt: now,
        updatedAt: now
      };
      db.orders.push(created);
      return created;
    });

    res.status(201).json({
      message: 'Pedido recebido. O pescador ainda precisa confirmar disponibilidade, preparo e logística.',
      order
    });
  } catch (error) {
    next(error);
  }
});

router.get('/orders/:id', async (req, res, next) => {
  try {
    const db = await readDb();
    const order = db.orders.find(item => item.id === req.params.id || item.code === req.params.id);
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado.' });

    res.json({
      code: order.code,
      status: order.status,
      items: order.items,
      shippingType: order.shippingType,
      total: order.total,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    });
  } catch (error) {
    next(error);
  }
});

router.get('/customer/orders', authRequired, requireCustomer, async (req, res, next) => {
  try {
    const db = await readDb();
    const items = db.orders
      .filter(item => item.customerUserId === req.auth.user.id)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      .map(order => {
        const fisherman = db.fishermen.find(item => item.id === order.fishermanId);
        return {
          ...order,
          fisherman: fisherman ? {
            displayName: fisherman.displayName,
            community: fisherman.community
          } : null
        };
      });

    res.json({ items });
  } catch (error) {
    next(error);
  }
});

// Área autenticada do pescador
router.use('/dashboard', authRequired, requireFisher);

router.get('/dashboard', async (req, res, next) => {
  try {
    const db = await readDb();
    const fisherman = fishermanForUser(db, req.auth.user.id);
    if (!fisherman) return res.status(404).json({ error: 'Perfil de pescador não encontrado.' });

    const products = db.products
      .filter(item => item.fishermanId === fisherman.id)
      .map(availabilityView)
      .sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)));

    const orders = db.orders
      .filter(item => item.fishermanId === fisherman.id)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

    res.json({
      fisherman,
      products,
      orders,
      summary: {
        productsPublished: products.filter(item => item.active).length,
        productsPending: products.filter(item => item.status === 'pending_review').length,
        productsExpired: products.filter(item => item.expired && item.status === 'published').length,
        openOrders: orders.filter(item => !['concluido', 'recusado', 'cancelado'].includes(item.status)).length,
        totalOrders: orders.length
      }
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/dashboard/profile', async (req, res, next) => {
  try {
    const fisherman = await mutateDb(db => {
      const item = fishermanForUser(db, req.auth.user.id);
      if (!item) throw Object.assign(new Error('Perfil de pescador não encontrado.'), { status: 404 });

      if (req.body?.displayName !== undefined) item.displayName = String(req.body.displayName).trim();
      if (req.body?.community !== undefined) item.community = String(req.body.community).trim();
      if (req.body?.pickupReference !== undefined) item.pickupReference = String(req.body.pickupReference).trim();
      if (req.body?.bio !== undefined) item.bio = String(req.body.bio).trim();
      if (req.body?.whatsappPublic !== undefined) item.whatsappPublic = Boolean(req.body.whatsappPublic);
      if (req.body?.shipping) item.shipping = normalizeShipping(req.body.shipping, item.shipping || {});
      item.updatedAt = new Date().toISOString();

      if (item.status === 'rejected') item.status = 'pending_review';
      return item;
    });

    res.json({ message: 'Perfil atualizado.', fisherman });
  } catch (error) {
    next(error);
  }
});

router.post('/dashboard/products', async (req, res, next) => {
  try {
    const body = req.body || {};
    const species = String(body.species || '').trim();
    const quantityKg = Number(body.quantityKg);
    const pricePerKg = Number(body.pricePerKg);

    if (!species) return res.status(400).json({ error: 'Informe o pescado.' });
    if (!Number.isFinite(quantityKg) || quantityKg <= 0) {
      return res.status(400).json({ error: 'Informe a quantidade disponível em kg.' });
    }
    if (!Number.isFinite(pricePerKg) || pricePerKg <= 0) {
      return res.status(400).json({ error: 'Informe o preço por kg.' });
    }

    const db = await readDb();
    const fisherman = fishermanForUser(db, req.auth.user.id);
    if (!fisherman) return res.status(404).json({ error: 'Perfil de pescador não encontrado.' });

    const now = new Date().toISOString();
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
      shipping: normalizeShipping(body.shipping || {}, fisherman.shipping || {}),
      availabilityHours: normalizeAvailabilityHours(body.availabilityHours),
      expiresAt: null,
      status: 'pending_review',
      createdAt: now,
      updatedAt: now
    };

    await mutateDb(store => store.products.push(product));
    res.status(201).json({
      message: 'Pescado cadastrado e enviado para curadoria. A contagem de disponibilidade começa quando ele for publicado.',
      product
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/dashboard/products/:id', async (req, res, next) => {
  try {
    const body = req.body || {};

    const product = await mutateDb(db => {
      const fisherman = fishermanForUser(db, req.auth.user.id);
      if (!fisherman) throw Object.assign(new Error('Perfil de pescador não encontrado.'), { status: 404 });

      const item = assertOwnedProduct(db, req.params.id, fisherman.id);

      const nextCuts = body.cuts !== undefined ? normalizeCuts(body.cuts) : item.cuts;
      const nextShipping = body.shipping !== undefined
        ? normalizeShipping(body.shipping, item.shipping || {})
        : item.shipping;

      const requiresReview =
        (body.species !== undefined && String(body.species).trim() !== String(item.species || '')) ||
        (body.pricePerKg !== undefined && money(Number(body.pricePerKg)) !== money(Number(item.pricePerKg))) ||
        (body.category !== undefined && String(body.category).trim() !== String(item.category || '')) ||
        (body.originNote !== undefined && String(body.originNote).trim() !== String(item.originNote || '')) ||
        (body.description !== undefined && String(body.description).trim() !== String(item.description || '')) ||
        (body.cuts !== undefined && JSON.stringify(nextCuts) !== JSON.stringify(item.cuts || [])) ||
        (body.shipping !== undefined && JSON.stringify(nextShipping) !== JSON.stringify(item.shipping || {}));

      if (body.species !== undefined) item.species = String(body.species).trim();
      if (body.scientificName !== undefined) item.scientificName = String(body.scientificName).trim();
      if (body.category !== undefined) item.category = String(body.category).trim();
      if (body.state !== undefined) item.state = String(body.state).trim();

      if (body.quantityKg !== undefined) {
        const value = Number(body.quantityKg);
        if (!Number.isFinite(value) || value < 0) {
          throw Object.assign(new Error('Quantidade inválida.'), { status: 400 });
        }
        item.quantityKg = money(value);
      }

      if (body.pricePerKg !== undefined) {
        const value = Number(body.pricePerKg);
        if (!Number.isFinite(value) || value <= 0) {
          throw Object.assign(new Error('Preço inválido.'), { status: 400 });
        }
        item.pricePerKg = money(value);
      }

      if (body.catchDate !== undefined) item.catchDate = String(body.catchDate).trim();
      if (body.originNote !== undefined) item.originNote = String(body.originNote).trim();
      if (body.description !== undefined) item.description = String(body.description).trim();
      if (body.cuts !== undefined) item.cuts = nextCuts;
      if (body.shipping !== undefined) item.shipping = nextShipping;

      if (body.availabilityHours !== undefined) {
        item.availabilityHours = normalizeAvailabilityHours(body.availabilityHours);
        if (item.status === 'published') item.expiresAt = expiresFromNow(item.availabilityHours);
      }

      if (requiresReview && item.status === 'published') {
        item.status = 'pending_review';
        item.expiresAt = null;
      }
      if (item.status === 'rejected') {
        item.status = 'pending_review';
        item.expiresAt = null;
      }

      item.updatedAt = new Date().toISOString();
      return item;
    });

    res.json({
      message: product.status === 'pending_review'
        ? 'Alterações salvas e enviadas para revisão.'
        : 'Pescado atualizado.',
      product: availabilityView(product)
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/dashboard/products/:id/status', async (req, res, next) => {
  try {
    const action = String(req.body?.action || '');
    if (!['pause', 'submit', 'renew'].includes(action)) {
      return res.status(400).json({ error: 'Ação inválida.' });
    }

    const product = await mutateDb(db => {
      const fisherman = fishermanForUser(db, req.auth.user.id);
      if (!fisherman) throw Object.assign(new Error('Perfil de pescador não encontrado.'), { status: 404 });

      const item = assertOwnedProduct(db, req.params.id, fisherman.id);

      if (action === 'pause') {
        item.status = 'paused';
      } else if (action === 'submit') {
        item.status = 'pending_review';
        item.expiresAt = null;
      } else {
        const previouslyPublished = item.status === 'published' || item.status === 'paused' || Boolean(item.publishedAt);
        if (!previouslyPublished) {
          throw Object.assign(new Error('Este pescado precisa ser aprovado antes da primeira renovação.'), { status: 409 });
        }
        if (Number(item.quantityKg) <= 0) {
          throw Object.assign(new Error('Atualize o estoque antes de renovar o anúncio.'), { status: 409 });
        }
        item.status = 'published';
        item.expiresAt = expiresFromNow(item.availabilityHours);
      }

      item.updatedAt = new Date().toISOString();
      return item;
    });

    const message = action === 'pause'
      ? 'Anúncio pausado.'
      : action === 'renew'
        ? `Disponibilidade renovada por ${normalizeAvailabilityHours(product.availabilityHours)} horas.`
        : 'Anúncio enviado para revisão.';

    res.json({ message, product: availabilityView(product) });
  } catch (error) {
    next(error);
  }
});

router.get('/dashboard/orders', async (req, res, next) => {
  try {
    const db = await readDb();
    const fisherman = fishermanForUser(db, req.auth.user.id);
    if (!fisherman) return res.status(404).json({ error: 'Perfil de pescador não encontrado.' });

    const items = db.orders
      .filter(item => item.fishermanId === fisherman.id)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

    res.json({ items });
  } catch (error) {
    next(error);
  }
});

router.patch('/dashboard/orders/:id/status', async (req, res, next) => {
  try {
    const nextStatus = String(req.body?.status || '');
    if (!ORDER_STATUS.has(nextStatus)) {
      return res.status(400).json({ error: 'Status de pedido inválido.' });
    }

    const order = await mutateDb(db => {
      const fisherman = fishermanForUser(db, req.auth.user.id);
      if (!fisherman) throw Object.assign(new Error('Perfil de pescador não encontrado.'), { status: 404 });

      const item = db.orders.find(order => order.id === req.params.id && order.fishermanId === fisherman.id);
      if (!item) throw Object.assign(new Error('Pedido não encontrado.'), { status: 404 });

      const rejecting = ['recusado', 'cancelado'].includes(nextStatus);
      if (rejecting && !item.stockRestored) {
        item.items.forEach(orderItem => {
          const product = db.products.find(product => product.id === orderItem.productId);
          if (product) {
            product.quantityKg = money(Number(product.quantityKg || 0) + Number(orderItem.quantityKg || 0));
            product.updatedAt = new Date().toISOString();
          }
        });
        item.stockRestored = true;
      }

      item.status = nextStatus;
      item.updatedAt = new Date().toISOString();
      return item;
    });

    res.json({ message: 'Status do pedido atualizado.', order });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
