/* ============ pixel forest in the rain ============ */
(() => {
  const cv = document.getElementById('scene');
  const ctx = cv.getContext('2d');
  const H = 180;                       // the scene is always 180 "pixels" tall
  const GROUND = 146;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W, bg, drops, splashes, cabin, visible = true, last = 0;

  const rng = seed => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;

  function pine(g, x, base, h, col, hi, trunkCol) {
    const trunkH = Math.round(h * 0.16), trunkW = Math.max(1, Math.round(h / 20));
    g.fillStyle = trunkCol;
    g.fillRect(x - (trunkW >> 1), base - trunkH, trunkW, trunkH);
    const bodyH = h - trunkH + 2, top = base - h;
    const tiers = Math.max(3, Math.round(h / 13)), th = bodyH / tiers, maxHalf = h * 0.27;
    for (let y = 0; y < bodyH; y++) {
      const t = Math.floor(y / th), f = (y - t * th) / th;
      const half = Math.round(maxHalf * (t + f * 1.7) / (tiers + 0.7));
      g.fillStyle = col;
      g.fillRect(x - half, top + y, half * 2 + 1, 1);
      if (hi && half > 1 && y % 2 === 0) {
        g.fillStyle = hi;
        g.fillRect(x - half + 1, top + y, Math.ceil(half * 0.45), 1);
      }
    }
  }

  function treeline(g, R, base, hMin, hMax, gapMin, gapMax, col, hi, trunk) {
    for (let x = -10; x < W + 10; x += gapMin + R() * (gapMax - gapMin)) {
      pine(g, Math.round(x), base + Math.round(R() * 4), Math.round(hMin + R() * (hMax - hMin)), col, hi, trunk);
    }
  }

  function drawCabin(g, cx) {
    const y = GROUND + 2, w = 28, h = 14, x = cx - w / 2;
    g.fillStyle = '#5b3f2c'; g.fillRect(x, y - h, w, h);                 // walls
    g.fillStyle = '#4a3122'; for (let i = 3; i < h; i += 4) g.fillRect(x, y - i, w, 1);
    for (let i = 0; i < 9; i++) {                                         // roof
      g.fillStyle = i === 0 ? '#6f9d5c' : (i % 2 ? '#3a2a26' : '#46332c');
      g.fillRect(x - 3 + (8 - i) * 1.6 | 0, y - h - 9 + i, w + 6 - ((8 - i) * 3.2 | 0), 1);
    }
    g.fillStyle = '#6f9d5c'; g.fillRect(x + 4, y - h - 8, 9, 1);          // moss on the roof
    g.fillStyle = '#46332c'; g.fillRect(x + w - 8, y - h - 14, 4, 8);     // chimney
    g.fillStyle = '#2f1f16'; g.fillRect(x + 4, y - 9, 6, 9);              // door
    g.fillStyle = '#f2c46d'; g.fillRect(x + 5 + 4, y - 5, 1, 1);          // door knob
    cabin = { wx: x + 15, wy: y - 10, sx: x + w - 6, sy: y - h - 15 };
  }

  function build() {
    const r = cv.getBoundingClientRect();
    if (!r.width || !r.height) return;
    W = Math.max(140, Math.round(H * r.width / r.height));
    cv.width = W; cv.height = H;
    bg = document.createElement('canvas'); bg.width = W; bg.height = H;
    const g = bg.getContext('2d'), R = rng(11);

    // sky: flat bands with a checkered row between them
    const sky = ['#27433f', '#2c4b43', '#335548', '#3c604e', '#476c55', '#54795d', '#62865f'];
    const bandH = Math.ceil(GROUND / sky.length);
    sky.forEach((c, i) => {
      g.fillStyle = c; g.fillRect(0, i * bandH, W, bandH);
      if (i) { g.fillStyle = sky[i - 1]; for (let x = i % 2; x < W; x += 2) g.fillRect(x, i * bandH, 1, 1); }
    });

    treeline(g, R, 122, 28, 52, 7, 13, '#507a5c', null, '#507a5c');           // far, misty
    treeline(g, R, 134, 46, 78, 12, 22, '#3b5f48', '#44694f', '#3b5f48');     // middle
    g.fillStyle = '#1e3024'; g.fillRect(0, GROUND, W, H - GROUND);            // ground
    treeline(g, R, GROUND + 2, 62, 104, 30, 58, '#284434', '#345640', '#2a1d16'); // near

    drawCabin(g, Math.round(W * 0.66));

    // grass tufts and puddles
    for (let i = 0; i < W * 1.2; i++) {
      g.fillStyle = R() < 0.5 ? '#35573c' : '#2b4636';
      g.fillRect(R() * W | 0, GROUND + (R() * R() * (H - GROUND)) | 0, 1, 1 + (R() * 2 | 0));
    }
    for (let i = 0; i < W / 55; i++) {
      const px = R() * W | 0, py = GROUND + 8 + (R() * 20 | 0), pw = 8 + (R() * 12 | 0);
      g.fillStyle = '#2f4f4a'; g.fillRect(px, py, pw, 2); g.fillRect(px + 2, py - 1, pw - 4, 4);
      g.fillStyle = '#4d7670'; g.fillRect(px + 3, py, pw >> 1, 1);
    }
    // ferns along the bottom edge
    for (let x = 0; x < W; x += 3 + (R() * 4 | 0)) {
      const fh = 3 + (R() * 7 | 0);
      g.fillStyle = R() < 0.3 ? '#6f9d5c' : '#3d6644';
      g.fillRect(x, H - fh, 1, fh); g.fillRect(x + 1, H - fh + 1, 1, 2); g.fillRect(x - 1, H - fh + 2, 1, 2);
    }

    const D = rng(5);
    drops = Array.from({ length: Math.round(W * 0.32) }, () => newDrop(D, true));
    splashes = [];
    frame(0, true);                    // paint straight away so the scene is never blank
  }

  function newDrop(R, anywhere) {
    const far = R() < 0.4;
    return { x: R() * (W + 40), y: anywhere ? R() * H : -R() * 30, v: far ? 3 : 4.5 + R() * 1.5,
             len: far ? 2 : 4, far, end: GROUND + 2 + R() * (H - GROUND - 6), R };
  }

  function frame(t, once) {
    if (!once) requestAnimationFrame(frame);
    if (!bg || (!once && (!visible || t - last < 33))) return;        // ~30 fps is plenty for pixels
    last = t;
    ctx.drawImage(bg, 0, 0);

    // the lit window, its glow, and the light it throws on the wet ground
    const flick = once ? 0.5 : 0.5 + 0.5 * Math.sin(t / 420) * Math.sin(t / 97);
    const { wx, wy, sx, sy } = cabin;
    for (let i = 4; i > 0; i--) {
      ctx.fillStyle = `rgba(242,196,109,${0.035 + 0.012 * flick})`;
      ctx.fillRect(wx - i * 4, wy - i * 3, 7 + i * 8, 6 + i * 6);
    }
    ctx.fillStyle = flick > 0.7 ? '#ffd98a' : '#f2c46d'; ctx.fillRect(wx, wy, 7, 6);
    ctx.fillStyle = '#b9792f'; ctx.fillRect(wx + 3, wy, 1, 6); ctx.fillRect(wx, wy + 3, 7, 1);
    ctx.fillStyle = 'rgba(242,196,109,.28)';
    for (let i = 0; i < 6; i++) for (let x = (i % 2); x < 11 + i * 2; x += 2) ctx.fillRect(wx - 2 - i + x, wy + 12 + i * 2, 1, 1);

    // chimney smoke
    if (!once) for (let i = 0; i < 5; i++) {
      const p = ((t / 2600) + i / 5) % 1;
      ctx.fillStyle = `rgba(200,214,198,${0.5 * (1 - p)})`;
      ctx.fillRect(Math.round(sx + Math.sin(p * 5 + i) * 2 + p * 6), Math.round(sy - p * 26), 2, 2);
    }

    // rain
    for (const d of drops) {
      if (!once) { d.y += d.v; d.x -= d.v * 0.22; }
      if (d.y > d.end) {
        if (!d.far) splashes.push({ x: d.x | 0, y: d.end | 0, age: 0 });
        Object.assign(d, newDrop(d.R, false));
      }
      ctx.fillStyle = d.far ? 'rgba(170,200,190,.25)' : 'rgba(205,228,220,.42)';
      for (let i = 0; i < d.len; i++) ctx.fillRect(Math.round(d.x - i * 0.25), Math.round(d.y - i), 1, 1);
    }
    ctx.fillStyle = 'rgba(205,228,220,.5)';
    splashes = splashes.filter(s => s.age++ < 6);
    for (const s of splashes) {
      const k = s.age < 3 ? 1 : 2;
      ctx.fillRect(s.x - k, s.y - (3 - k), 1, 1); ctx.fillRect(s.x + k, s.y - (3 - k), 1, 1);
    }
  }

  let rz;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(build, 150); });
  new IntersectionObserver(e => { visible = e[0].isIntersecting; }).observe(cv);
  build();
  if (!still) requestAnimationFrame(frame);
  // where the cabin window sits, as a fraction of the scene (the enter animation zooms here)
  window.scene = { build, focus: () => [(cabin.wx + 3.5) / W, (cabin.wy + 3) / H] };
})();

