// CHAPTER 6: SEND CV, IT FILLS THE FORMS (docs/site-storyboard.md). Today's
// forms, one press; the Apply window opens each employer's form; the answers
// go in from the profile, each put in whole as the filler does; every field
// read back; the form handed over for the person's own Submit; sent, on Track;
// the next ones; the round's word on the phone. What is filled and every word
// said are the app's (data/full.js: answer.book, ask.hand_over, Track, the
// round); the employer's page is a sketch of such a form.
(function () {
  const F = window.FULL;
  const P = window.PARTS;
  const S = window.SCENE;
  const OPENING = 'Filling in {n} forms in the Apply window, one at a time: you press each Submit.';

  const value = (form, key) => (key === 'cv' ? F.cv_sent : (form.book || {})[key] || '');
  const fields = () => F.form_fields || [];
  // THE APPLY WINDOW: the person's own Chrome, its tab on the employer's form.
  const applyWindow = async (s, form) => {
    const page = P.form({ company: form.company, title: form.title, location: form.location, fields: fields() });
    const title = `Job Application for ${form.title} at ${form.company}`;
    if (s.win('apply')) {
      const view = s.win('apply').node.querySelector('.pt-view');
      view.innerHTML = '';
      view.appendChild(page);
      s.win('apply').node.querySelector('.pt-tab').lastChild.textContent = title;
      s.win('apply').node.querySelector('.pt-url').textContent = form.url;
      return page;
    }
    await s.open('apply', { title, x: 110, y: 34, w: 1220, h: 806, node: P.browser(form.url, title, page) });
    return page;
  };
  const scrollTo = (s, node, gap = 180) => s.scroll(node.closest('.pt-job'), node, 450, gap);

  // ONE FIELD FILLED as the filler fills it: the value put in whole; a
  // dropdown let down and its row pressed; the CV attached with no dialog;
  // a box ticked.
  const fill = async (s, page, f, form, quick) => {
    const [, key, how] = f;
    const box = page.querySelector(`[data-f="${key}"]`);
    if (!box) return;
    const v = value(form, key);
    if (!quick) await scrollTo(s, box);
    box.classList.add('flash');
    const into = box.querySelector('[data-in]');
    if (how === 'select' && v) {
      if (!quick) {
        await s.click(into);
        const list = P.drop(into);
        const row = [...list.children].find((r) => r.textContent === v) || list.firstChild;
        row.classList.add('hot');
        await s.click(row);
        list.remove();
      }
      into.querySelector('span').textContent = v;
    } else if (how === 'file') {
      if (!quick) await s.click(box.querySelector('.pt-file button'));
      into.textContent = v;
    } else if (how === 'check') {
      if (!quick) await s.click(into);
      into.classList.add('on');
    } else if (v) {
      into.textContent = v;
    }
    if (!quick) await s.wait(220);
    setTimeout(() => box.classList.remove('flash'), quick ? 200 : 600);
  };

  window.CHAPTERS = window.CHAPTERS || [];
  window.CHAPTERS.push({
    id: 'send',
    title: 'Send CV: it fills the forms',
    start: async (s) => {
      S.installed(s);
      s.clock('07:36', window.FRESH.days[1]);
      s.app.now = { run: 'idle', mins: F.mins, last: '' };
      await s.app.openPill(F.box_watch, { drop: 'chat', run: 'idle' });
      // TODAY'S PLAN, in the chat: the app's own words and its card.
      await s.app.typed('pill', F.today.head);
      s.app.found('pill', { rows: F.today.rows });
    },
    steps: [
      {
        say: 'One press, and it fills the forms. You press each Submit.',
        run: async (s) => {
          s.focus('pill:[data-box]');
          const card = s.find('pill:.bxfound .bxcard');
          S.lit(card);
          await s.wait(1600);
          S.lit(card, false);
          const press = card.querySelector('.bxdo');
          const label = press.textContent;
          await s.click(press);
          const ask = (F.today.rows[0].buttons[0] || {}).ask || '';
          const yes = s.app.ask('pill', ask, label);
          await s.wait(1400);
          await s.click(yes);
          s.app.drop('pill', 'chat');
          s.app.say('pill', 'you', label);
          const n = (F.forms || []).length;
          s.app.say('pill', 'bot', OPENING.replace('{n}', n));
          s.app.station('running', 0, '');
          await s.wait(1400);
        },
      },
      {
        say: 'Its own browser window opens the employer\'s form.',
        run: async (s) => {
          await s.app.rest('pill', null);
          const form = F.forms[0];
          await applyWindow(s, form);
          s.focus(s.win('apply').node.querySelector('.pt-job-page') || s.win('apply').node);
          await s.wait(1800);
        },
      },
      {
        say: 'Your answers, from your profile, go into their form. The CV goes on too.',
        run: async (s) => {
          const page = s.win('apply').node.querySelector('.pt-job');
          for (const f of fields()) await fill(s, page, f, F.forms[0], false);
          await s.wait(600);
        },
      },
      {
        say: 'It reads every field back from the page before it hands the form to you.',
        run: async (s) => {
          const page = s.win('apply').node.querySelector('.pt-job');
          await s.scroll(page, 0, 600);
          for (const f of fields()) {
            const box = page.querySelector(`[data-f="${f[1]}"]`);
            if (!box) continue;
            await scrollTo(s, box, 320);
            box.classList.add('read');
            await s.wait(160);
          }
          await s.wait(700);
        },
      },
      {
        say: 'Your Submit: you look, then you press. Nothing goes without you.',
        run: async (s) => {
          const page = s.win('apply').node.querySelector('.pt-job');
          const submit = page.querySelector('[data-submit]');
          await scrollTo(s, submit, 360);
          S.lit(submit);
          const form = F.forms[0];
          await s.app.line('pill', `apply: ${form.company}: ${form.title.slice(0, 40)}: filled; yours to Submit,`
            + ' in the Apply window');
          const ph = await S.phone(s);
          ph.chat('GoodLuck!', 'bot', 'G');
          ph.time('07:38');
          if (F.submit_msg) ph.bot(F.submit_msg.html, [F.submit_msg.keys.map((k) => k[0])]);
          s.focus({ x: 100, y: 30, w: 1340, h: 820 });
          await s.wait(2600);
          S.lit(submit, false);
          await s.click(submit);
          const view = s.win('apply').node.querySelector('.pt-view');
          view.innerHTML = '';
          view.appendChild(P.thanks(form));
          await s.wait(900);
        },
      },
      {
        say: 'Sent. It is on Track, and the reply will be filed to it.',
        run: async (s) => {
          s.app.station('running', 0, F.sent_line);
          await s.app.line('pill', F.sent_line);
          await s.wait(1400);
          if (s.win('phone')) s.close('phone');
          await s.click('pill:.bxduck');
          await s.app.stand('pill');
          await s.click('pill:[data-box-text]');
          s.app.drop('pill', 'chat');
          const row = s.find('pill:[data-box-choices] .bxrow.folded');
          if (row) {
            await s.click(row.querySelector('[data-box-fold]'));
            row.classList.remove('folded');
          }
          await s.click('pill:[data-open="track"]');
          await s.app.screen('track', F.track);
          s.focus(s.win('track').node);
          const first = s.doc('track').querySelector('tbody tr, .trow, [data-row]');
          if (first) S.lit(first);
          await s.wait(2600);
        },
      },
      {
        say: 'Then the next form, and the next, until today\'s are done.',
        run: async (s) => {
          if (s.win('track')) s.close('track');
          s.front('apply');
          for (const form of F.forms.slice(1)) {
            const page = await applyWindow(s, form);
            s.focus(s.win('apply').node.querySelector('.pt-job-page') || s.win('apply').node);
            await s.wait(700);
            for (const f of fields()) {
              await fill(s, page, f, form, true);
              await s.wait(90);
            }
            const submit = page.querySelector('[data-submit]');
            await scrollTo(s, submit, 360);
            await s.click(submit);
            const view = s.win('apply').node.querySelector('.pt-view');
            view.innerHTML = '';
            view.appendChild(P.thanks(form));
            await s.wait(700);
          }
          s.close('apply');
          s.app.station('idle', F.mins, '');
          const ph = await S.phone(s);
          ph.chat('GoodLuck!', 'bot', 'G');
          if (F.round_msg) ph.bot(F.round_msg.html);
          s.focus(ph.node);
          await s.wait(2600);
        },
      },
    ],
  });
})();
