#!/usr/bin/env node
// Génère sitemap.xml avec lastmod basé sur la date de modif réelle de chaque fichier.
// Usage : node scripts/generate-sitemap.js
// À lancer avant chaque déploiement Vercel.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASE_URL = 'https://www.pulsework.app';
const OUTPUT = path.join(ROOT, 'sitemap.xml');

// Pages exclues du sitemap (noindex, internes, vérification, prospection)
const EXCLUDE = new Set([
  'dashboard.html',
  '404.html',
  'google99f7135c8d8a1617.html',
  'email-followup-alfa-laval.html',
]);

function listHtml(dir, prefix = '') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'scripts') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'blog' || entry.name === 'offsite-content') {
        // blog/ est inclus, offsite-content NON (privé)
        if (entry.name === 'blog') out.push(...listHtml(full, prefix + entry.name + '/'));
      }
    } else if (entry.isFile() && entry.name.endsWith('.html') && !EXCLUDE.has(entry.name)) {
      const stat = fs.statSync(full);
      out.push({
        path: prefix + entry.name,
        mtime: stat.mtime,
      });
    }
  }
  return out;
}

function urlFor(p) {
  // Page d'accueil = url racine
  if (p === 'index.html') return BASE_URL + '/';
  return BASE_URL + '/' + p;
}

function fmtDate(d) {
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

const pages = listHtml(ROOT);

// Tri : index d'abord, puis pages racine alpha, puis blog/* alpha
pages.sort((a, b) => {
  if (a.path === 'index.html') return -1;
  if (b.path === 'index.html') return 1;
  const aBlog = a.path.startsWith('blog/');
  const bBlog = b.path.startsWith('blog/');
  if (aBlog && !bBlog) return 1;
  if (!aBlog && bBlog) return -1;
  return a.path.localeCompare(b.path);
});

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...pages.map(p => [
    '  <url>',
    `    <loc>${urlFor(p.path)}</loc>`,
    `    <lastmod>${fmtDate(p.mtime)}</lastmod>`,
    '  </url>',
  ].join('\n')),
  '</urlset>',
  '',
].join('\n');

fs.writeFileSync(OUTPUT, xml);
console.log(`✓ sitemap.xml généré : ${pages.length} URLs`);
console.log(`  → ${OUTPUT}`);

// Aperçu des 5 dernières modifs
const recent = [...pages].sort((a, b) => b.mtime - a.mtime).slice(0, 5);
console.log('\n  Pages les plus récentes :');
recent.forEach(p => console.log(`    ${fmtDate(p.mtime)}  ${p.path}`));
