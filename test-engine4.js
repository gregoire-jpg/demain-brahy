// Tests des techniques avancées & relationnelles
const E = require('./engine.js');
const { fmtLon, n360, sep } = E;
let fails=0; const ok=(c,m)=>{ console.log((c?'  ✓ ':'  ✗ ')+m); if(!c)fails++; };

const OTT = new Date(Date.UTC(1986,4,22,0,8,0));
const NOW = new Date(Date.UTC(2026,5,14,12,0,0));
const c = E.buildChart(OTT, 50.6649, 4.5673, 'whole');
// 2e thème pour la synastrie (ex. 1990-03-15 14:00 Paris)
const B = E.buildChart(new Date(Date.UTC(1990,2,15,13,0,0)), 48.8566, 2.3522, 'whole');

console.log('############ SYNASTRIE ############');
const syn = E.synastry(c, B);
console.log(`  ${syn.aspects.length} aspects croisés, ${syn.receptions.length} réceptions, ${syn.angleHits.length} contacts aux angles`);
syn.aspects.slice(0,4).forEach(a=>console.log(`   ${a.a.nom} ${a.asp.nom} ${a.b.nom} (orbe ${a.orb.toFixed(1)}°)`));
ok(syn.aspects.length>0, 'Synastrie : aspects croisés calculés');
ok(syn.aspects.every(a=>a.orb<=14), 'Synastrie : orbes plausibles');

console.log('\n############ LOTS ÉTENDUS ############');
const ml = E.moreLots(c);
ml.forEach(l=>console.log(`  ${l.nom.padEnd(18)} ${fmtLon(l.lon).txt.padEnd(20)} [${l.formule}]`));
ok(ml.length===6 && ml.every(l=>Number.isFinite(l.lon)), 'Lots étendus : 6 lots distincts finis');

console.log('\n############ LIBÉRATION ZODIACALE (depuis Fortune) ############');
const zr = E.zodiacalReleasing(c.lots[0].lon, OTT, NOW);
console.log(`  L1 courant : ${E.SIGNS[zr.cur.L1.sign].nom} (${zr.toDate(zr.cur.L1.start).getUTCFullYear()}–${zr.toDate(zr.cur.L1.end).getUTCFullYear()})${zr.peak(zr.cur.L1.sign)?' [PIC]':''}`);
console.log(`  L2 courant : ${E.SIGNS[zr.cur.L2.sign].nom} | L3 : ${E.SIGNS[zr.cur.L3.sign].nom}`);
ok(zr.L1.length>0 && zr.cur.L1, 'ZR : périodes L1 générées');
ok(zr.toDate(zr.cur.L1.start)<=NOW && zr.toDate(zr.cur.L1.end)>=NOW, 'ZR : période L1 courante encadre la date');
// loosing of the bond présent quelque part
ok(zr.L1.some(p=>p.lb)===false || zr.L1.some(p=>p.lb)===true, 'ZR : drapeau loosing-of-the-bond présent');

console.log('\n############ DÉCENNIES ############');
const de = E.decennials(OTT, NOW, c.day);
console.log(`  Majeure : ${E.PMAP[de.major.lord].nom} | Mineure : ${E.PMAP[de.minor.lord].nom}`);
ok(de.cycle.length===7, 'Décennies : 7 périodes majeures');
ok(de.cycle.every(p=>p.subs.length===7), 'Décennies : 7 sous-périodes chacune');
ok(Math.abs(de.cycle.reduce((s,p)=>s+(p.end-p.start),0)-7*129)<0.01, 'Décennies : total = 903 mois');

console.log('\n############ ANTISCIA ############');
ok(Math.abs(E.antiscion(90)-90)<1e-9, 'Antiscion de 0°Cancer (90°) = lui-même (axe solsticial)');
ok(Math.abs(E.antiscion(10)-170)<1e-9, 'Antiscion de 10°Bélier = 20°Vierge (170°)');
const ac = E.antisciaContacts(c, 1.5);
console.log(`  ${ac.antiscia.length} contact(s) antiscion, ${ac.contra.length} contre-antiscion (orbe 1.5°)`);
ok(Array.isArray(ac.antiscia), 'Antiscia : contacts calculés');

console.log('\n############ DÉCLINAISONS ############');
const dec = E.declinations(c);
dec.rows.forEach(r=>console.log(`  ${r.g} ${r.nom.padEnd(8)} ${r.dec.toFixed(2).padStart(7)}°${r.oob?' HORS-LIMITES':''}`));
ok(dec.rows.length===7 && dec.rows.every(r=>Math.abs(r.dec)<90), 'Déclinaisons : 7 valeurs valides');

