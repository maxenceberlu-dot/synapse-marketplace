/**
 * Thème Pulse — clair par défaut, bascule vers le sombre.
 *
 * À charger dans le <head> SANS defer : le thème doit être posé avant le
 * premier rendu, sinon la page s'affiche brièvement en sombre puis bascule
 * (effet de clignotement désagréable).
 *
 * Le choix du visiteur est mémorisé dans son navigateur et s'applique
 * ensuite à toutes les pages du site.
 */
(function () {
  "use strict";

  var CLE = "pulse-theme";

  /** Pose le thème sur <html> : c'est lui qui pilote toutes les couleurs. */
  function appliquer(theme) {
    document.documentElement.setAttribute("data-theme", theme);
  }

  // ── 1. Thème initial, avant le premier rendu ──
  var choix;
  try {
    choix = localStorage.getItem(CLE);
  } catch (e) {
    choix = null; // navigation privée ou stockage bloqué : on garde le défaut
  }
  // Clair par défaut : seul un choix explicite « dark » affiche le sombre.
  appliquer(choix === "dark" ? "dark" : "light");

  // ── 2. Bouton de bascule, une fois le document prêt ──
  function brancher() {
    var bouton = document.getElementById("themeToggle");
    if (!bouton || bouton.dataset.pulseTheme) return;
    bouton.dataset.pulseTheme = "1"; // évite un double branchement

    bouton.addEventListener("click", function () {
      var actuel = document.documentElement.getAttribute("data-theme");
      var suivant = actuel === "dark" ? "light" : "dark";
      appliquer(suivant);
      try {
        localStorage.setItem(CLE, suivant);
      } catch (e) {
        /* stockage indisponible : la bascule vaut pour cette page seulement */
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", brancher);
  } else {
    brancher();
  }
})();
