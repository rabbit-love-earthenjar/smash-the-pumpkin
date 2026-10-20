const test = require('node:test');
const assert = require('node:assert/strict');
const { Game, CONFIG } = require('../dist/engine.js');

function advance(game, seconds, input = {}) {
  for (let i = 0; i < Math.ceil(seconds * 120); i++) game.step(1 / 120, input);
}
function playing(game) {
  if (game.state === 'roundEnd') assert.equal(game.continueNextRound(), true);
  for (let i = 0; i < 800 && game.state !== 'playing'; i++) game.step(1 / 120);
  assert.equal(game.state, 'playing');
}
function point(game, who) { playing(game); assert.equal(game.awardPoint(who), true); }
function round(game, who) { for (let i = 0; i < 3; i++) point(game, who); }

test('the player starts on the right, AI on the left, and A/D remain screen directions', () => {
  const game = new Game();
  assert.equal(game.player.x, 720); assert.equal(game.player.face, -1);
  assert.equal(game.ghost.x, 240); assert.equal(game.ghost.face, 1);
  assert.equal(game.ball.r, 27); assert.equal(game.ball.r, CONFIG.ballRadius);
  game.start();
  game.step(0.1, { left: true }); assert.ok(game.player.x < 720);
  const previous = game.player.x;
  game.step(0.1, { right: true }); assert.ok(game.player.x > previous);
  playing(game); assert.ok(game.ball.vx < 0);
  advance(game, 3, { left: true }); assert.ok(game.player.x >= CONFIG.netX + 43);
  game.restart(); game.start(); playing(game);
  Object.assign(game.ball, { x: 900, y: 425, vx: 0, vy: 500 });
  game.step(0.1); assert.equal(game.ghostPoints, 1);
});

test('each round ends at three points, and three consecutive round wins unlock the ending', () => {
  const game = new Game({ random: () => 0.5 });
  game.start();
  assert.equal(game.difficulty, 1);
  point(game, 'player');
  point(game, 'player');
  assert.equal(game.streak, 0);
  assert.equal(game.playerPoints, 2);
  point(game, 'player');
  assert.equal(game.streak, 1);
  assert.equal(game.difficulty, 2);
  assert.equal(game.playerPoints, 3);
  assert.equal(game.winner, null);
  round(game, 'player');
  assert.equal(game.streak, 2);
  assert.equal(game.difficulty, 3);
  assert.equal(game.winner, null);
  round(game, 'player');
  assert.equal(game.streak, 3);
  assert.equal(game.winner, 'player');
  assert.equal(game.round, 3);
  assert.equal(game.events.filter(e => e.type === 'win').length, 3);
});

test('player serve follows selected position, waits while held, then launches after release', () => {
  const game = new Game(); game.start();
  assert.equal(game.servingActor, 'player');
  assert.equal(game.remainingServe, CONFIG.playerServeDelay);
  advance(game, 4, { right: true, attack: true });
  assert.equal(game.state, 'serve');
  assert.equal(game.player.x, CONFIG.W - 35);
  assert.equal(game.ball.x, CONFIG.W - CONFIG.ballRadius - 1);
  assert.equal(game.ball.vx, 0); assert.equal(game.ball.vy, 0);
  assert.equal(game.remainingServe, CONFIG.serveIdleDelay);
  advance(game, .8, { attack: true });
  assert.equal(game.state, 'serve');
  const selected = game.ball.x;
  advance(game, .06, { attack: true });
  assert.equal(game.state, 'playing');
  assert.ok(game.ball.x <= selected && game.ball.x > selected - 10);
  assert.ok(game.ball.vx < -305); assert.equal(game.remainingServe, 0);
  let crossed = false;
  for (let i = 0; i < 180 && game.state === 'playing'; i++) {
    game.step(1 / 120);
    if (game.ball.x <= CONFIG.netX) {
      assert.ok(game.ball.y + game.ball.r < CONFIG.netTop);
      crossed = true; break;
    }
  }
  assert.equal(crossed, true);

  const near = new Game(); near.start();
  advance(near, 1, { left: true });
  assert.ok(near.ball.x >= CONFIG.netX + CONFIG.netHalfWidth + near.ball.r + 1);
  const nearX = near.ball.x;
  advance(near, 1.55);
  assert.equal(near.state, 'serve');
  assert.equal(near.ball.x, nearX);
  advance(near, .06);
  assert.equal(near.state, 'playing');
  assert.equal(near.ball.vx, -305);
});

