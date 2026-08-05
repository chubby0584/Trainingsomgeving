# Trainersomgeving O17

Een werkomgeving voor de jeugdtrainer van een O17-elftal: spelersontwikkeling,
trainingen, oefenstof en wedstrijdvoorbereiding op één plek.

De omgeving draait volledig in de browser. Geen server, geen account, geen
installatie — je opent `index.html` en je kunt aan de slag. Alle gegevens staan
in de opslag van jouw browser, op jouw computer.

## Starten

Dubbelklik op `index.html`, of open het bestand vanuit je browser.

Wil je het vanaf je telefoon of tablet gebruiken, zet de map dan online (bijvoorbeeld
via GitHub Pages) en open de URL. Zonder synchronisatie (zie hieronder) is de opslag
per apparaat en per browser: gegevens op je laptop verschijnen dan niet vanzelf op je
telefoon. Gebruik in dat geval de back-up (export/import) onder *Instellingen*.

## Op je telefoon installeren

De omgeving is een progressive web app: eenmaal online gezet, kun je 'm op je
beginscherm zetten alsof het een gewone app is.

- **Android (Chrome):** open de URL, tik op het menu (⋮) en kies *App installeren* of
  *Toevoegen aan startscherm*.
- **iPhone/iPad (Safari):** open de URL, tik op het deelicoon en kies *Zet op beginscherm*.

Daarna opent de omgeving in een eigen venster zonder browserbalk, met een eigen icoon,
en blijft hij ook zonder bereik werken — handig op een veld met slecht signaal. Alleen
het eerste bezoek heeft internet nodig om alles voor offline gebruik klaar te zetten.

## Synchroniseren tussen apparaten (optioneel)

