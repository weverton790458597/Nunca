// ================================
// CHROME STORAGE SHIM (WEB)
// ================================
if (typeof chrome === 'undefined') {
  window.chrome = {};
}

if (!chrome.storage) {
  chrome.storage = {};
}

function storageGet(area, keys, callback) {
  let result = {};

  if (typeof keys === 'string') {
    const val = localStorage.getItem(keys);
    result[keys] = val ? JSON.parse(val) : undefined;
  } 
  else if (Array.isArray(keys)) {
    keys.forEach(k => {
      const val = localStorage.getItem(k);
      result[k] = val ? JSON.parse(val) : undefined;
    });
  } 
  else if (typeof keys === 'object') {
    Object.keys(keys).forEach(k => {
      const val = localStorage.getItem(k);
      result[k] = val ? JSON.parse(val) : keys[k];
    });
  }

  callback && callback(result);
}

function storageSet(area, data, callback) {
  Object.keys(data).forEach(k => {
    localStorage.setItem(k, JSON.stringify(data[k]));
  });
  callback && callback();
}

chrome.storage.sync = {
  get: (keys, cb) => storageGet('sync', keys, cb),
  set: (data, cb) => storageSet('sync', data, cb)
};

chrome.storage.local = {
  get: (keys, cb) => storageGet('local', keys, cb),
  set: (data, cb) => storageSet('local', data, cb)
};

function chromeGetPromise(area, keys) {
  return new Promise(resolve => {
    chrome.storage[area].get(keys, result => resolve(result));
  });
}


