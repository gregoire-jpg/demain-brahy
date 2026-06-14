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

/* ===================== Analyse & prévisions ====================== */
// Dominantes planétaires (activité, critères traditionnels : angularité, dignités,
// aspects aux luminaires et au maître d'ascendant, maîtrise d'amas, secte)
function dominants(chart){
  const score={}; PLANETS.forEach(p=>score[p.key]=0);
  const ascRulerKey=SIGNS[chart.ascSign].dom, lum=['sun','moon'];
  chart.planets.forEach(p=>{
    let s=2;
    s += p.acc.angular==='angulaire'?5:p.acc.angular==='succédent'?2:0;
    if (p.house===1) s+=3;
    s += Math.max(0, p.dig.score);
    if (p.acc.joie) s+=1; if (p.hayz) s+=1; else if (p.inSect) s+=0.5;
    const asps=chart.aspects.filter(a=>a.a.key===p.key||a.b.key===p.key);
    s += asps.length*0.7;
    asps.forEach(a=>{ const o=a.a.key===p.key?a.b.key:a.a.key; if(lum.includes(o)) s+=1.5; if(o===ascRulerKey) s+=1.5; });
    if (p.key===ascRulerKey) s+=4;
    if (p.key==='sun'||p.key==='moon') s+=2;
    if (p.retro) s-=1.5; if (p.solar==='combuste') s-=2;
    score[p.key]=Math.max(0,s);
  });
  const bySign={}; chart.planets.forEach(p=>{(bySign[p.sign]=bySign[p.sign]||[]).push(p);});
  Object.keys(bySign).forEach(s=>{ if(bySign[s].length>=3) score[SIGNS[s].dom]+=2; });
  const tot=Object.values(score).reduce((a,b)=>a+b,0)||1;
  return PLANETS.map(p=>({key:p.key,nom:p.nom,g:p.g,score:score[p.key],pct:Math.round(score[p.key]/tot*100)})).sort((a,b)=>b.score-a.score);
}
// Balances : éléments, modes, hémisphères (luminaires et maître d'ascendant pondérés)
function balances(chart){
  const elem={Feu:0,Terre:0,Air:0,Eau:0}, mode={Cardinal:0,Fixe:0,Mutable:0};
  const ascRulerKey=SIGNS[chart.ascSign].dom;
  const w=p=>(p.key==='sun'||p.key==='moon'?3:p.key===ascRulerKey?2:1);
  chart.planets.forEach(p=>{ elem[SIGNS[p.sign].elem]+=w(p); mode[SIGNS[p.sign].mode]+=w(p); });
  elem[SIGNS[chart.ascSign].elem]+=3; mode[SIGNS[chart.ascSign].mode]+=3;
  let above=0,below=0,east=0,west=0;
  chart.planets.forEach(p=>{ if([7,8,9,10,11,12].includes(p.house))above++; else below++; if([10,11,12,1,2,3].includes(p.house))east++; else west++; });
  const pct=o=>{ const t=Object.values(o).reduce((a,b)=>a+b,0)||1, r={}; for(const k in o) r[k]=Math.round(o[k]/t*100); return r; };
  return { elem, mode, elemPct:pct(elem), modePct:pct(mode), above, below, east, west,
           elemDom:Object.keys(elem).sort((a,b)=>elem[b]-elem[a])[0], modeDom:Object.keys(mode).sort((a,b)=>mode[b]-mode[a])[0] };
}
// Configurations d'aspects (selon les anciens : trigone/carré/opposition ; pas de yod/quinconce)
function configurations(chart){
  const A=chart.aspects, keys=chart.planets.map(p=>p.key), out=[];
  const has=(k1,k2,deg)=>A.find(a=>((a.a.key===k1&&a.b.key===k2)||(a.a.key===k2&&a.b.key===k1))&&a.asp.deg===deg);
  for(let i=0;i<keys.length;i++)for(let j=i+1;j<keys.length;j++)for(let k=j+1;k<keys.length;k++)
    if(has(keys[i],keys[j],120)&&has(keys[j],keys[k],120)&&has(keys[i],keys[k],120))
      out.push({type:'Grand trigone', keys:[keys[i],keys[j],keys[k]], elem:SIGNS[chart.planets.find(p=>p.key===keys[i]).sign].elem});
  const crosses=[];
  for(let i=0;i<keys.length;i++)for(let j=i+1;j<keys.length;j++)for(let k=j+1;k<keys.length;k++)for(let l=k+1;l<keys.length;l++){
    const q=[keys[i],keys[j],keys[k],keys[l]]; let opp=0,sq=0;
    for(let a=0;a<4;a++)for(let b=a+1;b<4;b++){ if(has(q[a],q[b],180))opp++; else if(has(q[a],q[b],90))sq++; }
    if(opp>=2&&sq>=4){ out.push({type:'Grande croix', keys:q}); crosses.push(q); }
  }
  for(let i=0;i<keys.length;i++)for(let j=i+1;j<keys.length;j++){ if(has(keys[i],keys[j],180))
    for(const k of keys){ if(k!==keys[i]&&k!==keys[j]&&has(keys[i],k,90)&&has(keys[j],k,90)){
      const trio=[keys[i],keys[j],k];
      if(!crosses.some(c=>trio.every(x=>c.includes(x)))) out.push({type:'T-carré', keys:trio, apex:k});
    } } }
  const bySign={}; chart.planets.forEach(p=>{(bySign[p.sign]=bySign[p.sign]||[]).push(p);});
  Object.keys(bySign).forEach(s=>{ if(bySign[s].length>=3) out.push({type:'Amas', keys:bySign[s].map(p=>p.key), sign:+s}); });
  return out;
}
// Profections annuelles (l'Ascendant avance d'un signe par an ; seigneur de l'année)
function profections(birthDate, atDate, ascSign){
  const yearMs=365.2422*86400000, ageF=(atDate-birthDate)/yearMs, age=Math.floor(ageF);
  const profSign=((ascSign+age)%12+12)%12, profHouse=(age%12)+1;
  const monthIdx=Math.floor((ageF-age)*12), profMonthSign=((profSign+monthIdx)%12+12)%12;
  return { age, profSign, lord:SIGNS[profSign].dom, profHouse, monthIdx, profMonthSign, monthLord:SIGNS[profMonthSign].dom };
}
// Firdaria (seigneurs du temps perses : périodes majeures + mineures)
const FIRDUR={sun:10,venus:8,mercury:13,moon:9,saturn:11,jupiter:12,mars:7,nodeN:3,nodeS:2};
const FIR_DAY=['sun','venus','mercury','moon','saturn','jupiter','mars','nodeN','nodeS'];
const FIR_NIGHT=['moon','saturn','jupiter','mars','sun','venus','mercury','nodeN','nodeS'];
const FIR7_DAY=['sun','venus','mercury','moon','saturn','jupiter','mars'];
const FIR7_NIGHT=['moon','saturn','jupiter','mars','sun','venus','mercury'];
function firdaria(birthDate, atDate, isDay){
  const seq=isDay?FIR_DAY:FIR_NIGHT, sub7=isDay?FIR7_DAY:FIR7_NIGHT;
  let ageF=(atDate-birthDate)/(365.2422*86400000); if(ageF>=75) ageF=ageF%75;
  const timeline=[]; let t=0;
  for(const lord of seq){ timeline.push({lord, start:t, end:t+FIRDUR[lord]}); t+=FIRDUR[lord]; }
  const major=timeline.find(p=>ageF>=p.start&&ageF<p.end)||timeline[timeline.length-1];
  let minor=null, subs=[];
  if(major.lord!=='nodeN'&&major.lord!=='nodeS'){
    const subDur=(major.end-major.start)/7, startIdx=sub7.indexOf(major.lord);
    for(let i=0;i<7;i++) subs.push({lord:sub7[(startIdx+i)%7], start:major.start+i*subDur, end:major.start+(i+1)*subDur});
    minor=subs.find(s=>ageF>=s.start&&ageF<s.end);
  }
  return { ageF, major, minor, timeline, subs };
}
// Révolution solaire : dernier retour du Soleil à son degré natal (début de l'année solaire)
function solarReturn(natalSunLon, atDate, lat, lonE){
  let t=A.SearchSunLongitude(natalSunLon, new Date(atDate.getTime()-367*86400000), 400), last=null;
  while(t && t.date.getTime()<=atDate.getTime()){ last=t.date; t=A.SearchSunLongitude(natalSunLon, new Date(t.date.getTime()+86400000), 400); }
  if(!last) return null;
  return { date:last, chart:buildChart(last, lat, lonE, 'whole') };
}
// Transits à venir : aspects majeurs des planètes lentes (Mars, Jupiter, Saturne) au thème natal
function transitsForecast(natal, fromDate, months){
  const targets=natal.planets.map(p=>({key:p.key,nom:p.nom,g:p.g,lon:p.lon}))
    .concat([{key:'asc',nom:'Ascendant',g:'Asc',lon:natal.asc},{key:'mc',nom:'Milieu du Ciel',g:'MC',lon:natal.mc}]);
  const movers=['mars','jupiter','saturn'], days=Math.round(months*30.44), events=[], prev={};
  for(let d=0; d<=days; d++){
    const t=new Date(fromDate.getTime()+d*86400000);
    for(const mk of movers){ const tl=tropLon(PMAP[mk].body,t);
      targets.forEach(tg=>{ const sepd=n360(tl-tg.lon);
        for(const ang of [0,60,90,120,180]){
          let o1=sepd-ang; if(o1>180)o1-=360; if(o1<-180)o1+=360;
          let o2=sepd-(360-ang); if(o2>180)o2-=360; if(o2<-180)o2+=360;
          const o=Math.abs(o1)<Math.abs(o2)?o1:o2, id=mk+'_'+tg.key+'_'+ang;
          if(prev[id]!==undefined && Math.sign(prev[id])!==Math.sign(o) && Math.abs(prev[id])<3 && Math.abs(o)<3 && d>0)
            events.push({mover:PMAP[mk], target:tg, asp:ASPECTS.find(x=>x.deg===ang), when:t, days:d});
          prev[id]=o;
        } });
    }
  }
  return events.sort((a,b)=>a.days-b.days);
}

