/* Shared behaviour for GMI subpages: menu, Media dropdown, header state, reveals, spotlight. */
(function () {
  var doc = document.documentElement;
  doc.classList.add('js');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;

  var GMI = window.GMI = {
    reduce: reduce,
    esc: function (t) { var d = document.createElement('div'); d.textContent = t == null ? '' : String(t); return d.innerHTML; },
    // Words of a heading rise in when it scrolls into view
    split: function (el) {
      if (!el || el.dataset.split) return;
      var text = el.textContent.trim();
      el.setAttribute('aria-label', text);
      el.innerHTML = text.split(/\s+/).map(function (w, i) {
        return '<span class="w" aria-hidden="true"><span style="--i:' + i + '">' + GMI.esc(w) + '</span></span>';
      }).join(' ');
      el.dataset.split = '1';
      el.classList.add('split');
    },
    observe: null,
    // Call after rendering new cards: tags them for reveal + spotlight
    refresh: function (root) {
      root = root || document;
      root.querySelectorAll('[data-reveal]:not([data-seen])').forEach(function (el) {
        el.setAttribute('data-seen', '');
        if (reduce || !GMI.observe || el.getBoundingClientRect().top < window.innerHeight * 0.95) el.classList.add('in');
        else GMI.observe.observe(el);
      });
      root.querySelectorAll('.spot-card:not([data-spot])').forEach(function (card) {
        card.setAttribute('data-spot', '');
        card.classList.add('spot-host');
        var sp = document.createElement('span'); sp.className = 'spot'; sp.setAttribute('aria-hidden', 'true');
        card.insertBefore(sp, card.firstChild);
        if (!canHover) return;
        var raf = null;
        card.addEventListener('pointermove', function (e) {
          if (raf) return;
          raf = requestAnimationFrame(function () {
            raf = null;
            var r = card.getBoundingClientRect();
            card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
            card.style.setProperty('--my', (e.clientY - r.top) + 'px');
          });
        });
      });
    }
  };

  if (!reduce && 'IntersectionObserver' in window) {
    GMI.observe = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); GMI.observe.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Mobile menu
    var btn = document.getElementById('menu-btn'), nav = document.getElementById('nav');
    if (btn && nav) {
      btn.addEventListener('click', function () {
        var open = nav.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(open));
      });
    }
    // Media dropdown
    document.querySelectorAll('.nav-drop').forEach(function (drop) {
      var b = drop.querySelector('.nav-drop-btn');
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        document.querySelectorAll('.nav-drop.open').forEach(function (o) { if (o !== drop) { o.classList.remove('open'); o.querySelector('.nav-drop-btn').setAttribute('aria-expanded', 'false'); } });
        var open = drop.classList.toggle('open');
        b.setAttribute('aria-expanded', String(open));
      });
      document.addEventListener('click', function (e) { if (!drop.contains(e.target)) { drop.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); } });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && drop.classList.contains('open')) { drop.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); b.focus(); } });
    });
    var yr = document.getElementById('yr'); if (yr) yr.textContent = new Date().getFullYear();

    // Header state + progress line
    var head = document.getElementById('site-head'), ticking = false;
    function onScroll() {
      var y = window.scrollY || window.pageYOffset;
      if (head) {
        head.classList.toggle('scrolled', y > 40);
        var max = document.documentElement.scrollHeight - window.innerHeight;
        head.style.setProperty('--progress', max > 0 ? (y / max).toFixed(4) : 0);
      }
      ticking = false;
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();

    // Headings + reveals
    var hero = document.querySelector('.page-hero h1'); if (hero) GMI.split(hero);
    document.querySelectorAll('main .head h2').forEach(function (h) { GMI.split(h); h.classList.add('h-split'); h.setAttribute('data-reveal', ''); });
    GMI.refresh();
  });
})();
