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

  fetch(`${SHEET_API_URL}?email=${encodeURIComponent(email)}&senha=${encodeURIComponent(senha)}`)
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

        // Verifica vencimento
        if (data.proxVencimento) {
          mostrarAvisoPagamento(data.proxVencimento);
        } else {
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

// =====================================
// ⚠️ OVERLAY DE PAGAMENTO
// =====================================
function mostrarAvisoPagamento(proxVencimento) {
  const hoje = new Date();
  const venc = new Date(proxVencimento);
  const diffDias = Math.ceil((venc - hoje) / (1000 * 60 * 60 * 24));

  if (diffDias <= 3 && diffDias >= 0) {
    // Cria overlay
    const overlay = document.createElement('div');
    overlay.id = 'overlayPagamento';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = 'rgba(0,0,0,0.6)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '9999';

    overlay.innerHTML = `
      <div class="overlay-content" style="background:#fff;padding:20px;border-radius:10px;max-width:400px;text-align:center;">
        <h2>⚠️ Atenção ao vencimento</h2>
        <p>Seu acesso vence em ${diffDias} dia(s). Realize o pagamento para não ficar inadimplente.</p>
        <p style="font-size:12px;color:#555;">Caso já tenha realizado o pagamento, ignore esta mensagem.</p>
        <div class="botoes" style="margin-top:20px;">
          <a href="https://linkfixo.com/mercadopago" target="_blank" style="margin-right:10px;padding:10px 20px;background:#28a745;color:#fff;border-radius:5px;text-decoration:none;">Pagar agora</a>
          <button id="continuarBtn" style="padding:10px 20px;background:#007bff;color:#fff;border:none;border-radius:5px;cursor:pointer;">Continuar</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('continuarBtn').addEventListener('click', () => {
      overlay.remove();
      window.location.href = '/sinais/';
    });

  } else {
    window.location.href = '/sinais/';
  }
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