/* ============== Techniques avancées & relationnelles ============= */
const CHALDEAN = ['saturn','jupiter','mars','sun','venus','mercury','moon'];
const MINOR_YEARS = [15,8,20,25,19,20,8,15,12,27,30,12];          // libération zodiacale, par signe
const LESSER_YEARS = { saturn:30, jupiter:12, mars:15, sun:19, venus:8, mercury:20, moon:25 }; // décennies, alcocoden (mineures)
const GMY = { // années planétaires : [grandes, moyennes, mineures]
  saturn:[57,43.5,30], jupiter:[79,45.5,12], mars:[66,40.5,15], sun:[120,69.5,19],
  venus:[82,45,8], mercury:[76,48,20], moon:[108,66.5,25] };

// --- coordonnées équatoriales de la date (géocentriques) ---
function eqOfDate(body, date){ const v=A.GeoVector(A.Body[body],date,true); return A.EquatorFromVector(A.RotateVector(A.Rotation_EQJ_EQD(date),v)); }
function declOf(body, date){ return eqOfDate(body,date).dec; }                     // déclinaison (°)
function raDeg(body, date){ return n360(eqOfDate(body,date).ra*15); }              // ascension droite (°)
// précession d'une étoile (RA/Dec J2000 -> équateur de date)
function precessStar(ra, dec, date){
  const raR=ra*D2R, decR=dec*D2R;
  const vec={ x:Math.cos(decR)*Math.cos(raR), y:Math.cos(decR)*Math.sin(raR), z:Math.sin(decR), t:A.MakeTime(date) };
  const e=A.RotateVector(A.Rotation_EQJ_EQD(date),vec); const q=A.EquatorFromVector(e); return { ra:q.ra*15, dec:q.dec };
}

