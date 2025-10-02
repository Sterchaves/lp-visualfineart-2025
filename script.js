
  // Carrega a API do YouTube
  var tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  var player;
  function onYouTubeIframeAPIReady() {
    player = new YT.Player('video');
  }

  document.getElementById('videoCover').addEventListener('click', function() {
    this.style.display = 'none'; // Esconde a capa
    player.playVideo(); // Inicia o vídeo
  });



  // FAQ Animation

document.addEventListener('DOMContentLoaded', () => {
  const faqs = Array.from(document.querySelectorAll('.container-faq .faq'));

  // estado inicial: fechado
  faqs.forEach(faq => {
    const answer = faq.querySelector('.answer');
    faq.setAttribute('role', 'button');
    faq.setAttribute('tabindex', '0');
    faq.setAttribute('aria-expanded', 'false');
    answer.style.maxHeight = '0px';
    answer.setAttribute('aria-hidden', 'true');
  });

  // toggle por clique (no bloco, pergunta ou ícone)
  document.querySelector('.container-faq .faqs')?.addEventListener('click', (e) => {
    const faq = e.target.closest('.faq');
    if (faq) toggleFaq(faq);
  });

  // acessível no teclado
  faqs.forEach(faq => {
    faq.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        toggleFaq(faq);
      }
    });
  });

  function setOpenHeight(faq){
    const answer = faq.querySelector('.answer');
    // primeiro zera para medir a altura real atual
    answer.style.maxHeight = '0px';
    // força reflow e mede a nova altura
    const h = answer.scrollHeight;
    answer.style.maxHeight = h + 'px';
  }

  function toggleFaq(faq){
    const answer = faq.querySelector('.answer');
    const isOpen = faq.classList.toggle('open');
    faq.setAttribute('aria-expanded', String(isOpen));
    answer.setAttribute('aria-hidden', String(!isOpen));
    if (isOpen) setOpenHeight(faq);
    else answer.style.maxHeight = '0px';
  }

  // Recalcula alturas dos itens ABERTOS em resize/orientationchange
  const recalcOpen = () => {
    faqs.forEach(faq => {
      if (faq.classList.contains('open')) setOpenHeight(faq);
    });
  };
  let rAF;
  const debounced = () => {
    if (rAF) cancelAnimationFrame(rAF);
    rAF = requestAnimationFrame(recalcOpen);
  };
  window.addEventListener('resize', debounced);
  window.addEventListener('orientationchange', recalcOpen);

  // Opcional: reage a mudanças internas de conteúdo (ex: fontes carregando)
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(debounced);
    faqs.forEach(faq => ro.observe(faq.querySelector('.answer')));
  }
});