// FX v3: 은은한 '샤르르' 파티클 엔진. 터지는 섬광·화면 흔들림 없이, 천천히 스며드는 빛·흩날리는 반짝임·옅은 안개로 분위기를 만든다.
// 카드별 효과는 황금여명회(Golden Dawn) 원소/행성 배속을 근거로 하고, 상징이 뚜렷한 카드(탑·별·달·태양·죽음·악마·연인·은둔자)는 그 그림의 핵심 현상을 부드럽게 옮긴다.
const FX = (() => {
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cv = document.createElement("canvas"); cv.id = "fx";
  cv.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:60";
  // 베일: 어둡게 덮지 않고, 주변만 살짝 흐리고 낮춰 카드에 시선이 모이게 한다
  const vg = document.createElement("div"); vg.id = "fxVeil";
  vg.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:59;opacity:0;-webkit-backdrop-filter:blur(2.5px);backdrop-filter:blur(2.5px);background:radial-gradient(ellipse at var(--fx,50%) var(--fy,50%),transparent 0,transparent 22%,rgba(8,6,22,.28) 60%,rgba(6,4,18,.45) 100%);transition:opacity 1.1s ease;-webkit-mask:radial-gradient(ellipse at var(--fx,50%) var(--fy,50%),transparent 0,transparent 20%,#000 52%);mask:radial-gradient(ellipse at var(--fx,50%) var(--fy,50%),transparent 0,transparent 20%,#000 52%)";
  const ctx = cv.getContext("2d");
  let W = 0, H = 0, DPR = 1, parts = [], rays = [], blooms = [], running = false, last = 0, T = 0;
  const fit = () => { DPR = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); };
  const R = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[(Math.random() * a.length) | 0];
  const mk = (s, fn) => { const c = document.createElement("canvas"); c.width = c.height = s; fn(c.getContext("2d"), s); return c; };
  const SPR = {};
  // 안개 덩어리: 흐린 원을 겹친 불규칙한 노이즈 스프라이트
  const puff = (rgb, v) => SPR["p" + rgb + v] || (SPR["p" + rgb + v] = mk(128, (g, s) => {
    let seed = v * 9301 + 49297; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    try { g.filter = "blur(4px)"; } catch (e) {}
    for (let i = 0; i < 40; i++) { const a = rnd() * 6.283, d = rnd() ** 1.6 * s * 0.3, x = s / 2 + Math.cos(a) * d, y = s / 2 + Math.sin(a) * d, r = s * (0.08 + rnd() * 0.16);
      const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rgb},${0.18 + rnd() * 0.16})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(0, 0, s, s); } }));
  const glow = (rgb) => SPR["g" + rgb] || (SPR["g" + rgb] = mk(64, (g, s) => { const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); r.addColorStop(0, "rgba(255,255,255,.95)"); r.addColorStop(0.12, `rgba(${rgb},.75)`); r.addColorStop(0.45, `rgba(${rgb},.16)`); r.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = r; g.fillRect(0, 0, s, s); }));
  // 별빛 반짝임: 작은 코어 + 가는 십자 빛줄기
  const twinkle = (rgb) => SPR["t" + rgb] || (SPR["t" + rgb] = mk(128, (g, s) => { const c = s / 2; const r = g.createRadialGradient(c, c, 0, c, c, c * 0.24); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.3, `rgba(${rgb},.7)`); r.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = r; g.fillRect(0, 0, s, s);
    for (const [w, a] of [[c, 0], [c * 0.45, Math.PI / 4]]) { g.save(); g.translate(c, c); g.rotate(a); for (let k = 0; k < 2; k++) { g.rotate(Math.PI / 2); const l = g.createLinearGradient(-w, 0, w, 0); l.addColorStop(0, `rgba(${rgb},0)`); l.addColorStop(0.5, "rgba(255,255,255,.75)"); l.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = l; g.fillRect(-w, -0.6, w * 2, 1.2); } g.restore(); } }));
  const bokeh = (rgb) => SPR["b" + rgb] || (SPR["b" + rgb] = mk(96, (g, s) => { const c = s / 2; const r = g.createRadialGradient(c, c, 0, c, c, c * 0.95); r.addColorStop(0, `rgba(${rgb},.12)`); r.addColorStop(0.8, `rgba(${rgb},.18)`); r.addColorStop(0.92, `rgba(${rgb},.28)`); r.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = r; g.fillRect(0, 0, s, s); }));
  const petal = (v) => SPR["pe" + v] || (SPR["pe" + v] = mk(64, (g, s) => { g.translate(s / 2, s / 2); const l = g.createLinearGradient(0, -s * 0.4, 0, s * 0.4); l.addColorStop(0, ["#ffe1ea", "#fff0f4", "#fbd0dc"][v]); l.addColorStop(0.75, ["#f39ab4", "#f6b8ca", "#e6799c"][v]); l.addColorStop(1, "#c8507a"); g.fillStyle = l;
    g.beginPath(); g.moveTo(0, s * 0.4); g.bezierCurveTo(-s * 0.36, s * 0.1, -s * 0.3, -s * 0.38, -s * 0.04, -s * 0.36); g.quadraticCurveTo(0, -s * 0.3, s * 0.04, -s * 0.36); g.bezierCurveTo(s * 0.3, -s * 0.38, s * 0.36, s * 0.1, 0, s * 0.4); g.fill(); }));
  const raySpr = (rgb) => SPR["r" + rgb] || (SPR["r" + rgb] = (() => { const c = document.createElement("canvas"); c.width = 256; c.height = 64; const g = c.getContext("2d"); const im = g.createImageData(256, 64); const [cr, cg, cb] = rgb.split(",").map(Number);
    for (let x = 0; x < 256; x++) { const t = x / 255, along = Math.min(1, t / 0.1) * (1 - t) ** 1.6; for (let y = 0; y < 64; y++) { const d = (y - 31.5) / 32 * (1 + t * 0.3), a = along * Math.exp(-d * d * 5); const i = (y * 256 + x) * 4; im.data[i] = cr; im.data[i + 1] = cg; im.data[i + 2] = cb; im.data[i + 3] = a * 255; } }
    g.putImageData(im, 0, 0); return c; })());
  const RGB = {
    fire: ["255,190,110", "255,160,80", "255,225,160"], water: ["150,210,255", "190,235,255", "130,170,255"], air: ["225,235,255", "200,215,255", "245,248,255"],
    earth: ["240,210,140", "215,230,160", "255,238,190"], wood: ["160,235,175", "130,215,190", "215,250,200"], light: ["255,236,190", "255,248,232", "225,210,255"],
    love: ["255,175,200", "255,215,228", "245,210,150"], shadow: ["175,140,255", "130,100,230", "215,185,255"], moon: ["205,218,255", "180,198,255", "238,242,255"],
    sun: ["255,222,150", "255,240,205", "255,200,110"], star: ["205,228,255", "255,255,255", "180,205,255"], arcane: ["255,218,150", "205,178,255", "255,244,215"],
    hell: ["255,130,110", "220,80,110", "255,180,150"],
  };
  const add = (p) => { if (parts.length < 900) parts.push(p); };
  const at = (t) => { if (t && t.getBoundingClientRect) { const r = t.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; } return Object.assign({ x: W / 2, y: H / 2, w: 200, h: 300 }, t || {}); };
  // 느린 흐름장: 파티클이 바람에 실린 듯 살랑이게
  const flow = (x, y) => [Math.sin(y * 0.011 + T * 0.6) * 0.8 + Math.cos(y * 0.027 - T * 0.4) * 0.4, Math.cos(x * 0.009 - T * 0.5) * 0.5];

  const E = {
    // 반짝이 가루: 천천히 나타나 살짝 떠오르다 사라짐 — 모든 효과의 바탕
    dust(o, n, pal = RGB.light, spread = 0.8) { for (let i = 0; i < n; i++) add({ k: "mote", rgb: pick(pal), x: o.x + R(-o.w * spread, o.w * spread), y: o.y + R(-o.h * 0.7, o.h * 0.6), vx: R(-6, 6), vy: R(-18, -4), sz: R(0.5, 1.5), turb: 8, life: R(2.6, 4.6), delay: R(0, 1.4), ph: R(0, 6) }); },
    // 샤르르: 카드 위를 대각선으로 쓸고 지나가는 반짝임의 물결
    sweep(o, n, pal = RGB.light) { for (let i = 0; i < n; i++) { const u = i / n, x = o.x - o.w * 0.55 + u * o.w * 1.1 + R(-o.w * 0.12, o.w * 0.12), y = o.y + o.h * 0.5 - u * o.h + R(-o.h * 0.1, o.h * 0.1);
      add({ k: Math.random() < 0.3 ? "twinkle" : "mote", rgb: pick(pal), x, y, vx: R(-4, 4), vy: R(-14, -4), sz: Math.random() < 0.3 ? R(5, 11) : R(0.6, 1.6), turb: 6, life: R(1.6, 2.8), delay: u * 0.9 + R(0, 0.12), ph: R(0, 6) }); } },
    sparkle(o, n, pal = RGB.light) { for (let i = 0; i < n; i++) add({ k: "twinkle", rgb: pick(pal), x: o.x + R(-o.w * 0.75, o.w * 0.75), y: o.y + R(-o.h * 0.65, o.h * 0.65), vx: R(-3, 3), vy: R(-8, 2), sz: R(4, 12), life: R(1.6, 3), delay: R(0, 1.6), ph: R(0, 6) }); },
    bokeh(o, n, pal = RGB.light) { for (let i = 0; i < n; i++) add({ k: "bokeh", rgb: pick(pal), x: o.x + R(-o.w, o.w), y: o.y + R(-o.h * 0.8, o.h * 0.8), vx: R(-4, 4), vy: R(-8, 2), sz: R(12, 34), life: R(2.6, 4.2), delay: R(0, 1.2) }); },
    // 옅은 안개: 아주 낮은 알파로 피어오르는 빛 번짐
    haze(o, n, rgb, a = 0.14, rise = -10) { for (let i = 0; i < n; i++) add({ k: "mist", rgb, v: (Math.random() * 4) | 0, x: o.x + R(-o.w * 0.55, o.w * 0.55), y: o.y + R(-o.h * 0.2, o.h * 0.45), vx: R(-8, 8), vy: R(rise * 1.5, rise * 0.5), sz: R(50, 100), grow: 0.8, rot: R(0, 6.28), spin: R(-0.15, 0.15), turb: 10, life: R(3, 4.6), delay: R(0, 1), a }); },
    // 불: 터지는 불꽃 대신, 따스한 불씨가 천천히 떠올라 꺼져 간다
    fire(o, n, pal = RGB.fire) { E.haze(o, n * 0.12, pal[0], 0.1, -16);
      for (let i = 0; i < n * 0.6; i++) add({ k: "ember", rgb: pick(pal), x: o.x + R(-o.w * 0.45, o.w * 0.45), y: o.y + R(0, o.h * 0.5), vx: R(-8, 8), vy: R(-48, -18), sz: R(0.7, 1.7), turb: 22, life: R(2.4, 4), delay: R(0, 1.4), ph: R(0, 6) });
      E.dust(o, n * 0.3, pal); },
    // 물: 물방울이 천천히 떨어지며 반짝이고, 잔물결이 느리게 번진다
    water(o, n) { E.haze(o, n * 0.12, "150,200,255", 0.12, -6);
      for (let i = 0; i < n * 0.35; i++) add({ k: "drop", rgb: pick(RGB.water), x: o.x + R(-o.w * 0.5, o.w * 0.5), y: o.y + R(-o.h * 0.6, o.h * 0.1), vx: R(-3, 3), vy: R(14, 34), sz: R(0.8, 1.6), turb: 4, life: R(2, 3.4), delay: R(0, 1.4), ph: R(0, 6) });
      for (let i = 0; i < 3; i++) add({ k: "ripple", rgb: pick(RGB.water), x: o.x + R(-o.w * 0.2, o.w * 0.2), y: o.y + o.h * R(0.38, 0.5), sz: 4, grow: R(60, 110), life: R(2.6, 3.4), delay: 0.3 + i * 0.7 });
      E.bokeh(o, n * 0.15, RGB.water); },
    // 공기: 실바람처럼 가느다란 빛줄기가 옆으로 흘러간다
    air(o, n) { for (let i = 0; i < n * 0.25; i++) add({ k: "wisp", rgb: pick(RGB.air), v: (Math.random() * 4) | 0, x: o.x - o.w * R(0.3, 0.9), y: o.y + R(-o.h * 0.5, o.h * 0.5), vx: R(50, 95), vy: R(-6, 6), sz: R(28, 50), turb: 20, life: R(2.6, 3.8), delay: R(0, 1.2), a: 0.1 });
      E.dust(o, n * 0.6, RGB.air); },
    earth(o, n, pal = RGB.earth) { E.dust(o, n * 0.8, pal); E.bokeh(o, n * 0.2, pal); E.haze(o, n * 0.08, "190,160,110", 0.08, -4); },
    wood(o, n) { E.earth(o, n, RGB.wood); E.petals(o, n * 0.1, 1); },
    petals(o, n, v) { for (let i = 0; i < n; i++) add({ k: "petal", v: v ?? (Math.random() * 3) | 0, x: o.x + R(-o.w * 0.9, o.w * 0.9), y: o.y - o.h * R(0.4, 0.8), vx: R(6, 22), vy: R(14, 32), sz: R(6, 11), rot: R(0, 6.28), spin: R(-0.8, 0.8), flip: R(1, 2.4), turb: 18, life: R(3.4, 5), delay: R(0, 1.8) }); },
    // 소용돌이: 빛 가루가 카드 둘레를 천천히 감돌며 모여든다
    vortex(o, n, pal = RGB.arcane) { for (let i = 0; i < n; i++) add({ k: "orbit", rgb: pick(pal), cx: o.x, cy: o.y, r0: Math.max(o.w, o.h) * R(0.4, 0.75), ang: R(0, 6.28), w: R(0.35, 0.8) * (Math.random() < 0.5 ? 1 : -1), sz: R(0.6, 1.4), life: R(2.8, 4.2), delay: R(0, 1.2), x: o.x, y: o.y, ph: R(0, 6) }); },
  };
  function aura(t, kind = "light", dur = 3.2) { const o = at(t), pal = RGB[kind] || RGB.light; for (let k = 0; k < 2; k++) add({ k: "aura", rgb: pick(pal), t, x: o.x, y: o.y, sz: Math.max(o.w, o.h) * (0.62 + k * 0.14), life: dur, delay: k * 0.4, ph: R(0, 6) }); }
  function godrays(t, kind = "light", dur = 3.2) { const o = at(t), pal = RGB[kind] || RGB.light; for (let i = 0; i < 9; i++) rays.push({ x: o.x, y: o.y, a: R(0, 6.283), w: R(0.02, 0.05), len: Math.max(W, H) * R(0.35, 0.7), rgb: pick(pal), life: dur * R(0.85, 1.1), t: 0, spin: R(-0.03, 0.03), al: R(0.05, 0.12) }); }
  // 은은한 빛 번짐: 0.6초에 걸쳐 차오르고 2초 가까이 천천히 가라앉는다
  function flash(t, rgb = "255,240,200", sz = 1, life = 2.4) { const o = at(t); blooms.push({ x: o.x, y: o.y, rgb, t: 0, life, r: Math.max(o.w, o.h) * 1.3 * Math.min(1.4, 0.7 + sz * 0.4), a: Math.min(0.3, 0.12 + sz * 0.08) }); }
  const shake = () => {}; // 흔들림은 쓰지 않는다
  function veil(t, on) { const o = at(t); vg.style.setProperty("--fx", o.x + "px"); vg.style.setProperty("--fy", o.y + "px"); vg.style.opacity = on ? 1 : 0; }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now; T += dt;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    for (let i = blooms.length - 1; i >= 0; i--) { const f = blooms[i]; f.t += dt; const p = f.t / f.life; if (p >= 1) { blooms.splice(i, 1); continue; }
      const env = p < 0.25 ? Math.sin((p / 0.25) * Math.PI / 2) : (1 - (p - 0.25) / 0.75) ** 1.6;
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * (0.8 + p * 0.3)); g.addColorStop(0, `rgba(${f.rgb},1)`); g.addColorStop(0.35, `rgba(${f.rgb},.35)`); g.addColorStop(1, `rgba(${f.rgb},0)`);
      ctx.globalAlpha = env * f.a; ctx.fillStyle = g; ctx.fillRect(f.x - f.r * 1.2, f.y - f.r * 1.2, f.r * 2.4, f.r * 2.4); }
    for (let i = rays.length - 1; i >= 0; i--) { const r = rays[i]; r.t += dt; const p = r.t / r.life; if (p >= 1) { rays.splice(i, 1); continue; }
      r.a += r.spin * dt; ctx.save(); ctx.translate(r.x, r.y); ctx.rotate(r.a);
      ctx.globalAlpha = Math.sin(Math.PI * p) ** 1.5 * r.al; const hw = r.len * r.w * 1.6; ctx.drawImage(raySpr(r.rgb), 0, -hw, r.len, hw * 2); ctx.restore(); }
    for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i];
      if (p.delay > 0) { p.delay -= dt; continue; }
      p.age = (p.age || 0) + dt; p.q = p.age / p.life; if (p.q >= 1) { parts.splice(i, 1); continue; }
      if (p.k === "orbit") { p.ang += p.w * dt; const r = p.r0 * (1 - p.q * 0.45); p.x = p.cx + Math.cos(p.ang) * r; p.y = p.cy + Math.sin(p.ang) * r * 0.5 - p.q * 24; }
      else if (p.vx !== undefined) { if (p.turb) { const [fx, fy] = flow(p.x, p.y); p.vx += fx * p.turb * dt; p.vy += fy * p.turb * dt; } p.vx *= 1 - 0.25 * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.spin) p.rot += p.spin * dt; }
      draw(p);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    if (parts.length || rays.length || blooms.length) requestAnimationFrame(frame); else running = false;
  }
  // 부드러운 등장·퇴장: 앞 30%는 서서히 밝아지고 나머지는 천천히 스러진다
  const env = (q) => q < 0.3 ? Math.sin((q / 0.3) * Math.PI / 2) : Math.max(0, 1 - (q - 0.3) / 0.7) ** 1.3;
  function draw(p) {
    const q = p.q, e = env(q);
    switch (p.k) {
      case "mist": case "wisp": { const s = p.sz * (1 + (p.grow || 0) * q); ctx.globalAlpha = Math.sin(Math.PI * q) * (p.a ?? 0.12); ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.k === "wisp" ? Math.atan2(p.vy, p.vx) : p.rot); if (p.k === "wisp") ctx.scale(3, 0.35); ctx.drawImage(puff(p.rgb, p.v), -s, -s, s * 2, s * 2); ctx.restore(); break; }
      case "ember": { ctx.globalAlpha = e * (0.55 + 0.45 * Math.sin(p.age * 4 + p.ph)); const s = p.sz * 5; ctx.drawImage(glow(p.rgb), p.x - s, p.y - s, s * 2, s * 2); break; }
      case "drop": { ctx.globalAlpha = e * (0.6 + 0.4 * Math.sin(p.age * 6 + p.ph)); const s = p.sz * 4; ctx.drawImage(glow(p.rgb), p.x - s, p.y - s * 1.3, s * 2, s * 2.6); break; }
      case "ripple": { const r = p.sz + p.grow * Math.sqrt(q); ctx.globalAlpha = Math.sin(Math.PI * q) * 0.28; for (const k of [1, 0.75]) { ctx.strokeStyle = `rgba(${p.rgb},${k === 1 ? 0.8 : 0.35})`; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.ellipse(p.x, p.y, r * k, r * k * 0.26, 0, 0, 7); ctx.stroke(); } break; }
      case "mote": { ctx.globalAlpha = e * (0.55 + 0.45 * Math.sin(p.age * 3 + p.ph)); const s = p.sz * 5; ctx.drawImage(glow(p.rgb), p.x - s, p.y - s, s * 2, s * 2); break; }
      case "bokeh": { const s = p.sz; ctx.globalAlpha = Math.sin(Math.PI * q) * 0.35; ctx.drawImage(bokeh(p.rgb), p.x - s, p.y - s, s * 2, s * 2); break; }
      case "twinkle": { const s = p.sz * (0.6 + 0.4 * Math.sin(p.age * 3.2 + p.ph)) * Math.sin(Math.PI * q); ctx.globalAlpha = 0.85; ctx.drawImage(twinkle(p.rgb), p.x - s * 2, p.y - s * 2, s * 4, s * 4); break; }
      case "petal": { ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = e * 0.85; const s = p.sz; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(Math.cos(p.age * p.flip), 1); ctx.drawImage(petal(p.v), -s, -s, s * 2, s * 2); ctx.restore(); ctx.globalCompositeOperation = "lighter"; break; }
      case "orbit": { ctx.globalAlpha = e * (0.6 + 0.4 * Math.sin(p.age * 3 + p.ph)); const s = p.sz * 5; ctx.drawImage(glow(p.rgb), p.x - s, p.y - s, s * 2, s * 2); break; }
      case "aura": { if (p.t && p.t.getBoundingClientRect) { const o = at(p.t); p.x = o.x; p.y = o.y; }
        const s = p.sz * (1 + 0.04 * Math.sin(p.age * 1.6 + p.ph)); ctx.globalAlpha = Math.sin(Math.PI * q) ** 1.4 * 0.32; ctx.save(); ctx.translate(p.x, p.y); ctx.scale(0.62, 0.86);
        const g = ctx.createRadialGradient(0, 0, s * 0.38, 0, 0, s); g.addColorStop(0, `rgba(${p.rgb},0)`); g.addColorStop(0.5, `rgba(${p.rgb},.35)`); g.addColorStop(0.78, `rgba(${p.rgb},.1)`); g.addColorStop(1, `rgba(${p.rgb},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, s, 0, 7); ctx.fill(); ctx.restore(); break; }
    }
  }
  function kick() { if (!cv.isConnected) { document.body.append(vg, cv); fit(); addEventListener("resize", fit); } if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } }

  // 메이저 0~21 → 효과 (근거: 황금여명회 배속 / 그림의 핵심 현상)
  const MAJOR = ["air", "arcane", "moon", "bloom", "fire", "earth", "love", "water", "fire", "lantern", "arcane", "air", "water", "death", "water", "darkfire", "tower", "star", "moon", "sun", "light", "arcane"];
  const WHY = ["바보·공기", "마법사·수성", "여사제·달", "여황제·금성", "황제·양자리(불)", "교황·황소자리(흙)", "연인·쌍둥이자리", "전차·게자리(물)", "힘·사자자리(불)", "은둔자·등불", "운명의 수레바퀴·목성", "정의·천칭자리(공기)", "매달린 사람·물", "죽음·전갈자리", "절제·물을 섞음", "악마·염소자리", "탑·번개", "별·별빛", "달·물고기자리", "태양", "심판·나팔의 빛", "세계·토성"];
  const kindOf = (card, rev) => rev ? "shadow" : card.arcana === "major" ? MAJOR[card.id] || "light" : { wands: "fire", cups: "water", swords: "air", pentacles: "earth" }[card.suit] || "light";
  const PALOF = { bloom: "love", lantern: "fire", death: "moon", darkfire: "hell", tower: "fire", arcane: "arcane", star: "star", moon: "moon", sun: "sun", water: "water", air: "air", earth: "earth", fire: "fire", wood: "wood", light: "light", love: "love", shadow: "shadow" };
  const BLOOM = { light: "255,240,210", sun: "255,225,160", moon: "190,205,255", star: "210,228,255", tower: "235,235,255", death: "200,205,230", darkfire: "200,70,90", lantern: "255,200,130", arcane: "255,225,175", bloom: "255,205,215", love: "255,185,205", shadow: "150,115,255", fire: "255,190,120", water: "150,205,255", air: "220,232,255", earth: "240,215,150", wood: "180,235,180" };
  const api = {
    kindOf, WHY,
    play(kind, t, power = 1) { if (RM) return; kick(); const o = at(t), n = Math.round(60 * power), pal = RGB[PALOF[kind]] || RGB.light;
      flash(o, BLOOM[kind] || "255,240,210", power * (kind === "shadow" || kind === "death" ? 0.6 : 1));
      switch (kind) {
        case "light": godrays(o, "light"); aura(t, "light"); E.sweep(o, n * 0.5); E.dust(o, n * 0.5); E.bokeh(o, n * 0.15); break;
        case "sun": godrays(o, "sun", 3.6); aura(t, "sun"); E.dust(o, n * 0.8, RGB.sun); E.bokeh(o, n * 0.2, RGB.sun); break;
        case "moon": aura(t, "moon"); E.haze(o, n * 0.15, "150,165,230", 0.12, -5); E.sparkle(o, n * 0.25, RGB.moon); E.dust(o, n * 0.5, RGB.moon); break;
        case "star": aura(t, "star"); E.sparkle(o, n * 0.6, RGB.star); E.dust(o, n * 0.6, RGB.star); break;
        // 탑: 쾅 대신, 먼 하늘의 희미한 번개빛이 두 번 스치고 불씨가 내려앉는다
        case "tower": setTimeout(() => flash(o, "235,235,255", power * 0.8, 1.4), 600); E.fire(o, n * 0.5); E.haze(o, n * 0.1, "90,80,110", 0.12, -6); break;
        // 죽음: 어둠보다는 새벽 안개 속에 옅은 빛 알갱이가 조용히 떠오른다
        case "death": aura(t, "moon"); E.haze(o, n * 0.18, "120,120,150", 0.12, -5); E.dust(o, n * 0.5, ["220,222,240", "200,205,230"]); break;
        case "darkfire": aura(t, "shadow"); E.fire(o, n * 0.6, RGB.hell); E.haze(o, n * 0.1, "60,30,70", 0.14, -6); break;
        case "lantern": aura(t, "fire"); E.dust(o, n * 0.8, RGB.fire, 0.5); E.sparkle(o, n * 0.12, RGB.fire); break;
        case "arcane": aura(t, "arcane"); E.vortex(o, n * 0.8); E.sparkle(o, n * 0.2, RGB.arcane); break;
        case "bloom": aura(t, "love"); E.petals(o, n * 0.25); E.dust(o, n * 0.5, RGB.wood); break;
        case "love": aura(t, "love"); E.petals(o, n * 0.3); E.bokeh(o, n * 0.2, RGB.love); E.dust(o, n * 0.4, RGB.love); break;
        case "shadow": aura(t, "shadow"); E.haze(o, n * 0.15, "70,50,130", 0.14, -5); E.dust(o, n * 0.5, RGB.shadow); break;
        default: aura(t, PALOF[kind] || "light"); (E[kind] || E.dust)(o, n, pal);
      } },
    // 카드 공개: 주변이 살짝 흐려지고 → 빛이 스며들고 → 반짝임이 대각선으로 '샤르르' 쓸고 지나간 뒤 → 카드별 효과가 피어난다
    reveal(card, rev, t, power = 1, multi = false) { if (RM) return; kick(); const k = kindOf(card, rev), o = at(t), pal = RGB[PALOF[k]] || RGB.light;
      if (!multi) { veil(t, true); setTimeout(() => veil(t, false), 2600); } E.sweep(o, Math.round(26 + 16 * power), pal);
      if (k !== "tower" && k !== "death" && k !== "shadow") godrays(t, PALOF[k] || "light", 2.6);
      setTimeout(() => api.play(k, t, power), 450); },
    ambient(kind, t, sec = 3) { if (RM) return; kick(); const end = performance.now() + sec * 1000; const tick = () => { if (performance.now() > end) return; const o = at(t); E.dust(o, 2, RGB[PALOF[kind]] || RGB.light); setTimeout(tick, 220); }; tick(); },
    aura: (t, kind, d) => aura(t, PALOF[kind] || kind, d), godrays, flash, veil, kick, shake,
  };
  return api;
})();
