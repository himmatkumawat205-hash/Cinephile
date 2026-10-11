(() => {
    'use strict';

    const loader = document.getElementById('cine-loader');
    const skip = document.getElementById('cine-loader-skip');
    if (!loader || !skip) return;

    // A missing stylesheet must never leave an unstyled intro over the page.
    if (getComputedStyle(loader).position !== 'fixed') return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const navigation = performance.getEntriesByType('navigation')[0];
    // Return visitors using Back should immediately see their restored page.
    if (navigation && navigation.type === 'back_forward') return;

    const startedAt = performance.now();
    const minimumDuration = reducedMotion.matches ? 0 : 1800;
    let dismissed = false;
    let content;
    let finishTimer;
    let fallbackTimer;


    function unlockContent() {
        document.documentElement.classList.remove('cine-is-loading');
        if (content) content.inert = false;
    }

    function dismiss(immediate = false) {
        if (dismissed) return;
        dismissed = true;
        window.clearTimeout(finishTimer);
        window.clearTimeout(fallbackTimer);
        window.removeEventListener('load', ready);
        document.removeEventListener('keydown', onKeyDown);

        const restoreFocus = loader.contains(document.activeElement);
        unlockContent();
        loader.classList.add('is-leaving');
        loader.inert = true;
        loader.setAttribute('aria-hidden', 'true');

        if (restoreFocus) {
            const homeLink = document.querySelector('.header .logo');
            if (homeLink) homeLink.focus({ preventScroll: true });
        }

        if (immediate || reducedMotion.matches) {
            loader.hidden = true;
        } else {
            window.setTimeout(() => { loader.hidden = true; }, 450);
        }
    }

    function ready() {
        finishTimer = window.setTimeout(
            () => dismiss(),
            Math.max(0, minimumDuration - (performance.now() - startedAt))
        );
    }

    function onKeyDown(event) {
        if (event.key === 'Escape') dismiss();
    }

    function prepareContent() {
        content = document.getElementById('site-content');
        if (content && !dismissed) content.inert = true;
    }

    skip.addEventListener('click', () => dismiss());
    document.addEventListener('keydown', onKeyDown);
    // Slow images or third-party resources must not trap visitors in the intro.
    fallbackTimer = window.setTimeout(() => dismiss(), 4500);
    window.addEventListener('pagehide', () => dismiss(true), { once: true });

    loader.hidden = false;
    document.documentElement.classList.add('cine-is-loading');

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', prepareContent, { once: true });
    } else {
        prepareContent();
    }

    if (document.readyState === 'complete') ready();
    else window.addEventListener('load', ready, { once: true });
})();
