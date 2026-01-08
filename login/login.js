// ================================
// CONFIGURAÇÕES DE PAGAMENTO
// ================================
const DIA_VENCIMENTO = 6; // Dia fixo de vencimento do mês
const DIAS_AVISO = 3;      // Quantos dias antes do vencimento mostrar aviso

// 🔐 Força login apenas quando acessar o /login diretamente
if (performance.getEntriesByType('navigation')[0].type === 'navigate') {
  sessionStorage.removeItem('auth');
}

const emailInput = document.getElementById('email');
const senhaInput = document.getElementById('senha');
const entrarBtn = document.getElementById('entrar');
const erro = document.getElementById('erro');
const toggleSenha = document.getElementById('toggleSenha');

const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbx33kwB_uKur1d12uVrWrBPkcEM8m9-NhgL6RTzso9TPGb5wsHWV7S9OrfkAxeiAnnz0g/exec";

// =====================================
// 🚀 FUNÇÃO DE LOGIN
// =====================================
function validarLogin() {
  const email = emailInput.value.trim();
  const senha = senhaInput.value.trim();
  erro.textContent = '';

  if (!email || !senha) {
    erro.textContent = 'Preencha e-mail e senha';
    return;
  }

  const url = `${SHEET_API_URL}?email=${encodeURIComponent(email)}&senha=${encodeURIComponent(senha)}`;
  console.log('Chamando:', url);

  fetch(url)
    .then(res => res.json())
    .then(data => {
      console.log('Resposta AppScript:', data);

      if (data?.success) {
        // Salva sessão
        sessionStorage.setItem('auth', JSON.stringify({
          logado: true,
          email,
          nome: data.nome || ''
        }));

        // Checa dias para vencimento
        const diffDias = calcularDiasParaVencimento();

          // NOVO: verifica status do usuário
  const status = data.status || ""; // vindo da coluna E do App Script
  if (status.toLowerCase() === "bloqueado") {
    mostrarBloqueioTotal();
    return; // sai do login, não vai pros sinais
  }

        if (diffDias < 0) {
          // Passou do vencimento → bloqueio total
          mostrarBloqueioTotal();
        } else if (diffDias <= DIAS_AVISO) {
          // Próximos DIAS_AVISO dias → aviso
          mostrarAvisoPagamento(diffDias);
        } else {
          // Fora do período → vai direto
          window.location.href = '/sinais/';
        }

      } else {
        erro.textContent = 'E-mail ou senha inválidos';
      }
    })
    .catch(err => {
      console.error('Erro fetch ->', err);
      erro.textContent = 'Erro ao validar login';
    });
}

// ================================
// Função que calcula dias para o vencimento fixo
// ================================
function calcularDiasParaVencimento() {
  const hoje = new Date();
  let venc = new Date(hoje.getFullYear(), hoje.getMonth(), DIA_VENCIMENTO);

  // Se hoje já passou do dia do mês, considera próximo mês
  if (hoje.getDate() > DIA_VENCIMENTO) {
    venc = new Date(hoje.getFullYear(), hoje.getMonth() + 1, DIA_VENCIMENTO);
  }

  const diff = Math.ceil((venc - hoje) / (1000 * 60 * 60 * 24));
  return diff;
}

// ================================
// Overlay de aviso antes do vencimento
// ================================
function mostrarAvisoPagamento(diffDias) {
  const overlay = document.createElement('div');
  overlay.id = 'overlayPagamento';
  overlay.innerHTML = `
    <div class="overlay-content">
      <h2>⚠️ Atenção ao vencimento</h2>
      <p>Seu acesso vence em ${diffDias} dia(s). Realize o pagamento para não ficar inadimplente.</p>
      <p class="observacao">Caso já tenha realizado o pagamento, ignore esta mensagem.</p>
      <div class="botoes">
        <a href="https://linkfixo.com/mercadopago" target="_blank" class="btn-pagar">Pagar agora</a>
        <button id="continuarBtn" class="btn-continuar">Continuar</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Botão continuar fecha overlay e vai pra tela
  document.getElementById('continuarBtn').addEventListener('click', () => {
    overlay.remove();
    window.location.href = '/sinais/';
  });
}

// ================================
// Overlay de bloqueio total após vencimento
// ================================
function mostrarBloqueioTotal() {
  const overlay = document.createElement('div');
  overlay.id = 'overlayPagamento';
  overlay.innerHTML = `
    <div class="overlay-content">
      <h2>⚠️ Acesso Bloqueado</h2>
      <p>Seu acesso expirou. Realize o pagamento para continuar usando a plataforma.</p>
      <p class="observacao">Caso já tenha realizado o pagamento, contate o suporte.</p>
      <div class="botoes">
        <a href="https://linkfixo.com/mercadopago" target="_blank" class="btn-pagar">Pagar agora</a>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden'; // bloqueia scroll
}

// =====================================
// 🎯 LISTENERS
// =====================================
entrarBtn.addEventListener('click', validarLogin);

emailInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') senhaInput.focus();
});

senhaInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') validarLogin();
});

toggleSenha.addEventListener('click', () => {
  senhaInput.type = senhaInput.type === 'password' ? 'text' : 'password';
});


