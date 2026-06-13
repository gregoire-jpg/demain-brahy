# DEMAIN — Bulletin des influences célestes

Une page unique qui **établit et interprète le ciel selon les anciens**, en hommage à
l'astrologue belge **Gustave-Lambert Brahy** (Liège 1894 — Bruxelles 1989), expert-comptable
devenu pionnier de l'astrologie mondiale et boursière, fondateur de l'Institut Astrologique de
Belgique et de la revue *Demain* (1926), où il publiait ses bulletins d'influences.

Deux modes :

- **Le ciel du moment** — horoscope de l'instant dressé pour Bruxelles, **recalculé en continu**
  (toutes les minutes) : figure carrée des anciens, positions des sept astres, dignités,
  aspects, phase de la Lune, **heure planétaire** inégale (ordre chaldéen) et **application
  de la Lune**. Un bulletin rédigé dans le registre des vieilles revues en tire le jugement.
- **Thème de nativité** — entrez date, heure (temps civil belge) et lieu : le thème est dressé
  (Ascendant, Milieu du Ciel, maisons en signes entiers), jugé à la manière traditionnelle, puis
  confronté aux **transits du moment** — de sorte que la lecture évolue, elle aussi, d'instant en instant.

## Selon les anciens

- Sept astres seulement : ☉ ☽ ☿ ♀ ♂ ♃ ♄
- Zodiaque **tropical**, positions **géocentriques apparentes vraies de la date**
- **Dignités essentielles** : domicile, exaltation, triplicité, exil, chute
- **Aspects ptolémaïques** : conjonction, sextile, carré, trigone, opposition (orbes par moitiés)
- **Maisons en signes entiers** (système hellénistique)
- **Heures planétaires inégales** comptées depuis le lever, dans l'ordre chaldéen
- **Application / séparation** et **course vide** de la Lune
- Combustion, cazimi, sous les rayons ; rétrogradation ; secte diurne / nocturne

## Technique

- **100 % navigateur**, sans serveur, sans clé d'API, sans mouchard.
- Éphéméride : [Astronomy Engine](https://github.com/cosinekitty/astronomy) (vendorisée dans `vendor/`).
- Les longitudes écliptiques sont obtenues par `GeoVector` → rotation `EQJ→ECT` (écliptique vraie
  de la date). L'Ascendant est calculé par la formule classique (RAMC, obliquité, latitude) et
  **vérifié par balayage d'horizon** dans `validate.js` (écart nul).

### Vérifier / développer

```bash
npm install            # récupère astronomy-engine (uniquement pour les tests Node)
node validate.js       # positions + Ascendant (formule vs horizon)
node test-engine.js    # smoke test des APIs de l'éphéméride
```

Le site lui-même n'a **aucune dépendance d'exécution** : `index.html`, `style.css`, `app.js`
et `vendor/astronomy.browser.min.js` suffisent.

---

*« Le ciel incline, mais ne contraint point. »*
