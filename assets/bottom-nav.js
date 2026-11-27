/* App-style bottom navigation for phones (shown under 760px). Shared by every page. */
(function () {
  var isHome = !document.body.classList.contains('sub');
  var P = isHome ? '' : 'index.html';
  var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  var I = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
    visit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="m10 8.5 5 3.5-5 3.5z" fill="currentColor"/></svg>',
    prayer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.3-9.4A5 5 0 0 1 12 6a5 5 0 0 1 9.3 5.6C19.5 16.4 12 21 12 21z"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="19" cy="12" r="1.4" fill="currentColor"/></svg>',
    arrow: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>'
  };
  var MEDIA = [
    ['gallery.html', 'Photo gallery', 'Moments from church life'],
    ['videos.html', 'Videos & sermons', 'Messages and worship'],
    ['podcast.html', 'Podcast', 'Reach The Destiny'],
    ['magazines.html', 'Magazines & newsletters', 'Free in Tamil and Sinhala'],
    ['news.html', 'News & events', 'What\u2019s coming up']
  ];
  var ABOUT = [
    [P + '#about', 'About GMI', 'Who we are'],
    ['pastors.html', 'Pastors & leaders', 'Everyone who serves at GMI'],
    ['beliefs.html', 'What we believe', 'Our statement of faith'],
    ['locations.html', 'Locations', 'Kuwait City, Fahaheel, Bethel'],
    ['testimonies.html', 'Testimonies', 'Stories of God at work'],
    ['achievements.html', 'Achievements', 'Milestones since 1990']
  ];
  var CONNECT = [
    ['salvation.html', 'Road to salvation', 'Begin a life with Jesus'],
    ['ministries.html', 'Ministries', 'Find your place'],
    ['counselling.html', 'Counselling', 'Book a session with Rev. Jeyanthy'],
    ['give.html', 'Giving', 'Tithes and offerings'],
    ['worship.html', 'Worship resources', 'For the worship team'],
    ['login.html', 'Member login', 'Members area: your details'],
    [P + '#contact', 'Contact', '+965 5563 8119 \u00b7 Admin@gmi-church.org']
  ];
  var isMedia = MEDIA.some(function (m) { return m[0] === here; });
  var isMore = ABOUT.concat(CONNECT).some(function (m) { return m[0] === here; });

  function esc(t) { var d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
  function list(items) {
    return items.map(function (m) {
      var cur = m[0] === here ? ' aria-current="page"' : '';
      return '<a class="sheet-link" href="' + m[0] + '"' + cur + '><span><b>' + esc(m[1]) + '</b><small>' + esc(m[2]) + '</small></span>' + I.arrow + '</a>';
    }).join('');
  }

  var nav = document.createElement('nav');
  nav.className = 'bnav';
  nav.setAttribute('aria-label', 'Quick navigation');
  nav.innerHTML =
    '<a class="bnav-item" data-key="home" href="' + (isHome ? '#top' : 'index.html') + '">' + I.home + '<span>Home</span></a>' +
    '<a class="bnav-item" data-key="visit" href="visit.html">' + I.visit + '<span>I\u2019m new</span></a>' +
    '<button class="bnav-item" type="button" data-key="media" data-sheet="sheet-media" aria-haspopup="dialog" aria-expanded="false">' + I.media + '<span>Media</span></button>' +
    '<a class="bnav-item" data-key="prayer" href="' + P + '#prayer">' + I.prayer + '<span>Prayer</span></a>' +
    '<button class="bnav-item" type="button" data-key="more" data-sheet="sheet-more" aria-haspopup="dialog" aria-expanded="false">' + I.more + '<span>More</span></button>';

  var scrim = document.createElement('div');
  scrim.className = 'sheet-scrim';
  scrim.hidden = true;

  function sheet(id, title, body) {
    var s = document.createElement('div');
    s.className = 'sheet'; s.id = id; s.hidden = true;
    s.setAttribute('role', 'dialog'); s.setAttribute('aria-modal', 'true'); s.setAttribute('aria-label', title);
    s.innerHTML = '<span class="sheet-handle" aria-hidden="true"></span><div class="sheet-head"><b>' + esc(title) + '</b><button class="sheet-close" type="button" aria-label="Close">×</button></div><div class="sheet-body">' + body + '</div>';
    return s;
  }
  var sMedia = sheet('sheet-media', 'Media', list(MEDIA));
  var sMore = sheet('sheet-more', 'More', '<p class="sheet-label">About</p>' + list(ABOUT) + '<p class="sheet-label">Connect</p>' + list(CONNECT) + '<div class="sheet-actions"><a class="btn btn-green" href="tel:+96555638119">Call us</a><a class="btn btn-line-dark" href="' + P + '#locations">Service times</a></div>');

  document.body.appendChild(scrim);
  document.body.appendChild(sMedia);
  document.body.appendChild(sMore);
  document.body.appendChild(nav);
  document.body.classList.add('has-bnav');

  var open = null, opener = null;
  function closeSheet() {
    if (!open) return;
    var s = open; open.classList.remove('open'); scrim.classList.remove('open');
    nav.querySelectorAll('[data-sheet]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    setTimeout(function () { s.hidden = true; scrim.hidden = true; }, 260);
    document.documentElement.classList.remove('sheet-lock');
    open = null; setActive(); if (opener) opener.focus();
  }
  function openSheet(id, btn) {
    if (open && open.id === id) { closeSheet(); return; }
    if (open) { open.classList.remove('open'); open.hidden = true; }
    var s = document.getElementById(id);
    s.hidden = false; scrim.hidden = false;
    requestAnimationFrame(function () { s.classList.add('open'); scrim.classList.add('open'); });
    document.documentElement.classList.add('sheet-lock');
    nav.querySelectorAll('[data-sheet]').forEach(function (b) { b.setAttribute('aria-expanded', String(b === btn)); });
    open = s; opener = btn; markActive(btn.dataset.key);
    var first = s.querySelector('.sheet-link'); if (first) first.focus({ preventScroll: true });
  }
  nav.addEventListener('click', function (e) {
    var b = e.target.closest('[data-sheet]'); if (b) { openSheet(b.dataset.sheet, b); return; }
    var a = e.target.closest('a.bnav-item'); if (a) { closeSheet(); markActive(a.dataset.key); }
  });
  scrim.addEventListener('click', closeSheet);
  [sMedia, sMore].forEach(function (s) {
    s.querySelector('.sheet-close').addEventListener('click', closeSheet);
    s.addEventListener('click', function (e) { if (e.target.closest('a')) closeSheet(); });
    // Swipe down on the sheet to close it
    var y0 = null;
    s.addEventListener('touchstart', function (e) { y0 = e.touches[0].clientY; }, { passive: true });
    s.addEventListener('touchend', function (e) { if (y0 !== null && e.changedTouches[0].clientY - y0 > 70) closeSheet(); y0 = null; });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });

  // Active tab: follows the section on screen (home page) or the current page
  function markActive(key) {
    nav.querySelectorAll('.bnav-item').forEach(function (it) {
      var on = it.dataset.key === key;
      it.classList.toggle('active', on);
      if (it.tagName === 'A') { if (on) it.setAttribute('aria-current', 'page'); else it.removeAttribute('aria-current'); }
    });
  }
  var sectionKey = isMedia ? 'media' : isMore ? 'more' : here === 'visit.html' ? 'visit' : 'home';
  function setActive() { markActive(sectionKey); }
  if (isHome && 'IntersectionObserver' in window) {
    var map = [['top', 'home'], ['locations', 'visit'], ['prayer', 'prayer']];
    var vis = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { vis[en.target.id] = en.isIntersecting; });
      var k = 'home';
      map.forEach(function (m) { if (vis[m[0]]) k = m[1]; });
      if (!vis.top && !vis.locations && !vis.prayer) k = '';
      sectionKey = k || sectionKey;
      if (!open) setActive();
    }, { rootMargin: '-35% 0px -45% 0px' });
    map.forEach(function (m) { var el = document.getElementById(m[0]); if (el) io.observe(el); });
  }
  setActive();

})();
