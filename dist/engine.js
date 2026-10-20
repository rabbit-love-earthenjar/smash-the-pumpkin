(function (root) {
  'use strict';

  const CONFIG = Object.freeze({
    W: 960, H: 540, groundY: 452, netX: 480, netTop: 294,
    netHalfWidth: 8, ballRadius: 27, ballGravity: 620, actorGravity: 1160,
    playerSpeed: 365, jumpSpeed: 455,
    groundAttackSpeed: 370, groundAttackLift: 500,
    airAttackSpeed: 460, airAttackLift: 350,
    nearNetAttackLift: 570, bodyBumpLift: 440,
    aiDifficulties: Object.freeze([
      Object.freeze({ name: '入门', speed: 145, error: 420, reactionMin: 0.28, reactionMax: 0.48, attackWindow: 0.08 }),
      Object.freeze({ name: '进阶', speed: 180, error: 380, reactionMin: 0.22, reactionMax: 0.40, attackWindow: 0.10 }),
      Object.freeze({ name: '挑战', speed: 210, error: 340, reactionMin: 0.18, reactionMax: 0.32, attackWindow: 0.12 })
    ]),
    attackRange: 150, attackCooldown: 0.34, aiAttackRange: 95, aiAttackCooldown: 0.5, pointsToWin: 3,
    streakToWin: 3, serveDelay: 0.78, pointDelay: 1.25,
    roundDelay: 2.1, countdownDuration: 3.2, explosionDuration: 1.2
  });
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const actor = (x, face) => ({
    x, y: CONFIG.groundY, vx: 0, vy: 0, r: 27, w: 50, h: 84,
    onGround: true, attack: 0, face, cooldown: 0, touchCooldown: 0
  });

  class Game {
    constructor({ random = Math.random } = {}) {
      this.random = random;
      this.restart();
    }

    restart() {
      this.state = 'ready';
      this.time = 0;
      this.stateTime = 0;
      this.paused = false;
      this.player = actor(720, -1);
      this.ghost = actor(240, 1);
      this.ball = { x: 720, y: 240, vx: 0, vy: 0, r: CONFIG.ballRadius, spin: 0 };
      this.events = [];
      this.streak = 0;
      this.round = 1;
      this.playerPoints = 0;
      this.ghostPoints = 0;
      this.rallies = 0;
      this.bestRally = 0;
      this.totalHits = 0;
      this.winner = null;
      this.pointWinner = null;
      this._server = 'player';
      this._jumpHeld = false;
      this._roundFinished = false;
      this._finalWin = false;
      this._aiTimer = 0;
      this._aiTarget = 240;
      this._aiError = 0;
      this._lastFuse = 3;
    }

    start() {
      if (this.state === 'ready') this._prepareServe();
    }

    pause(value = true) { this.paused = Boolean(value); }

    get difficulty() { return Math.min(3, this.streak + 1); }

    get _aiConfig() { return CONFIG.aiDifficulties[this.difficulty - 1]; }

    get remainingFuse() {
      if (this.state === 'countdown') return Math.max(0, 3 - Math.floor(this.stateTime));
      return this.state === 'explosion' || this.state === 'celebration' ? 0 : 3;
    }

    _setState(state) { this.state = state; this.stateTime = 0; }

    _prepareServe() {
      if (this._roundFinished) {
        this.round++;
        this.playerPoints = 0;
        this.ghostPoints = 0;
        this._roundFinished = false;
      }
      this.player = actor(720, -1);
      this.ghost = actor(240, 1);
      Object.assign(this.ball, {
        x: this._server === 'player' ? 735 : 225,
        y: 215, vx: 0, vy: 0
      });
      this.rallies = 0;
      this._aiTimer = 0;
      this._aiError = (0.5 - this.random()) * this._aiConfig.error;
      this._setState('serve');
      this.events.push({ type: 'serve', actor: this._server, round: this.round });
    }

    // Physics and the tests enter scoring through exactly the same method.
    awardPoint(winner) {
      if (this.state !== 'playing' || !['player', 'ghost'].includes(winner)) return false;
      const isPlayer = winner === 'player';
      if (isPlayer) this.playerPoints++;
      else this.ghostPoints++;
      this.pointWinner = winner;
      this._server = winner;
      this._roundFinished = Math.max(this.playerPoints, this.ghostPoints) >= CONFIG.pointsToWin;
      if (this._roundFinished) {
        this.streak = isPlayer ? this.streak + 1 : 0;
        this._finalWin = this.streak >= CONFIG.streakToWin;
        if (this._finalWin) this.winner = 'player';
      }
      const info = {
        actor: winner, playerPoints: this.playerPoints, ghostPoints: this.ghostPoints,
        round: this.round, streak: this.streak,
        roundWin: this._roundFinished && isPlayer,
        roundLoss: this._roundFinished && !isPlayer
      };
      this.events.push({ type: 'point', ...info });
      if (this._roundFinished) this.events.push({ type: isPlayer ? 'win' : 'loss', ...info });
      this.ball.vx = this.ball.vy = 0;
      this.player.vx = this.ghost.vx = 0;
      this._setState('point');
      return true;
    }

    step(dt, input = {}) {
      if (this.paused || !Number.isFinite(dt) || dt <= 0) return;
      // A suspended browser tab cannot fast-forward an entire match on return.
      let remaining = Math.min(dt, 0.25);
      const jumpPressed = Boolean(input.jump) && !this._jumpHeld;
      this._jumpHeld = Boolean(input.jump);
      let first = true;
      while (remaining > 0.000001) {
        const slice = Math.min(remaining, 1 / 120);
        this._tick(slice, input, first && jumpPressed);
        first = false;
        remaining -= slice;
      }
    }

    _tick(dt, input, jumpPressed) {
      if (this.state === 'ready' || this.state === 'celebration') return;
      this.time += dt;
      this.stateTime += dt;
      for (const body of [this.player, this.ghost]) {
        body.attack = Math.max(0, body.attack - dt);
        body.cooldown = Math.max(0, body.cooldown - dt);
        body.touchCooldown = Math.max(0, body.touchCooldown - dt);
      }
      if (this.state === 'point') {
        const delay = this._roundFinished ? CONFIG.roundDelay : CONFIG.pointDelay;
        if (this.stateTime >= delay) {
          if (this._finalWin) {
            Object.assign(this.ball, { x: 480, y: 230, vx: 0, vy: 0 });
            this._setState('countdown');
            this._lastFuse = 3;
            this.events.push({ type: 'countdown', remaining: 3 });
          } else this._prepareServe();
        }
        return;
      }
      if (this.state === 'countdown') {
        if (this.remainingFuse !== this._lastFuse) {
          this._lastFuse = this.remainingFuse;
          this.events.push({ type: 'countdown', remaining: this.remainingFuse });
        }
        if (this.stateTime >= CONFIG.countdownDuration) {
          this._setState('explosion');
          this.events.push({ type: 'explosion', x: this.ball.x, y: this.ball.y });
        }
        return;
      }
      if (this.state === 'explosion') {
        if (this.stateTime >= CONFIG.explosionDuration) {
          this._setState('celebration');
          this.events.push({ type: 'celebration', actor: 'player' });
        }
        return;
      }
      this._move(this.player, (Boolean(input.right) - Boolean(input.left)) * CONFIG.playerSpeed,
        jumpPressed, Boolean(input.down), dt, true);
      if (this.state === 'serve') {
        if (this.stateTime >= CONFIG.serveDelay) {
          this._setState('playing');
          this.ball.vx = this._server === 'player' ? -305 : 305;
          this.ball.vy = -260;
        }
        return;
      }
      this._updateAI(dt);
      this._moveBall(dt);
      if (this.state !== 'playing') return;
      if (input.attack) this._attack(this.player, 'player');
      this._bodyCollision(this.player, 'player');
      this._bodyCollision(this.ghost, 'ghost');
      this.ball.spin += this.ball.vx * dt / 42;
    }

    _move(body, speed, jump, fastFall, dt, isPlayer) {
      body.vx = speed;
      if (speed) body.face = Math.sign(speed);
      if (jump && body.onGround) { body.vy = -CONFIG.jumpSpeed; body.onGround = false; }
      body.x = clamp(body.x + body.vx * dt,
        isPlayer ? CONFIG.netX + 43 : 35,
        isPlayer ? CONFIG.W - 35 : CONFIG.netX - 43);
      if (!body.onGround) {
        body.vy += CONFIG.actorGravity * dt * (fastFall ? 2.5 : 1);
        body.y += body.vy * dt;
        if (body.y >= CONFIG.groundY) {
          body.y = CONFIG.groundY;
          body.vy = 0;
          body.onGround = true;
        }
      }
    }

    _updateAI(dt) {
      this._aiTimer -= dt;
      const b = this.ball, g = this.ghost, ai = this._aiConfig;
      if (this._aiTimer <= 0) {
        this._aiTimer = ai.reactionMin + this.random() * (ai.reactionMax - ai.reactionMin);
        const fall = (340 - b.y);
        const t = clamp((-b.vy + Math.sqrt(Math.max(0, b.vy * b.vy + 2 * CONFIG.ballGravity * fall))) /
          CONFIG.ballGravity, 0, 1.1);
        let predicted = b.x + b.vx * t;
        const span = CONFIG.W - b.r * 2;
        predicted = ((predicted - b.r) % (span * 2) + span * 2) % (span * 2);
        if (predicted > span) predicted = span * 2 - predicted;
        predicted += b.r;
        this._aiTarget = b.x < 510 || b.vx < 0
          ? clamp(predicted + this._aiError, 48, 425) : 260;
      }
      const delta = this._aiTarget - g.x;
      const speed = Math.abs(delta) > 12 ? Math.sign(delta) * ai.speed : 0;
      const jump = b.x < 475 && Math.abs(b.x - g.x) < 105 && b.y < 295 && b.vy > 30;
      this._move(g, speed, jump, false, dt, false);
      // Limited reaction, movement and imperfect prediction leave real openings.
      if (this._aiTimer < ai.attackWindow && b.x < 475 && b.vy > -150 &&
          Math.abs(b.x - g.x) < 78) this._attack(g, 'ghost');
    }

    _registerHit(body, who, kind) {
      body.touchCooldown = 0.2;
      this.rallies++;
      this.totalHits++;
      this.bestRally = Math.max(this.bestRally, this.rallies);
      // Each incoming return gets a fresh imperfect read, rather than a perfect bot.
      if (who === 'player') this._aiError = (0.5 - this.random()) * this._aiConfig.error;
      this.events.push({ type: 'hit', actor: who, kind, x: this.ball.x, y: this.ball.y });
    }

    _attack(body, who) {
      if (body.cooldown > 0) return;
      const isPlayer = who === 'player';
      const attackRange = isPlayer ? CONFIG.attackRange : CONFIG.aiAttackRange;
      body.cooldown = isPlayer ? CONFIG.attackCooldown : CONFIG.aiAttackCooldown;
      body.attack = 0.2;
      const b = this.ball;
      const distance = Math.hypot(b.x - body.x, b.y - (body.y - 49));
      const ownSide = who === 'player' ? b.x > CONFIG.netX - 12 : b.x < CONFIG.netX + 12;
      if (distance > attackRange || body.touchCooldown > 0 || !ownSide) return;
      const direction = who === 'player' ? -1 : 1;
      const netDistance = Math.abs(b.x - CONFIG.netX);
      // A nearby swing lofts over the net; an airborne swing sends a faster shot.
      b.vx = direction * (body.onGround ? CONFIG.groundAttackSpeed : CONFIG.airAttackSpeed);
      b.vy = -(body.onGround ? CONFIG.groundAttackLift : CONFIG.airAttackLift);
      if (netDistance < 125 && b.y > 245) b.vy = -CONFIG.nearNetAttackLift;
      b.x = clamp(b.x, b.r + 1, CONFIG.W - b.r - 1);
      this._registerHit(body, who, 'attack');
    }

    _bodyCollision(body, who) {
      const b = this.ball, cy = body.y - 42;
      const dx = b.x - body.x, dy = b.y - cy;
      const distance = Math.hypot(dx, dy), radius = body.r + b.r;
      if (distance >= radius) return;
      const nx = distance > 0.001 ? dx / distance : 0;
      const ny = distance > 0.001 ? dy / distance : -1;
      b.x = body.x + nx * (radius + 0.5);
      b.y = cy + ny * (radius + 0.5);
      if (body.touchCooldown <= 0 && dy < 20) {
        b.vx = who === 'player' ? -255 : 255;
        b.vy = -CONFIG.bodyBumpLift;
        this._registerHit(body, who, 'bump');
      } else {
        const toward = b.vx * nx + b.vy * ny;
        if (toward < 0) { b.vx -= 1.6 * toward * nx; b.vy -= 1.6 * toward * ny; }
      }
      // Separation from a body must not teleport the ball through the solid net.
      if (b.y > CONFIG.netTop - b.r) {
        const limit = CONFIG.netX + (who === 'player' ? 1 : -1) *
          (CONFIG.netHalfWidth + b.r + 0.2);
        if (who === 'player' ? b.x < limit : b.x > limit) {
          b.x = limit;
          b.vx = (who === 'player' ? 1 : -1) * Math.max(95, Math.abs(b.vx) * 0.75);
        }
      }
    }

    _moveBall(dt) {
      const b = this.ball, previousX = b.x, previousY = b.y;
      b.vy = clamp(b.vy + CONFIG.ballGravity * dt, -650, 700);
      b.vx = clamp(b.vx, -570, 570);
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * 0.9; }
      if (b.x > CONFIG.W - b.r) { b.x = CONFIG.W - b.r; b.vx = -Math.abs(b.vx) * 0.9; }
      if (b.y < b.r + 8) { b.y = b.r + 8; b.vy = Math.abs(b.vy) * 0.75; }
      const left = CONFIG.netX - CONFIG.netHalfWidth;
      const right = CONFIG.netX + CONFIG.netHalfWidth;
      const nearX = clamp(b.x, left, right);
      const nearY = clamp(b.y, CONFIG.netTop, CONFIG.groundY);
      const dx = b.x - nearX, dy = b.y - nearY;
      const distance = Math.hypot(dx, dy);
      if (distance < b.r) {
        if (previousY <= CONFIG.netTop - b.r && b.vy > 0) {
          b.y = CONFIG.netTop - b.r - 0.2;
          b.vy = -Math.max(140, b.vy * 0.75);
          // A tiny sideways impulse prevents a ball balancing on the net forever.
          if (Math.abs(b.vx) < 70) b.vx = (b.x < CONFIG.netX ? -1 : 1) * 100;
        } else {
          const side = previousX < CONFIG.netX ? -1 : 1;
          b.x = side < 0 ? left - b.r - 0.2 : right + b.r + 0.2;
          b.vx = side * Math.max(95, Math.abs(b.vx) * 0.75);
        }
      }
      if (b.y >= CONFIG.groundY - b.r) {
        b.y = CONFIG.groundY - b.r;
        this.awardPoint(b.x < CONFIG.netX ? 'player' : 'ghost');
      }
    }
  }

  const api = { Game, CONFIG };
  root.PumpkinVolleyEngine = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
