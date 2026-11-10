/* Full-page animated backgrounds, one per album, drawn in code to match each cover.
   window.backdrop.set(albumId) starts one; set(null) stops it. Returns true if the album has one. */
(() => {
  const cv = document.getElementById('backdrop'), ctx = cv.getContext('2d');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2;
  const rng = s => () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  let cur = null, state = null, W = 0, H = 0, u = 1, last = 0, running = false;

  const scenes = {};

  /* ---------- First Light: a turning universe of note-rings and light ---------- */
  scenes['first-light'] = {
    init() {
      const R = rng(42);
      const stars = Array.from({ length: 460 }, () => ({ x: R(), y: R(), r: R() * R() * 1.5 + 0.3, p: R() * TAU, s: 0.4 + R() * 2 }));
      const cols = ['#5a46ff', '#7448ff', '#9a4cff', '#c44cff', '#f054e0', '#ff62b4', '#ff8470', '#ffa650', '#ffc45c'];
      const rings = [];
      for (let k = 0; k < 17; k++) {
        const segs = []; let a = R() * TAU;
        while (a < TAU * 2) {
          const len = 0.04 + R() * 0.2;
          if (R() < 0.72) segs.push({ a, len, w: R() < 0.22 ? 3 : 1.2, j: (R() - 0.5) * 0.014 });
          a += len + 0.03 + R() * 0.16;
        }
        rings.push({ segs, col: cols[Math.floor(k / 17 * cols.length)], sp: (k % 2 ? 1 : -1) * (0.01 + R() * 0.03), r: 0.15 + k * 0.03 });
      }
      const sparks = Array.from({ length: 300 }, () => ({ b: R() < 0.62 ? 0 : 1, a: R() - 0.5, d: R(), v: 0.04 + R() * 0.1, s: R() * 1.6 + 0.6 }));
      const rays = Array.from({ length: 110 }, () => ({ a: R() * TAU, l: 0.02 + R() * R() * 0.2, p: R() * TAU }));
      return { stars, rings, sparks, rays };
    },
    draw(st, t, dt) {
      const cx = W / 2, cy = H / 2, U = Math.max(Math.min(W, H), Math.max(W, H) * 0.72);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      ctx.fillStyle = '#06030d'; ctx.fillRect(0, 0, W, H);
      let g = ctx.createRadialGradient(cx, cy, 0, cx, cy, U * 0.95);
      g.addColorStop(0, 'rgba(96,44,170,.42)'); g.addColorStop(0.5, 'rgba(60,20,110,.2)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = '#f4ecff';
      for (const s of st.stars) {
        ctx.globalAlpha = 0.25 + 0.6 * (0.5 + 0.5 * Math.sin(t * s.s + s.p));
        ctx.fillRect(s.x * W, s.y * H, s.r * u, s.r * u);
      }

      ctx.globalCompositeOperation = 'lighter';
      const beams = [
        { ang: Math.PI / 2 + 0.14 + 0.05 * Math.sin(t * 0.11), half: 0.4, col: '255,120,225', hot: '255,214,170' },
        { ang: Math.PI * 1.05 + 0.04 * Math.sin(t * 0.09 + 2), half: 0.2, col: '255,176,86', hot: '255,224,160' },
      ];
      for (const [i, b] of beams.entries()) {
        const pulse = 0.75 + 0.25 * Math.sin(t * 0.7 + i * 2);
        g = ctx.createRadialGradient(cx, cy, U * 0.1, cx, cy, U * 1.5);
        g.addColorStop(0, `rgba(${b.col},0)`); g.addColorStop(0.2, `rgba(${b.col},${0.3 * pulse})`);
        g.addColorStop(0.45, `rgba(${b.hot},${0.2 * pulse})`); g.addColorStop(1, `rgba(${b.col},0)`);
        ctx.globalAlpha = 1; ctx.fillStyle = g;
        for (const k of [1, 0.55]) {                     // a soft cone with a hotter core
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, U * 1.6, b.ang - b.half * k, b.ang + b.half * k); ctx.closePath(); ctx.fill();
        }
      }
      const bright = a => {
        let v = 0.2;
        for (const b of beams) { let d = Math.abs(((a - b.ang) % TAU + TAU + Math.PI) % TAU - Math.PI); v += Math.exp(-(d * d) / (b.half * b.half * 0.9)); }
        return v;
      };

      ctx.lineCap = 'butt';
      for (const ring of st.rings) {
        const rot = t * ring.sp;
        ctx.strokeStyle = ring.col;
        for (const s of ring.segs) {
          const a0 = s.a + rot, al = Math.min(1, bright(a0 + s.len / 2) * (0.75 + 0.25 * Math.sin(t * 1.3 + s.a * 7)));
          const r = ring.r * U * (1 + s.j);
          ctx.beginPath(); ctx.arc(cx, cy, r, a0, a0 + s.len);
          ctx.globalAlpha = al * 0.22; ctx.lineWidth = s.w * 5 * u; ctx.stroke();
          ctx.globalAlpha = al; ctx.lineWidth = s.w * u; ctx.stroke();
        }
      }

      ctx.strokeStyle = '#efe6ff'; ctx.lineWidth = 0.8 * u;
      const r0 = U * 0.118;
      for (const r of st.rays) {
        ctx.globalAlpha = 0.14 + 0.2 * (0.5 + 0.5 * Math.sin(t * 0.9 + r.p));
        const a = r.a + t * 0.01, c = Math.cos(a), s = Math.sin(a);
        ctx.beginPath(); ctx.moveTo(cx + c * r0, cy + s * r0); ctx.lineTo(cx + c * (r0 + r.l * U), cy + s * (r0 + r.l * U)); ctx.stroke();
      }

      ctx.fillStyle = '#fff2dc';
      for (const p of st.sparks) {
        p.d = (p.d + p.v * dt) % 1;
        const b = beams[p.b], a = b.ang + p.a * b.half * 1.7, r = (0.2 + p.d * 1.15) * U;
        ctx.globalAlpha = Math.sin(p.d * Math.PI) * 0.85;
        ctx.fillRect(cx + Math.cos(a) * r, cy + Math.sin(a) * r, p.s * u, p.s * u);
      }

      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      ctx.fillStyle = '#05030a'; ctx.beginPath(); ctx.arc(cx, cy, r0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#f6ecd8'; ctx.lineWidth = 1.5 * u; ctx.stroke();
    },
  };

  /* ---------- Landfall: sunrise over a planet's edge, under a sky thick with stars ---------- */
  scenes.landfall = {
    init() {
      const R = rng(7);
      const stars = Array.from({ length: 1300 }, () => ({ x: R(), y: R() * 0.8, r: Math.pow(R(), 3) * 2.6 + 0.35, p: R() * TAU, s: 0.4 + R() * 2.2 }));
      const ripples = Array.from({ length: 90 }, () => ({ y: R(), x: R() - 0.5, w: R(), p: R() * TAU }));
      return { stars, ripples, shoot: null, next: 2.5 };
    },
    draw(st, t, dt) {
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      let g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#120e1e'); g.addColorStop(0.4, '#33253a'); g.addColorStop(0.62, '#684852'); g.addColorStop(1, '#0a0e1c');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      const hy = H * 0.64, PR = Math.max(W, H) * 1.5, pcx = W / 2, pcy = hy + PR;
      const horizon = x => pcy - Math.sqrt(Math.max(0, PR * PR - (x - pcx) * (x - pcx)));
      const sx = W * 0.57, sy = horizon(sx), pulse = 0.85 + 0.15 * Math.sin(t * 0.6);

      ctx.fillStyle = '#ffffff';
      for (const s of st.stars) {
        const x = ((s.x + t * 0.0016 * (0.4 + s.r * 0.3)) % 1) * W, y = s.y * H;
        if (y > horizon(x) - 2) continue;
        const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * s.s + s.p));
        ctx.globalAlpha = a; ctx.fillRect(x, y, s.r * u, s.r * u);
        if (s.r > 2.1) { ctx.globalAlpha = a * 0.5; ctx.fillRect(x - 3 * u, y + s.r * u / 2 - 0.4, 6 * u + s.r * u, 0.8); ctx.fillRect(x + s.r * u / 2 - 0.4, y - 3 * u, 0.8, 6 * u + s.r * u); }
      }

      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1;
      g = ctx.createRadialGradient(sx, sy, 0, sx, sy, W * 0.55);
      g.addColorStop(0, `rgba(255,232,200,${0.6 * pulse})`); g.addColorStop(0.18, `rgba(240,180,170,${0.28 * pulse})`); g.addColorStop(1, 'rgba(120,80,120,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      // the planet, then the thin bright line of its atmosphere
      ctx.globalCompositeOperation = 'source-over';
      g = ctx.createLinearGradient(0, hy - 20, 0, H);
      g.addColorStop(0, '#22345a'); g.addColorStop(0.25, '#101a33'); g.addColorStop(1, '#04060d');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(pcx, pcy, PR, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(170,205,255,1)';
      ctx.beginPath(); ctx.arc(pcx, pcy, PR, Math.PI * 1.2, Math.PI * 1.8);
      ctx.globalAlpha = 0.1; ctx.lineWidth = 14 * u; ctx.stroke();
      ctx.globalAlpha = 0.55; ctx.lineWidth = 1.6 * u; ctx.stroke();

      // the sun breaking the edge
      ctx.globalAlpha = 1;
      g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 70 * u);
      g.addColorStop(0, `rgba(255,255,255,${pulse})`); g.addColorStop(0.25, `rgba(255,236,200,${0.6 * pulse})`); g.addColorStop(1, 'rgba(255,200,150,0)');
      ctx.fillStyle = g; ctx.fillRect(sx - 80 * u, sy - 80 * u, 160 * u, 160 * u);
      g = ctx.createLinearGradient(sx - W * 0.32, 0, sx + W * 0.32, 0);
      g.addColorStop(0, 'rgba(255,230,200,0)'); g.addColorStop(0.5, `rgba(255,240,215,${0.75 * pulse})`); g.addColorStop(1, 'rgba(255,230,200,0)');
      ctx.fillStyle = g; ctx.fillRect(sx - W * 0.32, sy - u, W * 0.64, 2 * u);
      ctx.strokeStyle = 'rgba(255,240,215,1)'; ctx.lineWidth = u;
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * TAU + t * 0.05, l = (40 + 30 * Math.sin(t * 0.8 + i * 1.7)) * u;
        ctx.globalAlpha = 0.25 * pulse; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(a) * l, sy + Math.sin(a) * l * 0.6); ctx.stroke();
      }

      // light on the water
      for (const r of st.ripples) {
        const f = r.y, y = sy + 10 * u + f * (H - sy), spread = (12 + f * (H - sy) * 0.4), w = (5 + r.w * 34) * u * (0.4 + f);
        ctx.globalAlpha = (0.12 + 0.4 * (0.5 + 0.5 * Math.sin(t * 2.2 * (0.5 + r.w) + r.p))) * (1 - f * 0.55);
        ctx.fillStyle = '#ffe2b8'; ctx.fillRect(sx + r.x * spread * 2 - w / 2, y, w, 1.6 * u);
      }

      // now and then, a shooting star
      st.next -= dt;
      if (st.next <= 0 && !st.shoot) { st.shoot = { x: W * (0.08 + Math.random() * 0.5), y: H * (0.04 + Math.random() * 0.22), life: 0 }; st.next = 5 + Math.random() * 7; }
      if (st.shoot) {
        const s = st.shoot; s.life += dt; s.x += W * 0.42 * dt; s.y += H * 0.2 * dt;
        const a = Math.sin(Math.min(1, s.life / 0.9) * Math.PI);
        g = ctx.createLinearGradient(s.x, s.y, s.x - W * 0.09, s.y - H * 0.043);
        g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalAlpha = 1; ctx.strokeStyle = g; ctx.lineWidth = 1.6 * u;
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - W * 0.09, s.y - H * 0.043); ctx.stroke();
        if (s.life > 0.9) st.shoot = null;
      }
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    },
  };

  /* ---------- Loamlight: the cover's blocky world at dusk, lava glowing underneath ---------- */
  scenes.loamlight = {
    pixel: true,
    init() {
      const R = rng(3), B = 4;                              // B = block size
      const bg = document.createElement('canvas'); bg.width = W; bg.height = H;
      const g = bg.getContext('2d'), P = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x | 0, y | 0, w, h); };
      const skyH = Math.round(H * 0.66);
      const sky = ['#1c1238', '#27164a', '#3a1c5e', '#55236e', '#782d78', '#a03c7c', '#c8507a', '#e46c6c', '#f28e5c', '#f8b262', '#fcd27c'];
      const band = Math.ceil(skyH / sky.length);
      sky.forEach((c, i) => { P(0, i * band, W, band, c); if (i) for (let x = i % 2; x < W; x += 2) P(x, i * band, 1, 1, sky[i - 1]); });

      const sunX = Math.round(W * 0.7 / B) * B, sunY = skyH - 30;   // a square sun, low in the sky
      P(sunX - 4, sunY - 4, 28, 28, 'rgba(255,236,170,.25)'); P(sunX, sunY, 20, 20, '#ffe9a6'); P(sunX + 4, sunY + 4, 12, 12, '#fff6d0');

      const lavaTop = H - 16;
      let h = Math.round(H * 0.42 / B) * B; const cave = { x: Math.round(W * 0.3), y: 0 };
      for (let x = 0, n = 0; x < W; x += B, n++) {
        if (R() < 0.45) h += (R() < 0.5 ? -B : B) * (R() < 0.2 ? 2 : 1);
        h = Math.max(H * 0.3, Math.min(H * 0.5, h));
        const top = H - h;
        P(x, top, B, B, '#5fae3c'); P(x, top, B, 1, '#86d24e');
        for (let y = top + B; y < top + B * 4; y += B) P(x, y, B, B, (n + y / B) % 2 ? '#8a5a34' : '#7d5030');
        for (let y = top + B * 4; y < lavaTop; y += B) {
          const k = R();
          P(x, y, B, B, k < 0.035 ? '#e8c04a' : k < 0.06 ? '#48bcbc' : k < 0.3 ? '#4c4c58' : (n + y / B) % 2 ? '#5c5c68' : '#565662');
        }
        // blocky trees and one small house on the surface
        if (n % 9 === 4 && R() < 0.8) {
          P(x, top - 12, B, 12, '#5a3a20'); P(x - 8, top - 24, 20, 12, '#2f7a3a'); P(x - 4, top - 28, 12, 4, '#3f9a48'); P(x - 8, top - 24, 20, 2, '#3f9a48');
        }
        if (Math.abs(x - W * 0.16) < B / 2) {
          P(x, top - 12, 16, 12, '#b08a5a'); P(x - 4, top - 16, 24, 4, '#6a3a2a'); P(x, top - 20, 16, 4, '#6a3a2a');
          P(x + 4, top - 8, 4, 4, '#ffe27a'); P(x + 10, top - 8, 4, 8, '#5a3a20');
        }
        if (Math.abs(x - cave.x) < B / 2) cave.y = top + B * 9;
      }
      for (let y = -12; y <= 12; y += B) {                  // carve the cave
        const w = Math.round(22 * Math.sqrt(1 - (y * y) / 170) / B) * B;
        P(cave.x - w, cave.y + y, w * 2, B, '#231d2a');
      }
      P(cave.x - 2, cave.y + 6, 4, 6, '#c8c0a8'); P(cave.x - 2, cave.y + 2, 4, 4, '#9fe0ff');   // the crystal
      const stars = Array.from({ length: Math.round(W / 3) }, () => ({ x: R() * W | 0, y: R() * skyH * 0.55 | 0, p: R() * TAU, s: 0.5 + R() * 2, big: R() < 0.2 }));
      const embers = Array.from({ length: Math.round(W / 5) }, () => ({ x: R() * W, y: lavaTop - R() * 70, v: 6 + R() * 14, p: R() * TAU }));
      return { bg, stars, embers, cave, lavaTop, B };
    },
    draw(st, t, dt) {
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      ctx.drawImage(st.bg, 0, 0);
      for (const s of st.stars) {
        const a = Math.sin(t * s.s + s.p);
        if (a < -0.3) continue;
        ctx.fillStyle = a > 0.6 ? '#ffffff' : '#cdbcf0';
        ctx.fillRect(s.x, s.y, s.big ? 2 : 1, s.big ? 2 : 1);
      }
      const fl = 0.6 + 0.4 * Math.sin(t * 3.1) * Math.sin(t * 0.7);
      for (let i = 4; i > 0; i--) {
        ctx.fillStyle = `rgba(255,214,140,${0.05 + 0.03 * fl})`;
        ctx.fillRect(st.cave.x - i * 6, st.cave.y + 4 - i * 4, i * 12, i * 8);
      }
      const lava = ['#e8421a', '#ff6a1a', '#ff961e', '#ffc23a', '#ffe66a'], B = st.B;
      for (let y = st.lavaTop, row = 0; y < H; y += B, row++) {
        for (let x = 0; x < W; x += B) {
          const v = Math.sin(x * 0.11 + t * 1.2 + row * 1.9) + Math.sin(x * 0.047 - t * 0.8 + row);
          ctx.fillStyle = lava[Math.max(0, Math.min(4, Math.round(2 + v * 1.2 - row * 0.3 + 0.6)))];
          ctx.fillRect(x, y, B, B);
        }
      }
      for (let i = 0; i < 6; i++) { ctx.fillStyle = `rgba(255,120,30,${0.22 - i * 0.035})`; ctx.fillRect(0, st.lavaTop - (i + 1) * 4, W, 4); }
      for (const e of st.embers) {
        e.y -= e.v * dt; if (e.y < st.lavaTop - 80) { e.y = st.lavaTop; e.x = Math.random() * W; }
        const k = (st.lavaTop - e.y) / 80;
        ctx.fillStyle = `rgba(255,${200 - k * 90 | 0},80,${1 - k})`;
        ctx.fillRect(e.x + Math.sin(t * 2 + e.p) * 3 | 0, e.y | 0, 1, 1);
      }
    },
  };

  function resize() {
    if (!cur) return;
    const sc = scenes[cur];
    if (sc.pixel) { H = 200; W = Math.max(120, Math.round(H * innerWidth / innerHeight)); u = 1; }
    else { const k = Math.min(1, 1400 / innerWidth); W = Math.round(innerWidth * k); H = Math.round(innerHeight * k); u = Math.max(1, W / 1100); }
    cv.width = W; cv.height = H;
    cv.style.imageRendering = sc.pixel ? 'pixelated' : 'auto';
    state = sc.init();
    sc.draw(state, 12, 0);                                  // paint one frame straight away
  }
  function loop(ts) {
    if (!cur) { running = false; return; }
    requestAnimationFrame(loop);
    if (document.hidden || ts - last < 33) return;
    const dt = Math.min(0.1, (ts - last) / 1000); last = ts;
    scenes[cur].draw(state, ts / 1000, dt);
  }
  let rz;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(resize, 150); });

  window.backdrop = {
    set(id) {
      const next = scenes[id] ? id : null;
      if (next === cur) return !!cur;
      cur = next;
      if (cur) { resize(); if (!still && !running) { running = true; requestAnimationFrame(loop); } }
      return !!cur;
    },
  };
})();
