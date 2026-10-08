# Backend EntreMarés

API Node.js/Express para a frente **Camarão na Tarrafa**, responsável por cadastro de clientes e pescadores, pescados, cortes, opções de retirada/entrega/frete colaborativo e pedidos.

## Executar localmente

```bash
cd backend
npm install
npm run dev
```

A API sobe por padrão em `http://localhost:3000`.

Endpoints principais:

- `GET /api/health`
- `POST /api/users/register`
- `GET /api/market/fishermen`
- `GET /api/market/products`
- `POST /api/market/fishermen/:id/products`
- `GET /api/market/shipping/options`
- `POST /api/market/orders`

## Persistência

Nesta etapa, os dados ficam em `backend/data/db.json`. É adequado para desenvolvimento e demonstração, mas não é a configuração final de produção. Em uma implantação real, o módulo deve migrar para banco de dados transacional, autenticação com sessão/token, autorização por perfil e armazenamento de imagens em serviço próprio.

## Frontend no GitHub Pages

GitHub Pages hospeda apenas arquivos estáticos. O frontend detecta o backend automaticamente em `localhost` durante o desenvolvimento. Em produção, defina `window.ENTREMARES_API_URL` ou a chave `entremares_api_url` no `localStorage` com a URL pública da API. Sem essa configuração, o site usa modo demonstrativo local e não envia senhas para armazenamento no navegador.

## Privacidade

Perfis públicos não devem expor e-mail, telefone particular, documentos ou coordenadas sensíveis. Dados reais de pescadores e moradores só devem ser publicados com autorização e finalidade definida.
