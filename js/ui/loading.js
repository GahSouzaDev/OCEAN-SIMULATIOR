export function runLoadingScreen(onDone) {
  const loadingBar = document.getElementById('loading-bar-fill');
  const loadingScreen = document.getElementById('loading-screen');
  let loadProgress = 0;
  const loadInterval = setInterval(() => {
    loadProgress += Math.random() * 30;
    if (loadProgress >= 100) { loadProgress = 100; clearInterval(loadInterval); }
    loadingBar.style.width = loadProgress + '%';
    if (loadProgress >= 100) {
      setTimeout(() => {
        loadingScreen.classList.add('hide');
        document.querySelectorAll('.hud-panel').forEach((el, i) => {
          setTimeout(() => el.classList.add('show'), 300 + i * 120);
        });
        document.getElementById('intro-hint').classList.add('show');
        setTimeout(() => loadingScreen.style.display = 'none', 1100);
        if (onDone) onDone();
      }, 400);
    }
  }, 200);
}