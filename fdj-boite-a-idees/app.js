/* ============================================================
   BOÎTE À IDÉES FDJ UNITED — Application.

   Vues implémentées : `list` (écran 2) et `detail` (écran 3).
   Les suivantes (`form`, `confirmation`) viendront se brancher
   dans VIEWS sans toucher au reste du fichier.

   L'application vit dans une iframe : elle ne dessine que son
   contenu, ne défile jamais en interne, publie sa hauteur au
   parent à chaque rendu, et lui demande de remonter en haut à
   chaque changement de vue (jamais de scrollIntoView interne).
   ============================================================ */
(function () {
  "use strict";

  /* ---------- État applicatif ---------- */
  var state = {
    loading: true,
    error: null,
    phase: "submission",          // submission | voting
    view: "list",                 // list | detail | form | confirmation
    selectedIdeaId: null,
    ideas: [],
    stats: null,
    myVoteId: null,
    deadline: "",

    // Écran 4 : brouillon du formulaire et erreurs de saisie.
    formDraft: null,
    formErrors: {},
    submitError: null,
    submitting: false
  };

  var root = document.getElementById("app");

  /* ---------- Utilitaires ---------- */

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* Séparateur de milliers et espace avant le symbole monétaire :
     espaces insécables, pour que « 1 274 » et « 2 € » ne soient
     jamais coupés en fin de ligne. */
  function nombre(valeur) {
    return String(Number(valeur)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }

  function prix(valeur) {
    return nombre(valeur) + " €";
  }

  var MOIS = ["janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

  /* « 2026-08-12 » devient « 12 août ». */
  function dateFr(iso) {
    var parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
    if (!parts) return "";
    var jour = Number(parts[3]);
    return (jour === 1 ? "1er" : jour) + " " + MOIS[Number(parts[2]) - 1];
  }

  var FORMATS = {
    online: "En ligne",
    retail: "Point de vente",
    both: "En ligne et point de vente"
  };

  function formatLabel(code) {
    return FORMATS[code] || "";
  }

  /* Les choix du formulaire. Six champs, pas un de plus. */
  var UNIVERS = ["Sport", "Symboles et chance", "Mots et lettres", "Aventure", "Patrimoine et impact"];
  var PRIX = [1, 2, 3, 5, 10];
  var CHOIX_FORMAT = [
    { value: "online", label: "En ligne" },
    { value: "retail", label: "Point de vente" },
    { value: "both", label: "Les deux" }
  ];

  /* Aucun champ facultatif : le handoff les rend tous obligatoires. */
  var REGLES = [
    { champ: "name", message: "Donnez un nom à votre concept." },
    { champ: "universe", message: "Choisissez un univers." },
    { champ: "price", message: "Choisissez un prix du ticket." },
    { champ: "format", message: "Choisissez un format." },
    { champ: "mechanic", message: "Décrivez en une phrase comment on gagne." },
    { champ: "responsibleGamingAccepted", message: "Cochez cette case pour envoyer votre idée." }
  ];

  function brouillonVide() {
    return {
      name: "",
      universe: "",
      price: "",
      format: "",
      mechanic: "",
      responsibleGamingAccepted: false
    };
  }

  function initiales(nom) {
    return String(nom || "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(function (mot) { return mot.charAt(0).toUpperCase(); })
      .join("");
  }

  /* ---------- Icônes (traits fins 1.6 à 1.8, à remplacer par la
     librairie d'icônes cible en conservant les tailles) ---------- */

  function svgTag(taille, classe, attributs, contenu) {
    return '<svg' + (classe ? ' class="' + classe + '"' : "") +
      ' width="' + taille + '" height="' + taille + '" viewBox="0 0 24 24" ' +
      attributs + ' aria-hidden="true" focusable="false">' + contenu + "</svg>";
  }

  var ICONS = {
    // Placeholder : à remplacer par le symbole officiel FDJ United.
    diamant: function (taille) {
      return svgTag(taille, "", "",
        '<circle cx="12" cy="12" r="10.6" fill="none" stroke="currentColor" stroke-width="1.5"/>' +
        '<path d="M12 4.6 18.2 12 12 19.4 5.8 12Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>');
    },
    chevronHaut: function (taille, classe) {
      return svgTag(taille, classe,
        'fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"',
        '<path d="m6 14 6-6 6 6"/>');
    },
    chevronGauche: function (taille, classe) {
      return svgTag(taille, classe,
        'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"',
        '<path d="M14 6 8 12l6 6"/>');
    },
    coche: function (taille, classe, epaisseur) {
      return svgTag(taille, classe,
        'fill="none" stroke="currentColor" stroke-width="' + (epaisseur || 3) +
        '" stroke-linecap="round" stroke-linejoin="round"',
        '<path d="m5 12.5 4.5 4.5L19 7"/>');
    },
    calendrier: function (taille, classe) {
      return svgTag(taille, classe,
        'fill="none" stroke="currentColor" stroke-width="1.7"',
        '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>');
    }
  };

  /* ---------- Composants communs ---------- */

  function introBlock(options) {
    var desactive = options && options.buttonDisabled;
    return '' +
      '<section class="card intro">' +
        '<div class="intro__col">' +
          '<p class="intro__eyebrow">' + ICONS.diamant(15) + "<span>Level up your game</span></p>" +
          '<h1 class="intro__title">Inventez le prochain jeu</h1>' +
          '<p class="intro__text">Nous ne faisons pas que vendre des jeux, nous les réinventons en permanence. ' +
            "Cette fois, c'est à vous. Imaginez un jeu de grattage, en ligne ou chez le buraliste.</p>" +
        "</div>" +
        '<button type="button" class="btn btn--primary' + (desactive ? " is-disabled" : "") + '" ' +
          'data-action="open-form"' + (desactive ? ' tabindex="-1" aria-disabled="true"' : "") + ">Proposer mon idée</button>" +
      "</section>";
  }

  function countersBlock(stats) {
    function compteur(valeur, total, libelleLong, libelleCourt) {
      return '' +
        '<div class="card counter">' +
          '<p class="counter__value">' + esc(valeur) +
            (total ? ' <span class="counter__total">sur ' + esc(total) + "</span>" : "") +
          "</p>" +
          '<p class="counter__label">' +
            '<span class="counter__label--long">' + esc(libelleLong) + "</span>" +
            '<span class="counter__label--short">' + esc(libelleCourt) + "</span>" +
          "</p>" +
        "</div>";
    }

    return '' +
      '<section class="counters" aria-label="Chiffres de la campagne">' +
        compteur(nombre(stats.ideaCount), null, "idées proposées", "idées") +
        compteur(nombre(stats.voteCount), null, "votes exprimés", "votes") +
        compteur(nombre(stats.participatingCompanies), nombre(stats.totalCompanies),
          "sociétés participantes", "sociétés") +
      "</section>";
  }

  function avatar(auteur, taille) {
    var classe = "avatar avatar--" + taille;
    if (auteur.avatarUrl) {
      return '<img class="' + classe + '" src="' + esc(auteur.avatarUrl) + '" alt="" width="' + taille +
        '" height="' + taille + '">';
    }
    return '<span class="' + classe + '" aria-hidden="true">' + esc(initiales(auteur.name)) + "</span>";
  }

  function tag(libelle, grande) {
    return '<span class="tag' + (grande ? " tag--lg" : "") + '">' + esc(libelle) + "</span>";
  }

  /* Le motif de la fiche est celui de la carte, agrandi : les facteurs
     reproduisent exactement les valeurs de la maquette. */
  function motifAgrandi(motif) {
    if (!motif) return null;
    return {
      width: motif.width * 2,
      height: motif.height * 2,
      viewBox: motif.viewBox,
      right: Math.round(motif.right * 1.55),
      bottom: Math.round(motif.bottom * 2.15),
      opacity: .3,
      shapes: motif.shapes
    };
  }

  function motifSvg(motif) {
    if (!motif) return "";
    return '<svg class="ticket__pattern" width="' + motif.width + '" height="' + motif.height +
      '" viewBox="' + esc(motif.viewBox) + '" fill="none" aria-hidden="true" focusable="false" ' +
      'style="right:' + motif.right + "px;bottom:" + motif.bottom + "px;opacity:" + motif.opacity + '">' +
      motif.shapes + "</svg>";
  }

  /* variant : "card" (écran 2) ou "detail" (écran 3). */
  function ticketBanner(idea, variant) {
    var fiche = variant === "detail";
    var motif = fiche ? motifAgrandi(idea.pattern) : idea.pattern;

    var titre = fiche
      ? '<div class="ticket__heading">' +
          '<p class="ticket__universe">' + esc(idea.universe) + "</p>" +
          '<h1 class="ticket__name">' + esc(idea.name) + "</h1>" +
        "</div>"
      : '<h2 class="ticket__name">' +
          '<button type="button" class="idea__open" data-action="open-detail">' + esc(idea.name) + "</button>" +
        "</h2>";

    return '' +
      '<div class="ticket' + (fiche ? " ticket--detail" : "") + '" style="--ticket-color:' + esc(idea.color) + '">' +
        motifSvg(motif) +
        '<span class="ticket__price">' + esc(prix(idea.price)) + "</span>" +
        titre +
      "</div>";
  }

  /* Bouton de soutien. Deux habillages, un seul comportement :
     bascule soutenu / non soutenu, un soutien par personne et par idée. */
  function supportButton(idea, variant) {
    var soutenue = idea.supportedByMe;
    var libelle = soutenue ? "Retirer mon soutien à " + idea.name : "Soutenir " + idea.name;
    var icone = soutenue ? ICONS.coche : ICONS.chevronHaut;
    var commun = 'type="button" data-action="toggle-support" data-id="' + esc(idea.id) + '" ' +
      'data-variant="' + variant + '" aria-pressed="' + (soutenue ? "true" : "false") + '" ' +
      'aria-label="' + esc(libelle) + '"';

    if (variant === "detail") {
      return "<button " + commun + ' class="btn btn--support">' +
        icone(15, "") +
        "<span>Soutenir cette idée</span>" +
        '<span class="btn__count">' + esc(nombre(idea.supportCount)) + "</span>" +
      "</button>";
    }

    return "<button " + commun + ' class="support' + (soutenue ? " is-supported" : "") + '">' +
      icone(13, "support__icon") +
      '<span class="support__count">' + esc(nombre(idea.supportCount)) + "</span>" +
    "</button>";
  }

  /* ---------- Écran 2 : carte d'idée ---------- */

  function ideaCard(idea) {
    return '' +
      '<article class="card idea" data-id="' + esc(idea.id) + '" data-action="open-detail">' +
        ticketBanner(idea, "card") +
        '<div class="idea__body">' +
          '<p class="idea__pitch">' + esc(idea.pitch) + "</p>" +
          '<p class="idea__mechanic">' +
            '<span class="idea__mechanic-label">Mécanique</span>' +
            '<span class="idea__mechanic-text">' + esc(idea.mechanic) + "</span>" +
          "</p>" +
          '<p class="idea__tags">' + tag(idea.universe) + tag(formatLabel(idea.format)) + "</p>" +
          '<div class="divider"></div>' +
          '<div class="idea__footer">' +
            avatar(idea.author, 28) +
            '<span class="idea__author">' + esc(idea.author.name) +
              '<span class="idea__company">' + esc(idea.author.company) + "</span>" +
            "</span>" +
            supportButton(idea, "card") +
          "</div>" +
        "</div>" +
      "</article>";
  }

  function footnoteBlock(ideas, deadline) {
    var top = ideas
      .slice()
      .sort(function (a, b) { return b.supportCount - a.supportCount; })
      .slice(0, 3);

    var lignes = top.map(function (idea, index) {
      return '' +
        '<li class="footnote__row">' +
          '<span class="footnote__rank">' + (index + 1) + "</span>" +
          '<span class="footnote__name">' + esc(idea.name) + "</span>" +
          '<span class="footnote__count">' + esc(nombre(idea.supportCount)) + "</span>" +
        "</li>";
    }).join("");

    return '' +
      '<section class="card footnote">' +
        '<div class="footnote__col">' +
          '<h2 class="footnote__title">Les idées les plus soutenues cette semaine</h2>' +
          '<ol class="footnote__list">' + lignes + "</ol>" +
        "</div>" +
        '<div class="footnote__sep" aria-hidden="true"></div>' +
        '<div class="footnote__aside">' +
          '<p class="footnote__eyebrow">' + ICONS.calendrier(15) + "<span>Prochaine échéance</span></p>" +
          '<p class="footnote__text">' + esc(deadline) + "</p>" +
        "</div>" +
      "</section>";
  }

  /* ---------- États de chargement et d'erreur ---------- */

  function skeletonCard() {
    return '' +
      '<article class="card idea idea--skeleton" aria-hidden="true">' +
        '<div class="skeleton skeleton--ticket"></div>' +
        '<div class="idea__body">' +
          '<div class="skeleton skeleton--line"></div>' +
          '<div class="skeleton skeleton--line is-short"></div>' +
          '<div class="divider"></div>' +
          '<div class="skeleton skeleton--line is-short"></div>' +
        "</div>" +
      "</article>";
  }

  function loadingView() {
    var cartes = "";
    for (var i = 0; i < 6; i++) cartes += skeletonCard();
    return '' +
      introBlock() +
      '<p class="u-visually-hidden" role="status">Chargement des idées</p>' +
      '<section class="ideas">' + cartes + "</section>";
  }

  function errorView(message) {
    return '' +
      introBlock() +
      '<section class="card footnote"><div class="footnote__col">' +
        '<h2 class="footnote__title">Les idées n\'ont pas pu être chargées</h2>' +
        '<p class="footnote__text">' + esc(message) + "</p>" +
      "</div></section>";
  }

  /* ---------- Écran 4 : champs du formulaire ---------- */

  function erreurDe(champ) {
    var message = state.formErrors[champ];
    return message
      ? '<p class="field__error" id="erreur-' + champ + '">' + esc(message) + "</p>"
      : "";
  }

  /* Relie le champ à son message d'erreur pour les lecteurs d'écran. */
  function decritPar(champ) {
    return state.formErrors[champ]
      ? ' aria-invalid="true" aria-describedby="erreur-' + champ + '"'
      : "";
  }

  function classeChamp(champ, extra) {
    return "field" + (extra ? " " + extra : "") + (state.formErrors[champ] ? " is-invalid" : "");
  }

  function textField(champ, libelle, placeholder) {
    return '' +
      '<div class="' + classeChamp(champ) + '">' +
        '<label class="field__label" for="champ-' + champ + '">' + esc(libelle) + "</label>" +
        '<input class="input" type="text" id="champ-' + champ + '" name="' + champ + '" ' +
          'placeholder="' + esc(placeholder) + '" value="' + esc(state.formDraft[champ]) + '"' +
          decritPar(champ) + ">" +
        erreurDe(champ) +
      "</div>";
  }

  function textareaField(champ, libelle, placeholder) {
    return '' +
      '<div class="' + classeChamp(champ) + '">' +
        '<label class="field__label" for="champ-' + champ + '">' + esc(libelle) + "</label>" +
        '<textarea class="textarea" id="champ-' + champ + '" name="' + champ + '" rows="3" ' +
          'placeholder="' + esc(placeholder) + '"' + decritPar(champ) + ">" +
          esc(state.formDraft[champ]) +
        "</textarea>" +
        erreurDe(champ) +
      "</div>";
  }

  /* Puces à plat : de vrais boutons radio, donc navigables aux flèches
     et jamais un menu déroulant qui dépasserait du cadre de l'iframe. */
  function choiceField(champ, libelle, options) {
    var puces = options.map(function (option, index) {
      var id = "choix-" + champ + "-" + index;
      var coche = String(state.formDraft[champ]) === String(option.value);
      return '' +
        '<span class="choice">' +
          '<input class="choice__input" type="radio" id="' + id + '" name="' + champ + '" ' +
            'value="' + esc(option.value) + '"' + (coche ? " checked" : "") + decritPar(champ) + ">" +
          '<label class="choice__label" for="' + id + '">' + esc(option.label) + "</label>" +
        "</span>";
    }).join("");

    return '' +
      '<fieldset class="' + classeChamp(champ, "field--group") + '">' +
        '<legend class="field__label">' + esc(libelle) + "</legend>" +
        '<div class="choices">' + puces + "</div>" +
        erreurDe(champ) +
      "</fieldset>";
  }

  function checkboxField(champ, texte) {
    var coche = state.formDraft[champ] === true;
    return '' +
      '<div class="' + classeChamp(champ) + '">' +
        '<label class="check">' +
          '<input class="check__input" type="checkbox" name="' + champ + '"' +
            (coche ? " checked" : "") + decritPar(champ) + ">" +
          '<span class="check__box">' + ICONS.coche(11, "", 3.2) + "</span>" +
          '<span class="check__text">' + esc(texte) + "</span>" +
        "</label>" +
        erreurDe(champ) +
      "</div>";
  }

  /* ---------- Vues ---------- */

  var VIEWS = {
    // Écran 2 : liste des idées.
    list: function () {
      var cartes = state.ideas.map(ideaCard).join("");
      return '' +
        introBlock() +
        countersBlock(state.stats) +
        '<section class="ideas" aria-label="Les concepts proposés">' + cartes + "</section>" +
        footnoteBlock(state.ideas, state.deadline);
    },

    // Écran 3 : fiche d'une idée, à la place de la grille.
    detail: function () {
      var idea = findIdea(state.selectedIdeaId);
      if (!idea) {                        // idée introuvable : on revient à la liste
        state.view = "list";
        state.selectedIdeaId = null;
        return VIEWS.list();
      }

      return '' +
        '<p><button type="button" class="back" data-action="back-to-list">' +
          ICONS.chevronGauche(14) + "<span>Retour à la liste des idées</span>" +
        "</button></p>" +

        '<article class="card detail">' +
          ticketBanner(idea, "detail") +
          '<div class="detail__body">' +
            '<p class="detail__pitch">' + esc(idea.pitchLong || idea.pitch) + "</p>" +

            '<p class="detail__tags">' +
              tag(idea.universe, true) +
              tag(formatLabel(idea.format), true) +
              tag("Ticket à " + prix(idea.price), true) +
            "</p>" +

            '<div class="detail__cols">' +
              '<div class="detail__col">' +
                '<h2 class="detail__label">La mécanique</h2>' +
                '<p class="detail__text">' + esc(idea.mechanicLong || idea.mechanic) + "</p>" +
              "</div>" +
              '<div class="detail__col">' +
                '<h2 class="detail__label">Pourquoi ce jeu</h2>' +
                '<p class="detail__text">' + esc(idea.why) + "</p>" +
              "</div>" +
            "</div>" +

            '<div class="divider"></div>' +

            '<div class="detail__footer">' +
              avatar(idea.author, 38) +
              '<span class="detail__author">' + esc(idea.author.name) +
                '<span class="detail__meta">' + esc(idea.author.company) +
                  ", proposé le " + esc(dateFr(idea.submittedAt)) + "</span>" +
              "</span>" +
              supportButton(idea, "detail") +
            "</div>" +
          "</div>" +
        "</article>";
    },

    // Écran 4 : formulaire, à la place de la grille. Le bloc d'introduction
    // reste visible, son bouton passe en retrait.
    form: function () {
      var prixOptions = PRIX.map(function (valeur) {
        return { value: valeur, label: prix(valeur) };
      });
      var universOptions = UNIVERS.map(function (libelle) {
        return { value: libelle, label: libelle };
      });

      return '' +
        introBlock({ buttonDisabled: true }) +

        '<form class="card form" novalidate>' +
          '<h2 class="form__title">Votre concept de jeu</h2>' +

          textField("name", "Nom du jeu", "Court et marquant") +
          choiceField("universe", "Univers", universOptions) +
          choiceField("price", "Prix du ticket", prixOptions) +
          choiceField("format", "Format", CHOIX_FORMAT) +
          textareaField("mechanic", "Mécanique du jeu",
            "Comment on gagne, en une phrase. Trois lignes maximum.") +
          checkboxField("responsibleGamingAccepted",
            "Mon concept respecte les engagements du Groupe en matière de jeu responsable.") +

          '<div class="form__actions">' +
            '<button type="submit" class="btn btn--primary' +
              (state.submitting ? " is-disabled" : "") + '">Envoyer mon idée</button>' +
            '<button type="button" class="btn btn--secondary" data-action="cancel-form">Annuler</button>' +
          "</div>" +

          (state.submitError
            ? '<p class="form__error" role="alert">' + esc(state.submitError) + "</p>"
            : "") +
        "</form>";
    },

    // Écran 5 : confirmation après envoi.
    confirmation: function () {
      return '' +
        introBlock() +
        '<section class="card confirm">' +
          '<span class="confirm__badge">' + ICONS.coche(22, "", 2.2) + "</span>" +
          '<div class="confirm__col">' +
            '<h2 class="confirm__title">Votre idée est enregistrée.</h2>' +
            '<p class="confirm__text">Elle apparaîtra dans la liste après validation.</p>' +
            '<button type="button" class="link link--spaced" data-action="back-to-list">' +
              "Retour à la liste des idées</button>" +
          "</div>" +
        "</section>";
    }
  };

  /* ---------- Rendu ---------- */

  function render() {
    var contenu;

    if (state.loading) {
      contenu = loadingView();
    } else if (state.error) {
      contenu = errorView(state.error);
    } else {
      contenu = (VIEWS[state.view] || VIEWS.list)();
    }

    root.className = "app app--" + state.view;
    root.innerHTML = contenu;

    var zone = root.querySelector(".textarea");
    if (zone) ajusterHauteur(zone);

    publishHeight();
  }

  /* Change de vue : le contenu remplace le précédent dans le flux, et on
     demande au parent de remonter en haut de l'iframe. */
  function goTo(view, ideaId) {
    if (view === "list") resetForm();       // on ne garde pas un brouillon abandonné
    state.view = view;
    state.selectedIdeaId = ideaId || null;
    render();
    requestScrollTop();

    var titre = root.querySelector("h1");
    if (titre) {                          // le focus suit la vue, pour le clavier
      titre.setAttribute("tabindex", "-1");
      titre.focus({ preventScroll: true });
    }
  }

  /* ---------- Intégration iframe : publication de la hauteur ---------- */

  function mesurerHauteur() {
    return Math.ceil(Math.max(
      document.documentElement.getBoundingClientRect().height,
      document.documentElement.scrollHeight,
      document.body ? document.body.scrollHeight : 0
    ));
  }

  function publishHeight() {
    if (window.parent === window) return;

    var hauteur = mesurerHauteur();

    /* Un onglet en arrière-plan, un panneau replié ou une iframe pas encore
       peinte mesurent zéro : publier cette valeur ferait disparaître
       l'application chez l'hôte. On se tait, et on republie quand la page
       redevient visible. */
    if (!hauteur) return;

    window.parent.postMessage({ type: "resize", height: hauteur }, "*");
  }

  function watchHeight() {
    // La hauteur change aussi quand la page redevient visible et quand les
    // polices finissent de charger.
    document.addEventListener("visibilitychange", publishHeight);
    window.addEventListener("pageshow", publishHeight);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(publishHeight);
    }

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", publishHeight);
      return;
    }
    new ResizeObserver(publishHeight).observe(document.documentElement);
  }

  /* Demande au parent de remonter en haut de l'iframe (jamais de
     scrollIntoView : le défilement appartient à la page hôte). */
  function requestScrollTop() {
    if (window.parent === window) return;
    window.parent.postMessage({ type: "scrollToTop" }, "*");
  }

  /* ---------- Interactions ---------- */

  function findIdea(id) {
    for (var i = 0; i < state.ideas.length; i++) {
      if (state.ideas[i].id === id) return state.ideas[i];
    }
    return null;
  }

  /* Mise à jour optimiste : le compteur bouge tout de suite, seul le bouton
     est repeint pour ne pas reconstruire la page sous le curseur. */
  function toggleSupport(id, bouton) {
    var idea = findIdea(id);
    if (!idea) return;

    var variant = bouton.getAttribute("data-variant");

    idea.supportedByMe = !idea.supportedByMe;
    idea.supportCount += idea.supportedByMe ? 1 : -1;

    bouton.outerHTML = supportButton(idea, variant);
    var nouveau = root.querySelector('[data-action="toggle-support"][data-id="' + id + '"]');
    if (nouveau) nouveau.focus();

    // Le classement « cette semaine » suit les soutiens en cours.
    var encadre = root.querySelector(".footnote");
    if (encadre) encadre.outerHTML = footnoteBlock(state.ideas, state.deadline);

    publishHeight();
  }

  /* ---------- Écran 4 : saisie, validation, envoi ---------- */

  function resetForm() {
    state.formDraft = brouillonVide();
    state.formErrors = {};
    state.submitError = null;
    state.submitting = false;
  }

  /* La zone de texte grandit avec son contenu : l'iframe n'a jamais
     de zone de défilement interne. */
  function ajusterHauteur(zone) {
    zone.style.height = "auto";
    // scrollHeight ignore les bordures : sans elles, il resterait deux
    // pixels de défilement interne dans la zone.
    var bordures = zone.offsetHeight - zone.clientHeight;
    zone.style.height = (zone.scrollHeight + bordures) + "px";
  }

  /* La saisie ne redessine rien : elle alimente seulement le brouillon,
     sinon le champ perdrait le focus à chaque caractère. */
  function onFieldInput(event) {
    var champ = event.target.name;
    if (!champ || !(champ in state.formDraft)) return;

    if (event.target.type === "checkbox") {
      state.formDraft[champ] = event.target.checked;
    } else if (champ === "price") {
      state.formDraft[champ] = Number(event.target.value);
    } else {
      state.formDraft[champ] = event.target.value;
    }

    if (event.target.classList.contains("textarea")) {
      ajusterHauteur(event.target);
      publishHeight();
    }
  }

  function valider() {
    var erreurs = {};
    REGLES.forEach(function (regle) {
      var valeur = state.formDraft[regle.champ];
      var vide = valeur === "" || valeur === null || valeur === undefined || valeur === false ||
        (typeof valeur === "string" && !valeur.trim());
      if (vide) erreurs[regle.champ] = regle.message;
    });
    return erreurs;
  }

  function focusPremiereErreur() {
    for (var i = 0; i < REGLES.length; i++) {
      if (state.formErrors[REGLES[i].champ]) {
        var champ = root.querySelector('[name="' + REGLES[i].champ + '"]');
        if (champ) champ.focus();
        return;
      }
    }
  }

  function envoyer(brouillon) {
    if (window.FDJ_DATA && typeof window.FDJ_DATA.submitIdea === "function") {
      return window.FDJ_DATA.submitIdea(brouillon);
    }
    return Promise.resolve();
  }

  function onSubmit(event) {
    event.preventDefault();
    if (state.submitting) return;

    state.formErrors = valider();
    state.submitError = null;

    if (Object.keys(state.formErrors).length) {
      render();
      focusPremiereErreur();
      return;
    }

    state.submitting = true;
    render();

    envoyer(state.formDraft).then(function () {
      state.submitting = false;
      goTo("confirmation");
    }).catch(function () {
      state.submitting = false;
      state.submitError = "Votre idée n'a pas pu être envoyée. Réessayez dans un instant.";
      render();
    });
  }

  function onClick(event) {
    var cible = event.target.closest("[data-action]");
    if (!cible) return;

    var action = cible.getAttribute("data-action");

    if (action === "toggle-support") {
      toggleSupport(cible.getAttribute("data-id"), cible);
      return;
    }

    if (action === "open-detail") {
      var porteur = cible.closest("[data-id]");
      if (porteur) goTo("detail", porteur.getAttribute("data-id"));
      return;
    }

    if (action === "open-form") {
      goTo("form");
      return;
    }

    if (action === "cancel-form" || action === "back-to-list") {
      goTo("list");
    }
  }

  /* ---------- Chargement des données ---------- */

  function load() {
    return Promise.resolve(window.FDJ_DATA).then(function (donnees) {
      if (!donnees) throw new Error("Données indisponibles.");
      state.phase = donnees.phase;
      state.stats = donnees.stats;
      state.ideas = donnees.ideas;
      state.myVoteId = donnees.myVoteId;
      state.deadline = donnees.deadline;
      state.loading = false;
    }).catch(function (erreur) {
      state.loading = false;
      state.error = "Rechargez la page dans un instant. (" + erreur.message + ")";
    });
  }

  /* ---------- Démarrage ---------- */

  function init() {
    resetForm();
    root.addEventListener("click", onClick);
    root.addEventListener("input", onFieldInput);
    root.addEventListener("change", onFieldInput);
    root.addEventListener("submit", onSubmit);
    watchHeight();
    render();                       // squelettes
    load().then(render);            // contenu
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Exposé pour les écrans suivants et pour le débogage en démo.
  window.FDJ_APP = { state: state, render: render, goTo: goTo };
})();
