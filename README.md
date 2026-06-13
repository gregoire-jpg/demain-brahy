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

## Module complet (selon les anciens)

- Sept astres : ☉ ☽ ☿ ♀ ♂ ♃ ♄ ; zodiaque **tropical**, positions **géocentriques vraies de la date**
- **Dignités à cinq termes** : domicile, exaltation, triplicité (dorothéenne), **bornes égyptiennes**, **faces** (décans chaldéens) — avec score et **almutén** (du degré et de la géniture)
- **Quatre systèmes de maisons** au choix : **signes entiers**, **Porphyre**, **Placide**, **Régiomontanus** (cuspides validées : I=Asc et X=MC à 0,00°, Placide vérifié par la condition semi-arc des anciens ; repli honnête sur signes entiers aux latitudes circumpolaires)
- **Nativité partout dans le monde** : fuseau horaire du lieu au choix (heure d'été gérée par fuseau IANA), latitude/longitude libres
- **Accessibilité** : navigation clavier, bulles au focus et au tactile, figures `role=img`, contrastes AA, respect de `prefers-reduced-motion`
- **Aspects ptolémaïques** (orbes par moitiés), application / séparation, **partile**, **réceptions mutuelles**, aspectarium
- **Secte** diurne / nocturne, **hayz** ; combustion, cazimi, sous les rayons ; rétrogradation ; oriental / occidental
- **Tempérament humoral** (sanguin / colérique / mélancolique / flegmatique) calculé et chiffré
- **Sept Lots herméniques** (Fortune, Esprit, Amour, Nécessité, Victoire, Courage), **nœuds lunaires**
- **Étoiles fixes** majeures (précessées) conjointes aux astres et aux angles
- **28 demeures lunaires**, phase, **application** et **course vide** de la Lune
- **Heures planétaires** inégales (ordre chaldéen) pour le ciel du moment
- **Interprétation par maison** et **par astre** (signe + maison + dignité + aspects), survols explicatifs et liens internes

## Architecture

- **`engine.js`** — moteur de calcul pur, sans DOM. Fonctionne dans le navigateur (`window.DEMAIN`) **et dans Node** (`module.exports`), donc testable.
- **`app.js`** — cockpit : figure (roue / carré), panneaux de données, délinéations, bulles de survol, liens internes.
- **`style.css`**, **`index.html`** — présentation (esprit revue 1930, dense et navigable).

## Technique

- **100 % navigateur**, sans serveur, sans clé d'API, sans mouchard.
- Éphéméride : [Astronomy Engine](https://github.com/cosinekitty/astronomy) (vendorisée dans `vendor/`).
- Les longitudes écliptiques sont obtenues par `GeoVector` → rotation `EQJ→ECT` (écliptique vraie
  de la date). L'Ascendant est calculé par la formule classique (RAMC, obliquité, latitude) et
  **vérifié par balayage d'horizon** dans `validate.js` (écart nul).

### Vérifier / développer

```bash
npm install            # récupère astronomy-engine (uniquement pour les tests Node)
node validate.js       # positions + Ascendant (formule vs balayage d'horizon)
node test-engine2.js   # thème complet + 4 systèmes de maisons (I=Asc, X=MC à 0,00°)
```

Le site lui-même n'a **aucune dépendance d'exécution** : `index.html`, `style.css`, `app.js`
et `vendor/astronomy.browser.min.js` suffisent.

---

*« Le ciel incline, mais ne contraint point. »*
