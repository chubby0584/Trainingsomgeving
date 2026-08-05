/* Wedstrijden: programma, voorbereiding/scouting, opstelling en nabespreking. */

(function () {
  const U = App.util, S = App.store;

  let tab = 'voorbereiding';

  /* ---------------------------- overzicht ---------------------------- */

  function uitslagBadge(w) {
    if (!w.gespeeld || w.doelpuntenVoor === null || w.doelpuntenTegen === null) return '';
    const v = w.doelpuntenVoor, t = w.doelpuntenTegen;
    const klasse = v > t ? 'groen' : (v === t ? 'geel' : 'rood');
    return `<span class="badge ${klasse}">${v} - ${t}</span>`;
  }

  function renderLijst() {
    const alle = S.wedstrijdenGesorteerd();
    const vandaag = U.vandaag();
    const komend = alle.filter(w => w.datum >= vandaag && !w.gespeeld);
    const geweest = alle.filter(w => w.datum < vandaag || w.gespeeld).reverse();

    const gespeeld = alle.filter(w => w.gespeeld && w.doelpuntenVoor !== null);
    const winst = gespeeld.filter(w => w.doelpuntenVoor > w.doelpuntenTegen).length;
    const gelijk = gespeeld.filter(w => w.doelpuntenVoor === w.doelpuntenTegen).length;
    const verlies = gespeeld.length - winst - gelijk;
    const voor = gespeeld.reduce((s, w) => s + w.doelpuntenVoor, 0);
    const tegen = gespeeld.reduce((s, w) => s + w.doelpuntenTegen, 0);

    const kop = `
      <div class="paginakop">
        <div>
          <h1>Wedstrijden</h1>
          <div class="sub">${komend.length} op het programma · ${gespeeld.length} gespeeld</div>
        </div>
        <div class="kop-acties">
          <button class="btn btn-primair" data-actie="wedstrijd-nieuw">Wedstrijd toevoegen</button>
        </div>
      </div>`;

    if (!alle.length) {
      return kop + '<div class="leeg">Nog geen wedstrijden. Voeg het programma toe om voorbereiding, opstelling en speelminuten bij te houden.</div>';
    }

    const balans = gespeeld.length ? `<div class="grid grid-4 mb">
        <div class="paneel kpi"><div class="label">Balans</div><div class="waarde">${winst}-${gelijk}-${verlies}</div><div class="voet">winst · gelijk · verlies</div></div>
        <div class="paneel kpi"><div class="label">Doelpunten</div><div class="waarde">${voor}:${tegen}</div><div class="voet">${U.rond(voor / gespeeld.length, 1)} voor, ${U.rond(tegen / gespeeld.length, 1)} tegen per duel</div></div>
        <div class="paneel kpi"><div class="label">Punten per duel</div><div class="waarde">${U.rond((winst * 3 + gelijk) / gespeeld.length, 2)}</div><div class="voet">over ${gespeeld.length} wedstrijden</div></div>
        <div class="paneel kpi"><div class="label">Clean sheets</div><div class="waarde">${gespeeld.filter(w => w.doelpuntenTegen === 0).length}</div><div class="voet">wedstrijden zonder tegendoelpunt</div></div>
      </div>` : '';

    const sectie = (titel, lijst) => lijst.length ? `<h2 class="mt">${titel}</h2><div class="grid grid-2 mb">` +
      lijst.map(w => `<div class="kaart" data-actie="wedstrijd-open" data-id="${w.id}" style="cursor:pointer">
        <div class="kaart-kop">
          <div>
            <strong>${w.thuis ? 'Thuis' : 'Uit'} tegen ${U.esc(w.tegenstander || 'onbekend')}</strong>
            <div class="klein muted">${U.datumNL(w.datum, true)} · ${U.esc(w.tijd || '')} ${w.locatie ? '· ' + U.esc(w.locatie) : ''}</div>
          </div>
          <div class="nowrap">${uitslagBadge(w)} ${!w.gespeeld ? `<span class="badge blauw">${U.relatief(w.datum)}</span>` : ''}</div>
        </div>
        <div class="rij mt klein muted">
          <span class="badge">${U.esc(w.soort)}</span>
          <span>${Object.keys(w.opstelling || {}).length}/11 opgesteld</span>
          ${w.scouting && (w.scouting.speelwijze || w.scouting.sterktes) ? '<span class="badge groen">scouting</span>' : ''}
        </div>
      </div>`).join('') + '</div>' : '';

    return kop + balans + sectie('Programma', komend) + sectie('Gespeeld', geweest.slice(0, 20));
  }

  /* ------------------------------ detail ------------------------------ */

  function renderDetail(id) {
    const w = S.wedstrijd(id);
    if (!w) return '<div class="leeg">Wedstrijd niet gevonden. <a href="#/wedstrijden">Terug</a></div>';

    const tabs = [
      ['voorbereiding', 'Voorbereiding'],
      ['opstelling', 'Opstelling'],
      ['nabespreking', 'Nabespreking']
    ];

    const kop = `
      <div class="paginakop">
        <div>
          <div class="klein"><a href="#/wedstrijden">← Wedstrijden</a></div>
          <h1>${w.thuis ? '' : 'Uit — '}${U.esc(w.tegenstander || 'Tegenstander')}</h1>
          <div class="sub">
            ${U.datumNL(w.datum, true)} · aanvang ${U.esc(w.tijd || '')}
            ${w.verzameltijd ? `· verzamelen ${U.esc(w.verzameltijd)}` : ''}
            ${w.locatie ? '· ' + U.esc(w.locatie) : ''}
            ${uitslagBadge(w)}
          </div>
        </div>
        <div class="kop-acties">
          <button class="btn" data-actie="wedstrijd-print">Afdrukken</button>
          <button class="btn" data-actie="wedstrijd-bewerk" data-id="${w.id}">Bewerken</button>
        </div>
      </div>`;

    const tabsHtml = '<div class="tabs">' + tabs.map(([k, label]) =>
      `<button data-actie="wedstrijd-tab" data-tab="${k}" class="${tab === k ? 'actief' : ''}">${label}</button>`
    ).join('') + '</div>';

    let inhoud;
    if (tab === 'opstelling') inhoud = tabOpstelling(w);
    else if (tab === 'nabespreking') inhoud = tabNabespreking(w);
    else inhoud = tabVoorbereiding(w);

    return kop + tabsHtml + inhoud;
  }

  function tabVoorbereiding(w) {
    const veld = (sleutel, groep, label, plaatshouder) => `
      <label class="veld"><span>${label}</span>
        <textarea data-veld="${groep}.${sleutel}" rows="4" placeholder="${plaatshouder}">${U.esc((w[groep] || {})[sleutel] || '')}</textarea>
      </label>`;

    const beschikbaar = S.spelersGesorteerd().filter(sp => sp.status !== 'fit');
    const zorgen = beschikbaar.length ? `<div class="paneel mb">
        <h2>Let op bij de selectie</h2>
        ${beschikbaar.map(sp => {
          const st = App.seed.STATUSSEN.find(x => x.waarde === sp.status);
          return `<div class="rij-tussen" style="padding:.3rem 0;border-bottom:1px solid var(--line)">
            <span>${U.esc(U.naam(sp))}</span>
            <span><span class="badge ${st.badge}">${U.esc(st.label)}</span> <span class="klein muted">${U.esc(sp.statusToelichting || '')}</span></span>
          </div>`;
        }).join('')}
      </div>` : '';

    return `<div class="grid grid-2">
      <div class="paneel">
        <h2>Scouting tegenstander</h2>
        ${veld('speelwijze', 'scouting', 'Speelwijze en formatie', 'Hoe bouwen zij op, hoe verdedigen ze?')}
        ${veld('sterktes', 'scouting', 'Sterke punten', 'Waar zijn ze gevaarlijk?')}
        ${veld('zwaktes', 'scouting', 'Zwakke punten', 'Waar kunnen wij toeslaan?')}
        ${veld('spelers', 'scouting', 'Opvallende spelers', 'Nummer, positie, kenmerk')}
        ${veld('standaard', 'scouting', 'Standaardsituaties', 'Corners, vrije trappen, ingooien')}
      </div>
      <div>
        ${zorgen}
        <div class="paneel">
          <h2>Ons wedstrijdplan</h2>
          ${veld('balbezit', 'plan', 'Wij aan de bal', 'Opbouwpatroon, wie is de vrije man, waar zoeken we de ruimte?')}
          ${veld('balverlies', 'plan', 'Zij aan de bal', 'Waar zetten we druk, welk blok, wie pakt wie?')}
          ${veld('omschakeling', 'plan', 'Omschakelmomenten', 'Wat doen we direct na balverlies en balverovering?')}
          ${veld('standaard', 'plan', 'Onze standaardsituaties', 'Nemers, varianten, restverdediging')}
        </div>
      </div>
    </div>
    <div class="rij mt"><button class="btn btn-primair" data-actie="voorbereiding-opslaan" data-id="${w.id}">Voorbereiding opslaan</button></div>`;
  }

  /* --------------------------- opstelling --------------------------- */

  function veldSVG(w) {
    const posities = App.seed.FORMATIES[w.formatie] || App.seed.FORMATIES['1-4-3-3'];
    const lijn = 'stroke="rgba(255,255,255,.35)" fill="none" stroke-width=".6"';

    const slots = posities.map((p, i) => {
      const spelerId = (w.opstelling || {})[i];
      const sp = spelerId ? S.speler(spelerId) : null;
      const label = sp ? (sp.rugnummer !== null && sp.rugnummer !== '' ? sp.rugnummer : U.initialen(sp)) : '+';
      const naam = sp ? U.kortenaam(sp) : p.naam;
      return `<g class="pos-slot ${sp ? '' : 'leeg'}" data-actie="opstelling-kies" data-id="${w.id}" data-slot="${i}">
        <circle cx="${p.x}" cy="${p.y}" r="4.6"/>
        <text x="${p.x}" y="${p.y + 1.8}">${U.esc(label)}</text>
        <text class="pos-naam" x="${p.x}" y="${p.y + 9}">${U.esc(naam)}</text>
      </g>`;
    }).join('');

    return `<svg class="veld-svg" viewBox="0 0 100 150" role="img" aria-label="Opstelling">
      <rect x="1" y="1" width="98" height="148" ${lijn}/>
      <line x1="1" y1="75" x2="99" y2="75" ${lijn}/>
      <circle cx="50" cy="75" r="12" ${lijn}/>
      <rect x="26" y="1" width="48" height="18" ${lijn}/>
      <rect x="38" y="1" width="24" height="7" ${lijn}/>
      <rect x="26" y="131" width="48" height="18" ${lijn}/>
      <rect x="38" y="142" width="24" height="7" ${lijn}/>
      ${slots}
    </svg>`;
  }

  function tabOpstelling(w) {
    const opgesteld = Object.values(w.opstelling || {}).filter(Boolean);
    const bank = (w.bank || []).map(id => S.speler(id)).filter(Boolean);
    const rest = S.spelersGesorteerd().filter(sp =>
      opgesteld.indexOf(sp.id) === -1 && (w.bank || []).indexOf(sp.id) === -1);

    const formatieKeuze = `<label class="veld"><span>Formatie</span>
      <select id="formatieKeuze" data-actie="formatie-wissel" data-id="${w.id}">
        ${U.selectOpties(Object.keys(App.seed.FORMATIES), w.formatie)}
      </select></label>`;

    const bankLijst = bank.length
      ? bank.map(sp => `<div class="rij-tussen" style="padding:.25rem 0">
          <span>${sp.rugnummer !== null && sp.rugnummer !== '' ? `<span class="badge">${U.esc(sp.rugnummer)}</span> ` : ''}${U.esc(U.naam(sp))}</span>
          <button class="btn btn-sm" data-actie="bank-af" data-id="${w.id}" data-speler="${sp.id}">×</button>
        </div>`).join('')
      : '<p class="klein muted">Nog niemand op de bank.</p>';

    const restLijst = rest.length
      ? rest.map(sp => {
          const st = App.seed.STATUSSEN.find(x => x.waarde === sp.status);
          return `<div class="rij-tussen" style="padding:.25rem 0">
            <span>${U.esc(U.naam(sp))} ${sp.status !== 'fit' ? `<span class="badge ${st.badge}">${U.esc(st.label)}</span>` : ''}</span>
            <button class="btn btn-sm" data-actie="bank-op" data-id="${w.id}" data-speler="${sp.id}">Naar bank</button>
          </div>`;
        }).join('')
      : '<p class="klein muted">Iedereen is ingedeeld.</p>';

    return `<div class="grid grid-2">
      <div class="paneel">
        <div class="paneel-kop">
          <h2>Basisopstelling <span class="klein muted">${opgesteld.length}/11</span></h2>
          <button class="btn btn-sm" data-actie="opstelling-leeg" data-id="${w.id}">Leegmaken</button>
        </div>
        <div class="veldwrap">${veldSVG(w)}</div>
        <p class="klein muted" style="margin:.6rem 0 0">Klik op een positie om een speler te kiezen.</p>
      </div>
      <div>
        <div class="paneel mb">${formatieKeuze}
          <p class="klein muted" style="margin:0">Bij het wisselen van formatie blijven de gekozen spelers op dezelfde plek in de rij staan; controleer de bezetting daarna even.</p>
        </div>
        <div class="paneel mb"><h2>Wisselspelers</h2>${bankLijst}</div>
        <div class="paneel"><h2>Nog niet ingedeeld</h2>${restLijst}</div>
      </div>
    </div>`;
  }

  function kiesSpeler(wedstrijdId, slot) {
    const w = S.wedstrijd(wedstrijdId);
    const posities = App.seed.FORMATIES[w.formatie] || [];
    const pos = posities[slot];
    const bezet = Object.keys(w.opstelling || {})
      .filter(k => Number(k) !== Number(slot))
      .map(k => w.opstelling[k]);

    const spelers = S.spelersGesorteerd();
    const opties = spelers.map(sp => {
      const alBezet = bezet.indexOf(sp.id) !== -1;
      const st = App.seed.STATUSSEN.find(x => x.waarde === sp.status);
      const tags = [
        sp.status !== 'fit' ? st.label : '',
        alBezet ? 'staat al opgesteld' : '',
        (sp.posities || []).join('/')
      ].filter(Boolean).join(' · ');
      return `<button class="btn" style="width:100%;text-align:left;margin-bottom:.3rem${alBezet ? ';opacity:.55' : ''}"
        data-actie="opstelling-zet" data-id="${wedstrijdId}" data-slot="${slot}" data-speler="${sp.id}">
        <strong>${sp.rugnummer !== null && sp.rugnummer !== '' ? sp.rugnummer + '. ' : ''}${U.esc(U.naam(sp))}</strong>
        ${tags ? `<span class="klein muted"> — ${U.esc(tags)}</span>` : ''}
      </button>`;
    }).join('');

    U.modal('Positie: ' + (pos ? pos.naam : ''), `
      ${spelers.length ? opties : '<p class="muted">Voeg eerst spelers toe.</p>'}
      <div class="modal-acties">
        <button class="btn btn-gevaar" data-actie="opstelling-zet" data-id="${wedstrijdId}" data-slot="${slot}" data-speler="">Positie leegmaken</button>
        <button class="btn" data-actie="modal-close">Annuleren</button>
      </div>`);
  }

  /* -------------------------- nabespreking -------------------------- */

  function tabNabespreking(w) {
    const spelers = S.spelersGesorteerd();
    const inBasis = Object.values(w.opstelling || {});

    const rijen = spelers.map(sp => {
      const min = (w.minuten || {})[sp.id];
      const rap = (w.rapporten || {})[sp.id] || {};
      const rol = inBasis.indexOf(sp.id) !== -1 ? '<span class="badge groen">basis</span>'
        : ((w.bank || []).indexOf(sp.id) !== -1 ? '<span class="badge">bank</span>' : '');
      return `<tr>
        <td class="nowrap">${U.esc(U.kortenaam(sp))} ${rol}</td>
        <td style="width:80px"><input type="number" min="0" max="120" data-minuten="${sp.id}" value="${min !== undefined && min !== null ? min : ''}" placeholder="0"></td>
        <td style="width:80px"><input type="number" min="1" max="10" step="0.5" data-cijfer="${sp.id}" value="${typeof rap.cijfer === 'number' ? rap.cijfer : ''}" placeholder="–"></td>
        <td><input data-notitie="${sp.id}" value="${U.esc(rap.notitie || '')}" placeholder="Kort en concreet"></td>
      </tr>`;
    }).join('');

    return `<div class="grid grid-2 mb">
        <div class="paneel">
          <h2>Uitslag</h2>
          <div class="veld-rij">
            <label class="veld"><span>Doelpunten voor</span><input type="number" id="dpVoor" min="0" value="${w.doelpuntenVoor !== null && w.doelpuntenVoor !== undefined ? w.doelpuntenVoor : ''}"></label>
            <label class="veld"><span>Doelpunten tegen</span><input type="number" id="dpTegen" min="0" value="${w.doelpuntenTegen !== null && w.doelpuntenTegen !== undefined ? w.doelpuntenTegen : ''}"></label>
            <label class="veld"><span>Gespeeld</span>
              <select id="isGespeeld">${U.selectOpties([{ waarde: 'ja', label: 'Ja' }, { waarde: 'nee', label: 'Nog niet' }], w.gespeeld ? 'ja' : 'nee')}</select>
            </label>
          </div>
        </div>
        <div class="paneel">
          <h2>Teamevaluatie</h2>
          <textarea id="wedstrijdEvaluatie" rows="5" placeholder="Wat werkte, wat niet? Welke afspraak nemen we mee naar de training?">${U.esc(w.evaluatie)}</textarea>
        </div>
      </div>
      <div class="paneel">
        <div class="paneel-kop">
          <h2>Speelminuten en individuele beoordeling</h2>
          <button class="btn btn-sm" data-actie="minuten-basis" data-id="${w.id}">Basiself 80 min</button>
        </div>
        <div class="tabel-wrap"><table>
          <thead><tr><th>Speler</th><th>Minuten</th><th>Cijfer</th><th>Notitie</th></tr></thead>
          <tbody>${rijen || '<tr><td colspan="4" class="muted">Nog geen spelers.</td></tr>'}</tbody>
        </table></div>
      </div>
      <div class="rij mt"><button class="btn btn-primair" data-actie="nabespreking-opslaan" data-id="${w.id}">Nabespreking opslaan</button></div>`;
  }

  /* --------------------------- formulier --------------------------- */

  function wedstrijdFormulier(w) {
    const bestaat = !!w;
    const x = w || S.nieuweWedstrijd();

    const body = U.modal(bestaat ? 'Wedstrijd bewerken' : 'Nieuwe wedstrijd', `
      <div class="veld-rij">
        <label class="veld"><span>Tegenstander</span><input name="tegenstander" value="${U.esc(x.tegenstander)}"></label>
        <label class="veld"><span>Thuis of uit</span>
          <select name="thuisKeuze">${U.selectOpties([{ waarde: 'thuis', label: 'Thuis' }, { waarde: 'uit', label: 'Uit' }], x.thuis ? 'thuis' : 'uit')}</select>
        </label>
        <label class="veld"><span>Soort</span>
          <select name="soort">${U.selectOpties(['competitie', 'beker', 'oefen', 'toernooi'], x.soort)}</select>
        </label>
      </div>
      <div class="veld-rij">
        <label class="veld"><span>Datum</span><input type="date" name="datum" value="${U.esc(x.datum)}"></label>
        <label class="veld"><span>Aanvang</span><input type="time" name="tijd" value="${U.esc(x.tijd)}"></label>
        <label class="veld"><span>Verzamelen</span><input type="time" name="verzameltijd" value="${U.esc(x.verzameltijd)}"></label>
      </div>
      <div class="veld-rij">
        <label class="veld"><span>Locatie</span><input name="locatie" value="${U.esc(x.locatie)}"></label>
        <label class="veld"><span>Formatie</span><select name="formatie">${U.selectOpties(Object.keys(App.seed.FORMATIES), x.formatie)}</select></label>
      </div>
      <div class="modal-acties">
        ${bestaat ? `<button class="btn btn-gevaar" data-actie="wedstrijd-verwijder" data-id="${x.id}">Verwijderen</button>` : ''}
        <button class="btn" data-actie="modal-close">Annuleren</button>
        <button class="btn btn-primair" id="opslaanWedstrijd">Opslaan</button>
      </div>`);

    U.$('#opslaanWedstrijd', body).addEventListener('click', () => {
      const data = U.formData(body);
      data.thuis = data.thuisKeuze === 'thuis';
      delete data.thuisKeuze;
      let nieuwId = null;
      const ok = S.wijzig(st => {
        if (bestaat) Object.assign(st.wedstrijden.find(y => y.id === x.id), data);
        else {
          const nieuw = Object.assign(S.nieuweWedstrijd(), data);
          nieuwId = nieuw.id;
          st.wedstrijden.push(nieuw);
        }
      });
      U.sluitModal();
      if (ok) U.toast('Wedstrijd opgeslagen');
      if (nieuwId) location.hash = '#/wedstrijd/' + nieuwId;
      else App.router.herteken(true);
    });
  }

  /* --------------------------- registratie --------------------------- */

  const acties = {
    'wedstrijd-nieuw': () => wedstrijdFormulier(null),
    'wedstrijd-open': (el) => { tab = 'voorbereiding'; location.hash = '#/wedstrijd/' + el.dataset.id; },
    'wedstrijd-bewerk': (el) => wedstrijdFormulier(S.wedstrijd(el.dataset.id)),
    'wedstrijd-print': () => window.print(),
    'wedstrijd-tab': (el) => { tab = el.dataset.tab; App.router.herteken(true); },
    'wedstrijd-verwijder': (el) => {
      if (!U.bevestig('Deze wedstrijd verwijderen?')) return;
      S.wijzig(st => { st.wedstrijden = st.wedstrijden.filter(w => w.id !== el.dataset.id); });
      U.sluitModal();
      location.hash = '#/wedstrijden';
    },

    'voorbereiding-opslaan': (el) => {
      const velden = U.$$('[data-veld]');
      const ok = S.wijzig(st => {
        const w = st.wedstrijden.find(x => x.id === el.dataset.id);
        velden.forEach(v => {
          const [groep, sleutel] = v.dataset.veld.split('.');
          w[groep] = w[groep] || {};
          w[groep][sleutel] = v.value;
        });
      });
      if (ok) U.toast('Voorbereiding opgeslagen');
    },

    'formatie-wissel': (el) => {
      S.wijzig(st => { st.wedstrijden.find(w => w.id === el.dataset.id).formatie = el.value; });
      App.router.herteken(true);
    },
    'opstelling-kies': (el) => kiesSpeler(el.dataset.id, Number(el.dataset.slot)),
    'opstelling-zet': (el) => {
      S.wijzig(st => {
        const w = st.wedstrijden.find(x => x.id === el.dataset.id);
        w.opstelling = w.opstelling || {};
        const spelerId = el.dataset.speler;
        if (!spelerId) {
          delete w.opstelling[el.dataset.slot];
        } else {
          // Speler kan maar op één plek staan.
          Object.keys(w.opstelling).forEach(k => { if (w.opstelling[k] === spelerId) delete w.opstelling[k]; });
          w.bank = (w.bank || []).filter(id => id !== spelerId);
          w.opstelling[el.dataset.slot] = spelerId;
        }
      });
      U.sluitModal();
      App.router.herteken(true);
    },
    'opstelling-leeg': (el) => {
      if (!U.bevestig('De hele opstelling leegmaken?')) return;
      S.wijzig(st => { st.wedstrijden.find(w => w.id === el.dataset.id).opstelling = {}; });
      App.router.herteken(true);
    },
    'bank-op': (el) => {
      S.wijzig(st => {
        const w = st.wedstrijden.find(x => x.id === el.dataset.id);
        w.bank = w.bank || [];
        if (w.bank.indexOf(el.dataset.speler) === -1) w.bank.push(el.dataset.speler);
      });
      App.router.herteken(true);
    },
    'bank-af': (el) => {
      S.wijzig(st => {
        const w = st.wedstrijden.find(x => x.id === el.dataset.id);
        w.bank = (w.bank || []).filter(id => id !== el.dataset.speler);
      });
      App.router.herteken(true);
    },

    'minuten-basis': (el) => {
      const w = S.wedstrijd(el.dataset.id);
      Object.values(w.opstelling || {}).forEach(spelerId => {
        const veld = U.$(`[data-minuten="${spelerId}"]`);
        if (veld && !veld.value) veld.value = 80;
      });
      U.toast('Ingevuld — nog opslaan');
    },
    'nabespreking-opslaan': (el) => {
      const voor = U.$('#dpVoor').value;
      const tegen = U.$('#dpTegen').value;
      const gespeeld = U.$('#isGespeeld').value === 'ja';
      const evaluatie = U.$('#wedstrijdEvaluatie').value;

      const ok = S.wijzig(st => {
        const w = st.wedstrijden.find(x => x.id === el.dataset.id);
        w.doelpuntenVoor = voor === '' ? null : Number(voor);
        w.doelpuntenTegen = tegen === '' ? null : Number(tegen);
        w.gespeeld = gespeeld;
        w.evaluatie = evaluatie;
        w.minuten = {};
        w.rapporten = {};
        U.$$('[data-minuten]').forEach(v => {
          if (v.value !== '') w.minuten[v.dataset.minuten] = Number(v.value);
        });
        U.$$('[data-cijfer]').forEach(v => {
          const id = v.dataset.cijfer;
          const notitieVeld = U.$(`[data-notitie="${id}"]`);
          const cijfer = v.value === '' ? null : Number(v.value);
          const notitie = notitieVeld ? notitieVeld.value : '';
          if (cijfer !== null || notitie) w.rapporten[id] = { cijfer, notitie };
        });
      });
      if (ok) U.toast('Nabespreking opgeslagen');
      App.router.herteken(true);
    }
  };

  App.views.wedstrijden = { render: renderLijst, acties };
  App.views.wedstrijd = { render: renderDetail, acties };
})();
