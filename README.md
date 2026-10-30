# EntreMarés

**Saberes, Povoados e Produtos Caiçaras**

O **EntreMarés** é um portal digital de valorização do território caiçara. Reúne informações sobre povoados, memória, patrimônio, saberes tradicionais, biodiversidade, gastronomia e pesca artesanal. A vitrine de pescados e o acesso de pescadores fazem parte da mesma plataforma.

## Áreas do portal

- **Pescados:** anúncios de pesca artesanal, perfis de pescadores, preços, quantidades, cortes, formas de retirada e entrega, pedidos e acompanhamento.
- **Povoados:** Piaçaguera e Amparo, seus contextos territoriais e os conteúdos associados.
- **Saberes:** acervo editorial que reúne conhecimentos e pesquisas, com busca e classificação por memória e patrimônio, natureza e biodiversidade, cultura, alimentação e pesca.

O endereço antigo `pesquisas.html` encaminha para `saberes.html`, evitando uma duplicação do acervo. Os conteúdos disponíveis são selecionados e apresentados sem postagens públicas livres.

## O que está implementado

O frontend está na pasta `frontend/` e utiliza HTML, CSS e JavaScript. Inclui:

- página inicial, vitrine de pescados, páginas de povoados e acervo de saberes;
- páginas de História de Piaçaguera, Igreja e sambaqui, Fauna e flora e Gastronomia de Piaçaguera e Amparo;
- cadastro e acesso de clientes e pescadores;
- painel do pescador para gerenciar perfil, anúncios, estoque e pedidos;
- publicação automática de pescados com autogestão da disponibilidade;
- seleções de cortes e modalidades de retirada ou entrega;
- imagens ilustrativas de pescados e cortes, identificadas como referências visuais;
- adaptação de telas para navegação no celular.

O cadastro de pescadores e a publicação dos anúncios são automáticos, sem fila de aprovação. Os anúncios têm validade de 24, 36 ou 42 horas. A oferta sai da vitrine com estoque zerado ou prazo vencido. Dois relatos independentes de indisponibilidade em até 24 horas pausam o anúncio até que o pescador confirme novamente; uma recusa de pedido por falta de estoque também o pausa. A equipe pode manter ferramentas de auditoria, mas sua atuação não é requisito para anunciar.

## API e persistência

A pasta `backend/` contém uma API Node.js/Express com autenticação, rotas de usuários, pescadores, produtos, frete, pedidos, alertas de disponibilidade e ferramentas de auditoria. O código inclui persistência para testes e suporte a infraestrutura de banco de dados. A disponibilidade do serviço e a configuração efetiva de persistência em produção precisam de verificação operacional antes da abertura a pedidos reais.

Consulte [backend/README.md](backend/README.md) para as rotas, variáveis de ambiente, requisitos de implantação e orientações de segurança.

## Publicação

O GitHub Pages publica os arquivos de `frontend/` por meio do workflow em `.github/workflows/pages.yml`.

Site: https://henriquelima02-ship-it.github.io/entremares/

## Pesquisa, curadoria e respeito ao território

O EntreMarés articula saberes tradicionais e conteúdos de referência. Os textos devem distinguir informação documental, registro comunitário e pontos que ainda exigem pesquisa de campo.

A curadoria considera rigor histórico e científico, autoria, autorização de uso de imagens e entrevistas, segurança alimentar, privacidade de moradores, estudantes e pescadores e respeito aos saberes caiçaras.

## Identidade visual

A marca utilizada na plataforma é **EntreMarés**, com a assinatura **Saberes, Povoados e Produtos Caiçaras**. A identidade utiliza referências naturais do mangue, maré, água, areia e pesca artesanal.

Cores de referência:

- Verde Mangue — `#1D4B43`
- Azul Estuário — `#3D617B`
- Areia Clara — `#E9D8B6`
- Sol Dourado — `#D5A83C`
- Coral — `#D9704A`
- Branco — `#FAF9F4`
