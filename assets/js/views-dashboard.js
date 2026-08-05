/* Dashboard: wat komt eraan, waar moet ik naar kijken. */

(function () {
  const U = App.util, S = App.store;

  function render() {
    const staat = S.get();
    const spelers = S.spelersGesorteerd();

    if (!spelers.length && !staat.trainingen.length && !staat.wedstrijden.length) {
      return welkom(staat);
    }

    return `
      <div class="paginakop">
        <div>
          <h1>${U.esc(staat.team.naam || 'Team')}</h1>
          <div class="sub">Seizoen ${U.esc(staat.team.seizoen)}${staat.team.trainer ? ' · ' + U.esc(staat.team.trainer) : ''}</div>
        </div>
        <div class="kop-acties">
          <button class="btn" data-actie="training-nieuw">Training plannen</button>
          <button class="btn" data-actie="wedstrijd-nieuw">Wedstrijd toevoegen</button>
        </div>
      </div>
      ${kpis(spelers)}
      <div class="grid grid-2 mb">${komendeTraining()}${komendeWedstrijd()}</div>
      <div class="grid grid-2 mb">${aandachtspunten(spelers)}${speelminuten(spelers)}</div>
      ${ontwikkelingPaneel(spelers)}`;
  }

  function welkom(staat) {
    return `
      <div class="paginakop"><div>
        <h1>Welkom in je trainersomgeving</h1>
        <div class="sub">Alles voor de ${U.esc(staat.team.naam || 'O17')} op één plek — en alleen op deze computer opgeslagen.</div>
      </div></div>

      <div class="grid grid-2 mb">
        <div class="paneel">
          <h2>Begin hier</h2>
          <ol class="klein" style="padding-left:1.1rem;line-height:1.9">
            <li>Vul je teamgegevens in bij <a href="#/instellingen">Instellingen</a>.</li>
            <li>Voer je selectie in bij <a href="#/spelers">Spelers</a> — met <em>Snel toevoegen</em> gaat dat in één keer.</li>
            <li>Leg per speler een <strong>nulmeting</strong> vast en spreek twee ontwikkeldoelen af.</li>
            <li>Plan je trainingen en bouw ze op uit de <a href="#/oefeningen">oefenstof</a>.</li>
            <li>Zet het wedstrijdprogramma klaar en bereid de eerste wedstrijd voor.</li>
          </ol>
        </div>
        <div class="paneel">
          <h2>Wat je hier bijhoudt</h2>
          <div class="klein" style="line-height:1.9">
            <div><strong>Ontwikkeling</strong> — beoordeling op techniek, inzicht, persoonlijkheid en snelheid, met verloop over het seizoen.</div>
            <div><strong>Trainingen</strong> — sessieopbouw in blokken, aanwezigheid, belasting over de week.</div>
            <div><strong>Wedstrijden</strong> — scouting, wedstrijdplan, opstelling, speelminuten en beoordelingen.</div>
            <div><strong>Oefenstof</strong> — ${App.seed.OEFENINGEN.length} oefeningen om mee te starten, aan te vullen met je eigen werk.</div>
          </div>
        </div>
      </div>

      <div class="rij">
        <button class="btn btn-primair" data-actie="speler-nieuw">Eerste speler toevoegen</button>
        <button class="btn" data-actie="spelers-import">Hele selectie invoeren</button>
      </div>`;
  }

  function kpis(spelers) {
    const fit = spelers.filter(s => s.status === 'fit').length;
    const geblesseerd = spelers.filter(s => s.status === 'blessure' || s.status === 'revalidatie').length;

    const percentages = spelers.map(s => S.aanwezigheidStats(s.id).percentage).filter(p => p !== null);
    const gemAanwezig = percentages.length ? Math.round(U.gemiddelde(percentages)) : null;

    const niveaus = spelers.map(s => S.huidigNiveau(s)).filter(n => n !== null);
    const gemNiveau = niveaus.length ? U.rond(U.gemiddelde(niveaus), 1) : null;

    const doelen = spelers.reduce((n, s) => n + S.openDoelen(s).length, 0);

    const kpi = (label, waarde, voet) => `<div class="paneel kpi">
      <div class="label">${label}</div><div class="waarde">${waarde}</div><div class="voet">${voet}</div></div>`;

    return `<div class="grid grid-4 mb">
      ${kpi('Selectie', spelers.length, `${fit} fit${geblesseerd ? ` · ${geblesseerd} geblesseerd` : ''}`)}
      ${kpi('Gem. aanwezigheid', gemAanwezig !== null ? gemAanwezig + '%' : '–', 'over alle trainingen')}
      ${kpi('Gem. niveau', gemNiveau !== null ? gemNiveau : '–', 'laatste TIPS-meting')}
      ${kpi('Lopende doelen', doelen, 'in de ontwikkelplannen')}
    </div>`;
  }

  function komendeTraining() {
    const t = S.eerstvolgende(S.get().trainingen);
    if (!t) {
      return `<div class="paneel"><h2>Volgende training</h2>
        <p class="klein muted">Niets gepland. <a href="#/trainingen">Plan een training</a>.</p></div>`;
    }
    const blokken = (t.blokken || []).map(b => {
      const fase = App.seed.FASES.find(f => f.waarde === b.fase) || App.seed.FASES[1];
      return `<div class="rij-tussen klein" style="padding:.25rem 0;border-bottom:1px solid var(--line)">
        <span><span style="color:${fase.kleur}">●</span> ${U.esc(b.naam)}</span>
        <span class="muted nowrap">${b.duur} min</span>
      </div>`;
    }).join('');

    return `<div class="paneel">
      <div class="paneel-kop">
        <h2>Volgende training</h2>
        <span class="badge blauw">${U.relatief(t.datum)}</span>
      </div>
      <div><strong>${U.esc(t.thema || 'Nog geen thema')}</strong></div>
      <div class="klein muted">${U.datumNL(t.datum, true)} · ${U.esc(t.tijd || '')} ${t.locatie ? '· ' + U.esc(t.locatie) : ''} · ${S.duurTraining(t)} min</div>
      ${t.doel ? `<p class="klein mt">${U.esc(t.doel)}</p>` : ''}
      <div class="mt">${blokken || '<p class="klein muted">Nog geen blokken ingedeeld.</p>'}</div>
      <div class="rij mt"><button class="btn btn-sm" data-actie="training-open" data-id="${t.id}">Openen</button></div>
    </div>`;
  }

  function komendeWedstrijd() {
    const w = S.eerstvolgende(S.get().wedstrijden.filter(x => !x.gespeeld));
    if (!w) {
      return `<div class="paneel"><h2>Volgende wedstrijd</h2>
        <p class="klein muted">Niets gepland. <a href="#/wedstrijden">Voeg het programma toe</a>.</p></div>`;
    }

    const opgesteld = Object.values(w.opstelling || {}).filter(Boolean).length;
    const check = [
      ['Scouting tegenstander', !!(w.scouting && (w.scouting.speelwijze || w.scouting.sterktes))],
      ['Wedstrijdplan', !!(w.plan && (w.plan.balbezit || w.plan.balverlies))],
      ['Opstelling compleet', opgesteld === 11],
      ['Wisselspelers aangewezen', (w.bank || []).length > 0]
    ].map(([label, klaar]) => `<div class="rij-tussen klein" style="padding:.25rem 0;border-bottom:1px solid var(--line)">
        <span>${label}</span>
        <span class="badge ${klaar ? 'groen' : 'geel'}">${klaar ? 'klaar' : 'openstaand'}</span>
      </div>`).join('');

    return `<div class="paneel">
      <div class="paneel-kop">
        <h2>Volgende wedstrijd</h2>
        <span class="badge blauw">${U.relatief(w.datum)}</span>
      </div>
      <div><strong>${w.thuis ? 'Thuis' : 'Uit'} tegen ${U.esc(w.tegenstander || 'onbekend')}</strong></div>
      <div class="klein muted">${U.datumNL(w.datum, true)} · ${U.esc(w.tijd || '')}${w.verzameltijd ? ' · verzamelen ' + U.esc(w.verzameltijd) : ''} · ${U.esc(w.formatie)}</div>
      <div class="mt">${check}</div>
      <div class="rij mt"><button class="btn btn-sm" data-actie="wedstrijd-open" data-id="${w.id}">Voorbereiden</button></div>
    </div>`;
  }

  function aandachtspunten(spelers) {
    const punten = [];

    spelers.forEach(sp => {
      if (sp.status === 'blessure' || sp.status === 'revalidatie' || sp.status === 'afwezig') {
        const st = App.seed.STATUSSEN.find(x => x.waarde === sp.status);
        punten.push({ prio: 1, speler: sp, tekst: st.label + (sp.statusToelichting ? ' — ' + sp.statusToelichting : ''), badge: 'rood' });
      }

      (sp.doelen || []).forEach(d => {
        if (d.status === 'open' && d.deadline) {
          const dagen = U.dagenTot(d.deadline);
          if (dagen !== null && dagen < 0) {
            punten.push({ prio: 2, speler: sp, tekst: 'Doel over evaluatiedatum: ' + d.titel, badge: 'geel' });
          } else if (dagen !== null && dagen <= 7) {
            punten.push({ prio: 3, speler: sp, tekst: 'Doel evalueren ' + U.relatief(d.deadline) + ': ' + d.titel, badge: 'blauw' });
          }
        }
      });

      const aanw = S.aanwezigheidStats(sp.id);
      if (aanw.geteld >= 4 && aanw.percentage !== null && aanw.percentage < 70) {
        punten.push({ prio: 2, speler: sp, tekst: 'Aanwezigheid ' + aanw.percentage + '% — even bespreken', badge: 'geel' });
      }

      const laatste = S.laatsteBeoordeling(sp);
      if (!laatste) {
        punten.push({ prio: 4, speler: sp, tekst: 'Nog geen nulmeting vastgelegd', badge: '' });
      } else {
        const dagen = U.dagenTot(laatste.datum);
        if (dagen !== null && dagen < -100) {
          punten.push({ prio: 3, speler: sp, tekst: 'Laatste beoordeling van ' + U.datumNL(laatste.datum), badge: '' });
        }
      }
    });

    punten.sort((a, b) => a.prio - b.prio);
    const stip = { rood: 'var(--gevaar)', geel: 'var(--warn)', blauw: 'var(--info)' };
    const lijst = punten.slice(0, 12).map(p => `
      <div class="klein" style="display:flex;gap:.5rem;padding:.35rem 0;border-bottom:1px solid var(--line)">
        <span style="color:${stip[p.badge] || 'var(--muted)'};line-height:1.4">●</span>
        <span><a href="#/speler/${p.speler.id}">${U.esc(U.naam(p.speler))}</a> <span class="dim">${U.esc(p.tekst)}</span></span>
      </div>`).join('');

    return `<div class="paneel">
      <div class="paneel-kop"><h2>Aandachtspunten</h2>${punten.length > 12 ? `<span class="klein muted">+${punten.length - 12} meer</span>` : ''}</div>
      ${lijst || '<p class="klein muted">Niets dat aandacht vraagt. Mooi zo.</p>'}
    </div>`;
  }

  function speelminuten(spelers) {
    const gespeeld = S.get().wedstrijden.filter(w => w.gespeeld);
    if (!gespeeld.length) {
      return `<div class="paneel"><h2>Speelminuten</h2>
        <p class="klein muted">Nog geen gespeelde wedstrijden. Zodra je minuten vastlegt zie je hier of de speeltijd eerlijk verdeeld is.</p></div>`;
    }

    const rijen = spelers
      .map(sp => ({ sp, stats: S.speelStats(sp.id) }))
      .sort((a, b) => b.stats.minuten - a.stats.minuten);

    const maxMin = Math.max(1, ...rijen.map(r => r.stats.minuten));
    const gemiddeld = U.gemiddelde(rijen.map(r => r.stats.minuten)) || 0;

    const html = rijen.slice(0, 20).map(({ sp, stats }) => {
      const klasse = stats.minuten < gemiddeld * 0.5 ? 'rood' : (stats.minuten < gemiddeld * 0.8 ? 'geel' : '');
      return `<div class="score-rij">
        <span><a href="#/speler/${sp.id}">${U.esc(U.kortenaam(sp))}</a></span>
        <span class="meter ${klasse}"><i style="width:${stats.minuten / maxMin * 100}%"></i></span>
        <span class="rechts klein">${stats.minuten}'</span>
      </div>`;
    }).join('');

    return `<div class="paneel">
      <div class="paneel-kop"><h2>Speelminuten</h2><span class="klein muted">gem. ${Math.round(gemiddeld)}' over ${gespeeld.length} duels</span></div>
      ${html}
      <p class="klein muted" style="margin:.6rem 0 0">Rood = ruim onder het teamgemiddelde. In de jeugd is speeltijd ontwikkeltijd.</p>
    </div>`;
  }

  function ontwikkelingPaneel(spelers) {
    const metOntwikkeling = spelers
      .map(sp => ({ sp, ontw: S.ontwikkeling(sp) }))
      .filter(x => x.ontw && x.ontw.totaal !== null)
      .sort((a, b) => b.ontw.totaal - a.ontw.totaal);

    if (!metOntwikkeling.length) {
      return `<div class="paneel">
        <h2>Ontwikkeling</h2>
        <p class="klein muted">Zodra spelers een tweede beoordeling hebben, zie je hier wie stijgt en wie stagneert.</p>
      </div>`;
    }

    const kolom = (titel, lijst) => `<div>
      <h3>${titel}</h3>
      ${lijst.map(({ sp, ontw }) => `<div class="rij-tussen klein" style="padding:.3rem 0;border-bottom:1px solid var(--line)">
        <a href="#/speler/${sp.id}">${U.esc(U.naam(sp))}</a>
        <span class="badge ${ontw.totaal > 0 ? 'groen' : (ontw.totaal < 0 ? 'rood' : '')}">${ontw.totaal > 0 ? '+' : ''}${U.rond(ontw.totaal, 1)}</span>
      </div>`).join('')}
    </div>`;

    const stijgers = metOntwikkeling.filter(x => x.ontw.totaal > 0).slice(0, 5);
    const dalers = metOntwikkeling.filter(x => x.ontw.totaal < 0).slice(-5).reverse();

    return `<div class="paneel">
      <div class="paneel-kop"><h2>Ontwikkeling sinds de vorige meting</h2></div>
      <div class="grid grid-2">
        ${kolom('Grootste groei', stijgers.length ? stijgers : [])}
        ${kolom('Stagnatie of terugval', dalers.length ? dalers : [])}
      </div>
      ${!stijgers.length && !dalers.length ? '<p class="klein muted">Iedereen staat stabiel ten opzichte van de vorige meting.</p>' : ''}
    </div>`;
  }

  App.views.dashboard = { render, acties: {} };
})();
