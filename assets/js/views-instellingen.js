/* Instellingen: teamgegevens, back-up, export en opschonen. */

(function () {
  const U = App.util, S = App.store;

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
