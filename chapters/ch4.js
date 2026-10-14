// CHAPTER 4: START IT, LEAVE IT RUNNING (docs/site-storyboard.md). Start
// session pressed once; the pill rests as a duck in the corner, the journal's
// newest line beside it while a round runs; on watch between rounds; pressed,
// it is the pill again; and the journal with every line. The box is the app's
// own in each state (data/full.js), the round's words are the journal's own
// formats, its numbers those of one real round of the search (sources named
// by made-up firms).
(function () {
  const F = window.FULL;
  const S = window.SCENE;
  const DAY = (window.FRESH.days || [])[0];
  const START = { h: 9, m: 24, s: 5 };
  const NOTES = 'Cover letter: Quantitative Analyst\n\nDear hiring team,\n\nI am writing to apply for the '
    + 'Quantitative Analyst role. During my MSc in Financial Mathematics I built a backtesting framework'
    + ' in Python and ran risk analysis on daily data';

  const fmt = (n) => Number(n || 0).toLocaleString('en-GB');
  const keptOf = () => {
    const m = /(\d+) new job/.exec((F.phone_found || {}).html || '');
    return m ? Number(m[1]) : 0;
  };
  const two = (n) => String(n).padStart(2, '0');
  // A MOMENT OF THE ROUND on the scene's clock, `secs` after it started.
  const at = (secs) => {
    const all = START.h * 3600 + START.m * 60 + START.s + Math.round(secs);
    return `${two(Math.floor(all / 3600) % 24)}:${two(Math.floor(all / 60) % 60)}:${two(all % 60)}`;
  };

  // THE ROUND, IN THE JOURNAL'S OWN WORDS (session.py, scan_runner.py,
  // derive.py, bot.py, track/scan.py), said as the public site says them: the
  // long dash a colon. Each: [stream, level, words, seconds after the start].
  const roundLines = () => {
    const r = F.round || { sources: [], fetched: 0, new: 0, fast: 0, minutes: 3 };
    const kept = keptOf();
    const mins = r.minutes || 3;
    const out = [['system', 'ok', `session started: ${F.stages.join(' → ')}`, 0],
      ['search', 'info', `scan started: ${r.fast} fast sources + the Chrome pass`, 1]];
    r.sources.forEach((x, i) => out.push(['search', x.new ? 'ok' : 'info',
      `${x.name}: ${fmt(x.fetched)} fetched, ${x.new} new`, 2 + i * 3]));
    const t = 2 + r.sources.length * 3;
    out.push(['score', 'ok', `re-judged ${kept} · scored ${kept}`, t + 40],
      ['search', 'ok', `scan finished: fetched ${fmt(r.fetched)} · new ${r.new} · kept ${kept} · 0 via agencies`,
        mins * 60 - 30],
      ['system', 'ok', `messaged Telegram: ${kept} new jobs`, mins * 60 - 28],
      ['system', 'ok', `session · Search done: fetched ${fmt(r.fetched)} · new ${r.new} · kept ${kept}`
        + ` · 0 via agencies (${mins} min)`, mins * 60 - 27],
      ['mail', 'ok', `mail: ${r.mail_new} new · ${r.mail_moved} applications moved on · 0 rebuilt from mail`
        + ' · 0 for you in the Queue', mins * 60 + 25],
      ['system', 'ok', `session · Manage mail done: ${r.mail_new} new mail, ${r.mail_moved} moved on,`
        + ' 0 for you (1 min)', mins * 60 + 26],
      ['system', 'ok', `session done: ${F.stages.length}/${F.stages.length} stages ran`, mins * 60 + 27]);
    return out;
  };

  // THE APP AT WORK: the station on, and the line beside the duck.
  const say = async (s, line) => {
    s.app.station('running', 0, line[2]);
    await s.app.line('pill', line[2]);
  };

  window.CHAPTERS = window.CHAPTERS || [];
  window.CHAPTERS.push({
    id: 'run',
    title: 'Start it, leave it running',
    start: async (s) => {
      S.installed(s);
      s.clock('09:24', DAY);
      await s.app.openPill(F.box_off, { run: 'paused' });
    },
    steps: [
      {
        say: 'Press Start session. That is all it needs from you.',
        run: async (s) => {
          s.focus('pill:.bxpill');
          await s.wait(500);
          await s.click('pill:[data-box-pick]');
          s.app.drop('pill', 'list');
          await s.wait(500);
          for (const item of ['send', 'search', 'mail']) {
            await s.move(`pill:.bxitem[data-act="${item}"]`, 380);
          }
          await s.click('pill:.bxitem[data-act="session"]');
          s.app.drop('pill', null);
          await s.wait(300);
          await s.click('pill:[data-box-go]');
          s.app.drop('pill', 'chat');
          s.app.say('pill', 'you', 'Start session');
          s.app.say('pill', 'bot', 'the session is running…');
          const lines = roundLines();
          s.app.station('running', 0, lines[0][2]);
          await s.app.swap('pill', F.box_run);
          s.tray.blink(true);
          await s.wait(1600);
        },
      },
      {
        say: 'It gets out of your way: a small duck in the corner, at work.',
        run: async (s) => {
          const lines = roundLines();
          await s.app.rest('pill', lines[0][2]);
          s.focus({ x: 0, y: 0, w: 520, h: 300 });
          await s.wait(900);
          await say(s, lines[1]);
          await s.wait(1400);
        },
      },
      {
        say: 'Every round it searches, scores, and reads the mail. You keep working.',
        run: async (s) => {
          s.tray.blink(true);
          await s.open('notes', { title: 'Cover letter - Notes', x: 150, y: 90, w: 1000, h: 640,
            node: window.PARTS.notes(NOTES) });
          s.focus({ x: 0, y: 0, w: 900, h: 560 });
          const lines = roundLines().slice(2);
          for (const line of lines) {
            await say(s, line);
            await s.wait(line[0] === 'search' && /fetched, \d+ new$/.test(line[2]) ? 160 : 900);
          }
          await s.wait(800);
        },
      },
      {
        say: 'Between rounds it waits, on watch. The duck by the clock says when the next one is.',
        run: async (s) => {
          const last = roundLines().pop();
          s.app.station('idle', F.mins, last[2]);
          s.tray.blink(false);
          await s.app.line('pill', null);
          const duck = s.tray.node();
          s.focus(duck);
          await s.move(duck, 800);
          s.tray.hover(true);
          s.tip(duck, `GoodLuck! · ${F.status_watch}`);
          await s.wait(2600);
          s.tip(null);
          s.tray.hover(false);
        },
      },
      {
        say: 'Press the duck to open it. Leave it alone, and it rests again.',
        run: async (s) => {
          s.focus({ x: 0, y: 0, w: 1440, h: 400 });
          await s.click('pill:.bxduck');
          await s.app.stand('pill');
          await s.app.swap('pill', F.box_watch);
          s.focus('pill:.bxpill');
          await s.wait(2400);
          await s.app.rest('pill', null);
          s.focus({ x: 0, y: 0, w: 520, h: 300 });
          await s.wait(1200);
        },
      },
      {
        say: 'Want every detail? The journal has every line.',
        run: async (s) => {
          await s.click('pill:.bxduck');
          await s.app.stand('pill');
          await s.click('pill:[data-box-text]');
          s.app.drop('pill', 'chat');
          const row = s.find('pill:[data-box-choices] .bxrow.folded');
          if (row) {
            await s.click(row.querySelector('[data-box-fold]'));
            row.classList.remove('folded');
          }
          await s.click('pill:[data-open="journal"]');
          await s.app.screen('journal', F.journal, 'journal');
          s.app.journal('journal', roundLines().map(([stream, level, text, secs]) => (
            { stream, level, text, time: at(secs) })));
          s.app.progress('journal', null);
          s.focus(s.win('journal').node);
          await s.wait(2600);
        },
      },
    ],
  });
})();