// --- Synastrie : aspects croisés, réceptions croisées, contacts aux angles ---
function synastry(A2, B){
  const aspects=[];
  A2.planets.forEach(pa=> B.planets.forEach(pb=>{ const d=sep(pa.lon,pb.lon);
    for(const asp of ASPECTS){ if(Math.abs(d-asp.deg)<=MOIETY[pa.key]+MOIETY[pb.key]){
      aspects.push({a:pa,b:pb,asp,orb:Math.abs(d-asp.deg),fam:aspectFamily(pa.key,pb.key,asp),applying:false}); break; } } }));
  aspects.sort((x,y)=>x.orb-y.orb);
  const receptions=[];
  A2.planets.forEach(pa=> B.planets.forEach(pb=>{ const r=receptionsOf(pa,pb,A2.day); if(r.length) receptions.push({host:pa,guest:pb,sens:'A reçoit B',kinds:r.map(k=>DIGN_FR[k])}); }));
  B.planets.forEach(pb=> A2.planets.forEach(pa=>{ const r=receptionsOf(pb,pa,B.day); if(r.length) receptions.push({host:pb,guest:pa,sens:'B reçoit A',kinds:r.map(k=>DIGN_FR[k])}); }));
  const angleHits=[];
  const A2ang=[{nom:'Asc',lon:A2.asc},{nom:'MC',lon:A2.mc}], Bang=[{nom:'Asc',lon:B.asc},{nom:'MC',lon:B.mc}];
  A2.planets.forEach(p=> Bang.forEach(ag=>{ const d=sep(p.lon,ag.lon); for(const asp of ASPECTS){ if(Math.abs(d-asp.deg)<=MOIETY[p.key]){ angleHits.push({dir:'A→B', planet:p, angle:ag.nom, asp, orb:Math.abs(d-asp.deg)}); break; } } }));
  B.planets.forEach(p=> A2ang.forEach(ag=>{ const d=sep(p.lon,ag.lon); for(const asp of ASPECTS){ if(Math.abs(d-asp.deg)<=MOIETY[p.key]){ angleHits.push({dir:'B→A', planet:p, angle:ag.nom, asp, orb:Math.abs(d-asp.deg)}); break; } } }));
  return { aspects, receptions, angleHits };
}

