// ============================================
// Pulse Analytics - Lightweight Tracker
// pulsework.app
// ============================================
(function() {
  'use strict';

  // CONFIGURATION - Replace with your Supabase credentials
  var CONFIG = {
    supabaseUrl: 'https://iaaeerenmfyatlbtqylp.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhYWVlcmVubWZ5YXRsYnRxeWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMzA5NTMsImV4cCI6MjA4ODgwNjk1M30.TOwlijdWVUYZ3KxTB-c-aMaaJ0WszsxWQCnsvREQr3M',
    heartbeatInterval: 30000,
    excludePaths: ['/dashboard.html']
  };

  // Don't track if config not set
  if (CONFIG.supabaseUrl === 'YOUR_SUPABASE_URL') return;

  // Don't track bots
  if (/bot|crawl|spider|slurp|Googlebot/i.test(navigator.userAgent)) return;

  // Don't track excluded paths
  var pagePath = window.location.pathname || '/';
  if (CONFIG.excludePaths.indexOf(pagePath) !== -1) return;

  // ============================================
  // VISITOR FINGERPRINT (anonymous, no cookies)
  // ============================================
  function generateVisitorId() {
    var components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || '',
      navigator.platform || ''
    ];
    var raw = components.join('|');
    var hash = 5381;
    for (var i = 0; i < raw.length; i++) {
      hash = ((hash << 5) + hash) + raw.charCodeAt(i);
      hash = hash & hash;
    }
    return 'v_' + Math.abs(hash).toString(36);
  }

  // ============================================
  // SESSION MANAGEMENT
  // ============================================
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

  // ============================================
  // DATA COLLECTION
  // ============================================
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
        'Africa/Dakar': 'Sénégal', 'Africa/Abidjan': 'Côte d\'Ivoire'
      };
      return map[tz] || tz.split('/').pop().replace(/_/g, ' ') || 'Inconnu';
    } catch(e) {
      return 'Inconnu';
    }
  }

  function getCleanReferrer() {
    var ref = document.referrer;
    if (!ref) return '';
    try {
      var refUrl = new URL(ref);
      if (refUrl.hostname === window.location.hostname) return '';
      return refUrl.hostname;
    } catch(e) {
      return ref;
    }
  }

  // ============================================
  // SUPABASE REST API
  // ============================================
  function apiCall(method, table, data, query) {
    var url = CONFIG.supabaseUrl + '/rest/v1/' + table;
    if (query) url += '?' + query;
    var headers = {
      'Content-Type': 'application/json',
      'apikey': CONFIG.supabaseAnonKey,
      'Authorization': 'Bearer ' + CONFIG.supabaseAnonKey
    };
    if (method === 'POST') {
      headers['Prefer'] = 'resolution=merge-duplicates,return=minimal';
    } else {
      headers['Prefer'] = 'return=minimal';
    }
    return fetch(url, {
      method: method,
      headers: headers,
      body: data ? JSON.stringify(data) : undefined
    }).catch(function() {});
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

  // 1. Record page view
  apiCall('POST', 'page_views', {
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
    apiCall('POST', 'sessions', {
      session_id: sessionId,
      visitor_id: visitorId,
      entry_page: pagePath,
      exit_page: pagePath,
      page_count: 1,
      is_bounce: true
    });
  } else {
    apiCall('PATCH', 'sessions', {
      last_seen_at: new Date().toISOString(),
      exit_page: pagePath,
      page_count: pageCount,
      is_bounce: false
    }, 'session_id=eq.' + encodeURIComponent(sessionId));
  }

  // 3. Active visitor (real-time)
  apiCall('POST', 'active_visitors', {
    visitor_id: visitorId,
    session_id: sessionId,
    page_url: pagePath,
    page_title: document.title,
    last_seen: new Date().toISOString()
  });

  // 4. Heartbeat every 30s
  var heartbeat = setInterval(function() {
    apiCall('PATCH', 'active_visitors', {
      page_url: window.location.pathname || '/',
      last_seen: new Date().toISOString()
    }, 'session_id=eq.' + encodeURIComponent(sessionId));

    apiCall('PATCH', 'sessions', {
      last_seen_at: new Date().toISOString()
    }, 'session_id=eq.' + encodeURIComponent(sessionId));
  }, CONFIG.heartbeatInterval);

  // 5. Page unload
  function onLeave() {
    clearInterval(heartbeat);
    var sessionUrl = CONFIG.supabaseUrl + '/rest/v1/sessions?session_id=eq.' + encodeURIComponent(sessionId);
    var payload = JSON.stringify({
      last_seen_at: new Date().toISOString(),
      exit_page: window.location.pathname || '/'
    });
    try {
      fetch(sessionUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CONFIG.supabaseAnonKey,
          'Authorization': 'Bearer ' + CONFIG.supabaseAnonKey,
          'Prefer': 'return=minimal'
        },
        body: payload,
        keepalive: true
      }).catch(function() {});
    } catch(e) {}
  }

  window.addEventListener('pagehide', onLeave);
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') onLeave();
  });

})();
