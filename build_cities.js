// Génère cities.json compact depuis le dump GeoNames cities15000.txt
const fs = require('fs');
const src = '_atlas_tmp/cities15000.txt';
const lines = fs.readFileSync(src, 'utf8').split('\n');
const rows = [];
for (const line of lines) {
  if (!line) continue;
  const c = line.split('\t');
  const name = c[1], ascii = c[2], lat = parseFloat(c[4]), lon = parseFloat(c[5]);
  const country = c[8], pop = parseInt(c[14], 10) || 0, tz = c[17];
  if (!name || !tz || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
  rows.push([ name, ascii === name ? 0 : ascii, country, Math.round(lat*1e4)/1e4, Math.round(lon*1e4)/1e4, tz, pop ]);
}
rows.sort((a, b) => b[6] - a[6]);   // population décroissante (les grandes villes en tête de l'autocomplétion)
fs.writeFileSync('cities.json', JSON.stringify(rows));
const kb = (fs.statSync('cities.json').size/1024).toFixed(0);
console.log(`cities.json : ${rows.length} villes, ${kb} Ko`);
console.log('top 5 :', rows.slice(0,5).map(r=>`${r[0]} (${r[2]}) ${r[6]}`).join(' | '));