// --- Lots traditionnels supplémentaires (formules transparentes, inversées de nuit) ---
function moreLots(chart){
  const P=k=>chart.planets.find(p=>p.key===k).lon, asc=chart.asc, day=chart.day;
  const fortune=chart.lots[0].lon, spirit=chart.lots[1].lon;
  const L=(nom,g,aDay,bDay, formuleJ, formuleN)=>{ const lon = day ? n360(asc+aDay-bDay) : n360(asc+bDay-aDay);
    return { nom, g, lon, formule: day?formuleJ:formuleN }; };
  return [
    L('Lot de Némésis','⊖', fortune, P('saturn'), 'Asc + Fortune − Saturne', 'Asc + Saturne − Fortune'),
    L('Lot du Père','♅', P('sun'), P('saturn'), 'Asc + Soleil − Saturne', 'Asc + Saturne − Soleil'),
    L('Lot de la Mère','♆', P('venus'), P('moon'), 'Asc + Vénus − Lune', 'Asc + Lune − Vénus'),
    L('Lot des Frères','♇', P('jupiter'), P('saturn'), 'Asc + Jupiter − Saturne', 'Asc + Saturne − Jupiter'),
    L('Lot du Mariage','⚭', P('venus'), P('saturn'), 'Asc + Vénus − Saturne', 'Asc + Saturne − Vénus'),
    L('Lot de la Maladie','☤', P('mars'), P('saturn'), 'Asc + Mars − Saturne', 'Asc + Saturne − Mars'),
  ];
}

// --- Libération zodiacale (Zodiacal Releasing, Valens) depuis un Lot ---
function zrSign(start, i){ return ((start + i + 6*Math.floor(i/12)) % 12 + 12) % 12; } // loosing of the bond /12
function zodiacalReleasing(lotLon, birthDate, atDate){
  const startSign=Math.floor(n360(lotLon)/30);
  const YEAR=365.2422, MONTH=YEAR/12, ageDays=(atDate-birthDate)/86400000;
  function level(unit, fromSign, totalDays, originDay){
    const periods=[]; let t=originDay, i=0;
    while(t < originDay+totalDays-1e-6 && i<600){ const s=zrSign(fromSign,i); const len=MINOR_YEARS[s]*unit;
      periods.push({ sign:s, start:t, end:Math.min(t+len, originDay+totalDays), lb:(i>0&&i%12===0) }); t+=len; i++; }
    return periods;
  }
  const peak=s=>[0,3,6,9].includes(((s-startSign)%12+12)%12);
  const L1=level(YEAR, startSign, 110*YEAR, 0);
  const c1=L1.find(p=>ageDays>=p.start&&ageDays<p.end)||L1[L1.length-1];
  const L2=level(MONTH, c1.sign, c1.end-c1.start, c1.start);
  const c2=L2.find(p=>ageDays>=p.start&&ageDays<p.end)||L2[L2.length-1];
  const L3=level(1, c2.sign, c2.end-c2.start, c2.start);
  const c3=L3.find(p=>ageDays>=p.start&&ageDays<p.end)||L3[L3.length-1];
  const toDate=d=>new Date(birthDate.getTime()+d*86400000);
  return { startSign, L1, L2, L3, cur:{L1:c1,L2:c2,L3:c3}, peak, toDate };
}