test('ghost serves retain the original .78 second automatic launch', () => {
  const game = new Game(); game.start(); playing(game);
  game.awardPoint('ghost');
  while (game.state === 'point') game.step(1 / 120);
  assert.equal(game.state, 'serve'); assert.equal(game.servingActor, 'ghost');
  assert.equal(game.remainingServe, CONFIG.serveDelay);
  advance(game, .75, { left: true, attack: true });
  assert.equal(game.state, 'serve'); assert.equal(game.ball.x, 225);
  advance(game, .04, { left: true });
  assert.equal(game.state, 'playing'); assert.equal(game.ball.vx, 305);
});

test('losing a round resets the streak; isolated lost points do not', () => {
  const game = new Game(); game.start();
  round(game, 'player');
  point(game, 'ghost');
  assert.equal(game.streak, 1);
  assert.equal(game.difficulty, 2);
  point(game, 'ghost'); point(game, 'ghost');
  assert.equal(game.streak, 0);
  assert.equal(game.difficulty, 1);
  assert.equal(game.events.at(-1).type, 'loss');
  playing(game);
  assert.equal(game.playerPoints, 0);
  assert.equal(game.ghostPoints, 0);
  assert.equal(game.round, 3);
});

test('a 2:2 round ends at 3:2 without requiring a two point lead', () => {
  const game = new Game(); game.start();
  for (const who of ['player', 'ghost', 'player', 'ghost', 'player']) point(game, who);
  assert.equal(game.playerPoints, 3); assert.equal(game.ghostPoints, 2);
  assert.equal(game.streak, 1);
});

test('a completed game freezes on its final score until one explicit continue action', () => {
  for (const who of ['player', 'ghost']) {
    const game = new Game(); game.start();
    assert.equal(game.continueNextRound(), false);
    round(game, who);
    assert.equal(game.state, 'roundEnd');
    assert.equal(game.lastRoundWinner, who);
    assert.equal(game[who === 'player' ? 'playerPoints' : 'ghostPoints'], 3);
    const before = JSON.stringify({
      time: game.time, stateTime: game.stateTime, ball: game.ball,
      player: game.player, ghost: game.ghost, round: game.round,
      playerPoints: game.playerPoints, ghostPoints: game.ghostPoints
    });
    advance(game, 10, { left: true, right: true, jump: true, attack: true });
    assert.equal(JSON.stringify({
      time: game.time, stateTime: game.stateTime, ball: game.ball,
      player: game.player, ghost: game.ghost, round: game.round,
      playerPoints: game.playerPoints, ghostPoints: game.ghostPoints
    }), before);
    assert.equal(game.awardPoint('player'), false);
    assert.equal(game.continueNextRound(), true);
    assert.equal(game.state, 'serve');
    assert.equal(game.round, 2);
    assert.equal(game.playerPoints, 0); assert.equal(game.ghostPoints, 0);
    assert.equal(game.continueNextRound(), false);
    playing(game);
  }
});

test('holding auto attack while distant stays idle, and actual returns alone animate the strike', () => {
  const game = new Game(); game.start(); playing(game);
  for (let i = 0; i < 240; i++) {
    Object.assign(game.ball, { x: 800, y: 80, vx: 0, vy: 0 });
    game.step(1 / 120, { attack: true });
    assert.equal(game.player.attack, 0);
  }
  assert.equal(game.events.filter(event => event.type === 'hit' && event.actor === 'player').length, 0);
  assert.ok(game.player.cooldown > 0);
  while (game.player.cooldown > 0) {
    Object.assign(game.ball, { x: 800, y: 80, vx: 0, vy: 0 });
    game.step(1 / 120);
  }
  Object.assign(game.ball, { x: game.player.x - 45, y: game.player.y - 75, vx: 0, vy: 0 });
  game.step(1 / 120, { attack: true });
  assert.equal(game.events.at(-1).kind, 'attack');
  assert.equal(game.player.attack, 0.2);
  assert.ok(game.ball.vx < 0);

  const bump = new Game(); bump.start(); playing(bump);
  Object.assign(bump.ball, { x: bump.player.x + 30, y: bump.player.y - 57, vx: 0, vy: 0 });
  bump.step(1 / 120);
  assert.equal(bump.events.at(-1).kind, 'bump');
  assert.equal(bump.player.attack, 0.2);
});

test('W requires a new press, S accelerates falling, and Space attacks across the net', () => {
  const game = new Game(); game.start(); playing(game);
  game.ball.x = 160; game.ball.y = 100; game.ball.vx = 0; game.ball.vy = 0;
  game.step(1 / 120, { jump: true });
  assert.ok(game.player.vy < 0);
  const upward = game.player.vy;
  game.step(1 / 120, { jump: true, down: true });
  assert.ok(game.player.vy > upward + CONFIG.actorGravity / 120);
  advance(game, 0.9, { jump: true });
  assert.equal(game.player.onGround, true);
  game.state = 'playing';
  game.ball.x = game.player.x - 45;
  game.ball.y = game.player.y - 75;
  game.ball.vx = game.ball.vy = 0;
  game.step(1 / 120, { attack: true });
  assert.ok(game.ball.vx < -300);
  assert.ok(game.ball.vy < -400);
  assert.equal(game.events.at(-1).actor, 'player');
});