Zonder verdere instellingen werkt alles lokaal, zoals hierboven beschreven. Wil je
dezelfde gegevens op je laptop én je telefoon, dan koppel je onder *Instellingen →
Online synchronisatie* een gratis [Supabase](https://supabase.com)-project. De
instellingenpagina bevat de stappen en de exacte SQL die je eenmalig moet uitvoeren.

Een paar dingen om te weten:

- **De browseropslag blijft leidend.** De app wacht nooit op het netwerk om te reageren;
  synchroniseren gebeurt op de achtergrond, een paar seconden na elke wijziging, en
  verder automatisch bij het openen van de app en elke vijf minuten.
- **Bij twijfel wordt nooit stilzwijgend overschreven.** Als twee apparaten allebei
  wijzigingen hebben die nog niet gedeeld zijn, krijg je expliciet de keuze welke versie
  moet blijven staan — met een aanbod om eerst een back-up te maken voordat je kiest.
- **Het is nog steeds gegevens van andermans kinderen.** Namen, geboortedata,
  oudercontacten, blessures en beoordelingen van minderjarigen vallen onder de AVG.
  Kies bij het aanmaken van je Supabase-project een EU-regio (bijv. Frankfurt), gebruik
  een eigen wachtwoord dat je nergens anders gebruikt, en informeer bij je club of zij
  hier beleid voor hebben.
- **Uitzetten kan altijd.** *Instellingen → Loskoppelen* verbreekt de koppeling; je
  lokale gegevens blijven gewoon staan.

## Wat zit erin

### Dashboard
Wat er als eerste aankomt: de volgende training met de sessie-opbouw, de volgende
wedstrijd met een voorbereidingschecklist, en een lijst aandachtspunten —
blessures, ontwikkeldoelen waarvan de evaluatiedatum nadert of verstreken is,
lage trainingsopkomst en spelers zonder recente beoordeling. Daaronder de
verdeling van speelminuten over de selectie en wie er sinds de vorige meting
gegroeid is of juist stilstaat.

### Spelers
Per speler een profiel, een ontwikkellijn, een ontwikkelplan en een logboek.

**Beoordelen** gebeurt op het TIPS-model: Techniek, Inzicht, Persoonlijkheid en
Snelheid, elk met zes concrete criteria op een schaal van 1 tot 5, waarbij 3 staat
voor "op O17-niveau". Elke beoordeling is een meetmoment met een datum. Bij een
nieuwe beoordeling worden de scores van de vorige meting alvast ingevuld, zodat je
alleen aanpast wat veranderd is.

Je ziet het resultaat als radar (laatste meting tegenover de nulmeting), als
verloop per pijler over het seizoen, en per criterium met de verschuiving ten
opzichte van de vorige keer.

**Het ontwikkelplan** bevat doelen met een pijler, een evaluatiedatum, afgesproken
acties en een evaluatieveld. Naderende en verstreken evaluatiedata komen
automatisch terug op het dashboard.

**Het logboek** is voor gesprekken, observaties en afspraken. **Statistieken**
toont aanwezigheid, speelminuten, basisplaatsen en wedstrijdcijfers, met een
overzicht per wedstrijd.

### Trainingen
Plan losse sessies of zet in één keer een aantal weken klaar met de weekplanner.
Een sessie bouw je op uit blokken (warming-up, hoofddeel, slotdeel) die je uit de
oefenstof haalt of zelf schrijft; de totale duur en de tijdsverdeling rekenen mee.
Aanwezigheid registreer je met één klik per speler, en je sluit af met een
evaluatie. Het belastingoverzicht toont drie weken trainingen en wedstrijden naast
elkaar, zodat je zware sessies niet vlak voor een wedstrijd plant.

Elke training is af te drukken als sessieformulier voor op het veld.

### Oefenstof
Vijfentwintig uitgewerkte oefeningen om mee te starten, verdeeld over warming-up,
positiespel, balbezit, omschakeling, verdedigen, afwerken, partijvormen,
standaardsituaties, fysiek en keeperstraining. Elke oefening heeft een
organisatiebeschrijving, coachpunten en variaties. Je kunt filteren op categorie
en thema, eigen oefeningen toevoegen, en een oefening direct als blok in een
geplande training zetten.

### Wedstrijden
Per wedstrijd drie tabbladen:

- **Voorbereiding** — scouting van de tegenstander (speelwijze, sterktes, zwaktes,
  opvallende spelers, standaardsituaties) naast je eigen wedstrijdplan voor
  balbezit, balverlies, omschakeling en standaardsituaties. Spelers die niet fit
  zijn worden hier automatisch bij elkaar gezet.
- **Opstelling** — een veld met vijf formaties (1-4-3-3, 1-4-2-3-1, 1-4-4-2,
  1-3-5-2 en 1-4-3-3 met dubbele 6). Klik op een positie om een speler te kiezen;
  wie niet in de basis staat kun je op de bank zetten.
- **Nabespreking** — uitslag, teamevaluatie, en per speler de speelminuten, een
  cijfer en een korte notitie. Die voeden de statistieken en het
  speelminutenoverzicht op het dashboard.

### Instellingen
Teamgegevens en speelwijze, een back-up downloaden of terugzetten, een
spelersoverzicht als CSV, en een afdrukbaar seizoensrapport met per speler de
TIPS-scores, sterke punten, ontwikkelpunten en de stand van het ontwikkelplan.

## Gegevens en back-ups

Alles staat in `localStorage` van je browser. Dat betekent:

- de gegevens blijven staan als je de browser sluit;
- ze staan **niet** in de cloud en zijn niet zichtbaar voor anderen;
- ze verdwijnen als je je browsergegevens wist, of als je een andere browser of
  een ander apparaat gebruikt.

Maak daarom regelmatig een back-up via *Instellingen → Back-up downloaden*. Dat
levert één JSON-bestand met alles erin, dat je met *Back-up terugzetten* weer
inleest — ook op een andere computer.

### Ingebouwde bescherming

Omdat er geen server meeleest, is er bewust op vier manieren voorkomen dat werk
stilzwijgend verloren gaat:

- **Opslaan meldt eerlijk of het lukte.** Als de opslagruimte vol is, verschijnt
  een rode foutmelding en géén "opgeslagen"-bevestiging. Elke plek in de app die
  iets bewaart, controleert het werkelijke resultaat voordat er succes wordt
  gemeld.
- **Beschadigde gegevens worden nooit overschreven.** Als de opgeslagen data bij
  het opstarten onleesbaar blijkt, wordt de originele inhoud apart bewaard en
  krijg je een melding met de mogelijkheid die ruwe data te downloaden — zodat er
  eventueel nog iets uit te redden valt.
- **Eén stap terug.** De versie van vóór je laatste opslagactie blijft bewaard.
  Ging er iets mis, dan zet je die terug via *Instellingen → Vorige versie
  terugzetten*.
- **Zichtbare back-upstatus.** In de zijbalk staat hoe lang geleden je voor het
  laatst een back-up hebt gedownload; die kleurt oranje na een week en rood na
  twee weken.

Dit vangt gebruikersfouten en browserproblemen op, maar het blijft één apparaat.
Een gewiste browser of een verloren telefoon is alleen te overleven met een
gedownloade back-up.

## Techniek

Losse HTML, CSS en JavaScript zonder afhankelijkheden of bouwstap. Grafieken zijn
met de hand getekende SVG.

```
index.html                   opbouw van de pagina
manifest.webmanifest         PWA-manifest (icoon, naam, installeerbaarheid)
sw.js                        service worker: cachet de eigen bestanden voor offline gebruik
assets/css/app.css           opmaak, inclusief afdrukweergave
assets/icons/                app-iconen in de benodigde formaten
assets/js/util.js            hulpfuncties: DOM, datums, opmaak, SVG-grafieken
assets/js/seed.js            TIPS-model, posities, formaties, start-oefenstof
assets/js/store.js           opslag en afgeleide berekeningen
assets/js/sync.js            optionele synchronisatie met Supabase
assets/js/views-*.js         de schermen
assets/js/app.js             router en afhandeling van acties
```

Een scherm registreert zichzelf als `App.views.<naam>` met een `render()` en een
map met acties. Klikken op een element met `data-actie` roept die actie aan; na
elke wijziging wordt het scherm opnieuw getekend vanuit de opgeslagen staat.

`sync.js` praat rechtstreeks met de REST- en Auth-API van Supabase via `fetch` —
geen externe bibliotheek, geen bouwstap. Er wordt telkens één rij (de volledige
staat als JSON) heen en weer gestuurd; `store.js` houdt een `gewijzigdOp`-tijdstempel
bij waarmee `sync.js` bepaalt welke kant nieuwer is, en de tabel heeft rijbeveiliging
zodat elk account uitsluitend de eigen rij kan lezen en schrijven.

## Uitgangspunten bij het gebruik

Leg aan het begin van het seizoen een nulmeting vast en herhaal die drie tot vier
keer per jaar. Zonder tweede meetmoment zegt een score weinig; het verloop wel.

Werk met maximaal twee of drie ontwikkeldoelen tegelijk, geformuleerd in zichtbaar
gedrag, met een afgesproken evaluatiedatum.

Kijk regelmatig naar het speelminutenoverzicht. In de jeugd is speeltijd
ontwikkeltijd — structureel weinig spelen is een ontwikkelvraag, geen
prestatievraag.
