// A DAY WITH THE DUCK: the scroll is the time. As it goes, the sky, the clock,
// the words and the app on the desk move with it. The app on the desk is the
// app's own box (its page, drawn by the app on made-up names and real
// numbers: data/full.js), and what comes into its chat is what the app itself
// said at each hour of that day: the report, today's forms, a no read for what
// it teaches, the evening's report. Its buttons answer with the app's own
// words, here and nowhere else. It comes under the first screen (intro.js).
(() => {
  const F = window.FULL || {};
  const $ = (sel, root = document) => root.querySelector(sel);
  const story = $('#story');
  const root = document.documentElement;
  const desk = $('[data-desk]');
  const log = $('[data-log]');
  const caps = Array.from(document.querySelectorAll('.cap'));
  const hh = $('[data-hh]');
  const mm = $('[data-mm]');
  const now = $('[data-now]');
  const fmt = (n) => Number(n || 0).toLocaleString('en-GB');
  const two = (n) => String(n).padStart(2, '0');
  const el = (tag, cls, text) => {
    const made = document.createElement(tag);
    if (cls) made.className = cls;
    if (text !== undefined) made.textContent = text;
    return made;
  };

  // ---- THE APP'S OWN BOX, from its own page, on the desk: the pill, the chat
  // under it, the line typed into.
  const page = new DOMParser().parseFromString(F.box_watch || '', 'text/html');
  const made = page.querySelector('[data-box]');
  const box = made ? document.importNode(made, true) : el('div', 'bxbox');
  desk.insertBefore(box, desk.firstChild);
  const q = (sel) => box.querySelector(sel);
  const duck = q('.bxduck');
  const line = q('[data-box-line]');
  const num = q('[data-box-pill]');
  const drop = q('[data-box-drop]');
  const chat = q('[data-box-chat]');
  const thread = q('[data-box-thread]');
  const find = q('[data-box-find]');
  if (find) { find.placeholder = box.dataset.ask || find.placeholder; find.readOnly = true; }
  if (thread) thread.textContent = '';
  // The screens to open are the app's, on the machine: here they open nothing.
  box.querySelectorAll('[data-box-choices], [data-box-help]').forEach((n) => { n.hidden = true; });
  root.style.setProperty('--duck', duck ? duck.style.getPropertyValue('--duck') : '');
  const words = (() => { try { return JSON.parse(num.dataset.lines || '[]'); } catch (e) { return []; } })();

  // The night's numbers, written into the words that name them.
  document.querySelectorAll('[data-n]').forEach((b) => {
    b.textContent = fmt(b.dataset.n.split('.').reduce((o, k) => (o || {})[k], F.night || {}));
  });

  // ---- the stars: a sky of its own, drawn once a size
  const canvas = $('.stars');
  const stars = () => {
    const ratio = Math.min(2, devicePixelRatio || 1);
    canvas.width = innerWidth * ratio;
    canvas.height = innerHeight * ratio;
    const pen = canvas.getContext('2d');
    let seed = 7;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const many = Math.round((innerWidth * innerHeight) / 5200);
    for (let i = 0; i < many; i += 1) {
      const r = (rand() < 0.08 ? 1.5 : rand() < 0.5 ? 1 : 0.6) * ratio;
      pen.globalAlpha = 0.25 + rand() * 0.75;
      pen.fillStyle = rand() < 0.15 ? '#cdd6ff' : '#ffffff';
      pen.beginPath();
      pen.arc(rand() * canvas.width, rand() * canvas.height * 0.85, r, 0, Math.PI * 2);
      pen.fill();
    }
  };

  // ---- what the app says, drawn as its chat draws it (live.js: say, botWords,
  // studyOf, foundOf, offerRow)
  let turningUntil = 0;
  const turn = (ms) => {
    if (!duck) return;
    turningUntil = Math.max(turningUntil, performance.now() + ms);
    duck.classList.add('turn');
  };
  if (duck) {
    duck.addEventListener('animationiteration', () => {
      if (performance.now() >= turningUntil) duck.classList.remove('turn');
    });
  }
  const sayOf = (who, text) => el('div', 'bxmsg ' + who, text);
  const botOf = (markup) => {
    const msg = el('div', 'bxmsg bot');
    const held = document.createElement('template');
    held.innerHTML = String(markup || '');
    const clean = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType !== 1) return;
        clean(child);
        const tag = child.tagName.toLowerCase();
        if (['b', 'strong', 'i', 'em', 'u', 's', 'code', 'pre'].indexOf(tag) < 0) {
          child.replaceWith(document.createTextNode(child.textContent));
          return;
        }
        Array.from(child.attributes).forEach((at) => child.removeAttribute(at.name));
      });
    };
    clean(held.content);
    msg.appendChild(held.content);
    return msg;
  };
  const studyOf = (j) => {
    const block = el('div', 'bxstudy');
    if (j.verdict && j.verdict.text) {
      block.appendChild(el('div', 'bxverdict ' + (j.verdict.ok ? 'ok' : 'bad'), j.verdict.text));
    }
    const list = (title, lines, kind) => {
      if (!(lines || []).length) return;
      block.appendChild(el('h4', '', title));
      const items = el(kind);
      lines.forEach((x) => items.appendChild(el('li', '', x)));
      block.appendChild(items);
    };
    list(box.dataset.why || 'Why', (j.why || []).slice(0, 4), 'ul');
    list(box.dataset.plan || 'What to do', j.plan || [], 'ol');
    return block;
  };
  // A BUTTON PRESSED HERE says what the app's own would say (its `done`), and
  // it and its fellows are done with; what would open a window or ask first
  // says it is the app's to do.
  const press = (made, b, card) => {
    thread.appendChild(sayOf('you', made.label));
    turn(900);
    setTimeout(() => {
      thread.appendChild(sayOf('bot', made.done || 'In the app, this does it for you.'));
      thread.scrollTop = thread.scrollHeight;
      if (card) card.querySelectorAll('.bxdo').forEach((other) => { other.disabled = true; });
      b.classList.add('on');
    }, 650);
    thread.scrollTop = thread.scrollHeight;
  };
  const foundOf = (j) => {
    const block = el('div', 'bxfound');
    (j.rows || []).forEach((row) => {
      const card = el('div', 'bxcard');
      card.appendChild(el('div', 'bxhead', row.head));
      if (row.sub) card.appendChild(el('div', 'bxsub', row.sub));
      (row.lines || []).forEach((x) => card.appendChild(el('div', 'bxfact', x)));
      if (row.text) card.appendChild(el('div', 'bxmail', row.text));
      if ((row.links || []).length) {
        const ways = el('div', 'bxways');
        row.links.forEach((link) => ways.appendChild(el('span', 'bxchip', link.label)));
        card.appendChild(ways);
      }
      if ((row.buttons || []).length) {
        const acts = el('div', 'bxways');
        row.buttons.forEach((one) => {
          const b = el('button', 'bxchip bxdo', one.label);
          b.addEventListener('click', () => press(one, b, card));
          acts.appendChild(b);
        });
        card.appendChild(acts);
      }
      block.appendChild(card);
    });
    return block;
  };
  const offerOf = (buttons) => {
    const row = el('div', 'bxoffer');
    (buttons || []).forEach((one) => {
      const b = el('button', 'bxchip bxdo', one.label);
      b.addEventListener('click', () => press(one, b, null));
      row.appendChild(b);
    });
    return row;
  };
  const drawn = (one) => {
    if (one.kind === 'say') return one.html ? botOf(one.html) : sayOf(one.who === 'you' ? 'you' : 'bot', one.text || '');
    if (one.kind === 'study') return studyOf(one);
    if (one.kind === 'found') return foundOf(one);
    if (one.kind === 'offer') return offerOf(one.buttons);
    return null;
  };

  // ---- the night: one real night of the search, round by round, its line
  // beside the duck in the journal's own words
  const night = F.night || {};
  const rounds = (night.log || []).map((r) => {
    const li = el('li');
    li.innerHTML = `<span class=t>${two(r.hour)}:00</span>${r.sources} sources · fetched `
      + `<b>${fmt(r.read)}</b> · new <b>${fmt(r.new)}</b> · kept <b>${fmt(r.kept)}</b>`;
    log.appendChild(li);
    return { hour: r.hour, li, said: `scan finished: fetched ${fmt(r.read)} · new ${fmt(r.new)} · kept ${fmt(r.kept)}` };
  });
  const note = el('li', 'note', 'One real night of the search, round by round.');
  if (rounds.length) log.appendChild(note);

  // ---- THE DAY, scene by scene: where in the scroll, the minutes of the day
  // it spans, and what the chat holds then (the app's own words of that hour).
  // FIVE OF THEM, the few words each (Vin, 14 Oct 2026: the visitor still had
  // too much to read): the night, the morning's report and cards, the forms,
  // a no, the evening.
  const report = F.report || [];
  const today = F.today || { rows: [] };
  const sendLines = [{ kind: 'say', who: 'bot', text: today.head || '' },
    { kind: 'found', rows: today.rows || [] }];
  if (F.round_msg) sendLines.push({ kind: 'say', who: 'bot', html: F.round_msg.html });
  const SCENES = [
    { at: 0.00, to: 0.24, time: [60, 440], night: true },
    { at: 0.24, to: 0.44, time: [450, 452], open: true, lines: report },
    { at: 0.44, to: 0.63, time: [540, 545], open: true, lines: sendLines },
    { at: 0.63, to: 0.81, time: [700, 702], open: true, lines: F.no_chat || [] },
    { at: 0.81, to: 1.01, time: [1200, 1230], open: true,
      lines: F.evening_phone ? [{ kind: 'say', who: 'bot', html: F.evening_phone.html }] : [] },
  ];
  const sceneAt = (p) => SCENES.findIndex((sc) => p >= sc.at && p < sc.to);
  const minutesAt = (p) => {
    const sc = SCENES[Math.max(0, sceneAt(p))];
    const t = Math.min(1, Math.max(0, (p - sc.at) / ((sc.to - sc.at) || 1)));
    return sc.time[0] + (sc.time[1] - sc.time[0]) * t;
  };
  // THE SKY over the whole day: night, dawn, day, dusk, night.
  const SKY = [[0, '#04060f', '#0b1027'], [300, '#070b1f', '#151a3d'], [380, '#1d1f4d', '#6b4a7a'],
    [420, '#3b3f86', '#e08e72'], [460, '#4d69bd', '#efb995'], [560, '#4f7fd6', '#9cc3f0'],
    [860, '#3f78d9', '#a9cdf3'], [1080, '#4a4f9c', '#f09a78'], [1170, '#1e2150', '#5a3a6e'],
    [1260, '#090d24', '#141a3e'], [1440, '#04060f', '#0b1027']];
  const lerp = (a, b, t) => a + (b - a) * t;
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => 'rgb(' + rgb(a).map((v, i) => Math.round(lerp(v, rgb(b)[i], t))).join(',') + ')';
  const skyAt = (m) => {
    for (let i = 1; i < SKY.length; i += 1) {
      if (m <= SKY[i][0]) {
        const a = SKY[i - 1];
        const b = SKY[i];
        const t = (m - a[0]) / (b[0] - a[0]);
        return [mix(a[1], b[1], t), mix(a[2], b[2], t)];
      }
    }
    return [SKY[0][1], SKY[0][2]];
  };

  // ---- the pill's own words, each in its turn (the app's own: box.state)
  let word = 0;
  setInterval(() => {
    if (box.hasAttribute('data-rest') || !words.length) return;
    word = (word + 1) % words.length;
    num.textContent = words[word];
  }, 3400);

  // ---- one frame of the day
  let shownScene = -2;
  let lastRound = -1;
  const show = (i) => {
    const sc = SCENES[i];
    if (!sc || !thread) return;
    thread.textContent = '';
    (sc.lines || []).forEach((one) => {
      const node = drawn(one);
      if (node) thread.appendChild(node);
    });
    thread.scrollTop = 0;
    if ((sc.lines || []).length) turn(700);
  };
  const draw = () => {
    const room = story.offsetHeight - innerHeight;
    const p = Math.min(1, Math.max(0, (scrollY - story.offsetTop) / (room || 1)));
    const i = Math.max(0, sceneAt(p));
    const sc = SCENES[i];
    const minutes = minutesAt(p);
    hh.textContent = two(Math.floor(minutes / 60) % 24);
    mm.textContent = two(Math.floor(minutes % 60));
    document.querySelectorAll('[data-clock]').forEach((c) => {
      c.textContent = `${two(Math.floor(minutes / 60) % 24)}:${two(Math.floor(minutes % 60))}`;
    });
    now.style.left = `${(minutes / 1440) * 100}%`;
    const [top, bottom] = skyAt(minutes);
    root.style.setProperty('--sky-top', top);
    root.style.setProperty('--sky-bottom', bottom);
    const dark = minutes < 380 ? 1 : minutes > 1180 ? Math.min(1, (minutes - 1180) / 80) : 0;
    root.style.setProperty('--stars', String(Math.max(dark, minutes < 420 ? (420 - minutes) / 120 : 0)));
    const up = minutes < 360 || minutes > 1150 ? 0 : Math.min(1, (minutes - 360) / 90, (1150 - minutes) / 90);
    root.style.setProperty('--sunup', String(Math.max(0, up)));
    root.toggleAttribute('data-day', minutes >= 400 && minutes <= 1140);
    caps.forEach((c) => c.classList.toggle('on', +c.dataset.scene === i));

    // BY NIGHT the box rests as the duck, at work: the journal beside it, the
    // night's rounds under it as each hour comes. At the day's end it rests again.
    const atRest = !!(sc.night || sc.rest);
    document.body.dataset.run = sc.night ? 'running' : 'idle';
    box.toggleAttribute('data-rest', atRest);
    box.toggleAttribute('data-line', !!sc.night);
    log.classList.toggle('gone', !sc.night || !rounds.some((r) => minutes >= r.hour * 60));
    let shown = -1;
    rounds.forEach((r, n) => {
      const on = !!sc.night && minutes >= r.hour * 60;
      r.li.classList.toggle('on', on);
      if (on) shown = n;
    });
    note.classList.toggle('on', shown >= 0);
    if (sc.night && line) {
      line.hidden = false;
      line.textContent = shown >= 0 ? rounds[shown].said
        : `search: ${fmt(night.sources)} sources, a round every hour or two`;
      if (shown !== lastRound && shown >= 0) turn(1100);
    }
    lastRound = shown;

    // BY DAY the chat is let down, and holds what the app said at that hour.
    const open = !!sc.open;
    if (drop) drop.hidden = !open;
    if (chat) chat.hidden = !open;
    if (open) box.setAttribute('data-drop', 'chat'); else box.removeAttribute('data-drop');
    if (i !== shownScene) {
      shownScene = i;
      if (open) show(i);
    }
  };
  let queued = false;
  const ask = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; draw(); });
  };
  addEventListener('scroll', ask, { passive: true });
  addEventListener('resize', () => { stars(); ask(); });
  if (words.length) num.textContent = words[0];
  stars();
  draw();
})();
