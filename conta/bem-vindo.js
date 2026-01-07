document.addEventListener('DOMContentLoaded', () => {
  // ================= 🔐 VERIFICA LOGIN =================
  const auth = JSON.parse(sessionStorage.getItem('auth'));

  if (!auth?.logado) {
    window.location.replace('/login/');
    return;
  }

  // Nome no header
  const header = document.getElementById('userHeader');
  if (header) {
    header.textContent = `Bem-vindo ao TradeWR, ${auth.nome || ''}`;
  }
});


  // ================= Menu Interaction =================
  const menuItems = document.querySelectorAll('.menu-item');
  const sections = document.querySelectorAll('.section');
  const placeholderLogo = document.getElementById('placeholderLogo');

  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      placeholderLogo.style.display = 'none';

      const target = item.dataset.section;
      sections.forEach(sec => {
        sec.style.display = sec.id === target ? 'block' : 'none';
      });
    });
  });

  // ================= Iniciar Trade =================
  const iniciarBtn = document.getElementById('iniciarTrade');
  if (iniciarBtn) {
    iniciarBtn.addEventListener('click', () => {
      window.location.href = '/sinais/';
    });
  }
});

