// FX v4 — 샤르륵: 작은 가루, 느린 바람, 긴 잔광. 링/광구/방사광 없음.
const FX = (() => {
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const R = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[(Math.random() * a.length) | 0];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const finite = (v, fallback) => Number.isFinite(v) ? v : fallback;
  const strength = p => clamp(finite(p, 1), 0, 1.5);
  const RGB = {
    light: ["247,223,166", "230,235,245", "255,244,216"],
    fire: ["249,191,108", "239,160,91", "255,224,169"],
    water: ["193,222,241", "229,238,247", "169,203,228"],
    air: ["220,231,244", "195,213,233", "242,243,247"],
    earth: ["231,196,124", "245,220,167", "211,181,116"],
    wood: ["185,215,170", "219,228,189", "231,217,167"],
    love: ["242,198,211", "246,224,220", "232,208,162"],
    shadow: ["146,119,185", "171,147,202", "119,104,157"],
    moon: ["191,205,230", "221,229,244", "169,185,219"],
    sun: ["250,215,151", "255,233,186", "238,193,119"],
    star: ["209,229,244", "235,241,247", "188,210,237"],
    arcane: ["241,216,168", "208,192,228", "239,233,216"],
    hell: ["209,137,125", "187,109,133", "227,168,140"],
  };
  const MAJOR = ["air", "arcane", "moon", "bloom", "fire", "earth", "love", "water", "fire", "lantern", "arcane", "air", "water", "death", "water", "darkfire", "tower", "star", "moon", "sun", "light", "arcane"];
  const WHY = ["바보·공기", "마법사·수성", "여사제·달", "여황제·금성", "황제·양자리(불)", "교황·황소자리(흙)", "연인·쌍둥이자리", "전차·게자리(물)", "힘·사자자리(불)", "은둔자·등불", "운명의 수레바퀴·목성", "정의·천칭자리(공기)", "매달린 사람·물", "죽음·전갈자리", "절제·물을 섞음", "악마·염소자리", "탑·번개", "별·별빛", "달·물고기자리", "태양", "심판·나팔의 빛", "세계·토성"];
  const PALOF = { bloom: "love", lantern: "fire", death: "shadow", darkfire: "hell", tower: "air" };
  const kindOf = (card, rev) => rev ? "shadow" : card.arcana === "major" ? MAJOR[card.id] || "light" : { wands: "fire", cups: "water", swords: "air", pentacles: "earth" }[card.suit] || "light";
  const palette = kind => RGB[PALOF[kind] || kind] || RGB.light;
  let W = innerWidth, H = innerHeight, DPR = 1, raf = 0, last = 0;
  let parts = [], emitters = [];
  const layers = [], sprites = new Map();
  const limit = () => motion.matches ? 12 : W < 600 ? 220 : 320;

  function fit() {
    W = Math.max(1, innerWidth); H = Math.max(1, innerHeight);
    parts.length = Math.min(parts.length, limit());
    // DPR 3~4 모바일의 전체 화면 fill-rate/메모리도 제한한다.
    DPR = Math.min(devicePixelRatio || 1, 2, Math.sqrt(3000000 / (W * H)));
    for (const { cv, ctx } of layers) {
      cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
  }
  function layer(sheet = false) {
    const id = sheet ? "fxSheet" : "fx";
    let l = layers.find(item => item.cv.id === id);
    if (!l) {
      const cv = document.createElement("canvas"), ctx = cv.getContext("2d");
      if (!ctx) return null;
      cv.id = id; cv.setAttribute("aria-hidden", "true");
      // 본문(.wrap:1) 위, 메뉴(:20) 아래. 상세 모달(:50)만 별도 캔버스.
      cv.style.cssText = `position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:${sheet ? 51 : 19}`;
      document.body.append(cv);
      l = { cv, ctx }; layers.push(l); fit();
    }
    return l;
  }
  function source(t) {
    // .slot에는 라벨이 포함된다. 뒤집히는 .inner 대신 고정된 .ph 기준.
    if (t && t.matches && t.matches(".slot")) return t.querySelector(".ph") || t;
    return t;
  }
  function at(t) {
    if (t && t.getBoundingClientRect) {
      const r = t.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
    }
    const o = t || {};
    return { x: finite(o.x, W / 2), y: finite(o.y, H / 2), w: Math.max(1, finite(o.w, 200)), h: Math.max(1, finite(o.h, 300)) };
  }
  function setup(t) {
    if (document.hidden) return null;
    t = source(t);
    const o = at(t);
    if (o.w < 1 || o.h < 1 || (t && t.isConnected === false)) return null;
    const l = layer(!!(t && t.closest && t.closest(".overlay")));
    return l ? { t, o, l, scale: clamp(o.w / 180, 0.45, 1.15) } : null;
  }
  function kick() {
    if (!raf && (parts.length || emitters.length) && !document.hidden) {
      last = performance.now(); raf = requestAnimationFrame(frame);
    }
  }
  function add(s, p) {
    if (parts.length >= limit()) return;
    parts.push({
      t: s.t, l: s.l, age: 0, delay: 0, dx: 0, dy: 0, vx: 0, vy: 0, drag: 0.55,
      amp: R(3, 8) * s.scale, freq: R(1.4, 2.3), ph: R(0, Math.PI * 2),
      wind: R(0.6, 2), life: R(1.8, 3), alpha: 0.65, ...p,
      // 모션 감소는 모든 진입점에서 정적인 작은 가루 몇 개만 남긴다.
      still: motion.matches,
    });
  }
  function sprite(k, rgb = "255,255,255") {
    const key = k + rgb;
    if (sprites.has(key)) return sprites.get(key);
    const c = document.createElement("canvas"); c.width = c.height = k === "mist" ? 96 : 32;
    const g = c.getContext("2d"), s = c.width, m = s / 2;
    if (k === "mist") {
      // 불규칙한 조각들을 캐시. 외곽이 닫힌 타원/테두리는 만들지 않는다.
      for (let i = 0; i < 14; i++) {
        const x = R(18, 78), y = R(29, 67), r = R(9, 22);
        const gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, `rgba(${rgb},.24)`); gr.addColorStop(1, `rgba(${rgb},0)`);
        g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
      }
    } else if (k === "petal") {
      const gr = g.createLinearGradient(10, 4, 22, 29);
      gr.addColorStop(0, "#f8e1df"); gr.addColorStop(1, `rgba(${rgb},.7)`); g.fillStyle = gr;
      g.beginPath(); g.moveTo(13, 29);
      g.bezierCurveTo(-1, 16, 9, 1, 20, 5); g.bezierCurveTo(31, 11, 22, 24, 13, 29); g.fill();
    } else if (k === "twinkle") {
      // 아주 작은 4각 별. 긴 광선/8각 렌즈 플레어 없음.
      g.fillStyle = `rgb(${rgb})`; g.beginPath(); g.moveTo(m, 2);
      for (const [x, y] of [[18, 14], [30, 16], [18, 18], [16, 30], [14, 18], [2, 16], [14, 14]]) g.lineTo(x, y);
      g.closePath(); g.fill(); g.fillStyle = "#fff8e9"; g.fillRect(15, 15, 2, 2);
    } else {
      const gr = g.createRadialGradient(m, m, 0, m, m, m);
      gr.addColorStop(0, "rgba(255,249,235,.95)");
      gr.addColorStop(0.22, `rgba(${rgb},.65)`); gr.addColorStop(0.55, `rgba(${rgb},.12)`);
      gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(0, 0, s, s);
    }
    if (sprites.size >= 80) sprites.delete(sprites.keys().next().value);
    sprites.set(key, c); return c;
  }

  const E = {
    dust(s, n, pal, mode = "fall", delay = 0, alpha = 0.64, life = null) {
      for (let i = 0; i < n; i++) {
        // 종류와 크기를 반드시 한 번의 판정으로 묶는다 (review ①).
        const isStar = !motion.matches && mode !== "ember" && Math.random() < 0.15;
        const rising = mode === "rise" || mode === "ember", low = mode === "low";
        add(s, { k: isStar ? "twinkle" : mode === "ember" ? "ember" : "mote", rgb: pick(pal),
          x: R(-0.48, 0.48) * s.o.w,
          y: (low ? R(0.22, 0.5) : rising ? R(0.12, 0.5) : R(-0.59, -0.12)) * s.o.h,
          vx: R(-3, 3), vy: low ? R(-2, 3) : (rising ? -1 : 1) * s.o.h * R(0.18, 0.31),
          sz: (isStar ? R(1.6, 2.7) : R(0.55, 1.05)) * s.scale,
          delay: delay + R(0, 0.65), alpha, drag: rising ? 0.65 : 0.48,
          life: life === null ? R(1.8, 3) : clamp(finite(life, 2.4), 1.5, 3),
        });
      }
    },
    trail(s, n, pal) {
      const w = s.o.w * 0.98, h = s.o.h * 0.98, perimeter = 2 * (w + h);
      for (let i = 0; i < n; i++) {
        let d = ((i + 0.5) / n) * perimeter, x, y;
        // 상→우→하→좌 한 바퀴. 드문드문 점만 흘리고 윤곽선은 그리지 않는다.
        if (d < w) { x = -w / 2 + d; y = -h / 2; }
        else if ((d -= w) < h) { x = w / 2; y = -h / 2 + d; }
        else if ((d -= h) < w) { x = w / 2 - d; y = h / 2; }
        else { d -= w; x = -w / 2; y = h / 2 - d; }
        const isStar = Math.random() < 0.18;
        add(s, { k: isStar ? "twinkle" : "mote", rgb: pick(pal),
          x: x + R(-3, 3) * s.scale, y: y + R(-3, 3) * s.scale,
          vx: R(-4, 4), vy: R(5, 13),
          sz: (isStar ? R(1.5, 2.4) : R(0.5, 0.9)) * s.scale,
          life: R(1.5, 2.2), delay: i / n * 0.85 + R(0, 0.05), alpha: 0.5,
        });
      }
    },
    drops(s, n, pal, delay) {
      for (let i = 0; i < n; i++) add(s, { k: "drop", rgb: pick(pal),
        x: R(-0.33, 0.33) * s.o.w, y: R(-0.5, -0.12) * s.o.h,
        vx: R(-2, 2), vy: s.o.h * R(0.22, 0.36), drag: 0.3,
        sz: R(0.7, 1.15) * s.scale, amp: R(1.5, 3) * s.scale,
        delay: delay + i * 0.09 + R(0, 0.1), life: R(1.8, 2.7), alpha: 0.58,
      });
    },
    mist(s, n, rgb, alpha = 0.2, delay = 0) {
      if (motion.matches) return;
      for (let i = 0; i < n; i++) add(s, { k: "mist", rgb,
        x: R(-0.35, 0.35) * s.o.w, y: R(0.3, 0.48) * s.o.h,
        vx: R(-5, 5), vy: R(-1.5, 0), amp: 3 * s.scale,
        sz: s.o.w * R(0.44, 0.7), height: s.o.h * R(0.08, 0.14),
        life: R(2.5, 3), delay: delay + i * 0.12, alpha,
      });
    },
    petals(s, n, delay) {
      for (let i = 0; i < n; i++) add(s, { k: "petal", rgb: pick(RGB.love),
        x: R(-0.46, 0.38) * s.o.w, y: R(-0.55, -0.28) * s.o.h,
        vx: R(2, 8), vy: s.o.h * R(0.18, 0.26), amp: R(7, 13) * s.scale,
        sz: R(3.5, 5.8) * s.scale, rot: R(-1, 1), spin: R(-0.7, 0.7),
        life: R(2.5, 3), delay: delay + R(0, 0.7), alpha: 0.62,
      });
    },
    air(s, n, delay) {
      for (let i = 0; i < n; i++) add(s, { k: "wisp", rgb: pick(RGB.air),
        x: R(-0.48, -0.12) * s.o.w, y: R(-0.4, 0.35) * s.o.h,
        vx: s.o.w * R(0.2, 0.32), vy: R(1, 7), amp: R(4, 8) * s.scale,
        sz: R(3, 6) * s.scale, life: R(1.7, 2.6), delay: delay + R(0, 0.6), alpha: 0.32,
      });
    },
  };

  function perform(kind, s, power, delay = 0, multi = false) {
    const p = strength(power); if (!p) return;
    const pal = palette(kind), n = Math.max(1, Math.round((motion.matches ? 3 : 28) * p * (multi ? 0.6 : 1)));
    if (motion.matches) { E.dust(s, Math.min(4, n), pal, "low", 0, 0.35); return; }
    switch (kind) {
      case "water": case "star":
        E.drops(s, Math.max(2, Math.round(n * 0.28)), pal, delay);
        E.dust(s, Math.round(n * 0.62), pal, "fall", delay, 0.54); break;
      case "tower": {
        const h = Math.min(s.o.h * 0.5, 160);
        add(s, { k: "bolt", rgb: "205,218,239", x: R(-0.1, 0.1) * s.o.w, y: -s.o.h * 0.49,
          sz: h, life: 0.3, delay: delay + 0.06, alpha: 0.48,
          pts: [[0, 0], [R(-0.04, 0.04), 0.23], [0.025, 0.43], [-0.025, 0.66], [0.01, 1]],
        });
        E.dust(s, Math.round(n * 0.65), ["210,202,183", "197,204,217"], "fall", delay + 0.16, 0.48); break;
      }
      case "death": case "shadow":
        E.mist(s, multi ? 2 : 3, kind === "death" ? "31,28,43" : "38,28,56", 0.36, delay);
        E.dust(s, Math.max(3, Math.round(n * 0.3)), RGB.shadow, "low", delay, 0.34); break;
      case "moon":
        E.mist(s, 2, "111,123,155", 0.13, delay);
        E.dust(s, Math.round(n * 0.65), pal, "fall", delay, 0.48); break;
      case "love": case "bloom":
        E.petals(s, Math.max(2, Math.round(n * 0.22)), delay);
        E.dust(s, Math.round(n * 0.55), kind === "bloom" ? RGB.wood : RGB.love, "fall", delay, 0.5); break;
      case "sun": case "fire": case "darkfire": case "lantern":
        // 작은 상승 가루/불씨만으로 따뜻함을 표현. 공통 섬광/광선 없음.
        E.dust(s, n, pal, kind === "sun" ? "rise" : "ember", delay, kind === "darkfire" ? 0.45 : 0.65);
        if (kind === "darkfire") E.mist(s, 2, "40,24,37", 0.24, delay);
        break;
      case "air":
        E.air(s, Math.max(2, Math.round(n * 0.25)), delay);
        E.dust(s, Math.round(n * 0.5), pal, "fall", delay, 0.48); break;
      case "wood":
        E.petals(s, Math.max(1, Math.round(n * 0.1)), delay);
        E.dust(s, Math.round(n * 0.7), pal, "fall", delay, 0.52); break;
      default:
        // 펜타클은 금가루 하강, 마법사는 약한 바람만 (궤도/원형 배치 없음).
        E.dust(s, n, pal, "fall", delay);
    }
  }

  // 공개 API는 유지하되 넓은 오라/방사광/섬광은 작은 가루로 대체.
  function aura(t, kind = "light", dur = 3.2) {
    const s = setup(t); if (!s) return;
    const n = motion.matches ? 2 : 6, pal = palette(kind);
    for (let i = 0; i < n; i++) add(s, { k: "mote", rgb: pick(pal),
      x: s.o.w * R(0.42, 0.53) * (i % 2 ? 1 : -1), y: s.o.h * R(-0.42, 0.4),
      sz: R(0.6, 0.95) * s.scale, vy: R(4, 10),
      life: clamp(finite(dur, 2.6), 1.5, 3), alpha: 0.42, delay: i * 0.06,
    });
    kick();
  }
  function godrays(t, kind = "light", dur = 3.2) { aura(t, kind, dur); }
  function flash(t, rgb = "255,240,200", sz = 1, life = 2.4) {
    const p = strength(sz), s = p && setup(t); if (!s) return;
    E.dust(s, motion.matches ? 2 : Math.round(5 * p), [rgb], "fall", 0, 0.48, life); kick();
  }
  const shake = () => {};
  const veil = (t, on) => {}; // 전체 화면 베일/블러 제거. API 호환만 유지.

  function draw(ctx, p) {
    const q = p.age / p.life;
    // 15%까지 부드럽게 등장, 나머지 85%는 길게 사라진다.
    const e = q < 0.15 ? Math.sin(q / 0.15 * Math.PI / 2) : ((1 - q) / 0.85) ** 1.5;
    const flicker = 0.62 + 0.38 * (0.5 + 0.5 * Math.sin(p.age * 4.3 + p.ph)) ** 3;
    ctx.globalAlpha = e * p.alpha * (p.k === "mist" || p.still ? 1 : flicker);
    const x = p.px, y = p.py, s = p.sz;
    switch (p.k) {
      case "mist": {
        const grow = 1 + q * 0.16;
        ctx.drawImage(sprite("mist", p.rgb), x - s * grow, y - p.height / 2, s * 2 * grow, p.height); break;
      }
      case "bolt":
        ctx.globalAlpha = Math.sin(Math.PI * q) * p.alpha;
        ctx.strokeStyle = `rgb(${p.rgb})`; ctx.lineWidth = 0.75; ctx.lineJoin = "round";
        ctx.beginPath(); p.pts.forEach(([a, b], i) => ctx[i ? "lineTo" : "moveTo"](x + a * s, y + b * s)); ctx.stroke(); break;
      case "wisp": {
        const a = Math.atan2(p.vy, p.vx), dx = Math.cos(a) * s, dy = Math.sin(a) * s;
        ctx.strokeStyle = `rgb(${p.rgb})`; ctx.lineWidth = 0.65; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(x - dx, y - dy);
        ctx.quadraticCurveTo(x - dx * 0.45, y - dy * 0.45 - s * 0.36, x, y); ctx.stroke();
        ctx.drawImage(sprite("mote", p.rgb), x - 1.5, y - 1.5, 3, 3); break;
      }
      case "petal":
        ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot + p.age * p.spin);
        ctx.scale(0.35 + 0.65 * Math.abs(Math.cos(p.age * 2 + p.ph)), 1);
        ctx.drawImage(sprite("petal", p.rgb), -s, -s, s * 2, s * 2); ctx.restore(); break;
      case "drop":
        // 작은 물방울과 2~3px 꼬리. 착지 파문 없음.
        ctx.drawImage(sprite("mote", p.rgb), x - s * 1.25, y - s * 2.6, s * 2.5, s * 4.2); break;
      case "ember":
        ctx.drawImage(sprite("mote", p.rgb), x - s * 1.4, y - s * 2.2, s * 2.8, s * 4.4); break;
      case "twinkle": {
        const radius = s * (0.65 + 0.35 * Math.sin(p.age * 3 + p.ph) ** 2);
        ctx.drawImage(sprite("twinkle", p.rgb), x - radius, y - radius, radius * 2, radius * 2); break;
      }
      default:
        // sz는 코어 반경. 과거처럼 최대 11px를 다시 5배로 키우지 않는다.
        ctx.drawImage(sprite("mote", p.rgb), x - s * 2.2, y - s * 2.2, s * 4.4, s * 4.4);
    }
  }
  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
    const rects = new Map();
    const position = t => { if (!rects.has(t)) rects.set(t, at(t)); return rects.get(t); };
    let count = 0;
    for (const em of emitters) {
      em.left -= dt; em.next -= dt;
      if (em.left <= 0 || (em.t && em.t.isConnected === false)) continue;
      if (em.next <= 0) {
        const o = position(em.t);
        if (o.w > 0 && o.h > 0) E.dust({ ...em.s, o }, motion.matches ? 1 : 2, palette(em.kind), "fall", 0, 0.42);
        em.next = motion.matches ? 1.2 : 0.5;
      }
      emitters[count++] = em;
    }
    emitters.length = count; count = 0;
    for (const p of parts) {
      if (p.t && p.t.isConnected === false) continue;
      const o = position(p.t);
      if (o.w < 1 || o.h < 1) continue;
      if (p.delay > 0) { p.delay -= dt; parts[count++] = p; continue; }
      p.age += dt; if (p.age >= p.life) continue;
      const speed = p.still ? 0 : 1;
      p.vx *= Math.exp(-p.drag * dt); p.vy *= Math.exp(-p.drag * dt);
      p.dx += p.vx * dt * speed; p.dy += p.vy * dt * speed;
      const phase = p.ph + p.age * p.freq;
      const sway = (Math.sin(phase) - Math.sin(p.ph)) * p.amp * speed;
      p.px = o.x + p.x + p.dx + sway + p.wind * p.age * speed;
      p.py = o.y + p.y + p.dy + (Math.cos(phase * 0.7) - Math.cos(p.ph * 0.7)) * p.amp * 0.3 * speed;
      parts[count++] = p;
    }
    parts.length = count;
    const nav = document.querySelector("nav.tabs"), nr = nav && nav.getBoundingClientRect();
    for (const { ctx, cv } of layers) {
      ctx.clearRect(0, 0, W, H); ctx.save(); ctx.globalCompositeOperation = "source-over";
      // 반투명 메뉴 뒤로도 가루가 비치지 않게 제외. 상단 메뉴도 대응.
      if (nr && nr.width > 0 && nr.height > 0) {
        ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.rect(nr.left, nr.top, nr.width, nr.height); ctx.clip("evenodd");
      }
      // 안개는 후경. 가산 합성은 어느 패스에서도 사용하지 않는다.
      for (let pass = 0; pass < 2; pass++) for (const p of parts) {
        if (p.l.cv !== cv || p.delay > 0 || !p.age || (p.k === "mist") !== (pass === 0)) continue;
        draw(ctx, p);
      }
      ctx.restore(); ctx.globalAlpha = 1;
    }
    if (parts.length || emitters.length) raf = requestAnimationFrame(frame);
  }

  addEventListener("resize", fit);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) return;
    if (raf) cancelAnimationFrame(raf); raf = 0; parts = []; emitters = [];
    for (const { ctx } of layers) ctx.clearRect(0, 0, W, H);
  });
  motion.addEventListener("change", () => {
    if (!motion.matches) return;
    parts = parts.filter(p => p.k === "mote" || p.k === "twinkle").slice(-12);
    for (const p of parts) {
      const o = at(p.t);
      if (Number.isFinite(p.px)) { p.x = p.px - o.x; p.y = p.py - o.y; }
      p.dx = p.dy = 0; p.k = "mote"; p.sz = Math.min(p.sz, 1);
      p.still = true; p.alpha = Math.min(p.alpha, 0.35);
    }
    emitters = [];
  });

  return {
    kindOf, WHY,
    play(kind, t, power = 1) {
      if (!strength(power)) return;
      const s = setup(t); if (!s) return;
      perform(kind, s, power); kick();
    },
    reveal(card, rev, t, power = 1, multi = false) {
      const p = strength(power); if (!p) return;
      const s = setup(t); if (!s) return;
      const kind = kindOf(card, rev), pal = palette(kind);
      // 테두리를 한번 스침 + 상단 가루 + 곧바로 고유 형상.
      // 모션 감소에서는 정적인 작은 가루 3~4개만.
      if (!motion.matches) {
        E.trail(s, Math.round((multi ? 14 : 24) * Math.min(p, 1)), pal);
        if (!["death", "shadow"].includes(kind)) E.dust(s, multi ? 5 : 8, RGB.light, "fall", 0.06, 0.46);
      }
      perform(kind, s, p, 0.12, multi); kick();
    },
    ambient(kind, t, sec = 3) {
      const s = setup(t); if (!s || emitters.length >= 12) return;
      const duration = clamp(finite(sec, 3), 0, 30); if (!duration) return;
      emitters.push({ s, t: s.t, kind, left: duration, next: 0 }); kick();
    },
    aura, godrays, flash, veil, kick, shake,
  };
})();
