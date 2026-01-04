// Reseta o "logado" sempre que o Chrome iniciar ou extensão for instalada/atualizada
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.remove('logado');
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.remove('logado');
});

// Listener preparado para mensagens futuras de Estratégia BB ou pop-up
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.tipo === 'EstrBBStatus') {
    console.log('Status recebido no background:', msg.payload || msg);
  }
});

// 🔹 Configuração do painel lateral
(async () => {
  try {
    // Define o painel lateral padrão
    await chrome.sidePanel.setOptions({
      path: 'sinais.html',
      enabled: true
    });

    // Define comportamento: abre quando clicar no ícone da extensão
    await chrome.sidePanel.setPanelBehavior({
      openPanelOnActionClick: true
    });

    console.log('Side panel configurado com sucesso!');
  } catch (error) {
    console.error('Erro ao configurar side panel:', error);
  }
})();
