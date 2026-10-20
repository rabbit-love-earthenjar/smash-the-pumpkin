(function (root) {
  'use strict';
  const TAU = Math.PI * 2;
  const palette = { orange: '#ff9b50', mint: '#c1e7d2', cream: '#f5dfbd' };

  class Renderer {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.time = 0;
      this.particles = [];
      this.trail = [];
      this.shake = 0;
      this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.images = {};
      for (const name of ['stand', 'run', 'jump', 'hit']) {
        const img = new Image();
        img.src = `assets/miko_${name}_transparent.png`;
        this.images[name] = img;
      }
      this.ghostImage = new Image();
      this.ghostImage.src = 'assets/easy_ghost.png';
      this.background = document.createElement('canvas');
      this.background.width = 960;
      this.background.height = 540;
      this.paintBackground(this.background.getContext('2d'));
    }

    reset() { this.particles = []; this.trail = []; this.shake = 0; }

    glow(ctx, x, y, radius, color) {
      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      grad.addColorStop(0, color); grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad; ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }

    paintBackground(c) {
      const sky = c.createLinearGradient(0, 0, 0, 540);
      sky.addColorStop(0, '#211c33'); sky.addColorStop(.58, '#3c2a47'); sky.addColorStop(1, '#292330');
      c.fillStyle = sky; c.fillRect(0, 0, 960, 540);
      this.glow(c, 757, 105, 155, '#b18d6424');
      c.fillStyle = '#e7d3a6'; c.beginPath(); c.arc(757, 103, 43, 0, TAU); c.fill();
      c.fillStyle = '#d4bf961f';
      for (const [x, y, r] of [[741, 89, 9], [776, 102, 13], [751, 126, 6]]) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
      // Fixed star positions keep the night calm instead of flickering each frame.
      for (let i = 0; i < 58; i++) {
        const x = (i * 179 + 33) % 960, y = (i * 67 + 19) % 270;
        c.fillStyle = i % 3 ? '#e0d1c443' : '#f2dcb47d';
        c.fillRect(x, y, i % 4 ? 1 : 2, i % 4 ? 1 : 2);
      }
      c.fillStyle = '#262135';
      c.beginPath(); c.moveTo(0, 318);
      [[0, 228], [85, 185], [180, 255], [280, 197], [370, 250], [470, 210], [600, 267], [705, 225], [825, 248], [960, 179], [960, 350]].forEach(([x, y]) => c.lineTo(x, y)); c.fill();
      // Kyoto roof silhouettes, timber walls and warm paper windows.
      this.building(c, -30, 278, 267, 141, true);
      this.building(c, 768, 279, 222, 144, false);
      c.fillStyle = '#302538'; c.fillRect(252, 335, 447, 87);
      for (let x = 254; x < 700; x += 27) { c.fillStyle = '#514052'; c.fillRect(x, 338, 2, 81); }
      c.fillStyle = '#201c2d'; c.fillRect(245, 329, 465, 10); c.fillRect(245, 411, 465, 13);
      // A small torii gate is a backdrop, leaving the actual court readable.
      c.fillStyle = '#70414b'; c.fillRect(582, 254, 12, 170); c.fillRect(681, 254, 12, 170);
      c.fillStyle = '#8b4b50'; c.fillRect(566, 259, 143, 10); c.fillRect(579, 288, 117, 9);
      c.fillStyle = '#332235'; c.beginPath(); c.moveTo(558, 245); c.quadraticCurveTo(636, 262, 716, 245); c.lineTo(707, 257); c.quadraticCurveTo(636, 272, 567, 257); c.closePath(); c.fill();
      c.strokeStyle = '#c1a275'; c.lineWidth = 2; c.beginPath(); c.moveTo(590, 276); c.quadraticCurveTo(635, 298, 686, 276); c.stroke();
      for (const x of [608, 632, 657]) { c.fillStyle = '#c3b7aa'; c.beginPath(); c.moveTo(x, 285); c.lineTo(x + 5, 292); c.lineTo(x + 1, 298); c.lineTo(x + 6, 304); c.lineTo(x + 1, 309); c.lineTo(x - 4, 299); c.closePath(); c.fill(); }
      this.tree(c, 20, 290, -1); this.tree(c, 927, 288, 1);
      // Festoon lighting and two larger shrine lanterns.
      c.strokeStyle = '#171621'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(0, 98); c.quadraticCurveTo(240, 185, 480, 92); c.quadraticCurveTo(720, 159, 960, 70); c.stroke();
      for (let i = 0; i < 11; i++) {
        const x = i * 96 + 8, y = x < 480 ? 105 + 42 * Math.sin(x / 480 * Math.PI) : 100 + 20 * Math.sin((x - 480) / 480 * Math.PI) - (x - 480) * .055;
        this.lantern(c, x, y + 12, 9, i % 3 === 0 ? '#b8c9a8' : '#e38c56');
      }
      this.lantern(c, 137, 294, 21, '#eea05c'); this.lantern(c, 851, 288, 19, '#eea05c');
      c.fillStyle = '#302735'; c.fillRect(0, 416, 960, 124);
      const floor = c.createLinearGradient(0, 422, 0, 540); floor.addColorStop(0, '#453441'); floor.addColorStop(1, '#241f2d'); c.fillStyle = floor; c.fillRect(0, 423, 960, 117);
      for (let row = 0; row < 5; row++) {
        const y = 428 + row * 28; c.strokeStyle = '#73607021'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, y); c.lineTo(960, y); c.stroke();
        for (let x = row % 2 ? -50 : 10; x < 960; x += 105) { c.beginPath(); c.moveTo(x, y); c.lineTo(x - 18, y + 28); c.stroke(); }
      }
      c.strokeStyle = '#da946049'; c.lineWidth = 1.5; c.strokeRect(67, 450, 826, 65);
      c.strokeStyle = '#e6bd8d35'; c.beginPath(); c.moveTo(480, 452); c.lineTo(480, 516); c.stroke();
      c.setLineDash([5, 9]); c.strokeStyle = '#bd907f36'; c.beginPath(); c.moveTo(292, 452); c.lineTo(273, 515); c.moveTo(668, 452); c.lineTo(687, 515); c.stroke(); c.setLineDash([]);
      this.pumpkin(c, 34, 451, 25, 0, false); this.pumpkin(c, 68, 462, 14, -.2, false); this.pumpkin(c, 931, 450, 23, .15, false);
      for (const [x, y] of [[106, 443], [879, 462], [165, 494], [793, 506]]) { c.fillStyle = '#a77a5f'; c.beginPath(); c.ellipse(x, y, 4, 1.3, -.4, 0, TAU); c.fill(); }
      c.textAlign = 'center'; c.font = '8px monospace'; c.fillStyle = '#bd917266'; c.fillText('AI SIDE', 233, 530); c.fillStyle = '#a1c6b366'; c.fillText('YOUR SIDE', 727, 530);
    }

    building(c, x, y, w, h, shrine) {
      c.fillStyle = '#251f2f'; c.fillRect(x, y, w, h);
      c.fillStyle = '#5b4246'; c.fillRect(x + 16, y + 12, w - 32, h - 17);
      c.fillStyle = '#d49a5e'; c.globalAlpha = .5;
      for (let i = 0; i < 3; i++) { c.fillRect(x + 40 + i * 57, y + 37, 38, 61); }
      c.globalAlpha = 1; c.strokeStyle = '#322332'; c.lineWidth = 3;
      for (let xx = x + 40; xx < x + w - 30; xx += 19) { c.beginPath(); c.moveTo(xx, y + 37); c.lineTo(xx, y + 98); c.stroke(); }
      for (let yy = y + 52; yy < y + 98; yy += 15) { c.beginPath(); c.moveTo(x + 40, yy); c.lineTo(x + w - 30, yy); c.stroke(); }
      c.fillStyle = '#1b1a29'; c.beginPath(); c.moveTo(x - 25, y + 18); c.lineTo(x + w / 2, y - 52); c.lineTo(x + w + 25, y + 18); c.lineTo(x + w + 9, y + 29); c.lineTo(x + w / 2, y - 34); c.lineTo(x - 13, y + 29); c.closePath(); c.fill();
      c.strokeStyle = '#574254'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 19, y + 18); c.lineTo(x + w / 2, y - 43); c.lineTo(x + w + 19, y + 18); c.stroke();
      if (shrine) { c.fillStyle = '#9d6a50'; c.fillRect(x + w / 2 - 14, y - 6, 28, 38); c.fillStyle = '#ead1a3'; c.font = '11px serif'; c.textAlign = 'center'; c.fillText('夜', x + w / 2, y + 8); c.fillText('社', x + w / 2, y + 22); }
    }

    tree(c, x, y, side) {
      c.save(); c.translate(x, y); c.scale(side, 1); c.strokeStyle = '#201c2b'; c.lineWidth = 13;
      c.beginPath(); c.moveTo(0, 140); c.quadraticCurveTo(5, 10, 22, -85); c.moveTo(10, 12); c.lineTo(73, -41); c.lineTo(92, -99); c.moveTo(17, -36); c.lineTo(-40, -84); c.lineTo(-52, -131); c.stroke();
      c.fillStyle = '#3e2c40'; for (const [a, b, r] of [[31, -82, 33], [78, -67, 36], [-13, -97, 37], [-53, -129, 25]]) { c.beginPath(); c.arc(a, b, r, 0, TAU); c.fill(); } c.restore();
    }

    lantern(c, x, y, r, color) {
      this.glow(c, x, y, r * 3, '#ee9a5c20');
      c.fillStyle = color; c.beginPath(); c.ellipse(x, y, r * .78, r, 0, 0, TAU); c.fill();
      c.strokeStyle = '#4b2f4160'; c.lineWidth = 1;
      for (const off of [-.4, 0, .4]) { c.beginPath(); c.ellipse(x + off * r, y, r * .22, r * .9, 0, 0, TAU); c.stroke(); }
      c.fillStyle = '#362534'; c.fillRect(x - r * .5, y - r - 2, r, 4); c.fillRect(x - r * .5, y + r - 2, r, 4);
    }

    pumpkin(c, x, y, r, spin, bomb) {
      c.save(); c.translate(x, y); c.rotate(spin);
      if (bomb) this.glow(c, 0, 0, r * 2.7, '#ff9b5040');
      c.strokeStyle = '#7f4f30'; c.lineWidth = r * .19; c.beginPath(); c.moveTo(0, -r * .76); c.quadraticCurveTo(-r * .2, -r * 1.15, r * .18, -r * 1.24); c.stroke();
      c.fillStyle = '#e3733e'; c.beginPath(); c.ellipse(-r * .3, 0, r * .72, r * .83, 0, 0, TAU); c.ellipse(r * .3, 0, r * .72, r * .83, 0, 0, TAU); c.fill();
      c.fillStyle = '#f9984b'; c.beginPath(); c.ellipse(0, 0, r * .64, r * .9, 0, 0, TAU); c.fill();
      c.strokeStyle = '#cf643c'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(0, 0, r * .36, r * .86, 0, 0, TAU); c.stroke();
      // Deep triangular cuts and square teeth make the jack-o'-lantern readable in motion.
      c.fillStyle = '#482535';
      for (const side of [-1, 1]) { c.beginPath(); c.moveTo(side * r * .68, -r * .12); c.lineTo(side * r * .22, -r * .4); c.lineTo(side * r * .2, r * .04); c.closePath(); c.fill(); }
      c.beginPath(); c.moveTo(0, r * .02); c.lineTo(-r * .12, r * .2); c.lineTo(r * .12, r * .2); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(-r * .65, r * .26); c.lineTo(-r * .28, r * .36); c.lineTo(-r * .28, r * .49); c.lineTo(-r * .05, r * .49); c.lineTo(-r * .05, r * .35); c.lineTo(r * .18, r * .35); c.lineTo(r * .18, r * .49); c.lineTo(r * .37, r * .49); c.lineTo(r * .37, r * .32); c.lineTo(r * .65, r * .23); c.quadraticCurveTo(r * .4, r * .86, -r * .25, r * .68); c.quadraticCurveTo(-r * .53, r * .58, -r * .65, r * .26); c.fill();
      c.fillStyle = '#ffdc862b'; c.beginPath(); c.ellipse(-r * .33, -r * .42, r * .16, r * .09, -.4, 0, TAU); c.fill();
      c.restore();
    }

    fox(c, body) {
      let pose = body.attack > 0 ? 'hit' : !body.onGround ? 'jump' : Math.abs(body.vx) > 10 ? 'run' : 'stand';
      const img = this.images[pose];
      if (!img.complete || !img.naturalWidth) { c.fillStyle = palette.orange; c.fillRect(body.x - 19, body.y - 70, 38, 70); return; }
      const anchors = { stand: [150, 345], run: [176, 347], jump: [157, 300], hit: [168, 287] };
      const [ax, ay] = anchors[pose], scale = .31;
      c.save(); c.translate(body.x, body.y + (body.onGround && pose === 'run' ? Math.sin(this.time * 22) * 2 : 0)); c.scale(body.face === 1 ? -1 : 1, 1);
      c.drawImage(img, -ax * scale, -ay * scale, img.naturalWidth * scale, img.naturalHeight * scale); c.restore();
      if (body.attack > .1) { c.strokeStyle = '#ffc68c66'; c.lineWidth = 3; c.beginPath(); c.arc(body.x + 20, body.y - 50, 58, -1.3, .55); c.stroke(); }
    }

    ghost(c, body) {
      const image = this.ghostImage;
      if (!image.complete || !image.naturalWidth) return;
      // The author-selected PNG has a black RGB background. Screen blending
      // preserves its blue glow without editing or reimporting the source art.
      const scale = .112, bob = this.reducedMotion ? 0 : Math.sin(this.time * 3.1) * 4;
      c.save(); c.translate(body.x, body.y - 2 + bob); c.globalCompositeOperation = 'screen';
      c.drawImage(image, -627 * scale, -1067 * scale, 1254 * scale, 1254 * scale);
      c.restore();
      if (body.attack > 0) { c.strokeStyle = '#c1e9ff88'; c.lineWidth = 2; c.beginPath(); c.arc(body.x + 16, body.y - 47, 52, -1.2, .7); c.stroke(); }
    }

    event(event) {
      if (event.type === 'hit') {
        for (let i = 0; i < 12; i++) this.particles.push({ x: event.x, y: event.y, vx: (Math.random() - .5) * 190, vy: (Math.random() - .6) * 190, life: .4, maxLife: .4, size: 2 + Math.random() * 3, color: event.actor === 'player' ? palette.orange : palette.mint, rotation: 0, candy: false });
      }
      if (event.type === 'explosion') {
        this.shake = this.reducedMotion ? 0 : .55;
        for (let i = 0; i < (this.reducedMotion ? 35 : 110); i++) {
          const angle = Math.random() * TAU, force = 110 + Math.random() * 310;
          this.particles.push({ x: event.x, y: event.y, vx: Math.cos(angle) * force, vy: Math.sin(angle) * force - 100, life: 3.3, maxLife: 3.3, size: 3 + Math.random() * 6, color: [palette.orange, palette.mint, '#d6a9da', '#ffdb8f'][i % 4], rotation: Math.random() * TAU, candy: i % 3 === 0 });
        }
      }
    }

    render(game, dt) {
      if (!game.paused) this.time += dt;
      const c = this.ctx;
      c.save();
      if (this.shake > 0 && !game.paused) { this.shake = Math.max(0, this.shake - dt); c.translate(Math.sin(this.time * 91) * this.shake * 7, Math.cos(this.time * 73) * this.shake * 5); }
      c.drawImage(this.background, 0, 0);
      // A few drifting fireflies instead of rain over the play area.
      for (let i = 0; i < 9; i++) { const x = ((i * 121 + this.time * (i % 2 ? 3 : -2)) % 960 + 960) % 960, y = 170 + (i * 37) % 215 + Math.sin(this.time + i) * 9; c.globalAlpha = .2 + Math.sin(this.time * .7 + i) * .12; c.fillStyle = i % 2 ? palette.mint : palette.orange; c.fillRect(x, y, 2, 2); } c.globalAlpha = 1;
      for (const body of [game.player, game.ghost]) {
        c.fillStyle = '#14132066'; c.beginPath(); c.ellipse(body.x, 455, 28 - (452 - body.y) * .03, 6, 0, 0, TAU); c.fill();
      }
      // The thin side-on net is the physical separator at x=480.
      c.fillStyle = '#c9d8c926'; c.fillRect(468, 294, 24, 158); c.strokeStyle = '#bcdfca55'; c.lineWidth = 1;
      for (let yy = 299; yy < 452; yy += 13) { c.beginPath(); c.moveTo(468, yy); c.lineTo(492, yy); c.stroke(); }
      for (let xx = 468; xx <= 492; xx += 8) { c.beginPath(); c.moveTo(xx, 294); c.lineTo(xx, 452); c.stroke(); }
      c.fillStyle = '#bacbbb'; c.fillRect(477, 290, 6, 163); c.fillStyle = '#ead7b5'; c.fillRect(475, 290, 10, 5); c.fillStyle = '#68505b'; c.fillRect(471, 451, 18, 4);
      this.fox(c, game.player); this.ghost(c, game.ghost);
      c.font = '8px monospace'; c.textAlign = 'center'; c.fillStyle = '#f5d2ad99'; c.fillText('YOU', game.player.x, game.player.y - 110); c.fillStyle = '#c1e7d299'; c.fillText(`AI · ${game.difficulty}/3`, game.ghost.x, game.ghost.y - 112);
      if (game.state === 'playing') {
        if (!game.paused) { this.trail.push({ x: game.ball.x, y: game.ball.y }); if (this.trail.length > 9) this.trail.shift(); }
        this.trail.forEach((p, i) => { c.globalAlpha = i / this.trail.length * .16; c.fillStyle = palette.orange; c.beginPath(); c.arc(p.x, p.y, 5 + i * .7, 0, TAU); c.fill(); }); c.globalAlpha = 1;
      } else this.trail = [];
      if (!['explosion', 'celebration'].includes(game.state)) {
        const b = game.ball, bomb = game.state === 'countdown';
        const radius = bomb ? 48 + Math.sin(this.time * 16) * (this.reducedMotion ? 0 : 2) : b.r;
        const y = game.state === 'ready' ? b.y + Math.sin(this.time * 1.4) * 7 : b.y;
        this.pumpkin(c, b.x, y, radius, bomb ? Math.sin(this.time * 25) * .04 : b.spin * .12, bomb);
        if (bomb) {
          c.strokeStyle = '#bd9b73'; c.lineWidth = 3; c.beginPath(); c.moveTo(b.x + 6, y - radius - 4); c.quadraticCurveTo(b.x + 34, y - radius - 30, b.x + 42, y - radius - 12); c.stroke();
          this.glow(c, b.x + 42, y - radius - 12, 20, '#ffbd7b88'); c.fillStyle = '#ffe7ae'; c.beginPath(); c.arc(b.x + 42, y - radius - 12, 4, 0, TAU); c.fill();
        }
      }
      if (game.state === 'explosion') {
        const t = game.stateTime; c.strokeStyle = `rgba(255,182,112,${Math.max(0, .65 - t)})`; c.lineWidth = 3; c.beginPath(); c.arc(480, 230, 35 + t * 210, 0, TAU); c.stroke();
      }
      const fxDt = game.paused ? 0 : dt;
      for (const p of this.particles) {
        p.life -= fxDt; p.x += p.vx * fxDt; p.y += p.vy * fxDt; p.vy += 160 * fxDt; p.rotation += fxDt * 3;
        c.save(); c.globalAlpha = Math.max(0, Math.min(1, p.life)); c.translate(p.x, p.y); c.rotate(p.rotation); c.fillStyle = p.color;
        if (p.candy) { c.fillRect(-p.size, -p.size * .6, p.size * 2, p.size * 1.2); c.beginPath(); c.moveTo(-p.size, 0); c.lineTo(-p.size * 1.8, -p.size * .8); c.lineTo(-p.size * 1.8, p.size * .8); c.closePath(); c.fill(); c.beginPath(); c.moveTo(p.size, 0); c.lineTo(p.size * 1.8, -p.size * .8); c.lineTo(p.size * 1.8, p.size * .8); c.closePath(); c.fill(); }
        else c.fillRect(-p.size / 2, -p.size / 2, p.size, p.size); c.restore();
      }
      this.particles = this.particles.filter(p => p.life > 0);
      c.restore();
    }
  }
  root.PumpkinVolleyRenderer = Renderer;
})(window);
