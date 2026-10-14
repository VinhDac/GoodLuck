// CHAPTER 2: YOUR CV BECOMES YOUR PROFILE (docs/site-storyboard.md). The CV read
// and what it proposes approved; then the few questions it could not answer,
// page by page as the app leads to them; and, for a new computer, the file the
// old one exported, imported. Every page is the app's own, as it drew it for
// this person (data/fresh.js); the titles offered are those real postings use
// (data/full.js: the store of a person further on, every firm's name made up).
(function () {
  const D = window.FRESH;
  const F = window.FULL;
  const S = window.SCENE;
  const TITLES = D.answers.job_titles.split('\n');
  const EXPORT = 'GoodLuck-export-2026-10-14-091200.tar.gz';
  const FILES_CV = [
    { name: 'Rowan_Ellery_CV.docx', kind: 'word', date: '12/10/2026 18:40', type: 'Microsoft Word Document', size: '24 KB' },
    { name: 'Rowan_Ellery_CV.pdf', kind: 'pdf', date: '12/10/2026 18:42', type: 'PDF Document', size: '91 KB' },
    { name: 'Degree certificate.pdf', kind: 'pdf', date: '03/09/2026 10:15', type: 'PDF Document', size: '312 KB' },
  ];
  const FILES_EXPORT = [
    { name: EXPORT, kind: 'zip', date: '14/10/2026 09:12', type: 'GZ File', size: '3,418 KB' },
  ];

  const doc = (s) => s.doc('profile');
  const fieldOf = (s, name) => {
    const box = doc(s).querySelector(`[data-tags="${name}"]`);
    return box && box.closest('[data-tagfield]');
  };
  const saveOf = (s) => doc(s).querySelector('.actions button.primary, .actbar button.primary');
  const rowOf = (s, field) => {
    const box = doc(s).querySelector(`input[value="${field}"]`);
    return box && box.closest('.qrow');
  };
  // What is typed to find a title: the first letters of its words.
  const typedOf = (title) => title.split(' ').map((w) => w.slice(0, 5)).join(' ').toLowerCase();

  // A TAG CHOSEN (the profile's tag fields): letters typed into its search,
  // the list narrowed to them, the title pressed; one the list does not hold
  // is taken as typed (live.js: Enter takes the words as typed).
  const pick = async (s, name, value, typed) => {
    const field = fieldOf(s, name);
    const input = field.querySelector('.tagfind');
    await s.scroll('profile', input, 600, 170);
    await S.typeInto(s, input, typed || value, (v) => s.app.narrow(field, v));
    const chip = [...field.querySelectorAll('[data-addtag]')]
      .find((c) => c.dataset.addtag === value && !c.hidden);
    if (chip) await s.click(chip);
    s.app.addTag(field, name, value);
    input.value = '';
    s.app.narrow(field, '');
    await s.wait(250);
  };

  // THE FILE BOX SHOWS THE FILE CHOSEN, as the browser's own box does.
  const chosen = (s, name) => {
    const box = doc(s).querySelector('input[type=file]');
    if (!box) return;
    box.style.display = 'none';
    const shown = box.ownerDocument.createElement('span');
    shown.style.cssText = 'display:inline-flex;align-items:center;gap:8px;font-size:14px';
    shown.innerHTML = '<span style="padding:2px 8px;border-radius:2px;background:#5b5b5b;color:#fff">'
      + 'Choose File</span>' + name;
    box.after(shown);
  };

  window.CHAPTERS = window.CHAPTERS || [];
  window.CHAPTERS.push({
    id: 'cv',
    title: 'Your CV becomes your profile',
    start: async (s) => {
      S.installed(s);
      await s.app.openPill(D.box0, { drop: 'chat', run: 'paused' });
    },
    steps: [
      {
        say: 'Start with your CV. It reads it and fills in your profile for you.',
        run: async (s) => {
          s.focus('pill:[data-box-setup]');
          await s.wait(500);
          await s.click('pill:[data-box-setup] a.mbtn');
          await s.app.screen('profile', D.import);
          s.focus(s.win('profile').node);
          await s.wait(1000);
        },
      },
      {
        say: 'Pick your CV: a Word file, or a PDF with its text in it.',
        run: async (s) => {
          await s.click('profile:input[type=file]');
          await S.choose(s, { place: 'Documents', pick: 0, filter: 'CV (*.docx;*.pdf)', files: FILES_CV });
          chosen(s, FILES_CV[0].name);
          s.focus(s.win('profile').node);
          await s.wait(800);
        },
      },
      {
        say: 'It reads it and proposes each answer. Nothing is saved until you approve it.',
        run: async (s) => {
          await s.click('profile:form button.primary');
          await s.app.go('profile', D.approve);
          s.focus(s.win('profile').node);
          await s.wait(1800);
          await s.scroll('profile', rowOf(s, 'skills_strong'), 1400, 110);
          await s.wait(1200);
        },
      },
      {
        say: 'Your CV gives the jobs you did. The search needs the jobs you want: you set those next.',
        run: async (s) => {
          const row = rowOf(s, 'job_titles');
          await s.scroll('profile', row, 900, 140);
          S.lit(row.querySelector('.risk'));
          await s.wait(2600);
          S.lit(row.querySelector('.risk'), false);
          await s.scroll('profile', '.actbar', 800, 360);
          await s.click('profile:.actbar button.primary');
          await s.app.go('profile', D.stops[0].page);
          await s.wait(700);
        },
      },
      {
        say: 'Then it takes you to whatever is still missing, one page at a time.',
        run: async (s) => {
          const input = doc(s).querySelector('input[name=nationality]');
          await s.scroll('profile', input, 1000, 200);
          S.lit(input.closest('section'));
          await S.typeInto(s, input, D.answers.nationality);
          await s.wait(500);
          S.lit(input.closest('section'), false);
          await s.scroll('profile', saveOf(s), 800, 360);
          await s.click(saveOf(s));
          await s.app.go('profile', D.stops[1].page);
          await s.wait(600);
        },
      },
      {
        say: 'Job titles are what it searches for. It offers the ones real postings use.',
        run: async (s) => {
          s.focus(s.win('profile').node);
          const field = fieldOf(s, 'job_titles');
          await s.scroll('profile', field.closest('section'), 600, 40);
          // THE LISTS LAND once the boards are read (live.js paints them in):
          // the titles real postings carry, and their skills.
          await s.wait(1500);
          const part = field.querySelector('.sugpart');
          if (part && F && F.sug_titles) part.outerHTML = F.sug_titles;
          const skills = fieldOf(s, 'skills_strong');
          const skillsPart = skills && skills.querySelector('.sugpart');
          if (skillsPart && F && F.sug_skills) skillsPart.outerHTML = F.sug_skills;
          await s.wait(800);
          // The two the CV gave are jobs done: they go.
          for (const x of [...field.querySelectorAll('.tag .untag')]) {
            await s.click(x);
            x.closest('.tag').remove();
            await s.wait(200);
          }
          for (const title of TITLES) await pick(s, 'job_titles', title, typedOf(title));
          await s.wait(600);
        },
      },
      {
        say: 'Where you want to work, and where you need no visa. Then Save.',
        run: async (s) => {
          await pick(s, 'countries', 'United Kingdom', 'united k');
          await pick(s, 'no_sponsor', 'United Kingdom', 'united k');
          for (const mode of D.answers.work_mode) {
            const box = doc(s).querySelector(`input[name=work_mode][value="${mode}"]`);
            if (!box) continue;
            await s.scroll('profile', box, 400, 220);
            await s.tick(box);
          }
          await s.scroll('profile', saveOf(s), 800, 360);
          await s.click(saveOf(s));
          await s.app.go('profile', D.stops[2].page);
          await s.wait(600);
        },
      },
      {
        say: 'How long you have really worked. Save, and your profile is done.',
        run: async (s) => {
          const box = doc(s).querySelector(`input[name=years_real][value="${D.answers.years_real}"]`);
          await s.tick(box);
          await s.wait(500);
          await s.scroll('profile', saveOf(s), 1000, 360);
          await s.click(saveOf(s));
          await s.wait(300);
          await s.click('profile:.winbtn.close');
          s.close('profile');
          s.front('pill');
          await s.app.swap('pill', D.box_mail);
          s.focus('pill:[data-box]');
          await s.wait(1600);
        },
      },
      {
        say: 'A new computer? Export on the old one, Import the file here: everything comes back.',
        run: async (s) => {
          const row = s.find('pill:[data-box-setup] .carryrow');
          await s.scroll('pill:[data-box-thread]', row, 900, 260);
          s.focus('pill:[data-box]');
          await s.click(row.querySelector('label'));
          await S.choose(s, { place: 'Downloads', pick: 0, filter: 'GoodLuck export (*.gz)', files: FILES_EXPORT, x: 290, y: 170 });
          // live.js: what is being imported, said where the button was.
          row.querySelector('label span').textContent = `Importing ${EXPORT}…`;
          await s.wait(1800);
          await s.app.swap('pill', D.box_set);
          s.app.drop('pill', 'chat');
          s.focus('pill:[data-box]');
          await s.wait(1800);
        },
      },
    ],
  });
})();
