(() => {
  if (window.__modulo3Carregado) return;
  window.__modulo3Carregado = true;

  // --------------------
  // Configurações
  // --------------------
  const NUM_VELAS = 500;
  const BB_PERIODO = 20;
  const EMA_PERIODO = 120;
  const BB_DESVIO = 2;
  
  // pares suportados (mesmo que no sinais.js)
  const paresList = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'];

  // estado por par
  const ativosState = {};
  paresList.forEach(p => {
    ativosState[p] = {
      velas: [],
      padroesAcertos: [],
      padroesErros: [],
      socket: null
    };
  });

  // Exposição pública (compatibilidade)
  window.mod3State = window.mod3State || {};// objeto por símbolo com {percentual, acertos, erros,...}

  // --------------------
  // Utilitárias: EMA / BB / cálculo de padrão (mesma lógica)
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
    const media = valores.reduce((a, b) => a + b, 0) / BB_PERIODO;
    const desvio = Math.sqrt(valores.reduce((acc, v) => acc + Math.pow(v - media, 2), 0) / BB_PERIODO);
    return {
      media,
      superior: media + BB_DESVIO * desvio,
      inferior: media - BB_DESVIO * desvio
    };
  }

function calcularRSI(velas, periodo = 14) {
  if (!velas || velas.length <= periodo) return null;

  let ganhos = 0;
  let perdas = 0;

  for (let i = velas.length - periodo; i < velas.length; i++) {
    const atual = velas[i].fechamento;
    const anterior = velas[i - 1].fechamento;
    const diff = atual - anterior;

    if (diff > 0) ganhos += diff;
    else perdas -= diff;
  }

  if (perdas === 0) return 100;

  const rs = ganhos / perdas;
  return 100 - (100 / (1 + rs));
}


 function calcularPadraoParaVelas(velas, precoAtual = null) {
  if (!velas || velas.length < EMA_PERIODO + 2) {
    return { acertos: 0, erros: 0, percentual: 0, horariosAcertos: [], horariosErros: [] };
  }

  const temp = velas.map(v => ({ ...v }));
  if (precoAtual !== null && temp.length > 0) {
    temp[temp.length - 1].fechamento = precoAtual;
  }

  let acertos = 0;
  let erros = 0;
  const horariosAcertos = [];
  const horariosErros = [];

  let ultimoTimestamp = 0;
  const COOLDOWN_MS = 600000; // 10 minutos

  for (let i = EMA_PERIODO; i < temp.length - 1; i++) {
    const atual = temp[i];
    const proxima = temp[i + 1];

    const timestampAtual = new Date(`1970-01-01T${atual.horario}Z`).getTime();
    if (timestampAtual - ultimoTimestamp < COOLDOWN_MS) continue;

    const slice = temp.slice(0, i + 1);

    const bb = calcularBB(slice);
    const ema = calcularEMA(slice, EMA_PERIODO);
    const rsi = calcularRSI(slice, 14);

    if (!bb || ema === null || rsi === null || isNaN(rsi)) continue;

    const preco = atual.fechamento;
    const emaDentro = ema >= bb.inferior && ema <= bb.superior;

    let sinal = null;

    // ===== MESMA LÓGICA DO MÓDULO 1 =====
    if (preco <= bb.inferior && emaDentro && rsi <= 30) {
      sinal = 'compra';
    } else if (preco >= bb.superior && emaDentro && rsi >= 70) {
      sinal = 'venda';
    }

    if (!sinal) continue;

    // Avaliação no candle seguinte
    if (
      (sinal === 'compra' && proxima.fechamento > preco) ||
      (sinal === 'venda' && proxima.fechamento < preco)
    ) {
      acertos++;
      horariosAcertos.push(atual.horario);
    } else {
      erros++;
      horariosErros.push(atual.horario);
    }

    ultimoTimestamp = timestampAtual;
  }

  return {
    acertos,
    erros,
    percentual: (acertos + erros) ? acertos / (acertos + erros) : 0,
    horariosAcertos: horariosAcertos.slice(-10),
    horariosErros: horariosErros.slice(-10)
  };
}


  function atualizarMod1State(symbol, resultadoPadrao) {
    window.mod1State = window.mod1State || {};
    window.mod1State[symbol] = {
      percentual: resultadoPadrao.percentual,
      acertos: resultadoPadrao.acertos,
      erros: resultadoPadrao.erros,
      horariosAcertos: resultadoPadrao.horariosAcertos,
      horariosErros: resultadoPadrao.horariosErros
    };
  }

  // --------------------
  // Funções principais (sem UI)
  // --------------------
  function adicionarVelaAoAtivo(symbol, vela) {
    const s = ativosState[symbol];
    if (!s) return;
    const fechamento = parseFloat(vela.fechamento);
    const maxima = parseFloat(vela.maxima ?? vela.fechamento);
    const minima = parseFloat(vela.minima ?? vela.fechamento);
    if (isNaN(fechamento) || isNaN(maxima) || isNaN(minima)) return;

    // se não existir velas ainda, empurra; senão atualiza/empurra conforme lógica de kline
    if (s.velas.length === 0) {
      s.velas.push({
        fechamento,
        maxima,
        minima,
        horario: vela.horario || new Date().toLocaleTimeString()
      });
    } else {
      s.velas[s.velas.length - 1] = {
        fechamento,
        maxima,
        minima,
        horario: vela.horario || new Date().toLocaleTimeString()
      };
    }

    if (s.velas.length > NUM_VELAS) s.velas.shift();

    // recalcula padrao (modo A: tick-a-tick, até vela em formação)
    const resultado = calcularPadraoParaVelas(s.velas, fechamento);

    // atualiza padroes armazenados
    s.padroesAcertos.splice(0, s.padroesAcertos.length, ...resultado.horariosAcertos);
    s.padroesErros.splice(0, s.padroesErros.length, ...resultado.horariosErros);

    // atualiza estado público
    atualizarMod1State(symbol, resultado);
  }

  // Quando vela fecha, empurra de forma definitiva (manter compatibilidade com o que UI fazia)
  function empurrarVelaFechada(symbol, vela) {
    const s = ativosState[symbol];
    if (!s) return;
    const fechamento = parseFloat(vela.fechamento);
    const maxima = parseFloat(vela.maxima ?? vela.fechamento);
    const minima = parseFloat(vela.minima ?? vela.fechamento);
    if (isNaN(fechamento) || isNaN(maxima) || isNaN(minima)) return;

    s.velas.push({
      fechamento,
      maxima,
      minima,
      horario: vela.horario || new Date().toLocaleTimeString()
    });
    if (s.velas.length > NUM_VELAS) s.velas.shift();

    // recalcula padrao baseado no fechamento
    const resultado = calcularPadraoParaVelas(s.velas, fechamento);
    s.padroesAcertos.splice(0, s.padroesAcertos.length, ...resultado.horariosAcertos);
    s.padroesErros.splice(0, s.padroesErros.length, ...resultado.horariosErros);
    atualizarMod1State(symbol, resultado);
  }

  // --------------------
  // Histórico via REST
  // --------------------
  async function carregarVelasIniciaisPara(symbol) {
    try {
      const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1m&limit=${NUM_VELAS}`;
      const res = await fetch(url);
      const data = await res.json();
      const s = ativosState[symbol];
      if (!Array.isArray(data) || !s) return;
      data.forEach(k => {
        s.velas.push({
          fechamento: parseFloat(k[4]),
          maxima: parseFloat(k[2]),
          minima: parseFloat(k[3]),
          horario: new Date(k[0]).toLocaleTimeString()
        });
      });
      // após carregar histórico, recalcula e atualiza mod1State
      const ultimo = s.velas[s.velas.length - 1];
      const resultado = calcularPadraoParaVelas(s.velas, ultimo ? ultimo.fechamento : null);
      s.padroesAcertos.splice(0, s.padroesAcertos.length, ...resultado.horariosAcertos);
      s.padroesErros.splice(0, s.padroesErros.length, ...resultado.horariosErros);
      atualizarMod1State(symbol, resultado);
    } catch (e) {
      console.error(`mod3: Erro ao carregar velas iniciais de ${symbol}:`, e);
    }
  }

  // --------------------
  // WebSocket per pair (1m kline) - modo A (tick a tick)
  // --------------------
  function iniciarPrecoPara(symbol) {
    const s = ativosState[symbol];
    if (!s) return;

    if (s.socket) {
      try { s.socket.close(); } catch (e) { /*ignore*/ }
    }

    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_1m`);
    s.socket = ws;

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        const k = data.k;
        if (!k) return;

        const velaAtual = {
          fechamento: parseFloat(k.c),
          maxima: parseFloat(k.h),
          minima: parseFloat(k.l),
          horario: new Date(k.t).toLocaleTimeString()
        };

        // Se k.x == true -> vela fechou; se false -> vela em formação
        if (k.x) {
          // vela fechou -> empurra como vela fechada
          empurrarVelaFechada(symbol, velaAtual);
        } else {
          // vela em formação -> atualiza último (modo A)
          adicionarVelaAoAtivo(symbol, velaAtual);
        }
      } catch (e) {
        console.error(`mod3 WS ${symbol} error:`, e);
      }
    };

    ws.onclose = () => {
      setTimeout(() => iniciarPrecoPara(symbol), 3000);
    };
    ws.onerror = (e) => {
      console.error(`mod3: Erro WS para ${symbol}:`, e);
    };
  }

  // --------------------
  // Inicialização: carrega histórico e abre sockets
  // --------------------
  (async () => {
    await Promise.all(paresList.map(sym => carregarVelasIniciaisPara(sym)));
    paresList.forEach(sym => iniciarPrecoPara(sym));

    // garante chaves em window.mod1State
    paresList.forEach(sym => {
      if (!window.mod1State[sym]) {
        atualizarMod1State(sym, { acertos: 0, erros: 0, percentual: 0, horariosAcertos: [], horariosErros: [] });
      }
    });
  })();

