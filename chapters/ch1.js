// CHAPTER 1: INSTALL AND FIRST LAUNCH (docs/site-storyboard.md). From the
// download page to the app open at the top of the screen, its setup in its chat:
// the app's own page for a new person (data/fresh.js).
(function () {
  const D = window.FRESH;
  const P = window.PARTS;
  const duckOf = (s) => s.tray.node();

  // THE APP OPENS as it does for a new person: the pill, its chat let down
  // under it, the setup in the chat (views/box.render, its setup); the
  // station off until a session is started, the duck in amber.
  const openApp = (s) => s.app.openPill(D.box0, { drop: 'chat', run: 'paused' });

  window.CHAPTERS = window.CHAPTERS || [];
  window.CHAPTERS.push({
    id: 'install',
    title: 'Install and first launch',
    steps: [
      {
        say: 'Get the installer. One file, free.',
        run: async (s) => {
          const page = P.download(D);
          await s.open('browser', { title: 'GoodLuck! · Download', x: 180, y: 70, w: 1080, h: 690,
            node: P.browser('vinhdac.github.io/GoodLuck/download', 'GoodLuck! · Download', page) });
          s.focus('browser:.pt-dl');
          await s.wait(500);
          await s.click('browser:[data-dl="win"]');
          const fly = P.downloads(D);
          s.win('browser').body.querySelector('.pt-browser').appendChild(fly);
          s.focus(fly);
          await s.wait(700);
        },
      },
      {
        say: 'Windows does not know a free app yet: More info, then Run anyway.',
        run: async (s) => {
          await s.click('browser:[data-file] a');
          const ss = P.smartscreen(D);
          await s.open('smartscreen', { title: '', x: 470, y: 180, w: 500, h: 380, node: ss, z: 50,
            titleClass: 'pt-ss-title' });
          s.win('smartscreen').node.querySelector('.scr-title').style.display = 'none';
          s.focus(ss);
          await s.wait(900);
          await s.click(ss.querySelector('[data-more]'));
          ss.querySelector('.pt-ss-app').hidden = false;
          ss.querySelector('[data-run]').hidden = false;
          await s.wait(500);
          await s.click(ss.querySelector('[data-run]'));
          s.close('smartscreen');
          s.close('browser');
        },
      },
      {
        say: 'Next, next, install. No administrator needed.',
        run: async (s) => {
          const setup = P.installer(D);
          await s.open('setup', { title: 'Setup - GoodLuck!', icon: s.appIcon(16), x: 420, y: 160, w: 600, h: 470,
            node: setup, z: 40 });
          s.focus(setup);
          const go = setup.querySelector('[data-go]');
          P.page(setup, 'licence', D);
          await s.wait(600);
          const accept = setup.querySelector('[data-accept]');
          await s.click(accept);
          accept.classList.add('on');
          accept.nextElementSibling.classList.remove('on');
          go.disabled = false;
          await s.click(go);
          for (const which of ['folder', 'tasks', 'ready']) {
            P.page(setup, which, D);
            await s.wait(500);
            await s.click(go);
          }
          P.page(setup, 'installing', D);
          const fill = setup.querySelector('[data-fill]');
          if (s.fast) fill.style.transition = 'none';
          requestAnimationFrame(() => { fill.style.width = '100%'; });
          await s.wait(1800);
          P.page(setup, 'done', D);
          await s.wait(400);
          await s.click(go);
          s.close('setup');
        },
      },
      {
        say: 'The duck by the clock: GoodLuck is running.',
        run: async (s) => {
          s.icon('goodluck', 'GoodLuck!', s.appIcon());
          s.tray.show(true);
          s.focus(duckOf(s));
          await s.wait(600);
          await s.move(duckOf(s), 800);
          await s.wait(900);
        },
      },
      {
        say: 'It opens as a small bar at the top of your screen, and shows what to do first.',
        run: async (s) => {
          await openApp(s);
          s.focus('pill:[data-box]');
          await s.move('pill:[data-box-text]', 900);
          await s.wait(1200);
          await s.move('pill:[data-box-setup]', 900);
          await s.wait(1600);
        },
      },
      {
        say: 'Right-click the duck for its menu. Quit lives there.',
        run: async (s) => {
          if (!s.win('pill')) await openApp(s);
          s.focus(duckOf(s));
          await s.move(duckOf(s), 900);
          s.tray.hover(true);
          s.tip(duckOf(s), `GoodLuck! · ${D.status}`);
          await s.wait(1500);
          s.tip(null);
          await s.click(duckOf(s));
          s.menu(duckOf(s), [[D.status, 'grey'], [D.jobs, 'grey'], ['', 'line'],
            ['Open GoodLuck!', 'bold'], ['', 'line'], ['Quit GoodLuck!']]);
          await s.wait(1600);
          s.menu(null);
          s.tray.hover(false);
        },
      },
      {
        say: 'Put it away with one press. The duck brings it back.',
        run: async (s) => {
          if (!s.win('pill')) await openApp(s);
          s.focus('pill:.bxwin');
          await s.click('pill:.bxwin');
          s.hide('pill', true);
          s.taskApp('goodluck', s.appIcon(24), false);
          s.focus(duckOf(s));
          await s.wait(900);
          await s.click(duckOf(s));
          s.hide('pill', false);
          s.taskApp('goodluck', s.appIcon(24), true);
          s.focus('pill:[data-box]');
          await s.wait(1200);
        },
      },
    ],
  });
})();
