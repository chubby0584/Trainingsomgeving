/* Synchronisatie met Supabase.

   Uitgangspunt: de browseropslag blijft de werkkopie. De app reageert dus altijd direct
   en werkt zonder bereik; synchroniseren gebeurt op de achtergrond. Er wordt één
   momentopname (de hele staat) heen en weer gestuurd — eenvoudig te volgen, en genoeg
   voor één trainer met meerdere apparaten.

   Bij twijfel wordt er nooit stilzwijgend overschreven: als beide kanten gewijzigd zijn,
   krijgt de trainer de keuze. */

App.sync = (function () {
  const U = App.util, S = App.store;

  // Configuratie staat los van de teamgegevens, zodat het terugzetten van een back-up
  // de koppeling niet ongedaan maakt en een geëxporteerd bestand geen inloggegevens bevat.
  const CONFIG_SLEUTEL   = 'trainersomgeving-o17-sync-config';
  const BOEKHOUD_SLEUTEL = 'trainersomgeving-o17-sync-status';
  const APPARAAT_SLEUTEL = 'trainersomgeving-o17-apparaat';
  const TABEL = 'teamdata';

  let config = null;      // { url, sleutel, email, tokens: { access_token, refresh_token, verlooptOp } }
  let boekhouding = null; // { vuil, laatstGesyncteRemote, laatstGesyncedOp }
  let toestand = { staat: 'uit', bericht: '', bezig: false };
  let laatsteConflict = null; // volledige conflictgegevens, ook nog bereikbaar na een her-render
  const luisteraars = [];
  let duwTimer = null;
  let periodiek = null;

  /* ---------------------------- opslag van instellingen ---------------------------- */

  function leesJson(sleutel, standaard) {
    try {
      const ruw = localStorage.getItem(sleutel);
      return ruw ? JSON.parse(ruw) : standaard;
    } catch (e) { return standaard; }
  }

  function schrijfJson(sleutel, waarde) {
    try { localStorage.setItem(sleutel, JSON.stringify(waarde)); } catch (e) { console.warn(e); }
  }

  function getConfig() {
    if (!config) config = leesJson(CONFIG_SLEUTEL, { url: '', sleutel: '', email: '', tokens: null });
    return config;
  }

  function bewaarConfig() { schrijfJson(CONFIG_SLEUTEL, config); }

  function getBoekhouding() {
    if (!boekhouding) boekhouding = leesJson(BOEKHOUD_SLEUTEL, { vuil: false, laatstGesyncteRemote: null, laatstGesyncedOp: null });
    return boekhouding;
  }

  function bewaarBoekhouding() { schrijfJson(BOEKHOUD_SLEUTEL, boekhouding); }

  function apparaatNaam() {
    let naam = null;
    try { naam = localStorage.getItem(APPARAAT_SLEUTEL); } catch (e) { /* privémodus */ }
    if (!naam) {
      const ua = navigator.userAgent || '';
      const soort = /iPhone|Android.*Mobile/i.test(ua) ? 'telefoon'
        : (/iPad|Tablet/i.test(ua) ? 'tablet' : 'computer');
      naam = soort + '-' + Math.random().toString(36).slice(2, 6);
      try { localStorage.setItem(APPARAAT_SLEUTEL, naam); } catch (e) { /* niet kritiek */ }
    }
    return naam;
  }

  /* ---------------------------- toestand & melders ---------------------------- */

  function zetToestand(staat, bericht) {
    toestand = { staat, bericht: bericht || '', bezig: staat === 'bezig' };
    luisteraars.forEach(fn => fn(toestand));
  }

  function opWijziging(fn) { luisteraars.push(fn); }
  function getToestand() { return toestand; }

  function isIngesteld() {
    const c = getConfig();
    return !!(c.url && c.sleutel);
  }

  function isAangemeld() {
    const c = getConfig();
    return !!(c.tokens && c.tokens.refresh_token);
  }

  function beschrijving() {
    const b = getBoekhouding();
    if (!isIngesteld()) return 'Niet gekoppeld';
    if (!isAangemeld()) return 'Gekoppeld, nog niet aangemeld';
    if (toestand.staat === 'bezig') return 'Bezig met synchroniseren...';
    if (toestand.staat === 'offline') return 'Offline — wijzigingen wachten';
    if (toestand.staat === 'fout') return 'Fout: ' + toestand.bericht;
    if (toestand.staat === 'conflict') return 'Conflict — keuze nodig';
    if (b.vuil) return 'Wijzigingen nog niet verstuurd';
    if (b.laatstGesyncedOp) return 'Bijgewerkt ' + U.datumNL(b.laatstGesyncedOp.slice(0, 10)) + ' om ' + b.laatstGesyncedOp.slice(11, 16);
    return 'Klaar om te synchroniseren';
  }

  /* ---------------------------- netwerk ---------------------------- */

  function basisKoppen() {
    const c = getConfig();
    const koppen = { 'apikey': c.sleutel, 'Content-Type': 'application/json' };
    if (c.tokens && c.tokens.access_token) koppen['Authorization'] = 'Bearer ' + c.tokens.access_token;
    return koppen;
  }

  async function verzoek(pad, opties, alGeprobeerd) {
    const c = getConfig();
    const antwoord = await fetch(c.url.replace(/\/+$/, '') + pad, Object.assign({
      headers: basisKoppen()
    }, opties || {}));

    // Verlopen toegangstoken: één keer verversen en het verzoek herhalen.
    if (antwoord.status === 401 && !alGeprobeerd && c.tokens && c.tokens.refresh_token) {
      const vernieuwd = await ververshToken();
      if (vernieuwd) return verzoek(pad, opties, true);
    }
    return antwoord;
  }

  async function ververshToken() {
    const c = getConfig();
    try {
      const antwoord = await fetch(c.url.replace(/\/+$/, '') + '/auth/v1/token?grant_type=refresh_token', {
        method: 'POST',
        headers: { 'apikey': c.sleutel, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: c.tokens.refresh_token })
      });
      if (!antwoord.ok) {
        c.tokens = null;
        bewaarConfig();
        return false;
      }
      const data = await antwoord.json();
      bewaarTokens(data);
      return true;
    } catch (e) {
      return false; // netwerkprobleem, geen ongeldige aanmelding
    }
  }

  function bewaarTokens(data) {
    const c = getConfig();
    c.tokens = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      gebruikerId: data.user ? data.user.id : (c.tokens && c.tokens.gebruikerId)
    };
    if (data.user && data.user.email) c.email = data.user.email;
    bewaarConfig();
  }

  async function foutTekst(antwoord) {
    try {
      const data = await antwoord.json();
      return data.msg || data.message || data.error_description || data.error || ('HTTP ' + antwoord.status);
    } catch (e) { return 'HTTP ' + antwoord.status; }
  }

  /* ---------------------------- aanmelden ---------------------------- */

  async function koppel(url, sleutel) {
    config = getConfig();
    config.url = (url || '').trim();
    config.sleutel = (sleutel || '').trim();
    bewaarConfig();
    zetToestand(isAangemeld() ? 'klaar' : 'aanmelden', '');
    return true;
  }

  async function aanmelden(email, wachtwoord, registreren) {
    if (!isIngesteld()) throw new Error('Vul eerst de project-URL en de sleutel in.');
    zetToestand('bezig');
    const c = getConfig();
    const pad = registreren ? '/auth/v1/signup' : '/auth/v1/token?grant_type=password';
    let antwoord;
    try {
      antwoord = await fetch(c.url.replace(/\/+$/, '') + pad, {
        method: 'POST',
        headers: { 'apikey': c.sleutel, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: wachtwoord })
      });
    } catch (e) {
      zetToestand('offline');
      throw new Error('Geen verbinding met Supabase. Klopt de project-URL?');
    }

    if (!antwoord.ok) {
      const tekst = await foutTekst(antwoord);
      zetToestand('fout', tekst);
      throw new Error(tekst);
    }

    const data = await antwoord.json();
    if (!data.access_token) {
      // Supabase kan e-mailbevestiging vereisen; dan is er nog geen sessie.
      zetToestand('aanmelden', 'Bevestig eerst de e-mail die Supabase heeft gestuurd.');
      throw new Error('Account aangemaakt. Bevestig de e-mail van Supabase en meld je daarna aan.');
    }
    bewaarTokens(data);
    zetToestand('klaar');
    // Direct de eerste keer synchroniseren — anders blijft een nieuw aangemeld apparaat
    // met lege of eigen gegevens staan totdat er toevallig een lokale wijziging is.
    await synchroniseer(true);
    return true;
  }

  function afmelden() {
    const c = getConfig();
    c.tokens = null;
    bewaarConfig();
    laatsteConflict = null;
    zetToestand('aanmelden');
  }

  function ontkoppel() {
    config = { url: '', sleutel: '', email: '', tokens: null };
    bewaarConfig();
    boekhouding = { vuil: false, laatstGesyncteRemote: null, laatstGesyncedOp: null };
    bewaarBoekhouding();
    laatsteConflict = null;
    zetToestand('uit');
  }

  /* ---------------------------- synchroniseren ---------------------------- */

  async function haalRemote() {
    const antwoord = await verzoek('/rest/v1/' + TABEL + '?select=staat,gewijzigd_op,apparaat', { method: 'GET' });
    if (!antwoord.ok) throw new Error(await foutTekst(antwoord));
    const rijen = await antwoord.json();
    return rijen && rijen.length ? rijen[0] : null;
  }

  async function duwRemote(staat) {
    const c = getConfig();
    const gebruikerId = c.tokens && c.tokens.gebruikerId;
    if (!gebruikerId) throw new Error('Onbekende gebruiker — meld je opnieuw aan.');

    const rij = {
      gebruiker_id: gebruikerId,
      staat: staat,
      gewijzigd_op: staat.gewijzigdOp || new Date().toISOString(),
      apparaat: apparaatNaam()
    };
    const antwoord = await verzoek('/rest/v1/' + TABEL, {
      method: 'POST',
      headers: Object.assign(basisKoppen(), {
        'Prefer': 'resolution=merge-duplicates,return=representation'
      }),
      body: JSON.stringify(rij)
    });
    if (!antwoord.ok) throw new Error(await foutTekst(antwoord));
    const terug = await antwoord.json();
    return terug && terug.length ? terug[0] : rij;
  }

  // Kern van de synchronisatie. Geeft terug wat er gebeurd is, of vraagt om een keuze.
  async function synchroniseer(stil) {
    if (!isIngesteld() || !isAangemeld()) return { actie: 'overgeslagen' };
    if (toestand.bezig) return { actie: 'bezig' };

    const b = getBoekhouding();
    zetToestand('bezig');

    let remote;
    try {
      remote = await haalRemote();
    } catch (e) {
      const netwerkprobleem = e instanceof TypeError || /fetch|network|Failed/i.test(e.message);
      zetToestand(netwerkprobleem ? 'offline' : 'fout', e.message);
      if (!stil && !netwerkprobleem) U.toastFout('Synchroniseren mislukt: ' + e.message);
      return { actie: 'mislukt', fout: e.message };
    }

    const lokaal = S.get();

    try {
      // 1. Nog niets online: lokale gegevens zijn leidend.
      if (!remote) {
        const rij = await duwRemote(lokaal);
        markeerGesynct(rij.gewijzigd_op);
        laatsteConflict = null;
        zetToestand('klaar');
        if (!stil) U.toast('Gegevens staan nu online');
        return { actie: 'geduwd' };
      }

      const remoteVeranderd = remote.gewijzigd_op !== b.laatstGesyncteRemote;

      // 2. Online ongewijzigd sinds onze laatste synchronisatie.
      if (!remoteVeranderd) {
        if (!b.vuil) {
          laatsteConflict = null;
          zetToestand('klaar');
          return { actie: 'niets' };
        }
        const rij = await duwRemote(lokaal);
        markeerGesynct(rij.gewijzigd_op);
        laatsteConflict = null;
        zetToestand('klaar');
        if (!stil) U.toast('Wijzigingen verstuurd');
        return { actie: 'geduwd' };
      }

      // 3. Online gewijzigd, lokaal niet: overnemen.
      if (!b.vuil) {
        S.vervangStaat(remote.staat);
        markeerGesynct(remote.gewijzigd_op);
        laatsteConflict = null;
        zetToestand('klaar');
        if (!stil) U.toast('Nieuwste gegevens opgehaald');
        return { actie: 'opgehaald' };
      }

      // 4. Beide kanten gewijzigd: nooit stilzwijgend overschrijven. De volledige
      // conflictgegevens blijven bereikbaar via getConflict(), ook als de UI die net
      // op dit moment niet toont (bijv. een automatische sync op de achtergrond).
      laatsteConflict = {
        remote: remote,
        lokaalGewijzigd: lokaal.gewijzigdOp,
        remoteGewijzigd: remote.gewijzigd_op,
        remoteApparaat: remote.apparaat
      };
      zetToestand('conflict', 'Zowel dit apparaat als een ander apparaat heeft wijzigingen.');
      return Object.assign({ actie: 'conflict' }, laatsteConflict);

    } catch (e) {
      zetToestand('fout', e.message);
      if (!stil) U.toastFout('Synchroniseren mislukt: ' + e.message);
      return { actie: 'mislukt', fout: e.message };
    }
  }

  // Conflict oplossen met een expliciete keuze van de trainer. Zonder `remote` wordt de
  // laatst bekende conflictgegevens gebruikt, zodat de UI dit ook na een her-render kan
  // aanroepen zonder de data opnieuw te moeten doorgeven.
  async function losConflictOp(keuze, remote) {
    const gebruik = remote || (laatsteConflict && laatsteConflict.remote);
    if (keuze === 'remote' && !gebruik) {
      U.toastFout('De online versie is niet meer beschikbaar — probeer opnieuw te synchroniseren.');
      return false;
    }
    zetToestand('bezig');
    try {
      if (keuze === 'lokaal') {
        const rij = await duwRemote(S.get());
        markeerGesynct(rij.gewijzigd_op);
      } else {
        S.vervangStaat(gebruik.staat);
        markeerGesynct(gebruik.gewijzigd_op);
      }
      laatsteConflict = null;
      zetToestand('klaar');
      U.toast(keuze === 'lokaal' ? 'Dit apparaat is nu leidend' : 'Online versie overgenomen');
      return true;
    } catch (e) {
      zetToestand('fout', e.message);
      U.toastFout('Oplossen mislukt: ' + e.message);
      return false;
    }
  }

  function getConflict() { return laatsteConflict; }

  function markeerGesynct(remoteTijd) {
    boekhouding = getBoekhouding();
    boekhouding.vuil = false;
    boekhouding.laatstGesyncteRemote = remoteTijd;
    boekhouding.laatstGesyncedOp = new Date().toISOString();
    bewaarBoekhouding();
  }

  function markeerVuil() {
    boekhouding = getBoekhouding();
    if (!boekhouding.vuil) {
      boekhouding.vuil = true;
      bewaarBoekhouding();
    }
    luisteraars.forEach(fn => fn(toestand));
  }

  /* ---------------------------- automatisch ---------------------------- */

  // Na een wijziging even wachten: tijdens typen niet bij elke toetsaanslag versturen.
  function planDuw() {
    if (!isIngesteld() || !isAangemeld()) return;
    clearTimeout(duwTimer);
    duwTimer = setTimeout(() => { synchroniseer(true); }, 2500);
  }

  function start() {
    getConfig();
    getBoekhouding();

    if (!isIngesteld()) zetToestand('uit');
    else if (!isAangemeld()) zetToestand('aanmelden');
    else zetToestand('klaar');

    // Elke eigen wijziging markeert de gegevens als "nog te versturen". Een net
    // binnengehaalde versie (synchronisatie, herstel) is zelf al up-to-date en mag
    // niet meteen weer als "vuil" gelden — anders duwt de app terug wat ze net trok.
    S.opWijziging((_staat, stil) => {
      if (stil) return;
      markeerVuil();
      planDuw();
    });

    window.addEventListener('online', () => synchroniseer(true));
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) synchroniseer(true);
    });

    clearInterval(periodiek);
    periodiek = setInterval(() => synchroniseer(true), 5 * 60 * 1000);

    if (isIngesteld() && isAangemeld()) synchroniseer(true);
  }

  return {
    start, opWijziging, getToestand, beschrijving,
    isIngesteld, isAangemeld, getConfig,
    koppel, aanmelden, afmelden, ontkoppel,
    synchroniseer, losConflictOp, getConflict, apparaatNaam
  };
})();
