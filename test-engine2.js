const E = require('./engine.js');
const { fmtLon, n360, sep } = E;

function showHouses(label, date, lat, lon){
  console.log(`\n############ ${label} ############`);
  for (const sys of ['whole','porphyry','placidus','regiomontanus']){
    const c = E.buildChart(date, lat, lon, sys);
    const cus = c.cusps.map(x=>fmtLon(x).short).join('  ');
    const ascErr = sep(c.cusps[0], c.asc).toFixed(3), mcErr = sep(c.cusps[9], c.mc).toFixed(3);
    // monotonie
    let mono=true; for(let i=0;i<12;i++){ const span=n360(c.cusps[(i+1)%12]-c.cusps[i]); if(span<1||span>179) mono=false; }
    console.log(`${sys.padEnd(14)} I=Asc:${ascErr}° X=MC:${mcErr}° mono:${mono}\n   ${cus}`);
  }
}

const OTT = new Date(Date.UTC(1986,4,22,0,8,0));
const c = E.buildChart(OTT, 50.6649, 4.5673, 'whole');
console.log('=== NATAL OTTIGNIES 22/05/1986 02:08 (signes entiers) ===');
console.log('Asc', fmtLon(c.asc).txt, '| MC', fmtLon(c.mc).txt, '| thème', c.day?'diurne':'nocturne');
console.log('\nPlanètes :');
c.planets.forEach(p=>{
  console.log(`  ${p.nom.padEnd(8)} ${fmtLon(p.lon).txt.padEnd(20)} M${p.house} | ${p.dig.label.padEnd(11)} score ess ${String(p.dig.score).padStart(3)} | acc ${p.acc.score} | ${p.retro?'℞':' '} ${p.solar||''} | ${p.inSect?'en secte':'hors secte'}${p.hayz?' hayz':''}`);
});
console.log('\nLots :'); c.lots.forEach(l=> console.log(`  ${l.nom.padEnd(20)} ${fmtLon(l.lon).txt}`));
console.log('Nœud Nord', fmtLon(c.points[0].lon).txt);
console.log('\nAlmutén de la géniture :', E.PMAP[c.almuten.planet].nom, '(score', c.almuten.score+')', c.almuten.tally);
console.log('Tempérament :', c.temperament.dominant, c.temperament.qualite, '|', JSON.stringify(c.temperament.pct), '(somme', Object.values(c.temperament.pct).reduce((a,b)=>a+b,0)+')');
console.log('Lune : phase', c.phase.nom, c.phase.illum+'%', '| demeure', c.mansion.index+1, c.mansion.nom, '| course vide:', c.voc);
console.log('Application Lune :', c.app?`${c.app.asp.nom} à ${c.app.planet.nom} dans ${c.app.hours.toFixed(1)}h`:'—');
console.log('\nAspects ('+c.aspects.length+') :');
c.aspects.forEach(a=> console.log(`  ${a.a.nom} ${a.asp.nom} ${a.b.nom} (${a.fam}, ${a.applying?'app':'sep'}, orbe ${a.orb.toFixed(1)}°)${a.partile?' PARTILE':''}`));
console.log('Réceptions mutuelles :', c.receptions.map(r=>`${r.a.nom}↔${r.b.nom}`).join(', ')||'aucune');
console.log('\nÉtoiles fixes conjointes :');
c.stars.forEach(s=> console.log(`  ${s.star.nom} (${s.star.nat}) conj ${s.body.nom} orbe ${s.orb.toFixed(2)}°`));

showHouses('NATAL OTTIGNIES — maisons', OTT, 50.6649, 4.5673);
showHouses('BRUXELLES MAINTENANT — maisons', new Date(), 50.8503, 4.3517);

console.log('\n[attendu] I=Asc et X=MC ≈ 0.00° partout (Régiomontanus inclus), monotonie true, tempérament somme≈100');

/* ===================== ASSERTIONS DE NON-RÉGRESSION ===================== */
let fails=0;
function assert(cond, msg){ console.log((cond?'  ✓ ':'  ✗ ')+msg); if(!cond) fails++; }
console.log('\n############ ASSERTIONS ############');

