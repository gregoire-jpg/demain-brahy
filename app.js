/* ============================================================
   DEMAIN — cockpit (rendu + interactivité)
   Consomme le moteur window.DEMAIN. Tout survol explique,
   tout glyphe renvoie à sa délinéation (liens internes).
   ============================================================ */
(function () {
"use strict";
const E = window.DEMAIN;
const { SIGNS, PLANETS, PMAP, ASPECTS, ROMAN, JOURS, fmtLon, n360, sep } = E;
const BXL = { lat: 50.8503, lon: 4.3517 };
const D2R = Math.PI/180;

/* ----------------------- helpers de langue ------------------------ */
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cap = s => s.charAt(0).toUpperCase()+s.slice(1);
const deP = p => p.key==='sun'?'du ':p.key==='moon'?'de la ':'de ';
const leP = p => p.key==='sun'?'le ':p.key==='moon'?'la ':'';
const ordinal = n => n===1?'1re':n+'e';

/* ============================ TEXTES ============================== */
const SIGN_KW = [
  { man:"avec élan, hâte et combativité",        dom:"l'initiative" },
  { man:"avec constance, lenteur et ténacité",   dom:"la possession" },
  { man:"avec vivacité, curiosité et dualité",   dom:"l'échange" },
  { man:"avec sensibilité, prudence et mémoire", dom:"l'attachement" },
  { man:"avec éclat, fierté et générosité",      dom:"le rayonnement" },
  { man:"avec méthode, mesure et discernement",  dom:"l'analyse" },
  { man:"avec tact, équité et besoin d'accord",  dom:"la relation" },
  { man:"avec intensité, secret et passion",     dom:"la métamorphose" },
  { man:"avec ardeur, foi et goût du lointain",  dom:"l'élévation" },
  { man:"avec ambition, rigueur et patience",    dom:"la maîtrise" },
  { man:"avec indépendance, idéal et distance",  dom:"la réforme" },
  { man:"avec compassion, rêve et abandon",      dom:"la dissolution" },
];
const PLANET_KW = {
  sun:    { suj:"La volonté, la vitalité et le sens de l'honneur", v:"s'affirment",      corps:"le cœur, la vue, la force vitale" },
  moon:   { suj:"La sensibilité, les humeurs et la vie commune",   v:"se laissent porter",corps:"l'estomac, les liquides, l'enfance" },
  mercury:{ suj:"L'esprit, la parole et le négoce",               v:"s'exercent",        corps:"le souffle, les nerfs, les mains" },
  venus:  { suj:"L'amour, les plaisirs et le goût",               v:"se cherchent",      corps:"les reins, la gorge, la semence" },
  mars:   { suj:"Le désir, la colère et la force d'action",       v:"se déchaînent",     corps:"le sang, le fiel, les muscles" },
  jupiter:{ suj:"La foi, l'abondance et le jugement",             v:"se déploient",      corps:"le foie, la chair, la croissance" },
  saturn: { suj:"Le temps, la limite et la gravité",              v:"s'imposent",        corps:"les os, la rate, la peau, le froid" },
};
const HOUSE_MEAN = [
  null,
  { nom:"la Vie",        dom:"le corps, le tempérament et l'élan vital",          ang:'angulaire' },
  { nom:"les Biens",     dom:"l'argent, les ressources et ce qu'on acquiert",      ang:'succédent' },
  { nom:"la Fratrie",    dom:"les frères, les écrits, les courts voyages et la foi quotidienne", ang:'cadent' },
  { nom:"les Racines",   dom:"le foyer, les pères, la terre et la fin des choses",  ang:'angulaire' },
  { nom:"les Enfants",   dom:"les enfants, les plaisirs, la création et les jeux",  ang:'succédent' },
  { nom:"la Servitude",  dom:"le travail, la maladie, les subordonnés et les bêtes",ang:'cadent' },
  { nom:"l'Union",       dom:"le mariage, les associés et les adversaires déclarés",ang:'angulaire' },
  { nom:"la Mort",       dom:"les périls, les dettes, l'héritage et les choses cachées", ang:'succédent' },
  { nom:"le Voyage",     dom:"la religion, l'étranger, les hautes études et les songes", ang:'cadent' },
  { nom:"l'Honneur",     dom:"la charge, le renom, la carrière et l'autorité",      ang:'angulaire' },
  { nom:"les Amis",      dom:"les amis, les appuis, les espérances et les bienfaits",ang:'succédent' },
  { nom:"l'Épreuve",     dom:"les ennemis cachés, l'exil, le secret et le retrait", ang:'cadent' },
];
const DIG_TXT = {
  domicile:"chez lui, pleinement maître de ses effets", exaltation:"exalté, honoré et porté au plus haut de sa vertu",
  triplicité:"d'une force honnête, soutenu par sa triplicité", borne:"discrètement appuyé par sa borne", face:"à peine soutenu par sa face",
  exil:"en exil, contrarié et affaibli dans sa nature", chute:"en chute, abaissé et empêché d'agir selon son bien", pérégrin:"pérégrin, sans dignité ni appui, livré au hasard des rencontres",
};
const ASP_DEF = {
  conjonction:"Conjonction (0°) — les deux astres unis : leurs natures se mêlent et se renforcent.",
  sextile:"Sextile (60°) — aspect d'entente : une occasion favorable, qu'il faut saisir.",
  carré:"Carré (90°) — aspect de tension : obstacle, friction, épreuve qui force à agir.",
  trigone:"Trigone (120°) — aspect d'harmonie : faveur, facilité, accord donné sans effort.",
  opposition:"Opposition (180°) — face-à-face : polarité, mise en balance, tension à équilibrer.",
};
const POINT_DEF = {
  nodeN:"Tête du Dragon (nœud nord moyen de la Lune) — point d'accroissement, où les choses prennent et augmentent.",
  nodeS:"Queue du Dragon (nœud sud moyen) — point de déperdition, où les choses se relâchent et se dissipent.",
  fortune:"Part de Fortune — lot du corps, de la santé et de la fortune matérielle ; ce qui vient sans peine.",
  spirit:"Part de l'Esprit — lot de l'âme, de l'action volontaire, du métier et de la réputation.",
  eros:"Part de l'Amour — lot du désir, des attachements et de ce que l'on convoite.",
  necessity:"Part de Nécessité — lot des contraintes, des liens subis et de la fatalité.",
  victory:"Part de Victoire — lot de la réussite, de la foi et de ce qui élève.",
  courage:"Part du Courage — lot de l'audace, de la lutte et de la hardiesse.",
};
const TEMPER = {
  sanguin:{ nom:"Sanguin", q:"chaud et humide", el:"l'Air et le sang", t:"sociable, vif, optimiste, généreux, mais changeant et dispersé" },
  cholerique:{ nom:"Colérique", q:"chaud et sec", el:"le Feu et la bile jaune", t:"ardent, prompt, ambitieux, courageux, mais irritable et impatient" },
  melancolique:{ nom:"Mélancolique", q:"froid et sec", el:"la Terre et la bile noire", t:"profond, prudent, persévérant, fidèle, mais sombre et anxieux" },
  flegmatique:{ nom:"Flegmatique", q:"froid et humide", el:"l'Eau et le flegme", t:"calme, patient, imaginatif, tendre, mais nonchalant et timide" },
};
const SYSTEMS = [['whole','Signes entiers'],['porphyry','Porphyre'],['placidus','Placide'],['regiomontanus','Régiomontanus']];

/* ---------------------- délinéation (templates) ------------------ */
function planetInSign(p){
  const k=PLANET_KW[p.key], s=SIGN_KW[p.sign];
  return `${k.suj} ${k.v} ${s.man}. Dans ${SIGNS[p.sign].nom}, ${leP(p)}${p.nom} est ${DIG_TXT[p.dig.label]||'sans dignité notable'}.`;
}
function planetInHouse(p){
  const h=HOUSE_MEAN[p.house];
  return `Placé en ${ROMAN[p.house]}<sup>e</sup> maison (${h.nom}, ${h.ang}), il porte ses effets sur ${h.dom}.`;
}
function planetAccidents(p){
  const e=[];
  if (p.retro) e.push("rétrograde (replié sur lui-même, l'effet tardant à se manifester)");
  if (p.solar==='cazimi') e.push("au cœur du Soleil (cazimi), exalté comme un roi sur son trône");
  else if (p.solar==='combuste') e.push("combuste, brûlé et caché par le Soleil — gravement empêché");
  else if (p.solar==='sous les rayons') e.push("sous les rayons du Soleil, affaibli et peu visible");
  if (p.acc && p.acc.joie) e.push("dans sa joie, à l'aise dans cette maison");
  if (p.hayz) e.push("en hayz — dans sa secte, son hémisphère et son genre : au mieux de sa condition");
  else if (p.inSect) e.push("dans sa secte (de jour ou de nuit selon le thème)");
  if (p.oriental===true) e.push("oriental, se levant avant le Soleil");
  else if (p.oriental===false) e.push("occidental, se couchant après le Soleil");
  return e.length ? ' Il s\'y trouve '+e.join(' ; ')+'.' : '';
}

/* ============================ FIGURE ============================== */
function polar(cx,cy,r,deg){ const a=deg*D2R; return [cx+r*Math.cos(a), cy-r*Math.sin(a)]; }
function sAng(lon,asc){ return n360(180+(lon-asc)); }
const F = n => (Math.round(n*10)/10);

function planetBulle(p){
  return `${p.nom} — ${fmtLon(p.lon).txt}\n${cap(DIG_TXT[p.dig.label]||'pérégrin')}.${p.retro?' Rétrograde.':''}${p.solar?' '+cap(p.solar)+'.':''}\nMaison ${ROMAN[p.house]} — ${HOUSE_MEAN[p.house].dom}.\n(cliquer pour la délinéation)`;
}
function pointBulle(pt){ return POINT_DEF[pt.key] ? `${pt.nom} — ${fmtLon(pt.lon).txt}\n${POINT_DEF[pt.key]}` : `${pt.nom} — ${fmtLon(pt.lon).txt}`; }

function figSummary(chart){
  const a=fmtLon(chart.asc), m=fmtLon(chart.mc), sys=(SYSTEMS.find(s=>s[0]===chart.system)||[,'signes entiers'])[1];
  return `Figure du thème, ${chart.day?'diurne':'nocturne'}. Ascendant ${a.deg}° ${a.signNom}, Milieu du Ciel ${m.deg}° ${m.signNom}. Maisons : ${sys}. Sept astres ; détail complet dans les tableaux qui suivent.`;
}
function drawWheel(svg, chart){
  svg.setAttribute('viewBox','-24 -24 448 448');
  svg.setAttribute('role','img'); svg.setAttribute('aria-label', figSummary(chart));
  const cx=200, cy=200, asc=chart.asc, mc=chart.mc, cusps=chart.cusps;
  const Rout=196, Rz=164, Rcusp=164, Rpl=140, Rdeg=127, Rhouse=106, Rasp=94;
  let h='';
  h+=`<circle class="w-ring" cx="${cx}" cy="${cy}" r="${Rout}"/><circle class="w-ring" cx="${cx}" cy="${cy}" r="${Rz}"/><circle class="w-ring" cx="${cx}" cy="${cy}" r="${Rasp}"/>`;
  // bande zodiacale : 12 signes (30°), glyphes + ticks
  for(let s=0;s<12;s++){
    const a0=sAng(s*30,asc), c1=polar(cx,cy,Rz,a0), c2=polar(cx,cy,Rout,a0);
    h+=`<line class="w-zod" x1="${F(c1[0])}" y1="${F(c1[1])}" x2="${F(c2[0])}" y2="${F(c2[1])}"/>`;
    const gm=polar(cx,cy,(Rout+Rz)/2, sAng(s*30+15,asc));
    h+=`<text class="w-sign" data-bulle="${esc(SIGNS[s].nom+' — '+SIGNS[s].elem+', '+SIGNS[s].mode+', domicile '+PMAP[SIGNS[s].dom].nom)}" x="${F(gm[0])}" y="${F(gm[1]+5)}" text-anchor="middle">${SIGNS[s].g}</text>`;
  }
  for(let d=0;d<360;d+=2){ const a=sAng(d,asc), t1=polar(cx,cy,Rz,a), t2=polar(cx,cy,d%10===0?Rz-7:Rz-3.5,a);
    h+=`<line class="w-tick" x1="${F(t1[0])}" y1="${F(t1[1])}" x2="${F(t2[0])}" y2="${F(t2[1])}"/>`; }
  // cuspides de maison (réelles, selon le système) + numéros
  for(let i=0;i<12;i++){
    const a=sAng(cusps[i],asc), c1=polar(cx,cy,Rasp,a), c2=polar(cx,cy,Rz,a);
    const angle=[0,3,6,9].includes(i);
    h+=`<line class="${angle?'w-axis':'w-cusp'}" x1="${F(c1[0])}" y1="${F(c1[1])}" x2="${F(c2[0])}" y2="${F(c2[1])}"/>`;
    const mid=cusps[i]+n360(cusps[(i+1)%12]-cusps[i])/2;
    const hp=polar(cx,cy,Rhouse,sAng(mid,asc));
    h+=`<text class="w-house lien" tabindex="0" role="link" data-goto="maison-${i+1}" aria-label="${esc('Maison '+ROMAN[i+1]+' : '+HOUSE_MEAN[i+1].dom)}" data-bulle="${esc('Maison '+ROMAN[i+1]+' — '+HOUSE_MEAN[i+1].dom+'\\n(cliquer pour la lecture)')}" x="${F(hp[0])}" y="${F(hp[1]+3.5)}" text-anchor="middle">${ROMAN[i+1]}</text>`;
  }
  // étiquettes d'angles
  const lab=(t,lon,bul)=>{ const p=polar(cx,cy,Rout+13,sAng(lon,asc)); return `<text class="w-axislab" data-bulle="${esc(bul)}" x="${F(p[0])}" y="${F(p[1]+3)}" text-anchor="middle">${t}</text>`; };
  h+=lab('Asc',asc,`Ascendant ${fmtLon(asc).txt} — le corps, la vie, le tempérament.`)
    +lab('Desc',n360(asc+180),'Descendant — autrui, le conjoint, les associés.')
    +lab('MC',mc,`Milieu du Ciel ${fmtLon(mc).txt} — l'honneur, la charge, le renom.`)
    +lab('FC',n360(mc+180),'Fond du Ciel — le foyer, les racines, la fin des choses.');
  // étoiles fixes conjointes (petits repères sur le pourtour)
  chart.stars.forEach(s=>{ const a=sAng(s.starLon,asc), p1=polar(cx,cy,Rout,a), p2=polar(cx,cy,Rout+5,a);
    h+=`<line class="w-star" data-bulle="${esc('★ '+s.star.nom+' ('+s.star.nat+') — '+s.star.note)}" x1="${F(p1[0])}" y1="${F(p1[1])}" x2="${F(p2[0])}" y2="${F(p2[1])}"/>`; });
  // aspects
  chart.aspects.forEach(a=>{
    const p1=polar(cx,cy,Rasp,sAng(a.a.lon,asc)), p2=polar(cx,cy,Rasp,sAng(a.b.lon,asc));
    const cl=a.fam==='harmon'?'w-asp-h':a.fam==='tendu'?'w-asp-t':'w-asp-n';
    const bul=`${a.a.nom} ${a.asp.nom} ${a.b.nom}\n${ASP_DEF[a.asp.nom]}\n${a.applying?'Appliquant (se forme)':'Séparant (se défait)'} · orbe ${a.orb.toFixed(1)}°${a.partile?' · PARTILE':''}`;
    h+=`<line class="w-asp ${cl}" x1="${F(p1[0])}" y1="${F(p1[1])}" x2="${F(p2[0])}" y2="${F(p2[1])}"/>`;
    h+=`<line class="w-hit" data-bulle="${esc(bul)}" x1="${F(p1[0])}" y1="${F(p1[1])}" x2="${F(p2[0])}" y2="${F(p2[1])}"/>`;
    const mx=(p1[0]+p2[0])/2, my=(p1[1]+p2[1])/2;
    h+=`<circle class="w-aspbg" cx="${F(mx)}" cy="${F(my)}" r="6.5"/><text class="w-aspg ${cl}" data-bulle="${esc(bul)}" x="${F(mx)}" y="${F(my+3.2)}" text-anchor="middle">${a.asp.g}</text>`;
  });
  // astres + points (déclusterisés)
  const bodies=chart.planets.map(p=>({src:p,type:'pl',g:p.g,lon:p.lon,retro:p.retro,deg:Math.floor(p.deg),key:p.key}))
    .concat(chart.points.map(pt=>({src:pt,type:'pt',g:pt.g,lon:pt.lon,retro:false,deg:Math.floor(pt.deg),key:pt.key})));
  const items=bodies.map(b=>({...b,ang:sAng(b.lon,asc)})).sort((x,y)=>x.ang-y.ang);
  for(let i=1;i<items.length;i++) if(items[i].ang-items[i-1].ang<8) items[i].ang=items[i-1].ang+8;
  items.forEach(o=>{
    const ta=sAng(o.lon,asc), ga=o.ang;
    const s1=polar(cx,cy,Rz,ta), s2=polar(cx,cy,Rpl+7,ga);
    h+=`<line class="w-stem" x1="${F(s1[0])}" y1="${F(s1[1])}" x2="${F(s2[0])}" y2="${F(s2[1])}"/>`;
    const dot=polar(cx,cy,Rz,ta); h+=`<circle class="w-dot" cx="${F(dot[0])}" cy="${F(dot[1])}" r="1.4"/>`;
    const gp=polar(cx,cy,Rpl,ga);
    const bul=o.type==='pl'?planetBulle(o.src):pointBulle(o.src);
    const cls=o.type==='pt'?'w-pt':('w-pl'+(o.retro?' retro':''));
    const goto=o.type==='pl'?` data-goto="astre-${o.key}" role="link"`:' role="img"';
    h+=`<text class="${cls} lien" tabindex="0"${goto} aria-label="${esc(o.src.nom+' '+fmtLon(o.lon).txt)}" data-bulle="${esc(bul)}" x="${F(gp[0])}" y="${F(gp[1]+6)}" text-anchor="middle">${o.g}</text>`;
    const dp=polar(cx,cy,Rdeg,ga);
    h+=`<text class="w-deg" x="${F(dp[0])}" y="${F(dp[1]+3)}" text-anchor="middle">${o.deg}°${o.retro?'℞':''}</text>`;
  });
  h+=`<circle class="w-hub" cx="${cx}" cy="${cy}" r="2"/>`;
  svg.innerHTML=h;
}

function drawSquare(svg, chart){
  svg.setAttribute('viewBox','0 0 400 400');
  svg.setAttribute('role','img'); svg.setAttribute('aria-label', figSummary(chart));
  const S=400,M=200,Q=100,T=300;
  const P={A:[0,0],B:[S,0],C:[S,S],D:[0,S],T:[M,0],R:[S,M],Bo:[M,S],L:[0,M],O:[M,M],p1:[Q,Q],p2:[T,Q],p3:[T,T],p4:[Q,T]};
  const CELLS={1:['L','p1','O','p4'],2:['D','L','p4'],3:['D','Bo','p4'],4:['Bo','p4','O','p3'],5:['C','Bo','p3'],6:['C','R','p3'],7:['R','p2','O','p3'],8:['B','R','p2'],9:['B','T','p2'],10:['T','p2','O','p1'],11:['A','T','p1'],12:['A','L','p1']};
  const angular=new Set([1,4,7,10]);
  const byH={}; for(let i=1;i<=12;i++) byH[i]=[];
  chart.planets.forEach(p=>byH[p.house].push(p)); chart.points.forEach(p=>byH[p.house].push(p));
  let html=`<rect class="bord" x="2" y="2" width="${S-4}" height="${S-4}"/><polygon class="filet" points="${P.T} ${P.R} ${P.Bo} ${P.L}"/><line class="filet" x1="0" y1="0" x2="${S}" y2="${S}"/><line class="filet" x1="${S}" y1="0" x2="0" y2="${S}"/>`;
  for(let hh=1;hh<=12;hh++){
    const pts=CELLS[hh].map(k=>P[k]); const cx=pts.reduce((s,p)=>s+p[0],0)/pts.length, cy=pts.reduce((s,p)=>s+p[1],0)/pts.length;
    const signIdx=((chart.ascSign+hh-1)%12+12)%12;
    html+=`<polygon class="cell${angular.has(hh)?' angul':''}" points="${pts.map(p=>p.join(',')).join(' ')}"/>`;
    html+=`<text class="num lien" tabindex="0" role="link" data-goto="maison-${hh}" aria-label="${esc('Maison '+ROMAN[hh]+' : '+HOUSE_MEAN[hh].dom)}" x="${cx}" y="${cy-16}" text-anchor="middle">${ROMAN[hh]}</text>`;
    html+=`<text class="sg" x="${cx}" y="${cy-2}" text-anchor="middle">${SIGNS[signIdx].g}</text>`;
    byH[hh].forEach((p,i)=>{ const cols=byH[hh].length>2?2:1,col=i%cols,row=Math.floor(i/cols);
      const x=cx+(cols>1?(col?14:-14):0), y=cy+16+row*15;
      const goto=p.body?` data-goto="astre-${p.key}" role="link"`:' role="img"'; const bul=p.body?planetBulle(p):pointBulle(p);
      html+=`<text class="pl${p.retro?' retro':''} lien" tabindex="0"${goto} aria-label="${esc(p.nom+' '+fmtLon(p.lon).txt)}" data-bulle="${esc(bul)}" x="${x}" y="${y}" text-anchor="middle">${p.g}</text>`; });
  }
  html+=`<text class="axe" x="6" y="${M-4}">ASC</text><text class="axe" x="${M}" y="14" text-anchor="middle">MC</text>`;
  svg.innerHTML=html;
}
function drawFigure(svg, chart, mode){ mode==='carre'?drawSquare(svg,chart):drawWheel(svg,chart); }

/* ============================ PANNEAUX ============================ */
function digBadges(p){
  const d=p.dig, b=[];
  if(d.domicile)b.push('<b class="dg dom">domicile</b>'); if(d.exaltation)b.push('<b class="dg exa">exaltation</b>');
  if(d.detriment)b.push('<b class="dg det">exil</b>'); if(d.fall)b.push('<b class="dg chu">chute</b>');
  if(d.triplicity)b.push('<span class="dg tri">tripl.</span>'); if(d.bound)b.push('<span class="dg min">borne</span>');
  if(d.face)b.push('<span class="dg min">face</span>'); if(d.peregrine)b.push('<span class="dg per">pérégrin</span>');
  return b.join(' ')||'—';
}
function etat(p){ const e=[]; if(p.retro)e.push('<span class="r">℞</span>'); if(p.solar)e.push(p.solar);
  if(p.acc&&p.acc.joie)e.push('joie'); if(p.hayz)e.push('hayz'); else if(p.inSect)e.push('secte'); return e.join(' · ')||'—'; }

function panelPositions(chart){
  let r=`<table class="grid"><caption>Positions & dignités</caption><tr><th>Astre</th><th>Position</th><th>V°/j</th><th>M.</th><th>Dignités</th><th>Sc.</th><th>État</th></tr>`;
  chart.planets.forEach(p=>{ const f=fmtLon(p.lon);
    r+=`<tr><td><a class="lien" href="#astre-${p.key}" data-goto="astre-${p.key}"><span class="g">${p.g}</span> ${p.nom}</a></td>`
      +`<td class="pos" data-bulle="${esc(planetBulle(p))}">${f.deg}°${String(f.min).padStart(2,'0')}′ <span class="g">${f.signG}</span></td>`
      +`<td class="num2">${p.speed.toFixed(2)}</td><td>${ROMAN[p.house]}</td><td>${digBadges(p)}</td>`
      +`<td class="num2 ${p.dig.score<0?'neg':p.dig.score>0?'pos':''}">${p.dig.score>0?'+':''}${p.dig.score}</td><td class="st">${etat(p)}</td></tr>`; });
  chart.points.forEach(pt=>{ const f=fmtLon(pt.lon);
    r+=`<tr class="pt"><td data-bulle="${esc(pointBulle(pt))}"><span class="g">${pt.g}</span> ${pt.nom}</td><td class="pos">${f.deg}°${String(f.min).padStart(2,'0')}′ <span class="g">${f.signG}</span></td><td>—</td><td>${ROMAN[pt.house]}</td><td>—</td><td>—</td><td>—</td></tr>`; });
  const fa=fmtLon(chart.asc), fm=fmtLon(chart.mc);
  r+=`<tr class="ang"><td>⊕ Ascendant</td><td class="pos">${fa.deg}°${String(fa.min).padStart(2,'0')}′ <span class="g">${fa.signG}</span></td><td>—</td><td>I</td><td>—</td><td>—</td><td>—</td></tr>`;
  r+=`<tr class="ang"><td>⊗ Milieu du Ciel</td><td class="pos">${fm.deg}°${String(fm.min).padStart(2,'0')}′ <span class="g">${fm.signG}</span></td><td>—</td><td>X</td><td>—</td><td>—</td><td>—</td></tr></table>`;
  return r;
}

function panelDignities(chart){
  // grille des dignités essentielles par signe
  let r=`<table class="grid digrid"><caption>Table des dignités essentielles</caption><tr><th>Signe</th><th>Domicile</th><th>Exalt.</th><th>Tripl. (J/N)</th><th>Bornes (égyptiennes)</th><th>Faces</th></tr>`;
  for(let s=0;s<12;s++){
    const ex=Object.keys(E.EXALT).find(k=>E.EXALT[k].s===s);
    const tri=E.TRIPL[SIGNS[s].elem];
    const bnd=E.BOUNDS[s].map(([k,u])=>`${PMAP[k].g}${u}`).join(' ');
    const fc=[0,1,2].map(i=>PMAP[E.FACE_ORDER[(s*3+i)%7]].g).join(' ');
    r+=`<tr><td><span class="g">${SIGNS[s].g}</span> ${SIGNS[s].nom}</td><td class="g">${PMAP[SIGNS[s].dom].g}</td>`
      +`<td class="g">${ex?PMAP[ex].g+E.EXALT[ex].d+'°':'—'}</td><td class="g">${PMAP[tri[0]].g}/${PMAP[tri[1]].g}</td><td class="g sm">${bnd}</td><td class="g">${fc}</td></tr>`;
  }
  r+=`</table>`;
  return r;
}

function panelAspectarian(chart){
  const P=chart.planets;
  const cell=(i,j)=>{ if(i===j) return `<td class="diag g">${P[i].g}</td>`;
    const a=chart.aspects.find(x=>(x.a.key===P[i].key&&x.b.key===P[j].key)||(x.a.key===P[j].key&&x.b.key===P[i].key));
    if(!a) return `<td></td>`;
    const cl=a.fam==='harmon'?'asp-h':a.fam==='tendu'?'asp-t':'asp-n';
    return `<td class="aspc ${cl}" data-bulle="${esc(a.a.nom+' '+a.asp.nom+' '+a.b.nom+'\\n'+ASP_DEF[a.asp.nom]+'\\norbe '+a.orb.toFixed(1)+'°'+(a.applying?' · appliquant':' · séparant'))}"><span class="g">${a.asp.g}</span><small>${a.orb.toFixed(0)}°</small></td>`; };
  let r=`<table class="grid aspgrid"><caption>Aspectarium</caption>`;
  for(let i=0;i<P.length;i++){ r+='<tr>'; for(let j=0;j<=i;j++) r+=cell(i,j); r+='</tr>'; }
  r+=`</table>`;
  // liste détaillée
  r+=`<ul class="liste">`;
  chart.aspects.forEach(a=>{ const cl=a.fam==='harmon'?'asp-h':a.fam==='tendu'?'asp-t':'asp-n';
    r+=`<li><span class="g">${a.a.g} ${a.asp.g} ${a.b.g}</span> <b>${a.a.nom} ${a.asp.nom} ${a.b.nom}</b> <span class="${cl}">(${a.applying?'appliquant':'séparant'}, orbe ${a.orb.toFixed(1)}°${a.partile?', partile':''})</span></li>`; });
  if(chart.receptions.length){ r+=`<li class="rec"><b>Réceptions mutuelles :</b> ${chart.receptions.map(x=>`${x.a.nom} (${x.kindA}) ↔ ${x.b.nom} (${x.kindB}) <span class="${x.strong?'asp-h':'asp-n'}">[${x.strong?'forte':'faible'}]</span>`).join(' ; ')}</li>`; }
  r+=`</ul>`;
  if(chart.angleAspects && chart.angleAspects.length){
    r+=`<h4>Aspects aux angles et à la Part de Fortune</h4><ul class="liste">`;
    chart.angleAspects.forEach(a=>{ const cl=a.asp.fam==='harmon'?'asp-h':a.asp.fam==='tendu'?'asp-t':'asp-n';
      r+=`<li><span class="g">${a.a.g} ${a.asp.g}</span> <b>${a.a.nom}</b> ${a.asp.nom} <b>${a.b.nom}</b> <span class="${cl}">(orbe ${a.orb.toFixed(1)}°)</span></li>`; });
    r+=`</ul>`;
  }
  return r;
}

function panelHouses(chart){
  // interprétation MAISON PAR MAISON
  const byH={}; for(let i=1;i<=12;i++) byH[i]=[];
  chart.planets.forEach(p=>byH[p.house].push(p));
  let r = chart.degraded ? `<p class="notice">⚠ Aux latitudes circumpolaires, les systèmes à quadrants (Porphyre, Placide, Régiomontanus) sont indéfinis : repli honnête sur les <b>signes entiers</b>.</p>` : '';
  for(let hh=1;hh<=12;hh++){
    const hm=HOUSE_MEAN[hh];
    // signe sur la cuspide + maître de la maison
    const cuspLon=chart.cusps[hh-1], cuspSign=Math.floor(cuspLon/30);
    const lordKey=SIGNS[cuspSign].dom, lord=chart.planets.find(p=>p.key===lordKey);
    const occ=byH[hh];
    r+=`<div class="maison" id="maison-${hh}"><h4><span class="mnum">${ROMAN[hh]}</span> ${hm.nom} <small>· ${hm.ang}</small></h4>`;
    r+=`<p class="mdom">${cap(hm.dom)}.</p>`;
    r+=`<p><b>${fmtLon(cuspLon).deg}° ${SIGNS[cuspSign].nom}</b> ${chart.quadrant?'à la cuspide':'occupe la maison'} ; son maître ${leP(lord)}<b>${lord.nom}</b> est en ${fmtLon(lord.lon).deg}° ${SIGNS[lord.sign].nom} (${lord.dig.label}), maison ${ROMAN[lord.house]} — c'est par lui que se conduisent ces affaires.</p>`;
    if(occ.length){
      r+=`<p class="occ">Y séjourne${occ.length>1?'nt':''} : `+occ.map(p=>`<a class="lien" href="#astre-${p.key}" data-goto="astre-${p.key}"><span class="g">${p.g}</span> ${p.nom}</a> (${p.dig.label})`).join(', ')+`.</p>`;
      occ.forEach(p=>{ r+=`<p class="occ-d"><span class="g">${p.g}</span> ${planetInHouse(p)}</p>`; });
    } else {
      r+=`<p class="vide">Aucun astre n'y séjourne : la maison s'exprime surtout par son maître.</p>`;
    }
    r+=`</div>`;
  }
  return r;
}

function panelPlanets(chart){
  // délinéation ASTRE PAR ASTRE (cible des liens internes)
  let r='';
  chart.planets.forEach(p=>{
    const asps=chart.aspects.filter(a=>a.a.key===p.key||a.b.key===p.key);
    r+=`<div class="astre" id="astre-${p.key}"><h4><span class="g big">${p.g}</span> ${p.nom} en ${fmtLon(p.lon).deg}° ${SIGNS[p.sign].nom}, maison ${ROMAN[p.house]}${p.retro?' ℞':''}</h4>`;
    r+=`<p>${planetInSign(p)} ${planetInHouse(p)}${planetAccidents(p)}</p>`;
    if(asps.length){
      r+=`<p class="asp-line">Aspects : `+asps.map(a=>{ const o=a.a.key===p.key?a.b:a.a; const cl=a.fam==='harmon'?'asp-h':a.fam==='tendu'?'asp-t':'asp-n';
        return `<span class="${cl}"><span class="g">${a.asp.g}</span> ${o.nom}</span>`; }).join(', ')+`.</p>`;
    }
    r+=`<p class="corps"><small>Gouverne dans le corps : ${PLANET_KW[p.key].corps}.</small></p></div>`;
  });
  return r;
}

function panelLots(chart){
  let r=`<table class="grid"><caption>Lots herméniques & nœuds</caption><tr><th>Point</th><th>Position</th><th>Maison</th><th>Sens</th></tr>`;
  chart.points.forEach(pt=>{ const f=fmtLon(pt.lon);
    r+=`<tr><td><span class="g">${pt.g}</span> ${pt.nom}</td><td class="pos">${f.deg}°${String(f.min).padStart(2,'0')}′ <span class="g">${f.signG}</span></td><td>${ROMAN[pt.house]}</td><td class="sens">${esc((POINT_DEF[pt.key]||'').split('—').slice(1).join('—').trim())}</td></tr>`; });
  r+=`</table>`;
  // Lots traditionnels supplémentaires (formules transparentes)
  const ml=E.moreLots(chart);
  r+=`<table class="grid" style="margin-top:10px"><caption>Lots traditionnels</caption><tr><th>Lot</th><th>Position</th><th>Maison</th><th>Formule</th></tr>`;
  ml.forEach(l=>{ const f=fmtLon(l.lon), h=((f.sign-chart.ascSign)%12+12)%12+1;
    r+=`<tr><td><span class="g">${l.g}</span> ${l.nom}</td><td class="pos">${f.deg}°${String(f.min).padStart(2,'0')}′ <span class="g">${f.signG}</span></td><td>${ROMAN[h]}</td><td class="sm">${l.formule}</td></tr>`; });
  return r+`</table>`;
}

function panelStars(chart){
  let r='';
  if(!chart.stars.length) r+=`<p class="vide">Aucune étoile fixe majeure conjointe (orbe 1,5°) à un astre ou à un angle.</p>`;
  else { r+=`<h4>Conjonctions zodiacales</h4><ul class="liste">`;
    chart.stars.forEach(s=> r+=`<li><b>★ ${s.star.nom}</b> <small>(${s.star.nat}, ${s.star.note})</small> — conjointe à <b>${s.body.nom}</b>, orbe ${s.orb.toFixed(2)}°.</li>`);
    r+=`</ul>`; }
  // Parans (méthode Brady) — uniquement pour un thème avec lieu (natal)
  if(chart.lat!=null){ const pa=E.parans(chart, 1.5);
    r+=`<h4>Parans <small>· co-angularité au lieu et au jour (Brady, v1)</small></h4>`;
    if(!pa.length) r+=`<p class="vide">Aucun paran serré (orbe 1,5°).</p>`;
    else { r+=`<ul class="liste">`; pa.slice(0,12).forEach(p=>r+=`<li><span class="g">${p.planet.g}</span> <b>${p.planet.nom}</b> (${ANGLE_FR[p.angleP]}) ✶ <b>${p.star.nom}</b> (${ANGLE_FR[p.angleS]}) <span class="sm">orbe ${p.orb.toFixed(2)}°</span></li>`); r+=`</ul>`;
      r+=`<p class="sm">Le paran relie une planète et une étoile touchant chacune un angle (Orient, Couchant, Milieu du Ciel, Fond du Ciel) — l'usage le plus ancien des étoiles. Positions de l'instant natal.</p>`; } }
  // Demeure lunaire
  r+=`<h4>Demeure lunaire</h4><p>${chart.mansion.index+1}<sup>e</sup> demeure — <i>${chart.mansion.nom}</i> (sur 28).</p>`;
  return r;
}
const ANGLE_FR={ ASC:'Orient', DESC:'Couchant', MC:'Milieu du Ciel', IC:'Fond du Ciel' };

function panelTemperament(chart){
  const t=chart.temperament;
  let r=`<div class="temper">`;
  ['sanguin','cholerique','melancolique','flegmatique'].forEach(k=>{
    const def=TEMPER[k], pct=t.pct[k];
    r+=`<div class="thum" data-bulle="${esc(def.nom+' ('+def.q+') — '+def.el+'. '+def.t)}"><div class="tlab">${def.nom} <small>${def.q}</small></div><div class="tbar"><i class="t-${k}" style="width:${pct}%"></i></div><div class="tpct">${pct}%</div></div>`;
  });
  r+=`</div><p class="tsyn">Complexion dominante : <b>${TEMPER[t.dominant].nom}</b> (${TEMPER[t.dominant].q}), teintée de <b>${TEMPER[t.second].nom.toLowerCase()}</b> — ${TEMPER[t.dominant].t}.</p>`;
  return r;
}

function panelMoon(chart){
  const ph=chart.phase, app=chart.app;
  let r=`<ul class="liste">`;
  r+=`<li><b>Phase :</b> ${ph.nom}, ${ph.illum}% de lumière (${ph.waxing?'croissante — temps d\'entreprendre':'décroissante — temps de conclure'}).</li>`;
  r+=`<li><b>Demeure lunaire :</b> ${chart.mansion.index+1}<sup>e</sup> — <i>${chart.mansion.nom}</i> (sur 28).</li>`;
  if(app) r+=`<li><b>Application :</b> ${app.asp.nom} ${deP(app.planet)}${app.planet.nom}, exact dans ${app.hours<24?app.hours.toFixed(1)+' h':(app.hours/24).toFixed(1)+' j'}.</li>`;
  r+=`<li><b>Course :</b> ${chart.voc?'<span class="asp-t">vide</span> — la Lune ne perfectionne plus d\'aspect avant de changer de signe.':'la Lune perfectionne encore des aspects dans son signe.'}</li>`;
  return r+`</ul>`;
}

/* -------------------------- Jugement ----------------------------- */
function tendance(chart){
  let sc=0;
  chart.planets.forEach(p=>{ const e=p.dig.score; if(p.nature==='benef')sc+=1+e*0.3; if(p.nature==='malef')sc-=1-e*0.25;
    if(p.retro)sc-=0.5; if(p.solar==='combuste')sc-=1; });
  sc+=chart.phase.waxing?1:-0.6;
  chart.aspects.filter(a=>a.applying).forEach(a=>{ sc+=a.fam==='harmon'?1:a.fam==='tendu'?-1:0; });
  if(sc>=2.2)return{t:'Favorable',cl:'t-fav'}; if(sc<=-2.2)return{t:'Tendu',cl:'t-tendu'};
  if(sc>-0.8&&sc<0.8)return{t:'Indécis',cl:'t-neutre'}; return{t:'Contrasté',cl:'t-cont'};
}
const VERDICT={
  Favorable:"Le ciel penche du bon côté : heure propice aux démarches mesurées, aux accords et aux semailles. Les milieux d'affaires y trouveront un terrain ferme, pourvu qu'on n'outrepasse point la mesure.",
  Contrasté:"Climat mêlé, où le meilleur côtoie l'embarras : on avancera sur ce qui est mûr et l'on ajournera ce qui exige l'unanimité. Prudence dans les engagements financiers hâtifs.",
  Tendu:"Heure de friction : les entreprises pressées rencontreront l'obstacle. On se gardera des coups de tête, des paroles vives et des paris ; mieux vaut tenir que promettre.",
  Indécis:"Le firmament demeure en balance : journée d'attente, où l'on observe avant d'agir et où nulle décision ne s'impose d'elle-même.",
};
function judgmentCiel(chart, hour){
  const sun=chart.planets.find(p=>p.key==='sun'), moon=chart.planets.find(p=>p.key==='moon');
  const dom=chart.planets.slice().sort((a,b)=>(b.dig.score+b.acc.score)-(a.dig.score+a.acc.score))[0];
  const td=tendance(chart);
  let h=`<p class="chapeau">Le ciel se lève sur Bruxelles à l'Ascendant <b>${fmtLon(chart.asc).deg}° ${SIGNS[fmtLon(chart.asc).sign].nom}</b>, sous la garde ${deP(hour.ruler)}<b>${hour.ruler.nom}</b>, maître de la ${hour.num}<sup>e</sup> heure ${hour.isDay?'du jour':'de la nuit'}, en ce ${JOURS[hour.weekday]} ${deP(hour.dayRuler)}<b>${hour.dayRuler.nom}</b>.</p>`;
  h+=`<p>Le <b>Soleil</b> chemine par ${fmtLon(sun.lon).deg}° ${SIGNS[sun.sign].nom} (${sun.dig.label}), faisant le thème <b>${chart.day?'diurne':'nocturne'}</b>. La <b>Lune</b>, ${fmtLon(moon.lon).deg}° ${SIGNS[moon.sign].nom}, <b>${chart.phase.nom.toLowerCase()}</b> (${chart.phase.illum}%), traverse la demeure d'<i>${chart.mansion.nom}</i>. ${chart.app?`Elle applique au <b>${chart.app.asp.nom} ${deP(chart.app.planet)}${chart.app.planet.nom}</b> (dans ${chart.app.hours.toFixed(1)} h).`:'Sa course est vide.'}</p>`;
  h+=`<p><b>Maître du moment :</b> ${dom.nom}, ${dom.dig.label}, ${E.angularType(dom.house)} — il donne le ton de l'heure. <b>Almutén du ciel :</b> ${PMAP[chart.almuten.planet].nom}.</p>`;
  h+=`<div class="verdict"><span class="tendance ${td.cl}">${td.t}</span> &nbsp;<b>—</b> ${VERDICT[td.t]}</div>`;
  return h;
}
function judgmentNatal(chart, lieu, dateUTC, tz){
  const sun=chart.planets.find(p=>p.key==='sun'), moon=chart.planets.find(p=>p.key==='moon');
  const ascRuler=chart.planets.find(p=>p.key===SIGNS[chart.ascSign].dom);
  const sect=chart.day?sun:moon; const t=chart.temperament;
  let h=`<p class="chapeau">Né le <b>${fmtDate(dateUTC,tz)}</b> à <b>${fmtTime(dateUTC,tz)}</b>, à <b>${esc(lieu)}</b>. Le signe <b>${SIGNS[chart.ascSign].nom}</b> se levait (Ascendant ${fmtLon(chart.asc).deg}°${String(fmtLon(chart.asc).min).padStart(2,'0')}′), marquant le tempérament.</p>`;
  h+=`<p><b>Complexion :</b> ${TEMPER[t.dominant].nom.toLowerCase()} (${TEMPER[t.dominant].q}), de second ${TEMPER[t.second].nom.toLowerCase()} — ${TEMPER[t.dominant].t}.</p>`;
  h+=`<p><b>Secte :</b> thème ${chart.day?'diurne':'nocturne'} ; le luminaire de la secte est ${leP(sect)}<b>${sect.nom}</b>, guide premier. <b>Maître de l'ascendant :</b> ${leP(ascRuler)}<b>${ascRuler.nom}</b> en ${SIGNS[ascRuler.sign].nom} (${ascRuler.dig.label}), maison ${ROMAN[ascRuler.house]}. <b>Almutén de la géniture :</b> ${PMAP[chart.almuten.planet].nom} (score ${chart.almuten.score}).</p>`;
  h+=`<p>Le <b>Soleil</b> en ${SIGNS[sun.sign].nom} (maison ${ROMAN[sun.house]}) figure l'esprit et le but ; la <b>Lune</b> en ${SIGNS[moon.sign].nom} (maison ${ROMAN[moon.house]}), le corps et les humeurs. Voir le détail astre par astre et maison par maison ci-dessous.</p>`;
  return h;
}
function judgmentTransits(natal, now){
  const targets=natal.planets.map(p=>({key:p.key,nom:p.nom,g:p.g,lon:p.lon})).concat([{key:'asc',nom:'Ascendant',g:'Asc',lon:natal.asc},{key:'mc',nom:'MC',g:'MC',lon:natal.mc}]);
  const res=[];
  now.planets.forEach(tp=>targets.forEach(np=>{ const d=sep(tp.lon,np.lon);
    for(const asp of ASPECTS){ const orb=(tp.key==='sun'||tp.key==='moon')?2.4:1.6; if(Math.abs(d-asp.deg)<=orb){ res.push({tp,np,asp,orb:Math.abs(d-asp.deg),fam:asp.fam==='neutre'?'neutre':asp.fam}); break; } } }));
  res.sort((a,b)=>a.orb-b.orb);
  let h=`<p>Au regard de l'heure présente (${fmtTime(now.date)}, Bruxelles), les astres errants forment au thème natal :</p>`;
  if(!res.length) return h+`<p class="vide">Nul transit serré : le ciel laisse le thème en repos.</p>`;
  h+=`<ul class="liste">`;
  res.slice(0,8).forEach(t=>{ const cl=t.fam==='harmon'?'asp-h':t.fam==='tendu'?'asp-t':'asp-n'; const v=t.fam==='harmon'?'soutient':t.fam==='tendu'?'éprouve':'active';
    h+=`<li><span class="g">${t.tp.g} ${t.asp.g}</span> <b>${t.tp.nom}</b> ${t.asp.nom} <b>${t.np.nom}</b> natal <span class="${cl}">(${v}, orbe ${t.orb.toFixed(1)}°)</span></li>`; });
  return h+`</ul>`;
}

function panelGlossary(){
  let r=`<div class="gloss">`;
  r+=`<h4>Aspects</h4><ul class="liste">`+ASPECTS.map(a=>`<li><span class="g">${a.g}</span> <b>${cap(a.nom)}</b> — ${ASP_DEF[a.nom].split('—')[1].trim()}</li>`).join('')+`</ul>`;
  r+=`<h4>Dignités essentielles</h4><p class="sm">Domicile (+5), exaltation (+4), triplicité (+3), borne (+2), face (+1) ; exil (−5), chute (−4). L'<b>almutén</b> d'un degré est l'astre qui y cumule le plus de dignité.</p>`;
  r+=`<h4>Secte & hayz</h4><p class="sm">Le thème est diurne si le Soleil est sur l'horizon. Les astres de jour (Soleil, Jupiter, Saturne) s'y trouvent à l'aise ; ceux de nuit (Lune, Vénus, Mars) la nuit. Le <b>hayz</b> ajoute l'accord de l'hémisphère et du genre du signe.</p>`;
  r+=`<h4>Lots</h4><p class="sm">Points calculés par report d'un arc depuis l'Ascendant (formule inversée de nuit). La <b>Part de Fortune</b> regarde le corps et les biens ; la <b>Part de l'Esprit</b>, l'âme et l'action.</p>`;
  r+=`<h4>Combustion</h4><p class="sm">Astre à moins de 8°½ du Soleil : <b>combuste</b> (brûlé, empêché) ; à moins de 17′ : <b>cazimi</b> (au cœur, fortifié) ; à moins de 15° : <b>sous les rayons</b>.</p>`;
  return r+`</div>`;
}

/* --------- Dominantes & balances, configurations, prévisions ----- */
const FIRNAME={nodeN:'Tête du Dragon', nodeS:'Queue du Dragon'}, FIRG={nodeN:'☊', nodeS:'☋'};
const firNom=k=>PMAP[k]?PMAP[k].nom:(FIRNAME[k]||k), firG=k=>PMAP[k]?PMAP[k].g:(FIRG[k]||'•');
const ELEMCOL={Feu:'var(--rouge)',Terre:'var(--vert)',Air:'var(--or)',Eau:'var(--bleu)'};

function panelDominants(chart){
  const dom=E.dominants(chart), bal=E.balances(chart);
  let r=`<h4>Dominantes planétaires</h4><p class="sm">Activité de chaque astre (angularité, dignités, aspects aux luminaires et au maître d'ascendant, maîtrise d'amas).</p><div class="temper">`;
  dom.forEach(d=> r+=`<div class="thum"><div class="tlab"><span class="g">${d.g}</span> ${d.nom}</div><div class="tbar"><i style="width:${d.pct}%;background:var(--or)"></i></div><div class="tpct">${d.pct}%</div></div>`);
  r+=`</div><p class="tsyn">Trio dominant : <b>${dom.slice(0,3).map(d=>d.nom).join(', ')}</b>.</p>`;
  const barRow=(lab,key,pct,col)=>`<div class="thum"><div class="tlab">${lab}</div><div class="tbar"><i style="width:${pct}%;background:${col}"></i></div><div class="tpct">${pct}%</div></div>`;
  r+=`<h4>Éléments <small>· dominant ${bal.elemDom}</small></h4><div class="temper">`+['Feu','Terre','Air','Eau'].map(e=>barRow(e,e,bal.elemPct[e],ELEMCOL[e])).join('')+`</div>`;
  r+=`<h4>Modes <small>· dominant ${bal.modeDom}</small></h4><div class="temper">`+['Cardinal','Fixe','Mutable'].map(m=>barRow(m,m,bal.modePct[m],'var(--enc2)')).join('')+`</div>`;
  r+=`<p><b>Hémisphères :</b> ${bal.above} astre(s) au-dessus de l'horizon, ${bal.below} en dessous ; ${bal.east} à l'orient, ${bal.west} à l'occident — ${bal.above>bal.below?'vie tournée vers le dehors et le manifeste':'vie plus intérieure et réfléchie'}.</p>`;
  return r;
}

function panelConfigurations(chart){
  const cfg=E.configurations(chart);
  if(!cfg.length) return `<p class="vide">Aucune configuration majeure (grand trigone, T-carré, grande croix, amas) entre les sept astres.</p>`;
  let r=`<ul class="liste">`;
  cfg.forEach(x=>{ const g=x.keys.map(k=>`<span class="g">${PMAP[k].g}</span>`).join(' '); let d='';
    if(x.type==='Grand trigone') d=`harmonie circulaire en signes ${x.elem.toLowerCase()} — don, facilité, équilibre qui se suffit`;
    else if(x.type==='T-carré') d=`tension focalisée sur <b><span class="g">${PMAP[x.apex].g}</span> ${PMAP[x.apex].nom}</b> (sommet) — moteur d'action sous contrainte`;
    else if(x.type==='Grande croix') d=`quadruple tension en croix — grande énergie à canaliser, écartèlement entre quatre exigences`;
    else if(x.type==='Amas') d=`concentration de ${x.keys.length} astres en <b>${SIGNS[x.sign].nom}</b> — domaine de vie fortement accentué`;
    r+=`<li><b>${x.type}</b> : ${g} — ${d}.</li>`; });
  return r+`</ul>`;
}

function panelPrevisions(chart, extra){
  const birth=extra.dateUTC, at=new Date();
  const pr=E.profections(birth, at, chart.ascSign);
  const fd=E.firdaria(birth, at, chart.day);
  const sunLon=chart.planets.find(p=>p.key==='sun').lon;
  let r='';
  // Profections
  const lordP=chart.planets.find(p=>p.key===pr.lord);
  r+=`<h4>Profection de l'année <small>· technique hellénistique</small></h4>`;
  r+=`<p>Année de vie <b>${pr.age}–${pr.age+1}</b> : l'Ascendant se profecte en <b>${SIGNS[pr.profSign].nom}</b> (maison <b>${ROMAN[pr.profHouse]}</b> — ${HOUSE_MEAN[pr.profHouse].dom}). `;
  r+=`<b>Seigneur de l'année :</b> ${leP(lordP)}<b>${lordP.nom}</b>, natal en ${fmtLon(lordP.lon).deg}° ${SIGNS[lordP.sign].nom} (${lordP.dig.label}), maison ${ROMAN[lordP.house]} — c'est le significateur premier de l'année : ses transits et son état natal donnent le ton. `;
  r+=`Mois profecté en cours : <b>${SIGNS[pr.profMonthSign].nom}</b>, seigneur ${PMAP[pr.monthLord].nom}.</p>`;
  // Firdaria
  r+=`<h4>Firdaria <small>· seigneurs du temps (perse)</small></h4>`;
  r+=`<p>Période majeure : <b>${firNom(fd.major.lord)}</b> (${Math.round(fd.major.start)}–${Math.round(fd.major.end)} ans)`;
  if(fd.minor) r+=`, sous-période de <b>${firNom(fd.minor.lord)}</b> (${fd.minor.start.toFixed(1)}–${fd.minor.end.toFixed(1)} ans)`;
  r+=`.</p><div class="frise">`;
  fd.timeline.forEach(p=>{ const w=(p.end-p.start)/75*100, cur=(p.lord===fd.major.lord&&p.start===fd.major.start);
    r+=`<span class="fseg${cur?' cur':''}" style="width:${w}%" data-bulle="${esc(firNom(p.lord)+' : '+Math.round(p.start)+'–'+Math.round(p.end)+' ans')}"><span class="g">${firG(p.lord)}</span></span>`; });
  r+=`</div>`;
  // Libération zodiacale (depuis Fortune et Esprit)
  r+=`<h4>Libération zodiacale <small>· aphesis de Valens, depuis les Lots</small></h4>`;
  [['fortune','Fortune'],['spirit','Esprit']].forEach(([lk,ln])=>{
    const lot=chart.lots.find(l=>l.key===lk); const zr=E.zodiacalReleasing(lot.lon, birth, at);
    const cy=d=>fmtDate(zr.toDate(d)); const lvl=(c,n)=>`${SIGNS[c.sign].nom}${zr.peak(c.sign)?' <span class="asp-h">[pic]</span>':''} <span class="sm">(${cy(c.start)} → ${cy(c.end)})</span>`;
    r+=`<p>Depuis le Lot ${art2lot(ln)} (${SIGNS[zr.startSign].nom}) : niveau 1 ${lvl(zr.cur.L1)} ; niveau 2 ${lvl(zr.cur.L2)} ; niveau 3 ${lvl(zr.cur.L3)}.${zr.cur.L1.lb?' <b>Dénouement du lien</b> (loosing of the bond) en cours.':''}</p>`;
  });
  // Décennies
  const de=E.decennials(birth, at, chart.day);
  r+=`<h4>Décennies <small>· périodes de Valens (10 ans 9 mois)</small></h4>`;
  r+=`<p>Maître majeur : <b>${PMAP[de.major.lord].nom}</b> (${fmtDate(de.toDate(de.major.start))} → ${fmtDate(de.toDate(de.major.end))}), sous-maître <b>${PMAP[de.minor.lord].nom}</b>.</p>`;
  // Distributions par les bornes
  const di=E.distributions(chart, at, birth);
  if(di.current){ r+=`<h4>Distribution par les bornes <small>· direction de l'Ascendant (Naibod)</small></h4>`;
    r+=`<p>Distributeur en cours : <b>${PMAP[di.current.distributor].nom}</b> (maître de la borne où parvient l'Ascendant dirigé), jusque vers ${(at.getUTCFullYear()+ (di.current.untilYears - di.age)).toFixed(0)}.</p>`; }
  // Révolution solaire + lunaire
  const sr=E.solarReturn(sunLon, at, extra.lat, extra.lon);
  if(sr){ const fa=fmtLon(sr.chart.asc), fm=fmtLon(sr.chart.mc), srMoon=sr.chart.planets.find(p=>p.key==='moon');
    r+=`<h4>Révolution solaire <small>· carte de l'année</small></h4>`;
    r+=`<p>Retour du Soleil le <b>${fmtDate(sr.date)}</b> : Ascendant de l'année <b>${fa.deg}° ${fa.signNom}</b>, MC <b>${fm.deg}° ${fm.signNom}</b>, Lune en ${fmtLon(srMoon.lon).deg}° ${SIGNS[srMoon.sign].nom}. Thème ${sr.chart.day?'diurne':'nocturne'}.</p>`; }
  const moonNatal=chart.planets.find(p=>p.key==='moon').lon;
  const lr=E.lunarReturn(moonNatal, at, extra.lat, extra.lon);
  if(lr){ const la=fmtLon(lr.chart.asc); r+=`<h4>Révolution lunaire <small>· cadre du mois</small></h4>`;
    r+=`<p>Dernier retour de la Lune le <b>${fmtDate(lr.date)}</b> à ${fmtTime(lr.date,extra.tz)} : Ascendant lunaire <b>${la.deg}° ${la.signNom}</b>.</p>`; }
  // Directions primaires (v1)
  const pd=E.primaryDirections(chart).filter(d=>d.years>=0 && d.years<=95).slice(0,12);
  if(pd.length){ r+=`<h4>Directions primaires <small>· clé de Naibod, aux angles (v1 « in zodiaco »)</small></h4><ul class="liste">`;
    pd.forEach(d=>{ const yr=birth.getUTCFullYear()+Math.round(d.years); const cl=d.asp.fam==='harmon'?'asp-h':d.asp.fam==='tendu'?'asp-t':'asp-n';
      r+=`<li><span class="tdate">${Math.round(d.years)} ans (~${yr})</span> — <span class="g">${d.prom.g} ${d.asp.g}</span> <b>${d.prom.nom}</b> ${d.asp.nom} <b>${d.sig}</b></li>`; });
    r+=`</ul>`; }
  // Fenêtres de transit (entrée/exact/sortie)
  const tw=E.transitWindows(chart, at, 12);
  r+=`<h4>Fenêtres de transit <small>· lentes sur 12 mois (entrée → sortie)</small></h4>`;
  if(!tw.length) r+=`<p class="vide">Aucune fenêtre de transit majeure des lentes dans les 12 mois.</p>`;
  else { r+=`<ul class="liste">`; tw.slice(0,16).forEach(w=>{ const cl=w.asp.fam==='harmon'?'asp-h':w.asp.fam==='tendu'?'asp-t':'asp-n';
    r+=`<li><span class="tdate">${fmtDate(w.enter)} → ${fmtDate(w.exit)}</span> — <span class="g">${w.mover.g} ${w.asp.g}</span> <b>${w.mover.nom}</b> ${w.asp.nom} <b>${w.target.nom}</b> <span class="${cl}">(${w.exacts.length} exact${w.exacts.length>1?'s — triple passage':''})</span></li>`; });
    r+=`</ul>`; if(tw.length>16) r+=`<p class="sm">… et ${tw.length-16} autre(s).</p>`; }
  return r;
}
function art2lot(n){ return /^[AEÉIOUH]/i.test(n)?"de l'"+n:'de '+n; }

function panelAvance(chart){
  let r='';
  // Hyleg & Alcocoden
  const hy=E.hyleg(chart);
  r+=`<h4>Hyleg & Alcocoden <small>· témoignage de vitalité (jamais une durée de vie)</small></h4>`;
  r+=`<p>Donneur de vie (hyleg) : <b>${hy.source}</b>. Maître du degré (alcocoden) : <b>${PMAP[hy.alcocoden].nom}</b>, en condition <b>${hy.condition}</b> — soit <b>${hy.years}</b> années planétaires symboliques. <span class="sm">À lire comme une mesure traditionnelle de robustesse vitale, non comme une prédiction.</span></p>`;
  // Nœud vrai
  const tn=E.trueNode(chart.date), mn=chart.points.find(p=>p.key==='nodeN').lon;
  r+=`<h4>Nœud lunaire vrai <small>· osculateur, vs moyen</small></h4>`;
  r+=`<p>Tête du Dragon (vraie) : <b>${fmtLon(tn).txt}</b> ; nœud moyen : ${fmtLon(mn).txt} (écart ${sep(tn,mn).toFixed(2)}°).</p>`;
  // Antiscia
  const ac=E.antisciaContacts(chart,1.5);
  r+=`<h4>Antiscia & contre-antiscia <small>· contacts cachés (axes solsticial / équinoxial)</small></h4>`;
  if(!ac.antiscia.length && !ac.contra.length) r+=`<p class="vide">Aucun contact d'antiscion serré (orbe 1,5°).</p>`;
  else { r+=`<ul class="liste">`;
    ac.antiscia.forEach(x=>r+=`<li><span class="g">${x.a.g}</span> <b>${x.a.nom}</b> sur l'antiscion de <span class="g">${x.b.g}</span> <b>${x.b.nom}</b> <span class="sm">(orbe ${x.orb.toFixed(1)}°)</span></li>`);
    ac.contra.forEach(x=>r+=`<li><span class="g">${x.a.g}</span> <b>${x.a.nom}</b> sur le contre-antiscion de <span class="g">${x.b.g}</span> <b>${x.b.nom}</b> <span class="sm asp-t">(orbe ${x.orb.toFixed(1)}°)</span></li>`);
    r+=`</ul>`; }
  // Déclinaisons
  const dc=E.declinations(chart);
  r+=`<h4>Déclinaisons & parallèles <small>· hors de l'écliptique</small></h4>`;
  r+=`<table class="grid"><tr><th>Astre</th><th>Déclinaison</th><th></th></tr>`;
  dc.rows.forEach(row=>r+=`<tr><td><span class="g">${row.g}</span> ${row.nom}</td><td class="num2">${row.dec.toFixed(2)}°</td><td>${row.oob?'<span class="asp-t">hors-limites</span>':''}</td></tr>`);
  r+=`</table>`;
  if(dc.aspects.length){ r+=`<ul class="liste">`; dc.aspects.forEach(a=>r+=`<li><span class="g">${a.a.g} ${a.b.g}</span> <b>${a.a.nom}</b> ${a.type} <b>${a.b.nom}</b> <span class="${a.type==='parallèle'?'asp-h':'asp-t'}">(orbe ${a.orb.toFixed(2)}°)</span></li>`); r+=`</ul>`; }
  // Monomoiria / douzième-partie
  r+=`<h4>Gouvernance par degré <small>· monomoiria & douzième-partie</small></h4><table class="grid"><tr><th>Astre</th><th>Maître du degré</th><th>Douzième-partie</th></tr>`;
  chart.planets.forEach(p=>{ const mo=E.monomoiria(p.lon), dd=E.dodecatemoria(p.lon);
    r+=`<tr><td><span class="g">${p.g}</span> ${p.nom}</td><td><span class="g">${PMAP[mo].g}</span> ${PMAP[mo].nom}</td><td>${fmtLon(dd).deg}° <span class="g">${fmtLon(dd).signG}</span></td></tr>`; });
  r+=`</table>`;
  return r;
}

/* ------------------------- Portrait (clair) ---------------------- */
function panelPortrait(chart, extra){
  const sun=chart.planets.find(p=>p.key==='sun'), moon=chart.planets.find(p=>p.key==='moon');
  const ascSign=chart.ascSign, ascRuler=chart.planets.find(p=>p.key===SIGNS[ascSign].dom);
  const t=chart.temperament, dom=E.dominants(chart)[0], cfg=E.configurations(chart), fa=fmtLon(chart.asc);
  let r=`<p class="chapeau">En un coup d'œil — l'essentiel de votre thème, en clair. Les autres onglets en déploient toute la mécanique traditionnelle.</p>`;
  r+=`<h4>Votre Ascendant — ${SIGNS[ascSign].nom}</h4><p>L'Ascendant est la porte par laquelle vous abordez le monde et la façon dont on vous perçoit. Le vôtre, <b>${SIGNS[ascSign].nom}</b> (${fa.deg}°), vous porte ${SIGN_KW[ascSign].man}. Son maître, ${leP(ascRuler)}<b>${ascRuler.nom}</b> en ${SIGNS[ascRuler.sign].nom} (maison ${ROMAN[ascRuler.house]}), montre où se joue surtout la conduite de votre vie : ${HOUSE_MEAN[ascRuler.house].dom}.</p>`;
  r+=`<h4>Votre Soleil — ${SIGNS[sun.sign].nom}, maison ${ROMAN[sun.house]}</h4><p>Le Soleil, c'est votre élan vital, votre identité profonde et ce vers quoi vous tendez. En ${SIGNS[sun.sign].nom} il s'exprime ${SIGN_KW[sun.sign].man} ; en ${ROMAN[sun.house]}<sup>e</sup> maison il rayonne surtout sur ${HOUSE_MEAN[sun.house].dom}.</p>`;
  r+=`<h4>Votre Lune — ${SIGNS[moon.sign].nom}, maison ${ROMAN[moon.house]}</h4><p>La Lune gouverne vos émotions, vos besoins et vos habitudes. En ${SIGNS[moon.sign].nom}, votre vie intérieure fonctionne ${SIGN_KW[moon.sign].man} ; en ${ROMAN[moon.house]}<sup>e</sup> maison elle se nourrit de ${HOUSE_MEAN[moon.house].dom}.</p>`;
  r+=`<h4>Votre tempérament — ${TEMPER[t.dominant].nom}</h4><p>Selon la médecine des humeurs, votre complexion dominante est <b>${TEMPER[t.dominant].nom.toLowerCase()}</b> (${TEMPER[t.dominant].q}), teintée de ${TEMPER[t.second].nom.toLowerCase()} : ${TEMPER[t.dominant].t}.</p>`;
  r+=`<h4>L'astre qui vous mène — ${dom.nom}</h4><p>${dom.nom} est l'astre le plus actif de votre thème (${dom.pct}% de l'activité) : ${PLANET_KW[dom.key].suj.toLowerCase()} y tiennent une place de premier plan. Votre thème est <b>${chart.day?'diurne':'nocturne'}</b>, sous l'autorité ${chart.day?'du Soleil':'de la Lune'}.</p>`;
  if(cfg.length) r+=`<h4>Une figure marquante</h4><p>Votre thème porte ${cfg.length>1?'plusieurs figures remarquables':'une figure remarquable'} : ${cfg.map(x=>x.type.toLowerCase()).join(', ')} — détail dans l'onglet <b>Aspects</b>.</p>`;
  r+=`<p class="sm">Ce portrait est volontairement accessible. Tout le détail — dignités, almutén, maisons, lots, étoiles, prévisions traditionnelles — vit dans les onglets.</p>`;
  return r;
}

/* ----------------------- assemblage en onglets ------------------- */
function buildSheet(view, chart, extra){
  const isCiel = view==='ciel';
  const tabs = isCiel ? [
    ['bulletin','Bulletin', judgmentCiel(chart, extra.hour)],
    ['positions','Positions', panelPositions(chart)],
    ['aspects','Aspects', panelAspectarian(chart)+panelConfigurations(chart)],
    ['maisons','Maisons', panelHouses(chart)],
    ['astres','Astres', panelPlanets(chart)],
    ['forces','Dignités & forces', panelDignities(chart)+panelDominants(chart)],
    ['lots','Lots & étoiles', panelLots(chart)+panelStars(chart)],
    ['climat','Climat', panelTemperament(chart)+panelMoon(chart)],
    ['glossaire','Glossaire', panelGlossary()],
  ] : [
    ['portrait','Portrait', panelPortrait(chart, extra)],
    ['positions','Positions', panelPositions(chart)],
    ['aspects','Aspects', panelAspectarian(chart)+panelConfigurations(chart)],
    ['maisons','Maisons', panelHouses(chart)],
    ['astres','Astres', panelPlanets(chart)],
    ['forces','Dignités & forces', panelDignities(chart)+panelDominants(chart)+panelTemperament(chart)],
    ['lots','Lots & points', panelLots(chart)],
    ['etoiles','Étoiles & demeures', panelStars(chart)],
    ['previsions','Prévisions', panelPrevisions(chart, extra)],
    ['avance','Avancé', panelAvance(chart)],
    ['jugement','Jugement', judgmentNatal(chart, extra.lieu, extra.dateUTC, extra.tz)+`<h4>Influences du moment</h4>`+judgmentTransits(chart, extra.now)],
    ['glossaire','Glossaire', panelGlossary()],
  ];
  const fa=fmtLon(chart.asc), fm=fmtLon(chart.mc);
  const fiche = `<div class="fiche">`
    + ficheItem('Ascendant', `${fa.deg}° ${fa.signNom}`)
    + ficheItem('Milieu du Ciel', `${fm.deg}° ${fm.signNom}`)
    + ficheItem('Secte', chart.day?'Diurne ☀':'Nocturne ☾')
    + ficheItem('Almutén', PMAP[chart.almuten.planet].nom)
    + ficheItem('Complexion', TEMPER[chart.temperament.dominant].nom)
    + ficheItem('Lune', `${chart.phase.nom} ${chart.phase.illum}%`)
    + `</div>`;
  const nav = `<div class="subnav" role="tablist" aria-label="Sections du thème">`
    + tabs.map((t,i)=>`<button class="subtab" type="button" role="tab" data-sub="${view}-${t[0]}" aria-selected="${i===0}">${t[1]}</button>`).join('') + `</div>`;
  const panels = `<div class="subpanels">` + tabs.map((t,i)=>
    `<section class="subpanel" id="${view}-${t[0]}" data-sub="${view}-${t[0]}"${i===0?'':' hidden'}><h3>${t[1]}</h3>${t[2]}</section>`).join('') + `</div>`;
  return fiche + nav + panels;
}
function ficheItem(k,v){ return `<div class="fi"><span>${k}</span><b>${v}</b></div>`; }
// active un sous-onglet dans une feuille
function activateSub(sheetEl, subId){
  sheetEl.querySelectorAll('.subtab').forEach(b=>b.setAttribute('aria-selected', String(b.dataset.sub===subId)));
  sheetEl.querySelectorAll('.subpanel').forEach(p=>{ p.hidden = (p.dataset.sub!==subId); });
}

/* --------------------------- Format date ------------------------- */
function fmtDate(d,tz){ return new Intl.DateTimeFormat('fr-BE',{dateStyle:'long',timeZone:tz||'Europe/Brussels'}).format(d); }
function fmtTime(d,tz){ return new Intl.DateTimeFormat('fr-BE',{hour:'2-digit',minute:'2-digit',timeZone:tz||'Europe/Brussels'}).format(d); }
function fmtFull(d){ return new Intl.DateTimeFormat('fr-BE',{dateStyle:'full',timeStyle:'short',timeZone:'Europe/Brussels'}).format(d); }
// décalage (min) d'un fuseau IANA à un instant donné — gère l'heure d'été partout
function tzOffsetMin(tz, d){
  const p=new Intl.DateTimeFormat('en-US',{timeZone:tz,hour12:false,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).formatToParts(d).reduce((a,x)=>(a[x.type]=x.value,a),{});
  const asUTC=Date.UTC(+p.year,+p.month-1,+p.day,(+p.hour)%24,+p.minute); return (asUTC-d.getTime())/60000;
}
// heure murale d'un fuseau → instant UTC (point fixe à 2 passes pour les bascules DST)
function wallToDate(tz, y,mo,da,h,mi){
  let g=new Date(Date.UTC(y,mo-1,da,h,mi)); g=new Date(g.getTime()-tzOffsetMin(tz,g)*60000);
  return new Date(Date.UTC(y,mo-1,da,h,mi)-tzOffsetMin(tz,g)*60000);
}
// thème « maintenant » minimal (7 longitudes) pour les transits — évite un buildChart complet
function nowLite(){ const d=new Date(); return { date:d, planets: E.PLANETS.map(p=>({ key:p.key, nom:p.nom, g:p.g, lon:E.tropLon(p.body,d) })) }; }

/* ----------------------------- État ------------------------------ */
let cielSys='whole', natalSys='whole', cielFig='roue', natalFig='roue', lastCiel=null, lastNatal=null, lastHour=null, lastSig=null;

function renderCiel(force){
  const now=new Date();
  const chart=E.buildChart(now, BXL.lat, BXL.lon, cielSys);
  const hour=E.planetaryHour(now, BXL.lat, BXL.lon);
  lastCiel=chart; lastHour=hour;
  // horloge + figure rafraîchies à chaque tick (sans état cliquable)
  drawFigure(document.getElementById('fig-ciel'), chart, cielFig);
  document.getElementById('dateline').textContent = fmtFull(now);
  document.getElementById('hourline').innerHTML = `Heure ${deP(hour.ruler)}<b>${hour.ruler.nom}</b> <span style="font-family:var(--glyph)">${hour.ruler.g}</span>`;
  // feuille cliquable reconstruite seulement si la minute astrologique change (préserve scroll/navigation)
  const sig = cielSys+'|'+hour.ruler.key+'|'+Math.floor(now.getTime()/60000);
  if (force || sig!==lastSig){ lastSig=sig; const sy=window.scrollY;
    document.getElementById('sheet-ciel').innerHTML = buildSheet('ciel', chart, {hour});
    window.scrollTo(0, sy); }                                       // préserve la place de lecture au tick minute
  syncControls('ciel');
}
function renderNatal(){
  const y=document.getElementById('n-date').value, t=document.getElementById('n-heure').value||'12:00';
  const lieu=document.getElementById('n-lieu').value||'lieu inconnu';
  const lat=parseFloat(document.getElementById('n-lat').value), lon=parseFloat(document.getElementById('n-lon').value);
  const tz=(document.getElementById('n-tz')||{}).value || 'Europe/Brussels';
  const errBox=document.getElementById('n-err'); if(errBox) errBox.textContent='';
  if(!y){ if(errBox) errBox.textContent='Indiquez une date de naissance.'; return; }
  if(isNaN(lat)||lat<-90||lat>90||isNaN(lon)||lon<-180||lon>180){ if(errBox) errBox.textContent='Latitude (−90…90) et longitude (−180…180) requises.'; return; }
  try{
    const [Y,Mo,Da]=y.split('-').map(Number), [H,Mi]=t.split(':').map(Number);
    const dateUTC=wallToDate(tz,Y,Mo,Da,H,Mi);
    const chart=E.buildChart(dateUTC, lat, lon, natalSys);
    lastNatal=chart;
    drawFigure(document.getElementById('fig-natal'), chart, natalFig);
    document.getElementById('sheet-natal').innerHTML = buildSheet('natal', chart, {lieu, dateUTC, tz, lat, lon, now:nowLite()});
    syncControls('natal');
  }catch(e){ console.error(e); if(errBox) errBox.textContent='Erreur de calcul : '+e.message; }
}
function syncControls(view){
  const sys=view==='ciel'?cielSys:natalSys, fig=view==='ciel'?cielFig:natalFig;
  document.querySelectorAll(`#vue-${view} .sysbtn`).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sys===sys)));
  document.querySelectorAll(`#vue-${view} .figbtn`).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===fig)));
}

