// CHAPTER 8: REPLIES, ALERTS, ONE MINUTE A DAY (docs/site-storyboard.md). A no
// comes: the red dot by the clock, the reading of it in the chat with the one
// change it points to, Track moved by itself. An interview: notes and a reply
// a press away. The afternoon's word when the day is behind; the evening's
// report on the phone. Two mails are made up, as the store's own are; all the
// rest is the app's (data/full.js: bot.mail_moved, first.replied, first.watch,
// bot.daily_bulletin, Track).
(function () {
  const F = window.FULL;
  const D = window.FRESH;
  const S = window.SCENE;

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
    s.focus('pill:[data-box]');
  };
  const draw = async (s, lines) => {
    for (const line of lines || []) {
      await s.app.drawn('pill', line, true);
      await s.wait(450);
    }
  };
  const firstSay = (lines) => ((lines || []).find((l) => l.kind === 'say') || {}).text || '';

  window.CHAPTERS = window.CHAPTERS || [];
  window.CHAPTERS.push({
    id: 'replies',
    title: 'Replies, alerts, one minute a day',
    start: async (s) => {
      S.installed(s);
      s.clock('11:40', D.days[1]);
      s.app.now = { run: 'idle', mins: F.mins, last: '' };
      // The box as it stands late that day: its words count the forms sent.
      await s.app.openPill(F.box_late || F.box_watch, { run: 'idle' });
      await s.app.rest('pill', null);
    },
    steps: [
      {
        say: 'Something new: a red dot on the duck, and a line beside the one in the corner.',
        run: async (s) => {
          s.tray.dot(true);
          await s.app.told('pill', S.firstLine(firstSay(F.no_chat)));
          const ph = await S.phone(s);
          ph.chat('GoodLuck!', 'bot', 'G');
          ph.time('11:40');
          if ((F.no_phone || [])[0]) ph.bot(F.no_phone[0].html);
          const duck = s.tray.node();
          s.focus({ x: 0, y: 0, w: 1440, h: 900 });
          await s.move(duck, 900);
          s.tray.hover(true);
          s.tip(duck, `GoodLuck! · ${F.status_news}`);
          await s.wait(2600);
          s.tip(null);
          s.tray.hover(false);
        },
      },
      {
        say: 'A no is read for what it teaches, and ends with one change to make.',
        run: async (s) => {
          if (s.win('phone')) s.close('phone');
          await openChat(s);
          s.tray.dot(false);
          await draw(s, F.no_chat);
          const change = [...s.doc('pill').querySelectorAll('.bxcard')]
            .find((c) => /in your CV\?/.test(c.textContent));
          const study = s.find('pill:.bxstudy');
          if (study) await s.scroll('pill:[data-box-thread]', study, 900, 80);
          await s.wait(2200);
          if (change) {
            await s.scroll('pill:[data-box-thread]', change, 900, 80);
            S.lit(change);
            await s.wait(2400);
            S.lit(change, false);
          }
        },
      },
      {
        say: 'Track moves by itself, from the mail.',
        run: async (s) => {
          const row = s.find('pill:[data-box-choices] .bxrow.folded');
          if (row) {
            await s.click(row.querySelector('[data-box-fold]'));
            row.classList.remove('folded');
          }
          await s.click('pill:[data-open="track"]');
          await s.app.screen('track', F.track_no);
          s.focus(s.win('track').node);
          const doc = s.doc('track');
          const moved = [...doc.querySelectorAll('tr, .trow, [data-row]')]
            .find((n) => n.textContent.includes(F.no_job.company) && /rejected/.test(n.textContent));
          if (moved) {
            await s.scroll('track', moved, 900, 200);
            S.lit(moved);
          }
          await s.wait(2800);
        },
      },
      {
        say: 'An interview: it gets you ready, and drafts your reply.',
        run: async (s) => {
          if (s.win('track')) s.close('track');
          const ph = await S.phone(s);
          if ((F.yes_phone || [])[0]) ph.bot(F.yes_phone[0].html);
          s.focus({ x: 400, y: 0, w: 1040, h: 720 });
          await s.wait(1400);
          s.front('pill');
          await draw(s, F.yes_chat);
          const card = [...s.doc('pill').querySelectorAll('.bxcard')].pop();
          if (card) {
            await s.scroll('pill:[data-box-thread]', card, 900, 60);
            const ready = [...card.querySelectorAll('.bxdo')].filter((b) => /Prepare me|Draft a reply/.test(b.textContent));
            ready.forEach((b) => S.lit(b));
            await s.wait(2600);
            ready.forEach((b) => S.lit(b, false));
          }
        },
      },
      {
        say: 'Behind in the afternoon? It says so, with what to do about it.',
        run: async (s) => {
          if (s.win('phone')) s.close('phone');
          s.app.drop('pill', null);
          await s.app.rest('pill', null);
          await s.pass('14:00', D.days[1]);
          await s.app.told('pill', S.firstLine(firstSay(F.behind_chat)));
          s.tray.dot(true);
          await s.wait(1400);
          await openChat(s);
          s.tray.dot(false);
          await draw(s, F.behind_chat);
          // The card just come: the last of the thread's, not an earlier one.
          const blocks = [...s.doc('pill').querySelectorAll('[data-box-thread] .bxfound')];
          const card = blocks.length ? blocks[blocks.length - 1].querySelector('.bxcard') : null;
          if (card) {
            await s.scroll('pill:[data-box-thread]', card, 900, 60);
            S.lit(card);
            await s.wait(2400);
            S.lit(card, false);
          }
        },
      },
      {
        say: 'Each evening, your day in one message.',
        run: async (s) => {
          s.app.drop('pill', null);
          await s.app.rest('pill', null);
          await s.pass('20:00', D.days[1]);
          const ph = await S.phone(s);
          ph.chat('GoodLuck!', 'bot', 'G');
          ph.time('20:00');
          if (F.evening_phone) ph.bot(F.evening_phone.html);
          s.focus(ph.node);
          await s.wait(3400);
        },
      },
      {
        say: 'A minute a day is enough. The duck does the rest.',
        run: async (s) => {
          if (s.win('phone')) s.close('phone');
          s.focus({ x: 0, y: 0, w: 1440, h: 900 });
          await s.wait(1200);
          await s.click('pill:.bxduck');
          await s.app.stand('pill');
          for (let n = 0; n < 3; n += 1) {
            s.app.word('pill', n);
            await s.wait(1300);
          }
          await s.app.rest('pill', null);
          await s.wait(1200);
        },
      },
    ],
  });
})();
