/* Router, event-afhandeling en opstart. */

App.router = (function () {
  const U = App.util, S = App.store;

  let huidig = { naam: 'dashboard', id: null };
  let acties = {};

  /* --- alle acties van de views samenvoegen tot één register --- */

  function bouwActies() {
    acties = {
      'modal-close': () => U.sluitModal(),
      'export-json': () => {
        const naam = 'trainersomgeving-' + (S.get().team.naam || 'team').replace(/\s+/g, '-').toLowerCase() + '-' + U.vandaag() + '.json';
        U.download(naam, JSON.stringify(S.get(), null, 2));
        U.toast('Back-up gedownload');
      }
    };
    Object.keys(App.views).forEach(naam => {
      const view = App.views[naam];
      Object.assign(acties, view.acties || {});
    });
  }

  /* --- routing --- */

  function leesRoute() {
    const stuk = (location.hash || '#/dashboard').replace(/^#\/?/, '');
    const delen = stuk.split('/').filter(Boolean);
    return { naam: delen[0] || 'dashboard', id: delen[1] || null };
  }

  function teken() {
    const route = leesRoute();
    huidig = route;

    const view = App.views[route.naam] || App.views.dashboard;
    const root = U.$('#view');

    try {
      root.innerHTML = view.render(route.id);
    } catch (e) {
      console.error('Fout bij het tekenen van "' + route.naam + '":', e);
      root.innerHTML = `<div class="leeg">Er ging iets mis bij het tonen van deze pagina.
        Kijk in de console voor details, of ga terug naar het <a href="#/dashboard">dashboard</a>.</div>`;
      return;
    }

    if (typeof view.na === 'function') view.na(route.id);
    markeerNav(route.naam);
  }

  // Opnieuw tekenen zonder de scrollpositie te verliezen.
  function herteken(behoudScroll) {
    const y = behoudScroll ? window.scrollY : 0;
    teken();
    if (behoudScroll) window.scrollTo(0, y);
  }

  function markeerNav(naam) {
    // Detailpagina's horen bij hun overzicht (speler → spelers).
    const groep = { speler: 'spelers', training: 'trainingen', wedstrijd: 'wedstrijden' }[naam] || naam;
    U.$$('.nav a').forEach(a => a.classList.toggle('actief', a.dataset.nav === groep));
  }

  function werkSidebarBij() {
    const team = S.get().team;
    U.$('#brandTeam').textContent = team.naam || 'Team';
    U.$('#brandSeizoen').textContent = team.seizoen || '';
    U.$('#opslagInfo').textContent = S.opslagGrootte() + ' kB opgeslagen';
  }

  /* --- events --- */

  function voerActieUit(el, gebeurtenis) {
    const naam = el.dataset.actie;
    const fn = acties[naam];
    if (!fn) { console.warn('Onbekende actie:', naam); return; }
    gebeurtenis.preventDefault();
    fn(el, gebeurtenis);
  }

  function koppelEvents() {
    document.addEventListener('click', (e) => {
      const el = e.target.closest('[data-actie]');
      // Selects reageren op 'change', anders lees je de oude waarde uit.
      if (!el || el.tagName === 'SELECT') return;
      voerActieUit(el, e);
    });

    document.addEventListener('change', (e) => {
      const el = e.target.closest('[data-actie]');
      if (!el || el.tagName !== 'SELECT') return;
      voerActieUit(el, e);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !U.$('#modalBackdrop').hidden) U.sluitModal();
    });

    U.$('#modalBackdrop').addEventListener('click', (e) => {
      if (e.target.id === 'modalBackdrop') U.sluitModal();
    });

    window.addEventListener('hashchange', () => { U.sluitModal(); teken(); });
  }

  function start() {
    S.laad();
    bouwActies();
    koppelEvents();
    S.opWijziging(werkSidebarBij);
    werkSidebarBij();
    if (!location.hash) location.hash = '#/dashboard';
    teken();
  }

  return { start, teken, herteken, werkSidebarBij, get huidig() { return huidig; } };
})();

document.addEventListener('DOMContentLoaded', App.router.start);
