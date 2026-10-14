// WHAT IS NOT THE APP, drawn as a sketch of it with the words on its buttons
// (Vin, 14 Oct 2026: "được", the storyboard's [sơ đồ]): the browser, Windows'
// SmartScreen, the installer's pages. Each is a node a window of the screen holds.
(function () {
  const el = (tag, cls, html) => {
    const made = document.createElement(tag);
    if (cls) made.className = cls;
    if (html !== undefined) made.innerHTML = html;
    return made;
  };
  const P = {};

  // ---- A BROWSER: a tab, an address, and a page of the site's own.
  P.browser = (url, title, page) => {
    const node = el('div', 'pt-browser');
    node.innerHTML = `<div class="pt-tabs"><div class="pt-tab"><span class="pt-fav"></span>${title}</div></div>`
      + `<div class="pt-addr"><span class="pt-nav">&#8592; &#8594; &#8635;</span><div class="pt-url">${url}</div></div>`;
    const view = el('div', 'pt-view');
    view.appendChild(page);
    node.appendChild(view);
    return node;
  };
  // OUR OWN DOWNLOAD PAGE, as the site has it.
  P.download = (data) => el('div', 'pt-dl', `
    <div class="pt-dl-mark"></div>
    <h1>Download GoodLuck!</h1>
    <p>Free for your own job search. Version ${data.version}.</p>
    <div class="pt-dl-row">
      <button class="pt-dl-win" data-dl="win">Download for Windows</button>
      <button class="pt-dl-mac">Download for Mac</button>
    </div>
    <p class="pt-dl-small">Windows 10 and 11 · Mac with Apple silicon</p>`);
  // THE BROWSER'S DOWNLOADS, the file just come.
  P.downloads = (data) => el('div', 'pt-flyout', `
    <div class="pt-fly-head">Downloads</div>
    <div class="pt-fly-row" data-file>
      <span class="pt-exe"></span>
      <span><b>${data.file}</b><br><a>Open file</a></span>
    </div>`);

  // ---- WINDOWS' OWN WARNING for an app no one has paid to sign.
  P.smartscreen = (data) => {
    const node = el('div', 'pt-ss');
    node.innerHTML = `
      <div class="pt-ss-x">&#10005;</div>
      <h2>Windows protected your PC</h2>
      <p>Microsoft Defender SmartScreen prevented an unrecognised app from starting.
        Running this app might put your PC at risk.</p>
      <a class="pt-ss-more" data-more>More info</a>
      <div class="pt-ss-app" hidden><p>App: ${data.file}</p><p>Publisher: Unknown publisher</p></div>
      <div class="pt-ss-btns"><button data-run hidden>Run anyway</button><button>Don't run</button></div>`;
    return node;
  };

  // ---- THE INSTALLER, Inno Setup's pages with their own words (make_exe.py).
  const LICENSE_HEAD = 'License Agreement';
  P.installer = (data) => {
    const node = el('div', 'pt-setup');
    node.innerHTML = '<div class="pt-setup-page" data-page></div>'
      + '<div class="pt-setup-foot"><button data-back>&lt; Back</button>'
      + '<button class="pt-primary" data-go>Next &gt;</button><button>Cancel</button></div>';
    return node;
  };
  // ONE PAGE: its head and what is under it; and the button that goes on.
  P.page = (node, which, data) => {
    const page = node.querySelector('[data-page]');
    const go = node.querySelector('[data-go]');
    const back = node.querySelector('[data-back]');
    const head = (title, sub) => `<div class="pt-setup-head"><div><b>${title}</b><p>${sub}</p></div>`
      + '<div class="scr-appicon pt-setup-icon"></div></div>';
    back.hidden = which === 'licence' || which === 'done' || which === 'installing';
    go.disabled = false;
    if (which === 'licence') {
      page.innerHTML = head(LICENSE_HEAD, 'Please read the following important information before continuing.')
        + '<div class="pt-setup-in"><p>Please read the following License Agreement. You must accept the terms of this '
        + 'agreement before continuing with the installation.</p>'
        + `<div class="pt-licence">${data.licence.map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('')}</div>`
        + '<label class="pt-radio" data-accept><i></i>I accept the agreement</label>'
        + '<label class="pt-radio on"><i></i>I do not accept the agreement</label></div>';
      go.textContent = 'Next >';
      go.disabled = true;
    } else if (which === 'folder') {
      page.innerHTML = head('Select Destination Location', 'Where should GoodLuck! be installed?')
        + '<div class="pt-setup-in"><p>Setup will install GoodLuck! into the following folder.</p>'
        + '<p>To continue, click Next. If you would like to select a different folder, click Browse.</p>'
        + '<div class="pt-path"><span>C:\\Users\\Rowan\\AppData\\Local\\Programs\\GoodLuck</span><button>Browse...</button></div></div>';
      go.textContent = 'Next >';
    } else if (which === 'tasks') {
      page.innerHTML = head('Select Additional Tasks', 'Which additional tasks should be performed?')
        + '<div class="pt-setup-in"><p>Select the additional tasks you would like Setup to perform while installing '
        + 'GoodLuck!, then click Next.</p><p class="pt-group">Additional shortcuts:</p>'
        + '<label class="pt-check on"><i></i>Create a desktop shortcut</label></div>';
      go.textContent = 'Next >';
    } else if (which === 'ready') {
      page.innerHTML = head('Ready to Install', 'Setup is now ready to begin installing GoodLuck! on your computer.')
        + '<div class="pt-setup-in"><p>Click Install to continue with the installation, or click Back if you want '
        + 'to review or change any settings.</p><div class="pt-memo">Destination location:<br>'
        + '&nbsp;&nbsp;&nbsp;C:\\Users\\Rowan\\AppData\\Local\\Programs\\GoodLuck<br><br>Additional tasks:<br>'
        + '&nbsp;&nbsp;&nbsp;Additional shortcuts:<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Create a desktop shortcut</div></div>';
      go.textContent = 'Install';
    } else if (which === 'installing') {
      page.innerHTML = head('Installing', 'Please wait while Setup installs GoodLuck! on your computer.')
        + '<div class="pt-setup-in"><p>Extracting files...</p>'
        + '<p class="pt-file">C:\\Users\\Rowan\\AppData\\Local\\Programs\\GoodLuck\\GoodLuck.exe</p>'
        + '<div class="pt-progress"><i data-fill></i></div></div>';
      go.textContent = 'Next >';
      go.disabled = true;
    } else if (which === 'done') {
      page.innerHTML = '<div class="pt-done"><div class="pt-done-side"><div class="scr-appicon"></div></div>'
        + '<div class="pt-done-in"><h2>Completing the GoodLuck! Setup Wizard</h2>'
        + '<p>Setup has finished installing GoodLuck! on your computer. The application may be launched by '
        + 'selecting the installed shortcuts.</p><p>Click Finish to exit Setup.</p>'
        + '<label class="pt-check on"><i></i>Launch GoodLuck!</label></div></div>';
      go.textContent = 'Finish';
    }
    return page;
  };
  // ---- WINDOWS' OPEN DIALOG: a folder, its files, the name chosen, Open.
  // o: {place, files: [{name, kind: word|pdf|zip, date, type, size}], filter}
  P.openDialog = (o) => {
    const node = el('div', 'pt-open');
    const side = ['Home', 'Desktop', 'Downloads', 'Documents', 'Pictures', 'Music'];
    node.innerHTML = `
      <div class="pt-open-bar"><span class="pt-nav">&#8592; &#8594; &#8593;</span>
        <div class="pt-crumb">This PC &#8250; ${o.place}</div><div class="pt-find">Search ${o.place}</div></div>
      <div class="pt-open-main">
        <div class="pt-open-side">${side.map((n) => `<div class="${n === o.place ? 'on' : ''}">${n}</div>`).join('')}</div>
        <div class="pt-open-list">
          <div class="pt-open-head"><span>Name</span><span>Date modified</span><span>Type</span><span>Size</span></div>
          ${o.files.map((f, i) => `<div class="pt-open-row" data-file="${i}"><span><i class="pt-fi ${f.kind}"></i>`
            + `${f.name}</span><span>${f.date}</span><span>${f.type}</span><span>${f.size}</span></div>`).join('')}
        </div>
      </div>
      <div class="pt-open-foot">
        <span>File name:</span><div class="pt-open-name" data-name></div>
        <div class="pt-open-filter">${o.filter}</div>
        <div class="pt-open-btns"><button class="pt-primary" data-open>Open</button><button>Cancel</button></div>
      </div>`;
    return node;
  };
  // ONE FILE CHOSEN: its row lit, its name in the box.
  P.choose = (node, i) => {
    node.querySelectorAll('.pt-open-row').forEach((r) => r.classList.toggle('on', r.dataset.file === String(i)));
    const row = node.querySelector(`[data-file="${i}"] span`);
    node.querySelector('[data-name]').textContent = row ? row.textContent : '';
  };

  // ---- A MAIL ACCOUNT'S APP PASSWORDS (the page the app's «get one» opens,
  // myaccount.google.com/apppasswords), a sketch: a name, Create, the sixteen
  // letters shown once, Done.
  P.appPasswords = () => el('div', 'pt-acct', `
    <div class="pt-acct-in">
      <div class="pt-acct-back">&#8592;&nbsp; App passwords</div>
      <p>An app password lets an app read your mail without your account password. It is shown once,
        and you can remove it here at any time.</p>
      <p class="pt-acct-dim">You have no app passwords yet.</p>
      <p>To make one, give it a name:</p>
      <div class="pt-acct-field"><span>App name</span><div data-appname></div></div>
      <div class="pt-acct-row"><button class="pt-acct-btn" data-create>Create</button></div>
    </div>`);
  P.appPassword = (pw) => el('div', 'pt-acct-modal', `
    <div class="pt-acct-card">
      <h3>Generated app password</h3>
      <div class="pt-acct-pw" data-pw>${pw}</div>
      <p>Paste it where the app asks for it. It will not be shown again.</p>
      <div class="pt-acct-row"><button class="pt-acct-btn" data-done>Done</button></div>
    </div>`);

  // ---- THE ASSISTANT'S FREE KEY (the page «Get a free key» opens,
  // console.groq.com/keys), a sketch: Create, a name, the key, Copy.
  P.apiKeys = () => el('div', 'pt-keys', `
    <div class="pt-keys-side"><b>Console</b><span>Playground</span><span class="on">API Keys</span>
      <span>Usage</span><span>Settings</span></div>
    <div class="pt-keys-main">
      <h2>API Keys</h2>
      <p>Keys let an app use the models on your account. The free tier needs no card.</p>
      <button class="pt-keys-btn" data-create>Create API Key</button>
      <div class="pt-keys-empty">No API keys yet.</div>
    </div>`);
  P.apiKey = (key) => el('div', 'pt-acct-modal', `
    <div class="pt-acct-card">
      <h3>Create API Key</h3>
      <div class="pt-acct-field"><span>Display name</span><div data-keyname></div></div>
      <div class="pt-keys-made" data-made hidden>
        <p>Copy your new key now: it is shown only once.</p>
        <div class="pt-acct-pw small">${key}</div>
      </div>
      <div class="pt-acct-row"><button class="pt-acct-btn" data-submit>Submit</button>
        <button class="pt-acct-btn" data-copy hidden>Copy</button></div>
    </div>`);

  // ---- THE PHONE, by the screen: a chat app's thread with one bot, its
  // messages as the bot sends them (their bold, their links), its buttons
  // under them, what is typed on the phone; and the clock of the scene.
  P.phone = () => {
    const node = el('div', 'pt-phone');
    node.innerHTML = `
      <div class="pt-ph-screen">
        <div class="pt-ph-status"><span data-time>08:57</span><span>&#9679;&#9679;&#9679; &#9646;</span></div>
        <div class="pt-ph-head"><span class="pt-ph-back">&#8249;</span><span class="pt-ph-av" data-av></span>
          <span class="pt-ph-who"><b data-name></b><small data-sub></small></span></div>
        <div class="pt-ph-thread" data-thread></div>
        <div class="pt-ph-start" data-start hidden>START</div>
        <div class="pt-ph-bar"><span data-typing>Message</span><i></i></div>
      </div>`;
    const thread = node.querySelector('[data-thread]');
    const down = () => { thread.scrollTop = thread.scrollHeight; };
    const ph = {
      node,
      // WHOSE THREAD: a name, what it is, its initials on its picture.
      chat: (name, sub, initials) => {
        node.querySelector('[data-name]').textContent = name;
        node.querySelector('[data-sub]').textContent = sub || 'bot';
        node.querySelector('[data-av]').textContent = initials || name.slice(0, 1);
        thread.innerHTML = '';
      },
      time: (t) => { node.querySelector('[data-time]').textContent = t; },
      // A MESSAGE OF THE BOT'S, as the bot wrote it (its own few tags), and
      // its buttons in rows: [[label, ...], ...].
      bot: (html, rows) => {
        const msg = el('div', 'pt-ph-msg bot', html.replace(/\n/g, '<br>'));
        thread.appendChild(msg);
        if (rows && rows.length) {
          const keys = el('div', 'pt-ph-keys');
          rows.forEach((row) => {
            const line = el('div', 'pt-ph-krow');
            row.forEach((label) => line.appendChild(el('button', 'pt-ph-key', label)));
            keys.appendChild(line);
          });
          thread.appendChild(keys);
        }
        down();
        return msg;
      },
      me: (text) => { const msg = el('div', 'pt-ph-msg me', text); thread.appendChild(msg); down(); return msg; },
      typing: (text) => { node.querySelector('[data-typing]').textContent = text || 'Message'; },
      start: (on) => { node.querySelector('[data-start]').hidden = !on; },
      key: (label) => [...thread.querySelectorAll('.pt-ph-key')].reverse().find((b) => b.textContent === label),
    };
    return ph;
  };
  // ---- AN EMPLOYER'S APPLICATION FORM, as the sites forms run on draw one
  // (a sketch, no one's look): the job, its questions, Submit. `o`: {company,
  // title, location, fields: [[label, key, how, required, options]]}.
  const OPTIONS = {
    country: ['United Kingdom', 'Ireland', 'United States', 'Other'],
    right_to_work: ['Yes', 'No'], sponsor_now: ['Yes', 'No'], sponsor_future: ['Yes', 'No'],
    notice: ['Immediately', '2 weeks', '1 month', '3 months'], referred: ['Yes', 'No'],
  };
  P.form = (o) => {
    const node = el('div', 'pt-job');
    const esc = (s) => String(s || '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const field = ([label, key, how, req, options]) => {
      const star = req ? ' <b>*</b>' : '';
      if (how === 'check') {
        return `<div class="pt-f" data-f="${key}"><label class="pt-chk"><i data-in></i>${esc(label)}${star}</label></div>`;
      }
      const inside = how === 'select'
        ? `<div class="pt-sel" data-in data-opts='${JSON.stringify(options || OPTIONS[key] || ['Yes', 'No'])}'>`
          + '<span>Select...</span><i>&#9662;</i></div>'
        : how === 'file'
          ? '<div class="pt-file"><button>Attach</button><button>Dropbox</button><button>Google Drive</button>'
            + '<span data-in></span></div>'
          : '<div class="pt-in" data-in></div>';
      return `<div class="pt-f" data-f="${key}"><label>${esc(label)}${star}</label>${inside}</div>`;
    };
    node.innerHTML = `<div class="pt-job-page">
      <div class="pt-job-head"><span class="pt-job-logo">${esc(o.company).slice(0, 1)}</span>
        <div><h1>${esc(o.title)}</h1><p>${esc(o.company)} · ${esc(o.location)}</p></div></div>
      <div class="pt-job-form" data-form><h2>Apply for this job</h2><p class="pt-job-req"><b>*</b> Required</p>
        ${o.fields.map(field).join('')}
        <button class="pt-submit" data-submit>Submit application</button></div></div>`;
    return node;
  };
  // ITS DROPDOWN, let down under it: the rows the person (or the filler) picks from.
  P.drop = (sel) => {
    const list = el('div', 'pt-menu');
    JSON.parse(sel.dataset.opts || '[]').forEach((o) => list.appendChild(el('div', 'pt-mrow', o)));
    sel.parentNode.appendChild(list);
    return list;
  };
  // THE PAGE AFTER A SUBMIT: the employer's own thanks.
  P.thanks = (o) => el('div', 'pt-job', '<div class="pt-job-page pt-thanks"><div class="pt-job-head">'
    + `<span class="pt-job-logo">${String(o.company).slice(0, 1)}</span><div><h1>${o.title}</h1>`
    + `<p>${o.company}</p></div></div><div class="pt-done-box"><h2>Thank you for applying.</h2>`
    + '<p>Your application has been received. We will review it and be in touch.</p></div></div>');

  // ---- AN EMPLOYER'S OWN CAREERS SITE asking for a sign-in (a sketch).
  P.signin = (o) => el('div', 'pt-job', `<div class="pt-job-page pt-sign"><div class="pt-job-head">`
    + `<span class="pt-job-logo">${String(o.company).slice(0, 1)}</span><div><h1>${o.company} Careers</h1>`
    + `<p>${o.title}</p></div></div><div class="pt-sign-box"><h2>Sign In</h2>`
    + '<div class="pt-f"><label>Email Address <b>*</b></label><div class="pt-in" data-mail></div></div>'
    + '<div class="pt-f"><label>Password <b>*</b></label><div class="pt-in" data-pass></div></div>'
    + '<button class="pt-submit" data-sign>Sign In</button>'
    + '<p class="pt-sign-alt">New here? <u>Create Account</u></p></div></div>');
  // ---- A CHECK THAT A PERSON IS THERE, at the foot of a form (a sketch).
  P.captcha = () => el('div', 'pt-captcha', '<label class="pt-chk"><i data-human></i>I am a person</label>'
    + '<span class="pt-cap-mark">Verify you are human</span>');

  // ---- A NOTES APP: what the person is writing while the duck works.
  P.notes = (text) => {
    const node = el('div', 'pt-notes', '<div class="pt-notes-menu"><span>File</span><span>Edit</span>'
      + '<span>View</span></div><div class="pt-notes-text"></div>');
    node.querySelector('.pt-notes-text').textContent = text || '';
    node.querySelector('.pt-notes-text').appendChild(document.createElement('i'));
    return node;
  };
  window.PARTS = P;
})();
