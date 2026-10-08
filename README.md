# EntreMarés

**Saberes, Lugares e Produtos Caiçaras**

EntreMarés é um ecossistema digital voltado à valorização do território caiçara, reunindo memória, cultura, turismo comunitário, pesca artesanal, gastronomia, biodiversidade, ciência, pesquisas estudantis, produtos locais, tecnologia e economia comunitária.

O projeto nasceu como **Camarão na Tarrafa**, inicialmente concentrado na pesca artesanal, na valorização dos pescadores, na comercialização de pescados e na logística comunitária. Com a ampliação das pesquisas históricas, territoriais, culturais, ambientais e pedagógicas, o projeto passou a exigir uma marca capaz de representar esse conjunto mais amplo.

A relação entre as marcas é:

- **EntreMarés** → marca e ecossistema principal.
- **Camarão na Tarrafa** → frente interna dedicada à pesca artesanal, pescadores, pescados, produtos locais, preço justo, cadastro, anúncios, pedidos, retirada, entrega e logística comunitária.

## Núcleos da plataforma

### Lugares / Rotas
Trilhas, comunidades, pontos de interesse, gastronomia, paisagens, história, fauna, flora e experiências locais.

### Memórias
História do território, povos originários, ocupação, memória oral, patrimônio, relatos comunitários, lendas e acontecimentos históricos.

### Saberes
Pesca artesanal, marés, navegação, culinária, técnicas tradicionais, biodiversidade, ciência, saúde e sustentabilidade.

### Pesquisas
Produções estudantis, pesquisa de campo, documentos e conteúdos submetidos à revisão e à curadoria antes da publicação.

### Camarão na Tarrafa
Frente de pesca artesanal e comercialização com perfis de pescadores, pescados, cortes, estoque, preço, retirada, entrega comunitária, frete colaborativo e pedidos.

## Estado atual do protótipo

O frontend já funciona como portal no GitHub Pages e reúne:

- página inicial do EntreMarés;
- Guia Turístico;
- páginas de Piaçaguera e Amparo;
- História de Piaçaguera;
- Igreja e Sambaqui;
- Fauna e Flora;
- Gastronomia;
- Saberes;
- Pesquisas;
- contribuição e curadoria de conteúdo;
- vitrine pública de pescados;
- página pública de pescadores;
- cadastro de clientes e pescadores;
- login;
- painel do pescador;
- curadoria comercial.

A frente Camarão na Tarrafa já possui fluxo inicial para:

1. criar perfil do pescador;
2. cadastrar pescado e estoque;
3. definir cortes e acréscimos;
4. definir retirada, entrega ou frete;
5. receber pedidos;
6. atualizar o andamento do pedido;
7. pausar e editar anúncios;
8. enviar perfis e produtos à curadoria antes da publicação.

## Backend

O diretório `backend/` contém uma API Node.js/Express com:

- autenticação com bcrypt + JWT;
- autorização de pescador;
- autorização de curadoria por e-mail configurado no ambiente;
- persistência JSON separada dos dados versionados;
- rotas de pescadores, produtos, frete, pedidos, painel e curadoria;
- configuração para execução em container.

A persistência JSON ainda é de protótipo. A evolução prevista para produção é a migração para um banco transacional, preferencialmente PostgreSQL.

## Estrutura principal

```text
entremares/
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── .env.example
│   ├── README.md
│   ├── data/
│   │   ├── db.json
│   │   └── seed.json
│   └── src/
├── frontend/
│   ├── index.html
│   ├── guia.html
│   ├── saberes.html
│   ├── pesquisas.html
│   ├── cadastro.html
│   ├── login.html
│   ├── painel-pescador.html
│   ├── pescadores.html
│   ├── pescados.html
│   ├── contribuir.html
│   ├── curadoria.html
│   ├── curadoria-comercial.html
│   ├── conteudos/
│   ├── locais/
│   ├── css/
│   └── js/
└── .github/workflows/
```

## Curadoria e responsabilidade

O EntreMarés adota a lógica de **pesquisa → curadoria → publicação**. Isso vale tanto para conteúdos históricos/científicos quanto para perfis e anúncios comerciais.

A curadoria deve preservar:

- rigor histórico e científico;
- distinção entre memória oral, registro comunitário e informação documental;
- autorização para uso de imagens, entrevistas e relatos;
- privacidade de estudantes, moradores e pescadores;
- revisão de informações públicas antes da publicação;
- respeito aos saberes tradicionais e à autoria comunitária.

## Identidade visual

A identidade própria do EntreMarés continua em desenvolvimento. A paleta atual permanece:

- Verde Mangue — `#1D4B43`
- Azul Estuário — `#3D617B`
- Areia Clara — `#E9D8B6`
- Sol Dourado — `#D5A83C`
- Coral — `#D9704A`
- Branco — `#FAF9F4`

O símbolo `◉` permanece provisoriamente até a consolidação da identidade visual definitiva.