/* --------------------------- Onglets ----------------------------- */
let apprRendered=false;
function setTab(which){
  ['ciel','natal','apprendre'].forEach(v=>{ const t=document.getElementById('tab-'+v), s=document.getElementById('vue-'+v);
    if(t) t.setAttribute('aria-selected', String(v===which)); if(s) s.hidden=(v!==which); });
  if(which==='apprendre' && !apprRendered){ try{ renderApprendre(); }catch(e){ console.error(e); } apprRendered=true; }
  if(history.replaceState) history.replaceState(null,'', which==='ciel'?'#':'#'+which);
  scrollTo(0,0);
}

/* --------------------------- Apprendre --------------------------- */
function renderApprendre(){
  const C=window.DEMAIN_COURS; if(!C){ document.getElementById('sheet-apprendre').innerHTML='<p>Contenu pédagogique indisponible.</p>'; return; }
  const PKEY='demain_progress';
  const prog=()=>{ try{ return JSON.parse(localStorage.getItem(PKEY)||'{}'); }catch(e){ return {}; } };
  const allLec=C.cours.reduce((a,n)=>a.concat(n.lecons),[]), nTot=allLec.length;
  function bar(){ const d=prog(), n=allLec.filter(l=>d[l.id]).length;
    return `<div class="prog"><div class="prog-bar"><i style="width:${Math.round(n/nTot*100)}%"></i></div><span>${n}/${nTot} leçons lues</span></div>`; }
  let parcours=`<p class="chapeau">Un cours d'astrologie traditionnelle, des premières notions jusqu'aux techniques savantes. Dépliez une leçon pour la lire ; votre progression est mémorisée dans votre navigateur. Les mots <a class="lex" data-lex="theme">soulignés</a> renvoient à l'encyclopédie.</p><div id="prog-box">${bar()}</div>`;
  const d0=prog();
  C.cours.forEach(n=>{ parcours+=`<h4>${esc(n.titre)}</h4>`;
    n.lecons.forEach(l=>{ parcours+=`<details class="lecon" data-lec="${l.id}"><summary><span class="lec-check">${d0[l.id]?'✓':'○'}</span> ${esc(l.titre)}</summary><div class="lec-body">${l.html}</div></details>`; }); });
  const cats=[]; C.lexique.forEach(e=>{ if(!cats.includes(e.cat)) cats.push(e.cat); });
  let lex=`<p class="chapeau">Toutes les notions, classées et reliées. Cherchez un terme, ou cliquez les mots soulignés du cours.</p><input type="search" id="lex-search" class="lex-search" placeholder="Rechercher un terme…" aria-label="Rechercher dans l'encyclopédie">`;
  cats.forEach(cat=>{ lex+=`<h4 class="lex-cat-h" data-cat="${esc(cat)}">${esc(cat)}</h4>`;
    C.lexique.filter(e=>e.cat===cat).forEach(e=>{ lex+=`<div class="lex-entry" id="lex-${e.key}" data-terme="${esc((e.terme+' '+e.def.replace(/<[^>]+>/g,'')).toLowerCase())}"><b class="lex-t">${esc(e.terme)}</b> <span class="lex-cat">${esc(e.cat)}</span><div class="lex-def">${e.def}</div></div>`; }); });
  const tabs=[['parcours','Parcours',parcours],['lexique','Encyclopédie',lex]];
  const nav=`<div class="subnav" role="tablist" aria-label="Apprendre">`+tabs.map((t,i)=>`<button class="subtab" type="button" data-sub="appr-${t[0]}" aria-selected="${i===0}">${t[1]}</button>`).join('')+`</div>`;
  const panels=`<div class="subpanels">`+tabs.map((t,i)=>`<section class="subpanel" id="appr-${t[0]}" data-sub="appr-${t[0]}"${i?' hidden':''}>${t[2]}</section>`).join('')+`</div>`;
  const sheet=document.getElementById('sheet-apprendre'); sheet.innerHTML=nav+panels;
  // progression : marquer lu à l'ouverture d'une leçon
  sheet.querySelectorAll('.lecon').forEach(det=>det.addEventListener('toggle',()=>{ if(!det.open) return;
    const id=det.dataset.lec, p=prog(); if(!p[id]){ p[id]=true; localStorage.setItem(PKEY,JSON.stringify(p));
      det.querySelector('.lec-check').textContent='✓'; const pb=document.getElementById('prog-box'); if(pb) pb.innerHTML=bar(); } }));
  // recherche encyclopédie
  const srch=document.getElementById('lex-search');
  if(srch) srch.addEventListener('input',()=>{ const q=srch.value.trim().toLowerCase();
    sheet.querySelectorAll('.lex-entry').forEach(en=>{ en.style.display = (!q||en.dataset.terme.includes(q))?'':'none'; });
    sheet.querySelectorAll('.lex-cat-h').forEach(h=>{ let nx=h.nextElementSibling, vis=false; while(nx&&!nx.classList.contains('lex-cat-h')){ if(nx.classList.contains('lex-entry')&&nx.style.display!=='none') vis=true; nx=nx.nextElementSibling; } h.style.display=vis?'':'none'; }); });
}