test('AI moves toward predicted landing position and makes physical attacks', () => {
  const game = new Game({ random: () => 0.5 }); game.start(); playing(game);
  game.ball.x = 90; game.ball.y = 220; game.ball.vx = 0; game.ball.vy = 120;
  const startX = game.ghost.x;
  advance(game, 0.25);
  assert.ok(game.ghost.x < startX - 20);
  game.ball.x = game.ghost.x - 30;
  game.ball.y = game.ghost.y - 65;
  game.ball.vx = 0; game.ball.vy = 150;
  game._aiTimer = 0.1;
  advance(game, 0.03);
  assert.ok(game.events.some(e => e.type === 'hit' && e.actor === 'ghost'));
  assert.ok(game.ball.vx > 0);
  assert.equal(game.playerPoints + game.ghostPoints, 0);
});

test('both sides use the same 116px attack boundary and 0.34 second cooldown', () => {
  assert.equal(CONFIG.attackRange, 116); assert.equal(CONFIG.attackCooldown, 0.34);
  for (const [who, distance, shouldHit] of [['player', 115, true], ['player', 117, false], ['ghost', 115, true], ['ghost', 117, false]]) {
    const game = new Game(); game.start(); playing(game);
    const body = game[who];
    Object.assign(game.ball, { x: body.x + (who === 'player' ? -distance : distance), y: body.y - 49, vx: 0, vy: 0 });
    game._attack(body, who);
    const hit = game.events.some(event => event.type === 'hit' && event.actor === who && event.kind === 'attack');
    assert.equal(hit, shouldHit);
    assert.equal(body.cooldown, 0.34);
    assert.equal(game.playerPoints + game.ghostPoints, 0);
  }
});

test('backcourt attacks from either side clear the net on a continuous gravity arc', () => {
  for (const who of ['player', 'ghost']) {
    const game = new Game({ random: () => 0.5 }); game.start(); playing(game);
    const right = who === 'player', dt = 1 / 120;
    game[who].x = right ? 915 : 45;
    Object.assign(game.ball, { x: right ? 870 : 90, y: 375, vx: 0, vy: 0 });
    game._aiTarget = game.ghost.x; game._aiTimer = 0.05;
    game.step(dt, { attack: right });
    assert.ok(game.events.some(event => event.type === 'hit' && event.actor === who));
    const launch = { ...game.ball };
    assert.equal(Math.abs(launch.vx), CONFIG.groundAttackSpeed);
    let crossed = false;
    for (let step = 1; step <= 240; step++) {
      game.step(dt);
      const time = step * dt;
      const expectedX = launch.x + launch.vx * time;
      const expectedY = launch.y + launch.vy * time + CONFIG.ballGravity * time * time / 2;
      assert.ok(Number.isFinite(game.ball.x) && Number.isFinite(game.ball.y));
      assert.ok(Math.abs(game.ball.x - expectedX) < 0.001);
      // Semi-implicit Euler differs from the analytic parabola by g*dt*t/2.
      assert.ok(Math.abs(game.ball.y - expectedY) <= CONFIG.ballGravity * dt * time / 2 + 0.01);
      if (right ? game.ball.x <= CONFIG.netX : game.ball.x >= CONFIG.netX) {
        assert.ok(game.ball.y + game.ball.r < CONFIG.netTop);
        crossed = true; break;
      }
    }
    assert.equal(crossed, true);
  }
});

test('three AI tiers actually increase speed and reaction rate while reducing prediction error', () => {
  const measured = [];
  for (let tier = 1; tier <= 3; tier++) {
    const game = new Game({ random: () => 0.75 });
    game.streak = tier - 1;
    game.start(); playing(game);
    const ai = CONFIG.aiDifficulties[tier - 1];
    assert.equal(game.difficulty, tier);
    assert.equal(Math.abs(game._aiError), ai.error * 0.25);
    Object.assign(game.ball, { x: 90, y: 220, vx: 0, vy: 120 });
    const previousX = game.ghost.x;
    game.step(1 / 120);
    const speed = (previousX - game.ghost.x) * 120;
    assert.ok(Math.abs(speed - ai.speed) < 0.0001);
    assert.equal(game._aiTimer, ai.reactionMin + 0.75 * (ai.reactionMax - ai.reactionMin));
    assert.equal(game.playerPoints + game.ghostPoints, 0);
    measured.push({ speed, reaction: game._aiTimer, error: Math.abs(game._aiError) });
  }
  for (let i = 1; i < measured.length; i++) {
    assert.ok(measured[i].speed > measured[i - 1].speed);
    assert.ok(measured[i].reaction < measured[i - 1].reaction);
    assert.ok(measured[i].error < measured[i - 1].error);
  }
});

