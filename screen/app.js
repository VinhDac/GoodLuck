// THE APP'S OWN WAYS, re-enacted on its own pages: what live.js does in the app
// (src/jobbot/dashboard/web/live.js), done here by the chapter, on the very
// markup the app drew. Each helper names the part of live.js it stands for, so
// a change there is easy to follow here.
//
// And where the app's windows go on Windows (winview.py, shell.py): the pill
// at the top middle, 12 px down; a screen centred in the space above the
// taskbar, each one after 28 px down and right; the pill at rest a circle in
// the top-left corner, 12 px in.
(function () {
  const BAR = 48;                       // the taskbar's height (screen.css)
  const PILL = { w: 590, h: 48 };       // shell.PILL
  const BOX_H = 640;                    // shell.BOX
  const STEP = 28;                      // shell.STEP
  const SIZES = {                       // shell.SCREENS
    screen: [1100, 720], journal: [900, 560], settings: [820, 760],
  };

  window.makeApp = function (s) {
    const A = {};
    const doc = (id) => s.doc(id);
    const q = (id, sel) => { const d = doc(id); return d ? d.querySelector(sel) : null; };

    // ---- where windows go
    let made = 0;                       // winview: every screen window opened this run
    A.pillAt = (h = BOX_H) => ({ x: (s.W - PILL.w) / 2, y: 12, w: PILL.w, h });
    // shell.place: centred in the work area, then 28 px on per window opened.
    A.placeOf = (kind = 'screen') => {
      const [w, h] = SIZES[kind] || SIZES.screen;
      const H = s.H - BAR;
      const x = Math.max(0, Math.floor((s.W - w) / 2));
      const y = Math.max(0, Math.floor((H - h) / 2));
      const room = Math.floor(Math.min(x, y) / STEP);
      const shift = STEP * (made % (room + 1));
      made += 1;
      return { x: x + shift, y: y + shift, w, h };
    };
    A.resetPlaces = () => { made = 0; A.now = { run: 'paused', mins: 0, last: '' }; };
    // A SCREEN OF THE APP'S in a window of its own: its page draws its frame,
    // and says the station's state as every page does.
    A.screen = async (id, page, kind = 'screen') => {
      const w = await s.open(id, { kind: 'app', page, ...A.placeOf(kind) });
      A.state(id);
      return w;
    };

    // ANOTHER PAGE OF THE APP'S in the same window (a link, a form's answer),
    // saying the station's state as every page does.
    A.go = async (id, html) => { await s.page(id, html); A.state(id); };

    // ---- the station's state on every page (live.js, setState and label):
    // the duck's colour and beat, the words on the status bar, its newest line
    A.now = { run: 'paused', mins: 0, last: '' };
    const label = (state, mins) => (state === 'running' ? 'session running'
      : state === 'paused' ? 'watch station: OFF'
        : mins > 0 ? 'on watch · next round in ' + mins + ' min' : 'on watch');
    A.state = (id) => {
      const d = doc(id);
      if (!d) return;
      d.body.dataset.run = A.now.run;
      d.querySelectorAll('[data-state]').forEach((el) => { el.textContent = label(A.now.run, A.now.mins); });
      if (A.now.last) d.querySelectorAll('[data-lastmsg]').forEach((el) => { el.textContent = A.now.last; });
    };
    A.station = (run, mins, last) => {
      A.now = { run, mins: mins || 0, last: last === undefined ? A.now.last : last };
      s.wins().forEach((id) => A.state(id));
    };

    // ---- the pill
    // THE APP OPENS AS IT DOES (views/box.render): the pill at the top middle,
    // what it lets down under it (live.js, show), the station's state on the
    // page (body[data-run]: the duck's colour, its beat, the ring).
    A.openPill = async (page, o = {}) => {
      s.taskApp('goodluck', s.appIcon(24));
      const w = await s.open('pill', { kind: 'bare', page, ...A.pillAt(o.drop ? BOX_H : PILL.h) });
      if (o.run) A.now.run = o.run;
      A.state('pill');
      if (o.drop) A.drop('pill', o.drop);
      A.placeholder('pill');
      return w;
    };
    // live.js, show(): one thing let down under the pill (data-drop says
    // which), the window as tall as it; none, the pill alone.
    A.drop = (id, what) => {
      const box = q(id, '[data-box]');
      const under = q(id, '[data-box-drop]');
      if (!box || !under) return;
      if (!what) {
        box.removeAttribute('data-drop');
        under.hidden = true;
        s.size(id, { h: PILL.h });
        return;
      }
      box.setAttribute('data-drop', what);
      under.hidden = false;
      const parts = { list: '[data-box-list]', chat: '[data-box-chat]', ask: '[data-box-ask]' };
      Object.keys(parts).forEach((k) => { const n = q(id, parts[k]); if (n) n.hidden = k !== what; });
      s.size(id, { h: what === 'chat' ? BOX_H : PILL.h + 1 + (under.scrollHeight || 180) });
    };

    // live.js, refreshBox: the parts of the box that go out of date, taken
    // from a later page of the app's. A pill drawn while the setup was not
    // finished has no button: then the app loads the page again.
    A.swap = async (id, html) => {
      const box = q(id, '[data-box]');
      if (!box) return;
      const got = new DOMParser().parseFromString(html, 'text/html');
      const had = !!box.querySelector('[data-box-go]');
      const has = !!got.querySelector('[data-box-go]');
      if (!had && has) {
        const drop = box.getAttribute('data-drop');
        await s.page(id, html);
        A.state(id);
        if (drop) A.drop(id, drop);
        A.placeholder(id);
        return;
      }
      ['[data-box-pill]', '[data-box-said]', '[data-box-offer]', '[data-box-setup]',
        '[data-box-model]', '[data-box-choices]', '[data-box-help]'].forEach((mark) => {
        const from = got.querySelector(mark);
        const to = box.querySelector(mark);
        if (!from || !to) return;
        to.innerHTML = from.innerHTML;
        to.hidden = from.hidden;
        Array.from(from.attributes).forEach((at) => {
          if (at.name.startsWith('data-')) to.setAttribute(at.name, at.value);
        });
      });
      const acts = got.querySelector('[data-box-acts]');
      const actsTo = box.querySelector('[data-box-acts]');
      if (acts && actsTo) actsTo.innerHTML = acts.innerHTML;
      // The action's button says the session's word of the moment (live.js,
      // paint: Start session, Run a round now, Running…).
      const go = got.querySelector('[data-box-go]');
      const goTo = box.querySelector('[data-box-go]');
      if (go && goTo) goTo.textContent = go.textContent;
      A.placeholder(id);
    };
    // WHAT IS TYPED IS THE ASSISTANT'S once it is connected (live.js: the
    // field's placeholder is the box's data-ask, else data-find).
    A.placeholder = (id) => {
      const box = q(id, '[data-box]');
      const find = q(id, '[data-box-find]');
      const model = q(id, '[data-box-model]');
      if (!box || !find) return;
      const on = box.dataset.assistant || (model && model.dataset.connected);
      find.placeholder = on ? box.dataset.ask : box.dataset.find;
    };
    // THE PILL'S WORDS TAKE TURNS (live.js, every 3.6 s): one of data-lines.
    A.word = (id, n) => {
      const pill = q(id, '[data-box-pill]');
      if (!pill) return;
      let all = [];
      try { all = JSON.parse(pill.dataset.lines || '[]'); } catch (e) { all = []; }
      if (all.length) pill.textContent = all[n % all.length];
    };

    // ---- the pill at rest (live.js, resting; winview rest and stand;
    // shell.REST, REST_LINE, TOP): while the bot is at work and nobody uses
    // the pill, it glides to the top-left corner, 12 px in, a circle the
    // pill's height; 380 wide with the journal's newest line beside the duck
    // while a round runs; above every window. Pressed, it glides back where
    // the pill stood.
    A.rest = async (id, line) => {
      const box = q(id, '[data-box]');
      if (!box) return;
      box.removeAttribute('data-drop');
      const under = q(id, '[data-box-drop]');
      if (under) under.hidden = true;
      box.dataset.rest = '1';
      const el = q(id, '[data-box-line]');
      if (line) { el.textContent = line; box.dataset.line = '1'; } else delete box.dataset.line;
      s.top(id, true);
      await s.glide(id, { x: 12, y: 12, w: line ? 380 : PILL.h, h: PILL.h });
    };
    // THE JOURNAL'S NEWEST LINE beside the duck at rest (data-lastmsg), the
    // circle widened for it the first time; none, the circle alone.
    A.line = async (id, text) => {
      const box = q(id, '[data-box]');
      if (!box) return;
      const el = q(id, '[data-box-line]');
      if (text) el.textContent = text;
      if (!box.dataset.rest) return;
      if (text && !box.dataset.line) { box.dataset.line = '1'; await s.glide(id, { w: 380 }); }
      if (!text && box.dataset.line) { delete box.dataset.line; await s.glide(id, { w: PILL.h }); }
    };
    A.stand = async (id, h = PILL.h) => {
      const box = q(id, '[data-box]');
      if (!box) return;
      delete box.dataset.rest;
      delete box.dataset.line;
      // Pressed, what it held beside the duck is gone (live.js, wake).
      const note = q(id, '[data-box-note]');
      if (note) note.hidden = true;
      const line = q(id, '[data-box-line]');
      if (line) line.hidden = false;
      s.top(id, false);
      await s.glide(id, A.pillAt(h));
    };

    // ---- the journal's window (views/box.journal; live.js, addLine and
    // drawProgress): the lines, the newest at the top, each its time, its
    // stream, its words; what runs, beside them.
    A.journal = (id, lines) => {
      const d = doc(id);
      const box = d && d.querySelector('[data-journal]');
      if (!box) return;
      lines.forEach((ev) => {
        const row = d.createElement('div');
        row.className = 'jline ' + (ev.level || 'info');
        row.innerHTML = '<span class=jtime></span><span class=jstream></span><span class=jtext></span>';
        row.querySelector('.jtime').textContent = ev.time;
        row.querySelector('.jstream').textContent = ev.stream;
        row.querySelector('.jtext').textContent = ev.text;
        box.insertBefore(row, box.firstChild);
      });
    };
    // What runs: none ("nothing is running"), or {stream: {what, done, total}}.
    A.progress = (id, all) => {
      const d = doc(id);
      const box = d && d.querySelector('[data-progress]');
      if (!box) return;
      const rows = Object.entries(all || {});
      if (!rows.length) { box.innerHTML = '<div class=pidle>nothing is running</div>'; return; }
      box.innerHTML = rows.map(([, p]) => '<div class="prow' + (p.total ? '' : ' spin') + '">'
        + '<div class=phead><b></b><span></span></div>'
        + '<div class=ptrack><i style="width:' + (p.total ? Math.round(p.done * 100 / p.total) : 100)
        + '%"></i></div></div>').join('');
      box.querySelectorAll('.prow').forEach((el, i) => {
        const [stream, p] = rows[i];
        // The app joins them with a long dash; the site says it with a colon.
        el.querySelector('b').textContent = stream + ': ' + p.what;
        el.querySelector('span').textContent = p.total ? p.done + '/' + p.total : '';
      });
    };

    // ---- the thread
    const thread = (id) => q(id, '[data-box-thread]');
    const down = (id) => { const t = thread(id); if (t) t.scrollTop = t.scrollHeight; };
    // live.js, say(): a line, the person's ('you') or the app's ('bot').
    A.say = (id, who, text) => {
      const t = thread(id);
      const line = doc(id).createElement('div');
      line.className = 'bxmsg ' + who;
      line.textContent = text;
      t.appendChild(line);
      down(id);
      return line;
    };
    // live.js, workLine(): the dots, what is being done, the seconds so far.
    A.work = (id, doing) => {
      const d = doc(id);
      const line = d.createElement('div');
      line.className = 'bxmsg bot wait';
      line.innerHTML = '<span class="bxdots"><i></i><i></i><i></i></span>';
      const what = d.createElement('span');
      what.textContent = doing;
      const secs = d.createElement('span');
      line.appendChild(what);
      line.appendChild(secs);
      thread(id).appendChild(line);
      down(id);
      const began = Date.now();
      const tick = setInterval(() => { secs.textContent = ' · ' + Math.round((Date.now() - began) / 1000) + 's'; }, 1000);
      return { doing: (w) => { what.textContent = w; }, end: () => { clearInterval(tick); line.remove(); } };
    };
    // live.js, typed(): what the app says, typed out quickly.
    A.typed = async (id, words) => {
      const line = A.say(id, 'bot', '');
      if (s.fast) { line.textContent = words; down(id); return line; }
      for (let at = 0; at < words.length; at += 3) {
        line.textContent = words.slice(0, at + 3);
        down(id);
        await s.wait(12);
      }
      line.textContent = words;
      return line;
    };
    // live.js, botWords() and drawn(): a message of the bot's, its own few
    // tags kept, and its buttons under it (they are pressed here too).
    A.bot = (id, html, keys) => {
      const d = doc(id);
      const line = d.createElement('div');
      line.className = 'bxmsg bot';
      const held = d.createElement('template');
      held.innerHTML = html;
      const clean = (node) => {
        Array.from(node.childNodes).forEach((child) => {
          if (child.nodeType !== 1) return;
          clean(child);
          const tag = child.tagName.toLowerCase();
          if (['b', 'strong', 'i', 'em', 'u', 's', 'code', 'pre', 'a'].indexOf(tag) < 0) {
            child.replaceWith(d.createTextNode(child.textContent));
            return;
          }
          Array.from(child.attributes).forEach((at) => { if (at.name !== 'href') child.removeAttribute(at.name); });
        });
      };
      clean(held.content);
      line.appendChild(held.content);
      thread(id).appendChild(line);
      if ((keys || []).length) {
        const row = d.createElement('div');
        row.className = 'bxkeys';
        keys.forEach((key) => {
          const chip = d.createElement('button');
          chip.className = 'bxchip bxpress';
          chip.textContent = key[0];
          chip.dataset.press = key[1] || key[0];
          row.appendChild(chip);
        });
        thread(id).appendChild(row);
      }
      down(id);
      return line;
    };
    // live.js, studyOf(): an answer laid out: its verdict, why, the chart,
    // what to do. `j`: {verdict: {ok, text}, why: [], chart: '', plan: []}.
    A.study = (id, j) => {
      const d = doc(id);
      const box = q(id, '[data-box]');
      const block = d.createElement('div');
      block.className = 'bxstudy';
      if (j.verdict && j.verdict.text) {
        const line = d.createElement('div');
        line.className = 'bxverdict ' + (j.verdict.ok ? 'ok' : 'bad');
        line.textContent = j.verdict.text;
        block.appendChild(line);
      }
      const list = (title, lines, kind) => {
        if (!(lines || []).length) return;
        const head = d.createElement('h4');
        head.textContent = title;
        const items = d.createElement(kind);
        lines.forEach((one) => { const li = d.createElement('li'); li.textContent = one; items.appendChild(li); });
        block.appendChild(head);
        block.appendChild(items);
      };
      list(box.dataset.why, j.why, 'ul');
      if (j.chart) { const drawn = d.createElement('div'); drawn.innerHTML = j.chart; block.appendChild(drawn); }
      list(box.dataset.plan, j.plan, 'ol');
      thread(id).appendChild(block);
      down(id);
      return block;
    };
    // live.js, chipOf(): a button under something said.
    const chipOf = (d, one) => {
      const b = d.createElement('button');
      b.className = 'bxchip bxdo';
      b.textContent = one.label;
      b.dataset.kind = one.kind || 'post';
      if (one.id) b.dataset.id = one.id;
      return b;
    };
    // live.js, foundOf(): the rows fetched, each a card with its ways on and
    // its own buttons. `j`: {rows: [{head, sub, lines, text, links, buttons}]}.
    A.found = (id, j) => {
      const d = doc(id);
      const block = d.createElement('div');
      block.className = 'bxfound';
      (j.rows || []).forEach((row) => {
        const card = d.createElement('div');
        card.className = 'bxcard';
        const part = (kind, words) => {
          if (!words) return;
          const el = d.createElement('div');
          el.className = kind;
          el.textContent = words;
          card.appendChild(el);
        };
        part('bxhead', row.head);
        part('bxsub', row.sub);
        (row.lines || []).forEach((line) => part('bxfact', line));
        part('bxmail', row.text);
        if ((row.links || []).length) {
          const ways = d.createElement('div');
          ways.className = 'bxways';
          row.links.forEach((link) => {
            const a = d.createElement('a');
            a.className = 'bxchip';
            a.textContent = link.label;
            ways.appendChild(a);
          });
          card.appendChild(ways);
        }
        if ((row.buttons || []).length) {
          const acts = d.createElement('div');
          acts.className = 'bxways';
          row.buttons.forEach((made) => acts.appendChild(chipOf(d, made)));
          card.appendChild(acts);
        }
        block.appendChild(card);
      });
      thread(id).appendChild(block);
      down(id);
      return block;
    };
    // live.js, offerRow(): the buttons under an answer.
    A.offer = (id, buttons) => {
      const d = doc(id);
      const row = d.createElement('div');
      row.className = 'bxoffer';
      (buttons || []).forEach((one) => row.appendChild(chipOf(d, one)));
      thread(id).appendChild(row);
      down(id);
      return row;
    };
    // live.js, drawn(): a line of the chat as the app keeps it
    // (dashboard/chatlog.lines): said, laid out, fetched, offered.
    A.drawn = async (id, one, typing) => {
      if (one.kind === 'say') {
        if (one.html) return A.bot(id, one.html, one.keys);
        if (one.who === 'bot' && typing) return A.typed(id, one.text || '');
        return A.say(id, one.who === 'you' ? 'you' : 'bot', one.text || '');
      }
      if (one.kind === 'study') return A.study(id, one);
      if (one.kind === 'found') return A.found(id, one);
      if (one.kind === 'offer') return A.offer(id, one.buttons);
      return null;
    };
    // WHAT THE BOT SAID UNASKED, beside the duck at rest until the box is
    // pressed (live.js: data-box-note), the circle widened for it.
    A.told = async (id, text) => {
      const box = q(id, '[data-box]');
      const note = q(id, '[data-box-note]');
      if (!box || !note) return;
      note.textContent = text || '';
      note.hidden = !text;
      const line = q(id, '[data-box-line]');
      if (line) line.hidden = !!text;
      if (box.dataset.rest) {
        if (text) box.dataset.line = '1'; else delete box.dataset.line;
        await s.glide(id, { w: text ? 380 : PILL.h });
      }
    };
    // live.js, ask(): what a button would do, asked before it is done, with
    // the button's own name and «Not now» (data-not-now). -> the yes.
    A.ask = (id, question, name) => {
      const d = doc(id);
      const box = q(id, '[data-box]');
      const part = q(id, '[data-box-ask]');
      if (!part) return null;
      part.textContent = '';
      const asked = d.createElement('div');
      asked.className = 'bxasked';
      asked.textContent = question;
      const answers = d.createElement('div');
      answers.className = 'bxask';
      [name, box.dataset.notNow || 'Not now'].forEach((words) => {
        const b = d.createElement('button');
        b.className = 'bxchip';
        b.textContent = words;
        answers.appendChild(b);
      });
      part.appendChild(asked);
      part.appendChild(answers);
      A.drop(id, 'ask');
      return answers.firstChild;
    };
    // A BUTTON PRESSED UNDER A CARD (live.js, press): it and its fellows are
    // done with, the one pressed marked.
    A.pressed = (button) => {
      const card = button.closest('.bxcard, .bxkeys, .bxoffer');
      if (card) card.querySelectorAll('.bxdo, .bxpress').forEach((b) => { b.disabled = true; });
      button.classList.add('on');
    };
    // THE DUCK TURNS while the app works on what was asked (live.js, turning).
    A.turn = (id, on) => { const duck = q(id, '.bxduck'); if (duck) duck.classList.toggle('turn', !!on); };

    // ---- forms on the app's pages
    // live.js, the [data-post] form: ' · checking…', then the answer.
    A.note = (form, text, warn) => {
      const note = form && form.querySelector('.formnote');
      if (!note) return;
      note.innerHTML = text ? ' · ' + text : '';
      note.classList.toggle('warn', !!warn);
    };
    // A TAG FIELD (live.js, the suggestion search): letters typed narrow the
    // chips to the titles holding them; one pressed is added to the chosen.
    A.narrow = (field, typed) => {
      const words = (typed || '').toLowerCase().split(/\s+/).filter(Boolean);
      field.classList.toggle('tim', !!words.length);
      let shown = 0;
      field.querySelectorAll('[data-addtag]').forEach((chip) => {
        const title = chip.dataset.addtag.toLowerCase().split(/[^a-z0-9+#]+/);
        const fits = words.every((w) => title.some((t) => t.startsWith(w)));
        const show = fits && shown < (words.length ? 10 : 8);
        chip.hidden = !show;
        if (show) shown += 1;
      });
    };
    A.addTag = (field, name, value) => {
      const box = field.querySelector('[data-tags]');
      const d = field.ownerDocument;
      const tag = d.createElement('span');
      tag.className = 'tag';
      tag.textContent = value;
      const kept = d.createElement('input');
      kept.type = 'hidden';
      kept.name = name;
      kept.value = value;
      const x = d.createElement('button');
      x.type = 'button';
      x.className = 'untag';
      x.textContent = '×';
      tag.appendChild(kept);
      tag.appendChild(x);
      box.insertBefore(tag, box.querySelector('.tagempty'));
      const chip = field.querySelector(`[data-addtag="${CSS.escape(value)}"]`);
      if (chip) chip.remove();
      return tag;
    };
    return A;
  };
})();
