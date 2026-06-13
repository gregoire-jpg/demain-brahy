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
