/* The screens on the site: each is the demo itself, drawn at the size of a
   laptop window and shrunk to fit the column, so every label stays where it
   is in the app. */
(() => {
  'use strict';
  const WIDE = 1180;
  document.querySelectorAll('.screen .frame').forEach((frame) => {
    const fit = () => frame.style.setProperty('--k', frame.clientWidth / WIDE);
    fit();
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(frame);
    else window.addEventListener('resize', fit);
  });
})();
