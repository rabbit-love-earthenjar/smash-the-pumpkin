(function (root) {
  'use strict';
  // Offline text only: no network, dependencies or gameplay state in the language pack.
  const translations = {
    zh: {
      difficultyHint: '连胜后难度逐局提高',
      countdownLabel: '距离万圣节', countdownUnit: '天',
      title: '打爆南瓜', documentTitle: '打爆南瓜 · 京都万圣夜',
      description: '和小幽灵对打南瓜排球。ADWS移动，空格挥击，每局先得3分，连续赢3局解锁惊喜。',
      home: '打爆南瓜 首页', language: '选择语言', subtitle: '万圣夜小游戏', edition: '京都夜神社', halloween: '万圣夜番外',
      eyebrow: '京都夜神社 · 万圣夜番外', intro: '一只小狐狸，一只小幽灵，还有一颗不太安分的南瓜。',
      challenge: '连赢三局，解锁惊喜。', challengeHint: '小心，最后的南瓜有点「爆」脾气。',
      gameLabel: '打爆南瓜小游戏', streakLabel: '连胜', scoreboard: '本局比分', fox: '小狐狸', ghost: '小幽灵',
      soundOn: '开启声音', soundOff: '关闭声音', soundToggle: '声音开关', pause: '暂停游戏', resume: '继续游戏', pauseTip: '暂停 / Esc',
      canvasLabel: '打爆南瓜球场。A向左，D向右，W跳跃，S快速下落，空格挥击，Esc暂停。每局先得3分，连续赢3局解锁结局。',
      canvasFallback: '你的浏览器需要支持 Canvas 才能游玩。', courtyard: '神社庭院', location: '京都 · 万圣夜',
      startTag: '不给糖，就再接一球。', startHint: '把南瓜打过网，别让它落在你这边。', start: '开始对打',
      rules: '每局先得 3 分 · 连赢 3 局过关 · 输局重算连胜', pauseTag: '歇一小会儿', pauseTitle: '幽灵也要歇一歇。',
      pauseHint: '准备好就继续，南瓜等着你。', continue: '继续对打', restart: '重新挑战',
      fuseCaption: '咦，南瓜怎么开始倒计时了？', endTag: '三连胜，一份甜蜜惊喜。', endHint: '南瓜炸成了糖果，今晚的快乐归你啦。',
      endStreak: '连胜达成', endHits: '次精彩回击', replay: '再来一场', bestRally: '最长回合',
      controlsLabel: '操作说明', controlsTag: '怎么玩', controlsHeading: '一点默契，一点捣蛋。', movement: '移动 & 跳跃',
      movementHint: 'A / D 左右 · W 跳跃 · S 快速下落', attackLabel: '挥击南瓜', attackHint: '按住空格连续挥击，靠近南瓜就能回球',
      ruleNote: '连赢三局，收下万圣节惊喜', touchLabel: '触屏操作', left: '向左移动', right: '向右移动', jump: '跳跃', down: '快速下落', touchAttack: '按住挥击',
      footer: '京都夜神社 × 万圣夜小游戏', footerWish: '祝你度过一个「鬼」开心的夜晚',
      round: '第 {round} 局', streak: '{count} / 3 连胜', streakAria: '当前{count}连胜',
      toastFinal: '三连胜！南瓜好像有点不对劲……', toastFinalHint: '准备收下你的万圣节惊喜。',
      toastWin: '{count} 连胜！继续捣蛋。', toastWinHint: '再赢 {remaining} 局，解锁惊喜。',
      toastLoss: '这一局，小幽灵赢啦。', toastLossHint: '连胜归零，再试一次就好。', toastPlayerPoint: '漂亮！你得一分。',
      toastGhostPoint: '哎呀，小幽灵得分。', pointScore: '{ghost} : {player} · 先得 3 分赢下本局',
      announceStart: '比赛开始。A D左右移动，W跳跃，S快速下落，空格挥击。每局先得3分，连赢3局过关。',
      announcePause: '游戏已暂停。', announceResume: '游戏继续。', announceCountdown: '南瓜炸弹倒计时，{remaining}。',
      announceExplosion: '南瓜爆炸，糖果飞出来啦！', announceCelebration: '三连胜达成！happy hallow day。',
      status_ready: '小幽灵已就位，等你开球。', status_serve: '准备开球！看好南瓜的落点。',
      status_playing: '接住，起跳，挥击！空中回击会打得更快。', status_point: '短暂休息，下一球马上开始。',
      status_countdown: '三连胜达成！咦，南瓜的引线亮起来了……', status_explosion: '砰！是一场糖果雨。',
      status_celebration: 'happy hallow day · 今晚的快乐归你啦。', status_paused: '已暂停 · 按 Esc 或「继续对打」返回球场。'
    },
    ja: {
      difficultyHint: '連勝すると難易度が上がります',
      countdownLabel: 'ハロウィンまで', countdownUnit: '日',
      title: 'かぼちゃスマッシュ', documentTitle: 'かぼちゃスマッシュ · 京都ハロウィン',
      description: '小さなオバケとカボチャバレー！ADWSで移動、スペースでアタック。各ゲーム3点先取、3連勝でサプライズ。',
      home: 'かぼちゃスマッシュ ホーム', language: '言語を選択', subtitle: 'ハロウィン・ミニゲーム', edition: '京都夜神社', halloween: 'ハロウィン編',
      eyebrow: '京都夜神社 · ハロウィン編', intro: '小さなキツネとオバケ、そして落ち着きのないカボチャ。',
      challenge: '3連勝でサプライズ。', challengeHint: '最後のカボチャは、ちょっぴり爆発的。',
      gameLabel: 'かぼちゃスマッシュのゲーム画面', streakLabel: '連勝', scoreboard: '現在のスコア', fox: 'キツネ', ghost: 'オバケ',
      soundOn: '音をオン', soundOff: '音をオフ', soundToggle: 'サウンド切替', pause: '一時停止', resume: 'ゲーム再開', pauseTip: '一時停止 / Esc',
      canvasLabel: 'Aで左、Dで右、Wでジャンプ、Sで急降下、スペースでアタック、Escで一時停止。各ゲーム3点先取、3連勝でエンディング。',
      canvasFallback: 'プレイにはCanvas対応ブラウザーが必要です。', courtyard: '神社の庭', location: '京都 · ハロウィン',
      startTag: 'お菓子か、もう一球か。', startHint: 'カボチャをネットの向こうへ。自分のコートに落とさないで！', start: '対戦スタート',
      rules: '各ゲーム3点先取 · 3連勝でクリア · 負けると連勝リセット', pauseTag: 'ちょっとひと休み', pauseTitle: 'オバケもひと休み。',
      pauseHint: '準備ができたら、また一緒に遊ぼう。', continue: '対戦を再開', restart: '最初から挑戦',
      fuseCaption: 'あれ、カボチャがカウントダウンを始めた？', endTag: '3連勝と、甘いサプライズ。', endHint: 'カボチャがお菓子に大変身。楽しい夜を！',
      endStreak: '連勝達成', endHits: '回のナイスレシーブ', replay: 'もう一度遊ぶ', bestRally: '最長ラリー',
      controlsLabel: '操作方法', controlsTag: '遊び方', controlsHeading: '息を合わせて、ちょっといたずら。', movement: '移動とジャンプ',
      movementHint: 'A / D 左右 · W ジャンプ · S 急降下', attackLabel: 'カボチャをアタック', attackHint: 'スペース長押しで連続アタック。近づいて打ち返そう',
      ruleNote: '3連勝でハロウィンのサプライズ', touchLabel: 'タッチ操作', left: '左へ移動', right: '右へ移動', jump: 'ジャンプ', down: '急降下', touchAttack: '長押しアタック',
      footer: '京都夜神社 × ハロウィン・ミニゲーム', footerWish: 'オバケと過ごす、とびきり楽しい夜に',
      round: '第 {round} ゲーム', streak: '{count} / 3 連勝', streakAria: '現在{count}連勝',
      toastFinal: '3連勝！カボチャの様子が……？', toastFinalHint: 'ハロウィンのサプライズをどうぞ。',
      toastWin: '{count}連勝！その調子！', toastWinHint: 'あと{remaining}ゲーム勝てばサプライズ。',
      toastLoss: 'このゲームはオバケの勝ち。', toastLossHint: '連勝リセット。もう一度チャレンジ！', toastPlayerPoint: 'ナイス！あなたの得点。',
      toastGhostPoint: 'あっ、オバケの得点。', pointScore: '{ghost} : {player} · 3点先取で勝利',
      announceStart: '対戦開始。A Dで左右移動、Wでジャンプ、Sで急降下、スペースでアタック。各ゲーム3点先取、3連勝でクリア。',
      announcePause: 'ゲームを一時停止しました。', announceResume: 'ゲームを再開しました。', announceCountdown: 'カボチャ爆弾のカウントダウン、{remaining}。',
      announceExplosion: 'カボチャがはじけて、お菓子が飛び出した！', announceCelebration: '3連勝達成！happy hallow day。',
      status_ready: 'オバケは準備OK。さあ、始めよう。', status_serve: 'サーブの準備！カボチャの落ちる場所を見よう。',
      status_playing: '受けて、跳んで、アタック！空中なら速い球に。', status_point: 'ひと息ついたら、次のサーブ。',
      status_countdown: '3連勝達成！カボチャの導火線が光り始めた……', status_explosion: 'ポン！お菓子の雨だ。',
      status_celebration: 'happy hallow day · 楽しい夜を！', status_paused: '一時停止中 · Escか「対戦を再開」でコートへ。'
    },
    en: {
      difficultyHint: 'Difficulty rises after each game won',
      countdownLabel: 'HALLOWEEN IN', countdownUnit: 'DAYS',
      title: 'Smash the Pumpkin', documentTitle: 'Smash the Pumpkin · Kyoto Halloween',
      description: 'Play pumpkin volleyball against a Little Ghost. ADWS to move, Space to hit. First to 3 points; win 3 games in a row for a surprise.',
      home: 'Smash the Pumpkin home', language: 'Choose language', subtitle: 'A LITTLE HALLOWEEN GAME', edition: 'KYOTO NIGHT SHRINE', halloween: 'HALLOWEEN EDITION',
      eyebrow: 'KYOTO NIGHT SHRINE · HALLOWEEN', intro: 'A little fox, a little ghost, and one very restless pumpkin.',
      challenge: 'Win 3 in a row. Unlock a surprise.', challengeHint: 'The final pumpkin has an explosive personality.',
      gameLabel: 'Smash the Pumpkin game', streakLabel: 'WIN STREAK', scoreboard: 'Current game score', fox: 'Little Fox', ghost: 'Little Ghost',
      soundOn: 'Turn sound on', soundOff: 'Turn sound off', soundToggle: 'Toggle sound', pause: 'Pause game', resume: 'Resume game', pauseTip: 'Pause / Esc',
      canvasLabel: 'A left, D right, W jump, S fast fall, Space hit, Esc pause. First to 3 points wins a game. Win 3 games in a row to unlock the ending.',
      canvasFallback: 'Your browser needs Canvas support to play.', courtyard: 'SHRINE COURTYARD', location: 'KYOTO · HALLOWEEN',
      startTag: 'TRICK, TREAT & ONE MORE HIT.', startHint: 'Hit the pumpkin over the net. Keep it off your side!', start: 'Start playing',
      rules: 'First to 3 points · Win 3 games in a row · A loss resets your streak', pauseTag: 'TAKE A LITTLE BREATHER', pauseTitle: 'Ghosts need a break, too.',
      pauseHint: 'The pumpkin can wait. Come back when you are ready.', continue: 'Keep playing', restart: 'Start over',
      fuseCaption: 'Wait… why is the pumpkin counting down?', endTag: 'THREE WINS. ONE SWEET SURPRISE.', endHint: 'The pumpkin burst into candy. Enjoy your Halloween night!',
      endStreak: 'wins in a row', endHits: 'great returns', replay: 'Play again', bestRally: 'BEST RALLY',
      controlsLabel: 'Game controls', controlsTag: 'HOW TO PLAY', controlsHeading: 'A little teamwork. A little mischief.', movement: 'Move & jump',
      movementHint: 'A / D move · W jump · S fast fall', attackLabel: 'Hit the pumpkin', attackHint: 'Hold Space to swing. Get close to return the pumpkin.',
      ruleNote: 'Win 3 in a row for a Halloween surprise', touchLabel: 'Touch controls', left: 'Move left', right: 'Move right', jump: 'Jump', down: 'Fast fall', touchAttack: 'Hold · Hit',
      footer: 'KYOTO NIGHT SHRINE × A LITTLE AFTER-DARK FUN', footerWish: 'MADE FOR A BOO-TIFUL NIGHT',
      round: 'GAME {round}', streak: '{count} / 3 wins', streakAria: 'Current streak: {count}',
      toastFinal: 'Three wins! That pumpkin looks suspicious…', toastFinalHint: 'Your Halloween surprise is on its way.',
      toastWin: '{count} in a row! Keep it up.', toastWinHint: 'Win {remaining} more games for a surprise.',
      toastLoss: 'The Little Ghost wins this game.', toastLossHint: 'Streak reset. Give it another try!', toastPlayerPoint: 'Nice! Your point.',
      toastGhostPoint: 'Oops, a point for the ghost.', pointScore: '{ghost} : {player} · First to 3 wins this game',
      announceStart: 'Game started. A D to move, W to jump, S to fall fast, Space to hit. First to 3 points; win 3 games in a row.',
      announcePause: 'Game paused.', announceResume: 'Game resumed.', announceCountdown: 'Pumpkin bomb countdown, {remaining}.',
      announceExplosion: 'The pumpkin burst into flying candy!', announceCelebration: 'Three wins in a row! happy hallow day.',
      status_ready: 'The Little Ghost is ready. Your serve!', status_serve: 'Get ready! Watch where the pumpkin will land.',
      status_playing: 'Catch, jump, hit! Airborne hits travel faster.', status_point: 'A short break. The next serve is coming.',
      status_countdown: 'Three wins! The pumpkin fuse is glowing…', status_explosion: 'Pop! It is raining candy.',
      status_celebration: 'happy hallow day · Enjoy your night!', status_paused: 'Paused · Press Esc or Keep playing to return.'
    }
  };
  let language = 'zh';
  try { const saved = localStorage.getItem('pumpkin-rally-language'); if (translations[saved]) language = saved; } catch { /* Storage is optional. */ }
  function t(key, params = {}) {
    return (translations[language][key] ?? translations.zh[key] ?? key).replace(/\{(\w+)\}/g, (match, name) => params[name] ?? match);
  }
  function apply() {
    document.documentElement.lang = { zh: 'zh-CN', ja: 'ja', en: 'en' }[language];
    document.title = t('documentTitle');
    document.querySelector('meta[name="description"]')?.setAttribute('content', t('description'));
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
    document.querySelectorAll('[data-i18n-title]').forEach(el => el.setAttribute('title', t(el.dataset.i18nTitle)));
    const select = document.getElementById('language-select'); if (select) select.value = language;
  }
  function setLanguage(next) {
    if (!translations[next]) return;
    language = next;
    try { localStorage.setItem('pumpkin-rally-language', language); } catch { /* Storage is optional. */ }
    apply();
    document.dispatchEvent(new CustomEvent('pumpkin-language-change'));
  }
  root.PumpkinVolleyI18n = { translations, t, apply, setLanguage, get language() { return language; } };
  apply();
})(window);