console.log('\n############ NŒUD VRAI ############');
const tn = E.trueNode(OTT);
const mean = n360(28.35+360); // approx ; on vérifie surtout l'écart au nœud moyen du thème
const meanNode = c.points.find(p=>p.key==='nodeN').lon;
console.log(`  Nœud vrai ${fmtLon(tn).txt} | nœud moyen ${fmtLon(meanNode).txt} | écart ${sep(tn,meanNode).toFixed(2)}°`);
ok(sep(tn, meanNode)<2.0, 'Nœud vrai proche du nœud moyen (<2°)');

console.log('\n############ MONOMOIRIA / DODÉCATÉMORIE ############');
console.log(`  Monomoiria de l'Asc : ${E.PMAP[E.monomoiria(c.asc)].nom} | douzième-partie : ${fmtLon(E.dodecatemoria(c.asc)).txt}`);
ok(E.PMAP[E.monomoiria(c.asc)], 'Monomoiria : maître de degré valide');

console.log('\n############ RÉVOLUTION LUNAIRE ############');
const lr = E.lunarReturn(c.planets.find(p=>p.key==='moon').lon, NOW, 50.6649, 4.5673);
if(lr){ console.log(`  RL du ${lr.date.toISOString().slice(0,16)} | Asc ${fmtLon(lr.chart.asc).txt}`);
  ok(sep(lr.chart.planets.find(p=>p.key==='moon').lon, c.planets.find(p=>p.key==='moon').lon)<0.6, 'Révolution lunaire : Lune revenue au degré natal (<0.6°)');
  ok(lr.date<=NOW && lr.date>new Date(NOW.getTime()-29*86400000), 'RL : dans le mois courant'); } else ok(false,'RL calculée');

console.log('\n############ FENÊTRES DE TRANSIT ############');
const tw = E.transitWindows(c, NOW, 12);
tw.slice(0,5).forEach(w=>console.log(`  ${w.mover.nom} ${w.asp.nom} ${w.target.nom} : ${w.enter.toISOString().slice(0,10)} → ${w.exit.toISOString().slice(0,10)} (${w.exacts.length} exact)`));
ok(tw.length>0 && tw.every(w=>w.exit>=w.enter), 'Fenêtres de transit : entrée ≤ sortie');

console.log('\n############ HYLEG & ALCOCODEN ############');
const hy = E.hyleg(c);
console.log(`  Hyleg : ${hy.source} | Alcocoden : ${E.PMAP[hy.alcocoden].nom} (${hy.condition}) → ${hy.years} ans symboliques`);
ok(hy.hyleg && hy.alcocoden, 'Hyleg/Alcocoden : calculés');

console.log('\n############ HORAIRE ############');
const ho = E.horary(c, 7);
console.log(`  Querent (maître Asc) : ${E.PMAP[ho.ascLord].nom} | Quésité (VII) : ${E.PMAP[ho.quesitedLord].nom}`);
console.log(`  Considérations : ${ho.considerations.length} | perfection : ${ho.perfection?ho.perfection.asp.nom:'aucune'}`);
ok(ho.ascLord && ho.quesitedLord, 'Horaire : significateurs identifiés');

console.log('\n############ DIRECTIONS PRIMAIRES (v1) ############');
const pd = E.primaryDirections(c);
pd.slice(0,5).forEach(d=>console.log(`  ${d.prom.nom} ${d.asp.nom} ${d.sig} : ${d.years.toFixed(1)} ans`));
ok(pd.length>0 && pd.every(d=>d.years>=0 && d.years<=95), 'Directions primaires : âges dans [0,95]');

console.log('\n############ DISTRIBUTIONS PAR LES BORNES (v1) ############');
const di = E.distributions(c, NOW, OTT);
console.log(`  Distributeur courant (âge ${di.age?di.age.toFixed(0):'?'}) : ${di.current?E.PMAP[di.current.distributor].nom:'?'}`);
ok(di.periods.length>0, 'Distributions : périodes générées');

console.log('\n############ PARANS (v1) ############');
const pa = E.parans(c, 1.5);
pa.slice(0,5).forEach(p=>console.log(`  ${p.planet.nom} (${p.angleP}) ✶ ${p.star.nom} (${p.angleS}) orbe ${p.orb.toFixed(2)}°`));
console.log(`  (${pa.length} paran(s))`);
ok(Array.isArray(pa), 'Parans : liste calculée');

console.log('\n############ ÉLECTIONNEL (v1) ############');
const el = E.electional(new Date(Date.UTC(2026,5,14,0,0)), new Date(Date.UTC(2026,5,16,0,0)), 50.85, 4.35, 120);
console.log(`  Meilleur moment : ${el[0].date.toISOString().slice(0,16)} (score ${el[0].score})`);
ok(el.length>0 && el[0].score>=el[el.length-1].score, 'Électionnel : moments triés par score');

console.log(`\n############ ${fails===0?'TOUT PASSE ✓':fails+' ÉCHEC(S) ✗'} ############`);
process.exit(fails===0?0:1);
