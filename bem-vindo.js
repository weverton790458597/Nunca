document.addEventListener('DOMContentLoaded', () => {
  // Marca que estamos na tela de bem-vindo
  chrome.storage.local.set({ ultimaTela: 'bem-vindo' });

  // Checa se está logado e pega o nome
  chrome.storage.local.get(['logado', 'nome'], ({ logado, nome }) => {
    if (!logado) {
      window.location.replace('login.html');
    } else {
      // Exibe o nome no header
      const header = document.querySelector('.trade-header');
      if (header) {
        header.textContent = `Bem-vindo ao TradeWR, ${nome}`;
      }
    }
  });

  const iniciarTradeBtn = document.getElementById('iniciarTrade');
  if (iniciarTradeBtn) {
    iniciarTradeBtn.addEventListener('click', () => {
      window.location.href = 'sinais.html';
    });
  }
});