(() => {
  // --------------------
  // Configurações
  // --------------------
  const NUM_VELAS = 120;
  const BB_PERIODO = 20;
  const EMA_PERIODO = 120;
  const BB_DESVIO = 2;

  // Configuração de múltiplos ativos
const ativosList = ['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT'];
const ativos = {};

ativosList.forEach(symbol => {
  ativos[symbol] = {
    velas: [],
    sinais: [],
    ws: null,
    lastSignalVelaIndex: -1,
    ultimoDisparoTimestamp: 0
  };
});


// pares default ligados
const defaultPairs = {
  BTCUSDT:true,
  ETHUSDT:true,
  BNBUSDT:true,
  SOLUSDT:true
};

chrome.storage.sync.get({ enabledPairs: defaultPairs }, data => {
  const enabledPairs = data.enabledPairs;

  document.querySelectorAll('.pairBtn').forEach(btn=>{
    const pair = btn.dataset.pair;

    // estado inicial
    if(enabledPairs[pair]) btn.classList.add('active');

    btn.addEventListener('click', ()=>{
      enabledPairs[pair] = !enabledPairs[pair];
      btn.classList.toggle('active', enabledPairs[pair]);

      chrome.storage.sync.set({ enabledPairs });
    });
  });
});


  

  const voltarBtn = document.getElementById("botao-voltar");
  const iaBtn = document.getElementById("botao-ia");
  const btnRefresh = document.getElementById('botao-refresh'); 
  chrome.storage.local.set({ ultimaTela: 'overlay' });

const logo = document.getElementById('logo');
const siteNome = document.getElementById('site-nome');

// Tempo em milissegundos
const tempoLogo = 30000; 
const tempoTexto = 10000; 

let mostrandoLogo = true;

// Função para alternar
function alternarLogoTexto() {
  if (mostrandoLogo) {
    logo.classList.add('oculto');
    siteNome.classList.add('visivel');
    setTimeout(alternarLogoTexto, tempoTexto); // mantém o texto por tempoTexto
  } else {
    logo.classList.remove('oculto');
    siteNome.classList.remove('visivel');
    setTimeout(alternarLogoTexto, tempoLogo); // mantém a logo por tempoLogo
  }
  mostrandoLogo = !mostrandoLogo;
}

// Inicia a alternância
alternarLogoTexto();


  // --------------------
  // DOM Elements
  // --------------------
  const divBBSuperior = document.querySelector('.bb-superior');
  const divBBInferior = document.querySelector('.bb-inferior');
  const divEMA = document.querySelector('.ema');
  const divUltimoFechamento = document.getElementById('ultimoFechamento');
  const divPrecoAtual = document.getElementById('precoAtual');
  const divStatus = document.getElementById('sinalCentral');

  const overlay = document.getElementById('overlayTela');

  const seta = divStatus.querySelector('.seta');
  const textoSinal = divStatus.querySelector('.textoSinal');
  const horarioSinal = divStatus.querySelector('.horarioSinal');

  const alarmeToggle = document.getElementById('alarmeToggle');
  let alarmeAtivo = false;
   
  // --------------------
// Abrir/Fechar tela de Configurações
// --------------------
const btnConfiguracao = document.getElementById('btnConfiguracao');
const configOverlay = document.getElementById('configOverlay');
const fecharConfig = document.getElementById('fecharConfig');
const btnInserirID = document.getElementById('btnInserirID');
const telegramIdContainer = document.getElementById('telegramIdContainer');
const telegramInput = document.getElementById('telegramIdInput');
const salvarTelegramBtn = document.getElementById('salvarTelegramIdBtn');
const telegramStatus = document.getElementById('telegramIdStatus');

// Abrir overlay
btnConfiguracao.addEventListener('click', () => {
    configOverlay.style.display = 'flex';
    telegramIdContainer.style.display = 'none'; // esconde input ao abrir
});

// Fechar overlay
fecharConfig.addEventListener('click', () => {
    configOverlay.style.display = 'none';
});

// Mostrar input de ID ao clicar no botão "Inserir ID"
btnInserirID.addEventListener('click', () => {
    telegramIdContainer.style.display = 'flex';
    // Carrega ID salvo se existir
    chrome.storage.sync.get(['telegramId'], (data) => {
        if (data.telegramId) telegramInput.value = data.telegramId;
    });
});

// Salvar ID
salvarTelegramBtn.addEventListener('click', () => {
    const id = telegramInput.value.trim();
    if (!id) {
        telegramStatus.textContent = 'Informe um ID!';
        telegramStatus.style.color = 'red';
        return;
    }

    chrome.storage.sync.set({ telegramId: id }, () => {
        telegramStatus.textContent = 'Salvo!';
        telegramStatus.style.color = 'limegreen';
        setTimeout(() => telegramStatus.textContent = '', 2000);
    });
});

// --------------------
// Função global para enviar mensagem pro Telegram
// --------------------
// Substitua BOT_TOKEN pelo token do seu bot
const BOT_TOKEN = '8365799741:AAFTz9X5nOR0zFt5cTAxWXtTOSAF925gUgc';

window.enviarTelegram = function(msg) {
    chrome.storage.sync.get(['telegramId'], (data) => {
        const id = data.telegramId;
        if (!id) {
            console.warn('Telegram ID não definido!');
            return;
        }

        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${id}&text=${encodeURIComponent(msg)}&parse_mode=Markdown`;

        fetch(url)
            .then(res => res.json())
            .then(res => {
                if (!res.ok) console.error('Erro ao enviar Telegram:', res);
                else console.log('Mensagem enviada:', res.result);
            })
            .catch(err => console.error('Erro ao enviar Telegram:', err));
    });
};


  const sons = {
    compra: new Audio('/sounds/compra.mp3'),
    venda: new Audio('/sounds/venda.mp3')
  };
// 🔓 Desbloqueia áudio após primeira interação do usuário
document.addEventListener('click', () => {
  Object.values(sons).forEach(s => {
    try {
      s.play().then(() => {
        s.pause();
        s.currentTime = 0;
      });
    } catch (e) {}
  });
}, { once: true });
  // --------------------
  // Carrega estado do alarme ao iniciar
  // --------------------
  chrome.storage.local.get(['alarmeAtivo'], (result) => {
    if (result.alarmeAtivo !== undefined) {
      alarmeAtivo = result.alarmeAtivo;
      alarmeToggle.classList.toggle('on', alarmeAtivo);
    }
  });

  // --------------------
  // Toggle do alarme
  // --------------------
  alarmeToggle.addEventListener('click', () => {
    alarmeAtivo = !alarmeAtivo;
    alarmeToggle.classList.toggle('on', alarmeAtivo);
    chrome.storage.local.set({ alarmeAtivo });
  });

  // --------------------
  // Funções de cálculo e atualização
  // --------------------
  function calcularEMA(velas, periodo) {
    if (velas.length < periodo) return null;
    const k = 2 / (periodo + 1);
    let ema = velas[velas.length - periodo].fechamento;
    for (let i = velas.length - periodo + 1; i < velas.length; i++) {
      ema = velas[i].fechamento * k + ema * (1 - k);
    }
    return ema;
  }

  function calcularBB(velas) {
    if (velas.length < BB_PERIODO) return null;
    const slice = velas.slice(-BB_PERIODO);
    const valores = slice.map(v => v.fechamento);
    const media = valores.reduce((a,b) => a+b,0)/BB_PERIODO;
    const desvio = Math.sqrt(valores.reduce((acc,v)=>acc + Math.pow(v-media,2),0)/BB_PERIODO);
    return { media, superior: media + BB_DESVIO * desvio, inferior: media - BB_DESVIO * desvio };
  }
  /////////////////////////////////////////////////////

  function calcularRSI(velas, periodo = 14) {
  if (velas.length <= periodo) return null;

  let ganhos = 0;
  let perdas = 0;

  for (let i = velas.length - periodo; i < velas.length; i++) {
    const diff = velas[i].fechamento - velas[i - 1].fechamento;
    if (diff >= 0) ganhos += diff;
    else perdas -= diff;
  }

  const avgGain = ganhos / periodo;
  const avgLoss = perdas / periodo;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

  ///////////////////////////////
  //função atualizar Indicadores//
  ///////////////////////////////
   async function atualizarIndicadores(symbol, precoAtual) {

 const data = await chromeGetPromise('sync', { enabledPairs: defaultPairs });
  if (!data.enabledPairs[symbol]) return; // corta indicador
	
  const velasRecebidas = ativos[symbol].velas;
  if (velasRecebidas.length === 0) return;

  const velasTemp = [...velasRecebidas];
  const ultimaVela = velasTemp[velasTemp.length - 1];

  if (ultimaVela && precoAtual !== undefined) {
    velasTemp[velasTemp.length - 1] = { ...ultimaVela, fechamento: precoAtual };
  }

  const bb = calcularBB(velasTemp);
  const ema = calcularEMA(velasTemp, EMA_PERIODO);
const rsi = calcularRSI(velasTemp, 14);

// Opcional: exibir RSI no overlay, se quiser
if (rsi !== null) {
  if (window.exibirRSI) window.exibirRSI(rsi);
}

// --- RSI no painel ---
const divRSI = document.getElementById("rsiValor");

if (rsi !== null && divRSI) {
    divRSI.textContent = "" + rsi.toFixed(2);

    if (rsi >= 55) {
        divRSI.style.color = "#ff3434"; // vermelho (sobrecompra)
    } else if (rsi <= 45) {
        divRSI.style.color = "#00ff7b"; // verde (sobrevenda)
    } else {
        divRSI.style.color = "white"; // neutro
    }
}

  // Atualiza DOM
  if (bb) {
    divBBSuperior.textContent = bb.superior.toFixed(2);
    divBBSuperior.style.color = 'red';
    divBBInferior.textContent = bb.inferior.toFixed(2);
    divBBInferior.style.color = 'limegreen';
  }

  if (ema !== null) {
    divEMA.textContent = ema.toFixed(2);
    if (bb && ema > bb.superior) divEMA.style.color = 'red';
    else if (bb && ema < bb.inferior) divEMA.style.color = 'limegreen';
    else divEMA.style.color = 'blue';
  }

  if (ultimaVela) {
    divUltimoFechamento.textContent = ultimaVela.fechamento.toFixed(2);
    divUltimoFechamento.style.color = precoAtual >= ultimaVela.abertura ? 'limegreen' : 'red';
  }

  if (precoAtual !== undefined) {
    divPrecoAtual.textContent = precoAtual.toFixed(2);
    divPrecoAtual.style.color = precoAtual >= ultimaVela.fechamento ? 'limegreen' : 'red';
  }
}


  // --------------------
  // Sinais
  // --------------------
  let lastSignalVelaIndex = -1;
  let aguardando = true;
  let hideTimeout;
  let ponto = 0;

  function atualizarAguardando() {
    ponto = (ponto % 3) + 1;
    textoSinal.textContent = 'Aguardando sinal' + '.'.repeat(ponto);
    seta.style.display = 'none';
    seta.classList.remove('pulsar');
    overlay.style.borderColor = 'gold';
    horarioSinal.textContent = new Date().toLocaleTimeString('pt-BR', {hour12:false});
  }

  setInterval(() => { if(aguardando) atualizarAguardando(); }, 500);

 // === mostrarSinal atualizado para suportar origem (nome da estratégia) ===
function mostrarSinal(tipo, origem = null) {
  aguardando = false;
  
  // Expande overlay se estiver minimizado
    if (typeof window.expandOverlayIfMinimized === 'function') {
        window.expandOverlayIfMinimized();
    }

  
  clearTimeout(hideTimeout);

   // Forçar expansão da tela se estiver minimizada
    if (overlay.classList.contains('minimizado')) {
        toggleMinMax();
    }

  seta.style.display = 'block';
  seta.classList.add('pulsar');

  const now = new Date();
  horarioSinal.textContent = now.toLocaleTimeString('pt-BR', {hour12:false});

  const origemTexto = origem ? ` · ${origem}` : '';

  if (tipo === 'compra') {
    seta.textContent = '↑';
    seta.style.color = 'limegreen';
    textoSinal.textContent = 'Entrada de Compra' + origemTexto;
    overlay.style.borderColor = 'limegreen';
    if (alarmeAtivo) try { sons.compra.play(); } catch(e){/*ignore*/ }
  } else if (tipo === 'venda') {
    seta.textContent = '↓';
    seta.style.color = 'red';
    textoSinal.textContent = 'Entrada de Venda' + origemTexto;
    overlay.style.borderColor = 'red';
    if (alarmeAtivo) try { sons.venda.play(); } catch(e){/*ignore*/ }
  } else {
    // Se quiser suportar outros tipos, cai aqui
    textoSinal.textContent = (tipo || 'Sinal') + origemTexto;
  }

  
   // === Aqui é onde você coloca o Telegram ===
if (typeof window.enviarTelegram === 'function') {

  const msg = 
`📌 *SINAL DISPONÍVEL*

${tipo === 'compra' ? '🚀 *COMPRA*' : '📉 *VENDA*'}

*Ativo:* \`${origem}\`
*Status:* Entrar Agora

⏱ ${new Date().toLocaleTimeString('pt-BR', {hour12:false})}
`;

  window.enviarTelegram(msg);
}


  hideTimeout = setTimeout(() => {
    aguardando = true;
    ponto = 0;
    seta.classList.remove('pulsar');
  }, 30000);
}

// ======================================================
// 🚀 Função gerarSinal() — Versão CLEAN, rápida e direta
// ======================================================
const COOLDOWN_MS = 600000; // ajuste se quiser 3s => 3000

async function gerarSinal(symbol, velaIndex = null, precoAtual = null) {

   const data = await chromeGetPromise('sync', { enabledPairs: defaultPairs });
    if (!data.enabledPairs[symbol]) return;

    const velasRecebidas = ativos[symbol].velas;
    if (velasRecebidas.length === 0) return;

    const agora = Date.now();

    // Cooldown global
    if (agora - ativos[symbol].ultimoDisparoTimestamp < COOLDOWN_MS) return;

    // Evitar repetir sinal da mesma vela
    if (velaIndex !== null && velaIndex === ativos[symbol].lastSignalVelaIndex) return;

    // Copiar velas
    const velasTemp = [...velasRecebidas];
    let ultimaVela = { ...velasTemp[velasTemp.length - 1] };

    // Atualizar candle em tempo real
    if (precoAtual !== null) {
        ultimaVela.fechamento = precoAtual;
        if (precoAtual > ultimaVela.maxima) ultimaVela.maxima = precoAtual;
        if (precoAtual < ultimaVela.minima) ultimaVela.minima = precoAtual;
        velasTemp[velasTemp.length - 1] = ultimaVela;
    }

    // Indicadores essenciais
    const bb = calcularBB(velasTemp);
    const ema = calcularEMA(velasTemp, EMA_PERIODO);
    const rsi = calcularRSI(velasTemp, 14);

    if (!bb || ema === null || rsi === null || isNaN(rsi)) return;

    const preco = precoAtual ?? ultimaVela.fechamento;
    let sinalAtual = null;

    // ======================================================
    // 🔥 NOVA ESTRATÉGIA OFICIAL
    // ======================================================

    const emaDentro = ema >= bb.inferior && ema <= bb.superior;

    // 🎯 COMPRA
    if (
        preco <= bb.inferior &&
        emaDentro &&
        rsi <= 30
    ) {
        sinalAtual = 'compra';
    }

    // 🎯 VENDA
    else if (
        preco >= bb.superior &&
        emaDentro &&
        rsi >= 70
    ) {
        sinalAtual = 'venda';
    }



    // ======================================================
    // 🔒 BLOQUEIO POR WINRATE (MANTIDO)
    // ======================================================
    try {
        if (typeof window.getWinRate === 'function' && typeof window.getWinTotal === 'function') {
            const wr = window.getWinRate(symbol);
            const total = window.getWinTotal(symbol);

            if (total === 0) {
                console.log(`[${symbol}] Bloqueado — sem histórico suficiente.`);
                return;
            }

            if (wr < 0.0) {
                console.log(`[${symbol}] Bloqueado — winrate baixo.`);
                return;
            }
        }
    } catch (e) {
        console.warn('erro consultando winrate', e);
    }



    // ======================================================
    // 🎯 DISPARO FINAL DO SINAL
    // ======================================================
    if (sinalAtual) {

        // Mostrar na interface
        mostrarSinal(sinalAtual, `${symbol}`);

        // Travar cooldown e vela
        ativos[symbol].lastSignalVelaIndex = velaIndex ?? velasRecebidas.length - 1;
        ativos[symbol].ultimoDisparoTimestamp = agora;
    }
}



  // --------------------
  // Carregar velas iniciais
  // --------------------
async function carregarVelasIniciais(symbol) {
  try {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1m&limit=${NUM_VELAS}`;
    const res = await fetch(url);
    const data = await res.json();
    data.forEach(k => {
      ativos[symbol].velas.push({
        abertura: parseFloat(k[1]),
        fechamento: parseFloat(k[4]),
        minima: parseFloat(k[3]),
        maxima: parseFloat(k[2]),
      });
    });
    atualizarIndicadores(symbol, ativos[symbol].velas[ativos[symbol].velas.length - 1].fechamento);
    gerarSinal(symbol);
  } catch (e) { console.error(`Erro ao carregar velas iniciais de ${symbol}:`, e); }
}


  // --------------------
  // WebSocket Binance
  // --------------------
function iniciarPrecoBinance(symbol) {
  if (ativos[symbol].ws) ativos[symbol].ws.close();

  ativos[symbol].ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_1m`);

  ativos[symbol].ws.onmessage = (msg) => {
    try {
      const data = JSON.parse(msg.data).k;
      const velaAtual = {
        abertura: parseFloat(data.o),
        fechamento: parseFloat(data.c),
        minima: parseFloat(data.l),
        maxima: parseFloat(data.h),
      };
      const precoAtual = parseFloat(data.c);

      // Atualiza indicadores e gera sinal para este ativo
      atualizarIndicadores(symbol, precoAtual);
      gerarSinal(symbol, null, precoAtual);

      // Adiciona a vela ao histórico somente quando fechar
      if (data.x) {
        ativos[symbol].velas.push(velaAtual);
        if (ativos[symbol].velas.length > NUM_VELAS) ativos[symbol].velas.shift();
      }

    } catch(e) {
      console.error(`Erro WS Binance ${symbol}:`, e);
    }
  };

  ativos[symbol].ws.onclose = () => setTimeout(() => iniciarPrecoBinance(symbol), 3000);
  ativos[symbol].ws.onerror = () => console.error(`Erro WS Binance ${symbol}`);
}



  // --------------------
  // Inicialização
  // --------------------
   (async () => {
  for (const symbol of ativosList) {
    await carregarVelasIniciais(symbol); // carrega histórico de cada ativo
    iniciarPrecoBinance(symbol);          // abre WebSocket para cada ativo
  }
})();

// =========================================================
//  Receber sinais de módulos externos (TwelveData, Pullback, etc.)
//  Versão limpa: apenas exibe o sinal, sem histórico.
// =========================================================

function receberSinalModulo(payload) {
  try {
    console.log('[sinais.js] Sinal externo recebido:', payload);

    // Exibir visual do sinal (compra/venda + origem opcional)
    if (payload?.tipo && typeof mostrarSinal === 'function') {
      mostrarSinal(payload.tipo, payload.ativo || payload.modulo || "Externo");
    }

  } catch (e) {
    console.error('[sinais.js] erro ao processar sinal externo:', e);
  }
}

// Expor globalmente
window.receberSinalModulo = receberSinalModulo;

// Fallback: caso venha como evento
window.addEventListener('sinalModulo', (e) => {
  if (e?.detail) {
    receberSinalModulo(e.detail);
  }
});
////////////////////////////////////////////////////

  if (voltarBtn) {
    voltarBtn.addEventListener("click", () => {
      chrome.storage.local.set({ ultimaTela: '', estrategiaSelecionada: null }, () => {
        window.location.href = "bem-vindo.html";
      });
    });
  }

   if (iaBtn) {
    iaBtn.addEventListener("click", () => {
      chrome.storage.local.set({ ultimaTela: '', estrategiaSelecionada: null }, () => {
        window.location.href = "";
      });
    });
  }
////////////////////////fim da Função/////////////////////////

  setInterval(()=>{
  ['BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT'].forEach(sym=>{
    const v = Math.round((window.getWinRate(sym)||0)*100);
    const d = document.getElementById('dot-'+sym);
    if(!d)return;
    d.textContent = v+'%';
    d.style.backgroundColor = (v>=70 ? 'green' : 'red');
  });
},1000);

//////////////////////////////////////////////////
// Controle de cooldown do alerta
const winRateAlertCooldown = {};
const ALERT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutos

 
 // ===========================
// ⚠️ ALERTA DE WINRATE >= 70%
// ===========================

// controla se já foi enviado
const winRateAlertSent = {}; 

// som do alerta
const alertaSom = new Audio('/sounds/status.mp3');
alertaSom.volume = 0.9;

// cria o container do alerta visual, se não existir
if (!document.getElementById('winrate-alert-container')) {
  const container = document.createElement('div');
  container.id = 'winrate-alert-container';
  container.style.cssText = `
    position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
`;
  document.body.appendChild(container);
}

// função pra exibir o alerta visual
function mostrarAlertaVisual(msg) {
  const container = document.getElementById('winrate-alert-container');
  const alerta = document.createElement('div');
  alerta.textContent = msg;
  alerta.style.cssText = `
    background: rgba(0, 150, 0, 0.9);
    color: #fff;
    padding: 10px 15px;
    border-radius: 8px;
    font-size: 14px;
    box-shadow: 0 0 10px rgba(0, 255, 0, 0.6);
    animation: fadeInOut 15s forwards;
  `;
  container.appendChild(alerta);

  // remove depois de 5 segundos
  setTimeout(() => alerta.remove(), 15000);
}

// adiciona animação visual (piscar)
const style = document.createElement('style');
style.textContent = `
@keyframes fadeInOut {
  0% { opacity: 0; transform: translateY(-10px); }
  10%, 90% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-10px); }
}
`;
document.head.appendChild(style);

// função principal de verificação
function verificarWinRateAlert() {
  ['BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT'].forEach(sym => {
    const winRate = window.getWinRate(sym) || 0;

    if (winRate >= 0.7) {
      if (!winRateAlertSent[sym]) {
        const msg = `⚠️ WinRate ${Math.round(winRate * 100)}% em ${sym}! Fique atento(a) a possíveis sinais.`;

        // som
        if (typeof alertaSom.play === 'function') {
          alertaSom.currentTime = 0;
          try { alertaSom.play(); } catch (e) {}
        }

        // visual
        mostrarAlertaVisual(msg);

        // Telegram
        if (typeof window.enviarTelegram === 'function') {
          window.enviarTelegram(msg);
        }

        winRateAlertSent[sym] = true;
      }
    } else {
      // reseta quando cai abaixo de 70%
      winRateAlertSent[sym] = false;
    }
  });
}

// roda a cada 10 segundos
setInterval(verificarWinRateAlert, 10000);

///////////////////////////////////////////////////////////

 /*
 // --------------------
// ⚡ Gerador de Sinal Fake para teste
// --------------------
(function sinalFake() {
  const ativosFake = ['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT'];
  
  setInterval(() => {
    const ativo = ativosFake[Math.floor(Math.random() * ativosFake.length)];
    const tipo = Math.random() > 0.5 ? 'compra' : 'venda';

    // dispara o sinal fake usando a função que você já tem
    if (typeof gerarSinal === 'function') {
      try {
        // Apenas para teste: ignora cooldown interno
        mostrarSinal(tipo, ativo + ' (Fake)');
        console.log(`[FAKE] ${tipo.toUpperCase()} - ${ativo}`);
      } catch(e){ console.error(e); }
    }
  }, 5000); // a cada 15s gera um sinal fake
})();
*/


})();
