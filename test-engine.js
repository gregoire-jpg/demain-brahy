// Smoke test des APIs utilisées par app.js (build Node de la même lib)
const A = require('astronomy-engine');
const now = new Date();
const obs = new A.Observer(50.8503, 4.3517, 0);

// Illumination
const ill = A.Illumination(A.Body.Moon, now);
console.log('Illumination keys:', Object.keys(ill).join(','));
console.log('phase_fraction =', ill.phase_fraction);

// Equator + Horizon (altitude du Soleil)
const eq = A.Equator(A.Body.Sun, now, obs, true, true);
console.log('Equator -> ra,dec =', eq.ra.toFixed(3), eq.dec.toFixed(3));
const hor = A.Horizon(now, obs, eq.ra, eq.dec, null);
console.log('Sun altitude =', hor.altitude.toFixed(2), '(jour =', hor.altitude>0, ')');

// SearchRiseSet
const rise = A.SearchRiseSet(A.Body.Sun, obs, +1, new Date(now.getTime()-30*3600000), 2);
const set  = A.SearchRiseSet(A.Body.Sun, obs, -1, rise.date, 2);
console.log('Rise =', rise && rise.date.toISOString(), 'Set =', set && set.date.toISOString());
console.log('rise.date instanceof Date:', rise.date instanceof Date);

// heures planétaires (logique d'app.js)
const D2R=Math.PI/180,R2D=180/Math.PI,n360=x=>((x%360)+360)%360;
function tropLon(b,d){const v=A.GeoVector(b,d,true);const e=A.RotateVector(A.Rotation_EQJ_ECT(d),v);return n360(A.SphereFromVector(e).lon);}
const DAYRULER=[3,6,2,5,1,4,0];
const CH=['Saturne','Jupiter','Mars','Soleil','Vénus','Mercure','Lune'];
let sr=rise; while(true){const nx=A.SearchRiseSet(A.Body.Sun,obs,+1,new Date(sr.date.getTime()+3600000),2); if(nx&&nx.date.getTime()<=now.getTime())sr=nx;else break;}
const ss=A.SearchRiseSet(A.Body.Sun,obs,-1,sr.date,2);
let isDay,hourInPeriod;
if(now.getTime()<ss.date.getTime()){isDay=true;const len=(ss.date-sr.date)/12;hourInPeriod=Math.floor((now-sr.date)/len);}
else{isDay=false;const nextSr=A.SearchRiseSet(A.Body.Sun,obs,+1,ss.date,2);const len=(nextSr.date-ss.date)/12;hourInPeriod=12+Math.floor((now-ss.date)/len);}
const wd=new Intl.DateTimeFormat('en-US',{weekday:'short',timeZone:'Europe/Brussels'}).format(sr.date);
const wdi={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[wd];
const rulerChald=(DAYRULER[wdi]+hourInPeriod)%7;
console.log('Heure planétaire:', isDay?'jour':'nuit', 'n°', hourInPeriod+1, '-> maître', CH[rulerChald], '(jour', wd, ')');

// application de la Lune (1er aspect)
function moonApp(date){const prev={};for(let h=0;h<=60;h+=1/3){const t=new Date(date.getTime()+h*3600000);const ml=tropLon(A.Body.Moon,t);
  for(const [name,body] of [['Soleil',A.Body.Sun],['Mercure',A.Body.Mercury],['Vénus',A.Body.Venus],['Mars',A.Body.Mars],['Jupiter',A.Body.Jupiter],['Saturne',A.Body.Saturn]]){
    const pl=tropLon(body,t);const d=n360(ml-pl);
    for(const ang of [0,60,90,120,180]){let o1=d-ang;if(o1>180)o1-=360;if(o1<-180)o1+=360;let o2=d-(360-ang);if(o2>180)o2-=360;if(o2<-180)o2+=360;const o=Math.abs(o1)<Math.abs(o2)?o1:o2;const id=name+ang;
      if(prev[id]!==undefined&&Math.sign(prev[id])!==Math.sign(o)&&Math.abs(prev[id])<4&&Math.abs(o)<4&&h>0)return{name,ang,h};prev[id]=o;}}}return null;}
const ma=moonApp(now);
console.log('Application Lune:', ma?`${ma.ang}° à ${ma.name} dans ${ma.h.toFixed(1)}h`:'course vide');

console.log('\nOK — toutes les APIs répondent.');
