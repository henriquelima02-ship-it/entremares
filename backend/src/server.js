const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const marketRoutes = require('./routes/marketRoutes');
const curationRoutes = require('./routes/curationRoutes');
const { readDb, mutateDb, storageMode } = require('./store');

const app = express();
const PORT = process.env.PORT || 3000;
const configuredOrigins = String(process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(item => item.trim())
  .filter(Boolean);

app.disable('x-powered-by');
app.use(cors({
  origin(origin, callback) {
    if (!origin || configuredOrigins.length === 0 || configuredOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origem não autorizada pelo CORS.'));
  }
}));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (req, res) => {
  try {
    await readDb();
    res.json({
      service: 'EntreMarés API',
      module: 'Pescados',
      status: 'ok',
      storage: storageMode,
      time: new Date().toISOString()
    });
  } catch (error) {
    console.error('Falha no health check da persistência:', error);
    res.status(503).json({
      service: 'EntreMarés API',
      module: 'Pescados',
      status: 'degraded',
      storage: storageMode,
      time: new Date().toISOString()
    });
  }
});

app.use('/api/users', userRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/curation', curationRoutes);

app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

app.use((error, req, res, next) => {
  console.error(error);
  const status = error.status || (error.message === 'Origem não autorizada pelo CORS.' ? 403 : 500);
  res.status(status).json({ error: status >= 500 ? 'Erro interno do servidor.' : error.message });
});

async function start() {
  try {
    await readDb();
    // Na implantação, libere os cadastros e anúncios antigos ainda em revisão.
    // Itens pausados ou rejeitados não são reativados automaticamente.
    await mutateDb(db => {
      const now = Date.now();
      const iso = new Date(now).toISOString();
      for (const fisherman of db.fishermen) {
        if (fisherman.status === 'pending_review') {
          fisherman.status = 'published';
          fisherman.publishedAt = iso;
          fisherman.updatedAt = iso;
        }
      }
      for (const item of db.products) {
        if (item.status !== 'pending_review') continue;
        if (Number(item.quantityKg) <= 0) {
          item.status = 'paused';
          item.pauseReason = 'no_stock';
        } else {
          const hours = [24, 36, 42].includes(Number(item.availabilityHours))
            ? Number(item.availabilityHours) : 36;
          item.status = 'published';
          item.publishedAt = iso;
          item.expiresAt = new Date(now + hours * 3600000).toISOString();
        }
        item.updatedAt = iso;
      }
    });
    console.log(`Persistência EntreMarés pronta: ${storageMode}`);
    app.listen(PORT, () => {
      console.log(`EntreMarés API disponível na porta ${PORT}`);
    });
  } catch (error) {
    console.error('Falha ao inicializar a persistência do EntreMarés:', error);
    process.exit(1);
  }
}

start();
