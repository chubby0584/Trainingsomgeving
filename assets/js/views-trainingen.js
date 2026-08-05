/* Trainingen: planning, sessieopbouw uit blokken, aanwezigheid en evaluatie. */

(function () {
  const U = App.util, S = App.store;

  const AANWEZIGHEID = [
    { waarde: 'aanwezig', label: 'Aanwezig', kort: 'A', badge: 'groen' },
    { waarde: 'laat',     label: 'Te laat',  kort: 'L', badge: 'geel' },
    { waarde: 'afwezig',  label: 'Afwezig',  kort: '✗', badge: 'rood' },
    { waarde: 'blessure', label: 'Blessure', kort: 'B', badge: 'paars' }
  ];

  /* ---------------------------- overzicht ---------------------------- */

  function renderLijst() {
    const alle = S.trainingenGesorteerd();
    const vandaag = U.vandaag();
    const komend = alle.filter(t => t.datum >= vandaag);
    const geweest = alle.filter(t => t.datum < vandaag).reverse();

    const kop = `
      <div class="paginakop">
        <div>
          <h1>Trainingen</h1>
          <div class="sub">${komend.length} gepland · ${geweest.length} afgerond</div>
        </div>
        <div class="kop-acties">
          <button class="btn" data-actie="training-blok-reeks">Weekplanning maken</button>
          <button class="btn btn-primair" data-actie="training-nieuw">Training plannen</button>
        </div>
      </div>`;

    if (!alle.length) {
      return kop + `<div class="leeg">
        Nog geen trainingen gepland. Maak een sessie aan en bouw hem op uit blokken —
        de oefenstof staat klaar onder <a href="#/oefeningen">Oefenstof</a>.
      </div>`;
    }

    return kop + belastingPaneel(alle) +
      sectie('Komende trainingen', komend, true) +
      sectie('Afgerond', geweest.slice(0, 20), false);
  }

  function sectie(titel, lijst, komend) {
    if (!lijst.length) return '';
    const kaarten = lijst.map(t => {
      const duur = S.duurTraining(t);
      const aanwezig = Object.values(t.aanwezigheid || {}).filter(v => v === 'aanwezig' || v === 'laat').length;
      const geregistreerd = Object.keys(t.aanwezigheid || {}).length;
      return `<div class="kaart" data-actie="training-open" data-id="${t.id}" style="cursor:pointer">
        <div class="kaart-kop">
          <div>
            <strong>${U.esc(t.thema || 'Training')}</strong>
            <div class="klein muted">${U.datumNL(t.datum, true)} · ${U.esc(t.tijd || '')} ${t.locatie ? '· ' + U.esc(t.locatie) : ''}</div>
          </div>
          <div class="nowrap">
            ${komend ? `<span class="badge blauw">${U.relatief(t.datum)}</span>` : ''}
            ${duur ? `<span class="badge">${duur} min</span>` : ''}
          </div>
        </div>
        ${t.doel ? `<div class="klein dim mt">${U.esc(t.doel)}</div>` : ''}
        <div class="rij mt klein muted">
          <span>${(t.blokken || []).length} blokken</span>
          ${geregistreerd ? `<span>· ${aanwezig}/${geregistreerd} aanwezig</span>` : ''}
          <span>· belasting ${'●'.repeat(t.belasting || 0)}${'○'.repeat(5 - (t.belasting || 0))}</span>
        </div>
      </div>`;
    }).join('');

    return `<h2 class="mt">${titel}</h2><div class="grid grid-2 mb">${kaarten}</div>`;
  }

  // Belastingoverzicht over de komende en afgelopen twee weken.
  function belastingPaneel(trainingen) {
    const vandaag = new Date(U.vandaag() + 'T00:00:00');
    const dagen = [];
    for (let i = -7; i <= 13; i++) {
      const d = new Date(vandaag.getTime() + i * 86400000);
      dagen.push(d.toISOString().slice(0, 10));
    }
    const wedstrijden = S.get().wedstrijden;

    const kolommen = dagen.map(datum => {
      const tr = trainingen.filter(t => t.datum === datum);
      const wd = wedstrijden.filter(w => w.datum === datum);
      const belasting = wd.length ? 5 : Math.max(0, ...tr.map(t => t.belasting || 0));
      const hoogte = belasting * 18;
      const kleur = wd.length ? 'var(--gevaar)' : (belasting >= 4 ? 'var(--warn)' : 'var(--accent)');
      const isVandaag = datum === U.vandaag();
      const d = new Date(datum + 'T00:00:00');
      return `<div style="flex:1;text-align:center;min-width:0" title="${U.datumNL(datum, true)}">
        <div style="height:90px;display:flex;align-items:flex-end;justify-content:center">
          ${belasting ? `<div style="width:70%;height:${hoogte}px;background:${kleur};border-radius:3px 3px 0 0"></div>` : '<div style="width:70%;height:2px;background:var(--line)"></div>'}
        </div>
        <div class="klein ${isVandaag ? '' : 'muted'}" style="${isVandaag ? 'color:var(--accent);font-weight:700' : ''}">${d.getDate()}</div>
      </div>`;
    }).join('');

    return `<div class="paneel mb">
      <div class="paneel-kop">
        <h2>Belasting over drie weken</h2>
        <span class="legenda"><span><i style="background:var(--accent)"></i>training</span><span><i style="background:var(--warn)"></i>zware training</span><span><i style="background:var(--gevaar)"></i>wedstrijd</span></span>
      </div>
      <div style="display:flex;gap:2px">${kolommen}</div>
      <p class="klein muted" style="margin:.6rem 0 0">Vuistregel: leg de zwaarste sessie ver van de wedstrijd, en houd de laatste training vóór de wedstrijd kort en scherp.</p>
    </div>`;
  }

  /* ----------------------------- detail ----------------------------- */

  function renderDetail(id) {
    const t = S.training(id);
    if (!t) return '<div class="leeg">Training niet gevonden. <a href="#/trainingen">Terug</a></div>';

    const duur = S.duurTraining(t);
    const kop = `
      <div class="paginakop">
        <div>
          <div class="klein"><a href="#/trainingen">← Trainingen</a></div>
          <h1>${U.esc(t.thema || 'Training')}</h1>
          <div class="sub">
            ${U.datumNL(t.datum, true)} · ${U.esc(t.tijd || '')} ${t.locatie ? '· ' + U.esc(t.locatie) : ''}
            <span class="badge">${duur} min</span>
            <span class="badge ${(t.belasting || 0) >= 4 ? 'geel' : 'groen'}">belasting ${t.belasting || 0}/5</span>
          </div>
        </div>
        <div class="kop-acties">
          <button class="btn" data-actie="training-print">Afdrukken</button>
          <button class="btn" data-actie="training-bewerk" data-id="${t.id}">Bewerken</button>
          <button class="btn btn-primair" data-actie="blok-nieuw" data-id="${t.id}">Blok toevoegen</button>
        </div>
      </div>`;

    return kop + `<div class="grid grid-2">
        <div>${doelPaneel(t)}${blokkenPaneel(t)}</div>
        <div>${aanwezigheidPaneel(t)}${evaluatiePaneel(t)}</div>
      </div>`;
  }

  function doelPaneel(t) {
    if (!t.doel) return '';
    return `<div class="paneel mb"><h2>Doel van de sessie</h2><div class="klein">${U.tekst(t.doel)}</div></div>`;
  }

  function blokkenPaneel(t) {
    const blokken = t.blokken || [];
    const totaal = S.duurTraining(t) || 1;

    const balk = blokken.length ? `<div class="tijdbalk mb">` + blokken.map(b => {
      const fase = App.seed.FASES.find(f => f.waarde === b.fase) || App.seed.FASES[1];
      return `<span style="width:${(b.duur || 0) / totaal * 100}%;background:${fase.kleur}" title="${U.esc(b.naam)}"></span>`;
    }).join('') + '</div>' : '';

    const lijst = blokken.map((b, i) => {
      const fase = App.seed.FASES.find(f => f.waarde === b.fase) || App.seed.FASES[1];
      const oef = b.oefeningId ? S.oefening(b.oefeningId) : null;
      return `<div class="blok ${fase.klasse}">
        <div class="blok-kop">
          <strong>${U.esc(b.naam)}</strong>
          <span class="nowrap klein muted">${fase.label} · ${b.duur || 0} min</span>
        </div>
        ${oef ? `<div class="klein dim" style="margin-top:.35rem">${U.tekst(oef.organisatie)}</div>
          ${(oef.coachpunten || []).length ? `<ul class="klein" style="margin:.4rem 0 0;padding-left:1.1rem">${oef.coachpunten.map(c => `<li>${U.esc(c)}</li>`).join('')}</ul>` : ''}` : ''}
        ${b.notitie ? `<div class="klein" style="margin-top:.4rem"><span class="muted">Eigen aantekening:</span> ${U.tekst(b.notitie)}</div>` : ''}
        <div class="rij" style="margin-top:.5rem">
          ${i > 0 ? `<button class="btn btn-sm" data-actie="blok-omhoog" data-id="${t.id}" data-index="${i}">↑</button>` : ''}
          ${i < blokken.length - 1 ? `<button class="btn btn-sm" data-actie="blok-omlaag" data-id="${t.id}" data-index="${i}">↓</button>` : ''}
          <button class="btn btn-sm" data-actie="blok-bewerk" data-id="${t.id}" data-index="${i}">Bewerken</button>
          <button class="btn btn-sm btn-gevaar" data-actie="blok-verwijder" data-id="${t.id}" data-index="${i}">Verwijderen</button>
        </div>
      </div>`;
    }).join('');

    return `<div class="paneel mb">
      <div class="paneel-kop"><h2>Opbouw van de sessie</h2><span class="klein muted">${S.duurTraining(t)} min totaal</span></div>
      ${balk}
      ${lijst || '<div class="leeg">Nog geen blokken. Voeg een warming-up, één of twee hoofddelen en een slotspel toe.</div>'}
    </div>`;
  }

  function aanwezigheidPaneel(t) {
    const spelers = S.spelersGesorteerd();
    if (!spelers.length) {
      return `<div class="paneel mb"><h2>Aanwezigheid</h2><p class="klein muted">Voeg eerst spelers toe onder <a href="#/spelers">Spelers</a>.</p></div>`;
    }

    const rijen = spelers.map(sp => {
      const huidig = (t.aanwezigheid || {})[sp.id] || '';
      const knoppen = AANWEZIGHEID.map(a =>
        `<button class="chip ${huidig === a.waarde ? 'aan' : ''}" title="${a.label}"
          data-actie="aanwezigheid" data-id="${t.id}" data-speler="${sp.id}" data-waarde="${a.waarde}">${a.kort}</button>`
      ).join('');
      return `<tr>
        <td>${U.esc(U.kortenaam(sp))}</td>
        <td class="rechts nowrap">${knoppen}</td>
      </tr>`;
    }).join('');

    const telling = AANWEZIGHEID.map(a => {
      const n = Object.values(t.aanwezigheid || {}).filter(v => v === a.waarde).length;
      return n ? `<span class="badge ${a.badge}">${a.label}: ${n}</span>` : '';
    }).filter(Boolean).join(' ');

    return `<div class="paneel mb">
      <div class="paneel-kop"><h2>Aanwezigheid</h2>
        <button class="btn btn-sm" data-actie="aanwezigheid-alle" data-id="${t.id}">Allen aanwezig</button>
      </div>
      <div class="rij mb">${telling || '<span class="klein muted">Nog niets geregistreerd. A = aanwezig, L = te laat, ✗ = afwezig, B = blessure.</span>'}</div>
      <div class="tabel-wrap"><table><tbody>${rijen}</tbody></table></div>
    </div>`;
  }

  function evaluatiePaneel(t) {
    return `<div class="paneel">
      <div class="paneel-kop"><h2>Evaluatie</h2></div>
      <textarea id="trainingEvaluatie" rows="7" placeholder="Wat ging goed, wat nemen we mee naar de volgende sessie? Welke speler viel op?">${U.esc(t.evaluatie)}</textarea>
      <div class="rij mt"><button class="btn btn-primair btn-sm" data-actie="evaluatie-opslaan" data-id="${t.id}">Evaluatie opslaan</button></div>
    </div>`;
  }

  /* --------------------------- formulieren --------------------------- */

  function trainingFormulier(t) {
    const bestaat = !!t;
    const x = t || S.nieuweTraining();

    const body = U.modal(bestaat ? 'Training bewerken' : 'Nieuwe training', `
      <div class="veld-rij">
        <label class="veld"><span>Datum</span><input type="date" name="datum" value="${U.esc(x.datum)}"></label>
        <label class="veld"><span>Aanvang</span><input type="time" name="tijd" value="${U.esc(x.tijd)}"></label>
        <label class="veld"><span>Locatie</span><input name="locatie" value="${U.esc(x.locatie)}" placeholder="Veld 2"></label>
      </div>
      <label class="veld"><span>Thema</span>
        <select name="thema">${U.selectOpties(App.seed.THEMAS, x.thema, 'Kies een thema')}</select>
      </label>
      <label class="veld"><span>Doel van de sessie</span>
        <textarea name="doel" placeholder="Concreet: wat moeten de spelers na deze training beter kunnen?">${U.esc(x.doel)}</textarea>
      </label>
      <label class="veld"><span>Belasting (1 = licht, 5 = zwaar)</span>
        <select name="belasting">${U.selectOpties([1, 2, 3, 4, 5].map(n => ({ waarde: n, label: n })), x.belasting)}</select>
      </label>
      <div class="modal-acties">
        ${bestaat ? `<button class="btn btn-gevaar" data-actie="training-verwijder" data-id="${x.id}">Verwijderen</button>` : ''}
        <button class="btn" data-actie="modal-close">Annuleren</button>
        <button class="btn btn-primair" id="opslaanTraining">Opslaan</button>
      </div>`);

    U.$('#opslaanTraining', body).addEventListener('click', () => {
      const data = U.formData(body);
      let nieuwId = null;
      const ok = S.wijzig(st => {
        if (bestaat) Object.assign(st.trainingen.find(y => y.id === x.id), data);
        else {
          const nieuw = Object.assign(S.nieuweTraining(), data);
          nieuwId = nieuw.id;
          st.trainingen.push(nieuw);
        }
      });
      U.sluitModal();
      if (ok) U.toast('Training opgeslagen');
      if (nieuwId) location.hash = '#/training/' + nieuwId;
      else App.router.herteken(true);
    });
  }

  function blokFormulier(trainingId, index) {
    const t = S.training(trainingId);
    const b = index !== null && index !== undefined ? t.blokken[index] : null;
    const oefeningen = S.get().oefeningen.slice().sort((a, b2) => a.categorie.localeCompare(b2.categorie) || a.naam.localeCompare(b2.naam));

    const opties = oefeningen.map(o => ({ waarde: o.id, label: o.categorie + ' — ' + o.naam }));

    const body = U.modal(b ? 'Blok bewerken' : 'Blok toevoegen', `
      <label class="veld"><span>Oefening uit de bibliotheek</span>
        <select name="oefeningId" id="oefKeuze">${U.selectOpties(opties, b ? b.oefeningId : '', 'Eigen blok (geen oefening)')}</select>
      </label>
      <div class="veld-rij">
        <label class="veld"><span>Naam van het blok</span><input name="naam" id="blokNaam" value="${U.esc(b ? b.naam : '')}" placeholder="bv. Rondo 5v2"></label>
        <label class="veld"><span>Fase</span>
          <select name="fase">${U.selectOpties(App.seed.FASES.map(f => ({ waarde: f.waarde, label: f.label })), b ? b.fase : 'hoofd')}</select>
        </label>
        <label class="veld"><span>Duur (min)</span><input type="number" name="duur" id="blokDuur" min="1" max="120" value="${b ? b.duur : 15}"></label>
      </div>
      <label class="veld"><span>Eigen aantekening</span>
        <textarea name="notitie" placeholder="Aanpassing voor deze groep, aandachtspunt voor een individuele speler...">${U.esc(b ? b.notitie : '')}</textarea>
      </label>
      <div class="modal-acties">
        <button class="btn" data-actie="modal-close">Annuleren</button>
        <button class="btn btn-primair" id="opslaanBlok">Opslaan</button>
      </div>`);

    // Naam en duur automatisch overnemen van de gekozen oefening.
    U.$('#oefKeuze', body).addEventListener('change', (e) => {
      const oef = S.oefening(e.target.value);
      if (!oef) return;
      U.$('#blokNaam', body).value = oef.naam;
      U.$('#blokDuur', body).value = oef.duur;
      const faseVeld = U.$('[name=fase]', body);
      if (oef.categorie === 'Warming-up') faseVeld.value = 'warming';
      else if (oef.categorie === 'Partijvormen') faseVeld.value = 'slot';
    });

    U.$('#opslaanBlok', body).addEventListener('click', () => {
      const data = U.formData(body);
      if (!data.naam.trim()) {
        const oef = S.oefening(data.oefeningId);
        if (oef) data.naam = oef.naam;
        else { U.toast('Geef het blok een naam.'); return; }
      }
      S.wijzig(st => {
        const doel = st.trainingen.find(y => y.id === trainingId);
        doel.blokken = doel.blokken || [];
        if (b) Object.assign(doel.blokken[index], data);
        else doel.blokken.push(data);
      });
      U.sluitModal();
      App.router.herteken(true);
    });
  }

  function weekplanning() {
    const team = S.get().team;
    const body = U.modal('Weekplanning aanmaken', `
      <p class="klein muted">Zet in één keer de trainingen van meerdere weken klaar. Thema en opbouw vul je later per sessie in.</p>
      <div class="veld-rij">
        <label class="veld"><span>Eerste datum</span><input type="date" name="start" value="${U.vandaag()}"></label>
        <label class="veld"><span>Aantal weken</span><input type="number" name="weken" value="4" min="1" max="20"></label>
        <label class="veld"><span>Aanvang</span><input type="time" name="tijd" value="19:00"></label>
      </div>
      <label class="veld"><span>Trainingsdagen</span>
        <div class="rij" id="dagChips">
          ${['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'].map((d, i) =>
            `<span class="chip ${(team.trainingsdagen || '').indexOf(['maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag','zondag'][i]) !== -1 ? 'aan' : ''}" data-dag="${i === 6 ? 0 : i + 1}">${d}</span>`
          ).join('')}
        </div>
      </label>
      <label class="veld"><span>Locatie</span><input name="locatie" placeholder="Sportpark"></label>
      <div class="modal-acties">
        <button class="btn" data-actie="modal-close">Annuleren</button>
        <button class="btn btn-primair" id="planOpslaan">Aanmaken</button>
      </div>`);

    U.$$('#dagChips .chip', body).forEach(c => c.addEventListener('click', () => c.classList.toggle('aan')));

    U.$('#planOpslaan', body).addEventListener('click', () => {
      const data = U.formData(body);
      const dagen = U.$$('#dagChips .chip.aan', body).map(c => Number(c.dataset.dag));
      if (!dagen.length) { U.toast('Kies minimaal één trainingsdag.'); return; }

      const start = new Date(data.start + 'T00:00:00');
      let aantal = 0;
      const ok = S.wijzig(st => {
        for (let w = 0; w < Number(data.weken); w++) {
          for (let d = 0; d < 7; d++) {
            const dag = new Date(start.getTime() + (w * 7 + d) * 86400000);
            if (dagen.indexOf(dag.getDay()) === -1) continue;
            const iso = dag.toISOString().slice(0, 10);
            if (st.trainingen.some(t => t.datum === iso && t.tijd === data.tijd)) continue;
            st.trainingen.push(S.nieuweTraining({ datum: iso, tijd: data.tijd, locatie: data.locatie }));
            aantal++;
          }
        }
      });
      U.sluitModal();
      if (ok) U.toast(aantal + ' trainingen ingepland');
      App.router.herteken(true);
    });
  }

  /* ---------------------------- registratie ---------------------------- */

  const acties = {
    'training-nieuw': () => trainingFormulier(null),
    'training-blok-reeks': () => weekplanning(),
    'training-open': (el) => { location.hash = '#/training/' + el.dataset.id; },
    'training-bewerk': (el) => trainingFormulier(S.training(el.dataset.id)),
    'training-print': () => window.print(),
    'training-verwijder': (el) => {
      if (!U.bevestig('Deze training verwijderen?')) return;
      S.wijzig(st => { st.trainingen = st.trainingen.filter(t => t.id !== el.dataset.id); });
      U.sluitModal();
      location.hash = '#/trainingen';
    },
    'blok-nieuw': (el) => blokFormulier(el.dataset.id, null),
    'blok-bewerk': (el) => blokFormulier(el.dataset.id, Number(el.dataset.index)),
    'blok-verwijder': (el) => {
      S.wijzig(st => {
        st.trainingen.find(t => t.id === el.dataset.id).blokken.splice(Number(el.dataset.index), 1);
      });
      App.router.herteken(true);
    },
    'blok-omhoog': (el) => verplaatsBlok(el.dataset.id, Number(el.dataset.index), -1),
    'blok-omlaag': (el) => verplaatsBlok(el.dataset.id, Number(el.dataset.index), 1),
    'aanwezigheid': (el) => {
      S.wijzig(st => {
        const t = st.trainingen.find(x => x.id === el.dataset.id);
        t.aanwezigheid = t.aanwezigheid || {};
        if (t.aanwezigheid[el.dataset.speler] === el.dataset.waarde) delete t.aanwezigheid[el.dataset.speler];
        else t.aanwezigheid[el.dataset.speler] = el.dataset.waarde;
      });
      App.router.herteken(true);
    },
    'aanwezigheid-alle': (el) => {
      S.wijzig(st => {
        const t = st.trainingen.find(x => x.id === el.dataset.id);
        t.aanwezigheid = t.aanwezigheid || {};
        st.spelers.forEach(sp => { if (!t.aanwezigheid[sp.id]) t.aanwezigheid[sp.id] = 'aanwezig'; });
      });
      App.router.herteken(true);
    },
    'evaluatie-opslaan': (el) => {
      const waarde = U.$('#trainingEvaluatie').value;
      if (S.wijzig(st => { st.trainingen.find(t => t.id === el.dataset.id).evaluatie = waarde; })) {
        U.toast('Evaluatie opgeslagen');
      }
    }
  };

  function verplaatsBlok(id, index, richting) {
    S.wijzig(st => {
      const blokken = st.trainingen.find(t => t.id === id).blokken;
      const doel = index + richting;
      if (doel < 0 || doel >= blokken.length) return;
      const tmp = blokken[index];
      blokken[index] = blokken[doel];
      blokken[doel] = tmp;
    });
    App.router.herteken(true);
  }

  App.views.trainingen = { render: renderLijst, acties };
  App.views.training = { render: renderDetail, acties };
})();
