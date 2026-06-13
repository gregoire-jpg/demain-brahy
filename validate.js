// Validation du moteur astronomique avant de bâtir la page.
// 1) Longitudes écliptiques tropicales VRAIES de la date (zodiaque des anciens)
// 2) Ascendant/MC pour Bruxelles via formule classique
// 3) Contre-vérification de l'Ascendant par balayage de l'horizon (astronomy-engine)
const A = require('astronomy-engine');

const SIGNS = ['Bélier','Taureau','Gémeaux','Cancer','Lion','Vierge','Balance','Scorpion','Sagittaire','Capricorne','Verseau','Poissons'];
const D2R = Math.PI/180, R2D = 180/Math.PI;
const norm360 = x => ((x % 360) + 360) % 360;
function fmt(lon){
  lon = norm360(lon);
  const s = Math.floor(lon/30);
  const d = lon - s*30;
  const deg = Math.floor(d);
  const min = Math.round((d-deg)*60);
  return `${String(deg).padStart(2,' ')}°${String(min).padStart(2,'0')}' ${SIGNS[s]}`;
}

// Longitude écliptique géocentrique apparente, vraie de la date
function tropicalLon(body, date){
  const v = A.GeoVector(body, date, true);          // EQJ, aberration corrigée
  const rot = A.Rotation_EQJ_ECT(date);             // vers écliptique vraie de la date
  const e = A.RotateVector(rot, v);
  const sph = A.SphereFromVector(e);                 // {lat, lon, dist} en degrés
  return norm360(sph.lon);
}

// Obliquité moyenne de la date (IAU 1980, suffisant)
function meanObliquity(date){
  const time = A.MakeTime(date);
  const T = time.tt / 36525;                          // siècles juliens depuis J2000 (TT)
  const sec = 21.448 - 46.8150*T - 0.00059*T*T + 0.001813*T*T*T;
  return 23 + 26/60 + sec/3600;                       // degrés
}

function ramcDeg(date, lonEast){
  const gast = A.SiderealTime(date);                  // heures (GAST)
  const lstHours = gast + lonEast/15;
  return norm360(lstHours*15);
}

function mcLon(ramc, eps){
  return norm360(Math.atan2(Math.sin(ramc*D2R), Math.cos(ramc*D2R)*Math.cos(eps*D2R))*R2D);
}

// Ascendant — formule classique
function ascLon(ramc, lat, eps){
  const r = ramc*D2R, e = eps*D2R, f = lat*D2R;
  let asc = Math.atan2(Math.cos(r), -(Math.sin(r)*Math.cos(e) + Math.tan(f)*Math.sin(e)))*R2D;
  return norm360(asc);
}

// Contre-vérification : balayage de l'écliptique pour trouver le point qui se lève à l'est
function ascByHorizon(date, lat, lonEast){
  const observer = new A.Observer(lat, lonEast, 0);
  const eps = meanObliquity(date)*D2R;
  let best=null;
  for(let lon=0; lon<360; lon+=0.01){
    const l = lon*D2R;
    const dec = Math.asin(Math.sin(eps)*Math.sin(l));        // β=0
    const ra  = Math.atan2(Math.sin(l)*Math.cos(eps), Math.cos(l)); // radians
    const raHours = norm360(ra*R2D)/15;
    const hor = A.Horizon(date, observer, raHours, dec*R2D, null); // horizon géométrique, sans réfraction
    // point sur l'horizon (alt≈0) côté est (azimut 0..180)
    if(Math.abs(hor.altitude) < 0.05 && hor.azimuth > 0 && hor.azimuth < 180){
      if(!best || Math.abs(hor.altitude) < best.err) best={lon, err:Math.abs(hor.altitude), az:hor.azimuth};
    }
  }
  return best;
}

const bodies = [['Soleil',A.Body.Sun],['Lune',A.Body.Moon],['Mercure',A.Body.Mercury],
  ['Vénus',A.Body.Venus],['Mars',A.Body.Mars],['Jupiter',A.Body.Jupiter],['Saturne',A.Body.Saturn]];

function report(label, date, lat, lonEast){
  console.log(`\n=== ${label} : ${date.toISOString()} ===`);
  for(const [name,b] of bodies){
    console.log(`  ${name.padEnd(8)} ${fmt(tropicalLon(b,date))}`);
  }
  const eps = meanObliquity(date);
  const ramc = ramcDeg(date, lonEast);
  const mc = mcLon(ramc, eps);
  const asc = ascLon(ramc, lat, eps);
  console.log(`  ε (obliquité) = ${eps.toFixed(5)}°   RAMC = ${ramc.toFixed(3)}°`);
  console.log(`  MC   (formule) ${fmt(mc)}`);
  console.log(`  ASC  (formule) ${fmt(asc)}`);
  const chk = ascByHorizon(date, lat, lonEast);
  if(chk) console.log(`  ASC  (horizon) ${fmt(chk.lon)}   (az ${chk.az.toFixed(1)}°, écart formule ${(Math.min(Math.abs(asc-chk.lon),360-Math.abs(asc-chk.lon))).toFixed(2)}°)`);
}

// Bruxelles
const BXL_LAT = 50.8503, BXL_LON = 4.3517;
report('Bruxelles — instant fixe de test', new Date('2026-06-13T12:00:00Z'), BXL_LAT, BXL_LON);

// Thème natal : Ottignies, 22 mai 1986 02:08 CEST = 00:08 UTC
const OTT_LAT = 50.6649, OTT_LON = 4.5673;
report('Natal Ottignies', new Date(Date.UTC(1986,4,22,0,8,0)), OTT_LAT, OTT_LON);

// Sanity : le Soleil le 13 juin doit être vers 22-23° Gémeaux
console.log('\n[attendu] Soleil ~22-23° Gémeaux le 2026-06-13, Lune cohérente, écart ASC formule/horizon < 0.3°');