/* ============ rain sound (made in the browser, no file) ============ */
(() => {
  const btn = document.getElementById('rain-toggle');
  let ac, gain;
  btn.addEventListener('click', () => {
    const on = btn.getAttribute('aria-pressed') !== 'true';
    if (!ac) {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      const buf = ac.createBuffer(2, ac.sampleRate * 4, ac.sampleRate);
      for (let c = 0; c < 2; c++) {
        const d = buf.getChannelData(c); let b = 0;
        for (let i = 0; i < d.length; i++) { b = 0.985 * b + 0.015 * (Math.random() * 2 - 1); d[i] = b * 6 + (Math.random() * 2 - 1) * 0.12; }
      }
      const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
      const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 350;
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 6500;
      gain = ac.createGain(); gain.gain.value = 0;
      src.connect(hp).connect(lp).connect(gain).connect(ac.destination); src.start();
    }
    ac.resume();
    gain.gain.setTargetAtTime(on ? 0.16 : 0, ac.currentTime, 0.4);
    btn.setAttribute('aria-pressed', on);
    btn.textContent = on ? 'Turn rain sound off' : 'Turn rain sound on';
  });
})();

/* ============ projects and player ============ */
(() => {
  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const $ = id => document.getElementById(id);
  const audio = $('audio'), player = $('player'), seek = $('seek');
  const queue = [];          // every track on the page, in order
  let current = -1, dragging = false;

  // a small pixel landscape for each album cover, in the album's own colours
  function drawCover(cv, colors, seed) {
    const S = 48, g = cv.getContext('2d'), c = colors || ['#27433f', '#54795d', '#f2c46d', '#6f9d5c', '#5b3f2c'];
    cv.width = cv.height = S;
    const R = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    g.fillStyle = c[0]; g.fillRect(0, 0, S, S);
    g.fillStyle = c[1]; g.fillRect(0, 16, S, S);
    g.fillStyle = c[2]; g.fillRect(30, 8, 8, 12); g.fillRect(28, 10, 12, 8);
    for (let x = 0, h = 18; x < S; x += 4) {
      h = Math.max(10, Math.min(26, h + ((R() * 3 | 0) - 1) * 2));
      g.fillStyle = c[3]; g.fillRect(x, S - h, 4, 2);
      g.fillStyle = c[4]; g.fillRect(x, S - h + 2, 4, h);
      g.fillStyle = 'rgba(0,0,0,.18)';
      for (let y = S - h + 5; y < S; y += 4) g.fillRect(x + (R() * 3 | 0), y, 1, 1);
    }
  }

  const main = $('projects');
  const shelf = document.createElement('section');
  shelf.className = 'shelf'; shelf.id = 'albums';
  shelf.innerHTML = '<h2>Albums</h2><div class="albums"></div>';
  main.append(shelf);

  for (const [n, p] of window.PROJECTS.entries()) {
    const total = p.tracks.reduce((a, t) => a + t.seconds, 0);
    const card = document.createElement('a');
    card.className = 'album'; card.href = '#' + p.id;
    card.innerHTML = `<canvas aria-hidden="true"></canvas><strong>${p.title}</strong>
      <span>${p.tracks.length ? `${p.tracks.length} tracks, ${Math.round(total / 60)} min` : 'In the works'}</span>`;
    drawCover(card.firstChild, p.cover, n * 97 + 13);
    shelf.lastChild.append(card);

    const sec = document.createElement('section');
    sec.className = 'project'; sec.id = p.id;
    if (!p.tracks.length) {            // a project with no audio yet
      sec.innerHTML = `<h2>${p.title}</h2><p class="blurb">${p.blurb}</p>`;
      main.append(sec);
      continue;
    }
    sec.innerHTML = `
      <h2>${p.title}</h2>
      <p class="blurb">${p.blurb}</p>
      <div class="meta">
        <button class="pixel-btn" type="button" data-play="${queue.length}">Play ${p.title}</button>
        <span>${p.tracks.length} tracks, ${Math.floor(total / 60)} min ${total % 60} s</span>
      </div>
      <ol class="tracks">${p.tracks.map((t, i) => `
        <li><button class="track" type="button" data-play="${queue.length + i}">
          <span class="num">${String(i + 1).padStart(2, '0')}</span>
          <span><span class="title">${t.title}</span><span class="sound">${t.sound}</span></span>
          <span class="where">${t.where}</span>
          <span class="dur">${fmt(t.seconds)}</span>
        </button></li>`).join('')}
      </ol>`;
    main.append(sec);
    p.tracks.forEach(t => queue.push({ ...t, src: p.audio + t.file, project: p.title }));
  }
  const rows = [...document.querySelectorAll('.track')];

  // which screen is showing: no hash = home, #albums = the shelf, #<id> = one album
  const sections = [...main.querySelectorAll('.project')];
  sections.forEach(s => s.insertAdjacentHTML('afterbegin', '<a class="back" href="#albums">Back to albums</a>'));
  function route() {
    const id = location.hash.slice(1);
    document.body.classList.toggle('gate', !id);
    shelf.hidden = sections.some(s => s.id === id);
    sections.forEach(s => { s.hidden = s.id !== id; });
    window.scene.build();
    scrollTo(0, 0);
  }
  addEventListener('hashchange', route);

  const hero = document.querySelector('.hero'), flash = $('flash');
  $('enter').addEventListener('click', () => {
    if (current < 0) load(0); else if (audio.paused) audio.play().catch(() => {});
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { location.hash = 'albums'; return; }
    const [fx, fy] = window.scene.focus();
    $('scene').style.transformOrigin = `${fx * 100}% ${fy * 100}%`;
    hero.classList.add('entering'); flash.classList.add('on');
    setTimeout(() => {
      hero.classList.remove('entering');
      location.hash = 'albums';
      setTimeout(() => flash.classList.remove('on'), 80);
    }, 1600);
  });

  function load(i, autoplay = true) {
    current = (i + queue.length) % queue.length;
    const t = queue[current];
    audio.src = t.src;
    $('now-title').textContent = t.title;
    $('now-where').textContent = `${t.project}, ${t.where.toLowerCase()}`;
    $('time-total').textContent = fmt(t.seconds);
    seek.max = t.seconds; seek.value = 0; $('time-now').textContent = '0:00';
    rows.forEach((r, n) => n === current ? r.setAttribute('aria-current', 'true') : r.removeAttribute('aria-current'));
    player.hidden = false;
    if (autoplay) audio.play().catch(() => {});
  }

  main.addEventListener('click', e => {
    const b = e.target.closest('[data-play]');
    if (!b) return;
    const i = +b.dataset.play;
    if (i === current && b.classList.contains('track')) audio.paused ? audio.play() : audio.pause();
    else load(i);
  });
  $('toggle').addEventListener('click', () => audio.paused ? audio.play() : audio.pause());
  $('prev').addEventListener('click', () => audio.currentTime > 3 ? (audio.currentTime = 0) : load(current - 1));
  $('next').addEventListener('click', () => load(current + 1));
  audio.addEventListener('ended', () => { if (current < queue.length - 1) load(current + 1); });

  const setIcon = () => {
    $('icon-play').hidden = !audio.paused; $('icon-pause').hidden = audio.paused;
    $('toggle').setAttribute('aria-label', audio.paused ? 'Play' : 'Pause');
  };
  audio.addEventListener('play', setIcon); audio.addEventListener('pause', setIcon);
  audio.addEventListener('loadedmetadata', () => { seek.max = audio.duration; $('time-total').textContent = fmt(audio.duration); });
  audio.addEventListener('timeupdate', () => {
    if (dragging) return;
    seek.value = audio.currentTime; $('time-now').textContent = fmt(audio.currentTime);
  });
  seek.addEventListener('input', () => { dragging = true; $('time-now').textContent = fmt(seek.value); });
  seek.addEventListener('change', () => { audio.currentTime = seek.value; dragging = false; });
  // Home screen: cue up the title track and try to start it. Most browsers only
  // allow sound after a click, in which case Enter starts it instead.
  route();
  if (!location.hash) { load(0, false); audio.play().catch(() => {}); }

  audio.addEventListener('error', () => { if (current >= 0) $('now-where').textContent = `Couldn't load ${queue[current].file}. Check the audio folder.`; });
})();
