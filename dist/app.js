(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const i18n = PumpkinVolleyI18n;
  const t = (key, params) => i18n.t(key, params);
  const game = new PumpkinVolleyEngine.Game();
  const renderer = new PumpkinVolleyRenderer($('game'));
  const input = { left: false, right: false, jump: false, down: false, attack: false };
  const mobileMedia = matchMedia('(max-width: 760px), (pointer: coarse)');
  let mobileMode = mobileMedia.matches;
  const updateMobileMode = () => { mobileMode = mobileMedia.matches; document.body.classList.toggle('mobile-mode', mobileMode); };
  mobileMedia.addEventListener('change', updateMobileMode);
  updateMobileMode();
  const keyMap = { KeyA: 'left', KeyD: 'right', KeyW: 'jump', KeyS: 'down', Space: 'attack' };
  const overlays = ['start-overlay', 'pause-overlay', 'round-overlay', 'end-overlay'];
  let immersive = false, changingFullscreen = false, pageScroll = 0;
  function updateFullscreenLabel() {
    const key = immersive ? 'exitFullscreen' : 'fullscreen';
    $('fullscreen-btn').setAttribute('aria-label', t(key));
    $('fullscreen-btn').title = t(key);
    $('fullscreen-btn').setAttribute('aria-pressed', String(immersive));
    $('fullscreen-btn').innerHTML = immersive
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8h5V3m8 0v5h5M8 21v-5H3m18 0h-5v5"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg>';
  }
  function setImmersive(value) {
    if (value && !immersive) pageScroll = window.scrollY;
    immersive = value;
    document.body.classList.toggle('fullscreen-play', value);
    updateFullscreenLabel();
    if (!value) window.scrollTo(0, pageScroll);
  }
  async function enterFullscreen() {
    setImmersive(true); changingFullscreen = true;
    try {
      // Use the same play area for native fullscreen and the viewport fallback.
      if (document.fullscreenEnabled && !document.fullscreenElement && $('play-area').requestFullscreen) await $('play-area').requestFullscreen();
    } catch { /* Some phone browsers expose only the in-page fullscreen layout. */ }
    finally { changingFullscreen = false; $('game').focus({ preventScroll: true }); }
  }
  async function exitFullscreen() {
    changingFullscreen = true;
    try { if (document.fullscreenElement) await document.exitFullscreen(); } catch { /* Keep the exit button usable. */ }
    finally { setImmersive(false); changingFullscreen = false; }
  }
  // An OS fullscreen exit keeps the phone-friendly viewport layout until its exit button is tapped.
  document.addEventListener('fullscreenchange', updateFullscreenLabel);
  $('fullscreen-btn').addEventListener('click', () => immersive ? exitFullscreen() : enterFullscreen());
  function updateHolidayCountdown() {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const date = Object.fromEntries(parts.filter(p => p.type !== 'literal').map(p => [p.type, Number(p.value)]));
    const today = Date.UTC(date.year, date.month - 1, date.day);
    let halloween = Date.UTC(date.year, 9, 31);
    if (today > halloween) halloween = Date.UTC(date.year + 1, 9, 31);
    $('holiday-days').textContent = Math.round((halloween - today) / 86400000);
  }
  updateHolidayCountdown();
  setInterval(updateHolidayCountdown, 60000);
  let audioContext, muted = false, lastFrame = performance.now(), lastState = '', lastStatus = '', lastScore = '', toastUntil = 0, toastInfo;
  let announcement = () => t('status_ready');

  function sound(type) {
    if (muted || !audioContext || audioContext.state !== 'running') return;
    const now = audioContext.currentTime;
    const notes = { hit: [310, 470], point: [440, 620], win: [440, 550, 660], loss: [240, 180], countdown: [190], explosion: [85, 55, 40], celebration: [440, 554, 659, 880] }[type];
    if (!notes) return;
    notes.forEach((frequency, i) => {
      const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
      oscillator.type = type === 'explosion' ? 'triangle' : 'sine'; oscillator.frequency.setValueAtTime(frequency, now + i * .095);
      gain.gain.setValueAtTime(0, now + i * .095); gain.gain.linearRampToValueAtTime(type === 'explosion' ? .12 : .045, now + i * .095 + .01); gain.gain.exponentialRampToValueAtTime(.0001, now + i * .095 + .2);
      oscillator.connect(gain).connect(audioContext.destination); oscillator.start(now + i * .095); oscillator.stop(now + i * .095 + .22);
    });
  }

  function unlockAudio() {
    try { audioContext ||= new (window.AudioContext || window.webkitAudioContext)(); if (audioContext.state === 'suspended') audioContext.resume().catch(() => {}); } catch { /* Audio is optional; game input remains available. */ }
  }

  function clearInput() { Object.keys(input).forEach(k => { input[k] = false; }); document.querySelectorAll('.held').forEach(el => el.classList.remove('held')); }
  function announce(key, params) { announcement = () => t(key, params); $('announcer').textContent = announcement(); }
  function showOnly(id) { overlays.forEach(name => $(name).classList.toggle('hidden', id !== name)); }
  function renderToast() {
    if (!toastInfo) return;
    const { title, subtitle, params } = toastInfo;
    $('toast').replaceChildren(document.createTextNode(t(title, params)));
    if (subtitle) { const small = document.createElement('small'); small.textContent = t(subtitle, params); $('toast').append(small); }
  }
  function toast(title, subtitle = '', params = {}, duration = 1.2) {
    toastInfo = { title, subtitle, params }; renderToast();
    $('toast').classList.remove('hidden'); toastUntil = game.time + duration;
    announcement = () => `${t(title, params)} ${subtitle ? t(subtitle, params) : ''}`;
    $('announcer').textContent = announcement();
  }
  function updateActionLabels() {
    $('pause-btn').setAttribute('aria-label', t(game.paused ? 'resume' : 'pause'));
    $('sound-btn').setAttribute('aria-label', t(muted ? 'soundOn' : 'soundOff'));
    updateFullscreenLabel();
  }

  function start(restart = false) {
    if (mobileMode && !immersive) enterFullscreen();
    unlockAudio(); clearInput();
    if (restart) { game.restart(); renderer.reset(); lastState = ''; lastScore = ''; }
    game.start(); showOnly(null); $('pause-btn').disabled = false;
    $('pause-btn').setAttribute('aria-label', t('pause'));
    $('pause-btn').innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>';
    $('game').focus({ preventScroll: true });
    $('toast').classList.add('hidden'); $('fuse-caption').classList.add('hidden');
    lastFrame = performance.now(); announce('announceStart');
  }

  function pause(value) {
    if (['ready', 'roundEnd', 'celebration'].includes(game.state)) return;
    game.pause(value); clearInput(); showOnly(value ? 'pause-overlay' : null);
    $('pause-btn').setAttribute('aria-label', t(value ? 'resume' : 'pause'));
    $('pause-btn').innerHTML = value ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 10 7-10 7V5Z"/></svg>' : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>';
    if (!value) { $('game').focus({ preventScroll: true }); lastFrame = performance.now(); }
    else $('resume-btn').focus({ preventScroll: true });
    announce(value ? 'announcePause' : 'announceResume');
  }

  $('start-btn').addEventListener('click', () => start());
  $('replay-btn').addEventListener('click', () => start(true));
  $('restart-btn').addEventListener('click', () => { game.pause(false); start(true); });
  $('resume-btn').addEventListener('click', () => pause(false));
  $('next-round-btn').addEventListener('click', () => {
    unlockAudio(); clearInput();
    if (game.continueNextRound()) {
      showOnly(null); $('pause-btn').disabled = false;
      $('toast').classList.add('hidden'); toastUntil = 0;
      $('game').focus({ preventScroll: true }); lastFrame = performance.now();
    }
  });
  $('pause-btn').addEventListener('click', () => pause(!game.paused));
  $('sound-btn').addEventListener('click', () => {
    unlockAudio(); muted = !muted;
    $('sound-btn').setAttribute('aria-pressed', String(muted)); $('sound-btn').setAttribute('aria-label', t(muted ? 'soundOn' : 'soundOff'));
    $('sound-icon').innerHTML = muted ? '<path d="m11 5-6 4H2v6h3l6 4V5Zm5 4 6 6m0-6-6 6"/>' : '<path d="m11 5-6 4H2v6h3l6 4V5Zm5 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>';
    if (!game.paused && !['ready', 'celebration'].includes(game.state)) $('game').focus({ preventScroll: true });
  });
  $('language-select').addEventListener('change', event => i18n.setLanguage(event.target.value));
  document.addEventListener('pumpkin-language-change', () => {
    clearInput(); lastScore = ''; lastStatus = '';
    updateActionLabels(); updateUI(); renderToast(); $('announcer').textContent = announcement();
    if (!game.paused && !['ready', 'celebration'].includes(game.state)) $('game').focus({ preventScroll: true });
  });

  document.addEventListener('keydown', e => {
    if (e.code === 'Escape' && immersive) { e.preventDefault(); if (!e.repeat) exitFullscreen(); return; }
    if (e.code === 'Escape' || e.code === 'KeyP') { e.preventDefault(); if (!e.repeat) pause(!game.paused); return; }
    const key = keyMap[e.code];
    if (!key || ['ready', 'roundEnd', 'celebration'].includes(game.state) || game.paused) return;
    if (e.target.closest?.('button,a,input,textarea,select')) return;
    e.preventDefault(); input[key] = true;
  });
  document.addEventListener('keyup', e => { if (keyMap[e.code]) input[keyMap[e.code]] = false; });
  // A lost keyboard focus must never leave the character running or skip the finale.
  window.addEventListener('blur', () => { clearInput(); if (!changingFullscreen && game.state !== 'ready' && game.state !== 'celebration') pause(true); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { clearInput(); pause(true); } });
  document.querySelectorAll('[data-key]').forEach(button => {
    button.addEventListener('pointerdown', e => { e.preventDefault(); button.setPointerCapture(e.pointerId); input[button.dataset.key] = true; button.classList.add('held'); unlockAudio(); });
    const release = () => { input[button.dataset.key] = false; button.classList.remove('held'); };
    button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release); button.addEventListener('lostpointercapture', release);
    button.addEventListener('contextmenu', e => e.preventDefault());
  });

  function handleEvents() {
    for (const event of game.events.splice(0)) {
      renderer.event(event); sound(event.type);
      if (event.type === 'point') {
        if (event.roundWin) toast(event.streak === 3 ? 'toastFinal' : 'toastWin', event.streak === 3 ? 'toastFinalHint' : 'toastWinHint', { count: event.streak, remaining: 3 - event.streak }, 2);
        else if (event.roundLoss) toast('toastLoss', 'toastLossHint', {}, 2);
        else toast(event.actor === 'player' ? 'toastPlayerPoint' : 'toastGhostPoint', 'pointScore', { player: event.playerPoints, ghost: event.ghostPoints });
        if (game.state === 'roundEnd') {
          clearInput(); $('toast').classList.add('hidden'); toastUntil = 0;
          showOnly('round-overlay'); $('pause-btn').disabled = true;
          $('next-round-btn').focus({ preventScroll: true });
        }
      }
      if (event.type === 'serve') { $('toast').classList.add('hidden'); toastUntil = 0; }
      if (event.type === 'countdown') { $('fuse-caption').classList.remove('hidden'); $('fuse-number').textContent = Math.max(1, event.remaining); announce('announceCountdown', { remaining: event.remaining }); }
      if (event.type === 'explosion') { $('fuse-caption').classList.add('hidden'); $('toast').classList.add('hidden'); announce('announceExplosion'); }
      if (event.type === 'celebration') { showOnly('end-overlay'); $('end-hits').textContent = game.totalHits; $('pause-btn').disabled = true; $('replay-btn').focus({ preventScroll: true }); announce('announceCelebration'); }
    }
  }

  function updateUI() {
    document.body.classList.toggle('is-playing', !['ready', 'roundEnd', 'celebration'].includes(game.state) && !game.paused);
    // Read-only DOM diagnostics help verify real keyboard input in a browser.
    $('game').dataset.state = game.state;
    $('game').dataset.playerX = game.player.x.toFixed(1);
    $('game').dataset.playerY = game.player.y.toFixed(1);
    $('game').dataset.hits = game.totalHits;
    $('game').dataset.difficulty = game.difficulty;
    $('game').dataset.touchAssist = String(mobileMode);
    $('game').dataset.playerAttack = String(game.player.attack > 0);
    const choosingServe = game.state === 'serve' && game.servingActor === 'player';
    $('serve-hint').classList.toggle('hidden', !choosingServe || game.paused);
    if (choosingServe) $('serve-hint').textContent = t(input.left || input.right ? 'choosingServe' : 'chooseServe', { seconds: Math.max(1, Math.ceil(game.remainingServe)) });
    if (game.state === 'roundEnd') {
      $('round-result').textContent = t(game.lastRoundWinner === 'player' ? 'roundWon' : 'roundLost');
      $('round-summary').textContent = t('roundSummary', { ghost: game.ghostPoints, player: game.playerPoints, count: game.streak });
    }
    $('ai-level').textContent = `AI ${game.difficulty}/3`;
    const score = `${game.playerPoints}/${game.ghostPoints}/${game.streak}/${game.round}/${i18n.language}`;
    if (score !== lastScore) {
      $('player-score').textContent = game.playerPoints; $('ghost-score').textContent = game.ghostPoints;
      $('round-label').textContent = t('round', { round: String(game.round).padStart(2, '0') });
      $('streak-text').textContent = t('streak', { count: game.streak });
      $('streak-pips').setAttribute('aria-label', t('streakAria', { count: game.streak }));
      [...$('streak-pips').children].forEach((el, i) => { el.classList.toggle('active', i < game.streak); });
      lastScore = score;
    }
    $('best-rally').textContent = String(game.bestRally).padStart(2, '0');
    const status = t(mobileMode && game.state === 'playing' && !game.paused ? 'status_mobilePlaying' : `status_${game.paused ? 'paused' : game.state}`);
    if (status !== lastStatus) { $('game-status').textContent = status; lastStatus = status; }
    if (game.state !== lastState) { if (game.state === 'countdown') $('toast').classList.add('hidden'); lastState = game.state; }
    if (toastUntil && game.time > toastUntil) { $('toast').classList.add('hidden'); toastUntil = 0; }
  }

  function frame(now) {
    const dt = Math.max(0, Math.min(.05, (now - lastFrame) / 1000)); lastFrame = now;
    // Phones only ask for left/right movement; nearby hits and high-ball jumps are automatic.
    const autoJump = mobileMode && game.ball.x > PumpkinVolleyEngine.CONFIG.netX &&
      Math.abs(game.ball.x - game.player.x) < 105 && game.ball.vy > 60 && game.ball.y < game.player.y - 105;
    const gameplayInput = mobileMode ? { ...input, attack: true, jump: input.jump || autoJump } : input;
    game.step(dt, gameplayInput); handleEvents(); updateUI(); renderer.render(game, dt); requestAnimationFrame(frame);
  }
  updateActionLabels(); updateUI();
  requestAnimationFrame(frame);
  // Keep the rolling pumpkin visible while the actual character images decode.
  const readyImages = [...Object.values(renderer.images), renderer.ghostImage];
  const assetsReady = Promise.all(readyImages.map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise(resolve => { img.addEventListener('load', resolve, { once: true }); img.addEventListener('error', resolve, { once: true }); });
  }));
  Promise.all([assetsReady, new Promise(resolve => setTimeout(resolve, 900))]).then(() => {
    $('loading-screen').classList.add('leaving');
    setTimeout(() => $('loading-screen').classList.add('hidden'), 260);
  });
})();