// -- Placide : auto-cohérence semi-arc + anti-fallback (le bug du fallback à 30°) --
const D2R=Math.PI/180,R2D=180/Math.PI;
function placidusSelfCheck(date,lat,lon){
  const c=E.buildChart(date,lat,lon,'placidus');
  const eps=E.obliq(date)*D2R, latR=lat*D2R, rm=E.n360((require('astronomy-engine').SiderealTime(date)+lon/15)*15);
  // pour chaque cuspide intermédiaire, vérifier que l'angle horaire = fraction du semi-arc
  const checks=[[10,1/3,false],[11,2/3,false],[1,1/3,true],[2,2/3,true]]; // idx cusp, frac, below
  let maxErr=0;
  for(const [idx,frac,below] of checks){
    const L=c.cusps[idx]*D2R;
    const al=E.n360(Math.atan2(Math.sin(L)*Math.cos(eps),Math.cos(L))*R2D);
    const dec=Math.asin(Math.sin(eps)*Math.sin(L));
    let x=Math.tan(latR)*Math.tan(dec); x=Math.max(-0.99999,Math.min(0.99999,x));
    const AD=Math.asin(x)*R2D, DSA=90+AD, NSA=90-AD;
    let ha=al-rm; ha=((ha%360)+360)%360; if(ha>180) ha-=360;  // -180..180 ; côté est positif (haU)
    const target=below?(DSA+frac*NSA):(frac*DSA);
    maxErr=Math.max(maxErr, Math.abs(ha-target));
  }
  return { maxErr };  // la condition semi-arc à 0° PROUVE que ce n'est pas le fallback (qui violerait la condition)
}
for(const [lab,d,la,lo] of [['Ottignies',OTT,50.6649,4.5673],['Bruxelles',new Date(),50.8503,4.3517],['Quito~0°',OTT,0.2,-78.5],['Reykjavik 64°',OTT,64.1,-21.9]]){
  const r=placidusSelfCheck(d,la,lo);
  assert(r.maxErr<0.05, `Placide ${lab} : condition semi-arc des anciens satisfaite (erreur ${r.maxErr.toFixed(4)}° < 0.05° → pas le fallback)`);
}

// -- Triplicité de l'Eau : thème diurne, Scorpion → maître = Mars --
{ const dScorp=18*30; // pas utilisé directement
  const dig=E.dignities('mars', 7*30+10, true); // Mars à 10° Scorpion (signe 7), diurne
  assert(dig.rulers.triplicity==='mars', 'Triplicité Eau diurne : maître = Mars (♂) et non Vénus');
}
// -- Triplicité comptée une seule fois : exactement un astre triplicity:true par signe/secte --
{ let ok=true; for(let s=0;s<12;s++) for(const day of [true,false]){
    let cnt=0; for(const p of E.PLANETS){ const dg=E.dignities(p.key, s*30+5, day); if(dg.triplicity) cnt++; }
    if(cnt!==1) ok=false; }
  assert(ok, 'Exactement 1 maître de triplicité (+3) par signe et par secte (plus de triple comptage)');
}
// -- Lots : latéralité de Paulus (jour Eros=Asc+Esprit−Vénus ; Nécessité=Asc+Mercure−Fortune) --
{ const cc=E.buildChart(OTT,50.6649,4.5673,'whole');
  const P=k=>cc.planets.find(p=>p.key===k).lon;
  const spirit=cc.lots.find(l=>l.key==='spirit').lon, fortune=cc.lots.find(l=>l.key==='fortune').lon;
  const eros=cc.lots.find(l=>l.key==='eros').lon, neces=cc.lots.find(l=>l.key==='necessity').lon;
  // Ottignies est NOCTURNE → formules inversées (la latéralité de Paulus se renverse de nuit)
  const expEros = cc.day ? E.n360(cc.asc+spirit-P('venus')) : E.n360(cc.asc+P('venus')-spirit);
  const expNeces = cc.day ? E.n360(cc.asc+P('mercury')-fortune) : E.n360(cc.asc+fortune-P('mercury'));
  assert(sep(eros,expEros)<0.01, `Lot de l’Amour (Eros) suit Paulus (${cc.day?'jour':'nuit'})`);
  assert(sep(neces,expNeces)<0.01, `Lot de Nécessité suit Paulus (${cc.day?'jour':'nuit'})`);
}
// -- Hautes latitudes : somme des spans = 360 pour TOUS les systèmes (repli propre) --
for(const la of [67,78]){ for(const sys of ['whole','porphyry','placidus','regiomontanus']){
  const c=E.buildChart(OTT,la,4.5,sys);
  const sum=c.cusps.reduce((s,_,i)=>s+E.n360(c.cusps[(i+1)%12]-c.cusps[i]),0);
  assert(Math.abs(sum-360)<0.01, `lat ${la}N ${sys.padEnd(13)} : somme des spans = 360° (${sum.toFixed(1)})${c.degraded?' [dégradé→'+c.degraded+']':''}`);
}}
// -- Aucune cuspide non finie nulle part --
{ let ok=true; for(const la of [0,50.85,67,78]) for(const sys of ['whole','porphyry','placidus','regiomontanus']){
    const c=E.buildChart(OTT,la,4.5,sys); if(c.cusps.some(x=>!Number.isFinite(x))) ok=false; }
  assert(ok, 'Aucune cuspide NaN/null (durcissement) à 0°/50.85°/67°/78°'); }

console.log(`\n############ ${fails===0?'TOUTES LES ASSERTIONS PASSENT ✓':fails+' ÉCHEC(S) ✗'} ############`);
process.exit(fails===0?0:1);