// --- Décennies (Valens) : 7 majeures de 129 mois, sous-périodes = années mineures (mois) ---
function decennials(birthDate, atDate, isDay){
  const MONTH=365.2422/12, ageM=(atDate-birthDate)/86400000/MONTH;
  const sect = isDay?'sun':'moon';
  const order=[]; let idx=CHALDEAN.indexOf(sect);
  for(let i=0;i<7;i++) order.push(CHALDEAN[(idx+i)%7]);   // majeures : depuis la lumière de secte, ordre chaldéen
  const majors=[]; let t=0;
  for(let c=0;c<7;c++) for(const lord of order){ majors.push({lord, start:t, end:t+129}); t+=129; if(majors.length>=7*7) break; }
  // (cycle complet = 7*129 mois) — on garde une seule révolution pour l'affichage courant
  const cycle=[]; t=0; for(const lord of order){ const subs=[]; let s=t;
    const subOrder=[]; let si=order.indexOf(lord); for(let k=0;k<7;k++) subOrder.push(order[(si+k)%7]);
    for(const sl of subOrder){ const len=LESSER_YEARS[sl]; subs.push({lord:sl, start:s, end:s+len}); s+=len; }
    cycle.push({lord, start:t, end:t+129, subs}); t+=129; }
  const total=7*129, a=ageM%total;
  const major=cycle.find(p=>a>=p.start&&a<p.end)||cycle[cycle.length-1];
  const minor=major.subs.find(p=>a>=p.start&&a<p.end)||major.subs[major.subs.length-1];
  const toDate=m=>new Date(birthDate.getTime()+m*MONTH*86400000);
  return { order, cycle, major, minor, ageMonths:a, toDate };
}

// --- Antiscia / contre-antiscia + contacts cachés ---
function antiscion(lon){ return n360(180-lon); }
function contraAntiscion(lon){ return n360(360-lon); }
function antisciaContacts(chart, orb){
  orb=orb||1; const res=[];
  for(const a of chart.planets) for(const b of chart.planets){ if(a.key===b.key) continue;
    if(sep(antiscion(a.lon), b.lon)<=orb) res.push({type:'antiscion', a, b, orb:sep(antiscion(a.lon),b.lon)});
  }
  // dédoublonner (a-b == b-a pour antiscia)
  const seen=new Set(), out=[];
  res.forEach(r=>{ const k=[r.a.key,r.b.key].sort().join('-')+r.type; if(!seen.has(k)){ seen.add(k); out.push(r); } });
  const contra=[];
  for(const a of chart.planets) for(const b of chart.planets){ if(a.key>=b.key) continue;
    if(sep(contraAntiscion(a.lon), b.lon)<=orb) contra.push({type:'contra-antiscion', a, b, orb:sep(contraAntiscion(a.lon),b.lon)}); }
  return { antiscia: out, contra };
}

// --- Déclinaisons, parallèles, contre-parallèles, hors-limites ---
function declinations(chart){
  const eps=chart.eps;
  const rows=chart.planets.map(p=>{ const dec=declOf(p.body, chart.date); return { key:p.key, nom:p.nom, g:p.g, dec, oob: Math.abs(dec)>eps }; });
  const aspects=[];
  for(let i=0;i<rows.length;i++) for(let j=i+1;j<rows.length;j++){ const a=rows[i], b=rows[j], d=Math.abs(a.dec-b.dec);
    if(d<=1 && Math.sign(a.dec)===Math.sign(b.dec)) aspects.push({a,b,type:'parallèle',orb:d});
    else if(Math.abs(Math.abs(a.dec)-Math.abs(b.dec))<=1 && Math.sign(a.dec)!==Math.sign(b.dec)) aspects.push({a,b,type:'contre-parallèle',orb:Math.abs(Math.abs(a.dec)-Math.abs(b.dec))}); }
  return { rows, aspects };
}

// --- Nœud lunaire VRAI (osculateur) ---
function trueNode(date){
  const dt=0.05, toECT=d=>A.RotateVector(A.Rotation_EQJ_ECT(d), A.GeoVector(A.Body.Moon,d,false));
  const r=toECT(date), r1=toECT(new Date(date.getTime()-dt*86400000)), r2=toECT(new Date(date.getTime()+dt*86400000));
  const v={x:r2.x-r1.x,y:r2.y-r1.y,z:r2.z-r1.z};
  const hx=r.y*v.z-r.z*v.y, hy=r.z*v.x-r.x*v.z;
  return n360(Math.atan2(hx,-hy)*R2D);
}

