/* ============================================================
   DEMAIN — moteur astrologique traditionnel (calcul pur)
   Fonctionne dans le navigateur (window.DEMAIN) ET dans Node
   (module.exports) pour pouvoir être testé hors interface.

   « Selon les anciens » : 7 astres, zodiaque tropical, dignités
   à cinq termes (domicile, exaltation, triplicité, bornes
   égyptiennes, faces), almutén, secte/hayz, lots hermétiques,
   nœuds, demeures lunaires, étoiles fixes, tempérament humoral,
   aspects ptolémaïques, réceptions, 4 systèmes de maisons.
   ============================================================ */
(function (root, factory) {
  const A = (typeof window !== 'undefined' && window.Astronomy) ? window.Astronomy
            : (typeof require !== 'undefined' ? require('astronomy-engine') : null);
  const api = factory(A);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.DEMAIN = api;
})(this, function (A) {
"use strict";
const D2R = Math.PI/180, R2D = 180/Math.PI;
const n360 = x => ((x % 360) + 360) % 360;
const sep = (a,b) => { let d = Math.abs(n360(a)-n360(b)); return d > 180 ? 360-d : d; };

/* ----------------------------- Tables ----------------------------- */
const SIGNS = [
  { nom:'Bélier',     g:'♈', elem:'Feu',   mode:'Cardinal', genre:'M', dom:'mars',    saison:'printemps' },
  { nom:'Taureau',    g:'♉', elem:'Terre', mode:'Fixe',     genre:'F', dom:'venus',   saison:'printemps' },
  { nom:'Gémeaux',    g:'♊', elem:'Air',   mode:'Mutable',  genre:'M', dom:'mercury', saison:'printemps' },
  { nom:'Cancer',     g:'♋', elem:'Eau',   mode:'Cardinal', genre:'F', dom:'moon',    saison:'été' },
  { nom:'Lion',       g:'♌', elem:'Feu',   mode:'Fixe',     genre:'M', dom:'sun',     saison:'été' },
  { nom:'Vierge',     g:'♍', elem:'Terre', mode:'Mutable',  genre:'F', dom:'mercury', saison:'été' },
  { nom:'Balance',    g:'♎', elem:'Air',   mode:'Cardinal', genre:'M', dom:'venus',   saison:'automne' },
  { nom:'Scorpion',   g:'♏', elem:'Eau',   mode:'Fixe',     genre:'F', dom:'mars',    saison:'automne' },
  { nom:'Sagittaire', g:'♐', elem:'Feu',   mode:'Mutable',  genre:'M', dom:'jupiter', saison:'automne' },
  { nom:'Capricorne', g:'♑', elem:'Terre', mode:'Cardinal', genre:'F', dom:'saturn',  saison:'hiver' },
  { nom:'Verseau',    g:'♒', elem:'Air',   mode:'Fixe',     genre:'M', dom:'saturn',  saison:'hiver' },
  { nom:'Poissons',   g:'♓', elem:'Eau',   mode:'Mutable',  genre:'F', dom:'jupiter', saison:'hiver' },
];
const PLANETS = [
  { key:'sun',     nom:'Soleil',  g:'☉', body:'Sun',     chald:3, nature:'lum',    sect:'jour', genre:'M', joie:9,  vmoy:0.9856 },
  { key:'moon',    nom:'Lune',    g:'☽', body:'Moon',    chald:6, nature:'lum',    sect:'nuit', genre:'F', joie:3,  vmoy:13.176 },
  { key:'mercury', nom:'Mercure', g:'☿', body:'Mercury', chald:5, nature:'neutre', sect:'var',  genre:'N', joie:1,  vmoy:1.383 },
  { key:'venus',   nom:'Vénus',   g:'♀', body:'Venus',   chald:4, nature:'benef',  sect:'nuit', genre:'F', joie:5,  vmoy:1.2 },
  { key:'mars',    nom:'Mars',    g:'♂', body:'Mars',    chald:2, nature:'malef',  sect:'nuit', genre:'M', joie:6,  vmoy:0.524 },
  { key:'jupiter', nom:'Jupiter', g:'♃', body:'Jupiter', chald:1, nature:'benef',  sect:'jour', genre:'M', joie:11, vmoy:0.083 },
  { key:'saturn',  nom:'Saturne', g:'♄', body:'Saturn',  chald:0, nature:'malef',  sect:'jour', genre:'M', joie:12, vmoy:0.034 },
];
const PMAP = Object.fromEntries(PLANETS.map(p => [p.key, p]));

const EXALT = { sun:{s:0,d:19}, moon:{s:1,d:3}, mercury:{s:5,d:15}, venus:{s:11,d:27}, mars:{s:9,d:28}, jupiter:{s:3,d:15}, saturn:{s:6,d:21} };
// triplicité dorothéenne : jour / nuit / participant (par élément)
const TRIPL = { Feu:['sun','jupiter','saturn'], Terre:['venus','moon','mars'], Air:['saturn','mercury','jupiter'], Eau:['mars','venus','moon'] };
// bornes égyptiennes : par signe, [ruler, degré supérieur]
const BOUNDS = [
  [['jupiter',6],['venus',12],['mercury',20],['mars',25],['saturn',30]],       // Bélier
  [['venus',8],['mercury',14],['jupiter',22],['saturn',27],['mars',30]],       // Taureau
  [['mercury',6],['jupiter',12],['venus',17],['mars',24],['saturn',30]],       // Gémeaux
  [['mars',7],['venus',13],['mercury',19],['jupiter',26],['saturn',30]],       // Cancer
  [['jupiter',6],['venus',11],['saturn',18],['mercury',24],['mars',30]],       // Lion
  [['mercury',7],['venus',17],['jupiter',21],['mars',28],['saturn',30]],       // Vierge
  [['saturn',6],['mercury',14],['jupiter',21],['venus',28],['mars',30]],       // Balance
  [['mars',7],['venus',11],['mercury',19],['jupiter',24],['saturn',30]],       // Scorpion
  [['jupiter',12],['venus',17],['mercury',21],['saturn',26],['mars',30]],      // Sagittaire
  [['mercury',7],['jupiter',14],['venus',22],['saturn',26],['mars',30]],       // Capricorne
  [['mercury',7],['venus',13],['jupiter',20],['mars',25],['saturn',30]],       // Verseau
  [['venus',12],['jupiter',16],['mercury',19],['mars',28],['saturn',30]],      // Poissons
];
// faces (décans) : ordre chaldéen depuis Bélier I = Mars
const FACE_ORDER = ['mars','sun','venus','mercury','moon','saturn','jupiter'];
const ASPECTS = [
  { deg:0,   nom:'conjonction', g:'☌', maj:true,  fam:'neutre' },
  { deg:60,  nom:'sextile',     g:'⚹', maj:true,  fam:'harmon' },
  { deg:90,  nom:'carré',       g:'□', maj:true,  fam:'tendu'  },
  { deg:120, nom:'trigone',     g:'△', maj:true,  fam:'harmon' },
  { deg:180, nom:'opposition',  g:'☍', maj:true,  fam:'tendu'  },
];
const MOIETY = { sun:7.5, moon:6, mercury:3.5, venus:3.5, mars:3.75, jupiter:4.5, saturn:4.5 };
const DAYRULER = [3,6,2,5,1,4,0]; // dim..sam -> index chaldéen
const JOURS = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
const ROMAN = ['','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];

// 28 demeures lunaires (manâzil)
const MANSIONS = ['Al Sharatain','Al Butain','Al Thurayya','Al Dabarân','Al Haqʿa','Al Hanʿa','Al Dhirâ',
  'Al Nathra','Al Tarf','Al Jabha','Al Zubra','Al Sarfa','Al ʿAwwâ','Al Simâk','Al Ghafr','Al Zubânâ',
  'Al Iklîl','Al Qalb','Al Shawla','Al Naʿâ’im','Al Balda','Saʿd al-Dhâbih','Saʿd Bulaʿ','Saʿd al-Suʿûd',
  'Saʿd al-Akhbiya','Al Fargh al-Awwal','Al Fargh al-Thânî','Batn al-Hût'];

// étoiles fixes majeures (J2000 RA/Dec en degrés)
const STARS = [
  { nom:'Algol',      ra:47.042,  dec:40.956,  nat:'Saturne/Jupiter', note:'la plus violente du ciel' },
  { nom:'Pléiades',   ra:56.871,  dec:24.105,  nat:'Lune/Mars',       note:'les pleureuses' },
  { nom:'Aldébaran',  ra:68.980,  dec:16.509,  nat:'Mars',            note:'œil du Taureau, étoile royale' },
  { nom:'Rigel',      ra:78.634,  dec:-8.202,  nat:'Jupiter/Saturne', note:'pied d’Orion' },
  { nom:'Bellatrix',  ra:81.283,  dec:6.350,   nat:'Mars/Mercure',    note:'l’amazone' },
  { nom:'Capella',    ra:79.172,  dec:45.998,  nat:'Mars/Mercure',    note:'la chèvre' },
  { nom:'Bételgeuse', ra:88.793,  dec:7.407,   nat:'Mars/Mercure',    note:'épaule d’Orion' },
  { nom:'Sirius',     ra:101.287, dec:-16.716, nat:'Jupiter/Mars',    note:'l’étincelante' },
  { nom:'Procyon',    ra:114.825, dec:5.225,   nat:'Mercure/Mars',    note:'le petit chien' },
  { nom:'Pollux',     ra:116.329, dec:28.026,  nat:'Mars',            note:'le jumeau' },
  { nom:'Régulus',    ra:152.093, dec:11.967,  nat:'Mars/Jupiter',    note:'le cœur du Lion, étoile royale' },
  { nom:'Spica',      ra:201.298, dec:-11.161, nat:'Vénus/Mars',      note:'l’épi de la Vierge' },
  { nom:'Arcturus',   ra:213.915, dec:19.182,  nat:'Mars/Jupiter',    note:'le gardien' },
  { nom:'Antarès',    ra:247.352, dec:-26.432, nat:'Mars/Jupiter',    note:'cœur du Scorpion, étoile royale' },
  { nom:'Véga',       ra:279.234, dec:38.784,  nat:'Vénus/Mercure',   note:'la lyre' },
  { nom:'Altaïr',     ra:297.696, dec:8.868,   nat:'Mars/Jupiter',    note:'l’aigle' },
  { nom:'Fomalhaut',  ra:344.413, dec:-29.622, nat:'Vénus/Mercure',   note:'étoile royale, bouche du poisson' },
];

/* --------------------------- Astronomie --------------------------- */
function tropLon(body, date) {
  const v = A.GeoVector(A.Body[body], date, true);
  const e = A.RotateVector(A.Rotation_EQJ_ECT(date), v);
  return n360(A.SphereFromVector(e).lon);
}
function obliq(date) {
  // obliquité VRAIE de la date (même repère que les planètes via ECT) ; repli sur la moyenne IAU1980
  try { const t = A.e_tilt(A.MakeTime(date)); if (t && Number.isFinite(t.tobl)) return t.tobl; } catch (e) {}
  const T = A.MakeTime(date).tt / 36525;
  return 23 + 26/60 + (21.448 - 46.8150*T - 0.00059*T*T + 0.001813*T*T*T) / 3600;
}
function ramcDeg(date, lonE) { return n360((A.SiderealTime(date) + lonE/15) * 15); }
function mcLon(rm, eps) { return n360(Math.atan2(Math.sin(rm*D2R), Math.cos(rm*D2R)*Math.cos(eps*D2R)) * R2D); }
function ascLon(rm, lat, eps) {
  const r=rm*D2R, e=eps*D2R, f=lat*D2R;
  return n360(Math.atan2(Math.cos(r), -(Math.sin(r)*Math.cos(e) + Math.tan(f)*Math.sin(e))) * R2D);
}
function bodySpeed(body, date) {
  const h = 6*3600*1000;
  let a = tropLon(body, new Date(date.getTime()-h)), b = tropLon(body, new Date(date.getTime()+h));
  let d = b - a; if (d>180) d-=360; if (d<-180) d+=360;
  return d * 2;
}
function bodyAlt(body, date, lat, lonE) {
  const obs = new A.Observer(lat, lonE, 0);
  const eq = A.Equator(A.Body[body], date, obs, true, true);
  return A.Horizon(date, obs, eq.ra, eq.dec, null).altitude;   // géométrique (sans réfraction)
}
function sunAltitude(date, lat, lonE) { return bodyAlt('Sun', date, lat, lonE); }
// longitude écliptique tropicale d'une étoile (précessée à la date) depuis RA/Dec J2000
function starLon(ra, dec, date) {
  const raR = ra*D2R, decR = dec*D2R;
  const vec = { x:Math.cos(decR)*Math.cos(raR), y:Math.cos(decR)*Math.sin(raR), z:Math.sin(decR), t:A.MakeTime(date) };
  const e = A.RotateVector(A.Rotation_EQJ_ECT(date), vec);
  return n360(A.SphereFromVector(e).lon);
}

/* ----------------------------- Maisons ---------------------------- */
function housesWhole(ascSign) { const c=[]; for (let i=0;i<12;i++) c.push(n360((ascSign+i)*30)); return c; }
function housesPorphyry(asc, mc) {
  const ic=n360(mc+180), desc=n360(asc+180);
  const q1=n360(asc-mc), q2=n360(ic-asc);             // MC->ASC (maisons 11,12) ; ASC->IC (2,3)
  const c=new Array(12);
  c[9]=mc; c[0]=asc; c[3]=ic; c[6]=desc;
  c[10]=n360(mc+q1/3);  c[11]=n360(mc+2*q1/3);
  c[1]=n360(asc+q2/3);  c[2]=n360(asc+2*q2/3);
  c[4]=n360(c[10]+180); c[5]=n360(c[11]+180);
  c[7]=n360(c[1]+180);  c[8]=n360(c[2]+180);
  return c;
}
// balaye l'arc oriental MC -> MC+180 (longitude croissante) et déroule HA et RA-Régio en continu
function quadrantScan(rm, eps, lat) {
  const epsR=eps*D2R, latR=lat*D2R, mc=mcLon(rm,eps);
  const sinR=Math.sin(rm*D2R), cosR=Math.cos(rm*D2R);
  const N=1440, s=[]; let prevHA=null, baseHA=0, prevRC=null, baseRC=0;
  for (let i=0;i<=N;i++){
    const lonU=mc+180*i/N, l=n360(lonU)*D2R;
    const al=n360(Math.atan2(Math.sin(l)*Math.cos(epsR),Math.cos(l))*R2D);
    const dec=Math.asin(Math.sin(epsR)*Math.sin(l))*R2D, de=dec*D2R;
    let x=Math.tan(latR)*Math.tan(de); x=Math.max(-0.99999,Math.min(0.99999,x));
    const AD=Math.asin(x)*R2D, DSA=90+AD, NSA=90-AD;
    // angle horaire (positif) depuis le MC, déroulé en continu : 0 au MC, croît vers l'est jusqu'à +180 au FC
    let ha=al-rm; if(prevHA!==null){ while(ha+baseHA-prevHA>180) baseHA-=360; while(ha+baseHA-prevHA<-180) baseHA+=360; }
    const haU=ha+baseHA; prevHA=haU;
    // intersection équateur du cercle de position de Régiomontanus (axe N-S de l'horizon)
    const mx= Math.sin(latR)*sinR*Math.sin(de) + Math.cos(latR)*Math.cos(de)*Math.sin(al*D2R);
    const my= -Math.cos(latR)*Math.cos(de)*Math.cos(al*D2R) - Math.sin(latR)*cosR*Math.sin(de);
    let rc=Math.atan2(-mx,my)*R2D; if(prevRC!==null){ while(rc+baseRC-prevRC>180) baseRC-=360; while(rc+baseRC-prevRC<-180) baseRC+=360; }
    const rcU=rc+baseRC; prevRC=rcU;
    s.push({ lonU, DSA, NSA, haU, rcU });
  }
  return { mc, rc0:s[0].rcU, samples:s };
}
function bracketCusp(samples, key, target) {
  let prev=null;
  for (const p of samples){ const res=p[key]-target;
    if (prev && prev.res*res<=0){ const t=Math.abs(res-prev.res)<1e-12?0:-prev.res/(res-prev.res); return n360(prev.lonU + t*(p.lonU-prev.lonU)); }
    prev={lonU:p.lonU, res};
  }
  return null;
}
// Placide : cuspide où l'angle horaire vaut la fraction voulue du semi-arc (diurne/nocturne)
function bracketPlacidus(samples, frac, below) {
  let prev=null;
  for (const p of samples){ const target = below ? (p.DSA + frac*p.NSA) : (frac*p.DSA);  // cibles positives (haU croît vers l'est)
    const res=p.haU-target;
    if (prev && prev.res*res<=0){ const t=Math.abs(res-prev.res)<1e-12?0:-prev.res/(res-prev.res); return n360(prev.lonU + t*(p.lonU-prev.lonU)); }
    prev={lonU:p.lonU, res};
  }
  return null;
}
function housesPlacidus(rm, eps, lat) {
  const asc=ascLon(rm,lat,eps), mc=mcLon(rm,eps), {samples}=quadrantScan(rm,eps,lat);
  const c=new Array(12);
  c[9]=mc; c[0]=asc; c[3]=n360(mc+180); c[6]=n360(asc+180);
  c[10]=bracketPlacidus(samples,1/3,false) ?? n360(mc+30);   // XI
  c[11]=bracketPlacidus(samples,2/3,false) ?? n360(mc+60);   // XII
  c[1] =bracketPlacidus(samples,1/3,true)  ?? n360(asc+30);  // II
  c[2] =bracketPlacidus(samples,2/3,true)  ?? n360(asc+60);  // III
  c[4]=n360(c[10]+180); c[5]=n360(c[11]+180); c[7]=n360(c[1]+180); c[8]=n360(c[2]+180);
  return c;
}
function housesRegiomontanus(rm, eps, lat) {
  const asc=ascLon(rm,lat,eps), mc=mcLon(rm,eps), {rc0,samples}=quadrantScan(rm,eps,lat);
  const find=H=>bracketCusp(samples,'rcU',rc0+H);
  const c=new Array(12);
  c[9]=mc; c[0]=find(90)??asc; c[3]=n360(mc+180); c[6]=n360((find(90)??asc)+180);
  c[10]=find(30); c[11]=find(60); c[1]=find(120); c[2]=find(150);
  c[4]=n360(c[10]+180); c[5]=n360(c[11]+180); c[7]=n360(c[1]+180); c[8]=n360(c[2]+180);
  return c;
}
function buildHouses(system, rm, eps, lat, ascSign, asc, mc) {
  if (system === 'whole' || !system) return { cusps: housesWhole(ascSign), quadrant:false };
  // un système à quadrants n'est défini que si les deux arcs MC→ASC et ASC→IC sont strictement dans (0,180)
  const ic = n360(mc+180), arc1 = n360(asc-mc), arc2 = n360(ic-asc);
  if (arc1 <= 0.5 || arc1 >= 179.5 || arc2 <= 0.5 || arc2 >= 179.5)
    return { cusps: housesWhole(ascSign), quadrant:false, degraded:'polaire' };  // circumpolaire : repli honnête
  let cusps;
  if (system === 'porphyry') cusps = housesPorphyry(asc, mc);
  else if (system === 'placidus') cusps = housesPlacidus(rm, eps, lat);
  else if (system === 'regiomontanus') cusps = housesRegiomontanus(rm, eps, lat);
  else return { cusps: housesWhole(ascSign), quadrant:false };
  if (cusps.some(c => !Number.isFinite(c)))                                       // échec numérique résiduel
    return { cusps: housesWhole(ascSign), quadrant:false, degraded:'circumpolaire' };
  return { cusps, quadrant:true };
}
function houseOf(lon, cusps) {
  if (!Number.isFinite(lon) || cusps.some(c => !Number.isFinite(c))) return 1;
  for (let i=0;i<12;i++){ const span=n360(cusps[(i+1)%12]-cusps[i])||360; if (n360(lon-cusps[i]) < span) return i+1; }
  return 12;
}

/* --------------------------- Dignités ----------------------------- */
function boundRuler(sign, degInSign) { for (const [r,up] of BOUNDS[sign]) if (degInSign < up) return r; return BOUNDS[sign][4][0]; }
function faceRuler(sign, degInSign) { const faceIndex = sign*3 + Math.floor(degInSign/10); return FACE_ORDER[faceIndex % 7]; }
function triplicityRulers(sign) { return TRIPL[SIGNS[sign].elem]; }

function dignities(key, lon, isDay) {
  const sign = Math.floor(lon/30), deg = lon - sign*30;
  const out = { domicile:false, exaltation:false, triplicity:false, bound:false, face:false,
                detriment:false, fall:false, rulers:{} };
  out.rulers.domicile = SIGNS[sign].dom;
  out.rulers.exaltation = Object.keys(EXALT).find(k => EXALT[k].s === sign) || null;
  const tri = triplicityRulers(sign);
  out.rulers.triplicity = isDay ? tri[0] : tri[1];
  out.rulers.bound = boundRuler(sign, deg);
  out.rulers.face = faceRuler(sign, deg);
  if (SIGNS[sign].dom === key) out.domicile = true;
  if (EXALT[key] && EXALT[key].s === sign) out.exaltation = true;
  if (out.rulers.triplicity === key) out.triplicity = true;          // seul le maître EN SECTE compte (+3)
  out.triplicityPart = (tri[2] === key && tri[2] !== out.rulers.triplicity); // participant : mentionné, sans poids
  if (out.rulers.bound === key) out.bound = true;
  if (out.rulers.face === key) out.face = true;
  if (SIGNS[(sign+6)%12].dom === key) out.detriment = true;
  if (EXALT[key] && EXALT[key].s === (sign+6)%12) out.fall = true;
  let score = 0;
  if (out.domicile) score+=5; if (out.exaltation) score+=4; if (out.triplicity) score+=3;
  if (out.bound) score+=2; if (out.face) score+=1;
  if (out.detriment) score-=5; if (out.fall) score-=4;
  out.score = score;
  out.peregrine = score===0 && !out.domicile && !out.exaltation && !out.triplicity && !out.bound && !out.face;
  // résumé court
  out.label = out.domicile?'domicile' : out.exaltation?'exaltation' : out.detriment?'exil' : out.fall?'chute'
            : out.triplicity?'triplicité' : out.bound?'borne' : out.face?'face' : 'pérégrin';
  out.cl = out.domicile?'dom':out.exaltation?'exa':out.detriment?'det':out.fall?'chu':out.triplicity?'tri':out.bound||out.face?'min':'per';
  return out;
}
// almutén d'un degré : la planète qui y cumule le plus de dignité
function almutenOfDegree(lon, isDay) {
  const sign=Math.floor(lon/30), deg=lon-sign*30, score={};
  const add=(k,v)=>{ if(!k)return; score[k]=(score[k]||0)+v; };
  add(SIGNS[sign].dom,5);
  const ex=Object.keys(EXALT).find(k=>EXALT[k].s===sign); add(ex,4);
  const tri=triplicityRulers(sign); add(isDay?tri[0]:tri[1],3);
  add(boundRuler(sign,deg),2); add(faceRuler(sign,deg),1);
  let best=null,bv=-1; for(const k in score) if(score[k]>bv){bv=score[k];best=k;}
  return { planet:best, score, value:bv };
}

/* ----------------------- Dignité accidentelle --------------------- */
function angularType(house){ return [1,4,7,10].includes(house)?'angulaire':[2,5,8,11].includes(house)?'succédent':'cadent'; }
function accidentals(p, chart) {
  const acc = { angular: angularType(p.house), joie: PMAP[p.key].joie===p.house,
                retro: p.retro, swift: Math.abs(p.speed) > PMAP[p.key].vmoy,
                solar: p.solar, oriental: p.oriental, inSect: p.inSect, hayz: p.hayz };
  let s = 0;
  s += acc.angular==='angulaire'?5:acc.angular==='succédent'?2:0;
  if (acc.joie) s += 2;
  if (p.retro) s -= 5;
  if (p.solar==='combuste') s -= 5; else if (p.solar==='cazimi') s += 5; else if (p.solar==='sous les rayons') s -= 4;
  if (acc.swift && p.key!=='sun' && p.key!=='moon') s += 2; else if (!acc.swift && p.key!=='sun' && p.key!=='moon') s -= 2;
  if (acc.inSect) s += 2; if (acc.hayz) s += 1;
  acc.score = s;
  return acc;
}

/* ------------------------------- Lots ----------------------------- */
function buildLots(asc, sun, moon, day, planets) {
  const V=PMAP, lon=k=>planets.find(p=>p.key===k).lon;
  const lot=(a,b,c)=>n360(a + b - c);
  const fortune = day ? lot(asc,moon,sun) : lot(asc,sun,moon);
  const spirit  = day ? lot(asc,sun,moon) : lot(asc,moon,sun);
  const eros    = day ? lot(asc,spirit,lon('venus')) : lot(asc,lon('venus'),spirit);          // Paulus : jour Asc+Esprit−Vénus
  const necessity = day ? lot(asc,lon('mercury'),fortune) : lot(asc,fortune,lon('mercury'));  // Paulus : jour Asc+Mercure−Fortune
  const victory = day ? lot(asc,lon('jupiter'),spirit) : lot(asc,spirit,lon('jupiter'));
  const courage = day ? lot(asc,fortune,lon('mars')) : lot(asc,lon('mars'),fortune);
  return [
    { key:'fortune',   nom:'Part de Fortune',   g:'⊗', lon:fortune },
    { key:'spirit',    nom:'Part de l’Esprit',  g:'⊕', lon:spirit },
    { key:'eros',      nom:'Part de l’Amour',   g:'♡', lon:eros },
    { key:'necessity', nom:'Part de Nécessité', g:'⚲', lon:necessity },
    { key:'victory',   nom:'Part de Victoire',  g:'✦', lon:victory },
    { key:'courage',   nom:'Part du Courage',   g:'⚔', lon:courage },
  ];
}

/* --------------------------- Aspects ------------------------------ */
function aspectFamily(aKey,bKey,asp){
  if (asp.fam!=='neutre') return asp.fam;
  const mal=k=>k==='mars'||k==='saturn', ben=k=>k==='venus'||k==='jupiter';
  if ((mal(aKey)&&!ben(bKey))||(mal(bKey)&&!ben(aKey))) return 'tendu';
  if (ben(aKey)||ben(bKey)) return 'harmon';
  return 'neutre';
}
function aspectsOf(planets){
  const res=[];
  for (let i=0;i<planets.length;i++) for (let j=i+1;j<planets.length;j++){
    const a=planets[i], b=planets[j], d=sep(a.lon,b.lon);
    for (const asp of ASPECTS){
      const orb=MOIETY[a.key]+MOIETY[b.key];                  // somme des moitiés (Lilly), identique aux 5 aspects
      const realOrb=Math.abs(d-asp.deg);
      if (realOrb<=orb){
        const la=a.lon+a.speed*0.02, lb=b.lon+b.speed*0.02;
        const applying = Math.abs(sep(la,lb)-asp.deg) < realOrb;
        // partile : « même numéro de degré » ; pour la conjonction à cheval sur une borne de signe, replier sur l'orbe réel
        const partile = asp.deg===0 ? realOrb<1 : (Math.floor(a.deg)===Math.floor(b.deg));
        res.push({ a,b, asp, orb:realOrb, applying, partile, fam: aspectFamily(a.key,b.key,asp) });
        break;
      }
    }
  }
  return res.sort((x,y)=>x.orb-y.orb);
}
// réception : un astre « reçoit » l'autre s'il a une dignité au lieu où l'autre se trouve (5 dignités)
const DIGN_ORDER = ['domicile','exaltation','triplicity','bound','face'];
const DIGN_FR = { domicile:'domicile', exaltation:'exaltation', triplicity:'triplicité', bound:'borne', face:'face' };
const DIGN_STRONG = { domicile:true, exaltation:true };
function receptionsOf(a, b, isDay){
  const da = dignities(a.key, b.lon, isDay);   // dignités de a là où b se tient → a reçoit b
  return DIGN_ORDER.filter(k => da[k]);
}
function mutualReceptions(planets, isDay){
  const out=[];
  for (let i=0;i<planets.length;i++) for (let j=i+1;j<planets.length;j++){
    const a=planets[i], b=planets[j];
    const aRecB = receptionsOf(a, b, isDay), bRecA = receptionsOf(b, a, isDay);
    if (aRecB.length && bRecA.length)
      out.push({ a, b, kindA:DIGN_FR[aRecB[0]], kindB:DIGN_FR[bRecA[0]],
                 strong: aRecB.some(k=>DIGN_STRONG[k]) && bRecA.some(k=>DIGN_STRONG[k]) });
  }
  return out;
}
// aspects ptolémaïques majeurs des astres aux angles et à la Part de Fortune (orbe = moitié de l'astre seul)
function aspectsToPoints(planets, targets){
  const res=[];
  planets.forEach(p => targets.forEach(t => {
    const d=sep(p.lon,t.lon);
    for (const asp of ASPECTS){ if (Math.abs(d-asp.deg) <= MOIETY[p.key]){ res.push({ a:p, b:t, asp, orb:Math.abs(d-asp.deg) }); break; } }
  }));
  return res.sort((x,y)=>x.orb-y.orb);
}

/* ---------------------------- Lune -------------------------------- */
function moonPhase(date, moonLon, sunLon){
  const ml = moonLon!=null ? moonLon : tropLon('Moon',date);
  const sl = sunLon!=null ? sunLon : tropLon('Sun',date);
  const e=n360(ml-sl);
  const ill=Math.round((1-Math.cos(e*D2R))/2*100);     // fraction illuminée géométrique (évite un appel d'éphéméride)
  const names=['Nouvelle Lune','Premier croissant','Premier Quartier','Lune gibbeuse croissante',
               'Pleine Lune','Lune gibbeuse décroissante','Dernier Quartier','Lune balsamique'];
  const idx=Math.floor(n360(e+22.5)/45);
  return { nom:names[idx], waxing:e<180, illum:ill, elong:e, quarter:Math.floor(e/90) };
}
// dernière syzygie (nouvelle/pleine lune) avant la date — degré de la lunation prénatale
function prenatalSyzygy(date){
  let best=null;
  for (const target of [0,180]){
    let t = A.SearchMoonPhase(target, new Date(date.getTime()-31*86400000), 32), last=null;
    while (t && t.date.getTime() <= date.getTime()){ last=t.date; t = A.SearchMoonPhase(target, new Date(t.date.getTime()+86400000), 32); }
    if (last && (!best || last.getTime() > best.time)) best = { time:last.getTime(), date:last };
  }
  return best ? tropLon('Moon', best.date) : null;
}
function moonMansion(moonLon){ const i=Math.floor(n360(moonLon)/(360/28))%28; return { index:i, nom:MANSIONS[i] }; }
function moonApplication(date){
  const horizon=72, step=1/3, prev={};
  for (let h=0;h<=horizon;h+=step){
    const t=new Date(date.getTime()+h*3600000), ml=tropLon('Moon',t);
    for (const p of PLANETS){ if (p.key==='moon') continue;
      const pl=tropLon(p.body,t), d=n360(ml-pl);
      for (const ang of [0,60,90,120,180]){
        let o1=d-ang; if(o1>180)o1-=360; if(o1<-180)o1+=360;
        let o2=d-(360-ang); if(o2>180)o2-=360; if(o2<-180)o2+=360;
        const o=Math.abs(o1)<Math.abs(o2)?o1:o2, id=p.key+'_'+ang;
        if (prev[id]!==undefined && Math.sign(prev[id])!==Math.sign(o) && Math.abs(prev[id])<4 && Math.abs(o)<4 && h>0)
          return { planet:p, asp:ASPECTS.find(a=>a.deg===ang), hours:h, when:t };
        prev[id]=o;
      }
    }
  }
  return null;
}
function voidOfCourse(moon, app){
  // course vide : la Lune ne perfectionne aucun aspect avant de quitter son signe
  const degToSignEnd = 30 - moon.deg, hoursToLeave = degToSignEnd / (Math.abs(moon.speed)/24);
  return !app || app.hours > hoursToLeave;
}

/* ----------------------- Heures planétaires ----------------------- */
function weekdayBxl(d){ const s=new Intl.DateTimeFormat('en-US',{weekday:'short',timeZone:'Europe/Brussels'}).format(d);
  return {Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[s]; }
function planetaryHour(date, lat, lonE){
  const obs=new A.Observer(lat,lonE,0);
  const rise=a=>A.SearchRiseSet(A.Body.Sun,obs,+1,a,2), set=a=>A.SearchRiseSet(A.Body.Sun,obs,-1,a,2);
  let sr=rise(new Date(date.getTime()-30*3600000));
  // régions polaires (jour/nuit continu) : pas de lever exploitable → repli sur le jour civil
  if (!sr){
    const wd=weekdayBxl(date), drC=DAYRULER[wd], dayRuler=PLANETS.find(p=>p.chald===drC);
    return { isDay: bodyAlt('Sun',date,lat,lonE)>0, num:1, ruler:dayRuler, dayRuler, weekday:wd, segStart:null, segEnd:null, polar:true };
  }
  while(true){ const nx=rise(new Date(sr.date.getTime()+3600000)); if(nx&&nx.date.getTime()<=date.getTime()) sr=nx; else break; }
  const ss=set(sr.date);
  let isDay, hourInPeriod, segStart=null, segEnd=null;
  if (ss && date.getTime()<ss.date.getTime()){ isDay=true; const len=(ss.date-sr.date)/12; hourInPeriod=Math.floor((date-sr.date)/len);
    segStart=new Date(sr.date.getTime()+hourInPeriod*len); segEnd=new Date(segStart.getTime()+len); }
  else { isDay=false; const nextSr=rise((ss||sr).date);
    if (ss && nextSr){ const len=(nextSr.date-ss.date)/12; const i=Math.max(0,Math.floor((date-ss.date)/len));
      hourInPeriod=12+Math.min(11,i); segStart=new Date(ss.date.getTime()+i*len); segEnd=new Date(segStart.getTime()+len); }
    else hourInPeriod=12;   // repli si coucher/lever indisponibles
  }
  const wd=weekdayBxl(sr.date), drC=DAYRULER[wd];
  const ruler=PLANETS.find(p=>p.chald===((drC+hourInPeriod)%7)), dayRuler=PLANETS.find(p=>p.chald===drC);
  return { isDay, num:hourInPeriod+1, ruler, dayRuler, weekday:wd, segStart, segEnd };
}

/* --------------------------- Tempérament -------------------------- */
const ELEM_HUMOR = { Feu:'cholerique', Terre:'melancolique', Air:'sanguin', Eau:'flegmatique' };
const PL_HUMOR = { sun:'cholerique', moon:'flegmatique', mercury:null, venus:'flegmatique', mars:'cholerique', jupiter:'sanguin', saturn:'melancolique' };
const PHASE_HUMOR = ['sanguin','cholerique','melancolique','flegmatique']; // quartiers de lune
const SEASON_HUMOR = { printemps:'sanguin', 'été':'cholerique', automne:'melancolique', hiver:'flegmatique' };
function temperament(chart){
  const h={ sanguin:0, cholerique:0, melancolique:0, flegmatique:0 };
  const add=(hum,w)=>{ if(hum&&h[hum]!==undefined) h[hum]+=w; };
  const ascSign=chart.ascSign;
  add(ELEM_HUMOR[SIGNS[ascSign].elem], 3);                                  // signe ascendant
  const ascRuler=chart.planets.find(p=>p.key===SIGNS[ascSign].dom);
  if (ascRuler){ add(ELEM_HUMOR[SIGNS[ascRuler.sign].elem], 2.5); add(PL_HUMOR[ascRuler.key], 1); }
  const sun=chart.planets.find(p=>p.key==='sun'), moon=chart.planets.find(p=>p.key==='moon');
  add(SEASON_HUMOR[SIGNS[sun.sign].saison], 1.5);                            // saison (quartier solaire, Galien/Lilly)
  add(ELEM_HUMOR[SIGNS[moon.sign].elem], 1.5);                               // Lune par signe
  add(PHASE_HUMOR[chart.phase.quarter], 1.5);                                // phase de la Lune
  const alm=almutenOfDegree(chart.asc, chart.day); add(PL_HUMOR[alm.planet], 1);  // almutén de l'ascendant
  chart.planets.forEach(p=>{ if (p.house===1 || sep(p.lon,chart.asc)<10) add(PL_HUMOR[p.key], 1.5); }); // planètes en I / conjointes ASC
  const tot=h.sanguin+h.cholerique+h.melancolique+h.flegmatique || 1;
  const pct={}; for (const k in h) pct[k]=Math.round(h[k]/tot*100);
  const ranked=Object.keys(h).sort((a,b)=>h[b]-h[a]);
  const QUAL={ sanguin:'chaud et humide', cholerique:'chaud et sec', melancolique:'froid et sec', flegmatique:'froid et humide' };
  return { brut:h, pct, dominant:ranked[0], second:ranked[1], qualite:QUAL[ranked[0]], ranked };
}

/* ------------------------ Phase héliaque -------------------------- */
function solarPhase(key, lon, sunLon){
  if (key==='sun') return null;
  const e=n360(sunLon-lon);                    // Soleil en avance sur l'astre ?
  const oriental = e>0 && e<180;               // se lève avant le Soleil (matutin)
  return { oriental, label: oriental ? 'oriental (du matin)' : 'occidental (du soir)' };
}

/* ===================== Construction du thème ====================== */
function buildChart(date, lat, lonE, system) {
  system = system || 'whole';
  const eps=obliq(date), rm=ramcDeg(date,lonE), asc=ascLon(rm,lat,eps), mc=mcLon(rm,eps);
  const ascSign=Math.floor(asc/30), day=sunAltitude(date,lat,lonE)>0;
  const H=buildHouses(system, rm, eps, lat, ascSign, asc, mc);
  const cusps=H.cusps;
  const sunLon=tropLon('Sun',date);
  const planets=PLANETS.map(p=>{
    const lon=tropLon(p.body,date), spd=bodySpeed(p.body,date), sign=Math.floor(lon/30);
    const house = H.quadrant ? houseOf(lon,cusps) : (((sign-ascSign)%12+12)%12+1);
    const dig=dignities(p.key,lon,day);
    let solar=null;
    if (p.key!=='sun'){ const d=sep(lon,sunLon); if(d<0.283)solar='cazimi'; else if(d<8.5)solar='combuste'; else if(d<15)solar='sous les rayons'; }
    const ph=solarPhase(p.key,lon,sunLon);
    // secte (Mercure convertible : oriental → diurne ; les luminaires suivent le thème)
    let inSect;
    if (p.key==='sun'||p.key==='moon') inSect = ((p.key==='sun')===day);
    else if (p.key==='mercury') inSect = (ph && ph.oriental)===day;
    else inSect = (p.sect==='jour')===day;
    // genre effectif (Mercure : oriental → masculin, occidental → féminin — Ptolémée)
    let pGenre = p.genre; if (p.key==='mercury') pGenre = (ph && ph.oriental) ? 'M' : 'F';
    const sameGender = SIGNS[sign].genre === pGenre;
    // hayz : en secte + même genre + bon hémisphère (au-dessus de l'horizon le jour, en-dessous la nuit)
    const above = bodyAlt(p.body, date, lat, lonE) > 0;
    const obj={ ...p, lon, speed:spd, retro:spd<0, sign, deg:lon-sign*30, house, dig, solar, oriental: ph?ph.oriental:null };
    obj.inSect=inSect; obj.hayz = inSect && sameGender && (above===day);
    return obj;
  });
  // dignité accidentelle (après calcul des positions)
  planets.forEach(p=> p.acc = accidentals(p, {asc, mc}));
  const moon=planets.find(p=>p.key==='moon'), sun=planets.find(p=>p.key==='sun');
  const phase=moonPhase(date, moon.lon, sunLon);
  const lots=buildLots(asc, sun.lon, moon.lon, day, planets);
  // nœuds lunaires moyens
  const Tn=A.MakeTime(date).tt/36525;
  const node=n360(125.04452 - 1934.136261*Tn + 0.0020708*Tn*Tn + Tn*Tn*Tn/450000);
  const mkPoint=(key,nom,g,lon)=>{ const sign=Math.floor(lon/30); return { key,nom,g,lon,sign,deg:lon-sign*30,
    house: H.quadrant?houseOf(lon,cusps):(((sign-ascSign)%12+12)%12+1) }; };
  const points=[ mkPoint('nodeN','Tête du Dragon','☊',node), mkPoint('nodeS','Queue du Dragon','☋',n360(node+180)) ]
    .concat(lots.map(l=>mkPoint(l.key,l.nom,l.g,l.lon)));
  const chart={ date, lat, lonE, system, quadrant:H.quadrant, degraded:H.degraded||null, eps, rm, asc, mc, ascSign, day, cusps, planets, points, lots, phase };
  chart.mansion=moonMansion(moon.lon);
  chart.app=moonApplication(date);
  chart.voc=voidOfCourse(moon, chart.app);
  chart.aspects=aspectsOf(planets);
  chart.receptions=mutualReceptions(planets, day);
  // aspects majeurs aux angles et à la Part de Fortune
  chart.angleAspects=aspectsToPoints(planets, [
    { key:'asc', nom:'Ascendant', g:'Asc', lon:asc }, { key:'mc', nom:'Milieu du Ciel', g:'MC', lon:mc },
    { key:'fortune', nom:'Part de Fortune', g:'⊗', lon:lots[0].lon } ]);
  chart.temperament=temperament(chart);
  // almutén de la géniture (al-Qabisi) : dignités essentielles sur 5 lieux + pondération accidentelle
  const syz=prenatalSyzygy(date);
  chart.syzygy=syz;
  const places=[asc, syz!=null?syz:mc, sun.lon, moon.lon, lots[0].lon];   // Asc, syzygie prénatale, Soleil, Lune, Fortune
  const tally={}; places.forEach(L=>{ const a=almutenOfDegree(L,day); for(const k in a.score) tally[k]=(tally[k]||0)+a.score[k]; });
  const hr=planetaryHour(date, lat, lonE);
  planets.forEach(p=>{ const ang=angularType(p.house); tally[p.key]=(tally[p.key]||0)+(ang==='angulaire'?5:ang==='succédent'?4:2); }); // angularité
  tally[hr.dayRuler.key]=(tally[hr.dayRuler.key]||0)+7;   // maître du jour
  tally[hr.ruler.key]=(tally[hr.ruler.key]||0)+6;         // maître de l'heure
  const accOf=k=>{ const pp=planets.find(p=>p.key===k); return pp&&pp.acc?pp.acc.score:0; };
  const cand=PLANETS.map(p=>({key:p.key, t:tally[p.key]||0})).sort((a,b)=> b.t-a.t || accOf(b.key)-accOf(a.key)); // départage par dignité accidentelle
  chart.almuten={ planet:cand[0].key, score:cand[0].t, tally };
  // étoiles fixes conjointes (planètes + angles), orbe 1.5°
  chart.stars=[];
  const angles=[{key:'asc',nom:'Ascendant',lon:asc},{key:'mc',nom:'MC',lon:mc}];
  STARS.forEach(st=>{ const sl=starLon(st.ra,st.dec,date);
    planets.concat(angles).forEach(b=>{ const o=sep(sl,b.lon); if(o<=1.5) chart.stars.push({ star:st, body:b, orb:o, starLon:sl }); }); });
  chart.stars.sort((a,b)=>a.orb-b.orb);
  return chart;
}

/* --------------------------- Utilitaires -------------------------- */
function fmtLon(lon){
  if (!Number.isFinite(lon)) return { deg:NaN, min:NaN, sign:0, signNom:'?', signG:'?', txt:'—', short:'—' };
  lon=n360(lon); let s=Math.floor(lon/30), d=lon-s*30, deg=Math.floor(d), m=Math.round((d-deg)*60);
  let D=deg, M=m; if (M===60){ M=0; D++; } if (D===30){ D=0; s=(s+1)%12; }   // débordement minute/degré → signe suivant
  return { deg:D, min:M, sign:s, signNom:SIGNS[s].nom, signG:SIGNS[s].g,
    txt:`${D}°${String(M).padStart(2,'0')}′ ${SIGNS[s].nom}`, short:`${D}°${SIGNS[s].g}` };
}

return { SIGNS, PLANETS, PMAP, ASPECTS, ROMAN, JOURS, MANSIONS, STARS, EXALT, TRIPL, BOUNDS, FACE_ORDER,
         n360, sep, fmtLon, tropLon, obliq, ascLon, mcLon, dignities, almutenOfDegree,
         buildChart, planetaryHour, moonPhase, weekdayBxl, angularType, boundRuler, faceRuler };
});
