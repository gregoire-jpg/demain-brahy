/* ============================================================
   DEMAIN — contenu pédagogique : encyclopédie + cours progressif
   Données pures (window.DEMAIN_COURS). Le rendu est dans app.js.
   Conventions d'écriture dans les textes :
   - <a class="lex" data-lex="CLE">mot</a>  → lien vers une fiche d'encyclopédie
   - <button class="see" data-see="natal-ONGLET">Voir dans votre thème</button>
   ============================================================ */
(function(){
"use strict";

/* ----------------------------- ENCYCLOPÉDIE ----------------------------- */
const lexique = [
  // --- Bases ---
  { key:'theme', terme:'Thème astral (ou nativité)', cat:'Bases',
    def:`Photographie du ciel à un instant et un lieu donnés : positions des astres dans les <a class="lex" data-lex="signes">signes</a> et les <a class="lex" data-lex="maisons">maisons</a>, et angles qu'ils forment entre eux (<a class="lex" data-lex="aspects">aspects</a>). C'est la carte qu'on interprète.` },
  { key:'zodiaque', terme:'Zodiaque', cat:'Bases',
    def:`Ceinture du ciel divisée en 12 secteurs de 30° : les douze <a class="lex" data-lex="signes">signes</a>. DEMAIN emploie le zodiaque <b>tropical</b> (origine au point vernal, l'équinoxe de printemps), celui de la tradition occidentale.` },
  { key:'ecliptique', terme:'Écliptique', cat:'Bases',
    def:`Cercle apparent que le Soleil parcourt en un an sur fond d'étoiles. Tout le zodiaque s'y mesure en degrés (0° à 360°).` },
  { key:'geocentrique', terme:'Géocentrique', cat:'Bases',
    def:`Les positions sont calculées vues depuis la Terre (et non depuis le Soleil). C'est la convention de l'astrologie : on décrit le ciel tel qu'on le voit.` },
  { key:'anciens', terme:'« Selon les anciens »', cat:'Bases',
    def:`L'astrologie traditionnelle (hellénistique, médiévale) : sept astres visibles, dignités, secte, lots, time-lords. Elle exclut les astéroïdes et les planètes invisibles à l'œil — choix assumé de DEMAIN.` },

  // --- Signes ---
  { key:'signes', terme:'Les douze signes', cat:'Signes',
    def:`Bélier, Taureau, Gémeaux, Cancer, Lion, Vierge, Balance, Scorpion, Sagittaire, Capricorne, Verseau, Poissons. Chacun colore la manière dont un astre s'exprime. Un signe a un <a class="lex" data-lex="elements">élément</a>, un <a class="lex" data-lex="modes">mode</a> et un <a class="lex" data-lex="maitre">maître</a>.` },
  { key:'elements', terme:'Les quatre éléments', cat:'Signes',
    def:`Feu (élan, ardeur), Terre (concret, durée), Air (esprit, lien), Eau (émotion, intuition). Chaque élément regroupe trois signes (une <a class="lex" data-lex="triplicite">triplicité</a>). La <a class="lex" data-lex="balances">balance</a> des éléments d'un thème en donne le tempérament d'ensemble.` },
  { key:'modes', terme:'Les trois modes (croix)', cat:'Signes',
    def:`Cardinal (initie), Fixe (stabilise), Mutable (adapte). Chaque mode regroupe quatre signes. Avec les éléments, ils caractérisent chaque signe.` },
  { key:'ascendant', terme:'Ascendant (AS)', cat:'Signes',
    def:`Degré du zodiaque qui se levait à l'orient à l'instant de la naissance. C'est la porte d'entrée du thème, la première maison, et la façon dont on aborde le monde et dont on paraît. Son <a class="lex" data-lex="maitre">maître</a> est un significateur majeur.` },
  { key:'mc', terme:'Milieu du Ciel (MC)', cat:'Signes',
    def:`Point le plus haut du ciel au moment de la naissance, sommet de la dixième maison : l'honneur, la vocation, le renom, ce vers quoi l'on s'élève.` },

  // --- Planètes ---
  { key:'astres', terme:'Les sept astres', cat:'Planètes',
    def:`Soleil ☉, Lune ☽, Mercure ☿, Vénus ♀, Mars ♂, Jupiter ♃, Saturne ♄. Ce sont les sept « planètes » des anciens (le Soleil et la Lune compris). Chacune représente une fonction de la vie.` },
  { key:'luminaires', terme:'Les luminaires', cat:'Planètes',
    def:`Le Soleil et la Lune. Le Soleil figure l'élan vital et le but ; la Lune, le corps, les émotions et le quotidien. Ils déterminent la <a class="lex" data-lex="secte">secte</a> du thème.` },
  { key:'benefiques', terme:'Bénéfiques & maléfiques', cat:'Planètes',
    def:`Vénus (petit bénéfique) et Jupiter (grand bénéfique) facilitent ; Mars (petit maléfique) et Saturne (grand maléfique) éprouvent. Mercure est neutre, convertible. Ces natures se nuancent selon la <a class="lex" data-lex="dignites">dignité</a> et la <a class="lex" data-lex="secte">secte</a>.` },
  { key:'retrograde', terme:'Rétrogradation', cat:'Planètes',
    def:`Quand une planète semble reculer dans le zodiaque (effet de perspective). Traditionnellement un empêchement : l'effet de l'astre se fait plus intérieur, hésitant ou tardif.` },
  { key:'combustion', terme:'Combustion, cazimi, sous les rayons', cat:'Planètes',
    def:`Astre à moins de 8°½ du Soleil : <b>combuste</b> (brûlé, affaibli) ; à moins de 17′ : <b>cazimi</b> (au cœur du Soleil, fortifié comme un roi sur son trône) ; à moins de 15° : <b>sous les rayons</b> (voilé).` },

  // --- Maisons ---
  { key:'maisons', terme:'Les douze maisons', cat:'Maisons',
    def:`Découpage du ciel local en douze secteurs à partir de l'<a class="lex" data-lex="ascendant">Ascendant</a>. Là où les signes disent le « comment », les maisons disent le « où » : domaines de la vie (corps, argent, foyer, union, métier…).` },
  { key:'angulaire', terme:'Angulaire, succédent, cadent', cat:'Maisons',
    def:`Maisons angulaires (I, IV, VII, X) : les plus fortes, l'action. Succédentes (II, V, VIII, XI) : la consolidation. Cadentes (III, VI, IX, XII) : plus discrètes, l'apprentissage. Un astre angulaire agit avec puissance.` },
  { key:'systemes', terme:'Systèmes de maisons', cat:'Maisons',
    def:`Plusieurs façons de découper les maisons : <b>signes entiers</b> (le plus ancien : une maison = un signe), Porphyre, Placide, Régiomontanus (qui partagent inégalement les quadrants). DEMAIN les propose tous les quatre.` },
  { key:'maitre', terme:'Maître (domicile)', cat:'Maisons',
    def:`Planète qui gouverne un signe (et donc la maison où ce signe tombe). Le maître d'une maison « porte » ses affaires : sa condition et son lieu disent comment va ce domaine. Le maître de l'Ascendant gouverne la vie entière.` },

  // --- Aspects ---
  { key:'aspects', terme:'Les aspects', cat:'Aspects',
    def:`Angles significatifs entre deux astres : <a class="lex" data-lex="conjonction">conjonction</a> (0°), sextile (60°), carré (90°), trigone (120°), opposition (180°). Ils tissent les relations internes du thème.` },
  { key:'conjonction', terme:'Conjonction ☌', cat:'Aspects',
    def:`Deux astres au même degré : leurs natures fusionnent et se renforcent. Bénéfique ou difficile selon les astres en jeu.` },
  { key:'harmoniques', terme:'Trigone & sextile (harmonie)', cat:'Aspects',
    def:`Trigone (120°) : faveur, talent qui coule de source. Sextile (60°) : occasion favorable à saisir. Ce sont les aspects de facilité.` },
  { key:'tensions', terme:'Carré & opposition (tension)', cat:'Aspects',
    def:`Carré (90°) : friction, obstacle, moteur d'effort. Opposition (180°) : face-à-face, polarité à équilibrer. Aspects de tension — souvent les plus dynamiques.` },
  { key:'orbe', terme:'Orbe', cat:'Aspects',
    def:`Marge de tolérance autour de l'angle exact. DEMAIN emploie les <b>orbes par moitiés</b> (Lilly) : chaque astre a son rayon d'influence, et l'aspect compte si les deux se chevauchent. Plus l'orbe est serré, plus l'aspect est fort.` },
  { key:'application', terme:'Application & séparation', cat:'Aspects',
    def:`Un aspect est <b>appliquant</b> s'il se forme (l'astre le plus rapide rejoint l'exact) — l'événement est à venir ; <b>séparant</b> s'il se défait — il est passé. L'application est plus active.` },
  { key:'reception', terme:'Réception mutuelle', cat:'Aspects',
    def:`Deux astres logés chacun dans une <a class="lex" data-lex="dignites">dignité</a> de l'autre : ils « s'hébergent » mutuellement et coopèrent. Forte (domicile/exaltation) ou faible (triplicité, borne, face).` },
  { key:'configurations', terme:'Configurations', cat:'Aspects',
    def:`Figures à plusieurs astres : grand trigone (3 trigones — talent), T-carré (2 carrés + opposition — tension focalisée), grande croix (4 astres en croix), amas (3+ astres dans un signe).` },

  // --- Dignités & forces ---
  { key:'dignites', terme:'Dignités essentielles', cat:'Dignités',
    def:`Mesure de la « force » d'un astre selon sa place dans le zodiaque, à cinq degrés : <a class="lex" data-lex="domicile">domicile</a> (+5), <a class="lex" data-lex="exaltation">exaltation</a> (+4), <a class="lex" data-lex="triplicite">triplicité</a> (+3), <a class="lex" data-lex="bornes">borne</a> (+2), face (+1). À l'inverse : exil (−5) et chute (−4). Un astre digne agit selon son meilleur naturel.` },
  { key:'domicile', terme:'Domicile & exil', cat:'Dignités',
    def:`Un astre est en <b>domicile</b> dans le(s) signe(s) qu'il gouverne (ex. Mars en Bélier) : chez lui, pleinement maître. En <b>exil</b> dans le signe opposé : contrarié, en terre étrangère.` },
  { key:'exaltation', terme:'Exaltation & chute', cat:'Dignités',
    def:`Signe où un astre est honoré et porté au plus haut (ex. le Soleil en Bélier). Dans le signe opposé, il est en <b>chute</b> : abaissé, empêché d'agir selon son bien.` },
  { key:'triplicite', terme:'Triplicité', cat:'Dignités',
    def:`Dignité par élément : chaque élément a un maître de jour et un de nuit (système de Dorothée). Un astre dans la triplicité de son élément et de sa <a class="lex" data-lex="secte">secte</a> est honnêtement soutenu (+3).` },
  { key:'bornes', terme:'Bornes (termes) & faces', cat:'Dignités',
    def:`Subdivisions fines de chaque signe : les <b>bornes</b> égyptiennes (cinq segments inégaux par signe, +2) et les <b>faces</b> ou décans (trois tiers de 10°, +1). Dignités mineures mais utiles pour départager.` },
  { key:'almuten', terme:'Almutén', cat:'Dignités',
    def:`Maître d'un degré : l'astre qui y cumule le plus de dignités. L'<b>almutén de la géniture</b> (figuris) totalise les dignités sur les points vitaux (Ascendant, Soleil, Lune, Fortune, lunaison prénatale) : c'est le « régent » général du thème.` },
  { key:'secte', terme:'Secte (jour / nuit)', cat:'Dignités',
    def:`Le thème est <b>diurne</b> si le Soleil est au-dessus de l'horizon, <b>nocturne</b> sinon. Les astres de jour (Soleil, Jupiter, Saturne) préfèrent le jour ; ceux de nuit (Lune, Vénus, Mars) la nuit. Un astre « dans sa secte » est plus à l'aise.` },
  { key:'hayz', terme:'Hayz', cat:'Dignités',
    def:`Condition optimale d'un astre : dans sa <a class="lex" data-lex="secte">secte</a>, dans le bon hémisphère (au-dessus de l'horizon le jour, en dessous la nuit) et dans un signe de son genre. Au mieux de sa forme.` },
  { key:'temperament', terme:'Tempérament (humeurs)', cat:'Dignités',
    def:`Complexion d'ensemble selon la médecine ancienne : sanguin (chaud-humide), colérique (chaud-sec), mélancolique (froid-sec), flegmatique (froid-humide). Calculée d'après l'Ascendant, son maître, le Soleil, la Lune et les astres aux angles.` },
  { key:'dominante', terme:'Dominantes', cat:'Dignités',
    def:`Astre(s) le(s) plus « actif(s) » d'un thème, par un calcul d'activité (angularité, dignités, aspects aux luminaires et au maître d'ascendant, maîtrise d'amas). La planète dominante donne une couleur forte au caractère.` },

  // --- Points & lots ---
  { key:'lots', terme:'Lots (parts arabes)', cat:'Points',
    def:`Points sensibles calculés par report d'un arc depuis l'Ascendant (formule inversée de nuit). La <a class="lex" data-lex="fortune">Part de Fortune</a> et la Part de l'Esprit sont les principaux ; d'autres visent le père, la mère, le mariage, la maladie…` },
  { key:'fortune', terme:'Part de Fortune ⊗', cat:'Points',
    def:`Lot du corps, de la santé et de la fortune matérielle : ce qui vient « sans peine ». Tirée de la distance Soleil–Lune reportée depuis l'Ascendant. Pivot de la <a class="lex" data-lex="zr">libération zodiacale</a>.` },
  { key:'noeuds', terme:'Nœuds lunaires ☊☋', cat:'Points',
    def:`Points où l'orbite de la Lune croise l'écliptique. Tête du Dragon (nœud nord) : là où les choses s'augmentent ; Queue du Dragon (nœud sud) : là où elles se dissipent. DEMAIN donne le nœud moyen et le nœud vrai.` },
  { key:'etoiles', terme:'Étoiles fixes', cat:'Points',
    def:`Étoiles remarquables (Aldébaran, Régulus, Spica, Antarès…) qui, conjointes à un astre ou un angle, infléchissent fortement le thème. Les <a class="lex" data-lex="parans">parans</a> en sont l'usage le plus ancien.` },
  { key:'parans', terme:'Parans', cat:'Points',
    def:`Méthode (Bernadette Brady, héritée des anciens) : une étoile et une planète touchent chacune un angle (Orient, Couchant, MC, FC) le même jour. Lien plus subtil que la simple conjonction de longitude.` },
  { key:'demeures', terme:'Demeures lunaires', cat:'Points',
    def:`Division du zodiaque en 28 « stations » de la Lune (manâzil), tradition arabe. La demeure occupée par la Lune nuance son action, surtout en élection et en magie astrale.` },

  // --- Prévision ---
  { key:'transits', terme:'Transits', cat:'Prévision',
    def:`Position du ciel d'aujourd'hui rapportée au thème natal : quand une planète actuelle forme un aspect à un astre de naissance, elle « active » ce point. On suit surtout les lentes (Mars, Jupiter, Saturne).` },
  { key:'profections', terme:'Profections annuelles', cat:'Prévision',
    def:`À chaque anniversaire, l'Ascendant avance d'un signe (et d'une maison). Le maître du signe profecté devient le <b>seigneur de l'année</b> : c'est lui qu'on observe en priorité (son état natal, ses transits).` },
  { key:'firdaria', terme:'Firdaria', cat:'Prévision',
    def:`Système perse de « seigneurs du temps » : la vie est partagée en grandes périodes planétaires (ordre selon la secte), elles-mêmes subdivisées. Le seigneur en cours teinte la période.` },
  { key:'zr', terme:'Libération zodiacale', cat:'Prévision',
    def:`Aphesis de Valens : on « libère » des périodes en partant d'un lot (Fortune pour le corps/les circonstances, Esprit pour l'action). Périodes emboîtées (années, mois, jours) avec des <b>pics</b> et le « dénouement du lien ». La grande technique de timing hellénistique.` },
  { key:'revolutions', terme:'Révolutions (retours)', cat:'Prévision',
    def:`Carte dressée au moment où un astre revient à son degré natal : <b>révolution solaire</b> (chaque anniversaire — carte de l'année), <b>révolution lunaire</b> (chaque mois). Cadre l'année ou le mois à venir.` },
  { key:'directions', terme:'Directions primaires', cat:'Prévision',
    def:`La plus ancienne technique de timing : on « dirige » les points du thème par le mouvement diurne du ciel (clé ≈ 1° = 1 an). Quand un astre atteint un angle ou un aspect, l'événement mûrit. Exigeante et prestigieuse.` },
  { key:'profmensuelle', terme:'Profection mensuelle & quotidienne', cat:'Prévision',
    def:`Affinage de la <a class="lex" data-lex="profections">profection annuelle</a> : à l'intérieur de l'année, l'Ascendant profecté avance encore d'un signe par mois (et d'un par ~2,5 jours), désignant un seigneur du mois et du jour.` },

  // --- Mondiale & boursière ---
  { key:'mondiale', terme:'Astrologie mondiale', cat:'Mondiale & boursière',
    def:`L'astrologie des collectivités (nations, villes, époques) plutôt que des individus. Elle lit les <a class="lex" data-lex="ingres">ingrès</a>, <a class="lex" data-lex="lunaison">lunaisons</a>, <a class="lex" data-lex="eclipse">éclipses</a> et <a class="lex" data-lex="mutation">grandes conjonctions</a>. Brahy en fut un maître reconnu.` },
  { key:'ingres', terme:'Ingrès solaire', cat:'Mondiale & boursière',
    def:`Entrée du Soleil dans un signe cardinal (surtout 0° Bélier, l'équinoxe de printemps). La carte dressée à cet instant pour une capitale est l'<b>horoscope de l'année</b> du pays — son climat, ses tensions, son maître.` },
  { key:'lunaison', terme:'Lunaisons', cat:'Mondiale & boursière',
    def:`Nouvelles et pleines lunes. La nouvelle lune sème (un cycle d'un mois), la pleine lune récolte et révèle. En mondial, la lunaison qui précède un événement en colore le climat.` },
  { key:'eclipse', terme:'Éclipses', cat:'Mondiale & boursière',
    def:`Lunaisons puissantes alignées sur les <a class="lex" data-lex="noeuds">nœuds</a>. Solaire : un changement de tête, un nouveau départ ; lunaire : un aboutissement, une révélation publique. Le signe touché indique le domaine accentué pour ~6 mois.` },
  { key:'mutation', terme:'Grande conjonction & mutation', cat:'Mondiale & boursière',
    def:`Conjonction Jupiter–Saturne, tous les ~20 ans : elle ouvre un chapitre historique. Tous les ~200 ans elle change d'<a class="lex" data-lex="elements">élément</a> (la « grande mutation ») et marque un tournant de civilisation — la série d'Air a débuté en 2020.` },
  { key:'boursiere', terme:'Astrologie boursière', cat:'Mondiale & boursière',
    def:`Spécialité de Brahy : corréler les configurations célestes — surtout les <a class="lex" data-lex="tensions">aspects durs</a> — aux fluctuations des marchés. Outil d'étude historique et heuristique, jamais un conseil financier.` },
  { key:'barometre', terme:'Baromètre des aspects', cat:'Mondiale & boursière',
    def:`Synthèse de la « pression » céleste du jour : aspects durs (Saturne, Mars) = tension, repli ; aspects doux (Jupiter, Vénus) = confiance, reprise. Une jauge à lire comme une tendance d'ambiance, non comme une prévision.` },

  // --- Avancé ---
  { key:'antiscia', terme:'Antiscia', cat:'Avancé',
    def:`Points « miroirs » d'un astre par rapport à l'axe des solstices (Cancer–Capricorne) ou des équinoxes (Bélier–Balance). Deux astres en antiscia ont un lien caché, très utilisé en médiéval et en horaire.` },
  { key:'declinaisons', terme:'Déclinaisons & parallèles', cat:'Avancé',
    def:`Hauteur d'un astre par rapport à l'équateur. Deux astres à même déclinaison sont en <b>parallèle</b> (≈ conjonction) ; à déclinaisons opposées, en <b>contre-parallèle</b> (≈ opposition). Au-delà de ~23°27′ : <b>hors-limites</b> (out of bounds).` },
  { key:'hyleg', terme:'Hyleg & Alcocoden', cat:'Avancé',
    def:`Le hyleg (« donneur de vie ») et son maître (alcocoden) servaient à juger la robustesse vitale et, jadis, la longévité. DEMAIN les donne comme <b>témoignage symbolique de vitalité</b>, jamais comme une prédiction de durée de vie.` },
  { key:'horaire', terme:'Astrologie horaire', cat:'Avancé',
    def:`On dresse le thème de l'instant où une question est posée, et on y lit la réponse : le consultant = maître de l'Ascendant, la chose demandée = maître de sa maison, la Lune témoigne. Des « considérations » disent si le thème est jugeable.` },
  { key:'electionnel', terme:'Astrologie électionnelle', cat:'Avancé',
    def:`L'inverse de l'horaire : choisir le meilleur moment pour entreprendre (mariage, voyage, signature…), en soignant la Lune, le maître de l'Ascendant et en évitant les empêchements.` },
];

/* ----------------------------- COURS PROGRESSIF ----------------------------- */
const see = (sub,label)=>`<button class="see" type="button" data-see="${sub}">${label||'Voir dans votre thème'} →</button>`;
const cours = [
  { niveau:1, titre:'Niveau 1 — Les fondations', lecons:[
    { id:'1-1', titre:'Qu\'est-ce qu\'un thème astral ?', html:
      `<p>Un <a class="lex" data-lex="theme">thème astral</a> est la photographie du ciel à l'instant et au lieu d'une naissance (ou de tout événement). On y note <b>où</b> se trouvait chaque astre dans le <a class="lex" data-lex="zodiaque">zodiaque</a>, dans quelle <a class="lex" data-lex="maisons">maison</a>, et quels <a class="lex" data-lex="aspects">aspects</a> les astres formaient entre eux.</p>
      <p>Tout le reste de l'astrologie consiste à <b>lire</b> cette carte. Trois questions guident la lecture : un astre, dans quel <b>signe</b> (le comment), dans quelle <b>maison</b> (le domaine de vie), et en <b>relation</b> avec qui (les aspects) ?</p>
      <p>DEMAIN calcule tout cela en temps réel, dans votre navigateur, selon la tradition des <a class="lex" data-lex="anciens">anciens</a>.</p>
      ${see('natal-portrait','Voir le Portrait de votre thème')}` },
    { id:'1-2', titre:'Le zodiaque et les douze signes', html:
      `<p>Le <a class="lex" data-lex="zodiaque">zodiaque</a> est la route du Soleil dans le ciel (l'<a class="lex" data-lex="ecliptique">écliptique</a>), partagée en douze secteurs égaux de 30° : les <a class="lex" data-lex="signes">douze signes</a>, du Bélier aux Poissons.</p>
      <p>Chaque signe combine un <a class="lex" data-lex="elements">élément</a> (Feu, Terre, Air, Eau) et un <a class="lex" data-lex="modes">mode</a> (Cardinal, Fixe, Mutable). Par exemple le Bélier est <i>Feu cardinal</i> : un élan qui démarre ; le Taureau, <i>Terre fixe</i> : un ancrage qui dure.</p>
      <p>Un astre « prend la couleur » du signe qu'il occupe : Mars en Bélier agit avec fougue, Mars en Cancer, par à-coups protecteurs.</p>` },
    { id:'1-3', titre:'Les sept astres et ce qu\'ils représentent', html:
      `<p>L'astrologie traditionnelle emploie <a class="lex" data-lex="astres">sept astres</a>, chacun figurant une fonction de la vie :</p>
      <ul class="liste">
      <li><b>☉ Soleil</b> — l'élan vital, l'identité, le but.</li>
      <li><b>☽ Lune</b> — les émotions, le corps, le quotidien.</li>
      <li><b>☿ Mercure</b> — l'esprit, la parole, les échanges.</li>
      <li><b>♀ Vénus</b> — l'amour, le plaisir, le goût.</li>
      <li><b>♂ Mars</b> — le désir, l'énergie, le combat.</li>
      <li><b>♃ Jupiter</b> — la foi, l'abondance, le jugement.</li>
      <li><b>♄ Saturne</b> — le temps, la limite, la rigueur.</li>
      </ul>
      <p>Le Soleil et la Lune sont les <a class="lex" data-lex="luminaires">luminaires</a> ; Vénus et Jupiter, les <a class="lex" data-lex="benefiques">bénéfiques</a> ; Mars et Saturne, les maléfiques ; Mercure est neutre.</p>
      ${see('natal-astres','Voir vos sept astres délinéés')}` },
    { id:'1-4', titre:'L\'Ascendant, le Milieu du Ciel et les maisons', html:
      `<p>Le ciel tourne : à l'instant de la naissance, un degré précis se levait à l'orient — c'est l'<a class="lex" data-lex="ascendant">Ascendant</a>, la porte d'entrée du thème et la façon dont on aborde la vie. Au plus haut culminait le <a class="lex" data-lex="mc">Milieu du Ciel</a>, sommet de la vocation.</p>
      <p>À partir de l'Ascendant, le ciel local se divise en <a class="lex" data-lex="maisons">douze maisons</a>, douze domaines de l'existence : la I<sup>re</sup> le corps et la vie, la VII<sup>e</sup> l'union, la X<sup>e</sup> le métier, etc. Là où le signe dit le <i>comment</i>, la maison dit le <i>où</i>.</p>
      ${see('natal-maisons','Voir vos douze maisons')}` },
  ]},
  { niveau:2, titre:'Niveau 2 — Les forces en présence', lecons:[
    { id:'2-1', titre:'Éléments, modes et tempérament', html:
      `<p>Regroupez les astres par <a class="lex" data-lex="elements">élément</a> et par <a class="lex" data-lex="modes">mode</a> : la <a class="lex" data-lex="balances">balance</a> qui s'en dégage donne le climat général d'un thème. Beaucoup de Feu : on agit ; beaucoup d'Eau : on ressent ; de Terre : on construit ; d'Air : on relie.</p>
      <p>Les anciens en tiraient le <a class="lex" data-lex="temperament">tempérament</a> (sanguin, colérique, mélancolique, flegmatique) — une véritable « météo intérieure » de la personne.</p>
      ${see('natal-forces','Voir vos dominantes et votre tempérament')}` },
    { id:'2-2', titre:'Les aspects : comment les astres se parlent', html:
      `<p>Deux astres « se parlent » quand ils forment un angle remarquable : les cinq <a class="lex" data-lex="aspects">aspects</a> ptolémaïques.</p>
      <ul class="liste">
      <li><b>☌ Conjonction</b> (0°) — fusion.</li>
      <li><b>⚹ Sextile</b> (60°) & <b>△ Trigone</b> (120°) — <a class="lex" data-lex="harmoniques">harmonie</a>, facilité.</li>
      <li><b>□ Carré</b> (90°) & <b>☍ Opposition</b> (180°) — <a class="lex" data-lex="tensions">tension</a>, dynamisme.</li>
      </ul>
      <p>On tolère une marge, l'<a class="lex" data-lex="orbe">orbe</a> ; et l'on distingue l'aspect qui se forme (<a class="lex" data-lex="application">appliquant</a> : à venir) de celui qui se défait (séparant : passé).</p>
      ${see('natal-aspects','Voir vos aspects et configurations')}` },
    { id:'2-3', titre:'Les dignités : un astre est-il « chez lui » ?', html:
      `<p>Un même astre n'a pas la même force partout. Les <a class="lex" data-lex="dignites">dignités essentielles</a> mesurent s'il est « chez lui » : en <a class="lex" data-lex="domicile">domicile</a> (pleinement maître), en <a class="lex" data-lex="exaltation">exaltation</a> (honoré), en <a class="lex" data-lex="triplicite">triplicité</a>, dans sa <a class="lex" data-lex="bornes">borne</a> ou sa face — ou au contraire en exil ou en chute.</p>
      <p>C'est la grammaire de l'astrologie traditionnelle : Vénus en Taureau (domicile) tient ses promesses ; Vénus en Vierge (chute) peine à donner son meilleur.</p>
      ${see('natal-forces','Voir le détail de vos dignités')}` },
    { id:'2-4', titre:'La secte : thème de jour, thème de nuit', html:
      `<p>Détail capital et souvent oublié : la <a class="lex" data-lex="secte">secte</a>. Si le Soleil est au-dessus de l'horizon, le thème est <b>diurne</b> ; sinon <b>nocturne</b>. Les astres de jour (Soleil, Jupiter, Saturne) sont plus à l'aise de jour, ceux de nuit (Lune, Vénus, Mars) la nuit.</p>
      <p>La secte tempère même les maléfiques : un Saturne de jour ou un Mars de nuit « dans leur secte » sont bien plus civilisés. Le <a class="lex" data-lex="hayz">hayz</a> est leur condition idéale.</p>` },
  ]},
  { niveau:3, titre:'Niveau 3 — Lire un thème', lecons:[
    { id:'3-1', titre:'Le maître de l\'Ascendant et l\'almutén', html:
      `<p>Pour saisir une vie d'un regard, on cherche le <a class="lex" data-lex="maitre">maître de l'Ascendant</a> : la planète qui gouverne le signe levant. Sa condition (signe, maison, dignité, aspects) raconte la trajectoire d'ensemble.</p>
      <p>Plus subtil, l'<a class="lex" data-lex="almuten">almutén de la géniture</a> totalise les dignités sur les points vitaux du thème : c'est le « régent » général, l'astre qui a le plus voix au chapitre.</p>` },
    { id:'3-2', titre:'Les configurations d\'aspects', html:
      `<p>Quand plusieurs astres s'enchaînent, ils forment des <a class="lex" data-lex="configurations">configurations</a> qui structurent le caractère : le <b>grand trigone</b> (un don qui coule de source), le <b>T-carré</b> (une tension concentrée sur un astre-sommet, grand moteur), la <b>grande croix</b> (quatre exigences en équilibre), l'<b>amas</b> (un domaine de vie surinvesti).</p>
      ${see('natal-aspects','Repérer vos configurations')}` },
    { id:'3-3', titre:'Les lots et la Part de Fortune', html:
      `<p>Les <a class="lex" data-lex="lots">lots</a> (ou parts arabes) sont des points calculés qui pointent un thème précis. Le plus important, la <a class="lex" data-lex="fortune">Part de Fortune</a>, marque le lieu du corps, de la santé et de la prospérité ; la Part de l'Esprit, celui de l'action volontaire.</p>
      <p>D'autres lots visent le père, la mère, le mariage… DEMAIN affiche leurs formules en toute transparence.</p>
      ${see('natal-lots','Voir vos lots')}` },
  ]},
  { niveau:4, titre:'Niveau 4 — Prévoir, selon les anciens', lecons:[
    { id:'4-1', titre:'Transits : le ciel qui passe', html:
      `<p>Les <a class="lex" data-lex="transits">transits</a> sont la technique la plus connue : le ciel d'aujourd'hui rejoint un point de votre thème et l'« active ». On suit surtout les planètes lentes ; un même transit a une <b>fenêtre</b> (entrée, exact, sortie), parfois en triple passage à cause des rétrogradations.</p>
      ${see('natal-previsions','Voir vos transits à venir')}` },
    { id:'4-2', titre:'Profections : le seigneur de l\'année', html:
      `<p>Technique reine, simple et puissante : à chaque anniversaire, l'Ascendant « se profecte » d'un signe. Le maître de ce signe devient le <a class="lex" data-lex="profections">seigneur de l'année</a> — l'astre à surveiller, dont les transits comptent double.</p>
      <p>On affine au mois et au jour. Une année « régie » par Jupiter ne se vit pas comme une année de Saturne.</p>
      ${see('natal-previsions','Voir votre seigneur de l\'année')}` },
    { id:'4-3', titre:'Firdaria, libération zodiacale, révolutions', html:
      `<p>Les anciens disposaient de plusieurs « horloges » de la vie : les <a class="lex" data-lex="firdaria">firdaria</a> (grandes périodes planétaires perses), la <a class="lex" data-lex="zr">libération zodiacale</a> (la grande technique hellénistique, qui déroule des chapitres depuis la Part de Fortune ou de l'Esprit), et les <a class="lex" data-lex="revolutions">révolutions</a> solaire et lunaire (cartes de l'année et du mois).</p>
      ${see('natal-previsions','Explorer vos prévisions traditionnelles')}` },
    { id:'4-4', titre:'Directions primaires', html:
      `<p>La plus ancienne et la plus exigeante : les <a class="lex" data-lex="directions">directions primaires</a> font « monter » les points du thème par la rotation du ciel, à raison d'environ un degré par an. Quand un astre atteint un angle ou perfectionne un aspect, l'événement mûrit. DEMAIN en propose une première version aux angles.</p>` },
  ]},
  { niveau:5, titre:'Niveau 5 — L\'érudition', lecons:[
    { id:'5-1', titre:'Étoiles fixes et parans', html:
      `<p>Au-delà des planètes, les <a class="lex" data-lex="etoiles">étoiles fixes</a> conjointes à un astre ou un angle marquent profondément un thème (Régulus le pouvoir, Algol la violence…). Leur usage le plus ancien, les <a class="lex" data-lex="parans">parans</a>, relie une étoile et une planète touchant chacune un angle le jour de la naissance.</p>
      ${see('natal-etoiles','Voir vos étoiles et parans')}` },
    { id:'5-2', titre:'Antiscia et déclinaisons : hors du zodiaque', html:
      `<p>Deux couches discrètes mais puissantes : les <a class="lex" data-lex="antiscia">antiscia</a> (points miroirs autour des solstices/équinoxes — des liens cachés) et les <a class="lex" data-lex="declinaisons">déclinaisons</a> (parallèles et hors-limites), qui ajoutent des relations qu'aucun aspect zodiacal ne montre.</p>
      ${see('natal-avance','Voir l\'onglet Avancé')}` },
    { id:'5-3', titre:'Horaire et électionnel', html:
      `<p>L'astrologie ne sert pas qu'à décrire une naissance. L'<a class="lex" data-lex="horaire">astrologie horaire</a> répond à une question précise par le thème de l'instant où elle est posée ; l'<a class="lex" data-lex="electionnel">astrologie électionnelle</a> choisit le meilleur moment pour agir. Ce sont des arts traditionnels à part entière.</p>` },
    { id:'5-4', titre:'Hyleg, alcocoden et prudence', html:
      `<p>Les anciens jugeaient la vitalité par le <a class="lex" data-lex="hyleg">hyleg</a> (donneur de vie) et son maître, l'alcocoden. DEMAIN les présente comme un <b>témoignage symbolique de robustesse</b> — jamais comme une prédiction de durée de vie. L'astrologie éclaire des tendances ; elle « incline, mais ne contraint point ».</p>` },
    { id:'5-5', titre:'Monomoiria & douzième-partie', html:
      `<p>Pour les plus exigeants : la <a class="lex" data-lex="dignites">gouvernance</a> descend jusqu'au degré. La <b>monomoiria</b> attribue un maître à chaque degré ; la <b>douzième-partie</b> (dodécatémorie) projette un degré dans un micro-signe, révélant une « sous-position » du point. Couches savantes, marqueurs de sérieux.</p>
      ${see('natal-avance','Voir l\'onglet Avancé')}` },
  ]},
  { niveau:6, titre:'Niveau 6 — Astrologie mondiale & boursière', lecons:[
    { id:'6-1', titre:'Qu\'est-ce que l\'astrologie mondiale ?', html:
      `<p>L'<a class="lex" data-lex="mondiale">astrologie mondiale</a> (ou mondaine) ne regarde plus l'individu mais les <b>collectivités</b> : nations, villes, économies, époques. Elle fut le grand domaine de Brahy. On n'y lit pas une naissance unique mais des <b>cartes du ciel collectives</b> : ingrès des saisons, lunaisons, éclipses, et le lent battement des planètes lentes.</p>
      ${see('mond-monde','Voir le ciel mondial')}` },
    { id:'6-2', titre:'Ingrès, lunaisons et éclipses', html:
      `<p>Trois horloges du monde. L'<a class="lex" data-lex="ingres">ingrès du Bélier</a> (équinoxe de printemps) dresse l'<b>horoscope de l'année</b> d'un pays : son Ascendant et son maître donnent le climat des douze mois. Les <a class="lex" data-lex="lunaison">lunaisons</a> rythment les mois. Les <a class="lex" data-lex="eclipse">éclipses</a>, enfin, ouvrent des cycles de six mois et frappent le signe qu'elles touchent.</p>
      ${see('mond-cycles','Voir les cycles & éclipses')}` },
    { id:'6-3', titre:'Les grandes conjonctions et les âges du monde', html:
      `<p>Le cycle-roi de l'astrologie mondiale est la <a class="lex" data-lex="mutation">grande conjonction</a> de Jupiter et Saturne, tous les ~20 ans : elle scande l'histoire politique et économique. Tous les ~200 ans, elle change d'<a class="lex" data-lex="elements">élément</a> — la « grande mutation », véritable changement d'ère. Nous sommes entrés dans la série d'<b>Air</b> en 2020 (réseaux, information, finance dématérialisée).</p>
      ${see('mond-cycles','Voir la grande conjonction')}` },
    { id:'6-4', titre:'L\'astrologie boursière de Brahy', html:
      `<p>Gustave‑Lambert Brahy, expert‑comptable devenu astrologue, fut un <b>pionnier de l'<a class="lex" data-lex="boursiere">astrologie boursière</a></b>. Il corrélait les <a class="lex" data-lex="tensions">aspects durs</a> entre planètes aux retournements des marchés : Saturne pour les contractions, Jupiter pour les expansions, Mars pour la volatilité. Sa revue <i>Demain</i> publiait des prévisions économiques suivies dans toute l'Europe.</p>
      <p class="sm">Note : DEMAIN en propose une lecture <b>historique et heuristique</b>, fidèle à son esprit — jamais un conseil financier.</p>` },
    { id:'6-5', titre:'Lire le baromètre et les dates sensibles', html:
      `<p>Le <a class="lex" data-lex="barometre">baromètre</a> agrège la « pression » céleste du jour : dominante d'aspects durs = climat tendu (prudence) ; d'aspects doux = climat porteur (confiance). Les <b>dates sensibles</b> sont les jours où un aspect majeur se perfectionne exactement — les « nœuds » du calendrier que Brahy surveillait. On les lit comme des <b>fenêtres d'ambiance</b>, à croiser avec le réel.</p>
      ${see('mond-boursiere','Voir le baromètre boursier')}` },
  ]},
];

window.DEMAIN_COURS = { lexique, cours };
})();
