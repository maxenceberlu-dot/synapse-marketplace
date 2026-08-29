/**
 * Lanceur d'applications Pulse — bouton « 9 points » commun à toutes les apps.
 *
 * Source unique : pour ajouter ou renommer une app, modifier le tableau APPS
 * ci-dessous. Les pages n'ont qu'à charger ce script et posséder un `.nav-left`.
 *
 * Usage :  <script src="/app-launcher.js" defer></script>
 */
(function () {
  "use strict";

  const APPS = [
    {
      nom: "CRM",
      desc: "Pipeline & leads",
      href: "/crm.html",
      couleur: "#6c5ce7",
      icone: '<path d="M3 4.5h18l-7 8v6.5l-4 2v-8.5l-7-8z"/>',
    },
    {
      nom: "Facturation",
      desc: "Devis & factures",
      href: "https://pulse-facturation.vercel.app",
      couleur: "#a29bfe",
      icone: '<path d="M14 2.5H6.5v19h11V8z"/><path d="M14 2.5V8h5"/><path d="M9.5 13h5M9.5 16.5h3.5"/>',
    },
    {
      nom: "Analytics",
      desc: "Trafic du site",
      href: "/dashboard.html",
      couleur: "#00cec9",
      icone: '<path d="M4.5 20.5v-7M12 20.5V4M19.5 20.5v-10"/>',
    },
    {
      nom: "To-Do",
      desc: "Tâches & points",
      href: "/todo.html",
      couleur: "#fd79a8",
      icone: '<circle cx="12" cy="12" r="9"/><path d="M8.2 12.4l2.6 2.6 5-5.4"/>',
    },
    {
      nom: "Site web",
      desc: "pulsework.app",
      href: "/",
      couleur: "#fdcb6e",
      icone: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.4 2.4 3.6 5.4 3.6 9s-1.2 6.6-3.6 9c-2.4-2.4-3.6-5.4-3.6-9S9.6 5.4 12 3z"/>',
    },
  ];

  /* ---------- Styles (injectés une seule fois) ---------- */
  const CSS = `
    .pl-launcher { position: relative; display: flex; align-items: center; }
    .pl-trigger {
      display: grid; grid-template-columns: repeat(3, 4px); gap: 3px;
      padding: 9px; border-radius: 10px; cursor: pointer;
      background: transparent; border: 1px solid transparent;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .pl-trigger span {
      width: 4px; height: 4px; border-radius: 50%;
      background: var(--text-secondary, rgba(240,240,245,0.6));
      transition: background 0.25s;
    }
    .pl-trigger:hover, .pl-trigger[aria-expanded="true"] {
      background: var(--glass, rgba(255,255,255,0.04));
      border-color: var(--glass-border, rgba(255,255,255,0.08));
    }
    .pl-trigger:hover span, .pl-trigger[aria-expanded="true"] span {
      background: var(--text-primary, #f0f0f5);
    }
    .pl-trigger:focus-visible { outline: 2px solid var(--accent-1, #6c5ce7); outline-offset: 2px; }

    .pl-panel {
      position: absolute; top: calc(100% + 10px); left: 0; z-index: 500;
      width: 330px; padding: 10px;
      background: rgba(12, 12, 20, 0.92);
      backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--glass-border, rgba(255,255,255,0.08));
      border-radius: 16px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.55);
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px;
      opacity: 0; visibility: hidden; transform: translateY(-6px) scale(0.97);
      transition: opacity 0.2s, transform 0.2s, visibility 0.2s;
    }
    .pl-panel.pl-open { opacity: 1; visibility: visible; transform: translateY(0) scale(1); }

    .pl-item {
      display: flex; flex-direction: column; align-items: center; gap: 7px;
      padding: 14px 6px; border-radius: 12px; text-decoration: none;
      color: var(--text-secondary, rgba(240,240,245,0.6));
      transition: background 0.2s, color 0.2s;
      position: relative;
    }
    .pl-item:hover { background: rgba(255,255,255,0.06); color: var(--text-primary, #f0f0f5); }
    .pl-item[aria-current="page"] { background: rgba(108, 92, 231, 0.16); color: var(--text-primary, #f0f0f5); }
    .pl-item svg { width: 26px; height: 26px; }
    .pl-nom { font-size: 0.78rem; font-weight: 600; line-height: 1.1; text-align: center; }
    .pl-desc { font-size: 0.62rem; opacity: 0.55; text-align: center; line-height: 1.2; }

    @media (max-width: 420px) { .pl-panel { width: min(300px, 88vw); } }
    @media (prefers-reduced-motion: reduce) {
      .pl-panel, .pl-trigger, .pl-item { transition: none; }
    }
  `;

  function injecterStyles() {
    if (document.getElementById("pl-styles")) return;
    const s = document.createElement("style");
    s.id = "pl-styles";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /** L'app courante : compare le nom de fichier (la racine = le site). */
  function estCourante(href) {
    const page = location.pathname.split("/").pop() || "index.html";
    if (href === "/") return page === "index.html" || page === "";
    if (href.startsWith("http")) return false; // autre domaine : jamais « courante » ici
    return href.replace("/", "") === page;
  }

  function construire() {
    injecterStyles();

    const ancre = document.querySelector(".nav-left");
    if (!ancre || ancre.querySelector(".pl-launcher")) return;

    const wrap = document.createElement("div");
    wrap.className = "pl-launcher";

    const bouton = document.createElement("button");
    bouton.className = "pl-trigger";
    bouton.type = "button";
    bouton.setAttribute("aria-label", "Applications Pulse");
    bouton.setAttribute("aria-expanded", "false");
    bouton.setAttribute("aria-haspopup", "true");
    bouton.innerHTML = "<span></span>".repeat(9);

    const panneau = document.createElement("div");
    panneau.className = "pl-panel";
    panneau.setAttribute("role", "menu");
    panneau.innerHTML = APPS.map((a) => {
      const courante = estCourante(a.href);
      return `
        <a class="pl-item" href="${a.href}" role="menuitem"
           ${courante ? 'aria-current="page"' : ""}
           ${a.href.startsWith("http") || a.href === "/" ? 'target="_blank" rel="noopener"' : ""}
 >
          <svg viewBox="0 0 24 24" fill="none" stroke="${a.couleur}" stroke-width="1.7"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${a.icone}</svg>
          <span class="pl-nom">${a.nom}</span>
          <span class="pl-desc">${a.desc}</span>
        </a>`;
    }).join("");

    wrap.appendChild(bouton);
    wrap.appendChild(panneau);
    ancre.insertBefore(wrap, ancre.firstChild);

    const basculer = (ouvrir) => {
      panneau.classList.toggle("pl-open", ouvrir);
      bouton.setAttribute("aria-expanded", String(ouvrir));
    };

    bouton.addEventListener("click", (e) => {
      e.stopPropagation();
      basculer(!panneau.classList.contains("pl-open"));
    });
    document.addEventListener("click", (e) => {
      if (!wrap.contains(e.target)) basculer(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && panneau.classList.contains("pl-open")) {
        basculer(false);
        bouton.focus();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", construire);
  } else {
    construire();
  }
})();
