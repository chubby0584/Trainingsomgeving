/* Opslag in de browser (localStorage) plus afgeleide berekeningen. */

App.store = (function () {

  const SLEUTEL = 'trainersomgeving-o17';
  let staat = null;
  const luisteraars = [];

  /* --- laden & bewaren --- */

  function laad() {
    try {
      const ruw = localStorage.getItem(SLEUTEL);
      staat = ruw ? migreer(JSON.parse(ruw)) : App.seed.nieuweStaat();
    } catch (e) {
      console.warn('Opgeslagen gegevens konden niet gelezen worden:', e);
      staat = App.seed.nieuweStaat();
    }
    return staat;
  }

  function migreer(data) {
    const basis = App.seed.nieuweStaat();
    const uit = Object.assign({}, basis, data);
    uit.team = Object.assign({}, basis.team, data.team || {});
    ['spelers', 'oefeningen', 'trainingen', 'wedstrijden'].forEach(k => {
      if (!Array.isArray(uit[k])) uit[k] = basis[k];
    });
    // Nieuwe basisoefeningen aanvullen zonder eigen oefeningen te raken.
    const bestaand = new Set(uit.oefeningen.map(o => o.id));
    basis.oefeningen.forEach(o => { if (!bestaand.has(o.id)) uit.oefeningen.push(o); });
    return uit;
  }

  function get() {
    if (!staat) laad();
    return staat;
  }

  function bewaar() {
    try {
      localStorage.setItem(SLEUTEL, JSON.stringify(staat));
    } catch (e) {
      App.util.toast('Opslaan mislukt — opslagruimte vol?');
      console.error(e);
    }
    luisteraars.forEach(fn => fn(staat));
  }

  // Wijzig de staat en sla direct op.
  function wijzig(fn) {
    fn(get());
    bewaar();
  }

  function opWijziging(fn) { luisteraars.push(fn); }

  function opslagGrootte() {
    try {
      return Math.round((localStorage.getItem(SLEUTEL) || '').length / 1024);
    } catch (e) { return 0; }
  }

  function importeer(json) {
    const data = JSON.parse(json);
    if (!data || typeof data !== 'object') throw new Error('Onbekend bestandsformaat');
    staat = migreer(data);
    bewaar();
  }

  function wisAlles() {
    staat = App.seed.nieuweStaat();
    bewaar();
  }

  /* --- opzoeken --- */

  function speler(id) { return get().spelers.find(s => s.id === id) || null; }
  function training(id) { return get().trainingen.find(t => t.id === id) || null; }
  function wedstrijd(id) { return get().wedstrijden.find(w => w.id === id) || null; }
  function oefening(id) { return get().oefeningen.find(o => o.id === id) || null; }

  function spelersGesorteerd() {
    return get().spelers.slice().sort((a, b) => {
      const na = a.rugnummer === null || a.rugnummer === undefined || a.rugnummer === '';
      const nb = b.rugnummer === null || b.rugnummer === undefined || b.rugnummer === '';
      if (na !== nb) return na ? 1 : -1;
      if (!na && Number(a.rugnummer) !== Number(b.rugnummer)) return Number(a.rugnummer) - Number(b.rugnummer);
      return App.util.naam(a).localeCompare(App.util.naam(b));
    });
  }

  function trainingenGesorteerd() {
    return get().trainingen.slice().sort(App.util.opDatum);
  }

  function wedstrijdenGesorteerd() {
    return get().wedstrijden.slice().sort(App.util.opDatum);
  }

  /* --- nieuwe objecten --- */

  function nieuweSpeler(velden) {
    return Object.assign({
      id: App.util.uid('sp'),
      voornaam: '', achternaam: '', rugnummer: null, geboortedatum: '',
      posities: [], been: 'rechts', status: 'fit', statusToelichting: '',
      lengte: null, gewicht: null, telefoon: '', contactOuder: '',
      sterktes: '', ontwikkelpunten: '',
      beoordelingen: [], doelen: [], notities: []
    }, velden || {});
  }

  function nieuweTraining(velden) {
    return Object.assign({
      id: App.util.uid('tr'),
      datum: App.util.vandaag(), tijd: '19:00', locatie: '',
      thema: '', doel: '', belasting: 3,
      blokken: [], aanwezigheid: {}, evaluatie: ''
    }, velden || {});
  }

  function nieuweWedstrijd(velden) {
    return Object.assign({
      id: App.util.uid('wd'),
      datum: App.util.vandaag(), tijd: '14:30', tegenstander: '', thuis: true,
      soort: 'competitie', locatie: '', verzameltijd: '',
      formatie: get().team.formatie || '1-4-3-3',
      opstelling: {}, bank: [],
      scouting: { speelwijze: '', sterktes: '', zwaktes: '', standaard: '', spelers: '' },
      plan: { balbezit: '', balverlies: '', omschakeling: '', standaard: '' },
      gespeeld: false, doelpuntenVoor: null, doelpuntenTegen: null,
      minuten: {}, rapporten: {}, evaluatie: ''
    }, velden || {});
  }

  function nieuweOefening(velden) {
    return Object.assign({
      id: App.util.uid('oef'), eigen: true,
      naam: '', categorie: 'Passing & positiespel', thema: [],
      duur: 15, spelers: '', veld: '', organisatie: '',
      coachpunten: [], variaties: []
    }, velden || {});
  }

  /* ---------------------------------------------------------------
     Afgeleide gegevens
  --------------------------------------------------------------- */

  // Gemiddelde per TIPS-pijler voor één beoordeling.
  function pijlerScores(beoordeling) {
    const uit = {};
    App.seed.TIPS.forEach(pijler => {
      const waarden = pijler.criteria
        .map(c => beoordeling.scores && beoordeling.scores[pijler.sleutel + '.' + c.sleutel])
        .filter(n => typeof n === 'number' && n > 0);
      uit[pijler.sleutel] = waarden.length ? App.util.gemiddelde(waarden) : null;
    });
    return uit;
  }

  function beoordelingenGesorteerd(sp) {
    return (sp.beoordelingen || []).slice().sort(App.util.opDatum);
  }

  function laatsteBeoordeling(sp) {
    const lijst = beoordelingenGesorteerd(sp);
    return lijst.length ? lijst[lijst.length - 1] : null;
  }

  // Totaalgemiddelde van de laatste beoordeling (of null).
  function huidigNiveau(sp) {
    const b = laatsteBeoordeling(sp);
    if (!b) return null;
    const scores = pijlerScores(b);
    return App.util.gemiddelde(Object.values(scores).filter(n => n !== null));
  }

  // Verschil met de vorige beoordeling, per pijler en totaal.
  function ontwikkeling(sp) {
    const lijst = beoordelingenGesorteerd(sp);
    if (lijst.length < 2) return null;
    const nieuw = pijlerScores(lijst[lijst.length - 1]);
    const oud   = pijlerScores(lijst[lijst.length - 2]);
    const perPijler = {};
    App.seed.TIPS.forEach(p => {
      perPijler[p.sleutel] = (nieuw[p.sleutel] !== null && oud[p.sleutel] !== null)
        ? nieuw[p.sleutel] - oud[p.sleutel] : null;
    });
    const totaalNieuw = App.util.gemiddelde(Object.values(nieuw).filter(n => n !== null));
    const totaalOud   = App.util.gemiddelde(Object.values(oud).filter(n => n !== null));
    return {
      perPijler,
      totaal: (totaalNieuw !== null && totaalOud !== null) ? totaalNieuw - totaalOud : null
    };
  }

  // Aanwezigheid over alle trainingen tot vandaag.
  function aanwezigheidStats(spelerId) {
    const trainingen = get().trainingen.filter(t => t.datum <= App.util.vandaag());
    let aanwezig = 0, geteld = 0, afwezig = 0, blessure = 0;
    trainingen.forEach(t => {
      const status = t.aanwezigheid && t.aanwezigheid[spelerId];
      if (!status) return;
      geteld++;
      if (status === 'aanwezig' || status === 'laat') aanwezig++;
      else if (status === 'blessure') blessure++;
      else afwezig++;
    });
    return {
      aanwezig, afwezig, blessure, geteld,
      percentage: geteld ? Math.round(aanwezig / geteld * 100) : null
    };
  }

  // Speelminuten en wedstrijdaantallen.
  function speelStats(spelerId) {
    const gespeeld = get().wedstrijden.filter(w => w.gespeeld);
    let minuten = 0, basis = 0, invaller = 0, wedstrijden = 0;
    gespeeld.forEach(w => {
      const m = Number((w.minuten || {})[spelerId] || 0);
      if (m > 0) {
        minuten += m;
        wedstrijden++;
        const inBasis = Object.values(w.opstelling || {}).indexOf(spelerId) !== -1;
        if (inBasis) basis++; else invaller++;
      }
    });
    return { minuten, wedstrijden, basis, invaller, mogelijk: gespeeld.length * 80 };
  }

  // Gemiddeld wedstrijdcijfer.
  function gemiddeldCijfer(spelerId) {
    const cijfers = get().wedstrijden
      .map(w => (w.rapporten || {})[spelerId])
      .filter(r => r && typeof r.cijfer === 'number')
      .map(r => r.cijfer);
    return cijfers.length ? App.util.gemiddelde(cijfers) : null;
  }

  function openDoelen(sp) {
    return (sp.doelen || []).filter(d => d.status !== 'behaald' && d.status !== 'vervallen');
  }

  function eerstvolgende(lijst) {
    const vandaag = App.util.vandaag();
    return lijst.filter(x => x.datum >= vandaag).sort(App.util.opDatum)[0] || null;
  }

  function duurTraining(t) {
    return (t.blokken || []).reduce((som, b) => som + (Number(b.duur) || 0), 0);
  }

  return {
    laad, get, bewaar, wijzig, opWijziging, importeer, wisAlles, opslagGrootte,
    speler, training, wedstrijd, oefening,
    spelersGesorteerd, trainingenGesorteerd, wedstrijdenGesorteerd,
    nieuweSpeler, nieuweTraining, nieuweWedstrijd, nieuweOefening,
    pijlerScores, beoordelingenGesorteerd, laatsteBeoordeling, huidigNiveau, ontwikkeling,
    aanwezigheidStats, speelStats, gemiddeldCijfer, openDoelen, eerstvolgende, duurTraining
  };
})();
