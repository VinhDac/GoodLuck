// WHAT THE CHAPTERS SHARE: where each one starts from, and the tour's own way
// of pointing at a thing on a page of the app's (a mark of the tour's, never
// one the app draws).
(function () {
  const LIT = 'tour-lit';
  const STYLE = `.${LIT}{outline:2px solid #FFD166 !important;outline-offset:4px;border-radius:6px;
    transition:outline-color .3s ease}`;

  window.SCENE = {
    // THE APP INSTALLED AND RUNNING: its icon on the desktop, the duck by the
    // clock, its button on the taskbar.
    installed: (s) => {
      s.icon('goodluck', 'GoodLuck!', s.appIcon());
      s.tray.show(true);
      s.taskApp('goodluck', s.appIcon(24));
    },
    // A THING ON A PAGE, lit for the eye, and unlit.
    lit: (node, on = true) => {
      if (!node) return;
      const d = node.ownerDocument;
      if (!d.getElementById('tour-style')) {
        const st = d.createElement('style');
        st.id = 'tour-style';
        st.textContent = STYLE;
        d.head.appendChild(st);
      }
      node.classList.toggle(LIT, on);
    },
    // WHAT STANDS BESIDE THE DUCK for a message of the bot's (live.js,
    // chatNews): its words without their markup, the first line.
    firstLine: (markup) => {
      const held = document.createElement('div');
      held.innerHTML = String(markup || '').replace(/<br\s*\/?>/g, '\n');
      return (held.textContent || '').split('\n')[0];
    },
    // LETTERS TYPED INTO A FIELD OF A PAGE, one by one, each one told to
    // `each` (a tag field narrows its list as it is typed into).
    typeInto: async (s, input, text, each, per = 60) => {
      await s.click(input, { after: 120 });
      input.focus && input.focus({ preventScroll: true });
      for (let i = 1; i <= text.length; i += 1) {
        input.value = text.slice(0, i);
        if (each) each(input.value);
        if (!s.fast) await s.wait(per);
      }
      input.value = text;
      if (each) each(text);
      await s.wait(200);
    },
    // LETTERS TYPED INTO A SKETCH'S BOX (a page that is not the app's).
    typeText: async (s, node, text, per = 70) => {
      await s.click(node, { after: 120 });
      for (let i = 1; i <= text.length; i += 1) {
        node.textContent = text.slice(0, i);
        if (!s.fast) await s.wait(per);
      }
      node.textContent = text;
      await s.wait(200);
    },
    // THE PHONE BY THE SCREEN (screen/parts.js): taken out, or the one out.
    phone: async (s, o = {}) => {
      const w = s.win('phone');
      if (w && w.ph) return w.ph;
      const ph = window.PARTS.phone();
      const made = await s.open('phone', { kind: 'bare', node: ph.node, x: o.x || 1158, y: o.y || 120,
        w: 262, h: 560, z: 70 });
      made.ph = ph;
      return ph;
    },
    // WHAT IS SAID IN THE PHONE'S THREAD, at the pace of a chat.
    talk: async (s, ph, lines) => {
      for (const [who, text, keys] of lines) {
        if (who === 'me') ph.me(text); else ph.bot(text, keys);
        await s.wait(who === 'me' ? 700 : 1100);
      }
    },
    // A FILE CHOSEN IN WINDOWS' OPEN DIALOG: the dialog, the file pressed,
    // Open. -> the dialog's node, gone.
    choose: async (s, o) => {
      const P = window.PARTS;
      const dlg = P.openDialog(o);
      await s.open('open', { title: 'Open', x: o.x || 300, y: o.y || 150, w: 860, h: 520, node: dlg });
      s.focus(dlg);
      await s.wait(700);
      await s.click(dlg.querySelector(`[data-file="${o.pick}"]`));
      P.choose(dlg, o.pick);
      await s.wait(400);
      await s.click(dlg.querySelector('[data-open]'));
      s.close('open');
      return dlg;
    },
  };
})();
