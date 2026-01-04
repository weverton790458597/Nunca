const emailInput = document.getElementById('email');
const senhaInput = document.getElementById('senha');
const entrarBtn = document.getElementById('entrar');
const erro = document.getElementById('erro');
const toggleSenha = document.getElementById('toggleSenha');

// URL do Google Apps Script
const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbx33kwB_uKur1d12uVrWrBPkcEM8m9-NhgL6RTzso9TPGb5wsHWV7S9OrfkAxeiAnnz0g/exec";

// =====================================
// 🔐 VERIFICA LOGIN AO ABRIR A PÁGINA
// =====================================
(function verificarLogin() {
  const auth = JSON.parse(localStorage.getItem('auth'));

  if (auth?.logado) {
    if (auth.ultimaTela === 'bem-vindo') {
      window.location.replace('bem-vindo.html');
    } else if (auth.ultimaTela === 'sinais') {
      window.location.replace('sinais.html');
    }
  }
})();

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
        // Salva estado de login (WEB)
        localStorage.setItem('auth', JSON.stringify({
          logado: true,
          email,
          nome: data.nome || '',
          ultimaTela: 'bem-vindo'
        }));

        window.location.href = 'bem-vindo.html';

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