// --- Monomoiria (gouvernance par degré) & douzième-partie ---
function monomoiria(lon){ const sign=Math.floor(lon/30), deg=Math.floor(lon-sign*30);
  const start=CHALDEAN.indexOf(SIGNS[sign].dom); return CHALDEAN[((start+deg)%7+7)%7]; }
function dodecatemoria(lon){ const sign=Math.floor(lon/30), d=lon-sign*30; const ds=(sign+Math.floor(d/2.5))%12;
  return n360(ds*30 + (d%2.5)*12); }

// --- Révolution lunaire (retour de la Lune à son degré natal) ---
function lunarReturn(natalMoonLon, atDate, lat, lonE){
  // recherche du dernier retour <= atDate par balayage + bissection
  function diff(t){ let d=n360(tropLon('Moon',t)-natalMoonLon); if(d>180)d-=360; return d; }
  let t=new Date(atDate.getTime()), prev=diff(t), found=null;
  for(let h=0;h<=30*24;h+=3){ const tt=new Date(atDate.getTime()-h*3600000), cur=diff(tt);
    if(prev!==null && Math.sign(prev)!==Math.sign(cur) && Math.abs(prev)<30 && Math.abs(cur)<30){
      // bissection entre tt et tt+3h
      let lo=tt.getTime(), hi=tt.getTime()+3*3600000;
      for(let k=0;k<40;k++){ const mid=(lo+hi)/2, dm=diff(new Date(mid)); if(Math.sign(dm)===Math.sign(diff(new Date(lo)))) lo=mid; else hi=mid; }
      found=new Date((lo+hi)/2); break;
    }
    prev=cur;
  }
  if(!found) return null;
  return { date:found, chart:buildChart(found, lat, lonE, 'whole') };
}

// --- Fenêtres de transit (entrée / exact(s) / sortie), triple passages rétrogrades ---
function transitWindows(natal, fromDate, months){
  const targets=natal.planets.map(p=>({key:p.key,nom:p.nom,g:p.g,lon:p.lon}))
    .concat([{key:'asc',nom:'Ascendant',g:'Asc',lon:natal.asc},{key:'mc',nom:'Milieu du Ciel',g:'MC',lon:natal.mc}]);
  const movers=['mars','jupiter','saturn'], days=Math.round(months*30.44);
  const ORB=1.0; const open={}, out=[];
  function off(mk_lon, tlon, ang){ let o1=n360(mk_lon-tlon)-ang; if(o1>180)o1-=360; if(o1<-180)o1+=360;
    let o2=n360(mk_lon-tlon)-(360-ang); if(o2>180)o2-=360; if(o2<-180)o2+=360; return Math.abs(o1)<Math.abs(o2)?o1:o2; }
  for(let d=0; d<=days; d++){ const t=new Date(fromDate.getTime()+d*86400000);
    for(const mk of movers){ const ml=tropLon(PMAP[mk].body,t);
      targets.forEach(tg=>{ for(const ang of [0,60,90,120,180]){ const id=mk+'_'+tg.key+'_'+ang, o=off(ml,tg.lon,ang), prev=open[id+'_prev'];
        if(Math.abs(o)<=ORB){ if(!open[id]){ open[id]={enter:t, exacts:[]}; } if(prev!==undefined && Math.sign(prev)!==Math.sign(o)) open[id].exacts.push(t); }
        else if(open[id]){ out.push({mover:PMAP[mk], target:tg, asp:ASPECTS.find(x=>x.deg===ang), enter:open[id].enter, exacts:open[id].exacts, exit:t}); delete open[id]; }
        open[id+'_prev']=o;
      } });
    }
  }
  Object.keys(open).forEach(id=>{ if(id.endsWith('_prev')) return; const w=open[id]; /* fenêtre encore ouverte en fin */ });
  return out.sort((a,b)=>a.enter-b.enter);
}

// --- Hyleg & Alcocoden (témoignage de vitalité — JAMAIS durée de vie) ---
function hyleg(chart){
  const aphetic=new Set([1,11,10,9,7]);                 // lieux hylégiacaux (Asc, XI, X, IX, VII)
  const sun=chart.planets.find(p=>p.key==='sun'), moon=chart.planets.find(p=>p.key==='moon');
  const cands = chart.day ? [sun, moon] : [moon, sun];
  let hy=null, src='';
  for(const c of cands){ if(aphetic.has(c.house)){ hy={lon:c.lon, nom:c.nom}; src=c.nom; break; } }
  if(!hy){ hy={lon:chart.asc, nom:'Ascendant'}; src='Ascendant'; }   // repli : Ascendant
  const alm=almutenOfDegree(hy.lon, chart.day);
  const alc=chart.planets.find(p=>p.key===alm.planet);
  const cond = alc ? (alc.acc.angular==='angulaire'?0 : alc.acc.angular==='succédent'?1 : 2) : 1;
  const years = alc ? GMY[alc.key][cond] : null;        // angulaire→grandes, succédent→moyennes, cadent→mineures
  return { hyleg:hy, source:src, alcocoden:alm.planet, alcStr:alc, condition:['grandes','moyennes','mineures'][cond], years };
}

