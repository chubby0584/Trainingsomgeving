/* Hulpfuncties: DOM, datum, opmaak en kleine SVG-grafieken. */

window.App = window.App || {};
App.views = App.views || {};

App.util = (function () {

  const $  = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function uid(prefix) {
    return (prefix || 'id') + '-' + Math.random().toString(36).slice(2, 9);
  }

  /* --- tekst --- */

  function esc(waarde) {
    if (waarde === null || waarde === undefined) return '';
    return String(waarde)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Meerregelige tekst veilig tonen met behoud van regeleindes.
  function tekst(waarde) {
    return esc(waarde).replace(/\n/g, '<br>');
  }

  function initialen(speler) {
    return ((speler.voornaam || '?')[0] + (speler.achternaam || '')[0] || '').toUpperCase();
  }

  function naam(speler) {
    if (!speler) return 'Onbekend';
    return (speler.voornaam + ' ' + (speler.achternaam || '')).trim();
  }

  // "Sam de Vries" wordt "Sam V." — tussenvoegsels leveren geen bruikbare initiaal.
  function kortenaam(speler) {
    if (!speler) return '—';
    const delen = (speler.achternaam || '').trim().split(/\s+/).filter(Boolean);
    const kern = delen.length ? delen[delen.length - 1] : '';
    return kern ? speler.voornaam + ' ' + kern[0].toUpperCase() + '.' : speler.voornaam;
  }

  /* --- datum --- */

  const DAGEN = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
  const MAANDEN = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

  function vandaag() {
    return new Date().toISOString().slice(0, 10);
  }

  function datumNL(iso, metDag) {
    if (!iso) return '—';
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return iso;
    const basis = d.getDate() + ' ' + MAANDEN[d.getMonth()] + ' ' + d.getFullYear();
    return metDag ? DAGEN[d.getDay()] + ' ' + basis : basis;
  }

  function datumKort(iso) {
    if (!iso) return '—';
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return iso;
    return DAGEN[d.getDay()] + ' ' + d.getDate() + ' ' + MAANDEN[d.getMonth()];
  }

  function dagenTot(iso) {
    if (!iso) return null;
    const nu = new Date(vandaag() + 'T00:00:00');
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return null;
    return Math.round((d - nu) / 86400000);
  }

  function relatief(iso) {
    const n = dagenTot(iso);
    if (n === null) return '';
    if (n === 0) return 'vandaag';
    if (n === 1) return 'morgen';
    if (n === -1) return 'gisteren';
    if (n > 1) return 'over ' + n + ' dagen';
    return Math.abs(n) + ' dagen geleden';
  }

  function leeftijd(geboortedatum, opDatum) {
    if (!geboortedatum) return null;
    const g = new Date(geboortedatum + 'T00:00:00');
    const p = new Date((opDatum || vandaag()) + 'T00:00:00');
    if (isNaN(g) || isNaN(p)) return null;
    let jaar = p.getFullYear() - g.getFullYear();
    const m = p.getMonth() - g.getMonth();
    if (m < 0 || (m === 0 && p.getDate() < g.getDate())) jaar--;
    return jaar;
  }

  // Sorteert oplopend op datumveld; verleden eerst.
  function opDatum(a, b) {
    return (a.datum || '').localeCompare(b.datum || '');
  }

  /* --- getallen --- */

  function rond(getal, decimalen) {
    const f = Math.pow(10, decimalen === undefined ? 1 : decimalen);
    return Math.round(getal * f) / f;
  }

  function gemiddelde(lijst) {
    const geldig = lijst.filter(n => typeof n === 'number' && !isNaN(n));
    if (!geldig.length) return null;
    return geldig.reduce((a, b) => a + b, 0) / geldig.length;
  }

  function klem(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  /* --- UI --- */

  let toastTimer = null;
  function toast(bericht) {
    const el = $('#toast');
    el.textContent = bericht;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2400);
  }

  function modal(titel, html) {
    $('#modalTitel').textContent = titel;
    $('#modalBody').innerHTML = html;
    $('#modalBackdrop').hidden = false;
    const eerste = $('#modalBody input, #modalBody select, #modalBody textarea');
    if (eerste) eerste.focus();
    return $('#modalBody');
  }

  function sluitModal() {
    $('#modalBackdrop').hidden = true;
    $('#modalBody').innerHTML = '';
  }

  function bevestig(vraag) {
    return window.confirm(vraag);
  }

  function download(bestandsnaam, inhoud, type) {
    const blob = new Blob([inhoud], { type: type || 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = bestandsnaam;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Leest alle [name]-velden binnen een container uit naar een object.
  function formData(root) {
    const uit = {};
    $$('[name]', root).forEach(veld => {
      if (veld.type === 'checkbox') {
        uit[veld.name] = veld.checked;
      } else if (veld.type === 'number' || veld.type === 'range') {
        uit[veld.name] = veld.value === '' ? null : Number(veld.value);
      } else {
        uit[veld.name] = veld.value;
      }
    });
    return uit;
  }

  function selectOpties(opties, geselecteerd, leegLabel) {
    let html = leegLabel ? `<option value="">${esc(leegLabel)}</option>` : '';
    html += opties.map(o => {
      const waarde = typeof o === 'string' ? o : o.waarde;
      const label  = typeof o === 'string' ? o : o.label;
      const aan = String(waarde) === String(geselecteerd) ? ' selected' : '';
      return `<option value="${esc(waarde)}"${aan}>${esc(label)}</option>`;
    }).join('');
    return html;
  }

  /* --- kleine SVG-grafieken --- */

  const KLEUREN = ['#35d07f', '#4aa3f0', '#f0b429', '#a78bfa', '#ef5f5f'];

  // Radar voor 3-8 assen, waarden op schaal 1..max.
  // Breder dan hoog, zodat de labels links en rechts van de assen passen.
  function radar(labels, reeksen, max) {
    const breedte = 300, hoogte = 220, midX = breedte / 2, mid = hoogte / 2, straal = 70;
    const n = labels.length;
    const top = max || 5;
    if (!n) return '';

    const punt = (i, waarde) => {
      const hoek = (Math.PI * 2 * i / n) - Math.PI / 2;
      const r = straal * (waarde / top);
      return [midX + r * Math.cos(hoek), mid + r * Math.sin(hoek)];
    };

    let svg = `<svg class="chart" viewBox="0 0 ${breedte} ${hoogte}" role="img">`;

    // web
    for (let ring = 1; ring <= top; ring++) {
      const pad = labels.map((_, i) => punt(i, ring).join(',')).join(' ');
      svg += `<polygon class="radar-net" points="${pad}" opacity="${ring === top ? .9 : .4}"/>`;
    }
    labels.forEach((_, i) => {
      const [x, y] = punt(i, top);
      svg += `<line class="as" x1="${midX}" y1="${mid}" x2="${x}" y2="${y}"/>`;
    });

    // reeksen (max 2: huidig + vergelijking)
    reeksen.forEach((reeks, idx) => {
      const pad = reeks.waarden.map((w, i) => punt(i, w || 0).join(',')).join(' ');
      svg += `<polygon class="${idx === 0 ? 'radar-vlak' : 'radar-vlak2'}" points="${pad}"/>`;
    });

    // labels
    labels.forEach((label, i) => {
      const hoek = (Math.PI * 2 * i / n) - Math.PI / 2;
      const x = midX + (straal + 14) * Math.cos(hoek);
      const y = mid + (straal + 16) * Math.sin(hoek);
      const anker = Math.abs(Math.cos(hoek)) < .3 ? 'middle' : (Math.cos(hoek) > 0 ? 'start' : 'end');
      svg += `<text x="${rond(x, 1)}" y="${rond(y + 3, 1)}" text-anchor="${anker}">${esc(label)}</text>`;
    });

    return svg + '</svg>';
  }

  // Lijngrafiek: reeksen = [{label, waarden:[]}], xLabels = []
  function lijnGrafiek(xLabels, reeksen, min, max) {
    const b = 320, h = 150, links = 26, onder = 22, boven = 8, rechts = 8;
    const lo = min === undefined ? 1 : min;
    const hi = max === undefined ? 5 : max;
    const n = xLabels.length;
    if (n === 0) return '<p class="muted klein">Nog geen meetmomenten.</p>';

    const x = i => links + (n === 1 ? (b - links - rechts) / 2 : i * (b - links - rechts) / (n - 1));
    const y = w => boven + (h - boven - onder) * (1 - (w - lo) / (hi - lo));

    let svg = `<svg class="chart" viewBox="0 0 ${b} ${h}" role="img">`;

    for (let w = lo; w <= hi; w++) {
      svg += `<line class="as" x1="${links}" y1="${rond(y(w), 1)}" x2="${b - rechts}" y2="${rond(y(w), 1)}" opacity=".5"/>`;
      svg += `<text x="4" y="${rond(y(w) + 3, 1)}">${w}</text>`;
    }

    reeksen.forEach((reeks, idx) => {
      const kleur = KLEUREN[idx % KLEUREN.length];
      const punten = reeks.waarden
        .map((w, i) => (w === null || w === undefined) ? null : [x(i), y(w)])
        .filter(Boolean);
      if (punten.length > 1) {
        svg += `<polyline class="lijn" stroke="${kleur}" points="${punten.map(p => p.map(v => rond(v, 1)).join(',')).join(' ')}"/>`;
      }
      punten.forEach(p => {
        svg += `<circle class="punt" fill="${kleur}" cx="${rond(p[0], 1)}" cy="${rond(p[1], 1)}"/>`;
      });
    });

    // Eerste en laatste label naar binnen uitlijnen, anders vallen ze buiten beeld.
    xLabels.forEach((label, i) => {
      const anker = n === 1 ? 'middle' : (i === 0 ? 'start' : (i === n - 1 ? 'end' : 'middle'));
      svg += `<text x="${rond(x(i), 1)}" y="${h - 6}" text-anchor="${anker}">${esc(label)}</text>`;
    });

    return svg + '</svg>';
  }

  function legenda(reeksen) {
    return '<div class="legenda">' + reeksen.map((r, i) =>
      `<span><i style="background:${KLEUREN[i % KLEUREN.length]}"></i>${esc(r.label)}</span>`
    ).join('') + '</div>';
  }

  return {
    $, $$, uid, esc, tekst, naam, kortenaam, initialen,
    vandaag, datumNL, datumKort, dagenTot, relatief, leeftijd, opDatum,
    rond, gemiddelde, klem,
    toast, modal, sluitModal, bevestig, download, formData, selectOpties,
    radar, lijnGrafiek, legenda, KLEUREN
  };
})();