/* ------------------------ Bulles & liens ------------------------- */
function initInteractivity(){
  const bulle=document.getElementById('bulle');
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function showBulle(t, x, y){
    bulle.textContent=t.getAttribute('data-bulle'); bulle.hidden=false;
    const pad=14, r=bulle.getBoundingClientRect();
    let bx=x+pad, by=y+pad;
    if(bx+r.width>innerWidth-8) bx=x-r.width-pad; if(by+r.height>innerHeight-8) by=y-r.height-pad;
    bulle.style.left=Math.max(4,bx)+'px'; bulle.style.top=Math.max(4,by)+'px';
  }
  const hide=()=>{ bulle.hidden=true; };
  function goto(t){ const el=document.getElementById(t.getAttribute('data-goto')); if(!el) return;
    const panel=el.closest('.subpanel'); if(panel){ const sheet=panel.closest('.sheet'); if(sheet) activateSub(sheet, panel.dataset.sub); }
    el.scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'});
    el.classList.remove('flash'); void el.offsetWidth; if(!reduce) el.classList.add('flash'); hide(); }
  // bascule des sous-onglets
  document.addEventListener('click', e=>{ const b=e.target.closest('.subtab'); if(!b) return;
    const sheet=b.closest('.sheet'); if(sheet) activateSub(sheet, b.dataset.sub); });
  // souris : bulle suit le curseur
  document.addEventListener('mousemove',e=>{ const t=e.target.closest('[data-bulle]'); if(t) showBulle(t,e.clientX,e.clientY); else hide(); });
  // clavier : bulle sur l'élément focalisé
  document.addEventListener('focusin',e=>{ const t=e.target.closest && e.target.closest('[data-bulle]');
    if(t){ const b=t.getBoundingClientRect(); showBulle(t, b.left+b.width/2, b.bottom); } });
  document.addEventListener('focusout',hide);
  document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ hide(); return; }
    if(e.key==='Enter'||e.key===' '){ const t=e.target.closest && e.target.closest('[data-goto]'); if(t){ e.preventDefault(); goto(t); } } });
  // clic / tactile : navigation interne, sinon afficher la bulle au tap (mobile)
  document.addEventListener('click',e=>{ const g=e.target.closest('[data-goto]'); if(g){ e.preventDefault(); goto(g); return; }
    const t=e.target.closest('[data-bulle]'); if(t){ const b=t.getBoundingClientRect(); showBulle(t, b.left+b.width/2, b.bottom); } else hide(); });
  const flash=el=>{ if(!el)return; el.scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'}); el.classList.remove('flash'); void el.offsetWidth; if(!reduce) el.classList.add('flash'); };
  // liens encyclopédie + boutons « voir dans votre thème »
  document.addEventListener('click',e=>{
    const lx=e.target.closest('[data-lex]'); if(lx){ e.preventDefault(); setTab('apprendre'); const sh=document.getElementById('sheet-apprendre'); if(sh){ activateSub(sh,'appr-lexique'); flash(document.getElementById('lex-'+lx.dataset.lex)); } return; }
    const sv=e.target.closest('[data-see]'); if(sv){ e.preventDefault(); const sub=sv.dataset.see; setTab('natal'); const sh=document.getElementById('sheet-natal'); if(sh){ activateSub(sh,sub); const el=document.getElementById(sub); if(el) el.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'}); } }
  });
}

/* -------------- Atlas, bibliothèque, export ---------------------- */
// styles inlinés pour le rendu PNG (le SVG isolé n'hérite pas de la feuille externe)
const FIG_CSS = `text{font-family:'Segoe UI Symbol','Noto Sans Symbols2','DejaVu Sans',serif}
.w-ring{fill:none;stroke:#2b2117;stroke-width:1.3}.w-hub{fill:#574734}.w-dot{fill:#2b2117}
.w-zod{stroke:#c3b083;stroke-width:.7}.w-cusp{stroke:#6f6048;stroke-width:.7;stroke-dasharray:2 2}.w-axis{stroke:#866820;stroke-width:1.6}
.w-tick{stroke:#574734;stroke-width:.5}.w-sign{font-size:16px;fill:#7c2b22}.w-house{font-size:10px;fill:#6f6048}.w-axislab{font-size:10px;fill:#866820}
.w-star{stroke:#866820;stroke-width:1.4}.w-stem{stroke:#6f6048;stroke-width:.5}.w-pl{font-size:18px;fill:#2b2117}.w-pl.retro{fill:#243a52}
.w-pt{font-size:14px;fill:#866820}.w-deg{font-size:8.5px;fill:#574734}.w-asp-h{stroke:#3a5530}.w-asp-t{stroke:#7c2b22}.w-asp-n{stroke:#866820}
.w-aspbg{fill:#f3ead3}.w-aspg.w-asp-h{fill:#3a5530;stroke:none}.w-aspg.w-asp-t{fill:#7c2b22;stroke:none}.w-aspg.w-asp-n{fill:#866820;stroke:none}.w-hit{stroke:none}
.bord{fill:none;stroke:#2b2117;stroke-width:2.2}.filet{fill:none;stroke:#574734}.cell{fill:none}.num{font-size:11px;fill:#6f6048}.sg{font-size:16px;fill:#7c2b22}.pl{font-size:19px;fill:#2b2117}.pl.retro{fill:#243a52}.axe{font-size:10px;fill:#866820}`;
function initExtras(){
  const $=id=>document.getElementById(id);
  function ensureTz(tz){ const sel=$('n-tz'); if(!sel||!tz) return; if(![...sel.options].some(o=>o.value===tz)){ const o=document.createElement('option'); o.value=tz; o.textContent=tz; sel.appendChild(o);} sel.value=tz; }
  // ---- Atlas de villes ----
  let CITIES=null, lastRes=[]; const norm=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
  const ci=$('n-city'), cl=$('n-city-list');
  function load(){ if(CITIES) return; CITIES=[]; fetch('cities.json').then(r=>r.json()).then(d=>{CITIES=d;}).catch(()=>{}); }
  function search(q){ if(!CITIES||!CITIES.length||q.trim().length<2){ cl.hidden=true; return; } const nq=norm(q.trim()), pre=[], inc=[];
    for(let i=0;i<CITIES.length && pre.length<10;i++){ const c=CITIES[i], n=norm(c[0]), a=c[1]?norm(c[1]):n; if(n.startsWith(nq)||a.startsWith(nq)) pre.push(c); }
    if(pre.length<10) for(let i=0;i<CITIES.length && pre.length+inc.length<10;i++){ const c=CITIES[i], n=norm(c[0]), a=c[1]?norm(c[1]):n; if((n.includes(nq)||a.includes(nq))&&!pre.includes(c)) inc.push(c); }
    lastRes=pre.concat(inc); cl.innerHTML=lastRes.map((c,i)=>`<li role="option" data-i="${i}">${esc(c[0])} <span class="ac-c">${c[2]}</span></li>`).join(''); cl.hidden=!lastRes.length; }
  function pick(c){ $('n-lieu').value=`${c[0]} (${c[2]})`; $('n-lat').value=c[3]; $('n-lon').value=c[4]; ensureTz(c[5]); ci.value=`${c[0]} (${c[2]})`; cl.hidden=true; }
  if(ci){ ci.addEventListener('focus',load); ci.addEventListener('input',()=>search(ci.value));
    ci.addEventListener('keydown',e=>{ if(e.key==='Enter'&&lastRes.length){ e.preventDefault(); pick(lastRes[0]); } });
    cl.addEventListener('mousedown',e=>{ const li=e.target.closest('li'); if(li) pick(lastRes[+li.dataset.i]); });
    document.addEventListener('click',e=>{ if(!e.target.closest('.champ-ville')) cl.hidden=true; }); }
  // ---- Bibliothèque (localStorage) ----
  const LSKEY='demain_themes';
  const loadT=()=>{ try{ return JSON.parse(localStorage.getItem(LSKEY)||'[]'); }catch(e){ return []; } };
  const saveT=a=>localStorage.setItem(LSKEY, JSON.stringify(a));
  function refresh(){ const a=loadT(); $('n-saved').innerHTML='<option value="">— thèmes mémorisés —</option>'+a.map((t,i)=>`<option value="${i}">${esc(t.nom)}</option>`).join(''); if($('n-del')) $('n-del').hidden=!a.length; }
  if($('n-save')) $('n-save').addEventListener('click',()=>{ const a=loadT();
    a.push({ nom:((($('n-lieu').value||'Thème')+' '+($('n-date').value||'')).trim()), lieu:$('n-lieu').value, date:$('n-date').value, heure:$('n-heure').value, tz:$('n-tz').value, lat:$('n-lat').value, lon:$('n-lon').value });
    saveT(a); refresh(); $('n-saved').value=String(a.length-1); });
  if($('n-saved')) $('n-saved').addEventListener('change',e=>{ const t=loadT()[+e.target.value]; if(!t) return;
    $('n-lieu').value=t.lieu; $('n-date').value=t.date; $('n-heure').value=t.heure; ensureTz(t.tz); $('n-lat').value=t.lat; $('n-lon').value=t.lon; renderNatal(); });
  if($('n-del')) $('n-del').addEventListener('click',()=>{ const sel=$('n-saved'); if(sel.value===''){return;} const a=loadT(); a.splice(+sel.value,1); saveT(a); refresh(); });
  refresh();
  // ---- Export PNG ----
  document.querySelectorAll('[data-png]').forEach(b=>b.addEventListener('click',()=>{ const svg=$(b.dataset.png); if(!svg) return;
    const clone=svg.cloneNode(true); const st=document.createElementNS('http://www.w3.org/2000/svg','style'); st.textContent=FIG_CSS; clone.insertBefore(st, clone.firstChild);
    const xml=new XMLSerializer().serializeToString(clone), url='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(xml)));
    const img=new Image(); img.onload=()=>{ const S=900, c=document.createElement('canvas'); c.width=S; c.height=S; const x=c.getContext('2d');
      x.fillStyle='#f3ead3'; x.fillRect(0,0,S,S); x.drawImage(img,0,0,S,S);
      const a=document.createElement('a'); a.download='theme-demain.png'; a.href=c.toDataURL('image/png'); a.click(); };
    img.onerror=()=>alert('Export PNG indisponible sur ce navigateur ; utilisez « Imprimer / PDF ».'); img.src=url; }));
}

/* ----------------------------- Init ------------------------------ */
function init(){
  document.getElementById('tab-ciel').addEventListener('click',()=>setTab('ciel'));
  document.getElementById('tab-natal').addEventListener('click',()=>setTab('natal'));
  const ta=document.getElementById('tab-apprendre'); if(ta) ta.addEventListener('click',()=>setTab('apprendre'));
  document.getElementById('form-natal').addEventListener('submit',e=>{e.preventDefault(); renderNatal();});
  document.querySelectorAll('.figbtn').forEach(b=>b.addEventListener('click',()=>{ const v=b.closest('.panneau').id.replace('vue-','');
    if(v==='ciel'){cielFig=b.dataset.mode; if(lastCiel)drawFigure(document.getElementById('fig-ciel'),lastCiel,cielFig);}
    else{natalFig=b.dataset.mode; if(lastNatal)drawFigure(document.getElementById('fig-natal'),lastNatal,natalFig);} syncControls(v); }));
  document.querySelectorAll('.sysbtn').forEach(b=>b.addEventListener('click',()=>{ const v=b.closest('.panneau').id.replace('vue-','');
    if(v==='ciel'){cielSys=b.dataset.sys; renderCiel();} else {natalSys=b.dataset.sys; renderNatal();} }));
  initInteractivity();
  initExtras();
  try{ renderCiel(); }catch(e){ console.error(e); document.getElementById('sheet-ciel').innerHTML='<p>Erreur : '+esc(e.message)+'</p>'; }
  try{ renderNatal(); }catch(e){ console.error(e); }
  if(location.hash==='#natal') setTab('natal'); else if(location.hash==='#apprendre') setTab('apprendre');
  setInterval(()=>{ if(!document.getElementById('vue-ciel').hidden) try{ renderCiel(); }catch(e){} }, 60000);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