test('walls, net, ground and long simulations remain finite and within playable bounds', () => {
  const game = new Game({ random: () => 0.5 }); game.start(); playing(game);
  Object.assign(game.ball, { x: 450, y: 350, vx: 570, vy: 0 });
  game.step(0.1);
  assert.ok(game.ball.x <= CONFIG.netX - CONFIG.netHalfWidth - CONFIG.ballRadius);
  assert.ok(game.ball.vx < 0);
  Object.assign(game.ball, { x: 50, y: 425, vx: 0, vy: 500 });
  game.step(0.1);
  assert.equal(game.playerPoints, 1);
  advance(game, 90, { right: true, jump: true, attack: true });
  for (const body of [game.ball, game.player, game.ghost]) {
    assert.ok(Number.isFinite(body.x) && Number.isFinite(body.y));
    assert.ok(body.x >= 0 && body.x <= CONFIG.W);
    assert.ok(body.y >= 0 && body.y <= CONFIG.groundY);
  }
});

test('pause freezes physics and all game timers', () => {
  const game = new Game(); game.start(); playing(game);
  const before = JSON.stringify({ time: game.time, stateTime: game.stateTime, ball: game.ball, player: game.player });
  game.pause(); advance(game, 5, { right: true, attack: true });
  assert.equal(JSON.stringify({ time: game.time, stateTime: game.stateTime, ball: game.ball, player: game.player }), before);
  game.pause(false); game.step(0.1);
  assert.ok(game.time > JSON.parse(before).time);
});

test('body separation cannot squeeze a pumpkin through the net from either side', () => {
  for (const who of ['player', 'ghost']) {
    const game = new Game({ random: () => 0.5 }); game.start(); playing(game);
    const left = who === 'ghost';
    game[who].x = left ? 437 : 523;
    const netEdge = CONFIG.netX + (left ? -1 : 1) * (CONFIG.netHalfWidth + CONFIG.ballRadius);
    Object.assign(game.ball, { x: netEdge + (left ? -1 : 1), y: 410, vx: 0, vy: 0 });
    game._aiTarget = game.ghost.x;
    game._aiTimer = 0.25;
    for (let i = 0; i < 4; i++) {
      game.step(1 / 120);
      assert.ok(left ? game.ball.x <= netEdge : game.ball.x >= netEdge);
      assert.ok(game.ball.y > CONFIG.netTop);
    }
  }
});

test('a moving player can beat the AI through real ball physics without injected points', () => {
  let seed = 1;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const game = new Game({ random }); game.start();
  const difficultiesPlayed = new Set();
  for (let i = 0; i < 200 * 120 && game.state !== 'celebration'; i++) {
    if (game.state === 'roundEnd') assert.equal(game.continueNextRound(), true);
    if (game.state === 'playing') difficultiesPlayed.add(game.difficulty);
    const serving = game.state === 'serve';
    game.step(1 / 120, {
      left: !serving && game.ball.x < game.player.x - 10,
      right: !serving && game.ball.x > game.player.x + 10,
      attack: true,
      jump: game.ball.y < 230 && Math.abs(game.ball.x - game.player.x) < 70 && game.ball.vy > 80
    });
  }
  assert.equal(game.state, 'celebration');
  assert.equal(game.streak, 3);
  assert.deepEqual([...difficultiesPlayed], [1, 2, 3]);
  assert.ok(game.events.some(e => e.type === 'hit' && e.actor === 'ghost'));
  assert.equal(game.events.filter(e => e.type === 'point' && e.actor === 'player').length, 9);
  assert.equal(game.events.filter(e => e.type === 'win').length, 3);
});

test('the final pumpkin counts 3-2-1-0, explodes, celebrates and restarts cleanly', () => {
  const game = new Game(); game.start();
  for (let i = 0; i < 3; i++) round(game, 'player');
  advance(game, 2.2);
  assert.equal(game.state, 'countdown'); assert.equal(game.remainingFuse, 3);
  advance(game, 1); assert.equal(game.remainingFuse, 2);
  advance(game, 1); assert.equal(game.remainingFuse, 1);
  advance(game, 1.2); assert.equal(game.state, 'explosion');
  advance(game, 1.3); assert.equal(game.state, 'celebration');
  assert.deepEqual(game.events.filter(e => e.type === 'countdown').map(e => e.remaining), [3, 2, 1, 0]);
  assert.equal(game.events.filter(e => e.type === 'explosion').length, 1);
  game.restart();
  assert.equal(game.state, 'ready'); assert.equal(game.streak, 0); assert.equal(game.totalHits, 0);
  assert.equal(game.winner, null); assert.equal(game.events.length, 0);
});
