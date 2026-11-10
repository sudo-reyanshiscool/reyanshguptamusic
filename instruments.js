/* Pixel-art instruments, drawn in code on a 32x32 grid.
   drawInstrument(canvas, kind) — kinds are listed at the bottom. */
window.drawInstrument = (cv, kind) => {
  const S = 32; cv.width = cv.height = S;
  const g = cv.getContext('2d');
  const P = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
  const line = (x0, y0, x1, y1, c, t = 1) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++) P(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, t, t, c);
  };
  const disc = (cx, cy, rx, ry, c) => {
    for (let y = -ry; y <= ry; y++) {
      const w = Math.round(rx * Math.sqrt(1 - (y * y) / (ry * ry + 0.5)));
      P(cx - w, cy + y, w * 2 + 1, 1, c);
    }
  };
  const ring = (cx, cy, r, c) => { for (let a = 0; a < 72; a++) P(cx + Math.cos(a / 72 * 6.283) * r, cy + Math.sin(a / 72 * 6.283) * r, 2, 2, c); };
  const along = (x0, y0, x1, y1, t) => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];

  const SILV = '#d5dedb', SILV_D = '#8fa09c', BLK = '#1d1815', CREAM = '#f1ead6';
  const BRASS = '#e0b04a', BRASS_D = '#a8782a', BRASS_HI = '#f8e08e';
  const WOOD_D = '#3a2418', EBONY = '#1f1511';

  // violin, viola, cello and bass share a shape and differ in size and colour
  const fiddle = o => {
    disc(16, o.uy, o.urx, o.ury, o.col);
    disc(16, o.ly, o.lrx, o.lry, o.col);
    P(16 + o.lrx - 2, o.ly - 2, 2, 5, o.dark); P(16 + o.urx - 1, o.uy - 1, 1, 3, o.dark);   // shaded edge
    P(15, o.top, 2, o.uy - o.top, WOOD_D); P(14, o.top - 1, 4, 2, o.dark);                   // neck and scroll
    P(13, o.top + 1, 1, 1, CREAM); P(18, o.top + 2, 1, 1, CREAM);                            // pegs
    P(15, o.uy - o.ury, 2, o.ury + 3, EBONY);                                                // fingerboard
    P(16 - o.lrx + 2, o.ly - o.lry + 1, 1, 3, EBONY); P(16 + o.lrx - 3, o.ly - o.lry + 1, 1, 3, EBONY); // f-holes
    P(14, o.ly, 5, 1, CREAM); P(15, o.ly + 2, 3, o.lry - 2, EBONY);                          // bridge, tailpiece
    P(16, o.top + 1, 1, o.ly - o.top, 'rgba(241,234,214,.75)');                              // strings
    if (o.pin) P(16, o.ly + o.lry + 1, 1, o.pin, SILV);
    if (o.bow) { P(o.bow, 5, 1, 23, '#9a6a3a'); P(o.bow + 1, 6, 1, 21, CREAM); P(o.bow, 27, 2, 2, EBONY); }
  };

  const draw = {
    flute() {
      line(3, 24, 27, 10, SILV_D, 3); line(3, 23, 27, 9, SILV, 2);
      for (let i = 0; i < 6; i++) P(8 + i * 3, 20 - i * 1.75, 2, 2, '#ffffff');
      P(23, 9, 3, 3, SILV_D); P(27, 8, 2, 3, SILV_D);
    },
    oboe() {
      line(9, 27, 23, 6, BLK, 3); P(7, 28, 6, 2, BLK); P(6, 30, 8, 1, SILV_D);
      line(25, 5, 27, 2, CREAM, 1);
      for (const t of [0.2, 0.35, 0.5, 0.65, 0.8]) { const [x, y] = along(9, 27, 23, 6, t); P(x + 3, y, 1, 2, SILV); }
    },
    clarinet() {
      line(9, 25, 22, 6, BLK, 4); disc(9, 28, 4, 2, BLK); P(4, 30, 11, 1, SILV);
      line(24, 5, 26, 2, BLK, 2);
      for (const t of [0.05, 0.4, 0.95]) { const [x, y] = along(9, 25, 22, 6, t); P(x, y + 1, 4, 1, SILV); }
      for (const t of [0.2, 0.55, 0.7]) { const [x, y] = along(9, 25, 22, 6, t); P(x + 4, y + 1, 1, 2, SILV); }
    },
    bassoon() {
      line(12, 28, 17, 3, '#8a3f2a', 4); line(15, 28, 20, 3, '#6a2c1e', 1);
      P(11, 29, 6, 2, '#5e2a1c'); P(17, 2, 4, 1, CREAM);
      line(15, 12, 9, 8, SILV, 1); line(9, 8, 6, 12, SILV, 1);
      P(14, 18, 2, 2, SILV); P(15, 23, 2, 2, SILV); P(16, 8, 2, 1, SILV);
    },
    horn() {
      ring(13, 14, 8, BRASS); ring(13, 14, 5, BRASS_D);
      line(19, 19, 21, 21, BRASS, 3);
      disc(24, 24, 6, 6, BRASS); disc(24, 24, 4, 4, BRASS_HI); disc(24, 24, 2, 2, BRASS_D);
      line(8, 8, 4, 3, BRASS, 2); P(3, 1, 3, 2, SILV);
      for (const x of [10, 13, 16]) P(x, 12, 2, 5, SILV);
    },
    trumpet() {
      P(8, 19, 13, 2, BRASS_D); P(7, 14, 2, 7, BRASS_D); P(20, 14, 2, 7, BRASS_D);
      P(3, 13, 20, 2, BRASS);
      for (let i = 0; i < 7; i++) P(22 + i, 13 - i * 0.9, 1, 2 + Math.round(i * 1.8), BRASS);
      P(29, 7, 1, 14, BRASS_HI);
      for (const x of [11, 14, 17]) { P(x, 10, 2, 12, SILV); P(x, 8, 2, 2, CREAM); }
      P(1, 13, 2, 2, SILV);
    },
    trombone() {
      P(3, 19, 20, 1, BRASS); P(3, 24, 20, 1, BRASS); P(3, 19, 1, 6, BRASS); P(15, 19, 1, 6, SILV);
      P(22, 19, 6, 2, BRASS); P(27, 11, 2, 9, BRASS); P(14, 11, 14, 2, BRASS);
      for (let i = 0; i < 8; i++) P(13 - i, 11 - i * 0.6, 1, 2 + Math.round(i * 1.2), BRASS);
      P(5, 7, 1, 10, BRASS_HI);
      P(23, 24, 3, 1, SILV); P(25, 23, 2, 3, SILV);
    },
    timpani() {
      line(8, 3, 14, 10, '#9a6a3a', 1); P(7, 2, 2, 2, CREAM);
      line(24, 3, 18, 10, '#9a6a3a', 1); P(24, 2, 2, 2, CREAM);
      line(9, 22, 6, 30, SILV_D, 1); line(22, 22, 25, 30, SILV_D, 1); P(15, 24, 2, 7, SILV_D);
      for (let y = 0; y < 10; y++) { const w = Math.round(11 * Math.sqrt(1 - (y / 10) ** 2)); P(16 - w, 15 + y, w * 2, 1, '#b86a3a'); }
      P(8, 16, 2, 5, '#d98a55');
      P(5, 11, 22, 2, CREAM); P(4, 13, 24, 2, BRASS);
    },
    harp() {
      for (let x = 10; x <= 24; x += 2) P(x, 8, 1, Math.round((26 - x) * 19 / 16), 'rgba(241,234,214,.8)');
      line(26, 8, 10, 27, '#9a5a2a', 2);
      P(6, 4, 2, 25, BRASS); P(5, 2, 4, 2, BRASS_HI);
      line(8, 5, 14, 8, BRASS, 2); line(14, 8, 20, 5, BRASS, 2); line(20, 5, 26, 8, BRASS, 2);
      P(4, 28, 10, 2, BRASS_D);
    },
    'violin-1': () => fiddle({ uy: 14, urx: 4, ury: 4, ly: 22, lrx: 5, lry: 5, top: 4, col: '#c8742f', dark: '#8a4a1e', bow: 25 }),
    'violin-2': () => fiddle({ uy: 14, urx: 4, ury: 4, ly: 22, lrx: 5, lry: 5, top: 4, col: '#c8742f', dark: '#8a4a1e', bow: 6 }),
    viola: () => fiddle({ uy: 13, urx: 5, ury: 5, ly: 22, lrx: 6, lry: 6, top: 3, col: '#a85a26', dark: '#703814', bow: 26 }),
    cello: () => fiddle({ uy: 12, urx: 6, ury: 5, ly: 21, lrx: 8, lry: 6, top: 3, col: '#8f4520', dark: '#5c2a12', pin: 4 }),
    bass: () => fiddle({ uy: 12, urx: 6, ury: 6, ly: 21, lrx: 9, lry: 7, top: 2, col: '#6e3418', dark: '#45200e', pin: 3 }),
  };
  (draw[kind] || draw.flute)();
};
