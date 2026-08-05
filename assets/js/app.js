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
        S.meldBackupGemaakt();
        werkSidebarBij();
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
    werkBackupStatusBij();
    werkSyncStatusBij();
  }

  // Korte samenvatting van de synchronisatiestatus, met een kleur die meteen laat zien
  // of er iets aandacht nodig heeft (fout, conflict) of dat alles gewoon bijgewerkt is.
  function werkSyncStatusBij() {
    const el = U.$('#syncInfo');
    if (!el || !App.sync) return;
    const t = App.sync.getToestand();
    el.textContent = (t.staat === 'uit' ? '☁︎ ' : (t.staat === 'conflict' || t.staat === 'fout' ? '⚠ ' : '')) + App.sync.beschrijving();
    el.style.color = (t.staat === 'conflict' || t.staat === 'fout') ? 'var(--gevaar)'
      : (t.staat === 'offline' ? 'var(--warn)' : 'var(--muted)');
  }

  // Toont hoe lang geleden de laatste back-up is gedownload — de enige echte
  // beveiliging tegen een gewiste browser of een verloren toestel.
  function werkBackupStatusBij() {
    const el = U.$('#backupInfo');
    if (!el) return;
    const datum = S.laatsteBackupDatum();
    if (!datum) {
      el.textContent = 'Nog geen back-up gemaakt';
      el.style.color = 'var(--gevaar)';
      return;
    }
    const dagen = -U.dagenTot(datum);
    el.textContent = dagen <= 0 ? 'Back-up van vandaag'
      : 'Laatste back-up: ' + dagen + ' dag' + (dagen === 1 ? '' : 'en') + ' geleden';
    el.style.color = dagen >= 14 ? 'var(--gevaar)' : (dagen >= 7 ? 'var(--warn)' : 'var(--muted)');
  }

  // Een leesfout bij het opstarten mag nooit onopgemerkt blijven: de onleesbare data
  // is al veiliggesteld door store.laad(), maar de trainer moet het kunnen zien en
  // desgewenst een kopie downloaden voordat er verder gewerkt wordt.
  function toonHerstelmeldingIndienNodig() {
    if (!S.herstelInfo()) return;
    const ruw = S.ruweHerstelData();
    const body = U.modal('De opgeslagen gegevens waren onleesbaar', `
      <p>De gegevens die eerder in deze browser stonden konden niet gelezen worden —
      mogelijk zijn ze beschadigd geraakt. Er is nu een lege omgeving gestart zodat je
      verder kunt werken.</p>
      <p><strong>Er is niets weggegooid.</strong> De oorspronkelijke, onleesbare data staat
      nog apart bewaard. Download 'm hieronder voor het geval er alsnog iets uit te
      herstellen valt.</p>
      <div class="modal-acties">
        ${ruw ? '<button class="btn" id="downloadHerstel">Onleesbare data downloaden</button>' : ''}
        <button class="btn btn-primair" id="herstelBegrepen">Begrepen, verdergaan</button>
      </div>`);
    if (ruw) {
      U.$('#downloadHerstel', body).addEventListener('click', () => {
        U.download('herstel-onleesbare-data-' + U.vandaag() + '.json', ruw);
      });
    }
    U.$('#herstelBegrepen', body).addEventListener('click', () => {
      S.wisHerstelmelding();
      U.sluitModal();
    });
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
    toonHerstelmeldingIndienNodig();

    if (App.sync) {
      App.sync.start();
      // Eén keer registreren: bij een statuswijziging altijd de zijbalk bijwerken, en de
      // instellingenpagina her-tekenen als die op dat moment open staat (bijv. na een
      // automatische sync op de achtergrond, of als daar een conflict uit rolt).
      App.sync.opWijziging(() => {
        werkSyncStatusBij();
        if (huidig.naam === 'instellingen') herteken(true);
      });
    }

    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('./sw.js').catch(e => console.warn('Service worker niet geregistreerd:', e));
    }
  }

  return { start, teken, herteken, werkSidebarBij, get huidig() { return huidig; } };
})();

document.addEventListener('DOMContentLoaded', App.router.start);
