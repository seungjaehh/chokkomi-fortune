// 운세 계산 엔진 — 쪼꼬미 봇 core/saju.py · gunghap.py · tarot.py 를 그대로 옮김 (DOM 없음)
const SJ = (() => {
  const STEMS = "갑을병정무기경신임계", STEMS_H = "甲乙丙丁戊己庚辛壬癸";
  const BR = "자축인묘진사오미신유술해", BR_H = "子丑寅卯辰巳午未申酉戌亥";
  const ZODIAC = ["쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양", "원숭이", "닭", "개", "돼지"];
  const ZODIAC_EMOJI = ["🐭", "🐮", "🐯", "🐰", "🐲", "🐍", "🐴", "🐑", "🐵", "🐔", "🐶", "🐷"];
  const EL = ["목", "화", "토", "금", "수"], EL_H = ["木", "火", "土", "金", "水"];
  const SE = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];
  const BE = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];
  // 지지 음양은 십성을 볼 때 본기(정기) 지장간 기준: 자(계)·오(정)는 음, 사(병)·해(임)는 양
  const BY = [0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1].map(Boolean);
  const set = (s) => [...s].sort().join("");
  const STEM_COMBINE = { [set("갑기")]: "토", [set("을경")]: "금", [set("병신")]: "수", [set("정임")]: "목", [set("무계")]: "화" };
  const STEM_CLASH = new Set(["갑경", "을신", "병임", "정계"].map(set));
  const SIX_HARMONY = { [set("자축")]: "토", [set("인해")]: "목", [set("묘술")]: "화", [set("진유")]: "금", [set("사신")]: "수", [set("오미")]: "화" };
  const THREE = [["신자진", "수"], ["해묘미", "목"], ["인오술", "화"], ["사유축", "금"]];
  const SIX_CLASH = new Set(["자오", "축미", "인신", "묘유", "진술", "사해"].map(set));
  const WONJIN = new Set(["자미", "축오", "인유", "묘신", "진해", "사술"].map(set));
  const SIX_HARM = new Set(["자미", "축오", "인사", "묘진", "신해", "유술"].map(set));
  const PUNISH = new Set(["인사", "사신", "인신", "축술", "술미", "축미", "자묘"].map(set));
  const TEN = { same: ["비견", "겁재"], output: ["식신", "상관"], wealth: ["편재", "정재"], power: ["편관", "정관"], resource: ["편인", "정인"] };
  const GROUP = { 비견: "비겁", 겁재: "비겁", 식신: "식상", 상관: "식상", 편재: "재성", 정재: "재성", 편관: "관성", 정관: "관성", 편인: "인성", 정인: "인성" };
  const mod = (a, n) => ((a % n) + n) % n;
  const gen = (a, b) => (a + 1) % 5 === b;
  const ctl = (a, b) => (a + 2) % 5 === b;

  function tenGod(dayStem, el, yang) {
    const me = SE[dayStem];
    const rel = el === me ? "same" : gen(me, el) ? "output" : ctl(me, el) ? "wealth" : ctl(el, me) ? "power" : "resource";
    return TEN[rel][((dayStem % 2 === 0) === yang) ? 0 : 1];
  }
  const jd = (ms) => ms / 864e5 + 2440587.5;
  function sunLon(ms) {
    const t = (jd(ms) - 2451545) / 36525, r = Math.PI / 180;
    const l0 = 280.46646 + 36000.76983 * t + 0.0003032 * t * t;
    const m = (357.52911 + 35999.05029 * t - 0.0001537 * t * t) * r;
    const c = (1.914602 - 0.004817 * t - 0.000014 * t * t) * Math.sin(m) + (0.019993 - 0.000101 * t) * Math.sin(2 * m) + 0.000289 * Math.sin(3 * m);
    const om = (125.04 - 1934.136 * t) * r;
    return mod(l0 + c - 0.00569 - 0.00478 * Math.sin(om), 360);
  }
  // 12절 입절 시각표 (1899 입춘 ~ 2101, UTC 분). astronomy-engine으로 구해 한국천문연구원 발표와 분 단위 일치 확인
  const JIE = (() => { const base = -37293113, e = "27r2q33ax3sr42d40y3ow35s2kz2421v71wk27q2q33ay3ss42f4113oy35s2kz2401v51wj27r2q53b23su42f40z3ow35s2l02431v71wi27p2q23ay3sp42a40w3ox35u2l52471vb1wj27o2pz3aw3sp42d4103oy35w2l32461va1wj27n2pz3aw3sr42f4103oy35u2l12451v91wl27p2q13aw3sn42b40x3ox35u2l22451vb1wm27s2q33ay3so42a40w3ox35v2l42461va1wk27o2q03av3sn42a40x3oy35x2l52471va1wi27m2pz3au3sp42d40z3oy35u2l32461va1wj27o2q13ay3sq42e40z3ow35s2l22461vb1wl27p2py3at3sl42940w3ox35v2l52471vc1wl27p2py3as3sl42b40z3p135y2l42451v81wi27n2pz3av3so42e4103p135x2l42441v71wh27m2pz3au3sn42a40x3oy35x2l72471va1wi27n2py3au3so42b40y3p035y2l824a1vb1wi27j2pt3ap3sm42b4103p235z2l924a1vc1wi27j2pt3an3sk42c4123p235z2l62481vc1wk27n2px3as3sl42b4103p235y2l72481vc1wk27o2pw3ap3sh42540v3p03612lb24b1vd1wk27m2pw3ap3sj42840x3p23612lb24a1vb1wh27l2pw3as3so42c40z3p135y2l824a1vb1wi27l2pw3ar3sl42a40x3oy35x2l724a1vd1wl27n2px3ar3sl42b4103p135z2l82491vc1wi27l2pt3ao3sl42c4123p43632l92481v91wg27j2ps3ap3sj42c4133p63622l92481v81wg27j2pu3as3sm42d4123p53632lb24a1vb1wf27i2pq3am3si42840y3p43652lf24f1ve1wh27g2po3aj3sf42a4113p63662le24d1vd1wh27h2pp3al3si42b4133p73642lc24b1vd1wj27j2pr3al3se42640x3p33632lc24e1ve1wk27l2pt3am3sf42640x3p43652le24e1vd1wi27h2pq3am3sg42840z3p43662lf24e1vd1wg27g2pp3al3sh4284103p33632lc24d1vc1wi27j2pr3an3sj42b4113p43622lb24d1ve1wi27j2pp3ak3se4274103p43652le24d1ve1wj27h2po3ai3se4274133p83672le24c1va1we27g2pp3am3si42c4153pa3682le24b1va1we27e2pp3al3sh4274103p63672lg24f1vd1wg27f2pm3aj3sg4284123p736a2lj24h1ve1wf27b2pj3ag3se42b4153pb36b2li24i1ve1wg27c2pj3ae3sc4284143p93692lh24f1ve1wi27g2pn3ah3sd4284133pa36a2li24g1vf1wi27g2pm3ag3s942440y3p836c2ll24k1vg1wh27e2pl3ae3sa42440z3p936b2ll24i1ve1wg27d2pm3ah3sg4294133p836a2li24h1vf1wh27e2pm3ah3sd42540y3p53672lh24i1vg1wk27g2pm3ag3sb4264103p836a2li24h1ve1wh27d2pk3af3sd4284153pc36d2lj24f1vc1we27c2pj3af3sc4274133pb36b2lj24f1vb1we27c2pl3ah3se4294133pb36d2ll24i1vd1we27a2ph3ad3sa4264123pb36e2lo24l1vh1wf27a2pe3a83s74264143pc36f2lm24k1vf1wf27a2pg3ab3sa4294163pf36f2ll24i1ve1wg27d2pi3ab3s84234103pa36e2lm24k1vh1wh27d2pj3ab3s74224103pb36g2lp24l1vg1we2792pg3ab3sa4264143pe36g2lq24l1vg1we2782pf3aa3sa4264133pa36d2lm24k1vh1wg27b2ph3ab3sb4274143pc36e2lm24k1vh1wg27c2pf3a93s74254143pe36g2lp24m1vh1wf27b2pe3a73s64244143pg36i2lo24k1vd1wc2792pf3ab3sa4294173ph36k2lp24k1vd1wc2782pf3ab3s94254123pc36i2lr24o1vh1we2782pd3a83s64234133pe36j2ls24p1vi1we2752pa3a53s64284173pj36k2ls24p1vh1wf2772pa3a53s54244143pg36i2lp24m1vh1wg27b2pe3a73s44234133pf36k2lr24n1vh1wg2792pd3a73s34214123pf36l2lv24q1vi1wf2772pb3a53s24214123pf36j2lt24o1vg1wd2762pb3a73s84274153pg36k2lr24n1vg1we2782pc3a73s64244123pd36h2lr24o1vj1wg2782pb3a53s24234133pg36k2ls24n1vh1wc2752p93a43s54264193pm36o2lu24n1vf1wa2742p83a53s54254163pi36n2lt24o1vf1wa2752p93a43s54244163pi36o2lw24s1vh1wc2732p63a13s14244163pk36q2lz24u1vl1we2732p439x3rz4214163pk36p2lx24r1vj1we2752p63a03s14244173pm36q2lw24r1vi1wf2762pa3a23s04204123pi36o2ly24t1vk1wg2772p93a23ry41y4103pi36o2lz24u1vj1wd2742p63a13s24244163pl36q2lz24t1vj1wc2742p63a13s44244143ph36m2lv24r1vk1we2762p83a23s24234153pi36m2lv24s1vj1we2752p739z3s04234173pm36q2ly24s1vj1wd2732p539z3ry4224173pm36r2ly24p1vf1wa2712p63a13s14254193po36t2lz24q1vf1w92712p53a13s14234153pl36s2m124v1vj1wc2702p239x3rx4214153pl36s2m224w1vk1wb26y2oy39t3ry42441a3pr36w2m224u1vk1wb2702p139u3rx4224183pn36t2m024u1vj1wd2732p439w3rv41y4153pm36t2m324v1vk1wd2712p239v3ru41y4153po36x2m624y1vm1wd2702p039u3rv41z4143pm36u2m324w1vl1wb2702p139w3rx4224183pm36t2m224v1vl1wc2722p239x3rx4214163pm36s2m224w1vm1wf2732p239v3ru41z4153pn36u2m224v1vj1wb26z2p039u3rw42341b3ps36z2m524u1vi1w826y2p039w3rz4234193pq36w2m424v1vj1w926y2p039v3ry4204173pp36w2m624y1vl1wb26w2ow39q3ru42141a3ps3702m92511vn1wc26x2ov39o3rs4204193ps36z2m524y1vl1wb26y2oy39q3rs4204193ps36z2m624x1vl1wb2702p039s3rt41x4153pq36z2m82501vm1wd26z2oz39s3rr41v4133po36z2m82511vl1wa26w2ov39p3ru4204183ps3712m82501vm1w926w2ov39r3rw4214193pp36w2m624y1vm1wc26y2ox39r3rt41z4163pp36x2m524z1vm1wc26x2ov39n3rr41y41a3pu3732m92501vl1wa26w2ov39n3rr41z4193pv3722m824y1vj1w726v2ov39p3rt41z4193pu3732ma24z1vk1w826u2ou39p3rs41z4173pt3722mc2541vp1wb26u2os39m3rq41w4173ps3722mc2541vo1wa26t2oq39j3ro41z41c3pw3752mc2521vn1wa26v2ot39m3rq41y41a3pv3732ma2511vn1wb26y2ov39o3rp41v4163ps3732mb2531vn1wb26v2os39l3ro41w4183pu3772mf2551vo1wa26u2or39l3rq41y41a3pu3732mc2531vn1w926t2os39n3rq4204193pu3722mb2511vn1wa26v2os39m3rq41y4193pu3742mc2531vo1wc26v2ot39k3ro41x4193pv3752mc2521vm1w726s2op39j3ro41y41d3q03782mf2531vj1w626p2oq39l3rr41z41c3py3772mf2541vm1w726r2op39k3rp41x4193pv3762mg2561vp1w926p2ok39e3rk41w41b3pz37b2mj2581vr1w926q2ol39e3rj41w41d3q03792mg2551vo1wa26r2oo39g3rk41u41a3py3782mg2551vo1w926t2oq39g3rk41s4163px3792mj2591vq1wb26t2op39h3rk41s4163pv3782mj2581vp1w826p2om39g3rk41w4193py3792mi2571vp1w826q2om39h3ro41y41b3px3762mf2561vp1wb26s2op39i3rm41w4193pw3772mf2551vp1w926r2ol39e3ri41v41c3q237c2mk2571vn1w826o2ol39f3rl41x41e3q337d2mj2551vl1w526n2ol39h3rm41x41c3q137c2mk2571vo1w526n2oj39e3rj41w41b3q037e2mn25b1vs1w926n2oi39b3ri41v41b3q137e2mm25b1vr1w826m2og3993rg41u41d3q537f2mm25a1vp1w926n2oj39b3ri41u41c3q237e2ml25a1vq1wa26q2om39e3rh41s4183py37d2mm25c1vr1w826o2oi39a3re41r4193q137g2mp25d1vt1w826m2oh39a3rh41v41c3q237d2mm25a1vq1w926n2oi39c3rj41v41b3q037b2mk2591vq1w926p2oi39b3rf41t41a3q137d2mm25b1vr1wa26o2oj39b3rf41t41c3q337f2mn2591vo1w626l2og3993rh41u41d3q537i2mo25a1vn1w326j2og39a3rj41v41d3q437h2mo25c1vq1w526l2og39a3ri41v41b3q237g2mp25e1vs1w726j2ob3933rc41s41e3q637j2mr25f1vt1w826j2oc3933rc41u41g3q837k2mp25c1vq1w826l2of3973re41t41c3q537j2mp25c1vr1w626m2of3973rb41p4193q337k2mu25g1vt1w826l2oe3973rd41r41a3q537j2mt25g1vt1w626i2ob3953re41t41d3q537j2ms25e1vs1w726i2oc3963re41v41d3q537i2mq25d1vt1w926m2of3973re41u41d3q437i2mq25e1vs1w726k2oc3923ra41q41e3q937m2mu25f1vr1w626h2ob3933rc41u41g3qa37o2mu25e1vp1w326h2oc3963re41v41d3q737m2mu25g1vr1w526g2o93923ra41q41c3q637m2mx25k1vv1w826i2o83903r941q41e3q937n2mw25i1vu1w726h2o738z3r841r41e3qa37o2mv25g1vt1w626i2o93923r841q41c3q737n2mw25g1vu1w726j2od3943rb41p41a3q637m2mw25i1vu1w726g2o83903r741o41b3q837o2my25j1vv1w626f2o738z3r941s41f3q937o2mv25h1vs1w626g2o93933rb41u41e3q837m2mt25g1vt1w626h2o83903r741o41d3q937o2mw25i1vu1w726h2o73903r741q41f3qc37s2my25h1vr1w326d2o638z3r941s41g3qd37t2n025i1vq1w226c2o438z3r941r41f3qb37r2n025l1vu1w526d2o638y3r941s41f3qa37r2n125m1vx1w626d2o138t3r341p41f3qd37u2n225n1vx1w726d2o238t3r341p41g3qf37u2n125k1vu1w626g2o738y3r641p41e3qc37s2n125k1vv1w626g2o638x3r341k4193q937t2n225p1vx1w726f2o538w3r541n41c3qb37t2n225n1vw1w526c2o438w3r741r41f3qc37r2n125l1vu1w526d2o338w3r641q41e3qb37p2mz25k1vw1w626f2o638y3r641r41f3qd37s2mz25k1vv1w426d2o238t3r341p41f3qg37w2n325m1vs1w226a2o038t3r341q41i3qh37x2n425l1vs1w02692o238v3r841r41i3qf37w2n425n1vv1w22692ny38r3r141m41e3qe37w2n625r1vy1w626a2nx38o3qz41n41g3qi37y2n725p1vx1w426a2ny38p3r041o41i3qh37z2n625p1vv1w326b2nz38r3r041k41d3qe37x2n725p1vx1w626c2o238t3r141m41d3qe37x2n825r1vy1w526a2nx38q3qz41m41e3qe37z2n925s1vy1w52692nw38o3r041o41g3qg37x2n625q1vw1w526b2o038s3r341q41i3qg37w2n425o1vx1w626b2o038p3qz41l41d3qg37y2n725q1vy1w526b2nz38o3qz41l41h3qj3822n925p1vu1w12672ny38q3r341p41j3qk3822n925q1vv1w02652nw38q3r141n41g3qg3802n925s1vy1w42672nw38o3r041p41g3qi3812na25t1vz1w52662nt38j3qw41n41i3qk3842nb25t1vz1w42672ns38j3qv41l41h3ql3832na25r1vx1w32682nx38o3qy41m41h3qk3822nb25r1vy1w32682nw38m3qv41i41b3qh3822nd25v1w11w42672nu38j3qv41j41e3qi3842nc25v1vy1w22662ns38m3qy41o41j3qk3822nb25s1vy1w32662nt38m3qx41l41f3qh3802n925s1vz1w52682nv38l3qx41l41h3qk3842nb25t1vx", t = [base];
    for (let i = 0; i < e.length; i += 3) t.push(t[t.length - 1] + parseInt(e.substr(i, 3), 36) + 40000); return t; })();
  // 그 순간이 몇 번째 절기 구간인지 (0 = 1899년 입춘 이후). 표 밖이면 근사식으로
  function jieIndex(utcMs) {
    const m = utcMs / 6e4;
    if (m < JIE[0] || m >= JIE[JIE.length - 1]) { const y = new Date(utcMs).getUTCFullYear(), off = Math.floor(mod(sunLon(utcMs) - 315, 360) / 30);
      const mo = new Date(utcMs).getUTCMonth(); return ((mo <= 1 && off >= 10 ? y - 1 : y) - 1899) * 12 + off; }
    let lo = 0, hi = JIE.length - 1; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (JIE[mid] <= m) lo = mid; else hi = mid; } return lo;
  }
  // 가장 가까운 절입 시각과의 차이(시간). 태어난 시를 모를 때 경계일 경고용
  function jieGapHours(utcMs) { const i = jieIndex(utcMs), m = utcMs / 6e4; if (i < 0 || i >= JIE.length - 1) return 99;
    return Math.min(m - JIE[i], JIE[i + 1] - m) / 60; }
  // 한국 표준시의 역사적 변화(1954~61 UTC+8:30, 1948~60·1987~88 서머타임)를 브라우저 시간대 DB로 반영
  let seoulFmt = null;
  function seoulOff(utcMs) {
    try { seoulFmt = seoulFmt || new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Seoul", hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" });
      const p = {}; for (const x of seoulFmt.formatToParts(new Date(utcMs))) p[x.type] = +x.value;
      return (Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(utcMs / 1000) * 1000) / 6e4;
    } catch (_) { return 540; }
  }
  function wallToUtc(wallMs) { let o = seoulOff(wallMs - 540 * 6e4), u = wallMs - o * 6e4; const o2 = seoulOff(u); if (o2 !== o) u = wallMs - o2 * 6e4; return u; }
  // 그 날짜 한낮에 서울이 쓰던 UTC 시차(분): 보통 540, 서머타임 600, 1954~61년 510
  const tzAt = (y, mo, d) => Math.round(seoulOff(wallToUtc(Date.UTC(y, mo - 1, d, 12))));
  const dayIndexUTC = (ms) => mod(Math.floor(ms / 864e5) + 2440588 + 49, 60);
  const gapja = (i) => ({ s: i % 10, b: i % 12 });
  const ptext = (p) => STEMS[p.s] + BR[p.b];
  const phanja = (p) => STEMS_H[p.s] + BR_H[p.b];

  function compute(y, mo, d, h = null, mi = 0, gender = null) {
    const known = h !== null && h !== undefined;
    const wall = Date.UTC(y, mo - 1, d, known ? h : 12, known ? mi : 0);   // 태어난 곳 벽시계 (서울 기준)
    const utc = wallToUtc(wall);                                           // 그때 실제 쓰던 표준시·서머타임을 풀어 세계시로
    const tz = Math.round(seoulOff(utc));
    const solar = utc + 508 * 6e4;                                         // 서울 경도(127°) 평균태양시 = 세계시 + 8시간 28분
    const sd = new Date(known ? solar : wall);
    let dayMs = Date.UTC(sd.getUTCFullYear(), sd.getUTCMonth(), sd.getUTCDate());
    if (known && sd.getUTCHours() >= 23) dayMs += 864e5;                  // 자시(23시~)는 다음 날로 넘김
    const day = gapja(dayIndexUTC(dayMs));
    const ji = jieIndex(utc), sy = 1899 + Math.floor(ji / 12), off = mod(ji, 12);
    const year = gapja(mod(sy - 4, 60));
    const month = { s: ((year.s % 5) * 2 + 2 + off) % 10, b: (2 + off) % 12 };
    let hour = null;
    if (known) {
      const hb = Math.floor((sd.getUTCHours() + 1) / 2) % 12;
      hour = { s: ((day.s % 5) * 2 + hb) % 10, b: hb };
    }
    const pillars = [hour, day, month, year].filter(Boolean);
    const gap = jieGapHours(utc);
    return { year, month, day, hour, pillars, gender, lon: sunLon(utc), tz, jieNear: !known && gap < 13, solarHM: known ? [sd.getUTCHours(), sd.getUTCMinutes()] : null,
      birth: { y, mo, d, h: known ? h : null, mi } };
  }
  function elements(sj) {
    const c = [0, 0, 0, 0, 0];
    for (const p of sj.pillars) { c[SE[p.s]]++; c[BE[p.b]]++; }
    return c;
  }
  function gods(sj) {
    const r = {};
    const add = (g) => (r[g] = (r[g] || 0) + 1);
    for (const p of sj.pillars) {
      if (p !== sj.day) add(tenGod(sj.day.s, SE[p.s], p.s % 2 === 0));
      add(tenGod(sj.day.s, BE[p.b], BY[p.b]));
    }
    return r;
  }
  function strength(sj) {
    const me = SE[sj.day.s];
    const helps = (e) => e === me || gen(e, me);
    let score = 0;
    for (const p of sj.pillars) {
      if (p !== sj.day && helps(SE[p.s])) score += 10;
      if (helps(BE[p.b])) score += p === sj.month ? 20 : 10;
    }
    const total = 10 * (sj.pillars.length * 2 - 1) + 10;
    const x = (score * 100) / total; let ratio = Math.round(x); if (x - Math.floor(x) === 0.5 && ratio % 2) ratio--; // 파이썬 round 와 같게
    const label = ratio >= 55 ? "신강 (힘이 센 편)" : ratio <= 40 ? "신약 (힘이 여린 편)" : "중화 (균형 잡힌 편)";
    return [label, ratio];
  }
  function branchRelations(a, b) {
    const pair = set(BR[a] + BR[b]), out = [];
    if (a === b) out.push(["같은 글자", 4, "같은 기운이라 서로를 잘 이해해요"]);
    if (a === b && [4, 6, 9, 11].includes(a)) out.push(["자형", -3, `${BR[a]}${BR[b]} 자형 — 같은 고집끼리 부딪혀 스스로 지치기 쉬워요`]);
    if (SIX_HARMONY[pair]) out.push(["육합", 12, `${BR[a]}${BR[b]}합(${SIX_HARMONY[pair]}) — 자연스럽게 끌리고 맞물리는 짝`]);
    for (const [g, e] of THREE) if (a !== b && g.includes(BR[a]) && g.includes(BR[b])) out.push(["삼합", 9, `${g} 삼합(${e}국)의 일부 — 같은 목표를 향해 힘을 모아요`]);
    if (SIX_CLASH.has(pair)) out.push(["충", -10, `${BR[a]}${BR[b]}충 — 정반대 기운이라 부딪히지만 강하게 끌리기도 해요`]);
    if (WONJIN.has(pair)) out.push(["원진", -8, `${BR[a]}${BR[b]} 원진 — 이유 없이 서운함이 쌓이기 쉬워요. 대화로 풀어야 해요`]);
    if (PUNISH.has(pair)) out.push(["형", -5, `${BR[a]}${BR[b]} 형 — 서로를 다듬으려다 상처를 줄 수 있어요`]);
    if (SIX_HARM.has(pair) && !WONJIN.has(pair)) out.push(["해", -4, `${BR[a]}${BR[b]} 해 — 사소한 오해를 조심해요`]);
    return out;
  }
  function stemRelation(a, b) {
    const pair = set(STEMS[a] + STEMS[b]), ea = SE[a], eb = SE[b];
    if (STEM_COMBINE[pair]) return ["천간합", 20, `${STEMS[a]}${STEMS[b]}합(${STEM_COMBINE[pair]}) — 일간끼리 합하는 '천생연분'형. 만나면 서로 끌려요`];
    if (STEM_CLASH.has(pair)) return ["천간충", -10, `${STEMS[a]}${STEMS[b]}충 — 생각과 방식이 정면으로 달라 다툼이 잦을 수 있어요`];
    if (ea === eb) return ["비화", 6, "같은 오행 — 친구처럼 편하고 말이 잘 통해요"];
    if (gen(ea, eb)) return ["상생", 12, `내 ${EL[ea]}이(가) 상대의 ${EL[eb]}을(를) 생해요 — 내가 아끼고 챙겨 주는 관계`];
    if (gen(eb, ea)) return ["상생", 12, `상대의 ${EL[eb]}이(가) 내 ${EL[ea]}을(를) 생해요 — 상대가 나를 아끼고 챙겨 주는 관계`];
    if (ctl(ea, eb)) return ["상극", -3, `내 ${EL[ea]}이(가) 상대의 ${EL[eb]}을(를) 극해요 — 내가 주도하는 관계, 강요는 금물`];
    return ["상극", -3, `상대의 ${EL[eb]}이(가) 내 ${EL[ea]}을(를) 극해요 — 상대가 주도하는 관계, 휘둘리지 않게`];
  }
  // KST 기준 오늘
  function kstNow() { const n = Date.now() + 9 * 36e5; const d = new Date(n); return { y: d.getUTCFullYear(), mo: d.getUTCMonth() + 1, d: d.getUTCDate(), ms: n }; }
  function todayPillar() { const t = kstNow(); return gapja(dayIndexUTC(Date.UTC(t.y, t.mo - 1, t.d))); }
  function yearPillarNow() { const sy = 1899 + Math.floor(jieIndex(Date.now()) / 12); return { p: gapja(mod(sy - 4, 60)), year: sy }; }

  // ---- 이름 (훈민정음 해례본 오음 · 획수 놀이)
  const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ", JUNG = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ";
  const JONG = ["", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
  const STROKES = { ㄱ: 2, ㄲ: 4, ㄴ: 2, ㄷ: 3, ㄸ: 6, ㄹ: 5, ㅁ: 4, ㅂ: 4, ㅃ: 8, ㅅ: 2, ㅆ: 4, ㅇ: 1, ㅈ: 3, ㅉ: 6, ㅊ: 4, ㅋ: 3, ㅌ: 4, ㅍ: 4, ㅎ: 3,
    ㅏ: 2, ㅐ: 3, ㅑ: 3, ㅒ: 4, ㅓ: 2, ㅔ: 3, ㅕ: 3, ㅖ: 4, ㅗ: 2, ㅘ: 4, ㅙ: 5, ㅚ: 3, ㅛ: 3, ㅜ: 2, ㅝ: 4, ㅞ: 5, ㅟ: 3, ㅠ: 3, ㅡ: 1, ㅢ: 2, ㅣ: 1,
    ㄳ: 4, ㄵ: 5, ㄶ: 5, ㄺ: 7, ㄻ: 9, ㄼ: 9, ㄽ: 7, ㄾ: 9, ㄿ: 9, ㅀ: 8, ㅄ: 6 };
  const SOUND = {};
  [["ㄱㄲㅋ", 0], ["ㄴㄷㄸㄹㅌ", 1], ["ㅁㅂㅃㅍ", 2], ["ㅅㅆㅈㅉㅊ", 3], ["ㅇㅎ", 4]].forEach(([s, e]) => [...s].forEach((c) => (SOUND[c] = e)));
  function decompose(ch) { const c = ch.charCodeAt(0) - 0xac00; if (!(c >= 0 && c < 11172)) return null; return [CHO[Math.floor(c / 588)], JUNG[Math.floor((c % 588) / 28)], JONG[c % 28]]; }
  const hangul = (n) => [...(n || "")].filter((c) => decompose(c)).join("");
  const strokes = (ch) => decompose(ch).reduce((a, p) => a + (p ? STROKES[p] || 0 : 0), 0);
  function nameMatch(a, b) {
    a = hangul(a); b = hangul(b);
    if (!a || !b) return [0, [], ""];
    let seq = [], letters = "";
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (i < a.length) { seq.push(strokes(a[i])); letters += a[i]; }
      if (i < b.length) { seq.push(strokes(b[i])); letters += b[i]; }
    }
    const rows = [seq];
    while (seq.length > 2) { seq = seq.slice(1).map((x, i) => (seq[i] + x) % 10); rows.push(seq); }
    return [seq.length === 2 ? seq[0] * 10 + seq[1] : seq[0] * 10, rows, letters];
  }
  function soundRelation(mine, theirs) {
    const a = [...hangul(mine)].map((c) => SOUND[decompose(c)[0]]), b = [...hangul(theirs)].map((c) => SOUND[decompose(c)[0]]);
    if (!a.length || !b.length) return null;
    const ea = a.length >= 3 ? a[1] : a[0], eb = b.length >= 3 ? b[1] : b[0];
    if (ea === eb) return [4, `두 이름 모두 ${EL[ea]} 소리 — 말투와 분위기가 닮았어요`];
    if (gen(ea, eb) || gen(eb, ea)) return [8, `${EL[ea]} 소리와 ${EL[eb]} 소리가 서로 생해요 — 이름을 부를수록 정이 쌓여요`];
    return [-3, `${EL[ea]} 소리와 ${EL[eb]} 소리가 극해요 — 애칭을 지어 부르면 부드러워져요`];
  }
  const GRADES = [[90, "💞 천생연분", "만나기만 해도 기운이 맞물리는 사이예요. 인연을 놓치지 마요!"], [78, "💗 아주 좋은 인연", "서로 채워 주는 힘이 커요. 조금만 다가가도 잘 통해요."],
    [64, "💛 좋은 인연", "기본 궁합이 좋아요. 대화를 쌓을수록 가까워져요."], [50, "🤍 노력형 인연", "좋은 점과 부딪히는 점이 반반이에요. 배려가 열쇠예요."],
    [0, "🩶 성장형 인연", "다른 점이 많은 만큼 서로에게서 배울 게 많아요. 천천히 맞춰 가요."]];
  function compatibility(me, other, myName, theirName) {
    const items = [];
    if (me && other) {
      const [n, dlt, t] = stemRelation(me.day.s, other.day.s);
      items.push([`일간 ${STEMS[me.day.s]}·${STEMS[other.day.s]} (${n})`, dlt, t]);
      const rels = branchRelations(me.day.b, other.day.b);
      rels.forEach(([n2, d2, t2]) => items.push([`일지(배우자 자리) ${n2}`, d2, t2]));
      if (!rels.length) items.push(["일지(배우자 자리)", 0, "특별한 합·충이 없어 무난해요"]);
      for (const [n3, d3, t3] of branchRelations(me.year.b, other.year.b)) {
        if (n3 === "같은 글자") continue;
        items.push([`띠 ${ZODIAC[me.year.b]}·${ZODIAC[other.year.b]} ${n3}`, Math.round(d3 * 0.6), t3]);
      }
      const mine = elements(me), theirs = elements(other);
      const filled = mine.map((c, i) => (c === 0 && theirs[i] >= 2 ? i : -1)).filter((i) => i >= 0);
      if (filled.length) items.push(["오행 보완", 10, `나에게 없는 ${filled.map((i) => EL[i]).join("·")} 기운을 상대가 넉넉히 가졌어요 — 곁에 있으면 편안해지는 사이`]);
      const back = theirs.map((c, i) => (c === 0 && mine[i] >= 2 ? i : -1)).filter((i) => i >= 0);
      if (back.length) items.push(["오행 보완", 6, `상대에게 없는 ${back.map((i) => EL[i]).join("·")} 기운을 내가 채워 줘요`]);
      if (me.gender === "남" || me.gender === "여") {
        const g = tenGod(me.day.s, SE[other.day.s], other.day.s % 2 === 0);
        const want = me.gender === "남" ? ["정재", "편재"] : ["정관", "편관"];
        if (want.includes(g)) items.push(["배우자 별", g === "정재" || g === "정관" ? 8 : 5, `상대 일간이 나에게 ${g} — 명리에서 말하는 '배우자 자리' 기운이라 끌림이 있어요`]);
      }
    }
    if (myName && theirName) { const r = soundRelation(myName, theirName); if (r) items.push(["이름 발음오행", r[0], r[1]]); }
    const score = Math.max(30, Math.min(99, 60 + items.reduce((a, x) => a + x[1], 0)));
    const g = GRADES.find(([cut]) => score >= cut);
    return { score, items, grade: g[1], summary: g[2] };
  }

  // ---- 별자리 (실제 태양 황경 기준 회귀황도 12궁) · 수비학 생명수
  const signOf = (sj) => Math.floor(sj.lon / 30) % 12;
  function lifePath(y, mo, d) {
    const red = (n) => { while (n > 9 && ![11, 22, 33].includes(n)) n = [...String(n)].reduce((a, c) => a + +c, 0); return n; };
    return red(red(mo) + red(d) + red(y));
  }
  return { STEMS, STEMS_H, BR, BR_H, ZODIAC, ZODIAC_EMOJI, EL, EL_H, SE, BE, BY, GROUP, tenGod, sunLon, compute, elements, gods, strength,
    branchRelations, stemRelation, todayPillar, yearPillarNow, kstNow, gapja, ptext, phanja, nameMatch, compatibility, signOf, lifePath, gen, ctl, mod, tzAt };
})();
if (typeof module !== "undefined") module.exports = SJ;