function atualizarScoreDots() {
  const pares = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'];
  pares.forEach(pair => {
    const scoreEl = document.getElementById(`score-${pair}`);
    if (!scoreEl) return;
    const counts = window.getWinCounts(pair); // já retorna {acertos, erros, percentual}
    scoreEl.textContent = `${counts.acertos}x${counts.erros}`;
  });
}

// Atualiza a cada 1 segundo (ou ajuste conforme quiser)
setInterval(atualizarScoreDots, 1000);

  // --------------------
  // Exposição pública para sinais.js
  // --------------------
  window.getWinRate = function(symbol) {
    try {
      const s = window.mod1State && window.mod1State[symbol];
      return s ? s.percentual || 0 : 0;
    } catch (e) { return 0; }
  };

  window.getWinTotal = function(symbol) {
    try {
      const s = window.mod1State && window.mod1State[symbol];
      if (!s) return 0;
      return (Number(s.acertos || 0) + Number(s.erros || 0));
    } catch (e) { return 0; }
  };

  // Extra útil (debug): retornar counts detalhados
  window.getWinCounts = function(symbol) {
    try {
      const s = window.mod1State && window.mod1State[symbol];
      if (!s) return { acertos: 0, erros: 0, percentual: 0 };
      return { acertos: s.acertos || 0, erros: s.erros || 0, percentual: s.percentual || 0 };
    } catch (e) { return { acertos: 0, erros: 0, percentual: 0 }; }
  };

  // fim do IIFE
})();
