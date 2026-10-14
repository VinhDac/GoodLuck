// THE TOUR: plays a chapter's steps on the screen (screen.js), says each under it,
// and lets the visitor pause, go back, go on, or press what the tour would press.
//
// PLAYING, a step runs and is read for a while, then the next comes. PAUSED, a
// press waits for the visitor on the lit place (s.gate), and a step that is done
// waits for the arrow. Back, or a chapter chosen, runs the steps before it at
// once (s.fast) on a desktop made anew, then plays from there.
(() => {
  const $ = (sel) => document.querySelector(sel);
  const chapters = window.CHAPTERS || [];
  const monitor = $('[data-monitor]');
  const s = window.makeScreen($('[data-screen]'), window.FRESH);
  // THE APP'S OWN WAYS on its pages (screen/app.js), for every chapter.
  s.app = window.makeApp(s);
  document.documentElement.style.setProperty('--duck', s.root.style.getPropertyValue('--duck'));
  const ui = {
    chap: $('[data-chap]'), say: $('[data-say]'), count: $('[data-count]'), steps: $('[data-steps]'),
    play: $('[data-play]'), back: $('[data-back]'), next: $('[data-next]'), list: $('[data-chapters]'),
  };
  const TOTAL = 8;
  let ch = 0;
  let at = 0;
  let playing = true;
  let token = 0;
  let running = false;
  let ended = false;
  let gateDone = null;
  let stepDone = null;
  const steps = () => chapters[ch].steps;

  // ---- the screen fitted to the monitor, and the camera on a phone: as close
  // as the thing in focus allows, never so far that black shows above or under
  // the screen, and staying where it was when nothing is in focus. `view` is the
  // part of the screen in sight, in the screen's own pixels.
  // A PHONE, OR A TABLET STOOD UP: the same test as tour.css's.
  const CAMERA = matchMedia('(max-width:760px), (orientation:portrait)');
  let focus = null;
  let view = null;
  const layout = () => {
    const box = monitor.getBoundingClientRect();
    const k = Math.min(box.width / s.W, box.height / s.H);
    let z = 1;
    let tx = (box.width - s.W * k) / 2;
    let ty = (box.height - s.H * k) / 2;
    if (CAMERA.matches) {
      const fill = box.height / (s.H * k);
      const f = focus || { x: s.W / 2, y: s.H / 2, w: 0, h: 0 };
      z = !focus ? fill : Math.min(3.2, Math.max(fill,
        Math.min((box.width - 20) / (f.w * k), (box.height - 20) / (f.h * k))));
      tx = box.width / 2 - (f.x + f.w / 2) * k * z;
      ty = box.height / 2 - (f.y + f.h / 2) * k * z;
      // A THING WIDER OR TALLER THAN THE VIEW is read from its start: its left
      // edge, its top, in sight (a page's words begin there).
      if (f.w * k * z > box.width) tx = 8 - f.x * k * z;
      if (f.h * k * z > box.height) ty = 8 - f.y * k * z;
      tx = Math.min(0, Math.max(box.width - s.W * k * z, tx));
      ty = Math.min(0, Math.max(box.height - s.H * k * z, ty));
    }
    view = { x: Math.max(0, -tx / (k * z)), y: Math.max(0, -ty / (k * z)),
      w: Math.min(s.W, box.width / (k * z)), h: Math.min(s.H, box.height / (k * z)) };
    s.root.style.transform = `translate(${tx}px,${ty}px) scale(${k * z})`;
  };
  s.onfocus = (rect) => { focus = rect || focus; layout(); };
  addEventListener('resize', layout);

  // ---- a press: the tour's while it plays, the visitor's while it is paused,
  // lit on the screen with the word over it (under it, near the top), and the
  // camera taken to it when it is out of sight
  s.gate = (rect) => new Promise((done) => {
    if (playing) { setTimeout(done, 380); return; }
    const hot = document.createElement('div');
    hot.className = 'scr-hot' + (rect.y < 70 ? ' below' : '');
    hot.innerHTML = '<span>Press here</span>';
    Object.assign(hot.style, { left: (rect.x - 6) + 'px', top: (rect.y - 6) + 'px',
      width: (rect.w + 12) + 'px', height: (rect.h + 12) + 'px' });
    if (view && !(rect.x >= view.x && rect.y - 50 >= view.y && rect.x + rect.w <= view.x + view.w
        && rect.y + rect.h + 50 <= view.y + view.h)) {
      focus = { x: rect.x - 40, y: rect.y - 60, w: rect.w + 80, h: rect.h + 120 };
      layout();
    }
    s.root.appendChild(hot);
    gateDone = () => { hot.remove(); gateDone = null; done(); };
    hot.addEventListener('click', () => gateDone && gateDone());
  });

  // ---- what is said, and where in the chapter it is
  const show = () => {
    const list = steps();
    ui.chap.textContent = `Chapter ${ch + 1} · ${chapters[ch].title}`;
    ui.say.textContent = list[at].say;
    ui.count.textContent = `${at + 1} / ${list.length}`;
    ui.steps.innerHTML = list.map((_, i) =>
      `<i class="${i < at || ended ? 'done' : i === at ? 'on' : ''}"></i>`).join('');
    document.body.classList.toggle('paused', !playing);
    document.body.classList.toggle('ended-next', ended && !!chapters[ch + 1]);
    // AN SVG HAS NO `hidden` PROPERTY: the attribute itself is set.
    const icon = ended ? 'again' : playing ? 'pause' : 'resume';
    ui.play.querySelectorAll('svg').forEach((g) => g.toggleAttribute('hidden', !g.hasAttribute(`data-${icon}`)));
    ui.play.setAttribute('aria-label', ended ? 'Watch again' : playing ? 'Pause' : 'Play');
    [...ui.list.children].forEach((b, i) => b.classList.toggle('on', i === ch));
  };
  const reading = (text) => 1500 + text.length * 40;

  // ---- the chapter played from `at` on
  const play = async (my) => {
    while (my === token) {
      show();
      running = true;
      try {
        await steps()[at].run(s);
      } catch (e) {
        running = false;
        if (e.message !== s.STOP) console.error(e);
        return;
      }
      running = false;
      if (my !== token) return;
      if (playing) {
        await new Promise((r) => { stepDone = r; setTimeout(r, reading(steps()[at].say)); });
      } else {
        await new Promise((r) => { stepDone = r; });
      }
      stepDone = null;
      if (my !== token) return;
      // THE CHAPTER'S END: the arrow goes on to the next one, play plays it again.
      if (at + 1 >= steps().length) {
        playing = false;
        ended = true;
        show();
        const next = chapters[ch + 1];
        ui.say.textContent = next ? `Next: ${next.title}.`
          : ch + 1 < TOTAL ? 'The next chapters are coming.' : 'That is all of it, and it is free.';
        return;
      }
      at += 1;
    }
  };

  // ---- a jump: a desktop made anew, the steps before run at once
  const jump = async (chapter, step) => {
    token += 1;
    const my = token;
    ch = chapter;
    ended = false;
    // The address follows the chapter played, so it can be passed on.
    if (chapters[ch] && location.hash !== '#' + chapters[ch].id) {
      history.replaceState(null, '', '#' + chapters[ch].id);
    }
    focus = null;
    s.reset();
    s.app.resetPlaces();
    s.fast = true;
    // WHERE THE CHAPTER STARTS: what the chapters before it left on the screen.
    if (chapters[ch].start) {
      try { await chapters[ch].start(s); } catch (e) { if (e.message !== s.STOP) console.error(e); }
      if (my !== token) { s.fast = false; return; }
    }
    for (let i = 0; i < step; i += 1) {
      try { await chapters[ch].steps[i].run(s); } catch (e) { if (e.message !== s.STOP) console.error(e); }
      if (my !== token) { s.fast = false; return; }
    }
    s.fast = false;
    at = step;
    play(my);
  };

  ui.play.addEventListener('click', () => {
    if (ended) { playing = true; jump(ch, 0); return; }
    playing = !playing;
    show();
    if (playing) {
      if (gateDone) gateDone();
      if (stepDone) stepDone();
    }
  });
  ui.next.addEventListener('click', () => {
    if (gateDone) { gateDone(); return; }
    if (stepDone) { stepDone(); return; }
    if (ended) { if (chapters[ch + 1]) { playing = true; jump(ch + 1, 0); } return; }
    if (running && at + 1 < steps().length) jump(ch, at + 1);
  });
  ui.back.addEventListener('click', () => jump(ch, Math.max(0, at - (running || ended ? 0 : 1))));
  addEventListener('keydown', (e) => {
    if (e.key === ' ') { e.preventDefault(); ui.play.click(); }
    if (e.key === 'ArrowRight') ui.next.click();
    if (e.key === 'ArrowLeft') ui.back.click();
  });

  // ---- the chapters, the ones still to come shown as such
  const NAMES = ['Install', 'Your CV', 'Connect', 'Run', 'Scores', 'Send CV', 'When it needs you', 'Replies'];
  for (let i = 0; i < TOTAL; i += 1) {
    const b = document.createElement('button');
    b.textContent = `${i + 1} ${NAMES[i]}`;
    b.disabled = !chapters[i];
    if (!chapters[i]) b.title = 'Coming soon';
    // A CHAPTER CHOSEN PLAYS, whatever the last one was left at.
    b.addEventListener('click', () => { playing = true; jump(i, 0); });
    ui.list.appendChild(b);
  }

  // FOR A PICTURE OF A STEP (scripts that take the site's pictures): go to it.
  window.tour = { jump, pause: () => { playing = false; show(); },
    play: () => { playing = true; show(); }, ended: () => ended };
  layout();
  // A CHAPTER NAMED IN THE ADDRESS (tour.html#send) is the one that plays.
  const named = () => Math.max(0, chapters.findIndex((c) => '#' + c.id === location.hash));
  addEventListener('hashchange', () => { playing = true; jump(named(), 0); });
  setTimeout(() => jump(named(), 0), 500);
})();
