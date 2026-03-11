// ============================================
// Pulse Analytics - Lightweight Tracker v3
// pulsework.app - Direct REST API (no CDN deps)
// ============================================
(function() {
  'use strict';

  var SUPABASE_URL = 'https://iaaeerenmfyatlbtqylp.supabase.co';
  var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhYWVlcmVubWZ5YXRsYnRxeWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMzA5NTMsImV4cCI6MjA4ODgwNjk1M30.TOwlijdWVUYZ3KxTB-c-aMaaJ0WszsxWQCnsvREQr3M';
  var REST = SUPABASE_URL + '/rest/v1/';
  var EXCLUDE_PATHS = ['/dashboard.html'];
  var HEARTBEAT_MS = 30000;

  // Debug logging (set false in production once working)
  var DEBUG = true;
  function log(msg, data) { if (DEBUG) console.log('[Pulse]', msg, data !== undefined ? data : ''); }
  function logErr(msg, data) { if (DEBUG) console.error('[Pulse]', msg, data !== undefined ? data : ''); }

  // Don't track bots
  if (/bot|crawl|spider|slurp|Googlebot/i.test(navigator.userAgent)) return;

  // Don't track excluded paths
  var pagePath = window.location.pathname || '/';
  if (EXCLUDE_PATHS.indexOf(pagePath) !== -1) return;

  log('Init - tracking page:', pagePath);

  // ============================================
  // STANDARD HEADERS (identical to curl test)
  // ============================================
  var HEADERS = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Prefer': 'return=minimal'
  };

  // ============================================
  // REST HELPERS
  // ============================================
  function postRow(table, data) {
    log('POST ' + table);
    return fetch(REST + table, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(data)
    }).then(function(r) {
      log(table + ' POST → ' + r.status);
      if (!r.ok) r.text().then(function(t) { logErr(table + ' POST error body:', t); });
      return r;
    }).catch(function(e) {
      logErr(table + ' POST network error:', e.message);
    });
  }

  function upsertRow(table, data, conflictCol) {
    var upsertHeaders = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Prefer': 'return=minimal,resolution=merge-duplicates'
    };
    var url = REST + table + '?on_conflict=' + conflictCol;
    log('UPSERT ' + table + ' (on_conflict=' + conflictCol + ')');
    return fetch(url, {
      method: 'POST',
      headers: upsertHeaders,
      body: JSON.stringify(data)
    }).then(function(r) {
      log(table + ' UPSERT → ' + r.status);
      if (!r.ok) r.text().then(function(t) { logErr(table + ' UPSERT error body:', t); });
      return r;
    }).catch(function(e) {
      logErr(table + ' UPSERT network error:', e.message);
    });
  }

  function patchRow(table, filter, data, keepalive) {
    var url = REST + table + '?' + filter;
    var opts = {
      method: 'PATCH',
      headers: HEADERS,
      body: JSON.stringify(data)
    };
    if (keepalive) opts.keepalive = true;
    return fetch(url, opts).then(function(r) {
      if (!r.ok && DEBUG) r.text().then(function(t) { logErr(table + ' PATCH error:', t); });
      return r;
    }).catch(function(e) {
      if (DEBUG) logErr(table + ' PATCH network error:', e.message);
    });
  }

  // ============================================
  // DATA HELPERS
  // ============================================
  function generateVisitorId() {
    var components = [
      navigator.userAgent, navigator.language,
      screen.width + 'x' + screen.height, screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || '', navigator.platform || ''
    ];
    var raw = components.join('|');
    var hash = 5381;
    for (var i = 0; i < raw.length; i++) {
      hash = ((hash << 5) + hash) + raw.charCodeAt(i);
      hash = hash & hash;
    }
    return 'v_' + Math.abs(hash).toString(36);
  }

  function getSessionId() {
    var sid = sessionStorage.getItem('pulse_sid');
    if (!sid) {
      sid = 's_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
      sessionStorage.setItem('pulse_sid', sid);
      sessionStorage.setItem('pulse_pc', '0');
    }
    return sid;
  }

  function incrementPageCount() {
    var count = parseInt(sessionStorage.getItem('pulse_pc') || '0') + 1;
    sessionStorage.setItem('pulse_pc', count.toString());
    return count;
  }

  function getUTMParams() {
    var params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source') || '',
      utm_medium: params.get('utm_medium') || '',
      utm_campaign: params.get('utm_campaign') || '',
      utm_term: params.get('utm_term') || '',
      utm_content: params.get('utm_content') || ''
    };
  }

  function getDeviceType() {
    var w = window.innerWidth;
    if (w <= 768) return 'mobile';
    if (w <= 1024) return 'tablet';
    return 'desktop';
  }

  function getBrowser() {
    var ua = navigator.userAgent;
    if (ua.indexOf('Firefox') > -1) return 'Firefox';
    if (ua.indexOf('Edg') > -1) return 'Edge';
    if (ua.indexOf('OPR') > -1 || ua.indexOf('Opera') > -1) return 'Opera';
    if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) return 'Chrome';
    if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) return 'Safari';
    return 'Other';
  }

  function getOS() {
    var ua = navigator.userAgent;
    if (ua.indexOf('Windows') > -1) return 'Windows';
    if (ua.indexOf('Mac OS') > -1) return 'macOS';
    if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) return 'iOS';
    if (ua.indexOf('Android') > -1) return 'Android';
    if (ua.indexOf('Linux') > -1) return 'Linux';
    return 'Other';
  }

  function getCountryFromTimezone() {
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      var map = {
        'Europe/Paris': 'France', 'Europe/London': 'UK', 'Europe/Berlin': 'Allemagne',
        'Europe/Madrid': 'Espagne', 'Europe/Rome': 'Italie', 'Europe/Brussels': 'Belgique',
        'Europe/Zurich': 'Suisse', 'Europe/Amsterdam': 'Pays-Bas', 'Europe/Lisbon': 'Portugal',
        'Europe/Vienna': 'Autriche', 'Europe/Warsaw': 'Pologne', 'Europe/Prague': 'Tchéquie',
        'Europe/Stockholm': 'Suède', 'Europe/Oslo': 'Norvège', 'Europe/Copenhagen': 'Danemark',
        'Europe/Helsinki': 'Finlande', 'Europe/Dublin': 'Irlande', 'Europe/Bucharest': 'Roumanie',
        'Europe/Luxembourg': 'Luxembourg', 'Europe/Monaco': 'Monaco',
        'America/New_York': 'USA', 'America/Chicago': 'USA', 'America/Denver': 'USA',
        'America/Los_Angeles': 'USA', 'America/Toronto': 'Canada', 'America/Montreal': 'Canada',
        'America/Vancouver': 'Canada', 'America/Mexico_City': 'Mexique',
        'America/Sao_Paulo': 'Brésil', 'America/Argentina/Buenos_Aires': 'Argentine',
        'Asia/Tokyo': 'Japon', 'Asia/Shanghai': 'Chine', 'Asia/Seoul': 'Corée du Sud',
        'Asia/Kolkata': 'Inde', 'Asia/Dubai': 'EAU', 'Asia/Singapore': 'Singapour',
        'Australia/Sydney': 'Australie', 'Pacific/Auckland': 'Nouvelle-Zélande',
        'Africa/Casablanca': 'Maroc', 'Africa/Tunis': 'Tunisie', 'Africa/Algiers': 'Algérie',
        'Africa/Dakar': 'Sénégal', 'Africa/Abidjan': "Côte d'Ivoire"
      };
      return map[tz] || tz.split('/').pop().replace(/_/g, ' ') || 'Inconnu';
    } catch(e) { return 'Inconnu'; }
  }

  function getCleanReferrer() {
    var ref = document.referrer;
    if (!ref) return '';
    try {
      var refUrl = new URL(ref);
      if (refUrl.hostname === window.location.hostname) return '';
      return refUrl.hostname;
    } catch(e) { return ref; }
  }

  // ============================================
  // MAIN TRACKING
  // ============================================
  var visitorId = generateVisitorId();
  var sessionId = getSessionId();
  var pageCount = incrementPageCount();
  var utm = getUTMParams();
  var tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch(e) {}

  log('visitor=' + visitorId + ', session=' + sessionId + ', pageCount=' + pageCount);

  // 1. Record page view
  postRow('page_views', {
    visitor_id: visitorId,
    session_id: sessionId,
    page_url: pagePath,
    page_title: document.title,
    referrer: getCleanReferrer(),
    utm_source: utm.utm_source,
    utm_medium: utm.utm_medium,
    utm_campaign: utm.utm_campaign,
    utm_term: utm.utm_term,
    utm_content: utm.utm_content,
    device_type: getDeviceType(),
    browser: getBrowser(),
    os: getOS(),
    screen_width: screen.width,
    screen_height: screen.height,
    language: navigator.language || '',
    country: getCountryFromTimezone(),
    timezone: tz
  });

  // 2. Session management
  if (pageCount === 1) {
    postRow('sessions', {
      session_id: sessionId,
      visitor_id: visitorId,
      entry_page: pagePath,
      exit_page: pagePath,
      page_count: 1,
      is_bounce: true
    });
  } else {
    patchRow('sessions', 'session_id=eq.' + encodeURIComponent(sessionId), {
      last_seen_at: new Date().toISOString(),
      exit_page: pagePath,
      page_count: pageCount,
      is_bounce: false
    });
  }

  // 3. Active visitor (real-time) — upsert on session_id
  upsertRow('active_visitors', {
    visitor_id: visitorId,
    session_id: sessionId,
    page_url: pagePath,
    page_title: document.title,
    last_seen: new Date().toISOString()
  }, 'session_id');

  // 4. Heartbeat every 30s
  var heartbeat = setInterval(function() {
    patchRow('active_visitors', 'session_id=eq.' + encodeURIComponent(sessionId), {
      page_url: window.location.pathname || '/',
      last_seen: new Date().toISOString()
    });
    patchRow('sessions', 'session_id=eq.' + encodeURIComponent(sessionId), {
      last_seen_at: new Date().toISOString()
    });
  }, HEARTBEAT_MS);

  // 5. Page unload
  function onLeave() {
    clearInterval(heartbeat);
    patchRow('sessions', 'session_id=eq.' + encodeURIComponent(sessionId), {
      last_seen_at: new Date().toISOString(),
      exit_page: window.location.pathname || '/'
    }, true);
  }

  window.addEventListener('pagehide', onLeave);
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') onLeave();
  });

  log('Tracking initialized successfully');
})();