// --- Astrologie horaire (significateurs + considérations avant jugement) ---
function horary(chart, quesitedHouse){
  const ascLord=SIGNS[chart.ascSign].dom;
  const quesitedSign=Math.floor(chart.cusps[(quesitedHouse-1)%12]/30), quesitedLord=SIGNS[quesitedSign].dom;
  const querent=chart.planets.find(p=>p.key===ascLord), quesited=chart.planets.find(p=>p.key===quesitedLord);
  const moon=chart.planets.find(p=>p.key==='moon');
  const ascDeg=chart.asc-Math.floor(chart.asc/30)*30;
  const sat=chart.planets.find(p=>p.key==='saturn');
  const considerations=[];
  if(ascDeg<3) considerations.push("Ascendant trop précoce (<3°) : il est tôt pour juger l'affaire.");
  if(ascDeg>27) considerations.push("Ascendant trop tardif (>27°) : l'affaire est déjà ancienne ou échappe au consultant.");
  if(chart.voc) considerations.push("Lune en course vide : « rien n'en sortira » — l'affaire n'aboutit pas.");
  if(sat.house===7) considerations.push("Saturne en VII : juge avec prudence (corruption du jugement).");
  // perfection : aspect applicatif entre querent et quesited
  let perfection=null;
  const a=chart.aspects.find(x=>(x.a.key===ascLord&&x.b.key===quesitedLord)||(x.a.key===quesitedLord&&x.b.key===ascLord));
  if(a) perfection={asp:a.asp, applying:a.applying, orb:a.orb};
  return { ascLord, quesitedLord, querent, quesited, moon, considerations, perfection, quesitedHouse };
}

// --- Directions primaires (v1 « in zodiaco », clé de Naibod, aux angles Asc & MC) ---
function raDecl(lon, eps){ const l=lon*D2R, e=eps*D2R; return { ra:n360(Math.atan2(Math.sin(l)*Math.cos(e),Math.cos(l))*R2D), dec:Math.asin(Math.sin(e)*Math.sin(l))*R2D }; }
function obliqueAsc(lon, eps, lat){ const {ra,dec}=raDecl(lon,eps); let x=Math.tan(lat*D2R)*Math.tan(dec*D2R); x=Math.max(-0.9999,Math.min(0.9999,x)); return n360(ra - Math.asin(x)*R2D); }
function primaryDirections(chart){
  const eps=chart.eps, lat=chart.lat, NAIBOD=1/0.985647;
  const ascOA=obliqueAsc(chart.asc,eps,lat), mcRA=raDecl(chart.mc,eps).ra, res=[];
  chart.planets.forEach(p=>{ for(const ang of [0,60,90,120,180]){ for(const a of (ang===0?[0]:[ang,360-ang])){
    const prom=n360(p.lon-a);
    let arcA=obliqueAsc(prom,eps,lat)-ascOA; arcA=((arcA%360)+360)%360; if(arcA>180)arcA-=360;
    if(arcA>=0 && arcA<=95) res.push({prom:p, sig:'Ascendant', asp:ASPECTS.find(x=>x.deg===ang), arc:arcA, years:arcA*NAIBOD});
    let arcM=raDecl(prom,eps).ra-mcRA; arcM=((arcM%360)+360)%360; if(arcM>180)arcM-=360;
    if(arcM>=0 && arcM<=95) res.push({prom:p, sig:'Milieu du Ciel', asp:ASPECTS.find(x=>x.deg===ang), arc:arcM, years:arcM*NAIBOD});
  } } });
  return res.sort((a,b)=>a.years-b.years);
}
// --- Distributions par les bornes (direction de l'Asc à travers les termes, clé de Naibod) ---
function distributions(chart, atDate, birthDate){
  const eps=chart.eps, lat=chart.lat, NAIBOD=1/0.985647, ascOA=obliqueAsc(chart.asc,eps,lat);
  const res=[]; let lon=chart.asc;
  for(let k=0;k<24;k++){ const sign=Math.floor(lon/30), deg=lon-sign*30; let nb=null;
    for(const [r,up] of BOUNDS[sign]) if(up>deg+1e-9){ nb={ruler:r, end:sign*30+up}; break; }
    if(!nb){ lon=n360((sign+1)*30); continue; }
    let arc=obliqueAsc(n360(nb.end),eps,lat)-ascOA; arc=((arc%360)+360)%360;
    const yrs=arc*NAIBOD; res.push({ distributor:nb.ruler, untilYears:yrs, boundEnd:nb.end });
    lon=n360(nb.end); if(yrs>100) break;
  }
  let age=null, current=null;
  if(birthDate&&atDate){ age=(atDate-birthDate)/(365.2422*86400000); current=res.find(r=>r.untilYears>age)||null; }
  return { periods:res, age, current };
}
// --- Parans d'étoiles fixes (v1, positions de l'instant natal ; orbe en longitude sidérale) ---
function angleLSTs(raDeg_, decDeg, lat){ let x=Math.tan(lat*D2R)*Math.tan(decDeg*D2R); const circ=Math.abs(x)>=1; x=Math.max(-0.9999,Math.min(0.9999,x)); const ad=Math.asin(x)*R2D;
  return { MC:n360(raDeg_), IC:n360(raDeg_+180), ASC:n360(raDeg_-ad), DESC:n360(raDeg_+ad+180), circ }; }
