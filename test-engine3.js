// Test des techniques d'analyse & prévision (dominantes, balances, configurations,
// profections, firdaria, révolution solaire, transits à venir)
const E = require('./engine.js');
const { fmtLon } = E;
let fails=0; const assert=(c,m)=>{ console.log((c?'  ✓ ':'  ✗ ')+m); if(!c)fails++; };

const OTT = new Date(Date.UTC(1986,4,22,0,8,0));   // naissance Ottignies, nocturne
const NOW = new Date(Date.UTC(2026,5,14,12,0,0));  // 14/06/2026
const c = E.buildChart(OTT, 50.6649, 4.5673, 'whole');
const sunLon = c.planets.find(p=>p.key==='sun').lon;

console.log('############ DOMINANTES ############');
const dom = E.dominants(c);
dom.forEach(d=> console.log(`  ${d.g} ${d.nom.padEnd(8)} ${String(d.score.toFixed(1)).padStart(6)}  ${d.pct}%`));
assert(dom.length===7 && dom[0].score>=dom[6].score, 'Dominantes : 7 astres classés par score décroissant');
assert(Math.abs(dom.reduce((a,b)=>a+b.pct,0)-100)<=3, 'Dominantes : pourcentages ≈ 100%');

console.log('\n############ BALANCES ############');
const bal = E.balances(c);
console.log('  Éléments :', JSON.stringify(bal.elemPct), '→ dominant', bal.elemDom);
console.log('  Modes    :', JSON.stringify(bal.modePct), '→ dominant', bal.modeDom);
console.log('  Hémisph. : au-dessus', bal.above, 'sous', bal.below, '| est', bal.east, 'ouest', bal.west);
assert(Math.abs(Object.values(bal.elemPct).reduce((a,b)=>a+b,0)-100)<=3, 'Éléments ≈ 100%');
assert(bal.above+bal.below===7 && bal.east+bal.west===7, 'Hémisphères : 7 astres répartis');

console.log('\n############ CONFIGURATIONS ############');
const cfg = E.configurations(c);
cfg.forEach(x=> console.log(`  ${x.type} : ${x.keys.map(k=>E.PMAP[k].g).join(' ')}${x.elem?' ('+x.elem+')':''}${x.apex?' apex '+E.PMAP[x.apex].g:''}`));
console.log('  (', cfg.length, 'configuration(s) )');
assert(Array.isArray(cfg), 'Configurations : liste retournée');

console.log('\n############ PROFECTIONS ############');
const pr = E.profections(OTT, NOW, c.ascSign);
console.log(`  Âge ${pr.age} | signe profecté ${E.SIGNS[pr.profSign].nom} (maison ${pr.profHouse}) | seigneur de l'année ${E.PMAP[pr.lord].nom}`);
console.log(`  Mois profecté : ${E.SIGNS[pr.profMonthSign].nom}, seigneur ${E.PMAP[pr.monthLord].nom}`);
assert(pr.age===40, 'Profection : âge = 40 ans au 14/06/2026 (né 22/05/1986)');
// à 40 ans, 40 mod 12 = 4 → maison profectée 5 ; signe = ASC(Verseau=10) + 4 = Gémeaux(2)
assert(pr.profHouse===5, 'Profection : maison profectée = V (40 mod 12 +1)');
assert(pr.profSign===((c.ascSign+40)%12), 'Profection : signe = ASC + âge');

console.log('\n############ FIRDARIA ############');
const fd = E.firdaria(OTT, NOW, c.day);
console.log(`  Thème ${c.day?'diurne':'nocturne'} | âge ${fd.ageF.toFixed(1)}`);
console.log(`  Majeur : ${E.PMAP[fd.major.lord]?E.PMAP[fd.major.lord].nom:fd.major.lord} (${fd.major.start}–${fd.major.end} ans)`);
if(fd.minor) console.log(`  Mineur : ${E.PMAP[fd.minor.lord].nom} (${fd.minor.start.toFixed(1)}–${fd.minor.end.toFixed(1)} ans)`);
const totalDur = fd.timeline.reduce((s,p)=>s+(p.end-p.start),0);
assert(totalDur===75, 'Firdaria : cycle total = 75 ans');
assert(fd.ageF>=fd.major.start && fd.ageF<fd.major.end, 'Firdaria : âge dans la période majeure courante');
// nocturne → 1er seigneur = Lune (0–9 ans)
assert(fd.timeline[0].lord==='moon', 'Firdaria nocturne : 1er seigneur = Lune');

console.log('\n############ RÉVOLUTION SOLAIRE ############');
const sr = E.solarReturn(sunLon, NOW, 50.6649, 4.5673);
if(sr){ console.log(`  RS du ${sr.date.toISOString().slice(0,10)} | Asc ${fmtLon(sr.chart.asc).txt} | MC ${fmtLon(sr.chart.mc).txt}`);
  const srSun=sr.chart.planets.find(p=>p.key==='sun').lon;
  assert(E.sep(srSun, sunLon)<0.05, 'Révolution solaire : Soleil revenu au degré natal (±0.05°)');
  assert(sr.date<=NOW && sr.date>new Date(NOW.getTime()-366*86400000), 'RS : dans l\'année solaire courante');
} else assert(false, 'Révolution solaire calculée');

console.log('\n############ TRANSITS À VENIR (12 mois) ############');
const tr = E.transitsForecast(c, NOW, 12);
tr.slice(0,8).forEach(t=> console.log(`  ${t.when.toISOString().slice(0,10)} : ${t.mover.nom} ${t.asp.nom} ${t.target.nom} natal`));
console.log('  (', tr.length, 'transit(s) majeur(s) en 12 mois )');
assert(tr.every(t=>t.days>=0 && t.days<=366), 'Transits : tous dans la fenêtre 12 mois');
assert(tr.length===0 || tr[0].days<=tr[tr.length-1].days, 'Transits : triés chronologiquement');

console.log(`\n############ ${fails===0?'TOUTES LES ASSERTIONS PASSENT ✓':fails+' ÉCHEC(S) ✗'} ############`);
process.exit(fails===0?0:1);
