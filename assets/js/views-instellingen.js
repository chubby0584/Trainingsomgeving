/* Instellingen: teamgegevens, back-up, export, synchronisatie en opschonen. */

(function () {
  const U = App.util, S = App.store;

  // Eenmalig door de trainer uit te voeren in de Supabase SQL Editor. Eén rij per
  // gebruiker (gebruiker_id is de primaire sleutel), met rijbeveiliging zodat elk
  // account uitsluitend de eigen rij kan lezen en schrijven.
  const SETUP_SQL = `create table public.teamdata (
  gebruiker_id uuid primary key references auth.users(id) default auth.uid(),
  staat jsonb not null,
  gewijzigd_op timestamptz not null default now(),
  apparaat text
);

alter table public.teamdata enable row level security;

create policy "eigen rij lezen" on public.teamdata
  for select using (auth.uid() = gebruiker_id);

create policy "eigen rij invoegen" on public.teamdata
  for insert with check (auth.uid() = gebruiker_id);

create policy "eigen rij bijwerken" on public.teamdata
  for update using (auth.uid() = gebruiker_id) with check (auth.uid() = gebruiker_id);`;

  function render() {
    const staat = S.get();
    const t = staat.team;

    return `
      <div class="paginakop"><div>
        <h1>Instellingen</h1>
        <div class="sub">Teamgegevens, back-up en export</div>
      </div></div>

      <div class="grid grid-2">
        <div class="paneel">
          <h2>Team</h2>
          <div class="veld-rij">
            <label class="veld"><span>Teamnaam</span><input name="naam" value="${U.esc(t.naam)}"></label>
            <label class="veld"><span>Club</span><input name="club" value="${U.esc(t.club)}"></label>
          </div>
          <div class="veld-rij">
            <label class="veld"><span>Seizoen</span><input name="seizoen" value="${U.esc(t.seizoen)}"></label>
            <label class="veld"><span>Trainer</span><input name="trainer" value="${U.esc(t.trainer)}"></label>
          </div>
          <div class="veld-rij">
            <label class="veld"><span>Standaardformatie</span>
              <select name="formatie">${U.selectOpties(Object.keys(App.seed.FORMATIES), t.formatie)}</select>
            </label>
            <label class="veld"><span>Wedstrijddag</span><input name="wedstrijddag" value="${U.esc(t.wedstrijddag)}"></label>
          </div>
          <label class="veld"><span>Trainingsdagen</span><input name="trainingsdagen" value="${U.esc(t.trainingsdagen)}" placeholder="dinsdag, donderdag"></label>
          <label class="veld"><span>Speelwijze en teamafspraken</span>
            <textarea name="speelwijze" rows="5" placeholder="Hoe wil je dat dit team speelt? Wat zijn de vaste afspraken in balbezit, balverlies en omschakeling?">${U.esc(t.speelwijze)}</textarea>
          </label>
          <div class="rij"><button class="btn btn-primair" data-actie="team-opslaan">Opslaan</button></div>
        </div>

        <div>
          ${synchronisatiePaneel()}
          ${betrouwbaarheidPaneel()}

          <div class="paneel mb">
            <h2>Back-up en overzetten</h2>
            <p class="klein muted">Alles staat in de opslag van deze browser — niet in de cloud. Maak regelmatig een back-up,
            zeker voordat je van computer wisselt of je browsergegevens wist.</p>
            <div class="rij">
              <button class="btn btn-primair" data-actie="export-json">Back-up downloaden</button>
              <button class="btn" data-actie="import-json">Back-up terugzetten</button>
            </div>
            <input type="file" id="importBestand" accept="application/json,.json" hidden>
            <p class="klein muted mt">Huidige omvang: ${S.opslagGrootte()} kB</p>
          </div>

          <div class="paneel mb">
            <h2>Exporteren</h2>
            <p class="klein muted">Voor de teamevaluatie, het spelersvolgsysteem van de club of een gesprek met ouders.</p>
            <div class="rij">
              <button class="btn" data-actie="export-spelers-csv">Spelersoverzicht (CSV)</button>
              <button class="btn" data-actie="export-rapport">Seizoensrapport (afdrukbaar)</button>
            </div>
          </div>

          <div class="paneel">
            <h2>Opschonen</h2>
            <p class="klein muted">Hiermee verdwijnen alle spelers, trainingen, wedstrijden en eigen oefeningen.
            Maak eerst een back-up.</p>
            <button class="btn btn-gevaar" data-actie="alles-wissen">Alles wissen</button>
          </div>
        </div>
      </div>

      <div class="paneel mt">
        <h2>Zo is dit bedoeld</h2>
        <div class="grid grid-3 klein" style="line-height:1.7">
          <div>
            <strong>Beoordelen doe je in stappen</strong><br>
            Leg aan het begin van het seizoen een nulmeting vast en herhaal die drie tot vier keer.
            De grafiek per pijler laat zien of een speler écht groeit of alleen ouder wordt.
          </div>
          <div>
            <strong>Twee doelen tegelijk</strong><br>
            Meer dan twee of drie ontwikkeldoelen per speler werkt niet. Formuleer ze in zichtbaar gedrag
            en spreek een evaluatiedatum af — die komt automatisch terug op je dashboard.
          </div>
          <div>
            <strong>Speeltijd is ontwikkeltijd</strong><br>
            Het speelminutenoverzicht laat zien wie structureel weinig speelt. In de jeugd is dat een
            ontwikkelvraag, geen prestatievraag.
          </div>
        </div>
      </div>`;
  }

  // Drie stappen: project koppelen, aanmelden, en — als je op meerdere apparaten werkt
  // en beide een wijziging hebben — een keuze maken. Nergens wordt automatisch de ene
  // versie boven de andere gekozen.
  function synchronisatiePaneel() {
    if (!App.sync) return '';
    const c = App.sync.getConfig();
    const t = App.sync.getToestand();

    if (!App.sync.isIngesteld()) {
      return `<div class="paneel mb">
        <h2>Online synchronisatie</h2>
        <p class="klein muted">Optioneel: koppel een gratis Supabase-project zodat dezelfde gegevens op
        je telefoon én je computer staan, met een kopie die niet in deze browser zit. De app blijft
        gewoon direct reageren en werkt zonder bereik — er wordt alleen op de achtergrond
        gesynchroniseerd zodra er verbinding is.</p>
        <details class="klein" style="margin:.6rem 0 1rem">
          <summary style="cursor:pointer;color:var(--info)">Hoe zet ik dit op? (eenmalig, een paar minuten)</summary>
          <ol style="padding-left:1.2rem;line-height:1.9;margin:.6rem 0">
            <li>Maak gratis een project op <a href="https://supabase.com" target="_blank" rel="noopener">supabase.com</a>.</li>
            <li>Ga naar <strong>Project Settings → API</strong> en kopieer de <strong>Project URL</strong>
              en de <strong>anon public</strong>-sleutel.</li>
            <li>Ga naar <strong>SQL Editor</strong>, plak onderstaande SQL en klik <strong>Run</strong> —
              dit maakt de tabel aan waar je gegevens in komen, met toegang die uitsluitend voor
              jouw eigen account geldt.</li>
            <li>Vul hieronder de URL en de sleutel in en klik op <strong>Koppelen</strong>. Daarna kun
              je meteen een account aanmaken.</li>
          </ol>
          <div class="tabel-wrap"><pre style="background:var(--bg-2);border:1px solid var(--line);border-radius:8px;padding:.7rem;font-size:.78rem;line-height:1.5;white-space:pre">${U.esc(SETUP_SQL)}</pre></div>
        </details>
        <div class="veld-rij">
          <label class="veld"><span>Project-URL</span><input id="syncUrl" placeholder="https://xxxx.supabase.co" value="${U.esc(c.url)}"></label>
          <label class="veld"><span>Anon public-sleutel</span><input id="syncSleutel" placeholder="eyJ..." value="${U.esc(c.sleutel)}"></label>
        </div>
        <button class="btn btn-primair" data-actie="sync-koppelen">Koppelen</button>
      </div>`;
    }

    if (!App.sync.isAangemeld()) {
      const foutmelding = (t.staat === 'aanmelden' || t.staat === 'fout') && t.bericht ? t.bericht : '';
      return `<div class="paneel mb">
        <h2>Online synchronisatie</h2>
        <p class="klein muted">Gekoppeld aan <code>${U.esc(c.url)}</code>. Meld je aan met een e-mailadres
        en wachtwoord — hoeft geen bestaand account te zijn, de eerste keer maak je er meteen een aan.</p>
        ${foutmelding ? `<p class="klein" style="color:var(--warn)">${U.esc(foutmelding)}</p>` : ''}
        <div class="veld-rij">
          <label class="veld"><span>E-mailadres</span><input type="email" id="syncEmail" value="${U.esc(c.email || '')}"></label>
          <label class="veld"><span>Wachtwoord</span><input type="password" id="syncWachtwoord"></label>
        </div>
        <div class="rij">
          <button class="btn btn-primair" data-actie="sync-aanmelden" ${t.bezig ? 'disabled' : ''}>Aanmelden</button>
          <button class="btn" data-actie="sync-registreren" ${t.bezig ? 'disabled' : ''}>Nieuw account aanmaken</button>
          <button class="btn btn-ghost btn-sm" data-actie="sync-ontkoppelen">Andere gegevens invullen</button>
        </div>
      </div>`;
    }

    const conflict = t.staat === 'conflict' ? App.sync.getConflict() : null;
    const statusKlasse = (t.staat === 'conflict' || t.staat === 'fout') ? 'rood' : (t.staat === 'offline' ? 'geel' : 'groen');

    return `<div class="paneel mb">
      <div class="paneel-kop">
        <h2>Online synchronisatie</h2>
        <span class="badge ${statusKlasse}">${U.esc(App.sync.beschrijving())}</span>
      </div>
      <p class="klein muted">Aangemeld als ${U.esc(c.email || '')} · dit apparaat heet "${U.esc(App.sync.apparaatNaam())}".</p>

      ${conflict ? `
        <div class="paneel" style="border-color:var(--gevaar);margin:.7rem 0">
          <h3 style="color:var(--gevaar)">Twee versies — kies welke blijft staan</h3>
          <p class="klein">Dit apparaat én "<strong>${U.esc(conflict.remoteApparaat || 'een ander apparaat')}</strong>"
          hebben allebei wijzigingen die nog niet gedeeld zijn. De versie die je niet kiest, gaat verloren.
          Twijfel je? Maak dan eerst een back-up van dit apparaat.</p>
          <div class="rij mt">
            <button class="btn btn-sm" data-actie="export-json">Eerst back-up van dit apparaat</button>
          </div>
          <div class="veld-rij mt">
            <button class="btn btn-primair" data-actie="sync-conflict-lokaal">Dit apparaat bewaren</button>
            <button class="btn" data-actie="sync-conflict-remote">"${U.esc(conflict.remoteApparaat || 'Ander apparaat')}" bewaren</button>
          </div>
        </div>` : ''}

      <div class="rij mt">
        <button class="btn btn-primair" data-actie="sync-nu" ${t.bezig ? 'disabled' : ''}>${t.bezig ? 'Bezig...' : 'Nu synchroniseren'}</button>
        <button class="btn" data-actie="sync-afmelden">Afmelden</button>
        <button class="btn btn-gevaar btn-sm" data-actie="sync-ontkoppelen">Loskoppelen</button>
      </div>
    </div>`;
  }

  // Laat zien hoe lang geleden de laatste back-up is, en biedt een vangnet van één stap
  // terug voor als er per ongeluk iets fout is gegaan bij een opslagactie.
  function betrouwbaarheidPaneel() {
    const datum = S.laatsteBackupDatum();
    let statusTekst, statusKlasse;
    if (!datum) {
      statusTekst = 'Nog geen back-up gemaakt';
      statusKlasse = 'rood';
    } else {
      const dagen = -U.dagenTot(datum);
      statusTekst = dagen <= 0 ? 'Vandaag een back-up gemaakt' : dagen + ' dag' + (dagen === 1 ? '' : 'en') + ' geleden een back-up gemaakt';
      statusKlasse = dagen >= 14 ? 'rood' : (dagen >= 7 ? 'geel' : 'groen');
    }

    return `<div class="paneel mb">
      <h2>Betrouwbaarheid van je gegevens</h2>
      <p class="klein muted">Alles staat alleen lokaal in deze browser. Er is geen cloud-kopie —
      een back-up downloaden is de enige manier om gegevens veilig te stellen tegen een gewiste
      browser, een kapot toestel of een overstap naar een andere computer of telefoon.</p>
      <div class="rij-tussen" style="padding:.3rem 0">
        <span class="klein">Status</span>
        <span class="badge ${statusKlasse}">${U.esc(statusTekst)}</span>
      </div>
      ${S.heeftVorigeVersie() ? `
        <div class="rij-tussen mt" style="padding-top:.6rem;border-top:1px solid var(--line)">
          <span class="klein muted">Vangnet: de versie van vóór je laatste opslagactie is nog bewaard.</span>
          <button class="btn btn-sm" data-actie="versie-herstellen">Vorige versie terugzetten</button>
        </div>` : ''}
    </div>`;
  }

  function na() {
    const bestand = U.$('#importBestand');
    if (!bestand) return;
    bestand.addEventListener('change', () => {
      const f = bestand.files[0];
      if (!f) return;
      const lezer = new FileReader();
      lezer.onload = () => {
        try {
          if (S.importeer(lezer.result)) {
            U.toast('Back-up teruggezet');
          } else {
            U.toastFout('Gelezen, maar niet opgeslagen — opslagruimte vol?');
          }
          App.router.herteken(true);
        } catch (e) {
          U.toast('Bestand kon niet gelezen worden — is dit een back-up van deze omgeving?');
          console.error(e);
        }
      };
      lezer.readAsText(f);
    });
  }

  function csvVeld(waarde) {
    const s = waarde === null || waarde === undefined ? '' : String(waarde);
    return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function exportSpelersCsv() {
    const koppen = ['Rugnummer', 'Voornaam', 'Achternaam', 'Geboortedatum', 'Leeftijd', 'Posities', 'Been', 'Status']
      .concat(App.seed.TIPS.map(p => p.label))
      .concat(['Totaal', 'Aanwezigheid %', 'Speelminuten', 'Wedstrijden', 'Gem. cijfer', 'Open doelen']);

    const regels = S.spelersGesorteerd().map(sp => {
      const laatste = S.laatsteBeoordeling(sp);
      const scores = laatste ? S.pijlerScores(laatste) : {};
      const aanw = S.aanwezigheidStats(sp.id);
      const speel = S.speelStats(sp.id);
      const cijfer = S.gemiddeldCijfer(sp.id);
      const niveau = S.huidigNiveau(sp);

      return [
        sp.rugnummer, sp.voornaam, sp.achternaam, sp.geboortedatum,
        U.leeftijd(sp.geboortedatum), (sp.posities || []).join(' / '), sp.been, sp.status
      ].concat(App.seed.TIPS.map(p => scores[p.sleutel] !== null && scores[p.sleutel] !== undefined ? U.rond(scores[p.sleutel], 1) : ''))
       .concat([
         niveau !== null ? U.rond(niveau, 1) : '',
         aanw.percentage !== null ? aanw.percentage : '',
         speel.minuten, speel.wedstrijden,
         cijfer !== null ? U.rond(cijfer, 1) : '',
         S.openDoelen(sp).length
       ]).map(csvVeld).join(';');
    });

    const csv = '﻿' + [koppen.map(csvVeld).join(';')].concat(regels).join('\r\n');
    U.download('spelersoverzicht-' + U.vandaag() + '.csv', csv, 'text/csv;charset=utf-8');
    U.toast('CSV gedownload');
  }

  // Afdrukbaar seizoensrapport per speler, in een apart venster.
  function exportRapport() {
    const staat = S.get();
    const spelers = S.spelersGesorteerd();
    if (!spelers.length) { U.toast('Nog geen spelers om te rapporteren.'); return; }

    const blokken = spelers.map(sp => {
      const laatste = S.laatsteBeoordeling(sp);
      const scores = laatste ? S.pijlerScores(laatste) : {};
      const aanw = S.aanwezigheidStats(sp.id);
      const speel = S.speelStats(sp.id);
      const doelen = (sp.doelen || []);

      const pijlerRegels = App.seed.TIPS.map(p => {
        const w = scores[p.sleutel];
        return `<tr><td>${U.esc(p.label)}</td><td>${w !== null && w !== undefined ? U.rond(w, 1) : '–'}</td></tr>`;
      }).join('');

      const doelRegels = doelen.length ? doelen.map(d =>
        `<li><strong>${U.esc(d.titel)}</strong> (${U.esc(d.status)}, evaluatie ${U.datumNL(d.deadline)})
         ${d.evaluatie ? '<br><em>' + U.esc(d.evaluatie) + '</em>' : ''}</li>`).join('') : '<li>Geen doelen vastgelegd.</li>';

      return `<section>
        <h2>${U.esc(U.naam(sp))} ${sp.rugnummer ? '#' + U.esc(sp.rugnummer) : ''}</h2>
        <p class="meta">${(sp.posities || []).join(', ')} · ${U.leeftijd(sp.geboortedatum) !== null ? U.leeftijd(sp.geboortedatum) + ' jaar' : ''} ·
        ${speel.minuten} speelminuten in ${speel.wedstrijden} wedstrijden ·
        aanwezigheid ${aanw.percentage !== null ? aanw.percentage + '%' : 'n.v.t.'}</p>
        <table><tbody>${pijlerRegels}</tbody></table>
        ${sp.sterktes ? `<p><strong>Sterke punten:</strong> ${U.esc(sp.sterktes)}</p>` : ''}
        ${sp.ontwikkelpunten ? `<p><strong>Ontwikkelpunten:</strong> ${U.esc(sp.ontwikkelpunten)}</p>` : ''}
        ${laatste && laatste.toelichting ? `<p><strong>Toelichting (${U.datumNL(laatste.datum)}):</strong> ${U.esc(laatste.toelichting)}</p>` : ''}
        <p><strong>Ontwikkelplan</strong></p><ul>${doelRegels}</ul>
      </section>`;
    }).join('');

    const html = `<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8">
      <title>Seizoensrapport ${U.esc(staat.team.naam)} ${U.esc(staat.team.seizoen)}</title>
      <style>
        body { font: 12pt/1.5 Georgia, serif; max-width: 820px; margin: 2rem auto; padding: 0 1rem; color:#111; }
        h1 { border-bottom: 2px solid #111; padding-bottom: .3rem; }
        section { page-break-inside: avoid; border-bottom: 1px solid #ccc; padding-bottom: 1rem; margin-bottom: 1.4rem; }
        h2 { margin-bottom: .2rem; }
        .meta { color: #555; font-size: 10pt; margin-top: 0; }
        table { border-collapse: collapse; margin: .6rem 0; }
        td { border: 1px solid #ccc; padding: .2rem .6rem; font-size: 10pt; }
        ul { margin: .3rem 0 0; }
      </style></head><body>
      <h1>Seizoensrapport ${U.esc(staat.team.naam)} — ${U.esc(staat.team.seizoen)}</h1>
      <p class="meta">${U.esc(staat.team.club)} ${staat.team.trainer ? '· trainer ' + U.esc(staat.team.trainer) : ''} · opgemaakt ${U.datumNL(U.vandaag())}</p>
      ${blokken}
      </body></html>`;

    const venster = window.open('', '_blank');
    if (!venster) {
      U.download('seizoensrapport-' + U.vandaag() + '.html', html, 'text/html');
      U.toast('Pop-up geblokkeerd — rapport is gedownload');
      return;
    }
    venster.document.write(html);
    venster.document.close();
  }

  const acties = {
    'team-opslaan': () => {
      const data = U.formData(U.$('#view'));
      if (S.wijzig(st => { Object.assign(st.team, data); })) U.toast('Teamgegevens opgeslagen');
      App.router.werkSidebarBij();
    },
    'import-json': () => U.$('#importBestand').click(),
    'export-spelers-csv': () => exportSpelersCsv(),
    'export-rapport': () => exportRapport(),

    'sync-koppelen': async () => {
      const url = U.$('#syncUrl').value.trim();
      const sleutel = U.$('#syncSleutel').value.trim();
      if (!url || !sleutel) { U.toast('Vul de project-URL en de sleutel in.'); return; }
      await App.sync.koppel(url, sleutel);
      App.router.herteken(true);
    },
    'sync-aanmelden': async () => {
      const email = U.$('#syncEmail').value.trim();
      const ww = U.$('#syncWachtwoord').value;
      if (!email || !ww) { U.toast('Vul e-mailadres en wachtwoord in.'); return; }
      try { await App.sync.aanmelden(email, ww, false); }
      catch (e) { /* de foutmelding staat al in de synchronisatiestatus */ }
      App.router.herteken(true);
    },
    'sync-registreren': async () => {
      const email = U.$('#syncEmail').value.trim();
      const ww = U.$('#syncWachtwoord').value;
      if (!email || !ww) { U.toast('Vul e-mailadres en wachtwoord in.'); return; }
      if (ww.length < 6) { U.toast('Supabase vereist minimaal 6 tekens voor het wachtwoord.'); return; }
      try { await App.sync.aanmelden(email, ww, true); }
      catch (e) { /* de foutmelding staat al in de synchronisatiestatus */ }
      App.router.herteken(true);
    },
    'sync-nu': async () => {
      await App.sync.synchroniseer(false);
      App.router.herteken(true);
    },
    'sync-afmelden': () => {
      App.sync.afmelden();
      App.router.herteken(true);
    },
    'sync-ontkoppelen': () => {
      if (App.sync.isAangemeld() && !U.bevestig('Synchronisatie loskoppelen? Je lokale gegevens blijven gewoon staan, alleen de koppeling met dit Supabase-project verdwijnt.')) return;
      App.sync.ontkoppel();
      App.router.herteken(true);
    },
    'sync-conflict-lokaal': async () => {
      if (!U.bevestig('De online versie van het andere apparaat vervangen door de versie van dit apparaat?')) return;
      await App.sync.losConflictOp('lokaal');
      App.router.herteken(true);
    },
    'sync-conflict-remote': async () => {
      if (!U.bevestig('Deze lokale wijzigingen vervangen door de online versie? Wat hier nog niet gedeeld is, gaat dan verloren.')) return;
      await App.sync.losConflictOp('remote');
      App.router.herteken(true);
    },

    'versie-herstellen': () => {
      if (!U.bevestig('De vorige versie terugzetten? Wijzigingen van je laatste opslagactie gaan dan verloren.')) return;
      if (S.herstelVorige()) {
        U.toast('Vorige versie teruggezet');
        location.hash = '#/dashboard';
        App.router.herteken(true);
      } else {
        U.toastFout('Terugzetten is niet gelukt.');
      }
    },
    'alles-wissen': () => {
      if (!U.bevestig('Alle gegevens wissen? Dit kan niet ongedaan gemaakt worden.')) return;
      if (!U.bevestig('Echt zeker? Maak eerst een back-up als je die nog niet hebt.')) return;
      if (S.wisAlles()) U.toast('Alles gewist');
      else U.toastFout('Wissen is niet volledig gelukt — probeer het nog eens.');
      location.hash = '#/dashboard';
      App.router.herteken(true);
    }
  };

  App.views.instellingen = { render, na, acties };
})();
