const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const marketRoutes = require('./routes/marketRoutes');
const curationRoutes = require('./routes/curationRoutes');

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

app.get('/api/health', (req, res) => {
  res.json({
    service: 'EntreMarés API',
    module: 'Camarão na Tarrafa',
    status: 'ok',
    time: new Date().toISOString()
  });
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

app.listen(PORT, () => {
  console.log(`EntreMarés API disponível na porta ${PORT}`);
});
