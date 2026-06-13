/* ============================================================
   DEMAIN — moteur astrologique traditionnel, 100 % navigateur
   Établi et jugé "selon les anciens" :
   sept astres, zodiaque tropical, dignités essentielles,
   aspects ptolémaïques, phases de la Lune, heures planétaires
   inégales (ordre chaldéen), application de la Lune.
   ============================================================ */
(function () {
"use strict";
const A = window.Astronomy;
const D2R = Math.PI / 180, R2D = 180 / Math.PI;
const n360 = x => ((x % 360) + 360) % 360;
const BXL = { lat: 50.8503, lon: 4.3517 };   // Bruxelles (hommage Brahy)

/* ----------------------------- Tables ----------------------------- */
const SIGNS = [
  { nom:'Bélier',     g:'♈', elem:'Feu',   mode:'Cardinal', dom:'mars' },
  { nom:'Taureau',    g:'♉', elem:'Terre', mode:'Fixe',     dom:'venus' },
  { nom:'Gémeaux',    g:'♊', elem:'Air',   mode:'Mutable',  dom:'mercury' },
  { nom:'Cancer',     g:'♋', elem:'Eau',   mode:'Cardinal', dom:'moon' },
  { nom:'Lion',       g:'♌', elem:'Feu',   mode:'Fixe',     dom:'sun' },
  { nom:'Vierge',     g:'♍', elem:'Terre', mode:'Mutable',  dom:'mercury' },
  { nom:'Balance',    g:'♎', elem:'Air',   mode:'Cardinal', dom:'venus' },
  { nom:'Scorpion',   g:'♏', elem:'Eau',   mode:'Fixe',     dom:'mars' },
  { nom:'Sagittaire', g:'♐', elem:'Feu',   mode:'Mutable',  dom:'jupiter' },
  { nom:'Capricorne', g:'♑', elem:'Terre', mode:'Cardinal', dom:'saturn' },
  { nom:'Verseau',    g:'♒', elem:'Air',   mode:'Fixe',     dom:'saturn' },
  { nom:'Poissons',   g:'♓', elem:'Eau',   mode:'Mutable',  dom:'jupiter' },
];
const SIGN_PHRASE = [
  "l'élan, l'initiative et l'ardeur",
  "la constance, les biens et la patience",
  "le commerce des esprits, la parole et le mouvement",
  "le foyer, les humeurs et l'attachement",
  "l'éclat, l'autorité et la magnanimité",
  "le travail, le discernement et le service",
  "l'accord, la mesure et les alliances",
  "la passion, les ressources cachées et la métamorphose",
  "les hauts desseins, la foi et les voyages",
  "l'ambition, la durée et la discipline",
  "les vues d'ensemble, les amitiés et les réformes",
  "la compassion, le retrait et l'invisible",
];

const PLANETS = [
  { key:'sun',     nom:'Soleil',  g:'☉', body:A.Body.Sun,     chald:3, nature:'lum',    sect:'jour' },
  { key:'moon',    nom:'Lune',    g:'☽', body:A.Body.Moon,    chald:6, nature:'lum',    sect:'nuit' },
  { key:'mercury', nom:'Mercure', g:'☿', body:A.Body.Mercury, chald:5, nature:'neutre', sect:'var'  },
  { key:'venus',   nom:'Vénus',   g:'♀', body:A.Body.Venus,   chald:4, nature:'benef',  sect:'nuit' },
  { key:'mars',    nom:'Mars',    g:'♂', body:A.Body.Mars,    chald:2, nature:'malef',  sect:'nuit' },
  { key:'jupiter', nom:'Jupiter', g:'♃', body:A.Body.Jupiter, chald:1, nature:'benef',  sect:'jour' },
  { key:'saturn',  nom:'Saturne', g:'♄', body:A.Body.Saturn,  chald:0, nature:'malef',  sect:'jour' },
];
const PMAP = Object.fromEntries(PLANETS.map(p => [p.key, p]));
// exaltation : signe (index) + degré
const EXALT = { sun:{s:0,d:19}, moon:{s:1,d:3}, mercury:{s:5,d:15}, venus:{s:11,d:27},
                mars:{s:9,d:28}, jupiter:{s:3,d:15}, saturn:{s:6,d:21} };
// triplicité (Doroth.) par élément : maître de jour / de nuit
const TRIPL = { Feu:{j:'sun',n:'jupiter'}, Terre:{j:'venus',n:'moon'},
                Air:{j:'saturn',n:'mercury'}, Eau:{j:'venus',n:'mars'} };

const ASPECTS = [
  { deg:0,   nom:'conjonction', g:'☌', maj:true,  fam:'neutre' },
  { deg:60,  nom:'sextile',     g:'⚹', maj:false, fam:'harmon' },
  { deg:90,  nom:'carré',       g:'□', maj:true,  fam:'tendu'  },
  { deg:120, nom:'trigone',     g:'△', maj:true,  fam:'harmon' },
  { deg:180, nom:'opposition',  g:'☍', maj:true,  fam:'tendu'  },
];
const MOIETY = { sun:5, moon:5, mercury:3.5, venus:3.5, mars:4, jupiter:4.5, saturn:4.5 };
const DAYRULER = [3,6,2,5,1,4,0]; // dimanche..samedi -> index chaldéen du maître du jour
const JOURS = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
const ROMAN = ['','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];

/* --------------------------- Astronomie --------------------------- */
function tropLon(body, date) {                       // longitude écliptique vraie de la date
  const v = A.GeoVector(body, date, true);
  const e = A.RotateVector(A.Rotation_EQJ_ECT(date), v);
  return n360(A.SphereFromVector(e).lon);
}
function obliq(date) {
  const T = A.MakeTime(date).tt / 36525;
  return 23 + 26/60 + (21.448 - 46.8150*T - 0.00059*T*T + 0.001813*T*T*T) / 3600;
}
function ramcDeg(date, lonE) { return n360((A.SiderealTime(date) + lonE/15) * 15); }
function mcLon(rm, eps) { return n360(Math.atan2(Math.sin(rm*D2R), Math.cos(rm*D2R)*Math.cos(eps*D2R)) * R2D); }
function ascLon(rm, lat, eps) {
  const r = rm*D2R, e = eps*D2R, f = lat*D2R;
  return n360(Math.atan2(Math.cos(r), -(Math.sin(r)*Math.cos(e) + Math.tan(f)*Math.sin(e))) * R2D);
}
function bodySpeed(body, date) {                      // degrés / jour
  const h = 6*3600*1000;
  let a = tropLon(body, new Date(date.getTime()-h));
  let b = tropLon(body, new Date(date.getTime()+h));
  let d = b - a; if (d > 180) d -= 360; if (d < -180) d += 360;
  return d * 2;
}
function sunAltitude(date, lat, lonE) {
  const obs = new A.Observer(lat, lonE, 0);
  const eq = A.Equator(A.Body.Sun, date, obs, true, true);
  return A.Horizon(date, obs, eq.ra, eq.dec, null).altitude;
}

/* dignité essentielle d'un astre dans un signe */
function dignity(key, lon) {
  const s = Math.floor(lon/30);
  const sign = SIGNS[s];
  if (sign.dom === key) return { kind:'domicile', cl:'dom', txt:'en domicile' };
  if (EXALT[key] && EXALT[key].s === s) return { kind:'exaltation', cl:'exa', txt:'exalté' };
  if (SIGNS[(s+6)%12].dom === key) return { kind:'détriment', cl:'det', txt:'en exil' };
  if (EXALT[key] && EXALT[key].s === (s+6)%12) return { kind:'chute', cl:'chu', txt:'en chute' };
  const tr = TRIPL[sign.elem];
  if (tr && (tr.j === key || tr.n === key)) return { kind:'triplicité', cl:'tri', txt:'en triplicité' };
  return { kind:'pérégrin', cl:'per', txt:'pérégrin' };
}
const ESS = { domicile:5, exaltation:4, 'triplicité':3, 'pérégrin':0, chute:-4, 'détriment':-5 };

/* thème complet pour un instant + lieu */
function buildChart(date, lat, lonE) {
  const eps = obliq(date);
  const rm  = ramcDeg(date, lonE);
  const asc = ascLon(rm, lat, eps);
  const mc  = mcLon(rm, eps);
  const day = sunAltitude(date, lat, lonE) > 0;
  const ascSign = Math.floor(asc/30);
  const sunLon = tropLon(A.Body.Sun, date);
  const planets = PLANETS.map(p => {
    const lon = tropLon(p.body, date);
    const sp  = bodySpeed(p.body, date);
    const sign = Math.floor(lon/30);
    const house = ((sign - ascSign) % 12 + 12) % 12 + 1;   // signes entiers
    const dig = dignity(p.key, lon);
    // rapport au Soleil
    let solar = null;
    if (p.key !== 'sun') {
      let d = Math.abs(lon - sunLon); if (d > 180) d = 360 - d;
      if (d < 0.283) solar = 'cazimi';
      else if (d < 8.5) solar = 'combuste';
      else if (d < 15) solar = 'sous les rayons';
    }
    return { ...p, lon, speed:sp, retro: sp < 0, sign, deg: lon - sign*30, house, dig, solar };
  });
  return { date, lat, lonE, eps, rm, asc, mc, ascSign, day, planets, sunLon };
}

/* force d'un astre (essentielle + accidentelle) → maître du moment */
function strength(p) {
  let s = ESS[p.dig.kind];
  s += ({1:4,4:4,7:4,10:4, 2:2,5:2,8:2,11:2, 3:0,6:0,9:0,12:0})[p.house];
  if (p.retro) s -= 3;
  if (p.solar === 'combuste') s -= 5;
  else if (p.solar === 'cazimi') s += 5;
  else if (p.solar === 'sous les rayons') s -= 1;
  if (p.speed !== 0 && !p.retro && p.key!=='sun' && p.key!=='moon') s += 0.5;
  return s;
}

/* aspects entre les sept astres */
function aspectsOf(planets) {
  const res = [];
  for (let i=0;i<planets.length;i++) for (let j=i+1;j<planets.length;j++) {
    const a = planets[i], b = planets[j];
    let d = Math.abs(a.lon - b.lon); if (d > 180) d = 360 - d;
    for (const asp of ASPECTS) {
      const orb = MOIETY[a.key] + MOIETY[b.key] - (asp.maj ? 0 : 1);
      if (Math.abs(d - asp.deg) <= orb) {
        const la = a.lon + a.speed*0.02, lb = b.lon + b.speed*0.02;
        let dd = Math.abs(la-lb); if (dd>180) dd = 360-dd;
        const applying = Math.abs(dd-asp.deg) < Math.abs(d-asp.deg);
        res.push({ a, b, asp, orb: Math.abs(d-asp.deg), applying, fam: aspectFamily(a,b,asp) });
        break;
      }
    }
  }
  return res.sort((x,y)=>x.orb-y.orb);
}
function aspectFamily(a,b,asp) {
  if (asp.fam !== 'neutre') return asp.fam;              // sextile/trigone/carré/opposition
  // conjonction : selon la nature des deux astres
  const mal = k => k==='mars'||k==='saturn', ben = k => k==='venus'||k==='jupiter';
  if (mal(a.key) && !ben(b.key) || mal(b.key) && !ben(a.key)) return 'tendu';
  if (ben(a.key) || ben(b.key)) return 'harmon';
  return 'neutre';
}

/* phase de la Lune */
function moonPhase(date) {
  const e = n360(tropLon(A.Body.Moon,date) - tropLon(A.Body.Sun,date));
  const ill = Math.round(A.Illumination(A.Body.Moon,date).phase_fraction * 100);
  const names = ['Nouvelle Lune','Premier croissant','Premier Quartier','Lune gibbeuse croissante',
                 'Pleine Lune','Lune gibbeuse décroissante','Dernier Quartier','Lune balsamique'];
  const idx = Math.floor((n360(e + 22.5)) / 45);
  return { nom: names[idx], waxing: e < 180, illum: ill, elong: e };
}

/* prochaine application de la Lune (premier aspect majeur perfectionné) */
function moonApplication(date) {
  const horizon = 60, step = 1/3;   // 60 h, pas de 20 min
  const prev = {};
  for (let h = 0; h <= horizon; h += step) {
    const t = new Date(date.getTime() + h*3600000);
    const ml = tropLon(A.Body.Moon, t);
    for (const p of PLANETS) {
      if (p.key === 'moon') continue;
      const pl = tropLon(p.body, t);
      const d = n360(ml - pl);
      for (const ang of [0,60,90,120,180]) {
        let o1 = d-ang;        if(o1>180)o1-=360; if(o1<-180)o1+=360;
        let o2 = d-(360-ang);  if(o2>180)o2-=360; if(o2<-180)o2+=360;
        const o = Math.abs(o1) < Math.abs(o2) ? o1 : o2;
        const id = p.key+'_'+ang;
        if (prev[id] !== undefined && Math.sign(prev[id]) !== Math.sign(o)
            && Math.abs(prev[id]) < 4 && Math.abs(o) < 4 && h > 0) {
          return { planet:p, asp: ASPECTS.find(a=>a.deg===ang), hours:h, when:t };
        }
        prev[id] = o;
      }
    }
  }
  return null;
}

/* heures planétaires inégales (ordre chaldéen, depuis le lever) */
function planetaryHour(date, lat, lonE) {
  const obs = new A.Observer(lat, lonE, 0);
  const rise = (after) => A.SearchRiseSet(A.Body.Sun, obs, +1, after, 2);
  const set  = (after) => A.SearchRiseSet(A.Body.Sun, obs, -1, after, 2);
  let sr = rise(new Date(date.getTime() - 30*3600000));   // dernier lever ≤ date
  while (true) { const nx = rise(new Date(sr.date.getTime() + 3600000)); if (nx && nx.date.getTime() <= date.getTime()) sr = nx; else break; }
  const ss = set(sr.date);
  let isDay, segStart, segEnd, hourInPeriod, governingSunrise = sr.date;
  if (date.getTime() < ss.date.getTime()) {               // jour
    isDay = true; const len = (ss.date - sr.date) / 12;
    hourInPeriod = Math.floor((date - sr.date) / len);
    segStart = new Date(sr.date.getTime() + hourInPeriod*len); segEnd = new Date(segStart.getTime()+len);
  } else {                                                 // nuit
    isDay = false; const nextSr = rise(ss.date); const len = (nextSr.date - ss.date) / 12;
    hourInPeriod = 12 + Math.floor((date - ss.date) / len);
    const i = hourInPeriod - 12;
    segStart = new Date(ss.date.getTime() + i*len); segEnd = new Date(segStart.getTime()+len);
  }
  const wd = weekdayBxl(governingSunrise);
  const dayRulerChald = DAYRULER[wd];
  const ruler = PLANETS.find(p => p.chald === ((dayRulerChald + hourInPeriod) % 7));
  const dayRuler = PLANETS.find(p => p.chald === dayRulerChald);
  return { isDay, num: hourInPeriod + 1, ruler, dayRuler, weekday: wd, segStart, segEnd };
}

/* aspects des transits du moment au thème natal */
function transitsToNatal(natal, now) {
  const targets = natal.planets.map(p=>({key:p.key,nom:p.nom,g:p.g,lon:p.lon}))
    .concat([{key:'asc',nom:'Ascendant',g:'Asc',lon:natal.asc},{key:'mc',nom:'Milieu du Ciel',g:'MC',lon:natal.mc}]);
  const res = [];
  now.planets.forEach(tp => targets.forEach(np => {
    let d = Math.abs(tp.lon - np.lon); if (d>180) d = 360-d;
    for (const asp of ASPECTS) {
      const orb = (tp.key==='sun'||tp.key==='moon') ? 2.4 : 1.6;
      if (Math.abs(d-asp.deg) <= orb) {
        res.push({ tp, np, asp, orb: Math.abs(d-asp.deg), fam: asp.fam==='neutre'?'neutre':asp.fam }); break;
      }
    }
  }));
  return res.sort((a,b)=>a.orb-b.orb);
}

/* ----------------------------- Format ----------------------------- */
function fmtLon(lon) {
  lon = n360(lon); const s = Math.floor(lon/30), d = lon - s*30;
  const deg = Math.floor(d), min = Math.round((d-deg)*60);
  const D = min===60 ? deg+1 : deg, M = min===60 ? 0 : min;
  return { deg:D, min:M, sign:s, html:`${D}°${String(M).padStart(2,'0')}′ <span class="g">${SIGNS[s].g}</span>` };
}
function weekdayBxl(d) {
  const s = new Intl.DateTimeFormat('en-US',{weekday:'short',timeZone:'Europe/Brussels'}).format(d);
  return {Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[s];
}
function fmtDateBxl(d) {
  return new Intl.DateTimeFormat('fr-BE',{dateStyle:'long',timeZone:'Europe/Brussels'}).format(d);
}
function fmtTimeBxl(d) {
  return new Intl.DateTimeFormat('fr-BE',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Brussels'}).format(d);
}
function bxlOffsetMin(d) {
  const p = new Intl.DateTimeFormat('en-US',{timeZone:'Europe/Brussels',hour12:false,
    year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})
    .formatToParts(d).reduce((a,x)=>(a[x.type]=x.value,a),{});
  const asUTC = Date.UTC(+p.year,+p.month-1,+p.day,+p.hour===24?0:+p.hour,+p.minute);
  return (asUTC - d.getTime())/60000;
}
function bxlWallToDate(y,mo,da,h,mi) {                    // heure murale belge -> instant UTC
  let g = new Date(Date.UTC(y,mo-1,da,h,mi));
  g = new Date(g.getTime() - bxlOffsetMin(g)*60000);
  g = new Date(Date.UTC(y,mo-1,da,h,mi) - bxlOffsetMin(g)*60000); // 2e passe (bascule DST)
  return g;
}
function dureeHumaine(h) {
  if (h < 1) return `dans ${Math.round(h*60)} minutes`;
  if (h < 24) { const H=Math.floor(h), M=Math.round((h-H)*60); return `dans ${H} h${M?String(M).padStart(2,'0'):''}`; }
  return `dans ${Math.round(h/24)} jour(s)`;
}

/* ------------------------ Figure carrée --------------------------- */
function drawSquare(svg, chart) {
  const S = 400, M = S/2, Q = S/4, T = 3*S/4;
  const P = { A:[0,0], B:[S,0], C:[S,S], D:[0,S], T:[M,0], R:[S,M], Bo:[M,S], L:[0,M], O:[M,M],
              p1:[Q,Q], p2:[T,Q], p3:[T,T], p4:[Q,T] };
  // maison -> sommets (sens anti-horaire, Ascendant à gauche)
  const CELLS = {
    1:['L','p1','O','p4'], 2:['D','L','p4'],   3:['D','Bo','p4'],
    4:['Bo','p4','O','p3'],5:['C','Bo','p3'],  6:['C','R','p3'],
    7:['R','p2','O','p3'], 8:['B','R','p2'],   9:['B','T','p2'],
    10:['T','p2','O','p1'],11:['A','T','p1'],  12:['A','L','p1'],
  };
  const angular = new Set([1,4,7,10]);
  const byHouse = {}; for (let i=1;i<=12;i++) byHouse[i]=[];
  chart.planets.forEach(p => byHouse[p.house].push(p));

  let html = '';
  // contour + diamant
  html += `<rect class="bord" x="2" y="2" width="${S-4}" height="${S-4}"/>`;
  html += `<polygon class="filet" points="${P.T} ${P.R} ${P.Bo} ${P.L}"/>`;
  html += `<line class="filet" x1="0" y1="0" x2="${S}" y2="${S}"/>`;
  html += `<line class="filet" x1="${S}" y1="0" x2="0" y2="${S}"/>`;

  for (let h=1; h<=12; h++) {
    const pts = CELLS[h].map(k=>P[k]);
    const cx = pts.reduce((s,p)=>s+p[0],0)/pts.length;
    const cy = pts.reduce((s,p)=>s+p[1],0)/pts.length;
    const signIdx = ((chart.ascSign + h - 1) % 12 + 12) % 12;
    html += `<polygon class="cell${angular.has(h)?' angul':''}" points="${pts.map(p=>p.join(',')).join(' ')}"/>`;
    // numéro de maison (vers le centre du segment extérieur)
    html += `<text class="num" x="${cx}" y="${cy-16}" text-anchor="middle">${ROMAN[h]}</text>`;
    html += `<text class="sg" x="${cx}" y="${cy-2}" text-anchor="middle">${SIGNS[signIdx].g}</text>`;
    // astres de la maison
    const arr = byHouse[h];
    arr.forEach((p,i) => {
      const cols = arr.length>2?2:1, col=i%cols, row=Math.floor(i/cols);
      const x = cx + (cols>1?(col?14:-14):0);
      const y = cy + 16 + row*16;
      html += `<text class="pl${p.retro?' retro':''}" x="${x}" y="${y}" text-anchor="middle">${p.g}</text>`;
    });
  }
  // repères ASC / MC
  html += `<text class="axe" x="6" y="${M-4}" text-anchor="start">ASC</text>`;
  html += `<text class="axe" x="${M}" y="14" text-anchor="middle">MC</text>`;
  svg.innerHTML = html;
}

/* -------------------- Tableau des positions ----------------------- */
function fillPositions(tbody, chart) {
  const etat = p => {
    const e = [];
    if (p.retro) e.push('<span class="r">℞</span>');
    if (p.solar) e.push(p.solar);
    return e.join(', ') || '—';
  };
  let rows = '<tr><th>Astre</th><th>Position</th><th>Mais.</th><th>Dignité</th><th>État</th></tr>';
  chart.planets.forEach(p => {
    const f = fmtLon(p.lon);
    rows += `<tr><td><span class="g">${p.g}</span> ${p.nom}</td>`
      + `<td class="pos">${f.html}</td><td>${ROMAN[p.house]}</td>`
      + `<td class="dig ${p.dig.cl}">${p.dig.txt}</td><td>${etat(p)}</td></tr>`;
  });
  const fa = fmtLon(chart.asc), fm = fmtLon(chart.mc);
  rows += `<tr><td><span class="g">⊕</span> Ascendant</td><td class="pos">${fa.html}</td><td>I</td><td class="dig">—</td><td>—</td></tr>`;
  rows += `<tr><td><span class="g">⊗</span> Milieu du Ciel</td><td class="pos">${fm.html}</td><td>X</td><td class="dig">—</td><td>—</td></tr>`;
  tbody.innerHTML = rows;
}

/* --------------------- Jugements (texte) -------------------------- */
const DIG_JUGE = {
  domicile:'pleinement maître de ses effets', exaltation:'honoré, porté au plus haut de sa vertu',
  'triplicité':"d'une force honnête, soutenu par sa triplicité", 'pérégrin':"pérégrin, sans appui ni dignité",
  'détriment':'en exil, contrarié dans sa nature', chute:"en chute, abaissé et empêché d'agir selon son bien",
};
const ASP_JUGE = { harmon:'concours favorable', tendu:'tension à dénouer', neutre:'union de leurs natures' };
function art(nom){ return /^[AEÉIOUH]/i.test(nom)?"d'":'de '; }
function deP(p){ return p.key==='sun'?'du ':p.key==='moon'?'de la ':'de '; }   // "du Soleil", "de la Lune", "de Mars"
function leP(p){ return p.key==='sun'?'le ':p.key==='moon'?'la ':''; }          // "le Soleil", "la Lune", "Mars"
function esc(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function jugeCiel(chart, ph, app, hour) {
  const sun = chart.planets.find(p=>p.key==='sun');
  const moon = chart.planets.find(p=>p.key==='moon');
  const asps = aspectsOf(chart.planets);
  const dominant = chart.planets.slice().sort((a,b)=>strength(b)-strength(a))[0];

  // score de tendance
  let sc = 0;
  chart.planets.forEach(p=>{
    const e = ESS[p.dig.kind];
    if (p.nature==='benef') sc += 1 + e*0.4;
    if (p.nature==='malef') sc -= 1 - e*0.3;
    if (p.retro) sc -= 0.5;
    if (p.solar==='combuste') sc -= 1;
  });
  sc += ph.waxing ? 1 : -0.6;
  asps.filter(a=>a.applying).forEach(a=>{ sc += a.fam==='harmon'?1 : a.fam==='tendu'?-1 : 0; });
  let tend, tcl;
  if (sc >= 2.2) { tend='Favorable'; tcl='t-fav'; }
  else if (sc <= -2.2) { tend='Tendu'; tcl='t-tendu'; }
  else if (sc > -0.8 && sc < 0.8) { tend='Indécis'; tcl='t-neutre'; }
  else { tend='Contrasté'; tcl='t-cont'; }

  const fa = fmtLon(chart.asc);
  let h = '';
  h += `<h2>Bulletin de l'heure</h2>`;
  h += `<p class="chapeau">Le ciel se lève sur Bruxelles à l'Ascendant <b>${fa.deg}° ${SIGNS[fa.sign].nom}</b>, `
     + `sous la garde ${deP(hour.ruler)}<b>${hour.ruler.nom}</b>, maître de la ${hour.num}<sup>e</sup> heure ${hour.isDay?'du jour':'de la nuit'}, `
     + `en ce ${JOURS[hour.weekday]} ${deP(hour.dayRuler)}<b>${hour.dayRuler.nom}</b>. `
     + `L'Ascendant en signe ${SIGNS[fa.sign].mode.toLowerCase()} ${SIGNS[fa.sign].elem==='Feu'?'de feu':SIGNS[fa.sign].elem==='Eau'?"d'eau":SIGNS[fa.sign].elem==='Air'?"d'air":'de terre'} `
     + `incline aux choses qui touchent ${SIGN_PHRASE[fa.sign]}.</p>`;

  // luminaires
  const fs = fmtLon(sun.lon), fmn = fmtLon(moon.lon);
  h += `<h3>Les deux luminaires</h3>`;
  h += `<p>Le <b>Soleil</b> chemine par ${fs.deg}° ${SIGNS[fs.sign].nom}, ${DIG_JUGE[sun.dig.kind]} ; `
     + `il fait le thème <b>${chart.day?'diurne':'nocturne'}</b>, où ${chart.day?'Saturne, Jupiter et lui-même tiennent le haut bout':'la Lune, Vénus et Mars gouvernent par préséance'}. `;
  h += `La <b>Lune</b>, à ${fmn.deg}° ${SIGNS[fmn.sign].nom}, ${moon.dig.txt}, se montre <b>${ph.nom.toLowerCase()}</b> `
     + `(${ph.illum}% de lumière, ${ph.waxing?'croissante — temps d\'accroître et d\'entreprendre':'décroissante — temps de réduire, conclure et conserver'}). `;
  if (app) {
    h += `Elle <b>applique au ${app.asp.nom}</b> ${deP(app.planet)}<b>${app.planet.nom}</b>, perfection ${dureeHumaine(app.hours)} : `
       + `${app.asp.fam==='harmon'?'présage de facilité et de bonnes nouvelles sur ce qui se trame alors'
            : app.asp.fam==='tendu'?'avertit d\'un obstacle ou d\'une contrariété à ce moment'
            : (app.planet.nature==='benef'?'mêle heureusement leurs influences':app.planet.nature==='malef'?'demande prudence en l\'affaire':'colore l\'heure de leur commun naturel')}.`;
  } else {
    h += `Elle ne perfectionne aucun aspect majeur avant de changer de signe : <i>course vide</i> — « rien ne se conclura » de ce qu'on entreprend à la légère.`;
  }
  h += `</p>`;

  // maître du moment + aspects
  h += `<h3>Maître du moment & configurations</h3>`;
  h += `<p><b>${dominant.nom}</b>, ${fmtLon(dominant.lon).deg}° ${SIGNS[dominant.sign].nom} (${dominant.dig.txt}, `
     + `${[1,4,7,10].includes(dominant.house)?'angulaire et puissant':[3,6,9,12].includes(dominant.house)?'cadent, d\'effet plus discret':'succédent'}), `
     + `donne le ton dominant de l'heure.</p>`;
  const top = asps.slice(0,5);
  if (top.length) {
    h += `<ul class="aspects-list">`;
    top.forEach(a=>{
      const cl = a.fam==='harmon'?'asp-h':a.fam==='tendu'?'asp-t':'asp-n';
      h += `<li><span class="g">${a.a.g} ${a.asp.g} ${a.b.g}</span> — `
         + `<b>${a.a.nom} ${a.asp.nom} ${a.b.nom}</b> `
         + `<span class="${cl}">(${ASP_JUGE[a.fam]}, ${a.applying?'appliquant':'séparant'}, orbe ${a.orb.toFixed(1)}°)</span></li>`;
    });
    h += `</ul>`;
  }
  const empechees = chart.planets.filter(p=>p.retro||p.solar==='combuste');
  if (empechees.length) {
    h += `<p><i>Astres empêchés :</i> ${empechees.map(p=>`${p.nom} ${p.retro?'(rétrograde)':''}${p.solar==='combuste'?'(combuste)':''}`).join(', ')} — on en attendra moins de franchise.</p>`;
  }

  // verdict
  h += `<div class="verdict"><span class="tendance ${tcl}">${tend}</span> &nbsp; `
     + verdictPhrase(tend, ph, app, dominant) + `</div>`;
  return h;
}

function verdictPhrase(tend, ph, app, dominant) {
  const base = {
    'Favorable':"Le ciel penche du bon côté : heure propice aux démarches mesurées, aux accords et aux semailles. Les milieux d'affaires y trouveront un terrain ferme, pourvu qu'on n'outrepasse point la mesure.",
    'Contrasté':"Climat mêlé, où le meilleur côtoie l'embarras : on avancera sur ce qui est déjà mûr et l'on ajournera ce qui exige l'unanimité. Prudence dans les engagements financiers hâtifs.",
    'Tendu':"Heure de friction : les entreprises trop pressées rencontreront l'obstacle. On se gardera des coups de tête, des paroles vives et des paris ; mieux vaut tenir que promettre.",
    'Indécis':"Le firmament demeure en balance, sans pencher d'un côté ni de l'autre : journée d'attente, où l'on observe avant d'agir et où nulle décision ne s'impose d'elle-même.",
  }[tend];
  let q = '';
  if (ph.waxing && (tend==='Favorable'||tend==='Contrasté')) q = " La Lune croissante soutient ce qui commence.";
  if (!ph.waxing && tend!=='Favorable') q = " La Lune décroissante invite à finir plutôt qu'à lancer.";
  return `<b>—</b> ${base}${q}`;
}

/* --------------------------- Natal -------------------------------- */
function jugeNatal(chart, lieu, dateUTC) {
  const sun = chart.planets.find(p=>p.key==='sun');
  const moon = chart.planets.find(p=>p.key==='moon');
  const asps = aspectsOf(chart.planets);
  const ascRulerKey = SIGNS[chart.ascSign].dom;
  const ascRuler = chart.planets.find(p=>p.key===ascRulerKey);
  const dominant = chart.planets.slice().sort((a,b)=>strength(b)-strength(a))[0];
  const sectLum = chart.day ? sun : moon;
  const fa = fmtLon(chart.asc);

  let h = `<h2>Thème de nativité</h2>`;
  h += `<p class="chapeau">Né le <b>${fmtDateBxl(dateUTC)}</b> à <b>${fmtTimeBxl(dateUTC)}</b>, à <b>${esc(lieu)}</b>. `
     + `Le signe ${SIGNS[fa.sign].nom} se levait à l'orient (Ascendant ${fa.deg}°${String(fa.min).padStart(2,'0')}′), `
     + `marquant le tempérament au sceau ${art2(SIGNS[fa.sign])} : ${SIGN_PHRASE[fa.sign]}.</p>`;

  h += `<h3>Maître de la géniture</h3>`;
  h += `<p>Le <b>maître de l'Ascendant</b> est ${leP(ascRuler)}<b>${ascRuler.nom}</b>, `
     + `établi en ${fmtLon(ascRuler.lon).deg}° ${SIGNS[ascRuler.sign].nom} (${ascRuler.dig.txt}), en <b>${ROMAN[ascRuler.house]}</b><sup>e</sup> maison — `
     + `${maisonSens(ascRuler.house)}. C'est là que se joue la conduite de la vie.</p>`;
  h += `<p>Thème <b>${chart.day?'diurne':'nocturne'}</b> : le luminaire de la secte est ${leP(sectLum)}<b>${sectLum.nom}</b> `
     + `(${fmtLon(sectLum.lon).deg}° ${SIGNS[sectLum.sign].nom}), guide premier du natif. `
     + `Le <b>Soleil</b> en ${SIGNS[sun.sign].nom} (${maisonSens(sun.house)}) figure l'esprit et le but ; `
     + `la <b>Lune</b> en ${SIGNS[moon.sign].nom} (${maisonSens(moon.house)}), le corps, les humeurs et le commun des jours.</p>`;

  h += `<p><b>Astre dominant :</b> ${dominant.nom}, ${dominant.dig.txt}${[1,4,7,10].includes(dominant.house)?', et angulaire':''} — `
     + `il imprime sa marque sur l'ensemble du caractère.</p>`;

  const top = asps.slice(0,5);
  if (top.length) {
    h += `<h3>Principales figures de naissance</h3><ul class="aspects-list">`;
    top.forEach(a=>{
      const cl = a.fam==='harmon'?'asp-h':a.fam==='tendu'?'asp-t':'asp-n';
      h += `<li><span class="g">${a.a.g} ${a.asp.g} ${a.b.g}</span> — <b>${a.a.nom} ${a.asp.nom} ${a.b.nom}</b> `
         + `<span class="${cl}">(${ASP_JUGE[a.fam]}, orbe ${a.orb.toFixed(1)}°)</span></li>`;
    });
    h += `</ul>`;
  }
  return { html: h, asps };
}
function art2(sign){ return `${sign.mode.toLowerCase()} ${sign.elem==='Feu'?'de feu':sign.elem==='Eau'?"d'eau":sign.elem==='Air'?"d'air":'de terre'}`; }
function maisonSens(h){
  return ['','la personne et la vie','les biens et les gains','la fratrie, les écrits et les courts trajets',
    'le foyer, les pères et les fondations','les enfants, les plaisirs et la création','le labeur, la santé et les sujétions',
    "le mariage et les associés",'les périls, les dettes et les héritages','la foi, l\'étranger et les hautes études',
    "l'honneur, la charge et le renom",'les amis, les appuis et les espérances','les épreuves, le secret et le retrait'][h];
}

function jugeTransits(natal, now) {
  const tr = transitsToNatal(natal, now).slice(0,7);
  let h = `<h2>Les influences du moment sur votre thème</h2>`;
  h += `<p>Au regard de l'heure présente (${fmtTimeBxl(now.date)}, Bruxelles), les astres errants forment au thème natal les rapports suivants — c'est par eux que le ciel « parle » aujourd'hui à la nativité :</p>`;
  if (!tr.length) { h += `<p><i>Nul transit serré au présent : le ciel laisse le thème en repos.</i></p>`; return h; }
  h += `<ul class="aspects-list">`;
  tr.forEach(t=>{
    const cl = t.fam==='harmon'?'asp-h':t.fam==='tendu'?'asp-t':'asp-n';
    const verbe = t.fam==='harmon'?'soutient et facilite':t.fam==='tendu'?'éprouve et sollicite':'active';
    h += `<li><span class="g">${t.tp.g} ${t.asp.g} ${t.np.g||''}</span> — `
       + `<b>${t.tp.nom}</b> ${t.asp.nom} <b>${t.np.nom}</b> natal `
       + `<span class="${cl}">(${verbe}, orbe ${t.orb.toFixed(1)}°)</span></li>`;
  });
  h += `</ul>`;
  h += `<p class="fig-leg">Cette lecture se renouvelle d'instant en instant, à mesure que les planètes avancent — rouvrez la page et le jugement aura changé.</p>`;
  return h;
}

/* ----------------------------- Vues ------------------------------- */
function renderCiel() {
  const now = new Date();
  const chart = buildChart(now, BXL.lat, BXL.lon);
  const ph = moonPhase(now);
  const app = moonApplication(now);
  const hour = planetaryHour(now, BXL.lat, BXL.lon);
  drawSquare(document.getElementById('carre-ciel'), chart);
  fillPositions(document.querySelector('#pos-ciel tbody'), chart);
  document.getElementById('bull-ciel').innerHTML = jugeCiel(chart, ph, app, hour);
  // bandeau
  document.getElementById('dateline').textContent = fmtDateBxl(now) + ', ' + fmtTimeBxl(now);
  document.getElementById('hourline').innerHTML =
    `Heure ${deP(hour.ruler)}<b>${hour.ruler.nom}</b> <span style="font-family:var(--glyph)">${hour.ruler.g}</span>`;
}

function renderNatal() {
  const y = document.getElementById('n-date').value;
  const t = document.getElementById('n-heure').value || '12:00';
  const lieu = document.getElementById('n-lieu').value || 'lieu inconnu';
  const lat = parseFloat(document.getElementById('n-lat').value);
  const lon = parseFloat(document.getElementById('n-lon').value);
  if (!y || isNaN(lat) || isNaN(lon)) return;
  const [Y,Mo,Da] = y.split('-').map(Number);
  const [H,Mi] = t.split(':').map(Number);
  const dateUTC = bxlWallToDate(Y,Mo,Da,H,Mi);
  const chart = buildChart(dateUTC, lat, lon);
  drawSquare(document.getElementById('carre-natal'), chart);
  fillPositions(document.querySelector('#pos-natal tbody'), chart);
  const fa = fmtLon(chart.asc), fm = fmtLon(chart.mc);
  document.getElementById('leg-natal').textContent =
    `Ascendant ${fa.deg}° ${SIGNS[fa.sign].nom} — Milieu du Ciel ${fm.deg}° ${SIGNS[fm.sign].nom}. Maisons en signes entiers.`;
  const natalJ = jugeNatal(chart, lieu, dateUTC);
  const now = buildChart(new Date(), BXL.lat, BXL.lon);
  document.getElementById('bull-natal').innerHTML = natalJ.html + jugeTransits(chart, now);
}

/* ---------------------------- Onglets ----------------------------- */
function setTab(which) {
  const ciel = which==='ciel';
  document.getElementById('tab-ciel').setAttribute('aria-selected', ciel);
  document.getElementById('tab-natal').setAttribute('aria-selected', !ciel);
  document.getElementById('vue-ciel').hidden = !ciel;
  document.getElementById('vue-natal').hidden = ciel;
  if (history.replaceState) history.replaceState(null, '', ciel ? '#' : '#natal');
}

/* ----------------------------- Init ------------------------------- */
function init() {
  document.getElementById('tab-ciel').addEventListener('click', ()=>setTab('ciel'));
  document.getElementById('tab-natal').addEventListener('click', ()=>{ setTab('natal'); });
  document.getElementById('form-natal').addEventListener('submit', e=>{ e.preventDefault(); renderNatal(); });
  try { renderCiel(); } catch(e){ console.error(e); document.getElementById('bull-ciel').innerHTML = '<p>Erreur de calcul céleste : '+esc(e.message)+'</p>'; }
  try { renderNatal(); } catch(e){ console.error(e); }
  if (location.hash === '#natal') setTab('natal');
  setInterval(()=>{ if(!document.getElementById('vue-ciel').hidden) try{ renderCiel(); }catch(e){} }, 60000);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
})();
