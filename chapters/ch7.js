// CHAPTER 7: WHEN IT NEEDS YOU (docs/site-storyboard.md). A question no profile
// answers, asked once, on the phone and in the chat; a check only a person can
// pass; a site that wants the person signed in; a job asking more than they
// have; a job its own page says is gone; the Queue, everything waiting in one
// place. Each message, card, button and line is the app's own, made by its own
// code on jobs of the store (data/full.js); the employers' pages are sketches.
(function () {
  const F = window.FULL;
  const P = window.PARTS;
  const S = window.SCENE;
  const ONE = 'Filling in {c}\'s form in the Apply window: you press its Submit.';
  const REFERRED = ['Have you been referred by an employee?', 'referred', 'select', true, ['Yes', 'No']];

  const fields = (extra) => (F.form_fields || []).slice(0, -1).concat(extra ? [extra] : [])
    .concat((F.form_fields || []).slice(-1));
  const value = (key) => (key === 'cv' ? F.cv_sent : ((F.forms || [])[0] || {}).book[key] || '');
  // THE APPLY WINDOW on a form (or a page) of `job`, a tab of its own.
  const show = async (s, job, page, url) => {
    const title = `Job Application for ${job.title} at ${job.company}`;
    if (!s.win('apply')) {
      await s.open('apply', { title, x: 110, y: 34, w: 1220, h: 806, node: P.browser(url || job.url, title, page) });
      return page;
    }
    const w = s.win('apply').node;
    const view = w.querySelector('.pt-view');
    view.innerHTML = '';
    view.appendChild(page);
    w.querySelector('.pt-tab').lastChild.textContent = title;
    w.querySelector('.pt-url').textContent = url || job.url;
    return page;
  };
  // THE FILLER'S ANSWERS, put in at once (chapter 6 shows each going in).
  const filled = (page, skip) => {
    (F.form_fields || []).forEach(([, key, how]) => {
      if (key === skip) return;
      const box = page.querySelector(`[data-f="${key}"] [data-in]`);
      if (!box) return;
      const v = value(key);
      if (how === 'select') box.querySelector('span').textContent = v;
      else if (how === 'check') box.classList.add('on');
      else box.textContent = v;
    });
  };
  const formOf = (job, extra) => P.form({ company: job.company, title: job.title, location: job.location,
    fields: fields(extra) });
  const rows = (keys) => (keys || []).map((k) => k[0]);
  // The answer buttons in the rows the bot gives them: each choice its own
  // row, then the rest on one (apply/ask.py).
  const keyRows = (msg) => {
    const labels = rows(msg.keys);
    const tail = labels.filter((l) => ['I applied', 'Skip this job', 'Done'].includes(l));
    return labels.filter((l) => !tail.includes(l)).map((l) => [l]).concat(tail.length ? [tail] : []);
  };

  window.CHAPTERS = window.CHAPTERS || [];
  window.CHAPTERS.push({
    id: 'needs',
    title: 'When it needs you',
    start: async (s) => {
      S.installed(s);
      s.clock('10:12', window.FRESH.days[1]);
      s.app.now = { run: 'running', mins: 0, last: '' };
      await s.app.openPill(F.box_run, { run: 'running' });
      await s.app.rest('pill', null);
    },
    steps: [
      {
        say: 'A question it cannot answer? It asks you once, on your phone and in the chat.',
        run: async (s) => {
          const job = F.question_job;
          const page = await show(s, job, formOf(job, REFERRED));
          filled(page);
          s.focus(s.win('apply').node.querySelector('.pt-job-page') || s.win('apply').node);
          const box = page.querySelector('[data-f="referred"]');
          await s.scroll(page, box, 700, 260);
          S.lit(box);
          await s.wait(1200);
          const ph = await S.phone(s);
          ph.chat('GoodLuck!', 'bot', 'G');
          ph.time('10:13');
          if (F.question_msg) ph.bot(F.question_msg.html, keyRows(F.question_msg));
          s.tray.dot(true);
          // live.js: the first line of the bot's message, beside the duck.
          await s.app.told('pill', S.firstLine(F.question_msg.html));
          s.focus({ x: 100, y: 30, w: 1340, h: 820 });
          await s.wait(2800);
        },
      },
      {
        say: 'Answer once. It is kept for every form that asks it, and the form goes on.',
        run: async (s) => {
          const ph = await S.phone(s);
          s.focus(ph.node);
          const no = ph.key('No');
          if (no) { await s.click(no); no.classList.add('on'); }
          await s.wait(500);
          ph.bot(F.answered);
          s.tray.dot(false);
          await s.app.told('pill', null);
          await s.wait(1200);
          const page = s.win('apply').node.querySelector('.pt-job');
          const box = page.querySelector('[data-f="referred"]');
          S.lit(box, false);
          box.querySelector('[data-in] span').textContent = 'No';
          box.classList.add('flash');
          s.focus(s.win('apply').node.querySelector('.pt-job-page') || s.win('apply').node);
          await s.wait(2000);
        },
      },
      {
        say: 'Only a person can do this part. You do it, and it carries on.',
        run: async (s) => {
          const job = F.turn_job;
          const page = await show(s, job, formOf(job));
          filled(page);
          const form = page.querySelector('[data-form]');
          const check = P.captcha();
          form.insertBefore(check, form.querySelector('[data-submit]'));
          await s.scroll(page, check, 800, 300);
          S.lit(check);
          const ph = await S.phone(s);
          if (F.turn_msg) ph.bot(F.turn_msg.html, keyRows(F.turn_msg));
          s.focus({ x: 100, y: 30, w: 1340, h: 820 });
          await s.wait(2400);
          S.lit(check, false);
          const tick = check.querySelector('[data-human]');
          await s.click(tick);
          tick.classList.add('on');
          await s.wait(600);
          const done = ph.key('Done');
          if (done) { await s.click(done); done.classList.add('on'); }
          ph.bot(F.turn_done);
          await s.wait(2000);
        },
      },
      {
        say: 'A site wants you signed in? Open its form, sign in, and it fills the rest.',
        run: async (s) => {
          if (s.win('phone')) s.close('phone');
          await s.click('pill:.bxduck');
          await s.app.stand('pill');
          await s.click('pill:[data-box-text]');
          s.app.drop('pill', 'chat');
          const card = s.app.found('pill', { rows: F.signin_card }).querySelector('.bxcard');
          s.focus('pill:[data-box]');
          await s.wait(1600);
          const open = [...card.querySelectorAll('.bxdo')].find((b) => b.textContent === 'Open its form');
          await s.click(open);
          open.classList.add('on');
          s.app.say('pill', 'you', 'Open its form');
          s.app.say('pill', 'bot', F.signin_note);
          await s.wait(1200);
          const job = F.signin_job;
          const page = await show(s, job, P.signin(job),
            `https://${F.signin_host}/en-GB/External/login`);
          s.front('apply');
          s.focus(s.win('apply').node.querySelector('.pt-job-page') || s.win('apply').node);
          await s.wait(700);
          await S.typeText(s, page.querySelector('[data-mail]'), 'rowan.ellery@example.com', 35);
          await S.typeText(s, page.querySelector('[data-pass]'), '••••••••••••', 60);
          await s.click(page.querySelector('[data-sign]'));
          await s.wait(700);
          s.front('pill');
          s.focus('pill:[data-box]');
          const fill = [...card.querySelectorAll('.bxdo')].find((b) => b.textContent === 'Fill it in now');
          await s.click(fill);
          const ask = (F.signin_card[0].buttons.find((b) => b.label === 'Fill it in now') || {}).ask;
          const yes = s.app.ask('pill', ask, 'Fill it in now');
          await s.wait(1200);
          await s.click(yes);
          s.app.drop('pill', 'chat');
          s.app.say('pill', 'you', 'Fill it in now');
          s.app.say('pill', 'bot', ONE.replace('{c}', job.company));
          await s.wait(900);
          const form = await show(s, job, formOf(job));
          s.front('apply');
          filled(form);
          s.focus(s.win('apply').node.querySelector('.pt-job-page') || s.win('apply').node);
          await s.wait(1800);
        },
      },
      {
        say: 'It will not send you where you do not fit, and it says why.',
        run: async (s) => {
          if (s.win('apply')) s.close('apply');
          s.front('pill');
          const row = s.find('pill:[data-box-choices] .bxrow.folded');
          if (row) {
            await s.click(row.querySelector('[data-box-fold]'));
            row.classList.remove('folded');
          }
          await s.click('pill:[data-open="queue"]');
          await s.app.screen('queue', F.queue);
          s.focus(s.win('queue').node);
          const doc = s.doc('queue');
          const wall = [...doc.querySelectorAll('div, li, tr')].reverse()
            .find((n) => /asks for 5\+ years/.test(n.textContent) && n.children.length > 1
              && n.textContent.length < 400);
          if (wall) {
            await s.scroll('queue', wall, 1200, 160);
            S.lit(wall);
          }
          await s.wait(2800);
          if (wall) S.lit(wall, false);
        },
      },
      {
        say: 'A job that is gone is marked so, and put away by itself.',
        run: async (s) => {
          s.app.station('running', 0, F.gone_line);
          s.front('pill');
          await s.app.rest('pill', F.gone_line);
          s.focus({ x: 0, y: 0, w: 720, h: 380 });
          await s.wait(3200);
        },
      },
      {
        say: 'Everything that waits on you, in one place: the Queue.',
        run: async (s) => {
          s.app.station('idle', F.mins, '');
          await s.app.line('pill', null);
          s.front('queue');
          await s.scroll('queue', 0, 900);
          s.focus(s.win('queue').node);
          const bar = s.doc('queue').querySelector('.topbar, header');
          if (bar) S.lit(bar);
          await s.wait(3000);
          if (bar) S.lit(bar, false);
        },
      },
    ],
  });
})();
