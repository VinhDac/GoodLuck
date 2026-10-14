// CHAPTER 3: CONNECT (docs/site-storyboard.md): the job mailbox, the target,
// the phone, the assistant. What the app shows and says is its own, drawn at
// each step for this person (data/fresh.js); what Gmail, Telegram and Groq
// show is a sketch of their pages with the words on their buttons, and every
// password, token and key in it is made up.
(function () {
  const D = window.FRESH;
  const P = window.PARTS;
  const S = window.SCENE;
  const APP_PASSWORD = 'qmzr wkte fhbn yuxa';             // made up, as the page shows one
  const KEY = 'gsk_W7qe2Lr9VbX0yN4tKc8HpZs1MfA6uJd3RgT5oEi';  // made up

  // THE SETTINGS WINDOW: a panel in a window of its own, whose page asks for
  // what it shows (live.js, openSheet); the tab named is the one open.
  const sheetIn = (s, sheet, tab) => {
    const d = s.doc('settings');
    const box = d.querySelector('[data-sheet]');
    box.hidden = false;
    box.classList.add('mid');
    box.querySelector('.sheetbox').innerHTML = sheet;
    if (tab) tabTo(s, tab);
  };
  // live.js, wireSheetTabs: the tab pressed, its pane shown.
  const tabTo = (s, tab) => {
    const d = s.doc('settings');
    d.querySelectorAll('[data-stab]').forEach((b) => b.classList.toggle('on', b.dataset.stab === tab));
    d.querySelectorAll('[data-pane]').forEach((p) => p.classList.toggle('on', p.dataset.pane === tab));
  };
  const pane = (s) => s.doc('settings').querySelector('[data-pane="bao"]');
  // A browser of the person's own, on a page outside the app.
  const browse = (s, url, title, page) => s.open('browser', {
    title, x: 230, y: 70, w: 980, h: 700, node: P.browser(url, title, page),
  });

  window.CHAPTERS = window.CHAPTERS || [];
  window.CHAPTERS.push({
    id: 'connect',
    title: 'Connect: mailbox, target, phone, assistant',
    start: async (s) => {
      S.installed(s);
      await s.app.openPill(D.box_mail, { drop: 'chat', run: 'paused' });
    },
    steps: [
      {
        say: 'Connect the mailbox you give employers. Replies then update your applications by themselves.',
        run: async (s) => {
          const form = s.find('pill:form[data-post="/api/mail/setup"]');
          s.focus('pill:[data-box]');
          S.lit(form.closest('.sstep'));
          await s.wait(2400);
          S.lit(form.closest('.sstep'), false);
          await s.click(form.querySelector('.boxwhy a'));
          await browse(s, 'myaccount.google.com/apppasswords', 'App passwords', P.appPasswords());
          s.focus(s.win('browser').node);
          await s.wait(900);
        },
      },
      {
        say: 'Your mail account makes a 16-letter app password. It is not your account password.',
        run: async (s) => {
          const view = s.win('browser').node.querySelector('.pt-view');
          await S.typeText(s, view.querySelector('[data-appname]'), 'GoodLuck');
          await s.click(view.querySelector('[data-create]'));
          const modal = P.appPassword(APP_PASSWORD);
          view.appendChild(modal);
          s.focus(modal.querySelector('.pt-acct-card'));
          await s.wait(2200);
          await s.click(modal.querySelector('[data-done]'));
          s.close('browser');
          await s.wait(300);
        },
      },
      {
        say: 'Paste it and press Connect. It is kept in Windows Credential Manager, never in a file.',
        run: async (s) => {
          s.front('pill');
          s.focus('pill:[data-box]');
          const form = s.find('pill:form[data-post="/api/mail/setup"]');
          const pw = form.querySelector('input[name=password]');
          await s.click(pw);
          pw.value = APP_PASSWORD.replace(/ /g, '');
          await s.wait(500);
          await s.click(form.querySelector('button[type=submit]'));
          s.app.note(form, 'checking…');
          await s.wait(1500);
          // CONNECTED: the box is drawn again, the next step open in its chat.
          await s.app.swap('pill', D.box_target);
          await s.wait(1400);
        },
      },
      {
        say: 'Your target: applications a day, interviews a week. Every day is counted against it.',
        run: async (s) => {
          s.focus('pill:[data-box]');
          const form = s.find('pill:form.bxaim');
          S.lit(form);
          await s.wait(2200);
          S.lit(form, false);
          await s.click(form.querySelector('button[type=submit]'));
          s.app.note(form, 'checking…');
          await s.wait(1100);
          // THE SETUP IS FINISHED: the app loads the box again, with its buttons.
          await s.app.swap('pill', D.box_set);
          await s.wait(1800);
        },
      },
      {
        say: 'Optional, and worth it: your phone hears from the duck while you are away.',
        run: async (s) => {
          const row = s.find('pill:[data-box-choices] .bxrow.folded');
          if (row) {
            await s.click(row.querySelector('[data-box-fold]'));
            row.classList.remove('folded');
            await s.wait(400);
          }
          await s.click('pill:[data-open="settings"]');
          await s.app.screen('settings', D.settings, 'settings');
          sheetIn(s, D.settings_sheet);
          s.focus(s.win('settings').node);
          await s.wait(700);
          await s.click('settings:[data-stab="bao"]');
          tabTo(s, 'bao');
          await s.wait(1000);
          const ph = await S.phone(s);
          ph.chat('BotFather', 'bot', 'B');
          s.focus(ph.node);
          await S.talk(s, ph, [
            ['me', '/newbot'],
            ['bot', 'A new bot. What will it be called?'],
            ['me', 'GoodLuck'],
            ['bot', 'Now its username. It has to end in <b>bot</b>.'],
            ['me', D.bot_name],
            ['bot', `Done. Here is its token, to keep to yourself:\n<code>${D.phone_token}</code>`],
          ]);
          await s.wait(600);
        },
      },
      {
        say: 'Paste the token and Save. Press Start on the phone, then Save again.',
        run: async (s) => {
          const ph = await S.phone(s);
          const token = pane(s).querySelector('input[name=token]');
          s.focus(s.win('settings').node);
          await s.scroll('settings', token, 600, 260);
          await s.click(token);
          token.value = D.phone_token;
          await s.wait(400);
          await s.click(pane(s).querySelector('form.setform button[type=submit]'));
          sheetIn(s, D.sheet_first, 'bao');
          await s.wait(2600);
          // THE BOT'S LINK, opened on the phone: its chat, and Start.
          ph.chat('GoodLuck!', 'bot', 'G');
          ph.start(true);
          s.focus(ph.node);
          await s.wait(700);
          await s.click(ph.node.querySelector('[data-start]'));
          ph.start(false);
          ph.me('/start');
          await s.wait(700);
          s.focus(s.win('settings').node);
          await s.click(pane(s).querySelector('form.setform button[type=submit]'));
          sheetIn(s, D.sheet_done, 'bao');
          await s.wait(2000);
        },
      },
      {
        say: 'Press Test: the phone is told when it will hear from the duck.',
        run: async (s) => {
          const ph = await S.phone(s);
          const test = pane(s).querySelector('button[name=test]');
          if (test) await s.click(test);
          sheetIn(s, D.sheet_test, 'bao');
          await s.wait(500);
          ph.bot(D.phone_message);
          s.focus(ph.node);
          await s.wait(2600);
          await s.click('settings:.winbtn.close');
          s.close('settings');
          await s.wait(300);
        },
      },
      {
        say: 'Optional: a free key, and you can ask for anything in your own words.',
        run: async (s) => {
          if (s.win('phone')) s.close('phone');
          s.front('pill');
          const form = s.find('pill:form.bxkey');
          const said = s.find('pill:[data-box-model]').dataset.on;
          await s.scroll('pill:[data-box-thread]', form, 600, 140);
          s.focus('pill:[data-box]');
          await s.click(form.querySelector('a.mbtn'));
          const page = P.apiKeys();
          await browse(s, 'console.groq.com/keys', 'API Keys', page);
          s.focus(s.win('browser').node);
          await s.wait(700);
          await s.click(page.querySelector('[data-create]'));
          const modal = P.apiKey(KEY);
          page.appendChild(modal);
          await S.typeText(s, modal.querySelector('[data-keyname]'), 'GoodLuck');
          await s.click(modal.querySelector('[data-submit]'));
          modal.querySelector('[data-made]').hidden = false;
          modal.querySelector('[data-submit]').hidden = true;
          modal.querySelector('[data-copy]').hidden = false;
          await s.wait(900);
          await s.click(modal.querySelector('[data-copy]'));
          s.close('browser');
          s.front('pill');
          s.focus('pill:[data-box]');
          // THE PASTE ITSELF SENDS IT (live.js): nothing to press after it.
          const input = form.querySelector('input[name=key]');
          await s.click(input);
          input.value = KEY;
          s.app.note(form, 'checking…');
          await s.wait(1200);
          await s.app.swap('pill', D.box_done);
          s.app.say('pill', 'bot', said);
          await s.wait(1800);
        },
      },
      {
        say: 'Set up. The bar shows your day, and the chat takes what you type.',
        run: async (s) => {
          s.focus('pill:.bxpill');
          await s.move('pill:[data-box-find]', 700);
          await s.wait(1400);
          for (let n = 1; n <= 2; n += 1) {
            s.app.word('pill', n);
            await s.wait(1600);
          }
        },
      },
    ],
  });
})();
