// CHAPTER 5: SEARCH, SCORE, REPORT (docs/site-storyboard.md). What a round
// found, on the phone and in Search; one job's score and why; what the CV is
// missing; the report the next morning; a question typed in the chat. All of
// it the app's own, on the store of a person further on (data/full.js: the
// real store row by row, every name made up, the numbers real).
(function () {
  const F = window.FULL;
  const S = window.SCENE;

  // THE PILL OPENED AND ITS CHAT LET DOWN, from rest.
  const openChat = async (s) => {
    if (s.find('pill:[data-box][data-rest]')) {
      await s.click('pill:.bxduck');
      await s.app.stand('pill');
    }
    s.front('pill');
    if (!s.find('pill:[data-box][data-drop="chat"]')) {
      await s.click('pill:[data-box-text]');
      s.app.drop('pill', 'chat');
    }
  };
  // A SCREEN, from the pill's Open row.
  const openScreen = async (s, key, page, kind) => {
    await openChat(s);
    const row = s.find('pill:[data-box-choices] .bxrow.folded');
    if (row) {
      await s.click(row.querySelector('[data-box-fold]'));
      row.classList.remove('folded');
      await s.wait(300);
    }
    await s.click(`pill:[data-open="${key}"]`);
    await s.app.screen(key, page, kind);
    s.focus(s.win(key).node);
  };

  window.CHAPTERS = window.CHAPTERS || [];
  window.CHAPTERS.push({
    id: 'scores',
    title: 'Search, scores, report',
    start: async (s) => {
      S.installed(s);
      s.clock('09:38', window.FRESH.days[0]);
      s.app.now = { run: 'idle', mins: F.mins, last: '' };
      await s.app.openPill(F.box_watch, { run: 'idle' });
      await s.app.rest('pill', null);
    },
    steps: [
      {
        say: 'New jobs reach your phone, each with its score.',
        run: async (s) => {
          const ph = await S.phone(s);
          ph.chat('GoodLuck!', 'bot', 'G');
          ph.time('09:38');
          s.focus(ph.node);
          await s.wait(700);
          if (F.phone_found) ph.bot(F.phone_found.html);
          await s.wait(3200);
        },
      },
      {
        say: 'Search holds every job found, each scored against your profile.',
        run: async (s) => {
          if (s.win('phone')) s.close('phone');
          await openScreen(s, 'search', F.search);
          await s.wait(1500);
          // THE SCORE SLIDER drawn up to the mark: the best score jobs.
          await s.move('search:.jlist', 500);
          await s.app.go('search', F.search_best);
          s.focus(s.win('search').node);
          await s.wait(1800);
        },
      },
      {
        say: 'Why that score: what the job asks for, and where your CV says it.',
        run: async (s) => {
          await s.click(`search:a.jrow[href="/jobs/${F.job_id}"]`);
          await s.app.go('search', F.job);
          await s.wait(900);
          const doc = s.doc('search');
          const why = [...doc.querySelectorAll('h2, h3, .sechead, div')]
            .find((n) => /why this score/i.test(n.textContent) && n.children.length < 3);
          if (why) await s.scroll('search', why, 1200, 60);
          await s.wait(2600);
        },
      },
      {
        say: 'What your CV is missing, counted on the jobs themselves.',
        run: async (s) => {
          await openScreen(s, 'cv', F.cv);
          await s.wait(2800);
        },
      },
      {
        say: 'Each morning: where you stand, and what to do today.',
        run: async (s) => {
          ['cv', 'search'].forEach((id) => { if (s.win(id)) s.close(id); });
          s.app.drop('pill', null);
          await s.app.rest('pill', null);
          await s.pass('07:30', window.FRESH.days[1]);
          const first = (F.report.find((l) => l.kind === 'say') || {}).text || '';
          s.tray.dot(true);
          await s.app.told('pill', S.firstLine(first));
          s.focus({ x: 0, y: 0, w: 560, h: 320 });
          await s.wait(1600);
          await s.click('pill:.bxduck');
          s.tray.dot(false);
          await s.app.stand('pill');
          s.app.drop('pill', 'chat');
          s.focus('pill:[data-box]');
          for (const line of F.report) {
            await s.app.drawn('pill', line, true);
            await s.wait(500);
          }
          const study = s.find('pill:.bxstudy');
          if (study) await s.scroll('pill:[data-box-thread]', study, 900, 120);
          await s.wait(2600);
          const found = s.find('pill:.bxfound');
          if (found) await s.scroll('pill:[data-box-thread]', found, 900, 60);
          await s.wait(1400);
        },
      },
      {
        say: 'Ask in your own words. It fetches the things themselves.',
        run: async (s) => {
          const input = s.find('pill:[data-box-find]');
          await S.typeInto(s, input, F.asked.text, null, 45);
          await s.click('pill:[data-box-send]');
          input.value = '';
          s.app.say('pill', 'you', F.asked.text);
          s.app.turn('pill', true);
          const box = s.find('pill:[data-box]');
          const work = s.app.work('pill', box.dataset.thinking || 'thinking');
          await s.wait(1600);
          work.end();
          s.app.turn('pill', false);
          await s.app.typed('pill', F.asked.say);
          s.app.found('pill', { rows: F.asked.rows });
          if ((F.asked.offer || []).length) s.app.offer('pill', F.asked.offer);
          await s.wait(2800);
        },
      },
    ],
  });
})();
