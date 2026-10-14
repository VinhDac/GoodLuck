// THE SCREEN (Vin, 14 Oct 2026: "phải show cả màn hình máy tính bình thường lúc
// chạy app"): a Windows desktop, 1440 x 900, on which a chapter moves a pointer,
// opens windows and presses what a person presses. The app's own windows are
// frames holding the app's own pages (data/fresh.js, scripts/make_site_next.py).
//
// Everything a chapter does goes through here, so that a jump (back, a chapter
// chosen) can run the steps before it at once (`fast`), and a step left behind
// stops at its next wait (`gen`).
(function () {
  const W = 1440;
  const H = 900;
  const STOP = 'stopped: the tour moved on';

  const el = (tag, cls, html) => {
    const made = document.createElement(tag);
    if (cls) made.className = cls;
    if (html !== undefined) made.innerHTML = html;
    return made;
  };

  // THE FEW ICONS the taskbar and the tray carry, drawn as lines.
  const ICON = {
    start: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="8.4" height="8.4" rx="1.2" fill="#62b6ff"/>'
      + '<rect x="12.6" y="3" width="8.4" height="8.4" rx="1.2" fill="#4aa0f6"/>'
      + '<rect x="3" y="12.6" width="8.4" height="8.4" rx="1.2" fill="#4aa0f6"/>'
      + '<rect x="12.6" y="12.6" width="8.4" height="8.4" rx="1.2" fill="#3388ea"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">'
      + '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/></svg>',
    files: '<svg viewBox="0 0 24 24"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="#f4c54a"/>'
      + '<path d="M3 9h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="#ffd970"/></svg>',
    browser: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#2f9cf4"/>'
      + '<path d="M3.5 12h17M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18" stroke="#d8efff" stroke-width="1.4" fill="none"/></svg>',
    chevron: '<svg viewBox="0 0 16 16" fill="none" stroke="#fff" stroke-width="1.6"><path d="M4 10l4-4 4 4"/></svg>',
    wifi: '<svg viewBox="0 0 16 16" fill="none" stroke="#fff" stroke-width="1.4"><path d="M2 6a9 9 0 0 1 12 0M4.2 8.4a6 6 0 0 1 7.6 0M6.4 10.8a3 3 0 0 1 3.2 0"/><circle cx="8" cy="13" r=".9" fill="#fff"/></svg>',
    sound: '<svg viewBox="0 0 16 16" fill="none" stroke="#fff" stroke-width="1.4"><path d="M2.5 6h2.5l3-2.5v9L5 10H2.5z"/><path d="M11 5.5a3.5 3.5 0 0 1 0 5"/></svg>',
    pointer: '<svg viewBox="0 0 20 24"><path d="M2 1.5v18.2l4.6-4.4 3 6.6 3-1.4-3-6.4h6.3z" fill="#fff" stroke="#111" stroke-width="1.3" stroke-linejoin="round"/></svg>',
  };

  window.makeScreen = function (host, data) {
    const s = { W, H, fast: false, gen: 0, gate: null, onfocus: null };
    const root = el('div', 'scr');
    host.appendChild(root);
    const duckSvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${data.duckSide} ${data.duckSide}'>`
      + `<path fill-rule='evenodd' d='${data.duck}'/></svg>`;
    root.style.setProperty('--duck', `url("data:image/svg+xml,${encodeURIComponent(duckSvg)}")`);
    root.style.setProperty('--blue', data.blue);

    // ---- waiting, and being moved on from
    const alive = (gen) => { if (gen !== s.gen) throw new Error(STOP); };
    s.STOP = STOP;
    s.wait = (ms) => {
      const gen = s.gen;
      if (s.fast) return Promise.resolve().then(() => alive(gen));
      return new Promise((done) => setTimeout(done, ms)).then(() => alive(gen));
    };

    // ---- the desktop, its icons, the taskbar and its tray
    let wall, icons, layer, bar, apps, tray, duck, clock, cursor, top;
    const desktop = () => {
      root.innerHTML = '';
      wall = el('div', 'scr-wall', '<i></i>');
      icons = el('div', 'scr-icons');
      icons.appendChild(el('div', 'scr-icon', '<div class="scr-bin"></div>Recycle Bin'));
      layer = el('div', 'scr-layer');
      top = el('div', 'scr-top');
      bar = el('div', 'scr-bar');
      apps = el('div', 'scr-apps');
      apps.append(el('div', 'scr-tb', ICON.start),
        el('div', 'scr-search', ICON.search.replace('<svg', '<svg width="15" height="15"') + 'Search'),
        el('div', 'scr-tb', ICON.files), el('div', 'scr-tb on', ICON.browser));
      apps.children[3].dataset.app = 'browser';
      tray = el('div', 'scr-tray');
      duck = el('div', 'scr-t scr-tduck');
      duck.hidden = true;
      clock = el('div', 'scr-t scr-clock', `<span>08:57</span><span>${(data.days || [])[0] || '14/10/2026'}</span>`);
      tray.append(el('div', 'scr-t', ICON.chevron), duck, el('div', 'scr-t', ICON.wifi),
        el('div', 'scr-t', ICON.sound), clock);
      bar.append(apps, tray);
      cursor = el('div', 'scr-cursor', ICON.pointer + '<span class="ring"></span>');
      root.append(wall, icons, layer, bar, top, cursor);
      place(cursor, cx, cy);
    };
    s.clock = (time, day) => {
      clock.children[0].textContent = time;
      if (day) clock.children[1].textContent = day;
    };
    // TIME PASSES: the screen dims, the clock moves on, the screen comes back.
    s.pass = async (time, day) => {
      if (s.fast) { s.clock(time, day); return; }
      const veil = el('div', 'scr-veil');
      root.appendChild(veil);
      void veil.offsetWidth;
      veil.classList.add('on');
      await s.wait(450);
      s.clock(time, day);
      await s.wait(350);
      veil.classList.remove('on');
      await s.wait(450);
      veil.remove();
    };

    // ---- where a thing is, in the screen's own pixels: a thing of the page,
    // a thing inside one of the app's frames, or a box given as it is
    const frames = new Map();             // a frame's document -> its window
    s.rect = (target) => {
      if (!target) return null;
      if (typeof target === 'string') target = s.find(target);
      if (!target) return null;
      if (target.x !== undefined && target.w !== undefined) return target;
      const k = root.getBoundingClientRect().width / W;
      const base = root.getBoundingClientRect();
      const doc = target.ownerDocument;
      const r = target.getBoundingClientRect();
      if (doc !== document) {
        const frame = frames.get(doc);
        const f = frame.getBoundingClientRect();
        return { x: (f.left - base.left) / k + r.left, y: (f.top - base.top) / k + r.top,
          w: r.width, h: r.height };
      }
      return { x: (r.left - base.left) / k, y: (r.top - base.top) / k, w: r.width / k, h: r.height / k };
    };
    // A THING BY NAME: "win:selector" looks inside that window, its frame
    // included; a bare selector looks on the screen.
    s.find = (name) => {
      const at = name.indexOf(':');
      if (at > 0 && wins[name.slice(0, at)]) {
        const w = wins[name.slice(0, at)];
        const sel = name.slice(at + 1);
        return (w.frame && w.frame.contentDocument.querySelector(sel)) || w.node.querySelector(sel);
      }
      return root.querySelector(name);
    };

    // ---- the pointer: it goes, it presses, it types
    let cx = 900;
    let cy = 640;
    const place = (node, x, y) => { node.style.transform = `translate(${x}px,${y}px)`; };
    s.move = async (target, ms = 700) => {
      const r = s.rect(target);
      if (!r) return null;
      const x = r.x + r.w / 2;
      const y = r.y + r.h / 2;
      cursor.style.transition = s.fast ? 'none' : `transform ${ms}ms cubic-bezier(.32,.72,.2,1)`;
      place(cursor, x, y);
      cx = x;
      cy = y;
      await s.wait(ms + 40);
      return r;
    };
    const press = () => {
      cursor.classList.remove('press');
      void cursor.offsetWidth;
      cursor.classList.add('press');
    };
    // A PRESS: the pointer goes to it, and then the visitor presses it, or the
    // tour does (s.gate, the runner's: it says which, and waits for the visitor).
    s.click = async (target, opts = {}) => {
      const r = await s.move(target, opts.ms);
      if (s.gate && !s.fast) await s.gate(r);
      alive(s.gen);
      press();
      await s.wait(opts.after === undefined ? 260 : opts.after);
      return r;
    };
    s.type = async (target, text, opts = {}) => {
      const node = typeof target === 'string' ? s.find(target) : target;
      if (!opts.noclick) await s.click(node, { after: 120 });
      const per = opts.per || 55;
      for (let i = 1; i <= text.length; i += 1) {
        node.value = text.slice(0, i);
        if (!s.fast) await s.wait(per);
      }
      node.value = text;
      await s.wait(160);
    };
    s.hover = (target, ms) => s.move(target, ms);

    // ---- windows
    const wins = {};
    s.win = (id) => wins[id];
    s.wins = () => Object.keys(wins);
    let topZ = 20;
    // A WINDOW at {x, y, w, h}: "plain" (a title bar and its three buttons),
    // "bare" (no frame: the app's pill), "app" (a screen of the app's: its
    // page draws its own title bar, as the app's windows do on Windows), with
    // a node of the site's own or a frame holding a page (`page`, its HTML
    // whole). A window opened comes to the front, under what stays on top.
    s.open = async (id, o) => {
      if (wins[id]) s.close(id, true);
      const kind = o.kind === 'bare' || o.kind === 'app' ? o.kind : 'plain';
      const node = el('div', 'scr-win ' + kind + (o.dark ? ' dark' : '') + (s.fast ? '' : ' enter'));
      topZ += 1;
      Object.assign(node.style, { left: o.x + 'px', top: o.y + 'px', width: o.w + 'px', height: o.h + 'px',
        zIndex: o.z || topZ });
      const w = { id, node, frame: null, z: o.z };
      if (kind === 'plain') {
        const title = el('div', 'scr-title', `<span class="icon">${o.icon || ''}${o.title || ''}</span>`
          + '<span class="scr-caps"><i>&#8212;</i><i>&#9633;</i><i>&#10005;</i></span>');
        if (o.titleClass) title.classList.add(o.titleClass);
        node.appendChild(title);
      }
      const body = el('div', 'scr-body');
      node.appendChild(body);
      w.body = body;
      if (o.page !== undefined) {
        const frame = el('iframe');
        frame.setAttribute('title', o.title || id);
        frame.setAttribute('tabindex', '-1');
        body.appendChild(frame);
        w.frame = frame;
        w.clear = kind === 'bare';
        layer.appendChild(node);
        await load(w, o.page);
      } else {
        if (o.node) body.appendChild(o.node);
        layer.appendChild(node);
      }
      wins[id] = w;
      if (!s.fast) {
        void node.offsetWidth;
        node.classList.remove('enter');
        await s.wait(240);
      }
      return w;
    };
    // A PAGE INTO A WINDOW'S FRAME, and the frame known as that window's.
    // The pill's page lets the desktop show round it; a screen's has its own
    // background, as the app's windows do.
    const load = async (w, html) => {
      const frame = w.frame;
      const old = frame.contentDocument;
      if (old) frames.delete(old);
      const loaded = new Promise((done) => { frame.onload = done; });
      frame.srcdoc = html;
      await loaded;
      frames.set(frame.contentDocument, frame);
      if (w.clear) {
        frame.contentDocument.documentElement.style.background = 'transparent';
        frame.contentDocument.body.style.background = 'transparent';
      }
    };
    // ANOTHER PAGE IN THE SAME WINDOW: a link followed, a form's answer.
    s.page = async (id, html) => {
      const w = wins[id];
      if (!w || !w.frame) return null;
      await load(w, html);
      alive(s.gen);
      return w;
    };
    // TO THE FRONT, as a window pressed comes (what stays on top stays so).
    s.front = (id) => {
      const w = wins[id];
      if (!w || w.z) return;
      topZ += 1;
      w.node.style.zIndex = topZ;
    };
    // A PAGE SCROLLED, smoothly, to a thing in it (a selector, at `gap` from
    // the top) or to a height: a window's page, or the pill's thread.
    // What scrolls a thing into view: its nearest ancestor that scrolls (the
    // app's pages scroll in their <main>, not as a whole).
    const scroller = (node) => {
      for (let n = node.parentElement; n; n = n.parentElement) {
        const st = getComputedStyle(n);
        if (/(auto|scroll)/.test(st.overflowY) && n.scrollHeight > n.clientHeight + 1) return n;
      }
      return node.ownerDocument.scrollingElement;
    };
    s.scroll = async (target, to, ms = 700, gap = 70) => {
      let box = null;
      let it = null;
      const w = typeof target === 'string' ? wins[target] : null;
      const doc = w && w.frame ? w.frame.contentDocument : null;
      if (to && typeof to !== 'number') {
        it = typeof to === 'string' ? (doc ? doc.querySelector(to) : s.find(to)) : to;
        if (!it) return;
        box = scroller(it);
      } else if (doc) {
        const main = doc.querySelector('main');
        box = main && main.scrollHeight > main.clientHeight + 1 ? main : doc.scrollingElement;
      } else {
        box = typeof target === 'string' ? s.find(target) : target;
      }
      if (!box) return;
      const own = box.ownerDocument;
      let end = to;
      if (it) {
        const top = it.getBoundingClientRect().top;
        const base = box === own.scrollingElement ? 0 : box.getBoundingClientRect().top;
        end = box.scrollTop + top - base - gap;
      }
      end = Math.max(0, Math.min(end, box.scrollHeight - box.clientHeight));
      if (s.fast || ms <= 0) { box.scrollTop = end; return; }
      const from = box.scrollTop;
      const began = performance.now();
      await new Promise((done) => {
        const step = (now) => {
          const t = Math.min(1, (now - began) / ms);
          const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          box.scrollTop = from + (end - from) * ease;
          if (t < 1) requestAnimationFrame(step); else done();
        };
        requestAnimationFrame(step);
      });
      alive(s.gen);
    };
    // A WINDOW GLIDES where it goes, its place and size together
    // (winframe.glide: 0.26 s, easing out).
    s.glide = async (id, box, ms = 260) => {
      const w = wins[id];
      if (!w) return;
      const st = w.node.style;
      if (!s.fast) {
        const ease = `${ms}ms cubic-bezier(.33,1,.68,1)`;
        st.transition = `left ${ease},top ${ease},width ${ease},height ${ease}`;
        void w.node.offsetWidth;
      }
      s.size(id, box);
      if (!s.fast) { await s.wait(ms + 40); st.transition = ''; }
    };
    // ABOVE EVERY OTHER WINDOW, or a window like any other again.
    s.top = (id, on) => {
      const w = wins[id];
      if (!w) return;
      if (on) { w.z = 80; w.node.style.zIndex = 80; return; }
      w.z = undefined;
      topZ += 1;
      w.node.style.zIndex = topZ;
    };
    // A BOX TICKED, A CHOICE CHOSEN: the pointer goes, presses, and it is so.
    s.tick = async (target, on = true) => {
      const node = typeof target === 'string' ? s.find(target) : target;
      if (!node) return;
      await s.click(node, { after: 120 });
      node.checked = on;
    };
    s.close = (id, now) => {
      const w = wins[id];
      if (!w) return;
      delete wins[id];
      if (now || s.fast) { w.node.remove(); return; }
      w.node.classList.add('gone');
      setTimeout(() => w.node.remove(), 260);
    };
    s.hide = (id, gone) => { if (wins[id]) wins[id].node.classList.toggle('gone', gone); };
    s.size = (id, box) => {
      const w = wins[id];
      if (!w) return;
      ['x', 'y', 'w', 'h'].forEach((k) => {
        if (box[k] !== undefined) w.node.style[{ x: 'left', y: 'top', w: 'width', h: 'height' }[k]] = box[k] + 'px';
      });
    };
    s.doc = (id) => wins[id] && wins[id].frame && wins[id].frame.contentDocument;

    // ---- the taskbar's apps, the desktop's icons
    s.taskApp = (id, html, on) => {
      let b = apps.querySelector(`[data-app="${id}"]`);
      if (!b) {
        b = el('div', 'scr-tb' + (s.fast ? '' : ' new'), html);
        b.dataset.app = id;
        apps.appendChild(b);
      }
      b.classList.toggle('on', on !== false);
      return b;
    };
    s.icon = (id, label, html) => {
      const made = el('div', 'scr-icon' + (s.fast ? '' : ' new'), `${html}${label}`);
      made.dataset.icon = id;
      icons.appendChild(made);
      if (!s.fast) requestAnimationFrame(() => requestAnimationFrame(() => made.classList.remove('new')));
      return made;
    };
    s.appIcon = (size) => `<div class="scr-appicon"${size ? ` style="width:${size}px;height:${size}px"` : ''}></div>`;

    // ---- the duck by the clock: shown, dimmed, its dot, its tip, its menu
    s.tray = {
      show: (on) => {
        duck.hidden = !on;
        if (on && !duck.firstChild) {
          duck.appendChild(el('div', 'scr-duck' + (s.fast ? '' : ' new')));
        }
      },
      node: () => duck,
      dot: (on) => {
        const d = duck.querySelector('.scr-duck');
        if (!d) return;
        const dot = d.querySelector('.dot');
        if (on && !dot) d.appendChild(el('i', 'dot'));
        if (!on && dot) dot.remove();
      },
      hover: (on) => duck.classList.toggle('hover', on),
      // WHILE A ROUND RUNS the duck dims and comes back, a second each
      // (winapp: 35% and whole).
      blink: (on) => {
        clearInterval(blinking);
        const d = duck.querySelector('.scr-duck');
        if (d) d.classList.remove('dim');
        if (on && !s.fast) blinking = setInterval(() => {
          const now = duck.querySelector('.scr-duck');
          if (now) now.classList.toggle('dim');
        }, 1000);
      },
    };
    let blinking = null;
    let tip = null;
    s.tip = (target, text) => {
      if (tip) { tip.remove(); tip = null; }
      if (!text) return;
      const r = s.rect(target);
      tip = el('div', 'scr-tip');
      tip.textContent = text;
      top.appendChild(tip);
      const w = tip.offsetWidth;
      tip.style.left = Math.min(W - w - 8, Math.max(8, r.x + r.w / 2 - w / 2)) + 'px';
      tip.style.top = (r.y - 40) + 'px';
    };
    let menu = null;
    // A MENU above a thing: rows of [text, kind], kind "grey" or "line".
    s.menu = (target, rows) => {
      if (menu) { menu.remove(); menu = null; }
      if (!rows) return null;
      const r = s.rect(target);
      menu = el('div', 'scr-menu');
      rows.forEach(([text, kind]) => {
        const row = el('div', 'scr-mi' + (kind ? ' ' + kind : ''));
        if (text) row.textContent = text;
        row.dataset.mi = text || '';
        menu.appendChild(row);
      });
      top.appendChild(menu);
      const w = menu.offsetWidth;
      menu.style.left = Math.min(W - w - 8, r.x + r.w / 2 - w / 2) + 'px';
      menu.style.top = (r.y - menu.offsetHeight - 10) + 'px';
      return menu;
    };

    // ---- what the camera looks at (the tour's to draw: a phone shows less)
    s.focus = (target) => {
      if (s.onfocus) s.onfocus(target ? s.rect(target) : null);
    };

    // ---- back to the desktop as it was, before the chapter's first step
    s.reset = () => {
      s.gen += 1;
      clearInterval(blinking);
      Object.keys(wins).forEach((id) => delete wins[id]);
      frames.clear();
      tip = null;
      menu = null;
      cx = 900;
      cy = 640;
      desktop();
      s.focus(null);
    };
    s.root = root;
    s.reset();
    return s;
  };
})();
