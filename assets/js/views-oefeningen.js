/* Oefenstof: bibliotheek met filters, eigen oefeningen toevoegen en bewerken. */

(function () {
  const U = App.util, S = App.store;

  let filter = { zoek: '', categorie: '', thema: '' };

  function render() {
    const alle = S.get().oefeningen;
    const zoek = filter.zoek.toLowerCase();

    const gefilterd = alle.filter(o => {
      if (filter.categorie && o.categorie !== filter.categorie) return false;
      if (filter.thema && (o.thema || []).indexOf(filter.thema) === -1) return false;
      if (zoek) {
        const hooiberg = (o.naam + ' ' + o.organisatie + ' ' + (o.coachpunten || []).join(' ')).toLowerCase();
        if (hooiberg.indexOf(zoek) === -1) return false;
      }
      return true;
    }).sort((a, b) => a.categorie.localeCompare(b.categorie) || a.naam.localeCompare(b.naam));

    const kop = `
      <div class="paginakop">
        <div>
          <h1>Oefenstof</h1>
          <div class="sub">${alle.length} oefeningen · ${gefilterd.length} zichtbaar</div>
        </div>
        <div class="kop-acties">
          <button class="btn btn-primair" data-actie="oefening-nieuw">Oefening toevoegen</button>
        </div>
      </div>`;

    const filters = `
      <div class="paneel mb">
        <div class="veld-rij">
          <label class="veld"><span>Zoeken</span><input type="search" id="oZoek" value="${U.esc(filter.zoek)}" placeholder="Naam, organisatie, coachpunt..."></label>
          <label class="veld"><span>Categorie</span><select id="oCat">${U.selectOpties(App.seed.CATEGORIEEN, filter.categorie, 'Alle categorieën')}</select></label>
          <label class="veld"><span>Thema</span><select id="oThema">${U.selectOpties(App.seed.THEMAS, filter.thema, 'Alle thema\'s')}</select></label>
        </div>
      </div>`;

    if (!gefilterd.length) {
      return kop + filters + '<div class="leeg">Geen oefeningen gevonden met deze filters.</div>';
    }

    const kaarten = gefilterd.map(o => `
      <div class="paneel">
        <div class="kaart-kop">
          <div>
            <strong>${U.esc(o.naam)}</strong>
            <div class="klein muted">${U.esc(o.categorie)}${o.eigen ? ' · <span class="badge groen">eigen</span>' : ''}</div>
          </div>
          <span class="badge">${o.duur} min</span>
        </div>
        <div class="klein muted mt">${o.spelers ? U.esc(o.spelers) + ' spelers' : ''}${o.veld ? ' · ' + U.esc(o.veld) : ''}</div>
        <div class="klein mt" style="max-height:4.6em;overflow:hidden">${U.esc(o.organisatie)}</div>
        <div class="rij mt">
          ${(o.thema || []).map(t => `<span class="badge blauw">${U.esc(t)}</span>`).join('')}
        </div>
        <div class="rij mt">
          <button class="btn btn-sm" data-actie="oefening-toon" data-id="${o.id}">Bekijken</button>
          <button class="btn btn-sm" data-actie="oefening-naar-training" data-id="${o.id}">Inplannen</button>
          ${o.eigen ? `<button class="btn btn-sm" data-actie="oefening-bewerk" data-id="${o.id}">Bewerken</button>` : ''}
        </div>
      </div>`).join('');

    return kop + filters + `<div class="grid grid-3">${kaarten}</div>`;
  }

  function na() {
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
    bind('oZoek', 'zoek');
    bind('oCat', 'categorie');
    bind('oThema', 'thema');
  }

  function toon(id) {
    const o = S.oefening(id);
    if (!o) return;
    U.modal(o.naam, `
      <div class="rij mb">
        <span class="badge">${U.esc(o.categorie)}</span>
        <span class="badge">${o.duur} min</span>
        ${o.spelers ? `<span class="badge">${U.esc(o.spelers)} spelers</span>` : ''}
        ${o.veld ? `<span class="badge">${U.esc(o.veld)}</span>` : ''}
      </div>
      <h3>Organisatie</h3>
      <p class="klein">${U.tekst(o.organisatie)}</p>
      ${(o.coachpunten || []).length ? `<h3 class="mt">Coachpunten</h3>
        <ul class="klein">${o.coachpunten.map(c => `<li>${U.esc(c)}</li>`).join('')}</ul>` : ''}
      ${(o.variaties || []).length ? `<h3 class="mt">Variaties</h3>
        <ul class="klein">${o.variaties.map(v => `<li>${U.esc(v)}</li>`).join('')}</ul>` : ''}
      ${(o.thema || []).length ? `<div class="rij mt">${o.thema.map(t => `<span class="badge blauw">${U.esc(t)}</span>`).join('')}</div>` : ''}
      <div class="modal-acties">
        <button class="btn" data-actie="oefening-naar-training" data-id="${o.id}">Inplannen in training</button>
        <button class="btn btn-primair" data-actie="modal-close">Sluiten</button>
      </div>`);
  }

  function formulier(o) {
    const bestaat = !!o;
    const x = o || S.nieuweOefening();
    const themaChips = App.seed.THEMAS.map(t =>
      `<span class="chip ${(x.thema || []).indexOf(t) !== -1 ? 'aan' : ''}" data-thema="${U.esc(t)}">${U.esc(t)}</span>`
    ).join(' ');

    const body = U.modal(bestaat ? 'Oefening bewerken' : 'Nieuwe oefening', `
      <label class="veld"><span>Naam</span><input name="naam" value="${U.esc(x.naam)}"></label>
      <div class="veld-rij">
        <label class="veld"><span>Categorie</span><select name="categorie">${U.selectOpties(App.seed.CATEGORIEEN, x.categorie)}</select></label>
        <label class="veld"><span>Duur (min)</span><input type="number" name="duur" min="1" max="120" value="${x.duur}"></label>
        <label class="veld"><span>Aantal spelers</span><input name="spelers" value="${U.esc(x.spelers)}" placeholder="8-14"></label>
        <label class="veld"><span>Veldafmeting</span><input name="veld" value="${U.esc(x.veld)}" placeholder="30x25m"></label>
      </div>
      <label class="veld"><span>Thema's</span><div class="rij" id="themaChips">${themaChips}</div></label>
      <label class="veld"><span>Organisatie</span><textarea name="organisatie" rows="4">${U.esc(x.organisatie)}</textarea></label>
      <label class="veld"><span>Coachpunten (één per regel)</span><textarea name="coachpunten" rows="4">${U.esc((x.coachpunten || []).join('\n'))}</textarea></label>
      <label class="veld"><span>Variaties (één per regel)</span><textarea name="variaties" rows="3">${U.esc((x.variaties || []).join('\n'))}</textarea></label>
      <div class="modal-acties">
        ${bestaat ? `<button class="btn btn-gevaar" data-actie="oefening-verwijder" data-id="${x.id}">Verwijderen</button>` : ''}
        <button class="btn" data-actie="modal-close">Annuleren</button>
        <button class="btn btn-primair" id="opslaanOefening">Opslaan</button>
      </div>`);

    U.$$('#themaChips .chip', body).forEach(c => c.addEventListener('click', () => c.classList.toggle('aan')));

    U.$('#opslaanOefening', body).addEventListener('click', () => {
      const data = U.formData(body);
      if (!data.naam.trim()) { U.toast('Geef de oefening een naam.'); return; }
      data.thema = U.$$('#themaChips .chip.aan', body).map(c => c.dataset.thema);
      data.coachpunten = data.coachpunten.split('\n').map(s => s.trim()).filter(Boolean);
      data.variaties = data.variaties.split('\n').map(s => s.trim()).filter(Boolean);
      S.wijzig(st => {
        if (bestaat) Object.assign(st.oefeningen.find(y => y.id === x.id), data);
        else st.oefeningen.push(Object.assign(S.nieuweOefening(), data));
      });
      U.sluitModal();
      U.toast('Oefening opgeslagen');
      App.router.herteken(true);
    });
  }

  // Oefening als blok toevoegen aan een gekozen training.
  function inplannen(oefeningId) {
    const oef = S.oefening(oefeningId);
    const komend = S.trainingenGesorteerd().filter(t => t.datum >= U.vandaag());
    if (!komend.length) {
      U.sluitModal();
      U.toast('Plan eerst een training in.');
      return;
    }

    const body = U.modal('Inplannen: ' + oef.naam, `
      <label class="veld"><span>Training</span>
        <select name="trainingId">${U.selectOpties(komend.map(t => ({
          waarde: t.id,
          label: U.datumNL(t.datum, true) + ' — ' + (t.thema || 'training')
        })))}</select>
      </label>
      <div class="veld-rij">
        <label class="veld"><span>Fase</span>
          <select name="fase">${U.selectOpties(App.seed.FASES.map(f => ({ waarde: f.waarde, label: f.label })),
            oef.categorie === 'Warming-up' ? 'warming' : (oef.categorie === 'Partijvormen' ? 'slot' : 'hoofd'))}</select>
        </label>
        <label class="veld"><span>Duur (min)</span><input type="number" name="duur" value="${oef.duur}" min="1"></label>
      </div>
      <label class="veld"><span>Eigen aantekening</span><textarea name="notitie"></textarea></label>
      <div class="modal-acties">
        <button class="btn" data-actie="modal-close">Annuleren</button>
        <button class="btn btn-primair" id="planIn">Toevoegen</button>
      </div>`);

    U.$('#planIn', body).addEventListener('click', () => {
      const data = U.formData(body);
      S.wijzig(st => {
        const t = st.trainingen.find(y => y.id === data.trainingId);
        t.blokken = t.blokken || [];
        t.blokken.push({
          naam: oef.naam, oefeningId: oef.id,
          fase: data.fase, duur: data.duur, notitie: data.notitie
        });
      });
      U.sluitModal();
      U.toast('Toegevoegd aan de training');
    });
  }

  const acties = {
    'oefening-nieuw': () => formulier(null),
    'oefening-toon': (el) => toon(el.dataset.id),
    'oefening-bewerk': (el) => formulier(S.oefening(el.dataset.id)),
    'oefening-naar-training': (el) => inplannen(el.dataset.id),
    'oefening-verwijder': (el) => {
      if (!U.bevestig('Deze oefening verwijderen?')) return;
      S.wijzig(st => { st.oefeningen = st.oefeningen.filter(o => o.id !== el.dataset.id); });
      U.sluitModal();
      App.router.herteken(true);
    }
  };

  App.views.oefeningen = { render, na, acties };
})();
