/* GoodLuck! in your browser: the app's own pages, played without a server.

   It opens the panels, the Settings sheet and the sidebar as the app does,
   draws the journal from state.json, and every half minute plays a round of
   the session so you can watch it work. Anything that would change your data
   in the real app shows a short note instead. Every name in it is fictional. */
(() => {
  'use strict';
  const $ = (sel, root) => [...(root || document).querySelectorAll(sel)];
  const body = document.body;
  const ROUND_EVERY = 30000;
  const STEP = 650;
  let state = { state: 'idle', next_in: 42, events: [] };
  let running = false;

  // ------------------------------------------------------------ the note
  const style = document.createElement('style');
  style.textContent =
    '.simnote{position:fixed;left:50%;bottom:44px;transform:translate(-50%,12px);' +
    'z-index:90;max-width:min(520px,90vw);padding:10px 16px;border-radius:10px;' +
    'background:var(--panel-2);border:1px solid var(--line-2);color:var(--ink);' +
    'font-size:12.5px;box-shadow:0 12px 40px rgba(0,0,0,.45);opacity:0;' +
    'pointer-events:none;transition:opacity .2s,transform .2s}' +
    '.simnote.on{opacity:1;transform:translate(-50%,0)}' +
    '.simbadge{position:fixed;right:14px;bottom:34px;z-index:80;font-size:11px;' +
    'padding:4px 10px;border-radius:999px;background:var(--panel);' +
    'border:1px solid var(--line-2);color:var(--mute)}' +
    '.simbadge a{color:var(--acc);text-decoration:none;margin-left:6px}' +
    '.simhl{outline:2px solid #F2B866;outline-offset:3px;border-radius:8px;' +
    'animation:simhl 1.6s ease-in-out infinite}' +
    '@keyframes simhl{50%{outline-color:rgba(242,184,102,.25)}}' +
    '@media (prefers-reduced-motion:reduce){.simhl{animation:none}}';
  document.head.appendChild(style);

  // ------------------------------------------------------------ pointed at
  // The site's guide shows a screen at the control it is talking about:
  //   page.html#hl=run                 ring a control (a name below, or CSS)
  //   page.html#sheet=settings.html&tab=bao   open a sheet, at a tab
  //   first.html#open=mail             unfold a card of the Setting up sheet
  // The ring is brought into view inside this page only (the page around
  // the frame does not move). Such a screen is part of the guide, so it
  // carries no demo badge.
  const NAMED = {
    run: '.deckpill',
    best: "[data-widget]:has(a[href='search-best.html'])",
    titles: '[data-tagfield]:has([name=job_titles])',
    skills: '[data-tagfield]:has([name=skills_strong])',
    import: '.impform',
    mail: "details.oconn:has(form[data-post='/api/mail/setup'])",
    phone: "details.oconn:has(form[data-post='/api/phone/setup'])",
    why: '.bdcard',
    applied: "[data-post='/api/track/add']",
    queue: '.mbtn.qua',
    settings: '[data-appset]',
  };
  const asked = new URLSearchParams(location.hash.slice(1));
  const pick = (name) => {
    try { return name ? $(NAMED[name] || name) : []; } catch (err) { return []; }
  };
  function reveal(el) {
    let box = el.parentElement;
    while (box && box !== body && !(box.scrollHeight > box.clientHeight &&
           /(auto|scroll)/.test(getComputedStyle(box).overflowY))) box = box.parentElement;
    const top = el.getBoundingClientRect().top;
    if (box && box !== body) box.scrollTop += top - box.getBoundingClientRect().top - box.clientHeight / 3;
    else document.scrollingElement.scrollTop += top - innerHeight / 3;
  }
  function point() {
    pick(asked.get('open')).forEach((el) => {
      const fold = el.closest('details') || el.querySelector('details');
      if (fold) fold.open = true;
    });
    const tab = asked.get('tab') && document.querySelector(`[data-stab='${asked.get('tab')}']`);
    if (tab) tab.click();
    const ringed = pick(asked.get('hl'));
    ringed.forEach((el) => el.classList.add('simhl'));
    if (ringed.length) setTimeout(() => reveal(ringed[0]), 60);
  }
  const guided = ['hl', 'open', 'tab', 'sheet'].some((k) => asked.has(k));

  const badge = document.createElement('div');
  badge.className = 'simbadge';
  badge.innerHTML = 'Demo with fictional data<a href="../download/" target="_top">Download</a>';
  if (!guided) body.appendChild(badge);

  let noteTimer = 0;
  function note(text) {
    let el = document.querySelector('.simnote');
    if (!el) {
      el = document.createElement('div');
      el.className = 'simnote';
      body.appendChild(el);
    }
    el.textContent = text ||
      'This is a demo. Download GoodLuck! to do this with your own search.';
    el.classList.add('on');
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => el.classList.remove('on'), 2800);
  }

  // ------------------------------------------------------------ the journal
  const timeOf = (iso) => {
    const d = new Date(iso);
    return isNaN(d) ? '' : d.toTimeString().slice(0, 8);
  };

  function addLine(box, ev, newest) {
    const want = box.dataset.journal;
    if (want && want.split(' ').indexOf(ev.stream) < 0) return;
    const row = document.createElement('div');
    row.className = 'jline ' + (ev.level || 'info');
    row.innerHTML = '<span class=jtime></span>' +
      (want ? '' : '<span class=jstream></span>') + '<span class=jtext></span>';
    row.querySelector('.jtime').textContent = timeOf(ev.at);
    if (!want) row.querySelector('.jstream').textContent = ev.stream;
    row.querySelector('.jtext').textContent = ev.text;
    if (newest) box.insertBefore(row, box.firstChild);
    else box.appendChild(row);
    while (box.childElementCount > 80) box.removeChild(box.lastChild);
  }

  function say(stream, level, text) {
    const ev = { at: new Date().toISOString(), stream: stream, level: level, text: text };
    $('[data-journal]').forEach((b) => addLine(b, ev, true));
    $('[data-lastmsg]').forEach((el) => { el.textContent = text; });
  }

  // ------------------------------------------------------------ the state
  function label(run, mins) {
    if (run === 'running') return 'session running';
    if (run === 'paused') return 'watch station: OFF';
    return mins > 0 ? 'on watch · next round in ' + mins + ' min' : 'on watch';
  }

  function setRun(run) {
    body.dataset.run = run;
    $('[data-state]').forEach((el) => { el.textContent = label(run, state.next_in); });
    $('.rlive').forEach((el) => { el.title = label(run, state.next_in); });
  }

  function idle() {
    $('[data-progress]').forEach((b) => {
      b.innerHTML = '<div class=pidle>nothing is running</div>';
    });
  }

  // ------------------------------------------------------------ a round, played
  function boards() {
    const found = [];
    state.events.forEach((ev) => {
      const m = /^([a-z]+:[a-z0-9]+): \d+ fetched/.exec(ev.text || '');
      if (m && found.indexOf(m[1]) < 0) found.push(m[1]);
    });
    return found.length ? found : ['greenhouse:boards', 'lever:boards', 'ashby:boards'];
  }

  function playRound() {
    if (running) return;
    running = true;
    setRun('running');
    const list = boards();
    const total = list.length + 4;
    let done = 0;
    let fetched = 0;
    let fresh = 0;
    say('system', 'ok', 'session started: Search → Manage mail');
    say('search', 'info', 'scan started: ' + list.length + ' sources');
    $('[data-progress]').forEach((b) => {
      b.innerHTML = '<div class=prow><div class=phead><b></b><span></span></div>' +
        '<div class=ptrack><i style="width:0%"></i></div></div>';
    });
    const tick = setInterval(() => {
      done += 1;
      const source = list[(done - 1) % list.length];
      const got = 20 + Math.floor(Math.random() * 180);
      const add = Math.random() < 0.45 ? 1 + Math.floor(Math.random() * 3) : 0;
      fetched += got;
      fresh += add;
      if (done <= list.length) say('search', 'info', source + ': ' + got + ' fetched, ' + add + ' new');
      $('[data-progress]').forEach((b) => {
        const what = b.querySelector('.phead b');
        if (!what) return;
        what.textContent = done <= list.length ? 'search · reading ' + source : 'search · scoring';
        b.querySelector('.phead span').textContent = Math.min(done, total) + '/' + total;
        b.querySelector('.ptrack i').style.width = Math.min(100, done / total * 100) + '%';
      });
      if (done < total) return;
      clearInterval(tick);
      const kept = Math.max(1, Math.round(fresh / 2));
      say('search', 'ok', 'scan finished: fetched ' + fetched.toLocaleString('en-GB') +
          ' · new ' + fresh + ' · kept ' + kept);
      say('score', 'ok', 're-judged ' + kept + ' · scored ' + kept);
      say('mail', 'ok', 'mail: 0 new · 0 applications moved on · 0 for you in the Queue');
      say('system', 'ok', 'session done: 2/2 stages ran');
      state.next_in = 60;
      setTimeout(() => { idle(); setRun('idle'); running = false; }, 900);
    }, STEP);
  }

  // ------------------------------------------------------------ the sheet
  const sheet = document.querySelector('[data-sheet]');
  function openSheet(url) {
    if (!sheet) return Promise.resolve();
    return fetch(url).then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.text();
    }).then((html) => {
      const box = sheet.querySelector('.sheetbox');
      const doc = new DOMParser().parseFromString(html, 'text/html');
      box.innerHTML = doc.body ? doc.body.innerHTML : html;
      sheet.hidden = false;
    }).catch(() => note('This opens in the app itself.'));
  }
  function closeSheet() {
    if (sheet) { sheet.hidden = true; sheet.querySelector('.sheetbox').innerHTML = ''; }
  }

  // ------------------------------------------------------------ the chips
  const SHOW = 8;
  const wordsOf = (t) => (t || '').toLowerCase().split(/[^a-z0-9+#]+/).filter(Boolean);
  function filter(drop, term) {
    const typed = wordsOf(term);
    let shown = 0;
    $('[data-addtag]', drop).forEach((chip) => {
      const words = wordsOf(chip.dataset.addtag);
      const hit = typed.every((t) => words.some((w) => w.indexOf(t) === 0));
      chip.hidden = !(hit && shown < (typed.length ? 10 : SHOW));
      if (!chip.hidden) shown += 1;
    });
    const none = drop.querySelector('.sugnone');
    if (none) none.hidden = !(typed.length && !shown);
  }
  function addTag(field, text) {
    const box = field.querySelector('[data-tags]');
    if (!box || !text) return;
    const have = $('.tag > input', box).map((i) => i.value.toLowerCase());
    if (have.indexOf(text.toLowerCase()) >= 0) return;
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = text;
    const kill = document.createElement('button');
    kill.type = 'button';
    kill.className = 'untag';
    kill.dataset.untag = '';
    kill.textContent = '×';
    const keep = document.createElement('input');
    keep.type = 'hidden';
    keep.value = text;
    tag.append(keep, kill);
    box.insertBefore(tag, box.querySelector('.tagempty'));
  }

  // ------------------------------------------------------------ the clicks
  document.addEventListener('click', (e) => {
    const t = e.target;
    const grow = t.closest('[data-expand]');
    if (grow) {
      e.preventDefault();
      const w = grow.closest('[data-widget]');
      if (!w) return;
      const on = !w.classList.contains('big');
      $('[data-widget].big').forEach((x) => x.classList.remove('big'));
      if (on) w.classList.add('big');
      return;
    }
    if (t.closest('[data-appset]')) {
      e.preventDefault();
      openSheet('settings.html');
      return;
    }
    if (t.closest('[data-close]') || (sheet && t === sheet)) { e.preventDefault(); closeSheet(); return; }
    const tab = t.closest('[data-stab]');
    if (tab) {
      e.preventDefault();
      const box = tab.closest('.sheetbox');
      if (!box) return;
      $('[data-stab]', box).forEach((b) => b.classList.toggle('on', b === tab));
      $('[data-pane]', box).forEach((p) => p.classList.toggle('on', p.dataset.pane === tab.dataset.stab));
      return;
    }
    if (t.closest('[data-nav]')) {
      e.preventDefault();
      const min = document.documentElement.classList.toggle('navmin');
      try { localStorage.jobbotNav = min ? '1' : '0'; } catch (err) { /* private window */ }
      return;
    }
    const chip = t.closest('[data-addtag]');
    if (chip) {
      e.preventDefault();
      const field = chip.closest('[data-tagfield]');
      if (field) { addTag(field, chip.dataset.addtag); chip.remove(); filter(chip.closest('[data-sugdrop]') || field, ''); }
      return;
    }
    const untag = t.closest('[data-untag]');
    if (untag) { e.preventDefault(); untag.closest('.tag').remove(); return; }
    const run = t.closest('[data-run]');
    if (run && /round|session/i.test(run.textContent)) {
      e.preventDefault();
      if (running) note('A round is already running: watch the bar and the journal.');
      else playRound();
      return;
    }
    if (t.closest('[data-demo], [data-post], [data-settings], [data-auto], [data-send], button[type=submit]')) {
      e.preventDefault();
      note();
    }
  });
  document.addEventListener('submit', (e) => { e.preventDefault(); note(); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    $('[data-widget].big').forEach((x) => x.classList.remove('big'));
    closeSheet();
  });
  document.addEventListener('input', (e) => {
    if (!e.target.classList || !e.target.classList.contains('tagfind')) return;
    const field = e.target.closest('[data-tagfield]');
    const drop = field && field.querySelector('[data-sugdrop]');
    if (drop) filter(drop, e.target.value);
  });

  // ------------------------------------------------------------ on arrival
  // THE FIRST LAUNCH (first.html, an empty store) opens on its Setting up
  // sheet, with the station off and nothing playing, as the app does.
  const firstLaunch = Boolean(body.dataset.setup);
  $('[data-sugdrop]').forEach((drop) => filter(drop, ''));
  idle();
  setRun(firstLaunch ? 'paused' : 'idle');
  const opening = asked.get('sheet') || (firstLaunch ? 'onboarding.html' : '');
  (opening ? openSheet(opening) : Promise.resolve()).then(point);
  if (!firstLaunch) {
    fetch('assets/state.json').then((r) => r.json()).then((s) => {
      state = Object.assign(state, s, { state: 'idle' });
      $('[data-journal]').forEach((b) => {
        b.innerHTML = '';
        state.events.forEach((ev) => addLine(b, ev, false));
      });
      if (state.events.length) $('[data-lastmsg]').forEach((el) => { el.textContent = state.events[0].text; });
      setRun('idle');
    }).catch(() => { /* opened from disk: the journal stays empty */ });
    setTimeout(playRound, 6000);
    setInterval(playRound, ROUND_EVERY);
  }
})();
