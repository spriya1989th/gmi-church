/* GMI Members area: sign in, self-care profile, and the pastors' dashboard.
   Talks to the church CRM database (Supabase project "gmi-church-crm").
   Access rules live in the database: members can only read and change their own record,
   pastors and admins (staff_roles table) can see everyone. Nothing here can widen that. */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://ujbfyzlbytlkfwjuxply.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_0HXyxMzWjEhZJiTlhaG6mw_xsW6Twn0'; // public key, safe in the browser
  var BUCKET = 'member-files';
  var OFFICE_WA = 'https://wa.me/96555638119';
  var MAX_MB = 5;

  var root = document.getElementById('portal');
  if (!root || !window.supabase) return;
  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' }
  });
  var here = location.origin + location.pathname;

  // opened from a password-reset email? then ask for a new password before anything else
  var state = { user: null, role: null, me: null, family: [], all: [], recovering: /type=recovery/.test(location.hash) };

  // ---------- small helpers ----------
  function $(sel, el) { return (el || root).querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || root).querySelectorAll(sel)); }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function val(v) { v = (v == null ? '' : String(v)).trim(); return v === '' ? null : v; }
  function fmtDate(d) {
    if (!d) return '';
    var p = String(d).split('-'); var M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return p.length === 3 ? (+p[2]) + ' ' + M[+p[1] - 1] + ' ' + p[0] : d;
  }
  function initials(name) { return String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0].toUpperCase(); }).join(''); }
  function waLink(n) { var d = String(n || '').replace(/[^\d]/g, ''); return d ? 'https://wa.me/' + d : ''; }
  function busy(btn, on, label) {
    if (!btn) return;
    if (on) { btn.dataset.label = btn.textContent; btn.textContent = label || 'Please wait…'; btn.disabled = true; }
    else { btn.textContent = btn.dataset.label || btn.textContent; btn.disabled = false; }
  }
  function toast(msg, kind) {
    var t = document.getElementById('portal-toast');
    t.textContent = msg; t.className = 'p-toast show ' + (kind || 'ok');
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.className = 'p-toast'; }, 3800);
  }
  function friendlyError(err) {
    var m = (err && (err.message || err.error_description || err)) + '';
    if (/database error saving new user|EMAIL_NOT_IN_CRM/i.test(m)) return 'We couldn’t find this email in the church records. Please use the email address you gave the church, or message the church office.';
    if (/invalid login credentials/i.test(m)) return 'That email and password don’t match. Check them and try again, or use “Forgot password”.';
    if (/email not confirmed/i.test(m)) return 'Please confirm your email first. Open the email we sent you and tap the link.';
    if (/password should be at least|weak/i.test(m)) return 'Please choose a longer password: at least 8 characters.';
    if (/rate limit|too many/i.test(m)) return 'Too many attempts. Please wait a few minutes and try again.';
    if (/failed to fetch|network/i.test(m)) return 'We can’t reach the church system right now. Check your internet connection and try again.';
    if (/payload too large|exceeded the maximum/i.test(m)) return 'That file is too large. Please choose one under ' + MAX_MB + ' MB.';
    if (/mime type|not supported/i.test(m)) return 'That file type isn’t supported. Please use a JPG, PNG or PDF.';
    return 'Something went wrong: ' + m;
  }
  function msg(view, text, kind) {
    var el = $('[data-view="' + view + '"] .p-msg');
    if (!el) return;
    el.textContent = text || ''; el.className = 'p-msg' + (text ? ' show ' + (kind || 'err') : '');
  }

  // ---------- views ----------
  function show(view) {
    $$('[data-view]').forEach(function (v) { v.hidden = v.getAttribute('data-view') !== view; });
    root.setAttribute('data-state', view);
    var focus = $('[data-view="' + view + '"] input:not([type=hidden]), [data-view="' + view + '"] h2');
    if (focus && view !== 'app') setTimeout(function () { try { focus.focus({ preventScroll: true }); } catch (e) {} }, 30);
  }

  // sign in
  $('#f-signin').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target, btn = $('button[type=submit]', f); msg('signin', '');
    busy(btn, true, 'Signing in…');
    sb.auth.signInWithPassword({ email: f.email.value.trim().toLowerCase(), password: f.password.value }).then(function (r) {
      busy(btn, false);
      if (r.error) return msg('signin', friendlyError(r.error));
    });
  });

  // first time: create password
  $('#f-signup').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target, btn = $('button[type=submit]', f); msg('signup', '');
    if (f.password.value.length < 8) return msg('signup', 'Please choose a password with at least 8 characters.');
    if (f.password.value !== f.password2.value) return msg('signup', 'The two passwords don’t match.');
    busy(btn, true, 'Creating…');
    var email = f.email.value.trim().toLowerCase();
    sb.auth.signUp({ email: email, password: f.password.value, options: { emailRedirectTo: here } }).then(function (r) {
      busy(btn, false);
      if (r.error) return msg('signup', friendlyError(r.error));
      if (r.data && r.data.session) return; // email confirmation switched off: signed in straight away
      $('#sent-to').textContent = email;
      $('#sent-what').textContent = 'confirm your email address. After that you can sign in with your new password.';
      show('sent');
    });
  });

  // forgot password
  $('#f-forgot').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target, btn = $('button[type=submit]', f); msg('forgot', '');
    busy(btn, true, 'Sending…');
    var email = f.email.value.trim().toLowerCase();
    sb.auth.resetPasswordForEmail(email, { redirectTo: here }).then(function (r) {
      busy(btn, false);
      if (r.error && !/not found/i.test(r.error.message)) return msg('forgot', friendlyError(r.error));
      $('#sent-to').textContent = email;
      $('#sent-what').textContent = 'set a new password (if this email is in the church records).';
      show('sent');
    });
  });

  // set a new password after opening the reset link
  $('#f-newpass').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target, btn = $('button[type=submit]', f); msg('newpass', '');
    if (f.password.value.length < 8) return msg('newpass', 'Please choose a password with at least 8 characters.');
    if (f.password.value !== f.password2.value) return msg('newpass', 'The two passwords don’t match.');
    busy(btn, true, 'Saving…');
    sb.auth.updateUser({ password: f.password.value }).then(function (r) {
      busy(btn, false);
      if (r.error) return msg('newpass', friendlyError(r.error));
      state.recovering = false; toast('Your new password is saved.');
      history.replaceState(null, '', here); state.user = r.data.user; loadApp();
    });
  });

  root.addEventListener('click', function (e) {
    var go = e.target.closest('[data-go]');
    if (go) { e.preventDefault(); ['signin', 'signup', 'forgot'].forEach(function (v) { msg(v, ''); }); show(go.getAttribute('data-go')); }
    if (e.target.closest('[data-signout]')) { e.preventDefault(); sb.auth.signOut().then(function () { location.hash = ''; }); }
  });

  // password show/hide
  root.addEventListener('click', function (e) {
    var b = e.target.closest('.pw-toggle'); if (!b) return;
    var i = b.parentNode.querySelector('input'); var on = i.type === 'password';
    i.type = on ? 'text' : 'password'; b.textContent = on ? 'Hide' : 'Show'; b.setAttribute('aria-pressed', on);
  });

  // ---------- session ----------
  sb.auth.onAuthStateChange(function (event, session) {
    // Supabase asks us not to call it again from inside this callback, so follow-up work is deferred.
    if (event === 'PASSWORD_RECOVERY') { state.recovering = true; setTimeout(function () { show('newpass'); }, 0); return; }
    if (event === 'SIGNED_OUT') { state = { user: null, role: null, me: null, family: [], all: [], recovering: false }; show('signin'); return; }
    if (session && session.user && !state.recovering && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
      if (state.user && state.user.id === session.user.id && event === 'SIGNED_IN' && state.me) return; // token refresh on tab focus
      state.user = session.user; setTimeout(loadApp, 0);
    } else if (!session && event === 'INITIAL_SESSION') {
      var h = location.hash;
      if (/error_description=/.test(h)) {
        var d = decodeURIComponent((h.match(/error_description=([^&]+)/) || [])[1] || '').replace(/\+/g, ' ');
        msg('signin', /expired|invalid/i.test(d) ? 'That link has expired. Please sign in, or use “Forgot password” to get a new link.' : d);
        history.replaceState(null, '', here);
      }
      show('signin');
    }
  });

  function loadApp() {
    if (state.recovering) { show('newpass'); return; }
    show('loading');
    var uid = state.user.id;
    Promise.all([
      sb.from('staff_roles').select('role').eq('user_id', uid).maybeSingle(),
      sb.from('members').select('*').eq('user_id', uid).maybeSingle()
    ]).then(function (res) {
      if (res[0].error || res[1].error) throw (res[0].error || res[1].error);
      state.role = res[0].data ? res[0].data.role : null;
      state.me = res[1].data;
      if (location.hash) history.replaceState(null, '', here);
      $('#who-name').textContent = state.me ? state.me.full_name : state.user.email;
      $('#who-role').textContent = state.role ? roleLabel(state.role) : 'Member';
      $('#tab-staff').hidden = !state.role;
      show('app');
      if (state.me) { renderMe(); } else { $('#me-panel').innerHTML = noRecordHtml(); }
      openTab(state.role && !state.me ? 'staff' : 'me');
    }).catch(function (err) { show('signin'); msg('signin', friendlyError(err)); });
  }
  function roleLabel(r) { return { super_admin: 'Super admin', admin: 'Admin', senior_pastor: 'Senior pastor', pastor: 'Pastor' }[r] || r; }
  function noRecordHtml() {
    return '<div class="p-card"><h3>We couldn’t find your member record</h3><p>Your login works, but it isn’t linked to a member record yet. Please <a href="' + OFFICE_WA + '" target="_blank" rel="noopener">message the church office on WhatsApp</a> and we’ll sort it out.</p></div>';
  }

  // tabs
  function openTab(t) {
    $$('.p-tab').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.tab === t ? 'true' : 'false'); });
    $('#me-panel').hidden = t !== 'me'; $('#staff-panel').hidden = t !== 'staff';
    if (t === 'staff' && !state.all.length) loadAll();
  }
  $$('.p-tab').forEach(function (b) { b.addEventListener('click', function () { openTab(b.dataset.tab); }); });

  // ---------- files ----------
  function signed(path) {
    if (!path) return Promise.resolve(null);
    return sb.storage.from(BUCKET).createSignedUrl(path, 3600).then(function (r) { return r.data ? r.data.signedUrl : null; });
  }
  function uploadFile(memberId, kind, file) {
    if (!file) return Promise.reject(new Error('No file chosen'));
    if (file.size > MAX_MB * 1024 * 1024) return Promise.reject(new Error('Payload too large'));
    var ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    var path = memberId + '/' + kind + '-' + Date.now() + '.' + ext;
    return sb.storage.from(BUCKET).upload(path, file, { upsert: false, contentType: file.type || undefined }).then(function (r) {
      if (r.error) throw r.error; return path;
    });
  }
  function removeFile(path) { return path ? sb.storage.from(BUCKET).remove([path]) : Promise.resolve(); }

  // ---------- my profile ----------
  var LOCS = ['Bethel', 'Fahaheel', 'NECK, Kuwait City'];
  function opt(list, cur, blank) {
    return (blank ? '<option value="">' + blank + '</option>' : '') + list.map(function (o) { return '<option' + (o === cur ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('');
  }
  function profileForm(m, staffMode) {
    var id = staffMode ? 'st' : 'me';
    return '' +
      '<form class="p-card p-form" data-form="details" data-id="' + esc(m.id) + '">' +
        '<h3>Personal details</h3>' +
        (staffMode ? '<label class="wide">Email (used to sign in)<input name="email" type="email" required value="' + esc(m.email) + '"></label>' : '') +
        '<label class="wide">Full name<input name="full_name" required autocomplete="name" value="' + esc(m.full_name) + '"></label>' +
        '<label>Date of birth<input name="date_of_birth" type="date" value="' + esc(m.date_of_birth || '') + '"></label>' +
        '<label>Gender<select name="gender">' + opt(['Male', 'Female'], m.gender, 'Choose') + '</select></label>' +
        '<label>Marital status<select name="marital_status">' + opt(['Single', 'Married', 'Widowed', 'Other'], m.marital_status, 'Choose') + '</select></label>' +
        '<label>Where I usually worship<select name="home_location">' + opt(LOCS, m.home_location, 'Choose') + '</select></label>' +
        '<label class="wide">Address in Kuwait<textarea name="address" rows="2" autocomplete="street-address">' + esc(m.address || '') + '</textarea></label>' +
        '<div class="p-save"><button class="btn btn-sand" type="submit">Save details</button></div>' +
      '</form>' +
      '<form class="p-card p-form" data-form="contact" data-id="' + esc(m.id) + '">' +
        '<h3>Contact numbers</h3><p class="p-hint">So the church can call you back or reach you on WhatsApp.</p>' +
        '<label>Call-back number<input name="phone_callback" type="tel" inputmode="tel" autocomplete="tel" placeholder="+965 …" value="' + esc(m.phone_callback || '') + '"></label>' +
        '<label>WhatsApp number<input name="whatsapp" type="tel" inputmode="tel" placeholder="+965 …" value="' + esc(m.whatsapp || '') + '"></label>' +
        '<label class="check wide"><input type="checkbox" name="same"' + (m.whatsapp && m.whatsapp === m.phone_callback ? ' checked' : '') + '> My WhatsApp number is the same as my call-back number</label>' +
        '<div class="p-save"><button class="btn btn-sand" type="submit">Save numbers</button></div>' +
      '</form>' +
      '<form class="p-card p-form" data-form="baptism" data-id="' + esc(m.id) + '">' +
        '<h3>Baptism</h3><p class="p-hint">Leave this empty if you haven’t been baptised yet.</p>' +
        '<label>Date of baptism<input name="baptism_date" type="date" value="' + esc(m.baptism_date || '') + '"></label>' +
        '<label>Country<input name="baptism_country" autocomplete="country-name" value="' + esc(m.baptism_country || '') + '"></label>' +
        '<label class="wide">Church<input name="baptism_church" placeholder="Name of the church" value="' + esc(m.baptism_church || '') + '"></label>' +
        '<label class="wide">Pastor who baptised you<input name="baptism_pastor" value="' + esc(m.baptism_pastor || '') + '"></label>' +
        '<div class="wide p-file" data-file="cert">' +
          '<span class="p-file-label">Baptism certificate <em>(optional)</em></span>' +
          '<div class="p-file-row"><span class="p-file-name" data-cert-name>' + (m.baptism_cert_path ? 'Certificate uploaded' : 'No certificate uploaded') + '</span>' +
          (m.baptism_cert_path ? '<button type="button" class="p-link" data-cert-view>View</button><button type="button" class="p-link danger" data-cert-remove>Remove</button>' : '') +
          '<label class="btn btn-line-dark p-upload">' + (m.baptism_cert_path ? 'Replace' : 'Upload') + ' certificate<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" data-cert-input hidden></label></div>' +
          '<small class="p-hint">PDF, JPG or PNG, up to ' + MAX_MB + ' MB.</small>' +
        '</div>' +
        '<div class="p-save"><button class="btn btn-sand" type="submit">Save baptism details</button></div>' +
      '</form>' +
      '<section class="p-card" data-family data-id="' + esc(m.id) + '">' +
        '<h3>My family</h3><p class="p-hint">Add the people in your household, including children.</p>' +
        '<ul class="p-family" data-family-list><li class="p-empty">Loading…</li></ul>' +
        '<details class="p-add"><summary class="btn btn-line-dark">Add a family member</summary>' + familyForm({}, id) + '</details>' +
      '</section>';
  }
  function familyForm(f, idp) {
    var REL = ['Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Brother', 'Sister', 'Other'];
    return '<form class="p-form p-fam-form" data-form="family"' + (f.id ? ' data-fid="' + esc(f.id) + '"' : '') + '>' +
      '<label class="wide">Full name<input name="full_name" required value="' + esc(f.full_name || '') + '"></label>' +
      '<label>Relationship<select name="relationship" required>' + opt(REL, f.relationship, 'Choose') + '</select></label>' +
      '<label>Date of birth<input name="date_of_birth" type="date" value="' + esc(f.date_of_birth || '') + '"></label>' +
      '<label>Phone (optional)<input name="phone" type="tel" inputmode="tel" value="' + esc(f.phone || '') + '"></label>' +
      '<label>Baptised?<select name="is_baptized">' + opt(['Yes', 'No'], f.is_baptized === true ? 'Yes' : f.is_baptized === false ? 'No' : '', 'Not sure') + '</select></label>' +
      '<div class="p-save">' + (f.id ? '<button type="button" class="p-link" data-fam-cancel>Cancel</button>' : '') + '<button class="btn btn-sand" type="submit">' + (f.id ? 'Save' : 'Add to my family') + '</button></div>' +
    '</form>';
  }

  function renderMe() {
    var m = state.me;
    $('#me-panel').innerHTML =
      '<div class="p-card p-head">' +
        '<div class="p-photo" data-photo>' + '<span>' + esc(initials(m.full_name)) + '</span></div>' +
        '<div class="p-head-txt"><h2>' + esc(m.full_name) + '</h2><p>' + esc(m.email) + '</p>' +
          '<div class="p-head-actions"><label class="btn btn-line-dark p-upload">' + (m.photo_path ? 'Change photo' : 'Add my photo') + '<input type="file" accept="image/jpeg,image/png,image/webp" data-photo-input hidden></label>' +
          (m.photo_path ? '<button type="button" class="p-link danger" data-photo-remove>Remove photo</button>' : '') + '</div></div>' +
      '</div>' + profileForm(m, false);
    var old = $('#me-panel'), panel = old.cloneNode(true); old.parentNode.replaceChild(panel, old); // fresh element: no duplicate handlers
    paintPhoto($('[data-photo]', panel), m);
    loadFamily(panel, m.id);
    wireProfile(panel, m, function (updated) { state.me = updated; $('#who-name').textContent = updated.full_name; });
  }
  function paintPhoto(el, m) {
    if (!el || !m.photo_path) return;
    signed(m.photo_path).then(function (u) { if (u) el.innerHTML = '<img src="' + esc(u) + '" alt="Photo of ' + esc(m.full_name) + '">'; });
  }

  // one wiring for both "my profile" and the staff edit view
  function wireProfile(panel, m, onSaved) {
    function patch(fields, btn) {
      busy(btn, true, 'Saving…');
      return sb.from('members').update(fields).eq('id', m.id).select().single().then(function (r) {
        busy(btn, false);
        if (r.error) { toast(friendlyError(r.error), 'err'); throw r.error; }
        Object.assign(m, r.data); onSaved && onSaved(r.data); toast('Saved.');
        return r.data;
      });
    }
    var same = $('[data-form=contact] [name=same]', panel);
    function syncSame() { var f = $('[data-form=contact]', panel); if (same.checked) { f.whatsapp.value = f.phone_callback.value; } f.whatsapp.readOnly = same.checked; }
    same.addEventListener('change', syncSame);
    $('[data-form=contact] [name=phone_callback]', panel).addEventListener('input', function () { if (same.checked) syncSame(); });
    if (same.checked) syncSame();

    panel.addEventListener('submit', function (e) {
      var f = e.target, kind = f.getAttribute('data-form'); if (!kind) return;
      e.preventDefault();
      var btn = $('button[type=submit]', f);
      if (kind === 'details') {
        var d = { full_name: val(f.full_name.value), date_of_birth: val(f.date_of_birth.value), gender: val(f.gender.value), marital_status: val(f.marital_status.value), home_location: val(f.home_location.value), address: val(f.address.value) };
        if (f.email) d.email = val(f.email.value) && f.email.value.trim().toLowerCase();
        if (!d.full_name) return toast('Please enter a name.', 'err');
        patch(d, btn);
      } else if (kind === 'contact') {
        patch({ phone_callback: val(f.phone_callback.value), whatsapp: val(f.whatsapp.value) }, btn);
      } else if (kind === 'baptism') {
        patch({ baptism_date: val(f.baptism_date.value), baptism_country: val(f.baptism_country.value), baptism_church: val(f.baptism_church.value), baptism_pastor: val(f.baptism_pastor.value) }, btn);
      } else if (kind === 'family') {
        var row = { full_name: val(f.full_name.value), relationship: val(f.relationship.value), date_of_birth: val(f.date_of_birth.value), phone: val(f.phone.value), is_baptized: f.is_baptized.value === 'Yes' ? true : f.is_baptized.value === 'No' ? false : null };
        if (!row.full_name || !row.relationship) return toast('Please add a name and relationship.', 'err');
        busy(btn, true, 'Saving…');
        var fid = f.getAttribute('data-fid');
        var q = fid ? sb.from('family_members').update(row).eq('id', fid) : sb.from('family_members').insert(Object.assign({ member_id: m.id }, row));
        q.then(function (r) {
          busy(btn, false);
          if (r.error) return toast(friendlyError(r.error), 'err');
          toast(fid ? 'Saved.' : 'Family member added.');
          if (!fid) { f.reset(); var det = f.closest('details'); if (det) det.open = false; }
          loadFamily(panel, m.id);
        });
      }
    });

    panel.addEventListener('change', function (e) {
      var t = e.target;
      if (t.matches('[data-photo-input]') && t.files[0]) {
        var old = m.photo_path;
        toast('Uploading your photo…', 'info');
        uploadFile(m.id, 'photo', t.files[0]).then(function (path) { return patch({ photo_path: path }).then(function () { return removeFile(old); }); })
          .then(function () { if (panel.id === 'me-panel') renderMe(); else openMember(m.id); })
          .catch(function (err) { toast(friendlyError(err), 'err'); });
      }
      if (t.matches('[data-cert-input]') && t.files[0]) {
        var oldc = m.baptism_cert_path;
        toast('Uploading the certificate…', 'info');
        uploadFile(m.id, 'baptism-certificate', t.files[0]).then(function (path) { return patch({ baptism_cert_path: path }).then(function () { return removeFile(oldc); }); })
          .then(function () { if (panel.id === 'me-panel') renderMe(); else openMember(m.id); })
          .catch(function (err) { toast(friendlyError(err), 'err'); });
      }
    });

    panel.addEventListener('click', function (e) {
      var t = e.target;
      if (t.closest('[data-cert-view]')) { signed(m.baptism_cert_path).then(function (u) { if (u) window.open(u, '_blank', 'noopener'); }); }
      if (t.closest('[data-cert-remove]') && confirmDel('Remove the baptism certificate?')) {
        var p = m.baptism_cert_path; patch({ baptism_cert_path: null }).then(function () { return removeFile(p); }).then(function () { panel.id === 'me-panel' ? renderMe() : openMember(m.id); });
      }
      if (t.closest('[data-photo-remove]') && confirmDel('Remove your photo?')) {
        var pp = m.photo_path; patch({ photo_path: null }).then(function () { return removeFile(pp); }).then(function () { panel.id === 'me-panel' ? renderMe() : openMember(m.id); });
      }
      var ed = t.closest('[data-fam-edit]');
      if (ed) { var li = ed.closest('li'); var f = (panel._family || []).filter(function (x) { return x.id === li.dataset.fid; })[0]; if (f) li.innerHTML = familyForm(f); }
      if (t.closest('[data-fam-cancel]')) loadFamily(panel, m.id);
      var del = t.closest('[data-fam-del]');
      if (del && confirmDel('Remove this person from your family list?')) {
        sb.from('family_members').delete().eq('id', del.closest('li').dataset.fid).then(function (r) {
          if (r.error) return toast(friendlyError(r.error), 'err');
          toast('Removed.'); loadFamily(panel, m.id);
        });
      }
    });
  }
  function confirmDel(q) { return window.confirm(q); }

  function loadFamily(panel, memberId) {
    panel = panel || $('#me-panel'); memberId = memberId || (state.me && state.me.id);
    var list = $('[data-family-list]', panel); if (!list || !memberId) return;
    sb.from('family_members').select('*').eq('member_id', memberId).order('created_at').then(function (r) {
      if (r.error) { list.innerHTML = '<li class="p-empty">' + esc(friendlyError(r.error)) + '</li>'; return; }
      panel._family = r.data;
      list.innerHTML = r.data.length ? r.data.map(function (f) {
        var bits = [f.relationship, f.date_of_birth ? 'Born ' + fmtDate(f.date_of_birth) : '', f.is_baptized === true ? 'Baptised' : '', f.phone || ''].filter(Boolean);
        return '<li data-fid="' + esc(f.id) + '"><span class="p-av sm">' + esc(initials(f.full_name)) + '</span><div><b>' + esc(f.full_name) + '</b><small>' + esc(bits.join(' · ')) + '</small></div>' +
          '<span class="p-row-actions"><button type="button" class="p-link" data-fam-edit>Edit</button><button type="button" class="p-link danger" data-fam-del>Remove</button></span></li>';
      }).join('') : '<li class="p-empty">No family members added yet.</li>';
    });
  }

  // ---------- staff dashboard ----------
  function loadAll() {
    var box = $('#staff-list'); box.innerHTML = '<p class="p-empty">Loading members…</p>';
    Promise.all([
      sb.from('members').select('*').order('full_name'),
      sb.from('family_members').select('member_id')
    ]).then(function (res) {
      if (res[0].error) throw res[0].error;
      state.all = res[0].data;
      var fam = {}; (res[1].data || []).forEach(function (f) { fam[f.member_id] = (fam[f.member_id] || 0) + 1; });
      state.famCount = fam;
      var a = state.all;
      $('#st-total').textContent = a.length;
      $('#st-active').textContent = a.filter(function (m) { return m.user_id; }).length;
      $('#st-baptised').textContent = a.filter(function (m) { return m.baptism_date || m.baptism_church; }).length;
      $('#st-family').textContent = (res[1].data || []).length;
      renderList();
      var paths = a.filter(function (m) { return m.photo_path; }).map(function (m) { return m.photo_path; });
      if (paths.length) sb.storage.from(BUCKET).createSignedUrls(paths, 3600).then(function (r) {
        state.thumbs = {}; (r.data || []).forEach(function (x) { if (x.signedUrl) state.thumbs[x.path] = x.signedUrl; });
        renderList();
      });
    }).catch(function (err) { box.innerHTML = '<p class="p-empty">' + esc(friendlyError(err)) + '</p>'; });
  }
  function renderList() {
    var q = ($('#st-search').value || '').trim().toLowerCase(), loc = $('#st-loc').value, box = $('#staff-list');
    var rows = state.all.filter(function (m) {
      if (loc && m.home_location !== loc) return false;
      if (!q) return true;
      return [m.full_name, m.email, m.phone_callback, m.whatsapp, m.baptism_church].join(' ').toLowerCase().indexOf(q) > -1;
    });
    $('#st-count').textContent = rows.length === state.all.length ? rows.length + ' members' : rows.length + ' of ' + state.all.length + ' members';
    box.innerHTML = rows.length ? '<ul class="p-mlist">' + rows.map(function (m) {
      var th = m.photo_path && state.thumbs && state.thumbs[m.photo_path];
      return '<li><button type="button" data-open="' + esc(m.id) + '">' +
        (th ? '<img class="p-av" src="' + esc(th) + '" alt="">' : '<span class="p-av">' + esc(initials(m.full_name)) + '</span>') +
        '<span class="p-m-main"><b>' + esc(m.full_name) + '</b><small>' + esc(m.email) + '</small></span>' +
        '<span class="p-m-col">' + esc(m.home_location || '—') + '</span>' +
        '<span class="p-m-col">' + esc(m.whatsapp || m.phone_callback || '—') + '</span>' +
        '<span class="p-m-col">' + (m.baptism_date ? 'Baptised ' + esc(fmtDate(m.baptism_date)) : m.baptism_church ? 'Baptised' : '—') + '</span>' +
        '<span class="p-pill ' + (m.user_id ? 'on' : '') + '">' + (m.user_id ? 'Signed up' : 'Not signed up') + '</span>' +
      '</button></li>';
    }).join('') + '</ul>' : '<p class="p-empty">' + (state.all.length ? 'No members match your search.' : 'No members yet. Add the first one with “Add a member”.') + '</p>';
  }
  $('#st-search').addEventListener('input', function () { if (state.all) renderList(); });
  $('#st-loc').addEventListener('change', function () { if (state.all) renderList(); });
  $('#staff-list').addEventListener('click', function (e) { var b = e.target.closest('[data-open]'); if (b) openMember(b.getAttribute('data-open')); });

  function openMember(id) {
    var m = state.all.filter(function (x) { return x.id === id; })[0]; if (!m) return;
    var d = $('#st-detail');
    var wa = waLink(m.whatsapp);
    d.innerHTML =
      '<div class="p-card p-head">' +
        '<div class="p-photo" data-photo><span>' + esc(initials(m.full_name)) + '</span></div>' +
        '<div class="p-head-txt"><h2>' + esc(m.full_name) + '</h2><p>' + esc(m.email) + ' · ' + (m.user_id ? 'signed up' : 'not signed up yet') + '</p>' +
          '<div class="p-head-actions">' + (wa ? '<a class="btn btn-sand" href="' + esc(wa) + '" target="_blank" rel="noopener">WhatsApp</a>' : '') +
          (m.phone_callback ? '<a class="btn btn-line-dark" href="tel:' + esc(m.phone_callback.replace(/[^\d+]/g, '')) + '">Call ' + esc(m.phone_callback) + '</a>' : '') +
          '<label class="btn btn-line-dark p-upload">' + (m.photo_path ? 'Change photo' : 'Add photo') + '<input type="file" accept="image/jpeg,image/png,image/webp" data-photo-input hidden></label></div></div>' +
        '<button type="button" class="p-close" data-close aria-label="Back to all members">← All members</button>' +
      '</div>' + profileForm(m, true) +
      '<div class="p-card p-danger"><h3>Remove member</h3><p class="p-hint">Deletes this member, their family list and their files. This can’t be undone.</p><button type="button" class="btn p-btn-danger" data-delete-member>Remove ' + esc(m.full_name) + '</button></div>';
    var fresh = d.cloneNode(true); d.parentNode.replaceChild(fresh, d); d = fresh; // drop old listeners
    d.hidden = false; $('#st-browse').hidden = true;
    paintPhoto($('[data-photo]', d), m);
    wireProfile(d, m, function (u) { var i = state.all.indexOf(m); if (i > -1) state.all[i] = Object.assign(m, u); });
    loadFamily(d, m.id);
    d.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) { d.hidden = true; $('#st-browse').hidden = false; renderList(); }
      if (e.target.closest('[data-delete-member]') && window.confirm('Remove ' + m.full_name + ' from the church records? This can’t be undone.')) {
        var files = [m.photo_path, m.baptism_cert_path].filter(Boolean);
        (files.length ? sb.storage.from(BUCKET).remove(files) : Promise.resolve()).then(function () { return sb.from('members').delete().eq('id', m.id); }).then(function (r) {
          if (r && r.error) return toast(friendlyError(r.error), 'err');
          toast('Member removed.'); d.hidden = true; $('#st-browse').hidden = false; loadAll();
        });
      }
    });
    d.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // add a member (staff)
  $('#f-add').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target, btn = $('button[type=submit]', f);
    var row = { full_name: val(f.full_name.value), email: (f.email.value || '').trim().toLowerCase(), home_location: val(f.home_location.value), whatsapp: val(f.whatsapp.value) };
    if (!row.full_name || !row.email) return toast('Please enter a name and email.', 'err');
    busy(btn, true, 'Adding…');
    sb.from('members').insert(row).select().single().then(function (r) {
      busy(btn, false);
      if (r.error) return toast(/duplicate|unique/i.test(r.error.message) ? 'A member with this email already exists.' : friendlyError(r.error), 'err');
      f.reset(); f.closest('details').open = false;
      toast(row.full_name + ' added. They can now create a password on this page with ' + row.email + '.');
      loadAll();
    });
  });

  // CSV export for staff
  $('#st-export').addEventListener('click', function () {
    var cols = ['full_name', 'email', 'home_location', 'phone_callback', 'whatsapp', 'date_of_birth', 'gender', 'marital_status', 'address', 'baptism_date', 'baptism_church', 'baptism_pastor', 'baptism_country'];
    var csv = [cols.join(',')].concat(state.all.map(function (m) { return cols.map(function (c) { var v = m[c] == null ? '' : String(m[c]); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','); })).join('\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })); a.download = 'gmi-members.csv'; a.click();
  });
})();
