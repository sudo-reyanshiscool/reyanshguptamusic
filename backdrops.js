/* Full-page album backgrounds, rendered on the GPU: each one is a ray-traced scene
   with HDR light, bloom, film tone-mapping and grain, in the manner of the black hole project.
   window.backdrop.set(albumId) starts one; set(null) stops it. Returns true if the album has one. */
(() => {
  const cv = document.getElementById('backdrop');
  const gl = cv.getContext('webgl2', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance', preserveDrawingBuffer: true });
  if (!gl) { window.backdrop = { set: () => false }; return; }
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hdr = !!gl.getExtension('EXT_color_buffer_float');

  const VERT = `#version 300 es
void main(){
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

  const PRELUDE = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2  uRes;
uniform float uTime;
uniform float uScroll;
float PIX;

float hash12(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float hash13(vec3 p){
  p = fract(p * .1031); p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}
vec3 hash33(vec3 p){
  p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx);
}
float vnoise(vec3 p){
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash13(i),               hash13(i + vec3(1,0,0)), f.x),
                 mix(hash13(i + vec3(0,1,0)), hash13(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash13(i + vec3(0,0,1)), hash13(i + vec3(1,0,1)), f.x),
                 mix(hash13(i + vec3(0,1,1)), hash13(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p){
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++){ s += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; }
  return s / 0.9375;
}
float vn2(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1,0)), f.x), mix(hash12(i + vec2(0,1)), hash12(i + vec2(1,1)), f.x), f.y);
}
mat3 rotX(float a){ float c = cos(a), s = sin(a); return mat3(1,0,0, 0,c,s, 0,-s,c); }
mat3 rotY(float a){ float c = cos(a), s = sin(a); return mat3(c,0,-s, 0,1,0, s,0,c); }

vec3 starLayer(vec2 uv, float face, float scale, float density, float seed){
  vec2 g = uv * scale;
  vec2 id = floor(g);
  vec2 f = fract(g) - 0.5;
  vec3 h = hash33(vec3(id, face * 13.0 + seed));
  if (h.z > density) return vec3(0.0);
  vec2 p = (h.xy - 0.5) * 0.6;
  float d = length(f - p);
  float m = fract(h.z * 917.3 + h.x * 31.7);
  float mag = 0.12 + 0.5 * m * m + 5.0 * pow(m, 10.0);
  float px = scale * PIX * (1.0 + 0.8 * m);
  float size = clamp(px, 0.035, 0.24);
  mag *= min(1.0, 0.012 / (px * px));
  float core = exp(-d * d / (size * size));
  float t = fract(h.y * 57.31 + h.z * 11.1);
  vec3 tint = mix(vec3(1.0, 0.78, 0.58), vec3(0.72, 0.84, 1.0), smoothstep(0.15, 0.85, t));
  return tint * mag * core;
}
vec3 starfield(vec3 d, float rich){
  vec3 a = abs(d);
  vec2 uv; float face;
  if (a.x >= a.y && a.x >= a.z)      { uv = d.yz / a.x; face = d.x > 0.0 ? 0.0 : 1.0; }
  else if (a.y >= a.z)               { uv = d.xz / a.y; face = d.y > 0.0 ? 2.0 : 3.0; }
  else                               { uv = d.xy / a.z; face = d.z > 0.0 ? 4.0 : 5.0; }
  return starLayer(uv, face,  26.0, 0.10 * rich, 1.0) * 1.6
       + starLayer(uv, face,  60.0, 0.16 * rich, 2.0) * 0.9
       + starLayer(uv, face, 130.0, 0.22 * rich, 3.0) * 0.5;
}
`;
  const MAIN = `
void main(){
  vec2 uv = (gl_FragCoord.xy * 2.0 - uRes) / min(uRes.x, uRes.y);
  PIX = 1.2 / min(uRes.x, uRes.y);
  fragColor = vec4(max(scene(uv), 0.0), 1.0);
}`;

  /* ---- First Light: a black hole whose accretion disc is the cover's rings of notes.
          Light is bent on its way to the camera, so the far side of the disc arches over the shadow. ---- */
  const HOLE = `
vec3 discCol(float r){
  float t = clamp((r - 2.6) / 10.4, 0.0, 1.0);
  vec3 c = mix(vec3(0.30, 0.26, 1.7), vec3(1.5, 0.22, 1.25), smoothstep(0.0, 0.42, t));
  return mix(c, vec3(1.7, 0.78, 0.22), smoothstep(0.38, 0.95, t));
}
vec3 scene(vec2 uv){
  float cr = cos(-0.32), sr = sin(-0.32);
  uv = mat2(cr, sr, -sr, cr) * uv;
  uv -= vec2(0.42, 0.50 + uScroll * 0.10);                   // sits up and to the right, clear of the album panel
  float ang = uTime * 0.012, inc = 0.30 + 0.04 * sin(uTime * 0.07);
  vec3 ro = 31.0 * vec3(cos(inc) * sin(ang), sin(inc), -cos(inc) * cos(ang));
  vec3 fw = normalize(-ro), rt = normalize(cross(vec3(0,1,0), fw)), up = cross(fw, rt);
  vec3 v = normalize(fw + (uv.x * rt + uv.y * up) * 0.52), p = ro;
  vec3 hv = cross(p, v); float h2 = dot(hv, hv);
  vec3 col = vec3(0.0); float trans = 1.0, glow = 0.0; bool cap = false;
  for (int i = 0; i < 120; i++){
    float r2 = dot(p, p), r = sqrt(r2);
    if (r < 1.0){ cap = true; break; }
    if (r > 34.0 && dot(p, v) > 0.0) break;
    float dt = 0.02 + 0.085 * r;
    v += -1.5 * h2 * p / (r2 * r2 * r) * dt;                 // the bending of light near the hole
    vec3 np = p + v * dt;
    glow += dt / (1.0 + r2 * r2 * 0.02);
    if (p.y * np.y < 0.0){                                   // crossing the plane of the disc
      vec3 c = mix(p, np, p.y / (p.y - np.y));
      float rr = length(c.xz);
      if (rr > 2.6 && rr < 13.5){
        float a = atan(c.z, c.x);
        float k = floor(rr * 2.3), fr = fract(rr * 2.3);
        float w = hash12(vec2(k, 3.1));
        float pk = a + uTime * 1.1 * pow(k / 2.3 + 0.5, -1.5) + w * 6.283;   // each ring keeps its own orbit
        float seg = vnoise(vec3(cos(pk) * 3.0 * (1.0 + w), sin(pk) * 3.0 * (1.0 + w), k * 7.3));
        float arc = smoothstep(0.40, 0.56, seg);
        float line = exp(-pow((fr - 0.5) * 3.2, 2.0) * 4.0);
        float gas = fbm(vec3(c.xz * 0.7, uTime * 0.02) + k * 0.37);
        float I = (0.22 * gas + 1.7 * arc * line + 0.22 * arc) * smoothstep(2.6, 3.3, rr) * smoothstep(13.5, 9.0, rr);
        I *= pow(3.2 / rr, 1.25) * 2.4;
        vec3 vel = normalize(vec3(-c.z, 0.0, c.x));
        float dop = 1.0 + 0.5 * dot(vel, -normalize(v));     // the side turning towards us is brighter
        I *= dop * dop * dop;
        col += trans * discCol(rr) * I;
        trans *= 1.0 - 0.45 * arc * line - 0.12 * gas;
      }
    }
    p = np;
  }
  if (!cap){
    col += vec3(0.34, 0.12, 0.60) * glow * 0.035;
    vec3 d = normalize(v);
    float neb = fbm(d * 2.2 + 3.0); neb = neb * neb * neb;
    col += trans * (starfield(d, 1.0) * 0.45 + vec3(0.30, 0.08, 0.45) * neb * 0.35);
  }
  return col;
}`;

  /* ---- Landfall: sunrise seen from low orbit. A dark ocean world, the thin blue line of its air,
          the sun breaking the edge and laying a path of light across the water. ---- */
  const PLANET = `
vec3 scene(vec2 uv){
  float pitch = 0.66 - uScroll * 0.03;
  vec3 ro = vec3(0.0, 1.45, 0.0);
  vec3 fw = vec3(0.0, -sin(pitch), cos(pitch)), rt = vec3(1,0,0), up = vec3(0.0, cos(pitch), sin(pitch));
  vec3 rd = normalize(fw + (uv.x * rt + uv.y * up) * 0.6);
  float e = 0.024 + 0.012 * sin(uTime * 0.05);
  float el = -(0.810 - e), az = 0.16;
  vec3 L = normalize(vec3(sin(az) * cos(el), sin(el), cos(az) * cos(el)));
  float b = dot(ro, rd), c = dot(ro, ro) - 1.0, dsc = b * b - c;
  float s = max(dot(rd, L), 0.0);
  vec3 col;
  if (dsc > 0.0 && b < 0.0){
    vec3 n = ro + rd * (-b - sqrt(dsc));
    vec3 q = rotX(-uTime * 0.004) * n;                       // the world turns beneath us
    float land = smoothstep(0.50, 0.57, fbm(q * 2.2 + 4.0));
    float cl = smoothstep(0.46, 0.74, fbm(q * 5.0 + vec3(0.0, uTime * 0.003, 0.0)) * 0.7 + vnoise(q * 15.0) * 0.3 + 0.08);
    float nl = dot(n, L);
    float day = smoothstep(-0.10, 0.22, nl);
    vec3 sunC = mix(vec3(1.0, 0.36, 0.13), vec3(1.0, 0.93, 0.82), smoothstep(0.0, 0.3, nl));
    vec3 alb = mix(vec3(0.012, 0.035, 0.085), vec3(0.07, 0.085, 0.045), land);
    alb = mix(alb, vec3(0.75), cl * 0.85);
    col = alb * sunC * day * 1.7;
    vec3 wn = normalize(n + 0.05 * (vec3(vnoise(q * 260.0 + uTime * 0.3), vnoise(q * 260.0 + 7.0 - uTime * 0.25), vnoise(q * 260.0 + 13.0)) - 0.5));
    float sp = pow(max(dot(wn, normalize(L - rd)), 0.0), 90.0);
    col += vec3(1.0, 0.72, 0.45) * sp * 14.0 * (1.0 - land) * (1.0 - cl) * smoothstep(-0.3, 0.02, nl);
    col += vec3(0.010, 0.015, 0.030) * (0.4 + cl);
    float fres = pow(1.0 - max(dot(n, -rd), 0.0), 6.0);
    col += mix(vec3(0.20, 0.45, 1.0), vec3(1.0, 0.5, 0.25), pow(s, 8.0)) * fres * smoothstep(-0.35, 0.1, nl) * 1.5;
  } else {
    vec3 sd = rotX(uTime * 0.0012) * rd;
    col = starfield(sd, 2.0) * 1.0;
    float mw = smoothstep(0.42, 0.80, fbm(sd * 2.5 + 1.7));
    col += vec3(0.42, 0.27, 0.36) * 0.030 + vec3(0.62, 0.42, 0.52) * mw * 0.07;
    vec3 pc = ro + rd * max(-b, 0.0);
    float a = max(length(pc) - 1.0, 0.0);
    float lit = smoothstep(-0.4, 0.1, dot(normalize(pc), L));
    vec3 ac = mix(vec3(0.22, 0.48, 1.0), vec3(1.0, 0.48, 0.20), pow(s, 6.0));
    col += ac * (exp(-a / 0.03) * 0.9 + exp(-a / 0.007) * 2.5) * lit;
    col += vec3(1.0, 0.90, 0.78) * (smoothstep(0.99996, 0.99999, s) * 120.0 + pow(s, 4000.0) * 10.0 + pow(s, 300.0) * 0.5 + pow(s, 24.0) * 0.06);
  }
  return col;
}`;

  /* ---- Loamlight: the cover's world built out of real blocks and flown over at dusk.
          Low sun, long shadows, and the lava that runs under everything lighting the cliffs from below. ---- */
  const VOXEL = `
const float LAVA = 9.0;
const vec3 SUN = vec3(-0.4203, 0.1101, 0.9007);
float hgt(vec2 c){ return floor(vn2(c * 0.045) * 17.0 + vn2(c * 0.13 + 31.0) * 8.0); }
vec3 skyBase(vec3 rd){
  float y = rd.y;
  vec3 c = mix(vec3(0.62, 0.26, 0.10), vec3(0.46, 0.15, 0.24), smoothstep(0.0, 0.12, y));
  c = mix(c, vec3(0.16, 0.07, 0.26), smoothstep(0.06, 0.30, y));
  c = mix(c, vec3(0.022, 0.016, 0.075), smoothstep(0.22, 0.8, y));
  float s = max(dot(rd, SUN), 0.0);
  return c + vec3(1.0, 0.50, 0.22) * (pow(s, 10.0) * 0.16 + pow(s, 90.0) * 0.5);
}
vec3 sky(vec3 rd){
  vec3 c = skyBase(rd);
  vec3 sr = normalize(cross(vec3(0,1,0), SUN)), su = cross(SUN, sr);
  float sd = dot(rd, SUN);
  vec2 q = vec2(dot(rd, sr), dot(rd, su)) / max(sd, 1e-3);
  if (sd > 0.0 && max(abs(q.x), abs(q.y)) < 0.036) c += vec3(1.0, 0.80, 0.46) * 7.0;      // a square sun
  return c + starfield(rd, 1.0) * smoothstep(0.08, 0.40, rd.y) * 0.9;
}
bool march(vec3 ro, vec3 rd, int N, out float t, out vec3 nrm, out vec3 cell, out int kind){
  vec3 r = mix(rd, vec3(1e-4), vec3(lessThan(abs(rd), vec3(1e-4))));
  cell = floor(ro);
  vec3 stp = sign(r), tD = abs(1.0 / r), tM = (cell + max(stp, 0.0) - ro) / r;
  t = 0.0; nrm = vec3(0.0); kind = 0;
  for (int i = 0; i < 170; i++){
    if (i >= N) break;
    if (cell.y < hgt(cell.xz)){ kind = 1; return true; }
    if (cell.y < LAVA){ kind = 2; return true; }
    if (cell.y > 30.0 && r.y > 0.0) return false;
    if (tM.x < tM.y && tM.x < tM.z){ t = tM.x; cell.x += stp.x; tM.x += tD.x; nrm = vec3(-stp.x, 0.0, 0.0); }
    else if (tM.y < tM.z)          { t = tM.y; cell.y += stp.y; tM.y += tD.y; nrm = vec3(0.0, -stp.y, 0.0); }
    else                           { t = tM.z; cell.z += stp.z; tM.z += tD.z; nrm = vec3(0.0, 0.0, -stp.z); }
  }
  return false;
}
vec3 scene(vec2 uv){
  float T = uTime;
  vec3 ro = vec3(20.0 + T * 0.5, 29.0, T * 1.3);
  float yaw = 0.12 * sin(T * 0.04);
  vec3 fw = normalize(vec3(sin(yaw) - 0.25, -0.20 - uScroll * 0.04, 1.0));
  vec3 rt = normalize(cross(vec3(0,1,0), fw)), up = cross(fw, rt);
  vec3 rd = normalize(fw + (uv.x * rt + uv.y * up) * 0.62);
  float t; vec3 n, cell; int kind;
  if (!march(ro, rd, 170, t, n, cell, kind)) return sky(rd);
  vec3 pos = ro + rd * t, col;
  if (kind == 2){
    vec2 q = floor(pos.xz * 4.0) / 4.0;
    float f = fbm(vec3(q * 0.22, T * 0.05)), f2 = vnoise(vec3(q * 1.1, T * 0.12));
    float crust = smoothstep(0.50, 0.66, f * 0.75 + f2 * 0.25);
    col = mix(vec3(5.0, 1.5, 0.18), vec3(0.9, 0.12, 0.02), smoothstep(0.3, 0.55, f));
    col = mix(col, vec3(0.10, 0.03, 0.02), crust);
  } else {
    float h = hgt(cell.xz), depth = h - 1.0 - cell.y;
    vec3 fp = fract(pos);
    vec2 fuv = abs(n.x) > 0.5 ? fp.zy : abs(n.y) > 0.5 ? fp.xz : fp.xy;
    float tex = hash13(vec3(floor(fuv * 8.0), 1.0) + cell * 7.13);
    bool high = h > LAVA + 2.0;
    vec3 grass = vec3(0.17, 0.42, 0.09), dirt = vec3(0.32, 0.19, 0.10), stone = vec3(0.23, 0.23, 0.27), basalt = vec3(0.10, 0.09, 0.11);
    vec3 alb;
    if (depth < 0.5) alb = n.y > 0.5 ? (high ? grass : basalt) : (high ? (fuv.y > 0.78 ? grass : dirt) : basalt);
    else if (depth < 3.5) alb = high ? dirt : stone;
    else alb = stone;
    float ore = hash13(cell + 3.7);
    if (depth > 3.5 && ore > 0.93 && tex > 0.66) alb = ore > 0.965 ? vec3(0.15, 0.55, 0.55) : vec3(0.75, 0.55, 0.12);
    alb *= 0.8 + 0.4 * tex;
    float sh = 0.0;
    if (dot(n, SUN) > 0.0){
      float ts; vec3 n2, c2; int k2;
      sh = (march(pos + n * 0.01, SUN, 44, ts, n2, c2, k2) && k2 == 1) ? 0.0 : 1.0;
    }
    vec3 lit = vec3(1.0, 0.46, 0.20) * 2.6 * max(dot(n, SUN), 0.0) * sh
             + vec3(0.10, 0.08, 0.24) * (0.55 + 0.45 * n.y)
             + vec3(1.0, 0.30, 0.05) * 2.2 * exp(-(pos.y - LAVA) * 0.30) * (n.y > 0.5 ? 0.35 : 1.0);
    col = alb * lit;
  }
  float fog = 1.0 - exp(-t * 0.0075);
  return mix(col, skyBase(normalize(vec3(rd.x, 0.04, rd.z))) * 0.75, fog);
}`;

  const HEAD = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform sampler2D uTex;
uniform vec2 uDst;
uniform vec2 uTexel;
`;
  const DOWN = HEAD + `uniform float uThreshold;
void main(){
  vec2 uv = gl_FragCoord.xy / uDst;
  vec3 c = (texture(uTex, uv + uTexel * vec2(-1,-1)).rgb + texture(uTex, uv + uTexel * vec2(1,-1)).rgb
          + texture(uTex, uv + uTexel * vec2(-1, 1)).rgb + texture(uTex, uv + uTexel * vec2(1, 1)).rgb) * 0.25;
  if (uThreshold > 0.0){
    float l = max(c.r, max(c.g, c.b));
    c = min(c * smoothstep(uThreshold * 0.6, uThreshold * 1.8, l), vec3(24.0));
  }
  fragColor = vec4(c, 1.0);
}`;
  const UP = HEAD + `void main(){
  vec2 uv = gl_FragCoord.xy / uDst;
  vec3 c = (texture(uTex, uv + uTexel * vec2(-1,-1)).rgb + texture(uTex, uv + uTexel * vec2(1,-1)).rgb
          + texture(uTex, uv + uTexel * vec2(-1, 1)).rgb + texture(uTex, uv + uTexel * vec2(1, 1)).rgb) * 0.25;
  fragColor = vec4(c, 1.0);
}`;
  const FINAL = HEAD + `uniform sampler2D uBloom;
uniform float uBloomAmt, uExposure, uTime;
vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
void main(){
  vec2 uv = gl_FragCoord.xy / uDst;
  vec3 c = (texture(uTex, uv).rgb + texture(uBloom, uv).rgb * uBloomAmt) * uExposure;
  vec2 q = uv - 0.5;
  c *= 1.0 - 0.55 * dot(q, q);
  c = pow(aces(c), vec3(1.0 / 2.2));
  float g = fract(sin(dot(gl_FragCoord.xy + fract(uTime) * 91.7, vec2(12.9898, 78.233))) * 43758.5453);
  fragColor = vec4(c + (g - 0.5) * 0.022, 1.0);
}`;

  const SCENES = {
    'first-light': { src: HOLE, exposure: 1.0, bloom: 0.55, threshold: 0.9, t0: 60 },
    landfall: { src: PLANET, exposure: 1.0, bloom: 0.5, threshold: 1.0, t0: 20 },
    loamlight: { src: VOXEL, exposure: 0.9, bloom: 0.45, threshold: 1.1, t0: 30 },
  };

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error('backdrop shader:', gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  const vs = compile(gl.VERTEX_SHADER, VERT);
  function program(fs) {
    const f = compile(gl.FRAGMENT_SHADER, fs);
    if (!f || !vs) return null;
    const p = gl.createProgram();
    gl.attachShader(p, vs); gl.attachShader(p, f); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.error('backdrop link:', gl.getProgramInfoLog(p)); return null; }
    const u = {};
    for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) { const name = gl.getActiveUniform(p, i).name; u[name] = gl.getUniformLocation(p, name); }
    return { p, u };
  }
  gl.bindVertexArray(gl.createVertexArray());
  const pDown = program(DOWN), pUp = program(UP), pFinal = program(FINAL);
  const progs = {};
  if (!pDown || !pUp || !pFinal) { window.backdrop = { set: () => false }; return; }

  function makeTarget(w, h) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, hdr ? gl.RGBA16F : gl.RGBA8, w, h, 0, gl.RGBA, hdr ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex, fbo, w, h };
  }
  const free = t => { gl.deleteTexture(t.tex); gl.deleteFramebuffer(t.fbo); };

  let cur = null, W = 0, H = 0, sceneT = null, mips = [], scale = 0.6;
  let T = 0, last = 0, running = false, slow = 0;

  function allocate() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(2, Math.round(innerWidth * dpr * scale)); H = Math.max(2, Math.round(innerHeight * dpr * scale));
    const cap = 1280 / Math.max(W, H); if (cap < 1) { W = Math.round(W * cap); H = Math.round(H * cap); }
    cv.width = W; cv.height = H;
    if (sceneT) free(sceneT); mips.forEach(free); mips = [];
    sceneT = makeTarget(W, H);
    for (let i = 0, w = W, h = H; i < 5; i++) { w = Math.max(2, w >> 1); h = Math.max(2, h >> 1); mips.push(makeTarget(w, h)); }
  }
  function pass(prog, target, w, h, set) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fbo : null);
    gl.viewport(0, 0, w, h); gl.useProgram(prog.p); set(prog.u);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  const bind = (unit, tex, loc) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(loc, unit); };

  function render() {
    const sc = SCENES[cur], prog = progs[cur];
    gl.disable(gl.BLEND);
    pass(prog, sceneT, W, H, u => {
      gl.uniform2f(u.uRes, W, H); gl.uniform1f(u.uTime, T);
      gl.uniform1f(u.uScroll, Math.min(3, scrollY / Math.max(1, innerHeight)));
    });
    let src = sceneT;
    mips.forEach((m, i) => {                                   // bright light spills: shrink it down...
      pass(pDown, m, m.w, m.h, u => { bind(0, src.tex, u.uTex); gl.uniform2f(u.uDst, m.w, m.h); gl.uniform2f(u.uTexel, 0.5 / m.w, 0.5 / m.h); gl.uniform1f(u.uThreshold, i ? 0 : sc.threshold); });
      src = m;
    });
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    for (let i = mips.length - 1; i > 0; i--) {                // ...and add it back, wider each time
      const s = mips[i], d = mips[i - 1];
      pass(pUp, d, d.w, d.h, u => { bind(0, s.tex, u.uTex); gl.uniform2f(u.uDst, d.w, d.h); gl.uniform2f(u.uTexel, 0.5 / s.w, 0.5 / s.h); });
    }
    gl.disable(gl.BLEND);
    pass(pFinal, null, W, H, u => {
      bind(0, sceneT.tex, u.uTex); bind(1, mips[0].tex, u.uBloom);
      gl.uniform2f(u.uDst, W, H); gl.uniform1f(u.uBloomAmt, sc.bloom); gl.uniform1f(u.uExposure, sc.exposure); gl.uniform1f(u.uTime, T);
    });
  }

  function loop(ts) {
    if (!cur) { running = false; return; }
    requestAnimationFrame(loop);
    const gap = ts - last;
    if (document.hidden || gap < 30) return;
    last = ts;
    if (W < 8 && innerWidth > 8) allocate();                   // the page had no size yet when this started
    if (gap < 500) {
      T += gap / 1000;
      // if the machine can't keep up, trade sharpness for smoothness
      slow = gap > 55 ? slow + 1 : Math.max(0, slow - 1);
      if (slow > 20 && scale > 0.3) { scale *= 0.78; slow = 0; allocate(); }
    }
    render();
  }
  let rz;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (cur) { allocate(); render(); } }, 150); });
  cv.addEventListener('webglcontextlost', e => { e.preventDefault(); cur = null; });

  window.backdrop = {
    set(id) {
      const next = SCENES[id] ? id : null;
      if (next === cur) return !!cur;
      if (next && !progs[next]) progs[next] = program(PRELUDE + SCENES[next].src + MAIN);
      cur = next && progs[next] ? next : null;
      if (!cur) return false;
      T = SCENES[cur].t0; slow = 0;
      allocate(); render();                                    // paint one frame straight away
      if (!still && !running) { running = true; last = performance.now(); requestAnimationFrame(loop); }
      return true;
    },
  };
})();
