/* ============================================================
   BOÎTE À IDÉES FDJ UNITED — Données de démonstration.

   Cette couche remplace l'API : elle expose exactement la forme
   attendue par l'application (stats, ideas[], myVoteId...).
   Quand un backend existera, seul ce fichier est à remplacer par
   un appel réseau qui renvoie la même structure.

   Les six concepts de jeu sont INVENTÉS et doivent le rester :
   aucun nom de jeu réellement commercialisé ne doit apparaître.
   ============================================================ */
(function () {
  "use strict";

  /* Motifs de vignette : SVG géométriques abstraits, traits blancs sur
     l'aplat de la couleur du ticket. `right` et `bottom` sont négatifs :
     le motif déborde et se fait rogner par le bandeau. */
  var PATTERNS = {
    deuxCercles: {
      width: 150, height: 150, viewBox: "0 0 120 120", right: -24, bottom: -40, opacity: .28,
      shapes: '<circle cx="42" cy="60" r="30" stroke="#fff" stroke-width="2"/>' +
              '<circle cx="78" cy="60" r="30" stroke="#fff" stroke-width="2"/>'
    },
    grilleNeuf: {
      width: 140, height: 140, viewBox: "0 0 110 110", right: -16, bottom: -38, opacity: .28,
      shapes: '<rect x="10" y="10" width="26" height="26" stroke="#fff" stroke-width="2"/>' +
              '<rect x="42" y="10" width="26" height="26" stroke="#fff" stroke-width="2"/>' +
              '<rect x="74" y="10" width="26" height="26" stroke="#fff" stroke-width="2"/>' +
              '<rect x="10" y="42" width="26" height="26" stroke="#fff" stroke-width="2"/>' +
              '<rect x="42" y="42" width="26" height="26" stroke="#fff" stroke-width="2"/>' +
              '<rect x="74" y="42" width="26" height="26" stroke="#fff" stroke-width="2"/>' +
              '<rect x="10" y="74" width="26" height="26" stroke="#fff" stroke-width="2"/>' +
              '<rect x="42" y="74" width="26" height="26" stroke="#fff" stroke-width="2"/>' +
              '<rect x="74" y="74" width="26" height="26" stroke="#fff" stroke-width="2"/>'
    },
    ondes: {
      width: 150, height: 150, viewBox: "0 0 120 120", right: -26, bottom: -42, opacity: .3,
      shapes: '<circle cx="60" cy="60" r="18" stroke="#fff" stroke-width="2"/>' +
              '<circle cx="60" cy="60" r="34" stroke="#fff" stroke-width="2"/>' +
              '<circle cx="60" cy="60" r="50" stroke="#fff" stroke-width="2"/>'
    },
    grilleBarree: {
      width: 150, height: 140, viewBox: "0 0 120 110", right: -20, bottom: -34, opacity: .28,
      shapes: '<path d="M10 20h100M10 48h100M10 76h100M32 6v98M60 6v98M88 6v98" stroke="#fff" stroke-width="1.6"/>' +
              '<path d="M18 12 104 92" stroke="#fff" stroke-width="3" stroke-linecap="round"/>'
    },
    arcs: {
      width: 170, height: 150, viewBox: "0 0 130 110", right: -24, bottom: -30, opacity: .32,
      shapes: '<path d="M4 78c22-46 46-62 62-62s40 16 62 62" stroke="#fff" stroke-width="2"/>' +
              '<path d="M16 88c20-38 40-52 50-52s30 14 50 52" stroke="#fff" stroke-width="2"/>' +
              '<path d="M30 98c16-30 30-42 36-42s20 12 36 42" stroke="#fff" stroke-width="2"/>'
    },
    auvent: {
      width: 150, height: 130, viewBox: "0 0 120 100", right: -18, bottom: -30, opacity: .28,
      shapes: '<path d="M8 34h104M8 34l14-20h76l14 20" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>' +
              '<path d="M8 34v52h104V34" stroke="#fff" stroke-width="2"/>' +
              '<path d="M30 34v52M60 34v52M90 34v52" stroke="#fff" stroke-width="1.6"/>'
    }
  };

  var IDEAS = [
    {
      id: "cap-ou-pas-cap",
      name: "Cap ou pas cap",
      color: "var(--ticket-1)",
      pattern: PATTERNS.deuxCercles,
      price: 2,
      universe: "Symboles et chance",
      format: "both",
      pitch: "Deux chances sur le même ticket, et le droit de changer d'avis jusqu'au bout.",
      mechanic: "On gratte deux zones et on garde la meilleure.",
      mechanicLong: "Le ticket propose deux zones à gratter et une seule compte. Le joueur ouvre la première, découvre ce qu'elle contient, puis décide de la garder ou de tenter la seconde sans retour possible.",
      why: "J'aime les jeux où l'on a une décision à prendre. Ici le hasard reste entier, mais le joueur choisit à quel moment il s'arrête, et c'est ce petit moment d'hésitation qui rend le ticket mémorable.",
      author: { name: "Léa Fournier", company: "FDJ Gaming Solutions", avatarUrl: null },
      submittedAt: "2026-08-27",
      supportCount: 84,
      supportedByMe: false
    },
    {
      id: "terroirs",
      name: "Terroirs",
      color: "var(--ticket-2)",
      pattern: PATTERNS.grilleNeuf,
      price: 3,
      universe: "Patrimoine et impact",
      format: "retail",
      pitch: "Un tour de France à gratter chez son buraliste, une région mise à l'honneur à chaque série.",
      mechanic: "Neuf symboles de régions à aligner.",
      mechanicLong: "Une grille de neuf cases porte les symboles d'une région. Aligner trois symboles identiques fait gagner. Chaque série met une nouvelle région à l'honneur, avec ses propres illustrations.",
      why: "Je passe mes journées avec les buralistes et ils me parlent tous de leur territoire. Un jeu qui change de région à chaque série leur donne quelque chose à raconter à leurs clients.",
      author: { name: "Camille Béchu", company: "FDJ Réseau", avatarUrl: null },
      submittedAt: "2026-08-19",
      supportCount: 71,
      supportedByMe: false
    },
    {
      id: "seconde-vie",
      name: "Seconde vie",
      color: "var(--ticket-3)",
      pattern: PATTERNS.ondes,
      price: 5,
      universe: "Patrimoine et impact",
      format: "both",
      pitch: "Jouer et financer un projet près de chez soi, la cause soutenue étant choisie par les joueurs.",
      pitchLong: "Jouer et financer un projet près de chez soi. Les joueurs choisissent eux-mêmes la cause soutenue chaque trimestre.",
      mechanic: "Une part des recettes va au projet le plus voté.",
      mechanicLong: "Trois zones à gratter, une combinaison gagnante classique. Sur chaque ticket, une part fixe des recettes est fléchée vers un projet local. Le joueur découvre en fin de partie le projet auquel il vient de contribuer.",
      why: "Sur le terrain, on me demande souvent où va l'argent. Je voulais un jeu qui réponde à cette question sans discours, directement dans l'expérience. C'est aussi une façon de rendre visible ce que le Groupe fait déjà.",
      author: { name: "Antoine Rivet", company: "FDJ United France", avatarUrl: null },
      submittedAt: "2026-08-12",
      supportCount: 66,
      supportedByMe: false
    },
    {
      id: "mots-meles-express",
      name: "Mots mêlés express",
      color: "var(--ticket-4)",
      pattern: PATTERNS.grilleBarree,
      price: 2,
      universe: "Mots et lettres",
      format: "online",
      pitch: "Un jeu de tête plutôt qu'un jeu de chance, pour une pause de trente secondes.",
      mechanic: "Une grille de lettres à résoudre avant la fin du temps.",
      mechanicLong: "Une petite grille de lettres cache trois mots. Le joueur les repère en trente secondes, et le nombre de mots trouvés détermine le résultat du ticket.",
      why: "Les jeux de lettres réunissent des gens qui ne joueraient jamais à autre chose. Le format court en ligne me paraît la bonne porte d'entrée pour eux.",
      author: { name: "Sofia Almeida", company: "Unibet", avatarUrl: null },
      submittedAt: "2026-08-06",
      supportCount: 58,
      supportedByMe: false
    },
    {
      id: "aurores",
      name: "Aurores",
      color: "var(--ticket-5)",
      pattern: PATTERNS.arcs,
      price: 3,
      universe: "Aventure",
      format: "online",
      pitch: "Un ciel du Nord qui se dévoile à mesure que l'on gratte, en clin d'œil à nos marques suédoises.",
      mechanic: "Trois symboles à révéler sous les aurores.",
      mechanicLong: "Trois symboles sont dissimulés sous un ciel d'aurores boréales. Les révéler tous les trois fait gagner, et le voile se lève un peu plus à chaque zone ouverte.",
      why: "Nous sommes devenus un groupe européen et nos marques du Nord ont un imaginaire fort. Je trouvais dommage de ne pas s'en servir dans nos jeux.",
      author: { name: "Ingrid Halvorsen", company: "Kindred Group", avatarUrl: null },
      submittedAt: "2026-07-30",
      supportCount: 47,
      supportedByMe: false
    },
    {
      id: "le-kiosque",
      name: "Le kiosque",
      color: "var(--ticket-6)",
      pattern: PATTERNS.auvent,
      price: 1,
      universe: "Symboles et chance",
      format: "retail",
      pitch: "Le ticket le plus simple de la gamme, pensé avec les buralistes comme une entrée en douceur.",
      mechanic: "Trois symboles identiques à réunir.",
      mechanicLong: "Une seule zone, trois symboles, une règle que l'on comprend sans lire la notice. Le ticket tient dans la main et se joue au comptoir en quelques secondes.",
      why: "Beaucoup de nos tickets sont devenus complexes. Je voulais reproposer le geste le plus simple possible, celui que l'on explique en une phrase à quelqu'un qui n'a jamais joué.",
      author: { name: "Marek Kowalski", company: "Kindred Group", avatarUrl: null },
      submittedAt: "2026-07-24",
      supportCount: 39,
      supportedByMe: false
    }
  ];

  window.FDJ_DATA = {
    phase: "submission",

    stats: {
      ideaCount: 86,
      voteCount: 1274,
      participatingCompanies: 22,
      totalCompanies: 35
    },

    ideas: IDEAS,

    myVoteId: null,

    deadline: "Les dix idées les plus soutenues passent devant le comité Innovation le 15 octobre.",

    /* Envoi d'un concept. À remplacer par l'appel API réel : la promesse
       qui échoue déclenche le message d'erreur en ligne sous le formulaire.
       L'idée n'est volontairement pas ajoutée à la liste, elle passe
       d'abord par la validation (« Elle apparaîtra dans la liste après
       validation. »). */
    submitIdea: function (brouillon) {
      return Promise.resolve({ status: "pending", draft: brouillon });
    }
  };
})();
