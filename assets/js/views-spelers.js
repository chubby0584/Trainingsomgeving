/* Spelersbeheer: selectie, TIPS-beoordelingen, ontwikkeldoelen en logboek. */

(function () {
  const U = App.util, S = App.store;

  let filter = { zoek: '', status: '', positie: '' };
  let tab = 'profiel';

  /* --------------------------- overzicht --------------------------- */

  function statusBadge(speler) {
    const st = App.seed.STATUSSEN.find(s => s.waarde === speler.status) || App.seed.STATUSSEN[0];
    return `<span class="badge ${st.badge}">${U.esc(st.label)}</span>`;
  }

  function trendPijl(verschil) {
    if (verschil === null || verschil === undefined) return '<span class="muted">–</span>';
    if (verschil > 0.15) return `<span class="badge groen">▲ ${U.rond(verschil, 1)}</span>`;
    if (verschil < -0.15) return `<span class="badge rood">▼ ${U.rond(Math.abs(verschil), 1)}</span>`;
    return '<span class="badge">gelijk</span>';
  }

  function pasFilterToe(spelers) {
    const zoek = filter.zoek.toLowerCase();
    return spelers.filter(sp => {
      if (filter.status && sp.status !== filter.status) return false;
      if (filter.positie && (sp.posities || []).indexOf(filter.positie) === -1) return false;
      if (zoek && U.naam(sp).toLowerCase().indexOf(zoek) === -1) return false;
      return true;
    });
  }

  function renderLijst() {
    const alle = S.spelersGesorteerd();
    const spelers = pasFilterToe(alle);

    const kop = `
      <div class="paginakop">
        <div>
          <h1>Spelers</h1>
          <div class="sub">${alle.length} in de selectie${spelers.length !== alle.length ? ` · ${spelers.length} zichtbaar` : ''}</div>
        </div>
        <div class="kop-acties">
          <button class="btn" data-actie="spelers-import">Snel toevoegen</button>
          <button class="btn btn-primair" data-actie="speler-nieuw">Speler toevoegen</button>
        </div>
      </div>`;

    if (!alle.length) {
      return kop + `<div class="leeg">
        Nog geen spelers. Begin met <strong>Speler toevoegen</strong>, of gebruik
        <strong>Snel toevoegen</strong> om de hele selectie in één keer in te voeren.
      </div>`;
    }

    const filters = `
      <div class="paneel mb">
        <div class="veld-rij">
          <label class="veld"><span>Zoeken</span>
            <input type="search" id="fZoek" value="${U.esc(filter.zoek)}" placeholder="Naam...">
          </label>
          <label class="veld"><span>Status</span>
            <select id="fStatus">${U.selectOpties(App.seed.STATUSSEN.map(s => ({ waarde: s.waarde, label: s.label })), filter.status, 'Alle')}</select>
          </label>
          <label class="veld"><span>Positie</span>
            <select id="fPositie">${U.selectOpties(App.seed.POSITIES, filter.positie, 'Alle')}</select>
          </label>
        </div>
      </div>`;

    const rijen = spelers.map(sp => {
      const niveau = S.huidigNiveau(sp);
      const ontw = S.ontwikkeling(sp);
      const aanw = S.aanwezigheidStats(sp.id);
      const speel = S.speelStats(sp.id);
      const doelen = S.openDoelen(sp).length;
      return `<tr data-actie="speler-open" data-id="${sp.id}" style="cursor:pointer">
        <td class="nowrap"><strong>${sp.rugnummer !== null && sp.rugnummer !== '' ? sp.rugnummer : '–'}</strong></td>
        <td><strong>${U.esc(U.naam(sp))}</strong><br><small class="muted">${(sp.posities || []).join(', ') || 'geen positie'}</small></td>
        <td class="nowrap">${U.leeftijd(sp.geboortedatum) !== null ? U.leeftijd(sp.geboortedatum) + ' jr' : '–'}</td>
        <td>${statusBadge(sp)}</td>
        <td class="rechts nowrap">${niveau !== null ? U.rond(niveau, 1) : '<span class="muted">–</span>'}</td>
        <td class="rechts nowrap">${trendPijl(ontw && ontw.totaal)}</td>
        <td class="rechts nowrap">${aanw.percentage !== null ? aanw.percentage + '%' : '<span class="muted">–</span>'}</td>
        <td class="rechts nowrap">${speel.minuten || 0}'</td>
        <td class="rechts nowrap">${doelen ? `<span class="badge blauw">${doelen}</span>` : '<span class="muted">–</span>'}</td>
      </tr>`;
    }).join('');

    const tabel = `
      <div class="paneel"><div class="tabel-wrap"><table>
        <thead><tr>
          <th>#</th><th>Speler</th><th>Leeftijd</th><th>Status</th>
          <th class="rechts">Niveau</th><th class="rechts">Trend</th>
          <th class="rechts">Aanwezig</th><th class="rechts">Minuten</th><th class="rechts">Doelen</th>
        </tr></thead>
        <tbody>${rijen || '<tr><td colspan="9" class="muted">Geen spelers met deze filters.</td></tr>'}</tbody>
      </table></div></div>`;

    return kop + filters + tabel;
  }

  function naLijst() {
    const bind = (id, sleutel) => {
      const el = U.$('#' + id);
      if (!el) return;
      el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => {
        filter[sleutel] = el.value;
        App.router.herteken(true);
        const opnieuw = U.$('#' + id);
        if (opnieuw && el.tagName !== 'SELECT') {
          opnieuw.focus();
          opnieuw.setSelectionRange(opnieuw.value.length, opnieuw.value.length);
        }
      });
    };
    bind('fZoek', 'zoek');
    bind('fStatus', 'status');
    bind('fPositie', 'positie');
  }

  /* ---------------------------- detail ---------------------------- */

  function renderDetail(id) {
    const sp = S.speler(id);
    if (!sp) return '<div class="leeg">Speler niet gevonden. <a href="#/spelers">Terug naar de selectie</a></div>';

    const niveau = S.huidigNiveau(sp);
    const tabs = [
      ['profiel', 'Profiel'],
      ['ontwikkeling', 'Ontwikkeling'],
      ['doelen', 'Ontwikkelplan'],
      ['logboek', 'Logboek'],
      ['statistieken', 'Statistieken']
    ];

    const kop = `
      <div class="paginakop">
        <div>
          <div class="klein"><a href="#/spelers">← Selectie</a></div>
          <h1>${U.esc(U.naam(sp))} ${sp.rugnummer !== null && sp.rugnummer !== '' ? `<span class="muted">#${U.esc(sp.rugnummer)}</span>` : ''}</h1>
          <div class="sub">
            ${statusBadge(sp)}
            ${(sp.posities || []).map(p => `<span class="badge blauw">${U.esc(p)}</span>`).join(' ')}
            ${U.leeftijd(sp.geboortedatum) !== null ? `<span class="badge">${U.leeftijd(sp.geboortedatum)} jaar</span>` : ''}
            ${niveau !== null ? `<span class="badge paars">Niveau ${U.rond(niveau, 1)}</span>` : ''}
          </div>
        </div>
        <div class="kop-acties">
          <button class="btn" data-actie="speler-bewerk" data-id="${sp.id}">Bewerken</button>
          <button class="btn btn-primair" data-actie="beoordeling-nieuw" data-id="${sp.id}">Nieuwe beoordeling</button>
        </div>
      </div>`;

    const tabsHtml = '<div class="tabs">' + tabs.map(([k, label]) =>
      `<button data-actie="tab" data-tab="${k}" class="${tab === k ? 'actief' : ''}">${label}</button>`
    ).join('') + '</div>';

    let inhoud = '';
    if (tab === 'profiel') inhoud = tabProfiel(sp);
    else if (tab === 'ontwikkeling') inhoud = tabOntwikkeling(sp);
    else if (tab === 'doelen') inhoud = tabDoelen(sp);
    else if (tab === 'logboek') inhoud = tabLogboek(sp);
    else inhoud = tabStatistieken(sp);

    return kop + tabsHtml + inhoud;
  }

  function tabProfiel(sp) {
    const st = App.seed.STATUSSEN.find(s => s.waarde === sp.status);
    const regel = (label, waarde) =>
      `<div class="rij-tussen" style="border-bottom:1px solid var(--line);padding:.4rem 0">
        <span class="muted klein">${label}</span><span>${waarde || '<span class="muted">–</span>'}</span>
      </div>`;

    return `<div class="grid grid-2">
      <div class="paneel">
        <h2>Gegevens</h2>
        ${regel('Geboortedatum', U.datumNL(sp.geboortedatum) + (U.leeftijd(sp.geboortedatum) !== null ? ` <span class="muted">(${U.leeftijd(sp.geboortedatum)} jr)</span>` : ''))}
        ${regel('Posities', (sp.posities || []).map(U.esc).join(', '))}
        ${regel('Voorkeursbeen', U.esc(sp.been))}
        ${regel('Lengte / gewicht', [sp.lengte ? sp.lengte + ' cm' : '', sp.gewicht ? sp.gewicht + ' kg' : ''].filter(Boolean).join(' · '))}
        ${regel('Telefoon', U.esc(sp.telefoon))}
        ${regel('Contact ouder/verzorger', U.esc(sp.contactOuder))}
        ${regel('Status', (st ? U.esc(st.label) : '') + (sp.statusToelichting ? ` <span class="muted klein">${U.esc(sp.statusToelichting)}</span>` : ''))}
      </div>
      <div class="grid" style="gap:1rem;align-content:start">
        <div class="paneel">
          <h2>Sterke punten</h2>
          <div class="klein">${sp.sterktes ? U.tekst(sp.sterktes) : '<span class="muted">Nog niet ingevuld — noteer waar deze speler het verschil maakt.</span>'}</div>
        </div>
        <div class="paneel">
          <h2>Ontwikkelpunten</h2>
          <div class="klein">${sp.ontwikkelpunten ? U.tekst(sp.ontwikkelpunten) : '<span class="muted">Nog niet ingevuld.</span>'}</div>
        </div>
      </div>
    </div>`;
  }

  function tabOntwikkeling(sp) {
    const lijst = S.beoordelingenGesorteerd(sp);
    if (!lijst.length) {
      return `<div class="leeg">
        Nog geen beoordelingen. Leg een nulmeting vast met <strong>Nieuwe beoordeling</strong> —
        daarna zie je hier de ontwikkeling per pijler over het seizoen.
      </div>`;
    }

    const laatste = lijst[lijst.length - 1];
    const eerste = lijst[0];
    const scoresLaatste = S.pijlerScores(laatste);
    const scoresEerste = S.pijlerScores(eerste);

    const labels = App.seed.TIPS.map(p => p.label);
    const reeksen = [{ label: 'Laatste meting (' + U.datumNL(laatste.datum) + ')', waarden: App.seed.TIPS.map(p => scoresLaatste[p.sleutel] || 0) }];
    if (lijst.length > 1) {
      reeksen.push({ label: 'Nulmeting (' + U.datumNL(eerste.datum) + ')', waarden: App.seed.TIPS.map(p => scoresEerste[p.sleutel] || 0) });
    }

    const radarPaneel = `
      <div class="paneel">
        <div class="paneel-kop"><h2>Profiel op TIPS</h2></div>
        ${U.radar(labels, reeksen, 5)}
        <div class="legenda" style="margin-top:.5rem">
          <span><i style="background:rgba(53,208,127,.6)"></i>${U.esc(reeksen[0].label)}</span>
          ${reeksen[1] ? `<span><i style="background:rgba(74,163,240,.5)"></i>${U.esc(reeksen[1].label)}</span>` : ''}
        </div>
      </div>`;

    const xLabels = lijst.map(b => U.datumKort(b.datum));
    const lijnReeksen = App.seed.TIPS.map(p => ({
      label: p.label,
      waarden: lijst.map(b => S.pijlerScores(b)[p.sleutel])
    }));

    const lijnPaneel = `
      <div class="paneel">
        <div class="paneel-kop"><h2>Verloop per pijler</h2></div>
        ${U.lijnGrafiek(xLabels, lijnReeksen, 1, 5)}
        ${U.legenda(lijnReeksen)}
      </div>`;

    const ontw = S.ontwikkeling(sp);
    const detailScores = App.seed.TIPS.map(pijler => {
      const gem = scoresLaatste[pijler.sleutel];
      const delta = ontw ? ontw.perPijler[pijler.sleutel] : null;
      const criteria = pijler.criteria.map(c => {
        const w = laatste.scores ? laatste.scores[pijler.sleutel + '.' + c.sleutel] : null;
        const pct = w ? (w / 5 * 100) : 0;
        const klasse = !w ? '' : (w <= 2 ? 'rood' : (w === 3 ? 'geel' : ''));
        return `<div class="score-rij">
          <span class="dim">${U.esc(c.label)}</span>
          <span class="meter ${klasse}"><i style="width:${pct}%"></i></span>
          <span class="rechts">${w || '–'}</span>
        </div>`;
      }).join('');
      return `<div class="paneel">
        <div class="paneel-kop">
          <h3 style="color:${pijler.kleur}">${U.esc(pijler.label)}</h3>
          <span>${gem !== null ? `<strong>${U.rond(gem, 1)}</strong>` : '<span class="muted">–</span>'} ${trendPijl(delta)}</span>
        </div>
        ${criteria}
      </div>`;
    }).join('');

    const historie = lijst.slice().reverse().map(b => {
      const s = S.pijlerScores(b);
      const totaal = U.gemiddelde(Object.values(s).filter(n => n !== null));
      return `<tr>
        <td class="nowrap">${U.datumNL(b.datum)}</td>
        <td>${U.esc(b.moment || '')}</td>
        ${App.seed.TIPS.map(p => `<td class="rechts">${s[p.sleutel] !== null ? U.rond(s[p.sleutel], 1) : '–'}</td>`).join('')}
        <td class="rechts"><strong>${totaal !== null ? U.rond(totaal, 1) : '–'}</strong></td>
        <td class="rechts nowrap">
          <button class="btn btn-sm" data-actie="beoordeling-bewerk" data-id="${sp.id}" data-bid="${b.id}">Bewerk</button>
          <button class="btn btn-sm btn-gevaar" data-actie="beoordeling-verwijder" data-id="${sp.id}" data-bid="${b.id}">×</button>
        </td>
      </tr>`;
    }).join('');

    const toelichting = laatste.toelichting
      ? `<div class="paneel mt"><h3>Toelichting bij de laatste beoordeling</h3><div class="klein">${U.tekst(laatste.toelichting)}</div></div>`
      : '';

    return `<div class="grid grid-2 mb">${radarPaneel}${lijnPaneel}</div>
      <div class="grid grid-2 mb">${detailScores}</div>
      ${toelichting}
      <div class="paneel mt">
        <h2>Meetmomenten</h2>
        <div class="tabel-wrap"><table>
          <thead><tr><th>Datum</th><th>Moment</th>${App.seed.TIPS.map(p => `<th class="rechts">${p.label.slice(0, 4)}</th>`).join('')}<th class="rechts">Totaal</th><th></th></tr></thead>
          <tbody>${historie}</tbody>
        </table></div>
      </div>`;
  }

  function tabDoelen(sp) {
    const doelen = (sp.doelen || []).slice().sort((a, b) => (a.deadline || '9999').localeCompare(b.deadline || '9999'));
    const kop = `<div class="rij-tussen mb">
        <h2 style="margin:0">Individueel ontwikkelplan</h2>
        <button class="btn btn-primair btn-sm" data-actie="doel-nieuw" data-id="${sp.id}">Doel toevoegen</button>
      </div>`;

    if (!doelen.length) {
      return kop + `<div class="leeg">
        Nog geen ontwikkeldoelen. Werk met maximaal twee of drie doelen tegelijk —
        concreet geformuleerd, met een datum waarop je samen evalueert.
      </div>`;
    }

    const kaarten = doelen.map(d => {
      const dagen = U.dagenTot(d.deadline);
      const statusBadges = {
        open: '<span class="badge blauw">Loopt</span>',
        behaald: '<span class="badge groen">Behaald</span>',
        vervallen: '<span class="badge">Vervallen</span>'
      };
      const laat = d.status === 'open' && dagen !== null && dagen < 0
        ? '<span class="badge rood">Deadline verstreken</span>' : '';
      return `<div class="paneel">
        <div class="kaart-kop">
          <div>
            <strong>${U.esc(d.titel)}</strong>
            <div class="klein muted">${U.esc(d.pijler || 'algemeen')} · deadline ${U.datumNL(d.deadline)} ${dagen !== null && d.status === 'open' ? `<span class="dim">(${U.relatief(d.deadline)})</span>` : ''}</div>
          </div>
          <div class="nowrap">${statusBadges[d.status] || ''} ${laat}</div>
        </div>
        ${d.omschrijving ? `<p class="klein" style="margin:.5rem 0">${U.tekst(d.omschrijving)}</p>` : ''}
        ${d.acties ? `<div class="klein"><span class="muted">Acties:</span><br>${U.tekst(d.acties)}</div>` : ''}
        ${d.evaluatie ? `<div class="klein mt" style="border-top:1px solid var(--line);padding-top:.5rem"><span class="muted">Evaluatie:</span><br>${U.tekst(d.evaluatie)}</div>` : ''}
        <div class="rij mt">
          <button class="btn btn-sm" data-actie="doel-bewerk" data-id="${sp.id}" data-did="${d.id}">Bewerken</button>
          ${d.status === 'open' ? `<button class="btn btn-sm" data-actie="doel-behaald" data-id="${sp.id}" data-did="${d.id}">Markeer behaald</button>` : ''}
          <button class="btn btn-sm btn-gevaar" data-actie="doel-verwijder" data-id="${sp.id}" data-did="${d.id}">Verwijderen</button>
        </div>
      </div>`;
    }).join('');

    return kop + `<div class="grid grid-2">${kaarten}</div>`;
  }

  function tabLogboek(sp) {
    const notities = (sp.notities || []).slice().sort((a, b) => (b.datum || '').localeCompare(a.datum || ''));
    const kop = `<div class="rij-tussen mb">
      <h2 style="margin:0">Logboek</h2>
      <button class="btn btn-primair btn-sm" data-actie="notitie-nieuw" data-id="${sp.id}">Notitie toevoegen</button>
    </div>`;

    if (!notities.length) {
      return kop + `<div class="leeg">Nog geen notities. Leg gesprekken, opvallende momenten en afspraken hier vast.</div>`;
    }

    return kop + '<div class="grid">' + notities.map(n => `
      <div class="paneel">
        <div class="kaart-kop">
          <div><strong>${U.datumNL(n.datum, true)}</strong> ${n.soort ? `<span class="badge">${U.esc(n.soort)}</span>` : ''}</div>
          <button class="btn btn-sm btn-gevaar" data-actie="notitie-verwijder" data-id="${sp.id}" data-nid="${n.id}">×</button>
        </div>
        <div class="klein mt">${U.tekst(n.tekst)}</div>
      </div>`).join('') + '</div>';
  }

  function tabStatistieken(sp) {
    const aanw = S.aanwezigheidStats(sp.id);
    const speel = S.speelStats(sp.id);
    const cijfer = S.gemiddeldCijfer(sp.id);

    const kpi = (label, waarde, voet) => `<div class="paneel kpi">
      <div class="label">${label}</div><div class="waarde">${waarde}</div>
      ${voet ? `<div class="voet">${voet}</div>` : ''}
    </div>`;

    const wedstrijden = S.wedstrijdenGesorteerd().filter(w => w.gespeeld);
    const rijen = wedstrijden.map(w => {
      const min = Number((w.minuten || {})[sp.id] || 0);
      const rap = (w.rapporten || {})[sp.id] || {};
      const inBasis = Object.values(w.opstelling || {}).indexOf(sp.id) !== -1;
      return `<tr>
        <td class="nowrap">${U.datumKort(w.datum)}</td>
        <td>${w.thuis ? '' : 'uit — '}${U.esc(w.tegenstander)}</td>
        <td class="nowrap">${w.doelpuntenVoor !== null ? w.doelpuntenVoor + ' - ' + w.doelpuntenTegen : '–'}</td>
        <td>${min ? (inBasis ? '<span class="badge groen">basis</span>' : '<span class="badge">invaller</span>') : '<span class="badge rood">niet gespeeld</span>'}</td>
        <td class="rechts">${min || 0}'</td>
        <td class="rechts">${typeof rap.cijfer === 'number' ? U.rond(rap.cijfer, 1) : '–'}</td>
        <td class="klein dim">${U.esc(rap.notitie || '')}</td>
      </tr>`;
    }).join('');

    return `<div class="grid grid-4 mb">
        ${kpi('Speelminuten', speel.minuten + "'", speel.wedstrijden + ' wedstrijden · ' + speel.basis + '× basis')}
        ${kpi('Aanwezigheid', aanw.percentage !== null ? aanw.percentage + '%' : '–', aanw.geteld ? `${aanw.aanwezig} van ${aanw.geteld} trainingen` : 'nog niet geregistreerd')}
        ${kpi('Gem. wedstrijdcijfer', cijfer !== null ? U.rond(cijfer, 1) : '–', 'over beoordeelde wedstrijden')}
        ${kpi('Gemist door blessure', aanw.blessure, 'trainingen')}
      </div>
      <div class="paneel">
        <h2>Per wedstrijd</h2>
        <div class="tabel-wrap"><table>
          <thead><tr><th>Datum</th><th>Tegenstander</th><th>Uitslag</th><th>Rol</th><th class="rechts">Min.</th><th class="rechts">Cijfer</th><th>Notitie</th></tr></thead>
          <tbody>${rijen || '<tr><td colspan="7" class="muted">Nog geen gespeelde wedstrijden vastgelegd.</td></tr>'}</tbody>
        </table></div>
      </div>`;
  }

  /* --------------------------- formulieren --------------------------- */

  function spelerFormulier(sp) {
    const bestaat = !!sp;
    const s = sp || S.nieuweSpeler();
    const posChips = App.seed.POSITIES.map(p =>
      `<span class="chip ${(s.posities || []).indexOf(p) !== -1 ? 'aan' : ''}" data-pos="${U.esc(p)}">${U.esc(p)}</span>`
    ).join(' ');

    const body = U.modal(bestaat ? 'Speler bewerken' : 'Nieuwe speler', `
      <div class="veld-rij">
        <label class="veld"><span>Voornaam</span><input name="voornaam" value="${U.esc(s.voornaam)}" required></label>
        <label class="veld"><span>Achternaam</span><input name="achternaam" value="${U.esc(s.achternaam)}"></label>
        <label class="veld"><span>Rugnummer</span><input type="number" name="rugnummer" min="1" max="99" value="${s.rugnummer !== null && s.rugnummer !== undefined ? s.rugnummer : ''}"></label>
      </div>
      <div class="veld-rij">
        <label class="veld"><span>Geboortedatum</span><input type="date" name="geboortedatum" value="${U.esc(s.geboortedatum)}"></label>
        <label class="veld"><span>Voorkeursbeen</span><select name="been">${U.selectOpties(['rechts', 'links', 'tweebenig'], s.been)}</select></label>
      </div>
      <label class="veld"><span>Posities</span><div class="rij" id="posChips">${posChips}</div></label>
      <div class="veld-rij">
        <label class="veld"><span>Status</span><select name="status">${U.selectOpties(App.seed.STATUSSEN.map(x => ({ waarde: x.waarde, label: x.label })), s.status)}</select></label>
        <label class="veld"><span>Toelichting status</span><input name="statusToelichting" value="${U.esc(s.statusToelichting)}" placeholder="bv. enkelblessure, terug week 12"></label>
      </div>
      <div class="veld-rij">
        <label class="veld"><span>Lengte (cm)</span><input type="number" name="lengte" value="${s.lengte || ''}"></label>
        <label class="veld"><span>Gewicht (kg)</span><input type="number" name="gewicht" value="${s.gewicht || ''}"></label>
        <label class="veld"><span>Telefoon</span><input name="telefoon" value="${U.esc(s.telefoon)}"></label>
      </div>
      <label class="veld"><span>Contact ouder/verzorger</span><input name="contactOuder" value="${U.esc(s.contactOuder)}"></label>
      <label class="veld"><span>Sterke punten</span><textarea name="sterktes">${U.esc(s.sterktes)}</textarea></label>
      <label class="veld"><span>Ontwikkelpunten</span><textarea name="ontwikkelpunten">${U.esc(s.ontwikkelpunten)}</textarea></label>
      <div class="modal-acties">
        ${bestaat ? `<button class="btn btn-gevaar" data-actie="speler-verwijder" data-id="${s.id}">Verwijderen</button>` : ''}
        <button class="btn" data-actie="modal-close">Annuleren</button>
        <button class="btn btn-primair" id="opslaanSpeler">Opslaan</button>
      </div>`);

    U.$$('#posChips .chip', body).forEach(chip => {
      chip.addEventListener('click', () => chip.classList.toggle('aan'));
    });

    U.$('#opslaanSpeler', body).addEventListener('click', () => {
      const data = U.formData(body);
      if (!data.voornaam.trim()) { U.toast('Vul minimaal een voornaam in.'); return; }
      data.posities = U.$$('#posChips .chip.aan', body).map(c => c.dataset.pos);
      S.wijzig(st => {
        if (bestaat) {
          Object.assign(st.spelers.find(x => x.id === s.id), data);
        } else {
          st.spelers.push(Object.assign(S.nieuweSpeler(), data));
        }
      });
      U.sluitModal();
      U.toast('Speler opgeslagen');
      App.router.herteken(true);
    });
  }

  function snelToevoegen() {
    const body = U.modal('Selectie snel invoeren', `
      <p class="klein muted">Eén speler per regel, in de vorm <code>rugnummer, voornaam achternaam, positie</code>.
      Rugnummer en positie zijn optioneel — <code>Sam de Vries</code> werkt ook.</p>
      <label class="veld"><span>Spelers</span>
        <textarea id="bulk" rows="10" placeholder="1, Daan Kramer, Keeper&#10;4, Youssef El Amrani, Centrale verdediger&#10;Sam de Vries"></textarea>
      </label>
      <div class="modal-acties">
        <button class="btn" data-actie="modal-close">Annuleren</button>
        <button class="btn btn-primair" id="bulkOpslaan">Toevoegen</button>
      </div>`);

    U.$('#bulkOpslaan', body).addEventListener('click', () => {
      const regels = U.$('#bulk', body).value.split('\n').map(r => r.trim()).filter(Boolean);
      let aantal = 0;
      S.wijzig(st => {
        regels.forEach(regel => {
          const delen = regel.split(',').map(d => d.trim());
          let rugnummer = null, naamDeel, positie = '';
          if (delen.length >= 2 && /^\d+$/.test(delen[0])) {
            rugnummer = Number(delen[0]);
            naamDeel = delen[1];
            positie = delen[2] || '';
          } else {
            naamDeel = delen[0];
            positie = delen[1] || '';
          }
          if (!naamDeel) return;
          const woorden = naamDeel.split(/\s+/);
          const gevonden = App.seed.POSITIES.find(p => p.toLowerCase() === positie.toLowerCase());
          st.spelers.push(S.nieuweSpeler({
            voornaam: woorden.shift(),
            achternaam: woorden.join(' '),
            rugnummer,
            posities: gevonden ? [gevonden] : []
          }));
          aantal++;
        });
      });
      U.sluitModal();
      U.toast(aantal + ' spelers toegevoegd');
      App.router.herteken(true);
    });
  }

  function beoordelingFormulier(spelerId, beoordelingId) {
    const sp = S.speler(spelerId);
    const bestaand = beoordelingId ? (sp.beoordelingen || []).find(b => b.id === beoordelingId) : null;
    const vorige = bestaand ? null : S.laatsteBeoordeling(sp);
    const scores = Object.assign({}, (bestaand && bestaand.scores) || (vorige && vorige.scores) || {});

    const schaal = Object.keys(App.seed.SCORE_LABELS)
      .map(n => ({ waarde: n, label: n + ' — ' + App.seed.SCORE_LABELS[n] }));

    const pijlers = App.seed.TIPS.map(p => `
      <div class="paneel" style="margin-bottom:.8rem">
        <h3 style="color:${p.kleur}">${U.esc(p.label)}</h3>
        <div class="veld-rij">
          ${p.criteria.map(c => {
            const sleutel = p.sleutel + '.' + c.sleutel;
            return `<label class="veld"><span>${U.esc(c.label)}</span>
              <select name="${sleutel}">${U.selectOpties(schaal, scores[sleutel], '–')}</select></label>`;
          }).join('')}
        </div>
      </div>`).join('');

    const body = U.modal(bestaand ? 'Beoordeling bewerken' : 'Nieuwe beoordeling — ' + U.naam(sp), `
      <div class="veld-rij">
        <label class="veld"><span>Datum</span><input type="date" name="datum" value="${U.esc(bestaand ? bestaand.datum : U.vandaag())}"></label>
        <label class="veld"><span>Meetmoment</span>
          <select name="moment">${U.selectOpties(['Nulmeting', 'Tussenevaluatie najaar', 'Winterevaluatie', 'Tussenevaluatie voorjaar', 'Eindevaluatie', 'Los moment'], bestaand ? bestaand.moment : '')}</select>
        </label>
      </div>
      ${vorige ? '<p class="klein muted">De scores van de vorige meting zijn alvast ingevuld — pas aan wat veranderd is.</p>' : ''}
      ${pijlers}
      <label class="veld"><span>Toelichting</span><textarea name="toelichting" rows="4" placeholder="Wat valt op? Waar zit de groei, waar de rem?">${U.esc(bestaand ? bestaand.toelichting : '')}</textarea></label>
      <div class="modal-acties">
        <button class="btn" data-actie="modal-close">Annuleren</button>
        <button class="btn btn-primair" id="opslaanBeoordeling">Opslaan</button>
      </div>`);

    U.$('#opslaanBeoordeling', body).addEventListener('click', () => {
      const ruw = U.formData(body);
      const nieuweScores = {};
      Object.keys(ruw).forEach(k => {
        if (k.indexOf('.') !== -1 && ruw[k] !== '') nieuweScores[k] = Number(ruw[k]);
      });
      S.wijzig(st => {
        const doel = st.spelers.find(x => x.id === spelerId);
        doel.beoordelingen = doel.beoordelingen || [];
        if (bestaand) {
          const b = doel.beoordelingen.find(x => x.id === beoordelingId);
          Object.assign(b, { datum: ruw.datum, moment: ruw.moment, toelichting: ruw.toelichting, scores: nieuweScores });
        } else {
          doel.beoordelingen.push({
            id: U.uid('bo'), datum: ruw.datum, moment: ruw.moment,
            toelichting: ruw.toelichting, scores: nieuweScores
          });
        }
      });
      U.sluitModal();
      U.toast('Beoordeling opgeslagen');
      tab = 'ontwikkeling';
      App.router.herteken(true);
    });
  }

  function doelFormulier(spelerId, doelId) {
    const sp = S.speler(spelerId);
    const d = doelId ? (sp.doelen || []).find(x => x.id === doelId) : null;
    const overWeken = new Date(Date.now() + 56 * 86400000).toISOString().slice(0, 10);

    const body = U.modal(d ? 'Doel bewerken' : 'Nieuw ontwikkeldoel', `
      <label class="veld"><span>Doel</span>
        <input name="titel" value="${U.esc(d ? d.titel : '')}" placeholder="bv. Vaker scannen vóór balaanname">
      </label>
      <div class="veld-rij">
        <label class="veld"><span>Pijler</span>
          <select name="pijler">${U.selectOpties(App.seed.TIPS.map(p => p.label).concat(['Algemeen']), d ? d.pijler : 'Algemeen')}</select>
        </label>
        <label class="veld"><span>Evaluatiedatum</span><input type="date" name="deadline" value="${U.esc(d ? d.deadline : overWeken)}"></label>
        <label class="veld"><span>Status</span>
          <select name="status">${U.selectOpties([
            { waarde: 'open', label: 'Loopt' },
            { waarde: 'behaald', label: 'Behaald' },
            { waarde: 'vervallen', label: 'Vervallen' }
          ], d ? d.status : 'open')}</select>
        </label>
      </div>
      <label class="veld"><span>Wat wil je precies zien?</span>
        <textarea name="omschrijving" placeholder="Beschrijf het gedrag dat je wilt zien in wedstrijden.">${U.esc(d ? d.omschrijving : '')}</textarea>
      </label>
      <label class="veld"><span>Acties — wat gaan speler en trainer doen?</span>
        <textarea name="acties" placeholder="bv. elke training rondo met scan-opdracht; beeldanalyse na wedstrijd 3">${U.esc(d ? d.acties : '')}</textarea>
      </label>
      <label class="veld"><span>Evaluatie</span>
        <textarea name="evaluatie" placeholder="In te vullen bij de evaluatiedatum.">${U.esc(d ? d.evaluatie : '')}</textarea>
      </label>
      <div class="modal-acties">
        <button class="btn" data-actie="modal-close">Annuleren</button>
        <button class="btn btn-primair" id="opslaanDoel">Opslaan</button>
      </div>`);

    U.$('#opslaanDoel', body).addEventListener('click', () => {
      const data = U.formData(body);
      if (!data.titel.trim()) { U.toast('Geef het doel een titel.'); return; }
      S.wijzig(st => {
        const doel = st.spelers.find(x => x.id === spelerId);
        doel.doelen = doel.doelen || [];
        if (d) Object.assign(doel.doelen.find(x => x.id === doelId), data);
        else doel.doelen.push(Object.assign({ id: U.uid('dl') }, data));
      });
      U.sluitModal();
      U.toast('Doel opgeslagen');
      App.router.herteken(true);
    });
  }

  function notitieFormulier(spelerId) {
    const body = U.modal('Notitie toevoegen', `
      <div class="veld-rij">
        <label class="veld"><span>Datum</span><input type="date" name="datum" value="${U.vandaag()}"></label>
        <label class="veld"><span>Soort</span>
          <select name="soort">${U.selectOpties(['Observatie', 'Gesprek', 'Blessure', 'Gedrag', 'Wedstrijd', 'Overig'], 'Observatie')}</select>
        </label>
      </div>
      <label class="veld"><span>Notitie</span><textarea name="tekst" rows="6" autofocus></textarea></label>
      <div class="modal-acties">
        <button class="btn" data-actie="modal-close">Annuleren</button>
        <button class="btn btn-primair" id="opslaanNotitie">Opslaan</button>
      </div>`);

    U.$('#opslaanNotitie', body).addEventListener('click', () => {
      const data = U.formData(body);
      if (!data.tekst.trim()) { U.toast('De notitie is nog leeg.'); return; }
      S.wijzig(st => {
        const sp = st.spelers.find(x => x.id === spelerId);
        sp.notities = sp.notities || [];
        sp.notities.push(Object.assign({ id: U.uid('nt') }, data));
      });
      U.sluitModal();
      U.toast('Notitie opgeslagen');
      App.router.herteken(true);
    });
  }

  /* ---------------------------- registratie ---------------------------- */

  const acties = {
    'speler-nieuw': () => spelerFormulier(null),
    'spelers-import': () => snelToevoegen(),
    'speler-open': (el) => { tab = 'profiel'; location.hash = '#/speler/' + el.dataset.id; },
    'speler-bewerk': (el) => spelerFormulier(S.speler(el.dataset.id)),
    'speler-verwijder': (el) => {
      const sp = S.speler(el.dataset.id);
      if (!U.bevestig('Speler ' + U.naam(sp) + ' definitief verwijderen?')) return;
      S.wijzig(st => { st.spelers = st.spelers.filter(x => x.id !== sp.id); });
      U.sluitModal();
      location.hash = '#/spelers';
      U.toast('Speler verwijderd');
    },
    'tab': (el) => { tab = el.dataset.tab; App.router.herteken(true); },
    'beoordeling-nieuw': (el) => beoordelingFormulier(el.dataset.id, null),
    'beoordeling-bewerk': (el) => beoordelingFormulier(el.dataset.id, el.dataset.bid),
    'beoordeling-verwijder': (el) => {
      if (!U.bevestig('Deze beoordeling verwijderen?')) return;
      S.wijzig(st => {
        const sp = st.spelers.find(x => x.id === el.dataset.id);
        sp.beoordelingen = sp.beoordelingen.filter(b => b.id !== el.dataset.bid);
      });
      App.router.herteken(true);
    },
    'doel-nieuw': (el) => doelFormulier(el.dataset.id, null),
    'doel-bewerk': (el) => doelFormulier(el.dataset.id, el.dataset.did),
    'doel-behaald': (el) => {
      S.wijzig(st => {
        const sp = st.spelers.find(x => x.id === el.dataset.id);
        sp.doelen.find(d => d.id === el.dataset.did).status = 'behaald';
      });
      U.toast('Doel afgevinkt');
      App.router.herteken(true);
    },
    'doel-verwijder': (el) => {
      if (!U.bevestig('Dit doel verwijderen?')) return;
      S.wijzig(st => {
        const sp = st.spelers.find(x => x.id === el.dataset.id);
        sp.doelen = sp.doelen.filter(d => d.id !== el.dataset.did);
      });
      App.router.herteken(true);
    },
    'notitie-nieuw': (el) => notitieFormulier(el.dataset.id),
    'notitie-verwijder': (el) => {
      if (!U.bevestig('Deze notitie verwijderen?')) return;
      S.wijzig(st => {
        const sp = st.spelers.find(x => x.id === el.dataset.id);
        sp.notities = sp.notities.filter(n => n.id !== el.dataset.nid);
      });
      App.router.herteken(true);
    }
  };

  App.views.spelers = { render: renderLijst, na: naLijst, acties };
  App.views.speler = { render: renderDetail, acties };
})();
