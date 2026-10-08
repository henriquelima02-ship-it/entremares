(function () {
  const configured = (window.ENTREMARES_API_URL || localStorage.getItem('entremares_api_url') || '').replace(/\/$/, '');
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const isGitHubPages = window.location.hostname === 'henriquelima02-ship-it.github.io';
  const productionApi = isGitHubPages ? 'https://entremares-api.onrender.com/api' : '';
  const base = configured || (isLocal ? 'http://localhost:3000/api' : productionApi);

  const DEMO_KEY = 'entremares_market_demo_v4';
  const SESSION_KEY = 'entremares_session_v1';
  const AVAILABILITY = [24, 36, 42];

  const nowIso = () => new Date().toISOString();
  const expiryIso = hours => new Date(Date.now() + Number(hours || 36) * 60 * 60 * 1000).toISOString();
  const normalizeHours = value => AVAILABILITY.includes(Number(value)) ? Number(value) : 36;
  const isExpired = product => Boolean(product?.expiresAt && Date.parse(product.expiresAt) <= Date.now());
  const isActive = product => product?.status === 'published' && Number(product.quantityKg) > 0 && !isExpired(product);

  const seed = {
    users: [],
    fishermen: [{
      id: 'demo-pescador-01',
      userId: 'demo-user-01',
      displayName: 'Pescador demonstrativo',
      community: 'Baía de Paranaguá',
      pickupReference: 'Ponto de retirada a combinar',
      bio: 'Perfil fictício utilizado para testar o painel e a logística do Camarão na Tarrafa.',
      whatsappPublic: false,
      whatsapp: '',
      shipping: {
        pickup: true,
        communityDelivery: true,
        collaborativeFreight: true,
        deliveryFee: 8,
        collaborativeFee: 12,
        notes: 'Rotas demonstrativas.'
      },
      status: 'published'
    }],
    products: [
      {
        id: 'demo-camarao-branco',
        fishermanId: 'demo-pescador-01',
        species: 'Camarão-branco',
        category: 'crustaceo',
        state: 'resfriado',
        quantityKg: 12,
        pricePerKg: 42,
        description: 'Exemplo demonstrativo para testar cortes e logística. Não representa estoque real.',
        originNote: 'Produto demonstrativo.',
        cuts: [
          { id: 'inteiro', label: 'Inteiro', extraPerKg: 0 },
          { id: 'descascado', label: 'Descascado', extraPerKg: 8 },
          { id: 'sem_cabeca', label: 'Sem cabeça', extraPerKg: 5 }
        ],
        shipping: {
          pickup: true,
          communityDelivery: true,
          collaborativeFreight: true,
          deliveryFee: 8,
          collaborativeFee: 12,
          notes: 'Rota demonstrativa.'
        },
        availabilityHours: 36,
        expiresAt: expiryIso(36),
        status: 'published',
        publishedAt: nowIso(),
        updatedAt: nowIso()
      },
      {
        id: 'demo-tainha',
        fishermanId: 'demo-pescador-01',
        species: 'Tainha',
        category: 'peixe',
        state: 'fresco',
        quantityKg: 18,
        pricePerKg: 29,
        description: 'Exemplo de pescado com opções de preparo. Não representa estoque real.',
        originNote: 'Produto demonstrativo.',
        cuts: [
          { id: 'inteiro', label: 'Inteiro', extraPerKg: 0 },
          { id: 'limpo', label: 'Limpo', extraPerKg: 3 },
          { id: 'posta', label: 'Posta', extraPerKg: 6 }
        ],
        shipping: {
          pickup: true,
          communityDelivery: true,
          collaborativeFreight: false,
          deliveryFee: 8,
          collaborativeFee: 0,
          notes: 'Rota demonstrativa.'
        },
        availabilityHours: 24,
        expiresAt: expiryIso(24),
        status: 'published',
        publishedAt: nowIso(),
        updatedAt: nowIso()
      },
      {
        id: 'demo-robalo',
        fishermanId: 'demo-pescador-01',
        species: 'Robalo',
        category: 'peixe',
        state: 'fresco',
        quantityKg: 8,
        pricePerKg: 48,
        description: 'Exemplo para demonstrar filé, posta e retirada. Não representa estoque real.',
        originNote: 'Produto demonstrativo.',
        cuts: [
          { id: 'inteiro', label: 'Inteiro', extraPerKg: 0 },
          { id: 'file', label: 'Filé', extraPerKg: 12 },
          { id: 'posta', label: 'Posta', extraPerKg: 7 }
        ],
        shipping: {
          pickup: true,
          communityDelivery: false,
          collaborativeFreight: true,
          deliveryFee: 0,
          collaborativeFee: 12,
          notes: 'Rota demonstrativa.'
        },
        availabilityHours: 42,
        expiresAt: expiryIso(42),
        status: 'published',
        publishedAt: nowIso(),
        updatedAt: nowIso()
      }
    ],
    orders: []
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeDemoData(data) {
    const normalized = data && typeof data === 'object' ? data : {};
    normalized.users = Array.isArray(normalized.users) ? normalized.users : [];
    normalized.fishermen = Array.isArray(normalized.fishermen) ? normalized.fishermen : [];
    normalized.products = Array.isArray(normalized.products) ? normalized.products : [];
    normalized.orders = Array.isArray(normalized.orders) ? normalized.orders : [];
    return normalized;
  }

  function demoData() {
    try {
      const saved = JSON.parse(localStorage.getItem(DEMO_KEY) || 'null');
      if (saved && Array.isArray(saved.products)) return normalizeDemoData(saved);
    } catch (_) {}
    const initial = clone(seed);
    localStorage.setItem(DEMO_KEY, JSON.stringify(initial));
    return initial;
  }

  function saveDemo(data) {
    localStorage.setItem(DEMO_KEY, JSON.stringify(normalizeDemoData(data)));
  }

  function getSession() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    } catch (_) {
      return null;
    }
  }

  function setSession(session) {
    if (!session) sessionStorage.removeItem(SESSION_KEY);
    else sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    window.dispatchEvent(new CustomEvent('entremares:session', { detail: session }));
    return session;
  }

  function authHeaders() {
    const token = getSession()?.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function request(path, options = {}, authenticated = false) {
    if (!base) throw new Error('DEMO_MODE');

    const response = await fetch(`${base}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(authenticated ? authHeaders() : {}),
        ...(options.headers || {})
      }
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401 && authenticated) setSession(null);
      throw new Error(data.error || 'Não foi possível concluir a operação.');
    }
    return data;
  }

  function fishermanFor(data, id) {
    return data.fishermen.find(item => item.id === id) || null;
  }

  function productWithAvailability(product) {
    return {
      ...product,
      availabilityHours: normalizeHours(product.availabilityHours),
      expired: isExpired(product),
      active: isActive(product)
    };
  }

  async function registerUser(payload) {
    if (base) {
      const response = await request('/users/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setSession({
        token: response.token,
        user: response.user,
        fisherman: response.fisherman || null
      });
      return response;
    }

    const data = demoData();
    const userId = `local-user-${Date.now()}`;
    const safeUser = {
      id: userId,
      role: payload.role,
      name: payload.name,
      phone: payload.phone,
      email: payload.email || '',
      community: payload.profile?.community || '',
      curator: false
    };
    data.users.push(safeUser);

    let fisherman = null;
    if (payload.role === 'pescador') {
      fisherman = {
        id: `local-fisher-${Date.now()}`,
        userId,
        displayName: payload.profile?.displayName || payload.name,
        community: payload.profile?.community || '',
        pickupReference: payload.profile?.pickupReference || '',
        bio: payload.profile?.bio || '',
        whatsappPublic: payload.profile?.whatsappPublic !== false,
        whatsapp: '',
        shipping: payload.profile?.shipping || { pickup: true },
        status: 'pending_review',
        updatedAt: nowIso()
      };
      data.fishermen.push(fisherman);
    }

    saveDemo(data);
    setSession({ demo: true, user: safeUser, fisherman });
    return {
      message: 'Cadastro salvo apenas neste navegador em modo demonstrativo.',
      user: safeUser,
      fisherman,
      demo: true
    };
  }

  async function login(identifier, password) {
    if (base) {
      const response = await request('/users/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password })
      });
      setSession({
        token: response.token,
        user: response.user,
        fisherman: response.fisherman || null
      });
      return response;
    }
    throw new Error('No modo de teste, use um dos acessos demonstrativos.');
  }

  function startDemoFisherSession() {
    const data = demoData();
    const fisherman = data.fishermen[0];
    const session = {
      demo: true,
      user: {
        id: fisherman.userId || 'demo-user-01',
        role: 'pescador',
        name: fisherman.displayName,
        email: 'demo@entremares.local',
        curator: false
      },
      fisherman
    };
    setSession(session);
    return session;
  }

  function startDemoCustomerSession() {
    const session = {
      demo: true,
      user: {
        id: 'demo-customer',
        role: 'cliente',
        name: 'Cliente demonstrativo',
        phone: '(41) 99999-0000',
        email: '',
        curator: false
      },
      fisherman: null
    };
    setSession(session);
    return session;
  }

  function startDemoCuratorSession() {
    const session = {
      demo: true,
      user: {
        id: 'demo-curator',
        role: 'cliente',
        name: 'Curadoria demonstrativa',
        email: 'curadoria@entremares.local',
        curator: true
      },
      fisherman: null
    };
    setSession(session);
    return session;
  }

  async function refreshMe() {
    if (!base) return getSession();
    const response = await request('/users/me', {}, true);
    const current = getSession() || {};
    const session = {
      ...current,
      user: response.user,
      fisherman: response.fisherman || null
    };
    setSession(session);
    return session;
  }

  function logout() {
    setSession(null);
  }

  async function createProduct(fishermanId, payload) {
    if (base) {
      return request('/market/dashboard/products', {
        method: 'POST',
        body: JSON.stringify(payload)
      }, true);
    }

    const data = demoData();
    const session = getSession();
    const ownerId = session?.fisherman?.id || fishermanId;
    if (!ownerId) throw new Error('Abra uma sessão de pescador antes de cadastrar o produto.');

    const product = {
      id: `local-product-${Date.now()}`,
      fishermanId: ownerId,
      ...payload,
      availabilityHours: normalizeHours(payload.availabilityHours),
      expiresAt: null,
      status: 'pending_review',
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    data.products.unshift(product);
    saveDemo(data);
    return {
      message: 'Pescado salvo apenas neste navegador em modo demonstrativo.',
      product: productWithAvailability(product),
      demo: true
    };
  }

  async function listFishermen() {
    if (base) return request('/market/fishermen');
    const data = demoData();
    return {
      items: data.fishermen.filter(item => item.status === 'published'),
      demo: true
    };
  }

  async function listProducts(filters = {}) {
    if (base) {
      const query = new URLSearchParams();
      if (filters.species) query.set('species', filters.species);
      if (filters.fishermanId) query.set('fishermanId', filters.fishermanId);
      return request(`/market/products${query.toString() ? `?${query}` : ''}`);
    }

    const data = demoData();
    let items = data.products.filter(isActive);
    if (filters.species) {
      items = items.filter(item => item.species.toLowerCase().includes(filters.species.toLowerCase()));
    }
    if (filters.fishermanId) {
      items = items.filter(item => item.fishermanId === filters.fishermanId);
    }

    items = items.map(item => ({
      ...productWithAvailability(item),
      fisherman: fishermanFor(data, item.fishermanId)
    }));
    return { items, demo: true };
  }

  async function shippingOptions(productId, quantityKg = 1) {
    if (base) {
      return request(`/market/shipping/options?productId=${encodeURIComponent(productId)}&quantityKg=${encodeURIComponent(quantityKg)}`);
    }

    const data = demoData();
    const product = data.products.find(item => item.id === productId && isActive(item));
    if (!product) throw new Error('Produto não encontrado ou disponibilidade encerrada.');

    const options = [];
    const fisherman = fishermanFor(data, product.fishermanId);
    if (product.shipping?.pickup) {
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
        fee: Number(product.shipping.deliveryFee || 0),
        note: product.shipping.notes || ''
      });
    }
    if (product.shipping?.collaborativeFreight) {
      options.push({
        id: 'collaborative_freight',
        label: 'Frete colaborativo',
        fee: Number(product.shipping.collaborativeFee || 0) + Math.max(0, Number(quantityKg) - 1) * 1.5,
        note: product.shipping.notes || ''
      });
    }
    return { options, demo: true };
  }

  async function createOrder(payload) {
    const session = getSession();
    if (base) {
      return request('/market/orders', {
        method: 'POST',
        body: JSON.stringify(payload)
      }, Boolean(session?.token));
    }

    const data = demoData();
    const product = data.products.find(item => item.id === payload.items?.[0]?.productId && isActive(item));
    if (!product) throw new Error('Produto não encontrado ou disponibilidade encerrada.');

    const quantity = Number(payload.items[0].quantityKg || 0);
    if (quantity <= 0 || quantity > Number(product.quantityKg)) throw new Error('Quantidade indisponível.');
    product.quantityKg = Math.round((Number(product.quantityKg) - quantity) * 100) / 100;

    const cut = product.cuts?.find(item => item.id === payload.items[0].cutId) || null;
    const subtotal = (Number(product.pricePerKg) + Number(cut?.extraPerKg || 0)) * quantity;
    const ship = product.shipping || {};
    let shippingFee = 0;
    if (payload.shippingType === 'community_delivery') shippingFee = Number(ship.deliveryFee || 0);
    if (payload.shippingType === 'collaborative_freight') {
      shippingFee = Number(ship.collaborativeFee || 0) + Math.max(0, quantity - 1) * 1.5;
    }

    const customer = session?.user?.role === 'cliente'
      ? {
          name: session.user.name,
          phone: session.user.phone || payload.customer?.phone || '',
          community: session.user.community || payload.customer?.community || '',
          notes: payload.customer?.notes || ''
        }
      : payload.customer;

    const order = {
      id: `local-order-${Date.now()}`,
      code: `EM-DEMO-${Date.now().toString(36).toUpperCase()}`,
      fishermanId: product.fishermanId,
      customerUserId: session?.user?.role === 'cliente' ? session.user.id : null,
      customer,
      items: [{
        productId: product.id,
        fishermanId: product.fishermanId,
        species: product.species,
        quantityKg: quantity,
        cut: cut ? { id: cut.id, label: cut.label } : null,
        unitPrice: Number(product.pricePerKg) + Number(cut?.extraPerKg || 0),
        lineTotal: subtotal
      }],
      shippingType: payload.shippingType,
      subtotal,
      shippingFee,
      total: subtotal + shippingFee,
      status: 'recebido',
      stockRestored: false,
      createdAt: nowIso(),
      updatedAt: nowIso()
    };

    data.orders.push(order);
    saveDemo(data);
    return {
      message: 'Pedido simulado salvo apenas neste navegador.',
      order,
      demo: true
    };
  }

  async function customerOrders() {
    if (base) return request('/market/customer/orders', {}, true);

    const data = demoData();
    const session = getSession();
    if (session?.user?.role !== 'cliente') throw new Error('Entre como cliente para ver seus pedidos.');

    const items = data.orders
      .filter(item => item.customerUserId === session.user.id)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      .map(order => ({
        ...order,
        fisherman: fishermanFor(data, order.fishermanId)
      }));

    return { items, demo: true };
  }

  async function dashboard() {
    if (base) return request('/market/dashboard', {}, true);

    const data = demoData();
    const session = getSession();
    const fishermanId = session?.fisherman?.id;
    if (!fishermanId) throw new Error('Abra uma sessão de pescador.');

    const fisherman = fishermanFor(data, fishermanId);
    const products = data.products
      .filter(item => item.fishermanId === fishermanId)
      .map(productWithAvailability);
    const orders = data.orders.filter(item => item.fishermanId === fishermanId);

    return {
      fisherman,
      products,
      orders,
      summary: {
        productsPublished: products.filter(item => item.active).length,
        productsPending: products.filter(item => item.status === 'pending_review').length,
        productsExpired: products.filter(item => item.expired && item.status === 'published').length,
        openOrders: orders.filter(item => !['concluido', 'recusado', 'cancelado'].includes(item.status)).length,
        totalOrders: orders.length
      },
      demo: true
    };
  }

  async function updateFisherProfile(payload) {
    if (base) {
      return request('/market/dashboard/profile', {
        method: 'PATCH',
        body: JSON.stringify(payload)
      }, true);
    }

    const data = demoData();
    const session = getSession();
    const fisherman = fishermanFor(data, session?.fisherman?.id);
    if (!fisherman) throw new Error('Perfil não encontrado.');

    Object.assign(fisherman, payload, { updatedAt: nowIso() });
    if (payload.shipping) fisherman.shipping = { ...(fisherman.shipping || {}), ...payload.shipping };
    if (fisherman.status === 'rejected') fisherman.status = 'pending_review';

    saveDemo(data);
    setSession({ ...session, fisherman });
    return {
      message: 'Perfil atualizado no modo demonstrativo.',
      fisherman,
      demo: true
    };
  }

  async function updateProduct(productId, payload) {
    if (base) {
      return request(`/market/dashboard/products/${encodeURIComponent(productId)}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      }, true);
    }

    const data = demoData();
    const product = data.products.find(item => item.id === productId);
    if (!product) throw new Error('Pescado não encontrado.');

    const nextShipping = payload.shipping ? { ...(product.shipping || {}), ...payload.shipping } : product.shipping;
    const nextCuts = payload.cuts || product.cuts;
    const requiresReview =
      (payload.species !== undefined && String(payload.species).trim() !== String(product.species || '')) ||
      (payload.pricePerKg !== undefined && Number(payload.pricePerKg) !== Number(product.pricePerKg)) ||
      (payload.category !== undefined && String(payload.category) !== String(product.category || '')) ||
      (payload.originNote !== undefined && String(payload.originNote).trim() !== String(product.originNote || '')) ||
      (payload.description !== undefined && String(payload.description).trim() !== String(product.description || '')) ||
      (payload.cuts !== undefined && JSON.stringify(nextCuts) !== JSON.stringify(product.cuts || [])) ||
      (payload.shipping !== undefined && JSON.stringify(nextShipping) !== JSON.stringify(product.shipping || {}));

    Object.assign(product, payload, {
      availabilityHours: normalizeHours(payload.availabilityHours ?? product.availabilityHours),
      updatedAt: nowIso()
    });
    if (payload.cuts) product.cuts = nextCuts;
    if (payload.shipping) product.shipping = nextShipping;

    if (product.status === 'published' && payload.availabilityHours !== undefined) {
      product.expiresAt = expiryIso(product.availabilityHours);
    }
    if (requiresReview && product.status === 'published') {
      product.status = 'pending_review';
      product.expiresAt = null;
    }
    if (product.status === 'rejected') {
      product.status = 'pending_review';
      product.expiresAt = null;
    }

    saveDemo(data);
    return {
      message: product.status === 'pending_review'
        ? 'Alterações salvas e enviadas para revisão.'
        : 'Pescado atualizado no modo demonstrativo.',
      product: productWithAvailability(product),
      demo: true
    };
  }

  async function setProductStatus(productId, action) {
    if (base) {
      return request(`/market/dashboard/products/${encodeURIComponent(productId)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ action })
      }, true);
    }

    const data = demoData();
    const product = data.products.find(item => item.id === productId);
    if (!product) throw new Error('Pescado não encontrado.');

    if (action === 'pause') {
      product.status = 'paused';
    } else if (action === 'renew') {
      if (Number(product.quantityKg) <= 0) throw new Error('Atualize o estoque antes de renovar.');
      product.status = 'published';
      product.expiresAt = expiryIso(product.availabilityHours);
    } else {
      product.status = 'pending_review';
      product.expiresAt = null;
    }

    product.updatedAt = nowIso();
    saveDemo(data);
    return {
      product: productWithAvailability(product),
      demo: true
    };
  }

  async function setOrderStatus(orderId, status) {
    if (base) {
      return request(`/market/dashboard/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      }, true);
    }

    const data = demoData();
    const order = data.orders.find(item => item.id === orderId);
    if (!order) throw new Error('Pedido não encontrado.');

    if (['recusado', 'cancelado'].includes(status) && !order.stockRestored) {
      order.items.forEach(item => {
        const product = data.products.find(product => product.id === item.productId);
        if (product) product.quantityKg = Number(product.quantityKg || 0) + Number(item.quantityKg || 0);
      });
      order.stockRestored = true;
    }

    order.status = status;
    order.updatedAt = nowIso();
    saveDemo(data);
    return { order, demo: true };
  }

  async function curationSummary() {
    if (base) return request('/curation/summary', {}, true);

    const data = demoData();
    return {
      fishermenPending: data.fishermen.filter(item => item.status === 'pending_review').length,
      productsPending: data.products.filter(item => item.status === 'pending_review').length,
      fishermenPublished: data.fishermen.filter(item => item.status === 'published').length,
      productsPublished: data.products.filter(isActive).length,
      ordersOpen: data.orders.filter(item => !['concluido', 'recusado', 'cancelado'].includes(item.status)).length,
      demo: true
    };
  }

  async function curationPending() {
    if (base) return request('/curation/pending', {}, true);

    const data = demoData();
    return {
      fishermen: data.fishermen.filter(item => item.status === 'pending_review'),
      products: data.products
        .filter(item => item.status === 'pending_review')
        .map(item => ({
          ...item,
          fisherman: fishermanFor(data, item.fishermanId)
        })),
      demo: true
    };
  }

  async function curateFisherman(id, action, note = '') {
    if (base) {
      return request(`/curation/fishermen/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ action, note })
      }, true);
    }

    const data = demoData();
    const fisherman = fishermanFor(data, id);
    if (!fisherman) throw new Error('Pescador não encontrado.');

    fisherman.status = action === 'approve' ? 'published' : 'rejected';
    saveDemo(data);
    return { fisherman, demo: true };
  }

  async function curateProduct(id, action, note = '') {
    if (base) {
      return request(`/curation/products/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ action, note })
      }, true);
    }

    const data = demoData();
    const product = data.products.find(item => item.id === id);
    if (!product) throw new Error('Pescado não encontrado.');

    product.status = action === 'approve' ? 'published' : 'rejected';
    product.reviewNote = note;
    product.updatedAt = nowIso();

    if (action === 'approve') {
      product.availabilityHours = normalizeHours(product.availabilityHours);
      product.publishedAt = nowIso();
      product.expiresAt = expiryIso(product.availabilityHours);
    } else {
      product.expiresAt = null;
    }

    saveDemo(data);
    return {
      product: productWithAvailability(product),
      demo: true
    };
  }

  window.EntreMaresAPI = {
    mode: base ? 'api' : 'demo',
    base,
    getSession,
    setSession,
    registerUser,
    login,
    logout,
    refreshMe,
    startDemoFisherSession,
    startDemoCustomerSession,
    startDemoCuratorSession,
    createProduct,
    listFishermen,
    listProducts,
    shippingOptions,
    createOrder,
    customerOrders,
    dashboard,
    updateFisherProfile,
    updateProduct,
    setProductStatus,
    setOrderStatus,
    curationSummary,
    curationPending,
    curateFisherman,
    curateProduct
  };
})();
