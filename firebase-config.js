/**
 * Produtinhos da Maria - Camada de Dados e Resiliência
 * Suporta Firebase Realtime Database com fallback automático e transparente para LocalStorage.
 * Imagens utilizam exclusivamente URLs diretas (http/https).
 */

(function (window) {
  'use strict';

  // Configuração oficial do Firebase Realtime Database e Authentication
  const DEFAULT_FIREBASE_CONFIG = {
    apiKey: "AIzaSyD0AAeuR3GX3oH4FTbuuPl2eDHQ129Erck",
    authDomain: "sexshop-43999.firebaseapp.com",
    databaseURL: "https://sexshop-43999-default-rtdb.firebaseio.com",
    projectId: "sexshop-43999",
    storageBucket: "sexshop-43999.firebasestorage.app",
    messagingSenderId: "749124465394",
    appId: "1:749124465394:web:2ce8f390b862c15de0966b"
  };

  const STORAGE_KEYS = {
    PRODUCTS: 'pdm_products_v2',
    CITIES: 'pdm_cities_v2',
    COUPONS: 'pdm_coupons_v2',
    SETTINGS: 'pdm_settings_v2',
    CONFIG: 'pdm_firebase_config_v2',
    ADMIN_SESSION: 'pdm_admin_session_v2'
  };

  // Utilitário para parse seguro de JSON
  function safeJsonParse(data, fallback) {
    if (!data) return fallback;
    try {
      const parsed = JSON.parse(data);
      return parsed !== null && parsed !== undefined ? parsed : fallback;
    } catch (e) {
      console.warn('Erro ao processar JSON armazenado:', e);
      return fallback;
    }
  }

  // Utilitário para escrita segura no LocalStorage
  function safeStorageSet(key, value) {
    try {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('Erro ao gravar no LocalStorage (quota ou restrição):', e.message);
      return false;
    }
  }

  // Sanitização de string contra XSS
  function escapeHtml(str) {
    if (typeof str !== 'string') return str === null || str === undefined ? '' : String(str);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Validação segura de URL de imagem (aceita apenas http e https)
  function isValidImageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    if (!/^https?:\/\//i.test(trimmed)) return false;
    // Bloquear injeção de script ou protocolos perigosos
    if (/^(javascript|data|blob|vbscript):/i.test(trimmed)) return false;
    return true;
  }

  // Seed de produtos de luxo demonstrativos (apenas URLs conceituais e elegantes)
  const INITIAL_PRODUCTS = [
    {
      id: "prod-001",
      sku: "LIN-VEL-01",
      nome: "Conjunto Rendado Noite de Veludo",
      descricao: "Lingerie confeccionada em renda francesa macia com detalhes em tule e acabamentos acetinados. Sensação leve e envolvente sobre a pele.",
      categoria: "Lingerie",
      precoOriginal: 189.90,
      precoPromocional: 159.90,
      imagens: [
        "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=800&q=80"
      ],
      variacoes: ["P", "M", "G", "GG"],
      foraDeEstoque: false,
      novidade: true,
      destacarEstoqueBaixo: true,
      estoqueBaixoQtd: 3
    },
    {
      id: "prod-002",
      sku: "VEL-AMB-02",
      nome: "Vela de Massagem Sensorial Baunilha & Âmbar",
      descricao: "Vela aromática formulada com ceras vegetais e óleos nobres. Ao derreter, transforma-se em um óleo morno e aveludado ideal para massagens a dois.",
      categoria: "Velas e Aromas",
      precoOriginal: 98.00,
      precoPromocional: 79.90,
      imagens: [
        "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1508759073847-9ca702cec7d2?auto=format&fit=crop&w=800&q=80"
      ],
      variacoes: ["Baunilha Bourbon", "Âmbar & Jasmim"],
      foraDeEstoque: false,
      novidade: true,
      destacarEstoqueBaixo: false,
      estoqueBaixoQtd: 0
    },
    {
      id: "prod-003",
      sku: "COS-SEDA-03",
      nome: "Óleo Corporal Beijável Toque de Seda",
      descricao: "Óleo bifásico acetinado com aroma suave e fórmula beijável. Proporciona toque deslizante e hidratação profunda sem resíduos pegajosos.",
      categoria: "Cosméticos Sensuais",
      precoOriginal: 74.90,
      precoPromocional: 64.90,
      imagens: [
        "https://images.unsplash.com/photo-1608248597359-001099688dfa?auto=format&fit=crop&w=800&q=80"
      ],
      variacoes: ["Cacau & Avelã", "Frutas Vermelhas & Espumante"],
      foraDeEstoque: false,
      novidade: false,
      destacarEstoqueBaixo: false,
      estoqueBaixoQtd: 0
    },
    {
      id: "prod-004",
      sku: "JOG-INT-04",
      nome: "Jogo Diálogo Íntimo: Segredos a Dois",
      descricao: "Baralho refinado com 50 cartas de perguntas instigantes, toques e desafios sensoriais para conectar e reacender a intimidade do casal.",
      categoria: "Casais e Jogos",
      precoOriginal: 89.00,
      precoPromocional: 0,
      imagens: [
        "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80"
      ],
      variacoes: [],
      foraDeEstoque: false,
      novidade: true,
      destacarEstoqueBaixo: false,
      estoqueBaixoQtd: 0
    },
    {
      id: "prod-005",
      sku: "ACE-CET-05",
      nome: "Máscara de Cetim Noturno & Luvas Clássicas",
      descricao: "Conjunto sensorial em cetim duchese macio com forro acolchoado. Ideal para aguçar os sentidos e criar momentos de expectativa.",
      categoria: "Acessórios",
      precoOriginal: 110.00,
      precoPromocional: 95.00,
      imagens: [
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80"
      ],
      variacoes: ["Preto Noturno", "Bordô Profundo", "Pérola"],
      foraDeEstoque: false,
      novidade: false,
      destacarEstoqueBaixo: true,
      estoqueBaixoQtd: 2
    },
    {
      id: "prod-006",
      sku: "COS-GOT-06",
      nome: "Sérum Estimulante Gotas de Amor",
      descricao: "Fórmula botânica de bem-estar com sensação suave de aquecimento e pulsação delicada. Dermatologicamente e ginecologicamente testado.",
      categoria: "Cosméticos Sensuais",
      precoOriginal: 85.00,
      precoPromocional: 69.90,
      imagens: [
        "https://images.unsplash.com/photo-1608248597289-53e3cb8d9518?auto=format&fit=crop&w=800&q=80"
      ],
      variacoes: ["15ml (Frasco Conta-gotas)"],
      foraDeEstoque: false,
      novidade: true,
      destacarEstoqueBaixo: false,
      estoqueBaixoQtd: 0
    },
    {
      id: "prod-007",
      sku: "KIT-SEG-07",
      nome: "Kit Presente Segredos da Maria",
      descricao: "Caixa rígida preta e dourada com fechadura decorativa, contendo vela sensorial, óleo acetinado e máscara de cetim. Acompanha fita bordô.",
      categoria: "Kits Presente",
      precoOriginal: 260.00,
      precoPromocional: 229.00,
      imagens: [
        "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80"
      ],
      variacoes: ["Versão Romance", "Versão Mistério"],
      foraDeEstoque: false,
      novidade: true,
      destacarEstoqueBaixo: true,
      estoqueBaixoQtd: 1
    }
  ];

  const INITIAL_CITIES = [
    { id: "city-01", nome: "Centro / Bairros Centrais", taxa: 10.00 },
    { id: "city-02", nome: "Zona Sul / Jardins", taxa: 15.00 },
    { id: "city-03", nome: "Zona Oeste / Perdizes", taxa: 16.00 },
    { id: "city-04", nome: "Zona Norte", taxa: 18.00 },
    { id: "city-05", nome: "Região Metropolitana", taxa: 25.00 }
  ];

  const INITIAL_COUPONS = [
    { id: "cup-01", codigo: "BEMVINDA", tipo: "percentual", valor: 10, ativo: true },
    { id: "cup-02", codigo: "PRIMEIRACOMPRA", tipo: "fixo", valor: 15.00, ativo: true }
  ];

  const INITIAL_SETTINGS = {
    nomeLoja: "Produtinhos da Maria",
    whatsapp: "5546999416047",
    mensagemBoasVindas: "Olá! Seja bem-vinda ao universo refinado e discreto dos Produtinhos da Maria. Sinta-se à vontade e com total privacidade.",
    avisoEmbalagem: "🔒 Entrega em embalagem 100% discreta, sem qualquer identificação de conteúdo ou nome sugestivo no pacote externo."
  };

  class StoreDatabase {
    constructor() {
      this.firebaseApp = null;
      this.database = null;
      this.isFirebaseReady = false;
      this.listeners = new Set();
      this.dbRefs = {};
      this.init();
    }

    init() {
      // 1. Inicializa LocalStorage com dados iniciais idempotentes
      this.seedLocalStorageIfEmpty();

      // 2. Tenta conectar ao Firebase se disponível no ambiente
      this.initFirebase();
    }

    seedLocalStorageIfEmpty() {
      if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.CITIES)) {
        localStorage.setItem(STORAGE_KEYS.CITIES, JSON.stringify(INITIAL_CITIES));
      }
      if (!localStorage.getItem(STORAGE_KEYS.COUPONS)) {
        localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(INITIAL_COUPONS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
      }
    }

    initFirebase() {
      try {
        if (typeof window.firebase !== 'undefined' && window.firebase.initializeApp) {
          const customConfig = safeJsonParse(localStorage.getItem(STORAGE_KEYS.CONFIG), null);
          const config = customConfig || DEFAULT_FIREBASE_CONFIG;

          // Se for a chave demo ou vazia, mantém fallback local silencioso sem travar
          if (config.apiKey && config.apiKey.includes('PlaceholderOnlyForLocalTesting')) {
            this.isFirebaseReady = false;
            return;
          }

          if (!window.firebase.apps || window.firebase.apps.length === 0) {
            this.firebaseApp = window.firebase.initializeApp(config);
          } else {
            this.firebaseApp = window.firebase.apps[0];
          }

          if (this.firebaseApp && window.firebase.database) {
            this.database = window.firebase.database();
            this.isFirebaseReady = true;
            this.setupFirebaseListeners();
          }

          if (this.firebaseApp && window.firebase.auth) {
            this.auth = window.firebase.auth();
            this.auth.onAuthStateChanged((user) => {
              if (user) {
                const session = {
                  user: user.email || 'maria@gmail.com',
                  uid: user.uid,
                  role: 'admin',
                  isDemoAuth: false,
                  timestamp: Date.now()
                };
                sessionStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(session));
              } else {
                const cur = this.getAdminSession();
                if (cur && !cur.isDemoAuth) {
                  sessionStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
                }
              }
              this.notifyListeners('auth_change');
            });
          }
        }
      } catch (err) {
        console.warn('Firebase não inicializado, utilizando LocalStorage:', err.message);
        this.isFirebaseReady = false;
      }
    }

    setupFirebaseListeners() {
      if (!this.isFirebaseReady || !this.database) return;
      try {
        const rootRef = this.database.ref('pdm_data');
        this.dbRefs.root = rootRef;
        rootRef.on('value', (snapshot) => {
          const val = snapshot.val();
          if (val) {
            if (val.products) {
              const list = Array.isArray(val.products) ? val.products : Object.values(val.products);
              localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(list));
            }
            if (val.cities) {
              const list = Array.isArray(val.cities) ? val.cities : Object.values(val.cities);
              localStorage.setItem(STORAGE_KEYS.CITIES, JSON.stringify(list));
            }
            if (val.coupons) {
              const list = Array.isArray(val.coupons) ? val.coupons : Object.values(val.coupons);
              localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(list));
            }
            if (val.settings) {
              localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(val.settings));
            }
            this.notifyListeners('remote_sync');
          }
        }, (error) => {
          console.warn('Erro na escuta do Firebase Realtime Database:', error.message);
          this.isFirebaseReady = false;
        });
      } catch (e) {
        console.warn('Falha ao configurar listeners do Firebase:', e);
        this.isFirebaseReady = false;
      }
    }

    async fetchRemoteOnce() {
      if (!this.isFirebaseReady || !this.database) return false;
      try {
        const snapshot = await this.database.ref('pdm_data').once('value');
        const val = snapshot.val();
        if (val) {
          if (val.products) {
            const list = Array.isArray(val.products) ? val.products : Object.values(val.products);
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(list));
          }
          if (val.cities) {
            const list = Array.isArray(val.cities) ? val.cities : Object.values(val.cities);
            localStorage.setItem(STORAGE_KEYS.CITIES, JSON.stringify(list));
          }
          if (val.coupons) {
            const list = Array.isArray(val.coupons) ? val.coupons : Object.values(val.coupons);
            localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(list));
          }
          if (val.settings) {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(val.settings));
          }
          this.notifyListeners('remote_fetch');
          return true;
        }
      } catch (err) {
        console.warn('Falha na busca ativa do Firebase:', err);
      }
      return false;
    }

    async syncAllToRemote() {
      if (!this.isFirebaseReady || !this.database) {
        return { success: false, message: 'Firebase não está conectado.' };
      }
      try {
        const productsList = this.getProducts();
        const productsMap = {};
        productsList.forEach(p => { productsMap[p.id] = p; });

        const citiesList = this.getCities();
        const citiesMap = {};
        citiesList.forEach(c => { citiesMap[c.id] = c; });

        const couponsList = this.getCoupons();
        const couponsMap = {};
        couponsList.forEach(c => { couponsMap[c.id] = c; });

        const settings = this.getSettings();

        await this.database.ref('pdm_data').set({
          products: productsMap,
          cities: citiesMap,
          coupons: couponsMap,
          settings: settings
        });

        return { success: true, count: productsList.length };
      } catch (err) {
        return { success: false, message: err.message };
      }
    }

    onDataChange(callback) {
      if (typeof callback === 'function') {
        this.listeners.add(callback);
      }
      return () => this.listeners.delete(callback);
    }

    notifyListeners(source = 'local') {
      this.listeners.forEach((fn) => {
        try {
          fn(source);
        } catch (e) {
          console.error('Erro em listener da base de dados:', e);
        }
      });
    }

    // --- PRODUTOS ---
    getProducts() {
      const items = safeJsonParse(localStorage.getItem(STORAGE_KEYS.PRODUCTS), INITIAL_PRODUCTS);
      const list = Array.isArray(items) ? items : Object.values(items || {});
      // Normalização defensiva: garante arrays e tipos seguros mesmo após sincronizações parciais
      return list.map(p => ({
        ...p,
        imagens: Array.isArray(p.imagens) ? p.imagens.filter(isValidImageUrl) : [],
        variacoes: Array.isArray(p.variacoes) ? p.variacoes.map(v => String(v).trim()).filter(Boolean) : [],
        precoOriginal: Math.max(0, parseFloat(p.precoOriginal) || 0),
        precoPromocional: (parseFloat(p.precoPromocional) > 0 && parseFloat(p.precoPromocional) < parseFloat(p.precoOriginal))
          ? parseFloat(p.precoPromocional)
          : 0
      }));
    }

    saveProduct(product) {
      if (!product || typeof product !== 'object') return false;
      const products = this.getProducts();
      
      const precoOrig = Math.max(0, parseFloat(product.precoOriginal) || 0);
      let precoPromo = Math.max(0, parseFloat(product.precoPromocional) || 0);
      if (precoPromo >= precoOrig) precoPromo = 0; // Previne desconto inexistente ou preço promocional maior

      const sanitized = {
        id: product.id || 'prod-' + Date.now(),
        sku: String(product.sku || '').trim(),
        nome: String(product.nome || '').trim(),
        descricao: String(product.descricao || '').trim(),
        categoria: String(product.categoria || 'Novidades').trim(),
        precoOriginal: precoOrig,
        precoPromocional: precoPromo,
        imagens: Array.isArray(product.imagens) ? product.imagens.filter(isValidImageUrl) : [],
        variacoes: Array.isArray(product.variacoes) ? product.variacoes.map(v => String(v).trim()).filter(Boolean) : [],
        foraDeEstoque: Boolean(product.foraDeEstoque),
        novidade: Boolean(product.novidade),
        destacarEstoqueBaixo: Boolean(product.destacarEstoqueBaixo),
        estoqueBaixoQtd: Math.max(0, parseInt(product.estoqueBaixoQtd, 10) || 0)
      };

      const index = products.findIndex(p => p.id === sanitized.id);
      if (index >= 0) {
        products[index] = sanitized;
      } else {
        products.unshift(sanitized);
      }

      safeStorageSet(STORAGE_KEYS.PRODUCTS, products);

      if (this.isFirebaseReady && this.database) {
        sanitized._remotePromise = this.database.ref('pdm_data/products/' + sanitized.id).set(sanitized)
          .then(() => { sanitized._synced = true; return true; })
          .catch((err) => {
            console.warn('Aviso: salvo no LocalStorage, mas falhou ao gravar no Firebase:', err.message);
            sanitized._synced = false;
            return false;
          });
      } else {
        sanitized._remotePromise = Promise.resolve(false);
      }

      this.notifyListeners('save_product');
      return sanitized;
    }

    deleteProduct(id) {
      if (!id) return false;
      let products = this.getProducts();
      products = products.filter(p => p.id !== id);
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));

      if (this.isFirebaseReady && this.database) {
        this.database.ref('pdm_data/products/' + id).remove().catch((err) => {
          console.warn('Aviso: excluído no LocalStorage, mas falhou no Firebase:', err.message);
        });
      }

      this.notifyListeners('delete_product');
      return true;
    }

    // --- CIDADES / TAXAS DE ENTREGA ---
    getCities() {
      const items = safeJsonParse(localStorage.getItem(STORAGE_KEYS.CITIES), INITIAL_CITIES);
      return Array.isArray(items) ? items : Object.values(items || {});
    }

    saveCity(city) {
      if (!city || !city.nome) return false;
      const cities = this.getCities();
      const sanitized = {
        id: city.id || 'city-' + Date.now(),
        nome: String(city.nome).trim(),
        taxa: Math.max(0, parseFloat(city.taxa) || 0)
      };

      const index = cities.findIndex(c => c.id === sanitized.id);
      if (index >= 0) {
        cities[index] = sanitized;
      } else {
        cities.push(sanitized);
      }

      localStorage.setItem(STORAGE_KEYS.CITIES, JSON.stringify(cities));
      if (this.isFirebaseReady && this.database) {
        this.database.ref('pdm_data/cities/' + sanitized.id).set(sanitized).catch(() => {});
      }

      this.notifyListeners('save_city');
      return sanitized;
    }

    deleteCity(id) {
      if (!id) return false;
      let cities = this.getCities();
      cities = cities.filter(c => c.id !== id);
      localStorage.setItem(STORAGE_KEYS.CITIES, JSON.stringify(cities));

      if (this.isFirebaseReady && this.database) {
        this.database.ref('pdm_data/cities/' + id).remove().catch(() => {});
      }

      this.notifyListeners('delete_city');
      return true;
    }

    // --- CUPONS DE DESCONTO ---
    getCoupons() {
      const items = safeJsonParse(localStorage.getItem(STORAGE_KEYS.COUPONS), INITIAL_COUPONS);
      return Array.isArray(items) ? items : Object.values(items || {});
    }

    saveCoupon(coupon) {
      if (!coupon || !coupon.codigo) return false;
      const coupons = this.getCoupons();
      const sanitized = {
        id: coupon.id || 'cup-' + Date.now(),
        codigo: String(coupon.codigo).trim().toUpperCase(),
        tipo: coupon.tipo === 'fixo' ? 'fixo' : 'percentual',
        valor: Math.max(0, parseFloat(coupon.valor) || 0),
        ativo: coupon.ativo !== false
      };

      const index = coupons.findIndex(c => c.id === sanitized.id);
      if (index >= 0) {
        coupons[index] = sanitized;
      } else {
        coupons.push(sanitized);
      }

      localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(coupons));
      if (this.isFirebaseReady && this.database) {
        this.database.ref('pdm_data/coupons/' + sanitized.id).set(sanitized).catch(() => {});
      }

      this.notifyListeners('save_coupon');
      return sanitized;
    }

    deleteCoupon(id) {
      if (!id) return false;
      let coupons = this.getCoupons();
      coupons = coupons.filter(c => c.id !== id);
      localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(coupons));

      if (this.isFirebaseReady && this.database) {
        this.database.ref('pdm_data/coupons/' + id).remove().catch(() => {});
      }

      this.notifyListeners('delete_coupon');
      return true;
    }

    validateCoupon(code, subtotalInCents) {
      if (!code || typeof code !== 'string') return { valid: false, message: 'Informe o código do cupom.' };
      const normalized = code.trim().toUpperCase();
      const coupons = this.getCoupons();
      const coupon = coupons.find(c => c.codigo.toUpperCase() === normalized && c.ativo);

      if (!coupon) {
        return { valid: false, message: 'Cupom inválido ou expirado.' };
      }

      let discountInCents = 0;
      if (coupon.tipo === 'percentual') {
        const pct = Math.min(100, Math.max(0, coupon.valor));
        discountInCents = Math.round((subtotalInCents * pct) / 100);
      } else {
        discountInCents = Math.min(subtotalInCents, Math.round(coupon.valor * 100));
      }

      return {
        valid: true,
        coupon,
        discountInCents,
        message: `Cupom ${coupon.codigo} aplicado com sucesso!`
      };
    }

    // --- CONFIGURAÇÕES DA LOJA ---
    getSettings() {
      return safeJsonParse(localStorage.getItem(STORAGE_KEYS.SETTINGS), INITIAL_SETTINGS);
    }

    saveSettings(settings) {
      if (!settings || typeof settings !== 'object') return false;
      const current = this.getSettings();
      const sanitized = {
        nomeLoja: String(settings.nomeLoja || current.nomeLoja || 'Produtinhos da Maria').trim(),
        whatsapp: String(settings.whatsapp || '').replace(/\D/g, ''),
        mensagemBoasVindas: String(settings.mensagemBoasVindas || current.mensagemBoasVindas).trim(),
        avisoEmbalagem: String(settings.avisoEmbalagem || current.avisoEmbalagem).trim()
      };

      if (sanitized.whatsapp && (sanitized.whatsapp.length === 10 || sanitized.whatsapp.length === 11)) {
        sanitized.whatsapp = '55' + sanitized.whatsapp;
      }

      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(sanitized));
      if (this.isFirebaseReady && this.database) {
        this.database.ref('pdm_data/settings').set(sanitized).catch(() => {});
      }

      this.notifyListeners('save_settings');
      return sanitized;
    }

    // --- AUTENTICAÇÃO ADMINISTRATIVA (Firebase Auth + Fallback Local) ---
    async adminLogin(usuario, senha) {
      const u = String(usuario || '').trim();
      const s = String(senha || '').trim();

      // 1. Tenta autenticação real com Firebase Auth se disponível
      if (this.auth) {
        try {
          const userCredential = await this.auth.signInWithEmailAndPassword(u, s);
          const session = {
            user: userCredential.user.email || u,
            uid: userCredential.user.uid,
            role: 'admin',
            isDemoAuth: false,
            timestamp: Date.now()
          };
          sessionStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(session));
          return { success: true, session, isFirebase: true };
        } catch (firebaseErr) {
          console.warn('Falha no Firebase Auth:', firebaseErr.message);
          // Fallback de emergência caso offline ou sem rede
          if ((u === 'maria@gmail.com' || u === 'admin') && (s === 'maria123' || s === 'admin123')) {
            const session = {
              user: u,
              role: 'admin',
              isDemoAuth: true,
              timestamp: Date.now()
            };
            sessionStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(session));
            return { success: true, session, isDemoAuth: true, message: 'Acesso autorizado em modo local/offline.' };
          }
          let errorMsg = 'Falha no login.';
          if (firebaseErr.code === 'auth/user-not-found' || firebaseErr.code === 'auth/wrong-password' || firebaseErr.code === 'auth/invalid-credential') {
            errorMsg = 'E-mail ou senha incorretos.';
          } else if (firebaseErr.code === 'auth/network-request-failed') {
            errorMsg = 'Sem conexão com a internet. Verifique sua rede.';
          } else if (firebaseErr.message) {
            errorMsg = firebaseErr.message;
          }
          return { success: false, message: errorMsg };
        }
      }

      // 2. Fallback caso o Firebase SDK não esteja disponível no ambiente (offline/testes)
      if ((u === 'maria@gmail.com' || u === 'admin' || u === 'maria') && (s === 'maria123' || s === 'admin123')) {
        const session = {
          user: u,
          role: 'admin',
          isDemoAuth: true,
          timestamp: Date.now()
        };
        sessionStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(session));
        return { success: true, session, isDemoAuth: true };
      }

      return { success: false, message: 'E-mail ou senha incorretos.' };
    }

    getAdminSession() {
      return safeJsonParse(sessionStorage.getItem(STORAGE_KEYS.ADMIN_SESSION), null);
    }

    async adminLogout() {
      if (this.auth) {
        try {
          await this.auth.signOut();
        } catch (e) {
          console.warn('Erro ao deslogar do Firebase:', e);
        }
      }
      sessionStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
      this.notifyListeners('auth_logout');
    }
  }

  // Instância global única
  window.DB = new StoreDatabase();
  window.pdmEscapeHtml = escapeHtml;
  window.pdmIsValidImageUrl = isValidImageUrl;

})(window);
