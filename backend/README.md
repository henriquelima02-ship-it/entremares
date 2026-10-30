# Backend EntreMarés

API Node.js/Express do **EntreMarés**, responsável por cadastro, autenticação, perfis de pescadores, pescados, cortes, retirada/entrega/frete colaborativo, pedidos, painel do pescador e curadoria comercial.

## Executar localmente

```bash
cd backend
npm install
npm run dev
```

A API sobe por padrão em `http://localhost:3000`.

## Variáveis de ambiente

Copie `.env.example` para o ambiente de execução e configure os valores reais:

- `PORT`: porta HTTP.
- `ALLOWED_ORIGINS`: origens permitidas no CORS, separadas por vírgula.
- `AUTH_SECRET`: segredo forte usado para assinar as sessões JWT. Obrigatório em produção.
- `CURATOR_EMAILS`: e-mails autorizados a usar a curadoria comercial, separados por vírgula.
- `DATA_FILE`: caminho da base mutável desta fase.

## Endpoints principais

### Usuários
- `POST /api/users/register`
- `POST /api/users/login`
- `GET /api/users/me`

### Vitrine pública
- `GET /api/market/fishermen`
- `GET /api/market/fishermen/:id`
- `GET /api/market/products`
- `GET /api/market/products/:id`
- `POST /api/market/products/:id/report` (relato de disponibilidade, sem login)
- `GET /api/market/shipping/options`
- `POST /api/market/orders`
- `GET /api/market/orders/:id`

### Painel autenticado do pescador
- `GET /api/market/dashboard`
- `PATCH /api/market/dashboard/profile`
- `POST /api/market/dashboard/products`
- `PATCH /api/market/dashboard/products/:id`
- `PATCH /api/market/dashboard/products/:id/status`
- `DELETE /api/market/dashboard/products/:id` (arquiva o anúncio do próprio pescador, sem apagar pedidos; bloqueado enquanto houver pedidos em andamento)
- `GET /api/market/dashboard/orders`
- `PATCH /api/market/dashboard/orders/:id/status`

### Curadoria comercial
- `GET /api/curation/summary`
- `GET /api/curation/pending`
- `PATCH /api/curation/fishermen/:id`
- `PATCH /api/curation/products/:id`

A curadoria exige sessão autenticada e o e-mail do usuário precisa estar listado em `CURATOR_EMAILS`.

## Persistência atual

Os dados demonstrativos versionados ficam em `backend/data/seed.json`.

Ao iniciar pela primeira vez, a API cria uma base mutável em `backend/data/runtime-db.json`, ou no caminho definido por `DATA_FILE`. Esse arquivo é ignorado pelo Git para reduzir o risco de enviar ao repositório e-mails, telefones, hashes de senha ou pedidos usados durante testes.

O antigo `backend/data/db.json` permanece no histórico do protótipo, mas não é mais usado pela API como base padrão.

A persistência em JSON é adequada para desenvolvimento, demonstração e piloto de pequena escala. Para operação real com vários pescadores e pedidos simultâneos, a próxima migração recomendada é PostgreSQL.

## Frontend no GitHub Pages

GitHub Pages hospeda apenas arquivos estáticos. O frontend detecta o backend automaticamente em `localhost` durante o desenvolvimento.

Em produção, configure a URL pública da API de uma destas formas:

```js
window.ENTREMARES_API_URL = 'https://api.exemplo.br/api';
```

ou, temporariamente no navegador:

```js
localStorage.setItem('entremares_api_url', 'https://api.exemplo.br/api');
```

Sem URL configurada, o site entra em **modo demonstrativo local**. Nesse modo, nenhuma senha é armazenada e os cadastros, anúncios e pedidos ficam somente no navegador.

## Autenticação e privacidade

- Senhas são transformadas em hash com bcrypt.
- Sessões da API usam JWT com validade de 7 dias.
- O token do frontend fica em `sessionStorage`.
- Perfis públicos não expõem e-mail, telefone ou documentos particulares.
- Coordenadas sensíveis, pontos de espécies ameaçadas e informações pessoais da comunidade não devem ser publicados.
- Perfis e pescados são publicados automaticamente. Registros antigos pendentes são liberados na inicialização; recusados e pausados não são reativados nessa migração.
- Dois relatos distintos, limitados por identificador de navegador e impressão digital pseudonimizada da conexão, em até 24 horas pausam o anúncio; um relato isolado não o remove.
- O pescador pode reativar após confirmar o estoque. Uma recusa de pedido informada como falta de estoque pausa imediatamente o anúncio.
- A assinatura do navegador não prova identidade; use validação adicional antes de escalar o mecanismo para produção ampla.

## Container

O `Dockerfile` incluído em `backend/` permite publicar a API em serviços que executem containers. Para produção, use HTTPS, um `AUTH_SECRET` forte, CORS restrito ao domínio do site e armazenamento persistente.

## Recuperação de senha sem e-mail

A recuperação é autônoma com **cinco códigos individuais** apresentados uma única vez após o cadastro de cliente ou pescador. Cada código tem 96 bits aleatórios e é armazenado somente como hash SHA-256 no registro do usuário. A pessoa guarda os códigos em local privado e pode redefinir a senha usando o telefone cadastrado e um código, sem e-mail nem atendimento humano. Um código utilizado deixa de funcionar. A troca da senha invalida as sessões anteriores.

- `GET /api/users/recovery/options` — informa se SMS está habilitado.
- `POST /api/users/recovery/reset` — telefone, `method: "backup"`, `code` e `newPassword`.
- `GET /api/users/recovery/codes` — quantidade restante, requer login.
- `POST /api/users/recovery/codes` — gera cinco novos códigos, requer login e senha atual; substitui os anteriores.
- `POST /api/users/password/change` — troca a senha com a senha atual; requer login.
- `POST /api/users/recovery/request` — solicita código via SMS quando o provedor está configurado.
- `POST /api/users/recovery/reset` com `method: "sms"` — valida código SMS via Twilio Verify e redefine senha.

Para envio opcional por SMS, crie um serviço em [Twilio Verify](https://www.twilio.com/docs/verify/api) e configure no Render, em **Environment**, as variáveis `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` e `TWILIO_VERIFY_SERVICE_SID`. Nenhuma credencial deve ser enviada para o GitHub. O Twilio pode cobrar pelo envio de SMS; verificar preço e configuração do serviço. Sem essas variáveis a interface de SMS fica oculta, mantendo os códigos de recuperação como método independente e gratuito.

Os endpoints de recuperação aplicam limitação por conexão e identificador de conta, mensagem neutra na solicitação de SMS e senha criptografada por bcrypt. Em ambiente com múltiplas instâncias, substituir o limitador em memória por um compartilhado (Redis ou banco de dados).

**Importante:** quem já tinha conta antes dessa implementação deve acessar **Segurança da conta**, digitar sua senha atual e gerar os primeiros códigos. Se a pessoa esquecer a senha antes de guardar códigos e o serviço de SMS ainda não estiver configurado, não é possível verificar automaticamente a propriedade da conta. Não criar recuperação baseada apenas em nome, comunidade ou número digitado.
