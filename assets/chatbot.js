/* GMI church assistant: answers common questions from site information and hands off to WhatsApp.
   Runs entirely in the browser; nothing typed here is sent anywhere except when the visitor taps a WhatsApp button.
   To change answers, edit the KB list below. */
(function () {
  var WA_NUMBER = '96555638119';            // WhatsApp number, international format, no + or spaces
  var PHONE = '+965 5563 8119';
  var EMAIL = 'Admin@gmi-church.org';

  function wa(text) { return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text || 'Hello GMI, I have a question.'); }

  // ---- Weekly services (Kuwait time) ----
  var WEEKLY = [
    { day: 5, time: '07:00', label: '7:00 AM', place: 'Bethel' },
    { day: 5, time: '08:30', label: '8:30 AM', place: 'Fahaheel' },
    { day: 5, time: '12:30', label: '12:30 PM', place: 'The Fellowship Hall, NECK' },
    { day: 5, time: '15:30', label: '3:30 PM', place: 'The North Tent, NECK' },
    { day: 5, time: '17:15', label: '5:15 PM', place: 'English service, Hall of Faith, NECK' },
    { day: 1, time: '18:00', label: '6:00 PM', place: 'KTMCC, NECK' }
  ];
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  function nextService() {
    var n = new Date(Date.now() + 3 * 3600e3), day = n.getUTCDay(), min = n.getUTCHours() * 60 + n.getUTCMinutes(), best = null;
    WEEKLY.forEach(function (w) {
      var t = w.time.split(':'), m = +t[0] * 60 + +t[1], d = ((w.day - day + 7) % 7) * 1440 + (m - min);
      if (d < -120) d += 7 * 1440;
      if (!best || d < best.d) best = { d: d, w: w };
    });
    var places = WEEKLY.filter(function (w) { return w.day === best.w.day && w.time === best.w.time; }).map(function (w) { return w.place; }).join(' and ');
    var dd = (best.w.day - day + 7) % 7;
    var when = best.d < 0 ? 'happening now' : dd === 0 ? 'today' : dd === 1 ? 'tomorrow' : 'on ' + DAYS[best.w.day];
    return 'The next service is <b>' + when + ' at ' + best.w.label + '</b>, ' + places + '.';
  }

  // ---- Knowledge base: keywords (any language) -> answer (HTML) + optional quick replies ----
  var KB = [
    { id: 'greet', k: ['hi', 'hello', 'hey', 'good morning', 'good evening', 'vanakkam', 'வணக்கம்', 'ayubowan', 'ආයුබෝවන්', 'praise the lord', 'salam'],
      a: function () { return 'Hello and welcome! I can help with service times, locations, prayer requests and more. What would you like to know?'; },
      q: ['Service times', 'Where are you?', 'I’m new'] },
    { id: 'times', k: ['time', 'times', 'service', 'services', 'when', 'friday', 'monday', 'schedule', 'timing', 'mass', 'worship service', 'next'],
      a: function () { return nextService() + '<br><br><b>Friday</b><br>7:00 AM · Bethel (Tamil &amp; Sinhala)<br>8:30 AM · Fahaheel (Tamil &amp; Sinhala)<br>12:30 PM · The Fellowship Hall, NECK (Tamil &amp; Sinhala)<br>3:30 PM · The North Tent, NECK (Tamil &amp; Sinhala)<br>4:00–5:15 PM · Sunday School (kids’ Bible class), NECK<br>5:15 PM · English service, Hall of Faith, NECK (English)<br><br><b>Monday</b><br>6:00 PM · KTMCC, NECK<br><br><b>Monthly</b><br>Holy Communion · 1st &amp; 3rd Friday, 3:30 PM, NECK<br>Holy Communion · 2nd &amp; 4th Friday, at Bethel, Fahaheel and 12:30 PM NECK<br>Holy Communion · 4th Friday, 5:15 PM English service<br>Healing service · 4th Friday, 3:30 PM, North Tent, NECK<br><br>All times are Kuwait time.'; },
      q: ['Where are you?', 'Which language?', 'I’m new'] },
    { id: 'where', k: ['where', 'location', 'locations', 'address', 'direction', 'directions', 'map', 'neck', 'kuwait city', 'fahaheel', 'bethel', 'parking', 'how to reach', 'reach'],
      a: function () { return 'We meet in three places:<br><br><b>Kuwait City</b>: the National Evangelical Church in Kuwait (NECK) compound. <a href="https://www.google.com/maps/search/?api=1&query=National+Evangelical+Church+in+Kuwait" target="_blank" rel="noopener">Open in Google Maps</a><br><b>Bethel</b>: Friday 7:00 AM. Message us for the address.<br><b>Fahaheel</b>: Friday 8:30 AM. Message us for the address.<br><br>See <a href="locations.html">all locations</a>.'; },
      q: ['Service times', 'Ask for directions'] },
    { id: 'lang', k: ['language', 'languages', 'tamil', 'sinhala', 'english', 'translate', 'in tamil', 'in sinhala', 'in english', 'tamil service', 'sinhala service', 'தமிழ்', 'සිංහල'],
      a: function () { return 'GMI is a church where Tamils and Sinhalese worship together in harmony, and people of every nationality are welcome. <b>Tamil &amp; Sinhala:</b> our main services, Bethel 7:00 AM, Fahaheel 8:30 AM, NECK 12:30 PM and 3:30 PM on Fridays, plus Monday 6:00 PM.<br><b>English:</b> the Friday 5:15 PM service in the Hall of Faith at NECK, Sunday School for kids (Fridays 4:00–5:15 PM) and our youth services.'; },
      q: ['Service times', 'Talk to a person'] },
    { id: 'new', k: ['new', 'first time', 'visit', 'visiting', 'visitor', 'expect', 'dress', 'come', 'bring', 'bring my', 'bring my children', 'bring my family', 'bring friends', 'can i bring', 'family', 'friends', 'relatives', 'nationality', 'foreigner', 'anyone', 'welcome'],
      a: function () { return 'We’d love to welcome you! Bring your family, friends, relatives and children: people of every nationality are welcome at every service. Friday is our main day of worship. ' + nextService() + '<br><br>Read <a href="visit.html">Plan your first visit</a> for what to expect, or tell us you’re coming and we’ll look out for you.'; },
      q: ['Where are you?', 'Talk to a person'] },
    { id: 'member', k: ['member', 'membership', 'join', 'become a member', 'register'],
      a: function () { return 'If you have received Jesus Christ as your personal Saviour and Lord, and want to become an active member of GMI, the first step is to contact us. Message us on WhatsApp or call ' + PHONE + ' to start the process.'; },
      q: ['Talk to a person', 'Service times'] },
    { id: 'prayer', k: ['pray', 'prayer', 'prayers', 'sick', 'problem', 'trouble', 'help me', 'need help', 'worried', 'sad', 'struggling'],
      a: function () { return 'We’d be honoured to pray with you. You can send a request through our <a href="index.html#prayer">prayer form</a>, or message the pastors directly on WhatsApp. You can write in English, Tamil or Sinhala.'; },
      q: ['Send a prayer request on WhatsApp', 'Counselling'] },
    { id: 'counsel', k: ['counsel', 'counselling', 'counseling', 'counsellor', 'counselor', 'advice', 'talk to pastor', 'meet pastor', 'appointment', 'book', 'session', 'jayanthi', 'jeyanthy', 'jeyanthi', 'marriage problem', 'depressed', 'stress', 'anxiety', 'grief', 'lonely'],
      a: function () { return 'You can book a confidential counselling session with <b>Rev. Jeyanthy M. Nesan</b>, in English, Tamil or Sinhala, in person or by phone. Use the <a href="counselling.html#book">booking form</a> and it will open WhatsApp with your request ready to send. If anyone is in immediate danger, call 112.'; },
      q: ['Talk to a person'] },
    { id: 'pastors', k: ['pastor', 'pastors', 'robert', 'nesan', 'priyantha', 'jayasooriya', 'dilip', 'shathakumar', 'milroy', 'samuel', 'deacon', 'deacons', 'leader', 'leaders', 'who leads'],
      a: function () { return 'GMI is led by <b>Rev. Robert M. Nesan</b> (Senior Pastor) and <b>Rev. Jeyanthy M. Nesan</b>, with Pastor Priyantha Jayasooriya, Pastor Dilip Shathakumar and Pastor Milroy Samuel, and six deacons. Meet them on our <a href="pastors.html">Pastors & leaders</a> page.'; },
      q: ['Our story', 'Talk to a person'] },
    { id: 'history', k: ['history', 'story', 'founded', 'started', 'about', 'gmi', 'grace ministries', 'how old', 'since', 'our story'],
      a: function () { return 'In 1990, during the invasion of Kuwait, Pastor Robert Nesan and his family sheltered in Germany and received God’s call to return and pioneer the first Sri Lankan church in Kuwait. They returned in 1991, a house church began, and in January 1992 the first congregation met under the National Evangelical Church of Kuwait. Today it is Grace Ministries International. <a href="pastors.html">Read more</a>.'; },
      q: ['What do you believe?', 'Service times'] },
    { id: 'promise', k: ['promise', 'promise verse', 'promise word', 'year verse', "year's verse", 'verse for the year', 'jeremiah', '2026 promise', 'theme verse'],
      a: function () { return '<b>Our promise for 2026</b> is Jeremiah 1:18:<br><br>&ldquo;For, behold, I have made thee this day a defenced city, and an iron pillar, and brasen walls against the whole land, against the kings of Judah, against the princes thereof, against the priests thereof, and against the people of the land.&rdquo; (KJV)'; },
      q: ['Service times', 'Prayer request'] },
    { id: 'monthly', k: ['communion', 'holy communion', 'lords supper', "lord's supper", 'sacrament', 'healing service', 'healing', 'heal', 'miracle', 'monthly', 'first friday', 'third friday', '3rd friday', '1st friday', 'second friday', 'fourth friday', '2nd friday', '4th friday'],
      a: function () {
        var now = new Date(Date.now() + 3 * 3600e3), M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        function nth(y, m, n) { var d = new Date(Date.UTC(y, m, 1)); d.setUTCDate(1 + (5 - d.getUTCDay() + 7) % 7 + (n - 1) * 7); return d; }
        function nxt(ns) { var t = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()), out = []; for (var k = 0; k < 3; k++) ns.forEach(function (n) { out.push(nth(now.getUTCFullYear(), now.getUTCMonth() + k, n)); }); return out.filter(function (d) { return d >= t; }).sort(function (a, b) { return a - b; })[0]; }
        var c = nxt([1, 3]), c2 = nxt([2, 4]), h = nxt([4]);
        return '<b>Holy Communion</b> is served on Fridays:<br>1st &amp; 3rd Friday: 3:30 PM, The North Tent, NECK. Next: <b>Fri ' + c.getUTCDate() + ' ' + M[c.getUTCMonth()] + '</b><br>2nd &amp; 4th Friday: Bethel 7:00 AM, Fahaheel 8:30 AM and 12:30 PM at the Fellowship Hall, NECK. Next: <b>Fri ' + c2.getUTCDate() + ' ' + M[c2.getUTCMonth()] + '</b><br>4th Friday: the 5:15 PM English service, Hall of Faith, NECK. Next: <b>Fri ' + h.getUTCDate() + ' ' + M[h.getUTCMonth()] + '</b><br><br><b>Healing service</b>: 4th Friday of every month, 3:30 PM at the North Tent, NECK compound. Next: <b>Fri ' + h.getUTCDate() + ' ' + M[h.getUTCMonth()] + '</b>.';
      },
      q: ['Service times', 'Talk to a person'] },
    { id: 'ministries', k: ['ministry', 'ministries', 'youth', 'young', 'children', 'kids', 'child', 'sunday school', 'vbs', 'women', 'ladies', 'bible class', 'kids class', 'women service', 'womens service', 'fasting', 'overnight', 'communion', 'choir', 'worship team', 'serve', 'volunteer'],
      a: function () { return '<b>Sunday School (Bible class for kids):</b> every Friday, 4:00–5:15 PM at the NECK compound. For the women’s service and other meeting times, message us on WhatsApp.<br><br>GMI has ten ministries, including Praise & Worship, Holy Communion (every 1st to 4th Friday), a Healing Service (3rd Friday), Fasting Prayers, Bible Studies, a Leadership Seminar, Sunday School & VBS, Youth, Women’s and International services. See <a href="ministries.html">all ministries</a>, or ask us on WhatsApp for meeting times.'; },
      q: ['Ask about a ministry', 'Bible studies'] },
    { id: 'bible', k: ['bible study', 'bible studies', 'course', 'courses', 'class', 'classes', 'exam', 'study', 'leadership seminar', 'training'],
      a: function () { return 'Our Bible study courses are: Missions and the Harvest, Developing Leaders, Wilderness Mentalities, Personal Evangelism, Reconciliation and Spiritual Warfare. Message us on WhatsApp to join a class.'; },
      q: ['Talk to a person'] },
    { id: 'beliefs', k: ['believe', 'belief', 'beliefs', 'faith', 'doctrine', 'denomination', 'catholic', 'pentecostal', 'protestant'],
      a: function () { return 'You can read our core beliefs on the <a href="beliefs.html">What we believe</a> page. For any question about our faith, our pastors are happy to talk.'; },
      q: ['Road to salvation', 'Talk to a person'] },
    { id: 'salvation', k: ['saved', 'salvation', 'jesus', 'accept jesus', 'born again', 'become a christian', 'sin', 'god', 'road to salvation'],
      a: function () { return 'God loves you! The <a href="salvation.html">Road to Salvation</a> page explains, step by step from the Bible, how you can begin a relationship with God through Jesus Christ. If you’d like to talk or pray with someone, message us on WhatsApp.'; },
      q: ['Talk to a person', 'Prayer request'] },
    { id: 'baptism', k: ['baptism', 'baptise', 'baptize', 'wedding', 'marriage', 'married', 'funeral', 'dedication', 'baby dedication', 'certificate'],
      a: function () { return 'For baptisms, weddings, child dedications, funerals or certificates, please speak to a pastor directly. Message us on WhatsApp and we’ll arrange a time.'; },
      q: ['Talk to a person'] },
    { id: 'give', k: ['give', 'giving', 'tithe', 'tithes', 'offering', 'offerings', 'donate', 'donation', 'bank', 'pay', 'contribute'],
      a: function () { return 'Thank you for wanting to support God’s work at GMI. You can give during any service. For bank transfers or special gifts, please message us on WhatsApp. See <a href="give.html">Giving</a>.'; },
      q: ['Talk to a person'] },
    { id: 'media', k: ['magazine', 'magazines', 'newsletter', 'podcast', 'sermon', 'sermons', 'video', 'videos', 'youtube', 'watch', 'listen', 'live', 'online', 'gallery', 'photos'],
      a: function () { return 'Catch up with GMI online:<br>• <a href="videos.html">Videos & sermons</a> (YouTube)<br>• <a href="podcast.html">Reach The Destiny podcast</a><br>• <a href="magazines.html">Magazines</a>, free in Tamil and Sinhala<br>• <a href="gallery.html">Photo gallery</a>'; },
      q: ['Upcoming events', 'Service times'] },
    { id: 'events', k: ['event', 'events', 'christmas', 'easter', 'new year', 'watch night', 'convention', 'program', 'programme', 'news', 'announcement', 'upcoming'],
      a: function () { return 'See what’s coming up on our <a href="news.html">News & events</a> page. For details of a special service, message us on WhatsApp.'; },
      q: ['Service times', 'Talk to a person'] },
    { id: 'contact', k: ['contact', 'phone', 'call', 'number', 'email', 'mail', 'whatsapp', 'reach you', 'office'],
      a: function () { return 'You can reach us by:<br>• WhatsApp or phone: <b>' + PHONE + '</b><br>• Email: <a href="mailto:' + EMAIL + '">' + EMAIL + '</a><br>• Facebook: <a href="https://www.facebook.com/gmichurchkuwait/" target="_blank" rel="noopener">@gmichurchkuwait</a>'; },
      q: ['Talk to a person'] },
    { id: 'app', k: ['app', 'login', 'log in', 'sign in', 'account', 'password'],
      a: function () { return 'The GMI member app is coming soon. You don’t need to do anything yet. See <a href="login.html">Member login</a>.'; } },
    { id: 'thanks', k: ['thank', 'thanks', 'thank you', 'nandri', 'நன்றி', 'stuti', 'ස්තූතියි', 'bye', 'goodbye', 'ok', 'okay', 'amen'],
      a: function () { return 'You’re welcome! God bless you. If you need anything else, I’m here, or you can message the church on WhatsApp.'; } }
  ];
  var CHIP_MAP = {
    'Service times': 'times', 'Where are you?': 'where', 'I’m new': 'new', 'Which language?': 'lang', 'Our story': 'history',
    'What do you believe?': 'beliefs', 'Road to salvation': 'salvation', 'Bible studies': 'bible', 'Upcoming events': 'events',
    'Counselling': 'counsel', 'Book counselling': 'counsel', 'Prayer request': 'prayer'
  };
  var WA_CHIPS = {
    'Talk to a person': 'Hello GMI, I’d like to speak to someone.',
    'Send a prayer request on WhatsApp': 'Hello GMI, I have a prayer request:',
    'Ask for directions': 'Hello GMI, could you send me directions to the service?',
    'Ask about a ministry': 'Hello GMI, I’d like to know more about a ministry:'
  };

  function norm(t) { return ' ' + String(t).toLowerCase().replace(/[^\p{L}\p{M}\p{N}\s']/gu, ' ').replace(/\s+/g, ' ').trim() + ' '; }
  function match(text) {
    var t = norm(text), best = null, bestScore = 0;
    KB.forEach(function (item) {
      var score = 0;
      item.k.forEach(function (kw) {
        var k = kw.toLowerCase();
        if (/^[a-z' ]+$/.test(k) ? t.indexOf(' ' + k + ' ') > -1 || (k.length > 4 && t.indexOf(k) > -1) : t.indexOf(k) > -1) score += k.split(' ').length + (k.length > 6 ? 0.5 : 0);
      });
      if (item.id === 'greet' || item.id === 'thanks') score *= 0.6; // prefer a real topic when both appear
      if (score > bestScore) { bestScore = score; best = item; }
    });
    return best;
  }

  // ---- UI ----
  var ICON_CHAT = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01" stroke-width="2.6"/></svg>';
  var ICON_CLOSE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  var ICON_SEND = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg>';
  var ICON_WA = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z"/></svg>';

  var root = document.createElement('div');
  root.className = 'gbot';
  root.innerHTML =
    '<button class="gbot-fab" type="button" aria-expanded="false" aria-controls="gbot-panel" aria-label="Open church assistant">' + ICON_CHAT + '<span class="gbot-fab-label">Ask GMI</span></button>' +
    '<section class="gbot-panel" id="gbot-panel" role="dialog" aria-modal="false" aria-labelledby="gbot-title" hidden>' +
      '<header class="gbot-head"><span class="gbot-avatar" aria-hidden="true">GMI</span><div><b id="gbot-title">GMI assistant</b><small><i class="gbot-dot"></i>Church information · WhatsApp for help</small></div>' +
      '<button class="gbot-x" type="button" aria-label="Close assistant">' + ICON_CLOSE + '</button></header>' +
      '<div class="gbot-log" id="gbot-log" role="log" aria-live="polite"></div>' +
      '<div class="gbot-chips" id="gbot-chips"></div>' +
      '<form class="gbot-form" id="gbot-form" autocomplete="off"><label class="sr-only" for="gbot-in">Type your question</label>' +
      '<input id="gbot-in" type="text" maxlength="300" placeholder="Ask about services, prayer, locations…">' +
      '<button type="submit" aria-label="Send">' + ICON_SEND + '</button></form>' +
      '<a class="gbot-wa" id="gbot-wa" href="' + wa() + '" target="_blank" rel="noopener">' + ICON_WA + '<span>Chat with us on WhatsApp</span></a>' +
    '</section>';
  document.body.appendChild(root);

  var fab = root.querySelector('.gbot-fab'), panel = root.querySelector('.gbot-panel'), log = root.querySelector('#gbot-log');
  var chips = root.querySelector('#gbot-chips'), form = root.querySelector('#gbot-form'), input = root.querySelector('#gbot-in'), waLink = root.querySelector('#gbot-wa');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var started = false, lastQuestion = '';

  function scroll() { log.scrollTop = log.scrollHeight; }
  function add(who, html) {
    var m = document.createElement('div');
    m.className = 'gbot-msg ' + who;
    if (who === 'me') m.textContent = html; else m.innerHTML = html;
    log.appendChild(m); scroll();
    return m;
  }
  function waButton(text, label) {
    return '<a class="gbot-wa-inline" href="' + wa(text) + '" target="_blank" rel="noopener">' + ICON_WA + '<span>' + (label || 'Continue on WhatsApp') + '</span></a>';
  }
  function setChips(list) {
    chips.innerHTML = (list || []).map(function (c) {
      return WA_CHIPS[c] ? '<a class="gbot-chip wa" href="' + wa(WA_CHIPS[c]) + '" target="_blank" rel="noopener">' + ICON_WA + c + '</a>' : '<button type="button" class="gbot-chip">' + c + '</button>';
    }).join('');
  }
  function botSay(html, chipList) {
    setChips([]);
    var typing = add('bot typing', '<span></span><span></span><span></span>');
    setTimeout(function () {
      typing.remove();
      add('bot', html);
      setChips(chipList);
    }, reduce ? 0 : 550);
  }
  function answer(text, forcedId) {
    lastQuestion = text;
    waLink.href = wa('Hello GMI, I have a question: ' + text);
    var item = forcedId ? KB.filter(function (k) { return k.id === forcedId; })[0] : match(text);
    if (!item) {
      botSay('I’m not sure about that one, but our church team can help. Tap below to send your question on WhatsApp.' + waButton('Hello GMI, I have a question: ' + text, 'Ask the church on WhatsApp'), ['Service times', 'Where are you?', 'Talk to a person']);
      return;
    }
    var html = item.a();
    if (['prayer', 'counsel', 'member', 'baptism', 'give', 'ministries', 'bible', 'where'].indexOf(item.id) > -1) {
      html += waButton((item.id === 'prayer' ? 'Hello GMI, I have a prayer request: ' : 'Hello GMI, ') + (item.id === 'prayer' ? '' : text));
    }
    botSay(html, item.q || ['Service times', 'Talk to a person']);
  }
  function start() {
    if (started) return; started = true;
    add('bot', 'Hello! <span class="ta" lang="ta">வணக்கம்</span> · <span class="si" lang="si">ආයුබෝවන්</span><br>I’m the GMI assistant. Ask me about service times, locations, prayer, ministries and more. For anything personal, I’ll connect you with the church on WhatsApp.');
    setChips(['Service times', 'Where are you?', 'I’m new', 'Prayer request', 'Talk to a person']);
  }
  function open() {
    panel.hidden = false;
    requestAnimationFrame(function () { root.classList.add('open'); });
    fab.setAttribute('aria-expanded', 'true'); fab.setAttribute('aria-label', 'Close church assistant');
    start();
    setTimeout(function () { input.focus({ preventScroll: true }); }, 50);
  }
  function close() {
    root.classList.remove('open');
    fab.setAttribute('aria-expanded', 'false'); fab.setAttribute('aria-label', 'Open church assistant');
    setTimeout(function () { panel.hidden = true; }, reduce ? 0 : 220);
    fab.focus();
  }
  fab.addEventListener('click', function () { root.classList.contains('open') ? close() : open(); });
  root.querySelector('.gbot-x').addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('open')) close(); });
  chips.addEventListener('click', function (e) {
    var b = e.target.closest('button.gbot-chip'); if (!b) return;
    var label = b.textContent;
    add('me', label);
    answer(label, CHIP_MAP[label]);
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var t = input.value.trim(); if (!t) return;
    input.value = '';
    add('me', t);
    answer(t);
  });
  // Links inside answers that point to this page's sections close the panel so the visitor sees them
  log.addEventListener('click', function (e) {
    var a = e.target.closest('a'); if (!a) return;
    if (a.getAttribute('href') && a.getAttribute('href').indexOf('#') > -1 && a.target !== '_blank') close();
  });
  window.GMIBot = { open: open, close: close, ask: function (t) { open(); add('me', t); answer(t); } };
})();
