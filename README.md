# Produtinhos da Maria - Boutique Sensual & Lifestyle Adulto

Plataforma completa de Catálogo Interativo e E-commerce com Painel Administrativo, desenvolvida com foco em discrição, sofisticação, sensualidade elegante e privacidade absoluta para o público adulto (18+).

---

## 🌟 Principais Recursos

- **Direção de Arte Premium:** Identidade visual baseada em tons de vinho profundo, rosé/nude quente, dourado envelhecido e preto aveludado, com tipografia editorial elegante (*Playfair Display* e *Jost*).
- **Modo Discreto:** Botão no topo que desfoca as imagens dos produtos e altera instantaneamente o título da aba do navegador para navegação com 100% de privacidade.
- **Verificação de Maioridade (Age Gate 18+):** Modal de proteção em conformidade com as diretrizes de conteúdo adulto.
- **Catálogo Interativo:**
  - Busca instantânea por nome, aroma ou código SKU.
  - Carrossel de categorias temáticas.
  - Mini-sliders de fotos nos cards com suporte a gestos touch swipe e navegação por setas.
  - Lightbox em tela cheia com zoom ao toque.
  - Modal de seleção de variações (tamanhos, aromas, opções) com controle de estoque.
- **Sacola de Compras & Checkout WhatsApp:**
  - Cálculo de frete dinâmico por cidade/região ou opção de retirada local.
  - Validação de cupons de desconto em tempo real com cálculos em centavos.
  - Mensagem formatada enviada diretamente para o WhatsApp oficial com aviso expresso de embalagem 100% neutra e discreta. Forma de pagamento combinada no atendimento humano (sem intermediações desnecessárias).
- **Painel Administrativo Completo (`admin.html`):**
  - Autenticação segura via Firebase Auth.
  - Preview WYSIWYG em tempo real enquanto os produtos são cadastrados ou editados.
  - Gestão de produtos exclusivamente por links de imagem (múltiplas URLs e colagem em lote).
  - Controle de taxas de frete por bairro/cidade e gestão de cupons de desconto.
- **Arquitetura 100% Serverless:** Pronta para hospedagem estática no GitHub Pages, com sincronização em tempo real via Firebase Realtime Database e fallback resiliente para LocalStorage.

---

## 📂 Estrutura de Arquivos

- `index.html`: Catálogo público, sacola e checkout via WhatsApp.
- `admin.html`: Painel de controle e gestão da loja.
- `firebase-config.js`: Camada de persistência (Firebase Realtime Database + LocalStorage).
- `style.css`: Design System completo, responsivo e com suporte a acessibilidade.
- `database.rules.json`: Regras de segurança do Realtime Database (leitura pública e escrita autenticada).

---

## 🔒 Segurança e Privacidade

- As entregas são realizadas sempre em embalagens 100% descaracterizadas e discretas.
- O banco de dados possui regras estritas onde apenas a administradora autenticada possui permissão de escrita.

---

© Produtinhos da Maria. Todos os direitos reservados. Proibida a venda para menores de 18 anos.
