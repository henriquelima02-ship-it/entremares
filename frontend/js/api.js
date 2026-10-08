(function () {
  const configured = (window.ENTREMARES_API_URL || localStorage.getItem('entremares_api_url') || '').replace(/\/$/, '');
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const base = configured || (isLocal ? 'http://localhost:3000/api' : '');
  const DEMO_KEY = 'entremares_market_demo_v2';

  const seed = {
    fishermen: [{
      id: 'demo-pescador-01',
      displayName: 'Pescador demonstrativo',
      community: 'Baía de Paranaguá',
      pickupReference: 'Ponto de retirada a combinar',
      shipping: { pickup: true, communityDelivery: true, collaborativeFreight: true, deliveryFee: 8, collaborativeFee: 12 }
    }],
    products: [
      {
        id: 'demo-camarao-branco', fishermanId: 'demo-pescador-01', species: 'Camarão-branco', category: 'crustaceo', state: 'resfriado', quantityKg: 12, pricePerKg: 42,
        description: 'Exemplo demonstrativo para testar cortes e logística. Não representa estoque real.', originNote: 'Produto demonstrativo.',
        cuts: [{ id: 'inteiro', label: 'Inteiro', extraPerKg: 0 }, { id: 'descascado', label: 'Descascado', extraPerKg: 8 }, { id: 'sem_cabeca', label: 'Sem cabeça', extraPerKg: 5 }],
        shipping: { pickup: true, communityDelivery: true, collaborativeFreight: true, deliveryFee: 8, collaborativeFee: 12, notes: 'Rota demonstrativa.' }
      },
      {
        id: 'demo-tainha', fishermanId: 'demo-pescador-01', species: 'Tainha', category: 'peixe', state: 'fresco', quantityKg: 18, pricePerKg: 29,
        description: 'Exemplo de pescado com opções de preparo. Não representa estoque real.', originNote: 'Produto demonstrativo.',
        cuts: [{ id: 'inteiro', label: 'Inteiro', extraPerKg: 0 }, { id: 'limpo', label: 'Limpo', extraPerKg: 3 }, { id: 'posta', label: 'Posta', extraPerKg: 6 }],
        shipping: { pickup: true, communityDelivery: true, collaborativeFreight: false, deliveryFee: 8, collaborativeFee: 0, notes: 'Rota demonstrativa.' }
      },
      {
        id: 'demo-robalo', fishermanId: 'demo-pescador-01', species: 'Robalo', category: 'peixe', state: 'fresco', quantityKg: 8, pricePerKg: 48,
        description: 'Exemplo para demonstrar filé, posta e retirada. Não representa estoque real.', originNote: 'Produto demonstrativo.',
        cuts: [{ id: 'inteiro', label: 'Inteiro', extraPerKg: 0 }, { id: 'file', label: 'Filé', extraPerKg: 12 }, { id: 'posta', label: 'Posta', extraPerKg: 7 }],
        shipping: { pickup: true, communityDelivery: false, collaborativeFreight: true, deliveryFee: 0, collaborativeFee: 12, notes: 'Rota demonstrativa.' }
      }
    ],
    orders: []
  };

  function demoData() {
    try {
      const saved = JSON.parse(localStorage.getItem(DEMO_KEY) || 'null');
      if (saved && Array.isArray(saved.products)) return saved;
    } catch (_) {}
    localStorage.setItem(DEMO_KEY, JSON.stringify(seed));
    return JSON.parse(JSON.stringify(seed));
  }

  function saveDemo(data) {
    localStorage.setItem(DEMO_KEY, JSON.stringify(data));
  }

  async function request(path, options = {}) {
    if (!base) throw new Error('DEMO_MODE');
    const response = await fetch(`${base}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a operação.');
    return data;
  }

  function fisherFor(data, id) {
    return data.fishermen.find(item => item.id === id) || null;
  }

  async function registerUser(payload) {
    if (base) return request('/users/register', { method: 'POST', body: JSON.stringify(payload) });
    const data = demoData();
    const id = `local-user-${Date.now()}`;
    const safeUser = { id, role: payload.role, name: payload.name, phone: payload.phone, email: payload.email, community: payload.profile?.community || '' };
    let fisherman = null;
    if (payload.role === 'pescador') {
      fisherman = {
        id: `local-fisher-${Date.now()}`,
        userId: id,
        displayName: payload.profile?.displayName || payload.name,
        community: payload.profile?.community || '',
        pickupReference: payload.profile?.pickupReference || '',
        bio: payload.profile?.bio || '',
        shipping: payload.profile?.shipping || { pickup: true },
        status: 'demo_local'
      };
      data.fishermen.push(fisherman);
    }
    saveDemo(data);
    return { message: 'Cadastro salvo apenas neste navegador em modo demonstrativo.', user: safeUser, fisherman, demo: true };
  }

  async function createProduct(fishermanId, payload) {
    if (base) return request(`/market/fishermen/${encodeURIComponent(fishermanId)}/products`, { method: 'POST', body: JSON.stringify(payload) });
    const data = demoData();
    const product = { id: `local-product-${Date.now()}`, fishermanId, ...payload, status: 'demo_local' };
    data.products.unshift(product);
    saveDemo(data);
    return { message: 'Pescado salvo apenas neste navegador em modo demonstrativo.', product, demo: true };
  }

  async function listFishermen() {
    if (base) return request('/market/fishermen');
    const data = demoData();
    return { items: data.fishermen.slice(), demo: true };
  }

  async function listProducts(filters = {}) {
    if (base) {
      const query = new URLSearchParams();
      if (filters.species) query.set('species', filters.species);
      if (filters.fishermanId) query.set('fishermanId', filters.fishermanId);
      return request(`/market/products${query.toString() ? `?${query}` : ''}`);
    }
    const data = demoData();
    let items = data.products.slice();
    if (filters.species) items = items.filter(item => item.species.toLowerCase().includes(filters.species.toLowerCase()));
    if (filters.fishermanId) items = items.filter(item => item.fishermanId === filters.fishermanId);
    items = items.map(item => ({ ...item, fisherman: fisherFor(data, item.fishermanId) }));
    return { items, demo: true };
  }

  async function shippingOptions(productId, quantityKg = 1) {
    if (base) return request(`/market/shipping/options?productId=${encodeURIComponent(productId)}&quantityKg=${encodeURIComponent(quantityKg)}`);
    const data = demoData();
    const product = data.products.find(item => item.id === productId);
    if (!product) throw new Error('Produto não encontrado.');
    const options = [];
    const fisherman = fisherFor(data, product.fishermanId);
    if (product.shipping?.pickup) options.push({ id: 'pickup', label: 'Retirada com o pescador', fee: 0, note: fisherman?.pickupReference || 'Combinar ponto de retirada.' });
    if (product.shipping?.communityDelivery) options.push({ id: 'community_delivery', label: 'Entrega comunitária', fee: Number(product.shipping.deliveryFee || 0), note: product.shipping.notes || '' });
    if (product.shipping?.collaborativeFreight) options.push({ id: 'collaborative_freight', label: 'Frete colaborativo', fee: Number(product.shipping.collaborativeFee || 0) + Math.max(0, Number(quantityKg) - 1) * 1.5, note: product.shipping.notes || '' });
    return { options, demo: true };
  }

  async function createOrder(payload) {
    if (base) return request('/market/orders', { method: 'POST', body: JSON.stringify(payload) });
    const data = demoData();
    const order = { id: `local-order-${Date.now()}`, code: `EM-DEMO-${Date.now().toString(36).toUpperCase()}`, ...payload, status: 'simulacao', createdAt: new Date().toISOString() };
    data.orders.push(order);
    saveDemo(data);
    return { message: 'Pedido simulado salvo apenas neste navegador.', order, demo: true };
  }

  window.EntreMaresAPI = {
    mode: base ? 'api' : 'demo',
    base,
    registerUser,
    createProduct,
    listFishermen,
    listProducts,
    shippingOptions,
    createOrder
  };
})();
