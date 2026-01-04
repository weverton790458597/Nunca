document.addEventListener('DOMContentLoaded', () => {
  // Recupera auth do localStorage
  const auth = JSON.parse(localStorage.getItem('auth'));

  // 🔐 BLOQUEIO DE ACESSO DIRETO VIA URL
  if (!auth || !auth.logado) {
    window.location.replace('/login/');
    return;
  }

  // Marca última tela corretamente
  auth.ultimaTela = 'conta';
  localStorage.setItem('auth', JSON.stringify(auth));

  // Exibe nome no header
  const header = document.querySelector('.trade-header');
  if (header) {
    header.textContent = `Bem-vindo ao TradeWR, ${auth.nome || ''}`;
  }

  // Botão iniciar trade
  const iniciarTradeBtn = document.getElementById('iniciarTrade');
  if (iniciarTradeBtn) {
    iniciarTradeBtn.addEventListener('click', () => {
      window.location.href = '/sinais/';
    });
  }
});