function parans(chart, orbDeg){
  orbDeg=orbDeg||1.5; const lat=chart.lat, res=[];
  const bodies=chart.planets.map(p=>({ nom:p.nom, g:p.g, key:p.key, ra:raDeg(p.body,chart.date), dec:declOf(p.body,chart.date) }));
  const stars=STARS.map(s=>{ const q=precessStar(s.ra,s.dec,chart.date); return { nom:s.nom, nat:s.nat, note:s.note, ra:q.ra, dec:q.dec }; });
  const ANG=['MC','IC','ASC','DESC'];
  bodies.forEach(b=>{ const ba=angleLSTs(b.ra,b.dec,lat); stars.forEach(s=>{ const sa=angleLSTs(s.ra,s.dec,lat);
    ANG.forEach(a1=> ANG.forEach(a2=>{ if(ba.circ||sa.circ) return; const d=sep(ba[a1], sa[a2]);
      if(d<=orbDeg) res.push({ planet:b, star:s, angleP:a1, angleS:a2, orb:d }); })); }); });
  return res.sort((a,b)=>a.orb-b.orb);
}
// --- Électionnel : balayage d'une plage, score des conditions traditionnelles ---
function electional(fromDate, toDate, lat, lonE, stepMin){
  stepMin=stepMin||60; const out=[];
  for(let t=fromDate.getTime(); t<=toDate.getTime(); t+=stepMin*60000){ const d=new Date(t);
    const c=buildChart(d, lat, lonE, 'whole');
    const moon=c.planets.find(p=>p.key==='moon'), ascLord=c.planets.find(p=>p.key===SIGNS[c.ascSign].dom);
    let s=0; const notes=[];
    if(!c.voc){ s+=2; } else notes.push('Lune VOC');
    if(c.phase.waxing){ s+=1; }
    s+=Math.max(0,moon.dig.score)*0.5; if(moon.dig.score<0) notes.push('Lune débile');
    if(moon.solar==='combuste'){ s-=3; notes.push('Lune combuste'); }
    s+=Math.max(0,ascLord.dig.score)*0.4;
    // maléfiques aux angles = malus
    c.planets.forEach(p=>{ if((p.key==='mars'||p.key==='saturn') && [1,10,7,4].includes(p.house) && p.dig.score<0){ s-=1.5; } });
    out.push({ date:d, score:Math.round(s*10)/10, notes });
  }
  return out.sort((a,b)=>b.score-a.score);
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
         buildChart, planetaryHour, moonPhase, weekdayBxl, angularType, boundRuler, faceRuler,
         dominants, balances, configurations, profections, firdaria, solarReturn, transitsForecast,
         synastry, moreLots, zodiacalReleasing, decennials, antiscion, contraAntiscion, antisciaContacts,
         declinations, declOf, trueNode, monomoiria, dodecatemoria, lunarReturn, transitWindows,
         hyleg, horary, primaryDirections, distributions, parans, electional, CHALDEAN, GMY };
});
